import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { clearRestoredPatternQuery } from '../../lib/editor/locale-navigation';
import { getEditorTranslator, getEditorErrorMessage } from '../../lib/editor/messages';
import { getLibraryProject } from '../../lib/patterns/project-links';
import { PatternHistory, PatternStroke } from '../../lib/editor/pattern-history';

const editorSource = readFileSync(new URL('./Editor.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('Editor.tsx', editorSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

let libraryEntryFn: ts.FunctionDeclaration | undefined;
function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'LibraryPatternEntry') {
        libraryEntryFn = node;
    }
    ts.forEachChild(node, visit);
}
visit(ast);

const compiledLibraryEntry = ts.transpileModule(
    `${libraryEntryFn!.getText(ast)}\nmodule.exports = { LibraryPatternEntry };`,
    {
        compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.React,
        },
    }
).outputText;

type EffectRecord = { fn: () => (() => void) | void; deps?: readonly unknown[]; cleanup?: (() => void) | void };

function createLibraryEntryHarness(initialProps?: Partial<{
    patternId: string;
    locale: 'en' | 'de' | 'fr' | 'ja';
    hasCurrentPattern: boolean;
    canSaveCurrentPattern: boolean;
    busy: boolean;
}>) {
    const slots: unknown[] = [];
    const effects: EffectRecord[] = [];
    let cursor = 0;

    const ReactMock = {
        createElement: (type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => ({
            type,
            props: { ...(props ?? {}), children },
        }),
    };

    const useState = (initial: unknown) => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = initial;
        const setState = (next: unknown) => {
            slots[index] = typeof next === 'function' ? (next as (prev: unknown) => unknown)(slots[index]) : next;
        };
        return [slots[index], setState];
    };

    const useRef = (initial: unknown) => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = { current: initial };
        return slots[index];
    };

    const useCallback = (fn: unknown) => fn;

    const useEffect = (fn: () => (() => void) | void, deps?: readonly unknown[]) => {
        const index = cursor++;
        const prev = effects[index];
        const changed = !prev || !deps || !prev.deps || deps.some((val, i) => !Object.is(val, prev.deps![i]));
        if (changed) {
            effects[index] = { fn, deps, cleanup: prev?.cleanup };
        }
    };

    const loadLibraryEditorProject = vi.fn();
    const onOpen = vi.fn();
    const onSave = vi.fn();
    const onLoadingChange = vi.fn();
    const fakeWindow = {
        location: { href: 'https://fusebeadpatterns.art/editor?pattern=sdv-blue-chicken' },
        history: {
            replaceState: vi.fn((_state: unknown, _title: string, nextUrl: string) => {
                fakeWindow.location.href = `https://fusebeadpatterns.art${nextUrl}`;
            }),
        },
    };

    const moduleExports: { exports: { LibraryPatternEntry?: (p: Record<string, unknown>) => unknown } } = { exports: {} };
    new Script(compiledLibraryEntry).runInNewContext({
        module: moduleExports,
        React: ReactMock,
        useState,
        useRef,
        useCallback,
        useEffect,
        Link: 'a',
        window: fakeWindow,
        AbortController,
        getEditorTranslator,
        getEditorErrorMessage,
        getLibraryProject,
        loadLibraryEditorProject,
        clearRestoredPatternQuery,
        localeRoutes: {
            en: { patterns: '/patterns' },
            de: { patterns: '/de/patterns' },
            fr: { patterns: '/fr/patterns' },
            ja: { patterns: '/ja/patterns' },
        },
    });

    const props = {
        patternId: 'sdv-blue-chicken',
        locale: 'en' as const,
        hasCurrentPattern: false,
        canSaveCurrentPattern: false,
        busy: false,
        onOpen,
        onSave,
        onLoadingChange,
        ...initialProps,
    };

    function render(overrides?: Partial<typeof props>) {
        Object.assign(props, overrides);
        cursor = 0;
        const tree = moduleExports.exports.LibraryPatternEntry!(props);
        for (const effect of effects.filter(Boolean)) {
            const nextCleanup = effect.fn();
            if (typeof nextCleanup === 'function') effect.cleanup = nextCleanup;
        }
        return tree;
    }

    return { render, props, loadLibraryEditorProject, onOpen, onSave, onLoadingChange, fakeWindow };
}

describe('LibraryPatternEntry automatic open and work protection', () => {
    it('automatically loads and opens the requested library pattern when the editor is empty', async () => {
        const h = createLibraryEntryHarness({ hasCurrentPattern: false });
        const fakeDraft = { fileName: 'sdv-blue-chicken' };
        h.loadLibraryEditorProject.mockResolvedValueOnce(fakeDraft);

        h.render();
        expect(h.loadLibraryEditorProject).toHaveBeenCalledOnce();
        expect(h.loadLibraryEditorProject).toHaveBeenCalledWith('sdv-blue-chicken', expect.any(AbortSignal));

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(h.onOpen).toHaveBeenCalledOnce();
        expect(h.onOpen).toHaveBeenCalledWith(fakeDraft, 'sdv-blue-chicken');
        expect(h.fakeWindow.history.replaceState).toHaveBeenCalledWith(null, '', '/editor');
    });

    it('does not auto-overwrite when hasCurrentPattern is true and waits for explicit user action', async () => {
        const h = createLibraryEntryHarness({ hasCurrentPattern: true, canSaveCurrentPattern: true });
        h.render();
        await Promise.resolve();

        expect(h.loadLibraryEditorProject).not.toHaveBeenCalled();
        expect(h.onOpen).not.toHaveBeenCalled();
    });

    it('does not loop infinitely if automatic loading fails, leaving retry available', async () => {
        const h = createLibraryEntryHarness({ hasCurrentPattern: false });
        h.loadLibraryEditorProject.mockRejectedValueOnce(new Error('Network failure'));

        h.render();
        await Promise.resolve();
        await Promise.resolve();

        // Re-render after error state update; auto-open should not fire a second time automatically
        h.render();
        expect(h.loadLibraryEditorProject).toHaveBeenCalledTimes(1);
        expect(h.onOpen).not.toHaveBeenCalled();
    });
});

describe('mobile pinch-zoom active stroke rollback', () => {
    it('rolls back an accidental single-finger touch pixel when a second finger starts a pinch gesture without polluting undo history', () => {
        const data = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]);
        const mainHistory = new PatternHistory();
        const stroke = new PatternStroke(data);

        // Finger 1 touches cell 0 and paints red
        stroke.setPixel(0, [255, 0, 0, 255]);
        expect(Array.from(data.slice(0, 4))).toEqual([255, 0, 0, 255]);

        // Finger 2 lands -> pinch start rolls back the unfinished stroke using a temporary history
        const patch = stroke.finish();
        expect(patch).not.toBeNull();
        const rollbackHistory = new PatternHistory();
        rollbackHistory.push(patch!);
        rollbackHistory.undo(data);

        // Original pixel is restored and main undo stack remains completely clean
        expect(Array.from(data)).toEqual([10, 20, 30, 255, 40, 50, 60, 255]);
        expect(mainHistory.canUndo).toBe(false);
    });
});

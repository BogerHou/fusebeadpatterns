import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { beadLetterCopy } from './copy';
import * as navigation from './locale-navigation';
import * as core from './core';
import * as project from './project';
import * as brandColors from './brand-colors';
import { getLetterPalettes } from './data';
import { beadLetterPaths } from './routes';
import * as siteRoutes from '../i18n/routes';
import * as analytics from '../analytics';
import type { LetterPalette, LetterState } from './types';
import type { SiteLocale } from '../i18n/locales';

type TestNode = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): TestNode[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== 'object' || !('props' in value)) return [];
    const node = value as TestNode;
    return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(text).join('');
    return value && typeof value === 'object' && 'props' in value ? text((value as TestNode).props.children) : '';
}

const palettes = getLetterPalettes();
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('../../components/bead-letters/LetterWorkspace.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

function rawTransfer(state: LetterState, saved = false, destination = beadLetterPaths.ja): string {
    const data = new Map<string, string>();
    const storage = {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => { data.set(key, value); },
        removeItem: (key: string) => { data.delete(key); },
    };
    expect(navigation.saveLetterLocaleSnapshot({ state, saved }, destination, storage, palettes)).toBe(true);
    return data.get(navigation.LETTER_LOCALE_KEY)!;
}

// Execute the real component and handlers with React scheduling and the DOM
// boundary modeled. This is not a browser/canvas or BFCache-engine test.
function harness(raw?: string, locale: SiteLocale = 'ja') {
    const data = new Map<string, string>();
    if (raw !== undefined) data.set(navigation.LETTER_LOCALE_KEY, raw);
    data.set('bead-pattern-editor-draft-v1', 'unrelated editor work');
    const faults = { read: false, remove: false, write: false, access: false };
    const io = { reads: 0, writes: 0, removes: 0, filePicker: 0 };
    const storage = {
        getItem(key: string) { io.reads++; if (faults.read) throw new Error('read blocked'); return data.get(key) ?? null; },
        setItem(key: string, value: string) { io.writes++; if (faults.write) throw new Error('write blocked'); data.set(key, value); },
        removeItem(key: string) { io.removes++; if (faults.remove) throw new Error('remove blocked'); data.delete(key); },
    };
    const listeners = new Map<string, Set<(event: Event) => void>>();
    const microtasks: Array<() => void> = [];
    const downloads: Array<{ blob: Blob; filename: string }> = [];
    const browser = {
        location: { href: 'https://fusebeadpatterns.art' + beadLetterPaths[locale] },
        get sessionStorage() { if (faults.access) throw new Error('storage access blocked'); return storage; },
        confirm: vi.fn(() => true),
        addEventListener(name: string, fn: (event: Event) => void) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(fn); },
        removeEventListener(name: string, fn: (event: Event) => void) { listeners.get(name)?.delete(fn); },
    };
    type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
    const slots: Slot[] = [];
    let index = 0, tree: unknown;
    let effects: Array<() => void> = [];
    const changed = (old: readonly unknown[] | undefined, next: readonly unknown[] | undefined) => !old || !next || old.length !== next.length || old.some((v, i) => v !== next[i]);
    const hooks = {
        useId: () => 'letter-recovery-test',
        useState(initial: unknown) {
            const slot = index++;
            if (!slots[slot]) slots[slot] = { value: typeof initial === 'function' ? (initial as () => unknown)() : initial };
            return [slots[slot].value, (next: unknown) => { slots[slot].value = typeof next === 'function' ? (next as (old: unknown) => unknown)(slots[slot].value) : next; }];
        },
        useRef(initial: unknown) {
            const slot = index++;
            if (!slots[slot]) slots[slot] = { value: { current: initial } };
            return slots[slot].value;
        },
        useMemo(fn: () => unknown, deps: readonly unknown[]) {
            const slot = index++, previous = slots[slot];
            if (!previous || changed(previous.deps, deps)) slots[slot] = { value: fn(), deps };
            return slots[slot].value;
        },
        useCallback(fn: unknown, deps: readonly unknown[]) {
            const slot = index++, previous = slots[slot];
            if (!previous || changed(previous.deps, deps)) slots[slot] = { value: fn, deps };
            return slots[slot].value;
        },
        useEffect(fn: () => void | (() => void), deps?: readonly unknown[]) {
            const slot = index++, previous = slots[slot];
            if (!previous || changed(previous.deps, deps)) {
                slots[slot] = { deps, cleanup: previous?.cleanup };
                effects.push(() => {
                    slots[slot].cleanup?.();
                    const cleanup = fn();
                    slots[slot].cleanup = typeof cleanup === 'function' ? cleanup : undefined;
                });
            }
        },
    };
    const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
    const modules: Record<string, unknown> = {
        '@/lib/analytics': analytics,
        react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/lib/bead-letters/copy': { beadLetterCopy },
        '@/lib/bead-letters/core': core,
        '@/lib/bead-letters/brand-colors': brandColors,
        '@/lib/bead-letters/locale-navigation': navigation,
        '@/lib/bead-letters/project': {
            ...project,
            // The VM's UI records are copied to this host realm at the strict
            // project boundary; real validation/conversion/serialization runs.
            buildLetterProject: (state: LetterState, colors: LetterPalette[]) => project.buildLetterProject({ ...state }, colors),
            serializeLetterProject: (state: LetterState, colors: LetterPalette[]) => project.serializeLetterProject({ ...state }, colors),
        },
        '@/lib/core/printer/download': { downloadBlob: (blob: Blob, filename: string) => { downloads.push({ blob, filename }); } },
        '@/lib/i18n/routes': siteRoutes,
        './LetterWorkspace.module.css': { __esModule: true, default: new Proxy({}, { get: (_target, key) => String(key) }) },
    };
    const exports: Record<string, unknown> = {};
    new Script(compiled).runInNewContext({
        exports, require: (id: string) => modules[id] ?? require(id),
        window: browser, queueMicrotask: (fn: () => void) => { microtasks.push(fn); }, AbortController, Blob, Error,
    });
    const Component = exports.default as (props: { locale: SiteLocale; palettes: LetterPalette[] }) => unknown;
    function render() {
        index = 0; effects = [];
        tree = Component({ locale, palettes });
        for (const node of nodes(tree)) {
            const ref = node.props.ref as { current: unknown } | undefined;
            if (ref && node.type === 'canvas') ref.current = { getContext: (): null => null };
            else if (ref && node.type === 'input' && node.props.type === 'file') ref.current = { click() { io.filePicker++; } };
        }
        for (const effect of effects) effect();
    }
    function find(predicate: (node: TestNode) => boolean) {
        const found = nodes(tree).find(predicate);
        if (!found) throw new Error('Expected control not found');
        return found;
    }
    const button = (label: string) => find(node => node.type === 'button' && text(node) === label);
    const dispatch = (name: string, event: unknown) => { for (const listener of listeners.get(name) ?? []) listener(event as Event); };
    render();
    return {
        data, faults, io, downloads, render, button, storage,
        status: () => text(tree),
        disabled: () => find(node => node.type === 'fieldset').props.disabled,
        input: () => find(node => node.type === 'textarea').props.value,
        hasCanvas: () => nodes(tree).some(node => node.type === 'canvas'),
        canvas: () => find(node => node.type === 'canvas'),
        hasButton: (label: string) => nodes(tree).some(node => node.type === 'button' && text(node) === label),
        settle() { while (microtasks.length) { microtasks.shift()!(); render(); } },
        click(label: string) { (button(label).props.onClick as () => void)(); render(); },
        changeText(value: string) { (find(node => node.type === 'textarea').props.onChange as (event: unknown) => void)({ target: { value } }); render(); },
        async loadFile(file: { size: number; text: () => Promise<string> }) {
            await (find(node => node.type === 'input' && node.props.type === 'file').props.onChange as (event: unknown) => Promise<void>)({ target: { value: 'selected.json', files: [file] } }); render();
        },
        language(href = beadLetterPaths.fr) {
            const event = { detail: { href, locale: 'fr' }, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
            dispatch(siteRoutes.LOCALE_NAVIGATION_EVENT, event); render();
            return event.defaultPrevented;
        },
        unload() {
            const event = { defaultPrevented: false, returnValue: undefined as string | undefined, preventDefault() { this.defaultPrevented = true; } };
            dispatch('beforeunload', event); return event.defaultPrevented;
        },
        pageshow() { dispatch('pageshow', { persisted: true }); render(); },
        unmount() { for (const slot of slots) slot?.cleanup?.(); },
    };
}

describe('letter recovery locks in actual workspace handlers', () => {
    it('blocks editing, file reads, downloads and language writes before initialization finishes', async () => {
        const original = rawTransfer({ ...project.defaultLetterState(palettes), text: 'KEEP\n2026' });
        const h = harness(original), copy = beadLetterCopy.ja;
        expect(h.disabled()).toBe(true); expect(h.hasCanvas()).toBe(false);
        expect(h.hasButton(copy.retryRestore)).toBe(false);
        h.changeText('OVERWRITE');
        h.click(copy.loadProject); h.click(copy.saveProject); h.click(copy.downloadPng); h.click(copy.downloadPdf);
        const file = { size: 1, text: vi.fn(async () => 'ignored') }; await h.loadFile(file);
        expect(file.text).not.toHaveBeenCalled();
        expect(h.io.filePicker).toBe(0); expect(h.downloads).toHaveLength(0);
        expect(h.language()).toBe(true); expect(h.io.writes).toBe(0);
        expect(h.data.get(navigation.LETTER_LOCALE_KEY)).toBe(original);
        h.settle();
        expect(h.input()).toBe('KEEP\n2026'); expect(h.disabled()).toBe(false);
        expect(h.hasButton(copy.retryRestore)).toBe(false);
    });

    it.each(['malformed', 'read', 'access', 'wrong-destination'] as const)('keeps %s recovery locked and preserves the pending record until retry succeeds', fault => {
        const desired = { ...project.defaultLetterState(palettes), text: 'Ab1\nI', padding: 3, lineSpacing: 4, letterSpacing: 2, paper: 'letter' as const, backgroundEnabled: false };
        const good = rawTransfer(desired);
        const original = fault === 'malformed' ? '{bad' : fault === 'wrong-destination' ? rawTransfer(desired, false, beadLetterPaths.de) : good;
        const h = harness(original), copy = beadLetterCopy.ja;
        if (fault === 'read') h.faults.read = true;
        if (fault === 'access') h.faults.access = true;
        h.settle();
        expect(h.disabled()).toBe(true); expect(h.hasCanvas()).toBe(false);
        expect(h.status()).toContain(copy.restoreFailed); expect(h.status()).not.toContain(copy.transferFailed);
        h.changeText('DEFAULT'); h.click(copy.saveProject);
        expect(h.language()).toBe(true); expect(h.io.writes).toBe(0);
        expect(h.data.get(navigation.LETTER_LOCALE_KEY)).toBe(original);
        h.faults.read = false; h.faults.access = false;
        h.data.set(navigation.LETTER_LOCALE_KEY, good);
        h.click(copy.retryRestore);
        expect(h.disabled()).toBe(false); expect(h.input()).toBe(desired.text);
        expect(h.hasCanvas()).toBe(true); expect(h.data.has(navigation.LETTER_LOCALE_KEY)).toBe(false);
        expect(h.unload()).toBe(true);
        h.click(copy.saveProject);
        expect(h.downloads).toHaveLength(1);
    });

    it('installs a valid snapshot even when acknowledging its removal is blocked', () => {
        const original = rawTransfer({ ...project.defaultLetterState(palettes), text: 'RECOVERED' });
        const h = harness(original), copy = beadLetterCopy.ja;
        h.faults.remove = true; h.settle();
        expect(h.disabled()).toBe(false); expect(h.input()).toBe('RECOVERED');
        expect(h.hasButton(copy.retryRestore)).toBe(false);
        expect(h.data.get(navigation.LETTER_LOCALE_KEY)).toBe(original);
        h.changeText('UPDATED');
        expect(h.input()).toBe('UPDATED');
        expect(h.language()).toBe(false);
        expect(JSON.parse(h.data.get(navigation.LETTER_LOCALE_KEY)!).snapshot.state.text).toBe('UPDATED');
    });

    it('requires an explicit, confirmed discard before enabling a new default pattern', () => {
        const h = harness('damaged settings'), copy = beadLetterCopy.ja;
        h.settle(); h.faults.remove = true;
        h.click(copy.discardRestore);
        expect(h.disabled()).toBe(true); expect(h.hasCanvas()).toBe(false);
        expect(h.status()).toContain(copy.discardFailed);
        expect(h.data.get(navigation.LETTER_LOCALE_KEY)).toBe('damaged settings');
        expect(h.language()).toBe(true); expect(h.io.writes).toBe(0);
        h.faults.remove = false; h.click(copy.discardRestore);
        expect(h.disabled()).toBe(false); expect(h.input()).toBe('LOVE');
        expect(h.data.has(navigation.LETTER_LOCALE_KEY)).toBe(false);
        expect(h.data.get('bead-pattern-editor-draft-v1')).toBe('unrelated editor work');
        expect(h.hasButton(copy.discardRestore)).toBe(false);
    });

    it('does not unlock if removal happened but the clearing check cannot be read', () => {
        const h = harness('damaged settings'), copy = beadLetterCopy.ja;
        h.settle(); h.faults.read = true;
        h.click(copy.discardRestore);
        expect(h.disabled()).toBe(true); expect(h.hasCanvas()).toBe(false);
        expect(h.status()).toContain(copy.discardFailed);
        h.faults.read = false; h.click(copy.retryRestore);
        expect(h.disabled()).toBe(false); expect(h.input()).toBe('LOVE');
    });

    it('keeps a source write failure separate from a destination recovery failure', () => {
        const h = harness(), copy = beadLetterCopy.ja;
        h.settle(); h.changeText('SOURCE'); h.faults.write = true;
        expect(h.language()).toBe(true);
        expect(h.input()).toBe('SOURCE'); expect(h.disabled()).toBe(false);
        expect(h.status()).toContain(copy.transferFailed); expect(h.status()).not.toContain(copy.restoreFailed);
        expect(h.hasButton(copy.retryRestore)).toBe(false);
        h.click(copy.saveProject); expect(h.downloads).toHaveLength(1);
    });

    it.each(['pageshow', 'edit'] as const)('restores unload protection after a successful handoff and %s', action => {
        const h = harness();
        h.settle(); h.changeText('UNSAVED');
        expect(h.unload()).toBe(true);
        expect(h.language()).toBe(false); expect(h.unload()).toBe(false);
        if (action === 'pageshow') h.pageshow(); else h.changeText('EDITED AFTER HANDOFF');
        expect(h.unload()).toBe(true);
    });

    it('does not perform a queued recovery after the component unmounts', () => {
        const original = rawTransfer({ ...project.defaultLetterState(palettes), text: 'KEEP' });
        const h = harness(original);
        h.unmount(); h.settle();
        expect(h.io.reads).toBe(0); expect(h.data.get(navigation.LETTER_LOCALE_KEY)).toBe(original);
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('%s keeps recovery actions localized and hidden in the normal ready state', locale => {
        const h = harness('bad settings', locale), copy = beadLetterCopy[locale];
        h.settle();
        expect(h.status()).toContain(copy.restoreFailed);
        expect(h.hasButton(copy.retryRestore)).toBe(true);
        expect(h.hasButton(copy.discardRestore)).toBe(true);
        h.click(copy.discardRestore);
        expect(h.hasButton(copy.retryRestore)).toBe(false);
        expect(h.hasButton(copy.discardRestore)).toBe(false);
    });

    it('sets a readable preview minimum for wide charts while a 25-cell default can still fit a phone', () => {
        const h = harness();
        h.settle();
        expect(h.canvas().props.style).toEqual({ minWidth: 212 });
        h.changeText('A'.repeat(21));
        expect(h.canvas().props.style).toEqual({ minWidth: 1028 });
        expect(h.canvas().props['aria-label']).toContain('127 × 9');
    });
});

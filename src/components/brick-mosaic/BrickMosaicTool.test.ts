import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import * as core from '../../lib/brick-mosaic/core';
import * as project from '../../lib/brick-mosaic/project';
import * as transfer from '../../lib/brick-mosaic/transfer';
import * as catalog from '../../lib/brick-mosaic/catalog';
import * as copy from '../../lib/brick-mosaic/copy';
import * as exportsModule from '../../lib/brick-mosaic/export';
import * as pixelCore from '../../lib/pixel-grid/core';
import * as localeRoutes from '../../lib/i18n/routes';
import { brickPaths } from '../../lib/brick-mosaic/routes';
import * as analytics from '../../lib/analytics';

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
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => { resolve = done; });
    return { promise, resolve };
}
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('./BrickMosaicTool.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const labels = copy.brickCopy.en;

/** Execute production handlers; only React scheduling, canvas, decoder and download are modeled.
 * This does not prove a real browser's canvas rendering, BFCache or image decoder behavior.
 */
function harness(faults = { access: false, read: false, remove: false }) {
    const measured = { generated: 0, exported: vi.fn() };
    const data = new Map<string, string>([['unrelated-editor-key', 'keep user work']]);
    const io = { filePickers: 0, reads: 0, writes: 0, removes: 0, closedBitmaps: 0 };
    const storage = {
        getItem(key: string) { io.reads++; if (faults.read) throw new Error('storage read denied'); return data.get(key) ?? null; },
        setItem(key: string, value: string) { io.writes++; data.set(key, value); },
        removeItem(key: string) { io.removes++; if (faults.remove) throw new Error('storage removal denied'); data.delete(key); },
    };
    const listeners = new Map<string, Set<(event: unknown) => void>>();
    const microtasks: Array<() => void> = [];
    const downloads: Array<{ blob: Blob; filename: string }> = [];
    const browser = {
        location: { href: 'https://fusebeadpatterns.art' + brickPaths.en },
        get sessionStorage() { if (faults.access) throw new Error('storage getter denied'); return storage; },
        confirm: vi.fn(() => true),
        addEventListener(name: string, fn: (event: unknown) => void) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(fn); },
        removeEventListener(name: string, fn: (event: unknown) => void) { listeners.get(name)?.delete(fn); },
    };
    const fakeDocument = {
        addEventListener() {}, removeEventListener() {},
        createElement: () => ({ width: 0, height: 0, getContext: () => ({
            drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray([255, 0, 0, 255]) }),
        }) }),
    };
    const captured = new Set<number>();
    const fakeCanvas = {
        width: 0, height: 0, getContext: (): null => null,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 384, height: 384 }), focus() {},
        setPointerCapture: (id: number) => { captured.add(id); },
        hasPointerCapture: (id: number) => captured.has(id),
        releasePointerCapture: (id: number) => { captured.delete(id); },
    };
    type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
    const slots: Slot[] = [];
    let index = 0, tree: unknown, effects: Array<() => void> = [];
    const changed = (old: readonly unknown[] | undefined, next: readonly unknown[] | undefined) => !old || !next || old.length !== next.length || old.some((value, n) => value !== next[n]);
    const hooks = {
        useId: () => 'brick-real-handlers',
        useState(initial: unknown) {
            const n = index++; if (!slots[n]) slots[n] = { value: typeof initial === 'function' ? (initial as () => unknown)() : initial };
            return [slots[n].value, (next: unknown) => { slots[n].value = typeof next === 'function' ? (next as (value: unknown) => unknown)(slots[n].value) : next; }];
        },
        useRef(initial: unknown) { const n = index++; if (!slots[n]) slots[n] = { value: { current: initial } }; return slots[n].value; },
        useMemo(fn: () => unknown, deps: readonly unknown[]) {
            const n = index++, previous = slots[n]; if (!previous || changed(previous.deps, deps)) slots[n] = { value: fn(), deps }; return slots[n].value;
        },
        useCallback(fn: unknown, deps: readonly unknown[]) {
            const n = index++, previous = slots[n]; if (!previous || changed(previous.deps, deps)) slots[n] = { value: fn, deps }; return slots[n].value;
        },
        useEffect(fn: () => void | (() => void), deps?: readonly unknown[]) {
            const n = index++, previous = slots[n];
            if (!previous || changed(previous.deps, deps)) {
                slots[n] = { deps, cleanup: previous?.cleanup };
                effects.push(() => { slots[n].cleanup?.(); const cleanup = fn(); slots[n].cleanup = typeof cleanup === 'function' ? cleanup : undefined; });
            }
        },
    };
    const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
    const modules: Record<string, unknown> = {
        '../../lib/analytics': { ...analytics, trackToolEvent: measured.exported,
            createToolGenerationTracker: (tool: analytics.MeasuredTool) => { const tracker = analytics.createToolGenerationTracker(tool), record = tracker.record; tracker.record = () => { measured.generated++; return record(); }; return tracker; } },
        react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx },
        '../../lib/i18n/routes': localeRoutes,
        '../../lib/brick-mosaic/catalog': catalog, '../../lib/brick-mosaic/copy': copy,
        '../../lib/brick-mosaic/core': core, '../../lib/brick-mosaic/project': project,
        '../../lib/brick-mosaic/transfer': transfer, '../../lib/brick-mosaic/export': exportsModule,
        '../../lib/pixel-grid/core': pixelCore,
        '../../lib/core/printer/download': { downloadBlob: (blob: Blob, filename: string) => { downloads.push({ blob, filename }); } },
        './BrickMosaicTool.module.css': { __esModule: true, default: new Proxy({}, { get: (_target, key) => String(key) }) },
    };
    const exports: Record<string, unknown> = {};
    new Script(compiled).runInNewContext({
        exports, require: (id: string) => modules[id] ?? require(id), window: browser, document: fakeDocument,
        queueMicrotask: (callback: () => void) => { microtasks.push(callback); },
        AbortController, Blob, URL, Error, TextEncoder, Uint8Array, Uint8ClampedArray, setTimeout, clearTimeout,
        createImageBitmap: async () => ({ width: 1, height: 1, close() { io.closedBitmaps++; } }),
    });
    const Component = exports.default as (props: { locale: string }) => unknown;
    function render() {
        index = 0; effects = []; tree = Component({ locale: 'en' });
        for (const node of nodes(tree)) {
            const ref = node.props.ref as { current: unknown } | undefined;
            if (ref && node.type === 'canvas') ref.current = fakeCanvas;
            if (ref && node.type === 'input' && node.props.type === 'file') ref.current = { click() { io.filePickers++; } };
        }
        for (const effect of effects) effect();
    }
    function find(predicate: (node: TestNode) => boolean) {
        const result = nodes(tree).find(predicate); if (!result) throw new Error('Expected node not found'); return result;
    }
    const button = (label: string) => find(node => node.type === 'button' && text(node) === label);
    const canvas = () => find(node => node.type === 'canvas');
    function click(label: string) { (button(label).props.onClick as () => void)(); render(); }
    function dispatch(name: string, event: unknown) { for (const callback of listeners.get(name) ?? []) callback(event); render(); }
    function pointer(kind: 'onPointerDown' | 'onPointerMove' | 'onPointerUp', x: number, y: number, pointerId = 1) {
        (canvas().props[kind] as (event: unknown) => void)({ button: 0, pointerId, currentTarget: fakeCanvas, clientX: x * 12 + 6, clientY: y * 12 + 6, preventDefault() {} }); render();
    }
    render();
    return {
        data, faults, io, downloads, render, button, click, canvas, pointer, measured,
        status: () => text(tree), locked: () => find(node => node.type === 'fieldset').props.disabled,
        hasPending: () => nodes(tree).some(node => node.props.role === 'alert'),
        source: () => nodes(tree).find(node => typeof node.type === 'function' && node.props.source)?.props.source,
        settle() { while (microtasks.length) { microtasks.shift()!(); render(); } },
        async load(file: { size: number; text?: () => Promise<string>; arrayBuffer?: () => Promise<ArrayBuffer>; type?: string }, image = false) {
            const input = find(node => node.type === 'input' && node.props.type === 'file' && String(node.props.accept).startsWith(image ? 'image/' : 'application/json'));
            await (input.props.onChange as (event: unknown) => Promise<void>)({ target: { value: image ? 'selected.png' : 'selected.json', files: [file] } }); render();
        },
        language(href = brickPaths.ja) {
            const event = { detail: { href, locale: 'ja' }, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
            dispatch(localeRoutes.LOCALE_NAVIGATION_EVENT, event); return event.defaultPrevented;
        },
        async savedModel() { click(labels.save); return project.parseMosaicProject(await downloads.at(-1)!.blob.text(), catalog.brickCatalog); },
        unmount() { for (const slot of slots) slot.cleanup?.(); },
    };
}

describe('real brick workspace import, recovery and history handlers', () => {
    it('does not count blank/default or imported projects, and counts the first real edit once', async () => {
        const app = harness(); app.settle();
        expect(app.measured.generated).toBe(0); expect(app.measured.exported).not.toHaveBeenCalled();
        const model = core.createMosaic(32, 32, 32, catalog.brickCatalog);
        model.cells[0] = catalog.brickCatalog.colors[0].id;
        const raw = project.serializeMosaicProject(model, catalog.brickCatalog);
        await app.load({ size: raw.length, text: async () => raw });
        expect(app.measured.generated).toBe(0);
        app.pointer('onPointerDown', 1, 0); app.pointer('onPointerMove', 2, 0); app.pointer('onPointerUp', 2, 0);
        app.pointer('onPointerDown', 3, 0); app.pointer('onPointerUp', 3, 0);
        expect(app.measured.generated).toBe(1);
        app.click(labels.save);
        expect(app.downloads).toHaveLength(1);
        expect(app.measured.exported).toHaveBeenCalledExactlyOnceWith({ name: 'tool_export', tool: 'brick_mosaic', format: 'project' });
    });
    it('loads an image onto a blank workspace without leaving the busy lock, then converts and exports the current model', async () => {
        const app = harness(); app.settle();
        const png = await pixelCore.encodePng(pixelCore.createGrid(1, 1, [255, 0, 0, 255]));
        await app.load({ size: png.length, type: 'image/png', arrayBuffer: async () => png.buffer }, true);
        expect(app.locked()).toBe(false); expect(app.source()).toMatchObject({ width: 1, height: 1 }); expect(app.io.closedBitmaps).toBe(1);
        expect(app.status()).toContain(labels.sourceLoaded);
        app.click(labels.convert); await new Promise(resolve => setTimeout(resolve, 0)); await Promise.resolve(); app.render();
        expect(app.locked()).toBe(false); expect(app.hasPending()).toBe(false);
        const model = await app.savedModel(); expect(core.collectMosaicMaterials(model, catalog.brickCatalog).total).toBe(1024);
        app.unmount();
    });
    it('opens a valid project onto a blank workspace, updates dimensions and releases busy', async () => {
        const app = harness(); app.settle();
        const model = core.createMosaic(3, 2, 48, catalog.brickCatalog, [catalog.brickCatalog.colors[0].id, null, null, null, null, catalog.brickCatalog.colors[1].id]);
        const raw = project.serializeMosaicProject(model, catalog.brickCatalog);
        await app.load({ size: raw.length, text: async () => raw });
        expect(app.locked()).toBe(false); expect(app.hasPending()).toBe(false); expect(app.canvas().props.style).toEqual({ width: 36, height: 24 });
        expect(await app.savedModel()).toEqual(model); app.unmount();
    });
    it('keeps the exact dirty model when an inline project replacement is declined', async () => {
        const app = harness(); app.settle(); app.pointer('onPointerDown', 0, 0); app.pointer('onPointerUp', 0, 0);
        const before = core.createMosaic(32, 32, 32, catalog.brickCatalog); before.cells[0] = catalog.brickCatalog.colors[4].id;
        const replacement = core.createMosaic(2, 1, 48, catalog.brickCatalog, [catalog.brickCatalog.colors[0].id, catalog.brickCatalog.colors[0].id]);
        const raw = project.serializeMosaicProject(replacement, catalog.brickCatalog);
        await app.load({ size: raw.length, text: async () => raw });
        expect(app.hasPending()).toBe(true); expect(app.locked()).toBe(true);
        app.click(labels.keepCurrent); expect(app.locked()).toBe(false); expect(await app.savedModel()).toEqual(before); app.unmount();
    });
    it.each(['access', 'read', 'remove'] as const)('ignores a failed %s transfer, allows local edits and blocks language overwrite', async failure => {
        const faults = { access: false, read: false, remove: false }; faults[failure] = true;
        if (failure === 'remove') faults.read = true;
        const app = harness(faults); app.data.set(transfer.BRICK_LOCALE_KEY, 'retained unconsumed record'); app.settle();
        expect(app.locked()).toBe(true); app.click(labels.discard); expect(app.locked()).toBe(false);
        // The explicit discard may remove this feature's record when removal
        // succeeds but its verification read is denied. Other keys stay intact.
        const retained = failure === 'read' ? undefined : 'retained unconsumed record';
        expect(app.data.get(transfer.BRICK_LOCALE_KEY)).toBe(retained);
        app.pointer('onPointerDown', 1, 0); app.pointer('onPointerUp', 1, 0);
        expect(core.collectMosaicMaterials(await app.savedModel(), catalog.brickCatalog).total).toBe(1);
        expect(app.language()).toBe(true); expect(app.io.writes).toBe(0);
        expect(app.data.get(transfer.BRICK_LOCALE_KEY)).toBe(retained); expect(app.data.get('unrelated-editor-key')).toBe('keep user work'); app.unmount();
    });
    it('cancels a pending file read, so a late valid project cannot replace the drawing or restore busy', async () => {
        const app = harness(); app.settle(); const file = deferred<string>();
        const loading = app.load({ size: 1024, text: () => file.promise }); app.render(); expect(app.locked()).toBe(true);
        app.click(labels.cancel); expect(app.locked()).toBe(false);
        const other = core.createMosaic(1, 1, 48, catalog.brickCatalog, [catalog.brickCatalog.colors[0].id]);
        file.resolve(project.serializeMosaicProject(other, catalog.brickCatalog)); await loading;
        expect(app.locked()).toBe(false); expect(app.hasPending()).toBe(false); expect(await app.savedModel()).toEqual(core.createMosaic(32, 32, 32, catalog.brickCatalog)); app.unmount();
    });
    it('commits a multi-cell pointer stroke as one undo step and keeps its materials synchronized', async () => {
        const app = harness(); app.settle();
        app.pointer('onPointerDown', 0, 0); app.pointer('onPointerMove', 2, 0); app.pointer('onPointerUp', 2, 0);
        expect(app.button(labels.undo).props.disabled).toBe(false);
        const painted = await app.savedModel(); expect(core.collectMosaicMaterials(painted, catalog.brickCatalog).total).toBe(3);
        app.click(labels.undo); const blank = await app.savedModel(); expect(core.collectMosaicMaterials(blank, catalog.brickCatalog).total).toBe(0);
        expect(app.button(labels.undo).props.disabled).toBe(true); expect(app.button(labels.redo).props.disabled).toBe(false);
        app.click(labels.redo); expect(await app.savedModel()).toEqual(painted); app.unmount();
    });
});

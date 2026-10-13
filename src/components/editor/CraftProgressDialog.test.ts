import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { Color } from '../../lib/core/model/color/color.model';
import { Palette, PaletteEntry } from '../../lib/core/model/palette/palette.model';
import { CRAFT_PROGRESS_MAX_FILE_BYTES, CraftProgressError, createCraftMarks, exportCraftProgress, getCraftColorKey,
    importCraftProgress, setCraftCells, type CraftPattern } from '../../lib/editor/craft-progress';
import { CraftProgressHistory, CraftProgressSaveQueue, craftLine, craftRectangle } from '../../lib/editor/craft-progress-ui-state';
import { getCraftProgressCopy } from '../../lib/editor/craft-progress-copy';

// Execute actual UI callbacks with modeled React scheduling/pointer geometry.
// Saved file validation, immutable cells, packed history and serial writes are
// the production implementations, with no second progress algorithm as oracle.
const source = ts.createSourceFile('CraftProgressDialog.tsx', readFileSync(new URL('./CraftProgressDialog.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const functions = new Map<string, ts.FunctionDeclaration>(), declarations = new Map<string, ts.VariableDeclaration>();
function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) declarations.set(node.name.text, node);
    ts.forEachChild(node, visit);
}
visit(source);
const names = ['saveNow', 'changed', 'finishStroke', 'close', 'closeWithoutSaving', 'startNew', 'apply', 'undo', 'redo',
    'canMark', 'indices', 'point', 'pointerDown', 'pointerMove', 'pointerEnd', 'ensureCursorVisible', 'key', 'upload'];
const body = ['CELL', 'startQueue', 'readProgress'].map(name => `const ${declarations.get(name)!.getText(source)};`).join('\n') +
    names.map(name => functions.get(name)!.getText(source)).join('\n');
const compiled = ts.transpileModule(body + '\nmodule.exports={startQueue,readProgress,saveNow,changed,finishStroke,close,startNew,apply,undo,redo,pointerDown,pointerMove,pointerEnd,key,upload};',
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const signature = 'a'.repeat(64);
function deferred<T>() {
    let resolve!: (value: T) => void, reject!: (error: Error) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject };
}
function patternFixture(): CraftPattern {
    const entries = [new PaletteEntry('Red', new Color(255, 0, 0, 255)), new PaletteEntry('Black', new Color(0, 0, 0, 255))];
    entries.forEach((entry, i) => { entry.ref = `P0${i + 1}`; entry.prefix = ''; entry.symbol = String(i); });
    const pixels = new Uint8ClampedArray(58 ** 2 * 4);
    pixels.set([255, 0, 0, 255], 0); pixels.set([0, 0, 0, 255], 4); pixels.set([255, 0, 0, 255], 8);
    pixels.set([0, 0, 0, 255], 58 * 4); pixels.set([1, 2, 3, 128], (29 * 58 + 29) * 4);
    return { width: 58, height: 58, boardSize: 29, pixels, palettes: [new Palette('Perler Midi', entries)], paletteIds: ['perler'] };
}
type Controls = {
    startQueue(id: string, epoch: number): void; readProgress(): Promise<void>; saveNow(): void; changed(marks: Uint8Array): void;
    finishStroke(): void; close(): Promise<void>; startNew(): void; apply(marks: Uint8Array): void; undo(): void; redo(): void;
    pointerDown(event: unknown): void; pointerMove(event: unknown): void; pointerEnd(event: unknown): void; key(event: unknown): void; upload(file: File): Promise<void>;
};
function harness(options: { write?: (id: string, raw: string) => Promise<void>; load?: () => Promise<string | null>; phase?: string; codecFails?: boolean } = {}) {
    const pattern = patternFixture(), original = pattern.pixels.slice(), marks = createCraftMarks(pattern), history = new CraftProgressHistory(marks.length);
    const refs: Record<string, { current: unknown }> = {};
    for (const name of body.matchAll(/\b(\w+(?:Ref|Epoch))\.current/g)) refs[name[1]] ??= { current: null };
    Object.assign(refs, { marksRef: { current: marks }, historyRef: { current: history }, queuedMarksRef: { current: marks },
        dirtyRef: { current: false }, exportedRef: { current: null }, patternIdRef: { current: signature },
        alive: { current: true }, loadEpoch: { current: 1 }, fileEpoch: { current: 0 }, closingRef: { current: false },
        suppressCleanupWrite: { current: false }, queueRef: { current: null }, strokeRef: { current: null }, panRef: { current: null } });
    const viewport = { scrollLeft: 0, scrollTop: 0, clientWidth: 100, clientHeight: 100 };
    refs.viewportRef = { current: viewport }; refs.gridRef = { current: { focus: vi.fn() } };
    refs.canvasRef = { current: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 348, height: 348 }) } };
    const write = vi.fn(options.write ?? (async () => {})), load = vi.fn(options.load ?? (async () => null));
    refs.storeRef = { current: { save: write, load } };
    const state: Record<string, unknown> = { phase: options.phase ?? 'ready', closing: false, importing: false, saveStatus: 'idle', message: null, closeFailed: false, historyRevision: 0 };
    const setters: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const name of body.matchAll(/\b(set[A-Z]\w+)\(/g)) {
        const key = name[1].slice(3); const property = key[0].toLowerCase() + key.slice(1);
        setters[name[1]] ??= vi.fn((value: unknown) => {
            state[property] = typeof value === 'function' ? value(state[property] ?? 0) : value;
        });
    }
    const copy = getCraftProgressCopy('en'), onClose = vi.fn(), loaded = { exports: {} };
    const scope = { module: loaded, ...refs, ...setters, pattern, copy, onClose, boardX: 0, boardY: 0, mode: 'mark', colorKey: null as string | null,
        cursor: { x: 0, y: 0 }, useCallback: (fn: unknown) => fn, craftPatternId: async () => signature,
        createCraftMarks, exportCraftProgress: options.codecFails ? () => { throw new Error('Export failed'); } : exportCraftProgress,
        importCraftProgress, setCraftCells, getCraftColorKey, CraftProgressError, CraftProgressHistory, CraftProgressSaveQueue, craftLine, craftRectangle,
        CRAFT_PROGRESS_MAX_FILE_BYTES, Error, DOMException, window: { confirm: vi.fn(() => true) },
        get phase() { return state.phase; }, get enabled() { return state.phase === 'ready' && !state.closing && !state.importing; },
    };
    new Script(compiled).runInNewContext(scope);
    const controls = loaded.exports as Controls; controls.startQueue(signature, 1);
    function pointer(x: number, y: number, shiftKey = false) {
        return { clientX: x * 12 + 6, clientY: y * 12 + 6, pointerId: 7, button: 0, isPrimary: true, shiftKey,
            preventDefault: vi.fn(), currentTarget: { setPointerCapture: vi.fn() } };
    }
    return { controls, refs, state, scope, onClose, copy, pattern, original, marks, history, write, load, viewport, pointer,
        current: () => refs.marksRef.current as Uint8Array, queue: () => refs.queueRef.current as CraftProgressSaveQueue };
}

describe('placement UI cells, filtering and reversible changes', () => {
    it('marks a drag line in one undo step, ignores empty cells, and preserves original RGBA/materials', async () => {
        const h = harness(); h.controls.pointerDown(h.pointer(0, 0)); h.controls.pointerMove(h.pointer(3, 0)); h.controls.pointerEnd(h.pointer(3, 0));
        expect([...h.current().subarray(0, 4)]).toEqual([1, 1, 1, 0]); expect(h.history.canUndo).toBe(true);
        h.controls.undo(); expect(h.current().some(Boolean)).toBe(false);
        h.controls.redo(); expect([...h.current().subarray(0, 4)]).toEqual([1, 1, 1, 0]);
        await h.queue().flush(); expect(h.pattern.pixels).toEqual(h.original);
        expect(importCraftProgress(h.write.mock.calls.at(-1)![1], signature, h.pattern)).toEqual(h.current());
    });
    it('keeps Shift rectangles reversible and changes only the selected color within the selected board', () => {
        const h = harness(); h.scope.colorKey = '255,0,0';
        h.controls.pointerDown(h.pointer(0, 0, true)); h.controls.pointerMove(h.pointer(1, 1, true)); h.controls.pointerEnd(h.pointer(1, 1, true));
        expect(h.current()[0]).toBe(1); expect(h.current()[1]).toBe(0); expect(h.current()[58]).toBe(0);
        expect(h.current()[29 * 58 + 29]).toBe(0); h.controls.undo(); expect(h.current().some(Boolean)).toBe(false);
        h.controls.pointerDown(h.pointer(1, 0)); expect(h.state.message).toBe(h.copy.filteredCell);
        h.controls.pointerDown(h.pointer(4, 0)); expect(h.state.message).toBe(h.copy.emptyCell);
    });
    it('toggles the keyboard cursor, blocks transparent/filtered cells and scrolls arrow focus into view', () => {
        const h = harness(), event = (key: string) => ({ key, preventDefault: vi.fn() });
        // Native focus can scroll a large grid to its center. Space must reveal
        // the actual initial cell before changing its placement mark.
        h.viewport.scrollTop = 175; h.viewport.scrollLeft = 175;
        h.controls.key(event(' ')); expect(h.current()[0]).toBe(1);
        expect(h.viewport.scrollTop).toBe(0); expect(h.viewport.scrollLeft).toBe(0);
        h.viewport.scrollTop = 175;
        h.controls.key(event('Enter')); expect(h.current()[0]).toBe(0);
        expect(h.viewport.scrollTop).toBe(0);
        h.scope.cursor = { x: 4, y: 0 }; h.controls.key(event(' ')); expect(h.state.message).toBe(h.copy.emptyCell);
        h.scope.cursor = { x: 20, y: 20 }; h.controls.key(event('ArrowRight'));
        expect(h.viewport.scrollLeft).toBe(22 * 12 - 100); expect(h.viewport.scrollTop).toBe(21 * 12 - 100);
    });
    it('clears all marks as an undoable change without erasing the stored record', async () => {
        const h = harness(); h.controls.apply(setCraftCells(h.pattern, h.current(), [0, 2], true));
        h.controls.apply(createCraftMarks(h.pattern)); expect(h.current().some(Boolean)).toBe(false);
        h.controls.undo(); expect(h.current()[0]).toBe(1); expect(h.current()[2]).toBe(1);
        await h.queue().flush(); expect(h.pattern.pixels).toEqual(h.original);
    });
});

describe('placement UI save/recovery lifetimes', () => {
    it('does not turn a redundant mark into permanent dirty work while the real earlier save is delayed', async () => {
        const write = deferred<void>(), h = harness({ write: () => write.promise });
        h.controls.apply(setCraftCells(h.pattern, h.current(), [0], true)); await Promise.resolve();
        const accepted = h.current(); h.controls.pointerDown(h.pointer(0, 0)); h.controls.pointerEnd(h.pointer(0, 0));
        expect(h.current()).toBe(accepted); expect(h.state.saveStatus).toBe('saving'); expect(h.history.canUndo).toBe(true);
        const close = h.controls.close(); expect(h.onClose).not.toHaveBeenCalled();
        write.resolve(); await close;
        expect(h.state.saveStatus).toBe('saved'); expect(h.refs.dirtyRef.current).toBe(false);
        expect(h.onClose).toHaveBeenCalledOnce(); expect(h.write).toHaveBeenCalledOnce();
    });
    it('returns a completed save to its true saved state after a no-op stroke finishes', async () => {
        const write = deferred<void>(), h = harness({ write: () => write.promise });
        h.controls.apply(setCraftCells(h.pattern, h.current(), [0], true)); await Promise.resolve();
        const accepted = h.current(); h.controls.pointerDown(h.pointer(0, 0));
        write.resolve(); await h.queue().flush(); expect(h.state.saveStatus).toBe('saving');
        h.controls.pointerEnd(h.pointer(0, 0)); expect(h.current()).toBe(accepted);
        expect(h.state.saveStatus).toBe('saved'); expect(h.refs.dirtyRef.current).toBe(false);
        await h.controls.close(); expect(h.onClose).toHaveBeenCalledOnce();
    });
    it('does not report an old completed save as current while a new unfinished stroke is visible', async () => {
        const old = deferred<void>(), latest = deferred<void>(), h = harness({ write: vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise) });
        h.controls.apply(setCraftCells(h.pattern, h.current(), [0], true)); await Promise.resolve();
        h.controls.pointerDown(h.pointer(2, 0)); old.resolve(); await h.queue().flush();
        expect(h.state.saveStatus).toBe('saving'); expect(h.refs.dirtyRef.current).toBe(true);
        h.controls.pointerEnd(h.pointer(2, 0)); latest.resolve(); await h.queue().flush();
        expect(h.state.saveStatus).toBe('saved'); expect(h.refs.dirtyRef.current).toBe(false);
    });
    it('waits for the actual latest write before closing', async () => {
        const write = deferred<void>(), h = harness({ write: () => write.promise });
        h.controls.apply(setCraftCells(h.pattern, h.current(), [0], true)); const close = h.controls.close();
        expect(h.onClose).not.toHaveBeenCalled(); expect(h.state.closing).toBe(true);
        write.resolve(); await close; expect(h.onClose).toHaveBeenCalledOnce(); expect(h.refs.suppressCleanupWrite.current).toBe(true);
    });
    it('keeps the modal usable after closing cancels a file read and local saving fails', async () => {
        const read = deferred<string>(), h = harness({ write: async () => { throw new Error('Storage denied'); } });
        h.controls.apply(setCraftCells(h.pattern, h.current(), [0], true));
        const before = h.current().slice(), upload = h.controls.upload({ size: 1, text: () => read.promise } as File);
        expect(h.state.importing).toBe(true); await h.controls.close();
        expect(h.state.importing).toBe(false); expect(h.state.closeFailed).toBe(true); expect(h.state.closing).toBe(false); expect(h.onClose).not.toHaveBeenCalled();
        read.resolve(exportCraftProgress(signature, h.pattern, createCraftMarks(h.pattern))); await upload;
        expect(h.current()).toEqual(before); expect(h.state.importing).toBe(false);
    });
    it('blocks Close on serialization failure even when no write ever entered the queue', async () => {
        const h = harness({ codecFails: true }); h.controls.apply(setCraftCells(h.pattern, h.current(), [0], true));
        expect(h.state.saveStatus).toBe('error'); expect(h.write).not.toHaveBeenCalled(); await h.controls.close();
        expect(h.state.closeFailed).toBe(true); expect(h.onClose).not.toHaveBeenCalled(); expect(h.current()[0]).toBe(1);
    });
    it('locks editing after a failed read and rejects a late recovered record after explicit new-progress confirmation', async () => {
        const failed = harness({ load: async () => { throw new Error('Read blocked'); } });
        await failed.controls.readProgress(); expect(failed.state.phase).toBe('error');
        failed.controls.pointerDown(failed.pointer(0, 0)); expect(failed.current()[0]).toBe(0); expect(failed.write).not.toHaveBeenCalled();
        const gate = deferred<string>(), h = harness({ load: () => gate.promise }), run = h.controls.readProgress();
        await Promise.resolve(); h.state.phase = 'error'; h.controls.startNew();
        const oldMarks = setCraftCells(h.pattern, createCraftMarks(h.pattern), [0], true);
        gate.resolve(exportCraftProgress(signature, h.pattern, oldMarks)); await run; await h.queue().flush();
        expect(h.current().some(Boolean)).toBe(false); expect(h.state.phase).toBe('ready');
        expect(importCraftProgress(h.write.mock.calls.at(-1)![1], signature, h.pattern).some(Boolean)).toBe(false);
    });
});

describe('placement files are atomic and bounded', () => {
    it('preserves marks and both history branches on a mismatched or oversized file', async () => {
        const h = harness(); h.controls.apply(setCraftCells(h.pattern, h.current(), [0], true)); h.controls.undo();
        const before = h.current().slice(), redo = h.history.canRedo;
        const mismatch = exportCraftProgress('b'.repeat(64), h.pattern, createCraftMarks(h.pattern));
        await h.controls.upload({ size: mismatch.length, text: async () => mismatch } as File);
        expect(h.state.message).toBe(h.copy.importMismatch); expect(h.current()).toEqual(before); expect(h.history.canRedo).toBe(redo);
        const text = vi.fn(async () => 'not-read'); await h.controls.upload({ size: CRAFT_PROGRESS_MAX_FILE_BYTES + 1, text } as unknown as File);
        expect(text).not.toHaveBeenCalled(); expect(h.current()).toEqual(before); expect(h.history.canRedo).toBe(redo);
    });
    it('imports a same-pattern progress file as an undoable replacement, preserving the original image', async () => {
        const h = harness(), imported = setCraftCells(h.pattern, createCraftMarks(h.pattern), [2], true);
        const raw = exportCraftProgress(signature, h.pattern, imported);
        await h.controls.upload({ size: raw.length, text: async () => raw } as File); expect(h.current()).toEqual(imported);
        h.controls.undo(); expect(h.current().some(Boolean)).toBe(false); expect(h.pattern.pixels).toEqual(h.original);
        await h.queue().flush();
    });
});

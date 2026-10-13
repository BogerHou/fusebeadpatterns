import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { getBoardOption, getPaletteOption, parsePaletteCsv } from '../../lib/editor/config';
import { buildEditorProject } from '../../lib/editor/project';
import { clonePalettes } from '../../lib/editor/palette-state';
import { isEditorPatternSnapshotReady } from '../../lib/editor/draft-readiness';
import { PatternHistory, PatternStroke } from '../../lib/editor/pattern-history';
import { snapshotCraftPattern, type CraftPattern } from '../../lib/editor/craft-progress';
import { getCraftProgressCopy } from '../../lib/editor/craft-progress-copy';
import type { Project } from '../../lib/core/model/project/project.model';

// Run the production callback. Only the optional chunk loader and React state
// scheduling are controlled; palette cloning, snapshot validation and history
// use production modules. No duplicate entry algorithm is implemented here.
const source = ts.createSourceFile('Editor.tsx', readFileSync(new URL('./Editor.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let entry: ts.VariableDeclaration | undefined;
function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'openCraftProgress') entry = node;
    ts.forEachChild(node, visit);
}
visit(source);
if (!entry) throw new Error('Missing production crafting entry');
const compiled = ts.transpileModule(`const ${entry.getText(source)};\nmodule.exports={open:openCraftProgress};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function deferred<T>() {
    let resolve!: (value: T) => void, reject!: (error: Error) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject };
}
function harness(resolvedIds: string[] = ['perler'], selectedIds: string[] = ['perler']) {
    const palette = parsePaletteCsv('P01,Black,B,0,0,0\nP02,Red,R,255,0,0', getPaletteOption('perler')!);
    const project = buildEditorProject({ palettes: [palette], boardOption: getBoardOption('midi')!, boardWidth: 1, boardHeight: 1,
        matchingId: 'euclidean', ditheringId: 'none', imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: true }, useSymbols: false });
    const pixels = new Uint8ClampedArray(29 ** 2 * 4); pixels.set([0, 0, 0, 255, 15, 25, 35, 0]);
    const history = new PatternHistory(), stroke = new PatternStroke(pixels); stroke.setPixel(0, [255, 0, 0, 255]); history.push(stroke.finish()); history.undo(pixels);
    const before = pixels.slice(), paletteBefore = clonePalettes(project.paletteConfiguration.palettes), historyBefore = history.capture(pixels, 29, 29);
    const refs = { project: { current: project as Project | null }, pixels: { current: pixels as Uint8ClampedArray | null },
        busy: { current: false }, resolved: { current: resolvedIds } };
    const canvas = { width: 29, height: 29 }, Dialog = (): null => null;
    const core = deferred<{ snapshotCraftPattern: typeof snapshotCraftPattern }>(), dialog = deferred<{ default: typeof Dialog }>();
    const state = { busy: false, error: null as string | null, pattern: null as CraftPattern | null, dialog: null as typeof Dialog | null };
    const finish = vi.fn(), loaded = { exports: {} }, busyState = vi.fn((value: boolean) => { state.busy = value; });
    const loadChunk = vi.fn((name: string) => {
        if (name === '@/lib/editor/craft-progress') return core.promise;
        if (name === './CraftProgressDialog') return dialog.promise;
        throw new Error(`Unexpected entry import ${name}`);
    });
    new Script(compiled).runInNewContext({ module: loaded, require: loadChunk, JSON, Error, Promise,
        canOpenCraftProgress: true, craftEntryBusyRef: refs.busy,
        sourceTransactionsRef: { current: { pending: false } }, imageGenerationRef: { current: null }, settingsUpdateRef: { current: null },
        exportInProgressRef: { current: false }, localeSaveInProgressRef: { current: false }, localeContextInstalling: false,
        resolvedPaletteIdsRef: refs.resolved, selectedPaletteIds: selectedIds, finishActiveStroke: finish,
        currentProjectRef: refs.project, reducedColorRef: refs.pixels, canvasRef: { current: canvas }, previewSize: { width: 29, height: 29 },
        selectedBoard: getBoardOption('midi'), clonePalettes, isEditorPatternSnapshotReady,
        setCraftEntryBusy: busyState, setEditorMobilePanel: vi.fn(), setHomeMobilePanel: vi.fn(),
        setCraftProgressDialog: vi.fn((factory: () => typeof Dialog) => { state.dialog = factory(); }),
        setCraftPattern: vi.fn((pattern: CraftPattern) => { state.pattern = pattern; }),
        setErrorMessage: vi.fn((message: string) => { state.error = message; }), getCraftProgressCopy, locale: 'en',
    });
    return { open: (loaded.exports as { open(): Promise<void> }).open, refs, state, canvas, Dialog, core, dialog, loadChunk, busyState, finish,
        pixels, project, history, before, paletteBefore, historyBefore,
        resolve: () => { core.resolve({ snapshotCraftPattern }); dialog.resolve({ default: Dialog }); } };
}

describe('editor placement-progress entry owns a stable resolved snapshot', () => {
    it('does not freeze, finish a stroke or load either chunk while the selected brand is unresolved', async () => {
        const h = harness(['perler'], ['hama']); await h.open();
        expect(h.loadChunk).not.toHaveBeenCalled(); expect(h.finish).not.toHaveBeenCalled(); expect(h.busyState).not.toHaveBeenCalled();
        expect(h.refs.busy.current).toBe(false); expect(h.state.pattern).toBeNull(); expect(h.state.dialog).toBeNull();
        expect(h.pixels).toEqual(h.before); expect(h.project.paletteConfiguration.palettes).toEqual(h.paletteBefore);
        expect(h.history.capture(h.pixels, 29, 29)).toEqual(h.historyBefore);
    });
    it('recovers busy state and reports a failed optional chunk without changing the original grid or either undo branch', async () => {
        const h = harness(), run = h.open();
        expect(h.state.busy).toBe(true); expect(h.refs.busy.current).toBe(true); expect(h.state.pattern).toBeNull();
        h.core.resolve({ snapshotCraftPattern }); h.dialog.reject(new Error('Network chunk failed')); await run;
        expect(h.state.busy).toBe(false); expect(h.refs.busy.current).toBe(false);
        expect(h.state.error).toBe(getCraftProgressCopy('en').openError); expect(h.state.pattern).toBeNull(); expect(h.state.dialog).toBeNull();
        expect(h.pixels).toEqual(h.before); expect(h.project.paletteConfiguration.palettes).toEqual(h.paletteBefore);
        expect(h.history.capture(h.pixels, 29, 29)).toEqual(h.historyBefore);
    });
    it.each(['pixels-replaced', 'pixels-mutated', 'project-replaced', 'canvas-resized'] as const)('does not install the old snapshot after %s during chunk loading', async change => {
        const h = harness(), run = h.open();
        if (change === 'pixels-replaced') h.refs.pixels.current = h.pixels.slice();
        if (change === 'pixels-mutated') h.pixels[0] = 123;
        if (change === 'project-replaced') h.refs.project.current = { ...h.project } as Project;
        if (change === 'canvas-resized') h.canvas.width = 58;
        const liveProject = h.refs.project.current, livePixels = h.refs.pixels.current, liveBytes = livePixels!.slice();
        h.resolve(); await run;
        expect(h.state.pattern).toBeNull(); expect(h.state.dialog).toBeNull(); expect(h.state.busy).toBe(false); expect(h.refs.busy.current).toBe(false);
        expect(h.state.error).toBe(getCraftProgressCopy('en').openError);
        expect(h.refs.project.current).toBe(liveProject); expect(h.refs.pixels.current).toBe(livePixels); expect(h.refs.pixels.current).toEqual(liveBytes);
    });
    it('loads both optional modules before installing a fully detached snapshot and rejects a concurrent duplicate open', async () => {
        const h = harness(), run = h.open(); await Promise.resolve();
        expect(h.loadChunk.mock.calls.map(([name]) => name).sort()).toEqual(['./CraftProgressDialog', '@/lib/editor/craft-progress'].sort());
        await h.open(); expect(h.finish).toHaveBeenCalledOnce();
        h.core.resolve({ snapshotCraftPattern }); await Promise.resolve(); expect(h.state.pattern).toBeNull(); expect(h.state.dialog).toBeNull();
        h.dialog.resolve({ default: h.Dialog }); await run;
        const snapshot = h.state.pattern!;
        expect(snapshot).toMatchObject({ width: 29, height: 29, boardSize: 29, paletteIds: ['perler'] });
        expect(snapshot.pixels).toEqual(h.before); expect(snapshot.pixels).not.toBe(h.pixels);
        expect(snapshot.palettes).toEqual(h.paletteBefore); expect(snapshot.palettes).not.toBe(h.project.paletteConfiguration.palettes);
        expect(h.state.dialog).toBe(h.Dialog); expect(h.state.busy).toBe(false); expect(h.refs.busy.current).toBe(false);
        snapshot.pixels[0] = 200; snapshot.palettes[0].entries[0].enabled = false; snapshot.paletteIds[0] = 'hama';
        expect(h.pixels).toEqual(h.before); expect(h.project.paletteConfiguration.palettes).toEqual(h.paletteBefore);
        expect(h.history.capture(h.pixels, 29, 29)).toEqual(h.historyBefore);
    });
});

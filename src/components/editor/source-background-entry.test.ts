import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { getBoardOption, getPaletteOption, parsePaletteCsv } from '../../lib/editor/config';
import { buildEditorProject } from '../../lib/editor/project';
import { clonePalettes } from '../../lib/editor/palette-state';
import { PatternHistory, PatternStroke, createPatternPatch } from '../../lib/editor/pattern-history';
import { SourceImageTransactions, commitSourceImageCanvas, type PreparedSourceImage } from '../../lib/editor/source-image-transaction';
import { isEditorPatternSnapshotReady } from '../../lib/editor/draft-readiness';
import { normalizeSourceBackground, SourceBackgroundError, type SourceBackground } from '../../lib/editor/source-background';
import { getSourceBackgroundCopy } from '../../lib/editor/source-background-copy';
import { computeUsage, countBeads } from '../../lib/core/utils/utils';
import type { Project } from '../../lib/core/model/project/project.model';

// Execute the actual Editor callbacks. Control the asynchronous Canvas/worker
// preparation seam and React scheduling; use real project cloning, transaction,
// canvas commit, patches and undo history rather than a second apply algorithm.
const source = ts.createSourceFile('Editor.tsx', readFileSync(new URL('./Editor.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ['cancelSourceOperation', 'prepareBackgroundCandidate', 'previewSourceBackground', 'applySourceBackground'];
const nodes = new Map<string, ts.VariableDeclaration>();
function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && names.includes(node.name.text)) nodes.set(node.name.text, node);
    ts.forEachChild(node, visit);
}
visit(source);
if (nodes.size !== names.length) throw new Error('Missing production background callbacks');
const compiled = ts.transpileModule(names.map(name => `const ${nodes.get(name)!.getText(source)};`).join('\n') + '\nmodule.exports={apply:applySourceBackground,preview:previewSourceBackground,cancel:cancelSourceOperation};', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const background: SourceBackground = { color: { r: 255, g: 255, b: 255 }, tolerance: 0, mode: 'edge-connected' };
function deferred<T>() {
    let resolve!: (value: T) => void, reject!: (value: unknown) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject };
}
function harness() {
    const palettes = [parsePaletteCsv('P01,Black,B,0,0,0\nP02,White,W,255,255,255', getPaletteOption('perler')!)];
    const config = { palettes, boardOption: getBoardOption('midi')!, boardWidth: 1, boardHeight: 1, matchingId: 'euclidean', ditheringId: 'none',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 }, rendererSettings: { center: true, fit: true, showGrid: false }, useSymbols: false };
    const project = buildEditorProject(config), pixels = new Uint8ClampedArray(29 ** 2 * 4);
    pixels.set([255, 255, 255, 255, 0, 0, 0, 255]);
    const history = new PatternHistory(), stroke = new PatternStroke(pixels); stroke.setPixel(4, [255, 255, 255, 255]); history.push(stroke.finish());
    const before = pixels.slice(), historyBefore = history.capture(pixels, 29, 29), originalPalettes = clonePalettes(palettes);
    const next = pixels.slice(); next.set([255, 255, 255, 0]);
    const prep = deferred<PreparedSourceImage>();
    const canvas = { width: 29, height: 29, bytes: pixels.slice() }, write = vi.fn((image: { data: Uint8ClampedArray }) => { canvas.bytes = image.data.slice(); });
    const context = { createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }), putImageData: write };
    const refs = { project: { current: project as Project | null }, pixels: { current: pixels as Uint8ClampedArray | null }, history: { current: history },
        candidate: { current: null as AbortController | null }, generation: { current: null as AbortController | null }, resolved: { current: ['perler'] },
        accepted: { current: { background: null as SourceBackground | null } }, src: { current: 'original-source-data' }, key: { current: 'old-key' }, skip: { current: false } };
    const state = { background: null as SourceBackground | null, error: null as string | null, processing: false, open: true, manual: 1, revision: 0 };
    const jobs = new SourceImageTransactions(), prepare = vi.fn((options: { project: Project }, signal: AbortSignal) => { void options; void signal; return prep.promise; }), finish = vi.fn(), output = { fileName: 'photo', showGrid: false, useSymbols: false };
    const loaded = { exports: {} }, env: Record<string, unknown> = { module: loaded, useCallback: (fn: unknown) => fn, setColorLimitBusy: vi.fn(), Uint8ClampedArray, AbortController, DOMException, Error, JSON,
        imageSrc: 'original-source-data', sourceMode: 'image', selectedBoard: getBoardOption('midi'), boardWidth: 1, boardHeight: 1, matchingId: 'euclidean', ditheringId: 'none',
        activePalettes: palettes, imageAdjustments: config.imageAdjustments, rendererSettings: config.rendererSettings, maxBeadColors: null, sourceCrop: null,
        isEditorDraftReady: true, processing: false, sourceTransactionsRef: { current: jobs }, imageGenerationRef: refs.generation, settingsUpdateRef: { current: null },
        isLibraryPatternLoading: false, exportInProgressRef: { current: false }, localeTransferPending: false, localeContextInstalling: false, isEditorPage: true,
        hasPendingPatternSettings: false, resolvedPaletteIdsRef: refs.resolved, selectedPaletteIds: ['perler'], locale: 'en', finishActiveStroke: finish,
        currentProjectRef: refs.project, reducedColorRef: refs.pixels, canvasRef: { current: { ...canvas, getContext: () => context } }, previewSize: { width: 29, height: 29 },
        confirmLargePatternAction: () => true, currentPatternBeadCount: 841, patternHistoryRef: refs.history, sourceCandidateControllerRef: refs.candidate,
        sourceProcessingKey: vi.fn(() => 'background-settings-key'), normalizeSourceBackground, SourceBackgroundError, getSourceBackgroundCopy, clonePalettes, buildEditorProject,
        isEditorPatternSnapshotReady, getImageOutputSettings: () => output, prepareSourceImagePattern: prepare, computeUsage, countBeads, createPatternPatch,
        createPatternPreviewDataUrl: () => 'actual-preview', commitSourceImageCanvas, pendingEditedPatternRef: { current: null }, acceptedSourceConfigurationRef: refs.accepted,
        lastProcessedImageSrcRef: refs.src, lastProcessedImageSettingsKeyRef: refs.key, skipNextPaletteRebuildRef: refs.skip,
        setProcessing: (value: boolean) => { state.processing = value; env.processing = value; }, setSourceTransactionKind: vi.fn(),
        setSourceBackgroundError: (value: string | null) => { state.error = value; }, setSourceBackground: (value: SourceBackground | null) => { state.background = value; },
        setManualPatternRevision: (fn: (v: number) => number) => { state.manual = fn(state.manual); }, setHistoryRevision: (fn: (v: number) => number) => { state.revision = fn(state.revision); },
        setBeadsUsage: vi.fn(), setPreviewDataUrl: vi.fn(), syncEditorColorAfterPatternBuild: vi.fn(), setErrorMessage: vi.fn(), setIsSourceBackgroundOpen: (value: boolean) => { state.open = value; } };
    new Script(compiled).runInNewContext(env);
    return { ...(loaded.exports as { apply: (value: SourceBackground | null) => Promise<boolean>; preview: (value: SourceBackground | null, signal: AbortSignal) => Promise<unknown>; cancel: () => void }), refs, state, env,
        project, pixels, before, history, historyBefore, originalPalettes, prepare, prep, jobs, write, finish,
        resolve: () => { const options = prepare.mock.calls[0]?.[0] as unknown as { project: Project }; prep.resolve({ project: options.project, pixels: next, width: 29, height: 29 }); } };
}
function unchanged(h: ReturnType<typeof harness>) {
    expect(h.refs.project.current).toBe(h.project); expect(h.refs.pixels.current).toBe(h.pixels); expect(h.pixels).toEqual(h.before);
    expect(h.history.capture(h.pixels, 29, 29)).toEqual(h.historyBefore); expect(h.state.background).toBeNull(); expect(h.refs.accepted.current.background).toBeNull();
    expect(h.state.processing).toBe(false); expect(h.refs.generation.current).toBeNull(); expect(h.refs.candidate.current).toBeNull();
}

describe('actual editor background transaction and source preview', () => {
    it('applies one real patch without clearing manual history, keeps source settings and supports both undo levels', async () => {
        const h = harness(), run = h.apply(background); h.resolve(); expect(await run).toBe(true);
        const output = h.refs.pixels.current!; expect(output[3]).toBe(0); expect(h.pixels).toEqual(h.before);
        expect(h.state.background).toEqual(background); expect(h.state.background).not.toBe(background); expect(h.state.open).toBe(false);
        expect(h.refs.accepted.current.background).toEqual(background); expect(h.refs.key.current).toBe('background-settings-key'); expect(h.refs.skip.current).toBe(true);
        expect(h.history.undo(output)).not.toBeNull(); expect(output).toEqual(h.before);
        expect(h.history.undo(output)).not.toBeNull(); expect(output[4]).toBe(0); // manual edit before the background operation
        expect(h.history.redo(output)).not.toBeNull(); expect(output).toEqual(h.before);
        expect(h.history.redo(output)).not.toBeNull(); expect(output[3]).toBe(0);
        expect(h.state.background).toEqual(background); expect(h.env.imageSrc).toBe('original-source-data');
    });
    it('previews through the real preparation entry without publishing, editing history or mutating palette inputs', async () => {
        const h = harness(), controller = new AbortController(), run = h.preview(background, controller.signal); h.resolve(); const out = await run;
        expect(out).toMatchObject({ width: 29, height: 29, totalBeads: 1 }); unchanged(h);
        const options = h.prepare.mock.calls[0]?.[0] as unknown as { src: string; background: SourceBackground; project: Project };
        expect(options.src).toBe('original-source-data'); expect(options.background).toEqual(background); expect(options.project).not.toBe(h.project);
        expect(options.project.paletteConfiguration.palettes).not.toBe(h.env.activePalettes); expect(h.env.activePalettes).toEqual(h.originalPalettes);
    });
    it.each(['failure', 'cancel', 'canvas-failure'] as const)('preserves pixels, settings and existing history on %s', async action => {
        const h = harness(), run = h.apply(background);
        if (action === 'failure') h.prep.reject(new Error('Worker decode failed'));
        else { if (action === 'cancel') h.cancel(); if (action === 'canvas-failure') h.write.mockImplementationOnce(() => { throw new Error('Canvas write failed'); }); h.resolve(); }
        expect(await run).toBe(false); unchanged(h); expect(h.state.open).toBe(true);
    });
    it.each(['project', 'pixels', 'geometry'] as const)('rejects an obsolete generation after live %s changes', async kind => {
        const h = harness(), run = h.apply(background);
        if (kind === 'project') h.refs.project.current = { ...h.project } as Project;
        if (kind === 'pixels') h.refs.pixels.current = h.pixels.slice();
        if (kind === 'geometry') (h.env.canvasRef as { current: { width: number } }).current.width = 58;
        const currentProject = h.refs.project.current, currentPixels = h.refs.pixels.current; h.resolve(); expect(await run).toBe(false);
        expect(h.refs.project.current).toBe(currentProject); expect(h.refs.pixels.current).toBe(currentPixels); expect(h.write).not.toHaveBeenCalled();
        expect(h.history.capture(h.pixels, 29, 29)).toEqual(h.historyBefore); expect(h.state.background).toBeNull(); expect(h.state.processing).toBe(false);
    });
    it('rejects malformed settings and unresolved brands before source conversion', async () => {
        const h = harness(); expect(await h.apply({ ...background, tolerance: -1 })).toBe(false); expect(h.prepare).not.toHaveBeenCalled(); unchanged(h);
        h.refs.resolved.current = ['hama']; expect(await h.apply(background)).toBe(false); expect(h.prepare).not.toHaveBeenCalled(); unchanged(h);
    });
    it('rejects duplicate apply while the first controller is pending', async () => {
        const h = harness(), run = h.apply(background); expect(await h.apply(background)).toBe(false); expect(h.prepare).toHaveBeenCalledOnce(); h.resolve(); expect(await run).toBe(true);
    });
});

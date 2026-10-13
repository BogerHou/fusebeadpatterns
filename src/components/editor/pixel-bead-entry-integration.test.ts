import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { createEditorDraft, encodeEditorProjectPattern } from '../../lib/editor/draft';
import { preparePixelBeadEditorDraft } from '../../lib/editor/pixel-bead-entry';
import { commitSourceImageCanvas } from '../../lib/editor/source-image-transaction';
import { computeUsage } from '../../lib/core/utils/utils';
import { getBoardOption, getPaletteOption, parsePaletteCsv } from '../../lib/editor/config';
import { clonePalettes } from '../../lib/editor/palette-state';
import { normalizeSourceCrop } from '../../lib/core/utils/image-crop';
import { normalizeSourceBackground, type SourceBackground } from '../../lib/editor/source-background';
import { resolvePdfScaleMode } from '../../lib/editor/pdf-scale';
import { resolvePdfPaperSize } from '../../lib/editor/pdf-paper';
import { clampNumber } from '../../lib/editor/pattern-preview';
import { PatternHistory, PatternStroke } from '../../lib/editor/pattern-history';

function incomingPixelDraft() {
    const palette = parsePaletteCsv('P01,Black,B,0,0,0\nP02,Red,R,255,0,0', getPaletteOption('perler')!);
    const pixels = new Uint8ClampedArray(58 * 29 * 4);
    pixels.set([0, 0, 0, 255, 15, 25, 35, 0, 255, 0, 0, 255]);
    return createEditorDraft({ sourceMode: 'blank', imageSrc: null, fileName: 'pixel-beads', selectedPaletteIds: ['perler'],
        activePalettes: [palette], boardId: 'midi', boardWidth: 2, boardHeight: 1,
        matchingId: 'euclidean', ditheringId: 'none', useSymbols: true, exportFormatId: 'pdf',
        pdfPaperSize: 'letter', pdfScaleMode: 'midi-5mm',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: false, fit: false, showGrid: true }, previewZoom: 1,
        editedPattern: encodeEditorProjectPattern(pixels, 58, 29) });
}

// Execute the real install and restoration callback, rather than a second
// installation algorithm. Only React scheduling, preview and canvas I/O are
// modeled; document validation, RGBA, materials and undo state remain real.
const source = ts.createSourceFile('Editor.tsx', readFileSync(new URL('./Editor.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const nodes = new Map<string, ts.VariableDeclaration>();
function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) nodes.set(node.name.text, node);
    ts.forEachChild(node, visit);
}
visit(source);
const callbackText = ['restoreEditorDraft', 'installPixelBeadDraft'].map(name => `const ${nodes.get(name)!.getText(source)};`).join('\n');
const compiled = ts.transpileModule(callbackText + '\nmodule.exports={install:installPixelBeadDraft};', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;

function harness() {
    const originalBackground: SourceBackground = { color: { r: 255, g: 254, b: 253 }, tolerance: 24, mode: 'edge-connected' };
    const state = { sourceBackground: originalBackground as SourceBackground | null };
    const old = new Uint8ClampedArray(29 * 29 * 4); old.set([0, 0, 0, 255]);
    const history = new PatternHistory(), stroke = new PatternStroke(old);
    stroke.setPixel(0, [255, 0, 0, 255]); history.push(stroke.finish()); history.undo(old);
    const refs: Record<string, { current: unknown }> = {};
    for (const name of callbackText.matchAll(/\b(\w+Ref)\.current/g)) refs[name[1]] ??= { current: null };
    refs.reducedColorRef.current = old; refs.patternHistoryRef.current = history;
    refs.paletteHistoryRef.current = ['old-palette']; refs.currentProjectRef.current = { old: true };
    refs.initialLocaleRef.current = 'en';
    refs.acceptedSourceConfigurationRef.current = { background: originalBackground };
    let raster = old.slice(), writes = 0, rejectWrite = false, resolvePaint!: () => void;
    const canvas = { width: 29, height: 29, getContext: () => ({
        createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: (value: { data: Uint8ClampedArray }) => {
            writes++; if (rejectWrite && writes === 1) throw new Error('write rejected'); raster = value.data.slice();
        },
    }) };
    refs.canvasRef.current = canvas;
    refs.sourceTransactionsRef = { current: { pending: false } };
    const setters: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const name of callbackText.matchAll(/\b(set\w+)\(/g)) setters[name[1]] ??= vi.fn();
    setters.setSourceBackground = vi.fn((value: SourceBackground | null) => { state.sourceBackground = value; });
    const loaded = { exports: {} }, persist = vi.fn(), gate = new Promise<void>(yes => { resolvePaint = yes; });
    new Script(compiled).runInNewContext({ module: loaded, ...refs, ...setters,
        processing: false, exportingId: null, blankPatternRevision: 3,
        useCallback: (fn: unknown) => fn, preparePixelBeadEditorDraft, computeUsage, getBoardOption,
        createPatternPreviewDataUrl: () => 'data:image/png;base64,preview', window: { Image: class {} },
        waitForNextPaint: () => gate, commitSourceImageCanvas, cancelSourceOperation: vi.fn(), cancelSettingsUpdate: vi.fn(),
        syncEditorColorAfterPatternBuild: vi.fn(), persistEditorDraft: persist, normalizeSourceCrop, normalizeSourceBackground, clonePalettes,
        resolvePdfScaleMode, resolvePdfPaperSize, clampNumber, DEFAULT_PALETTE_ID: 'perler', DEFAULT_REFERENCE_OPACITY: 65,
        Map, Error,
    });
    return { install: (loaded.exports as { install: (draft: ReturnType<typeof incomingPixelDraft>, signal: AbortSignal) => Promise<void> }).install,
        refs, setters, persist, canvas, old, history, state, originalBackground, resolve: () => resolvePaint(), raster: () => raster,
        rejectWrite: () => { rejectWrite = true; } };
}

describe('atomic pixel bead installation in the live editor', () => {
    it('waits for approval/paint, then installs exact cells/configuration and suppresses the blank rebuilding effect', async () => {
        const h = harness(), draft = incomingPixelDraft(), task = new AbortController();
        const run = h.install(draft, task.signal);
        expect(h.refs.currentProjectRef.current).toEqual({ old: true }); expect(h.history.canRedo).toBe(true);
        expect(h.state.sourceBackground).toEqual(h.originalBackground);
        h.resolve(); await run;
        const expected = preparePixelBeadEditorDraft(draft).prepared.pixels;
        expect(h.raster()).toEqual(expected); expect(h.refs.reducedColorRef.current).toEqual(expected);
        expect(h.refs.builtBlankPatternRevisionRef.current).toBe(3);
        expect(h.refs.pendingEditedPatternRef.current).toBeNull(); expect(h.setters.setBlankPatternRevision).not.toHaveBeenCalled();
        expect(h.setters.setBoardWidth).toHaveBeenCalledWith(2); expect(h.setters.setPdfPaperSize).toHaveBeenCalledWith('letter');
        expect(h.setters.setPreviewSize).toHaveBeenCalledWith({ width: 58, height: 29 });
        expect(h.history.canUndo).toBe(false); expect(h.history.canRedo).toBe(false);
        expect(h.refs.restoredPaletteIdsRef.current).toBe(h.refs.resolvedPaletteIdsRef.current);
        expect(h.setters.setSourceBackground).toHaveBeenCalledWith(null);
        expect(h.state.sourceBackground).toBeNull();
        expect(h.refs.acceptedSourceConfigurationRef.current).toBeNull();
        expect(h.setters.setIsSourceBackgroundOpen).toHaveBeenCalledWith(false);
        expect(h.setters.setSourceBackgroundError).toHaveBeenCalledWith(null);
        expect(h.persist).toHaveBeenCalledWith(draft);
    });
    it.each(['cancel', 'canvas'] as const)('keeps the old document, dimensions, raster and both history branches after %s', async mode => {
        const h = harness(), task = new AbortController(), checkpoint = h.history.capture(h.old, 29, 29);
        const run = h.install(incomingPixelDraft(), task.signal);
        if (mode === 'cancel') task.abort(); else h.rejectWrite();
        h.resolve(); await expect(run).rejects.toThrow();
        expect(h.refs.currentProjectRef.current).toEqual({ old: true }); expect(h.refs.reducedColorRef.current).toBe(h.old);
        expect(h.canvas).toMatchObject({ width: 29, height: 29 }); expect(h.raster()).toEqual(h.old);
        expect(h.history.capture(h.old, 29, 29)).toEqual(checkpoint); expect(h.refs.paletteHistoryRef.current).toEqual(['old-palette']);
        expect(h.persist).not.toHaveBeenCalled(); expect(h.setters.setSourceMode).not.toHaveBeenCalled();
        expect(h.setters.setSourceBackground).not.toHaveBeenCalled();
        expect(h.state.sourceBackground).toEqual(h.originalBackground);
        expect(h.refs.acceptedSourceConfigurationRef.current).toEqual({ background: h.originalBackground });
    });
    it('rejects an old approval if a newer image generation began while its preview was being prepared', async () => {
        const h = harness(), run = h.install(incomingPixelDraft(), new AbortController().signal);
        h.refs.imageGenerationRef.current = new AbortController(); h.resolve(); await expect(run).rejects.toThrow();
        expect(h.raster()).toEqual(h.old); expect(h.persist).not.toHaveBeenCalled(); expect(h.history.canRedo).toBe(true);
    });
});

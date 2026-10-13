import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { getBoardOption, getPaletteOption, parsePaletteCsv } from '../../lib/editor/config';
import { normalizeSourceCrop } from '../../lib/core/utils/image-crop';
import { computeUsage } from '../../lib/core/utils/utils';
import { buildEditorProject } from '../../lib/editor/project';
import { clonePalettes } from '../../lib/editor/palette-state';
import { PatternHistory, PatternStroke, createPatternPatch } from '../../lib/editor/pattern-history';
import { SourceImageTransactions, commitSourceImageCanvas } from '../../lib/editor/source-image-transaction';
import { limitPatternBeadColors } from '../../lib/editor/pattern-quantization';
import { normalizeMaxBeadColors } from '../../lib/editor/brand-color-limit';
import { getBeadColorLimitCopy } from '../../lib/editor/bead-color-limit-copy';
import { isEditorPatternSnapshotReady } from '../../lib/editor/draft-readiness';

// Execute the real explicit-current handlers. Canvas I/O and React scheduling
// are modeled; real brand selection, alpha bytes, patches and history are used.
const source = ts.createSourceFile('Editor.tsx', readFileSync(new URL('./Editor.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = new Map<string, ts.VariableDeclaration>();
function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) declarations.set(node.name.text, node);
    ts.forEachChild(node, visit);
}
visit(source);
const names = ['sourceProcessingKey', 'readPendingColorLimit', 'applyCurrentColorLimit', 'cancelSourceOperation', 'openColorLimit'];
const compiled = ts.transpileModule(names.map(name => {
    const node = declarations.get(name);
    if (!node) throw new Error(`Missing production color limit handler ${name}`);
    return `const ${node.getText(source)};`;
}).join('\n') + '\nmodule.exports={apply:applyCurrentColorLimit,cancel:cancelSourceOperation,open:openColorLimit};', {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(yes => { resolve = yes; });
    return { promise, resolve };
}

function harness(limitText = '1', convert = limitPatternBeadColors, oldLimit: number | null = null, pendingSettings = false) {
    const palette = parsePaletteCsv('P01,Black,B,0,0,0\nP02,White,W,255,255,255\nP03,Red,R,255,0,0', getPaletteOption('perler')!);
    const pixels = new Uint8ClampedArray(29 * 29 * 4);
    pixels.set([0, 0, 0, 255, 255, 255, 255, 255, 255, 0, 0, 255, 255, 0, 0, 128, 15, 25, 35, 0]);
    const history = new PatternHistory(), stroke = new PatternStroke(pixels);
    stroke.setPixel(0, [255, 0, 0, 255]); history.push(stroke.finish()); history.undo(pixels);
    const project = buildEditorProject({ palettes: [palette], boardOption: getBoardOption('midi')!, boardWidth: 1, boardHeight: 1,
        matchingId: 'euclidean', ditheringId: 'none', imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: false }, useSymbols: false });
    const crop = { sourceWidth: 30, sourceHeight: 20, x: 2, y: 1, width: 20, height: 10 };
    const state = { cap: oldLimit, processing: false, busy: false, open: true, error: null as string | null, revision: 0, usage: computeUsage(pixels, [palette]), preview: '' };
    const refs = { pixels: { current: pixels }, project: { current: project }, history: { current: history },
        jobs: { current: new SourceImageTransactions() }, candidate: { current: null as AbortController | null },
        generation: { current: null as AbortController | null }, accepted: { current: { maxBeadColors: oldLimit, crop } },
        skip: { current: false }, key: { current: 'old-key' } };
    let raster = pixels.slice(), rejectWrite = false;
    const context = {
        createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
        putImageData: (data: { data: Uint8ClampedArray }) => { if (rejectWrite) { rejectWrite = false; throw new Error('write rejected'); } raster = data.data.slice(); },
    };
    const canvas = { width: 29, height: 29, getContext: () => context };
    const conversion = vi.fn(convert), loaded = { exports: {} };
    new Script(compiled).runInNewContext({ module: loaded, AbortController, RangeError, Error, JSON,
        useCallback: (value: unknown) => value, normalizeSourceCrop, normalizeMaxBeadColors,
        pendingMaxBeadColorsText: limitText, maxBeadColors: oldLimit, processing: false, sourceMode: 'image', sourceCrop: crop,
        boardId: 'midi', boardWidth: 1, boardHeight: 1, matchingId: 'euclidean', ditheringId: 'none',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 }, rendererSettings: { center: true, fit: true, showGrid: false },
        locale: 'en', previewSize: { width: 29, height: 29 }, currentPatternBeadCount: 841,
        selectedPaletteIds: ['perler'], resolvedPaletteIdsRef: { current: ['perler'] },
        sourceTransactionsRef: refs.jobs, sourceCandidateControllerRef: refs.candidate, imageGenerationRef: refs.generation,
        currentProjectRef: refs.project, reducedColorRef: refs.pixels, patternHistoryRef: refs.history,
        acceptedSourceConfigurationRef: refs.accepted, lastProcessedImageSettingsKeyRef: refs.key, skipNextPaletteRebuildRef: refs.skip,
        canvasRef: { current: canvas }, exportInProgressRef: { current: false }, settingsUpdateRef: { current: null },
        isLibraryPatternLoading: false, isEditorDraftReady: true, finishActiveStroke: vi.fn(), confirmLargePatternAction: () => true,
        isEditorPage: true, hasPendingPatternSettings: pendingSettings, exportingId: null, setPendingMaxBeadColorsText: vi.fn(),
        clonePalettes, isEditorPatternSnapshotReady, limitPatternBeadColors: conversion, createPatternPatch, computeUsage, commitSourceImageCanvas,
        createPatternPreviewDataUrl: (value: Uint8ClampedArray) => Buffer.from(value).toString('base64'), syncEditorColorAfterPatternBuild: vi.fn(),
        getBeadColorLimitCopy,
        setMaxBeadColors: (value: number | null) => { state.cap = value; }, setProcessing: (value: boolean) => { state.processing = value; },
        setColorLimitBusy: (value: boolean) => { state.busy = value; }, setColorLimitError: (value: string | null) => { state.error = value; },
        setIsColorLimitOpen: (value: boolean) => { state.open = value; }, setSourceTransactionKind: vi.fn(), setErrorMessage: vi.fn(),
        setBeadsUsage: (value: Map<string, number>) => { state.usage = value; }, setPreviewDataUrl: (value: string) => { state.preview = value; },
        setManualPatternRevision: (update: (value: number) => number) => { state.revision = update(state.revision); }, setHistoryRevision: vi.fn(),
    });
    const controls = loaded.exports as { apply(): Promise<void>; cancel(): void; open(): void };
    return { state, refs, controls, conversion, before: pixels.slice(), crop, palette, canvas, raster: () => raster, rejectWrite: () => { rejectWrite = true; } };
}

describe('explicit editor bead-color limit transaction', () => {
    it('requires unapplied editor setup changes to be applied before opening or applying a color limit', async () => {
        const h = harness('1', limitPatternBeadColors, null, true);
        h.state.open = false;
        h.controls.open();
        expect(h.state.open).toBe(false);
        await h.controls.apply();
        expect(h.conversion).not.toHaveBeenCalled();
        expect(h.refs.pixels.current).toEqual(h.before); expect(h.state.cap).toBeNull();
    });
    it('uses the real brand reducer, retains original ROI/alpha/positions and commits a reversible patch', async () => {
        const h = harness(), beforePalette = clonePalettes([h.palette]);
        await h.controls.apply();
        const after = h.refs.pixels.current.slice();
        expect(h.state.cap).toBe(1); expect(h.refs.accepted.current.maxBeadColors).toBe(1);
        expect(h.refs.accepted.current.crop).toBe(h.crop);
        expect(h.refs.project.current.paletteConfiguration.palettes).toEqual(beforePalette);
        const used = new Set<string>();
        for (let i = 0; i < after.length; i += 4) {
            expect(after[i + 3]).toBe(h.before[i + 3]);
            if (!after[i + 3]) expect(after.subarray(i, i + 4)).toEqual(h.before.subarray(i, i + 4));
            else used.add([...after.subarray(i, i + 3)].join(','));
        }
        expect(used.size).toBeLessThanOrEqual(1);
        expect(h.state.usage).toEqual(computeUsage(after, beforePalette));
        expect(h.raster()).toEqual(after); expect(h.state.open).toBe(false);
        expect(JSON.parse(h.refs.key.current)).toMatchObject({ maxBeadColors: 1, sourceCrop: h.crop });
        expect(h.refs.history.current.undo(h.refs.pixels.current)).not.toBeNull();
        expect(h.refs.pixels.current).toEqual(h.before);
        expect(h.state.cap).toBe(1); // Undo can intentionally exceed the automatic setting.
        expect(h.refs.history.current.redo(h.refs.pixels.current)).not.toBeNull();
        expect(h.refs.pixels.current).toEqual(after);
    });

    it('turns off only the preference, retaining exact edited bytes and both history branches', async () => {
        const h = harness('', limitPatternBeadColors, 2), beforeHistory = h.refs.history.current.capture(h.before, 29, 29);
        await h.controls.apply();
        expect(h.conversion).not.toHaveBeenCalled();
        expect(h.state.cap).toBeNull(); expect(h.refs.accepted.current.maxBeadColors).toBeNull();
        expect(h.refs.pixels.current).toEqual(h.before); expect(h.raster()).toEqual(h.before);
        expect(h.refs.history.current.capture(h.refs.pixels.current, 29, 29)).toEqual(beforeHistory);
        expect(Object.hasOwn(JSON.parse(h.refs.key.current), 'maxBeadColors')).toBe(false);
    });

    it.each(['0', '513', '1.5', ' 2', '2e1', '-1'])('rejects invalid input %s before conversion or accepted-state mutation', async value => {
        const h = harness(value);
        await h.controls.apply();
        expect(h.conversion).not.toHaveBeenCalled(); expect(h.state.error).toBe(getBeadColorLimitCopy('en').invalid);
        expect(h.refs.pixels.current).toEqual(h.before); expect(h.state.cap).toBeNull();
    });

    it.each(['cancel', 'replace'] as const)('ignores a late successful conversion after %s', async action => {
        const gate = deferred<Uint8ClampedArray>(), h = harness('1', () => gate.promise);
        const beforeHistory = h.refs.history.current.capture(h.before, 29, 29), run = h.controls.apply();
        expect(h.state.processing).toBe(true); expect(h.state.cap).toBeNull(); expect(h.raster()).toEqual(h.before);
        h.controls.cancel();
        if (action === 'replace') { h.refs.jobs.current.begin(); h.state.cap = 3; h.state.busy = true; }
        gate.resolve(new Uint8ClampedArray(h.before.length)); await run;
        expect(h.refs.pixels.current).toEqual(h.before); expect(h.raster()).toEqual(h.before);
        expect(h.refs.history.current.capture(h.before, 29, 29)).toEqual(beforeHistory);
        expect(h.state.cap).toBe(action === 'replace' ? 3 : null);
        expect(h.state.busy).toBe(action === 'replace');
    });

    it.each(['conversion', 'canvas'] as const)('keeps pixels, setting and undo/redo on a %s failure', async mode => {
        const h = harness('1', mode === 'conversion' ? async () => { throw new Error('conversion failed'); } : limitPatternBeadColors);
        if (mode === 'canvas') h.rejectWrite();
        const beforeHistory = h.refs.history.current.capture(h.before, 29, 29);
        await h.controls.apply();
        expect(h.state.error).toBe(getBeadColorLimitCopy('en').error); expect(h.state.cap).toBeNull();
        expect(h.refs.accepted.current.maxBeadColors).toBeNull(); expect(h.refs.pixels.current).toEqual(h.before);
        expect(h.raster()).toEqual(h.before); expect(h.refs.history.current.capture(h.before, 29, 29)).toEqual(beforeHistory);
        expect(h.state.processing).toBe(false); expect(h.state.open).toBe(true);
    });
});

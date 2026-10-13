import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import type { Palette, PaletteEntry } from '../../lib/core/model/palette/palette.model';
import { computeUsage, countBeads } from '../../lib/core/utils/utils';
import { getBoardOption, getPaletteOption, parsePaletteCsv, PALETTE_OPTIONS } from '../../lib/editor/config';
import { decodeEditorPatternDraft, parseEditorProject } from '../../lib/editor/draft';
import { applyFreshPaletteDefaults } from '../../lib/editor/palette-defaults';
import { clonePalettes, countEnabledEntries, enablePaletteEntry, getAutomaticEditorColorRef, mergePaletteEnabledState, togglePaletteEntry, togglePaletteGroup } from '../../lib/editor/palette-state';
import { PatternHistory, PatternStroke } from '../../lib/editor/pattern-history';
import { remapPatternPalette } from '../../lib/editor/pattern-palette';
import { normalizeSourceCrop, type EditorSourceCrop } from '../../lib/core/utils/image-crop';

// Execute the actual checkbox/dropdown handlers and selected-palette effect.
// Only React scheduling/canvas I/O are modeled; CSV loading, matching, pixels,
// project palettes, usage and both history stacks use the production modules.
const text = readFileSync(new URL('./Editor.tsx', import.meta.url), 'utf8');
const source = ts.createSourceFile('Editor.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const variables = new Map<string, ts.VariableDeclaration>();
let selectionEffect: ts.Expression | undefined;
let imageEffect: ts.Expression | undefined;
let colorEffect: ts.Expression | undefined;
let pendingPaletteEffect: ts.Expression | undefined;
let loadPalette: ts.FunctionDeclaration | undefined;
let getPatternBeadCount: ts.FunctionDeclaration | undefined;
function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) variables.set(node.name.text, node);
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'loadPalette') loadPalette = node;
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'getPatternBeadCount') getPatternBeadCount = node;
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' &&
        node.arguments[0]?.getText(source).includes('async function syncSelectedPalettes')) selectionEffect = node.arguments[0];
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' &&
        node.arguments[0]?.getText(source).includes('async function processImage')) imageEffect = node.arguments[0];
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' &&
        node.arguments[0]?.getText(source).includes('setAutomaticEditorColorRef(activeEditorColorEntry?.ref ?? null)')) colorEffect = node.arguments[0];
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' &&
        node.arguments[0]?.getText(source).includes('pendingPaletteUpdateRef.current === activePalettes')) pendingPaletteEffect = node.arguments[0];
    ts.forEachChild(node, visit);
}
visit(source);
if (!selectionEffect || !imageEffect || !colorEffect || !pendingPaletteEffect || !loadPalette || !getPatternBeadCount) throw new Error('Cannot find the production palette-selection entry points');
const declaration = (name: string) => {
    const node = variables.get(name);
    if (!node) throw new Error(`Missing production handler ${name}`);
    return `const ${node.getText(source)};`;
};
const compiled = ts.transpileModule([
    loadPalette.getText(source), getPatternBeadCount.getText(source), declaration('cancelSettingsUpdate'),
    declaration('applySelectedPalettes'), declaration('handlePaletteSelection'), declaration('handlePrimaryPaletteChange'),
    declaration('handleApplyPatternSettings'),
    declaration('setAutomaticEditorColorRef'), declaration('setManualEditorColorRef'), declaration('syncEditorColorAfterPatternBuild'),
    declaration('syncProjectPalettes'), declaration('updatePalettes'), declaration('handleEditorColorSelection'),
    declaration('sourceProcessingKey'),
    `module.exports = { checkbox: handlePaletteSelection, primary: handlePrimaryPaletteChange, apply: handleApplyPatternSettings, cancel: cancelSettingsUpdate,
        update: updatePalettes, picker: handleEditorColorSelection, colorEffect: ${colorEffect.getText(source)},
        pendingPaletteEffect: ${pendingPaletteEffect.getText(source)}, image: ${imageEffect.getText(source)}, effect: ${selectionEffect.getText(source)} };`,
].join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;

type Controls = { checkbox(id: string): void; primary(id: string): void; apply(): Promise<void>; effect(): (() => void) | undefined;
    update(updater: (palettes: Palette[]) => Palette[], saveHistory?: boolean): void; image(): (() => void) | undefined;
    picker(id: string, entry: PaletteEntry): void; colorEffect(): void; pendingPaletteEffect(): void; cancel(): void };
type PaletteEvent = (palettes: Palette[], controller: AbortController, ids: string[]) => Promise<void>;
type FetchPalette = (url: string, options?: RequestInit) => Promise<Response>;
const csvFetch: FetchPalette = async url => new Response(readFileSync(`public${url}`, 'utf8'));

function harness(id = 'original-black-cat', mode: 'blank' | 'image' = 'blank', fetchPalette = csvFetch,
    convert = remapPatternPalette) {
    const draft = parseEditorProject(readFileSync(`public/patterns/${id}/pattern.bead-pattern.json`, 'utf8'))!;
    const data = decodeEditorPatternDraft(draft.editedPattern)!;
    const state = {
        ids: draft.selectedPaletteIds, active: clonePalettes(draft.activePalettes), processing: false,
        error: null as string | null, usage: computeUsage(data, draft.activePalettes), preview: '',
        revision: 0, historyRevision: 0, latest: null as PaletteEvent | null,
        pendingPaletteId: draft.selectedPaletteIds[0],
        editorColorRef: null as string | null, tool: 'bead',
    };
    const refs = {
        project: { current: { paletteConfiguration: { palettes: clonePalettes(draft.activePalettes) }, boardConfiguration: { board: { nbBeadPerRow: 29 } } } },
        pixels: { current: data }, history: { current: new PatternHistory() },
        restored: { current: state.ids as string[] | null }, resolved: { current: state.ids as string[] | null },
        paletteAbort: { current: null as AbortController | null }, skipImage: { current: false },
        settingsAbort: { current: null as AbortController | null }, pendingPalette: { current: null as Palette[] | null },
        imageAbort: { current: null as AbortController | null }, paletteHistory: { current: [] as Palette[][] },
        sourceCandidate: { current: null as AbortController | null },
        acceptedSource: { current: mode === 'image' ? {
            boardId: draft.boardId, boardWidth: draft.boardWidth, boardHeight: draft.boardHeight,
            matchingId: draft.matchingId, ditheringId: draft.ditheringId,
            imageAdjustments: { ...draft.imageAdjustments }, selectedPaletteIds: [...draft.selectedPaletteIds],
            activePalettes: clonePalettes(draft.activePalettes), center: draft.rendererSettings.center,
            fit: draft.rendererSettings.fit, crop: null as EditorSourceCrop | null,
        } : null },
        lastImage: { current: mode === 'image' ? 'test-image' : null },
        lastImageSettings: { current: JSON.stringify({ boardId: draft.boardId, boardWidth: draft.boardWidth,
            boardHeight: draft.boardHeight, matchingId: draft.matchingId, ditheringId: draft.ditheringId,
            imageAdjustments: draft.imageAdjustments, center: draft.rendererSettings.center, fit: draft.rendererSettings.fit,
            sourceCrop: null }) },
        editorColor: { current: null as string | null }, colorMode: { current: 'auto' as 'auto' | 'manual' },
    };
    const canvas = { width: 29, height: 29, getContext: () => ({
        createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: vi.fn(),
    }) };
    const finishStroke = vi.fn();
    const rebuild = vi.fn(() => { throw new Error('Unexpected source-image rebuild'); });
    const brandPalettes = Object.fromEntries(['perler', 'hama'].map(id => [id,
        parsePaletteCsv(readFileSync(`public/palettes/${id}.csv`, 'utf8'), getPaletteOption(id)!)]));
    let controls: Controls, cleanup: (() => void) | undefined;
    function render() {
        const loadedModule = { exports: {} };
        new Script(compiled).runInNewContext({
            module: loadedModule, AbortController, Uint8ClampedArray, Promise, Response, Error, RangeError, DOMException,
            React: { useEffectEvent: (event: PaletteEvent) => { state.latest = event; return (...args: Parameters<PaletteEvent>) => state.latest!(...args); } },
            useCallback: (callback: unknown) => callback,
            getBoardOption, getPaletteOption, parsePaletteCsv, applyFreshPaletteDefaults, PALETTE_OPTIONS,
            clonePalettes, countEnabledEntries, enablePaletteEntry, getAutomaticEditorColorRef, mergePaletteEnabledState, remapPatternPalette: convert, computeUsage,
            normalizeSourceCrop, sourceCrop: null, maxBeadColors: null,
            fetch: fetchPalette, isEditorDraftReady: true, selectedPaletteIds: state.ids, activePalettes: state.active,
            matchingId: draft.matchingId, rendererSettings: { ...draft.rendererSettings, showGrid: true }, sourceMode: mode,
            currentProjectRef: refs.project, reducedColorRef: refs.pixels, patternHistoryRef: refs.history,
            paletteHistoryRef: refs.paletteHistory,
            canvasRef: { current: canvas }, paletteSyncAbortRef: refs.paletteAbort,
            restoredPaletteIdsRef: refs.restored, resolvedPaletteIdsRef: refs.resolved,
            imageGenerationRef: refs.imageAbort, settingsUpdateRef: refs.settingsAbort,
            sourceCandidateControllerRef: refs.sourceCandidate, acceptedSourceConfigurationRef: refs.acceptedSource,
            pendingPaletteUpdateRef: refs.pendingPalette,
            skipNextPaletteRebuildRef: refs.skipImage, finishActiveStroke: finishStroke,
            createPatternPreviewDataUrl: (pixels: Uint8ClampedArray) => Buffer.from(pixels).toString('base64'),
            editorColorSelectionModeRef: refs.colorMode, activeEditorColorValueRef: refs.editorColor,
            activeEditorColorRef: state.editorColorRef, allPaletteEntries: state.active.flatMap(palette => palette.entries),
            activeEditorColorEntry: state.active.flatMap(palette => palette.entries).find(entry =>
                entry.enabled && entry.ref === state.editorColorRef) ?? state.active.flatMap(palette => palette.entries)
                .find(entry => entry.ref === getAutomaticEditorColorRef(state.usage, state.active)),
            setActiveEditorColorRef: (value: string | null) => { state.editorColorRef = value; },
            allBrandPalettes: brandPalettes, setIsColorPickerOpen: vi.fn(), setColorPickerQuery: vi.fn(),
            setManualEditorColorRef: vi.fn(), setActiveEditorTool: (value: string) => { state.tool = value; },
            pendingColorSelectionRef: { current: null },
            setSelectedPaletteIds: (value: string[] | ((ids: string[]) => string[])) => { state.ids = typeof value === 'function' ? value(state.ids) : value; },
            setActivePalettes: (value: Palette[] | ((previous: Palette[]) => Palette[])) => {
                state.active = typeof value === 'function' ? value(state.active) : value;
            },
            setProcessing: (value: boolean) => { state.processing = value; },
            setErrorMessage: (value: string | null) => { state.error = value; },
            setBeadsUsage: (value: Map<string, number>) => { state.usage = value; },
            setPreviewDataUrl: (value: string) => { state.preview = value; },
            setManualPatternRevision: (update: number | ((value: number) => number)) => { state.revision = typeof update === 'function' ? update(state.revision) : update; },
            setHistoryRevision: (update: (value: number) => number) => { state.historyRevision = update(state.historyRevision); },
            setPendingPrimaryPaletteId: (value: string) => { state.pendingPaletteId = value; },
            processing: state.processing, pendingPrimaryPaletteId: state.pendingPaletteId,
            pendingBoardId: draft.boardId, pendingBoardWidth: draft.boardWidth, pendingBoardHeight: draft.boardHeight,
            boardId: draft.boardId, boardWidth: draft.boardWidth, boardHeight: draft.boardHeight,
            hasManualPatternChanges: refs.history.current.canUndo || refs.history.current.canRedo,
            confirmLargePatternAction: () => true, locale: 'en', t: (message: string) => message,
            imageSrc: mode === 'image' ? 'test-image' : null, fileName: draft.fileName,
            LARGE_PATTERN_CONFIRM_BEAD_COUNT: 65_536, window: { confirm: () => true },
            setColorPickerPaletteId: vi.fn(), setBoardId: vi.fn(), setBoardWidth: vi.fn(), setBoardHeight: vi.fn(),
            setBlankPatternRevision: vi.fn(), builtBlankPatternRevisionRef: { current: 0 },
            pendingLocaleContextRef: { current: null }, pendingLocaleViewportRef: { current: null },
            activeStrokeRef: { current: null }, pendingEditedPatternRef: { current: null },
            lastProcessedImageSrcRef: refs.lastImage, lastProcessedImageSettingsKeyRef: refs.lastImageSettings,
            imageAdjustments: draft.imageAdjustments, ditheringId: draft.ditheringId,
            selectedBoard: getBoardOption(draft.boardId), getImageOutputSettings: () => ({ fileName: draft.fileName, useSymbols: false, showGrid: true }),
            getLargePatternGenerationKey: () => 'test-key', confirmedLargeGenerationKeyRef: { current: null },
            buildEditorProject: rebuild, setPreviewSize: vi.fn(), setAutomaticEditorColorRef: vi.fn(),
        });
        controls = loadedModule.exports as Controls;
    }
    function effect() { render(); cleanup?.(); cleanup = controls.effect(); }
    function change(id: string, entry: 'checkbox' | 'primary' = 'checkbox') { controls[entry](id); effect(); }
    function setup(id: string) { state.pendingPaletteId = id; render(); return controls.apply(); }
    function update(updater: (palettes: Palette[]) => Palette[], saveHistory = true) { render(); controls.update(updater, saveHistory); }
    function image() { render(); return controls.image(); }
    function picker(id: string, ref: string) { render(); controls.picker(id, brandPalettes[id].entries.find(entry => entry.ref === ref)!); }
    function colorEffect() { render(); controls.colorEffect(); }
    function pendingPaletteEffect() { render(); controls.pendingPaletteEffect(); }
    function updateTwice(first: (palettes: Palette[]) => Palette[], second: (palettes: Palette[]) => Palette[]) {
        render(); controls.update(first); controls.update(second);
    }
    function cancel() { render(); controls.cancel(); }
    render();
    return { state, refs, canvas, draft, effect, change, setup, update, updateTwice, picker, colorEffect, pendingPaletteEffect, cancel, image, rebuild, finishStroke };
}

async function settled(h: ReturnType<typeof harness>) {
    await vi.waitFor(() => expect(h.state.processing).toBe(false));
}

function sameMaskAndEmptyBytes(actual: Uint8ClampedArray, expected: Uint8ClampedArray) {
    expect(actual.length).toBe(expected.length);
    for (let offset = 0; offset < actual.length; offset += 4) {
        expect(actual[offset + 3]).toBe(expected[offset + 3]);
        if (!expected[offset + 3]) expect(actual.subarray(offset, offset + 4)).toEqual(expected.subarray(offset, offset + 4));
    }
}

function targetOnly(h: ReturnType<typeof harness>, refPrefix: string, beads: number) {
    expect(h.state.error).toBeNull();
    expect([...h.state.usage.keys()].every(ref => ref.startsWith(refPrefix))).toBe(true);
    expect(countBeads(h.state.usage)).toBe(beads);
    expect(h.refs.project.current.paletteConfiguration.palettes).toEqual(h.state.active);
    if (h.refs.acceptedSource.current) {
        // Later failed image regeneration must roll back to this brand's exact
        // accepted palette, rather than its preceding source configuration.
        expect(h.refs.acceptedSource.current.selectedPaletteIds).toEqual(h.state.ids);
        expect(h.refs.acceptedSource.current.activePalettes).toEqual(h.state.active);
        expect(h.refs.acceptedSource.current.activePalettes).not.toBe(h.state.active);
    }
    expect(computeUsage(h.refs.pixels.current, h.state.active)).toEqual(h.state.usage);
    expect(h.state.preview).toBe(Buffer.from(h.refs.pixels.current).toString('base64'));
}

function color(h: ReturnType<typeof harness>, ref: string) {
    const entry = h.state.active.flatMap(palette => palette.entries).find(entry => entry.ref === ref)!;
    return [entry.color.r, entry.color.g, entry.color.b, entry.color.a] as const;
}

function toggle(ref: string) {
    return (palettes: Palette[]) => {
        const palette = palettes.find(palette => palette.entries.some(entry => entry.ref === ref))!;
        const entry = palette.entries.find(entry => entry.ref === ref)!;
        return togglePaletteEntry(palettes, palette.name, ref, !entry.enabled);
    };
}

describe('editor owned-color changes preserve the completed pattern', () => {
    it.each((['disabled-color', 'new-brand'] as const).flatMap(pick =>
        (['success', 'failure', 'cancel'] as const).map(outcome => ({ pick, outcome }))
    ))('keeps a picker’s $pick choice through preparation and handles $outcome', async ({ pick, outcome }) => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        let preparing = false, finished = false;
        const convert: typeof remapPatternPalette = async (...args) => {
            const result = await remapPatternPalette(...args);
            preparing = true;
            await gate;
            finished = true;
            if (outcome === 'failure') throw new Error('palette conversion failed');
            return result;
        };
        const h = harness('original-black-cat', 'image', csvFetch, convert);
        h.state.active = [parsePaletteCsv(readFileSync('public/palettes/perler.csv', 'utf8'), getPaletteOption('perler')!)];
        const ref = pick === 'disabled-color' ? '80-19003' : 'H10';
        if (pick === 'disabled-color') h.state.active[0].entries.find(entry => entry.ref === ref)!.enabled = false;
        h.refs.project.current.paletteConfiguration.palettes = clonePalettes(h.state.active);
        const pixels = h.refs.pixels.current, before = pixels.slice();
        h.colorEffect();
        const oldChoice = h.state.editorColorRef;
        expect(oldChoice).not.toBe(ref);
        h.picker(pick === 'disabled-color' ? 'perler' : 'hama', ref);
        expect(h.state.processing).toBe(true);
        expect(h.refs.colorMode.current).toBe('manual');
        expect(h.state.editorColorRef).toBe(ref);
        h.colorEffect(); // Real production effect runs while the old palette is active.
        expect(h.state.editorColorRef).toBe(ref);
        expect(h.refs.colorMode.current).toBe('manual');
        await vi.waitFor(() => expect(preparing).toBe(true));
        if (outcome === 'cancel') {
            h.cancel(); h.colorEffect();
            expect(h.state.editorColorRef).toBe(oldChoice);
            expect(h.refs.colorMode.current).toBe('auto');
        }
        release();
        await vi.waitFor(() => expect(finished).toBe(true));
        await settled(h); h.colorEffect();
        expect(h.refs.pendingPalette.current).toBeNull();
        if (outcome === 'success') {
            expect(h.state.editorColorRef).toBe(ref);
            expect(h.refs.colorMode.current).toBe('manual');
            expect(h.state.active.flatMap(palette => palette.entries).some(entry => entry.enabled && entry.ref === ref)).toBe(true);
            expect(h.state.error).toBeNull();
            h.image(); expect(h.rebuild).not.toHaveBeenCalled();
            expect(h.refs.pixels.current).toEqual(before);
        } else {
            expect(h.state.editorColorRef).toBe(oldChoice);
            expect(h.refs.colorMode.current).toBe('auto');
            expect(h.refs.pixels.current).toBe(pixels);
            expect(h.refs.pixels.current).toEqual(before);
            expect(h.state.error).toBe(outcome === 'failure' ? 'palette conversion failed' : null);
        }
    });

    it.each(['no-grid', 'image-in-flight'] as const)('accumulates two updates from one render with $0 and clears pending after commit', situation => {
        const convert = vi.fn(remapPatternPalette), h = harness('original-black-cat', 'image', csvFetch, convert);
        h.state.active = [parsePaletteCsv(readFileSync('public/palettes/perler.csv', 'utf8'), getPaletteOption('perler')!)];
        h.refs.project.current.paletteConfiguration.palettes = clonePalettes(h.state.active);
        if (situation === 'no-grid') { h.refs.project.current = null!; h.refs.pixels.current = null!; }
        else h.refs.imageAbort.current = new AbortController();
        h.updateTwice(toggle('80-19018'), toggle('80-19001'));
        expect(h.state.active[0].entries.find(entry => entry.ref === '80-19018')!.enabled).toBe(false);
        expect(h.state.active[0].entries.find(entry => entry.ref === '80-19001')!.enabled).toBe(false);
        expect(h.refs.pendingPalette.current).toBe(h.state.active);
        h.pendingPaletteEffect();
        expect(h.refs.pendingPalette.current).toBeNull();
        expect(convert).not.toHaveBeenCalled();
        if (situation === 'image-in-flight') expect(h.refs.imageAbort.current.signal.aborted).toBe(true);
    });

    it.each(['image', 'blank'] as const)('keeps a manual H10 bead, transparent bytes and both history stacks in a completed %s grid', async mode => {
        const h = harness('original-black-cat', mode);
        h.change('hama', 'primary'); await settled(h);
        if (mode === 'image') h.image(); // Consume the preceding brand-only skip.
        const pixels = h.refs.pixels.current;
        pixels.fill(0);
        pixels.set(color(h, 'H01'), 0);
        pixels.set(color(h, 'H44'), 4);
        pixels.set([3, 5, 7, 0], 8); // Empty-cell RGB bytes must also survive.
        pixels.set(color(h, 'H01'), 12);
        const original = pixels.slice();
        h.refs.history.current.clear();
        const paint = new PatternStroke(pixels);
        paint.setPixel(0, color(h, 'H10'));
        h.refs.history.current.push(paint.finish());
        const erase = new PatternStroke(pixels);
        erase.setPixel(12, [0, 0, 0, 0]);
        h.refs.history.current.push(erase.finish());
        h.refs.history.current.undo(pixels);
        const edited = pixels.slice();
        const oldHistory = h.refs.history.current.capture(pixels, 29, 29);

        h.update(toggle('H44')); await settled(h);
        const result = h.refs.pixels.current;
        expect([...result.subarray(0, 4)]).toEqual(color(h, 'H10'));
        expect(result.subarray(0, 4)).not.toEqual(original.subarray(0, 4));
        expect(result.subarray(4, 8)).not.toEqual(edited.subarray(4, 8));
        expect(h.state.active[0].entries.find(entry => entry.ref === 'H44')!.enabled).toBe(false);
        expect(h.state.active[0].entries.find(entry => entry.ref === 'H10')!.enabled).toBe(true);
        sameMaskAndEmptyBytes(result, edited);
        expect(h.refs.history.current.canUndo).toBe(true);
        expect(h.refs.history.current.canRedo).toBe(true);
        expect(h.state.usage).toEqual(computeUsage(result, h.state.active));
        expect(h.refs.project.current.paletteConfiguration.palettes).toEqual(h.state.active);
        expect(h.refs.paletteHistory.current).toHaveLength(1);
        expect(h.state.error).toBeNull();
        if (mode === 'image') {
            expect(h.refs.skipImage.current).toBe(true);
            h.image();
            expect(h.rebuild).not.toHaveBeenCalled();
            expect(h.refs.pixels.current).toBe(result);
        }
        expect(h.refs.history.current.capture(result, 29, 29)).not.toEqual(oldHistory);
        h.refs.history.current.undo(result);
        expect([...result.subarray(0, 4)]).toEqual(color(h, 'H01'));
        h.refs.history.current.redo(result);
        expect([...result.subarray(0, 4)]).toEqual(color(h, 'H10'));
        h.refs.history.current.redo(result);
        expect([...result.subarray(12, 16)]).toEqual([0, 0, 0, 0]);
        h.refs.history.current.undo(result);
        const beforeEnableAll = result.slice();
        h.update(palettes => togglePaletteGroup(palettes, palettes[0].name, true)); await settled(h);
        expect(h.refs.pixels.current).toEqual(beforeEnableAll);
        expect(h.state.active[0].entries.every(entry => entry.enabled)).toBe(true);
        expect(h.refs.history.current.canUndo).toBe(true);
        expect(h.refs.history.current.canRedo).toBe(true);
    });

    it('protects the last enabled color without conversion or a new history entry', async () => {
        const convert = vi.fn(remapPatternPalette), h = harness('original-black-cat', 'image', csvFetch, convert);
        h.state.active[0].entries.forEach(entry => { entry.enabled = entry.ref === '80-19018'; });
        const before = h.refs.pixels.current, history = h.refs.history.current;
        h.update(toggle('80-19018'));
        h.update(palettes => togglePaletteGroup(palettes, palettes[0].name, false));
        expect(convert).not.toHaveBeenCalled();
        expect(h.state.processing).toBe(false);
        expect(h.refs.pixels.current).toBe(before);
        expect(h.refs.history.current).toBe(history);
        expect(h.refs.paletteHistory.current).toEqual([]);
        expect(countEnabledEntries(h.state.active)).toBe(1);
    });

    it('updates candidates before a grid exists and lets the image effect restart an in-flight conversion', () => {
        const convert = vi.fn(remapPatternPalette), h = harness('original-black-cat', 'image', csvFetch, convert);
        h.refs.imageAbort.current = new AbortController();
        const before = h.refs.pixels.current;
        h.update(toggle('80-19018'));
        expect(h.refs.imageAbort.current.signal.aborted).toBe(true);
        expect(h.state.active[0].entries.find(entry => entry.ref === '80-19018')!.enabled).toBe(false);
        expect(h.refs.project.current.paletteConfiguration.palettes).toEqual(h.state.active);
        expect(h.refs.pixels.current).toBe(before);
        expect(h.refs.skipImage.current).toBe(false);
        expect(convert).not.toHaveBeenCalled();
        h.refs.imageAbort.current = null;
        h.refs.project.current = null!;
        h.refs.pixels.current = null!;
        h.update(toggle('80-19018'));
        expect(countEnabledEntries(h.state.active)).toBeGreaterThan(0);
        expect(h.state.active[0].entries.find(entry => entry.ref === '80-19018')!.enabled).toBe(true);
        expect(convert).not.toHaveBeenCalled();
    });

    it.each(['late-success', 'late-failure'] as const)('accumulates rapid color changes and ignores the first conversion’s $0', async outcome => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        let calls = 0;
        const convert: typeof remapPatternPalette = async (...args) => {
            const first = calls++ === 0;
            const result = await remapPatternPalette(...args);
            if (first) { await gate; if (outcome === 'late-failure') throw new Error('obsolete conversion'); }
            return result;
        };
        const h = harness('original-black-cat', 'image', csvFetch, convert);
        h.state.active = [parsePaletteCsv(readFileSync('public/palettes/perler.csv', 'utf8'), getPaletteOption('perler')!)];
        h.refs.project.current.paletteConfiguration.palettes = clonePalettes(h.state.active);
        const original = h.refs.pixels.current.slice();
        h.update(toggle('80-19018'));
        const firstController = h.refs.settingsAbort.current!;
        await vi.waitFor(() => expect(calls).toBe(1));
        h.update(toggle('80-19001')); await settled(h);
        expect(firstController.signal.aborted).toBe(true);
        expect(h.state.active[0].entries.find(entry => entry.ref === '80-19018')!.enabled).toBe(false);
        expect(h.state.active[0].entries.find(entry => entry.ref === '80-19001')!.enabled).toBe(false);
        const latest = h.refs.pixels.current;
        release(); await new Promise(resolve => setTimeout(resolve, 0));
        expect(h.refs.pixels.current).toBe(latest);
        expect(h.state.error).toBeNull();
        expect(h.state.processing).toBe(false);
        sameMaskAndEmptyBytes(latest, original);
        h.image();
        expect(h.rebuild).not.toHaveBeenCalled();
    });

    it('lets a brand selection cancel a color conversion without losing the prior edits', async () => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const convert: typeof remapPatternPalette = async (...args) => {
            const result = await remapPatternPalette(...args);
            if (args[3][0].name === getPaletteOption('perler')!.label) await gate;
            return result;
        };
        const h = harness('original-black-cat', 'image', csvFetch, convert);
        const pixels = h.refs.pixels.current;
        const paint = new PatternStroke(pixels); paint.setPixel(0, [231, 206, 62, 255]);
        h.refs.history.current.push(paint.finish());
        const edited = pixels.slice();
        h.update(toggle('80-19018'));
        const controller = h.refs.settingsAbort.current!;
        h.change('hama', 'primary'); await settled(h);
        const latest = h.refs.pixels.current;
        expect(controller.signal.aborted).toBe(true);
        expect(h.refs.pendingPalette.current).toBeNull();
        release(); await new Promise(resolve => setTimeout(resolve, 0));
        expect(h.refs.pixels.current).toBe(latest);
        expect(h.state.ids).toEqual(['hama']);
        expect(h.refs.history.current.canUndo).toBe(true);
        sameMaskAndEmptyBytes(latest, edited);
        expect(h.state.error).toBeNull();
    });

    it.each(['replacement', 'in-place-edit'] as const)('does not publish a stale color result over a $0', async change => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const convert: typeof remapPatternPalette = async (...args) => { const result = await remapPatternPalette(...args); await gate; return result; };
        const h = harness('original-black-cat', 'image', csvFetch, convert);
        const oldActive = h.state.active;
        h.update(toggle('80-19018'));
        await new Promise(resolve => setTimeout(resolve, 0));
        if (change === 'replacement') {
            const replacement = harness('original-soccer-ball');
            h.refs.project.current = replacement.refs.project.current;
            h.refs.pixels.current = replacement.refs.pixels.current;
            h.refs.history.current = replacement.refs.history.current;
        } else {
            const paint = new PatternStroke(h.refs.pixels.current); paint.setPixel(0, [231, 206, 62, 255]);
            h.refs.history.current.push(paint.finish());
        }
        const pixels = h.refs.pixels.current, history = h.refs.history.current, snapshot = pixels.slice();
        release(); await settled(h);
        expect(h.refs.pixels.current).toBe(pixels);
        expect(h.refs.pixels.current).toEqual(snapshot);
        expect(h.refs.history.current).toBe(history);
        expect(h.state.active).toBe(oldActive);
        expect(h.refs.paletteHistory.current).toEqual([]);
        expect(h.state.error).toEqual(change === 'in-place-edit' ? 'Pattern changed while colors were being converted. Try selecting the palette again.' : null);
    });
});

describe('editor palette-selection entry points', () => {
    it.each((['checkbox', 'primary'] as const).flatMap(entry =>
        (['fetch', 'remap'] as const).flatMap(stage =>
            (['success', 'failure'] as const).map(outcome => ({ entry, stage, outcome }))
        )
    ))('lets $entry supersede a Setup Apply waiting in $stage, including its late $outcome', async ({ entry, stage, outcome }) => {
        let releaseOld!: () => void, releaseNew!: () => void;
        const oldGate = new Promise<void>(resolve => { releaseOld = resolve; });
        const newGate = new Promise<void>(resolve => { releaseNew = resolve; });
        let oldFetchStarted = false, oldRemapStarted = false;
        const fetchPalette: FetchPalette = async url => {
            if (url.endsWith('/hama.csv')) {
                oldFetchStarted = true;
                if (stage === 'fetch') {
                    await oldGate;
                    if (outcome === 'failure') return new Response('', { status: 503 });
                }
            }
            if (url.endsWith('/artkal_s.csv')) await newGate;
            return csvFetch(url);
        };
        const convert: typeof remapPatternPalette = async (...args) => {
            const mapped = await remapPatternPalette(...args);
            if (args[3][0].name === getPaletteOption('hama')!.label && stage === 'remap') {
                oldRemapStarted = true;
                await oldGate;
                if (outcome === 'failure') throw new Error('Late Setup Apply conversion failure');
            }
            return mapped;
        };
        const h = harness('original-black-cat', 'blank', fetchPalette, convert);
        const originalHistory = h.refs.history.current, pixels = h.refs.pixels.current;
        const draw = new PatternStroke(pixels); draw.setPixel(0, [50, 50, 52, 255]); originalHistory.push(draw.finish());
        const drawYellow = new PatternStroke(pixels); drawYellow.setPixel(4, [231, 206, 62, 255]); originalHistory.push(drawYellow.finish());
        originalHistory.undo(pixels);
        const before = pixels.slice(), originalSnapshot = originalHistory.capture(pixels, 29, 29);
        const oldApply = h.setup('hama');
        await vi.waitFor(() => expect(stage === 'fetch' ? oldFetchStarted : oldRemapStarted).toBe(true));
        const oldController = h.refs.settingsAbort.current!;
        expect(h.state.processing).toBe(true);
        h.change('artkal_s', entry);
        expect(oldController.signal.aborted).toBe(true);
        expect(h.refs.settingsAbort.current).toBeNull();
        releaseOld(); await oldApply;
        // The canceled Apply must not release the newer selection's busy state,
        // change its pending IDs, clear edits/history, or publish old Hama pixels.
        expect(h.state.processing).toBe(true);
        expect(h.state.error).toBeNull();
        expect(h.state.ids).toEqual(entry === 'primary' ? ['artkal_s'] : ['perler', 'artkal_s']);
        expect(h.refs.pixels.current).toBe(pixels);
        expect(h.refs.pixels.current).toEqual(before);
        expect(h.refs.history.current).toBe(originalHistory);
        expect(originalHistory.capture(pixels, 29, 29)).toEqual(originalSnapshot);
        releaseNew(); await settled(h);
        if (entry === 'checkbox') { h.change('perler'); await settled(h); }
        expect(h.state.ids).toEqual(['artkal_s']);
        targetOnly(h, 'S', 182);
        sameMaskAndEmptyBytes(h.refs.pixels.current, before);
        expect(h.refs.history.current.canUndo).toBe(true);
        expect(h.refs.history.current.canRedo).toBe(true);
        expect(h.refs.history.current.capture(h.refs.pixels.current, 29, 29)).not.toBeNull();
        expect(originalHistory.capture(pixels, 29, 29)).toEqual(originalSnapshot);
    });

    it('keeps repeated same-primary and last-checkbox selections idle without reloading the restored project', () => {
        const fetchPalette = vi.fn(csvFetch), h = harness('original-black-cat', 'blank', fetchPalette);
        const pixels = h.refs.pixels.current;
        h.change('perler', 'primary');
        expect(h.state.processing).toBe(false);
        expect(fetchPalette).not.toHaveBeenCalled();
        h.change('perler');
        expect(h.state.processing).toBe(false);
        expect(h.state.ids).toEqual(['perler']);
        expect(h.state.error).toContain('At least one palette');
        expect(fetchPalette).not.toHaveBeenCalled();
        expect(h.refs.pixels.current).toBe(pixels);
    });
    it('changes the imported black cat through Manage Palettes from Perler to Hama and then Artkal S', async () => {
        const fetchPalette = vi.fn(csvFetch), h = harness('original-black-cat', 'blank', fetchPalette);
        const original = h.refs.pixels.current.slice();
        h.effect();
        expect(fetchPalette).not.toHaveBeenCalled(); // Opening a saved project preserves its palette snapshot.
        h.change('hama'); await settled(h);
        h.change('perler'); await settled(h);
        expect(h.state.ids).toEqual(['hama']);
        targetOnly(h, 'H', 181);
        expect(h.state.usage.get('H18')).toBe(177);
        expect(h.state.active[0].entries.filter(entry => entry.enabled)).toHaveLength(69);
        sameMaskAndEmptyBytes(h.refs.pixels.current, original);
        h.change('artkal_s'); await settled(h);
        h.change('hama'); await settled(h);
        expect(h.state.ids).toEqual(['artkal_s']);
        targetOnly(h, 'S', 181);
        expect(h.state.usage.get('S13')).toBe(177);
        sameMaskAndEmptyBytes(h.refs.pixels.current, original);
    });

    it.each(['blank', 'image'] as const)('preserves edits, alpha, undo and redo when the primary dropdown changes a completed %s project', async mode => {
        const h = harness('original-friendly-ghost', mode);
        const history = h.refs.history.current, pixels = h.refs.pixels.current;
        const occupied = Array.from({ length: pixels.length / 4 }, (_, i) => i * 4).filter(i => pixels[i + 3]);
        const stroke = new PatternStroke(pixels); stroke.setPixel(0, [50, 50, 52, 255]); history.push(stroke.finish());
        const erase = new PatternStroke(pixels); erase.setPixel(occupied[0], [0, 0, 0, 0]); history.push(erase.finish());
        const repaint = new PatternStroke(pixels);
        repaint.setPixel(occupied[1], pixels[occupied[1]] === 50 ? [234, 239, 238, 255] : [50, 50, 52, 255]);
        history.push(repaint.finish()); history.undo(pixels);
        const before = pixels.slice(), oldHistory = history.capture(before, 29, 29);
        h.change('hama', 'primary'); await settled(h);
        targetOnly(h, 'H', 311);
        sameMaskAndEmptyBytes(h.refs.pixels.current, before);
        expect(h.refs.skipImage.current).toBe(mode === 'image');
        const convertedHistory = h.refs.history.current;
        expect(convertedHistory.canUndo).toBe(true);
        expect(convertedHistory.canRedo).toBe(true);
        expect(convertedHistory.capture(h.refs.pixels.current, 29, 29)).not.toBeNull();
        expect(history.capture(before, 29, 29)).toEqual(oldHistory);
        const converted = h.refs.pixels.current.slice();
        convertedHistory.redo(h.refs.pixels.current);
        convertedHistory.undo(h.refs.pixels.current);
        expect(h.refs.pixels.current).toEqual(converted);
        convertedHistory.undo(h.refs.pixels.current); // undo erasure restores the original occupied cell
        expect(h.refs.pixels.current[occupied[0] + 3]).toBe(255);
        convertedHistory.undo(h.refs.pixels.current); // undo drawing restores the untouched transparent cell
        expect(h.refs.pixels.current.subarray(0, 4)).toEqual(new Uint8ClampedArray(4));
        convertedHistory.redo(h.refs.pixels.current);
        expect([...h.refs.pixels.current.subarray(0, 4)]).toEqual([20, 19, 21, 255]);
    });

    it.each(['failed-fetch', 'empty-palette'])('keeps the imported grid/history and last successful selection after %s', async failure => {
        const h = harness('original-black-cat', 'blank', async url => url.includes('hama')
            ? new Response('', { status: failure === 'failed-fetch' ? 503 : 200 }) : csvFetch(url));
        const pixels = h.refs.pixels.current, project = h.refs.project.current, history = h.refs.history.current;
        h.change('hama', 'primary'); await settled(h);
        expect(h.state.error).toMatch(failure === 'failed-fetch' ? /Failed to load/ : /No enabled opaque/);
        expect(h.state.ids).toEqual(['perler']);
        expect(h.refs.pixels.current).toBe(pixels);
        expect(h.refs.project.current).toBe(project);
        expect(h.refs.history.current).toBe(history);
        expect(h.state.usage.get('80-19018')).toBe(177);
    });

    it('ignores a late Hama fetch after a rapid primary selection switches to Artkal S', async () => {
        let release!: (value: Response) => void;
        const late = new Promise<Response>(resolve => { release = resolve; });
        const h = harness('original-black-cat', 'blank', url => url.includes('hama') ? late : csvFetch(url));
        h.change('hama', 'primary');
        const oldController = h.refs.paletteAbort.current!;
        h.change('artkal_s', 'primary'); await settled(h);
        expect(oldController.signal.aborted).toBe(true);
        const current = h.refs.pixels.current, projectPalettes = h.refs.project.current.paletteConfiguration.palettes;
        release(await csvFetch('/palettes/hama.csv'));
        await vi.waitFor(() => expect(h.state.ids).toEqual(['artkal_s']));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(h.refs.pixels.current).toBe(current);
        expect(h.refs.project.current.paletteConfiguration.palettes).toBe(projectPalettes);
        targetOnly(h, 'S', 181);
    });

    it('cancels an in-flight conversion without changing its original undo/redo stacks', async () => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const convert = vi.fn(async (...args: Parameters<typeof remapPatternPalette>) => {
            const mapped = await remapPatternPalette(...args); await gate; return mapped;
        });
        const h = harness('original-black-cat', 'blank', csvFetch, convert);
        const originalHistory = h.refs.history.current, pixels = h.refs.pixels.current;
        const draw = new PatternStroke(pixels); draw.setPixel(0, [50, 50, 52, 255]); originalHistory.push(draw.finish());
        const drawYellow = new PatternStroke(pixels); drawYellow.setPixel(4, [231, 206, 62, 255]); originalHistory.push(drawYellow.finish());
        originalHistory.undo(pixels);
        const before = originalHistory.capture(pixels, 29, 29);
        h.change('hama', 'primary');
        await vi.waitFor(() => expect(convert).toHaveBeenCalledTimes(2));
        const firstController = h.refs.paletteAbort.current!;
        h.change('artkal_s', 'primary');
        await vi.waitFor(() => expect(convert).toHaveBeenCalledTimes(4));
        expect(firstController.signal.aborted).toBe(true);
        expect(originalHistory.capture(pixels, 29, 29)).toEqual(before);
        release(); await settled(h);
        expect(h.state.ids).toEqual(['artkal_s']);
        targetOnly(h, 'S', 182);
        expect(originalHistory.capture(pixels, 29, 29)).toEqual(before);
        expect(h.refs.history.current.canUndo).toBe(true);
        expect(h.refs.history.current.canRedo).toBe(true);
        expect(h.refs.history.current.capture(h.refs.pixels.current, 29, 29)).not.toBeNull();
    });

    it('does not commit a conversion over a replacement project', async () => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const convert = vi.fn(async (...args: Parameters<typeof remapPatternPalette>) => {
            const mapped = await remapPatternPalette(...args); await gate; return mapped;
        });
        const h = harness('original-black-cat', 'blank', csvFetch, convert);
        const previousHistory = h.refs.history.current;
        h.change('hama', 'primary');
        await vi.waitFor(() => expect(convert).toHaveBeenCalled());
        const replacement = harness('original-soccer-ball');
        h.refs.project.current = replacement.refs.project.current;
        h.refs.pixels.current = replacement.refs.pixels.current;
        h.refs.history.current = replacement.refs.history.current;
        const replacementPixels = h.refs.pixels.current.slice();
        release(); await settled(h);
        expect(h.refs.project.current).toBe(replacement.refs.project.current);
        expect(h.refs.pixels.current).toEqual(replacementPixels);
        expect(h.refs.history.current).toBe(replacement.refs.history.current);
        expect(previousHistory.canUndo).toBe(false);
    });

    it('preserves an in-place edit and original history instead of overwriting it with an async conversion', async () => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const convert = vi.fn(async (...args: Parameters<typeof remapPatternPalette>) => {
            const mapped = await remapPatternPalette(...args); await gate; return mapped;
        });
        const h = harness('original-black-cat', 'blank', csvFetch, convert);
        const originalHistory = h.refs.history.current, pixels = h.refs.pixels.current;
        h.change('hama', 'primary');
        await vi.waitFor(() => expect(convert).toHaveBeenCalled());
        const edit = new PatternStroke(pixels); edit.setPixel(0, [50, 50, 52, 255]); originalHistory.push(edit.finish());
        h.state.usage = computeUsage(pixels, h.state.active);
        release(); await settled(h);
        expect(h.state.error).toContain('Pattern changed');
        expect(h.state.ids).toEqual(['perler']);
        expect(h.refs.pixels.current).toBe(pixels);
        expect([...pixels.subarray(0, 4)]).toEqual([50, 50, 52, 255]);
        expect(h.refs.history.current).toBe(originalHistory);
        expect(originalHistory.canUndo).toBe(true);
        expect(countBeads(h.state.usage)).toBe(182);
    });
});

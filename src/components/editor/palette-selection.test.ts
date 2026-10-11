import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import type { Palette } from '../../lib/core/model/palette/palette.model';
import { computeUsage, countBeads } from '../../lib/core/utils/utils';
import { getPaletteOption, parsePaletteCsv, PALETTE_OPTIONS } from '../../lib/editor/config';
import { decodeEditorPatternDraft, parseEditorProject } from '../../lib/editor/draft';
import { applyFreshPaletteDefaults } from '../../lib/editor/palette-defaults';
import { clonePalettes, mergePaletteEnabledState } from '../../lib/editor/palette-state';
import { PatternHistory, PatternStroke } from '../../lib/editor/pattern-history';
import { remapPatternPalette } from '../../lib/editor/pattern-palette';

// Execute the actual checkbox/dropdown handlers and selected-palette effect.
// Only React scheduling/canvas I/O are modeled; CSV loading, matching, pixels,
// project palettes, usage and both history stacks use the production modules.
const text = readFileSync(new URL('./Editor.tsx', import.meta.url), 'utf8');
const source = ts.createSourceFile('Editor.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const variables = new Map<string, ts.VariableDeclaration>();
let selectionEffect: ts.Expression | undefined;
let loadPalette: ts.FunctionDeclaration | undefined;
function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) variables.set(node.name.text, node);
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'loadPalette') loadPalette = node;
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' &&
        node.arguments[0]?.getText(source).includes('async function syncSelectedPalettes')) selectionEffect = node.arguments[0];
    ts.forEachChild(node, visit);
}
visit(source);
if (!selectionEffect || !loadPalette) throw new Error('Cannot find the production palette-selection entry points');
const declaration = (name: string) => {
    const node = variables.get(name);
    if (!node) throw new Error(`Missing production handler ${name}`);
    return `const ${node.getText(source)};`;
};
const compiled = ts.transpileModule([
    loadPalette.getText(source),
    declaration('applySelectedPalettes'), declaration('handlePaletteSelection'), declaration('handlePrimaryPaletteChange'),
    `module.exports = { checkbox: handlePaletteSelection, primary: handlePrimaryPaletteChange, effect: ${selectionEffect.getText(source)} };`,
].join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;

type Controls = { checkbox(id: string): void; primary(id: string): void; effect(): (() => void) | undefined };
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
    };
    const refs = {
        project: { current: { paletteConfiguration: { palettes: clonePalettes(draft.activePalettes) }, boardConfiguration: { board: { nbBeadPerRow: 29 } } } },
        pixels: { current: data }, history: { current: new PatternHistory() },
        restored: { current: state.ids as string[] | null }, resolved: { current: state.ids as string[] | null },
        paletteAbort: { current: null as AbortController | null }, skipImage: { current: false },
    };
    const canvas = { width: 29, height: 29, getContext: () => ({
        createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: vi.fn(),
    }) };
    const finishStroke = vi.fn();
    let controls: Controls, cleanup: (() => void) | undefined;
    function render() {
        const loadedModule = { exports: {} };
        new Script(compiled).runInNewContext({
            module: loadedModule, AbortController, Uint8ClampedArray, Promise, Response, Error, RangeError, DOMException,
            React: { useEffectEvent: (event: PaletteEvent) => { state.latest = event; return (...args: Parameters<PaletteEvent>) => state.latest!(...args); } },
            getPaletteOption, parsePaletteCsv, applyFreshPaletteDefaults, PALETTE_OPTIONS,
            clonePalettes, mergePaletteEnabledState, remapPatternPalette: convert, computeUsage,
            fetch: fetchPalette, isEditorDraftReady: true, selectedPaletteIds: state.ids, activePalettes: state.active,
            matchingId: draft.matchingId, rendererSettings: { showGrid: true }, sourceMode: mode,
            currentProjectRef: refs.project, reducedColorRef: refs.pixels, patternHistoryRef: refs.history,
            paletteHistoryRef: { current: [] },
            canvasRef: { current: canvas }, paletteSyncAbortRef: refs.paletteAbort,
            restoredPaletteIdsRef: refs.restored, resolvedPaletteIdsRef: refs.resolved,
            imageGenerationRef: { current: null }, settingsUpdateRef: { current: null },
            skipNextPaletteRebuildRef: refs.skipImage, finishActiveStroke: finishStroke,
            createPatternPreviewDataUrl: (pixels: Uint8ClampedArray) => Buffer.from(pixels).toString('base64'),
            syncEditorColorAfterPatternBuild: vi.fn(),
            setSelectedPaletteIds: (value: string[] | ((ids: string[]) => string[])) => { state.ids = typeof value === 'function' ? value(state.ids) : value; },
            setActivePalettes: (value: Palette[]) => { state.active = value; },
            setProcessing: (value: boolean) => { state.processing = value; },
            setErrorMessage: (value: string | null) => { state.error = value; },
            setBeadsUsage: (value: Map<string, number>) => { state.usage = value; },
            setPreviewDataUrl: (value: string) => { state.preview = value; },
            setManualPatternRevision: (update: (value: number) => number) => { state.revision = update(state.revision); },
            setHistoryRevision: (update: (value: number) => number) => { state.historyRevision = update(state.historyRevision); },
            setPendingPrimaryPaletteId: vi.fn(),
        });
        controls = loadedModule.exports as Controls;
    }
    function effect() { render(); cleanup?.(); cleanup = controls.effect(); }
    function change(id: string, entry: 'checkbox' | 'primary' = 'checkbox') { controls[entry](id); effect(); }
    render();
    return { state, refs, canvas, draft, effect, change, finishStroke };
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
    expect(computeUsage(h.refs.pixels.current, h.state.active)).toEqual(h.state.usage);
    expect(h.state.preview).toBe(Buffer.from(h.refs.pixels.current).toString('base64'));
}

describe('editor palette-selection entry points', () => {
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

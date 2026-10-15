import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { normalizeSourceCrop } from '../core/utils/image-crop';
import { BOARD_OPTIONS } from './config';
import { decodeEditorPatternDraft, encodeEditorProjectPattern, EDITOR_PROJECT_PATTERN_MAX_BYTES, loadEditorDraft, parseEditorProject, saveEditorDraft, serializeEditorProject, type EditorDraft } from './draft';
import { getEditorProjectSourceKey, prepareEditorProjectFile } from './project-file-preparation';
import { normalizeSourceBackground } from './source-background';
import { quantizePattern } from './pattern-quantization';
import type { prepareSourceImagePattern, PreparedSourceImage } from './source-image-transaction';

vi.mock('./pattern-quantization', () => ({
    // Matching is independently covered. This seam observes whether saved
    // cells take the existing no-quantization source-restoration path.
    quantizePattern: vi.fn(async ({ pixels }: { pixels: Uint8ClampedArray }) => pixels.slice()),
}));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

function palette(name = 'Saved palette') {
    const entry = new PaletteEntry('Original black', new Color(13, 17, 19, 255));
    Object.assign(entry, { ref: 'OWN-1', prefix: 'OWN', symbol: 'A', enabled: false });
    return new Palette(name, [entry]);
}
function pixels(width = 29, height = 29) {
    const output = new Uint8ClampedArray(width * height * 4);
    output.set([173, 42, 91, 0, 12, 34, 56, 127]);
    return output;
}
function draft(overrides: Partial<EditorDraft> = {}): EditorDraft {
    return {
        version: 1, sourceMode: 'blank', imageSrc: null, fileName: 'my-pattern',
        selectedPaletteIds: ['perler'], activePalettes: [palette()],
        boardId: 'midi', boardWidth: 1, boardHeight: 1, matchingId: 'euclidean', ditheringId: 'none',
        useSymbols: true, exportFormatId: 'pdf', pdfScaleMode: 'midi-5mm', pdfPaperSize: 'letter',
        imageAdjustments: { brightness: 97, contrast: 103, saturation: 89, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: false }, previewZoom: 1.5,
        editedPattern: encodeEditorProjectPattern(pixels(), 29, 29), ...overrides,
    };
}
function projectFile(input: EditorDraft): string {
    const wire = JSON.parse(serializeEditorProject(input));
    wire.savedAt = '2026-10-15T00:00:00.000Z';
    return JSON.stringify(wire);
}
const options = () => ({
    loadPalette: vi.fn(async () => palette('Loaded palette')),
    createBlankImage: vi.fn(() => ({ placeholder: true }) as unknown as HTMLImageElement),
});
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(yes => { resolve = yes; });
    return { promise, resolve };
}
const validImage = 'data:image/png;base64,bG9jYWwtc3ludGhldGljLWltYWdl';
const brokenImage = 'data:image/png;base64,bm90LXBuZw==';

/** Controlled Node image/canvas seams, not an actual PNG or browser decoder. */
function browserSurface() {
    const created: Array<{ width: number; height: number; getContext: () => unknown }> = [];
    const decoded: string[] = [], draw = vi.fn(), read = vi.fn();
    class TestImage {
        width = 4; height = 2; naturalWidth = 4; naturalHeight = 2;
        style = { filter: '' }; onload: (() => void) | null = null; onerror: (() => void) | null = null;
        set src(value: string) {
            decoded.push(value);
            queueMicrotask(() => { if (value === brokenImage) this.onerror?.(); else this.onload?.(); });
        }
    }
    const slots = new Map<string, string>();
    vi.stubGlobal('window', { Image: TestImage, sessionStorage: {
        getItem: (key: string) => slots.get(key) ?? null,
        setItem: (key: string, value: string) => { slots.set(key, value); },
    } });
    vi.stubGlobal('document', { createElement: (tag: string) => {
        expect(tag).toBe('canvas');
        const canvas = { width: 0, height: 0, getContext: () => ({
            filter: '', drawImage: draw, getImageData: () => { read(); return { data: pixels(canvas.width, canvas.height) }; },
        }) };
        created.push(canvas);
        return canvas;
    } });
    return { created, decoded, draw, read };
}

describe('detached project file preparation', () => {
    it('preserves saved blank RGBA, settings and disabled palette entries with no shared input objects', async () => {
        const input = draft(), before = projectFile(input), seams = options();
        const result = await prepareEditorProjectFile(input, new AbortController().signal, seams);
        expect(result.prepared.width).toBe(29);
        expect(result.prepared.height).toBe(29);
        expect(result.prepared.pixels).toEqual(pixels());
        expect(decodeEditorPatternDraft(result.draft.editedPattern)).toEqual(result.prepared.pixels);
        expect(result.draft.editedPattern).toEqual(input.editedPattern);
        expect(result.sourceKey).toBeNull();
        expect(result.prepared.project.srcWidth).toBe(29);
        expect(result.prepared.project.srcHeight).toBe(29);
        expect(result.prepared.project.image.src).toBe(seams.createBlankImage.mock.results[0].value);
        expect(result.prepared.project.paletteConfiguration.palettes[0].entries[0].enabled).toBe(false);
        expect(seams.loadPalette).not.toHaveBeenCalled();
        result.draft.activePalettes[0].entries[0].color.r = 100;
        result.draft.imageAdjustments.brightness = 1;
        result.prepared.project.paletteConfiguration.palettes[0].entries[0].color.g = 200;
        result.prepared.pixels[0] = 99;
        expect(projectFile(input)).toBe(before);
        expect(result.prepared.project.paletteConfiguration.palettes[0].entries[0].color.r).toBe(13);
        expect(result.draft.activePalettes[0].entries[0].color.g).toBe(17);
    });

    it.each([null, ''])('keeps legacy saved cells with no sourceMode and source %s rather than producing an empty image', async imageSrc => {
        const input = draft({ imageSrc }); delete input.sourceMode;
        expect(parseEditorProject(projectFile(input))).not.toBeNull();
        const result = await prepareEditorProjectFile(input, new AbortController().signal, options());
        expect(result.draft.sourceMode).toBe('blank');
        expect(result.draft.imageSrc).toBeNull();
        expect(result.prepared.pixels).toEqual(pixels());
        expect(result.sourceKey).toBeNull();
        expect(input.sourceMode).toBeUndefined();
    });

    it.each(BOARD_OPTIONS)('$id uses the actual board dimensions for a new zero-filled blank grid', async board => {
        const input = draft({ boardId: board.id, boardWidth: 2, boardHeight: 3, editedPattern: null });
        const result = await prepareEditorProjectFile(input, new AbortController().signal, options());
        expect(result.prepared.width).toBe(board.beadsPerRow * 2);
        expect(result.prepared.height).toBe(board.beadsPerRow * 3);
        expect(result.prepared.pixels).toEqual(new Uint8ClampedArray(board.beadsPerRow ** 2 * 2 * 3 * 4));
    });

    it('uses the existing maximum project-grid budget rather than the smaller automatic-recovery budget', async () => {
        const input = draft({ boardId: 'mini', boardWidth: 20, boardHeight: 20, editedPattern: null });
        const result = await prepareEditorProjectFile(input, new AbortController().signal, options());
        expect(result.prepared.width).toBe(1140);
        expect(result.prepared.height).toBe(1140);
        expect(result.draft.editedPattern!.byteLength).toBe(EDITOR_PROJECT_PATTERN_MAX_BYTES);
        expect(result.draft.editedPattern!.byteLength).toBeGreaterThan(1_500_000);
        const stored = decodeEditorPatternDraft(result.draft.editedPattern)!;
        expect(Buffer.from(stored).equals(Buffer.from(result.prepared.pixels))).toBe(true);
        expect(input.editedPattern).toBeNull();
    });

    it('rejects parser-accepted saved-grid/board contradictions before palette loading or image work', async () => {
        const input = draft({ boardWidth: 2, activePalettes: [] }), seams = options(), prepareImage = vi.fn();
        expect(parseEditorProject(projectFile(input))).not.toBeNull();
        await expect(prepareEditorProjectFile(input, new AbortController().signal, { ...seams, prepareImage })).rejects.toThrow('Invalid bead-pattern project.');
        expect(seams.loadPalette).not.toHaveBeenCalled();
        expect(seams.createBlankImage).not.toHaveBeenCalled();
        expect(prepareImage).not.toHaveBeenCalled();
    });

    it('rejects contradictory explicit modes without silently throwing away a retained source or saved cells', async () => {
        for (const input of [draft({ sourceMode: 'blank', imageSrc: validImage }), draft({ sourceMode: 'image', imageSrc: null }), draft({ sourceMode: 'image', imageSrc: '' })]) {
            const before = projectFile(input);
            expect(parseEditorProject(before)).not.toBeNull();
            await expect(prepareEditorProjectFile(input, new AbortController().signal, options())).rejects.toThrow('Invalid bead-pattern project.');
            expect(projectFile(input)).toBe(before);
        }
    });

    it('decodes an image before accepting its saved cells, without requantizing hidden RGB or alpha', async () => {
        const surface = browserSurface(), input = draft({ sourceMode: 'image', imageSrc: validImage,
            sourceCrop: { sourceWidth: 4, sourceHeight: 2, x: 1, y: 0, width: 2, height: 2 }, maxBeadColors: 1,
            sourceBackground: { color: { r: 255, g: 255, b: 255 }, tolerance: 10, mode: 'edge-connected' } });
        const before = projectFile(input);
        const result = await prepareEditorProjectFile(input, new AbortController().signal, options());
        expect(surface.decoded).toEqual([validImage]);
        expect(quantizePattern).not.toHaveBeenCalled();
        expect(surface.draw).not.toHaveBeenCalled();
        expect(surface.read).not.toHaveBeenCalled();
        expect(result.prepared.pixels).toEqual(pixels());
        expect(result.prepared.project.srcWidth).toBe(4);
        expect(result.prepared.project.srcHeight).toBe(2);
        expect(result.sourceKey).toBe(getEditorProjectSourceKey(input));
        expect(projectFile(input)).toBe(before);
        expect(surface.created.every(canvas => canvas.width === 0 && canvas.height === 0)).toBe(true);
    });

    it.each([false, true])('rejects a parser-accepted unreadable image before publication (saved cells: %s)', async withCells => {
        const surface = browserSurface(), input = draft({ sourceMode: 'image', imageSrc: brokenImage, editedPattern: withCells ? draft().editedPattern : null });
        const before = projectFile(input);
        expect(parseEditorProject(before)).not.toBeNull();
        await expect(prepareEditorProjectFile(input, new AbortController().signal, options())).rejects.toThrow('Unable to load selected image.');
        expect(surface.decoded).toEqual([brokenImage]);
        expect(surface.created).toHaveLength(0);
        expect(quantizePattern).not.toHaveBeenCalled();
        expect(projectFile(input)).toBe(before);
    });

    it('continues supporting legacy image-only files and loads missing palettes before detached conversion', async () => {
        const surface = browserSurface(), input = draft({ sourceMode: undefined, imageSrc: validImage, editedPattern: null, activePalettes: [], selectedPaletteIds: ['perler', 'hama'] });
        const shared = palette('Loaded shared palette'), loadPalette = vi.fn(async () => shared), signal = new AbortController().signal;
        expect(parseEditorProject(projectFile(input))).not.toBeNull();
        const result = await prepareEditorProjectFile(input, signal, { ...options(), loadPalette });
        expect(loadPalette.mock.calls).toEqual([['perler', signal], ['hama', signal]]);
        expect(result.draft.sourceMode).toBe('image');
        expect(surface.decoded).toEqual([validImage]);
        expect(quantizePattern).toHaveBeenCalledOnce();
        expect(result.prepared.pixels).toEqual(pixels());
        expect(result.draft.activePalettes).toHaveLength(2);
        expect(decodeEditorPatternDraft(result.draft.editedPattern)).toEqual(result.prepared.pixels);
        expect(input.editedPattern).toBeNull();
        expect(saveEditorDraft(result.draft)).toBe(true);
        const stored = loadEditorDraft()!;
        expect(stored).not.toBeNull();
        expect(decodeEditorPatternDraft(stored.editedPattern)).toEqual(result.prepared.pixels);
        const reopened = await prepareEditorProjectFile(stored, new AbortController().signal, options());
        expect(reopened.prepared.pixels).toEqual(result.prepared.pixels);
        expect(quantizePattern).toHaveBeenCalledOnce();
        shared.entries[0].color.r = 222;
        expect(result.draft.activePalettes[0].entries[0].color.r).toBe(13);
        expect(result.prepared.project.paletteConfiguration.palettes[0].entries[0].color.r).toBe(13);
        expect(input.activePalettes).toEqual([]);
        expect(surface.created.every(canvas => canvas.width === 0 && canvas.height === 0)).toBe(true);
    });

    it('rejects an abort before work and after a late palette result without starting image preparation', async () => {
        const stopped = new AbortController(); stopped.abort(); const seams = options();
        await expect(prepareEditorProjectFile(draft(), stopped.signal, seams)).rejects.toMatchObject({ name: 'AbortError' });
        expect(seams.createBlankImage).not.toHaveBeenCalled();
        const job = deferred<Palette>(), task = new AbortController(), loadPalette = vi.fn(() => job.promise), prepareImage = vi.fn();
        const input = draft({ sourceMode: 'image', imageSrc: validImage, activePalettes: [], selectedPaletteIds: ['perler', 'hama'] });
        const pending = prepareEditorProjectFile(input, task.signal, { ...options(), loadPalette, prepareImage });
        task.abort(); job.resolve(palette());
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(loadPalette).toHaveBeenCalledOnce();
        expect(prepareImage).not.toHaveBeenCalled();
    });

    it('rejects a late image result after abort and never changes the caller draft', async () => {
        const task = new AbortController(), job = deferred<PreparedSourceImage>(), input = draft({ sourceMode: 'image', imageSrc: validImage });
        const before = projectFile(input);
        let prepared!: PreparedSourceImage;
        const prepareImage: typeof prepareSourceImagePattern = vi.fn(async args => {
            prepared = { project: args.project, pixels: args.restoredPixels!, width: args.width, height: args.height };
            return job.promise;
        });
        const pending = prepareEditorProjectFile(input, task.signal, { ...options(), prepareImage });
        task.abort(); job.resolve(prepared);
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(projectFile(input)).toBe(before);
    });

    it('captures owned input before an asynchronous palette load and propagates loader failure without mutation', async () => {
        const input = draft({ activePalettes: [] }), job = deferred<Palette>(), loadPalette = vi.fn(() => job.promise);
        const pending = prepareEditorProjectFile(input, new AbortController().signal, { ...options(), loadPalette });
        input.fileName = 'changed-after-start'; input.rendererSettings.showGrid = true;
        job.resolve(palette());
        const result = await pending;
        expect(result.draft.fileName).toBe('my-pattern');
        expect(result.draft.rendererSettings.showGrid).toBe(false);
        const failing = draft({ activePalettes: [] }), before = projectFile(failing);
        await expect(prepareEditorProjectFile(failing, new AbortController().signal, { ...options(), loadPalette: async () => { throw new Error('Palette unavailable'); } })).rejects.toThrow('Palette unavailable');
        expect(projectFile(failing)).toBe(before);
    });
});

function liveSourceKey(input: EditorDraft): string {
    const filename = 'src/components/editor/Editor.tsx', text = readFileSync(filename, 'utf8');
    const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let callback: ts.Expression | undefined;
    function visit(node: ts.Node) {
        if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'sourceProcessingKey' && node.initializer && ts.isCallExpression(node.initializer)) callback = node.initializer.arguments[0];
        ts.forEachChild(node, visit);
    }
    visit(source);
    expect(callback, 'Actual Editor source identity callback must remain in this contract test').toBeDefined();
    const js = ts.transpileModule(`const callback = ${callback!.getText(source)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
    const names = ['boardId', 'boardWidth', 'boardHeight', 'matchingId', 'ditheringId', 'imageAdjustments', 'rendererSettings', 'maxBeadColors', 'sourceBackground', 'normalizeSourceCrop', 'normalizeSourceBackground'];
    const values = [input.boardId, input.boardWidth, input.boardHeight, input.matchingId, input.ditheringId, input.imageAdjustments, input.rendererSettings, input.maxBeadColors ?? null, input.sourceBackground ?? null, normalizeSourceCrop, normalizeSourceBackground];
    const actual = new Function(...names, js + '\nreturn callback;')(...values) as (crop: EditorDraft['sourceCrop']) => string;
    return actual(input.sourceCrop ?? null);
}

describe('accepted source identity', () => {
    it('matches the actual Editor callback byte for byte for omitted/null/crop/color-limit/background fields', () => {
        const image = draft({ sourceMode: 'image', imageSrc: validImage });
        const variants: EditorDraft[] = [image, { ...image, maxBeadColors: null, sourceCrop: null, sourceBackground: null },
            { ...image, maxBeadColors: 7 },
            { ...image, sourceCrop: { sourceWidth: 80, sourceHeight: 60, x: 0, y: 0, width: 80, height: 60 } },
            { ...image, sourceCrop: { sourceWidth: 80, sourceHeight: 60, x: 17, y: 9, width: 30, height: 20 } },
            { ...image, sourceBackground: { color: { r: 255, g: 128, b: 42 }, tolerance: 24, mode: 'edge-connected' } },
            { ...image, maxBeadColors: 13, sourceBackground: { color: { r: 19, g: 31, b: 43 }, tolerance: 0, mode: 'all-matching' }, imageAdjustments: { grayscale: 3, saturation: 80, contrast: 120, brightness: 105 } },
        ];
        for (const input of variants) expect(getEditorProjectSourceKey(input)).toBe(liveSourceKey(input));
        expect(getEditorProjectSourceKey(draft())).toBeNull();
    });
});

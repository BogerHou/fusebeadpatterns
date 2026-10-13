import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Palette } from '../core/model/palette/palette.model';
import { computeUsage, countBeads } from '../core/utils/utils';
import { getBoardOption, getPaletteOption, PALETTE_OPTIONS, parsePaletteCsv } from '../editor/config';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { consumeEditorLocaleDraft, saveEditorLocaleDraft } from '../editor/locale-navigation';
import { buildEditorProject } from '../editor/project';
import { localeRoutes } from '../i18n/routes';
import { createGrid, type RgbaSource } from './core';
import { convertPixelGridToBeads } from './bead-conversion';

function loadPalette(id: string): Palette {
    const option = getPaletteOption(id)!;
    return parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option);
}

/** Independent squared-RGB oracle; does not call the production color matcher. */
function expectedPixel(source: readonly number[] | Uint8ClampedArray, palette: Palette): number[] {
    if (source[3] === 0) return Array.from(source);
    const [r, g, b] = Array.from(source.slice(0, 3), (channel) => Math.round((channel * source[3] + 255 * (255 - source[3])) / 255));
    const candidates = palette.entries.filter((entry) => entry.enabled && entry.color.a === 255);
    let nearest = candidates[0];
    let cost = Infinity;
    for (const candidate of candidates) {
        const distance = (candidate.color.r - r) ** 2 + (candidate.color.g - g) ** 2 + (candidate.color.b - b) ** 2;
        if (distance < cost) { cost = distance; nearest = candidate; }
    }
    return [nearest.color.r, nearest.color.g, nearest.color.b, 255];
}

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('one pixel to one real brand bead', () => {
    it.each([
        { id: 'perler', board: 29, width: 58, height: 29 },
        { id: 'hama', board: 29, width: 58, height: 29 },
        { id: 'artkal_s', board: 50, width: 50, height: 50 },
        { id: 'perler_mini', board: 57, width: 57, height: 57 },
    ])('pads a non-square 37×23 grid at the right/bottom only: $id', async ({ id, board, width, height }) => {
        const grid = createGrid(37, 23);
        const samples = [[230, 33, 71, 255], [41, 187, 224, 128], [77, 12, 91, 0], [255, 195, 16, 254], [2, 4, 8, 1]];
        for (let y = 0; y < grid.height; y++) for (let x = 0; x < grid.width; x++) grid.pixels.set(samples[(x * 3 + y) % samples.length], (y * grid.width + x) * 4);
        const before = grid.pixels.slice();
        const palette = loadPalette(id);
        const result = await convertPixelGridToBeads({ grid, paletteId: id, palette });
        expect(result.layout).toEqual({ sourceWidth: 37, sourceHeight: 23, patternWidth: width, patternHeight: height, boardSize: board, boardWidth: width / board, boardHeight: height / board, boardCount: width * height / board ** 2 });
        const pixels = decodeEditorPatternDraft(result.draft.editedPattern)!;
        const expected = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < 23; y++) for (let x = 0; x < 37; x++) {
            expected.set(expectedPixel(before.slice((y * 37 + x) * 4, (y * 37 + x) * 4 + 4), palette), (y * width + x) * 4);
        }
        expect(Buffer.from(pixels).equals(Buffer.from(expected))).toBe(true);
        expect(grid.pixels).toEqual(before);
        expect(countBeads(computeUsage(pixels, result.draft.activePalettes))).toBe(Array.from({ length: 37 * 23 }, (_, index) => before[index * 4 + 3]).filter(Boolean).length);
        expect(result.draft).toMatchObject({ fileName: 'pixel-37x23', sourceMode: 'blank', imageSrc: null, sourceCrop: null, maxBeadColors: null, selectedPaletteIds: [id], matchingId: 'euclidean', ditheringId: 'none', pdfPaperSize: 'a4' });
    });

    it.each([
        { id: 'perler', size: 29, count: 5 },
        { id: 'artkal_s', size: 50, count: 3 },
        { id: 'perler_mini', size: 57, count: 3 },
    ])('retains all 16,384 cells at 128×128 with $id', async ({ id, size, count }) => {
        const grid = createGrid(128, 128);
        for (let offset = 0; offset < grid.pixels.length; offset += 4) grid.pixels.set([19, 118, 214, 255], offset);
        const palette = loadPalette(id);
        const { draft, layout } = await convertPixelGridToBeads({ grid, paletteId: id, palette });
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        const width = size * count;
        expect(layout.patternWidth).toBe(width);
        expect(layout.patternHeight).toBe(width);
        expect(layout.boardCount).toBe(count ** 2);
        expect(countBeads(computeUsage(pixels, draft.activePalettes))).toBe(16_384);
        const expected = expectedPixel([19, 118, 214, 255], palette);
        expect(Array.from(pixels.slice((127 * width + 127) * 4, (127 * width + 128) * 4))).toEqual(expected);
        expect(Array.from(pixels.slice((127 * width + 128) * 4, (127 * width + 129) * 4))).toEqual([0, 0, 0, 0]);
        expect(Array.from(pixels.slice(128 * width * 4, 128 * width * 4 + 4))).toEqual([0, 0, 0, 0]);
    });

    it.each(PALETTE_OPTIONS)('supports the current $id option without inventing board or brand definitions', async (option) => {
        const palette = loadPalette(option.id);
        const color = palette.entries[0].color;
        const { draft, layout } = await convertPixelGridToBeads({ grid: createGrid(1, 1, [color.r, color.g, color.b, 255]), paletteId: option.id, palette });
        const expectedSize = option.boardId === 'midi' ? 29 : option.boardId === 'mini' ? 57 : 50;
        expect(draft.boardId).toBe(option.boardId);
        expect(draft.selectedPaletteIds).toEqual([option.id]);
        expect(layout.boardSize).toBe(expectedSize);
        expect(layout.boardCount).toBe(1);
        expect(Array.from(decodeEditorPatternDraft(draft.editedPattern)!.slice(0, 4))).toEqual([color.r, color.g, color.b, 255]);
        expect(draft.pdfScaleMode).toBe(option.id === 'perler' || option.id === 'hama' ? 'midi-5mm' : 'fit-page');
    });

    it('rounds fractional alpha over white before matching; alpha zero remains an empty cell with its hidden RGB', async () => {
        const palette = parsePaletteCsv('P1,Exact gray,A,127,127,127\nP2,Near white,B,254,254,254\nP3,Black,C,0,0,0\nP4,Composite,D,127,177,227', getPaletteOption('perler')!);
        const grid = createGrid(5, 1, [0, 0, 0, 128, 0, 0, 0, 1, 0, 0, 0, 255, 0, 100, 200, 128, 81, 23, 179, 0]);
        const { draft } = await convertPixelGridToBeads({ grid, paletteId: 'perler', palette });
        expect(Array.from(decodeEditorPatternDraft(draft.editedPattern)!.slice(0, 20))).toEqual([
            127, 127, 127, 255, 254, 254, 254, 255, 0, 0, 0, 255, 127, 177, 227, 255, 81, 23, 179, 0,
        ]);
    });

    it('ignores disabled and nonopaque matching candidates without changing caller ownership settings', async () => {
        const palette = parsePaletteCsv('P1,Black,A,0,0,0\nP2,Gray,B,100,100,100\nP3,White,C,255,255,255', getPaletteOption('perler')!);
        palette.entries[0].enabled = false;
        palette.entries[1].color.a = 0;
        const before = JSON.stringify(palette);
        const grid = createGrid(1, 1, [0, 0, 0, 255]);
        const { draft } = await convertPixelGridToBeads({ grid, paletteId: 'perler', palette });
        expect(Array.from(decodeEditorPatternDraft(draft.editedPattern)!.slice(0, 4))).toEqual([255, 255, 255, 255]);
        expect(JSON.stringify(palette)).toBe(before);
        expect(JSON.stringify(draft.activePalettes[0])).toBe(before);
        expect(draft.activePalettes[0] === palette).toBe(false);
    });

    it('snapshots input pixels and brand settings before yielding', async () => {
        const palette = loadPalette('perler');
        const first = palette.entries[0].color;
        const expected = [first.r, first.g, first.b, 255];
        const grid = createGrid(1, 1, expected);
        const pending = convertPixelGridToBeads({ grid, paletteId: 'perler', palette });
        grid.pixels.fill(0);
        palette.entries[0].enabled = false;
        palette.entries[0].color.r = 0;
        const { draft } = await pending;
        expect(Array.from(decodeEditorPatternDraft(draft.editedPattern)!.slice(0, 4))).toEqual(expected);
        expect(draft.activePalettes[0].entries[0].enabled).toBe(true);
    });
});

describe('bead project and language recovery', () => {
    it('initializes the exact padded editor dimensions and survives project/four-language recovery', async () => {
        const grid = createGrid(37, 23);
        grid.pixels.set([33, 146, 223, 255], (22 * 37 + 36) * 4);
        const { draft } = await convertPixelGridToBeads({ grid, paletteId: 'hama', palette: loadPalette('hama') });
        const restored = parseEditorProject(serializeEditorProject(draft))!;
        expect(restored).toEqual(JSON.parse(JSON.stringify(draft)));
        const project = buildEditorProject({ ...restored, palettes: restored.activePalettes, boardOption: getBoardOption(restored.boardId)! });
        expect(project.boardConfiguration.board.nbBeadPerRow * project.boardConfiguration.nbBoardWidth).toBe(restored.editedPattern!.width);
        expect(project.boardConfiguration.board.nbBeadPerRow * project.boardConfiguration.nbBoardHeight).toBe(restored.editedPattern!.height);
        const values = new Map<string, string>();
        const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
            const href = `https://fusebeadpatterns.art${localeRoutes[locale].editor}`;
            expect(saveEditorLocaleDraft(restored, href, storage, 1000)).toBe(true);
            const recovered = consumeEditorLocaleDraft(href, storage, 1001)!;
            expect(recovered.draft).toEqual(restored);
            expect(recovered.draft.editedPattern!.data).toBe(draft.editedPattern!.data);
        }
    });
});

describe('input and cancellation atomicity', () => {
    it('rejects invalid dimensions/channels and brand mixtures without touching source or starting a worker', async () => {
        const palette = loadPalette('perler');
        const grid = createGrid(1, 1, [1, 2, 3, 255]);
        const before = JSON.stringify({ grid: Array.from(grid.pixels), palette });
        const workerFactory = vi.fn();
        for (const invalid of [
            { paletteId: 'unknown' },
            { palette: loadPalette('hama') },
            { palette: { ...palette, entries: [...palette.entries, loadPalette('hama').entries[0]] } },
            { palette: { ...palette, entries: palette.entries.map((entry) => ({ ...entry, enabled: false })) } },
            { palette: { ...palette, entries: palette.entries.map((entry) => ({ ...entry, color: { ...entry.color, a: 0 } })) } },
            { palette: { ...palette, entries: [{ ...palette.entries[0], color: { ...palette.entries[0].color, r: NaN } }] } },
            { grid: { ...grid, width: 129 } },
            { grid: { ...grid, height: 0 } },
            { grid: { ...grid, width: 1.5 } },
            { grid: { ...grid, pixels: [1, 2, 3] } },
            { grid: { ...grid, pixels: [1, 2, 3, 256] } },
            { grid: { width: 1, height: 1 } },
        ]) {
            await expect(convertPixelGridToBeads({ grid, paletteId: 'perler', palette, ...invalid } as Parameters<typeof convertPixelGridToBeads>[0], { workerFactory })).rejects.toThrow();
        }
        expect(workerFactory).not.toHaveBeenCalled();
        expect(JSON.stringify({ grid: Array.from(grid.pixels), palette })).toBe(before);
    });

    it('allows a fully empty grid without inventing beads', async () => {
        const grid: RgbaSource = { width: 1, height: 1, pixels: new Uint8Array([23, 45, 67, 0]) };
        const { draft } = await convertPixelGridToBeads({ grid, paletteId: 'hama', palette: loadPalette('hama') });
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        expect(Array.from(pixels.slice(0, 4))).toEqual([23, 45, 67, 0]);
        expect(countBeads(computeUsage(pixels, draft.activePalettes))).toBe(0);
    });

    it('cancels before starting and during cooperative fallback without returning a partial project', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('Worker', undefined);
        let time = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => (time += 8));
        const input = { grid: createGrid(128, 128), paletteId: 'perler', palette: loadPalette('perler') };
        input.grid.pixels.fill(255);
        const before = input.grid.pixels.slice();
        const cancelled = new AbortController(); cancelled.abort();
        await expect(convertPixelGridToBeads(input, { signal: cancelled.signal })).rejects.toMatchObject({ name: 'AbortError' });
        const controller = new AbortController();
        const pending = convertPixelGridToBeads(input, { signal: controller.signal });
        const outcome = pending.then(() => 'resolved', (error: Error) => error.name);
        await vi.advanceTimersToNextTimerAsync();
        controller.abort();
        await vi.runAllTimersAsync();
        expect(await outcome).toBe('AbortError');
        expect(Buffer.from(input.grid.pixels).equals(Buffer.from(before))).toBe(true);
    });
});

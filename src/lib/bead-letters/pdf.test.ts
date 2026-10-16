import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { getLetterPalettes } from './data';
import { buildLetterProject, defaultLetterState } from './project';
import { createLetterPdf, letterPdfJapaneseCharacters, letterPdfLayout } from './pdf';
import type { LetterState } from './types';

const fontLoader = vi.hoisted(() => vi.fn<() => Promise<string>>());
vi.mock('../core/printer/pdf/japanese-font', async importOriginal => {
    const actual = await importOriginal<typeof import('../core/printer/pdf/japanese-font')>();
    return { ...actual, loadJapaneseExportFont: fontLoader };
});
const font = readFileSync('public/fonts/fuse-bead-japanese/FuseBeadJapanese-Regular.ttf').toString('base64');
const palettes = getLetterPalettes();
function state(patch: Partial<LetterState> = {}): LetterState { return { ...defaultLetterState(palettes), ...patch }; }

function readPdf(bytes: Uint8Array) {
    const raw = Buffer.from(bytes).toString('latin1'), objects = new Map<number, string>();
    for (const match of raw.matchAll(/(\d+) 0 obj\n([\s\S]*?)\nendobj/g)) objects.set(Number(match[1]), match[2]);
    const pages = [...objects.values()].filter(value => /\/Type \/Page\b/.test(value)).map(value => {
        const size = value.match(/\/MediaBox \[([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)\]/)!;
        const contents = objects.get(Number(value.match(/\/Contents (\d+) 0 R/)![1]))!;
        return { width: Number(size[3]), height: Number(size[4]), stream: contents.match(/stream\n([\s\S]*?)\nendstream/)![1] };
    });
    return { raw, pages };
}
const mm = (value: number) => value * 72 / 25.4;
function chartFills(stream: string, topMm: number, cellMm: number) {
    const number = '([-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+))';
    const expression = new RegExp(`${number} ${number} ${number} ${number} re\\s+f\\b`, 'g');
    return [...stream.matchAll(expression)].map(match => match.slice(1, 5).map(Number)).filter(rect =>
        Math.abs(rect[2] - mm(cellMm)) < 0.0001 && Math.abs(rect[3] + mm(cellMm)) < 0.0001
        && rect[1] <= mm(297 - topMm) + 100); // actual expected count below excludes legend's 6-mm swatches
}

describe('letter PDF logical page planning', () => {
    it('fits a 23x21 chart on one A4 or Letter page, with materials and readable cells', () => {
        for (const paper of ['a4', 'letter'] as const) {
            const layout = letterPdfLayout(23, 21, paper);
            expect(layout.pageCount).toBe(1);
            expect(layout.tiles).toEqual([]);
            expect(layout.overview.cellMm).toBeGreaterThanOrEqual(3.5);
            expect(layout.overview.top).toBe(103);
            expect(layout.overview.left).toBeGreaterThanOrEqual(24);
            expect(layout.overview.top + layout.overview.cellMm * 21).toBeLessThanOrEqual(layout.heightMm - 38 + 1e-8);
        }
    });

    it('adds 40x48 reading tiles only when the complete chart falls below 3.5 mm', () => {
        const layout = letterPdfLayout(128, 106, 'letter');
        expect(layout.pageCount).toBe(13);
        expect(layout.tiles.map(tile => [tile.x, tile.y, tile.width, tile.height])).toEqual([
            [0, 0, 40, 48], [40, 0, 40, 48], [80, 0, 40, 48], [120, 0, 8, 48],
            [0, 48, 40, 48], [40, 48, 40, 48], [80, 48, 40, 48], [120, 48, 8, 48],
            [0, 96, 40, 10], [40, 96, 40, 10], [80, 96, 40, 10], [120, 96, 8, 10],
        ]);
        const visits = new Uint8Array(128 * 106);
        for (const tile of layout.tiles) for (let y = tile.y; y < tile.y + tile.height; y++) for (let x = tile.x; x < tile.x + tile.width; x++) visits[y * 128 + x]++;
        expect(visits.every(value => value === 1)).toBe(true);
    });

    it('rejects out-of-bounds dimensions, unsupported paper and a legend that cannot be planned', () => {
        for (const [w, h] of [[0, 1], [129, 1], [NaN, 1], [1.5, 2]]) expect(() => letterPdfLayout(w, h, 'a4')).toThrow();
        expect(() => letterPdfLayout(1, 1, 'legal' as 'a4')).toThrow();
        for (const height of [NaN, 0, 81]) expect(() => letterPdfLayout(5, 7, 'a4', height)).toThrow();
    });
});

describe('actual letter PDF bytes and preserved source', () => {
    it('places title, real Perler colors, counts, actual 23x21 grid and instructions together on one page', async () => {
        fontLoader.mockClear();
        const input = state({ text: 'HI\nBYE', letterSpacing: 2, lineSpacing: 3, padding: 2 });
        const result = buildLetterProject(input, palettes), before = JSON.stringify(result);
        expect([result.grid.width, result.grid.height]).toEqual([23, 21]);
        const pdf = readPdf(await createLetterPdf(result, input, 'en'));
        expect(pdf.pages).toHaveLength(1);
        expect(pdf.raw.startsWith('%PDF-')).toBe(true);
        expect(pdf.raw).toContain('/Lang (en)');
        expect(pdf.raw).toContain('/PrintScaling /None');
        expect(pdf.pages[0].width).toBeCloseTo(mm(210), 2);
        expect(pdf.pages[0].height).toBeCloseTo(mm(297), 2);
        for (const text of ['Bead letter chart', 'Perler Midi', 'Grid: 23 x 21', '80-19018', 'Black', '80-19001', 'White',
            '1 cell = 1 bead', 'not a 5 mm actual-size template']) expect(pdf.raw).toContain(text);
        for (const entry of result.usage) expect(pdf.pages[0].stream).toContain(`(${entry.count})`);
        const plan = letterPdfLayout(23, 21, 'a4');
        expect(chartFills(pdf.pages[0].stream, plan.overview.top, plan.overview.cellMm)).toHaveLength(23 * 21);
        expect(pdf.raw).not.toContain('/FontFile2'); // ordinary chart does not load/embed MonoFont
        expect(fontLoader).not.toHaveBeenCalled();
        expect(JSON.stringify(result)).toBe(before);
    });

    it('omits transparent cells instead of counting or painting them as white beads', async () => {
        const input = state({ text: 'I', padding: 0, backgroundEnabled: false });
        const result = buildLetterProject(input, palettes), pdf = readPdf(await createLetterPdf(result, input, 'en'));
        const plan = letterPdfLayout(5, 7, 'a4', 16);
        expect(pdf.pages).toHaveLength(1);
        expect(chartFills(pdf.pages[0].stream, plan.overview.top, 8)).toHaveLength(15);
        expect(pdf.raw).toContain('(80-19018)');
        expect(pdf.raw).not.toContain('(80-19001)');
        expect(pdf.raw).toContain('Empty cells use no beads');
    });

    it('writes exact Letter dimensions and selected locale without pad-only board pages', async () => {
        const input = state({ text: 'I', paletteId: 'artkal_s', foregroundRef: 'S13', backgroundRef: 'S01', paper: 'letter' });
        const result = buildLetterProject(input, palettes), pdf = readPdf(await createLetterPdf(result, input, 'fr'));
        expect(result.draft.editedPattern?.width).toBe(50);
        expect(pdf.pages).toHaveLength(1);
        expect(pdf.pages[0].width).toBeCloseTo(612, 4); expect(pdf.pages[0].height).toBeCloseTo(792, 4);
        expect(pdf.raw).toContain('/Lang (fr-FR)');
        expect(pdf.raw).toContain('(S13)'); expect(pdf.raw).toContain('(S01)');
        expect(pdf.raw).toContain('7 x 9');
        expect(pdf.raw).toContain('50 x 50');
        expect(pdf.raw).not.toContain('0-0');
    });

    it('snapshots input, chosen paper, palette and RGBA before its first await', async () => {
        const input = state({ text: 'I', padding: 0 }), result = buildLetterProject(input, palettes);
        const pending = createLetterPdf(result, input, 'en');
        input.text = 'L'; input.paper = 'letter'; result.palette.label = 'changed';
        (result.grid.pixels as Uint8ClampedArray).fill(0);
        const pdf = readPdf(await pending);
        expect(pdf.pages[0].width).toBeCloseTo(mm(210), 2);
        expect(pdf.raw).toContain('Grid: 5 x 7'); expect(pdf.raw).toContain('Perler Midi'); expect(pdf.raw).not.toContain('changed');
        expect(chartFills(pdf.pages[0].stream, 103, 8)).toHaveLength(35);
    });

    it('produces complete logical-grid tiles with global row/column ranges and 4-mm cells', async () => {
        const input = state({ text: Array(8).fill('I'.repeat(24)).join('\n'), letterSpacing: 0, lineSpacing: 6, padding: 4, paper: 'letter' });
        const result = buildLetterProject(input, palettes);
        expect([result.grid.width, result.grid.height]).toEqual([128, 106]);
        const pdf = readPdf(await createLetterPdf(result, input, 'en'));
        expect(pdf.pages).toHaveLength(13);
        expect(pdf.pages[1].stream).toContain('(Tile 1-1 / Grid: 128 x 106)');
        expect(pdf.pages[1].stream).toContain('(Rows 1-48 / Columns 1-40)');
        expect(pdf.pages[12].stream).toContain('(Rows 97-106 / Columns 121-128)');
        expect(pdf.pages.slice(1).reduce((sum, page) => sum + chartFills(page.stream, 48, 4).length, 0)).toBe(128 * 106);
        for (const page of pdf.pages) expect([page.width, page.height]).toEqual([612, 792]);
    });

    it('reuses the unchanged Japanese font and verifies the actual cmap for all new labels', async () => {
        fontLoader.mockResolvedValue(font); fontLoader.mockClear();
        const input = state({ text: 'HI' });
        const pdf = readPdf(await createLetterPdf(buildLetterProject(input, palettes), input, 'ja'));
        expect(fontLoader).toHaveBeenCalledOnce();
        expect(pdf.pages).toHaveLength(1); expect(pdf.raw).toContain('/Lang (ja)');
        expect(pdf.raw).toContain('/ToUnicode'); expect(pdf.raw).toContain('/FontFile2');
        expect(letterPdfJapaneseCharacters()).toContain('パレット');
        expect(letterPdfJapaneseCharacters()).not.toContain('計');
    });

    it('uses the existing MonoFont only for a selected real Artkal Greek symbol, preserving its Unicode mapping', async () => {
        const input = state({ text: 'I', paletteId: 'artkal_s', foregroundRef: 'SP1', backgroundRef: 'S01', backgroundEnabled: false });
        const result = buildLetterProject(input, palettes);
        expect(result.usage[0].color).toMatchObject({ ref: 'SP1', name: 'Pearlescent Green', symbol: 'Α', prefix: 'AS', r: 147, g: 202, b: 135 });
        const pdf = readPdf(await createLetterPdf(result, input, 'en'));
        expect(pdf.pages).toHaveLength(1); expect(pdf.raw).toContain('(SP1)');
        expect(pdf.raw).toContain('/FontFile2'); expect(pdf.raw).toMatch(/<[^>]+><0391>/i);
    });

    it('rejects stale visible grid bytes, invalid language and missing Japanese font before output', async () => {
        const input = state(), result = buildLetterProject(input, palettes);
        (result.grid.pixels as Uint8ClampedArray)[0] = 99;
        await expect(createLetterPdf(result, input, 'en')).rejects.toThrow('INVALID_PROJECT');
        await expect(createLetterPdf(buildLetterProject(input, palettes), input, 'xx' as 'en')).rejects.toThrow('INVALID_OPTIONS');
        fontLoader.mockRejectedValueOnce(new Error('font unavailable'));
        await expect(createLetterPdf(buildLetterProject(input, palettes), input, 'ja')).rejects.toThrow('font unavailable');
    });

    it('stops before loading and when aborted during Japanese font loading', async () => {
        const input = state(), result = buildLetterProject(input, palettes), first = new AbortController(); first.abort();
        fontLoader.mockClear();
        await expect(createLetterPdf(result, input, 'ja', first.signal)).rejects.toMatchObject({ name: 'AbortError' });
        expect(fontLoader).not.toHaveBeenCalled();
        let resolveFont: ((value: string) => void) | undefined;
        fontLoader.mockImplementationOnce(() => new Promise(resolve => { resolveFont = resolve; }));
        const controller = new AbortController(), pending = createLetterPdf(result, input, 'ja', controller.signal);
        const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        controller.abort(); resolveFont!(font); await rejected;
    });
});

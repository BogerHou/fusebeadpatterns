import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SiteLocale } from '../../../i18n/locales';
import type { BoardSelection } from '../../../editor/board-materials';
import { decodeEditorPatternDraft, parseEditorProject } from '../../../editor/draft';
import { PDF_PAPER_DIMENSIONS, type PdfPaperSize } from '../../../editor/pdf-paper';
import { Color } from '../../model/color/color.model';
import { Palette, PaletteEntry } from '../../model/palette/palette.model';
import type { Project } from '../../model/project/project.model';
import { computeUsage } from '../../utils/utils';
import { downloadBlob } from '../download';
import { boardPosition, exportMessages } from '../messages';
import { PdfPrinter } from './pdf.printer';

vi.mock('../download', () => ({ downloadBlob: vi.fn() }));
const font = readFileSync('public/fonts/fuse-bead-japanese/FuseBeadJapanese-Regular.ttf');
const mm = (points: number) => points * 25.4 / 72;

function inspect(contents: string) {
    const objects = new Map([...contents.matchAll(/(?:^|\n)(\d+) 0 obj\n([\s\S]*?)\nendobj/g)].map(([, id, value]) => [id, value]));
    const maps = new Map<string, Map<string, string>>();
    for (const [, name, id] of contents.matchAll(/\/(F\d+) (\d+) 0 R/g)) {
        const cmapId = objects.get(id)?.match(/\/ToUnicode (\d+) 0 R/)?.[1];
        if (!cmapId) continue;
        const map = new Map<string, string>();
        for (const block of objects.get(cmapId)!.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
            for (const [, glyph, unicode] of block[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>/gi)) {
                map.set(glyph.toLowerCase(), String.fromCharCode(...(unicode.match(/.{4}/g) ?? []).map(value => parseInt(value, 16))));
            }
        }
        maps.set(name, map);
    }
    return [...objects.values()].filter(value => /\/Type \/Page\s/.test(value)).map(page => {
        const box = page.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/)!;
        const streamId = page.match(/\/Contents (\d+) 0 R/)![1];
        const stream = objects.get(streamId)!.match(/\nstream\n([\s\S]*?)\nendstream/)![1];
        let currentFont = '', text = '';
        for (const token of stream.matchAll(/\/(F\d+) [\d.]+ Tf|<([0-9a-f]+)> Tj|\(((?:\\.|[^\\)])*)\) Tj/gi)) {
            if (token[1]) currentFont = token[1];
            else if (token[2]) text += (token[2].match(/.{4}/g) ?? []).map(glyph => maps.get(currentFont)?.get(glyph.toLowerCase()) ?? '?').join('') + '\n';
            else text += token[3].replace(/\\([\\()])/g, '$1') + '\n';
        }
        return { width: mm(Number(box[1])), height: mm(Number(box[2])), stream, text };
    });
}
function rectangles(stream: string, height: number) {
    return [...stream.matchAll(/([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) re\n([SB])/g)].map(([, x, y, w, h, paint]) => ({
        x: mm(Number(x)), y: height - mm(Number(y)), width: mm(Number(w)), height: -mm(Number(h)), filled: paint === 'B',
    }));
}
function fixture(size = 29, symbols = true, colors = 2) {
    const entries = Array.from({ length: colors }, (_, i) => {
        const entry = new PaletteEntry(`Color ${i}`, new Color(i + 1, 0, 0, 255));
        entry.ref = `C${i + 1}`; entry.symbol = String.fromCharCode(65 + i); entry.prefix = 'P';
        return entry;
    });
    const project = {
        boardConfiguration: { board: { nbBeadPerRow: size }, nbBoardWidth: 3, nbBoardHeight: 2 },
        paletteConfiguration: { palettes: [new Palette('Hama Midi', entries)] },
        exportConfiguration: { useSymbols: symbols },
    } as Project;
    const pixels = new Uint8ClampedArray(size ** 2 * 6 * 4);
    // The selected last board has all colors; the first has additional beads.
    entries.forEach((entry, index) => {
        const x = index % size, y = Math.floor(index / size);
        pixels.set([entry.color.r, 0, 0, 255], ((size + y) * size * 3 + size * 2 + x) * 4);
    });
    pixels.set([1, 0, 0, 255], 0);
    return { project, pixels };
}
async function exported() {
    expect(downloadBlob).toHaveBeenCalledOnce();
    const [blob] = vi.mocked(downloadBlob).mock.calls[0];
    // Standard PDF fonts use single-byte WinAnsi, not UTF-8 (not Blob.text()).
    return inspect(Buffer.from(await blob.arrayBuffer()).toString('latin1'));
}
beforeEach(() => {
    vi.mocked(downloadBlob).mockClear();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(font)));
});
afterEach(() => vi.unstubAllGlobals());

describe('individual board PDF integration with actual jsPDF', () => {
    const cases = (['en', 'de', 'fr', 'ja'] as SiteLocale[]).flatMap(locale =>
        (['a4', 'letter'] as PdfPaperSize[]).flatMap(paper => [29, 57, 50].map(size => ({ locale, paper, size }))));
    it.each(cases)('$locale $paper $size preserves exact selected pixels, global origin, inventory and paper geometry', async ({ locale, paper, size }) => {
        const { project, pixels } = fixture(size);
        const before = pixels.slice();
        await new PdfPrinter().print(pixels, new Map([['deliberately-not-the-board', 9999]]), project, 'selected', { locale, pdfPaperSize: paper, pdfBoard: { row: 1, column: 2 } });
        const pages = await exported();
        expect(pages).toHaveLength(2);
        const copy = exportMessages(locale);
        for (const page of pages) {
            expect(page.width).toBeCloseTo(PDF_PAPER_DIMENSIONS[paper].width, 2);
            expect(page.height).toBeCloseTo(PDF_PAPER_DIMENSIONS[paper].height, 2);
            expect(page.text).toContain(boardPosition(locale, 1, 2));
            expect(page.text).toContain(`${copy.pattern} / ${copy.row} ${size + 1}-${size * 2} / ${copy.column} ${size * 2 + 1}-${size * 3}`);
            expect(page.text).toContain(`${copy.count} 2`);
            expect(page.text).not.toContain('9999');
            for (const rect of rectangles(page.stream, page.height)) {
                expect(rect.x).toBeGreaterThanOrEqual(5 - 1e-7);
                expect(rect.y).toBeGreaterThanOrEqual(5 - 1e-7);
                expect(rect.x + rect.width).toBeLessThanOrEqual(page.width - 5 + 0.01);
                expect(rect.y + rect.height).toBeLessThanOrEqual(page.height - 5 + 0.01);
            }
        }
        expect(pages[0].text).toContain('C1\n'); expect(pages[0].text).toContain('C2\n');
        expect(rectangles(pages[0].stream, pages[0].height).filter(value => value.filled)).toHaveLength(6);
        const grid = rectangles(pages[1].stream, pages[1].height);
        expect(grid).toHaveLength(size ** 2 + 2);
        const beads = grid.filter(value => value.filled);
        expect(beads).toHaveLength(2);
        const cell = (PDF_PAPER_DIMENSIONS[paper].width - 10) / size;
        expect(beads[0].x).toBeCloseTo(5, 6); expect(beads[1].x).toBeCloseTo(5 + cell, 6);
        expect(beads[0].y).toBeCloseTo((PDF_PAPER_DIMENSIONS[paper].height - cell * size) / 2, 6);
        expect(pages[1].text).toContain('A\n'); expect(pages[1].text).toContain('B\n');
        expect(pixels).toEqual(before);
    });

    it.each(['a4', 'letter'] as PdfPaperSize[])('%s retains 5 mm Midi cells and reference output without symbols', async paper => {
        const { project, pixels } = fixture(29, false);
        await new PdfPrinter().print(pixels, new Map(), project, 'midi', { pdfPaperSize: paper, pdfScaleMode: 'midi-5mm', pdfBoard: { row: 1, column: 2 } });
        const pages = await exported();
        expect(rectangles(pages[0].stream, pages[0].height)).toHaveLength(4);
        const grid = rectangles(pages[1].stream, pages[1].height);
        for (const rect of grid) { expect(rect.width).toBeCloseTo(5, 9); expect(rect.height).toBeCloseTo(5, 9); }
        expect(pages[1].text).toContain('C1\n'); expect(pages[1].text).not.toContain('A\n');
    });

    it('keeps every inventory page for more than 30 selected colors', async () => {
        const { project, pixels } = fixture(29, true, 31);
        await new PdfPrinter().print(pixels, new Map([['wrong', 100]]), project, 'many', { pdfBoard: { row: 1, column: 2 } });
        const pages = await exported();
        expect(pages).toHaveLength(3);
        expect(rectangles(pages[0].stream, pages[0].height)).toHaveLength(90);
        expect(rectangles(pages[1].stream, pages[1].height)).toHaveLength(3);
        expect(rectangles(pages[2].stream, pages[2].height).filter(value => value.filled)).toHaveLength(31);
        expect(pages[1].text).toContain('C31\n'); expect(pages[1].text).toContain('Count 31');
    });

    it('exports an empty board as zero materials and a complete empty grid', async () => {
        const { project, pixels } = fixture();
        await new PdfPrinter().print(pixels, new Map([['C1', 999]]), project, 'empty', { pdfBoard: { row: 0, column: 1 } });
        const pages = await exported();
        expect(pages).toHaveLength(2);
        expect(rectangles(pages[0].stream, pages[0].height)).toHaveLength(0);
        expect(rectangles(pages[1].stream, pages[1].height)).toHaveLength(29 ** 2);
        expect(rectangles(pages[1].stream, pages[1].height).filter(value => value.filled)).toHaveLength(0);
        for (const page of pages) expect(page.text).toContain('Count 0');
    });

    it('prints all four original landscape boards with their own 624-bead inventory', async () => {
        const draft = parseEditorProject(readFileSync('public/patterns/original-sunset-mountain-lake/pattern.bead-pattern.json', 'utf8'))!;
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        const project = { boardConfiguration: { board: { nbBeadPerRow: 29 }, nbBoardWidth: 2, nbBoardHeight: 2 }, paletteConfiguration: { palettes: draft.activePalettes }, exportConfiguration: { useSymbols: true } } as Project;
        const usage = computeUsage(pixels, draft.activePalettes);
        for (let i = 0; i < 4; i++) {
            vi.mocked(downloadBlob).mockClear();
            await new PdfPrinter().print(pixels, usage, project, 'landscape', { pdfBoard: { row: Math.floor(i / 2), column: i % 2 } });
            const pages = await exported();
            expect(pages).toHaveLength(2); expect(pages[0].text).toContain('Count 624');
            expect(rectangles(pages[0].stream, pages[0].height)).toHaveLength([6, 5, 4, 7][i] * 3);
            expect(rectangles(pages[1].stream, pages[1].height).filter(value => value.filled)).toHaveLength(624);
        }
    });

    it.each([null, {}, { row: -1, column: 0 }, { row: 2, column: 0 }, { row: 0, column: 3 }, { row: 0.5, column: 0 }])('rejects invalid selection %j before loading a font or downloading', async selection => {
        const { project, pixels } = fixture();
        await expect(new PdfPrinter().print(pixels, new Map(), project, 'bad', { locale: 'ja', pdfBoard: selection as BoardSelection })).rejects.toThrow('Invalid board selection.');
        expect(fetch).not.toHaveBeenCalled(); expect(downloadBlob).not.toHaveBeenCalled();
    });
    it('rejects a dimension mismatch and unsupported actual-size board without a partial download', async () => {
        const { project, pixels } = fixture(57);
        await expect(new PdfPrinter().print(pixels.slice(4), new Map(), project, 'bad', { pdfBoard: { row: 0, column: 0 } })).rejects.toThrow('Invalid board pattern');
        await expect(new PdfPrinter().print(pixels, new Map(), project, 'bad', { pdfScaleMode: 'midi-5mm', pdfBoard: { row: 0, column: 0 } })).rejects.toThrow('5 mm PDF');
        expect(downloadBlob).not.toHaveBeenCalled();
    });
});

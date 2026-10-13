import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { SiteLocale } from '../../i18n/locales';
import type { Project } from '../model/project/project.model';
import { parseEditorProject, decodeEditorPatternDraft } from '../../editor/draft';
import { PDF_PAPER_DIMENSIONS, type PdfPaperSize } from '../../editor/pdf-paper';
import type { PdfScaleMode } from '../../editor/pdf-scale';
import { computeUsage } from '../utils/utils';
import { downloadBlob } from './download';
import { EXPORT_MESSAGES, pdfPrintingInstruction } from './messages';
import { PdfPrinter } from './pdf/pdf.printer';

vi.mock('./download', () => ({ downloadBlob: vi.fn() }));

const locales: SiteLocale[] = ['en', 'de', 'fr', 'ja'];
const modes: PdfScaleMode[] = ['fit-page', 'midi-5mm'];
const font = readFileSync('public/fonts/fuse-bead-japanese/FuseBeadJapanese-Regular.ttf');
const draft = parseEditorProject(readFileSync('public/patterns/original-sunset-mountain-lake/pattern.bead-pattern.json', 'utf8'))!;
const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
const project = {
    boardConfiguration: { board: { nbBeadPerRow: 29 }, nbBoardWidth: 2, nbBoardHeight: 2 },
    paletteConfiguration: { palettes: draft.activePalettes },
    exportConfiguration: { useSymbols: true },
} as Project;
const usage = computeUsage(pixels, project.paletteConfiguration.palettes);
const mm = (points: number) => points * 25.4 / 72;

function pages(contents: string) {
    const objects = new Map(Array.from(contents.matchAll(/(?:^|\n)(\d+) 0 obj\n([\s\S]*?)\nendobj/g), ([, id, value]) => [id, value]));
    return Array.from(objects.values()).filter(value => /\/Type \/Page\s/.test(value)).map(page => {
        const dimensions = page.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/)!;
        const id = page.match(/\/Contents (\d+) 0 R/)![1];
        return { width: mm(Number(dimensions[1])), height: mm(Number(dimensions[2])), stream: objects.get(id)!.match(/\nstream\n([\s\S]*?)\nendstream/)![1] };
    });
}

function rectangles(stream: string, pageHeight: number) {
    return [...stream.matchAll(/([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) re\n([SB])/g)].map(([, x, y, w, h, paint]) => ({
        x: mm(Number(x)), y: pageHeight - mm(Number(y)), width: mm(Number(w)), height: -mm(Number(h)), filled: paint === 'B',
    }));
}

async function print(locale: SiteLocale, mode: PdfScaleMode, paperSize?: PdfPaperSize) {
    await new PdfPrinter().print(pixels, usage, project, 'landscape', { locale, pdfScaleMode: mode, ...(paperSize ? { pdfPaperSize: paperSize } : {}) });
    const [blob, filename] = vi.mocked(downloadBlob).mock.calls.at(-1)!;
    expect(filename).toBe('landscape.pdf');
    return pages(await blob.text());
}

beforeEach(() => {
    vi.mocked(downloadBlob).mockClear();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(font)));
});
afterEach(() => vi.unstubAllGlobals());

describe('actual editor PDF paper and board geometry', () => {
    it.each(locales)('%s preserves the complete established A4 default when paper is omitted', async locale => {
        for (const mode of modes) {
            const legacy = await print(locale, mode);
            const explicit = await print(locale, mode, 'a4');
            expect(explicit).toEqual(legacy);
            expect(legacy).toHaveLength(6);
            for (const page of legacy) {
                expect(page.width).toBeCloseTo(210, 2);
                expect(page.height).toBeCloseTo(297, 2);
            }
            const grid = rectangles(legacy.at(-1)!.stream, legacy.at(-1)!.height);
            expect(grid[0].width).toBeCloseTo(mode === 'midi-5mm' ? 5 : 200 / 29, 8);
        }
    });

    it.each(locales)('%s exports every asymmetric board on actual Letter pages with intact cells and a 50 mm ruler', async locale => {
        for (const mode of modes) {
            const result = await print(locale, mode, 'letter');
            expect(result).toHaveLength(6);
            for (const page of result) {
                expect(page.width).toBeCloseTo(215.9, 8);
                expect(page.height).toBeCloseTo(279.4, 8);
                for (const rect of rectangles(page.stream, page.height)) {
                    expect(rect.x).toBeGreaterThanOrEqual(5 - 1e-7);
                    expect(rect.y).toBeGreaterThanOrEqual(5 - 1e-7);
                    expect(rect.x + rect.width).toBeLessThanOrEqual(page.width - 5 + 1e-7);
                    expect(rect.y + rect.height).toBeLessThanOrEqual(page.height - 5 + 1e-7);
                }
            }
            const boardPages = result.slice(-4);
            let total = 0;
            boardPages.forEach((page, index) => {
                const grid = rectangles(page.stream, page.height);
                const filled = grid.filter(rect => rect.filled);
                let expectedBeads = 0;
                const cellSize = mode === 'midi-5mm' ? 5 : 205.9 / 29;
                const left = mode === 'midi-5mm' ? (215.9 - 145) / 2 : 5;
                const top = (279.4 - cellSize * 29) / 2;
                expect(grid[0].width).toBeCloseTo(cellSize, 8);
                const coordinates: number[] = [];
                for (let row = 0; row < 29; row++) for (let column = 0; column < 29; column++) {
                    const sourceIndex = (((Math.floor(index / 2) * 29 + row) * 58) + (index % 2) * 29 + column) * 4;
                    if (pixels[sourceIndex + 3] > 0) { expectedBeads++; coordinates.push(row * 29 + column); }
                }
                expect(filled).toHaveLength(expectedBeads);
                expect(grid).toHaveLength(29 * 29 + expectedBeads);
                expect(filled.map(rect => Math.round((rect.y - top) / cellSize) * 29 + Math.round((rect.x - left) / cellSize))).toEqual(coordinates);
                total += filled.length;
                const lines = [...page.stream.matchAll(/([\d.-]+) ([\d.-]+) m\n([\d.-]+) ([\d.-]+) l/g)].map(([, x1, y1, x2, y2]) => ({ x1: mm(Number(x1)), y1: page.height - mm(Number(y1)), x2: mm(Number(x2)), y2: page.height - mm(Number(y2)) }));
                // Empty-cell diagonals also contain m/l operators. Select
                // the calibration area below the full board, not those cells.
                const ruler = lines.filter(line => line.y1 > top + cellSize * 29 + 2 && line.y2 > top + cellSize * 29 + 2);
                expect(ruler).toHaveLength(3);
                expect(ruler[0].x2 - ruler[0].x1).toBeCloseTo(50, 8);
                for (const line of ruler) for (const y of [line.y1, line.y2]) expect(y).toBeLessThanOrEqual(279.4 - 5 + 1e-7);
                // The first footer baseline sits below the complete grid.
                expect(top + cellSize * 29).toBeLessThan(272.4 - 22 - 2);
                if (locale !== 'ja') {
                    expect(page.stream).toContain('US Letter');
                    expect(page.stream).not.toContain('Print on A4');
                }
            });
            expect(total).toBe(2496);
        }
    });

    it('keeps both material pages complete on shorter Letter paper for more than 30 colors', async () => {
        const entries = Array.from({ length: 31 }, (_, i) => ({ ref: `P${i}`, symbol: `${i}`, prefix: 'P', enabled: true, color: { r: i + 1, g: 30, b: 60, a: 255 } }));
        const many = { ...project, paletteConfiguration: { palettes: [{ name: 'Perler Midi', entries }] } } as unknown as Project;
        const cells = new Uint8ClampedArray(58 * 58 * 4);
        entries.forEach((entry, i) => cells.set([entry.color.r, entry.color.g, entry.color.b, 255], i * 4));
        const amounts = computeUsage(cells, many.paletteConfiguration.palettes);
        await new PdfPrinter().print(cells, amounts, many, 'inventory', { locale: 'de', pdfScaleMode: 'midi-5mm', pdfPaperSize: 'letter' });
        const result = pages(await vi.mocked(downloadBlob).mock.calls.at(-1)![0].text());
        expect(result).toHaveLength(7);
        expect(result.slice(1, 3).map(page => rectangles(page.stream, page.height).filter(rect => rect.filled).length)).toEqual([90, 3]);
        for (const page of result.slice(1, 3)) for (const rect of rectangles(page.stream, page.height)) {
            expect(rect.y + rect.height).toBeLessThanOrEqual(274.4 + 1e-7);
        }
        expect(result.slice(-4).reduce((n, page) => n + rectangles(page.stream, page.height).filter(rect => rect.filled).length, 0)).toBe(31);
    });

    it('uses the selected paper in all four instructions and rejects invalid paper without a fallback download', async () => {
        for (const locale of locales) {
            expect(pdfPrintingInstruction(locale, 'a4')).toBe(EXPORT_MESSAGES[locale].printing);
            expect(pdfPrintingInstruction(locale, 'letter')).toContain('US Letter');
            expect(pdfPrintingInstruction(locale, 'letter')).not.toContain('A4');
            await expect(new PdfPrinter().print(pixels, usage, project, 'invalid', { locale, pdfPaperSize: 'legal' as PdfPaperSize })).rejects.toThrow(EXPORT_MESSAGES[locale].paperUnsupported);
        }
        expect(downloadBlob).not.toHaveBeenCalled();
    });

    it('uses identical 5 mm bead spacing on both paper sizes', async () => {
        for (const paperSize of ['a4', 'letter'] as const) {
            const result = await print('ja', 'midi-5mm', paperSize);
            for (const page of result.slice(-4)) {
                const cell = rectangles(page.stream, page.height)[0];
                expect([cell.width, cell.height]).toEqual([5, 5]);
                const size = PDF_PAPER_DIMENSIONS[paperSize];
                expect(cell.x).toBeCloseTo((size.width - 145) / 2, 8);
                // A4 MediaBox rounding is kept, so compare the actual page shift.
                expect(cell.y).toBeCloseTo((size.height - 145) / 2, 2);
            }
        }
    });
});

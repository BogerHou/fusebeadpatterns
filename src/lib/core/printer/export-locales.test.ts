import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as Excel from 'exceljs/dist/exceljs';
import { jsPDF } from 'jspdf';
import type { SiteLocale } from '../../i18n/locales';
import { Color } from '../model/color/color.model';
import { Palette, PaletteEntry } from '../model/palette/palette.model';
import type { Project } from '../model/project/project.model';
import { computeUsage } from '../utils/utils';
import { downloadBlob } from './download';
import { EXPORT_MESSAGES, JAPANESE_EXPORT_FONT_TEXT } from './messages';
import { isMidiActualSizeProject, PdfPrinter } from './pdf/pdf.printer';
import { JAPANESE_EXPORT_FONT_NAME, registerJapaneseExportFont } from './pdf/japanese-font';
import { XlsxPrinter } from './xlsx/xlsx.printer';

vi.mock('./download', () => ({ downloadBlob: vi.fn() }));

const locales: SiteLocale[] = ['en', 'de', 'fr', 'ja'];
const font = readFileSync(path.join(process.cwd(), 'public/fonts/fuse-bead-japanese/FuseBeadJapanese-Regular.ttf'));

function fixture(boardSize = 29, boardsWide = 1, symbols = true, colors = 3, brand = 'Hama Midi') {
    const entries = Array.from({ length: colors }, (_, i) => {
        const entry = new PaletteEntry(`Color ${i + 1}`, new Color(20 + i * 3, 40, 120, 255));
        entry.ref = `H${String(i + 1).padStart(2, '0')}`;
        entry.symbol = String.fromCharCode(65 + i);
        entry.prefix = 'H';
        return entry;
    });
    const project = {
        boardConfiguration: { board: { nbBeadPerRow: boardSize }, nbBoardWidth: boardsWide, nbBoardHeight: 1 },
        paletteConfiguration: { palettes: [new Palette(brand, entries)] },
        exportConfiguration: { useSymbols: symbols },
    } as Project;
    const pixels = new Uint8ClampedArray(boardSize * boardsWide * boardSize * 4);
    entries.forEach((entry, i) => {
        pixels.set([entry.color.r, entry.color.g, entry.color.b, 255], i * 4);
    });
    const usage = computeUsage(pixels, project.paletteConfiguration.palettes);
    return { project, pixels, usage };
}

function pageStreams(contents: string): string[] {
    const objects = new Map(Array.from(contents.matchAll(/(?:^|\n)(\d+) 0 obj\n([\s\S]*?)\nendobj/g), ([, id, value]) => [id, value]));
    return Array.from(objects.values()).filter((value) => /\/Type \/Page\s/.test(value)).map((page) => {
        const id = page.match(/\/Contents (\d+) 0 R/)![1];
        return objects.get(id)!.match(/\nstream\n([\s\S]*?)\nendstream/)![1];
    });
}

beforeEach(() => {
    vi.mocked(downloadBlob).mockClear();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(font)));
});
afterEach(() => vi.unstubAllGlobals());

describe('localized export files', () => {
    it('covers every Japanese PDF label with the unchanged licensed font subset', () => {
        const doc = new jsPDF();
        registerJapaneseExportFont(doc, font.toString('base64'));
        doc.setFont(JAPANESE_EXPORT_FONT_NAME, 'normal');
        const metadata = doc.getFont().metadata as unknown as {
            cmap: { unicode: { codeMap: Record<number, number> } };
        };
        const missing = [...new Set(JAPANESE_EXPORT_FONT_TEXT)].filter((char) => !metadata.cmap.unicode.codeMap[char.codePointAt(0)!]);
        expect(missing).toEqual([]);
    });

    it.each(locales)('%s preserves color cells and material values in a real XLSX round trip', async (locale) => {
        const { project, pixels, usage } = fixture(50, 2);
        await new XlsxPrinter().print(pixels, usage, project, 'test', { locale });
        const [blob, name] = vi.mocked(downloadBlob).mock.calls[0];
        expect(name).toBe('test.xlsx');
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(await blob.arrayBuffer());
        expect(workbook.worksheets.map((sheet: Excel.Worksheet) => sheet.name)).toEqual([EXPORT_MESSAGES[locale].pattern, EXPORT_MESSAGES[locale].inventory]);
        const [pattern, inventory] = workbook.worksheets;
        expect(pattern.rowCount).toBe(50);
        expect(pattern.columnCount).toBe(100);
        expect(pattern.getCell('A1').value).toBe('A');
        expect(pattern.getCell('A1').fill).toMatchObject({ fgColor: { argb: 'FF142878' } });
        expect(pattern.getCell('D1').value).toBeNull();
        expect(pattern.getCell('AX1').border.right.style).toBe('thick');
        const firstRow = locale === 'en' ? 1 : 2;
        expect(inventory.getCell(firstRow, 1).value).toBe('H01');
        expect(inventory.getCell(firstRow, 2).value).toBe('A');
        expect(inventory.getCell(firstRow, 3).value).toBe('1');
        if (locale !== 'en') expect(inventory.getRow(1).values).toEqual([undefined, EXPORT_MESSAGES[locale].reference, EXPORT_MESSAGES[locale].symbol, EXPORT_MESSAGES[locale].count]);
    });

    it.each(locales)('%s supports 57-cell boards and no-symbol material sheets', async (locale) => {
        const { project, pixels, usage } = fixture(57, 1, false, 2, 'Perler Mini');
        await new XlsxPrinter().print(pixels, usage, project, 'mini', { locale });
        const [blob] = vi.mocked(downloadBlob).mock.calls[0];
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(await blob.arrayBuffer());
        expect(workbook.worksheets[0].getCell('A1').value).toBe('H01');
        expect(workbook.worksheets[1].columnCount).toBe(2);
        const firstRow = locale === 'en' ? 1 : 2;
        expect(workbook.worksheets[1].getCell(firstRow, 2).value).toBe('1');
    });

    it.each(locales)('%s exports the existing Hama bat with unchanged refs and color cells', async (locale) => {
        const draft = JSON.parse(readFileSync('public/patterns-hama/original-halloween-bat/pattern.bead-pattern.json', 'utf8')).draft;
        const project = {
            boardConfiguration: { board: { nbBeadPerRow: 29 }, nbBoardWidth: 1, nbBoardHeight: 1 },
            paletteConfiguration: { palettes: draft.activePalettes },
            exportConfiguration: { useSymbols: true },
        } as Project;
        const pixels = new Uint8ClampedArray(Buffer.from(draft.editedPattern.data, 'base64'));
        await new PdfPrinter().print(pixels, computeUsage(pixels, project.paletteConfiguration.palettes), project, 'bat', { locale, pdfScaleMode: 'midi-5mm' });
        const [blob, name] = vi.mocked(downloadBlob).mock.calls[0];
        expect(name).toBe('bat.pdf');
        const contents = await blob.text();
        const pages = pageStreams(contents);
        expect(pages).toHaveLength(2);
        expect([...pages[0].matchAll(/\nB\n/g)]).toHaveLength(9);
        expect([...pages[1].matchAll(/\nB\n/g)]).toHaveLength(252);
        expect(contents.match(/\/Lang \(([^)]+)\)/)?.[1]).toBe(({ en: 'en', de: 'de-DE', fr: 'fr-FR', ja: 'ja' })[locale]);
        if (locale === 'ja') expect(contents.includes('FuseBeadJapanese')).toBe(true);
        // Optional, task-owned visual QA output. Normal tests do not write files.
        const qaDirectory = process.env.FBP_EXPORT_QA_DIRECTORY;
        if (qaDirectory) writeFileSync(path.join(qaDirectory, `editor-${locale}.pdf`), Buffer.from(await blob.arrayBuffer()));
    });

    it.each([
        { size: 29, boards: 2, colors: 31, symbols: true, brand: 'Hama Midi' },
        { size: 50, boards: 2, colors: 3, symbols: true, brand: 'Artkal S Mini' },
        { size: 57, boards: 1, colors: 3, symbols: false, brand: 'Perler Mini' },
    ])('Japanese keeps all $size-cell boards and $colors colors without restricting palettes', async ({ size, boards, colors, symbols, brand }) => {
        const { project, pixels, usage } = fixture(size, boards, symbols, colors, brand);
        await new PdfPrinter().print(pixels, usage, project, 'all-boards', { locale: 'ja', pdfScaleMode: size === 29 ? 'midi-5mm' : 'fit-page' });
        const pages = pageStreams(await vi.mocked(downloadBlob).mock.calls[0][0].text());
        const usagePages = Math.ceil(colors / 30);
        expect(pages).toHaveLength(boards + usagePages + (boards > 1 ? 1 : 0));
        const patternPages = pages.slice(-boards);
        expect(patternPages.reduce((count, stream) => count + [...stream.matchAll(/\nB\n/g)].length, 0)).toBe(colors);
        const rectangles = patternPages.flatMap((stream) => [...stream.matchAll(/([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) re/g)]);
        expect(rectangles).toHaveLength(size * size * boards + colors);
        const expectedMm = size === 29 ? 5 : 200 / size;
        expect(Number(rectangles[0][3]) * 25.4 / 72).toBeCloseTo(expectedMm, 8);
    });

    it('does not infer physical Midi size for Artkal A or Hama Maxi from a 29-cell preset', () => {
        for (const name of ['Artkal A', 'Artkal C', 'Artkal M', 'Hama Maxi', 'Custom']) {
            expect(isMidiActualSizeProject(fixture(29, 1, true, 1, name).project)).toBe(false);
        }
        expect(isMidiActualSizeProject(fixture().project)).toBe(true);
        expect(isMidiActualSizeProject(fixture(50).project)).toBe(false);
    });

    it.each(['fit-page', 'midi-5mm'] as const)('%s keeps identical grid geometry across all four languages', async (pdfScaleMode) => {
        const { project, pixels, usage } = fixture(29, 2);
        let baseline: string[] | undefined;
        for (const locale of locales) {
            await new PdfPrinter().print(pixels, usage, project, 'scale', { locale, pdfScaleMode });
            const pages = pageStreams(await vi.mocked(downloadBlob).mock.calls.at(-1)![0].text());
            expect(pages).toHaveLength(4);
            const grid = pages.slice(-2).flatMap((page) => [...page.matchAll(/[\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+ re/g)].map(([rect]) => rect));
            baseline ??= grid;
            expect(grid).toEqual(baseline);
            const first = grid[0].split(' ').map(Number);
            expect(first[2] * 25.4 / 72).toBeCloseTo(pdfScaleMode === 'midi-5mm' ? 5 : 200 / 29, 8);
        }
    });

    it.each(locales)('%s defaults to the established fit-page geometry when no scale is supplied', async (locale) => {
        const { project, pixels, usage } = fixture();
        await new PdfPrinter().print(pixels, usage, project, 'default', { locale });
        const grid = pageStreams(await vi.mocked(downloadBlob).mock.calls[0][0].text()).at(-1)!;
        const rectangle = grid.match(/([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) re/)!;
        expect(Number(rectangle[3]) * 25.4 / 72).toBeCloseTo(200 / 29, 8);
        const qaDirectory = process.env.FBP_EXPORT_QA_DIRECTORY;
        if (qaDirectory && locale === 'ja') writeFileSync(path.join(qaDirectory, 'editor-ja-fit.pdf'), Buffer.from(await vi.mocked(downloadBlob).mock.calls[0][0].arrayBuffer()));
    });

    it.each(locales)('%s rejects unsupported actual-size settings without downloading a fallback', async (locale) => {
        for (const [size, brand] of [[50, 'Artkal S Mini'], [57, 'Perler Mini'], [29, 'Artkal A'], [29, 'Artkal C'], [29, 'Artkal M'], [29, 'Hama Maxi'], [29, 'Custom']] as const) {
            const { project, pixels, usage } = fixture(size, 1, true, 1, brand);
            await expect(new PdfPrinter().print(pixels, usage, project, 'invalid', { locale, pdfScaleMode: 'midi-5mm' })).rejects.toThrow(EXPORT_MESSAGES[locale].midiSizeUnsupported);
        }
        expect(downloadBlob).not.toHaveBeenCalled();
    });

    it('requires every palette in a mixed project to have confirmed Midi spacing', () => {
        const { project } = fixture();
        project.paletteConfiguration.palettes.push(new Palette('Perler Midi', []), new Palette('Artkal S Mini', []));
        expect(isMidiActualSizeProject(project)).toBe(true);
        project.paletteConfiguration.palettes.push(new Palette('Artkal A', []));
        expect(isMidiActualSizeProject(project)).toBe(false);
    });

});

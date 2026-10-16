import type { jsPDF as JsPdf } from 'jspdf';
import { exportMessages } from '../core/printer/messages';
import { JAPANESE_EXPORT_FONT_NAME, loadJapaneseExportFont, registerJapaneseExportFont } from '../core/printer/pdf/japanese-font';
import type { SiteLocale } from '../i18n/locales';
import { assertPixelGridPdfJapaneseFont } from '../pixel-grid/pdf';
import { pixelGridPdfAxisLabels, pixelGridPdfLayout, PIXEL_GRID_PDF_TILE, type PixelGridPdfTile } from '../pixel-grid/pdf-layout';
import { pixelGridPdfMessages } from '../pixel-grid/pdf-messages';
import { buildLetterProject, type LetterProjectResult } from './project';
import type { LetterColor, LetterState } from './types';

const labels = {
    en: { title: 'Bead letter chart', brand: 'Bead brand', grid: 'Grid', board: 'Reference board', color: 'Color', oneCell: '1 cell = 1 bead. Empty cells use no beads.', scale: 'Counting chart - not a 5 mm actual-size template.' },
    de: { title: 'Bügelperlen-Buchstaben', brand: 'Perlenmarke', grid: 'Raster', board: 'Referenzplatte', color: 'Farbe', oneCell: '1 Feld = 1 Perle. Leere Felder bleiben ohne Perlen.', scale: 'Zählvorlage - keine 5-mm-Schablone in Originalgröße.' },
    fr: { title: 'Motif de lettres en perles', brand: 'Marque', grid: 'Grille', board: 'Plaque de référence', color: 'Couleur', oneCell: '1 case = 1 perle. Les cases vides restent sans perles.', scale: 'Grille à compter - pas un gabarit à taille réelle de 5 mm.' },
    ja: { title: 'アイロンビーズ図案 / ABC', brand: 'パレット', grid: '図案', board: 'プレート', color: '色', oneCell: '1マス = 1ビーズ / 空白 = 0', scale: '5 mmの原寸図案ではありません。' },
} as const;

export function letterPdfJapaneseCharacters(): string {
    const copy = exportMessages('ja'), pixel = pixelGridPdfMessages('ja');
    return [...new Set([...Object.values(labels.ja), copy.inventory, copy.reference, copy.symbol, copy.count, copy.caution,
        pixel.overview, pixel.tile, pixel.rows, pixel.columns, pixel.page, pixel.printTiled].join(''))].join('');
}

/** A complete overview with materials; small logical charts do not waste a separate page. */
export function letterPdfLayout(width: number, height: number, paper: LetterState['paper'], legendHeight = 25) {
    if (!Number.isFinite(legendHeight) || legendHeight < 16 || legendHeight > 80) throw new Error('INVALID_OPTIONS');
    const base = pixelGridPdfLayout(width, height, paper, 'overview');
    const top = 55 + legendHeight + 23;
    const cellMm = Math.min(8, (base.widthMm - 48) / width, (base.heightMm - 38 - top) / height);
    const layout = cellMm < 3.5 ? pixelGridPdfLayout(width, height, paper, 'tiled') : base;
    return { ...layout, overview: { left: (base.widthMm - width * cellMm) / 2, top, cellMm } };
}

type FontMetadata = { metadata?: { cmap?: { unicode?: { codeMap?: Record<number, number> } } } };
function checkFontCharacters(doc: JsPdf, name: string, text: string): void {
    // This is the cmap parsed by the installed jsPDF TTF implementation. Check
    // it before text(), whose fallback otherwise silently omits missing glyphs.
    doc.setFont(name, 'normal');
    const font = doc.getFont() as unknown as FontMetadata;
    const map = font.metadata?.cmap?.unicode?.codeMap;
    if (!map || [...text].some(character => !map[character.codePointAt(0)!])) throw new Error('PDF_GLYPHS_MISSING');
}

function ink(color: LetterColor): [number, number, number] {
    return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b > 127.5 ? [0, 0, 0] : [255, 255, 255];
}

/** New-tool-only file generation. No download, editor mutation or old-printer changes. */
export async function createLetterPdf(result: LetterProjectResult, state: LetterState, locale: SiteLocale, signal?: AbortSignal): Promise<Uint8Array> {
    signal?.throwIfAborted();
    if (!['en', 'de', 'fr', 'ja'].includes(locale)) throw new Error('INVALID_OPTIONS');
    // Rebuild a frozen snapshot before the first asynchronous boundary. A stale
    // text/color description must never label a different visible grid.
    const snapshot = buildLetterProject(state, [result.palette]);
    if (result.grid.width !== snapshot.grid.width || result.grid.height !== snapshot.grid.height
        || result.grid.pixels.length !== snapshot.grid.pixels.length
        || !Array.from(result.grid.pixels).every((value, index) => value === snapshot.grid.pixels[index])) throw new Error('INVALID_PROJECT');
    const paper = state.paper, grid = snapshot.grid, usage = snapshot.usage.filter(entry => entry.count > 0);
    const preview = snapshot.pattern.normalizedText.replace(/\n/g, ' / ').slice(0, 60);
    const copy = labels[locale], common = exportMessages(locale), pixel = pixelGridPdfMessages(locale);
    const specialSymbols = usage.map(entry => entry.color.symbol).filter(symbol => [...symbol].some(character => character.codePointAt(0)! > 255)).join('');
    let japaneseFont: string | undefined;
    if (locale === 'ja') {
        japaneseFont = await loadJapaneseExportFont();
        signal?.throwIfAborted();
        assertPixelGridPdfJapaneseFont(japaneseFont);
    }
    const { jsPDF } = await import('jspdf');
    signal?.throwIfAborted();
    // Ordinary ASCII/Latin-1 charts avoid the existing large MonoFont module.
    // Only registries' selected extended symbols (e.g. Artkal Α) need it.
    if (specialSymbols) {
        await import('../core/printer/pdf/MonoFont');
        signal?.throwIfAborted();
    }
    const doc = new jsPDF({ unit: 'mm', format: paper, orientation: 'portrait', compress: false, precision: 6, putOnlyUsedFonts: true });
    if (japaneseFont) {
        registerJapaneseExportFont(doc, japaneseFont);
        checkFontCharacters(doc, JAPANESE_EXPORT_FONT_NAME, letterPdfJapaneseCharacters());
    }
    if (specialSymbols) checkFontCharacters(doc, 'MonoFont', specialSymbols);
    doc.setProperties({ title: copy.title, subject: `${grid.width} x ${grid.height} / ${snapshot.palette.label}`, author: 'Fuse Bead Patterns', creator: 'Fuse Bead Patterns' });
    doc.setLanguage(({ en: 'en', de: 'de-DE', fr: 'fr-FR', ja: 'ja' } as const)[locale]);
    doc.viewerPreferences({ PrintScaling: 'None' });
    const font = locale === 'ja' ? JAPANESE_EXPORT_FONT_NAME : 'helvetica';
    const text = (value: string | string[], x: number, y: number, size = 8, align: 'left' | 'center' | 'right' = 'left', latin = false) => {
        doc.setFont(latin ? 'helvetica' : font, 'normal'); doc.setFontSize(size); doc.setTextColor(35, 49, 42);
        doc.text(value, x, y, { align, lineHeightFactor: 1.25 });
    };
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const nameWidth = (paper === 'a4' ? 210 : 215.9) - 120;
    const materialRows = usage.map(entry => ({ ...entry, lines: doc.splitTextToSize(entry.color.name, nameWidth) as string[] }));
    const legendHeight = 7 + materialRows.reduce((total, row) => total + Math.max(9, row.lines.length * 3.6 + 3), 0);
    const layout = letterPdfLayout(grid.width, grid.height, paper, legendHeight);
    const totalBeads = usage.reduce((total, entry) => total + entry.count, 0);
    const drawSymbol = (color: LetterColor, x: number, y: number, size: number) => {
        const extended = [...color.symbol].some(character => character.codePointAt(0)! > 255);
        doc.setFont(extended ? 'MonoFont' : 'helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...ink(color));
        doc.text(color.symbol, x, y, { align: 'center' });
    };
    const footer = (page: number, tiled: boolean) => {
        text(tiled ? pixel.printTiled : copy.scale, 16, layout.heightMm - 26, 7);
        doc.setFont(font, 'normal'); doc.setFontSize(7);
        const caution = doc.splitTextToSize(common.caution, layout.widthMm - 32) as string[];
        text(caution, 16, layout.heightMm - 20, 7);
        text('fusebeadpatterns.art', 16, layout.heightMm - 8, 7, 'left', true);
        text(`${pixel.page} ${page} / ${layout.pageCount}`, layout.widthMm - 16, layout.heightMm - 8, 7, 'right');
    };
    const header = (tile?: PixelGridPdfTile) => {
        text('FUSE BEAD PATTERNS', 16, 12, 7, 'left', true);
        text(copy.title, 16, 24, 17);
        if (!tile) {
            text(preview, 16, 33, 9, 'left', true);
            text(`${copy.brand}: ${snapshot.palette.label} / ${copy.grid}: ${grid.width} x ${grid.height}`, 16, 42, 9);
            text(`${copy.board}: ${snapshot.palette.boardSize} x ${snapshot.palette.boardSize} / ${common.count}: ${totalBeads}`, 16, 48, 8);
        } else {
            text(`${pixel.tile} ${tile.row}-${tile.column} / ${copy.grid}: ${grid.width} x ${grid.height}`, 16, 33, 9);
            text(`${pixel.rows} ${tile.y + 1}-${tile.y + tile.height} / ${pixel.columns} ${tile.x + 1}-${tile.x + tile.width}`, 16, 40, 8);
        }
    };
    const colorMap = new Map(usage.map(entry => [`${entry.color.r},${entry.color.g},${entry.color.b}`, entry.color]));
    const drawGrid = (region: { x: number; y: number; width: number; height: number }, left: number, top: number, cell: number, tiled: boolean) => {
        for (let y = 0; y < region.height; y++) for (let x = 0; x < region.width; x++) {
            const offset = ((region.y + y) * grid.width + region.x + x) * 4;
            if (!grid.pixels[offset + 3]) continue;
            const color = colorMap.get(`${grid.pixels[offset]},${grid.pixels[offset + 1]},${grid.pixels[offset + 2]}`)!;
            doc.setFillColor(color.r, color.g, color.b); doc.rect(left + x * cell, top + y * cell, cell, cell, 'F');
            if (cell >= 3.5) drawSymbol(color, left + (x + 0.5) * cell, top + (y + 0.66) * cell, Math.min(8, cell * 1.6));
        }
        doc.setDrawColor(119, 130, 122);
        for (let x = 0; x <= region.width; x++) {
            doc.setLineWidth(x === 0 || x === region.width ? 0.25 : (region.x + x) % 5 === 0 ? 0.17 : 0.08);
            doc.line(left + x * cell, top, left + x * cell, top + region.height * cell);
        }
        for (let y = 0; y <= region.height; y++) {
            doc.setLineWidth(y === 0 || y === region.height ? 0.25 : (region.y + y) % 5 === 0 ? 0.17 : 0.08);
            doc.line(left, top + y * cell, left + region.width * cell, top + y * cell);
        }
        const columns = tiled ? Array.from({ length: region.width }, (_, index) => index) : pixelGridPdfAxisLabels(region.x, region.width, cell);
        const rows = tiled ? Array.from({ length: region.height }, (_, index) => index) : pixelGridPdfAxisLabels(region.y, region.height, cell);
        for (const x of columns) text(String(region.x + x + 1), left + (x + 0.5) * cell, top - 2, 6, 'center', true);
        for (const y of rows) text(String(region.y + y + 1), left - 2, top + (y + 0.65) * cell, 6, 'right', true);
    };
    header();
    text(common.symbol, 16, 57, 8); text(common.reference, 37, 57, 8);
    text(copy.color, 80, 57, 8); text(common.count, layout.widthMm - 18, 57, 8, 'right');
    let rowY = 62;
    for (const row of materialRows) {
        const rowHeight = Math.max(9, row.lines.length * 3.6 + 3), color = row.color;
        doc.setFillColor(color.r, color.g, color.b); doc.setDrawColor(70, 85, 74); doc.setLineWidth(0.2);
        doc.rect(18, rowY - 3, 6, 6, 'FD'); drawSymbol(color, 21, rowY + 1.1, 8);
        text(color.ref, 37, rowY + 1, 8, 'left', true); text(row.lines, 80, rowY + 1, 8, 'left', true);
        text(String(row.count), layout.widthMm - 18, rowY + 1, 8, 'right', true);
        rowY += rowHeight;
    }
    text(copy.oneCell, 16, 55 + legendHeight + 5, 7.5);
    doc.setFont(font, 'normal'); doc.setFontSize(7.5);
    text(doc.splitTextToSize(copy.scale, layout.widthMm - 32) as string[], 16, 55 + legendHeight + 11, 7.5);
    drawGrid({ x: 0, y: 0, width: grid.width, height: grid.height }, layout.overview.left, layout.overview.top, layout.overview.cellMm, false);
    footer(1, false);
    for (const tile of layout.tiles) {
        signal?.throwIfAborted();
        doc.addPage(paper, 'portrait'); header(tile);
        drawGrid(tile, (layout.widthMm - tile.width * PIXEL_GRID_PDF_TILE.cellMm) / 2, 48, PIXEL_GRID_PDF_TILE.cellMm, true);
        footer(tile.page, true);
    }
    signal?.throwIfAborted();
    const output = doc.output('arraybuffer');
    if (!(output instanceof ArrayBuffer) || output.byteLength < 100) throw new Error('PDF_GENERATION_FAILED');
    return new Uint8Array(output);
}

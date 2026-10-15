import type { jsPDF as JsPdf } from 'jspdf';
import { createGrid, type RgbaSource, type PixelGrid } from './core';
import { PIXEL_GRID_PDF_TILE, pixelGridPdfAxisLabels, pixelGridPdfLayout, pixelGridPdfOverviewBox,
    type PixelGridPdfTile } from './pdf-layout';
import type { PixelGridPdfPaper, PixelGridPdfMode, PixelGridPdfContent, PixelGridPdfLocale } from './pdf-layout';
import { pixelGridPdfJapaneseCharacters, pixelGridPdfMessages } from './pdf-messages';
import { JAPANESE_EXPORT_FONT_NAME, registerJapaneseExportFont } from '../core/printer/pdf/japanese-font';

export type { PixelGridPdfPaper, PixelGridPdfMode, PixelGridPdfContent, PixelGridPdfLocale } from './pdf-layout';
export interface PixelGridPdfOptions {
    paper: PixelGridPdfPaper;
    mode: PixelGridPdfMode;
    content: PixelGridPdfContent;
    locale: PixelGridPdfLocale;
    japaneseFontBase64?: string;
}
export type PixelGridPdfErrorCode = 'INVALID_OPTIONS' | 'JAPANESE_FONT_REQUIRED' | 'JAPANESE_FONT_INVALID' | 'JAPANESE_GLYPHS_MISSING' | 'PDF_GENERATION_FAILED';
export class PixelGridPdfError extends Error {
    readonly code: PixelGridPdfErrorCode;
    constructor(code: PixelGridPdfErrorCode) { super(code); this.name = 'PixelGridPdfError'; this.code = code; }
}

/** Alpha is only composited for printing; source bytes and hidden RGB stay intact. */
export function pixelGridPdfPaperColor(red: number, green: number, blue: number, alpha: number): [number, number, number] | null {
    if (alpha === 0) return null;
    return [red, green, blue].map(channel => Math.round((channel * alpha + 255 * (255 - alpha)) / 255)) as [number, number, number];
}

/** Bounded Unicode cmap check before handing the existing TTF to jsPDF. */
export function assertPixelGridPdfJapaneseFont(base64: string): void {
    try {
        if (typeof base64 !== 'string' || base64.length < 16 || base64.length > 1400000 || base64.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new Error('base64');
        const binary = atob(base64), bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
        const view = new DataView(bytes.buffer);
        const bound = (offset: number, length: number) => { if (offset < 0 || length < 0 || offset + length > bytes.length) throw new Error('bounds'); };
        bound(0, 12);
        if (view.getUint32(0) !== 0x00010000) throw new Error('ttf');
        const tableCount = view.getUint16(4); if (!tableCount || tableCount > 128) throw new Error('tables');
        bound(12, tableCount * 16);
        let cmapOffset = -1, cmapLength = 0;
        for (let index = 0; index < tableCount; index++) {
            const pos = 12 + index * 16, offset = view.getUint32(pos + 8), length = view.getUint32(pos + 12);
            bound(offset, length);
            if (String.fromCharCode(...bytes.subarray(pos, pos + 4)) === 'cmap') { cmapOffset = offset; cmapLength = length; }
        }
        if (cmapOffset < 0 || cmapLength < 4) throw new Error('cmap');
        const count = view.getUint16(cmapOffset + 2); if (!count || count > 64 || 4 + count * 8 > cmapLength) throw new Error('encodings');
        const covers: Array<(codepoint: number) => boolean> = [];
        for (let i = 0; i < count; i++) {
            const record = cmapOffset + 4 + i * 8, platform = view.getUint16(record), encoding = view.getUint16(record + 2);
            if (platform !== 0 && !(platform === 3 && (encoding === 1 || encoding === 10))) continue;
            const relativeStart = view.getUint32(record + 4);
            if (relativeStart < 4 + count * 8 || relativeStart + 2 > cmapLength) throw new Error('subtable');
            const start = cmapOffset + relativeStart; bound(start, 2); const format = view.getUint16(start);
            if (format === 4) {
                bound(start, 16); const length = view.getUint16(start + 2), segments = view.getUint16(start + 6) / 2;
                if (!Number.isInteger(segments) || !segments || start + length > cmapOffset + cmapLength || 16 + segments * 8 > length) throw new Error('format4');
                covers.push(codepoint => {
                    if (codepoint > 0xffff) return false;
                    for (let segment = 0; segment < segments; segment++) {
                        const end = view.getUint16(start + 14 + segment * 2), from = view.getUint16(start + 16 + segments * 2 + segment * 2);
                        if (codepoint < from || codepoint > end) continue;
                        const delta = view.getInt16(start + 16 + segments * 4 + segment * 2), rangePos = start + 16 + segments * 6 + segment * 2, range = view.getUint16(rangePos);
                        if (!range) return ((codepoint + delta) & 0xffff) !== 0;
                        const glyphPos = rangePos + range + (codepoint - from) * 2;
                        if (glyphPos < start || glyphPos + 2 > start + length) throw new Error('glyph bounds');
                        const glyph = view.getUint16(glyphPos); return glyph !== 0 && ((glyph + delta) & 0xffff) !== 0;
                    }
                    return false;
                });
            } else if (format === 12) {
                bound(start, 16); const length = view.getUint32(start + 4), groups = view.getUint32(start + 12);
                if (groups > 65536 || 16 + groups * 12 > length || start + length > cmapOffset + cmapLength) throw new Error('format12');
                covers.push(codepoint => {
                    for (let group = 0; group < groups; group++) {
                        const pos = start + 16 + group * 12, from = view.getUint32(pos), to = view.getUint32(pos + 4);
                        if (codepoint >= from && codepoint <= to) return view.getUint32(pos + 8) + codepoint - from !== 0;
                    }
                    return false;
                });
            }
        }
        if (!covers.length) throw new Error('unicode');
        if ([...pixelGridPdfJapaneseCharacters()].some(char => !covers.some(has => has(char.codePointAt(0)!)))) throw new PixelGridPdfError('JAPANESE_GLYPHS_MISSING');
    } catch (error) {
        if (error instanceof PixelGridPdfError) throw error;
        throw new PixelGridPdfError('JAPANESE_FONT_INVALID');
    }
}

function optionsSnapshot(options: PixelGridPdfOptions): PixelGridPdfOptions {
    if (!options || !['a4', 'letter'].includes(options.paper) || !['overview', 'tiled'].includes(options.mode) ||
        !['artwork', 'blank'].includes(options.content) || !['en', 'de', 'fr', 'ja'].includes(options.locale) ||
        options.japaneseFontBase64 !== undefined && typeof options.japaneseFontBase64 !== 'string') throw new PixelGridPdfError('INVALID_OPTIONS');
    return { paper: options.paper, mode: options.mode, content: options.content, locale: options.locale, japaneseFontBase64: options.japaneseFontBase64 };
}

/** Pure file generation: no download, fetch, DOM, project/history write or palette mapping. */
export async function createPixelGridPdf(source: RgbaSource, input: PixelGridPdfOptions): Promise<Uint8Array> {
    const grid = createGrid(source.width, source.height, source.pixels), options = optionsSnapshot(input);
    const layout = pixelGridPdfLayout(grid.width, grid.height, options.paper, options.mode);
    if (options.locale === 'ja') {
        if (!options.japaneseFontBase64) throw new PixelGridPdfError('JAPANESE_FONT_REQUIRED');
        assertPixelGridPdfJapaneseFont(options.japaneseFontBase64);
    }
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: options.paper, compress: false, putOnlyUsedFonts: true, precision: 6 });
    if (options.locale === 'ja') registerJapaneseExportFont(doc, options.japaneseFontBase64!);
    const copy = pixelGridPdfMessages(options.locale);
    doc.setProperties({ title: copy.title, subject: `${grid.width} x ${grid.height} / ${options.content} / ${options.mode}`, author: 'Fuse Bead Patterns', creator: 'Fuse Bead Patterns' });
    doc.setLanguage(({ en: 'en', de: 'de-DE', fr: 'fr-FR', ja: 'ja' } as const)[options.locale]);
    doc.viewerPreferences({ PrintScaling: 'None' });
    const font = options.locale === 'ja' ? JAPANESE_EXPORT_FONT_NAME : 'helvetica';
    const text = (value: string, x: number, y: number, size = 8, align: 'left' | 'right' | 'center' = 'left', bold = false) => {
        doc.setFont(font, options.locale !== 'ja' && bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(39, 48, 44); doc.text(value, x, y, { align });
    };
    const footer = (page: number) => {
        text(`${options.paper === 'a4' ? 'A4' : 'US Letter'} / ${page === 1 ? copy.printOverview : copy.printTiled}`, 16, layout.heightMm - 30, 7.5);
        text(copy.digital, 16, layout.heightMm - 24, 7.5);
        text(copy.whitePaper, 16, layout.heightMm - 18, 7.5);
        text('fusebeadpatterns.art', 16, layout.heightMm - 9, 7);
        text(`${copy.page} ${page} / ${layout.pageCount}`, layout.widthMm - 16, layout.heightMm - 9, 7, 'right');
    };
    const header = (tile?: PixelGridPdfTile) => {
        text('FUSE BEAD PATTERNS', 16, 11, 7);
        text(copy.title, 16, 23, 18, 'left', true);
        const mode = tile ? `${copy.tile} ${tile.row}-${tile.column}` : copy.overview;
        text(`${options.content === 'blank' ? copy.blank : copy.artwork} / ${mode} / ${grid.width} x ${grid.height}`, 16, 32, 9);
        if (tile) text(`${copy.rows} ${tile.y + 1}-${tile.y + tile.height} / ${copy.columns} ${tile.x + 1}-${tile.x + tile.width}`, 16, 39, 8);
    };
    const pageMap = (selected?: number) => {
        const cellWidth = 8, cellHeight = 4.5, left = layout.widthMm - 16 - layout.tileColumns * cellWidth,
            top = selected === undefined ? layout.heightMm - 49 : 14;
        text(copy.pageMap, left - 3, top - 4, 7, 'right');
        for (const tile of layout.tiles) {
            const x = left + (tile.column - 1) * cellWidth, y = top + (tile.row - 1) * cellHeight;
            doc.setDrawColor(112, 122, 115); doc.setLineWidth(0.15);
            if (selected === tile.index) { doc.setFillColor(229, 235, 229); doc.rect(x, y, cellWidth, cellHeight, 'FD'); }
            else doc.rect(x, y, cellWidth, cellHeight, 'S');
            text(String(tile.page), x + cellWidth / 2, y + 3.1, 6.5, 'center');
        }
    };
    const overview = pixelGridPdfOverviewBox(layout);
    header(); drawGrid(doc, grid, options.content, { x: 0, y: 0, width: grid.width, height: grid.height }, overview.left, overview.top, overview.cellMm,
        pixelGridPdfAxisLabels(0, grid.width, overview.cellMm), pixelGridPdfAxisLabels(0, grid.height, overview.cellMm), text);
    if (options.mode === 'tiled') pageMap();
    footer(1);
    for (const tile of layout.tiles) {
        doc.addPage(options.paper, 'portrait'); header(tile);
        drawGrid(doc, grid, options.content, tile, (layout.widthMm - tile.width * PIXEL_GRID_PDF_TILE.cellMm) / 2, 48, PIXEL_GRID_PDF_TILE.cellMm,
            Array.from({ length: tile.width }, (_, i) => i), Array.from({ length: tile.height }, (_, i) => i), text);
        pageMap(tile.index); footer(tile.page);
    }
    const output = doc.output('arraybuffer');
    if (!(output instanceof ArrayBuffer) || output.byteLength < 100) throw new PixelGridPdfError('PDF_GENERATION_FAILED');
    return new Uint8Array(output);
}

type PdfText = (value: string, x: number, y: number, size?: number, align?: 'left' | 'right' | 'center', bold?: boolean) => void;
function drawGrid(doc: JsPdf, grid: PixelGrid, content: PixelGridPdfContent, region: { x: number; y: number; width: number; height: number },
    left: number, top: number, cell: number, columns: number[], rows: number[], text: PdfText): void {
    if (content === 'artwork') for (let y = 0; y < region.height; y++) for (let x = 0; x < region.width; x++) {
        const offset = ((region.y + y) * grid.width + region.x + x) * 4, alpha = grid.pixels[offset + 3];
        if (alpha === 0) continue;
        const color = pixelGridPdfPaperColor(grid.pixels[offset], grid.pixels[offset + 1], grid.pixels[offset + 2], alpha)!;
        doc.setFillColor(...color); doc.rect(left + x * cell, top + y * cell, cell, cell, 'F');
    }
    for (let x = 0; x <= region.width; x++) {
        const edge = x === 0 || x === region.width, major = (region.x + x) % 5 === 0;
        doc.setDrawColor(...(edge || major ? [94, 108, 98] : [177, 186, 178]) as [number, number, number]);
        doc.setLineWidth(edge ? 0.25 : major ? 0.17 : 0.08); doc.line(left + x * cell, top, left + x * cell, top + region.height * cell);
    }
    for (let y = 0; y <= region.height; y++) {
        const edge = y === 0 || y === region.height, major = (region.y + y) % 5 === 0;
        doc.setDrawColor(...(edge || major ? [94, 108, 98] : [177, 186, 178]) as [number, number, number]);
        doc.setLineWidth(edge ? 0.25 : major ? 0.17 : 0.08); doc.line(left, top + y * cell, left + region.width * cell, top + y * cell);
    }
    for (const x of columns) text(String(region.x + x + 1), left + (x + 0.5) * cell, top - 2, 6.5, 'center');
    for (const y of rows) text(String(region.y + y + 1), left - 2, top + (y + 0.5) * cell + 0.75, 6.5, 'right');
}

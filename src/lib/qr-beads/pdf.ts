import type { jsPDF as JsPdf } from 'jspdf';
import type { SiteLocale } from '../i18n/locales';
import { snapshotQrExport } from './export';
import { qrPdfAxisLabels, qrPdfLayout, type QrPdfBoard } from './pdf-layout';
import { qrPdfMessages } from './pdf-messages';
import type { QrColor, QrProjectResult, QrState } from './types';

const FONT = 'FuseBeadQR';
const FONT_FILE = 'FuseBeadQR-Regular.ttf';
let fontPromise: Promise<string> | undefined;

/** Tool-owned OFL subset: no changes to the existing editor/letter PDF fonts. */
export function loadQrPdfFont(): Promise<string> {
    fontPromise ??= fetch(`/fonts/fuse-bead-qr/${FONT_FILE}`).then(async response => {
        if (!response.ok) throw new Error('PDF_FONT_UNAVAILABLE');
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length < 1_000 || bytes.length > 250_000) throw new Error('PDF_FONT_UNAVAILABLE');
        let binary = '';
        for (let n = 0; n < bytes.length; n += 8192) binary += String.fromCharCode(...bytes.subarray(n, n + 8192));
        return btoa(binary);
    }).catch(error => { fontPromise = undefined; throw error; });
    return fontPromise;
}

type FontMetadata = { metadata?: { cmap?: { unicode?: { codeMap?: Record<number, number> } } } };
function assertFont(doc: JsPdf, text: string): void {
    const map = (doc.getFont() as unknown as FontMetadata).metadata?.cmap?.unicode?.codeMap;
    if (!map || [...text].some(character => !map[character.codePointAt(0)!])) throw new Error('PDF_GLYPHS_MISSING');
}

function colorText(color: QrColor): [number, number, number] {
    return .299 * color.r + .587 * color.g + .114 * color.b > 127.5 ? [0, 0, 0] : [255, 255, 255];
}

/** An unmarked QR reference plus one counting sheet per real brand board. */
export async function createQrPdf(result: QrProjectResult, state: QrState, locale: SiteLocale, signal?: AbortSignal): Promise<Uint8Array> {
    signal?.throwIfAborted();
    if (!Object.hasOwn(qrPdfMessages, locale)) throw new Error('INVALID_OPTIONS');
    // Freeze before fetching fonts or modules, including the exact payload and
    // chosen paper. A late callback cannot mix new settings with old pixels.
    const snapshot = snapshotQrExport(result, state), copy = qrPdfMessages[locale];
    const { grid, pattern, usage, palette } = snapshot, paper = snapshot.state.paper;
    const layout = qrPdfLayout(grid.width, grid.height, palette.boardSize, paper);
    if (snapshot.draft.boardWidth !== layout.columns || snapshot.draft.boardHeight !== layout.rows) throw new Error('INVALID_PROJECT');
    const font = await loadQrPdfFont(); signal?.throwIfAborted();
    const { jsPDF } = await import('jspdf'); signal?.throwIfAborted();
    const doc = new jsPDF({ unit: 'mm', format: paper, orientation: 'portrait', compress: false, precision: 6, putOnlyUsedFonts: true });
    doc.addFileToVFS(FONT_FILE, font); doc.addFont(FONT_FILE, FONT, 'normal'); doc.setFont(FONT, 'normal');
    assertFont(doc, Object.values(copy).join('') + palette.label + usage.map(entry => entry.color.name + entry.color.ref).join('') + 'FUSE BEAD PATTERNSAB0123456789x /:.-');
    doc.setProperties({ title: copy.title, subject: `${grid.width} x ${grid.height} / ${palette.label}`, author: 'Fuse Bead Patterns', creator: 'Fuse Bead Patterns' });
    doc.setLanguage(({ en: 'en', de: 'de-DE', fr: 'fr-FR', ja: 'ja' } as const)[locale]);
    doc.viewerPreferences({ PrintScaling: 'None' });
    const text = (value: string | string[], x: number, y: number, size = 8, align: 'left' | 'center' | 'right' = 'left') => {
        doc.setFont(FONT, 'normal'); doc.setFontSize(size); doc.setTextColor(30, 44, 36);
        doc.text(value, x, y, { align, lineHeightFactor: 1.25 });
    };
    const lines = (value: string, size: number): string[] => {
        doc.setFont(FONT, 'normal'); doc.setFontSize(size);
        const wrapped = doc.splitTextToSize(value, layout.widthMm - 32) as string[];
        if (wrapped.length > 2) throw new Error('PDF_LAYOUT_OVERFLOW');
        return wrapped;
    };
    const header = () => { text('FUSE BEAD PATTERNS', 16, 11, 7); text(copy.title, 16, 23, 17); };
    const materials = (counts: number[], firstY: number, step: number) => {
        usage.forEach((entry, index) => {
            const y = firstY + index * step, color = entry.color;
            doc.setFillColor(color.r, color.g, color.b); doc.setDrawColor(80, 92, 84); doc.setLineWidth(.2);
            doc.rect(18, y - 4.5, 6, 6, 'FD');
            doc.setFont(FONT, 'normal'); doc.setFontSize(8); doc.setTextColor(...colorText(color));
            doc.text(index ? 'B' : 'A', 21, y, { align: 'center' });
            text(color.ref, 38, y, 8); text(color.name, 78, y, 8);
            text(String(counts[index]), layout.widthMm - 17, y, 8, 'right');
        });
    };
    const footer = (page: number, note: string) => {
        text(lines(note, 7.5), 16, layout.heightMm - 45, 7.5);
        text(lines(copy.caution, 7), 16, layout.heightMm - 35, 7);
        doc.setLineWidth(.5); doc.setDrawColor(0, 0, 0);
        doc.line(16, layout.heightMm - 21, 66, layout.heightMm - 21);
        for (let n = 0; n <= 10; n++) doc.line(16 + n * 5, layout.heightMm - 21, 16 + n * 5, layout.heightMm - (n % 2 ? 22.2 : 23.5));
        text(copy.ruler, 70, layout.heightMm - 20, 7);
        text(lines(copy.print, 7.2), 16, layout.heightMm - 15, 7.2);
        text('fusebeadpatterns.art', 16, layout.heightMm - 6, 6.8);
        text(`${copy.page} ${page} / ${layout.pageCount}`, layout.widthMm - 16, layout.heightMm - 6, 6.8, 'right');
    };
    header();
    text(`${copy.brand}: ${palette.label} / ${copy.grid}: ${grid.width} x ${grid.height}`, 16, 33, 8.5);
    text(`${copy.modules}: ${pattern.modules} x ${pattern.modules} / ${copy.scale}: ${pattern.beadsPerModule} x ${pattern.beadsPerModule} / ${copy.correction}: ${snapshot.state.errorCorrection}`, 16, 40, 8);
    text(`${copy.size}: ${grid.width * 5} x ${grid.height * 5} mm / ${copy.boards}: ${layout.columns} x ${layout.rows}`, 16, 47, 8);
    text('A / B', 18, 56, 7.5); text(copy.code, 38, 56, 7.5); text(copy.color, 78, 56, 7.5); text(copy.count, layout.widthMm - 17, 56, 7.5, 'right');
    materials(usage.map(entry => entry.count), 64, 10);
    text(`${copy.total}: ${grid.width * grid.height}`, 16, 82, 8);
    text(copy.border, 16, 87, 7);
    const { left, top, cellMm } = layout.overview, background = usage[1].color, foreground = usage[0].color;
    doc.setFillColor(background.r, background.g, background.b); doc.rect(left, top, grid.width * cellMm, grid.height * cellMm, 'F');
    doc.setFillColor(foreground.r, foreground.g, foreground.b);
    // Draw full QR modules directly. No grid, symbols, frames or text intersect
    // this complete square; the light four-module quiet zone is preserved.
    const k = pattern.beadsPerModule;
    for (let y = 0; y < pattern.modules; y++) for (let x = 0; x < pattern.modules; x++) {
        const px = (x + 4) * k, py = (y + 4) * k;
        if (pattern.mask[py * grid.width + px]) doc.rect(left + px * cellMm, top + py * cellMm, k * cellMm, k * cellMm, 'F');
    }
    footer(1, `${copy.reference}. ${copy.digital}`);
    const drawBoard = (board: QrPdfBoard) => {
        const { left: bx, top: by, cellMm: cell } = layout.board;
        const counts = [0, 0];
        for (let y = 0; y < board.height; y++) for (let x = 0; x < board.width; x++) {
            const mask = pattern.mask[(board.y + y) * grid.width + board.x + x], index = mask ? 0 : 1;
            const color = usage[index].color; counts[index]++;
            doc.setFillColor(color.r, color.g, color.b); doc.rect(bx + x * cell, by + y * cell, cell, cell, 'F');
            doc.setFont(FONT, 'normal'); doc.setFontSize(Math.min(8, cell * 1.8)); doc.setTextColor(...colorText(color));
            doc.text(index ? 'B' : 'A', bx + (x + .5) * cell, by + (y + .68) * cell, { align: 'center' });
        }
        // Full board outlines remain visible; cells beyond the real QR extent
        // are unfilled and have no symbol or bead/material contribution.
        doc.setDrawColor(121, 133, 125);
        for (let n = 0; n <= board.boardSize; n++) {
            doc.setLineWidth(n === 0 || n === board.boardSize ? .25 : n % 5 === 0 ? .15 : .07);
            doc.line(bx + n * cell, by, bx + n * cell, by + board.boardSize * cell);
            doc.line(bx, by + n * cell, bx + board.boardSize * cell, by + n * cell);
        }
        for (const x of qrPdfAxisLabels(board.x, board.boardSize, cell)) text(String(board.x + x + 1), bx + (x + .5) * cell, by - 2, 5.5, 'center');
        for (const y of qrPdfAxisLabels(board.y, board.boardSize, cell)) text(String(board.y + y + 1), bx - 2, by + (y + .65) * cell, 5.5, 'right');
        return counts;
    };
    for (const board of layout.boards) {
        await new Promise<void>(resolve => setTimeout(resolve, 0)); signal?.throwIfAborted();
        doc.addPage(paper, 'portrait'); header();
        text(`${copy.board} ${board.row}-${board.column} / ${copy.boards}: ${layout.rows} x ${layout.columns} / ${palette.boardSize} x ${palette.boardSize}`, 16, 33, 9);
        text(`${copy.rows}: ${board.y + 1}-${board.y + board.height} / ${copy.columns}: ${board.x + 1}-${board.x + board.width}`, 16, 40, 8);
        const counts = drawBoard(board); materials(counts, 50, 8);
        footer(board.page, copy.counting);
    }
    signal?.throwIfAborted();
    const output = doc.output('arraybuffer');
    if (!(output instanceof ArrayBuffer) || output.byteLength < 100) throw new Error('PDF_GENERATION_FAILED');
    return new Uint8Array(output);
}

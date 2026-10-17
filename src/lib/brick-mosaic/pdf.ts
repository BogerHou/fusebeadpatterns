import type { SiteLocale } from '../i18n/locales';
import { brickCopy } from './copy';
import { collectMosaicMaterials, validateMosaic, type BrickCatalog, type Mosaic } from './core';
import { brickLegend } from './export';
import { brickAxisLabels, brickPdfLayout, type BrickPaper } from './pdf-layout';

const FONT = 'FuseBeadBrickMosaic', FILE = 'FuseBeadBrickMosaic-Regular.ttf';
let fontPromise: Promise<string> | undefined;
export function loadBrickPdfFont(): Promise<string> {
    fontPromise ??= fetch(`/fonts/brick-mosaic/${FILE}`).then(async response => {
        if (!response.ok) throw new Error('PDF_FONT_UNAVAILABLE');
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length < 1000 || bytes.length > 300000) throw new Error('PDF_FONT_UNAVAILABLE');
        let binary = '';
        for (let n = 0; n < bytes.length; n += 8192) binary += String.fromCharCode(...bytes.subarray(n, n + 8192));
        return btoa(binary);
    }).catch(error => { fontPromise = undefined; throw error; });
    return fontPromise;
}

const interpolate = (value: string, values: Record<string, string | number>) => value.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)) as [number, number, number];
type FontMetadata = { metadata?: { cmap?: { unicode?: { codeMap?: Record<number, number> } } } };

/** Two references followed by one numbered counting diagram per real baseplate. */
export async function createBrickPdf(model: Mosaic, catalog: BrickCatalog, locale: SiteLocale, paper: BrickPaper, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
    signal?.throwIfAborted();
    if (!Object.hasOwn(brickCopy, locale)) throw new Error('INVALID_LOCALE');
    // Copy both model and catalogue before the first async boundary. A download
    // can never combine a new drawing with an old legend or a late import.
    const palette: BrickCatalog = { version: catalog.version, part: { ...catalog.part }, colors: catalog.colors.map(color => ({ ...color })) };
    const snapshot = validateMosaic(model, palette), materials = collectMosaicMaterials(snapshot, palette);
    const legend = brickLegend(snapshot, palette), keys = new Map(legend.map(entry => [entry.color.id, entry.key]));
    const copy = brickCopy[locale].pdfLabels, layout = brickPdfLayout(snapshot.width, snapshot.height, snapshot.boardSize, paper);
    if (materials.boards.length !== layout.boards.length || legend.length > 21) throw new Error('INVALID_LAYOUT');
    const font = await loadBrickPdfFont(); signal?.throwIfAborted();
    const { jsPDF } = await import('jspdf'); signal?.throwIfAborted();
    const doc = new jsPDF({ unit: 'mm', format: paper, orientation: 'portrait', compress: true, precision: 4, putOnlyUsedFonts: true });
    doc.addFileToVFS(FILE, font); doc.addFont(FILE, FONT, 'normal'); doc.setFont(FONT, 'normal');
    const cmap = (doc.getFont() as unknown as FontMetadata).metadata?.cmap?.unicode?.codeMap;
    const allText = Object.values(copy).join('') + legend.map(entry => entry.color.name).join('') + 'FUSE BEAD PATTERNSLDrawCC BY4.0Plate0123456789x/:-.()';
    if (!cmap || [...allText].some(char => !cmap[char.codePointAt(0)!])) throw new Error('PDF_GLYPHS_MISSING');
    doc.setProperties({ title: copy.title, subject: `${snapshot.width} x ${snapshot.height}; plate ${palette.part.designId}`, author: 'Fuse Bead Patterns', creator: 'Fuse Bead Patterns' });
    doc.setLanguage(({ en: 'en', de: 'de-DE', fr: 'fr-FR', ja: 'ja' } as const)[locale]);
    doc.viewerPreferences({ PrintScaling: 'None' });
    const text = (value: string | string[], x: number, y: number, size = 8, align: 'left' | 'center' | 'right' = 'left') => {
        doc.setFont(FONT, 'normal'); doc.setFontSize(size); doc.setTextColor(30, 44, 36);
        doc.text(value, x, y, { align, lineHeightFactor: 1.3 });
    };
    const wrap = (value: string, width: number, size = 7): string[] => {
        doc.setFont(FONT, 'normal'); doc.setFontSize(size);
        return doc.splitTextToSize(value, width) as string[];
    };
    const header = (subtitle: string) => {
        text('FUSE BEAD PATTERNS', 16, 12, 7);
        text(copy.title, 16, 23, 15); text(subtitle, 16, 33, 9);
    };
    const footer = (number: number) => {
        text(wrap(copy.note, layout.widthMm - 32, 6.6), 16, layout.heightMm - 19, 6.6);
        text('fusebeadpatterns.art', 16, layout.heightMm - 7, 6.8);
        text(interpolate(copy.page, { page: number, pages: layout.pageCount }), layout.widthMm - 16, layout.heightMm - 7, 6.8, 'right');
    };
    const cell = (colorId: string | null, x: number, y: number, side: number, numbered: boolean) => {
        if (!colorId) return;
        const entry = legend.find(value => value.color.id === colorId);
        if (!entry) throw new Error('INVALID_COLOR');
        const [r, g, b] = rgb(entry.color.hex);
        doc.setFillColor(r, g, b); doc.rect(x, y, side, side, 'F');
        if (numbered) {
            doc.setFont(FONT, 'normal'); doc.setFontSize(Math.min(7, side * 1.8));
            doc.setTextColor(...(.299 * r + .587 * g + .114 * b > 140 ? [0, 0, 0] : [255, 255, 255]) as [number, number, number]);
            doc.text(keys.get(colorId)!, x + side / 2, y + side * .69, { align: 'center' });
        }
    };
    header(copy.overview);
    text(`${copy.size}: ${snapshot.width} x ${snapshot.height} / ${copy.total}: ${materials.total}`, 16, 42, 8);
    text(`${brickCopy[locale].boardSize}: ${snapshot.boardSize} x ${snapshot.boardSize} / ${layout.rows} x ${layout.columns}`, 16, 49, 8);
    text(interpolate(brickCopy[locale].nominalSize, { width: (snapshot.width * .8).toFixed(1), height: (snapshot.height * .8).toFixed(1) }), 16, 56, 7.5);
    const overview = layout.overview;
    doc.setFillColor(243, 244, 241); doc.rect(overview.left, overview.top, snapshot.width * overview.cellMm, snapshot.height * overview.cellMm, 'F');
    for (let y = 0; y < snapshot.height; y++) for (let x = 0; x < snapshot.width; x++) cell(snapshot.cells[y * snapshot.width + x], overview.left + x * overview.cellMm, overview.top + y * overview.cellMm, overview.cellMm, false);
    doc.setDrawColor(65, 82, 70); doc.setLineWidth(.25);
    for (let x = 0; x <= snapshot.width; x += snapshot.boardSize) doc.line(overview.left + x * overview.cellMm, overview.top, overview.left + x * overview.cellMm, overview.top + snapshot.height * overview.cellMm);
    for (let y = 0; y <= snapshot.height; y += snapshot.boardSize) doc.line(overview.left, overview.top + y * overview.cellMm, overview.left + snapshot.width * overview.cellMm, overview.top + y * overview.cellMm);
    text(wrap(copy.approximation, layout.widthMm - 32), 16, 223, 7);
    text(wrap(copy.countNote, layout.widthMm - 32), 16, 238, 7);
    footer(1);

    doc.addPage(paper, 'portrait'); header(`${copy.material} / ${copy.part}: ${palette.part.designId} (1 x 1)`);
    const headings = [[copy.legend, 16, 10], [copy.color, 29, 54], [copy.partId, 87, 27], [copy.legoColorId, 117, 25], ['LDraw', 148, 20], [copy.quantity, layout.widthMm - 39, 23]] as const;
    for (const [label, left, width] of headings) text(wrap(label, width, 7), left, 44, 7);
    legend.forEach(({ color, count, key }, index) => {
        const y = layout.materials.top + index * layout.materials.rowMm;
        doc.setFillColor(...rgb(color.hex)); doc.setDrawColor(130, 140, 130); doc.rect(16, y - 3.7, 4.5, 4.5, 'FD');
        text(key, 24, y, 7.3, 'right'); text(color.name, 29, y, 7.3);
        text(color.elementId, 87, y, 7.3); text(color.legoColorId === null ? copy.unknownCode : String(color.legoColorId), 117, y, 7.3);
        text(String(color.ldrawCode), 148, y, 7.3); text(String(count), layout.widthMm - 16, y, 7.3, 'right');
    });
    text(`${copy.total}: ${materials.total}`, 16, 210, 9);
    text(wrap(copy.approximation, layout.widthMm - 32, 6.8), 16, 222, 6.8);
    text('RGB: LDraw.org - Colour Definition Reference / CC BY 4.0 / adapted subset.', 16, 237, 6.5);
    doc.setTextColor(45, 80, 60); doc.setFontSize(6.5);
    doc.textWithLink('https://ldraw.org/parts/colour.html', 16, 244, { url: 'https://ldraw.org/parts/colour.html' });
    doc.textWithLink('https://creativecommons.org/licenses/by/4.0/', 16, 250, { url: 'https://creativecommons.org/licenses/by/4.0/' });
    footer(2);

    for (const board of layout.boards) {
        await new Promise<void>(resolve => setTimeout(resolve, 0)); signal?.throwIfAborted();
        doc.addPage(paper, 'portrait');
        header(interpolate(copy.board, { number: board.number, row: board.row + 1, column: board.column + 1 }));
        text(`${copy.row}: ${board.startY + 1}-${board.startY + board.height} / ${copy.column}: ${board.startX + 1}-${board.startX + board.width}`, 16, 42, 8);
        const usage = materials.boards[board.number - 1];
        text(`${copy.total}: ${usage.occupied} / ${copy.padding}: ${board.padding}`, 16, 48, 7.5);
        const { left, top, sideMm, cellMm } = layout.diagram;
        doc.setFillColor(238, 240, 235); doc.rect(left, top, sideMm, sideMm, 'F');
        doc.setFillColor(255, 255, 255); doc.rect(left, top, board.width * cellMm, board.height * cellMm, 'F');
        for (let y = 0; y < board.height; y++) for (let x = 0; x < board.width; x++) cell(snapshot.cells[(board.startY + y) * snapshot.width + board.startX + x], left + x * cellMm, top + y * cellMm, cellMm, true);
        doc.setDrawColor(118, 130, 120);
        for (let n = 0; n <= snapshot.boardSize; n++) {
            doc.setLineWidth(n === 0 || n === snapshot.boardSize ? .25 : n % 5 === 0 ? .15 : .06);
            doc.line(left + n * cellMm, top, left + n * cellMm, top + sideMm);
            doc.line(left, top + n * cellMm, left + sideMm, top + n * cellMm);
        }
        for (const x of brickAxisLabels(board.startX, board.width)) text(String(board.startX + x + 1), left + (x + .5) * cellMm, top - 2, 5.5, 'center');
        for (const y of brickAxisLabels(board.startY, board.height)) text(String(board.startY + y + 1), left - 2, top + (y + .68) * cellMm, 5.5, 'right');
        text(`${copy.legend} / ${copy.partId} / ${copy.quantity}`, 16, 216, 6.5);
        legend.forEach(({ color, key }, index) => {
            const column = Math.floor(index / 7), row = index % 7;
            const left = 16 + column * (layout.widthMm - 32) / 3;
            text(`${key} / ${color.elementId} / ${usage.counts[index].count}`, left, layout.boardMaterials.top + row * layout.boardMaterials.rowMm, 7);
        });
        footer(board.number + 2);
    }
    signal?.throwIfAborted();
    return new Uint8Array(doc.output('arraybuffer'));
}

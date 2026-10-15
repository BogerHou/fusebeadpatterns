import { dimensions } from './core';

export type PixelGridPdfPaper = 'a4' | 'letter';
export type PixelGridPdfMode = 'overview' | 'tiled';
export type PixelGridPdfContent = 'artwork' | 'blank';
export type PixelGridPdfLocale = 'en' | 'de' | 'fr' | 'ja';

export interface PixelGridPdfTile {
    index: number;
    page: number;
    row: number;
    column: number;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface PixelGridPdfLayout {
    paper: PixelGridPdfPaper;
    widthMm: number;
    heightMm: number;
    gridWidth: number;
    gridHeight: number;
    mode: PixelGridPdfMode;
    tileColumns: number;
    tileRows: number;
    pageCount: number;
    tiles: PixelGridPdfTile[];
}

/** Digital counting-chart spacing, with no physical bead-size contract. */
export const PIXEL_GRID_PDF_TILE = Object.freeze({ columns: 40, rows: 48, cellMm: 4 });
export const PIXEL_GRID_PDF_PAPERS = Object.freeze({
    a4: Object.freeze({ width: 210, height: 297 }),
    letter: Object.freeze({ width: 215.9, height: 279.4 }),
});

export function pixelGridPdfLayout(width: number, height: number, paper: PixelGridPdfPaper, mode: PixelGridPdfMode): PixelGridPdfLayout {
    dimensions(width, height);
    if (!Object.hasOwn(PIXEL_GRID_PDF_PAPERS, paper) || (mode !== 'overview' && mode !== 'tiled')) throw new Error('INVALID_PIXEL_GRID_PDF_LAYOUT');
    const size = PIXEL_GRID_PDF_PAPERS[paper];
    const tileColumns = Math.ceil(width / PIXEL_GRID_PDF_TILE.columns);
    const tileRows = Math.ceil(height / PIXEL_GRID_PDF_TILE.rows);
    const tiles: PixelGridPdfTile[] = [];
    if (mode === 'tiled') {
        for (let row = 0; row < tileRows; row++) for (let column = 0; column < tileColumns; column++) {
            const x = column * PIXEL_GRID_PDF_TILE.columns, y = row * PIXEL_GRID_PDF_TILE.rows;
            tiles.push({ index: tiles.length, page: tiles.length + 2, row: row + 1, column: column + 1, x, y,
                width: Math.min(PIXEL_GRID_PDF_TILE.columns, width - x), height: Math.min(PIXEL_GRID_PDF_TILE.rows, height - y) });
        }
    }
    return { paper, widthMm: size.width, heightMm: size.height, gridWidth: width, gridHeight: height, mode,
        tileColumns, tileRows, pageCount: tiles.length + 1, tiles };
}

export function pixelGridPdfOverviewBox(layout: PixelGridPdfLayout): { left: number; top: number; cellMm: number } {
    const availableWidth = layout.widthMm - 48;
    const availableHeight = layout.mode === 'tiled' ? 165 : layout.heightMm - 86;
    const cellMm = Math.min(12, availableWidth / layout.gridWidth, availableHeight / layout.gridHeight);
    return { left: (layout.widthMm - layout.gridWidth * cellMm) / 2,
        top: 48 + (availableHeight - layout.gridHeight * cellMm) / 2, cellMm };
}

/** Select readable coordinates in a dense whole-grid preview, preserving ends. */
export function pixelGridPdfAxisLabels(start: number, count: number, cellMm: number): number[] {
    const step = Math.max(1, Math.ceil(4.5 / cellMm));
    const labels: number[] = [];
    for (let index = 0; index < count; index++) {
        const value = start + index + 1;
        if (index === 0 || index === count - 1 || value % step === 0) labels.push(index);
    }
    // A near-end periodic label can collide with the mandatory final label.
    if (labels.length > 2 && (labels.at(-1)! - labels.at(-2)!) * cellMm < 4.5) labels.splice(-2, 1);
    return labels;
}

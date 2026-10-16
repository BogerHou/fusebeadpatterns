import type { QrState } from './types';

export type QrPdfBoard = {
    page: number; column: number; row: number; x: number; y: number;
    width: number; height: number; boardSize: number;
};

export function qrPdfLayout(width: number, height: number, boardSize: number, paper: QrState['paper']) {
    if (![width, height].every(value => Number.isInteger(value) && value >= 1 && value <= 232)
        || width !== height || ![29, 50].includes(boardSize) || !['a4', 'letter'].includes(paper)) throw new Error('INVALID_OPTIONS');
    const widthMm = paper === 'a4' ? 210 : 215.9, heightMm = paper === 'a4' ? 297 : 279.4;
    const columns = Math.ceil(width / boardSize), rows = Math.ceil(height / boardSize);
    if (columns > 8 || rows > 8) throw new Error('INVALID_OPTIONS');
    const boards: QrPdfBoard[] = [];
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
        const x = column * boardSize, y = row * boardSize;
        boards.push({ page: boards.length + 2, column: column + 1, row: row + 1, x, y,
            width: Math.min(boardSize, width - x), height: Math.min(boardSize, height - y), boardSize });
    }
    const overviewCell = Math.min((widthMm - 32) / width, (heightMm - 145) / height);
    const boardCell = Math.min(5, (widthMm - 48) / boardSize, (heightMm - 118) / boardSize);
    return {
        paper, widthMm, heightMm, columns, rows, pageCount: boards.length + 1, boards,
        overview: { left: (widthMm - width * overviewCell) / 2, top: 90, cellMm: overviewCell },
        board: { left: (widthMm - boardSize * boardCell) / 2, top: 66, cellMm: boardCell },
    };
}

/** All coordinates are global; dense 50-cell boards show spaced readable labels. */
export function qrPdfAxisLabels(start: number, count: number, cellMm: number): number[] {
    if (![start, count].every(Number.isInteger) || start < 0 || count < 1 || count > 50
        || !Number.isFinite(cellMm) || cellMm < 3 || cellMm > 5) throw new Error('INVALID_OPTIONS');
    const step = cellMm < 4 ? 2 : 1;
    const indices = Array.from({ length: count }, (_, index) => index)
        .filter(index => index === 0 || index === count - 1 || (start + index + 1) % step === 0);
    if (indices.length > 2 && (indices[1] - indices[0]) * cellMm < 4) indices.splice(1, 1);
    if (indices.length > 2 && (indices.at(-1)! - indices.at(-2)!) * cellMm < 4) indices.splice(-2, 1);
    return indices;
}

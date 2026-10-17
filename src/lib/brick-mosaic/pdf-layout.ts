/** Counting diagrams, deliberately not life-size templates. Dimensions in mm. */
export type BrickPaper = 'a4' | 'letter';
export type BrickPdfBoard = {
    number: number; row: number; column: number;
    startX: number; startY: number; width: number; height: number;
    capacity: number; padding: number;
};

export function brickPdfLayout(width: number, height: number, boardSize: 32 | 48, paper: BrickPaper) {
    if (![width, height].every(value => Number.isSafeInteger(value) && value >= 1 && value <= 128)
        || ![32, 48].includes(boardSize) || !['a4', 'letter'].includes(paper)) throw new Error('INVALID_LAYOUT');
    const widthMm = paper === 'a4' ? 210 : 215.9, heightMm = paper === 'a4' ? 297 : 279.4;
    const columns = Math.ceil(width / boardSize), rows = Math.ceil(height / boardSize);
    const boards: BrickPdfBoard[] = [];
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
        const startX = column * boardSize, startY = row * boardSize;
        const w = Math.min(boardSize, width - startX), h = Math.min(boardSize, height - startY);
        boards.push({ number: boards.length + 1, row, column, startX, startY, width: w, height: h,
            capacity: w * h, padding: boardSize * boardSize - w * h });
    }
    const sideMm = 150, cellMm = sideMm / boardSize;
    const overviewScale = Math.min(150 / width, 142 / height);
    return { widthMm, heightMm, columns, rows, boards, pageCount: 2 + boards.length,
        diagram: { left: (widthMm - sideMm) / 2, top: 56, sideMm, cellMm },
        overview: { left: (widthMm - width * overviewScale) / 2, top: 65, cellMm: overviewScale },
        materials: { top: 54, rowMm: 7 },
        boardMaterials: { top: 220, rowMm: 4.5, columns: 3, rows: 7 },
    };
}

/** Sparse, unambiguous global coordinates, including both actual edges. */
export function brickAxisLabels(start: number, size: number): number[] {
    if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(size) || size < 1 || size > 48) throw new Error('INVALID_AXIS');
    return Array.from({ length: size }, (_, index) => index)
        .filter(index => index === 0 || index === size - 1 || (start + index + 1) % 5 === 0);
}

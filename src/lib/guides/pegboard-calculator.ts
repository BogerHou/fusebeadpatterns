export const PEGBOARD_DIMENSION_LIMIT = 10_000;

export const PEGBOARD_FIELDS = ['patternWidth', 'patternHeight', 'boardWidth', 'boardHeight'] as const;
export type PegboardField = typeof PEGBOARD_FIELDS[number];
export type PegboardInputs = Record<PegboardField, string>;
export type PegboardDimensions = Record<PegboardField, number>;

export type PegboardLayout = {
    boardsAcross: number;
    boardsDown: number;
    totalBoards: number;
    coverageWidth: number;
    coverageHeight: number;
};

/** Dimensions count usable grid positions, not beads or physical measurements. */
export function calculatePegboardLayout(dimensions: PegboardDimensions): PegboardLayout | null {
    if (!PEGBOARD_FIELDS.every(field => Number.isInteger(dimensions[field])
        && dimensions[field] >= 1 && dimensions[field] <= PEGBOARD_DIMENSION_LIMIT)) return null;

    const boardsAcross = Math.ceil(dimensions.patternWidth / dimensions.boardWidth);
    const boardsDown = Math.ceil(dimensions.patternHeight / dimensions.boardHeight);
    return {
        boardsAcross,
        boardsDown,
        totalBoards: boardsAcross * boardsDown,
        coverageWidth: boardsAcross * dimensions.boardWidth,
        coverageHeight: boardsDown * dimensions.boardHeight,
    };
}

/** Validate the whole current form before calculating, so no stale result survives an invalid edit. */
export function getPegboardCalculation(inputs: PegboardInputs): {
    layout: PegboardLayout | null;
    invalidFields: PegboardField[];
} {
    const dimensions = {} as PegboardDimensions;
    const invalidFields: PegboardField[] = [];
    for (const field of PEGBOARD_FIELDS) {
        const raw = inputs[field].trim();
        const value = /^\d+$/.test(raw) ? Number(raw) : NaN;
        if (!Number.isInteger(value) || value < 1 || value > PEGBOARD_DIMENSION_LIMIT) invalidFields.push(field);
        dimensions[field] = value;
    }
    return { layout: invalidFields.length ? null : calculatePegboardLayout(dimensions), invalidFields };
}

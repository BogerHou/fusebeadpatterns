import type { Palette } from '../core/model/palette/palette.model';
import { computeUsage, countBeads, createPaletteEntryColorMap, getPaletteEntryColorKey } from '../core/utils/utils';
import { EDITOR_DRAFT_BOARD_COUNT_MAX } from './draft';

/** Board coordinates are zero based; printed global ranges below are one based. */
export type BoardSelection = { row: number; column: number };
export type BoardMaterials = {
    selection: BoardSelection;
    pixels: Uint8ClampedArray;
    usage: Map<string, number>;
    beadCount: number;
    boardSize: number;
    bounds: { x: number; y: number; width: number; height: number };
    globalRows: { from: number; to: number };
    globalColumns: { from: number; to: number };
};
export type BoardSummary = BoardSelection & { beadCount: number; colorCount: number };

function validatePattern(pattern: Uint8ClampedArray, boardSize: number, boardWidth: number, boardHeight: number): void {
    if (![29, 57, 50].includes(boardSize) ||
        !Number.isInteger(boardWidth) || boardWidth < 1 || boardWidth > EDITOR_DRAFT_BOARD_COUNT_MAX ||
        !Number.isInteger(boardHeight) || boardHeight < 1 || boardHeight > EDITOR_DRAFT_BOARD_COUNT_MAX ||
        !(pattern instanceof Uint8ClampedArray) || pattern.length !== boardSize ** 2 * boardWidth * boardHeight * 4) {
        throw new Error('Invalid board pattern dimensions or pixels.');
    }
}

/** Validate before any printer is loaded or any output is created. */
export function validateBoardSelection(pattern: Uint8ClampedArray, boardSize: number, boardWidth: number, boardHeight: number, selection: BoardSelection): BoardSelection {
    validatePattern(pattern, boardSize, boardWidth, boardHeight);
    if (!selection || typeof selection !== 'object' || Array.isArray(selection) ||
        !Number.isInteger(selection.row) || selection.row < 0 || selection.row >= boardHeight ||
        !Number.isInteger(selection.column) || selection.column < 0 || selection.column >= boardWidth) {
        throw new Error('Invalid board selection.');
    }
    return { row: selection.row, column: selection.column };
}

/** Slice current RGBA pixels exactly; never rematch colors or resize the pattern. */
export function getBoardMaterials(pattern: Uint8ClampedArray, palettes: Palette[], boardSize: number, boardWidth: number, boardHeight: number, selection: BoardSelection): BoardMaterials {
    const position = validateBoardSelection(pattern, boardSize, boardWidth, boardHeight, selection);
    const x = position.column * boardSize, y = position.row * boardSize;
    const pixels = new Uint8ClampedArray(boardSize ** 2 * 4);
    const rowBytes = boardSize * 4, sourceRowBytes = boardWidth * rowBytes;
    for (let row = 0; row < boardSize; row++) {
        const start = (y + row) * sourceRowBytes + x * 4;
        pixels.set(pattern.subarray(start, start + rowBytes), row * rowBytes);
    }
    const usage = computeUsage(pixels, palettes);
    return {
        selection: position, pixels, usage, beadCount: countBeads(usage), boardSize,
        bounds: { x, y, width: boardSize, height: boardSize },
        globalRows: { from: y + 1, to: y + boardSize },
        globalColumns: { from: x + 1, to: x + boardSize },
    };
}

/** One RGBA scan and one palette map; no per-board pixel buffers are allocated. */
export function getBoardSummaries(pattern: Uint8ClampedArray, palettes: Palette[], boardSize: number, boardWidth: number, boardHeight: number): BoardSummary[] {
    validatePattern(pattern, boardSize, boardWidth, boardHeight);
    const summaries = Array.from({ length: boardWidth * boardHeight }, (_, index) => ({
        row: Math.floor(index / boardWidth), column: index % boardWidth, beadCount: 0, colorCount: 0,
    }));
    const references = summaries.map(() => new Set<string>());
    const entries = createPaletteEntryColorMap(palettes);
    const width = boardSize * boardWidth;
    for (let offset = 0; offset < pattern.length; offset += 4) {
        const entry = entries.get(getPaletteEntryColorKey(pattern[offset], pattern[offset + 1], pattern[offset + 2], pattern[offset + 3]));
        if (!entry) continue;
        const cell = offset / 4;
        const index = Math.floor(cell / width / boardSize) * boardWidth + Math.floor((cell % width) / boardSize);
        summaries[index].beadCount++;
        references[index].add(entry.ref);
    }
    return summaries.map((summary, index) => ({ ...summary, colorCount: references[index].size }));
}

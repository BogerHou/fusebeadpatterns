import { describe, expect, it } from 'vitest';
import { brickAxisLabels, brickPdfLayout } from './pdf-layout';

describe('physical baseplate counting layout', () => {
    it.each([32, 48] as const)('keeps %i-stud plates and paper dimensions independent', size => {
        for (const paper of ['a4', 'letter'] as const) {
            const value = brickPdfLayout(size, size, size, paper);
            expect(value.boards).toEqual([{ number: 1, row: 0, column: 0, startX: 0, startY: 0, width: size, height: size, capacity: size ** 2, padding: 0 }]);
            expect(value.pageCount).toBe(3);
            expect(value.diagram.sideMm).toBe(150);
            expect(value.diagram.cellMm).not.toBe(8); // Not a claimed life-size stud pitch.
            expect(value.boardMaterials.top + 7 * value.boardMaterials.rowMm).toBeLessThan(value.heightMm - 20);
        }
    });
    it('has exact global edge intersections at the 31/32 boundary', () => {
        const value = brickPdfLayout(33, 31, 32, 'letter');
        expect(value.columns).toBe(2); expect(value.rows).toBe(1);
        expect(value.boards.map(({ startX, width, height, capacity, padding }) => ({ startX, width, height, capacity, padding }))).toEqual([
            { startX: 0, width: 32, height: 31, capacity: 992, padding: 32 },
            { startX: 32, width: 1, height: 31, capacity: 31, padding: 993 },
        ]);
    });
    it('covers a rectangle once, without counting padding as material', () => {
        const value = brickPdfLayout(97, 49, 48, 'a4'), visits = new Uint8Array(97 * 49);
        for (const board of value.boards) for (let y = 0; y < board.height; y++) for (let x = 0; x < board.width; x++) visits[(board.startY + y) * 97 + board.startX + x]++;
        expect([...visits].every(count => count === 1)).toBe(true);
        expect(value.boards.reduce((sum, board) => sum + board.capacity, 0)).toBe(97 * 49);
        expect(value.boards[5]).toMatchObject({ startX: 96, startY: 48, width: 1, height: 1, capacity: 1, padding: 2303 });
    });
    it('rejects unsupported plates, papers and unsafe dimensions', () => {
        for (const args of [[0, 32, 32, 'a4'], [129, 32, 32, 'a4'], [32, 1.2, 48, 'letter'], [32, 32, 29, 'a4'], [32, 32, 48, 'legal']] as unknown as Parameters<typeof brickPdfLayout>[]) {
            expect(() => brickPdfLayout(...args)).toThrow();
        }
    });
    it('labels coordinates using global one-based numbers', () => {
        expect(brickAxisLabels(32, 4)).toEqual([0, 2, 3]); // 33, 35, 36.
        expect(brickAxisLabels(96, 1)).toEqual([0]);
    });
});

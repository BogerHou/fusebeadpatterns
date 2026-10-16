import { describe, expect, it } from 'vitest';
import { qrPdfAxisLabels, qrPdfLayout } from './pdf-layout';

describe('QR board-specific PDF planning', () => {
    it('always separates an unmarked overview from the physical board reading pages', () => {
        const plan = qrPdfLayout(33, 33, 29, 'a4');
        expect(plan.pageCount).toBe(5);
        expect(plan.boards.map(board => [board.x, board.y, board.width, board.height])).toEqual([
            [0, 0, 29, 29], [29, 0, 4, 29], [0, 29, 29, 4], [29, 29, 4, 4],
        ]);
        expect(plan.boards.map(board => board.page)).toEqual([2, 3, 4, 5]);
    });

    it('covers every real QR cell once without counting the rest of a partial brand board', () => {
        for (const size of [29, 50]) for (const side of [29, 33, 58, 117, 232]) {
            const plan = qrPdfLayout(side, side, size, 'letter'), visits = new Uint8Array(side * side);
            for (const board of plan.boards) for (let y = board.y; y < board.y + board.height; y++) {
                for (let x = board.x; x < board.x + board.width; x++) visits[y * side + x]++;
            }
            expect(visits.every(value => value === 1)).toBe(true);
            expect(plan.boards.reduce((sum, board) => sum + board.width * board.height, 0)).toBe(side ** 2);
        }
    });

    it('fits both actual brand boards at readable 3–5 mm counting spacing with margins', () => {
        for (const paper of ['a4', 'letter'] as const) for (const boardSize of [29, 50]) {
            const plan = qrPdfLayout(33, 33, boardSize, paper);
            expect(plan.board.cellMm).toBeGreaterThanOrEqual(3);
            expect(plan.board.cellMm).toBeLessThanOrEqual(5);
            expect(plan.board.left).toBeGreaterThanOrEqual(24);
            expect(plan.board.top + boardSize * plan.board.cellMm).toBeLessThanOrEqual(plan.heightMm - 52 + 1e-8);
            expect(plan.overview.top + 33 * plan.overview.cellMm).toBeLessThanOrEqual(plan.heightMm - 55 + 1e-8);
        }
    });

    it('caps the real 29-cell 8×8 arrangement at one overview plus 64 board pages', () => {
        expect(qrPdfLayout(232, 232, 29, 'letter').pageCount).toBe(65);
        expect(qrPdfLayout(232, 232, 50, 'letter').pageCount).toBe(26);
        expect(qrPdfLayout(29, 29, 29, 'a4').pageCount).toBe(2);
    });

    it('keeps global coordinate ends and avoids adjacent end labels in dense boards', () => {
        const labels = qrPdfAxisLabels(200, 50, 3.228);
        expect(labels[0]).toBe(0); expect(labels.at(-1)).toBe(49);
        expect(labels.every((n, index) => !index || n - labels[index - 1] >= 2)).toBe(true);
        expect(qrPdfAxisLabels(29, 29, 5)).toEqual(Array.from({ length: 29 }, (_, index) => index));
    });

    it('rejects unsupported shapes, unknown boards or out-of-range options', () => {
        for (const side of [0, 233, NaN, 1.5]) expect(() => qrPdfLayout(side, side, 29, 'a4')).toThrow();
        expect(() => qrPdfLayout(29, 30, 29, 'a4')).toThrow();
        expect(() => qrPdfLayout(29, 29, 28, 'a4')).toThrow();
        expect(() => qrPdfLayout(29, 29, 29, 'legal' as 'a4')).toThrow();
    });
});

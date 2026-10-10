import { describe, expect, it } from 'vitest';
import { calculatePegboardLayout, getPegboardCalculation, PEGBOARD_FIELDS, type PegboardDimensions, type PegboardInputs } from './pegboard-calculator';

const standard = (patternWidth: number, patternHeight: number): PegboardDimensions => ({ patternWidth, patternHeight, boardWidth: 29, boardHeight: 29 });
const validInputs: PegboardInputs = { patternWidth: '40', patternHeight: '60', boardWidth: '29', boardHeight: '29' };

describe('rectangular pegboard coverage', () => {
    it.each([
        [29, 29, 1, 1, 1, 29, 29],
        [30, 29, 2, 1, 2, 58, 29],
        [30, 30, 2, 2, 4, 58, 58],
        [58, 87, 2, 3, 6, 58, 87],
        [40, 60, 2, 3, 6, 58, 87],
    ])('covers a %s × %s grid with complete 29 × 29 boards', (width, height, across, down, total, coverageWidth, coverageHeight) => {
        expect(calculatePegboardLayout(standard(width, height))).toEqual({ boardsAcross: across, boardsDown: down, totalBoards: total, coverageWidth, coverageHeight });
    });

    it('handles custom rectangular boards independently on each axis', () => {
        expect(calculatePegboardLayout({ patternWidth: 8, patternHeight: 11, boardWidth: 3, boardHeight: 5 })).toEqual({ boardsAcross: 3, boardsDown: 3, totalBoards: 9, coverageWidth: 9, coverageHeight: 15 });
        expect(calculatePegboardLayout({ patternWidth: 11, patternHeight: 8, boardWidth: 5, boardHeight: 3 })).toEqual({ boardsAcross: 3, boardsDown: 3, totalBoards: 9, coverageWidth: 15, coverageHeight: 9 });
    });

    it('accepts both limits and keeps large totals exact', () => {
        expect(calculatePegboardLayout({ patternWidth: 10_000, patternHeight: 10_000, boardWidth: 1, boardHeight: 1 })).toEqual({ boardsAcross: 10_000, boardsDown: 10_000, totalBoards: 100_000_000, coverageWidth: 10_000, coverageHeight: 10_000 });
        expect(calculatePegboardLayout({ patternWidth: 1, patternHeight: 1, boardWidth: 10_000, boardHeight: 10_000 })).toEqual({ boardsAcross: 1, boardsDown: 1, totalBoards: 1, coverageWidth: 10_000, coverageHeight: 10_000 });
    });

    it('covers each axis while never adding an unnecessary full board', () => {
        for (const [width, height, boardWidth, boardHeight] of [[1, 17, 29, 5], [93, 62, 16, 17], [10_000, 1, 9999, 1], [57, 88, 29, 29]]) {
            const layout = calculatePegboardLayout({ patternWidth: width, patternHeight: height, boardWidth, boardHeight })!;
            expect(layout.coverageWidth).toBeGreaterThanOrEqual(width);
            expect(layout.coverageHeight).toBeGreaterThanOrEqual(height);
            expect(layout.coverageWidth - boardWidth).toBeLessThan(width);
            expect(layout.coverageHeight - boardHeight).toBeLessThan(height);
        }
    });

    it('rejects noninteger or out-of-range dimensions in any numeric field', () => {
        for (const field of PEGBOARD_FIELDS) for (const value of [0, -1, 1.5, 10_001, NaN, Infinity]) {
            expect(calculatePegboardLayout({ ...standard(40, 60), [field]: value })).toBeNull();
        }
    });
});

describe('current pegboard form validation', () => {
    it('returns the default coverage from the current valid inputs', () => {
        expect(getPegboardCalculation(validInputs)).toEqual({ layout: { boardsAcross: 2, boardsDown: 3, totalBoards: 6, coverageWidth: 58, coverageHeight: 87 }, invalidFields: [] });
    });

    it('clears the result for every invalid field rather than retaining a previous calculation', () => {
        for (const field of PEGBOARD_FIELDS) for (const value of ['', ' ', '0', '-3', '29.5', '10001', '1e3', '2x', '0x10']) {
            expect(getPegboardCalculation({ ...validInputs, [field]: value })).toEqual({ layout: null, invalidFields: [field] });
        }
    });

    it('reports all invalid fields and restores a result once every input is valid', () => {
        expect(getPegboardCalculation({ ...validInputs, patternHeight: '', boardWidth: '-1' })).toEqual({ layout: null, invalidFields: ['patternHeight', 'boardWidth'] });
        expect(getPegboardCalculation({ ...validInputs, patternHeight: '87', patternWidth: '58' }).layout?.totalBoards).toBe(6);
    });
});

import { describe, expect, it } from 'vitest';
import { BANNER_HEIGHT, BANNER_WIDTH, PATTERN_IDS, patternMask, patternOpacity, type PatternId } from './geometry';

function bounds(id: PatternId) {
    let left = 20, top = 40, right = 0, bottom = 0;
    const mask = patternMask(id);
    for (let y = 0; y < 40; y++) for (let x = 0; x < 20; x++) if (mask[y * 20 + x]) {
        left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
    }
    return [left, top, right, bottom];
}
function row(id: PatternId, y: number) { return Array.from({ length: 20 }, (_, x) => x).filter(x => patternOpacity(id, x, y) >= 128); }

describe('original schematic banner geometry', () => {
    it('contains exactly the32 ordinary pattern IDs with fresh bounded row-major masks', () => {
        expect(BANNER_WIDTH).toBe(20); expect(BANNER_HEIGHT).toBe(40);
        expect(PATTERN_IDS).toHaveLength(32); expect(new Set(PATTERN_IDS).size).toBe(32);
        for (const id of PATTERN_IDS) {
            const first = patternMask(id), second = patternMask(id);
            expect(first).toBeInstanceOf(Uint8Array); expect(first).toHaveLength(800); expect(first).not.toBe(second);
            expect(first.some(value => value > 0)).toBe(true); expect(first.some(value => value === 0)).toBe(true);
            for (let y = 0; y < 40; y++) for (let x = 0; x < 20; x++) {
                const value = patternOpacity(id, x, y);
                expect(Number.isInteger(value) && value >= 0 && value <= 255).toBe(true);
                expect(first[y * 20 + x]).toBe(value);
            }
            first.fill(42); expect(second.some(value => value !== 42)).toBe(true);
        }
    });

    it('rejects unknown identifiers and noninteger, outside or nonfinite coordinates', () => {
        for (const id of ['', 'base', 'bricks', 'creeper', '__proto__', null, 3]) {
            expect(() => patternOpacity(id as PatternId, 0, 0)).toThrow('INVALID_PATTERN');
            expect(() => patternMask(id as PatternId)).toThrow('INVALID_PATTERN');
        }
        for (const [x, y] of [[-1, 0], [20, 0], [0, -1], [0, 40], [.5, 0], [0, .5], [NaN, 0], [0, Infinity], ['1', 1]]) {
            expect(() => patternOpacity('stripe_left', x as number, y as number)).toThrow('INVALID_PATTERN_COORDINATES');
        }
    });

    it.each([
        ['square_top_left', [0, 0, 10, 14]], ['square_top_right', [10, 0, 20, 14]],
        ['square_bottom_left', [0, 26, 10, 40]], ['square_bottom_right', [10, 26, 20, 40]],
        ['stripe_left', [0, 0, 7, 40]], ['stripe_right', [13, 0, 20, 40]],
        ['stripe_center', [7, 0, 13, 40]], ['stripe_top', [0, 0, 20, 14]],
        ['stripe_bottom', [0, 26, 20, 40]], ['stripe_middle', [0, 17, 20, 23]],
        ['circle', [4, 14, 16, 26]], ['rhombus', [3, 8, 17, 32]],
        ['triangle_top', [0, 0, 20, 20]], ['triangle_bottom', [0, 20, 20, 40]],
        ['triangles_top', [0, 0, 20, 7]], ['triangles_bottom', [0, 33, 20, 40]],
    ] as [PatternId, number[]][])('%s keeps its independently specified principal bounds', (id, expected) => {
        expect(bounds(id)).toEqual(expected);
    });

    it('distinguishes all four diagonal names by their occupied corners and midpoint edges', () => {
        const expected: Record<string, number[][]> = {
            diagonal_left: [[255, 255, 255, 0], [0, 10], [0, 9]],
            diagonal_up_right: [[0, 255, 255, 255], [10, 19], [9, 19]],
            diagonal_up_left: [[255, 0, 255, 255], [0, 9], [0, 10]],
            diagonal_right: [[255, 255, 0, 255], [9, 19], [10, 19]],
        };
        for (const [key, [corners, middleTop, middleBottom]] of Object.entries(expected)) {
            const id = key as PatternId;
            expect([[0, 0], [19, 0], [0, 39], [19, 39]].map(([x, y]) => patternOpacity(id, x, y))).toEqual(corners);
            for (const [y, extent] of [[19, middleTop], [20, middleBottom]] as [number, number[]][]) {
                const actual = row(id, y); expect([actual[0], actual.at(-1)]).toEqual(extent);
            }
        }
    });

    it('downright follows upper-left to lower-right; downleft is its viewer-facing reflection', () => {
        expect(row('stripe_downright', 0)).toEqual([0, 1, 2, 3]);
        expect(row('stripe_downright', 10)).toEqual([2, 3, 4, 5, 6, 7, 8]);
        expect(row('stripe_downright', 39)).toEqual([16, 17, 18, 19]);
        expect(row('stripe_downleft', 0)).toEqual([16, 17, 18, 19]);
        expect(row('stripe_downleft', 39)).toEqual([0, 1, 2, 3]);
        expect(patternOpacity('cross', 0, 0)).toBe(255);
        expect(patternOpacity('cross', 19, 0)).toBe(255);
        expect(patternOpacity('cross', 0, 20)).toBe(0);
        expect(patternOpacity('straight_cross', 7, 0)).toBe(0);
        expect(patternOpacity('straight_cross', 8, 0)).toBe(255);
        expect(patternOpacity('straight_cross', 0, 17)).toBe(0);
        expect(patternOpacity('straight_cross', 0, 18)).toBe(255);
    });

    it('half masks retain their semitransparent centre edge rather than pretending to be binary', () => {
        expect([9, 10, 11].map(x => patternOpacity('half_vertical', x, 0))).toEqual([255, 128, 0]);
        expect([8, 9, 10].map(x => patternOpacity('half_vertical_right', x, 0))).toEqual([0, 128, 255]);
        expect([19, 20, 21].map(y => patternOpacity('half_horizontal', 0, y))).toEqual([255, 128, 0]);
        expect([18, 19, 20].map(y => patternOpacity('half_horizontal_bottom', 0, y))).toEqual([0, 128, 255]);
    });

    it('gradient opacity is an original linear ramp, monotone, horizontally flat and vertically reflected', () => {
        expect(patternOpacity('gradient', 0, 0)).toBe(255); expect(patternOpacity('gradient', 19, 39)).toBe(0);
        for (let y = 0; y < 40; y++) {
            expect(patternOpacity('gradient', 0, y)).toBe(Math.round(255 * (39 - y) / 39));
            for (let x = 0; x < 20; x++) expect(patternOpacity('gradient', x, y)).toBe(patternOpacity('gradient_up', x, 39 - y));
            if (y) expect(patternOpacity('gradient', 0, y)).toBeLessThan(patternOpacity('gradient', 0, y - 1));
        }
    });

    it('independent mirror pairs and symmetric shapes agree across the entire face', () => {
        const horizontalPairs: [PatternId, PatternId][] = [
            ['square_top_left', 'square_top_right'], ['square_bottom_left', 'square_bottom_right'],
            ['stripe_left', 'stripe_right'], ['stripe_downleft', 'stripe_downright'],
            ['diagonal_left', 'diagonal_right'], ['diagonal_up_left', 'diagonal_up_right'], ['half_vertical', 'half_vertical_right'],
        ];
        const verticalPairs: [PatternId, PatternId][] = [
            ['stripe_top', 'stripe_bottom'], ['square_top_left', 'square_bottom_left'],
            ['triangle_top', 'triangle_bottom'], ['triangles_top', 'triangles_bottom'],
            ['diagonal_left', 'diagonal_up_left'], ['half_horizontal', 'half_horizontal_bottom'],
        ];
        for (let y = 0; y < 40; y++) for (let x = 0; x < 20; x++) {
            for (const [a, b] of horizontalPairs) expect(patternOpacity(a, x, y)).toBe(patternOpacity(b, 19 - x, y));
            for (const [a, b] of verticalPairs) expect(patternOpacity(a, x, y)).toBe(patternOpacity(b, x, 39 - y));
            for (const id of ['circle', 'rhombus', 'border', 'cross', 'straight_cross'] as const) {
                expect(patternOpacity(id, x, y)).toBe(patternOpacity(id, 19 - x, y));
                expect(patternOpacity(id, x, y)).toBe(patternOpacity(id, x, 39 - y));
            }
        }
    });

    it('border and narrow stripes preserve independent interior gaps', () => {
        expect(row('small_stripes', 12)).toEqual([1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18]);
        expect(row('border', 12)).toEqual([0, 1, 2, 17, 18, 19]);
        expect(patternOpacity('border', 10, 2)).toBe(255); expect(patternOpacity('border', 10, 3)).toBe(0);
        expect(patternOpacity('border', 10, 36)).toBe(0); expect(patternOpacity('border', 10, 37)).toBe(255);
    });
});

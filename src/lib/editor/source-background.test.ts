import { describe, expect, it } from 'vitest';
import { createSourceBackgroundMaskSteps, isValidSourceBackground, normalizeSourceBackground, runSourceBackgroundMask,
    SOURCE_BACKGROUND_MAX_PIXELS, validateSourceBackgroundDimensions, type SourceBackground, type SourceBackgroundMaskRequest } from './source-background';

const setting = (mode: SourceBackground['mode'] = 'edge-connected', tolerance = 0): SourceBackground => ({ color: { r: 255, g: 255, b: 255 }, mode, tolerance });
function grid(rows: string[], background = setting()): SourceBackgroundMaskRequest {
    const colors: Record<string, number[]> = { W: [255, 255, 255, 255], R: [200, 0, 0, 255], T: [17, 23, 41, 0], A: [255, 255, 255, 1] };
    return { width: rows[0].length, height: rows.length, pixels: new Uint8ClampedArray(rows.flatMap(row => [...row].flatMap(cell => colors[cell]))), background };
}
function rows(mask: Uint8Array, width: number): string[] {
    return Array.from({ length: mask.length / width }, (_, y) => [...mask.subarray(y * width, (y + 1) * width)].join(''));
}

describe('strict source background settings', () => {
    it('keeps off as null and returns a detached valid setting without coercion', () => {
        expect(normalizeSourceBackground(undefined)).toBeNull(); expect(normalizeSourceBackground(null)).toBeNull();
        const input = setting('all-matching', 255), result = normalizeSourceBackground(input)!;
        expect(result).toEqual(input); expect(result).not.toBe(input); expect(result.color).not.toBe(input.color);
        input.color.r = 0; expect(result.color.r).toBe(255);
        expect(isValidSourceBackground(null)).toBe(false);
        const plain = Object.assign(Object.create(null), setting());
        plain.color = Object.assign(Object.create(null), plain.color);
        expect(normalizeSourceBackground(plain)).toEqual(setting());
    });

    it('does not execute getter properties and rejects unknown, hidden, Symbol and inherited fields', () => {
        let accessed = 0;
        const getter = { ...setting() }; Object.defineProperty(getter, 'tolerance', { enumerable: true, get: () => { accessed++; return 0; } });
        const colorGetter = setting(); Object.defineProperty(colorGetter.color, 'r', { enumerable: true, get: () => { accessed++; return 255; } });
        const hidden = setting(); Object.defineProperty(hidden, 'hidden', { value: true });
        const symbol = { ...setting(), [Symbol('extra')]: true };
        const colorExtra = { ...setting(), color: { r: 255, g: 255, b: 255, alpha: 255 } };
        const inherited = Object.create(setting());
        const invalid: unknown[] = [getter, colorGetter, hidden, symbol, colorExtra, inherited, [], new Date(),
            { ...setting(), tolerance: '0' }, { ...setting(), tolerance: 0.5 }, { ...setting(), tolerance: NaN },
            { ...setting(), tolerance: -1 }, { ...setting(), tolerance: 256 }, { ...setting(), mode: 'all' },
            { ...setting(), color: { r: 256, g: 0, b: 0 } }, new Proxy({}, { ownKeys: () => { throw new Error('no'); } })];
        for (const value of invalid) { expect(isValidSourceBackground(value)).toBe(false); expect(() => normalizeSourceBackground(value)).toThrow(); }
        expect(accessed).toBe(0);
    });
});

describe('raw ROI background topology', () => {
    it('removes only boundary-connected matching cells and keeps a closed matching hole', () => {
        const request = grid(['WWWWW', 'WRRRW', 'WRWRW', 'WRRRW', 'WWWWW']), before = request.pixels.slice();
        const edge = runSourceBackgroundMask(request);
        expect(rows(edge.mask, 5)).toEqual(['00000', '01110', '01110', '01110', '00000']);
        expect([...edge.pixels.subarray((2 * 5 + 2) * 4, (2 * 5 + 2) * 4 + 4)]).toEqual([255, 255, 255, 255]);
        const all = runSourceBackgroundMask({ ...request, background: setting('all-matching') });
        expect(rows(all.mask, 5)).toEqual(['00000', '01110', '01010', '01110', '00000']);
        expect(Buffer.from(request.pixels).equals(Buffer.from(before))).toBe(true);
        expect([...edge.pixels.subarray(0, 4)]).toEqual([0, 0, 0, 0]);
        expect([...all.pixels.subarray((2 * 5 + 2) * 4, (2 * 5 + 2) * 4 + 4)]).toEqual([0, 0, 0, 0]);
    });

    it('uses four-neighbor topology, not diagonal adjacency', () => {
        const diagonal = runSourceBackgroundMask(grid(['WRR', 'RWR', 'RRR']));
        expect(rows(diagonal.mask, 3)).toEqual(['011', '111', '111']);
    });

    it('transparent cells are always empty and form a valid path to a matching interior', () => {
        const request = grid(['RRTTR', 'RRTRR', 'RRWRR', 'RRRRR', 'RRTTR']);
        const result = runSourceBackgroundMask(request);
        expect(rows(result.mask, 5)).toEqual(['11001', '11011', '11011', '11111', '11001']);
        const isolated = runSourceBackgroundMask(grid(['RRR', 'RTR', 'RRR']));
        expect(rows(isolated.mask, 3)).toEqual(['111', '101', '111']);
    });

    it('uses raw RGB max-channel threshold inclusively, independent of partial alpha', () => {
        const request: SourceBackgroundMaskRequest = { width: 5, height: 1, background: { color: { r: 100, g: 120, b: 140 }, tolerance: 10, mode: 'all-matching' },
            pixels: new Uint8ClampedArray([110, 110, 140, 255, 100, 120, 151, 255, 100, 120, 140, 1, 100, 120, 140, 128, 15, 16, 17, 0]) };
        const result = runSourceBackgroundMask(request);
        expect([...result.mask]).toEqual([0, 1, 0, 0, 0]);
        expect([...result.pixels.subarray(4, 8)]).toEqual([100, 120, 151, 255]);
        expect(rows(runSourceBackgroundMask(grid(['ARW'])).mask, 3)).toEqual(['010']);
    });

    it.each([['W'], ['R'], ['T'], ['WWWWW'], ['W', 'R', 'W']])('handles a one-cell axis: %j', (...parts: unknown[]) => {
        const input = (Array.isArray(parts[0]) ? parts[0] : parts.filter(value => typeof value === 'string')) as string[];
        const request = grid(input), result = runSourceBackgroundMask(request);
        expect([...result.mask]).toEqual(input.join('').split('').map(value => value === 'R' ? 1 : 0));
    });

    it('bounds dimensions before allocating mask/queue/output and yields during traversal and output', () => {
        validateSourceBackgroundDimensions(4000, 2000);
        expect(SOURCE_BACKGROUND_MAX_PIXELS).toBe(8_000_000);
        for (const [width, height] of [[4001, 2000], [16385, 1], [1, 16385], [0, 1], [NaN, 1], [1.5, 1]]) expect(() => validateSourceBackgroundDimensions(width, height)).toThrow();
        expect(() => runSourceBackgroundMask({ width: 16385, height: 1, pixels: new Uint8ClampedArray(0), background: setting() })).toThrow();
        const request = grid(Array(65).fill('W'.repeat(65))), steps = createSourceBackgroundMaskSteps(request);
        let step = steps.next(), yields = 0;
        while (!step.done) { yields++; step = steps.next(); }
        expect(yields).toBeGreaterThan(2); expect(step.value.mask.every(value => value === 0)).toBe(true);
    });
});

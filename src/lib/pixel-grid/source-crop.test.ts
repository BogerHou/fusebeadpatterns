import { describe, expect, it } from 'vitest';
import { cropPixelSource, validatePixelSourceCrop } from './source-crop';
import { resizeImage } from './core';
import { cropFields, drawCrop, moveCrop, parseCropFields, resizeCrop, resizeCropBy } from '../editor/crop-selection';

function source() {
    const pixels = new Uint8ClampedArray(6 * 4 * 4);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) pixels.set([1 + 10 * y + x, 100 + x, 200 + y, x === 2 ? 0 : x * 40], (y * 6 + x) * 4);
    return { width: 6, height: 4, pixels };
}
const crop = { sourceWidth: 6, sourceHeight: 4, x: 0, y: 2, width: 4, height: 2 };

describe('original RGBA subject selection', () => {
    it.each(['fit', 'crop', 'stretch'] as const)('keeps the original %s byte behavior when no area was chosen', mode => {
        const input = source();
        expect(cropPixelSource(input, null)).toBe(input);
        expect(resizeImage(cropPixelSource(input, null), 4, 4, mode)).toEqual(resizeImage(input, 4, 4, mode));
    });
    it.each([
        ['fit', [[0, 0, 0, 0], [21, 22, 23, 24], [31, 32, 33, 34], [0, 0, 0, 0]]],
        ['crop', [[22, 22, 23, 23], [22, 22, 23, 23], [32, 32, 33, 33], [32, 32, 33, 33]]],
        ['stretch', [[21, 22, 23, 24], [21, 22, 23, 24], [31, 32, 33, 34], [31, 32, 33, 34]]],
    ] as const)('selects the off-centre original region before %s with all four channels unchanged', (mode, rows) => {
        const input = source(), before = input.pixels.slice();
        const selected = cropPixelSource(input, crop);
        const actual = resizeImage(selected, 4, 4, mode);
        const expected: number[] = [];
        for (const row of rows) for (const r of row) {
            if (r === 0) expected.push(0, 0, 0, 0);
            else { const y = Math.floor((r - 1) / 10), x = r - 1 - 10 * y; expected.push(r, 100 + x, 200 + y, x === 2 ? 0 : x * 40); }
        }
        expect([...actual.pixels]).toEqual(expected);
        expect(input.pixels).toEqual(before);
        expect(selected.pixels).not.toBe(input.pixels);
    });
    it('requires exact source-bound integer rectangles, rejecting getters, extra keys and detached crop data', () => {
        const input = source(); let reads = 0;
        for (const bad of [{ ...crop, x: -1 }, { ...crop, width: 7 }, { ...crop, x: 1.5 }, { ...crop, sourceWidth: 5 }, { ...crop, height: 0 }, { ...crop, extra: 1 }, Object.assign(Object.create({ inherited: true }), crop)]) {
            expect(() => validatePixelSourceCrop(bad, input)).toThrow();
        }
        const getter = { ...crop }; Object.defineProperty(getter, 'x', { get() { reads++; return 0; }, enumerable: true });
        expect(() => validatePixelSourceCrop(getter, input)).toThrow(); expect(reads).toBe(0);
        expect(() => validatePixelSourceCrop(crop, null)).toThrow();
        const owned = validatePixelSourceCrop(crop, input)!; owned.x = 1;
        expect(crop.x).toBe(0);
        expect(validatePixelSourceCrop({ ...crop, y: 0, width: 6, height: 4 }, input)).toBeNull();
    });
    it('uses decoded coordinates for reverse dragging, edge movement and keyboard corner resizing', () => {
        expect(drawCrop(6, 4, { x: 5.8, y: 3.8 }, { x: 1.1, y: 1.1 })).toEqual({ sourceWidth: 6, sourceHeight: 4, x: 1, y: 1, width: 5, height: 3 });
        expect(moveCrop(crop, 10, -10)).toEqual({ ...crop, x: 2, y: 0 });
        expect(resizeCropBy(crop, 'ne', -1, -1)).toEqual({ ...crop, width: 3, y: 1, height: 3 });
        expect(resizeCrop(crop, 'sw', { x: 2, y: 3 })).toEqual({ ...crop, x: 2, width: 2, height: 1 });
        expect(parseCropFields(cropFields(crop), 6, 4)).toEqual(crop);
        for (const value of ['', '1e', '-1', '2.5']) expect(parseCropFields({ ...cropFields(crop), width: value }, 6, 4)).toBeNull();
    });
});

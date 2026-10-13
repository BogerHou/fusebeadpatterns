import { describe, expect, it } from 'vitest';
import { cropFields, drawCrop, moveCrop, parseCropFields, resizeCrop, resizeCropBy } from './crop-selection';
import { isValidSourceCrop } from '../core/utils/image-crop';

const area = { sourceWidth: 800, sourceHeight: 600, x: 100, y: 80, width: 300, height: 200 };
describe('source crop interactions', () => {
    it('parses original-image pixels without converting preview coordinates', () => {
        expect(parseCropFields(cropFields(area), 800, 600)).toEqual(area);
        for (const value of ['', '1.5', '-1', 'NaN', '1e3', ' 1', '9007199254740992']) {
            expect(parseCropFields({ ...cropFields(area), x: value }, 800, 600)).toBeNull();
        }
        expect(parseCropFields({ ...cropFields(area), x: '700' }, 800, 600)).toBeNull();
        expect(parseCropFields({ x: '799', y: '599', width: '1', height: '1' }, 800, 600)).toMatchObject({ x: 799, y: 599, width: 1, height: 1 });
    });
    it('accepts reversed pointer drag and clips to the original image', () => {
        expect(drawCrop(800, 600, { x: 400, y: 280 }, { x: 100, y: 80 })).toEqual(area);
        expect(drawCrop(800, 600, { x: -20, y: -30 }, { x: 850, y: 640 })).toEqual({ sourceWidth: 800, sourceHeight: 600, x: 0, y: 0, width: 800, height: 600 });
        expect(drawCrop(800, 600, { x: 800, y: 600 }, { x: 800, y: 600 })).toMatchObject({ x: 799, y: 599, width: 1, height: 1 });
    });
    it('moves without resizing or escaping the image', () => {
        expect(moveCrop(area, 900, -900)).toEqual({ ...area, x: 500, y: 0 });
        expect(moveCrop(area, 0.4, 1.6)).toEqual({ ...area, y: 82 });
    });
    it('keeps the opposite corner fixed and cannot invert the rectangle', () => {
        expect(resizeCrop(area, 'nw', { x: 350, y: 260 })).toEqual({ ...area, x: 350, y: 260, width: 50, height: 20 });
        expect(resizeCrop(area, 'se', { x: -1, y: -1 })).toEqual({ ...area, width: 1, height: 1 });
        for (const corner of ['nw', 'ne', 'sw', 'se'] as const) {
            for (const point of [{ x: -900, y: -900 }, { x: 900, y: 900 }, { x: 200.4, y: 199.7 }]) expect(isValidSourceCrop(resizeCrop(area, corner, point))).toBe(true);
        }
    });
    it('resizes by pointer movement without jumping to the touched part of a large corner handle', () => {
        for (const corner of ['nw', 'ne', 'sw', 'se'] as const) expect(resizeCropBy(area, corner, 0, 0)).toEqual(area);
        expect(resizeCropBy(area, 'nw', 1, 2)).toEqual({ ...area, x: 101, y: 82, width: 299, height: 198 });
        expect(resizeCropBy(area, 'se', -1, -2)).toEqual({ ...area, width: 299, height: 198 });
        expect(resizeCropBy(area, 'ne', 20, 10)).toEqual({ ...area, y: 90, width: 320, height: 190 });
        expect(resizeCropBy(area, 'sw', -20, -10)).toEqual({ ...area, x: 80, width: 320, height: 190 });
        expect(resizeCropBy(area, 'nw', 999, 999)).toEqual({ ...area, x: 399, y: 279, width: 1, height: 1 });
    });
});

import { describe, expect, it } from 'vitest';
import { backgroundColorHex, parseBackgroundCandidate, pickBackgroundColor, validateBackgroundPreview } from './source-background-selection';
import { EDITOR_PROJECT_PATTERN_DIMENSION_MAX } from './editor-limits';

describe('background candidate fields and original pixel picking', () => {
    it('keeps off distinct from invalid and retains only exact integer tolerance/RGB fields', () => {
        expect(parseBackgroundCandidate(false, '', 'bad', 'edge-connected')).toBeNull();
        expect(parseBackgroundCandidate(true, '#fF010A', '255', 'all-matching')).toEqual({ color: { r: 255, g: 1, b: 10 }, tolerance: 255, mode: 'all-matching' });
        expect(backgroundColorHex({ r: 255, g: 1, b: 10 })).toBe('#ff010a');
        for (const value of ['', '-1', '256', '1.5', '1e2', ' 2', '+2', '0000']) expect(parseBackgroundCandidate(true, '#aabbcc', value, 'edge-connected')).toBeUndefined();
        for (const value of ['', '#fff', '#gg0000', '#000000 ', 'rgb(0,0,0)']) expect(parseBackgroundCandidate(true, value, '0', 'edge-connected')).toBeUndefined();
    });
    it('maps scaled CSS coordinates to precise raw ROI pixels without sampling or compositing the displayed canvas', () => {
        const image = { width: 3, height: 2, pixels: new Uint8ClampedArray([255, 0, 1, 255, 2, 3, 4, 0, 9, 8, 7, 1, 10, 20, 30, 255, 40, 50, 60, 128, 70, 80, 90, 255]) };
        const rect = { left: 10, top: 20, width: 150, height: 100 }, original = image.pixels.slice();
        expect(pickBackgroundColor(image, rect, 10, 20)).toEqual({ r: 255, g: 0, b: 1 });
        expect(pickBackgroundColor(image, rect, 60, 20)).toBeNull();
        expect(pickBackgroundColor(image, rect, 110, 20)).toEqual({ r: 9, g: 8, b: 7 });
        expect(pickBackgroundColor(image, rect, 60, 70)).toEqual({ r: 40, g: 50, b: 60 });
        expect(pickBackgroundColor(image, rect, 159.99, 119.99)).toEqual({ r: 70, g: 80, b: 90 });
        for (const [x, y] of [[9, 20], [160, 20], [10, 120], [NaN, 20]]) expect(pickBackgroundColor(image, rect, x, y)).toBeNull();
        expect(pickBackgroundColor(image, { ...rect, width: 0 }, 10, 20)).toBeNull(); expect(image.pixels).toEqual(original);
    });
    it('accepts the full legal bead preview and rejects malformed drawing dimensions/bytes/counts', () => {
        const width = EDITOR_PROJECT_PATTERN_DIMENSION_MAX, pixels = new Uint8ClampedArray(width * width * 4);
        const full = { width, height: width, pixels, totalBeads: 0 }; expect(validateBackgroundPreview(full)).toBe(full);
        for (const change of [{ width: width + 1 }, { height: 0 }, { width: 1.5 }, { pixels: pixels.subarray(0, 4) }, { totalBeads: -1 }, { totalBeads: width * width + 1 }, { totalBeads: 1.5 }]) expect(() => validateBackgroundPreview({ ...full, ...change })).toThrow();
    });
});

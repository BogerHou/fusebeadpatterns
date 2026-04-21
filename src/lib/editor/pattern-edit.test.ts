import { describe, expect, it } from 'vitest';

import { Color } from '../core/model/color/color.model';
import { PaletteEntry } from '../core/model/palette/palette.model';
import {
    fillMatchingPatternRegion,
    getPatternDataIndex,
    paletteEntryMatchesPatternPixel,
    patternPixelMatchesColor,
    setPatternPixelToEntry,
} from './pattern-edit';

function createEntry(ref: string, color: Color): PaletteEntry {
    const entry = new PaletteEntry(ref, color);
    entry.ref = ref;
    entry.symbol = ref;
    entry.prefix = 'T';
    return entry;
}

describe('pattern edit helpers', () => {
    it('writes palette entries and transparent pixels into pattern data', () => {
        const data = new Uint8ClampedArray(2 * 1 * 4);
        const entry = createEntry('red', new Color(255, 0, 0, 255));

        setPatternPixelToEntry(data, 2, { x: 1, y: 0 }, entry);

        expect(Array.from(data)).toEqual([
            0, 0, 0, 0,
            255, 0, 0, 255,
        ]);
        expect(
            paletteEntryMatchesPatternPixel(
                entry,
                data,
                getPatternDataIndex(2, { x: 1, y: 0 })
            )
        ).toBe(true);

        setPatternPixelToEntry(data, 2, { x: 1, y: 0 }, null);

        expect(Array.from(data)).toEqual([
            0, 0, 0, 0,
            0, 0, 0, 0,
        ]);
    });

    it('matches pixels against explicit rgba colors', () => {
        const data = new Uint8ClampedArray([10, 20, 30, 255]);

        expect(patternPixelMatchesColor(data, 0, [10, 20, 30, 255])).toBe(true);
        expect(patternPixelMatchesColor(data, 0, [10, 20, 30, 128])).toBe(false);
    });

    it('fills only the contiguous matching region', () => {
        const width = 3;
        const height = 3;
        const data = new Uint8ClampedArray([
            1, 1, 1, 255, 1, 1, 1, 255, 9, 9, 9, 255,
            1, 1, 1, 255, 9, 9, 9, 255, 9, 9, 9, 255,
            9, 9, 9, 255, 9, 9, 9, 255, 1, 1, 1, 255,
        ]);
        const replacement = createEntry('blue', new Color(0, 0, 255, 255));

        expect(
            fillMatchingPatternRegion(
                data,
                width,
                height,
                { x: 0, y: 0 },
                replacement
            )
        ).toBe(true);

        expect(Array.from(data)).toEqual([
            0, 0, 255, 255, 0, 0, 255, 255, 9, 9, 9, 255,
            0, 0, 255, 255, 9, 9, 9, 255, 9, 9, 9, 255,
            9, 9, 9, 255, 9, 9, 9, 255, 1, 1, 1, 255,
        ]);
    });

    it('skips fills when the replacement already matches or the point is out of bounds', () => {
        const data = new Uint8ClampedArray([1, 2, 3, 255]);
        const replacement = createEntry('same', new Color(1, 2, 3, 255));

        expect(
            fillMatchingPatternRegion(
                data,
                1,
                1,
                { x: 0, y: 0 },
                replacement
            )
        ).toBe(false);
        expect(
            fillMatchingPatternRegion(
                data,
                1,
                1,
                { x: 1, y: 0 },
                replacement
            )
        ).toBe(false);
    });
});

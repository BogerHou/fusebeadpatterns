import { describe, expect, it } from 'vitest';

import { Color } from '../model/color/color.model';
import { MATCHINGS } from '../model/matching/matching.model';
import { Palette, PaletteEntry } from '../model/palette/palette.model';
import {
    computeUsage,
    createPaletteEntryColorMap,
    createPaletteEntryRefMap,
    getClosestPaletteEntry,
    getPaletteEntryColorKey,
    getPaletteEntryFromRefMap,
    removeColorUnderPercent,
} from './utils';

function createEntry(ref: string, color: Color): PaletteEntry {
    const entry = new PaletteEntry(ref, color);
    entry.ref = ref;
    entry.symbol = ref;
    entry.prefix = 'T';
    return entry;
}

describe('core utils', () => {
    it('counts bead usage with a single palette lookup pass', () => {
        const palette = new Palette('test', [
            createEntry('white', new Color(255, 255, 255, 255)),
            createEntry('black', new Color(0, 0, 0, 255)),
        ]);

        const usage = computeUsage(
            new Uint8ClampedArray([
                255, 255, 255, 255,
                0, 0, 0, 255,
                255, 255, 255, 255,
                1, 2, 3, 255,
            ]),
            [palette]
        );

        expect(usage).toEqual(
            new Map([
                ['white', 2],
                ['black', 1],
            ])
        );
    });

    it('keeps first palette match semantics when colors are duplicated', () => {
        const firstPalette = new Palette('first', [
            createEntry('first-white', new Color(255, 255, 255, 255)),
        ]);
        const secondPalette = new Palette('second', [
            createEntry('second-white', new Color(255, 255, 255, 255)),
        ]);

        const usage = computeUsage(
            new Uint8ClampedArray([255, 255, 255, 255]),
            [firstPalette, secondPalette]
        );

        expect(usage).toEqual(new Map([['first-white', 1]]));
    });

    it('builds reusable color maps with rgb or rgba semantics', () => {
        const opaque = createEntry('opaque', new Color(1, 2, 3, 255));
        const translucent = createEntry('translucent', new Color(1, 2, 3, 128));
        const palette = new Palette('test', [opaque, translucent]);

        const rgbaMap = createPaletteEntryColorMap([palette], 'rgba');
        const rgbMap = createPaletteEntryColorMap([palette], 'rgb');

        expect(
            rgbaMap.get(getPaletteEntryColorKey(1, 2, 3, 128, 'rgba'))?.ref
        ).toBe('translucent');
        expect(
            rgbMap.get(getPaletteEntryColorKey(1, 2, 3, 128, 'rgb'))?.ref
        ).toBe('opaque');
    });

    it('builds reusable enabled entry maps by color ref', () => {
        const disabledFirst = createEntry('shared', new Color(1, 1, 1, 255));
        disabledFirst.enabled = false;
        const enabledShared = createEntry('shared', new Color(2, 2, 2, 255));
        const enabledUnique = createEntry('unique', new Color(3, 3, 3, 255));
        const palette = new Palette('test', [
            disabledFirst,
            enabledShared,
            enabledUnique,
        ]);

        const entriesByRef = createPaletteEntryRefMap([palette]);

        expect(getPaletteEntryFromRefMap(entriesByRef, 'shared')).toBe(
            enabledShared
        );
        expect(getPaletteEntryFromRefMap(entriesByRef, 'unique')).toBe(
            enabledUnique
        );
        expect(() =>
            getPaletteEntryFromRefMap(entriesByRef, 'missing')
        ).toThrow('No enabled palette entry found for color ref "missing".');
    });

    it('finds closest enabled palette entry and reports empty palettes clearly', () => {
        const disabled = createEntry('disabled', new Color(0, 0, 0, 255));
        disabled.enabled = false;
        const enabled = createEntry('enabled', new Color(20, 20, 20, 255));
        const palette = new Palette('test', [disabled, enabled]);

        expect(
            getClosestPaletteEntry(
                [palette],
                new Color(1, 1, 1, 255),
                MATCHINGS.EUCLIDEAN
            ).ref
        ).toBe('enabled');
        expect(() =>
            getClosestPaletteEntry(
                [new Palette('empty', [disabled])],
                new Color(1, 1, 1, 255),
                MATCHINGS.EUCLIDEAN
            )
        ).toThrow('No enabled palette entries are available.');
    });

    it('removes low-usage colors without rebuilding palette lists per entry', () => {
        const lowUsage = createEntry('low', new Color(255, 0, 0, 255));
        const highUsage = createEntry('high', new Color(0, 0, 255, 255));
        const palette = new Palette('test', [lowUsage, highUsage]);

        removeColorUnderPercent(
            10,
            new Map([
                ['low', 1],
                ['high', 99],
            ]),
            [palette]
        );

        expect(lowUsage.enabled).toBe(false);
        expect(highUsage.enabled).toBe(true);
    });
});

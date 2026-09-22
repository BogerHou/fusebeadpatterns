import { describe, expect, it } from 'vitest';

import { Color } from '../model/color/color.model';
import { MATCHINGS, Matching } from '../model/matching/matching.model';
import { Palette, PaletteEntry } from '../model/palette/palette.model';
import { reduceColorPixels, ReduceColorPixelsOptions } from './utils';

// The pre-extraction algorithm, deliberately without the new match cache.
// This reference retains its row order, byte clamping, alpha handling and
// independent error diffusion so optimization changes can be checked exactly.
function reduceColorReference(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: ReduceColorPixelsOptions
): Uint8ClampedArray {
    const entries = options.palettes.flatMap((palette) => palette.entries)
        .filter((entry) => entry.enabled);
    const read = (x: number, y: number) => {
        const index = (y * width + x) * 4;
        return new Color(data[index], data[index + 1], data[index + 2], data[index + 3]);
    };
    const write = (x: number, y: number, color: Color) => {
        const index = (y * width + x) * 4;
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = color.a;
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = read(x, y);
            if (color.a === 0) continue;

            let closest = entries[0];
            if (!closest) throw new Error('No enabled palette entries are available.');
            let closestDelta = options.matching.delta(closest.color, color);
            for (const entry of entries.slice(1)) {
                const delta = options.matching.delta(entry.color, color);
                if (delta < closestDelta) {
                    closest = entry;
                    closestDelta = delta;
                }
            }
            write(x, y, closest.color);

            if (!options.dithering.enable) continue;
            const error = color.sub(closest.color);
            for (const [dx, dy, weight] of [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]]) {
                const nx = x + dx;
                const ny = y + dy;
                const bounds = options.drawingPosition;
                if (nx < bounds.x || nx >= bounds.x + bounds.width ||
                    ny < bounds.y || ny >= bounds.y + bounds.height) continue;
                const factor = ((options.dithering.hardness / 100) * weight) / 16;
                write(nx, ny, read(nx, ny).add(new Color(
                    error.r * factor,
                    error.g * factor,
                    error.b * factor,
                    error.a
                )));
            }
        }
    }
    return data;
}

function fixturePalettes(): Palette[] {
    const colors = [
        [0, 0, 0, 255], [255, 255, 255, 255], [208, 45, 64, 255],
        [28, 194, 99, 255], [45, 56, 215, 255], [28, 194, 99, 90],
    ];
    const entries = colors.map((rgba, i) => new PaletteEntry(String(i), new Color(
        rgba[0], rgba[1], rgba[2], rgba[3]
    )));
    const disabled = new PaletteEntry('disabled exact match', new Color(127, 80, 0, 255));
    disabled.enabled = false;
    return [
        new Palette('first', [disabled, ...entries.slice(0, 3)]),
        new Palette('second', entries.slice(3)),
    ];
}

function fixturePixels(width: number, height: number): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(width * height * 4);
    const repeated = [127, 80, 0, 255, 48, 98, 152, 128];
    for (let i = 0; i < width * height; i++) {
        const source = i % 2 * 4;
        pixels.set(i % 3 === 0 ? repeated.slice(source, source + 4) : [
            i * 31 % 256, i * 73 % 256, i * 127 % 256,
            i % 7 === 0 ? 0 : i % 5 === 0 ? 90 : 255,
        ], i * 4);
    }
    return pixels;
}

function optionsFor(matching: Matching = MATCHINGS.EUCLIDEAN): ReduceColorPixelsOptions {
    return {
        palettes: fixturePalettes(),
        matching,
        dithering: { enable: true, hardness: 100 },
        drawingPosition: { x: 0, y: 0, width: 12, height: 9 },
    };
}

describe('DOM-free color reduction', () => {
    describe.each(Object.values(MATCHINGS))('$name', (matching) => {
        it.each([
            { enable: false, hardness: 100 },
            { enable: true, hardness: 0 },
            { enable: true, hardness: 25 },
            { enable: true, hardness: 50 },
            { enable: true, hardness: 73.5 },
            { enable: true, hardness: 100 },
        ])('matches the old pixels exactly for $enable / $hardness', (dithering) => {
            const source = fixturePixels(12, 9);
            for (const drawingPosition of [
                { x: 0, y: 0, width: 12, height: 9 },
                { x: 2, y: 1, width: 5, height: 7 },
                { x: 0, y: 0, width: 1, height: 9 },
                { x: 0, y: 0, width: 12, height: 1 },
                { x: 3, y: 4, width: 0, height: 0 },
            ]) {
                const options = { ...optionsFor(matching), dithering, drawingPosition };
                const actual = source.slice();
                const result = reduceColorPixels(actual, 12, 9, options);

                expect(result).toBe(actual);
                expect(actual).toEqual(reduceColorReference(source.slice(), 12, 9, options));
            }
        });
    });

    it('includes alpha in the cache key and retains first-entry ties', () => {
        const options = optionsFor();
        options.dithering.enable = false;
        options.palettes = [new Palette('ties and alpha', [
            new PaletteEntry('low', new Color(0, 0, 0, 255)),
            new PaletteEntry('high', new Color(128, 128, 128, 255)),
            new PaletteEntry('translucent', new Color(64, 64, 64, 80)),
        ])];
        const pixels = new Uint8ClampedArray([
            64, 64, 64, 255, 64, 64, 64, 80, 64, 64, 64, 255,
        ]);

        expect(reduceColorPixels(pixels, 3, 1, options)).toEqual(new Uint8ClampedArray([
            0, 0, 0, 255, 64, 64, 64, 80, 0, 0, 0, 255,
        ]));
    });

    it('keeps cache entries local to one conversion and current palette configuration', () => {
        const options = optionsFor();
        options.dithering.enable = false;
        const first = reduceColorPixels(new Uint8ClampedArray([0, 0, 0, 255]), 1, 1, options);
        options.palettes[0].entries[1].enabled = false;
        const second = reduceColorPixels(new Uint8ClampedArray([0, 0, 0, 255]), 1, 1, options);

        expect(first).not.toEqual(second);
        expect(second).toEqual(reduceColorReference(new Uint8ClampedArray([0, 0, 0, 255]), 1, 1, options));
    });

    it('retains transparent pixels and empty palette behavior', () => {
        const options: ReduceColorPixelsOptions = { ...optionsFor(), palettes: [] };
        const pixels = new Uint8ClampedArray([78, 40, 12, 0]);

        expect(reduceColorPixels(pixels, 1, 1, options)).toEqual(new Uint8ClampedArray([78, 40, 12, 0]));
        expect(() => reduceColorPixels(new Uint8ClampedArray([78, 40, 12, 255]), 1, 1, options))
            .toThrow('No enabled palette entries are available.');
    });

    it('caps cached colors while retaining byte-for-byte output for many unique colors', () => {
        const pixels = new Uint8ClampedArray(4099 * 4);
        for (let i = 0; i < 4097; i++) pixels.set([0, i >> 8, i & 255, 255], i * 4);
        pixels.set([0, 0, 0, 255, 0, 16, 0, 255], 4097 * 4);
        let distanceCalls = 0;
        const options = optionsFor({
            name: 'counted Euclidean',
            delta: (a, b) => {
                distanceCalls++;
                return MATCHINGS.EUCLIDEAN.delta(a, b);
            },
        });
        options.dithering.enable = false;
        options.palettes = [new Palette('one', [new PaletteEntry('black', new Color(0, 0, 0, 255))])];

        const actual = reduceColorPixels(pixels.slice(), 4099, 1, options);

        // First 4096 entries stay reusable; colors beyond the cap are not stored.
        expect(distanceCalls).toBe(4098);
        expect(actual).toEqual(reduceColorReference(pixels, 4099, 1, {
            ...options, matching: MATCHINGS.EUCLIDEAN,
        }));
    });

    it('avoids repeated distance calculations on a reproducible flat-color fixture', () => {
        const width = 64;
        const height = 64;
        const colors = [[48, 98, 152, 255], [127, 80, 0, 255], [78, 42, 19, 255], [198, 224, 239, 255]];
        const source = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < width * height; i++) source.set(colors[i % colors.length], i * 4);
        let distanceCalls = 0;
        const options = optionsFor({
            name: 'counted CIE2000',
            delta: (a, b) => {
                distanceCalls++;
                return MATCHINGS.DELTA_E_CIE2000.delta(a, b);
            },
        });
        options.dithering.enable = false;
        const expected = reduceColorReference(source.slice(), width, height, options);
        const referenceCalls = distanceCalls;
        distanceCalls = 0;
        const actual = reduceColorPixels(source, width, height, options);

        expect(actual).toEqual(expected);
        expect(referenceCalls).toBe(24576);
        expect(distanceCalls).toBe(24);
    });
});

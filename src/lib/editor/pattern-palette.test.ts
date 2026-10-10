import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { computeUsage, countBeads } from '../core/utils/utils';
import { patterns } from '../patterns/catalog';
import { getPaletteOption, parsePaletteCsv } from './config';
import { decodeEditorPatternDraft, parseEditorProject } from './draft';
import { remapPatternPalette } from './pattern-palette';

function entry(name: string, rgb: [number, number, number], alpha = 255): PaletteEntry {
    const color = new PaletteEntry(name, new Color(...rgb, alpha));
    color.ref = name;
    return color;
}

function palette(...entries: PaletteEntry[]): Palette[] {
    return [new Palette('Test brand', entries)];
}

const blackAndWhite = () => palette(
    entry('black', [0, 0, 0]),
    entry('white', [255, 255, 255])
);

async function loadPalette(id: string): Promise<Palette> {
    const option = getPaletteOption(id);
    if (!option) throw new Error(`Missing palette option: ${id}`);
    const csv = await readFile(path.join(process.cwd(), 'public', 'palettes', option.file), 'utf8');
    return parsePaletteCsv(csv, option);
}

describe('remapPatternPalette', () => {
    it('keeps the grid shape, transparent bytes and every original alpha', async () => {
        const pixels = new Uint8ClampedArray([
            17, 9, 21, 255, 77, 12, 98, 0, 240, 245, 250, 128,
            0, 0, 0, 0, 20, 20, 20, 1, 235, 240, 245, 254,
        ]);
        const before = pixels.slice();

        const pending = remapPatternPalette(pixels, 3, 2, blackAndWhite(), 'euclidean');
        expect(pixels).toEqual(before);
        const result = await pending;

        expect(result).toEqual(new Uint8ClampedArray([
            0, 0, 0, 255, 77, 12, 98, 0, 255, 255, 255, 128,
            0, 0, 0, 0, 0, 0, 0, 1, 255, 255, 255, 254,
        ]));
        expect(result).not.toBe(pixels);
        expect(pixels).toEqual(before);
    });

    it('does not dither a uniform edited color into multiple target colors', async () => {
        const pixels = new Uint8ClampedArray(Array(8).fill([130, 130, 130, 255]).flat());

        const result = await remapPatternPalette(pixels, 4, 2, blackAndWhite(), 'euclidean');

        expect(result).toEqual(new Uint8ClampedArray(Array(8).fill([255, 255, 255, 255]).flat()));
    });

    it.each(['euclidean', 'delta_e_cie94', 'delta_e_cie2000'])(
        'keeps named black and white across brands even if a different finish has identical RGB (%s)',
        async (matchingId) => {
            const sourcePalettes = palette(
                entry(' Black ', [50, 50, 52]), entry('WHITE', [230, 231, 232])
            );
            const pixels = new Uint8ClampedArray([
                50, 50, 52, 255, 230, 231, 232, 128, 50, 50, 52, 0,
            ]);
            const before = pixels.slice();
            const result = await remapPatternPalette(pixels, 3, 1, palette(
                entry('Silver', [50, 50, 52]), entry('Pearl', [230, 231, 232]),
                entry('Black', [20, 19, 21]), entry('White', [229, 236, 241])
            ), matchingId, { sourcePalettes });

            expect(result).toEqual(new Uint8ClampedArray([
                20, 19, 21, 255, 229, 236, 241, 128, 50, 50, 52, 0,
            ]));
            expect(pixels).toEqual(before);
        }
    );

    it.each(['missing', 'unknown RGB', 'conflicting source names'])(
        'uses distance matching when source metadata is %s', async (kind) => {
            const sourcePalettes = kind === 'missing' ? undefined : palette(
                entry('Black', kind === 'unknown RGB' ? [49, 50, 52] : [50, 50, 52]),
                ...(kind === 'conflicting source names' ? [entry('Silver', [50, 50, 52])] : [])
            );
            const result = await remapPatternPalette(
                new Uint8ClampedArray([50, 50, 52, 255]), 1, 1,
                palette(entry('Silver', [50, 50, 52]), entry('Black', [20, 19, 21])),
                'delta_e_cie2000', { sourcePalettes }
            );

            expect(result).toEqual(new Uint8ClampedArray([50, 50, 52, 255]));
        }
    );

    it.each(['Black Rock', 'Metallic Black', 'Glow White', 'Pearlescent White', 'Silver'])(
        'does not treat %s as ordinary black or white', async (name) => {
            const result = await remapPatternPalette(
                new Uint8ClampedArray([50, 50, 52, 255]), 1, 1,
                palette(entry('Silver', [50, 50, 52]), ...blackAndWhite()[0].entries),
                'euclidean', { sourcePalettes: palette(entry(name, [50, 50, 52])) }
            );

            expect(result).toEqual(new Uint8ClampedArray([50, 50, 52, 255]));
        }
    );

    it('respects disabled and non-opaque target neutrals while retaining disabled source identity', async () => {
        const sourceBlack = entry('Black', [50, 50, 52]);
        sourceBlack.enabled = false;
        const disabledBlack = entry('Black', [20, 19, 21]);
        disabledBlack.enabled = false;
        const result = await remapPatternPalette(
            new Uint8ClampedArray([50, 50, 52, 255]), 1, 1,
            palette(disabledBlack, entry('Black', [0, 0, 0], 128), entry('Charcoal', [70, 69, 65])),
            'euclidean', { sourcePalettes: palette(sourceBlack) }
        );
        expect(result).toEqual(new Uint8ClampedArray([70, 69, 65, 255]));

        const enabledTarget = await remapPatternPalette(
            new Uint8ClampedArray([50, 50, 52, 255]), 1, 1,
            palette(entry('Silver', [50, 50, 52]), entry('Black', [20, 19, 21])),
            'euclidean', { sourcePalettes: palette(sourceBlack) }
        );
        expect(enabledTarget).toEqual(new Uint8ClampedArray([20, 19, 21, 255]));
        expect(sourceBlack.enabled).toBe(false);
        expect(disabledBlack.enabled).toBe(false);
    });

    it('ignores a disabled exact match without changing its palette', async () => {
        const disabled = entry('disabled red', [220, 20, 40]);
        disabled.enabled = false;
        const target = palette(disabled, entry('enabled red', [200, 30, 50]));
        const before = structuredClone(target);

        const result = await remapPatternPalette(
            new Uint8ClampedArray([220, 20, 40, 255]), 1, 1, target, 'euclidean'
        );

        expect(result).toEqual(new Uint8ClampedArray([200, 30, 50, 255]));
        expect(structuredClone(target)).toEqual(before);
    });

    it.each(['euclidean', 'delta_e_cie94', 'delta_e_cie2000'])(
        'excludes transparent and partially transparent candidates with %s',
        async (matchingId) => {
            const result = await remapPatternPalette(
                new Uint8ClampedArray([220, 20, 40, 1]), 1, 1,
                palette(
                    entry('transparent exact match', [220, 20, 40], 0),
                    entry('partial exact match', [220, 20, 40], 128),
                    entry('opaque red', [200, 30, 50])
                ), matchingId
            );

            expect(result).toEqual(new Uint8ClampedArray([200, 30, 50, 1]));
        }
    );

    it('maps all occupied cells to the only enabled color, preserving holes', async () => {
        const result = await remapPatternPalette(
            new Uint8ClampedArray([
                255, 0, 0, 255, 1, 2, 3, 0, 0, 255, 0, 255,
            ]), 3, 1, palette(entry('blue', [20, 40, 210])), 'euclidean'
        );

        expect(result).toEqual(new Uint8ClampedArray([
            20, 40, 210, 255, 1, 2, 3, 0, 20, 40, 210, 255,
        ]));
    });

    it('preserves a fully transparent pattern byte for byte', async () => {
        const pixels = new Uint8ClampedArray([80, 90, 100, 0, 1, 2, 3, 0]);

        const result = await remapPatternPalette(pixels, 2, 1, blackAndWhite(), 'euclidean');

        expect(result).toEqual(pixels);
        expect(result).not.toBe(pixels);
    });

    it.each([
        { width: 0, height: 1, length: 0 },
        { width: -1, height: 1, length: 4 },
        { width: 1.5, height: 1, length: 6 },
        { width: 1, height: Number.NaN, length: 4 },
        { width: Number.MAX_SAFE_INTEGER, height: 2, length: 4 },
        { width: 2, height: 2, length: 4 },
    ])('rejects invalid dimensions $width x $height / $length bytes', async ({ width, height, length }) => {
        await expect(remapPatternPalette(
            new Uint8ClampedArray(length), width, height, blackAndWhite(), 'euclidean'
        )).rejects.toThrow('Pattern dimensions must match the RGBA pixel data.');
    });

    it.each(['empty', 'disabled', 'non-opaque'])(
        'rejects %s candidates even for an all-transparent pattern',
        async (kind) => {
            const disabled = entry('disabled', [0, 0, 0]);
            disabled.enabled = false;
            const target = kind === 'empty' ? []
                : kind === 'disabled' ? palette(disabled)
                    : palette(entry('transparent', [0, 0, 0], 0), entry('partial', [0, 0, 0], 128));

            await expect(remapPatternPalette(
                new Uint8ClampedArray(4), 1, 1, target, 'euclidean'
            )).rejects.toThrow('No enabled opaque palette entries are available.');
        }
    );

    it.each(['before start', 'during conversion'])(
        'rejects cancellation %s and leaves the input intact',
        async (when) => {
            const controller = new AbortController();
            const pixels = new Uint8ClampedArray([10, 20, 30, 255]);
            const before = pixels.slice();
            if (when === 'before start') controller.abort();

            const pending = remapPatternPalette(
                pixels, 1, 1, blackAndWhite(), 'euclidean', {
                    signal: controller.signal,
                    sourcePalettes: palette(entry('Black', [10, 20, 30])),
                }
            );
            if (when === 'during conversion') controller.abort();

            await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
            expect(pixels).toEqual(before);
        }
    );

    it('is stable when applying the same palette again', async () => {
        const pixels = new Uint8ClampedArray([
            20, 30, 40, 255, 244, 240, 250, 128, 11, 22, 33, 0,
        ]);
        const target = blackAndWhite();
        const first = await remapPatternPalette(pixels, 3, 1, target, 'delta_e_cie2000');
        const second = await remapPatternPalette(first, 3, 1, target, 'delta_e_cie2000');

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('snapshots pixels and source/target entries before the async conversion yields', async () => {
        const pixels = new Uint8ClampedArray([40, 50, 60, 128, 12, 34, 56, 0]);
        const target = palette(entry('Black', [20, 19, 21]), entry('Silver', [40, 50, 60]));
        const sourcePalettes = palette(entry('Black', [40, 50, 60]));
        const pending = remapPatternPalette(pixels, 2, 1, target, 'euclidean', { sourcePalettes });

        pixels.fill(255);
        target[0].entries[0].enabled = false;
        target[0].entries[0].color.r = 255;
        sourcePalettes[0].entries[0].name = 'Silver';
        sourcePalettes[0].entries[0].color.r = 255;

        expect(await pending).toEqual(new Uint8ClampedArray([
            20, 19, 21, 128, 12, 34, 56, 0,
        ]));
    });

    it.each(['hama', 'artkal_s'])(
        'preserves every existing %s color, including effect colors, when reapplying its palette',
        async (id) => {
            const target = await loadPalette(id);
            const pixels = new Uint8ClampedArray(target.entries.flatMap(({ color }) =>
                [color.r, color.g, color.b, color.a]
            ));
            for (const matchingId of ['euclidean', 'delta_e_cie94', 'delta_e_cie2000']) {
                const result = await remapPatternPalette(
                    pixels, target.entries.length, 1, [target], matchingId, { sourcePalettes: [target] }
                );
                expect(result, `${id} / ${matchingId}`).toEqual(pixels);
            }
        }
    );

    it.each(['euclidean', 'delta_e_cie94', 'delta_e_cie2000'])(
        'converts the soccer project to 283 Hama Black and 218 Hama White beads (%s)',
        async (matchingId) => {
            const project = await readFile(path.join(
                process.cwd(), 'public/patterns/original-soccer-ball/pattern.bead-pattern.json'
            ), 'utf8');
            const draft = parseEditorProject(project);
            if (!draft?.editedPattern) throw new Error('Missing soccer project grid');
            const pixels = decodeEditorPatternDraft(draft.editedPattern);
            if (!pixels) throw new Error('Invalid soccer project grid');
            const target = await loadPalette('hama');
            const { width, height } = draft.editedPattern;
            const result = await remapPatternPalette(
                pixels, width, height, [target], matchingId, { sourcePalettes: draft.activePalettes }
            );

            expect(computeUsage(result, [target])).toEqual(new Map([['H18', 283], ['H01', 218]]));
            const black = target.entries.find((color) => color.ref === 'H18')!.color;
            const white = target.entries.find((color) => color.ref === 'H01')!.color;
            for (let offset = 0; offset < pixels.length; offset += 4) {
                if (pixels[offset + 3] === 0) {
                    expect(result.subarray(offset, offset + 4)).toEqual(pixels.subarray(offset, offset + 4));
                } else {
                    const color = pixels[offset] === 50 ? black : white;
                    expect(result.subarray(offset, offset + 4)).toEqual(
                        new Uint8ClampedArray([color.r, color.g, color.b, 255])
                    );
                }
            }
        }
    );

    it('remaps every library project to Hama and Artkal without losing beads', async () => {
        expect(patterns).toHaveLength(111);
        expect(patterns.filter(pattern => !['minecraft-creeper-face-v1', 'original-retro-diamond-coaster'].includes(pattern.id))).toHaveLength(109);
        const targets = await Promise.all(['hama', 'artkal_a'].map(async (id) => {
            const target = await loadPalette(id);
            const allowedColors = new Set(target.entries
                .filter((color) => color.enabled && color.color.a === 255)
                .map(({ color }) => `${color.r},${color.g},${color.b}`));
            expect(allowedColors.size).toBeGreaterThan(0);
            return { id, target, allowedColors };
        }));

        let conversions = 0;
        for (const pattern of patterns) {
            const rawProject = await readFile(
                path.join(process.cwd(), 'public', pattern.assets.project), 'utf8'
            );
            const draft = parseEditorProject(rawProject);
            if (!draft?.editedPattern) throw new Error(`Missing project grid: ${pattern.id}`);
            const pixels = decodeEditorPatternDraft(draft.editedPattern);
            if (!pixels) throw new Error(`Invalid project grid: ${pattern.id}`);
            const { width, height } = draft.editedPattern;
            const before = pixels.slice();
            const originalAlpha = before.filter((_, index) => index % 4 === 3);
            const originalBeads = countBeads(computeUsage(before, draft.activePalettes));
            expect([width, height], pattern.id).toEqual([pattern.gridWidth, pattern.gridHeight]);
            expect(originalBeads, pattern.id).toBe(pattern.beads);

            for (const { id, target, allowedColors } of targets) {
                // Each brand starts from the published grid, never the preceding result.
                const result = await remapPatternPalette(
                    pixels, width, height, [target], draft.matchingId,
                    { sourcePalettes: draft.activePalettes }
                );
                const label = `${pattern.id} -> ${id}`;
                expect(pixels, label).toEqual(before);
                expect(result, label).not.toBe(pixels);
                expect(result.length, label).toBe(before.length);
                expect(result.filter((_, index) => index % 4 === 3), label).toEqual(originalAlpha);

                const unexpectedColors = new Set<string>();
                for (let offset = 0; offset < result.length; offset += 4) {
                    if (before[offset + 3] === 0) {
                        expect(result.subarray(offset, offset + 4), label)
                            .toEqual(before.subarray(offset, offset + 4));
                    } else {
                        expect(result[offset + 3], label).toBe(255);
                        const rgb = `${result[offset]},${result[offset + 1]},${result[offset + 2]}`;
                        if (!allowedColors.has(rgb)) unexpectedColors.add(rgb);
                    }
                }
                expect([...unexpectedColors], label).toEqual([]);
                expect(countBeads(computeUsage(result, [target])), label).toBe(originalBeads);
                conversions++;
            }
        }
        expect(conversions).toBe(patterns.length * targets.length);
    }, 15_000);
});

import type { Color } from '../core/model/color/color.model';
import { MATCHINGS } from '../core/model/matching/matching.model';
import type { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { getClosestPaletteEntry, getPaletteEntryColorKey } from '../core/utils/utils';
import { getMatchingOption } from './config';
import { clonePalettes } from './palette-state';
import { quantizePattern } from './pattern-quantization';

type PatternPaletteOptions = {
    signal?: AbortSignal;
    sourcePalettes?: Palette[];
};

function neutralName(entry: PaletteEntry): 'black' | 'white' | null {
    const name = entry.name.trim().toLowerCase();
    return name === 'black' || name === 'white' ? name : null;
}

function createNeutralRemaps(
    sourcePalettes: Palette[],
    targetPalettes: Palette[],
    matchingId: string
): Map<number, Color> {
    const sourceEntries = new Map<number, PaletteEntry | null>();
    for (const palette of sourcePalettes) {
        for (const entry of palette.entries) {
            const { r, g, b } = entry.color;
            const key = getPaletteEntryColorKey(r, g, b);
            const previous = sourceEntries.get(key);
            // RGB alone cannot identify a bead when source entries disagree.
            // Disabled source colors still describe beads already on the grid.
            sourceEntries.set(key, sourceEntries.has(key) &&
                (!previous || neutralName(previous) !== neutralName(entry))
                ? null : entry);
        }
    }

    const matching = getMatchingOption(matchingId)?.value ?? MATCHINGS.EUCLIDEAN;
    const remaps = new Map<number, Color>();
    for (const [key, entry] of sourceEntries) {
        const name = entry && neutralName(entry);
        if (!name) continue;

        const candidates = targetPalettes.map((palette) => ({
            ...palette,
            entries: palette.entries.filter((candidate) => neutralName(candidate) === name),
        }));
        if (candidates.some((palette) => palette.entries.length > 0)) {
            remaps.set(key, getClosestPaletteEntry(candidates, entry.color, matching).color);
        }
    }
    return remaps;
}

/** Change bead colors without resampling the grid or changing its alpha mask. */
export async function remapPatternPalette(
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    palettes: Palette[],
    matchingId: string,
    { signal, sourcePalettes = [] }: PatternPaletteOptions = {}
): Promise<Uint8ClampedArray> {
    if (signal?.aborted) {
        throw new DOMException('Pattern conversion cancelled.', 'AbortError');
    }

    const pixelCount = width * height;
    if (!Number.isSafeInteger(width) || width <= 0 ||
        !Number.isSafeInteger(height) || height <= 0 ||
        !Number.isSafeInteger(pixelCount * 4) ||
        pixels.length !== pixelCount * 4) {
        throw new RangeError('Pattern dimensions must match the RGBA pixel data.');
    }

    // Snapshot entries before the async conversion so later palette edits cannot
    // alter its candidates, and never turn an occupied cell into a transparent bead.
    const opaquePalettes = clonePalettes(palettes).map((palette) => {
        palette.entries = palette.entries.filter((entry) =>
            entry.enabled && entry.color.a === 255
        );
        return palette;
    });
    if (!opaquePalettes.some((palette) => palette.entries.length > 0)) {
        throw new Error('No enabled opaque palette entries are available.');
    }

    // Named black/white beads carry intent that sampled RGB values can miss
    // across brands (e.g. Perler Black is closer to Hama Silver than Hama Black).
    // Only exact, unambiguous source colors get this preference; shades and
    // finishes such as Charcoal, Pearl or Glow White keep normal color matching.
    const neutralRemaps = createNeutralRemaps(
        clonePalettes(sourcePalettes), opaquePalettes, matchingId
    );
    const source = new Uint8ClampedArray(pixels);
    const alpha = new Uint8Array(pixelCount);
    for (let index = 0; index < pixelCount; index++) {
        const offset = index * 4;
        alpha[index] = source[offset + 3];
        if (alpha[index] === 0) continue;

        const neutral = neutralRemaps.get(getPaletteEntryColorKey(
            source[offset], source[offset + 1], source[offset + 2]
        ));
        if (neutral) {
            source[offset] = neutral.r;
            source[offset + 1] = neutral.g;
            source[offset + 2] = neutral.b;
        }
    }

    const result = await quantizePattern({
        pixels: source,
        width,
        height,
        palettes: opaquePalettes,
        matchingId,
        dithering: { enable: false, hardness: 0 },
        drawingPosition: { x: 0, y: 0, width, height },
    }, { signal });

    if (signal?.aborted) {
        throw new DOMException('Pattern conversion cancelled.', 'AbortError');
    }

    // Quantization skips fully transparent cells and leaves all their bytes intact.
    // Restore partial alpha too, since its usual image path uses the target alpha.
    for (let index = 0; index < pixelCount; index++) {
        result[index * 4 + 3] = alpha[index];
    }
    return result;
}

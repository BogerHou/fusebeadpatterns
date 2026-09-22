import type { Palette } from '../core/model/palette/palette.model';
import { clonePalettes } from './palette-state';
import { quantizePattern } from './pattern-quantization';

type PatternPaletteOptions = {
    signal?: AbortSignal;
};

/** Change bead colors without resampling the grid or changing its alpha mask. */
export async function remapPatternPalette(
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    palettes: Palette[],
    matchingId: string,
    { signal }: PatternPaletteOptions = {}
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

    const source = new Uint8ClampedArray(pixels);
    const alpha = new Uint8Array(pixelCount);
    for (let index = 0; index < pixelCount; index++) {
        alpha[index] = source[index * 4 + 3];
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

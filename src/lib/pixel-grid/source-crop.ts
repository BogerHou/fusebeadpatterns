import { isValidSourceCrop, normalizeSourceCrop, type EditorSourceCrop } from '../core/utils/image-crop';
import { LIMITS, type RgbaSource } from './core';
import { PixelGridError } from './errors';

export type PixelSourceCrop = EditorSourceCrop;

/** Crop coordinates always refer to the complete decoded original, never a preview. */
export function validatePixelSourceCrop(value: unknown, source: Pick<RgbaSource, 'width' | 'height'> | null): PixelSourceCrop | null {
    if (value === null || value === undefined) return null;
    if (!source || !isValidSourceCrop(value) || value.sourceWidth !== source.width || value.sourceHeight !== source.height
        || source.width > LIMITS.maxImageSide || source.height > LIMITS.maxImageSide) throw new PixelGridError('WORKSPACE_INVALID');
    return normalizeSourceCrop(value);
}

/** Copy exact RGBA rows, including hidden RGB. Canvas is display-only. */
export function cropPixelSource(source: RgbaSource, value: PixelSourceCrop | null | undefined): RgbaSource {
    const crop = validatePixelSourceCrop(value, source);
    if (!crop) return source;
    if (source.pixels.length !== source.width * source.height * 4) throw new PixelGridError('PIXEL_DATA_LENGTH');
    const pixels = new Uint8ClampedArray(crop.width * crop.height * 4);
    for (let row = 0; row < crop.height; row++) {
        const start = ((crop.y + row) * source.width + crop.x) * 4;
        pixels.set(source.pixels.slice(start, start + crop.width * 4), row * crop.width * 4);
    }
    return { width: crop.width, height: crop.height, pixels };
}

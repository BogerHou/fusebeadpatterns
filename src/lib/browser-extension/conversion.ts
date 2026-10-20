import type { Palette } from '../core/model/palette/palette.model';
import { computeUsage } from '../core/utils/utils';
import { getPaletteOption } from '../editor/config';
import { decodeEditorPatternDraft, encodeEditorProjectPattern, type EditorDraft } from '../editor/draft';
import { limitPatternBeadColors, type QuantizationOptions } from '../editor/pattern-quantization';
import { convertPixelGridToBeads, type PixelBeadLayout } from '../pixel-grid/bead-conversion';
import { createGrid, LIMITS, type PixelGrid, type RgbaSource } from '../pixel-grid/core';

export const CAPTURE_BRANDS = ['perler', 'hama', 'artkal_s'] as const;
export type CaptureBrand = typeof CAPTURE_BRANDS[number];
export type CaptureCrop = { x: number; y: number; width: number; height: number };
export type CaptureMaterial = { ref: string; name: string; color: string; count: number };
export type CaptureResult = { draft: EditorDraft; layout: PixelBeadLayout; pixels: Uint8ClampedArray; materials: CaptureMaterial[]; beadCount: number };

/** Percentages describe a source rectangle, never a stretched target rectangle. */
export function validateCaptureCrop(crop: CaptureCrop): CaptureCrop {
    if (!crop || ![crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) ||
        crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0 ||
        crop.x + crop.width > 100 || crop.y + crop.height > 100) {
        throw new RangeError('Keep the crop inside the image. Width and height must be greater than zero.');
    }
    return { ...crop };
}

export function captureOutputDimensions(sourceWidth: number, sourceHeight: number, crop: CaptureCrop, longEdge: number): { width: number; height: number } {
    validateCaptureCrop(crop);
    if (![sourceWidth, sourceHeight].every((side) => Number.isInteger(side) && side > 0 && side <= LIMITS.maxImageSide) ||
        !Number.isInteger(longEdge) || longEdge < 16 || longEdge > 128) {
        throw new RangeError('Choose a pattern size from 16 to 128 beads. Source images must be at most 2048 pixels per side.');
    }
    const width = sourceWidth * crop.width / 100;
    const height = sourceHeight * crop.height / 100;
    const scale = longEdge / Math.max(width, height);
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Nearest-neighbour sampling shares the website's one-pixel/one-bead conversion. */
export function sampleCaptureCrop(source: RgbaSource, crop: CaptureCrop, longEdge: number): PixelGrid {
    const size = captureOutputDimensions(source.width, source.height, crop, longEdge);
    if ((!Array.isArray(source.pixels) && !(source.pixels instanceof Uint8Array) && !(source.pixels instanceof Uint8ClampedArray)) ||
        source.pixels.length !== source.width * source.height * 4 ||
        (Array.isArray(source.pixels) && source.pixels.some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255))) {
        throw new TypeError('The source image has invalid pixel data.');
    }
    const output = createGrid(size.width, size.height);
    const left = source.width * crop.x / 100, top = source.height * crop.y / 100;
    const width = source.width * crop.width / 100, height = source.height * crop.height / 100;
    for (let y = 0; y < output.height; y++) for (let x = 0; x < output.width; x++) {
        const sx = Math.min(source.width - 1, Math.floor(left + (x + 0.5) * width / output.width));
        const sy = Math.min(source.height - 1, Math.floor(top + (y + 0.5) * height / output.height));
        const offset = (sy * source.width + sx) * 4;
        output.pixels.set(Array.from(source.pixels.slice(offset, offset + 4)), (y * output.width + x) * 4);
    }
    return output;
}

export async function convertCaptureImage(input: { source: RgbaSource; crop: CaptureCrop; longEdge: number; brand: CaptureBrand; palette: Palette; colorLimit: number | null }, options: QuantizationOptions = {}): Promise<CaptureResult> {
    if (!CAPTURE_BRANDS.includes(input.brand) || !getPaletteOption(input.brand)) throw new RangeError('Choose Perler, Hama or Artkal S.');
    if (input.colorLimit !== null && ![8, 16, 24, 32].includes(input.colorLimit)) throw new RangeError('Choose a supported color limit.');
    const grid = sampleCaptureCrop(input.source, input.crop, input.longEdge);
    const result = await convertPixelGridToBeads({ grid, paletteId: input.brand, palette: input.palette }, options);
    let pixels = decodeEditorPatternDraft(result.draft.editedPattern)!;
    if (input.colorLimit !== null) {
        pixels = await limitPatternBeadColors({ pixels, width: result.layout.patternWidth, height: result.layout.patternHeight, palettes: result.draft.activePalettes, matchingId: 'euclidean', maxBeadColors: input.colorLimit }, options);
    }
    if (options.signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
    const draft: EditorDraft = { ...result.draft, fileName: `image-${grid.width}x${grid.height}-${input.brand}`, editedPattern: encodeEditorProjectPattern(pixels, result.layout.patternWidth, result.layout.patternHeight) };
    const usage = computeUsage(pixels, draft.activePalettes);
    const materials = draft.activePalettes.flatMap((palette) => palette.entries.flatMap((entry) => {
        const count = usage.get(entry.ref);
        return count ? [{ ref: entry.ref, name: entry.name, color: `rgb(${entry.color.r}, ${entry.color.g}, ${entry.color.b})`, count }] : [];
    })).sort((left, right) => right.count - left.count || left.ref.localeCompare(right.ref));
    return { draft, layout: result.layout, pixels, materials, beadCount: Array.from(usage.values()).reduce((total, count) => total + count, 0) };
}

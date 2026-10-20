import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { applyFreshPaletteDefaults } from '../editor/palette-defaults';
import { captureOutputDimensions, convertCaptureImage, sampleCaptureCrop, type CaptureBrand } from './conversion';

const whole = { x: 0, y: 0, width: 100, height: 100 };
function palette(brand: CaptureBrand) {
    const option = getPaletteOption(brand)!;
    return applyFreshPaletteDefaults(brand, parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option));
}

describe('extension image conversion', () => {
    it('keeps the crop aspect ratio and rejects crops beyond image boundaries', () => {
        expect(captureOutputDimensions(800, 400, whole, 64)).toEqual({ width: 64, height: 32 });
        expect(captureOutputDimensions(800, 400, { x: 25, y: 0, width: 25, height: 100 }, 64)).toEqual({ width: 32, height: 64 });
        expect(() => captureOutputDimensions(800, 400, { ...whole, x: 1 }, 64)).toThrow();
        expect(() => captureOutputDimensions(800, 400, whole, 129)).toThrow();
        expect(() => captureOutputDimensions(2049, 400, whole, 64)).toThrow();
    });

    it('samples only the selected rectangle, with transparent cells intact', () => {
        const source = { width: 4, height: 2, pixels: new Uint8Array([
            255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 80, 20, 30, 0,
            0, 0, 0, 255, 10, 20, 30, 255, 40, 50, 60, 255, 255, 255, 255, 255,
        ]) };
        const sampled = sampleCaptureCrop(source, { x: 50, y: 0, width: 50, height: 50 }, 16);
        expect(sampled).toMatchObject({ width: 16, height: 8 });
        expect(Array.from(sampled.pixels.slice(0, 4))).toEqual([0, 0, 255, 255]);
        expect(Array.from(sampled.pixels.slice(15 * 4, 16 * 4))).toEqual([80, 20, 30, 0]);
        expect(source.pixels[0]).toBe(255);
    });

    it.each(['perler', 'hama', 'artkal_s'] as const)('exports a real %s project with padded boards and exact materials', async (brand) => {
        const selected = palette(brand);
        const source = { width: 3, height: 1, pixels: new Uint8ClampedArray([20, 180, 230, 255, 220, 40, 70, 128, 3, 12, 100, 0]) };
        const result = await convertCaptureImage({ source, crop: whole, longEdge: 32, brand, palette: selected, colorLimit: 8 });
        const board = brand === 'artkal_s' ? 50 : 29;
        expect(result.layout).toMatchObject({ sourceWidth: 32, sourceHeight: 11, patternWidth: Math.ceil(32 / board) * board, patternHeight: board });
        expect(result.beadCount).toBe(21 * 11);
        expect(result.materials.reduce((sum, material) => sum + material.count, 0)).toBe(result.beadCount);
        expect(result.materials.length).toBeLessThanOrEqual(8);
        const allowed = new Set(selected.entries.filter((entry) => entry.enabled).map((entry) => `${entry.color.r},${entry.color.g},${entry.color.b},255`));
        for (let offset = 0; offset < result.pixels.length; offset += 4) {
            if (result.pixels[offset + 3] !== 0) expect(allowed.has(Array.from(result.pixels.slice(offset, offset + 4)).join(','))).toBe(true);
        }
        const recovered = parseEditorProject(serializeEditorProject(result.draft))!;
        expect(recovered.selectedPaletteIds).toEqual([brand]);
        expect(recovered.imageSrc).toBeNull();
        expect(decodeEditorPatternDraft(recovered.editedPattern)).toEqual(result.pixels);
        expect(Array.from(result.pixels.slice(32 * 4, 33 * 4))).toEqual([0, 0, 0, 0]);
    });

    it('does not relabel another brand and cancellation cannot return a partial project', async () => {
        const source = { width: 1, height: 1, pixels: new Uint8Array([0, 0, 0, 255]) };
        await expect(convertCaptureImage({ source, crop: whole, longEdge: 16, brand: 'hama', palette: palette('perler'), colorLimit: null })).rejects.toThrow();
        const controller = new AbortController();
        controller.abort();
        await expect(convertCaptureImage({ source, crop: whole, longEdge: 16, brand: 'hama', palette: palette('hama'), colorLimit: 8 }, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('reduces more than eight real brand colors without changing the source or palette', async () => {
        const selected = palette('perler');
        const colors = selected.entries.filter((entry) => entry.enabled).slice(0, 16);
        const pixels = new Uint8ClampedArray(colors.flatMap(({ color }) => [color.r, color.g, color.b, 255]));
        const before = JSON.stringify(selected);
        const source = { width: 16, height: 1, pixels };
        const full = await convertCaptureImage({ source, crop: whole, longEdge: 32, brand: 'perler', palette: selected, colorLimit: null });
        const reduced = await convertCaptureImage({ source, crop: whole, longEdge: 32, brand: 'perler', palette: selected, colorLimit: 8 });
        expect(full.materials.length).toBeGreaterThan(8);
        expect(reduced.materials.length).toBeLessThanOrEqual(8);
        expect(reduced.beadCount).toBe(full.beadCount);
        expect(JSON.stringify(selected)).toBe(before);
        expect(source.pixels).toEqual(pixels);
    });
});

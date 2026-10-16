import { BannerError, collectMaterials, makeLoomSteps, MAX_BANNER_LAYERS, renderBanner, validateBanner, type BannerDesign, type RgbaImage } from './core';
import { GAME_VERSION } from './data';
import { PATTERN_IDS } from './geometry';
import { renderLetterStrip, type LetterSpec } from './letters';

const MAX_SIDE = 8192;
const MAX_RGBA_BYTES = 8 * 1024 * 1024;
const MAX_PNG_BYTES = 9 * 1024 * 1024;
// A supported character can span two adjacent banners (for example V).
// 32 characters => 64 banners of 20px plus 63 gaps of 2px.
const MAX_SOURCE_WIDTH = 1406;
const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function requireScale(scale: number): void {
    if (!Number.isInteger(scale) || scale < 1 || scale > 8) throw new BannerError('INVALID_EXPORT_SCALE');
}

function pngChunk(type: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
    const chunk = new Uint8Array(data.length + 12), view = new DataView(chunk.buffer);
    view.setUint32(0, data.length);
    chunk.set(new TextEncoder().encode(type), 4);
    chunk.set(data, 8);
    let crc = 0xffffffff;
    for (let index = 4; index < chunk.length - 4; index++) {
        crc ^= chunk[index];
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    view.setUint32(chunk.length - 4, (crc ^ 0xffffffff) >>> 0);
    return chunk;
}

/** Own PNG container, adapted from the existing static-pixel packaging contract.
 * No Canvas, game texture, editor format, or coupling to the sprite encoder.
 * Capture the complete source before the first await, including invisible RGB.
 */
async function encodeImage(input: RgbaImage, scale: number): Promise<Uint8Array<ArrayBuffer>> {
    requireScale(scale);
    if (!Number.isInteger(input.width) || !Number.isInteger(input.height) || input.width < 1 || input.width > MAX_SOURCE_WIDTH || input.height !== 40 ||
        !(input.pixels instanceof Uint8ClampedArray) || input.pixels.length !== input.width * input.height * 4) throw new BannerError('INVALID_EXPORT_IMAGE');
    const width = input.width * scale, height = input.height * scale;
    if (width > MAX_SIDE || height > MAX_SIDE || width * height * 4 > MAX_RGBA_BYTES) throw new BannerError('EXPORT_TOO_LARGE');
    const source = { width: input.width, height: input.height, pixels: new Uint8ClampedArray(input.pixels) };
    if (typeof CompressionStream === 'undefined') throw new BannerError('PNG_EXPORT_UNSUPPORTED');
    await yieldToBrowser();
    const stride = width * 4 + 1, scanlines = new Uint8Array(stride * height);
    for (let y = 0; y < source.height; y++) {
        const row = y * scale * stride;
        for (let x = 0; x < source.width; x++) {
            const offset = (y * source.width + x) * 4;
            for (let repeat = 0; repeat < scale; repeat++) {
                const target = row + 1 + (x * scale + repeat) * 4;
                scanlines[target] = source.pixels[offset];
                scanlines[target + 1] = source.pixels[offset + 1];
                scanlines[target + 2] = source.pixels[offset + 2];
                scanlines[target + 3] = source.pixels[offset + 3];
            }
        }
        for (let repeat = 1; repeat < scale; repeat++) scanlines.copyWithin(row + repeat * stride, row, row + stride);
        if (y % 8 === 7) await yieldToBrowser();
    }
    const deflated = new Uint8Array(await new Response(new Blob([scanlines]).stream()
        .pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
    if (deflated.length > MAX_PNG_BYTES - 57) throw new BannerError('EXPORT_TOO_LARGE');
    const header = new Uint8Array(13), view = new DataView(header.buffer);
    view.setUint32(0, width); view.setUint32(4, height); header[8] = 8; header[9] = 6;
    const chunks = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', header), pngChunk('IDAT', deflated), pngChunk('IEND', new Uint8Array())];
    const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
}

export async function encodeBannerPng(design: BannerDesign, scale: number = 8): Promise<Uint8Array<ArrayBuffer>> {
    requireScale(scale);
    return encodeImage(renderBanner(design), scale);
}

export async function encodeLetterStripPng(spec: LetterSpec, scale: number = 4): Promise<Uint8Array<ArrayBuffer>> {
    requireScale(scale);
    return encodeImage(renderLetterStrip(spec), scale);
}

/** A manual loom plan, with both existing-banner and fresh-crafting accounting.
 * These are alternatives: do not add wool/sticks on top of an existing banner.
 */
export function loomPlanJSON(inputs: BannerDesign[]): string {
    if (!Array.isArray(inputs) || Object.getPrototypeOf(inputs) !== Array.prototype || inputs.length > 64 || Reflect.ownKeys(inputs).length !== inputs.length + 1) throw new BannerError('INVALID_BANNER');
    for (let index = 0; index < inputs.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(inputs, String(index));
        if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) throw new BannerError('INVALID_BANNER');
    }
    const designs = inputs.map(input => validateBanner(input));
    return JSON.stringify({
        format: 'fusebead-loom-plan', version: 1,
        edition: 'Java', gameVersion: GAME_VERSION,
        ordinaryPatternsOnly: true, ordinaryPatternCount: PATTERN_IDS.length, maximumLayers: MAX_BANNER_LAYERS,
        preview: 'Independent flat schematic; not Minecraft texture or in-game lighting.',
        designs: designs.map((design, index) => ({ index, base: design.base, layers: design.layers, steps: makeLoomSteps(design) })),
        materials: collectMaterials(designs),
        materialAccounting: {
            existingBanners: 'Use materials.banners for already colored blank base banners.',
            newBannerCraftingAlternative: 'Instead of existing banners, use materials.wool and materials.sticks: six matching wool and one stick per base banner. These alternatives are not additive.',
            addedLayerDyes: 'materials.dyes counts one dye per added layer. Base banner colors do not add dye.',
            reusableLoom: 'materials.loom is a reusable tool requirement of zero or one, not a per-layer consumable. If crafting one, use two string and two planks.',
        },
        unsupported: ['Special pattern-item designs', 'Bedrock or other Java versions', 'Game commands or import files'],
    }, null, 2);
}

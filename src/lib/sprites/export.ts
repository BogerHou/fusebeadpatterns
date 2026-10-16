import { GifWriter } from 'omggif';
import { cloneAnimation, packSpriteSheet, SpriteError, type SpriteAnimation } from './core';

type SheetLayout = 'horizontal' | 'vertical' | 'grid';
type RgbaImage = { width: number; height: number; pixels: Uint8ClampedArray };

// These are export limits, not changes to the existing static pixel-grid format.
const MAX_SIDE = 8192;
const MAX_RGBA_BYTES = 64 * 1024 * 1024;
const MAX_PNG_BYTES = 65 * 1024 * 1024;
const MAX_GIF_BYTES = 24 * 1024 * 1024;
const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function exportDimensions(width: number, height: number, scale: number) {
    if (!Number.isInteger(scale) || scale < 1 || scale > 8) throw new SpriteError('INVALID_EXPORT_SCALE');
    const scaledWidth = width * scale, scaledHeight = height * scale;
    if (!Number.isSafeInteger(scaledWidth) || !Number.isSafeInteger(scaledHeight) || scaledWidth < 1 || scaledHeight < 1 ||
        scaledWidth > MAX_SIDE || scaledHeight > MAX_SIDE || scaledWidth * scaledHeight * 4 > MAX_RGBA_BYTES) {
        throw new SpriteError('EXPORT_TOO_LARGE');
    }
    return { width: scaledWidth, height: scaledHeight };
}

const crcTable = Uint32Array.from({ length: 256 }, (_, byte) => {
    let value = byte;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
    return value >>> 0;
});

async function pngChunk(type: string, data: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
    if (data.length + 12 > MAX_PNG_BYTES) throw new SpriteError('EXPORT_TOO_LARGE');
    const chunk = new Uint8Array(data.length + 12), view = new DataView(chunk.buffer);
    view.setUint32(0, data.length);
    chunk.set(new TextEncoder().encode(type), 4);
    chunk.set(data, 8);
    let crc = 0xffffffff;
    for (let offset = 4; offset < chunk.length - 4; offset += 65536) {
        const end = Math.min(chunk.length - 4, offset + 65536);
        for (let index = offset; index < end; index++) crc = (crc >>> 8) ^ crcTable[(crc ^ chunk[index]) & 255];
        if (end < chunk.length - 4) await yieldToBrowser();
    }
    view.setUint32(chunk.length - 4, (crc ^ 0xffffffff) >>> 0);
    return chunk;
}

/** No Canvas conversion: every channel, including hidden RGB at alpha zero, survives. */
async function encodeRgbaPng(image: RgbaImage, scale: number): Promise<Uint8Array<ArrayBuffer>> {
    const { width, height } = exportDimensions(image.width, image.height, scale);
    if (typeof CompressionStream === 'undefined') throw new SpriteError('PNG_EXPORT_UNSUPPORTED');
    const stride = width * 4 + 1;
    if (stride * height > MAX_PNG_BYTES) throw new SpriteError('EXPORT_TOO_LARGE');
    await yieldToBrowser();
    const scanlines = new Uint8Array(stride * height);
    for (let y = 0; y < image.height; y++) {
        const row = y * scale * stride;
        for (let x = 0; x < image.width; x++) {
            const source = (y * image.width + x) * 4;
            for (let repeat = 0; repeat < scale; repeat++) {
                const target = row + 1 + (x * scale + repeat) * 4;
                scanlines[target] = image.pixels[source];
                scanlines[target + 1] = image.pixels[source + 1];
                scanlines[target + 2] = image.pixels[source + 2];
                scanlines[target + 3] = image.pixels[source + 3];
            }
        }
        for (let repeat = 1; repeat < scale; repeat++) scanlines.copyWithin(row + repeat * stride, row, row + stride);
        if (y % 16 === 15) await yieldToBrowser();
    }
    const deflated = new Uint8Array(await new Response(new Blob([scanlines]).stream()
        .pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
    const header = new Uint8Array(13), view = new DataView(header.buffer);
    view.setUint32(0, width); view.setUint32(4, height); header[8] = 8; header[9] = 6;
    const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
        await pngChunk('IHDR', header), await pngChunk('IDAT', deflated), await pngChunk('IEND', new Uint8Array())];
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    if (length > MAX_PNG_BYTES) throw new SpriteError('EXPORT_TOO_LARGE');
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    return bytes;
}

export async function encodeSpriteFramePng(animation: SpriteAnimation, scale: number = 1): Promise<Uint8Array<ArrayBuffer>> {
    // Capture before the first await; an edit during an export cannot change its output.
    const snapshot = cloneAnimation(animation);
    return encodeRgbaPng(snapshot.frames[snapshot.activeFrame], scale);
}

export async function encodeSpriteSheetPng(animation: SpriteAnimation, layout: SheetLayout = 'horizontal', columns?: number, scale: number = 1): Promise<Uint8Array<ArrayBuffer>> {
    const snapshot = cloneAnimation(animation);
    return encodeRgbaPng(packSpriteSheet(snapshot, layout, columns), scale);
}

export function spriteSheetManifest(animation: SpriteAnimation, layout: SheetLayout = 'horizontal', columns?: number, scale: number = 1): string {
    const snapshot = cloneAnimation(animation), sheet = packSpriteSheet(snapshot, layout, columns);
    const size = exportDimensions(sheet.width, sheet.height, scale);
    return JSON.stringify({
        format: 'fusebead-sprite-sheet', version: 1, ...size, scale,
        frameWidth: snapshot.width * scale, frameHeight: snapshot.height * scale,
        columns: sheet.columns, rows: sheet.rows, fps: snapshot.fps,
        frames: sheet.frames.map(frame => ({
            index: frame.index, x: frame.x * scale, y: frame.y * scale,
            width: frame.width * scale, height: frame.height * scale, durationMs: frame.durationMs,
        })),
    }, null, 2);
}

function rgb(pixels: Uint8ClampedArray, offset: number): number {
    return (pixels[offset] << 16) | (pixels[offset + 1] << 8) | pixels[offset + 2];
}

async function gifPalette(animation: SpriteAnimation): Promise<{ palette: number[]; index: (pixels: Uint8ClampedArray, offset: number) => number }> {
    const colors = new Set<number>();
    let quantized = false;
    for (const frame of animation.frames) {
        for (let offset = 0; offset < frame.pixels.length; offset += 4) if (frame.pixels[offset + 3] >= 128) {
            colors.add(rgb(frame.pixels, offset));
            if (colors.size > 255) { quantized = true; break; }
        }
        if (quantized) break;
        await yieldToBrowser();
    }
    // One shared palette across frames prevents independent per-frame color shifts.
    const palette = [0]; // The first entry is reserved for transparent pixels in every frame.
    let index: (pixels: Uint8ClampedArray, offset: number) => number;
    if (quantized) {
        // A bounded deterministic 6×7×6 palette: 252 opaque colors plus transparency.
        for (let r = 0; r < 6; r++) for (let g = 0; g < 7; g++) for (let b = 0; b < 6; b++) {
            palette.push((Math.round(r * 255 / 5) << 16) | (Math.round(g * 255 / 6) << 8) | Math.round(b * 255 / 5));
        }
        index = (pixels, offset) => 1 + (Math.round(pixels[offset] * 5 / 255) * 7 +
            Math.round(pixels[offset + 1] * 6 / 255)) * 6 + Math.round(pixels[offset + 2] * 5 / 255);
    } else {
        const sorted = [...colors].sort((a, b) => a - b), indices = new Map<number, number>();
        for (const color of sorted) { indices.set(color, palette.length); palette.push(color); }
        index = (pixels, offset) => indices.get(rgb(pixels, offset))!;
    }
    let length = 2;
    while (length < palette.length) length *= 2;
    while (palette.length < length) palette.push(0);
    return { palette, index };
}

/** GIF uses binary alpha and at most 255 opaque colors; PNG/project retain full RGBA. */
export async function encodeSpriteGif(animation: SpriteAnimation, scale: number = 1): Promise<Uint8Array<ArrayBuffer>> {
    const snapshot = cloneAnimation(animation), { width, height } = exportDimensions(snapshot.width, snapshot.height, scale);
    // Two bytes per input pixel plus generous per-frame overhead exceed GIF LZW's bounded
    // 12-bit worst case; still verify the writer's reported position before slicing.
    const capacity = width * height * snapshot.frames.length * 2 + snapshot.frames.length * 4096 + 4096;
    if (capacity > MAX_GIF_BYTES) throw new SpriteError('EXPORT_TOO_LARGE');
    await yieldToBrowser();
    const { palette, index } = await gifPalette(snapshot);
    const buffer = new Uint8Array(capacity), writer = new GifWriter(buffer, width, height, { palette, loop: 0 });
    for (let frameIndex = 0; frameIndex < snapshot.frames.length; frameIndex++) {
        const frame = snapshot.frames[frameIndex], pixels = new Uint8Array(width * height);
        for (let y = 0; y < snapshot.height; y++) {
            const row = y * scale * width;
            for (let x = 0; x < snapshot.width; x++) {
                const offset = (y * snapshot.width + x) * 4;
                const value = frame.pixels[offset + 3] < 128 ? 0 : index(frame.pixels, offset);
                pixels.fill(value, row + x * scale, row + (x + 1) * scale);
            }
            for (let repeat = 1; repeat < scale; repeat++) pixels.copyWithin(row + repeat * width, row, row + width);
        }
        // Cumulative rounding keeps total playback time within half a centisecond.
        const delay = Math.round((frameIndex + 1) * 100 / snapshot.fps) - Math.round(frameIndex * 100 / snapshot.fps);
        const used = writer.addFrame(0, 0, width, height, pixels, { delay, disposal: 2, transparent: 0 });
        if (used > capacity) throw new SpriteError('EXPORT_TOO_LARGE');
        await yieldToBrowser();
    }
    const length = writer.end();
    if (length > capacity || length < 14) throw new SpriteError('GIF_EXPORT_FAILED');
    return buffer.slice(0, length);
}

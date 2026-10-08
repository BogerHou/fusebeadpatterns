import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { inflateSync, crc32 } from 'node:zlib';
import { createGrid, encodePng, parseProject, serializeProject, type PixelGrid } from './core';
import { COLOR_LIMITS, countVisibleColors, encodeScaledPng, reducePixelGridColors, type ColorLimit } from './conversion';
import { PixelGridError } from './errors';

function sample(width = 17, height = 31): PixelGrid {
    const source = createGrid(width, height);
    for (let i = 0; i < width * height; i++) source.pixels.set([i >> 8, i & 255, (i * 73) & 255, i % 256], i * 4);
    return source;
}
function colors(grid: PixelGrid): Set<string> {
    const result = new Set<string>();
    for (let i = 0; i < grid.pixels.length; i += 4) if (grid.pixels[i + 3]) result.add([...grid.pixels.slice(i, i + 3)].join(','));
    return result;
}
function assertAlphaAndHidden(source: PixelGrid, output: PixelGrid): void {
    assert.equal(output.width, source.width); assert.equal(output.height, source.height);
    for (let i = 0; i < source.pixels.length; i += 4) {
        assert.equal(output.pixels[i + 3], source.pixels[i + 3]);
        if (!source.pixels[i + 3]) assert.deepEqual(output.pixels.slice(i, i + 4), source.pixels.slice(i, i + 4));
    }
}
/** Independent Node CRC + inflate readback; does not reuse encoder scanline helpers. */
function readPng(bytes: Uint8Array): { width: number; height: number; pixels: Uint8Array } {
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), chunks: Uint8Array[] = [];
    let width = 0, height = 0;
    const types: string[] = [];
    for (let offset = 8; offset < bytes.length;) {
        const size = view.getUint32(offset), type = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString('ascii');
        assert(offset + size + 12 <= bytes.length);
        assert.equal(view.getUint32(offset + size + 8), crc32(bytes.subarray(offset + 4, offset + size + 8)));
        if (type === 'IHDR') {
            width = view.getUint32(offset + 8); height = view.getUint32(offset + 12);
            assert.equal(size, 13); assert.deepEqual([...bytes.subarray(offset + 16, offset + 21)], [8, 6, 0, 0, 0]);
        }
        if (type === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + size));
        types.push(type); offset += size + 12;
    }
    assert.deepEqual(types, ['IHDR', 'IDAT', 'IEND']);
    const scanlines = inflateSync(Buffer.concat(chunks)), pixels = new Uint8Array(width * height * 4), stride = width * 4 + 1;
    assert.equal(scanlines.length, stride * height);
    for (let y = 0; y < height; y++) {
        assert.equal(scanlines[y * stride], 0);
        pixels.set(scanlines.subarray(y * stride + 1, (y + 1) * stride), y * width * 4);
    }
    return { width, height, pixels };
}

test('original remains the default, clones bytes and keeps the version-1 project contract', () => {
    const source = sample(), before = serializeProject(source);
    for (const output of [reducePixelGridColors(source), reducePixelGridColors(source, 'original')]) {
        assert.deepEqual(output, source); assert.notEqual(output.pixels, source.pixels);
        assert.deepEqual(Object.keys(output), ['width', 'height', 'pixels']);
        assert.equal(serializeProject(output), before);
        output.pixels[0] ^= 255; assert.equal(serializeProject(source), before);
    }
    assert.deepEqual(parseProject(before), source);
});

test('within-cap RGB stays byte-exact for all 256 alpha values; transparent colors do not count', () => {
    const source = createGrid(128, 2);
    for (let i = 0; i < 256; i++) source.pixels.set([i % 8, i % 8 + 40, i % 8 + 80, i], i * 4);
    source.pixels.set([219, 13, 57, 0], 0);
    assert.equal(countVisibleColors(source), 8);
    for (const cap of COLOR_LIMITS) assert.deepEqual(reducePixelGridColors(source, cap), source);
    const transparent = createGrid(1, 2, [11, 22, 33, 0, 55, 66, 77, 0]);
    assert.equal(countVisibleColors(transparent), 0);
    for (const cap of COLOR_LIMITS) assert.deepEqual(reducePixelGridColors(transparent, cap), transparent);
});

for (const cap of COLOR_LIMITS) test(`${cap} colors at 128×128: source palette, every alpha, unchanged input and canonical permutation`, () => {
    const source = sample(128, 128), before = source.pixels.slice();
    const first = reducePixelGridColors(source, cap), second = reducePixelGridColors(source, cap);
    assert.deepEqual(first, second); assert.deepEqual(source.pixels, before); assertAlphaAndHidden(source, first);
    const originalColors = colors(source), reducedColors = colors(first);
    assert(originalColors.size > cap); assert(reducedColors.size <= cap);
    assert.equal(countVisibleColors(first), reducedColors.size);
    for (const color of reducedColors) assert(originalColors.has(color));
    assert.deepEqual(reducePixelGridColors(first, cap), first);
    // Multiplication by an odd number permutes all 16,384 cells, not just reversal.
    const permuted = createGrid(128, 128);
    for (let i = 0; i < 16384; i++) { const from = (i * 8191) % 16384; permuted.pixels.set(source.pixels.subarray(from * 4, from * 4 + 4), i * 4); }
    const output = reducePixelGridColors(permuted, cap);
    for (let i = 0; i < 16384; i++) { const from = (i * 8191) % 16384; assert.deepEqual(output.pixels.subarray(i * 4, i * 4 + 4), first.pixels.subarray(from * 4, from * 4 + 4)); }
});

test('rare distinct hues are not hard-coded to a coordinate, and hidden RGB cannot affect assignments', () => {
    const source = createGrid(128, 1);
    for (let i = 0; i < 127; i++) { const gray = Math.round(i * 255 / 126); source.pixels.set([gray, gray, gray, 255], i * 4); }
    source.pixels.set([0, 255, 0, 255], 127 * 4);
    assert.deepEqual([...reducePixelGridColors(source, 8).pixels.slice(-4)], [0, 255, 0, 255]);
    const a = sample(), b = createGrid(a.width, a.height, a.pixels);
    for (let i = 0; i < b.pixels.length; i += 4) if (!b.pixels[i + 3]) b.pixels.set([255, 20, 197], i);
    const qa = reducePixelGridColors(a, 16), qb = reducePixelGridColors(b, 16);
    for (let i = 0; i < a.pixels.length; i += 4) if (a.pixels[i + 3]) assert.deepEqual(qa.pixels.slice(i, i + 4), qb.pixels.slice(i, i + 4));
});

test('conversion validates limits and malformed input without mutating it', () => {
    const source = sample(), before = source.pixels.slice();
    for (const cap of [0, 7, 9, 128, null, '8', NaN, Infinity]) assert.throws(() => reducePixelGridColors(source, cap as ColorLimit), (error: unknown) => error instanceof PixelGridError && error.code === 'COLOR_LIMIT_INVALID');
    assert.throws(() => reducePixelGridColors({ ...source, width: 129 }, 8), (error: unknown) => error instanceof PixelGridError && error.code === 'INVALID_DIMENSIONS');
    assert.throws(() => countVisibleColors({ width: 1, height: 1, pixels: new Array(4) }), (error: unknown) => error instanceof PixelGridError && error.code === 'INVALID_RGBA_CHANNELS');
    assert.throws(() => countVisibleColors({ width: 1, height: 1, pixels: [1, 2, 3, 256] }), /RGBA/);
    assert.throws(() => countVisibleColors({ width: 1, height: 1, pixels: [1, 2, 3] }), /length/);
    assert.deepEqual(source.pixels, before);
    const padded = new Uint8Array([9, 9, 9, 9, 11, 22, 33, 128, 8, 8, 8, 8]);
    assert.equal(countVisibleColors({ width: 1, height: 1, pixels: padded.subarray(4, 8) }), 1);
});

test('all supported PNG scales repeat each source coordinate exactly with transparent RGB and alpha', async () => {
    const source = createGrid(2, 3, [11, 22, 33, 0, 44, 55, 66, 1, 77, 88, 99, 128, 10, 20, 30, 255, 40, 50, 60, 17, 70, 80, 90, 254]);
    const before = serializeProject(source);
    for (const scale of [1, 2, 4, 8, 16]) {
        const encoded = await encodeScaledPng(source, scale), result = readPng(encoded);
        assert.equal(result.width, source.width * scale); assert.equal(result.height, source.height * scale);
        if (scale === 1) assert.deepEqual(encoded, await encodePng(source));
        for (let y = 0; y < result.height; y++) for (let x = 0; x < result.width; x++) {
            const from = (Math.floor(y / scale) * source.width + Math.floor(x / scale)) * 4, at = (y * result.width + x) * 4;
            assert.deepEqual([...result.pixels.slice(at, at + 4)], [...source.pixels.slice(from, from + 4)]);
        }
        assert.equal(serializeProject(source), before);
    }
});

test('reduced RGBA survives old project/original PNG and new scaled PNG without format metadata changes', async () => {
    const reduced = reducePixelGridColors(sample(), 16), project = serializeProject(reduced), restored = parseProject(project);
    assert.deepEqual(restored, reduced);
    assert.deepEqual(Object.keys(JSON.parse(project)), ['format', 'version', 'width', 'height', 'pixels']);
    const png = readPng(await encodePng(restored)); assert.deepEqual([...png.pixels], [...reduced.pixels]);
    assert.deepEqual(await encodeScaledPng(restored, 1), await encodePng(restored));
});

test('maximum 128×128 at 16× is exactly 2048×2048, with no grid or alpha changes', async () => {
    const source = sample(128, 128), before = source.pixels.slice(), output = readPng(await encodeScaledPng(source, 16));
    assert.equal(output.width, 2048); assert.equal(output.height, 2048); assert.equal(output.pixels.length, 4194304 * 4);
    for (let y = 0; y < 2048; y++) for (let x = 0; x < 2048; x++) {
        const from = ((y >> 4) * 128 + (x >> 4)) * 4, to = (y * 2048 + x) * 4;
        for (let c = 0; c < 4; c++) if (output.pixels[to + c] !== source.pixels[from + c]) assert.fail(`RGBA mismatch at ${x},${y},${c}`);
    }
    assert.deepEqual(source.pixels, before);
});

test('invalid scales and unavailable compression fail with stable codes while the project survives', async () => {
    const source = sample(), before = serializeProject(source);
    for (const scale of [0, -1, 3, 1.5, 32, NaN, Infinity, '2', null]) await assert.rejects(encodeScaledPng(source, scale as number), (error: unknown) => error instanceof PixelGridError && error.code === 'PNG_SCALE_INVALID');
    await assert.rejects(encodeScaledPng({ ...source, width: 129 }, 16), (error: unknown) => error instanceof PixelGridError && error.code === 'INVALID_DIMENSIONS');
    vi.stubGlobal('CompressionStream', undefined);
    try { for (const scale of [1, 16]) await assert.rejects(encodeScaledPng(source, scale), (error: unknown) => error instanceof PixelGridError && error.code === 'PNG_EXPORT_UNSUPPORTED'); }
    finally { vi.unstubAllGlobals(); }
    assert.equal(serializeProject(source), before); assert.deepEqual(parseProject(before), source);
});

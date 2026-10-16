import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { crc32, inflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { createGrid, setPixel } from '../pixel-grid/core';
import { createAnimation, type SpriteAnimation } from './core';
import { encodeSpriteFramePng, encodeSpriteGif, encodeSpriteSheetPng, spriteSheetManifest } from './export';

function animation(width: number, height: number, count: number, fps: number = 8): SpriteAnimation {
    const value = createAnimation(width, height);
    value.frames = Array.from({ length: count }, () => createGrid(width, height));
    value.fps = fps;
    return value;
}

// Independent Node inflater and CRC validate the real PNG bytes, not encoder metadata.
function decodePng(bytes: Uint8Array) {
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), parts: Uint8Array[] = [];
    let width = 0, height = 0, cursor = 8;
    for (; cursor < bytes.length;) {
        const length = view.getUint32(cursor), type = Buffer.from(bytes.subarray(cursor + 4, cursor + 8)).toString('ascii');
        assert.ok(length <= bytes.length - cursor - 12);
        assert.equal(view.getUint32(cursor + length + 8), crc32(bytes.subarray(cursor + 4, cursor + length + 8)));
        if (type === 'IHDR') {
            width = view.getUint32(cursor + 8); height = view.getUint32(cursor + 12);
            assert.equal(bytes[cursor + 16], 8); assert.equal(bytes[cursor + 17], 6);
        }
        if (type === 'IDAT') parts.push(bytes.subarray(cursor + 8, cursor + length + 8));
        cursor += length + 12;
    }
    assert.equal(cursor, bytes.length);
    const raw = inflateSync(Buffer.concat(parts)), pixels = new Uint8Array(width * height * 4);
    assert.equal(raw.length, (width * 4 + 1) * height);
    for (let y = 0; y < height; y++) {
        assert.equal(raw[y * (width * 4 + 1)], 0);
        pixels.set(raw.subarray(y * (width * 4 + 1) + 1, (y + 1) * (width * 4 + 1)), y * width * 4);
    }
    return { width, height, pixels };
}

function pixel(image: { width: number; pixels: Uint8Array }, x: number, y: number) {
    return [...image.pixels.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];
}

const python = process.env.FBP_SPRITE_TEST_PYTHON || 'python3';
const pillowAvailable = spawnSync(python, ['-c', 'from PIL import Image'], { timeout: 10000 }).status === 0;
function decodeGif(bytes: Uint8Array) {
    // Pillow is an optional independent acceptance decoder, never a browser dependency.
    const code = `import sys,json,base64,io
from PIL import Image
im=Image.open(io.BytesIO(base64.b64decode(sys.stdin.read())))
out={"width":im.width,"height":im.height,"loop":im.info.get("loop"),"frames":[]}
for i in range(im.n_frames):
 im.seek(i)
 out["frames"].append({"pixels":base64.b64encode(im.convert("RGBA").tobytes()).decode(),"duration":im.info.get("duration"),"disposal":im.disposal_method})
print(json.dumps(out))`;
    const result = spawnSync(python, ['-c', code], { input: Buffer.from(bytes).toString('base64'), encoding: 'utf8', timeout: 15000, maxBuffer: 48 * 1024 * 1024 });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    const decoded = JSON.parse(result.stdout) as { width: number; height: number; loop: number; frames: { pixels: string; duration: number; disposal: number }[] };
    return { ...decoded, frames: decoded.frames.map(frame => ({ ...frame, pixels: new Uint8Array(Buffer.from(frame.pixels, 'base64')) })) };
}

test('frame PNG preserves asymmetric RGBA and hidden transparent RGB at every integer scale', async () => {
    const value = animation(3, 2, 2);
    value.activeFrame = 1;
    value.frames[1].pixels.set([19, 37, 83, 255, 23, 47, 71, 128, 201, 3, 9, 0, 5, 7, 11, 1, 29, 31, 41, 127, 43, 53, 61, 254]);
    for (let scale = 1; scale <= 8; scale++) {
        const actual = decodePng(await encodeSpriteFramePng(value, scale));
        assert.equal(actual.width, 3 * scale); assert.equal(actual.height, 2 * scale);
        for (let y = 0; y < actual.height; y++) for (let x = 0; x < actual.width; x++) {
            const source = (Math.floor(y / scale) * 3 + Math.floor(x / scale)) * 4;
            assert.deepEqual(pixel(actual, x, y), [...value.frames[1].pixels.subarray(source, source + 4)]);
        }
    }
});

test('sprite sheets and manifests agree for horizontal, vertical and padded grid layouts', async () => {
    const value = animation(3, 2, 5, 12);
    value.frames.forEach((frame, index) => {
        setPixel(frame, 0, 0, [index + 10, index + 20, index + 30, index * 50]);
        setPixel(frame, 2, 1, [index + 40, index + 50, index + 60, 255]);
    });
    for (const layout of ['horizontal', 'vertical', 'grid'] as const) {
        const columns = layout === 'grid' ? 3 : undefined, scale = 3;
        const manifest = JSON.parse(spriteSheetManifest(value, layout, columns, scale));
        const image = decodePng(await encodeSpriteSheetPng(value, layout, columns, scale));
        assert.equal(manifest.width, image.width); assert.equal(manifest.height, image.height);
        assert.equal(manifest.frames.length, 5); assert.equal(manifest.fps, 12);
        for (const frame of manifest.frames) {
            assert.equal(frame.width, 9); assert.equal(frame.height, 6);
            assert.equal(frame.durationMs, 1000 / 12);
            assert.deepEqual(pixel(image, frame.x, frame.y), [frame.index + 10, frame.index + 20, frame.index + 30, frame.index * 50]);
            assert.deepEqual(pixel(image, frame.x + 8, frame.y + 5), [frame.index + 40, frame.index + 50, frame.index + 60, 255]);
        }
        if (layout === 'grid') assert.deepEqual(pixel(image, image.width - 1, image.height - 1), [0, 0, 0, 0]);
    }
});

test('asynchronous PNG and GIF exports capture input before later edits', async () => {
    const value = animation(2, 1, 2);
    setPixel(value.frames[0], 0, 0, [17, 33, 49, 255]);
    setPixel(value.frames[1], 1, 0, [99, 111, 123, 255]);
    const frame = encodeSpriteFramePng(value), sheet = encodeSpriteSheetPng(value), gif = encodeSpriteGif(value);
    value.activeFrame = 1; value.fps = 24; value.frames[0].pixels.fill(255); value.frames.reverse();
    assert.deepEqual(pixel(decodePng(await frame), 0, 0), [17, 33, 49, 255]);
    const image = decodePng(await sheet);
    assert.deepEqual(pixel(image, 0, 0), [17, 33, 49, 255]); assert.deepEqual(pixel(image, 3, 0), [99, 111, 123, 255]);
    const bytes = await gif;
    if (pillowAvailable) {
        const decoded = decodeGif(bytes);
        assert.deepEqual(pixel({ width: decoded.width, pixels: decoded.frames[0].pixels }, 0, 0), [17, 33, 49, 255]);
        assert.equal(decoded.frames[0].duration, 130);
    }
});

test('invalid scales, layout, columns and animation data fail before exports allocate large buffers', async () => {
    const value = animation(2, 2, 2);
    for (const scale of [0, -1, 1.5, 9, NaN, Infinity, '2']) {
        await assert.rejects(encodeSpriteFramePng(value, scale as number));
        await assert.rejects(encodeSpriteSheetPng(value, 'grid', 2, scale as number));
        await assert.rejects(encodeSpriteGif(value, scale as number));
        assert.throws(() => spriteSheetManifest(value, 'grid', 2, scale as number));
    }
    await assert.rejects(encodeSpriteSheetPng(value, 'unknown' as 'grid'));
    for (const columns of [0, -1, 1.2, 33, Infinity]) {
        await assert.rejects(encodeSpriteSheetPng(value, 'grid', columns));
        assert.throws(() => spriteSheetManifest(value, 'grid', columns));
    }
    for (const bad of [{ ...value, fps: 0 }, { ...value, frames: [] }, { ...value, activeFrame: 4 },
        { ...value, frames: [createGrid(1, 1)] }, { ...value, width: Infinity }]) {
        await assert.rejects(encodeSpriteFramePng(bad)); await assert.rejects(encodeSpriteGif(bad));
    }
});

test('an 8192-wide sheet is valid while the next integer scale exceeding the side cap is rejected', async () => {
    const value = animation(64, 1, 32);
    setPixel(value.frames[31], 63, 0, [19, 37, 83, 128]);
    const image = decodePng(await encodeSpriteSheetPng(value, 'horizontal', undefined, 4));
    assert.equal(image.width, 8192); assert.equal(image.height, 4);
    assert.deepEqual(pixel(image, 8191, 3), [19, 37, 83, 128]);
    await assert.rejects(encodeSpriteSheetPng(value, 'horizontal', undefined, 5));
    assert.throws(() => spriteSheetManifest(value, 'horizontal', undefined, 5));
});

test('unsupported PNG compression leaves animation pixels and settings intact', async () => {
    const value = animation(2, 1, 1), original = structuredClone(value);
    vi.stubGlobal('CompressionStream', undefined);
    try { await assert.rejects(encodeSpriteFramePng(value), /PNG_EXPORT_UNSUPPORTED/); }
    finally { vi.unstubAllGlobals(); }
    assert.deepEqual(value, original);
});

test.skipIf(!pillowAvailable)('Pillow independently verifies GIF frame order, transparency threshold, scale and no disposal trails', async () => {
    const value = animation(3, 2, 5, 8);
    setPixel(value.frames[0], 0, 0, [207, 31, 57, 255]);
    setPixel(value.frames[0], 1, 1, [31, 83, 149, 128]);
    setPixel(value.frames[1], 2, 1, [17, 179, 73, 255]);
    setPixel(value.frames[1], 0, 0, [249, 13, 91, 127]);
    // Frame 2 is completely transparent and must clear every earlier mark.
    setPixel(value.frames[3], 1, 0, [0, 0, 0, 255]);
    setPixel(value.frames[4], 2, 0, [249, 221, 17, 254]);
    const decoded = decodeGif(await encodeSpriteGif(value, 2));
    assert.equal(decoded.width, 6); assert.equal(decoded.height, 4); assert.equal(decoded.loop, 0); assert.equal(decoded.frames.length, 5);
    for (let index = 0; index < value.frames.length; index++) {
        const frame = decoded.frames[index];
        assert.equal(frame.disposal, 2); assert.equal(frame.duration, [130, 120, 130, 120, 130][index]);
        for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) {
            const offset = (Math.floor(y / 2) * 3 + Math.floor(x / 2)) * 4, source = value.frames[index].pixels;
            const expected = source[offset + 3] < 128 ? [0, 0, 0, 0] : [source[offset], source[offset + 1], source[offset + 2], 255];
            assert.deepEqual(pixel({ width: 6, pixels: frame.pixels }, x, y), expected);
        }
    }
});

test.skipIf(!pillowAvailable)('GIF preserves all 255 opaque colors plus transparency without quantization', async () => {
    const value = animation(16, 16, 1);
    for (let index = 0; index < 255; index++) value.frames[0].pixels.set([index, (index * 31) % 256, (index * 67) % 256, 255], index * 4);
    const decoded = decodeGif(await encodeSpriteGif(value));
    assert.deepEqual(decoded.frames[0].pixels, new Uint8Array(value.frames[0].pixels));
});

test.skipIf(!pillowAvailable)('GIF quantizes more than 255 colors once across all frames without frame-local color shifts', async () => {
    const value = animation(32, 16, 2, 24);
    for (let index = 0; index < 512; index++) value.frames[0].pixels.set([index >> 8, index & 255, 119, 255], index * 4);
    value.frames[1].pixels.set(value.frames[0].pixels);
    const decoded = decodeGif(await encodeSpriteGif(value));
    assert.equal(decoded.frames.length, 2); assert.deepEqual(decoded.frames[0].pixels, decoded.frames[1].pixels);
    assert.deepEqual(decoded.frames.map(frame => frame.duration), [40, 40]);
    const colors = new Set<string>();
    for (let index = 0; index < 512; index++) {
        const source = value.frames[0].pixels.subarray(index * 4, index * 4 + 4);
        const expected = [Math.round(Math.round(source[0] * 5 / 255) * 255 / 5), Math.round(Math.round(source[1] * 6 / 255) * 255 / 6), Math.round(Math.round(source[2] * 5 / 255) * 255 / 5), 255];
        const actual = [...decoded.frames[0].pixels.subarray(index * 4, index * 4 + 4)];
        assert.deepEqual(actual, expected); colors.add(actual.join(','));
    }
    assert.ok(colors.size <= 252);
});

test.skipIf(!pillowAvailable)('24fps GIF cumulative timing stays within half a centisecond and fully transparent frames remain', async () => {
    const value = animation(1, 1, 32, 24);
    const decoded = decodeGif(await encodeSpriteGif(value));
    assert.equal(decoded.frames.length, 32); assert.equal(decoded.loop, 0);
    const duration = decoded.frames.reduce((sum, frame) => sum + frame.duration, 0);
    assert.ok(Math.abs(duration - 32000 / 24) <= 5);
    for (const frame of decoded.frames) assert.deepEqual([...frame.pixels], [0, 0, 0, 0]);
});

test('GIF accepts the maximum animation geometry and scale without truncating the trailer', async () => {
    const value = animation(64, 64, 32, 24);
    value.frames.forEach((frame, index) => {
        for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) setPixel(frame, x, y,
            [(x * 17 + index * 31) % 256, (y * 43 + index * 7) % 256, (x * y * 11) % 256, (x + y) % 3 ? 255 : 0]);
    });
    const encoded = await encodeSpriteGif(value, 8), view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    assert.equal(Buffer.from(encoded.subarray(0, 6)).toString(), 'GIF89a');
    assert.equal(view.getUint16(6, true), 512); assert.equal(view.getUint16(8, true), 512);
    assert.equal(encoded.at(-1), 59); assert.ok(encoded.length < 24 * 1024 * 1024);
});

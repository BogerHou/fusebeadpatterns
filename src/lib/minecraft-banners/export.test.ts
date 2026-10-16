import { afterEach, describe, expect, it, vi } from 'vitest';
import { crc32, inflateSync } from 'node:zlib';
import { BannerError, createBanner, renderBanner, type BannerDesign, type RgbaImage } from './core';
import { DYE_COLORS, DYE_IDS } from './data';
import { buildLetterBanners, renderLetterStrip, type LetterSpec } from './letters';
import { encodeBannerPng, encodeLetterStripPng, loomPlanJSON } from './export';

// Actual Node zlib inflation/CRC is independent of the browser PNG encoder.
function decodePng(bytes: Uint8Array) {
    expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const input = Buffer.from(bytes), idats: Buffer[] = [], chunkTypes: string[] = [];
    let cursor = 8, width = 0, height = 0;
    while (cursor < input.length) {
        const length = input.readUInt32BE(cursor), type = input.toString('ascii', cursor + 4, cursor + 8);
        expect(length).toBeLessThanOrEqual(input.length - cursor - 12);
        expect(input.readUInt32BE(cursor + length + 8)).toBe(crc32(input.subarray(cursor + 4, cursor + length + 8)));
        chunkTypes.push(type);
        if (type === 'IHDR') {
            expect(length).toBe(13);
            width = input.readUInt32BE(cursor + 8); height = input.readUInt32BE(cursor + 12);
            expect(Array.from(input.subarray(cursor + 16, cursor + 21))).toEqual([8, 6, 0, 0, 0]);
        }
        if (type === 'IDAT') idats.push(input.subarray(cursor + 8, cursor + 8 + length));
        if (type === 'IEND') expect(length).toBe(0);
        cursor += 12 + length;
    }
    expect(cursor).toBe(input.length);
    expect(chunkTypes).toEqual(['IHDR', 'IDAT', 'IEND']);
    const raw = inflateSync(Buffer.concat(idats)), stride = width * 4 + 1, pixels = new Uint8Array(width * height * 4);
    expect(raw.length).toBe(stride * height);
    for (let y = 0; y < height; y++) {
        expect(raw[y * stride]).toBe(0);
        pixels.set(raw.subarray(y * stride + 1, (y + 1) * stride), y * width * 4);
    }
    return { width, height, pixels };
}
function pixel(image: { width: number; pixels: Uint8Array }, x: number, y: number) {
    return Array.from(image.pixels.subarray((y * image.width + x) * 4, (y * image.width + x + 1) * 4));
}
function expectNearest(image: ReturnType<typeof decodePng>, source: RgbaImage, scale: number) {
    expect([image.width, image.height]).toEqual([source.width * scale, source.height * scale]);
    // Construct the independent expected raster by output coordinate division,
    // rather than the encoder's source-row/copyWithin expansion algorithm.
    const expected = new Uint8Array(image.width * image.height * 4);
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
        const from = (Math.floor(y / scale) * source.width + Math.floor(x / scale)) * 4;
        expected.set(source.pixels.subarray(from, from + 4), (y * image.width + x) * 4);
    }
    // Native byte comparison keeps the largest accepted strips bounded during
    // verification instead of constructing millions of assertion objects.
    expect(Buffer.compare(Buffer.from(image.pixels), Buffer.from(expected))).toBe(0);
}
const word = (text: string): LetterSpec => ({ text, base: 'white', ink: 'black' });
afterEach(() => vi.unstubAllGlobals());

describe('actual banner PNG bytes', () => {
    it('defaults to 160 by 320 with exact white diffuse RGB and no canvas conversion', async () => {
        const image = decodePng(await encodeBannerPng(createBanner()));
        expect([image.width, image.height]).toEqual([160, 320]);
        for (let offset = 0; offset < image.pixels.length; offset += 4) {
            if (offset === 0 || offset === image.pixels.length - 4 || offset === 400) expect(Array.from(image.pixels.subarray(offset, offset + 4))).toEqual([249, 255, 254, 255]);
        }
        expectNearest(image, { width: 20, height: 40, pixels: Uint8ClampedArray.from({ length: 3200 }, (_, index) => [249, 255, 254, 255][index % 4]) }, 8);
    });

    it.each(DYE_IDS)('keeps every native %s dye channel exact', async dye => {
        const image = decodePng(await encodeBannerPng(createBanner(dye), 1));
        const rgb = [1, 3, 5].map(start => parseInt(DYE_COLORS[dye].slice(start, start + 2), 16));
        expect([image.width, image.height]).toEqual([20, 40]);
        expect(pixel(image, 0, 0)).toEqual([...rgb, 255]); expect(pixel(image, 19, 39)).toEqual([...rgb, 255]);
    });

    it.each([1, 2, 3, 4, 5, 6, 7, 8])('repeats actual layered RGBA with integer scale %s', async scale => {
        const design: BannerDesign = { base: 'yellow', layers: [{ pattern: 'stripe_top', color: 'red' }, { pattern: 'stripe_bottom', color: 'blue' }] };
        expectNearest(decodePng(await encodeBannerPng(design, scale)), renderBanner(design), scale);
    });

    it('preserves layer order at overlapping top cells', async () => {
        const a: BannerDesign = { base: 'white', layers: [{ pattern: 'stripe_top', color: 'red' }, { pattern: 'stripe_top', color: 'black' }] };
        const b: BannerDesign = { base: 'white', layers: [...a.layers].reverse() };
        expect(pixel(decodePng(await encodeBannerPng(a, 1)), 10, 0)).toEqual([29, 29, 33, 255]);
        expect(pixel(decodePng(await encodeBannerPng(b, 1)), 10, 0)).toEqual([176, 46, 38, 255]);
    });

    it('captures mutable designs before the first asynchronous yield', async () => {
        const design: BannerDesign = { base: 'yellow', layers: [{ pattern: 'stripe_left', color: 'blue' }] }, expected = renderBanner(design);
        const pending = encodeBannerPng(design, 3);
        design.base = 'black'; design.layers[0].color = 'red'; design.layers.push({ pattern: 'stripe_top', color: 'green' });
        expectNearest(decodePng(await pending), expected, 3);
    });

    it.each([0, -1, 9, 1.5, NaN, Infinity, '4', null])('rejects unsupported scale %s', async scale => {
        await expect(encodeBannerPng(createBanner(), scale as number)).rejects.toMatchObject({ code: 'INVALID_EXPORT_SCALE' });
        await expect(encodeLetterStripPng(word('A'), scale as number)).rejects.toMatchObject({ code: 'INVALID_EXPORT_SCALE' });
    });

    it('fails explicitly when the PNG compression API is unavailable', async () => {
        vi.stubGlobal('CompressionStream', undefined);
        await expect(encodeBannerPng(createBanner())).rejects.toMatchObject({ code: 'PNG_EXPORT_UNSUPPORTED' });
    });
});

describe('actual word-strip PNG', () => {
    it('keeps spaces and gaps transparent and actual letters in original order', async () => {
        const image = decodePng(await encodeLetterStripPng(word('A C'), 1));
        expect([image.width, image.height]).toEqual([54, 40]);
        const banners = buildLetterBanners(word('A C'));
        expect(banners.map(item => item.character)).toEqual(['A', ' ', 'C']);
        expect(banners[1].design).toBeNull();
        const a = decodePng(await encodeBannerPng(banners[0].design!, 1)), c = decodePng(await encodeBannerPng(banners[2].design!, 1));
        for (let y = 0; y < 40; y++) {
            for (let x = 0; x < 20; x++) {
                expect(pixel(image, x, y)).toEqual(pixel(a, x, y));
                expect(pixel(image, x + 34, y)).toEqual(pixel(c, x, y));
            }
            for (let x = 20; x < 34; x++) expect(pixel(image, x, y)).toEqual([0, 0, 0, 0]);
        }
    });

    it('defaults to fourfold scaling and keeps later spec changes out of a pending export', async () => {
        const spec = word('a b'), expected = renderLetterStrip(spec), pending = encodeLetterStripPng(spec);
        spec.text = 'B A'; spec.base = 'red'; spec.ink = 'blue';
        expectNearest(decodePng(await pending), expected, 4);
    });

    it('accepts 32 single-banner letters at 702 by 40 and maximum scale within 8 MiB RGBA', async () => {
        const spec = word('A'.repeat(32)), image = decodePng(await encodeLetterStripPng(spec, 8));
        expect([image.width, image.height]).toEqual([5616, 320]);
        expect(image.pixels.length).toBe(7188480); expect(image.pixels.length).toBeLessThanOrEqual(8 * 1024 * 1024);
        let opaque = 0, transparent = 0;
        for (let offset = 3; offset < image.pixels.length; offset += 4) {
            if (image.pixels[offset] === 255) opaque++; else if (image.pixels[offset] === 0) transparent++; else throw new Error('Unexpected strip alpha');
        }
        expect(opaque).toBe(32 * 20 * 40 * 64); expect(transparent).toBe(31 * 2 * 40 * 64);
        const last = buildLetterBanners(spec)[31].design!, lastImage = decodePng(await encodeBannerPng(last, 8));
        for (const [x, y] of [[0, 0], [80, 160], [159, 319]]) expect(pixel(image, 5456 + x, y)).toEqual(pixel(lastImage, x, y));
    });

    it('exports all 64 panels of 32 two-banner V letters at default scale and rejects excessive dimensions', async () => {
        const spec = word('V'.repeat(32)), entries = buildLetterBanners(spec);
        expect(entries.length).toBe(64);
        expect(entries.map(entry => entry.position)).toEqual(Array.from({ length: 64 }, (_, index) => Math.floor(index / 2)));
        const image = decodePng(await encodeLetterStripPng(spec));
        expect([image.width, image.height, image.pixels.length]).toEqual([5624, 160, 3599360]);
        expectNearest(image, renderLetterStrip(spec), 4);
        await expect(encodeLetterStripPng(spec, 8)).rejects.toMatchObject({ code: 'EXPORT_TOO_LARGE' });
        // Scale 6 is still under the RGBA-byte budget, but exceeds 8192px wide.
        expect(1406 * 6 * 40 * 6 * 4).toBeLessThan(8 * 1024 * 1024);
        await expect(encodeLetterStripPng(spec, 6)).rejects.toMatchObject({ code: 'EXPORT_TOO_LARGE' });
        const plan = JSON.parse(loomPlanJSON(entries.map(entry => entry.design!)));
        expect(plan.designs.length).toBe(64);
        expect(plan.materials.banners.white).toBe(64);
        expect(plan.materials.wool.white).toBe(384);
        expect(plan.materials.sticks).toBe(64);
    });

    it('does not export unsupported characters, same-color text or over-limit words', async () => {
        await expect(encodeLetterStripPng(word('A🙂'))).rejects.toMatchObject({ code: 'UNSUPPORTED_CHARACTER' });
        await expect(encodeLetterStripPng({ text: 'A', base: 'blue', ink: 'blue' })).rejects.toMatchObject({ code: 'SAME_COLORS' });
        await expect(encodeLetterStripPng(word('A'.repeat(33)))).rejects.toBeInstanceOf(BannerError);
        await expect(encodeLetterStripPng(word('   '))).rejects.toMatchObject({ code: 'EMPTY_TEXT' });
    });
});

describe('manual loom-plan JSON', () => {
    it('exports actual ordered layers/steps and alternatives without double-counting base dye', () => {
        const inputs: BannerDesign[] = [
            { base: 'blue', layers: [{ pattern: 'stripe_top', color: 'red' }, { pattern: 'stripe_bottom', color: 'red' }] },
            { base: 'blue', layers: [] },
            { base: 'white', layers: [{ pattern: 'border', color: 'blue' }] },
        ];
        const parsed = JSON.parse(loomPlanJSON(inputs));
        expect([parsed.edition, parsed.gameVersion, parsed.ordinaryPatternsOnly, parsed.ordinaryPatternCount, parsed.maximumLayers]).toEqual(['Java', '26.3', true, 32, 6]);
        expect(parsed.designs).toEqual([
            { index: 0, base: 'blue', layers: inputs[0].layers, steps: [{ step: 1, pattern: 'stripe_top', color: 'red' }, { step: 2, pattern: 'stripe_bottom', color: 'red' }] },
            { index: 1, base: 'blue', layers: [], steps: [] },
            { index: 2, base: 'white', layers: inputs[2].layers, steps: [{ step: 1, pattern: 'border', color: 'blue' }] },
        ]);
        expect(parsed.materials).toEqual({ banners: { blue: 2, white: 1 }, dyes: { red: 2, blue: 1 }, wool: { blue: 12, white: 6 }, sticks: 3, loom: 1 });
        expect(parsed.materialAccounting.newBannerCraftingAlternative).toContain('not additive');
        expect(parsed.materialAccounting.addedLayerDyes).toContain('Base banner colors do not add dye');
        expect(parsed.materialAccounting.reusableLoom).toContain('two string and two planks');
        expect(parsed).not.toHaveProperty('commands'); expect(parsed).not.toHaveProperty('nbt');
        expect(loomPlanJSON(inputs)).not.toMatch(/\/give|\.minecraft\//);
    });

    it('handles no designs as no materials and no loom requirement', () => {
        expect(JSON.parse(loomPlanJSON([])).materials).toEqual({ banners: {}, dyes: {}, wool: {}, sticks: 0, loom: 0 });
    });

    it('rejects unknown/special patterns, surplus designs and hostile sparse/accessor arrays', () => {
        expect(() => loomPlanJSON([{ base: 'white', layers: [{ pattern: 'bricks', color: 'black' }] } as unknown as BannerDesign])).toThrow(BannerError);
        expect(() => loomPlanJSON(Array.from({ length: 65 }, () => createBanner()))).toThrow(BannerError);
        const sparse = [createBanner(), createBanner()]; delete sparse[0];
        expect(() => loomPlanJSON(sparse)).toThrow(BannerError);
        const extra = [createBanner()]; Object.assign(extra, { url: 'https://example.org' });
        expect(() => loomPlanJSON(extra)).toThrow(BannerError);
        const alteredPrototype = [createBanner()]; Object.setPrototypeOf(alteredPrototype, { map() { throw new Error('Should not execute'); } });
        expect(() => loomPlanJSON(alteredPrototype)).toThrow(BannerError);
        let called = false;
        const getter: BannerDesign[] = [];
        Object.defineProperty(getter, '0', { enumerable: true, get() { called = true; return createBanner(); } });
        expect(() => loomPlanJSON(getter)).toThrow(BannerError); expect(called).toBe(false);
    });
});

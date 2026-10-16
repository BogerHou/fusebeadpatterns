import { describe, expect, it } from 'vitest';
import { appendLayer, collectMaterials, createBanner, makeLoomSteps, moveLayer, removeLayer, renderBanner, replaceLayer, validateBanner, type BannerDesign } from './core';
import { DYE_COLORS, DYE_IDS } from './data';

describe('Java banner planning rules', () => {
    it('uses the 16 diffuse colors, distinct from chat text colors', () => {
        expect(DYE_IDS).toHaveLength(16); expect(new Set(DYE_IDS).size).toBe(16);
        expect(DYE_COLORS.white).toBe('#f9fffe'); expect(DYE_COLORS.black).toBe('#1d1d21');
        expect(DYE_COLORS.red).toBe('#b02e26');
    });
    it('accepts a colored blank base with no pattern layer or dye cost', () => {
        const base = createBanner('blue'); expect(base).toEqual({ base: 'blue', layers: [] });
        expect(makeLoomSteps(base)).toEqual([]);
        expect(collectMaterials([base])).toEqual({ banners: { blue: 1 }, dyes: {}, wool: { blue: 6 }, sticks: 1, loom: 0 });
    });
    it('counts six new loom passes, never accepts a seventh layer', () => {
        let banner = createBanner();
        for (let i = 0; i < 6; i++) banner = appendLayer(banner, { pattern: 'stripe_left', color: 'red' });
        expect(makeLoomSteps(banner).map(step => step.step)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(() => appendLayer(banner, { pattern: 'border', color: 'white' })).toThrow('LAYER_LIMIT');
        expect(() => validateBanner({ ...banner, layers: [...banner.layers, banner.layers[0]] })).toThrow();
        expect(collectMaterials([banner]).dyes).toEqual({ red: 6 });
    });
    it('does not misclassify special-item textures as ordinary loom patterns', () => {
        for (const pattern of ['bricks', 'curly_border', 'creeper', 'mojang', 'flow', 'minecraft:border']) {
            expect(() => validateBanner({ base: 'white', layers: [{ pattern, color: 'red' }] })).toThrow();
        }
    });
    it('keeps all mutation inputs and returned snapshots independent', () => {
        const first = appendLayer(createBanner(), { pattern: 'stripe_left', color: 'red' });
        const second = appendLayer(first, { pattern: 'stripe_top', color: 'blue' });
        const reversed = moveLayer(second, 1, -1);
        expect(first.layers).toHaveLength(1); expect(second.layers.map(x => x.color)).toEqual(['red', 'blue']);
        expect(reversed.layers.map(x => x.color)).toEqual(['blue', 'red']);
        reversed.layers[0].color = 'black'; expect(second.layers[1].color).toBe('blue');
        expect(removeLayer(second, 0).layers).toEqual([{ pattern: 'stripe_top', color: 'blue' }]);
        expect(replaceLayer(second, 1, { pattern: 'border', color: 'yellow' }).layers[1]).toEqual({ pattern: 'border', color: 'yellow' });
    });
    it.each([-1, 1.5, 2, NaN, Infinity])('rejects invalid layer index %s', index => {
        const banner = appendLayer(createBanner(), { pattern: 'border', color: 'red' });
        expect(() => removeLayer(banner, index)).toThrow();
        expect(() => replaceLayer(banner, index, { pattern: 'border', color: 'blue' })).toThrow();
    });
    it('rejects movement beyond either end and non-unit moves', () => {
        const banner = appendLayer(createBanner(), { pattern: 'border', color: 'red' });
        expect(() => moveLayer(banner, 0, -1)).toThrow(); expect(() => moveLayer(banner, 0, 1)).toThrow();
        expect(() => moveLayer(banner, 0, 0 as 1)).toThrow();
    });
    it('uses one dye for each pass even when several passes use the same color', () => {
        const first: BannerDesign = { base: 'white', layers: [{ pattern: 'stripe_left', color: 'red' }, { pattern: 'stripe_top', color: 'red' }] };
        const second: BannerDesign = { base: 'blue', layers: [{ pattern: 'border', color: 'white' }] };
        expect(collectMaterials([first, second, first])).toEqual({ banners: { white: 2, blue: 1 }, dyes: { red: 4, white: 1 }, wool: { white: 12, blue: 6 }, sticks: 3, loom: 1 });
        expect(collectMaterials([])).toEqual({ banners: {}, dyes: {}, wool: {}, sticks: 0, loom: 0 });
    });
    it('renders bottom-to-top order and intermediate progress at asymmetric points', () => {
        const banner: BannerDesign = { base: 'white', layers: [{ pattern: 'stripe_left', color: 'red' }, { pattern: 'stripe_top', color: 'blue' }] };
        const pixel = (step: number, x: number, y: number) => { const image = renderBanner(banner, step); return [...image.pixels.slice((y * 20 + x) * 4, (y * 20 + x) * 4 + 4)]; };
        expect(pixel(0, 2, 2)).toEqual([249, 255, 254, 255]);
        expect(pixel(1, 2, 2)).toEqual([176, 46, 38, 255]);
        expect(pixel(2, 2, 2)).toEqual([60, 68, 170, 255]);
        expect(pixel(2, 2, 30)).toEqual([176, 46, 38, 255]);
        expect(pixel(2, 18, 30)).toEqual([249, 255, 254, 255]);
        expect(renderBanner(moveLayer(banner, 1, -1)).pixels.slice((2 * 20 + 2) * 4, (2 * 20 + 2) * 4 + 4)).toEqual(new Uint8ClampedArray([176, 46, 38, 255]));
    });
    it('returns an independent opaque 20 by 40 image and bounds progress', () => {
        const a = renderBanner(createBanner()), b = renderBanner(createBanner()); a.pixels.fill(0);
        expect(b.width).toBe(20); expect(b.height).toBe(40); expect(b.pixels).toHaveLength(3200);
        expect(b.pixels[3]).toBe(255);
        expect(() => renderBanner(createBanner(), 1)).toThrow(); expect(() => renderBanner(createBanner(), -1)).toThrow();
    });
    it('rejects unknown colors, sparse arrays, accessors and extra project fields', () => {
        const invalid: unknown[] = [{ base: 'RED', layers: [] }, { base: 'white', layers: [], extra: 1 }, { base: 'white', layers: new Array(1) }, { base: '__proto__', layers: [] }, { base: 'white', layers: [{ pattern: 'border', color: 'red', extra: 1 }] }];
        for (const bad of invalid) expect(() => validateBanner(bad)).toThrow();
        const getter = Object.defineProperty({}, 'base', { get() { throw new Error('getter executed'); }, enumerable: true });
        expect(() => validateBanner(getter)).toThrow('INVALID_BANNER');
        expect(() => collectMaterials(new Array(65).fill(createBanner()))).toThrow();
        const layers = Object.defineProperty(new Array(1), '0', { get() { throw new Error('getter executed'); }, enumerable: true });
        expect(() => validateBanner({ base: 'white', layers })).toThrow('INVALID_BANNER');
        const extra = [createBanner()]; Object.defineProperty(extra, 'extra', { value: true });
        expect(() => collectMaterials(extra)).toThrow('INVALID_BANNER');
    });
});

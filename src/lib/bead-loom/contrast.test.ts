import { describe, expect, it } from 'vitest';
import { loomSymbolInk } from './contrast';

describe('loom symbol ink', () => {
    it.each([
        ['#00CC00', '#000000'],
        ['#FF0000', '#000000'],
        ['#0000FF', '#ffffff'],
        ['#000000', '#ffffff'],
        ['#FFFFFF', '#000000'],
        ['#757575', '#ffffff'],
        ['#777777', '#000000'],
    ])('chooses the higher-contrast ink for %s', (background, ink) => {
        expect(loomSymbolInk(background)).toBe(ink);
        expect(loomSymbolInk(background.toLowerCase())).toBe(ink);
    });

    it('keeps at least 4.5:1 contrast through all gray values and a sampled sRGB cube', () => {
        const colors: number[][] = Array.from({ length: 256 }, (_, value) => [value, value, value]);
        for (let r = 0; r < 256; r += 17) for (let g = 0; g < 256; g += 17) for (let b = 0; b < 256; b += 17) colors.push([r, g, b]);
        for (const rgb of colors) {
            const hex = `#${rgb.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
            const luminance = rgb.reduce((sum, channel, index) => {
                const fraction = channel / 255;
                const linear = fraction <= 0.04045 ? fraction / 12.92 : Math.pow((fraction + 0.055) / 1.055, 2.4);
                return sum + linear * [0.2126, 0.7152, 0.0722][index];
            }, 0);
            const contrast = loomSymbolInk(hex) === '#000000' ? (luminance + 0.05) / 0.05 : 1.05 / (luminance + 0.05);
            expect(contrast).toBeGreaterThanOrEqual(4.5);
        }
    });

    it('rejects invalid colors rather than silently choosing an ink', () => {
        for (const value of ['#fff', '#GG0000', 'black', '123456', '#00000000']) expect(() => loomSymbolInk(value)).toThrow();
    });
});

import { describe, expect, it } from 'vitest';
import { collectMaterials, renderBanner } from './core';
import { DYE_COLORS } from './data';
import { buildLetterBanners, LETTER_CHARACTERS, letterRecipes, renderLetterStrip, type LetterSpec } from './letters';

const spec = (text: string): LetterSpec => ({ text, base: 'white', ink: 'black' });
describe('independently composed banner lettering', () => {
    it('covers the complete alphabet and digits using at most six ordinary passes per actual flag', () => {
        expect(new Set(Object.keys(letterRecipes))).toEqual(new Set(LETTER_CHARACTERS));
        for (const character of LETTER_CHARACTERS) {
            const entries = buildLetterBanners(spec(character));
            expect(entries.length).toBe('BDGMVW'.includes(character) ? 2 : 1);
            for (const entry of entries) {
                expect(entry.design!.layers.length).toBeLessThanOrEqual(6);
                expect(renderBanner(entry.design!).pixels).toHaveLength(3200);
                expect(entry.position).toBe(0);
            }
        }
    });
    it('keeps all individual glyph raster results distinct, including easy-to-confuse pairs', () => {
        const signatures = new Map<string, string>();
        for (const character of LETTER_CHARACTERS) {
            const image = renderLetterStrip(spec(character));
            const signature = image.width + ':' + Buffer.from(image.pixels).toString('base64');
            expect(signatures.get(signature), 'duplicate of ' + character).toBeUndefined(); signatures.set(signature, character);
        }
        // Distinct bytes do not establish legibility; the rendered alphabet also
        // needs a visual review before publication.
        expect(signatures.size).toBe(36);
    });
    it('keeps ASCII case conversion explicit and spaces in their original positions', () => {
        const entries = buildLetterBanners(spec('a v c'));
        expect(entries.map(entry => [entry.character, entry.position, entry.panel, entry.panelCount])).toEqual([
            ['A', 0, 1, 1], [' ', 1, 1, 1], ['V', 2, 1, 2], ['V', 2, 2, 2], [' ', 3, 1, 1], ['C', 4, 1, 1],
        ]);
        expect(entries[1].design).toBeNull(); expect(entries[4].design).toBeNull();
        expect(buildLetterBanners(spec('hello'))).toEqual(buildLetterBanners(spec('HELLO')));
    });
    it.each(['ß', 'é', 'Ａ', 'A/B', 'A\nB', 'A🌱', '\u00a0'])('rejects unsupported text without a lossy replacement: %s', text => {
        const input = spec(text); expect(() => buildLetterBanners(input)).toThrow('UNSUPPORTED_CHARACTER'); expect(input.text).toBe(text);
    });
    it.each(['', ' ', '   '])('rejects empty lettering %s', text => expect(() => buildLetterBanners(spec(text))).toThrow('EMPTY_TEXT'));
    it('rejects overlength, same-color and unknown-role input', () => {
        expect(() => buildLetterBanners(spec('A'.repeat(33)))).toThrow('TEXT_TOO_LONG');
        expect(() => buildLetterBanners({ text: 'A', base: 'blue', ink: 'blue' })).toThrow('SAME_COLORS');
        expect(() => buildLetterBanners({ ...spec('A'), extra: true } as LetterSpec)).toThrow();
    });
    it('uses two adjacent diagonal flags for a readable V and reports every material', () => {
        const entries = buildLetterBanners(spec('V'));
        expect(entries.map(entry => entry.design)).toEqual([
            { base: 'white', layers: [{ pattern: 'stripe_downright', color: 'black' }] },
            { base: 'white', layers: [{ pattern: 'stripe_downleft', color: 'black' }] },
        ]);
        expect(collectMaterials(entries.map(entry => entry.design!))).toEqual({ banners: { white: 2 }, dyes: { black: 2 }, wool: { white: 12 }, sticks: 2, loom: 1 });
        expect(renderLetterStrip(spec('V')).width).toBe(42);
    });
    it('counts an ink-color starting banner when background dye is used to carve the glyph', () => {
        const [entry] = buildLetterBanners({ text: '8', base: 'red', ink: 'blue' });
        expect(entry.design).toEqual({ base: 'blue', layers: [{ pattern: 'rhombus', color: 'red' }, { pattern: 'stripe_middle', color: 'blue' }] });
        expect(collectMaterials([entry.design!])).toEqual({ banners: { blue: 1 }, dyes: { red: 1, blue: 1 }, wool: { blue: 6 }, sticks: 1, loom: 1 });
        expect(DYE_COLORS.blue).toBe('#3c44aa');
    });
    it('owns each generated design and never mutates stored recipes', () => {
        const [first] = buildLetterBanners(spec('AA')); first.design!.layers[0].color = 'red';
        expect(buildLetterBanners(spec('A'))[0].design!.layers[0].color).toBe('black');
        expect(Object.isFrozen(letterRecipes.A.layers)).toBe(true); expect(Object.isFrozen(letterRecipes.A.layers[0])).toBe(true);
    });
    it('uses the actual last tile and preserves transparent spaces in a 32-character strip', () => {
        const image = renderLetterStrip(spec('A'.repeat(32))); expect([image.width, image.height]).toEqual([702, 40]);
        const widest = renderLetterStrip(spec('V'.repeat(32))); expect([widest.width, widest.height]).toEqual([1406, 40]);
        const spaced = renderLetterStrip(spec('A C')); expect(spaced.width).toBe(54);
        for (let y = 0; y < 40; y++) for (let x = 20; x < 34; x++) expect([...spaced.pixels.slice((y * 54 + x) * 4, (y * 54 + x) * 4 + 4)]).toEqual([0, 0, 0, 0]);
        expect(renderLetterStrip(spec('A')).pixels).toEqual(renderBanner(buildLetterBanners(spec('A'))[0].design!).pixels);
    });
});

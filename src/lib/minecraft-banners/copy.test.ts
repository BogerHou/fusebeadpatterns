import { describe, expect, it } from 'vitest';
import { bannerCopy } from './copy';
import { DYE_IDS } from './data';
import { PATTERN_IDS } from './geometry';
import { getBannerMetadata } from './metadata';
import { bannerAlternates, bannerPaths } from './routes';

describe('banner search pages and ordinary-language controls', () => {
    it.each(['en', 'de', 'fr', 'ja'] as const)('%s has complete pattern/dye labels and concise task-specific metadata', locale => {
        const copy = bannerCopy[locale];
        expect(Object.keys(copy).sort()).toEqual(Object.keys(bannerCopy.en).sort());
        expect(Object.keys(copy.patterns).sort()).toEqual([...PATTERN_IDS].sort());
        expect(Object.keys(copy.colours).sort()).toEqual([...DYE_IDS].sort());
        for (const [key, label] of [...Object.entries(copy.patterns), ...Object.entries(copy.colours)]) {
            expect(label.trim().length).toBeGreaterThan(0); expect(label).not.toBe(key); expect(label).not.toContain('_');
        }
        for (const mode of ['designer', 'letters'] as const) {
            const page = copy.pages[mode], meta = getBannerMetadata(mode, locale);
            expect(page.description.length).toBeLessThanOrEqual(160); expect(page.description.length).toBeGreaterThan(25);
            expect(page.steps).toHaveLength(3); expect(meta.keywords).toBeUndefined();
            expect(meta.alternates?.canonical).toBe(bannerPaths[mode][locale]);
            expect(meta.alternates?.languages).toEqual(bannerAlternates(mode));
        }
        expect(bannerPaths.designer[locale]).not.toBe(bannerPaths.letters[locale]);
        expect(copy.textHint).toContain('32'); expect(copy.textHint).toContain('64');
        expect(copy.textHint).toContain({ en: '0 has a dot', de: '0 hat einen Punkt', fr: '0 contient un point', ja: '0には点' }[locale]);
        expect(copy.textHint).toContain('O');
        expect(copy.twoPanels).toContain('1/2'); expect(copy.twoPanels).toContain('2/2');
        expect(copy.historyHint.length).toBeGreaterThan(20);
        expect(`${copy.textHint} ${copy.twoPanels}`).not.toMatch(/\bV\b|Vの|Vには|V-Banner/);
    });
});

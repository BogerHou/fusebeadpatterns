import { describe, expect, it } from 'vitest';
import { patterns } from './catalog';
import { getLocalizedPatternPdf } from './localized-download';
import { localizedLibraryMetadata, patternLibraryCount } from './library-overview';

describe('complete pattern library identity', () => {
    it('describes the complete real catalog instead of the former PDF selections', () => {
        expect(patternLibraryCount).toBe(patterns.length);
        expect(patternLibraryCount).toBeGreaterThan(12);
        for (const locale of ['de', 'ja'] as const) {
            expect(localizedLibraryMetadata[locale].description).toContain('106');
            expect(patternLibraryCount).toBeGreaterThanOrEqual(106);
            expect(patterns.every(pattern => getLocalizedPatternPdf(pattern, locale).language === locale)).toBe(true);
        }
        expect(localizedLibraryMetadata.de.title).not.toContain(': Pokémon');
        expect(localizedLibraryMetadata.de.description).not.toContain('8 Pokémon');
        expect(localizedLibraryMetadata.ja.description).not.toContain('12点');
    });
});

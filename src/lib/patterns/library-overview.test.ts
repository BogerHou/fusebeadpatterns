import { describe, expect, it } from 'vitest';
import { patterns } from './catalog';
import { getLocalizedPatternPdf } from './localized-download';
import { browsePatterns, localizedLibraryMetadata, patternLibraryCount } from './library-overview';

describe('complete pattern library identity', () => {
    it('offers the same complete ordered catalog to all language versions', () => {
        expect(browsePatterns.slice(0, 4).map(pattern => pattern.id)).toEqual([
            'pokemon-pikachu-gen5', 'sdv-blue-chicken', 'minecraft-diamond-sword-1-21-1', 'smb-super-mushroom',
        ]);
        expect(browsePatterns).toHaveLength(patterns.length);
        expect(new Set(browsePatterns.map(pattern => pattern.id)).size).toBe(patterns.length);
        expect([...browsePatterns].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...patterns].sort((a, b) => a.id.localeCompare(b.id)));
    });
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

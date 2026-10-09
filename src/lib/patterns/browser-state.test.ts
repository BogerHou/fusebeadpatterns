import { describe, expect, it } from 'vitest';
import { readPatternFilters, writePatternFilters } from './browser-state';
import { getPatternSearchAliases, getLocalizedSubjectName } from './localized-content';
import { patterns } from './catalog';
import { getLocaleDestination } from '../i18n/routes';

describe('pattern filters across languages and history', () => {
    it('round-trips Unicode names, spaces and collection identity while preserving other URL data', () => {
        const path = writePatternFilters('https://fusebeadpatterns.art/fr/patterns?from=bookmark#all-patterns', { query: 'Évoli ピカチュウ & Kirby', theme: 'pokemon' });
        const url = new URL(path, 'https://fusebeadpatterns.art');
        expect(url.searchParams.get('from')).toBe('bookmark');
        expect(url.hash).toBe('#all-patterns');
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
            const destination = getLocaleDestination('/fr/patterns', locale, url);
            const target = new URL(destination.href, url.origin);
            expect(readPatternFilters(target.search, ['pokemon'])).toEqual({ query: 'Évoli ピカチュウ & Kirby', theme: 'pokemon' });
        }
    });
    it('keeps the local subject name searchable after switching to English or another locale', () => {
        for (const pattern of patterns) {
            const aliases = getPatternSearchAliases(pattern);
            for (const locale of ['de', 'fr', 'ja'] as const) expect(aliases).toContain(getLocalizedSubjectName(pattern, locale));
        }
    });
    it('clears just the two filter fields and accepts only existing themes', () => {
        expect(readPatternFilters('?q=hello&theme=missing', ['pokemon'])).toEqual({ query: 'hello', theme: 'all' });
        expect(readPatternFilters('?theme=originals', [])).toEqual({ query: '', theme: 'originals' });
        expect(writePatternFilters('https://fusebeadpatterns.art/ja/patterns?q=abc&theme=pokemon&from=bookmark#all-patterns', { query: '', theme: 'all' })).toBe('/ja/patterns?from=bookmark#all-patterns');
    });
});

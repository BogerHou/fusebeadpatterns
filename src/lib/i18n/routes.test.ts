import { describe, expect, it } from 'vitest';
import { SITE_LOCALES, isSiteLocale } from './locales';
import { getLocaleDestination, getLocaleFromPath, localeRoutes, localizedRouteGroups } from './routes';

describe('site language routes', () => {
    it('round-trips only registered equivalent pages and retains their query and fragment', () => {
        for (const group of localizedRouteGroups) {
            for (const source of Object.values(group)) {
                for (const locale of SITE_LOCALES) {
                    const destination = getLocaleDestination(source, locale, { search: '?pattern=original-friendly-ghost-hama&view=colors', hash: '#preview' });
                    expect(destination).toEqual(group[locale]
                        ? { href: `${group[locale]}?pattern=original-friendly-ghost-hama&view=colors#preview`, isFallback: false }
                        : { href: localeRoutes[locale].home, isFallback: true });
                }
            }
        }
    });

    it('keeps curated download selections separate from full libraries', () => {
        expect(getLocaleDestination('/fr/modeles-perles-a-repasser', 'de')).toEqual({ href: '/de/patterns', isFallback: true, fallback: 'patterns' });
        expect(getLocaleDestination('/fr/modeles-perles-a-repasser', 'fr', { hash: '#downloads' })).toEqual({ href: '/fr/modeles-perles-a-repasser#downloads', isFallback: false });
        for (const locale of ['en', 'de', 'ja'] as const) {
            expect(getLocaleDestination('/fr/modeles-perles-a-repasser', locale, { search: '?brand=hama', hash: '#downloads' }))
                .toEqual({ href: localeRoutes[locale].patterns, isFallback: true, fallback: 'patterns' });
        }
        expect(localizedRouteGroups.some(group => Object.values(group).includes('/fr/modeles-perles-a-repasser'))).toBe(false);
        expect(getLocaleDestination('/fr/modeles-perles-a-repasser-noel', 'ja')).toEqual({ href: '/ja/patterns/christmas', isFallback: false });
    });

    it('switches loom pattern libraries to the same design in each language', () => {
        for (const source of SITE_LOCALES) {
            for (const destination of SITE_LOCALES) {
                expect(getLocaleDestination(localeRoutes[source].beadLoomPatterns, destination, { hash: '#heart-band' })).toEqual({
                    href: `${localeRoutes[destination].beadLoomPatterns}#heart-band`,
                    isFallback: false,
                });
            }
        }
    });

    it('keeps untranslated pages in the current language and labels other targets as a home fallback', () => {
        expect(getLocaleDestination('/patterns/pokemon/pikachu', 'en', { search: '?from=search' })).toEqual({ href: '/patterns/pokemon/pikachu?from=search', isFallback: false });
        expect(getLocaleDestination('/guides/mini-perler-beads', 'ja', { search: '?from=search' })).toEqual({ href: '/ja/guides/mini-perler-beads?from=search', isFallback: false });
        expect(getLocaleDestination('/ja/guides/photo-to-perler-bead-pattern', 'en')).toEqual({ href: '/guides/photo-to-perler-bead-pattern', isFallback: false });
        expect(getLocaleDestination('/fr/image-en-pixel-art', 'de')).toEqual({ href: '/de/pixel-art-generator', isFallback: false });
    });

    it('normalizes trailing slashes and rejects nonlocal paths', () => {
        expect(getLocaleDestination('/fr/editor/', 'de', { search: 'pattern=original-friendly-ghost-hama', hash: 'preview' })).toEqual({ href: '/de/editor?pattern=original-friendly-ghost-hama#preview', isFallback: false });
        for (const pathname of ['https://other.example/editor', '//other.example/editor', '/\\other.example/editor']) {
            expect(getLocaleDestination(pathname, 'en')).toEqual({ href: '/', isFallback: true });
        }
        expect(getLocaleFromPath('/fr/editor')).toBe('fr');
        expect(getLocaleFromPath('/france')).toBe('en');
        expect(isSiteLocale('constructor')).toBe(false);
    });
});

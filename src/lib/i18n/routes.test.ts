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

    it('switches to the equivalent printing section and back across all four languages', () => {
        const pageGroups = [
            {
                en: ['/patterns', 'printing'], de: ['/de/patterns', 'drucken'],
                fr: ['/fr/patterns', 'printing'], ja: ['/ja/patterns', 'printing'],
            },
            {
                en: ['/patterns/christmas', 'printing'], de: ['/de/patterns/christmas', 'printing'],
                fr: ['/fr/modeles-perles-a-repasser-noel', 'imprimer'], ja: ['/ja/patterns/christmas', 'printing'],
            },
        ] as const;
        const search = '?theme=christmas&query=green%20tree';
        for (const pages of pageGroups) {
            for (const source of SITE_LOCALES) {
                for (const target of SITE_LOCALES) {
                    const [sourcePath, sourceFragment] = pages[source];
                    const [targetPath, targetFragment] = pages[target];
                    expect(getLocaleDestination(sourcePath, target, { search, hash: `#${sourceFragment}` }))
                        .toEqual({ href: `${targetPath}${search}#${targetFragment}`, isFallback: false });
                    expect(getLocaleDestination(targetPath, source, { search, hash: targetFragment }))
                        .toEqual({ href: `${sourcePath}${search}#${sourceFragment}`, isFallback: false });
                }
            }
        }
    });

    it('maps encoded known fragments without rewriting same-language bookmarks', () => {
        expect(getLocaleDestination('/de/patterns/', 'ja', { search: 'query=a%26b', hash: '#%64rucken' }))
            .toEqual({ href: '/ja/patterns?query=a%26b#printing', isFallback: false });
        expect(getLocaleDestination('/de/patterns', 'de', { hash: '#%64rucken' }))
            .toEqual({ href: '/de/patterns#%64rucken', isFallback: false });
        expect(getLocaleDestination('/fr/modeles-perles-a-repasser-noel', 'de', { hash: '%69mprimer' }))
            .toEqual({ href: '/de/patterns/christmas#printing', isFallback: false });
    });

    it('retains unknown and malformed fragments instead of guessing an equivalent section', () => {
        for (const hash of ['#all-patterns', '#preview', '#drucken-extra', '#%E0%A4%A', '#%', '#%23drucken', '##drucken']) {
            expect(getLocaleDestination('/de/patterns', 'ja', { search: '?theme=minecraft', hash }))
                .toEqual({ href: `/ja/patterns?theme=minecraft${hash}`, isFallback: false });
        }
        // These IDs belong to a different page or language; they are not a
        // printing section on the current page.
        expect(getLocaleDestination('/de/patterns/christmas', 'fr', { hash: '#drucken' }))
            .toEqual({ href: '/fr/modeles-perles-a-repasser-noel#drucken', isFallback: false });
        expect(getLocaleDestination('/patterns', 'de', { hash: '#imprimer' }))
            .toEqual({ href: '/de/patterns#imprimer', isFallback: false });
        expect(getLocaleDestination('/de/patterns', 'ja'))
            .toEqual({ href: '/ja/patterns', isFallback: false });
    });

    it('does not reinterpret printing-like fragments on tools, details or fallback pages', () => {
        const equivalentPaths = [
            ['/de/editor', '/ja/editor'],
            ['/de/pixel-art-generator', '/ja/pixel-art-converter'],
            ['/de/perlenwebmuster-generator', '/ja/bead-loom-pattern-maker'],
            ['/de/patterns/minecraft/diamond-sword', '/ja/patterns/minecraft/diamond-sword'],
        ];
        for (const [source, target] of equivalentPaths) {
            expect(getLocaleDestination(source, 'ja', { search: '?pattern=original-friendly-ghost-hama&view=colors', hash: '#drucken' }))
                .toEqual({ href: `${target}?pattern=original-friendly-ghost-hama&view=colors#drucken`, isFallback: false });
        }
        expect(getLocaleDestination('/fr/modeles-perles-a-repasser', 'ja', { search: '?brand=hama', hash: '#imprimer' }))
            .toEqual({ href: '/ja/patterns', isFallback: true, fallback: 'patterns' });
        expect(getLocaleDestination('/de/untranslated', 'ja', { search: '?keep=1', hash: '#drucken' }))
            .toEqual({ href: '/ja', isFallback: true });
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

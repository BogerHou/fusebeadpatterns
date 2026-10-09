import { hamaMakerPaths } from '../hama-maker/routes';
import { guideRouteGroups, guideIndexHref } from '../guides/routes';
import { patternSectionRouteGroups } from '../patterns/section-routes';
import { sitePageHref, sitePageRouteGroups } from '../site-pages/routes';
import patternSlugs from '../patterns/route-slugs.json';
import { loomPatternLibraryPaths } from '../bead-loom/patterns';
import { isSiteLocale, type SiteLocale } from './locales';

const siteInfoRoutes = (locale: SiteLocale) => ({
    about: sitePageHref('about', locale),
    privacy: sitePageHref('privacy-policy', locale),
    terms: sitePageHref('terms-of-service', locale),
});
export const localeRoutes: Record<SiteLocale, { home: string; hamaMaker: string; patterns: string; hamaPatterns: string; editor: string; guides: string; pixelGrid?: string; beadLoom: string; beadLoomPatterns: string; about: string; privacy: string; terms: string }> = {
    en: { ...siteInfoRoutes('en'), guides: guideIndexHref('en'), home: '/', hamaMaker: hamaMakerPaths.en, patterns: '/patterns', hamaPatterns: '/patterns/hama', editor: '/editor', pixelGrid: '/pixel-art-grid', beadLoom: '/bead-loom-pattern-maker', beadLoomPatterns: loomPatternLibraryPaths.en },
    de: { ...siteInfoRoutes('de'), guides: guideIndexHref('de'), home: '/de', hamaMaker: hamaMakerPaths.de, patterns: '/de/patterns', hamaPatterns: '/de/hama-perlen-vorlagen', editor: '/de/editor', pixelGrid: '/de/pixel-art-generator', beadLoom: '/de/perlenwebmuster-generator', beadLoomPatterns: loomPatternLibraryPaths.de },
    fr: { ...siteInfoRoutes('fr'), guides: guideIndexHref('fr'), home: '/fr', hamaMaker: hamaMakerPaths.fr, patterns: '/fr/patterns', hamaPatterns: '/fr/patterns/hama', editor: '/fr/editor', pixelGrid: '/fr/image-en-pixel-art', beadLoom: '/fr/generateur-motif-metier-a-perles', beadLoomPatterns: loomPatternLibraryPaths.fr },
    ja: { ...siteInfoRoutes('ja'), guides: guideIndexHref('ja'), home: '/ja', hamaMaker: hamaMakerPaths.ja, patterns: '/ja/patterns', hamaPatterns: '/ja/patterns/hama', editor: '/ja/editor', pixelGrid: '/ja/pixel-art-converter', beadLoom: '/ja/bead-loom-pattern-maker', beadLoomPatterns: loomPatternLibraryPaths.ja },
};

// These groups share the same purpose and content. Selected pattern collections
// and translated guides with different coverage are intentionally not equivalents.
export const localizedRouteGroups: ReadonlyArray<Partial<Record<SiteLocale, string>>> = [
    { en: '/', de: '/de', fr: '/fr', ja: '/ja' },
    hamaMakerPaths,
    { en: '/patterns', de: '/de/patterns', fr: '/fr/patterns', ja: '/ja/patterns' },
    ...patternSlugs.map(slug => ({ en: `/patterns/${slug}`, de: `/de/patterns/${slug}`, fr: `/fr/patterns/${slug}`, ja: `/ja/patterns/${slug}` })),
    ...patternSectionRouteGroups,
    ...guideRouteGroups,
    ...sitePageRouteGroups,
    { en: '/editor', de: '/de/editor', fr: '/fr/editor', ja: '/ja/editor' },
    { en: '/pixel-art-grid', de: '/de/pixel-art-generator', fr: '/fr/image-en-pixel-art', ja: '/ja/pixel-art-converter' },
    { en: '/bead-loom-pattern-maker', de: '/de/perlenwebmuster-generator', fr: '/fr/generateur-motif-metier-a-perles', ja: '/ja/bead-loom-pattern-maker' },
    loomPatternLibraryPaths,
    { en: '/patterns/hama', de: '/de/hama-perlen-vorlagen', fr: '/fr/patterns/hama', ja: '/ja/patterns/hama' },
];

export function getLocaleFromPath(pathname: string): SiteLocale {
    const segment = pathname.split('/')[1];
    return isSiteLocale(segment) ? segment : 'en';
}

export type LocaleDestination = { href: string; isFallback: boolean; fallback?: 'patterns' };

export function getLocaleDestination(
    pathname: string,
    locale: SiteLocale,
    { search = '', hash = '' }: { search?: string; hash?: string } = {},
): LocaleDestination {
    if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('\\')) {
        return { href: localeRoutes[locale].home, isFallback: true };
    }
    const currentPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const group = localizedRouteGroups.find(routes => Object.values(routes).includes(currentPath));
    const destination = group?.[locale] ?? (getLocaleFromPath(currentPath) === locale ? currentPath : undefined);

    if (!destination) {
        // A selected download page is not a translation of the full library.
        // Give visitors a relevant, explicitly labelled next step instead.
        if (currentPath === '/fr/modeles-perles-a-repasser') {
            return { href: localeRoutes[locale].patterns, isFallback: true, fallback: 'patterns' };
        }
        return { href: localeRoutes[locale].home, isFallback: true };
    }
    const query = search ? (search.startsWith('?') ? search : `?${search}`) : '';
    const fragment = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
    return { href: `${destination}${query}${fragment}`, isFallback: false };
}

export const LOCALE_NAVIGATION_EVENT = 'fusebead:locale-navigation';
export type LocaleNavigationDetail = { href: string; locale: SiteLocale };

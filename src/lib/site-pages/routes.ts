import { SITE_LOCALES, type SiteLocale } from '../i18n/locales';

export const sitePageSlugs = ['about', 'privacy-policy', 'terms-of-service'] as const;
export type SitePageSlug = typeof sitePageSlugs[number];

export function sitePageHref(slug: SitePageSlug, locale: SiteLocale): string {
    return `${locale === 'en' ? '' : `/${locale}`}/${slug}`;
}

export const sitePageRouteGroups = sitePageSlugs.map(slug => ({
    en: sitePageHref(slug, 'en'), de: sitePageHref(slug, 'de'),
    fr: sitePageHref(slug, 'fr'), ja: sitePageHref(slug, 'ja'),
}));

export function sitePageLanguageAlternates(slug: SitePageSlug): Record<string, string> {
    return Object.fromEntries([
        ...SITE_LOCALES.map(locale => [locale, `https://fusebeadpatterns.art${sitePageHref(slug, locale)}`]),
        ['x-default', `https://fusebeadpatterns.art${sitePageHref(slug, 'en')}`],
    ]);
}

import type { SiteLocale } from '../i18n/locales';

// Lightweight route identities: shared by the language switcher, metadata and sitemap.
export const patternSectionSlugs = ['stardew-valley', 'pokemon', 'minecraft', 'super-mario', 'kirby', 'easy', 'cute', 'halloween', 'christmas'] as const;
export type PatternSectionSlug = typeof patternSectionSlugs[number];

export function getPatternSectionHref(slug: string, locale: SiteLocale): string {
    if (locale === 'fr' && slug === 'christmas') return '/fr/modeles-perles-a-repasser-noel';
    return `${locale === 'en' ? '' : `/${locale}`}/patterns/${slug}`;
}

export const patternSectionRouteGroups = patternSectionSlugs.map(slug => ({
    en: getPatternSectionHref(slug, 'en'), de: getPatternSectionHref(slug, 'de'),
    fr: getPatternSectionHref(slug, 'fr'), ja: getPatternSectionHref(slug, 'ja'),
}));

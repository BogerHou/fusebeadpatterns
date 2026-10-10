import type { SiteLocale } from '../i18n/locales';

export const translatedGuideSlugs = [
    'photo-to-perler-bead-pattern',
    'perler-bead-pegboards', 'perler-to-hama-artkal', 'perler-vs-hama-vs-artkal',
    'mini-perler-beads', 'perler-bead-kits-and-storage', 'how-to-iron-perler-beads',
    'how-to-make-perler-bead-keychains',
] as const;
export type TranslatedGuideSlug = typeof translatedGuideSlugs[number];
export function isTranslatedGuideSlug(slug: string): slug is TranslatedGuideSlug {
    return (translatedGuideSlugs as readonly string[]).includes(slug);
}
export function guideIndexHref(locale: SiteLocale) {
    return locale === 'en' ? '/guides' : `/${locale}/guides`;
}
export function guideHref(slug: string, locale: SiteLocale) {
    const available = isTranslatedGuideSlug(slug);
    return `${locale !== 'en' && available ? `/${locale}` : ''}/guides/${slug}`;
}
export const guideRouteGroups = [undefined, ...translatedGuideSlugs].map(slug => Object.fromEntries(
    (['en', 'de', 'fr', 'ja'] as const).map(locale => [locale, slug ? guideHref(slug, locale) : guideIndexHref(locale)]),
) as Record<SiteLocale, string>);
export function guideLanguageAlternates(slug?: TranslatedGuideSlug) {
    const languages = Object.fromEntries((['en', 'de', 'fr', 'ja'] as const).map(locale => [locale, `https://fusebeadpatterns.art${slug ? guideHref(slug, locale) : guideIndexHref(locale)}`]));
    return { ...languages, 'x-default': languages.en } as Record<SiteLocale | 'x-default', string>;
}

import type { SiteLocale } from '../i18n/locales';

const siteUrl = 'https://fusebeadpatterns.art';

export const hamaMakerPaths: Record<SiteLocale, string> = {
    en: '/hama-bead-pattern-maker',
    de: '/de/hama-bead-pattern-maker',
    fr: '/fr/hama-bead-pattern-maker',
    ja: '/ja/hama-bead-pattern-maker',
};

export const hamaMakerLanguageAlternates: Record<SiteLocale | 'x-default', string> = {
    en: `${siteUrl}${hamaMakerPaths.en}`,
    de: `${siteUrl}${hamaMakerPaths.de}`,
    fr: `${siteUrl}${hamaMakerPaths.fr}`,
    ja: `${siteUrl}${hamaMakerPaths.ja}`,
    'x-default': `${siteUrl}${hamaMakerPaths.en}`,
};

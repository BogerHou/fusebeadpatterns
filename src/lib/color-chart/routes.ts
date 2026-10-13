import type { SiteLocale } from '../i18n/locales';

export const perlerColorChartPaths: Record<SiteLocale, string> = {
    en: '/perler-bead-color-chart',
    de: '/de/perler-farbkarte',
    fr: '/fr/nuancier-perles-perler',
    ja: '/ja/perler-color-chart',
};

export const perlerColorChartLabels: Record<SiteLocale, string> = {
    en: 'Perler Color Chart',
    de: 'Perler-Farbkarte',
    fr: 'Nuancier Perler',
    ja: 'Perlerカラーチャート',
};

export const perlerColorChartAlternates = {
    ...Object.fromEntries(Object.entries(perlerColorChartPaths).map(([locale, path]) => [locale, `https://fusebeadpatterns.art${path}`])),
    'x-default': `https://fusebeadpatterns.art${perlerColorChartPaths.en}`,
};

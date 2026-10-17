import type { SiteLocale } from '../i18n/locales';

export const brickPaths: Record<SiteLocale, string> = {
    en: '/brick-mosaic-maker',
    de: '/de/mosaik-generator',
    fr: '/fr/mosaique-briques',
    ja: '/ja/brick-mosaic-maker',
};

export const brickLabels: Record<SiteLocale, string> = {
    en: 'Brick Mosaic Maker',
    de: 'Mosaik-Generator',
    fr: 'Mosaïque de briques',
    ja: 'ブロックモザイクメーカー',
};

export const brickAlternates = {
    ...Object.fromEntries(Object.entries(brickPaths).map(([locale, path]) => [locale, `https://fusebeadpatterns.art${path}`])),
    'x-default': `https://fusebeadpatterns.art${brickPaths.en}`,
};

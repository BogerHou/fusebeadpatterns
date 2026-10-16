import type { SiteLocale } from '../i18n/locales';

export const beadLetterPaths: Record<SiteLocale, string> = {
    en: '/bead-letter-generator',
    de: '/de/buegelperlen-buchstaben',
    fr: '/fr/lettres-perles-a-repasser',
    ja: '/ja/iron-beads-alphabet',
};

export const beadLetterLabels: Record<SiteLocale, string> = {
    en: 'Bead Letters',
    de: 'Bügelperlen-Buchstaben',
    fr: 'Lettres en perles',
    ja: 'ビーズのアルファベット',
};

export const beadLetterAlternates = {
    ...Object.fromEntries(Object.entries(beadLetterPaths).map(([locale, path]) => [locale, `https://fusebeadpatterns.art${path}`])),
    'x-default': `https://fusebeadpatterns.art${beadLetterPaths.en}`,
};

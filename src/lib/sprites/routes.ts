import type { SiteLocale } from '../i18n/locales';

export const spritePaths: Record<SiteLocale, string> = {
    en: '/sprite-maker',
    de: '/de/sprite-editor',
    fr: '/fr/createur-sprites',
    ja: '/ja/sprite-maker',
};
export const spriteLabels: Record<SiteLocale, string> = {
    en: 'Sprite Animation Maker',
    de: 'Sprite-Editor',
    fr: 'Créateur de sprites',
    ja: 'スプライトアニメーション',
};
export const spriteAlternates = {
    ...Object.fromEntries(Object.entries(spritePaths).map(([locale, path]) => [locale, `https://fusebeadpatterns.art${path}`])),
    'x-default': `https://fusebeadpatterns.art${spritePaths.en}`,
};

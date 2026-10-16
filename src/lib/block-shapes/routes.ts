import type { SiteLocale } from '../i18n/locales';

export const blockShapePaths: Record<SiteLocale, string> = {
    en: '/minecraft-circle-generator',
    de: '/de/minecraft-kreis-generator',
    fr: '/fr/generateur-cercle-minecraft',
    ja: '/ja/minecraft-circle-generator',
};

export const blockShapeLabels: Record<SiteLocale, string> = {
    en: 'Minecraft Circle Generator',
    de: 'Minecraft-Kreis-Generator',
    fr: 'Cercle Minecraft',
    ja: 'マイクラの円生成',
};

export const blockShapeAlternates = {
    ...Object.fromEntries(Object.entries(blockShapePaths).map(([locale, path]) => [locale, `https://fusebeadpatterns.art${path}`])),
    'x-default': `https://fusebeadpatterns.art${blockShapePaths.en}`,
};

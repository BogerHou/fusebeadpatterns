import type { SiteLocale } from '../i18n/locales';

export type BannerMode = 'designer' | 'letters';
export const bannerPaths: Record<BannerMode, Record<SiteLocale, string>> = {
    designer: { en: '/minecraft-banner-maker', de: '/de/minecraft-banner-erstellen', fr: '/fr/createur-banniere-minecraft', ja: '/ja/minecraft-banner-maker' },
    letters: { en: '/minecraft-banner-letters', de: '/de/minecraft-banner-buchstaben', fr: '/fr/lettres-banniere-minecraft', ja: '/ja/minecraft-banner-letters' },
};
export const bannerLabels: Record<BannerMode, Record<SiteLocale, string>> = {
    designer: { en: 'Banner Maker for Minecraft', de: 'Banner für Minecraft erstellen', fr: 'Créateur de bannières pour Minecraft', ja: 'マイクラの旗を作る' },
    letters: { en: 'Banner Letters for Minecraft', de: 'Banner-Buchstaben für Minecraft', fr: 'Lettres sur bannières pour Minecraft', ja: 'マイクラの旗で文字を作る' },
};
export function bannerAlternates(mode: BannerMode): Record<string, string> {
    return {
        ...Object.fromEntries(Object.entries(bannerPaths[mode]).map(([locale, path]) => [locale, `https://fusebeadpatterns.art${path}`])),
        'x-default': `https://fusebeadpatterns.art${bannerPaths[mode].en}`,
    };
}

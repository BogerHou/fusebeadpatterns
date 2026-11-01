import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { bannerCopy } from './copy';
import { bannerAlternates, bannerPaths, type BannerMode } from './routes';

const openGraphLocales: Record<SiteLocale, string> = {
    en: 'en_US',
    de: 'de_DE',
    fr: 'fr_FR',
    ja: 'ja_JP',
};

export function getBannerMetadata(mode: BannerMode, locale: SiteLocale): Metadata {
    const { title, description } = bannerCopy[locale].pages[mode];
    return {
        title, description,
        alternates: { canonical: bannerPaths[mode][locale], languages: bannerAlternates(mode) },
        openGraph: {
            title,
            description,
            url: `https://fusebeadpatterns.art${bannerPaths[mode][locale]}`,
            siteName: 'Fuse Bead Patterns',
            locale: openGraphLocales[locale],
            type: 'website',
            images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: title }],
        },
        twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image.png'] },
    };
}

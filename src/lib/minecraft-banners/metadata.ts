import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { bannerCopy } from './copy';
import { bannerAlternates, bannerPaths, type BannerMode } from './routes';

export function getBannerMetadata(mode: BannerMode, locale: SiteLocale): Metadata {
    const { title, description } = bannerCopy[locale].pages[mode];
    return {
        title, description,
        alternates: { canonical: bannerPaths[mode][locale], languages: bannerAlternates(mode) },
        openGraph: { title, description, url: `https://fusebeadpatterns.art${bannerPaths[mode][locale]}`, siteName: 'Fuse Bead Patterns', type: 'website', images: [] },
        twitter: { card: 'summary', title, description, images: [] },
    };
}

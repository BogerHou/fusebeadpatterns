import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { blockShapeCopy } from './copy';
import { blockShapeAlternates, blockShapePaths } from './routes';

const openGraphLocales: Record<SiteLocale, string> = {
    en: 'en_US',
    de: 'de_DE',
    fr: 'fr_FR',
    ja: 'ja_JP',
};

export function blockShapeMetadata(locale: SiteLocale): Metadata {
    const { title, description } = blockShapeCopy[locale];
    return {
        title,
        description,
        alternates: { canonical: blockShapePaths[locale], languages: blockShapeAlternates },
        openGraph: {
            title, description,
            url: `https://fusebeadpatterns.art${blockShapePaths[locale]}`,
            siteName: 'Fuse Bead Patterns',
            locale: openGraphLocales[locale],
            type: 'website',
            images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: title }],
        },
        twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image.png'] },
    };
}

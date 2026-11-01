import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { qrBeadCopy } from './copy';
import { qrBeadAlternates, qrBeadPaths } from './routes';

const openGraphLocales: Record<SiteLocale, string> = {
    en: 'en_US',
    de: 'de_DE',
    fr: 'fr_FR',
    ja: 'ja_JP',
};

export function qrBeadMetadata(locale: SiteLocale): Metadata {
    const { title, description } = qrBeadCopy[locale];
    return {
        title, description,
        alternates: { canonical: qrBeadPaths[locale], languages: qrBeadAlternates },
        openGraph: {
            title, description, url: `https://fusebeadpatterns.art${qrBeadPaths[locale]}`,
            siteName: 'Fuse Bead Patterns',
            locale: openGraphLocales[locale],
            type: 'website',
            images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: title }],
        },
        twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image.png'] },
    };
}

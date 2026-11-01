import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { beadLetterCopy } from './copy';
import { beadLetterAlternates, beadLetterPaths } from './routes';

const openGraphLocales: Record<SiteLocale, string> = {
    en: 'en_US',
    de: 'de_DE',
    fr: 'fr_FR',
    ja: 'ja_JP',
};

export function beadLetterMetadata(locale: SiteLocale): Metadata {
    const { title, description } = beadLetterCopy[locale];
    return {
        title,
        description,
        alternates: { canonical: beadLetterPaths[locale], languages: beadLetterAlternates },
        openGraph: {
            title, description,
            url: `https://fusebeadpatterns.art${beadLetterPaths[locale]}`,
            siteName: 'Fuse Bead Patterns',
            locale: openGraphLocales[locale],
            type: 'website',
            images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: title }],
        },
        twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image.png'] },
    };
}

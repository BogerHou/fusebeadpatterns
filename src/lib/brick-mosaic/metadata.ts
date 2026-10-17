import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { brickCopy } from './copy';
import { brickAlternates, brickPaths } from './routes';

export function brickMetadata(locale: SiteLocale): Metadata {
    const { title, description } = brickCopy[locale];
    return {
        title,
        description,
        alternates: { canonical: brickPaths[locale], languages: brickAlternates },
        openGraph: {
            title,
            description,
            url: `https://fusebeadpatterns.art${brickPaths[locale]}`,
            siteName: 'Fuse Bead Patterns',
            type: 'website',
            images: [],
        },
        twitter: { card: 'summary', title, description, images: [] },
    };
}

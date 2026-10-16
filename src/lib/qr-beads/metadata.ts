import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { qrBeadCopy } from './copy';
import { qrBeadAlternates, qrBeadPaths } from './routes';

export function qrBeadMetadata(locale: SiteLocale): Metadata {
    const { title, description } = qrBeadCopy[locale];
    return {
        title, description,
        alternates: { canonical: qrBeadPaths[locale], languages: qrBeadAlternates },
        openGraph: {
            title, description, url: `https://fusebeadpatterns.art${qrBeadPaths[locale]}`,
            siteName: 'Fuse Bead Patterns', type: 'website', images: [],
        },
        twitter: { card: 'summary', title, description, images: [] },
    };
}

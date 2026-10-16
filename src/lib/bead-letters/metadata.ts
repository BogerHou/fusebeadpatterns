import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { beadLetterCopy } from './copy';
import { beadLetterAlternates, beadLetterPaths } from './routes';

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
            type: 'website',
            images: [],
        },
        twitter: { card: 'summary', title, description, images: [] },
    };
}

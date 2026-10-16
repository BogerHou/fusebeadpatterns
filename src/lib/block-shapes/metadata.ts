import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { blockShapeCopy } from './copy';
import { blockShapeAlternates, blockShapePaths } from './routes';

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
            type: 'website',
            images: [],
        },
        twitter: { card: 'summary', title, description, images: [] },
    };
}

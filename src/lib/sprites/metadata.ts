import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { spriteCopy } from './copy';
import { spriteAlternates, spritePaths } from './routes';

export function spriteMetadata(locale: SiteLocale): Metadata {
    const { title, description } = spriteCopy[locale];
    return {
        title, description,
        alternates: { canonical: spritePaths[locale], languages: spriteAlternates },
        openGraph: {
            title, description, url: `https://fusebeadpatterns.art${spritePaths[locale]}`,
            siteName: 'Fuse Bead Patterns', type: 'website', images: [],
        },
        twitter: { card: 'summary', title, description, images: [] },
    };
}

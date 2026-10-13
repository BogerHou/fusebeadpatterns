import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { colorChartCopy } from './copy';
import { perlerColorChartAlternates, perlerColorChartPaths } from './routes';

export function perlerColorChartMetadata(locale: SiteLocale): Metadata {
    const { title, description } = colorChartCopy[locale];
    return {
        title,
        description,
        alternates: { canonical: perlerColorChartPaths[locale], languages: perlerColorChartAlternates },
        openGraph: {
            title, description,
            url: `https://fusebeadpatterns.art${perlerColorChartPaths[locale]}`,
            siteName: 'Fuse Bead Patterns',
            type: 'website',
            images: [],
        },
        twitter: { card: 'summary', title, description, images: [] },
    };
}

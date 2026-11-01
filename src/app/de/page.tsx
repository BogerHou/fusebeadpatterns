import type { Metadata } from 'next';
import LocalizedGeneratorPage from '@/components/layout/LocalizedGeneratorPage';
import { localizedHomeCopy } from '@/lib/i18n/home';
import { homeLanguageAlternates } from '@/lib/i18n/metadata';

const { title, metadataDescription: description } = localizedHomeCopy.de;
export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/de', languages: homeLanguageAlternates },
    openGraph: {
        title,
        description,
        url: 'https://fusebeadpatterns.art/de',
        siteName: 'Fuse Bead Patterns',
        locale: 'de_DE',
        type: 'website',
        images: [{ url: '/patterns/sdv-blue-chicken/preview.png', width: 580, height: 580, alt: title }],
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/patterns/sdv-blue-chicken/preview.png'],
    },
};
export default function GermanHome() { return <LocalizedGeneratorPage locale="de" />; }

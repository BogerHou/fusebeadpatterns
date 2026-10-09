import type { Metadata } from 'next';
import LocalizedGeneratorPage from '@/components/layout/LocalizedGeneratorPage';
import { localizedHomeCopy } from '@/lib/i18n/home';
import { homeLanguageAlternates } from '@/lib/i18n/metadata';

const { title, description } = localizedHomeCopy.de;
export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/de', languages: homeLanguageAlternates },
    openGraph: { title, description, url: 'https://fusebeadpatterns.art/de', locale: 'de_DE', type: 'website' },
};
export default function GermanHome() { return <LocalizedGeneratorPage locale="de" />; }

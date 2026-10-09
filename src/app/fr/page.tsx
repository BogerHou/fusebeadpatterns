import type { Metadata } from 'next';
import LocalizedGeneratorPage from '@/components/layout/LocalizedGeneratorPage';
import { localizedHomeCopy } from '@/lib/i18n/home';
import { homeLanguageAlternates } from '@/lib/i18n/metadata';

const { title, description } = localizedHomeCopy.fr;
export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/fr', languages: homeLanguageAlternates },
    openGraph: { title, description, url: 'https://fusebeadpatterns.art/fr', locale: 'fr_FR', type: 'website' },
};
export default function FrenchHome() { return <LocalizedGeneratorPage locale="fr" />; }

import type { Metadata } from 'next';
import Editor from '@/components/editor/Editor';
import AdSenseScript from '@/components/analytics/AdSenseScript';

export const metadata: Metadata = {
    title: 'Éditeur de modèles de perles | Fuse Bead Patterns',
    description: 'Retouchez votre modèle de perles à repasser : dessinez, remplissez, effacez et changez les couleurs avant de l’enregistrer.',
    alternates: { canonical: '/fr/editor' },
    robots: { index: false, follow: true },
};
export default function FrenchEditor() { return <><AdSenseScript /><Editor mode="editor" locale="fr" /></>; }

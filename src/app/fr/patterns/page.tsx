import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import LocalizedPatternCatalog from '@/components/patterns/LocalizedPatternCatalog';
import { patternLanguageAlternates } from '@/lib/i18n/metadata';
import PatternLibraryHelp from '@/components/patterns/PatternLibraryHelp';
import { patternLibraryCount } from '@/lib/patterns/library-overview';

const title = 'Modèles de perles à repasser gratuits | Fuse Bead Patterns';
const description = 'Retrouvez tous nos modèles de perles à repasser : Pokémon, Minecraft, Mario et motifs originaux. Grilles, couleurs et éditeur en français, sans inscription.';
export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/fr/patterns', languages: patternLanguageAlternates() },
    openGraph: { title, description, locale: 'fr_FR', type: 'website', url: 'https://fusebeadpatterns.art/fr/patterns', images: ['/patterns/pokemon-pikachu-gen5/preview.png'] },
};
export default function Page() {
    return <>
        <SiteHeader locale="fr" active="patterns" />
        <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
            <Breadcrumbs label="Fil d’Ariane" items={[{ label: 'Accueil', href: '/fr' }, { label: 'Modèles', href: '/fr/patterns' }]} />
            <h1 className="page-heading">Modèles de perles à repasser gratuits</h1>
            <p className="mt-4 max-w-3xl leading-7 text-muted">Choisissez parmi {patternLibraryCount} modèles gratuits. Recherchez un personnage ou filtrez par thème. Chaque image mène au PDF en français, aux couleurs et au même motif dans l’éditeur en français.</p>
            <LocalizedPatternCatalog locale="fr" />
            <PatternLibraryHelp locale="fr" />
            <p className="mt-10 max-w-3xl border-t border-line pt-6 text-sm leading-7 text-muted">Vous souhaitez des fichiers déjà préparés pour deux marques ? Retrouvez <Link href="/fr/modeles-perles-a-repasser" className="text-link">six modèles originaux à télécharger en Perler et Hama</Link>, ou les <Link href="/fr/modeles-perles-a-repasser-noel" className="text-link">modèles de Noël</Link>.</p>
        </main>
        <SiteFooter locale="fr" active="patterns" />
    </>;
}

import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import LocalizedPatternCatalog from '@/components/patterns/LocalizedPatternCatalog';
import { patternLanguageAlternates } from '@/lib/i18n/metadata';

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
            <p className="mt-4 max-w-3xl leading-7 text-muted">Choisissez une image, consultez les couleurs et ouvrez le même motif dans l’éditeur en français.</p>
            <p className="mt-3"><Link href="/fr/modeles-perles-a-repasser" className="text-link">Six modèles avec PDF en français : Perler et Hama</Link>{' · '}<Link href="/fr/modeles-perles-a-repasser-noel" className="text-link">Modèles de Noël</Link></p>
            <LocalizedPatternCatalog locale="fr" />
        </main>
        <SiteFooter locale="fr" active="patterns" />
    </>;
}

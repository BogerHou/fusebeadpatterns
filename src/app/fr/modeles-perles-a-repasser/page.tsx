import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import type { Metadata } from 'next';
import Link from 'next/link';
import FrenchPatternDownloads from '@/components/patterns/FrenchPatternDownloads';
import { frenchPatternChoices } from '@/lib/patterns/french-patterns';
import { patternLibraryCount } from '@/lib/patterns/library-overview';

const path = '/fr/modeles-perles-a-repasser';
const title = 'Perles à repasser : 6 modèles gratuits à imprimer';
const description = 'Six modèles originaux de perles à repasser gratuits : ballon, fantôme, chauve-souris et Noël. PDF A4 en français et projets à télécharger, au choix Perler ou Hama Midi.';
const preview = '/patterns/original-soccer-ball/preview.png';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
        title, description, locale: 'fr_FR', type: 'website',
        url: `https://fusebeadpatterns.art${path}`, siteName: 'Fuse Bead Patterns',
        images: [{ url: preview, width: 580, height: 580, alt: 'Ballon de football en perles à repasser Perler Midi' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [preview] },
};

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title, description, inLanguage: 'fr',
    url: `https://fusebeadpatterns.art${path}`,
    mainEntity: {
        '@type': 'ItemList', numberOfItems: 6,
        itemListElement: frenchPatternChoices.perler.map((pattern, index) => ({
            '@type': 'ListItem', position: index + 1, name: pattern.name,
            url: `https://fusebeadpatterns.art${path}#${pattern.id}`,
        })),
    },
};

export default function FrenchPatternsPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
            <SiteHeader locale="fr" active="patterns" />
            <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
                <nav aria-label="Fil d’Ariane" className="mb-6 text-xs font-medium text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2">
                        <li><Link href="/fr" className="inline-flex min-h-10 items-center hover:underline">Accueil</Link></li>
                        <li aria-hidden="true">/</li>
                        <li><Link href="/fr/patterns" className="inline-flex min-h-10 items-center hover:underline">Tous les modèles</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">Six modèles Perler et Hama</li>
                    </ol>
                </nav>
                <h1 className="page-heading leading-snug">Six modèles gratuits de perles à repasser : Perler et Hama</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted sm:text-lg">Choisissez parmi six motifs originaux : un ballon de football, un fantôme, une chauve-souris et trois créations de Noël. Téléchargez un PDF A4 en français ou un projet à modifier, sans compte.</p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">Cette sélection propose des fichiers Perler Midi et Hama Midi pour les mêmes motifs. Pour voir les personnages et tous les autres dessins, consultez la <Link href="/fr/patterns" className="text-link">collection complète de {patternLibraryCount} modèles</Link>.</p>
                <FrenchPatternDownloads patterns={frenchPatternChoices} />
                <section id="imprimer" aria-labelledby="print-heading" className="mt-14 max-w-3xl scroll-mt-6 border-t border-line pt-8">
                    <h2 id="print-heading" className="text-2xl font-semibold leading-relaxed">Imprimer le PDF à la bonne taille</h2>
                    <ol className="mt-5 list-decimal space-y-3 pl-6 leading-8 text-muted">
                        <li>Choisissez votre marque, puis téléchargez le PDF A4 du motif. Chaque fiche contient la grille à symboles et la liste des couleurs de cette marque.</li>
                        <li>Imprimez sur papier A4 à 100 % ou « Taille réelle ». Désactivez « Ajuster à la page ».</li>
                        <li>Mesurez le repère de 50 mm sur le papier et vérifiez l’espacement avec votre plaque. Les grilles de 29 × 29 cases sont prévues pour des perles Midi de 5 mm, pas pour des perles Mini ou Maxi.</li>
                        <li>Suivez les symboles et les références de la liste. Les cases vides restent sans perle ; une case blanche avec un symbole correspond à une perle blanche.</li>
                    </ol>
                    <p className="mt-5 text-sm leading-7 text-muted">Les couleurs à l’écran et sur papier sont approximatives. Ces motifs originaux n’ont pas été assemblés ni testés au fer. Suivez les consignes de votre marque de perles et vérifiez votre matériel avant de commencer.</p>
                </section>
                <section aria-labelledby="brand-heading" className="mt-10 max-w-3xl">
                    <h2 id="brand-heading" className="text-2xl font-semibold leading-relaxed">Perler Midi ou Hama Midi ?</h2>
                    <p className="mt-4 leading-8 text-muted">Les références de couleurs Perler et Hama sont différentes. Le choix de marque affiche les fichiers préparés avec la palette correspondante ; il ne garantit pas une équivalence exacte des teintes. Dans les projets Hama, le préfixe H identifie notre palette : H01 correspond au numéro Hama 01, par exemple.</p>
                    <p className="mt-4 leading-8 text-muted">« Enregistrer le projet » conserve le motif et sa palette pour les rouvrir dans l’éditeur. « Modifier » ouvre directement ce projet dans l’éditeur en français. Après vos retouches, exportez un nouveau PDF et vérifiez ses consignes d’impression.</p>
                    <p className="mt-4 leading-8 text-muted">Pour d’autres idées, consultez les <Link href="/fr/modeles-perles-a-repasser-noel" className="text-link">modèles de Noël</Link>, ou préparez une image avec le <Link href="/fr/image-en-pixel-art" className="text-link">convertisseur de pixel art en français</Link>. Ce dernier produit des pixels, sans références de couleurs de perles.</p>
                </section>
            </main>
            <SiteFooter locale="fr" active="patterns" />
        </>
    );
}

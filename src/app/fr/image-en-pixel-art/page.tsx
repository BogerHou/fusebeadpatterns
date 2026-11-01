import { pixelLanguageAlternates } from '@/lib/i18n/metadata';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import type { Metadata } from 'next';
import Link from 'next/link';
import PixelGridWorkspace from '@/components/pixel-grid/PixelGridWorkspace';
import PixelConversionExamples from '@/components/pixel-grid/PixelConversionExamples';
import PixelPracticeProvider from '@/components/pixel-grid/PixelPracticeProvider';

const title = 'Convertir une image en pixel art | Fuse Bead Patterns';
const description = 'Transformez une image en pixel art gratuitement dans votre navigateur. Choisissez la taille et les couleurs, retouchez les pixels et téléchargez un PNG.';
const pageUrl = 'https://fusebeadpatterns.art/fr/image-en-pixel-art';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: pageUrl, languages: pixelLanguageAlternates },
    openGraph: {
        title,
        description,
        url: pageUrl,
        locale: 'fr_FR',
        siteName: 'Fuse Bead Patterns',
        type: 'website',
        images: ['/opengraph-image.png'],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image.png'] },
};

const applicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Convertir une image en pixel art',
    description,
    url: pageUrl,
    inLanguage: 'fr',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function ImageEnPixelArtPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema).replace(/</g, '\\u003c') }} />
            <SiteHeader locale="fr" />
            <main id="main-content" tabIndex={-1} className="page-shell flex-1">
                <Breadcrumbs label="Fil d’Ariane" items={[
                    { label: 'Accueil', href: '/fr' },
                    { label: 'Image en pixel art', href: '/fr/image-en-pixel-art' },
                ]} />
                <div className="mb-8">
                    <h1 className="page-heading">Convertir une image en pixel art</h1>
                    <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted">
                        Importez une image, choisissez le niveau de détail et retouchez les pixels.
                        La conversion se fait dans votre navigateur ; vous pouvez ensuite télécharger votre création en PNG.
                    </p>
                </div>
                <PixelPracticeProvider>
                    <PixelGridWorkspace locale="fr" experience="converter" />
                    <PixelConversionExamples locale="fr" />
                </PixelPracticeProvider>
                <section aria-labelledby="conversion-help" className="mt-10 max-w-[75ch] border-t border-line pt-8 text-base leading-7 text-muted">
                    <h2 id="conversion-help" className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink">De l’image au fichier PNG</h2>
                    <p className="mt-4">
                        Choisissez un fichier PNG, JPEG ou WebP statique de 8 Mio maximum,
                        limité à 2 048 pixels par côté. La grille commence à 64 × 64 pixels.
                        Essayez 32 × 32 pour de gros pixels ou 128 × 128 pour davantage de détails,
                        ou définissez une largeur et une hauteur de 1 à 128 pixels.
                        Un sujet bien détaché du fond reste plus lisible à petite taille.
                    </p>
                    <p className="mt-5">
                        Conservez les couleurs d’origine ou limitez la conversion à 8, 16, 32 ou 64 couleurs.
                        Une palette réduite peut faire disparaître de petits détails : comparez les résultats,
                        puis ajustez les cellules avec le pinceau et la gomme.
                        Reconvertir l’image remplace vos retouches ; « Annuler » permet de revenir à l’étape précédente.
                    </p>
                    <p className="mt-5">
                        Dans le PNG à la taille d’origine, chaque cellule devient un pixel : une grille de 64 × 64 donne un fichier de 64 × 64 pixels.
                        Pour une image plus grande, choisissez un agrandissement entier sans grille, ou exportez le PNG avec quadrillage.
                        Le projet modifiable conserve les pixels, la transparence et les dimensions. L’espace de travail complet
                        inclut aussi les pixels de l’image d’origine, les réglages et l’historique. Enregistrez et rouvrez ces fichiers
                        vous-même : il n’y a pas de sauvegarde automatique.
                    </p>
                    <p className="mt-5">
                        Pour convertir votre dessin actuel, choisissez « Créer un modèle de perles » dans l’atelier, puis une marque. Chaque pixel devient une position de perle ; des cases vides complètent les plaques sans redimensionner le dessin. Vous pouvez revenir au dessin en pixels avec ses couleurs d’origine.
                    </p>
                    <p className="mt-5">
                        Pour partir d’une autre image, ouvrez le{' '}
                        <Link href="/fr#generator" prefetch={false} className="text-link text-accent">générateur de modèles de perles</Link>.
                    </p>
                </section>
            </main>
            <SiteFooter locale="fr" />
        </>
    );
}

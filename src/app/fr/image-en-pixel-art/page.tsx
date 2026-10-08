import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PixelGridWorkspace from '@/components/pixel-grid/PixelGridWorkspace';

const title = 'Convertir une image en pixel art | Fuse Bead Patterns';
const description = 'Transformez une image en pixel art gratuitement dans votre navigateur. Choisissez la taille et les couleurs, retouchez les pixels et téléchargez un PNG.';
const pageUrl = 'https://fusebeadpatterns.art/fr/image-en-pixel-art';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: 'Fuse Bead Patterns',
        type: 'website',
        images: [],
    },
    twitter: { card: 'summary', title, description, images: [] },
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
};

export default function ImageEnPixelArtPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema).replace(/</g, '\\u003c') }} />
            <header className="site-header">
                <a href="#main-content" className="skip-link">Aller au contenu</a>
                <div className="site-header-inner">
                    <div className="site-brand">
                        <Image src="/logo.png" alt="" width={36} height={36} sizes="36px" preload />
                        <span className="site-brand-name">Fuse Bead Patterns<span className="text-accent" aria-hidden="true">.</span></span>
                    </div>
                    <nav className="site-nav" aria-label="Navigation principale">
                        <Link href="/pixel-art-grid" hrefLang="en" prefetch={false}>Grille de dessin (en anglais)</Link>
                    </nav>
                </div>
            </header>
            <main id="main-content" tabIndex={-1} className="page-shell flex-1">
                <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <li><Link href="/" hrefLang="en" prefetch={false} className="text-link">Accueil (en anglais)</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">Image en pixel art</li>
                    </ol>
                </nav>
                <div className="mb-8">
                    <h1 className="page-heading">Convertir une image en pixel art</h1>
                    <p className="mt-4 max-w-[65ch] text-base leading-7 text-muted">
                        Importez une image, choisissez le niveau de détail et retouchez les pixels.
                        La conversion se fait dans votre navigateur ; vous pouvez ensuite télécharger votre création en PNG.
                    </p>
                </div>
                <PixelGridWorkspace locale="fr" experience="converter" />
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
                        Enregistrez aussi le projet pour rouvrir les pixels plus tard : il conserve leurs couleurs,
                        leur transparence et les dimensions, mais pas la photo source, les réglages ni l’historique.
                        Il n’y a pas de sauvegarde automatique.
                    </p>
                    <p className="mt-5">
                        Pour créer un modèle avec des couleurs de perles, ouvrez le{' '}
                        <Link href="/#generator" hrefLang="en" prefetch={false} className="text-link text-accent">générateur de modèles de perles (en anglais)</Link>.
                    </p>
                </section>
            </main>
            <footer className="border-t border-line bg-[#edeee7] px-5 py-6 text-sm text-muted sm:px-10">
                <nav aria-label="Informations du site" className="mx-auto flex max-w-[1168px] flex-wrap gap-x-6 gap-y-2">
                    <Link href="/privacy-policy" hrefLang="en" prefetch={false} className="text-link">Confidentialité (en anglais)</Link>
                    <Link href="/terms-of-service" hrefLang="en" prefetch={false} className="text-link">Conditions d’utilisation (en anglais)</Link>
                </nav>
            </footer>
        </>
    );
}

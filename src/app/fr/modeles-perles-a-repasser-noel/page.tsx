import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPatternById, getPatternHref } from '@/lib/patterns/catalog';
import selection from '@/lib/patterns/french-christmas.json';

const path = '/fr/modeles-perles-a-repasser-noel';
const title = 'Perles à repasser de Noël : 3 modèles gratuits en PDF';
const description = 'Sapin, bonhomme de neige et pain d’épices : 3 modèles de Noël en perles à repasser. PDF A4 en français, grilles PNG et couleurs Perler, sans compte.';
const preview = '/patterns/original-christmas-tree/preview.png';
const selected = selection.patterns.map((local) => {
    const pattern = getPatternById(local.id);
    if (!pattern) throw new Error(`French Christmas pattern is missing: ${local.id}`);
    return { ...pattern, ...local };
});

export const metadata: Metadata = {
    title, description,
    alternates: { canonical: path },
    openGraph: {
        title, description, locale: 'fr_FR', type: 'website',
        url: `https://fusebeadpatterns.art${path}`, siteName: 'Fuse Bead Patterns',
        images: [{ url: preview, width: 580, height: 580, alt: 'Sapin de Noël en perles à repasser' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [preview] },
};

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title, description, inLanguage: 'fr',
    url: `https://fusebeadpatterns.art${path}`,
    mainEntity: {
        '@type': 'ItemList', numberOfItems: selected.length,
        itemListElement: selected.map((pattern, index) => ({
            '@type': 'ListItem', position: index + 1, name: pattern.name,
            url: `https://fusebeadpatterns.art${path}#${pattern.id}`,
        })),
    },
};

export default function FrenchChristmasPatternsPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
            <header className="site-header">
                <a href="#main-content" className="skip-link">Aller au contenu</a>
                <div className="site-header-inner">
                    <Link href={path} className="site-brand" aria-label="Fuse Bead Patterns – modèles de Noël">
                        <Image src="/logo.png" alt="" width={36} height={36} sizes="36px" />
                        <span lang="en" className="site-brand-name">Fuse Bead Patterns<span className="text-accent" aria-hidden="true">.</span></span>
                    </Link>
                    <nav className="site-nav" aria-label="Navigation principale">
                        <a href="#modeles">Modèles</a>
                        <a href="#imprimer">Imprimer</a>
                        <Link href="/patterns/christmas" hrefLang="en" lang="en">English</Link>
                    </nav>
                </div>
            </header>
            <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
                <nav aria-label="Fil d’Ariane" className="mb-6 text-xs font-medium text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2">
                        <li><Link href="/" hrefLang="en" className="inline-flex min-h-10 items-center hover:underline">Accueil (anglais)</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">Modèles de Noël</li>
                    </ol>
                </nav>
                <h1 className="page-heading leading-snug">Modèles de Noël en perles à repasser</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted sm:text-lg">
                    Trois motifs gratuits à télécharger : un sapin, un bonhomme de neige et un bonhomme en pain d’épices. Chaque PDF A4 contient la grille, les symboles et la liste des couleurs Perler. Sans inscription.
                </p>
                <section id="modeles" aria-labelledby="models-heading" className="mt-9">
                    <h2 id="models-heading" className="mb-6 text-xl font-semibold leading-relaxed sm:text-2xl">Choisir un modèle à imprimer</h2>
                    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-3">
                        {selected.map((pattern) => (
                            <article key={pattern.id} id={pattern.id} className="pattern-card scroll-mt-6" data-pattern-card={pattern.id} aria-labelledby={`${pattern.id}-title`}>
                                <a href={pattern.assets.grid} target="_blank" rel="noopener" className="block rounded-[10px]" aria-label={`${pattern.name} : agrandir la grille (nouvel onglet)`}>
                                    <div className="pattern-art">
                                        <Image src={pattern.assets.preview} alt={`${pattern.name} en perles à repasser`} width={580} height={580} unoptimized />
                                    </div>
                                </a>
                                <div className="pattern-card-title"><h3 id={`${pattern.id}-title`}>{pattern.name}</h3></div>
                                <p className="mb-4 text-sm leading-6 text-muted">{pattern.description}</p>
                                <div className="flex flex-wrap gap-x-4">
                                    <a href={`/patterns-fr/${pattern.id}/pattern.pdf`} download={`${pattern.id}-fr.pdf`} className="text-link underline decoration-line underline-offset-4 hover:decoration-accent"
                                        aria-label={`${pattern.name} : télécharger le PDF en français`}
                                        data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-palette="perler" data-pattern-entry="patterns" data-pattern-format="pdf">
                                        PDF A4 (français)<span aria-hidden="true">↓</span>
                                    </a>
                                    <a href={pattern.assets.grid} download={`${pattern.id}-grid.png`} className="text-link underline decoration-line underline-offset-4 hover:decoration-accent"
                                        aria-label={`${pattern.name} : télécharger la grille PNG`}
                                        data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-palette="perler" data-pattern-entry="patterns" data-pattern-format="grid_png">
                                        Grille PNG<span aria-hidden="true">↓</span>
                                    </a>
                                </div>
                                <Link href={getPatternHref(pattern)} hrefLang="en" prefetch={false} className="inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-4 hover:text-accent">
                                    Détails et édition (anglais)
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
                <section id="imprimer" aria-labelledby="print-heading" className="mt-14 border-t border-line pt-8">
                    <h2 id="print-heading" className="text-2xl font-semibold leading-relaxed">Imprimer à la bonne taille</h2>
                    <ol className="mt-5 max-w-3xl list-decimal space-y-3 pl-6 leading-8 text-muted">
                        <li>Téléchargez le PDF du motif choisi. Le PNG sert à lire la grille à l’écran ; sa taille d’impression dépend du logiciel utilisé.</li>
                        <li>Choisissez le papier A4 et une échelle de 100 % ou « Taille réelle ». Désactivez « Ajuster à la page ».</li>
                        <li>Mesurez la ligne de contrôle de 50 mm sur le papier. La grille compte 29 × 29 cases espacées de 5 mm. Vérifiez aussi l’espacement sur votre propre plaque carrée.</li>
                        <li>Suivez les symboles et les quantités de la liste Perler. Les cases vides restent sans perle.</li>
                    </ol>
                    <p className="mt-5 max-w-3xl text-sm leading-7 text-muted">
                        Ce sont des motifs plats, prévus sur une seule plaque carrée. Les couleurs à l’écran et sur papier peuvent différer des perles réelles. Ces créations originales n’ont pas été assemblées ni testées au fer. Les PDFs ne sont pas à l’échelle des perles Mini.
                    </p>
                </section>
                <section aria-labelledby="questions-heading" className="mt-12 max-w-3xl">
                    <h2 id="questions-heading" className="text-2xl font-semibold leading-relaxed">Questions fréquentes</h2>
                    <div className="mt-5 divide-y divide-line border-y border-line">
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Les modèles sont-ils gratuits ?</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">Oui. Les trois PDFs et les grilles PNG se téléchargent gratuitement, sans créer de compte.</p>
                        </details>
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Puis-je utiliser des perles Hama ?</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">
                                Les références de ces PDFs sont celles de Perler, pas de Hama. Pour une fiche déjà préparée en français, ouvrez les <Link href="/fr/modeles-perles-a-repasser#marque" className="text-link">six modèles de perles à repasser</Link> et choisissez Hama Midi. Vous pouvez aussi comparer vos couleurs disponibles ou changer la palette dans l’éditeur avant d’exporter une autre fiche. Le <Link href="/guides/perler-to-hama-artkal" hrefLang="en" className="text-link">guide de changement de marque (anglais)</Link> explique cette étape ; l’éditeur et ses exports sont en anglais.
                            </p>
                        </details>
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Quel modèle choisir pour commencer ?</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">Le sapin utilise quatre couleurs et de grandes zones pleines. Le bonhomme en pain d’épices utilise trois couleurs. Regardez les petites zones de la grille et préparez les couleurs avant de commencer.</p>
                        </details>
                    </div>
                </section>
            </main>
            <footer className="mt-auto border-t border-line bg-[#edeee7]">
                <div className="mx-auto max-w-[1248px] px-5 py-8 sm:px-10">
                    <nav aria-label="Autres pages" className="flex flex-wrap gap-x-6">
                        <Link href="/fr/modeles-perles-a-repasser" className="text-link">Modèles de perles à repasser</Link>
                        <Link href="/patterns" hrefLang="en" className="text-link">Tous les modèles (anglais)</Link>
                        <Link href="/privacy-policy" hrefLang="en" className="text-link">Confidentialité (anglais)</Link>
                        <Link href="/terms-of-service" hrefLang="en" className="text-link">Conditions d’utilisation (anglais)</Link>
                    </nav>
                    <p className="mt-5 max-w-3xl text-xs leading-6 text-muted">© 2026 Fuse Bead Patterns. Créations originales. Site indépendant des marques de perles.</p>
                </div>
            </footer>
        </>
    );
}

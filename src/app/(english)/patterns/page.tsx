import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PatternBrowser from '@/components/patterns/PatternBrowser';
import { toPatternCard } from '@/components/patterns/PatternCards';
import { patterns, patternCollections } from '@/lib/patterns/catalog';
import { patternTopics } from '@/lib/patterns/topics';

const title = 'Free Printable Perler Bead Patterns | Fuse Bead Patterns';
const description = 'Find free printable Perler bead patterns featuring Stardew Valley characters, Pokémon, and Halloween designs. Choose a picture and download its pattern.';
const preview = '/patterns/sdv-blue-chicken/preview.png';

export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/patterns' },
    openGraph: { title, description, url: 'https://fusebeadpatterns.art/patterns', type: 'website', images: [{ url: preview, width: 580, height: 580, alt: 'Stardew Valley Blue Chicken Perler bead pattern' }] },
    twitter: { card: 'summary_large_image', title, description, images: [preview] },
};

// Open with a cross-section of the library, without claiming a popularity ranking.
const openingIds = ['pokemon-pikachu-gen5', 'sdv-blue-chicken', 'minecraft-diamond-sword-1-21-1', 'smb-super-mushroom'];
const browsePatterns = [
    ...openingIds.flatMap(id => patterns.filter(pattern => pattern.id === id)),
    ...patterns.filter(pattern => !openingIds.includes(pattern.id)),
];

export default function PatternsPage() {
    return (
        <>
            <SiteHeader active="patterns" />
            <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
                <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Patterns', href: '/patterns' }]} />
                <h1 className="page-heading">Free Printable Perler Bead Patterns</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 sm:text-lg">Explore Stardew Valley, Pokémon, Minecraft, Super Mario, Kirby, and Halloween bead patterns. Choose a picture to download its free printable pattern.</p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold">
                    {patternTopics.map((topic) => (
                        <Link key={topic.slug} href={`/patterns/${topic.slug}`} className="underline underline-offset-4">{topic.label}</Link>
                    ))}
                    <a href="/ja/patterns" lang="ja" hrefLang="ja" className="underline underline-offset-4">日本語の図案</a>
                    <a href="/de/patterns" lang="de" hrefLang="de" className="underline underline-offset-4">Deutsche Vorlagen</a>
                </div>
                <nav aria-label="Pattern collections" className="collection-nav">
                    {patternCollections.map((collection) => (
                        <Link key={collection.id} href={`/patterns/${collection.slug}`} >{collection.title} <span className="ml-2" aria-hidden="true">→</span></Link>
                    ))}
                </nav>
                <PatternBrowser patterns={browsePatterns.map(toPatternCard)} collections={patternCollections.map(({ id, title }) => ({ id, title }))} />
                <section className="mt-14 border-t border-line pt-8">
                    <h2 className="section-heading">Before you start</h2>
                    <p className="mt-2 max-w-3xl leading-7 text-gray-700">Check the design size, bead colors, and assembly notes on each pattern. Print PDFs at actual size and check the scale before placing beads.</p>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold">
                        <Link href="/guides/perler-bead-pegboards" className="underline underline-offset-4">Pegboard size guide</Link>
                        <Link href="/guides/perler-bead-kits-and-storage" className="underline underline-offset-4">Beginner supplies guide</Link>
                    </div>
                </section>
            </main>
            <SiteFooter active="patterns" />
        </>
    );
}

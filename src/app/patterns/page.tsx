import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import PatternBrowser from '@/components/patterns/PatternBrowser';
import { toPatternCard } from '@/components/patterns/PatternCards';
import { patterns, patternCollections } from '@/lib/patterns/catalog';

const title = 'Free Printable Perler Bead Patterns | Fuse Bead Patterns';
const description = 'Find free printable Perler bead patterns featuring Stardew Valley characters, Pokémon, and Halloween designs. Choose a picture and download its pattern.';
const preview = '/patterns/sdv-blue-chicken/preview.png';

export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/patterns' },
    openGraph: { title, description, url: 'https://fusebeadpatterns.art/patterns', type: 'website', images: [{ url: preview, width: 580, height: 580, alt: 'Stardew Valley Blue Chicken Perler bead pattern' }] },
    twitter: { card: 'summary_large_image', title, description, images: [preview] },
};

export default function PatternsPage() {
    return (
        <>
            <SiteHeader active="patterns" />
            <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-10 sm:px-4 sm:pb-12">
                <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Patterns', href: '/patterns' }]} />
                <h1 className="font-vt323 text-4xl uppercase leading-none sm:text-6xl">Free Printable Perler Bead Patterns</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 sm:text-lg">Explore Stardew Valley, Pokémon, Minecraft, Super Mario, Kirby, and Halloween bead patterns. Choose a picture to download its free printable pattern.</p>
                <nav aria-label="Pattern collections" className="my-6 flex flex-wrap gap-3 text-sm font-bold">
                    {patternCollections.map((collection) => (
                        <Link key={collection.id} href={`/patterns/${collection.slug}`} className="inline-flex min-h-11 items-center border-2 border-brutal-black bg-white px-4 py-2 hover:bg-brand-yellow">{collection.title} <span className="ml-2" aria-hidden="true">→</span></Link>
                    ))}
                </nav>
                <PatternBrowser patterns={patterns.map(toPatternCard)} collections={patternCollections.map(({ id, title }) => ({ id, title }))} />
                <section className="mt-10 border-t-2 border-brutal-black pt-5">
                    <h2 className="font-vt323 text-3xl">Before you start</h2>
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

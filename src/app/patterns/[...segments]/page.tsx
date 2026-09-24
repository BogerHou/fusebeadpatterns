import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { PatternGrid, toPatternCard } from '@/components/patterns/PatternCards';
import { patterns, patternCollections, getPatternBySlug, getCollectionBySlug, getPatternsForCollection, getPatternHref, type Pattern } from '@/lib/patterns/catalog';
import { getPatternDisplayName } from '@/lib/patterns/presentation';
import { brandGuideHref, getCollectionIntro, getFewestColorsPattern, getPatternIntro } from '@/lib/patterns/content';

type Props = { params: Promise<{ segments: string[] }> };
const siteUrl = 'https://fusebeadpatterns.art';
export const dynamicParams = false;

function patternPageTitle(pattern: Pattern): string {
    return `${getPatternDisplayName(pattern)} Perler Bead Pattern`;
}

export function generateStaticParams() {
    return [...patternCollections.map((collection) => collection.slug), ...patterns.map((pattern) => pattern.slug)]
        .map((slug) => ({ segments: slug.split('/') }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const slug = (await params).segments.join('/');
    const pattern = getPatternBySlug(slug);
    const collection = getCollectionBySlug(slug);
    if (!pattern && !collection) notFound();
    const title = pattern ? `${patternPageTitle(pattern)} | Fuse Bead Patterns` : `${collection!.title} Perler Bead Patterns | Fuse Bead Patterns`;
    const description = (pattern ?? collection)!.description;
    const image = pattern?.assets.preview ?? getPatternsForCollection(collection!.id)[0].assets.preview;
    return {
        title, description,
        alternates: { canonical: `/patterns/${slug}` },
        openGraph: { title, description, url: `${siteUrl}/patterns/${slug}`, type: 'website', images: [{ url: image, width: 580, height: 580, alt: `${pattern ? getPatternDisplayName(pattern) : collection!.title} Perler bead pattern` }] },
        twitter: { card: 'summary_large_image', title, description, images: [image] },
    };
}

function PatternDetail({ pattern }: { pattern: Pattern }) {
    const collection = patternCollections.find((item) => item.id === pattern.collectionId);
    const href = getPatternHref(pattern);
    const related = patterns.filter((item) => item.id !== pattern.id && item.collectionId === pattern.collectionId).slice(0, 4);
    const structuredData = {
        '@context': 'https://schema.org', '@type': 'WebPage',
        name: patternPageTitle(pattern), description: pattern.description, url: `${siteUrl}${href}`,
        primaryImageOfPage: { '@type': 'ImageObject', contentUrl: `${siteUrl}${pattern.assets.preview}`, caption: `${getPatternDisplayName(pattern)} Perler bead pattern`, width: 580, height: 580 },
    };
    return (
        <>
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Patterns', href: '/patterns' }, ...(collection ? [{ label: collection.title, href: `/patterns/${collection.slug}` }] : []), { label: pattern.title, href }]} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
            <article>
                <h1 className="mt-3 max-w-4xl font-vt323 text-4xl leading-none sm:text-6xl">{patternPageTitle(pattern)}</h1>
                <div className="mt-6 grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
                    <Image src={pattern.assets.preview} alt={`${getPatternDisplayName(pattern)} Perler bead pattern`} width={580} height={580} unoptimized preload className="w-full border-2 border-brutal-black bg-[#faf8f3] [image-rendering:pixelated]" />
                    <div>
                        <p className="text-base leading-7 text-gray-800 sm:text-lg">{getPatternIntro(pattern)}</p>
                        <dl className="my-6 grid grid-cols-2 gap-x-4 gap-y-5 border-y-2 border-brutal-black py-5 text-sm">
                            {[
                                ['Design size', `${pattern.motifWidth} × ${pattern.motifHeight} beads`],
                                ['Pegboard', `${pattern.gridWidth} × ${pattern.gridHeight} MIDI · 1 board`],
                                ['Beads needed', String(pattern.beads)],
                                ['Colors', `${pattern.colorCount} Perler colors`],
                            ].map(([label, value]) => <div key={label}><dt className="text-gray-600">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}
                        </dl>
                        <div className="flex flex-wrap gap-3">
                            <a href={pattern.assets.pdf} download data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-format="pdf" data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="inline-flex min-h-11 items-center border-2 border-brutal-black bg-brand-yellow px-4 py-2 font-bold shadow-brutal-sm hover:bg-white">Download PDF</a>
                            <a href={pattern.assets.grid} download data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-format="grid_png" data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="inline-flex min-h-11 items-center border-2 border-brutal-black bg-white px-4 py-2 font-bold hover:bg-brand-cyan">Download grid PNG</a>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-gray-600">Print at 100% / actual size. Check the PDF&apos;s 50 mm scale before using it as a placement guide.</p>
                        <Link href={`/editor?pattern=${pattern.id}`} prefetch={false} data-pattern-event="pattern_editor_open" data-pattern-id={pattern.id} data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="mt-5 inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4">Open in editor <span aria-hidden="true" className="ml-2">→</span></Link>
                        <p className="text-sm leading-6 text-gray-600">Adjust individual beads or colors, then save your own version. These downloads use Perler colors. For Hama or Artkal, change the color brand in the editor and export a new pattern. <Link href={brandGuideHref} className="font-medium underline underline-offset-4">How to switch bead brands</Link>.</p>
                    </div>
                </div>
                <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
                    <section aria-labelledby="pattern-chart-heading">
                        <h2 id="pattern-chart-heading" className="mb-3 font-vt323 text-3xl sm:text-4xl">Pattern chart</h2>
                        <a href={pattern.assets.grid} target="_blank" rel="noopener noreferrer" className="block border-2 border-brutal-black bg-white" aria-label={`Open full-size ${pattern.title} pattern chart`}>
                            <Image src={pattern.assets.grid} alt={`${pattern.title} printable grid with row numbers, column numbers, and color symbols`} width={586} height={586} unoptimized className="h-auto w-full" />
                        </a>
                        <p className="mt-2 text-sm text-gray-600">Blank cells are empty. Tap the chart to view it at full size.</p>
                    </section>
                    <section aria-labelledby="pattern-colors-heading">
                        <h2 id="pattern-colors-heading" className="mb-3 font-vt323 text-3xl sm:text-4xl">Colors &amp; bead counts</h2>
                        <div className="border-2 border-brutal-black bg-white px-3 sm:px-4">
                            <table className="w-full text-left text-sm">
                                <caption className="sr-only">Perler colors for {pattern.title}; {pattern.beads} beads in total</caption>
                                <thead><tr className="border-b-2 border-brutal-black"><th scope="col" className="py-3">Symbol</th><th scope="col" className="py-3">Perler color</th><th scope="col" className="py-3 text-right">Beads</th></tr></thead>
                                <tbody>{pattern.palette.map((color) => <tr key={color.ref} className="border-b border-gray-200"><td className="py-3"><span aria-hidden="true" className="mr-2 inline-block h-3 w-3 border border-black/40 align-middle" style={{ backgroundColor: color.hex }} />{color.symbol}</td><td className="py-3"><span className="font-medium">{color.name}</span><br /><span className="text-xs text-gray-600">{color.ref}</span></td><td className="py-3 text-right tabular-nums">{color.count}</td></tr>)}</tbody>
                                <tfoot><tr><th scope="row" colSpan={2} className="py-3">Total</th><td className="py-3 text-right font-bold tabular-nums">{pattern.beads}</td></tr></tfoot>
                            </table>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-gray-600">Colors are matched to the Perler palette. Screen colors and physical beads may differ.</p>
                    </section>
                </div>
                <section className="mt-8 max-w-3xl border-t-2 border-brutal-black pt-5">
                    <h2 className="font-vt323 text-3xl sm:text-4xl">Making this pattern</h2>
                    <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-gray-800">{pattern.notes.map((note) => <li key={note}>{note}</li>)}</ul>
                    <p className="mt-4 leading-7">New to beadwork? Check the <Link href="/guides/perler-bead-pegboards" className="font-medium underline underline-offset-4">pegboard size guide</Link> and <Link href="/guides/perler-bead-kits-and-storage" className="font-medium underline underline-offset-4">beginner supplies guide</Link>.</p>
                </section>
                <details className="mt-6 border-t border-gray-400 pt-4 text-sm leading-6">
                    <summary className="cursor-pointer font-bold">{pattern.source ? 'Reference version & source' : 'About this original design'}</summary>
                    {pattern.source ? <div className="mt-3 max-w-3xl"><p>{pattern.source.description}</p><a href={pattern.source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-medium underline underline-offset-4">{pattern.source.label}</a></div> : <p className="mt-3">An original scene drawn on a bead grid. It does not depict a named game or anime character.</p>}
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2"><a href={pattern.assets.project} download data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-format="project" data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="underline underline-offset-4">Download editable project</a><a href={pattern.assets.pixels} download data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-format="png" data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="underline underline-offset-4">Download pattern pixels</a></div>
                </details>
            </article>
            {related.length > 0 && <section className="mt-12 border-t-2 border-brutal-black pt-6"><h2 className="mb-5 font-vt323 text-3xl sm:text-4xl">More {collection?.title ?? 'original'} patterns</h2><PatternGrid patterns={related.map(toPatternCard)} headingLevel={3} /></section>}
        </>
    );
}

export default async function PatternRoute({ params }: Props) {
    const slug = (await params).segments.join('/');
    const collection = getCollectionBySlug(slug);
    const pattern = getPatternBySlug(slug);
    if (!collection && !pattern) notFound();
    const collectionPatterns = collection ? getPatternsForCollection(collection.id) : [];
    const fewestColors = getFewestColorsPattern(collectionPatterns);
    return (
        <>
            <SiteHeader active="patterns" />
            <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-10 sm:px-4 sm:pb-12">
                {pattern ? <PatternDetail pattern={pattern} /> : <>
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Patterns', href: '/patterns' }, { label: collection!.title, href: `/patterns/${collection!.slug}` }]} />
                    <h1 className="font-vt323 text-4xl leading-none sm:text-6xl">{collection!.title} Perler Bead Patterns</h1>
                    <p className="mb-6 mt-4 max-w-3xl text-base leading-7 text-gray-700 sm:text-lg">{getCollectionIntro(collection!, collectionPatterns)}</p>
                    <PatternGrid patterns={collectionPatterns.map(toPatternCard)} />
                    <section className="mt-10 max-w-3xl border-t-2 border-brutal-black pt-5" aria-labelledby="choosing-pattern-heading">
                        <h2 id="choosing-pattern-heading" className="font-vt323 text-3xl sm:text-4xl">Choosing a {collection!.title} pattern</h2>
                        {fewestColors && <p className="mt-3 leading-7 text-gray-800">Looking for fewer colors to gather? <Link href={getPatternHref(fewestColors)} className="font-medium underline underline-offset-4">{getPatternDisplayName(fewestColors)}</Link> uses {fewestColors.colorCount} Perler colors and {fewestColors.beads} beads, the fewest colors in this collection. Check the individual pattern for its layout and any delicate connections before starting.</p>}
                        <p className="mt-3 leading-7 text-gray-800">Each pattern page includes its grid size, bead counts by color and printable downloads. Blank grid cells stay empty; the number of positions on a board is not the number of beads you need.</p>
                        <p className="mt-3 leading-7 text-gray-800">Using another brand? Follow the <Link href={brandGuideHref} className="font-medium underline underline-offset-4">Hama and Artkal conversion guide</Link> to match the colors in the editor and export a new chart. Keep the board settings unchanged to preserve the bead positions and empty spaces.</p>
                    </section>
                    <p className="mt-8 leading-7"><Link href="/patterns" className="font-bold underline underline-offset-4">Browse all patterns</Link> to explore more themes.</p>
                </>}
            </main>
            <SiteFooter active="patterns" />
        </>
    );
}

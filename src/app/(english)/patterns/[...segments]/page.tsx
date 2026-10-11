import { patternLanguageAlternates } from '@/lib/i18n/metadata';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { PatternGrid, toPatternCard } from '@/components/patterns/PatternCards';
import PatternTopicPage from '@/components/patterns/PatternTopicPage';
import PatternShare from '@/components/patterns/PatternShare';
import CoasterInstructions from '@/components/patterns/CoasterInstructions';
import OrnamentInstructions from '@/components/patterns/OrnamentInstructions';
import { patterns, patternCollections, getPatternBySlug, getCollectionBySlug, getPatternsForCollection, getPatternHref, type Pattern } from '@/lib/patterns/catalog';
import { patternTopics, getPatternTopicBySlug, getPatternsForTopic } from '@/lib/patterns/topics';
import { getPatternDisplayName } from '@/lib/patterns/presentation';
import { brandGuideHref, getCollectionIntro, getFewestColorsPattern, getPatternIntro } from '@/lib/patterns/content';
import { getPatternFanArtNotice } from '@/lib/patterns/fan-art';

type Props = { params: Promise<{ segments: string[] }> };
const siteUrl = 'https://fusebeadpatterns.art';
export const dynamicParams = false;

function patternPageTitle(pattern: Pattern): string {
    return `${getPatternDisplayName(pattern)} Perler Bead Pattern`;
}

export function generateStaticParams() {
    return [...patternCollections.map((collection) => collection.slug), ...patterns.map((pattern) => pattern.slug), ...patternTopics.map((topic) => topic.slug)]
        .map((slug) => ({ segments: slug.split('/') }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const slug = (await params).segments.join('/');
    const topic = getPatternTopicBySlug(slug);
    if (topic) {
        const title = `${topic.metadataTitle ?? topic.title} | Fuse Bead Patterns`;
        const previewPattern = getPatternsForTopic(topic)[0];
        const image = previewPattern.assets.preview;
        return {
            title, description: topic.description,
            alternates: { canonical: `/patterns/${topic.slug}`, languages: patternLanguageAlternates(topic.slug) },
            openGraph: { title, description: topic.description, url: `${siteUrl}/patterns/${topic.slug}`, type: 'website', images: [{ url: image, width: 580, height: 580, alt: `${getPatternDisplayName(previewPattern)} Perler bead pattern` }] },
            twitter: { card: 'summary_large_image', title, description: topic.description, images: [image] },
        };
    }
    const pattern = getPatternBySlug(slug);
    const collection = getCollectionBySlug(slug);
    if (!pattern && !collection) notFound();
    const title = pattern ? `${patternPageTitle(pattern)} | Fuse Bead Patterns` : `${collection!.title} Perler Bead Patterns | Fuse Bead Patterns`;
    const description = (pattern ?? collection)!.description;
    const image = pattern?.assets.preview ?? getPatternsForCollection(collection!.id)[0].assets.preview;
    return {
        title, description,
        alternates: { canonical: `/patterns/${slug}`, languages: patternLanguageAlternates(slug) },
        openGraph: { title, description, url: `${siteUrl}/patterns/${slug}`, type: 'website', images: [{ url: image, width: 580, height: 580, alt: `${pattern ? getPatternDisplayName(pattern) : collection!.title} Perler bead pattern` }] },
        twitter: { card: 'summary_large_image', title, description, images: [image] },
    };
}

function PatternDetail({ pattern }: { pattern: Pattern }) {
    const fanArtNotice = getPatternFanArtNotice(pattern);
    const collection = patternCollections.find((item) => item.id === pattern.collectionId);
    const href = getPatternHref(pattern);
    const christmasTopic = getPatternTopicBySlug('christmas');
    const hasChristmasTopic = christmasTopic?.patternIds.includes(pattern.id) || christmasTopic?.additionalPatternIds?.includes(pattern.id);
    const related = pattern.id === 'original-santa-hat'
        ? patterns.filter(item => christmasTopic?.patternIds.includes(item.id))
        : patterns.filter((item) => item.id !== pattern.id && item.collectionId === pattern.collectionId).slice(0, 4);
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
                <h1 className="page-heading max-w-4xl pt-4 sm:pt-8">{patternPageTitle(pattern)}</h1>
                <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.08fr_1fr] lg:gap-14">
                    <Image src={pattern.assets.preview} alt={`${getPatternDisplayName(pattern)} Perler bead pattern`} width={580} height={580} unoptimized preload className="w-full rounded-xl border border-[#d9ded5] bg-[#faf8f3] [image-rendering:pixelated]" />
                    <div>
                        <p className="max-w-[60ch] text-base leading-8 text-[#43564d] sm:text-lg">{getPatternIntro(pattern)}</p>
                        <dl className="my-6 grid grid-cols-2 gap-x-5 gap-y-5 border-y border-[#d9ded5] py-6 text-sm">
                            {[
                                ['Design size', `${pattern.motifWidth} × ${pattern.motifHeight} beads`],
                                ['Pegboard', `${pattern.gridWidth} × ${pattern.gridHeight} MIDI · 1 board`],
                                ['Beads needed', String(pattern.beads)],
                                ['Colors', `${pattern.colorCount} Perler color${pattern.colorCount === 1 ? '' : 's'}`],
                            ].map(([label, value]) => <div key={label}><dt className="text-[#59685d]">{label}</dt><dd className="mt-1.5 font-semibold text-[#243e36]">{value}</dd></div>)}
                        </dl>
                        {fanArtNotice && <p className="mb-4 text-sm leading-7 text-[#59685d]">{fanArtNotice} <a href="mailto:contact@fusebeadpatterns.art" className="text-link">contact@fusebeadpatterns.art</a></p>}
                        <div className="flex flex-wrap gap-3">
                            <a href={pattern.assets.pdf} download data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-format="pdf" data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="button-primary">{pattern.assets.pdfLetter ? 'Download A4 PDF' : 'Download PDF'}</a>
                            {pattern.assets.pdfLetter && <a href={pattern.assets.pdfLetter} download data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-format="pdf" data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="button-secondary">Download US Letter PDF</a>}
                            <a href={pattern.assets.grid} download data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-format="grid_png" data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="button-secondary">Download grid PNG</a>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#59685d]">Print at 100% / actual size. Check the PDF&apos;s 50 mm scale before using it as a placement guide.</p>
                        {pattern.assets.pdfLetter && <p className="mt-2 text-sm leading-6 text-[#59685d]">Choose A4 or US Letter to match your paper.</p>}
                        <Link href={`/editor?pattern=${pattern.id}`} prefetch={false} data-pattern-event="pattern_editor_open" data-pattern-id={pattern.id} data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="text-link mt-5 inline-flex min-h-11 items-center">Open in editor <span aria-hidden="true" className="ml-2">→</span></Link>
                        <p className="text-sm leading-6 text-[#59685d]">Adjust individual beads or colors, then save your own version. These downloads use Perler colors. For Hama or Artkal, change the color brand in the editor and export a new pattern. <Link href={brandGuideHref} className="text-link">How to switch bead brands</Link>.</p>
                        <PatternShare key={href} url={`${siteUrl}${href}`} title={patternPageTitle(pattern)} />
                    </div>
                </div>
                <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1.08fr_1fr] lg:gap-14">
                    <section aria-labelledby="pattern-chart-heading">
                        <h2 id="pattern-chart-heading" className="section-heading mb-5">Pattern chart</h2>
                        <a href={pattern.assets.grid} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-[#d9ded5] bg-white transition-colors hover:border-[#78917f]" aria-label={`Open full-size ${pattern.title} pattern chart`}>
                            <Image src={pattern.assets.grid} alt={`${pattern.title} printable grid with row numbers, column numbers, and color symbols`} width={['original-retro-diamond-coaster', 'original-christmas-bauble-ornament', 'original-latin-cross'].includes(pattern.id) ? 788 : 586} height={['original-retro-diamond-coaster', 'original-christmas-bauble-ornament', 'original-latin-cross'].includes(pattern.id) ? 908 : 586} unoptimized className="h-auto w-full" />
                        </a>
                        <p className="mt-3 text-sm leading-6 text-[#59685d]">Blank cells are empty. Tap the chart to view it at full size.</p>
                    </section>
                    <section aria-labelledby="pattern-colors-heading">
                        <h2 id="pattern-colors-heading" className="section-heading mb-5">Colors &amp; bead counts</h2>
                        <div className="rounded-xl border border-[#d9ded5] bg-white px-4 sm:px-5">
                            <table className="w-full text-left text-sm text-[#43564d]">
                                <caption className="sr-only">Perler colors for {pattern.title}; {pattern.beads} beads in total</caption>
                                <thead><tr className="border-b border-[#d9ded5] text-[#243e36]"><th scope="col" className="py-3">Symbol</th><th scope="col" className="py-3">Perler color</th><th scope="col" className="py-3 text-right">Beads</th></tr></thead>
                                <tbody>{pattern.palette.map((color) => <tr key={color.ref} className="border-b border-[#e7eae2]"><td className="py-3"><span aria-hidden="true" className="mr-2 inline-block h-3 w-3 rounded-full border border-black/20 align-middle" style={{ backgroundColor: color.hex }} />{color.symbol}</td><td className="py-3"><span className="font-medium">{color.name}</span><br /><span className="text-xs text-[#59685d]">{color.ref}</span></td><td className="py-3 text-right tabular-nums">{color.count}</td></tr>)}</tbody>
                                <tfoot><tr><th scope="row" colSpan={2} className="py-3">Total</th><td className="py-3 text-right font-bold tabular-nums">{pattern.beads}</td></tr></tfoot>
                            </table>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#59685d]">Colors are matched to the Perler palette. Screen colors and physical beads may differ.</p>
                    </section>
                </div>
                <section className="mt-12 max-w-[70ch] border-t border-[#d9ded5] pt-8">
                    <h2 className="section-heading">Making this pattern</h2>
                    <ul className="mt-5 list-disc space-y-3 pl-5 leading-8 text-[#43564d] marker:text-[#78917f]">{pattern.notes.map((note) => <li key={note}>{note}</li>)}</ul>
                    <p className="mt-5 leading-8 text-[#43564d]">New to beadwork? Check the <Link href="/guides/perler-bead-pegboards" className="text-link">pegboard size guide</Link> and <Link href="/guides/perler-bead-kits-and-storage" className="text-link">beginner supplies guide</Link>.</p>
                </section>
                <CoasterInstructions patternId={pattern.id} />
                <OrnamentInstructions patternId={pattern.id} />
                <details className="mt-8 border-t border-[#d9ded5] pt-5 text-sm leading-7 text-[#59685d]">
                    <summary className="min-h-11 cursor-pointer font-semibold text-[#243e36]">{pattern.source ? 'Reference version & source' : 'About this original design'}</summary>
                    {pattern.source ? <div className="mt-3 max-w-[70ch]"><p>{pattern.source.description}</p><a href={pattern.source.url} target="_blank" rel="noopener noreferrer" className="text-link mt-2 inline-block">{pattern.source.label}</a></div> : <p className="mt-3">An original design on a bead grid. It does not depict a named game or anime character.</p>}
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2"><a href={pattern.assets.project} download data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-format="project" data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="text-link">Download editable project</a><a href={pattern.assets.pixels} download data-pattern-event="pattern_download" data-pattern-id={pattern.id} data-pattern-format="png" data-pattern-palette="perler" data-pattern-entry="pattern_detail" className="text-link">Download pattern pixels</a></div>
                </details>
                {hasChristmasTopic && <p className="mt-6"><Link href="/patterns/christmas" className="text-link">More Christmas patterns</Link></p>}
            </article>
            {related.length > 0 && <section className="mt-16 border-t border-[#d9ded5] pt-8 sm:pt-10"><h2 className="section-heading mb-7">More {collection?.title ?? 'original'} patterns</h2><PatternGrid patterns={related.map(toPatternCard)} headingLevel={3} /></section>}
        </>
    );
}

export default async function PatternRoute({ params }: Props) {
    const slug = (await params).segments.join('/');
    const topic = getPatternTopicBySlug(slug);
    const collection = getCollectionBySlug(slug);
    const pattern = getPatternBySlug(slug);
    if (!collection && !pattern && !topic) notFound();
    const collectionPatterns = collection ? getPatternsForCollection(collection.id) : [];
    const fewestColors = getFewestColorsPattern(collectionPatterns);
    return (
        <>
            <SiteHeader active="patterns" />
            <main id="main-content" tabIndex={-1} className="page-shell flex-1 pb-16 sm:pb-24">
                {topic ? <PatternTopicPage topic={topic} /> : pattern ? <PatternDetail pattern={pattern} /> : <>
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Patterns', href: '/patterns' }, { label: collection!.title, href: `/patterns/${collection!.slug}` }]} />
                    <h1 className="page-heading pt-4 sm:pt-8">{collection!.title} Perler Bead Patterns</h1>
                    <p className="mb-10 mt-5 max-w-[65ch] text-base leading-8 text-[#59685d] sm:text-lg">{getCollectionIntro(collection!, collectionPatterns)}</p>
                    <PatternGrid patterns={collectionPatterns.map(toPatternCard)} />
                    <section className="mt-14 max-w-[70ch] border-t border-[#d9ded5] pt-8" aria-labelledby="choosing-pattern-heading">
                        <h2 id="choosing-pattern-heading" className="section-heading">Choosing a {collection!.title} pattern</h2>
                        {fewestColors && <p className="mt-4 leading-8 text-[#43564d]">Looking for fewer colors to gather? <Link href={getPatternHref(fewestColors)} className="text-link">{getPatternDisplayName(fewestColors)}</Link> uses {fewestColors.colorCount} Perler colors and {fewestColors.beads} beads, the fewest colors in this collection. Check the individual pattern for its layout and any delicate connections before starting.</p>}
                        <p className="mt-4 leading-8 text-[#43564d]">Each pattern page includes its grid size, bead counts by color and printable downloads. Blank grid cells stay empty; the number of positions on a board is not the number of beads you need.</p>
                        <p className="mt-4 leading-8 text-[#43564d]">Using another brand? Follow the <Link href={brandGuideHref} className="text-link">Hama and Artkal conversion guide</Link> to match the colors in the editor and export a new chart. Keep the board settings unchanged to preserve the bead positions and empty spaces.</p>
                    </section>
                    <p className="mt-8 leading-8 text-[#43564d]"><Link href="/patterns" className="text-link">Browse all patterns</Link> to explore more themes.</p>
                </>}
            </main>
            <SiteFooter active="patterns" />
        </>
    );
}

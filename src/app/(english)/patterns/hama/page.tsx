import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { getPatternById, getPatternHref } from '@/lib/patterns/catalog';
import { hamaPatterns } from '@/lib/patterns/hama';
import { hamaLanguageAlternates } from '@/lib/i18n/metadata';

const title = 'Free Hama Bead Patterns: Printable Midi Templates | Fuse Bead Patterns';
const description = 'Download six free Hama Midi bead patterns with Hama colour numbers. A4 and US Letter PDFs, plus editable projects for a football, ghost, bat and Christmas designs.';
const preview = '/patterns-hama/original-friendly-ghost/preview.png';
const url = 'https://fusebeadpatterns.art/patterns/hama';

export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/patterns/hama', languages: hamaLanguageAlternates },
    openGraph: { title, description, url, type: 'website', images: [{ url: preview, width: 580, height: 580, alt: 'Ghost Hama Midi bead pattern' }] },
    twitter: { card: 'summary_large_image', title, description, images: [preview] },
};

export default function HamaPatternsPage() {
    return (
        <>
            <SiteHeader active="patterns" />
            <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
                <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Patterns', href: '/patterns' }, { label: 'Hama patterns', href: '/patterns/hama' }]} />
                <h1 className="page-heading">Free Hama Bead Patterns</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted sm:text-lg">
                    Choose a design and download its Hama Midi template, ready to print. Each of these six original patterns uses Hama colour numbers and fits a single 29 × 29 grid. No account needed.
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                    Use 5 mm Midi beads. Choose A4 or US Letter, print at 100% / actual size, then check both 50 mm rulers and your pegboard. These templates are not sized for Mini or Maxi beads.
                </p>
                <section aria-label="Printable Hama Midi patterns" className="mt-9">
                    <div className="pattern-grid">
                        {hamaPatterns.map(({ id, name, projectId, preview, pdfA4, pdfLetter, project }) => {
                            const original = getPatternById(id);
                            if (!original) throw new Error(`Hama original pattern is missing: ${id}`);
                            const tracking = { 'data-pattern-id': projectId, 'data-pattern-palette': 'hama', 'data-pattern-entry': 'collection' };
                            return (
                                <article key={id} id={id} className="pattern-card" data-pattern-card={projectId} aria-labelledby={`${id}-title`}>
                                    <a href={pdfA4} download={`${id}-hama-a4.pdf`} className="block rounded-[10px]"
                                        aria-label={`${name}: download Hama A4 PDF`} data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>
                                        <div className="pattern-art">
                                            <Image src={preview} alt={`${name} Hama Midi bead pattern`} width={580} height={580} unoptimized className="pattern-image" />
                                        </div>
                                        <div className="pattern-card-title"><h2 id={`${id}-title`}>{name}</h2><span aria-hidden="true">↓</span></div>
                                    </a>
                                    <div className="flex flex-wrap gap-x-5">
                                        <a href={pdfA4} download={`${id}-hama-a4.pdf`} className="text-link" aria-label={`${name}: download Hama A4 PDF`}
                                            data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>A4 PDF</a>
                                        <a href={pdfLetter} download={`${id}-hama-letter.pdf`} className="text-link" aria-label={`${name}: download Hama US Letter PDF`}
                                            data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>US Letter PDF</a>
                                        <Link href={`/editor?pattern=${projectId}`} prefetch={false} className="text-link" aria-label={`Edit ${name} in Hama colours`}
                                            data-pattern-event="pattern_editor_open" {...tracking}>Edit</Link>
                                    </div>
                                    <div className="flex flex-wrap gap-x-5 text-xs text-muted">
                                        <a href={project} download={`${id}-hama.bead-pattern.json`} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent"
                                            aria-label={`${name}: save editable Hama project`} data-pattern-event="pattern_download" data-pattern-format="project" {...tracking}>Save project</a>
                                        <Link href={getPatternHref(original)} prefetch={false} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent">Perler version</Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
                <section aria-labelledby="hama-colours" className="mt-14 max-w-3xl border-t border-line pt-8">
                    <h2 id="hama-colours" className="section-heading">Hama colours, ready to use</h2>
                    <p className="mt-4 leading-7 text-muted">
                        The PDFs include a symbol chart and a bead count for each colour. They use selected solid Hama Midi colours, including 01 White and 18 Black. In the editor, these appear as H01 and H18: the H prefix identifies our software palette; the number identifies the Hama colour.
                    </p>
                    <p className="mt-3 leading-7 text-muted">
                        The previews, PDFs and saved projects use the same colours and bead positions. Choose Edit to adjust individual beads or change the palette, or save a project file to open later using Open Project in the editor. Changing brand can merge similar colours; export a new chart after editing.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        Screen and printed colours are approximate. These original designs have not been physically assembled or iron-tested. Follow the instructions for your beads and check the strength of a finished piece before using it. Fuse Bead Patterns is independent of Hama.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        Check the <a href="https://hama.dk/en/pages/colour-chart" className="underline underline-offset-4">Hama colour chart</a> for colour numbers and the <a href="https://hama.dk/pages/faq" className="underline underline-offset-4">Hama size guide (Danish)</a> for Midi, Mini and Maxi dimensions.
                    </p>
                </section>
                <section aria-labelledby="hama-printing" className="mt-10 max-w-3xl">
                    <h2 id="hama-printing" className="section-heading">Printing your template</h2>
                    <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted">
                        <li>Download the PDF for your paper size. Select 100% or Actual size and turn off Fit to page.</li>
                        <li>Measure the horizontal and vertical 50 mm rulers on the printed page. Check the 5 mm grid against your own pegboard before using it as a placement guide.</li>
                        <li>Follow the symbols and colour list. Leave empty cells without beads; white cells with a symbol need white beads.</li>
                    </ol>
                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                        <Link href="/guides/perler-bead-pegboards" className="text-link">Pegboards and print calibration</Link>
                        <Link href="/guides/perler-to-hama-artkal" className="text-link">Switch bead brands</Link>
                        <Link href="/guides/perler-vs-hama-vs-artkal" className="text-link">Compare Perler, Hama and Artkal</Link>
                    </div>
                </section>
            </main>
            <SiteFooter active="patterns" />
        </>
    );
}

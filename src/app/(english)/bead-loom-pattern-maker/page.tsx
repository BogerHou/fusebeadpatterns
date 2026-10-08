import type { Metadata } from 'next';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import LoomWorkspace from '@/components/bead-loom/LoomWorkspace';

const title = 'Free Bead Loom Pattern Maker — PDF & Row Instructions';
const description = 'Make a bead loom pattern with your own colors. Draw or convert an image, count beads, and download a lettered A4 or US Letter PDF, chart PNG and editable project.';

export const metadata: Metadata = {
    title,
    description,
    keywords: ['bead loom pattern maker', 'bead loom pattern generator', 'printable bead loom chart'],
    alternates: { canonical: '/bead-loom-pattern-maker' },
    openGraph: {
        title,
        description,
        url: 'https://fusebeadpatterns.art/bead-loom-pattern-maker',
        siteName: 'Fuse Bead Patterns',
        type: 'website',
        images: [],
    },
    twitter: { card: 'summary', title, description, images: [] },
};

export default function BeadLoomPage() {
    return <>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Bead Loom Pattern Maker', href: '/bead-loom-pattern-maker' }]} />
            <h1 className="page-heading">Bead Loom Pattern Maker</h1>
            <p className="mt-4 max-w-[70ch] text-base leading-7 text-[#59685d]">Make a free bead loom pattern with your own colors. Draw or start from an image, then download a lettered PDF, chart PNG and row-by-row instructions. No account needed.</p>
            <LoomWorkspace />
            <section className="mt-10 max-w-[75ch] border-t border-[#d9ded5] pt-8 text-base leading-7 text-[#59685d]" aria-labelledby="loom-help">
                <h2 id="loom-help" className="font-display text-2xl font-semibold text-[#243e36]">Plan the chart around your beads</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5">
                    <li>Choose the number of beads across and the number of rows. For the bead shape, divide the measured width of one bead space by the measured height of one row in a sample. This changes the chart shape and how an image is fitted.</li>
                    <li>Add the colors you actually have. The starting colors are an editable example palette. Names and bead codes are your own labels; image matching uses screen RGB colors, not an official brand color catalogue.</li>
                    <li>Pick a starting corner and whether successive rows alternate direction. Row 1 starts at that corner. Columns always count from the left of the chart. Letters identify colors even when printed in black and white.</li>
                    <li>Check the chart and row instructions, then export A4 or US Letter. Each cell is one bead, including the background. Counts exclude spare beads, thread and finishing materials.</li>
                </ol>
                <p className="mt-5">This tool makes filled rectangular charts for loom beadwork. It does not create peyote, brick-stitch or fuse-bead patterns. The PDF is a reading chart, not a life-size template. Bead finish, thread tension and weaving method affect the result; measure a sample and follow your loom instructions.</p>
                <p className="mt-5">Images and projects stay in this browser. Save a project before leaving to keep the chart, palette and reading settings. The original image and undo history are not stored in the project.</p>
            </section>
        </main>
        <SiteFooter active="bead-loom" description="Create a bead loom chart with your own palette, check the row instructions, and save a printable chart and editable project from your browser." />
    </>;
}

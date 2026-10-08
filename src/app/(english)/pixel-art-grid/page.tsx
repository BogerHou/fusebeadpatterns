import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import PixelGridWorkspace from '@/components/pixel-grid/PixelGridWorkspace';

const title = 'Pixel Art Grid Maker — Draw & Export PNG | Fuse Bead Patterns';
const description = 'Draw on a free pixel art grid or import an image. Choose a custom size up to 128 × 128, edit individual pixels, and download a transparent PNG or editable project.';

export const metadata: Metadata = {
    title,
    description,
    keywords: ['pixel art grid', 'pixel grid maker', 'grid for pixel art', 'transparent pixel art PNG'],
    alternates: { canonical: '/pixel-art-grid' },
    openGraph: {
        title,
        description,
        url: 'https://fusebeadpatterns.art/pixel-art-grid',
        siteName: 'Fuse Bead Patterns',
        type: 'website',
        images: [],
    },
    twitter: { card: 'summary', title, description, images: [] },
};

export default function PixelArtGridPage() {
    return (
        <>
            <SiteHeader />
            <main id="main-content" tabIndex={-1} className="page-shell flex-1">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Pixel Art Grid', href: '/pixel-art-grid' },
                ]} />
                <div className="mb-8">
                    <h1 className="page-heading">Pixel Art Grid Maker</h1>
                    <p className="mt-4 max-w-[65ch] text-base leading-7 text-[#59685d]">
                        Start with a blank grid or an image. Draw individual pixels,
                        then save a transparent PNG and editable project.
                    </p>
                    <p className="mt-3 text-sm">
                        <a href="/fr/image-en-pixel-art" lang="fr" hrefLang="fr" className="text-link text-accent">Français : convertir une image en pixel art</a>
                    </p>
                </div>
                <PixelGridWorkspace />
                <section aria-labelledby="pixel-grid-help" className="mt-10 max-w-[75ch] border-t border-[#d9ded5] pt-8 text-base leading-7 text-[#59685d]">
                    <h2 id="pixel-grid-help" className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#243e36]">From a grid to a finished image</h2>
                    <ol className="mt-4 list-decimal space-y-3 pl-5">
                        <li>Choose a width and height from 1 to 128 pixels. Start blank, or import a static PNG, JPEG, or WebP image.</li>
                        <li>Use Brush and Eraser to edit individual cells. Zoom in for small details, use Pan to move around, and Undo to reverse a whole stroke.</li>
                        <li>Download the original-size PNG for your finished image. Save a project too if you want to reopen your pixels later.</li>
                    </ol>
                    <p className="mt-5">
                        Each cell becomes one pixel in the original-size PNG. Transparent cells stay transparent;
                        the separate Grid PNG adds visible grid lines at a larger size.
                        Image import resizes your source without automatically reducing its colors.
                    </p>
                    <p className="mt-5">
                        Need bead colors and a printable pattern?{' '}
                        <Link href="/#generator" className="font-medium text-[#28614e] underline decoration-1 underline-offset-4">Open the bead pattern generator</Link>.
                    </p>
                </section>
            </main>
            <SiteFooter active="pixel-grid" />
        </>
    );
}

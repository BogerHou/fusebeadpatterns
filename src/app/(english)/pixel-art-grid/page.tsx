import { pixelLanguageAlternates } from '@/lib/i18n/metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import PixelGridWorkspace from '@/components/pixel-grid/PixelGridWorkspace';
import PixelConversionExamples from '@/components/pixel-grid/PixelConversionExamples';
import PixelPracticeProvider from '@/components/pixel-grid/PixelPracticeProvider';

const title = 'Pixel Art Grid Maker & Image to Pixel Art Converter | Fuse Bead Patterns';
const description = 'Draw on a pixel art grid or use our image to pixel art converter online. Compare 32x32 and 64x64 sizes, edit pixels, and export PNG or bead patterns.';
const pageUrl = 'https://fusebeadpatterns.art/pixel-art-grid';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: '/pixel-art-grid', languages: pixelLanguageAlternates },
    openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: 'Fuse Bead Patterns',
        locale: 'en_US',
        type: 'website',
        images: ['/opengraph-image.png'],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image.png'] },
};

const applicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Pixel Art Grid Maker & Image to Pixel Art Converter',
    description,
    url: pageUrl,
    inLanguage: 'en',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'All',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function PixelArtGridPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema).replace(/</g, '\\u003c') }} />
            <SiteHeader />
            <main id="main-content" tabIndex={-1} className="page-shell flex-1">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Pixel Art Grid', href: '/pixel-art-grid' },
                ]} />
                <div className="mb-8">
                    <h1 className="page-heading">Pixel Art Grid Maker</h1>
                    <p className="mt-4 max-w-[65ch] text-base leading-7 text-[#59685d]">
                        Start with a blank grid or convert a photo to pixel art. Keep the original colors
                        or choose a smaller palette, edit individual pixels, then save a PNG and editable project.
                    </p>
                </div>
                <PixelPracticeProvider>
                    <PixelGridWorkspace />
                    <PixelConversionExamples />
                </PixelPracticeProvider>
                <section aria-labelledby="pixel-grid-help" className="mt-10 max-w-[75ch] border-t border-[#d9ded5] pt-8 text-base leading-7 text-[#59685d]">
                    <h2 id="pixel-grid-help" className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#243e36]">From a grid to a finished image</h2>
                    <ol className="mt-4 list-decimal space-y-3 pl-5">
                        <li>Choose a width and height from 1 to 128 pixels. Start blank, or import a static PNG, JPEG, or WebP image. The image buttons let you compare 32, 64 and 128 pixels of detail.</li>
                        <li>Keep the original colors, or choose a maximum of 8, 16, 32 or 64 colors in Canvas &amp; image settings. Apply the limit to your drawing or reconvert the original image. Fewer colors can remove small details; Undo restores the previous drawing.</li>
                        <li>Use Brush and Eraser to edit individual cells. Zoom in for small details, use Pan to move around, and Undo to reverse a whole stroke.</li>
                        <li>Download the original-size PNG, or choose an integer enlargement for a larger image without grid lines. Save a project too if you want to reopen your pixels later.</li>
                    </ol>
                    <p className="mt-5">
                        Each cell becomes one pixel in the original-size PNG. Transparent cells stay transparent;
                        the separate Grid PNG adds visible grid lines at a larger size.
                        Image import keeps the sampled colors unless you choose a color limit.
                        Enlargement makes each pixel a crisp square; it adds no detail and does not remove the background.
                    </p>
                    <p className="mt-5">
                        Reconvert uses the original image and replaces your edits; Undo brings them back.
                        Save an editable project for the current pixels and transparency, or a full workspace
                        to keep the original image pixels, settings and history too. Save and reopen these files
                        yourself; there is no automatic saving. Images are processed on your device.
                    </p>
                    <p className="mt-5">
                        To use your current drawing, choose “Make a bead pattern” in the workspace and select a bead brand. Each pixel becomes one bead position; empty cells complete the boards without resizing. You can return to your pixel drawing with its original colors.
                    </p>
                    <p className="mt-5">
                        Starting from a different image?{' '}
                        <Link href="/#generator" className="font-medium text-[#28614e] underline decoration-1 underline-offset-4">Open the bead pattern generator</Link>.
                    </p>
                </section>
            </main>
            <SiteFooter active="pixel-grid" />
        </>
    );
}

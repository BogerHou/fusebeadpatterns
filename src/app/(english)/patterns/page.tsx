import { patternLanguageAlternates } from '@/lib/i18n/metadata';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import LocalizedPatternCatalog from '@/components/patterns/LocalizedPatternCatalog';
import PatternLibraryHelp from '@/components/patterns/PatternLibraryHelp';

const title = 'Free Printable Perler Bead Patterns | Fuse Bead Patterns';
const description = 'Find free printable Perler bead patterns featuring Stardew Valley characters, Pokémon, and Halloween designs. Choose a picture and download its pattern.';
const preview = '/patterns/sdv-blue-chicken/preview.png';

export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/patterns', languages: patternLanguageAlternates() },
    openGraph: { title, description, url: 'https://fusebeadpatterns.art/patterns', type: 'website', images: [{ url: preview, width: 580, height: 580, alt: 'Stardew Valley Blue Chicken Perler bead pattern' }] },
    twitter: { card: 'summary_large_image', title, description, images: [preview] },
};

export default function PatternsPage() {
    return (
        <>
            <SiteHeader active="patterns" />
            <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
                <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Patterns', href: '/patterns' }]} />
                <h1 className="page-heading">Free Printable Perler Bead Patterns</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 sm:text-lg">Explore Stardew Valley, Pokémon, Minecraft, Super Mario, Kirby, and Halloween bead patterns. Choose a picture to download its free printable pattern.</p>
                <LocalizedPatternCatalog locale="en" />
                <PatternLibraryHelp locale="en" />
            </main>
            <SiteFooter active="patterns" />
        </>
    );
}

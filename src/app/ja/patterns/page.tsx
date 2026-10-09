import { patternLanguageAlternates } from '@/lib/i18n/metadata';
import type { Metadata } from 'next';
import JapanesePatternLibrary from '@/components/patterns/JapanesePatternLibrary';
import { localizedLibraryMetadata } from '@/lib/patterns/library-overview';

const { title, description } = localizedLibraryMetadata.ja;
const preview = '/patterns/pokemon-pikachu-gen5/preview.png';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: '/ja/patterns', languages: patternLanguageAlternates() },
    openGraph: {
        title, description, locale: 'ja_JP', type: 'website',
        url: 'https://fusebeadpatterns.art/ja/patterns',
        siteName: 'Fuse Bead Patterns',
        images: [{ url: preview, width: 580, height: 580, alt: 'ピカチュウのアイロンビーズ図案' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [preview] },
};

export default function JapanesePatternsPage() {
    return <JapanesePatternLibrary />;
}

import type { Metadata } from 'next';
import JapanesePatternLibrary from '@/components/patterns/JapanesePatternLibrary';

const title = 'アイロンビーズの無料図案・印刷用PDF | Fuse Bead Patterns';
const description = 'ポケモンやスーパーマリオのアイロンビーズ図案12点を無料でダウンロード。日本語の案内で、印刷用PDFとマス目付きPNGから好きな図案を選べます。PDFは日本語の説明・材料表付きです。';
const preview = '/patterns/pokemon-pikachu-gen5/preview.png';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: '/ja/patterns' },
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

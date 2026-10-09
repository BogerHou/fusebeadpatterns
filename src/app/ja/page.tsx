import type { Metadata } from 'next';
import LocalizedGeneratorPage from '@/components/layout/LocalizedGeneratorPage';
import { homeLanguageAlternates } from '@/lib/i18n/metadata';

const title = 'アイロンビーズ図案作成ツール｜写真から無料で作成';
const description = '写真やイラストからアイロンビーズ図案を無料で作成。日本語でサイズと配色を選び、マスを修正してPDF・PNGを保存できます。Perler・Hama・Artkalのミディ用、登録不要。';

export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/ja', languages: homeLanguageAlternates },
    openGraph: {
        title, description, url: 'https://fusebeadpatterns.art/ja', locale: 'ja_JP', type: 'website',
        images: [{ url: '/patterns/original-friendly-ghost/preview.png', width: 580, height: 580, alt: '白いゴーストのアイロンビーズ図案' }],
    },
};

export default function JapaneseGeneratorPage() {
    return <LocalizedGeneratorPage locale="ja" structuredData={{
        '@context': 'https://schema.org', '@type': 'WebApplication',
        name: title, description, url: 'https://fusebeadpatterns.art/ja',
        applicationCategory: 'DesignApplication', operatingSystem: 'Any modern web browser',
        inLanguage: 'ja', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: ['画像から図案を作成', 'ミディ用プレートの枚数とブランドを選択', 'マスの修正と取り消し', '日本語PDFと図案PNGを保存', 'プロジェクトの保存と再開'],
    }} />;
}

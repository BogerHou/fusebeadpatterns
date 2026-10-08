import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JapaneseGenerator from '@/components/japanese/JapaneseGenerator';

const title = 'アイロンビーズ図案作成ツール｜写真から無料で作成';
const description = '写真やイラストからアイロンビーズ図案を無料で作成。日本語でサイズと配色を選び、マスを修正してPDF・PNGを保存できます。Perler・Hama・Artkalのミディ用、登録不要。';

export const metadata: Metadata = {
    title, description,
    alternates: { canonical: '/ja' },
    openGraph: {
        title, description, url: 'https://fusebeadpatterns.art/ja', locale: 'ja_JP', type: 'website',
        images: [{ url: '/patterns/original-friendly-ghost/preview.png', width: 580, height: 580, alt: '白いゴーストのアイロンビーズ図案' }],
    },
};

export default function JapaneseGeneratorPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="site-header">
                <a href="#main-content" className="skip-link">本文へ移動</a>
                <div className="site-header-inner">
                    <Link href="/ja" className="site-brand" aria-label="Fuse Bead Patterns 日本語ホーム">
                        <Image src="/logo.png" alt="" width={36} height={36} />
                        <span lang="en" className="site-brand-name">Fuse Bead Patterns<span aria-hidden="true">.</span></span>
                    </Link>
                    <nav className="site-nav" aria-label="メインメニュー">
                        <a href="#generator" aria-current="page">図案を作る</a>
                        <Link href="/ja/patterns">無料の図案</Link>
                        <Link href="/ja/guides/photo-to-perler-bead-pattern">作り方</Link>
                        <Link href="/" hrefLang="en" prefetch={false}>English</Link>
                    </nav>
                </div>
            </header>
            <main id="main-content" tabIndex={-1} className="page-shell flex-1 pb-16">
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    '@context': 'https://schema.org', '@type': 'WebApplication',
                    name: title, description, url: 'https://fusebeadpatterns.art/ja',
                    applicationCategory: 'DesignApplication', operatingSystem: 'Any modern web browser',
                    inLanguage: 'ja', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                    featureList: ['画像から図案を作成', 'ミディ用プレートの枚数とブランドを選択', 'マスの修正と取り消し', '日本語PDFと図案PNGを保存', 'プロジェクトの保存と再開'],
                }).replace(/</g, '\\u003c') }} />
                <h1 className="page-heading max-w-4xl !leading-snug">アイロンビーズの図案を作る</h1>
                <p className="mt-5 max-w-3xl leading-8 text-muted">写真やイラストを読み込み、配色とプレートの枚数を選びます。気になるマスを直したら、日本語の印刷用PDFや図案PNGを保存できます。</p>
                <p className="mt-3 text-sm leading-7 text-muted">無料・登録不要。画像の変換はブラウザー内で行い、サーバーへ送信しません。自分で撮影・制作した画像など、利用できる画像を選んでください。</p>
                <section id="generator" aria-label="日本語の図案作成ツール" className="mt-8">
                    <JapaneseGenerator />
                </section>
                <section className="mt-12 max-w-3xl border-t border-line pt-8" aria-labelledby="print-help">
                    <h2 id="print-help" className="section-heading">印刷前に確認すること</h2>
                    <p className="mt-4 leading-8 text-muted">PDFは29×29マスのプレートごとにA4で分かれ、1マスの間隔は5 mmです。倍率100％（実際のサイズ）で印刷し、50 mmの線と、お手持ちのプレートの間隔を確認してください。PNGは画面で見る図案です。原寸の印刷にはPDFを使ってください。</p>
                    <p className="mt-4 leading-8 text-muted">画面の色と実物のビーズの色は異なる場合があります。色番号は選択したブランドのものです。ミニビーズや丸形プレート用の原寸図案ではありません。仕上げは使用するビーズの説明に従ってください。</p>
                    <p className="mt-4 leading-8 text-muted">完成済みの図案なら<Link href="/ja/patterns" className="text-link">日本語の無料図案一覧</Link>から選べます。より詳しい調整機能は<Link href="/editor" hrefLang="en" prefetch={false} className="text-link">英語版エディター</Link>をご利用ください。</p>
                </section>
            </main>
            <footer className="border-t border-line px-6 py-8 text-sm leading-7 text-muted">
                <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2">
                    <span lang="en">Fuse Bead Patterns</span>
                    <Link href="/ja/patterns">図案一覧</Link>
                    <Link href="/privacy-policy" hrefLang="en" prefetch={false}>プライバシー（英語）</Link>
                    <a href="mailto:contact@fusebeadpatterns.art">お問い合わせ</a>
                </div>
            </footer>
        </div>
    );
}

import { pixelLanguageAlternates } from '@/lib/i18n/metadata';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import type { Metadata } from 'next';
import Link from 'next/link';
import PixelGridWorkspace from '@/components/pixel-grid/PixelGridWorkspace';
import PixelConversionExamples from '@/components/pixel-grid/PixelConversionExamples';

const title = 'ドット絵変換｜写真・画像から無料で作成';
const description = '写真やイラストをブラウザー内でドット絵に変換。サイズと色数を選び、1マスずつ修正して透過PNGを保存できます。無料・登録不要。';
const pageUrl = 'https://fusebeadpatterns.art/ja/pixel-art-converter';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: pageUrl, languages: pixelLanguageAlternates },
    openGraph: { title, description, url: pageUrl, locale: 'ja_JP', siteName: 'Fuse Bead Patterns', type: 'website', images: [] },
    twitter: { card: 'summary', title, description, images: [] },
};

export default function JapanesePixelConverterPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org', '@type': 'WebApplication',
                name: 'ドット絵変換', description, url: pageUrl, inLanguage: 'ja',
                applicationCategory: 'DesignApplication', operatingSystem: 'Web',
            }).replace(/</g, '\\u003c') }} />
            <SiteHeader locale="ja" />
            <main id="main-content" tabIndex={-1} className="page-shell flex-1 pb-16">
                <nav aria-label="パンくずリスト" className="mb-6 text-sm text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <li><Link href="/ja" prefetch={false} className="text-link">日本語ホーム</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">ドット絵変換</li>
                    </ol>
                </nav>
                <div className="mb-8">
                    <h1 className="page-heading !leading-snug">写真・画像をドット絵に変換</h1>
                    <p className="mt-4 max-w-3xl leading-8 text-muted">画像を選び、ドットの細かさと色数を調整します。気になるマスを直して、PNGを保存できます。無料・登録不要。画像の処理はこのブラウザー内で行います。</p>
                </div>
                <PixelGridWorkspace locale="ja" experience="converter" />
                <PixelConversionExamples locale="ja" />
                <section aria-labelledby="conversion-help" className="mt-10 max-w-3xl border-t border-line pt-8 leading-8 text-muted">
                    <h2 id="conversion-help" className="section-heading">画像を選んで、PNGで保存</h2>
                    <p className="mt-4">静止画のPNG・JPEG・WebPに対応しています。ファイルは8 MiB以下、縦横とも2,048ピクセル以下の画像を選んでください。画像をサーバーへ送信しません。自分で撮影・制作した画像など、利用できる画像を使ってください。</p>
                    <p className="mt-5">最初のキャンバスは64×64マスです。大きなドットなら32×32、細部を残すなら128×128を試せます。幅と高さはそれぞれ1〜128マスで指定できます。「縦横比を保つ」では画像全体が収まり、縦横比によって透明な余白ができます。「中央で切り抜く」ではキャンバスいっぱいに画像が入ります。</p>
                    <p className="mt-5">元の色を保つか、8・16・32・64色を上限に減色します。少ない色数では細部が失われることがあるため、結果を見ながらブラシと消しゴムで修正してください。元画像から再変換すると修正内容が置き換わります。「元に戻す」で直前の状態に戻せます。</p>
                    <p className="mt-5">原寸PNGでは1マスが1ピクセルになります。64×64マスなら64×64ピクセルの画像です。大きく表示したいときは整数倍のPNGを選んでください。拡大しても細部は増えません。透過は元画像や編集結果の透明部分を保つ機能です。写真の背景を自動で消す機能ではありません。</p>
                    <p className="mt-5">続きを編集するにはプロジェクトも保存してください。現在のピクセル、サイズ、透明度を保存します。元画像、減色の設定、操作履歴は含まれません。自動保存はありません。</p>
                    <p className="mt-5">ビーズの色番号や印刷用PDFが必要なときは、<Link href="/ja" prefetch={false} className="text-link">アイロンビーズ図案作成ツール</Link>を使ってください。このツールのグリッド付きPNGは、プレートに重ねる原寸図案ではありません。</p>
                </section>
            </main>
            <SiteFooter locale="ja" />
        </>
    );
}

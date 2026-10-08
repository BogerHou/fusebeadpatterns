import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

const pagePath = '/ja/guides/photo-to-perler-bead-pattern';
const title = '画像からアイロンビーズ図案を作る方法 | Fuse Bead Patterns';
const description = '写真やイラストからアイロンビーズ図案を作る手順を、日本語の画面に沿って紹介。画像の読み込み、ブランドと枚数の設定、マスの修正、日本語PDFの保存とプロジェクトの再開まで確認できます。';
const sourceImage = '/patterns/ghost-cat-pumpkin/pixels.png';
const previewImage = '/patterns/ghost-cat-pumpkin/preview.png';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: pagePath },
    openGraph: {
        title,
        description,
        locale: 'ja_JP',
        type: 'article',
        url: `https://fusebeadpatterns.art${pagePath}`,
        siteName: 'Fuse Bead Patterns',
        images: [{
            url: previewImage,
            width: 580,
            height: 580,
            alt: '練習用のオリジナルイラスト：かぼちゃを抱えたゴーストキャット',
        }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [previewImage] },
};

const setupOptions = [
    ['ビーズのブランド', 'Perler Midi'],
    ['横のプレート数', '1枚'],
    ['縦のプレート数', '1枚'],
];

const editingTools = [
    ['色を置く', '選んだ色をマスに置く'],
    ['消す', 'ビーズを消し、空白にする'],
    ['移動・スクロール', '図案を描き変えずに表示位置を動かす'],
    ['元に戻す／やり直す', 'マスの編集を戻す／やり直す'],
];

export default function JapanesePhotoPatternGuide() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="site-header">
                <a href="#main-content" className="skip-link">本文へ移動</a>
                <div className="site-header-inner">
                    <Link href="/ja/patterns" className="site-brand" aria-label="Fuse Bead Patterns 日本語の図案一覧">
                        <Image src="/logo.png" alt="" width={36} height={36} sizes="36px" />
                        <span lang="en" className="site-brand-name">Fuse Bead Patterns<span className="text-accent" aria-hidden="true">.</span></span>
                    </Link>
                    <nav className="site-nav" aria-label="メインメニュー">
                        <Link href="/ja">図案を作る</Link>
                        <Link href="/ja/patterns">無料の図案</Link>
                        <Link href="/#generator" hrefLang="en" prefetch={false}>作成ツール（英語）</Link>
                    </nav>
                </div>
            </header>

            <main id="main-content" tabIndex={-1} className="page-shell flex-1">
                <nav aria-label="パンくずリスト" className="mb-6 text-xs font-medium text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2">
                        <li><Link href="/" hrefLang="en" className="inline-flex min-h-10 items-center hover:underline">ホーム（英語）</Link></li>
                        <li aria-hidden="true">/</li>
                        <li><Link href="/ja/patterns" className="inline-flex min-h-10 items-center hover:underline">日本語の図案</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">画像から図案を作る</li>
                    </ol>
                </nav>

                <article className="max-w-3xl">
                    <h1 className="page-heading !text-3xl !leading-snug sm:!text-4xl">画像からアイロンビーズの図案を作る方法</h1>
                    <p className="mt-5 text-base leading-8 text-muted sm:text-lg">
                        写真やイラストを図案にするときは、少ないマスでも形がわかるように整えるのがコツです。
                        画像を読み込み、配色とサイズを決め、必要な部分を直してPDFに保存するまでを紹介します。
                    </p>
                    <p className="mt-4 leading-8 text-muted">
                        このガイドでは<Link href="/ja" prefetch={false} className="text-link">日本語の図案作成ツール</Link>を使います。
                        完成済みの図案が欲しい場合は、<Link href="/ja/patterns" className="text-link">日本語の無料図案一覧</Link>から直接保存できます。
                    </p>
                    <p className="mt-4 leading-8 text-muted">
                        配色はPerler Midi・Hama Midi・Artkal Aから選べます。29×29マスのミディ用プレートを、縦横それぞれ1〜4枚使う図案に対応しています。
                        編集を始めたら、ページを離れる前にプロジェクトを保存してください。
                    </p>
                    <Link href="/ja#generator" prefetch={false} className="button-primary mt-6">
                        日本語で図案を作る<span aria-hidden="true">↗</span>
                    </Link>

                    <div className="mt-12 space-y-12 leading-8 text-muted [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-relaxed [&_h2]:text-ink [&_p]:mt-4">
                        <section aria-labelledby="prepare-heading">
                            <h2 id="prepare-heading">1. 使う画像を用意する</h2>
                            <p>
                                自分で撮影した写真や、自分で描いたイラストなど、利用できる画像を用意します。
                                最初は背景が単純で、輪郭のはっきりしたものを選ぶと確認しやすくなります。
                                主役が小さい場合は、スマートフォンやパソコンの写真アプリで先に切り抜いておきましょう。
                            </p>
                            <p>
                                練習用には、当サイトのオリジナル図案「Pumpkin Hug Ghost Cat」のPNG画像を使えます。
                                もともと小さなドット絵なので、写真の変換品質を示す作例ではありません。
                            </p>
                            <figure className="mt-6 rounded-lg border border-line bg-white p-5 sm:p-6">
                                <Image
                                    src={sourceImage}
                                    alt="かぼちゃを抱えたゴーストキャットのオリジナルドット絵。読み込み練習用の29×29ピクセル画像"
                                    width={29}
                                    height={29}
                                    unoptimized
                                    className="mx-auto h-auto w-full max-w-[232px] [image-rendering:pixelated]"
                                />
                                <figcaption className="mt-5 text-sm leading-7">
                                    読み込みに使う画像です。マス目の線が入っていないPNGを選びます。
                                    <a href={sourceImage} download="ghost-cat-source.png" className="text-link ml-2">練習用PNGを保存</a>
                                </figcaption>
                            </figure>
                        </section>

                        <section aria-labelledby="upload-heading">
                            <h2 id="upload-heading">2. 画像を読み込む</h2>
                            <p>
                                <Link href="/ja#generator" prefetch={false} className="text-link">日本語の図案作成ツール</Link>で「画像を選ぶ」を押し、PNG・JPEG・WebPの静止画像を選びます。
                                画像は8 MB・1,600万画素までです。HEICの写真は、写真アプリなどでJPEGに保存してから選んでください。
                            </p>
                            <p>
                                元画像が表示されたら、次の手順で配色と枚数を決めます。
                                画像を選んだだけでは、図案はまだ作成されません。「図案を作る」を押して反映します。
                            </p>
                            <p>
                                別の画像を使うときは「画像を変更する」を押します。選び直した時点では、表示中の図案は変わりません。
                                手作業で直した図案を残す場合は、作り直す前に「プロジェクトを保存」を押してください。
                            </p>
                        </section>

                        <section aria-labelledby="setup-heading">
                            <h2 id="setup-heading">3. ブランドと図案の大きさを決める</h2>
                            <p>
                                「ビーズのブランド」で手持ちの配色を選び、「横のプレート数」と「縦のプレート数」で大きさを決めます。
                                練習用のゴーストキャットは、次の設定で始められます。
                            </p>
                            <table className="mt-5 w-full border-collapse text-left text-sm leading-6">
                                <caption className="sr-only">ゴーストキャットの練習用設定</caption>
                                <thead>
                                    <tr className="border-y border-line text-ink">
                                        <th scope="col" className="py-3 pr-3 font-semibold">画面の項目</th>
                                        <th scope="col" className="py-3 font-semibold">設定</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {setupOptions.map(([label, setting]) => (
                                        <tr key={label} className="border-b border-line align-top">
                                            <th scope="row" className="py-3 pr-3 font-medium text-ink">{label}</th>
                                            <td className="py-3">{setting}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p>
                                「設定：29 × 29マス / プレート1枚」を確認し、「図案を作る」を押します。
                                パソコンでもスマートフォンでも、同じ名前のボタンを使います。図案が表示されたら、顔や輪郭を確認しましょう。
                            </p>
                            <p>
                                横2枚・縦1枚なら58×29マス、横2枚・縦2枚なら58×58マスになります。
                                顔のパーツや細い線がつぶれるときは、元画像の切り抜き方や枚数を見直します。
                                枚数を増やすと必要なビーズや作業量も増えるので、大きさは手作業で直す前に決めておくと安心です。
                            </p>
                            <p>
                                ブランドだけを変え、同じ画像・同じ枚数のまま「図案を作る」を押すと、編集した位置と空白を残して配色を変えます。
                                似た色が一つにまとまることがあり、取り消し履歴は新しいブランドで始まります。
                                元画像や枚数を変えて作り直すと、手作業で直した部分は置き換わります。確認画面でキャンセルすると、今の図案を残せます。
                            </p>
                            <p>
                                設定を選び直しても、「図案を作る」を押すまでは保存される図案は変わりません。
                                ブランドの変更は実物のビーズサイズやプレートへの適合を保証するものではありません。
                            </p>
                        </section>

                        <section aria-labelledby="edit-heading">
                            <h2 id="edit-heading">4. 気になる部分を編集する</h2>
                            <p>
                                作成した図案は、同じページの「3. マスを直す」で編集できます。
                                「置く色（ブランドの色名・色番号）」で色を選び、「色を置く」を押してからマスを押します。色名はブランドの表記で表示されます。
                            </p>
                            <dl className="mt-5 divide-y divide-line border-y border-line text-sm leading-7">
                                {editingTools.map(([label, meaning]) => (
                                    <div key={label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-3">
                                        <dt className="font-semibold text-ink">{label}</dt>
                                        <dd>{meaning}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p>
                                練習では、Perlerの「80-15203 — Flamingo」を選び、上から15行目・左から15列目の白い1マスをピンクに変えてみましょう。
                                「元に戻す」で白に戻し、「やり直す」でピンクに戻すと、変えた場所を確認できます。
                                白と灰色が交互に見えるマスは空白で、白いビーズとは異なります。
                            </p>
                            <p>
                                スマートフォンで図案の表示位置を動かすときは「移動・スクロール」を選びます。
                                細かいマスを押しにくいときは「表示倍率」を上げてください。表示倍率を変えても、図案のマス数や保存する大きさは変わりません。
                                キーボードでは図案にフォーカスし、矢印キーで位置を選び、Enterまたはスペースで色を置けます。
                            </p>
                        </section>

                        <section aria-labelledby="save-heading">
                            <h2 id="save-heading">5. 編集用ファイルを保存する</h2>
                            <p>
                                「4. 図案を保存する」の「保存するファイル名」に名前を入力し、「プロジェクトを保存」を押します。
                                ファイル名は「.bead-pattern.json」で終わります。画像やPDFとは別に、編集したマスと空白を保存するためのファイルです。
                            </p>
                            <p>
                                続きを編集するときは、日本語ツールの「続きから作る」にある「プロジェクトを開く」から選びます。
                                開いた図案をそのまま編集する場合は、もう一度「図案を作る」を押す必要はありません。
                                このページで開けるのは、上記3ブランド・29×29マスのプレートを縦横1〜4枚使う対応プロジェクトです。
                            </p>
                            <p>
                                ページを閉じたり別のページへ移動したりする前に、手動で保存してください。
                                元画像が含まれていないプロジェクトでも、マスの編集・同じ大きさでのブランド変更・保存はできます。
                                枚数を変えて作り直すには、元になる画像を選び直す必要があります。
                            </p>
                        </section>

                        <section aria-labelledby="export-heading">
                            <h2 id="export-heading">6. PDFや画像を書き出す</h2>
                            <p>
                                表示中の図案を確認し、「印刷用PDFを保存」または「図案PNGを保存」を押します。
                                初回はファイルの準備に少し時間がかかることがあります。保存が始まったら、ブラウザのダウンロードを確認してください。
                            </p>
                            <ul className="mt-4 list-disc space-y-3 pl-6">
                                <li><strong className="text-ink">印刷用PDF：</strong>日本語の説明と材料表付きです。A4用紙で29×29マスのプレートごとに分かれ、1マスの間隔は5 mmです。色数などに応じて材料表が別ページになります。</li>
                                <li><strong className="text-ink">図案PNG：</strong>図案・色番号・材料表を一緒に見られる画像です。読み込み用の元画像や、1マスが1ピクセルの画像とは異なります。</li>
                                <li><strong className="text-ink">プロジェクト：</strong>編集を再開するためのデータです。PDFやPNGだけでは、同じ編集状態をそのまま開けません。</li>
                            </ul>
                            <figure className="mt-6 rounded-lg border border-line bg-white p-4 sm:p-6">
                                <a href="/guides/ja-photo-to-pattern/japanese-edited-grid.png" aria-label="日本語ツールで編集した図案PNGを拡大して見る">
                                    <Image
                                        src="/guides/ja-photo-to-pattern/japanese-edited-grid.png"
                                        alt="日本語ツールから書き出したゴーストキャットの図案。15行15列の1マスをFlamingoに変更し、29×29マス・408個・7色の材料表を表示している"
                                        width={900}
                                        height={968}
                                        unoptimized
                                        className="mx-auto h-auto w-full max-w-[600px]"
                                    />
                                </a>
                                <figcaption className="mt-4 text-sm leading-7">
                                    日本語ツールで15行15列の1マスを白からFlamingoに変え、実際に保存した作例です。編集後も408個・7色で、PDFは材料表を含むA4の1ページです。画像を押すと拡大できます。
                                    <span className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                                        <a href="/guides/ja-photo-to-pattern/japanese-edited.pdf" download="ghost-cat-edited-ja.pdf" className="text-link">日本語PDFを保存</a>
                                        <a href="/guides/ja-photo-to-pattern/japanese-edited-grid.png" download="ghost-cat-edited-ja.png" className="text-link">図案PNGを保存</a>
                                        <a href="/guides/ja-photo-to-pattern/japanese-edited.bead-pattern.json" download="ghost-cat-edited-ja.bead-pattern.json" className="text-link">編集用プロジェクトを保存</a>
                                    </span>
                                    <span className="mt-3 block">このプロジェクトを日本語ツールの「プロジェクトを開く」で読み込むと、ピンクに変更した状態から続きを編集できます。</span>
                                </figcaption>
                            </figure>
                            <p>
                                PDFは倍率100％（実際のサイズ）で印刷し、「用紙に合わせる」は選ばないでください。
                                印刷後に50 mmの線を定規で測り、お手持ちのプレートの間隔も確認します。PNGの印刷倍率は用紙やアプリによって変わるので、原寸を確認するときはPDFを使います。
                            </p>
                            <p>
                                画面や印刷の色は、実物のビーズと異なる場合があります。この練習図案は実物制作・アイロン仕上げを検証していません。
                                完成済みの図案の印刷方法は、<Link href="/ja/patterns#printing" className="text-link">図案一覧の印刷ガイド</Link>でも確認できます。
                            </p>
                        </section>

                        <section aria-labelledby="help-heading" className="border-t border-line pt-8">
                            <h2 id="help-heading">うまくいかないとき</h2>
                            <div className="mt-5 divide-y divide-line">
                                <details className="py-3">
                                    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">写真の細かい部分が見えません</summary>
                                    <p className="pb-3">主役が大きく写るように切り抜いてみてください。小さな図案では細部を残せないことがあります。マス数を増やす方法もありますが、作業量とのバランスを見て選びます。</p>
                                </details>
                                <details className="py-3">
                                    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">手持ちのビーズと色が違います</summary>
                                    <p className="pb-3">自動の配色は画面上の色をもとにした近似です。ブランドと色番号を確認し、必要なら「置く色（ブランドの色名・色番号）」から別の色を選んでマスを直します。</p>
                                </details>
                                <details className="py-3">
                                    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">画像を選んでも図案が変わりません</summary>
                                    <p className="pb-3">画像や設定を選ぶだけでは、表示中の図案は変わりません。「図案を作る」を押してください。作り直しの確認が出たときは、残したい編集を先にプロジェクトへ保存します。</p>
                                </details>
                                <details className="py-3">
                                    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">書き出しが終わりません</summary>
                                    <p className="pb-3">初回は書き出し用の機能を読み込む時間がかかることがあります。エラーが出た場合も、表示中の図案は残ります。まずプロジェクトを保存し、接続を確認してもう一度試すか、別の保存形式を試してください。</p>
                                </details>
                            </div>
                        </section>
                    </div>

                    <details className="mt-12 border-t border-line pt-5 leading-8 text-muted">
                        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">英語版エディターの参考資料</summary>
                        <div className="mt-4 space-y-6">
                            <p>
                                塗りつぶしやスポイトなど、より詳しい編集には<Link href="/#generator" hrefLang="en" prefetch={false} className="text-link">英語版の作成ツール</Link>を使えます。
                                以下は英語版で同じ練習画像を読み込み、15行15列の1マスをFlamingoに変更した作例です。上の日本語版とは画面や書き出し形式が異なります。
                            </p>
                            <figure>
                                <a href="/guides/ja-photo-to-pattern/generator.jpg" aria-label="英語版の図案作成画面を開く">
                                    <Image src="/guides/ja-photo-to-pattern/generator.jpg" alt="英語版の図案作成画面。Perler Midiと29×29マス、横1枚・縦1枚を選んだ参考例" width={1168} height={614} unoptimized className="h-auto w-full rounded-lg border border-line" />
                                </a>
                                <figcaption className="mt-3 text-sm leading-7">英語版で練習用PNGを読み込んだ画面です。</figcaption>
                            </figure>
                            <figure>
                                <a href="/guides/ja-photo-to-pattern/editor.jpg" aria-label="英語版で1マスを編集した画面を開く">
                                    <Image src="/guides/ja-photo-to-pattern/editor.jpg" alt="英語版で15行15列を白からFlamingoに変更した参考例" width={1157} height={664} unoptimized className="h-auto w-full rounded-lg border border-line" />
                                </a>
                                <figcaption className="mt-3 text-sm leading-7">英語版の「Bead」で色を置き、「Undo / Redo」で変更を確認できます。</figcaption>
                            </figure>
                            <figure>
                                <Image src="/guides/ja-photo-to-pattern/ghost-cat-grid.png" alt="英語版から書き出した参考用Grid PNG。15行15列をピンクに変更した図案" width={580} height={580} unoptimized className="mx-auto h-auto w-full max-w-[420px] [image-rendering:pixelated]" />
                                <figcaption className="mt-4 text-sm leading-7">
                                    英語版の書き出し例です。PDFは材料表と図案の2ページで、50 mmの目盛りはありません。行と列を数えるための見本として使い、プレートの下に敷く場合は印刷後の間隔を確認してください。
                                    <span className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                                        <a href="/guides/ja-photo-to-pattern/ghost-cat-perler.pdf" download="ghost-cat-edited-perler.pdf" className="text-link">編集後のPDFを保存（英語）</a>
                                        <a href="/guides/ja-photo-to-pattern/ghost-cat-grid.png" download="ghost-cat-edited-grid.png" className="text-link">編集後のGrid PNGを保存</a>
                                    </span>
                                </figcaption>
                            </figure>
                        </div>
                    </details>

                    <nav aria-label="次に進む" className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-6">
                        <Link href="/ja#generator" prefetch={false} className="text-link">日本語で画像から図案を作る</Link>
                        <Link href="/ja/patterns" className="text-link">無料の図案一覧に戻る</Link>
                    </nav>
                </article>
            </main>

            <footer className="mt-auto border-t border-line bg-[#edeee7]">
                <div className="mx-auto max-w-[1248px] px-5 py-8 sm:px-10">
                    <p className="text-sm leading-7 text-muted">日本語の作成ツールと図案一覧、詳しい英語版エディターを利用できます。</p>
                    <nav aria-label="関連ページ" className="mt-3 flex flex-wrap gap-x-6">
                        <Link href="/ja/patterns" className="text-link">日本語の図案</Link>
                        <Link href="/privacy-policy" hrefLang="en" className="text-link">プライバシー（英語）</Link>
                        <Link href="/terms-of-service" hrefLang="en" className="text-link">利用規約（英語）</Link>
                    </nav>
                    <p className="mt-5 text-xs leading-6 text-muted">© 2026 Fuse Bead Patterns.</p>
                </div>
            </footer>
        </div>
    );
}

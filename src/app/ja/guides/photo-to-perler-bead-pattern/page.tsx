import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

const pagePath = '/ja/guides/photo-to-perler-bead-pattern';
const title = '画像からアイロンビーズ図案を作る方法 | Fuse Bead Patterns';
const description = '写真やイラストをアイロンビーズ図案にする手順を日本語で紹介。英語画面のボタン名を確認しながら、画像の読み込み、配色とサイズの設定、編集、PDFの保存まで進められます。';
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
    ['Color Brand', 'ビーズの配色', 'Perler Midi'],
    ['Pegboard', '1枚分のマス目', 'Midi 29 x 29'],
    ['Boards Wide', '横に並べるプレート数', '1'],
    ['Boards Tall', '縦に並べるプレート数', '1'],
];

const editingTools = [
    ['Bead', '選んだ色のビーズを置く'],
    ['Erase', 'ビーズを消し、空白にする'],
    ['Fill', 'つながっている同じ色の範囲を塗る'],
    ['Pick', '図案にある色を選ぶ'],
    ['Pan', '拡大した画面の表示位置を動かす'],
    ['Undo / Redo', '操作を戻す／やり直す'],
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
                        ツールの画面と書き出すPDFの表記は英語です。本文では画面の英語のボタン名と、日本語の意味を並べて説明します。
                        完成済みの図案が欲しい場合は、<Link href="/ja/patterns" className="text-link">日本語の無料図案一覧</Link>から直接保存できます。
                    </p>
                    <Link href="/#generator" hrefLang="en" prefetch={false} className="button-primary mt-6">
                        作成ツールを開く（英語）<span aria-hidden="true">↗</span>
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
                                <Link href="/#generator" hrefLang="en" prefetch={false} className="text-link">図案作成ツール（英語）</Link>を開きます。
                                前に作業した図案が残っている場合は、先に「Save Project」で保存してから新しい画像を選んでください。
                            </p>
                            <p>
                                パソコンでは「Image」の「Upload Image」を押し、PNGまたはJPEG画像を選びます。
                                スマートフォンでは、図案作成エリアの下にある「Image」を開き、その中の「Upload Image」を押して選びます。
                                画像を選ぶと変換が始まるので、プレビューが表示されるまで待ちます。
                            </p>
                            <p>
                                画像を交換するときは、パソコンでは「Image」の画像部分、スマートフォンでは「Image」メニューの「Change Image」を押します。
                                元の作業を残したいときは、交換する前に保存してください。
                            </p>
                        </section>

                        <section aria-labelledby="setup-heading">
                            <h2 id="setup-heading">3. ブランドと図案の大きさを決める</h2>
                            <p>
                                「Color Brand」はビーズの配色を選ぶ項目です。手持ちのビーズに合うものを選びます。
                                練習用の画像では、まず「Perler Midi」と「Midi 29 x 29」を選び、横と縦の枚数をどちらも「1」にしてみましょう。
                            </p>
                            <table className="mt-5 w-full border-collapse text-left text-sm leading-6">
                                <caption className="sr-only">練習用の図案設定と英語項目の意味</caption>
                                <thead>
                                    <tr className="border-y border-line text-ink">
                                        <th scope="col" className="py-3 pr-3 font-semibold">画面の表示</th>
                                        <th scope="col" className="py-3 pr-3 font-semibold">意味</th>
                                        <th scope="col" className="py-3 font-semibold">設定</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {setupOptions.map(([label, meaning, setting]) => (
                                        <tr key={label} className="border-b border-line align-top">
                                            <th scope="row" lang="en" className="py-3 pr-3 font-medium text-ink">{label}</th>
                                            <td className="py-3 pr-3">{meaning}</td>
                                            <td lang="en" className="py-3">{setting}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p>
                                スマートフォンでは、下の「Brand」で配色、「Pegboard」でマス目と枚数を選びます。
                                ホームページの図案作成画面では、設定を変えるとプレビューも更新されます。
                            </p>
                            <figure className="mt-6">
                                <a href="/guides/ja-photo-to-pattern/generator.jpg" aria-label="図案作成画面の画像を開く">
                                    <Image
                                        src="/guides/ja-photo-to-pattern/generator.jpg"
                                        alt="練習用の画像を読み込んだ画面。Perler Midi、Midi 29 x 29、横1枚・縦1枚を選び、編集前の図案を表示している"
                                        width={1168}
                                        height={614}
                                        unoptimized
                                        className="h-auto w-full rounded-lg border border-line"
                                    />
                                </a>
                                <figcaption className="mt-3 text-sm leading-7">
                                    練習用PNGを読み込んだ実際の画面です。左で配色とサイズを決め、右で編集前の図案を確認できます。
                                </figcaption>
                            </figure>
                            <p>
                                顔のパーツや細い線がつぶれる場合は、切り抜き方やマス数を見直します。
                                同じMidi設定で横2枚・縦1枚なら58×29マスです。大きくするほど必要なビーズも増えるので、形がわかる範囲で選びましょう。
                                ブランドを変えても、実物のビーズの大きさやプレートへの適合が保証されるわけではありません。
                            </p>
                        </section>

                        <section aria-labelledby="edit-heading">
                            <h2 id="edit-heading">4. 気になる部分を編集する</h2>
                            <p>
                                パソコンではプレビュー上の「Edit Pattern」、スマートフォンではプレビュー下の「Editor」の「Open」を押します。
                                画面が広い場合は「Tools」に編集道具が並びます。スマートフォンや狭い画面では「Edit」メニューを開きます。
                            </p>
                            <dl className="mt-5 divide-y divide-line border-y border-line text-sm leading-7">
                                {editingTools.map(([label, meaning]) => (
                                    <div key={label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
                                        <dt lang="en" className="font-semibold text-ink">{label}</dt>
                                        <dd>{meaning}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p>
                                色を変えるときは、広い画面では「Bead Color」の色部分、スマートフォンでは「Colors」メニューの色部分を押します。
                                「Select Color」で色を選び、「Bead」で置きます。練習用の設定で進める場合は、Perler Midiの色を選んでください。
                                スマートフォンでは色を選ぶとパネルが閉じ、図案に戻ります。
                            </p>
                            <p>
                                下の例では「Flamingo」（80-15203）を選び、図案の中央にある白い1マスをピンクに変えました。
                                上から15行目・左から15列目です。「Undo」で戻し、「Redo」でやり直して、変えた場所を確かめられます。
                            </p>
                            <figure className="mt-6">
                                <a href="/guides/ja-photo-to-pattern/editor.jpg" aria-label="1マスを編集した画面の画像を開く">
                                    <Image
                                        src="/guides/ja-photo-to-pattern/editor.jpg"
                                        alt="編集後の画面。Flamingoを選び、15行15列の1マスを白からピンクに変更した図案"
                                        width={1157}
                                        height={664}
                                        unoptimized
                                        className="h-auto w-full rounded-lg border border-line"
                                    />
                                </a>
                                <figcaption className="mt-3 text-sm leading-7">
                                    1マスを編集したあとの図案です。左の色名と、図案の中央のピンクを見比べてください。
                                </figcaption>
                            </figure>
                            <p>
                                大きさの調整は、手作業で描き直す前に済ませると安心です。
                                編集画面の「Pattern Setup」または「Setup」で設定を変えた場合は、「Apply Changes」で反映します。
                                プレートや枚数の変更は図案を作り直すことがあるため、残したい編集は先に保存します。
                            </p>
                        </section>

                        <section aria-labelledby="save-heading">
                            <h2 id="save-heading">5. 編集用ファイルを保存する</h2>
                            <p>
                                あとで続きを編集するために、プロジェクトを保存しておきます。
                                パソコンの編集画面では上の「Save」、スマートフォンでは「File」→「Save Project」を使います。
                                保存されるファイル名は「.bead-pattern.json」で終わります。
                            </p>
                            <p>
                                これは画像やPDFとは別の編集用データです。もう一度開くときは、編集画面の「Open」、または「File」→「Open Project」から選びます。
                                スマートフォンで保存後にメニューが閉じた場合は、「File」をもう一度開いてください。
                                ブラウザに前の作業が残っていても、それだけに頼らず、残したい図案はファイルでも保存しておきましょう。
                            </p>
                        </section>

                        <section aria-labelledby="export-heading">
                            <h2 id="export-heading">6. PDFや画像を書き出す</h2>
                            <p>
                                編集画面の「Export」を押します。スマートフォンでは「File」→「Export Pattern」からも開けます。
                            </p>
                            <ol className="mt-4 list-decimal space-y-2 pl-6">
                                <li>「Export File Name」に名前を入力します。例えば <span lang="en" className="break-words">ghost-cat-perler-midi</span> とします。</li>
                                <li>「Export Format」で「PDF」を選びます。</li>
                                <li>色の記号も使いたい場合は「Use Symbols In Printable Exports」にチェックを入れます。</li>
                                <li>「Export PDF」を押し、ファイルができるまで待ちます。</li>
                                <li>保存したPDFを開き、図案と色の一覧を確認します。</li>
                            </ol>
                            <p>
                                画面で見るためのマス目付き画像が欲しい場合は「Grid PNG」を選び、「Export Grid PNG」を押します。
                                細かい編集をしない場合は、ホームページの図案作成画面の「Export」から直接書き出すこともできます。
                                スマートフォンでは図案作成エリアの下にある「Export」メニューを開きます。そこでの名前の入力欄は「File Name」です。
                            </p>
                            <figure className="mt-6 rounded-lg border border-line bg-white p-5 sm:p-6">
                                <Image
                                    src="/guides/ja-photo-to-pattern/ghost-cat-grid.png"
                                    alt="編集後に書き出したマス目付き図案。中央の15行15列に変更後のピンクが残っている"
                                    width={580}
                                    height={580}
                                    unoptimized
                                    className="mx-auto h-auto w-full max-w-[420px] [image-rendering:pixelated]"
                                />
                                <figcaption className="mt-4 text-sm leading-7">
                                    編集後に実際に書き出したGrid PNGです。読み込み用の元画像と比べると、上から15行目・左から15列目が白からピンクに変わっています。
                                    PDFも同じ編集後の図案で、色の一覧と図案の2ページです。
                                    <span className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                                        <a
                                            href="/guides/ja-photo-to-pattern/ghost-cat-perler.pdf"
                                            download="ghost-cat-edited-perler.pdf"
                                            className="text-link"
                                        >
                                            編集後のPDFを保存（英語）
                                        </a>
                                        <a
                                            href="/guides/ja-photo-to-pattern/ghost-cat-grid.png"
                                            download="ghost-cat-edited-grid.png"
                                            className="text-link"
                                        >
                                            編集後のGrid PNGを保存
                                        </a>
                                    </span>
                                </figcaption>
                            </figure>
                            <p>
                                この作例のPDFには50mmの目盛りがありません。
                                印刷した図案は、まず行と列を数えるための見本として使ってください。
                                編集画面から書き出したPDFが、お手持ちのプレートと実寸で重なるとは限りません。
                                プレートの下に敷く場合は印刷後の間隔を確認します。
                                <Link href="/ja/patterns#printing" className="text-link">図案一覧の50mmの目盛り付きPDF</Link>とは確認方法が異なります。
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
                                    <p className="pb-3">自動の配色は画面上の色をもとにした近似です。ブランドと色番号を確認し、必要なら編集画面で見やすい色に直します。</p>
                                </details>
                                <details className="py-3">
                                    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">編集画面が開けません</summary>
                                    <p className="pb-3">エラーの内容を確認してください。ブラウザの保存領域が使えない、または不足している場合は、設定を確認するか、小さな画像で試してください。</p>
                                </details>
                                <details className="py-3">
                                    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">書き出しが終わりません</summary>
                                    <p className="pb-3">初回は書き出し用の機能を読み込む時間がかかることがあります。エラーが出た場合は、作業を保存してからプレート数を減らす、別の形式を選ぶ、記号のチェックを外す方法を試せます。</p>
                                </details>
                            </div>
                        </section>
                    </div>

                    <nav aria-label="次に進む" className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-6">
                        <Link href="/#generator" hrefLang="en" prefetch={false} className="text-link">画像から図案を作る（英語）</Link>
                        <Link href="/ja/patterns" className="text-link">無料の図案一覧に戻る</Link>
                    </nav>
                </article>
            </main>

            <footer className="mt-auto border-t border-line bg-[#edeee7]">
                <div className="mx-auto max-w-[1248px] px-5 py-8 sm:px-10">
                    <p className="text-sm leading-7 text-muted">図案のダウンロードは日本語の案内で、作成・編集ツールは英語で利用できます。</p>
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

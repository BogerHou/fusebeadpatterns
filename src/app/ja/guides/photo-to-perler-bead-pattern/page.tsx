import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import GuideSections from '@/components/guides/GuideSections';
import { getLocalizedGuide } from '@/lib/guides/localized';
import { guideLanguageAlternates } from '@/lib/guides/routes';

const pagePath = '/ja/guides/photo-to-perler-bead-pattern';
const title = '画像からアイロンビーズ図案を作る方法 | Fuse Bead Patterns';
const description = '写真やイラストからアイロンビーズ図案を作る手順を、日本語の画面に沿って紹介。画像の読み込み、ブランドと枚数の設定、マスの修正、日本語PDFの保存とプロジェクトの再開まで確認できます。';
const sourceImage = '/patterns/ghost-cat-pumpkin/pixels.png';
const previewImage = '/patterns/ghost-cat-pumpkin/preview.png';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: pagePath, languages: guideLanguageAlternates('photo-to-perler-bead-pattern') },
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
    ['プレート', 'Midi（29×29マス）'],
    ['横のプレート数', '1枚'],
    ['縦のプレート数', '1枚'],
];

const editingTools = [
    ['ビーズ', '選んだ色をマスに置く'],
    ['塗りつぶし', 'つながっている同じ色の領域を塗り替える'],
    ['消しゴム', 'ビーズを消し、空白にする'],
    ['スポイト', '図案のマスから使う色を選ぶ'],
    ['移動', '図案を描き変えずに表示位置を動かす'],
    ['元に戻す／やり直す', 'マスの編集を戻す／やり直す'],
];

export default function JapanesePhotoPatternGuide() {
    const workedExamples = getLocalizedGuide('photo-to-perler-bead-pattern', 'ja')!;
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader locale="ja" active="guides" />

            <main id="main-content" tabIndex={-1} className="page-shell flex-1">
                <nav aria-label="パンくずリスト" className="mb-6 text-xs font-medium text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2">
                        <li><Link href="/ja" className="inline-flex min-h-10 items-center hover:underline">ホーム</Link></li>
                        <li aria-hidden="true">/</li>
                        <li><Link href="/ja/guides" className="inline-flex min-h-10 items-center hover:underline">使い方</Link></li>
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
                        Perler・Hama・Artkalなどの配色と、ミディ・ミニのプレートを選べます。ブランドとプレートは別の設定なので、実際に使うビーズのサイズと板を確認してください。
                        編集を始めたら、ページを離れる前にプロジェクトを保存してください。
                    </p>
                    <Link href="/ja#generator" prefetch={false} className="button-primary mt-6">
                        日本語で図案を作る<span aria-hidden="true">↗</span>
                    </Link>
                    <p className="mt-5 leading-8 text-muted">
                        まず操作を覚える場合は、下の練習用ドット絵から始められます。
                        写真や滑らかなイラストの変換を比べたい場合は、
                        <a href="#conversion-examples" className="text-link">猫の写真とロケットの実例</a>へ進んでください。
                    </p>

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
                                <Link href="/ja#generator" prefetch={false} className="text-link">日本語の図案作成ツール</Link>の「画像を読み込む」から、PNG・JPEG・WebPなど、ブラウザで開ける画像を選びます。
                                スマートフォンでは「画像」または「画像を選択」から読み込めます。HEICなどの画像が開けない場合は、写真アプリでJPEGに保存してから試してください。
                            </p>
                            <p>
                                画像を選ぶと自動で図案のプレビューが作成されます。処理が終わったら、次の手順で配色と大きさを調整します。
                            </p>
                            <p>
                                別の画像を読み込むと、元画像と図案が置き換わります。
                                手作業で直した図案を残す場合は、先にエディターでプロジェクトを保存してください。
                            </p>
                        </section>

                        <section aria-labelledby="setup-heading">
                            <h2 id="setup-heading">3. ブランドと図案の大きさを決める</h2>
                            <p>
                                「ビーズのブランド」で手持ちの配色を選び、「プレート」と「横のプレート数」「縦のプレート数」で大きさを決めます。
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
                                作成ツールの設定を変えると、プレビューも更新されます。29×29マスになっていることを確認し、顔や輪郭を見てから「エディターを開く」を押します。
                                スマートフォンでは「ブランド」「プレート」の項目から設定できます。
                            </p>
                            <p>
                                29×29マスのプレートなら、横2枚・縦1枚で58×29マス、横2枚・縦2枚で58×58マスになります。
                                顔のパーツや細い線がつぶれるときは、元画像の切り抜き方や枚数を見直します。
                                枚数を増やすと必要なビーズや作業量も増えるので、大きさは手作業で直す前に決めておくと安心です。
                            </p>
                            <p>
                                エディターで設定を変える場合は、「図案の設定」（スマートフォンでは「設定」）で選び、「変更を適用」を押します。
                                ブランドだけを変え、プレートの種類と枚数をそのままにすると、編集した位置と空白を残して配色を変えます。
                                似た色が一つにまとまることがあり、取り消し履歴は新しいブランドで始まります。
                                サイズを変えて作り直すと、手作業で直した部分は置き換わります。編集済みの場合に出る確認画面でキャンセルすると、今の図案を残せます。
                            </p>
                            <p>
                                エディター内では、設定を選び直しても「変更を適用」を押すまでは図案に反映されません。
                                ブランドの変更は実物のビーズサイズやプレートへの適合を保証するものではありません。
                            </p>
                        </section>

                        <section aria-labelledby="edit-heading">
                            <h2 id="edit-heading">4. 気になる部分を編集する</h2>
                            <p>
                                「エディターを開く」で編集画面へ進みます。「ビーズの色」から使う色を選び、「ビーズ」を選んでからマスを押します。
                                スマートフォンでは「色」を開いて色を選びます。色名と色番号はブランドの表記で確認できます。
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
                                練習では、Perlerの「80-15203 — Flamingo」を選び、白いマスを1つピンクに変えてみましょう。
                                「元に戻す」と「やり直す」で、変えた場所を確認できます。後の参考ファイルでは15行15列の1マスを変更しています。
                                白と灰色が交互に見えるマスは空白で、白いビーズとは異なります。
                            </p>
                            <p>
                                図案の表示位置を動かすときは「移動」を選びます。
                                細かいマスを押しにくいときは「拡大」で表示を大きくしてください。ズームを変えても、図案のマス数や保存する大きさは変わりません。
                            </p>
                        </section>

                        <section aria-labelledby="save-heading">
                            <h2 id="save-heading">5. 編集用ファイルを保存する</h2>
                            <p>
                                エディター上部の「保存」を押します。スマートフォンでは「ファイル」から「プロジェクトを保存」を選びます。
                                ファイル名は「.bead-pattern.json」で終わります。画像やPDFとは別に、編集したマスと空白を保存するためのファイルです。
                            </p>
                            <p>
                                続きを編集するときは、<Link href="/ja/editor" prefetch={false} className="text-link">日本語エディター</Link>の「開く」、または「ファイル」内の「プロジェクトを開く」から保存したファイルを選びます。
                                対応するプロジェクトなら、配色・プレート設定・編集したマスを引き継いで再開できます。画像から作り直す必要はありません。
                            </p>
                            <p>
                                ページを閉じたり別のページへ移動したりする前に、手動で保存してください。
                                元画像が含まれていないプロジェクトでも、マスの編集・同じ大きさでのブランド変更・保存はできます。
                                大きさを変えて同じ画像から作り直したい場合は、元画像も手元に残しておきましょう。
                            </p>
                        </section>

                        <section aria-labelledby="export-heading">
                            <h2 id="export-heading">6. PDFや画像を書き出す</h2>
                            <p>
                                表示中の図案を確認し、「書き出し」を押します。スマートフォンでは「ファイル」から「図案を書き出す」を選びます。
                                ダイアログでファイル名と書き出し形式を選びます。PDFなら「PDF の印刷サイズ」も確認してから「PDF を書き出す」を押します。
                                初回はファイルの準備に少し時間がかかることがあります。保存が始まったら、ブラウザのダウンロードを確認してください。
                            </p>
                            <ul className="mt-4 list-disc space-y-3 pl-6">
                                <li><strong className="text-ink">PDF：</strong>日本語の材料表と、プレートごとの図案を別ページに保存します。「5 mm ミディの原寸」は、Perler Midi・Hama Midi・Artkal S (5 mm)の配色とMidiの29×29マスのプレートで使えます。「ページに合わせたカウント図」は、行と列を数えながら作るための参考図で、原寸ではありません。印刷サイズはプロジェクトに保存され、言語を切り替えても変わりません。</li>
                                <li><strong className="text-ink">印刷用 PNG：</strong>図案と材料表を含む画像です。下の以前の日本語PNG作例とはレイアウトが異なり、原寸印刷用ではありません。</li>
                                <li><strong className="text-ink">グリッド付き PNG：</strong>マス目付きの図案画像です。材料表は含みません。1マスが1ピクセルの元画像とも異なります。</li>
                                <li><strong className="text-ink">プロジェクト：</strong>編集を再開するためのデータです。PDFやPNGだけでは、同じ編集状態をそのまま開けません。</li>
                            </ul>
                            <figure className="mt-6 rounded-lg border border-line bg-white p-4 sm:p-6">
                                <a href="/guides/ja-photo-to-pattern/japanese-edited-grid.png" aria-label="以前の日本語ツールで保存した図案PNGの参考例を拡大して見る">
                                    <Image
                                        src="/guides/ja-photo-to-pattern/japanese-edited-grid.png"
                                        alt="以前の日本語ツールで保存したゴーストキャットの図案例。15行15列の1マスをFlamingoに変更し、29×29マス・408個・7色の材料表を表示している"
                                        width={900}
                                        height={968}
                                        unoptimized
                                        className="mx-auto h-auto w-full max-w-[600px]"
                                    />
                                </a>
                                <figcaption className="mt-4 text-sm leading-7">
                                    以前の日本語ツールで15行15列の1マスを白からFlamingoに変えて保存した参考例です。408個・7色で、この保存済みPDFは材料表を含むA4の1ページです。現在の書き出しレイアウトとは異なりますが、練習用として引き続き使えます。画像を押すと拡大できます。
                                    <span className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                                        <a href="/guides/ja-photo-to-pattern/japanese-edited.pdf" download="ghost-cat-edited-ja.pdf" className="text-link">日本語PDFを保存</a>
                                        <a href="/guides/ja-photo-to-pattern/japanese-edited-grid.png" download="ghost-cat-edited-ja.png" className="text-link">図案PNGを保存</a>
                                        <a href="/guides/ja-photo-to-pattern/japanese-edited.bead-pattern.json" download="ghost-cat-edited-ja.bead-pattern.json" className="text-link">編集用プロジェクトを保存</a>
                                    </span>
                                    <span className="mt-3 block">このプロジェクトを日本語エディターで開くと、ピンクに変更した状態から続きを編集できます。</span>
                                </figcaption>
                            </figure>
                            <p>
                                5 mm間隔のPDFは倍率100％（実際のサイズ）で印刷し、「用紙に合わせる」は選ばないでください。
                                印刷後に50 mmの線を定規で測り、お手持ちのプレートの間隔も確認します。ほかのブランド・プレートのPDFやPNGは、印刷した大きさが実物に合うとは限りません。
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
                                    <p className="pb-3">自動の配色は画面上の色をもとにした近似です。ブランドと色番号を確認し、必要ならエディターの「ビーズの色」から別の色を選んでマスを直します。</p>
                                </details>
                                <details className="py-3">
                                    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">画像を選んでも図案が変わりません</summary>
                                    <p className="pb-3">画像を読み込むと自動で処理が始まります。処理中の表示やエラーを確認し、読み込めない画像はJPEGやPNGに変換して試してください。エディターでブランドや大きさの設定だけを変えた場合は、「変更を適用」が必要です。別の画像を試す前に、残したい編集をプロジェクトへ保存します。</p>
                                </details>
                                <details className="py-3">
                                    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">書き出しが終わりません</summary>
                                    <p className="pb-3">初回は書き出し用の機能を読み込む時間がかかることがあります。エラーが出た場合も、表示中の図案は残ります。まずプロジェクトを保存し、接続を確認してもう一度試すか、別の保存形式を試してください。</p>
                                </details>
                            </div>
                        </section>
                    </div>

                    <div id="conversion-examples" className="mt-12 scroll-mt-6 border-t border-line pt-8">
                        <p className="eyebrow">写真・イラストの変換実例</p>
                        <p className="mt-4 leading-8 text-muted">{workedExamples.intro}</p>
                        <GuideSections sections={workedExamples.sections} locale="ja" />
                    </div>

                    <details className="mt-12 border-t border-line pt-5 leading-8 text-muted">
                        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">以前の英語版で作成した参考資料</summary>
                        <div className="mt-4 space-y-6">
                            <p>
                                現在は日本語エディターでも塗りつぶしやスポイトを使えます。<Link href="/#generator" hrefLang="en" prefetch={false} className="text-link">英語版の作成ツール</Link>も引き続き利用できます。
                                以下は以前の英語版で同じ練習画像を読み込み、15行15列の1マスをFlamingoに変更した作例です。画面写真と保存済みファイルは当時のもので、現在の日本語画面を示すものではありません。
                            </p>
                            <figure>
                                <a href="/guides/ja-photo-to-pattern/generator.jpg" aria-label="英語版の図案作成画面を開く">
                                    <Image src="/guides/ja-photo-to-pattern/generator.jpg" alt="英語版の図案作成画面。Perler Midiと29×29マス、横1枚・縦1枚を選んだ参考例" width={1168} height={614} unoptimized className="h-auto w-full rounded-lg border border-line" />
                                </a>
                                <figcaption className="mt-3 text-sm leading-7">以前の英語版で練習用PNGを読み込んだ画面です。</figcaption>
                            </figure>
                            <figure>
                                <a href="/guides/ja-photo-to-pattern/editor.jpg" aria-label="英語版で1マスを編集した画面を開く">
                                    <Image src="/guides/ja-photo-to-pattern/editor.jpg" alt="英語版で15行15列を白からFlamingoに変更した参考例" width={1157} height={664} unoptimized className="h-auto w-full rounded-lg border border-line" />
                                </a>
                                <figcaption className="mt-3 text-sm leading-7">以前の英語版で「Bead」を使い、1マスを変更した画面です。</figcaption>
                            </figure>
                            <figure>
                                <Image src="/guides/ja-photo-to-pattern/ghost-cat-grid.png" alt="英語版から書き出した参考用Grid PNG。15行15列をピンクに変更した図案" width={580} height={580} unoptimized className="mx-auto h-auto w-full max-w-[420px] [image-rendering:pixelated]" />
                                <figcaption className="mt-4 text-sm leading-7">
                                    以前の英語版の書き出し例です。この保存済みPDFは材料表と図案の2ページで、50 mmの目盛りはありません。行と列を数えるための見本として使い、プレートの下に敷く場合は印刷後の間隔を確認してください。
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
                        <Link href="/ja/guides/perler-bead-pegboards" className="text-link">プレートのサイズと印刷倍率を確認する</Link>
                    </nav>
                </article>
            </main>

            <SiteFooter locale="ja" active="guides" />
        </div>
    );
}

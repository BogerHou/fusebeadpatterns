import LocalizedPatternCatalog from './LocalizedPatternCatalog';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import Image from 'next/image';
import Link from 'next/link';
import { getPatternById, type Pattern } from '@/lib/patterns/catalog';
import japanesePatterns from '@/lib/patterns/japanese.json';
import { patternLibraryCount } from '@/lib/patterns/library-overview';
import PatternQuickDownloads from './PatternQuickDownloads';
import PatternLibraryHelp from '@/components/patterns/PatternLibraryHelp';
import { getLocalizedPatternGrid } from '@/lib/patterns/localized-download';

export const japanesePatternLibraryTitle = '無料のアイロンビーズ図案｜印刷用PDF・画像 | Fuse Bead Patterns';
export const japanesePatternLibraryDescription = 'ポケモンやスーパーマリオのアイロンビーズ図案を無料でダウンロード。印刷用PDFとマス目付き画像を、登録なしで保存できます。日本語の印刷ガイド付き。';

// Character names and selection stay aligned with the generated Japanese PDFs.
const groups = japanesePatterns.groups;
const quickDownloadCount = groups.reduce((total, group) => total + group.patterns.length, 0);

function requirePattern(id: string): Pattern {
    const pattern = getPatternById(id);
    if (!pattern) throw new Error(`Japanese library pattern is missing: ${id}`);
    return pattern;
}

function DownloadCard({ id, name }: { id: string; name: string }) {
    const pattern = requirePattern(id);
    const grid = getLocalizedPatternGrid(pattern, 'ja');

    return (
        <article className="pattern-card" data-pattern-card={id} aria-labelledby={`${id}-title`}>
            <a
                href={grid.href}
                hrefLang={grid.language}
                target="_blank"
                rel="noopener"
                className="block rounded-[10px]"
                aria-label={`${name}の図案を拡大表示（新しいタブ）`}
            >
                <div className="pattern-art">
                    <Image
                        src={pattern.assets.preview}
                        alt={`${name}のアイロンビーズ図案`}
                        width={580}
                        height={580}
                        unoptimized
                    />
                </div>
            </a>
            <div className="pattern-card-title">
                <h3 id={`${id}-title`}>{name}</h3>
            </div>
            <div className="flex flex-wrap gap-x-4">
                <a
                    href={`/patterns-ja/${id}/pattern.pdf`}
                    download={`${id}-ja.pdf`}
                    className="text-link underline decoration-line underline-offset-4 hover:decoration-accent"
                    aria-label={`${name}の日本語PDFをダウンロード`}
                    data-pattern-event="pattern_download"
                    data-pattern-id={id}
                    data-pattern-palette="perler"
                    data-pattern-entry="patterns"
                    data-pattern-format="pdf"
                >
                    PDF（日本語）<span aria-hidden="true">↓</span>
                </a>
                <a
                    href={grid.href}
                    hrefLang={grid.language}
                    download={`${id}-grid.png`}
                    className="text-link underline decoration-line underline-offset-4 hover:decoration-accent"
                    aria-label={`${name}のマス目付き画像をダウンロード（PNG）`}
                    data-pattern-event="pattern_download"
                    data-pattern-id={id}
                    data-pattern-palette="perler"
                    data-pattern-entry="patterns"
                    data-pattern-format="grid_png"
                >
                    画像 PNG<span aria-hidden="true">↓</span>
                </a>
            </div>
            <Link
                href={`/ja/editor?pattern=${encodeURIComponent(id)}`}
                prefetch={false}
                className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4"
                aria-label={`${name}の図案を日本語で編集`}
            >日本語で編集<span className="ml-2" aria-hidden="true">→</span></Link>
            <br />
            <Link
                href={`/ja/patterns/${pattern.slug}`}
                hrefLang="ja"
                prefetch={false}
                className="inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-4 hover:text-accent"
                aria-label={`${name}の色・制作メモ・出典を見る`}
            >
                詳細・出典
            </Link>
        </article>
    );
}

export default function JapanesePatternLibrary() {
    return (
        <div lang="ja" className="flex min-h-screen flex-col">
            <SiteHeader locale="ja" active="patterns" />

            <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
                <nav aria-label="パンくずリスト" className="mb-6 text-xs font-medium text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2">
                        <li><Link href="/ja" className="inline-flex min-h-10 items-center hover:underline">ホーム</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">すべての図案</li>
                    </ol>
                </nav>
                <h1 className="page-heading leading-snug">無料のアイロンビーズ図案</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted sm:text-lg">
                    {patternLibraryCount}点の無料図案から選べます。キャラクター名で検索するか、テーマで絞り込んでください。画像を選ぶと、日本語PDF・色表・日本語エディターを開けます。登録は不要です。
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                    自分の画像からは、<Link href="/ja" className="text-link">日本語の図案作成ツール</Link>で作れます。画像の読み込みから保存までの手順は<Link href="/ja/guides/photo-to-perler-bead-pattern" className="text-link">日本語の作り方ガイド</Link>をご覧ください。
                </p>

                <LocalizedPatternCatalog locale="ja" />
                <PatternQuickDownloads id="patterns" summary={`PDFのクイックダウンロード：ポケモン・マリオ ${quickDownloadCount}点`}>
                <p className="mb-6 max-w-3xl text-sm leading-7 text-muted">Perler Midiの配色で印刷・保存したい場合のショートカットです。ほかの図案は、上の一覧から詳細ページを開いてダウンロードしてください。</p>
                <nav aria-label="クイックダウンロードの図案" className="mb-5 flex flex-wrap gap-x-6 text-sm font-medium">
                    {groups.map(group => <a key={group.id} href={`#${group.id}-heading`} className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">{group.title}</a>)}
                </nav>
                <div className="space-y-12">
                    {groups.map((group) => (
                        <section key={group.id} aria-labelledby={`${group.id}-heading`}>
                            <h2 id={`${group.id}-heading`} className="text-xl font-semibold leading-relaxed sm:text-2xl">{group.title}</h2>
                            <p className="mb-6 mt-2 text-sm leading-7 text-muted">{group.version}をもとにした図案です。29×29マスの四角いミディ用プレートを使います。</p>
                            <div className="pattern-grid">
                                {group.patterns.map((pattern) => <DownloadCard key={pattern.id} {...pattern} />)}
                            </div>
                        </section>
                    ))}
                </div>
                </PatternQuickDownloads>

                <PatternLibraryHelp locale="ja" quickDownloadHref="#patterns" />

                <section aria-labelledby="faq-heading" className="mt-12 max-w-3xl">
                    <h2 id="faq-heading" className="text-2xl font-semibold leading-relaxed">よくある質問</h2>
                    <div className="mt-5 divide-y divide-line border-y border-line">
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">図案は無料ですか？</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">このページのPDFとマス目付き画像は無料で保存できます。会員登録も必要ありません。</p>
                        </details>
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">ほかのブランドのビーズでも作れますか？</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">
                                ダウンロードする図案の色表はPerler Midi用です。別のブランドでは使える色が異なるため、手持ちの色を確認してください。
                                「日本語で編集」から開き、「図案の設定」（スマートフォンでは「設定」）で「ビーズのブランド」を選んで「変更を適用」を押すと配色を変更できます。プレートの設定と実物のビーズサイズも確認してください。
                                <Link href="/ja/guides/perler-to-hama-artkal" className="text-link">Hama・Artkalへの配色変更ガイド</Link>
                                では、配色変更で確認したい点を詳しく紹介しています。
                            </p>
                        </details>
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">自分の写真から図案を作れますか？</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">
                                <Link href="/ja" className="text-link">日本語の図案作成ツール</Link>
                                で画像を読み込むと、自動でプレビューができます。配色と大きさを選び、「エディターを開く」からマスの修正や日本語PDFの書き出しへ進みます。
                                書き出し時に「PDF の印刷サイズ」を確認してください。使える原寸設定はブランドとプレートによって異なります。<Link href="/ja/guides/photo-to-perler-bead-pattern#export-heading" className="text-link">PDFの書き出し・印刷の説明</Link>もご覧ください。完成済みの図案をこのページから保存する場合は、ツールの操作は必要ありません。
                            </p>
                        </details>
                    </div>
                </section>
            </main>

            <SiteFooter locale="ja" active="patterns" />
        </div>
    );
}

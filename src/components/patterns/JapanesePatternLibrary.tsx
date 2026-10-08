import Image from 'next/image';
import Link from 'next/link';
import { getPatternById, getPatternHref, type Pattern } from '@/lib/patterns/catalog';

export const japanesePatternLibraryTitle = '無料のアイロンビーズ図案｜印刷用PDF・画像 | Fuse Bead Patterns';
export const japanesePatternLibraryDescription = 'ポケモンやスーパーマリオのアイロンビーズ図案を無料でダウンロード。印刷用PDFとマス目付き画像を、登録なしで保存できます。日本語の印刷ガイド付き。';

// Names checked against the official Pokémon and Nintendo character pages.
// Keep the existing sprite versions and download files from the reviewed catalog.
const groups = [
    {
        id: 'pokemon',
        title: 'ポケモンの図案',
        patterns: [
            { id: 'pokemon-pikachu-gen5', name: 'ピカチュウ' },
            { id: 'pokemon-eevee-gen5', name: 'イーブイ' },
            { id: 'pokemon-bulbasaur-gen5', name: 'フシギダネ' },
            { id: 'pokemon-charmander-gen5', name: 'ヒトカゲ' },
            { id: 'pokemon-squirtle-gen5', name: 'ゼニガメ' },
            { id: 'pokemon-mew-gen5', name: 'ミュウ' },
            { id: 'pokemon-vaporeon-gen5', name: 'シャワーズ' },
            { id: 'pokemon-jolteon-gen5', name: 'サンダース' },
        ],
    },
    {
        id: 'super-mario',
        title: 'スーパーマリオの図案',
        patterns: [
            { id: 'smb-small-mario', name: 'マリオ' },
            { id: 'smb-small-luigi', name: 'ルイージ' },
            { id: 'smb-super-mushroom', name: 'スーパーキノコ' },
            { id: 'smb-super-star', name: 'スーパースター' },
        ],
    },
];

function requirePattern(id: string): Pattern {
    const pattern = getPatternById(id);
    if (!pattern) throw new Error(`Japanese library pattern is missing: ${id}`);
    return pattern;
}

function DownloadCard({ id, name }: { id: string; name: string }) {
    const pattern = requirePattern(id);

    return (
        <article className="pattern-card" data-pattern-card={id} aria-labelledby={`${id}-title`}>
            <a
                href={pattern.assets.grid}
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
                    href={pattern.assets.pdf}
                    download={`${id}.pdf`}
                    className="text-link underline decoration-line underline-offset-4 hover:decoration-accent"
                    aria-label={`${name}のPDFをダウンロード（英語表記）`}
                    data-pattern-event="pattern_download"
                    data-pattern-id={id}
                    data-pattern-palette="perler"
                    data-pattern-entry="patterns"
                    data-pattern-format="pdf"
                >
                    PDF（英語）<span aria-hidden="true">↓</span>
                </a>
                <a
                    href={pattern.assets.grid}
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
                href={getPatternHref(pattern)}
                hrefLang="en"
                prefetch={false}
                className="inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-4 hover:text-accent"
                aria-label={`${name}の色・制作メモ・出典を見る（英語）`}
            >
                詳細・出典（英語）
            </Link>
        </article>
    );
}

export default function JapanesePatternLibrary() {
    return (
        <div lang="ja" className="flex min-h-screen flex-col">
            <header className="site-header">
                <a href="#main-content" className="skip-link">本文へ移動</a>
                <div className="site-header-inner">
                    <Link href="/ja/patterns" className="site-brand" aria-label="Fuse Bead Patterns 日本語の図案一覧">
                        <Image src="/logo.png" alt="" width={36} height={36} sizes="36px" />
                        <span lang="en" className="site-brand-name">Fuse Bead Patterns<span className="text-accent" aria-hidden="true">.</span></span>
                    </Link>
                    <nav className="site-nav" aria-label="メインメニュー">
                        <a href="#patterns">図案を選ぶ</a>
                        <a href="#printing">印刷ガイド</a>
                        <Link href="/patterns" hrefLang="en" lang="en">English</Link>
                    </nav>
                </div>
            </header>

            <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
                <nav aria-label="パンくずリスト" className="mb-6 text-xs font-medium text-muted">
                    <ol className="flex flex-wrap items-center gap-x-2">
                        <li><Link href="/" hrefLang="en" className="inline-flex min-h-10 items-center hover:underline">ホーム（英語）</Link></li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">日本語の図案</li>
                    </ol>
                </nav>
                <h1 className="page-heading leading-snug">無料のアイロンビーズ図案</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted sm:text-lg">
                    ポケモンやスーパーマリオの図案を選んで、印刷用PDFやマス目付き画像を無料でダウンロードできます。登録は不要です。
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                    PDF内の説明と色名は英語です。画像を押すと図案を拡大表示できます。
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                    自分の画像を使いたい方は、<Link href="/ja/guides/photo-to-perler-bead-pattern" className="text-link">画像から図案を作る手順</Link>をご覧ください。
                </p>

                <div id="patterns" className="mt-9 space-y-12">
                    {groups.map((group) => (
                        <section key={group.id} aria-labelledby={`${group.id}-heading`}>
                            <h2 id={`${group.id}-heading`} className="mb-6 text-xl font-semibold leading-relaxed sm:text-2xl">{group.title}</h2>
                            <div className="pattern-grid">
                                {group.patterns.map((pattern) => <DownloadCard key={pattern.id} {...pattern} />)}
                            </div>
                        </section>
                    ))}
                </div>

                <section id="printing" aria-labelledby="printing-heading" className="mt-14 border-t border-line pt-8">
                    <h2 id="printing-heading" className="text-2xl font-semibold leading-relaxed">図案の使い方・印刷ガイド</h2>
                    <ol className="mt-5 max-w-3xl list-decimal space-y-3 pl-6 leading-8 text-muted">
                        <li>好きな図案の「PDF（英語）」を押して保存します。画面で見ながら作る場合は、マス目付き画像も使えます。</li>
                        <li>PDFは印刷倍率を100％または「実際のサイズ」に設定します。「用紙に合わせる」は選ばないでください。</li>
                        <li>印刷後、PDFの50mmの目盛りを定規で確認します。図案は29×29マスのミディサイズ用です。実際のプレートの間隔も確認してください。</li>
                        <li>空白のマスにはビーズを置きません。記号と色表を見ながら並べ、細い接続部分は慎重に扱ってください。</li>
                    </ol>
                    <p className="mt-5 max-w-3xl text-sm leading-7 text-muted">
                        配色はPerler Midiをもとにしています。画面の色と実物のビーズの色は異なる場合があります。これらの図案は実物制作・アイロン仕上げを検証していません。ミニビーズ用の原寸図案ではありません。
                    </p>
                </section>

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
                                <Link href="/guides/perler-to-hama-artkal" hrefLang="en" className="text-link">Hama・Artkalへの配色変更ガイド（英語）</Link>
                                から、英語の編集画面で色を変更する手順も確認できます。
                            </p>
                        </details>
                        <details className="py-4">
                            <summary className="min-h-11 cursor-pointer py-2 font-semibold">自分の写真から図案を作れますか？</summary>
                            <p className="mt-2 pb-2 leading-8 text-muted">
                                <Link href="/ja/guides/photo-to-perler-bead-pattern" className="text-link">日本語の作成ガイド</Link>
                                で、画像のアップロード、配色の調整、PDFの保存まで確認できます。実際に操作するツールの画面は英語です。完成済みの図案をこのページから保存する場合は、ツールの操作は必要ありません。
                            </p>
                        </details>
                    </div>
                </section>
            </main>

            <footer className="mt-auto border-t border-line bg-[#edeee7]">
                <div className="mx-auto max-w-[1248px] px-5 py-8 sm:px-10">
                    <p className="text-sm leading-7 text-muted">ほかの図案や編集ツールは英語版で利用できます。</p>
                    <nav aria-label="関連ページ" className="mt-3 flex flex-wrap gap-x-6">
                        <Link href="/patterns" hrefLang="en" className="text-link">すべての図案（英語）</Link>
                        <Link href="/privacy-policy" hrefLang="en" className="text-link">プライバシー（英語）</Link>
                        <Link href="/terms-of-service" hrefLang="en" className="text-link">利用規約（英語）</Link>
                    </nav>
                    <p className="mt-5 max-w-3xl text-xs leading-6 text-muted">
                        © 2026 Fuse Bead Patterns. 当サイトは各ビーズブランドやキャラクターの権利元の公式サイトではありません。
                    </p>
                </div>
            </footer>
        </div>
    );
}

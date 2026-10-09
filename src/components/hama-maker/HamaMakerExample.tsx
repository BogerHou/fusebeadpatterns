import Image from 'next/image';
import type { SiteLocale } from '@/lib/i18n/locales';
import { getHamaGhostExampleDownloads, hamaGhostExample } from '@/lib/hama-maker/example';

const exampleCopy = {
    en: {
        heading: 'Try a two-colour image', source: 'Original pixel drawing', result: 'Hama Midi result',
        intro: 'This original Ghost uses H01 White and H18 Black. Download the Hama project below and load it with Open Project to use its two-colour palette. Then upload the source PNG. Keep the 29 × 29 grid and dithering off.',
        help: 'The two-colour conversion keeps every occupied square and the empty background. H01 and H18 refer to Hama colours 01 and 18. These previews use approximate screen colours; check your actual beads before crafting.',
        sourceLink: 'Download the source PNG', pdf: 'Hama result — A4 PDF', letter: 'Hama result — US Letter PDF', project: 'Save the Hama project', edit: 'Open the Hama result in the editor',
    },
    de: {
        heading: 'Ein Bild mit zwei Farben ausprobieren', source: 'Ursprüngliche Pixelzeichnung', result: 'Ergebnis mit Hama Midi',
        intro: 'Unser eigener Geist verwendet H01 White und H18 Black. Lade das Hama-Projekt unten herunter und öffne es mit „Projekt öffnen“, um seine Zweifarbenpalette zu nutzen. Lade danach die Original-PNG hoch. Verwende das Raster mit 29 × 29 Feldern ohne Dithering.',
        help: 'Die Umwandlung mit zwei Farben behält alle belegten Felder und den leeren Hintergrund. H01 und H18 stehen für die Hama-Farben 01 und 18. Die Vorschau zeigt angenäherte Bildschirmfarben; prüfe deine echten Perlen vor dem Basteln.',
        sourceLink: 'Original-PNG herunterladen', pdf: 'Hama-Ergebnis — PDF A4', letter: 'Hama-Ergebnis — PDF US Letter', project: 'Hama-Projekt speichern', edit: 'Hama-Ergebnis im Editor öffnen',
    },
    fr: {
        heading: 'Essayer une image à deux couleurs', source: 'Dessin original en pixels', result: 'Résultat Hama Midi',
        intro: 'Notre fantôme original utilise H01 White et H18 Black. Téléchargez le projet Hama ci-dessous et chargez-le avec « Ouvrir un projet » pour utiliser sa palette à deux couleurs. Importez ensuite le PNG source. Gardez la grille de 29 × 29 cases sans tramage.',
        help: 'La conversion à deux couleurs conserve les cases occupées et le fond vide. H01 et H18 désignent les couleurs Hama 01 et 18. Les couleurs à l’écran sont approximatives : vérifiez vos perles avant de réaliser le motif.',
        sourceLink: 'Télécharger le PNG source', pdf: 'Résultat Hama — PDF A4', letter: 'Résultat Hama — PDF US Letter', project: 'Enregistrer le projet Hama', edit: 'Ouvrir le résultat Hama dans l’éditeur',
    },
    ja: {
        heading: '2色の画像で試す', source: '元のピクセル画', result: 'Hama Midiでの変換結果',
        intro: 'オリジナルのゴーストはH01 WhiteとH18 Blackの2色です。下のHamaプロジェクトを保存し、「プロジェクトを開く」で読み込むと、この2色のパレットを使えます。続いて元のPNGを読み込みます。29 × 29マスのまま、ディザリングをオフにしてください。',
        help: '2色で変換しても、色のあるマスと空白の背景はそのままです。H01とH18はHamaの色番号01と18を表します。画面の色は近似値なので、制作前に手元のビーズを確認してください。',
        sourceLink: '元のPNGを保存', pdf: 'Hamaの変換結果 — A4 PDF', letter: 'Hamaの変換結果 — US Letter PDF', project: 'Hamaプロジェクトを保存', edit: 'Hamaの変換結果をエディターで開く',
    },
} satisfies Record<SiteLocale, Record<string, string>>;

export default function HamaMakerExample({ locale }: { locale: SiteLocale }) {
    const copy = exampleCopy[locale];
    const downloads = getHamaGhostExampleDownloads(locale);
    return <section aria-labelledby="hama-example" className="mt-10 border-t border-line pt-8">
        <h2 id="hama-example" className="font-display text-2xl font-semibold text-ink">{copy.heading}</h2>
        <p className="mt-4 max-w-[75ch] text-base leading-7 text-muted">{copy.intro}</p>
        <div className="mt-5 grid max-w-xl grid-cols-2 gap-5">
            {[{ image: hamaGhostExample.source, label: copy.source }, { image: hamaGhostExample.result, label: copy.result }].map(item => <figure key={item.image}>
                <Image src={item.image} alt={item.label} width={29} height={29} unoptimized className="aspect-square h-auto w-full max-w-[240px] rounded-lg bg-[#e8e2d5]" style={{ imageRendering: 'pixelated' }} />
                <figcaption className="mt-2 text-sm leading-6 text-muted">{item.label}</figcaption>
            </figure>)}
        </div>
        <p className="mt-4 max-w-[75ch] text-sm leading-7 text-muted">{copy.help}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            <a href={hamaGhostExample.source} download="ghost-source.png" className="text-link">{copy.sourceLink}</a>
            <a href={downloads.pdf} download className="text-link">{copy.pdf}</a>
            <a href={downloads.letter} download className="text-link">{copy.letter}</a>
            <a href={downloads.project} download className="text-link">{copy.project}</a>
            <a href={downloads.editor} className="text-link">{copy.edit}</a>
        </div>
    </section>;
}

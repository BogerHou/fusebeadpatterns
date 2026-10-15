import Image from 'next/image';
import Link from 'next/link';
import type { SiteLocale } from '../../lib/i18n/locales';
import { getHamaOriginalVariant, hamaBlackCatId } from '../../lib/patterns/hama-original-variants';

const copy = {
    en: {
        intro: 'This fixed Hama Midi version keeps the same sitting black cat: 181 beads in two colours on one 29 × 29 board. The 16 × 16 motif uses 177 black beads and four yellow beads. The symbols and quantities below match every Hama download here.',
        print: 'Choose A4 or US Letter and print at 100% / actual size. Check both 50 mm rulers and the nominal 5 mm grid against your pegboard. These PDFs are for Midi, not Mini or Maxi. The grid PNG is a counting chart; the pixel PNG is a 29 × 29 image without grid lines. In the editor, H18 and H03 mean Hama 18 and 03; H is our software palette prefix.',
        limits: 'Screen colours are approximate. The files have been checked digitally; this version has not been assembled or iron-tested with real beads. After editing, export a new chart from the editor.',
        a4: 'Hama A4 PDF', letter: 'Hama US Letter PDF', grid: 'Hama grid PNG', pixels: 'Hama pixel PNG', project: 'Save Hama project', edit: 'Edit Hama version',
        symbol: 'Symbol', colour: 'Hama colour', quantity: 'Beads', total: 'Total',
        link: 'Black cat Hama Midi pattern: PDFs and editable project',
    },
    de: {
        intro: 'Diese feste Hama-Midi-Variante zeigt dieselbe sitzende schwarze Katze: 181 Perlen in zwei Farben auf einer 29 × 29-Steckplatte. Das 16 × 16-Motiv verwendet 177 schwarze und vier gelbe Perlen. Symbole und Mengen stimmen mit allen Hama-Downloads hier überein.',
        print: 'Wähle A4 oder US Letter und drucke mit 100 % / tatsächlicher Größe. Prüfe beide 50-mm-Maßlinien und das nominelle 5-mm-Raster an deiner Steckplatte. Die PDFs sind für Midi, nicht Mini oder Maxi. Das Raster-PNG ist eine Zählvorlage; das Pixel-PNG ist ein Bild mit 29 × 29 Pixeln ohne Rasterlinien. Im Editor stehen H18 und H03 für Hama 18 und 03; H ist das Präfix unserer Softwarepalette.',
        limits: 'Bildschirmfarben sind Näherungswerte. Die Dateien wurden digital geprüft; diese Variante wurde nicht mit echten Perlen gesteckt oder gebügelt. Exportiere nach Änderungen eine neue Vorlage im Editor.',
        a4: 'Hama-PDF A4', letter: 'Hama-PDF US Letter', grid: 'Hama-Raster-PNG', pixels: 'Hama-Pixel-PNG', project: 'Hama-Projekt speichern', edit: 'Hama-Variante bearbeiten',
        symbol: 'Symbol', colour: 'Hama-Farbe', quantity: 'Perlen', total: 'Gesamt',
        link: 'Schwarze Katze mit Hama Midi: PDFs und bearbeitbares Projekt',
    },
    fr: {
        intro: 'Cette version Hama Midi reprend le même chat noir assis : 181 perles de deux couleurs sur une plaque de 29 × 29 picots. Le motif de 16 × 16 perles utilise 177 perles noires et quatre jaunes. Les symboles et quantités correspondent à tous les fichiers Hama proposés ici.',
        print: 'Choisissez A4 ou US Letter et imprimez à 100 % / taille réelle. Vérifiez les deux repères de 50 mm et la grille nominale de 5 mm avec votre plaque. Ces PDF sont pour Midi, pas Mini ou Maxi. Le PNG avec grille sert à compter les perles ; le PNG pixelisé est une image de 29 × 29 pixels sans lignes de grille. Dans l’éditeur, H18 et H03 désignent Hama 18 et 03 ; H est le préfixe de notre palette logicielle.',
        limits: 'Les couleurs à l’écran sont approximatives. Les fichiers ont été vérifiés numériquement ; cette version n’a pas été assemblée ni repassée avec de vraies perles. Après modification, exportez une nouvelle grille depuis l’éditeur.',
        a4: 'PDF Hama A4', letter: 'PDF Hama US Letter', grid: 'Grille Hama PNG', pixels: 'Image Hama pixelisée PNG', project: 'Enregistrer le projet Hama', edit: 'Modifier la version Hama',
        symbol: 'Symbole', colour: 'Couleur Hama', quantity: 'Perles', total: 'Total',
        link: 'Chat noir en Hama Midi : PDF et projet modifiable',
    },
    ja: {
        intro: '同じ座った黒猫をHama Midiの2色で作る配色です。29×29マスのプレート1枚に、黒177個・黄色4個の合計181個を使い、16×16マスの図柄を作ります。下の記号と個数は、ここで保存するすべてのHama図案と一致します。',
        print: '用紙に合わせてA4かUS Letterを選び、100％・実際のサイズで印刷してください。縦横の50 mm目盛りと公称5 mmのマス間隔を、お使いのプレートで確認します。PDFはMidi用で、Mini・Maxi用ではありません。マス目PNGは数を確認するための図で、ピクセルPNGは罫線のない29×29ピクセルの画像です。エディターのH18・H03はHamaの18・03に対応し、Hはソフト内の色板を示す接頭辞です。',
        limits: '画面の色は近似色です。ファイルはデータ上で検証しましたが、この配色で実物を組み立てたり、アイロンで仕上げたりした検証は行っていません。編集後はエディターから新しい図案を書き出してください。',
        a4: 'Hama A4 PDF', letter: 'Hama US Letter PDF', grid: 'Hamaのマス目PNG', pixels: 'HamaのピクセルPNG', project: 'Hamaプロジェクトを保存', edit: 'Hama配色を編集',
        symbol: '記号', colour: 'Hamaの色', quantity: '個数', total: '合計',
        link: 'Hama Midi配色の黒猫図案：PDFと編集用プロジェクト',
    },
};

export function HamaOriginalLink({ locale = 'en' }: { locale?: SiteLocale }) {
    const variant = getHamaOriginalVariant(hamaBlackCatId, locale)!;
    return <p className="mt-3 text-sm leading-7"><Link href={variant.detail} prefetch={false} className="text-link">{copy[locale].link}</Link></p>;
}

export default function HamaOriginalDownloads({ patternId, locale = 'en' }: { patternId: string; locale?: SiteLocale }) {
    const variant = getHamaOriginalVariant(patternId, locale);
    if (!variant) return null;
    const text = copy[locale];
    const title = `${variant.name} — Hama Midi`;
    const tracking = { 'data-pattern-id': variant.projectId, 'data-pattern-palette': variant.paletteId, 'data-pattern-entry': 'pattern_detail' };
    const downloads = [
        { href: variant.pdf, label: text.a4, format: 'pdf', language: locale },
        { href: variant.pdfLetter, label: text.letter, format: 'pdf', language: locale },
        { href: variant.grid, label: text.grid, format: 'grid_png', language: locale },
        { href: variant.pixels, label: text.pixels, format: 'png', language: undefined },
        { href: variant.project, label: text.project, format: 'project', language: undefined },
    ];
    return <section id="hama-midi" aria-labelledby="hama-original-heading" className="mt-12 scroll-mt-6 border-t border-line pt-8">
        <h2 id="hama-original-heading" className="section-heading">{title}</h2>
        <p className="mt-4 max-w-3xl leading-7 text-muted">{text.intro}</p>
        <div className="mt-5 flex flex-col items-start gap-6 sm:flex-row">
            <Image src={variant.preview} alt={title} width={580} height={580} unoptimized className="h-auto w-44 rounded-xl border border-line" />
            <table className="w-full max-w-lg text-left text-sm">
                <caption className="sr-only">{title} · {text.colour}</caption>
                <thead><tr className="border-b border-line"><th scope="col" className="py-2">{text.symbol}</th><th scope="col" className="py-2">{text.colour}</th><th scope="col" className="py-2 text-right">{text.quantity}</th></tr></thead>
                <tbody>{variant.materials.map(color => <tr key={color.ref} className="border-b border-line"><td className="py-2">{color.symbol}</td><td className="py-2"><span aria-hidden="true" className="mr-2 inline-block h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: color.hex }} />{color.ref.slice(1)} {color.name}</td><td className="py-2 text-right tabular-nums">{color.count}</td></tr>)}</tbody>
                <tfoot><tr><th scope="row" colSpan={2} className="py-2">{text.total}</th><td className="py-2 text-right font-semibold">{variant.materials.reduce((sum, color) => sum + color.count, 0)}</td></tr></tfoot>
            </table>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            {downloads.map(download => <a key={download.href} href={download.href} hrefLang={download.language} download {...tracking} data-pattern-event="pattern_download" data-pattern-format={download.format} className="text-link">{download.label}</a>)}
            <Link href={variant.editor} hrefLang={locale} prefetch={false} {...tracking} data-pattern-event="pattern_editor_open" className="text-link">{text.edit} →</Link>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{text.print}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{text.limits}</p>
    </section>;
}

import Image from 'next/image';
import Link from 'next/link';
import type { SiteLocale } from '../../lib/i18n/locales';
import { getCherriesHamaVariant, hamaCherriesId } from '../../lib/patterns/cherries-hama';

const copy = {
    en: {
        intro: 'The original paired cherries in Hama Midi: {beads} beads in {colors} colours on one {board} board. The motif measures {motif} beads. The table matches these fixed Hama downloads.',
        palette: 'These downloads use a fixed set of opaque Hama Midi colours. Automatic brand conversion with the editor’s full palette may choose other colours.',
        print: 'Print A4 or US Letter at 100% / actual size. Check both 50 mm rulers and the nominal 5 mm grid against your pegboard. These PDFs are for Midi, not Mini or Maxi. The grid PNG is a counting chart; the pixel PNG is a 29 × 29 image without grid lines. H in the project colour codes is our software palette prefix.',
        limits: 'Screen colours are approximate. A connected digital pattern does not guarantee the strength of a fused piece. This version has not been physically assembled or iron-tested. After editing, export a new chart from the editor.',
        a4: 'Hama A4 PDF', letter: 'Hama US Letter PDF', grid: 'Hama grid PNG', pixels: 'Hama pixel PNG', project: 'Save Hama project', edit: 'Edit Hama version',
        symbol: 'Symbol', colour: 'Hama colour', quantity: 'Beads', total: 'Total',
    },
    de: {
        intro: 'Das eigene Kirschenmotiv in Hama Midi: {beads} Perlen in {colors} Farben auf einer {board}-Steckplatte. Das Motiv misst {motif} Perlen. Die Tabelle stimmt mit diesen festen Hama-Downloads überein.',
        palette: 'Diese Dateien verwenden eine feste Auswahl deckender Hama-Midi-Farben. Der automatische Markenwechsel mit der vollständigen Editorpalette kann andere Farben wählen.',
        print: 'Drucke A4 oder US Letter mit 100 % / tatsächlicher Größe. Prüfe beide 50-mm-Maßlinien und das nominelle 5-mm-Raster an deiner Steckplatte. Die PDFs sind für Midi, nicht Mini oder Maxi. Das Raster-PNG ist eine Zählvorlage; das Pixel-PNG hat 29 × 29 Pixel ohne Rasterlinien. H in den Farbcodes des Projekts ist das Präfix unserer Softwarepalette.',
        limits: 'Bildschirmfarben sind Näherungswerte. Ein digital zusammenhängendes Muster garantiert nicht die Festigkeit nach dem Bügeln. Diese Variante wurde nicht mit echten Perlen gesteckt oder gebügelt. Exportiere nach Änderungen eine neue Vorlage im Editor.',
        a4: 'Hama-PDF A4', letter: 'Hama-PDF US Letter', grid: 'Hama-Raster-PNG', pixels: 'Hama-Pixel-PNG', project: 'Hama-Projekt speichern', edit: 'Hama-Variante bearbeiten',
        symbol: 'Symbol', colour: 'Hama-Farbe', quantity: 'Perlen', total: 'Gesamt',
    },
    fr: {
        intro: 'Le duo de cerises original en Hama Midi : {beads} perles de {colors} couleurs sur une plaque de {board} picots. Le motif mesure {motif} perles. Le tableau correspond à ces fichiers Hama fixes.',
        palette: 'Ces fichiers utilisent une sélection fixe de couleurs Hama Midi opaques. La conversion automatique avec la palette complète de l’éditeur peut choisir d’autres couleurs.',
        print: 'Imprimez sur A4 ou US Letter à 100 % / taille réelle. Vérifiez les deux repères de 50 mm et la grille nominale de 5 mm avec votre plaque. Ces PDF sont pour Midi, pas Mini ou Maxi. Le PNG avec grille sert à compter ; le PNG pixelisé fait 29 × 29 pixels sans lignes de grille. H dans les références du projet est le préfixe de notre palette logicielle.',
        limits: 'Les couleurs à l’écran sont approximatives. Un motif connecté numériquement ne garantit pas la solidité après repassage. Cette version n’a pas été assemblée ni repassée avec de vraies perles. Après modification, exportez une nouvelle grille depuis l’éditeur.',
        a4: 'PDF Hama A4', letter: 'PDF Hama US Letter', grid: 'Grille Hama PNG', pixels: 'Image Hama pixelisée PNG', project: 'Enregistrer le projet Hama', edit: 'Modifier la version Hama',
        symbol: 'Symbole', colour: 'Couleur Hama', quantity: 'Perles', total: 'Total',
    },
    ja: {
        intro: 'オリジナルのさくらんぼ2個をHama Midiで作る配色です。{board}マスのプレート1枚に、{colors}色・合計{beads}個を使います。図柄は{motif}マスです。下の表は、このHama図案のファイルと一致します。',
        palette: 'この図案は不透明色だけの固定Hama Midi配色です。エディターの全色板で自動変換すると、別の色が選ばれることがあります。',
        print: 'A4かUS Letterを選び、100％・実際のサイズで印刷してください。縦横の50 mm目盛りと公称5 mmのマス間隔を、お使いのプレートで確認します。PDFはMidi用で、Mini・Maxi用ではありません。マス目PNGは数を確認する図で、ピクセルPNGは罫線のない29×29ピクセルの画像です。プロジェクトの色番号に付くHはソフト内の色板を示す接頭辞です。',
        limits: '画面の色は近似色です。データ上でビーズがつながっていても、完成品の強度は保証されません。この配色で実物を組み立てたり、アイロンで仕上げたりした検証は行っていません。編集後はエディターから新しい図案を書き出してください。',
        a4: 'Hama A4 PDF', letter: 'Hama US Letter PDF', grid: 'Hamaのマス目PNG', pixels: 'HamaのピクセルPNG', project: 'Hamaプロジェクトを保存', edit: 'Hama配色を編集',
        symbol: '記号', colour: 'Hamaの色', quantity: '個数', total: '合計',
    },
};

export default function CherriesHamaDownloads({ locale = 'en' }: { locale?: SiteLocale }) {
    const variant = getCherriesHamaVariant(hamaCherriesId, locale);
    if (!variant) return null;
    const text = copy[locale], title = `${variant.name} — Hama Midi`;
    const values: Record<string, string | number> = { beads: variant.beadCount, colors: variant.materials.length,
        board: `${variant.board.width} × ${variant.board.height}`, motif: `${variant.motif.width} × ${variant.motif.height}` };
    const intro = text.intro.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
    const tracking = { 'data-pattern-id': variant.projectId, 'data-pattern-palette': variant.paletteId, 'data-pattern-entry': 'pattern_detail' };
    const downloads = [
        { href: variant.pdf, label: text.a4, format: 'pdf', language: locale },
        { href: variant.pdfLetter, label: text.letter, format: 'pdf', language: locale },
        { href: variant.grid, label: text.grid, format: 'grid_png', language: locale },
        { href: variant.pixels, label: text.pixels, format: 'png', language: undefined },
        { href: variant.project, label: text.project, format: 'project', language: undefined },
    ];
    return <section id="hama-midi" aria-labelledby="cherries-hama-heading" className="mt-12 scroll-mt-6 border-t border-line pt-8">
        <h2 id="cherries-hama-heading" className="section-heading">{title}</h2>
        <p className="mt-4 max-w-3xl leading-7 text-muted">{intro}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{text.palette}</p>
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

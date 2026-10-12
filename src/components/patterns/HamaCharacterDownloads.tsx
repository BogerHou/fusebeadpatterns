import Image from 'next/image';
import Link from 'next/link';
import type { SiteLocale } from '../../lib/i18n/locales';
import { getHamaCharacterVariant, hamaCreeperId } from '../../lib/patterns/hama-character-variants';
import { getPatternFanArtNotice } from '../../lib/patterns/fan-art';

const copy = {
    en: {
        intro: 'Use this fixed Hama Midi version for the same 16 × 16 face: 256 beads in three colours on one 29 × 29 board. The colour numbers and quantities below match these downloads.',
        print: 'Print the PDF at 100% / actual size. Check both 50 mm rulers and the nominal 5 mm grid against your pegboard. The PNG is a counting chart, not an actual-size template.',
        limits: 'Screen colours are approximate. This version has not been physically assembled or iron-tested. Permission for public redistribution of the character design is unconfirmed.',
        a4: 'Download Hama A4 PDF', letter: 'Download Hama US Letter PDF', grid: 'Download Hama grid PNG', project: 'Save Hama project', edit: 'Edit Hama version',
        symbol: 'Symbol', colour: 'Hama colour', quantity: 'Beads', total: 'Total',
        link: 'Creeper Face in Hama Midi colours (unofficial fan art)',
    },
    de: {
        intro: 'Diese feste Hama-Midi-Variante zeigt dasselbe 16 × 16-Motiv: 256 Perlen in drei Farben auf einer 29 × 29-Steckplatte. Die Farbnummern und Mengen stimmen mit den Downloads überein.',
        print: 'Drucke das PDF mit 100 % / tatsächlicher Größe. Prüfe beide 50-mm-Maßlinien und das nominelle 5-mm-Raster an deiner Steckplatte. Das PNG ist eine Zählvorlage, keine Vorlage in Originalgröße.',
        limits: 'Bildschirmfarben sind Näherungswerte. Diese Variante wurde nicht mit echten Perlen gesteckt oder gebügelt. Eine Erlaubnis zur öffentlichen Weitergabe des Figurenmotivs ist nicht bestätigt.',
        a4: 'Hama-PDF A4 herunterladen', letter: 'Hama-PDF US Letter herunterladen', grid: 'Hama-Raster als PNG herunterladen', project: 'Hama-Projekt speichern', edit: 'Hama-Variante bearbeiten',
        symbol: 'Symbol', colour: 'Hama-Farbe', quantity: 'Perlen', total: 'Gesamt',
        link: 'Creeper-Gesicht in Hama-Midi-Farben (inoffizielle Fan Art)',
    },
    fr: {
        intro: 'Cette version Hama Midi reprend le même visage de 16 × 16 perles : 256 perles de trois couleurs sur une plaque de 29 × 29 picots. Les références et quantités ci-dessous correspondent aux fichiers à télécharger.',
        print: 'Imprimez le PDF à 100 % / taille réelle. Vérifiez les deux repères de 50 mm et la grille nominale de 5 mm avec votre plaque. Le PNG sert à compter les perles, pas à les placer à taille réelle.',
        limits: 'Les couleurs à l’écran sont approximatives. Cette version n’a pas été assemblée ni repassée avec de vraies perles. L’autorisation de redistribuer publiquement le dessin du personnage n’est pas confirmée.',
        a4: 'Télécharger le PDF Hama A4', letter: 'Télécharger le PDF Hama US Letter', grid: 'Télécharger la grille Hama PNG', project: 'Enregistrer le projet Hama', edit: 'Modifier la version Hama',
        symbol: 'Symbole', colour: 'Couleur Hama', quantity: 'Perles', total: 'Total',
        link: 'Visage du Creeper en couleurs Hama Midi (fan art non officiel)',
    },
    ja: {
        intro: '同じ16×16マスの顔をHama Midiの3色で作る配色です。29×29マスのプレート1枚に256個のビーズを使います。下の色番号と個数は、ダウンロードする図案と一致します。',
        print: 'PDFは100％・実際のサイズで印刷し、縦横の50 mm目盛りと公称5 mmのマス間隔を、お使いのプレートで確認してください。PNGはマスを数えるための図で、実寸配置用ではありません。',
        limits: '画面の色は近似色です。この配色で実物を組み立てたり、アイロンで仕上げたりした検証は行っていません。キャラクター図案の公開再配布許可は確認されていません。',
        a4: 'Hama A4 PDFを保存', letter: 'Hama US Letter PDFを保存', grid: 'Hamaのマス目PNGを保存', project: 'Hamaプロジェクトを保存', edit: 'Hama配色を編集',
        symbol: '記号', colour: 'Hamaの色', quantity: '個数', total: '合計',
        link: 'Hama Midi配色のクリーパーの顔（非公式ファンアート）',
    },
};

export function HamaCharacterLink({ locale = 'en' }: { locale?: SiteLocale }) {
    const variant = getHamaCharacterVariant(hamaCreeperId, locale)!;
    return <p className="mt-6 text-sm leading-7"><Link href={variant.detail} prefetch={false} className="text-link">{copy[locale].link}</Link></p>;
}

export default function HamaCharacterDownloads({ patternId, locale = 'en' }: { patternId: string; locale?: SiteLocale }) {
    const variant = getHamaCharacterVariant(patternId, locale);
    if (!variant) return null;
    const text = copy[locale];
    const title = `${variant.name} — Hama Midi`;
    const tracking = { 'data-pattern-id': variant.projectId, 'data-pattern-palette': variant.paletteId, 'data-pattern-entry': 'pattern_detail' };
    const downloads = [
        { href: variant.pdf, label: text.a4, format: 'pdf', language: locale },
        { href: variant.pdfLetter, label: text.letter, format: 'pdf', language: locale },
        { href: variant.grid, label: text.grid, format: 'grid_png', language: locale },
        { href: variant.project, label: text.project, format: 'project', language: undefined },
    ];
    return <section id="hama-midi" aria-labelledby="hama-character-heading" className="mt-12 scroll-mt-6 border-t border-line pt-8">
        <h2 id="hama-character-heading" className="section-heading">{title}</h2>
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
            <Link href={variant.editor} prefetch={false} {...tracking} data-pattern-event="pattern_editor_open" className="text-link">{text.edit} →</Link>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{text.print}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{text.limits}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{getPatternFanArtNotice({ id: variant.id }, locale)}</p>
    </section>;
}

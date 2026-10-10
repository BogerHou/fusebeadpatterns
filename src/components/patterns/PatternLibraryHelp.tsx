import Link from 'next/link';
import type { SiteLocale } from '../../lib/i18n/locales';
import { guideHref } from '../../lib/guides/routes';

const messages = {
    en: {
        title: 'Using and printing your pattern',
        steps: [
            'Open a picture to check its size, bead colors and assembly notes, then download the PDF from its detail page.',
            'Use the paper size offered by the file: A4, or US Letter where available. Print at 100% / actual size with “Fit to page” turned off.',
            'Check the PDF’s 50 mm scale line and your actual pegboard before placing beads. Leave empty cells free; white cells with a symbol need white beads.',
        ],
        editing: 'To change beads or colors, open the pattern in the editor, choose your brand and click “Apply Changes” before exporting a new chart and materials list. The prepared downloads keep their original palette. Save your edits as a project before starting another design.',
        note: 'Screen colors are approximate. These patterns have not been physically assembled or iron-tested. A small design is not an actual-size template for Mini beads.',
        board: 'Pegboard size guide', brand: 'Change bead brands', quick: 'Open the quick PDF downloads',
    },
    de: {
        title: 'So druckst du deine Vorlage',
        steps: [
            'Öffne ein Bild, prüfe Größe, Perlenfarben und Bastelhinweise und speichere das deutsche PDF auf der Detailseite.',
            'Verwende das angebotene Papierformat: A4 oder, falls vorhanden, US Letter. Drucke mit 100 % / tatsächlicher Größe und schalte „An Seite anpassen“ aus.',
            'Miss die 50-mm-Kontrolllinie und prüfe deine Steckplatte, bevor du Perlen legst. Leere Felder bleiben frei; weiße Felder mit Symbol brauchen weiße Perlen.',
        ],
        editing: 'Für andere Farben oder eine andere Marke öffne die Vorlage im deutschen Editor, wähle deine Marke und klicke auf „Änderungen anwenden“, bevor du eine neue Vorlage samt Farbliste exportierst. Die vorbereiteten Downloads behalten ihre ursprüngliche Palette. Speichere deine Bearbeitung als Projekt, bevor du ein anderes Motiv öffnest.',
        note: 'Bildschirmfarben sind Näherungen. Die Motive wurden nicht mit echten Perlen gesteckt und gebügelt. Ein kleines Motiv ist keine Vorlage in Originalgröße für Mini-Perlen.',
        board: 'Steckplattengröße wählen', brand: 'Perlenmarke wechseln', quick: 'Auswahl mit deutschen PDFs öffnen',
    },
    fr: {
        title: 'Utiliser et imprimer un modèle',
        steps: [
            'Ouvrez une image pour vérifier la taille, les couleurs et les conseils de réalisation, puis téléchargez le PDF en français sur sa fiche.',
            'Utilisez le format proposé par le fichier : A4 ou US Letter, si disponible. Imprimez à 100 % / taille réelle, sans « Ajuster à la page ».',
            'Vérifiez le repère de 50 mm et votre plaque avant de poser les perles. Les cases vides restent libres ; une case blanche avec un symbole nécessite une perle blanche.',
        ],
        editing: 'Pour changer les couleurs ou la marque, ouvrez le modèle dans l’éditeur en français, choisissez votre marque et cliquez sur « Appliquer » avant d’exporter une nouvelle grille avec sa liste de couleurs. Les fichiers préparés conservent leur palette d’origine. Enregistrez vos modifications comme projet avant d’ouvrir un autre motif.',
        note: 'Les couleurs à l’écran sont approximatives. Les motifs n’ont pas été assemblés avec des perles réelles ni testés au fer. Un petit dessin n’est pas un gabarit à taille réelle pour perles Mini.',
        board: 'Choisir la taille de la plaque', brand: 'Changer de marque de perles', quick: 'Ouvrir les téléchargements PDF rapides',
    },
    ja: {
        title: '図案の使い方・印刷ガイド',
        steps: [
            '画像から詳細ページを開き、大きさ・色表・制作時の注意を確認して、日本語PDFを保存します。',
            'ファイルに用意された用紙を使います。A4、または対応する図案ではUS Letterを選び、100％・実際のサイズで印刷してください。「用紙に合わせる」は選びません。',
            'PDFの50 mmの目盛りと実際のプレートを確認してからビーズを並べます。空白のマスには置かず、記号のある白いマスには白ビーズを置きます。',
        ],
        editing: '配色やブランドを変える場合は日本語エディターで図案を開き、ブランドを選んで「変更を適用」を押してから、新しい図案と色表を書き出します。このページの保存済みファイルは元の配色です。別の図案を開く前に、編集内容をプロジェクトとして保存してください。',
        note: '画面の色は目安です。実物での組み立て・アイロン仕上げは検証していません。小さな図柄でもミニビーズ用の原寸シートではありません。',
        board: 'プレートの大きさを確認', brand: 'ビーズのブランドを変更', quick: '日本語PDFのクイックダウンロードを開く',
    },
};

export default function PatternLibraryHelp({ locale, id, quickDownloadHref }: { locale: SiteLocale; id?: string; quickDownloadHref?: string }) {
    const copy = messages[locale];
    const headingId = locale === 'de' ? 'print-heading' : locale === 'ja' ? 'printing-heading' : 'pattern-printing-heading';
    return <section id={id ?? (locale === 'de' ? 'drucken' : 'printing')} aria-labelledby={headingId} className="mt-14 border-t border-line pt-8">
        <h2 id={headingId} className="section-heading">{copy.title}</h2>
        <ol className="mt-5 max-w-3xl list-decimal space-y-3 pl-6 leading-8 text-muted">
            {copy.steps.map(step => <li key={step}>{step}</li>)}
        </ol>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-muted">{copy.editing}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{copy.note}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Link href={guideHref('perler-bead-pegboards', locale)} className="text-link">{copy.board}</Link>
            <Link href={guideHref('perler-to-hama-artkal', locale)} className="text-link">{copy.brand}</Link>
            {quickDownloadHref && <a href={quickDownloadHref} className="text-link">{copy.quick}</a>}
        </div>
    </section>;
}

import type { Metadata } from 'next';
import type { SiteLocale } from '../i18n/locales';
import { localeRoutes } from '../i18n/routes';

type LoomPatternLibraryContent = {
    title: string;
    description: string;
    heading: string;
    introduction: string;
    home: string;
    breadcrumb: string;
    collectionLabel: string;
    libraryLink: string;
    dimensions: (columns: number, rows: number) => string;
    previewCaption: string;
    pdfA4: string;
    pdfLetter: string;
    png: string;
    project: string;
    edit: string;
    download: string;
    helpHeading: string;
    steps: readonly [string, string, string];
    chartHelp: string;
    sizingHelp: string;
    makerLink: string;
    guideLink: string;
    footer: string;
};

export const loomPatternLibraryContent: Record<SiteLocale, LoomPatternLibraryContent> = {
    en: {
        title: 'Free Bead Loom Patterns — Printable PDF Charts | Fuse Bead Patterns',
        description: 'Download three free bead loom patterns: heart, chevron and diamond bands. A4 and US Letter PDFs, chart PNGs and editable projects, each 11 beads across and 61 rows.',
        heading: 'Free Bead Loom Patterns',
        introduction: 'Download a heart, chevron or diamond band pattern for your bead loom. These three original charts include color symbols, bead counts and row-by-row instructions. Choose A4 or US Letter PDF, a chart PNG or an editable project. No account needed.',
        home: 'Home',
        breadcrumb: 'Breadcrumb',
        collectionLabel: 'Free printable bead loom charts',
        libraryLink: 'Download free bead loom patterns',
        dimensions: (columns, rows) => `${columns} beads across × ${rows} rows`,
        previewCaption: 'Color previews are shown sideways; the downloads show the chart and reading order.',
        pdfA4: 'A4 PDF',
        pdfLetter: 'US Letter PDF',
        png: 'Chart PNG',
        project: 'Editable project',
        edit: 'Edit this pattern',
        download: 'Download',
        helpHeading: 'Use your downloaded pattern',
        steps: [
            'Download the PDF for your paper size, or save the chart PNG. The PDFs include a lettered chart, a color list with bead counts and the row instructions.',
            'Match each color letter to beads you own before weaving. Screen and printed colors are approximate, and the color names are editable labels rather than manufacturer codes. Every cell, including the background, needs one bead. Counts exclude spare beads, thread and finishing materials.',
            'Choose “Edit this pattern” to load it in the bead loom pattern maker. Adjust colors, dimensions and reading settings, then download a new chart and save the editable project before leaving. A downloaded project can be reopened using Open Project.',
        ],
        chartHelp: 'These are filled rectangular charts for loom beadwork. The PDF and PNG are reading charts, not life-size templates. Row 1 starts at the bottom left, and successive rows alternate direction. Follow the chart symbols and row instructions.',
        sizingHelp: 'The supplied charts use square cells (bead shape ratio 1). Measure a woven sample and divide the width of one bead space by the height of one row, then adjust the bead shape setting in the maker and save your project. Your beads, thread tension and finishing determine the finished size.',
        makerLink: 'Make your own bead loom pattern',
        guideLink: 'Browse bead craft guides',
        footer: 'Download original bead loom charts as A4 or US Letter PDFs, save a chart PNG, or open an editable pattern with your own colors.',
    },
    de: {
        title: 'Kostenlose Perlenwebmuster — PDF und PNG | Fuse Bead Patterns',
        description: 'Lade drei kostenlose Perlenwebmuster herunter: Herz-, Chevron- und Rautenbänder. A4- und US-Letter-PDFs, Raster-PNGs und Projekte mit 11 Perlen pro Reihe und 61 Reihen.',
        heading: 'Kostenlose Perlenwebmuster',
        introduction: 'Lade ein Herz-, Chevron- oder Rautenmuster für deinen Perlenwebrahmen herunter. Die drei eigenen Entwürfe enthalten Farbbuchstaben, Perlenanzahlen und Reihenanleitungen. Wähle eine A4- oder US-Letter-PDF, ein Raster-PNG oder ein bearbeitbares Projekt. Ohne Konto.',
        home: 'Startseite',
        breadcrumb: 'Brotkrümelnavigation',
        collectionLabel: 'Kostenlose druckbare Perlenwebmuster',
        libraryLink: 'Kostenlose Perlenwebmuster herunterladen',
        dimensions: (columns, rows) => `${columns} Perlen pro Reihe × ${rows} Reihen`,
        previewCaption: 'Die Farbvorschauen sind seitlich dargestellt. Die Downloads zeigen das Raster und die Leserichtung.',
        pdfA4: 'A4-PDF',
        pdfLetter: 'US-Letter-PDF',
        png: 'Raster-PNG',
        project: 'Bearbeitbares Projekt',
        edit: 'Dieses Muster bearbeiten',
        download: 'Herunterladen',
        helpHeading: 'Das heruntergeladene Muster verwenden',
        steps: [
            'Lade die PDF für dein Papierformat herunter oder speichere das Raster-PNG. Die PDFs enthalten ein Raster mit Farbbuchstaben, eine Farbliste mit Perlenanzahlen und die Reihenanleitung.',
            'Ordne vor dem Weben jedem Farbbuchstaben eine Farbe aus deinen eigenen Perlen zu. Bildschirm- und Druckfarben sind nur Näherungen. Die Farbnamen sind bearbeitbare Bezeichnungen und keine Herstellercodes. Jede Zelle, einschließlich des Hintergrunds, benötigt eine Perle. Die Anzahl enthält keine Reserveperlen, Fäden oder Materialien für den Abschluss.',
            'Wähle „Dieses Muster bearbeiten“, um es im Perlenwebmuster-Generator zu öffnen. Passe Farben, Abmessungen und Leseeinstellungen an. Lade anschließend ein neues Raster herunter und speichere das bearbeitbare Projekt vor dem Verlassen. Eine heruntergeladene Projektdatei lässt sich mit „Projekt öffnen“ wieder laden.',
        ],
        chartHelp: 'Die vollständig gefüllten, rechteckigen Raster sind für den Perlenwebrahmen gedacht. PDF und PNG sind Leseschemata und keine Vorlagen in Originalgröße. Reihe 1 beginnt unten links; aufeinanderfolgende Reihen wechseln die Leserichtung. Folge den Farbbuchstaben und der Reihenanleitung.',
        sizingHelp: 'Die Vorlagen verwenden quadratische Zellen (Perlenform-Verhältnis 1). Miss eine Webprobe und teile die Breite eines Perlenplatzes durch die Höhe einer Reihe. Passe danach die Perlenform im Generator an und speichere dein Projekt. Perlen, Fadenspannung und Abschluss bestimmen die fertige Größe.',
        makerLink: 'Ein eigenes Perlenwebmuster erstellen',
        guideLink: 'Anleitungen für Perlenarbeiten ansehen',
        footer: 'Lade eigene Perlenwebmuster als A4- oder US-Letter-PDF herunter, speichere ein Raster-PNG oder passe ein bearbeitbares Muster an deine Farben an.',
    },
    fr: {
        title: 'Modèles gratuits pour métier à perles — PDF et PNG | Fuse Bead Patterns',
        description: 'Téléchargez trois modèles gratuits pour métier à perles : cœurs, chevrons et losanges. PDF A4 ou US Letter, grilles PNG et projets de 11 perles par rang et 61 rangs.',
        heading: 'Modèles gratuits pour métier à perles',
        introduction: 'Téléchargez un motif de cœurs, de chevrons ou de losanges pour votre métier à perles. Ces trois créations originales comprennent des lettres pour les couleurs, les quantités de perles et les instructions rang par rang. Choisissez un PDF A4 ou US Letter, une grille PNG ou un projet modifiable. Sans compte.',
        home: 'Accueil',
        breadcrumb: 'Fil d’Ariane',
        collectionLabel: 'Grilles gratuites à imprimer pour métier à perles',
        libraryLink: 'Télécharger des modèles gratuits pour métier à perles',
        dimensions: (columns, rows) => `${columns} perles par rang × ${rows} rangs`,
        previewCaption: 'Les aperçus des couleurs sont présentés à l’horizontale. Les fichiers montrent la grille et le sens de lecture.',
        pdfA4: 'PDF A4',
        pdfLetter: 'PDF US Letter',
        png: 'Grille PNG',
        project: 'Projet modifiable',
        edit: 'Modifier ce modèle',
        download: 'Télécharger',
        helpHeading: 'Utiliser le modèle téléchargé',
        steps: [
            'Téléchargez le PDF adapté à votre papier ou enregistrez la grille PNG. Les PDF comprennent une grille avec des lettres pour les couleurs, une liste des couleurs avec les quantités de perles et les instructions par rang.',
            'Associez chaque lettre de couleur aux perles que vous possédez avant de tisser. Les couleurs à l’écran et sur papier sont approximatives. Les noms sont des étiquettes modifiables, pas des codes de fabricant. Chaque cellule, y compris le fond, nécessite une perle. Le décompte exclut les perles de réserve, le fil et les matériaux de finition.',
            'Choisissez « Modifier ce modèle » pour le charger dans le générateur de motifs pour métier à perles. Adaptez les couleurs, les dimensions et les réglages de lecture, puis téléchargez une nouvelle grille et enregistrez le projet modifiable avant de quitter. Un fichier de projet téléchargé peut être rechargé avec « Ouvrir un projet ».',
        ],
        chartHelp: 'Ces grilles rectangulaires entièrement remplies sont destinées au tissage sur métier à perles. Les PDF et PNG sont des grilles de lecture, pas des gabarits à taille réelle. Le rang 1 commence en bas à gauche ; les rangs suivants alternent leur sens de lecture. Suivez les lettres et les instructions par rang.',
        sizingHelp: 'Les grilles fournies utilisent des cellules carrées (rapport de forme des perles : 1). Mesurez un échantillon tissé et divisez la largeur d’un emplacement de perle par la hauteur d’un rang. Ajustez ensuite la forme des cellules dans le générateur et enregistrez votre projet. Vos perles, la tension du fil et la finition déterminent la taille finale.',
        makerLink: 'Créer votre propre motif pour métier à perles',
        guideLink: 'Consulter les guides de loisirs créatifs avec des perles',
        footer: 'Téléchargez des créations originales pour métier à perles en PDF A4 ou US Letter, enregistrez une grille PNG ou adaptez un projet modifiable à vos couleurs.',
    },
    ja: {
        title: '無料のビーズ織り図案 — PDF・PNGダウンロード | Fuse Bead Patterns',
        description: 'ハート、シェブロン、ひし形のビーズ織り図案3種類を無料ダウンロード。横11個・61段のA4・US Letter PDF、図案PNG、編集用プロジェクトを用意しています。',
        heading: '無料のビーズ織り図案',
        introduction: 'ビーズ織り機で使う、ハート、シェブロン、ひし形の帯模様をダウンロードできます。3種類のオリジナル図案には、色を示す文字記号、ビーズの必要個数、段ごとの手順が含まれます。A4・US Letter PDF、図案PNG、編集用プロジェクトから選べます。アカウントは不要です。',
        home: 'ホーム',
        breadcrumb: 'パンくずリスト',
        collectionLabel: '無料で印刷できるビーズ織り図案',
        libraryLink: '無料のビーズ織り図案をダウンロード',
        dimensions: (columns, rows) => `横${columns}個 × ${rows}段`,
        previewCaption: '配色のプレビューは横向きです。ダウンロードした図案で段番号と読み順を確認してください。',
        pdfA4: 'A4 PDF',
        pdfLetter: 'US Letter PDF',
        png: '図案PNG',
        project: '編集用プロジェクト',
        edit: 'この図案を編集',
        download: 'ダウンロード',
        helpHeading: 'ダウンロードした図案の使い方',
        steps: [
            '用紙に合うPDFをダウンロードするか、図案PNGを保存します。PDFには色記号付きの図案、色ごとの必要個数、段ごとの手順が含まれます。',
            '織り始める前に、各色記号を手持ちのビーズに対応させます。画面や印刷の色は目安です。色名は自由に変更できるラベルで、メーカーの品番ではありません。背景を含むすべてのマスにビーズが1個必要です。予備のビーズ、糸、仕上げ材料は個数に含みません。',
            '「この図案を編集」を選ぶと、図案作成ツールに読み込まれます。配色、横のビーズ数、段数、読み順を調整し、新しい図案を書き出します。ページを離れる前に編集用プロジェクトを保存してください。ダウンロードしたプロジェクトは「プロジェクトを開く」から再度読み込めます。',
        ],
        chartHelp: '織り機用の、すべてのマスが埋まった長方形の図案です。PDFとPNGは読み取り用の図表で、実寸の型紙ではありません。1段目は左下から始まり、各段の読み順が交互に変わります。色記号と段ごとの手順に従ってください。',
        sizingHelp: '配布図案は正方形のマス（ビーズの縦横比1）を使っています。試し織りでビーズ1個分の幅を1段分の高さで割った比率を測り、作成ツールのマスの形を調整してプロジェクトを保存してください。完成サイズは、使うビーズ、糸の張り、仕上げ方で変わります。',
        makerLink: '自分のビーズ織り図案を作成',
        guideLink: 'ビーズ作品のガイドを見る',
        footer: 'オリジナルのビーズ織り図案をA4・US Letter PDFやPNGで保存し、編集用プロジェクトで自分の配色に調整できます。',
    },
};

const siteUrl = 'https://fusebeadpatterns.art';
export const loomPatternLibraryLanguageAlternates = {
    en: `${siteUrl}${localeRoutes.en.beadLoomPatterns}`,
    de: `${siteUrl}${localeRoutes.de.beadLoomPatterns}`,
    fr: `${siteUrl}${localeRoutes.fr.beadLoomPatterns}`,
    ja: `${siteUrl}${localeRoutes.ja.beadLoomPatterns}`,
    'x-default': `${siteUrl}${localeRoutes.en.beadLoomPatterns}`,
};

export function loomPatternLibraryMetadata(locale: SiteLocale): Metadata {
    const copy = loomPatternLibraryContent[locale];
    const url = `${siteUrl}${localeRoutes[locale].beadLoomPatterns}`;
    return {
        title: copy.title,
        description: copy.description,
        alternates: { canonical: url, languages: loomPatternLibraryLanguageAlternates },
        openGraph: { title: copy.title, description: copy.description, url, siteName: 'Fuse Bead Patterns', type: 'website', images: [] },
        twitter: { card: 'summary', title: copy.title, description: copy.description, images: [] },
    };
}

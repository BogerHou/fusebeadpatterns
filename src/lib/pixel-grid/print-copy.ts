import type { PixelGridLocale } from './messages';

const en = {
    title: 'Print a pixel grid',
    content: 'What to print', artwork: 'Current artwork', blank: 'Blank grid',
    paper: 'Paper', letter: 'US Letter',
    layout: 'Page layout', overview: 'Whole grid on one page', tiled: '4 mm cells across pages',
    download: 'Download PDF', preparing: 'Preparing the printable grid…',
    help: 'Blank grid uses the current canvas dimensions without erasing your artwork. Transparent pixels appear white; partly transparent colors are shown over white paper.',
    layoutHelp: 'One-page overview scales the whole grid to fit. Tiled printing adds an overview and numbered sections with 4 mm cells. Choose Actual size / 100% when printing tiles. This is a drawing grid, not a full-size bead template.',
    exported: 'PDF download started. Your artwork and editable project are unchanged.',
    failed: 'The printable PDF could not be prepared. Your artwork was kept. Please try again.',
};

export const PIXEL_GRID_PRINT_COPY: Record<PixelGridLocale, typeof en> = {
    en,
    de: {
        title: 'Pixelraster drucken',
        content: 'Druckinhalt', artwork: 'Aktuelle Zeichnung', blank: 'Leeres Raster',
        paper: 'Papier', letter: 'US Letter',
        layout: 'Seitenaufteilung', overview: 'Gesamtes Raster auf einer Seite', tiled: '4-mm-Zellen auf mehreren Seiten',
        download: 'PDF herunterladen', preparing: 'Das druckbare Raster wird vorbereitet…',
        help: 'Das leere Raster übernimmt die aktuellen Abmessungen, ohne deine Zeichnung zu löschen. Transparente Pixel erscheinen weiß; teilweise transparente Farben werden auf weißem Papier dargestellt.',
        layoutHelp: 'Die Übersicht passt das gesamte Raster auf eine Seite ein. Der mehrseitige Druck ergänzt eine Übersicht und nummerierte Abschnitte mit 4-mm-Zellen. Drucke diese mit „Tatsächliche Größe“ / 100 %. Dies ist ein Zeichenraster, keine Bügelperlenvorlage in Originalgröße.',
        exported: 'Der PDF-Download wurde gestartet. Deine Zeichnung und das bearbeitbare Projekt bleiben unverändert.',
        failed: 'Die Druck-PDF konnte nicht erstellt werden. Deine Zeichnung wurde beibehalten. Bitte versuche es erneut.',
    },
    fr: {
        title: 'Imprimer une grille de pixel art',
        content: 'Contenu à imprimer', artwork: 'Dessin actuel', blank: 'Grille vierge',
        paper: 'Papier', letter: 'US Letter',
        layout: 'Mise en page', overview: 'Grille entière sur une page', tiled: 'Cases de 4 mm sur plusieurs pages',
        download: 'Télécharger le PDF', preparing: 'Préparation de la grille à imprimer…',
        help: 'La grille vierge reprend les dimensions actuelles sans effacer votre dessin. Les pixels transparents apparaissent en blanc ; les couleurs semi-transparentes sont affichées sur papier blanc.',
        layoutHelp: 'La vue d’ensemble adapte la grille à une page. Le mode multipage ajoute une vue d’ensemble et des sections numérotées avec des cases de 4 mm. Imprimez ces sections en « Taille réelle » / 100 %. Cette grille de dessin n’est pas un gabarit de perles à taille réelle.',
        exported: 'Le téléchargement du PDF a démarré. Votre dessin et votre projet modifiable restent inchangés.',
        failed: 'Le PDF à imprimer n’a pas pu être préparé. Votre dessin est conservé. Veuillez réessayer.',
    },
    ja: {
        title: 'ドット絵の方眼を印刷',
        content: '印刷する内容', artwork: '現在のドット絵', blank: '空の方眼',
        paper: '用紙', letter: 'US Letter',
        layout: 'ページの配置', overview: '全体を1ページに収める', tiled: '4 mmのマスで分割',
        download: 'PDFをダウンロード', preparing: '印刷用の方眼を準備しています…',
        help: '空の方眼は現在のキャンバスと同じ縦横のマス数です。描いた絵は消えません。透明なピクセルは白く、半透明の色は白い紙に重ねた色で表示します。',
        layoutHelp: '全体図は1ページに収まる大きさです。分割では全体図と番号付きの部分図を作り、部分図のマスは4 mmです。部分図は「実際のサイズ」・100%で印刷してください。描画用の方眼であり、ビーズの実寸図案ではありません。',
        exported: 'PDFのダウンロードを開始しました。ドット絵と編集用プロジェクトは変わりません。',
        failed: '印刷用PDFを準備できませんでした。現在のドット絵は保持されています。もう一度お試しください。',
    },
};

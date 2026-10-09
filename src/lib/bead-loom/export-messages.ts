import type { LoomChart } from './core';

export type LoomExportLocale = 'en' | 'de' | 'fr' | 'ja';
type Direction = 'left-to-right' | 'right-to-left';

/** Only interface text is translated. A user's title, color names and codes stay intact. */
interface LoomExportMessages {
    brand: string;
    untitled: string;
    metadataTitle: string;
    metadataSubject: string;
    overview: string;
    footer: string;
    overviewSummary: (chart: LoomChart) => string;
    overviewSettings: (chart: LoomChart) => string;
    columnsNotice: string;
    backgroundNotice: string;
    notices: readonly string[];
    previewCaption: string;
    name: string;
    code: string;
    count: (hex: string, count: number) => string;
    keyHeading: (index: number, pages: number) => string;
    keyNotice: string;
    tileHeading: (index: number, pages: number, firstColumn: number, lastColumn: number, firstRow: number, lastRow: number) => string;
    tileNotice: string;
    row: string;
    instructionsHeading: (index: number, pages: number) => string;
    instructionsNotice: string;
    rowHeading: (row: number, direction: Direction, columns: number) => string;
    pngSummary: (chart: LoomChart) => string;
    pngDirections: (chart: LoomChart) => string;
    pngKey: string;
}

const en: LoomExportMessages = {
    brand: 'FUSE BEAD PATTERNS / BEAD LOOM CHART',
    untitled: 'Untitled bead loom chart',
    metadataTitle: 'Bead loom chart',
    metadataSubject: 'Bead loom reading chart; not actual size',
    overview: 'Overview',
    footer: 'Reading chart - not actual size. Custom palette; colors are approximate.',
    overviewSummary: chart => `${chart.columns} columns x ${chart.rows} rows | ${chart.cells.length} beads | ${chart.palette.length} palette colors`,
    overviewSettings: chart => `Start: ${chart.startCorner} | Rows: ${chart.serpentine ? 'alternating direction' : 'same direction'} | Cell width/height: ${chart.cellAspect}`,
    columnsNotice: 'Columns always count from the left. Row 1 is at your selected starting edge.',
    backgroundNotice: 'All cells, including the background color, count as beads in this rectangular chart.',
    notices: [
        'Screen and printed colors are approximate. Custom palettes are not official color matches.',
        'Chart for reading, not actual size. Cell proportions are a visual guide, not physical weave dimensions.',
    ],
    previewCaption: 'Color overview. Use the following chart tiles for symbols and numbered rows.',
    name: 'Name', code: 'Code',
    count: (hex, count) => `HEX ${hex} | ${count} beads`,
    keyHeading: (index, pages) => `Color key ${index} / ${pages}`,
    keyNotice: 'Symbols stay attached to their colors. Counts include the background color.',
    tileHeading: (index, pages, firstColumn, lastColumn, firstRow, lastRow) => `Chart ${index} / ${pages} | Columns ${firstColumn}-${lastColumn} | Rows ${firstRow}-${lastRow}`,
    tileNotice: '> read left to right    < read right to left    |    Column numbers across the top',
    row: 'Row',
    instructionsHeading: (index, pages) => `Row instructions ${index} / ${pages}`,
    instructionsNotice: 'Read each list in order. Example: 3A  2B = 3 beads of A, then 2 beads of B.',
    rowHeading: (row, direction, columns) => `Row ${row} | ${direction} | columns ${direction === 'left-to-right' ? `1 to ${columns}` : `${columns} to 1`}`,
    pngSummary: chart => `${chart.columns} columns x ${chart.rows} rows | ${chart.cells.length} beads | Start: ${chart.startCorner}`,
    pngDirections: chart => `${chart.serpentine ? 'Alternating row directions' : 'Same direction each row'} | > left to right; < right to left. All cells count as beads.`,
    pngKey: 'Color key - counts include the background color',
};

const deCorners: Record<LoomChart['startCorner'], string> = {
    'bottom-left': 'unten links', 'bottom-right': 'unten rechts', 'top-left': 'oben links', 'top-right': 'oben rechts',
};
const de: LoomExportMessages = {
    brand: 'FUSE BEAD PATTERNS / PERLENWEB-VORLAGE',
    untitled: 'Perlenweb-Vorlage ohne Titel',
    metadataTitle: 'Perlenweb-Vorlage',
    metadataSubject: 'Perlenweb-Vorlage zum Ablesen; nicht in Originalgröße',
    overview: 'Übersicht',
    footer: 'Vorlage zum Ablesen, nicht in Originalgröße. Eigene Palette; Farben sind Näherungswerte.',
    overviewSummary: chart => `${chart.columns} Spalten x ${chart.rows} Reihen | ${chart.cells.length} Perlen | ${chart.palette.length} Palettenfarben`,
    overviewSettings: chart => `Start: ${deCorners[chart.startCorner]} | Reihen: ${chart.serpentine ? 'abwechselnde Leserichtung' : 'gleiche Leserichtung'} | Zellbreite/Zellhöhe: ${chart.cellAspect}`,
    columnsNotice: 'Spalten werden immer von links gezählt. Reihe 1 liegt an deiner gewählten Startkante.',
    backgroundNotice: 'Alle Felder dieser rechteckigen Vorlage zählen als Perlen, auch die Hintergrundfarbe.',
    notices: [
        'Bildschirm- und Druckfarben sind Näherungswerte. Eigene Paletten entsprechen keiner offiziellen Farbzuordnung.',
        'Die Vorlage dient zum Ablesen und ist nicht in Originalgröße. Die Zellproportionen sind eine visuelle Hilfe, keine tatsächlichen Webmaße.',
    ],
    previewCaption: 'Farbübersicht. Die folgenden Vorlagenteile zeigen Symbole und nummerierte Reihen.',
    name: 'Name', code: 'Code',
    count: (hex, count) => `HEX ${hex} | ${count} Perlen`,
    keyHeading: (index, pages) => `Farblegende ${index} / ${pages}`,
    keyNotice: 'Jedes Symbol bleibt seiner Farbe zugeordnet. Die Mengen enthalten die Hintergrundfarbe.',
    tileHeading: (index, pages, firstColumn, lastColumn, firstRow, lastRow) => `Vorlage ${index} / ${pages} | Spalten ${firstColumn}-${lastColumn} | Reihen ${firstRow}-${lastRow}`,
    tileNotice: '> von links nach rechts lesen    < von rechts nach links lesen    |    Spaltennummern stehen oben',
    row: 'Reihe',
    instructionsHeading: (index, pages) => `Reihenanleitung ${index} / ${pages}`,
    instructionsNotice: 'Jede Liste der Reihe nach lesen. Beispiel: 3A  2B = 3 Perlen mit Symbol A, danach 2 Perlen mit Symbol B.',
    rowHeading: (row, direction, columns) => `Reihe ${row} | ${direction === 'left-to-right' ? 'von links nach rechts' : 'von rechts nach links'} | Spalten ${direction === 'left-to-right' ? `1 bis ${columns}` : `${columns} bis 1`}`,
    pngSummary: chart => `${chart.columns} Spalten x ${chart.rows} Reihen | ${chart.cells.length} Perlen | Start: ${deCorners[chart.startCorner]}`,
    pngDirections: chart => `${chart.serpentine ? 'Abwechselnde Leserichtung pro Reihe' : 'Gleiche Leserichtung in jeder Reihe'} | > von links nach rechts; < von rechts nach links. Alle Felder zählen als Perlen.`,
    pngKey: 'Farblegende - Mengen einschließlich Hintergrundfarbe',
};

const frCorners: Record<LoomChart['startCorner'], string> = {
    'bottom-left': 'en bas à gauche', 'bottom-right': 'en bas à droite', 'top-left': 'en haut à gauche', 'top-right': 'en haut à droite',
};
const fr: LoomExportMessages = {
    brand: 'FUSE BEAD PATTERNS / GRILLE DE TISSAGE DE PERLES',
    untitled: 'Grille de tissage de perles sans titre',
    metadataTitle: 'Grille de tissage de perles',
    metadataSubject: 'Grille de tissage de perles à lire; sans taille réelle',
    overview: 'Vue d’ensemble',
    footer: 'Grille à lire, sans taille réelle. Palette personnalisée; couleurs approximatives.',
    overviewSummary: chart => `${chart.columns} colonnes x ${chart.rows} rangs | ${chart.cells.length} perles | ${chart.palette.length} couleurs dans la palette`,
    overviewSettings: chart => `Départ: ${frCorners[chart.startCorner]} | Rangs: ${chart.serpentine ? 'sens de lecture alterné' : 'même sens de lecture'} | Largeur/hauteur des cases: ${chart.cellAspect}`,
    columnsNotice: 'Les colonnes se comptent toujours depuis la gauche. Le rang 1 est au bord de départ choisi.',
    backgroundNotice: 'Toutes les cases de cette grille rectangulaire comptent comme des perles, y compris la couleur de fond.',
    notices: [
        'Les couleurs à l’écran et à l’impression sont approximatives. Les palettes personnalisées ne sont pas des correspondances officielles.',
        'La grille sert à lire le motif et n’est pas à taille réelle. Les proportions des cases sont un repère visuel, pas les dimensions réelles du tissage.',
    ],
    previewCaption: 'Vue des couleurs. Les grilles suivantes indiquent les symboles et les rangs numérotés.',
    name: 'Nom', code: 'Code',
    count: (hex, count) => `HEX ${hex} | ${count} perles`,
    keyHeading: (index, pages) => `Légende des couleurs ${index} / ${pages}`,
    keyNotice: 'Chaque symbole reste associé à sa couleur. Les quantités incluent la couleur de fond.',
    tileHeading: (index, pages, firstColumn, lastColumn, firstRow, lastRow) => `Grille ${index} / ${pages} | Colonnes ${firstColumn}-${lastColumn} | Rangs ${firstRow}-${lastRow}`,
    tileNotice: '> lire de gauche à droite    < lire de droite à gauche    |    Numéros des colonnes en haut',
    row: 'Rang',
    instructionsHeading: (index, pages) => `Instructions par rang ${index} / ${pages}`,
    instructionsNotice: 'Lire chaque liste dans l’ordre. Exemple: 3A  2B = 3 perles de symbole A, puis 2 perles de symbole B.',
    rowHeading: (row, direction, columns) => `Rang ${row} | ${direction === 'left-to-right' ? 'de gauche à droite' : 'de droite à gauche'} | colonnes ${direction === 'left-to-right' ? `1 à ${columns}` : `${columns} à 1`}`,
    pngSummary: chart => `${chart.columns} colonnes x ${chart.rows} rangs | ${chart.cells.length} perles | Départ: ${frCorners[chart.startCorner]}`,
    pngDirections: chart => `${chart.serpentine ? 'Sens de lecture alterné à chaque rang' : 'Même sens de lecture à chaque rang'} | > de gauche à droite; < de droite à gauche. Toutes les cases comptent comme des perles.`,
    pngKey: 'Légende des couleurs - quantités avec la couleur de fond',
};

const jaCorners: Record<LoomChart['startCorner'], string> = {
    'bottom-left': '左下', 'bottom-right': '右下', 'top-left': '左上', 'top-right': '右上',
};
const ja: LoomExportMessages = {
    brand: 'FUSE BEAD PATTERNS / ビーズ織り図案',
    untitled: '無題のビーズ織り図案',
    metadataTitle: 'ビーズ織り図案',
    metadataSubject: '読み取り用のビーズ織り図案・実寸ではありません',
    overview: '全体図',
    footer: '読み取り用の図案です。実寸ではありません。独自パレットの色は目安です。',
    overviewSummary: chart => `${chart.columns}列 x ${chart.rows}段 | ビーズ${chart.cells.length}個 | パレット${chart.palette.length}色`,
    overviewSettings: chart => `開始位置: ${jaCorners[chart.startCorner]} | 段の読み方: ${chart.serpentine ? '一段ごとに方向を交互に変更' : 'すべて同じ方向'} | マスの幅/高さ: ${chart.cellAspect}`,
    columnsNotice: '列番号は常に左から数えます。1段目は選択した開始位置の辺にあります。',
    backgroundNotice: 'この長方形の図案では、背景色を含むすべてのマスをビーズとして数えます。',
    notices: [
        '画面と印刷の色は目安です。独自パレットはメーカーの正式な色対応ではありません。',
        '図案は読み取り用で、実寸ではありません。マスの縦横比は見た目の目安であり、実際の織り上がり寸法ではありません。',
    ],
    previewCaption: '配色の全体図です。記号と段番号は、続く分割図案で確認してください。',
    name: '色名', code: '色番号',
    count: (hex, count) => `HEX ${hex} | ビーズ${count}個`,
    keyHeading: (index, pages) => `色の凡例 ${index} / ${pages}`,
    keyNotice: '記号と色の対応は変わりません。必要数には背景色のビーズも含みます。',
    tileHeading: (index, pages, firstColumn, lastColumn, firstRow, lastRow) => `分割図案 ${index} / ${pages} | 列 ${firstColumn}-${lastColumn} | 段 ${firstRow}-${lastRow}`,
    tileNotice: '> 左から右へ読む    < 右から左へ読む    |    列番号は上に表示',
    row: '段',
    instructionsHeading: (index, pages) => `段ごとの手順 ${index} / ${pages}`,
    instructionsNotice: '各行を順番に読んでください。例: 3A  2B = 記号Aのビーズを3個、続いて記号Bを2個並べます。',
    rowHeading: (row, direction, columns) => `${row}段目 | ${direction === 'left-to-right' ? '左から右へ' : '右から左へ'} | 列 ${direction === 'left-to-right' ? `1から${columns}` : `${columns}から1`}`,
    pngSummary: chart => `${chart.columns}列 x ${chart.rows}段 | ビーズ${chart.cells.length}個 | 開始位置: ${jaCorners[chart.startCorner]}`,
    pngDirections: chart => `${chart.serpentine ? '一段ごとに読む方向を交互に変更' : 'すべての段を同じ方向に読む'} | > 左から右へ; < 右から左へ。すべてのマスをビーズとして数えます。`,
    pngKey: '色の凡例 - 必要数には背景色も含みます',
};

export const LOOM_EXPORT_MESSAGES: Record<LoomExportLocale, LoomExportMessages> = { en, de, fr, ja };

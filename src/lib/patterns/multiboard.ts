import type { SiteLocale } from '../i18n/locales';

export const multiboardPatternId = 'original-sunset-mountain-lake';
export function isMultiboardPattern(id: string): boolean {
    return id === multiboardPatternId;
}

export const multiboardCopy = {
    en: {
        board: '4 Midi boards (29 × 29 each) · 2 × 2 layout',
        heading: 'Place the four boards',
        instruction: 'Connect four 29 × 29 Midi boards in a 2 × 2 square. The full counting grid has 58 columns and 58 rows. Use the same global row and column numbers on each PDF page.',
        printing: 'The first PDF page is a reduced overview. Pages 2–5 show one board each at 5 mm spacing. Print those pages at 100% / actual size and check both 50 mm rulers against your board before placing beads.',
        table: ['Board', 'Position', 'Columns', 'Rows'],
        positions: ['Top left', 'Top right', 'Bottom left', 'Bottom right'],
        guides: ['Pegboard sizes and layouts', 'Ironing guide'],
    },
    de: {
        board: '4 Midi-Platten (je 29 × 29) · 2 × 2 angeordnet',
        heading: 'Die vier Steckplatten anordnen',
        instruction: 'Verbinde vier Midi-Steckplatten mit je 29 × 29 Feldern zu einem 2 × 2-Quadrat. Das gesamte Zählraster hat 58 Spalten und 58 Zeilen. Verwende auf allen PDF-Seiten die globalen Zeilen- und Spaltennummern.',
        printing: 'Die erste PDF-Seite ist eine verkleinerte Übersicht. Seiten 2–5 zeigen jeweils eine Platte mit 5 mm Rasterabstand. Drucke sie mit 100 % / tatsächlicher Größe und prüfe beide 50-mm-Messlinien an deiner Platte, bevor du Perlen legst.',
        table: ['Platte', 'Position', 'Spalten', 'Zeilen'],
        positions: ['Oben links', 'Oben rechts', 'Unten links', 'Unten rechts'],
        guides: ['Steckplatten und Anordnung', 'Bügelanleitung'],
    },
    fr: {
        board: '4 plaques Midi (29 × 29 chacune) · disposition 2 × 2',
        heading: 'Disposer les quatre plaques',
        instruction: 'Emboîtez quatre plaques Midi de 29 × 29 cases en carré de 2 × 2. La grille complète compte 58 colonnes et 58 lignes. Gardez les mêmes numéros de lignes et de colonnes sur chaque page du PDF.',
        printing: 'La première page du PDF est une vue réduite. Les pages 2–5 présentent chacune une plaque avec un espacement de 5 mm. Imprimez-les à 100 % / taille réelle et vérifiez les deux repères de 50 mm sur votre plaque avant de placer les perles.',
        table: ['Plaque', 'Position', 'Colonnes', 'Lignes'],
        positions: ['En haut à gauche', 'En haut à droite', 'En bas à gauche', 'En bas à droite'],
        guides: ['Plaques et disposition', 'Guide du repassage'],
    },
    ja: {
        board: '29×29マスのミディ用プレート4枚 · 2×2配置',
        heading: '4枚のプレートを並べる',
        instruction: '29×29マスのミディ用プレート4枚を縦2枚・横2枚につなぎます。図案全体は58列・58行です。PDFの各ページでも、全体に通した行番号と列番号を使います。',
        printing: 'PDFの1ページ目は縮小した全体図です。2〜5ページ目はプレート1枚ずつ、マスの間隔5 mmで表示しています。100％・実際のサイズで印刷し、縦横の50 mm目盛りを手元のプレートと比べてからビーズを置いてください。',
        table: ['プレート', '位置', '列', '行'],
        positions: ['左上', '右上', '左下', '右下'],
        guides: ['プレートのサイズと配置', 'アイロンの使い方'],
    },
} satisfies Record<SiteLocale, { board: string; heading: string; instruction: string; printing: string; table: string[]; positions: string[]; guides: string[] }>;

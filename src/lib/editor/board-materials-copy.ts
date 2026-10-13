import type { SiteLocale } from '../i18n/locales';

type BoardMaterialsCopy = {
    title: string;
    showMaterials: string;
    selectionLabel: string;
    allBoards: string;
    beads: string;
    colors: string;
    wholeTotal: string;
    reference: string;
    symbol: string;
    count: string;
    empty: string;
    downloadSelectedBoardPdf: string;
    reading: string;
    readError: string;
    busy: string;
    error: string;
    /** Board indices are zero-based; displayed labels are one-based. */
    boardPosition: (rowIndex: number, columnIndex: number) => string;
    previewLabel: (rowIndex: number, columnIndex: number) => string;
    /** Inclusive row/column ranges in the full pattern, already one-based. */
    globalRows: (from: number, to: number) => string;
    globalColumns: (from: number, to: number) => string;
};

const COPY: Record<SiteLocale, BoardMaterialsCopy> = {
    en: {
        title: 'Per-board materials',
        showMaterials: 'View per-board materials',
        selectionLabel: 'Board',
        allBoards: 'All boards',
        beads: 'beads',
        colors: 'colors',
        wholeTotal: 'Whole pattern total',
        reference: 'Color reference',
        symbol: 'Symbol',
        count: 'Count',
        empty: 'This board has no beads.',
        downloadSelectedBoardPdf: 'Download selected board PDF',
        reading: 'Updating board materials…',
        readError: 'Board materials are not ready. Try again after the pattern finishes updating.',
        busy: 'Preparing the board PDF…',
        error: 'The board PDF could not be created. Your pattern has not changed.',
        boardPosition: (row, column) => `Row ${row + 1}, column ${column + 1}`,
        previewLabel: (row, column) => `Board preview: row ${row + 1}, column ${column + 1}`,
        globalRows: (from, to) => `Whole pattern rows ${from}–${to}`,
        globalColumns: (from, to) => `Whole pattern columns ${from}–${to}`,
    },
    de: {
        title: 'Material pro Platte',
        showMaterials: 'Material pro Platte ansehen',
        selectionLabel: 'Platte',
        allBoards: 'Alle Platten',
        beads: 'Perlen',
        colors: 'Farben',
        wholeTotal: 'Gesamte Vorlage',
        reference: 'Farbnummer',
        symbol: 'Symbol',
        count: 'Anzahl',
        empty: 'Auf dieser Platte liegen keine Perlen.',
        downloadSelectedBoardPdf: 'PDF der ausgewählten Platte herunterladen',
        reading: 'Material pro Platte wird aktualisiert…',
        readError: 'Die Materialliste ist noch nicht bereit. Versuche es erneut, sobald die Vorlage fertig ist.',
        busy: 'Platten-PDF wird erstellt…',
        error: 'Das Platten-PDF konnte nicht erstellt werden. Deine Vorlage bleibt unverändert.',
        boardPosition: (row, column) => `Reihe ${row + 1}, Spalte ${column + 1}`,
        previewLabel: (row, column) => `Plattenvorschau: Reihe ${row + 1}, Spalte ${column + 1}`,
        globalRows: (from, to) => `Reihen ${from}–${to} in der gesamten Vorlage`,
        globalColumns: (from, to) => `Spalten ${from}–${to} in der gesamten Vorlage`,
    },
    fr: {
        title: 'Matériel par plaque',
        showMaterials: 'Voir le matériel par plaque',
        selectionLabel: 'Plaque',
        allBoards: 'Toutes les plaques',
        beads: 'perles',
        colors: 'couleurs',
        wholeTotal: 'Total du modèle',
        reference: 'Référence couleur',
        symbol: 'Symbole',
        count: 'Quantité',
        empty: 'Cette plaque ne contient aucune perle.',
        downloadSelectedBoardPdf: 'Télécharger le PDF de la plaque choisie',
        reading: 'Mise à jour du matériel par plaque…',
        readError: 'La liste du matériel n’est pas encore prête. Réessayez une fois le modèle mis à jour.',
        busy: 'Préparation du PDF de la plaque…',
        error: 'Le PDF de la plaque n’a pas pu être créé. Votre modèle est inchangé.',
        boardPosition: (row, column) => `Ligne ${row + 1}, colonne ${column + 1}`,
        previewLabel: (row, column) => `Aperçu de la plaque : ligne ${row + 1}, colonne ${column + 1}`,
        globalRows: (from, to) => `Lignes ${from}–${to} du modèle complet`,
        globalColumns: (from, to) => `Colonnes ${from}–${to} du modèle complet`,
    },
    ja: {
        title: 'プレートごとの材料数',
        showMaterials: 'プレートごとの材料数を見る',
        selectionLabel: 'プレート',
        allBoards: 'すべてのプレート',
        beads: '個',
        colors: '色',
        wholeTotal: '図案全体の合計',
        reference: '色番号',
        symbol: '記号',
        count: '個数',
        empty: 'このプレートにはビーズがありません。',
        downloadSelectedBoardPdf: '選択したプレートのPDFを保存',
        reading: 'プレートごとの材料数を更新中…',
        readError: '材料数をまだ表示できません。図案の更新が終わってから、もう一度お試しください。',
        busy: 'プレートのPDFを準備中…',
        error: 'プレートのPDFを作成できませんでした。図案は変更されていません。',
        boardPosition: (row, column) => `行${row + 1}・列${column + 1}`,
        previewLabel: (row, column) => `プレートのプレビュー：行${row + 1}・列${column + 1}`,
        globalRows: (from, to) => `図案全体の${from}～${to}行`,
        globalColumns: (from, to) => `図案全体の${from}～${to}列`,
    },
};

export function getBoardMaterialsCopy(locale: SiteLocale = 'en'): BoardMaterialsCopy {
    return COPY[locale];
}

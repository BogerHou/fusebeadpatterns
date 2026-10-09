import type { SiteLocale } from '../../i18n/locales';
import type { PdfScaleMode } from '../../editor/pdf-scale';

export type PrinterOptions = { locale?: SiteLocale; pdfScaleMode?: PdfScaleMode };

/** Labels only: brand names, references, palette symbols and counts stay intact. */
export const EXPORT_MESSAGES = {
    en: {
        pattern: 'Pattern', inventory: 'Inventory', title: 'Fuse bead pattern',
        boards: 'Board layout', board: 'Board', row: 'Row', column: 'Column',
        reference: 'Color reference', symbol: 'Symbol', count: 'Count',
        printing: 'Print on A4 at 100% / actual size. Disable fit to page.',
        pitch: 'Check the 50 mm line and compare the 5 mm spacing with your board.',
        scaled: 'This is a counting chart, not an actual-size pegboard template.',
        caution: 'Not physically assembled or ironed. Screen and printed colors are approximate.',
        pdfFailed: 'The PDF could not be generated.',
        unsupported: 'Unsupported export format',
        canvasUnavailable: 'Canvas 2D context is unavailable.',
        imageDimensions: 'The exported image must have a positive size.',
        imageTimedOut: 'Image export timed out. Try a smaller pattern.',
        imageEncodingFailed: 'The image could not be encoded. Try a smaller pattern.',
        imageLoadFailed: 'The pattern image could not be loaded for export.',
        midiSizeUnsupported: 'The 5 mm PDF requires a 29 × 29 board and Perler Midi, Hama Midi or Artkal S palettes. Choose a counting chart for other settings.',
        scaleUnsupported: 'Unsupported PDF scale setting.',
    },
    de: {
        pattern: 'Vorlage', inventory: 'Materialliste', title: 'Bügelperlen-Vorlage',
        boards: 'Anordnung der Platten', board: 'Platte', row: 'Reihe', column: 'Spalte',
        reference: 'Farbnummer', symbol: 'Symbol', count: 'Anzahl',
        printing: 'Auf A4 bei 100% / tatsächlicher Größe drucken. Nicht an die Seite anpassen.',
        pitch: '50-mm-Linie messen und den 5-mm-Abstand mit der eigenen Platte vergleichen.',
        scaled: 'Zählvorlage, keine Schablone in Originalgröße für die Stiftplatte.',
        caution: 'Nicht gesteckt oder gebügelt getestet. Bildschirm- und Druckfarben sind Näherungen.',
        pdfFailed: 'Die PDF-Datei konnte nicht erstellt werden.',
        unsupported: 'Nicht unterstütztes Exportformat',
        canvasUnavailable: 'Die Zeichenfläche ist nicht verfügbar.',
        imageDimensions: 'Das exportierte Bild muss eine gültige Größe haben.',
        imageTimedOut: 'Der Bildexport dauert zu lange. Versuchen Sie eine kleinere Vorlage.',
        imageEncodingFailed: 'Das Bild konnte nicht erstellt werden. Versuchen Sie eine kleinere Vorlage.',
        imageLoadFailed: 'Das Vorlagenbild konnte für den Export nicht geladen werden.',
        midiSizeUnsupported: 'Das 5-mm-PDF benötigt eine 29 × 29-Platte mit Perler Midi, Hama Midi oder Artkal S. Wählen Sie für andere Einstellungen die Zählvorlage.',
        scaleUnsupported: 'Nicht unterstützte PDF-Skalierung.',
    },
    fr: {
        pattern: 'Modèle', inventory: 'Matériel', title: 'Modèle de perles à repasser',
        boards: 'Disposition des plaques', board: 'Plaque', row: 'Ligne', column: 'Colonne',
        reference: 'Référence couleur', symbol: 'Symbole', count: 'Quantité',
        printing: 'Imprimez sur A4 à 100% / taille réelle. Désactivez « Ajuster à la page ».',
        pitch: 'Mesurez le repère de 50 mm et vérifiez le pas de 5 mm sur votre plaque.',
        scaled: 'Grille à compter, pas un gabarit à taille réelle pour votre plaque.',
        caution: 'Non assemblé et non testé au fer. Couleurs à l’écran et sur papier approximatives.',
        pdfFailed: 'Le fichier PDF n’a pas pu être créé.',
        unsupported: 'Format d’export non pris en charge',
        canvasUnavailable: 'La surface de dessin est indisponible.',
        imageDimensions: 'L’image exportée doit avoir des dimensions positives.',
        imageTimedOut: 'L’export de l’image a pris trop de temps. Essayez un modèle plus petit.',
        imageEncodingFailed: 'L’image n’a pas pu être créée. Essayez un modèle plus petit.',
        imageLoadFailed: 'L’image du modèle n’a pas pu être chargée pour l’export.',
        midiSizeUnsupported: 'Le PDF à pas de 5 mm nécessite une plaque de 29 × 29 avec Perler Midi, Hama Midi ou Artkal S. Utilisez la grille à compter pour les autres réglages.',
        scaleUnsupported: 'Échelle PDF non prise en charge.',
    },
    ja: {
        pattern: '図案', inventory: '材料表', title: 'アイロンビーズ図案',
        boards: 'プレート', board: 'プレート', row: '行', column: '列',
        reference: '色番号', symbol: '記号', count: '個数',
        printing: 'A4・倍率100%（実際のサイズ）で印刷。「用紙に合わせる」は選ばないでください。',
        pitch: '1マスの間隔は5 mm。印刷後、下の線とプレートの間隔を定規で確認してください。',
        scaled: '原寸図案ではありません。マスと色番号を見ながら並べてください。',
        caution: '実物制作・アイロン仕上げは未検証です。画面や印刷の色は実物と異なります。',
        pdfFailed: 'PDFを作成できませんでした。',
        unsupported: '対応していない書き出し形式',
        canvasUnavailable: '描画用キャンバスを使用できません。',
        imageDimensions: '書き出す画像の幅と高さを1以上にしてください。',
        imageTimedOut: '画像の書き出しが時間切れになりました。小さい図案でお試しください。',
        imageEncodingFailed: '画像を作成できませんでした。小さい図案でお試しください。',
        imageLoadFailed: '書き出し用の図案画像を読み込めませんでした。',
        midiSizeUnsupported: '5 mmのPDFは29×29マスとPerler Midi・Hama Midi・Artkal Sのパレットで使用できます。他の設定ではマスを数える図案を選んでください。',
        scaleUnsupported: '対応していないPDFの印刷倍率です。',
    },
} as const;

export function exportMessages(locale: SiteLocale = 'en') {
    return EXPORT_MESSAGES[locale];
}

export function boardPosition(locale: SiteLocale, row: number, column: number) {
    const copy = exportMessages(locale);
    return `${copy.board} / ${copy.row} ${row + 1} / ${copy.column} ${column + 1}`;
}

/** Only these fixed strings are typeset with the existing Japanese font subset. */
export const JAPANESE_EXPORT_FONT_TEXT = [
    ...(['pattern', 'inventory', 'title', 'boards', 'board', 'row', 'column',
        'reference', 'symbol', 'count', 'printing', 'pitch', 'scaled', 'caution'] as const)
        .map((key) => EXPORT_MESSAGES.ja[key]),
    '0123456789 /-50 mm',
].join('');

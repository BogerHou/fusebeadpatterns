import type { SiteLocale } from '../i18n/locales';

export const qrPdfMessages = {
    en: {
        title: 'QR bead pattern', reference: 'Clean QR reference', board: 'Board', brand: 'Bead brand',
        grid: 'Bead grid', modules: 'QR modules', scale: 'Beads per module', correction: 'Correction',
        size: 'Approx. size at 5 mm per bead', boards: 'Boards', total: 'Total beads', color: 'Color',
        code: 'Code', count: 'Beads', rows: 'Rows', columns: 'Columns', page: 'Page', dark: 'Dark', light: 'Light',
        border: 'Includes the full four-module light border on every side.',
        digital: 'Scan this unmarked reference to read the content. Physical beads have not been scan-tested.',
        counting: 'Counting chart, not an actual-size placement template. Empty board cells need no beads.',
        print: 'Print at 100% / actual size and measure the 50 mm line. Do not use fit-to-page.',
        caution: 'Digital colors are approximate. Test the arranged beads and the fused piece with your phone.',
        ruler: '50 mm check', materials: 'Materials for this board',
    },
    de: {
        title: 'QR-Code aus Bügelperlen', reference: 'QR-Referenz ohne Raster', board: 'Platte', brand: 'Perlenmarke',
        grid: 'Perlenraster', modules: 'QR-Module', scale: 'Perlen je Modul', correction: 'Fehlerkorrektur',
        size: 'Ungefähre Größe bei 5 mm je Perle', boards: 'Platten', total: 'Perlen gesamt', color: 'Farbe',
        code: 'Farbcode', count: 'Perlen', rows: 'Zeilen', columns: 'Spalten', page: 'Seite', dark: 'Dunkel', light: 'Hell',
        border: 'Der helle Rand von vier Modulen bleibt an allen vier Seiten erhalten.',
        digital: 'Scanne diese Referenz ohne Raster. Die fertige Perlenarbeit wurde nicht auf Lesbarkeit getestet.',
        counting: 'Zählvorlage, keine Schablone in Originalgröße. Leere Plattenfelder benötigen keine Perlen.',
        print: 'Mit 100 % / tatsächlicher Größe drucken und die 50-mm-Linie messen. Keine Seitenanpassung.',
        caution: 'Digitale Farben sind Näherungen. Teste die gelegten und die gebügelten Perlen mit deinem Handy.',
        ruler: 'Prüflinie: 50 mm', materials: 'Material für diese Platte',
    },
    fr: {
        title: 'QR code en perles à repasser', reference: 'Référence QR sans grille', board: 'Plaque', brand: 'Marque',
        grid: 'Grille de perles', modules: 'Modules QR', scale: 'Perles par module', correction: 'Correction',
        size: 'Taille indicative à 5 mm par perle', boards: 'Plaques', total: 'Total de perles', color: 'Couleur',
        code: 'Code', count: 'Perles', rows: 'Lignes', columns: 'Colonnes', page: 'Page', dark: 'Foncé', light: 'Clair',
        border: 'La bordure claire de quatre modules est incluse sur les quatre côtés.',
        digital: 'Scannez cette référence sans grille. Le modèle réalisé en perles n’a pas été testé au scanner.',
        counting: 'Grille à compter, pas un gabarit à taille réelle. Les cases vides de la plaque restent sans perles.',
        print: 'Imprimez à 100 % / taille réelle et mesurez le repère de 50 mm. Désactivez l’ajustement à la page.',
        caution: 'Les couleurs sont approximatives. Testez les perles placées puis fondues avec votre téléphone.',
        ruler: 'Repère : 50 mm', materials: 'Matériel pour cette plaque',
    },
    ja: {
        title: 'QRコードのビーズ図案', reference: '読み取り用QR図', board: 'プレート', brand: 'ブランド',
        grid: 'ビーズのマス数', modules: 'QRのマス数', scale: '1マスのビーズ数', correction: '誤り訂正',
        size: '1ビーズ5 mmでの目安', boards: 'プレート枚数', total: 'ビーズ合計', color: '色',
        code: '色番号', count: '個数', rows: '行', columns: '列', page: 'ページ', dark: '濃い色', light: '薄い色',
        border: '四辺にある4マス分の薄い色の余白を含みます。余白は切らないでください。',
        digital: '読み取りにはこの格子なしの図を使ってください。実物のビーズでの読み取りは未検証です。',
        counting: '数えて作る図案です。原寸の配置用紙ではありません。プレートの空きマスにビーズは不要です。',
        print: '100％・実際のサイズで印刷し、50 mmの線を測ってください。用紙に合わせる設定は使わないでください。',
        caution: '画面の色は目安です。並べた状態とアイロン後の実物を、自分のスマートフォンで確かめてください。',
        ruler: '確認線：50 mm', materials: 'このプレートの材料',
    },
} as const satisfies Record<SiteLocale, Record<string, string>>;

export function qrPdfJapaneseCharacters(): string {
    return [...new Set(Object.values(qrPdfMessages.ja).join(''))].join('');
}

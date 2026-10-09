import type { Metadata } from 'next';
import { loomLanguageAlternates } from '../i18n/metadata';
import { localeRoutes } from '../i18n/routes';
import type { SiteLocale } from '../i18n/locales';

export type LocalizedLoomLocale = Exclude<SiteLocale, 'en'>;
type LoomPageContent = {
    title: string;
    description: string;
    heading: string;
    introduction: string;
    helpHeading: string;
    steps: readonly [string, string, string, string];
    chartHelp: string;
    savingHelp: string;
    footer: string;
};

export const loomPageContent: Record<LocalizedLoomLocale, LoomPageContent> = {
    de: {
        title: 'Perlenwebmuster-Generator — PDF und Reihenanleitung | Fuse Bead Patterns',
        description: 'Erstelle kostenlose Perlenwebmuster mit eigenen Farben. Zeichne oder wandle ein Bild um und lade eine A4- oder US-Letter-PDF, ein Raster-PNG und dein Projekt herunter.',
        heading: 'Perlenwebmuster erstellen',
        introduction: 'Erstelle kostenlos ein Muster für deinen Perlenwebrahmen mit eigenen Farben. Zeichne oder beginne mit einem Bild und lade anschließend eine PDF mit Farbbuchstaben, ein Raster-PNG und die Reihenanleitung herunter. Ohne Konto.',
        helpHeading: 'Das Raster an deine Perlen anpassen',
        steps: [
            'Wähle die Anzahl der Perlen pro Reihe und die Anzahl der Reihen. Für die Perlenform teilst du die gemessene Breite eines Perlenplatzes durch die gemessene Höhe einer Reihe in einer Probe. Dieses Verhältnis verändert die Rasterform und die Anpassung eines Bildes.',
            'Füge die Farben hinzu, die du tatsächlich hast. Die Anfangsfarben sind eine bearbeitbare Beispielpalette. Namen und Perlencodes sind deine eigenen Bezeichnungen; der Bildabgleich verwendet RGB-Bildschirmfarben und keinen offiziellen Farbkatalog eines Herstellers.',
            'Wähle eine Startecke und ob aufeinanderfolgende Reihen die Leserichtung wechseln. Reihe 1 beginnt an dieser Ecke. Spalten werden immer von der linken Seite des Rasters gezählt. Buchstaben kennzeichnen die Farben auch auf einem Schwarz-Weiß-Ausdruck.',
            'Prüfe das Raster und die Reihenanleitung und exportiere dann auf A4 oder US Letter. Jede Zelle zählt als eine Perle, einschließlich des Hintergrunds. Die Anzahl enthält keine Reserveperlen, Fäden oder Materialien für den Abschluss.',
        ],
        chartHelp: 'Dieses Werkzeug erstellt vollständig gefüllte, rechteckige Raster für den Perlenwebrahmen. Es erstellt keine Peyote-, Brick-Stitch- oder Bügelperlenmuster. Die PDF ist ein Leseschema und keine Vorlage in Originalgröße. Perlenoberfläche, Fadenspannung und Webtechnik beeinflussen das Ergebnis. Miss eine Probe und beachte die Anleitung deines Webrahmens.',
        savingHelp: 'Bilder und Projekte bleiben in diesem Browser. Speichere vor dem Verlassen ein Projekt, um Raster, Palette und Leseeinstellungen zu behalten. Das Originalbild und der Bearbeitungsverlauf werden nicht in der Projektdatei gespeichert.',
        footer: 'Erstelle ein Perlenwebmuster mit eigener Palette, prüfe die Reihenanleitung und speichere ein druckbares Raster und ein bearbeitbares Projekt im Browser.',
    },
    fr: {
        title: 'Générateur de motifs pour métier à perles — PDF et rangs | Fuse Bead Patterns',
        description: 'Créez un motif pour métier à perles avec vos couleurs. Dessinez ou convertissez une image, puis téléchargez un PDF A4 ou US Letter, une grille PNG et votre projet.',
        heading: 'Générateur de motifs pour métier à perles',
        introduction: 'Créez gratuitement un motif pour métier à perles avec vos propres couleurs. Dessinez ou partez d’une image, puis téléchargez un PDF avec des lettres pour les couleurs, une grille PNG et les instructions rang par rang. Sans compte.',
        helpHeading: 'Adapter la grille à vos perles',
        steps: [
            'Choisissez le nombre de perles par rang et le nombre de rangs. Pour définir la forme des cellules, divisez la largeur mesurée d’un emplacement de perle par la hauteur mesurée d’un rang dans un échantillon. Ce rapport change la forme de la grille et l’ajustement d’une image.',
            'Ajoutez les couleurs que vous possédez. La palette de départ est un exemple modifiable. Les noms et les codes de perles sont vos propres étiquettes ; la conversion utilise les couleurs RVB à l’écran, pas le nuancier officiel d’une marque.',
            'Choisissez le coin de départ et indiquez si les rangs successifs alternent leur sens de lecture. Le rang 1 commence à ce coin. Les colonnes sont toujours numérotées depuis la gauche de la grille. Les lettres identifient les couleurs même sur une impression en noir et blanc.',
            'Vérifiez la grille et les instructions, puis exportez en A4 ou US Letter. Chaque cellule représente une perle, y compris le fond. Le décompte exclut les perles de réserve, le fil et les matériaux de finition.',
        ],
        chartHelp: 'Cet outil crée des grilles rectangulaires entièrement remplies pour le tissage sur métier à perles. Il ne crée pas de motifs en peyote, en brick stitch ou en perles à repasser. Le PDF est une grille de lecture, pas un gabarit à taille réelle. La finition des perles, la tension du fil et la méthode de tissage influencent le résultat : mesurez un échantillon et suivez les instructions de votre métier.',
        savingHelp: 'Les images et les projets restent dans ce navigateur. Enregistrez un projet avant de quitter pour conserver la grille, la palette et les réglages de lecture. Le fichier de projet ne contient ni l’image d’origine ni l’historique des modifications.',
        footer: 'Créez un motif pour métier à perles avec votre palette, consultez les instructions par rang et enregistrez une grille imprimable et un projet modifiable depuis votre navigateur.',
    },
    ja: {
        title: 'ビーズ織り図案作成ツール — PDF・段ごとの手順 | Fuse Bead Patterns',
        description: '自分の配色でビーズ織り図案を無料作成。描画や画像変換から、色記号付きA4・US Letter PDF、図案PNG、編集用プロジェクトを書き出せます。',
        heading: 'ビーズ織りの図案を作成',
        introduction: '手持ちの色を使って、織り機で織るビーズ図案を無料で作成できます。自分で描くか画像を読み込み、色を文字で示したPDF、図案PNG、段ごとの手順を書き出せます。アカウントは不要です。',
        helpHeading: '使うビーズに合わせて図案を設定する',
        steps: [
            '横のビーズ数と段数を選びます。マスの形は、試し織りで測ったビーズ1個分の幅を1段分の高さで割った比率で設定します。この比率に応じて図案の形と画像の配置が変わります。',
            '実際に持っている色を追加します。初期の色は編集できる見本です。色名とビーズの品番は自由に付けるラベルで、画像の色合わせには画面上のRGB値を使います。メーカーの公式色見本との一致を保証するものではありません。',
            '開始位置の角と、各段の読み順を交互にするかを選びます。1段目は選んだ角から始まります。列番号は常に図案の左から数えます。白黒印刷でも色を区別できるように、それぞれの色を文字記号で示します。',
            '図案と段ごとの手順を確認し、A4またはUS Letterで書き出します。背景も含め、すべてのマスを1個のビーズとして数えます。予備のビーズ、糸、仕上げ材料は個数に含みません。',
        ],
        chartHelp: 'このツールは、ビーズ織り機で使う、すべてのマスが埋まった長方形の図案を作成します。ペヨーテステッチ、ブリックステッチ、アイロンビーズ用の図案には対応していません。PDFは読み取り用の図表で、実寸の型紙ではありません。ビーズの仕上げ、糸の張り、織り方によって結果が変わるため、試し織りを測り、織り機の説明に従ってください。',
        savingHelp: '画像とプロジェクトはこのブラウザ内で処理されます。ページを離れる前にプロジェクトを保存すると、図案、配色、読み順の設定を残せます。プロジェクトファイルには元画像と操作履歴は含まれません。',
        footer: '自分の配色でビーズ織り図案を作成し、段ごとの手順を確認して、印刷用の図案と編集用プロジェクトをブラウザから保存できます。',
    },
};

export function localizedLoomMetadata(locale: LocalizedLoomLocale): Metadata {
    const copy = loomPageContent[locale];
    const url = `https://fusebeadpatterns.art${localeRoutes[locale].beadLoom}`;
    return {
        title: copy.title, description: copy.description,
        alternates: { canonical: url, languages: loomLanguageAlternates },
        openGraph: { title: copy.title, description: copy.description, url, siteName: 'Fuse Bead Patterns', type: 'website', images: [] },
        twitter: { card: 'summary', title: copy.title, description: copy.description, images: [] },
    };
}

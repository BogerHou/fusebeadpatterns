import type { SiteLocale } from '../i18n/locales';

export interface ColorChartCopy {
    title: string;
    description: string;
    heading: string;
    intro: string;
    searchLabel: string;
    placeholder: string;
    clear: string;
    results: string;
    empty: string;
    aboutTitle: string;
    about: string;
    source: string;
    disclaimer: string;
    namesNote: string;
    editorCta: string;
    sourceLabel: string;
    licenseLabel: string;
    collectionLabel: string;
    refLabel: string;
    nameLabel: string;
    hexLabel: string;
    rgbLabel: string;
}

export const colorChartCopy: Record<SiteLocale, ColorChartCopy> = {
    en: {
        title: 'Perler Bead Color Chart | Fuse Bead Patterns',
        description: 'Look up 103 Perler bead colors by code, name or HEX. Compare the digital palette used in our editor, then make your own bead pattern.',
        heading: 'Perler bead color chart',
        intro: 'Find a color code or compare the 103 Perler Midi colors used in our editor.',
        searchLabel: 'Search by color code, name or HEX',
        placeholder: 'Try 80-19001, White or #EAEFEE',
        clear: 'Clear search',
        results: '{count} of {total} colors',
        empty: 'No colors match. Try another code, English color name or HEX value.',
        aboutTitle: 'About this color chart',
        about: 'These 103 entries match the Perler Midi digital palette in our pattern editor. Use the codes to check a pattern’s materials or look up a color. To create a pattern with this palette, select Perler Midi in the generator.',
        source: 'The color codes, names and RGB values come from the beadcolors dataset, distributed under the MIT license.',
        disclaimer: 'Screen colors are a digital reference. They do not guarantee the appearance of physical beads, current stock or a complete Perler catalog.',
        namesNote: 'Color names stay in English as listed in the source dataset.',
        editorCta: 'Make a bead pattern',
        sourceLabel: 'View color data source',
        licenseLabel: 'MIT license',
        collectionLabel: 'Perler Midi color swatches',
        refLabel: 'Color code',
        nameLabel: 'Color name',
        hexLabel: 'HEX',
        rgbLabel: 'RGB',
    },
    de: {
        title: 'Perler-Farbtabelle | Fuse Bead Patterns',
        description: 'Finde 103 Perler-Farben nach Farbcode, Name oder HEX. Vergleiche die digitale Palette unseres Editors und erstelle deine eigene Bügelperlen-Vorlage.',
        heading: 'Perler-Farbtabelle',
        intro: 'Finde einen Farbcode oder vergleiche die 103 Perler-Midi-Farben aus unserem Editor.',
        searchLabel: 'Nach Farbcode, Name oder HEX suchen',
        placeholder: 'Zum Beispiel 80-19001, White oder #EAEFEE',
        clear: 'Suche zurücksetzen',
        results: '{count} von {total} Farben',
        empty: 'Keine passende Farbe. Versuche einen anderen Farbcode, englischen Farbnamen oder HEX-Wert.',
        aboutTitle: 'Über diese Farbtabelle',
        about: 'Diese 103 Einträge entsprechen der digitalen Perler-Midi-Palette in unserem Vorlageneditor. Mit den Farbcodes kannst du die Materialliste einer Vorlage prüfen oder Farben nachschlagen. Wähle im Generator Perler Midi, um diese Palette zu verwenden.',
        source: 'Farbcodes, Namen und RGB-Werte stammen aus dem Datensatz beadcolors, der unter der MIT-Lizenz veröffentlicht wird.',
        disclaimer: 'Bildschirmfarben dienen als digitale Orientierung. Sie garantieren weder den Farbton echter Perlen noch aktuelle Verfügbarkeit oder einen vollständigen Perler-Katalog.',
        namesNote: 'Die Farbnamen bleiben wie im Quelldatensatz auf Englisch.',
        editorCta: 'Eine Bügelperlen-Vorlage erstellen',
        sourceLabel: 'Quelle der Farbdaten ansehen',
        licenseLabel: 'MIT-Lizenz',
        collectionLabel: 'Farbfelder der Perler-Midi-Palette',
        refLabel: 'Farbcode',
        nameLabel: 'Farbname',
        hexLabel: 'HEX',
        rgbLabel: 'RGB',
    },
    fr: {
        title: 'Nuancier Perler | Fuse Bead Patterns',
        description: 'Retrouvez 103 couleurs Perler par code, nom ou HEX. Consultez la palette numérique de notre éditeur, puis créez votre modèle de perles à repasser.',
        heading: 'Nuancier de perles Perler',
        intro: 'Retrouvez un code couleur ou comparez les 103 couleurs Perler Midi utilisées dans notre éditeur.',
        searchLabel: 'Rechercher par code, nom ou HEX',
        placeholder: 'Par exemple 80-19001, White ou #EAEFEE',
        clear: 'Effacer la recherche',
        results: 'Couleurs affichées : {count} sur {total}',
        empty: 'Aucune couleur trouvée. Essayez un autre code, un nom de couleur en anglais ou une valeur HEX.',
        aboutTitle: 'À propos de ce nuancier',
        about: 'Ces 103 entrées correspondent à la palette numérique Perler Midi de notre éditeur. Utilisez les codes pour vérifier le matériel d’un modèle ou rechercher une couleur. Sélectionnez Perler Midi dans le générateur pour utiliser cette palette.',
        source: 'Les codes, noms et valeurs RGB proviennent du jeu de données beadcolors, publié sous licence MIT.',
        disclaimer: 'Les couleurs à l’écran sont des références numériques. Elles ne garantissent ni la teinte des perles réelles, ni leur disponibilité, ni un catalogue Perler complet.',
        namesNote: 'Les noms des couleurs restent en anglais, comme dans les données sources.',
        editorCta: 'Créer un modèle de perles',
        sourceLabel: 'Voir la source des couleurs',
        licenseLabel: 'Licence MIT',
        collectionLabel: 'Échantillons de couleurs Perler Midi',
        refLabel: 'Code couleur',
        nameLabel: 'Nom de la couleur',
        hexLabel: 'HEX',
        rgbLabel: 'RGB',
    },
    ja: {
        title: 'Perlerの色一覧・色番号 | Fuse Bead Patterns',
        description: 'Perlerの103色を色番号・英語名・HEXで検索。図案エディターで使うデジタル配色を確認し、自分のアイロンビーズ図案を作成できます。',
        heading: 'Perlerの色一覧・色番号',
        intro: '色番号を探したり、エディターで使うPerler Midiの103色を比較したりできます。',
        searchLabel: '色番号・英語名・HEXで検索',
        placeholder: '例：80-19001、White、#EAEFEE',
        clear: '検索をクリア',
        results: '全{total}色のうち{count}色',
        empty: '該当する色がありません。別の色番号、英語の色名、HEX値をお試しください。',
        aboutTitle: 'この色一覧について',
        about: '図案エディターで使うPerler Midiのデジタル配色103件を掲載しています。図案の材料リストにある色番号や、使いたい色を調べられます。この配色で図案を作るには、作成ツールでPerler Midiを選んでください。',
        source: '色番号・英語名・RGB値は、MITライセンスで公開されているbeadcolorsのデータに基づいています。',
        disclaimer: '画面上の色はデジタルの参考値です。実物のビーズの色、現在の在庫、Perlerの全商品を保証するものではありません。',
        namesNote: '色名は元データと同じ英語で表示しています。',
        editorCta: 'アイロンビーズ図案を作る',
        sourceLabel: '色データの出典を見る',
        licenseLabel: 'MITライセンス',
        collectionLabel: 'Perler Midiの色見本',
        refLabel: '色番号',
        nameLabel: '色名',
        hexLabel: 'HEX',
        rgbLabel: 'RGB',
    },
};

export function getColorChartCopy(locale: SiteLocale): ColorChartCopy {
    return colorChartCopy[locale];
}

export function formatColorChartResults(locale: SiteLocale, count: number, total: number): string {
    const numbers = new Intl.NumberFormat(locale);
    return colorChartCopy[locale].results
        .replace('{count}', numbers.format(count))
        .replace('{total}', numbers.format(total));
}

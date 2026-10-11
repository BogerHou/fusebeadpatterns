import type { SiteLocale } from '../i18n/locales';
import type { TopicCopy } from './section-messages';

export const ravePatternIds: readonly string[] = [
    'original-rave-alien-head',
    'original-rave-rainbow-smiley',
    'original-rave-moon-mushroom',
];

export function isRavePattern(id: string): boolean {
    return ravePatternIds.includes(id);
}

export const ravePatternCopy: Record<SiteLocale, TopicCopy> = {
    en: {
        label: 'Rave patterns', title: 'Rave Perler Bead Patterns',
        description: 'Free rave Perler bead patterns: an alien head, rainbow smiley and crescent moon mushroom. Download A4 or Letter charts, or edit the colors.',
        intro: 'Choose an alien head, rainbow smiley or crescent moon mushroom for your next festival-inspired bead project. Each original design fits one 29 × 29 Midi pegboard and comes with a color list, A4 and US Letter PDFs, a counting grid and an editable project.',
        heading: 'Choose your design and colors',
        notes: [
            'These are independently drawn designs. Open a picture to see the exact bead count and Perler Midi color numbers, then check which colors you already have. The project file lets you change the colors without redrawing the shape.',
            'Print the PDF at 100% / actual size and check both 50 mm rulers. Follow the PNG by its row and column numbers; it is a counting chart, not an actual-size placement template. Midi downloads do not use the spacing of Mini beads.',
            'The designs have not been physically assembled, iron-tested or tested for wearing. Before turning a finished piece into a necklace or bag charm, check its joints and attachment with your own materials. The charts do not include a tested hanging opening.',
            'For Hama or Artkal, open the selected design in the editor and change the color brand while keeping the board settings. Save the project and export a new chart with that brand’s color list.',
        ],
    },
    de: {
        label: 'Rave-Motive', title: 'Rave-Bügelperlen-Vorlagen',
        description: 'Kostenlose Rave-Motive aus Bügelperlen: Alien-Kopf, Regenbogen-Smiley und Mondsichel mit Pilz. A4- oder Letter-PDF laden und Farben im Editor ändern.',
        intro: 'Wähle einen Alien-Kopf, Regenbogen-Smiley oder eine Mondsichel mit Pilz für dein nächstes festivalinspiriertes Perlenmotiv. Jedes Original passt auf eine 29 × 29-Midi-Steckplatte. Dazu gibt es eine Farbliste, A4- und US-Letter-PDFs, ein Zählraster und ein bearbeitbares Projekt.',
        heading: 'Motiv und Farben auswählen',
        notes: [
            'Diese Motive wurden unabhängig entworfen. Öffne ein Bild für die genauen Mengen und Perler-Midi-Farbnummern und vergleiche sie mit deinen Vorräten. Im Projekt kannst du Farben ändern, ohne die Form neu zu zeichnen.',
            'Drucke das PDF mit 100 % / tatsächlicher Größe und kontrolliere beide 50-mm-Messlinien. Das PNG dient zum Zählen nach Zeilen und Spalten, nicht zum Auflegen in Originalgröße. Die Midi-Dateien haben nicht den Abstand von Mini-Perlen.',
            'Bau, Bügeln und Tragen wurden nicht praktisch getestet. Prüfe Verbindungen und Befestigung mit deinen eigenen Materialien, bevor du ein fertiges Motiv als Halskette oder Taschenanhänger verwendest. Es gibt keine geprüfte Aufhängeöffnung.',
            'Für Hama oder Artkal öffne das Motiv im Editor, ändere die Perlenmarke und behalte die Platteneinstellungen bei. Speichere das Projekt und exportiere eine neue Vorlage mit der passenden Farbliste.',
        ],
    },
    fr: {
        label: 'Motifs rave', title: 'Modèles rave en perles à repasser',
        description: 'Trois modèles rave gratuits : tête d’alien, smiley arc-en-ciel et croissant de lune avec champignon. PDF A4 ou Letter et couleurs modifiables.',
        intro: 'Choisissez une tête d’alien, un smiley arc-en-ciel ou un croissant de lune avec champignon pour votre prochain motif inspiré des festivals. Chaque création originale tient sur une plaque Midi de 29 × 29 cases, avec couleurs, PDF A4 et US Letter, grille de comptage et projet modifiable.',
        heading: 'Choisir le motif et les couleurs',
        notes: [
            'Ces motifs ont été dessinés indépendamment. Ouvrez une image pour connaître les quantités et références Perler Midi, puis comparez-les à vos perles. Le projet permet de changer les couleurs sans redessiner la forme.',
            'Imprimez le PDF à 100 % / taille réelle et vérifiez les deux repères de 50 mm. Suivez le PNG par lignes et colonnes : il sert à compter, pas à placer les perles à taille réelle. Les fichiers Midi n’utilisent pas l’espacement des perles Mini.',
            'Assemblage, repassage et port n’ont pas été testés avec de vraies perles. Avant d’utiliser une pièce finie comme collier ou breloque de sac, vérifiez les jonctions et la fixation avec vos matériaux. Les grilles ne comportent pas d’ouverture de suspension testée.',
            'Pour Hama ou Artkal, ouvrez le motif dans l’éditeur et changez de marque en conservant les réglages de la plaque. Enregistrez le projet et exportez une nouvelle grille avec les bonnes références.',
        ],
    },
    ja: {
        label: 'フェス風の図案', title: 'フェス風アイロンビーズ図案',
        description: 'エイリアンの顔、虹色スマイル、三日月ときのこの無料アイロンビーズ図案。A4・US LetterのPDF、色表、マス目付き画像、編集用プロジェクトを保存できます。',
        intro: 'エイリアンの顔、虹色スマイル、三日月ときのこから、フェス風のオリジナル図柄を選べます。すべて29×29マスのミディ用プレート1枚に収まり、色表、A4・US LetterのPDF、マスを数えるための画像、編集用プロジェクトが付いています。',
        heading: '図柄と配色を選ぶ',
        notes: [
            '図柄は独自に描いています。画像を開いて必要数とPerler Midiの色番号を確認し、手持ちのビーズと比べてください。プロジェクトを使えば、形を描き直さずに配色を変更できます。',
            'PDFは100％・実際のサイズで印刷し、縦横の50 mm目盛りを確認してください。PNGは行と列を数えて使う図表で、実寸でビーズを重ねる型紙ではありません。ミディ用ファイルはミニビーズの間隔には対応していません。',
            '実物制作・アイロン仕上げ・身に着けた状態は検証していません。ネックレスやバッグの飾りにする前に、手元の材料で接合と取り付け部分を確認してください。検証済みの吊り下げ穴は設けていません。',
            'HamaやArtkalを使う場合は、エディターでブランドを変更し、プレート設定は維持します。プロジェクトを保存し、対応する色表と新しい図案を書き出してください。',
        ],
    },
};

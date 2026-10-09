import type { SiteLocale } from './locales';

export const homeFeaturedPatternIds = ['sdv-blue-chicken', 'pokemon-eevee-gen5', 'pokemon-gengar-gen5', 'ghost-cat-pumpkin'] as const;

export const homePatternCopy = {
    en: {
        eyebrow: 'The pattern library', heading: 'Free Printable Perler Bead Patterns',
        description: 'Start with a ready-made design. Check the colors, download a chart, or open it in the editor.', browse: 'Browse all patterns',
        studyEyebrow: 'From pixel to pegboard', studyControls: 'Pattern preview style', pixels: 'Pixels', beads: 'Beads',
        studyTitle: 'Stardew Valley Blue Chicken', studyNote: 'Digital preview · ready to make your own',
        studyBeadAlt: 'Stardew Valley Blue Chicken digital bead layout', studyPixelAlt: 'Stardew Valley Blue Chicken pixel pattern',
        studyLink: 'View Stardew Valley Blue Chicken pattern',
    },
    de: {
        eyebrow: 'Die Vorlagensammlung', heading: 'Kostenlose Bügelperlen-Vorlagen zum Ausdrucken',
        description: 'Beginne mit einem fertigen Motiv. Sieh dir die Farben an, lade die Vorlage herunter oder öffne sie im Editor.', browse: 'Alle Vorlagen ansehen',
        studyEyebrow: 'Vom Pixel zur Steckplatte', studyControls: 'Darstellung der Vorlage', pixels: 'Pixel', beads: 'Perlen',
        studyTitle: 'Stardew Valley · Blaues Huhn', studyNote: 'Digitale Vorschau · zum Nachbasteln und Bearbeiten',
        studyBeadAlt: 'Blaues Huhn aus Stardew Valley als digitale Bügelperlen-Anordnung', studyPixelAlt: 'Pixelvorlage des blauen Huhns aus Stardew Valley',
        studyLink: 'Bügelperlen-Vorlage des blauen Huhns aus Stardew Valley ansehen',
    },
    fr: {
        eyebrow: 'La bibliothèque de modèles', heading: 'Modèles gratuits de perles à repasser à imprimer',
        description: 'Commencez avec un motif prêt à utiliser. Consultez les couleurs, téléchargez le modèle ou ouvrez-le dans l’éditeur.', browse: 'Voir tous les modèles',
        studyEyebrow: 'Du pixel à la plaque', studyControls: 'Affichage du modèle', pixels: 'Pixels', beads: 'Perles',
        studyTitle: 'Stardew Valley · Poule bleue', studyNote: 'Aperçu numérique · à réaliser ou à personnaliser',
        studyBeadAlt: 'Poule bleue de Stardew Valley en disposition numérique de perles', studyPixelAlt: 'Modèle en pixels de la poule bleue de Stardew Valley',
        studyLink: 'Voir le modèle de la poule bleue de Stardew Valley',
    },
    ja: {
        eyebrow: '図案ライブラリー', heading: '無料で印刷できるアイロンビーズ図案',
        description: '完成済みの図案から始めましょう。配色を確認し、図案を保存するか、エディターで好みの色に変えられます。', browse: 'すべての図案を見る',
        studyEyebrow: 'ピクセルからビーズの配置へ', studyControls: '図案の表示方法', pixels: 'ピクセル', beads: 'ビーズ',
        studyTitle: 'Stardew Valley · 青いニワトリ', studyNote: 'デジタルプレビュー・制作や編集に使えます',
        studyBeadAlt: 'Stardew Valleyの青いニワトリをビーズで表したデジタル配置図', studyPixelAlt: 'Stardew Valleyの青いニワトリのピクセル図案',
        studyLink: 'Stardew Valleyの青いニワトリの図案を見る',
    },
} satisfies Record<SiteLocale, {
    eyebrow: string; heading: string; description: string; browse: string;
    studyEyebrow: string; studyControls: string; pixels: string; beads: string;
    studyTitle: string; studyNote: string; studyBeadAlt: string; studyPixelAlt: string; studyLink: string;
}>;

export const SITE_LOCALES = ['en', 'de', 'fr', 'ja'] as const;
export type SiteLocale = typeof SITE_LOCALES[number];

export const localeNames: Record<SiteLocale, string> = {
    en: 'English', de: 'Deutsch', fr: 'Français', ja: '日本語',
};

export function isSiteLocale(value: string): value is SiteLocale {
    return (SITE_LOCALES as readonly string[]).includes(value);
}

export const siteNavigation = {
    en: {
        hamaMaker: 'Hama bead pattern maker',
        skip: 'Skip to content', main: 'Main navigation', language: 'Language',
        fallback: 'Home — this page is not available',
        collectionFallback: 'Browse all patterns in this language', tools: 'Tools', beadGenerator: 'Photo to bead pattern',
        generator: 'Generator', patterns: 'Patterns', editor: 'Editor', guides: 'Guides', about: 'About',
        make: 'Make', learn: 'Learn', site: 'Site', browse: 'Browse Patterns', advancedEditor: 'Advanced Editor',
        allGuides: 'All Guides', pixelGrid: 'Pixel Art Grid', beadLoom: 'Bead Loom Pattern Maker',
        privacy: 'Privacy Policy', terms: 'Terms of Service', contact: 'Contact', english: 'English',
        description: 'Turn photos into printable perler bead patterns, then adjust the size, clean up beads, and export the result from your browser.',
        copyright: 'All rights reserved. Not affiliated with any bead brand mentioned.',
    },
    de: {
        hamaMaker: 'Hama aus Bildern',
        skip: 'Zum Inhalt', main: 'Hauptnavigation', language: 'Sprache',
        fallback: 'Startseite — diese Seite ist nicht verfügbar',
        collectionFallback: 'Alle Vorlagen in dieser Sprache ansehen', tools: 'Werkzeuge', beadGenerator: 'Bild in Bügelperlen umwandeln',
        generator: 'Generator', patterns: 'Vorlagen', editor: 'Editor', guides: 'Anleitungen', about: 'Über uns',
        make: 'Gestalten', learn: 'Anleitungen', site: 'Website', browse: 'Vorlagen ansehen', advancedEditor: 'Vorlagen bearbeiten',
        allGuides: 'Alle Anleitungen', pixelGrid: 'Pixelraster', beadLoom: 'Vorlagen für den Perlenwebrahmen',
        privacy: 'Datenschutz', terms: 'Nutzungsbedingungen', contact: 'Kontakt', english: 'Englisch',
        description: 'Erstelle aus Bildern druckbare Bügelperlen-Vorlagen. Passe Größe und Farben an, bearbeite einzelne Perlen und exportiere dein Muster im Browser.',
        copyright: 'Alle Rechte vorbehalten. Unabhängig von den genannten Perlenmarken.',
    },
    fr: {
        hamaMaker: 'Image en modèle Hama',
        skip: 'Aller au contenu', main: 'Navigation principale', language: 'Langue',
        fallback: 'Accueil — cette page n’est pas disponible',
        collectionFallback: 'Voir tous les modèles dans cette langue', tools: 'Outils', beadGenerator: 'Image en modèle de perles',
        generator: 'Générateur', patterns: 'Modèles', editor: 'Éditeur', guides: 'Guides', about: 'À propos',
        make: 'Créer', learn: 'Apprendre', site: 'Site', browse: 'Voir les modèles', advancedEditor: 'Modifier un modèle',
        allGuides: 'Tous les guides', pixelGrid: 'Grille de pixel art', beadLoom: 'Modèles pour métier à perles',
        privacy: 'Confidentialité', terms: 'Conditions d’utilisation', contact: 'Contact', english: 'anglais',
        description: 'Transformez vos images en modèles de perles à repasser imprimables. Ajustez la taille et les couleurs, retouchez les perles et exportez le résultat dans votre navigateur.',
        copyright: 'Tous droits réservés. Site indépendant des marques de perles citées.',
    },
    ja: {
        hamaMaker: 'Hama図案作成',
        skip: '本文へ移動', main: 'メインナビゲーション', language: '言語',
        fallback: 'ホーム — このページの翻訳はありません',
        collectionFallback: 'この言語の図案一覧を見る', tools: 'ツール', beadGenerator: '画像からビーズ図案を作る',
        generator: '図案を作る', patterns: '図案一覧', editor: 'エディター', guides: '使い方', about: 'サイトについて',
        make: '作る', learn: '使い方', site: 'サイト情報', browse: '図案を見る', advancedEditor: '図案を編集する',
        allGuides: 'ガイド一覧', pixelGrid: 'ピクセルアート変換', beadLoom: 'ビーズ織りの図案作成',
        privacy: 'プライバシー', terms: '利用規約', contact: 'お問い合わせ', english: '英語',
        description: '画像から印刷できるアイロンビーズ図案を作成できます。サイズや色を調整し、ビーズを編集してブラウザから書き出せます。',
        copyright: 'すべての権利を留保します。記載されたビーズメーカーとは関係のない独立したサイトです。',
    },
} satisfies Record<SiteLocale, Record<string, string>>;

import { patterns } from './catalog';

// This is the complete catalog, not the earlier eight/twelve download selection.
export const patternLibraryCount = patterns.length;
// Use the same opening selection in every language, without implying popularity.
const openingIds = ['pokemon-pikachu-gen5', 'sdv-blue-chicken', 'minecraft-diamond-sword-1-21-1', 'smb-super-mushroom'];
export const browsePatterns = [
    ...openingIds.flatMap(id => patterns.filter(pattern => pattern.id === id)),
    ...patterns.filter(pattern => !openingIds.includes(pattern.id)),
];
// Keep the published search descriptions stable when adding a catalog card.
// Page copy uses the live count; metadata changes need a deliberate SEO review.
export const localizedLibraryMetadata = {
    de: {
        title: 'Kostenlose Bügelperlen-Vorlagen zum Ausdrucken | Fuse Bead Patterns',
        description: '106 kostenlose Bügelperlen-Vorlagen: Pokémon, Minecraft, Mario und eigene Motive. Deutsche PDFs, Farblisten und ein Editor zum Bearbeiten, ohne Anmeldung.',
    },
    ja: {
        title: 'アイロンビーズの無料図案・印刷用PDF | Fuse Bead Patterns',
        description: 'アイロンビーズ図案106点を無料でダウンロード。ポケモン、マイクラ、マリオやオリジナル図案を検索でき、日本語PDF・色表・日本語エディターを利用できます。登録不要です。',
    },
};

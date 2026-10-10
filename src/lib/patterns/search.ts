import type { PatternFilters } from './browser-state';

type SearchablePattern = {
    title: string;
    description: string;
    searchAliases?: string;
    collectionId: string | null;
};

export function normalizePatternSearch(value: string): string {
    return value.normalize('NFKD')
        // Strip Latin accents only: Japanese voiced/semi-voiced marks must survive.
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replaceAll('ß', 'ss').replaceAll('œ', 'oe')
        .replace(/[\u30a1-\u30f6]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60))
        // Recompose kana so an unvoiced query cannot match just the base of ピ/ド.
        .normalize('NFC')
        .replaceAll('-', ' ').trim();
}

/** The same card data and matching rules power every language's library. */
export function filterPatterns<T extends SearchablePattern>(patterns: readonly T[], { query, theme }: PatternFilters): T[] {
    const words = normalizePatternSearch(query).split(/\s+/).filter(Boolean);
    return patterns.filter(pattern =>
        (theme === 'all' || (theme === 'originals' ? pattern.collectionId === null : pattern.collectionId === theme)) &&
        words.every(word => normalizePatternSearch(`${pattern.title} ${pattern.description} ${pattern.searchAliases ?? ''} ${pattern.collectionId ?? 'original'}`).includes(word))
    );
}

export const PATTERN_FILTER_CHANGE_EVENT = 'fusebead:pattern-filters';
export type PatternFilters = { query: string; theme: string };

export function readPatternFilters(search: string, collectionIds: readonly string[]): PatternFilters {
    const params = new URLSearchParams(search);
    const requestedTheme = params.get('theme') ?? 'all';
    return {
        query: params.get('q') ?? '',
        theme: requestedTheme === 'originals' || collectionIds.includes(requestedTheme) ? requestedTheme : 'all',
    };
}

export function writePatternFilters(href: string, filters: PatternFilters): string {
    const url = new URL(href);
    if (filters.query) url.searchParams.set('q', filters.query);
    else url.searchParams.delete('q');
    if (filters.theme !== 'all') url.searchParams.set('theme', filters.theme);
    else url.searchParams.delete('theme');
    return `${url.pathname}${url.search}${url.hash}`;
}

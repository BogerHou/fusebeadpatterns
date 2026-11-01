'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { SiteLocale } from '@/lib/i18n/locales';
import { patternBrowserMessages } from '@/lib/patterns/browser-messages';
import { PATTERN_FILTER_CHANGE_EVENT, readPatternFilters, writePatternFilters, type PatternFilters } from '@/lib/patterns/browser-state';
import { filterPatterns } from '@/lib/patterns/search';
import { PatternGrid, type PatternCardData } from './PatternCards';

const SEARCH_DEBOUNCE_MS = 250;

function subscribeToFilters(callback: () => void) {
    window.addEventListener('popstate', callback);
    window.addEventListener(PATTERN_FILTER_CHANGE_EVENT, callback);
    return () => {
        window.removeEventListener('popstate', callback);
        window.removeEventListener(PATTERN_FILTER_CHANGE_EVENT, callback);
    };
}
const readSearch = () => window.location.search;
const serverSearch = () => '';

export default function PatternBrowser({ patterns, collections, locale = 'en' }: { locale?: SiteLocale; patterns: PatternCardData[]; collections: Array<{ id: string; title: string }> }) {
    const copy = patternBrowserMessages[locale];
    const search = useSyncExternalStore(subscribeToFilters, readSearch, serverSearch);
    const { query, theme } = readPatternFilters(search, collections.map(collection => collection.id));
    const [draftQuery, setDraftQuery] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeQuery = draftQuery ?? query;

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const updateFilters = (next: PatternFilters) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        setDraftQuery(null);
        window.history.replaceState(null, '', writePatternFilters(window.location.href, next));
        window.dispatchEvent(new Event(PATTERN_FILTER_CHANGE_EVENT));
    };

    const handleQueryChange = (nextQuery: string) => {
        setDraftQuery(nextQuery);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
            setDraftQuery(null);
            window.history.replaceState(null, '', writePatternFilters(window.location.href, { query: nextQuery, theme }));
            window.dispatchEvent(new Event(PATTERN_FILTER_CHANGE_EVENT));
        }, SEARCH_DEBOUNCE_MS);
    };

    const matching = filterPatterns(patterns, { query: activeQuery, theme });

    return (
        <section aria-label={copy.browse}>
            <div className="pattern-filters">
                <label className="pattern-search" htmlFor="pattern-search">
                    {copy.search}
                    <input id="pattern-search" type="search" value={activeQuery} onChange={(event) => handleQueryChange(event.target.value)} placeholder={copy.placeholder}  />
                </label>
                <label className="pattern-theme" htmlFor="pattern-theme">
                    {copy.theme}
                    <select id="pattern-theme" value={theme} onChange={(event) => updateFilters({ query: activeQuery, theme: event.target.value })} >
                        <option value="all">{copy.all}</option>
                        {collections.map((collection) => (
                            <option key={collection.id} value={collection.id}>{collection.title}</option>
                        ))}
                        <option value="originals">{copy.originals}</option>
                    </select>
                </label>
                <p role="status" className="pattern-count">{matching.length} {matching.length === 1 ? copy.one : copy.many}</p>
            </div>
            <PatternGrid patterns={matching} />
            {matching.length === 0 && (
                <div className="pattern-empty">
                    <h2>{copy.empty}</h2>
                    <p>{copy.help}</p>
                    <button type="button" onClick={() => updateFilters({ query: '', theme: 'all' })} className="button-secondary">{copy.reset}</button>
                </div>
            )}
        </section>
    );
}

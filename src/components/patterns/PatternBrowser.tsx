'use client';

import { useState } from 'react';
import { PatternGrid, type PatternCardData } from './PatternCards';

const normalizeSearch = (value: string) => value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replaceAll('-', ' ').toLowerCase().trim();

export default function PatternBrowser({ patterns, collections }: { patterns: PatternCardData[]; collections: Array<{ id: string; title: string }> }) {
    const [query, setQuery] = useState('');
    const [theme, setTheme] = useState('all');
    const searchWords = normalizeSearch(query).split(/\s+/).filter(Boolean);
    const matching = patterns.filter((pattern) =>
        (theme === 'all' || (theme === 'originals' ? pattern.collectionId === null : pattern.collectionId === theme)) &&
        searchWords.every((word) => normalizeSearch(`${pattern.title} ${pattern.collectionId ?? 'original halloween'}`).includes(word))
    );

    return (
        <section aria-label="Browse patterns">
            <div className="pattern-filters">
                <label className="pattern-search" htmlFor="pattern-search">
                    Search patterns
                    <input id="pattern-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Character name"  />
                </label>
                <label className="pattern-theme" htmlFor="pattern-theme">
                    Theme
                    <select id="pattern-theme" value={theme} onChange={(event) => setTheme(event.target.value)} >
                        <option value="all">All themes</option>
                        {collections.map((collection) => (
                            <option key={collection.id} value={collection.id}>{collection.title}</option>
                        ))}
                        <option value="originals">Original Halloween scenes</option>
                    </select>
                </label>
                <p role="status" className="pattern-count">{matching.length} {matching.length === 1 ? 'pattern' : 'patterns'}</p>
            </div>
            <PatternGrid patterns={matching} />
            {matching.length === 0 && (
                <div className="pattern-empty">
                    <h2>No patterns match this search.</h2>
                    <p>Try a character name or choose another theme.</p>
                    <button type="button" onClick={() => { setQuery(''); setTheme('all'); }} className="button-secondary">Clear filters</button>
                </div>
            )}
        </section>
    );
}

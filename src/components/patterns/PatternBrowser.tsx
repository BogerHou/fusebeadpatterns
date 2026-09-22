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
            <div className="mb-5 flex flex-wrap items-end gap-3 border-y-2 border-brutal-black py-4">
                <label className="min-w-0 flex-1 basis-56 text-sm font-bold" htmlFor="pattern-search">
                    Search patterns
                    <input id="pattern-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Blue Chicken or Eevee" className="mt-1.5 block min-h-11 w-full border-2 border-brutal-black bg-white px-3 py-2 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple" />
                </label>
                <label className="w-full text-sm font-bold sm:w-56" htmlFor="pattern-theme">
                    Theme
                    <select id="pattern-theme" value={theme} onChange={(event) => setTheme(event.target.value)} className="mt-1.5 block min-h-11 w-full border-2 border-brutal-black bg-white px-3 py-2 font-normal">
                        <option value="all">All themes</option>
                        {collections.map((collection) => (
                            <option key={collection.id} value={collection.id}>{collection.title}</option>
                        ))}
                        <option value="originals">Original Halloween scenes</option>
                    </select>
                </label>
                <p role="status" className="py-2 text-sm text-gray-700">{matching.length} {matching.length === 1 ? 'pattern' : 'patterns'}</p>
            </div>
            <PatternGrid patterns={matching} />
            {matching.length === 0 && (
                <div className="border-2 border-brutal-black bg-white p-6">
                    <p>No patterns match this search.</p>
                    <button type="button" onClick={() => { setQuery(''); setTheme('all'); }} className="mt-3 min-h-11 font-bold underline decoration-2 underline-offset-4">Clear filters</button>
                </div>
            )}
        </section>
    );
}

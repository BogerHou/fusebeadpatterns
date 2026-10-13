'use client';

import { useId, useRef, useState } from 'react';
import type { ColorChartColor } from '@/lib/color-chart/data';
import type { SiteLocale } from '@/lib/i18n/locales';
import { formatColorChartResults, getColorChartCopy } from '@/lib/color-chart/copy';
import { filterColorChartColors } from '@/lib/color-chart/search';
import styles from './ColorChart.module.css';

export interface ColorChartProps {
    colors: ColorChartColor[];
    locale: SiteLocale;
}

export default function ColorChart({ colors, locale }: ColorChartProps) {
    const copy = getColorChartCopy(locale);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const id = useId();
    const inputId = `${id}-search`, resultsId = `${id}-results`, noteId = `${id}-names`;
    const visibleColors = filterColorChartColors(colors, query);

    function clearSearch() {
        setQuery('');
        inputRef.current?.focus();
    }

    return (
        <section className={styles.chart} aria-label={copy.collectionLabel} lang={locale}>
            <div className={styles.searchRow}>
                <div className={styles.searchField}>
                    <label htmlFor={inputId}>{copy.searchLabel}</label>
                    <input
                        ref={inputRef}
                        id={inputId}
                        type="search"
                        maxLength={128}
                        placeholder={copy.placeholder}
                        value={query}
                        onChange={event => setQuery(event.currentTarget.value)}
                        aria-describedby={`${resultsId} ${noteId}`}
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>
                <button type="button" className={styles.clear} disabled={query.length === 0} onClick={clearSearch}>{copy.clear}</button>
            </div>
            <div className={styles.notes}>
                <p id={resultsId} className={styles.results} role="status" aria-live="polite" aria-atomic="true">
                    {formatColorChartResults(locale, visibleColors.length, colors.length)}
                </p>
                <p id={noteId} className={styles.namesNote}>{copy.namesNote}</p>
            </div>
            {visibleColors.length === 0 ? <p className={styles.empty}>{copy.empty}</p> : (
                <ul className={styles.swatches}>
                    {visibleColors.map(color => (
                        <li key={color.ref} className={styles.color}>
                            <div className={styles.swatch} style={{ backgroundColor: color.hex }} aria-hidden="true" />
                            <div className={styles.details}>
                                <span className={styles.ref}><span className={styles.srOnly}>{copy.refLabel}: </span><code>{color.ref}</code></span>
                                <span className={styles.name}><span className={styles.srOnly}>{copy.nameLabel}: </span><span lang="en">{color.name}</span></span>
                                <div className={styles.values}>
                                    <span><span className={styles.srOnly}>{copy.hexLabel}: </span><code>{color.hex}</code></span>
                                    <span className={styles.rgb}>{copy.rgbLabel} {color.rgb.r}, {color.rgb.g}, {color.rgb.b}</span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

import library from './patterns.json';
import { validateChart, type LoomChart } from './core';

export type LoomPatternLocale = 'en' | 'de' | 'fr' | 'ja';
export type LoomPatternAssetKind = 'preview' | 'png' | 'project' | 'pdf';
export type LoomPatternPaper = 'a4' | 'letter';
export const loomPatternLibraryPaths: Record<LoomPatternLocale, string> = library.libraryPaths;
export const loomPatternMakerPaths: Record<LoomPatternLocale, string> = library.makerPaths;

interface PatternSource {
    id: string;
    titles: Record<LoomPatternLocale, string>;
    descriptions: Record<LoomPatternLocale, string>;
    columns: number;
    rows: number;
    cellAspect: number;
    startCorner: LoomChart['startCorner'];
    serpentine: boolean;
    backgroundSymbol: string;
    palette: Array<{
        id: string;
        symbol: string;
        hex: string;
        labels: Record<LoomPatternLocale, string>;
    }>;
    /** Screen order: top to bottom, left to right. Row 1 is at the bottom. */
    symbolRows: string[];
}

export interface LoomPattern extends PatternSource {
    beadCount: number;
    colorCount: number;
}

/** The JSON file is also the Python asset generator's single source of truth. */
export const loomPatterns: LoomPattern[] = (library.patterns as PatternSource[]).map(pattern => ({
    ...pattern,
    beadCount: pattern.columns * pattern.rows,
    colorCount: pattern.palette.length,
}));

export function getLoomPattern(id: string): LoomPattern | undefined {
    return loomPatterns.find(pattern => pattern.id === id);
}

function requirePattern(id: string): LoomPattern {
    const pattern = getLoomPattern(id);
    if (!pattern) throw new Error('Unknown bead loom pattern.');
    return pattern;
}

function requireLocale(locale: LoomPatternLocale): void {
    if (!['en', 'de', 'fr', 'ja'].includes(locale)) throw new Error('Unsupported bead loom pattern language.');
}

/** Returns an isolated, current editor model; labels and title are the only localized fields. */
export function getLoomPatternChart(id: string, locale: LoomPatternLocale = 'en'): LoomChart {
    requireLocale(locale);
    const pattern = requirePattern(id);
    const colors = new Map(pattern.palette.map(color => [color.symbol, color.id]));
    return validateChart({
        title: pattern.titles[locale],
        columns: pattern.columns,
        rows: pattern.rows,
        cellAspect: pattern.cellAspect,
        startCorner: pattern.startCorner,
        serpentine: pattern.serpentine,
        backgroundId: colors.get(pattern.backgroundSymbol),
        palette: pattern.palette.map(color => ({
            id: color.id, symbol: color.symbol, hex: color.hex,
            name: color.labels[locale], code: '',
        })),
        cells: pattern.symbolRows.flatMap(row => [...row].map(symbol => colors.get(symbol))),
    });
}

export function loomPatternAssetPath(
    id: string,
    locale: LoomPatternLocale,
    kind: LoomPatternAssetKind,
    paper: LoomPatternPaper = 'a4',
): string {
    requirePattern(id);
    requireLocale(locale);
    const base = `/bead-loom-patterns/${id}`;
    if (kind === 'preview') return `${base}/preview.svg`;
    if (kind === 'png') return `${base}/chart.png`;
    if (kind === 'project') return `${base}/${locale}/pattern.bead-loom.json`;
    if (kind !== 'pdf' || !['a4', 'letter'].includes(paper)) throw new Error('Unsupported bead loom pattern asset.');
    return `${base}/${locale}/pattern-${paper === 'letter' ? 'us-letter' : 'a4'}.pdf`;
}

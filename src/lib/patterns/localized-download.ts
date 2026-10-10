import type { Pattern } from './catalog';
import type { PatternLocale } from './localized-content';
import gridAssets from './localized-grid-assets.json';

type LocalizedGridAsset = { href: string; width: number; height: number };
const localizedGrids: Record<PatternLocale, Record<string, LocalizedGridAsset>> = gridAssets;

// The generated manifest records dimensions read from the reviewed PNGs.
// Missing translations must fail validation instead of silently serving English.
export function getLocalizedPatternGrid(pattern: Pattern, locale: PatternLocale) {
    const asset = localizedGrids[locale][pattern.id];
    if (!asset?.href) throw new Error(`Missing ${locale} pattern chart: ${pattern.id}`);
    return { ...asset, language: locale };
}

// Every reviewed catalog pattern now has a validated PDF in each site language.
// The original 8/6/12 translated downloads retain these same public paths/bytes.
export function getLocalizedPatternPdf(pattern: Pattern, locale: PatternLocale) {
    return { href: `/patterns-${locale}/${pattern.id}/pattern.pdf`, language: locale };
}

// A Letter link is available only when the reviewed pattern actually has one.
export function getLocalizedPatternLetterPdf(pattern: Pattern, locale: PatternLocale) {
    if (!pattern.assets.pdfLetter) return undefined;
    return { href: `/patterns-${locale}/${pattern.id}/pattern-letter.pdf`, language: locale };
}

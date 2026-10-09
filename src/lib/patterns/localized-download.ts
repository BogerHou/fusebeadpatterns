import type { Pattern } from './catalog';
import type { PatternLocale } from './localized-content';

// Every reviewed catalog pattern now has a validated PDF in each site language.
// The original 8/6/12 translated downloads retain these same public paths/bytes.
export function getLocalizedPatternPdf(pattern: Pattern, locale: PatternLocale) {
    return { href: `/patterns-${locale}/${pattern.id}/pattern.pdf`, language: locale };
}

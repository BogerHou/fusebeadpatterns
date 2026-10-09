import { patterns, patternCollections, type Pattern } from '@/lib/patterns/catalog';
import { getLocalizedPatternName, getLocalizedPatternTitle, getLocalizedPatternIntro, getPatternSearchAliases, type PatternLocale } from '@/lib/patterns/localized-content';
import { localizedPatternUi } from '@/lib/patterns/localized-ui';
import PatternSectionNav from './PatternSectionNav';
import PatternBrowser from './PatternBrowser';
import type { PatternCardData } from './PatternCards';

export function toLocalizedPatternCard(pattern: Pattern, locale: PatternLocale): PatternCardData {
    return {
        id: pattern.id, slug: pattern.slug, collectionId: pattern.collectionId,
        title: getLocalizedPatternName(pattern, locale),
        description: getLocalizedPatternIntro(pattern, locale),
        preview: pattern.assets.preview, href: `/${locale}/patterns/${pattern.slug}`,
        alt: getLocalizedPatternTitle(pattern, locale), searchAliases: getPatternSearchAliases(pattern),
    };
}

export default function LocalizedPatternCatalog({ locale }: { locale: PatternLocale }) {
    const copy = localizedPatternUi[locale];
    return (
        <section id="all-patterns" aria-labelledby="all-patterns-heading" className="mt-10 border-t border-line pt-8">
            <h2 id="all-patterns-heading" className="section-heading">{copy.fullTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{copy.intro}</p>
            <PatternSectionNav locale={locale} />
            <PatternBrowser locale={locale} patterns={patterns.map(pattern => toLocalizedPatternCard(pattern, locale))} collections={patternCollections.map(({ id, title }) => ({ id, title: locale === 'ja' ? ({ pokemon: 'ポケモン', 'super-mario': 'スーパーマリオ', kirby: '星のカービィ' }[id] ?? title) : title }))} />
        </section>
    );
}

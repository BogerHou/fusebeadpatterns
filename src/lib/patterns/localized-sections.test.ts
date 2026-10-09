import { describe, expect, it } from 'vitest';
import { patternCollections, getPatternsForCollection } from './catalog';
import { patternTopics, getPatternsForTopic, getAdditionalPatternsForTopic } from './topics';
import { patternSectionSlugs, patternSectionRouteGroups, getPatternSectionHref } from './section-routes';
import { getLocalizedPatternSection } from './localized-sections';
import { patternLanguageAlternates } from '../i18n/metadata';
import { getLocaleDestination } from '../i18n/routes';
import frenchChristmas from './french-christmas.json';

const locales = ['de', 'fr', 'ja'] as const;
describe('localized collection and topic continuity', () => {
    it('uses every existing section and the exact same ordered pattern membership', () => {
        expect([...patternSectionSlugs].sort()).toEqual([...patternCollections.map(item => item.slug), ...patternTopics.map(item => item.slug)].sort());
        for (const locale of locales) {
            for (const collection of patternCollections) {
                const section = getLocalizedPatternSection(collection.slug, locale)!;
                expect(section.patterns).toEqual(getPatternsForCollection(collection.id));
                const min = Math.min(...section.patterns.map(pattern => pattern.colorCount));
                expect(section.fewest?.colorCount).toBe(min);
                expect(section.notes).toHaveLength(2);
            }
            for (const topic of patternTopics) {
                const section = getLocalizedPatternSection(topic.slug, locale)!;
                expect(section.patterns).toEqual(getPatternsForTopic(topic));
                expect(section.additionalPatterns).toEqual(getAdditionalPatternsForTopic(topic));
                expect(section.notes).toHaveLength(topic.selectionNotes.length);
                expect(section.intro).not.toEqual(topic.intro);
                expect(section.relatedLinks).toHaveLength(topic.relatedLinks.length);
                for (const link of section.relatedLinks) {
                    if (link.language === locale) {
                        if (link.href.includes('/guides/')) expect(link.href).toMatch(new RegExp(`^/${locale}/guides/`));
                        else expect(link.href).toBe(getPatternSectionHref(link.href.split('/').at(-1)!, locale));
                    }
                    else expect(link.label).toMatch(/Englisch|anglais|英語/);
                }
            }
        }
    });
    it('keeps the old French Christmas URL as the sole canonical language destination', () => {
        const topic = patternTopics.find(topic => topic.slug === 'christmas')!;
        expect(frenchChristmas.patterns.map(pattern => pattern.id)).toEqual([...topic.patternIds]);
        expect(getAdditionalPatternsForTopic(topic).map(pattern => pattern.id)).toEqual(['original-santa-hat']);
        expect(getPatternSectionHref('christmas', 'fr')).toBe('/fr/modeles-perles-a-repasser-noel');
        expect(patternLanguageAlternates('christmas').fr).toBe('https://fusebeadpatterns.art/fr/modeles-perles-a-repasser-noel');
        for (const locale of ['en', ...locales] as const) {
            expect(getLocaleDestination('/fr/modeles-perles-a-repasser-noel', locale)).toEqual({ href: getPatternSectionHref('christmas', locale), isFallback: false });
        }
    });
    it('has reciprocal canonical hreflang and switcher routes without multiple sets claiming a URL', () => {
        const seen = new Set<string>();
        for (const [index, group] of patternSectionRouteGroups.entries()) {
            const alternates = patternLanguageAlternates(patternSectionSlugs[index]);
            for (const [locale, path] of Object.entries(group)) {
                expect(seen.has(path)).toBe(false); seen.add(path);
                expect(alternates[locale as keyof typeof group]).toBe(`https://fusebeadpatterns.art${path}`);
                for (const target of ['en', ...locales] as const) expect(getLocaleDestination(path, target)).toEqual({ href: group[target], isFallback: false });
            }
            expect(alternates['x-default']).toBe(alternates.en);
        }
    });
    it('does not turn unknown slugs into indexed generated sections', () => {
        for (const locale of locales) expect(getLocalizedPatternSection('not-a-theme', locale)).toBeUndefined();
    });
});

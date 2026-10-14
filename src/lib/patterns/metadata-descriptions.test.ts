import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { patterns, patternCollections } from './catalog';
import { getLocalizedPatternIntro, getLocalizedPatternName } from './localized-content';
import { localizedPatternMetadataDescription, patternMetadataDescription, patternCollectionMetadataDescription } from './metadata-descriptions';

it('keeps complete subject identities in short search summaries without changing the 118 patterns or full introductions', () => {
    const locales = ['de', 'fr', 'ja'] as const;
    const originalPatterns = JSON.stringify(patterns);
    const introductions = patterns.map(pattern => ({ id: pattern.id, locales: locales.map(locale => getLocalizedPatternIntro(pattern, locale)) }));
    expect(patterns).toHaveLength(119);
    expect(createHash('sha256').update(JSON.stringify(introductions.filter(pattern => pattern.id !== 'original-strawberry'))).digest('hex')).toBe('fd1e50e1cb5114eed24d2f5096ef08822de8a1cbdb57ecfd3dd91389c77cd13c');

    for (const pattern of patterns) {
        const english = patternMetadataDescription(pattern);
        expect(Array.from(english).length).toBeLessThanOrEqual(160);
        if (Array.from(pattern.description).length <= 160) expect(english).toBe(pattern.description);
        for (const locale of locales) {
            const summary = localizedPatternMetadataDescription(pattern, locale);
            expect(Array.from(summary).length).toBeLessThanOrEqual(160);
            expect(summary).toContain(getLocalizedPatternName(pattern, locale));
            expect(summary).toMatch(/[.。]$/);
            expect(summary).not.toMatch(/(?:\.\.\.|…)$/);
            if (locale === 'ja') expect(summary).toBe(getLocalizedPatternIntro(pattern, locale));
            else {
                expect(summary).toContain(`${pattern.motifWidth} × ${pattern.motifHeight}`);
                expect(summary).toContain('PDF');
                expect(summary).toContain('PNG');
            }
        }
    }
    for (const collection of patternCollections) {
        const summary = patternCollectionMetadataDescription(collection);
        expect(Array.from(summary).length).toBeLessThanOrEqual(160);
        if (collection.slug !== 'minecraft') expect(summary).toBe(collection.description);
    }
    expect(JSON.stringify(patterns)).toBe(originalPatterns);
    expect(patterns.map(pattern => ({ id: pattern.id, locales: locales.map(locale => getLocalizedPatternIntro(pattern, locale)) }))).toEqual(introductions);
});

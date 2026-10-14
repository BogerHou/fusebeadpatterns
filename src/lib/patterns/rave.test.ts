import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { patterns, patternCollections } from './catalog';
import { patternTopics, getPatternsForTopic } from './topics';
import { getLocalizedPatternSection, localizedSectionMetadata } from './localized-sections';
import { getLocaleDestination } from '../i18n/routes';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { getLocalizedPatternPdf, getLocalizedPatternLetterPdf, getLocalizedPatternGrid } from './localized-download';
import { localizePatternNote } from './localized-content';
import { ravePatternIds } from './rave';
import reviewed from '../../../scripts/rave-pattern-reviewed-grids.json';

const expected = [
    { id: 'original-rave-alien-head', slug: 'alien-head', beads: 268, colors: 4, motif: [19, 20] },
    { id: 'original-rave-rainbow-smiley', slug: 'rainbow-smiley', beads: 429, colors: 7, motif: [23, 23] },
    { id: 'original-rave-moon-mushroom', slug: 'crescent-moon-mushroom', beads: 253, colors: 5, motif: [25, 25] },
] as const;

describe('reviewed original rave patterns', () => {
    it('adds only three originals without changing the 114 existing objects or five collections', () => {
        const old = patterns.filter(pattern => !ravePatternIds.includes(pattern.id) && pattern.id !== 'original-sunset-mountain-lake' && pattern.id !== 'original-strawberry');
        expect(old).toHaveLength(114);
        expect(createHash('sha256').update(JSON.stringify(old)).digest('hex')).toBe('17f75aeeee37ec226837151069a2a094efc4dec440d36296bc9def639b509992');
        expect(createHash('sha256').update(JSON.stringify(patternCollections)).digest('hex')).toBe('b98ca4ac8197f4710c81b3a89da673d5941986ea9a04efd4dab225e952d6998b');
        const topic = patternTopics.find(topic => topic.slug === 'rave')!;
        expect(getPatternsForTopic(topic).map(pattern => pattern.id)).toEqual(ravePatternIds);
    });

    it.each(expected)('$slug retains the reviewed transparent grid and editable Perler project', async fixture => {
        const pattern = patterns.find(item => item.id === fixture.id)!;
        expect([pattern.slug, pattern.beads, pattern.colorCount]).toEqual([fixture.slug, fixture.beads, fixture.colors]);
        expect([pattern.motifWidth, pattern.motifHeight]).toEqual(fixture.motif);
        expect(pattern.source).toBeNull();
        expect(pattern.collectionId).toBeNull();
        const source = await sharp('public' + pattern.assets.pixels).ensureAlpha().raw().toBuffer();
        expect(createHash('sha256').update(source).digest('hex')).toBe(reviewed[fixture.id].rgbaSha256);
        const draft = parseEditorProject(readFileSync('public' + pattern.assets.project, 'utf8'))!;
        expect([draft.boardId, draft.boardWidth, draft.boardHeight]).toEqual(['midi', 1, 1]);
        expect(draft.selectedPaletteIds).toEqual(['perler']);
        expect(Buffer.from(decodeEditorPatternDraft(draft.editedPattern)!)).toEqual(source);
        expect(parseEditorProject(serializeEditorProject(draft))).toEqual(draft);
        for (let i = 0; i < source.length; i += 4) if (source[i + 3] === 0) expect([...source.subarray(i, i + 4)]).toEqual([0, 0, 0, 0]);
        expect((await sharp('public' + pattern.assets.grid).metadata()).height).toBe(1040);
        expect(pattern.notes.join(' ')).toContain('wearing have not been tested');
        for (const locale of ['de', 'fr', 'ja'] as const) {
            for (const asset of [getLocalizedPatternPdf(pattern, locale), getLocalizedPatternLetterPdf(pattern, locale)!]) {
                expect(readFileSync('public' + asset.href).subarray(0, 5).toString()).toBe('%PDF-');
            }
            const grid = getLocalizedPatternGrid(pattern, locale);
            const size = await sharp('public' + grid.href).metadata();
            expect([size.width, size.height]).toEqual([grid.width, grid.height]);
            expect(pattern.notes.map(note => localizePatternNote(note, locale)).every(note => note.length > 0)).toBe(true);
        }
    });

    it('preserves the white beads and fragile coordinates of the moon design', () => {
        const pattern = patterns.find(item => item.id === 'original-rave-moon-mushroom')!;
        expect(pattern.palette.find(color => color.symbol === 'W')).toMatchObject({ ref: '80-19001', name: 'White', count: 30 });
        const warning = pattern.notes.find(note => note.startsWith('Thin one-bead'))!;
        expect(warning).toContain('row 3, column 10, row 3, column 11, row 4, column 10');
        for (const locale of ['de', 'fr', 'ja'] as const) expect(localizePatternNote(warning, locale).match(/\d+/g)).toEqual(['3', '10', '3', '11', '4', '10']);
    });

    it('has four matching topic routes with native onward guides and self canonicals', () => {
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
            expect(getLocaleDestination('/patterns/rave', locale)).toEqual({ href: `${locale === 'en' ? '' : '/' + locale}/patterns/rave`, isFallback: false });
            if (locale === 'en') continue;
            const section = getLocalizedPatternSection('rave', locale)!;
            expect(section.patterns.map(pattern => pattern.id)).toEqual(ravePatternIds);
            expect(section.relatedLinks.every(link => link.language === locale && link.href.startsWith('/' + locale + '/'))).toBe(true);
            expect(localizedSectionMetadata(section, locale).alternates?.canonical).toBe('/' + locale + '/patterns/rave');
        }
    });
});

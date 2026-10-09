import { describe, expect, it } from 'vitest';
import { guidePages, getGuideBySlug } from '../../app/(english)/guides/guide-data';
import { getGuideSummaries, getLocalizedGuide, guideTranslations, localizeGuideLink } from './localized';
import { guideHref, guideIndexHref, guideLanguageAlternates, guideRouteGroups, translatedGuideSlugs } from './routes';
import { getLocaleDestination } from '../i18n/routes';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EditorProjectFile } from '../editor/draft';
import { EDITOR_MESSAGE_ROWS } from '../editor/messages';

const locales = ['de', 'fr', 'ja'] as const;
describe('localized guides and source preservation', () => {
    it('preserves every source section, paragraph, bullet, table row and illustrated example', () => {
        for (const locale of locales) for (const slug of translatedGuideSlugs) {
            const source = getGuideBySlug(slug)!;
            const target = getLocalizedGuide(slug, locale)!;
            expect(target.title).not.toBe(source.title);
            expect(target.intro).not.toBe(source.intro);
            expect(target.description).not.toBe(source.description);
            expect(target.sections).toHaveLength(source.sections.length);
            for (const [index, section] of source.sections.entries()) {
                const translated = target.sections[index];
                expect(translated.heading).not.toBe(section.heading);
                expect(translated.body).toHaveLength(section.body.length);
                for (const text of translated.body) expect(section.body).not.toContain(text);
                expect(translated.bullets?.length).toBe(section.bullets?.length);
                expect(translated.patternIds).toEqual(section.patternIds);
                expect(translated.table?.rows.length).toBe(section.table?.rows.length);
                expect(translated.table?.headers.length).toBe(section.table?.headers.length);
                if (section.table) expect(translated.table).not.toEqual(section.table);
                if (section.figure) {
                    expect(translated.figure).toMatchObject({ src: section.figure.src, width: section.figure.width, height: section.figure.height });
                    expect(translated.figure?.caption).not.toBe(section.figure.caption);
                    expect(translated.figure?.alt).not.toBe(section.figure.alt);
                }
                expect(translated.comparison?.length).toBe(section.comparison?.length);
                section.comparison?.forEach((image, imageIndex) => {
                    const translatedImage = translated.comparison![imageIndex];
                    expect(translatedImage).toMatchObject({ src: image.src, width: image.width, height: image.height });
                    expect(translatedImage.alt).not.toBe(image.alt);
                    expect(translatedImage.caption).not.toBe(image.caption);
                });
                expect(translated.links?.length ?? 0).toBe(section.links?.length ?? 0);
            }
            expect(target.relatedLinks).toHaveLength(source.relatedLinks.length);
        }
    });

    it('retains manufacturer citations and source images/projects while linking native printables', () => {
        for (const locale of locales) for (const slug of translatedGuideSlugs) {
            const source = getGuideBySlug(slug)!;
            const target = getLocalizedGuide(slug, locale)!;
            source.sections.forEach((section, index) => section.links?.forEach((link, linkIndex) => {
                const translated = target.sections[index].links![linkIndex];
                if (link.href.startsWith('https://') || (link.href.startsWith('/guides/photo-to-pattern/') && !link.href.endsWith('.pdf'))) expect(translated.href).toBe(link.href);
                if (link.href.startsWith('/printables/calibration/')) expect(translated.href).toBe(link.href.replace('/printables/calibration/', `/printables/calibration/${locale}/`));
                if (link.href.startsWith('/guides/photo-to-pattern/') && link.href.endsWith('.pdf')) expect(translated.href).toBe(link.href.replace('/guides/photo-to-pattern/', `/guides/photo-to-pattern/${locale}/`));
                expect(translated.label).not.toBe(link.label);
                expect(translated.download).toBe(link.download);
            }));
        }
    });

    it('keeps normal onward journeys, including Hama, in the selected language', () => {
        for (const locale of locales) for (const slug of translatedGuideSlugs) {
            const guide = getLocalizedGuide(slug, locale)!;
            const links = [...guide.relatedLinks, ...guide.sections.flatMap(section => section.links ?? [])];
            for (const link of links) {
                if (link.href.startsWith('https://') || link.href.startsWith('/printables/') || link.href.startsWith('/guides/photo-to-pattern/')) continue;
                expect(link.href === `/${locale}` || link.href === `/${locale}#generator` || link.href.startsWith(`/${locale}/`)).toBe(true);
            }
        }
    });

    it('covers all seven guides and retains the existing Japanese photo URL in the equivalent group', () => {
        expect([...translatedGuideSlugs].sort()).toEqual(guidePages.map(guide => guide.slug).sort());
        for (const locale of locales) {
            const summaries = getGuideSummaries(locale);
            expect(summaries.map(item => item.slug)).toEqual(guidePages.map(item => item.slug));
            for (const item of summaries) expect(item.href).toBe(guideHref(item.slug, locale));
            const photo = summaries.find(item => item.slug === 'photo-to-perler-bead-pattern')!;
            expect(photo.language).toBe(locale);
        }
        expect(guideRouteGroups.find(group => group.en === '/guides/photo-to-perler-bead-pattern')?.ja).toBe('/ja/guides/photo-to-perler-bead-pattern');
        expect(getLocalizedGuide('photo-to-perler-bead-pattern', 'ja')?.sections).toHaveLength(8);
        expect(getLocalizedGuide('unknown-guide', 'de')).toBeUndefined();
    });

    it('offers native example PDFs and keeps local generator/editor actions usable', () => {
        for (const locale of locales) {
            const guide = getLocalizedGuide('photo-to-perler-bead-pattern', locale)!;
            const links = guide.sections.flatMap(section => section.links ?? []);
            for (const link of links.filter(link => link.href.endsWith('.pdf'))) {
                expect(link.href).toContain(`/photo-to-pattern/${locale}/`);
                expect(link.label).not.toMatch(/Englisch|anglais|英語/);
            }
            expect(links.some(link => link.href === `/${locale}#generator`)).toBe(true);
            expect(links.some(link => link.href === `/${locale}/editor`)).toBe(true);
            const instructions = guide.sections[4].body.join(' ');
            for (const key of ['Show Source', 'Show Reference', 'Setup', 'Colors', 'Quick Colors', 'Undo', 'Redo']) {
                const row = EDITOR_MESSAGE_ROWS.find(row => row[0] === key)!;
                expect(instructions).toContain(row[{ de: 1, fr: 2, ja: 3 }[locale]]);
            }
        }
    });

    it('resolves every native guide and calibration download to an actual file', () => {
        const printables = [
            '/guides/photo-to-pattern/cat-perler-29.pdf',
            '/guides/photo-to-pattern/cat-perler-58.pdf',
            '/guides/photo-to-pattern/rocket-perler-29-cleanup.pdf',
            ...['a4', 'us-letter'].flatMap(paper => ['pdf', 'svg'].map(format => `/printables/calibration/29x29-5mm-${paper}.${format}`)),
        ];
        for (const locale of locales) for (const href of printables) {
            const link = localizeGuideLink({ href, label: 'original', download: true }, locale);
            const bytes = readFileSync(resolve(process.cwd(), `public${link.href}`));
            if (link.href.endsWith('.pdf')) expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
            else expect(bytes.toString()).toContain('<svg');
            expect(link.label).not.toMatch(/Englisch|anglais|英語/);
            expect(link.download).toBe(true);
        }
    });

    it('checks the stated counts and 16 window edits against the actual downloadable projects', () => {
        const readProject = (name: string): EditorProjectFile => JSON.parse(readFileSync(resolve(process.cwd(), `public/guides/photo-to-pattern/${name}.bead-pattern.json`), 'utf8'));
        const projects = {
            cat29: readProject('cat-perler-29'), cat58: readProject('cat-perler-58'),
            rocket: readProject('rocket-perler-29-auto'), edited: readProject('rocket-perler-29-cleanup'),
        };
        const pixels = (project: EditorProjectFile) => {
            const grid = project.draft.editedPattern!;
            const bytes = Buffer.from(grid.data, 'base64');
            expect(bytes.length).toBe(grid.width * grid.height * 4);
            return Array.from({ length: grid.width * grid.height }, (_, index) => [...bytes.subarray(index * 4, index * 4 + 4)]);
        };
        const summary = (project: EditorProjectFile) => {
            const filled = pixels(project).filter(pixel => pixel[3] > 0);
            return [project.draft.editedPattern!.width, filled.length, new Set(filled.map(pixel => pixel.join(','))).size];
        };
        expect(summary(projects.cat29)).toEqual([29, 667, 11]);
        expect(summary(projects.cat58)).toEqual([58, 2726, 13]);
        expect(summary(projects.rocket)).toEqual([29, 337, 32]);
        expect(summary(projects.edited)).toEqual([29, 337, 31]);
        for (const project of Object.values(projects)) {
            expect(project.draft.matchingId).toBe('delta_e_cie2000');
            expect(project.draft.ditheringId).toBe('none');
            expect(project.draft.activePalettes.flatMap(palette => palette.entries).filter(entry => entry.enabled)).toHaveLength(103);
            expect(project.draft.rendererSettings).toMatchObject({ center: true, fit: true });
            expect(project.draft.imageAdjustments).toEqual({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0 });
        }
        const before = pixels(projects.rocket), after = pixels(projects.edited);
        const changed = after.flatMap((pixel, index) => pixel.join(',') === before[index].join(',') ? [] : [index]);
        const expected = [
            ...[9, 15].flatMap(row => [14, 15, 16].map(column => [row, column])),
            ...[10, 14].flatMap(row => [13, 17].map(column => [row, column])),
            ...[11, 12, 13].flatMap(row => [12, 18].map(column => [row, column])),
        ].map(([row, column]) => (row - 1) * 29 + column - 1).sort((a, b) => a - b);
        expect(changed).toEqual(expected);
        for (const index of changed) {
            expect(before[index][3]).toBe(255);
            expect(after[index]).toEqual([47, 60, 85, 255]);
        }
    });

    it('switches each translated article and its index to the exact same topic with reciprocal alternates', () => {
        for (const slug of [undefined, ...translatedGuideSlugs]) {
            const languages = guideLanguageAlternates(slug);
            for (const locale of ['en', ...locales] as const) {
                const path = slug ? guideHref(slug, locale) : guideIndexHref(locale);
                expect(languages[locale]).toBe(`https://fusebeadpatterns.art${path}`);
                for (const target of ['en', ...locales] as const) expect(getLocaleDestination(path, target, { hash: '#main-content' })).toEqual({ href: `${slug ? guideHref(slug, target) : guideIndexHref(target)}#main-content`, isFallback: false });
            }
            expect(languages['x-default']).toBe(languages.en);
        }
    });

    it('keeps actual measurements, brand distinctions and manufacturer-specific instructions in each version', () => {
        for (const locale of locales) {
            const board = JSON.stringify(guideTranslations[locale]['perler-bead-pegboards']);
            for (const fact of ['29 × 29', '58 × 29', '50 mm', '145 mm', '140 mm', 'SVG']) expect(board).toContain(fact);
            const conversion = JSON.stringify(guideTranslations[locale]['perler-to-hama-artkal']);
            for (const fact of ['192', '16 × 16', '29 × 29', 'Hama Midi', 'PDF']) expect(conversion).toContain(fact);
            const mini = JSON.stringify(guideTranslations[locale]['mini-perler-beads']);
            for (const fact of ['16 × 16', 'Artkal C', 'Artkal S', '50 × 50']) expect(mini).toContain(fact);
            const ironing = JSON.stringify(guideTranslations[locale]['how-to-iron-perler-beads']);
            expect(ironing).toMatch(/10[–～]20/);
            expect(ironing).toContain('Mini');
        }
    });
});

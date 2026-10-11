import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { patterns } from './catalog';
import { getLibraryProject } from './project-links';
import slugs from './route-slugs.json';
import { getLocalizedPatternName, getLocalizedSubjectName, getLocalizedPatternIntro, localizePatternNote } from './localized-content';
import { getLocalizedPatternPdf } from './localized-download';
import { getLocaleDestination } from '../i18n/routes';
import { loadLibraryEditorProject } from '../editor/library-project';
import { decodeEditorPatternDraft, parseEditorProject } from '../editor/draft';

const locales = ['de', 'fr', 'ja'] as const;
describe('full localized pattern coverage', () => {
    it('covers every real pattern exactly once in the lightweight language route map', () => {
        expect(slugs).toEqual(patterns.map(pattern => pattern.slug));
        expect(new Set(slugs).size).toBe(patterns.length);
    });
    it('preserves each actual pattern when switching among all four languages', () => {
        for (const pattern of patterns) {
            for (const source of ['en', ...locales]) {
                const path = `${source === 'en' ? '' : `/${source}`}/patterns/${pattern.slug}`;
                for (const target of ['en', ...locales] as const) {
                    expect(getLocaleDestination(path, target)).toEqual({ href: `${target === 'en' ? '' : `/${target}`}/patterns/${pattern.slug}`, isFallback: false });
                }
            }
        }
        expect(getLocaleDestination('/patterns/not-a-pattern', 'fr').isFallback).toBe(true);
        expect(getLocaleDestination('/patterns/pokemon', 'ja')).toEqual({ href: '/ja/patterns/pokemon', isFallback: false });
    });
    it('has localized names and all assembly warnings without losing bead totals or fragile coordinates', () => {
        for (const pattern of patterns) for (const locale of locales) {
            expect(getLocalizedPatternName(pattern, locale).length).toBeGreaterThan(1);
            expect(getLocalizedPatternIntro(pattern, locale)).toContain(String(pattern.beads));
            for (const note of pattern.notes) {
                const localized = localizePatternNote(note, locale);
                expect(localized).not.toBe(note);
                // Every safety-related row/column and separate-part count survives translation.
                if (note.startsWith('Thin one-bead') || note.startsWith('Leave columns')) {
                    expect(localized.match(/\d+/g)).toEqual(note.match(/\d+/g));
                }
                if (note.startsWith('This design has') || note.startsWith('The body and feet')) {
                    expect(localized.match(/\d+/g)).toEqual(note.match(/\d+/g) ?? ['3']);
                }
            }
        }
    });
    it('uses an existing native-language PDF for every catalog pattern', () => {
        const counts = { de: 0, fr: 0, ja: 0 };
        for (const pattern of patterns) for (const locale of locales) {
            const pdf = getLocalizedPatternPdf(pattern, locale);
            expect(existsSync(`public${pdf.href}`)).toBe(true);
            expect(pdf.language).toBe(locale);
            counts[locale] += 1;
        }
        expect(counts).toEqual({ de: 114, fr: 114, ja: 114 });
    });
    it('preserves all earlier localized names, introductions and complete making notes', () => {
        const previous = patterns.filter(pattern => pattern.id !== 'original-latin-cross').map(pattern => ({
            id: pattern.id,
            locales: locales.map(locale => ({
                name: getLocalizedSubjectName(pattern, locale),
                intro: getLocalizedPatternIntro(pattern, locale),
                notes: pattern.notes.map(note => localizePatternNote(note, locale)),
            })),
        }));
        expect(previous).toHaveLength(113);
        expect(createHash('sha256').update(JSON.stringify(previous)).digest('hex')).toBe('6dc329c2b7525259fa44f394b88dbae5cd821080184c9f0392d22dc1d611799f');
    });
    it('keeps the plain Latin cross and exact single-color Midi grid across native editor journeys', async () => {
        const pattern = patterns.find(pattern => pattern.id === 'original-latin-cross')!;
        const names = { de: 'Kreuz', fr: 'Croix', ja: '十字架' };
        const shape = { de: 'lateinisches (christliches) Kreuz', fr: 'croix latine (chrétienne)', ja: 'ラテン十字（キリスト教の十字架）' };
        const contents = readFileSync(`public${pattern.assets.project}`, 'utf8');
        const source = parseEditorProject(contents)!;
        const sourcePixels = decodeEditorPatternDraft(source.editedPattern)!;
        expect(pattern.notes).toHaveLength(6);
        for (const locale of locales) {
            expect(getLocalizedSubjectName(pattern, locale)).toBe(names[locale]);
            const intro = getLocalizedPatternIntro(pattern, locale);
            for (const fact of [shape[locale], '87', 'Brown', '13', '19', '29']) expect(intro).toContain(fact);
            expect(getLibraryProject(pattern.id, locale)).toEqual({ id: pattern.id, title: names[locale], projectUrl: pattern.assets.project });
            expect(getLocaleDestination('/patterns/cross', locale)).toEqual({ href: `/${locale}/patterns/cross`, isFallback: false });
            for (const note of pattern.notes) {
                const localized = localizePatternNote(note, locale);
                expect(localized).not.toBe(note);
                if (/80-19012|13 × 19|50 mm/.test(note)) expect(localized.match(/\d+/g)).toEqual(note.match(/\d+/g));
            }
            const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(contents));
            const restored = await loadLibraryEditorProject(pattern.id, new AbortController().signal, fetchProject);
            expect(fetchProject).toHaveBeenCalledWith(pattern.assets.project, expect.objectContaining({ credentials: 'omit', redirect: 'error' }));
            expect(restored.selectedPaletteIds).toEqual(['perler']);
            expect([restored.boardId, restored.boardWidth, restored.boardHeight]).toEqual(['midi', 1, 1]);
            expect(decodeEditorPatternDraft(restored.editedPattern)).toEqual(sourcePixels);
            expect(restored.activePalettes.flatMap(palette => palette.entries).map(color => [color.ref, color.name, color.symbol])).toEqual([
                ['80-19012', 'Brown', 'B'],
            ]);
        }
    });
    it('keeps the independently drawn ordinary black cat and frozen Midi pixels across native editor journeys', async () => {
        const pattern = patterns.find(pattern => pattern.id === 'original-black-cat')!;
        expect(pattern).toBeDefined();
        const names = { de: 'Schwarze Katze', fr: 'Chat noir', ja: '黒猫' };
        const contents = readFileSync(`public${pattern.assets.project}`, 'utf8');
        const source = parseEditorProject(contents)!;
        const sourcePixels = decodeEditorPatternDraft(source.editedPattern)!;
        for (const locale of locales) {
            expect(getLocalizedSubjectName(pattern, locale)).toBe(names[locale]);
            expect(getLocalizedPatternName(pattern, locale)).toBe(names[locale]);
            const intro = getLocalizedPatternIntro(pattern, locale);
            for (const count of ['181', '177', '4', '16', '29']) expect(intro).toContain(count);
            expect(intro).not.toMatch(/Jiji|Luna|Ghibli|Sailor Moon/i);
            for (const note of pattern.notes) expect(localizePatternNote(note, locale)).not.toBe(note);
            const localizedProject = getLibraryProject(pattern.id, locale)!;
            expect(localizedProject).toEqual({ id: pattern.id, title: names[locale], projectUrl: pattern.assets.project });
            expect(getLocaleDestination('/patterns/black-cat', locale)).toEqual({ href: `/${locale}/patterns/black-cat`, isFallback: false });
            const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(contents));
            const restored = await loadLibraryEditorProject(pattern.id, new AbortController().signal, fetchProject);
            expect(fetchProject).toHaveBeenCalledWith(pattern.assets.project, expect.objectContaining({ credentials: 'omit', redirect: 'error' }));
            expect(restored.selectedPaletteIds).toEqual(['perler']);
            expect([restored.boardId, restored.boardWidth, restored.boardHeight]).toEqual(['midi', 1, 1]);
            expect(decodeEditorPatternDraft(restored.editedPattern)).toEqual(sourcePixels);
            expect(restored.activePalettes.flatMap(palette => palette.entries).map(color => [color.ref, color.name, color.symbol])).toEqual([
                ['80-19018', 'Black', 'B'], ['80-19003', 'Yellow', 'Y'],
            ]);
        }
    });
    it('keeps the ornament identity, project and opening across native editor journeys', async () => {
        const pattern = patterns.find(pattern => pattern.id === 'original-christmas-bauble-ornament')!;
        expect(pattern).toBeDefined();
        const contents = readFileSync(`public${pattern.assets.project}`, 'utf8');
        const source = parseEditorProject(contents)!;
        const sourcePixels = decodeEditorPatternDraft(source.editedPattern)!;
        const names = { de: 'Weihnachtskugel mit Aufhängeöffnung', fr: 'Boule de Noël à suspendre', ja: '吊り下げ穴付きクリスマスオーナメント' };
        const opening = { de: 'Öffnung', fr: 'ouverture', ja: '穴' };
        for (const locale of locales) {
            expect(getLocalizedPatternName(pattern, locale)).toBe(names[locale]);
            expect(getLocalizedPatternIntro(pattern, locale)).toContain(opening[locale]);
            expect(getLibraryProject(pattern.id, locale)).toMatchObject({ title: names[locale], projectUrl: pattern.assets.project });
            const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(contents));
            const restored = await loadLibraryEditorProject(pattern.id, new AbortController().signal, fetchProject);
            expect(fetchProject).toHaveBeenCalledWith(pattern.assets.project, expect.objectContaining({ credentials: 'omit', redirect: 'error' }));
            expect(restored.selectedPaletteIds).toEqual(['perler']);
            expect([restored.boardId, restored.boardWidth, restored.boardHeight]).toEqual(['midi', 1, 1]);
            expect(decodeEditorPatternDraft(restored.editedPattern)).toEqual(sourcePixels);
        }
    });
    it('keeps the coaster subject and project across all native editor journeys', () => {
        const pattern = patterns.find(pattern => pattern.id === 'original-retro-diamond-coaster')!;
        expect(pattern).toBeDefined();
        const names = { de: 'Retro-Untersetzer mit Rautenmuster', fr: 'Dessous de verre rétro à losanges', ja: 'レトロなひし形コースター' };
        for (const locale of locales) {
            expect(getLocalizedPatternName(pattern, locale)).toBe(names[locale]);
            expect(getLocalizedPatternIntro(pattern, locale)).toContain('517');
            expect(getLibraryProject(pattern.id, locale)).toMatchObject({ title: names[locale], projectUrl: pattern.assets.project });
        }
    });
    it('names the Santa Hat consistently across native details and editor imports', () => {
        const pattern = patterns.find(pattern => pattern.id === 'original-santa-hat')!;
        expect(pattern).toBeDefined();
        const names = { de: 'Weihnachtsmütze', fr: 'Bonnet de Noël', ja: 'サンタの帽子' };
        for (const locale of locales) {
            expect(getLocalizedPatternName(pattern, locale)).toBe(names[locale]);
            expect(getLibraryProject(pattern.id, locale)).toMatchObject({ title: names[locale], projectUrl: pattern.assets.project });
        }
    });
    it('keeps both winter subjects and their requested projects across native editor imports', () => {
        const subjects = {
            'original-christmas-stocking': { de: 'Weihnachtsstrumpf', fr: 'Chaussette de Noël', ja: 'クリスマスの靴下' },
            'original-snowflake': { de: 'Schneeflocke', fr: 'Flocon de neige', ja: '雪の結晶' },
        };
        for (const [id, names] of Object.entries(subjects)) {
            const pattern = patterns.find(pattern => pattern.id === id)!;
            expect(pattern).toBeDefined();
            for (const locale of locales) {
                expect(getLocalizedPatternName(pattern, locale)).toBe(names[locale]);
                expect(getLibraryProject(id, locale)).toMatchObject({ id, title: names[locale], projectUrl: pattern.assets.project });
            }
        }
        const snowflake = patterns.find(pattern => pattern.id === 'original-snowflake')!;
        expect(snowflake.notes[0]).toContain('one-bead');
        expect(snowflake.notes[0]).not.toContain('row ');
    });
    it('shows localized import names without changing the requested project or brand', () => {
        expect(getLibraryProject('pokemon-gengar-gen5', 'ja')).toMatchObject({ id: 'pokemon-gengar-gen5', title: 'ゲンガー', projectUrl: '/patterns/pokemon-gengar-gen5/pattern.bead-pattern.json' });
        expect(getLibraryProject('original-friendly-ghost-hama', 'fr')).toMatchObject({ id: 'original-friendly-ghost-hama', title: 'Fantôme — Hama Midi' });
        expect(getLibraryProject('pokemon-gengar-gen5')).toMatchObject({ title: 'Gengar' });
    });
    it('uses established Pokémon names for the same species', () => {
        const gengar = patterns.find(pattern => pattern.title === 'Gengar')!;
        expect(getLocalizedPatternName(gengar, 'fr')).toContain('Ectoplasma');
        expect(getLocalizedPatternName(gengar, 'ja')).toContain('ゲンガー');
        expect(getLocalizedPatternName(gengar, 'de')).toContain('Gengar');
    });
    it('names the actual Creeper face subject across the three localized journeys', () => {
        const pattern = { id: 'minecraft-creeper-face-v1', title: 'Creeper Face' };
        expect(getLocalizedSubjectName(pattern, 'de')).toBe('Creeper-Gesicht');
        expect(getLocalizedSubjectName(pattern, 'fr')).toBe('Visage du Creeper');
        expect(getLocalizedSubjectName(pattern, 'ja')).toBe('クリーパーの顔');
    });
});

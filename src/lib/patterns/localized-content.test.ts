import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { patterns } from './catalog';
import { getLibraryProject } from './project-links';
import slugs from './route-slugs.json';
import { getLocalizedPatternName, getLocalizedPatternIntro, localizePatternNote } from './localized-content';
import { getLocalizedPatternPdf } from './localized-download';
import { getLocaleDestination } from '../i18n/routes';

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
                if (note.startsWith('Thin one-bead')) {
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
        expect(counts).toEqual({ de: 107, fr: 107, ja: 107 });
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
});

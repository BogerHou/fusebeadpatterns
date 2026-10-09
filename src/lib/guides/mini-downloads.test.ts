import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getGuideBySlug } from '../../app/(english)/guides/guide-data';
import { getLocalizedGuide, localizeGuideLink } from './localized';
import { miniGhostAssetRoot, miniGhostProjectId } from '../patterns/mini';

const locales = ['de', 'fr', 'ja'] as const;
const source = getGuideBySlug('mini-perler-beads')!;
const miniSection = source.sections[0];

describe('Mini guide native downloads', () => {
    it('keeps the six small Midi examples and adds the same original Mini Ghost in each guide', () => {
        expect(source.sections[1].patternIds).toEqual(['smb-super-star', 'smb-small-mario', 'kirby-adventure-normal', 'sdv-junimo', 'minecraft-diamond-sword-1-21-1', 'sdv-blue-chicken']);
        expect(source.sections[1].body.join(' ')).toContain('Perler Midi');
        for (const guide of [source, ...locales.map(locale => getLocalizedGuide('mini-perler-beads', locale)!)]) {
            expect(guide.sections[1].patternIds).toEqual(source.sections[1].patternIds);
            const addition = guide.sections[0];
            expect(addition.figureFirst).toBe(true);
            expect(addition.body).toHaveLength(2);
            expect(guide.sections.slice(1).some(section => section.figureFirst)).toBe(false);
            expect(addition.body.join(' ')).toContain('311');
            expect(addition.body.join(' ')).toContain('57 × 57');
            expect(addition.figure).toMatchObject({ src: `${miniGhostAssetRoot}/preview.png`, width: 580, height: 580 });
            expect(addition.links).toHaveLength(6);
        }
        const words = miniSection.body.join(' ').split(/\s+/).length;
        expect(words).toBeGreaterThanOrEqual(90);
        expect(words).toBeLessThanOrEqual(130);
    });

    it('localizes only the exact new PDFs and editor alias, retaining the shared PNG and project', () => {
        for (const locale of locales) {
            const links = miniSection.links!.map(link => localizeGuideLink(link, locale));
            expect(links.map(link => link.href)).toEqual([
                `${miniGhostAssetRoot}/${locale}/pattern-a4.pdf`, `${miniGhostAssetRoot}/${locale}/pattern-letter.pdf`,
                `${miniGhostAssetRoot}/grid.png`, `${miniGhostAssetRoot}/pattern.bead-pattern.json`,
                `/${locale}/editor?pattern=${miniGhostProjectId}`,
                'https://perler.com/blogs/projects/football-silhouettes',
            ]);
            expect(links.map(link => link.download)).toEqual([true, true, true, true, undefined, undefined]);
            for (const link of links) expect(link.label).not.toMatch(/Englisch|anglais|英語/);
        }
        expect(() => localizeGuideLink({ href: `${miniGhostAssetRoot}/not-a-real-file.pdf`, label: 'unknown' }, 'fr')).toThrow('Missing guide link translation');
        expect(() => localizeGuideLink({ href: `/editor?pattern=${miniGhostProjectId}-unknown`, label: 'unknown' }, 'fr')).toThrow('Missing guide link translation');
    });

    it('resolves all eight actual reference PDFs and every shared download to real files', () => {
        for (const locale of ['en', ...locales] as const) {
            const guide = locale === 'en' ? source : getLocalizedGuide('mini-perler-beads', locale)!;
            for (const link of guide.sections[0].links!.filter(link => link.download)) {
                const bytes = readFileSync(`public${link.href}`);
                if (link.href.endsWith('.pdf')) {
                    expect(bytes.length).toBeGreaterThan(1000);
                    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
                    expect(bytes.toString('latin1')).toContain(`/Lang (${locale}-${{ en: 'US', de: 'DE', fr: 'FR', ja: 'JP' }[locale]})`);
                } else if (link.href.endsWith('.png')) expect(bytes.subarray(1, 4).toString()).toBe('PNG');
                else expect(JSON.parse(bytes.toString()).draft.selectedPaletteIds).toEqual(['perler_mini']);
            }
        }
    });
});

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { getGuideBySlug } from '../../app/(english)/guides/guide-data';
import { getLocalizedGuide, localizeGuideLink } from './localized';
import { miniGhostAssetRoot, miniGhostProjectId } from '../patterns/mini';
import { MINI_GRID_PIXEL_HEIGHT, MINI_RETAINED_HASHES } from '../../../scripts/build-localized-mini-ghost-charts.mjs';

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

    it('uses native PDFs and counting PNGs while retaining the shared original project and preview', () => {
        for (const locale of locales) {
            const links = miniSection.links!.map(link => localizeGuideLink(link, locale));
            expect(links.map(link => link.href)).toEqual([
                `${miniGhostAssetRoot}/${locale}/pattern-a4.pdf`, `${miniGhostAssetRoot}/${locale}/pattern-letter.pdf`,
                `${miniGhostAssetRoot}/${locale}/grid.png`, `${miniGhostAssetRoot}/pattern.bead-pattern.json`,
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

    it('preserves the original English PNG, project, pixels, preview and all eight PDFs byte for byte', () => {
        for (const [name, hash] of Object.entries(MINI_RETAINED_HASHES)) {
            expect(createHash('sha256').update(readFileSync(`public${miniGhostAssetRoot}/${name}`)).digest('hex')).toBe(hash);
        }
    });

    it.each(locales)('%s counting PNG retains every original grid, symbol and coordinate pixel', async locale => {
        const old = await sharp(`public${miniGhostAssetRoot}/grid.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const native = await sharp(`public${miniGhostAssetRoot}/${locale}/grid.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        expect(old.info.width).toBe(788);
        expect(native.info.width).toBe(old.info.width);
        expect(native.info.height).toBeGreaterThan(MINI_GRID_PIXEL_HEIGHT);
        const gridBytes = old.info.width * MINI_GRID_PIXEL_HEIGHT * 4;
        expect(native.data.subarray(0, gridBytes).equals(old.data.subarray(0, gridBytes))).toBe(true);
        // The native labels must replace the old English footer, rather than
        // just append more text below it. The retained region ends below row 29.
        expect(MINI_GRID_PIXEL_HEIGHT).toBeGreaterThan(46 + 29 * 24);
        expect(MINI_GRID_PIXEL_HEIGHT).toBeLessThan(789 - 19);
        const source = await sharp('public/patterns/original-friendly-ghost/pixels.png').ensureAlpha().raw().toBuffer();
        const counts = new Map<string, number>();
        for (let row = 0; row < 29; row++) for (let column = 0; column < 29; column++) {
            const offset = (row * 29 + column) * 4;
            const rgba = source.subarray(offset, offset + 4);
            const gridOffset = ((46 + row * 24 + 5) * native.info.width + 46 + column * 24 + 5) * 4;
            const expected = rgba[3] ? rgba : Buffer.from([255, 255, 255, 255]);
            expect(native.data.subarray(gridOffset, gridOffset + 4).equals(expected)).toBe(true);
            if (rgba[3]) {
                const hex = rgba.subarray(0, 3).toString('hex');
                counts.set(hex, (counts.get(hex) ?? 0) + 1);
            }
        }
        expect(counts).toEqual(new Map([['eaefee', 293], ['323234', 18]]));
    });
});

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { patterns, getPatternById, getPatternBySlug, getPatternHref } from './catalog';
import { getLibraryProject } from './project-links';
import { getLocalizedPatternIntro, getLocalizedSubjectName, localizePatternNote } from './localized-content';
import { localizedPatternMetadataDescription, patternMetadataDescription } from './metadata-descriptions';
import { getLocaleDestination } from '../i18n/routes';
import { patternLanguageAlternates } from '../i18n/metadata';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { applyFreshPaletteDefaults } from '../editor/palette-defaults';
import { remapPatternPalette } from '../editor/pattern-palette';

const id = 'original-cherries';
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const pattern = getPatternById(id)!;
const source = () => parseEditorProject(readFileSync(`public${pattern.assets.project}`, 'utf8'))!;

describe('reviewed original pair of cherries', () => {
    it('appends only this fruit while preserving the complete ordered120 earlier catalog objects', () => {
        const previous = patterns.filter(item => item.id !== id);
        expect(previous).toHaveLength(120);
        expect(sha(JSON.stringify(previous))).toBe('1b823b1cd3201d92cfdbba905cea2a0a9e13f720e8f2c135c0dfbf76cf86cc34');
        expect(patterns.at(-1)).toBe(pattern);
        expect(getPatternBySlug('cherry')).toBe(pattern);
        expect(pattern).toMatchObject({ slug: 'cherry', title: 'Cherries', source: null, collectionId: null,
            beads: 284, colorCount: 5, gridWidth: 29, gridHeight: 29, motifWidth: 24, motifHeight: 23, updatedAt: '2026-10-16' });
    });

    it('keeps the approved native RGBA, two-fruit geometry, real CSV codes and complete editable project', async () => {
        const native = await sharp(`public${pattern.assets.pixels}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const pixels = native.data;
        expect([native.info.width, native.info.height]).toEqual([29, 29]);
        expect(sha(pixels)).toBe('e4b712f0bc76a051339c798594bee334fd519badc8afbba738c7712e08ae649c');
        const draft = source();
        expect(draft).toMatchObject({ sourceMode: 'blank', imageSrc: null, selectedPaletteIds: ['perler'], boardId: 'midi',
            boardWidth: 1, boardHeight: 1, pdfScaleMode: 'midi-5mm', editedPattern: { width: 29, height: 29 } });
        expect(Buffer.from(decodeEditorPatternDraft(draft.editedPattern)!)).toEqual(pixels);
        expect(parseEditorProject(serializeEditorProject(draft))).toEqual(draft);
        const expected = [
            ['R', '80-19005', 'Red', '#b0353c', 133], ['D', '80-15961', 'Cherry', '#9d2b3a', 41],
            ['H', '80-19059', 'Hot Coral', '#dd595b', 8], ['G', '80-19010', 'Dark Green', '#007b4e', 73],
            ['L', '80-19080', 'Green', '#4dab64', 29],
        ] as const;
        const option = getPaletteOption('perler')!;
        const csv = parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option);
        for (const [symbol, ref, name, hex, count] of expected) {
            expect(pattern.palette.find(color => color.ref === ref)).toEqual({ symbol, ref, name, hex, count });
            const actual = csv.entries.find(color => color.ref === ref)!;
            expect(actual.name).toBe(name);
            expect(`#${Buffer.from([actual.color.r, actual.color.g, actual.color.b]).toString('hex')}`).toBe(hex);
        }
        const byHex = new Map(pattern.palette.map(color => [color.hex.slice(1), color]));
        const counts = new Map<string, number>(), positions: number[] = [], rows: string[] = [];
        for (let y = 0; y < 29; y++) {
            let row = '';
            for (let x = 0; x < 29; x++) {
                const cell = pixels.subarray((y * 29 + x) * 4, (y * 29 + x + 1) * 4);
                if (!cell[3]) { expect([...cell]).toEqual([0, 0, 0, 0]); row += '.'; continue; }
                expect(cell[3]).toBe(255);
                const color = byHex.get(cell.subarray(0, 3).toString('hex'));
                expect(color).toBeDefined(); row += color!.symbol;
                counts.set(color!.ref, (counts.get(color!.ref) ?? 0) + 1); positions.push(y * 29 + x);
            }
            rows.push(row);
        }
        expect(sha(rows.join('\n'))).toBe('0eef52185588f38cd9ba99380704f83a33c5eba96907b8420179ddf5e0d3a3ce');
        expect(positions).toHaveLength(284);
        expect([Math.min(...positions.map(i => i % 29)), Math.max(...positions.map(i => i % 29)),
            Math.min(...positions.map(i => Math.floor(i / 29))), Math.max(...positions.map(i => Math.floor(i / 29)))]).toEqual([3, 26, 3, 25]);
        for (const color of pattern.palette) expect(counts.get(color.ref)).toBe(color.count);
    });

    it.each(['perler', 'hama', 'artkal_s'])('%s remaps all284 occupied cells and preserves every transparent position', async paletteId => {
        const draft = source(), pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        const before = Buffer.from(pixels), option = getPaletteOption(paletteId)!;
        const palette = applyFreshPaletteDefaults(paletteId, parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option));
        const output = await remapPatternPalette(pixels, 29, 29, [palette], draft.matchingId, { sourcePalettes: draft.activePalettes });
        const enabled = new Set(palette.entries.filter(entry => entry.enabled && entry.color.a === 255)
            .map(entry => `${entry.color.r},${entry.color.g},${entry.color.b}`));
        let occupied = 0;
        expect(output.length).toBe(before.length);
        for (let offset = 0; offset < output.length; offset += 4) {
            expect(output[offset + 3]).toBe(pixels[offset + 3]);
            if (!pixels[offset + 3]) expect([...output.subarray(offset, offset + 4)]).toEqual([0, 0, 0, 0]);
            else { occupied++; expect(enabled.has([...output.subarray(offset, offset + 3)].join(','))).toBe(true); }
        }
        expect(occupied).toBe(284); expect(Buffer.from(pixels)).toEqual(before);
    });

    it('uses the actual four canonical language routes, localized editor titles and concise natural summaries', () => {
        expect(getPatternHref(pattern)).toBe('/patterns/cherry');
        expect(patternLanguageAlternates(pattern.slug)).toEqual({
            en: 'https://fusebeadpatterns.art/patterns/cherry', de: 'https://fusebeadpatterns.art/de/patterns/cherry',
            fr: 'https://fusebeadpatterns.art/fr/patterns/cherry', ja: 'https://fusebeadpatterns.art/ja/patterns/cherry',
            'x-default': 'https://fusebeadpatterns.art/patterns/cherry',
        });
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
            const href = `${locale === 'en' ? '' : `/${locale}`}/patterns/cherry`;
            expect(getLocaleDestination('/patterns/cherry', locale)).toEqual({ href, isFallback: false });
            const project = getLibraryProject(id, locale)!;
            expect(project.projectUrl).toBe(pattern.assets.project);
            const expectedName = { en: 'Cherries', de: 'Kirschen', fr: 'Cerises', ja: 'さくらんぼ' }[locale];
            expect(project.title).toBe(expectedName);
            const summary = locale === 'en' ? patternMetadataDescription(pattern) : localizedPatternMetadataDescription(pattern, locale);
            expect(Array.from(summary).length).toBeLessThanOrEqual(160);
            expect(summary).not.toMatch(/hot|trending|popular|source.?pack|proof|workflow|候補|検証済み/i);
            if (locale === 'en') continue;
            expect(getLocalizedSubjectName(pattern, locale)).toBe(expectedName);
            expect(getLocalizedPatternIntro(pattern, locale)).toContain(expectedName);
            expect(getLocalizedPatternIntro(pattern, locale)).toContain('284');
            for (const note of pattern.notes) expect(localizePatternNote(note, locale)).not.toBe(note);
        }
        expect(pattern.notes.some(note => note.includes('Physical assembly and ironing have not been tested'))).toBe(true);
        expect(pattern.notes.some(note => note.includes('not an actual-size placement template'))).toBe(true);
    });
});

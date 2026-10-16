import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { patterns, getPatternById } from './catalog';
import { getLibraryProject } from './project-links';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { applyFreshPaletteDefaults } from '../editor/palette-defaults';
import { remapPatternPalette } from '../editor/pattern-palette';
import { getLocaleDestination } from '../i18n/routes';
import { getLocalizedSubjectName, localizePatternNote } from './localized-content';

const id = 'original-strawberry';
const sha = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const pattern = getPatternById(id)!;
const source = () => parseEditorProject(readFileSync(`public${pattern.assets.project}`, 'utf8'))!;

describe('reviewed original strawberry', () => {
    it('adds only the new original and preserves all 118 complete earlier catalog objects', () => {
        const previous = patterns.filter(item => item.id !== id && item.id !== 'original-celestial-stained-glass-window');
        expect(previous).toHaveLength(118);
        expect(sha(JSON.stringify(previous))).toBe('c5d6e3ae045d9fea91dc7b668a707b6def0ae6e2b684c98fcde25fc9beec4c95');
        expect(pattern).toMatchObject({ slug: 'strawberry', source: null, collectionId: null, beads: 296, colorCount: 3, gridWidth: 29, gridHeight: 29, motifWidth: 19, motifHeight: 22, updatedAt: '2026-10-14' });
    });

    it('retains independently reviewed pixels, material counts and the complete editable single-board project', async () => {
        const pixels = await sharp(`public${pattern.assets.pixels}`).ensureAlpha().raw().toBuffer();
        expect(pixels.length).toBe(29 * 29 * 4);
        expect(sha(pixels)).toBe('7e89d124cd4fa2119a4799834f38de423248ef234b265680ad7ff1c44485f914');
        const draft = source();
        expect(draft).toMatchObject({ sourceMode: 'blank', imageSrc: null, selectedPaletteIds: ['perler'], boardId: 'midi', boardWidth: 1, boardHeight: 1, pdfScaleMode: 'midi-5mm', editedPattern: { width: 29, height: 29 } });
        expect(Buffer.from(decodeEditorPatternDraft(draft.editedPattern)!)).toEqual(pixels);
        expect(parseEditorProject(serializeEditorProject(draft))).toEqual(draft);
        const expected = new Map([['b0353c', { symbol: 'R', ref: '80-19005', count: 216 }], ['007b4e', { symbol: 'G', ref: '80-19010', count: 68 }], ['e9e290', { symbol: 'Y', ref: '80-19056', count: 12 }]]);
        const counts = new Map<string, number>();
        const rows: string[] = [];
        const occupied: Array<[number, number]> = [];
        for (let y = 0; y < 29; y++) {
            let row = '';
            for (let x = 0; x < 29; x++) {
                const cell = pixels.subarray((y * 29 + x) * 4, (y * 29 + x + 1) * 4);
                if (!cell[3]) { expect([...cell]).toEqual([0, 0, 0, 0]); row += '.'; continue; }
                expect(cell[3]).toBe(255);
                const key = cell.subarray(0, 3).toString('hex');
                expect(expected.has(key)).toBe(true);
                row += expected.get(key)!.symbol;
                counts.set(key, (counts.get(key) ?? 0) + 1);
                occupied.push([x, y]);
            }
            rows.push(row);
        }
        expect(sha(rows.join('\n'))).toBe('60aad75bbeafeb80ee5e840caa1bed905e506cd4da9c823b32ad5d02fc23514f');
        expect(occupied.length).toBe(296);
        expect([Math.min(...occupied.map(([x]) => x)), Math.max(...occupied.map(([x]) => x)), Math.min(...occupied.map(([, y]) => y)), Math.max(...occupied.map(([, y]) => y))]).toEqual([5, 23, 4, 25]);
        const option = getPaletteOption('perler')!;
        const realPalette = parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option);
        for (const [hex, color] of expected) {
            expect(counts.get(hex)).toBe(color.count);
            expect(pattern.palette.find(entry => entry.ref === color.ref)).toMatchObject({ ...color, hex: `#${hex}` });
            const real = realPalette.entries.find(entry => entry.ref === color.ref)!;
            expect(Buffer.from([real.color.r, real.color.g, real.color.b]).toString('hex')).toBe(hex);
        }
    });

    it.each(['perler', 'hama', 'artkal_s'])('%s remaps the actual published project without changing any occupied or empty cell', async paletteId => {
        const draft = source();
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        const before = Buffer.from(pixels);
        const option = getPaletteOption(paletteId)!;
        const palette = applyFreshPaletteDefaults(paletteId, parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option));
        const output = await remapPatternPalette(pixels, 29, 29, [palette], draft.matchingId, { sourcePalettes: draft.activePalettes });
        const enabled = new Set(palette.entries.filter(entry => entry.enabled && entry.color.a === 255).map(entry => `${entry.color.r},${entry.color.g},${entry.color.b}`));
        let beads = 0;
        for (let offset = 0; offset < output.length; offset += 4) {
            expect(output[offset + 3]).toBe(pixels[offset + 3]);
            if (!pixels[offset + 3]) expect([...output.subarray(offset, offset + 4)]).toEqual([0, 0, 0, 0]);
            else { beads++; expect(enabled.has([...output.subarray(offset, offset + 3)].join(','))).toBe(true); }
        }
        expect(beads).toBe(296);
        expect(Buffer.from(pixels)).toEqual(before);
    });

    it('keeps a native editor journey and honest physical-test notes in all four languages', () => {
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
            expect(getLibraryProject(id, locale)?.projectUrl).toBe(pattern.assets.project);
            expect(getLocaleDestination('/patterns/strawberry', locale)).toEqual({ href: `${locale === 'en' ? '' : `/${locale}`}/patterns/strawberry`, isFallback: false });
            if (locale === 'en') continue;
            expect(getLocalizedSubjectName(pattern, locale)).toBe({ de: 'Erdbeere', fr: 'Fraise', ja: 'いちご' }[locale]);
            for (const note of pattern.notes) expect(localizePatternNote(note, locale)).not.toBe(note);
        }
        expect(pattern.notes.some(note => note.includes('not been physically assembled or iron-tested'))).toBe(true);
    });
});

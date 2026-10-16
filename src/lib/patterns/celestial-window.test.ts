import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { patterns, getPatternById } from './catalog';
import { getLibraryProject } from './project-links';
import { isMultiboardPattern } from './multiboard';
import { getLocalizedPatternGrid, getLocalizedPatternPdf, getLocalizedPatternLetterPdf } from './localized-download';
import { getLocalizedSubjectName, localizePatternNote } from './localized-content';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { applyFreshPaletteDefaults } from '../editor/palette-defaults';
import { remapPatternPalette } from '../editor/pattern-palette';
import { getLocaleDestination } from '../i18n/routes';

const id = 'original-celestial-stained-glass-window';
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const pattern = getPatternById(id)!;
const source = () => parseEditorProject(readFileSync(`public${pattern.assets.project}`, 'utf8'))!;

describe('reviewed original celestial stained-glass window', () => {
    it('appends one original while preserving all 119 complete previous catalog objects', () => {
        const previous = patterns.filter(item => item.id !== id);
        expect(previous).toHaveLength(119);
        expect(sha(JSON.stringify(previous))).toBe('99247f787d575d45b5f15359191412679089ce353a886ce87407c668d8435830');
        expect(patterns.at(-1)).toBe(pattern);
        expect(pattern).toMatchObject({
            slug: 'celestial-stained-glass-window', source: null, collectionId: null,
            beads: 2234, colorCount: 8, gridWidth: 58, gridHeight: 58,
            motifWidth: 48, motifHeight: 52, updatedAt: '2026-10-16',
        });
        expect(isMultiboardPattern(id)).toBe(true);
        expect(isMultiboardPattern(`${id}-unreviewed`)).toBe(false);
    });

    it('keeps the independently reviewed native pixels, CSV colors, empty cells and editable four-board project', async () => {
        const pixels = await sharp(`public${pattern.assets.pixels}`).ensureAlpha().raw().toBuffer();
        expect(pixels.length).toBe(58 * 58 * 4);
        expect(sha(pixels)).toBe('3478cd83efb8706264f40bf69065cb9428f4d9209ea19d736e19faa81451614e');
        const draft = source();
        expect(draft).toMatchObject({ sourceMode: 'blank', imageSrc: null, selectedPaletteIds: ['perler'], boardId: 'midi', boardWidth: 2, boardHeight: 2, pdfScaleMode: 'midi-5mm', editedPattern: { width: 58, height: 58 } });
        expect(Buffer.from(decodeEditorPatternDraft(draft.editedPattern)!)).toEqual(pixels);
        expect(parseEditorProject(serializeEditorProject(draft))).toEqual(draft);
        const option = getPaletteOption('perler')!;
        const csv = parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option);
        for (const entry of pattern.palette) {
            const color = csv.entries.find(item => item.ref === entry.ref)!;
            expect(color).toBeDefined();
            expect(`#${Buffer.from([color.color.r, color.color.g, color.color.b]).toString('hex')}`).toBe(entry.hex);
        }
        const byRgb = new Map(pattern.palette.map(entry => [entry.hex.slice(1), entry]));
        const counts = new Map<string, number>();
        const rows: string[] = [];
        for (let y = 0; y < 58; y++) {
            let row = '';
            for (let x = 0; x < 58; x++) {
                const cell = pixels.subarray((y * 58 + x) * 4, (y * 58 + x + 1) * 4);
                if (!cell[3]) { expect([...cell]).toEqual([0, 0, 0, 0]); row += '.'; continue; }
                expect(cell[3]).toBe(255);
                const color = byRgb.get(cell.subarray(0, 3).toString('hex'));
                expect(color).toBeDefined();
                row += color!.symbol;
                counts.set(color!.ref, (counts.get(color!.ref) ?? 0) + 1);
            }
            rows.push(row);
        }
        expect(sha(rows.join('\n'))).toBe('e7f90188a1024d0a62efa8ae07ff427d4b8ace2ae29bf503c64fe47b0a539239');
        for (const color of pattern.palette) expect(counts.get(color.ref)).toBe(color.count);
        const origins = [[0, 0], [29, 0], [0, 29], [29, 29]];
        const boardCounts = origins.map(([ox, oy]) => {
            let total = 0;
            for (let y = oy; y < oy + 29; y++) for (let x = ox; x < ox + 29; x++) if (pixels[(y * 58 + x) * 4 + 3]) total++;
            return total;
        });
        expect(boardCounts).toEqual([493, 493, 624, 624]);
    });

    it.each(['perler', 'hama', 'artkal_s'])('%s remaps all four boards without losing the arch, crescent or empty cells', async paletteId => {
        const draft = source();
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        const original = Buffer.from(pixels);
        const option = getPaletteOption(paletteId)!;
        const palette = applyFreshPaletteDefaults(paletteId, parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option));
        const output = await remapPatternPalette(pixels, 58, 58, [palette], draft.matchingId, { sourcePalettes: draft.activePalettes });
        const enabled = new Set(palette.entries.filter(entry => entry.enabled && entry.color.a === 255).map(entry => `${entry.color.r},${entry.color.g},${entry.color.b}`));
        let total = 0;
        for (let offset = 0; offset < output.length; offset += 4) {
            expect(output[offset + 3]).toBe(pixels[offset + 3]);
            if (!pixels[offset + 3]) expect([...output.subarray(offset, offset + 4)]).toEqual([0, 0, 0, 0]);
            else { total++; expect(enabled.has([...output.subarray(offset, offset + 3)].join(','))).toBe(true); }
        }
        expect(total).toBe(2234);
        expect(Buffer.from(pixels)).toEqual(original);
    });

    it('offers actual A4 and Letter five-page files and native-language editor journeys', async () => {
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
            const prefix = locale === 'en' ? '/patterns' : `/patterns-${locale}`;
            const a4 = locale === 'en' ? pattern.assets.pdf : getLocalizedPatternPdf(pattern, locale).href;
            const letter = locale === 'en' ? pattern.assets.pdfLetter! : getLocalizedPatternLetterPdf(pattern, locale)!.href;
            expect(a4).toBe(`${prefix}/${id}/pattern.pdf`);
            expect(letter).toBe(`${prefix}/${id}/pattern-letter.pdf`);
            for (const href of [a4, letter]) {
                const bytes = readFileSync(`public${href}`).toString('latin1');
                expect(bytes.startsWith('%PDF-')).toBe(true);
                expect(bytes.match(/\/Type\s*\/Page\b/g)).toHaveLength(5);
            }
            expect(readFileSync(`public${letter}`).toString('latin1')).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+612\s+792\s*\]/);
            expect(getLibraryProject(id, locale)?.projectUrl).toBe(pattern.assets.project);
            const href = `${locale === 'en' ? '' : `/${locale}`}/patterns/${pattern.slug}`;
            expect(getLocaleDestination(`/patterns/${pattern.slug}`, locale)).toEqual({ href, isFallback: false });
            if (locale === 'en') continue;
            expect(getLocalizedSubjectName(pattern, locale)).toBe({ de: 'Glasfenster mit Mond und Sternen', fr: 'Vitrail lune et étoiles', ja: '月と星のステンドグラス窓' }[locale]);
            for (const note of pattern.notes) expect(localizePatternNote(note, locale)).not.toBe(note);
            const chart = getLocalizedPatternGrid(pattern, locale);
            expect(chart).toMatchObject({ width: 1484, height: 2003, language: locale });
            const metadata = await sharp(`public${chart.href}`).metadata();
            expect([metadata.width, metadata.height]).toEqual([1484, 2003]);
        }
        expect(pattern.notes.some(note => note.includes('cross-board join strength have not been tested'))).toBe(true);
    });
});

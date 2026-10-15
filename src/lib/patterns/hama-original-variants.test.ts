import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import HamaOriginalDownloads, { HamaOriginalLink } from '../../components/patterns/HamaOriginalDownloads';
import { buildPatternEvent } from '../analytics';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { loadLibraryEditorProject } from '../editor/library-project';
import { patterns } from './catalog';
import { hamaPatterns } from './hama';
import { getHamaCharacterVariant, hamaCreeperId, hamaCreeperProjectId } from './hama-character-variants';
import { getHamaOriginalVariant, hamaBlackCatId, hamaBlackCatProjectId } from './hama-original-variants';
import { getLibraryProject } from './project-links';

const locales = ['en', 'de', 'fr', 'ja'] as const;
const asset = (href: string) => readFileSync(`public${href}`);
const hash = (contents: Uint8Array | Uint8ClampedArray) => createHash('sha256').update(contents).digest('hex');

describe('fixed original black cat Hama downloads', () => {
    it('allows only its exact project ID and preserves original, character and six-pattern Hama entries', async () => {
        for (const pattern of patterns) {
            expect(getLibraryProject(pattern.id)?.projectUrl).toBe(pattern.assets.project);
            expect(Boolean(getHamaOriginalVariant(pattern.id))).toBe(pattern.id === hamaBlackCatId);
        }
        expect(patterns.some(pattern => pattern.id === hamaBlackCatProjectId)).toBe(false);
        expect(hamaPatterns).toHaveLength(6);
        expect(hamaPatterns.some(pattern => pattern.id === hamaBlackCatId)).toBe(false);
        for (const pattern of hamaPatterns) expect(getLibraryProject(pattern.projectId)?.projectUrl).toBe(pattern.project);
        expect(getLibraryProject(hamaCreeperProjectId)?.projectUrl).toBe(getHamaCharacterVariant(hamaCreeperId)!.project);
        const fetchProject = vi.fn<typeof fetch>();
        for (const invalid of [
            `${hamaBlackCatProjectId}-extra`, 'original-black-cat-Hama', 'ORIGINAL-BLACK-CAT-HAMA',
            '../original-black-cat-hama', 'original-black-cat-hama?url=https://example.com',
            'original-black-cat%2Dhama', 'https://example.com/project.json', 'original-strawberry-hama',
        ]) {
            expect(getLibraryProject(invalid)).toBeUndefined();
            await expect(loadLibraryEditorProject(invalid, new AbortController().signal, fetchProject)).rejects.toThrow('not in the library');
        }
        expect(fetchProject).not.toHaveBeenCalled();
    });

    it('loads and round-trips the actual fixed project with the same 181 positions and CSV-backed symbols', async () => {
        const variant = getHamaOriginalVariant(hamaBlackCatId)!;
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(asset(variant.project).toString()));
        const controller = new AbortController();
        const draft = await loadLibraryEditorProject(hamaBlackCatProjectId, controller.signal, fetchProject);
        expect(fetchProject).toHaveBeenCalledWith(variant.project, { signal: controller.signal, credentials: 'omit', redirect: 'error' });
        expect(draft.selectedPaletteIds).toEqual(['hama']);
        expect(draft.activePalettes.map(palette => palette.name)).toEqual(['Hama Midi']);
        expect(draft.activePalettes[0].entries.map(color => color.ref).sort()).toEqual(['H03', 'H18']);
        expect([draft.boardId, draft.boardWidth, draft.boardHeight]).toEqual(['midi', 1, 1]);
        expect([draft.editedPattern?.width, draft.editedPattern?.height]).toEqual([29, 29]);
        expect([draft.sourceMode, draft.imageSrc, draft.useSymbols, draft.pdfScaleMode]).toEqual(['blank', null, true, 'midi-5mm']);
        const rgba = decodeEditorPatternDraft(draft.editedPattern)!;
        const original = patterns.find(pattern => pattern.id === hamaBlackCatId)!;
        const source = decodeEditorPatternDraft(parseEditorProject(asset(original.assets.project).toString())!.editedPattern)!;
        expect(hash(source)).toBe('fbf706e0c20bde55d98825408c5f2e1b94bc4be7a8ab298c1d8b248b99accb2d');
        expect(hash(rgba)).toBe('90a8705723b8021d46d5ccc7fc3a58fde5291a970e089e2f28348a36f0c01c5e');
        const paletteOption = getPaletteOption('hama')!;
        const csv = parsePaletteCsv(asset(`/palettes/${paletteOption.file}`).toString(), paletteOption);
        const mapping = new Map([['50,50,52', 'H18'], ['231,206,62', 'H03']]);
        const quantities = new Map<string, number>();
        const yellowCells: number[][] = [];
        let empty = 0;
        for (let offset = 0; offset < source.length; offset += 4) {
            expect(rgba[offset + 3], `alpha at cell ${offset / 4}`).toBe(source[offset + 3]);
            if (!source[offset + 3]) {
                expect([...rgba.subarray(offset, offset + 4)]).toEqual([0, 0, 0, 0]);
                empty++;
                continue;
            }
            const ref = mapping.get([...source.subarray(offset, offset + 3)].join(','));
            const entry = csv.entries.find(color => color.ref === ref)!;
            expect(entry, `source colour at cell ${offset / 4}`).toBeDefined();
            expect([...rgba.subarray(offset, offset + 3)]).toEqual([entry.color.r, entry.color.g, entry.color.b]);
            quantities.set(ref!, (quantities.get(ref!) ?? 0) + 1);
            if (ref === 'H03') yellowCells.push([(offset / 4) % 29 + 1, Math.floor(offset / 4 / 29) + 1]);
        }
        expect(empty).toBe(660);
        expect(Object.fromEntries(quantities)).toEqual({ H18: 177, H03: 4 });
        expect(yellowCells).toEqual([[9, 11], [10, 11], [14, 11], [15, 11]]);
        for (const color of variant.materials) {
            const actual = draft.activePalettes[0].entries.find(entry => entry.ref === color.ref)!;
            const entry = csv.entries.find(entry => entry.ref === color.ref)!;
            expect(actual).toMatchObject({ ref: entry.ref, symbol: entry.symbol, color: entry.color });
            expect(color.symbol).toBe(actual.symbol);
            expect(color.hex).toBe(`#${Buffer.from([actual.color.r, actual.color.g, actual.color.b]).toString('hex')}`);
            expect(color.count).toBe(quantities.get(color.ref));
        }
        const pixels = await sharp(`public${variant.pixels}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        expect([pixels.info.width, pixels.info.height, pixels.info.channels]).toEqual([29, 29, 4]);
        expect(pixels.data).toEqual(Buffer.from(rgba));
        const preview = await sharp(`public${variant.preview}`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const expectedPreview = await sharp(Buffer.from(rgba), { raw: { width: 29, height: 29, channels: 4 } })
            .resize(580, 580, { kernel: 'nearest' }).flatten({ background: '#faf8f3' }).removeAlpha().raw().toBuffer();
        expect([preview.info.width, preview.info.height, preview.info.channels]).toEqual([580, 580, 3]);
        expect(preview.data).toEqual(expectedPreview);
        expect(parseEditorProject(serializeEditorProject(draft))).toEqual(draft);
    });

    it.each(locales)('%s renders native files, a Hama editor entry and meaningful print limits without image transformations', locale => {
        const variant = getHamaOriginalVariant(hamaBlackCatId, locale)!;
        const html = renderToStaticMarkup(createElement(HamaOriginalDownloads, { patternId: hamaBlackCatId, locale }));
        const anchors = [...html.matchAll(/<a\b([^>]*)>/g)].map(match => match[1]);
        expect(anchors).toHaveLength(6);
        for (const [href, format, language] of [
            [variant.pdf, 'pdf', locale], [variant.pdfLetter, 'pdf', locale], [variant.grid, 'grid_png', locale],
            [variant.pixels, 'png', undefined], [variant.project, 'project', undefined],
        ]) {
            const anchor = anchors.find(value => value.includes(`href="${href}"`))!;
            expect(anchor).toContain('download=');
            expect(anchor).toContain(`data-pattern-id="${hamaBlackCatProjectId}"`);
            expect(anchor).toContain('data-pattern-palette="hama"');
            expect(anchor).toContain(`data-pattern-format="${format}"`);
            if (language) expect(anchor).toContain(`hrefLang="${language}"`);
            const event = buildPatternEvent({ name: 'pattern_download', patternId: hamaBlackCatProjectId, paletteId: 'hama', entryPoint: 'pattern_detail', format });
            expect(event?.parameters).toEqual({ pattern_id: hamaBlackCatProjectId, primary_palette_id: 'hama', entry_point: 'pattern_detail', file_format: format });
        }
        const editor = anchors.find(value => value.includes(`href="${variant.editor}"`))!;
        expect(editor).toContain('data-pattern-event="pattern_editor_open"');
        expect(editor).toContain(`hrefLang="${locale}"`);
        expect(getLibraryProject(hamaBlackCatProjectId, locale)).toEqual({ id: hamaBlackCatProjectId, title: `${variant.name} — Hama Midi`, projectUrl: variant.project });
        expect(html).toContain('id="hama-midi"');
        expect(html).not.toContain('<h1');
        expect(html).toContain(`src="${variant.preview}"`);
        expect(html).not.toContain('/_next/image');
        expect(html).not.toMatch(/fan.art|Mojang|Microsoft|redistribut|再配布|Weitergabe/i);
        for (const text of ['H18', 'H03', '177', '181', 'A4', 'US Letter', 'Mini', 'Maxi']) expect(html).toContain(text);
        expect(html).toMatch(/50(?: |-)?mm/);
        const table = html.match(/<tbody>([\s\S]*?)<\/tbody>/)![1];
        for (const color of variant.materials) expect(table).toContain(`</span>${color.ref.slice(1)} ${color.name}</td>`);
        expect(table).not.toMatch(/H18|H03/);
        const link = renderToStaticMarkup(createElement(HamaOriginalLink, { locale }));
        expect(link).toContain(`href="${variant.detail}"`);
        expect(link).not.toContain('data-pattern-card');
    });

    it.each(locales)('%s provides real native PDF and chart assets', locale => {
        const variant = getHamaOriginalVariant(hamaBlackCatId, locale)!;
        for (const href of [variant.pdf, variant.pdfLetter]) expect(asset(href).subarray(0, 5).toString()).toBe('%PDF-');
        expect(asset(variant.grid).subarray(1, 4).toString()).toBe('PNG');
    });

    it('does not add a section to other patterns or accept unsafe asset path variants', () => {
        for (const id of [...patterns.filter(pattern => pattern.id !== hamaBlackCatId).map(pattern => pattern.id), hamaBlackCatProjectId, '../original-black-cat']) {
            expect(renderToStaticMarkup(createElement(HamaOriginalDownloads, { patternId: id }))).toBe('');
        }
        expect(getHamaOriginalVariant(hamaBlackCatId, '../en' as 'en')).toBeUndefined();
    });
});

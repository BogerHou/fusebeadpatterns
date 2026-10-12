import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import HamaCharacterDownloads, { HamaCharacterLink } from '../../components/patterns/HamaCharacterDownloads';
import { buildPatternEvent } from '../analytics';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { loadLibraryEditorProject } from '../editor/library-project';
import { patterns } from './catalog';
import { getHamaCharacterVariant, hamaCreeperId, hamaCreeperProjectId } from './hama-character-variants';
import { hamaPatterns } from './hama';
import { getLibraryProject } from './project-links';

const locales = ['en', 'de', 'fr', 'ja'] as const;
const asset = (href: string) => readFileSync(`public${href}`);

describe('fixed Hama character download', () => {
    it('adds only the explicit project ID while retaining the catalog and original Hama allowlists', async () => {
        for (const pattern of patterns) {
            expect(getLibraryProject(pattern.id)?.projectUrl).toBe(pattern.assets.project);
            expect(Boolean(getHamaCharacterVariant(pattern.id))).toBe(pattern.id === hamaCreeperId);
        }
        expect(patterns.some(pattern => pattern.id === hamaCreeperProjectId)).toBe(false);
        expect(hamaPatterns.some(pattern => pattern.id === hamaCreeperId)).toBe(false);
        for (const pattern of hamaPatterns) expect(getLibraryProject(pattern.projectId)?.projectUrl).toBe(pattern.project);
        const fetchProject = vi.fn<typeof fetch>();
        for (const invalid of [`${hamaCreeperProjectId}-extra`, 'https://example.com/project.json', '../minecraft-creeper-face-v1-hama', hamaCreeperId.toUpperCase()]) {
            expect(getLibraryProject(invalid)).toBeUndefined();
            await expect(loadLibraryEditorProject(invalid, new AbortController().signal, fetchProject)).rejects.toThrow('not in the library');
        }
        expect(fetchProject).not.toHaveBeenCalled();
    });

    it('loads the actual Hama project and preserves all source positions with CSV-backed colours, symbols and counts', async () => {
        const variant = getHamaCharacterVariant(hamaCreeperId)!;
        const contents = asset(variant.project).toString();
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(contents));
        const controller = new AbortController();
        const draft = await loadLibraryEditorProject(hamaCreeperProjectId, controller.signal, fetchProject);
        expect(fetchProject).toHaveBeenCalledWith(variant.project, { signal: controller.signal, credentials: 'omit', redirect: 'error' });
        expect(draft.selectedPaletteIds).toEqual(['hama']);
        expect(draft.activePalettes.map(palette => palette.name)).toEqual(['Hama Midi']);
        expect(draft.activePalettes[0].entries.map(color => color.ref).sort()).toEqual(['H10', 'H18', 'H47']);
        expect([draft.boardId, draft.boardWidth, draft.boardHeight]).toEqual(['midi', 1, 1]);
        expect([draft.editedPattern?.width, draft.editedPattern?.height]).toEqual([29, 29]);
        expect(draft.sourceMode).toBe('blank');
        expect(draft.imageSrc).toBeNull();
        const rgba = decodeEditorPatternDraft(draft.editedPattern)!;
        const original = patterns.find(pattern => pattern.id === hamaCreeperId)!;
        const source = decodeEditorPatternDraft(parseEditorProject(asset(original.assets.project).toString())!.editedPattern)!;
        const paletteOption = getPaletteOption('hama')!;
        const palette = parsePaletteCsv(asset(`/palettes/${paletteOption.file}`).toString(), paletteOption);
        const mapping = new Map([['77,171,100', 'H10'], ['50,50,52', 'H18'], ['105,184,69', 'H47']]);
        const quantities = new Map<string, number>();
        for (let offset = 0; offset < source.length; offset += 4) {
            expect(rgba[offset + 3], `alpha at ${offset / 4}`).toBe(source[offset + 3]);
            if (!source[offset + 3]) {
                expect([...rgba.subarray(offset, offset + 4)]).toEqual([...source.subarray(offset, offset + 4)]);
                continue;
            }
            const ref = mapping.get([...source.subarray(offset, offset + 3)].join(','));
            const entry = palette.entries.find(color => color.ref === ref)!;
            expect(entry, `source colour at ${offset / 4}`).toBeDefined();
            expect([...rgba.subarray(offset, offset + 3)]).toEqual([entry.color.r, entry.color.g, entry.color.b]);
            quantities.set(ref!, (quantities.get(ref!) ?? 0) + 1);
        }
        expect([...quantities.values()].reduce((sum, count) => sum + count, 0)).toBe(256);
        for (const color of variant.materials) {
            const actual = draft.activePalettes[0].entries.find(entry => entry.ref === color.ref)!;
            const csv = palette.entries.find(entry => entry.ref === color.ref)!;
            expect(actual).toMatchObject({ ref: csv.ref, symbol: csv.symbol, color: csv.color });
            expect(color.symbol).toBe(actual.symbol);
            expect(color.hex).toBe(`#${Buffer.from([actual.color.r, actual.color.g, actual.color.b]).toString('hex')}`);
            expect(color.count).toBe(quantities.get(color.ref));
        }
        expect(Buffer.from(rgba)).toEqual(await sharp(`public${variant.pixels}`).ensureAlpha().raw().toBuffer());
        expect(parseEditorProject(serializeEditorProject(draft))).toEqual(draft);
    });

    it.each(locales)('%s offers native files, the Hama editor project and valid private-data-free measurement', locale => {
        const variant = getHamaCharacterVariant(hamaCreeperId, locale)!;
        const html = renderToStaticMarkup(createElement(HamaCharacterDownloads, { patternId: hamaCreeperId, locale }));
        const anchors = [...html.matchAll(/<a\b([^>]*)>/g)].map(match => match[1]);
        for (const [href, format] of [[variant.pdf, 'pdf'], [variant.pdfLetter, 'pdf'], [variant.grid, 'grid_png'], [variant.project, 'project']]) {
            const anchor = anchors.find(value => value.includes(`href="${href}"`))!;
            expect(anchor).toContain('download=');
            expect(anchor).toContain(`data-pattern-id="${hamaCreeperProjectId}"`);
            expect(anchor).toContain('data-pattern-palette="hama"');
            expect(anchor).toContain(`data-pattern-format="${format}"`);
            if (href !== variant.project) expect(anchor).toContain(`hrefLang="${locale}"`);
            const event = buildPatternEvent({ name: 'pattern_download', patternId: hamaCreeperProjectId, paletteId: 'hama', entryPoint: 'pattern_detail', format });
            expect(event?.parameters).toEqual({ pattern_id: hamaCreeperProjectId, primary_palette_id: 'hama', entry_point: 'pattern_detail', file_format: format });
        }
        expect(anchors.find(value => value.includes(`href="${variant.editor}"`))).toContain('data-pattern-event="pattern_editor_open"');
        expect(getLibraryProject(hamaCreeperProjectId, locale)).toEqual({ id: hamaCreeperProjectId, title: `${variant.name} — Hama Midi`, projectUrl: variant.project });
        expect(html).toContain(`src="${variant.preview}"`);
        expect(html).not.toContain('/_next/image');
        expect(html).not.toContain('data-pattern-palette="perler"');
        expect(html).toContain('Mojang/Microsoft');
        for (const href of [variant.pdf, variant.pdfLetter]) expect(asset(href).subarray(0, 5).toString()).toBe('%PDF-');
        expect(asset(variant.grid).subarray(1, 4).toString()).toBe('PNG');
        const entry = renderToStaticMarkup(createElement(HamaCharacterLink, { locale }));
        expect(entry).toContain(`href="${variant.detail}"`);
    });

    it('leaves every other detail page without a Hama character section', () => {
        for (const pattern of patterns.filter(pattern => pattern.id !== hamaCreeperId)) {
            expect(renderToStaticMarkup(createElement(HamaCharacterDownloads, { patternId: pattern.id }))).toBe('');
        }
        expect(renderToStaticMarkup(createElement(HamaCharacterDownloads, { patternId: hamaCreeperProjectId }))).toBe('');
    });
});

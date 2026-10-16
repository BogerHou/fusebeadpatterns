import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import CherriesHamaDownloads from '../../components/patterns/CherriesHamaDownloads';
import HamaOriginalDownloads, { HamaOriginalLink } from '../../components/patterns/HamaOriginalDownloads';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { decodeEditorPatternDraft, parseEditorProject } from '../editor/draft';
import { loadLibraryEditorProject } from '../editor/library-project';
import { getPatternById } from './catalog';
import { getCherriesHamaLibraryProject, getCherriesHamaVariant, hamaCherriesId, hamaCherriesProjectId } from './cherries-hama';
import data from './cherries-hama-data.json';
import { getHamaOriginalLibraryProject, getHamaOriginalVariant, hamaBlackCatId } from './hama-original-variants';
import { getLibraryProject } from './project-links';

const locales = ['en', 'de', 'fr', 'ja'] as const;
const asset = (href: string) => readFileSync(`public${href}`);
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
// Captured from the actual unchanged black-cat components before adding the
// cherries dispatch. These protect the earlier four-language user-facing HTML.
const previousBlackCatHtml = {
    en: ['e78f02f613881e2b1759e6da701dc5e3d10dd054d2469090472beb0ae79820c5', '2a5d7549a9168bbcdfb1d2c7303b42b9499a13acd5a2040bd838872a675bb9fb'],
    de: ['52e215db10402ec94e0c4a96f28bc6ca6bfeb07800504a754ec5e0c7c7b76035', '9d93bc9531d4113d9c7055ea3fdb3d35cd19d0ed802b1e455268ec8b160eacdc'],
    fr: ['7dda4de83a90b7223fa1ab8ea86490b6e7ff30ae7010395db422dae2472dc264', '9526119d74383933d56d591637be3884abd423e308b18aaafd15ff4e0305a611'],
    ja: ['0f8dde47d207ea7ae775a50cae06b4c7c3bba0cfe9d7e42050939c61769f150f', 'ba7effcd5a8e1ae78034bd576d5da0853ac66477be7fd9366598de120f925b19'],
};

describe('reviewed original cherries Hama downloads', () => {
    it('keeps the approved geometry and obtains all material quantities from the real Hama mapping', () => {
        expect(data).toMatchObject({ id: hamaCherriesId, projectId: hamaCherriesProjectId,
            motif: { width: 24, height: 23 }, board: { width: 29, height: 29 }, beadCount: 284 });
        expect(data.materials.length).toBeGreaterThan(0);
        expect(data.materials.length).toBeLessThanOrEqual(5);
        expect(new Set(data.materials.map(color => color.ref)).size).toBe(data.materials.length);
        expect(data.materials.reduce((sum, color) => sum + color.count, 0)).toBe(284);
        const variant = getCherriesHamaVariant(hamaCherriesId)!;
        const draft = parseEditorProject(asset(variant.project).toString())!;
        expect(draft).toBeDefined();
        expect(draft.selectedPaletteIds).toEqual(['hama']);
        expect([draft.boardId, draft.boardWidth, draft.boardHeight]).toEqual(['midi', 1, 1]);
        expect([draft.editedPattern?.width, draft.editedPattern?.height]).toEqual([29, 29]);
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        const source = getPatternById(hamaCherriesId)!;
        const original = decodeEditorPatternDraft(parseEditorProject(asset(source.assets.project).toString())!.editedPattern)!;
        expect(pixels.length).toBe(original.length);
        const option = getPaletteOption('hama')!;
        const csv = parsePaletteCsv(asset(`/palettes/${option.file}`).toString(), option);
        const used = new Map<string, number>();
        for (let offset = 0; offset < pixels.length; offset += 4) {
            expect(pixels[offset + 3], `alpha at cell ${offset / 4}`).toBe(original[offset + 3]);
            if (!pixels[offset + 3]) {
                expect([...pixels.subarray(offset, offset + 4)]).toEqual([0, 0, 0, 0]);
                continue;
            }
            const actual = csv.entries.find(color => color.color.r === pixels[offset]
                && color.color.g === pixels[offset + 1] && color.color.b === pixels[offset + 2]);
            expect(actual, `Hama RGB at cell ${offset / 4}`).toBeDefined();
            used.set(actual!.ref, (used.get(actual!.ref) ?? 0) + 1);
        }
        expect([...used.values()].reduce((sum, count) => sum + count, 0)).toBe(284);
        expect([...used.keys()].sort()).toEqual(data.materials.map(color => color.ref).sort());
        for (const color of data.materials) {
            const actual = csv.entries.find(entry => entry.ref === color.ref)!;
            expect(actual.name).not.toMatch(/\b(?:transparent|translucent|clear)\b/i);
            expect(color.symbol).toBe(actual.symbol);
            expect(color.hex).toBe(`#${Buffer.from([actual.color.r, actual.color.g, actual.color.b]).toString('hex')}`);
            expect(color.count).toBe(used.get(color.ref));
            expect(Object.keys(color.names).sort()).toEqual([...locales].sort());
            for (const locale of locales) expect(color.names[locale].length).toBeGreaterThan(0);
        }
    });

    it.each(locales)('%s exposes only fixed native paths and the exact Hama project allowlist entry', async locale => {
        const prefix = locale === 'en' ? '' : `/${locale}`;
        const variant = getCherriesHamaVariant(hamaCherriesId, locale)!;
        expect(variant).toMatchObject({ id: hamaCherriesId, projectId: hamaCherriesProjectId, paletteId: 'hama',
            preview: '/patterns-hama/original-cherries/preview.png', pixels: '/patterns-hama/original-cherries/pixels.png',
            project: '/patterns-hama/original-cherries/pattern.bead-pattern.json',
            grid: `/patterns-hama/original-cherries/${locale}/grid.png`,
            pdf: `/patterns-hama/original-cherries/${locale}/pattern.pdf`, pdfLetter: `/patterns-hama/original-cherries/${locale}/pattern-letter.pdf`,
            detail: `${prefix}/patterns/cherry#hama-midi`, editor: `${prefix}/editor?pattern=${hamaCherriesProjectId}` });
        expect(getHamaOriginalVariant(hamaCherriesId, locale)).toEqual(variant);
        const expected = { id: hamaCherriesProjectId, title: `${variant.name} — Hama Midi`, projectUrl: variant.project };
        expect(getCherriesHamaLibraryProject(hamaCherriesProjectId, locale)).toEqual(expected);
        expect(getHamaOriginalLibraryProject(hamaCherriesProjectId, locale)).toEqual(expected);
        expect(getLibraryProject(hamaCherriesProjectId, locale)).toEqual(expected);
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(asset(variant.project).toString()));
        const controller = new AbortController();
        const draft = await loadLibraryEditorProject(hamaCherriesProjectId, controller.signal, fetchProject);
        expect(draft.selectedPaletteIds).toEqual(['hama']);
        expect(fetchProject).toHaveBeenCalledWith(variant.project, { signal: controller.signal, credentials: 'omit', redirect: 'error' });
        for (const href of [variant.pdf, variant.pdfLetter]) expect(asset(href).subarray(0, 5).toString()).toBe('%PDF-');
        expect(asset(variant.grid).subarray(1, 4).toString()).toBe('PNG');
    });

    it.each(locales)('%s renders real quantities and download semantics without black-cat copy or image transformations', locale => {
        const variant = getCherriesHamaVariant(hamaCherriesId, locale)!;
        const html = renderToStaticMarkup(createElement(HamaOriginalDownloads, { patternId: hamaCherriesId, locale }));
        expect(html).toBe(renderToStaticMarkup(createElement(CherriesHamaDownloads, { locale })));
        expect(html).toContain('id="hama-midi"');
        expect(html.match(/<h2\b/g)).toHaveLength(1);
        expect(html).not.toContain('<h1');
        expect(html).not.toMatch(/black cat|schwarze Katze|chat noir|黒猫|\{\w+\}/i);
        expect(html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)![1]).not.toMatch(/177|181/);
        expect(html).toContain(`src="${variant.preview}"`);
        expect(html).not.toContain('/_next/image');
        for (const text of ['24 × 23', '29 × 29', '284', 'A4', 'US Letter', 'Mini', 'Maxi']) expect(html).toContain(text);
        expect(html).toMatch(/50(?: |-)?mm/);
        const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)![1];
        expect(tbody.match(/<tr\b/g)).toHaveLength(variant.materials.length);
        for (const color of variant.materials) {
            expect(tbody).toContain(`</span>${color.ref.slice(1)} ${color.name}</td>`);
            expect(tbody).toContain(`<td class="py-2 text-right tabular-nums">${color.count}</td>`);
        }
        const anchors = [...html.matchAll(/<a\b([^>]*)>/g)].map(match => match[1]);
        expect(anchors).toHaveLength(6);
        for (const [href, format, language] of [
            [variant.pdf, 'pdf', locale], [variant.pdfLetter, 'pdf', locale], [variant.grid, 'grid_png', locale],
            [variant.pixels, 'png', undefined], [variant.project, 'project', undefined],
        ]) {
            const anchor = anchors.find(value => value.includes(`href="${href}"`))!;
            expect(anchor).toContain('download=');
            expect(anchor).toContain(`data-pattern-id="${hamaCherriesProjectId}"`);
            expect(anchor).toContain('data-pattern-palette="hama"');
            expect(anchor).toContain(`data-pattern-format="${format}"`);
            if (language) expect(anchor).toContain(`hrefLang="${language}"`);
        }
        const editor = anchors.find(value => value.includes(`href="${variant.editor}"`))!;
        expect(editor).not.toContain('download=');
        expect(editor).toContain('data-pattern-event="pattern_editor_open"');
        expect(editor).toContain(`hrefLang="${locale}"`);
    });

    it('serves a real 29×29 Hama pixel image and its nearest-neighbour 580×580 preview', async () => {
        const variant = getCherriesHamaVariant(hamaCherriesId)!;
        const rgba = decodeEditorPatternDraft(parseEditorProject(asset(variant.project).toString())!.editedPattern)!;
        const pixels = await sharp(`public${variant.pixels}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        expect([pixels.info.width, pixels.info.height, pixels.info.channels]).toEqual([29, 29, 4]);
        expect(hash(pixels.data)).toBe(hash(Buffer.from(rgba)));
        const expected = await sharp(Buffer.from(rgba), { raw: { width: 29, height: 29, channels: 4 } })
            .resize(580, 580, { kernel: 'nearest' }).flatten({ background: '#ddd8ca' }).removeAlpha().raw().toBuffer();
        const preview = await sharp(`public${variant.preview}`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        expect([preview.info.width, preview.info.height, preview.info.channels]).toEqual([580, 580, 3]);
        // A failed megabyte-size Buffer diff can dominate the test worker;
        // hashes still compare every byte while keeping failures bounded.
        expect(hash(preview.data)).toBe(hash(expected));
    });

    it('rejects unsafe IDs and locales without a project fetch, and returns independently owned data', async () => {
        const fetchProject = vi.fn<typeof fetch>();
        for (const id of ['../original-cherries-hama', 'original-cherries-Hama', 'original-cherries-hama-extra',
            'original-cherries-hama?url=https://example.com', 'original-cherries%2Dhama']) {
            expect(getCherriesHamaLibraryProject(id)).toBeUndefined();
            await expect(loadLibraryEditorProject(id, new AbortController().signal, fetchProject)).rejects.toThrow('not in the library');
        }
        expect(fetchProject).not.toHaveBeenCalled();
        expect(getCherriesHamaLibraryProject(hamaCherriesId)).toBeUndefined();
        expect(getLibraryProject(hamaCherriesId)?.projectUrl).toBe(getPatternById(hamaCherriesId)!.assets.project);
        for (const locale of ['../en', 'EN', '', null] as unknown as Array<'en'>) {
            expect(getCherriesHamaVariant(hamaCherriesId, locale)).toBeUndefined();
            expect(getCherriesHamaLibraryProject(hamaCherriesProjectId, locale)).toBeUndefined();
        }
        for (const id of [hamaCherriesProjectId, '../original-cherries', 'original-cherries-extra']) expect(getCherriesHamaVariant(id)).toBeUndefined();
        const changed = getCherriesHamaVariant(hamaCherriesId)!;
        changed.materials[0].count = -1; changed.materials[0].name = 'Changed'; changed.motif.width = 999;
        expect(getCherriesHamaVariant(hamaCherriesId)!.materials[0].count).toBeGreaterThan(0);
        expect(getCherriesHamaVariant(hamaCherriesId)!.materials[0].name).not.toBe('Changed');
        expect(getCherriesHamaVariant(hamaCherriesId)!.motif.width).toBe(24);
    });

    it.each(locales)('%s preserves the earlier black-cat download section and link byte for byte', locale => {
        expect(hash(renderToStaticMarkup(createElement(HamaOriginalDownloads, { patternId: hamaBlackCatId, locale })))).toBe(previousBlackCatHtml[locale][0]);
        expect(hash(renderToStaticMarkup(createElement(HamaOriginalLink, { locale })))).toBe(previousBlackCatHtml[locale][1]);
    });
});

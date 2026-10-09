import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import ts from 'typescript';
import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import { hamaLanguageAlternates } from '../i18n/metadata';
import * as localizedData from './localized-hama';
import { localizedHamaPatterns, localizedHamaCopy, localizedHamaGuideLinks } from './localized-hama';
import { hamaPatterns } from './hama';
import { getPatternById } from './catalog';
import { getLocalizedPatternName } from './localized-content';
import { getLibraryProject } from './project-links';
import { parseEditorProject } from '../editor/draft';
// Render the actual shared card component; layout is separately exercised by Next's build/browser QA.
const source = readFileSync(new URL('../../components/patterns/LocalizedHamaPatterns.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
const loaded: Record<string, unknown> = {}, require = createRequire(import.meta.url);
new Script(compiled).runInNewContext({ exports: loaded, require: (id: string) => {
    if (id === '@/lib/patterns/localized-hama') return localizedData;
    if (id === '@/lib/i18n/metadata') return { hamaLanguageAlternates };
    if (id.startsWith('@/components/layout/')) return { __esModule: true, default: (): null => null };
    return require(id);
} });
const LocalizedHamaDownloads = loaded.LocalizedHamaDownloads as ComponentType<{ locale: 'fr' | 'ja' }>;
const localizedHamaMetadata = loaded.localizedHamaMetadata as (locale: 'fr' | 'ja') => Metadata;
const file = (url: string) => path.join(process.cwd(), 'public', url);
// The native A4 files are already public and must not change when Letter is added.
const publishedA4Hashes: Record<string, { fr: string; ja: string }> = {
    'original-soccer-ball': { fr: '34cd3fa1355dabac206badb5340b58e6426825742eb58b5680428ff32ad916a5', ja: '4bfeef3f3dc9df770a9f7460122985a190c731c7a8f34af514608fdbc62cf9b0' },
    'original-friendly-ghost': { fr: 'd063d6fa132f68982fd3fe9951fb612fd1ea9bd6ae4606a3c14b40621b949a09', ja: '28a1fe8b31dfb799d189b0d8711f4873df319fd13065288ffc4d829ddb206b5e' },
    'original-halloween-bat': { fr: '836e1f424d1a7cbb2cf221fce7d3d01503003f59c98f6856d5e17049940806c5', ja: 'a6db905b20b580a11b0125a1e85827cb6359a6232253aa0bc48d0c37cdd0db1d' },
    'original-christmas-tree': { fr: '7e4a3517e77e18d01ab93327d39bebbc8878787aa301e8d1d4d38661f1a78662', ja: 'cd2a49ec511edfbb021cf79cd305087fd3155fd46c28d6e66e744a9d96732c79' },
    'original-snowman': { fr: '6fd5189d8b8e0e84fa0a86b1c5a9539b83cfb3868c124088ba76d7a6e2439ac9', ja: '49b3e0225ac6d3d8bbc92bfa7568279b38be064a890e67af28d3e669ce7cba5e' },
    'original-gingerbread-man': { fr: '4497b02feb84188efcfde46577931b29699d277eeedff8e11546b1de59a4413f', ja: 'b776fbe6ecb5280bd4b033fc5fdc092c310fa39cb5a783b94954383721191a89' },
};

describe('complete French and Japanese Hama counterparts', () => {
    it.each(['fr', 'ja'] as const)('%s uses the same six reviewed Hama resources and native editor entries', locale => {
        const cards = localizedHamaPatterns(locale);
        expect(cards.map(card => card.id)).toEqual(hamaPatterns.map(card => card.id));
        expect(new Set(cards.map(card => card.id)).size).toBe(6);
        for (const card of cards) {
            const old = hamaPatterns.find(pattern => pattern.id === card.id)!;
            expect(card.name).toBe(getLocalizedPatternName(getPatternById(card.id)!, locale));
            expect(card.preview).toBe(old.preview); expect(card.project).toBe(old.project);
            expect(card.pdfLetter).toBe(`/patterns-${locale}-hama/${card.id}/pattern-letter.pdf`);
            expect(card.pdfLetter).not.toBe(old.pdfLetter);
            expect(readFileSync(file(card.pdfLetter)).subarray(0, 5).toString()).toBe('%PDF-');
            expect(readFileSync(file(old.pdfLetter)).subarray(0, 5).toString()).toBe('%PDF-');
            const editor = new URL(card.editor, 'https://fusebeadpatterns.art');
            expect(editor.pathname).toBe(`/${locale}/editor`); expect(editor.searchParams.get('pattern')).toBe(old.projectId);
            expect(getLibraryProject(old.projectId)?.projectUrl).toBe(card.project);
            const project = parseEditorProject(readFileSync(file(card.project), 'utf8'))!;
            expect(project.selectedPaletteIds).toEqual(['hama']);
            expect([project.editedPattern!.width, project.editedPattern!.height]).toEqual([29, 29]);
            expect(card.pdf).toBe(`/patterns-${locale}-hama/${card.id}/pattern.pdf`);
            expect(readFileSync(file(card.pdf)).subarray(0, 5).toString()).toBe('%PDF-');
            const pixels = readFileSync(file(card.pixels));
            expect(pixels.subarray(1, 4).toString()).toBe('PNG');
            expect([pixels.readUInt32BE(16), pixels.readUInt32BE(20)]).toEqual([29, 29]);
        }
        for (const link of localizedHamaGuideLinks(locale)) expect(link.href).toMatch(new RegExp(`^/${locale}/guides/`));
    });
    it.each(['fr', 'ja'] as const)('%s preserves all six published native A4 files', locale => {
        expect(Object.keys(publishedA4Hashes).sort()).toEqual(localizedHamaPatterns(locale).map(card => card.id).sort());
        for (const card of localizedHamaPatterns(locale)) {
            expect(createHash('sha256').update(readFileSync(file(card.pdf))).digest('hex')).toBe(publishedA4Hashes[card.id][locale]);
        }
    });
    it.each(['fr', 'ja'] as const)('%s renders native A4 and Letter downloads and keeps Hama IDs on every action', locale => {
        const copy = localizedHamaCopy[locale], html = renderToStaticMarkup(createElement(LocalizedHamaDownloads, { locale }));
        expect(html.match(/<article\b/g)).toHaveLength(6); expect(html).not.toContain('<select');
        expect(html).toContain(copy.pdf); expect(html).toContain(copy.letterPdf); expect(html).not.toContain('data-pattern-palette="perler"');
        expect(copy.letterPdf).toContain(locale === 'fr' ? 'français' : '日本語');
        for (const card of localizedHamaPatterns(locale)) {
            const article = html.match(new RegExp(`<article[^>]*id="${card.id}"[\\s\\S]*?<\\/article>`))![0];
            const anchors = [...article.matchAll(/<a\b([^>]*)>/g)].map(match => match[1]);
            expect(anchors).toHaveLength(7);
            expect(anchors.filter(anchor => anchor.includes(`href="${card.pdf}"`) && anchor.includes(`hrefLang="${locale}"`) && anchor.includes('download='))).toHaveLength(2);
            const letter = anchors.filter(anchor => anchor.includes(`href="${card.pdfLetter}"`));
            expect(letter).toHaveLength(1);
            expect(letter[0]).toContain(`hrefLang="${locale}"`);
            expect(letter[0]).toContain(`download="${card.id}-hama-${locale}-letter.pdf"`);
            expect(letter[0]).toContain('data-pattern-event="pattern_download"');
            expect(letter[0]).toContain('data-pattern-format="pdf"');
            expect(anchors.find(anchor => anchor.includes(`href="${card.editor}"`))).toContain('data-pattern-event="pattern_editor_open"');
            expect(anchors.find(anchor => anchor.includes(`href="${card.perler}"`))).not.toContain('data-pattern-event');
            for (const anchor of anchors.filter(anchor => anchor.includes('data-pattern-event'))) {
                expect(anchor).toContain('data-pattern-palette="hama"'); expect(anchor).toContain(`data-pattern-id="${card.projectId}"`);
            }
            expect(article).toContain(`src="${card.preview}"`); expect(article).toContain(copy.previewAlt(card.name));
        }
    });
    it.each(['fr', 'ja'] as const)('%s metadata describes actual Hama downloads and uses its own canonical', locale => {
        const copy = localizedHamaCopy[locale], metadata = localizedHamaMetadata(locale);
        expect(metadata.title).toBe(copy.title); expect(metadata.description).toBe(copy.description);
        expect(metadata.alternates?.canonical).toBe(copy.path);
        expect(metadata.openGraph).toHaveProperty('locale', locale === 'fr' ? 'fr_FR' : 'ja_JP');
        expect(copy.sizeHelp).toContain('29 × 29'); expect(copy.sizeHelp).toContain('50 mm');
        expect(copy.colours).toContain('H01'); expect(copy.colours).toContain('H18');
        expect(copy.printingSteps).toHaveLength(3);
    });
});

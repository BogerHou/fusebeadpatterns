import { readFileSync } from 'node:fs';
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

describe('complete French and Japanese Hama counterparts', () => {
    it.each(['fr', 'ja'] as const)('%s uses the same six reviewed Hama resources and native editor entries', locale => {
        const cards = localizedHamaPatterns(locale);
        expect(cards.map(card => card.id)).toEqual(hamaPatterns.map(card => card.id));
        expect(new Set(cards.map(card => card.id)).size).toBe(6);
        for (const card of cards) {
            const old = hamaPatterns.find(pattern => pattern.id === card.id)!;
            expect(card.name).toBe(getLocalizedPatternName(getPatternById(card.id)!, locale));
            expect(card.preview).toBe(old.preview); expect(card.project).toBe(old.project); expect(card.pdfLetter).toBe(old.pdfLetter);
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
    it.each(['fr', 'ja'] as const)('%s renders native A4 downloads, labels English US Letter and keeps Hama IDs on every action', locale => {
        const copy = localizedHamaCopy[locale], html = renderToStaticMarkup(createElement(LocalizedHamaDownloads, { locale }));
        expect(html.match(/<article\b/g)).toHaveLength(6); expect(html).not.toContain('<select');
        expect(html).toContain(copy.pdf); expect(html).toContain(copy.letterPdf); expect(html).not.toContain('data-pattern-palette="perler"');
        for (const card of localizedHamaPatterns(locale)) {
            const article = html.match(new RegExp(`<article[^>]*id="${card.id}"[\\s\\S]*?<\\/article>`))![0];
            const anchors = [...article.matchAll(/<a\b([^>]*)>/g)].map(match => match[1]);
            expect(anchors).toHaveLength(7);
            expect(anchors.filter(anchor => anchor.includes(`href="${card.pdf}"`) && anchor.includes(`hrefLang="${locale}"`) && anchor.includes('download='))).toHaveLength(2);
            expect(anchors.find(anchor => anchor.includes(`href="${card.pdfLetter}"`))).toContain('hrefLang="en"');
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

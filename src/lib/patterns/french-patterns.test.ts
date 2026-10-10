import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Script } from 'node:vm';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import FrenchPatternDownloads from '../../components/patterns/FrenchPatternDownloads';
import { getPatternLinkEvent } from '../analytics';
import { parseEditorProject } from '../editor/draft';
import { frenchPatternChoices, type FrenchPatternBrand } from './french-patterns';
import selection from './french-patterns.json';
import christmas from './french-christmas.json';
import hama from './hama.json';
import { getLibraryProject } from './project-links';
import { getPatternById } from './catalog';
import { getLocalizedPatternName, localizePatternNote } from './localized-content';
import { getLocalizedPatternPdf, getLocalizedPatternLetterPdf, getLocalizedPatternGrid } from './localized-download';
import { patternLanguageAlternates } from '../i18n/metadata';
import { topicMessages } from './section-messages';

const ids = ['original-soccer-ball', 'original-friendly-ghost', 'original-halloween-bat', 'original-christmas-tree', 'original-snowman', 'original-gingerbread-man'];
const brands: FrenchPatternBrand[] = ['perler', 'hama'];
const publicFile = (url: string) => path.join(process.cwd(), 'public', url);

function frenchChristmasPage() {
    // Execute the actual page and real catalog/download helpers. Only the Next
    // wrappers and shared navigation chrome are fixtures for this server render.
    const require = createRequire(import.meta.url);
    const source = readFileSync(path.join(process.cwd(), 'src/app/fr/modeles-perles-a-repasser-noel/page.tsx'), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const exports: Record<string, unknown> = {};
    const defaultModule = (component: unknown) => ({ __esModule: true, default: component });
    new Script(code).runInNewContext({ exports, require: (id: string) => {
        if (id === 'react/jsx-runtime') return require(id);
        if (id === 'next/link') return defaultModule(({ children, prefetch, ...props }: Record<string, unknown>) => {
            void prefetch;
            return createElement('a', props, children as string);
        });
        if (id === 'next/image') return defaultModule(({ src, alt, width, height }: Record<string, unknown>) => createElement('img', { src, alt, width, height }));
        if (['@/components/patterns/PatternSectionNav', '@/components/layout/SiteHeader', '@/components/layout/SiteFooter'].includes(id)) return defaultModule((): null => null);
        if (id === '@/lib/i18n/metadata') return { patternLanguageAlternates };
        if (id === '@/lib/patterns/section-messages') return { topicMessages };
        if (id === '@/lib/patterns/catalog') return { getPatternById };
        if (id === '@/lib/patterns/localized-download') return { getLocalizedPatternPdf, getLocalizedPatternLetterPdf, getLocalizedPatternGrid };
        if (id === '@/lib/patterns/localized-content') return { getLocalizedPatternName, localizePatternNote };
        if (id === '@/lib/patterns/french-christmas.json') return defaultModule(christmas);
        throw new Error(`Unexpected French Christmas page import: ${id}`);
    } });
    return exports as { default: ComponentType; metadata: { title: string; description: string; alternates: { canonical: string; languages: unknown } } };
}

describe('French original pattern downloads', () => {
    it('lists only the six reviewed originals, in the Hama order, with unchanged Christmas names', () => {
        expect(selection.patterns.map(pattern => pattern.id)).toEqual(ids);
        expect(selection.patterns.map(pattern => pattern.id)).toEqual(hama.patterns.map(pattern => pattern.id));
        expect(new Set(selection.patterns.map(pattern => pattern.id)).size).toBe(6);
        for (const original of christmas.patterns) {
            expect(selection.patterns.find(pattern => pattern.id === original.id)?.name).toBe(original.name);
        }
        for (const brand of brands) expect(frenchPatternChoices[brand].map(({ id, name }) => ({ id, name }))).toEqual(selection.patterns);
    });

    it.each(brands)('keeps every %s preview, project, editor ID and analytics identity on the same brand', brand => {
        for (const card of frenchPatternChoices[brand]) {
            const directory = brand === 'hama' ? 'patterns-hama' : 'patterns';
            const expectedId = `${card.id}${brand === 'hama' ? '-hama' : ''}`;
            expect(card.brand).toBe(brand);
            expect(card.projectId).toBe(expectedId);
            expect(card.preview).toBe(`/${directory}/${card.id}/preview.png`);
            expect(card.project).toBe(`/${directory}/${card.id}/pattern.bead-pattern.json`);
            expect(card.editor).toBe(`/fr/editor?pattern=${expectedId}`);
            expect(getLibraryProject(expectedId)?.projectUrl).toBe(card.project);
            const project = parseEditorProject(readFileSync(publicFile(card.project), 'utf8'));
            expect(project?.selectedPaletteIds).toEqual([brand]);
            expect(project?.activePalettes.map(palette => palette.name)).toEqual([brand === 'hama' ? 'Hama Midi' : 'Perler Midi']);
            expect(readFileSync(publicFile(card.preview)).subarray(1, 4).toString()).toBe('PNG');
            for (const format of ['pdf', 'project']) {
                expect(getPatternLinkEvent({ patternEvent: 'pattern_download', patternId: card.projectId, patternPalette: card.brand, patternEntry: 'patterns', patternFormat: format })).toEqual({
                    name: 'pattern_download', patternId: expectedId, paletteId: brand, entryPoint: 'patterns', format,
                });
            }
            expect(getPatternLinkEvent({ patternEvent: 'pattern_editor_open', patternId: card.projectId, patternPalette: card.brand, patternEntry: 'patterns' })?.paletteId).toBe(brand);
        }
    });

    it('uses localized brand-specific PDFs while retaining the three published Perler Christmas paths', () => {
        for (const brand of brands) {
            for (const card of frenchPatternChoices[brand]) {
                expect(card.pdf).toBe(`/${brand === 'hama' ? 'patterns-fr-hama' : 'patterns-fr'}/${card.id}/pattern.pdf`);
                expect(readFileSync(publicFile(card.pdf)).subarray(0, 5).toString()).toBe('%PDF-');
            }
        }
        for (const original of christmas.patterns) {
            expect(frenchPatternChoices.perler.find(card => card.id === original.id)?.pdf).toBe(`/patterns-fr/${original.id}/pattern.pdf`);
        }
    });

    it('server-renders six real Perler downloads with matching previews, projects, editor links and tracking', () => {
        const html = renderToStaticMarkup(createElement(FrenchPatternDownloads, { patterns: frenchPatternChoices }));
        expect(html.match(/<article\b/g)).toHaveLength(6);
        expect(html).toMatch(/<input[^>]*value="perler"[^>]*checked=""|<input[^>]*checked=""[^>]*value="perler"/);
        expect(html).not.toContain('/patterns-fr-hama/');
        expect(html).not.toContain('/patterns-hama/');
        expect(html).not.toContain('Grille PNG');
        expect(html).not.toContain('colorCount');
        expect(html).toContain('6 modèles affichés en Perler Midi');
        expect(html).toContain('Modifier');
        for (const card of frenchPatternChoices.perler) {
            const article = html.match(new RegExp(`<article[^>]*id="${card.id}"[\\s\\S]*?<\\/article>`))?.[0];
            expect(article).toBeDefined();
            expect(article).toContain(`src="${card.preview}"`);
            const anchors = [...article!.matchAll(/<a\b([^>]*)>/g)].map(match => match[1]);
            expect(anchors).toHaveLength(4);
            expect(anchors.filter(anchor => anchor.includes(`href="${card.pdf}"`) && anchor.includes('download=') && anchor.includes('data-pattern-format="pdf"'))).toHaveLength(2);
            expect(anchors.filter(anchor => anchor.includes(`href="${card.project}"`) && anchor.includes('download=') && anchor.includes('data-pattern-format="project"'))).toHaveLength(1);
            expect(anchors.filter(anchor => anchor.includes(`href="${card.editor}"`) && anchor.includes('data-pattern-event="pattern_editor_open"') && anchor.includes('hrefLang="fr"'))).toHaveLength(1);
            for (const anchor of anchors) {
                expect(anchor).toContain(`data-pattern-id="${card.projectId}"`);
                expect(anchor).toContain('data-pattern-palette="perler"');
                expect(anchor).toContain('data-pattern-entry="patterns"');
            }
        }
    });

    it('presents all seven Christmas downloads while retaining the indexed identity of the three primary patterns', () => {
        const page = frenchChristmasPage();
        const html = renderToStaticMarkup(createElement(page.default));
        const canonical = '/fr/modeles-perles-a-repasser-noel';
        expect(page.metadata.title).toBe('Perles à repasser de Noël : 3 modèles gratuits en PDF');
        expect(page.metadata.description).toBe('Sapin, bonhomme de neige et pain d’épices : 3 modèles de Noël en perles à repasser. PDF A4 en français, grilles PNG et couleurs Perler, sans compte.');
        expect(page.metadata.alternates).toEqual({ canonical, languages: patternLanguageAlternates('christmas') });
        const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
        const cardIds = [...html.matchAll(/data-pattern-card="([^"]+)"/g)].map(match => match[1]);
        expect(cardIds).toEqual([...christmas.patterns.map(pattern => pattern.id), 'original-santa-hat', 'original-christmas-stocking', 'original-snowflake', 'original-christmas-bauble-ornament']);
        expect(schema.mainEntity.numberOfItems).toBe(7);
        expect(schema.mainEntity.itemListElement).toEqual(cardIds.map((id, index) => ({
            '@type': 'ListItem', position: index + 1,
            name: christmas.patterns.find(pattern => pattern.id === id)?.name ?? getLocalizedPatternName(getPatternById(id)!, 'fr'),
            url: `https://fusebeadpatterns.art${canonical}#${id}`,
        })));
        expect(schema.description).toContain('Trois modèles principaux');
        expect(schema.description).toContain('Quatre autres motifs');
        expect(schema.description).toContain('Sept modèles gratuits');
        expect(html).toContain('Les trois modèles principaux à imprimer');
        expect(html).toContain('Les sept modèles ont un PDF en français');
        expect(html).not.toContain('Les trois PDFs');
        expect(html).toContain('href="/fr/patterns" hrefLang="fr"');
        expect(html).toContain('bibliothèque complète de modèles');
        expect(html).toContain('id="imprimer"');
        expect(html).toContain('A4, ou US Letter lorsque cette version est proposée');
        for (const id of cardIds) {
            const pattern = getPatternById(id)!;
            const article = html.match(new RegExp(`<article[^>]*id="${id}"[\\s\\S]*?<\\/article>`))![0];
            expect(article).toContain(`href="/fr/patterns/${pattern.slug}"`);
            expect(article).toContain(`href="/fr/editor?pattern=${id}"`);
            const pdf = getLocalizedPatternPdf(pattern, 'fr');
            expect(article).toContain(`href="${pdf.href}"`);
            expect(readFileSync(publicFile(pdf.href)).subarray(0, 5).toString()).toBe('%PDF-');
            if ([...christmas.patterns.map(pattern => pattern.id), 'original-santa-hat'].includes(id)) {
                const grid = getLocalizedPatternGrid(pattern, 'fr');
                expect(article).toContain(`href="${grid.href}" hrefLang="fr"`);
                expect(article).not.toContain(`href="${pattern.assets.grid}"`);
            }
        }
        expect(html.indexOf('id="autre-modele"')).toBeLessThan(html.indexOf('id="autres-motifs"'));
        expect(html).toContain('id="santa-hat-title"');
        expect(html).toContain('Bonnet de Noël');
        for (const id of ['original-christmas-stocking', 'original-snowflake', 'original-christmas-bauble-ornament']) {
            const pattern = getPatternById(id)!;
            const article = html.match(new RegExp(`<article[^>]*id="${id}"[\\s\\S]*?<\\/article>`))![0];
            expect(article).toContain(getLocalizedPatternName(pattern, 'fr'));
            expect(article).toContain(`${pattern.beads} perles en ${pattern.colorCount} couleurs Perler Midi`);
            expect(article).toContain(`href="/fr/patterns/${pattern.slug}"`);
            expect(article).toContain(`href="/fr/editor?pattern=${id}"`);
            const anchors = [...article.matchAll(/<a\b([^>]*)>/g)].map(match => match[1]);
            for (const pdf of [getLocalizedPatternPdf(pattern, 'fr'), getLocalizedPatternLetterPdf(pattern, 'fr')!]) {
                const anchor = anchors.find(value => value.includes(`href="${pdf.href}"`))!;
                expect(anchor).toContain('hrefLang="fr"');
                expect(anchor).toContain('download=""');
                expect(anchor).toContain(`data-pattern-id="${id}"`);
                expect(anchor).toContain('data-pattern-palette="perler"');
                expect(readFileSync(publicFile(pdf.href)).subarray(0, 5).toString()).toBe('%PDF-');
            }
            if (id === 'original-snowflake') expect(article).toContain(localizePatternNote(pattern.notes[0], 'fr'));
        }
    });
});

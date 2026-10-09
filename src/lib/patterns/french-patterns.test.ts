import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import FrenchPatternDownloads from '../../components/patterns/FrenchPatternDownloads';
import { getPatternLinkEvent } from '../analytics';
import { parseEditorProject } from '../editor/draft';
import { frenchPatternChoices, type FrenchPatternBrand } from './french-patterns';
import selection from './french-patterns.json';
import christmas from './french-christmas.json';
import hama from './hama.json';
import { getLibraryProject } from './project-links';

const ids = ['original-soccer-ball', 'original-friendly-ghost', 'original-halloween-bat', 'original-christmas-tree', 'original-snowman', 'original-gingerbread-man'];
const brands: FrenchPatternBrand[] = ['perler', 'hama'];
const publicFile = (url: string) => path.join(process.cwd(), 'public', url);

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
});

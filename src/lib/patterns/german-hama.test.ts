import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GermanHamaDownloads from '../../components/patterns/GermanHamaDownloads';
import { getPatternLinkEvent } from '../analytics';
import { parseEditorProject } from '../editor/draft';
import { germanHamaPatterns } from './german-hama';
import { hamaPatterns } from './hama';
import { getLibraryProject } from './project-links';

const publicFile = (url: string) => path.join(process.cwd(), 'public', url);

describe('German Hama downloads', () => {
    it('keeps the reviewed Hama selection and its editor projects on the Hama palette', () => {
        expect(germanHamaPatterns.map(pattern => pattern.id)).toEqual(hamaPatterns.map(pattern => pattern.id));
        expect(new Set(germanHamaPatterns.map(pattern => pattern.id)).size).toBe(6);
        for (const card of germanHamaPatterns) {
            const hama = hamaPatterns.find(pattern => pattern.id === card.id)!;
            expect(card.brand).toBe('hama');
            expect(card.projectId).toBe(hama.projectId);
            expect(card.preview).toBe(hama.preview);
            expect(card.project).toBe(hama.project);
            const editorUrl = new URL(card.editor, 'https://fusebeadpatterns.art');
            expect(editorUrl.pathname).toBe('/de/editor');
            expect(getLibraryProject(editorUrl.searchParams.get('pattern')!)?.projectUrl).toBe(card.project);
            const project = parseEditorProject(readFileSync(publicFile(card.project), 'utf8'));
            expect(project?.selectedPaletteIds).toEqual(['hama']);
            expect(project?.activePalettes.map(palette => palette.name)).toEqual(['Hama Midi']);
            expect([project?.editedPattern?.width, project?.editedPattern?.height]).toEqual([29, 29]);
        }
    });

    it('uses real German PDFs and the existing Hama PNGs, with a 29 by 29 pixel download', () => {
        for (const card of germanHamaPatterns) {
            expect(card.pdf).toBe(`/patterns-de-hama/${card.id}/pattern.pdf`);
            expect(readFileSync(publicFile(card.pdf)).subarray(0, 5).toString()).toBe('%PDF-');
            expect(readFileSync(publicFile(card.preview)).subarray(1, 4).toString()).toBe('PNG');
            expect(card.pixels).toBe(`/patterns-hama/${card.id}/pixels.png`);
            const png = readFileSync(publicFile(card.pixels));
            expect(png.subarray(1, 4).toString()).toBe('PNG');
            expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([29, 29]);
        }
    });

    it('renders all downloads and the matching German editor links without a brand-switching dependency', () => {
        const html = renderToStaticMarkup(createElement(GermanHamaDownloads, { patterns: germanHamaPatterns }));
        expect(html.match(/<article\b/g)).toHaveLength(6);
        expect(html).not.toContain('<input');
        expect(html).not.toContain('/patterns-de/');
        expect(html).not.toContain('data-pattern-palette="perler"');
        for (const card of germanHamaPatterns) {
            const article = html.match(new RegExp(`<article[^>]*id="${card.id}"[\\s\\S]*?<\\/article>`))?.[0];
            expect(article).toBeDefined();
            expect(article).toContain(`src="${card.preview}"`);
            expect(article).toContain(card.name);
            const anchors = [...article!.matchAll(/<a\b([^>]*)>/g)].map(match => match[1]);
            expect(anchors).toHaveLength(5);
            expect(anchors.filter(anchor => anchor.includes(`href="${card.pdf}"`) && anchor.includes('download=') && anchor.includes('data-pattern-format="pdf"'))).toHaveLength(2);
            for (const [url, format] of [[card.pixels, 'png'], [card.project, 'project']]) {
                expect(anchors.filter(anchor => anchor.includes(`href="${url}"`) && anchor.includes('download=') && anchor.includes(`data-pattern-format="${format}"`))).toHaveLength(1);
                expect(getPatternLinkEvent({ patternEvent: 'pattern_download', patternId: card.projectId, patternPalette: card.brand, patternEntry: 'patterns', patternFormat: format })?.paletteId).toBe('hama');
            }
            expect(anchors.filter(anchor => anchor.includes(`href="${card.editor}"`) && anchor.includes('data-pattern-event="pattern_editor_open"') && anchor.includes('hrefLang="de"'))).toHaveLength(1);
            for (const anchor of anchors) {
                expect(anchor).toContain(`data-pattern-id="${card.projectId}"`);
                expect(anchor).toContain('data-pattern-palette="hama"');
                expect(anchor).toContain('data-pattern-entry="patterns"');
            }
        }
    });
});

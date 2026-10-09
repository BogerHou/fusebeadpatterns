import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
// Published before native Letter was added; keep these downloads byte-for-byte stable.
const publishedPdfHashes: Record<string, { a4: string; englishLetter: string }> = {
    'original-soccer-ball': { a4: '37a472dd1c03510a7688a66a7e374861a8ba02d0b9d16d92a266fe28bcd83898', englishLetter: '6c99f406de417b5ff233761bd7c4f31bdf2cd0594fa0a26b20f8656b37a234cf' },
    'original-friendly-ghost': { a4: '4160b0d3fa10b502c37428c77f596e356ad72cce4c43ab1f2f8d9df0ef0dbc7b', englishLetter: 'd01a53ffb755451f501709ca1ba42a268273a5f2daff0ddb881e6c505c60a9fe' },
    'original-halloween-bat': { a4: '437ccba0217f5f2a3283cf3d87c4d909f445979d7643fa658f75373cb7c2c881', englishLetter: 'dd0a7b38ea58282b199d06cf965947cb7f3879556357f6f91499ca03b02ac04a' },
    'original-christmas-tree': { a4: 'ca352bd976465c180547bca59077de80a0ecc4f7066e67a62e1c6ac6f46b3caf', englishLetter: 'b95453955ecb10278777a99a334e27557d596da3bf94a2dc428c4f46691039e2' },
    'original-snowman': { a4: '50b6e520ddf99034c6003b75c4cd294864bbd1bb66d90acbc657753c152cd9cc', englishLetter: '1f12a563ba03f5bd70bfb1bc2055af29ef44406c56096e5eb4df1ff798000ff1' },
    'original-gingerbread-man': { a4: 'fabde46c8d77b03aaadaad457f9181df9462a6fb64c17df12bc61af597538304', englishLetter: '8e8666058621bd6187c1ae74d57e466e29293040e5a7a39f7db534b0ee5a3948' },
};
const fileHash = (url: string) => createHash('sha256').update(readFileSync(publicFile(url))).digest('hex');

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

    it('uses separate real German A4 and Letter PDFs and the existing 29 by 29 Hama PNGs', () => {
        for (const card of germanHamaPatterns) {
            expect(card.pdf).toBe(`/patterns-de-hama/${card.id}/pattern.pdf`);
            expect(card.pdfLetter).toBe(`/patterns-de-hama/${card.id}/pattern-letter.pdf`);
            expect(readFileSync(publicFile(card.pdf)).subarray(0, 5).toString()).toBe('%PDF-');
            expect(readFileSync(publicFile(card.pdfLetter)).subarray(0, 5).toString()).toBe('%PDF-');
            expect(readFileSync(publicFile(card.preview)).subarray(1, 4).toString()).toBe('PNG');
            expect(card.pixels).toBe(`/patterns-hama/${card.id}/pixels.png`);
            const png = readFileSync(publicFile(card.pixels));
            expect(png.subarray(1, 4).toString()).toBe('PNG');
            expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([29, 29]);
        }
    });

    it('preserves every published German A4 and English Letter PDF', () => {
        expect(Object.keys(publishedPdfHashes).sort()).toEqual(germanHamaPatterns.map(card => card.id).sort());
        for (const card of germanHamaPatterns) {
            const original = hamaPatterns.find(pattern => pattern.id === card.id)!;
            expect(fileHash(card.pdf)).toBe(publishedPdfHashes[card.id].a4);
            expect(fileHash(original.pdfLetter)).toBe(publishedPdfHashes[card.id].englishLetter);
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
            expect(anchors).toHaveLength(6);
            expect(anchors.filter(anchor => anchor.includes(`href="${card.pdf}"`) && anchor.includes('hrefLang="de"') && anchor.includes(`download="${card.id}-hama-de-a4.pdf"`) && anchor.includes('data-pattern-format="pdf"'))).toHaveLength(2);
            const letter = anchors.filter(anchor => anchor.includes(`href="${card.pdfLetter}"`));
            expect(letter).toHaveLength(1);
            expect(letter[0]).toContain('hrefLang="de"');
            expect(letter[0]).toContain(`download="${card.id}-hama-de-letter.pdf"`);
            expect(letter[0]).toContain('data-pattern-event="pattern_download"');
            expect(letter[0]).toContain('data-pattern-format="pdf"');
            expect(getPatternLinkEvent({ patternEvent: 'pattern_download', patternId: card.projectId, patternPalette: card.brand, patternEntry: 'patterns', patternFormat: 'pdf' })?.paletteId).toBe('hama');
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

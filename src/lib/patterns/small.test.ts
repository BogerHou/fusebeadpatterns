import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEditorProject } from '../editor/draft';
import { getPatternById } from './catalog';
import { getLocalizedPatternGrid, getLocalizedPatternLetterPdf, getLocalizedPatternPdf } from './localized-download';
import { getPatternsForTopic, getPatternTopicBySlug } from './topics';
import { getSmallPatternGroups, getSmallPatterns, getSmallPatternVersion, hasSmallPatternFineConnections, smallPatternIds } from './small';

describe('small patterns selected by occupied motif size', () => {
    it('reuses ten existing patterns in three ascending bead-count groups', () => {
        const selected = getSmallPatterns();
        const groups = getSmallPatternGroups();
        expect(selected).toHaveLength(10);
        expect(new Set(selected.map(pattern => pattern.id)).size).toBe(10);
        expect(selected.map(pattern => pattern.beads)).toEqual([54, 65, 122, 143, 144, 176, 190, 199, 212, 254]);
        expect(groups.map(group => group.patterns.length)).toEqual([5, 3, 2]);
        expect(groups.flatMap(group => group.patterns)).toEqual(selected);
        expect(getPatternsForTopic(getPatternTopicBySlug('small')!)).toEqual(selected);
        for (const group of groups) {
            for (const pattern of group.patterns) {
                expect(pattern).toBe(getPatternById(pattern.id));
                expect(pattern.beads).toBeGreaterThanOrEqual(group.min);
                expect(pattern.beads).toBeLessThanOrEqual(group.max);
                expect(pattern.motifWidth).toBeLessThanOrEqual(16);
                expect(pattern.motifHeight).toBeLessThanOrEqual(16);
                expect(pattern.colorCount).toBeLessThanOrEqual(4);
                expect(pattern.assets.pdfLetter).toBeUndefined();
            }
        }
    });

    it('measures occupied RGBA cells rather than the 29×29 blank board', async () => {
        for (const pattern of getSmallPatterns()) {
            const project = parseEditorProject(await readFile(path.join(process.cwd(), 'public', pattern.assets.project), 'utf8'))!;
            expect([project.boardId, project.boardWidth, project.boardHeight]).toEqual(['midi', 1, 1]);
            expect(project.selectedPaletteIds).toEqual(['perler']);
            const grid = project.editedPattern!;
            expect([grid.width, grid.height]).toEqual([29, 29]);
            const rgba = Buffer.from(grid.data, 'base64');
            const xs: number[] = [], ys: number[] = [];
            const colors = new Set<string>();
            for (let cell = 0; cell < grid.width * grid.height; cell++) {
                if (rgba[cell * 4 + 3] === 0) continue;
                xs.push(cell % grid.width);
                ys.push(Math.floor(cell / grid.width));
                colors.add(rgba.subarray(cell * 4, cell * 4 + 4).toString('hex'));
            }
            expect(xs.length).toBe(pattern.beads);
            expect(colors.size).toBe(pattern.colorCount);
            expect([Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1])
                .toEqual([pattern.motifWidth, pattern.motifHeight]);
            expect(xs.length).toBeLessThan(29 * 29);
        }
    });

    it('retains the four existing fine-connection disclosures and the exact source versions', () => {
        const selected = getSmallPatterns();
        expect(selected.filter(hasSmallPatternFineConnections).map(pattern => pattern.id)).toEqual(smallPatternIds.slice(0, 4));
        for (const pattern of selected) {
            for (const locale of ['en', 'de', 'fr', 'ja'] as const) expect(getSmallPatternVersion(pattern, locale).length).toBeGreaterThan(0);
            if (pattern.id === 'smb-small-mario') expect(getSmallPatternVersion(pattern, 'en')).toBe('Small Mario · Super Mario Bros. (NES)');
            else expect(getSmallPatternVersion(pattern, 'en')).toBe(pattern.version);
        }
    });

    it('keeps native PDF and PNG files available without invented Letter downloads', async () => {
        for (const pattern of getSmallPatterns()) {
            for (const locale of ['de', 'fr', 'ja'] as const) {
                const pdf = getLocalizedPatternPdf(pattern, locale);
                const png = getLocalizedPatternGrid(pattern, locale);
                expect(pdf.language).toBe(locale);
                expect(png.language).toBe(locale);
                expect(getLocalizedPatternLetterPdf(pattern, locale)).toBeUndefined();
                expect((await readFile(path.join(process.cwd(), 'public', pdf.href))).subarray(0, 5).toString()).toBe('%PDF-');
                expect((await readFile(path.join(process.cwd(), 'public', png.href))).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
            }
        }
    });
});

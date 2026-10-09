import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { localeRoutes } from '../i18n/routes';
import { chartsEqual, getCounts, getRowInstructions, parseProject, serializeProject } from './core';
import { getLoomPattern, getLoomPatternChart, loomPatternAssetPath, loomPatternLibraryPaths, loomPatternMakerPaths, loomPatterns, type LoomPatternLocale } from './patterns';

const locales: LoomPatternLocale[] = ['en', 'de', 'fr', 'ja'];
const counts: Record<string, Record<string, number>> = {
    'heart-band': { A: 396, B: 135, C: 140 },
    'chevron-band': { A: 395, B: 111, C: 110, D: 55 },
    'diamond-band': { A: 480, B: 100, C: 60, D: 31 },
};
const readAsset = (path: string) => readFileSync(resolve(process.cwd(), `public${path}`));

describe('downloadable original bead loom patterns', () => {
    for (const locale of locales) {
        it(`${locale}: the native gallery link resolves to a real page with the correct library language`, () => {
            const route = localeRoutes[locale].beadLoomPatterns;
            const page = resolve(process.cwd(), 'src/app', locale === 'en' ? '(english)' : '', route.slice(1), 'page.tsx');
            expect(existsSync(page)).toBe(true);
            const source = readFileSync(page, 'utf8');
            expect(source).toMatch(/import LoomPatternLibrary from ['"]@\/components\/bead-loom\/LoomPatternLibrary['"]/);
            expect(source).toMatch(new RegExp(`<LoomPatternLibrary\\s+locale=["']${locale}["']\\s*\\/>`));
        });
    }

    it('keeps three distinct complete designs with usable generic colors', () => {
        expect(loomPatterns.map(pattern => pattern.id)).toEqual(['heart-band', 'chevron-band', 'diamond-band']);
        expect(new Set(loomPatterns.map(pattern => pattern.symbolRows.join(''))).size).toBe(3);
        for (const locale of locales) {
            expect(loomPatternLibraryPaths[locale]).toBe(localeRoutes[locale].beadLoomPatterns);
            expect(loomPatternMakerPaths[locale]).toBe(localeRoutes[locale].beadLoom);
        }
        for (const pattern of loomPatterns) {
            expect(pattern.beadCount).toBe(671);
            expect(pattern.colorCount).toBeGreaterThanOrEqual(3);
            expect(pattern.colorCount).toBeLessThanOrEqual(4);
            expect(pattern.symbolRows).toHaveLength(61);
            expect(pattern.symbolRows.every(row => row.length === 11)).toBe(true);
            for (const locale of locales) {
                expect(pattern.titles[locale].length).toBeGreaterThan(3);
                expect(pattern.descriptions[locale].length).toBeGreaterThan(10);
                expect(pattern.palette.every(color => color.labels[locale].length > 0)).toBe(true);
            }
        }
        // Visible motif fixtures detect accidental empty/tall-grid or generic-placeholder replacement.
        expect(getLoomPattern('heart-band')!.symbolRows[6]).toBe('CABBBBBBBAC');
        expect(getLoomPattern('chevron-band')!.symbolRows[6]).toBe('BCCDAAADCCB');
        expect(getLoomPattern('diamond-band')!.symbolRows[6]).toBe('BACADDDACAB');
    });

    for (const pattern of loomPatterns) {
        for (const locale of locales) {
            it(`${pattern.id}/${locale}: imports the public project in the current editor without data loss`, () => {
                const raw = readAsset(loomPatternAssetPath(pattern.id, locale, 'project')).toString('utf8');
                const downloaded = parseProject(raw);
                const expected = getLoomPatternChart(pattern.id, locale);
                expect(chartsEqual(downloaded, expected)).toBe(true);
                expect(chartsEqual(parseProject(serializeProject(downloaded)), downloaded)).toBe(true);
                expect(downloaded).toMatchObject({ columns: 11, rows: 61, cellAspect: 1, startCorner: 'bottom-left', serpentine: true });
                expect(downloaded.cells).toHaveLength(671);
                expect(downloaded.palette.every(color => color.code === '')).toBe(true);
                const actualCounts = Object.fromEntries(getCounts(downloaded).map(color => [color.symbol, color.count]));
                expect(actualCounts).toEqual(counts[pattern.id]);
                expect(getCounts(downloaded).reduce((sum, color) => sum + color.count, 0)).toBe(671);
                const english = getLoomPatternChart(pattern.id, 'en');
                expect(downloaded.cells).toEqual(english.cells);
                expect(downloaded.palette.map(({ id, hex, symbol }) => ({ id, hex, symbol })))
                    .toEqual(english.palette.map(({ id, hex, symbol }) => ({ id, hex, symbol })));
                expect(downloaded.title).toBe(pattern.titles[locale]);
                expect(downloaded.palette.map(color => color.name)).toEqual(pattern.palette.map(color => color.labels[locale]));
            });
        }

        it(`${pattern.id}: reconstructs the actual public project independently from all 61 read-order rows`, () => {
            const chart = parseProject(readAsset(loomPatternAssetPath(pattern.id, 'en', 'project')).toString('utf8'));
            const instructions = getRowInstructions(chart);
            expect(instructions.map(row => row.rowNumber)).toEqual(Array.from({ length: 61 }, (_, index) => index + 1));
            const reconstructed: string[][] = Array.from({ length: 61 }, () => Array<string>(11));
            for (const instruction of instructions) {
                const reading = instruction.runs.flatMap(run => Array<string>(run.count).fill(run.symbol));
                expect(reading).toHaveLength(11);
                const row = instruction.rowNumber;
                const expectedDirection = row % 2 === 1 ? 'left-to-right' : 'right-to-left';
                expect(instruction.direction).toBe(expectedDirection);
                expect(instruction.y).toBe(61 - row);
                for (let step = 0; step < 11; step++) {
                    // Place each counted bead independently, without using instruction.y or core helpers.
                    const x = row % 2 === 1 ? step : 10 - step;
                    reconstructed[61 - row][x] = reading[step];
                }
            }
            const byId = new Map(chart.palette.map(color => [color.id, color.symbol]));
            expect(reconstructed.map(row => row.join(''))).toEqual(pattern.symbolRows);
            expect(reconstructed.flat()).toEqual(chart.cells.map(id => byId.get(id)));
        });

        it(`${pattern.id}: provides native PDFs in both paper sizes and stable shared image assets`, () => {
            const svg = readAsset(loomPatternAssetPath(pattern.id, 'en', 'preview')).toString('utf8');
            expect(svg).toContain('viewBox="0 0 768 180"');
            expect(svg.match(/data-symbol="[A-D]"/g)).toHaveLength(671);
            const png = readAsset(loomPatternAssetPath(pattern.id, 'en', 'png'));
            expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
            expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([490, 2140]);
            for (const locale of locales) {
                expect(loomPatternAssetPath(pattern.id, locale, 'preview')).toBe(loomPatternAssetPath(pattern.id, 'en', 'preview'));
                expect(loomPatternAssetPath(pattern.id, locale, 'png')).toBe(loomPatternAssetPath(pattern.id, 'en', 'png'));
                for (const paper of ['a4', 'letter'] as const) {
                    const pdf = readAsset(loomPatternAssetPath(pattern.id, locale, 'pdf', paper));
                    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
                    expect(pdf.length).toBeGreaterThan(20000);
                    const nativePdf = pdf.toString('latin1');
                    expect(nativePdf).toContain('/ToUnicode');
                    expect(nativePdf).toContain('/FontFile2');
                    // The generator separately parses per-page annotations with pypdf.
                    // Match the site's path contract; the four page-file checks above
                    // independently verify that those paths actually serve the library.
                    for (const route of [localeRoutes[locale].beadLoomPatterns, `${localeRoutes[locale].beadLoom}?pattern=${pattern.id}`]) {
                        expect(nativePdf.split(`/URI (https://fusebeadpatterns.art${route})`).length - 1).toBe(2);
                    }
                }
            }
        });
    }

    it('isolates mutable editor charts and rejects unknown asset routes', () => {
        const chart = getLoomPatternChart('heart-band', 'ja');
        chart.cells[0] = 'color-a'; chart.palette[0].name = 'changed'; chart.title = 'changed';
        const fresh = getLoomPatternChart('heart-band', 'ja');
        expect(fresh.cells[0]).toBe('color-c');
        expect(fresh.palette[0].name).toBe('アイボリー');
        expect(fresh.title).toBe('ハートの帯');
        expect(getLoomPattern('unknown')).toBeUndefined();
        expect(() => getLoomPatternChart('unknown')).toThrow();
        expect(() => loomPatternAssetPath('../unknown', 'en', 'pdf')).toThrow();
    });
});

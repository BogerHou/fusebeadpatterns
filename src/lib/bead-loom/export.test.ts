import { describe, expect, it } from 'vitest';
import type { LoomChart, LoomColor } from './core';
import { planLoomPdf, wrapLoomLabel, type LoomPaper } from './export';
import { LOOM_EXPORT_MESSAGES, type LoomExportLocale } from './export-messages';

function example(columns = 17, rows = 31, aspect = 1, paletteSize = 5): LoomChart {
    const palette: LoomColor[] = Array.from({ length: paletteSize }, (_, index) => ({
        id: `color-${index}`, symbol: String.fromCharCode(65 + index),
        name: `Color ${index + 1}`, code: `CUSTOM-${index + 1}`, hex: index % 2 ? '#293B36' : '#F3E9D3',
    }));
    return { title: 'A loom reading chart', columns, rows, cellAspect: aspect, palette, backgroundId: palette[0].id,
        cells: Array.from({ length: columns * rows }, (_, index) => palette[index % palette.length].id),
        startCorner: 'bottom-left', serpentine: true };
}

describe('bead loom PDF pagination', () => {
    it('keeps the original English layout and labels when no locale is supplied', () => {
        const chart = example();
        expect(planLoomPdf(chart, 'a4')).toEqual(planLoomPdf(chart, 'a4', 'en'));
        const plan = planLoomPdf(chart, 'a4');
        expect(plan.contentTop).toBe(103);
        expect(plan.tiles[0]).toMatchObject({ left: 79, top: 143, cellWidth: 12, cellHeight: 12, width: 204, height: 372 });
        expect(plan.legendPages[0][0]).toMatchObject({ y: 134, height: 56, lines: ['Name: Color 1', 'Code: CUSTOM-1', 'HEX #F3E9D3 | 106 beads'] });
        expect(plan.instructionPages[0][0]).toMatchObject({ y: 138, height: 44, headingLines: ['Row 1 | left-to-right | columns 1 to 17'] });
    });

    it.each<LoomPaper>(['a4', 'letter'])('covers every cell exactly once inside %s print margins, including extreme shapes', paper => {
        for (const [columns, rows, aspect] of [[1, 400, 0.5], [100, 1, 2], [100, 200, 0.5], [50, 400, 2], [100, 200, 1], [1, 1, 1]]) {
            const chart = example(columns, rows, aspect);
            const plan = planLoomPdf(chart, paper);
            const coverage = new Uint8Array(chart.cells.length);
            for (const tile of plan.tiles) {
                expect(tile.x0).toBeGreaterThanOrEqual(0);
                expect(tile.x1).toBeLessThanOrEqual(columns);
                expect(tile.y0).toBeGreaterThanOrEqual(0);
                expect(tile.y1).toBeLessThanOrEqual(rows);
                expect(tile.x1).toBeGreaterThan(tile.x0);
                expect(tile.y1).toBeGreaterThan(tile.y0);
                expect(tile.left).toBeGreaterThanOrEqual(36);
                expect(tile.left + tile.width).toBeLessThanOrEqual(plan.width - 36);
                expect(tile.top).toBeGreaterThan(plan.contentTop);
                const directionExplanationBaseline = plan.contentTop + 13;
                const rowAndColumnLabelBaseline = tile.top - 9;
                expect(rowAndColumnLabelBaseline - directionExplanationBaseline).toBeGreaterThanOrEqual(12);
                expect(tile.top + tile.height).toBeLessThanOrEqual(plan.contentBottom);
                expect(tile.cellWidth / tile.cellHeight).toBeCloseTo(aspect, 10);
                expect(tile.symbolSize).toBeGreaterThanOrEqual(8);
                expect(tile.cellWidth).toBeGreaterThanOrEqual(12);
                expect(tile.cellHeight).toBeGreaterThanOrEqual(12);
                for (let y = tile.y0; y < tile.y1; y++) for (let x = tile.x0; x < tile.x1; x++) coverage[y * columns + x]++;
            }
            expect(coverage.every(count => count === 1)).toBe(true);
            expect(plan.pageCount).toBe(1 + plan.tiles.length + plan.legendPages.length + plan.instructionPages.length);
        }
    });

    it.each<LoomPaper>(['a4', 'letter'])('paginates 26 long Unicode names and exact user codes without losing characters on %s', paper => {
        const chart = example(100, 200, 0.5, 26);
        chart.title = '中'.repeat(80);
        chart.palette = chart.palette.map((color, index) => ({ ...color, name: `${index}`.padStart(2, '0') + '蓝'.repeat(58), code: 'Å-色号/'.repeat(8) }));
        const plan = planLoomPdf(chart, paper);
        expect(plan.titleLines.join('')).toBe(chart.title);
        expect(plan.legendPages.length).toBeGreaterThan(1);
        const entries = plan.legendPages.flat();
        expect(entries).toHaveLength(26);
        expect(entries.reduce((count, item) => count + item.count, 0)).toBe(chart.cells.length);
        expect(new Set(entries.map(item => item.symbol)).size).toBe(26);
        for (const [index, item] of entries.entries()) {
            expect(item.lines.join('')).toContain(`Name: ${chart.palette[index].name}Code: ${chart.palette[index].code}`);
            expect(item.lines.join('')).toContain(chart.palette[index].hex);
        }
        for (const page of plan.legendPages) {
            let previousBottom = plan.contentTop;
            for (const entry of page) {
                expect(entry.y).toBeGreaterThanOrEqual(previousBottom);
                expect(entry.y + entry.height).toBeLessThanOrEqual(plan.contentBottom);
                previousBottom = entry.y + entry.height;
            }
        }
    });

    it('uses the requested physical paper dimensions', () => {
        expect(planLoomPdf(example(), 'a4')).toMatchObject({ width: 595.28, height: 841.89 });
        expect(planLoomPdf(example(), 'letter')).toMatchObject({ width: 612, height: 792 });
        expect(() => planLoomPdf(example(), 'a3' as LoomPaper)).toThrow();
    });

    it.each<LoomChart['startCorner']>(['bottom-left', 'bottom-right', 'top-left', 'top-right'])('prints complete logical rows and the correct directions from %s', startCorner => {
        for (const serpentine of [true, false]) {
            const chart = { ...example(100, 200, 2, 26), startCorner, serpentine };
            const plan = planLoomPdf(chart, 'letter');
            const instructions = plan.instructionPages.flat();
            expect(instructions).toHaveLength(chart.rows);
            expect(instructions.map(row => row.rowNumber)).toEqual(Array.from({ length: chart.rows }, (_, index) => index + 1));
            for (const [index, row] of instructions.entries()) {
                const startsRight = startCorner.endsWith('right');
                const fromRight = startsRight !== (serpentine && index % 2 === 1);
                expect(row.direction).toBe(fromRight ? 'right-to-left' : 'left-to-right');
                const y = startCorner.startsWith('bottom') ? chart.rows - index - 1 : index;
                const expected = chart.cells.slice(y * chart.columns, (y + 1) * chart.columns);
                if (fromRight) expected.reverse();
                const bySymbol = new Map(chart.palette.map(color => [color.symbol, color.id]));
                const decoded = row.lines.flatMap(line => line.split(/\s+/).flatMap(token => {
                    const match = token.match(/^(\d+)([A-Z])$/)!;
                    return Array(Number(match[1])).fill(bySymbol.get(match[2]));
                }));
                expect(decoded).toEqual(expected);
            }
            for (const tile of plan.tiles) {
                expect(tile.firstRow).toBe(startCorner.startsWith('bottom') ? chart.rows - tile.y0 : tile.y0 + 1);
                expect(tile.lastRow).toBe(startCorner.startsWith('bottom') ? chart.rows - tile.y1 + 1 : tile.y1);
            }
            for (const page of plan.instructionPages) {
                let previousBottom = plan.contentTop;
                for (const row of page) {
                    expect(row.y).toBeGreaterThanOrEqual(previousBottom);
                    expect(row.y + row.height).toBeLessThanOrEqual(plan.contentBottom);
                    previousBottom = row.y + row.height;
                }
            }
        }
    });

    it('counts background beads and retains unused palette symbols', () => {
        const chart = example(1, 1, 1, 26);
        const key = planLoomPdf(chart, 'a4').legendPages.flat();
        expect(key).toHaveLength(26);
        expect(key[0]).toMatchObject({ symbol: 'A', count: 1 });
        expect(key.at(-1)).toMatchObject({ symbol: 'Z', count: 0 });
    });

    it('rejects invalid data before planning any output', () => {
        const invalid = example(); invalid.cells.pop();
        expect(() => planLoomPdf(invalid, 'a4')).toThrow();
    });
});

describe('localized bead loom reading exports', () => {
    it.each<LoomExportLocale>(['en', 'de', 'fr', 'ja'])('keeps user data, every cell and every logical row intact in %s on both paper sizes', locale => {
        for (const paper of ['a4', 'letter'] as const) {
            for (const [columns, rows, aspect] of [[1, 400, 0.5], [100, 1, 2], [100, 200, 0.5], [50, 400, 2], [17, 31, 1]]) {
                const chart = example(columns, rows, aspect, 26);
                chart.title = '🧵原文'.repeat(20);
                chart.palette = chart.palette.map((color, index) => ({ ...color,
                    name: `${index}`.padStart(2, '0') + '蓝'.repeat(58), code: 'Å-色号/'.repeat(8),
                }));
                const before = structuredClone(chart);
                const plan = planLoomPdf(chart, paper, locale);
                const messages = LOOM_EXPORT_MESSAGES[locale];
                expect(chart).toEqual(before);
                expect(plan.locale).toBe(locale);
                expect(plan.titleLines.join('')).toBe(chart.title);
                const coverage = new Uint8Array(chart.cells.length);
                for (const tile of plan.tiles) {
                    expect(tile.left + tile.width).toBeLessThanOrEqual(plan.width - 36);
                    expect(tile.top + tile.height).toBeLessThanOrEqual(plan.contentBottom);
                    const lastNoticeBaseline = plan.contentTop + 13 + (plan.tileNoticeLines.length - 1) * 12;
                    expect(tile.top - 9 - lastNoticeBaseline).toBeGreaterThanOrEqual(12);
                    expect(tile.symbolSize).toBe(9);
                    for (let y = tile.y0; y < tile.y1; y++) for (let x = tile.x0; x < tile.x1; x++) coverage[y * columns + x]++;
                }
                expect(coverage.every(count => count === 1)).toBe(true);
                const entries = plan.legendPages.flat();
                expect(entries).toHaveLength(26);
                expect(entries.reduce((count, item) => count + item.count, 0)).toBe(chart.cells.length);
                for (const [index, item] of entries.entries()) {
                    expect(item.lines.join('')).toContain(`${messages.name}: ${chart.palette[index].name}${messages.code}: ${chart.palette[index].code}`);
                    expect(item.lines.join('')).toContain(messages.count(chart.palette[index].hex, item.count));
                }
                for (const page of plan.legendPages) for (const entry of page) expect(entry.y + entry.height).toBeLessThanOrEqual(plan.contentBottom);
                const instructions = plan.instructionPages.flat();
                expect(instructions.map(row => row.rowNumber)).toEqual(Array.from({ length: rows }, (_, index) => index + 1));
                for (const row of instructions) {
                    expect(row.y + row.height).toBeLessThanOrEqual(plan.contentBottom);
                    expect(row.headingLines.join('')).toBe(messages.rowHeading(row.rowNumber, row.direction, columns));
                    expect(row.lines.join(' ').split(/\s+/).reduce((sum, token) => sum + Number(token.match(/^(\d+)[A-Z]$/)![1]), 0)).toBe(columns);
                }
            }
        }
    });

    it.each<LoomExportLocale>(['de', 'fr', 'ja'])('wraps native descriptions and instruction headings at readable sizes in %s', locale => {
        const chart = example(100, 200, 1);
        const plan = planLoomPdf(chart, 'letter', locale);
        const messages = LOOM_EXPORT_MESSAGES[locale];
        expect(plan.keyNoticeLines.join('')).toBe(messages.keyNotice);
        expect(plan.tileNoticeLines.join('')).toBe(messages.tileNotice);
        expect(plan.instructionNoticeLines.join('')).toBe(messages.instructionsNotice);
        if (locale !== 'ja') expect(plan.instructionNoticeLines.length).toBeGreaterThan(1);
        expect(plan.keyNoticeLines.every(line => Array.from(line).length <= Math.floor((plan.width - 72) / (9 * 1.1)))).toBe(true);
        expect(plan.instructionPages.flat().every(item => item.headingLines.every(line => Array.from(line).length <= Math.floor((plan.width - 72) / (10 * 1.1))))).toBe(true);
        expect(plan.instructionPages.flat().map(item => item.lines)).toEqual(planLoomPdf(chart, 'letter').instructionPages.flat().map(item => item.lines));
    });

    it.each<LoomExportLocale>(['de', 'fr', 'ja'])('translates starting corners and directions without leaking model enum values in %s', locale => {
        const messages = LOOM_EXPORT_MESSAGES[locale];
        for (const startCorner of ['bottom-left', 'bottom-right', 'top-left', 'top-right'] as const) {
            const chart = { ...example(), startCorner };
            expect(messages.overviewSettings(chart)).not.toContain(startCorner);
            expect(messages.pngSummary(chart)).not.toContain(startCorner);
        }
        for (const direction of ['left-to-right', 'right-to-left'] as const) {
            expect(messages.rowHeading(1, direction, 17)).not.toContain(direction);
        }
        expect(planLoomPdf({ ...example(), title: '' }, 'a4', locale).titleLines.join('')).toBe(messages.untitled);
    });
});

describe('Unicode label wrapping', () => {
    it('prefers spaces while preserving exact text and splits only oversized tokens by code point', () => {
        expect(wrapLoomLabel('bead loom reading chart', 110, 10)).toEqual(['bead loom ', 'reading ', 'chart']);
        const longToken = 'Code: ' + '色'.repeat(23);
        const wrapped = wrapLoomLabel(longToken, 110, 10);
        expect(wrapped).toEqual(['Code: ', '色'.repeat(10), '色'.repeat(10), '色'.repeat(3)]);
        expect(wrapped.join('')).toBe(longToken);
        const notice = 'Chart for reading, not actual size. Cell proportions are a visual guide, not physical weave dimensions.';
        const noticeLines = wrapLoomLabel(notice, 724, 13);
        expect(noticeLines.join('')).toBe(notice);
        expect(noticeLines.join('\n')).toContain('proportions');
        expect(noticeLines.join('\n')).toContain('dimensions.');
    });

    it('preserves names, exact codes, spaces, and whole Unicode code points', () => {
        const label = 'Color code: Å色-009 🧵  extra spaces';
        const lines = wrapLoomLabel(label, 60, 10);
        expect(lines.join('')).toBe(label);
        expect(lines.every(line => Array.from(line).length <= 5)).toBe(true);
        expect(lines.some(line => line.includes('🧵'))).toBe(true);
        expect(wrapLoomLabel('', 100, 10)).toEqual(['']);
    });
});

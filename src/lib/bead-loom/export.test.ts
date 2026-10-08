import { describe, expect, it } from 'vitest';
import type { LoomChart, LoomColor } from './core';
import { planLoomPdf, wrapLoomLabel, type LoomPaper } from './export';

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

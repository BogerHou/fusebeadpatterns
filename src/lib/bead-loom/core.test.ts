import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
    LIMITS, chartsEqual, convertImage, createChart, getCounts, getRowInstructions,
    paintLine, parseProject, replaceColor, rowNumberAt, serializeProject, validateChart,
    type LoomChart, type LoomColor, type LoomImageSource,
} from './core';

function fixture(): LoomChart {
    const chart = createChart(4, 3);
    chart.cells = ['A', 'A', 'B', 'C', 'C', 'B', 'B', 'A', 'B', 'C', 'A', 'A'].map(symbol => `color-${symbol.toLowerCase()}`);
    return chart;
}

function expandedRows(chart: LoomChart): string[] {
    return getRowInstructions(chart).map(row => row.runs.map(run => run.symbol.repeat(run.count)).join(''));
}

function customChart(columns: number, rows: number, hexes: string[]): LoomChart {
    const chart = createChart(columns, rows);
    chart.palette = hexes.map((hex, index) => ({ id: `c${index}`, symbol: String.fromCharCode(65 + index), name: '', code: '', hex }));
    chart.backgroundId = 'c0';
    chart.cells.fill('c0');
    return chart;
}

test('defaults describe a fully occupied 11 × 31 loom with independent custom colors', () => {
    const chart = createChart();
    assert.equal(chart.columns, 11);
    assert.equal(chart.rows, 31);
    assert.equal(chart.cells.length, 341);
    assert.ok(chart.cells.every(id => id === chart.backgroundId));
    assert.equal(chart.palette.find(color => color.id === chart.backgroundId)?.symbol, 'A');
    assert.ok(chart.palette.length >= 4 && chart.palette.length <= 6);
    assert.ok(chart.palette.every(color => color.code === ''));
    const other = createChart();
    chart.palette[0].name = 'Changed';
    chart.cells[0] = chart.palette[1].id;
    assert.notEqual(other.palette[0].name, chart.palette[0].name);
    assert.equal(other.cells[0], other.backgroundId);
});

test('all four starting corners and both direction modes have manually calculated row order', () => {
    const expected: Array<[LoomChart['startCorner'], boolean, string[], number[], string[]]> = [
        ['bottom-left', false, ['BCAA', 'CBBA', 'AABC'], [2, 1, 0], ['left-to-right', 'left-to-right', 'left-to-right']],
        ['bottom-left', true, ['BCAA', 'ABBC', 'AABC'], [2, 1, 0], ['left-to-right', 'right-to-left', 'left-to-right']],
        ['bottom-right', false, ['AACB', 'ABBC', 'CBAA'], [2, 1, 0], ['right-to-left', 'right-to-left', 'right-to-left']],
        ['bottom-right', true, ['AACB', 'CBBA', 'CBAA'], [2, 1, 0], ['right-to-left', 'left-to-right', 'right-to-left']],
        ['top-left', false, ['AABC', 'CBBA', 'BCAA'], [0, 1, 2], ['left-to-right', 'left-to-right', 'left-to-right']],
        ['top-left', true, ['AABC', 'ABBC', 'BCAA'], [0, 1, 2], ['left-to-right', 'right-to-left', 'left-to-right']],
        ['top-right', false, ['CBAA', 'ABBC', 'AACB'], [0, 1, 2], ['right-to-left', 'right-to-left', 'right-to-left']],
        ['top-right', true, ['CBAA', 'CBBA', 'AACB'], [0, 1, 2], ['right-to-left', 'left-to-right', 'right-to-left']],
    ];
    for (const [startCorner, serpentine, rows, ys, directions] of expected) {
        const chart = { ...fixture(), startCorner, serpentine };
        const instructions = getRowInstructions(chart);
        assert.deepEqual(expandedRows(chart), rows, `${startCorner}, alternating=${serpentine}`);
        assert.deepEqual(instructions.map(row => row.y), ys);
        assert.deepEqual(instructions.map(row => row.direction), directions);
        assert.deepEqual(instructions.map(row => row.rowNumber), [1, 2, 3]);
        for (const row of instructions) assert.equal(rowNumberAt(chart, row.y), row.rowNumber);
    }
    assert.deepEqual(getRowInstructions(fixture())[0].runs, [{ symbol: 'B', count: 1 }, { symbol: 'C', count: 1 }, { symbol: 'A', count: 2 }]);
    for (const y of [-1, 3, 0.5, NaN]) assert.throws(() => rowNumberAt(fixture(), y));
});

test('counts include background and unused entries, without changing palette order or symbols', () => {
    const chart = fixture();
    chart.palette = [chart.palette[2], chart.palette[4], chart.palette[0], chart.palette[3], chart.palette[1]];
    chart.palette[0].symbol = 'Z';
    const counts = getCounts(chart);
    assert.deepEqual(counts.map(({ symbol, count }) => [symbol, count]), [['Z', 3], ['E', 0], ['A', 5], ['D', 0], ['B', 4]]);
    assert.equal(counts.reduce((sum, color) => sum + color.count, 0), 12);
    assert.deepEqual(expandedRows(chart), ['BZAA', 'ABBZ', 'AABZ']);
    assert.equal(getRowInstructions(chart).every(row => row.runs.reduce((sum, run) => sum + run.count, 0) === 4), true);
    counts[0].name = 'Independent';
    assert.notEqual(chart.palette[0].name, counts[0].name);
});

test('independent 3 × 4 readout oracle agrees on screen coordinates, alternating reads and totals', () => {
    const chart = createChart(3, 4);
    chart.cells = [...'AACDABCDABCD'].map(symbol => `color-${symbol.toLowerCase()}`);
    assert.deepEqual(expandedRows(chart), ['BCD', 'ADC', 'DAB', 'CAA']);
    assert.deepEqual(getCounts(chart).map(({ symbol, count }) => [symbol, count]), [['A', 4], ['B', 2], ['C', 3], ['D', 3], ['E', 0]]);
    assert.deepEqual(getRowInstructions(chart).map(({ rowNumber, y }) => [rowNumber, y]), [[1, 3], [2, 2], [3, 1], [4, 0]]);
});

test('global replacement changes only bead assignments and retains stable zero-count palette entries', () => {
    const before = fixture(), serialized = serializeProject(before);
    const after = replaceColor(before, 'color-b', 'color-c');
    assert.deepEqual(expandedRows(after), ['CCAA', 'ACCC', 'AACC']);
    assert.deepEqual(after.palette, before.palette);
    assert.equal(getCounts(after).find(color => color.symbol === 'B')?.count, 0);
    assert.equal(getCounts(after).find(color => color.symbol === 'C')?.count, 7);
    assert.equal(after.backgroundId, before.backgroundId);
    assert.equal(serializeProject(before), serialized);
    assert.notEqual(after.palette[0], before.palette[0]);
    assert.notEqual(after.cells, before.cells);
    assert.ok(chartsEqual(replaceColor(before, 'color-b', 'color-b'), before));
    assert.throws(() => replaceColor(before, 'missing', 'color-c'));
    assert.throws(() => replaceColor(before, 'color-b', 'missing'));
});

test('horizontal, vertical, steep and diagonal strokes fill exact cells without mutating their source', () => {
    const chart = createChart(5, 5), before = serializeProject(chart);
    const positions = (next: LoomChart) => next.cells.flatMap((id, index) => id === 'color-b' ? [[index % 5, Math.floor(index / 5)]] : []);
    assert.deepEqual(positions(paintLine(chart, [1, 2], [4, 2], 'color-b')), [[1, 2], [2, 2], [3, 2], [4, 2]]);
    assert.deepEqual(positions(paintLine(chart, [2, 4], [2, 1], 'color-b')), [[2, 1], [2, 2], [2, 3], [2, 4]]);
    assert.deepEqual(positions(paintLine(chart, [0, 0], [4, 4], 'color-b')), [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
    assert.deepEqual(positions(paintLine(chart, [4, 0], [2, 4], 'color-b')), [[4, 0], [3, 1], [3, 2], [2, 3], [2, 4]]);
    const painted = paintLine(chart, [3, 2], [3, 2], 'color-b');
    assert.deepEqual(positions(painted), [[3, 2]]);
    assert.ok(chartsEqual(paintLine(painted, [3, 2], [3, 2], painted.backgroundId), chart));
    assert.equal(serializeProject(chart), before);
    for (const point of [[NaN, 0], [0.5, 0], [-1, 0], [5, 0], [0, Infinity]]) {
        assert.throws(() => paintLine(chart, [0, 0], point as [number, number], 'color-b'));
    }
    assert.throws(() => paintLine(chart, [0, 0], [1, 1], 'missing'));
    const sparse = new Array<number>(2); sparse[1] = 0;
    assert.throws(() => paintLine(chart, sparse as [number, number], [1, 1], 'color-b'));
});

test('validation clones cells and every palette entry while preserving Unicode and explicit symbols', () => {
    const chart = fixture();
    chart.title = '双色手链 🧵';
    chart.palette[0] = { ...chart.palette[0], symbol: 'Z', name: '象牙白', code: '自定义-001', hex: '#f4eDdF' };
    const clone = validateChart(chart);
    assert.deepEqual(clone, chart);
    clone.palette[0].name = 'Other';
    clone.cells[0] = 'color-c';
    assert.equal(chart.palette[0].name, '象牙白');
    assert.equal(chart.cells[0], 'color-a');
    assert.deepEqual(parseProject(serializeProject(chart)), chart);
});

test('1 × 400, 100 × 1 and the 20,000-cell boundary remain full rectangles through export/import', () => {
    for (const [columns, rows] of [[1, 400], [100, 1], [50, 400], [100, 200], [17, 31]]) {
        const chart = createChart(columns, rows);
        chart.cellAspect = columns === 1 ? 0.5 : 2;
        const painted = paintLine(chart, [0, 0], [columns - 1, rows - 1], 'color-c');
        const restored = parseProject(serializeProject(painted));
        assert.ok(chartsEqual(painted, restored));
        assert.equal(getCounts(restored).reduce((sum, color) => sum + color.count, 0), columns * rows);
        assert.equal(getRowInstructions(restored).length, rows);
    }
    for (const [columns, rows] of [[0, 1], [101, 1], [1, 401], [100, 201], [51, 400], [1.1, 2], [1, NaN], [Infinity, 1]]) {
        assert.throws(() => createChart(columns, rows));
    }
});

test('schema rejects wrong types, gaps, unknown fields, missing fields and invalid direction settings', () => {
    const chart = createChart(2, 2);
    const missing = { ...chart } as Partial<LoomChart>; delete missing.title;
    const sparse = new Array<string>(4); sparse[0] = chart.backgroundId;
    const cases: unknown[] = [null, [], new Date(), missing, { ...chart, extra: true },
        { ...chart, columns: '2' }, { ...chart, rows: 0 }, { ...chart, title: 1 },
        { ...chart, cells: sparse }, { ...chart, cells: ['color-a'] }, { ...chart, cells: [null, 'color-a', 'color-a', 'color-a'] },
        { ...chart, cells: ['', 'color-a', 'color-a', 'color-a'] }, { ...chart, cells: ['missing', 'color-a', 'color-a', 'color-a'] },
        { ...chart, backgroundId: 'missing' }, { ...chart, startCorner: 'left' }, { ...chart, serpentine: 'true' },
        { ...chart, palette: [] }, { ...chart, palette: new Array(1) }, { ...chart, [Symbol('extra')]: 1 }];
    for (const cellAspect of [0.49, 2.01, NaN, Infinity, '1', null]) cases.push({ ...chart, cellAspect });
    for (const input of cases) assert.throws(() => validateChart(input));
});

test('palette validation enforces unique IDs and A–Z symbols, exact fields and opaque six-digit hex', () => {
    const chart = createChart(1, 1);
    const invalidColors: unknown[] = [null, {}, { ...chart.palette[0], extra: 1 },
        { ...chart.palette[0], id: '' }, { ...chart.palette[0], id: 'x'.repeat(41) }, { ...chart.palette[0], id: 'a b' },
        { ...chart.palette[0], symbol: 'AA' }, { ...chart.palette[0], symbol: 'a' }, { ...chart.palette[0], symbol: '1' },
        { ...chart.palette[0], hex: '#abc' }, { ...chart.palette[0], hex: '#11223344' }, { ...chart.palette[0], hex: 'red' },
        { ...chart.palette[0], name: null }, { ...chart.palette[0], code: 123 }];
    for (const color of invalidColors) assert.throws(() => validateChart({ ...chart, palette: [color, ...chart.palette.slice(1)] }));
    assert.throws(() => validateChart({ ...chart, palette: [chart.palette[0], { ...chart.palette[1], id: chart.palette[0].id }] }));
    assert.throws(() => validateChart({ ...chart, palette: [chart.palette[0], { ...chart.palette[1], symbol: 'A' }] }));
    const colors = Array.from({ length: 26 }, (_, index): LoomColor => ({ id: `c${index}`, symbol: String.fromCharCode(65 + index), name: '', code: '', hex: '#112233' }));
    assert.equal(validateChart({ ...chart, palette: colors, backgroundId: 'c0', cells: ['c0'] }).palette.length, 26);
    assert.throws(() => validateChart({ ...chart, palette: [...colors, { ...colors[0], id: 'c26' }] }));
});

test('text length limits count Unicode characters and permit empty custom codes', () => {
    const chart = createChart(1, 1);
    chart.title = '🧵'.repeat(80);
    chart.palette[0].name = '珠'.repeat(60);
    chart.palette[0].code = 'x'.repeat(40);
    assert.deepEqual(validateChart(chart), chart);
    assert.throws(() => validateChart({ ...chart, title: `${chart.title}x` }));
    for (const [key, value] of [['name', '珠'.repeat(61)], ['code', 'x'.repeat(41)]]) {
        assert.throws(() => validateChart({ ...chart, palette: [{ ...chart.palette[0], [key]: value }] }));
    }
});

test('single-line title, color name and code reject control characters without silently changing text', () => {
    const chart = createChart(1, 1), original = serializeProject(chart);
    for (const control of [...Array.from({ length: 32 }, (_, index) => String.fromCharCode(index)), String.fromCharCode(127)]) {
        assert.throws(() => validateChart({ ...chart, title: `Before${control}after` }), /single line/);
        for (const field of ['name', 'code']) {
            const malformed = { ...chart, palette: [{ ...chart.palette[0], [field]: `Before${control}after` }] };
            assert.throws(() => validateChart(malformed), /single line/);
            assert.throws(() => parseProject(JSON.stringify({ format: 'bead-loom-project', version: 1, chart: malformed })), /single line/);
        }
    }
    assert.equal(serializeProject(chart), original);
});

test('project format is isolated from pixel and fuse-bead projects and rejects unsupported envelope fields', () => {
    const good = JSON.parse(serializeProject(fixture()));
    assert.deepEqual(Object.keys(good), ['format', 'version', 'chart']);
    const invalid = [null, [], {}, { ...good, format: 'pixel-grid-project' }, { type: 'bead-pattern-project-v1', version: 1 },
        { ...good, version: '1' }, { ...good, version: 2 }, { ...good, other: true }, { format: good.format, version: 1 },
        { ...good, chart: { ...good.chart, futureField: true } }];
    for (const input of invalid) assert.throws(() => parseProject(JSON.stringify(input)));
    assert.throws(() => parseProject('{'), /valid JSON/);
    assert.throws(() => parseProject(JSON.stringify(good).replace('"format"', '"__proto__"')));
});

test('project byte limit includes the boundary and rejects oversized UTF-8 before parsing', () => {
    const chart = createChart(1, 1), original = serializeProject(chart);
    const padded = original + ' '.repeat(LIMITS.maxProjectBytes - new TextEncoder().encode(original).length);
    assert.deepEqual(parseProject(padded), chart);
    assert.throws(() => parseProject(padded + ' '), /1 MiB/);
    assert.throws(() => parseProject('é'.repeat(LIMITS.maxProjectBytes / 2 + 1)), /1 MiB/);
    // Even the largest permitted IDs and cell count can save a readable project.
    const largest = createChart(50, 400), longId = 'x'.repeat(40);
    largest.palette[0].id = longId; largest.backgroundId = longId; largest.cells.fill(longId);
    const serialized = serializeProject(largest);
    assert.ok(new TextEncoder().encode(serialized).length < LIMITS.maxProjectBytes);
    assert.deepEqual(parseProject(serialized), largest);
});

test('chart equality detects every editable field, color field, palette order and bead assignment', () => {
    const chart = fixture();
    assert.ok(chartsEqual(chart, validateChart(chart)));
    for (const patch of [{ title: 'Title' }, { columns: 3 }, { rows: 4 }, { cellAspect: 0.8 },
        { backgroundId: 'color-b' }, { startCorner: 'top-left' as const }, { serpentine: false },
        { cells: chart.cells.slice(1) }, { cells: ['color-e', ...chart.cells.slice(1)] }, { palette: [...chart.palette].reverse() }]) {
        assert.equal(chartsEqual(chart, { ...chart, ...patch }), false);
    }
    for (const [field, value] of [['id', 'other'], ['symbol', 'Z'], ['name', 'Other'], ['code', '123'], ['hex', '#000000']]) {
        const changed = validateChart(chart); changed.palette[0] = { ...changed.palette[0], [field]: value };
        assert.equal(chartsEqual(chart, changed), false);
    }
});

test('half-transparent source colors are composited against the selected background before RGB matching', () => {
    const chart = customChart(4, 1, ['#000000', '#FFFFFF', '#808080', '#FF0000', '#800000']);
    const source = { width: 4, height: 1, pixels: [255, 255, 255, 128, 255, 0, 0, 128, 255, 0, 0, 0, 255, 0, 0, 255] };
    const before = serializeProject(chart);
    assert.deepEqual(convertImage(source, chart, 'stretch').cells, ['c2', 'c4', 'c0', 'c3']);
    chart.backgroundId = 'c1';
    source.pixels.splice(0, 4, 0, 0, 0, 128);
    assert.equal(convertImage(source, chart, 'stretch').cells[0], 'c2');
    assert.equal(convertImage(source, chart, 'stretch').cells[2], 'c1');
    chart.backgroundId = 'c0';
    assert.equal(serializeProject(chart), before);
});

test('fully transparent hidden RGB uses the exact background ID even when palette hex values duplicate', () => {
    const chart = customChart(1, 1, ['#224466', '#224466', '#FF0000']);
    chart.backgroundId = 'c1';
    const result = convertImage({ width: 1, height: 1, pixels: [255, 0, 0, 0] }, chart, 'fit');
    assert.deepEqual(result.cells, ['c1']);
    assert.equal(getCounts(result).find(color => color.id === 'c1')?.count, 1);
});

test('independent alpha oracle: 128-alpha red over blue is exactly #80007F and zero-alpha red stays blue', () => {
    const chart = customChart(2, 1, ['#0000FF', '#FF0000', '#80007F', '#800080']);
    const result = convertImage({ width: 2, height: 1, pixels: [255, 0, 0, 128, 255, 0, 0, 0] }, chart, 'stretch');
    assert.deepEqual(result.cells, ['c2', 'c0']);
});

test('nearest RGB matching uses all three channels and resolves equal distances by palette order', () => {
    const chart = customChart(3, 1, ['#000000', '#000002', '#003300', '#220000']);
    const result = convertImage({ width: 3, height: 1, pixels: [0, 0, 1, 255, 0, 48, 0, 255, 30, 0, 0, 255] }, chart, 'stretch');
    assert.deepEqual(result.cells, ['c0', 'c2', 'c3']);
});

test('fit, crop and stretch account for physical bead aspect with exact source-center sampling', () => {
    const hexes = Array.from({ length: 17 }, (_, index) => `#${(index * 15).toString(16).padStart(2, '0').repeat(3)}`);
    const chart = customChart(4, 4, hexes);
    chart.cellAspect = 2;
    const source: LoomImageSource = { width: 4, height: 4, pixels: Array.from({ length: 16 }, (_, index) => [...Array(3).fill((index + 1) * 15), 255]).flat() };
    const before = serializeProject(chart), originalPixels = [...source.pixels];
    assert.deepEqual(convertImage(source, chart, 'fit').cells, [
        'c0', 'c2', 'c4', 'c0', 'c0', 'c6', 'c8', 'c0',
        'c0', 'c10', 'c12', 'c0', 'c0', 'c14', 'c16', 'c0',
    ]);
    assert.deepEqual(convertImage(source, chart, 'crop').cells, [
        'c5', 'c6', 'c7', 'c8', 'c5', 'c6', 'c7', 'c8',
        'c9', 'c10', 'c11', 'c12', 'c9', 'c10', 'c11', 'c12',
    ]);
    assert.deepEqual(convertImage(source, chart, 'stretch').cells, Array.from({ length: 16 }, (_, index) => `c${index + 1}`));
    chart.cellAspect = 0.5;
    assert.deepEqual(convertImage(source, chart, 'fit').cells, [
        'c0', 'c0', 'c0', 'c0', 'c5', 'c6', 'c7', 'c8',
        'c13', 'c14', 'c15', 'c16', 'c0', 'c0', 'c0', 'c0',
    ]);
    assert.deepEqual(convertImage(source, chart, 'crop').cells, [
        'c2', 'c2', 'c3', 'c3', 'c6', 'c6', 'c7', 'c7',
        'c10', 'c10', 'c11', 'c11', 'c14', 'c14', 'c15', 'c15',
    ]);
    chart.cellAspect = 2;
    assert.equal(serializeProject(chart), before);
    assert.deepEqual([...source.pixels], originalPixels);
});

test('fit fills margins with actual background beads and keeps extreme thin images visible', () => {
    const chart = customChart(5, 5, ['#FFFFFF', '#000000']);
    chart.backgroundId = 'c1';
    const result = convertImage({ width: 4, height: 2, pixels: new Uint8Array(4 * 2 * 4).fill(255) }, chart, 'fit');
    assert.deepEqual(result.cells, ['c1', 'c1', 'c1', 'c1', 'c1', ...new Array<string>(15).fill('c0'), 'c1', 'c1', 'c1', 'c1', 'c1']);
    assert.deepEqual(getCounts(result).map(color => color.count), [15, 10]);
    const thin = customChart(100, 1, ['#000000', '#FFFFFF']);
    const narrow = convertImage({ width: 1, height: 400, pixels: new Uint8Array(1600).fill(255) }, thin, 'fit');
    assert.equal(narrow.cells.filter(id => id === 'c1').length, 1);
    assert.equal(narrow.cells[49], 'c1');
    const tall = customChart(1, 400, ['#000000', '#FFFFFF']);
    const wide = convertImage({ width: 100, height: 1, pixels: new Uint8Array(400).fill(255) }, tall, 'fit');
    assert.equal(wide.cells.filter(id => id === 'c1').length, 1);
    assert.equal(wide.cells[199], 'c1');
});

test('source limits and malformed RGBA are rejected before conversion without changing the chart', () => {
    const chart = fixture(), original = serializeProject(chart);
    const sparse = new Array<number>(4); sparse[3] = 255;
    const invalid: LoomImageSource[] = [
        { width: 0, height: 1, pixels: [] }, { width: 2049, height: 1, pixels: [] },
        { width: 1, height: 2049, pixels: [] }, { width: 1.5, height: 1, pixels: [] },
        { width: 1, height: 1, pixels: [0, 0, 0] }, { width: 1, height: 1, pixels: sparse },
        { width: 1, height: 1, pixels: [0, NaN, 0, 255] }, { width: 1, height: 1, pixels: [0, 0, -1, 255] },
        { width: 1, height: 1, pixels: [0, 0, 256, 255] }, { width: 1, height: 1, pixels: [0, 0, 0, 0.5] },
    ];
    for (const source of invalid) assert.throws(() => convertImage(source, chart, 'fit'));
    assert.throws(() => convertImage({ width: 1, height: 1, pixels: [0, 0, 0, 255] }, chart, 'unknown' as 'fit'));
    assert.equal(serializeProject(chart), original);
});

test('maximum decoded image size is supported without modifying source or unrelated chart settings', () => {
    const chart = customChart(1, 1, ['#000000', '#FFFFFF']);
    chart.title = 'Sample'; chart.startCorner = 'top-right'; chart.serpentine = false; chart.cellAspect = 1.5;
    const pixels = new Uint8ClampedArray(LIMITS.maxImagePixels * 4);
    pixels.set([255, 255, 255, 255], (1024 * 2048 + 1024) * 4);
    const result = convertImage({ width: 2048, height: 2048, pixels }, chart, 'stretch');
    assert.deepEqual(result, { ...chart, cells: ['c1'] });
    assert.deepEqual(Array.from(pixels.slice((1024 * 2048 + 1024) * 4, (1024 * 2048 + 1024) * 4 + 4)), [255, 255, 255, 255]);
});

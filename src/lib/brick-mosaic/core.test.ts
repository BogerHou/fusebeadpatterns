import { describe, expect, test } from 'vitest';
import { createGrid } from '../pixel-grid/core';
import { cloneMosaic, collectMosaicMaterials, createMosaic, fillMosaic, MosaicHistory, paintMosaicLine, renderMosaicRGBA, replaceMosaicColor, sampleToMosaic, validateBrickCatalog, validateMosaic, type BrickCatalog, type Mosaic } from './core';

// Deliberately synthetic fixtures, not a real-world catalog or a shipped parts list.
const catalog: BrickCatalog = {
    version: 'synthetic-test-1', part: { designId: 'fixture-plate', name: 'Synthetic fixture plate', kind: 'plate' },
    colors: [
        { id: 'fixture-black', name: 'Test black', hex: '#000000', ldrawCode: 1000, legoColorId: null, elementId: 'fixture-element-black' },
        { id: 'fixture-white', name: 'Test white', hex: '#FFFFFF', ldrawCode: 1001, legoColorId: 2001, elementId: 'fixture-element-white' },
        { id: 'fixture-red', name: 'Test red', hex: '#FF0000', ldrawCode: 4, legoColorId: 21, elementId: 'fixture-element-red' },
        { id: 'fixture-blue', name: 'Test blue', hex: '#0000FF', ldrawCode: 1003, legoColorId: 2003, elementId: 'fixture-element-blue' },
        { id: 'fixture-gray', name: 'Test gray', hex: '#808080', ldrawCode: 1004, legoColorId: 2004, elementId: 'fixture-element-gray' },
    ],
};
const mono = (width: number, height: number, boardSize: 32 | 48 = 32, color = 'fixture-red') => createMosaic(width, height, boardSize, catalog, new Array<string>(width * height).fill(color));
function independentlyCount(model: Mosaic) {
    const counts: Record<string, number> = {};
    for (let row = 0; row < model.height; row++) for (let column = 0; column < model.width; column++) {
        const color = model.cells[row * model.width + column];
        if (color !== null) counts[color] = (counts[color] ?? 0) + 1;
    }
    return counts;
}

describe('indexed part/colour model', () => {
    test('full 32 and 48 boards have respectively 1024 and 2304 actual pieces', () => {
        for (const [side, expected] of [[32, 1024], [48, 2304]] as const) {
            const model = mono(side, side, side), result = collectMosaicMaterials(model, catalog);
            expect(result.total).toBe(expected); expect(result.emptyCount).toBe(0);
            expect(result.boardColumns).toBe(1); expect(result.boardRows).toBe(1);
            expect(result.boards[0]).toMatchObject({ occupied: expected, capacity: expected, padding: 0, width: side, height: side, startX: 0, startY: 0 });
        }
    });
    test('blank rectangular canvas and short edges retain layout without imaginary padding pieces', () => {
        const result = collectMosaicMaterials(createMosaic(34, 50, 32, catalog), catalog);
        expect(result.total).toBe(0); expect(result.emptyCount).toBe(1700); expect(result.usedColors).toEqual([]);
        expect(result.boards.map(board => [board.row, board.column, board.startX, board.startY, board.width, board.height])).toEqual([
            [0, 0, 0, 0, 32, 32], [0, 1, 32, 0, 2, 32], [1, 0, 0, 32, 32, 18], [1, 1, 32, 32, 2, 18],
        ]);
        expect(result.boards.reduce((sum, board) => sum + board.capacity, 0)).toBe(1700);
        expect(result.boards.reduce((sum, board) => sum + board.padding, 0)).toBe(4096 - 1700);
        expect(result.boards.every(board => board.occupied === 0 && board.counts.length === 0 && board.emptyCount === board.capacity)).toBe(true);
    });
    test.each([32, 48] as const)('global coordinates cross %s-sized boundaries once, without row wrapping', side => {
        const model = createMosaic(side + 1, side + 1, side, catalog);
        model.cells[(side - 1) * model.width + side - 1] = 'fixture-red';
        model.cells[(side - 1) * model.width + side] = 'fixture-blue';
        model.cells[side * model.width + side - 1] = 'fixture-black';
        model.cells[side * model.width + side] = 'fixture-white';
        const result = collectMosaicMaterials(model, catalog);
        expect(result.total).toBe(4); expect(result.boards.map(board => board.occupied)).toEqual([1, 1, 1, 1]);
        expect(result.boards.map(board => board.counts.filter(item => item.count).map(item => item.color.id))).toEqual([
            ['fixture-red'], ['fixture-blue'], ['fixture-black'], ['fixture-white'],
        ]);
        expect(result.boards.every(board => board.counts.length === 4)).toBe(true);
    });
    test('independent row/column oracle agrees with every colour and partial-board subtotal', () => {
        const model = createMosaic(101, 79, 48, catalog);
        for (let y = 0; y < model.height; y++) for (let x = 0; x < model.width; x++) {
            model.cells[y * model.width + x] = (x * 7 + y * 11) % 6 === 0 ? null : catalog.colors[(x + y * 3) % catalog.colors.length].id;
        }
        const expected = independentlyCount(model), result = collectMosaicMaterials(model, catalog);
        expect(Object.fromEntries(result.usedColors.map(item => [item.color.id, item.count]))).toEqual(expected);
        for (const material of result.usedColors) expect(result.boards.reduce((sum, board) => sum + board.counts.find(item => item.color.id === material.color.id)!.count, 0)).toBe(expected[material.color.id]);
        for (const board of result.boards) {
            const expectedBoard: Record<string, number> = {};
            for (let y = board.startY; y < Math.min(model.height, board.startY + 48); y++) for (let x = board.startX; x < Math.min(model.width, board.startX + 48); x++) {
                const id = model.cells[y * model.width + x]; if (id !== null) expectedBoard[id] = (expectedBoard[id] ?? 0) + 1;
            }
            expect(Object.fromEntries(board.counts.filter(item => item.count).map(item => [item.color.id, item.count]))).toEqual(expectedBoard);
            expect(board.occupied + board.emptyCount).toBe(board.capacity);
        }
        expect(result.boards.reduce((sum, board) => sum + board.occupied, 0)).toBe(result.total);
    });
    test('same display RGB does not merge distinct IDs or confuse LDraw with LEGO or element IDs', () => {
        const paired: BrickCatalog = { ...catalog, colors: [catalog.colors[2], { ...catalog.colors[2], id: 'fixture-other-red', ldrawCode: 4004, legoColorId: null, elementId: 'fixture-other-element' }] };
        const model = createMosaic(2, 1, 32, paired, ['fixture-red', 'fixture-other-red']), result = collectMosaicMaterials(model, paired);
        expect(result.total).toBe(2); expect(result.usedColors.map(item => [item.color.id, item.color.ldrawCode, item.color.legoColorId, item.color.elementId, item.count])).toEqual([
            ['fixture-red', 4, 21, 'fixture-element-red', 1], ['fixture-other-red', 4004, null, 'fixture-other-element', 1],
        ]);
        expect(Array.from(renderMosaicRGBA(model, paired).pixels)).toEqual([255, 0, 0, 255, 255, 0, 0, 255]);
        expect(replaceMosaicColor(model, 'fixture-red', null, paired).cells).toEqual([null, 'fixture-other-red']);
    });
    test('drawing, four-connected bucket fill, picking by ID and erasing preserve the input', () => {
        const original = createMosaic(5, 4, 32, catalog), before = JSON.stringify(original);
        const wall = paintMosaicLine(original, [2, 0], [2, 3], 'fixture-red', catalog);
        const left = fillMosaic(wall, 0, 0, 'fixture-blue', catalog);
        expect(left.cells.filter(value => value === 'fixture-blue')).toHaveLength(8);
        expect(left.cells.filter(value => value === 'fixture-red')).toHaveLength(4);
        expect(left.cells.filter(value => value === null)).toHaveLength(8);
        const erased = paintMosaicLine(left, [2, 0], [2, 3], null, catalog);
        expect(erased.cells.filter(value => value === 'fixture-red')).toHaveLength(0);
        expect(JSON.stringify(original)).toBe(before); expect(wall.cells.filter(value => value === 'fixture-blue')).toHaveLength(0);
        const diagonal = createMosaic(2, 2, 32, catalog, ['fixture-red', null, null, 'fixture-red']);
        expect(fillMosaic(diagonal, 0, 0, 'fixture-blue', catalog).cells).toEqual(['fixture-blue', null, null, 'fixture-red']);
    });
    test('line rasterization covers steep, reversed, diagonal and single-cell strokes', () => {
        const blank = createMosaic(8, 8, 32, catalog);
        for (const [start, end] of [[[0, 0], [7, 7]], [[7, 7], [0, 0]], [[0, 7], [1, 0]], [[3, 4], [3, 4]]] as const) {
            const painted = paintMosaicLine(blank, start, end, 'fixture-black', catalog);
            expect(painted.cells[start[1] * 8 + start[0]]).toBe('fixture-black');
            expect(painted.cells[end[1] * 8 + end[0]]).toBe('fixture-black');
            expect(painted.cells.filter(Boolean)).toHaveLength(Math.max(Math.abs(start[0] - end[0]), Math.abs(start[1] - end[1])) + 1);
        }
        expect(blank.cells.every(value => value === null)).toBe(true);
    });
    test('unknown colour, absent cells, sparse arrays, invalid dimensions and malformed catalogs are rejected before edit', () => {
        for (const [width, height, board] of [[0, 1, 32], [129, 1, 32], [1, 129, 48], [1.5, 1, 32], [1, 1, 29], [Infinity, 1, 32]]) expect(() => createMosaic(width, height, board as 32, catalog)).toThrow();
        const good = mono(2, 2), before = JSON.stringify(good);
        for (const cells of [[null], [null, null, null, 'made-up'], new Array(4), [null, undefined, null, null]]) expect(() => createMosaic(2, 2, 32, catalog, cells as (string | null)[])).toThrow();
        for (const value of [{ ...good, cells: undefined }, { ...good, pixels: [] as number[] }, { ...good, boardSize: '32' }, { ...good, cells: 'fixture-red' }]) expect(() => validateMosaic(value, catalog)).toThrow();
        for (const point of [[-1, 0], [2, 0], [0, NaN], [0, 2], [0.5, 0]]) expect(() => paintMosaicLine(good, [0, 0], point as [number, number], 'fixture-red', catalog)).toThrow();
        expect(() => fillMosaic(good, 0, 0, 'made-up', catalog)).toThrow();
        expect(() => replaceMosaicColor(good, 'made-up', null, catalog)).toThrow();
        expect(JSON.stringify(good)).toBe(before);
        for (const bad of [{ ...catalog, colors: [] }, { ...catalog, colors: [catalog.colors[0], catalog.colors[0]] }, { ...catalog, colors: [{ ...catalog.colors[0], legoColorId: undefined }] }, { ...catalog, colors: [{ ...catalog.colors[0], hex: '#0000' }] }, { ...catalog, colors: [{ ...catalog.colors[0], elementId: '' }] }]) expect(() => validateBrickCatalog(bad)).toThrow();
    });
    test('owned clones and rendered pixels never alias source cells or catalog data', () => {
        const model = mono(1, 1), copy = cloneMosaic(model, catalog), rendered = renderMosaicRGBA(copy, catalog), materials = collectMosaicMaterials(model, catalog);
        copy.cells[0] = null; rendered.pixels.fill(0); materials.usedColors[0].color.name = 'mutated';
        expect(model.cells).toEqual(['fixture-red']); expect(catalog.colors[2].name).toBe('Test red');
        expect(Array.from(renderMosaicRGBA(model, catalog).pixels)).toEqual([255, 0, 0, 255]);
    });
});

describe('sampling into verified opaque catalogue entries', () => {
    test('alpha cutoff keeps holes, matte resolves partial alpha, no output is semi-transparent', () => {
        const source = createGrid(5, 1, [255, 0, 0, 0, 0, 0, 0, 127, 0, 0, 0, 128, 255, 0, 0, 255, 0, 0, 0, 1]);
        const before = Array.from(source.pixels), result = sampleToMosaic(source, 5, 1, 'stretch', catalog);
        expect(result.cells).toEqual([null, null, 'fixture-gray', 'fixture-red', null]);
        const low = sampleToMosaic(source, 5, 1, 'stretch', catalog, { alphaThreshold: 0 });
        expect(low.cells[0]).toBe(null); expect(low.cells[4]).toBe('fixture-white');
        expect(sampleToMosaic(source, 5, 1, 'stretch', catalog, { matte: [0, 0, 0] }).cells[2]).toBe('fixture-black');
        expect(Array.from(source.pixels)).toEqual(before);
        expect(Array.from(renderMosaicRGBA(result, catalog).pixels).filter((_, index) => index % 4 === 3)).toEqual([0, 0, 255, 255, 0]);
    });
    test('fit creates empty margins; centered crop and stretch have independently predictable cells', () => {
        const source = createGrid(2, 1, [255, 0, 0, 255, 0, 0, 255, 255]);
        const fit = sampleToMosaic(source, 4, 4, 'fit', catalog);
        expect(fit.cells).toEqual([null, null, null, null, 'fixture-red', 'fixture-red', 'fixture-blue', 'fixture-blue', 'fixture-red', 'fixture-red', 'fixture-blue', 'fixture-blue', null, null, null, null]);
        expect(sampleToMosaic(source, 1, 1, 'crop', catalog).cells).toEqual(['fixture-blue']);
        expect(sampleToMosaic(source, 2, 2, 'stretch', catalog).cells).toEqual(['fixture-red', 'fixture-blue', 'fixture-red', 'fixture-blue']);
        expect(collectMosaicMaterials(fit, catalog).total).toBe(8);
    });
    test('finite palette and max-colour cap survive deterministic dithering, including protected empty cells', () => {
        const source = createGrid(32, 4);
        for (let y = 0; y < 4; y++) for (let x = 0; x < 32; x++) source.pixels.set([x * 8, (x * 13 + y * 31) % 256, (x * 19) % 256, x === 15 ? 0 : 255], (y * 32 + x) * 4);
        const before = Array.from(source.pixels);
        for (const dither of [false, true]) for (const maxColors of [1, 2, 3, 5]) {
            const options = { boardSize: 48 as const, dither, maxColors }, first = sampleToMosaic(source, 32, 4, 'stretch', catalog, options);
            expect(sampleToMosaic(source, 32, 4, 'stretch', catalog, options)).toEqual(first);
            expect(new Set(first.cells.filter(value => value !== null)).size).toBeLessThanOrEqual(maxColors);
            expect(first.boardSize).toBe(48);
            for (let y = 0; y < 4; y++) expect(first.cells[y * 32 + 15]).toBe(null);
            expect(first.cells.filter(value => value !== null).every(value => catalog.colors.some(color => color.id === value))).toBe(true);
        }
        expect(Array.from(source.pixels)).toEqual(before);
    });
    test('dither actually diffuses fractional RGB error into neighbours without crossing holes or rows', () => {
        const binary = { ...catalog, colors: catalog.colors.slice(0, 2) }, source = createGrid(8, 8);
        for (let index = 0; index < 64; index++) source.pixels.set([128, 128, 128, 255], index * 4);
        const plain = sampleToMosaic(source, 8, 8, 'stretch', binary), diffused = sampleToMosaic(source, 8, 8, 'stretch', binary, { dither: true });
        expect(new Set(plain.cells).size).toBe(1); expect(new Set(diffused.cells).size).toBe(2);
        const separated = createGrid(3, 1, [128, 128, 128, 255, 255, 0, 0, 0, 128, 128, 128, 255]);
        const holes = sampleToMosaic(separated, 3, 1, 'stretch', binary, { dither: true });
        expect(holes.cells).toEqual([plain.cells[0], null, plain.cells[0]]);
        const rowEdge = createGrid(2, 2, [0, 0, 0, 0, 128, 128, 128, 255, 128, 128, 128, 255, 0, 0, 0, 0]);
        expect(sampleToMosaic(rowEdge, 2, 2, 'stretch', binary, { dither: true }).cells[2]).toBe(plain.cells[0]);
    });
    test('empty and exact catalog-colour source produces no invented colours or phantom pieces', () => {
        expect(sampleToMosaic(createGrid(4, 3), 4, 3, 'stretch', catalog, { maxColors: 1, dither: true }).cells).toEqual(new Array(12).fill(null));
        const model = createMosaic(5, 1, 48, catalog, catalog.colors.map(color => color.id));
        expect(sampleToMosaic(renderMosaicRGBA(model, catalog), 5, 1, 'stretch', catalog, { boardSize: 48, dither: true })).toEqual(model);
    });
    test('invalid sampling settings and source data cannot mutate current design or source', () => {
        const source = createGrid(1, 1, [255, 0, 0, 255]), before = Array.from(source.pixels);
        for (const options of [{ alphaThreshold: -1 }, { alphaThreshold: 256 }, { alphaThreshold: .5 }, { matte: [0, 0, 256] }, { matte: new Array(3) }, { maxColors: 0 }, { maxColors: 6 }, { maxColors: Infinity }, { dither: 'yes' }, { boardSize: 29 }]) expect(() => sampleToMosaic(source, 1, 1, 'fit', catalog, options as Parameters<typeof sampleToMosaic>[5])).toThrow();
        expect(() => sampleToMosaic({ width: 1, height: 1, pixels: [255, 0] }, 1, 1, 'fit', catalog)).toThrow();
        expect(() => sampleToMosaic(source, 1, 1, 'unknown' as 'fit', catalog)).toThrow();
        expect(Array.from(source.pixels)).toEqual(before);
    });
});

test('bounded whole-operation history restores dimensions, palette IDs and layout without aliasing', () => {
    const blank = createMosaic(2, 1, 32, catalog), history = new MosaicHistory(blank, catalog, 2);
    const red = paintMosaicLine(blank, [0, 0], [0, 0], 'fixture-red', catalog);
    history.commit(red); red.cells[0] = 'fixture-blue'; expect(history.current().cells).toEqual(['fixture-red', null]);
    const larger = mono(3, 2, 48); history.commit(larger); larger.cells.fill(null);
    expect(history.undo()).toMatchObject({ width: 2, height: 1, boardSize: 32, cells: ['fixture-red', null] });
    expect(history.redo()).toEqual(mono(3, 2, 48));
    history.undo(); history.commit(paintMosaicLine(history.current(), [1, 0], [1, 0], 'fixture-blue', catalog));
    expect(history.canRedo()).toBe(false); const snap = history.current(); snap.cells.fill(null); expect(history.current().cells).toEqual(['fixture-red', 'fixture-blue']);
    expect(() => history.commit({ ...blank, cells: ['made-up', null] })).toThrow();
    expect(history.current().cells).toEqual(['fixture-red', 'fixture-blue']);
    history.commit(mono(1, 1)); history.commit(mono(2, 1)); history.commit(mono(3, 1)); history.undo(); history.undo();
    expect(history.current().width).toBe(1); expect(history.canUndo()).toBe(false); expect(history.undo().width).toBe(1);
    expect(() => new MosaicHistory(blank, catalog, 0)).toThrow(); expect(blank.cells).toEqual([null, null]);
});

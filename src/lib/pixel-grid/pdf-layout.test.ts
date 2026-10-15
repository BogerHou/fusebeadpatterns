import { test } from 'vitest';
import assert from 'node:assert/strict';
import { pixelGridPdfAxisLabels, pixelGridPdfLayout, pixelGridPdfOverviewBox } from './pdf-layout';

test('both paper sizes partition every source cell once, including narrow and partial tiles', () => {
    for (const paper of ['a4', 'letter'] as const) for (const [width, height] of [[1, 1], [1, 128], [128, 1], [40, 48], [41, 49], [128, 128]]) {
        const layout = pixelGridPdfLayout(width, height, paper, 'tiled');
        const visits = new Uint8Array(width * height);
        assert.equal(layout.pageCount, Math.ceil(width / 40) * Math.ceil(height / 48) + 1);
        for (const [index, tile] of layout.tiles.entries()) {
            assert.equal(tile.page, index + 2);
            assert.ok(tile.width >= 1 && tile.width <= 40 && tile.height >= 1 && tile.height <= 48);
            assert.equal(tile.x, (tile.column - 1) * 40); assert.equal(tile.y, (tile.row - 1) * 48);
            for (let y = tile.y; y < tile.y + tile.height; y++) for (let x = tile.x; x < tile.x + tile.width; x++) visits[y * width + x]++;
        }
        assert.ok(visits.every(count => count === 1));
    }
    assert.equal(pixelGridPdfLayout(128, 128, 'letter', 'tiled').pageCount, 13);
});

test('overview always fits the complete grid on one page and leaves footer space', () => {
    for (const paper of ['a4', 'letter'] as const) for (const [width, height] of [[1, 1], [1, 128], [128, 1], [73, 119], [128, 128]]) {
        const layout = pixelGridPdfLayout(width, height, paper, 'overview'), box = pixelGridPdfOverviewBox(layout);
        assert.equal(layout.pageCount, 1); assert.deepEqual(layout.tiles, []);
        assert.ok(box.cellMm > 0); assert.ok(box.left >= 24);
        assert.ok(box.left + width * box.cellMm <= layout.widthMm - 24 + 1e-9);
        assert.ok(box.top >= 48); assert.ok(box.top + height * box.cellMm <= layout.heightMm - 38 + 1e-9);
    }
});

test('dense preview labels retain global endpoints without near-end collisions', () => {
    for (const [start, count, cell] of [[0, 128, 1.2], [40, 40, 4], [80, 3, 4], [0, 1, 12]]) {
        const labels = pixelGridPdfAxisLabels(start, count, cell);
        assert.equal(labels[0], 0); assert.equal(labels.at(-1), count - 1);
        assert.equal(new Set(labels).size, labels.length);
        assert.ok(labels.every(index => Number.isInteger(index) && index >= 0 && index < count));
    }
});

test('invalid dimensions and paper or layout values never produce a print plan', () => {
    for (const [width, height] of [[0, 1], [1, 129], [NaN, 1], [1.5, 2]]) assert.throws(() => pixelGridPdfLayout(width, height, 'a4', 'tiled'));
    assert.throws(() => pixelGridPdfLayout(1, 1, 'legal' as 'a4', 'tiled'));
    assert.throws(() => pixelGridPdfLayout(1, 1, 'a4', 'poster' as 'tiled'));
});

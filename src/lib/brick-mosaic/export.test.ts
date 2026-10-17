import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { brickCatalog } from './catalog';
import { createMosaic, paintMosaicLine, type BrickCatalog } from './core';
import { brickLegend, brickMaterialsCsv, brickMosaicPng } from './export';

const parseCsv = (raw: string): string[][] => raw.replace(/^\ufeff/, '').trimEnd().split('\r\n').map(row => {
    const cells: string[] = []; let cell = '', quoted = false;
    for (let index = 0; index < row.length; index++) {
        const char = row[index];
        if (char === '"') { if (quoted && row[index + 1] === '"') { cell += '"'; index++; } else quoted = !quoted; }
        else if (char === ',' && !quoted) { cells.push(cell); cell = ''; } else cell += char;
    }
    cells.push(cell); return cells;
});

describe('brick files use the same selected-part model', () => {
    it('exports separate identifier systems and exact whole/board quantities', () => {
        let model = createMosaic(49, 33, 32, brickCatalog);
        model = paintMosaicLine(model, [31, 31], [32, 32], 'ldraw-4', brickCatalog);
        model = paintMosaicLine(model, [48, 0], [48, 32], 'ldraw-0', brickCatalog);
        const rows = parseCsv(brickMaterialsCsv(model, brickCatalog)), [header, ...data] = rows;
        expect(data.every(row => row.length === header.length)).toBe(true);
        const column = (name: string) => header.indexOf(name);
        const whole = data.filter(row => row[0] === 'whole'), boards = data.filter(row => row[0] === 'board');
        expect(whole.reduce((sum, row) => sum + Number(row[column('quantity')]), 0)).toBe(35);
        expect(boards.reduce((sum, row) => sum + Number(row[column('quantity')]), 0)).toBe(35);
        const red = whole.find(row => row[column('ldraw_color_id')] === '4')!;
        expect(red[column('design_id')]).toBe('3024'); expect(red[column('element_id')]).toBe('302421');
        expect(red[column('lego_color_id')]).toBe('21'); expect(red[column('quantity')]).toBe('2');
        expect(boards).toHaveLength(8); // two whole-image colours, including zeros on four boards.
        expect(brickLegend(model, brickCatalog).map(entry => entry.key)).toEqual(['1', '2']);
        for (const row of data) expect(row[column('rgb_license')]).toContain('CC BY 4.0');
    });
    it('escapes CSV fields, prevents formula injection and leaves unknown LEGO IDs empty', () => {
        const catalog: BrickCatalog = { ...brickCatalog, colors: [{ ...brickCatalog.colors[4], name: '=red,"test"', legoColorId: null }] };
        const model = createMosaic(1, 1, 48, catalog, ['ldraw-4']);
        const [header, row] = parseCsv(brickMaterialsCsv(model, catalog));
        expect(row[header.indexOf('color_name')]).toBe('\'=red,"test"');
        expect(row[header.indexOf('lego_color_id')]).toBe('');
    });
    it('PNG has exact requested pixel size, opaque catalogue colour and empty alpha', async () => {
        const model = createMosaic(2, 1, 32, brickCatalog, ['ldraw-4', null]);
        const bytes = Buffer.from(await brickMosaicPng(model, brickCatalog, 1));
        expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
        expect(bytes.readUInt32BE(16)).toBe(2); expect(bytes.readUInt32BE(20)).toBe(1);
        const data: Buffer[] = [];
        for (let offset = 8; offset < bytes.length;) { const length = bytes.readUInt32BE(offset); if (bytes.toString('ascii', offset + 4, offset + 8) === 'IDAT') data.push(bytes.subarray(offset + 8, offset + 8 + length)); offset += length + 12; }
        expect([...inflateSync(Buffer.concat(data))]).toEqual([0, 180, 0, 0, 255, 0, 0, 0, 0]);
        const larger = Buffer.from(await brickMosaicPng(model, brickCatalog, 16));
        expect(larger.readUInt32BE(16)).toBe(32); expect(larger.readUInt32BE(20)).toBe(16);
    });
    it('captures a PNG snapshot before compression and observes cancellation', async () => {
        const model = createMosaic(1, 1, 32, brickCatalog, ['ldraw-4']), before = JSON.stringify(model);
        const controller = new AbortController(); controller.abort();
        await expect(brickMosaicPng(model, brickCatalog, 1, controller.signal)).rejects.toThrow();
        expect(JSON.stringify(model)).toBe(before);
        await expect(brickMosaicPng(model, brickCatalog, 0)).rejects.toThrow('INVALID_SCALE');
        await expect(brickMosaicPng(model, brickCatalog, 17)).rejects.toThrow('INVALID_SCALE');
    });
});

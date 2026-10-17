import { expect, test } from 'vitest';
import { createMosaic, collectMosaicMaterials, type BrickCatalog } from './core';
import { MOSAIC_PROJECT_FORMAT, MOSAIC_PROJECT_MAX_BYTES, parseMosaicProject, serializeMosaicProject } from './project';

// A synthetic schema fixture. This catalog must never be used as production part data.
const catalog: BrickCatalog = { version: 'fixture-1', part: { designId: 'fixture-part', name: 'Synthetic fixture', kind: 'plate' }, colors: [
    { id: 'test-red', name: 'Synthetic red', hex: '#FF0000', ldrawCode: 4, legoColorId: 21, elementId: 'fixture-element-red' },
    { id: 'test-blue', name: 'Synthetic blue', hex: '#0000FF', ldrawCode: 1, legoColorId: null, elementId: 'fixture-element-blue' },
] };

test('new format round trip preserves rectangular dimensions, IDs, holes and chosen board size', () => {
    for (const boardSize of [32, 48] as const) {
        const model = createMosaic(67, 49, boardSize, catalog);
        for (let index = 0; index < model.cells.length; index++) model.cells[index] = index % 5 === 0 ? null : index % 2 ? 'test-red' : 'test-blue';
        const raw = serializeMosaicProject(model, catalog), parsed = parseMosaicProject(raw, catalog);
        expect(parsed).toEqual(model); expect(serializeMosaicProject(parsed, catalog)).toBe(raw);
        expect(collectMosaicMaterials(parsed, catalog)).toEqual(collectMosaicMaterials(model, catalog));
        parsed.cells[0] = 'test-red'; expect(model.cells[0]).toBe(null);
        expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['catalogVersion', 'designId', 'format', 'mosaic', 'version']);
    }
});
test('largest 128 square project fits bounded format without image, filenames, history or foreign project data', () => {
    const model = createMosaic(128, 128, 48, catalog, new Array<string>(128 * 128).fill('test-red'));
    const raw = serializeMosaicProject(model, catalog); expect(new TextEncoder().encode(raw).length).toBeLessThan(MOSAIC_PROJECT_MAX_BYTES);
    expect(parseMosaicProject(raw, catalog)).toEqual(model); expect(raw).not.toContain('source'); expect(raw).not.toContain('history');
});
test('wrong catalog, part, format, version, unknown fields and invalid cells are refused before replacement', () => {
    const current = createMosaic(2, 1, 32, catalog, ['test-blue', null]), before = JSON.stringify(current), good = JSON.parse(serializeMosaicProject(current, catalog));
    const failures = [null, [], {}, { ...good, format: 'pixel-grid-project' }, { ...good, format: 'bead-pattern' }, { ...good, format: 'fusebead-banner-project' }, { ...good, version: 2 }, { ...good, catalogVersion: 'fixture-2' }, { ...good, designId: 'different-part' }, { ...good, url: 'https://example.com' }, { ...good, mosaic: { ...good.mosaic, cells: ['unknown-id', null] } }, { ...good, mosaic: { ...good.mosaic, rgba: [0, 0, 0, 0] } }, { ...good, mosaic: { ...good.mosaic, width: 129 } }, { ...good, mosaic: { ...good.mosaic, cells: [] } }, { ...good, mosaic: { ...good.mosaic, boardSize: 29 } }];
    for (const value of failures) {
        let live = current;
        expect(() => { const candidate = parseMosaicProject(JSON.stringify(value), catalog); live = candidate; }).toThrow('INVALID_MOSAIC_PROJECT');
        expect(live).toBe(current); expect(JSON.stringify(current)).toBe(before);
    }
    const missing = { ...good }; delete missing.designId; expect(() => parseMosaicProject(JSON.stringify(missing), catalog)).toThrow();
    expect(() => parseMosaicProject('{', catalog)).toThrow();
});
test('one MiB limit counts UTF-8 bytes and rejects oversized raw inputs before JSON parsing', () => {
    expect(() => parseMosaicProject(' '.repeat(MOSAIC_PROJECT_MAX_BYTES + 1), catalog)).toThrow('MOSAIC_PROJECT_TOO_LARGE');
    expect(() => parseMosaicProject('字'.repeat(Math.ceil(MOSAIC_PROJECT_MAX_BYTES / 3)), catalog)).toThrow('MOSAIC_PROJECT_TOO_LARGE');
    const raw = serializeMosaicProject(createMosaic(1, 1, 32, catalog), catalog), data = JSON.parse(raw);
    expect(data.format).toBe(MOSAIC_PROJECT_FORMAT);
    expect(() => serializeMosaicProject({ ...createMosaic(1, 1, 32, catalog), cells: ['4'] }, catalog)).toThrow();
});

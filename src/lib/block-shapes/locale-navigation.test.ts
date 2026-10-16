import { describe, expect, it } from 'vitest';
import { blockShapePaths } from './routes';
import { defaultShapeState, shapeDraft } from './project';
import { acknowledgeShapeLocaleSnapshot, BLOCK_SHAPE_LOCALE_KEY, discardShapeLocaleSnapshot, isShapeLocaleNavigation, readShapeLocaleSnapshot, saveShapeLocaleSnapshot } from './locale-navigation';

function storage() {
    const values = new Map<string, string>();
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
describe('whole planner language navigation', () => {
    it('recognizes only same-origin equivalent planner routes', () => {
        for (const from of Object.values(blockShapePaths)) for (const to of Object.values(blockShapePaths)) expect(isShapeLocaleNavigation('https://example.test' + from, to)).toBe(true);
        for (const to of ['https://other.test' + blockShapePaths.ja, '/pixel-art-grid', '/de', 'javascript:void(0)']) expect(isShapeLocaleNavigation('https://example.test' + blockShapePaths.en, to)).toBe(false);
    });
    it('transfers complete applied state and invalid pending input across all four languages, removing only the acknowledged exact record', () => {
        const area = storage(), state = defaultShapeState(), snapshot = { state: { ...state, completedLayers: [0], ghost: true }, saved: false, draft: { ...shapeDraft(state.spec), width: '' } };
        for (const href of Object.values(blockShapePaths)) {
            expect(saveShapeLocaleSnapshot(snapshot, href, area, 1000)).toBe(true);
            const read = readShapeLocaleSnapshot(href, area, 1001)!;
            expect(read.snapshot).toEqual(snapshot);
            expect(area.getItem(BLOCK_SHAPE_LOCALE_KEY)).toBe(read.raw);
            expect(acknowledgeShapeLocaleSnapshot(read, area)).toBe(true);
            expect(readShapeLocaleSnapshot(href, area, 1001)).toBe(null);
        }
    });
    it('keeps recoverable data on destination/age/read/parse errors; a stale acknowledgement never removes a newer transfer', () => {
        const area = storage(), state = defaultShapeState(), snapshot = { state, saved: true, draft: shapeDraft(state.spec) };
        saveShapeLocaleSnapshot(snapshot, blockShapePaths.ja, area, 1000);
        const read = readShapeLocaleSnapshot(blockShapePaths.ja, area, 1001)!;
        expect(() => readShapeLocaleSnapshot(blockShapePaths.de, area, 1001)).toThrow();
        expect(() => readShapeLocaleSnapshot(blockShapePaths.ja, area, 999)).toThrow();
        expect(() => readShapeLocaleSnapshot(blockShapePaths.ja, area, 1_801_001)).toThrow();
        expect(area.getItem(BLOCK_SHAPE_LOCALE_KEY)).toBe(read.raw);
        saveShapeLocaleSnapshot(snapshot, blockShapePaths.de, area, 1002);
        expect(acknowledgeShapeLocaleSnapshot(read, area)).toBe(false);
        expect(readShapeLocaleSnapshot(blockShapePaths.de, area, 1003)).not.toBe(null);
        area.setItem(BLOCK_SHAPE_LOCALE_KEY, '{broken');
        expect(() => readShapeLocaleSnapshot(blockShapePaths.ja, area, 1003)).toThrow();
        expect(area.getItem(BLOCK_SHAPE_LOCALE_KEY)).toBe('{broken');
        expect(discardShapeLocaleSnapshot(area)).toBe(true);
        expect(() => readShapeLocaleSnapshot(blockShapePaths.ja, { ...area, getItem() { throw new Error('denied'); } }, 1003)).toThrow();
    });
    it('reports quota or silent writes as failure and restores the previous recoverable record', () => {
        const area = storage(), state = defaultShapeState(), snapshot = { state, saved: false, draft: shapeDraft(state.spec) };
        area.setItem(BLOCK_SHAPE_LOCALE_KEY, 'previous');
        expect(saveShapeLocaleSnapshot(snapshot, blockShapePaths.fr, { ...area, setItem() { throw new Error('quota'); } }, 1000)).toBe(false);
        expect(area.getItem(BLOCK_SHAPE_LOCALE_KEY)).toBe('previous');
        expect(saveShapeLocaleSnapshot(snapshot, blockShapePaths.fr, { ...area, setItem() { /* silently ignored */ } }, 1000)).toBe(false);
        expect(area.getItem(BLOCK_SHAPE_LOCALE_KEY)).toBe('previous');
        expect(saveShapeLocaleSnapshot(snapshot, '/editor', area, 1000)).toBe(false);
    });
});

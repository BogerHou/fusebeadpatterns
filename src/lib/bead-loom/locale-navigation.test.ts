import { describe, expect, it } from 'vitest';
import { createChart, paintLine, serializeProject, type LoomChart } from './core';
import {
    LOOM_LOCALE_PATHS, LOOM_LOCALE_STORAGE_KEY, isLoomLocaleNavigation,
    saveLoomLocaleSnapshot, consumeLoomLocaleSnapshot, saveLargeLoomLocaleSnapshot,
    consumeLargeLoomLocaleSnapshot, hasLargeLoomLocaleSnapshot, type LoomLocaleSnapshot,
} from './locale-navigation';
import type { PixelLocaleStore } from '../pixel-grid/locale-storage';
function area(limit = Infinity) {
    const values = new Map<string, string>();
    return { values, getItem: (key: string) => values.get(key) ?? null, setItem(key: string, raw: string) { if (raw.length > limit) throw new Error('QuotaExceededError'); values.set(key, raw); }, removeItem(key: string) { values.delete(key); } };
}
function bulk() {
    const values = new Map<string, string>();
    const store: PixelLocaleStore = { async put(key, raw) { values.set(key, raw); }, async take(key) { const raw = values.get(key) ?? null; values.delete(key); return raw; }, async remove(key) { values.delete(key); } };
    return { values, store };
}
function fixture(): LoomLocaleSnapshot {
    const saved = createChart(4, 3);
    saved.title = '試作 · Essai · Test'; saved.palette[1].name = '青 # 自分の色'; saved.palette[1].code = 'DE-77';
    const chart = paintLine(saved, [0, 0], [3, 2], 'color-b');
    chart.startCorner = 'top-right'; chart.serpentine = false;
    return {
        chart, saved, history: { past: [saved], future: [paintLine(chart, [1, 0], [1, 0], 'color-d')] },
        columns: '17', rows: '', aspect: '1.35', corner: 'bottom-right', serpentine: true,
        selected: 'color-c', replaceTarget: 'color-e', tool: 'pan', zoom: '40', cursor: [3, 2],
        sourceName: '原画像.png', source: { width: 2, height: 1, pixels: new Uint8ClampedArray([1, 2, 3, 0, 251, 62, 189, 127]) }, mode: 'crop', paper: 'letter',
    };
}
describe('full bead loom language transfer', () => {
    it('distinguishes the first marker read failure from absence and recovers the complete large chart on retry', async () => {
        const storage = area(), records = bulk(), snapshot = fixture(), target = LOOM_LOCALE_PATHS[1];
        expect(await saveLargeLoomLocaleSnapshot(snapshot, target, storage, records.store, 1000)).toBe(true);
        const marker = storage.values.get(LOOM_LOCALE_STORAGE_KEY), raw = [...records.values.values()][0], get = storage.getItem;
        let first = true;
        storage.getItem = key => {
            if (first) { first = false; throw new Error('First marker read failed'); }
            return get(key);
        };
        expect(() => hasLargeLoomLocaleSnapshot(storage)).toThrow('First marker read failed');
        expect(storage.values.get(LOOM_LOCALE_STORAGE_KEY)).toBe(marker);
        expect([...records.values.values()]).toEqual([raw]);
        expect(hasLargeLoomLocaleSnapshot(storage)).toBe(true);
        expect(await consumeLargeLoomLocaleSnapshot(target, storage, records.store, 1001)).toEqual(snapshot);
        expect(storage.values.has(LOOM_LOCALE_STORAGE_KEY)).toBe(false);
        expect(records.values.size).toBe(0);
    });

    it('keeps a v1 chart if its second startup read fails and retries without losing pending settings or history', () => {
        const storage = area(), snapshot = fixture(), target = LOOM_LOCALE_PATHS[2];
        expect(saveLoomLocaleSnapshot(snapshot, target, storage, 1000)).toBe(true);
        const raw = storage.values.get(LOOM_LOCALE_STORAGE_KEY), get = storage.getItem;
        let reads = 0;
        storage.getItem = key => {
            if (++reads === 2) throw new Error('Snapshot read failed');
            return get(key);
        };
        expect(hasLargeLoomLocaleSnapshot(storage)).toBe(false);
        expect(() => consumeLoomLocaleSnapshot(target, storage, 1001)).toThrow('Snapshot read failed');
        expect(storage.values.get(LOOM_LOCALE_STORAGE_KEY)).toBe(raw);
        expect(hasLargeLoomLocaleSnapshot(storage)).toBe(false);
        expect(consumeLoomLocaleSnapshot(target, storage, 1002)).toEqual(snapshot);
        expect(storage.values.has(LOOM_LOCALE_STORAGE_KEY)).toBe(false);
    });

    it('does not delete or accept a blank chart while marker access remains unavailable', async () => {
        const storage = area(), records = bulk(), snapshot = fixture(), target = LOOM_LOCALE_PATHS[3];
        await saveLargeLoomLocaleSnapshot(snapshot, target, storage, records.store, 1000);
        const marker = storage.values.get(LOOM_LOCALE_STORAGE_KEY), raw = [...records.values.values()][0], get = storage.getItem;
        storage.getItem = () => { throw new Error('Storage unavailable'); };
        for (let attempt = 0; attempt < 3; attempt++) {
            expect(() => hasLargeLoomLocaleSnapshot(storage)).toThrow('Storage unavailable');
            await expect(consumeLargeLoomLocaleSnapshot(target, storage, records.store, 1001)).rejects.toThrow('Storage unavailable');
            expect(storage.values.get(LOOM_LOCALE_STORAGE_KEY)).toBe(marker);
            expect([...records.values.values()]).toEqual([raw]);
        }
        storage.getItem = get;
        expect(await consumeLargeLoomLocaleSnapshot(target, storage, records.store, 1002)).toEqual(snapshot);
        expect(storage.values.has(LOOM_LOCALE_STORAGE_KEY)).toBe(false);
        expect(records.values.size).toBe(0);
    });

    it('restores a valid small chart despite a cleanup error and keeps readable no-marker startup empty', () => {
        const storage = area(), snapshot = fixture(), target = LOOM_LOCALE_PATHS[0];
        storage.setItem('unrelated-editor', 'keep');
        expect(hasLargeLoomLocaleSnapshot(storage)).toBe(false);
        expect(consumeLoomLocaleSnapshot(target, storage, 1000)).toBeNull();
        expect(storage.values.get('unrelated-editor')).toBe('keep');
        saveLoomLocaleSnapshot(snapshot, target, storage, 1000);
        const raw = storage.values.get(LOOM_LOCALE_STORAGE_KEY), remove = storage.removeItem;
        storage.removeItem = () => { throw new Error('Cleanup temporarily blocked'); };
        expect(consumeLoomLocaleSnapshot(target, storage, 1001)).toEqual(snapshot);
        expect(storage.values.get(LOOM_LOCALE_STORAGE_KEY)).toBe(raw);
        storage.removeItem = remove;
        expect(consumeLoomLocaleSnapshot(target, storage, 1002)).toEqual(snapshot);
        expect(storage.values.has(LOOM_LOCALE_STORAGE_KEY)).toBe(false);
        expect(storage.values.get('unrelated-editor')).toBe('keep');
    });

    it('recognizes only same-origin counterparts, retaining all chart data and unapplied controls on each pair', () => {
        for (const from of LOOM_LOCALE_PATHS) for (const to of LOOM_LOCALE_PATHS) {
            const storage = area(), snapshot = fixture(), href = `https://fusebeadpatterns.art${to}?draft=1#loom-draw`;
            expect(isLoomLocaleNavigation(`https://fusebeadpatterns.art${from}`, href)).toBe(true);
            expect(saveLoomLocaleSnapshot(snapshot, href, storage)).toBe(true);
            expect(consumeLoomLocaleSnapshot(`https://fusebeadpatterns.art${to}?draft=2`, storage)).toBeNull();
            const restored = consumeLoomLocaleSnapshot(href, storage);
            expect(restored).toEqual(snapshot);
            expect(serializeProject(restored!.chart)).toBe(serializeProject(snapshot.chart));
            expect(consumeLoomLocaleSnapshot(href, storage)).toBeNull();
            expect(storage.values.size).toBe(0);
        }
        for (const to of ['https://evil.example/de/perlenwebmuster-generator', '/patterns', '/de/', 'javascript:alert(1)', '/bead-loom-pattern-maker-copy']) expect(isLoomLocaleNavigation('https://fusebeadpatterns.art/bead-loom-pattern-maker', to)).toBe(false);
    });
    it('keeps the saved baseline, distinct undo and redo snapshots, full RGBA and invalid pending sizes independently', () => {
        const storage = area(), original = fixture();
        expect(saveLoomLocaleSnapshot(original, LOOM_LOCALE_PATHS[2], storage, 1000)).toBe(true);
        const restored = consumeLoomLocaleSnapshot(LOOM_LOCALE_PATHS[2], storage, 1100)!;
        restored.chart.cells[0] = 'color-e'; (restored.source!.pixels as Uint8ClampedArray)[0] = 99;
        expect(restored.saved.cells[0]).toBe('color-a');
        expect(restored.history.past[0].cells[0]).toBe('color-a');
        expect(original.chart.cells[0]).toBe('color-b');
        expect(original.source!.pixels[0]).toBe(1);
        expect(restored.rows).toBe('');
    });
    it('rejects corrupt history, cursor, palette, source and expiry without accepting partial work', () => {
        const tamper = [
            (value: Record<string, unknown>) => { (value.history as { past: LoomChart[] }).past = Array(41).fill(createChart()); },
            (value: Record<string, unknown>) => { value.cursor = [4, 0]; },
            (value: Record<string, unknown>) => { value.selected = 'missing'; },
            (value: Record<string, unknown>) => { (value.source as Record<string, unknown>).pixels = 'AA=='; },
            (value: Record<string, unknown>) => { (value.chart as LoomChart).cells.pop(); },
        ];
        for (const change of tamper) {
            const storage = area(); saveLoomLocaleSnapshot(fixture(), LOOM_LOCALE_PATHS[1], storage, 1000);
            const transfer = JSON.parse(storage.getItem(LOOM_LOCALE_STORAGE_KEY)!);
            change(transfer.snapshot); storage.setItem(LOOM_LOCALE_STORAGE_KEY, JSON.stringify(transfer));
            expect(consumeLoomLocaleSnapshot(LOOM_LOCALE_PATHS[1], storage, 1100)).toBeNull();
            expect(storage.values.size).toBe(0);
        }
        const storage = area(); saveLoomLocaleSnapshot(fixture(), LOOM_LOCALE_PATHS[1], storage, 1000);
        expect(consumeLoomLocaleSnapshot(LOOM_LOCALE_PATHS[1], storage, 301001)).toBeNull();
    });
    it('preserves the maximum original image and all 40 history entries when tab storage holds only a tiny pointer', async () => {
        const original = fixture(), pixels = new Uint8ClampedArray(2048 * 2048 * 4);
        for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 17 + (i >> 8)) & 255;
        original.source = { width: 2048, height: 2048, pixels };
        original.history = { past: Array.from({ length: 23 }, (_, i) => ({ ...createChart(5, 7), title: `Past ${i}` })), future: Array.from({ length: 17 }, (_, i) => ({ ...createChart(7, 5), title: `Future ${i}` })) };
        const storage = area(1024), records = bulk(), target = LOOM_LOCALE_PATHS[3];
        expect(saveLoomLocaleSnapshot(original, target, storage)).toBe(false);
        expect(await saveLargeLoomLocaleSnapshot(original, target, storage, records.store)).toBe(true);
        expect(hasLargeLoomLocaleSnapshot(storage)).toBe(true);
        expect(storage.getItem(LOOM_LOCALE_STORAGE_KEY)!.length).toBeLessThan(1024);
        expect(records.values.size).toBe(1);
        expect(await consumeLargeLoomLocaleSnapshot(LOOM_LOCALE_PATHS[0], storage, records.store)).toBeNull();
        expect(records.values.size).toBe(1);
        const restored = await consumeLargeLoomLocaleSnapshot(target, storage, records.store);
        expect(Buffer.from(restored!.source!.pixels).equals(Buffer.from(pixels))).toBe(true);
        expect(restored!.history).toEqual(original.history);
        expect(restored!.chart).toEqual(original.chart); expect(restored!.saved).toEqual(original.saved);
        expect(restored!.sourceName).toBe(original.sourceName);
        expect(records.values.size).toBe(0); expect(storage.values.size).toBe(0);
        expect(await consumeLargeLoomLocaleSnapshot(target, storage, records.store)).toBeNull();
    });
    it('keeps a committed pointer through a temporary read failure so reload restores the complete workspace', async () => {
        const storage = area(), records = bulk(), snapshot = fixture(), target = LOOM_LOCALE_PATHS[2];
        expect(await saveLargeLoomLocaleSnapshot(snapshot, target, storage, records.store)).toBe(true);
        const before = storage.getItem(LOOM_LOCALE_STORAGE_KEY);
        const unavailable = { ...records.store, async take() { throw new Error('Temporary blocked transaction'); } };
        await expect(consumeLargeLoomLocaleSnapshot(target, storage, unavailable)).rejects.toThrow('Temporary blocked transaction');
        expect(storage.getItem(LOOM_LOCALE_STORAGE_KEY)).toBe(before); expect(records.values.size).toBe(1);
        expect(await consumeLargeLoomLocaleSnapshot(target, storage, records.store)).toEqual(snapshot);
        expect(storage.values.size).toBe(0); expect(records.values.size).toBe(0);
    });
    it('leaves the in-memory project complete when bulk storage or the tab pointer fails, and removes stale records', async () => {
        const original = fixture(), json = serializeProject(original.chart), records = bulk();
        const failed = { ...records.store, async put() { throw new Error('Blocked'); } };
        expect(await saveLargeLoomLocaleSnapshot(original, LOOM_LOCALE_PATHS[2], area(), failed)).toBe(false);
        expect(await saveLargeLoomLocaleSnapshot(original, LOOM_LOCALE_PATHS[2], area(1), records.store)).toBe(false);
        expect(records.values.size).toBe(0); expect(serializeProject(original.chart)).toBe(json);
        expect(original.source!.pixels[7]).toBe(127);
        const storage = area();
        expect(await saveLargeLoomLocaleSnapshot(original, LOOM_LOCALE_PATHS[2], storage, records.store, 1000)).toBe(true);
        expect(await consumeLargeLoomLocaleSnapshot(LOOM_LOCALE_PATHS[2], storage, records.store, 301001)).toBeNull();
        expect(records.values.size).toBe(0); expect(storage.values.size).toBe(0);
    });
});

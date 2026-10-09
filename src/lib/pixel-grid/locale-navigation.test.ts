import { describe, expect, it } from 'vitest';
import { createGrid, GridHistory, gridsEqual, resizeImage } from './core';
import { consumePixelLocaleSnapshot, consumeLargePixelLocaleSnapshot, hasLargePixelLocaleSnapshot, hasPixelLocaleWork, isPixelLocaleNavigation, PIXEL_LOCALE_STORAGE_KEY, savePixelLocaleSnapshot, saveLargePixelLocaleSnapshot, type PixelLocaleSnapshot } from './locale-navigation';
import type { PixelLocaleStore } from './locale-storage';

function storage() {
    const data = new Map<string, string>();
    return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
}
function largeStorage() {
    const records = new Map<string, string>();
    const store: PixelLocaleStore = {
        async put(key, raw) { records.set(key, raw); },
        async take(key) { const raw = records.get(key) ?? null; records.delete(key); return raw; },
        async remove(key) { records.delete(key); },
    };
    return { records, store };
}
function fixture(): PixelLocaleSnapshot {
    const saved = createGrid(2, 1, [44, 55, 66, 0, 4, 5, 6, 127]);
    const edited = createGrid(2, 1, [44, 55, 66, 0, 240, 100, 50, 200]);
    const large = resizeImage(edited, 4, 3);
    const history = new GridHistory(50);
    history.push(saved, edited); history.push(edited, large);
    const grid = history.undo(large)!;
    return {
        grid, saved, source: { ...createGrid(3, 1, [88, 99, 100, 0, 55, 66, 77, 64, 22, 33, 44, 255]), name: '元画像.png' },
        history: history.snapshot(), width: '17', height: '31', mode: 'crop', tool: 'eraser',
        color: '#123abc', alpha: 53, zoom: '24', showGrid: false, colorLimit: 16,
        exportScale: 4, cursor: [1, 0], settingsExpanded: true,
    };
}

describe('pixel workspace language transfer', () => {
    it('distinguishes a failed first marker probe from no transfer and restores the committed large snapshot on retry', async () => {
        const session = storage(), large = largeStorage(), snapshot = fixture();
        const target = '/de/pixel-art-generator';
        expect(await saveLargePixelLocaleSnapshot(snapshot, target, session, large.store, 1000)).toBe(true);
        const marker = session.getItem(PIXEL_LOCALE_STORAGE_KEY), raw = [...large.records.values()][0];
        const get = session.getItem;
        let first = true;
        session.getItem = key => {
            if (first) { first = false; throw new Error('First marker read failed'); }
            return get(key);
        };
        expect(() => hasLargePixelLocaleSnapshot(session)).toThrow('First marker read failed');
        expect(session.data.get(PIXEL_LOCALE_STORAGE_KEY)).toBe(marker);
        expect([...large.records.values()]).toEqual([raw]);
        expect(hasLargePixelLocaleSnapshot(session)).toBe(true);
        expect(await consumeLargePixelLocaleSnapshot(target, session, large.store, 1001)).toEqual(snapshot);
        expect(session.data.has(PIXEL_LOCALE_STORAGE_KEY)).toBe(false);
        expect(large.records.size).toBe(0);
    });

    it('preserves a small snapshot when the read after a successful probe fails, then restores all data on retry', () => {
        const session = storage(), snapshot = fixture(), target = '/fr/image-en-pixel-art';
        expect(savePixelLocaleSnapshot(snapshot, target, session, 1000)).toBe(true);
        const raw = session.getItem(PIXEL_LOCALE_STORAGE_KEY), get = session.getItem;
        let reads = 0;
        session.getItem = key => {
            if (++reads === 2) throw new Error('Snapshot read failed');
            return get(key);
        };
        expect(hasLargePixelLocaleSnapshot(session)).toBe(false);
        expect(() => consumePixelLocaleSnapshot(target, session, 1001)).toThrow('Snapshot read failed');
        expect(session.data.get(PIXEL_LOCALE_STORAGE_KEY)).toBe(raw);
        expect(hasLargePixelLocaleSnapshot(session)).toBe(false);
        expect(consumePixelLocaleSnapshot(target, session, 1002)).toEqual(snapshot);
        expect(session.data.has(PIXEL_LOCALE_STORAGE_KEY)).toBe(false);
    });

    it('keeps large records intact through persistent marker failures without returning an empty recovery', async () => {
        const session = storage(), large = largeStorage(), snapshot = fixture(), target = '/ja/pixel-art-converter';
        await saveLargePixelLocaleSnapshot(snapshot, target, session, large.store, 1000);
        const marker = session.data.get(PIXEL_LOCALE_STORAGE_KEY), raw = [...large.records.values()][0], get = session.getItem;
        session.getItem = () => { throw new Error('Storage unavailable'); };
        for (let attempt = 0; attempt < 3; attempt++) {
            expect(() => hasLargePixelLocaleSnapshot(session)).toThrow('Storage unavailable');
            await expect(consumeLargePixelLocaleSnapshot(target, session, large.store, 1001)).rejects.toThrow('Storage unavailable');
            expect(session.data.get(PIXEL_LOCALE_STORAGE_KEY)).toBe(marker);
            expect([...large.records.values()]).toEqual([raw]);
        }
        session.getItem = get;
        expect(await consumeLargePixelLocaleSnapshot(target, session, large.store, 1002)).toEqual(snapshot);
        expect(session.data.has(PIXEL_LOCALE_STORAGE_KEY)).toBe(false);
        expect(large.records.size).toBe(0);
    });

    it('returns a fully decoded small drawing even when marker cleanup fails, and preserves normal no-marker startup', () => {
        const session = storage(), snapshot = fixture(), target = '/pixel-art-grid';
        session.setItem('unrelated-editor', 'keep');
        expect(hasLargePixelLocaleSnapshot(session)).toBe(false);
        expect(consumePixelLocaleSnapshot(target, session, 1000)).toBeNull();
        expect(session.data.get('unrelated-editor')).toBe('keep');
        savePixelLocaleSnapshot(snapshot, target, session, 1000);
        const raw = session.data.get(PIXEL_LOCALE_STORAGE_KEY), remove = session.removeItem;
        session.removeItem = () => { throw new Error('Cleanup temporarily blocked'); };
        expect(consumePixelLocaleSnapshot(target, session, 1001)).toEqual(snapshot);
        expect(session.data.get(PIXEL_LOCALE_STORAGE_KEY)).toBe(raw);
        session.removeItem = remove;
        expect(consumePixelLocaleSnapshot(target, session, 1002)).toEqual(snapshot);
        expect(session.data.has(PIXEL_LOCALE_STORAGE_KEY)).toBe(false);
        expect(session.data.get('unrelated-editor')).toBe('keep');
    });

    it('keeps the complete transfer after a temporary read failure and restores it exactly on retry', async () => {
        const session = storage(), large = largeStorage(), snapshot = fixture();
        expect(await saveLargePixelLocaleSnapshot(snapshot, '/de/pixel-art-generator?view=canvas', session, large.store, 1000)).toBe(true);
        const pointer = session.getItem(PIXEL_LOCALE_STORAGE_KEY), raw = [...large.records.values()][0];
        let fail = true;
        const readOnce: PixelLocaleStore = { ...large.store, async take(key) {
            if (fail) { fail = false; throw new Error('Temporary transaction timeout'); }
            return large.store.take(key);
        } };
        await expect(consumeLargePixelLocaleSnapshot('/de/pixel-art-generator?view=canvas', session, readOnce, 1001)).rejects.toThrow('Temporary transaction timeout');
        expect(session.getItem(PIXEL_LOCALE_STORAGE_KEY)).toBe(pointer);
        expect([...large.records.values()]).toEqual([raw]);
        const workingGet = session.getItem;
        session.getItem = () => { throw new Error('Temporary session access failure'); };
        await expect(consumeLargePixelLocaleSnapshot('/de/pixel-art-generator?view=canvas', session, readOnce, 1002)).rejects.toThrow('Temporary session access failure');
        expect([...large.records.values()]).toEqual([raw]);
        session.getItem = workingGet;
        expect(await consumeLargePixelLocaleSnapshot('/de/pixel-art-generator?view=canvas', session, readOnce, 1002)).toEqual(snapshot);
        expect(session.getItem(PIXEL_LOCALE_STORAGE_KEY)).toBeNull();
        expect(large.records.size).toBe(0);
    });

    it('cleans committed missing or corrupt transfers without retrying them as a drawing', async () => {
        for (const raw of [null, 'not JSON', '{"version":1,"snapshot":{}}']) {
            const session = storage(), large = largeStorage();
            await saveLargePixelLocaleSnapshot(fixture(), '/de/pixel-art-generator', session, large.store, 1000);
            const key = JSON.parse(session.getItem(PIXEL_LOCALE_STORAGE_KEY)!).key;
            if (raw === null) large.records.delete(key); else large.records.set(key, raw);
            expect(await consumeLargePixelLocaleSnapshot('/de/pixel-art-generator', session, large.store, 1001)).toBeNull();
            expect(session.getItem(PIXEL_LOCALE_STORAGE_KEY)).toBeNull();
            expect(large.records.size).toBe(0);
        }
    });

    it('moves a maximum-size source without losing bytes when session storage only accepts a small pointer', async () => {
        const session = storage(), large = largeStorage(), snapshot = fixture();
        const pixels = new Uint8ClampedArray(2048 * 2048 * 4);
        for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 17) & 255;
        snapshot.source = { width: 2048, height: 2048, name: 'large.png', pixels };
        const set = session.setItem;
        session.setItem = (key, value) => { if (value.length > 1024) throw new Error('QuotaExceededError'); set(key, value); };
        expect(savePixelLocaleSnapshot(snapshot, '/de/pixel-art-generator', session, 1000)).toBe(false);
        expect(await saveLargePixelLocaleSnapshot(snapshot, '/de/pixel-art-generator', session, large.store, 1000)).toBe(true);
        expect(hasLargePixelLocaleSnapshot(session)).toBe(true);
        expect(session.getItem(PIXEL_LOCALE_STORAGE_KEY)!.length).toBeLessThan(1024);
        expect(await consumeLargePixelLocaleSnapshot('/ja/pixel-art-converter', session, large.store, 1001)).toBeNull();
        expect(large.records.size).toBe(1);
        const restored = await consumeLargePixelLocaleSnapshot('/de/pixel-art-generator', session, large.store, 1001);
        expect(Buffer.compare(Buffer.from(restored!.source!.pixels), Buffer.from(snapshot.source.pixels))).toBe(0);
        expect({ ...restored, source: null }).toEqual({ ...snapshot, source: null });
        expect(large.records.size).toBe(0);
        expect(session.getItem(PIXEL_LOCALE_STORAGE_KEY)).toBeNull();
        expect(await consumeLargePixelLocaleSnapshot('/de/pixel-art-generator', session, large.store, 1002)).toBeNull();
    });

    it('leaves no navigation pointer after a bulk write or pointer failure and cleans expired transfers', async () => {
        const session = storage(), large = largeStorage(), snapshot = fixture();
        const before = structuredClone(snapshot);
        const failed = { ...large.store, async put() { throw new Error('QuotaExceededError'); } };
        expect(await saveLargePixelLocaleSnapshot(snapshot, '/de/pixel-art-generator', session, failed, 1000)).toBe(false);
        expect(session.getItem(PIXEL_LOCALE_STORAGE_KEY)).toBeNull();
        const workingSet = session.setItem;
        session.setItem = () => { throw new Error('Storage disabled'); };
        expect(await saveLargePixelLocaleSnapshot(snapshot, '/de/pixel-art-generator', session, large.store, 1000)).toBe(false);
        expect(large.records.size).toBe(0);
        session.setItem = workingSet;
        expect(await saveLargePixelLocaleSnapshot(snapshot, '/de/pixel-art-generator', session, large.store, 1000)).toBe(true);
        expect(await consumeLargePixelLocaleSnapshot('/de/pixel-art-generator', session, large.store, 301001)).toBeNull();
        expect(large.records.size).toBe(0);
        expect(snapshot).toEqual(before);
    });
    it('restores exact hidden RGB/alpha, pending settings, source reconversion and both history branches once', () => {
        const session = storage(), snapshot = fixture();
        session.setItem('bead-pattern-editor-draft-v1', 'other editor work');
        expect(savePixelLocaleSnapshot(snapshot, '/ja/pixel-art-converter?view=canvas#pixel-grid-workspace', session, 1000)).toBe(true);
        const restored = consumePixelLocaleSnapshot('https://fusebeadpatterns.art/ja/pixel-art-converter?view=canvas', session, 1001)!;
        expect(restored).toEqual(snapshot);
        expect(gridsEqual(restored.grid, restored.saved)).toBe(false);
        expect(resizeImage(restored.source!, 17, 31, restored.mode)).toEqual(resizeImage(snapshot.source!, 17, 31, 'crop'));
        const history = new GridHistory(50); history.restore(restored.history);
        const redone = history.redo(restored.grid)!;
        expect(redone).toEqual(resizeImage(snapshot.grid, 4, 3));
        expect(history.undo(redone)).toEqual(snapshot.grid);
        expect(history.undo(snapshot.grid)).toEqual(snapshot.saved);
        expect(session.getItem('bead-pattern-editor-draft-v1')).toBe('other editor work');
        expect(consumePixelLocaleSnapshot('/ja/pixel-art-converter?view=canvas', session, 1002)).toBeNull();
    });

    it('keeps all 50 checkpoints without shared references and restores a saved clean drawing', () => {
        const history = new GridHistory(50);
        let current = createGrid(1, 1);
        for (let n = 1; n <= 50; n++) {
            const next = createGrid(1, 1, [n, n, n, 255]); history.push(current, next); current = next;
        }
        const snapshot = { ...fixture(), grid: current, saved: createGrid(1, 1, current.pixels), cursor: [0, 0] as const, history: history.snapshot() };
        const session = storage();
        expect(savePixelLocaleSnapshot(snapshot, '/pixel-art-grid', session, 1000)).toBe(true);
        snapshot.history.undo[0].pixels.fill(99);
        const restored = consumePixelLocaleSnapshot('/pixel-art-grid', session, 1001)!;
        expect(gridsEqual(restored.grid, restored.saved)).toBe(true);
        expect(restored.history.undo).toHaveLength(50);
        history.restore(restored.history);
        restored.history.undo[0].pixels.fill(88);
        for (let n = 0; n < 50; n++) current = history.undo(current)!;
        expect(current).toEqual(createGrid(1, 1));
    });

    it('requires exact destination and current age, rejects invalid shape/pixels before restoration', () => {
        const session = storage();
        savePixelLocaleSnapshot(fixture(), '/fr/image-en-pixel-art?x=1', session, 1000);
        expect(consumePixelLocaleSnapshot('/ja/pixel-art-converter?x=1', session, 1001)).toBeNull();
        expect(consumePixelLocaleSnapshot('/fr/image-en-pixel-art?x=2', session, 1001)).toBeNull();
        expect(session.getItem(PIXEL_LOCALE_STORAGE_KEY)).not.toBeNull();
        expect(consumePixelLocaleSnapshot('/fr/image-en-pixel-art?x=1', session, 301001)).toBeNull();
        for (const modify of [
            (v: Record<string, unknown>) => { v.version = 2; },
            (v: Record<string, unknown>) => { v.savedAt = 2000; },
            (v: Record<string, unknown>) => { (v.snapshot as PixelLocaleSnapshot).zoom = 'bad' as 'fit'; },
            (v: Record<string, unknown>) => { (v.snapshot as { grid: { pixels: string } }).grid.pixels = 'AAAA'; },
        ]) {
            savePixelLocaleSnapshot(fixture(), '/fr/image-en-pixel-art', session, 1000);
            const value = JSON.parse(session.getItem(PIXEL_LOCALE_STORAGE_KEY)!); modify(value);
            session.setItem(PIXEL_LOCALE_STORAGE_KEY, JSON.stringify(value));
            expect(consumePixelLocaleSnapshot('/fr/image-en-pixel-art', session, 1001)).toBeNull();
        }
    });

    it('never drops original pixels or history to fit a restricted storage area', () => {
        const snapshot = fixture(), before = structuredClone(snapshot), session = storage();
        session.setItem('bead-pattern-editor-draft-v1', 'untouched');
        savePixelLocaleSnapshot(snapshot, '/fr/image-en-pixel-art', session);
        session.setItem = () => { throw new Error('QuotaExceededError'); };
        expect(savePixelLocaleSnapshot(snapshot, '/fr/image-en-pixel-art', session)).toBe(false);
        expect(snapshot).toEqual(before);
        expect(session.getItem('bead-pattern-editor-draft-v1')).toBe('untouched');
        expect(session.getItem(PIXEL_LOCALE_STORAGE_KEY)).toBeNull();
    });

    it('does not write an empty workspace and only recognizes same-origin pixel equivalents', () => {
        const session = storage(); session.setItem('other-work', 'keep');
        expect(savePixelLocaleSnapshot(null, '/fr/image-en-pixel-art', session)).toBe(true);
        expect([...session.data.entries()]).toEqual([['other-work', 'keep']]);
        const clean: PixelLocaleSnapshot = { ...fixture(), grid: createGrid(16, 16), source: null, history: { undo: [], redo: [] }, width: '16', height: '16', mode: 'fit', tool: 'brush', color: '#f06a45', alpha: 255, zoom: 'fit', showGrid: true, colorLimit: 'original', exportScale: 8, settingsExpanded: null };
        expect(hasPixelLocaleWork(clean, 16, false)).toBe(false);
        expect(hasPixelLocaleWork({ ...clean, width: '17' }, 16, false)).toBe(true);
        expect(isPixelLocaleNavigation('http://localhost:4367/pixel-art-grid', '/fr/image-en-pixel-art')).toBe(true);
        const equivalentPaths = ['/pixel-art-grid', '/de/pixel-art-generator', '/fr/image-en-pixel-art', '/ja/pixel-art-converter'];
        for (const from of equivalentPaths) for (const to of equivalentPaths) {
            expect(isPixelLocaleNavigation(`https://fusebeadpatterns.art${from}`, to)).toBe(true);
            const state = fixture();
            expect(savePixelLocaleSnapshot(state, to, session, 1000)).toBe(true);
            expect(consumePixelLocaleSnapshot(to, session, 1001)).toEqual(state);
        }
        for (const path of ['/de', '/', '/fr/editor', 'https://other.test/fr/image-en-pixel-art']) {
            expect(isPixelLocaleNavigation('https://fusebeadpatterns.art/pixel-art-grid', path)).toBe(false);
        }
    });
});

import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { decodeEditorPatternDraft, type EditorDraft } from '../editor/draft';
import { convertPixelGridToBeads } from './bead-conversion';
import { createGrid, GridHistory, resizeImage } from './core';
import type { PixelLocaleSnapshot } from './locale-navigation';
import type { PixelTransferStore } from './locale-storage';
import {
    ackPixelBeadTransfer, clearPixelBeadQuery, clearPixelBeadReturnQuery,
    dismissPixelBeadTransfer, finishPixelBeadReturn, getPixelBeadReturnHref,
    isPixelBeadReturn, peekPixelBeadTransfer, PIXEL_BEAD_MAX_AGE,
    PIXEL_BEAD_STORAGE_KEY, readPixelBeadReturn, savePixelBeadTransfer,
} from './bead-transfer';

const NOW = Date.UTC(2026, 9, 13, 12);
const ROUTES = [
    ['/pixel-art-grid', '/editor'],
    ['/de/pixel-art-generator', '/de/editor'],
    ['/fr/image-en-pixel-art', '/fr/editor'],
    ['/ja/pixel-art-converter', '/ja/editor'],
] as const;
let draft: EditorDraft;

function sessionStorage() {
    const data = new Map<string, string>();
    return { data, getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => { data.set(key, value); },
        removeItem: (key: string) => { data.delete(key); } };
}

// Model storage failures at the public store contract, not browser IndexedDB I/O.
function bulkStorage() {
    const data = new Map<string, { raw: string; expiresAt: number }>();
    const store: PixelTransferStore = {
        put: vi.fn(async (key, raw, expiresAt) => { data.set(key, { raw, expiresAt }); }),
        read: vi.fn(async key => { const item = data.get(key); return item && item.expiresAt >= Date.now() ? item.raw : null; }),
        take: vi.fn(async key => { const item = data.get(key); data.delete(key); return item?.raw ?? null; }),
        remove: vi.fn(async key => { data.delete(key); }),
    };
    return { data, store };
}

function fixture(largeSource = false): PixelLocaleSnapshot {
    const saved = createGrid(37, 23);
    for (let offset = 0; offset < saved.pixels.length; offset += 4) {
        const cell = offset / 4;
        saved.pixels.set([(cell * 37) % 256, (cell * 13) % 256, (cell * 7) % 256,
            cell % 7 === 0 ? 0 : cell % 5 === 0 ? 93 : 255], offset);
    }
    const edited = createGrid(37, 23, saved.pixels);
    edited.pixels.set([23, 47, 89, 0], 0);
    edited.pixels.set([240, 99, 33, 174], 4);
    const nextSize = resizeImage(edited, 19, 11, 'crop');
    const history = new GridHistory(50);
    history.push(saved, edited); history.push(edited, nextSize);
    const sourceWidth = largeSource ? 512 : 3, sourceHeight = largeSource ? 384 : 2;
    const sourcePixels = new Uint8ClampedArray(sourceWidth * sourceHeight * 4);
    for (let index = 0; index < sourcePixels.length; index++) sourcePixels[index] = (index * 29) & 255;
    return {
        grid: history.undo(nextSize)!, saved, history: history.snapshot(),
        source: { width: sourceWidth, height: sourceHeight, pixels: sourcePixels, name: '原图-é.png' },
        width: '57', height: '31', mode: 'crop', tool: 'eraser', color: '#aB12fE', alpha: 53,
        zoom: '24', showGrid: false, colorLimit: 16, exportScale: 4,
        cursor: [36, 22], settingsExpanded: true,
    };
}

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>(done => { resolve = done; });
    return { promise, resolve };
}

function save(snapshot: PixelLocaleSnapshot, session: ReturnType<typeof sessionStorage>, bulk: ReturnType<typeof bulkStorage>, options: { signal?: AbortSignal } = {}) {
    return savePixelBeadTransfer(snapshot, draft, '/pixel-art-grid', '/editor', session, { store: bulk.store, now: NOW, ...options });
}

beforeAll(async () => {
    const option = getPaletteOption('perler')!;
    const palette = parsePaletteCsv(readFileSync(new URL(`../../../public/palettes/${option.file}`, import.meta.url), 'utf8'), option);
    draft = (await convertPixelGridToBeads({ grid: fixture().grid, paletteId: option.id, palette })).draft;
});
beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(NOW); });
afterEach(() => { vi.restoreAllMocks(); });

describe('pixel drawing → whole-board bead project and exact return', () => {
    it.each([false, true])('retains every RGBA/source/settings byte and both history branches (large source: %s)', async large => {
        const session = sessionStorage(), bulk = bulkStorage(), snapshot = fixture(large), expected = structuredClone(snapshot);
        session.setItem('bead-pattern-editor-draft-v1', 'unrelated bead work');
        session.setItem('pixel-grid-locale-transfer-v1', 'unrelated language work');
        const result = await save(snapshot, session, bulk);
        const pointer = session.getItem(PIXEL_BEAD_STORAGE_KEY);
        expect(JSON.parse(pointer!).storage).toBe(large ? 'indexeddb' : 'session');
        expect(bulk.store.put).toHaveBeenCalledTimes(large ? 1 : 0);
        if (large) expect(bulk.data.get(result.key)?.expiresAt).toBe(NOW + PIXEL_BEAD_MAX_AGE);
        const incoming = peekPixelBeadTransfer(result.editorHref, session, NOW)!;
        expect(incoming).toMatchObject({ key: result.key, sourceWidth: 37, sourceHeight: 23, draft, returnHref: result.returnHref });
        expect(incoming.draft).toMatchObject({ sourceMode: 'blank', imageSrc: null, boardWidth: 2, boardHeight: 1,
            selectedPaletteIds: ['perler'], editedPattern: { width: 58, height: 29 } });
        const pixels = decodeEditorPatternDraft(incoming.draft.editedPattern!)!;
        for (let y = 0; y < 29; y++) for (let x = 0; x < 58; x++) {
            if (x >= 37 || y >= 23) expect(Array.from(pixels.subarray((y * 58 + x) * 4, (y * 58 + x + 1) * 4))).toEqual([0, 0, 0, 0]);
        }
        // A peek is not acceptance; repeat reads must not consume the request.
        incoming.draft.fileName = 'consumer local mutation';
        expect(peekPixelBeadTransfer(result.editorHref, session, NOW)?.draft.fileName).toBe(draft.fileName);
        expect(session.getItem(PIXEL_BEAD_STORAGE_KEY)).toBe(pointer);
        const sourcePixels = snapshot.source!.pixels;
        if (!(sourcePixels instanceof Uint8ClampedArray)) throw new Error('Fixture source must expose its mutable RGBA buffer');
        snapshot.grid.pixels.fill(1); sourcePixels.fill(2); snapshot.history.undo[0].pixels.fill(3);
        ackPixelBeadTransfer(result.key, session);
        const restored = (await readPixelBeadReturn(result.returnHref, session, { store: bulk.store, now: NOW }))!;
        expect(restored).toEqual(expected);
        expect(await readPixelBeadReturn(result.returnHref, session, { store: bulk.store, now: NOW })).toEqual(expected);
        expect(bulk.store.take).not.toHaveBeenCalled();
        const history = new GridHistory(50); history.restore(restored.history);
        const redone = history.redo(restored.grid)!;
        expect(redone).toEqual(resizeImage(expected.grid, 19, 11, 'crop'));
        expect(history.undo(redone)).toEqual(expected.grid);
        expect(history.undo(expected.grid)).toEqual(expected.saved);
        expect(resizeImage(restored.source!, 57, 31, restored.mode)).toEqual(resizeImage(expected.source!, 57, 31, expected.mode));
        await finishPixelBeadReturn(result.returnHref, session, { store: bulk.store, now: NOW });
        expect(session.getItem(PIXEL_BEAD_STORAGE_KEY)).toBeNull(); expect(bulk.data.size).toBe(0);
        expect([...session.data]).toEqual([['bead-pattern-editor-draft-v1', 'unrelated bead work'], ['pixel-grid-locale-transfer-v1', 'unrelated language work']]);
    });

    it.each(ROUTES)('uses matching %s editor and preserves return after a later editor-language change', async (pixel, editor) => {
        const session = sessionStorage(), bulk = bulkStorage(), snapshot = fixture();
        const result = await savePixelBeadTransfer(snapshot, draft, pixel, editor, session, { now: NOW, store: bulk.store });
        expect(result.editorHref).toBe(`${editor}?pixel-project=${result.key}`);
        expect(result.returnHref).toBe(`${pixel}?bead-return=${result.key}`);
        for (const [returnPixel, translatedEditor] of ROUTES) {
            const incoming = peekPixelBeadTransfer(`${translatedEditor}?pixel-project=${result.key}`, session, NOW)!;
            expect(incoming.draft).toEqual(draft);
            expect(incoming.returnHref).toBe(`${returnPixel}?bead-return=${result.key}`);
        }
        ackPixelBeadTransfer(result.key, session);
        for (const [returnPixel, translatedEditor] of ROUTES) {
            const href = getPixelBeadReturnHref(translatedEditor, session, NOW)!;
            expect(href).toBe(`${returnPixel}?bead-return=${result.key}`);
            expect(await readPixelBeadReturn(href, session, { now: NOW, store: bulk.store })).toEqual(snapshot);
        }
    });

    it.each([ackPixelBeadTransfer, dismissPixelBeadTransfer])('accepting or dismissing does not discard the pixel return drawing', async status => {
        const session = sessionStorage(), bulk = bulkStorage(), snapshot = fixture(), result = await save(snapshot, session, bulk);
        status(result.key, session);
        expect(() => peekPixelBeadTransfer(result.editorHref, session, NOW)).toThrow();
        expect(getPixelBeadReturnHref('/editor', session, NOW)).toBe(result.returnHref);
        expect(await readPixelBeadReturn(result.returnHref, session, { now: NOW, store: bulk.store })).toEqual(snapshot);
    });
});

describe('transfer routes, tokens, age and invalid state', () => {
    it('ignores unrelated routes and queries without touching another drawing', async () => {
        const session = sessionStorage(), bulk = bulkStorage(), result = await save(fixture(), session, bulk), before = new Map(session.data);
        for (const href of ['/editor', '/patterns?pixel-project=wrong', '/editor?bead-return=wrong']) expect(peekPixelBeadTransfer(href, session, NOW)).toBeNull();
        for (const href of ['/pixel-art-grid', '/patterns?bead-return=wrong', '/pixel-art-grid?pixel-project=wrong']) {
            expect(isPixelBeadReturn(href)).toBe(false);
            expect(await readPixelBeadReturn(href, session, { now: NOW, store: bulk.store })).toBeNull();
        }
        expect(getPixelBeadReturnHref('/patterns', session, NOW)).toBeNull();
        expect(session.data).toEqual(before);
        expect(clearPixelBeadQuery(result.editorHref + '&view=canvas#board')).toBe('/editor?view=canvas#board');
        expect(clearPixelBeadReturnQuery(result.returnHref + '&view=canvas#drawing')).toBe('/pixel-art-grid?view=canvas#drawing');
    });

    it.each(['', 'not-a-key', '22222222-2222-4222-8222-222222222222'])('rejects a missing/mismatched token %j without consuming a valid record', async key => {
        const session = sessionStorage(), bulk = bulkStorage(); await save(fixture(), session, bulk);
        const before = new Map(session.data);
        expect(() => peekPixelBeadTransfer(`/editor?pixel-project=${key}`, session, NOW)).toThrow();
        await expect(readPixelBeadReturn(`/pixel-art-grid?bead-return=${key}`, session, { now: NOW, store: bulk.store })).rejects.toThrow();
        await finishPixelBeadReturn(`/pixel-art-grid?bead-return=${key}`, session, { now: NOW, store: bulk.store });
        expect(session.data).toEqual(before);
    });

    it.each([false, true])('expires after 24 hours, retaining recoverable bytes rather than installing them (large: %s)', async large => {
        const session = sessionStorage(), bulk = bulkStorage(), result = await save(fixture(large), session, bulk);
        expect(peekPixelBeadTransfer(result.editorHref, session, NOW + PIXEL_BEAD_MAX_AGE)).not.toBeNull();
        const before = new Map(session.data), bulkBefore = new Map(bulk.data);
        expect(() => peekPixelBeadTransfer(result.editorHref, session, NOW + PIXEL_BEAD_MAX_AGE + 1)).toThrow();
        await expect(readPixelBeadReturn(result.returnHref, session, { now: NOW + PIXEL_BEAD_MAX_AGE + 1, store: bulk.store })).rejects.toThrow();
        expect(() => peekPixelBeadTransfer(result.editorHref, session, NOW - 1)).toThrow();
        expect(session.data).toEqual(before); expect(bulk.data).toEqual(bulkBefore);
    });

    it.each([['/patterns', '/editor'], ['/pixel-art-grid', '/ja/editor'], ['/fr/image-en-pixel-art', '/editor']])('rejects an invalid destination %s → %s before overwriting a journey', async (source, destination) => {
        const session = sessionStorage(), bulk = bulkStorage(); await save(fixture(), session, bulk);
        const before = new Map(session.data);
        await expect(savePixelBeadTransfer(fixture(), draft, source, destination, session, { now: NOW, store: bulk.store })).rejects.toThrow();
        expect(session.data).toEqual(before);
    });

    it('does not clear a valid return record from an unrelated path with the same token', async () => {
        const session = sessionStorage(), bulk = bulkStorage(), result = await save(fixture(), session, bulk), before = new Map(session.data);
        await finishPixelBeadReturn(`/patterns?bead-return=${result.key}`, session, { now: NOW, store: bulk.store });
        expect(session.data).toEqual(before);
    });

    it('rejects invalid board dimensions and corrupted saved metadata without replacing a previous record', async () => {
        const session = sessionStorage(), bulk = bulkStorage(); await save(fixture(), session, bulk);
        const before = new Map(session.data);
        await expect(savePixelBeadTransfer(fixture(), { ...draft, boardWidth: 1 }, '/pixel-art-grid', '/editor', session, { now: NOW, store: bulk.store })).rejects.toThrow();
        await expect(savePixelBeadTransfer({ ...fixture(), alpha: 999 }, draft, '/pixel-art-grid', '/editor', session, { now: NOW, store: bulk.store })).rejects.toThrow();
        expect(session.data).toEqual(before);
    });

    it.each([
        { key: 'invalid' }, { sourcePath: '/patterns' }, { editorPath: '/ja/patterns' },
        { sourceWidth: 129 }, { sourceHeight: 0 }, { storage: 'remote' }, { status: 'invalid' },
    ])('rejects malformed pointer %j without consuming its payload', async invalid => {
        const session = sessionStorage(), bulk = bulkStorage(), result = await save(fixture(), session, bulk);
        session.setItem(PIXEL_BEAD_STORAGE_KEY, JSON.stringify({ ...JSON.parse(session.getItem(PIXEL_BEAD_STORAGE_KEY)!), ...invalid }));
        const before = new Map(session.data);
        expect(() => peekPixelBeadTransfer(result.editorHref, session, NOW)).toThrow();
        await expect(readPixelBeadReturn(result.returnHref, session, { now: NOW, store: bulk.store })).rejects.toThrow();
        expect(session.data).toEqual(before);
    });
});

describe('storage failure, cancellation and retry preserve the previous complete journey', () => {
    it('falls back to IndexedDB on a session-payload quota error while retaining the exact snapshot', async () => {
        const session = sessionStorage(), bulk = bulkStorage(), snapshot = fixture(), originalSet = session.setItem;
        session.setItem = (key, value) => { if (key !== PIXEL_BEAD_STORAGE_KEY) throw new DOMException('Payload quota', 'QuotaExceededError'); originalSet(key, value); };
        const result = await save(snapshot, session, bulk);
        expect(JSON.parse(session.getItem(PIXEL_BEAD_STORAGE_KEY)!).storage).toBe('indexeddb');
        expect(await readPixelBeadReturn(result.returnHref, session, { now: NOW, store: bulk.store })).toEqual(snapshot);
    });

    it.each(['get', 'bulk-write', 'pointer-write', 'pointer-silent-write', 'pointer-readback', 'write-then-throw'] as const)('preserves previous pointer and source after %s failure', async failure => {
        const session = sessionStorage(), bulk = bulkStorage(), original = fixture(), prior = await save(original, session, bulk);
        const before = new Map(session.data), get = session.getItem, set = session.setItem;
        const oldPointer = get(PIXEL_BEAD_STORAGE_KEY)!;
        if (failure === 'get') session.getItem = () => { throw new Error('Read blocked'); };
        if (failure === 'bulk-write') bulk.store.put = async () => { throw new DOMException('IDB quota', 'QuotaExceededError'); };
        if (failure === 'pointer-write' || failure === 'pointer-silent-write' || failure === 'write-then-throw') session.setItem = (key, value) => {
            if (key === PIXEL_BEAD_STORAGE_KEY && value !== oldPointer) {
                if (failure === 'pointer-silent-write') return;
                if (failure === 'write-then-throw') set(key, value);
                throw new Error('Pointer write blocked');
            }
            set(key, value);
        };
        if (failure === 'pointer-readback') session.getItem = key => {
            if (key === PIXEL_BEAD_STORAGE_KEY && get(key) !== oldPointer) throw new Error('Pointer readback blocked');
            return get(key);
        };
        await expect(save(fixture(true), session, bulk)).rejects.toThrow();
        session.getItem = get; session.setItem = set;
        expect(session.getItem(PIXEL_BEAD_STORAGE_KEY) === oldPointer,
            'A failed publication must restore the previous complete pointer').toBe(true);
        expect(session.data).toEqual(before); expect(bulk.data.size).toBe(0);
        expect(await readPixelBeadReturn(prior.returnHref, session, { now: NOW, store: bulk.store })).toEqual(original);
    });

    it('does not publish a cancelled transfer when an in-flight IndexedDB put finishes late', async () => {
        const session = sessionStorage(), bulk = bulkStorage(), prior = await save(fixture(), session, bulk), before = new Map(session.data);
        const gate = deferred(), put = bulk.store.put, controller = new AbortController();
        bulk.store.put = async (key, raw, expiry) => { await put(key, raw, expiry); await gate.promise; };
        const pending = save(fixture(true), session, bulk, { signal: controller.signal });
        expect(bulk.data.size).toBe(1); expect(session.data).toEqual(before);
        controller.abort(); gate.resolve();
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(session.data).toEqual(before); expect(bulk.data.size).toBe(0);
        expect(peekPixelBeadTransfer(prior.editorHref, session, NOW)?.key).toBe(prior.key);
    });

    it.each([false, true])('late cancelled A never rolls back newer successful B (previous journey: %s)', async hasPrevious => {
        const session = sessionStorage(), bulk = bulkStorage();
        if (hasPrevious) await save(fixture(), session, bulk);
        const gate = deferred(), put = bulk.store.put, controller = new AbortController();
        let first = true;
        bulk.store.put = async (key, raw, expiry) => {
            await put(key, raw, expiry);
            if (first) { first = false; await gate.promise; }
        };
        const a = save(fixture(true), session, bulk, { signal: controller.signal });
        const aKey = [...bulk.data.keys()][0];
        controller.abort();
        const bSnapshot = fixture(true); bSnapshot.color = '#abcdef'; bSnapshot.width = '41';
        const b = await save(bSnapshot, session, bulk);
        const bPointer = session.getItem(PIXEL_BEAD_STORAGE_KEY);
        expect(bulk.data.size).toBe(2);
        gate.resolve(); await expect(a).rejects.toMatchObject({ name: 'AbortError' });
        expect(session.getItem(PIXEL_BEAD_STORAGE_KEY)).toBe(bPointer);
        expect(peekPixelBeadTransfer(b.editorHref, session, NOW)?.key).toBe(b.key);
        expect(bulk.data.has(aKey)).toBe(false); expect(bulk.data.size).toBe(1);
        expect(await readPixelBeadReturn(b.returnHref, session, { now: NOW, store: bulk.store })).toEqual(bSnapshot);
    });

    it('keeps the previous IndexedDB payload when a replacement pointer cannot be published', async () => {
        const session = sessionStorage(), bulk = bulkStorage(), snapshot = fixture(true), prior = await save(snapshot, session, bulk);
        const before = new Map(session.data), bulkBefore = new Map(bulk.data), set = session.setItem;
        const oldPointer = session.getItem(PIXEL_BEAD_STORAGE_KEY);
        session.setItem = (key, value) => {
            if (key === PIXEL_BEAD_STORAGE_KEY && value !== oldPointer) throw new Error('Pointer quota');
            set(key, value);
        };
        await expect(save(fixture(true), session, bulk)).rejects.toThrow('Pointer quota');
        expect(session.data).toEqual(before); expect(bulk.data).toEqual(bulkBefore);
        expect(await readPixelBeadReturn(prior.returnHref, session, { now: NOW, store: bulk.store })).toEqual(snapshot);
    });

    it('can retry transient IndexedDB and session reads without taking or deleting the return snapshot', async () => {
        const session = sessionStorage(), bulk = bulkStorage(), snapshot = fixture(true), result = await save(snapshot, session, bulk);
        const before = new Map(session.data), bulkBefore = new Map(bulk.data), read = bulk.store.read, get = session.getItem;
        bulk.store.read = vi.fn().mockRejectedValueOnce(new Error('Temporary read transaction failure')).mockImplementation(read);
        await expect(readPixelBeadReturn(result.returnHref, session, { now: NOW, store: bulk.store })).rejects.toThrow('Temporary read');
        expect(session.data).toEqual(before); expect(bulk.data).toEqual(bulkBefore);
        session.getItem = () => { throw new Error('Temporary session read failure'); };
        await expect(readPixelBeadReturn(result.returnHref, session, { now: NOW, store: bulk.store })).rejects.toThrow('Temporary session');
        session.getItem = get;
        expect(await readPixelBeadReturn(result.returnHref, session, { now: NOW, store: bulk.store })).toEqual(snapshot);
        expect(session.data).toEqual(before); expect(bulk.data).toEqual(bulkBefore); expect(bulk.store.take).not.toHaveBeenCalled();
    });

    it('publishes a new complete journey before removing only its own previous payload', async () => {
        const session = sessionStorage(), bulk = bulkStorage(), first = await save(fixture(true), session, bulk);
        bulk.data.set('other-tab', { raw: 'unrelated', expiresAt: NOW + PIXEL_BEAD_MAX_AGE });
        const next = await save(fixture(), session, bulk);
        expect(next.key).not.toBe(first.key); expect(peekPixelBeadTransfer(next.editorHref, session, NOW)?.key).toBe(next.key);
        expect(bulk.data.has(first.key)).toBe(false); expect(bulk.data.get('other-tab')?.raw).toBe('unrelated');
        expect(await readPixelBeadReturn(next.returnHref, session, { now: NOW, store: bulk.store })).toEqual(fixture());
    });
});

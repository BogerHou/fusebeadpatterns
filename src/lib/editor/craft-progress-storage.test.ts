import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCraftProgressStore } from './craft-progress-storage';

const id = (number: number) => number.toString(16).padStart(64, '0');
const DATABASE = 'fusebead-crafting-progress';
const LIMIT = 2 * 1024 * 1024;
type Fault = 'get' | 'cursor' | 'put' | 'delete' | 'commit' | 'hold-commit' | undefined;
type Stored = { raw: string; bytes: number; updatedAt: number };
type Request = { result?: unknown; error?: Error; onsuccess?: () => void; onerror?: () => void; onblocked?: () => void; onupgradeneeded?: () => void };

// An event/transaction contract double, not an assertion that browser IndexedDB was tested.
// Requests run asynchronously; changes are private until commit, and abort rolls back atomically.
function indexedDbContract() {
    const records = new Map<string, unknown>();
    const unrelatedDatabase = new Map([['editor-draft', 'keep original drawing']]);
    const opened: Array<[string, number]> = [];
    const modes: IDBTransactionMode[] = [];
    const deleted: string[] = [];
    const connections: Array<{ closed: boolean }> = [];
    const waiting: Array<() => void> = [];
    const heldOpens: Array<() => void> = [];
    const heldCommits: Array<() => void> = [];
    const knobs: { fault?: Fault; open?: 'error' | 'blocked' | 'hold' | 'throw' } = {};
    let exists = false, busy = false, aborts = 0;
    const next = () => { busy = false; const start = waiting.shift(); if (start) { busy = true; queueMicrotask(start); } };
    const factory = {
        open(name: string, version: number) {
            opened.push([name, version]);
            const openFault = knobs.open; knobs.open = undefined;
            if (openFault === 'throw') throw new Error('Open denied');
            const request: Request = {};
            const connection = { closed: false }; connections.push(connection);
            const database = {
                objectStoreNames: { contains: (name: string) => exists && name === 'records' },
                createObjectStore: (name: string) => { if (name !== 'records') throw new Error('Wrong store'); exists = true; },
                close: () => { connection.closed = true; },
                onversionchange: null as (() => void) | null,
                transaction(name: string, mode: IDBTransactionMode) {
                    if (name !== 'records') throw new Error('Wrong store');
                    modes.push(mode);
                    const fault = knobs.fault; knobs.fault = undefined;
                    const jobs: Array<() => void> = [];
                    let working: Map<string, unknown>, done = false, started = false, scheduled = false;
                    const transaction = {
                        error: null as Error | null,
                        oncomplete: null as (() => void) | null,
                        onabort: null as (() => void) | null,
                        onerror: null as (() => void) | null,
                        abort() {
                            if (done) return;
                            done = true; aborts++;
                            transaction.onabort?.();
                            if (started) next();
                        },
                        objectStore: () => store,
                    };
                    const failure = () => {
                        transaction.error = new Error('Simulated IndexedDB failure');
                        transaction.onerror?.();
                        transaction.abort();
                    };
                    const commit = () => {
                        if (done) return;
                        if (fault === 'commit') { failure(); return; }
                        if (mode === 'readwrite') { records.clear(); for (const [key, value] of working) records.set(key, value); }
                        done = true; transaction.oncomplete?.(); next();
                    };
                    const schedule = () => {
                        if (!started || scheduled || done) return;
                        scheduled = true;
                        queueMicrotask(() => {
                            scheduled = false;
                            if (done) return;
                            const job = jobs.shift();
                            if (job) { job(); schedule(); }
                            else if (fault === 'hold-commit') heldCommits.push(commit);
                            else commit();
                        });
                    };
                    const enqueue = (operation: Exclude<Fault, undefined>, action: () => unknown, request: Request = {}) => {
                        jobs.push(() => {
                            if (fault === operation) { failure(); return; }
                            request.result = action(); request.onsuccess?.();
                        });
                        schedule(); return request;
                    };
                    const store = {
                        get: (key: string) => enqueue('get', () => structuredClone(working.get(key))),
                        put: (value: unknown, key: string) => enqueue('put', () => {
                            if (mode !== 'readwrite') throw new Error('Readonly write');
                            working.set(key, structuredClone(value)); return key;
                        }),
                        delete: (key: string) => enqueue('delete', () => {
                            if (mode !== 'readwrite') throw new Error('Readonly delete');
                            deleted.push(key); working.delete(key);
                        }),
                        openCursor() {
                            const request: Request = {};
                            let keys: string[] | undefined, offset = 0;
                            const advance = () => enqueue('cursor', () => {
                                keys ??= [...working.keys()].sort();
                                const key = keys[offset++];
                                return key === undefined ? null : { key, value: structuredClone(working.get(key)), continue: advance };
                            }, request);
                            advance(); return request;
                        },
                    };
                    waiting.push(() => {
                        if (done) { next(); return; }
                        started = true; working = structuredClone(records); schedule();
                    });
                    if (!busy) next();
                    return transaction;
                },
            };
            const openedSuccessfully = () => {
                request.result = database;
                if (!exists) request.onupgradeneeded?.();
                request.onsuccess?.();
            };
            queueMicrotask(() => {
                if (openFault === 'hold') heldOpens.push(openedSuccessfully);
                else if (openFault === 'error') { request.error = new Error('Open failed'); request.onerror?.(); }
                else if (openFault === 'blocked') request.onblocked?.();
                else openedSuccessfully();
            });
            return request;
        },
    };
    return { factory, records, unrelatedDatabase, opened, modes, deleted, knobs, connections, heldOpens, heldCommits, get aborts() { return aborts; } };
}

let db: ReturnType<typeof indexedDbContract>;
beforeEach(() => { db = indexedDbContract(); vi.stubGlobal('indexedDB', db.factory); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });
const ticks = async () => { for (let index = 0; index < 80; index++) await Promise.resolve(); };
const record = (raw: string, updatedAt: number): Stored => ({ raw, bytes: new TextEncoder().encode(raw).length, updatedAt });

describe('local crafting progress persistence', () => {
    it('round-trips exact encoded text non-consumingly and isolates the database', async () => {
        const store = createCraftProgressStore(), raw = JSON.stringify({ done: [1, 4], note: '红色\n🧵', board: 3 });
        await store.save(id(1), raw);
        expect(await store.load(id(1))).toBe(raw);
        expect(await store.load(id(1))).toBe(raw);
        expect(await store.load(id(2))).toBeNull();
        expect(db.deleted).toEqual([]);
        expect(db.modes).toEqual(['readwrite', 'readonly', 'readonly', 'readonly']);
        expect(db.opened.every(([name, version]) => name === DATABASE && version === 1)).toBe(true);
        expect([...db.unrelatedDatabase]).toEqual([['editor-draft', 'keep original drawing']]);
        expect(db.connections.every(connection => connection.closed)).toBe(true);
    });

    it('normalizes hexadecimal signatures and removes only the requested progress', async () => {
        const store = createCraftProgressStore();
        await store.save(id(171).toUpperCase(), 'first'); await store.save(id(172), 'second');
        expect(await store.load(id(171))).toBe('first');
        await store.remove(id(171).toUpperCase()); await store.remove(id(171));
        expect(await store.load(id(171))).toBeNull(); expect(await store.load(id(172))).toBe('second');
    });

    it.each(['', 'a'.repeat(63), 'a'.repeat(65), 'g'.repeat(64), '../' + 'a'.repeat(61), ' ' + 'a'.repeat(63)])('rejects malformed signature %j before opening storage', async key => {
        const store = createCraftProgressStore();
        await expect(store.load(key)).rejects.toThrow('signature');
        await expect(store.save(key, 'raw')).rejects.toThrow('signature');
        await expect(store.remove(key)).rejects.toThrow('signature');
        expect(db.opened).toEqual([]);
    });

    it('enforces the exact UTF-8 byte boundary without accepting oversized multibyte content', async () => {
        const store = createCraftProgressStore(), raw = 'é'.repeat(LIMIT / 2);
        await store.save(id(1), raw); expect(await store.load(id(1))).toBe(raw);
        await expect(store.save(id(1), raw + 'é')).rejects.toThrow();
        await expect(store.save(id(1), 'x'.repeat(LIMIT + 1))).rejects.toThrow();
        await expect(store.save(id(1), '')).rejects.toThrow();
        expect(await store.load(id(1))).toBe(raw);
    });

    it('keeps the 12 most recently saved patterns, including refreshes at the same clock time', async () => {
        vi.spyOn(Date, 'now').mockReturnValue(1000);
        const store = createCraftProgressStore();
        for (let index = 1; index <= 12; index++) await store.save(id(index), `pattern ${index}`);
        await store.save(id(1), 'recently updated'); await store.save(id(13), 'new');
        expect(db.records.size).toBe(12);
        expect(await store.load(id(1))).toBe('recently updated'); expect(await store.load(id(2))).toBeNull();
        for (let index = 3; index <= 12; index++) expect(await store.load(id(index))).toBe(`pattern ${index}`);
        expect(await store.load(id(13))).toBe('new');
        expect([...db.records.values()].reduce<number>((sum, entry) => sum + (entry as Stored).bytes, 0)).toBeLessThanOrEqual(32 * 1024 * 1024);
    });

    it('reports damaged records on load and prunes only this feature after a successful save', async () => {
        const store = createCraftProgressStore();
        db.records.set(id(1), { ...record('corrupt size', 1), bytes: 999 });
        db.records.set(id(2), { ...record('corrupt date', 1), updatedAt: Infinity });
        db.records.set('not-a-signature', record('unexpected', 1));
        db.records.set(id(3), record('good', 3));
        await expect(store.load(id(1))).rejects.toThrow('damaged');
        expect(await store.load(id(99))).toBeNull(); expect(db.records.size).toBe(4); expect(db.deleted).toEqual([]);
        await store.save(id(4), 'new');
        expect([...db.records.keys()].sort()).toEqual([id(3), id(4)]);
        expect([...db.unrelatedDatabase]).toEqual([['editor-draft', 'keep original drawing']]);
    });

    it.each([null, {}, { raw: 'valid text', bytes: 10, updatedAt: -1 }, { raw: '', bytes: 0, updatedAt: 1 }])('never treats a present damaged value %j as a new pattern', async value => {
        const store = createCraftProgressStore(); db.records.set(id(1), value);
        await expect(store.load(id(1))).rejects.toThrow('damaged');
        expect(db.records.get(id(1))).toEqual(value); expect(db.deleted).toEqual([]);
        expect(await store.load(id(2))).toBeNull();
    });

    it('serializes concurrent saves by transaction order without old-record rollback', async () => {
        const first = createCraftProgressStore(), second = createCraftProgressStore();
        await Promise.all([first.save(id(1), 'old'), second.save(id(1), 'new')]);
        expect(await first.load(id(1))).toBe('new');
        await Promise.all(Array.from({ length: 15 }, (_, index) => first.save(id(index + 2), `job ${index}`)));
        expect(db.records.size).toBe(12);
        expect(await first.load(id(4))).toBeNull(); expect(await first.load(id(5))).toBe('job 3');
        expect(await first.load(id(16))).toBe('job 14');
    });
});

describe('transaction failures, commit boundaries and bounded recovery', () => {
    it.each(['cursor', 'put', 'delete', 'commit'] as const)('does not evict old progress when %s fails, and can retry', async fault => {
        const store = createCraftProgressStore();
        for (let index = 1; index <= 12; index++) db.records.set(id(index), record(`old ${index}`, index));
        const before = structuredClone(db.records);
        db.knobs.fault = fault;
        await expect(store.save(id(13), 'replacement')).rejects.toThrow();
        expect(db.records).toEqual(before);
        await store.save(id(13), 'replacement');
        expect(await store.load(id(13))).toBe('replacement'); expect(await store.load(id(1))).toBeNull();
    });

    it('propagates load and remove failures rather than returning missing data or claiming deletion', async () => {
        const store = createCraftProgressStore(); await store.save(id(1), 'keep');
        db.knobs.fault = 'get'; await expect(store.load(id(1))).rejects.toThrow();
        expect(await store.load(id(1))).toBe('keep');
        db.knobs.fault = 'delete'; await expect(store.remove(id(1))).rejects.toThrow();
        expect(await store.load(id(1))).toBe('keep');
        await store.remove(id(1)); expect(await store.load(id(1))).toBeNull();
    });

    it('waits for transaction commit before reporting a save or exposing evictions', async () => {
        const store = createCraftProgressStore();
        for (let index = 1; index <= 12; index++) db.records.set(id(index), record(`old ${index}`, index));
        db.knobs.fault = 'hold-commit'; let resolved = false;
        const saving = store.save(id(13), 'new').then(() => { resolved = true; });
        await ticks(); expect(resolved).toBe(false); expect(db.records.has(id(1))).toBe(true); expect(db.records.has(id(13))).toBe(false);
        db.heldCommits.shift()!(); await saving;
        expect(resolved).toBe(true); expect(db.records.has(id(1))).toBe(false); expect(db.records.has(id(13))).toBe(true);
    });

    it('aborts a stalled transaction after 5 seconds, and late completion cannot replace a newer save', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const store = createCraftProgressStore(); await store.save(id(1), 'original');
        db.knobs.fault = 'hold-commit';
        const stalled = expect(store.save(id(1), 'stalled')).rejects.toThrow('timed out');
        await ticks(); await vi.advanceTimersByTimeAsync(4999); expect(db.aborts).toBe(0);
        await vi.advanceTimersByTimeAsync(1); await stalled;
        expect(db.aborts).toBe(1); expect(await store.load(id(1))).toBe('original');
        await store.save(id(1), 'newer'); db.heldCommits.shift()!();
        expect(await store.load(id(1))).toBe('newer'); expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['error', 'blocked', 'throw'] as const)('rejects an open %s and allows a later retry', async fault => {
        const store = createCraftProgressStore(); db.knobs.open = fault;
        await expect(store.save(id(1), 'first')).rejects.toThrow();
        await store.save(id(1), 'retry'); expect(await store.load(id(1))).toBe('retry');
    });

    it('times out a stalled open, closes its late connection and does not publish its old write', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const store = createCraftProgressStore(); db.knobs.open = 'hold';
        const stalled = expect(store.save(id(1), 'late')).rejects.toThrow('timed out');
        await ticks(); await vi.advanceTimersByTimeAsync(5000); await stalled;
        await store.save(id(1), 'newer'); db.heldOpens.shift()!();
        expect(await store.load(id(1))).toBe('newer');
        expect(db.connections.every(connection => connection.closed)).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('rejects when IndexedDB is unavailable, without a fake memory-only success', async () => {
        vi.stubGlobal('indexedDB', undefined);
        await expect(createCraftProgressStore().save(id(1), 'raw')).rejects.toThrow();
    });
});

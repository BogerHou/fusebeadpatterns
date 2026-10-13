/** Local-only crafting checkpoints, isolated from editor drafts and language transfers. */
export interface CraftProgressStore {
    load(id: string): Promise<string | null>;
    save(id: string, raw: string): Promise<void>;
    remove(id: string): Promise<void>;
}

const DATABASE = 'fusebead-crafting-progress';
const STORE = 'records';
const MAX_RECORD_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const MAX_RECORDS = 12;
const TIMEOUT_MS = 5000;
const SIGNATURE = /^[a-f\d]{64}$/i;
type ProgressRecord = { raw: string; bytes: number; updatedAt: number };

function signature(id: string): string {
    if (typeof id !== 'string' || !SIGNATURE.test(id)) throw new Error('Invalid crafting progress signature');
    return id.toLowerCase();
}

function rawBytes(raw: string): number {
    // The character check avoids allocating an oversized encoder buffer.
    if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_RECORD_BYTES) throw new Error('Invalid crafting progress data');
    const bytes = new TextEncoder().encode(raw).byteLength;
    if (bytes > MAX_RECORD_BYTES) throw new Error('Crafting progress exceeds its storage limit');
    return bytes;
}

function validRecord(value: unknown): value is ProgressRecord {
    if (!value || typeof value !== 'object') return false;
    const entry = value as Partial<ProgressRecord>;
    if (!Number.isSafeInteger(entry.updatedAt) || entry.updatedAt! < 0 || entry.updatedAt! >= Number.MAX_SAFE_INTEGER) return false;
    try { return entry.bytes === rawBytes(entry.raw!); } catch { return false; }
}

export function createCraftProgressStore(): CraftProgressStore {
    function transaction<T>(mode: IDBTransactionMode, operate: (
        store: IDBObjectStore, result: (value: T) => void, guard: (callback: () => void) => void,
    ) => void): Promise<T> {
        return new Promise((resolve, reject) => {
            let database: IDBDatabase | undefined;
            let active: IDBTransaction | undefined;
            let open: IDBOpenDBRequest | undefined;
            let settled = false;
            let value: T;
            const finish = (error?: unknown) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                database?.close();
                if (error) reject(error); else resolve(value);
            };
            const fail = (error: unknown) => {
                finish(error);
                try { (active ?? open?.transaction)?.abort(); } catch { /* Already completed or aborted. */ }
            };
            const guard = (callback: () => void) => {
                if (settled) return;
                try { callback(); } catch (error) { fail(error); }
            };
            const timer = setTimeout(() => fail(new Error('Crafting progress storage timed out')), TIMEOUT_MS);
            guard(() => {
                open = indexedDB.open(DATABASE, 1);
                open.onupgradeneeded = () => {
                    if (settled) { try { open?.transaction?.abort(); } catch { /* Timed-out upgrade. */ } return; }
                    guard(() => {
                        if (!open!.result.objectStoreNames.contains(STORE)) open!.result.createObjectStore(STORE);
                    });
                };
                open.onerror = () => fail(open?.error ?? new Error('Crafting progress storage could not open'));
                open.onblocked = () => fail(new Error('Crafting progress storage blocked'));
                open.onsuccess = () => {
                    database = open!.result;
                    if (settled) { database.close(); return; }
                    database.onversionchange = () => database?.close();
                    guard(() => {
                        active = database!.transaction(STORE, mode);
                        active.oncomplete = () => finish();
                        active.onabort = () => fail(active?.error ?? new Error('Crafting progress storage aborted'));
                        active.onerror = () => fail(active?.error ?? new Error('Crafting progress storage failed'));
                        operate(active.objectStore(STORE), result => { value = result; }, guard);
                    });
                };
            });
        });
    }

    return {
        async load(id) {
            const key = signature(id);
            return transaction<string | null>('readonly', (store, result, guard) => {
                const request = store.get(key);
                request.onsuccess = () => guard(() => {
                    if (request.result === undefined) { result(null); return; }
                    if (!validRecord(request.result)) throw new Error('Saved crafting progress is damaged');
                    result(request.result.raw);
                });
            });
        },
        async save(id, raw) {
            const key = signature(id), bytes = rawBytes(raw);
            return transaction<void>('readwrite', (store, _result, guard) => {
                const records: Array<{ key: string; entry: ProgressRecord }> = [];
                const invalid: IDBValidKey[] = [];
                const cursor = store.openCursor();
                cursor.onsuccess = () => guard(() => {
                    const item = cursor.result;
                    if (item) {
                        if (typeof item.key === 'string' && SIGNATURE.test(item.key) && item.key === item.key.toLowerCase() && validRecord(item.value)) {
                            records.push({ key: item.key, entry: item.value });
                        } else invalid.push(item.key);
                        item.continue();
                        return;
                    }
                    // Readwrite transactions serialize this scan, update and pruning together.
                    const newest = records.reduce((max, record) => Math.max(max, record.entry.updatedAt), 0);
                    const entry: ProgressRecord = { raw, bytes, updatedAt: Math.min(Number.MAX_SAFE_INTEGER - 1, Math.max(Date.now(), newest + 1)) };
                    const write = store.put(entry, key);
                    write.onsuccess = () => guard(() => {
                        const older = records.filter(record => record.key !== key).sort((a, b) => b.entry.updatedAt - a.entry.updatedAt || a.key.localeCompare(b.key));
                        let count = 1, total = bytes;
                        for (const record of older) {
                            if (count < MAX_RECORDS && total + record.entry.bytes <= MAX_TOTAL_BYTES) {
                                count++; total += record.entry.bytes;
                            } else store.delete(record.key);
                        }
                        for (const invalidKey of invalid) if (invalidKey !== key) store.delete(invalidKey);
                        // All deletes commit atomically with the new record; errors retain old data.
                    });
                });
            });
        },
        async remove(id) {
            const key = signature(id);
            return transaction<void>('readwrite', store => { store.delete(key); });
        },
    };
}

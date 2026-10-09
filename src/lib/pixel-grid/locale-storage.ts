/** Temporary, local-only storage for workspaces too large for sessionStorage. */
export interface PixelLocaleStore {
    put(key: string, raw: string, expiresAt: number): Promise<void>;
    take(key: string): Promise<string | null>;
    remove(key: string): Promise<void>;
}

const DATABASE = 'fusebead-pixel-language-transfer';
const STORE = 'transfers';

export function createPixelLocaleStore(): PixelLocaleStore {
    function transaction<T>(operate: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
        return new Promise((resolve, reject) => {
            let database: IDBDatabase | undefined;
            let active: IDBTransaction | undefined;
            let settled = false;
            let value: T;
            const finish = (error?: unknown) => {
                if (settled) return;
                settled = true; clearTimeout(timer); database?.close();
                if (error) reject(error); else resolve(value);
            };
            const timer = setTimeout(() => {
                try { active?.abort(); } catch { /* A transaction may have completed just before the deadline. */ }
                finish(new Error('Pixel transfer storage timed out'));
            }, 5000);
            try {
                const request = indexedDB.open(DATABASE, 1);
                request.onupgradeneeded = () => {
                    if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
                };
                request.onerror = () => finish(request.error);
                request.onblocked = () => finish(new Error('Pixel transfer storage blocked'));
                request.onsuccess = () => {
                    database = request.result;
                    if (settled) { database.close(); return; }
                    try {
                        active = database.transaction(STORE, 'readwrite');
                        active.oncomplete = () => finish();
                        active.onabort = () => finish(active?.error ?? new Error('Pixel transfer storage aborted'));
                        active.onerror = () => finish(active?.error ?? new Error('Pixel transfer storage failed'));
                        const store = active.objectStore(STORE);
                        // Only this feature's expired records are removed. Each active tab
                        // has its own random key, so another tab's transfer stays intact.
                        const cursor = store.openCursor();
                        cursor.onsuccess = () => {
                            const item = cursor.result;
                            if (!item) return;
                            if (!item.value || typeof item.value.expiresAt !== 'number' || item.value.expiresAt < Date.now()) item.delete();
                            item.continue();
                        };
                        operate(store, result => { value = result; });
                    } catch (error) { active?.abort(); finish(error); }
                };
            } catch (error) { finish(error); }
        });
    }
    return {
        put: (key, raw, expiresAt) => transaction<void>(store => { store.put({ raw, expiresAt }, key); }),
        take: key => transaction<string | null>((store, result) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const entry = request.result;
                result(entry && entry.expiresAt >= Date.now() && typeof entry.raw === 'string' ? entry.raw : null);
                store.delete(key);
            };
        }),
        remove: key => transaction<void>(store => { store.delete(key); }),
    };
}

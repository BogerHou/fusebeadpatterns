/** Separate, non-content preferences. Pixel projects and language transfers stay unchanged. */
export type PixelGridPrintPreferences = Readonly<{
    paper: 'a4' | 'letter';
    mode: 'overview' | 'tiled';
    content: 'artwork' | 'blank';
}>;

export const PIXEL_GRID_PRINT_PREFERENCES_KEY = 'fuse-bead-patterns:pixel-grid:print-preferences:v1';
export const DEFAULT_PIXEL_GRID_PRINT_PREFERENCES: PixelGridPrintPreferences = Object.freeze({
    paper: 'a4', mode: 'overview', content: 'artwork',
});
type StorageArea = Pick<Storage, 'getItem' | 'setItem'>;

function validate(value: unknown): PixelGridPrintPreferences | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 3 || !['paper', 'mode', 'content'].every(key => keys.includes(key))) return null;
    const fields = Object.getOwnPropertyDescriptors(value);
    for (const key of ['paper', 'mode', 'content']) if (!fields[key] || !Object.hasOwn(fields[key], 'value')) return null;
    const { paper, mode, content } = { paper: fields.paper.value, mode: fields.mode.value, content: fields.content.value };
    if ((paper !== 'a4' && paper !== 'letter') || (mode !== 'overview' && mode !== 'tiled') || (content !== 'artwork' && content !== 'blank')) return null;
    return Object.freeze({ paper, mode, content });
}

function parse(raw: string | null): PixelGridPrintPreferences {
    if (raw === null || raw.length > 128) return DEFAULT_PIXEL_GRID_PRINT_PREFERENCES;
    try { return validate(JSON.parse(raw)) ?? DEFAULT_PIXEL_GRID_PRINT_PREFERENCES; }
    catch { return DEFAULT_PIXEL_GRID_PRINT_PREFERENCES; }
}

function equal(a: PixelGridPrintPreferences, b: PixelGridPrintPreferences) {
    return a.paper === b.paper && a.mode === b.mode && a.content === b.content;
}

/** A cached external-store snapshot prevents hydration differences and render loops. */
export function createPixelGridPrintPreferenceStore(getStorage: () => StorageArea | null) {
    let snapshot = DEFAULT_PIXEL_GRID_PRINT_PREFERENCES;
    let cachedRaw: string | null | undefined;
    let localOnly = false;
    const listeners = new Set<() => void>();
    const getSnapshot = () => {
        if (localOnly) return snapshot;
        let raw: string | null;
        try { raw = getStorage()?.getItem(PIXEL_GRID_PRINT_PREFERENCES_KEY) ?? null; }
        catch { raw = null; }
        if (raw !== cachedRaw) {
            cachedRaw = raw;
            const next = parse(raw);
            if (!equal(snapshot, next)) snapshot = next;
        }
        return snapshot;
    };
    return {
        getSnapshot,
        getServerSnapshot: () => DEFAULT_PIXEL_GRID_PRINT_PREFERENCES,
        subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
        refresh() {
            const before = snapshot;
            getSnapshot();
            if (before !== snapshot) for (const listener of listeners) listener();
        },
        setPreferences(value: unknown) {
            let next: PixelGridPrintPreferences | null;
            try { next = validate(value); } catch { return false; }
            if (!next) return false;
            const before = getSnapshot();
            if (!equal(snapshot, next)) snapshot = next;
            const raw = JSON.stringify(next);
            try {
                const storage = getStorage();
                if (!storage) throw new Error('Storage unavailable');
                storage.setItem(PIXEL_GRID_PRINT_PREFERENCES_KEY, raw);
                cachedRaw = raw; localOnly = false;
            } catch {
                // A blocked/quota-limited store must not make the current-page controls unusable.
                localOnly = true;
            }
            if (before !== snapshot) for (const listener of listeners) listener();
            return true;
        },
    };
}

const browserStore = createPixelGridPrintPreferenceStore(() => typeof window === 'undefined' ? null : window.sessionStorage);
export const getPixelGridPrintPreferences = browserStore.getSnapshot;
export const getServerPixelGridPrintPreferences = browserStore.getServerSnapshot;
export const setPixelGridPrintPreferences = browserStore.setPreferences;
export function subscribePixelGridPrintPreferences(listener: () => void) {
    const unsubscribe = browserStore.subscribe(listener);
    const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === PIXEL_GRID_PRINT_PREFERENCES_KEY) browserStore.refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => { unsubscribe(); window.removeEventListener('storage', onStorage); };
}

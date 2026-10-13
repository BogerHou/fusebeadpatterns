import { localeRoutes } from '../i18n/routes';
import { getBoardOption, getPaletteOption } from '../editor/config';
import { EDITOR_PROJECT_FILE_TYPE, parseEditorProject, type EditorDraft } from '../editor/draft';
import { createPixelLocaleStore, type PixelTransferStore } from './locale-storage';
import { parsePixelWorkspaceSnapshot, serializePixelWorkspaceSnapshot, type PixelLocaleSnapshot } from './locale-navigation';

export const PIXEL_BEAD_QUERY = 'pixel-project';
export const PIXEL_BEAD_RETURN_QUERY = 'bead-return';
export const PIXEL_BEAD_STORAGE_KEY = 'pixel-bead-journey-v1';
export const PIXEL_BEAD_MAX_AGE = 24 * 60 * 60 * 1000;
const PAYLOAD_PREFIX = 'pixel-bead-return-v1:';
const PIXEL_PATHS = ['/pixel-art-grid', '/de/pixel-art-generator', '/fr/image-en-pixel-art', '/ja/pixel-art-converter'];
const EDITOR_PATHS = (['en', 'de', 'fr', 'ja'] as const).map(locale => localeRoutes[locale].editor);
type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Pointer = {
    version: 1; key: string; savedAt: number; sourcePath: string; editorPath: string;
    sourceWidth: number; sourceHeight: number; draft: EditorDraft;
    storage: 'session' | 'indexeddb'; status: 'pending' | 'opened' | 'dismissed';
};
export type PixelBeadTransfer = Pick<Pointer, 'key' | 'draft' | 'sourceWidth' | 'sourceHeight'> & { returnHref: string };
type Options = { store?: PixelTransferStore; now?: number; signal?: AbortSignal };
const path = (href: string) => new URL(href, 'https://fusebeadpatterns.art').pathname.replace(/\/$/, '') || '/';
const validKey = (key: unknown): key is string => typeof key === 'string' && /^[a-f\d-]{36}$/i.test(key);
function assertDraft(value: unknown): EditorDraft {
    const parsed = parseEditorProject(JSON.stringify({ type: EDITOR_PROJECT_FILE_TYPE, version: 1, savedAt: new Date(0).toISOString(), draft: value }));
    if (!parsed || parsed.sourceMode !== 'blank' || parsed.imageSrc !== null || parsed.selectedPaletteIds.length !== 1 || !parsed.editedPattern) throw new Error('Invalid pixel bead project');
    const palette = getPaletteOption(parsed.selectedPaletteIds[0]), board = getBoardOption(parsed.boardId);
    if (!palette || !board || palette.boardId !== board.id || parsed.editedPattern.width !== board.beadsPerRow * parsed.boardWidth || parsed.editedPattern.height !== board.beadsPerRow * parsed.boardHeight) throw new Error('Invalid pixel bead board');
    return parsed;
}
function readPointer(storage: StorageArea, now: number): Pointer | null {
    const raw = storage.getItem(PIXEL_BEAD_STORAGE_KEY);
    if (!raw) return null;
    if (raw.length > 1_500_000) throw new Error('Invalid pixel bead transfer');
    const p = JSON.parse(raw) as Pointer;
    if (!p || p.version !== 1 || !validKey(p.key) || !Number.isFinite(p.savedAt) || p.savedAt > now || now - p.savedAt > PIXEL_BEAD_MAX_AGE ||
        !PIXEL_PATHS.includes(p.sourcePath) || !EDITOR_PATHS.includes(p.editorPath) || !['session', 'indexeddb'].includes(p.storage) || !['pending', 'opened', 'dismissed'].includes(p.status) ||
        !Number.isInteger(p.sourceWidth) || p.sourceWidth < 1 || p.sourceWidth > 128 || !Number.isInteger(p.sourceHeight) || p.sourceHeight < 1 || p.sourceHeight > 128) throw new Error('Pixel bead transfer unavailable or expired');
    p.draft = assertDraft(p.draft);
    return p;
}
function returnHref(p: Pointer, editorPath = p.editorPath) {
    const index = EDITOR_PATHS.indexOf(editorPath);
    return `${PIXEL_PATHS[index < 0 ? PIXEL_PATHS.indexOf(p.sourcePath) : index]}?${PIXEL_BEAD_RETURN_QUERY}=${p.key}`;
}
async function removePayload(p: Pointer, storage: StorageArea, store: PixelTransferStore) {
    if (p.storage === 'session') storage.removeItem(PAYLOAD_PREFIX + p.key);
    else await store.remove(p.key);
}

/** Save the complete return drawing before publishing an incoming bead project. */
export async function savePixelBeadTransfer(snapshot: PixelLocaleSnapshot, draft: EditorDraft, sourceHref: string, editorHref: string, storage: StorageArea, options: Options = {}): Promise<{ key: string; editorHref: string; returnHref: string }> {
    const now = options.now ?? Date.now(), store = options.store ?? createPixelLocaleStore();
    const sourcePath = path(sourceHref), editorPath = path(editorHref);
    if (!PIXEL_PATHS.includes(sourcePath) || EDITOR_PATHS[PIXEL_PATHS.indexOf(sourcePath)] !== editorPath) throw new Error('Invalid pixel bead destination');
    options.signal?.throwIfAborted();
    const checked = assertDraft(draft), raw = serializePixelWorkspaceSnapshot(snapshot);
    const oldRaw = storage.getItem(PIXEL_BEAD_STORAGE_KEY);
    let previous: Pointer | null = null;
    try { previous = readPointer(storage, now); } catch { /* Keep unrelated or expired values until the new complete record commits. */ }
    const p: Pointer = { version: 1, key: crypto.randomUUID(), savedAt: now, sourcePath, editorPath, sourceWidth: snapshot.grid.width, sourceHeight: snapshot.grid.height, draft: checked, storage: 'session', status: 'pending' };
    let committed = false;
    let attemptedPointer: string | null = null;
    try {
        let smallSaved = false;
        if (raw.length <= 1_000_000) {
            try { storage.setItem(PAYLOAD_PREFIX + p.key, raw); smallSaved = storage.getItem(PAYLOAD_PREFIX + p.key) === raw; }
            catch { /* A large/blocked session payload can use local IndexedDB. */ }
            if (!smallSaved) { try { storage.removeItem(PAYLOAD_PREFIX + p.key); } catch { /* Nothing committed. */ } }
        }
        if (!smallSaved) { p.storage = 'indexeddb'; await store.put(p.key, raw, now + PIXEL_BEAD_MAX_AGE); }
        options.signal?.throwIfAborted();
        const pointer = JSON.stringify(p);
        attemptedPointer = pointer;
        storage.setItem(PIXEL_BEAD_STORAGE_KEY, pointer);
        if (storage.getItem(PIXEL_BEAD_STORAGE_KEY) !== pointer) throw new Error('Pixel bead transfer was not saved');
        committed = true;
    } catch (error) {
        // Do not leave a new request or destroy the previous recoverable journey.
        try {
            // A cancelled slow put can finish after a newer successful journey.
            // It has not attempted a pointer write and must leave that journey alone.
            // Once attempted, set/readback/catch are synchronous with no await: a
            // later UI task cannot interleave, even when readback itself throws.
            if (attemptedPointer !== null) {
                if (oldRaw === null) storage.removeItem(PIXEL_BEAD_STORAGE_KEY);
                else storage.setItem(PIXEL_BEAD_STORAGE_KEY, oldRaw);
            }
        } catch { /* Source workspace is still open; do not overwrite an unknown newer value. */ }
        try { await removePayload(p, storage, store); } catch { /* IndexedDB prunes expired records. */ }
        throw error;
    }
    if (committed && previous) { try { await removePayload(previous, storage, store); } catch { /* Expired records can be pruned later. */ } }
    return { key: p.key, editorHref: `${editorPath}?${PIXEL_BEAD_QUERY}=${p.key}`, returnHref: returnHref(p) };
}

export function peekPixelBeadTransfer(href: string, storage: StorageArea, now = Date.now()): PixelBeadTransfer | null {
    const url = new URL(href, 'https://fusebeadpatterns.art'), key = url.searchParams.get(PIXEL_BEAD_QUERY);
    if (key === null || !EDITOR_PATHS.includes(path(href))) return null;
    const p = readPointer(storage, now);
    if (!p || key !== p.key || p.status !== 'pending') throw new Error('Pixel bead transfer unavailable or expired');
    return { key: p.key, draft: p.draft, sourceWidth: p.sourceWidth, sourceHeight: p.sourceHeight, returnHref: returnHref(p, path(href)) };
}
function setStatus(key: string, status: Pointer['status'], storage: StorageArea) {
    const p = readPointer(storage, Date.now());
    if (!p || p.key !== key) throw new Error('Pixel bead transfer unavailable');
    const next = JSON.stringify({ ...p, status });
    storage.setItem(PIXEL_BEAD_STORAGE_KEY, next);
    if (storage.getItem(PIXEL_BEAD_STORAGE_KEY) !== next) throw new Error('Pixel bead transfer status was not saved');
}
export const ackPixelBeadTransfer = (key: string, storage: StorageArea) => setStatus(key, 'opened', storage);
export const dismissPixelBeadTransfer = (key: string, storage: StorageArea) => setStatus(key, 'dismissed', storage);
export function getPixelBeadReturnHref(href: string, storage: StorageArea, now = Date.now()): string | null {
    if (!EDITOR_PATHS.includes(path(href))) return null;
    const p = readPointer(storage, now);
    return p ? returnHref(p, path(href)) : null;
}
export function clearPixelBeadQuery(href: string): string {
    const u = new URL(href, 'https://fusebeadpatterns.art'); u.searchParams.delete(PIXEL_BEAD_QUERY);
    return u.pathname + u.search + u.hash;
}
export function isPixelBeadReturn(href: string): boolean {
    const u = new URL(href, 'https://fusebeadpatterns.art');
    return PIXEL_PATHS.includes(path(href)) && u.searchParams.has(PIXEL_BEAD_RETURN_QUERY);
}
/** Read without consuming; the UI acknowledges only after its snapshot is installed. */
export async function readPixelBeadReturn(href: string, storage: StorageArea, options: Options = {}): Promise<PixelLocaleSnapshot | null> {
    if (!isPixelBeadReturn(href)) return null;
    const key = new URL(href, 'https://fusebeadpatterns.art').searchParams.get(PIXEL_BEAD_RETURN_QUERY);
    const p = readPointer(storage, options.now ?? Date.now());
    if (!p || p.key !== key) throw new Error('Pixel drawing unavailable or expired');
    const raw = p.storage === 'session' ? storage.getItem(PAYLOAD_PREFIX + p.key) : await (options.store ?? createPixelLocaleStore()).read(p.key);
    if (!raw) throw new Error('Pixel drawing unavailable or expired');
    return parsePixelWorkspaceSnapshot(raw);
}
export async function finishPixelBeadReturn(href: string, storage: StorageArea, options: Options = {}): Promise<void> {
    if (!isPixelBeadReturn(href)) return;
    const p = readPointer(storage, options.now ?? Date.now());
    if (!p || new URL(href, 'https://fusebeadpatterns.art').searchParams.get(PIXEL_BEAD_RETURN_QUERY) !== p.key) return;
    // Remove the pointer first. Cleanup failure must not revoke an already restored drawing.
    storage.removeItem(PIXEL_BEAD_STORAGE_KEY);
    await removePayload(p, storage, options.store ?? createPixelLocaleStore());
}
export function clearPixelBeadReturnQuery(href: string): string {
    const u = new URL(href, 'https://fusebeadpatterns.art'); u.searchParams.delete(PIXEL_BEAD_RETURN_QUERY);
    return u.pathname + u.search + u.hash;
}

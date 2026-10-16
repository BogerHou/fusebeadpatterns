import { blockShapePaths } from './routes';
import { exactKeys, plainRecord, validateShapeDraft, validateShapeState, type BlockShapeState, type ShapeDraft } from './project';

export const BLOCK_SHAPE_LOCALE_KEY = 'fbp-block-shape-locale-v1';
const MAX_AGE = 30 * 60 * 1000;
const paths = Object.values(blockShapePaths);
type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type ShapeLocaleSnapshot = { state: BlockShapeState; saved: boolean; draft: ShapeDraft };
export type ShapeLocaleRead = { raw: string; snapshot: ShapeLocaleSnapshot };
const pathname = (href: string) => new URL(href, 'https://fusebeadpatterns.art').pathname.replace(/\/$/, '');

export function isShapeLocaleNavigation(from: string, href: string): boolean {
    try { const a = new URL(from), b = new URL(href, a); return a.origin === b.origin && paths.includes(pathname(a.href)) && paths.includes(pathname(b.href)); }
    catch { return false; }
}
function checkedSnapshot(value: unknown): ShapeLocaleSnapshot {
    if (!plainRecord(value) || !exactKeys(value, ['state', 'saved', 'draft']) || typeof value.saved !== 'boolean') throw new Error('INVALID_TRANSFER');
    return { state: validateShapeState(value.state), saved: value.saved, draft: validateShapeDraft(value.draft) };
}
export function saveShapeLocaleSnapshot(snapshot: ShapeLocaleSnapshot, href: string, storage: StorageArea, now = Date.now()): boolean {
    let previous: string | null = null, attempted = false;
    try {
        if (!paths.includes(pathname(href)) || !Number.isFinite(now)) return false;
        const raw = JSON.stringify({ version: 1, destination: pathname(href), savedAt: now, snapshot: checkedSnapshot(snapshot) });
        previous = storage.getItem(BLOCK_SHAPE_LOCALE_KEY); attempted = true;
        storage.setItem(BLOCK_SHAPE_LOCALE_KEY, raw);
        if (storage.getItem(BLOCK_SHAPE_LOCALE_KEY) !== raw) throw new Error('TRANSFER_FAILED');
        return true;
    } catch {
        if (attempted) try { if (previous === null) storage.removeItem(BLOCK_SHAPE_LOCALE_KEY); else storage.setItem(BLOCK_SHAPE_LOCALE_KEY, previous); } catch { /* Source remains intact. */ }
        return false;
    }
}
export function readShapeLocaleSnapshot(href: string, storage: StorageArea, now = Date.now()): ShapeLocaleRead | null {
    const raw = storage.getItem(BLOCK_SHAPE_LOCALE_KEY);
    if (raw === null) return null;
    if (raw.length > 65_536) throw new Error('INVALID_TRANSFER');
    const value: unknown = JSON.parse(raw);
    if (!plainRecord(value) || !exactKeys(value, ['version', 'destination', 'savedAt', 'snapshot'])
        || value.version !== 1 || !paths.includes(value.destination as string) || value.destination !== pathname(href)
        || typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt) || !Number.isFinite(now)
        || value.savedAt > now || now - value.savedAt > MAX_AGE) throw new Error('INVALID_TRANSFER');
    return { raw, snapshot: checkedSnapshot(value.snapshot) };
}
export function acknowledgeShapeLocaleSnapshot(read: ShapeLocaleRead, storage: StorageArea): boolean {
    try { if (storage.getItem(BLOCK_SHAPE_LOCALE_KEY) !== read.raw) return false; storage.removeItem(BLOCK_SHAPE_LOCALE_KEY); return storage.getItem(BLOCK_SHAPE_LOCALE_KEY) === null; }
    catch { return false; }
}
export function discardShapeLocaleSnapshot(storage: StorageArea): boolean {
    try { storage.removeItem(BLOCK_SHAPE_LOCALE_KEY); return storage.getItem(BLOCK_SHAPE_LOCALE_KEY) === null; } catch { return false; }
}

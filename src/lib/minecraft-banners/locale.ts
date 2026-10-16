import { bannerPaths } from './routes';
import { parseBannerProject, serializeBannerProject, type BannerWorkspace } from './project';

export const BANNER_TRANSFER_KEY = 'minecraft-banner-workspace-transfer-v1';
export const BANNER_TRANSFER_MAX_BYTES = 65_536;
type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Snapshot = { workspace: BannerWorkspace; saved: boolean };
const paths = Object.values(bannerPaths).flatMap(Object.values);
const pathname = (url: URL) => url.pathname.replace(/\/$/, '');

export function isBannerNavigation(from: string, to: string): boolean {
    try {
        const source = new URL(from), target = new URL(to, source);
        return source.origin === target.origin && paths.includes(pathname(source)) && paths.includes(pathname(target));
    } catch { return false; }
}

export function saveBannerTransfer(snapshot: Snapshot, destination: string, storage: StorageArea, now = Date.now()): boolean {
    let previous: string | null = null, attempted = false;
    try {
        const target = pathname(new URL(destination));
        if (!paths.includes(target) || typeof snapshot.saved !== 'boolean' || !Number.isFinite(now)) return false;
        const raw = JSON.stringify({ version: 1, destination: target, savedAt: now, saved: snapshot.saved, project: serializeBannerProject(snapshot.workspace) });
        if (new TextEncoder().encode(raw).length > BANNER_TRANSFER_MAX_BYTES) return false;
        previous = storage.getItem(BANNER_TRANSFER_KEY); attempted = true;
        storage.setItem(BANNER_TRANSFER_KEY, raw);
        if (storage.getItem(BANNER_TRANSFER_KEY) !== raw) throw new Error('TRANSFER_WRITE_FAILED');
        return true;
    } catch {
        if (attempted) try { if (previous === null) storage.removeItem(BANNER_TRANSFER_KEY); else storage.setItem(BANNER_TRANSFER_KEY, previous); } catch { /* The live workspace has not changed. */ }
        return false;
    }
}

export function readBannerTransfer(href: string, storage: StorageArea, now = Date.now()): (Snapshot & { raw: string }) | null {
    const raw = storage.getItem(BANNER_TRANSFER_KEY);
    if (raw === null) return null;
    if (new TextEncoder().encode(raw).length > BANNER_TRANSFER_MAX_BYTES) throw new Error('INVALID_TRANSFER');
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'destination,project,saved,savedAt,version'
        || value.version !== 1 || typeof value.project !== 'string' || typeof value.saved !== 'boolean'
        || typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt) || !Number.isFinite(now) || value.savedAt > now || now - value.savedAt > 300_000
        || !paths.includes(value.destination) || value.destination !== pathname(new URL(href))) throw new Error('INVALID_TRANSFER');
    return { workspace: parseBannerProject(value.project), saved: value.saved, raw };
}

export function acknowledgeBannerTransfer(raw: string, storage: StorageArea): boolean {
    try {
        if (storage.getItem(BANNER_TRANSFER_KEY) !== raw) return false;
        storage.removeItem(BANNER_TRANSFER_KEY);
        return storage.getItem(BANNER_TRANSFER_KEY) === null;
    } catch { return false; }
}

export function discardBannerTransfer(getStorage: () => StorageArea): boolean {
    try { const storage = getStorage(); storage.removeItem(BANNER_TRANSFER_KEY); return storage.getItem(BANNER_TRANSFER_KEY) === null; }
    catch { return false; }
}

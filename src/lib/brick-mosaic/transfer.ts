import { brickCatalog } from './catalog';
import type { Mosaic } from './core';
import { parseMosaicProject, serializeMosaicProject } from './project';
import { brickPaths } from './routes';

export const BRICK_LOCALE_KEY = 'brick-mosaic-locale-transfer-v1';
export type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const MAX_TRANSFER_BYTES = 2 * 1024 * 1024;
const MAX_AGE_MS = 5 * 60 * 1000;
const paths: readonly string[] = Object.values(brickPaths);
const pathname = (url: URL) => url.pathname.replace(/\/$/, '');
const invalid = (): never => { throw new Error('INVALID_BRICK_TRANSFER'); };

function httpUrl(href: string, base?: URL): URL {
    const url = new URL(href, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return invalid();
    return url;
}

function checkBudget(raw: string): void {
    if (typeof raw !== 'string') return invalid();
    if (raw.length > MAX_TRANSFER_BYTES || new TextEncoder().encode(raw).length > MAX_TRANSFER_BYTES) {
        throw new Error('BRICK_TRANSFER_TOO_LARGE');
    }
}

export function isBrickLocaleNavigation(from: string, to: string): boolean {
    try {
        const source = httpUrl(from), target = httpUrl(to, source);
        return source.origin === target.origin && paths.includes(pathname(source)) && paths.includes(pathname(target));
    } catch { return false; }
}

/** A failed save must prevent navigation; the caller's live model stays owned by the caller. */
export function saveBrickTransfer(model: Mosaic, saved: boolean, destination: string, storage: StorageArea, now = Date.now()): boolean {
    let previous: string | null = null, attempted = false;
    try {
        const target = httpUrl(destination), path = pathname(target);
        if (!paths.includes(path) || typeof saved !== 'boolean' || !Number.isFinite(now) || now < 0) return false;
        // Pure non-browser callers have no ambient origin; recovery is still bound to the stored origin.
        if (typeof globalThis.location !== 'undefined' && target.origin !== globalThis.location.origin) return false;
        const raw = JSON.stringify({
            version: 1, origin: target.origin, destination: path, savedAt: now,
            project: serializeMosaicProject(model, brickCatalog), saved,
        });
        checkBudget(raw);
        previous = storage.getItem(BRICK_LOCALE_KEY);
        if (previous !== null && typeof previous !== 'string') return false;
        attempted = true;
        storage.setItem(BRICK_LOCALE_KEY, raw);
        if (storage.getItem(BRICK_LOCALE_KEY) !== raw) throw new Error('BRICK_TRANSFER_WRITE_FAILED');
        return true;
    } catch {
        if (attempted) {
            try {
                if (previous === null) storage.removeItem(BRICK_LOCALE_KEY);
                else storage.setItem(BRICK_LOCALE_KEY, previous);
            } catch { /* Navigation remains blocked; the live workspace has not been replaced. */ }
        }
        return false;
    }
}

/** Read without consuming. Install first, then compare raw and remove in the caller. */
export function readBrickTransfer(href: string, storage: StorageArea, now = Date.now()): { mosaic: Mosaic; saved: boolean; raw: string } | null {
    const target = httpUrl(href);
    if (!paths.includes(pathname(target)) || !Number.isFinite(now) || now < 0) return invalid();
    // Do not turn unavailable storage into an empty workspace.
    const raw = storage.getItem(BRICK_LOCALE_KEY);
    if (raw === null) return null;
    checkBudget(raw);
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
    const row = value as Record<string, unknown>;
    if (Object.keys(row).sort().join(',') !== 'destination,origin,project,saved,savedAt,version'
        || row.version !== 1 || row.origin !== target.origin || row.destination !== pathname(target)
        || typeof row.destination !== 'string' || !paths.includes(row.destination)
        || typeof row.project !== 'string' || typeof row.saved !== 'boolean'
        || typeof row.savedAt !== 'number' || !Number.isFinite(row.savedAt) || row.savedAt < 0
        || row.savedAt > now || now - row.savedAt > MAX_AGE_MS) return invalid();
    return { mosaic: parseMosaicProject(row.project, brickCatalog), saved: row.saved, raw };
}

export function discardBrickTransfer(storage: () => StorageArea): boolean {
    try {
        const area = storage();
        area.removeItem(BRICK_LOCALE_KEY);
        return area.getItem(BRICK_LOCALE_KEY) === null;
    } catch { return false; }
}

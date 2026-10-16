import { qrBeadPaths } from './routes';
import type { QrPalette, QrState } from './types';

export const QR_LOCALE_KEY = 'qr-beads-locale-transfer-v1';
const MAX_AGE = 5 * 60 * 1000;
const MAX_TRANSFER_CHARS = 65536;
type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type QrLocaleSnapshot = { state: QrState; saved: boolean };
export type QrLocaleRead = { snapshot: QrLocaleSnapshot; raw: string };
const paths: string[] = Object.values(qrBeadPaths);
const path = (href: string) => new URL(href, 'https://fusebeadpatterns.art').pathname.replace(/\/$/, '');

export function isQrLocaleNavigation(from: string, to: string): boolean {
    try {
        const source = new URL(from), target = new URL(to, source);
        return source.origin === target.origin && paths.includes(path(source.href)) && paths.includes(path(target.href));
    } catch { return false; }
}

function ownRecord(value: unknown, keys: string[]): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_TRANSFER');
    const proto = Object.getPrototypeOf(value);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if ((proto !== Object.prototype && proto !== null) || Reflect.ownKeys(value).length !== keys.length
        || keys.some(key => !descriptors[key]?.enumerable || !Object.hasOwn(descriptors[key], 'value'))) throw new Error('INVALID_TRANSFER');
    return Object.fromEntries(keys.map(key => [key, descriptors[key].value]));
}

// Invalid/unfinished text and a temporarily invalid color pair stay editable.
// Only the bounded settings structure is required for a language transfer.
function checkedSnapshot(value: unknown, palettes: QrPalette[]): QrLocaleSnapshot {
    const snapshot = ownRecord(value, ['state', 'saved']);
    const s = ownRecord(snapshot.state, ['text', 'errorCorrection', 'beadsPerModule', 'paletteId', 'foregroundRef', 'backgroundRef', 'paper']);
    if (typeof snapshot.saved !== 'boolean' || typeof s.text !== 'string' || s.text.length > 8192
        || !['L', 'M', 'Q', 'H'].includes(s.errorCorrection as string)
        || ![1, 2, 3].includes(s.beadsPerModule as number) || !['a4', 'letter'].includes(s.paper as string)) throw new Error('INVALID_TRANSFER');
    const palette = palettes.find(p => p.id === s.paletteId);
    if (!palette || !palette.colors.some(c => c.ref === s.foregroundRef) || !palette.colors.some(c => c.ref === s.backgroundRef)) throw new Error('INVALID_TRANSFER');
    return { state: s as QrState, saved: snapshot.saved };
}

export function saveQrLocaleSnapshot(snapshot: QrLocaleSnapshot, href: string, storage: StorageArea, palettes: QrPalette[], now = Date.now()): boolean {
    let previous: string | null = null;
    let attempted = false;
    try {
        if (!paths.includes(path(href)) || !Number.isFinite(now)) return false;
        const raw = JSON.stringify({ version: 1, destination: path(href), savedAt: now, snapshot: checkedSnapshot(snapshot, palettes) });
        if (raw.length > MAX_TRANSFER_CHARS) return false;
        previous = storage.getItem(QR_LOCALE_KEY);
        attempted = true;
        storage.setItem(QR_LOCALE_KEY, raw);
        if (storage.getItem(QR_LOCALE_KEY) !== raw) throw new Error('TRANSFER_NOT_SAVED');
        return true;
    } catch {
        if (attempted) try {
            if (previous === null) storage.removeItem(QR_LOCALE_KEY);
            else storage.setItem(QR_LOCALE_KEY, previous);
        } catch { /* The source form remains open and unchanged. */ }
        return false;
    }
}

export function readQrLocaleSnapshot(href: string, storage: StorageArea, palettes: QrPalette[], now = Date.now()): QrLocaleRead | null {
    const raw = storage.getItem(QR_LOCALE_KEY);
    if (raw === null) return null;
    if (!paths.includes(path(href)) || raw.length > MAX_TRANSFER_CHARS) throw new Error('INVALID_TRANSFER');
    const value = ownRecord(JSON.parse(raw), ['version', 'destination', 'savedAt', 'snapshot']);
    if (value.version !== 1 || !paths.includes(value.destination as string) || typeof value.savedAt !== 'number'
        || !Number.isFinite(value.savedAt) || !Number.isFinite(now) || value.savedAt > now || now - value.savedAt > MAX_AGE) throw new Error('INVALID_TRANSFER');
    if (value.destination !== path(href)) throw new Error('TRANSFER_DESTINATION_MISMATCH');
    return { snapshot: checkedSnapshot(value.snapshot, palettes), raw };
}

export function acknowledgeQrLocaleSnapshot(read: QrLocaleRead, storage: StorageArea): boolean {
    try {
        if (storage.getItem(QR_LOCALE_KEY) !== read.raw) return false;
        storage.removeItem(QR_LOCALE_KEY);
        return storage.getItem(QR_LOCALE_KEY) === null;
    } catch { return false; }
}

export function discardQrLocaleSnapshot(storage: StorageArea): boolean {
    try {
        storage.removeItem(QR_LOCALE_KEY);
        return storage.getItem(QR_LOCALE_KEY) === null;
    } catch { return false; }
}

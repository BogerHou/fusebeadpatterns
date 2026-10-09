import { LIMITS, validateChart, type LoomChart } from './core';
import type { RgbaSource } from '../pixel-grid/core';
import { createPixelLocaleStore, type PixelLocaleStore } from '../pixel-grid/locale-storage';

export const LOOM_LOCALE_STORAGE_KEY = 'bead-loom-locale-transfer-v1';
export const LOOM_LOCALE_PATHS = ['/bead-loom-pattern-maker', '/de/perlenwebmuster-generator', '/fr/generateur-motif-metier-a-perles', '/ja/bead-loom-pattern-maker'];
const MAX_AGE = 5 * 60 * 1000;
// 42 full 20,000-bead charts with 40-character IDs, plus the maximum RGBA source.
const MAX_CHARACTERS = 64 * 1024 * 1024;
type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type LoomTool = 'paint' | 'background' | 'pan';
export type LoomZoom = 'fit' | '10' | '18' | '28' | '40';
export type LoomLocaleSnapshot = {
    chart: LoomChart;
    saved: LoomChart;
    history: { past: LoomChart[]; future: LoomChart[] };
    columns: string;
    rows: string;
    aspect: string;
    corner: LoomChart['startCorner'];
    serpentine: boolean;
    selected: string;
    replaceTarget: string;
    tool: LoomTool;
    zoom: LoomZoom;
    cursor: [number, number];
    source: RgbaSource | null;
    sourceName: string;
    mode: 'fit' | 'crop' | 'stretch';
    paper: 'a4' | 'letter';
};
function normalized(path: string) { return path.replace(/\/+$/, ''); }
export function isLoomLocaleNavigation(from: string, to: string): boolean {
    try {
        const current = new URL(from), target = new URL(to, current);
        return current.origin === target.origin && LOOM_LOCALE_PATHS.includes(normalized(current.pathname)) && LOOM_LOCALE_PATHS.includes(normalized(target.pathname));
    } catch { return false; }
}
function destination(href: string): string {
    const url = new URL(href, 'https://fusebeadpatterns.art');
    if (!LOOM_LOCALE_PATHS.includes(normalized(url.pathname))) throw new Error('Not a bead loom workspace');
    return `${normalized(url.pathname)}${url.search}`;
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function integer(value: unknown, min: number, max: number): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max; }
function encodeSource(source: RgbaSource | null) {
    if (!source) return null;
    let binary = '';
    for (let i = 0; i < source.pixels.length; i += 8192) binary += String.fromCharCode(...source.pixels.slice(i, i + 8192));
    return { width: source.width, height: source.height, pixels: btoa(binary) };
}
function decodeSource(value: unknown): RgbaSource | null {
    if (value === null) return null;
    if (!record(value) || !integer(value.width, 1, LIMITS.maxImageSide) || !integer(value.height, 1, LIMITS.maxImageSide) || value.width * value.height > LIMITS.maxImagePixels || typeof value.pixels !== 'string') throw new Error('Invalid loom source');
    const length = value.width * value.height * 4;
    if (value.pixels.length !== Math.ceil(length / 3) * 4) throw new Error('Invalid loom source length');
    const binary = atob(value.pixels);
    if (binary.length !== length) throw new Error('Invalid loom RGBA');
    const pixels = new Uint8ClampedArray(length);
    for (let i = 0; i < length; i++) pixels[i] = binary.charCodeAt(i);
    return { width: value.width, height: value.height, pixels };
}
function decodeSnapshot(value: unknown): LoomLocaleSnapshot {
    if (!record(value) || !record(value.history) || !Array.isArray(value.history.past) || !Array.isArray(value.history.future) || value.history.past.length + value.history.future.length > 40) throw new Error('Invalid loom history');
    const chart = validateChart(value.chart), saved = validateChart(value.saved);
    if (![value.columns, value.rows, value.aspect].every(item => typeof item === 'string' && item.length <= 64) ||
        !['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(value.corner as string) || typeof value.serpentine !== 'boolean' ||
        !['paint', 'background', 'pan'].includes(value.tool as string) || !['fit', '10', '18', '28', '40'].includes(value.zoom as string) ||
        !['fit', 'crop', 'stretch'].includes(value.mode as string) || !['a4', 'letter'].includes(value.paper as string) ||
        typeof value.sourceName !== 'string' || value.sourceName.length > 4096 ||
        !chart.palette.some(color => color.id === value.selected) || !chart.palette.some(color => color.id === value.replaceTarget) ||
        !Array.isArray(value.cursor) || value.cursor.length !== 2 || !integer(value.cursor[0], 0, chart.columns - 1) || !integer(value.cursor[1], 0, chart.rows - 1)) throw new Error('Invalid loom settings');
    return {
        ...(value as unknown as LoomLocaleSnapshot), chart, saved,
        history: { past: value.history.past.map(validateChart), future: value.history.future.map(validateChart) },
        source: decodeSource(value.source), cursor: [value.cursor[0], value.cursor[1]],
    };
}
function serialize(snapshot: LoomLocaleSnapshot, href: string, now: number): string {
    const encoded = { ...snapshot, source: encodeSource(snapshot.source) };
    decodeSnapshot(encoded);
    const raw = JSON.stringify({ version: 1, destination: destination(href), savedAt: now, snapshot: encoded });
    if (raw.length > MAX_CHARACTERS) throw new Error('Loom transfer exceeds supported size');
    return raw;
}
/** Save complete small workspaces in this tab. A failure never changes the chart. */
export function saveLoomLocaleSnapshot(snapshot: LoomLocaleSnapshot, href: string, storage: StorageArea, now = Date.now()): boolean {
    try {
        storage.removeItem(LOOM_LOCALE_STORAGE_KEY);
        const raw = serialize(snapshot, href, now);
        storage.setItem(LOOM_LOCALE_STORAGE_KEY, raw);
        if (storage.getItem(LOOM_LOCALE_STORAGE_KEY) !== raw) throw new Error('Loom transfer was not saved');
        return true;
    } catch {
        try { storage.removeItem(LOOM_LOCALE_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
        return false;
    }
}
/** Restore once, only on the exact destination. Reject corrupt or expired data. */
export function consumeLoomLocaleSnapshot(href: string, storage: StorageArea, now = Date.now()): LoomLocaleSnapshot | null {
    // Preserve unread work when storage is temporarily unavailable; the caller
    // locks editing and offers a retry instead of accepting an empty chart.
    const raw = storage.getItem(LOOM_LOCALE_STORAGE_KEY);
    if (!raw) return null;
    try {
        if (raw.length > MAX_CHARACTERS) { storage.removeItem(LOOM_LOCALE_STORAGE_KEY); return null; }
        const value: unknown = JSON.parse(raw);
        if (record(value) && value.version === 2) return null;
        if (!record(value) || value.version !== 1 || !integer(value.savedAt, now - MAX_AGE, now)) { storage.removeItem(LOOM_LOCALE_STORAGE_KEY); return null; }
        if (value.destination !== destination(href)) return null;
        const snapshot = decodeSnapshot(value.snapshot);
        try { storage.removeItem(LOOM_LOCALE_STORAGE_KEY); } catch { /* The complete chart is already restored in memory. */ }
        return snapshot;
    } catch {
        try { storage.removeItem(LOOM_LOCALE_STORAGE_KEY); } catch { /* Unavailable storage. */ }
        return null;
    }
}
type Pointer = { version: 2; key: string; destination: string; savedAt: number };
function pointer(storage: StorageArea): Pointer | null {
    const raw = storage.getItem(LOOM_LOCALE_STORAGE_KEY);
    if (!raw || raw.length > 2048) return null;
    try {
        const value: unknown = JSON.parse(raw);
        return record(value) && value.version === 2 && typeof value.key === 'string' && /^[\da-f-]{36}$/i.test(value.key) && typeof value.destination === 'string' && typeof value.savedAt === 'number' ? value as Pointer : null;
    } catch { return null; }
}
export function hasLargeLoomLocaleSnapshot(storage: StorageArea): boolean { return pointer(storage) !== null; }
/** Full source and history commit locally before navigation; sessionStorage holds only a tab-specific key. */
export async function saveLargeLoomLocaleSnapshot(snapshot: LoomLocaleSnapshot, href: string, storage: StorageArea, store: PixelLocaleStore = createPixelLocaleStore(), now = Date.now()): Promise<boolean> {
    let key: string | undefined;
    try {
        const previous = pointer(storage);
        storage.removeItem(LOOM_LOCALE_STORAGE_KEY);
        if (previous) await store.remove(previous.key);
        const raw = serialize(snapshot, href, now);
        key = crypto.randomUUID();
        await store.put(key, raw, now + MAX_AGE);
        const value = JSON.stringify({ version: 2, key, destination: destination(href), savedAt: now });
        storage.setItem(LOOM_LOCALE_STORAGE_KEY, value);
        if (storage.getItem(LOOM_LOCALE_STORAGE_KEY) !== value) throw new Error('Loom transfer pointer was not saved');
        return true;
    } catch {
        try { storage.removeItem(LOOM_LOCALE_STORAGE_KEY); } catch { /* Blocked storage. */ }
        if (key) { try { await store.remove(key); } catch { /* Expired local records are pruned on the next transfer. */ } }
        return false;
    }
}
export async function consumeLargeLoomLocaleSnapshot(href: string, storage: StorageArea, store: PixelLocaleStore = createPixelLocaleStore(), now = Date.now()): Promise<LoomLocaleSnapshot | null> {
    const value = pointer(storage);
    if (!value) return null;
    if (!integer(value.savedAt, now - MAX_AGE, now)) { storage.removeItem(LOOM_LOCALE_STORAGE_KEY); await store.remove(value.key); return null; }
    if (value.destination !== destination(href)) return null;
    // A read/transaction error does not prove the committed workspace is gone.
    // Reject without deleting the pointer so the UI can lock editing and retry.
    const raw = await store.take(value.key);
    try { storage.removeItem(LOOM_LOCALE_STORAGE_KEY); } catch { /* The full snapshot is now available in memory. */ }
    if (!raw) return null;
    return consumeLoomLocaleSnapshot(href, { getItem: () => raw, setItem() {}, removeItem() {} }, now);
}

import { LIMITS, type GridHistorySnapshot, type PixelGrid, type PixelPoint, type ResizeMode, type RgbaSource } from './core';
import type { ColorLimit } from './conversion';
import { createPixelLocaleStore, type PixelLocaleStore } from './locale-storage';

export const PIXEL_LOCALE_STORAGE_KEY = 'pixel-grid-locale-transfer-v1';
const MAX_AGE = 5 * 60 * 1000;
const MAX_CHARACTERS = 32 * 1024 * 1024;
const PIXEL_PATHS = ['/pixel-art-grid', '/de/pixel-art-generator', '/fr/image-en-pixel-art', '/ja/pixel-art-converter'];
type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type PixelTool = 'brush' | 'eraser' | 'pan';
export type PixelZoom = 'fit' | '4' | '8' | '16' | '24' | '32';
export type PixelSourceImage = RgbaSource & { name: string };
export type PixelLocaleSnapshot = {
    grid: PixelGrid;
    saved: PixelGrid;
    source: PixelSourceImage | null;
    history: GridHistorySnapshot;
    width: string;
    height: string;
    mode: ResizeMode;
    tool: PixelTool;
    color: string;
    alpha: number;
    zoom: PixelZoom;
    showGrid: boolean;
    colorLimit: ColorLimit;
    exportScale: 1 | 2 | 4 | 8 | 16;
    cursor: PixelPoint;
    settingsExpanded: boolean | null;
};

function normalizedPath(path: string) { return path.replace(/\/+$/, ''); }

/** Only real pixel-tool equivalents bypass the ordinary unsaved-work guard. */
export function isPixelLocaleNavigation(from: string, to: string): boolean {
    try {
        const current = new URL(from), target = new URL(to, current);
        return current.origin === target.origin && PIXEL_PATHS.includes(normalizedPath(current.pathname)) && PIXEL_PATHS.includes(normalizedPath(target.pathname));
    } catch { return false; }
}

function destinationKey(href: string): string {
    const url = new URL(href, 'https://fusebeadpatterns.art');
    if (!PIXEL_PATHS.includes(normalizedPath(url.pathname))) throw new Error('Not a pixel workspace');
    return `${normalizedPath(url.pathname)}${url.search}`;
}

function encode(source: RgbaSource) {
    let binary = '';
    for (let i = 0; i < source.pixels.length; i += 8192) binary += String.fromCharCode(...source.pixels.slice(i, i + 8192));
    return { width: source.width, height: source.height, pixels: btoa(binary) };
}

function record(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function integer(value: unknown, min: number, max: number): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
function decode(value: unknown, source = false): PixelGrid {
    const maxSide = source ? LIMITS.maxImageSide : LIMITS.maxSide;
    if (!record(value) || !integer(value.width, 1, maxSide) || !integer(value.height, 1, maxSide) || typeof value.pixels !== 'string') throw new Error('Invalid pixel snapshot');
    const length = value.width * value.height * 4;
    if (value.pixels.length !== Math.ceil(length / 3) * 4) throw new Error('Invalid pixel length');
    const binary = atob(value.pixels);
    if (binary.length !== length) throw new Error('Invalid pixel data');
    const pixels = new Uint8ClampedArray(length);
    for (let i = 0; i < length; i++) pixels[i] = binary.charCodeAt(i);
    return { width: value.width, height: value.height, pixels };
}

function decodeSnapshot(value: unknown): PixelLocaleSnapshot {
    if (!record(value) || !record(value.history) || !Array.isArray(value.history.undo) || !Array.isArray(value.history.redo) || value.history.undo.length + value.history.redo.length > 50) throw new Error('Invalid pixel history');
    if (typeof value.width !== 'string' || value.width.length > 64 || typeof value.height !== 'string' || value.height.length > 64 ||
        !['fit', 'crop', 'stretch'].includes(value.mode as string) || !['brush', 'eraser', 'pan'].includes(value.tool as string) ||
        typeof value.color !== 'string' || !/^#[\da-f]{6}$/i.test(value.color) || !integer(value.alpha, 0, 255) ||
        !['fit', '4', '8', '16', '24', '32'].includes(value.zoom as string) || typeof value.showGrid !== 'boolean' ||
        !['original', 8, 16, 32, 64].includes(value.colorLimit as string | number) || ![1, 2, 4, 8, 16].includes(value.exportScale as number) ||
        !(value.settingsExpanded === null || typeof value.settingsExpanded === 'boolean')) throw new Error('Invalid pixel settings');
    const grid = decode(value.grid), saved = decode(value.saved);
    if (!Array.isArray(value.cursor) || value.cursor.length !== 2 || !integer(value.cursor[0], 0, grid.width - 1) || !integer(value.cursor[1], 0, grid.height - 1)) throw new Error('Invalid cursor');
    let source: PixelSourceImage | null = null;
    if (value.source !== null) {
        if (!record(value.source) || typeof value.source.name !== 'string' || value.source.name.length > 4096) throw new Error('Invalid source image');
        source = { ...decode(value.source, true), name: value.source.name };
    }
    return {
        ...(value as unknown as PixelLocaleSnapshot), grid, saved, source,
        history: { undo: value.history.undo.map(item => decode(item)), redo: value.history.redo.map(item => decode(item)) },
        cursor: [value.cursor[0], value.cursor[1]],
    };
}

function serializeSnapshot(snapshot: PixelLocaleSnapshot, destination: string, now: number): string {
    const encoded = {
        ...snapshot,
        grid: encode(snapshot.grid), saved: encode(snapshot.saved),
        source: snapshot.source ? { ...encode(snapshot.source), name: snapshot.source.name } : null,
        history: { undo: snapshot.history.undo.map(encode), redo: snapshot.history.redo.map(encode) },
    };
    const raw = JSON.stringify({ version: 1, destination, savedAt: now, snapshot: encoded });
    if (raw.length > MAX_CHARACTERS) throw new Error('Pixel transfer exceeds supported size');
    decodeSnapshot(encoded);
    return raw;
}

/** Small workspaces stay tab-local; failure leaves the in-memory work intact. */
export function savePixelLocaleSnapshot(snapshot: PixelLocaleSnapshot | null, href: string, storage: StorageArea, now = Date.now()): boolean {
    try {
        // A failed attempt must not leave an older matching transfer behind.
        storage.removeItem(PIXEL_LOCALE_STORAGE_KEY);
        const destination = destinationKey(href);
        if (!snapshot) return true;
        const raw = serializeSnapshot(snapshot, destination, now);
        storage.setItem(PIXEL_LOCALE_STORAGE_KEY, raw);
        return true;
    } catch {
        try { storage.removeItem(PIXEL_LOCALE_STORAGE_KEY); } catch { /* Storage may be disabled entirely. */ }
        return false;
    }
}

/** A matching transfer is consumed once. Bad/expired values never become a drawing. */
export function consumePixelLocaleSnapshot(href: string, storage: StorageArea, now = Date.now()): PixelLocaleSnapshot | null {
    // A read failure is not an absent transfer. Let the workspace protect its
    // canvas and retry without deleting either a small snapshot or large pointer.
    const raw = storage.getItem(PIXEL_LOCALE_STORAGE_KEY);
    if (!raw) return null;
    try {
        if (raw.length > MAX_CHARACTERS) { storage.removeItem(PIXEL_LOCALE_STORAGE_KEY); return null; }
        const transfer: unknown = JSON.parse(raw);
        if (record(transfer) && transfer.version === 2) return null;
        if (!record(transfer) || transfer.version !== 1 || !integer(transfer.savedAt, now - MAX_AGE, now)) {
            storage.removeItem(PIXEL_LOCALE_STORAGE_KEY); return null;
        }
        if (transfer.destination !== destinationKey(href)) return null;
        const snapshot = decodeSnapshot(transfer.snapshot);
        // Once the complete drawing is available in memory, failed cleanup
        // must not turn successful recovery into an empty canvas.
        try { storage.removeItem(PIXEL_LOCALE_STORAGE_KEY); } catch { /* Retry cleanup on the next transfer. */ }
        return snapshot;
    } catch {
        try { storage.removeItem(PIXEL_LOCALE_STORAGE_KEY); } catch { /* Ignore unavailable storage on initial load. */ }
        return null;
    }
}

type LargeTransferPointer = { version: 2; key: string; destination: string; savedAt: number };
function largePointer(storage: StorageArea): LargeTransferPointer | null {
    // Storage access failures must remain distinguishable from an absent or
    // malformed record while a protected recovery is being retried.
    const raw = storage.getItem(PIXEL_LOCALE_STORAGE_KEY);
    if (!raw || raw.length > 2048) return null;
    try {
        const value: unknown = JSON.parse(raw);
        return record(value) && value.version === 2 && typeof value.key === 'string' && /^[\da-f-]{36}$/i.test(value.key) && typeof value.destination === 'string' && typeof value.savedAt === 'number'
            ? value as LargeTransferPointer : null;
    } catch { return null; }
}

export function hasLargePixelLocaleSnapshot(storage: StorageArea): boolean {
    return largePointer(storage) !== null;
}

/** Commit full source/history first; keep only a small per-tab pointer in sessionStorage. */
export async function saveLargePixelLocaleSnapshot(snapshot: PixelLocaleSnapshot, href: string, storage: StorageArea, store: PixelLocaleStore = createPixelLocaleStore(), now = Date.now()): Promise<boolean> {
    let key: string | undefined;
    try {
        const previous = largePointer(storage);
        storage.removeItem(PIXEL_LOCALE_STORAGE_KEY);
        if (previous) await store.remove(previous.key);
        const destination = destinationKey(href);
        const raw = serializeSnapshot(snapshot, destination, now);
        key = crypto.randomUUID();
        await store.put(key, raw, now + MAX_AGE);
        const pointer = JSON.stringify({ version: 2, key, destination, savedAt: now });
        storage.setItem(PIXEL_LOCALE_STORAGE_KEY, pointer);
        if (storage.getItem(PIXEL_LOCALE_STORAGE_KEY) !== pointer) throw new Error('Pixel transfer pointer was not saved');
        return true;
    } catch {
        try { storage.removeItem(PIXEL_LOCALE_STORAGE_KEY); } catch { /* Blocked storage. */ }
        if (key) { try { await store.remove(key); } catch { /* Expired records are also pruned on the next transfer. */ } }
        return false;
    }
}

export async function consumeLargePixelLocaleSnapshot(href: string, storage: StorageArea, store: PixelLocaleStore = createPixelLocaleStore(), now = Date.now()): Promise<PixelLocaleSnapshot | null> {
    const pointer = largePointer(storage);
    if (!pointer) return null;
    try {
        if (!integer(pointer.savedAt, now - MAX_AGE, now)) {
            storage.removeItem(PIXEL_LOCALE_STORAGE_KEY); await store.remove(pointer.key); return null;
        }
        if (pointer.destination !== destinationKey(href)) return null;
    } catch {
        return null;
    }
    // A transient read/transaction failure does not prove that the saved work is
    // gone. Reject without removing the pointer so callers can protect and retry
    // even when sessionStorage itself becomes temporarily inaccessible.
    const raw = await store.take(pointer.key);
    try { storage.removeItem(PIXEL_LOCALE_STORAGE_KEY); } catch { /* The full snapshot is already available in memory. */ }
    if (!raw) return null;
    return consumePixelLocaleSnapshot(href, { getItem: () => raw, setItem() {}, removeItem() {} }, now);
}

/** Settings-only navigation is still useful; untouched blank workspaces need no transfer. */
export function hasPixelLocaleWork(snapshot: PixelLocaleSnapshot, initialSide: number, converter: boolean): boolean {
    return snapshot.source !== null || snapshot.history.undo.length + snapshot.history.redo.length > 0 ||
        snapshot.grid.width !== initialSide || snapshot.grid.height !== initialSide || snapshot.grid.pixels.some(value => value !== 0) ||
        snapshot.width !== String(initialSide) || snapshot.height !== String(initialSide) || snapshot.mode !== 'fit' ||
        snapshot.tool !== 'brush' || snapshot.color !== '#f06a45' || snapshot.alpha !== 255 || snapshot.zoom !== 'fit' ||
        snapshot.showGrid !== !converter || snapshot.colorLimit !== 'original' || snapshot.exportScale !== 8 || snapshot.settingsExpanded !== null;
}

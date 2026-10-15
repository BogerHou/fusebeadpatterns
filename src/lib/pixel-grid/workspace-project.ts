import { LIMITS, type RgbaPixels } from './core';
import { PixelGridError } from './errors';
import { parsePixelWorkspaceSnapshot, serializePixelWorkspaceSnapshot, type PixelLocaleSnapshot } from './locale-navigation';
import type { PixelGridPrintPreferences } from './print-preferences';

export const PIXEL_WORKSPACE_PROJECT_FORMAT = 'pixel-grid-workspace';
export const PIXEL_WORKSPACE_PROJECT_VERSION = 1;
export const MAX_PIXEL_WORKSPACE_PROJECT_BYTES = 32 * 1024 * 1024;

export type PixelWorkspaceProject = {
    format: typeof PIXEL_WORKSPACE_PROJECT_FORMAT;
    version: typeof PIXEL_WORKSPACE_PROJECT_VERSION;
    snapshot: PixelLocaleSnapshot;
    print: PixelGridPrintPreferences;
};

const SNAPSHOT_KEYS = ['grid', 'saved', 'source', 'history', 'width', 'height', 'mode', 'tool', 'color', 'alpha', 'zoom', 'showGrid', 'colorLimit', 'exportScale', 'cursor', 'settingsExpanded'];
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const invalid = (): never => { throw new PixelGridError('WORKSPACE_INVALID'); };

/** Inspect data properties only; do not execute getters or inherited methods. */
function fields(value: unknown, keys: readonly string[]): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return invalid();
    const own = Reflect.ownKeys(value);
    if (own.length !== keys.length || own.some(key => typeof key !== 'string' || !keys.includes(key))) return invalid();
    const result: Record<string, unknown> = {};
    for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) return invalid();
        result[key] = descriptor.value;
    }
    return result;
}

function array(value: unknown, max: number): unknown[] {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > max) return invalid();
    const keys = Reflect.ownKeys(value);
    if (keys.length !== value.length + 1) return invalid();
    const result: unknown[] = [];
    for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) return invalid();
        result.push(descriptor.value);
    }
    return result;
}

function integer(value: unknown, min: number, max: number): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function pixelBytes(value: unknown, length: number): Uint8ClampedArray<ArrayBuffer> {
    if (value instanceof Uint8Array || value instanceof Uint8ClampedArray) {
        const lengthGetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), 'length')!.get!;
        if (lengthGetter.call(value) !== length) return invalid();
        return new Uint8ClampedArray(value);
    }
    // Plain arrays are valid RGBA inputs too. Copy own numeric data only, so
    // custom properties or an overridden iterator cannot enter the file.
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length !== length) return invalid();
    const result = new Uint8ClampedArray(length);
    for (let index = 0; index < length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !Object.hasOwn(descriptor, 'value') || !integer(descriptor.value, 0, 255)) return invalid();
        result[index] = descriptor.value;
    }
    return result;
}

function rgba(value: unknown, wire: boolean, source = false) {
    const row = fields(value, source ? ['width', 'height', 'pixels', 'name'] : ['width', 'height', 'pixels']);
    const max = source ? LIMITS.maxImageSide : LIMITS.maxSide;
    if (!integer(row.width, 1, max) || !integer(row.height, 1, max)) return invalid();
    const length = row.width * row.height * 4;
    let pixels: string | RgbaPixels;
    if (wire) {
        if (typeof row.pixels !== 'string' || row.pixels.length !== Math.ceil(length / 3) * 4
            || /[^A-Za-z0-9+/=]/.test(row.pixels)) return invalid();
        const padding = (3 - length % 3) % 3;
        const dataEnd = row.pixels.length - padding;
        if (row.pixels.indexOf('=') !== (padding ? dataEnd : -1)
            || (padding && row.pixels.slice(dataEnd) !== '='.repeat(padding))
            || (padding && (BASE64.indexOf(row.pixels[dataEnd - 1]) & (padding === 2 ? 15 : 3)) !== 0)) return invalid();
        pixels = row.pixels;
    } else pixels = pixelBytes(row.pixels, length);
    if (source && (typeof row.name !== 'string' || row.name.length > 4096)) return invalid();
    return { width: row.width, height: row.height, pixels, ...(source ? { name: row.name as string } : {}) };
}

/** Structural validation precedes the existing codec's semantic validation. */
function snapshotData(value: unknown, wire: boolean) {
    const row = fields(value, SNAPSHOT_KEYS);
    const history = fields(row.history, ['undo', 'redo']);
    const undo = array(history.undo, 50), redo = array(history.redo, 50);
    if (undo.length + redo.length > 50) return invalid();
    for (const key of ['width', 'height', 'mode', 'tool', 'color', 'zoom']) {
        if (typeof row[key] !== 'string' || row[key].length > 64) return invalid();
    }
    for (const key of ['alpha', 'exportScale']) if (typeof row[key] !== 'number' || !Number.isFinite(row[key])) return invalid();
    if ((typeof row.colorLimit !== 'string' && typeof row.colorLimit !== 'number') || (typeof row.colorLimit === 'string' && row.colorLimit.length > 64) || typeof row.showGrid !== 'boolean'
        || (row.settingsExpanded !== null && typeof row.settingsExpanded !== 'boolean')) return invalid();
    const cursor = array(row.cursor, 2);
    if (cursor.length !== 2 || cursor.some(value => typeof value !== 'number' || !Number.isFinite(value))) return invalid();
    return {
        ...row,
        grid: rgba(row.grid, wire), saved: rgba(row.saved, wire), source: row.source === null ? null : rgba(row.source, wire, true),
        history: { undo: undo.map(value => rgba(value, wire)), redo: redo.map(value => rgba(value, wire)) }, cursor,
    };
}

function printData(value: unknown): PixelGridPrintPreferences {
    const row = fields(value, ['paper', 'mode', 'content']);
    if ((row.paper !== 'a4' && row.paper !== 'letter') || (row.mode !== 'overview' && row.mode !== 'tiled')
        || (row.content !== 'artwork' && row.content !== 'blank')) return invalid();
    return { paper: row.paper, mode: row.mode, content: row.content };
}

function checkBudget(raw: string): void {
    if (raw.length > MAX_PIXEL_WORKSPACE_PROJECT_BYTES || new TextEncoder().encode(raw).length > MAX_PIXEL_WORKSPACE_PROJECT_BYTES) {
        throw new PixelGridError('WORKSPACE_TOO_LARGE');
    }
}

function stableError(error: unknown): never {
    if (error instanceof PixelGridError && ['WORKSPACE_INVALID', 'WORKSPACE_TOO_LARGE', 'WORKSPACE_UNSUPPORTED_FORMAT'].includes(error.code)) throw error;
    return invalid();
}

/** A separate user-downloaded format; no storage, migration or network effects. */
export function serializePixelWorkspaceProject(snapshot: PixelLocaleSnapshot, print: PixelGridPrintPreferences): string {
    try {
        const data = snapshotData(snapshot, false);
        const preferences = printData(print);
        const encoded = serializePixelWorkspaceSnapshot(data as unknown as PixelLocaleSnapshot);
        const raw = `{"format":"${PIXEL_WORKSPACE_PROJECT_FORMAT}","version":${PIXEL_WORKSPACE_PROJECT_VERSION},"snapshot":${encoded},"print":${JSON.stringify(preferences)}}`;
        checkBudget(raw);
        return raw;
    } catch (error) { return stableError(error); }
}

/** Decode into fresh owned pixels/history; the caller publishes only on success. */
export function parsePixelWorkspaceProject(raw: string): PixelWorkspaceProject {
    try {
        if (typeof raw !== 'string') return invalid();
        checkBudget(raw);
        const value: unknown = JSON.parse(raw);
        if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
        const header = value as Record<string, unknown>;
        if (header.format !== PIXEL_WORKSPACE_PROJECT_FORMAT || header.version !== PIXEL_WORKSPACE_PROJECT_VERSION) throw new PixelGridError('WORKSPACE_UNSUPPORTED_FORMAT');
        const row = fields(value, ['format', 'version', 'snapshot', 'print']);
        const data = snapshotData(row.snapshot, true);
        const print = printData(row.print);
        const snapshot = parsePixelWorkspaceSnapshot(JSON.stringify(data));
        return { format: PIXEL_WORKSPACE_PROJECT_FORMAT, version: PIXEL_WORKSPACE_PROJECT_VERSION, snapshot, print };
    } catch (error) { return stableError(error); }
}

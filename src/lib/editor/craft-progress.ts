import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { BOARDS } from '../core/model/board/board.model';
import { EDITOR_DRAFT_BOARD_COUNT_MAX, EDITOR_PROJECT_PATTERN_DIMENSION_MAX } from './editor-limits';

export const CRAFT_PROGRESS_MAX_POSITIONS = EDITOR_PROJECT_PATTERN_DIMENSION_MAX ** 2;
export const CRAFT_PROGRESS_MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ENTRIES = 4096;
const FILE_TYPE = 'fuse-bead-craft-progress';
const BOARD_SIZES = new Set(Object.values(BOARDS).map(board => board.nbBeadPerRow));

export type CraftPattern = {
    width: number;
    height: number;
    boardSize: number;
    pixels: Uint8ClampedArray;
    palettes: Palette[];
    paletteIds: string[];
};
export type CraftBounds = { x: number; y: number; width: number; height: number };
export type CraftBoard = { row: number; column: number };
type Counts = { total: number; completed: number; remaining: number };
export type CraftColorSummary = Counts & {
    key: string;
    /** Null means no unique exact material identity; the UI supplies its own label. */
    name: string | null;
    ref: string | null;
    prefix: string | null;
    r: number;
    g: number;
    b: number;
};
export type CraftSummary = Counts & {
    colors: CraftColorSummary[];
    boards: Array<CraftBoard & Counts>;
    bounds: CraftBounds;
};
export type CraftScope = { board?: CraftBoard | null; colorKey?: string | null; includeColors?: boolean };
export type CraftProgressErrorCode = 'INVALID_PATTERN' | 'INVALID_MARKS' | 'INVALID_INDEX' | 'INVALID_SCOPE' | 'INVALID_ID' | 'INVALID_FILE' | 'PATTERN_MISMATCH' | 'CRYPTO_UNAVAILABLE';
export class CraftProgressError extends Error {
    constructor(public readonly code: CraftProgressErrorCode) {
        super(code);
        this.name = 'CraftProgressError';
    }
}
function fail(code: CraftProgressErrorCode): never { throw new CraftProgressError(code); }
function byte(value: unknown): value is number { return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 255; }
function text(value: unknown, limit: number, allowEmpty = false): value is string {
    return typeof value === 'string' && value.length <= limit && (allowEmpty || value.length > 0);
}

/** Resource validation is separate from allowing arbitrary rectangular whole-board layouts. */
export function validateCraftPattern(pattern: CraftPattern): void {
    if (!pattern || typeof pattern !== 'object' || !Number.isSafeInteger(pattern.width) || !Number.isSafeInteger(pattern.height) ||
        pattern.width < 1 || pattern.height < 1 || !BOARD_SIZES.has(pattern.boardSize) ||
        pattern.width % pattern.boardSize !== 0 || pattern.height % pattern.boardSize !== 0 ||
        pattern.width / pattern.boardSize > EDITOR_DRAFT_BOARD_COUNT_MAX || pattern.height / pattern.boardSize > EDITOR_DRAFT_BOARD_COUNT_MAX ||
        pattern.width * pattern.height > CRAFT_PROGRESS_MAX_POSITIONS ||
        !(pattern.pixels instanceof Uint8ClampedArray) || pattern.pixels.length !== pattern.width * pattern.height * 4 ||
        !Array.isArray(pattern.paletteIds) || pattern.paletteIds.length > 64 ||
        !Array.isArray(pattern.palettes) || pattern.palettes.length > 64) fail('INVALID_PATTERN');
    const ids = new Set<string>();
    for (const id of pattern.paletteIds) {
        if (!text(id, 128) || ids.has(id)) fail('INVALID_PATTERN');
        ids.add(id);
    }
    let entryCount = 0;
    for (const palette of pattern.palettes) {
        if (!palette || !text(palette.name, 512) || !Array.isArray(palette.entries)) fail('INVALID_PATTERN');
        entryCount += palette.entries.length;
        if (entryCount > MAX_ENTRIES) fail('INVALID_PATTERN');
        for (const entry of palette.entries) {
            if (!entry || !text(entry.ref, 128) || !text(entry.prefix, 128, true) ||
                !text(entry.name, 512) || !text(entry.symbol, 128, true) || typeof entry.enabled !== 'boolean' ||
                !entry.color || ![entry.color.r, entry.color.g, entry.color.b, entry.color.a].every(byte)) fail('INVALID_PATTERN');
        }
    }
}

/** Detaches all mutable data before async identity or UI work. No input is frozen or changed. */
export function snapshotCraftPattern(pattern: CraftPattern): CraftPattern {
    validateCraftPattern(pattern);
    return {
        width: pattern.width, height: pattern.height, boardSize: pattern.boardSize,
        pixels: new Uint8ClampedArray(pattern.pixels), paletteIds: [...pattern.paletteIds],
        palettes: pattern.palettes.map(palette => new Palette(palette.name, palette.entries.map(entry => {
            const color = entry.color;
            const copy = new PaletteEntry(entry.name, new Color(color.r, color.g, color.b, color.a));
            copy.ref = entry.ref; copy.prefix = entry.prefix; copy.symbol = entry.symbol; copy.enabled = entry.enabled;
            return copy;
        }))),
    };
}

export function getCraftColorKey(r: number, g: number, b: number): string {
    if (![r, g, b].every(byte)) fail('INVALID_SCOPE');
    return `${r},${g},${b}`;
}

function validateMarks(pattern: CraftPattern, marks: Uint8Array): void {
    if (!(marks instanceof Uint8Array) || marks.length !== pattern.width * pattern.height) fail('INVALID_MARKS');
    for (let i = 0; i < marks.length; i++) {
        if (marks[i] > 1 || (marks[i] === 1 && pattern.pixels[i * 4 + 3] === 0)) fail('INVALID_MARKS');
    }
}

export function createCraftMarks(pattern: CraftPattern): Uint8Array {
    validateCraftPattern(pattern);
    return new Uint8Array(pattern.width * pattern.height);
}

/** Indices are global row-major cell positions. Duplicates count toward the finite edit budget. */
export function setCraftCells(pattern: CraftPattern, marks: Uint8Array, indices: Iterable<number>, value: boolean): Uint8Array {
    validateCraftPattern(pattern); validateMarks(pattern, marks);
    if (typeof value !== 'boolean' || !indices || typeof indices[Symbol.iterator] !== 'function') fail('INVALID_INDEX');
    const next = new Uint8Array(marks);
    let visited = 0;
    for (const index of indices) {
        if (++visited > CRAFT_PROGRESS_MAX_POSITIONS || !Number.isSafeInteger(index) || index < 0 || index >= next.length) fail('INVALID_INDEX');
        if (pattern.pixels[index * 4 + 3] !== 0) next[index] = value ? 1 : 0;
    }
    return next;
}

type Material = { name: string; ref: string; prefix: string };
function materialMap(pattern: CraftPattern): Map<string, Material | null> {
    const map = new Map<string, Material | null>();
    for (const palette of pattern.palettes) for (const entry of palette.entries) {
        const { r, g, b, a } = entry.color;
        if (a === 0) continue;
        const key = `${r},${g},${b},${a}`;
        const previous = map.get(key);
        if (!map.has(key)) map.set(key, { name: entry.name, ref: entry.ref, prefix: entry.prefix });
        else if (previous && (previous.ref !== entry.ref || previous.prefix !== entry.prefix)) map.set(key, null);
    }
    return map;
}

export function getCraftSummary(pattern: CraftPattern, marks: Uint8Array, scope: CraftScope = {}): CraftSummary {
    validateCraftPattern(pattern); validateMarks(pattern, marks);
    if (!scope || typeof scope !== 'object' || (scope.includeColors !== undefined && typeof scope.includeColors !== 'boolean')) fail('INVALID_SCOPE');
    const includeColors = scope.includeColors !== false;
    const boardColumns = pattern.width / pattern.boardSize, boardRows = pattern.height / pattern.boardSize;
    const board = scope.board;
    if (board !== undefined && board !== null && (!board || !Number.isSafeInteger(board.row) || !Number.isSafeInteger(board.column) ||
        board.row < 0 || board.row >= boardRows || board.column < 0 || board.column >= boardColumns)) fail('INVALID_SCOPE');
    const filter = scope.colorKey;
    if (filter !== undefined && filter !== null) {
        if (typeof filter !== 'string' || filter.length > 11) fail('INVALID_SCOPE');
        const channels = filter.split(',').map(Number);
        if (channels.length !== 3 || !channels.every(byte) || channels.join(',') !== filter) fail('INVALID_SCOPE');
    }
    const bounds = board ? { x: board.column * pattern.boardSize, y: board.row * pattern.boardSize, width: pattern.boardSize, height: pattern.boardSize }
        : { x: 0, y: 0, width: pattern.width, height: pattern.height };
    const boards: CraftSummary['boards'] = [];
    const byBoard = new Map<number, CraftSummary['boards'][number]>();
    for (let row = board?.row ?? 0; row < (board ? board.row + 1 : boardRows); row++) {
        for (let column = board?.column ?? 0; column < (board ? board.column + 1 : boardColumns); column++) {
            const item = { row, column, total: 0, completed: 0, remaining: 0 };
            boards.push(item); byBoard.set(row * boardColumns + column, item);
        }
    }
    // The overview needs only totals and <=400 boards. Arbitrary imported RGBA
    // can have over a million colors: do not allocate per-color objects there.
    const materials = includeColors ? materialMap(pattern) : null;
    const colors = includeColors ? new Map<string, CraftColorSummary>() : null;
    let total = 0, completed = 0;
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        const i = y * pattern.width + x, offset = i * 4;
        const r = pattern.pixels[offset], g = pattern.pixels[offset + 1], b = pattern.pixels[offset + 2], a = pattern.pixels[offset + 3];
        if (a === 0) continue;
        const key = includeColors || (filter !== undefined && filter !== null) ? `${r},${g},${b}` : '';
        if (filter !== undefined && filter !== null && filter !== key) continue;
        const done = marks[i];
        total++; completed += done;
        if (colors && materials) {
            const material = materials.get(`${key},${a}`) ?? null;
            let color = colors.get(key);
            if (!color) {
                color = { key, r, g, b, name: material?.name ?? null, ref: material?.ref ?? null, prefix: material?.prefix ?? null, total: 0, completed: 0, remaining: 0 };
                colors.set(key, color);
            } else if (!material || color.ref !== material.ref || color.prefix !== material.prefix) {
                color.name = color.ref = color.prefix = null;
            }
            color.total++; color.completed += done;
        }
        const item = byBoard.get(Math.floor(y / pattern.boardSize) * boardColumns + Math.floor(x / pattern.boardSize))!;
        item.total++; item.completed += done;
    }
    for (const item of boards) item.remaining = item.total - item.completed;
    const sortedColors = colors ? [...colors.values()].sort((a, b) => a.r - b.r || a.g - b.g || a.b - b.b) : [];
    for (const item of sortedColors) item.remaining = item.total - item.completed;
    return { total, completed, remaining: total - completed, colors: sortedColors, boards, bounds };
}

/** SHA-256 identity contract v1. Display names, symbols, ordering and empty-pixel hidden RGB are excluded. */
export async function craftPatternId(pattern: CraftPattern): Promise<string> {
    const snapshot = snapshotCraftPattern(pattern);
    if (!globalThis.crypto?.subtle) fail('CRYPTO_UNAVAILABLE');
    const mappings = new Set<string>();
    for (const palette of snapshot.palettes) for (const entry of palette.entries) {
        const { r, g, b, a } = entry.color;
        if (a !== 0) mappings.add(JSON.stringify([entry.prefix, entry.ref, r, g, b, a]));
    }
    const header = new TextEncoder().encode(JSON.stringify({ type: 'fuse-bead-craft-pattern', version: 1,
        width: snapshot.width, height: snapshot.height, boardSize: snapshot.boardSize,
        paletteIds: snapshot.paletteIds.sort(), mappings: [...mappings].sort() }));
    // A length-prefixed header avoids ambiguous separation from arbitrary RGBA bytes.
    const bytes = new Uint8Array(4 + header.length + snapshot.pixels.length);
    new DataView(bytes.buffer).setUint32(0, header.length, false);
    bytes.set(header, 4);
    bytes.set(snapshot.pixels, 4 + header.length);
    for (let i = 0; i < snapshot.pixels.length; i += 4) {
        if (snapshot.pixels[i + 3] === 0) bytes.fill(0, 4 + header.length + i, 4 + header.length + i + 3);
    }
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function validId(id: string): boolean { return typeof id === 'string' && /^[a-f0-9]{64}$/.test(id); }
function encode(bytes: Uint8Array): string {
    const parts: string[] = [];
    for (let i = 0; i < bytes.length; i += 8192) parts.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
    return btoa(parts.join(''));
}

/** Compute patternId from this same immutable snapshot before calling either file function. */
export function exportCraftProgress(patternId: string, pattern: CraftPattern, marks: Uint8Array): string {
    validateCraftPattern(pattern); validateMarks(pattern, marks);
    if (!validId(patternId)) fail('INVALID_ID');
    const packed = new Uint8Array(Math.ceil(marks.length / 8));
    for (let i = 0; i < marks.length; i++) if (marks[i]) packed[Math.floor(i / 8)] |= 1 << (i % 8);
    return JSON.stringify({ type: FILE_TYPE, version: 1, width: pattern.width, height: pattern.height,
        boardSize: pattern.boardSize, signature: patternId, marks: encode(packed) });
}

/** Import is atomic and non-consuming. JSON duplicate fields follow JSON.parse's last-value rule. */
export function importCraftProgress(raw: string, patternId: string, pattern: CraftPattern): Uint8Array {
    validateCraftPattern(pattern);
    if (!validId(patternId)) fail('INVALID_ID');
    if (typeof raw !== 'string' || raw.length > CRAFT_PROGRESS_MAX_FILE_BYTES || new TextEncoder().encode(raw).length > CRAFT_PROGRESS_MAX_FILE_BYTES) fail('INVALID_FILE');
    let file: Record<string, unknown>;
    try { file = JSON.parse(raw); } catch { fail('INVALID_FILE'); }
    if (!file || typeof file !== 'object' || Array.isArray(file) ||
        Object.keys(file).sort().join(',') !== 'boardSize,height,marks,signature,type,version,width' ||
        file.type !== FILE_TYPE || file.version !== 1 || !validId(file.signature as string)) fail('INVALID_FILE');
    if (file.signature !== patternId || file.width !== pattern.width || file.height !== pattern.height || file.boardSize !== pattern.boardSize) fail('PATTERN_MISMATCH');
    const cells = pattern.width * pattern.height, size = Math.ceil(cells / 8);
    if (typeof file.marks !== 'string' || file.marks.length !== Math.ceil(size / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.marks)) fail('INVALID_FILE');
    let binary: string;
    try { binary = atob(file.marks); } catch { fail('INVALID_FILE'); }
    if (binary.length !== size || btoa(binary) !== file.marks || (cells % 8 !== 0 && (binary.charCodeAt(size - 1) >>> (cells % 8)) !== 0)) fail('INVALID_FILE');
    const marks = new Uint8Array(cells);
    for (let i = 0; i < cells; i++) marks[i] = (binary.charCodeAt(Math.floor(i / 8)) >>> (i % 8)) & 1;
    validateMarks(pattern, marks);
    return marks;
}

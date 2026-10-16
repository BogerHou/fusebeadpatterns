import { createGrid, resizeNearest, type PixelGrid } from '../pixel-grid/core';

export const SPRITE_LIMITS = Object.freeze({
    minSide: 1, maxSide: 64, maxFrames: 32, maxFps: 24,
    maxProjectBytes: 1048576, maxRawBytes: 524288,
    maxHistorySteps: 30, maxHistoryBytes: 16777216,
});
export const SPRITE_PROJECT_FORMAT = 'fusebead-sprite-project';
export const SPRITE_PROJECT_VERSION = 1;

export type SpriteAnimation = {
    width: number;
    height: number;
    fps: number;
    activeFrame: number;
    frames: PixelGrid[];
};
export type SpriteSheetLayout = 'horizontal' | 'vertical' | 'grid';
export type SpriteSheet = {
    width: number;
    height: number;
    pixels: Uint8ClampedArray<ArrayBuffer>;
    columns: number;
    rows: number;
    frames: Array<{ index: number; x: number; y: number; width: number; height: number; durationMs: number }>;
};

export class SpriteError extends Error {
    readonly code: string;
    constructor(code: string) { super(code); this.name = 'SpriteError'; this.code = code; }
}

function integer(value: unknown, min: number, max: number, code: string): asserts value is number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) throw new SpriteError(code);
}
function size(width: unknown, height: unknown): void {
    integer(width, SPRITE_LIMITS.minSide, SPRITE_LIMITS.maxSide, 'INVALID_DIMENSIONS');
    integer(height, SPRITE_LIMITS.minSide, SPRITE_LIMITS.maxSide, 'INVALID_DIMENSIONS');
}
function exactRecord(value: unknown, names: readonly string[], code: string): asserts value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) throw new SpriteError(code);
    const keys = Reflect.ownKeys(value);
    if (keys.length !== names.length || keys.some(key => typeof key !== 'string' || !names.includes(key))) throw new SpriteError(code);
    for (const key of names) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) throw new SpriteError(code);
    }
}
function exactArray(value: unknown, max: number, code: string): asserts value is unknown[] {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length < 1 || value.length > max) throw new SpriteError(code);
    if (Reflect.ownKeys(value).length !== value.length + 1) throw new SpriteError(code);
    for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) throw new SpriteError(code);
    }
}
function frame(value: unknown, width: number, height: number): asserts value is PixelGrid {
    exactRecord(value, ['width', 'height', 'pixels'], 'INVALID_FRAME');
    if (value.width !== width || value.height !== height || !(value.pixels instanceof Uint8ClampedArray) ||
        !(value.pixels.buffer instanceof ArrayBuffer) || value.pixels.length !== width * height * 4) throw new SpriteError('INVALID_FRAME');
}
function rawBytes(animation: SpriteAnimation): number { return animation.width * animation.height * 4 * animation.frames.length; }

/** Only this new format is accepted. Existing static-pixel and bead formats are untouched. */
export function validateAnimation(value: SpriteAnimation): void {
    try {
        exactRecord(value, ['width', 'height', 'fps', 'activeFrame', 'frames'], 'INVALID_ANIMATION');
        size(value.width, value.height);
        integer(value.fps, 1, SPRITE_LIMITS.maxFps, 'INVALID_FPS');
        exactArray(value.frames, SPRITE_LIMITS.maxFrames, 'FRAME_LIMIT');
        integer(value.activeFrame, 0, value.frames.length - 1, 'INVALID_FRAME_INDEX');
        const width = value.width as number, height = value.height as number;
        if (width * height * 4 * value.frames.length > SPRITE_LIMITS.maxRawBytes) throw new SpriteError('ANIMATION_TOO_LARGE');
        for (const current of value.frames) frame(current, width, height);
    } catch (error) {
        if (error instanceof SpriteError) throw error;
        throw new SpriteError('INVALID_ANIMATION');
    }
}

export function createAnimation(width: number = 16, height: number = 16): SpriteAnimation {
    size(width, height);
    return { width, height, fps: 8, activeFrame: 0, frames: [createGrid(width, height)] };
}
export function cloneAnimation(animation: SpriteAnimation): SpriteAnimation {
    validateAnimation(animation);
    return { width: animation.width, height: animation.height, fps: animation.fps, activeFrame: animation.activeFrame,
        frames: animation.frames.map(current => createGrid(current.width, current.height, current.pixels)) };
}
export function setActiveFrame(animation: SpriteAnimation, index: number): SpriteAnimation {
    validateAnimation(animation);
    integer(index, 0, animation.frames.length - 1, 'INVALID_FRAME_INDEX');
    const next = cloneAnimation(animation); next.activeFrame = index; return next;
}
export function setAnimationFps(animation: SpriteAnimation, fps: number): SpriteAnimation {
    integer(fps, 1, SPRITE_LIMITS.maxFps, 'INVALID_FPS');
    const next = cloneAnimation(animation); next.fps = fps; return next;
}
export function replaceFrame(animation: SpriteAnimation, index: number, grid: PixelGrid): SpriteAnimation {
    validateAnimation(animation);
    integer(index, 0, animation.frames.length - 1, 'INVALID_FRAME_INDEX');
    frame(grid, animation.width, animation.height);
    const next = cloneAnimation(animation); next.frames[index] = createGrid(grid.width, grid.height, grid.pixels); return next;
}
export function addFrame(animation: SpriteAnimation, duplicate: boolean = false): SpriteAnimation {
    validateAnimation(animation);
    if (typeof duplicate !== 'boolean') throw new SpriteError('INVALID_FRAME');
    if (animation.frames.length >= SPRITE_LIMITS.maxFrames) throw new SpriteError('FRAME_LIMIT');
    const next = cloneAnimation(animation), source = animation.frames[animation.activeFrame];
    next.activeFrame++;
    next.frames.splice(next.activeFrame, 0, createGrid(animation.width, animation.height, duplicate ? source.pixels : undefined));
    return next;
}
export function removeFrame(animation: SpriteAnimation, index?: number): SpriteAnimation {
    validateAnimation(animation);
    const target = index === undefined ? animation.activeFrame : index;
    integer(target, 0, animation.frames.length - 1, 'INVALID_FRAME_INDEX');
    if (animation.frames.length === 1) throw new SpriteError('LAST_FRAME');
    const next = cloneAnimation(animation); next.frames.splice(target, 1);
    next.activeFrame = target < animation.activeFrame ? animation.activeFrame - 1 : Math.min(animation.activeFrame, next.frames.length - 1);
    return next;
}
export function moveFrame(animation: SpriteAnimation, direction: -1 | 1): SpriteAnimation {
    validateAnimation(animation);
    if (direction !== -1 && direction !== 1) throw new SpriteError('INVALID_DIRECTION');
    const next = cloneAnimation(animation), destination = animation.activeFrame + direction;
    if (destination < 0 || destination >= next.frames.length) return next;
    [next.frames[animation.activeFrame], next.frames[destination]] = [next.frames[destination], next.frames[animation.activeFrame]];
    next.activeFrame = destination;
    return next;
}
export function resizeAnimation(animation: SpriteAnimation, width: number, height: number, mode: 'crop' | 'scale'): SpriteAnimation {
    validateAnimation(animation); size(width, height);
    if (mode !== 'crop' && mode !== 'scale') throw new SpriteError('INVALID_RESIZE_MODE');
    const frames = animation.frames.map(source => {
        if (mode === 'scale') return resizeNearest(source, width, height);
        const output = createGrid(width, height), columns = Math.min(width, source.width), rows = Math.min(height, source.height);
        for (let y = 0; y < rows; y++) output.pixels.set(source.pixels.subarray(y * source.width * 4, (y * source.width + columns) * 4), y * width * 4);
        return output;
    });
    return { width, height, fps: animation.fps, activeFrame: animation.activeFrame, frames };
}

function encodeBase64(pixels: Uint8ClampedArray): string {
    let binary = '';
    for (const byte of pixels) binary += String.fromCharCode(byte);
    return btoa(binary);
}
function decodeBase64(value: unknown, expected: number): Uint8ClampedArray<ArrayBuffer> {
    if (typeof value !== 'string' || value.length !== 4 * Math.ceil(expected / 3) ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new SpriteError('PROJECT_FRAME_DATA');
    let binary: string;
    try { binary = atob(value); } catch { throw new SpriteError('PROJECT_FRAME_DATA'); }
    if (binary.length !== expected || btoa(binary) !== value) throw new SpriteError('PROJECT_FRAME_DATA');
    return Uint8ClampedArray.from(binary, character => character.charCodeAt(0));
}
export function serializeAnimation(animation: SpriteAnimation): string {
    validateAnimation(animation);
    const text = JSON.stringify({ format: SPRITE_PROJECT_FORMAT, version: SPRITE_PROJECT_VERSION,
        width: animation.width, height: animation.height, fps: animation.fps, activeFrame: animation.activeFrame,
        frames: animation.frames.map(current => encodeBase64(current.pixels)) });
    if (text.length > SPRITE_LIMITS.maxProjectBytes) throw new SpriteError('PROJECT_TOO_LARGE');
    return text;
}
export function parseAnimation(text: string): SpriteAnimation {
    if (typeof text !== 'string' || text.length > SPRITE_LIMITS.maxProjectBytes || new TextEncoder().encode(text).length > SPRITE_LIMITS.maxProjectBytes) throw new SpriteError('PROJECT_TOO_LARGE');
    let object: unknown;
    try { object = JSON.parse(text); } catch { throw new SpriteError('PROJECT_INVALID_JSON'); }
    exactRecord(object, ['format', 'version', 'width', 'height', 'fps', 'activeFrame', 'frames'], 'PROJECT_FIELDS');
    if (object.format !== SPRITE_PROJECT_FORMAT || object.version !== SPRITE_PROJECT_VERSION) throw new SpriteError('PROJECT_UNSUPPORTED_FORMAT');
    size(object.width, object.height);
    integer(object.fps, 1, SPRITE_LIMITS.maxFps, 'INVALID_FPS');
    exactArray(object.frames, SPRITE_LIMITS.maxFrames, 'FRAME_LIMIT');
    integer(object.activeFrame, 0, object.frames.length - 1, 'INVALID_FRAME_INDEX');
    const width = object.width as number, height = object.height as number;
    const result: SpriteAnimation = { width, height, fps: object.fps, activeFrame: object.activeFrame,
        frames: object.frames.map(value => createGrid(width, height, decodeBase64(value, width * height * 4))) };
    validateAnimation(result);
    return result;
}
export function animationsEqual(a: SpriteAnimation, b: SpriteAnimation): boolean {
    validateAnimation(a); validateAnimation(b);
    return a.width === b.width && a.height === b.height && a.fps === b.fps && a.activeFrame === b.activeFrame && a.frames.length === b.frames.length &&
        a.frames.every((current, frameIndex) => current.pixels.every((channel, index) => channel === b.frames[frameIndex].pixels[index]));
}

/** Entire-animation transactions; undo and redo share both retention budgets. */
export class SpriteHistory {
    private readonly maxSteps: number;
    private readonly undoStates: SpriteAnimation[] = [];
    private readonly redoStates: SpriteAnimation[] = [];
    constructor(maxSteps: number = SPRITE_LIMITS.maxHistorySteps) {
        integer(maxSteps, 1, SPRITE_LIMITS.maxHistorySteps, 'INVALID_HISTORY_LIMIT'); this.maxSteps = maxSteps;
    }
    get canUndo(): boolean { return this.undoStates.length > 0; }
    get canRedo(): boolean { return this.redoStates.length > 0; }
    get retainedSteps(): number { return this.undoStates.length + this.redoStates.length; }
    get retainedBytes(): number { return [...this.undoStates, ...this.redoStates].reduce((sum, state) => sum + rawBytes(state), 0); }
    private trim(): void {
        while (this.retainedSteps > this.maxSteps || this.retainedBytes > SPRITE_LIMITS.maxHistoryBytes) {
            if (this.undoStates.length) this.undoStates.shift(); else this.redoStates.shift();
        }
    }
    push(before: SpriteAnimation, after: SpriteAnimation): boolean {
        if (animationsEqual(before, after)) return false;
        const snapshot = cloneAnimation(before);
        this.redoStates.length = 0; this.undoStates.push(snapshot); this.trim(); return true;
    }
    undo(current: SpriteAnimation): SpriteAnimation | null {
        validateAnimation(current);
        if (!this.canUndo) return null;
        const snapshot = cloneAnimation(current), restored = this.undoStates.pop()!;
        this.redoStates.push(snapshot); this.trim(); return restored;
    }
    redo(current: SpriteAnimation): SpriteAnimation | null {
        validateAnimation(current);
        if (!this.canRedo) return null;
        const snapshot = cloneAnimation(current), restored = this.redoStates.pop()!;
        this.undoStates.push(snapshot); this.trim(); return restored;
    }
    clear(): void { this.undoStates.length = 0; this.redoStates.length = 0; }
}

export function packSpriteSheet(animation: SpriteAnimation, layout: SpriteSheetLayout = 'horizontal', columns?: number): SpriteSheet {
    validateAnimation(animation);
    if (layout !== 'horizontal' && layout !== 'vertical' && layout !== 'grid') throw new SpriteError('INVALID_LAYOUT');
    if (columns !== undefined) integer(columns, 1, animation.frames.length, 'INVALID_COLUMNS');
    const cols = layout === 'horizontal' ? animation.frames.length : layout === 'vertical' ? 1 : columns ?? Math.ceil(Math.sqrt(animation.frames.length));
    const rows = Math.ceil(animation.frames.length / cols), width = animation.width * cols, height = animation.height * rows;
    const pixels = new Uint8ClampedArray(width * height * 4);
    const frames = animation.frames.map((current, index) => {
        const x = (index % cols) * animation.width, y = Math.floor(index / cols) * animation.height;
        for (let row = 0; row < animation.height; row++) pixels.set(current.pixels.subarray(row * animation.width * 4, (row + 1) * animation.width * 4), ((row + y) * width + x) * 4);
        return { index, x, y, width: animation.width, height: animation.height, durationMs: 1000 / animation.fps };
    });
    return { width, height, pixels, columns: cols, rows, frames };
}

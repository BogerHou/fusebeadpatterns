import type { Palette } from '../core/model/palette/palette.model';
import {
    createPaletteEntryColorMap,
    getPaletteEntryColorKey,
} from '../core/utils/utils';
import type { PatternPoint } from './pattern-edit';
import { EDITOR_PROJECT_PATTERN_DIMENSION_MAX } from './draft';

export const PATTERN_HISTORY_MAX_BYTES = 32 * 1024 * 1024;
export const PATTERN_HISTORY_MAX_STEPS = 200;

type SerializedPatternPatch = {
    count: number;
    /** Little-endian uint32 RGBA byte offsets. */
    indices: string;
    before: string;
    after: string;
};

/** Tab-local language transfer only; this is not the saved project format. */
export type PatternHistorySnapshot = {
    version: 1;
    width: number;
    height: number;
    /** Exact current pixels bind the history, including pixels never edited. */
    data: string;
    undo: SerializedPatternPatch[];
    redo: SerializedPatternPatch[];
};

export type PatternPatch = {
    /** RGBA byte offsets in the full pattern, rather than pixel numbers. */
    indices: Uint32Array;
    before: Uint8ClampedArray;
    after: Uint8ClampedArray;
};

type RgbaColor = readonly [number, number, number, number];
type PatchDirection = 'undo' | 'redo';

function pixelsMatch(
    first: ArrayLike<number>,
    firstIndex: number,
    second: ArrayLike<number>,
    secondIndex: number
): boolean {
    return (
        first[firstIndex] === second[secondIndex] &&
        first[firstIndex + 1] === second[secondIndex + 1] &&
        first[firstIndex + 2] === second[secondIndex + 2] &&
        first[firstIndex + 3] === second[secondIndex + 3]
    );
}

function assertRgbaLength(data: Uint8ClampedArray): void {
    if (data.length % 4 !== 0) {
        throw new RangeError('Pattern data must contain complete RGBA pixels.');
    }
}

function allocatePatch(pixelCount: number): PatternPatch {
    return {
        indices: new Uint32Array(pixelCount),
        before: new Uint8ClampedArray(pixelCount * 4),
        after: new Uint8ClampedArray(pixelCount * 4),
    };
}

/** Edits the working pixels while retaining only each touched pixel's first value. */
export class PatternStroke {
    private readonly before = new Map<number, RgbaColor>();
    private readonly nextColor = new Uint8ClampedArray(4);

    constructor(private readonly data: Uint8ClampedArray) {
        assertRgbaLength(data);
    }

    setPixel(index: number, color: RgbaColor): boolean {
        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index % 4 !== 0 ||
            index + 3 >= this.data.length
        ) {
            return false;
        }

        // Compare the same clamped values that will actually be stored.
        this.nextColor.set(color);
        if (pixelsMatch(this.data, index, this.nextColor, 0)) {
            return false;
        }

        if (!this.before.has(index)) {
            this.before.set(index, [
                this.data[index],
                this.data[index + 1],
                this.data[index + 2],
                this.data[index + 3],
            ]);
        }
        this.data.set(this.nextColor, index);
        return true;
    }

    /** Finishes this stroke; pixels restored to their original value are omitted. */
    finish(): PatternPatch | null {
        let changedCount = 0;
        for (const [index, color] of this.before) {
            if (!pixelsMatch(this.data, index, color, 0)) {
                changedCount += 1;
            }
        }
        if (changedCount === 0) {
            this.before.clear();
            return null;
        }

        const patch = allocatePatch(changedCount);
        let offset = 0;
        for (const [index, color] of this.before) {
            if (pixelsMatch(this.data, index, color, 0)) {
                continue;
            }
            patch.indices[offset] = index;
            patch.before.set(color, offset * 4);
            for (let channel = 0; channel < 4; channel += 1) {
                patch.after[offset * 4 + channel] = this.data[index + channel];
            }
            offset += 1;
        }
        this.before.clear();
        return patch;
    }
}

export function createPatternPatch(
    before: Uint8ClampedArray,
    after: Uint8ClampedArray
): PatternPatch | null {
    assertRgbaLength(before);
    if (before.length !== after.length) {
        throw new RangeError('Pattern patches cannot change the pattern dimensions.');
    }

    let changedCount = 0;
    for (let index = 0; index < before.length; index += 4) {
        if (!pixelsMatch(before, index, after, index)) {
            changedCount += 1;
        }
    }
    if (changedCount === 0) {
        return null;
    }

    const patch = allocatePatch(changedCount);
    let offset = 0;
    for (let index = 0; index < before.length; index += 4) {
        if (pixelsMatch(before, index, after, index)) {
            continue;
        }
        patch.indices[offset] = index;
        for (let channel = 0; channel < 4; channel += 1) {
            patch.before[offset * 4 + channel] = before[index + channel];
            patch.after[offset * 4 + channel] = after[index + channel];
        }
        offset += 1;
    }
    return patch;
}

export function applyPatternPatch(
    data: Uint8ClampedArray,
    patch: PatternPatch,
    direction: PatchDirection
): void {
    const colors = direction === 'undo' ? patch.before : patch.after;
    for (let offset = 0; offset < patch.indices.length; offset += 1) {
        const index = patch.indices[offset];
        for (let channel = 0; channel < 4; channel += 1) {
            data[index + channel] = colors[offset * 4 + channel];
        }
    }
}

function patchByteLength(patch: PatternPatch): number {
    return patch.indices.byteLength + patch.before.byteLength + patch.after.byteLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPatternSize(data: Uint8ClampedArray, width: number, height: number): boolean {
    return [width, height].every((dimension) => (
        Number.isInteger(dimension) && dimension > 0 &&
        dimension <= EDITOR_PROJECT_PATTERN_DIMENSION_MAX
    )) && data.length === width * height * 4;
}

function encodeBytes(bytes: Uint8Array | Uint8ClampedArray): string {
    let binary = '';
    for (let start = 0; start < bytes.length; start += 0x8000) {
        const end = Math.min(start + 0x8000, bytes.length);
        let chunk = '';
        for (let index = start; index < end; index += 1) {
            chunk += String.fromCharCode(bytes[index]);
        }
        binary += chunk;
    }
    return btoa(binary);
}

function hasEncodedByteLength(value: unknown, byteLength: number): value is string {
    return typeof value === 'string' && value.length === Math.ceil(byteLength / 3) * 4;
}

function decodeBytes(value: string, byteLength: number): Uint8Array | null {
    try {
        const binary = atob(value);
        if (binary.length !== byteLength) return null;
        const bytes = new Uint8Array(byteLength);
        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }
        // Reject non-canonical encodings rather than silently normalizing corruption.
        return encodeBytes(bytes) === value ? bytes : null;
    } catch {
        return null;
    }
}

function serializePatch(patch: PatternPatch): SerializedPatternPatch {
    const indices = new Uint8Array(patch.indices.length * 4);
    const view = new DataView(indices.buffer);
    patch.indices.forEach((index, offset) => view.setUint32(offset * 4, index, true));
    return {
        count: patch.indices.length,
        indices: encodeBytes(indices),
        before: encodeBytes(patch.before),
        after: encodeBytes(patch.after),
    };
}

function deserializePatch(patch: SerializedPatternPatch): PatternPatch | null {
    const indicesBytes = decodeBytes(patch.indices, patch.count * 4);
    const before = decodeBytes(patch.before, patch.count * 4);
    const after = decodeBytes(patch.after, patch.count * 4);
    if (!indicesBytes || !before || !after) return null;
    const indices = new Uint32Array(patch.count);
    const view = new DataView(indicesBytes.buffer);
    for (let offset = 0; offset < patch.count; offset += 1) {
        indices[offset] = view.getUint32(offset * 4, true);
    }
    return {
        indices,
        before: new Uint8ClampedArray(before.buffer),
        after: new Uint8ClampedArray(after.buffer),
    };
}

function isValidPatch(patch: PatternPatch, patternLength: number, seen: Uint8Array, mark: number): boolean {
    if (
        !(patch.indices instanceof Uint32Array) ||
        !(patch.before instanceof Uint8ClampedArray) ||
        !(patch.after instanceof Uint8ClampedArray)
    ) return false;
    const count = patch.indices.length;
    if (
        count === 0 || count > patternLength / 4 ||
        patch.before.length !== count * 4 || patch.after.length !== count * 4
    ) return false;

    for (let offset = 0; offset < count; offset += 1) {
        const index = patch.indices[offset];
        if (index % 4 !== 0 || index + 3 >= patternLength || seen[index / 4] === mark) return false;
        if (pixelsMatch(patch.before, offset * 4, patch.after, offset * 4)) return false;
        seen[index / 4] = mark;
    }
    return true;
}

function hasConsistentHistory(
    data: Uint8ClampedArray,
    undo: PatternPatch[],
    redo: PatternPatch[]
): boolean {
    const seen = new Uint8Array(data.length / 4);
    const patches = [...undo, ...redo];
    for (let step = 0; step < patches.length; step += 1) {
        if (!isValidPatch(patches[step], data.length, seen, step + 1)) return false;
    }

    const working = data.slice();
    for (const [stack, direction] of [[undo, 'undo'], [redo, 'redo']] as const) {
        working.set(data);
        for (let step = stack.length - 1; step >= 0; step -= 1) {
            const patch = stack[step];
            const expected = direction === 'undo' ? patch.after : patch.before;
            for (let offset = 0; offset < patch.indices.length; offset += 1) {
                if (!pixelsMatch(working, patch.indices[offset], expected, offset * 4)) return false;
            }
            applyPatternPatch(working, patch, direction);
        }
    }
    return true;
}

export class PatternHistory {
    private readonly undoStack: PatternPatch[] = [];
    private readonly redoStack: PatternPatch[] = [];
    private readonly byteBudget: number;
    private readonly maxSteps: number;
    private retainedBytes = 0;

    constructor(options: { byteBudget?: number; maxSteps?: number } = {}) {
        this.byteBudget = options.byteBudget ?? PATTERN_HISTORY_MAX_BYTES;
        this.maxSteps = options.maxSteps ?? PATTERN_HISTORY_MAX_STEPS;
        if (
            !Number.isFinite(this.byteBudget) ||
            this.byteBudget < 0 ||
            !Number.isInteger(this.maxSteps) ||
            this.maxSteps < 0
        ) {
            throw new RangeError('History limits must be non-negative finite values.');
        }
    }

    get canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    get canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /** Includes undo and redo: moving an operation between stacks retains its bytes. */
    get byteLength(): number {
        return this.retainedBytes;
    }

    /** Captures both stacks without retaining references to live pattern/history data. */
    capture(data: Uint8ClampedArray, width: number, height: number): PatternHistorySnapshot | null {
        if (
            !isPatternSize(data, width, height) ||
            this.undoStack.length + this.redoStack.length > Math.min(this.maxSteps, PATTERN_HISTORY_MAX_STEPS)
        ) return null;
        let retainedBytes = 0;
        for (const patch of [...this.undoStack, ...this.redoStack]) {
            if (
                !(patch.indices instanceof Uint32Array) ||
                !(patch.before instanceof Uint8ClampedArray) ||
                !(patch.after instanceof Uint8ClampedArray)
            ) return null;
            retainedBytes += patchByteLength(patch);
            if (retainedBytes > Math.min(this.byteBudget, PATTERN_HISTORY_MAX_BYTES)) return null;
        }
        if (!hasConsistentHistory(data, this.undoStack, this.redoStack)) return null;
        return {
            version: 1,
            width,
            height,
            data: encodeBytes(data),
            undo: this.undoStack.map(serializePatch),
            redo: this.redoStack.map(serializePatch),
        };
    }

    /** Validates the complete graph before replacing history; never modifies pixels. */
    restore(snapshot: unknown, data: Uint8ClampedArray, width: number, height: number): boolean {
        if (
            !isPatternSize(data, width, height) || !isRecord(snapshot) ||
            snapshot.version !== 1 || snapshot.width !== width || snapshot.height !== height ||
            !hasEncodedByteLength(snapshot.data, data.length) ||
            !Array.isArray(snapshot.undo) || !Array.isArray(snapshot.redo) ||
            snapshot.undo.length + snapshot.redo.length > Math.min(this.maxSteps, PATTERN_HISTORY_MAX_STEPS)
        ) return false;

        // Check every encoded size and the aggregate budget before decoding any patch.
        let retainedBytes = 0;
        const serializedStacks = [snapshot.undo, snapshot.redo];
        for (const stack of serializedStacks) {
            for (const patch of stack) {
                if (
                    !isRecord(patch) || typeof patch.count !== 'number' ||
                    !Number.isInteger(patch.count) || patch.count <= 0 || patch.count > data.length / 4 ||
                    !hasEncodedByteLength(patch.indices, patch.count * 4) ||
                    !hasEncodedByteLength(patch.before, patch.count * 4) ||
                    !hasEncodedByteLength(patch.after, patch.count * 4)
                ) return false;
                retainedBytes += patch.count * 12;
                if (retainedBytes > Math.min(this.byteBudget, PATTERN_HISTORY_MAX_BYTES)) return false;
            }
        }
        if (snapshot.data !== encodeBytes(data)) return false;

        const decodedStacks: PatternPatch[][] = [];
        for (const stack of serializedStacks) {
            const decoded: PatternPatch[] = [];
            for (const patch of stack) {
                const restored = deserializePatch(patch as SerializedPatternPatch);
                if (!restored) return false;
                decoded.push(restored);
            }
            decodedStacks.push(decoded);
        }
        const [undo, redo] = decodedStacks;
        if (!hasConsistentHistory(data, undo, redo)) return false;

        this.undoStack.length = 0;
        this.redoStack.length = 0;
        this.undoStack.push(...undo);
        this.redoStack.push(...redo);
        this.retainedBytes = retainedBytes;
        return true;
    }

    push(patch: PatternPatch | null): void {
        if (!patch || patch.indices.length === 0) {
            return;
        }

        for (const discarded of this.redoStack) {
            this.retainedBytes -= patchByteLength(discarded);
        }
        this.redoStack.length = 0;
        this.undoStack.push(patch);
        this.retainedBytes += patchByteLength(patch);

        while (
            this.undoStack.length > this.maxSteps ||
            this.retainedBytes > this.byteBudget
        ) {
            this.retainedBytes -= patchByteLength(this.undoStack.shift()!);
        }
    }

    undo(data: Uint8ClampedArray): PatternPatch | null {
        const patch = this.undoStack.pop();
        if (!patch) {
            return null;
        }
        applyPatternPatch(data, patch, 'undo');
        this.redoStack.push(patch);
        return patch;
    }

    redo(data: Uint8ClampedArray): PatternPatch | null {
        const patch = this.redoStack.pop();
        if (!patch) {
            return null;
        }
        applyPatternPatch(data, patch, 'redo');
        this.undoStack.push(patch);
        return patch;
    }

    clear(): void {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        this.retainedBytes = 0;
    }
}

export function updatePatternUsage(
    usage: Map<string, number>,
    palettes: Palette[],
    patch: PatternPatch,
    direction: PatchDirection
): Map<string, number> {
    const nextUsage = new Map(usage);
    const entriesByColor = createPaletteEntryColorMap(palettes);
    const removed = direction === 'undo' ? patch.after : patch.before;
    const added = direction === 'undo' ? patch.before : patch.after;

    for (let offset = 0; offset < patch.indices.length * 4; offset += 4) {
        const removedEntry = entriesByColor.get(getPaletteEntryColorKey(
            removed[offset], removed[offset + 1], removed[offset + 2], removed[offset + 3]
        ));
        const addedEntry = entriesByColor.get(getPaletteEntryColorKey(
            added[offset], added[offset + 1], added[offset + 2], added[offset + 3]
        ));
        if (removedEntry?.ref === addedEntry?.ref) {
            continue;
        }
        if (removedEntry) {
            const remaining = (nextUsage.get(removedEntry.ref) ?? 0) - 1;
            if (remaining > 0) {
                nextUsage.set(removedEntry.ref, remaining);
            } else {
                nextUsage.delete(removedEntry.ref);
            }
        }
        if (addedEntry) {
            nextUsage.set(addedEntry.ref, (nextUsage.get(addedEntry.ref) ?? 0) + 1);
        }
    }
    return nextUsage;
}

/** Integer Bresenham line, including both endpoints, for gap-free pointer strokes. */
export function getPatternLinePoints(
    from: PatternPoint,
    to: PatternPoint
): PatternPoint[] {
    if (![from.x, from.y, to.x, to.y].every(Number.isSafeInteger)) {
        return [];
    }
    const points: PatternPoint[] = [];
    let { x, y } = from;
    const deltaX = Math.abs(to.x - x);
    const deltaY = -Math.abs(to.y - y);
    const stepX = x < to.x ? 1 : -1;
    const stepY = y < to.y ? 1 : -1;
    let error = deltaX + deltaY;

    while (true) {
        points.push({ x, y });
        if (x === to.x && y === to.y) {
            return points;
        }
        const doubledError = 2 * error;
        if (doubledError >= deltaY) {
            error += deltaY;
            x += stepX;
        }
        if (doubledError <= deltaX) {
            error += deltaX;
            y += stepY;
        }
    }
}

import type { Palette } from '../core/model/palette/palette.model';
import {
    createPaletteEntryColorMap,
    getPaletteEntryColorKey,
} from '../core/utils/utils';
import type { PatternPoint } from './pattern-edit';

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

export class PatternHistory {
    private readonly undoStack: PatternPatch[] = [];
    private readonly redoStack: PatternPatch[] = [];
    private readonly byteBudget: number;
    private readonly maxSteps: number;
    private retainedBytes = 0;

    constructor(options: { byteBudget?: number; maxSteps?: number } = {}) {
        this.byteBudget = options.byteBudget ?? 32 * 1024 * 1024;
        this.maxSteps = options.maxSteps ?? 200;
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

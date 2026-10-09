import { describe, expect, it } from 'vitest';

import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { computeUsage } from '../core/utils/utils';
import {
    applyPatternPatch,
    createPatternPatch,
    getPatternLinePoints,
    PatternHistory,
    PATTERN_HISTORY_MAX_BYTES,
    PATTERN_HISTORY_MAX_STEPS,
    PatternStroke,
    updatePatternUsage,
    type PatternHistorySnapshot,
} from './pattern-history';

function createEntry(ref: string, color: Color): PaletteEntry {
    const entry = new PaletteEntry(ref, color);
    entry.ref = ref;
    return entry;
}

function paint(data: Uint8ClampedArray, red: number, index = 0) {
    const stroke = new PatternStroke(data);
    stroke.setPixel(index, [red, 0, 0, 255]);
    return stroke.finish();
}

describe('PatternStroke', () => {
    it('groups multiple pixels into one compact patch without copying the pattern', () => {
        const data = new Uint8ClampedArray(1_000_000 * 4);
        const stroke = new PatternStroke(data);

        expect(stroke.setPixel(4, [255, 0, 0, 255])).toBe(true);
        expect(stroke.setPixel(36, [0, 0, 255, 255])).toBe(true);
        expect(data[4]).toBe(255);
        const patch = stroke.finish()!;

        expect(patch.indices).toEqual(new Uint32Array([4, 36]));
        expect(patch.before).toEqual(new Uint8ClampedArray(8));
        expect(patch.after).toEqual(new Uint8ClampedArray([
            255, 0, 0, 255, 0, 0, 255, 255,
        ]));
        expect(patch.indices.byteLength + patch.before.byteLength + patch.after.byteLength)
            .toBe(24);
        expect(stroke.finish()).toBeNull();
    });

    it('retains each pixel’s earliest value and omits changes reverted within the stroke', () => {
        const data = new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]);
        const original = data.slice();
        const stroke = new PatternStroke(data);
        stroke.setPixel(0, [9, 9, 9, 255]);
        stroke.setPixel(0, [8, 8, 8, 255]);
        stroke.setPixel(4, [9, 9, 9, 255]);
        stroke.setPixel(4, [4, 5, 6, 255]);

        const patch = stroke.finish()!;
        expect(patch.indices).toEqual(new Uint32Array([0]));
        expect(patch.before).toEqual(new Uint8ClampedArray([1, 2, 3, 255]));
        expect(patch.after).toEqual(new Uint8ClampedArray([8, 8, 8, 255]));
        applyPatternPatch(data, patch, 'undo');
        expect(data).toEqual(original);
        applyPatternPatch(data, patch, 'redo');
        expect(data).toEqual(new Uint8ClampedArray([8, 8, 8, 255, 4, 5, 6, 255]));
    });

    it('ignores unchanged colors and invalid or unaligned byte offsets', () => {
        const data = new Uint8ClampedArray([1, 2, 3, 255]);
        const stroke = new PatternStroke(data);
        expect(stroke.setPixel(0, [1, 2, 3, 255])).toBe(false);
        for (const index of [-4, 1, 0.5, 4, NaN, Infinity]) {
            expect(stroke.setPixel(index, [9, 9, 9, 255])).toBe(false);
        }
        expect(stroke.finish()).toBeNull();
        expect(data).toEqual(new Uint8ClampedArray([1, 2, 3, 255]));
    });

    it('uses clamped pixel values when deciding whether a change occurred', () => {
        const data = new Uint8ClampedArray([255, 0, 2, 255]);
        const stroke = new PatternStroke(data);
        expect(stroke.setPixel(0, [300, -1, 2.4, 300])).toBe(false);
        expect(stroke.finish()).toBeNull();
    });

    it('returns no operation when all touched pixels finish unchanged', () => {
        const data = new Uint8ClampedArray(4);
        const stroke = new PatternStroke(data);
        stroke.setPixel(0, [1, 2, 3, 255]);
        stroke.setPixel(0, [0, 0, 0, 0]);
        expect(stroke.finish()).toBeNull();
    });
});

describe('createPatternPatch', () => {
    it('records only differences and owns its stored pixel values', () => {
        const before = new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]);
        const after = new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 0]);
        const patch = createPatternPatch(before, after)!;
        before[4] = 99;
        after[4] = 88;

        expect(patch.indices).toEqual(new Uint32Array([4]));
        expect(patch.before).toEqual(new Uint8ClampedArray([4, 5, 6, 255]));
        expect(patch.after).toEqual(new Uint8ClampedArray([4, 5, 6, 0]));
    });

    it('skips identical patterns and rejects incomplete or resized patterns', () => {
        expect(createPatternPatch(new Uint8ClampedArray(8), new Uint8ClampedArray(8)))
            .toBeNull();
        expect(() => createPatternPatch(new Uint8ClampedArray(4), new Uint8ClampedArray(8)))
            .toThrow(RangeError);
        expect(() => createPatternPatch(new Uint8ClampedArray(3), new Uint8ClampedArray(3)))
            .toThrow(RangeError);
    });
});

describe('PatternHistory', () => {
    it('undoes and redoes a complete stroke as one operation', () => {
        const data = new Uint8ClampedArray(12);
        const stroke = new PatternStroke(data);
        stroke.setPixel(0, [1, 2, 3, 255]);
        stroke.setPixel(8, [4, 5, 6, 255]);
        const patch = stroke.finish();
        const painted = data.slice();
        const history = new PatternHistory();
        history.push(patch);

        expect(history.byteLength).toBe(24);
        expect(history.canUndo).toBe(true);
        expect(history.canRedo).toBe(false);
        expect(history.undo(data)).toBe(patch);
        expect(data).toEqual(new Uint8ClampedArray(12));
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(true);
        expect(history.byteLength).toBe(24);
        expect(history.undo(data)).toBeNull();
        expect(history.redo(data)).toBe(patch);
        expect(data).toEqual(painted);
        expect(history.redo(data)).toBeNull();
    });

    it('keeps redo for an empty stroke but discards it when creating a new branch', () => {
        const data = new Uint8ClampedArray(8);
        const history = new PatternHistory();
        history.push(paint(data, 1));
        history.push(paint(data, 2));
        history.undo(data);
        history.push(null);
        history.push({
            indices: new Uint32Array(),
            before: new Uint8ClampedArray(),
            after: new Uint8ClampedArray(),
        });
        expect(history.canRedo).toBe(true);
        expect(history.byteLength).toBe(24);

        history.push(paint(data, 3, 4));
        expect(history.canRedo).toBe(false);
        expect(history.byteLength).toBe(24);
        history.undo(data);
        expect(data).toEqual(new Uint8ClampedArray([1, 0, 0, 255, 0, 0, 0, 0]));
        history.undo(data);
        expect(data).toEqual(new Uint8ClampedArray(8));
    });

    it.each([
        { byteBudget: 24, maxSteps: 200 },
        { byteBudget: 1024, maxSteps: 2 },
    ])('evicts oldest operations within configured limits: %j', (limits) => {
        const data = new Uint8ClampedArray(4);
        const history = new PatternHistory(limits);
        for (const red of [1, 2, 3]) {
            history.push(paint(data, red));
        }

        expect(history.byteLength).toBe(24);
        history.undo(data);
        expect(data[0]).toBe(2);
        history.undo(data);
        expect(data[0]).toBe(1);
        expect(history.undo(data)).toBeNull();
        history.redo(data);
        history.redo(data);
        expect(data[0]).toBe(3);
        expect(history.byteLength).toBe(24);
    });

    it('strictly bounds memory even when a single operation exceeds the budget', () => {
        const data = new Uint8ClampedArray(8);
        const history = new PatternHistory({ byteBudget: 12 });
        history.push(paint(data, 1));
        const stroke = new PatternStroke(data);
        stroke.setPixel(0, [2, 0, 0, 255]);
        stroke.setPixel(4, [2, 0, 0, 255]);
        history.push(stroke.finish());
        expect(history.byteLength).toBe(0);
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(false);
        expect(data[0]).toBe(2);
    });

    it('defaults to 200 retained operations and clears both stacks', () => {
        const data = new Uint8ClampedArray(4);
        const history = new PatternHistory();
        for (let red = 1; red <= 201; red += 1) {
            history.push(paint(data, red));
        }
        expect(history.byteLength).toBe(200 * 12);
        for (let step = 0; step < 200; step += 1) {
            history.undo(data);
        }
        expect(data[0]).toBe(1);
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(true);
        history.redo(data);
        history.clear();
        expect(history.byteLength).toBe(0);
        expect(history.canUndo).toBe(false);
        expect(history.canRedo).toBe(false);
    });
});

describe('PatternHistory language snapshots', () => {
    function copySnapshot(snapshot: PatternHistorySnapshot): PatternHistorySnapshot {
        return JSON.parse(JSON.stringify(snapshot)) as PatternHistorySnapshot;
    }

    function encodedBytes(values: number[]): string {
        return btoa(String.fromCharCode(...values));
    }

    function encodedIndices(values: number[]): string {
        const bytes = new Uint8Array(values.length * 4);
        const view = new DataView(bytes.buffer);
        values.forEach((value, index) => view.setUint32(index * 4, value, true));
        return encodedBytes(Array.from(bytes));
    }

    it('round trips independent undo and redo stacks with actual RGBA edits and branching', () => {
        const data = new Uint8ClampedArray([
            0, 0, 0, 0, 12, 34, 56, 78, 0, 0, 0, 0, 255, 0, 255, 128,
        ]);
        const history = new PatternHistory();
        const states = [data.slice()];
        for (const [index, color] of [
            [0, [240, 106, 69, 255]],
            [8, [100, 200, 255, 120]],
            [0, [0, 0, 0, 0]],
            [4, [255, 255, 255, 255]],
        ] as const) {
            const stroke = new PatternStroke(data);
            stroke.setPixel(index, color);
            history.push(stroke.finish());
            states.push(data.slice());
        }
        history.undo(data);
        history.undo(data);
        const snapshot = copySnapshot(history.capture(data, 2, 2)!);
        const restored = new PatternHistory();
        const pixels = data.slice();

        expect(restored.restore(snapshot, pixels, 2, 2)).toBe(true);
        expect(pixels).toEqual(states[2]);
        expect(restored.byteLength).toBe(48);
        expect(restored.canUndo).toBe(true);
        expect(restored.canRedo).toBe(true);
        restored.undo(pixels);
        expect(pixels).toEqual(states[1]);
        restored.undo(pixels);
        expect(pixels).toEqual(states[0]);
        expect(restored.undo(pixels)).toBeNull();
        for (const expected of states.slice(1)) {
            restored.redo(pixels);
            expect(pixels).toEqual(expected);
        }
        expect(restored.redo(pixels)).toBeNull();
        restored.undo(pixels);
        restored.push(paint(pixels, 99, 12));
        expect(restored.canRedo).toBe(false);
        restored.undo(pixels);
        expect(pixels).toEqual(states[3]);
    });

    it('owns serialized pixels and patches rather than sharing the live history', () => {
        const data = new Uint8ClampedArray(8);
        const history = new PatternHistory();
        const patch = paint(data, 1)!;
        history.push(patch);
        const capturedPixels = data.slice();
        const snapshot = history.capture(data, 2, 1)!;
        data[0] = 77;
        patch.after[0] = 88;
        patch.before[0] = 99;
        patch.indices[0] = 4;

        const restored = new PatternHistory();
        expect(restored.restore(snapshot, capturedPixels, 2, 1)).toBe(true);
        snapshot.undo[0].before = encodedBytes([100, 0, 0, 0]);
        restored.undo(capturedPixels);
        expect(capturedPixels).toEqual(new Uint8ClampedArray(8));
        restored.redo(capturedPixels);
        expect(capturedPixels[0]).toBe(1);
    });

    it('retains empty history and accepts the full 200-step cursor position', () => {
        const pixels = new Uint8ClampedArray(4);
        const history = new PatternHistory();
        const empty = history.capture(pixels, 1, 1)!;
        const restored = new PatternHistory();
        expect(restored.restore(empty, pixels, 1, 1)).toBe(true);
        expect(restored.canUndo || restored.canRedo).toBe(false);
        for (let red = 1; red <= PATTERN_HISTORY_MAX_STEPS; red += 1) {
            history.push(paint(pixels, red));
        }
        for (let step = 0; step < 100; step += 1) history.undo(pixels);
        expect(restored.restore(copySnapshot(history.capture(pixels, 1, 1)!), pixels, 1, 1)).toBe(true);
        for (let step = 0; step < 100; step += 1) restored.undo(pixels);
        expect(pixels[0]).toBe(0);
        for (let step = 0; step < 200; step += 1) restored.redo(pixels);
        expect(pixels[0]).toBe(200);
    });

    it('rejects wrong current pixels, including untouched pixels, and changed dimensions', () => {
        const pixels = new Uint8ClampedArray(8);
        const history = new PatternHistory();
        history.push(paint(pixels, 1));
        const snapshot = history.capture(pixels, 2, 1)!;
        const restored = new PatternHistory();
        const changed = pixels.slice();
        changed[4] = 77;

        expect(restored.restore(snapshot, changed, 2, 1)).toBe(false);
        expect(restored.restore(snapshot, pixels, 1, 2)).toBe(false);
        expect(restored.restore(snapshot, pixels, 1, 1)).toBe(false);
        expect(changed[4]).toBe(77);
        expect(restored.canUndo).toBe(false);
        expect(history.capture(changed, 2, 1)).not.toBeNull(); // A newly captured state has its own exact binding.
        expect(history.capture(pixels, 0, 2)).toBeNull();
        expect(history.capture(pixels, 1.5, 2)).toBeNull();
        expect(history.capture(pixels, Infinity, 2)).toBeNull();
    });

    it.each(['undo', 'redo'] as const)('rejects a broken %s chain beyond its first available operation', (direction) => {
        const pixels = new Uint8ClampedArray(4);
        const history = new PatternHistory();
        for (const red of [1, 2, 3, 4]) history.push(paint(pixels, red));
        if (direction === 'redo') {
            history.undo(pixels);
            history.undo(pixels);
        }
        const snapshot = history.capture(pixels, 1, 1)!;
        if (direction === 'undo') snapshot.undo[0].after = encodedBytes([99, 0, 0, 255]);
        else snapshot.redo[0].before = encodedBytes([99, 0, 0, 255]);
        const before = pixels.slice();
        const restored = new PatternHistory();
        expect(restored.restore(snapshot, pixels, 1, 1)).toBe(false);
        expect(pixels).toEqual(before);
        expect(restored.canUndo || restored.canRedo).toBe(false);
    });

    it.each([
        ['unaligned index', (snapshot: PatternHistorySnapshot) => { snapshot.undo[0].indices = encodedIndices([1]); }],
        ['out of bounds index', (snapshot: PatternHistorySnapshot) => { snapshot.undo[0].indices = encodedIndices([8]); }],
        ['no-op patch', (snapshot: PatternHistorySnapshot) => { snapshot.undo[0].before = snapshot.undo[0].after; }],
        ['truncated colors', (snapshot: PatternHistorySnapshot) => { snapshot.undo[0].before = 'AAA='; }],
        ['wrong encoded type', (snapshot: PatternHistorySnapshot) => { Object.assign(snapshot.undo[0], { indices: [0] }); }],
        ['invalid base64', (snapshot: PatternHistorySnapshot) => { snapshot.undo[0].before = '!!!!!!!!'; }],
        ['negative count', (snapshot: PatternHistorySnapshot) => { snapshot.undo[0].count = -1; }],
        ['huge count', (snapshot: PatternHistorySnapshot) => { snapshot.undo[0].count = Number.MAX_SAFE_INTEGER; }],
        ['wrong version', (snapshot: PatternHistorySnapshot) => { Object.assign(snapshot, { version: 2 }); }],
    ])('rejects %s atomically without losing an existing history', (_name, damage) => {
        const pixels = new Uint8ClampedArray(8);
        const history = new PatternHistory();
        const originalPatch = paint(pixels, 1)!;
        history.push(originalPatch);
        const snapshot = copySnapshot(history.capture(pixels, 2, 1)!);
        damage(snapshot);
        const before = pixels.slice();

        expect(history.restore(snapshot, pixels, 2, 1)).toBe(false);
        expect(pixels).toEqual(before);
        expect(history.byteLength).toBe(12);
        expect(history.undo(pixels)).toBe(originalPatch);
        expect(pixels).toEqual(new Uint8ClampedArray(8));
    });

    it('rejects repeated offsets and never applies an ambiguous multi-pixel patch', () => {
        const pixels = new Uint8ClampedArray(8);
        const history = new PatternHistory();
        const stroke = new PatternStroke(pixels);
        stroke.setPixel(0, [1, 0, 0, 255]);
        stroke.setPixel(4, [2, 0, 0, 255]);
        history.push(stroke.finish());
        const snapshot = history.capture(pixels, 2, 1)!;
        snapshot.undo[0].indices = encodedIndices([0, 0]);
        expect(new PatternHistory().restore(snapshot, pixels, 2, 1)).toBe(false);
        expect(pixels).toEqual(new Uint8ClampedArray([1, 0, 0, 255, 2, 0, 0, 255]));
    });

    it('preserves byte offsets beyond one byte through explicit little-endian serialization', () => {
        const pixels = new Uint8ClampedArray(29 * 29 * 4);
        const history = new PatternHistory();
        history.push(paint(pixels, 42, 1028));
        const snapshot = history.capture(pixels, 29, 29)!;
        expect(snapshot.undo[0].indices).toBe(encodedIndices([1028]));
        const restored = new PatternHistory();
        expect(restored.restore(copySnapshot(snapshot), pixels, 29, 29)).toBe(true);
        restored.undo(pixels);
        expect(pixels.every((byte) => byte === 0)).toBe(true);
        restored.redo(pixels);
        expect(pixels.slice(1028, 1032)).toEqual(new Uint8ClampedArray([42, 0, 0, 255]));
        expect(pixels[4]).toBe(0);
    });

    it('respects smaller instance budgets and rejects oversized imports before decoding', () => {
        const pixels = new Uint8ClampedArray(4);
        const history = new PatternHistory();
        history.push(paint(pixels, 1));
        history.push(paint(pixels, 2));
        const snapshot = history.capture(pixels, 1, 1)!;
        expect(new PatternHistory({ byteBudget: 12 }).restore(snapshot, pixels, 1, 1)).toBe(false);
        expect(new PatternHistory({ maxSteps: 1 }).restore(snapshot, pixels, 1, 1)).toBe(false);

        const tooMany = copySnapshot(snapshot);
        tooMany.undo = Array(PATTERN_HISTORY_MAX_STEPS + 1).fill(tooMany.undo[0]);
        expect(new PatternHistory({ maxSteps: 999 }).restore(tooMany, pixels, 1, 1)).toBe(false);

        // A bounded-size string advertises too many repeated full-pattern patches.
        const largePixels = new Uint8ClampedArray(1140 * 1140 * 4);
        const count = largePixels.length / 4;
        const oversizedPatch = {
            count,
            indices: 'A'.repeat(Math.ceil(count * 4 / 3) * 4),
            before: 'A'.repeat(Math.ceil(count * 4 / 3) * 4),
            after: 'A'.repeat(Math.ceil(count * 4 / 3) * 4),
        };
        const oversized: PatternHistorySnapshot = {
            version: 1,
            width: 1140,
            height: 1140,
            data: 'A'.repeat(Math.ceil(largePixels.length / 3) * 4),
            undo: Array(3).fill(oversizedPatch),
            redo: [],
        };
        expect(count * 12 * 3).toBeGreaterThan(PATTERN_HISTORY_MAX_BYTES);
        expect(new PatternHistory({ byteBudget: PATTERN_HISTORY_MAX_BYTES * 2 }).restore(oversized, largePixels, 1140, 1140)).toBe(false);
    });

    it('rejects internally corrupted histories rather than transferring a misleading undo flag', () => {
        const pixels = new Uint8ClampedArray(4);
        const history = new PatternHistory();
        const patch = paint(pixels, 1)!;
        history.push(patch);
        patch.after[0] = 99;
        expect(history.canUndo).toBe(true);
        expect(history.capture(pixels, 1, 1)).toBeNull();
    });

    it('bounds captures even when an instance allows more than the language transfer limits', () => {
        const pixels = new Uint8ClampedArray(4);
        const history = new PatternHistory({ maxSteps: 999 });
        for (let red = 1; red <= PATTERN_HISTORY_MAX_STEPS + 1; red += 1) {
            history.push(paint(pixels, red));
        }
        expect(history.capture(pixels, 1, 1)).toBeNull();
        expect(history.canUndo).toBe(true);
        history.undo(pixels);
        expect(pixels[0]).toBe(200);
    });
});

describe('updatePatternUsage', () => {
    it('matches full recounts across palette duplicates, alpha, unknown pixels and shared refs', () => {
        const firstRed = createEntry('red', new Color(255, 0, 0, 255));
        firstRed.enabled = false; // computeUsage counts existing pixels even for disabled entries.
        const palettes = [
            new Palette('first', [
                firstRed,
                createEntry('transparent', new Color(0, 0, 0, 0)),
                createEntry('faint-red', new Color(255, 0, 0, 128)),
                createEntry('shared', new Color(1, 2, 3, 255)),
                createEntry('shared', new Color(4, 5, 6, 255)),
            ]),
            new Palette('second', [
                createEntry('duplicate-red', new Color(255, 0, 0, 255)),
                createEntry('blue', new Color(0, 0, 255, 255)),
            ]),
        ];
        const before = new Uint8ClampedArray([
            255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 0, 0,
            255, 0, 0, 128, 9, 9, 9, 255, 1, 2, 3, 255,
        ]);
        const after = new Uint8ClampedArray([
            0, 0, 255, 255, 9, 9, 9, 255, 255, 0, 0, 128,
            0, 0, 0, 0, 0, 0, 255, 255, 4, 5, 6, 255,
        ]);
        const patch = createPatternPatch(before, after)!;
        const initialUsage = computeUsage(before, palettes);
        const nextUsage = updatePatternUsage(initialUsage, palettes, patch, 'redo');

        expect(nextUsage).toEqual(computeUsage(after, palettes));
        expect(initialUsage).toEqual(computeUsage(before, palettes));
        expect(nextUsage.has('red')).toBe(false);
        expect(nextUsage.has('duplicate-red')).toBe(false);
        expect(nextUsage.get('transparent')).toBe(1);
        expect(updatePatternUsage(nextUsage, palettes, patch, 'undo'))
            .toEqual(initialUsage);
    });
});

describe('getPatternLinePoints', () => {
    it.each([
        [{ x: 1, y: 1 }, { x: 1, y: 1 }],
        [{ x: 0, y: 0 }, { x: 8, y: 0 }],
        [{ x: 2, y: 8 }, { x: 2, y: 0 }],
        [{ x: 0, y: 0 }, { x: 8, y: 8 }],
        [{ x: 8, y: 1 }, { x: 0, y: 6 }],
        [{ x: 3, y: 9 }, { x: 1, y: 0 }],
    ])('joins %j to %j with one contiguous line', (from, to) => {
        const points = getPatternLinePoints(from, to);
        expect(points[0]).toEqual(from);
        expect(points.at(-1)).toEqual(to);
        expect(points.length).toBe(Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) + 1);
        for (let index = 1; index < points.length; index += 1) {
            expect(Math.abs(points[index].x - points[index - 1].x)).toBeLessThanOrEqual(1);
            expect(Math.abs(points[index].y - points[index - 1].y)).toBeLessThanOrEqual(1);
            expect(points[index]).not.toEqual(points[index - 1]);
        }
    });

    it('rejects fractional or non-finite points', () => {
        expect(getPatternLinePoints({ x: 0, y: 0 }, { x: 1.5, y: 2 })).toEqual([]);
        expect(getPatternLinePoints({ x: NaN, y: 0 }, { x: 1, y: 2 })).toEqual([]);
    });
});

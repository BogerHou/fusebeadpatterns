import { describe, expect, it } from 'vitest';

import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { computeUsage } from '../core/utils/utils';
import {
    applyPatternPatch,
    createPatternPatch,
    getPatternLinePoints,
    PatternHistory,
    PatternStroke,
    updatePatternUsage,
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

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { computeUsage, countBeads } from '../core/utils/utils';
import { decodeEditorPatternDraft, parseEditorProject } from './draft';
import { getBoardMaterials, getBoardSummaries, type BoardSelection } from './board-materials';

function entry(ref: string, r: number, g = 0, b = 0, enabled = true) {
    const value = new PaletteEntry(ref, new Color(r, g, b, 255));
    value.ref = ref; value.enabled = enabled;
    return value;
}

describe('exact board materials', () => {
    it.each([29, 57, 50])('slices %i-cell boards without transposing asymmetric layouts', size => {
        for (const [wide, tall] of [[2, 3], [3, 2]]) {
            const entries = Array.from({ length: wide * tall }, (_, i) => entry(`C${i}`, i + 1));
            const palettes = [new Palette('Test', entries)];
            const pixels = new Uint8ClampedArray(size * size * wide * tall * 4);
            const width = size * wide;
            entries.forEach((color, i) => {
                const row = Math.floor(i / wide), column = i % wide;
                for (let j = 0; j <= i; j++) pixels.set([color.color.r, 0, 0, 255], ((row * size + j) * width + column * size + size - 1) * 4);
            });
            const original = pixels.slice();
            const summary = getBoardSummaries(pixels, palettes, size, wide, tall);
            expect(summary).toEqual(entries.map((_, i) => ({ row: Math.floor(i / wide), column: i % wide, beadCount: i + 1, colorCount: 1 })));
            const combined = new Map<string, number>();
            for (let row = 0; row < tall; row++) for (let column = 0; column < wide; column++) {
                const id = row * wide + column;
                const result = getBoardMaterials(pixels, palettes, size, wide, tall, { row, column });
                expect(result.bounds).toEqual({ x: column * size, y: row * size, width: size, height: size });
                expect(result.globalRows).toEqual({ from: row * size + 1, to: (row + 1) * size });
                expect(result.globalColumns).toEqual({ from: column * size + 1, to: (column + 1) * size });
                expect(result.usage).toEqual(new Map([[`C${id}`, id + 1]]));
                expect(result.beadCount).toBe(id + 1);
                for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
                    expect([...result.pixels.subarray((y * size + x) * 4, (y * size + x) * 4 + 4)])
                        .toEqual(x === size - 1 && y <= id ? [id + 1, 0, 0, 255] : [0, 0, 0, 0]);
                }
                result.usage.forEach((count, ref) => combined.set(ref, (combined.get(ref) ?? 0) + count));
                result.pixels.fill(0); result.selection.row = 999;
            }
            expect(pixels).toEqual(original);
            expect(combined).toEqual(computeUsage(pixels, palettes));
            expect(summary.reduce((sum, board) => sum + board.beadCount, 0)).toBe(countBeads(combined));
        }
    });

    it('preserves disabled-only colors, enabled duplicate preference, transparent RGB and unmatched semantics', () => {
        const disabled = entry('D', 1, 0, 0, false), duplicate = entry('E', 1), other = entry('F', 2, 0, 0, false);
        const palettes = [new Palette('Test', [disabled, duplicate, other])];
        const pixels = new Uint8ClampedArray(29 * 29 * 2 * 4);
        pixels.set([1, 0, 0, 255, 2, 0, 0, 255, 1, 0, 0, 0, 100, 2, 3, 255]);
        const first = getBoardMaterials(pixels, palettes, 29, 2, 1, { row: 0, column: 0 });
        expect(first.usage).toEqual(new Map([['E', 1], ['F', 1]]));
        expect(first.pixels.slice(8, 16)).toEqual(new Uint8ClampedArray([1, 0, 0, 0, 100, 2, 3, 255]));
        const empty = getBoardMaterials(pixels, palettes, 29, 2, 1, { row: 0, column: 1 });
        expect(empty.beadCount).toBe(0); expect(empty.usage.size).toBe(0);
        expect(getBoardSummaries(pixels, palettes, 29, 2, 1)).toEqual([
            { row: 0, column: 0, beadCount: 2, colorCount: 2 }, { row: 0, column: 1, beadCount: 0, colorCount: 0 },
        ]);
    });

    it('matches independently recorded counts for all four published landscape boards', () => {
        const draft = parseEditorProject(readFileSync('public/patterns/original-sunset-mountain-lake/pattern.bead-pattern.json', 'utf8'))!;
        const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
        const expected = [
            { '6683b7': 183, '684b86': 7, af9fce: 156, dd595b: 165, e9e290: 9, fbb146: 104 },
            { '6683b7': 135, af9fce: 156, dd595b: 149, e9e290: 116, fbb146: 68 },
            { '2f3c55': 284, '6683b7': 141, '684b86': 135, '96d1d4': 64 },
            { '2f3c55': 90, '6683b7': 277, '684b86': 142, '96d1d4': 28, dd595b: 22, e9e290: 13, fbb146: 52 },
        ];
        const entries = draft.activePalettes.flatMap(palette => palette.entries);
        const refs = new Map(entries.map(color => [color.ref, [color.color.r, color.color.g, color.color.b].map(value => value.toString(16).padStart(2, '0')).join('')]));
        for (let i = 0; i < 4; i++) {
            const result = getBoardMaterials(pixels, draft.activePalettes, 29, 2, 2, { row: Math.floor(i / 2), column: i % 2 });
            expect(result.beadCount).toBe(624);
            expect(Object.fromEntries([...result.usage].map(([ref, value]) => [refs.get(ref), value]))).toEqual(expected[i]);
        }
        expect(getBoardSummaries(pixels, draft.activePalettes, 29, 2, 2).reduce((sum, value) => sum + value.beadCount, 0)).toBe(2496);
    });

    it.each([null, false, {}, [], { row: -1, column: 0 }, { row: 0.5, column: 0 }, { row: 0, column: NaN }, { row: 1, column: 0 }, { row: 0, column: 2 }, { row: '0', column: 0 }])('rejects invalid selection %j', selection => {
        expect(() => getBoardMaterials(new Uint8ClampedArray(29 ** 2 * 2 * 4), [], 29, 2, 1, selection as BoardSelection)).toThrow('Invalid board selection.');
    });
    it.each([[28, 1, 1], [29, 0, 1], [29, 1.5, 1], [29, 21, 1], [29, 1, Infinity]])('rejects invalid dimensions %j', (size, wide, tall) => {
        expect(() => getBoardSummaries(new Uint8ClampedArray(29 ** 2 * 4), [], size, wide, tall)).toThrow('Invalid board pattern');
    });
    it('rejects incomplete or wrongly typed pixel buffers before allocating board summaries', () => {
        for (const pixels of [new Uint8ClampedArray(29 ** 2 * 4 - 1), new Uint8Array(29 ** 2 * 4), null]) {
            expect(() => getBoardSummaries(pixels as Uint8ClampedArray, [], 29, 1, 1)).toThrow('Invalid board pattern');
        }
    });
});

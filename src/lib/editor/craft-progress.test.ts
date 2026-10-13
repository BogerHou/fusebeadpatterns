import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import {
    CRAFT_PROGRESS_MAX_FILE_BYTES, CRAFT_PROGRESS_MAX_POSITIONS, CraftProgressError,
    craftPatternId, createCraftMarks, exportCraftProgress, getCraftColorKey,
    getCraftSummary, importCraftProgress, setCraftCells, snapshotCraftPattern, validateCraftPattern,
    type CraftPattern,
} from './craft-progress';

function entry(ref: string, r: number, g: number, b: number, a = 255): PaletteEntry {
    const item = new PaletteEntry(`Color ${ref}`, new Color(r, g, b, a));
    item.ref = ref; item.prefix = 'P'; item.symbol = ref;
    return item;
}
function pattern(width = 58, height = 87, boardSize = 29): CraftPattern {
    return { width, height, boardSize, pixels: new Uint8ClampedArray(width * height * 4),
        paletteIds: ['perler'], palettes: [new Palette('Perler', [entry('P01', 10, 20, 30), entry('P02', 200, 110, 40)])] };
}
function put(p: CraftPattern, x: number, y: number, color: number[]): number {
    const index = y * p.width + x;
    p.pixels.set(color, index * 4);
    return index;
}
function example(): { p: CraftPattern; indices: number[] } {
    const p = pattern();
    // Deliberately unequal counts in all six boards and both sides of seams.
    const cells = [[0, 0], [28, 28], [29, 0], [57, 28], [29, 28], [0, 29], [29, 29], [57, 57], [0, 58], [28, 86], [57, 86]];
    const indices = cells.map(([x, y], i) => put(p, x, y, i % 2 ? [200, 110, 40, 255] : [10, 20, 30, 255]));
    put(p, 1, 1, [123, 45, 67, 0]);
    return { p, indices };
}
const ID = 'a'.repeat(64);
function mutateFile(raw: string, update: (file: Record<string, unknown>) => void): string {
    const file = JSON.parse(raw); update(file); return JSON.stringify(file);
}

describe('craft progress: independent geometry and material counts', () => {
    it('keeps asymmetric 2×3 board coordinates, color subtotals and RGBA independent from marks', () => {
        const { p, indices } = example(), before = p.pixels.slice(), initial = createCraftMarks(p);
        const marks = setCraftCells(p, initial, [indices[0], indices[2], indices[5], indices[10], p.width + 1], true);
        expect(Buffer.from(initial).some(value => value !== 0)).toBe(false);
        expect(Buffer.from(p.pixels)).toEqual(Buffer.from(before));
        const result = getCraftSummary(p, marks);
        expect([result.total, result.completed, result.remaining]).toEqual([11, 4, 7]);
        expect(result.bounds).toEqual({ x: 0, y: 0, width: 58, height: 87 });
        expect(result.boards).toEqual([
            { row: 0, column: 0, total: 2, completed: 1, remaining: 1 },
            { row: 0, column: 1, total: 3, completed: 1, remaining: 2 },
            { row: 1, column: 0, total: 1, completed: 1, remaining: 0 },
            { row: 1, column: 1, total: 2, completed: 0, remaining: 2 },
            { row: 2, column: 0, total: 2, completed: 0, remaining: 2 },
            { row: 2, column: 1, total: 1, completed: 1, remaining: 0 },
        ]);
        expect(result.colors.map(c => [c.key, c.ref, c.total, c.completed, c.remaining])).toEqual([
            ['10,20,30', 'P01', 6, 3, 3], ['200,110,40', 'P02', 5, 1, 4],
        ]);
        expect(result.boards.reduce((sum, b) => sum + b.completed, 0)).toBe(result.completed);
        expect(result.colors.reduce((sum, c) => sum + c.remaining, 0)).toBe(result.remaining);
        const scoped = getCraftSummary(p, marks, { board: { row: 0, column: 1 }, colorKey: '10,20,30' });
        expect([scoped.total, scoped.completed, scoped.remaining]).toEqual([2, 1, 1]);
        expect(scoped.bounds).toEqual({ x: 29, y: 0, width: 29, height: 29 });
        expect(scoped.boards).toEqual([{ row: 0, column: 1, total: 2, completed: 1, remaining: 1 }]);
        expect(scoped.colors).toHaveLength(1);
        expect(getCraftSummary(p, marks, { colorKey: '0,0,0' }).total).toBe(0);
        expect(setCraftCells(p, marks, [indices[0], indices[0]], false)[indices[0]]).toBe(0);
        expect(marks[indices[0]]).toBe(1);
    });

    it.each([29, 57, 50])('uses %i-size boards, preserves empty boards and counts nonzero alpha', boardSize => {
        const p = pattern(boardSize * 2, boardSize, boardSize);
        const index = put(p, boardSize, boardSize - 1, [9, 8, 7, 1]);
        const marks = setCraftCells(p, createCraftMarks(p), [index], true);
        const summary = getCraftSummary(p, marks);
        expect(summary.boards).toEqual([
            { row: 0, column: 0, total: 0, completed: 0, remaining: 0 },
            { row: 0, column: 1, total: 1, completed: 1, remaining: 0 },
        ]);
        expect(summary.colors[0]).toEqual({ key: '9,8,7', r: 9, g: 8, b: 7,
            name: null, ref: null, prefix: null, total: 1, completed: 1, remaining: 0 });
        expect(getCraftSummary(p, marks, { board: { row: 0, column: 0 } }).colors).toEqual([]);
    });

    it('does not invent a material when identical RGB is ambiguous or alpha has no exact palette entry', () => {
        const p = pattern(29, 29);
        put(p, 0, 0, [10, 20, 30, 255]);
        p.palettes[0].entries[0].enabled = false;
        expect(getCraftSummary(p, createCraftMarks(p)).colors[0].ref).toBe('P01');
        p.palettes[0].entries.push(entry('P99', 10, 20, 30));
        expect(getCraftSummary(p, createCraftMarks(p)).colors[0].ref).toBeNull();
        p.palettes[0].entries.pop();
        put(p, 1, 0, [10, 20, 30, 128]);
        const color = getCraftSummary(p, createCraftMarks(p)).colors[0];
        expect(color.total).toBe(2); expect(color.name).toBeNull(); expect(color.ref).toBeNull();
    });

    it('counts 21,025 distinct RGB colors without a per-color result when includeColors is false', () => {
        const p = pattern(145, 145), marks = createCraftMarks(p);
        for (let index = 0; index < marks.length; index++) {
            p.pixels.set([index % 256, Math.floor(index / 256), 0, 255], index * 4);
            marks[index] = index % 13 === 0 ? 1 : 0;
        }
        const summary = getCraftSummary(p, marks, { includeColors: false });
        expect([summary.total, summary.completed, summary.remaining]).toEqual([21025, 1618, 19407]);
        expect(summary.colors).toEqual([]);
        expect(summary.boards).toHaveLength(25);
        expect(summary.boards.every(board => board.total === 841)).toBe(true);
        expect(summary.boards.reduce((sum, board) => sum + board.completed, 0)).toBe(1618);
        expect(summary.bounds).toEqual({ x: 0, y: 0, width: 145, height: 145 });
        const filtered = getCraftSummary(p, marks, { board: { row: 0, column: 0 }, colorKey: '13,0,0', includeColors: false });
        expect([filtered.total, filtered.completed, filtered.remaining]).toEqual([1, 1, 0]);
        expect(filtered.colors).toEqual([]);
        expect(filtered.boards).toEqual([{ row: 0, column: 0, total: 1, completed: 1, remaining: 0 }]);
        const { p: old } = example(), initial = createCraftMarks(old);
        expect(getCraftSummary(old, initial, { includeColors: true })).toEqual(getCraftSummary(old, initial));
        expect(getCraftSummary(old, initial).colors).toHaveLength(2);
        expect(() => getCraftSummary(old, initial, { includeColors: null })).toThrow(CraftProgressError);
    });

    it('rejects invalid layout, channels in material data, budgets and malformed scopes before returning anything', () => {
        const p = pattern(), marks = createCraftMarks(p);
        for (const bad of [{ width: 0 }, { width: 30 }, { height: NaN }, { boardSize: 1 },
            { width: 29 * 21 }, { pixels: new Uint8ClampedArray(3) }, { paletteIds: ['perler', 'perler'] }]) {
            expect(() => createCraftMarks({ ...p, ...bad })).toThrow(CraftProgressError);
        }
        expect(() => validateCraftPattern(pattern(1197, 1140, 57))).toThrow(CraftProgressError);
        const tooMany = snapshotCraftPattern(p); tooMany.palettes[0].entries = Array(4097).fill(entry('P1', 0, 0, 0));
        expect(() => validateCraftPattern(tooMany)).toThrow(CraftProgressError);
        const invalid = snapshotCraftPattern(p); invalid.palettes[0].entries[0].color.r = 256;
        expect(() => validateCraftPattern(invalid)).toThrow(CraftProgressError);
        for (const board of [{ row: 3, column: 0 }, { row: -1, column: 0 }, { row: 0.5, column: 1 }]) {
            expect(() => getCraftSummary(p, marks, { board })).toThrow(CraftProgressError);
        }
        for (const colorKey of ['1,2', '01,2,3', '1,2,256', '1,2,NaN', ' 1,2,3']) {
            expect(() => getCraftSummary(p, marks, { colorKey })).toThrow(CraftProgressError);
        }
        expect(getCraftColorKey(0, 128, 255)).toBe('0,128,255');
        expect(() => getCraftColorKey(0, -1, 255)).toThrow(CraftProgressError);
    });

    it('rejects late invalid edits, malformed or empty-cell marks atomically, with a finite iterator budget', () => {
        const { p, indices } = example(), marks = createCraftMarks(p);
        for (const bad of [-1, 0.5, NaN, Infinity, p.width * p.height]) {
            expect(() => setCraftCells(p, marks, [indices[0], bad], true)).toThrow(CraftProgressError);
            expect(marks[indices[0]]).toBe(0);
        }
        const badMarks = marks.slice(); badMarks[indices[0]] = 2;
        expect(() => getCraftSummary(p, badMarks)).toThrow(CraftProgressError);
        badMarks[indices[0]] = 0; badMarks[1] = 1;
        expect(() => setCraftCells(p, badMarks, [], false)).toThrow(CraftProgressError);
        expect(() => getCraftSummary(p, new Uint8Array(0))).toThrow(CraftProgressError);
        let seen = 0;
        function* repeated() { while (true) { seen++; yield indices[0]; } }
        expect(() => setCraftCells(p, marks, repeated(), true)).toThrow(CraftProgressError);
        expect(seen).toBe(CRAFT_PROGRESS_MAX_POSITIONS + 1);
        expect(marks[indices[0]]).toBe(0);
    });
});

describe('craft progress identity and detached snapshots', () => {
    it('matches an independent SHA-256 byte-format oracle', async () => {
        const p = pattern(29, 29); put(p, 2, 3, [10, 20, 30, 255]); put(p, 0, 0, [6, 7, 8, 0]);
        const header = Buffer.from(JSON.stringify({ type: 'fuse-bead-craft-pattern', version: 1, width: 29, height: 29, boardSize: 29,
            paletteIds: ['perler'], mappings: ['["P","P01",10,20,30,255]', '["P","P02",200,110,40,255]'] }));
        const length = Buffer.alloc(4); length.writeUInt32BE(header.length);
        const pixels = Buffer.alloc(29 * 29 * 4); pixels.set([10, 20, 30, 255], (3 * 29 + 2) * 4);
        const expected = createHash('sha256').update(length).update(header).update(pixels).digest('hex');
        expect(await craftPatternId(p)).toBe(expected);
    });

    it('ignores only display metadata, ordering, enabled flags and hidden RGB; real pattern and material changes differ', async () => {
        const { p } = example(), id = await craftPatternId(p), same = snapshotCraftPattern(p);
        same.palettes[0].name = '本語名'; same.palettes[0].entries.reverse();
        for (const e of same.palettes[0].entries) { e.name = '色'; e.symbol = 'あ'; e.enabled = false; }
        put(same, 1, 1, [200, 1, 2, 0]);
        expect(await craftPatternId(same)).toBe(id);
        const changes: Array<(value: CraftPattern) => void> = [
            v => { v.paletteIds = ['hama']; }, v => { v.palettes[0].entries[0].ref = 'changed'; },
            v => { v.palettes[0].entries[0].prefix = 'H'; }, v => { v.palettes[0].entries[0].color.r++; },
            v => { v.pixels[0]++; }, v => { v.pixels[3] = 128; }, v => { v.width = 87; v.height = 58; },
        ];
        for (const change of changes) { const next = snapshotCraftPattern(p); change(next); expect(await craftPatternId(next)).not.toBe(id); }
        expect(p.palettes[0].entries[0].name).toBe('Color P01');
    });

    it('keeps stable multi-brand identity when palette and material ordering change', async () => {
        const p = pattern(29, 29);
        const hama = entry('H01', 255, 255, 255); hama.prefix = 'H';
        p.palettes.push(new Palette('Hama', [hama])); p.paletteIds.push('hama');
        const id = await craftPatternId(p);
        p.palettes.reverse(); p.paletteIds.reverse();
        p.palettes[1].entries.reverse();
        expect(await craftPatternId(p)).toBe(id);
    });

    it('snapshots palette objects and pixels before asynchronous hashing', async () => {
        const { p } = example(), original = snapshotCraftPattern(p), expected = await craftPatternId(original);
        const pending = craftPatternId(p);
        p.pixels.fill(0); p.paletteIds[0] = 'other'; p.palettes[0].entries[0].color.r = 8;
        expect(await pending).toBe(expected);
        expect(original.pixels[3]).toBe(255); expect(original.paletteIds).toEqual(['perler']);
        expect(original.palettes[0].entries[0].color.r).toBe(10);
    });
});

describe('bounded craft progress file', () => {
    it('uses a bitset with exact independent bit positions and contains no image or filename', () => {
        const p = pattern(29, 29);
        for (const index of [0, 7, 8, 840]) put(p, index % 29, Math.floor(index / 29), [10, 20, 30, 255]);
        const marks = setCraftCells(p, createCraftMarks(p), [0, 7, 8, 840], true);
        const raw = exportCraftProgress(ID, p, marks), file = JSON.parse(raw);
        expect(Object.keys(file).sort()).toEqual(['boardSize', 'height', 'marks', 'signature', 'type', 'version', 'width']);
        expect([file.type, file.version, file.width, file.height, file.boardSize, file.signature]).toEqual(['fuse-bead-craft-progress', 1, 29, 29, 29, ID]);
        const packed = Buffer.from(file.marks, 'base64');
        expect(packed.length).toBe(106);
        expect([...packed.subarray(0, 2)]).toEqual([129, 1]); expect(packed[105]).toBe(1);
        expect(packed.subarray(2, 105).every(value => value === 0)).toBe(true);
        expect(Buffer.from(importCraftProgress(raw, ID, p))).toEqual(Buffer.from(marks));
    });

    it('strictly rejects mismatch, extra fields, unused bits, noncanonical base64 and marked empty positions', () => {
        const p = pattern(29, 29); put(p, 0, 0, [10, 20, 30, 255]);
        const raw = exportCraftProgress(ID, p, createCraftMarks(p));
        const mutations: Array<(file: Record<string, unknown>) => void> = [
            f => { f.signature = 'b'.repeat(64); }, f => { f.width = 58; }, f => { f.boardSize = 50; },
            f => { f.filename = 'private.png'; }, f => { f.version = 2; }, f => { f.type = 'other'; },
            f => { f.marks = ''; }, f => { f.marks = (f.marks as string).replace(/AA==$/, 'AB=='); },
            f => { const bits = Buffer.from(f.marks as string, 'base64'); bits[105] = 128; f.marks = bits.toString('base64'); },
            f => { const bits = Buffer.from(f.marks as string, 'base64'); bits[0] = 2; f.marks = bits.toString('base64'); },
        ];
        for (const mutate of mutations) expect(() => importCraftProgress(mutateFile(raw, mutate), ID, p)).toThrow(CraftProgressError);
        for (const malformed of ['null', '[]', '{', ' '.repeat(CRAFT_PROGRESS_MAX_FILE_BYTES + 1), '界'.repeat(800000)]) {
            expect(() => importCraftProgress(malformed, ID, p)).toThrow(CraftProgressError);
        }
        expect(() => exportCraftProgress('invalid', p, createCraftMarks(p))).toThrow(CraftProgressError);
        expect(() => importCraftProgress(raw, 'invalid', p)).toThrow(CraftProgressError);
        expect(p.pixels[3]).toBe(255);
    });

    it('round-trips the existing maximum 20×20 Mini-board layout without unbounded JSON arrays', () => {
        const p = pattern(1140, 1140, 57);
        expect(p.width * p.height).toBe(CRAFT_PROGRESS_MAX_POSITIONS);
        put(p, 1139, 1139, [10, 20, 30, 255]);
        const marks = setCraftCells(p, createCraftMarks(p), [1299599], true);
        const raw = exportCraftProgress(ID, p, marks);
        expect(Buffer.byteLength(raw)).toBeLessThan(220000);
        const restored = importCraftProgress(raw, ID, p);
        expect(Buffer.from(restored)).toEqual(Buffer.from(marks));
        expect(getCraftSummary(p, restored, { board: { row: 19, column: 19 } }).completed).toBe(1);
    });
});

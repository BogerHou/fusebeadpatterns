import { describe, expect, it } from 'vitest';
import { createGrid, GridHistory, parseProject, serializeProject } from './core';
import { PixelGridError } from './errors';
import type { PixelLocaleSnapshot } from './locale-navigation';
import { MAX_PIXEL_WORKSPACE_PROJECT_BYTES, parsePixelWorkspaceProject, serializePixelWorkspaceProject } from './workspace-project';

const print = { paper: 'letter', mode: 'tiled', content: 'blank' } as const;

function fixture(): PixelLocaleSnapshot {
    const before = createGrid(2, 1, [14, 28, 42, 0, 5, 6, 7, 127]);
    const current = createGrid(2, 1, [14, 28, 42, 0, 50, 60, 70, 1]);
    const future = createGrid(1, 2, [88, 99, 100, 64, 4, 5, 6, 255]);
    const history = new GridHistory(50);
    history.push(before, current); history.push(current, future);
    const grid = history.undo(future)!;
    return {
        grid, saved: createGrid(1, 1, [99, 80, 70, 0]),
        source: { width: 3, height: 1, pixels: new Uint8ClampedArray([120, 33, 88, 0, 40, 80, 120, 1, 77, 88, 99, 255]), name: '元画像🐈.png' },
        history: history.snapshot(), width: '', height: '1e-', mode: 'crop', tool: 'picker',
        color: '#AbCdEf', alpha: 0, zoom: '24', showGrid: false, colorLimit: 16,
        exportScale: 4, cursor: [1, 0], settingsExpanded: true,
    };
}

function encoded() { return JSON.parse(serializePixelWorkspaceProject(fixture(), print)); }
function code(operation: () => unknown, expected: string) {
    try { operation(); throw new Error('Expected validation failure'); }
    catch (error) {
        expect(error).toBeInstanceOf(PixelGridError);
        expect((error as PixelGridError).code).toBe(expected);
    }
}

describe('complete pixel workspace project', () => {
    it('roundtrips original hidden RGBA, independent saved baseline, both history branches and every pending setting', () => {
        const snapshot = fixture();
        const before = structuredClone(snapshot);
        const raw = serializePixelWorkspaceProject(snapshot, print);
        const restored = parsePixelWorkspaceProject(raw);
        expect(Object.keys(JSON.parse(raw))).toEqual(['format', 'version', 'snapshot', 'print']);
        expect(restored).toEqual({ format: 'pixel-grid-workspace', version: 1, snapshot, print });
        expect(snapshot).toEqual(before); // Codec never applies the UI's checkpoint policy.
        expect(restored.snapshot.saved.width).toBe(1);
        const history = new GridHistory(50); history.restore(restored.snapshot.history);
        const previous = history.undo(restored.snapshot.grid)!;
        expect([...previous.pixels]).toEqual([14, 28, 42, 0, 5, 6, 7, 127]);
        expect(history.redo(previous)).toEqual(restored.snapshot.grid);
        const future = history.redo(restored.snapshot.grid)!;
        expect([future.width, future.height]).toEqual([1, 2]);
        expect([...future.pixels]).toEqual([88, 99, 100, 64, 4, 5, 6, 255]);
    });

    it('returns independent owned data for all frames, source, cursor and print fields', () => {
        const input = fixture();
        const raw = serializePixelWorkspaceProject(input, print);
        const one = parsePixelWorkspaceProject(raw), two = parsePixelWorkspaceProject(raw);
        expect(one.snapshot.grid.pixels).not.toBe(input.grid.pixels);
        one.snapshot.grid.pixels.fill(1); one.snapshot.saved.pixels.fill(2);
        (one.snapshot.source!.pixels as Uint8ClampedArray).fill(3);
        one.snapshot.history.undo[0].pixels.fill(4); one.snapshot.history.redo[0].pixels.fill(5);
        Reflect.set(one.snapshot.cursor, 0, 0);
        (one.print as { paper: string }).paper = 'a4';
        expect(two).toEqual(parsePixelWorkspaceProject(raw));
        expect(input).toEqual(fixture());
        expect(two.snapshot.grid.pixels).not.toBe(two.snapshot.saved.pixels);
    });

    it('accepts the full 50-step history and source-axis limit without collapsing or trimming state', () => {
        const snapshot = fixture();
        snapshot.history = { undo: Array.from({ length: 25 }, (_, n) => createGrid(1, 1, [n, 2, 3, n])), redo: Array.from({ length: 25 }, (_, n) => createGrid(1, 1, [n + 25, 4, 5, 255 - n])) };
        snapshot.source = { width: 2048, height: 1, name: 'wide.png', pixels: new Uint8Array(2048 * 4).fill(71) };
        snapshot.grid = createGrid(128, 128); snapshot.cursor = [127, 127];
        const restored = parsePixelWorkspaceProject(serializePixelWorkspaceProject(snapshot, print));
        expect(restored.snapshot).toEqual({ ...snapshot, source: { ...snapshot.source, pixels: new Uint8ClampedArray(snapshot.source!.pixels) } });
        expect(restored.snapshot.history.undo).toHaveLength(25);
        expect(restored.snapshot.history.redo).toHaveLength(25);
    });

    it.each([
        (value: ReturnType<typeof encoded>) => { value.format = 'pixel-grid-project'; },
        (value: ReturnType<typeof encoded>) => { value.format = 'bead-pattern-editor'; },
        (value: ReturnType<typeof encoded>) => { value.version = 2; },
    ])('distinguishes unsupported formats and future versions', mutate => {
        const value = encoded(); mutate(value);
        code(() => parsePixelWorkspaceProject(JSON.stringify(value)), 'WORKSPACE_UNSUPPORTED_FORMAT');
    });

    it.each([
        (value: ReturnType<typeof encoded>) => { value.extra = 'private'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.extra = 'private'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.grid.extra = 'private'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.saved.extra = 'private'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.source.extra = 'private'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.history.extra = 'private'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.history.redo[0].extra = 'private'; },
        (value: ReturnType<typeof encoded>) => { value.print.extra = 'private'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.cursor.push(0); },
        (value: ReturnType<typeof encoded>) => { Object.defineProperty(value.snapshot, '__proto__', { value: { polluted: true }, enumerable: true }); },
        (value: ReturnType<typeof encoded>) => { delete value.snapshot.saved; },
    ])('rejects extra/prototype fields and missing structure instead of silently losing it', mutate => {
        const value = encoded(); mutate(value);
        code(() => parsePixelWorkspaceProject(JSON.stringify(value)), 'WORKSPACE_INVALID');
        expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    });

    it.each([
        (value: ReturnType<typeof encoded>) => { value.snapshot.grid.pixels = 'AAAA'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.source.width = 2049; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.grid.width = 129; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.history.undo = Array.from({ length: 51 }, () => value.snapshot.grid); },
        (value: ReturnType<typeof encoded>) => { value.snapshot.cursor = [2, 0]; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.alpha = 256; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.tool = 'constructor'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.width = 'x'.repeat(65); },
        (value: ReturnType<typeof encoded>) => { value.snapshot.source.name = 'x'.repeat(4097); },
        (value: ReturnType<typeof encoded>) => { value.print.paper = 'a3'; },
        (value: ReturnType<typeof encoded>) => { value.print.mode = 'poster'; },
        (value: ReturnType<typeof encoded>) => { value.print.content = 'original'; },
        (value: ReturnType<typeof encoded>) => { value.snapshot.grid.pixels = value.snapshot.grid.pixels.slice(0, -1) + '!'; },
    ])('maps damaged data and invalid print/settings/history to one stable validation error', mutate => {
        const value = encoded(); mutate(value);
        code(() => parsePixelWorkspaceProject(JSON.stringify(value)), 'WORKSPACE_INVALID');
    });

    it('rejects noncanonical base64 padding bits and missing array elements', () => {
        const value = encoded(); value.snapshot.saved.pixels = 'AQIDAB==';
        code(() => parsePixelWorkspaceProject(JSON.stringify(value)), 'WORKSPACE_INVALID');
        const snapshot = fixture(); delete snapshot.history.undo[0];
        code(() => serializePixelWorkspaceProject(snapshot, print), 'WORKSPACE_INVALID');
    });

    it('does not execute getters, inherited fields, toJSON methods or overridden pixel-array iterators while saving', () => {
        let calls = 0;
        const getter = fixture(); Object.defineProperty(getter, 'grid', { get() { calls++; throw new Error('Do not run'); }, enumerable: true });
        code(() => serializePixelWorkspaceProject(getter, print), 'WORKSPACE_INVALID');
        const inherited = Object.assign(Object.create({ inherited: true }), fixture());
        code(() => serializePixelWorkspaceProject(inherited, print), 'WORKSPACE_INVALID');
        const customJson = { ...fixture(), toJSON() { calls++; return {}; } };
        code(() => serializePixelWorkspaceProject(customJson, print), 'WORKSPACE_INVALID');
        const raw = fixture(); const pixels = [14, 28, 42, 0, 50, 60, 70, 1];
        pixels[Symbol.iterator] = function* () { calls++; throw new Error('Do not iterate'); };
        raw.source = { width: 2, height: 1, name: 'array.png', pixels };
        expect(parsePixelWorkspaceProject(serializePixelWorkspaceProject(raw, print)).snapshot.source!.pixels).toEqual(new Uint8ClampedArray([14, 28, 42, 0, 50, 60, 70, 1]));
        expect(calls).toBe(0);
    });

    it('rejects malformed and deeply nested payloads with stable errors, without recursive validation', () => {
        for (const raw of ['', '{', 'null', '[]']) code(() => parsePixelWorkspaceProject(raw), 'WORKSPACE_INVALID');
        const deep = '['.repeat(10000) + '0' + ']'.repeat(10000);
        code(() => parsePixelWorkspaceProject(`{"format":"pixel-grid-workspace","version":1,"snapshot":${deep},"print":{}}`), 'WORKSPACE_INVALID');
    });

    it('enforces the UTF-8 byte budget, accepts the exact bound and rejects excess Unicode bytes', () => {
        const raw = serializePixelWorkspaceProject(fixture(), print);
        const utf8 = new TextEncoder().encode(raw).length;
        const exact = raw + ' '.repeat(MAX_PIXEL_WORKSPACE_PROJECT_BYTES - utf8);
        expect(new TextEncoder().encode(exact)).toHaveLength(MAX_PIXEL_WORKSPACE_PROJECT_BYTES);
        expect(parsePixelWorkspaceProject(exact).snapshot).toEqual(fixture());
        code(() => parsePixelWorkspaceProject(exact + ' '), 'WORKSPACE_TOO_LARGE');
        // Emoji in the source name occupies more UTF-8 bytes than UTF-16 units.
        const excessiveUnicode = raw + ' '.repeat(MAX_PIXEL_WORKSPACE_PROJECT_BYTES - raw.length);
        expect(excessiveUnicode.length).toBe(MAX_PIXEL_WORKSPACE_PROJECT_BYTES);
        code(() => parsePixelWorkspaceProject(excessiveUnicode), 'WORKSPACE_TOO_LARGE');
    });

    it('keeps the old v1 wire format unchanged and refuses to misread either project type', () => {
        const grid = fixture().grid;
        const old = serializeProject(grid);
        expect(old).toBe('{"format":"pixel-grid-project","version":1,"width":2,"height":1,"pixels":[14,28,42,0,50,60,70,1]}');
        expect(parseProject(old)).toEqual(grid);
        code(() => parsePixelWorkspaceProject(old), 'WORKSPACE_UNSUPPORTED_FORMAT');
        code(() => parseProject(serializePixelWorkspaceProject(fixture(), print)), 'PROJECT_UNSUPPORTED_FORMAT');
    });
});

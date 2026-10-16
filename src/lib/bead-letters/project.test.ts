import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { decodeEditorPatternDraft, parseEditorProject, type EditorDraft } from '../editor/draft';
import { computeUsage } from '../core/utils/utils';
import { getLetterPalettes } from './data';
import { buildLetterProject, defaultLetterState, LETTER_PROJECT_MAX_BYTES, parseLetterProject, serializeLetterProject } from './project';
import { exportLetterPdf, exportLetterPng } from './export';
import type { LetterPalette, LetterState } from './types';

const printer = vi.hoisted(() => ({ createPdf: vi.fn(async () => new Uint8Array([37, 80, 68, 70])), download: vi.fn() }));
vi.mock('./pdf', () => ({ createLetterPdf: printer.createPdf }));
vi.mock('../core/printer/download', () => ({ downloadBlob: printer.download }));

const palettes = getLetterPalettes();
const fixtureColors = {
    perler: { foreground: '80-19018', background: '80-19001', black: [50, 50, 52, 255], white: [234, 239, 238, 255], board: 29, boardId: 'midi', prefix: 'P', label: 'Perler Midi' },
    hama: { foreground: 'H18', background: 'H01', black: [20, 19, 21, 255], white: [229, 236, 241, 255], board: 29, boardId: 'midi', prefix: 'H', label: 'Hama Midi' },
    artkal_s: { foreground: 'S13', background: 'S01', black: [41, 42, 43, 255], white: [234, 238, 243, 255], board: 50, boardId: 'mini_artkal', prefix: 'AS', label: 'Artkal S Mini' },
};
const I = ['11111', '00100', '00100', '00100', '00100', '00100', '11111'];
const blank = '00000';

function state(patch: Partial<LetterState> = {}): LetterState {
    return { ...defaultLetterState(palettes), text: 'I', padding: 0, ...patch };
}

// A small, independently written chart fixture, without calling the text
// layout, glyph table, palette matcher or production mask to obtain expected cells.
function rgba(rows: string[], black: number[], white: number[] | null): Uint8ClampedArray {
    return new Uint8ClampedArray(rows.flatMap(row => [...row].flatMap(cell => cell === '1' ? black : white ?? [0, 0, 0, 0])));
}

type TamperFile = {
    type: string;
    draft: EditorDraft;
    letterGenerator: { version: number; state: Record<string, unknown> };
};

function changedFile(change: (file: TamperFile) => void): string {
    const file = JSON.parse(serializeLetterProject(state(), palettes)) as TamperFile;
    change(file);
    return JSON.stringify(file);
}

describe('letter chart project and actual brand colors', () => {
    it('starts with the documented Perler black-on-white LOVE settings', () => {
        expect(defaultLetterState(palettes)).toEqual({
            text: 'LOVE', letterSpacing: 1, lineSpacing: 2, padding: 1, align: 'center',
            paletteId: 'perler', foregroundRef: '80-19018', backgroundRef: '80-19001', backgroundEnabled: true, paper: 'a4',
        });
    });

    for (const id of ['perler', 'hama', 'artkal_s'] as const) {
        const colors = fixtureColors[id];
        it(`keeps every I cell, real code and complete registry for ${id}`, () => {
            const input = state({ paletteId: id, foregroundRef: colors.foreground, backgroundRef: colors.background });
            const result = buildLetterProject(input, palettes);
            expect([result.grid.width, result.grid.height]).toEqual([5, 7]);
            expect(result.grid.pixels).toEqual(rgba(I, colors.black, colors.white));
            expect(result.usage.map(({ color, count }) => [color.ref, count])).toEqual([[colors.foreground, 15], [colors.background, 20]]);
            expect(result.draft.selectedPaletteIds).toEqual([id]);
            expect(result.draft.boardId).toBe(colors.boardId);
            expect([result.draft.boardWidth, result.draft.boardHeight]).toEqual([1, 1]);
            expect(result.draft.editedPattern).toMatchObject({ width: colors.board, height: colors.board });
            const paddedRows = [...I.map(row => row + '0'.repeat(colors.board - 5)), ...Array(colors.board - 7).fill('0'.repeat(colors.board))];
            const padded = decodeEditorPatternDraft(result.draft.editedPattern)!;
            // Source background occupies 5x7 only. Board-completion cells are
            // empty, not white beads and not an automatic centering margin.
            for (let y = 0; y < colors.board; y++) for (let x = 0; x < colors.board; x++) {
                const offset = (y * colors.board + x) * 4;
                const expected = x < 5 && y < 7
                    ? paddedRows[y][x] === '1' ? colors.black : colors.white : [0, 0, 0, 0];
                expect(Array.from(padded.subarray(offset, offset + 4))).toEqual(expected);
            }
            const original = palettes.find(palette => palette.id === id)!;
            expect(result.draft.activePalettes[0].name).toBe(colors.label);
            expect(result.draft.activePalettes[0].entries).toHaveLength(original.colors.length);
            expect(result.draft.activePalettes[0].entries.map(entry => ({
                name: entry.name, ref: entry.ref, symbol: entry.symbol, prefix: entry.prefix,
                r: entry.color.r, g: entry.color.g, b: entry.color.b,
            }))).toEqual(original.colors);
            expect(result.draft.activePalettes[0].entries.every(entry => entry.enabled && entry.prefix === colors.prefix && entry.color.a === 255)).toBe(true);
            expect(computeUsage(padded, result.draft.activePalettes)).toEqual(new Map([[colors.foreground, 15], [colors.background, 20]]));
            expect(result.draft.pdfScaleMode).toBe('fit-page');
        });

        it(`keeps transparent spaces/padding and board seams for ${id}`, () => {
            const result = buildLetterProject(state({ text: 'I I I I I', paletteId: id,
                foregroundRef: colors.foreground, backgroundRef: colors.background, backgroundEnabled: false }), palettes);
            // Five 5-cell glyphs + four 3-cell spaces + eight 1-cell gaps.
            expect([result.grid.width, result.grid.height]).toEqual([45, 7]);
            expect(result.usage.map(({ color, count }) => [color.ref, count])).toEqual([[colors.foreground, 75]]);
            const expectedRows = I.map(row => [row, row, row, row, row].join('00000'));
            expect(result.grid.pixels).toEqual(rgba(expectedRows, colors.black, null));
            expect(result.draft.editedPattern?.width).toBe(id === 'artkal_s' ? 50 : 58);
            expect(result.draft.editedPattern?.height).toBe(colors.board);
            expect(computeUsage(decodeEditorPatternDraft(result.draft.editedPattern)!, result.draft.activePalettes))
                .toEqual(new Map([[colors.foreground, 75]]));
        });
    }

    it('counts the exact rectangle including blank lines, margins and spaces only when background is on', () => {
        const rows = [blank, ...I, blank, blank, ...I, blank].map(row => '0' + row + '0');
        const result = buildLetterProject(state({ text: 'i\r\nI', padding: 1 }), palettes);
        expect([result.grid.width, result.grid.height]).toEqual([7, 18]);
        expect(result.grid.pixels).toEqual(rgba(rows, fixtureColors.perler.black, fixtureColors.perler.white));
        expect(result.usage.map(entry => entry.count)).toEqual([30, 96]);
        const clear = buildLetterProject(state({ text: 'i\r\nI', padding: 1, backgroundEnabled: false }), palettes);
        expect(clear.grid.pixels).toEqual(rgba(rows, fixtureColors.perler.black, null));
        expect(clear.usage.map(entry => entry.count)).toEqual([30]);
    });

    it('keeps the maximum 128-column chart without clipping when brand boards add different padding', () => {
        for (const id of ['perler', 'hama', 'artkal_s'] as const) {
            const color = fixtureColors[id];
            const result = buildLetterProject(state({ text: 'I'.repeat(24), letterSpacing: 0, padding: 4,
                paletteId: id, foregroundRef: color.foreground, backgroundRef: color.background }), palettes);
            expect([result.grid.width, result.grid.height]).toEqual([128, 15]);
            expect(result.usage.map(entry => entry.count)).toEqual([360, 1560]);
            expect(result.draft.editedPattern?.width).toBe(id === 'artkal_s' ? 150 : 145);
            expect(result.draft.editedPattern?.height).toBe(color.board);
            const restored = parseLetterProject(serializeLetterProject(state({ text: 'I'.repeat(24), letterSpacing: 0, padding: 4,
                paletteId: id, foregroundRef: color.foreground, backgroundRef: color.background }), palettes), palettes);
            expect(restored.text).toBe('I'.repeat(24));
        }
    });

    it('owns its output buffers, selected colors and full saved palettes', () => {
        const input = structuredClone(palettes), original = JSON.stringify(input);
        const result = buildLetterProject(state(), input);
        expect(JSON.stringify(input)).toBe(original);
        result.palette.colors[0].name = 'changed';
        result.usage[0].color.name = 'changed';
        (result.grid.pixels as Uint8ClampedArray)[0] = 0;
        expect(JSON.stringify(input)).toBe(original);
        expect(result.draft.activePalettes[0].entries[0].name).not.toBe('changed');
        expect(decodeEditorPatternDraft(result.draft.editedPattern)!.slice(0, 4)).toEqual(new Uint8ClampedArray(fixtureColors.perler.black));
    });

    it.each([
        { paletteId: 'unknown' }, { foregroundRef: 'BLACK' }, { backgroundRef: 'WHITE' },
        { foregroundRef: 'H18' }, { backgroundEnabled: 'false' }, { paper: 'legal' },
        { letterSpacing: 1.5 }, { lineSpacing: -1 }, { padding: 5 }, { align: 'middle' },
        { text: 'JOËL' }, { text: '名前' }, { text: ' ' }, { text: 'I'.repeat(201) },
    ])('rejects invalid input without substituting colors or silently changing text: %j', patch => {
        expect(() => buildLetterProject(state(patch as Partial<LetterState>), palettes)).toThrow();
    });

    it('rejects equal foreground/background when used but permits the unused background reference', () => {
        expect(() => buildLetterProject(state({ backgroundRef: '80-19018' }), palettes)).toThrow('INVALID_COLOR');
        expect(buildLetterProject(state({ backgroundRef: '80-19018', backgroundEnabled: false }), palettes).usage[0].count).toBe(15);
    });

    it.each([
        (list: LetterPalette[]) => { list[0].boardSize = 50; },
        (list: LetterPalette[]) => { list[0].colors[0].prefix = 'H'; },
        (list: LetterPalette[]) => { list[0].colors[0].r = NaN; },
        (list: LetterPalette[]) => { list[0].colors[0].g = 256; },
        (list: LetterPalette[]) => { list[0].colors[0].b = 0.5; },
        (list: LetterPalette[]) => { list[0].colors[0].ref = list[0].colors[1].ref; },
        (list: LetterPalette[]) => { Object.assign(list[0].colors[0], { r: list[0].colors[1].r, g: list[0].colors[1].g, b: list[0].colors[1].b }); },
        (list: LetterPalette[]) => { list.push(list[0]); },
    ])('rejects mixed, ambiguous or malformed registry input', change => {
        const input = structuredClone(palettes); change(input);
        expect(() => buildLetterProject(state(), input)).toThrow('INVALID_COLOR');
    });

    it('uses actual local CSV codes, including Artkal S legacy board mapping', () => {
        for (const id of ['perler', 'hama', 'artkal_s'] as const) {
            const expected = fixtureColors[id];
            const rows = readFileSync(`public/palettes/${id}.csv`, 'utf8').trim().split(/\r?\n/).map(row => row.split(','));
            expect(rows.find(row => row[0] === expected.foreground)?.slice(3, 6).map(Number)).toEqual(expected.black.slice(0, 3));
            expect(rows.find(row => row[0] === expected.background)?.slice(3, 6).map(Number)).toEqual(expected.white.slice(0, 3));
        }
    });
});

describe('letter project compatibility and anti-loss import', () => {
    for (const id of ['perler', 'hama', 'artkal_s'] as const) for (const paper of ['a4', 'letter'] as const) {
        it(`round-trips text/settings and exact editor pixels for ${id}/${paper}`, () => {
            const color = fixtureColors[id];
            const original = state({ text: 'i i\nI', paletteId: id, foregroundRef: color.foreground,
                backgroundRef: color.background, padding: 2, align: 'right', paper });
            const raw = serializeLetterProject(original, palettes);
            const legacyDraft = parseEditorProject(raw)!;
            expect(legacyDraft).not.toBeNull();
            expect(legacyDraft.pdfPaperSize).toBe(paper);
            expect(parseLetterProject(raw, palettes)).toEqual(original);
            const regenerated = buildLetterProject(parseLetterProject(raw, palettes), palettes);
            expect(regenerated.draft).toEqual(legacyDraft);
            expect(decodeEditorPatternDraft(regenerated.draft.editedPattern)).toEqual(decodeEditorPatternDraft(legacyDraft.editedPattern));
        });
    }

    it('accepts semantic key reordering rather than requiring serialized key order', () => {
        const file = JSON.parse(serializeLetterProject(state(), palettes));
        file.draft = Object.fromEntries(Object.entries(file.draft).reverse());
        expect(parseLetterProject(JSON.stringify(file), palettes)).toEqual(state());
    });

    it.each([
        ['a different container', (file: TamperFile) => { file.type = 'pixel-grid-project'; }],
        ['missing letter metadata', (file: TamperFile) => { Reflect.deleteProperty(file, 'letterGenerator'); }],
        ['future letter version', (file: TamperFile) => { file.letterGenerator.version = 2; }],
        ['unknown text field', (file: TamperFile) => { file.letterGenerator.state.extra = true; }],
        ['stale text', (file: TamperFile) => { file.letterGenerator.state.text = 'L'; }],
        ['stale spacing', (file: TamperFile) => { file.letterGenerator.state.padding = 1; }],
        ['unknown color', (file: TamperFile) => { file.letterGenerator.state.foregroundRef = 'not-a-color'; }],
        ['wrong selected brand', (file: TamperFile) => { file.draft.selectedPaletteIds = ['hama']; }],
        ['different palette data', (file: TamperFile) => { file.draft.activePalettes[0].entries[0].color.r = 12; }],
        ['different palette code', (file: TamperFile) => { file.draft.activePalettes[0].entries[0].ref = 'fake'; }],
        ['different palette symbol', (file: TamperFile) => { file.draft.activePalettes[0].entries[0].symbol = 'fake'; }],
        ['different palette prefix', (file: TamperFile) => { file.draft.activePalettes[0].entries[0].prefix = 'H'; }],
        ['different palette enabled colors', (file: TamperFile) => { file.draft.activePalettes[0].entries[0].enabled = false; }],
        ['extra palette', (file: TamperFile) => { file.draft.activePalettes.push(file.draft.activePalettes[0]); }],
        ['different board', (file: TamperFile) => { file.draft.boardId = 'mini_artkal'; }],
        ['different board count', (file: TamperFile) => { file.draft.boardWidth = 2; }],
        ['different print paper', (file: TamperFile) => { file.draft.pdfPaperSize = 'letter'; }],
        ['different print scale', (file: TamperFile) => { file.draft.pdfScaleMode = 'midi-5mm'; }],
        ['new source image', (file: TamperFile) => { file.draft.imageSrc = 'data:image/png;base64,AAAA'; }],
        ['actual edited cell', (file: TamperFile) => { const bytes = Buffer.from(file.draft.editedPattern!.data, 'base64'); bytes[0] = 100; file.draft.editedPattern!.data = bytes.toString('base64'); }],
        ['hidden RGB on padded empty cell', (file: TamperFile) => { const bytes = Buffer.from(file.draft.editedPattern!.data, 'base64'); bytes[bytes.length - 4] = 100; file.draft.editedPattern!.data = bytes.toString('base64'); }],
    ])('rejects %s instead of losing editor changes', (_label, change) => {
        expect(() => parseLetterProject(changedFile(change), palettes)).toThrow('INVALID_PROJECT');
    });

    it('rejects malformed and oversized files before attempting regeneration', () => {
        for (const raw of ['', '{}', '[1]', '{bad', ' '.repeat(LETTER_PROJECT_MAX_BYTES + 1), 'é'.repeat(LETTER_PROJECT_MAX_BYTES / 2 + 1)]) {
            expect(() => parseLetterProject(raw, palettes)).toThrow('INVALID_PROJECT');
        }
    });
});

describe('letter export adapters', () => {
    it('does not create a PNG or generate a PDF when already aborted', async () => {
        const input = state(), result = buildLetterProject(input, palettes);
        const controller = new AbortController(); controller.abort();
        const createElement = vi.fn();
        vi.stubGlobal('document', { createElement });
        printer.createPdf.mockClear(); printer.download.mockClear();
        try {
            await expect(exportLetterPng(result, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
            await expect(exportLetterPdf(result, input, 'ja', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
            expect(createElement).not.toHaveBeenCalled();
            expect(printer.createPdf).not.toHaveBeenCalled();
            expect(printer.download).not.toHaveBeenCalled();
        } finally { vi.unstubAllGlobals(); }
    });

    it('does not download a PNG completed after its owner aborts, and releases the canvas', async () => {
        let finishEncoding: BlobCallback | undefined;
        const context = { clearRect() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} };
        const canvas = { width: 0, height: 0, getContext: () => context,
            toBlob: (callback: BlobCallback) => { finishEncoding = callback; } };
        vi.stubGlobal('document', { createElement: () => canvas }); printer.download.mockClear();
        const controller = new AbortController();
        try {
            const pending = exportLetterPng(buildLetterProject(state(), palettes), controller.signal);
            const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
            expect(finishEncoding).toBeDefined();
            controller.abort();
            finishEncoding!(new Blob(['png'], { type: 'image/png' }));
            await rejected;
            expect(printer.download).not.toHaveBeenCalled();
            expect([canvas.width, canvas.height]).toEqual([0, 0]);
        } finally { vi.unstubAllGlobals(); }
    });

    it('downloads the new logical-chart PDF while forwarding the selected paper, locale and cancellation signal', async () => {
        printer.createPdf.mockClear(); printer.download.mockClear();
        const input = state({ paletteId: 'artkal_s', foregroundRef: 'S13', backgroundRef: 'S01', paper: 'letter' });
        const result = buildLetterProject(input, palettes);
        const controller = new AbortController();
        await exportLetterPdf(result, input, 'ja', controller.signal);
        expect(printer.createPdf).toHaveBeenCalledWith(result, input, 'ja', controller.signal);
        expect(printer.download).toHaveBeenCalledWith(expect.any(Blob), 'bead-letters.pdf');
        const blob = printer.download.mock.calls[0][0] as Blob;
        expect(blob.type).toBe('application/pdf');
        expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([37, 80, 68, 70]));
    });

    it('does not download PDF bytes completed after the owning page aborts', async () => {
        let finish: ((bytes: Uint8Array<ArrayBuffer>) => void) | undefined;
        printer.createPdf.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        printer.download.mockClear();
        const input = state(), controller = new AbortController();
        const pending = exportLetterPdf(buildLetterProject(input, palettes), input, 'en', controller.signal);
        const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        controller.abort(); finish!(new Uint8Array([37, 80, 68, 70]));
        await rejected;
        expect(printer.download).not.toHaveBeenCalled();
    });

    it('clears transparent PNG interiors, draws only occupied cells, adds a grid and releases its canvas', async () => {
        const source = state({ backgroundEnabled: false });
        const result = buildLetterProject(source, palettes);
        const context = { clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), imageSmoothingEnabled: true, fillStyle: '', strokeStyle: '', lineWidth: 0 };
        const canvas = { width: 0, height: 0, getContext: vi.fn(() => context), toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' }))) };
        vi.stubGlobal('document', { createElement: vi.fn(() => canvas) });
        printer.download.mockClear();
        try {
            await exportLetterPng(result);
            expect(context.clearRect).toHaveBeenCalledWith(0, 0, 81, 113);
            expect(context.fillRect).toHaveBeenCalledTimes(15);
            expect(context.fillRect.mock.calls).toEqual([
                ...[0, 1, 2, 3, 4].map(x => [x * 16, 0, 16, 16]),
                ...[1, 2, 3, 4, 5].map(y => [32, y * 16, 16, 16]),
                ...[0, 1, 2, 3, 4].map(x => [x * 16, 96, 16, 16]),
            ]);
            expect(context.stroke).toHaveBeenCalledOnce();
            expect(printer.download).toHaveBeenCalledWith(expect.any(Blob), 'bead-letters-grid.png');
            expect([canvas.width, canvas.height]).toEqual([0, 0]);
        } finally { vi.unstubAllGlobals(); }
    });

    it('releases its PNG canvas and does not download when encoding fails', async () => {
        const context = { clearRect() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} };
        const canvas = { width: 0, height: 0, getContext: () => context, toBlob: (callback: BlobCallback) => callback(null) };
        vi.stubGlobal('document', { createElement: () => canvas }); printer.download.mockClear();
        try {
            await expect(exportLetterPng(buildLetterProject(state(), palettes))).rejects.toThrow('INVALID_PROJECT');
            expect(printer.download).not.toHaveBeenCalled();
            expect([canvas.width, canvas.height]).toEqual([0, 0]);
        } finally { vi.unstubAllGlobals(); }
    });
});

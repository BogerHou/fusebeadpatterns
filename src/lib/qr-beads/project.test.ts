import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { getLetterPalettes } from '../bead-letters/data';
import { decodeEditorPatternDraft, parseEditorProject, type EditorDraft } from '../editor/draft';
import { computeUsage } from '../core/utils/utils';
import { buildQrProject, defaultQrState, parseQrProject, QR_PROJECT_MAX_BYTES, serializeQrProject } from './project';
import type { QrPalette, QrState } from './types';

const palettes = getLetterPalettes();
const brandColors = {
    perler: { foregroundRef: '80-19018', backgroundRef: '80-19001', black: [50, 50, 52, 255], white: [234, 239, 238, 255], board: 29, boardId: 'midi', paletteName: 'Perler Midi' },
    hama: { foregroundRef: 'H18', backgroundRef: 'H01', black: [20, 19, 21, 255], white: [229, 236, 241, 255], board: 29, boardId: 'midi', paletteName: 'Hama Midi' },
    artkal_s: { foregroundRef: 'S13', backgroundRef: 'S01', black: [41, 42, 43, 255], white: [234, 238, 243, 255], board: 50, boardId: 'mini_artkal', paletteName: 'Artkal S Mini' },
};
const state = (patch: Partial<QrState> = {}): QrState => ({ ...defaultQrState(palettes), ...patch });

type ProjectFile = { type: string; version: number; savedAt: string; draft: EditorDraft; qrGenerator: { version: number; state: Record<string, unknown> } };
function tampered(change: (file: ProjectFile) => void): string {
    const file = JSON.parse(serializeQrProject(state(), palettes)) as ProjectFile; change(file); return JSON.stringify(file);
}

describe('QR bead project output', () => {
    it('defaults to the exact Perler black/white URL without a trailing slash', () => {
        expect(defaultQrState(palettes)).toEqual({ text: 'https://fusebeadpatterns.art', errorCorrection: 'M', beadsPerModule: 1,
            paletteId: 'perler', foregroundRef: '80-19018', backgroundRef: '80-19001', paper: 'a4' });
    });
    for (const id of ['perler', 'hama', 'artkal_s'] as const) {
        const colors = brandColors[id];
        for (const beadsPerModule of [1, 2] as const) {
            it(`preserves opaque quiet space, purchasing colors and ${colors.board}-bead board padding for ${id}/${beadsPerModule}`, () => {
                const result = buildQrProject(state({ paletteId: id, foregroundRef: colors.foregroundRef,
                    backgroundRef: colors.backgroundRef, beadsPerModule }), palettes);
                const { grid, pattern, draft } = result;
                expect(grid.width).toBe(37 * beadsPerModule);
                expect(grid.height).toBe(grid.width);
                expect(grid.pixels.length).toBe(grid.width * grid.height * 4);
                const actualCounts = new Map<string, number>();
                for (let y = 0; y < grid.height; y++) for (let x = 0; x < grid.width; x++) {
                    const rgba = Array.from(grid.pixels.slice((y * grid.width + x) * 4, (y * grid.width + x + 1) * 4));
                    const expected = pattern.mask[y * grid.width + x] ? colors.black : colors.white;
                    expect(rgba).toEqual(expected);
                    const ref = pattern.mask[y * grid.width + x] ? colors.foregroundRef : colors.backgroundRef;
                    actualCounts.set(ref, (actualCounts.get(ref) ?? 0) + 1);
                    if (x < 4 * beadsPerModule || y < 4 * beadsPerModule || x >= grid.width - 4 * beadsPerModule || y >= grid.height - 4 * beadsPerModule) {
                        expect(rgba).toEqual(colors.white);
                    }
                }
                expect(result.usage.reduce((sum, entry) => sum + entry.count, 0)).toBe(grid.width * grid.height);
                expect(result.usage.map(entry => [entry.color.ref, entry.count])).toEqual([
                    [colors.foregroundRef, actualCounts.get(colors.foregroundRef)], [colors.backgroundRef, actualCounts.get(colors.backgroundRef)],
                ]);
                expect(draft.boardId).toBe(colors.boardId);
                expect(draft.activePalettes[0].name).toBe(colors.paletteName);
                expect(draft.activePalettes[0].entries.length).toBe(palettes.find(palette => palette.id === id)!.colors.length);
                const padded = decodeEditorPatternDraft(draft.editedPattern)!;
                const paddedWidth = Math.ceil(grid.width / colors.board) * colors.board;
                expect(draft.boardWidth).toBe(paddedWidth / colors.board);
                expect(draft.editedPattern).toMatchObject({ width: paddedWidth, height: paddedWidth });
                for (let y = 0; y < paddedWidth; y++) for (let x = 0; x < paddedWidth; x++) {
                    const expected = x < grid.width && y < grid.height
                        ? grid.pixels.slice((y * grid.width + x) * 4, (y * grid.width + x + 1) * 4) : new Uint8ClampedArray(4);
                    expect(padded.subarray((y * paddedWidth + x) * 4, (y * paddedWidth + x + 1) * 4)).toEqual(expected);
                }
                expect(computeUsage(padded, draft.activePalettes)).toEqual(actualCounts);
            });
        }
        it(`independently decodes actual ${id} palette RGBA without changing its colors`, () => {
            const result = buildQrProject(state({ paletteId: id, foregroundRef: colors.foregroundRef, backgroundRef: colors.backgroundRef }), palettes);
            const scale = 6, width = result.grid.width * scale;
            const pixels = new Uint8ClampedArray(width * width * 4);
            for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
                const cell = Math.floor(y / scale) * result.grid.width + Math.floor(x / scale);
                pixels.set(result.grid.pixels.slice(cell * 4, cell * 4 + 4), (y * width + x) * 4);
            }
            const read = jsQR(pixels, width, width, { inversionAttempts: 'dontInvert' });
            expect(read?.data).toBe(result.state.text);
            expect(read?.binaryData).toEqual(Array.from(new TextEncoder().encode(result.state.text)));
        });
    }
    it('owns output buffers, state, usage and full saved palettes without mutating input', () => {
        const catalog = structuredClone(palettes), before = JSON.stringify(catalog), input = Object.freeze(state());
        const result = buildQrProject(input, catalog);
        const first = Array.from(result.grid.pixels.slice(0, 4));
        result.palette.colors[0].name = 'changed'; result.usage[0].color.name = 'changed'; result.state.text = 'changed';
        expect(result.grid.pixels).toBeInstanceOf(Uint8ClampedArray);
        (result.grid.pixels as Uint8ClampedArray)[0] = 0;
        expect(JSON.stringify(catalog)).toBe(before);
        expect(input.text).toBe('https://fusebeadpatterns.art');
        expect(result.draft.activePalettes[0].entries[0].name).not.toBe('changed');
        expect(Array.from(decodeEditorPatternDraft(result.draft.editedPattern)!.slice(0, 4))).toEqual(first);
    });

    it.each([
        { foregroundRef: 'H18' }, { backgroundRef: 'H01' }, { backgroundRef: '80-19018' },
    ])('rejects unknown or indistinguishable palette colors: %j', patch => {
        expect(() => buildQrProject(state(patch as Partial<QrState>), palettes)).toThrow('INVALID_COLOR');
    });
    it.each([
        (list: QrPalette[]) => { list[0].boardSize = 50; },
        (list: QrPalette[]) => { list[0].label = 'Wrong label'; },
        (list: QrPalette[]) => { list[0].colors[0].prefix = 'H'; },
        (list: QrPalette[]) => { list[0].colors[0].r = NaN; },
        (list: QrPalette[]) => { list[0].colors[0].g = 256; },
        (list: QrPalette[]) => { list[0].colors[0].b = 1.5; },
        (list: QrPalette[]) => { list[0].colors[0].ref = list[0].colors[1].ref; },
        (list: QrPalette[]) => { Object.assign(list[0].colors[0], { r: list[0].colors[1].r, g: list[0].colors[1].g, b: list[0].colors[1].b }); },
        (list: QrPalette[]) => { list.push(list[0]); },
    ])('rejects malformed or ambiguous registry data before creating an editor project', change => {
        const catalog = structuredClone(palettes); change(catalog);
        expect(() => buildQrProject(state(), catalog)).toThrow('INVALID_COLOR');
    });
    it('rejects unknown state fields, accessors and inherited schema fields', () => {
        for (const input of [{ ...state(), extra: true }, Object.create(state()), { ...state(), paper: 'legal' }, { ...state(), paletteId: 'missing' }]) {
            expect(() => buildQrProject(input as QrState, palettes)).toThrow('INVALID_OPTIONS');
        }
        const accessor = { ...state() }; Object.defineProperty(accessor, 'text', { enumerable: true, get() { throw new Error('Getter must not run'); } });
        expect(() => buildQrProject(accessor, palettes)).toThrow('INVALID_OPTIONS');
    });
});

describe('QR project save, restore and edit-loss protection', () => {
    for (const id of ['perler', 'hama', 'artkal_s'] as const) for (const paper of ['a4', 'letter'] as const) {
        it(`restores exact input, geometry and editor pixels for ${id}/${paper}`, () => {
            const colors = brandColors[id];
            const original = state({ text: ' https://example.org/?x=猫\r\n🧵 ', paletteId: id, foregroundRef: colors.foregroundRef,
                backgroundRef: colors.backgroundRef, beadsPerModule: 2, errorCorrection: 'Q', paper });
            const raw = serializeQrProject(original, palettes);
            expect(new TextEncoder().encode(raw).byteLength).toBeLessThan(QR_PROJECT_MAX_BYTES);
            const compatible = parseEditorProject(raw)!;
            expect(compatible).not.toBeNull();
            expect(parseQrProject(raw, palettes)).toEqual(original);
            expect(buildQrProject(parseQrProject(raw, palettes), palettes).draft).toEqual(compatible);
        });
    }
    it('accepts different JSON key order while preserving all semantic data', () => {
        const file = JSON.parse(serializeQrProject(state(), palettes));
        file.draft = Object.fromEntries(Object.entries(file.draft).reverse());
        file.qrGenerator.state = Object.fromEntries(Object.entries(file.qrGenerator.state).reverse());
        expect(parseQrProject(JSON.stringify(file), palettes)).toEqual(state());
    });
    it.each([
        ['wrong container', (file: ProjectFile) => { file.type = 'pixel-project'; }],
        ['future version', (file: ProjectFile) => { file.version = 2; }],
        ['invalid timestamp', (file: ProjectFile) => { file.savedAt = 'yesterday'; }],
        ['missing QR metadata', (file: ProjectFile) => { Reflect.deleteProperty(file, 'qrGenerator'); }],
        ['future QR version', (file: ProjectFile) => { file.qrGenerator.version = 2; }],
        ['unknown input field', (file: ProjectFile) => { file.qrGenerator.state.extra = true; }],
        ['stale input', (file: ProjectFile) => { file.qrGenerator.state.text = 'different'; }],
        ['stale correction', (file: ProjectFile) => { file.qrGenerator.state.errorCorrection = 'H'; }],
        ['stale module scale', (file: ProjectFile) => { file.qrGenerator.state.beadsPerModule = 2; }],
        ['unknown foreground', (file: ProjectFile) => { file.qrGenerator.state.foregroundRef = 'unknown'; }],
        ['brand changed in editor', (file: ProjectFile) => { file.draft.selectedPaletteIds = ['hama']; }],
        ['palette color changed in editor', (file: ProjectFile) => { file.draft.activePalettes[0].entries[0].color.r = 9; }],
        ['palette name changed', (file: ProjectFile) => { file.draft.activePalettes[0].name = 'changed'; }],
        ['palette ref changed', (file: ProjectFile) => { file.draft.activePalettes[0].entries[0].ref = 'changed'; }],
        ['palette symbol changed', (file: ProjectFile) => { file.draft.activePalettes[0].entries[0].symbol = '?'; }],
        ['palette disabled', (file: ProjectFile) => { file.draft.activePalettes[0].entries[0].enabled = false; }],
        ['different board size', (file: ProjectFile) => { file.draft.boardId = 'mini_artkal'; }],
        ['different board count', (file: ProjectFile) => { file.draft.boardWidth = 3; }],
        ['different paper', (file: ProjectFile) => { file.draft.pdfPaperSize = 'letter'; }],
        ['changed scale mode', (file: ProjectFile) => { file.draft.pdfScaleMode = 'midi-5mm'; }],
        ['changed source image', (file: ProjectFile) => { file.draft.imageSrc = 'data:image/png;base64,AAAA'; }],
        ['modified quiet-zone cell', (file: ProjectFile) => { const bytes = Buffer.from(file.draft.editedPattern!.data, 'base64'); bytes[3] = 0; file.draft.editedPattern!.data = bytes.toString('base64'); }],
        ['modified hidden padding RGB', (file: ProjectFile) => { const bytes = Buffer.from(file.draft.editedPattern!.data, 'base64'); bytes[bytes.length - 4] = 9; file.draft.editedPattern!.data = bytes.toString('base64'); }],
    ])('rejects %s rather than regenerating over editor work', (_label, change) => {
        expect(() => parseQrProject(tampered(change), palettes)).toThrow('INVALID_PROJECT');
    });
    it('rejects unknown top-level, metadata and nested draft fields', () => {
        const file = JSON.parse(serializeQrProject(state(), palettes));
        for (const changed of [{ ...file, extra: true }, { ...file, qrGenerator: { ...file.qrGenerator, extra: true } },
            { ...file, draft: { ...file.draft, extra: true } }]) {
            expect(() => parseQrProject(JSON.stringify(changed), palettes)).toThrow('INVALID_PROJECT');
        }
    });
    it('rejects malformed and oversized data before trying to reconstruct a QR', () => {
        expect(QR_PROJECT_MAX_BYTES).toBe(2_097_152);
        for (const raw of ['', '{}', '[]', '{bad', ' '.repeat(QR_PROJECT_MAX_BYTES + 1), 'é'.repeat(QR_PROJECT_MAX_BYTES / 2 + 1)]) {
            expect(() => parseQrProject(raw, palettes)).toThrow('INVALID_PROJECT');
        }
    });
});

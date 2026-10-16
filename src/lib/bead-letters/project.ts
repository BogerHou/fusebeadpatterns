import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { Color } from '../core/model/color/color.model';
import { getBoardOption, getPaletteDisplayLabel, getPaletteOption } from '../editor/config';
import { createEditorDraft, createEditorProjectFile, encodeEditorProjectPattern, parseEditorProject, type EditorDraft } from '../editor/draft';
import type { RgbaSource } from '../pixel-grid/core';
import { buildLetterPattern, type LetterPattern } from './core';
import type { LetterColor, LetterPalette, LetterState } from './types';

export const LETTER_PROJECT_MAX_BYTES = 1_048_576;
const stateKeys = ['text', 'letterSpacing', 'lineSpacing', 'padding', 'align', 'paletteId', 'foregroundRef', 'backgroundRef', 'backgroundEnabled', 'paper'];
const paletteIds = ['perler', 'hama', 'artkal_s'];

export type LetterProjectResult = {
    draft: EditorDraft;
    grid: RgbaSource;
    pattern: LetterPattern;
    usage: Array<{ color: LetterColor; count: number }>;
    palette: LetterPalette;
};

function record(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return (prototype === Object.prototype || prototype === null)
        && Object.values(Object.getOwnPropertyDescriptors(value)).every(descriptor => 'value' in descriptor && descriptor.enumerable);
}

function checkedState(input: LetterState): LetterState {
    if (!record(input) || Object.keys(input).length !== stateKeys.length || !stateKeys.every(key => Object.hasOwn(input, key))
        || typeof input.text !== 'string' || !paletteIds.includes(input.paletteId)
        || typeof input.foregroundRef !== 'string' || typeof input.backgroundRef !== 'string'
        || typeof input.backgroundEnabled !== 'boolean' || !['a4', 'letter'].includes(input.paper)) {
        throw new Error('INVALID_OPTIONS');
    }
    // The core validates the bounded geometry and supported characters. Keep
    // the entered text (including ASCII case) so a saved input reopens exactly.
    return {
        text: input.text, letterSpacing: input.letterSpacing, lineSpacing: input.lineSpacing,
        padding: input.padding, align: input.align, paletteId: input.paletteId,
        foregroundRef: input.foregroundRef, backgroundRef: input.backgroundRef,
        backgroundEnabled: input.backgroundEnabled, paper: input.paper,
    };
}

function checkedPalettes(input: LetterPalette[]): LetterPalette[] {
    if (!Array.isArray(input) || !input.length || input.length > paletteIds.length) throw new Error('INVALID_COLOR');
    const ids = new Set<string>();
    return input.map(palette => {
        if (!record(palette) || !paletteIds.includes(palette.id) || ids.has(palette.id)) throw new Error('INVALID_COLOR');
        ids.add(palette.id);
        const option = getPaletteOption(palette.id)!;
        const board = getBoardOption(option.boardId)!;
        if (palette.label !== getPaletteDisplayLabel(option) || palette.boardSize !== board.beadsPerRow
            || !Array.isArray(palette.colors) || !palette.colors.length || palette.colors.length > 512) throw new Error('INVALID_COLOR');
        const refs = new Set<string>(), colors = new Set<string>();
        return {
            id: palette.id, label: palette.label, boardSize: palette.boardSize,
            colors: palette.colors.map(color => {
                if (!record(color) || typeof color.name !== 'string' || !color.name || color.name.length > 128
                    || typeof color.ref !== 'string' || !color.ref || color.ref.length > 128 || refs.has(color.ref)
                    || typeof color.symbol !== 'string' || !color.symbol || color.symbol.length > 8 || color.prefix !== option.prefix
                    || ![color.r, color.g, color.b].every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
                    throw new Error('INVALID_COLOR');
                }
                const key = `${color.r},${color.g},${color.b}`;
                // Existing usage is keyed by exact RGBA. Do not silently choose
                // one purchasing code if a future registry has duplicate RGB.
                if (colors.has(key)) throw new Error('INVALID_COLOR');
                refs.add(color.ref); colors.add(key);
                return { name: color.name, ref: color.ref, symbol: color.symbol, prefix: color.prefix, r: color.r, g: color.g, b: color.b };
            }),
        };
    });
}

export function defaultLetterState(palettes: LetterPalette[]): LetterState {
    const perler = checkedPalettes(palettes).find(palette => palette.id === 'perler');
    if (!perler?.colors.some(color => color.ref === '80-19018') || !perler.colors.some(color => color.ref === '80-19001')) {
        throw new Error('INVALID_COLOR');
    }
    return {
        text: 'LOVE', letterSpacing: 1, lineSpacing: 2, padding: 1, align: 'center',
        paletteId: 'perler', foregroundRef: '80-19018', backgroundRef: '80-19001', backgroundEnabled: true, paper: 'a4',
    };
}

/** One glyph cell is one bead. Padding completes boards on the right/bottom only. */
export function buildLetterProject(input: LetterState, palettes: LetterPalette[]): LetterProjectResult {
    const state = checkedState(input);
    const palette = checkedPalettes(palettes).find(candidate => candidate.id === state.paletteId);
    const foreground = palette?.colors.find(color => color.ref === state.foregroundRef);
    const background = palette?.colors.find(color => color.ref === state.backgroundRef);
    if (!palette || !foreground || !background) throw new Error('INVALID_COLOR');
    if (state.backgroundEnabled && foreground.r === background.r && foreground.g === background.g && foreground.b === background.b) {
        throw new Error('INVALID_COLOR');
    }
    const pattern = buildLetterPattern(state);
    const pixels = new Uint8ClampedArray(pattern.width * pattern.height * 4);
    for (let cell = 0; cell < pattern.mask.length; cell++) {
        const color = pattern.mask[cell] ? foreground : state.backgroundEnabled ? background : null;
        if (color) pixels.set([color.r, color.g, color.b, 255], cell * 4);
    }
    const boardWidth = Math.ceil(pattern.width / palette.boardSize), boardHeight = Math.ceil(pattern.height / palette.boardSize);
    const width = boardWidth * palette.boardSize, height = boardHeight * palette.boardSize;
    const padded = new Uint8ClampedArray(width * height * 4);
    for (let row = 0; row < pattern.height; row++) {
        padded.set(pixels.subarray(row * pattern.width * 4, (row + 1) * pattern.width * 4), row * width * 4);
    }
    const option = getPaletteOption(palette.id)!;
    const entries = palette.colors.map(color => {
        const entry = new PaletteEntry(color.name, new Color(color.r, color.g, color.b, 255));
        entry.ref = color.ref; entry.symbol = color.symbol; entry.prefix = color.prefix;
        return entry;
    });
    const draft = createEditorDraft({
        sourceMode: 'blank', imageSrc: null, sourceCrop: null, maxBeadColors: null,
        fileName: `bead-letters-${pattern.width}x${pattern.height}`,
        selectedPaletteIds: [palette.id], activePalettes: [new Palette(option.label, entries)],
        boardId: option.boardId, boardWidth, boardHeight,
        matchingId: 'euclidean', ditheringId: 'none', useSymbols: true,
        exportFormatId: 'pdf', pdfScaleMode: 'fit-page', pdfPaperSize: state.paper,
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: false, fit: false, showGrid: true },
        showReference: false, referenceOpacity: 100, previewZoom: 1,
        editedPattern: encodeEditorProjectPattern(padded, width, height),
    });
    const usage = [{ color: { ...foreground }, count: pattern.textBeads }];
    if (state.backgroundEnabled) usage.push({ color: { ...background }, count: pattern.width * pattern.height - pattern.textBeads });
    return { draft, grid: { width: pattern.width, height: pattern.height, pixels }, pattern, usage, palette };
}

export function serializeLetterProject(input: LetterState, palettes: LetterPalette[]): string {
    const state = checkedState(input);
    const { draft } = buildLetterProject(state, palettes);
    return JSON.stringify({ ...createEditorProjectFile(draft), letterGenerator: { version: 1, state } }, null, 2);
}

/** Compare against the expected shape, without traversing arbitrary input depth. */
function sameData(actual: unknown, expected: unknown): boolean {
    if (actual === expected) return true;
    if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length
        && expected.every((value, index) => sameData(actual[index], value));
    // Generated drafts contain the existing Palette/Color model instances;
    // serialized drafts are plain objects with the same own data fields.
    if (expected && typeof expected === 'object') {
        const values = expected as Record<string, unknown>;
        return record(actual) && Object.keys(actual).length === Object.keys(values).length
            && Object.keys(values).every(key => Object.hasOwn(actual, key) && sameData(actual[key], values[key]));
    }
    return false;
}

/** Editor-modified pixels cannot be discarded by reopening stale text metadata. */
export function parseLetterProject(raw: string, palettes: LetterPalette[]): LetterState {
    try {
        if (typeof raw !== 'string' || raw.length > LETTER_PROJECT_MAX_BYTES
            || new TextEncoder().encode(raw).byteLength > LETTER_PROJECT_MAX_BYTES) throw new Error();
        const file: unknown = JSON.parse(raw);
        if (!record(file) || !record(file.letterGenerator) || Object.keys(file.letterGenerator).length !== 2
            || file.letterGenerator.version !== 1) throw new Error();
        const state = checkedState(file.letterGenerator.state as LetterState);
        const actual = parseEditorProject(raw);
        const expected = buildLetterProject(state, palettes).draft;
        if (!actual || !sameData(actual, expected)) throw new Error();
        return state;
    } catch {
        throw new Error('INVALID_PROJECT');
    }
}

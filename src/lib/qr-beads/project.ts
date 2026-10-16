import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { Color } from '../core/model/color/color.model';
import { getBoardOption, getPaletteDisplayLabel, getPaletteOption } from '../editor/config';
import { createEditorDraft, createEditorProjectFile, encodeEditorProjectPattern, parseEditorProject, EDITOR_PROJECT_FILE_TYPE } from '../editor/draft';
import { buildQrPattern } from './core';
import type { QrPalette, QrProjectResult, QrState } from './types';

export const QR_PROJECT_MAX_BYTES = 2 * 1024 * 1024;
const stateKeys = ['text', 'errorCorrection', 'beadsPerModule', 'paletteId', 'foregroundRef', 'backgroundRef', 'paper'];
const paletteIds = ['perler', 'hama', 'artkal_s'];

function record(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return (prototype === Object.prototype || prototype === null)
        && Reflect.ownKeys(value).every(key => typeof key === 'string')
        && Object.values(Object.getOwnPropertyDescriptors(value)).every(descriptor => 'value' in descriptor && descriptor.enumerable);
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
    return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function checkedState(input: QrState): QrState {
    if (!record(input) || !exactKeys(input, stateKeys)
        || typeof input.text !== 'string' || !paletteIds.includes(input.paletteId)
        || typeof input.foregroundRef !== 'string' || typeof input.backgroundRef !== 'string'
        || !['a4', 'letter'].includes(input.paper)) throw new Error('INVALID_OPTIONS');
    return { text: input.text, errorCorrection: input.errorCorrection, beadsPerModule: input.beadsPerModule,
        paletteId: input.paletteId, foregroundRef: input.foregroundRef, backgroundRef: input.backgroundRef, paper: input.paper };
}

function checkedPalettes(input: QrPalette[]): QrPalette[] {
    if (!Array.isArray(input) || !input.length || input.length > paletteIds.length) throw new Error('INVALID_COLOR');
    const ids = new Set<string>();
    return input.map(palette => {
        if (!record(palette) || !paletteIds.includes(palette.id) || ids.has(palette.id)) throw new Error('INVALID_COLOR');
        ids.add(palette.id);
        const option = getPaletteOption(palette.id)!;
        const board = getBoardOption(option.boardId)!;
        if (palette.label !== getPaletteDisplayLabel(option) || palette.boardSize !== board.beadsPerRow
            || !Array.isArray(palette.colors) || palette.colors.length < 2 || palette.colors.length > 512) throw new Error('INVALID_COLOR');
        const refs = new Set<string>(), rgbValues = new Set<string>();
        return { id: palette.id, label: palette.label, boardSize: palette.boardSize,
            colors: palette.colors.map(color => {
                if (!record(color) || typeof color.name !== 'string' || !color.name || color.name.length > 128
                    || typeof color.ref !== 'string' || !color.ref || color.ref.length > 128 || refs.has(color.ref)
                    || typeof color.symbol !== 'string' || !color.symbol || color.symbol.length > 8 || color.prefix !== option.prefix
                    || ![color.r, color.g, color.b].every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
                    throw new Error('INVALID_COLOR');
                }
                const key = `${color.r},${color.g},${color.b}`;
                if (rgbValues.has(key)) throw new Error('INVALID_COLOR');
                refs.add(color.ref); rgbValues.add(key);
                return { name: color.name, ref: color.ref, symbol: color.symbol, prefix: color.prefix, r: color.r, g: color.g, b: color.b };
            }),
        };
    });
}

export function defaultQrState(palettes: QrPalette[]): QrState {
    const perler = checkedPalettes(palettes).find(palette => palette.id === 'perler');
    if (!perler?.colors.some(color => color.ref === '80-19018') || !perler.colors.some(color => color.ref === '80-19001')) {
        throw new Error('INVALID_COLOR');
    }
    return { text: 'https://fusebeadpatterns.art', errorCorrection: 'M', beadsPerModule: 1,
        paletteId: 'perler', foregroundRef: '80-19018', backgroundRef: '80-19001', paper: 'a4' };
}

/** The logical chart includes opaque quiet-zone beads; only board completion is transparent. */
export function buildQrProject(input: QrState, palettes: QrPalette[]): QrProjectResult {
    const state = checkedState(input);
    const palette = checkedPalettes(palettes).find(candidate => candidate.id === state.paletteId);
    const foreground = palette?.colors.find(color => color.ref === state.foregroundRef);
    const background = palette?.colors.find(color => color.ref === state.backgroundRef);
    if (!palette || !foreground || !background
        || (foreground.r === background.r && foreground.g === background.g && foreground.b === background.b)) throw new Error('INVALID_COLOR');
    const pattern = buildQrPattern(state);
    const pixels = new Uint8ClampedArray(pattern.width * pattern.height * 4);
    for (let cell = 0; cell < pattern.mask.length; cell++) {
        const color = pattern.mask[cell] ? foreground : background;
        pixels.set([color.r, color.g, color.b, 255], cell * 4);
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
        fileName: `qr-beads-${pattern.width}x${pattern.height}`,
        selectedPaletteIds: [palette.id], activePalettes: [new Palette(option.label, entries)],
        boardId: option.boardId, boardWidth, boardHeight,
        matchingId: 'euclidean', ditheringId: 'none', useSymbols: true,
        exportFormatId: 'pdf', pdfScaleMode: 'fit-page', pdfPaperSize: state.paper,
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: false, fit: false, showGrid: true },
        showReference: false, referenceOpacity: 100, previewZoom: 1,
        editedPattern: encodeEditorProjectPattern(padded, width, height),
    });
    return { state, draft, grid: { width: pattern.width, height: pattern.height, pixels }, pattern, palette,
        usage: [{ color: { ...foreground }, count: pattern.darkBeads },
            { color: { ...background }, count: pattern.width * pattern.height - pattern.darkBeads }] };
}

export function serializeQrProject(input: QrState, palettes: QrPalette[]): string {
    const result = buildQrProject(input, palettes);
    return JSON.stringify({ ...createEditorProjectFile(result.draft), qrGenerator: { version: 1, state: result.state } }, null, 2);
}

/** Traverse only the bounded expected draft shape, never arbitrary imported depth. */
function sameData(actual: unknown, expected: unknown): boolean {
    if (actual === expected) return true;
    if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length
        && expected.every((value, index) => sameData(actual[index], value));
    if (expected && typeof expected === 'object') {
        const values = expected as Record<string, unknown>;
        return record(actual) && exactKeys(actual, Object.keys(values))
            && Object.keys(values).every(key => sameData(actual[key], values[key]));
    }
    return false;
}

/** Never use old QR metadata to replace pixels that someone has edited in the bead editor. */
export function parseQrProject(raw: string, palettes: QrPalette[]): QrState {
    try {
        if (typeof raw !== 'string' || raw.length > QR_PROJECT_MAX_BYTES
            || new TextEncoder().encode(raw).byteLength > QR_PROJECT_MAX_BYTES) throw new Error();
        const file: unknown = JSON.parse(raw);
        if (!record(file) || !exactKeys(file, ['type', 'version', 'savedAt', 'draft', 'qrGenerator'])
            || file.type !== EDITOR_PROJECT_FILE_TYPE || file.version !== 1 || typeof file.savedAt !== 'string'
            || !Number.isFinite(Date.parse(file.savedAt)) || new Date(file.savedAt).toISOString() !== file.savedAt
            || !record(file.qrGenerator) || !exactKeys(file.qrGenerator, ['version', 'state'])
            || file.qrGenerator.version !== 1) throw new Error();
        const state = checkedState(file.qrGenerator.state as QrState);
        const actual = parseEditorProject(raw);
        const expected = buildQrProject(state, palettes).draft;
        if (!actual || !sameData(actual, expected)) throw new Error();
        return state;
    } catch {
        throw new Error('INVALID_PROJECT');
    }
}

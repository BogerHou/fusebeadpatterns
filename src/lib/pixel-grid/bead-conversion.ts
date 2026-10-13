import { Palette } from '../core/model/palette/palette.model';
import { MAX_BEAD_COLORS, MAX_LIMIT_PALETTE_ENTRIES } from '../editor/brand-color-limit';
import { getBoardOption, getPaletteOption, type PaletteOption } from '../editor/config';
import { createEditorDraft, encodeEditorProjectPattern, type EditorDraft } from '../editor/draft';
import { clonePalettes } from '../editor/palette-state';
import { quantizePattern, type QuantizationOptions } from '../editor/pattern-quantization';
import { isMidiActualSizeSupported } from '../editor/pdf-scale';
import { createGrid, type RgbaSource } from './core';

export type PixelBeadConversionInput = {
    grid: RgbaSource;
    paletteId: string;
    /** One palette loaded from the selected built-in option, with enabled state. */
    palette: Palette;
};

export type PixelBeadLayout = {
    sourceWidth: number;
    sourceHeight: number;
    patternWidth: number;
    patternHeight: number;
    boardSize: number;
    boardWidth: number;
    boardHeight: number;
    boardCount: number;
};

export type PixelBeadConversionResult = { draft: EditorDraft; layout: PixelBeadLayout };

function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw new DOMException('Pixel-to-bead conversion cancelled.', 'AbortError');
}

function checkedPalette(palette: Palette, option: PaletteOption): { saved: Palette; matching: Palette; colorCount: number } {
    // The caller owns loading the real CSV; do not silently relabel another
    // brand or accept a mixture of brand prefixes into the saved project.
    if (!palette || Array.isArray(palette) || palette.name !== option.label || !Array.isArray(palette.entries)) {
        throw new TypeError('The palette must match the selected bead brand.');
    }
    if (palette.entries.length > MAX_LIMIT_PALETTE_ENTRIES) throw new RangeError('The bead palette exceeds the conversion limit.');
    for (const entry of palette.entries) {
        if (!entry || typeof entry.enabled !== 'boolean' || entry.prefix !== option.prefix ||
            typeof entry.name !== 'string' || typeof entry.ref !== 'string' || !entry.ref || typeof entry.symbol !== 'string' ||
            !entry.color || ![entry.color.r, entry.color.g, entry.color.b, entry.color.a].every((value) => Number.isInteger(value) && value >= 0 && value <= 255)) {
            throw new TypeError('The palette contains invalid or mixed-brand colors.');
        }
    }
    const saved = clonePalettes([palette])[0];
    const entries = saved.entries.filter((entry) => entry.enabled && entry.color.a === 255);
    const colorCount = new Set(entries.map(({ color }) => `${color.r},${color.g},${color.b}`)).size;
    if (!colorCount) throw new RangeError('Choose a palette with an enabled opaque bead color.');
    // Every current built-in brand is within this budget (largest: 461 entries).
    // A larger future palette must be supported explicitly, never silently
    // reduced to 512 colors during a supposedly direct pixel-to-bead transfer.
    if (colorCount > MAX_BEAD_COLORS) throw new RangeError('The bead palette has too many distinct colors for this conversion.');
    return { saved, matching: new Palette(option.label, entries), colorCount };
}

/**
 * One source pixel becomes one bead cell, anchored at the top-left. Only the
 * right and bottom edges are padded to complete the selected brand's boards.
 * This function is local and atomic: it neither saves nor navigates, and only
 * returns a complete draft after successful conversion and an Abort check.
 */
export async function convertPixelGridToBeads(
    input: PixelBeadConversionInput,
    options: QuantizationOptions = {}
): Promise<PixelBeadConversionResult> {
    throwIfAborted(options.signal);
    const option = getPaletteOption(input.paletteId);
    if (!option) throw new RangeError('Choose an existing bead brand.');
    const board = getBoardOption(option.boardId);
    if (!board) throw new RangeError('The bead brand has no supported board size.');
    if (!input.grid || input.grid.pixels === undefined) throw new TypeError('An RGBA pixel grid is required.');
    // Snapshot both sources before the first asynchronous boundary. Later UI
    // edits cannot alter the draft being prepared or detach the input buffer.
    const grid = createGrid(input.grid.width, input.grid.height, input.grid.pixels);
    const palette = checkedPalette(input.palette, option);
    for (let offset = 0; offset < grid.pixels.length; offset += 4) {
        const alpha = grid.pixels[offset + 3];
        if (alpha === 0 || alpha === 255) continue;
        for (let channel = 0; channel < 3; channel++) {
            grid.pixels[offset + channel] = Math.round((grid.pixels[offset + channel] * alpha + 255 * (255 - alpha)) / 255);
        }
        grid.pixels[offset + 3] = 255;
    }

    const converted = await quantizePattern({
        pixels: grid.pixels,
        width: grid.width,
        height: grid.height,
        palettes: [palette.matching],
        matchingId: 'euclidean',
        dithering: { enable: false, hardness: 0 },
        drawingPosition: { x: 0, y: 0, width: grid.width, height: grid.height },
        // A nonrestrictive cap selects the existing cooperative/worker path.
        // Every enabled opaque RGB remains available; this is not a user cap.
        maxBeadColors: palette.colorCount,
    }, options);
    throwIfAborted(options.signal);

    const boardWidth = Math.ceil(grid.width / board.beadsPerRow);
    const boardHeight = Math.ceil(grid.height / board.beadsPerRow);
    const patternWidth = boardWidth * board.beadsPerRow;
    const patternHeight = boardHeight * board.beadsPerRow;
    const pixels = new Uint8ClampedArray(patternWidth * patternHeight * 4);
    for (let row = 0; row < grid.height; row++) {
        pixels.set(converted.subarray(row * grid.width * 4, (row + 1) * grid.width * 4), row * patternWidth * 4);
    }
    const layout: PixelBeadLayout = {
        sourceWidth: grid.width, sourceHeight: grid.height,
        patternWidth, patternHeight, boardSize: board.beadsPerRow,
        boardWidth, boardHeight, boardCount: boardWidth * boardHeight,
    };
    const draft = createEditorDraft({
        sourceMode: 'blank', imageSrc: null, sourceCrop: null, maxBeadColors: null,
        fileName: `pixel-${grid.width}x${grid.height}`,
        selectedPaletteIds: [option.id], activePalettes: [palette.saved],
        boardId: option.boardId, boardWidth, boardHeight,
        matchingId: 'euclidean', ditheringId: 'none',
        useSymbols: true, exportFormatId: 'pdf', pdfPaperSize: 'a4',
        pdfScaleMode: isMidiActualSizeSupported([option.id], option.boardId) ? 'midi-5mm' : 'fit-page',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: false, fit: false, showGrid: true },
        showReference: false, referenceOpacity: 100, previewZoom: 1,
        editedPattern: encodeEditorProjectPattern(pixels, patternWidth, patternHeight),
    });
    return { draft, layout };
}

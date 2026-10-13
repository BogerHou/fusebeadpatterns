import { describe, expect, it } from 'vitest';
import { createEditorDraft, encodeEditorProjectPattern } from './draft';
import { getPaletteOption, parsePaletteCsv } from './config';
import { preparePixelBeadEditorDraft } from './pixel-bead-entry';

function incomingPixelDraft() {
    const palette = parsePaletteCsv('P01,Black,B,0,0,0\nP02,Red,R,255,0,0', getPaletteOption('perler')!);
    const pixels = new Uint8ClampedArray(58 * 29 * 4);
    for (let y = 0; y < 23; y++) for (let x = 0; x < 37; x++) {
        if ((x + y) % 3) pixels.set(x % 2 ? [255, 0, 0, 255] : [0, 0, 0, 255], (y * 58 + x) * 4);
    }
    pixels.set([15, 25, 35, 0], 4); // invisible RGB remains part of a saved grid
    return createEditorDraft({ sourceMode: 'blank', imageSrc: null, fileName: 'pixel-beads', selectedPaletteIds: ['perler'],
        activePalettes: [palette], boardId: 'midi', boardWidth: 2, boardHeight: 1,
        matchingId: 'euclidean', ditheringId: 'none', useSymbols: true, exportFormatId: 'pdf',
        pdfPaperSize: 'letter', pdfScaleMode: 'midi-5mm',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: false, fit: false, showGrid: true }, previewZoom: 1,
        editedPattern: encodeEditorProjectPattern(pixels, 58, 29) });
}

describe('pixel bead receiving document validation', () => {
    it('keeps exact saved cell coordinates, alpha and hidden RGB without resampling, cloning pixels and palette configuration', () => {
        const input = incomingPixelDraft(), before = structuredClone(input), { draft, prepared } = preparePixelBeadEditorDraft(input);
        expect(draft).toEqual(before); expect(draft).not.toBe(input);
        expect(prepared).toMatchObject({ width: 58, height: 29 });
        expect(prepared.pixels.subarray(4, 8)).toEqual(new Uint8ClampedArray([15, 25, 35, 0]));
        for (let y = 0; y < 29; y++) for (let x = 0; x < 58; x++) {
            if (x >= 37 || y >= 23) expect(prepared.pixels[(y * 58 + x) * 4 + 3]).toBe(0);
        }
        expect(prepared.project.boardConfiguration.nbBoardWidth).toBe(2);
        expect(prepared.project.paletteConfiguration.palettes).toEqual(input.activePalettes);
        input.activePalettes[0].entries[0].enabled = false;
        expect(prepared.project.paletteConfiguration.palettes[0].entries[0].enabled).toBe(true);
        expect(prepared.project.srcWidth).toBe(58); expect(prepared.project.srcHeight).toBe(29);
    });
    it.each(['image', 'layout', 'board', 'palette', 'alpha', 'color', 'disabled', 'data'] as const)('rejects an invalid %s without changing the input', kind => {
        const input = incomingPixelDraft();
        if (kind === 'image') { input.sourceMode = 'image'; input.imageSrc = 'data:image/png;base64,AA=='; }
        if (kind === 'layout') input.boardWidth = 1;
        if (kind === 'board') input.boardId = 'mini';
        if (kind === 'palette') input.activePalettes = [];
        if (kind === 'disabled') input.activePalettes[0].entries[1].enabled = false;
        if (kind === 'data') input.editedPattern!.data = 'broken';
        if (kind === 'alpha' || kind === 'color') {
            const bytes = new Uint8ClampedArray(58 * 29 * 4);
            bytes.set(kind === 'alpha' ? [255, 0, 0, 128] : [1, 2, 3, 255]);
            input.editedPattern = encodeEditorProjectPattern(bytes, 58, 29);
        }
        const before = structuredClone(input);
        expect(() => preparePixelBeadEditorDraft(input)).toThrow(); expect(input).toEqual(before);
    });
});

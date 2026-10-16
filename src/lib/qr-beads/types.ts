import type { EditorDraft } from '../editor/draft';
import type { RgbaSource } from '../pixel-grid/core';
import type { LetterBrandId, LetterColor, LetterPalette } from '../bead-letters/types';

export type QrBrandId = LetterBrandId;
export type QrColor = LetterColor;
export type QrPalette = LetterPalette;
export type QrEcc = 'L' | 'M' | 'Q' | 'H';
export type QrState = {
    text: string; errorCorrection: QrEcc; beadsPerModule: 1 | 2 | 3;
    paletteId: QrBrandId; foregroundRef: string; backgroundRef: string;
    paper: 'a4' | 'letter';
};
export type QrPattern = {
    version: number; modules: number; quietModules: 4; beadsPerModule: number;
    width: number; height: number; mask: Uint8Array; darkBeads: number;
};
export type QrProjectResult = {
    state: QrState; draft: EditorDraft; grid: RgbaSource; pattern: QrPattern;
    usage: Array<{ color: QrColor; count: number }>; palette: QrPalette;
};

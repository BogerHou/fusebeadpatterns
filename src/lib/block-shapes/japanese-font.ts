import type { jsPDF } from 'jspdf';

export const BLOCK_SHAPE_JAPANESE_FONT_NAME = 'FuseBeadBlockShapesJapanese';
const FONT_FILE = 'FuseBeadBlockShapesJapanese-Regular.ttf';
const MAX_FONT_BYTES = 262144;
let fontPromise: Promise<string> | undefined;

/** Separate renamed OFL subset; fetched only when this tool exports Japanese PDF. */
export function loadBlockShapeJapaneseFont(): Promise<string> {
    fontPromise ??= fetch(`/fonts/block-shapes-japanese/${FONT_FILE}`)
        .then(async response => {
            if (!response.ok) throw new Error('JAPANESE_FONT_UNAVAILABLE');
            const bytes = new Uint8Array(await response.arrayBuffer());
            if (bytes.length < 1024 || bytes.length > MAX_FONT_BYTES || bytes[0] !== 0 || bytes[1] !== 1 || bytes[2] !== 0 || bytes[3] !== 0) throw new Error('JAPANESE_FONT_INVALID');
            let binary = '';
            for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
            return btoa(binary);
        })
        .catch(error => { fontPromise = undefined; throw error; });
    return fontPromise;
}

export function registerBlockShapeJapaneseFont(doc: jsPDF, base64: string): void {
    doc.addFileToVFS(FONT_FILE, base64);
    doc.addFont(FONT_FILE, BLOCK_SHAPE_JAPANESE_FONT_NAME, 'normal');
}

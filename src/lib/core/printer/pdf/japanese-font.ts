import type { jsPDF } from 'jspdf';

export const JAPANESE_EXPORT_FONT_NAME = 'FuseBeadJapanese';
const FONT_FILE = 'FuseBeadJapanese-Regular.ttf';
let fontPromise: Promise<string> | undefined;

/** Reuse the existing renamed, OFL-licensed subset without changing its bytes. */
export function loadJapaneseExportFont(): Promise<string> {
    fontPromise ??= fetch(`/fonts/fuse-bead-japanese/${FONT_FILE}`)
        .then(async (response) => {
            if (!response.ok) throw new Error('印刷用フォントを読み込めませんでした。');
            const bytes = new Uint8Array(await response.arrayBuffer());
            let binary = '';
            for (let i = 0; i < bytes.length; i += 8192) {
                binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
            }
            return btoa(binary);
        })
        .catch((error) => { fontPromise = undefined; throw error; });
    return fontPromise;
}

export function registerJapaneseExportFont(doc: jsPDF, base64: string): void {
    doc.addFileToVFS(FONT_FILE, base64);
    doc.addFont(FONT_FILE, JAPANESE_EXPORT_FONT_NAME, 'normal');
}

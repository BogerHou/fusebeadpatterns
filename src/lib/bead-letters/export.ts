import { downloadBlob } from '../core/printer/download';
import type { SiteLocale } from '../i18n/locales';
import { createLetterPdf } from './pdf';
import type { LetterProjectResult } from './project';
import type { LetterState } from './types';

/** A counting-grid PNG: empty cell interiors stay transparent, grid lines remain visible. */
export async function exportLetterPng(result: LetterProjectResult, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    const { width, height } = result.grid;
    const pixels = new Uint8ClampedArray(result.grid.pixels);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1
        || width > 128 || height > 128 || pixels.length !== width * height * 4) throw new Error('INVALID_PROJECT');
    const cellSize = 16;
    const canvas = document.createElement('canvas');
    canvas.width = width * cellSize + 1; canvas.height = height * cellSize + 1;
    try {
        const context = canvas.getContext('2d');
        if (!context) throw new Error('INVALID_PROJECT');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = false;
        for (let cell = 0; cell < width * height; cell++) {
            const offset = cell * 4;
            if (!pixels[offset + 3]) continue;
            context.fillStyle = `rgba(${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]},${pixels[offset + 3] / 255})`;
            context.fillRect((cell % width) * cellSize, Math.floor(cell / width) * cellSize, cellSize, cellSize);
        }
        context.strokeStyle = 'rgba(88,100,88,0.6)'; context.lineWidth = 1;
        context.beginPath();
        for (let column = 0; column <= width; column++) {
            context.moveTo(column * cellSize + 0.5, 0.5); context.lineTo(column * cellSize + 0.5, height * cellSize + 0.5);
        }
        for (let row = 0; row <= height; row++) {
            context.moveTo(0.5, row * cellSize + 0.5); context.lineTo(width * cellSize + 0.5, row * cellSize + 0.5);
        }
        context.stroke();
        const blob = await new Promise<Blob>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('INVALID_PROJECT')), 15_000);
            try {
                canvas.toBlob(value => {
                    clearTimeout(timer);
                    if (value) resolve(value); else reject(new Error('INVALID_PROJECT'));
                }, 'image/png');
            } catch (error) { clearTimeout(timer); reject(error); }
        });
        signal?.throwIfAborted();
        downloadBlob(blob, 'bead-letters-grid.png');
    } finally {
        canvas.width = 0; canvas.height = 0;
    }
}

/** New-tool chart generation leaves all existing editor printer outputs unchanged. */
export async function exportLetterPdf(result: LetterProjectResult, state: LetterState, locale: SiteLocale, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    const bytes = await createLetterPdf(result, state, locale, signal);
    signal?.throwIfAborted();
    downloadBlob(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), 'bead-letters.pdf');
}

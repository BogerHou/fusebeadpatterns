import { downloadBlob } from '../core/printer/download';
import type { SiteLocale } from '../i18n/locales';
import { buildQrProject } from './project';
import type { QrProjectResult, QrState } from './types';

export const QR_PNG_PIXELS_PER_BEAD = 8;

/** Own all inputs before an async export; stale settings must never label another QR. */
export function snapshotQrExport(result: QrProjectResult, state: QrState = result.state): QrProjectResult {
    const snapshot = buildQrProject(state, [result.palette]);
    if (result.grid.width !== snapshot.grid.width || result.grid.height !== snapshot.grid.height
        || result.grid.pixels.length !== snapshot.grid.pixels.length
        || !Array.from(result.grid.pixels).every((value, index) => value === snapshot.grid.pixels[index])
        || result.pattern.version !== snapshot.pattern.version || result.pattern.modules !== snapshot.pattern.modules
        || result.pattern.width !== snapshot.pattern.width || result.pattern.height !== snapshot.pattern.height
        || result.pattern.darkBeads !== snapshot.pattern.darkBeads
        || result.pattern.quietModules !== 4 || result.pattern.beadsPerModule !== snapshot.pattern.beadsPerModule
        || result.pattern.mask.length !== snapshot.pattern.mask.length
        || !Array.from(result.pattern.mask).every((value, index) => value === snapshot.pattern.mask[index])
        || result.draft.boardWidth !== snapshot.draft.boardWidth || result.draft.boardHeight !== snapshot.draft.boardHeight
        || JSON.stringify(result.draft.editedPattern) !== JSON.stringify(snapshot.draft.editedPattern)
        || JSON.stringify(result.usage) !== JSON.stringify(snapshot.usage)) throw new Error('INVALID_PROJECT');
    return snapshot;
}

function canvasPng(canvas: HTMLCanvasElement, signal?: AbortSignal): Promise<Blob> {
    signal?.throwIfAborted();
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (value?: Blob | null, error?: unknown) => {
            if (settled) return;
            settled = true; clearTimeout(timer); signal?.removeEventListener('abort', onAbort);
            if (error) reject(error);
            else if (value) resolve(value);
            else reject(new Error('PNG_GENERATION_FAILED'));
        };
        const onAbort = () => finish(null, signal?.reason ?? new DOMException('Aborted', 'AbortError'));
        const timer = setTimeout(() => finish(null, new Error('PNG_GENERATION_FAILED')), 15_000);
        signal?.addEventListener('abort', onAbort, { once: true });
        try { canvas.toBlob(value => finish(value), 'image/png'); }
        catch (error) { finish(null, error); }
    });
}

/** Pure, opaque brand-color squares. No grid, symbols, interpolation or board padding. */
export async function createQrPng(result: QrProjectResult, signal?: AbortSignal): Promise<Blob> {
    signal?.throwIfAborted();
    const snapshot = snapshotQrExport(result), scale = QR_PNG_PIXELS_PER_BEAD;
    const grid = { ...snapshot.grid, pixels: new Uint8ClampedArray(snapshot.grid.pixels) };
    const canvas = document.createElement('canvas');
    canvas.width = grid.width * scale; canvas.height = grid.height * scale;
    try {
        const context = canvas.getContext('2d');
        if (!context) throw new Error('PNG_GENERATION_FAILED');
        context.imageSmoothingEnabled = false;
        const image = context.createImageData(canvas.width, canvas.height);
        for (let y = 0; y < grid.height; y++) {
            signal?.throwIfAborted();
            const expanded = new Uint8ClampedArray(canvas.width * 4);
            for (let x = 0; x < grid.width; x++) {
                const source = (y * grid.width + x) * 4;
                for (let n = 0; n < scale; n++) expanded.set(grid.pixels.subarray(source, source + 4), (x * scale + n) * 4);
            }
            for (let n = 0; n < scale; n++) image.data.set(expanded, (y * scale + n) * canvas.width * 4);
        }
        context.putImageData(image, 0, 0);
        const blob = await canvasPng(canvas, signal);
        signal?.throwIfAborted();
        return blob;
    } finally { canvas.width = 0; canvas.height = 0; }
}

/** Decode the actual encoded PNG pixels, independently of the generating QR matrix. */
export async function verifyQrPng(blob: Blob, expectedText: string, signal?: AbortSignal): Promise<boolean> {
    signal?.throwIfAborted();
    if (!(blob instanceof Blob) || blob.type !== 'image/png' || blob.size < 1 || blob.size > 8_388_608
        || typeof expectedText !== 'string') throw new Error('INVALID_PROJECT');
    const expected = new TextEncoder().encode(expectedText);
    const bitmap = await createImageBitmap(blob);
    let canvas: HTMLCanvasElement | undefined;
    try {
        signal?.throwIfAborted();
        if (!bitmap.width || bitmap.width !== bitmap.height || bitmap.width > 232 * QR_PNG_PIXELS_PER_BEAD) return false;
        canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('PNG_GENERATION_FAILED');
        context.imageSmoothingEnabled = false; context.drawImage(bitmap, 0, 0);
        const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
        if (rgba.some((value, index) => index % 4 === 3 && value !== 255)) return false;
        const { default: jsQR } = await import('jsqr');
        signal?.throwIfAborted();
        const decoded = jsQR(rgba, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
        signal?.throwIfAborted();
        return decoded !== null && decoded.binaryData.length === expected.length
            && decoded.binaryData.every((value, index) => value === expected[index]);
    } finally {
        bitmap.close();
        if (canvas) { canvas.width = 0; canvas.height = 0; }
    }
}

/** Construction grid: its lines and coordinates deliberately differ from the clean QR. */
export async function createQrChartPng(result: QrProjectResult, signal?: AbortSignal): Promise<Blob> {
    signal?.throwIfAborted();
    const snapshot = snapshotQrExport(result), { grid } = snapshot, cell = 12, margin = 36;
    const canvas = document.createElement('canvas');
    canvas.width = grid.width * cell + margin * 2; canvas.height = grid.height * cell + margin * 2 + 24;
    try {
        const context = canvas.getContext('2d');
        if (!context) throw new Error('PNG_GENERATION_FAILED');
        context.imageSmoothingEnabled = false;
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < grid.height; y++) {
            signal?.throwIfAborted();
            for (let x = 0; x < grid.width; x++) {
                const offset = (y * grid.width + x) * 4;
                context.fillStyle = `rgb(${grid.pixels[offset]},${grid.pixels[offset + 1]},${grid.pixels[offset + 2]})`;
                context.fillRect(margin + x * cell, margin + y * cell, cell, cell);
            }
        }
        context.strokeStyle = '#68736d';
        for (let n = 0; n <= grid.width; n++) {
            context.lineWidth = n % snapshot.palette.boardSize === 0 || n === grid.width ? 2 : 0.5;
            context.beginPath(); context.moveTo(margin + n * cell, margin); context.lineTo(margin + n * cell, margin + grid.height * cell); context.stroke();
        }
        for (let n = 0; n <= grid.height; n++) {
            context.lineWidth = n % snapshot.palette.boardSize === 0 || n === grid.height ? 2 : 0.5;
            context.beginPath(); context.moveTo(margin, margin + n * cell); context.lineTo(margin + grid.width * cell, margin + n * cell); context.stroke();
        }
        context.font = '10px sans-serif'; context.fillStyle = '#18231d'; context.textAlign = 'center';
        for (let n = 0; n < grid.width; n++) if (n === 0 || n === grid.width - 1 || (n + 1) % 5 === 0) {
            context.fillText(String(n + 1), margin + (n + 0.5) * cell, margin - 8);
        }
        context.textAlign = 'right';
        for (let n = 0; n < grid.height; n++) if (n === 0 || n === grid.height - 1 || (n + 1) % 5 === 0) {
            context.fillText(String(n + 1), margin - 7, margin + (n + 0.75) * cell);
        }
        context.textAlign = 'left';
        context.fillText(snapshot.usage.map(entry => `${entry.color.ref}: ${entry.count}`).join(' | '), margin, canvas.height - 18);
        const blob = await canvasPng(canvas, signal); signal?.throwIfAborted(); return blob;
    } finally { canvas.width = 0; canvas.height = 0; }
}

export async function exportQrPng(result: QrProjectResult, signal?: AbortSignal): Promise<void> {
    const blob = await createQrPng(result, signal); signal?.throwIfAborted(); downloadBlob(blob, 'bead-qr.png');
}

export async function exportQrChartPng(result: QrProjectResult, signal?: AbortSignal): Promise<void> {
    const blob = await createQrChartPng(result, signal); signal?.throwIfAborted(); downloadBlob(blob, 'bead-qr-counting-chart.png');
}

export async function exportQrPdf(result: QrProjectResult, state: QrState, locale: SiteLocale, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    const { createQrPdf } = await import('./pdf'); signal?.throwIfAborted();
    const bytes = await createQrPdf(result, state, locale, signal); signal?.throwIfAborted();
    downloadBlob(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), 'bead-qr-pattern.pdf');
}

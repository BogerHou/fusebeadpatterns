import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLetterPalettes } from '../bead-letters/data';
import { buildQrProject, defaultQrState } from './project';
import { createQrChartPng, createQrPng, exportQrChartPng, exportQrPdf, exportQrPng, snapshotQrExport, verifyQrPng } from './export';
import type { QrState } from './types';

const adapters = vi.hoisted(() => ({ download: vi.fn(), pdf: vi.fn(async () => new Uint8Array([37, 80, 68, 70])) }));
vi.mock('../core/printer/download', () => ({ downloadBlob: adapters.download }));
// Adapter tests never author PDFs. Actual PDF-byte tests live in pdf.test.ts.
vi.mock('./pdf', () => ({ createQrPdf: adapters.pdf }));

const palettes = getLetterPalettes();
const state = (patch: Partial<QrState> = {}): QrState => ({ ...defaultQrState(palettes), ...patch });

class PixelCanvas {
    width = 0; height = 0; pixels = new Uint8ClampedArray();
    fills: number[][] = []; lineWidths: number[] = [];
    context = {
        imageSmoothingEnabled: true, fillStyle: '#ffffff', strokeStyle: '#000000', lineWidth: 1,
        font: '', textAlign: 'left',
        createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
        putImageData: (image: { data: Uint8ClampedArray }) => { this.pixels = image.data.slice(); },
        getImageData: () => ({ data: this.pixels.slice() }),
        drawImage: (bitmap: { pixels: Uint8ClampedArray }) => { this.pixels = bitmap.pixels.slice(); },
        fillRect: (x: number, y: number, width: number, height: number) => {
            this.fills.push([x, y, width, height]);
            if (this.pixels.length !== this.width * this.height * 4) this.pixels = new Uint8ClampedArray(this.width * this.height * 4);
            const source = this.context.fillStyle;
            const values = source.startsWith('#') ? [1, 3, 5].map(n => parseInt(source.slice(n, n + 2), 16)) : source.match(/\d+/g)!.map(Number);
            for (let dy = y; dy < y + height; dy++) for (let dx = x; dx < x + width; dx++) this.pixels.set([...values.slice(0, 3), 255], (dy * this.width + dx) * 4);
        },
        beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, fillText: () => {},
        stroke: () => { this.lineWidths.push(this.context.lineWidth); },
    };
    getContext() { return this.context; }
    toBlob(callback: BlobCallback) {
        const raw = Buffer.from(this.pixels), width = this.width, height = this.height;
        void sharp(raw, { raw: { width, height, channels: 4 } }).png().toBuffer()
            .then(bytes => callback(new Blob([new Uint8Array(bytes)], { type: 'image/png' })));
    }
}

const canvases: PixelCanvas[] = [], bitmaps: Array<{ close: ReturnType<typeof vi.fn> }> = [];
beforeEach(() => {
    canvases.length = 0; bitmaps.length = 0; adapters.download.mockClear(); adapters.pdf.mockClear();
    vi.stubGlobal('document', { createElement: vi.fn((tag: string) => {
        if (tag !== 'canvas') throw new Error('Unexpected element');
        const canvas = new PixelCanvas(); canvases.push(canvas); return canvas;
    }) });
    vi.stubGlobal('createImageBitmap', vi.fn(async (blob: Blob) => {
        const { data, info } = await sharp(Buffer.from(await blob.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const bitmap = { width: info.width, height: info.height, pixels: new Uint8ClampedArray(data), close: vi.fn() };
        bitmaps.push(bitmap); return bitmap;
    }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('actual QR PNG encoding and independent byte decoder', () => {
    it('exports exactly8opaque pixels per bead in the actual two brand RGB colors, with no board padding', async () => {
        const result = buildQrProject(state(), palettes), blob = await createQrPng(result);
        const { data, info } = await sharp(Buffer.from(await blob.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        expect([info.width, info.height]).toEqual([result.grid.width * 8, result.grid.height * 8]);
        const expected = new Uint8Array(data.length), source = new Uint8ClampedArray(result.grid.pixels);
        for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
            const offset = (Math.floor(y / 8) * result.grid.width + Math.floor(x / 8)) * 4;
            expected.set(source.subarray(offset, offset + 4), (y * info.width + x) * 4);
        }
        // Compare every decoded pixel at once; avoid thousands of assertion objects and repeated source copies.
        expect(Buffer.compare(data, Buffer.from(expected))).toBe(0);
        expect(canvases[0].context.imageSmoothingEnabled).toBe(false);
        expect([canvases[0].width, canvases[0].height]).toEqual([0, 0]);
        expect(adapters.download).not.toHaveBeenCalled();
    });

    it.each(['https://fusebeadpatterns.art', 'Hello\n豆🙂', ' a+b?x=1&y=2 '])('decodes actual PNG bytes back to exact UTF-8 content: %s', async text => {
        const result = buildQrProject(state({ text }), palettes), blob = await createQrPng(result);
        await expect(verifyQrPng(blob, text)).resolves.toBe(true);
        await expect(verifyQrPng(blob, text + ' ')).resolves.toBe(false);
        expect(bitmaps.every(bitmap => bitmap.close.mock.calls.length === 1)).toBe(true);
        expect(canvases.every(canvas => canvas.width === 0 && canvas.height === 0)).toBe(true);
    });

    it.each([
        ['hama', 'H18', 'H01'], ['artkal_s', 'S13', 'S01'],
    ] as const)('uses actual %s colors and an integer3×3module expansion', async (paletteId, foregroundRef, backgroundRef) => {
        const input = state({ text: 'BRAND', paletteId, foregroundRef, backgroundRef, beadsPerModule: 3 });
        const blob = await createQrPng(buildQrProject(input, palettes));
        await expect(verifyQrPng(blob, input.text)).resolves.toBe(true);
    });

    it('returns false for a real opaque image that contains no QR and releases the decoded bitmap', async () => {
        const bytes = await sharp({ create: { width: 232, height: 232, channels: 4, background: '#ffffff' } }).png().toBuffer();
        await expect(verifyQrPng(new Blob([new Uint8Array(bytes)], { type: 'image/png' }), 'not encoded')).resolves.toBe(false);
        expect(bitmaps[0].close).toHaveBeenCalledOnce();
    });

    it('does not validate a transparent image against an implicit background', async () => {
        const bytes = await sharp({ create: { width: 232, height: 232, channels: 4, background: '#00000000' } }).png().toBuffer();
        await expect(verifyQrPng(new Blob([new Uint8Array(bytes)], { type: 'image/png' }), 'anything')).resolves.toBe(false);
        expect(bitmaps[0].close).toHaveBeenCalledOnce();
    });

    it('rejects invalid container types before decoding or allocating a canvas', async () => {
        await expect(verifyQrPng(new Blob(['x'], { type: 'text/plain' }), 'x')).rejects.toThrow('INVALID_PROJECT');
        expect(createImageBitmap).not.toHaveBeenCalled(); expect(canvases).toHaveLength(0);
    });

    it('rejects inconsistent generated grid, mask, materials and saved board instead of exporting another QR', () => {
        for (const change of [
            (result: ReturnType<typeof buildQrProject>) => { result.pattern.mask[0] = 1; },
            (result: ReturnType<typeof buildQrProject>) => { result.usage[1].count--; },
            (result: ReturnType<typeof buildQrProject>) => { result.draft.boardWidth++; },
            (result: ReturnType<typeof buildQrProject>) => { result.pattern.darkBeads++; },
        ]) {
            const result = buildQrProject(state(), palettes); change(result);
            expect(() => snapshotQrExport(result)).toThrow('INVALID_PROJECT');
        }
    });
});

describe('download adapters, counting grid and owner cancellation', () => {
    it('keeps the counting chart a separate larger export and marks actual brand-board boundaries', async () => {
        const result = buildQrProject(state(), palettes), blob = await createQrChartPng(result);
        const info = await sharp(Buffer.from(await blob.arrayBuffer())).metadata();
        expect([info.width, info.height]).toEqual([result.grid.width * 12 + 72, result.grid.height * 12 + 96]);
        expect(canvases[0].lineWidths.filter(width => width === 2)).toHaveLength(6);
        expect(canvases[0].lineWidths).toContain(.5);
        expect([canvases[0].width, canvases[0].height]).toEqual([0, 0]);
    });

    it('downloads each format using its own correct filename and never downloads during a scan check', async () => {
        const input = state(), result = buildQrProject(input, palettes);
        await exportQrPng(result); await exportQrChartPng(result); await exportQrPdf(result, input, 'ja');
        expect(adapters.download.mock.calls.map(call => call[1])).toEqual(['bead-qr.png', 'bead-qr-counting-chart.png', 'bead-qr-pattern.pdf']);
        expect(adapters.pdf).toHaveBeenCalledWith(result, input, 'ja', undefined);
    });

    it('creates no canvas, bitmap or PDF and no download when already aborted', async () => {
        const input = state(), result = buildQrProject(input, palettes), controller = new AbortController(); controller.abort();
        for (const pending of [createQrPng(result, controller.signal), createQrChartPng(result, controller.signal),
            verifyQrPng(new Blob(['x'], { type: 'image/png' }), input.text, controller.signal), exportQrPdf(result, input, 'ja', controller.signal)]) {
            await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        }
        expect(canvases).toHaveLength(0); expect(createImageBitmap).not.toHaveBeenCalled();
        expect(adapters.pdf).not.toHaveBeenCalled(); expect(adapters.download).not.toHaveBeenCalled();
    });

    it('cancels an in-flight PNG immediately, frees its canvas and ignores a late encoding callback', async () => {
        let callback: BlobCallback | undefined;
        vi.stubGlobal('document', { createElement: () => {
            const canvas = new PixelCanvas(); canvas.toBlob = cb => { callback = cb; }; canvases.push(canvas); return canvas;
        } });
        const controller = new AbortController(), pending = exportQrPng(buildQrProject(state(), palettes), controller.signal);
        const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(callback).toBeDefined(); controller.abort(); await rejection;
        expect([canvases[0].width, canvases[0].height]).toEqual([0, 0]);
        callback!(new Blob(['late'], { type: 'image/png' })); expect(adapters.download).not.toHaveBeenCalled();
    });

    it('closes a bitmap resolved after cancellation, without drawing or treating it as verified', async () => {
        let complete: ((value: { width: number; height: number; close: () => void }) => void) | undefined;
        const close = vi.fn(); vi.stubGlobal('createImageBitmap', () => new Promise(resolve => { complete = resolve; }));
        const controller = new AbortController(), pending = verifyQrPng(new Blob(['x'], { type: 'image/png' }), 'x', controller.signal);
        const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        controller.abort(); complete!({ width: 232, height: 232, close }); await rejection;
        expect(close).toHaveBeenCalledOnce(); expect(canvases).toHaveLength(0);
    });

    it('rejects failed/null PNG encoding and still frees all canvas resources', async () => {
        vi.stubGlobal('document', { createElement: () => {
            const canvas = new PixelCanvas(); canvas.toBlob = cb => cb(null); canvases.push(canvas); return canvas;
        } });
        await expect(exportQrPng(buildQrProject(state(), palettes))).rejects.toThrow('PNG_GENERATION_FAILED');
        expect([canvases[0].width, canvases[0].height]).toEqual([0, 0]); expect(adapters.download).not.toHaveBeenCalled();
    });
});

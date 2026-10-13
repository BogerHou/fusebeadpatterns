import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawImageInsideCanvas } from '../core/utils/utils';
import { maskSourceBackground, readSourceBackgroundImage, readDecodedSourceBackgroundImage,
    sourceBackgroundDrawingPosition, applySourceBackgroundEmptyMask } from './source-background-processing';
import { runSourceBackgroundMask, type SourceBackgroundMaskRequest } from './source-background';
import type { RendererConfiguration } from '../core/model/configuration/renderer-configuration.model';
import type { EditorSourceCrop } from '../core/utils/image-crop';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function request(width = 64, height = 64): SourceBackgroundMaskRequest {
    const pixels = new Uint8ClampedArray(width * height * 4).fill(255);
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) pixels.set([100, 20, 30, 255], (y * width + x) * 4);
    return { pixels, width, height, background: { color: { r: 255, g: 255, b: 255 }, tolerance: 0, mode: 'edge-connected' } };
}
type Reply = { data: unknown };
function fakeWorker(reply: (job: SourceBackgroundMaskRequest & { id: number }, callback: (value: Reply) => void) => void) {
    let transferred: Uint8ClampedArray | undefined;
    const worker = {
        onmessage: null as ((event: Reply) => void) | null, onerror: null as ((event: ErrorEvent) => void) | null, onmessageerror: null as (() => void) | null,
        terminate: vi.fn(),
        postMessage(job: SourceBackgroundMaskRequest & { id: number }, transfer: Transferable[]) {
            transferred = job.pixels;
            const received = structuredClone(job, { transfer });
            const callback = worker.onmessage!;
            queueMicrotask(() => { callback({ data: { type: 'ready' } }); reply(received, callback); });
        },
    };
    return { worker, factory: () => worker as unknown as Worker, transferred: () => transferred };
}

describe('background worker/fallback atomic boundaries', () => {
    it('worker transfers only a copy and matches fallback while preserving the captured source', async () => {
        const input = request(), before = input.pixels.slice();
        const worker = fakeWorker((job, callback) => callback({ data: { type: 'result', id: job.id, ...runSourceBackgroundMask(job) } }));
        const pending = maskSourceBackground(input, { workerFactory: worker.factory });
        input.pixels.fill(0);
        const actual = await pending, expected = await maskSourceBackground({ ...input, pixels: before });
        expect(Buffer.from(actual.pixels).equals(Buffer.from(expected.pixels))).toBe(true);
        expect(Buffer.from(actual.mask).equals(Buffer.from(expected.mask))).toBe(true);
        expect(input.pixels.byteLength).toBe(16384);
        expect(worker.transferred()!.byteLength).toBe(0);
        expect(worker.worker.terminate).toHaveBeenCalledOnce();
    });

    it.each(['wrong-id', 'wrong-size', 'invalid-bit', 'changed-source'] as const)('does not publish a malformed %s response', async kind => {
        const input = request(), expected = runSourceBackgroundMask(input);
        const worker = fakeWorker((job, callback) => {
            const result = runSourceBackgroundMask(job);
            if (kind === 'invalid-bit') result.mask[0] = 2;
            if (kind === 'changed-source') result.pixels[(65 * 4)] = 0;
            callback({ data: { type: 'result', id: kind === 'wrong-id' ? job.id - 1 : job.id,
                pixels: kind === 'wrong-size' ? new Uint8ClampedArray(0) : result.pixels, mask: result.mask } });
        });
        const actual = await maskSourceBackground(input, { workerFactory: worker.factory });
        expect(Buffer.from(actual.pixels).equals(Buffer.from(expected.pixels))).toBe(true);
        expect(Buffer.from(actual.mask).equals(Buffer.from(expected.mask))).toBe(true);
        expect(worker.worker.terminate).toHaveBeenCalledOnce();
    });

    it('aborts worker without falling back and ignores a captured late reply', async () => {
        const task = new AbortController(), input = request();
        let late: (() => void) | undefined;
        const worker = fakeWorker((job, callback) => { late = () => callback({ data: { type: 'result', id: job.id, ...runSourceBackgroundMask(job) } }); });
        const pending = maskSourceBackground(input, { signal: task.signal, workerFactory: worker.factory });
        await Promise.resolve(); task.abort(); late!();
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(worker.worker.terminate).toHaveBeenCalledOnce();
        expect(input.pixels[3]).toBe(255);
    });

    it('cancels cooperative traversal after its first bounded time slice, leaving caller bytes intact', async () => {
        vi.stubGlobal('Worker', undefined);
        const input = request(512, 512), before = input.pixels.slice(), task = new AbortController();
        // Force deterministic short slices without lengthening timers or fixture work.
        let time = 0; vi.spyOn(performance, 'now').mockImplementation(() => time += 9);
        const pending = maskSourceBackground(input, { signal: task.signal });
        setTimeout(() => task.abort(), 0);
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(Buffer.from(input.pixels).equals(Buffer.from(before))).toBe(true);
        const aborted = new AbortController(); aborted.abort();
        await expect(maskSourceBackground(input, { signal: aborted.signal })).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('validates source budgets before worker creation or copying invalid data', async () => {
        const factory = vi.fn();
        await expect(maskSourceBackground({ ...request(1, 1), width: 16385 }, { workerFactory: factory })).rejects.toThrow();
        expect(factory).not.toHaveBeenCalled();
    });
});

describe('natural source ROI and exact target geometry', () => {
    function surface(sourceWidth: number, sourceHeight: number, pixels: Uint8ClampedArray) {
        const context = { filter: 'wrong', imageSmoothingEnabled: true, drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: pixels.slice() })) };
        const canvas = { width: 0, height: 0, getContext: () => context }, create = vi.fn(() => canvas);
        class Image {
            naturalWidth = sourceWidth; naturalHeight = sourceHeight;
            width = 1; height = 1; style = { filter: '' };
            onload: (() => void) | null = null; onerror: (() => void) | null = null;
            set src(_value: string) { queueMicrotask(() => this.onload?.()); }
        }
        vi.stubGlobal('document', { createElement: create }); vi.stubGlobal('window', { Image });
        return { context, canvas, create, image: new Image() as unknown as HTMLImageElement };
    }

    it('reads unfiltered natural ROI pixels, not CSS dimensions, and releases its canvas', async () => {
        const pixels = new Uint8ClampedArray([255, 255, 255, 255, 5, 7, 9, 128]), ui = surface(8, 6, pixels);
        const crop = { sourceWidth: 8, sourceHeight: 6, x: 3, y: 4, width: 2, height: 1 };
        const result = await readSourceBackgroundImage('original', crop, new AbortController().signal);
        expect([result.width, result.height, result.sourceWidth, result.sourceHeight, result.x, result.y]).toEqual([2, 1, 8, 6, 3, 4]);
        expect(ui.context.drawImage.mock.calls[0].slice(1)).toEqual([3, 4, 2, 1, 0, 0, 2, 1]);
        expect(ui.context.filter).toBe('none'); expect(ui.context.imageSmoothingEnabled).toBe(false);
        expect([...result.pixels]).toEqual([...pixels]); expect([ui.canvas.width, ui.canvas.height]).toEqual([0, 0]);
    });

    it('rejects over-budget ROI and decoded-size mismatch before canvas allocation; permits a bounded crop of a large source', () => {
        const ui = surface(20000, 20000, new Uint8ClampedArray(4)), signal = new AbortController().signal;
        expect(() => readDecodedSourceBackgroundImage(ui.image, null, signal)).toThrow(); expect(ui.create).not.toHaveBeenCalled();
        expect(() => readDecodedSourceBackgroundImage(ui.image, { sourceWidth: 2, sourceHeight: 2, x: 0, y: 0, width: 1, height: 1 }, signal)).toThrow();
        expect(ui.create).not.toHaveBeenCalled();
        const result = readDecodedSourceBackgroundImage(ui.image, { sourceWidth: 20000, sourceHeight: 20000, x: 19999, y: 19999, width: 1, height: 1 }, signal);
        expect([result.width, result.height, result.x, result.y]).toEqual([1, 1, 19999, 19999]);
    });

    it('preserves both legacy uncropped and integer-cropped fit/center geometry including zero/narrow and oversized cases', () => {
        const image = { width: 1000, height: 1, naturalWidth: 1000, naturalHeight: 1000, style: { filter: 'none' } } as HTMLImageElement;
        const context = { drawImage: vi.fn(), filter: '' }, canvas = { width: 29, height: 57, getContext: () => context } as unknown as HTMLCanvasElement;
        const crops: Array<EditorSourceCrop | null> = [null, { sourceWidth: 1000, sourceHeight: 1000, x: 0, y: 0, width: 1, height: 1000 }, { sourceWidth: 1000, sourceHeight: 1000, x: 7, y: 11, width: 40, height: 60 }];
        for (const crop of crops) for (const fit of [false, true]) for (const center of [false, true]) {
            const renderer = { fit, center } as RendererConfiguration;
            const expected = drawImageInsideCanvas(canvas, image, renderer, crop);
            const actual = sourceBackgroundDrawingPosition(29, 57, crop?.width ?? image.width, crop?.height ?? image.height, renderer, Boolean(crop));
            expect(actual).toEqual({ xStart: expected.xStart, yStart: expected.yStart, width: expected.width, height: expected.height });
        }
    });

    it('erases interpolated/filter alpha using explicit nearest-mask coordinates and clips negative drawing bounds', async () => {
        const pixels = new Uint8ClampedArray(5 * 3 * 4);
        for (let i = 0; i < 15; i++) pixels.set([71, 89, 95, 128], i * 4);
        await applySourceBackgroundEmptyMask(pixels, 5, 3, { width: 3, height: 2, mask: new Uint8Array([1, 0, 1, 0, 1, 0]) },
            { xStart: 1, yStart: 1, width: 3, height: 2 }, new AbortController().signal);
        for (let i = 0; i < 15; i++) expect([...pixels.subarray(i * 4, i * 4 + 4)]).toEqual([6, 8, 12].includes(i) ? [71, 89, 95, 128] : [0, 0, 0, 0]);
        const clipped = new Uint8ClampedArray(16).fill(255);
        await applySourceBackgroundEmptyMask(clipped, 2, 2, { width: 2, height: 2, mask: new Uint8Array([1, 0, 0, 1]) },
            { xStart: -1, yStart: -1, width: 4, height: 4 }, new AbortController().signal);
        expect([...clipped]).toEqual([255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255]);
    });
});

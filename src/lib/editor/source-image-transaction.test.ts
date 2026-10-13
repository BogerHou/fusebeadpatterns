import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EditorSourceCrop } from '../core/utils/image-crop';
import { SourceImageTransactions, decodeSourceImage, readSourceImageFile, prepareSourceImagePattern, commitSourceImageCanvas, type PreparedSourceImage } from './source-image-transaction';
import { buildEditorProject } from './project';
import { BOARD_OPTIONS } from './config';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { Color } from '../core/model/color/color.model';

vi.mock('./pattern-quantization', () => ({
    // Palette matching has its independent tests. These cases isolate source
    // preparation, restoration and publication from matching/worker behavior.
    quantizePattern: vi.fn(async ({ pixels }: { pixels: Uint8ClampedArray }) => pixels.slice()),
}));
afterEach(() => vi.unstubAllGlobals());

function deferred<T>() {
    let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

describe('source image transactions preserve a complete accepted document', () => {
    const checkpoint = () => ({ source: 'old-original', crop: null as EditorSourceCrop | null, pixels: [1, 2, 3, 255, 8, 9, 10, 0], usage: [['old', 1]], undo: ['stroke'], redo: ['erasure'] });

    it('publishes source, crop, grid and materials only after preparation succeeds', async () => {
        const jobs = new SourceImageTransactions(), pending = deferred<ReturnType<typeof checkpoint>>();
        let current = checkpoint();
        const before = structuredClone(current), next = { ...checkpoint(), source: 'new-original', crop: { sourceWidth: 3, sourceHeight: 2, x: 1, y: 0, width: 2, height: 2 } };
        const task = jobs.begin(), run = jobs.prepare(task, () => pending.promise, value => { current = value; });
        expect(current).toEqual(before);
        pending.resolve(next);
        expect(await run).toBe(true);
        expect(current).toBe(next);
        expect(jobs.finish(task)).toBe(true);
        expect(jobs.pending).toBe(false);
    });

    it.each(['cancel', 'replace', 'restore'] as const)('rejects a late successful result after %s without changing source, transparent cells or both history branches', async action => {
        const jobs = new SourceImageTransactions(), pending = deferred<ReturnType<typeof checkpoint>>();
        const current = checkpoint(), before = structuredClone(current), publish = vi.fn();
        const old = jobs.begin(), run = jobs.prepare(old, () => pending.promise, publish);
        if (action === 'replace') jobs.begin(); else jobs.cancel();
        pending.resolve({ ...checkpoint(), source: 'stale' });
        expect(await run).toBe(false);
        expect(publish).not.toHaveBeenCalled();
        expect(current).toEqual(before);
        expect(jobs.finish(old)).toBe(false);
        expect(jobs.pending).toBe(action === 'replace');
    });

    it('keeps the old document on decode/quantization/preview failure and ignores a late old failure', async () => {
        const jobs = new SourceImageTransactions(), publish = vi.fn(), before = checkpoint();
        for (const message of ['decode', 'quantization', 'preview']) {
            const task = jobs.begin();
            await expect(jobs.prepare(task, async () => { throw new Error(message); }, publish)).rejects.toThrow(message);
            expect(checkpoint()).toEqual(before);
            expect(publish).not.toHaveBeenCalled();
        }
        const oldFailure = deferred<string>(), old = jobs.begin();
        const staleRun = jobs.prepare(old, () => oldFailure.promise, publish);
        const next = jobs.begin();
        oldFailure.reject(new Error('stale failure'));
        expect(await staleRun).toBe(false);
        expect(jobs.isCurrent(next)).toBe(true);
    });
});

describe('abortable source decoding', () => {
    it('aborts FileReader and detaches every handler before a late load can affect the workspace', async () => {
        const reader = { result: null as string | null, onload: null as (() => void) | null, onerror: null as (() => void) | null, onabort: null as (() => void) | null, readAsDataURL: vi.fn(), abort: vi.fn() };
        const task = new AbortController();
        const read = readSourceImageFile({ name: 'image.png' } as File, task.signal, () => reader as unknown as FileReader);
        const lateLoad = reader.onload!;
        task.abort();
        reader.result = 'data:image/png;base64,late';
        lateLoad();
        await expect(read).rejects.toMatchObject({ name: 'AbortError' });
        expect(reader.abort).toHaveBeenCalledOnce();
        expect(reader.onload).toBeNull();
        expect(reader.onerror).toBeNull();
        expect(reader.onabort).toBeNull();
    });

    it('reports a read error or missing result without publishing a replacement source', async () => {
        for (const mode of ['error', 'empty']) {
            const reader = { result: null as string | null, onload: null as (() => void) | null, onerror: null as (() => void) | null, onabort: null as (() => void) | null, readAsDataURL: vi.fn(), abort: vi.fn() };
            const read = readSourceImageFile({} as File, new AbortController().signal, () => reader as unknown as FileReader);
            if (mode === 'error') (reader.onerror as unknown as () => void)(); else (reader.onload as unknown as () => void)();
            await expect(read).rejects.toThrow('Unable to read selected image.');
        }
    });

    it('uses decoded natural dimensions even when an image has different CSS dimensions', async () => {
        const image = { naturalWidth: 640, naturalHeight: 480, width: 160, height: 120, style: { filter: '' }, src: '', onload: null as (() => void) | null, onerror: null as (() => void) | null };
        const decoded = decodeSourceImage('data:image/jpeg;base64,original', 'contrast(100%)', new AbortController().signal, () => image as unknown as HTMLImageElement);
        (image.onload as unknown as () => void)();
        expect(await decoded).toBe(image);
        expect(image.style.filter).toBe('contrast(100%)');
        expect(image.onload).toBeNull();
    });

    it('settles image cancellation without allowing a captured late decoder callback to publish', async () => {
        const image = { naturalWidth: 10, naturalHeight: 20, style: { filter: '' }, src: '', onload: null as (() => void) | null, onerror: null as (() => void) | null };
        const task = new AbortController();
        const decoded = decodeSourceImage('old', '', task.signal, () => image as unknown as HTMLImageElement);
        const late = image.onload as unknown as () => void;
        task.abort(); late();
        await expect(decoded).rejects.toMatchObject({ name: 'AbortError' });
        expect(image.onload).toBeNull();
        expect(image.onerror).toBeNull();
    });
});

describe('real preparation and canvas publication boundaries', () => {
    function project() {
        const entry = new PaletteEntry('red', new Color(255, 0, 0, 255));
        const palette = new Palette('test', [entry]);
        return buildEditorProject({ palettes: [palette], boardOption: BOARD_OPTIONS[0], boardWidth: 1, boardHeight: 1,
            matchingId: 'euclidean', ditheringId: 'none',
            imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
            rendererSettings: { center: true, fit: true, showGrid: false }, useSymbols: false });
    }

    function sourceSurface(pixels: Uint8ClampedArray) {
        class TestImage {
            width = 4; height = 2; naturalWidth = 4; naturalHeight = 2;
            style = { filter: '' }; onload: (() => void) | null = null; onerror: (() => void) | null = null;
            set src(_value: string) { queueMicrotask(() => this.onload?.()); }
        }
        const context = { filter: '', drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: pixels.slice() })) };
        const canvas = { width: 0, height: 0, getContext: () => context };
        vi.stubGlobal('window', { Image: TestImage });
        vi.stubGlobal('document', { createElement: () => canvas });
        return { context, canvas };
    }

    it('restores the authoritative edited RGBA without cropping, filtering or re-quantizing it even when source dimensions differ', async () => {
        const original = new Uint8ClampedArray([17, 28, 39, 0, 90, 80, 70, 128]);
        const { context, canvas } = sourceSurface(new Uint8ClampedArray(8));
        const prepared = await prepareSourceImagePattern({ src: 'original', fileName: 'saved', crop:
            { sourceWidth: 8, sourceHeight: 6, x: 1, y: 1, width: 4, height: 3 }, project: project(),
            width: 2, height: 1, matchingId: 'euclidean', restoredPixels: original }, new AbortController().signal);
        expect(Array.from(prepared.pixels)).toEqual(Array.from(original));
        expect(prepared.pixels).not.toBe(original);
        expect(context.drawImage).not.toHaveBeenCalled();
        expect(context.getImageData).not.toHaveBeenCalled();
        expect(canvas.width).toBe(0);
        expect(canvas.height).toBe(0);
    });

    it('passes the exact original rectangle to the shared sampler and keeps a separate Project snapshot', async () => {
        const sampled = new Uint8ClampedArray([255, 0, 0, 255, 44, 55, 66, 0]);
        const { context, canvas } = sourceSurface(sampled);
        const current = project(), candidate = project();
        const prepared = await prepareSourceImagePattern({ src: 'new-original', fileName: 'candidate', crop:
            { sourceWidth: 4, sourceHeight: 2, x: 2, y: 0, width: 2, height: 1 }, project: candidate,
            width: 2, height: 1, matchingId: 'euclidean' }, new AbortController().signal);
        expect(context.drawImage.mock.calls[0].slice(1)).toEqual([2, 0, 2, 1, 0, 0, 2, 1]);
        expect(Array.from(prepared.pixels)).toEqual(Array.from(sampled));
        expect(prepared.project).toBe(candidate);
        expect(current.image).toBeUndefined();
        expect(candidate.image.name).toBe('candidate');
        expect(canvas.width).toBe(0);
        expect(canvas.height).toBe(0);
    });

    it('rejects a new generation with mismatched decoded dimensions and releases the offscreen canvas', async () => {
        const { context, canvas } = sourceSurface(new Uint8ClampedArray(8));
        await expect(prepareSourceImagePattern({ src: 'original', fileName: 'candidate', crop:
            { sourceWidth: 8, sourceHeight: 2, x: 1, y: 0, width: 2, height: 1 }, project: project(),
            width: 2, height: 1, matchingId: 'euclidean' }, new AbortController().signal)).rejects.toThrow();
        expect(context.drawImage).not.toHaveBeenCalled();
        expect(canvas.width).toBe(0);
        expect(canvas.height).toBe(0);
    });

    it('restores the actual old raster and dimensions after a prepared write fails, without publishing source/model/history', async () => {
        const old = new Uint8ClampedArray([4, 5, 6, 0, 7, 8, 9, 128]);
        let actualPixels = old.slice(), fail = true;
        const context = {
            createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
            putImageData: (data: { data: Uint8ClampedArray }) => {
                if (fail) { fail = false; throw new Error('raster write rejected'); }
                actualPixels = data.data.slice();
            },
        };
        const canvas = { width: 2, height: 1, getContext: () => context } as unknown as HTMLCanvasElement;
        const prepared: PreparedSourceImage = { project: project(), pixels: new Uint8ClampedArray(12), width: 3, height: 1 };
        const jobs = new SourceImageTransactions(), task = jobs.begin(), accepted = { source: 'original', history: ['edited'], crop: null as EditorSourceCrop | null };
        const before = structuredClone(accepted), publish = vi.fn();
        await expect(jobs.prepare(task, async () => prepared, result => {
            commitSourceImageCanvas(canvas, result, old);
            publish();
            accepted.source = 'new';
        })).rejects.toThrow('raster write rejected');
        expect([canvas.width, canvas.height]).toEqual([2, 1]);
        expect(Array.from(actualPixels)).toEqual(Array.from(old));
        expect(accepted).toEqual(before);
        expect(publish).not.toHaveBeenCalled();
    });
});

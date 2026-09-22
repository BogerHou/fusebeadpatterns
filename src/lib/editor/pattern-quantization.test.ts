import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { MATCHING_OPTIONS } from './config';
import { quantizePattern, WORKER_MIN_PATTERN_PIXELS } from './pattern-quantization';
import {
    runPatternQuantization,
    type QuantizationRequest,
    type QuantizationResponse,
} from './quantization-protocol';

function createRequest(width = 64, height = 64): QuantizationRequest {
    const pixels = new Uint8ClampedArray(width * height * 4);
    const colors = [[112, 112, 112, 255], [160, 160, 160, 255], [45, 45, 45, 128], [77, 12, 98, 0]];
    for (let i = 0; i < width * height; i++) pixels.set(colors[i % colors.length], i * 4);
    const disabled = new PaletteEntry('disabled', new Color(112, 112, 112, 255));
    disabled.enabled = false;
    return {
        pixels,
        width,
        height,
        palettes: [new Palette('test', [
            disabled,
            new PaletteEntry('black', new Color(0, 0, 0, 255)),
            new PaletteEntry('white', new Color(255, 255, 255, 255)),
            new PaletteEntry('red', new Color(200, 40, 25, 255)),
        ])],
        matchingId: 'euclidean',
        dithering: { enable: true, hardness: 75 },
        drawingPosition: { x: 0, y: 0, width, height },
    };
}

class FakeWorker {
    onmessage: ((event: MessageEvent<QuantizationResponse>) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;
    onmessageerror: ((event: MessageEvent) => void) | null = null;
    received?: QuantizationRequest;
    terminate = vi.fn();
    postMessage = vi.fn((request: QuantizationRequest, transfer: Transferable[]) => {
        // Exercise real structured cloning and detachment, as a browser does.
        this.received = structuredClone(request, { transfer });
    });

    get worker(): Worker {
        return this as unknown as Worker;
    }

    message(data: unknown): void {
        this.onmessage?.({ data } as MessageEvent<QuantizationResponse>);
    }

    complete(): Uint8ClampedArray {
        const pixels = runPatternQuantization(this.received!);
        this.message({ type: 'result', pixels });
        return pixels;
    }
}

function expectCleaned(worker: FakeWorker): void {
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.onmessage).toBeNull();
    expect(worker.onerror).toBeNull();
    expect(worker.onmessageerror).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('pattern quantization execution paths', () => {
    it('converts small patterns after yielding without constructing a worker', async () => {
        const request = createRequest(4, 4);
        const before = request.pixels.slice();
        const expected = runPatternQuantization(structuredClone(request));
        const workerFactory = vi.fn(() => new FakeWorker().worker);

        const pending = quantizePattern(request, { workerFactory });

        expect(request.pixels).toEqual(before);
        expect(workerFactory).not.toHaveBeenCalled();
        await vi.runAllTimersAsync();
        expect(await pending).toEqual(expected);
    });

    it('falls back when Worker is unavailable', async () => {
        vi.stubGlobal('Worker', undefined);
        const request = createRequest();
        const expected = runPatternQuantization(structuredClone(request));

        const pending = quantizePattern(request);
        await vi.runAllTimersAsync();

        expect(await pending).toEqual(expected);
    });

    it('transfers a copy and preserves the original input when a worker succeeds', async () => {
        const request = createRequest();
        expect(request.width * request.height).toBe(WORKER_MIN_PATTERN_PIXELS);
        const before = request.pixels.slice();
        const expected = runPatternQuantization(structuredClone(request));
        const worker = new FakeWorker();
        const controller = new AbortController();
        const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
        const pending = quantizePattern(request, {
            workerFactory: () => worker.worker,
            signal: controller.signal,
        });

        expect(worker.postMessage).toHaveBeenCalledOnce();
        const [sent, transfer] = worker.postMessage.mock.calls[0];
        expect(sent.pixels === request.pixels).toBe(false);
        expect(transfer).toHaveLength(1);
        expect(transfer[0] === sent.pixels.buffer).toBe(true);
        expect(sent.pixels.byteLength).toBe(0);
        expect(worker.received?.pixels).toEqual(before);
        expect(request.pixels).toEqual(before);

        const result = worker.complete();

        expect(await pending).toBe(result);
        expect(result).toEqual(expected);
        expect(request.pixels).toEqual(before);
        expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
        expectCleaned(worker);
    });

    it('rejects an already-aborted request before starting work', async () => {
        const controller = new AbortController();
        controller.abort();
        const workerFactory = vi.fn(() => new FakeWorker().worker);
        const request = createRequest();
        const before = request.pixels.slice();

        await expect(quantizePattern(request, { signal: controller.signal, workerFactory }))
            .rejects.toMatchObject({ name: 'AbortError' });

        expect(workerFactory).not.toHaveBeenCalled();
        expect(request.pixels).toEqual(before);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('terminates an aborted worker without running fallback', async () => {
        const controller = new AbortController();
        const worker = new FakeWorker();
        const request = createRequest();
        const before = request.pixels.slice();
        const pending = quantizePattern(request, {
            signal: controller.signal,
            workerFactory: () => worker.worker,
        });
        const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });

        controller.abort();
        await rejected;
        await vi.runAllTimersAsync();

        expect(request.pixels).toEqual(before);
        expectCleaned(worker);
    });

    it('falls back when constructing a worker fails', async () => {
        const request = createRequest();
        const expected = runPatternQuantization(structuredClone(request));
        const pending = quantizePattern(request, {
            workerFactory: () => { throw new Error('Worker disabled by browser policy'); },
        });

        await vi.runAllTimersAsync();

        expect(await pending).toEqual(expected);
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['onerror', 'onmessageerror', 'error response', 'invalid type', 'invalid pixels', 'invalid size', 'postMessage throws'])(
        'falls back and cleans up after %s',
        async (failure) => {
            const request = createRequest();
            const expected = runPatternQuantization(structuredClone(request));
            const worker = new FakeWorker();
            const controller = new AbortController();
            const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
            if (failure === 'postMessage throws') {
                worker.postMessage.mockImplementation(() => { throw new Error('Cannot post pixels'); });
            }
            const pending = quantizePattern(request, {
                workerFactory: () => worker.worker,
                signal: controller.signal,
            });

            if (failure === 'onerror') {
                const preventDefault = vi.fn();
                worker.onerror?.({ message: 'Load failed', preventDefault } as unknown as ErrorEvent);
                expect(preventDefault).toHaveBeenCalledOnce();
            } else if (failure === 'onmessageerror') {
                worker.onmessageerror?.({} as MessageEvent);
            } else if (failure === 'error response') {
                worker.message({ type: 'error', message: 'Could not convert' });
            } else if (failure === 'invalid type') {
                worker.message({ type: 'unexpected' });
            } else if (failure === 'invalid pixels') {
                worker.message({ type: 'result', pixels: new Uint8Array(request.pixels.length) });
            } else if (failure === 'invalid size') {
                worker.message({ type: 'result', pixels: new Uint8ClampedArray(4) });
            }
            await vi.runAllTimersAsync();

            expect(await pending).toEqual(expected);
            expect(request.pixels.byteLength).toBe(request.width * request.height * 4);
            expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
            expectCleaned(worker);
        }
    );

    it('falls back when worker startup times out', async () => {
        const request = createRequest();
        const expected = runPatternQuantization(structuredClone(request));
        const worker = new FakeWorker();
        const pending = quantizePattern(request, { workerFactory: () => worker.worker });

        await vi.advanceTimersByTimeAsync(9999);
        expect(worker.terminate).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(worker.terminate).toHaveBeenCalledOnce();
        await vi.runAllTimersAsync();

        expect(await pending).toEqual(expected);
        expectCleaned(worker);
    });

    it('allows slow conversion after ready clears the startup timeout', async () => {
        const request = createRequest();
        const before = request.pixels.slice();
        const worker = new FakeWorker();
        const completed = vi.fn();
        const pending = quantizePattern(request, { workerFactory: () => worker.worker });
        void pending.then(completed);

        await vi.advanceTimersByTimeAsync(9000);
        worker.message({ type: 'ready' });
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(120_000);
        expect(completed).not.toHaveBeenCalled();
        expect(worker.terminate).not.toHaveBeenCalled();
        expect(request.pixels).toEqual(before);
        const result = worker.complete();

        expect(await pending).toBe(result);
        expectCleaned(worker);
    });

    it.each(['small pattern', 'failed worker'])(
        'observes abort during fallback yield for %s',
        async (path) => {
            const request = path === 'small pattern' ? createRequest(4, 4) : createRequest();
            const before = request.pixels.slice();
            const controller = new AbortController();
            const worker = new FakeWorker();
            const pending = quantizePattern(request, {
                signal: controller.signal,
                workerFactory: () => worker.worker,
            });
            const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
            if (path === 'failed worker') {
                worker.message({ type: 'error', message: 'Conversion failed' });
                // Let the rejected worker enter the yielding fallback first.
                await Promise.resolve();
            }
            expect(vi.getTimerCount()).toBe(1);

            controller.abort();
            await vi.runAllTimersAsync();
            await rejected;

            expect(request.pixels).toEqual(before);
            expect(vi.getTimerCount()).toBe(0);
            if (path === 'failed worker') expectCleaned(worker);
        }
    );
});

describe('quantization protocol', () => {
    it.each(MATCHING_OPTIONS)('converts structured-cloned palettes identically with $id', ({ id }) => {
        const request = createRequest(8, 8);
        request.matchingId = id;
        const cloned = structuredClone(request);

        expect(request.palettes[0]).toBeInstanceOf(Palette);
        expect(cloned.palettes[0]).not.toBeInstanceOf(Palette);
        expect(cloned.palettes[0].entries[0].color).not.toBeInstanceOf(Color);
        expect(runPatternQuantization(cloned)).toEqual(runPatternQuantization(request));
    });

    it('uses the existing Euclidean default for an unrecognized matching id', () => {
        const request = createRequest(8, 8);
        const unknown = structuredClone(request);
        unknown.matchingId = 'unknown';

        expect(runPatternQuantization(unknown)).toEqual(runPatternQuantization(request));
    });
});

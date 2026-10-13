import { afterEach, describe, expect, it, vi } from 'vitest';
import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { MATCHINGS } from '../core/model/matching/matching.model';
import { reduceColorPixels } from '../core/utils/utils';
import { MAX_BEAD_COLORS, MAX_LIMIT_PALETTE_ENTRIES, normalizeMaxBeadColors, runBrandColorLimit } from './brand-color-limit';
import { MATCHING_OPTIONS, getMatchingOption } from './config';
import { EDITOR_PROJECT_PATTERN_DIMENSION_MAX } from './editor-limits';
import { limitPatternBeadColors, quantizePattern } from './pattern-quantization';
import { runPatternQuantization, type QuantizationRequest, type QuantizationResponse } from './quantization-protocol';

function entry(r: number, g = r, b = r, a = 255, enabled = true): PaletteEntry {
    const result = new PaletteEntry(`${r},${g},${b},${a}`, new Color(r, g, b, a));
    result.enabled = enabled;
    return result;
}

function request(colors: number[][], entries = [entry(0), entry(100), entry(200)], width = colors.length): QuantizationRequest {
    return {
        pixels: new Uint8ClampedArray(colors.flat()), width, height: colors.length / width,
        palettes: [new Palette('Brand', entries)], matchingId: 'euclidean',
        dithering: { enable: false, hardness: 75 },
        drawingPosition: { x: 0, y: 0, width, height: colors.length / width },
        maxBeadColors: 2,
    };
}

function visibleColors(pixels: Uint8ClampedArray): Set<string> {
    const colors = new Set<string>();
    for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3]) colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`);
    }
    return colors;
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('brand color count contract', () => {
    it('only accepts null/absent or integer caps from 1 through 512', () => {
        expect(normalizeMaxBeadColors(undefined)).toBeNull();
        expect(normalizeMaxBeadColors(null)).toBeNull();
        expect(normalizeMaxBeadColors(1)).toBe(1);
        expect(normalizeMaxBeadColors(MAX_BEAD_COLORS)).toBe(512);
        for (const invalid of [0, -1, 1.5, 513, NaN, Infinity, '3', true, {}, []]) {
            expect(() => normalizeMaxBeadColors(invalid)).toThrow(RangeError);
        }
    });

    it('weights occurrences, rather than treating every distinct color equally', () => {
        const input = request([
            [255, 255, 255, 255], ...Array.from({ length: 30 }, () => [0, 0, 0, 255]),
        ], [entry(255), entry(0)]);
        input.maxBeadColors = 1;
        expect(visibleColors(runBrandColorLimit(input))).toEqual(new Set(['0,0,0']));
    });

    it('refines to a real weighted medoid rather than the first or an invented mean color', () => {
        const input = request([[0, 0, 0, 255], [100, 100, 100, 255], [200, 200, 200, 255]]);
        input.maxBeadColors = 1;
        expect(Array.from(runBrandColorLimit(input))).toEqual([100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255]);
    });

    it('reprojects original samples, avoiding a second quantization of full-palette matches', () => {
        const input = request([
            ...Array.from({ length: 9 }, () => [10, 10, 10, 255]),
            [121, 121, 121, 255],
            ...Array.from({ length: 9 }, () => [199, 199, 199, 255]),
        ]);
        const output = runBrandColorLimit(input);
        expect(visibleColors(output)).toEqual(new Set(['0,0,0', '200,200,200']));
        // 121 is closer to 200. A lossy 121 -> 100 -> subset chain would tie at 0.
        expect(Array.from(output.slice(9 * 4, 10 * 4))).toEqual([200, 200, 200, 255]);
    });

    it('deduplicates RGB, excludes disabled/nonopaque colors, and leaves palettes and inputs unchanged', () => {
        const entries = [entry(60, 20, 70, 0), entry(60, 20, 70, 128), entry(60, 20, 70, 255, false), entry(0), entry(0), entry(200)];
        const input = request([[60, 20, 70, 255], [180, 180, 180, 128], [44, 33, 22, 0]], entries);
        input.maxBeadColors = 512;
        const before = structuredClone(input);
        for (const color of entries) { Object.freeze(color.color); Object.freeze(color); }
        Object.freeze(entries);
        const output = runBrandColorLimit(input);
        expect(Array.from(output)).toEqual([0, 0, 0, 255, 200, 200, 200, 255, 44, 33, 22, 0]);
        expect(input).toEqual(before);
        expect(output).not.toBe(input.pixels);
    });

    it('empty patterns retain hidden RGB and can succeed without an enabled opaque palette', () => {
        const input = request([[31, 7, 99, 0], [200, 100, 25, 0]], []);
        expect(runBrandColorLimit(input)).toEqual(input.pixels);
        input.pixels[3] = 1;
        expect(() => runBrandColorLimit(input)).toThrow('No enabled opaque');
    });

    it('rejects bad shape, excessive source dimensions and invalid palette entries before mutation', () => {
        const input = request([[10, 20, 30, 255]]);
        const before = input.pixels.slice();
        for (const invalid of [
            { width: 0 }, { width: 1.5 }, { height: NaN },
            { width: EDITOR_PROJECT_PATTERN_DIMENSION_MAX + 1 },
            { pixels: new Uint8ClampedArray(3) },
            { drawingPosition: { x: 0, y: 0, width: NaN, height: 1 } },
            { dithering: { enable: true, hardness: Infinity } },
            { palettes: [new Palette('Bad', [entry(NaN)])] },
            { palettes: [new Palette('Big', Array(MAX_LIMIT_PALETTE_ENTRIES + 1).fill(entry(0)))] },
        ]) expect(() => runBrandColorLimit({ ...input, ...invalid })).toThrow();
        expect(input.pixels).toEqual(before);
    });

    it('ties and structured-clone inputs are deterministic', () => {
        const input = request([[10, 20, 30, 255], [40, 50, 60, 255], [130, 140, 150, 255], [230, 240, 250, 255]]);
        expect(runBrandColorLimit(input)).toEqual(runBrandColorLimit(structuredClone(input)));
        const tie = request([[100, 100, 100, 255]], [entry(200), entry(0)]);
        tie.maxBeadColors = 1;
        expect(Array.from(runBrandColorLimit(tie))).toEqual([200, 200, 200, 255]);
    });

    it('accepts the complete maximum project grid without resampling or losing beads', () => {
        const width = EDITOR_PROJECT_PATTERN_DIMENSION_MAX;
        const pixels = new Uint8ClampedArray(width * width * 4);
        for (let offset = 3; offset < pixels.length; offset += 4) pixels[offset] = 255;
        const input = { ...request([[0, 0, 0, 255]], [entry(0)]), width, height: width, pixels };
        input.drawingPosition = { x: 0, y: 0, width, height: width };
        const output = runBrandColorLimit(input);
        // Buffer comparison is independent of the reducer and avoids creating
        // millions of matcher nodes just to compare a valid maximum-size grid.
        expect(Buffer.from(output).equals(Buffer.from(pixels))).toBe(true);
        expect(output === pixels).toBe(false);
    });

    it('supports 4096 palette entries at the resource boundary', () => {
        const entries = Array.from({ length: MAX_LIMIT_PALETTE_ENTRIES }, (_, index) => entry((index >> 8) * 16, index & 255, 77));
        const input = request([[32, 255, 77, 255]], entries);
        input.maxBeadColors = 512;
        expect(Array.from(runBrandColorLimit(input))).toEqual([32, 255, 77, 255]);
    });
});

describe('legacy image conversion and alpha contracts', () => {
    const cases = MATCHING_OPTIONS.flatMap(({ id }) => [false, true].flatMap((dither) => [0, 75, 100].map((hardness) => ({ id, dither, hardness }))));
    it.each(cases)('keeps legacy no-cap bytes and nonrestrictive-cap visible colors: $id/$dither/$hardness', ({ id, dither, hardness }) => {
        const pixels = Array.from({ length: 90 }, (_, index) => [(index * 37) % 256, (index * 53) % 256, (index * 17) % 256, [0, 128, 255][index % 3]]);
        const input = request(pixels, [entry(0), entry(0), entry(255), entry(200, 40, 25)], 10);
        input.matchingId = id;
        input.dithering = { enable: dither, hardness };
        // Also exercise diffusion boundaries inside the canvas.
        input.drawingPosition = { x: 1, y: 1, width: 8, height: 7 };
        const expected = reduceColorPixels(input.pixels.slice(), input.width, input.height, {
            palettes: input.palettes, matching: getMatchingOption(id)?.value ?? MATCHINGS.EUCLIDEAN,
            dithering: input.dithering, drawingPosition: input.drawingPosition,
        });
        const disabledCaps: (number | null | undefined)[] = [undefined, null];
        for (const maxBeadColors of disabledCaps) {
            expect(runPatternQuantization({ ...input, pixels: input.pixels.slice(), maxBeadColors })).toEqual(expected);
        }
        for (const maxBeadColors of [3, 512]) {
            const output = runPatternQuantization({ ...input, maxBeadColors });
            for (let offset = 0; offset < input.pixels.length; offset += 4) {
                const source = input.pixels[offset + 3] ? expected : input.pixels;
                expect(output.slice(offset, offset + 4)).toEqual(source.slice(offset, offset + 4));
            }
        }
    });

    it('never wraps diffusion across physical rows for a larger non-fitted source', () => {
        const input = request([
            [1, 1, 1, 255], [100, 100, 100, 255],
            [220, 220, 220, 255], [77, 88, 99, 0],
        ], [entry(0), entry(255)], 2);
        input.dithering = { enable: true, hardness: 100 };
        input.drawingPosition = { x: -20, y: -20, width: 100, height: 100 };
        const result = runBrandColorLimit(input);
        expect(Array.from(result)).toEqual([0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255, 77, 88, 99, 0]);
        expect(visibleColors(result).size).toBe(2);
    });

    it.each(MATCHING_OPTIONS)('keeps a cap with enabled transparent entries, all matching modes and diffusion: $id', ({ id }) => {
        const input = request(Array.from({ length: 64 }, (_, index) => [(index * 17) % 256, (index * 37) % 256, (index * 53) % 256, index % 4 ? 255 : 0]),
            [entry(0), entry(100), entry(200), entry(255, 0, 0), entry(0, 0, 255, 0), entry(255, 255, 255, 255, false)], 8);
        input.matchingId = id;
        input.dithering.enable = true;
        for (const maxBeadColors of [1, 2, 4, 512]) {
            const output = runBrandColorLimit({ ...input, maxBeadColors });
            expect(visibleColors(output).size).toBeLessThanOrEqual(Math.min(maxBeadColors, 4));
            for (const color of visibleColors(output)) expect(['0,0,0', '100,100,100', '200,200,200', '255,0,0']).toContain(color);
            for (let index = 3; index < output.length; index += 4) expect(output[index]).toBe(input.pixels[index] ? 255 : 0);
        }
    });

    it('only explicit grid limiting keeps intermediate alpha and untouched transparent RGB', async () => {
        const input = request([[1, 2, 3, 1], [109, 107, 101, 128], [240, 231, 245, 254], [44, 22, 88, 0]]);
        const before = input.pixels.slice();
        const output = await limitPatternBeadColors({ ...input, maxBeadColors: 1 });
        expect([output[3], output[7], output[11], output[15]]).toEqual([1, 128, 254, 0]);
        expect(Array.from(output.slice(12))).toEqual([44, 22, 88, 0]);
        expect(visibleColors(output).size).toBe(1);
        expect(input.pixels).toEqual(before);
    });
});

describe('cooperative conversion and worker paths', () => {
    it('rejects oversized jobs before invoking or transferring to a worker', async () => {
        const input = request([[0, 0, 0, 255]]);
        input.width = EDITOR_PROJECT_PATTERN_DIMENSION_MAX + 1;
        input.height = input.width;
        const workerFactory = vi.fn();
        await expect(quantizePattern(input, { workerFactory })).rejects.toThrow(RangeError);
        expect(workerFactory).not.toHaveBeenCalled();
        expect(input.pixels.byteLength).toBe(4);
    });

    it.each([1, 5])('honors fallback Abort after work has started (yield %i), without publishing partial changes', async (yieldNumber) => {
        vi.useFakeTimers();
        vi.stubGlobal('Worker', undefined);
        let time = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => (time += 8));
        const input = request(Array.from({ length: 128 * 128 }, () => [90, 90, 90, 255]), [entry(0), entry(200)], 128);
        input.maxBeadColors = 1;
        const before = input.pixels.slice();
        const abort = new AbortController();
        const pending = quantizePattern(input, { signal: abort.signal });
        const outcome = pending.then(() => ({ type: 'success' }), (error: Error) => ({ type: 'error', name: error.name }));
        for (let count = 0; count < yieldNumber; count++) await vi.advanceTimersToNextTimerAsync();
        abort.abort();
        await vi.runAllTimersAsync();
        expect(await outcome).toEqual({ type: 'error', name: 'AbortError' });
        expect(input.pixels).toEqual(before);
    });

    it('reuses the exact capped algorithm in worker and fallback without transferring caller pixels', async () => {
        const input = request(Array.from({ length: 64 * 64 }, (_, index) => [(index * 31) % 256, (index * 43) % 256, (index * 7) % 256, index % 5 ? 255 : 0]), undefined, 64);
        const before = input.pixels.slice();
        const worker = {
            onmessage: null as ((event: MessageEvent<QuantizationResponse>) => void) | null,
            onerror: null as ((event: ErrorEvent) => void) | null,
            onmessageerror: null as ((event: MessageEvent) => void) | null,
            terminate: vi.fn(),
            postMessage(data: QuantizationRequest, transfer: Transferable[]) {
                const received = structuredClone(data, { transfer });
                queueMicrotask(() => {
                    worker.onmessage?.({ data: { type: 'result', pixels: runPatternQuantization(received) } } as MessageEvent<QuantizationResponse>);
                });
            },
        };
        const result = await quantizePattern(input, { workerFactory: () => worker as unknown as Worker });
        const fallback = await quantizePattern(input, { workerFactory: () => { throw new Error('Worker unavailable'); } });
        expect(result).toEqual(fallback);
        expect(input.pixels).toEqual(before);
        expect(worker.terminate).toHaveBeenCalledOnce();
    });

    it('terminates a capped worker on Abort and ignores an already queued late result', async () => {
        const input = request(Array.from({ length: 64 * 64 }, () => [75, 75, 75, 255]), undefined, 64);
        const before = input.pixels.slice();
        const worker = {
            onmessage: null as ((event: MessageEvent<QuantizationResponse>) => void) | null,
            onerror: null as ((event: ErrorEvent) => void) | null,
            onmessageerror: null as ((event: MessageEvent) => void) | null,
            terminate: vi.fn(), postMessage: vi.fn(),
        };
        const controller = new AbortController();
        const pending = quantizePattern(input, { signal: controller.signal, workerFactory: () => worker as unknown as Worker });
        const outcome = pending.then(() => 'resolved', (error: Error) => error.name);
        const queuedHandler = worker.onmessage!;
        controller.abort();
        queuedHandler({ data: { type: 'result', pixels: new Uint8ClampedArray(before.length) } } as MessageEvent<QuantizationResponse>);
        expect(await outcome).toBe('AbortError');
        expect(worker.terminate).toHaveBeenCalledOnce();
        expect(worker.onmessage).toBeNull();
        expect(input.pixels).toEqual(before);
    });

    it('the actual worker entry routes capped source and grid operations and reports validation errors', async () => {
        const scope = {
            onmessage: null as ((event: MessageEvent<QuantizationRequest>) => void) | null,
            postMessage: vi.fn(),
        };
        vi.stubGlobal('self', scope);
        await import('./pattern-quantization.worker');
        expect(scope.postMessage).toHaveBeenCalledWith({ type: 'ready' });
        const input = request([[10, 10, 10, 128], [110, 110, 110, 255], [200, 200, 200, 0]]);
        input.maxBeadColors = 1;
        input.preservePatternAlpha = true;
        scope.onmessage!({ data: structuredClone(input) } as MessageEvent<QuantizationRequest>);
        const response = scope.postMessage.mock.calls[1][0] as QuantizationResponse;
        expect(response.type).toBe('result');
        if (response.type !== 'result') throw new Error('Missing worker result');
        expect([response.pixels[3], response.pixels[7], response.pixels[11]]).toEqual([128, 255, 0]);
        expect(visibleColors(response.pixels).size).toBe(1);
        scope.onmessage!({ data: { ...input, maxBeadColors: -2 } } as MessageEvent<QuantizationRequest>);
        expect(scope.postMessage.mock.calls[2][0]).toMatchObject({ type: 'error' });
    });
});

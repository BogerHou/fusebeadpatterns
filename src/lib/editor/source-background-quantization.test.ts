import { afterEach, describe, expect, it, vi } from 'vitest';
import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { reduceColorPixels } from '../core/utils/utils';
import { getMatchingOption, MATCHING_OPTIONS } from './config';
import { EDITOR_PROJECT_PATTERN_DIMENSION_MAX } from './editor-limits';
import { quantizePattern } from './pattern-quantization';
import { runPatternQuantization, type QuantizationRequest, type QuantizationResponse } from './quantization-protocol';

function entry(r: number, g = r, b = r, a = 255, enabled = true): PaletteEntry {
    const result = new PaletteEntry(`${r},${g},${b}`, new Color(r, g, b, a));
    result.enabled = enabled;
    return result;
}

function request(pixels: number[][], entries = [entry(0), entry(255)], width = pixels.length): QuantizationRequest {
    return {
        pixels: new Uint8ClampedArray(pixels.flat()), width, height: pixels.length / width,
        palettes: [new Palette('Brand', entries)], matchingId: 'euclidean',
        dithering: { enable: false, hardness: 100 },
        drawingPosition: { x: 0, y: 0, width, height: pixels.length / width },
        protectEmptyCells: true,
    };
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('background-aware full-palette quantization', () => {
    it.each([undefined, null])('has no implicit 512-color limit when maxBeadColors is %s', async (maxBeadColors) => {
        const entries = Array.from({ length: 600 }, (_, index) => entry(index >> 8, index & 255, 77));
        const input = request(entries.map(({ color }) => [color.r, color.g, color.b, 255]), entries, 30);
        input.maxBeadColors = maxBeadColors;
        const before = input.pixels.slice();
        const paletteBefore = JSON.stringify(input.palettes);
        expect(Buffer.from(runPatternQuantization(input)).equals(Buffer.from(before))).toBe(true);
        expect(Buffer.from(await quantizePattern(input)).equals(Buffer.from(before))).toBe(true);
        expect(Buffer.from(input.pixels).equals(Buffer.from(before))).toBe(true);
        expect(JSON.stringify(input.palettes)).toBe(paletteBefore);
    });

    it.each(MATCHING_OPTIONS)('uses the requested $id matching and only enabled opaque brand entries', ({ id }) => {
        const input = request([
            [121, 72, 183, 128], [12, 41, 17, 255], [245, 210, 29, 1], [99, 66, 33, 0],
        ], [entry(0), entry(255), entry(0, 40, 180), entry(190, 100, 200), entry(245, 210, 29, 255, false), entry(121, 72, 183, 128)]);
        input.matchingId = id;
        const expected = reduceColorPixels(input.pixels.slice(), input.width, input.height, {
            palettes: [new Palette('Eligible', input.palettes[0].entries.filter(e => e.enabled && e.color.a === 255))],
            matching: getMatchingOption(id)!.value, dithering: input.dithering, drawingPosition: input.drawingPosition,
        });
        expected.set(input.pixels.subarray(12), 12);
        expect(runPatternQuantization(input)).toEqual(expected);
        expect([...runPatternQuantization(input).filter((_, index) => index % 4 === 3)]).toEqual([255, 255, 255, 0]);
    });

    it('keeps dithering active, while masked and naturally transparent cells keep all four bytes', () => {
        const input = request([[100, 100, 100, 255], [100, 100, 100, 255], [77, 88, 99, 0], [0, 0, 0, 0]]);
        expect([...runPatternQuantization(input).slice(0, 8)]).toEqual([0, 0, 0, 255, 0, 0, 0, 255]);
        input.dithering.enable = true;
        expect([...runPatternQuantization(input)]).toEqual([0, 0, 0, 255, 255, 255, 255, 255, 77, 88, 99, 0, 0, 0, 0, 0]);
        input.dithering.hardness = 0;
        expect([...runPatternQuantization(input).slice(0, 8)]).toEqual([0, 0, 0, 255, 0, 0, 0, 255]);
    });

    it('never diffuses across physical rows when the original image extends off-canvas', () => {
        const input = request([[1, 1, 1, 255], [100, 100, 100, 255], [220, 220, 220, 255], [12, 34, 56, 0]], undefined, 2);
        input.dithering.enable = true;
        input.drawingPosition = { x: -20, y: -20, width: 100, height: 100 };
        expect([...runPatternQuantization(input)]).toEqual([0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255, 12, 34, 56, 0]);
    });

    it('applies an explicit cap only when requested, without filling removed cells', () => {
        const input = request([[0, 0, 0, 255], [100, 100, 100, 255], [200, 200, 200, 255], [4, 5, 6, 0]], [entry(0), entry(100), entry(200)]);
        expect(runPatternQuantization(input)).toEqual(input.pixels);
        input.maxBeadColors = 1;
        expect([...runPatternQuantization(input)]).toEqual([100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255, 4, 5, 6, 0]);
    });

    it('allows an entirely removed image without available colors but rejects a visible bead without colors', () => {
        const input = request([[0, 0, 0, 0], [1, 2, 3, 0]], []);
        expect(runPatternQuantization(input)).toEqual(input.pixels);
        input.pixels[3] = 1;
        expect(() => runPatternQuantization(input)).toThrow('No enabled opaque');
    });

    it.each(MATCHING_OPTIONS)('keeps legacy no-background bytes for absent or false protection: $id', ({ id }) => {
        const input = request(Array.from({ length: 24 }, (_, i) => [i * 9, i * 7, i * 11, i % 3 ? 255 : 0]), undefined, 6);
        input.matchingId = id;
        input.dithering.enable = true;
        const expected = reduceColorPixels(input.pixels.slice(), input.width, input.height, {
            palettes: input.palettes, matching: getMatchingOption(id)!.value,
            dithering: input.dithering, drawingPosition: input.drawingPosition,
        });
        for (const protectEmptyCells of [undefined, false]) {
            expect(runPatternQuantization({ ...input, pixels: input.pixels.slice(), protectEmptyCells })).toEqual(expected);
        }
    });
});

describe('background-aware worker and cooperative execution', () => {
    it('uses identical full-palette worker/fallback bytes without transferring caller pixels', async () => {
        const input = request(Array.from({ length: 64 * 64 }, (_, i) => [(i * 17) % 256, (i * 37) % 256, (i * 53) % 256, i % 5 ? 255 : 0]), undefined, 64);
        input.dithering.enable = true;
        const before = input.pixels.slice();
        const worker = {
            onmessage: null as ((event: MessageEvent<QuantizationResponse>) => void) | null,
            onerror: null as ((event: ErrorEvent) => void) | null,
            onmessageerror: null as ((event: MessageEvent) => void) | null,
            terminate: vi.fn(),
            postMessage(data: QuantizationRequest, transfer: Transferable[]) {
                expect(data.protectEmptyCells).toBe(true);
                expect(data.maxBeadColors).toBeUndefined();
                const received = structuredClone(data, { transfer });
                queueMicrotask(() => worker.onmessage?.({ data: { type: 'result', pixels: runPatternQuantization(received) } } as MessageEvent<QuantizationResponse>));
            },
        };
        const fromWorker = await quantizePattern(input, { workerFactory: () => worker as unknown as Worker });
        const fallback = await quantizePattern(input, { workerFactory: () => { throw new Error('Unavailable'); } });
        expect(Buffer.from(fromWorker).equals(Buffer.from(fallback))).toBe(true);
        expect(Buffer.from(input.pixels).equals(Buffer.from(before))).toBe(true);
        expect(worker.terminate).toHaveBeenCalledOnce();
        for (let i = 0; i < before.length; i += 4) {
            if (!before[i + 3]) expect(fromWorker.subarray(i, i + 4)).toEqual(before.subarray(i, i + 4));
        }
    });

    it('the actual worker entry accepts no-cap background conversion and preserves removed RGBA', async () => {
        const scope = { onmessage: null as ((event: MessageEvent<QuantizationRequest>) => void) | null, postMessage: vi.fn() };
        vi.stubGlobal('self', scope);
        await import('./pattern-quantization.worker');
        const input = request([[100, 100, 100, 255], [100, 100, 100, 255], [0, 0, 0, 0]]);
        input.dithering.enable = true;
        scope.onmessage!({ data: structuredClone(input) } as MessageEvent<QuantizationRequest>);
        expect(scope.postMessage.mock.calls[0][0]).toEqual({ type: 'ready' });
        expect(scope.postMessage.mock.calls[1][0]).toEqual({ type: 'result', pixels: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0]) });
    });

    it('honors Abort after full-palette fallback work starts and leaves source bytes unchanged', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('Worker', undefined);
        let time = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => (time += 8));
        const input = request(Array.from({ length: 128 * 128 }, () => [90, 90, 90, 255]), undefined, 128);
        const before = input.pixels.slice();
        const controller = new AbortController();
        const outcome = quantizePattern(input, { signal: controller.signal }).then(() => 'success', (error: Error) => error.name);
        await vi.advanceTimersToNextTimerAsync();
        controller.abort();
        await vi.runAllTimersAsync();
        expect(await outcome).toBe('AbortError');
        expect(Buffer.from(input.pixels).equals(Buffer.from(before))).toBe(true);
    });

    it('validates protected jobs before cloning or starting workers', async () => {
        const input = request([[0, 0, 0, 255]]);
        const workerFactory = vi.fn();
        await expect(quantizePattern({ ...input, width: EDITOR_PROJECT_PATTERN_DIMENSION_MAX + 1 }, { workerFactory })).rejects.toThrow(RangeError);
        await expect(quantizePattern({ ...input, maxBeadColors: 513 }, { workerFactory })).rejects.toThrow(RangeError);
        expect(workerFactory).not.toHaveBeenCalled();
        expect(input.pixels.byteLength).toBe(4);
    });
});

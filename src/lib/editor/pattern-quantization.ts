import {
    runPatternQuantization,
    type QuantizationRequest,
    type QuantizationResponse,
} from './quantization-protocol';
import { createBrandColorLimitSteps, validateBrandColorLimitRequest } from './brand-color-limit';

// Worker startup costs more than converting a small single-board pattern.
export const WORKER_MIN_PATTERN_PIXELS = 4096;
const WORKER_STARTUP_TIMEOUT_MS = 10_000;

export type QuantizationOptions = {
    signal?: AbortSignal;
    workerFactory?: () => Worker;
};

function abortError(): DOMException {
    return new DOMException('Pattern conversion cancelled.', 'AbortError');
}

async function runFallback(
    request: QuantizationRequest,
    signal?: AbortSignal
): Promise<Uint8ClampedArray> {
    // Let pending input/paint work run before the compatibility path starts.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (signal?.aborted) {
        throw abortError();
    }
    if (request.maxBeadColors !== undefined && request.maxBeadColors !== null || request.preservePatternAlpha) {
        const steps = createBrandColorLimitSteps(request);
        let step = steps.next();
        while (!step.done) {
            const start = performance.now();
            // Each generator step is bounded. Consume a short time slice rather
            // than paying the browser's nested-timer delay for every 2048 ops.
            while (!step.done && performance.now() - start < 8) {
                if (signal?.aborted) {
                    steps.return(undefined);
                    throw abortError();
                }
                step = steps.next();
            }
            if (step.done) return step.value;
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            if (signal?.aborted) {
                steps.return(undefined);
                throw abortError();
            }
            step = steps.next();
        }
        return step.value;
    }
    return runPatternQuantization(request);
}

export type PatternColorLimitRequest = Pick<QuantizationRequest, 'pixels' | 'width' | 'height' | 'palettes' | 'matchingId'> & {
    maxBeadColors: number;
};

/** Explicitly reduce the current grid, keeping every alpha and empty-cell RGB. */
export function limitPatternBeadColors(
    request: PatternColorLimitRequest,
    options: QuantizationOptions = {}
): Promise<Uint8ClampedArray> {
    return quantizePattern({
        ...request,
        preservePatternAlpha: true,
        dithering: { enable: false, hardness: 0 },
        drawingPosition: { x: 0, y: 0, width: request.width, height: request.height },
    }, options);
}

function runWorker(
    request: QuantizationRequest,
    { signal, workerFactory }: QuantizationOptions
): Promise<Uint8ClampedArray> {
    return new Promise((resolve, reject) => {
        let worker: Worker | undefined;
        let startupTimeout: ReturnType<typeof setTimeout> | undefined;
        let settled = false;

        function cleanup(): boolean {
            if (settled) {
                return false;
            }
            settled = true;
            clearTimeout(startupTimeout);
            signal?.removeEventListener('abort', handleAbort);
            if (worker) {
                worker.onmessage = null;
                worker.onerror = null;
                worker.onmessageerror = null;
                worker.terminate();
            }
            return true;
        }

        function fail(error: unknown): void {
            if (cleanup()) {
                reject(error);
            }
        }

        function handleAbort(): void {
            fail(abortError());
        }

        try {
            worker = workerFactory
                ? workerFactory()
                : new Worker(new URL('./pattern-quantization.worker.ts', import.meta.url), {
                    type: 'module',
                });
            worker.onmessage = (event: MessageEvent<QuantizationResponse>) => {
                const response = event.data;
                if (response?.type === 'ready') {
                    clearTimeout(startupTimeout);
                } else if (response?.type === 'result' &&
                    response.pixels instanceof Uint8ClampedArray &&
                    response.pixels.length === request.width * request.height * 4) {
                    if (cleanup()) {
                        resolve(response.pixels);
                    }
                } else {
                    fail(new Error(response?.type === 'error'
                        ? response.message
                        : 'Invalid pattern worker response.'));
                }
            };
            worker.onerror = (event) => {
                event.preventDefault();
                fail(new Error(event.message || 'Pattern worker failed.'));
            };
            worker.onmessageerror = () => fail(new Error('Could not read the pattern worker response.'));
            signal?.addEventListener('abort', handleAbort, { once: true });
            if (signal?.aborted) {
                handleAbort();
                return;
            }

            startupTimeout = setTimeout(() => {
                fail(new Error('Pattern worker did not start.'));
            }, WORKER_STARTUP_TIMEOUT_MS);
            // Transfer a copy so a failed worker never detaches the fallback input.
            const pixels = new Uint8ClampedArray(request.pixels);
            worker.postMessage({ ...request, pixels }, [pixels.buffer]);
        } catch (error) {
            fail(error);
        }
    });
}

export async function quantizePattern(
    request: QuantizationRequest,
    options: QuantizationOptions = {}
): Promise<Uint8ClampedArray> {
    if (options.signal?.aborted) {
        throw abortError();
    }
    if (request.maxBeadColors !== undefined && request.maxBeadColors !== null || request.preservePatternAlpha) {
        validateBrandColorLimitRequest(request);
    }
    if (request.width * request.height < WORKER_MIN_PATTERN_PIXELS ||
        (!options.workerFactory && typeof Worker === 'undefined')) {
        return runFallback(request, options.signal);
    }
    try {
        return await runWorker(request, options);
    } catch (error) {
        if (options.signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
            throw error;
        }
        return runFallback(request, options.signal);
    }
}

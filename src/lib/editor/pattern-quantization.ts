import {
    runPatternQuantization,
    type QuantizationRequest,
    type QuantizationResponse,
} from './quantization-protocol';

// Worker startup costs more than converting a small single-board pattern.
export const WORKER_MIN_PATTERN_PIXELS = 4096;
const WORKER_STARTUP_TIMEOUT_MS = 10_000;

type QuantizationOptions = {
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
    return runPatternQuantization(request);
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

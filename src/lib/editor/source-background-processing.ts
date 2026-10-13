import { isValidSourceCrop, type EditorSourceCrop } from '../core/utils/image-crop';
import { createSourceBackgroundMaskSteps, SourceBackgroundError, validateSourceBackgroundDimensions,
    validateSourceBackgroundMaskRequest, type SourceBackgroundMaskRequest, type SourceBackgroundMaskResult } from './source-background';

export const SOURCE_BACKGROUND_WORKER_MIN_PIXELS = 4096;
const WORKER_STARTUP_MS = 10_000;
let requestSerial = 0;
export type SourceBackgroundImage = { pixels: Uint8ClampedArray; width: number; height: number;
    sourceWidth: number; sourceHeight: number; x: number; y: number };
export type SourceBackgroundProcessingOptions = { signal?: AbortSignal; workerFactory?: () => Worker };
export type SourceBackgroundDrawingPosition = { xStart: number; yStart: number; width: number; height: number };
function aborted(): DOMException { return new DOMException('Background operation cancelled.', 'AbortError'); }
function check(signal?: AbortSignal): void { if (signal?.aborted) throw aborted(); }

/** Natural decoded dimensions include the browser's EXIF handling. Validate the
 * ROI budget before allocating its canvas or RGBA readback; never downsample it. */
export function readDecodedSourceBackgroundImage(image: HTMLImageElement, crop: EditorSourceCrop | null | undefined, signal: AbortSignal): SourceBackgroundImage {
    check(signal);
    const sourceWidth = image.naturalWidth, sourceHeight = image.naturalHeight;
    if (![sourceWidth, sourceHeight].every(value => Number.isSafeInteger(value) && value > 0)) throw new SourceBackgroundError('INVALID_IMAGE');
    if (crop !== undefined && crop !== null && (!isValidSourceCrop(crop) || crop.sourceWidth !== sourceWidth || crop.sourceHeight !== sourceHeight)) throw new SourceBackgroundError('INVALID_IMAGE');
    const { x, y, width, height } = crop ?? { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
    validateSourceBackgroundDimensions(width, height);
    const canvas = document.createElement('canvas');
    try {
        canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Canvas 2D context is unavailable.');
        context.filter = 'none'; context.imageSmoothingEnabled = false;
        context.drawImage(image, x, y, width, height, 0, 0, width, height);
        check(signal);
        const pixels = context.getImageData(0, 0, width, height).data;
        if (!(pixels instanceof Uint8ClampedArray) || pixels.length !== width * height * 4) throw new SourceBackgroundError('INVALID_IMAGE');
        return { pixels, width, height, sourceWidth, sourceHeight, x, y };
    } finally { canvas.width = canvas.height = 0; }
}

export async function readSourceBackgroundImage(src: string, crop: EditorSourceCrop | null | undefined, signal: AbortSignal): Promise<SourceBackgroundImage> {
    check(signal);
    const { decodeSourceImage } = await import('./source-image-transaction');
    check(signal);
    const image = await decodeSourceImage(src, 'none', signal);
    return readDecodedSourceBackgroundImage(image, crop, signal);
}

/** Match the existing sampler's crop/non-crop integer geometry without drawing
 * an unmasked image first. Off-mode still calls the old sampler directly. */
export function sourceBackgroundDrawingPosition(width: number, height: number, sourceWidth: number, sourceHeight: number,
    renderer: { fit: boolean; center: boolean }, cropped: boolean): SourceBackgroundDrawingPosition {
    const sourceRatio = sourceWidth / sourceHeight, targetRatio = width / height;
    let renderedWidth: number, renderedHeight: number;
    if (!renderer.fit) { renderedWidth = sourceWidth; renderedHeight = sourceHeight; }
    else if (sourceRatio < targetRatio) { renderedHeight = height; renderedWidth = sourceWidth * (height / sourceHeight); }
    else if (sourceRatio > targetRatio) { renderedWidth = width; renderedHeight = sourceHeight * (width / sourceWidth); }
    else { renderedWidth = width; renderedHeight = height; }
    const fittedWidth = cropped ? Math.max(1, Math.floor(renderedWidth)) : Math.floor(renderedWidth);
    const fittedHeight = cropped ? Math.max(1, Math.floor(renderedHeight)) : Math.floor(renderedHeight);
    return { width: fittedWidth, height: fittedHeight,
        xStart: renderer.center ? Math.floor((width - (cropped ? fittedWidth : renderedWidth)) / 2) : 0,
        yStart: renderer.center ? Math.floor((height - (cropped ? fittedHeight : renderedHeight)) / 2) : 0 };
}

/** Mask samples use nearest source pixel centers at the exact drawing bounds.
 * This overwrites color/alpha bleeding produced by image interpolation or filters. */
export async function applySourceBackgroundEmptyMask(pixels: Uint8ClampedArray, width: number, height: number,
    source: { mask: Uint8Array; width: number; height: number }, position: SourceBackgroundDrawingPosition, signal: AbortSignal): Promise<void> {
    check(signal);
    let started = performance.now();
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        let keep = false;
        if (position.width > 0 && position.height > 0 && x >= position.xStart && x < position.xStart + position.width && y >= position.yStart && y < position.yStart + position.height) {
            const sx = Math.min(source.width - 1, Math.floor((x - position.xStart + 0.5) * source.width / position.width));
            const sy = Math.min(source.height - 1, Math.floor((y - position.yStart + 0.5) * source.height / position.height));
            keep = source.mask[sy * source.width + sx] === 1;
        }
        const index = y * width + x;
        if (!keep) pixels.fill(0, index * 4, index * 4 + 4);
        if ((index + 1) % 4096 === 0) {
            check(signal);
            if (performance.now() - started >= 8) { await new Promise<void>(resolve => setTimeout(resolve, 0)); check(signal); started = performance.now(); }
        }
    }
    check(signal);
}

async function consume<T>(steps: Generator<void, T>, signal?: AbortSignal): Promise<T> {
    await new Promise<void>(resolve => setTimeout(resolve, 0)); check(signal);
    let step = steps.next();
    while (!step.done) {
        const start = performance.now();
        while (!step.done && performance.now() - start < 8) { check(signal); step = steps.next(); }
        if (step.done) break;
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        if (signal?.aborted) { steps.return(undefined); throw aborted(); }
        step = steps.next();
    }
    check(signal); return step.value;
}

type WorkerReply = { type: 'ready' } | { type: 'result'; id: number; pixels: Uint8ClampedArray; mask: Uint8Array } | { type: 'error'; id: number; message: string };
function workerMask(request: SourceBackgroundMaskRequest, options: SourceBackgroundProcessingOptions): Promise<SourceBackgroundMaskResult> {
    const id = ++requestSerial;
    return new Promise((resolve, reject) => {
        let worker: Worker | undefined, timeout: ReturnType<typeof setTimeout> | undefined, settled = false;
        const cleanup = (): boolean => {
            if (settled) return false;
            settled = true; clearTimeout(timeout); options.signal?.removeEventListener('abort', abort);
            if (worker) { worker.onmessage = worker.onerror = worker.onmessageerror = null; worker.terminate(); }
            return true;
        };
        const fail = (error: unknown): void => { if (cleanup()) reject(error); };
        const abort = (): void => fail(aborted());
        try {
            worker = options.workerFactory ? options.workerFactory() : new Worker(new URL('./source-background.worker.ts', import.meta.url), { type: 'module' });
            worker.onmessage = (event: MessageEvent<WorkerReply>) => {
                const response = event.data;
                if (settled) return;
                if (response?.type === 'ready') { clearTimeout(timeout); return; }
                if (response?.type === 'result' && response.id === id && response.pixels instanceof Uint8ClampedArray &&
                    response.mask instanceof Uint8Array && response.pixels.length === request.pixels.length && response.mask.length === request.width * request.height) {
                    if (cleanup()) resolve({ pixels: response.pixels, mask: response.mask });
                } else fail(new SourceBackgroundError('INVALID_RESPONSE'));
            };
            worker.onerror = event => { event.preventDefault(); fail(new Error(event.message || 'Background worker failed.')); };
            worker.onmessageerror = () => fail(new SourceBackgroundError('INVALID_RESPONSE'));
            options.signal?.addEventListener('abort', abort, { once: true });
            if (options.signal?.aborted) { abort(); return; }
            timeout = setTimeout(() => fail(new Error('Background worker did not start.')), WORKER_STARTUP_MS);
            // Transfer a second copy: the immutable fallback snapshot and caller
            // source remain usable even after a worker startup/execution error.
            const pixels = new Uint8ClampedArray(request.pixels);
            worker.postMessage({ id, ...request, pixels }, [pixels.buffer]);
        } catch (error) { fail(error); }
    });
}

function* validateReply(result: SourceBackgroundMaskResult, source: Uint8ClampedArray): Generator<void, SourceBackgroundMaskResult> {
    for (let i = 0; i < result.mask.length; i++) {
        const offset = i * 4, keep = result.mask[i];
        if (keep > 1 || (source[offset + 3] === 0 && keep !== 0)) throw new SourceBackgroundError('INVALID_RESPONSE');
        for (let channel = 0; channel < 4; channel++) {
            if (result.pixels[offset + channel] !== (keep ? source[offset + channel] : 0)) throw new SourceBackgroundError('INVALID_RESPONSE');
        }
        if ((i + 1) % 2048 === 0) yield;
    }
    return result;
}

/** Worker and fallback both run the same bounded program. Abort never falls
 * back, and neither path detaches or edits caller-owned pixels. */
export async function maskSourceBackground(request: SourceBackgroundMaskRequest, options: SourceBackgroundProcessingOptions = {}): Promise<SourceBackgroundMaskResult> {
    check(options.signal);
    const background = validateSourceBackgroundMaskRequest(request);
    const snapshot = { ...request, pixels: new Uint8ClampedArray(request.pixels), background };
    if (request.width * request.height >= SOURCE_BACKGROUND_WORKER_MIN_PIXELS && (options.workerFactory || typeof Worker !== 'undefined')) {
        try {
            const result = await workerMask(snapshot, options);
            return await consume(validateReply(result, snapshot.pixels), options.signal);
        } catch (error) {
            if (options.signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) throw error;
        }
    }
    return consume(createSourceBackgroundMaskSteps(snapshot), options.signal);
}

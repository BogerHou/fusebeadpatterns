import type { Project } from '../core/model/project/project.model';
import { drawImageInsideCanvas } from '../core/utils/utils';
import type { EditorSourceCrop } from '../core/utils/image-crop';
import { quantizePattern } from './pattern-quantization';

/** Own one source operation. An old decode/worker reply cannot publish after
 * cancellation, replacement, restoration or a newer source operation. */
export class SourceImageTransactions {
    private active: AbortController | null = null;

    get pending(): boolean { return Boolean(this.active && !this.active.signal.aborted); }

    begin(): AbortController {
        this.cancel();
        this.active = new AbortController();
        return this.active;
    }

    isCurrent(task: AbortController): boolean {
        return this.active === task && !task.signal.aborted;
    }

    finish(task: AbortController): boolean {
        if (this.active !== task) return false;
        this.active = null;
        return true;
    }

    cancel(): void {
        const previous = this.active;
        this.active = null;
        previous?.abort();
    }

    async prepare<T>(task: AbortController, prepare: (signal: AbortSignal) => Promise<T>, commit: (value: T) => void): Promise<boolean> {
        if (!this.isCurrent(task)) return false;
        try {
            const result = await prepare(task.signal);
            if (!this.isCurrent(task)) return false;
            commit(result);
            return true;
        } catch (error) {
            if (!this.isCurrent(task)) return false;
            throw error;
        }
    }
}

function abortError(): DOMException {
    return new DOMException('Source image operation cancelled.', 'AbortError');
}

/** Abort and detach FileReader callbacks; leave the current document untouched. */
export function readSourceImageFile(file: File, signal: AbortSignal, createReader: () => FileReader = () => new FileReader()): Promise<string> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) { reject(abortError()); return; }
        const reader = createReader();
        let settled = false;
        function cleanup(): boolean {
            if (settled) return false;
            settled = true;
            signal.removeEventListener('abort', abort);
            reader.onload = reader.onerror = reader.onabort = null;
            return true;
        }
        function abort() {
            if (!cleanup()) return;
            reader.abort();
            reject(abortError());
        }
        reader.onload = () => {
            const result = reader.result;
            if (!cleanup()) return;
            if (typeof result !== 'string' || !result) reject(new Error('Unable to read selected image.'));
            else resolve(result);
        };
        reader.onerror = () => { if (cleanup()) reject(new Error('Unable to read selected image.')); };
        reader.onabort = () => { if (cleanup()) reject(abortError()); };
        signal.addEventListener('abort', abort, { once: true });
        try { reader.readAsDataURL(file); } catch (error) { if (cleanup()) reject(error); }
    });
}

/** Coordinates are based on this browser's decoded natural image, including
 * its EXIF handling, rather than CSS dimensions or encoded header dimensions. */
export function decodeSourceImage(src: string, filter: string, signal: AbortSignal, createImage: () => HTMLImageElement = () => new window.Image()): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) { reject(abortError()); return; }
        const image = createImage();
        let settled = false;
        function cleanup(): boolean {
            if (settled) return false;
            settled = true;
            image.onload = image.onerror = null;
            signal.removeEventListener('abort', abort);
            return true;
        }
        function abort() { if (cleanup()) reject(abortError()); }
        image.style.filter = filter;
        image.onload = () => {
            if (!cleanup()) return;
            if (![image.naturalWidth, image.naturalHeight].every(value => Number.isSafeInteger(value) && value > 0)) reject(new Error('Unable to load selected image.'));
            else resolve(image);
        };
        image.onerror = () => { if (cleanup()) reject(new Error('Unable to load selected image.')); };
        signal.addEventListener('abort', abort, { once: true });
        image.src = src;
    });
}

export type PreparedSourceImage = {
    project: Project;
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
};

/** The image effect and explicit crop/upload share this one sampling pipeline.
 * Work is prepared offscreen; no live grid, draft or history is changed here. */
export async function prepareSourceImagePattern(options: {
    src: string;
    fileName: string;
    crop: EditorSourceCrop | null;
    project: Project;
    width: number;
    height: number;
    matchingId: string;
    restoredPixels?: Uint8ClampedArray | null;
}, signal: AbortSignal): Promise<PreparedSourceImage> {
    const { project, width, height } = options;
    const image = await decodeSourceImage(options.src, project.imageConfiguration.css(), signal);
    if (signal.aborted) throw abortError();
    project.srcWidth = image.naturalWidth;
    project.srcHeight = image.naturalHeight;
    project.image = { name: options.fileName, src: image };
    const canvas = document.createElement('canvas');
    try {
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Canvas 2D context is unavailable.');
        // A saved grid is authoritative even if this browser decodes the source
        // dimensions differently. Only a new generation must revalidate its ROI.
        if (options.restoredPixels) {
            if (options.restoredPixels.length !== width * height * 4) throw new Error('Pattern dimensions must match the RGBA pixel data.');
            return { project, pixels: options.restoredPixels.slice(), width, height };
        }
        const position = drawImageInsideCanvas(canvas, image, project.rendererConfiguration, options.crop);
        const imageData = context.getImageData(0, 0, width, height);
        const pixels = await quantizePattern({
            pixels: imageData.data, width, height,
            palettes: project.paletteConfiguration.palettes,
            matchingId: options.matchingId,
            dithering: { enable: project.ditheringConfiguration.enable, hardness: project.ditheringConfiguration.hardness },
            drawingPosition: { x: position.xStart, y: position.yStart, width: position.width, height: position.height },
        }, { signal });
        if (signal.aborted) throw abortError();
        return { project, pixels, width, height };
    } finally {
        canvas.width = canvas.height = 0;
    }
}

/** Publish the prepared pixels before changing accepted source/model state.
 * Restore the previous raster if a resized backing canvas rejects the write. */
export function commitSourceImageCanvas(canvas: HTMLCanvasElement, prepared: PreparedSourceImage, previousPixels: Uint8ClampedArray | null): void {
    const oldWidth = canvas.width, oldHeight = canvas.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas 2D context is unavailable.');
    const data = context.createImageData(prepared.width, prepared.height);
    data.data.set(prepared.pixels);
    try {
        if (canvas.width !== prepared.width) canvas.width = prepared.width;
        if (canvas.height !== prepared.height) canvas.height = prepared.height;
        context.putImageData(data, 0, 0);
    } catch (error) {
        canvas.width = oldWidth;
        canvas.height = oldHeight;
        if (previousPixels?.length === oldWidth * oldHeight * 4) {
            try {
                const restored = context.createImageData(oldWidth, oldHeight);
                restored.data.set(previousPixels);
                context.putImageData(restored, 0, 0);
            } catch { /* Model/history remain intact even if this canvas is unavailable. */ }
        }
        throw error;
    }
}

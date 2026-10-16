import { LIMITS, createGrid, inspectImage, resizeImage, type RgbaSource } from './core';
import { reducePixelGridColors, type ColorLimit } from './conversion';
import { PixelGridUiError } from './messages';
import type { PixelLocaleSnapshot } from './locale-navigation';

const sources = {
    rocket: { path: '/guides/photo-to-pattern/rocket-source.png', name: 'rocket-source.png', mime: 'image/png', width: 1254, height: 1254 },
    cat: { path: '/guides/photo-to-pattern/cat-source.jpg', name: 'cat-source.jpg', mime: 'image/jpeg', width: 792, height: 960 },
} as const;
const variants = {
    '32-original': { side: 32, colorLimit: 'original' },
    '64-original': { side: 64, colorLimit: 'original' },
    '64-16-colors': { side: 64, colorLimit: 16 },
} as const;
export type PixelPracticeId = `${keyof typeof sources}-${keyof typeof variants}`;
export type PixelPracticePreset = { id: PixelPracticeId; path: string; name: string; mime: string; width: number; height: number; side: 32 | 64; colorLimit: ColorLimit };

/** Resolve an ID, never a caller-supplied image URL or conversion settings. */
export function pixelPracticePreset(id: unknown): PixelPracticePreset {
    for (const source of ['rocket', 'cat'] as const) {
        for (const variant of ['32-original', '64-original', '64-16-colors'] as const) {
            if (id === `${source}-${variant}`) return { id: id as PixelPracticeId, ...sources[source], ...variants[variant] };
        }
    }
    throw new Error('Unknown pixel example');
}

export type PixelPracticeDecoder = (blob: Blob, current: () => boolean) => Promise<RgbaSource>;
type PracticeEnvironment = {
    signal: AbortSignal;
    current: () => boolean;
    fetch: typeof fetch;
    decode: PixelPracticeDecoder;
    converter: boolean;
    needsConfirmation: () => boolean;
    confirm: () => boolean;
    commit: (snapshot: PixelLocaleSnapshot) => void;
};

function aborted() { return new DOMException('Example loading cancelled', 'AbortError'); }

async function readExample(preset: PixelPracticePreset, env: PracticeEnvironment): Promise<Uint8Array> {
    const active = () => !env.signal.aborted && env.current();
    if (!active()) throw aborted();
    const response = await env.fetch(preset.path, { signal: env.signal, credentials: 'same-origin', redirect: 'error' });
    if (!active()) { await response.body?.cancel(); throw aborted(); }
    if (!response.ok || response.redirected || !response.body) { await response.body?.cancel(); throw new Error('Example unavailable'); }
    const mime = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    const declaredSize = response.headers.get('content-length');
    if (mime !== preset.mime || (declaredSize !== null && (!/^\d+$/.test(declaredSize) || Number(declaredSize) > LIMITS.maxImageBytes))) {
        await response.body.cancel(); throw new Error('Example response is not a supported image');
    }
    const reader = response.body.getReader();
    const cancel = () => { void reader.cancel().catch(() => {}); };
    env.signal.addEventListener('abort', cancel, { once: true });
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
        while (true) {
            const chunk = await reader.read();
            if (!active()) throw aborted();
            if (chunk.done) break;
            length += chunk.value.byteLength;
            if (length > LIMITS.maxImageBytes) throw new PixelGridUiError('imageTooLarge');
            chunks.push(chunk.value);
        }
    } finally {
        env.signal.removeEventListener('abort', cancel);
        try { await reader.cancel(); }
        catch { /* A failed network body can also reject cancellation. Keep the original failure. */ }
        finally { reader.releaseLock(); }
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const header = inspectImage(bytes, preset.mime);
    if (header.width !== preset.width || header.height !== preset.height) throw new Error('Example dimensions changed');
    return bytes;
}

/** All asynchronous preparation finishes before the only workspace mutation. */
export async function openPixelPractice(id: unknown, env: PracticeEnvironment): Promise<'opened' | 'cancelled' | 'stale'> {
    const preset = pixelPracticePreset(id);
    const active = () => !env.signal.aborted && env.current();
    const bytes = await readExample(preset, env);
    if (!active()) return 'stale';
    const decoded = await env.decode(new Blob([new Uint8Array(bytes)], { type: preset.mime }), active);
    if (!active()) return 'stale';
    if (decoded.width !== preset.width || decoded.height !== preset.height || !(decoded.pixels instanceof Uint8ClampedArray) || decoded.pixels.length !== decoded.width * decoded.height * 4) throw new Error('Example could not be decoded');
    const source = { ...decoded, name: preset.name };
    const grid = reducePixelGridColors(resizeImage(source, preset.side, preset.side, 'fit'), preset.colorLimit);
    const snapshot: PixelLocaleSnapshot = {
        grid, saved: createGrid(preset.side, preset.side), source, sourceCrop: null,
        history: { undo: [], redo: [] }, width: String(preset.side), height: String(preset.side), mode: 'fit',
        tool: 'brush', color: '#f06a45', alpha: 255, zoom: 'fit', showGrid: !env.converter,
        colorLimit: preset.colorLimit, exportScale: 8, cursor: [0, 0], settingsExpanded: null,
    };
    if (!active()) return 'stale';
    if (env.needsConfirmation() && !env.confirm()) return 'cancelled';
    if (!active()) return 'stale';
    env.commit(snapshot);
    return 'opened';
}

/** The bitmap and offscreen canvas belong to this read, including stale reads. */
export const decodePixelPracticeImage: PixelPracticeDecoder = async (blob, current) => {
    if (typeof createImageBitmap !== 'function') throw new PixelGridUiError('importUnavailable');
    let bitmap: ImageBitmap | undefined;
    let canvas: HTMLCanvasElement | undefined;
    try {
        try { bitmap = await createImageBitmap(blob); }
        catch { throw new PixelGridUiError('decodeFailed'); }
        if (!current()) throw aborted();
        if (bitmap.width > LIMITS.maxImageSide || bitmap.height > LIMITS.maxImageSide || bitmap.width * bitmap.height > LIMITS.maxImagePixels) throw new PixelGridUiError('decodedTooLarge');
        canvas = document.createElement('canvas');
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new PixelGridUiError('importContextUnavailable');
        context.drawImage(bitmap, 0, 0);
        return { width: bitmap.width, height: bitmap.height, pixels: context.getImageData(0, 0, bitmap.width, bitmap.height).data };
    } finally {
        bitmap?.close();
        if (canvas) canvas.width = canvas.height = 0;
    }
};

/** A provider owns one registration; an old StrictMode cleanup cannot remove its successor. */
export function createPixelPracticeBridge() {
    type Registration = { start: (id: PixelPracticeId) => void; enabled: boolean };
    let owner: Registration | null = null;
    const listeners = new Set<() => void>();
    const notify = () => { for (const listener of listeners) listener(); };
    return {
        subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
        available: () => owner?.enabled ?? false,
        start(id: PixelPracticeId) { pixelPracticePreset(id); if (owner?.enabled) owner.start(id); },
        register(start: Registration['start'], enabled: boolean) {
            const registration = { start, enabled }; owner = registration; notify();
            return {
                setEnabled(value: boolean) { if (owner === registration && value !== registration.enabled) { registration.enabled = value; notify(); } },
                unregister() { if (owner === registration) { owner = null; notify(); } },
            };
        },
    };
}

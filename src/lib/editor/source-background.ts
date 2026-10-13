export type SourceBackground = {
    color: { r: number; g: number; b: number };
    tolerance: number;
    mode: 'edge-connected' | 'all-matching';
};
export const SOURCE_BACKGROUND_MAX_PIXELS = 8_000_000;
export const SOURCE_BACKGROUND_MAX_DIMENSION = 16_384;
const WORK_PER_YIELD = 2048;

export class SourceBackgroundError extends RangeError {
    constructor(public readonly code: 'INVALID_BACKGROUND' | 'INVALID_IMAGE' | 'IMAGE_TOO_LARGE' | 'INVALID_RESPONSE') {
        super(code); this.name = 'SourceBackgroundError';
    }
}

function dataFields(value: unknown, keys: string[]): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const actual = Reflect.ownKeys(value);
    if (actual.length !== keys.length || actual.some(key => typeof key !== 'string' || !keys.includes(key))) return null;
    const result: Record<string, unknown> = Object.create(null);
    for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor?.enumerable || !('value' in descriptor)) return null;
        result[key] = descriptor.value;
    }
    return result;
}
function isByte(value: unknown): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255; }

function readBackground(value: unknown): SourceBackground | null {
    try {
        const fields = dataFields(value, ['color', 'tolerance', 'mode']);
        if (!fields || !isByte(fields.tolerance) || (fields.mode !== 'edge-connected' && fields.mode !== 'all-matching')) return null;
        const color = dataFields(fields.color, ['r', 'g', 'b']);
        if (!color || !isByte(color.r) || !isByte(color.g) || !isByte(color.b)) return null;
        return { color: { r: color.r, g: color.g, b: color.b }, tolerance: fields.tolerance, mode: fields.mode };
    } catch { return null; }
}
export function isValidSourceBackground(value: unknown): value is SourceBackground { return readBackground(value) !== null; }
/** Null means off; never coerce, clamp, execute getters or retain caller objects. */
export function normalizeSourceBackground(value: unknown): SourceBackground | null {
    if (value === undefined || value === null) return null;
    const result = readBackground(value);
    if (!result) throw new SourceBackgroundError('INVALID_BACKGROUND');
    return result;
}

export type SourceBackgroundMaskRequest = {
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
    background: SourceBackground;
};
export type SourceBackgroundMaskResult = { pixels: Uint8ClampedArray; mask: Uint8Array };
export function validateSourceBackgroundDimensions(width: number, height: number): void {
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) throw new SourceBackgroundError('INVALID_IMAGE');
    if (width > SOURCE_BACKGROUND_MAX_DIMENSION || height > SOURCE_BACKGROUND_MAX_DIMENSION || width * height > SOURCE_BACKGROUND_MAX_PIXELS) throw new SourceBackgroundError('IMAGE_TOO_LARGE');
}
export function validateSourceBackgroundMaskRequest(request: SourceBackgroundMaskRequest): SourceBackground {
    if (!request) throw new SourceBackgroundError('INVALID_IMAGE');
    validateSourceBackgroundDimensions(request.width, request.height);
    if (!(request.pixels instanceof Uint8ClampedArray) || request.pixels.length !== request.width * request.height * 4) throw new SourceBackgroundError('INVALID_IMAGE');
    const background = normalizeSourceBackground(request.background);
    if (!background) throw new SourceBackgroundError('INVALID_BACKGROUND');
    return background;
}

/** Raw, unfiltered RGB uses max-channel distance. Alpha-zero cells are always
 * empty and may connect boundary background through transparent corridors.
 * The queue has one slot per ROI cell; each cell is enqueued at most once. */
export function* createSourceBackgroundMaskSteps(request: SourceBackgroundMaskRequest): Generator<void, SourceBackgroundMaskResult> {
    const background = validateSourceBackgroundMaskRequest(request);
    const { pixels, width, height } = request, count = width * height;
    // During traversal, 1 means visited. The final pass changes this to
    // keep=1 / remove=0, so the returned mask has one unambiguous meaning.
    const mask = new Uint8Array(count);
    let work = 0;
    const matches = (index: number): boolean => {
        const offset = index * 4;
        return pixels[offset + 3] === 0 || Math.max(Math.abs(pixels[offset] - background.color.r),
            Math.abs(pixels[offset + 1] - background.color.g), Math.abs(pixels[offset + 2] - background.color.b)) <= background.tolerance;
    };
    if (background.mode === 'all-matching') {
        for (let i = 0; i < count; i++) {
            mask[i] = matches(i) ? 1 : 0;
            if (++work % WORK_PER_YIELD === 0) yield;
        }
    } else {
        const queue = new Uint32Array(count);
        let head = 0, tail = 0;
        const enqueue = (index: number): void => {
            if (mask[index] === 0 && matches(index)) { mask[index] = 1; queue[tail++] = index; }
        };
        for (let x = 0; x < width; x++) {
            enqueue(x); enqueue((height - 1) * width + x);
            if (++work % WORK_PER_YIELD === 0) yield;
        }
        for (let y = 1; y < height - 1; y++) {
            enqueue(y * width); enqueue(y * width + width - 1);
            if (++work % WORK_PER_YIELD === 0) yield;
        }
        while (head < tail) {
            const index = queue[head++], x = index % width;
            if (x > 0) enqueue(index - 1);
            if (x + 1 < width) enqueue(index + 1);
            if (index >= width) enqueue(index - width);
            if (index + width < count) enqueue(index + width);
            if (++work % WORK_PER_YIELD === 0) yield;
        }
    }
    const output = new Uint8ClampedArray(pixels);
    for (let i = 0; i < count; i++) {
        const offset = i * 4;
        mask[i] = pixels[offset + 3] === 0 || mask[i] === 1 ? 0 : 1;
        if (mask[i] === 0) output.fill(0, offset, offset + 4);
        if (++work % WORK_PER_YIELD === 0) yield;
    }
    return { pixels: output, mask };
}
export function runSourceBackgroundMask(request: SourceBackgroundMaskRequest): SourceBackgroundMaskResult {
    const steps = createSourceBackgroundMaskSteps(request);
    let step = steps.next();
    while (!step.done) step = steps.next();
    return step.value;
}

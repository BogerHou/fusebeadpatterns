import { PixelGridError } from './errors';

/** Independent digital-pixel model. No bead palettes, print units or bead-project storage. */
export type RgbaPixels = readonly number[] | Uint8Array | Uint8ClampedArray;
export type PixelPoint = readonly [number, number];
export type ResizeMode = 'fit' | 'crop' | 'stretch';
export interface RgbaSource {
    width: number;
    height: number;
    pixels: RgbaPixels;
}
export interface PixelGrid extends RgbaSource {
    pixels: Uint8ClampedArray<ArrayBuffer>;
}
export type Grid = PixelGrid;
export interface ImageHeader {
    mime: 'image/png' | 'image/jpeg' | 'image/webp';
    width: number;
    height: number;
}

export const LIMITS = Object.freeze({ minSide: 1, maxSide: 128, maxPixels: 16384, maxProjectBytes: 524288, maxImageBytes: 8388608, maxImageSide: 2048, maxImagePixels: 4194304 });
export const FORMAT = 'pixel-grid-project';

export function dimensions(width: unknown, height: unknown): { width: number; height: number } {
    if (typeof width !== 'number' || typeof height !== 'number' || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > LIMITS.maxSide || height > LIMITS.maxSide || width * height > LIMITS.maxPixels) throw new PixelGridError('INVALID_DIMENSIONS');
    return { width, height };
}
function bytes(values: unknown, length: number): Uint8ClampedArray<ArrayBuffer> {
    if ((!Array.isArray(values) && !(values instanceof Uint8ClampedArray) && !(values instanceof Uint8Array)) || values.length !== length) throw new PixelGridError('PIXEL_DATA_LENGTH');
    if (Array.isArray(values)) for (let i = 0; i < values.length; i++) if (!Number.isInteger(values[i]) || values[i] < 0 || values[i] > 255) throw new PixelGridError('INVALID_RGBA_CHANNELS');
    return new Uint8ClampedArray(values);
}
export function createGrid(width: number, height: number, rgba?: RgbaPixels): PixelGrid {
    dimensions(width, height);
    return { width, height, pixels: rgba === undefined ? new Uint8ClampedArray(width * height * 4) : bytes(rgba, width * height * 4) };
}
export function setPixel(grid: PixelGrid, x: number, y: number, rgba: RgbaPixels): boolean {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= grid.width || y >= grid.height) return false;
    grid.pixels.set(bytes(rgba, 4), (y * grid.width + x) * 4);
    return true;
}
export function paintLine(grid: PixelGrid, start: PixelPoint, end: PixelPoint, rgba: RgbaPixels): void {
    if (![...start, ...end].every(Number.isInteger)) throw new PixelGridError('INVALID_PIXEL_POSITION');
    let [x, y] = start;
    const [tx, ty] = end;
    const dx = Math.abs(tx - x), dy = -Math.abs(ty - y), sx = x < tx ? 1 : -1, sy = y < ty ? 1 : -1;
    let error = dx + dy;
    for (;;) {
        setPixel(grid, x, y, rgba);
        if (x === tx && y === ty) break;
        const twice = 2 * error;
        if (twice >= dy) { error += dy; x += sx; }
        if (twice <= dx) { error += dx; y += sy; }
    }
}
export function resizeNearest(source: RgbaSource, width: number, height: number): PixelGrid {
    return resizeImage(source, width, height, 'stretch');
}
export function resizeImage(source: RgbaSource, width: number, height: number, mode: ResizeMode = 'fit'): PixelGrid {
    dimensions(width, height);
    if (!['fit', 'crop', 'stretch'].includes(mode)) throw new PixelGridError('INVALID_RESIZE_MODE');
    if (!Number.isInteger(source.width) || !Number.isInteger(source.height) || source.width < 1 || source.height < 1 || source.width > LIMITS.maxImageSide || source.height > LIMITS.maxImageSide || source.width * source.height > LIMITS.maxImagePixels) throw new PixelGridError('SOURCE_IMAGE_LIMIT');
    const input = bytes(source.pixels, source.width * source.height * 4), output = createGrid(width, height);
    let drawWidth = width, drawHeight = height, left = 0, top = 0;
    let sourceLeft = 0, sourceTop = 0, sourceWidth = source.width, sourceHeight = source.height;
    if (mode === 'fit') {
        const scale = Math.min(width / source.width, height / source.height);
        drawWidth = Math.max(1, Math.min(width, Math.round(source.width * scale)));
        drawHeight = Math.max(1, Math.min(height, Math.round(source.height * scale)));
        left = Math.floor((width - drawWidth) / 2);
        top = Math.floor((height - drawHeight) / 2);
    } else if (mode === 'crop') {
        const scale = Math.max(width / source.width, height / source.height);
        sourceWidth = width / scale;
        sourceHeight = height / scale;
        sourceLeft = (source.width - sourceWidth) / 2;
        sourceTop = (source.height - sourceHeight) / 2;
    }
    for (let y = 0; y < drawHeight; y++) for (let x = 0; x < drawWidth; x++) {
        const sx = Math.min(source.width - 1, Math.floor(sourceLeft + (x + 0.5) * sourceWidth / drawWidth));
        const sy = Math.min(source.height - 1, Math.floor(sourceTop + (y + 0.5) * sourceHeight / drawHeight));
        const offset = ((y + top) * width + x + left) * 4;
        output.pixels.set(input.subarray((sy * source.width + sx) * 4, (sy * source.width + sx) * 4 + 4), offset);
    }
    return output;
}
export function gridsEqual(first: RgbaSource, second: RgbaSource): boolean {
    return first.width === second.width && first.height === second.height &&
        first.pixels.length === second.pixels.length && first.pixels.every((value, index) => value === second.pixels[index]);
}
function cloneGrid(grid: RgbaSource): PixelGrid { return createGrid(grid.width, grid.height, grid.pixels); }

/** Whole-operation history also restores dimensions; undo + redo share one bounded budget. */
export type GridHistorySnapshot = { undo: PixelGrid[]; redo: PixelGrid[] };
export class GridHistory {
    private readonly maxSteps: number;
    private readonly undoStates: PixelGrid[];
    private readonly redoStates: PixelGrid[];
    constructor(maxSteps: number = 50) {
        if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new PixelGridError('INVALID_HISTORY_LIMIT');
        this.maxSteps = maxSteps;
        this.undoStates = [];
        this.redoStates = [];
    }
    get canUndo() { return this.undoStates.length > 0; }
    get canRedo() { return this.redoStates.length > 0; }
    get retainedSteps() { return this.undoStates.length + this.redoStates.length; }
    snapshot(): GridHistorySnapshot {
        return { undo: this.undoStates.map(cloneGrid), redo: this.redoStates.map(cloneGrid) };
    }
    restore(snapshot: GridHistorySnapshot): void {
        if (snapshot.undo.length + snapshot.redo.length > this.maxSteps) throw new PixelGridError('INVALID_HISTORY_LIMIT');
        const undo = snapshot.undo.map(cloneGrid), redo = snapshot.redo.map(cloneGrid);
        this.undoStates.splice(0, this.undoStates.length, ...undo);
        this.redoStates.splice(0, this.redoStates.length, ...redo);
    }
    push(before: RgbaSource, after: RgbaSource): boolean {
        if (gridsEqual(before, after)) return false;
        this.undoStates.push(cloneGrid(before));
        this.redoStates.length = 0;
        if (this.undoStates.length > this.maxSteps) this.undoStates.shift();
        return true;
    }
    undo(current: RgbaSource): PixelGrid | null {
        if (!this.canUndo) return null;
        this.redoStates.push(cloneGrid(current));
        return this.undoStates.pop() ?? null;
    }
    redo(current: RgbaSource): PixelGrid | null {
        if (!this.canRedo) return null;
        this.undoStates.push(cloneGrid(current));
        return this.redoStates.pop() ?? null;
    }
}
export function serializeProject(grid: RgbaSource): string {
    const checked = createGrid(grid.width, grid.height, grid.pixels);
    return JSON.stringify({ format: FORMAT, version: 1, width: checked.width, height: checked.height, pixels: Array.from(checked.pixels) });
}
export function parseProject(text: string): PixelGrid {
    if (typeof text !== 'string' || new TextEncoder().encode(text).length > LIMITS.maxProjectBytes) throw new PixelGridError('PROJECT_TOO_LARGE');
    let object: unknown;
    try { object = JSON.parse(text); } catch { throw new PixelGridError('PROJECT_INVALID_JSON'); }
    if (!object || typeof object !== 'object' || Array.isArray(object) || !('format' in object) || object.format !== FORMAT || !('version' in object) || object.version !== 1) throw new PixelGridError('PROJECT_UNSUPPORTED_FORMAT');
    const allowed = ['format', 'version', 'width', 'height', 'pixels'];
    if (allowed.some(key => !Object.hasOwn(object, key))) throw new PixelGridError('PROJECT_MISSING_FIELDS');
    if (Object.keys(object).some(key => !allowed.includes(key))) throw new PixelGridError('PROJECT_UNSUPPORTED_FIELDS');
    const project = object as Record<string, unknown>;
    const size = dimensions(project.width, project.height);
    return createGrid(size.width, size.height, bytes(project.pixels, size.width * size.height * 4));
}

/** Header/limit screening only; the browser must still successfully decode the image. */
export function inspectImage(input: Uint8Array | ArrayBuffer, mime: string = ''): ImageHeader {
    const data = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (!data.length || data.length > LIMITS.maxImageBytes) throw new PixelGridError('IMAGE_FILE_SIZE');
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const ascii = (offset: number, count: number) => String.fromCharCode(...data.subarray(offset, offset + count));
    let kind: ImageHeader['mime'];
    let width: number | undefined, height: number | undefined;
    if (data.length >= 33 && ascii(1, 3) === 'PNG' && data[0] === 137 && ascii(12, 4) === 'IHDR') {
        kind = 'image/png'; width = view.getUint32(16); height = view.getUint32(20);
        for (let offset = 8; offset + 12 <= data.length;) {
            const size = view.getUint32(offset), type = ascii(offset + 4, 4);
            if (size > data.length - offset - 12) throw new PixelGridError('PNG_INCOMPLETE_CHUNK');
            if (type === 'acTL') throw new PixelGridError('PNG_ANIMATED');
            offset += size + 12;
        }
    } else if (data.length >= 4 && data[0] === 255 && data[1] === 216) {
        kind = 'image/jpeg';
        for (let offset = 2; offset + 4 <= data.length;) {
            if (data[offset] !== 255) throw new PixelGridError('JPEG_INVALID_MARKER');
            while (data[offset] === 255) offset++;
            const marker = data[offset++];
            if (marker === 217 || marker === 218) break;
            if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
            if (offset + 2 > data.length) break;
            const size = view.getUint16(offset);
            if (size < 2 || offset + size > data.length) throw new PixelGridError('JPEG_INCOMPLETE_SEGMENT');
            if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
                if (size < 8) throw new PixelGridError('JPEG_INVALID_DIMENSIONS');
                height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break;
            }
            offset += size;
        }
    } else if (data.length >= 20 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
        kind = 'image/webp';
        for (let offset = 12; offset + 8 <= data.length;) {
            const type = ascii(offset, 4), size = view.getUint32(offset + 4, true), start = offset + 8;
            if (size > data.length - start) throw new PixelGridError('WEBP_INCOMPLETE_CHUNK');
            if (type === 'ANIM' || type === 'ANMF' || (type === 'VP8X' && size >= 10 && (data[start] & 2))) throw new PixelGridError('WEBP_ANIMATED');
            if (type === 'VP8X' && size >= 10) {
                width = 1 + data[start+4] + (data[start+5] << 8) + (data[start+6] << 16);
                height = 1 + data[start+7] + (data[start+8] << 8) + (data[start+9] << 16);
            } else if (type === 'VP8L' && size >= 5 && data[start] === 47) {
                const bits = view.getUint32(start + 1, true); width = (bits & 16383) + 1; height = ((bits >>> 14) & 16383) + 1;
            } else if (type === 'VP8 ' && size >= 10 && data[start+3] === 157 && data[start+4] === 1 && data[start+5] === 42) {
                width = view.getUint16(start + 6, true) & 16383; height = view.getUint16(start + 8, true) & 16383;
            }
            offset = start + size + (size % 2);
        }
    } else throw new PixelGridError('IMAGE_UNSUPPORTED_FORMAT');
    if (mime && (mime === 'image/jpg' ? 'image/jpeg' : mime) !== kind) throw new PixelGridError('IMAGE_MIME_MISMATCH');
    if (!width || !height || width > LIMITS.maxImageSide || height > LIMITS.maxImageSide || width * height > LIMITS.maxImagePixels) throw new PixelGridError('IMAGE_DIMENSIONS_LIMIT');
    return { mime: kind, width, height };
}

function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
    const result = new Uint8Array(data.length + 12), view = new DataView(result.buffer);
    view.setUint32(0, data.length); result.set(new TextEncoder().encode(type), 4); result.set(data, 8);
    view.setUint32(result.length - 4, crc32(result.subarray(4, result.length - 4)));
    return result;
}
function requirePngSupport(): void {
    if (typeof CompressionStream === 'undefined') throw new PixelGridError('PNG_EXPORT_UNSUPPORTED');
}
/** Shared PNG packaging; scanlines already include one zero filter byte per row. */
async function encodePngScanlines(width: number, height: number, scanlines: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
    const deflated = new Uint8Array(await new Response(new Blob([scanlines]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
    const header = new Uint8Array(13), view = new DataView(header.buffer);
    view.setUint32(0, width); view.setUint32(4, height); header[8] = 8; header[9] = 6;
    const parts = [new Uint8Array([137,80,78,71,13,10,26,10]), pngChunk('IHDR', header), pngChunk('IDAT', deflated), pngChunk('IEND', new Uint8Array())];
    const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; }
    return output;
}
/** Exact current-model RGBA, including hidden RGB at alpha zero; no Canvas round trip. */
export async function encodePng(grid: RgbaSource): Promise<Uint8Array<ArrayBuffer>> {
    const checked = createGrid(grid.width, grid.height, grid.pixels);
    requirePngSupport();
    const rowBytes = checked.width * 4, scanlines = new Uint8Array((rowBytes + 1) * checked.height);
    for (let y = 0; y < checked.height; y++) scanlines.set(checked.pixels.subarray(y * rowBytes, (y + 1) * rowBytes), y * (rowBytes + 1) + 1);
    return encodePngScanlines(checked.width, checked.height, scanlines);
}

/** Repeat RGBA cells exactly, without Canvas, smoothing, grid lines or a larger model.
 * 128 × 16 limits the output to 2048 × 2048. Only scanlines are expanded;
 * no additional expanded RGBA array is retained alongside that buffer.
 */
export async function encodeScaledPng(grid: RgbaSource, scale: number): Promise<Uint8Array<ArrayBuffer>> {
    if (![1, 2, 4, 8, 16].includes(scale)) throw new PixelGridError('PNG_SCALE_INVALID');
    if (scale === 1) return encodePng(grid);
    const checked = createGrid(grid.width, grid.height, grid.pixels);
    requirePngSupport();
    const width = checked.width * scale, height = checked.height * scale, stride = width * 4 + 1;
    const scanlines = new Uint8Array(stride * height);
    for (let y = 0; y < checked.height; y++) {
        const row = y * scale * stride;
        for (let x = 0; x < checked.width; x++) {
            const source = (y * checked.width + x) * 4;
            for (let repeated = 0; repeated < scale; repeated++) {
                const target = row + 1 + (x * scale + repeated) * 4;
                scanlines[target] = checked.pixels[source];
                scanlines[target + 1] = checked.pixels[source + 1];
                scanlines[target + 2] = checked.pixels[source + 2];
                scanlines[target + 3] = checked.pixels[source + 3];
            }
        }
        for (let repeated = 1; repeated < scale; repeated++) scanlines.copyWithin(row + repeated * stride, row, row + stride);
    }
    return encodePngScanlines(width, height, scanlines);
}

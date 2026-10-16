import { createGrid, type PixelGrid } from '../pixel-grid/core';

export type ShapeKind = 'ellipse' | 'sphere' | 'dome' | 'cylinder' | 'cone';
export type ShapeStyle = 'filled' | 'hollow';
export interface ShapeSpec {
    kind: ShapeKind;
    width: number;
    depth: number;
    height: number;
    style: ShapeStyle;
    thickness: number;
}
export interface ShapeBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
}
export interface ShapeModel {
    spec: ShapeSpec;
    width: number;
    depth: number;
    height: number;
    mask: Uint8Array<ArrayBuffer>;
    solidCount: number;
    total: number;
    layerCounts: Uint32Array<ArrayBuffer>;
    bounds: ShapeBounds | null;
}
export interface ShapeRun { start: number; end: number; count: number }
export interface ShapeRow { row: number; runs: ShapeRun[]; count: number }

export const SHAPE_LIMITS = Object.freeze({ max2DSide: 128, max3DSide: 96, maxThickness: 8, maxVoxels: 96 ** 3 });
export const DEFAULT_SPEC: Readonly<ShapeSpec> = Object.freeze({ kind: 'ellipse', width: 15, depth: 15, height: 1, style: 'hollow', thickness: 1 });

const KINDS: readonly ShapeKind[] = ['ellipse', 'sphere', 'dome', 'cylinder', 'cone'];
const SPEC_KEYS = ['kind', 'width', 'depth', 'height', 'style', 'thickness'] as const;

function integer(value: unknown, min: number, max: number): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
function kindValue(value: unknown): value is ShapeKind {
    return typeof value === 'string' && KINDS.includes(value as ShapeKind);
}
function styleValue(value: unknown): value is ShapeStyle {
    return value === 'filled' || value === 'hollow';
}

/** Strict on saved/applied geometry: never normalize a malformed project implicitly. */
export function validateSpec(value: unknown): ShapeSpec {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_SPEC');
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('INVALID_SPEC');
    const keys = Reflect.ownKeys(value);
    if (keys.length !== SPEC_KEYS.length || !SPEC_KEYS.every(key => keys.includes(key))) throw new Error('INVALID_SPEC');
    for (const key of SPEC_KEYS) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !('value' in descriptor)) throw new Error('INVALID_SPEC');
    }
    const input = value as Record<string, unknown>;
    if (!kindValue(input.kind) || !styleValue(input.style) || !integer(input.thickness, 1, SHAPE_LIMITS.maxThickness)) throw new Error('INVALID_SPEC');
    const maxSide = input.kind === 'ellipse' ? SHAPE_LIMITS.max2DSide : SHAPE_LIMITS.max3DSide;
    if (!integer(input.width, 1, maxSide) || !integer(input.depth, 1, maxSide) || !integer(input.height, 1, maxSide)) throw new Error('INVALID_SPEC');
    if (input.kind === 'ellipse') {
        if (input.height !== 1) throw new Error('INVALID_SPEC');
    } else {
        if (input.depth !== input.width) throw new Error('INVALID_SPEC');
        if (input.kind === 'sphere' && input.height !== input.width) throw new Error('INVALID_SPEC');
        if (input.kind === 'dome' && input.height !== Math.ceil(input.width / 2)) throw new Error('INVALID_SPEC');
    }
    return { kind: input.kind, width: input.width, depth: input.depth, height: input.height, style: input.style, thickness: input.thickness };
}

/** Explicit UI normalization. Even unused axes must first be valid bounded integers. */
export function canonicalSpec(kind: ShapeKind, width: number, depth: number, height: number, style: ShapeStyle, thickness: number): ShapeSpec {
    if (!kindValue(kind) || !styleValue(style) || ![width, depth, height].every(value => integer(value, 1, SHAPE_LIMITS.max2DSide)) || !integer(thickness, 1, SHAPE_LIMITS.maxThickness)) throw new Error('INVALID_SPEC');
    return validateSpec({
        kind, width, depth: kind === 'ellipse' ? depth : width,
        height: kind === 'ellipse' ? 1 : kind === 'sphere' ? width : kind === 'dome' ? Math.ceil(width / 2) : height,
        style, thickness,
    });
}

/** Cell-center ellipse with an explicit union of its central one/two axes.
 * Axis preservation keeps the occupied bounds at the requested width/depth.
 */
function ellipseMask(width: number, depth: number): Uint8Array<ArrayBuffer> {
    const result = new Uint8Array(width * depth), ww = width * width, dd = depth * depth;
    for (let z = 0; z < depth; z++) {
        const dz = 2 * z + 1 - depth;
        for (let x = 0; x < width; x++) {
            const dx = 2 * x + 1 - width;
            if (Math.abs(dx) <= 1 || Math.abs(dz) <= 1 || dx * dx * dd + dz * dz * ww <= ww * dd) result[z * width + x] = 1;
        }
    }
    return result;
}

function filledMask(spec: ShapeSpec): Uint8Array<ArrayBuffer> {
    const { kind, width, depth, height } = spec, sliceSize = width * depth;
    if (kind === 'ellipse') return ellipseMask(width, depth);
    const result = new Uint8Array(sliceSize * height);
    if (kind === 'cylinder') {
        const layer = ellipseMask(width, depth);
        for (let y = 0; y < height; y++) result.set(layer, y * sliceSize);
    } else if (kind === 'cone') {
        const tip = width % 2 === 0 ? 2 : 1, rings = (width - tip) / 2;
        for (let y = 0; y < height; y++) {
            // Exact nonnegative half-up rounding; no language-specific tie convention.
            const ring = height === 1 ? rings : Math.floor((2 * rings * (height - 1 - y) + height - 1) / (2 * (height - 1)));
            const diameter = tip + 2 * ring, inset = (width - diameter) / 2;
            const layer = ellipseMask(diameter, diameter);
            for (let z = 0; z < diameter; z++) result.set(layer.subarray(z * diameter, (z + 1) * diameter), y * sliceSize + (z + inset) * width + inset);
        }
    } else {
        const sphereSize = width, rr = sphereSize * sphereSize, yOffset = kind === 'dome' ? Math.floor(sphereSize / 2) : 0;
        for (let y = 0; y < height; y++) {
            const dy = 2 * (y + yOffset) + 1 - sphereSize;
            for (let z = 0; z < depth; z++) {
                const dz = 2 * z + 1 - depth;
                for (let x = 0; x < width; x++) {
                    const dx = 2 * x + 1 - width;
                    if (dx * dx + dy * dy + dz * dz <= rr) result[y * sliceSize + z * width + x] = 1;
                }
            }
        }
    }
    return result;
}

/** Boundary-distance BFS is equivalent to t cardinal erosions, with O(volume)
 * bounded buffers. Open exterior Y ends never seed erosion; internal air does.
 */
function shellMask(solid: Uint8Array<ArrayBuffer>, spec: ShapeSpec): Uint8Array<ArrayBuffer> {
    const { width, depth, height, thickness, kind } = spec, sliceSize = width * depth;
    const output = new Uint8Array(solid.length), queue = new Uint32Array(solid.length);
    const flat = kind === 'ellipse', openBottom = kind === 'dome' || kind === 'cone' || kind === 'cylinder', openTop = kind === 'cylinder';
    let tail = 0;
    for (let y = 0; y < height; y++) for (let z = 0; z < depth; z++) for (let x = 0; x < width; x++) {
        const cell = y * sliceSize + z * width + x;
        if (!solid[cell]) continue;
        const boundary = x === 0 || x === width - 1 || z === 0 || z === depth - 1 ||
            !solid[cell - 1] || !solid[cell + 1] || !solid[cell - width] || !solid[cell + width] ||
            (!flat && ((y === 0 ? !openBottom : !solid[cell - sliceSize]) || (y === height - 1 ? !openTop : !solid[cell + sliceSize])));
        if (boundary) { output[cell] = 1; queue[tail++] = cell; }
    }
    let head = 0;
    const visit = (cell: number) => {
        if (solid[cell] && !output[cell]) { output[cell] = 1; queue[tail++] = cell; }
    };
    for (let distance = 1; distance < thickness && head < tail; distance++) {
        const endOfWave = tail;
        while (head < endOfWave) {
            const cell = queue[head++], x = cell % width, inLayer = cell % sliceSize, z = Math.floor(inLayer / width), y = Math.floor(cell / sliceSize);
            if (x > 0) visit(cell - 1);
            if (x + 1 < width) visit(cell + 1);
            if (z > 0) visit(cell - width);
            if (z + 1 < depth) visit(cell + width);
            if (!flat && y > 0) visit(cell - sliceSize);
            if (!flat && y + 1 < height) visit(cell + sliceSize);
        }
    }
    return output;
}

/** X left-to-right, Z row order, Y bottom-to-top; no real-world placement claim. */
export function generateShape(input: ShapeSpec): ShapeModel {
    const spec = validateSpec(input), { width, depth, height } = spec;
    const solid = filledMask(spec);
    let solidCount = 0;
    for (let cell = 0; cell < solid.length; cell++) solidCount += solid[cell];
    const mask = spec.style === 'hollow' ? shellMask(solid, spec) : solid;
    const layerCounts = new Uint32Array(height), sliceSize = width * depth;
    let total = 0, minX = width, minY = height, minZ = depth, maxX = -1, maxY = -1, maxZ = -1;
    for (let y = 0; y < height; y++) for (let z = 0; z < depth; z++) for (let x = 0; x < width; x++) {
        if (!mask[y * sliceSize + z * width + x]) continue;
        total++; layerCounts[y]++;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    return { spec, width, depth, height, mask, solidCount, total, layerCounts, bounds: total ? { minX, maxX, minY, maxY, minZ, maxZ } : null };
}

function checkedLayer(model: ShapeModel, y: number): number {
    const spec = validateSpec(model.spec);
    if (model.width !== spec.width || model.depth !== spec.depth || model.height !== spec.height || !(model.mask instanceof Uint8Array) || model.mask.length !== spec.width * spec.depth * spec.height) throw new Error('INVALID_MODEL');
    if (!integer(y, 0, spec.height - 1)) throw new Error('INVALID_LAYER');
    return y * spec.width * spec.depth;
}

/** Always return an owned copy; callers cannot mutate the original volume. */
export function getLayerMask(model: ShapeModel, y: number): Uint8Array<ArrayBuffer> {
    const start = checkedLayer(model, y), layer = model.mask.slice(start, start + model.width * model.depth);
    if (layer.some(cell => cell !== 0 && cell !== 1)) throw new Error('INVALID_MODEL');
    return layer;
}

/** A selected layer is an ordinary RGBA pixel grid; empty cells stay zero RGBA. */
export function layerGrid(model: ShapeModel, y: number, colorHex: string): PixelGrid {
    if (typeof colorHex !== 'string' || !/^#[\da-f]{6}$/i.test(colorHex)) throw new Error('INVALID_COLOR');
    const layer = getLayerMask(model, y), grid = createGrid(model.width, model.depth);
    const color = [Number.parseInt(colorHex.slice(1, 3), 16), Number.parseInt(colorHex.slice(3, 5), 16), Number.parseInt(colorHex.slice(5, 7), 16), 255];
    for (let cell = 0; cell < layer.length; cell++) if (layer[cell]) grid.pixels.set(color, cell * 4);
    return grid;
}

/** Display coordinates are one-based and inclusive; empty rows are retained. */
export function layerRows(model: ShapeModel, y: number): ShapeRow[] {
    const layer = getLayerMask(model, y), rows: ShapeRow[] = [];
    for (let z = 0; z < model.depth; z++) {
        const runs: ShapeRun[] = [];
        let count = 0, x = 0;
        while (x < model.width) {
            if (!layer[z * model.width + x]) { x++; continue; }
            const start = x;
            do { x++; } while (x < model.width && layer[z * model.width + x]);
            const length = x - start;
            runs.push({ start: start + 1, end: x, count: length }); count += length;
        }
        rows.push({ row: z + 1, runs, count });
    }
    return rows;
}

/** Arithmetic convenience only: actual items may have a different stack size. */
export function stackBreakdown(total: number, size: 16 | 64): { stacks: number; remainder: number } {
    if (!integer(total, 0, SHAPE_LIMITS.maxVoxels) || (size !== 16 && size !== 64)) throw new Error('INVALID_COUNT');
    return { stacks: Math.floor(total / size), remainder: total % size };
}

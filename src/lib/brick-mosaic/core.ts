import { createGrid, resizeImage, type PixelGrid, type PixelPoint, type ResizeMode, type RgbaSource } from '../pixel-grid/core';

/** Catalog IDs are opaque. LDraw, LEGO colour and element IDs are separate systems. */
export type BrickColor = { id: string; name: string; hex: string; ldrawCode: number; legoColorId: number | null; elementId: string };
export type BrickCatalog = {
    version: string;
    part: { designId: string; name: string; kind: 'plate' | 'round-tile' | 'square-tile' };
    colors: readonly BrickColor[];
};
export type Mosaic = { width: number; height: number; boardSize: 32 | 48; cells: (string | null)[] };
export type MosaicMaterial = { color: BrickColor; count: number };
export type MosaicBoard = {
    row: number; column: number; startX: number; startY: number; width: number; height: number;
    capacity: number; padding: number; occupied: number; emptyCount: number; counts: MosaicMaterial[];
};
export type MosaicMaterials = {
    total: number; emptyCount: number; usedColors: MosaicMaterial[]; boardSize: 32 | 48;
    boardColumns: number; boardRows: number; boards: MosaicBoard[];
};
export type MosaicSamplingOptions = {
    boardSize?: 32 | 48;
    /** Fully transparent pixels are always empty; other alpha below this value is empty. */
    alphaThreshold?: number;
    /** Remaining alpha is composited onto this RGB matte, then mapped to opaque parts. */
    matte?: readonly [number, number, number];
    maxColors?: number;
    dither?: boolean;
};
export const MOSAIC_LIMITS = Object.freeze({ maxSide: 128, maxCells: 16_384, maxColors: 256, maxHistory: 100 });
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9._-]{1,80}$/.test(value);
const integer = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const fail = (code: string): never => { throw new Error(code); };
const copyColor = (color: BrickColor): BrickColor => ({ ...color });

/** Structure validation does not itself certify a real-world part/colour pairing. */
export function validateBrickCatalog(catalog: BrickCatalog): BrickCatalog {
    if (!record(catalog) || !identifier(catalog.version) || !record(catalog.part) || !identifier(catalog.part.designId)
        || typeof catalog.part.name !== 'string' || !catalog.part.name.trim() || catalog.part.name.length > 160
        || !['plate', 'round-tile', 'square-tile'].includes(catalog.part.kind)
        || !Array.isArray(catalog.colors) || !catalog.colors.length || catalog.colors.length > MOSAIC_LIMITS.maxColors) return fail('INVALID_CATALOG');
    const ids = new Set<string>(), elements = new Set<string>();
    for (const color of catalog.colors) {
        if (!record(color) || !identifier(color.id) || ids.has(color.id) || typeof color.name !== 'string' || !color.name.trim() || color.name.length > 160
            || typeof color.hex !== 'string' || !/^#[\da-f]{6}$/i.test(color.hex)
            || !integer(color.ldrawCode, 0, 2_147_483_647) || !(color.legoColorId === null || integer(color.legoColorId, 0, 2_147_483_647))
            || !identifier(color.elementId) || elements.has(color.elementId)) return fail('INVALID_CATALOG');
        ids.add(color.id); elements.add(color.elementId);
    }
    return { version: catalog.version, part: { ...catalog.part }, colors: catalog.colors.map(copyColor) };
}
function dimensions(width: unknown, height: unknown, boardSize: unknown): void {
    if (!integer(width, 1, MOSAIC_LIMITS.maxSide) || !integer(height, 1, MOSAIC_LIMITS.maxSide)
        || width * height > MOSAIC_LIMITS.maxCells || (boardSize !== 32 && boardSize !== 48)) fail('INVALID_MOSAIC_DIMENSIONS');
}
function knownColor(value: unknown, colors: ReadonlySet<string>): value is string | null {
    return value === null || (typeof value === 'string' && colors.has(value));
}
export function createMosaic(width: number, height: number, boardSize: 32 | 48, catalog: BrickCatalog, cells?: readonly (string | null)[]): Mosaic {
    dimensions(width, height, boardSize);
    const checked = validateBrickCatalog(catalog), ids = new Set(checked.colors.map(color => color.id));
    if (cells !== undefined && (!Array.isArray(cells) || cells.length !== width * height || Array.from(cells).some(color => !knownColor(color, ids)))) fail('INVALID_MOSAIC_CELLS');
    return { width, height, boardSize, cells: cells === undefined ? new Array<string | null>(width * height).fill(null) : Array.from(cells) };
}
export function validateMosaic(value: unknown, catalog: BrickCatalog): Mosaic {
    if (!record(value) || Object.keys(value).sort().join(',') !== 'boardSize,cells,height,width' || !Array.isArray(value.cells)) return fail('INVALID_MOSAIC');
    dimensions(value.width, value.height, value.boardSize);
    return createMosaic(value.width as number, value.height as number, value.boardSize as 32 | 48, catalog, value.cells as (string | null)[]);
}
export function cloneMosaic(model: Mosaic, catalog: BrickCatalog): Mosaic { return validateMosaic(model, catalog); }
function checkPoint(model: Mosaic, point: PixelPoint): void {
    if (!Array.isArray(point) || point.length !== 2 || !integer(point[0], 0, model.width - 1) || !integer(point[1], 0, model.height - 1)) fail('INVALID_MOSAIC_POSITION');
}
function checkColor(color: unknown, catalog: BrickCatalog): asserts color is string | null {
    if (!knownColor(color, new Set(catalog.colors.map(item => item.id)))) fail('UNKNOWN_MOSAIC_COLOR');
}
/** Every edit returns an owned model; invalid operations cannot partly modify the caller. */
export function paintMosaicLine(model: Mosaic, start: PixelPoint, end: PixelPoint, color: string | null, catalog: BrickCatalog): Mosaic {
    const output = cloneMosaic(model, catalog); checkPoint(output, start); checkPoint(output, end); checkColor(color, catalog);
    let [x, y] = start;
    const [tx, ty] = end, dx = Math.abs(tx - x), dy = -Math.abs(ty - y), sx = x < tx ? 1 : -1, sy = y < ty ? 1 : -1;
    let error = dx + dy;
    for (;;) {
        output.cells[y * output.width + x] = color;
        if (x === tx && y === ty) break;
        const twice = 2 * error;
        if (twice >= dy) { error += dy; x += sx; }
        if (twice <= dx) { error += dx; y += sy; }
    }
    return output;
}
/** Four-connected equality is by catalog ID, including empty cells, never by RGB. */
export function fillMosaic(model: Mosaic, x: number, y: number, color: string | null, catalog: BrickCatalog): Mosaic {
    const output = cloneMosaic(model, catalog); checkPoint(output, [x, y]); checkColor(color, catalog);
    const target = output.cells[y * output.width + x];
    if (target === color) return output;
    const queue = new Uint16Array(output.cells.length); let head = 0, tail = 0;
    const visit = (index: number) => { if (output.cells[index] === target) { output.cells[index] = color; queue[tail++] = index; } };
    visit(y * output.width + x);
    while (head < tail) {
        const cell = queue[head++], column = cell % output.width;
        if (column > 0) visit(cell - 1);
        if (column + 1 < output.width) visit(cell + 1);
        if (cell >= output.width) visit(cell - output.width);
        if (cell + output.width < output.cells.length) visit(cell + output.width);
    }
    return output;
}
export function replaceMosaicColor(model: Mosaic, from: string | null, to: string | null, catalog: BrickCatalog): Mosaic {
    const output = cloneMosaic(model, catalog); checkColor(from, catalog); checkColor(to, catalog);
    output.cells = output.cells.map(color => color === from ? to : color); return output;
}
const rgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
export function renderMosaicRGBA(model: Mosaic, catalog: BrickCatalog): PixelGrid {
    const checked = cloneMosaic(model, catalog), result = createGrid(checked.width, checked.height);
    const colors = new Map(catalog.colors.map(color => [color.id, rgb(color.hex)]));
    checked.cells.forEach((id, index) => { if (id !== null) result.pixels.set([...colors.get(id)!, 255], index * 4); });
    return result;
}

type Triple = readonly [number, number, number];
// Björn Ottosson's public-domain sRGB/Oklab matrices (2021-01-25).
// https://bottosson.github.io/posts/oklab/ — display RGB remains an approximation.
function lab(color: Triple): Triple {
    const [r, g, b] = color.map(byte => { const value = Math.max(0, Math.min(255, byte)) / 255; return value >= .04045 ? ((value + .055) / 1.055) ** 2.4 : value / 12.92; });
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b);
    const m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b);
    const s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    return [.2104542553 * l + .7936177850 * m - .0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .8086757660 * s];
}
const distance = (first: Triple, second: Triple): number => first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0);
function closest(color: Triple, labs: readonly Triple[], indices: readonly number[]): number {
    const source = lab(color); let best = indices[0], minimum = Infinity;
    for (const index of indices) { const error = distance(source, labs[index]); if (error < minimum) { minimum = error; best = index; } }
    return best;
}
/** Deterministic weighted-farthest subset of actual catalog entries; no RGB centroids. */
function subset(sampled: Float64Array, occupied: Uint8Array, labs: readonly Triple[], cap: number): number[] {
    const indices = labs.map((_, index) => index);
    if (cap >= indices.length) return indices;
    const weights = new Uint32Array(indices.length);
    for (let cell = 0; cell < occupied.length; cell++) if (occupied[cell]) weights[closest([sampled[cell * 3], sampled[cell * 3 + 1], sampled[cell * 3 + 2]], labs, indices)]++;
    const used = indices.filter(index => weights[index]);
    if (used.length <= cap) return used;
    let first = used[0];
    for (const index of used) if (weights[index] > weights[first]) first = index;
    const selected = [first], chosen = new Set(selected);
    while (selected.length < cap) {
        let next = -1, highest = -1;
        for (const index of used) if (!chosen.has(index)) {
            const score = Math.min(...selected.map(center => distance(labs[index], labs[center]))) * weights[index];
            if (score > highest) { highest = score; next = index; }
        }
        selected.push(next); chosen.add(next);
    }
    return selected.sort((first, second) => first - second);
}
/** Sample locally, resolve alpha once, then produce only real catalog IDs or null. */
export function sampleToMosaic(source: RgbaSource, width: number, height: number, resizeMode: ResizeMode, catalog: BrickCatalog, options: MosaicSamplingOptions = {}): Mosaic {
    const checked = validateBrickCatalog(catalog), boardSize = options.boardSize ?? 32;
    const model = createMosaic(width, height, boardSize, checked), threshold = options.alphaThreshold ?? 128;
    const matte = options.matte ?? [255, 255, 255], cap = options.maxColors ?? checked.colors.length, dither = options.dither ?? false;
    if (!integer(threshold, 0, 255) || !Array.isArray(matte) || matte.length !== 3 || Array.from(matte).some(value => !integer(value, 0, 255))
        || !integer(cap, 1, checked.colors.length) || typeof dither !== 'boolean') return fail('INVALID_MOSAIC_OPTIONS');
    const input = resizeImage(source, width, height, resizeMode), samples = new Float64Array(width * height * 3), occupied = new Uint8Array(width * height);
    for (let cell = 0; cell < model.cells.length; cell++) {
        const alpha = input.pixels[cell * 4 + 3];
        if (alpha === 0 || alpha < threshold) continue;
        occupied[cell] = 1;
        for (let channel = 0; channel < 3; channel++) samples[cell * 3 + channel] = Math.round((input.pixels[cell * 4 + channel] * alpha + matte[channel] * (255 - alpha)) / 255);
    }
    if (!occupied.some(value => value)) return model;
    const colors = checked.colors.map(color => rgb(color.hex)), labs = colors.map(lab), selected = subset(samples, occupied, labs, cap);
    const errors = dither ? new Float64Array(samples.length) : null;
    const diffuse = (x: number, y: number, error: Triple, weight: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height || !occupied[y * width + x]) return;
        const offset = (y * width + x) * 3;
        for (let channel = 0; channel < 3; channel++) errors![offset + channel] += error[channel] * weight;
    };
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const cell = y * width + x, offset = cell * 3;
        if (!occupied[cell]) continue;
        const adjusted: Triple = [0, 1, 2].map(channel => Math.max(0, Math.min(255, samples[offset + channel] + (errors?.[offset + channel] ?? 0)))) as unknown as Triple;
        const chosen = closest(adjusted, labs, selected); model.cells[cell] = checked.colors[chosen].id;
        if (errors) {
            const error: Triple = [adjusted[0] - colors[chosen][0], adjusted[1] - colors[chosen][1], adjusted[2] - colors[chosen][2]];
            diffuse(x + 1, y, error, 7 / 16); diffuse(x - 1, y + 1, error, 3 / 16); diffuse(x, y + 1, error, 5 / 16); diffuse(x + 1, y + 1, error, 1 / 16);
        }
    }
    return model;
}

/** Board intersections stay in full-image coordinates. Padding never becomes a part. */
export function collectMosaicMaterials(model: Mosaic, catalog: BrickCatalog): MosaicMaterials {
    const checked = cloneMosaic(model, catalog), boardColumns = Math.ceil(checked.width / checked.boardSize), boardRows = Math.ceil(checked.height / checked.boardSize);
    const totalCounts = new Map<string, number>(), boardCounts = Array.from({ length: boardColumns * boardRows }, () => new Map<string, number>());
    checked.cells.forEach((id, cell) => {
        if (id === null) return;
        totalCounts.set(id, (totalCounts.get(id) ?? 0) + 1);
        const x = cell % checked.width, y = Math.floor(cell / checked.width), index = Math.floor(y / checked.boardSize) * boardColumns + Math.floor(x / checked.boardSize);
        boardCounts[index].set(id, (boardCounts[index].get(id) ?? 0) + 1);
    });
    const usedColors = catalog.colors.filter(color => totalCounts.has(color.id)).map(color => ({ color: copyColor(color), count: totalCounts.get(color.id)! }));
    const boards = boardCounts.map((counts, index): MosaicBoard => {
        const column = index % boardColumns, row = Math.floor(index / boardColumns), startX = column * checked.boardSize, startY = row * checked.boardSize;
        const width = Math.min(checked.boardSize, checked.width - startX), height = Math.min(checked.boardSize, checked.height - startY), capacity = width * height;
        const materials = usedColors.map(({ color }) => ({ color: copyColor(color), count: counts.get(color.id) ?? 0 }));
        const occupied = materials.reduce((sum, item) => sum + item.count, 0);
        return { row, column, startX, startY, width, height, capacity, padding: checked.boardSize ** 2 - capacity, occupied, emptyCount: capacity - occupied, counts: materials };
    });
    const total = usedColors.reduce((sum, item) => sum + item.count, 0);
    return { total, emptyCount: checked.cells.length - total, usedColors, boardSize: checked.boardSize, boardColumns, boardRows, boards };
}

/** Whole-operation history stores independent catalog IDs and board dimensions. */
export class MosaicHistory {
    private present: Mosaic;
    private past: Mosaic[] = [];
    private future: Mosaic[] = [];
    private readonly catalog: BrickCatalog;
    constructor(model: Mosaic, catalog: BrickCatalog, private readonly maxSteps = 30) {
        if (!integer(maxSteps, 1, MOSAIC_LIMITS.maxHistory)) fail('INVALID_MOSAIC_HISTORY');
        this.catalog = validateBrickCatalog(catalog); this.present = cloneMosaic(model, this.catalog);
    }
    current(): Mosaic { return cloneMosaic(this.present, this.catalog); }
    canUndo(): boolean { return this.past.length > 0; }
    canRedo(): boolean { return this.future.length > 0; }
    commit(model: Mosaic): Mosaic {
        const next = cloneMosaic(model, this.catalog);
        if (JSON.stringify(next) !== JSON.stringify(this.present)) { this.past.push(this.present); this.past = this.past.slice(-this.maxSteps); this.present = next; this.future = []; }
        return this.current();
    }
    undo(): Mosaic { if (this.past.length) { this.future.push(this.present); this.present = this.past.pop()!; } return this.current(); }
    redo(): Mosaic { if (this.future.length) { this.past.push(this.present); this.present = this.future.pop()!; } return this.current(); }
}

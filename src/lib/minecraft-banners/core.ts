import { DYE_COLORS, DYE_IDS, type DyeId } from './data';
import { BANNER_HEIGHT, BANNER_WIDTH, PATTERN_IDS, patternMask, type PatternId } from './geometry';

export const MAX_BANNER_LAYERS = 6;
export type BannerLayer = { pattern: PatternId; color: DyeId };
export type BannerDesign = { base: DyeId; layers: BannerLayer[] };
export type RgbaImage = { width: number; height: number; pixels: Uint8ClampedArray };
export class BannerError extends Error {
    constructor(public readonly code: string) { super(code); this.name = 'BannerError'; }
}

export function plainRecord(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return (prototype === Object.prototype || prototype === null)
        && Object.values(Object.getOwnPropertyDescriptors(value)).every(descriptor => 'value' in descriptor && descriptor.enumerable);
}
export function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
    return Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function denseDataArray(value: unknown, limit: number): value is unknown[] {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > limit
        || Reflect.ownKeys(value).length !== value.length + 1) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (let index = 0; index < value.length; index++) {
        const descriptor = descriptors[String(index)];
        if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return false;
    }
    return true;
}
export function validateDye(value: unknown): DyeId {
    if (typeof value !== 'string' || !(DYE_IDS as readonly string[]).includes(value)) throw new BannerError('INVALID_DYE');
    return value as DyeId;
}
export function validateLayer(value: unknown): BannerLayer {
    if (!plainRecord(value) || !exactKeys(value, ['pattern', 'color'])
        || typeof value.pattern !== 'string' || !(PATTERN_IDS as readonly string[]).includes(value.pattern)) throw new BannerError('INVALID_LAYER');
    return { pattern: value.pattern as PatternId, color: validateDye(value.color) };
}
export function validateBanner(value: unknown): BannerDesign {
    if (!plainRecord(value) || !exactKeys(value, ['base', 'layers']) || !denseDataArray(value.layers, MAX_BANNER_LAYERS)) throw new BannerError('INVALID_BANNER');
    return { base: validateDye(value.base), layers: Array.from(value.layers, validateLayer) };
}
export function createBanner(base: DyeId = 'white'): BannerDesign { return validateBanner({ base, layers: [] }); }
function layerIndex(design: BannerDesign, index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= design.layers.length) throw new BannerError('INVALID_LAYER_INDEX');
}
export function appendLayer(input: BannerDesign, layer: BannerLayer): BannerDesign {
    const design = validateBanner(input);
    if (design.layers.length >= MAX_BANNER_LAYERS) throw new BannerError('LAYER_LIMIT');
    design.layers.push(validateLayer(layer)); return design;
}
export function replaceLayer(input: BannerDesign, index: number, layer: BannerLayer): BannerDesign {
    const design = validateBanner(input); layerIndex(design, index); design.layers[index] = validateLayer(layer); return design;
}
export function removeLayer(input: BannerDesign, index: number): BannerDesign {
    const design = validateBanner(input); layerIndex(design, index); design.layers.splice(index, 1); return design;
}
export function moveLayer(input: BannerDesign, index: number, delta: -1 | 1): BannerDesign {
    const design = validateBanner(input); layerIndex(design, index);
    if (delta !== -1 && delta !== 1) throw new BannerError('INVALID_LAYER_INDEX');
    layerIndex(design, index + delta);
    [design.layers[index], design.layers[index + delta]] = [design.layers[index + delta], design.layers[index]];
    return design;
}
function rgb(color: DyeId): [number, number, number] {
    const hex = DYE_COLORS[color]; return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)) as [number, number, number];
}
// Public geometry is fixed and tiny. Reuse only these owned masks when drawing
// long text rows; no project or user input is cached here.
const masks = new Map<PatternId, Uint8Array>();
function maskFor(pattern: PatternId): Uint8Array {
    let mask = masks.get(pattern);
    if (!mask) { mask = patternMask(pattern); masks.set(pattern, mask); }
    return mask;
}
/** Flat front-view schematic, not a reproduction of game texture or lighting. */
export function renderBanner(input: BannerDesign, throughLayer?: number): RgbaImage {
    const design = validateBanner(input), count = throughLayer ?? design.layers.length;
    if (!Number.isInteger(count) || count < 0 || count > design.layers.length) throw new BannerError('INVALID_LAYER_INDEX');
    const pixels = new Uint8ClampedArray(BANNER_WIDTH * BANNER_HEIGHT * 4), base = rgb(design.base);
    for (let offset = 0; offset < pixels.length; offset += 4) { pixels.set(base, offset); pixels[offset + 3] = 255; }
    for (const layer of design.layers.slice(0, count)) {
        const color = rgb(layer.color), mask = maskFor(layer.pattern);
        for (let y = 0; y < BANNER_HEIGHT; y++) for (let x = 0; x < BANNER_WIDTH; x++) {
            const alpha = mask[y * BANNER_WIDTH + x] / 255, offset = (y * BANNER_WIDTH + x) * 4;
            if (alpha === 0) continue;
            for (let channel = 0; channel < 3; channel++) pixels[offset + channel] = Math.round(color[channel] * alpha + pixels[offset + channel] * (1 - alpha));
        }
    }
    return { width: BANNER_WIDTH, height: BANNER_HEIGHT, pixels };
}
export function makeLoomSteps(input: BannerDesign): Array<{ step: number; pattern: PatternId; color: DyeId }> {
    return validateBanner(input).layers.map((layer, index) => ({ step: index + 1, ...layer }));
}
export type BannerMaterials = { banners: Partial<Record<DyeId, number>>; dyes: Partial<Record<DyeId, number>>; wool: Partial<Record<DyeId, number>>; sticks: number; loom: 0 | 1 };
/** Counts new layers on already colored base banners; base crafting is separate. */
export function collectMaterials(inputs: BannerDesign[]): BannerMaterials {
    if (!denseDataArray(inputs, 64)) throw new BannerError('INVALID_BANNER');
    const result: BannerMaterials = { banners: {}, dyes: {}, wool: {}, sticks: 0, loom: 0 };
    for (const input of Array.from(inputs)) {
        const design = validateBanner(input);
        result.banners[design.base] = (result.banners[design.base] ?? 0) + 1;
        result.wool[design.base] = (result.wool[design.base] ?? 0) + 6;
        result.sticks++;
        if (design.layers.length) result.loom = 1;
        for (const layer of design.layers) result.dyes[layer.color] = (result.dyes[layer.color] ?? 0) + 1;
    }
    return result;
}

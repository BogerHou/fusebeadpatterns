import { createGrid, type PixelGrid, type RgbaSource, type RgbaPixels } from './core';
import { PixelGridError } from './errors';

export { encodeScaledPng } from './core';
export type ColorLimit = 'original' | 8 | 16 | 32 | 64;
export const COLOR_LIMITS = Object.freeze([8, 16, 32, 64] as const);

type Triplet = readonly [number, number, number];
interface ColorPoint {
    key: number;
    rgb: Triplet;
    lab: Triplet;
    weight: number;
    fitWeight: number;
}
const colorKey = (pixels: RgbaPixels, offset: number = 0): number => (pixels[offset] << 16) | (pixels[offset + 1] << 8) | pixels[offset + 2];

/** Distinct RGB among nonzero-alpha cells; different opacity is not another color. */
export function countVisibleColors(source: RgbaSource): number {
    const checked = createGrid(source.width, source.height, source.pixels), colors = new Set<number>();
    for (let i = 0; i < checked.pixels.length; i += 4) if (checked.pixels[i + 3]) colors.add(colorKey(checked.pixels, i));
    return colors.size;
}

// Björn Ottosson's public-domain linear-sRGB matrices, updated 2021-01-25:
// https://bottosson.github.io/posts/oklab/
// Inverse sRGB transfer: https://bottosson.github.io/posts/colorwrong/
// Input is decoded sRGB bytes, not linear RGB or arbitrary embedded profiles.
function linear(byte: number): number {
    const value = byte / 255;
    return value >= 0.04045 ? ((value + 0.055) / 1.055) ** 2.4 : value / 12.92;
}
function toOklab(rgb: Triplet): Triplet {
    const r = linear(rgb[0]), g = linear(rgb[1]), b = linear(rgb[2]);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ];
}
const distance = (a: Triplet, b: Triplet): number => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
function nearest(point: ColorPoint, palette: readonly ColorPoint[]): number {
    let best = 0, minimum = distance(point.lab, palette[0].lab);
    for (let i = 1; i < palette.length; i++) {
        const next = distance(point.lab, palette[i].lab);
        if (next < minimum) { minimum = next; best = i; }
    }
    return best;
}
function weightedError(points: readonly ColorPoint[], palette: readonly ColorPoint[]): number {
    let total = 0;
    for (const point of points) total += distance(point.lab, palette[nearest(point, palette)].lab) * point.fitWeight;
    return total;
}
function refine(points: readonly ColorPoint[], initial: ColorPoint[]): ColorPoint[] {
    let palette = initial, error = weightedError(points, initial);
    // At most two source-medoid passes: choose an existing source RGB nearest
    // each cluster's Oklab mean, avoiding inverse conversion or gamut clipping.
    // sqrt(sum(alpha)) compresses frequency; it is not a subject/feature detector.
    for (let pass = 0; pass < 2; pass++) {
        const groups: ColorPoint[][] = palette.map((): ColorPoint[] => []);
        for (const point of points) groups[nearest(point, palette)].push(point);
        const candidate = groups.filter(group => group.length).map(group => {
            let weight = 0;
            const sum = [0, 0, 0];
            for (const point of group) { weight += point.fitWeight; for (let c = 0; c < 3; c++) sum[c] += point.lab[c] * point.fitWeight; }
            const mean: Triplet = [sum[0] / weight, sum[1] / weight, sum[2] / weight];
            let best = group[0];
            for (let i = 1; i < group.length; i++) if (distance(group[i].lab, mean) < distance(best.lab, mean)) best = group[i];
            return best;
        }).sort((a, b) => a.key - b.key);
        const nextError = weightedError(points, candidate);
        if (nextError > error || (candidate.length === palette.length && candidate.every((point, i) => point.key === palette[i].key))) break;
        palette = candidate; error = nextError;
    }
    return palette;
}

/** Optional Oklab reduction. Original is the default and returns a byte-exact clone.
 * Farthest-point seeds cover perceptual gaps; canonical RGB order resolves ties.
 * All alpha and alpha-zero hidden RGB are untouched. Colors already within the
 * requested cap are unchanged. Rare noise can receive palette entries, and small
 * features can still disappear; neither this objective nor fewer colors guarantees
 * a better image. No bead palette, dithering, coordinate rules or random seed.
 */
export function reducePixelGridColors(source: PixelGrid, cap: ColorLimit = 'original'): PixelGrid {
    if (cap !== 'original' && !COLOR_LIMITS.some(limit => limit === cap)) throw new PixelGridError('COLOR_LIMIT_INVALID');
    const result = createGrid(source.width, source.height, source.pixels);
    if (cap === 'original') return result;
    const histogram = new Map<number, ColorPoint>();
    for (let i = 0; i < result.pixels.length; i += 4) {
        const alpha = result.pixels[i + 3];
        if (!alpha) continue;
        const key = colorKey(result.pixels, i);
        let point = histogram.get(key);
        if (!point) {
            const rgb: Triplet = [result.pixels[i], result.pixels[i + 1], result.pixels[i + 2]];
            point = { key, rgb, lab: toOklab(rgb), weight: 0, fitWeight: 0 };
            histogram.set(key, point);
        }
        point.weight += alpha;
    }
    if (histogram.size <= cap) return result;
    const points = [...histogram.values()].sort((a, b) => a.key - b.key);
    for (const point of points) point.fitWeight = Math.sqrt(point.weight);
    let first = 0;
    for (let i = 1; i < points.length; i++) if (points[i].weight > points[first].weight) first = i;
    let selected: ColorPoint[] = [];
    const chosen = new Set<number>(), distances = new Float64Array(points.length).fill(Infinity);
    let next = first;
    while (selected.length < cap) {
        const center = points[next]; selected.push(center); chosen.add(next);
        for (let i = 0; i < points.length; i++) distances[i] = Math.min(distances[i], distance(points[i].lab, center.lab));
        next = -1;
        for (let i = 0; i < points.length; i++) if (!chosen.has(i) && (next < 0 || distances[i] > distances[next])) next = i;
        if (next < 0) break;
    }
    selected.sort((a, b) => a.key - b.key);
    selected = refine(points, selected);
    const replacements = new Map<number, Triplet>();
    for (const point of points) replacements.set(point.key, selected[nearest(point, selected)].rgb);
    for (let i = 0; i < result.pixels.length; i += 4) {
        if (result.pixels[i + 3]) result.pixels.set(replacements.get(colorKey(result.pixels, i))!, i);
    }
    return result;
}

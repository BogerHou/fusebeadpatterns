import { Color } from '../core/model/color/color.model';
import { MATCHINGS, type Matching } from '../core/model/matching/matching.model';
import { getMatchingOption } from './config';
import { EDITOR_PROJECT_PATTERN_DIMENSION_MAX } from './editor-limits';
import type { QuantizationRequest } from './quantization-protocol';

export const MAX_BEAD_COLORS = 512;
export const MAX_LIMIT_PALETTE_ENTRIES = 4096;
const WORK_PER_YIELD = 2048;
const MATCH_CACHE_SIZE = 4096;
const DISTANCE_CACHE_SIZE = 65_536;
const MEDOID_ROUNDS = 3;
const MEDOID_CANDIDATES = 32;

/** Null disables the feature. Reject coercion, rounding and silent clamping. */
export function normalizeMaxBeadColors(value: unknown): number | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_BEAD_COLORS) {
        throw new RangeError(`Maximum bead colors must be an integer from 1 to ${MAX_BEAD_COLORS}.`);
    }
    return value;
}

function validateRequest(request: QuantizationRequest): number {
    const cap = normalizeMaxBeadColors(request.maxBeadColors);
    if (cap === null) throw new RangeError('A maximum bead color count is required.');
    // Share the existing project's board-derived dimension limit.
    const dimensionLimit = EDITOR_PROJECT_PATTERN_DIMENSION_MAX;
    if (!Number.isSafeInteger(request.width) || !Number.isSafeInteger(request.height) ||
        request.width < 1 || request.height < 1 || request.width > dimensionLimit || request.height > dimensionLimit ||
        !(request.pixels instanceof Uint8ClampedArray) || request.pixels.length !== request.width * request.height * 4) {
        throw new RangeError('Invalid or oversized bead pattern pixels.');
    }
    if (!Array.isArray(request.palettes)) throw new TypeError('Invalid bead palettes.');
    const position = request.drawingPosition;
    if (!position || ![position.x, position.y, position.width, position.height].every(Number.isFinite) ||
        position.width < 0 || position.height < 0 || !request.dithering ||
        typeof request.dithering.enable !== 'boolean' || !Number.isFinite(request.dithering.hardness) ||
        request.dithering.hardness < 0 || request.dithering.hardness > 100 ||
        (request.preservePatternAlpha !== undefined && request.preservePatternAlpha !== true)) {
        throw new RangeError('Invalid bead conversion options.');
    }
    return cap;
}

function rgbKey(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
}

/** First enabled opaque RGB wins ties, preserving the palette's stable order. */
function getBrandColors(request: QuantizationRequest): Color[] {
    const colors: Color[] = [];
    const seen = new Set<number>();
    let entries = 0;
    // Include empty palettes in the resource bound as well as their entries.
    if (request.palettes.length > MAX_LIMIT_PALETTE_ENTRIES) throw new RangeError('Too many bead palettes.');
    for (const palette of request.palettes) {
        if (!palette || !Array.isArray(palette.entries)) throw new TypeError('Invalid bead palette entries.');
        entries += palette.entries.length;
        if (entries > MAX_LIMIT_PALETTE_ENTRIES) throw new RangeError('Too many bead palette entries for color limiting.');
        for (const entry of palette.entries) {
            if (!entry || typeof entry.enabled !== 'boolean') throw new TypeError('Invalid bead palette entry.');
            if (!entry.enabled) continue;
            const color = entry.color;
            if (!color || ![color.r, color.g, color.b, color.a].every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
                throw new TypeError('Invalid enabled bead palette color.');
            }
            if (color.a !== 255) continue;
            const key = rgbKey(color.r, color.g, color.b);
            if (!seen.has(key)) {
                seen.add(key);
                colors.push(new Color(color.r, color.g, color.b, 255));
            }
        }
    }
    return colors;
}

/** Reject invalid/oversized jobs before cloning or transferring worker input. */
export function validateBrandColorLimitRequest(request: QuantizationRequest): void {
    validateRequest(request);
    getBrandColors(request);
}

type WorkBudget = { count: number };

function* closestIndex(colors: Color[], color: Color, matching: Matching, work: WorkBudget): Generator<void, number> {
    let closest = 0;
    let best = Infinity;
    for (let index = 0; index < colors.length; index++) {
        // CIE94 is directional: keep the legacy candidate/source argument order.
        const distance = matching.delta(colors[index], color);
        if (distance < best) {
            best = distance;
            closest = index;
        }
        if (++work.count % WORK_PER_YIELD === 0) yield;
    }
    return closest;
}

/**
 * Deterministic weighted brand medoids, not an unrestricted RGB centroid or a
 * global optimum. All nonempty pixels contribute to a full-palette histogram.
 * Weighted farthest seeds are refined at most three times; each cluster tests
 * its 32 heaviest members and current center. This bounds refinement work even
 * with several selected brands. Centers always remain real enabled colors.
 */
function* selectSubset(
    pixels: Uint8ClampedArray, colors: Color[], cap: number, matching: Matching, work: WorkBudget
): Generator<void, Color[]> {
    if (cap >= colors.length) return colors;
    const weights = new Uint32Array(colors.length);
    const cache = new Map<number, number>();
    for (let offset = 0; offset < pixels.length; offset += 4) {
        if (pixels[offset + 3] !== 0) {
            const key = rgbKey(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
            let matched = cache.get(key);
            if (matched === undefined) {
                // Every candidate is opaque; source alpha adds the same amount
                // to every Euclidean distance and cannot change the ranking.
                matched = yield* closestIndex(colors, new Color(pixels[offset], pixels[offset + 1], pixels[offset + 2], 255), matching, work);
                if (cache.size < MATCH_CACHE_SIZE) cache.set(key, matched);
            }
            weights[matched]++;
        }
        if (++work.count % WORK_PER_YIELD === 0) yield;
    }
    const used: number[] = [];
    for (let index = 0; index < colors.length; index++) if (weights[index]) used.push(index);
    if (used.length <= cap) return used.map((index) => colors[index]);

    const distanceCache = new Map<number, number>();
    function distance(center: number, point: number): number {
        const key = center * colors.length + point;
        const cached = distanceCache.get(key);
        if (cached !== undefined) return cached;
        const result = matching.delta(colors[center], colors[point]);
        if (distanceCache.size < DISTANCE_CACHE_SIZE) distanceCache.set(key, result);
        return result;
    }
    let first = used[0];
    for (const index of used) if (weights[index] > weights[first]) first = index;
    let centers = [first];
    const selected = new Set(centers);
    const nearest = new Float64Array(colors.length).fill(Infinity);
    while (centers.length < cap) {
        const newest = centers[centers.length - 1];
        let next = -1;
        let highest = -1;
        for (const index of used) {
            nearest[index] = Math.min(nearest[index], distance(newest, index));
            const score = nearest[index] * weights[index];
            if (!selected.has(index) && score > highest) {
                highest = score;
                next = index;
            }
            if (++work.count % WORK_PER_YIELD === 0) yield;
        }
        centers.push(next);
        selected.add(next);
    }
    for (let round = 0; round < MEDOID_ROUNDS; round++) {
        centers.sort((left, right) => left - right);
        const clusters = centers.map((): number[] => []);
        for (const index of used) {
            let cluster = 0;
            let best = Infinity;
            for (let c = 0; c < centers.length; c++) {
                const delta = distance(centers[c], index);
                if (delta < best) { best = delta; cluster = c; }
                if (++work.count % WORK_PER_YIELD === 0) yield;
            }
            clusters[cluster].push(index);
        }
        const updated: number[] = [];
        for (let c = 0; c < clusters.length; c++) {
            const members = clusters[c];
            const candidates = members.slice().sort((left, right) => weights[right] - weights[left] || left - right).slice(0, MEDOID_CANDIDATES);
            if (!candidates.includes(centers[c])) candidates.push(centers[c]);
            candidates.sort((left, right) => left - right);
            let best = Infinity;
            let center = centers[c];
            for (const candidate of candidates) {
                let cost = 0;
                for (const index of members) {
                    cost += weights[index] * distance(candidate, index);
                    if (++work.count % WORK_PER_YIELD === 0) yield;
                }
                if (cost < best) { best = cost; center = candidate; }
            }
            updated.push(center);
        }
        updated.sort((left, right) => left - right);
        if (updated.every((center, index) => center === centers[index])) break;
        centers = updated;
    }
    return centers.map((index) => colors[index]);
}

/**
 * Both the worker and cooperative fallback consume this same stepped program.
 * No caller pixels or palette settings are mutated. Output is reprojected from
 * the original sampled pixels, not from the histogram's full-palette matches.
 */
export function* createBrandColorLimitSteps(request: QuantizationRequest): Generator<void, Uint8ClampedArray> {
    const cap = validateRequest(request);
    const colors = getBrandColors(request);
    const work = { count: 0 };
    let hasBeads = false;
    for (let offset = 3; offset < request.pixels.length; offset += 4) {
        if (request.pixels[offset] !== 0) hasBeads = true;
        if (++work.count % WORK_PER_YIELD === 0) yield;
    }
    if (!hasBeads) return new Uint8ClampedArray(request.pixels);
    if (colors.length === 0) throw new Error('No enabled opaque bead colors are available.');
    const matching = getMatchingOption(request.matchingId)?.value ?? MATCHINGS.EUCLIDEAN;
    const subset = yield* selectSubset(request.pixels, colors, cap, matching, work);
    const output = new Uint8ClampedArray(request.pixels);
    const cache = new Map<number, Color>();
    const position = request.drawingPosition;
    const contains = (x: number, y: number): boolean => x >= position.x && x < position.x + position.width && y >= position.y && y < position.y + position.height;
    const diffuse = (x: number, y: number, error: Color, weight: number): void => {
        // A non-fitted source can extend beyond the canvas. Linear RGBA offsets
        // must not turn an off-canvas neighbor into the preceding/next row.
        if (x < 0 || x >= request.width || y < 0 || y >= request.height || !contains(x, y)) return;
        const offset = (y * request.width + x) * 4;
        // Empty cells have no bead and must retain their hidden source RGB.
        if (output[offset + 3] === 0) return;
        const factor = ((request.dithering.hardness / 100) * weight) / 16;
        output[offset] += error.r * factor;
        output[offset + 1] += error.g * factor;
        output[offset + 2] += error.b * factor;
    };
    for (let y = 0; y < request.height; y++) {
        for (let x = 0; x < request.width; x++) {
            const offset = (y * request.width + x) * 4;
            const alpha = output[offset + 3];
            if (alpha !== 0) {
                const color = new Color(output[offset], output[offset + 1], output[offset + 2], alpha);
                const key = rgbKey(color.r, color.g, color.b) * 256 + alpha;
                let matched = cache.get(key);
                if (!matched) {
                    matched = subset[yield* closestIndex(subset, color, matching, work)];
                    if (cache.size < MATCH_CACHE_SIZE) cache.set(key, matched);
                }
                output[offset] = matched.r;
                output[offset + 1] = matched.g;
                output[offset + 2] = matched.b;
                output[offset + 3] = request.preservePatternAlpha ? alpha : 255;
                if (request.dithering.enable && !request.preservePatternAlpha) {
                    const error = color.sub(matched);
                    diffuse(x + 1, y, error, 7);
                    diffuse(x - 1, y + 1, error, 3);
                    diffuse(x, y + 1, error, 5);
                    diffuse(x + 1, y + 1, error, 1);
                }
            }
            if (++work.count % WORK_PER_YIELD === 0) yield;
        }
    }
    return output;
}

export function runBrandColorLimit(request: QuantizationRequest): Uint8ClampedArray {
    const steps = createBrandColorLimitSteps(request);
    let step = steps.next();
    while (!step.done) step = steps.next();
    return step.value;
}

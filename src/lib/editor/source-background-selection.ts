import { normalizeSourceBackground, type SourceBackground } from './source-background';
import { EDITOR_PROJECT_PATTERN_DIMENSION_MAX } from './editor-limits';

export type BackgroundPixels = { pixels: Uint8ClampedArray; width: number; height: number };
export type BackgroundPreview = BackgroundPixels & { totalBeads: number };

export function backgroundColorHex(color: SourceBackground['color']): string {
    return `#${[color.r, color.g, color.b].map(value => value.toString(16).padStart(2, '0')).join('')}`;
}

/** undefined is invalid input; null is explicitly disabled. Never coerce a draft field. */
export function parseBackgroundCandidate(enabled: boolean, hex: string, tolerance: string, mode: SourceBackground['mode']): SourceBackground | null | undefined {
    if (!enabled) return null;
    const match = /^#?([\da-f]{6})$/i.exec(hex);
    if (!match || !/^\d{1,3}$/.test(tolerance)) return undefined;
    const raw = match[1];
    try {
        return normalizeSourceBackground({ color: { r: parseInt(raw.slice(0, 2), 16), g: parseInt(raw.slice(2, 4), 16), b: parseInt(raw.slice(4, 6), 16) }, tolerance: Number(tolerance), mode });
    } catch { return undefined; }
}

/** The visible canvas may be scaled. Sampling always uses the retained original ROI. */
export function pickBackgroundColor(image: BackgroundPixels, rect: { left: number; top: number; width: number; height: number }, clientX: number, clientY: number): SourceBackground['color'] | null {
    if (![rect.left, rect.top, rect.width, rect.height, clientX, clientY].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0 ||
        clientX < rect.left || clientX >= rect.left + rect.width || clientY < rect.top || clientY >= rect.top + rect.height) return null;
    const x = Math.floor((clientX - rect.left) / rect.width * image.width), y = Math.floor((clientY - rect.top) / rect.height * image.height);
    const at = (y * image.width + x) * 4;
    if (image.pixels[at + 3] === 0 || image.pixels[at + 3] === undefined) return null;
    return { r: image.pixels[at], g: image.pixels[at + 1], b: image.pixels[at + 2] };
}

/** Validate bounded drawing/count metadata without performing another conversion. */
export function validateBackgroundPreview(value: BackgroundPreview): BackgroundPreview {
    const { width, height, pixels, totalBeads } = value;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
        width > EDITOR_PROJECT_PATTERN_DIMENSION_MAX || height > EDITOR_PROJECT_PATTERN_DIMENSION_MAX ||
        !(pixels instanceof Uint8ClampedArray) || pixels.length !== width * height * 4 ||
        !Number.isInteger(totalBeads) || totalBeads < 0 || totalBeads > width * height) throw new RangeError('Invalid background preview');
    return value;
}

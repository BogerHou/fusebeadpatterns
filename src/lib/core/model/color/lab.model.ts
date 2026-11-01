import { Color } from './color.model';

export class Lab {
    l: number;
    a: number;
    b: number;
}

const MAX_RGB_LAB_CACHE_SIZE = 16_384;
const rgbLabCache = new Map<number, Lab>();
const objectLabCache = new WeakMap<
    Color,
    { r: number; g: number; b: number; lab: Lab }
>();

function computeColorToLab(c: Color): Lab {
    let r = c.r / 255;
    let g = c.g / 255;
    let b = c.b / 255;

    let x = 0;
    let y = 0;
    let z = 0;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

    return { l: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

export function ColorToLab(c: Color): Lab {
    const r = c.r;
    const g = c.g;
    const b = c.b;
    if (
        (r | 0) === r &&
        (g | 0) === g &&
        (b | 0) === b &&
        ((r | g | b) & ~255) === 0
    ) {
        const key = (r << 16) | (g << 8) | b;
        const cached = rgbLabCache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const lab = computeColorToLab(c);
        if (rgbLabCache.size >= MAX_RGB_LAB_CACHE_SIZE) {
            rgbLabCache.clear();
        }
        rgbLabCache.set(key, lab);
        return lab;
    }

    const cached = objectLabCache.get(c);
    if (cached && cached.r === r && cached.g === g && cached.b === b) {
        return cached.lab;
    }
    const lab = computeColorToLab(c);
    objectLabCache.set(c, { r, g, b, lab });
    return lab;
}

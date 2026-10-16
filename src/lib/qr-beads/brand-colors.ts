import type { QrBrandId, QrColor, QrPalette, QrState } from './types';

function validColor(color: QrColor): boolean {
    return !!color && typeof color.name === 'string' && typeof color.ref === 'string' && !!color.ref
        && [color.r, color.g, color.b].every(value => Number.isInteger(value) && value >= 0 && value <= 255);
}
const sameRgb = (a: QrColor, b: QrColor) => a.r === b.r && a.g === b.g && a.b === b.b;
const distance = (a: QrColor, b: QrColor) => (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;

function match(color: QrColor, candidates: QrColor[]): QrColor {
    if (!candidates.length) throw new Error('INVALID_COLOR');
    return candidates.find(candidate => candidate.name.trim().toLowerCase() === color.name.trim().toLowerCase())
        ?? candidates.reduce((best, next) => distance(color, next) < distance(color, best) ? next : best);
}

/** Prefer named Black/White; missing names use RGB distance without merging the two colors. */
export function selectQrBrandColors(state: QrState, palettes: QrPalette[], nextId: QrBrandId): Pick<QrState, 'paletteId' | 'foregroundRef' | 'backgroundRef'> {
    if (!state || !Array.isArray(palettes)) throw new Error('INVALID_COLOR');
    const source = palettes.filter(palette => palette?.id === state.paletteId);
    const targets = palettes.filter(palette => palette?.id === nextId);
    if (source.length !== 1 || targets.length !== 1 || !Array.isArray(source[0].colors) || !Array.isArray(targets[0].colors)
        || !source[0].colors.every(validColor) || !targets[0].colors.every(validColor)) throw new Error('INVALID_COLOR');
    const oldForeground = source[0].colors.find(color => color.ref === state.foregroundRef);
    const oldBackground = source[0].colors.find(color => color.ref === state.backgroundRef);
    if (!oldForeground || !oldBackground || sameRgb(oldForeground, oldBackground)) throw new Error('INVALID_COLOR');
    // Staying on the same brand must retain the user's exact purchasing codes.
    if (nextId === state.paletteId) return { paletteId: nextId, foregroundRef: oldForeground.ref, backgroundRef: oldBackground.ref };
    const foreground = match(oldForeground, targets[0].colors);
    const background = match(oldBackground, targets[0].colors.filter(color => color.ref !== foreground.ref && !sameRgb(color, foreground)));
    return { paletteId: nextId, foregroundRef: foreground.ref, backgroundRef: background.ref };
}

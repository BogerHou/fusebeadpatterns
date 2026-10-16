import type { LetterBrandId, LetterColor, LetterPalette, LetterState } from './types';

const distance = (a: LetterColor, b: LetterColor) => (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
function match(color: LetterColor, candidates: LetterColor[]): LetterColor {
    if (!candidates.length) throw new Error('INVALID_COLOR');
    return candidates.find(c => c.name.trim().toLowerCase() === color.name.trim().toLowerCase())
        ?? candidates.reduce((best, next) => distance(color, next) < distance(color, best) ? next : best);
}

/** Keep named colors such as Black/White before approximating a missing name. */
export function selectLetterBrandColors(state: LetterState, palettes: LetterPalette[], paletteId: LetterBrandId): Pick<LetterState, 'paletteId' | 'foregroundRef' | 'backgroundRef'> {
    const source = palettes.find(p => p.id === state.paletteId), target = palettes.find(p => p.id === paletteId);
    const oldForeground = source?.colors.find(c => c.ref === state.foregroundRef), oldBackground = source?.colors.find(c => c.ref === state.backgroundRef);
    if (!target || !oldForeground || !oldBackground) throw new Error('INVALID_COLOR');
    const foreground = match(oldForeground, target.colors);
    // A two-color name must remain visible after a brand change, even when
    // both source shades are nearest to the same target color.
    const background = match(oldBackground, state.backgroundEnabled ? target.colors.filter(c => c.r !== foreground.r || c.g !== foreground.g || c.b !== foreground.b) : target.colors);
    return { paletteId, foregroundRef: foreground.ref, backgroundRef: background.ref };
}

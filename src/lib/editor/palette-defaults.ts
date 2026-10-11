import type { Palette } from '../core/model/palette/palette.model';
import { clonePalettes } from './palette-state';

// These IDs and names come from explicit effect descriptors in the bundled CSVs,
// not a manufacturer-verified classification of every physical bead material.
// Gold, Silver, Pearl and other ambiguous shade names deliberately remain unknown.
// Keep the expected name alongside each ref so a later CSV revision needs review.
const REVIEWED_EFFECT_NAMES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
    hama: {
        H13: 'Transparent Red', H14: 'Transparent Yellow',
        H15: 'Transparent Blue', H16: 'Transparent Green', H19: 'Clear',
        H24: 'Translucent Purple', H25: 'Translucent Brown',
        H72: 'Translucent Pink', H73: 'Translucent Aqua', H74: 'Translucent Lilac',
        H32: 'Neon Fuchsia', H34: 'Neon Yellow', H35: 'Neon Red',
        H36: 'Neon Blue', H37: 'Neon Green', H38: 'Neon Orange',
        H39: 'Fluorescent Yellow', H40: 'Fluorescent Orange',
        H41: 'Fluorescent Blue', H42: 'Fluorescent Green',
        H55: 'Green (Glow in the Dark)', H56: 'Red (Glow in the Dark)',
        H57: 'Blue (Glow in the Dark)',
    },
    artkal_s: {
        S63: 'Metallic Gold',
        SG1: 'Glow Yellow', SG2: 'Glow Pink', SG3: 'Glow Blue',
        SL1: 'Glitter Blue', SL2: 'Glitter Green',
        SL3: 'Glitter Red', SL4: 'Glitter Yellow',
        SN1: 'Neon Orange', SN2: 'Neon Green', SN3: 'Neon Yellow', SN4: 'Neon Rose',
        SP1: 'Pearlescent Green', SP2: 'Pearlescent Tangerine',
        SP3: 'Pearlescent Orange', SP4: 'Pearlescent Pink',
        SP5: 'Pearlescent Red', SP6: 'Pearlescent Blue',
        SP7: 'Pearlescent Purple', SP8: 'Pearlescent White',
        ST1: 'Transparent', ST2: 'Transparent Pink', ST3: 'Transparent Tangering',
        ST4: 'Transparent Yellow', ST5: 'Transparent Green', ST6: 'Transparent Purple',
    },
};

/** Seed a freshly loaded built-in palette; saved/user-enabled states win afterward. */
export function applyFreshPaletteDefaults(paletteId: string, palette: Palette): Palette {
    const next = clonePalettes([palette])[0];
    const reviewedNames = REVIEWED_EFFECT_NAMES[paletteId];
    if (!reviewedNames) return next;

    for (const entry of next.entries) {
        const expectedName = reviewedNames[entry.ref];
        if (expectedName && entry.name === expectedName) entry.enabled = false;
    }
    return next;
}

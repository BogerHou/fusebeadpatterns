import { describe, expect, it } from 'vitest';

import { parsePaletteCsv, PALETTE_OPTIONS } from './config';
import {
    clonePalettes,
    countEnabledEntries,
    disableUsageColor,
    enablePaletteEntry,
    getAutomaticEditorColorRef,
    mergePaletteEnabledState,
    removeLowUsageColors,
    togglePaletteEntry,
    togglePaletteGroup,
} from './palette-state';

function createPalettes() {
    const perler = parsePaletteCsv(
        'P-001,White,W,255,255,255\nP-002,Black,B,0,0,0',
        PALETTE_OPTIONS[0]
    );
    const hama = parsePaletteCsv(
        'H-001,Blue,U,0,0,255\nH-002,Red,R,255,0,0',
        PALETTE_OPTIONS[3]
    );

    return [perler, hama];
}

describe('palette state helpers', () => {
    it('preserves enabled flags when palettes are reloaded', () => {
        const previousPalettes = createPalettes();
        previousPalettes[0].entries[1].enabled = false;

        const merged = mergePaletteEnabledState(createPalettes(), previousPalettes);

        expect(merged[0].entries[1].enabled).toBe(false);
        expect(merged[1].entries[0].enabled).toBe(true);
    });

    it('prevents disabling every palette entry', () => {
        const [palette] = createPalettes();

        const oneDisabled = togglePaletteEntry([palette], palette.name, 'P-001', false);
        const allDisabled = togglePaletteEntry(oneDisabled, palette.name, 'P-002', false);

        expect(oneDisabled[0].entries[0].enabled).toBe(false);
        expect(allDisabled[0].entries[1].enabled).toBe(true);
    });

    it('enables individual entries without mutating the previous palette state', () => {
        const [palette] = createPalettes();
        palette.entries[1].enabled = false;

        const updated = enablePaletteEntry([palette], palette.name, 'P-002');

        expect(palette.entries[1].enabled).toBe(false);
        expect(updated[0].entries[1].enabled).toBe(true);
        expect(countEnabledEntries(updated)).toBe(2);
    });

    it('chooses an editor color from highest usage, then falls back to the first enabled entry', () => {
        const palettes = createPalettes();
        palettes[0].entries[1].enabled = false;

        expect(
            getAutomaticEditorColorRef(
                new Map([
                    ['P-002', 20],
                    ['H-001', 10],
                    ['P-001', 1],
                ]),
                palettes
            )
        ).toBe('H-001');

        expect(getAutomaticEditorColorRef(new Map(), palettes)).toBe('P-001');

        palettes.forEach((palette) => {
            palette.entries.forEach((entry) => {
                entry.enabled = false;
            });
        });

        expect(getAutomaticEditorColorRef(new Map(), palettes)).toBe(null);
    });

    it('supports group toggles, usage-based disabling and low-usage cleanup', () => {
        const palettes = createPalettes();
        const allOn = clonePalettes(palettes);
        const grouped = togglePaletteGroup(allOn, palettes[1].name, false);
        const usageDisabled = disableUsageColor(grouped, 'P-001');
        const cleaned = removeLowUsageColors(
            usageDisabled,
            new Map([
                ['P-002', 99],
                ['H-001', 1],
            ]),
            2
        );

        expect(grouped[1].entries.every((entry) => !entry.enabled)).toBe(true);
        expect(usageDisabled[0].entries[0].enabled).toBe(false);
        expect(cleaned[0].entries[1].enabled).toBe(true);
    });
});

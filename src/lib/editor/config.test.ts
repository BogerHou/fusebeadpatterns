import { describe, expect, it } from 'vitest';

import {
    DITHERING_OPTIONS,
    EXPORT_OPTIONS,
    MATCHING_OPTIONS,
    PALETTE_OPTIONS,
    getBoardOption,
    getPaletteOption,
    parsePaletteCsv,
} from './config';

describe('editor config', () => {
    it('exposes the expected presets', () => {
        expect(PALETTE_OPTIONS.length).toBeGreaterThan(10);
        expect(getPaletteOption('perler')?.label).toContain('Perler');
        expect(getBoardOption('mini_artkal')?.beadsPerRow).toBe(50);
        expect(MATCHING_OPTIONS.map((option) => option.id)).toContain(
            'delta_e_cie2000'
        );
        expect(DITHERING_OPTIONS.map((option) => option.id)).toContain(
            'atkinson'
        );
        expect(EXPORT_OPTIONS.map((option) => option.id)).toContain('xlsx');
    });

    it('parses palette csv rows into enabled entries with metadata', () => {
        const palette = parsePaletteCsv(
            'C-001,White,W,255,255,255\nC-002,Black,B,0,0,0',
            PALETTE_OPTIONS[0]
        );

        expect(palette.name).toBe(PALETTE_OPTIONS[0].label);
        expect(palette.entries).toHaveLength(2);
        expect(palette.entries[0].ref).toBe('C-001');
        expect(palette.entries[0].name).toBe('White');
        expect(palette.entries[0].symbol).toBe('W');
        expect(palette.entries[0].enabled).toBe(true);
        expect(palette.entries[0].prefix).toBe(PALETTE_OPTIONS[0].prefix);
    });
});

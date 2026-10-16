import { describe, expect, it } from 'vitest';
import { getLetterPalettes } from '../bead-letters/data';
import { defaultQrState } from './project';
import { selectQrBrandColors } from './brand-colors';
import type { QrColor, QrPalette } from './types';

const palettes = getLetterPalettes();
const color = (ref: string, value: number, name = ref): QrColor => ({ ref, name, prefix: 'P', symbol: ref, r: value, g: value, b: value });
const fixture = (id: QrPalette['id'], colors: QrColor[]): QrPalette => ({ id, label: id, boardSize: id === 'artkal_s' ? 50 : 29, colors });

describe('QR brand color selection', () => {
    it('preserves named Black/White across real Perler, Hama and Artkal palettes', () => {
        const state = defaultQrState(palettes);
        const hama = selectQrBrandColors(state, palettes, 'hama');
        expect(hama).toEqual({ paletteId: 'hama', foregroundRef: 'H18', backgroundRef: 'H01' });
        const artkal = selectQrBrandColors({ ...state, ...hama }, palettes, 'artkal_s');
        expect(artkal).toEqual({ paletteId: 'artkal_s', foregroundRef: 'S13', backgroundRef: 'S01' });
        expect(selectQrBrandColors({ ...state, ...artkal }, palettes, 'perler')).toEqual({ paletteId: 'perler', foregroundRef: '80-19018', backgroundRef: '80-19001' });
        expect(state).toEqual(defaultQrState(palettes));
    });
    it('gives an exact name priority over a nearer RGB while keeping the pair distinct', () => {
        const source = fixture('perler', [color('a', 20, ' Black '), color('b', 240, 'WHITE')]);
        const target = fixture('hama', [color('near', 19, 'Aubergine'), color('black', 35, 'Black'), color('white', 225, 'White')]);
        expect(selectQrBrandColors({ ...defaultQrState(palettes), foregroundRef: 'a', backgroundRef: 'b' }, [source, target], 'hama'))
            .toEqual({ paletteId: 'hama', foregroundRef: 'black', backgroundRef: 'white' });
    });
    it('uses nearest RGB for missing names and never collapses two shades into one color', () => {
        const source = fixture('perler', [color('a', 101), color('b', 102)]);
        const target = fixture('hama', [color('c', 100), color('d', 200)]);
        expect(selectQrBrandColors({ ...defaultQrState(palettes), foregroundRef: 'a', backgroundRef: 'b' }, [source, target], 'hama'))
            .toEqual({ paletteId: 'hama', foregroundRef: 'c', backgroundRef: 'd' });
    });
    it('excludes a second code with identical RGB when finding the background', () => {
        const source = fixture('perler', [color('a', 10), color('b', 11)]);
        const target = fixture('hama', [color('c', 10), color('copy', 10), color('d', 230)]);
        expect(selectQrBrandColors({ ...defaultQrState(palettes), foregroundRef: 'a', backgroundRef: 'b' }, [source, target], 'hama').backgroundRef).toBe('d');
    });
    it('keeps exact user-selected codes when the selected brand is unchanged', () => {
        const source = fixture('perler', [color('a', 10, 'ink'), color('b', 240, 'paper'), color('c', 12, 'ink')]);
        expect(selectQrBrandColors({ ...defaultQrState(palettes), foregroundRef: 'c', backgroundRef: 'b' }, [source], 'perler'))
            .toEqual({ paletteId: 'perler', foregroundRef: 'c', backgroundRef: 'b' });
    });
    it('rejects missing source/target colors, ambiguous registries and collapsed target palettes', () => {
        const state = defaultQrState(palettes);
        expect(() => selectQrBrandColors({ ...state, foregroundRef: 'missing' }, palettes, 'hama')).toThrow('INVALID_COLOR');
        expect(() => selectQrBrandColors(state, [], 'hama')).toThrow('INVALID_COLOR');
        expect(() => selectQrBrandColors(state, [...palettes, palettes[0]], 'hama')).toThrow('INVALID_COLOR');
        const source = fixture('perler', [color('a', 10), color('b', 240)]);
        const target = fixture('hama', [color('c', 10), color('d', 10)]);
        expect(() => selectQrBrandColors({ ...state, foregroundRef: 'a', backgroundRef: 'b' }, [source, target], 'hama')).toThrow('INVALID_COLOR');
    });
});

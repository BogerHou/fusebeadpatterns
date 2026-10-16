import { describe, expect, it } from 'vitest';
import { getLetterPalettes } from './data';
import { defaultLetterState } from './project';
import { selectLetterBrandColors } from './brand-colors';
import type { LetterColor, LetterPalette } from './types';

const palettes = getLetterPalettes();
describe('named letter colors when changing brands', () => {
    it('keeps Black and White instead of making Perler Black into Hama Aubergine', () => {
        const state = defaultLetterState(palettes);
        const hama = selectLetterBrandColors(state, palettes, 'hama');
        expect(hama).toEqual({ paletteId: 'hama', foregroundRef: 'H18', backgroundRef: 'H01' });
        const artkal = selectLetterBrandColors({ ...state, ...hama }, palettes, 'artkal_s');
        expect(artkal).toEqual({ paletteId: 'artkal_s', foregroundRef: 'S13', backgroundRef: 'S01' });
        expect(selectLetterBrandColors({ ...state, ...artkal }, palettes, 'perler')).toEqual({ paletteId: 'perler', foregroundRef: '80-19018', backgroundRef: '80-19001' });
        expect(state).toEqual(defaultLetterState(palettes));
    });
    it('does not collapse two nearby colors into one and hide the letters', () => {
        const color = (ref: string, value: number): LetterColor => ({ ref, name: ref, prefix: 'P', symbol: ref, r: value, g: value, b: value });
        const source: LetterPalette = { id: 'perler', label: 'Perler Midi', boardSize: 29, colors: [color('a', 101), color('b', 102)] };
        const target: LetterPalette = { id: 'hama', label: 'Hama Midi', boardSize: 29, colors: [color('c', 100), color('d', 200)] };
        expect(selectLetterBrandColors({ ...defaultLetterState(palettes), foregroundRef: 'a', backgroundRef: 'b' }, [source, target], 'hama'))
            .toEqual({ paletteId: 'hama', foregroundRef: 'c', backgroundRef: 'd' });
    });
});

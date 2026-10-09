import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getBoardOption, getPaletteOption, parsePaletteCsv } from './config';
import { getInitialEditorConfiguration } from './initial-configuration';

describe('fresh editor entry configuration', () => {
    it('keeps the ordinary home and editor default on the Perler Midi board', () => {
        const configuration = getInitialEditorConfiguration();
        expect(configuration).toEqual({ paletteId: 'perler', boardId: 'midi' });
        expect(getBoardOption(configuration.boardId)?.beadsPerRow).toBe(29);
    });

    it('resolves the Hama entry to its actual 92-color Midi CSV and board', () => {
        const configuration = getInitialEditorConfiguration('hama');
        const option = getPaletteOption(configuration.paletteId)!;
        const palette = parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option);
        expect(configuration).toEqual({ paletteId: 'hama', boardId: 'midi' });
        expect(getBoardOption(configuration.boardId)?.beadsPerRow).toBe(29);
        expect(palette.name).toBe('Hama Midi');
        expect(palette.entries).toHaveLength(92);
        expect(palette.entries[0]).toMatchObject({ name: 'White', ref: 'H01', prefix: 'H', enabled: true });
        expect(palette.entries.every(entry => entry.prefix === 'H')).toBe(true);
    });

    it('derives the board from the configured palette rather than assuming every entry uses Midi', () => {
        const configuration = getInitialEditorConfiguration('perler_mini');
        expect(configuration).toEqual({ paletteId: 'perler_mini', boardId: 'mini' });
        expect(getBoardOption(configuration.boardId)?.beadsPerRow).toBe(57);
    });

    it.each(['', 'unknown', 'Hama', '/palettes/hama.csv', 'https://example.com/hama.csv'])(
        'falls back to the established Perler default for unknown entry %s', initialPaletteId => {
            expect(getInitialEditorConfiguration(initialPaletteId)).toEqual({ paletteId: 'perler', boardId: 'midi' });
        },
    );
});

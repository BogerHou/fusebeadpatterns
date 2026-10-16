import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getBoardOption, getPaletteDisplayLabel, getPaletteOption, parsePaletteCsv } from '../editor/config';
import type { LetterBrandId, LetterPalette } from './types';

/** Build-time catalog snapshot. Only plain color records cross the client boundary. */
export function getLetterPalettes(): LetterPalette[] {
    return (['perler', 'hama', 'artkal_s'] as LetterBrandId[]).map(id => {
        const option = getPaletteOption(id)!;
        const palette = parsePaletteCsv(readFileSync(join(process.cwd(), 'public/palettes', option.file), 'utf8'), option);
        return {
            id, label: getPaletteDisplayLabel(option), boardSize: getBoardOption(option.boardId)!.beadsPerRow,
            colors: palette.entries.filter(entry => entry.color.a === 255).map(entry => ({
                name: entry.name, ref: entry.ref, symbol: entry.symbol, prefix: entry.prefix,
                r: entry.color.r, g: entry.color.g, b: entry.color.b,
            })),
        };
    });
}

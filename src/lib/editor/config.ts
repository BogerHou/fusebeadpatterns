import { BOARDS } from '../core/model/board/board.model';
import { Color } from '../core/model/color/color.model';
import { MATCHINGS } from '../core/model/matching/matching.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';

export type PaletteOption = {
    id: string;
    label: string;
    file: string;
    prefix: string;
    boardId: BoardOptionId;
};

export type BoardOptionId = 'midi' | 'mini' | 'mini_artkal';

export type BoardOption = {
    id: BoardOptionId;
    label: string;
    beadsPerRow: number;
    value: (typeof BOARDS)[keyof typeof BOARDS];
};

export type MatchingOption = {
    id: string;
    label: string;
    value: (typeof MATCHINGS)[keyof typeof MATCHINGS];
};

export type DitheringOption = {
    id: string;
    label: string;
    hardness: number;
};

export type ExportOption = {
    id: string;
    label: string;
};

export const PALETTE_OPTIONS: PaletteOption[] = [
    {
        id: 'perler',
        label: 'Perler Midi',
        file: 'perler.csv',
        prefix: 'P',
        boardId: 'midi',
    },
    {
        id: 'perler_mini',
        label: 'Perler Mini',
        file: 'perler_mini.csv',
        prefix: 'PM',
        boardId: 'mini',
    },
    {
        id: 'perler_caps',
        label: 'Perler Caps',
        file: 'perler_caps.csv',
        prefix: 'PC',
        boardId: 'midi',
    },
    {
        id: 'hama',
        label: 'Hama Midi',
        file: 'hama.csv',
        prefix: 'H',
        boardId: 'midi',
    },
    {
        id: 'hama_mini',
        label: 'Hama Mini',
        file: 'hama_mini.csv',
        prefix: 'HM',
        boardId: 'mini',
    },
    {
        id: 'hama_maxi',
        label: 'Hama Maxi',
        file: 'hama_maxi.csv',
        prefix: 'HX',
        boardId: 'midi',
    },
    {
        id: 'artkal_a',
        label: 'Artkal A',
        file: 'artkal_a.csv',
        prefix: 'AA',
        boardId: 'midi',
    },
    {
        id: 'artkal_c',
        label: 'Artkal C',
        file: 'artkal_c.csv',
        prefix: 'AC',
        boardId: 'midi',
    },
    {
        id: 'artkal_m',
        label: 'Artkal M',
        file: 'artkal_m.csv',
        prefix: 'AM',
        boardId: 'midi',
    },
    {
        id: 'artkal_r',
        label: 'Artkal R',
        file: 'artkal_r.csv',
        prefix: 'AR',
        boardId: 'midi',
    },
    {
        id: 'artkal_s',
        label: 'Artkal S Mini',
        file: 'artkal_s.csv',
        prefix: 'AS',
        boardId: 'mini_artkal',
    },
    {
        id: 'nabbi',
        label: 'Nabbi Midi',
        file: 'nabbi.csv',
        prefix: 'N',
        boardId: 'midi',
    },
    {
        id: 'mard',
        label: 'Mard Midi',
        file: 'mard.csv',
        prefix: 'M',
        boardId: 'midi',
    },
    {
        id: 'diamonddotz',
        label: 'Diamond Dotz',
        file: 'diamondDotz.csv',
        prefix: 'D',
        boardId: 'midi',
    },
    {
        id: 'yant',
        label: 'Yant Midi',
        file: 'yant.csv',
        prefix: 'Y',
        boardId: 'midi',
    },
];

export const BOARD_OPTIONS: BoardOption[] = [
    {
        id: 'midi',
        label: 'Midi 29 x 29',
        beadsPerRow: BOARDS.MIDI.nbBeadPerRow,
        value: BOARDS.MIDI,
    },
    {
        id: 'mini',
        label: 'Mini 57 x 57',
        beadsPerRow: BOARDS.MINI.nbBeadPerRow,
        value: BOARDS.MINI,
    },
    {
        id: 'mini_artkal',
        label: 'Artkal Mini 50 x 50',
        beadsPerRow: BOARDS.MINI_ARTKAL.nbBeadPerRow,
        value: BOARDS.MINI_ARTKAL,
    },
];

export const MATCHING_OPTIONS: MatchingOption[] = [
    {
        id: 'euclidean',
        label: 'Euclidean',
        value: MATCHINGS.EUCLIDEAN,
    },
    {
        id: 'delta_e_cie94',
        label: 'DeltaE CIE94',
        value: MATCHINGS.DELTA_E_CIE94,
    },
    {
        id: 'delta_e_cie2000',
        label: 'DeltaE CIE2000',
        value: MATCHINGS.DELTA_E_CIE2000,
    },
];

export const DITHERING_OPTIONS: DitheringOption[] = [
    {
        id: 'none',
        label: 'None',
        hardness: 0,
    },
    {
        id: 'floyd-steinberg',
        label: 'Floyd-Steinberg',
        hardness: 100,
    },
    {
        id: 'atkinson',
        label: 'Atkinson',
        hardness: 70,
    },
];

export const EXPORT_OPTIONS: ExportOption[] = [
    { id: 'pdf', label: 'PDF' },
    { id: 'svg', label: 'SVG' },
    { id: 'png', label: 'Printable PNG' },
    { id: 'jpg', label: 'Printable JPG' },
    { id: 'xlsx', label: 'XLSX' },
    { id: 'grid_png', label: 'Grid PNG' },
];

export function getPaletteOption(id: string): PaletteOption | undefined {
    return PALETTE_OPTIONS.find((option) => option.id === id);
}

export function getBoardOption(id: BoardOptionId): BoardOption | undefined {
    return BOARD_OPTIONS.find((option) => option.id === id);
}

export function getMatchingOption(id: string): MatchingOption | undefined {
    return MATCHING_OPTIONS.find((option) => option.id === id);
}

export function getDitheringOption(id: string): DitheringOption | undefined {
    return DITHERING_OPTIONS.find((option) => option.id === id);
}

export function parsePaletteCsv(
    csv: string,
    paletteOption: PaletteOption
): Palette {
    const entries = csv
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => {
            const [ref, name, symbol, r, g, b] = line.split(',');
            const entry = new PaletteEntry(
                name,
                new Color(
                    Number.parseInt(r, 10) || 0,
                    Number.parseInt(g, 10) || 0,
                    Number.parseInt(b, 10) || 0,
                    255
                )
            );
            entry.ref = ref;
            entry.symbol = symbol;
            entry.prefix = paletteOption.prefix;
            entry.enabled = true;
            return entry;
        });

    return new Palette(paletteOption.label, entries);
}

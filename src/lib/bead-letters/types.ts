export type LetterBrandId = 'perler' | 'hama' | 'artkal_s';
export type LetterColor = {
    name: string; ref: string; symbol: string; prefix: string;
    r: number; g: number; b: number;
};
export type LetterPalette = {
    id: LetterBrandId; label: string; boardSize: number; colors: LetterColor[];
};
export type LetterState = {
    text: string; letterSpacing: number; lineSpacing: number; padding: number;
    align: 'left' | 'center' | 'right';
    paletteId: LetterBrandId; foregroundRef: string; backgroundRef: string;
    backgroundEnabled: boolean; paper: 'a4' | 'letter';
};

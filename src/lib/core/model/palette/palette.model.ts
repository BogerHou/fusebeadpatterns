import { Color } from './../color/color.model';

export class Palette {
    name: string;
    entries: PaletteEntry[];

    constructor(name: string, entries: PaletteEntry[]) {
        this.name = name;
        this.entries = entries;
    }
}

export class PaletteEntry {
    name: string;
    ref: string;
    symbol: string;
    color: Color;
    prefix: string;
    enabled = true;

    constructor(name: string, color: Color) {
        this.name = name;
        this.color = color;
    }
}

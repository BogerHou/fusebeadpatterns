import type { ColorChartColor } from './data';

function normalize(value: string): string {
    return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Literal matching only. The source palette order and entries are never changed. */
export function filterColorChartColors(colors: readonly ColorChartColor[], query: string): readonly ColorChartColor[] {
    const terms = normalize(query).split(' ').filter(Boolean);
    if (terms.length === 0) return colors;
    return colors.filter(color => {
        const fields = [normalize(color.ref), normalize(color.name), normalize(color.hex)];
        return terms.every(term => fields.some(field => field.includes(term)));
    });
}

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePerlerColorChartCsv, type ColorChartColor } from './data';
import { filterColorChartColors } from './search';
import { colorChartCopy, formatColorChartResults } from './copy';
import { SITE_LOCALES } from '../i18n/locales';

const source = readFileSync(join(process.cwd(), 'public/palettes/perler.csv'), 'utf8');
const colors = parsePerlerColorChartCsv(source);

describe('color chart literal search', () => {
    it('shows the full source in source order without rewriting entries for an empty search or reset', () => {
        for (const query of ['', '  \t\n', '\u3000']) expect(filterColorChartColors(colors, query)).toBe(colors);
        const before = JSON.stringify(colors);
        expect(filterColorChartColors(colors, 'wHiTe').some(color => color.ref === '80-19001')).toBe(true);
        expect(filterColorChartColors(colors, '')).toBe(colors);
        expect(JSON.stringify(colors)).toBe(before);
    });

    it('finds the actual source White by reference, English name and derived HEX with or without #', () => {
        const white = colors.find(color => color.ref === '80-19001')!;
        expect(white.rgb).toEqual({ r: 234, g: 239, b: 238 });
        expect(white.hex).toBe('#EAEFEE');
        for (const query of ['80-19001', '  80-19001  ', '#eaefee', 'eAeFeE', '＃ＥＡＥＦＥＥ']) {
            expect(filterColorChartColors(colors, query)).toEqual([white]);
        }
        expect(filterColorChartColors(colors, 'WHITE')).toContain(white);
    });

    it('matches multiple literal terms and keeps the matching colors in original order', () => {
        const expected = colors.filter(color => color.name.toLowerCase().includes('light') && color.name.toLowerCase().includes('blue'));
        expect(expected.length).toBeGreaterThan(0);
        expect(filterColorChartColors(colors, '  LIGHT\t blue ')).toEqual(expected);
        for (const color of expected) expect(color.name).toMatch(/light.*blue/i);
        expect(filterColorChartColors(colors, '80-19001 White #eaefee')).toEqual(colors.filter(color => color.ref === '80-19001'));
    });

    it('never treats a query as a regular expression or searches hidden contributor/RGB metadata', () => {
        const sample: ColorChartColor[] = [
            { ref: 'test-1', name: 'A.*B', hex: '#010203', rgb: { r: 1, g: 2, b: 3 }, contributor: 'only-contributor' },
            { ref: 'test-2', name: 'Another', hex: '#040506', rgb: { r: 4, g: 5, b: 6 }, contributor: 'other' },
        ];
        expect(filterColorChartColors(sample, '.*')).toEqual([sample[0]]);
        expect(filterColorChartColors(sample, '[a-z]+')).toEqual([]);
        expect(filterColorChartColors(sample, 'only-contributor')).toEqual([]);
        expect(filterColorChartColors(sample, '1, 2, 3')).toEqual([]);
        expect(filterColorChartColors(colors, '<script>')).toEqual([]);
    });
});

describe('color chart localized results and page descriptions', () => {
    it.each(SITE_LOCALES)('formats empty/full results and stays within 160 description characters in %s', locale => {
        const copy = colorChartCopy[locale];
        expect([...copy.description].length).toBeLessThanOrEqual(160);
        expect(copy.description.trim()).toBe(copy.description);
        expect(formatColorChartResults(locale, 0, 103)).not.toMatch(/\{(?:count|total)\}/);
        expect(formatColorChartResults(locale, 103, 103)).toContain('103');
        expect(copy.about).toContain('Perler Midi');
        expect(copy.namesNote.length).toBeGreaterThan(0);
        expect(copy.disclaimer.length).toBeGreaterThan(0);
    });
});

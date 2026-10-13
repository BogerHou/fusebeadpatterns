import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getPerlerColorChart, parsePerlerColorChartCsv, PERLER_COLOR_CHART_SOURCE } from './data';

const row = '80-15179,Evergreen,!,48,85,69,154.05,0.28,0.26,33.04,-17.49,5.21,Perlervault';
const secondRow = "80-15202,Robin's Egg,),169,205,213,190.91,0.34,0.75,80.12,-10.15,-7.93,Perlervault";
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

function replaceField(index: number, value: string): string {
    const fields = row.split(',');
    fields[index] = value;
    return fields.join(',');
}

describe('Perler color chart data', () => {
    it('keeps the existing 103-color source bytes and selected recorded values', () => {
        const bytes = readFileSync('public/palettes/perler.csv');
        expect(sha256(bytes)).toBe('6257da5908b11ac1cb67328a122e8bb8b439780528554cfc4a60e5ac2468b0a4');
        const data = getPerlerColorChart();
        expect(data.paletteId).toBe('perler');
        expect(data.paletteName).toBe('Perler Midi');
        expect(data.colors).toHaveLength(103);
        expect(new Set(data.colors.map(color => color.ref)).size).toBe(103);
        expect(data.colors[0]).toEqual({ ref: '80-15179', name: 'Evergreen', rgb: { r: 48, g: 85, b: 69 }, hex: '#305545', contributor: 'Perlervault' });
        expect(data.colors[102]).toEqual({ ref: '80-15272', name: 'Coral', rgb: { r: 255, g: 154, b: 139 }, hex: '#FF9A8B', contributor: 'SteelSkyStudios' });
        expect(data.colors.find(color => color.ref === '80-19001')).toEqual({ ref: '80-19001', name: 'White', rgb: { r: 234, g: 239, b: 238 }, hex: '#EAEFEE', contributor: 'Perlervault' });
        expect(data.colors.find(color => color.ref === '80-19018')).toEqual({ ref: '80-19018', name: 'Black', rgb: { r: 50, g: 50, b: 52 }, hex: '#323234', contributor: 'Perlervault' });
        expect(data.colors.every(color => Object.keys(color).sort().join(',') === 'contributor,hex,name,ref,rgb')).toBe(true);
        expect(data.source).toEqual({ ...PERLER_COLOR_CHART_SOURCE, csvSha256: sha256(bytes) });
    });

    it('retains every source contributor without presenting symbols as color codes', () => {
        const { colors, contributors } = getPerlerColorChart();
        const counts: Record<string, number> = {};
        colors.forEach(color => { counts[color.contributor] = (counts[color.contributor] ?? 0) + 1; });
        expect(counts).toEqual({ Perlervault: 67, BIORIO: 11, Exodeca1: 15, 'toptierbeads.com': 3, rYonder: 1, LizzyJanee: 5, SteelSkyStudios: 1 });
        expect(contributors).toEqual(['Perlervault', 'BIORIO', 'Exodeca1', 'toptierbeads.com', 'rYonder', 'LizzyJanee', 'SteelSkyStudios']);
        expect(colors.some(color => 'symbol' in color)).toBe(false);
    });

    it('provides independent serializable build results and current-byte provenance', () => {
        const original = getPerlerColorChart();
        expect(JSON.parse(JSON.stringify(original))).toEqual(original);
        original.colors[0].rgb.r = 0;
        original.contributors.push('unrelated');
        original.source.commit = 'changed';
        const next = getPerlerColorChart();
        expect(next.colors[0].rgb.r).toBe(48);
        expect(next.contributors).not.toContain('unrelated');
        expect(next.source.commit).toBe('f97ff4283d03cef5cd7e1071a86f5892e0c0c61b');
        expect(next.source.sourceUrl).toBe('https://github.com/maxcleme/beadcolors/blob/f97ff4283d03cef5cd7e1071a86f5892e0c0c61b/gen/v3/perler.csv');
    });

    it('ships the exact MIT file from the pinned upstream revision', () => {
        const bytes = readFileSync(`public${PERLER_COLOR_CHART_SOURCE.licensePath}`);
        expect(bytes.length).toBe(1065);
        const gitBlob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
        expect(gitBlob).toBe('2a45e0c28f61bd1237b9152aee0a4e7f7214d5d0');
        expect(bytes.toString('utf8')).toContain('Copyright (c) 2020 maxcleme');
        expect(PERLER_COLOR_CHART_SOURCE.license).toBe('MIT');
        expect(PERLER_COLOR_CHART_SOURCE.licenseUrl).toBe('https://github.com/maxcleme/beadcolors/blob/f97ff4283d03cef5cd7e1071a86f5892e0c0c61b/LICENSE');
    });
});

describe('parsePerlerColorChartCsv', () => {
    it('preserves source order, punctuation and identity across supported line endings', () => {
        const parsed = parsePerlerColorChartCsv(`\uFEFF${row}\r\n\r\n${secondRow}\r\n`);
        expect(parsed.map(color => [color.ref, color.name, color.hex])).toEqual([
            ['80-15179', 'Evergreen', '#305545'], ['80-15202', "Robin's Egg", '#A9CDD5'],
        ]);
        expect(parsed).toEqual(parsePerlerColorChartCsv(`${row}\n${secondRow}`));
    });

    it('supports valid updated records without pinning runtime count or checksum', () => {
        const csv = 'NEW-001,Example,!,0,9,255,0,0,0,0,0,0,New contributor';
        expect(parsePerlerColorChartCsv(csv)).toEqual([
            { ref: 'NEW-001', name: 'Example', rgb: { r: 0, g: 9, b: 255 }, hex: '#0009FF', contributor: 'New contributor' },
        ]);
    });

    it.each(['', '\r\n  \n', null, undefined, 1])('rejects missing color data %j', csv => {
        expect(() => parsePerlerColorChartCsv(csv as string)).toThrow('Invalid Perler color chart CSV');
    });

    it.each(['', '-1', '256', '1.5', 'NaN', 'Infinity', '1e2', '0x10', '+1', '1x'])('rejects invalid RGB %j in each channel', value => {
        for (const channel of [3, 4, 5]) expect(() => parsePerlerColorChartCsv(replaceField(channel, value))).toThrow('RGB');
    });

    it.each([0, 1, 12])('requires the identifying field at column %i', index => {
        expect(() => parsePerlerColorChartCsv(replaceField(index, '  '))).toThrow('invalid');
        expect(() => parsePerlerColorChartCsv(replaceField(index, 'A\0B'))).toThrow('invalid');
    });

    it('rejects duplicate references atomically and reports the source line', () => {
        expect(() => parsePerlerColorChartCsv(`${row}\n\n${replaceField(1, 'Another color')}`)).toThrow('line 3: duplicate reference 80-15179');
    });

    it('rejects a partial row, extra fields, a header or unsupported quoted fields', () => {
        for (const csv of [row.split(',').slice(0, 12).join(','), `${row},extra`, replaceField(1, '"Evergreen"'), 'ref,name,symbol,r,g,b,h,s,l,L,a,b,contributor']) {
            expect(() => parsePerlerColorChartCsv(csv)).toThrow('Invalid Perler color chart CSV');
        }
    });

    it('bounds accidental input size and row expansion without partial results', () => {
        expect(() => parsePerlerColorChartCsv('x'.repeat(1024 * 1024 + 1))).toThrow('at most 1 MiB');
        const oversized = Array.from({ length: 4097 }, (_, i) => replaceField(0, `C${i}`)).join('\n');
        expect(() => parsePerlerColorChartCsv(oversized)).toThrow('at most 4096 colors');
    });
});

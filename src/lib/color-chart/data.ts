import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type ColorChartColor = {
    ref: string;
    name: string;
    rgb: { r: number; g: number; b: number };
    hex: string;
    contributor: string;
};

const repository = 'https://github.com/maxcleme/beadcolors';
const commit = 'f97ff4283d03cef5cd7e1071a86f5892e0c0c61b';
const csvPath = 'gen/v3/perler.csv';

// This upstream revision was checked against the complete local CSV bytes.
// Keep provenance and the preservation test current when intentionally updating it.
export const PERLER_COLOR_CHART_SOURCE = {
    repository,
    commit,
    csvPath,
    localCsvPath: '/palettes/perler.csv',
    sourceUrl: `${repository}/blob/${commit}/${csvPath}`,
    license: 'MIT' as const,
    licensePath: '/licenses/beadcolors-MIT.txt',
    licenseUrl: `${repository}/blob/${commit}/LICENSE`,
};

export type PerlerColorChart = {
    paletteId: 'perler';
    paletteName: 'Perler Midi';
    colors: ColorChartColor[];
    contributors: string[];
    source: typeof PERLER_COLOR_CHART_SOURCE & { csvSha256: string };
};

const MAX_CSV_BYTES = 1024 * 1024;
const MAX_COLORS = 4096;

function invalidRow(line: number, reason: string): Error {
    return new Error(`Invalid Perler color chart CSV at line ${line}: ${reason}.`);
}

function textField(value: string, line: number, name: string): string {
    const result = value.trim();
    if (!result || /[\u0000-\u001f\u007f]/.test(result)) throw invalidRow(line, `invalid ${name}`);
    return result;
}

function channel(value: string, line: number): number {
    const normalized = value.trim();
    if (!/^\d{1,3}$/.test(normalized) || Number(normalized) > 255) throw invalidRow(line, 'RGB must contain integers from 0 to 255');
    return Number(normalized);
}

/** Parse the upstream v3 format: 13 unquoted fields, without a header.
 * The upstream pattern symbol is deliberately not a public color identifier.
 * HSL/Lab fields are not used to change the recorded RGB values.
 */
export function parsePerlerColorChartCsv(csv: string): ColorChartColor[] {
    if (typeof csv !== 'string' || Buffer.byteLength(csv, 'utf8') > MAX_CSV_BYTES) {
        throw new Error('Invalid Perler color chart CSV: expected text of at most 1 MiB.');
    }
    const colors: ColorChartColor[] = [];
    const refs = new Set<string>();
    const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (!line.trim()) continue;
        if (colors.length >= MAX_COLORS) throw invalidRow(index + 1, `at most ${MAX_COLORS} colors are supported`);
        const fields = line.split(',');
        if (fields.length !== 13 || line.includes('"')) throw invalidRow(index + 1, 'expected 13 unquoted v3 fields');
        const ref = textField(fields[0], index + 1, 'reference');
        if (refs.has(ref)) throw invalidRow(index + 1, `duplicate reference ${ref}`);
        const name = textField(fields[1], index + 1, 'name');
        const contributor = textField(fields[12], index + 1, 'contributor');
        const rgb = {
            r: channel(fields[3], index + 1),
            g: channel(fields[4], index + 1),
            b: channel(fields[5], index + 1),
        };
        const hex = `#${[rgb.r, rgb.g, rgb.b].map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
        colors.push({ ref, name, rgb, hex, contributor });
        refs.add(ref);
    }
    if (!colors.length) throw new Error('Invalid Perler color chart CSV: no colors.');
    return colors;
}

/** Build/server only. Client components should import ColorChartColor as a type. */
export function getPerlerColorChart(): PerlerColorChart {
    const bytes = readFileSync(join(process.cwd(), 'public/palettes/perler.csv'));
    const colors = parsePerlerColorChartCsv(bytes.toString('utf8'));
    return {
        paletteId: 'perler',
        paletteName: 'Perler Midi',
        colors,
        contributors: [...new Set(colors.map(color => color.contributor))],
        source: { ...PERLER_COLOR_CHART_SOURCE, csvSha256: createHash('sha256').update(bytes).digest('hex') },
    };
}

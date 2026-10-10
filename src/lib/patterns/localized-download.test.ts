import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { decodeEditorPatternDraft, parseEditorProject } from '../editor/draft';
import { patterns } from './catalog';
import german from './german.json';
import french from './french-patterns.json';
import japanese from './japanese.json';
import { getLocalizedPatternPdf, getLocalizedPatternLetterPdf, getLocalizedPatternGrid } from './localized-download';
import gridAssets from './localized-grid-assets.json';
import { getLocalizedSubjectName } from './localized-content';
import legacyHashes from './localized-download-legacy-hashes.json';

const locales = ['de', 'fr', 'ja'] as const;
const publicFile = (url: string) => path.join(process.cwd(), 'public', url.replace(/^\//, ''));
const retained = {
    de: new Map(german.patterns.map(pattern => [pattern.id, pattern.name])),
    fr: new Map(french.patterns.map(pattern => [pattern.id, pattern.name])),
    ja: new Map(japanese.groups.flatMap(group => group.patterns.map(pattern => [pattern.id, pattern.name]))),
};

// The reviewed downloads use PDF literal strings, optional UTF-16 metadata,
// and ReportLab ASCII85/Flate content streams. Inspect real files without adding
// a production PDF dependency or relying on a private acceptance-report fixture.
function literal(bytes: string, start: number): { value: Buffer; end: number } {
    const output: number[] = [];
    let depth = 1;
    for (let i = start + 1; i < bytes.length; i++) {
        const char = bytes[i];
        if (char === '\\') {
            const next = bytes[++i];
            if (/[0-7]/.test(next)) {
                let digits = next;
                while (digits.length < 3 && /[0-7]/.test(bytes[i + 1] ?? '')) digits += bytes[++i];
                output.push(parseInt(digits, 8));
            } else if (next === '\n' || next === '\r') {
                if (next === '\r' && bytes[i + 1] === '\n') i++;
            } else {
                output.push(({ n: 10, r: 13, t: 9, b: 8, f: 12 } as Record<string, number>)[next] ?? next.charCodeAt(0));
            }
        } else if (char === '(') {
            depth++;
            output.push(40);
        } else if (char === ')') {
            if (--depth === 0) return { value: Buffer.from(output), end: i + 1 };
            output.push(41);
        } else output.push(char.charCodeAt(0));
    }
    throw new Error('Unterminated PDF literal string');
}

function metadataText(value: Buffer): string {
    if (value[0] === 0xfe && value[1] === 0xff) return Buffer.from(value.subarray(2)).swap16().toString('utf16le');
    // PDFDocEncoding's special positions; the remaining name characters are Latin-1.
    const special = [0x2022, 0x2020, 0x2021, 0x2026, 0x2014, 0x2013, 0x192, 0x2044,
        0x2039, 0x203a, 0x2212, 0x2030, 0x201e, 0x201c, 0x201d, 0x2018,
        0x2019, 0x201a, 0x2122, 0xfb01, 0xfb02, 0x141, 0x152, 0x160,
        0x178, 0x17d, 0x131, 0x142, 0x153, 0x161, 0x17e, 0, 0x20ac];
    return [...value].map(byte => String.fromCodePoint(byte >= 128 && byte <= 160 ? special[byte - 128] : byte)).join('');
}

function ascii85(value: Buffer): Buffer {
    const data = value.toString('ascii').replace(/\s+/g, '').replace(/~>$/, '');
    const output: number[] = [];
    let tuple: number[] = [];
    const append = (digits: number[], count: number) => {
        let total = 0;
        for (const digit of digits) total = total * 85 + digit;
        const bytes = Buffer.alloc(4);
        bytes.writeUInt32BE(total >>> 0);
        output.push(...bytes.subarray(0, count));
    };
    for (const char of data) {
        if (char === 'z') {
            if (tuple.length) throw new Error('Invalid ASCII85 zero tuple');
            output.push(0, 0, 0, 0);
            continue;
        }
        tuple.push(char.charCodeAt(0) - 33);
        if (tuple.length === 5) { append(tuple, 4); tuple = []; }
    }
    if (tuple.length) append([...tuple, ...Array(5 - tuple.length).fill(84)], tuple.length - 1);
    return Buffer.from(output);
}

function printedText(pdf: Buffer): string[] {
    const raw = pdf.toString('latin1');
    const output: string[] = [];
    for (const match of raw.matchAll(/<<([\s\S]*?)>>\s*stream\r?\n/g)) {
        const length = Number(match[1].match(/\/Length\s+(\d+)/)?.[1]);
        if (!length) continue;
        const start = match.index! + match[0].length;
        let bytes = pdf.subarray(start, start + length);
        if (match[1].includes('/ASCII85Decode')) bytes = ascii85(bytes);
        if (match[1].includes('/FlateDecode')) bytes = inflateSync(bytes);
        const stream = bytes.toString('latin1');
        if (!stream.includes('BT')) continue;
        for (let i = 0; i < stream.length; i++) {
            if (stream[i] !== '(') continue;
            const string = literal(stream, i);
            if (/^\s*Tj\b/.test(stream.slice(string.end))) output.push(string.value.toString('latin1'));
            i = string.end - 1;
        }
    }
    return output;
}

const comparable = (value: string) => value.replace(/[’‘]/g, "'").replace(/[–—]/g, '-');

describe('complete native-language library downloads', () => {
    it.each(locales)('has a real %s chart for every catalog ID with its actual PNG dimensions', async locale => {
        expect(Object.keys(gridAssets[locale]).sort()).toEqual(patterns.map(pattern => pattern.id).sort());
        for (const pattern of patterns) {
            const grid = getLocalizedPatternGrid(pattern, locale);
            expect(grid.href).toBe(`/patterns-${locale}/${pattern.id}/grid.png`);
            expect(grid.language).toBe(locale);
            expect(grid.href).not.toBe(pattern.assets.grid);
            const image = await sharp(publicFile(grid.href)).metadata();
            expect(image.format).toBe('png');
            expect({ width: grid.width, height: grid.height }).toEqual({ width: image.width, height: image.height });
            expect(grid.width).toBeGreaterThan(0);
            expect(grid.height).toBeGreaterThan(0);
        }
    });

    it.each(locales)('%s resolves every actual pattern to a real correctly named and tagged PDF', locale => {
        const destinations = new Set<string>();
        for (const pattern of patterns) {
            const download = getLocalizedPatternPdf(pattern, locale);
            expect(download.language).toBe(locale);
            const pdf = readFileSync(publicFile(download.href));
            expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
            const raw = pdf.toString('latin1');
            const titleStart = raw.indexOf('/Title (') + '/Title '.length;
            expect(titleStart).toBeGreaterThan('/Title '.length);
            const title = metadataText(literal(raw, titleStart).value);
            const expectedName = retained[locale].get(pattern.id) ?? getLocalizedSubjectName(pattern, locale);
            expect(comparable(title)).toContain(comparable(expectedName));
            expect(raw).toContain(`/Lang (${locale}-${{ de: 'DE', fr: 'FR', ja: 'JP' }[locale]})`);
            destinations.add(download.href);

            const text = printedText(pdf);
            for (const color of pattern.palette) {
                // Old Japanese files use native color reading aids. New PDFs use
                // original manufacturer product names beside the exact color code.
                expect(text.some(value => value.includes(color.ref))).toBe(true);
                if (!retained[locale].has(pattern.id)) {
                    const row = text.findIndex(value => value === color.ref);
                    expect(row).toBeGreaterThan(-1);
                    expect(text[row + 1]).toBe(color.name);
                    expect(text[row + 2]).toBe(String(color.count));
                }
            }
        }
        expect(destinations.size).toBe(111);
    });

    it('offers actual native US Letter PDFs only for individually reviewed additions', () => {
        const reviewedIds = ['original-santa-hat', 'original-christmas-stocking', 'original-snowflake', 'minecraft-creeper-face-v1', 'original-retro-diamond-coaster'];
        const reviewed = patterns.filter(pattern => reviewedIds.includes(pattern.id));
        expect(reviewed.map(pattern => pattern.id)).toEqual(reviewedIds);
        expect(reviewed.find(pattern => pattern.id === 'minecraft-creeper-face-v1')?.kind).toBe('fan-art');
        for (const pattern of patterns.filter(pattern => !reviewedIds.includes(pattern.id))) {
            expect(pattern.assets.pdfLetter).toBeUndefined();
            for (const locale of locales) expect(getLocalizedPatternLetterPdf(pattern, locale)).toBeUndefined();
        }
        for (const pattern of reviewed) {
            expect(pattern.assets.pdfLetter).toBe(`/patterns/${pattern.id}/pattern-letter.pdf`);
            for (const locale of locales) {
                const download = getLocalizedPatternLetterPdf(pattern, locale)!;
                expect(download).toEqual({ href: `/patterns-${locale}/${pattern.id}/pattern-letter.pdf`, language: locale });
                const pdf = readFileSync(publicFile(download.href));
                expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
                const raw = pdf.toString('latin1');
                expect(raw).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+612\s+792\s*\]/);
                expect(raw).toContain(`/Lang (${locale}-${{ de: 'DE', fr: 'FR', ja: 'JP' }[locale]})`);
                const titleStart = raw.indexOf('/Title (') + '/Title '.length;
                expect(comparable(metadataText(literal(raw, titleStart).value))).toContain(comparable(getLocalizedSubjectName(pattern, locale)));
            }
            expect(readFileSync(publicFile(pattern.assets.pdfLetter!)).toString('latin1')).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+612\s+792\s*\]/);
        }
    });

    it('uses the reviewed Perler project colors, symbols and actual pixel quantities for every downloadable motif', () => {
        for (const pattern of patterns) {
            const draft = parseEditorProject(readFileSync(publicFile(pattern.assets.project), 'utf8'));
            expect(draft?.selectedPaletteIds).toEqual(['perler']);
            const pixels = decodeEditorPatternDraft(draft?.editedPattern);
            expect(pixels).not.toBeNull();
            expect([draft?.editedPattern?.width, draft?.editedPattern?.height]).toEqual([29, 29]);
            const usage = new Map<string, number>();
            for (let i = 0; i < pixels!.length; i += 4) {
                if (!pixels![i + 3]) continue;
                const hex = `#${Buffer.from(pixels!.subarray(i, i + 3)).toString('hex')}`;
                usage.set(hex, (usage.get(hex) ?? 0) + 1);
            }
            expect([...usage.values()].reduce((sum, count) => sum + count, 0)).toBe(pattern.beads);
            expect(usage.size).toBe(pattern.colorCount);
            for (const color of pattern.palette) {
                expect(usage.get(color.hex)).toBe(color.count);
                const entry = draft!.activePalettes.flatMap(palette => palette.entries).find(item => item.ref === color.ref);
                expect(entry).toMatchObject({ name: color.name, symbol: color.symbol });
                expect(Buffer.from([entry!.color.r, entry!.color.g, entry!.color.b]).toString('hex')).toBe(color.hex.slice(1));
            }
        }
    });

    it('keeps all 26 previously translated PDFs at their original public paths and byte hashes', () => {
        expect(Object.keys(legacyHashes)).toHaveLength(26);
        for (const [href, expectedHash] of Object.entries(legacyHashes)) {
            expect(createHash('sha256').update(readFileSync(publicFile(href))).digest('hex')).toBe(expectedHash);
        }
    });
});

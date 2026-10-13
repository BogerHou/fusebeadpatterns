import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Palette } from '../core/model/palette/palette.model';
import { downloadBlob } from '../core/printer/download';
import { PdfPrinter } from '../core/printer/pdf/pdf.printer';
import { computeUsage, countBeads } from '../core/utils/utils';
import { getBoardMaterials, getBoardSummaries } from './board-materials';
import { getBoardOption, getPaletteOption, parsePaletteCsv } from './config';
import { decodeEditorPatternDraft, encodeEditorProjectPattern, parseEditorProject, serializeEditorProject } from './draft';
import { exportEditorPattern } from './pattern-export';
import { remapPatternPalette } from './pattern-palette';
import { limitPatternBeadColors, quantizePattern } from './pattern-quantization';
import { buildEditorProject } from './project';

vi.mock('../core/printer/download', () => ({ downloadBlob: vi.fn() }));

const photoFixtures = [
    { name: 'cat29', path: 'public/guides/photo-to-pattern/cat-perler-29.bead-pattern.json', beads: 667 },
    { name: 'cat58', path: 'public/guides/photo-to-pattern/cat-perler-58.bead-pattern.json', beads: 2726 },
    { name: 'cleaned rocket', path: 'public/guides/photo-to-pattern/rocket-perler-29-cleanup.bead-pattern.json', beads: 337 },
];
const brands = ['perler', 'hama', 'artkal_s'];

function loadFixture(path: string) {
    const draft = parseEditorProject(readFileSync(path, 'utf8'));
    if (!draft?.editedPattern) throw new Error(`Invalid published project: ${path}`);
    const pixels = decodeEditorPatternDraft(draft.editedPattern);
    if (!pixels) throw new Error(`Invalid published pixels: ${path}`);
    return { draft, pixels, width: draft.editedPattern.width, height: draft.editedPattern.height };
}

function loadBrand(id: string): Palette[] {
    const option = getPaletteOption(id);
    if (!option) throw new Error(`Unknown brand: ${id}`);
    return [parsePaletteCsv(readFileSync(`public/palettes/${option.file}`, 'utf8'), option)];
}

function rgb(pixels: Uint8ClampedArray, offset: number): string {
    return `${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`;
}

function expectPatternIntegrity(before: Uint8ClampedArray, after: Uint8ClampedArray, palettes: Palette[], maxColors: number) {
    expect(after.length).toBe(before.length);
    const enabled = new Set(palettes.flatMap(palette => palette.entries)
        .filter(entry => entry.enabled && entry.color.a === 255)
        .map(entry => `${entry.color.r},${entry.color.g},${entry.color.b}`));
    const occupiedColors = new Set<string>();
    for (let offset = 0; offset < before.length; offset += 4) {
        expect(after[offset + 3]).toBe(before[offset + 3]);
        if (before[offset + 3] === 0) {
            expect(after.subarray(offset, offset + 4)).toEqual(before.subarray(offset, offset + 4));
        } else {
            expect(enabled.has(rgb(after, offset))).toBe(true);
            occupiedColors.add(rgb(after, offset));
        }
    }
    expect(occupiedColors.size).toBeLessThanOrEqual(maxColors);
    expect(computeUsage(after, palettes).size).toBeLessThanOrEqual(maxColors);
}

// Decode the generated PDF's text and drawing operators, including its real
// embedded font mapping. No source-code assertions or mock material renderer.
function readPdfPages(contents: string) {
    const objects = new Map([...contents.matchAll(/(?:^|\n)(\d+) 0 obj\n([\s\S]*?)\nendobj/g)].map(([, id, value]) => [id, value]));
    const fonts = new Map<string, Map<string, string>>();
    for (const [, name, id] of contents.matchAll(/\/(F\d+) (\d+) 0 R/g)) {
        const cmapId = objects.get(id)?.match(/\/ToUnicode (\d+) 0 R/)?.[1];
        if (!cmapId) continue;
        const map = new Map<string, string>();
        for (const block of objects.get(cmapId)!.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
            for (const [, glyph, unicode] of block[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>/gi)) {
                map.set(glyph.toLowerCase(), String.fromCharCode(...(unicode.match(/.{4}/g) ?? []).map(value => parseInt(value, 16))));
            }
        }
        fonts.set(name, map);
    }
    return [...objects.values()].filter(value => /\/Type \/Page\s/.test(value)).map(page => {
        const streamId = page.match(/\/Contents (\d+) 0 R/)![1];
        const stream = objects.get(streamId)!.match(/\nstream\n([\s\S]*?)\nendstream/)![1];
        let font = '', x = 0, y = 0;
        const texts: { x: number; y: number; text: string }[] = [];
        for (const token of stream.matchAll(/\/(F\d+) [\d.]+ Tf|([\d.-]+) ([\d.-]+) Td|<([0-9a-f]+)> Tj|\(((?:\\.|[^\\)])*)\) Tj/gi)) {
            if (token[1]) font = token[1];
            else if (token[2]) { x = Number(token[2]); y = Number(token[3]); }
            else {
                const text = token[4]
                    ? (token[4].match(/.{4}/g) ?? []).map(glyph => fonts.get(font)?.get(glyph.toLowerCase()) ?? '?').join('')
                    : token[5].replace(/\\([\\()])/g, '$1');
                texts.push({ x, y, text });
            }
        }
        return { texts, filledCells: [...stream.matchAll(/ re\nB\n/g)].length };
    });
}

beforeEach(() => vi.mocked(downloadBlob).mockClear());

describe('brand color limit with published editable projects', () => {
    it('dithers an oversized centered source only within the actual canvas', async () => {
        const fixture = JSON.parse(readFileSync('public/guides/pixel-art-examples/cat-32-original.pixel-grid.json', 'utf8'));
        const source = new Uint8ClampedArray(fixture.pixels);
        const pixels = new Uint8ClampedArray(24 * 32 * 4);
        for (let row = 0; row < 32; row++) pixels.set(source.subarray((row * 32 + 4) * 4, (row * 32 + 28) * 4), row * 24 * 4);
        const request = { pixels, width: 24, height: 32,
            palettes: loadBrand('perler'), matchingId: 'delta_e_cie2000',
            dithering: { enable: true, hardness: 100 }, maxBeadColors: 4 };
        const clipped = await quantizePattern({ ...request, drawingPosition: { x: 0, y: 0, width: 24, height: 32 } });
        const centeredOversized = await quantizePattern({ ...request, drawingPosition: { x: -4, y: 0, width: 32, height: 32 } });
        // Both source rectangles cover the complete sampled canvas. No missing
        // neighbor may wrap around into another row when fit-to-board is off.
        expect(centeredOversized).toEqual(clipped);
    });

    it('keeps the actual photo example’s empty-cell bytes intact while dithering a limited palette', async () => {
        const fixture = JSON.parse(readFileSync('public/guides/pixel-art-examples/cat-32-original.pixel-grid.json', 'utf8'));
        const pixels = new Uint8ClampedArray(fixture.pixels);
        const palettes = loadBrand('perler');
        const limited = await quantizePattern({ pixels, width: fixture.width, height: fixture.height,
            palettes, matchingId: 'delta_e_cie2000', maxBeadColors: 4,
            dithering: { enable: true, hardness: 100 }, drawingPosition: { x: 0, y: 0, width: 32, height: 32 } });
        expectPatternIntegrity(pixels, limited, palettes, 4);
        expect(countBeads(computeUsage(limited, palettes))).toBe(832);
    });

    const cases = photoFixtures.flatMap(fixture => brands.flatMap(brand => [2, 6].map(limit => ({ ...fixture, brand, limit }))));
    it.each(cases)('$name / $brand / $limit colors preserves every bead and blank cell', async ({ path, beads, brand, limit }) => {
        const { draft, pixels, width, height } = loadFixture(path);
        const original = pixels.slice();
        const palettes = loadBrand(brand);
        const paletteBefore = JSON.stringify(palettes);
        const mapped = await remapPatternPalette(pixels, width, height, palettes, draft.matchingId, { sourcePalettes: draft.activePalettes });
        const mappedBefore = mapped.slice();
        expect(computeUsage(mapped, palettes).size).toBeGreaterThan(limit);
        const limited = await limitPatternBeadColors({ pixels: mapped, width, height, palettes, matchingId: draft.matchingId, maxBeadColors: limit });

        expectPatternIntegrity(mapped, limited, palettes, limit);
        expect(countBeads(computeUsage(limited, palettes))).toBe(beads);
        expect(mapped).toEqual(mappedBefore);
        expect(pixels).toEqual(original);
        expect(JSON.stringify(palettes)).toBe(paletteBefore);

        const sums = new Map<string, number>();
        const boards = getBoardSummaries(limited, palettes, 29, draft.boardWidth, draft.boardHeight);
        for (const board of boards) {
            const materials = getBoardMaterials(limited, palettes, 29, draft.boardWidth, draft.boardHeight, board);
            expect(materials.beadCount).toBe(board.beadCount);
            expect(materials.usage.size).toBe(board.colorCount);
            materials.usage.forEach((count, ref) => sums.set(ref, (sums.get(ref) ?? 0) + count));
        }
        expect(sums).toEqual(computeUsage(limited, palettes));
        expect(boards.reduce((sum, board) => sum + board.beadCount, 0)).toBe(beads);
    });

    it.each(brands)('keeps the published black-and-white drawings exact after conversion to %s', async brand => {
        const palettes = loadBrand(brand);
        for (const [name, beads] of [['original-friendly-ghost', 311], ['original-soccer-ball', 501]] as const) {
            const { draft, pixels, width, height } = loadFixture(`public/patterns/${name}/pattern.bead-pattern.json`);
            const mapped = await remapPatternPalette(pixels, width, height, palettes, draft.matchingId, { sourcePalettes: draft.activePalettes });
            expect(computeUsage(mapped, palettes).size).toBe(2);
            const limited = await limitPatternBeadColors({ pixels: mapped, width, height, palettes, matchingId: draft.matchingId, maxBeadColors: 2 });
            expect(limited).toEqual(mapped);
            expect(countBeads(computeUsage(limited, palettes))).toBe(beads);
        }
    });

    it.each(brands)('respects owned colors and legacy partial alpha in the actual rocket (%s)', async brand => {
        const { draft, pixels, width, height } = loadFixture(photoFixtures[2].path);
        const palettes = loadBrand(brand);
        palettes[0].entries.forEach((entry, index) => { entry.enabled = index % 3 === 0 && entry.color.a === 255; });
        const mapped = await remapPatternPalette(pixels, width, height, palettes, draft.matchingId, { sourcePalettes: draft.activePalettes });
        let partialOffset = -1, blankOffset = -1;
        for (let offset = 0; offset < mapped.length; offset += 4) {
            if (partialOffset < 0 && mapped[offset + 3] === 255) partialOffset = offset;
            if (blankOffset < 0 && mapped[offset + 3] === 0) blankOffset = offset;
        }
        expect(partialOffset).toBeGreaterThanOrEqual(0);
        expect(blankOffset).toBeGreaterThanOrEqual(0);
        mapped[partialOffset + 3] = 77;
        mapped.set([17, 203, 91, 0], blankOffset);
        const before = mapped.slice();
        const limited = await limitPatternBeadColors({ pixels: mapped, width, height, palettes, matchingId: draft.matchingId, maxBeadColors: 3 });
        expectPatternIntegrity(before, limited, palettes, 3);
        // Material rows have always counted exact opaque catalog entries only;
        // retaining legacy partial alpha must not silently add a physical bead.
        expect(countBeads(computeUsage(limited, palettes))).toBe(336);
        expect(mapped).toEqual(before);
    });

    it('round-trips the limit preference without discarding later hand-painted colors', async () => {
        const { draft, pixels, width, height } = loadFixture(photoFixtures[0].path);
        const palettes = loadBrand('perler');
        const limited = await limitPatternBeadColors({ pixels, width, height, palettes, matchingId: draft.matchingId, maxBeadColors: 2 });
        const used = new Set<string>();
        for (let offset = 0; offset < limited.length; offset += 4) {
            if (limited[offset + 3] > 0) used.add(rgb(limited, offset));
        }
        const added = palettes[0].entries.find(entry => entry.enabled && entry.color.a === 255
            && !used.has(`${entry.color.r},${entry.color.g},${entry.color.b}`))!;
        expect(added).toBeDefined();
        const emptyCell = Array.from({ length: width * height }, (_, cell) => cell).find(cell => limited[cell * 4 + 3] === 0)!;
        limited.set([added.color.r, added.color.g, added.color.b, 255], emptyCell * 4);
        const editedPattern = encodeEditorProjectPattern(limited, width, height);
        const restored = parseEditorProject(serializeEditorProject({ ...draft, activePalettes: palettes, maxBeadColors: 2, editedPattern }));
        expect(restored?.maxBeadColors).toBe(2);
        expect(decodeEditorPatternDraft(restored!.editedPattern)).toEqual(limited);
        expect(computeUsage(limited, restored!.activePalettes).size).toBe(3);
        expect(countBeads(computeUsage(limited, restored!.activePalettes))).toBe(668);
    });

    it.each(['a4', 'letter'] as const)('actual %s PDF inventory and board grids use the limited cat58 snapshot', async paper => {
        const { draft, pixels, width, height } = loadFixture(photoFixtures[1].path);
        const palettes = loadBrand('hama');
        const mapped = await remapPatternPalette(pixels, width, height, palettes, draft.matchingId, { sourcePalettes: draft.activePalettes });
        const limited = await limitPatternBeadColors({ pixels: mapped, width, height, palettes, matchingId: draft.matchingId, maxBeadColors: 4 });
        const before = limited.slice();
        const project = buildEditorProject({ ...draft, palettes, boardOption: getBoardOption(draft.boardId)!, useSymbols: false });
        const usage = computeUsage(limited, project.paletteConfiguration.palettes);
        const selection = paper === 'letter' ? { row: 1, column: 1 } : undefined;
        const board = selection ? getBoardMaterials(limited, palettes, 29, 2, 2, selection) : undefined;
        const expectedUsage = board?.usage ?? usage;
        await exportEditorPattern({ exportId: 'pdf', reducedColor: limited, beadsUsage: usage, project, fileName: 'limited-cat', pdfPaperSize: paper, pdfBoard: selection, exportGridPng: () => undefined, printerLoaders: { pdf: async () => PdfPrinter } });
        expect(downloadBlob).toHaveBeenCalledOnce();
        const [blob, name] = vi.mocked(downloadBlob).mock.calls[0];
        expect(name).toBe('limited-cat.pdf');
        const pages = readPdfPages(Buffer.from(await blob.arrayBuffer()).toString('latin1'));
        expect(pages).toHaveLength(selection ? 2 : 6);
        const inventory = pages[selection ? 0 : 1];
        const refs = new Set(palettes.flatMap(palette => palette.entries.map(entry => entry.ref)));
        const rows = inventory.texts.filter(item => refs.has(item.text));
        expect(rows).toHaveLength(expectedUsage.size);
        const printedUsage = new Map(rows.map(row => {
            const quantity = inventory.texts.find(item => item.x > row.x && Math.abs(item.y - row.y) < 0.01 && /^\d+$/.test(item.text));
            expect(quantity).toBeDefined();
            return [row.text, Number(quantity!.text)];
        }));
        expect(printedUsage).toEqual(expectedUsage);
        const grids = pages.slice(selection ? 1 : 2);
        expect(grids.reduce((sum, page) => sum + page.filledCells, 0)).toBe(board?.beadCount ?? 2726);
        expect(limited).toEqual(before);
    });
});

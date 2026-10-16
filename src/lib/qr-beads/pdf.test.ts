import { readFileSync } from 'node:fs';
import jsQR from 'jsqr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLetterPalettes } from '../bead-letters/data';
import { buildQrProject, defaultQrState } from './project';
import { createQrPdf } from './pdf';
import { qrPdfLayout } from './pdf-layout';
import { qrPdfMessages } from './pdf-messages';
import type { QrState } from './types';

const palettes = getLetterPalettes();
const font = readFileSync('public/fonts/fuse-bead-qr/FuseBeadQR-Regular.ttf');
const mm = (value: number) => value * 72 / 25.4;
const state = (patch: Partial<QrState> = {}): QrState => ({ ...defaultQrState(palettes), ...patch });

function readPdf(bytes: Uint8Array) {
    const raw = Buffer.from(bytes).toString('latin1'), objects = new Map<number, string>(), unicode = new Map<number, string>();
    for (const match of raw.matchAll(/(\d+) 0 obj\n([\s\S]*?)\nendobj/g)) objects.set(Number(match[1]), match[2]);
    for (const block of raw.matchAll(/beginbfchar\s*([\s\S]*?)\s*endbfchar/g)) {
        for (const match of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) unicode.set(parseInt(match[1], 16), String.fromCodePoint(parseInt(match[2], 16)));
    }
    const pages = [...objects.values()].filter(value => /\/Type \/Page\b/.test(value)).map(value => {
        const size = value.match(/\/MediaBox \[([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)\]/)!;
        const contents = objects.get(Number(value.match(/\/Contents (\d+) 0 R/)![1]))!;
        const stream = contents.match(/stream\n([\s\S]*?)\nendstream/)![1];
        const text = [...stream.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)].map(match =>
            [...match[1].matchAll(/.{4}/g)].map(unit => unicode.get(parseInt(unit[0], 16)) ?? '?').join('')).join('\n');
        return { width: Number(size[3]), height: Number(size[4]), stream, text };
    });
    return { raw, pages };
}

function fills(stream: string) {
    const number = '([-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+))';
    const operations = new RegExp(`${number} ${number} ${number} rg|${number} g|${number} ${number} ${number} ${number} re\\s+(f|B|S)\\b`, 'g');
    let rgb = [0, 0, 0];
    const found: Array<{ rect: number[]; rgb: number[] }> = [];
    for (const match of stream.matchAll(operations)) {
        if (match[1] !== undefined) rgb = match.slice(1, 4).map(channel => Math.round(Number(channel) * 255));
        else if (match[4] !== undefined) rgb = Array(3).fill(Math.round(Number(match[4]) * 255));
        else if (match[9] === 'f') found.push({ rect: match.slice(5, 9).map(Number), rgb: [...rgb] });
    }
    return found;
}

beforeEach(() => { vi.stubGlobal('fetch', vi.fn(async () => new Response(font))); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('actual QR PDF bytes, native text and exact cell preservation', () => {
    it('keeps a clean reference plus four actual Perler boards, exact materials and full border', async () => {
        const input = state(), result = buildQrProject(input, palettes), before = JSON.stringify(result);
        const pdf = readPdf(await createQrPdf(result, input, 'en'));
        const plan = qrPdfLayout(result.grid.width, result.grid.height, 29, 'a4');
        expect(pdf.pages).toHaveLength(plan.pageCount);
        expect(pdf.raw).toContain('/Lang (en)'); expect(pdf.raw).toContain('/PrintScaling /None'); expect(pdf.raw).toContain('/FontFile2');
        // jsPDF's built-in A4 dimensions round to 0.01 pt; physical size must remain within 0.01 mm.
        expect(Math.abs(pdf.pages[0].width - mm(210))).toBeLessThan(mm(.01));
        expect(Math.abs(pdf.pages[0].height - mm(297))).toBeLessThan(mm(.01));
        for (const fragment of ['QR bead pattern', 'Perler Midi', '80-19018', 'Black', '80-19001', 'White',
            String(result.usage[0].count), String(result.usage[1].count), String(result.grid.width ** 2), qrPdfMessages.en.border,
            'Clean QR reference']) expect(pdf.pages[0].text).toContain(fragment);
        const overview = fills(pdf.pages[0].stream).filter(({ rect }) => rect[0] >= mm(plan.overview.left) - .001
            && rect[1] <= mm(297 - plan.overview.top) + .001 && rect[1] + rect[3] >= mm(297 - plan.overview.top - result.grid.height * plan.overview.cellMm) - .001);
        expect(overview).toHaveLength(1 + result.pattern.darkBeads / result.pattern.beadsPerModule ** 2);
        const side = result.grid.width * 8, rgba = new Uint8ClampedArray(side * side * 4);
        for (const { rect, rgb } of overview) {
            const x = Math.round((rect[0] / mm(1) - plan.overview.left) / plan.overview.cellMm * 8);
            const y = Math.round((297 - rect[1] / mm(1) - plan.overview.top) / plan.overview.cellMm * 8);
            const width = Math.round(rect[2] / mm(plan.overview.cellMm) * 8), height = Math.round(-rect[3] / mm(plan.overview.cellMm) * 8);
            for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) rgba.set([...rgb, 255], ((y + dy) * side + x + dx) * 4);
        }
        expect(jsQR(rgba, side, side, { inversionAttempts: 'dontInvert' })?.binaryData).toEqual(Array.from(new TextEncoder().encode(input.text)));
        expect(JSON.stringify(result)).toBe(before);
    });

    it('prints actual global board locations, dark/light counts and no beads in padding cells', async () => {
        const input = state({ text: 'HELLO', beadsPerModule: 2, paper: 'letter' }), result = buildQrProject(input, palettes);
        const plan = qrPdfLayout(result.grid.width, result.grid.height, 29, 'letter');
        const pdf = readPdf(await createQrPdf(result, input, 'en'));
        let painted = 0;
        for (const board of plan.boards) {
            const page = pdf.pages[board.page - 1];
            expect(page.width).toBeCloseTo(612, 4); expect(page.height).toBeCloseTo(792, 4);
            expect(page.text).toContain(`Board ${board.row}-${board.column}`);
            expect(page.text).toContain(`Rows: ${board.y + 1}-${board.y + board.height}`);
            expect(page.text).toContain(`Columns: ${board.x + 1}-${board.x + board.width}`);
            expect(page.text).toContain('Counting chart, not an actual-size');
            const cells = fills(page.stream).filter(({ rect }) => Math.abs(rect[2] - mm(plan.board.cellMm)) < .0001
                && Math.abs(rect[3] + mm(plan.board.cellMm)) < .0001);
            expect(cells).toHaveLength(board.width * board.height); painted += cells.length;
            let dark = 0;
            for (let y = board.y; y < board.y + board.height; y++) for (let x = board.x; x < board.x + board.width; x++) dark += result.pattern.mask[y * result.grid.width + x];
            expect(page.text).toContain(String(dark)); expect(page.text).toContain(String(board.width * board.height - dark));
        }
        expect(painted).toBe(result.grid.width * result.grid.height);
    });

    it('uses the true 50×50 Artkal board and native German/French/Japanese labels, with embedded glyphs', async () => {
        for (const locale of ['de', 'fr', 'ja'] as const) {
            const input = state({ text: 'QR', paletteId: 'artkal_s', foregroundRef: 'S13', backgroundRef: 'S01', paper: 'letter' });
            const result = buildQrProject(input, palettes), pdf = readPdf(await createQrPdf(result, input, locale));
            expect(pdf.pages).toHaveLength(2);
            expect(pdf.pages[0].text).toContain(qrPdfMessages[locale].title);
            expect(pdf.pages[1].text).toContain(qrPdfMessages[locale].counting);
            expect(pdf.pages[1].text).toContain('50 x 50'); expect(pdf.pages[1].text).toContain('S13'); expect(pdf.pages[1].text).toContain('S01');
            expect(pdf.raw).toContain(`/Lang (${locale === 'ja' ? 'ja' : `${locale}-${locale.toUpperCase()}`})`);
            expect(pdf.raw).toContain('/FontFile2'); expect(pdf.pages.map(page => page.text).join('')).not.toContain('?');
        }
    });

    it('snapshots the payload, brand, pixels and paper before awaiting fonts', async () => {
        const input = state({ text: 'UNCHANGED' }), result = buildQrProject(input, palettes), side = result.grid.width;
        const pending = createQrPdf(result, input, 'en');
        input.text = 'CHANGED'; input.paper = 'letter'; result.palette.label = 'changed';
        const sourcePixels = result.grid.pixels;
        if (!(sourcePixels instanceof Uint8ClampedArray)) throw new Error('Expected mutable generated QR pixels');
        sourcePixels[0] = 0;
        const pdf = readPdf(await pending);
        expect(Math.abs(pdf.pages[0].width - mm(210))).toBeLessThan(mm(.01));
        expect(pdf.pages[0].text).toContain(`Bead grid: ${side} x ${side}`);
        expect(pdf.pages[0].text).toContain('Perler Midi'); expect(pdf.pages[0].text).not.toContain('changed');
    });

    it('rejects a stale payload, tampered materials, pixel or saved board before generating bytes', async () => {
        const input = state(), result = buildQrProject(input, palettes);
        await expect(createQrPdf(result, { ...input, text: 'different' }, 'en')).rejects.toThrow('INVALID_PROJECT');
        result.usage[0].count++;
        await expect(createQrPdf(result, input, 'en')).rejects.toThrow('INVALID_PROJECT');
        const changed = buildQrProject(input, palettes); changed.draft.boardWidth = 8;
        await expect(createQrPdf(changed, input, 'en')).rejects.toThrow('INVALID_PROJECT');
    });

    it('does not fetch or emit a PDF for an already-aborted request', async () => {
        const controller = new AbortController(); controller.abort(); const fetch = vi.mocked(globalThis.fetch);
        const input = state(); await expect(createQrPdf(buildQrProject(input, palettes), input, 'ja', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('stops a cancelled multi-board generation rather than returning completed bytes', async () => {
        const controller = new AbortController(), input = state({ text: 'ABORT', beadsPerModule: 3 });
        const pending = createQrPdf(buildQrProject(input, palettes), input, 'en', controller.signal);
        const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        setTimeout(() => controller.abort(), 0); await rejection;
    });
});

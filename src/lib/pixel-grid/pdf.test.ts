import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGrid, serializeProject } from './core';
import { assertPixelGridPdfJapaneseFont, createPixelGridPdf, pixelGridPdfPaperColor, type PixelGridPdfOptions } from './pdf';

const defaults: PixelGridPdfOptions = { paper: 'a4', mode: 'overview', content: 'artwork', locale: 'en' };
const font = () => readFileSync(new URL('../../../public/fonts/fuse-bead-japanese/FuseBeadJapanese-Regular.ttf', import.meta.url)).toString('base64');

/** Inspect actual uncompressed PDF page objects, rather than trusting a layout summary. */
function readPdf(bytes: Uint8Array) {
    const raw = Buffer.from(bytes).toString('latin1'), objects = new Map<number, string>();
    for (const match of raw.matchAll(/(\d+) 0 obj\n([\s\S]*?)\nendobj/g)) objects.set(Number(match[1]), match[2]);
    const pages = [...objects.values()].filter(value => /\/Type \/Page\b/.test(value)).map(value => {
        const size = value.match(/\/MediaBox \[([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)\]/)!;
        const contents = objects.get(Number(value.match(/\/Contents (\d+) 0 R/)![1]))!;
        return { width: Number(size[3]), height: Number(size[4]), stream: contents.match(/stream\n([\s\S]*?)\nendstream/)![1] };
    });
    return { raw, pages };
}

function artworkFills(stream: string) {
    const number = '([-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+))';
    const tokens = new RegExp(`${number} ${number} ${number} rg\\b|${number} g\\b|${number} ${number} ${number} ${number} re\\s+f\\b`, 'g');
    let color = [0, 0, 0];
    const fills: Array<{ color: number[]; rectangle: number[] }> = [];
    for (const token of stream.matchAll(tokens)) {
        if (token[1] !== undefined) color = token.slice(1, 4).map(Number);
        else if (token[4] !== undefined) color = Array(3).fill(Number(token[4]));
        else fills.push({ color: color.map(channel => channel * 255), rectangle: token.slice(5, 9).map(Number) });
    }
    return fills;
}

test('printing composites alpha onto white and omits alpha-zero hidden RGB', () => {
    assert.deepEqual(pixelGridPdfPaperColor(17, 83, 149, 128), [136, 169, 202]);
    assert.deepEqual(pixelGridPdfPaperColor(1, 2, 3, 255), [1, 2, 3]);
    assert.deepEqual(pixelGridPdfPaperColor(99, 13, 249, 1), [254, 254, 255]);
    assert.equal(pixelGridPdfPaperColor(199, 31, 97, 0), null);
});

test('real overview bytes preserve source RGBA, output white composite and do not encode hidden pixels', async () => {
    const source = createGrid(3, 1, [17, 83, 149, 128, 199, 31, 97, 0, 3, 119, 241, 255]);
    const before = serializeProject(source), pdf = readPdf(await createPixelGridPdf(source, defaults));
    assert.equal(serializeProject(source), before); assert.equal(pdf.pages.length, 1);
    const fills = artworkFills(pdf.pages[0].stream); assert.equal(fills.length, 2);
    for (const [index, expected] of [[0, [136, 169, 202]], [1, [3, 119, 241]]] as const) {
        fills[index].color.forEach((value, channel) => assert.ok(Math.abs(value - expected[channel]) < 0.01));
    }
    assert.ok(!pdf.raw.includes('/Subtype /Image'));
    assert.ok(pdf.pages[0].stream.includes('(A4 / Whole grid scaled to one page)'));
    assert.ok(pdf.raw.includes('/PrintScaling /None'));
});

test('the async export snapshots both RGBA and print options before its first await', async () => {
    const source = createGrid(1, 1, [23, 101, 227, 255]), options = { ...defaults };
    const promise = createPixelGridPdf(source, options);
    source.pixels.fill(0); options.paper = 'letter'; options.content = 'blank'; options.mode = 'tiled';
    const pdf = readPdf(await promise), fill = artworkFills(pdf.pages[0].stream);
    assert.equal(pdf.pages.length, 1); assert.equal(fill.length, 1);
    fill[0].color.forEach((value, channel) => assert.ok(Math.abs(value - [23, 101, 227][channel]) < 0.01));
    assert.ok(Math.abs(pdf.pages[0].width - 210 * 72 / 25.4) < 0.02);
});

test('blank export has no artwork fills on any page and never edits the stored artwork', async () => {
    const source = createGrid(41, 49); source.pixels.fill(127); const before = serializeProject(source);
    const pdf = readPdf(await createPixelGridPdf(source, { ...defaults, mode: 'tiled', content: 'blank', paper: 'letter' }));
    assert.equal(pdf.pages.length, 5); assert.equal(serializeProject(source), before);
    for (const page of pdf.pages) {
        assert.equal(artworkFills(page.stream).length, 0);
        assert.ok(Math.abs(page.width - 612) < 0.02); assert.ok(Math.abs(page.height - 792) < 0.02);
    }
    assert.ok(pdf.pages[1].stream.includes('(Rows 1-48 / Columns 1-40)'));
    assert.ok(pdf.pages[4].stream.includes('(Rows 49-49 / Columns 41-41)'));
    assert.ok(pdf.pages[1].stream.includes('(US Letter / 4 mm cells / Print at 100%)'));
    assert.ok(!pdf.pages[0].stream.includes('4 mm cells'));
});

test('maximum grid export has one overview and twelve source-accurate tiles', async () => {
    const source = createGrid(128, 128);
    for (let pixel = 0; pixel < 128 * 128; pixel++) source.pixels.set([pixel % 251, (pixel * 7) % 251, (pixel * 13) % 251, 255], pixel * 4);
    const pdf = readPdf(await createPixelGridPdf(source, { ...defaults, mode: 'tiled', paper: 'letter' }));
    assert.equal(pdf.pages.length, 13); assert.equal(artworkFills(pdf.pages[0].stream).length, 128 * 128);
    assert.equal(pdf.pages.slice(1).reduce((sum, page) => sum + artworkFills(page.stream).length, 0), 128 * 128);
    for (const page of pdf.pages.slice(1)) for (const fill of artworkFills(page.stream)) {
        assert.ok(Math.abs(fill.rectangle[2] - 4 * 72 / 25.4) < 0.00001);
        assert.ok(Math.abs(fill.rectangle[3] + 4 * 72 / 25.4) < 0.00001);
    }
    assert.ok(pdf.pages[12].stream.includes('(Rows 97-128 / Columns 121-128)'));
});

test('all four locales produce PDFs with valid existing Japanese glyphs and no font downloads', async () => {
    assert.doesNotThrow(() => assertPixelGridPdfJapaneseFont(font()));
    for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
        const pdf = readPdf(await createPixelGridPdf(createGrid(2, 3), { ...defaults, locale, japaneseFontBase64: locale === 'ja' ? font() : undefined }));
        assert.equal(pdf.pages.length, 1);
        if (locale === 'ja') { assert.ok(pdf.raw.includes('/FontFile2')); assert.ok(pdf.raw.includes('/ToUnicode')); assert.ok(pdf.raw.includes('/Lang (ja)')); }
    }
});

test('missing or invalid Japanese fonts and invalid options are rejected before output', async () => {
    const source = createGrid(1, 1);
    await assert.rejects(createPixelGridPdf(source, { ...defaults, locale: 'ja' }), { code: 'JAPANESE_FONT_REQUIRED' });
    await assert.rejects(createPixelGridPdf(source, { ...defaults, locale: 'ja', japaneseFontBase64: 'AAAA' }), { code: 'JAPANESE_FONT_INVALID' });
    // A bounded Unicode cmap with a valid sentinel but no printable glyphs
    // distinguishes missing characters from malformed font data.
    const noGlyphs = Buffer.alloc(64), view = new DataView(noGlyphs.buffer, noGlyphs.byteOffset, noGlyphs.byteLength);
    view.setUint32(0, 0x00010000); view.setUint16(4, 1); noGlyphs.write('cmap', 12);
    view.setUint32(20, 28); view.setUint32(24, 36); view.setUint16(30, 1);
    view.setUint16(32, 3); view.setUint16(34, 1); view.setUint32(36, 12);
    view.setUint16(40, 4); view.setUint16(42, 24); view.setUint16(46, 2); view.setUint16(48, 2);
    view.setUint16(54, 0xffff); view.setUint16(58, 0xffff); view.setUint16(60, 1);
    assert.throws(() => assertPixelGridPdfJapaneseFont(noGlyphs.toString('base64')), { code: 'JAPANESE_GLYPHS_MISSING' });
    for (const change of [{ paper: 'legal' }, { mode: 'poster' }, { content: 'source' }, { locale: 'xx' }, { japaneseFontBase64: 1 }]) {
        await assert.rejects(createPixelGridPdf(source, { ...defaults, ...change } as PixelGridPdfOptions), { code: 'INVALID_OPTIONS' });
    }
    await assert.rejects(createPixelGridPdf({ width: 129, height: 1, pixels: [] }, defaults));
});

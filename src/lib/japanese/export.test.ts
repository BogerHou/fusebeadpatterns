import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';
import { buildJapanesePatternPdf, getJapanesePrintData } from './export';
import type { JapaneseExportSnapshot } from './generator';

function example(boardWidth = 1): JapaneseExportSnapshot {
    const white = new PaletteEntry('White', new Color(255, 255, 255, 255));
    white.ref = 'W01'; white.prefix = 'P'; white.symbol = 'W';
    const black = new PaletteEntry('Black', new Color(0, 0, 0, 255));
    black.ref = 'B18'; black.prefix = 'P'; black.symbol = 'K';
    const pixels = new Uint8ClampedArray(29 * boardWidth * 29 * 4);
    pixels.set([255, 255, 255, 255], 0);
    pixels.set([0, 0, 0, 255], (29 * boardWidth - 1) * 4);
    return { pixels, width: boardWidth * 29, height: 29, boardWidth, boardHeight: 1,
        paletteId: 'perler', palette: new Palette('Perler Midi', [white, black]),
        usage: new Map([['stale', 999]]), fileName: 'test.png' };
}

describe('Japanese printable output', () => {
    it('recounts current pixels, preserves transparent gaps and uses raw brand references', () => {
        const printed = getJapanesePrintData(example(2));
        expect(printed.beads).toBe(2);
        expect(printed.entries.map(({ entry, count }) => [entry.ref, count])).toEqual([['W01', 1], ['B18', 1]]);
    });

    it('rejects mismatched board dimensions and colors absent from the selected palette', () => {
        const badDimensions = { ...example(), width: 28 };
        expect(() => getJapanesePrintData(badDimensions)).toThrow();
        const badColor = example(); badColor.pixels.set([255, 0, 0, 255], 0);
        expect(() => getJapanesePrintData(badColor)).toThrow();
        const empty = example(); empty.pixels.fill(0);
        expect(() => getJapanesePrintData(empty)).toThrow();
    });

    it('keeps a simple single-board chart on one A4 sheet and adds a shared key for multiple boards', () => {
        const font = readFileSync(path.join(process.cwd(), 'public/fonts/fuse-bead-japanese/FuseBeadJapanese-Regular.ttf')).toString('base64');
        for (const boards of [1, 2]) {
            const pdf = buildJapanesePatternPdf(example(boards), font);
            expect(pdf.getNumberOfPages()).toBe(boards === 1 ? 1 : 3);
            for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
                pdf.setPage(page);
                expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 1);
                expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(297, 1);
            }
            expect(new Uint8Array(pdf.output('arraybuffer')).byteLength).toBeGreaterThan(10000);
        }
    });

    it('preserves palette RGB precision and prints Latin accents legibly with the ASCII subset', () => {
        const font = readFileSync(path.join(process.cwd(), 'public/fonts/fuse-bead-japanese/FuseBeadJapanese-Regular.ttf')).toString('base64');
        for (const boards of [1, 2]) {
            const snapshot = example(boards);
            snapshot.paletteId = 'artkal_a';
            const entry = snapshot.palette.entries[0];
            entry.ref = 'A110'; entry.name = 'Caffe Latté'; entry.color = new Color(229, 236, 241, 255);
            snapshot.pixels.set([229, 236, 241, 255], 0);
            const pdf = buildJapanesePatternPdf(snapshot, font);
            const pages = (pdf.internal as unknown as { pages: string[][] }).pages;
            const color = '0.898039 0.925490 0.945098 rg';
            expect(pages[1].join('\n')).toContain(color);
            const keyPage = boards === 1 ? 1 : 3;
            expect(pages[keyPage].join('\n')).toContain(color);
            const metadata = pdf.getFont().metadata as unknown as { characterToGlyph(code: number): number };
            const label = `1 / A110 / Caffe Latte${boards === 1 ? ' / 1個' : ''}`;
            const encoded = Array.from(label, char => metadata.characterToGlyph(char.codePointAt(0)!).toString(16).padStart(4, '0')).join('');
            expect(pages[keyPage].join('\n').toLowerCase()).toContain(`<${encoded}>`);
        }
    });
});

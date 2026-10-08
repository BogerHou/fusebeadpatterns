import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Color } from '../../model/color/color.model';
import { Palette, PaletteEntry } from '../../model/palette/palette.model';
import type { Project } from '../../model/project/project.model';
import { downloadBlob } from '../download';
import { PdfPrinter } from './pdf.printer';

vi.mock('../download', () => ({ downloadBlob: vi.fn() }));

// Inspect each generated page's drawing stream, excluding embedded font data.
function pageStreams(contents: string): string[] {
    const objects = new Map(
        Array.from(
            contents.matchAll(/(?:^|\n)(\d+) 0 obj\n([\s\S]*?)\nendobj/g),
            ([, id, value]) => [id, value]
        )
    );
    return Array.from(objects.values())
        .filter((value) => /\/Type \/Page\s/.test(value))
        .map((value) => {
            const contentId = value.match(/\/Contents (\d+) 0 R/)?.[1];
            const stream = objects.get(contentId ?? '')
                ?.match(/\nstream\n([\s\S]*?)\nendstream/)?.[1];
            expect(stream).toBeDefined();
            return stream!;
        });
}

function rectangleCount(stream: string): number {
    return Array.from(stream.matchAll(/ re\b/g)).length;
}

function filledRectangleCount(stream: string): number {
    return Array.from(stream.matchAll(/\nB\n/g)).length;
}

describe('PDF generation integration', () => {
    beforeEach(() => {
        vi.mocked(downloadBlob).mockClear();
    });

    it.each([
        { boardsWide: 1, boardsTall: 1, pages: 2 },
        { boardsWide: 2, boardsTall: 1, pages: 4 },
        { boardsWide: 1, boardsTall: 2, pages: 4 },
    ])('exports $boardsWide × $boardsTall boards with $pages useful pages', async ({ boardsWide, boardsTall, pages }) => {
        const entry = new PaletteEntry('Red', new Color(255, 0, 0, 255));
        entry.ref = 'P01';
        entry.symbol = 'A';
        entry.prefix = 'P';
        const boardSize = 29;
        const boardCount = boardsWide * boardsTall;
        const project = {
            boardConfiguration: {
                board: { nbBeadPerRow: boardSize },
                nbBoardWidth: boardsWide,
                nbBoardHeight: boardsTall,
            },
            paletteConfiguration: { palettes: [new Palette('Test', [entry])] },
            exportConfiguration: { useSymbols: true },
        } as Project;
        const pixels = new Uint8ClampedArray(boardSize * boardSize * boardCount * 4);
        // Place a bead on each physical board; blank grid cells remain transparent.
        for (let y = 0; y < boardsTall; y++) {
            for (let x = 0; x < boardsWide; x++) {
                const index = (y * boardSize * boardSize * boardsWide + x * boardSize) * 4;
                pixels.set([255, 0, 0, 255], index);
            }
        }

        await new PdfPrinter().print(
            pixels,
            new Map([['P01', boardCount]]),
            project,
            'pattern'
        );

        expect(downloadBlob).toHaveBeenCalledOnce();
        const [blob, filename] = vi.mocked(downloadBlob).mock.calls[0];
        expect(filename).toBe('pattern.pdf');
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('application/pdf');
        const contents = await blob.text();
        expect(contents).toMatch(/^%PDF-/);
        expect(contents).toContain(`/Count ${pages}`);
        expect(contents).toContain('/FontFile2');
        expect(contents).toMatch(/%%EOF$/);

        const streams = pageStreams(contents);
        expect(streams).toHaveLength(pages);
        if (boardCount > 1) {
            const indexPage = streams.shift()!;
            expect(rectangleCount(indexPage)).toBe(boardCount);
            expect(filledRectangleCount(indexPage)).toBe(0);
            expect(Array.from(indexPage.matchAll(/ Tj\n/g))).toHaveLength(boardCount);
        }
        // The first useful page is still the color, symbol and quantity table.
        expect(rectangleCount(streams[0])).toBe(3);
        expect(filledRectangleCount(streams[0])).toBe(3);
        const patternPages = streams.slice(1);
        expect(patternPages).toHaveLength(boardCount);
        for (const stream of patternPages) {
            expect(rectangleCount(stream)).toBe(boardSize * boardSize + 1);
            expect(filledRectangleCount(stream)).toBe(1);
        }
    });

    it('keeps every color-table page when a single board uses more than 30 colors', async () => {
        const entries = Array.from({ length: 31 }, (_, index) => {
            const entry = new PaletteEntry(`Color ${index}`, new Color(index + 1, 0, 0, 255));
            entry.ref = `P${index + 1}`;
            entry.symbol = String(index + 1);
            entry.prefix = 'P';
            return entry;
        });
        const project = {
            boardConfiguration: {
                board: { nbBeadPerRow: 29 },
                nbBoardWidth: 1,
                nbBoardHeight: 1,
            },
            paletteConfiguration: { palettes: [new Palette('Test', entries)] },
            exportConfiguration: { useSymbols: true },
        } as Project;
        const pixels = new Uint8ClampedArray(29 * 29 * 4);
        entries.forEach((entry, index) => {
            pixels.set([entry.color.r, 0, 0, 255], index * 4);
        });

        await new PdfPrinter().print(
            pixels,
            new Map(entries.map((entry) => [entry.ref, 1])),
            project,
            'many-colors'
        );

        const [blob] = vi.mocked(downloadBlob).mock.calls[0];
        const streams = pageStreams(await blob.text());
        expect(streams).toHaveLength(3);
        expect(filledRectangleCount(streams[0])).toBe(30 * 3);
        expect(filledRectangleCount(streams[1])).toBe(3);
        expect(rectangleCount(streams[2])).toBe(29 * 29 + 31);
        expect(filledRectangleCount(streams[2])).toBe(31);
    });
});

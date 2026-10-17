import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { brickCatalog } from './catalog';
import { createMosaic, type BrickCatalog } from './core';

const font = () => new Uint8Array(readFileSync('public/fonts/brick-mosaic/FuseBeadBrickMosaic-Regular.ttf'));
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('real four-language brick PDF generation', () => {
    it.each(['en', 'de', 'fr', 'ja'] as const)('%s embeds the tool font on A4 and Letter with exact baseplate page counts', async locale => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(font())));
        const { createBrickPdf } = await import('./pdf');
        const cells = Array.from({ length: 49 * 33 }, (_, index) => index % 3 ? brickCatalog.colors[index % 20].id : null);
        const model = createMosaic(49, 33, 32, brickCatalog, cells);
        for (const paper of ['a4', 'letter'] as const) {
            const bytes = await createBrickPdf(model, brickCatalog, locale, paper), text = Buffer.from(bytes).toString('latin1');
            expect(text.startsWith('%PDF-')).toBe(true);
            expect(text.match(/\/Type \/Page\b/g)).toHaveLength(6);
            expect(text).toContain('/ToUnicode');
            const box = text.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/)!;
            expect(Number(box[1])).toBeCloseTo(paper === 'a4' ? 595.28 : 612, 2);
            expect(Number(box[2])).toBeCloseTo(paper === 'a4' ? 841.89 : 792, 2);
        }
    });
    it('retries a failed font load and never replaces the callers model while awaiting a font', async () => {
        let resolve!: (value: Response) => void;
        const response = new Promise<Response>(done => { resolve = done; });
        const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })).mockImplementationOnce(() => response);
        vi.stubGlobal('fetch', fetcher);
        const { createBrickPdf } = await import('./pdf');
        const model = createMosaic(1, 1, 48, brickCatalog, ['ldraw-4']);
        await expect(createBrickPdf(model, brickCatalog, 'en', 'a4')).rejects.toThrow('PDF_FONT_UNAVAILABLE');
        const bytes = createBrickPdf(model, brickCatalog, 'ja', 'letter');
        model.cells[0] = null; resolve(new Response(font()));
        expect(Buffer.from(await bytes).toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(3);
        expect(model.cells).toEqual([null]); expect(fetcher).toHaveBeenCalledTimes(2);
    });
    it('rejects invalid paper, missing glyphs and cancelled exports', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(font())));
        const { createBrickPdf } = await import('./pdf'), model = createMosaic(1, 1, 32, brickCatalog, ['ldraw-4']);
        const controller = new AbortController(); controller.abort();
        await expect(createBrickPdf(model, brickCatalog, 'en', 'a4', controller.signal)).rejects.toThrow();
        await expect(createBrickPdf(model, brickCatalog, 'en', 'legal' as 'a4')).rejects.toThrow('INVALID_LAYOUT');
        const catalog: BrickCatalog = { ...brickCatalog, colors: brickCatalog.colors.map(color => ({ ...color, name: '🧱' })) };
        await expect(createBrickPdf(model, catalog, 'ja', 'a4')).rejects.toThrow('PDF_GLYPHS_MISSING');
    });
});

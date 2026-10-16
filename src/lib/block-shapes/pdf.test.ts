import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { defaultShapeState } from './project';
import { createBlockShapePdf, planShapePdf } from './pdf';

const loader = vi.hoisted(() => vi.fn<() => Promise<string>>());
vi.mock('./japanese-font', async original => ({ ...await original<typeof import('./japanese-font')>(), loadBlockShapeJapaneseFont: loader }));
const font = readFileSync('public/fonts/block-shapes-japanese/FuseBeadBlockShapesJapanese-Regular.ttf').toString('base64');
const mm = (v: number) => v * 72 / 25.4;
function readPdf(bytes: Uint8Array) {
    const raw = Buffer.from(bytes).toString('latin1'), objects = new Map<number, string>();
    for (const match of raw.matchAll(/(\d+) 0 obj\n([\s\S]*?)\nendobj/g)) objects.set(Number(match[1]), match[2]);
    const pages = [...objects.values()].filter(value => /\/Type \/Page\b/.test(value)).map(value => {
        const size = value.match(/\/MediaBox \[([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)\]/)!;
        const content = objects.get(Number(value.match(/\/Contents (\d+) 0 R/)![1]))!;
        return { width: Number(size[3]), height: Number(size[4]), stream: content.match(/stream\n([\s\S]*?)\nendstream/)![1] };
    });
    return { raw, pages };
}
function rectangles(stream: string) {
    const number = '([-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+))';
    return [...stream.matchAll(new RegExp(`${number} ${number} ${number} ${number} re\\s+f\\b`, 'g'))].map(match => match.slice(1, 5).map(Number));
}
describe('readable full-scope block planner PDF', () => {
    it('plans every tile exactly once and stays inside both paper sizes with all maximum layers available', () => {
        for (const paper of ['a4', 'letter'] as const) {
            const input = { ...defaultShapeState(), paper, spec: { kind: 'sphere' as const, width: 96, depth: 96, height: 96, style: 'hollow' as const, thickness: 8 } };
            const plan = planShapePdf(input, true);
            expect(plan.pages).toHaveLength(481);
            const tiles = plan.pages.filter(page => page.layer === 0 && page.kind === 'tile'), visits = new Uint8Array(96 * 96);
            for (const tile of tiles) {
                expect(65 + tile.depth * 3).toBeLessThan(plan.heightMm - 39);
                for (let z = tile.z; z < tile.z + tile.depth; z++) for (let x = tile.x; x < tile.x + tile.width; x++) visits[z * 96 + x]++;
            }
            expect(visits.every(count => count === 1)).toBe(true);
            expect(planShapePdf(input, false).pages).toHaveLength(5);
        }
        const input = { ...defaultShapeState(), spec: { ...defaultShapeState().spec, width: 128, depth: 128 } };
        expect(planShapePdf(input, true).pages).toHaveLength(10);
    });
    it('writes the independent D4 outline as exactly its eight occupied squares, with no ghost or guide cells', async () => {
        loader.mockClear();
        const input = { ...defaultShapeState(), spec: { ...defaultShapeState().spec, width: 4, depth: 4 }, ghost: true, center: true };
        const pdf = readPdf(await createBlockShapePdf(input, 'en', false));
        expect(pdf.pages).toHaveLength(1); expect(loader).not.toHaveBeenCalled();
        expect(pdf.pages[0].width).toBeCloseTo(mm(210), 2); expect(pdf.pages[0].height).toBeCloseTo(mm(297), 2);
        const fills = rectangles(pdf.pages[0].stream);
        const expected = ['0110', '1001', '1001', '0110'];
        const occupied = fills.map(([left, top, width, height]) => {
            expect(width).toBeCloseTo(mm(8), 4); expect(height).toBeCloseTo(-mm(8), 4);
            return [Math.round((left / mm(1) - 89) / 8) + 0, Math.round(((297 - top / mm(1)) - 65) / 8) + 0];
        });
        expect(occupied).toEqual(expected.flatMap((row, z) => [...row].flatMap((value, x) => value === '1' ? [[x, z]] : [])));
        expect(pdf.raw).toContain('Total blocks: 8'); expect(pdf.raw).toContain('/PrintScaling /None');
        expect(pdf.pages[0].stream).toContain('Columns 0'); expect(pdf.raw).not.toMatch(/\{(?:count|layer|page|start|end)\}/);
    });
    it('prints all three D3 sphere layers plus one material summary, with independent 5/9/5 fills', async () => {
        const state = { ...defaultShapeState(), paper: 'letter' as const, spec: { kind: 'sphere' as const, width: 3, depth: 3, height: 3, style: 'filled' as const, thickness: 1 } };
        const pdf = readPdf(await createBlockShapePdf(state, 'en', true));
        expect(pdf.pages).toHaveLength(4);
        expect(pdf.pages.map(page => rectangles(page.stream).length)).toEqual([0, 5, 9, 5]);
        expect(pdf.pages[0].width).toBeCloseTo(612, 4); expect(pdf.pages[0].height).toBeCloseTo(792, 4);
        expect(pdf.raw).toContain('Total blocks: 19');
        for (let y = 0; y < 3; y++) expect(pdf.pages[y + 1].stream).toContain(`Y = ${y}`);
    });
    it('freezes applied geometry and paper before asynchronous work and supports cancellation', async () => {
        const input = defaultShapeState(), before = JSON.stringify(input), pending = createBlockShapePdf(input, 'en', false);
        input.spec.width = 3; input.paper = 'letter';
        const pdf = readPdf(await pending);
        expect(pdf.pages[0].width).toBeCloseTo(mm(210), 2); expect(pdf.raw).toContain('15 x 15 x 1');
        const controller = new AbortController(); controller.abort();
        await expect(createBlockShapePdf(JSON.parse(before), 'en', false, controller.signal)).rejects.toThrow();
        const controller2 = new AbortController(), generating = createBlockShapePdf(JSON.parse(before), 'en', false, controller2.signal);
        controller2.abort(); await expect(generating).rejects.toThrow();
    });
    it('embeds the existing Japanese font and rejects missing/invalid font data instead of writing broken glyphs', async () => {
        loader.mockResolvedValue(font);
        const pdf = readPdf(await createBlockShapePdf(defaultShapeState(), 'ja', false));
        expect(pdf.pages).toHaveLength(1); expect(pdf.raw).toContain('/FontFile2'); expect(pdf.raw).toContain('/Lang (ja)');
        loader.mockResolvedValue('');
        await expect(createBlockShapePdf(defaultShapeState(), 'ja', false)).rejects.toThrow();
        loader.mockResolvedValue(font);
    });
});

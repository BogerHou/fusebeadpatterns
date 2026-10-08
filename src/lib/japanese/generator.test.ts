import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { parseEditorProject, decodeEditorPatternDraft } from '../editor/draft';
import { computeUsage } from '../core/utils/utils';
import {
    JapaneseRequestGate, generateJapanesePattern, inspectJapaneseProject,
    loadJapanesePalette, remapJapanesePattern, restoreJapaneseProject,
    serializeJapaneseProject, snapshotJapanesePattern, validateJapaneseSettings,
    type JapanesePaletteId, type JapanesePattern,
} from './generator';

function palette(id: JapanesePaletteId) {
    const option = getPaletteOption(id)!;
    return parsePaletteCsv(readFileSync(path.join(process.cwd(), 'public/palettes', option.file), 'utf8'), option);
}
function fixture(boardWidth = 2, boardHeight = 1): JapanesePattern {
    const colors = palette('perler');
    const pixels = new Uint8ClampedArray(boardWidth * boardHeight * 29 * 29 * 4);
    const black = colors.entries.find(entry => entry.name === 'Black')!;
    const white = colors.entries.find(entry => entry.name === 'White')!;
    pixels.set([black.color.r, black.color.g, black.color.b, 255], 0);
    pixels.set([white.color.r, white.color.g, white.color.b, 255], (boardWidth * 29 + 4) * 4);
    const imageSrc = 'data:image/png;base64,' + readFileSync(path.join(process.cwd(), 'public/patterns/original-friendly-ghost/pixels.png')).toString('base64');
    return { paletteId: 'perler', palette: colors, boardWidth, boardHeight, width: boardWidth * 29, height: boardHeight * 29, pixels, usage: computeUsage(pixels, [colors]), fileName: '日本語の図案', imageSrc };
}
afterEach(() => vi.unstubAllGlobals());

describe('Japanese generator contracts', () => {
    it.each([[1, 1], [2, 1], [1, 4], [4, 4]])('round-trips %i × %i boards including source, edited colors and transparent cells in the real editor format', (width, height) => {
        const original = fixture(width, height);
        const raw = serializeJapaneseProject(original);
        const draft = parseEditorProject(raw)!;
        expect(draft.boardId).toBe('midi');
        expect(draft.imageSrc).toBe(original.imageSrc);
        expect(decodeEditorPatternDraft(draft.editedPattern)).toEqual(original.pixels);
        const restored = restoreJapaneseProject(raw, palette('perler'));
        expect(restored.pixels).toEqual(original.pixels);
        expect([restored.width, restored.height]).toEqual([width * 29, height * 29]);
        expect(restored.usage).toEqual(original.usage);
        expect(restored.fileName).toBe('日本語の図案');
        expect(restored.pixels.filter((_, index) => index % 4 === 3 && restored.pixels[index] === 0)).toHaveLength(width * height * 841 - 2);
    });

    it.each([
        { boardId: 'mini' }, { boardWidth: 5 }, { boardHeight: 0 },
        { boardWidth: 1.5 }, { selectedPaletteIds: ['perler_mini'] },
        { selectedPaletteIds: ['perler', 'hama'] },
    ])('rejects unsupported project settings without truncating or changing the current pattern: %j', patch => {
        const current = fixture(); const before = new Uint8ClampedArray(current.pixels);
        const invalid = JSON.parse(serializeJapaneseProject(current));
        Object.assign(invalid.draft, patch);
        expect(() => inspectJapaneseProject(JSON.stringify(invalid))).toThrow();
        expect(current.pixels).toEqual(before);
    });

    it('rejects canvas/board disagreement, foreign colors, nonbinary alpha and remote source URLs', () => {
        const raw = serializeJapaneseProject(fixture());
        for (const mutate of [
            (draft: ReturnType<typeof parseEditorProject>) => { draft!.boardWidth = 1; },
            (draft: ReturnType<typeof parseEditorProject>) => { draft!.imageSrc = 'https://example.com/private.png'; },
            (draft: ReturnType<typeof parseEditorProject>) => { draft!.activePalettes[0].entries[0].color.r = 999; },
            (draft: ReturnType<typeof parseEditorProject>) => { const bytes = Buffer.from(draft!.editedPattern!.data, 'base64'); bytes[3] = 127; draft!.editedPattern!.data = bytes.toString('base64'); },
            (draft: ReturnType<typeof parseEditorProject>) => { const bytes = Buffer.from(draft!.editedPattern!.data, 'base64'); bytes.set([1, 2, 3, 255], 0); draft!.editedPattern!.data = bytes.toString('base64'); },
        ]) {
            const project = JSON.parse(raw); mutate(project.draft);
            expect(() => restoreJapaneseProject(JSON.stringify(project), palette('perler'))).toThrow();
        }
    });

    it('snapshots pixels and palette independently and recomputes usage instead of trusting stale UI counts', () => {
        const current = fixture(); current.usage = new Map([['fake', 999]]);
        const snapshot = snapshotJapanesePattern(current);
        expect([...snapshot.usage.values()].reduce((sum, count) => sum + count, 0)).toBe(2);
        const originalPixel = current.pixels[0], originalColor = current.palette.entries[0].color.r;
        snapshot.pixels[0] = 0; snapshot.palette.entries[0].color.r = 0;
        expect(current.pixels[0]).toBe(originalPixel);
        expect(current.palette.entries[0].color.r).toBe(originalColor);
    });

    it.each(['hama', 'artkal_a'] as const)('remaps to %s while preserving edited positions, erasures and semantic black/white', async id => {
        const current = fixture();
        const before = new Uint8ClampedArray(current.pixels);
        const target = palette(id);
        const next = await remapJapanesePattern(current, id, target);
        const black = target.entries.find(entry => entry.name === 'Black')!;
        const white = target.entries.find(entry => entry.name === 'White')!;
        expect(Array.from(next.pixels.subarray(0, 4))).toEqual([black.color.r, black.color.g, black.color.b, 255]);
        const whiteOffset = (current.width + 4) * 4;
        expect(Array.from(next.pixels.subarray(whiteOffset, whiteOffset + 4))).toEqual([white.color.r, white.color.g, white.color.b, 255]);
        for (let offset = 3; offset < next.pixels.length; offset += 4) expect(next.pixels[offset]).toBe(before[offset]);
        expect(next.width).toBe(current.width); expect(next.height).toBe(current.height);
        expect(current.pixels).toEqual(before);
        expect(next.imageSrc).toBe(current.imageSrc);
        expect(restoreJapaneseProject(serializeJapaneseProject(next), target).pixels).toEqual(next.pixels);
    });

    it('invalidates older asynchronous requests and keeps inputs intact on cancellation or palette fetch failure', async () => {
        const gate = new JapaneseRequestGate(), first = gate.begin(), latest = gate.begin();
        expect(first.signal.aborted).toBe(true); expect(gate.isCurrent(first)).toBe(false); expect(gate.isCurrent(latest)).toBe(true);
        const current = fixture(), before = new Uint8ClampedArray(current.pixels);
        await expect(remapJapanesePattern(current, 'hama', palette('hama'), first.signal)).rejects.toMatchObject({ name: 'AbortError' });
        expect(current.pixels).toEqual(before);
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
        await expect(loadJapanesePalette('hama')).rejects.toThrow('色表を読み込めませんでした');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => '<html>unexpected response</html>' }));
        await expect(loadJapanesePalette('hama')).rejects.toThrow('色表を読み込めませんでした');
        expect(current.pixels).toEqual(before);
        gate.cancel(); expect(latest.signal.aborted).toBe(true); expect(gate.isCurrent(latest)).toBe(false);
    });

    it('validates bounded dimensions before loading or touching a browser canvas', async () => {
        expect(() => validateJapaneseSettings({ paletteId: 'perler', boardWidth: 4, boardHeight: 4 })).not.toThrow();
        await expect(generateJapanesePattern('not-an-image', { paletteId: 'perler', boardWidth: 1.5, boardHeight: 1 }, palette('perler'), 'test')).rejects.toThrow('1〜4');
    });
});

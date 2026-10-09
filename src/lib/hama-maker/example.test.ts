import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { runPatternQuantization } from '../editor/quantization-protocol';
import { countBeads, computeUsage } from '../core/utils/utils';
import { getHamaGhostExampleDownloads, hamaGhostExample } from './example';

const file = (asset: string) => path.join(process.cwd(), 'public', asset);

describe('real Hama image-conversion example', () => {
    it('converts the actual source PNG into the existing Hama pixels using only the two permitted colours', async () => {
        const bytes = await readFile(file(hamaGhostExample.source));
        expect(createHash('sha256').update(bytes).digest('hex')).toBe('5fb92e52e2dfafaf9ce10f0dbf80943a2844018733544317d77c5d15ecd3bd49');
        const source = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        expect([source.info.width, source.info.height]).toEqual([29, 29]);
        const option = getPaletteOption('hama')!;
        const palette = parsePaletteCsv(await readFile(file('/palettes/hama.csv'), 'utf8'), option);
        for (const entry of palette.entries) entry.enabled = hamaGhostExample.allowedRefs.some(ref => ref === entry.ref);
        const result = runPatternQuantization({
            pixels: new Uint8ClampedArray(source.data), width: 29, height: 29,
            palettes: [palette], matchingId: 'delta_e_cie2000', dithering: { enable: false, hardness: 100 },
            drawingPosition: { x: 0, y: 0, width: 29, height: 29 },
        });
        const target = await sharp(file(hamaGhostExample.result)).ensureAlpha().raw().toBuffer();
        expect(Buffer.from(result)).toEqual(target);
        const usage = computeUsage(result, [palette]);
        expect(countBeads(usage)).toBe(311);
        expect(usage).toEqual(new Map([['H01', 293], ['H18', 18]]));
        for (let i = 3; i < result.length; i += 4) expect(result[i]).toBe(source.data[i]);
        const project = parseEditorProject(await readFile(file(getHamaGhostExampleDownloads('en').project), 'utf8'))!;
        expect(decodeEditorPatternDraft(project.editedPattern)).toEqual(result);
        expect(project.selectedPaletteIds).toEqual(['hama']);
        expect(decodeEditorPatternDraft(parseEditorProject(serializeEditorProject(project))!.editedPattern)).toEqual(result);
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('uses real native existing documents for %s without creating substitute resources', async locale => {
        const downloads = getHamaGhostExampleDownloads(locale);
        for (const asset of [downloads.pdf, downloads.letter]) expect((await readFile(file(asset))).subarray(0, 5).toString()).toBe('%PDF-');
        expect(downloads.pdf).toContain(locale === 'en' ? '/patterns-hama/' : `/patterns-${locale}-hama/`);
        expect(downloads.editor).toBe(`${locale === 'en' ? '' : `/${locale}`}/editor?pattern=original-friendly-ghost-hama`);
    });
});

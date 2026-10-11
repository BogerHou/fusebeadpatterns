import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Palette } from '../core/model/palette/palette.model';
import { computeUsage, countBeads } from '../core/utils/utils';
import {
    JapaneseGeneratorError, loadJapanesePalette, restoreJapaneseProject, serializeJapaneseProject,
    type JapanesePattern,
} from '../japanese/generator';
import { getPaletteOption, parsePaletteCsv } from './config';
import {
    decodeEditorPatternDraft, encodeEditorProjectPattern,
    parseEditorProject, serializeEditorProject,
} from './draft';
import { applyFreshPaletteDefaults } from './palette-defaults';
import { clonePalettes, enablePaletteEntry, mergePaletteEnabledState, togglePaletteGroup } from './palette-state';
import { remapPatternPalette } from './pattern-palette';

async function rawPalette(id: string): Promise<Palette> {
    const option = getPaletteOption(id)!;
    return parsePaletteCsv(await readFile(path.join(process.cwd(), 'public/palettes', option.file), 'utf8'), option);
}

async function bauble() {
    const draft = parseEditorProject(await readFile(path.join(
        process.cwd(), 'public/patterns/original-christmas-bauble-ornament/pattern.bead-pattern.json'
    ), 'utf8'))!;
    const pixels = decodeEditorPatternDraft(draft.editedPattern)!;
    expect([draft.editedPattern!.width, draft.editedPattern!.height]).toEqual([29, 29]);
    expect(countBeads(computeUsage(pixels, draft.activePalettes))).toBe(362);
    return { draft, pixels };
}

function expectSameMask(result: Uint8ClampedArray, source: Uint8ClampedArray) {
    expect(result).toHaveLength(source.length);
    for (let offset = 0; offset < source.length; offset += 4) {
        expect(result[offset + 3]).toBe(source[offset + 3]);
        if (source[offset + 3] === 0) {
            expect(result.subarray(offset, offset + 4)).toEqual(source.subarray(offset, offset + 4));
        }
    }
}

const brands = [
    { id: 'hama', special: 'H13', unknown: ['H26', 'H61', 'H62', 'H63', 'H64'], enabled: 69,
        expected: [['H114', 249], ['H01', 60], ['H60', 53]] as [string, number][] },
    { id: 'artkal_s', special: 'SL3', unknown: ['S42', 'S47', 'S86'], enabled: 173,
        expected: [['S58', 249], ['S01', 60], ['S03', 53]] as [string, number][] },
];

afterEach(() => vi.unstubAllGlobals());

describe('fresh built-in palette defaults', () => {
    it.each(brands)('changes only initial enable flags in $id and retains unknown shade names', async ({ id, special, unknown, enabled }) => {
        const raw = await rawPalette(id);
        const before = structuredClone(raw);
        const fresh = applyFreshPaletteDefaults(id, raw);
        expect(fresh.entries.filter(entry => entry.enabled)).toHaveLength(enabled);
        expect(fresh.entries.find(entry => entry.ref === special)!.enabled).toBe(false);
        for (const ref of unknown) expect(fresh.entries.find(entry => entry.ref === ref)!.enabled).toBe(true);
        expect(fresh.entries.map(entry => ({ ...entry, enabled: true })))
            .toEqual(raw.entries.map(entry => ({ ...entry, enabled: true })));
        expect(fresh.name).toBe(raw.name);
        expect(structuredClone(raw)).toEqual(before);
    });

    it.each(['perler', 'hama_mini', 'artkal_c'])('does not infer effect categories for unreviewed %s', async id => {
        const raw = await rawPalette(id);
        expect(applyFreshPaletteDefaults(id, raw)).toEqual(raw);
    });

    it('leaves a reused ref with an unreviewed name unchanged', async () => {
        const raw = await rawPalette('hama');
        raw.entries.find(entry => entry.ref === 'H13')!.name = 'Revised red';
        expect(applyFreshPaletteDefaults('hama', raw).entries.find(entry => entry.ref === 'H13')!.enabled).toBe(true);
    });

    it.each(brands)('avoids the actual bauble special red in fresh $id without losing beads or holes', async ({ id, special, expected }) => {
        const { draft, pixels } = await bauble();
        const before = pixels.slice();
        const raw = await rawPalette(id);
        const priorResult = await remapPatternPalette(pixels, 29, 29, [raw], draft.matchingId, { sourcePalettes: draft.activePalettes });
        expect(computeUsage(priorResult, [raw]).get(special)).toBe(249);

        const fresh = applyFreshPaletteDefaults(id, raw);
        const result = await remapPatternPalette(pixels, 29, 29, [fresh], draft.matchingId, { sourcePalettes: draft.activePalettes });
        expect(computeUsage(result, [fresh])).toEqual(new Map(expected));
        expect(countBeads(computeUsage(result, [fresh]))).toBe(362);
        expectSameMask(result, before);
        expect(pixels).toEqual(before);
    });

    it.each(brands)('allows an explicit special red and Enable All to restore the original $id choices', async ({ id, special }) => {
        const { draft, pixels } = await bauble();
        const raw = await rawPalette(id);
        const fresh = applyFreshPaletteDefaults(id, raw);
        const chosen = enablePaletteEntry([fresh], fresh.name, special);
        const chosenResult = await remapPatternPalette(pixels, 29, 29, chosen, draft.matchingId, { sourcePalettes: draft.activePalettes });
        expect(computeUsage(chosenResult, chosen).get(special)).toBe(249);
        expect(fresh.entries.find(entry => entry.ref === special)!.enabled).toBe(false);
        expectSameMask(chosenResult, pixels);

        const all = togglePaletteGroup([fresh], fresh.name, true);
        expect(all[0].entries.every(entry => entry.enabled)).toBe(true);
        const fullResult = await remapPatternPalette(pixels, 29, 29, [raw], draft.matchingId, { sourcePalettes: draft.activePalettes });
        expect(await remapPatternPalette(pixels, 29, 29, all, draft.matchingId, { sourcePalettes: draft.activePalettes })).toEqual(fullResult);
    });

    it.each(brands)('preserves saved enabled and disabled $id flags ahead of new defaults', async ({ id, special }) => {
        const { draft, pixels } = await bauble();
        const previous = await rawPalette(id);
        previous.entries.find(entry => entry.name === 'White')!.enabled = false;
        const converted = await remapPatternPalette(pixels, 29, 29, [previous], draft.matchingId, { sourcePalettes: draft.activePalettes });
        const restored = parseEditorProject(serializeEditorProject({
            ...draft, selectedPaletteIds: [id], activePalettes: [previous],
            editedPattern: encodeEditorProjectPattern(converted, 29, 29),
        }))!;
        const merged = mergePaletteEnabledState([applyFreshPaletteDefaults(id, await rawPalette(id))], restored.activePalettes);
        expect(merged[0].entries.map(entry => [entry.ref, entry.enabled]))
            .toEqual(previous.entries.map(entry => [entry.ref, entry.enabled]));
        expect(merged[0].entries.find(entry => entry.ref === special)!.enabled).toBe(true);
        expect(merged[0].entries.find(entry => entry.name === 'White')!.enabled).toBe(false);
        expect(decodeEditorPatternDraft(restored.editedPattern)).toEqual(converted);
    });

    it.each(brands)('keeps an existing full $id palette and special pixels when reapplying the same brand', async ({ id, special }) => {
        const { draft, pixels } = await bauble();
        const saved = await rawPalette(id);
        const converted = await remapPatternPalette(pixels, 29, 29, [saved], draft.matchingId, { sourcePalettes: draft.activePalettes });
        const merged = mergePaletteEnabledState([applyFreshPaletteDefaults(id, await rawPalette(id))], [saved]);
        expect(merged[0].entries.every(entry => entry.enabled)).toBe(true);
        expect(computeUsage(converted, [saved]).get(special)).toBe(249);
        for (const matchingId of ['euclidean', 'delta_e_cie94', 'delta_e_cie2000']) {
            expect(await remapPatternPalette(converted, 29, 29, merged, matchingId, { sourcePalettes: [saved] })).toEqual(converted);
        }
    });

    it('uses the defaults through the actual Japanese Hama CSV loader', async () => {
        const csv = await readFile(path.join(process.cwd(), 'public/palettes/hama.csv'), 'utf8');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(csv)));
        const fresh = await loadJapanesePalette('hama');
        expect(fresh.entries.filter(entry => entry.enabled)).toHaveLength(69);
        expect(fresh.entries.find(entry => entry.ref === 'H13')!.enabled).toBe(false);
        expect(fresh.entries.find(entry => entry.ref === 'H61')!.enabled).toBe(true);
    });

    it.each([true, false])('restores Japanese saved special enabled=%s ahead of defaults while retaining CSV identity', async enabled => {
        const saved = await rawPalette('hama');
        saved.entries.find(entry => entry.ref === 'H13')!.enabled = enabled;
        saved.entries.find(entry => entry.ref === 'H05')!.enabled = false;
        const red = saved.entries.find(entry => entry.ref === 'H13')!;
        const pixels = new Uint8ClampedArray(29 * 29 * 4);
        pixels.set([red.color.r, red.color.g, red.color.b, 255], 4 * 30);
        const pattern: JapanesePattern = {
            paletteId: 'hama', palette: saved, boardWidth: 1, boardHeight: 1,
            width: 29, height: 29, pixels, usage: computeUsage(pixels, [saved]),
            fileName: 'saved-effect', imageSrc: null,
        };
        const raw = JSON.parse(serializeJapaneseProject(pattern));
        raw.draft.activePalettes[0].name = 'Older saved palette label';
        raw.draft.activePalettes[0].entries.find((entry: { ref: string }) => entry.ref === 'H13').name = 'Saved label';
        const fresh = applyFreshPaletteDefaults('hama', await rawPalette('hama'));
        const restored = restoreJapaneseProject(JSON.stringify(raw), fresh);
        expect(restored.palette.entries.find(entry => entry.ref === 'H13')!.enabled).toBe(enabled);
        expect(restored.palette.entries.find(entry => entry.ref === 'H05')!.enabled).toBe(false);
        expect(restored.palette.entries.find(entry => entry.ref === 'H13')!.name).toBe('Transparent Red');
        expect(restored.palette.name).toBe('Hama Midi');
        expect(restored.pixels).toEqual(pixels);
        expect(restored.usage).toEqual(new Map([['H13', 1]]));
        expect(fresh.entries.find(entry => entry.ref === 'H13')!.enabled).toBe(false);
        expect(restoreJapaneseProject(serializeJapaneseProject(restored), fresh).palette.entries.find(entry => entry.ref === 'H13')!.enabled).toBe(enabled);
        const altered = clonePalettes([saved]);
        altered[0].entries.find(entry => entry.ref === 'H13')!.color.r++;
        expect(() => restoreJapaneseProject(serializeEditorProject({
            ...parseEditorProject(JSON.stringify(raw))!, activePalettes: altered,
        }), fresh)).toThrow(JapaneseGeneratorError);
    });
});

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { getPatternById } from './catalog';
import { hamaPatterns } from './hama';
import { getLibraryProject } from './project-links';
import { loadLibraryEditorProject } from '../editor/library-project';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject } from '../editor/draft';
import { getPaletteOption, parsePaletteCsv } from '../editor/config';
import { remapPatternPalette } from '../editor/pattern-palette';
import { buildPatternEvent } from '../analytics';

const local = (url: string) => path.join(process.cwd(), 'public', url);

describe('Hama Midi printable variants', () => {
    it.each(hamaPatterns)('$name opens the reviewed Hama grid and survives a saved-project round trip', async (pattern) => {
        const original = getPatternById(pattern.id)!;
        expect(original.source).toBeNull();
        const before = parseEditorProject(await readFile(local(original.assets.project), 'utf8'))!;
        const contents = await readFile(local(pattern.project), 'utf8');
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(contents));
        const controller = new AbortController();
        const draft = await loadLibraryEditorProject(pattern.projectId, controller.signal, fetchProject);
        expect(fetchProject).toHaveBeenCalledWith(pattern.project, {
            signal: controller.signal, credentials: 'omit', redirect: 'error',
        });
        expect(draft.sourceMode).toBe('blank');
        expect(draft.imageSrc).toBeNull();
        expect(draft.selectedPaletteIds).toEqual(['hama']);
        expect([draft.boardId, draft.boardWidth, draft.boardHeight]).toEqual(['midi', 1, 1]);
        expect([draft.editedPattern!.width, draft.editedPattern!.height]).toEqual([29, 29]);
        const rgba = decodeEditorPatternDraft(draft.editedPattern!)!;
        const source = decodeEditorPatternDraft(before.editedPattern!)!;
        expect(rgba.filter((_, i) => i % 4 === 3)).toEqual(source.filter((_, i) => i % 4 === 3));
        expect(Buffer.from(rgba)).toEqual(await sharp(local(`/patterns-hama/${pattern.id}/pixels.png`)).ensureAlpha().raw().toBuffer());
        const option = getPaletteOption('hama')!;
        const palette = parsePaletteCsv(await readFile(local(`/palettes/${option.file}`), 'utf8'), option);
        const expectedRefs: Record<string, string[]> = {
            'original-soccer-ball': ['H01', 'H18'],
            'original-friendly-ghost': ['H01', 'H18'],
            'original-halloween-bat': ['H01', 'H07', 'H18'],
            'original-christmas-tree': ['H03', 'H05', 'H10', 'H12'],
            'original-snowman': ['H01', 'H04', 'H05', 'H18'],
            'original-gingerbread-man': ['H01', 'H05', 'H76'],
        };
        const used = new Set<string>();
        for (let i = 0; i < rgba.length; i += 4) {
            if (!rgba[i + 3]) continue;
            const entry = palette.entries.find(({ color }) => color.r === rgba[i] && color.g === rgba[i + 1] && color.b === rgba[i + 2]);
            expect(entry, `Unrecognised Hama RGB in ${pattern.id} at ${i / 4}`).toBeDefined();
            used.add(entry!.ref);
        }
        expect([...used].sort()).toEqual(expectedRefs[pattern.id]);
        expect(draft.activePalettes.map(({ name }) => name)).toEqual(['Hama Midi']);
        for (const entry of draft.activePalettes[0].entries) {
            const expected = palette.entries.find(({ ref }) => ref === entry.ref)!;
            expect(entry).toMatchObject({ name: expected.name, ref: expected.ref, symbol: expected.symbol, prefix: expected.prefix, color: expected.color });
        }
        expect(parseEditorProject(serializeEditorProject(draft))).toEqual(draft);
        for (const paletteId of ['perler', 'artkal_s']) {
            const targetOption = getPaletteOption(paletteId)!;
            const target = parsePaletteCsv(await readFile(local(`/palettes/${targetOption.file}`), 'utf8'), targetOption);
            const recoloured = await remapPatternPalette(rgba, 29, 29, [target], 'delta_e_cie2000', { sourcePalettes: draft.activePalettes });
            expect(recoloured.filter((_, i) => i % 4 === 3)).toEqual(source.filter((_, i) => i % 4 === 3));
        }
        expect(getLibraryProject(pattern.id)!.projectUrl).toBe(original.assets.project);
        expect(buildPatternEvent({ name: 'pattern_download', patternId: pattern.projectId, paletteId: 'hama', entryPoint: 'collection', format: 'pdf' })?.parameters).toEqual({
            pattern_id: pattern.projectId, primary_palette_id: 'hama', entry_point: 'collection', file_format: 'pdf',
        });
    });

    it.each(['original-friendly-ghost-hama/../../x', 'pokemon-pikachu-gen5-hama', 'https://example.com/hama', '__proto__-hama'])
    ('does not turn an unlisted brand-variant ID into a fetchable path: %s', async (id) => {
        const fetchProject = vi.fn<typeof fetch>();
        expect(getLibraryProject(id)).toBeUndefined();
        await expect(loadLibraryEditorProject(id, new AbortController().signal, fetchProject)).rejects.toThrow('not in the library');
        expect(fetchProject).not.toHaveBeenCalled();
    });
});

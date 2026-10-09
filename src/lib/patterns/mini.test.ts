import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { patterns } from './catalog';
import { hamaPatterns } from './hama';
import { getLibraryProject } from './project-links';
import { miniGhostAssetRoot, miniGhostProjectId } from './mini';
import { loadLibraryEditorProject } from '../editor/library-project';
import { decodeEditorPatternDraft, parseEditorProject } from '../editor/draft';

const asset = (url: string) => readFileSync(`public${url}`);

describe('Mini guide project allowlist', () => {
    it('retains every existing original and Hama project while adding one named Mini variant', () => {
        expect(patterns).toHaveLength(109);
        expect(patterns.some(pattern => pattern.id === miniGhostProjectId)).toBe(false);
        for (const pattern of patterns) expect(getLibraryProject(pattern.id)).toEqual({ id: pattern.id, title: pattern.title, projectUrl: pattern.assets.project });
        for (const pattern of hamaPatterns) expect(getLibraryProject(pattern.projectId)).toEqual({ id: pattern.projectId, title: `${pattern.name} — Hama Midi`, projectUrl: pattern.project });
        const titles = { en: 'Ghost', de: 'Geist', fr: 'Fantôme', ja: 'ゴースト' };
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) expect(getLibraryProject(miniGhostProjectId, locale)).toEqual({
            id: miniGhostProjectId, title: `${titles[locale]} — Perler Mini`, projectUrl: `${miniGhostAssetRoot}/pattern.bead-pattern.json`,
        });
        for (const unknown of [`${miniGhostProjectId}-unknown`, `${miniGhostAssetRoot}/pattern.bead-pattern.json`, 'https://example.com/mini.json']) expect(getLibraryProject(unknown)).toBeUndefined();
    });

    it('loads the actual Mini project with the complete original Ghost centered without pixel changes', async () => {
        const miniUrl = `${miniGhostAssetRoot}/pattern.bead-pattern.json`;
        const source = parseEditorProject(asset('/patterns/original-friendly-ghost/pattern.bead-pattern.json').toString())!;
        const originalPixels = decodeEditorPatternDraft(source.editedPattern)!;
        const contents = asset(miniUrl).toString();
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(contents));
        const restored = await loadLibraryEditorProject(miniGhostProjectId, new AbortController().signal, fetchProject);
        expect(fetchProject).toHaveBeenCalledWith(miniUrl, expect.objectContaining({ credentials: 'omit', redirect: 'error' }));
        expect(restored.selectedPaletteIds).toEqual(['perler_mini']);
        expect([restored.boardId, restored.boardWidth, restored.boardHeight]).toEqual(['mini', 1, 1]);
        expect([restored.editedPattern?.width, restored.editedPattern?.height]).toEqual([57, 57]);
        expect(restored.pdfScaleMode).toBe('fit-page');
        expect(restored.activePalettes.map(palette => palette.name)).toEqual(['Perler Mini']);
        const entries = restored.activePalettes.flatMap(palette => palette.entries);
        expect(entries.map(entry => [entry.name, entry.ref, entry.symbol])).toEqual([
            ['White', 'PM-WHITE', 'W'], ['Black', 'PM-BLACK', 'B'],
        ]);
        const pixels = decodeEditorPatternDraft(restored.editedPattern)!;
        let count = 0;
        for (let y = 0; y < 57; y++) for (let x = 0; x < 57; x++) {
            const actual = [...pixels.subarray((y * 57 + x) * 4, (y * 57 + x) * 4 + 4)];
            const withinOriginal = x >= 14 && x < 43 && y >= 14 && y < 43;
            const expected = withinOriginal ? [...originalPixels.subarray(((y - 14) * 29 + x - 14) * 4, ((y - 14) * 29 + x - 14) * 4 + 4)] : [0, 0, 0, 0];
            expect(actual, `row ${y + 1} column ${x + 1}`).toEqual(expected);
            if (actual[3]) count++;
        }
        expect(count).toBe(311);
    });
});

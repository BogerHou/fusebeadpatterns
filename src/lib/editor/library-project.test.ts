import { describe, expect, it, vi } from 'vitest';
import { loadLibraryEditorProject } from './library-project';
import { createEditorDraft, encodeEditorProjectPattern, serializeEditorProject } from './draft';
import { Color } from '../core/model/color/color.model';

const projectId = 'sdv-blue-chicken';

function createProject() {
    const pixels = new Uint8ClampedArray(29 * 29 * 4);
    pixels.set([40, 70, 150, 255], (14 * 29 + 14) * 4);
    return createEditorDraft({
        sourceMode: 'blank',
        imageSrc: null,
        fileName: 'source-matched-test-pattern',
        selectedPaletteIds: ['perler'],
        activePalettes: [{
            name: 'Saved palette',
            entries: [{
                name: 'Saved blue', ref: 'test-blue', symbol: 'A', prefix: 'P', enabled: true,
                color: new Color(40, 70, 150, 255),
            }],
        }],
        boardId: 'midi', boardWidth: 1, boardHeight: 1,
        matchingId: 'delta_e_cie2000', ditheringId: 'none',
        useSymbols: true, exportFormatId: 'pdf',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: true },
        previewZoom: 1,
        editedPattern: encodeEditorProjectPattern(pixels, 29, 29),
    });
}

describe('library project loading', () => {
    it('loads only the bundled project URL and preserves every saved pixel and color', async () => {
        const draft = createProject();
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(serializeEditorProject(draft)));
        const controller = new AbortController();
        const restored = await loadLibraryEditorProject(projectId, controller.signal, fetchProject);

        expect(fetchProject).toHaveBeenCalledWith(`/patterns/${projectId}/pattern.bead-pattern.json`, {
            signal: controller.signal, credentials: 'omit', redirect: 'error',
        });
        expect(restored.editedPattern).toEqual(draft.editedPattern);
        expect(restored.activePalettes).toEqual(draft.activePalettes);
    });

    it.each(['unknown', '../palettes/perler.csv', 'https://example.com/project.json', '__proto__', ''])
    ('does not fetch unrecognized pattern input %s', async (id) => {
        const fetchProject = vi.fn<typeof fetch>();
        await expect(loadLibraryEditorProject(id, new AbortController().signal, fetchProject)).rejects.toThrow('not in the library');
        expect(fetchProject).not.toHaveBeenCalled();
    });

    it('rejects a failed response without returning a replacement draft', async () => {
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response('Missing', { status: 404 }));
        await expect(loadLibraryEditorProject(projectId, new AbortController().signal, fetchProject)).rejects.toThrow('current project has not changed');
    });

    it.each(['not json', '{"version": 1}'])('rejects malformed project data', async (contents) => {
        const fetchProject = vi.fn<typeof fetch>().mockResolvedValue(new Response(contents));
        await expect(loadLibraryEditorProject(projectId, new AbortController().signal, fetchProject)).rejects.toThrow('could not be opened');
    });

    it('lets cancellation win even if the request resolves after it was cancelled', async () => {
        const controller = new AbortController();
        let resolveResponse!: (value: Response) => void;
        const fetchProject = vi.fn<typeof fetch>().mockImplementation(() => new Promise((resolve) => {
            resolveResponse = resolve;
        }));
        const loading = loadLibraryEditorProject(projectId, controller.signal, fetchProject);
        controller.abort();
        resolveResponse(new Response(serializeEditorProject(createProject())));
        await expect(loading).rejects.toMatchObject({ name: 'AbortError' });
    });
});

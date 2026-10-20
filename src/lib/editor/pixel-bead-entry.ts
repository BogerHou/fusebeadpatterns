import { getBoardOption, getPaletteOption } from './config';
import { decodeEditorPatternDraft, parseEditorProject, serializeEditorProject, type EditorDraft } from './draft';
import { buildEditorProject } from './project';
import type { PreparedSourceImage } from './source-image-transaction';

/** Validate and prepare a detached runtime document. No live editor state is
 * touched and no sampling/quantization is repeated on the saved bead cells. */
export function preparePixelBeadEditorDraft(
    input: EditorDraft,
    { allowIndependentBoardLayout = false }: { allowIndependentBoardLayout?: boolean } = {}
): { draft: EditorDraft; prepared: PreparedSourceImage } {
    const draft = parseEditorProject(serializeEditorProject(input));
    if (!draft || draft.sourceMode !== 'blank' || draft.imageSrc !== null || draft.sourceCrop ||
        new Set(draft.selectedPaletteIds).size !== draft.selectedPaletteIds.length || !draft.activePalettes.length || !draft.editedPattern) {
        throw new Error('Invalid pixel bead project');
    }
    const board = getBoardOption(draft.boardId), palettes = draft.selectedPaletteIds.map(getPaletteOption);
    const width = draft.boardWidth * (board?.beadsPerRow ?? 0), height = draft.boardHeight * (board?.beadsPerRow ?? 0);
    const pixels = decodeEditorPatternDraft(draft.editedPattern);
    if (!board || palettes.some(palette => !palette || (!allowIndependentBoardLayout && palette.boardId !== board.id)) || !pixels ||
        draft.editedPattern.width !== width || draft.editedPattern.height !== height) {
        throw new Error('Invalid pixel bead board');
    }
    const allowed = new Set(draft.activePalettes.flatMap(p => p.entries.filter(e => e.enabled)
        .map(e => `${e.color.r},${e.color.g},${e.color.b}`)));
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] === 0) continue;
        if (pixels[i + 3] !== 255 || !allowed.has(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`)) {
            throw new Error('Invalid pixel bead color');
        }
    }
    const project = buildEditorProject({ palettes: draft.activePalettes, boardOption: board,
        boardWidth: draft.boardWidth, boardHeight: draft.boardHeight, matchingId: draft.matchingId,
        ditheringId: draft.ditheringId, imageAdjustments: draft.imageAdjustments,
        rendererSettings: draft.rendererSettings, useSymbols: draft.useSymbols });
    project.srcWidth = width;
    project.srcHeight = height;
    return { draft, prepared: { project, pixels, width, height } };
}

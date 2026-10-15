import type { Palette } from '../core/model/palette/palette.model';
import { normalizeSourceCrop } from '../core/utils/image-crop';
import { getBoardOption } from './config';
import { decodeEditorPatternDraft, encodeEditorProjectPattern, parseEditorProject, serializeEditorProject, type EditorDraft } from './draft';
import { clonePalettes } from './palette-state';
import { buildEditorProject } from './project';
import { normalizeSourceBackground } from './source-background';
import { prepareSourceImagePattern, type PreparedSourceImage } from './source-image-transaction';

type PreparationOptions = {
    loadPalette: (id: string, signal: AbortSignal) => Promise<Palette>;
    prepareImage?: typeof prepareSourceImagePattern;
    createBlankImage?: () => HTMLImageElement;
};

export type PreparedEditorProjectFile = {
    draft: EditorDraft;
    prepared: PreparedSourceImage;
    sourceKey: string | null;
};

function checkAbort(signal: AbortSignal): void {
    if (signal.aborted) throw new DOMException('Project preparation cancelled.', 'AbortError');
}
function invalid(): never { throw new Error('Invalid bead-pattern project.'); }

/** Same accepted-source identity as Editor.sourceProcessingKey, including its
 * optional-field omissions and property order. This is not a new wire format. */
export function getEditorProjectSourceKey(draft: EditorDraft): string | null {
    if (draft.sourceMode === 'blank' || !draft.imageSrc) return null;
    const colorLimit = draft.maxBeadColors ?? null, background = draft.sourceBackground ?? null;
    return JSON.stringify({
        boardId: draft.boardId, boardWidth: draft.boardWidth, boardHeight: draft.boardHeight,
        matchingId: draft.matchingId, ditheringId: draft.ditheringId, imageAdjustments: draft.imageAdjustments,
        center: draft.rendererSettings.center, fit: draft.rendererSettings.fit,
        sourceCrop: normalizeSourceCrop(draft.sourceCrop),
        ...(colorLimit !== null ? { maxBeadColors: colorLimit } : {}),
        ...(background !== null ? { sourceBackground: normalizeSourceBackground(background) } : {}),
    });
}

/** Prepare a detached, fully readable replacement. No live canvas, history,
 * React state, persistent draft or storage is touched by this function. */
export async function prepareEditorProjectFile(
    input: EditorDraft,
    signal: AbortSignal,
    options: PreparationOptions,
): Promise<PreparedEditorProjectFile> {
    checkAbort(signal);
    // Reuse v1 validation and obtain owned plain data without changing the
    // existing parser/serializer or imposing an additional project-file cap.
    const draft = parseEditorProject(serializeEditorProject(input));
    if (!draft) invalid();
    const board = getBoardOption(draft.boardId);
    if (!board) invalid();
    const width = board.beadsPerRow * draft.boardWidth, height = board.beadsPerRow * draft.boardHeight;
    const cells = draft.editedPattern ? decodeEditorPatternDraft(draft.editedPattern) : null;
    if (draft.editedPattern && (!cells || draft.editedPattern.width !== width || draft.editedPattern.height !== height)) invalid();

    // An explicit blank file carrying an image is contradictory. Only the old
    // sourceMode-less, image-less saved-cell case becomes a blank document.
    if (draft.sourceMode === 'blank' && draft.imageSrc !== null) invalid();
    const hasImage = typeof draft.imageSrc === 'string' && draft.imageSrc.length > 0;
    if (draft.sourceMode === 'image' && !hasImage) invalid();
    const mode = draft.sourceMode ?? (hasImage ? 'image' : cells ? 'blank' : null);
    if (!mode) invalid();
    draft.sourceMode = mode;
    if (mode === 'blank') draft.imageSrc = null;

    if (draft.activePalettes.length === 0) {
        const loaded: Palette[] = [];
        for (const id of draft.selectedPaletteIds) {
            checkAbort(signal);
            try { loaded.push(await options.loadPalette(id, signal)); }
            finally { checkAbort(signal); }
        }
        const checked = parseEditorProject(serializeEditorProject({ ...draft, activePalettes: loaded }));
        if (!checked) invalid();
        draft.activePalettes = clonePalettes(checked.activePalettes);
    } else draft.activePalettes = clonePalettes(draft.activePalettes);
    checkAbort(signal);

    const project = buildEditorProject({
        palettes: draft.activePalettes, boardOption: board, boardWidth: draft.boardWidth, boardHeight: draft.boardHeight,
        matchingId: draft.matchingId, ditheringId: draft.ditheringId, imageAdjustments: draft.imageAdjustments,
        rendererSettings: draft.rendererSettings, useSymbols: draft.useSymbols,
    });
    let prepared: PreparedSourceImage;
    if (mode === 'image') {
        try {
            prepared = await (options.prepareImage ?? prepareSourceImagePattern)({
                src: draft.imageSrc!, fileName: draft.fileName, crop: normalizeSourceCrop(draft.sourceCrop),
                project, width, height, matchingId: draft.matchingId,
                maxBeadColors: draft.maxBeadColors ?? null, background: normalizeSourceBackground(draft.sourceBackground),
                restoredPixels: cells?.slice() ?? null,
            }, signal);
        } finally { checkAbort(signal); }
        if (prepared.project !== project || prepared.width !== width || prepared.height !== height ||
            !(prepared.pixels instanceof Uint8ClampedArray) || prepared.pixels.length !== width * height * 4) invalid();
        // Saved cells are authoritative; source decoding is still mandatory,
        // but neither that decode nor conversion may replace a saved RGBA cell.
        prepared = { ...prepared, pixels: (cells ?? prepared.pixels).slice() };
    } else {
        const placeholder = (options.createBlankImage ?? (() => new window.Image()))();
        project.image = { name: draft.fileName || 'blank-pattern', src: placeholder };
        project.srcWidth = width;
        project.srcHeight = height;
        prepared = { project, pixels: cells?.slice() ?? new Uint8ClampedArray(width * height * 4), width, height };
    }
    checkAbort(signal);
    // The accepted draft and installed grid must describe the same complete
    // document, including legacy files that originally contained only a source.
    draft.editedPattern = encodeEditorProjectPattern(prepared.pixels, width, height);
    return { draft, prepared, sourceKey: getEditorProjectSourceKey(draft) };
}

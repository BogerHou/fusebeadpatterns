import { getPaletteOption, type BoardOptionId } from './config';

export const DEFAULT_EDITOR_PALETTE_ID = 'perler';

/** Seed a fresh workspace once. A recovered project's settings are authoritative. */
export function getInitialEditorConfiguration(initialPaletteId = DEFAULT_EDITOR_PALETTE_ID): {
    paletteId: string;
    boardId: BoardOptionId;
} {
    const option = getPaletteOption(initialPaletteId) ?? getPaletteOption(DEFAULT_EDITOR_PALETTE_ID)!;
    return { paletteId: option.id, boardId: option.boardId };
}

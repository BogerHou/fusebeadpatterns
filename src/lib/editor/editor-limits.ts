import { BOARDS } from '../core/model/board/board.model';

// Shared limits have no persistence/quantization dependency.
export const EDITOR_DRAFT_BOARD_COUNT_MAX = 20;
export const EDITOR_PROJECT_PATTERN_DIMENSION_MAX =
    EDITOR_DRAFT_BOARD_COUNT_MAX *
    Math.max(...Object.values(BOARDS).map(board => board.nbBeadPerRow));
export const EDITOR_PROJECT_PATTERN_MAX_BYTES =
    EDITOR_PROJECT_PATTERN_DIMENSION_MAX ** 2 * 4;

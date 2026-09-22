import { BoardOptionId } from './config';
import { BOARDS } from '../core/model/board/board.model';
import { Palette } from '@/lib/core/model/palette/palette.model';

export const EDITOR_DRAFT_STORAGE_KEY = 'bead-pattern-editor-draft-v1';
export const EDITOR_DRAFT_PATTERN_MAX_BYTES = 1_500_000;
export const EDITOR_DRAFT_BOARD_COUNT_MAX = 20;
export const EDITOR_PROJECT_PATTERN_DIMENSION_MAX =
    EDITOR_DRAFT_BOARD_COUNT_MAX *
    Math.max(...Object.values(BOARDS).map((board) => board.nbBeadPerRow));
export const EDITOR_PROJECT_PATTERN_MAX_BYTES =
    EDITOR_PROJECT_PATTERN_DIMENSION_MAX ** 2 * 4;
export const EDITOR_PROJECT_FILE_TYPE = 'bead-pattern-project-v1';
export const EDITOR_PROJECT_FILE_EXTENSION = '.bead-pattern.json';

export type EditorPatternDraft = {
    width: number;
    height: number;
    byteLength: number;
    data: string;
};

export type EditorDraft = {
    version: 1;
    sourceMode?: 'image' | 'blank';
    imageSrc: string | null;
    fileName: string;
    selectedPaletteIds: string[];
    activePalettes: Palette[];
    boardId: BoardOptionId;
    boardWidth: number;
    boardHeight: number;
    matchingId: string;
    ditheringId: string;
    useSymbols: boolean;
    exportFormatId: string;
    imageAdjustments: {
        brightness: number;
        contrast: number;
        saturation: number;
        grayscale: number;
    };
    rendererSettings: {
        center: boolean;
        fit: boolean;
        showGrid: boolean;
    };
    showReference?: boolean;
    referenceOpacity?: number;
    previewZoom: number;
    editedPattern?: EditorPatternDraft | null;
};

export type EditorProjectFile = {
    type: typeof EDITOR_PROJECT_FILE_TYPE;
    version: 1;
    savedAt: string;
    draft: EditorDraft;
};

export function createEditorDraft(
    input: Omit<EditorDraft, 'version'>
): EditorDraft {
    return {
        version: 1,
        ...input,
    };
}

function isValidPatternDimension(value: number): boolean {
    return (
        Number.isInteger(value) &&
        value > 0 &&
        value <= EDITOR_PROJECT_PATTERN_DIMENSION_MAX
    );
}

function getExpectedPatternByteLength(width: number, height: number): number {
    return width * height * 4;
}

function encodeBytesToBase64(data: Uint8ClampedArray): string {
    const chunkSize = 0x8000;
    let binary = '';

    for (let index = 0; index < data.length; index += chunkSize) {
        let chunk = '';
        const end = Math.min(index + chunkSize, data.length);

        for (let cursor = index; cursor < end; cursor += 1) {
            chunk += String.fromCharCode(data[cursor]);
        }

        binary += chunk;
    }

    return btoa(binary);
}

function decodeBase64ToBytes(data: string): Uint8ClampedArray {
    const binary = atob(data);
    const bytes = new Uint8ClampedArray(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isValidBoardCount(value: unknown): value is number {
    return isPositiveInteger(value) && value <= EDITOR_DRAFT_BOARD_COUNT_MAX;
}

function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

function isBoardOptionId(value: unknown): value is BoardOptionId {
    return value === 'midi' || value === 'mini' || value === 'mini_artkal';
}

function isPaletteColor(value: unknown): value is Palette['entries'][number]['color'] {
    if (!isRecord(value)) {
        return false;
    }

    return (
        isNumber(value.r) &&
        isNumber(value.g) &&
        isNumber(value.b) &&
        isNumber(value.a)
    );
}

function isPaletteEntry(value: unknown): value is Palette['entries'][number] {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.name === 'string' &&
        typeof value.ref === 'string' &&
        typeof value.symbol === 'string' &&
        typeof value.prefix === 'string' &&
        isBoolean(value.enabled) &&
        isPaletteColor(value.color)
    );
}

function isPalette(value: unknown): value is Palette {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.name === 'string' &&
        Array.isArray(value.entries) &&
        value.entries.every(isPaletteEntry)
    );
}

function isEditorPatternDraft(value: unknown): value is EditorPatternDraft {
    if (!isRecord(value)) {
        return false;
    }

    return (
        isNumber(value.width) &&
        isNumber(value.height) &&
        isNumber(value.byteLength) &&
        typeof value.data === 'string' &&
        decodeEditorPatternDraft(value as EditorPatternDraft) !== null
    );
}

function isImageAdjustments(value: unknown): value is EditorDraft['imageAdjustments'] {
    if (!isRecord(value)) {
        return false;
    }

    return (
        isNumber(value.brightness) &&
        isNumber(value.contrast) &&
        isNumber(value.saturation) &&
        isNumber(value.grayscale)
    );
}

function isRendererSettings(value: unknown): value is EditorDraft['rendererSettings'] {
    if (!isRecord(value)) {
        return false;
    }

    return (
        isBoolean(value.center) &&
        isBoolean(value.fit) &&
        isBoolean(value.showGrid)
    );
}

function isEditorDraft(value: unknown): value is EditorDraft {
    if (!isRecord(value)) {
        return false;
    }

    const sourceMode = value.sourceMode;
    const editedPattern = value.editedPattern;

    return (
        value.version === 1 &&
        (sourceMode === undefined ||
            sourceMode === 'image' ||
            sourceMode === 'blank') &&
        (typeof value.imageSrc === 'string' || value.imageSrc === null) &&
        typeof value.fileName === 'string' &&
        isStringArray(value.selectedPaletteIds) &&
        value.selectedPaletteIds.length > 0 &&
        Array.isArray(value.activePalettes) &&
        value.activePalettes.every(isPalette) &&
        isBoardOptionId(value.boardId) &&
        isValidBoardCount(value.boardWidth) &&
        isValidBoardCount(value.boardHeight) &&
        typeof value.matchingId === 'string' &&
        typeof value.ditheringId === 'string' &&
        isBoolean(value.useSymbols) &&
        typeof value.exportFormatId === 'string' &&
        isImageAdjustments(value.imageAdjustments) &&
        isRendererSettings(value.rendererSettings) &&
        (value.showReference === undefined || isBoolean(value.showReference)) &&
        (value.referenceOpacity === undefined ||
            isNumber(value.referenceOpacity)) &&
        isNumber(value.previewZoom) &&
        (editedPattern === undefined ||
            editedPattern === null ||
            isEditorPatternDraft(editedPattern))
    );
}

export function encodeEditorPatternDraft(
    data: Uint8ClampedArray | null,
    width: number,
    height: number,
    maxBytes = EDITOR_DRAFT_PATTERN_MAX_BYTES
): EditorPatternDraft | null {
    if (!data || !isValidPatternDimension(width) || !isValidPatternDimension(height)) {
        return null;
    }

    const expectedByteLength = getExpectedPatternByteLength(width, height);

    if (data.length !== expectedByteLength || data.length > maxBytes) {
        return null;
    }

    return {
        width,
        height,
        byteLength: data.length,
        data: encodeBytesToBase64(data),
    };
}

export function encodeEditorProjectPattern(
    data: Uint8ClampedArray,
    width: number,
    height: number
): EditorPatternDraft {
    const pattern = encodeEditorPatternDraft(
        data,
        width,
        height,
        EDITOR_PROJECT_PATTERN_MAX_BYTES
    );

    if (!pattern) {
        throw new Error('Cannot save a project with invalid pattern dimensions or pixel data.');
    }

    return pattern;
}

export function decodeEditorPatternDraft(
    draft: EditorPatternDraft | null | undefined
): Uint8ClampedArray | null {
    if (
        !draft ||
        !isValidPatternDimension(draft.width) ||
        !isValidPatternDimension(draft.height) ||
        !Number.isInteger(draft.byteLength) ||
        draft.byteLength <= 0 ||
        typeof draft.data !== 'string'
    ) {
        return null;
    }

    const expectedByteLength = getExpectedPatternByteLength(
        draft.width,
        draft.height
    );

    if (
        draft.byteLength !== expectedByteLength ||
        draft.data.length > Math.ceil(expectedByteLength / 3) * 4
    ) {
        return null;
    }

    try {
        const bytes = decodeBase64ToBytes(draft.data);

        if (bytes.length !== expectedByteLength) {
            return null;
        }

        return bytes;
    } catch {
        return null;
    }
}

export function createEditorProjectFile(
    draft: EditorDraft,
    savedAt = new Date().toISOString()
): EditorProjectFile {
    return {
        type: EDITOR_PROJECT_FILE_TYPE,
        version: 1,
        savedAt,
        draft,
    };
}

export function serializeEditorProject(draft: EditorDraft): string {
    return JSON.stringify(createEditorProjectFile(draft), null, 2);
}

export function parseEditorProject(rawProject: string): EditorDraft | null {
    try {
        const parsedProject = JSON.parse(rawProject) as unknown;

        if (!isRecord(parsedProject)) {
            return null;
        }

        if (
            parsedProject.type !== EDITOR_PROJECT_FILE_TYPE ||
            parsedProject.version !== 1 ||
            !isEditorDraft(parsedProject.draft)
        ) {
            return null;
        }

        return parsedProject.draft;
    } catch {
        return null;
    }
}

export function loadEditorDraft(): EditorDraft | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const rawDraft = window.sessionStorage.getItem(
            EDITOR_DRAFT_STORAGE_KEY
        );

        if (!rawDraft) {
            return null;
        }

        const parsedDraft = JSON.parse(rawDraft) as unknown;

        if (!isEditorDraft(parsedDraft)) {
            return null;
        }

        return parsedDraft;
    } catch {
        return null;
    }
}

export function saveEditorDraft(draft: EditorDraft): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        window.sessionStorage.setItem(
            EDITOR_DRAFT_STORAGE_KEY,
            JSON.stringify(draft)
        );
        return true;
    } catch {
        return false;
    }
}

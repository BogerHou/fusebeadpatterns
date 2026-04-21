import { BoardOptionId } from './config';
import { Palette } from '@/lib/core/model/palette/palette.model';

export const EDITOR_DRAFT_STORAGE_KEY = 'bead-pattern-editor-draft-v1';
export const EDITOR_DRAFT_PATTERN_MAX_BYTES = 1_500_000;

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

export function createEditorDraft(
    input: Omit<EditorDraft, 'version'>
): EditorDraft {
    return {
        version: 1,
        ...input,
    };
}

function isValidPatternDimension(value: number): boolean {
    return Number.isInteger(value) && value > 0;
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

    if (draft.byteLength !== expectedByteLength) {
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

        const parsedDraft = JSON.parse(rawDraft) as EditorDraft;

        if (parsedDraft?.version !== 1) {
            return null;
        }

        return parsedDraft;
    } catch {
        return null;
    }
}

export function saveEditorDraft(draft: EditorDraft): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.setItem(
        EDITOR_DRAFT_STORAGE_KEY,
        JSON.stringify(draft)
    );
}

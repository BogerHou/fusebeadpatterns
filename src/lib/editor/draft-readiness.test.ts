import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    createEditorDraft,
    decodeEditorPatternDraft,
    EDITOR_DRAFT_PATTERN_MAX_BYTES,
    EDITOR_DRAFT_STORAGE_KEY,
    encodeEditorPatternDraft,
    saveEditorDraft,
} from './draft';
import { isEditorPatternSnapshotReady } from './draft-readiness';

afterEach(() => vi.unstubAllGlobals());

describe('editor automatic snapshot readiness', () => {
    it('waits for rendered dimensions after blank initialization instead of persisting an incomplete draft', () => {
        const values = new Map([[EDITOR_DRAFT_STORAGE_KEY, 'previous complete recovery draft']]);
        const setItem = vi.fn((key: string, value: string) => values.set(key, value));
        vi.stubGlobal('window', { sessionStorage: { setItem } });
        const pixels = new Uint8ClampedArray(29 * 58 * 4);
        pixels.set([42, 100, 180, 255], pixels.length - 4);
        const actualSize = { width: 29, height: 58 };

        const saveFrame = (renderedSize: { width: number; height: number }) => {
            if (!isEditorPatternSnapshotReady(pixels, actualSize, renderedSize)) return;
            saveEditorDraft(createEditorDraft({
                sourceMode: 'blank', imageSrc: null, fileName: 'restored-rectangle',
                selectedPaletteIds: ['perler'], activePalettes: [],
                boardId: 'midi', boardWidth: 1, boardHeight: 2,
                matchingId: 'euclidean', ditheringId: 'none', useSymbols: false,
                exportFormatId: 'pdf',
                imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
                rendererSettings: { center: true, fit: true, showGrid: false },
                previewZoom: 1,
                editedPattern: encodeEditorPatternDraft(pixels, renderedSize.width, renderedSize.height),
            }));
        };

        saveFrame({ width: 1, height: 1 });
        saveFrame({ width: 58, height: 29 });
        expect(setItem).not.toHaveBeenCalled();
        expect(values.get(EDITOR_DRAFT_STORAGE_KEY)).toBe('previous complete recovery draft');

        saveFrame(actualSize);
        expect(setItem).toHaveBeenCalledTimes(1);
        const recovered = JSON.parse(values.get(EDITOR_DRAFT_STORAGE_KEY)!);
        expect(recovered.editedPattern).toMatchObject({ width: 29, height: 58 });
        expect(Buffer.from(decodeEditorPatternDraft(recovered.editedPattern)!)).toEqual(Buffer.from(pixels));
    });

    it('rejects missing canvas/pixels, incomplete RGBA and invalid dimensions', () => {
        const size = { width: 2, height: 1 };
        expect(isEditorPatternSnapshotReady(null, size, size)).toBe(false);
        expect(isEditorPatternSnapshotReady(new Uint8ClampedArray(8), null, size)).toBe(false);
        expect(isEditorPatternSnapshotReady(new Uint8ClampedArray(7), size, size)).toBe(false);
        expect(isEditorPatternSnapshotReady(new Uint8ClampedArray(8), { width: 1.5, height: 1 }, size)).toBe(false);
        expect(isEditorPatternSnapshotReady(new Uint8ClampedArray(0), { width: 0, height: 1 }, { width: 0, height: 1 })).toBe(false);
        expect(isEditorPatternSnapshotReady(new Uint8ClampedArray(8), size, size)).toBe(true);
    });

    it('allows a geometrically ready oversized pattern to reach the existing size warning instead of treating it as pending', () => {
        const size = { width: 700, height: 700 };
        const pixels = new Uint8ClampedArray(size.width * size.height * 4);
        expect(pixels.byteLength).toBeGreaterThan(EDITOR_DRAFT_PATTERN_MAX_BYTES);
        expect(isEditorPatternSnapshotReady(pixels, size, size)).toBe(true);
        expect(encodeEditorPatternDraft(pixels, size.width, size.height)).toBeNull();
    });
});

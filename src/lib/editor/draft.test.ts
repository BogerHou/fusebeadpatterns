import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { getBoardOption, getPaletteOption, parsePaletteCsv } from './config';
import { mergePaletteEnabledState, togglePaletteEntry } from './palette-state';

import {
    createEditorDraft,
    decodeEditorPatternDraft,
    EDITOR_DRAFT_PATTERN_MAX_BYTES,
    EDITOR_DRAFT_STORAGE_KEY,
    EDITOR_PROJECT_FILE_TYPE,
    EDITOR_PROJECT_PATTERN_DIMENSION_MAX,
    encodeEditorPatternDraft,
    encodeEditorProjectPattern,
    parseEditorProject,
    saveEditorDraft,
    serializeEditorProject,
} from './draft';

function createTestDraft() {
    return createEditorDraft({
        sourceMode: 'blank',
        imageSrc: null,
        fileName: 'blank-pattern',
        selectedPaletteIds: ['perler'],
        activePalettes: [],
        boardId: 'midi',
        boardWidth: 1,
        boardHeight: 1,
        matchingId: 'euclidean',
        ditheringId: 'none',
        useSymbols: false,
        exportFormatId: 'pdf',
        imageAdjustments: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            grayscale: 0,
        },
        rendererSettings: {
            center: true,
            fit: true,
            showGrid: false,
        },
        showReference: true,
        referenceOpacity: 100,
        previewZoom: 1,
        editedPattern: null,
    });
}

describe('editor draft pattern helpers', () => {
    it('creates versioned editor drafts in one place', () => {
        const draft = createTestDraft();

        expect(draft.version).toBe(1);
        expect(draft.sourceMode).toBe('blank');
    });

    it('round trips a saved bead pattern with dimensions', () => {
        const pattern = new Uint8ClampedArray([
            10, 20, 30, 255, 40, 50, 60, 255,
        ]);

        const draft = encodeEditorPatternDraft(pattern, 2, 1);
        const restored = decodeEditorPatternDraft(draft);

        expect(draft).toMatchObject({
            width: 2,
            height: 1,
            byteLength: 8,
        });
        expect(Array.from(restored ?? [])).toEqual(Array.from(pattern));
    });

    it('does not save oversized pattern data to session storage', () => {
        const pattern = new Uint8ClampedArray(12);

        expect(encodeEditorPatternDraft(pattern, 3, 1, 8)).toBeNull();
    });

    it('rejects corrupted or mismatched pattern drafts', () => {
        expect(
            decodeEditorPatternDraft({
                width: 2,
                height: 1,
                byteLength: 8,
                data: 'not-base64',
            })
        ).toBeNull();

        expect(
            decodeEditorPatternDraft({
                width: 2,
                height: 1,
                byteLength: 4,
                data: btoa('abcd'),
            })
        ).toBeNull();
    });
});

describe('editor project file helpers', () => {
    it('reopens a legacy Artkal S project without changing pixels, disabled colors or its 50 × 50 board', async () => {
        const option = getPaletteOption('artkal_s')!;
        const csv = await readFile(path.join(process.cwd(), 'public', 'palettes', option.file), 'utf8');
        const originalPalette = parsePaletteCsv(csv, option);
        expect(originalPalette.name).toBe('Artkal S Mini');
        const activePalettes = togglePaletteEntry([originalPalette], 'Artkal S Mini', 'S03', false);
        const pixels = new Uint8ClampedArray(50 * 50 * 4);
        for (const [index, ref] of ['S01', 'S02', 'S05', 'S08'].entries()) {
            const { r, g, b, a } = originalPalette.entries.find((entry) => entry.ref === ref)!.color;
            pixels.set([r, g, b, a], index * 4);
        }
        const legacyDraft = {
            ...createTestDraft(),
            selectedPaletteIds: ['artkal_s'],
            activePalettes,
            boardId: 'mini_artkal' as const,
            editedPattern: encodeEditorProjectPattern(pixels, 50, 50),
        };
        const legacyFile = JSON.stringify({
            type: EDITOR_PROJECT_FILE_TYPE,
            version: 1,
            savedAt: '2026-01-01T00:00:00.000Z',
            draft: legacyDraft,
        });
        const restored = parseEditorProject(legacyFile)!;
        expect(restored).toEqual(legacyDraft);
        expect(restored.activePalettes[0].name).toBe('Artkal S Mini');
        expect(getBoardOption(restored.boardId)?.value.nbBeadPerRow).toBe(50);
        expect([restored.boardWidth, restored.boardHeight]).toEqual([1, 1]);
        expect(decodeEditorPatternDraft(restored.editedPattern)).toEqual(pixels);

        const reloaded = mergePaletteEnabledState([parsePaletteCsv(csv, option)], restored.activePalettes);
        expect(JSON.parse(JSON.stringify(reloaded))).toEqual(restored.activePalettes);
        expect(reloaded[0].entries.find(({ ref }) => ref === 'S03')?.enabled).toBe(false);
        expect(reloaded[0].entries.map(({ ref, color, prefix }) => ({ ref, color, prefix })))
            .toEqual(originalPalette.entries.map(({ ref, color, prefix }) => ({ ref, color, prefix })));

        const savedAgain = serializeEditorProject({ ...restored, activePalettes: reloaded });
        expect(savedAgain).not.toContain('displayLabel');
        expect(savedAgain).not.toContain('Artkal S (5 mm)');
        expect(parseEditorProject(savedAgain)).toEqual(restored);
    });

    it('preserves every pixel in a maximum-size project beyond the session draft limit', () => {
        const width = EDITOR_PROJECT_PATTERN_DIMENSION_MAX;
        const height = EDITOR_PROJECT_PATTERN_DIMENSION_MAX;
        const pattern = new Uint8ClampedArray(width * height * 4);

        for (let index = 0; index < pattern.length; index += 1) {
            pattern[index] = index % 251;
        }

        expect(pattern.byteLength).toBeGreaterThan(EDITOR_DRAFT_PATTERN_MAX_BYTES);
        expect(encodeEditorPatternDraft(pattern, width, height)).toBeNull();

        const draft = {
            ...createTestDraft(),
            boardId: 'mini' as const,
            boardWidth: 20,
            boardHeight: 20,
            editedPattern: encodeEditorProjectPattern(pattern, width, height),
        };
        const restoredDraft = parseEditorProject(serializeEditorProject(draft));
        const restoredPattern = decodeEditorPatternDraft(restoredDraft?.editedPattern);

        expect(restoredDraft?.editedPattern).toMatchObject({
            width,
            height,
            byteLength: pattern.length,
        });
        expect(restoredPattern).not.toBeNull();
        expect(Buffer.compare(Buffer.from(restoredPattern!), Buffer.from(pattern))).toBe(0);
    });

    it.each([
        [0, 1],
        [-1, 1],
        [1.5, 1],
        [Number.NaN, 1],
        [1, Number.POSITIVE_INFINITY],
        [EDITOR_PROJECT_PATTERN_DIMENSION_MAX + 1, 1],
        [1, EDITOR_PROJECT_PATTERN_DIMENSION_MAX + 1],
    ])('rejects invalid project dimensions %s × %s instead of dropping pixels', (width, height) => {
        expect(() => encodeEditorProjectPattern(new Uint8ClampedArray(4), width, height)).toThrow();
        expect(decodeEditorPatternDraft({
            width,
            height,
            byteLength: 4,
            data: btoa('abcd'),
        })).toBeNull();
    });

    it('rejects project pixel data that does not match its dimensions', () => {
        expect(() => encodeEditorProjectPattern(new Uint8ClampedArray(4), 2, 1)).toThrow();
    });

    it('round trips a project JSON file with a file type marker', () => {
        const pattern = new Uint8ClampedArray([
            10, 20, 30, 255, 40, 50, 60, 255,
        ]);
        const draft = {
            ...createTestDraft(),
            editedPattern: encodeEditorPatternDraft(pattern, 2, 1),
        };

        const serializedProject = serializeEditorProject(draft);
        const parsedProject = JSON.parse(serializedProject) as {
            type: string;
            version: number;
        };

        expect(parsedProject.type).toBe(EDITOR_PROJECT_FILE_TYPE);
        expect(parsedProject.version).toBe(1);
        expect(parseEditorProject(serializedProject)).toEqual(draft);
    });

    it('rejects bad project JSON files', () => {
        const draft = createTestDraft();

        expect(parseEditorProject('{bad json')).toBeNull();
        expect(parseEditorProject(JSON.stringify(draft))).toBeNull();
        expect(
            parseEditorProject(
                JSON.stringify({
                    type: 'wrong-project-type',
                    version: 1,
                    draft,
                })
            )
        ).toBeNull();
        expect(
            parseEditorProject(
                JSON.stringify({
                    type: EDITOR_PROJECT_FILE_TYPE,
                    version: 1,
                    draft: {
                        ...draft,
                        boardWidth: 0,
                    },
                })
            )
        ).toBeNull();
        expect(
            parseEditorProject(
                JSON.stringify({
                    type: EDITOR_PROJECT_FILE_TYPE,
                    version: 1,
                    draft: {
                        ...draft,
                        boardWidth: 21,
                    },
                })
            )
        ).toBeNull();
    });
});

describe('editor draft storage', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reports successful storage writes', () => {
        const setItem = vi.fn();
        const draft = createTestDraft();
        vi.stubGlobal('window', { sessionStorage: { setItem } });

        expect(saveEditorDraft(draft)).toBe(true);
        expect(setItem).toHaveBeenCalledWith(EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    });

    it('reports a storage quota failure without throwing', () => {
        vi.stubGlobal('window', {
            sessionStorage: {
                setItem: vi.fn(() => {
                    throw new DOMException('Storage is full.', 'QuotaExceededError');
                }),
            },
        });

        expect(saveEditorDraft(createTestDraft())).toBe(false);
    });

    it('reports blocked access to session storage without throwing', () => {
        vi.stubGlobal('window', {
            get sessionStorage() {
                throw new DOMException('Storage is blocked.', 'SecurityError');
            },
        });

        expect(saveEditorDraft(createTestDraft())).toBe(false);
    });

    it('reports unavailable browser storage during server rendering', () => {
        vi.stubGlobal('window', undefined);

        expect(saveEditorDraft(createTestDraft())).toBe(false);
    });
});

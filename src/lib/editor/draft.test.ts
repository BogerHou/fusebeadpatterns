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
    loadEditorDraft,
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
    it('keeps optional automatic bead limits without reinterpreting saved pixels or changing old missing fields', () => {
        const pixels = new Uint8ClampedArray([10, 20, 30, 0, 50, 60, 70, 128, 90, 100, 110, 255]);
        const legacy = { ...createTestDraft(), editedPattern: encodeEditorProjectPattern(pixels, 3, 1) };
        const old = parseEditorProject(serializeEditorProject(legacy))!;
        expect(old).toEqual(legacy);
        expect(Object.hasOwn(old, 'maxBeadColors')).toBe(false);
        for (const cap of [null, 1, 12, 512]) {
            const limited = { ...legacy, maxBeadColors: cap };
            const restored = parseEditorProject(serializeEditorProject(limited))!;
            expect(restored).toEqual(limited);
            expect(decodeEditorPatternDraft(restored.editedPattern)).toEqual(pixels);
        }
        for (const cap of [0, -1, 1.5, 513, '12', true, {}, []]) {
            const invalid = { ...legacy, maxBeadColors: cap };
            expect(parseEditorProject(JSON.stringify({ type: EDITOR_PROJECT_FILE_TYPE, version: 1, draft: invalid }))).toBeNull();
            vi.stubGlobal('window', { sessionStorage: { getItem: () => JSON.stringify(invalid) } });
            expect(loadEditorDraft()).toBeNull();
        }
    });
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

    it('saves and restores an original-image crop with the exact source and edited RGBA', () => {
        const values = new Map<string, string>();
        vi.stubGlobal('window', { sessionStorage: {
            setItem: (key: string, value: string) => values.set(key, value),
            getItem: (key: string) => values.get(key) ?? null,
        } });
        const pixels = new Uint8ClampedArray([1, 2, 3, 0, 9, 8, 7, 255]);
        const draft = createEditorDraft({
            ...createTestDraft(), sourceMode: 'image', imageSrc: 'data:image/png;base64,b3JpZ2luYWw=',
            sourceCrop: { sourceWidth: 120, sourceHeight: 80, x: 17, y: 9, width: 60, height: 30 },
            editedPattern: encodeEditorProjectPattern(pixels, 2, 1),
        });
        expect(saveEditorDraft(draft)).toBe(true);
        expect(loadEditorDraft()).toEqual(draft);
        const restored = parseEditorProject(serializeEditorProject(draft))!;
        expect(restored).toEqual(draft);
        expect(decodeEditorPatternDraft(restored.editedPattern)).toEqual(pixels);
        expect(restored.sourceCrop).not.toBe(draft.sourceCrop);
        restored.sourceCrop!.x = 0;
        expect(loadEditorDraft()!.sourceCrop!.x).toBe(17);
        expect(draft.sourceCrop!.x).toBe(17);
    });

    it('rejects invalid crops in both project JSON and stored drafts without fallback to a different image area', () => {
        const source = { sourceWidth: 120, sourceHeight: 80, x: 17, y: 9, width: 60, height: 30 };
        const draft = { ...createTestDraft(), sourceMode: 'image' as const, imageSrc: 'data:image/png;base64,b3JpZ2luYWw=' };
        const patches = [
            { sourceCrop: { ...source, x: -1 } }, { sourceCrop: { ...source, x: 0.5 } },
            { sourceCrop: { ...source, width: 104 } }, { sourceCrop: { ...source, height: 72 } },
            { sourceCrop: { ...source, sourceWidth: Number.MAX_SAFE_INTEGER + 1 } },
            { sourceCrop: { ...source, width: null } }, { sourceCrop: { ...source, height: '30' } },
            { sourceCrop: { ...source, extra: true } }, { sourceCrop: {} }, { sourceCrop: false },
            { sourceCrop: source, sourceMode: 'blank' }, { sourceCrop: source, imageSrc: null },
            { sourceCrop: source, imageSrc: '' },
        ];
        for (const patch of patches) {
            const candidate = { ...draft, ...patch };
            const rawDraft = JSON.stringify(candidate);
            vi.stubGlobal('window', { sessionStorage: { getItem: () => rawDraft } });
            expect(loadEditorDraft()).toBeNull();
            expect(parseEditorProject(JSON.stringify({ type: EDITOR_PROJECT_FILE_TYPE, version: 1, draft: candidate }))).toBeNull();
        }
    });

    it('preserves legacy missing fields and accepts explicit null when clearing a crop', () => {
        const legacy = createTestDraft();
        const restored = parseEditorProject(serializeEditorProject(legacy))!;
        expect(restored).toEqual(legacy);
        expect(Object.hasOwn(restored, 'sourceCrop')).toBe(false);
        expect(parseEditorProject(serializeEditorProject({ ...legacy, sourceCrop: null }))).toEqual({ ...legacy, sourceCrop: null });
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

import { describe, expect, it } from 'vitest';

import {
    createEditorDraft,
    decodeEditorPatternDraft,
    EDITOR_PROJECT_FILE_TYPE,
    encodeEditorPatternDraft,
    parseEditorProject,
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

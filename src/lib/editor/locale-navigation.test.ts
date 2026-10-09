import { describe, expect, it, vi } from 'vitest';
import { createEditorDraft, decodeEditorPatternDraft, EDITOR_DRAFT_STORAGE_KEY, encodeEditorProjectPattern, type EditorDraft } from './draft';
import { clearRestoredPatternQuery, consumeEditorLocaleDraft, EDITOR_LOCALE_RESTORE_KEY, getEditorLocaleRestoreHref, saveEditorLocaleDraft } from './locale-navigation';

function storage() {
    const values = new Map<string, string>();
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
        removeItem: (key: string) => { values.delete(key); },
    };
}

function editedDraft() {
    return createEditorDraft({
        sourceMode: 'image',
        imageSrc: 'data:image/png;base64,c291cmNl',
        fileName: 'edited-hama-project',
        selectedPaletteIds: ['hama', 'perler'],
        activePalettes: [],
        boardId: 'midi', boardWidth: 1, boardHeight: 1,
        matchingId: 'delta_e_cie2000', ditheringId: 'none',
        useSymbols: true, exportFormatId: 'pdf', pdfScaleMode: 'fit-page',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: true },
        previewZoom: 2,
        editedPattern: encodeEditorProjectPattern(new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]), 2, 1),
    });
}

describe('editor language navigation recovery', () => {
    it.each(['/de/editor?pattern=pokemon-pikachu-gen5', '/fr', '/ja?pattern=pokemon-pikachu-gen5'])('preserves original image, manual edits and settings once at %s', (href) => {
        const session = storage();
        const draft = editedDraft();
        expect(saveEditorLocaleDraft(draft, href, session, 1_000)).toBe(true);
        const recovered = consumeEditorLocaleDraft(`https://fusebeadpatterns.art${href}`, session, 1_001);
        expect(recovered?.draft).toEqual(draft);
        expect(decodeEditorPatternDraft(recovered?.draft.editedPattern)).toEqual(new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]));
        expect(consumeEditorLocaleDraft(href, session, 1_002)).toBeNull();
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull();
        expect(session.getItem(EDITOR_DRAFT_STORAGE_KEY)).not.toBeNull();
    });

    it('does not override an ordinary first-time library request or a different destination', () => {
        const session = storage();
        expect(consumeEditorLocaleDraft('/ja?pattern=pokemon-pikachu-gen5', session, 1_000)).toBeNull();
        saveEditorLocaleDraft(editedDraft(), '/de/editor?pattern=one', session, 1_000);
        expect(consumeEditorLocaleDraft('/de/editor?pattern=two', session, 1_001)).toBeNull();
        expect(consumeEditorLocaleDraft('/fr/editor?pattern=one', session, 1_001)).toBeNull();
        expect(consumeEditorLocaleDraft('/de/editor?pattern=one', session, 1_002)).not.toBeNull();
    });

    it('does not overwrite an existing recovery draft from an empty workspace or dismiss a pending library request', () => {
        const session = storage();
        const previous = { ...editedDraft(), pdfScaleMode: 'midi-5mm' as const };
        session.setItem(EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(previous));
        const empty: EditorDraft = { ...previous, sourceMode: 'image', imageSrc: null, editedPattern: null, fileName: 'bead-pattern' };
        expect(saveEditorLocaleDraft(empty, '/fr/editor?pattern=new-request', session, 1_000)).toBe(true);
        expect(session.getItem(EDITOR_DRAFT_STORAGE_KEY)).toBe(JSON.stringify(previous));
        expect(JSON.parse(session.getItem(EDITOR_DRAFT_STORAGE_KEY)!).pdfScaleMode).toBe('midi-5mm');
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull();
        expect(consumeEditorLocaleDraft('/fr/editor?pattern=new-request', session, 1_001)).toBeNull();
    });

    it('retains an unaccepted library request alongside a restored older edited project', () => {
        const session = storage();
        const draft = editedDraft();
        saveEditorLocaleDraft(draft, '/fr/editor?pattern=new-request#canvas', session, 1_000, 'previously-opened');
        const recovered = consumeEditorLocaleDraft('/fr/editor?pattern=new-request#canvas', session, 1_001);
        expect(recovered?.draft).toEqual(draft);
        expect(recovered?.draft.pdfScaleMode).toBe('fit-page');
        expect(recovered?.acceptedPatternId).toBe('previously-opened');
        expect(getEditorLocaleRestoreHref('/fr/editor?pattern=new-request#canvas', recovered!)).toBe('/fr/editor?pattern=new-request#canvas');
    });

    it('only removes a stale pattern query that matches the explicitly accepted library project', () => {
        const session = storage();
        saveEditorLocaleDraft(editedDraft(), '/ja/editor?pattern=accepted&view=large#canvas', session, 1_000, 'accepted');
        const recovered = consumeEditorLocaleDraft('/ja/editor?pattern=accepted&view=large#canvas', session, 1_001);
        expect(getEditorLocaleRestoreHref('/ja/editor?pattern=accepted&view=large#canvas', recovered!)).toBe('/ja/editor?view=large#canvas');
        expect(getEditorLocaleRestoreHref('/ja/editor?pattern=new', recovered!)).toBe('/ja/editor?pattern=new');
        expect(getEditorLocaleRestoreHref('/ja/editor?pattern=accepted', { ...recovered!, acceptedPatternId: null })).toBe('/ja/editor?pattern=accepted');
    });

    it('only clears the stale library query after a caller has successfully restored the draft', () => {
        expect(clearRestoredPatternQuery('https://fusebeadpatterns.art/ja/editor?pattern=old&view=large#canvas')).toBe('/ja/editor?view=large#canvas');
        expect(clearRestoredPatternQuery('/de?pattern=old')).toBe('/de');
    });

    it('returns failure when storage is full so navigation can be cancelled', () => {
        const session = storage();
        session.setItem = vi.fn(() => { throw new Error('QuotaExceededError'); });
        expect(saveEditorLocaleDraft(editedDraft(), '/fr/editor', session)).toBe(false);
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull();
    });

    it('clears an older marker if writing the new marker fails after saving the draft', () => {
        const session = storage();
        saveEditorLocaleDraft(editedDraft(), '/de/editor', session, 1_000);
        const setItem = session.setItem;
        session.setItem = (key, value) => {
            if (key === EDITOR_LOCALE_RESTORE_KEY) throw new Error('QuotaExceededError');
            setItem(key, value);
        };
        expect(saveEditorLocaleDraft(editedDraft(), '/fr/editor', session, 1_001)).toBe(false);
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull();
        expect(session.getItem(EDITOR_DRAFT_STORAGE_KEY)).not.toBeNull();
    });

    it('does not consume invalid saved pixels or expired markers as successful recovery', () => {
        const session = storage();
        const draft = editedDraft();
        saveEditorLocaleDraft(draft, '/de/editor', session, 1_000);
        session.setItem(EDITOR_DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, editedPattern: { ...draft.editedPattern, data: 'broken' } }));
        expect(consumeEditorLocaleDraft('/de/editor', session, 1_001)).toBeNull();
        saveEditorLocaleDraft(draft, '/de/editor', session, 1_000);
        expect(consumeEditorLocaleDraft('/de/editor', session, 400_000)).toBeNull();
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull();
    });

    it('preserves complete project pixels beyond the automatic draft limit', () => {
        const session = storage();
        const pixels = new Uint8ClampedArray(700 * 700 * 4);
        pixels.set([42, 100, 180, 255], pixels.length - 4);
        const draft = { ...editedDraft(), editedPattern: encodeEditorProjectPattern(pixels, 700, 700) };
        expect(saveEditorLocaleDraft(draft, '/ja/editor', session, 1_000)).toBe(true);
        const restored = decodeEditorPatternDraft(consumeEditorLocaleDraft('/ja/editor', session, 1_001)?.draft.editedPattern);
        expect(restored).not.toBeNull();
        // Compare every byte without a multi-million-element assertion traversal.
        expect(Buffer.from(restored!).equals(Buffer.from(pixels))).toBe(true);
    });
});

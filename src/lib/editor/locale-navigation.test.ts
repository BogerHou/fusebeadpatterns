import { describe, expect, it, vi } from 'vitest';
import { createEditorDraft, decodeEditorPatternDraft, EDITOR_DRAFT_STORAGE_KEY, encodeEditorProjectPattern, type EditorDraft } from './draft';
import { clearRestoredPatternQuery, consumeEditorLocaleDraft, consumeLargeEditorLocaleDraft, EDITOR_LOCALE_RESTORE_KEY, getEditorLocaleRestoreHref, hasLargeEditorLocaleDraft, saveEditorLocaleDraft, saveLargeEditorLocaleDraft } from './locale-navigation';
import { PatternHistory, PatternStroke } from './pattern-history';
import type { EditorLocaleContext } from './locale-context';
import type { PixelLocaleStore } from '../pixel-grid/locale-storage';
import { Color } from '../core/model/color/color.model';
import { Palette, PaletteEntry } from '../core/model/palette/palette.model';

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

function largeStorage() {
    const records = new Map<string, string>();
    const store: PixelLocaleStore = {
        async put(key, raw) { records.set(key, raw); },
        async take(key) { const raw = records.get(key) ?? null; records.delete(key); return raw; },
        async remove(key) { records.delete(key); },
    };
    return { records, store };
}

function workingFixture() {
    const entry = new PaletteEntry('Coral', new Color(240, 106, 69, 255));
    entry.ref = 'P01'; entry.prefix = 'P'; entry.symbol = 'A';
    const palette = new Palette('Perler Midi', [entry]);
    const previousPalette = new Palette('Perler Midi', [{ ...entry, enabled: false }]);
    const pixels = new Uint8ClampedArray(29 * 29 * 4);
    pixels.set([20, 30, 40, 0], pixels.length - 4);
    const history = new PatternHistory();
    const stroke = new PatternStroke(pixels);
    stroke.setPixel(0, [240, 106, 69, 255]);
    history.push(stroke.finish());
    const next = new PatternStroke(pixels);
    next.setPixel(4, [7, 8, 9, 127]);
    history.push(next.finish());
    history.undo(pixels);
    const draft = { ...editedDraft(), activePalettes: [palette], editedPattern: encodeEditorProjectPattern(pixels, 29, 29) };
    const context: EditorLocaleContext = {
        history: history.capture(pixels, 29, 29)!, tool: 'erase', colorRef: 'P01', colorSelection: 'manual',
        pendingPaletteId: 'hama', pendingBoardId: 'mini', pendingBoardWidth: 2, pendingBoardHeight: 3,
        manualRevision: 7, colorPickerPaletteId: 'perler', colorPickerQuery: 'coral', paletteHistory: [[previousPalette]],
        advancedOpen: true, editorPanel: 'setup', homePanel: 'pegboard', viewport: { left: 18.5, top: 27.25 },
    };
    return { draft, context, pixels };
}

function assertWorkingRecovery(recovered: ReturnType<typeof consumeEditorLocaleDraft>, fixture: ReturnType<typeof workingFixture>) {
    expect(recovered?.draft).toEqual(JSON.parse(JSON.stringify(fixture.draft)));
    expect(recovered?.context).toEqual(JSON.parse(JSON.stringify(fixture.context)));
    const restoredPixels = decodeEditorPatternDraft(recovered!.draft.editedPattern)!;
    expect(Buffer.from(restoredPixels).equals(Buffer.from(fixture.pixels))).toBe(true);
    const history = new PatternHistory();
    expect(history.restore(recovered!.context!.history, restoredPixels, 29, 29)).toBe(true);
    expect(history.canUndo).toBe(true); expect(history.canRedo).toBe(true);
    expect(history.redo(restoredPixels)).not.toBeNull();
    expect([...restoredPixels.slice(4, 8)]).toEqual([7, 8, 9, 127]);
    expect(history.undo(restoredPixels)).not.toBeNull();
    expect(history.undo(restoredPixels)).not.toBeNull();
    expect([...restoredPixels.slice(0, 8)]).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect([...restoredPixels.slice(-4)]).toEqual([20, 30, 40, 0]);
}

describe('editor language navigation recovery', () => {
    it('restores both history branches, manual color, pending changes and viewport without changing the draft format', () => {
        const session = storage(), fixture = workingFixture();
        const href = '/ja/editor?pattern=accepted&view=large#canvas';
        expect(saveEditorLocaleDraft(fixture.draft, href, session, 1000, 'accepted', fixture.context)).toBe(true);
        expect(JSON.parse(session.getItem(EDITOR_DRAFT_STORAGE_KEY)!)).toEqual(JSON.parse(JSON.stringify(fixture.draft)));
        const recovered = consumeEditorLocaleDraft(href, session, 1001);
        assertWorkingRecovery(recovered, fixture);
        expect(recovered?.acceptedPatternId).toBe('accepted');
        expect(consumeEditorLocaleDraft(href, session, 1002)).toBeNull();
    });

    it('keeps a marker without a context compatible with the original version 1 draft', () => {
        const session = storage(), draft = editedDraft();
        session.setItem(EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(draft));
        session.setItem(EDITOR_LOCALE_RESTORE_KEY, JSON.stringify({ destination: '/de/editor', savedAt: 1000, acceptedPatternId: 'old' }));
        expect(consumeEditorLocaleDraft('/de/editor', session, 1001)).toEqual({ draft, acceptedPatternId: 'old', context: null });
    });

    it('protects a corrupt context instead of silently recovering a partial draft', () => {
        const session = storage(), fixture = workingFixture(), target = '/fr/editor';
        saveEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context);
        const marker = JSON.parse(session.getItem(EDITOR_LOCALE_RESTORE_KEY)!);
        marker.context.history.undo[0].before = 'bad';
        session.setItem(EDITOR_LOCALE_RESTORE_KEY, JSON.stringify(marker));
        const rawMarker = session.getItem(EDITOR_LOCALE_RESTORE_KEY);
        for (let attempt = 0; attempt < 2; attempt++) {
            expect(() => consumeEditorLocaleDraft(target, session, 1001)).toThrow('Invalid editor language context');
            expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBe(rawMarker);
        }
        marker.context = fixture.context;
        session.setItem(EDITOR_LOCALE_RESTORE_KEY, JSON.stringify(marker));
        assertWorkingRecovery(consumeEditorLocaleDraft(target, session, 1002), fixture);
    });

    it('protects a new context when its paired draft is missing or corrupt instead of loading ordinary history-free data', () => {
        const session = storage(), fixture = workingFixture(), target = '/de/editor';
        for (const rawDraft of [null, 'not JSON', JSON.stringify({ ...fixture.draft, editedPattern: { ...fixture.draft.editedPattern, data: 'bad' } })]) {
            saveEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context);
            const marker = session.getItem(EDITOR_LOCALE_RESTORE_KEY);
            if (rawDraft === null) session.removeItem(EDITOR_DRAFT_STORAGE_KEY); else session.setItem(EDITOR_DRAFT_STORAGE_KEY, rawDraft);
            expect(() => consumeEditorLocaleDraft(target, session, 1001)).toThrow('Invalid editor language context');
            expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBe(marker);
        }
    });

    it('retries marker and draft reads without consuming the small workspace', () => {
        const session = storage(), fixture = workingFixture(), target = '/de/editor';
        saveEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context);
        const rawMarker = session.getItem(EDITOR_LOCALE_RESTORE_KEY), get = session.getItem;
        session.getItem = () => { throw new Error('Marker unavailable'); };
        expect(() => hasLargeEditorLocaleDraft(session)).toThrow('Marker unavailable');
        expect(() => consumeEditorLocaleDraft(target, session, 1001)).toThrow('Marker unavailable');
        session.getItem = key => { if (key === EDITOR_DRAFT_STORAGE_KEY) throw new Error('Draft unavailable'); return get(key); };
        expect(() => consumeEditorLocaleDraft(target, session, 1001)).toThrow('Draft unavailable');
        expect(get(EDITOR_LOCALE_RESTORE_KEY)).toBe(rawMarker);
        session.getItem = get;
        assertWorkingRecovery(consumeEditorLocaleDraft(target, session, 1002), fixture);
    });

    it('returns the complete recovered workspace when marker cleanup temporarily fails', () => {
        const session = storage(), fixture = workingFixture(), target = '/de/editor';
        saveEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context);
        session.removeItem = () => { throw new Error('Cleanup unavailable'); };
        assertWorkingRecovery(consumeEditorLocaleDraft(target, session, 1001), fixture);
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).not.toBeNull();
    });

    it('uses a complete IndexedDB record after a quota failure and stores only a small tab-local pointer', async () => {
        const session = storage(), large = largeStorage(), fixture = workingFixture(), target = '/ja/editor?pattern=accepted#canvas';
        session.setItem(EDITOR_DRAFT_STORAGE_KEY, 'original persistent draft');
        const set = session.setItem;
        session.setItem = (key, value) => { if (value.length > 1024) throw new Error('QuotaExceededError'); set(key, value); };
        expect(saveEditorLocaleDraft(fixture.draft, target, session, 1000, 'accepted', fixture.context)).toBe(false);
        expect(await saveLargeEditorLocaleDraft(fixture.draft, target, session, 1000, 'accepted', fixture.context, large.store)).toBe(true);
        expect(hasLargeEditorLocaleDraft(session)).toBe(true);
        const rawPointer = session.getItem(EDITOR_LOCALE_RESTORE_KEY)!;
        expect(rawPointer.length).toBeLessThan(1024);
        expect(JSON.parse(rawPointer).key).toMatch(/^[\da-f-]{36}$/i);
        expect(rawPointer).not.toContain('history'); expect(rawPointer).not.toContain('imageSrc');
        expect(session.getItem(EDITOR_DRAFT_STORAGE_KEY)).toBe('original persistent draft');
        expect(consumeEditorLocaleDraft(target, session, 1001)).toBeNull();
        expect(await consumeLargeEditorLocaleDraft('/de/editor?pattern=accepted', session, 1001, large.store)).toBeNull();
        expect(await consumeLargeEditorLocaleDraft('/ja/editor?pattern=different', session, 1001, large.store)).toBeNull();
        expect(large.records.size).toBe(1);
        const recovered = await consumeLargeEditorLocaleDraft(target, session, 1002, large.store);
        assertWorkingRecovery(recovered, fixture);
        expect(recovered?.acceptedPatternId).toBe('accepted');
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull(); expect(large.records.size).toBe(0);
        expect(await consumeLargeEditorLocaleDraft(target, session, 1003, large.store)).toBeNull();
    });

    it('keeps the large pointer and exact source/history through read failures, then retries once', async () => {
        const session = storage(), large = largeStorage(), fixture = workingFixture(), target = '/fr/editor';
        await saveLargeEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context, large.store);
        const pointer = session.getItem(EDITOR_LOCALE_RESTORE_KEY), raw = [...large.records.values()][0], get = session.getItem;
        session.getItem = () => { throw new Error('Session temporarily unavailable'); };
        await expect(consumeLargeEditorLocaleDraft(target, session, 1001, large.store)).rejects.toThrow('Session temporarily unavailable');
        expect([...large.records.values()]).toEqual([raw]);
        session.getItem = get;
        const store = { ...large.store, async take() { throw new Error('Transaction timeout'); } };
        await expect(consumeLargeEditorLocaleDraft(target, session, 1001, store)).rejects.toThrow('Transaction timeout');
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBe(pointer); expect([...large.records.values()]).toEqual([raw]);
        assertWorkingRecovery(await consumeLargeEditorLocaleDraft(target, session, 1002, large.store), fixture);
    });

    it('protects corrupt large contexts even when restoring the consumed raw record also fails', async () => {
        const session = storage(), large = largeStorage(), fixture = workingFixture(), target = '/fr/editor';
        await saveLargeEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context, large.store);
        const pointer = session.getItem(EDITOR_LOCALE_RESTORE_KEY)!, key = JSON.parse(pointer).key;
        const value = JSON.parse(large.records.get(key)!); value.context.pendingBoardWidth = 0;
        large.records.set(key, JSON.stringify(value));
        const blockedPut = { ...large.store, async put() { throw new Error('Storage full'); } };
        for (let attempt = 0; attempt < 2; attempt++) {
            await expect(consumeLargeEditorLocaleDraft(target, session, 1001, blockedPut)).rejects.toThrow('Invalid editor language context');
            expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBe(pointer);
        }
        expect(await consumeLargeEditorLocaleDraft(target, session, 301001, blockedPut)).toBeNull();
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull();
    });

    it('retains complete large recovery after cleanup failure and cleans expired or future pointers', async () => {
        const target = '/de/editor';
        const session = storage(), large = largeStorage(), fixture = workingFixture();
        await saveLargeEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context, large.store);
        const remove = session.removeItem;
        session.removeItem = () => { throw new Error('Cleanup unavailable'); };
        assertWorkingRecovery(await consumeLargeEditorLocaleDraft(target, session, 1001, large.store), fixture);
        session.removeItem = remove;
        for (const now of [999, 301001]) {
            await saveLargeEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context, large.store);
            expect(await consumeLargeEditorLocaleDraft(target, session, now, large.store)).toBeNull();
            expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull(); expect(large.records.size).toBe(0);
        }
    });

    it('protects matching large pointers with missing, malformed or mismatched records instead of falling back to a partial draft', async () => {
        const target = '/de/editor', fixture = workingFixture();
        const complete = { version: 1, destination: target, savedAt: 1000, draft: fixture.draft, context: fixture.context, acceptedPatternId: null as string | null };
        for (const corrupt of [
            null,
            'not JSON',
            JSON.stringify({ ...complete, destination: '/fr/editor' }),
            JSON.stringify({ ...complete, savedAt: 1001 }),
            JSON.stringify({ ...complete, version: 2 }),
            JSON.stringify({ ...complete, draft: {} }),
            JSON.stringify({ version: 1, destination: target, savedAt: 1000, draft: {} }),
        ]) {
            const session = storage(), large = largeStorage();
            session.setItem(EDITOR_DRAFT_STORAGE_KEY, 'ordinary draft must not replace full transfer');
            await saveLargeEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context, large.store);
            const pointer = session.getItem(EDITOR_LOCALE_RESTORE_KEY)!, key = JSON.parse(pointer).key;
            if (corrupt === null) large.records.delete(key); else large.records.set(key, corrupt);
            for (let attempt = 0; attempt < 2; attempt++) {
                await expect(consumeLargeEditorLocaleDraft(target, session, 1001, large.store)).rejects.toThrow();
                expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBe(pointer);
                expect(large.records.get(key) ?? null).toBe(corrupt);
                expect(session.getItem(EDITOR_DRAFT_STORAGE_KEY)).toBe('ordinary draft must not replace full transfer');
            }
            expect(await consumeLargeEditorLocaleDraft(target, session, 301001, large.store)).toBeNull();
            expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull(); expect(large.records.size).toBe(0);
        }
    });

    it('continues protecting corrupt bulk data on retry even if rewriting the consumed record fails', async () => {
        const session = storage(), large = largeStorage(), fixture = workingFixture(), target = '/fr/editor';
        await saveLargeEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context, large.store);
        const pointer = session.getItem(EDITOR_LOCALE_RESTORE_KEY)!, key = JSON.parse(pointer).key;
        large.records.set(key, 'broken JSON');
        const failedPut = { ...large.store, async put() { throw new Error('Quota exceeded'); } };
        for (let attempt = 0; attempt < 2; attempt++) {
            await expect(consumeLargeEditorLocaleDraft(target, session, 1001, failedPut)).rejects.toThrow();
            expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBe(pointer);
        }
        expect(await consumeLargeEditorLocaleDraft(target, session, 301001, failedPut)).toBeNull();
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull();
    });

    it('never publishes a pointer before committing full content and removes records after failed writes', async () => {
        const session = storage(), large = largeStorage(), fixture = workingFixture(), before = JSON.stringify(fixture);
        const failed = { ...large.store, async put() { throw new Error('IndexedDB unavailable'); } };
        expect(await saveLargeEditorLocaleDraft(fixture.draft, '/de/editor', session, 1000, null, fixture.context, failed)).toBe(false);
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull(); expect(large.records.size).toBe(0);
        session.setItem = () => { throw new Error('Pointer quota exceeded'); };
        expect(await saveLargeEditorLocaleDraft(fixture.draft, '/de/editor', session, 1000, null, fixture.context, large.store)).toBe(false);
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull(); expect(large.records.size).toBe(0);
        expect(JSON.stringify(fixture)).toBe(before);
    });

    it('supports source plus history payloads beyond 32 Mi characters without removing either history branch', async () => {
        const session = storage(), large = largeStorage(), fixture = workingFixture(), target = '/ja/editor';
        fixture.draft.imageSrc = `data:image/png;base64,${'A'.repeat(33 * 1024 * 1024)}tail`;
        expect(await saveLargeEditorLocaleDraft(fixture.draft, target, session, 1000, null, fixture.context, large.store)).toBe(true);
        expect([...large.records.values()][0].length).toBeGreaterThan(32 * 1024 * 1024);
        const recovered = await consumeLargeEditorLocaleDraft(target, session, 1001, large.store);
        expect(recovered?.draft.imageSrc?.length).toBe(fixture.draft.imageSrc.length);
        expect(recovered?.draft.imageSrc?.endsWith('tail')).toBe(true);
        expect(recovered?.context?.history).toEqual(fixture.context.history);
        expect(recovered?.context?.history.undo).toHaveLength(1); expect(recovered?.context?.history.redo).toHaveLength(1);
    });

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

    it.each([EDITOR_DRAFT_STORAGE_KEY, EDITOR_LOCALE_RESTORE_KEY])('never reports success if the %s write is silently discarded', key => {
        const session = storage(), fixture = workingFixture(), set = session.setItem;
        session.setItem(EDITOR_DRAFT_STORAGE_KEY, 'old draft');
        const attempts: string[] = [];
        session.setItem = (storedKey, value) => {
            attempts.push(storedKey);
            if (storedKey !== key) set(storedKey, value);
        };
        expect(saveEditorLocaleDraft(fixture.draft, '/de/editor', session, 1000, null, fixture.context)).toBe(false);
        expect(session.getItem(EDITOR_LOCALE_RESTORE_KEY)).toBeNull();
        if (key === EDITOR_DRAFT_STORAGE_KEY) {
            expect(session.getItem(EDITOR_DRAFT_STORAGE_KEY)).toBe('old draft');
            expect(attempts).not.toContain(EDITOR_LOCALE_RESTORE_KEY);
        }
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

import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { getBoardOption, getPaletteOption, parsePaletteCsv } from '../../lib/editor/config';
import { createEditorDraft, decodeEditorPatternDraft, encodeEditorProjectPattern, parseEditorProject, serializeEditorProject, type EditorDraft } from '../../lib/editor/draft';
import { buildEditorProject } from '../../lib/editor/project';
import { clonePalettes } from '../../lib/editor/palette-state';
import { PatternHistory, PatternStroke, createPatternPatch } from '../../lib/editor/pattern-history';
import { SourceImageTransactions, commitSourceImageCanvas, type PreparedSourceImage } from '../../lib/editor/source-image-transaction';
import { getProjectOpenCopy } from '../../lib/editor/project-open-copy';
import { prepareEditorProjectFile, type PreparedEditorProjectFile } from '../../lib/editor/project-file-preparation';
import { computeUsage } from '../../lib/core/utils/utils';
import { HomeHostImageRequests } from '../../lib/editor/home-host';

// Run the production file callback, helpers and mount cleanup. File.text and
// React's publication/storage seam, image decode and preview are controlled;
// parsing, candidate preparation, Canvas commit, palettes, transactions and
// both undo branches use the real implementations. This is not a browser test.
const source = ts.createSourceFile('Editor.tsx', readFileSync(new URL('./Editor.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ['cancelProjectFileOperation', 'cancelSourceOperation', 'handleUserSourceChange', 'cancelHomeHostImage', 'handleLibraryPatternLoading', 'isProjectFileOpenBusy', 'hasCurrentProjectWork', 'handleProjectFileUpload'];
const nodes = new Map<string, ts.VariableDeclaration>();
let mountEffect: ts.CallExpression | null = null;
function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && names.includes(node.name.text)) nodes.set(node.name.text, node);
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' && node.getText(source).includes('projectFileMountedRef.current = false')) mountEffect = node;
    ts.forEachChild(node, visit);
}
visit(source);
if (nodes.size !== names.length || !mountEffect) throw new Error('Missing production project-file callbacks or mount cleanup');
const compiled = ts.transpileModule(names.map(name => `const ${nodes.get(name)!.getText(source)};`).join('\n') +
    (mountEffect ? `\n${(mountEffect as ts.CallExpression).getText(source)};` : '') +
    '\nmodule.exports={open:handleProjectFileUpload,cancel:cancelProjectFileOperation,cancelHost:cancelHomeHostImage,libraryLoading:handleLibraryPatternLoading,busy:isProjectFileOpenBusy,hasWork:hasCurrentProjectWork};',
{ compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;

function deferred<T>() {
    let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
    const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}
function palette() { return [parsePaletteCsv('P01,Black,B,0,0,0\nP02,White,W,255,255,255', getPaletteOption('perler')!)]; }
function draft(name: string) {
    const pixels = new Uint8ClampedArray(29 * 29 * 4); pixels.set([0, 0, 0, 255, 17, 23, 99, 0, 255, 255, 255, 128]);
    return createEditorDraft({ sourceMode: 'blank', imageSrc: null, fileName: name, selectedPaletteIds: ['perler'], activePalettes: palette(),
        boardId: 'midi', boardWidth: 1, boardHeight: 1, matchingId: 'euclidean', ditheringId: 'none', useSymbols: true, exportFormatId: 'pdf',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 }, rendererSettings: { center: true, fit: true, showGrid: false },
        showReference: true, referenceOpacity: 73, previewZoom: 1.25, editedPattern: encodeEditorProjectPattern(pixels, 29, 29) });
}
function fileEvent(read: Promise<string> | null) {
    const text = vi.fn(() => read), input = { files: read ? [{ text }] : [], value: 'selected-project.json' };
    return { event: { currentTarget: input }, input, text };
}
function harness({ work = true, recovery = false, host = false } = {}) {
    const activePalettes = palette(), config = { palettes: activePalettes, boardOption: getBoardOption('midi')!, boardWidth: 1, boardHeight: 1,
        matchingId: 'euclidean', ditheringId: 'none', imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: false }, useSymbols: false };
    const project = buildEditorProject(config), pixels = new Uint8ClampedArray(29 * 29 * 4), history = new PatternHistory();
    if (work) {
        pixels.set([0, 0, 0, 255, 17, 23, 99, 0]);
        for (const index of [8, 12]) { const stroke = new PatternStroke(pixels); stroke.setPixel(index, [255, 255, 255, 255]); history.push(stroke.finish()); }
        history.undo(pixels); // Both undo and redo branches must survive a rejected open.
    }
    const original = draft('current-user-work'), stored = new Map([['editor-draft', serializeEditorProject(original)], ['locale-restore', 'protected-language-work'], ['other-tool', 'untouched']]);
    const acceptedSource = work ? { src: 'original-source', crop: { x: 1, y: 2, width: 3, height: 4 }, background: { color: { r: 1, g: 2, b: 3 }, tolerance: 7, mode: 'edge-connected' } } : null;
    const refs = { project: { current: project }, pixels: { current: pixels as Uint8ClampedArray | null }, history: { current: history },
        paletteHistory: { current: work ? [{ marker: 'old-palette-edit', palettes: clonePalettes(activePalettes) }] : [] },
        source: { current: acceptedSource }, accepted: { current: work }, mounted: { current: true }, library: { current: false },
        initial: { current: true }, blocked: { current: recovery }, generation: { current: null as AbortController | null },
        settings: { current: null as AbortController | null }, localeSave: { current: false }, pendingLocale: { current: null as object | null },
        exporting: { current: false } };
    const jobs = new SourceImageTransactions(), sourceJobs = new SourceImageTransactions(), order: string[] = [], cleanups: Array<() => void> = [];
    const hostImages = new HomeHostImageRequests(), hostUserSourceChange = vi.fn();
    const sourceCandidate = { current: null as AbortController | null };
    const hostSource = { current: null as AbortController | null };
    let raster = pixels.slice();
    const write = vi.fn((value: { data: Uint8ClampedArray }) => { raster = value.data.slice(); });
    const context = { createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }), putImageData: write };
    const canvas = { width: 29, height: 29, getContext: vi.fn(() => context) }, canvasRef = { current: canvas as typeof canvas | null };
    const loadPalette = vi.fn(async () => clonePalettes(palette())[0]);
    const prepareImage = vi.fn(async (options: Parameters<NonNullable<Parameters<typeof prepareEditorProjectFile>[2]['prepareImage']>>[0]): Promise<PreparedSourceImage> => {
        const output = options.restoredPixels?.slice() ?? new Uint8ClampedArray(options.width * options.height * 4);
        if (!options.restoredPixels) output.set([0, 0, 0, 255]);
        return { project: options.project, pixels: output, width: options.width, height: options.height };
    });
    const makeCandidate = (value: EditorDraft, signal = new AbortController().signal) => prepareEditorProjectFile(value, signal, {
        loadPalette, prepareImage, createBlankImage: () => ({}) as HTMLImageElement,
    });
    const prepare = vi.fn((value: EditorDraft, signal: AbortSignal) => makeCandidate(value, signal));
    const preview = vi.fn(() => 'data:image/png;base64,prepared-preview'), sync = vi.fn(), large = vi.fn(() => true);
    const sourceKey = { current: 'old-source-key' }, skipRebuild = { current: false };
    const state = { draft: original, source: work ? 'original-source' : null, palettes: activePalettes, error: 'previous-message', restores: [] as EditorDraft[] };
    const finish = vi.fn(() => { order.push('finish'); });
    const restore = vi.fn((next: EditorDraft, installed: PreparedSourceImage) => { void installed; order.push('restore'); state.restores.push(next); state.draft = next; state.source = next.imageSrc; state.palettes = next.activePalettes; });
    const persist = vi.fn((next: EditorDraft) => { order.push('persist'); stored.set('editor-draft', serializeEditorProject(next)); return true; });
    const confirm = vi.fn(() => true), error = vi.fn((value: string) => { state.error = value; });
    const loaded = { exports: {} }, env: Record<string, unknown> = { module: loaded, useCallback: (fn: unknown) => fn,
        React: { useEffectEvent: (fn: unknown) => fn },
        useEffect: (fn: () => (() => void) | undefined) => { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); },
        SourceImageTransactions, AbortController, Uint8ClampedArray, Error, JSON, parseEditorProject, getProjectOpenCopy, getBoardOption,
        prepareEditorProjectFile: prepare, loadPalette, computeUsage, createPatternPreviewDataUrl: preview, commitSourceImageCanvas,
        syncEditorColorAfterPatternBuild: sync, confirmLargePatternAction: large, canvasRef,
        lastProcessedImageSettingsKeyRef: sourceKey, skipNextPaletteRebuildRef: skipRebuild,
        projectFileTransactionsRef: { current: jobs }, projectFileMountedRef: refs.mounted, projectDocumentAcceptedRef: refs.accepted,
        libraryPatternLoadingRef: refs.library, initialDraftAppliedRef: refs.initial, localeRestoreBlockedRef: refs.blocked,
        currentProjectRef: refs.project, reducedColorRef: refs.pixels, patternHistoryRef: refs.history, paletteHistoryRef: refs.paletteHistory,
        acceptedSourceConfigurationRef: refs.source, imageGenerationRef: refs.generation, settingsUpdateRef: refs.settings,
        sourceTransactionsRef: { current: sourceJobs }, exportInProgressRef: refs.exporting, localeSaveInProgressRef: refs.localeSave,
        sourceCandidateControllerRef: sourceCandidate, homeHostImagesRef: { current: hostImages }, homeHostSourceRef: hostSource,
        homeHost: host ? { incomingImage: { id: 'queued-right-click' }, onUserSourceChange: hostUserSourceChange } : undefined,
        setSourceTransactionKind: vi.fn(), setColorLimitBusy: vi.fn(), setProcessing: (value: boolean) => { env.processing = value; },
        pendingLocaleContextRef: refs.pendingLocale, localeContextInstallingRef: { current: false },
        craftEntryBusyRef: { current: false }, lastProcessedImageSrcRef: { current: work ? 'original-source' : null }, activeStrokeRef: { current: null },
        sourceMode: 'blank', imageSrc: state.source, processing: false, isLibraryPatternLoading: false, localeTransferPending: false, localeContextInstalling: false,
        localeRestoreBlocked: recovery, isEditorDraftReady: true, locale: 'en', exportingId: null,
        activePalettes, selectedPaletteIds: ['perler'], manualPatternRevision: 2, finishActiveStroke: finish,
        restoreEditorDraft: restore, persistEditorDraft: persist, setErrorMessage: error,
        setLocaleRestoreBlocked: (value: boolean) => { refs.blocked.current = value; env.localeRestoreBlocked = value; },
        setIsLibraryPatternLoading: (value: boolean) => { env.isLibraryPatternLoading = value; },
        setIsEditorDraftReady: vi.fn(), EDITOR_LOCALE_RESTORE_KEY: 'locale-restore',
        window: { confirm, location: { href: 'https://fusebeadpatterns.art/editor' }, sessionStorage: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => { stored.set(key, value); }, removeItem: (key: string) => { stored.delete(key); } } } };
    new Script(compiled).runInNewContext(env);
    const exports = loaded.exports as { open: (event: ReturnType<typeof fileEvent>['event']) => Promise<void>; cancel: () => void; cancelHost: () => void; libraryLoading: (loading: boolean) => void; busy: () => boolean; hasWork: () => boolean };
    const before = { pixels: pixels.slice(), history: history.capture(pixels, 29, 29), palettes: clonePalettes(activePalettes), paletteHistory: structuredClone(refs.paletteHistory.current), source: structuredClone(acceptedSource), stored: new Map(stored) };
    return { ...exports, env, refs, state, before, pixels, project, history, jobs, sourceJobs, stored, restore, persist, confirm, finish, error, order,
        prepare, prepareImage, makeCandidate, loadPalette, canvas, canvasRef, write, raster: () => raster, preview, sync, large, sourceKey, skipRebuild,
        hostImages, hostUserSourceChange, sourceCandidate, hostSource,
        rejectWrite() { write.mockImplementationOnce(() => { raster = new Uint8ClampedArray([99, 1, 2, 3]); throw new Error('Canvas rejected write'); }); },
        unmount() { for (const cleanup of cleanups) cleanup(); } };
}
function unchanged(h: ReturnType<typeof harness>) {
    expect(h.refs.project.current).toBe(h.project); expect(h.refs.pixels.current).toBe(h.pixels); expect(h.pixels).toEqual(h.before.pixels);
    expect(h.history.capture(h.pixels, 29, 29)).toEqual(h.before.history); expect(h.state.palettes).toEqual(h.before.palettes);
    expect(h.refs.paletteHistory.current).toEqual(h.before.paletteHistory); expect(h.refs.source.current).toEqual(h.before.source);
    expect(h.stored).toEqual(h.before.stored); expect(h.state.draft.fileName).toBe('current-user-work');
    expect(h.canvas).toMatchObject({ width: 29, height: 29 }); expect(h.raster()).toEqual(h.before.pixels); expect(h.sourceKey.current).toBe('old-source-key'); expect(h.skipRebuild.current).toBe(false);
    expect(h.restore).not.toHaveBeenCalled(); expect(h.persist).not.toHaveBeenCalled(); expect(h.finish).not.toHaveBeenCalled();
}

describe('actual Editor complete-project file entry', () => {
    it('an outside host cancel aborts its active conversion and invalidates its callbacks', () => {
        const h = harness({ host: true }), request = h.hostImages.claim('queued-right-click')!;
        const old = h.sourceJobs.begin();
        h.hostSource.current = old;
        h.sourceCandidate.current = old;
        h.refs.generation.current = old;
        h.cancelHost();
        expect(old.signal.aborted).toBe(true);
        expect(h.sourceJobs.pending).toBe(false);
        expect(h.hostImages.isCurrent(request)).toBe(false);
        expect(h.sourceCandidate.current).toBeNull();
        unchanged(h);
    });
    it('a late host cancel cannot abort a newer manual file conversion', () => {
        const h = harness({ host: true }), old = h.sourceJobs.begin();
        h.hostSource.current = old;
        const manual = h.sourceJobs.begin();
        h.sourceCandidate.current = manual;
        h.refs.generation.current = manual;
        h.cancelHost();
        expect(manual.signal.aborted).toBe(false);
        expect(h.sourceJobs.isCurrent(manual)).toBe(true);
        expect(h.sourceCandidate.current).toBe(manual);
        expect(h.refs.generation.current).toBe(manual);
        unchanged(h);
    });
    it('a host project selection invalidates a queued right-click image and cancels its owned generation before reading', async () => {
        const h = harness({ host: true });
        const oldImage = h.sourceJobs.begin();
        h.sourceCandidate.current = oldImage;
        h.refs.generation.current = oldImage;
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(draft('manual-project')))).event);
        expect(oldImage.signal.aborted).toBe(true);
        expect(h.hostImages.claim('queued-right-click')).toBeNull();
        expect(h.hostUserSourceChange).toHaveBeenCalledOnce();
        expect(h.state.draft.fileName).toBe('manual-project');
        expect(h.sourceCandidate.current).toBeNull();
    });
    it('cancelling a host picker without choosing a file leaves a queued image alone', async () => {
        const h = harness({ host: true });
        await h.open(fileEvent(null).event);
        expect(h.hostUserSourceChange).not.toHaveBeenCalled();
        expect(h.hostImages.claim('queued-right-click')).not.toBeNull();
        unchanged(h);
    });
    it('only publishes the newest file when an older read finishes last', async () => {
        const h = harness(), a = deferred<string>(), b = deferred<string>(), first = fileEvent(a.promise), second = fileEvent(b.promise);
        const oldRun = h.open(first.event), newRun = h.open(second.event);
        expect(first.input.value).toBe(''); expect(second.input.value).toBe('');
        b.resolve(serializeEditorProject(draft('newer-B'))); await newRun;
        a.resolve(serializeEditorProject(draft('older-A'))); await oldRun;
        expect(h.restore).toHaveBeenCalledOnce(); expect(h.persist).toHaveBeenCalledOnce(); expect(h.state.draft.fileName).toBe('newer-B');
        expect(h.order).toEqual(['finish', 'restore', 'persist']); expect(h.jobs.pending).toBe(false);
    });
    it('an old finally cannot finish or unlock a newer pending transaction', async () => {
        const h = harness(), a = deferred<string>(), b = deferred<string>(), oldRun = h.open(fileEvent(a.promise).event), nextRun = h.open(fileEvent(b.promise).event);
        a.resolve(serializeEditorProject(draft('older-A'))); await oldRun;
        expect(h.jobs.pending).toBe(true); unchanged(h);
        b.resolve(serializeEditorProject(draft('newer-B'))); await nextRun; expect(h.state.draft.fileName).toBe('newer-B'); expect(h.jobs.pending).toBe(false);
    });
    it('cancelled replacement does not finish a stroke or mutate pixels, source, palettes, either undo branch, draft or storage', async () => {
        const h = harness(); h.confirm.mockReturnValue(false);
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(draft('replacement')))).event);
        expect(h.confirm).toHaveBeenCalledWith(getProjectOpenCopy('en').replaceConfirm); unchanged(h); expect(h.error).not.toHaveBeenCalled(); expect(h.jobs.pending).toBe(false);
    });
    it.each(['{', JSON.stringify({ format: 'wrong', version: 1 }), JSON.stringify({ type: 'fusebead-pattern-project', version: 99, draft: {} })])('real parser rejection is atomic for malformed project %s', async text => {
        const h = harness(); expect(parseEditorProject(text)).toBeNull(); await h.open(fileEvent(Promise.resolve(text)).event);
        unchanged(h); expect(h.confirm).not.toHaveBeenCalled(); expect(h.error).toHaveBeenCalledWith(getProjectOpenCopy('en').invalid); expect(h.jobs.pending).toBe(false);
    });
    it('real parser validates corrupt RGBA before the replacement confirmation or any publication', async () => {
        const raw = JSON.parse(serializeEditorProject(draft('corrupted'))); raw.draft.editedPattern.data = 'not-base64'; const text = JSON.stringify(raw), h = harness();
        expect(parseEditorProject(text)).toBeNull(); await h.open(fileEvent(Promise.resolve(text)).event); unchanged(h); expect(h.confirm).not.toHaveBeenCalled();
    });
    it('a current read failure reports only the new error and preserves the complete live document', async () => {
        const h = harness(), read = deferred<string>(), run = h.open(fileEvent(read.promise).event); read.reject(new Error('disk read failed')); await run;
        unchanged(h); expect(h.error).toHaveBeenCalledOnce(); expect(h.jobs.pending).toBe(false);
    });
    it.each(['read-failure', 'invalid-project'] as const)('a newer %s still invalidates the older successful read', async kind => {
        const h = harness(), a = deferred<string>(), b = deferred<string>(), oldRun = h.open(fileEvent(a.promise).event), nextRun = h.open(fileEvent(b.promise).event);
        if (kind === 'read-failure') b.reject(new Error('new file unreadable')); else b.resolve('not a project');
        await nextRun; const currentMessage = h.state.error;
        a.resolve(serializeEditorProject(draft('older-A'))); await oldRun; unchanged(h);
        expect(h.error).toHaveBeenCalledOnce(); expect(h.state.error).toBe(currentMessage); expect(h.jobs.pending).toBe(false);
    });
    it('a stale read error cannot overwrite successful newer work or its message', async () => {
        const h = harness(), a = deferred<string>(), b = deferred<string>(), oldRun = h.open(fileEvent(a.promise).event), nextRun = h.open(fileEvent(b.promise).event);
        b.resolve(serializeEditorProject(draft('newer-B'))); await nextRun; const calls = h.error.mock.calls.length;
        a.reject(new Error('late old error')); await oldRun;
        expect(h.state.draft.fileName).toBe('newer-B'); expect(h.restore).toHaveBeenCalledOnce(); expect(h.error).toHaveBeenCalledTimes(calls);
    });
    it.each(['cancel-operation', 'unmount', 'href-change'] as const)('late completion is harmless after %s', async action => {
        const h = harness(), read = deferred<string>(), run = h.open(fileEvent(read.promise).event);
        if (action === 'unmount') h.unmount(); else if (action === 'cancel-operation') h.cancel!();
        else (h.env.window as { location: { href: string } }).location.href = 'https://fusebeadpatterns.art/ja/editor';
        read.resolve(serializeEditorProject(draft('late'))); await run;
        unchanged(h); expect(h.error).not.toHaveBeenCalled(); expect(h.jobs.pending).toBe(false);
        if (action === 'unmount') expect(h.refs.mounted.current).toBe(false);
    });
    const busyCases: Array<[string, (h: ReturnType<typeof harness>) => void]> = [
        ['initial restore', h => { h.refs.initial.current = false; }], ['library loading', h => { h.refs.library.current = true; }],
        ['source generation', h => { h.sourceJobs.begin(); }], ['image generation', h => { h.refs.generation.current = new AbortController(); }],
        ['settings update', h => { h.refs.settings.current = new AbortController(); }], ['export', h => { h.refs.exporting.current = true; }],
        ['locale save', h => { h.refs.localeSave.current = true; }], ['craft entry', h => { (h.env.craftEntryBusyRef as { current: boolean }).current = true; }],
    ];
    it.each(busyCases)('synchronously rejects a picker while %s is busy before reading', async (_label, setBusy) => {
        const h = harness(), selected = fileEvent(Promise.resolve(serializeEditorProject(draft('blocked')))); setBusy(h);
        await h.open(selected.event); expect(selected.input.value).toBe(''); expect(selected.text).not.toHaveBeenCalled(); unchanged(h);
        expect(h.error).toHaveBeenCalledWith(getProjectOpenCopy('en').busy); expect(h.jobs.pending).toBe(false);
    });
    it.each(busyCases)('rechecks live %s busy refs after reading without relying on a React rerender', async (_label, setBusy) => {
        const h = harness(), read = deferred<string>(), run = h.open(fileEvent(read.promise).event); setBusy(h);
        read.resolve(serializeEditorProject(draft('blocked-late'))); await run; unchanged(h);
        expect(h.confirm).not.toHaveBeenCalled(); expect(h.error).toHaveBeenCalledWith(getProjectOpenCopy('en').busy);
    });
    it.each(['cancel', 'busy', 'unmount', 'href-change'] as const)('checks transaction ownership again when confirmation causes %s', async action => {
        const h = harness(); h.confirm.mockImplementationOnce(() => {
            if (action === 'cancel') h.cancel!(); else if (action === 'busy') h.refs.library.current = true; else if (action === 'unmount') h.unmount();
            else (h.env.window as { location: { href: string } }).location.href += '?navigating=1';
            return true;
        });
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(draft('interrupted-confirm')))).event); unchanged(h);
        expect(h.confirm).toHaveBeenCalledOnce(); expect(h.jobs.pending).toBe(false);
    });
    it('does not ask to replace a pristine empty editor, and passes the actual parser result to restore and persist', async () => {
        const h = harness({ work: false }), input = draft('new-blank-document'), text = serializeEditorProject(input), expected = parseEditorProject(text)!;
        expect(h.hasWork!()).toBe(false); await h.open(fileEvent(Promise.resolve(text)).event);
        expect(h.confirm).not.toHaveBeenCalled(); expect(h.restore).toHaveBeenCalledWith(expected, expect.objectContaining({ width: 29, height: 29, preview: 'data:image/png;base64,prepared-preview' })); expect(h.persist).toHaveBeenCalledWith(expected);
        expect(decodeEditorPatternDraft(h.state.draft.editedPattern)).toEqual(decodeEditorPatternDraft(input.editedPattern));
        expect(h.state.palettes).toEqual(input.activePalettes); expect(h.order).toEqual(['finish', 'restore', 'persist']);
    });
    it('requires confirmation for an accepted all-transparent project with no remaining history', async () => {
        const h = harness({ work: false }); h.refs.accepted.current = true; h.confirm.mockReturnValue(false);
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(draft('replacement')))).event); unchanged(h); expect(h.confirm).toHaveBeenCalledOnce();
    });
    it.each(['hidden-rgb', 'source', 'palette-history', 'undo', 'redo', 'active-stroke'] as const)('detects live %s work even when the acceptance flag is false', kind => {
        const h = harness({ work: false });
        if (kind === 'hidden-rgb') h.pixels[0] = 17;
        else if (kind === 'source') (h.env.lastProcessedImageSrcRef as { current: string | null }).current = 'stored-source';
        else if (kind === 'palette-history') h.refs.paletteHistory.current.push({ marker: 'palette-edit', palettes: clonePalettes(palette()) });
        else if (kind === 'active-stroke') (h.env.activeStrokeRef as { current: unknown }).current = { pending: true };
        else { const colored = h.pixels.slice(); colored.set([17, 23, 99, 255]); h.history.push(createPatternPatch(colored, h.pixels)); if (kind === 'redo') h.history.undo(h.pixels); }
        expect(h.hasWork!()).toBe(true);
    });
    it('keeps protected locale recovery on rejection and clears only its key after an accepted valid project', async () => {
        const h = harness({ recovery: true }); h.refs.initial.current = false; h.confirm.mockReturnValueOnce(false);
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(draft('cancelled')))).event); unchanged(h); expect(h.refs.blocked.current).toBe(true);
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(draft('accepted')))).event);
        expect(h.refs.initial.current).toBe(true); expect(h.refs.blocked.current).toBe(false); expect(h.stored.has('locale-restore')).toBe(false); expect(h.stored.get('other-tool')).toBe('untouched');
    });
    it('an empty picker selection is cleared without reading, confirming or publishing', async () => {
        const h = harness(), selected = fileEvent(null); await h.open(selected.event);
        expect(selected.input.value).toBe(''); expect(selected.text).not.toHaveBeenCalled(); expect(h.confirm).not.toHaveBeenCalled(); unchanged(h);
    });
    it('a newer busy-rejected choice still invalidates the older successful file read', async () => {
        const h = harness(), read = deferred<string>(), firstRun = h.open(fileEvent(read.promise).event); h.refs.library.current = true;
        const newer = fileEvent(Promise.resolve(serializeEditorProject(draft('busy-B')))); await h.open(newer.event); expect(newer.text).not.toHaveBeenCalled();
        h.refs.library.current = false; read.resolve(serializeEditorProject(draft('old-A'))); await firstRun; unchanged(h); expect(h.error).toHaveBeenCalledOnce();
    });
    it('the real library-loading callback cancels a read even if loading finishes before that read', async () => {
        const h = harness(), read = deferred<string>(), run = h.open(fileEvent(read.promise).event);
        h.libraryLoading(true); expect(h.refs.library.current).toBe(true); h.libraryLoading(false); expect(h.refs.library.current).toBe(false);
        read.resolve(serializeEditorProject(draft('obsolete'))); await run; unchanged(h); expect(h.error).not.toHaveBeenCalled();
    });
    it.each(['cancel', 'unmount', 'href-change', 'busy'] as const)('preparation never publishes a late candidate after %s', async action => {
        const h = harness(), candidate = await h.makeCandidate(draft('detached')), prepared = deferred<PreparedEditorProjectFile>();
        h.prepare.mockImplementationOnce(() => prepared.promise);
        const run = h.open(fileEvent(Promise.resolve(serializeEditorProject(candidate.draft))).event); await vi.waitFor(() => expect(h.prepare).toHaveBeenCalledOnce(), { interval: 1 });
        unchanged(h); expect(h.confirm).not.toHaveBeenCalled();
        if (action === 'cancel') h.cancel(); else if (action === 'unmount') h.unmount(); else if (action === 'busy') h.refs.library.current = true;
        else (h.env.window as { location: { href: string } }).location.href += '?leaving=1';
        prepared.resolve(candidate); await run; unchanged(h); expect(h.write).not.toHaveBeenCalled();
        if (action !== 'busy') expect(h.error).not.toHaveBeenCalled();
    });
    it('only the newest detached candidate can commit when image preparation completes out of order', async () => {
        const h = harness(), a = await h.makeCandidate(draft('prepared-A')), b = await h.makeCandidate(draft('prepared-B'));
        const oldCandidate = deferred<PreparedEditorProjectFile>(), nextCandidate = deferred<PreparedEditorProjectFile>();
        h.prepare.mockImplementationOnce(() => oldCandidate.promise).mockImplementationOnce(() => nextCandidate.promise);
        const oldRun = h.open(fileEvent(Promise.resolve(serializeEditorProject(a.draft))).event); await vi.waitFor(() => expect(h.prepare).toHaveBeenCalledOnce(), { interval: 1 });
        const nextRun = h.open(fileEvent(Promise.resolve(serializeEditorProject(b.draft))).event); await vi.waitFor(() => expect(h.prepare).toHaveBeenCalledTimes(2), { interval: 1 });
        expect(h.prepare).toHaveBeenCalledTimes(2); nextCandidate.resolve(b); await nextRun; oldCandidate.resolve(a); await oldRun;
        expect(h.state.draft.fileName).toBe('prepared-B'); expect(h.write).toHaveBeenCalledOnce(); expect(h.restore).toHaveBeenCalledOnce(); expect(h.persist).toHaveBeenCalledOnce();
    });
    it('a newer preparation failure invalidates an older prepared result and only reports its current error', async () => {
        const h = harness(), a = await h.makeCandidate(draft('prepared-A')), oldCandidate = deferred<PreparedEditorProjectFile>(), nextCandidate = deferred<PreparedEditorProjectFile>();
        h.prepare.mockImplementationOnce(() => oldCandidate.promise).mockImplementationOnce(() => nextCandidate.promise);
        const oldRun = h.open(fileEvent(Promise.resolve(serializeEditorProject(a.draft))).event); await vi.waitFor(() => expect(h.prepare).toHaveBeenCalledOnce(), { interval: 1 });
        const nextRun = h.open(fileEvent(Promise.resolve(serializeEditorProject(draft('prepared-B')))).event); await vi.waitFor(() => expect(h.prepare).toHaveBeenCalledTimes(2), { interval: 1 });
        nextCandidate.reject(new Error('new decoder failed')); await nextRun; const currentError = h.state.error;
        oldCandidate.resolve(a); await oldRun; unchanged(h); expect(h.state.error).toBe(currentError); expect(h.error).toHaveBeenCalledOnce();
    });
    it('actual detached preparation catches a semantic board/grid mismatch accepted by the v1 parser', async () => {
        const input = { ...draft('wrong-board-grid'), boardWidth: 2 }, text = serializeEditorProject(input), h = harness();
        expect(parseEditorProject(text)).not.toBeNull(); await h.open(fileEvent(Promise.resolve(text)).event);
        unchanged(h); expect(h.prepare).toHaveBeenCalledOnce(); expect(h.confirm).not.toHaveBeenCalled(); expect(h.write).not.toHaveBeenCalled();
    });
    it('an image-only decoder failure occurs before confirming or replacing any part of the old document', async () => {
        const input: EditorDraft = { ...draft('broken-source'), sourceMode: 'image' as const, imageSrc: 'not-a-readable-image', editedPattern: null }, text = serializeEditorProject(input), h = harness();
        expect(parseEditorProject(text)).not.toBeNull(); h.prepareImage.mockRejectedValueOnce(new Error('image decode failed'));
        await h.open(fileEvent(Promise.resolve(text)).event); unchanged(h);
        expect(h.prepareImage).toHaveBeenCalledOnce(); expect(h.confirm).not.toHaveBeenCalled(); expect(h.write).not.toHaveBeenCalled(); expect(h.error).toHaveBeenCalledWith(getProjectOpenCopy('en').readError);
    });
    it('a saved grid still requires its source to decode before a file can replace current work', async () => {
        const input = { ...draft('broken-saved-source'), sourceMode: 'image' as const, imageSrc: 'unreadable-source' }, h = harness();
        h.prepareImage.mockRejectedValueOnce(new Error('image decode failed')); await h.open(fileEvent(Promise.resolve(serializeEditorProject(input))).event);
        unchanged(h); expect(h.prepareImage).toHaveBeenCalledOnce(); expect(h.confirm).not.toHaveBeenCalled();
    });
    it.each(['decline', 'cancel-during-prompt'] as const)('source generation confirmation can %s without preparing or replacing old work', async action => {
        const h = harness(), input: EditorDraft = { ...draft('legacy-image'), sourceMode: 'image' as const, imageSrc: 'data:image/png;base64,test', editedPattern: null };
        h.large.mockImplementationOnce(() => { if (action === 'cancel-during-prompt') h.cancel(); return action !== 'decline'; });
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(input))).event); unchanged(h);
        expect(h.large).toHaveBeenCalledWith(841, 'en'); expect(h.prepare).not.toHaveBeenCalled(); expect(h.confirm).not.toHaveBeenCalled();
    });
    it.each(['canvas-write', 'missing-canvas', 'missing-preview'] as const)('the candidate does not publish if %s fails', async failure => {
        const h = harness(), input = { ...draft('wide-candidate'), boardWidth: 2, editedPattern: encodeEditorProjectPattern(new Uint8ClampedArray(58 * 29 * 4), 58, 29) };
        if (failure === 'canvas-write') h.rejectWrite(); else if (failure === 'missing-canvas') h.canvasRef.current = null; else h.preview.mockReturnValueOnce('');
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(input))).event); unchanged(h); expect(h.sync).not.toHaveBeenCalled();
        if (failure === 'canvas-write') expect(h.write).toHaveBeenCalledTimes(2); else expect(h.write).not.toHaveBeenCalled();
    });
    it('commits the real prepared raster before finishing the old stroke and records the accepted source key once', async () => {
        const h = harness(), input = { ...draft('saved-image'), sourceMode: 'image' as const, imageSrc: 'data:image/png;base64,own-image' };
        const text = serializeEditorProject(input); await h.open(fileEvent(Promise.resolve(text)).event);
        expect(h.prepare).toHaveBeenCalledOnce(); expect(h.prepareImage).toHaveBeenCalledOnce(); expect(h.write).toHaveBeenCalledOnce();
        expect(h.write.mock.invocationCallOrder[0]).toBeLessThan(h.finish.mock.invocationCallOrder[0]);
        const [accepted, installed] = h.restore.mock.calls[0]; expect(installed.pixels).toEqual(decodeEditorPatternDraft(accepted.editedPattern));
        expect(installed.project).not.toBe(h.project); expect(installed.pixels).not.toBe(h.pixels); expect(h.pixels).toEqual(h.before.pixels);
        expect((h.env.lastProcessedImageSrcRef as { current: string }).current).toBe(input.imageSrc); expect(h.sourceKey.current).not.toBe('old-source-key'); expect(h.skipRebuild.current).toBe(true);
        expect(h.sync).toHaveBeenCalledOnce(); expect(h.persist).toHaveBeenCalledWith(accepted); expect(h.raster()).toEqual(installed.pixels);
    });
    it('keeps the legacy image-only format and persists the now-complete prepared cells directly', async () => {
        const h = harness(), input: EditorDraft = { ...draft('old-image-only'), sourceMode: 'image' as const, imageSrc: 'data:image/png;base64,old-image', editedPattern: null };
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(input))).event);
        expect(h.restore).toHaveBeenCalledOnce(); const [accepted, installed] = h.restore.mock.calls[0];
        expect(accepted.editedPattern).not.toBeNull(); expect(decodeEditorPatternDraft(accepted.editedPattern)).toEqual(installed.pixels);
        expect(h.persist).toHaveBeenCalledWith(accepted); expect(h.large).toHaveBeenCalledWith(841, 'en');
    });
    it.each(['en', 'de', 'fr', 'ja'] as const)('uses the actual %s native replacement copy at the real callback entry', async locale => {
        const h = harness(); h.env.locale = locale; h.confirm.mockReturnValue(false);
        await h.open(fileEvent(Promise.resolve(serializeEditorProject(draft('cancelled-localized')))).event);
        unchanged(h); expect(h.confirm).toHaveBeenCalledWith(getProjectOpenCopy(locale).replaceConfirm);
    });
});

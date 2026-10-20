import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { qrBeadCopy } from '../../lib/qr-beads/copy';
import * as navigation from '../../lib/qr-beads/locale-navigation';
import * as core from '../../lib/qr-beads/core';
import * as project from '../../lib/qr-beads/project';
import * as brandColors from '../../lib/qr-beads/brand-colors';
import { getLetterPalettes } from '../../lib/bead-letters/data';
import { qrBeadPaths } from '../../lib/qr-beads/routes';
import * as siteRoutes from '../../lib/i18n/routes';
import * as analytics from '../../lib/analytics';
import type { QrPalette, QrState } from '../../lib/qr-beads/types';
import type { SiteLocale } from '../../lib/i18n/locales';

type TestNode = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): TestNode[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== 'object' || !('props' in value)) return [];
    const node = value as TestNode;
    return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(text).join('');
    return value && typeof value === 'object' && 'props' in value ? text((value as TestNode).props.children) : '';
}

const palettes = getLetterPalettes();
const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('./QrWorkspace.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

function rawTransfer(state: QrState, saved = false, destination = qrBeadPaths.ja): string {
    const data = new Map<string, string>();
    const storage = {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => { data.set(key, value); },
        removeItem: (key: string) => { data.delete(key); },
    };
    expect(navigation.saveQrLocaleSnapshot({ state, saved }, destination, storage, palettes)).toBe(true);
    return data.get(navigation.QR_LOCALE_KEY)!;
}

// Execute the real component and handlers with React scheduling and the DOM
// boundary modeled. This is not a browser/canvas or BFCache-engine test.
function harness(raw?: string, locale: SiteLocale = 'ja') {
    const measurements = { generated: 0, exported: vi.fn() };
    const data = new Map<string, string>();
    if (raw !== undefined) data.set(navigation.QR_LOCALE_KEY, raw);
    data.set('bead-pattern-editor-draft-v1', 'unrelated editor work');
    const faults = { read: false, remove: false, write: false, access: false, download: false };
    const io = { reads: 0, writes: 0, removes: 0, filePicker: 0 };
    const storage = {
        getItem(key: string) { io.reads++; if (faults.read) throw new Error('read blocked'); return data.get(key) ?? null; },
        setItem(key: string, value: string) { io.writes++; if (faults.write) throw new Error('write blocked'); data.set(key, value); },
        removeItem(key: string) { io.removes++; if (faults.remove) throw new Error('remove blocked'); data.delete(key); },
    };
    const listeners = new Map<string, Set<(event: Event) => void>>();
    const microtasks: Array<() => void> = [];
    const downloads: Array<{ blob: Blob; filename: string }> = [];
    const checks = { pngs: 0, decodes: 0, files: 0, passed: true, pending: null as Promise<boolean> | null, signal: undefined as AbortSignal | undefined };
    const exporter = { createQrPng: async (_result: unknown, signal: AbortSignal) => { signal.throwIfAborted(); checks.pngs++; return new Blob(['png']); }, verifyQrPng: async (_blob: Blob, _text: string, signal: AbortSignal) => { signal.throwIfAborted(); checks.decodes++; checks.signal = signal; return checks.pending ?? checks.passed; }, exportQrPng: async () => { checks.files++; }, exportQrChartPng: async () => { checks.files++; }, exportQrPdf: async () => { checks.files++; } };
    const browser = {
        location: { href: 'https://fusebeadpatterns.art' + qrBeadPaths[locale] },
        get sessionStorage() { if (faults.access) throw new Error('storage access blocked'); return storage; },
        confirm: vi.fn(() => true),
        addEventListener(name: string, fn: (event: Event) => void) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(fn); },
        removeEventListener(name: string, fn: (event: Event) => void) { listeners.get(name)?.delete(fn); },
    };
    type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
    const slots: Slot[] = [];
    let index = 0, tree: unknown;
    let effects: Array<() => void> = [];
    const changed = (old: readonly unknown[] | undefined, next: readonly unknown[] | undefined) => !old || !next || old.length !== next.length || old.some((v, i) => v !== next[i]);
    const hooks = {
        useId: () => 'qr-recovery-test',
        useState(initial: unknown) {
            const slot = index++;
            if (!slots[slot]) slots[slot] = { value: typeof initial === 'function' ? (initial as () => unknown)() : initial };
            return [slots[slot].value, (next: unknown) => { slots[slot].value = typeof next === 'function' ? (next as (old: unknown) => unknown)(slots[slot].value) : next; }];
        },
        useRef(initial: unknown) {
            const slot = index++;
            if (!slots[slot]) slots[slot] = { value: { current: initial } };
            return slots[slot].value;
        },
        useMemo(fn: () => unknown, deps: readonly unknown[]) {
            const slot = index++, previous = slots[slot];
            if (!previous || changed(previous.deps, deps)) slots[slot] = { value: fn(), deps };
            return slots[slot].value;
        },
        useCallback(fn: unknown, deps: readonly unknown[]) {
            const slot = index++, previous = slots[slot];
            if (!previous || changed(previous.deps, deps)) slots[slot] = { value: fn, deps };
            return slots[slot].value;
        },
        useEffect(fn: () => void | (() => void), deps?: readonly unknown[]) {
            const slot = index++, previous = slots[slot];
            if (!previous || changed(previous.deps, deps)) {
                slots[slot] = { deps, cleanup: previous?.cleanup };
                effects.push(() => {
                    slots[slot].cleanup?.();
                    const cleanup = fn();
                    slots[slot].cleanup = typeof cleanup === 'function' ? cleanup : undefined;
                });
            }
        },
    };
    const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
    const modules: Record<string, unknown> = {
        '@/lib/analytics': { ...analytics, trackToolEvent: measurements.exported,
            createToolGenerationTracker: (tool: analytics.MeasuredTool) => { const tracker = analytics.createToolGenerationTracker(tool), record = tracker.record; tracker.record = () => { measurements.generated++; return record(); }; return tracker; } },
        react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/lib/qr-beads/copy': { qrBeadCopy },
        '@/lib/qr-beads/core': core,
        '@/lib/qr-beads/brand-colors': brandColors,
        '@/lib/qr-beads/locale-navigation': { ...navigation, saveQrLocaleSnapshot: (snapshot: unknown, ...args: Parameters<typeof navigation.saveQrLocaleSnapshot> extends [unknown, ...infer Rest] ? Rest : never) => navigation.saveQrLocaleSnapshot(JSON.parse(JSON.stringify(snapshot)), ...args) },
        '@/lib/qr-beads/export': exporter,
        '@/lib/qr-beads/project': {
            ...project,
            // The VM's UI records are copied to this host realm at the strict
            // project boundary; real validation/conversion/serialization runs.
            buildQrProject: (state: QrState, colors: QrPalette[]) => project.buildQrProject({ ...state }, colors),
            serializeQrProject: (state: QrState, colors: QrPalette[]) => project.serializeQrProject({ ...state }, colors),
        },
        '@/lib/core/printer/download': { downloadBlob: (blob: Blob, filename: string) => { if (faults.download) throw new Error('Download not started'); downloads.push({ blob, filename }); } },
        '@/lib/i18n/routes': siteRoutes,
        './QrWorkspace.module.css': { __esModule: true, default: new Proxy({}, { get: (_target, key) => String(key) }) },
    };
    const exports: Record<string, unknown> = {};
    new Script(compiled).runInNewContext({
        exports, require: (id: string) => modules[id] ?? require(id),
        window: browser, queueMicrotask: (fn: () => void) => { microtasks.push(fn); }, AbortController, Blob, Error, TextEncoder,
    });
    const Component = exports.default as (props: { locale: SiteLocale; palettes: QrPalette[] }) => unknown;
    function render() {
        index = 0; effects = [];
        tree = Component({ locale, palettes });
        for (const node of nodes(tree)) {
            const ref = node.props.ref as { current: unknown } | undefined;
            if (ref && node.type === 'canvas') ref.current = { getContext: (): null => null };
            else if (ref && node.type === 'input' && node.props.type === 'file') ref.current = { click() { io.filePicker++; } };
        }
        for (const effect of effects) effect();
    }
    function find(predicate: (node: TestNode) => boolean) {
        const found = nodes(tree).find(predicate);
        if (!found) throw new Error('Expected control not found');
        return found;
    }
    const button = (label: string) => find(node => node.type === 'button' && text(node) === label);
    const dispatch = (name: string, event: unknown) => { for (const listener of listeners.get(name) ?? []) listener(event as Event); };
    render();
    return {
        data, faults, io, downloads, checks, browser, render, button, storage, measurements,
        status: () => text(tree),
        disabled: () => find(node => node.type === 'fieldset').props.disabled,
        input: () => find(node => node.type === 'textarea').props.value,
        hasCanvas: () => nodes(tree).some(node => node.type === 'canvas'),
        canvas: () => find(node => node.type === 'canvas'),
        hasButton: (label: string) => nodes(tree).some(node => node.type === 'button' && text(node) === label),
        settle() { while (microtasks.length) { microtasks.shift()!(); render(); } },
        async flush() { for (let n = 0; n < 12; n++) await Promise.resolve(); render(); },
        changeSelect(label: string, value: string) { const outer = find(node => node.type === 'label' && text(node).startsWith(label)); const select = nodes(outer).find(node => node.type === 'select')!; (select.props.onChange as (event: unknown) => void)({ target: { value } }); render(); },
        click(label: string) { (button(label).props.onClick as () => void)(); render(); },
        changeText(value: string) { (find(node => node.type === 'textarea').props.onChange as (event: unknown) => void)({ target: { value } }); render(); },
        async loadFile(file: { size: number; text: () => Promise<string> }) {
            await (find(node => node.type === 'input' && node.props.type === 'file').props.onChange as (event: unknown) => Promise<void>)({ target: { value: 'selected.json', files: [file] } }); render();
        },
        language(href = qrBeadPaths.fr) {
            const event = { detail: { href, locale: 'fr' }, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
            dispatch(siteRoutes.LOCALE_NAVIGATION_EVENT, event); render();
            return event.defaultPrevented;
        },
        unload() {
            const event = { defaultPrevented: false, returnValue: undefined as string | undefined, preventDefault() { this.defaultPrevented = true; } };
            dispatch('beforeunload', event); return event.defaultPrevented;
        },
        pageshow() { dispatch('pageshow', { persisted: true }); render(); },
        unmount() { for (const slot of slots) slot?.cleanup?.(); },
    };
}

describe('QR workspace actual handlers, with modeled React/DOM and decoder boundary', () => {
    it('measures only the first successful input, and exports only after an actual prepared download', async () => {
        const h = harness(), copy = qrBeadCopy.ja; h.settle();
        expect(h.measurements.generated).toBe(0); expect(h.measurements.exported).not.toHaveBeenCalled();
        h.changeSelect(copy.paper, 'letter'); expect(h.measurements.generated).toBe(0);
        h.changeText(''); expect(h.measurements.generated).toBe(0);
        h.click(copy.downloadPdf); await h.flush(); expect(h.measurements.exported).not.toHaveBeenCalled();
        h.changeText('private QR content'); h.changeText('other private content'); h.render();
        expect(h.measurements.generated).toBe(1);
        h.click(copy.saveProject); await h.flush();
        expect(h.downloads).toHaveLength(1);
        expect(h.measurements.exported).toHaveBeenCalledExactlyOnceWith({ name: 'tool_export', tool: 'qr_beads', format: 'project' });
        h.measurements.exported.mockClear();
        h.faults.download = true;
        h.click(copy.saveProject); await h.flush();
        expect(h.downloads).toHaveLength(1); expect(h.measurements.exported).not.toHaveBeenCalled();
    });
    it.each(['en', 'de', 'fr', 'ja'] as const)('%s has bounded natural metadata and localized recovery', locale => {
        const copy = qrBeadCopy[locale];
        expect(copy.description.length).toBeLessThanOrEqual(160);
        expect(copy.steps).toHaveLength(3);
        expect(copy.notes.length).toBeGreaterThanOrEqual(3);
        const h = harness('broken', locale); h.settle();
        expect(h.status()).toContain(copy.restoreFailed);
        expect(h.disabled()).toBe(true);
        expect(h.hasCanvas()).toBe(false);
        h.click(copy.discardRestore);
        expect(h.disabled()).toBe(false);
        expect(h.status()).toContain(copy.savedState);
        expect(h.status()).not.toContain(copy.saved);
        const result = project.buildQrProject(project.defaultQrState(palettes), palettes);
        const boards = result.draft.boardWidth * result.draft.boardHeight;
        expect(h.status()).toContain(copy.pdfPages.replace('{count}', String(1 + boards)).replace('{boards}', String(boards)));
    });

    it('locks exports, file reads and language transfer before recovery', async () => {
        const state = { ...project.defaultQrState(palettes), text: 'private text' };
        const original = rawTransfer(state); const h = harness(original), copy = qrBeadCopy.ja;
        h.changeText('lost'); h.click(copy.saveProject); h.click(copy.check);
        const file = { size: 1, text: vi.fn(async () => 'ignored') }; await h.loadFile(file);
        expect(file.text).not.toHaveBeenCalled(); expect(h.downloads).toHaveLength(0);
        expect(h.language()).toBe(true); expect(h.io.writes).toBe(0);
        h.settle(); expect(h.input()).toBe('private text'); expect(h.unload()).toBe(true);
    });

    it('keeps invalid text visible and refuses stale exports after valid edits', async () => {
        const h = harness(), copy = qrBeadCopy.ja; h.settle();
        expect(h.hasCanvas()).toBe(true);
        h.changeText(''); expect(h.hasCanvas()).toBe(false); expect(h.status()).toContain(copy.emptyText);
        h.click(copy.saveProject); h.click(copy.downloadPng); h.click(copy.check); await h.flush();
        expect(h.downloads).toHaveLength(0); expect(h.checks.files).toBe(0); expect(h.checks.decodes).toBe(0);
        h.changeText('日'.repeat(1000)); expect(h.input()).toBe('日'.repeat(1000));
        expect(h.status()).toContain(copy.tooLong); expect(h.hasCanvas()).toBe(false);
    });

    it('checks one actual PNG boundary only on request and clears success after any color change', async () => {
        const h = harness(), copy = qrBeadCopy.ja; h.settle();
        h.changeText('https://example.org/private-path');
        expect(h.checks.decodes).toBe(0);
        h.click(copy.check); h.click(copy.check); await h.flush();
        expect(h.checks.pngs).toBe(1); expect(h.checks.decodes).toBe(1);
        expect(h.status()).toContain(copy.checkPassed);
        h.changeSelect(copy.foreground, '80-19001');
        expect(h.status()).not.toContain(copy.checkPassed); expect(h.hasCanvas()).toBe(false);
    });

    it('keeps scan failure distinct from validity and allows explicitly unverified download', async () => {
        const h = harness(), copy = qrBeadCopy.ja; h.settle(); h.checks.passed = false;
        h.click(copy.check); await h.flush();
        expect(h.status()).toContain(copy.checkFailed); expect(h.status()).not.toContain(copy.checkPassed);
        expect(h.button(copy.downloadPng).props.disabled).toBe(false);
        h.click(copy.downloadPng); await h.flush(); expect(h.checks.files).toBe(1);
        expect(h.status()).not.toContain(copy.checkPassed);
    });

    it('does not install a delayed check after cancellation or unmount', async () => {
        const h = harness(), copy = qrBeadCopy.ja; h.settle();
        let resolve!: (value: boolean) => void; h.checks.pending = new Promise<boolean>(done => { resolve = done; });
        h.click(copy.check); await h.flush(); expect(h.checks.decodes).toBe(1);
        h.click(copy.cancel); expect(h.checks.signal!.aborted).toBe(true);
        h.changeText('NEW INPUT'); resolve(true); await h.flush();
        expect(h.input()).toBe('NEW INPUT'); expect(h.status()).not.toContain(copy.checkPassed);
        expect(h.disabled()).toBe(false);
        h.checks.pending = new Promise<boolean>(done => { resolve = done; });
        h.click(copy.check); await h.flush(); h.unmount(); expect(h.checks.signal!.aborted).toBe(true);
        resolve(true); await h.flush(); expect(h.status()).not.toContain(copy.checkPassed);
    });

    it('saves an editor-compatible project without putting user text in the filename', async () => {
        const h = harness(), copy = qrBeadCopy.ja; h.settle();
        h.changeText('https://example.org/PRIVATE-TEXT'); h.click(copy.saveProject);
        expect(h.downloads).toHaveLength(1);
        const download = h.downloads[0];
        expect(download.filename).toMatch(/^qr-beads-\d+x\d+\.bead-pattern\.json$/);
        expect(download.filename).not.toContain('PRIVATE');
        const raw = await download.blob.text(); expect(project.parseQrProject(raw, palettes).text).toBe('https://example.org/PRIVATE-TEXT');
        expect(h.unload()).toBe(false);
        h.changeText('KEEP'); h.browser.confirm.mockReturnValue(false);
        await h.loadFile({ size: raw.length, text: async () => raw }); expect(h.input()).toBe('KEEP');
        h.browser.confirm.mockReturnValue(true);
        await h.loadFile({ size: raw.length, text: async () => raw }); expect(h.input()).toBe('https://example.org/PRIVATE-TEXT');
        expect(h.status()).not.toContain(copy.checkPassed);
    });

    it('keeps malformed recovery and source transfer write errors safe and separate', () => {
        const h = harness('damaged'), copy = qrBeadCopy.ja; h.settle(); h.faults.remove = true;
        h.click(copy.discardRestore); expect(h.disabled()).toBe(true); expect(h.status()).toContain(copy.discardFailed);
        h.faults.remove = false; h.click(copy.discardRestore); expect(h.disabled()).toBe(false);
        h.changeText('KEEP'); h.faults.write = true;
        expect(h.language()).toBe(true); expect(h.input()).toBe('KEEP'); expect(h.status()).toContain(copy.transferFailed);
        expect(h.disabled()).toBe(false); expect(h.data.get('bead-pattern-editor-draft-v1')).toBe('unrelated editor work');
    });

    it('rejects a bad project without replacement and ignores a file read completed after cancellation', async () => {
        const h = harness(), copy = qrBeadCopy.ja; h.settle(); h.changeText('KEEP');
        await h.loadFile({ size: 4, text: async () => '{bad' });
        expect(h.input()).toBe('KEEP'); expect(h.browser.confirm).not.toHaveBeenCalled();
        expect(h.status()).toContain(copy.invalidProject); expect(h.disabled()).toBe(false);
        let resolve!: (value: string) => void;
        const delayed = h.loadFile({ size: 20, text: () => new Promise<string>(done => { resolve = done; }) });
        h.render(); h.click(copy.cancel); h.changeText('NEW INPUT');
        resolve(project.serializeQrProject(project.defaultQrState(palettes), palettes)); await delayed;
        expect(h.input()).toBe('NEW INPUT'); expect(h.browser.confirm).not.toHaveBeenCalled();
        expect(h.disabled()).toBe(false);
    });

    it('restores unload protection after a language handoff and BFCache-style pageshow', () => {
        const h = harness(); h.settle(); h.changeText('UNSAVED');
        expect(h.unload()).toBe(true); expect(h.language()).toBe(false); expect(h.unload()).toBe(false);
        h.pageshow(); expect(h.unload()).toBe(true);
    });
});

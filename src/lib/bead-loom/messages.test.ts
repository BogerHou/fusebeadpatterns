import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import ts from 'typescript';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as core from './core';
import * as messages from './messages';
import * as transfer from './locale-navigation';
import * as pixelCore from '../pixel-grid/core';
import * as routes from '../i18n/routes';
import * as contrast from './contrast';
import { PixelGridError } from '../pixel-grid/errors';
import { pixelGridErrorMessage } from '../pixel-grid/messages';
import type { PixelLocaleStore } from '../pixel-grid/locale-storage';
const { LOOM_MESSAGES: copy, createLocalizedLoomChart, loomErrorMessage } = messages;

describe('bead loom native UI and errors', () => {
    it('keeps the English defaults and translates only newly created palette names', () => {
        expect(createLocalizedLoomChart('en')).toEqual(core.createChart());
        for (const locale of ['de', 'fr', 'ja'] as const) {
            const chart = createLocalizedLoomChart(locale);
            expect(chart.palette.map(color => color.name)).toEqual(copy[locale].defaults);
            expect(chart.cells).toEqual(core.createChart().cells);
            chart.palette[1].name = 'User 青'; chart.palette[1].code = 'PRIVATE-77';
            expect(core.parseProject(core.serializeProject(chart))).toEqual(chart);
        }
    });
    it('translates actual malformed project, image, dimensions and palette errors without displaying arbitrary details', () => {
        const chart = core.createChart();
        const operations = [
            () => core.parseProject('{'),
            () => core.parseProject('{"format":"wrong","version":1,"chart":{}}'),
            () => core.createChart(101, 1),
            () => core.validateChart({ ...chart, title: 'a'.repeat(81) }),
            () => core.validateChart({ ...chart, title: 'line\nbreak' }),
            () => core.validateChart({ ...chart, palette: [{ ...chart.palette[0], name: 'a'.repeat(61) }] }),
            () => core.validateChart({ ...chart, palette: [{ ...chart.palette[0], code: '\t' }] }),
            () => core.validateChart({ ...chart, cellAspect: 0.4 }),
            () => core.validateChart({ ...chart, palette: [] }),
            () => core.validateChart({ ...chart, extra: true }),
            () => core.convertImage({ width: 2049, height: 1, pixels: [] }, chart, 'fit'),
        ];
        for (const run of operations) {
            let failure: unknown; try { run(); } catch (error) { failure = error; }
            expect(failure).toBeInstanceOf(Error);
            expect(loomErrorMessage(failure, 'en')).toBe((failure as Error).message);
            for (const locale of ['de', 'fr', 'ja'] as const) {
                expect(loomErrorMessage(failure, locale)).not.toBe((failure as Error).message);
                expect(loomErrorMessage(failure, locale)).not.toBe(copy[locale].unknownError);
            }
        }
        for (const message of Object.keys(messages.LOOM_ERROR_TRANSLATIONS)) for (const locale of ['de', 'fr', 'ja'] as const) expect(loomErrorMessage(new Error(message), locale)).not.toBe(copy[locale].unknownError);
        for (const locale of ['de', 'fr', 'ja'] as const) {
            for (const error of [new Error('/private/file.png'), new TypeError('Decoder secret'), 'SECRET', null]) expect(loomErrorMessage(error, locale)).toBe(copy[locale].unknownError);
            const imageError = new PixelGridError('IMAGE_UNSUPPORTED_FORMAT');
            expect(loomErrorMessage(imageError, locale)).toBe(pixelGridErrorMessage(imageError, locale));
        }
    });
    it.each(['en', 'de', 'fr', 'ja'] as const)('renders all controls, native default names and accessible labels in %s', locale => {
        const html = renderToStaticMarkup(createElement(workspace(), { locale }));
        expect(html).toContain(`lang="${locale}"`);
        expect(html).toContain(copy[locale].setChart);
        expect(html).toContain(copy[locale].undo);
        expect(html).toContain(copy[locale].pdf);
        expect(html).toContain(copy[locale].leftToRight.replace('→', '→'));
        expect(html).toContain(copy[locale].defaults[1]);
        expect(html).toContain('id="loom-image-file"'); expect(html).toContain('id="loom-project-file"');
        if (locale !== 'en') for (const phrase of ['Beads across', 'Start with a blank chart', 'Draw the chart', 'Download chart PNG', 'Use your own bead names']) expect(html).not.toContain(phrase);
    });
});
function workspace(overrides: Record<string, unknown> = {}, globals: Record<string, unknown> = {}) {
    const source = readFileSync(new URL('../../components/bead-loom/LoomWorkspace.tsx', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const exports: Record<string, unknown> = {}, require = createRequire(import.meta.url);
    new Script(compiled).runInNewContext({ Error, ...globals, exports, require: (id: string) => {
        if (Object.hasOwn(overrides, id)) return overrides[id];
        if (id === '@/lib/bead-loom/core') return core;
        if (id === '@/lib/bead-loom/messages') return messages;
        if (id === '@/lib/bead-loom/locale-navigation') return transfer;
        if (id === '@/lib/pixel-grid/core') return pixelCore;
        if (id === '@/lib/bead-loom/contrast') return contrast;
        if (id === '@/lib/i18n/routes') return routes;
        if (id === '@/lib/analytics') return { trackBeadLoomExport: () => false };
        if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_target, name) => String(name) }) };
        return require(id);
    } });
    return exports.default as ComponentType<{ locale?: messages.LoomLocale }>;
}
type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== 'object' || !('props' in value)) return [];
    const node = value as Node; return [node, ...nodes(node.props.children)];
}
function content(value: unknown): string {
    if (Array.isArray(value)) return value.map(content).join('');
    if (value && typeof value === 'object' && 'props' in value) return content((value as Node).props.children);
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
function invoke(node: Node, key: string, event?: unknown) { return (node.props[key] as (event?: unknown) => unknown)(event); }
function storageArea(limit = Infinity) {
    const values = new Map<string, string>();
    return { values, getItem: (key: string) => values.get(key) ?? null, setItem(key: string, value: string) { if (value.length > limit) throw new Error('Quota'); values.set(key, value); }, removeItem(key: string) { values.delete(key); } };
}
function localStore() {
    const values = new Map<string, string>();
    const store: PixelLocaleStore = { async put(key, raw) { values.set(key, raw); }, async take(key) { const value = values.get(key) ?? null; values.delete(key); return value; }, async remove(key) { values.delete(key); } };
    return { values, store };
}
// Real component handlers and model/exported project JSON; only DOM drawing/image decoding are fixtures.
function interactive(locale: messages.LoomLocale, options: { storage?: ReturnType<typeof storageArea>; store?: PixelLocaleStore } = {}) {
    const slots: unknown[] = [], effects: (() => void | (() => void))[] = [], cleanups: (() => void)[] = [];
    let slot = 0, first = true, tree: unknown;
    const browserListeners = new Map<string, Set<(event: Event) => void>>(), documentListeners = new Map<string, Set<(event: Event) => void>>();
    const register = (map: typeof browserListeners, key: string, fn: (event: Event) => void) => { if (!map.has(key)) map.set(key, new Set()); map.get(key)!.add(fn); };
    const storage = options.storage ?? storageArea(), assignments: string[] = [], confirmations: string[] = [], exports: unknown[][] = [];
    const location = { href: `https://fusebeadpatterns.art${transfer.LOOM_LOCALE_PATHS[['en','de','fr','ja'].indexOf(locale)]}`, origin: 'https://fusebeadpatterns.art', pathname: transfer.LOOM_LOCALE_PATHS[['en','de','fr','ja'].indexOf(locale)], search: '', assign(href: string) { assignments.push(href); }, reload() { assignments.push('reload'); } };
    const browser = {
        location, sessionStorage: storage, confirm: (message: string) => { confirmations.push(message); return false; },
        addEventListener: (key: string, fn: (event: Event) => void) => register(browserListeners, key, fn), removeEventListener: (key: string, fn: (event: Event) => void) => browserListeners.get(key)?.delete(fn),
        clearTimeout() {}, setTimeout: () => 1,
    };
    class Anchor {
        target = ''; constructor(public href: string, private marked: boolean) {}
        closest() { return this; } hasAttribute(key: string) { return key === 'data-locale-navigation' && this.marked; }
    }
    const source = { width: 64, height: 32, pixels: new Uint8ClampedArray(64 * 32 * 4) };
    for (let i = 0; i < source.pixels.length; i++) source.pixels[i] = (i * 43) & 255;
    const blobs = new Map<string, Blob>(), downloads: { name: string; blob: Blob }[] = [];
    const document = {
        addEventListener: (key: string, fn: (event: Event) => void) => register(documentListeners, key, fn), removeEventListener: (key: string, fn: (event: Event) => void) => documentListeners.get(key)?.delete(fn),
        body: { appendChild() {} }, createElement: (kind: string) => kind === 'canvas' ? { width: 0, height: 0, getContext: () => ({ drawImage() {}, getImageData: () => ({ data: source.pixels.slice() }) }) } : { href: '', download: '', remove() {}, click(this: { href: string; download: string }) { downloads.push({ name: this.download, blob: blobs.get(this.href)! }); } },
    };
    const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
    const hooks = {
        useState(initial: unknown) { const index = slot++; if (first) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], (next: unknown) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }]; },
        useRef(initial: unknown) { const index = slot++; if (first) slots[index] = { current: initial }; return slots[index]; },
        useCallback: (fn: unknown) => fn,
        useEffectEvent(fn: (...args: unknown[]) => unknown) { const index = slot++; slots[index] = fn; return (...args: unknown[]) => (slots[index] as typeof fn)(...args); },
        useEffect: (fn: () => void | (() => void)) => { if (first) effects.push(fn); },
    };
    const transfers = { ...transfer, saveLargeLoomLocaleSnapshot: (snapshot: transfer.LoomLocaleSnapshot, href: string, area: typeof storage) => transfer.saveLargeLoomLocaleSnapshot(snapshot, href, area, options.store), consumeLargeLoomLocaleSnapshot: (href: string, area: typeof storage) => transfer.consumeLargeLoomLocaleSnapshot(href, area, options.store) };
    const Component = workspace({ react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx }, '@/lib/bead-loom/locale-navigation': transfers, '@/lib/bead-loom/export': {
        exportLoomPdf: async (...args: unknown[]) => { exports.push(args); return new Uint8Array([1]); }, exportLoomPng: async (...args: unknown[]) => { exports.push(args); return new Blob(['png']); },
    } }, {
        window: browser, document, location, Blob, Uint8ClampedArray, Element: Anchor, HTMLAnchorElement: Anchor,
        createImageBitmap: async () => ({ width: source.width, height: source.height, close() {} }),
        URL: class extends URL { static createObjectURL(blob: Blob) { const key = `blob:${blobs.size}`; blobs.set(key, blob); return key; } static revokeObjectURL(key: string) { blobs.delete(key); } },
    }) as (props: { locale: messages.LoomLocale }) => unknown;
    function render() { slot = 0; tree = Component({ locale }); if (first) { first = false; for (const effect of effects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } } }
    render(); render();
    const find = (predicate: (node: Node) => boolean) => { const node = nodes(tree).find(predicate); if (!node) throw new Error('Control not found'); return node; };
    const byId = (id: string) => find(node => node.props.id === id), button = (label: string) => find(node => node.type === 'button' && (content(node) === label || node.props['aria-label'] === label));
    async function settle() { await new Promise(resolve => setImmediate(resolve)); render(); }
    return {
        source, storage, assignments, confirmations, exports, render, settle, byId,
        click(label: string) { invoke(button(label), 'onClick'); render(); },
        change(id: string, value: string | boolean) { invoke(byId(id), 'onChange', { target: { value, checked: value } }); render(); },
        status: () => content(tree), disabled: () => find(node => node.type === 'fieldset').props.disabled,
        paint() { invoke(find(node => node.type === 'canvas'), 'onKeyDown', { key: 'Enter', preventDefault() {} }); render(); },
        move(key: string) { invoke(find(node => node.type === 'canvas'), 'onKeyDown', { key, preventDefault() {} }); render(); },
        switchLanguage(href: string, marked = true) {
            const event = { detail: { href }, target: new Anchor(new URL(href, location.href).href, marked), defaultPrevented: false, button: 0, preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() {} };
            for (const callback of documentListeners.get('click') ?? []) callback(event as unknown as Event);
            if (!event.defaultPrevented) for (const callback of browserListeners.get(routes.LOCALE_NAVIGATION_EVENT) ?? []) callback(event as unknown as Event);
            render(); return event;
        },
        beforeUnload() { const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }; for (const callback of browserListeners.get('beforeunload') ?? []) callback(event as unknown as Event); return event.defaultPrevented; },
        async loadImage() {
            const bytes = readFileSync(new URL('../pixel-grid/fixtures/aspect-64x32.png', import.meta.url));
            const file = { name: 'source-青.png', type: 'image/png', size: bytes.length, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) };
            invoke(byId('loom-image-file'), 'onChange', { target: { files: [file], value: file.name } }); await settle();
        },
        async loadProject(chart: core.LoomChart) {
            const raw = core.serializeProject(chart), file = { name: 'custom.bead-loom.json', size: Buffer.byteLength(raw), text: async () => raw };
            invoke(byId('loom-project-file'), 'onChange', { target: { files: [file], value: file.name } }); await settle();
        },
        async download(label: string) { const previous = downloads.length; invoke(button(label), 'onClick'); await vi.waitFor(() => expect(downloads.length).toBe(previous + 1)); render(); return downloads[previous]; },
        unmount() { for (const cleanup of cleanups) cleanup(); },
    };
}

describe('actual loom language events and project continuity', () => {
    it.each([['en', 'fr'], ['fr', 'ja'], ['ja', 'de'], ['de', 'en']] as const)('keeps chart/source/history/pending controls when switching %s → %s', async (from, to) => {
        const ui = interactive(from), custom = core.createChart(4, 3);
        custom.title = 'User title 青'; custom.palette[0].name = 'CUSTOM IVORY'; custom.palette[1].code = 'B-77';
        await ui.loadProject(custom); await ui.loadImage();
        ui.change('loom-columns', '7'); ui.change('loom-rows', '9'); ui.change('loom-aspect', '1.2');
        ui.change('loom-corner', 'top-right'); ui.change('loom-serpentine', false); ui.click(copy[from].apply);
        ui.change('loom-mode', 'crop'); ui.click(copy[from].convert);
        ui.click(copy[from].addColor(5)); ui.move('ArrowRight'); ui.move('ArrowDown'); ui.paint();
        ui.change('loom-columns', '17'); ui.change('loom-rows', ''); ui.change('loom-aspect', '1.6');
        ui.change('loom-corner', 'bottom-right'); ui.change('loom-serpentine', true); ui.change('loom-selected', 'color-c');
        ui.change('loom-replace-target', 'color-e'); ui.change('loom-zoom', '40'); ui.change('loom-paper', 'letter');
        ui.change('loom-mode', 'stretch'); ui.click(copy[from].pan);
        const destination = `https://fusebeadpatterns.art${transfer.LOOM_LOCALE_PATHS[['en','de','fr','ja'].indexOf(to)]}`;
        expect(ui.switchLanguage(destination).defaultPrevented).toBe(false); expect(ui.confirmations).toEqual([]);
        const raw = ui.storage.getItem(transfer.LOOM_LOCALE_STORAGE_KEY)!;
        const expected = transfer.consumeLoomLocaleSnapshot(destination, { getItem: () => raw, setItem() {}, removeItem() {} })!;
        expect(expected.saved).toEqual(custom); expect(expected.source!.pixels).toEqual(ui.source.pixels); expect(expected.cursor).toEqual([1, 1]);
        const target = interactive(to, { storage: ui.storage });
        expect(target.status()).toContain(copy[to].languageRestored); expect(target.status()).toContain(copy[to].dirty);
        expect(target.byId('loom-columns').props.value).toBe('17'); expect(target.byId('loom-rows').props.value).toBe('');
        expect(target.byId('loom-aspect').props.value).toBe('1.6'); expect(target.byId('loom-corner').props.value).toBe('bottom-right');
        expect(target.byId('loom-serpentine').props.checked).toBe(true); expect(target.byId('loom-selected').props.value).toBe('color-c');
        expect(target.byId('loom-replace-target').props.value).toBe('color-e'); expect(target.byId('loom-zoom').props.value).toBe('40');
        expect(target.byId('loom-paper').props.value).toBe('letter'); expect(target.byId('loom-mode').props.value).toBe('stretch');
        const saved = await target.download(copy[to].saveProject);
        expect(await saved.blob.text()).toBe(core.serializeProject(expected.chart));
        target.click(copy[to].undo);
        const undone = core.parseProject(await (await target.download(copy[to].saveProject)).blob.text());
        expect(undone).toEqual(expected.history.past.at(-1));
        target.click(copy[to].redo);
        expect(await (await target.download(copy[to].saveProject)).blob.text()).toBe(core.serializeProject(expected.chart));
        // Undo reset settings to the restored chart; reconversion proves the original source remains usable.
        target.click(copy[to].convert);
        expect(await (await target.download(copy[to].saveProject)).blob.text()).toBe(core.serializeProject(core.convertImage(ui.source, expected.chart, 'stretch')));
        await target.download(copy[to].pdf); await target.download(copy[to].png);
        expect(target.exports[0].slice(1)).toEqual(['letter', to]); expect(target.exports[1][1]).toBe(to);
        expect(target.switchLanguage('/patterns', false).defaultPrevented).toBe(false); // the exported project is now saved
        ui.unmount(); target.unmount();
    });
    it('commits bulk storage before navigation, then restores a complete original image and usable Undo', async () => {
        const records = localStore(), area = storageArea(512);
        let release!: () => void;
        const waiting: PixelLocaleStore = { ...records.store, async put(key, raw) { await new Promise<void>(resolve => { release = resolve; }); await records.store.put(key, raw, Date.now() + 300000); } };
        const ui = interactive('fr', { storage: area, store: waiting });
        await ui.loadImage(); ui.click(copy.fr.convert); ui.paint(); ui.change('loom-paper', 'letter');
        const destination = `https://fusebeadpatterns.art${transfer.LOOM_LOCALE_PATHS[1]}`;
        expect(ui.switchLanguage(destination).defaultPrevented).toBe(true);
        expect(ui.disabled()).toBe(true); expect(ui.status()).toContain(copy.fr.languageSaving); expect(ui.assignments).toEqual([]);
        expect(ui.switchLanguage(destination).defaultPrevented).toBe(true); expect(ui.beforeUnload()).toBe(true);
        release(); await ui.settle();
        expect(ui.assignments).toEqual([destination]); expect(records.values.size).toBe(1);
        const target = interactive('de', { storage: area, store: records.store });
        await target.settle(); expect(target.disabled()).toBe(false); expect(target.status()).toContain(copy.de.languageRestored);
        expect(target.byId('loom-paper').props.value).toBe('letter');
        target.click(copy.de.undo); expect(target.status()).toContain(copy.de.undone);
        target.click(copy.de.redo); expect(target.status()).toContain(copy.de.redone);
        target.click(copy.de.convert); expect(target.status()).toContain(copy.de.imageConverted);
        expect(records.values.size).toBe(0); expect(area.values.size).toBe(0);
        ui.unmount(); target.unmount();
    });
    it('keeps the source page intact if both storage options fail; unrelated links still ask in the current language', async () => {
        const area = storageArea(1), records = localStore();
        const blocked = { ...records.store, async put() { throw new Error('Storage unavailable'); } };
        const ui = interactive('ja', { storage: area, store: blocked }); ui.paint();
        expect(ui.switchLanguage(transfer.LOOM_LOCALE_PATHS[0]).defaultPrevented).toBe(true); await ui.settle();
        expect(ui.assignments).toEqual([]); expect(ui.disabled()).toBe(false); expect(ui.status()).toContain(copy.ja.languageFailed);
        const saved = core.parseProject(await (await ui.download(copy.ja.saveProject)).blob.text()); expect(saved.cells[0]).toBe('color-b');
        ui.move('ArrowRight'); ui.paint();
        expect(ui.switchLanguage('/guides', false).defaultPrevented).toBe(true); expect(ui.confirmations).toEqual([copy.ja.leave]);
        expect(ui.beforeUnload()).toBe(true); ui.unmount();
    });
    it('reports an actually missing transfer without pretending that the blank chart contains previous work', async () => {
        const area = storageArea(), records = localStore(), chart = core.createChart();
        const snapshot: transfer.LoomLocaleSnapshot = {
            chart, saved: chart, history: { past: [], future: [] }, columns: '11', rows: '31', aspect: '1',
            corner: 'bottom-left', serpentine: true, selected: 'color-b', replaceTarget: 'color-a', tool: 'paint', zoom: '18',
            cursor: [0, 0], source: null, sourceName: '', mode: 'fit', paper: 'a4',
        };
        expect(await transfer.saveLargeLoomLocaleSnapshot(snapshot, transfer.LOOM_LOCALE_PATHS[2], area, records.store)).toBe(true);
        records.values.clear();
        const target = interactive('fr', { storage: area, store: records.store }); await target.settle();
        expect(target.status()).toContain(copy.fr.languageRestoreUnavailable); expect(target.disabled()).toBe(false);
        const custom = core.createChart(7, 9); custom.title = 'Recovered from saved project';
        await target.loadProject(custom);
        expect(await (await target.download(copy.fr.saveProject)).blob.text()).toBe(core.serializeProject(custom));
        target.unmount();
    });
    it('locks a failed target restore, keeps its key through blocked editing/navigation, and reload restores all data', async () => {
        const area = storageArea(512), records = localStore(), ui = interactive('en', { storage: area, store: records.store });
        await ui.loadImage(); ui.click(copy.en.convert); ui.paint(); ui.change('loom-columns', '17'); ui.change('loom-paper', 'letter');
        const destination = `https://fusebeadpatterns.art${transfer.LOOM_LOCALE_PATHS[3]}`;
        ui.switchLanguage(destination); await ui.settle();
        const pointer = area.getItem(transfer.LOOM_LOCALE_STORAGE_KEY)!;
        const read = area.getItem;
        let temporarilyUnreadable = false;
        area.getItem = key => { if (temporarilyUnreadable) throw new Error('Session storage temporarily unavailable'); return read(key); };
        const unavailable = { ...records.store, async take() { temporarilyUnreadable = true; throw new Error('Temporary read error'); } };
        const target = interactive('ja', { storage: area, store: unavailable }); await target.settle();
        expect(target.disabled()).toBe(true); expect(target.status()).toContain(copy.ja.languageRestoreFailed);
        target.paint(); target.click(copy.ja.example); target.click(copy.ja.convert);
        expect(target.switchLanguage(transfer.LOOM_LOCALE_PATHS[1]).defaultPrevented).toBe(true); await target.settle();
        expect(target.disabled()).toBe(true); expect(target.status()).toContain(copy.ja.languageRestoreFailed);
        temporarilyUnreadable = false;
        expect(area.getItem(transfer.LOOM_LOCALE_STORAGE_KEY)).toBe(pointer); expect(target.assignments).toEqual([]);
        expect(target.beforeUnload()).toBe(true);
        expect(target.switchLanguage('/patterns', false).defaultPrevented).toBe(true); expect(target.confirmations).toEqual([copy.ja.leave]);
        target.click(copy.ja.retryLanguageRestore); expect(target.assignments).toEqual(['reload']); expect(target.beforeUnload()).toBe(false);
        target.unmount();
        const retry = interactive('ja', { storage: area, store: records.store }); await retry.settle();
        expect(retry.disabled()).toBe(false); expect(retry.status()).toContain(copy.ja.languageRestored);
        expect(retry.byId('loom-columns').props.value).toBe('17'); expect(retry.byId('loom-paper').props.value).toBe('letter');
        retry.click(copy.ja.undo); expect(retry.status()).toContain(copy.ja.undone);
        retry.click(copy.ja.redo); expect(retry.status()).toContain(copy.ja.redone);
        retry.click(copy.ja.convert); expect(retry.status()).toContain(copy.ja.imageConverted);
        expect(records.values.size).toBe(0); expect(area.values.size).toBe(0);
        ui.unmount(); retry.unmount();
    });
});

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import * as core from '../../lib/minecraft-banners/core';
import * as data from '../../lib/minecraft-banners/data';
import * as geometry from '../../lib/minecraft-banners/geometry';
import * as letters from '../../lib/minecraft-banners/letters';
import * as project from '../../lib/minecraft-banners/project';
import * as navigation from '../../lib/minecraft-banners/locale';
import * as routes from '../../lib/minecraft-banners/routes';
import { bannerCopy } from '../../lib/minecraft-banners/copy';
import * as siteRoutes from '../../lib/i18n/routes';
import type { SiteLocale } from '../../lib/i18n/locales';

type TestNode = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): TestNode[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== 'object' || !('props' in value)) return [];
    const node = value as TestNode; return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(text).join('');
    return value && typeof value === 'object' && 'props' in value ? text((value as TestNode).props.children) : '';
}
const require = createRequire(import.meta.url);
function compile(name: string) {
    return ts.transpileModule(readFileSync(new URL(name, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
}
const compiled = compile('./BannerWorkspace.tsx');

// Exercise real handlers and state transitions; browser rendering and loom use
// are separate acceptance steps, not simulated by this harness.
function harness(mode: routes.BannerMode = 'designer', locale: SiteLocale = 'en', inaccessible = false, initialTransfer?: string) {
    const values = new Map<string, string>(), downloads: Array<{ blob: Blob; filename: string }> = [];
    values.set('bead-pattern-editor-draft-v1', 'unrelated work');
    if (initialTransfer !== undefined) values.set(navigation.BANNER_TRANSFER_KEY, initialTransfer);
    const faults = { access: inaccessible, write: false, remove: false, silent: false };
    const storage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem(key: string, value: string) { if (faults.write) throw new Error('write denied'); if (!faults.silent) values.set(key, value); },
        removeItem(key: string) { if (faults.remove) throw new Error('remove denied'); values.delete(key); },
    };
    const listeners = new Map<string, Set<(event: Event) => void>>(), microtasks: Array<() => void> = [];
    const browser = {
        location: { href: 'https://fusebeadpatterns.art' + routes.bannerPaths[mode][locale], assign: vi.fn() },
        get sessionStorage() { if (faults.access) throw new Error('getter denied'); return storage; },
        confirm: vi.fn(() => true),
        addEventListener(name: string, fn: (event: Event) => void) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name)!.add(fn); },
        removeEventListener(name: string, fn: (event: Event) => void) { listeners.get(name)?.delete(fn); },
    };
    const document = { addEventListener: browser.addEventListener, removeEventListener: browser.removeEventListener };
    const exports = { calls: 0, pending: null as Promise<Uint8Array<ArrayBuffer>> | null };
    const encode = async () => { exports.calls++; return exports.pending ?? new Uint8Array([1, 2, 3]); };
    const exporter = { encodeBannerPng: encode, encodeLetterStripPng: encode, loomPlanJSON: (designs: core.BannerDesign[]) => JSON.stringify(designs) };
    type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
    const slots: Slot[] = []; let index = 0, tree: unknown, effects: Array<() => void> = [];
    const changed = (a?: readonly unknown[], b?: readonly unknown[]) => !a || !b || a.length !== b.length || a.some((v, i) => v !== b[i]);
    const hooks = {
        useId: () => 'banner-test',
        useState(initial: unknown) {
            const i = index++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? (initial as () => unknown)() : initial };
            return [slots[i].value, (value: unknown) => { slots[i].value = typeof value === 'function' ? (value as (previous: unknown) => unknown)(slots[i].value) : value; }];
        },
        useRef(initial: unknown) { const i = index++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
        useCallback(fn: unknown, deps: readonly unknown[]) { const i = index++; if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { value: fn, deps }; return slots[i].value; },
        useEffect(fn: () => void | (() => void), deps?: readonly unknown[]) {
            const i = index++; if (slots[i] && !changed(slots[i].deps, deps)) return;
            const previous = slots[i]; slots[i] = { deps };
            effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn() || undefined; });
        },
    };
    const vmModule = { exports: {} as Record<string, unknown> };
    const imports: Record<string, unknown> = {
        react: hooks, '../../lib/i18n/routes': siteRoutes, '../../lib/minecraft-banners/core': core, '../../lib/minecraft-banners/data': data,
        '../../lib/minecraft-banners/geometry': geometry, '../../lib/minecraft-banners/letters': letters, '../../lib/minecraft-banners/project': project,
        '../../lib/minecraft-banners/locale': navigation, '../../lib/minecraft-banners/routes': routes, '../../lib/minecraft-banners/copy': { bannerCopy },
        '../../lib/minecraft-banners/export': exporter, '../../lib/core/printer/download': { downloadBlob: (blob: Blob, filename: string) => downloads.push({ blob, filename }) },
        './BannerWorkspace.module.css': { __esModule: true, default: {} },
    };
    new Script(`(function(require,module,exports,window,document,queueMicrotask){${compiled}\n})`).runInThisContext()((id: string) => imports[id] ?? require(id), vmModule, vmModule.exports, browser, document, (fn: () => void) => microtasks.push(fn));
    const Component = vmModule.exports.default as (props: { locale: SiteLocale; mode: routes.BannerMode }) => unknown;
    function render() { index = 0; effects = []; tree = Component({ locale, mode }); for (const effect of effects) effect(); return tree; }
    function flush() { render(); while (microtasks.length) microtasks.shift()!(); render(); }
    function button(label: string) { const result = nodes(tree).find(node => node.type === 'button' && text(node.props.children) === label); if (!result) throw new Error(`Missing button ${label}`); return result; }
    function field(label: string) { const node = nodes(tree).find(item => item.type === 'label' && text(item.props.children).startsWith(label)); const result = nodes(node?.props.children).find(item => item.type === 'select' || item.type === 'input'); if (!result) throw new Error(`Missing field ${label}`); return result; }
    function click(label: string) { const node = button(label); if (node.props.disabled) throw new Error(`Disabled ${label}`); const result = (node.props.onClick as () => unknown)(); flush(); return result; }
    function change(label: string, value: string) { (field(label).props.onChange as (event: unknown) => void)({ target: { value } }); flush(); }
    function dispatch(name: string, event: Event) { for (const fn of listeners.get(name) ?? []) fn(event); flush(); }
    flush();
    return { copy: bannerCopy[locale], values, faults, storage, browser, exports, downloads, button, field, click, change, dispatch, flush, nodes: () => nodes(tree), text: () => text(tree),
        open: (file: { size: number; text: () => Promise<string> }) => { const input = nodes(tree).find(node => node.type === 'input' && node.props.type === 'file')!; return (input.props.onChange as (event: unknown) => Promise<void>)({ target: { files: [file], value: 'file.json' } }); },
        dispose: () => { for (const slot of slots) slot?.cleanup?.(); },
    };
}

describe('banner workspace state and downloads', () => {
    it('lets an explicit blank start work even when storage is inaccessible, while blocking unsafe page transfer', () => {
        const h = harness('designer', 'en', true);
        expect(h.button(h.copy.add).props.disabled).toBe(true); h.click(h.copy.startBlank);
        expect(h.button(h.copy.add).props.disabled).toBe(false); expect(h.text()).toContain(h.copy.recordKept);
        h.click(h.copy.add); expect(h.text()).toContain(h.copy.unsaved);
        const event = new Event(siteRoutes.LOCALE_NAVIGATION_EVENT, { cancelable: true }); Object.assign(event, { detail: { href: routes.bannerPaths.designer.de } });
        h.dispatch(siteRoutes.LOCALE_NAVIGATION_EVENT, event); expect(event.defaultPrevented).toBe(true); expect(h.text()).toContain(h.copy.transferFailed);
        expect(h.values.get('bead-pattern-editor-draft-v1')).toBe('unrelated work'); h.dispose();
    });
    it('preserves unsupported text in project saves and blocks exporting a stale valid word', async () => {
        const h = harness('letters'); h.change(h.copy.text, 'A 🧵');
        expect(h.text()).toContain(h.copy.errorCharacters); expect(h.field(h.copy.text).props.value).toBe('A 🧵');
        expect(h.button(h.copy.wordPng).props.disabled).toBe(true); expect(h.button(h.copy.json).props.disabled).toBe(true);
        h.click(h.copy.project); await Promise.resolve(); h.flush();
        expect(h.downloads).toHaveLength(1); expect(project.parseBannerProject(await h.downloads[0].blob.text()).letters.text).toBe('A 🧵');
        expect(h.exports.calls).toBe(0); h.dispose();
    });
    it('leaves an accessible expired transfer untouched on blank-start, and carries new work only after explicit discard', () => {
        const old = project.defaultBannerWorkspace(); old.design.base = 'green'; old.letters.text = 'KEEP';
        const raw = JSON.stringify({ version: 1, destination: routes.bannerPaths.designer.en, savedAt: Date.now() - 300_001, saved: false, project: project.serializeBannerProject(old) });
        const h = harness('designer', 'en', false, raw);
        expect(h.text()).toContain(h.copy.recoveryFailed); h.click(h.copy.startBlank);
        expect(h.field(h.copy.base).props.value).toBe('white'); expect(h.field(h.copy.base).props.disabled).toBe(false);
        expect(h.values.get(navigation.BANNER_TRANSFER_KEY)).toBe(raw);
        const target = 'https://fusebeadpatterns.art' + routes.bannerPaths.letters.ja;
        const blocked = new Event(siteRoutes.LOCALE_NAVIGATION_EVENT, { cancelable: true }); Object.assign(blocked, { detail: { href: target } });
        h.dispatch(siteRoutes.LOCALE_NAVIGATION_EVENT, blocked); expect(blocked.defaultPrevented).toBe(true);
        expect(h.values.get(navigation.BANNER_TRANSFER_KEY)).toBe(raw);
        h.click(h.copy.discardTransfer); expect(h.values.has(navigation.BANNER_TRANSFER_KEY)).toBe(false);
        const allowed = new Event(siteRoutes.LOCALE_NAVIGATION_EVENT, { cancelable: true }); Object.assign(allowed, { detail: { href: target } });
        h.dispatch(siteRoutes.LOCALE_NAVIGATION_EVENT, allowed); expect(allowed.defaultPrevented).toBe(false);
        expect(navigation.readBannerTransfer(target, h.storage)!.workspace).toEqual(project.defaultBannerWorkspace());
        expect(h.values.get('bead-pattern-editor-draft-v1')).toBe('unrelated work'); h.dispose();
    });
    it('prevents duplicate exports and suppresses late output after cancellation', async () => {
        const h = harness(); let resolve!: (value: Uint8Array<ArrayBuffer>) => void;
        h.exports.pending = new Promise(done => { resolve = done; });
        h.click(h.copy.png); expect(h.exports.calls).toBe(1); expect(h.button(h.copy.png).props.disabled).toBe(true);
        h.click(h.copy.cancel); h.change(h.copy.base, 'blue'); resolve(new Uint8Array([1])); await Promise.resolve(); await Promise.resolve(); h.flush();
        expect(h.downloads).toHaveLength(0); expect(h.field(h.copy.base).props.value).toBe('blue'); h.dispose();
    });
    it('checks project byte size before reading and keeps current work after malformed import', async () => {
        const h = harness(); h.change(h.copy.base, 'lime'); const read = vi.fn(async () => '{}');
        await h.open({ size: project.BANNER_PROJECT_MAX_BYTES + 1, text: read }); h.flush();
        expect(read).not.toHaveBeenCalled(); expect(h.field(h.copy.base).props.value).toBe('lime'); expect(h.text()).toContain(h.copy.invalidProject);
        await h.open({ size: 2, text: read }); h.flush(); expect(h.field(h.copy.base).props.value).toBe('lime'); expect(h.browser.confirm).not.toHaveBeenCalled(); h.dispose();
    });
    it('validates first, keeps the unsaved workspace locked pending an inline decision, and cancels without replacing it', async () => {
        const h = harness(); h.change(h.copy.base, 'orange'); h.click(h.copy.add);
        const next = project.defaultBannerWorkspace(); next.design.base = 'blue'; next.letters.text = 'NEW';
        const raw = project.serializeBannerProject(next);
        await h.open({ size: raw.length, text: async () => raw }); h.flush();
        expect(h.browser.confirm).not.toHaveBeenCalled(); expect(h.text()).toContain(h.copy.replaceQuestion);
        expect(h.field(h.copy.base).props.value).toBe('orange'); expect(h.field(h.copy.base).props.disabled).toBe(true);
        expect(h.button(h.copy.project).props.disabled).toBe(true); expect(h.button(h.copy.add).props.disabled).toBe(true);
        h.click(h.copy.cancel); expect(h.field(h.copy.base).props.disabled).toBe(false); expect(h.text()).not.toContain(h.copy.replaceQuestion);
        h.click(h.copy.project); h.flush();
        const kept = project.parseBannerProject(await h.downloads[0].blob.text());
        expect(kept.design).toEqual({ base: 'orange', layers: [{ pattern: 'stripe_center', color: 'black' }] });
        expect(kept.activeLayer).toBe(1); expect(kept.letters.text).toBe('HELLO'); h.dispose();
    });
    it('installs a confirmed project once and clears history, without letting a repeated old confirm overwrite later work', async () => {
        const h = harness(); h.change(h.copy.base, 'orange');
        const next = project.defaultBannerWorkspace(); next.design.base = 'red'; next.letters.text = 'BG';
        const raw = project.serializeBannerProject(next);
        await h.open({ size: raw.length, text: async () => raw }); h.flush();
        const accept = h.button(h.copy.replaceProject).props.onClick as () => void;
        h.click(h.copy.replaceProject); expect(h.field(h.copy.base).props.value).toBe('red');
        expect(h.button(h.copy.undo).props.disabled).toBe(true); expect(h.text()).toContain(h.copy.saved);
        h.change(h.copy.base, 'cyan'); accept(); h.flush(); expect(h.field(h.copy.base).props.value).toBe('cyan');
        expect(h.browser.confirm).not.toHaveBeenCalled(); h.dispose();
    });
    it('opens valid projects directly when there are no unsaved changes', async () => {
        const h = harness(), next = project.defaultBannerWorkspace(); next.design.base = 'brown';
        const raw = project.serializeBannerProject(next);
        await h.open({ size: raw.length, text: async () => raw }); h.flush();
        expect(h.field(h.copy.base).props.value).toBe('brown'); expect(h.text()).not.toContain(h.copy.replaceQuestion);
        expect(h.text()).toContain(h.copy.loaded); expect(h.browser.confirm).not.toHaveBeenCalled(); h.dispose();
    });
    it('does not let a cancelled confirmation accept a newer pending project', async () => {
        const h = harness(); h.change(h.copy.base, 'lime');
        const first = project.defaultBannerWorkspace(); first.design.base = 'red';
        const second = project.defaultBannerWorkspace(); second.design.base = 'blue';
        const open = async (next: project.BannerWorkspace) => { const raw = project.serializeBannerProject(next); await h.open({ size: raw.length, text: async () => raw }); h.flush(); };
        await open(first); const oldAccept = h.button(h.copy.replaceProject).props.onClick as () => void; h.click(h.copy.cancel);
        await open(second); oldAccept(); h.flush();
        expect(h.field(h.copy.base).props.value).toBe('lime'); expect(h.text()).toContain(h.copy.replaceQuestion);
        h.click(h.copy.replaceProject); expect(h.field(h.copy.base).props.value).toBe('blue'); h.dispose();
    });
    it('clears an already prepared replacement on pagehide and ignores its old confirm handler', async () => {
        const h = harness(); h.change(h.copy.base, 'lime');
        const next = project.defaultBannerWorkspace(); next.design.base = 'red'; const raw = project.serializeBannerProject(next);
        await h.open({ size: raw.length, text: async () => raw }); h.flush();
        const accept = h.button(h.copy.replaceProject).props.onClick as () => void;
        h.dispatch('pagehide', new Event('pagehide')); h.dispatch('pageshow', new Event('pageshow')); accept(); h.flush();
        expect(h.field(h.copy.base).props.value).toBe('lime'); expect(h.field(h.copy.base).props.disabled).toBe(false); expect(h.text()).not.toContain(h.copy.replaceQuestion); h.dispose();
    });
    it('does not resume a pending import after a pagehide/pageshow cycle', async () => {
        const h = harness(); let resolve!: (value: string) => void;
        const next = project.defaultBannerWorkspace(); next.design.base = 'red';
        const opening = h.open({ size: 300, text: () => new Promise(done => { resolve = done; }) });
        h.dispatch('pagehide', new Event('pagehide')); h.dispatch('pageshow', new Event('pageshow'));
        resolve(project.serializeBannerProject(next)); await opening; h.flush();
        expect(h.field(h.copy.base).props.value).toBe('white'); expect(h.text()).toContain(h.copy.cancelled); h.dispose();
    });
    it('keeps existing work and prevents navigation when a transfer write is silently ignored', () => {
        const h = harness(); h.change(h.copy.base, 'orange'); h.faults.silent = true;
        const event = new Event(siteRoutes.LOCALE_NAVIGATION_EVENT, { cancelable: true }); Object.assign(event, { detail: { href: routes.bannerPaths.letters.fr } });
        h.dispatch(siteRoutes.LOCALE_NAVIGATION_EVENT, event);
        expect(event.defaultPrevented).toBe(true); expect(h.field(h.copy.base).props.value).toBe('orange');
        const leave = new Event('beforeunload', { cancelable: true }); h.dispatch('beforeunload', leave); expect(leave.defaultPrevented).toBe(true); h.dispose();
    });
    it('undoes complete workspace transactions rather than only the rendered layer', () => {
        const h = harness(); h.change(h.copy.base, 'red'); h.click(h.copy.add);
        h.click(h.copy.undo); expect(h.text()).toContain(h.copy.empty); expect(h.field(h.copy.base).props.value).toBe('red');
        h.click(h.copy.undo); expect(h.field(h.copy.base).props.value).toBe('white');
        h.click(h.copy.redo); expect(h.field(h.copy.base).props.value).toBe('red'); h.dispose();
    });
    it('labels both V panels and keeps the sixty-fourth actual banner in a full-length project', async () => {
        const h = harness('letters'); h.change(h.copy.text, 'V'.repeat(32));
        const secondPanels = h.nodes().filter(node => node.type === 'button' && node.props['aria-label'] === 'V · banner 2/2');
        expect(secondPanels).toHaveLength(32); expect(h.text()).toContain(h.copy.twoPanels);
        const strip = h.nodes().find(node => node.props.label === h.copy.wordPreview.replace('{count}', '64'))!;
        expect(strip.props.image).toMatchObject({ width: 1406, height: 40 });
        expect(h.nodes().some(node => node.props.role === 'region' && node.props['aria-label'] === h.copy.wordPreview.replace('{count}', '64') && node.props.tabIndex === 0)).toBe(true);
        (secondPanels.at(-1)!.props.onClick as () => void)(); h.flush();
        h.click(h.copy.project); await Promise.resolve(); h.flush();
        const restored = project.parseBannerProject(await h.downloads[0].blob.text());
        expect(restored.activeLetter).toBe(63); expect(restored.letters.text).toBe('V'.repeat(32));
        expect(letters.buildLetterBanners(restored.letters).filter(item => item.design)).toHaveLength(64); h.dispose();
    });
});

describe('server-rendered banner task pages', () => {
    const vmModule = { exports: {} as Record<string, unknown> };
    const imports: Record<string, unknown> = {
        '@/components/layout/SiteHeader': { __esModule: true, default: () => createElement('header') }, '@/components/layout/SiteFooter': { __esModule: true, default: () => createElement('footer') },
        '@/components/layout/Breadcrumbs': { __esModule: true, default: () => createElement('nav') }, '@/lib/i18n/routes': siteRoutes,
        '@/lib/minecraft-banners/copy': { bannerCopy }, '@/lib/minecraft-banners/routes': routes,
        './BannerWorkspace': { __esModule: true, default: ({ mode }: { mode: string }) => createElement('section', { 'data-banner-mode': mode }) },
    };
    new Script(`(function(require,module,exports){${compile('./BannerPage.tsx')}\n})`).runInNewContext()((id: string) => imports[id] ?? require(id), vmModule, vmModule.exports);
    const Page = vmModule.exports.default as (props: { locale: SiteLocale; mode: routes.BannerMode }) => ReturnType<typeof createElement>;
    for (const locale of ['en', 'de', 'fr', 'ja'] as const) for (const mode of ['designer', 'letters'] as const) it(`${locale} ${mode} has its own heading and full practical instructions`, () => {
        const html = renderToStaticMarkup(createElement(Page, { locale, mode })), page = bannerCopy[locale].pages[mode];
        expect(html.match(/<h1/g)).toHaveLength(1); expect(html).toContain(page.heading.replaceAll('&', '&amp;'));
        for (const step of page.steps) expect(html).toContain(step.replaceAll('&', '&amp;'));
        expect(html).toContain(`data-banner-mode="${mode}"`); expect(html).not.toContain('<img');
    });
});

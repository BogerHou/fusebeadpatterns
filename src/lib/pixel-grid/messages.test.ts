import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { inflateSync } from 'node:zlib';
import ts from 'typescript';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as core from './core';
import * as conversion from './conversion';
import * as messages from './messages';
import * as localeNavigation from './locale-navigation';
import type { PixelLocaleStore } from './locale-storage';
import * as localeRoutes from '../i18n/routes';
import { PixelGridError, PIXEL_GRID_ERROR_MESSAGES, type PixelGridErrorCode } from './errors';

const { PIXEL_GRID_MESSAGES: copy, GERMAN_PIXEL_GRID_ERRORS, FRENCH_PIXEL_GRID_ERRORS, JAPANESE_PIXEL_GRID_ERRORS, pixelGridErrorMessage, PixelGridUiError } = messages;

describe('pixel grid localization', () => {
    it('localizes German validation and browser failures without exposing arbitrary errors', () => {
        expect(Object.keys(GERMAN_PIXEL_GRID_ERRORS).sort()).toEqual(Object.keys(PIXEL_GRID_ERROR_MESSAGES).sort());
        for (const code of Object.keys(PIXEL_GRID_ERROR_MESSAGES) as PixelGridErrorCode[]) {
            const error = new PixelGridError(code);
            expect(pixelGridErrorMessage(error, 'de')).toBe(GERMAN_PIXEL_GRID_ERRORS[code]);
            expect(pixelGridErrorMessage(error, 'de')).not.toBe(error.message);
            expect(pixelGridErrorMessage(error, 'de')).not.toBe(copy.de.unknownError);
        }
        for (const code of Object.keys(copy.en.uiErrors) as (keyof typeof copy.en.uiErrors)[]) {
            expect(pixelGridErrorMessage(new PixelGridUiError(code), 'de')).toBe(copy.de.uiErrors[code]);
            expect(copy.de.uiErrors[code]).not.toBe(copy.en.uiErrors[code]);
        }
        for (const error of [new Error('/private/photo.png'), new TypeError('Decoder details'), 'SECRET', null]) {
            expect(pixelGridErrorMessage(error, 'de')).toBe(copy.de.unknownError);
        }
        expect(copy.de.visiblePixels(16384)).toBe('16.384 nicht transparente Pixel');
        expect(copy.de.exportDimensions(128, 64, 16)).toBe('2.048 × 1.024 Pixel (16×)');
    });
    it('translates every stable validation code while retaining each original English error', () => {
        expect(Object.keys(FRENCH_PIXEL_GRID_ERRORS).sort()).toEqual(Object.keys(PIXEL_GRID_ERROR_MESSAGES).sort());
        for (const code of Object.keys(PIXEL_GRID_ERROR_MESSAGES) as PixelGridErrorCode[]) {
            const error = new PixelGridError(code);
            expect(pixelGridErrorMessage(error, 'en')).toBe(PIXEL_GRID_ERROR_MESSAGES[code]);
            expect(pixelGridErrorMessage(error, 'fr')).toBe(FRENCH_PIXEL_GRID_ERRORS[code]);
            expect(pixelGridErrorMessage(error, 'fr')).not.toBe(error.message);
            expect(pixelGridErrorMessage(error, 'fr')).not.toBe(copy.fr.unknownError);
        }
    });

    it('does not display arbitrary browser messages, private paths or thrown values in French', () => {
        for (const error of [new Error('Failed at /private/photo.png'), new TypeError('Network failed'), 'SECRET', null, { code: 'IMAGE_FILE_SIZE', message: 'forged' }]) {
            expect(pixelGridErrorMessage(error, 'fr')).toBe(copy.fr.unknownError);
        }
        const futureError = new PixelGridError('INVALID_DIMENSIONS');
        Object.assign(futureError, { code: 'FUTURE_CODE', message: 'English detail' });
        expect(pixelGridErrorMessage(futureError, 'fr')).toBe(copy.fr.unknownError);
        expect(pixelGridErrorMessage(new Error('Existing English error'), 'en')).toBe('Existing English error');
        expect(pixelGridErrorMessage(new TypeError('Implementation detail'), 'en')).toBe(copy.en.unknownError);
    });

    it('localizes workspace-owned browser failures without changing their English messages', () => {
        for (const code of Object.keys(copy.en.uiErrors) as (keyof typeof copy.en.uiErrors)[]) {
            const error = new PixelGridUiError(code);
            expect(pixelGridErrorMessage(error, 'en')).toBe(copy.en.uiErrors[code]);
            expect(pixelGridErrorMessage(error, 'fr')).toBe(copy.fr.uiErrors[code]);
            expect(pixelGridErrorMessage(error, 'fr')).not.toBe(error.message);
        }
    });

    it('localizes runtime quantities, dimensions, cursor information and operation results', () => {
        expect(copy.en.visiblePixels(16384)).toBe('16,384 nontransparent pixels');
        expect(copy.fr.visiblePixels(16384)).toBe('16\u202f384 pixels non transparents');
        expect(copy.fr.exportDimensions(128, 64, 16)).toBe('2\u202f048 × 1\u202f024 pixels (16×)');
        expect(copy.fr.canvasAria(64, 32, 7, 9)).toContain('colonne 7, ligne 9');
        expect(copy.fr.imported('chat.png', 2048, 1024, 64, 32, 'crop')).toContain('2\u202f048 × 1\u202f024');
        expect(copy.fr.resized(true, 32, 64, 'crop')).toContain('recadrage au centre');
        expect(copy.fr.converted(64, 64, 16)).toContain('16 couleurs RVB');
        expect(copy.fr.exportedScaled(1024, 2048)).toContain('Téléchargement du PNG lancé');
        expect(copy.fr.leave).toContain('sans enregistrer');
    });

    it('preserves existing English dynamic success messages', () => {
        expect(copy.en.created(24, 40)).toBe('Created a blank 24 × 40 canvas. Undo restores the previous drawing.');
        expect(copy.en.imported('a.png', 128, 64, 16, 16, 'fit')).toBe('Imported a.png (128 × 64) → 16 × 16; kept proportions with transparent margins.');
        expect(copy.en.resized(false, 16, 32, 'stretch')).toBe('Resized the drawing to 16 × 32; stretched to fill. Undo restores your edits.');
        expect(copy.en.opened('a.json', 16, 16)).toBe('Opened a.json: 16 × 16. Undo restores the previous drawing.');
        expect(copy.en.exportedOriginal(16, 16)).toBe('Downloaded the original 16 × 16 PNG with no grid. Save a project to keep an editable copy.');
        expect(copy.en.exportedGrid(256, 256)).toBe('Downloaded a 256 × 256 grid PNG. Your original pixels are unchanged.');
    });

    it('localizes every validation and browser failure in Japanese without exposing raw errors', () => {
        expect(Object.keys(JAPANESE_PIXEL_GRID_ERRORS).sort()).toEqual(Object.keys(PIXEL_GRID_ERROR_MESSAGES).sort());
        for (const code of Object.keys(PIXEL_GRID_ERROR_MESSAGES) as PixelGridErrorCode[]) {
            const translated = pixelGridErrorMessage(new PixelGridError(code), 'ja');
            expect(translated).toBe(JAPANESE_PIXEL_GRID_ERRORS[code]);
            expect(translated).toMatch(/[ぁ-んァ-ヶ一-龯]/u);
            expect(translated).not.toBe(PIXEL_GRID_ERROR_MESSAGES[code]);
            expect(translated).not.toBe(copy.ja.unknownError);
        }
        for (const code of Object.keys(copy.en.uiErrors) as (keyof typeof copy.en.uiErrors)[]) {
            expect(pixelGridErrorMessage(new PixelGridUiError(code), 'ja')).toBe(copy.ja.uiErrors[code]);
            expect(copy.ja.uiErrors[code]).not.toBe(copy.en.uiErrors[code]);
        }
        const futureError = new PixelGridError('INVALID_DIMENSIONS');
        Object.assign(futureError, { code: 'FUTURE_CODE', message: 'Private browser detail' });
        for (const error of [new Error('/private/photo.png'), new TypeError('Decode failed'), 'SECRET', null, { code: 'IMAGE_FILE_SIZE', message: 'forged' }, futureError]) {
            expect(pixelGridErrorMessage(error, 'ja')).toBe(copy.ja.unknownError);
        }
    });

    it('reports real invalid imports and canvas sizes in Japanese', () => {
        const rejectedOperations = [
            { run: () => core.parseProject('{'), code: 'PROJECT_INVALID_JSON' },
            { run: () => core.parseProject('{"format":"bead-project","version":1}'), code: 'PROJECT_UNSUPPORTED_FORMAT' },
            { run: () => core.createGrid(129, 64), code: 'INVALID_DIMENSIONS' },
            { run: () => core.inspectImage(new Uint8Array([71, 73, 70, 56]), 'image/gif'), code: 'IMAGE_UNSUPPORTED_FORMAT' },
        ] as const;
        for (const operation of rejectedOperations) {
            let failure: unknown;
            try { operation.run(); } catch (error) { failure = error; }
            expect(failure).toBeInstanceOf(PixelGridError);
            expect(pixelGridErrorMessage(failure, 'ja')).toBe(JAPANESE_PIXEL_GRID_ERRORS[operation.code]);
        }
    });

    it('localizes Japanese runtime results and explains which data a project preserves', () => {
        expect(copy.ja.visiblePixels(16384)).toBe('透明以外のピクセル：16,384');
        expect(copy.ja.exportDimensions(128, 64, 16)).toBe('2,048 × 1,024ピクセル（16倍）');
        expect(copy.ja.canvasAria(64, 32, 7, 9)).toContain('7列目、9行目');
        expect(copy.ja.imported('ねこ.png', 2048, 1024, 64, 32, 'crop')).toContain('ねこ.png（2,048 × 1,024）');
        expect(copy.ja.resized(true, 32, 64, 'crop')).toContain('中央で切り抜きました');
        expect(copy.ja.converted(64, 64, 16)).toContain('16色');
        expect(copy.ja.exportedScaled(1024, 2048)).toContain('ダウンロードを開始しました');
        expect(copy.ja.leave).toContain('保存せずに移動');
        expect(copy.ja.converterProjectHelp).toContain('元画像、色数の設定、操作履歴は含まれません');
    });
});

// Render the real component with React's server renderer. Resolve its application
// aliases locally, without adding a DOM package or changing the project's test config.
function workspace(overrides: Record<string, unknown> = {}, globals: Record<string, unknown> = {}) {
    const source = readFileSync(new URL('../../components/pixel-grid/PixelGridWorkspace.tsx', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const exports: Record<string, unknown> = {};
    const require = createRequire(import.meta.url);
    new Script(compiled).runInNewContext({ ...globals, exports, require: (id: string) => {
        if (Object.hasOwn(overrides, id)) return overrides[id];
        if (id === '@/lib/pixel-grid/core') return core;
        if (id === '@/lib/pixel-grid/conversion') return conversion;
        if (id === '@/lib/pixel-grid/messages') return messages;
        if (id === '@/lib/pixel-grid/locale-navigation') return localeNavigation;
        if (id === '@/lib/i18n/routes') return localeRoutes;
        if (id === '@/lib/analytics') return { trackPixelGridExport: () => false };
        if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_target, name) => String(name) }) };
        return require(id);
    } });
    return exports.default as ComponentType<{ locale?: messages.PixelGridLocale; experience?: 'grid' | 'converter' }>;
}

describe('pixel grid initial user experience', () => {
    it('renders a complete German converter with localized controls and independent file inputs', () => {
        const html = renderToStaticMarkup(createElement(workspace(), { locale: 'de', experience: 'converter' }));
        expect(html).toContain('lang="de"');
        expect(html).toContain('64 × 64 Pixel');
        expect(html.indexOf('id="pixel-image-file"')).toBeLessThan(html.indexOf('<details'));
        expect(html.match(/<input[^>]*id="pixel-image-file"[^>]*>/)?.[0]).toContain('hidden=""');
        expect(html).toContain('Originalbild neu umwandeln');
        expect(html).toContain('PNG ohne Raster herunterladen');
        expect(html).toContain('aria-label="Rückgängig"');
        expect(html).toContain('aria-label="Gespeichertes Pixel-Grid-Projekt öffnen"');
        expect(html).not.toContain('Choose file');
    });
    it('keeps the English drawing defaults while exposing image conversion outside the folded settings', () => {
        const html = renderToStaticMarkup(createElement(workspace()));
        expect(html).toContain('16 × 16 pixels');
        expect(html).toContain('Canvas &amp; image settings');
        expect(html).toContain('Ready. Draw or import an image.');
        expect(html).toMatch(/id="pixel-show-grid"[^>]*checked=""/);
        expect(html).toContain('Save original-size PNG');
        expect(html).toContain('Save enlarged grid PNG');
        expect(html).toContain('New 16 × 16');
        expect(html).toContain('New 32 × 32');
        expect(html).toContain('New 24 × 40');
        expect(html).toContain('pixel-color-limit');
        expect(html).toContain('pixel-export-scale');
        expect(html).toMatch(/value="original" selected=""/);
        expect(html).toContain('Download PNG without grid');
        expect(html.indexOf('id="pixel-image-file"')).toBeLessThan(html.indexOf('<details'));
        expect(html).not.toMatch(/<details[^>]*open=/);
    });

    it('renders the French converter upload outside disclosure with 64 square, original colors and 8x PNG', () => {
        const html = renderToStaticMarkup(createElement(workspace(), { locale: 'fr', experience: 'converter' }));
        expect(html).toContain('lang="fr"');
        expect(html).toContain('64 × 64 pixels');
        expect(html.indexOf('id="pixel-image-file"')).toBeLessThan(html.indexOf('<details'));
        expect(html).not.toMatch(/id="pixel-show-grid"[^>]*checked=/);
        expect(html).toMatch(/value="original" selected=""/);
        expect(html).toMatch(/value="8" selected="">512 × 512 pixels \(8×\)/);
        expect(html).toContain('Reconvertir l’image d’origine');
        expect(html).toContain('Appliquer la limite au dessin');
        expect(html).toContain('aria-label="Annuler"');
        expect(html).toContain('aria-label="Zone de dessin défilante"');
        expect(html).toContain('historique des opérations');
        for (const phrase of ['Save your work', 'Unsaved changes', 'Canvas size', 'Drawing tools', 'Scrollable drawing area', 'Ready. Draw']) expect(html).not.toContain(phrase);
    });

    it('renders a complete Japanese converter with localized upload buttons and accessible controls', () => {
        const html = renderToStaticMarkup(createElement(workspace(), { locale: 'ja', experience: 'converter' }));
        expect(html).toContain('lang="ja"');
        expect(html).toContain('64 × 64ピクセル');
        expect(html.indexOf('id="pixel-image-file"')).toBeLessThan(html.indexOf('<details'));
        expect(html).toMatch(/<input[^>]*hidden=""[^>]*id="pixel-image-file"/);
        expect(html).toMatch(/<input[^>]*hidden=""[^>]*id="pixel-project-file"/);
        expect(html.match(/>ファイルを選ぶ<\/button>/g)).toHaveLength(2);
        expect(html).not.toMatch(/id="pixel-show-grid"[^>]*checked=/);
        expect(html).toMatch(/value="original" selected=""/);
        expect(html).toMatch(/value="8" selected="">512 × 512ピクセル（8倍）/);
        expect(html).toContain('元画像から再変換');
        expect(html).toContain('現在の画像を減色');
        expect(html).toContain('aria-label="元に戻す"');
        expect(html).toContain('aria-label="スクロールできる描画エリア"');
        expect(html).toContain('原寸のPNGを保存');
        expect(html).toContain('グリッド付きPNGを保存');
        expect(html).toContain('編集用プロジェクトを保存');
        expect(html).toContain('元画像、色数の設定、操作履歴は含まれません');
        for (const phrase of ['Save your work', 'Unsaved changes', 'Canvas size', 'Drawing tools', 'Choose file', 'Enregistrer', 'Reconvertir']) expect(html).not.toContain(phrase);
    });
});

// A narrow hook/DOM harness drives the actual component's event handlers. Canvas
// pixels and PNG/project encoders are real; browser decoding is the only fixture.
// Browser rendering and pointer ergonomics are covered separately by visual QA.
type TestNode = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): TestNode[] {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== 'object' || !('props' in value)) return [];
    const node = value as TestNode;
    return [node, ...nodes(node.props.children)];
}
function content(value: unknown): string {
    if (Array.isArray(value)) return value.map(content).join('');
    if (value && typeof value === 'object' && 'props' in value) return content((value as TestNode).props.children);
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
function invoke(node: TestNode, property: string, event?: unknown) {
    return (node.props[property] as (value?: unknown) => unknown)(event);
}
function interactiveWorkspace(props: { locale?: messages.PixelGridLocale; experience?: 'grid' | 'converter' } = { locale: 'fr', experience: 'converter' }, runtime: { storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>; largeStore?: PixelLocaleStore } = {}) {
    const text = copy[props.locale ?? 'en'];
    const slots: unknown[] = [], mountEffects: (() => void | (() => void))[] = [], cleanups: (() => void)[] = [];
    let slot = 0, first = true, tree: unknown;
    const callbacks: (() => void)[] = [];
    const blobs = new Map<string, Blob>(), downloads: { name: string; blob: Blob }[] = [];
    const events: unknown[] = [];
    const source = { width: 64, height: 32, pixels: new Uint8ClampedArray(64 * 32 * 4) };
    for (let i = 0; i < 64 * 32; i++) source.pixels.set([(i & 15) * 16, ((i >> 4) & 15) * 16, (i * 17) & 255, 255], i * 4);
    const context = { drawImage() {}, getImageData: () => ({ data: source.pixels.slice() }) };
    const browserListeners = new Map<string, Set<(event: Event) => void>>(), documentListeners = new Map<string, Set<(event: Event) => void>>();
    const register = (map: typeof browserListeners, name: string, callback: (event: Event) => void) => { if (!map.has(name)) map.set(name, new Set()); map.get(name)!.add(callback); };
    const stored = new Map<string, string>();
    const storage = runtime.storage ?? { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => { stored.set(key, value); }, removeItem: (key: string) => { stored.delete(key); } };
    const paths = { en: '/pixel-art-grid', de: '/de/pixel-art-generator', fr: '/fr/image-en-pixel-art', ja: '/ja/pixel-art-converter' };
    let confirmations = 0;
    const assignments: string[] = [];
    const location = { href: `https://fusebeadpatterns.art${paths[props.locale ?? 'en']}`, origin: 'https://fusebeadpatterns.art', pathname: paths[props.locale ?? 'en'], search: '', assign(href: string) { assignments.push(href); } };
    const browser = {
        location, sessionStorage: storage, confirm: () => { confirmations++; return false; },
        addEventListener: (name: string, callback: (event: Event) => void) => register(browserListeners, name, callback),
        removeEventListener: (name: string, callback: (event: Event) => void) => browserListeners.get(name)?.delete(callback),
        clearTimeout() {}, setTimeout: (callback: () => void) => { callbacks.push(callback); return callbacks.length; },
    };
    class Anchor {
        target = '';
        constructor(public href: string, private marked: boolean) {}
        closest() { return this; }
        hasAttribute(name: string) { return name === 'data-locale-navigation' && this.marked; }
    }
    const document = {
        addEventListener: (name: string, callback: (event: Event) => void) => register(documentListeners, name, callback),
        removeEventListener: (name: string, callback: (event: Event) => void) => documentListeners.get(name)?.delete(callback), body: { append() {} },
        createElement: (kind: string) => kind === 'canvas' ? { width: 0, height: 0, getContext: () => context } : {
            href: '', download: '', remove() {},
            click(this: { href: string; download: string }) { downloads.push({ name: this.download, blob: blobs.get(this.href)! }); },
        },
    };
    const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
    const hooks = {
        useState: (initial: unknown) => {
            const index = slot++;
            if (first) slots[index] = typeof initial === 'function' ? initial() : initial;
            return [slots[index], (next: unknown) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
        },
        useRef: (initial: unknown) => { const index = slot++; if (first) slots[index] = { current: initial }; return slots[index]; },
        useCallback: (callback: unknown) => callback,
        useEffectEvent: (callback: (...args: unknown[]) => unknown) => {
            const index = slot++; slots[index] = callback;
            return (...args: unknown[]) => (slots[index] as typeof callback)(...args);
        },
        useEffect: (effect: () => void | (() => void)) => { if (first) mountEffects.push(effect); },
        useSyncExternalStore: () => false,
    };
    const transfer = { ...localeNavigation,
        saveLargePixelLocaleSnapshot: (snapshot: localeNavigation.PixelLocaleSnapshot, href: string, area: typeof storage) => localeNavigation.saveLargePixelLocaleSnapshot(snapshot, href, area, runtime.largeStore),
        consumeLargePixelLocaleSnapshot: (href: string, area: typeof storage) => localeNavigation.consumeLargePixelLocaleSnapshot(href, area, runtime.largeStore),
    };
    const Component = workspace({ react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx }, '@/lib/pixel-grid/locale-navigation': transfer, '@/lib/analytics': { trackPixelGridExport: (event: unknown) => { events.push(event); return false; } } }, {
        window: browser, document, Blob, Uint8ClampedArray, location, Element: Anchor, HTMLAnchorElement: Anchor,
        createImageBitmap: async () => ({ width: source.width, height: source.height, close() {} }),
        URL: class extends URL {
            static createObjectURL(blob: Blob) { const key = `blob:${blobs.size}`; blobs.set(key, blob); return key; }
            static revokeObjectURL(key: string) { blobs.delete(key); }
        },
    }) as (props: { locale?: messages.PixelGridLocale; experience?: 'grid' | 'converter' }) => unknown;
    function render() { slot = 0; tree = Component(props); if (first) { first = false; for (const effect of mountEffects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } } }
    render(); render();
    const find = (predicate: (node: TestNode) => boolean) => { const node = nodes(tree).find(predicate); if (!node) throw new Error('Expected control not found'); return node; };
    const byId = (id: string) => find(node => node.props.id === id);
    const button = (label: string) => find(node => node.type === 'button' && (content(node) === label || node.props['aria-label'] === label));
    return {
        source, byId, button, render, downloads, events, storage, assignments,
        settle: async () => { await new Promise(resolve => setImmediate(resolve)); render(); },
        switchLanguage: (href: string, marked = true) => {
            const event = { detail: { href }, target: new Anchor(new URL(href, location.href).href, marked), defaultPrevented: false, button: 0, preventDefault() { this.defaultPrevented = true; }, stopImmediatePropagation() {} };
            for (const callback of documentListeners.get('click') ?? []) callback(event as unknown as Event);
            if (!event.defaultPrevented) for (const callback of browserListeners.get(localeRoutes.LOCALE_NAVIGATION_EVENT) ?? []) callback(event as unknown as Event);
            render();
            return { blocked: event.defaultPrevented, confirmations };
        },
        status: () => content(tree),
        unload: () => {
            const event = { defaultPrevented: false, returnValue: undefined as string | undefined, preventDefault() { this.defaultPrevented = true; } };
            for (const callback of browserListeners.get('beforeunload') ?? []) callback(event as unknown as Event);
            return event.defaultPrevented;
        },
        canvas: () => find(node => node.type === 'canvas'),
        click: (label: string) => { invoke(button(label), 'onClick'); render(); },
        change: (id: string, value: string) => { invoke(byId(id), 'onChange', { target: { value } }); render(); },
        loadImage: async () => {
            const bytes = readFileSync(new URL('./fixtures/aspect-64x32.png', import.meta.url));
            const file = { name: 'source.png', size: bytes.length, type: 'image/png', arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) };
            invoke(byId('pixel-image-file'), 'onChange', { currentTarget: { files: [file], value: 'source.png' } });
            await new Promise(resolve => setImmediate(resolve)); render();
        },
        loadProject: async (contents: string) => {
            const file = { name: 'saved.pixel-grid.json', size: Buffer.byteLength(contents), text: async () => contents };
            invoke(byId('pixel-project-file'), 'onChange', { currentTarget: { files: [file], value: file.name } });
            await new Promise(resolve => setImmediate(resolve)); render();
        },
        download: async (label: string) => {
            const previous = downloads.length;
            invoke(button(label), 'onClick');
            await vi.waitFor(() => expect(downloads.length).toBe(previous + 1));
            render();
            return downloads[previous];
        },
        paint: () => {
            const canvas = find(node => node.type === 'canvas');
            invoke(canvas, 'onKeyDown', { key: 'Enter', ctrlKey: false, metaKey: false, altKey: false, preventDefault() {} }); render();
        },
        currentProject: async () => {
            invoke(button(text.saveProject), 'onClick'); render();
            return core.parseProject(await downloads[downloads.length - 1].blob.text());
        },
        unmount: () => { for (const cleanup of cleanups) cleanup(); },
    };
}

describe('converter operation boundaries', () => {
    it('selecting a color limit does not change pixels; explicit current-drawing reduction is undoable', async () => {
        const ui = interactiveWorkspace();
        await ui.loadImage();
        const before = await ui.currentProject();
        expect(conversion.countVisibleColors(before)).toBeGreaterThan(16);
        ui.change('pixel-color-limit', '16');
        expect((await ui.currentProject()).pixels).toEqual(before.pixels);
        ui.click(copy.fr.reduceCurrent);
        expect(conversion.countVisibleColors(await ui.currentProject())).toBeLessThanOrEqual(16);
        ui.click(copy.fr.undo);
        expect((await ui.currentProject()).pixels).toEqual(before.pixels);
        ui.unmount();
    });

    it('detail buttons resample the original image instead of edited/reduced pixels, and Undo restores edits', async () => {
        const ui = interactiveWorkspace();
        await ui.loadImage(); ui.paint();
        const edited = await ui.currentProject();
        const originalFit = core.resizeImage(ui.source, 64, 64, 'fit');
        expect(edited.pixels).not.toEqual(originalFit.pixels);
        ui.change('pixel-color-limit', '16');
        ui.click(copy.fr.detailButton(32));
        const expected = conversion.reducePixelGridColors(core.resizeImage(ui.source, 32, 32, 'fit'), 16);
        expect(await ui.currentProject()).toEqual(expected);
        ui.click(copy.fr.undo);
        expect(await ui.currentProject()).toEqual(edited);
        ui.unmount();
    });

    it('creates an undoable blank canvas when detail buttons have no source image', async () => {
        const ui = interactiveWorkspace();
        ui.click(copy.fr.detailButton(128));
        expect(await ui.currentProject()).toEqual(core.createGrid(128, 128));
        ui.click(copy.fr.undo);
        expect(await ui.currentProject()).toEqual(core.createGrid(64, 64));
        ui.unmount();
    });
});

describe('language navigation through the actual workspace handlers', () => {
    it.each(['en', 'de', 'fr', 'ja'] as const)('protects a failed large restore in %s until its localized retry recovers the full workspace', async locale => {
        const small = new Map<string, string>(), records = new Map<string, string>();
        const storage = { getItem: (key: string) => small.get(key) ?? null, removeItem: (key: string) => { small.delete(key); }, setItem: (key: string, value: string) => {
            if (value.length > 1024) throw new Error('QuotaExceededError'); small.set(key, value);
        } };
        let readAttempts = 0, completeRetry: () => void;
        const retryRead = new Promise<void>(resolve => { completeRetry = resolve; });
        const largeStore: PixelLocaleStore = {
            async put(key, raw) { records.set(key, raw); },
            async take(key) {
                if (++readAttempts === 1) throw new Error('Temporary transaction timeout');
                await retryRead;
                const raw = records.get(key) ?? null; records.delete(key); return raw;
            },
            async remove(key) { records.delete(key); },
        };
        const first = interactiveWorkspace({ locale: 'fr', experience: 'converter' }, { storage, largeStore });
        await first.loadImage(); const original = await first.currentProject(); first.paint();
        const edited = core.createGrid(original.width, original.height, original.pixels);
        core.paintLine(edited, [0, 0], [0, 0], [240, 106, 69, 255]);
        first.change('pixel-width', '17'); first.change('pixel-height', '31'); first.change('pixel-image-mode', 'crop');
        first.change('pixel-color-limit', '16'); first.change('pixel-export-scale', '4'); first.change('pixel-alpha', '53');
        const destination = localeRoutes.localeRoutes[locale].pixelGrid!;
        expect(first.switchLanguage(destination).blocked).toBe(true);
        await first.settle();
        const pointer = storage.getItem(localeNavigation.PIXEL_LOCALE_STORAGE_KEY), raw = [...records.values()][0];
        const target = interactiveWorkspace({ locale, experience: locale === 'en' ? 'grid' : 'converter' }, { storage, largeStore });
        const text = copy[locale];
        await target.settle();
        expect(target.status()).toContain(text.languageRestoreFailed);
        expect(target.button(text.languageRetry).props.disabled).toBe(false);
        expect(target.byId('pixel-grid-workspace').props['aria-busy']).toBe(false);
        expect(target.button(text.saveProject).props.disabled).toBe(true);
        expect(target.byId('pixel-width').props.disabled).toBe(true);
        expect(target.canvas().props.inert).toBe(true);
        target.paint(); target.click(text.newBlank); target.click(text.saveProject); target.click(text.saveScaled);
        expect(target.downloads).toEqual([]);
        expect(target.events).toEqual([]);
        expect(target.unload()).toBe(true);
        expect(target.switchLanguage('/ja/pixel-art-converter')).toEqual({ blocked: true, confirmations: 0 });
        expect(target.switchLanguage('/de')).toEqual({ blocked: true, confirmations: 0 });
        expect(storage.getItem(localeNavigation.PIXEL_LOCALE_STORAGE_KEY)).toBe(pointer);
        expect([...records.values()]).toEqual([raw]);
        const workingGet = storage.getItem;
        storage.getItem = () => { throw new Error('Temporary session access failure'); };
        target.click(text.languageRetry); await target.settle();
        expect(target.status()).toContain(text.languageRestoreFailed);
        expect(target.button(text.languageRetry).props.disabled).toBe(false);
        expect(target.button(text.saveProject).props.disabled).toBe(true);
        expect(readAttempts).toBe(1);
        expect([...records.values()]).toEqual([raw]);
        storage.getItem = workingGet;
        target.click(text.languageRetry);
        expect(target.button(text.languageRetry).props.disabled).toBe(true);
        expect(target.status()).toContain(text.languageRestoring);
        expect(readAttempts).toBe(2);
        completeRetry!(); await target.settle();
        expect(target.status()).toContain(text.languageRestored);
        expect(target.status()).toContain(text.dirty);
        expect(target.canvas().props.inert).toBe(false);
        expect(target.byId('pixel-width').props.value).toBe('17');
        expect(target.byId('pixel-height').props.value).toBe('31');
        expect(target.byId('pixel-image-mode').props.value).toBe('crop');
        expect(target.byId('pixel-color-limit').props.value).toBe(16);
        expect(target.byId('pixel-export-scale').props.value).toBe(4);
        expect(target.byId('pixel-alpha').props.value).toBe(53);
        expect(await target.currentProject()).toEqual(edited);
        target.click(text.undo); expect(await target.currentProject()).toEqual(original);
        target.click(text.redo); expect(await target.currentProject()).toEqual(edited);
        target.change('pixel-width', '17'); target.change('pixel-height', '31');
        target.click(text.reconvert);
        expect(await target.currentProject()).toEqual(conversion.reducePixelGridColors(core.resizeImage(first.source, 17, 31, 'crop'), 16));
        expect(records.size).toBe(0); expect(small.size).toBe(0);
        first.unmount(); target.unmount();
    });

    it('waits for bulk storage before navigation, then restores source, edits and history in German', async () => {
        const small = new Map<string, string>(), records = new Map<string, string>();
        const storage = { getItem: (key: string) => small.get(key) ?? null, removeItem: (key: string) => { small.delete(key); }, setItem: (key: string, value: string) => {
            if (value.length > 1024) throw new Error('QuotaExceededError'); small.set(key, value);
        } };
        let completeWrite: () => void;
        const pending = new Promise<void>(resolve => { completeWrite = resolve; });
        const largeStore: PixelLocaleStore = {
            async put(key, raw) { await pending; records.set(key, raw); },
            async take(key) { const raw = records.get(key) ?? null; records.delete(key); return raw; },
            async remove(key) { records.delete(key); },
        };
        const first = interactiveWorkspace({ locale: 'fr', experience: 'converter' }, { storage, largeStore });
        await first.loadImage(); const original = await first.currentProject(); first.paint();
        first.change('pixel-width', '17'); first.change('pixel-height', '31');
        expect(first.switchLanguage('/de/pixel-art-generator')).toEqual({ blocked: true, confirmations: 0 });
        expect(first.status()).toContain(copy.fr.languageSaving);
        expect(first.assignments).toEqual([]);
        expect(first.button(copy.fr.saveProject).props.disabled).toBe(true);
        expect(first.switchLanguage('/ja/pixel-art-converter').blocked).toBe(true);
        completeWrite!(); await first.settle();
        expect(first.assignments).toEqual(['/de/pixel-art-generator']);
        const target = interactiveWorkspace({ locale: 'de', experience: 'converter' }, { storage, largeStore });
        await target.settle();
        expect(target.status()).toContain(copy.de.languageRestored);
        expect(target.status()).toContain(copy.de.dirty);
        expect(target.byId('pixel-width').props.value).toBe('17');
        expect(target.byId('pixel-height').props.value).toBe('31');
        expect(target.button(copy.de.reconvert).props.disabled).toBe(false);
        target.click(copy.de.undo); expect(await target.currentProject()).toEqual(original);
        target.click(copy.de.redo); expect((await target.currentProject()).pixels).not.toEqual(original.pixels);
        expect(records.size).toBe(0); expect(small.size).toBe(0);
        first.unmount(); target.unmount();
    });

    it.each([['fr', 'ja'], ['fr', 'de'], ['de', 'ja'], ['de', 'en']] as const)('keeps edited pixels, pending settings and source/history across %s → %s', async (from, to) => {
        const first = interactiveWorkspace({ locale: from, experience: 'converter' });
        const destination = localeRoutes.localeRoutes[to].pixelGrid!;
        const targetCopy = copy[to];
        await first.loadImage();
        const saved = await first.currentProject();
        first.paint();
        first.change('pixel-width', '17'); first.change('pixel-height', '31');
        first.change('pixel-color-limit', '16'); first.change('pixel-export-scale', '4');
        first.change('pixel-zoom', '24'); first.change('pixel-alpha', '53');
        expect(first.switchLanguage(destination)).toEqual({ blocked: false, confirmations: 0 });
        const target = interactiveWorkspace({ locale: to, experience: to === 'en' ? 'grid' : 'converter' }, { storage: first.storage });
        expect(target.byId('pixel-width').props.value).toBe('17');
        expect(target.byId('pixel-height').props.value).toBe('31');
        expect(target.byId('pixel-color-limit').props.value).toBe(16);
        expect(target.byId('pixel-export-scale').props.value).toBe(4);
        expect(target.byId('pixel-zoom').props.value).toBe('24');
        expect(target.byId('pixel-alpha').props.value).toBe(53);
        expect(target.status()).toContain(targetCopy.dirty);
        expect(target.button(targetCopy.reconvert).props.disabled).toBe(false);
        target.click(targetCopy.undo);
        expect(await target.currentProject()).toEqual(saved);
        target.click(targetCopy.redo);
        const edited = await target.currentProject();
        expect(edited.pixels).not.toEqual(saved.pixels);
        target.change('pixel-width', '17'); target.change('pixel-height', '31');
        target.click(targetCopy.reconvert);
        expect(await target.currentProject()).toEqual(conversion.reducePixelGridColors(core.resizeImage(first.source, 17, 31, 'fit'), 16));
        target.click(targetCopy.undo);
        expect(await target.currentProject()).toEqual(edited);
        first.unmount(); target.unmount();
    });

    it('blocks quota failures and in-flight work, while navigation to a home page retains the normal leave confirmation', async () => {
        const ui = interactiveWorkspace();
        const pending = ui.loadImage();
        expect(ui.switchLanguage('/ja/pixel-art-converter').blocked).toBe(true);
        expect(ui.status()).toContain(copy.fr.languageBusy);
        await pending;
        const original = await ui.currentProject(); ui.paint();
        const edited = await ui.currentProject();
        ui.paint();
        ui.storage.setItem = () => { throw new Error('QuotaExceededError'); };
        expect(ui.switchLanguage('/ja/pixel-art-converter')).toEqual({ blocked: true, confirmations: 0 });
        await ui.settle();
        expect(ui.status()).toContain(copy.fr.languageFailed);
        expect(await ui.currentProject()).toEqual(edited);
        ui.click(copy.fr.undo);
        expect(await ui.currentProject()).toEqual(original);
        ui.paint();
        expect(ui.switchLanguage('/de')).toEqual({ blocked: true, confirmations: 1 });
        expect(ui.switchLanguage('/ja/pixel-art-converter', false)).toEqual({ blocked: true, confirmations: 2 });
        ui.unmount();
    });
});

// Decode the downloaded Blob independently so the component must export the
// current drawing and selected scale, not just call a working encoder.
async function downloadedPixels(blob: Blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(bytes.buffer), chunks: Uint8Array[] = [];
    let width = 0, height = 0;
    for (let offset = 8; offset < bytes.length;) {
        const size = view.getUint32(offset);
        const kind = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString('ascii');
        if (kind === 'IHDR') { width = view.getUint32(offset + 8); height = view.getUint32(offset + 12); }
        if (kind === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + size));
        offset += size + 12;
    }
    const scanlines = inflateSync(Buffer.concat(chunks)), pixels = new Uint8ClampedArray(width * height * 4);
    const stride = width * 4 + 1;
    expect(scanlines.length).toBe(stride * height);
    for (let y = 0; y < height; y++) {
        expect(scanlines[y * stride]).toBe(0);
        pixels.set(scanlines.subarray(y * stride + 1, (y + 1) * stride), y * width * 4);
    }
    return { width, height, pixels };
}

describe('English drawing and image conversion share one preserved workspace', () => {
    it('imports original colors at 16 square, then reduces only on request with exact Undo and Redo', async () => {
        const ui = interactiveWorkspace({});
        await ui.loadImage();
        const original = await ui.currentProject();
        expect(original).toEqual(core.resizeImage(ui.source, 16, 16, 'fit'));
        expect(conversion.countVisibleColors(original)).toBeGreaterThan(8);
        ui.change('pixel-color-limit', '8');
        expect(await ui.currentProject()).toEqual(original);
        ui.click(copy.en.reduceCurrent);
        const reduced = await ui.currentProject();
        expect(conversion.countVisibleColors(reduced)).toBeLessThanOrEqual(8);
        ui.click(copy.en.undo);
        expect(await ui.currentProject()).toEqual(original);
        ui.click(copy.en.redo);
        expect(await ui.currentProject()).toEqual(reduced);
        ui.unmount();
    });

    it('reconverts from the source while preserving edited pixels and dimensions in history', async () => {
        const ui = interactiveWorkspace({});
        await ui.loadImage(); ui.paint();
        const edited = await ui.currentProject();
        ui.change('pixel-color-limit', '16');
        ui.change('pixel-width', '17'); ui.change('pixel-height', '31');
        expect(await ui.currentProject()).toEqual(edited);
        ui.click(copy.en.reconvert);
        const expected = conversion.reducePixelGridColors(core.resizeImage(ui.source, 17, 31, 'fit'), 16);
        expect(await ui.currentProject()).toEqual(expected);
        ui.click(copy.en.undo);
        expect(await ui.currentProject()).toEqual(edited);
        ui.change('pixel-color-limit', 'original');
        ui.click(copy.en.detailButton(32));
        expect(await ui.currentProject()).toEqual(core.resizeImage(ui.source, 32, 32, 'fit'));
        ui.click(copy.en.undo);
        expect(await ui.currentProject()).toEqual(edited);
        ui.unmount();
    });

    it('keeps ordinary resizing and blank-canvas operations independent of the selected color cap', async () => {
        const ui = interactiveWorkspace({});
        await ui.loadImage();
        const original = await ui.currentProject();
        ui.change('pixel-color-limit', '8');
        ui.change('pixel-width', '24'); ui.change('pixel-height', '40');
        ui.click(copy.en.resizeDrawing);
        const resized = await ui.currentProject();
        expect(resized).toEqual(core.resizeImage(original, 24, 40, 'fit'));
        expect(conversion.countVisibleColors(resized)).toBeGreaterThan(8);
        ui.click(copy.en.newSize(24, 40));
        expect(await ui.currentProject()).toEqual(core.createGrid(24, 40));
        ui.click(copy.en.undo);
        expect(await ui.currentProject()).toEqual(resized);
        ui.click(copy.en.undo);
        expect(await ui.currentProject()).toEqual(original);
        ui.unmount();
    });

    it('exports the old RGBA project as original and enlarged PNG without changing pixels or project format', async () => {
        const ui = interactiveWorkspace({});
        const contents = readFileSync(new URL('./fixtures/rgba-16x16.pixel-grid.json', import.meta.url), 'utf8');
        const original = core.parseProject(contents);
        await ui.loadProject(contents);
        ui.change('pixel-color-limit', '8');
        ui.change('pixel-export-scale', '4');
        expect(ui.button(copy.en.reconvert).props.disabled).toBe(true);
        const originalFile = await ui.download(copy.en.saveOriginal);
        expect(originalFile.name).toBe('pixel-16x16.png');
        expect(await downloadedPixels(originalFile.blob)).toEqual(original);
        const enlargedFile = await ui.download(copy.en.saveScaled);
        expect(enlargedFile.name).toBe('pixel-16x16-4x.png');
        const enlarged = await downloadedPixels(enlargedFile.blob);
        expect([enlarged.width, enlarged.height]).toEqual([64, 64]);
        for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
            const source = (Math.floor(y / 4) * 16 + Math.floor(x / 4)) * 4;
            expect(enlarged.pixels.slice((y * 64 + x) * 4, (y * 64 + x) * 4 + 4)).toEqual(original.pixels.slice(source, source + 4));
        }
        expect(await ui.currentProject()).toEqual(original);
        const saved = await ui.downloads.at(-1)!.blob.text();
        expect(Object.keys(JSON.parse(saved))).toEqual(['format', 'version', 'width', 'height', 'pixels']);
        for (const locale of ['de', 'fr', 'ja'] as const) {
            const translated = interactiveWorkspace({ locale, experience: 'converter' });
            await translated.loadProject(saved);
            expect(await translated.currentProject()).toEqual(original);
            translated.unmount();
        }
        ui.unmount();
    });
});

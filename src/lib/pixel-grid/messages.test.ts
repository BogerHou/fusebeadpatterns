import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { inflateSync } from 'node:zlib';
import ts from 'typescript';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as core from './core';
import * as conversion from './conversion';
import * as messages from './messages';
import * as printCopy from './print-copy';
import * as printPreferences from './print-preferences';
import type { createPixelGridPdf } from './pdf';
import * as localeNavigation from './locale-navigation';
import * as workspaceProject from './workspace-project';
import * as cropCopy from './crop-copy';
import * as sourceCrop from './source-crop';
import * as practice from './practice';
import * as practiceCopy from './practice-copy';
import * as beadCopy from './bead-copy';
import * as beadTransfer from './bead-transfer';
import * as beadConversion from './bead-conversion';
import * as editorConfig from '../editor/config';
import * as paletteDefaults from '../editor/palette-defaults';
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

    it.each(['en', 'de', 'fr', 'ja'] as const)('names both new tools and reports precise fill/pick results in %s', locale => {
        const text = copy[locale];
        expect(text.fill.length).toBeGreaterThan(0); expect(text.picker.length).toBeGreaterThan(0);
        expect(text.filled(16384)).toContain(text.number(16384));
        expect(text.picked('#123abc', 53)).toContain('#123abc');
        expect(text.picked('#123abc', 53)).toContain('53');
        expect(text.drawingHelp).toContain('B/E/F/I/P');
        expect(text.fillUnchanged.length).toBeGreaterThan(0);
        if (locale !== 'en') {
            expect(text.fill).not.toBe(copy.en.fill); expect(text.picker).not.toBe(copy.en.picker);
            expect(text.filled(2)).not.toBe(copy.en.filled(2));
            expect(text.picked('#000000', 0)).not.toBe(copy.en.picked('#000000', 0));
        }
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
        expect(copy.ja.converterProjectHelp).toContain('作業ファイルには元画像のピクセル、編集・印刷設定、履歴も含まれます');
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
        if (id === '@/lib/pixel-grid/errors') return { PixelGridError };
        if (id === '@/lib/pixel-grid/workspace-project') return {
            ...workspaceProject,
            // VM-owned UI records cross into the host-owned strict codec here.
            // Recreate their data in its realm; browser production has one realm.
            serializePixelWorkspaceProject: (snapshot: localeNavigation.PixelLocaleSnapshot, print: printPreferences.PixelGridPrintPreferences) => workspaceProject.serializePixelWorkspaceProject(
                localeNavigation.parsePixelWorkspaceSnapshot(localeNavigation.serializePixelWorkspaceSnapshot(snapshot)), { ...print }),
        };
        if (id === '@/lib/pixel-grid/conversion') return conversion;
        if (id === '@/lib/pixel-grid/crop-copy') return cropCopy;
        if (id === '@/lib/pixel-grid/source-crop') return sourceCrop;
        if (id === '@/lib/pixel-grid/practice') return practice;
        if (id === '@/lib/pixel-grid/practice-copy') return practiceCopy;
        if (id === './PixelPracticeProvider') return { usePixelPracticeRegistration() {} };
        if (id === '@/lib/pixel-grid/messages') return messages;
        if (id === '@/lib/pixel-grid/print-copy') return printCopy;
        if (id === '@/lib/pixel-grid/print-preferences') return printPreferences;
        if (id === '@/lib/pixel-grid/locale-navigation') return localeNavigation;
        if (id === '@/lib/pixel-grid/bead-copy') return beadCopy;
        if (id === '@/lib/pixel-grid/bead-transfer') return beadTransfer;
        if (id === '@/lib/pixel-grid/bead-conversion') return beadConversion;
        if (id === '@/lib/editor/config') return editorConfig;
        if (id === '@/lib/editor/palette-defaults') return paletteDefaults;
        // The separate modal is lazy-loaded in production. These tests drive
        // the workspace-owned boundary callbacks, not its modal rendering.
        if (id === 'next/dynamic') return { __esModule: true, default: (loader: () => unknown) => loader.toString().includes('PixelSourceCropDialog') ? 'pixel-crop-dialog' : 'pixel-bead-dialog' };
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
        expect(html).toContain(`aria-label="${copy.de.openProject}"`);
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
        expect(html).toContain(copy.fr.saveWorkspace);
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
        expect(html).toContain(copy.ja.saveWorkspace);
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
function interactiveWorkspace(props: { locale?: messages.PixelGridLocale; experience?: 'grid' | 'converter' } = { locale: 'fr', experience: 'converter' }, runtime: {
    storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
    largeStore?: PixelLocaleStore;
    href?: string;
    beadTransfer?: Partial<typeof beadTransfer>;
    fetch?: (href: string, options?: RequestInit) => Promise<{ ok: boolean; text: () => Promise<string> }>;
    assign?: (href: string) => void;
    createPdf?: typeof createPixelGridPdf;
    loadJapaneseFont?: () => Promise<string>;
    confirm?: () => boolean;
    practice?: { fetch: typeof fetch; decode: practice.PixelPracticeDecoder };
} = {}) {
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
    const preferenceStore = printPreferences.createPixelGridPrintPreferenceStore(() => storage);
    const paths = { en: '/pixel-art-grid', de: '/de/pixel-art-generator', fr: '/fr/image-en-pixel-art', ja: '/ja/pixel-art-converter' };
    let confirmations = 0;
    let practiceStart: ((id: practice.PixelPracticeId) => void) | undefined;
    let practiceEnabled = false;
    const assignments: string[] = [];
    const location = { href: `https://fusebeadpatterns.art${paths[props.locale ?? 'en']}`, origin: 'https://fusebeadpatterns.art', pathname: paths[props.locale ?? 'en'], search: '', assign(href: string) { runtime.assign?.(href); assignments.push(href); } };
    if (runtime.href) {
        const url = new URL(runtime.href, location.href);
        location.href = url.href; location.pathname = url.pathname; location.search = url.search;
    }
    const browser = {
        location, sessionStorage: storage, confirm: () => { confirmations++; return runtime.confirm?.() ?? false; },
        matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
        history: { replaceState(_state: unknown, _title: string, href: string) {
            const url = new URL(href, location.href);
            location.href = url.href; location.pathname = url.pathname; location.search = url.search;
        } },
        addEventListener: (name: string, callback: (event: Event) => void) => register(browserListeners, name, callback),
        removeEventListener: (name: string, callback: (event: Event) => void) => browserListeners.get(name)?.delete(callback),
        clearTimeout() {}, setTimeout: (callback: () => void) => { callbacks.push(callback); return callbacks.length; },
        fetch: runtime.practice?.fetch,
        requestAnimationFrame: (callback: () => void) => { callbacks.push(callback); return callbacks.length; }, cancelAnimationFrame() {},
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
        useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
    };
    const transfer = { ...localeNavigation,
        saveLargePixelLocaleSnapshot: (snapshot: localeNavigation.PixelLocaleSnapshot, href: string, area: typeof storage) => localeNavigation.saveLargePixelLocaleSnapshot(snapshot, href, area, runtime.largeStore),
        consumeLargePixelLocaleSnapshot: (href: string, area: typeof storage) => localeNavigation.consumeLargePixelLocaleSnapshot(href, area, runtime.largeStore),
    };
    const Component = workspace({ react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx }, '@/lib/pixel-grid/locale-navigation': transfer,
        './PixelPracticeProvider': { usePixelPracticeRegistration(start: typeof practiceStart, enabled: boolean) { practiceStart = start; practiceEnabled = enabled; } },
        '@/lib/pixel-grid/practice': { ...practice, decodePixelPracticeImage: runtime.practice?.decode ?? practice.decodePixelPracticeImage },
        '@/lib/pixel-grid/bead-transfer': { ...beadTransfer, ...runtime.beadTransfer },
        '@/lib/pixel-grid/print-preferences': { ...printPreferences,
            getPixelGridPrintPreferences: preferenceStore.getSnapshot,
            getServerPixelGridPrintPreferences: preferenceStore.getServerSnapshot,
            // The component runs in a VM, while this strict plain-object store lives in
            // the host realm. Recreate the UI's own three-field record in that realm.
            setPixelGridPrintPreferences: (value: printPreferences.PixelGridPrintPreferences) => preferenceStore.setPreferences({ ...value }),
            subscribePixelGridPrintPreferences: preferenceStore.subscribe,
        },
        '@/lib/pixel-grid/pdf': { createPixelGridPdf: runtime.createPdf ?? (() => { throw new Error('PDF not requested by this test'); }) },
        '@/lib/core/printer/pdf/japanese-font': { loadJapaneseExportFont: runtime.loadJapaneseFont ?? (() => { throw new Error('Font not requested by this test'); }) },
        '@/lib/analytics': { trackPixelGridExport: (event: unknown) => { events.push(event); return false; } } }, {
        window: browser, document, Blob, Uint8ClampedArray, location, Element: Anchor, HTMLAnchorElement: Anchor, AbortController,
        fetch: runtime.fetch ?? (async (href: string) => ({ ok: true, text: async () => readFileSync(`public${href}`, 'utf8') })),
        createImageBitmap: async () => ({ width: source.width, height: source.height, close() {} }),
        URL: class extends URL {
            static createObjectURL(blob: Blob) { const key = `blob:${blobs.size}`; blobs.set(key, blob); return key; }
            static revokeObjectURL(key: string) { blobs.delete(key); }
        },
    }) as (props: { locale?: messages.PixelGridLocale; experience?: 'grid' | 'converter' }) => unknown;
    const captures = new Set<number>();
    const rectangle = { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 };
    const nativeCanvas = { getBoundingClientRect: () => rectangle, focus() {},
        setPointerCapture: (id: number) => { captures.add(id); },
        hasPointerCapture: (id: number) => captures.has(id), releasePointerCapture: (id: number) => { captures.delete(id); } };
    const nativeViewport = { scrollLeft: 0, scrollTop: 0, getBoundingClientRect: () => rectangle, clientWidth: 100, clientHeight: 100 };
    function render() {
        slot = 0; tree = Component(props);
        if (first) { first = false; for (const effect of mountEffects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } }
        // Attach just the DOM contracts used by event handlers after mount effects.
        // This harness does not claim to render Canvas or exercise focus ergonomics.
        for (const node of nodes(tree)) {
            const ref = node.props.ref as { current: unknown } | undefined;
            if (ref && node.type === 'canvas') ref.current = nativeCanvas;
            else if (ref && node.type === 'div' && node.props['aria-label'] === text.scrollArea) ref.current = nativeViewport;
        }
    }
    render(); render();
    const find = (predicate: (node: TestNode) => boolean) => { const node = nodes(tree).find(predicate); if (!node) throw new Error('Expected control not found'); return node; };
    const byId = (id: string) => find(node => node.props.id === id);
    const button = (label: string) => find(node => node.type === 'button' && (content(node) === label || node.props['aria-label'] === label));
    return {
        source, byId, button, render, downloads, events, storage, assignments, location, captures, nativeViewport,
        beadDialog: () => find(node => node.type === 'pixel-bead-dialog'),
        cropDialog: () => find(node => node.type === 'pixel-crop-dialog'),
        key: (key: string, shiftKey = false) => {
            const event = { key, shiftKey, ctrlKey: true, metaKey: false, altKey: false, target: null as EventTarget | null, preventDefault() {} };
            for (const callback of documentListeners.get('keydown') ?? []) callback(event as unknown as Event);
            render();
        },
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
        canvasKey: (key: string, options: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; isComposing?: boolean; otherTarget?: boolean } = {}) => {
            const event = { key, ctrlKey: false, metaKey: false, altKey: false, nativeEvent: { isComposing: options.isComposing ?? false },
                currentTarget: nativeCanvas, target: options.otherTarget ? {} : nativeCanvas, prevented: false, preventDefault() { this.prevented = true; }, ...options };
            invoke(find(node => node.type === 'canvas'), 'onKeyDown', event); render(); return event.prevented;
        },
        pointer: (handler: 'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onLostPointerCapture', x = .25, y = .25, pointerId = 1, options: { button?: number; isPrimary?: boolean } = {}) => {
            if (handler === 'onLostPointerCapture' || handler === 'onPointerCancel') captures.delete(pointerId);
            invoke(find(node => node.type === 'canvas'), handler, { pointerId, clientX: x * 100, clientY: y * 100,
                currentTarget: nativeCanvas, button: 0, isPrimary: true, preventDefault() {}, ...options }); render();
        },
        blurCanvas: () => { invoke(find(node => node.type === 'canvas'), 'onBlur'); render(); },
        blurWindow: () => { for (const callback of browserListeners.get('blur') ?? []) callback({} as Event); render(); },
        startPractice: (id: practice.PixelPracticeId) => { practiceStart?.(id); render(); },
        practiceEnabled: () => practiceEnabled,
        // Read real hook-owned model refs without saving/exporting (which would
        // legitimately finish a live stroke and alter the saved checkpoint).
        inspectWork: () => {
            const refs = slots.filter((value): value is { current: unknown } => !!value && typeof value === 'object' && 'current' in value).map(value => value.current);
            const grids = refs.filter((value): value is core.PixelGrid => !!value && typeof value === 'object' && 'pixels' in value && !('name' in value));
            const history = refs.find(value => value instanceof core.GridHistory) as core.GridHistory;
            const source = refs.find(value => !!value && typeof value === 'object' && 'pixels' in value && 'name' in value) as localeNavigation.PixelSourceImage | undefined;
            const crop = refs.find(value => !!value && typeof value === 'object' && 'sourceWidth' in value);
            const stroke = refs.find(value => !!value && typeof value === 'object' && 'id' in value && 'tool' in value);
            return { grids: grids.map(grid => core.serializeProject(grid)), history: history.snapshot(), source: source ? { name: source.name, width: source.width, height: source.height, rgbaSha256: createHash('sha256').update(Uint8Array.from(source.pixels)).digest('hex') } : undefined, crop, stroke: stroke ? JSON.stringify(stroke) : null,
                settings: ['pixel-width', 'pixel-height', 'pixel-image-mode', 'pixel-color', 'pixel-alpha', 'pixel-color-limit', 'pixel-export-scale', 'pixel-zoom', 'pixel-print-paper', 'pixel-print-mode', 'pixel-print-content'].map(id => byId(id).props.value),
            };
        },
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

describe('one-click examples through the real workspace handler', () => {
    const decoded = { width: 792, height: 960, pixels: new Uint8ClampedArray(792 * 960 * 4) };
    for (let i = 0; i < decoded.width * decoded.height; i++) decoded.pixels.set([i % 2 ? 12 : 221, 83, 176, i % 3 ? 255 : 128], i * 4);
    const catBytes = readFileSync('public/guides/photo-to-pattern/cat-source.jpg');
    const validResponse = () => new Response(catBytes, { headers: { 'content-type': 'image/jpeg' } });
    const decode = async () => decoded;

    async function prepareOld(ui: ReturnType<typeof interactiveWorkspace>, locale: messages.PixelGridLocale) {
        const text = copy[locale];
        await ui.loadImage(); ui.paint();
        ui.change('pixel-color-limit', '8'); ui.click(text.reduceCurrent); ui.click(text.undo);
        ui.click(cropCopy.PIXEL_CROP_COPY[locale].open);
        invoke(ui.cropDialog(), 'onApply', { sourceWidth: 64, sourceHeight: 32, x: 17, y: 2, width: 37, height: 23 }); ui.render();
        ui.change('pixel-width', '17'); ui.change('pixel-height', '');
        ui.change('pixel-color', '#224466'); ui.change('pixel-alpha', '73'); ui.change('pixel-zoom', '8'); ui.change('pixel-export-scale', '4');
        ui.change('pixel-print-paper', 'letter'); ui.change('pixel-print-mode', 'tiled'); ui.change('pixel-print-content', 'blank');
    }

    it.each(['en', 'de', 'fr', 'ja'] as const)('cancel preserves the actual %s source, ROI, past/future, invalid pending inputs and print choices', async locale => {
        const confirm = vi.fn(() => false);
        const ui = interactiveWorkspace({ locale, experience: locale === 'en' ? 'grid' : 'converter' }, { confirm, practice: { fetch: async () => validResponse(), decode } });
        await prepareOld(ui, locale);
        const before = ui.inspectWork();
        expect(before.history.redo).toHaveLength(1);
        ui.startPractice('cat-64-16-colors'); await ui.settle(); await ui.settle();
        expect(confirm).toHaveBeenCalledOnce(); expect(ui.inspectWork()).toEqual(before);
        expect(ui.status()).toContain(practiceCopy.PIXEL_PRACTICE_COPY[locale].cancelled);
        expect(ui.practiceEnabled()).toBe(true); ui.unmount();
    });

    it.each(['bad-fetch', 'cancel'] as const)('request-induced blur/capture loss does not finish the real active stroke on %s; the next gesture and Undo work', async outcome => {
        let release!: (response: Response) => void;
        const waiting = new Promise<Response>(resolve => { release = resolve; });
        const ui = interactiveWorkspace({ locale: 'en' }, { confirm: () => false, practice: { fetch: async () => waiting, decode } });
        await prepareOld(ui, 'en');
        const beforeStroke = ui.inspectWork();
        ui.pointer('onPointerDown', .7, .7, 1);
        const before = ui.inspectWork(); expect(before.stroke).not.toBeNull(); expect(ui.captures.size).toBe(1);
        ui.startPractice('cat-64-original'); expect(ui.practiceEnabled()).toBe(false);
        ui.blurWindow(); ui.blurCanvas(); ui.pointer('onLostPointerCapture', .7, .7, 1); ui.pointer('onPointerCancel', .7, .7, 1);
        expect(ui.inspectWork()).toEqual(before); expect(ui.captures.size).toBe(0);
        release(outcome === 'cancel' ? validResponse() : new Response('Unavailable', { status: 500 }));
        await ui.settle(); await ui.settle();
        expect(ui.status()).toContain(outcome === 'cancel' ? practiceCopy.PIXEL_PRACTICE_COPY.en.cancelled : practiceCopy.PIXEL_PRACTICE_COPY.en.failed);
        expect(ui.inspectWork()).toEqual(before); expect(ui.button(copy.en.redo).props.disabled).toBe(false);
        ui.pointer('onPointerMove', .1, .1, 1); expect(ui.inspectWork()).toEqual(before); // Hover after lost capture must not paint.
        ui.pointer('onPointerDown', .1, .1, 2); ui.pointer('onPointerUp', .1, .1, 2);
        const after = ui.inspectWork();
        expect(after.stroke).toBeNull(); expect(after.history.undo.length).toBe(before.history.undo.length + 2); expect(after.history.redo).toHaveLength(0);
        ui.click(copy.en.undo); expect(ui.inspectWork().grids[0]).toBe(before.grids[0]);
        ui.click(copy.en.undo); expect(ui.inspectWork().grids[0]).toBe(beforeStroke.grids[0]);
        ui.unmount();
    });

    it('direct callback invocation is gated during crop, bead modal, busy work and after unmount', async () => {
        let release!: (response: Response) => void;
        const fetch = vi.fn(async () => new Promise<Response>(resolve => { release = resolve; }));
        const ui = interactiveWorkspace({ locale: 'en' }, { practice: { fetch, decode } });
        await ui.loadImage();
        ui.click(cropCopy.PIXEL_CROP_COPY.en.open); expect(ui.practiceEnabled()).toBe(false);
        ui.startPractice('cat-64-original'); expect(fetch).not.toHaveBeenCalled();
        invoke(ui.cropDialog(), 'onCancel'); ui.render();
        ui.click(beadCopy.getPixelBeadCopy('en').open); expect(ui.practiceEnabled()).toBe(false);
        ui.startPractice('cat-64-original'); expect(fetch).not.toHaveBeenCalled();
        invoke(ui.beadDialog(), 'onClose'); ui.render();
        ui.startPractice('cat-64-original'); ui.startPractice('cat-32-original'); expect(fetch).toHaveBeenCalledOnce();
        ui.unmount(); const before = ui.inspectWork(); release(validResponse()); await ui.settle();
        ui.startPractice('cat-32-original'); expect(fetch).toHaveBeenCalledOnce(); expect(ui.inspectWork()).toEqual(before);
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('accepted %s example clears old past/future, keeps print, marks unsaved and can reopen a complete file', async locale => {
        const ui = interactiveWorkspace({ locale, experience: locale === 'en' ? 'grid' : 'converter' }, { confirm: () => true, practice: { fetch: async () => validResponse(), decode } });
        await prepareOld(ui, locale);
        ui.startPractice('cat-64-16-colors'); await ui.settle(); await ui.settle();
        expect(ui.status()).toContain(practiceCopy.PIXEL_PRACTICE_COPY[locale].loaded);
        expect(ui.status()).toContain(copy[locale].dirty);
        const actual = ui.inspectWork();
        expect(actual.history).toEqual({ undo: [], redo: [] }); expect(actual.crop).toBeUndefined(); expect(actual.stroke).toBeNull();
        expect(actual.source).toEqual({ width: decoded.width, height: decoded.height, name: 'cat-source.jpg', rgbaSha256: createHash('sha256').update(decoded.pixels).digest('hex') });
        expect(actual.settings).toEqual(['64', '64', 'fit', '#f06a45', 255, 16, 8, 'fit', 'letter', 'tiled', 'blank']);
        expect(ui.button(copy[locale].undo).props.disabled).toBe(true); expect(ui.button(copy[locale].redo).props.disabled).toBe(true);
        ui.paint(); ui.click(copy[locale].undo); ui.click(copy[locale].redo);
        const saved = await ui.download(copy[locale].saveWorkspace);
        const raw = await saved.blob.text(), full = workspaceProject.parsePixelWorkspaceProject(raw);
        expect(createHash('sha256').update(Uint8Array.from(full.snapshot.source!.pixels)).digest('hex')).toBe(createHash('sha256').update(decoded.pixels).digest('hex')); expect(full.snapshot.sourceCrop).toBeNull();
        expect(full.print).toEqual({ paper: 'letter', mode: 'tiled', content: 'blank' });
        const reopened = interactiveWorkspace({ locale, experience: locale === 'en' ? 'grid' : 'converter' }, { confirm: () => true });
        await reopened.loadProject(raw);
        expect(reopened.inspectWork().source).toEqual(actual.source);
        expect(reopened.inspectWork().history).toEqual(full.snapshot.history);
        reopened.unmount(); ui.unmount();
    });
});

describe('pixel original-image area workflow', () => {
    const chosen = { sourceWidth: 64, sourceHeight: 32, x: 37, y: 5, width: 19, height: 23 };

    it.each(['en', 'de', 'fr', 'ja'] as const)('applies an area without changing the %s drawing, then reconverts and preserves grid-only Undo', async locale => {
        const ui = interactiveWorkspace({ locale, experience: 'converter' });
        const text = copy[locale], cropText = cropCopy.PIXEL_CROP_COPY[locale];
        await ui.loadImage(); ui.paint(); const previous = await ui.currentProject();
        ui.click(cropText.open);
        expect(ui.cropDialog().props.source).toMatchObject({ width: 64, height: 32, name: 'source.png' });
        expect(ui.cropDialog().props.initialCrop).toBeNull();
        const downloads = ui.downloads.length;
        ui.key('z'); ui.canvasKey('f'); ui.pointer('onPointerDown'); ui.click(text.reconvert); ui.click(text.saveWorkspace);
        expect(ui.downloads).toHaveLength(downloads); expect(ui.captures.size).toBe(0);
        expect(ui.switchLanguage('/de/pixel-art-generator').blocked).toBe(true);
        invoke(ui.cropDialog(), 'onApply', chosen); ui.render();
        expect(ui.status()).toContain(cropText.applied);
        expect(await ui.currentProject()).toEqual(previous);
        const file = await ui.download(text.saveWorkspace);
        const full = workspaceProject.parsePixelWorkspaceProject(await file.blob.text());
        expect(full.version).toBe(2); expect(full.snapshot.sourceCrop).toEqual(chosen);
        expect(full.snapshot.source!.pixels).toEqual(ui.source.pixels);
        ui.change('pixel-width', '17'); ui.change('pixel-height', '31'); ui.change('pixel-image-mode', 'stretch');
        ui.click(text.reconvert);
        expect(await ui.currentProject()).toEqual(core.resizeImage(sourceCrop.cropPixelSource(ui.source, chosen), 17, 31, 'stretch'));
        ui.click(text.undo); expect(await ui.currentProject()).toEqual(previous);
        ui.click(cropText.open); expect(ui.cropDialog().props.initialCrop).toEqual(chosen);
        invoke(ui.cropDialog(), 'onCancel'); ui.render();
        ui.click(text.redo);
        expect([ui.canvas().props.width, ui.canvas().props.height]).not.toEqual([0, 0]);
        ui.click(cropText.open); invoke(ui.cropDialog(), 'onApply', null); ui.render();
        ui.click(text.detailButton(32));
        expect(await ui.currentProject()).toEqual(core.resizeImage(ui.source, 32, 32, 'stretch'));
        ui.unmount();
    });

    it('keeps an applied crop on cancel, broken/newer files and late async reads; new images and old basic files reset it only on success', async () => {
        const ui = interactiveWorkspace({ locale: 'en' }, { confirm: () => false });
        await ui.loadImage(); ui.click(cropCopy.PIXEL_CROP_COPY.en.open);
        invoke(ui.cropDialog(), 'onApply', chosen); ui.render();
        const full = workspaceProject.parsePixelWorkspaceProject(await (await ui.download(copy.en.saveWorkspace)).blob.text());
        full.snapshot.sourceCrop = { ...chosen, x: 1 };
        await ui.loadProject(workspaceProject.serializePixelWorkspaceProject(full.snapshot, full.print)); // Confirmation cancelled.
        for (const raw of ['{', JSON.stringify({ format: 'pixel-grid-workspace', version: 99 }), (() => {
            const value = JSON.parse(workspaceProject.serializePixelWorkspaceProject(full.snapshot, full.print)); value.snapshot.sourceCrop.width = 99; return JSON.stringify(value);
        })()]) await ui.loadProject(raw);
        ui.click(cropCopy.PIXEL_CROP_COPY.en.open); expect(ui.cropDialog().props.initialCrop).toEqual(chosen);
        invoke(ui.cropDialog(), 'onCancel'); ui.render();
        const badImage = { name: 'broken.png', size: 1, type: 'image/png', arrayBuffer: async () => new Uint8Array([0]).buffer };
        invoke(ui.byId('pixel-image-file'), 'onChange', { currentTarget: { files: [badImage], value: '' } }); await ui.settle();
        ui.click(cropCopy.PIXEL_CROP_COPY.en.open); expect(ui.cropDialog().props.initialCrop).toEqual(chosen);
        invoke(ui.cropDialog(), 'onCancel'); ui.render();
        await ui.loadImage(); ui.click(cropCopy.PIXEL_CROP_COPY.en.open); expect(ui.cropDialog().props.initialCrop).toBeNull();
        invoke(ui.cropDialog(), 'onApply', chosen); ui.render();
        await ui.loadProject(core.serializeProject(core.createGrid(2, 3)));
        expect(ui.button(cropCopy.PIXEL_CROP_COPY.en.open).props.disabled).toBe(true);
        const reset = workspaceProject.parsePixelWorkspaceProject(await (await ui.download(copy.en.saveWorkspace)).blob.text());
        expect(reset.snapshot.source).toBeNull(); expect(reset.snapshot.sourceCrop).toBeNull();
        let complete!: (raw: string) => void;
        const pending = new Promise<string>(resolve => { complete = resolve; });
        invoke(ui.byId('pixel-project-file'), 'onChange', { currentTarget: { files: [{ name: 'late.json', size: 100, text: () => pending }], value: '' } });
        ui.render();
        const before = ui.status(); ui.unmount();
        complete(workspaceProject.serializePixelWorkspaceProject(full.snapshot, full.print)); await ui.settle();
        expect(ui.status()).toBe(before);
    });

    it('does not finish a live stroke or clear its existing Redo before a bad import is rejected', async () => {
        const ui = interactiveWorkspace({ locale: 'en' });
        await ui.loadImage(); ui.paint(); ui.click(copy.en.undo);
        expect(ui.button(copy.en.redo).props.disabled).toBe(false);
        ui.pointer('onPointerDown'); expect(ui.captures.size).toBe(1);
        await ui.loadProject('{');
        expect(ui.captures.size).toBe(1); expect(ui.button(copy.en.redo).props.disabled).toBe(false);
        const broken = { name: 'broken.png', size: 1, type: 'image/png', arrayBuffer: async () => new Uint8Array([0]).buffer };
        invoke(ui.byId('pixel-image-file'), 'onChange', { currentTarget: { files: [broken], value: '' } }); await ui.settle();
        expect(ui.captures.size).toBe(1); expect(ui.button(copy.en.redo).props.disabled).toBe(false);
        ui.pointer('onPointerUp'); expect(ui.captures.size).toBe(0);
        ui.unmount();
    });

    it('restores area, original pixels and both history branches from v2 and through all four equivalent language routes', async () => {
        const first = interactiveWorkspace({ locale: 'en' }, { confirm: () => true });
        await first.loadImage(); first.paint();
        first.click(cropCopy.PIXEL_CROP_COPY.en.open); invoke(first.cropDialog(), 'onApply', chosen); first.render();
        first.click(copy.en.undo);
        const file = await first.download(copy.en.saveWorkspace), raw = await file.blob.text();
        const original = workspaceProject.parsePixelWorkspaceProject(raw);
        const imported = interactiveWorkspace({ locale: 'de', experience: 'converter' }, { confirm: () => true });
        await imported.loadProject(raw);
        const restored = workspaceProject.parsePixelWorkspaceProject(await (await imported.download(copy.de.saveWorkspace)).blob.text());
        expect(restored.snapshot.source).toEqual(original.snapshot.source);
        expect(restored.snapshot.history).toEqual(original.snapshot.history);
        expect(restored.snapshot.sourceCrop).toEqual(chosen);
        let previous = imported;
        for (const locale of ['fr', 'ja', 'en'] as const) {
            expect(previous.switchLanguage(localeRoutes.localeRoutes[locale].pixelGrid!).blocked).toBe(false);
            const next = interactiveWorkspace({ locale, experience: locale === 'en' ? 'grid' : 'converter' }, { storage: previous.storage });
            next.click(cropCopy.PIXEL_CROP_COPY[locale].open); expect(next.cropDialog().props.initialCrop).toEqual(chosen);
            invoke(next.cropDialog(), 'onCancel'); next.render();
            next.change('pixel-width', '17'); next.change('pixel-height', '31'); next.click(copy[locale].reconvert);
            expect(await next.currentProject()).toEqual(core.resizeImage(sourceCrop.cropPixelSource(first.source, chosen), 17, 31, 'fit'));
            previous.unmount(); previous = next;
        }
        first.unmount(); previous.unmount();
    });
});

describe('pixel grid printable PDF integration', () => {
    const printableBytes = new TextEncoder().encode('%PDF-test-handler-contract');
    const original = core.createGrid(3, 2, new Uint8ClampedArray([
        17, 55, 99, 0, 20, 60, 100, 128, 15, 75, 99, 255,
        2, 3, 4, 17, 22, 33, 44, 0, 99, 88, 77, 255,
    ]));

    it.each(['en', 'de', 'fr', 'ja'] as const)('forwards all print choices from real %s handlers without changing RGBA or Undo/Redo', async locale => {
        const requested: { grid: core.PixelGrid; options: Parameters<typeof createPixelGridPdf>[1] }[] = [];
        const font = vi.fn(async () => 'valid-test-font');
        const pdf: typeof createPixelGridPdf = async (grid, options) => {
            requested.push({ grid: core.createGrid(grid.width, grid.height, grid.pixels), options });
            // A generator-owned mutable view must never alias the drawing being edited.
            if (!(grid.pixels instanceof Uint8ClampedArray)) throw new Error('Expected the UI-owned copied RGBA bytes');
            grid.pixels.fill(91);
            return printableBytes;
        };
        const ui = interactiveWorkspace({ locale }, { createPdf: pdf, loadJapaneseFont: font });
        await ui.loadProject(core.serializeProject(original));
        ui.paint();
        expect(ui.unload()).toBe(true);
        ui.change('pixel-print-paper', 'letter'); ui.change('pixel-print-mode', 'tiled'); ui.change('pixel-print-content', 'blank');
        const file = await ui.download(printCopy.PIXEL_GRID_PRINT_COPY[locale].download);
        expect(file.name).toBe('pixel-grid-3x2-blank-letter-tiled.pdf');
        expect(file.blob.type).toBe('application/pdf');
        expect(new Uint8Array(await file.blob.arrayBuffer())).toEqual(printableBytes);
        expect(requested).toHaveLength(1);
        expect(requested[0].options).toEqual({ paper: 'letter', mode: 'tiled', content: 'blank', locale, japaneseFontBase64: locale === 'ja' ? 'valid-test-font' : undefined });
        expect(font).toHaveBeenCalledTimes(locale === 'ja' ? 1 : 0);
        expect(ui.events.filter(event => (event as { format: string }).format === 'pdf')).toEqual([{ format: 'pdf' }]);
        expect(ui.status()).toContain(printCopy.PIXEL_GRID_PRINT_COPY[locale].exported);
        expect(ui.unload()).toBe(true); // Downloading a PDF is not saving the editable project.
        const after = await ui.currentProject();
        expect(after).toEqual(requested[0].grid);
        expect([...after.pixels]).not.toEqual(Array(after.pixels.length).fill(91));
        ui.key('z'); expect(await ui.currentProject()).toEqual(original);
        ui.key('z', true); expect(await ui.currentProject()).toEqual(after);
        ui.unmount();
    });

    it('renders complete localized, labelled print choices for all four existing experiences', () => {
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
            const text = printCopy.PIXEL_GRID_PRINT_COPY[locale];
            const html = renderToStaticMarkup(createElement(workspace(), { locale, experience: locale === 'en' ? 'grid' : 'converter' }));
            for (const id of ['content', 'paper', 'mode']) {
                expect(html).toContain(`for="pixel-print-${id}"`);
                expect(html).toContain(`id="pixel-print-${id}"`);
            }
            for (const value of [text.title, text.artwork, text.blank, text.download, text.help, text.layoutHelp]) expect(html).toContain(value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;'));
            expect(html).toContain('aria-describedby="pixel-print-help pixel-print-layout-help"');
            if (locale !== 'en') expect(html).not.toContain(printCopy.PIXEL_GRID_PRINT_COPY.en.title);
        }
    });

    it('blocks duplicate operations and language navigation during export; ignores a late completion after unmount', async () => {
        let finish: ((bytes: Uint8Array) => void) | undefined;
        const pdf = vi.fn<typeof createPixelGridPdf>(() => new Promise(resolve => { finish = resolve; }));
        const ui = interactiveWorkspace({ locale: 'en' }, { createPdf: pdf });
        ui.paint(); ui.click(printCopy.PIXEL_GRID_PRINT_COPY.en.download);
        await ui.settle();
        expect(pdf).toHaveBeenCalledOnce();
        expect(ui.button(copy.en.saveOriginal).props.disabled).toBe(true);
        expect(ui.button(printCopy.PIXEL_GRID_PRINT_COPY.en.download).props.disabled).toBe(true);
        ui.click(printCopy.PIXEL_GRID_PRINT_COPY.en.download);
        expect(ui.switchLanguage('/ja/pixel-art-converter').blocked).toBe(true);
        expect(ui.assignments).toEqual([]);
        ui.unmount(); finish!(printableBytes); await ui.settle();
        expect(pdf).toHaveBeenCalledOnce(); expect(ui.downloads).toEqual([]); expect(ui.events).toEqual([]);
    });

    it('keeps the original image, drawing and undo future after a failed export and supports a retry', async () => {
        let fail = true;
        const pdf = vi.fn<typeof createPixelGridPdf>(async () => { if (fail) throw new Error('/private/file/name.png'); return printableBytes; });
        const ui = interactiveWorkspace({ locale: 'fr', experience: 'converter' }, { createPdf: pdf });
        await ui.loadImage();
        ui.paint(); ui.key('z');
        expect(ui.button(copy.fr.redo).props.disabled).toBe(false);
        ui.click(printCopy.PIXEL_GRID_PRINT_COPY.fr.download); await ui.settle();
        expect(ui.status()).toContain(printCopy.PIXEL_GRID_PRINT_COPY.fr.failed);
        expect(ui.status()).not.toContain('/private/');
        expect(ui.downloads).toEqual([]); expect(ui.events).toEqual([]);
        expect(ui.button(copy.fr.redo).props.disabled).toBe(false);
        fail = false;
        await ui.download(printCopy.PIXEL_GRID_PRINT_COPY.fr.download);
        expect(ui.switchLanguage('/de/pixel-art-generator').blocked).toBe(false);
        const kept = localeNavigation.consumePixelLocaleSnapshot('https://fusebeadpatterns.art/de/pixel-art-generator', ui.storage)!;
        expect(kept.source).toEqual({ ...ui.source, name: 'source.png' });
        expect(kept.history.redo.length).toBe(1);
        ui.unmount();
    });

    it('keeps artwork when the Japanese font fails, then retries with the same print choices', async () => {
        let fail = true;
        const font = vi.fn(async () => { if (fail) throw new Error('font unavailable'); return 'font-after-retry'; });
        const pdf = vi.fn<typeof createPixelGridPdf>(async () => printableBytes);
        const ui = interactiveWorkspace({ locale: 'ja' }, { createPdf: pdf, loadJapaneseFont: font });
        await ui.loadProject(core.serializeProject(original));
        ui.change('pixel-print-paper', 'letter');
        ui.click(printCopy.PIXEL_GRID_PRINT_COPY.ja.download); await ui.settle();
        expect(pdf).not.toHaveBeenCalled(); expect(ui.downloads).toEqual([]); expect(ui.events).toEqual([]);
        expect(ui.status()).toContain(printCopy.PIXEL_GRID_PRINT_COPY.ja.failed);
        fail = false; await ui.download(printCopy.PIXEL_GRID_PRINT_COPY.ja.download);
        expect(pdf.mock.calls[0][1]).toMatchObject({ paper: 'letter', japaneseFontBase64: 'font-after-retry' });
        expect(await ui.currentProject()).toEqual(original);
        ui.unmount();
    });

    it('retains print choices on a freshly mounted translated workspace without modifying project format', async () => {
        const data = new Map<string, string>();
        const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
        const en = interactiveWorkspace({ locale: 'en' }, { storage });
        en.change('pixel-print-paper', 'letter'); en.change('pixel-print-mode', 'tiled'); en.change('pixel-print-content', 'blank');
        en.unmount();
        const pdf = vi.fn<typeof createPixelGridPdf>(async () => printableBytes);
        const de = interactiveWorkspace({ locale: 'de' }, { storage, createPdf: pdf });
        expect(de.byId('pixel-print-paper').props.value).toBe('letter');
        expect(de.byId('pixel-print-mode').props.value).toBe('tiled'); expect(de.byId('pixel-print-content').props.value).toBe('blank');
        await de.download(printCopy.PIXEL_GRID_PRINT_COPY.de.download);
        expect(pdf.mock.calls[0][1]).toMatchObject({ paper: 'letter', mode: 'tiled', content: 'blank' });
        const project = de.downloads.length;
        await de.currentProject();
        expect(JSON.parse(await de.downloads[project].blob.text())).toMatchObject({ format: 'pixel-grid-project', version: 1 });
        expect(await de.downloads[project].blob.text()).not.toContain('paper');
        de.unmount();
    });
});

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

describe('pixel-to-bead workspace boundaries', () => {
    it('blocks document Undo while the bead dialog is open and retains the pixel history after Cancel', async () => {
        const ui = interactiveWorkspace();
        await ui.loadImage();
        const original = await ui.currentProject();
        ui.paint();
        const edited = await ui.currentProject();
        ui.click(beadCopy.getPixelBeadCopy('fr').open);
        ui.key('z');
        invoke(ui.beadDialog(), 'onClose'); ui.render();
        expect(await ui.currentProject()).toEqual(edited);
        ui.key('z');
        expect(await ui.currentProject()).toEqual(original);
        ui.key('y');
        expect(await ui.currentProject()).toEqual(edited);
        ui.unmount();
    });

    it('ignores a brand fetch that completes after Cancel without writing a transfer or navigating', async () => {
        let completeFetch: (response: { ok: boolean; text: () => Promise<string> }) => void;
        const pending = new Promise<{ ok: boolean; text: () => Promise<string> }>(resolve => { completeFetch = resolve; });
        const fetch = vi.fn(() => pending);
        const save = vi.fn(beadTransfer.savePixelBeadTransfer);
        const ui = interactiveWorkspace(undefined, { fetch, beadTransfer: { savePixelBeadTransfer: save } });
        await ui.loadImage(); ui.paint();
        const before = await ui.currentProject();
        ui.click(beadCopy.getPixelBeadCopy('fr').open);
        invoke(ui.beadDialog(), 'onPrepare', 'perler'); ui.render();
        await ui.settle();
        expect(fetch).toHaveBeenCalledOnce();
        expect(ui.beadDialog().props.busy).toBe(true);
        invoke(ui.beadDialog(), 'onClose'); ui.render();
        completeFetch!({ ok: true, text: async () => readFileSync('public/palettes/perler.csv', 'utf8') });
        await ui.settle();
        expect(save).not.toHaveBeenCalled();
        expect(ui.assignments).toEqual([]);
        expect(ui.byId('pixel-grid-workspace').props['aria-busy']).toBe(false);
        expect(await ui.currentProject()).toEqual(before);
        ui.unmount();
    });

    it('protects a failed bead-return read, retries, and restores original pixels, source and both history branches', async () => {
        const first = interactiveWorkspace();
        await first.loadImage();
        const original = await first.currentProject();
        first.paint();
        const edited = core.createGrid(original.width, original.height, original.pixels);
        core.paintLine(edited, [0, 0], [0, 0], [240, 106, 69, 255]);
        // Leave a real redo branch pending at the time the transfer is saved.
        first.key('z');
        first.change('pixel-width', '17'); first.change('pixel-height', '31'); first.change('pixel-image-mode', 'crop');
        first.change('pixel-color-limit', '16'); first.change('pixel-export-scale', '4');
        first.click(beadCopy.getPixelBeadCopy('fr').open);
        invoke(first.beadDialog(), 'onPrepare', 'hama'); first.render();
        await vi.waitFor(() => expect(first.assignments.length).toBe(1));
        expect(first.location.search).toContain('bead-return=');
        let reads = 0;
        const target = interactiveWorkspace(undefined, {
            storage: first.storage, href: first.location.href,
            beadTransfer: { readPixelBeadReturn: async (...args) => {
                if (++reads === 1) throw new Error('Temporary session read failure');
                return beadTransfer.readPixelBeadReturn(...args);
            } },
        });
        await target.settle();
        const text = beadCopy.getPixelBeadCopy('fr');
        expect(target.status()).toContain(text.returnFailed);
        expect(target.button(text.returnRetry).props.disabled).toBe(false);
        expect(target.button(copy.fr.saveProject).props.disabled).toBe(true);
        expect(target.canvas().props.inert).toBe(true);
        target.paint(); target.key('z'); target.click(copy.fr.newBlank); target.click(copy.fr.saveProject);
        expect(target.downloads).toEqual([]);
        expect(target.unload()).toBe(true);
        target.click(text.returnRetry); await target.settle();
        expect(reads).toBe(2);
        expect(target.status()).toContain(text.returnRestored);
        expect(target.byId('pixel-width').props.value).toBe('17');
        expect(target.byId('pixel-height').props.value).toBe('31');
        expect(target.byId('pixel-image-mode').props.value).toBe('crop');
        expect(target.byId('pixel-color-limit').props.value).toBe(16);
        expect(target.byId('pixel-export-scale').props.value).toBe(4);
        expect(target.location.search).not.toContain('bead-return');
        expect(await target.currentProject()).toEqual(original);
        target.click(copy.fr.redo); expect(await target.currentProject()).toEqual(edited);
        target.click(copy.fr.undo); expect(await target.currentProject()).toEqual(original);
        target.change('pixel-width', '17'); target.change('pixel-height', '31');
        target.click(copy.fr.reconvert);
        expect(await target.currentProject()).toEqual(conversion.reducePixelGridColors(core.resizeImage(first.source, 17, 31, 'crop'), 16));
        expect(first.storage.getItem(beadTransfer.PIXEL_BEAD_STORAGE_KEY)).toBeNull();
        first.unmount(); target.unmount();
    });

    it('restores unsaved-pixel leave protection when editor navigation is rejected', async () => {
        const ui = interactiveWorkspace(undefined, { assign: () => { throw new Error('Navigation blocked'); } });
        await ui.loadImage(); ui.paint();
        expect(ui.unload()).toBe(true);
        const text = beadCopy.getPixelBeadCopy('fr');
        ui.click(text.open);
        invoke(ui.beadDialog(), 'onPrepare', 'perler'); ui.render();
        await vi.waitFor(() => { ui.render(); expect(ui.beadDialog().props.error).toBe(text.transferFailed); });
        expect(ui.assignments).toEqual([]);
        expect(ui.beadDialog().props.busy).toBe(false);
        expect(ui.unload()).toBe(true);
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
        expect(target.button(text.fill).props.disabled).toBe(true);
        expect(target.button(text.picker).props.disabled).toBe(true);
        expect(target.canvasKey('f')).toBe(false); expect(target.canvasKey('i')).toBe(false);
        target.pointer('onPointerDown'); expect(target.captures.size).toBe(0);
        target.click(text.fill); target.click(text.picker);
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

describe('complete user-downloaded pixel workspaces', () => {
    async function preparedWorkspace() {
        const ui = interactiveWorkspace({ locale: 'en' });
        await ui.loadImage();
        ui.paint();
        const painted = await ui.currentProject();
        ui.change('pixel-color-limit', '8');
        ui.click(copy.en.reduceCurrent);
        ui.click(copy.en.undo);
        ui.change('pixel-width', '17');
        ui.change('pixel-height', '');
        ui.change('pixel-alpha', '73');
        ui.change('pixel-color', '#224466');
        ui.change('pixel-export-scale', '4');
        ui.change('pixel-zoom', '8');
        ui.click(copy.en.fill);
        ui.change('pixel-print-paper', 'letter');
        ui.change('pixel-print-mode', 'tiled');
        ui.change('pixel-print-content', 'blank');
        const file = await ui.download(copy.en.saveWorkspace);
        const raw = await file.blob.text();
        return { ui, painted, file, raw, project: workspaceProject.parsePixelWorkspaceProject(raw) };
    }

    it.each(['en', 'de', 'fr', 'ja'] as const)('reopens the image, pending settings, complete past/future and print choices in %s', async locale => {
        const original = await preparedWorkspace();
        expect(original.file.name).toBe('pixel-16x16.pixel-workspace.json');
        expect(original.project.snapshot.source?.pixels).toEqual(original.ui.source.pixels);
        expect(original.project.snapshot.grid).toEqual(original.painted);
        expect(original.project.snapshot.saved).toEqual(original.painted);
        expect(original.project.snapshot.history.undo).toHaveLength(2);
        expect(original.project.snapshot.history.redo).toHaveLength(1);
        expect(original.project.print).toEqual({ paper: 'letter', mode: 'tiled', content: 'blank' });
        original.ui.unmount();

        const reopened = interactiveWorkspace({ locale, experience: locale === 'en' ? 'grid' : 'converter' });
        await reopened.loadProject(original.raw);
        expect(reopened.status()).toContain(copy[locale].workspaceOpened('saved.pixel-grid.json'));
        expect(reopened.byId('pixel-width').props.value).toBe('17');
        expect(reopened.byId('pixel-height').props.value).toBe('');
        expect(reopened.byId('pixel-alpha').props.value).toBe(73);
        expect(reopened.byId('pixel-color').props.value).toBe('#224466');
        expect(reopened.byId('pixel-color-limit').props.value).toBe(8);
        expect(reopened.byId('pixel-export-scale').props.value).toBe(4);
        expect(reopened.byId('pixel-zoom').props.value).toBe('8');
        expect(reopened.byId('pixel-print-paper').props.value).toBe('letter');
        expect(reopened.byId('pixel-print-mode').props.value).toBe('tiled');
        expect(reopened.byId('pixel-print-content').props.value).toBe('blank');
        expect(reopened.button(copy[locale].reconvert).props.disabled).toBe(false);
        expect(reopened.button(copy[locale].undo).props.disabled).toBe(false);
        expect(reopened.button(copy[locale].redo).props.disabled).toBe(false);
        const resaved = await reopened.download(copy[locale].saveWorkspace);
        expect(await resaved.blob.text()).toBe(original.raw);
        reopened.click(copy[locale].redo);
        expect(conversion.countVisibleColors(await reopened.currentProject())).toBeLessThanOrEqual(8);
        reopened.click(copy[locale].undo);
        expect(await reopened.currentProject()).toEqual(original.painted);
        // Undo publishes the restored 16x16 grid and synchronizes both dimension
        // controls, as it did before full-workspace files were introduced.
        expect(reopened.byId('pixel-width').props.value).toBe('16');
        expect(reopened.byId('pixel-height').props.value).toBe('16');
        reopened.change('pixel-width', '17');
        reopened.change('pixel-height', '31');
        reopened.change('pixel-color-limit', 'original');
        reopened.click(copy[locale].reconvert);
        expect(await reopened.currentProject()).toEqual(core.resizeImage(reopened.source, 17, 31, 'fit'));
        reopened.unmount();
    });

    it('keeps the existing full workspace when replacement is cancelled', async () => {
        const original = await preparedWorkspace();
        const confirm = vi.fn(() => false);
        const current = interactiveWorkspace({ locale: 'ja' }, { confirm });
        await current.loadImage(); current.paint();
        const before = await current.download(copy.ja.saveWorkspace);
        await current.loadProject(original.raw);
        expect(confirm).toHaveBeenCalledOnce();
        expect(current.status()).toContain(copy.ja.workspaceCancelled);
        const after = await current.download(copy.ja.saveWorkspace);
        expect(await after.blob.text()).toBe(await before.blob.text());
        current.unmount(); original.ui.unmount();
    });

    it('validates every field before confirmation or replacing an existing workspace', async () => {
        const original = await preparedWorkspace();
        const confirm = vi.fn(() => true);
        const current = interactiveWorkspace({ locale: 'fr' }, { confirm });
        await current.loadImage(); current.paint();
        const before = await current.download(copy.fr.saveWorkspace);
        const bad = JSON.parse(original.raw);
        bad.snapshot.history.redo[0].pixels = 'AAAA';
        await current.loadProject(JSON.stringify(bad));
        expect(confirm).not.toHaveBeenCalled();
        expect(current.status()).toContain(FRENCH_PIXEL_GRID_ERRORS.WORKSPACE_INVALID);
        const after = await current.download(copy.fr.saveWorkspace);
        expect(await after.blob.text()).toBe(await before.blob.text());
        await current.loadProject(original.raw);
        expect(confirm).toHaveBeenCalledOnce();
        expect(current.status()).toContain(copy.fr.workspaceOpened('saved.pixel-grid.json'));
        current.unmount(); original.ui.unmount();
    });

    it('rejects oversized files before reading them and remains editable', async () => {
        const ui = interactiveWorkspace({ locale: 'de' });
        ui.paint();
        const before = await ui.currentProject();
        const read = vi.fn(async () => 'unread');
        invoke(ui.byId('pixel-project-file'), 'onChange', { currentTarget: { files: [{ name: 'large.pixel-workspace.json', size: workspaceProject.MAX_PIXEL_WORKSPACE_PROJECT_BYTES + 1, text: read }], value: 'large.pixel-workspace.json' } });
        await ui.settle();
        expect(read).not.toHaveBeenCalled();
        expect(ui.status()).toContain(GERMAN_PIXEL_GRID_ERRORS.WORKSPACE_TOO_LARGE);
        expect(ui.byId('pixel-grid-workspace').props['aria-busy']).toBe(false);
        expect(await ui.currentProject()).toEqual(before);
        ui.click(copy.de.undo);
        expect(await ui.currentProject()).toEqual(core.createGrid(16, 16));
        ui.unmount();
    });
});

describe('connected fill and eyedropper event boundaries', () => {
    const original = () => core.createGrid(2, 2, [12, 34, 56, 93, 12, 34, 56, 93, 12, 34, 56, 93, 91, 37, 83, 0]);

    it.each(['fill', 'picker'] as const)('restores the actual %s selection, filled pixels, alpha and Undo/Redo through the four-language journey', async tool => {
        const pairs = [['en', 'de'], ['de', 'ja'], ['ja', 'fr'], ['fr', 'en']] as const;
        for (const [from, to] of pairs) {
            const first = interactiveWorkspace({ locale: from });
            const before = original(); await first.loadProject(core.serializeProject(before));
            first.change('pixel-alpha', '53'); first.click(copy[from].fill); first.pointer('onPointerDown'); first.pointer('onPointerUp');
            const filled = core.createGrid(2, 2, before.pixels); core.floodFill(filled, 0, 0, [240, 106, 69, 53]);
            if (tool === 'picker') { first.click(copy[from].picker); first.pointer('onPointerDown', .75, .75); first.pointer('onPointerUp'); }
            first.change('pixel-width', '17'); first.change('pixel-height', '31');
            expect(first.switchLanguage(localeRoutes.localeRoutes[to].pixelGrid!).blocked).toBe(false);
            const target = interactiveWorkspace({ locale: to }, { storage: first.storage });
            expect(target.button(copy[to][tool]).props['aria-pressed']).toBe(true);
            expect(target.byId('pixel-color').props.value).toBe(tool === 'picker' ? '#5b2553' : '#f06a45');
            expect(target.byId('pixel-alpha').props.value).toBe(tool === 'picker' ? 0 : 53);
            expect(target.byId('pixel-width').props.value).toBe('17'); expect(target.byId('pixel-height').props.value).toBe('31');
            expect(target.unload()).toBe(true); expect(await target.currentProject()).toEqual(filled);
            target.click(copy[to].undo); expect(await target.currentProject()).toEqual(before);
            target.click(copy[to].redo); expect(await target.currentProject()).toEqual(filled);
            first.unmount(); target.unmount();
        }
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('fills once on pointer-down in %s, preserves pending settings and restores the whole region with one Undo', async locale => {
        const text = copy[locale], ui = interactiveWorkspace({ locale });
        const before = original(); await ui.loadProject(core.serializeProject(before));
        ui.change('pixel-width', '17'); ui.change('pixel-height', '31');
        ui.change('pixel-color-limit', '16'); ui.change('pixel-export-scale', '4');
        ui.change('pixel-alpha', '53'); ui.click(text.fill);
        ui.pointer('onPointerDown');
        expect(ui.status()).toContain(text.filled(3));
        expect(ui.unload()).toBe(true); expect(ui.captures.has(1)).toBe(true);
        expect(ui.byId('pixel-width').props.value).toBe('17'); expect(ui.byId('pixel-height').props.value).toBe('31');
        expect(ui.byId('pixel-color-limit').props.value).toBe(16); expect(ui.byId('pixel-export-scale').props.value).toBe(4);
        ui.pointer('onPointerMove', .75, .75); ui.pointer('onPointerUp', .75, .75);
        expect(ui.captures.size).toBe(0);
        const filled = core.createGrid(2, 2, before.pixels); core.floodFill(filled, 0, 0, [240, 106, 69, 53]);
        expect(await ui.currentProject()).toEqual(filled);
        ui.click(text.undo); expect(await ui.currentProject()).toEqual(before);
        ui.click(text.redo); expect(await ui.currentProject()).toEqual(filled);
        expect(ui.button(text.fill).props['aria-pressed']).toBe(true);
        ui.unmount();
    });

    it('a no-op fill neither dirties a saved project nor discards its redo branch', async () => {
        const text = copy.en, ui = interactiveWorkspace({ locale: 'en' });
        const before = original(); await ui.loadProject(core.serializeProject(before));
        ui.change('pixel-color', '#0c2238'); ui.change('pixel-alpha', '93'); ui.click(text.fill);
        ui.pointer('onPointerDown'); ui.pointer('onPointerUp');
        expect(ui.unload()).toBe(false); expect(ui.status()).toContain(text.fillUnchanged);
        ui.change('pixel-color', '#f06a45'); ui.pointer('onPointerDown'); ui.pointer('onPointerUp');
        const filled = await ui.currentProject(); ui.click(text.undo);
        expect(ui.button(text.redo).props.disabled).toBe(false);
        ui.change('pixel-color', '#0c2238'); ui.pointer('onPointerDown'); ui.pointer('onPointerUp');
        expect(ui.button(text.redo).props.disabled).toBe(false);
        ui.click(text.redo); expect(await ui.currentProject()).toEqual(filled);
        ui.click(text.undo); expect(await ui.currentProject()).toEqual(before);
        ui.unmount();
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('picks exact hidden RGB and zero alpha in %s without painting, saving or changing history', async locale => {
        const text = copy[locale], ui = interactiveWorkspace({ locale });
        const before = original(); await ui.loadProject(core.serializeProject(before));
        ui.click(text.picker); ui.pointer('onPointerDown', .75, .75);
        expect(ui.byId('pixel-color').props.value).toBe('#5b2553'); expect(ui.byId('pixel-alpha').props.value).toBe(0);
        expect(ui.status()).toContain(text.picked('#5b2553', 0));
        expect(ui.unload()).toBe(false); expect(ui.button(text.picker).props['aria-pressed']).toBe(true);
        ui.pointer('onPointerMove', .25, .25); ui.pointer('onPointerUp', .25, .25);
        expect(ui.byId('pixel-color').props.value).toBe('#5b2553'); expect(ui.byId('pixel-alpha').props.value).toBe(0);
        expect(ui.unload()).toBe(false); expect(await ui.currentProject()).toEqual(before);
        // The only previous operation is opening the 2 × 2 project, not picking.
        ui.click(text.undo); expect(await ui.currentProject()).toEqual(core.createGrid(16, 16));
        ui.unmount();
    });

    it('picking leaves unsaved work and its next Undo intact', async () => {
        const text = copy.en, ui = interactiveWorkspace({ locale: 'en' });
        const before = original(); await ui.loadProject(core.serializeProject(before));
        ui.paint(); expect(ui.unload()).toBe(true);
        ui.click(text.picker); ui.pointer('onPointerDown', .75, .75); ui.pointer('onPointerUp');
        expect(ui.unload()).toBe(true); expect(ui.button(text.picker).props['aria-pressed']).toBe(true);
        ui.click(text.undo); expect(await ui.currentProject()).toEqual(before);
        ui.unmount();
    });

    it.each(['onPointerUp', 'onPointerCancel', 'onLostPointerCapture', 'canvas-blur', 'window-blur'] as const)('ends a one-shot pointer tool on %s without adding a second history entry', async end => {
        const text = copy.en, ui = interactiveWorkspace({ locale: 'en' });
        const before = original(); await ui.loadProject(core.serializeProject(before)); ui.click(text.fill);
        ui.pointer('onPointerDown'); ui.pointer('onPointerMove', .75, .75);
        if (end === 'canvas-blur') ui.blurCanvas();
        else if (end === 'window-blur') ui.blurWindow();
        else ui.pointer(end);
        expect(ui.captures.size).toBe(0);
        // A new click can fill the isolated transparent cell after capture ends.
        ui.change('pixel-color', '#112233'); ui.pointer('onPointerDown', .75, .75, 2); ui.pointer('onPointerUp', .75, .75, 2);
        ui.click(text.undo);
        const firstFill = core.createGrid(2, 2, before.pixels); core.floodFill(firstFill, 0, 0, [240, 106, 69, 255]);
        expect(await ui.currentProject()).toEqual(firstFill);
        ui.click(text.undo); expect(await ui.currentProject()).toEqual(before);
        ui.unmount();
    });

    it('Space and Enter execute Fill/Picker; Delete and Backspace erase only the selected cell', async () => {
        const text = copy.en, ui = interactiveWorkspace({ locale: 'en' });
        const before = original(); await ui.loadProject(core.serializeProject(before));
        expect(ui.canvasKey('f')).toBe(true); expect(ui.button(text.fill).props['aria-pressed']).toBe(true);
        ui.canvasKey(' ');
        const filled = core.createGrid(2, 2, before.pixels); core.floodFill(filled, 0, 0, [240, 106, 69, 255]);
        expect(await ui.currentProject()).toEqual(filled); ui.click(text.undo);
        ui.canvasKey('I'); ui.canvasKey('Enter');
        expect(ui.byId('pixel-color').props.value).toBe('#0c2238'); expect(ui.byId('pixel-alpha').props.value).toBe(93);
        expect(ui.button(text.picker).props['aria-pressed']).toBe(true);
        expect(await ui.currentProject()).toEqual(before);
        ui.canvasKey('Delete');
        const erased = core.createGrid(2, 2, before.pixels); core.setPixel(erased, 0, 0, [0, 0, 0, 0]);
        expect(await ui.currentProject()).toEqual(erased); ui.click(text.undo);
        ui.canvasKey('F'); ui.canvasKey('Backspace');
        expect(await ui.currentProject()).toEqual(erased);
        ui.unmount();
    });

    it('tool keys apply only to the focused Canvas and ignore modifiers, text targets and IME', async () => {
        const text = copy.en, ui = interactiveWorkspace({ locale: 'en' });
        await ui.loadProject(core.serializeProject(original()));
        for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { otherTarget: true }]) {
            expect(ui.canvasKey('f', options)).toBe(false); expect(ui.button(text.brush).props['aria-pressed']).toBe(true);
        }
        expect(ui.canvasKey('constructor')).toBe(false); expect(ui.canvasKey('toString')).toBe(false);
        for (const [key, tool] of [['e', text.eraser], ['f', text.fill], ['i', text.picker], ['p', text.pan], ['b', text.brush]]) {
            expect(ui.canvasKey(key)).toBe(true); expect(ui.button(tool).props['aria-pressed']).toBe(true);
        }
        ui.key('f'); expect(ui.button(text.brush).props['aria-pressed']).toBe(true);
        ui.unmount();
    });

    it('preserves drag painting, interrupted stroke history and Pan behavior', async () => {
        const text = copy.en, ui = interactiveWorkspace({ locale: 'en' });
        const before = core.createGrid(4, 1); await ui.loadProject(core.serializeProject(before));
        ui.pointer('onPointerDown', .125, .5); ui.pointer('onPointerMove', .875, .5); ui.pointer('onPointerCancel', .875, .5);
        const painted = core.createGrid(4, 1); core.paintLine(painted, [0, 0], [3, 0], [240, 106, 69, 255]);
        expect(await ui.currentProject()).toEqual(painted); ui.click(text.undo); expect(await ui.currentProject()).toEqual(before);
        ui.click(text.pan); ui.pointer('onPointerDown', .125, .5); ui.pointer('onPointerMove', .875, .5); ui.pointer('onPointerUp', .875, .5);
        expect(ui.nativeViewport.scrollLeft).toBe(-75);
        expect(ui.canvasKey('Delete')).toBe(false); expect(await ui.currentProject()).toEqual(before);
        ui.canvasKey('ArrowRight'); expect(ui.nativeViewport.scrollLeft).toBe(-11);
        ui.unmount();
    });

    it('blocks fill and picker while an asynchronous operation owns the workspace', async () => {
        const text = copy.en, ui = interactiveWorkspace({ locale: 'en' });
        await ui.loadProject(core.serializeProject(original())); ui.click(text.fill);
        ui.click(text.saveOriginal);
        expect(ui.canvasKey('i')).toBe(false); expect(ui.canvasKey('Enter')).toBe(false);
        ui.pointer('onPointerDown'); expect(ui.captures.size).toBe(0);
        expect(ui.button(text.fill).props['aria-pressed']).toBe(true);
        await vi.waitFor(() => { ui.render(); expect(ui.button(text.saveProject).props.disabled).toBe(false); });
        expect(await ui.currentProject()).toEqual(original());
        ui.unmount();
    });
});

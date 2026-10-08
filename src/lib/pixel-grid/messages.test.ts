import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import ts from 'typescript';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as core from './core';
import * as conversion from './conversion';
import * as messages from './messages';
import { PixelGridError, PIXEL_GRID_ERROR_MESSAGES, type PixelGridErrorCode } from './errors';

const { PIXEL_GRID_MESSAGES: copy, FRENCH_PIXEL_GRID_ERRORS, JAPANESE_PIXEL_GRID_ERRORS, pixelGridErrorMessage, PixelGridUiError } = messages;

describe('pixel grid localization', () => {
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
        if (id === '@/lib/analytics') return { trackPixelGridExport: () => false };
        if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_target, name) => String(name) }) };
        return require(id);
    } });
    return exports.default as ComponentType<{ locale?: messages.PixelGridLocale; experience?: 'grid' | 'converter' }>;
}

describe('pixel grid initial user experience', () => {
    it('keeps the English default at 16 square with grid enabled and the existing export choices', () => {
        const html = renderToStaticMarkup(createElement(workspace()));
        expect(html).toContain('16 × 16 pixels');
        expect(html).toContain('Canvas &amp; image settings');
        expect(html).toContain('Ready. Draw or import an image.');
        expect(html).toMatch(/id="pixel-show-grid"[^>]*checked=""/);
        expect(html).toContain('Save original-size PNG');
        expect(html).toContain('Save enlarged grid PNG');
        expect(html).not.toContain('pixel-color-limit');
        expect(html).not.toContain('pixel-export-scale');
        expect(html.indexOf('<details')).toBeLessThan(html.indexOf('id="pixel-image-file"'));
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
function interactiveWorkspace() {
    const slots: unknown[] = [], mountEffects: (() => void | (() => void))[] = [], cleanups: (() => void)[] = [];
    let slot = 0, first = true, tree: unknown;
    const callbacks: (() => void)[] = [];
    const blobs = new Map<string, Blob>(), downloads: { name: string; blob: Blob }[] = [];
    const events: unknown[] = [];
    const source = { width: 64, height: 32, pixels: new Uint8ClampedArray(64 * 32 * 4) };
    for (let i = 0; i < 64 * 32; i++) source.pixels.set([(i & 15) * 16, ((i >> 4) & 15) * 16, (i * 17) & 255, 255], i * 4);
    const context = { drawImage() {}, getImageData: () => ({ data: source.pixels.slice() }) };
    const browser = { addEventListener() {}, removeEventListener() {}, clearTimeout() {}, setTimeout: (callback: () => void) => { callbacks.push(callback); return callbacks.length; } };
    const document = {
        addEventListener() {}, removeEventListener() {}, body: { append() {} },
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
        useEffect: (effect: () => void | (() => void)) => { if (first) mountEffects.push(effect); },
        useSyncExternalStore: () => false,
    };
    const Component = workspace({ react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx }, '@/lib/analytics': { trackPixelGridExport: (event: unknown) => { events.push(event); return false; } } }, {
        window: browser, document, Blob, Uint8ClampedArray,
        createImageBitmap: async () => ({ width: source.width, height: source.height, close() {} }),
        URL: { createObjectURL: (blob: Blob) => { const key = `blob:${blobs.size}`; blobs.set(key, blob); return key; }, revokeObjectURL: (key: string) => blobs.delete(key) },
    }) as (props: { locale: 'fr'; experience: 'converter' }) => unknown;
    function render() { slot = 0; tree = Component({ locale: 'fr', experience: 'converter' }); if (first) { first = false; for (const effect of mountEffects) { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); } } }
    render();
    const find = (predicate: (node: TestNode) => boolean) => { const node = nodes(tree).find(predicate); if (!node) throw new Error('Expected control not found'); return node; };
    const byId = (id: string) => find(node => node.props.id === id);
    const button = (label: string) => find(node => node.type === 'button' && (content(node) === label || node.props['aria-label'] === label));
    return {
        source, byId, button, render, downloads, events,
        click: (label: string) => { invoke(button(label), 'onClick'); render(); },
        change: (id: string, value: string) => { invoke(byId(id), 'onChange', { target: { value } }); render(); },
        loadImage: async () => {
            const bytes = readFileSync(new URL('./fixtures/aspect-64x32.png', import.meta.url));
            const file = { name: 'source.png', size: bytes.length, type: 'image/png', arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length) };
            invoke(byId('pixel-image-file'), 'onChange', { currentTarget: { files: [file], value: 'source.png' } });
            await new Promise(resolve => setImmediate(resolve)); render();
        },
        paint: () => {
            const canvas = find(node => node.type === 'canvas');
            invoke(canvas, 'onKeyDown', { key: 'Enter', ctrlKey: false, metaKey: false, altKey: false, preventDefault() {} }); render();
        },
        currentProject: async () => {
            invoke(button(copy.fr.saveProject), 'onClick'); render();
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

import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { normalizeSourceBackground, SourceBackgroundError, type SourceBackground } from '../../lib/editor/source-background';
import { backgroundColorHex, pickBackgroundColor, validateBackgroundPreview, type BackgroundPreview } from '../../lib/editor/source-background-selection';
import type { EditorSourceCrop } from '../../lib/core/utils/image-crop';

// Execute the production callbacks and effect lifetimes. React state setters,
// canvas and decoded-image IO are modeled; RGB picking and bounds use the real helpers.
const source = ts.createSourceFile('SourceBackgroundDialog.tsx', readFileSync(new URL('./SourceBackgroundDialog.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const component = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'SourceBackgroundDialog') as ts.FunctionDeclaration;
const functions = component.body!.statements.filter(ts.isFunctionDeclaration);
const budget = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'isBudgetError')!;
const effects = component.body!.statements.flatMap(statement => ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && statement.expression.expression.getText(source) === 'useEffect' ? [statement.expression.arguments[0]] : []);
const body = functions.map(fn => fn.getText(source)).join('\n') + '\n' + budget.getText(source) + '\n' +
    `const lifetimeEffect=${effects[1].getText(source)}; const loadEffect=${effects[2].getText(source)}; const previewEffect=${effects[3].getText(source)}; const drawEffect=${effects[4].getText(source)};`;
const compiled = ts.transpileModule(body + '\nmodule.exports={previewCandidate,pick,cancel,apply,lifetimeEffect,loadEffect,previewEffect,drawEffect};', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
function deferred<T>() { let resolve!: (value: T) => void, reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function result(): BackgroundPreview { return { pixels: new Uint8ClampedArray([9, 8, 7, 255, 0, 0, 0, 0]), width: 2, height: 1, totalBeads: 1 }; }
type Controls = {
    previewCandidate(background: SourceBackground | null, key: string, controller: AbortController, epoch: number): Promise<void>;
    pick(event: unknown): void; cancel(): void; apply(): Promise<void>;
    lifetimeEffect(): () => void; loadEffect(): () => void; previewEffect(): () => void; drawEffect(): void;
};
function harness() {
    const candidate: SourceBackground = { color: { r: 9, g: 8, b: 7 }, tolerance: 0, mode: 'edge-connected' };
    const image = { ...result(), sourceWidth: 8, sourceHeight: 5, x: 2, y: 3 }, original = image.pixels.slice();
    const state: Record<string, unknown> = { source: image, previewStatus: 'ready', candidate, candidateKey: JSON.stringify(candidate), previewReady: true, busy: false, hex: '#090807', enabled: true, applyFailed: false, pickFailed: false };
    const refs: Record<string, { current: unknown }> = {};
    for (const name of body.matchAll(/\b(\w+)\.current/g)) refs[name[1]] ??= { current: null };
    Object.assign(refs, { alive: { current: true }, closed: { current: false }, loadEpoch: { current: 0 }, previewEpoch: { current: 1 }, applyEpoch: { current: 0 }, sourceRef: { current: image } });
    const draw = vi.fn(); refs.sourceCanvas = { current: { width: 0, height: 0, getContext: () => ({ putImageData: draw }) } };
    const previewDraw = vi.fn(); refs.previewCanvas = { current: { width: 0, height: 0, getContext: () => ({ putImageData: previewDraw }) } };
    const onPreview = vi.fn<(background: SourceBackground | null, signal: AbortSignal) => Promise<BackgroundPreview>>(async () => result());
    const onApply = vi.fn<(background: SourceBackground | null) => Promise<boolean>>(async () => true), onCancel = vi.fn(), reader = vi.fn(async () => image);
    refs.previewCallback = { current: onPreview };
    const setters: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const match of body.matchAll(/\b(set[A-Z]\w+)\(/g)) {
        const property = match[1].slice(3, 4).toLowerCase() + match[1].slice(4);
        setters[match[1]] ??= vi.fn((value: unknown) => { state[property] = typeof value === 'function' ? value(state[property]) : value; });
    }
    const timers: Array<() => void> = [], loaded = { exports: {} };
    const scope = { module: loaded, ...refs, ...setters, normalizeSourceBackground, backgroundColorHex, pickBackgroundColor, validateBackgroundPreview,
        onApply, onCancel, imageSrc: 'original-data-url', sourceCrop: null as EditorSourceCrop | null, readSourceBackgroundImage: reader, AbortController, Error, JSON,
        ImageData: class { constructor(public data: Uint8ClampedArray, public width: number, public height: number) {} },
        window: { setTimeout: (callback: () => void) => { timers.push(callback); return timers.length; }, clearTimeout: vi.fn() },
        get busy() { return state.busy; }, get candidate() { return state.candidate; }, get candidateKey() { return state.candidateKey; },
        get previewReady() { return state.previewReady; }, get source() { return state.source; },
        get preview() { return state.preview; }, get previewStatus() { return state.previewStatus; },
    };
    new Script(compiled).runInNewContext(scope);
    return { controls: loaded.exports as Controls, state, refs, setters, onPreview, onApply, onCancel, reader, timers, image, original, draw, previewDraw };
}
async function tick() { await Promise.resolve(); await Promise.resolve(); }

describe('background preview callback ownership', () => {
    it('displays only the newest full conversion, even when an older callback ignores abort', async () => {
        const h = harness(), old = deferred<BackgroundPreview>(), latest = deferred<BackgroundPreview>();
        h.onPreview.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
        const a = new AbortController(), b = new AbortController();
        const first = h.controls.previewCandidate(null, 'null', a, 1);
        a.abort(); h.refs.previewEpoch.current = 2;
        const second = h.controls.previewCandidate(h.state.candidate as SourceBackground, 'latest', b, 2);
        latest.resolve(result()); await second; old.resolve({ ...result(), totalBeads: 0 }); await first;
        expect((h.state.preview as { key: string }).key).toBe('latest'); expect(h.state.previewStatus).toBe('drawing');
        h.state.candidateKey = 'latest'; h.controls.drawEffect(); expect(h.state.previewStatus).toBe('ready'); expect(h.image.pixels).toEqual(h.original);
    });
    it('aborts changed candidate effects and never generates invalid fields or while applying', async () => {
        const h = harness(), pending = deferred<BackgroundPreview>(); h.onPreview.mockReturnValue(pending.promise);
        const cleanup = h.controls.previewEffect(); h.timers[0](); expect(h.onPreview).toHaveBeenCalledOnce();
        const signal = h.onPreview.mock.calls[0][1] as AbortSignal; cleanup(); expect(signal.aborted).toBe(true);
        h.state.candidateKey = 'invalid'; h.controls.previewEffect(); expect(h.timers).toHaveLength(1); expect(h.state.previewStatus).toBe('idle');
        h.state.candidateKey = 'null'; h.state.busy = true; h.controls.previewEffect(); expect(h.timers).toHaveLength(1);
        pending.resolve(result()); await tick(); expect(h.state.preview).toBeUndefined();
    });
    it('distinguishes original-pixel budgets and allows a fresh preview after a conversion failure', async () => {
        const h = harness(); h.onPreview.mockRejectedValueOnce(new SourceBackgroundError('IMAGE_TOO_LARGE'));
        await h.controls.previewCandidate(null, 'null', new AbortController(), 1); expect(h.state.previewStatus).toBe('limit');
        h.onPreview.mockResolvedValueOnce({ ...result(), pixels: new Uint8ClampedArray(1) });
        await h.controls.previewCandidate(null, 'null', new AbortController(), 1); expect(h.state.previewStatus).toBe('error');
        h.onPreview.mockResolvedValueOnce(result()); await h.controls.previewCandidate(null, 'null', new AbortController(), 1);
        expect(h.state.previewStatus).toBe('drawing'); h.state.candidateKey = 'null'; h.controls.drawEffect();
        expect(h.state.previewStatus).toBe('ready'); expect(h.image.pixels).toEqual(h.original);
    });
    it('does not enable Apply when the actual preview canvas failed to draw', async () => {
        const h = harness(); await h.controls.previewCandidate(null, 'null', new AbortController(), 1);
        h.state.candidateKey = 'null'; h.previewDraw.mockImplementation(() => { throw new Error('Drawing failed'); });
        h.controls.drawEffect(); expect(h.state.previewStatus).toBe('error'); expect(h.image.pixels).toEqual(h.original);
    });
});

describe('background source and apply lifetimes', () => {
    it('rejects stale original loads and StrictMode cleanup before they can overwrite source/canvas state', async () => {
        const h = harness(), read = deferred<typeof h.image>(); h.reader.mockReturnValue(read.promise);
        const deactivate = h.controls.lifetimeEffect(), cleanup = h.controls.loadEffect();
        cleanup(); deactivate(); h.controls.lifetimeEffect(); read.resolve(h.image); await tick();
        expect(h.refs.sourceRef.current).toBeNull(); expect(h.draw).not.toHaveBeenCalled(); expect(h.state.source).toBeNull();
    });
    it('picks exact visible raw RGB and does not replace a candidate when clicking transparency', () => {
        const h = harness(); h.state.enabled = false;
        const event = (clientX: number) => ({ clientX, clientY: 5, button: 0, isPrimary: true, currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 40, height: 10 }) } });
        h.controls.pick(event(10)); expect(h.state.hex).toBe('#090807'); expect(h.state.enabled).toBe(true);
        h.controls.pick(event(30)); expect(h.state.pickFailed).toBe(true); expect(h.state.hex).toBe('#090807'); expect(h.image.pixels).toEqual(h.original);
    });
    it('keeps Cancel active during apply and discards its late failure without changing the original', async () => {
        const h = harness(), applied = deferred<boolean>(); h.onApply.mockReturnValue(applied.promise);
        const run = h.controls.apply(); expect(h.state.busy).toBe(true); expect(h.onApply).toHaveBeenCalledOnce();
        const received = h.onApply.mock.calls[0][0]; expect(received).toEqual(h.state.candidate); expect(received).not.toBe(h.state.candidate);
        h.controls.cancel(); h.controls.cancel(); expect(h.onCancel).toHaveBeenCalledOnce();
        applied.resolve(false); await run; expect(h.state.applyFailed).toBe(false); expect(h.image.pixels).toEqual(h.original);
    });
    it('requires a valid completed preview and keeps failed apply retryable without calling Cancel', async () => {
        const h = harness(); h.state.previewReady = false; await h.controls.apply(); expect(h.onApply).not.toHaveBeenCalled();
        h.state.previewReady = true; h.state.candidate = undefined; await h.controls.apply(); expect(h.onApply).not.toHaveBeenCalled();
        h.state.candidate = null; h.onApply.mockResolvedValue(false); await h.controls.apply();
        expect(h.onApply).toHaveBeenCalledWith(null); expect(h.state.applyFailed).toBe(true); expect(h.state.busy).toBe(false); expect(h.onCancel).not.toHaveBeenCalled();
    });
});

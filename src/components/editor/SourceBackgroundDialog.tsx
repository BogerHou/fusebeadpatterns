'use client';

import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import type { SiteLocale } from '@/lib/i18n/locales';
import type { EditorSourceCrop } from '@/lib/core/utils/image-crop';
import { normalizeSourceBackground, type SourceBackground } from '@/lib/editor/source-background';
import { readSourceBackgroundImage, type SourceBackgroundImage } from '@/lib/editor/source-background-processing';
import { backgroundColorHex, parseBackgroundCandidate, pickBackgroundColor, validateBackgroundPreview, type BackgroundPreview } from '@/lib/editor/source-background-selection';
import { getSourceBackgroundCopy } from '@/lib/editor/source-background-copy';
import { EditorDialog } from './EditorDialog';

type Props = {
    imageSrc: string;
    sourceCrop: EditorSourceCrop | null;
    initialBackground: SourceBackground | null;
    locale: SiteLocale;
    onPreview: (background: SourceBackground | null, signal: AbortSignal) => Promise<BackgroundPreview>;
    onApply: (background: SourceBackground | null) => Promise<boolean>;
    onCancel: () => void;
    error?: string | null;
};
type PreviewState = { key: string; result: BackgroundPreview };
type Failure = 'load' | 'limit' | null;

/** Original pixels are retained for picking; the parent supplies the full bead conversion. */
export function SourceBackgroundDialog({ imageSrc, sourceCrop, initialBackground, locale, onPreview, onApply, onCancel, error }: Props) {
    const copy = getSourceBackgroundCopy(locale), id = useId();
    const initial = useRef(initialBackground);
    const sourceCanvas = useRef<HTMLCanvasElement>(null), previewCanvas = useRef<HTMLCanvasElement>(null);
    const sourceRef = useRef<SourceBackgroundImage | null>(null);
    const loadController = useRef<AbortController | null>(null), previewController = useRef<AbortController | null>(null);
    const alive = useRef(false), closed = useRef(false), loadEpoch = useRef(0), previewEpoch = useRef(0), applyEpoch = useRef(0);
    const previewCallback = useRef(onPreview);
    const [source, setSource] = useState<SourceBackgroundImage | null>(null);
    const [loadFailure, setLoadFailure] = useState<Failure>(null);
    const [enabled, setEnabled] = useState(initial.current !== null);
    const [hex, setHex] = useState(initial.current ? backgroundColorHex(initial.current.color) : '');
    const [tolerance, setTolerance] = useState(String(initial.current?.tolerance ?? 24));
    const [mode, setMode] = useState<SourceBackground['mode']>(initial.current?.mode ?? 'edge-connected');
    const [pickFailed, setPickFailed] = useState(false), [applyFailed, setApplyFailed] = useState(false);
    const [busy, setBusy] = useState(false), [retry, setRetry] = useState(0);
    const [preview, setPreview] = useState<PreviewState | null>(null);
    const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'drawing' | 'ready' | 'error' | 'limit'>('idle');
    const candidate = parseBackgroundCandidate(enabled, hex, tolerance, mode);
    const candidateKey = candidate === undefined ? 'invalid' : JSON.stringify(candidate);
    const previewReady = preview?.key === candidateKey && previewStatus === 'ready';

    useEffect(() => { previewCallback.current = onPreview; }, [onPreview]);
    useEffect(() => {
        alive.current = true; closed.current = false;
        const lifetimes = [loadEpoch, previewEpoch, applyEpoch];
        return () => {
            alive.current = false; closed.current = true;
            for (const lifetime of lifetimes) lifetime.current++;
            loadController.current?.abort(); previewController.current?.abort();
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController(), epoch = ++loadEpoch.current;
        loadController.current = controller; sourceRef.current = null;
        setSource(null); setLoadFailure(null);
        previewController.current?.abort(); previewEpoch.current++;
        void readSourceBackgroundImage(imageSrc, sourceCrop, controller.signal).then(result => {
            if (!alive.current || closed.current || controller.signal.aborted || epoch !== loadEpoch.current) return;
            const canvas = sourceCanvas.current, context = canvas?.getContext('2d');
            if (!canvas || !context) throw new Error('Canvas 2D is unavailable');
            canvas.width = result.width; canvas.height = result.height;
            // The reader returns getImageData's ordinary ArrayBuffer-backed
            // pixels. ImageData shares them; picking never reads the canvas.
            context.putImageData(new ImageData(result.pixels as Uint8ClampedArray<ArrayBuffer>, result.width, result.height), 0, 0);
            sourceRef.current = result; setSource(result);
        }).catch(cause => {
            if (!alive.current || closed.current || controller.signal.aborted || epoch !== loadEpoch.current) return;
            setLoadFailure(isBudgetError(cause) ? 'limit' : 'load');
        });
        return () => { controller.abort(); };
    }, [imageSrc, sourceCrop]);

    // Parameter changes invalidate the visible result immediately by key. The
    // abort signal and epoch also reject late callbacks from earlier candidates.
    useEffect(() => {
        const controller = new AbortController(), epoch = ++previewEpoch.current;
        previewController.current?.abort(); previewController.current = controller;
        if (!source || candidateKey === 'invalid' || busy) { setPreviewStatus('idle'); return () => controller.abort(); }
        setPreviewStatus('loading');
        const timer = window.setTimeout(() => {
            void previewCandidate(candidateKey === 'null' ? null : JSON.parse(candidateKey) as SourceBackground, candidateKey, controller, epoch);
        }, 120);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [candidateKey, source, retry, busy]); // Candidate is reconstructed from its immutable normalized key.

    useEffect(() => {
        if (!preview || preview.key !== candidateKey || previewStatus !== 'drawing') return;
        try {
            const canvas = previewCanvas.current;
            if (!canvas) throw new Error('Preview canvas is unavailable');
            const { pixels, width, height } = preview.result;
            canvas.width = width; canvas.height = height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas 2D is unavailable');
            context.putImageData(new ImageData(pixels as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
            setPreviewStatus('ready');
        } catch { setPreviewStatus('error'); }
    }, [preview, candidateKey, previewStatus]);

    async function previewCandidate(background: SourceBackground | null, key: string, controller: AbortController, epoch: number) {
        try {
            const result = validateBackgroundPreview(await previewCallback.current(normalizeSourceBackground(background), controller.signal));
            if (!alive.current || closed.current || controller.signal.aborted || epoch !== previewEpoch.current) return;
            setPreview({ key, result }); setPreviewStatus('drawing');
        } catch (cause) {
            if (!alive.current || closed.current || controller.signal.aborted || epoch !== previewEpoch.current) return;
            setPreviewStatus(isBudgetError(cause) ? 'limit' : 'error');
        }
    }

    function clearMessages() { setPickFailed(false); setApplyFailed(false); }
    function pick(event: PointerEvent<HTMLCanvasElement>) {
        if (busy || !sourceRef.current || event.button !== 0 || !event.isPrimary) return;
        const color = pickBackgroundColor(sourceRef.current, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
        clearMessages();
        if (!color) { setPickFailed(true); return; }
        setHex(backgroundColorHex(color)); setEnabled(true);
    }
    function cancel() {
        if (closed.current) return;
        closed.current = true; loadEpoch.current++; previewEpoch.current++; applyEpoch.current++;
        loadController.current?.abort(); previewController.current?.abort(); onCancel();
    }
    async function apply() {
        if (busy || !sourceRef.current || candidate === undefined || !previewReady || closed.current) return;
        const background = normalizeSourceBackground(candidate), epoch = ++applyEpoch.current;
        previewController.current?.abort(); previewEpoch.current++;
        setBusy(true); setApplyFailed(false);
        try {
            const ok = await onApply(background);
            if (alive.current && !closed.current && epoch === applyEpoch.current && !ok) setApplyFailed(true);
        } catch {
            if (alive.current && !closed.current && epoch === applyEpoch.current) setApplyFailed(true);
        } finally {
            if (alive.current && !closed.current && epoch === applyEpoch.current) setBusy(false);
        }
    }

    const invalid = enabled && candidate === undefined;
    const failure = error || (applyFailed ? copy.error : null);
    const checker = { backgroundColor: '#edf0ec', backgroundImage: 'linear-gradient(45deg,#dce2dc 25%,transparent 25%),linear-gradient(-45deg,#dce2dc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#dce2dc 75%),linear-gradient(-45deg,transparent 75%,#dce2dc 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0,0 8px,8px -8px,-8px 0' };

    return <EditorDialog locale={locale} title={copy.title} summary={copy.summary} onClose={cancel}>
        <div className="min-w-0 space-y-4" aria-busy={busy}>
            <p id={`${id}-pick-help`} className="text-xs leading-5 text-[#627168]">{copy.instruction}</p>
            {loadFailure ? <p role="alert" className="text-sm text-red-700">{loadFailure === 'limit' ? copy.limitError : copy.loadError}</p> : !source && <p role="status" className="text-sm">{copy.loading}</p>}
            <div className="mx-auto w-full" style={source ? { maxWidth: `min(100%, ${36 * source.width / source.height}svh, 640px)` } : undefined}>
                <div className="overflow-hidden rounded-md border border-[#aebdaf]" style={{ ...checker, display: source ? 'block' : 'none' }}>
                    <canvas ref={sourceCanvas} role="img" aria-label={copy.original} aria-describedby={`${id}-pick-help`} onPointerDown={pick}
                        className="block h-auto w-full" style={{ cursor: busy ? 'wait' : 'crosshair' }} />
                </div>
            </div>
            {source && <p className="text-xs text-[#627168]">{copy.original}: {source.width} × {source.height} {copy.pixelUnit}</p>}
            {pickFailed && <p role="status" className="text-sm text-[#627168]">{copy.transparent}</p>}
            <fieldset disabled={busy || !source} className="min-w-0 space-y-3">
                <legend className="sr-only">{copy.title}</legend>
                <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" checked={enabled} onChange={event => { setEnabled(event.target.checked); clearMessages(); }} className="h-4 w-4 accent-[#28614e]" />{copy.enabled}</label>
                <div className="grid min-w-0 grid-cols-2 gap-3">
                    <label htmlFor={`${id}-color`} className="min-w-0 text-xs font-medium">{copy.color}
                        <div className="mt-1 flex min-w-0 items-center gap-2"><span className="h-8 w-8 shrink-0 rounded border border-[#aebdaf]" aria-hidden="true" style={{ background: candidate?.color ? backgroundColorHex(candidate.color) : 'transparent' }} />
                            <input id={`${id}-color`} type="text" inputMode="text" autoComplete="off" spellCheck={false} maxLength={7} placeholder="#ffffff" value={hex}
                                aria-invalid={enabled && !/^#?[\da-f]{6}$/i.test(hex)} aria-describedby={invalid ? `${id}-invalid` : undefined}
                                onChange={event => { setHex(event.target.value); setEnabled(true); clearMessages(); }}
                                className="min-h-11 min-w-0 w-full rounded-md border border-[#aebdaf] px-2 font-mono text-base focus:outline-2 focus:outline-[#28614e]" />
                        </div>
                    </label>
                    <label htmlFor={`${id}-tolerance`} className="min-w-0 text-xs font-medium">{copy.tolerance}
                        <input id={`${id}-tolerance`} type="number" inputMode="numeric" min={0} max={255} step={1} value={tolerance} aria-invalid={invalid} aria-describedby={`${id}-tolerance-help`}
                            onChange={event => { setTolerance(event.target.value); clearMessages(); }}
                            className="mt-1 block min-h-11 min-w-0 w-full rounded-md border border-[#aebdaf] px-2 text-base tabular-nums focus:outline-2 focus:outline-[#28614e]" />
                    </label>
                </div>
                <p id={`${id}-tolerance-help`} className="text-xs leading-5 text-[#627168]">{copy.toleranceHelp}</p>
                <fieldset className="space-y-2" disabled={!enabled || busy}>
                    <legend className="mb-1 text-xs font-medium">{copy.mode}</legend>
                    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name={`${id}-mode`} value="edge-connected" checked={mode === 'edge-connected'} onChange={() => { setMode('edge-connected'); clearMessages(); }} className="accent-[#28614e]" />{copy.edge}</label>
                    <p className="pl-6 text-xs leading-5 text-[#627168]">{copy.edgeHelp}</p>
                    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name={`${id}-mode`} value="all-matching" checked={mode === 'all-matching'} onChange={() => { setMode('all-matching'); clearMessages(); }} className="accent-[#28614e]" />{copy.all}</label>
                    <p className={`pl-6 text-xs leading-5 ${enabled && mode === 'all-matching' ? 'text-amber-800' : 'text-[#627168]'}`}>{copy.allHelp}</p>
                </fieldset>
            </fieldset>
            {!enabled && <p className="text-xs leading-5 text-[#627168]">{copy.disabledHelp}</p>}
            {invalid && <p id={`${id}-invalid`} role="alert" className="text-sm text-red-700">{hex === '' ? copy.missingColor : copy.invalid}</p>}
            <section className="min-w-0 space-y-2 border-t border-[#d9ded5] pt-3" aria-labelledby={`${id}-preview-title`}>
                <h3 id={`${id}-preview-title`} className="text-sm font-semibold">{copy.preview}</h3>
                <p className="text-xs leading-5 text-[#627168]">{copy.previewHelp}</p>
                {(previewStatus === 'loading' || previewStatus === 'drawing') && <p role="status" className="text-sm">{copy.previewing}</p>}
                {(previewStatus === 'error' || previewStatus === 'limit') && <div className="space-y-1"><p role="alert" className="text-sm text-red-700">{previewStatus === 'limit' ? copy.limitError : copy.previewError}</p><button type="button" disabled={busy} onClick={() => setRetry(value => value + 1)} className="min-h-11 text-sm font-semibold text-[#28614e] underline underline-offset-4">{copy.retry}</button></div>}
                <div className="mx-auto w-full" style={previewReady && preview ? { maxWidth: `min(100%, ${32 * preview.result.width / preview.result.height}svh, 520px)` } : undefined}>
                    <canvas ref={previewCanvas} role="img" aria-label={copy.preview} className="block h-auto w-full rounded-md border border-[#aebdaf]" style={{ ...checker, imageRendering: 'pixelated', display: previewReady ? 'block' : 'none' }} />
                </div>
                {previewReady && preview && <p role="status" className="text-xs tabular-nums text-[#627168]">{preview.result.width} × {preview.result.height} · {preview.result.totalBeads.toLocaleString(locale)} {copy.beads}</p>}
            </section>
            <p className="rounded-lg bg-[#f7f6f2] p-3 text-xs leading-5 text-[#4b554e]">{copy.regenerationWarning}</p>
            {failure && <p role="alert" className="text-sm text-red-700">{failure}</p>}
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#d9ded5] pt-3">
                <button type="button" onClick={cancel} className="min-h-11 rounded-lg border border-[#aebdaf] bg-white px-4 py-2 text-sm font-semibold">{copy.cancel}</button>
                <button type="button" disabled={busy || !source || candidate === undefined || !previewReady} onClick={() => void apply()} className="min-h-11 rounded-lg bg-[#28614e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c493a] disabled:opacity-50">{busy ? copy.busy : copy.apply}</button>
            </div>
        </div>
    </EditorDialog>;
}

function isBudgetError(cause: unknown): boolean {
    return typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === 'IMAGE_TOO_LARGE';
}

export default SourceBackgroundDialog;

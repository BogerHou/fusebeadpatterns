'use client';

import { useEffect, useId, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import type { SiteLocale } from '@/lib/i18n/locales';
import { isValidSourceCrop, normalizeSourceCrop, type EditorSourceCrop } from '@/lib/core/utils/image-crop';
import { cropFields, drawCrop, moveCrop, parseCropFields, resizeCrop, resizeCropBy, type CropCorner, type CropFields, type CropPoint } from '@/lib/editor/crop-selection';
import { getSourceCropCopy } from '@/lib/editor/source-crop-copy';
import { EditorDialog } from './EditorDialog';

type Props = {
    imageSrc: string;
    initialCrop: EditorSourceCrop | null;
    locale: SiteLocale;
    error?: string | null;
    onApply: (crop: EditorSourceCrop | null) => Promise<boolean>;
    onCancel: () => void;
};
type Drag = { id: number; start: CropPoint; crop: EditorSourceCrop; mode: 'draw' | 'move' | CropCorner };
const fieldKeys = ['x', 'y', 'width', 'height'] as const;
const corners: CropCorner[] = ['nw', 'ne', 'sw', 'se'];

/** Local-only preview. The editor applies the selection to the original image. */
export function SourceCropDialog({ imageSrc, initialCrop, locale, error, onApply, onCancel }: Props) {
    const copy = getSourceCropCopy(locale);
    const id = useId();
    const canvas = useRef<HTMLCanvasElement>(null);
    const drag = useRef<Drag | null>(null);
    const alive = useRef(true);
    const [loaded, setLoaded] = useState<{ source: string; crop: EditorSourceCrop } | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [fields, setFields] = useState<CropFields | null>(null);
    const [busy, setBusy] = useState(false);
    const [applyFailed, setApplyFailed] = useState(false);
    // Capture the applied selection only when the dialog opens for this source.
    const initial = useRef(initialCrop);
    useEffect(() => {
        alive.current = true;
        let cancelled = false;
        const image = new window.Image();
        image.onload = () => {
            if (cancelled || !canvas.current) return;
            const sourceWidth = image.naturalWidth;
            const sourceHeight = image.naturalHeight;
            const full = { sourceWidth, sourceHeight, x: 0, y: 0, width: sourceWidth, height: sourceHeight };
            const current = initial.current ?? full;
            if (!isValidSourceCrop(current) || current.sourceWidth !== sourceWidth || current.sourceHeight !== sourceHeight) {
                setLoadFailed(true); return;
            }
            const scale = Math.min(1, 1280 / sourceWidth, 960 / sourceHeight);
            canvas.current.width = Math.max(1, Math.round(sourceWidth * scale));
            canvas.current.height = Math.max(1, Math.round(sourceHeight * scale));
            const context = canvas.current.getContext('2d');
            if (!context) { setLoadFailed(true); return; }
            context.drawImage(image, 0, 0, canvas.current.width, canvas.current.height);
            setLoaded({ source: imageSrc, crop: full });
            setFields(cropFields(current));
        };
        image.onerror = () => { if (!cancelled) setLoadFailed(true); };
        image.src = imageSrc;
        return () => { cancelled = true; alive.current = false; image.onload = null; image.onerror = null; };
    }, [imageSrc]);

    const full = loaded?.source === imageSrc ? loaded.crop : null;
    const selection = full && fields ? parseCropFields(fields, full.sourceWidth, full.sourceHeight) : null;
    const update = (crop: EditorSourceCrop) => { setFields(cropFields(crop)); setApplyFailed(false); };
    const point = (clientX: number, clientY: number): CropPoint => {
        // The canvas excludes the preview container's border. Use its actual
        // CSS size, not the bounded backing bitmap or devicePixelRatio.
        const rect = canvas.current!.getBoundingClientRect();
        return { x: (clientX - rect.left) / rect.width * full!.sourceWidth, y: (clientY - rect.top) / rect.height * full!.sourceHeight };
    };
    const start = (event: PointerEvent<HTMLDivElement>) => {
        if (busy || !full || !selection || event.button !== 0 || !event.isPrimary) return;
        const at = point(event.clientX, event.clientY);
        const target = event.target as HTMLElement;
        const corner = target.closest<HTMLElement>('[data-crop-corner]')?.dataset.cropCorner as CropCorner | undefined;
        const inside = at.x >= selection.x && at.x < selection.x + selection.width && at.y >= selection.y && at.y < selection.y + selection.height;
        const mode = corner ?? (inside ? 'move' : 'draw');
        drag.current = { id: event.pointerId, start: at, crop: selection, mode };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
        if (mode === 'draw') update(drawCrop(full.sourceWidth, full.sourceHeight, at, at));
    };
    const move = (event: PointerEvent<HTMLDivElement>) => {
        const active = drag.current;
        if (!active || active.id !== event.pointerId || busy || !full) return;
        const at = point(event.clientX, event.clientY);
        update(active.mode === 'draw' ? drawCrop(full.sourceWidth, full.sourceHeight, active.start, at)
            : active.mode === 'move' ? moveCrop(active.crop, at.x - active.start.x, at.y - active.start.y)
                : resizeCropBy(active.crop, active.mode, at.x - active.start.x, at.y - active.start.y));
    };
    const end = (event: PointerEvent<HTMLDivElement>) => {
        if (drag.current?.id !== event.pointerId) return;
        if (event.type === 'pointercancel' || event.type === 'lostpointercapture') update(drag.current.crop);
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    const arrowResize = (event: KeyboardEvent<HTMLButtonElement>, corner: CropCorner) => {
        if (!selection || busy || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation();
        const step = event.shiftKey ? 10 : 1;
        const at = { x: selection.x + (corner.endsWith('e') ? selection.width : 0), y: selection.y + (corner.startsWith('s') ? selection.height : 0) };
        if (event.key === 'ArrowLeft') at.x -= step;
        if (event.key === 'ArrowRight') at.x += step;
        if (event.key === 'ArrowUp') at.y -= step;
        if (event.key === 'ArrowDown') at.y += step;
        update(resizeCrop(selection, corner, at));
    };
    const apply = async () => {
        if (!selection || busy) return;
        setBusy(true); setApplyFailed(false);
        try {
            const ok = await onApply(normalizeSourceCrop(selection));
            if (alive.current && !ok) setApplyFailed(true);
        } catch { if (alive.current) setApplyFailed(true); }
        finally { if (alive.current) setBusy(false); }
    };
    const labels = { x: copy.left, y: copy.top, width: copy.width, height: copy.height };
    const failure = error || (applyFailed ? copy.error : null);

    return <EditorDialog locale={locale} title={copy.title} summary={copy.summary} onClose={onCancel}>
        <div className="space-y-4" aria-busy={busy}>
            <p id={`${id}-instructions`} className="text-xs leading-5 text-[#627168]">{copy.instruction}</p>
            {loadFailed ? <p role="alert" className="text-sm text-red-700">{copy.loadError}</p> : !full && <p role="status" className="text-sm">{copy.loading}</p>}
            <div className="mx-auto w-full" style={full ? { maxWidth: `min(100%, ${42 * full.sourceWidth / full.sourceHeight}svh, 640px)` } : undefined}>
                <div className="relative w-full touch-none select-none overflow-hidden rounded-md border border-[#d9ded5] bg-[#edf0ec]"
                    style={{ display: full ? 'block' : 'none', aspectRatio: full ? full.sourceWidth / full.sourceHeight : 1, cursor: busy ? 'wait' : 'crosshair' }}
                    aria-describedby={`${id}-instructions`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
                    <canvas ref={canvas} role="img" aria-label={copy.preview} className="block h-full w-full" />
                    {selection && <div className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] outline outline-1 outline-[#28614e]"
                        style={{ left: `${selection.x / full!.sourceWidth * 100}%`, top: `${selection.y / full!.sourceHeight * 100}%`, width: `${selection.width / full!.sourceWidth * 100}%`, height: `${selection.height / full!.sourceHeight * 100}%` }}>
                        {corners.map(corner => <button key={corner} type="button" data-crop-corner={corner} disabled={busy} aria-label={copy[corner]}
                            onKeyDown={event => arrowResize(event, corner)}
                            className="pointer-events-auto absolute flex h-9 w-9 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-[#111] disabled:cursor-wait"
                            style={{ [corner.startsWith('n') ? 'top' : 'bottom']: 0, [corner.endsWith('w') ? 'left' : 'right']: 0, cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize' }}>
                            <span className="h-2.5 w-2.5 rounded-sm border border-[#28614e] bg-white" />
                        </button>)}
                    </div>}
                </div>
            </div>
            {full && fields && <>
                <p className="text-xs text-[#627168]">{copy.dimensions}: {full.sourceWidth} × {full.sourceHeight} {copy.pixelUnit}</p>
                <fieldset disabled={busy} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <legend className="sr-only">{copy.selection}</legend>
                    {fieldKeys.map(key => <label key={key} htmlFor={`${id}-${key}`} className="text-xs font-medium">{labels[key]}
                        <input id={`${id}-${key}`} name={`crop-${key}`} type="number" inputMode="numeric" min={key === 'x' || key === 'y' ? 0 : 1} step={1}
                            max={key === 'x' ? full.sourceWidth - 1 : key === 'y' ? full.sourceHeight - 1 : key === 'width' ? full.sourceWidth : full.sourceHeight}
                            value={fields[key]} aria-invalid={!selection} aria-describedby={!selection ? `${id}-invalid` : undefined}
                            onChange={event => { setFields({ ...fields, [key]: event.target.value }); setApplyFailed(false); }}
                            className="mt-1 block min-h-11 w-full rounded-md border border-[#bbc7bc] bg-white px-2 text-base tabular-nums focus:outline-2 focus:outline-[#28614e] disabled:bg-gray-100" />
                    </label>)}
                </fieldset>
                {!selection && <p id={`${id}-invalid`} role="alert" className="text-sm text-red-700">{copy.invalid}</p>}
                <button type="button" disabled={busy} onClick={() => update(full)} className="min-h-11 text-sm font-semibold text-[#28614e] underline underline-offset-4 disabled:opacity-50">{copy.whole}</button>
            </>}
            <p className="rounded-lg bg-[#f7f6f2] p-3 text-xs leading-5 text-[#4b554e]">{copy.regenerationWarning}</p>
            {failure && <p role="alert" className="text-sm text-red-700">{failure}</p>}
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#d9ded5] pt-3">
                <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-[#bbc7bc] bg-white px-4 py-2 text-sm font-semibold">{copy.cancel}</button>
                <button type="button" disabled={!selection || busy || loadFailed} onClick={() => void apply()} className="min-h-11 rounded-lg bg-[#28614e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c493a] disabled:opacity-50">{busy ? copy.busy : copy.apply}</button>
            </div>
        </div>
    </EditorDialog>;
}

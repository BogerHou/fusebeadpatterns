'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useDialogFocus } from '@/components/editor/useDialogFocus';
import { cropFields, drawCrop, moveCrop, parseCropFields, resizeCrop, resizeCropBy, type CropCorner, type CropPoint } from '@/lib/editor/crop-selection';
import { cropPixelSource, validatePixelSourceCrop, type PixelSourceCrop } from '@/lib/pixel-grid/source-crop';
import { resizeImage, type ResizeMode } from '@/lib/pixel-grid/core';
import { reducePixelGridColors, type ColorLimit } from '@/lib/pixel-grid/conversion';
import type { PixelSourceImage } from '@/lib/pixel-grid/locale-navigation';
import type { PixelGridLocale } from '@/lib/pixel-grid/messages';
import { PIXEL_CROP_COPY } from '@/lib/pixel-grid/crop-copy';
import styles from './PixelSourceCropDialog.module.css';

export type PixelSourceCropDialogProps = {
    source: PixelSourceImage; initialCrop: PixelSourceCrop | null; locale: PixelGridLocale;
    targetWidth: number; targetHeight: number; mode: ResizeMode; colorLimit: ColorLimit;
    onApply: (crop: PixelSourceCrop | null) => void; onCancel: () => void;
};
type Drag = { id: number; start: CropPoint; crop: PixelSourceCrop; mode: 'draw' | 'move' | CropCorner };
const keys = ['x', 'y', 'width', 'height'] as const;
const corners = ['nw', 'ne', 'sw', 'se'] as const;
const moves: Record<string, readonly [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** Display copies only. The complete original RGBA remains the conversion source. */
export default function PixelSourceCropDialog({ source, initialCrop, locale, targetWidth, targetHeight, mode, colorLimit, onApply, onCancel }: PixelSourceCropDialogProps) {
    const copy = PIXEL_CROP_COPY[locale];
    const id = useId();
    const modal = useDialogFocus(true, onCancel);
    const canvas = useRef<HTMLCanvasElement>(null), preview = useRef<HTMLCanvasElement>(null);
    const drag = useRef<Drag | null>(null);
    const full: PixelSourceCrop = { sourceWidth: source.width, sourceHeight: source.height, x: 0, y: 0, width: source.width, height: source.height };
    const [fields, setFields] = useState(() => cropFields(validatePixelSourceCrop(initialCrop, source) ?? full));
    const [failed, setFailed] = useState(false);
    const [previewRevision, setPreviewRevision] = useState(0);
    const [renderedPreview, setRenderedPreview] = useState('');
    const previewKey = JSON.stringify([fields.x, fields.y, fields.width, fields.height, targetWidth, targetHeight, mode, colorLimit]);
    const selection = parseCropFields(fields, source.width, source.height);
    const update = (crop: PixelSourceCrop) => setFields(cropFields(crop));

    useEffect(() => {
        const output = canvas.current;
        if (!output) return;
        const input = document.createElement('canvas');
        try {
            input.width = source.width; input.height = source.height;
            const inputContext = input.getContext('2d'), context = output.getContext('2d');
            if (!inputContext || !context) throw new Error('Canvas unavailable');
            inputContext.putImageData(new ImageData(new Uint8ClampedArray(source.pixels), source.width, source.height), 0, 0);
            const scale = Math.min(1, 1280 / source.width, 960 / source.height);
            output.width = Math.max(1, Math.round(source.width * scale)); output.height = Math.max(1, Math.round(source.height * scale));
            context.drawImage(input, 0, 0, output.width, output.height);
        } catch { setFailed(true); }
        finally { input.width = input.height = 0; }
        return () => { output.width = output.height = 0; };
    }, [source]);

    useEffect(() => {
        const output = preview.current;
        const active = parseCropFields(fields, source.width, source.height);
        if (!output || !active || drag.current) return;
        // One cancellable settled preview, never one full RGBA copy per pointermove.
        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            try {
                const result = reducePixelGridColors(resizeImage(cropPixelSource(source, active), targetWidth, targetHeight, mode), colorLimit);
                output.width = result.width; output.height = result.height;
                const context = output.getContext('2d');
                if (!context) throw new Error('Canvas unavailable');
                context.putImageData(new ImageData(result.pixels, result.width, result.height), 0, 0);
                setRenderedPreview(previewKey);
            } catch { setFailed(true); }
        }, 120);
        return () => { cancelled = true; window.clearTimeout(timer); };
    }, [source, fields, targetWidth, targetHeight, mode, colorLimit, previewKey, previewRevision]);

    const point = (event: { clientX: number; clientY: number }): CropPoint => {
        const rect = canvas.current!.getBoundingClientRect();
        return { x: (event.clientX - rect.left) / rect.width * source.width, y: (event.clientY - rect.top) / rect.height * source.height };
    };
    const start = (event: PointerEvent<HTMLDivElement>) => {
        if (!selection || failed || event.button !== 0 || event.isPrimary === false || drag.current) return;
        const at = point(event);
        const corner = (event.target as HTMLElement).closest<HTMLElement>('[data-crop-corner]')?.dataset.cropCorner as CropCorner | undefined;
        const inside = at.x >= selection.x && at.x < selection.x + selection.width && at.y >= selection.y && at.y < selection.y + selection.height;
        const whole = selection.x === 0 && selection.y === 0 && selection.width === source.width && selection.height === source.height;
        const mode = corner ?? (inside && !whole ? 'move' : 'draw');
        drag.current = { id: event.pointerId, start: at, crop: selection, mode };
        event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault();
        if (mode === 'draw') update(drawCrop(source.width, source.height, at, at));
    };
    const move = (event: PointerEvent<HTMLDivElement>) => {
        const active = drag.current;
        if (!active || active.id !== event.pointerId) return;
        const at = point(event);
        update(active.mode === 'draw' ? drawCrop(source.width, source.height, active.start, at)
            : active.mode === 'move' ? moveCrop(active.crop, at.x - active.start.x, at.y - active.start.y)
                : resizeCropBy(active.crop, active.mode, at.x - active.start.x, at.y - active.start.y));
    };
    const end = (event: PointerEvent<HTMLDivElement>) => {
        const active = drag.current;
        if (!active || active.id !== event.pointerId) return;
        drag.current = null;
        if (event.type === 'pointercancel' || event.type === 'lostpointercapture') update(active.crop);
        setPreviewRevision(value => value + 1);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    const keyboard = (event: KeyboardEvent<HTMLElement>, corner?: CropCorner) => {
        if (!selection || !Object.hasOwn(moves, event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
        event.preventDefault(); event.stopPropagation();
        const [dx, dy] = moves[event.key], step = event.shiftKey ? 10 : 1;
        if (corner) update(resizeCrop(selection, corner, { x: selection.x + (corner.endsWith('e') ? selection.width : 0) + dx * step, y: selection.y + (corner.startsWith('s') ? selection.height : 0) + dy * step }));
        else update(moveCrop(selection, dx * step, dy * step));
    };
    const labels = { x: copy.left, y: copy.top, width: copy.width, height: copy.height };
    return <div className={styles.backdrop} ref={modal} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`} tabIndex={-1} lang={locale}>
        <section className={styles.dialog}>
            <h2 id={`${id}-title`}>{copy.title}</h2>
            <p id={`${id}-help`}>{copy.help}</p>
            <p id={`${id}-instructions`}>{copy.instruction}</p>
            <div className={styles.source} style={{ aspectRatio: source.width / source.height, maxWidth: `min(100%, ${42 * source.width / source.height}svh, 640px)` }}
                role="group" aria-label={copy.selection} aria-describedby={`${id}-instructions`} tabIndex={0} onKeyDown={event => { if (event.target === event.currentTarget) keyboard(event); }}
                onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
                <canvas ref={canvas} aria-label={copy.preview} role="img" />
                {selection && <div className={styles.selection} style={{ left: `${selection.x / source.width * 100}%`, top: `${selection.y / source.height * 100}%`, width: `${selection.width / source.width * 100}%`, height: `${selection.height / source.height * 100}%` }}>
                    {corners.map(corner => <button key={corner} type="button" className={styles.corner} data-crop-corner={corner} aria-label={copy[corner]}
                        style={{ [corner.startsWith('n') ? 'top' : 'bottom']: 0, [corner.endsWith('w') ? 'left' : 'right']: 0 }} onKeyDown={event => keyboard(event, corner)}><span /></button>)}
                </div>}
            </div>
            <fieldset className={styles.fields}><legend>{copy.selection} ({source.width} × {source.height})</legend>
                {keys.map(key => <label key={key}>{labels[key]}<input name={`pixel-crop-${key}`} type="number" inputMode="numeric" step={1} min={key === 'x' || key === 'y' ? 0 : 1}
                    max={key === 'x' ? source.width - 1 : key === 'y' ? source.height - 1 : key === 'width' ? source.width : source.height}
                    value={fields[key]} onChange={event => setFields({ ...fields, [key]: event.target.value })} aria-invalid={!selection} aria-describedby={!selection ? `${id}-invalid` : undefined} /></label>)}
            </fieldset>
            {!selection && <p role="alert" id={`${id}-invalid`}>{copy.invalid}</p>}
            {failed && <p role="alert">{copy.previewFailed}</p>}
            <div className={styles.result}><p>{copy.result} ({targetWidth} × {targetHeight})</p><canvas ref={preview} role="img" aria-label={copy.result} hidden={!selection || failed || previewKey !== renderedPreview} />
                {selection && !failed && previewKey !== renderedPreview && <p role="status">{copy.previewPending}</p>}<p>{copy.previewHelp}</p></div>
            <div className={styles.actions}>
                <button type="button" onClick={() => update(full)}>{copy.whole}</button>
                <button type="button" onClick={onCancel}>{copy.cancel}</button>
                <button type="button" disabled={!selection || failed} onClick={() => { if (selection) onApply(validatePixelSourceCrop(selection, source)); }}>{copy.apply}</button>
            </div>
        </section>
    </div>;
}

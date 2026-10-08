'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { trackPixelGridExport } from '@/lib/analytics';
import {
    LIMITS, createGrid, dimensions, paintLine, resizeImage, GridHistory, gridsEqual,
    serializeProject, parseProject, inspectImage, encodePng,
    type PixelGrid, type PixelPoint, type ResizeMode, type RgbaSource,
} from '@/lib/pixel-grid/core';
import styles from './PixelGridWorkspace.module.css';

type Tool = 'brush' | 'eraser' | 'pan';
type Zoom = 'fit' | '4' | '8' | '16' | '24' | '32';
type Color = [number, number, number, number];
type SourceImage = RgbaSource & { name: string };
type Stroke = {
    id: number; tool: 'brush' | 'eraser'; last: PixelPoint | null; color: Color; before: PixelGrid;
} | { id: number; tool: 'pan'; start: PixelPoint; scroll: PixelPoint };

const MODE_LABELS: Record<ResizeMode, string> = {
    fit: 'kept proportions with transparent margins',
    crop: 'cropped from the center',
    stretch: 'stretched to fill',
};
const MOVES: Record<string, PixelPoint> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

function subscribeWideViewport(callback: () => void) {
    const query = window.matchMedia('(min-width: 761px)');
    query.addEventListener('change', callback);
    return () => query.removeEventListener('change', callback);
}
function wideViewport() { return window.matchMedia('(min-width: 761px)').matches; }
function serverViewport() { return false; }

function drawGrid(target: HTMLCanvasElement, grid: PixelGrid, scale: number, lines: boolean, cursor?: PixelPoint) {
    target.width = grid.width * scale;
    target.height = grid.height * scale;
    const context = target.getContext('2d');
    const source = document.createElement('canvas');
    source.width = grid.width;
    source.height = grid.height;
    const sourceContext = source.getContext('2d');
    if (!context || !sourceContext) throw new Error('Canvas drawing is unavailable in this browser.');
    sourceContext.putImageData(new ImageData(new Uint8ClampedArray(grid.pixels), grid.width, grid.height), 0, 0);
    context.imageSmoothingEnabled = false;
    context.drawImage(source, 0, 0, target.width, target.height);
    if (lines) {
        context.strokeStyle = 'rgba(48,66,57,.45)';
        context.lineWidth = 1;
        context.beginPath();
        for (let x = 0; x <= grid.width; x++) {
            const p = Math.min(target.width - .5, x * scale + .5);
            context.moveTo(p, 0); context.lineTo(p, target.height);
        }
        for (let y = 0; y <= grid.height; y++) {
            const p = Math.min(target.height - .5, y * scale + .5);
            context.moveTo(0, p); context.lineTo(target.width, p);
        }
        context.stroke();
    }
    if (cursor) {
        context.strokeStyle = '#b5444a';
        context.lineWidth = 1;
        context.strokeRect(cursor[0] * scale + .5, cursor[1] * scale + .5, Math.max(0, scale - 1), Math.max(0, scale - 1));
    }
    source.width = source.height = 0;
}

function errorMessage(error: unknown) {
    return error instanceof Error && !(error instanceof TypeError)
        ? error.message
        : 'This operation could not be completed. Your drawing was kept. Please try again.';
}

export default function PixelGridWorkspace() {
    const isWideViewport = useSyncExternalStore(subscribeWideViewport, wideViewport, serverViewport);
    const [settingsExpanded, setSettingsExpanded] = useState<boolean | null>(null);
    const [grid, setGrid] = useState(() => createGrid(16, 16));
    const [width, setWidth] = useState('16');
    const [height, setHeight] = useState('16');
    const [mode, setMode] = useState<ResizeMode>('fit');
    const [tool, setTool] = useState<Tool>('brush');
    const [color, setColor] = useState('#f06a45');
    const [alpha, setAlpha] = useState(255);
    const [zoom, setZoom] = useState<Zoom>('fit');
    const [showGrid, setShowGrid] = useState(true);
    const [cursor, setCursor] = useState<PixelPoint>([0, 0]);
    const [focused, setFocused] = useState(false);
    const [panning, setPanning] = useState(false);
    const [viewportSize, setViewportSize] = useState({ width: 640, height: 480 });
    const [historyState, setHistoryState] = useState({ undo: false, redo: false });
    const [dirty, setDirty] = useState(false);
    const [sourceInfo, setSourceInfo] = useState<{ name: string; width: number; height: number } | null>(null);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState({ text: 'Ready. Draw or import an image.', error: false });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef(grid);
    const savedRef = useRef(grid);
    const cursorRef = useRef<PixelPoint>([0, 0]);
    const sourceRef = useRef<SourceImage | null>(null);
    const historyRef = useRef(new GridHistory(50));
    const strokeRef = useRef<Stroke | null>(null);
    const dirtyRef = useRef(false);
    const busyRef = useRef(false);
    const mountedRef = useRef(false);
    const taskId = useRef(0);
    const allowUnload = useRef(false);
    const downloads = useRef(new Map<string, number>());

    const scale = zoom === 'fit'
        ? Math.max(1, Math.min(24, Math.floor(Math.min(Math.max(1, viewportSize.width - 24) / grid.width, Math.max(1, viewportSize.height - 24) / grid.height))))
        : Number(zoom);
    let nontransparent = 0;
    for (let i = 3; i < grid.pixels.length; i += 4) if (grid.pixels[i] > 0) nontransparent++;

    const syncHistory = useCallback(() => {
        setHistoryState({ undo: historyRef.current.canUndo, redo: historyRef.current.canRedo });
        dirtyRef.current = !gridsEqual(gridRef.current, savedRef.current);
        setDirty(dirtyRef.current);
    }, []);

    const finishStroke = useCallback((pointerId?: number) => {
        const current = strokeRef.current;
        if (!current || (pointerId !== undefined && pointerId !== current.id)) return;
        strokeRef.current = null;
        if (current.tool !== 'pan') historyRef.current.push(current.before, gridRef.current);
        const canvas = canvasRef.current;
        if (canvas?.hasPointerCapture(current.id)) canvas.releasePointerCapture(current.id);
        setPanning(false);
        syncHistory();
    }, [syncHistory]);

    const publish = useCallback((next: PixelGrid, message?: string) => {
        const changedSize = next.width !== gridRef.current.width || next.height !== gridRef.current.height;
        gridRef.current = next;
        setGrid(next);
        cursorRef.current = [Math.min(cursorRef.current[0], next.width - 1), Math.min(cursorRef.current[1], next.height - 1)];
        setCursor(cursorRef.current);
        setWidth(String(next.width)); setHeight(String(next.height));
        if (changedSize) {
            setZoom('fit');
            if (viewportRef.current) viewportRef.current.scrollLeft = viewportRef.current.scrollTop = 0;
        }
        syncHistory();
        if (message) setStatus({ text: message, error: false });
    }, [syncHistory]);

    const commit = useCallback((next: PixelGrid, message: string) => {
        finishStroke();
        historyRef.current.push(gridRef.current, next);
        publish(next, message);
    }, [finishStroke, publish]);

    const action = useCallback((callback: () => void) => {
        if (busyRef.current) return;
        finishStroke();
        try { callback(); } catch (error) { setStatus({ text: errorMessage(error), error: true }); }
    }, [finishStroke]);

    const undo = useCallback((redo = false) => action(() => {
        const next = redo ? historyRef.current.redo(gridRef.current) : historyRef.current.undo(gridRef.current);
        if (next) publish(next, redo ? 'Redid the last operation.' : 'Undid the last operation.');
    }), [action, publish]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) drawGrid(canvas, grid, scale, showGrid, focused && tool !== 'pan' ? cursor : undefined);
    }, [grid, scale, showGrid, focused, tool, cursor]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const measure = () => setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });
        const observer = new ResizeObserver(measure);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const viewport = viewportRef.current, canvas = canvasRef.current;
        if (!viewport || !canvas || zoom === 'fit') return;
        const cellSize = Number(zoom);
        const canvasBounds = canvas.getBoundingClientRect(), viewportBounds = viewport.getBoundingClientRect();
        viewport.scrollLeft += canvasBounds.left - viewportBounds.left + (cursorRef.current[0] + .5) * cellSize - viewport.clientWidth / 2;
        viewport.scrollTop += canvasBounds.top - viewportBounds.top + (cursorRef.current[1] + .5) * cellSize - viewport.clientHeight / 2;
    }, [zoom]);

    useEffect(() => {
        mountedRef.current = true;
        const activeDownloads = downloads.current;
        const sequence = taskId;
        const beforeUnload = (event: BeforeUnloadEvent) => {
            if (dirtyRef.current && !allowUnload.current) { event.preventDefault(); event.returnValue = ''; }
        };
        // A document capture listener sees the surrounding layout's Next Links before
        // their client-router handlers. Confirmed exits use a real navigation so the
        // workspace does not need to inject state into the shared site layout.
        const navigate = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dirtyRef.current) return;
            const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
            if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
            const destination = new URL(anchor.href, location.href);
            if (!['http:', 'https:'].includes(destination.protocol)) return;
            if (destination.origin === location.origin && destination.pathname === location.pathname && destination.search === location.search) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            finishStroke();
            if (window.confirm('You have unsaved pixel edits. Cancel to save an editable project, or leave without saving.')) {
                allowUnload.current = true;
                window.location.assign(destination.href);
            }
        };
        const keyboard = (event: globalThis.KeyboardEvent) => {
            if (busyRef.current || !(event.ctrlKey || event.metaKey) || event.altKey) return;
            if (event.target instanceof Element && event.target.closest('input,select,textarea,[contenteditable="true"]')) return;
            if (event.key.toLowerCase() === 'z') { event.preventDefault(); undo(event.shiftKey); }
            else if (event.key.toLowerCase() === 'y') { event.preventDefault(); undo(true); }
        };
        const blur = () => finishStroke();
        const pageShow = () => { allowUnload.current = false; };
        window.addEventListener('beforeunload', beforeUnload);
        window.addEventListener('blur', blur);
        window.addEventListener('pageshow', pageShow);
        document.addEventListener('click', navigate, true);
        document.addEventListener('keydown', keyboard);
        return () => {
            mountedRef.current = false;
            sequence.current++;
            busyRef.current = false;
            strokeRef.current = null;
            sourceRef.current = null;
            window.removeEventListener('beforeunload', beforeUnload);
            window.removeEventListener('blur', blur);
            window.removeEventListener('pageshow', pageShow);
            document.removeEventListener('click', navigate, true);
            document.removeEventListener('keydown', keyboard);
            for (const [url, timer] of activeDownloads) { window.clearTimeout(timer); URL.revokeObjectURL(url); }
            activeDownloads.clear();
        };
    }, [finishStroke, undo]);

    function paintColor(): Color {
        return [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16), alpha];
    }

    function point(event: PointerEvent<HTMLCanvasElement>): PixelPoint | null {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
        if (x < 0 || x >= 1 || y < 0 || y >= 1) return null;
        return [Math.floor(x * gridRef.current.width), Math.floor(y * gridRef.current.height)];
    }

    function paint(from: PixelPoint, to: PixelPoint, rgba: Color) {
        // Each render receives its own pixel snapshot; the history still records a
        // whole pointer stroke once rather than one entry per pointermove.
        const next = createGrid(gridRef.current.width, gridRef.current.height, gridRef.current.pixels);
        paintLine(next, from, to, rgba);
        gridRef.current = next;
        setGrid(next);
        cursorRef.current = to; setCursor(to);
        dirtyRef.current = !gridsEqual(next, savedRef.current); setDirty(dirtyRef.current);
    }

    function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
        if (busyRef.current || strokeRef.current || event.button !== 0 || event.isPrimary === false) return;
        const cell = point(event), viewport = viewportRef.current;
        if (!cell || !viewport) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        if (tool === 'pan') {
            strokeRef.current = { id: event.pointerId, tool, start: [event.clientX, event.clientY], scroll: [viewport.scrollLeft, viewport.scrollTop] };
            setPanning(true);
        } else {
            const rgba: Color = tool === 'eraser' ? [0, 0, 0, 0] : paintColor();
            strokeRef.current = { id: event.pointerId, tool, last: cell, color: rgba, before: createGrid(gridRef.current.width, gridRef.current.height, gridRef.current.pixels) };
            paint(cell, cell, rgba);
        }
    }

    function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
        const stroke = strokeRef.current;
        if (busyRef.current || !stroke || stroke.id !== event.pointerId) return;
        event.preventDefault();
        if (stroke.tool === 'pan') {
            const viewport = viewportRef.current;
            if (viewport) {
                viewport.scrollLeft = stroke.scroll[0] + stroke.start[0] - event.clientX;
                viewport.scrollTop = stroke.scroll[1] + stroke.start[1] - event.clientY;
            }
        } else {
            const next = point(event);
            if (next) paint(stroke.last ?? next, next, stroke.color);
            stroke.last = next;
        }
    }

    function keyboard(event: KeyboardEvent<HTMLCanvasElement>) {
        if (busyRef.current || event.ctrlKey || event.metaKey || event.altKey) return;
        const move = MOVES[event.key];
        if (tool === 'pan') {
            if (move && viewportRef.current) { event.preventDefault(); viewportRef.current.scrollLeft += move[0] * 64; viewportRef.current.scrollTop += move[1] * 64; }
            return;
        }
        if (move) {
            event.preventDefault();
            cursorRef.current = [Math.max(0, Math.min(gridRef.current.width - 1, cursorRef.current[0] + move[0])), Math.max(0, Math.min(gridRef.current.height - 1, cursorRef.current[1] + move[1]))];
            setCursor(cursorRef.current);
            const viewport = viewportRef.current, canvas = canvasRef.current;
            if (viewport && canvas) {
                const viewBounds = viewport.getBoundingClientRect(), canvasBounds = canvas.getBoundingClientRect();
                const left = canvasBounds.left + cursorRef.current[0] * scale, top = canvasBounds.top + cursorRef.current[1] * scale;
                if (left < viewBounds.left + 4) viewport.scrollLeft -= viewBounds.left + 4 - left;
                else if (left + scale > viewBounds.right - 4) viewport.scrollLeft += left + scale - viewBounds.right + 4;
                if (top < viewBounds.top + 4) viewport.scrollTop -= viewBounds.top + 4 - top;
                else if (top + scale > viewBounds.bottom - 4) viewport.scrollTop += top + scale - viewBounds.bottom + 4;
            }
        } else if ([' ', 'Enter', 'Delete', 'Backspace'].includes(event.key)) {
            event.preventDefault(); finishStroke();
            const before = createGrid(gridRef.current.width, gridRef.current.height, gridRef.current.pixels);
            paint(cursorRef.current, cursorRef.current, ['Delete', 'Backspace'].includes(event.key) || tool === 'eraser' ? [0, 0, 0, 0] : paintColor());
            historyRef.current.push(before, gridRef.current); syncHistory();
        }
    }

    function newCanvas(w = Number(width), h = Number(height)) {
        action(() => commit(createGrid(w, h), `Created a blank ${w} × ${h} canvas. Undo restores the previous drawing.`));
    }

    function resize(fromSource = false) {
        action(() => {
            const target = dimensions(Number(width), Number(height));
            const source = fromSource ? sourceRef.current : gridRef.current;
            if (!source) return;
            const next = resizeImage(source, target.width, target.height, mode);
            commit(next, `${fromSource ? 'Reapplied the last image' : 'Resized the drawing'} to ${target.width} × ${target.height}; ${MODE_LABELS[mode]}. Undo restores your edits.`);
        });
    }

    function download(blob: Blob, name: string) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        try {
            anchor.href = url; anchor.download = name;
            document.body.append(anchor); anchor.click();
        } finally {
            anchor.remove();
            const timer = window.setTimeout(() => { URL.revokeObjectURL(url); downloads.current.delete(url); }, 1000);
            downloads.current.set(url, timer);
        }
    }

    async function task(message: string, callback: (current: () => boolean) => Promise<void>) {
        if (busyRef.current) return;
        finishStroke(); busyRef.current = true; setBusy(true);
        setStatus({ text: message, error: false });
        const id = ++taskId.current;
        const current = () => mountedRef.current && taskId.current === id;
        try { await callback(current); }
        catch (error) { if (current()) setStatus({ text: errorMessage(error), error: true }); }
        finally { if (current()) { busyRef.current = false; setBusy(false); syncHistory(); } }
    }

    function importImage(file?: File) {
        if (!file) return;
        void task('Importing image…', async current => {
            const target = dimensions(Number(width), Number(height));
            if (file.size > LIMITS.maxImageBytes) throw new Error('Choose an image no larger than 8 MiB.');
            if (typeof createImageBitmap !== 'function') throw new Error('Image import is unavailable in this browser. Try another browser or open a saved Pixel Grid project.');
            const data = await file.arrayBuffer();
            if (!current()) return;
            inspectImage(data, file.type);
            let bitmap: ImageBitmap | undefined;
            let sourceCanvas: HTMLCanvasElement | undefined;
            try {
                try { bitmap = await createImageBitmap(file); }
                catch { throw new Error('This image could not be decoded. Try a valid static PNG, JPEG or WebP. Your drawing was kept.'); }
                if (!current()) return;
                if (bitmap.width > LIMITS.maxImageSide || bitmap.height > LIMITS.maxImageSide || bitmap.width * bitmap.height > LIMITS.maxImagePixels) throw new Error('Decoded image exceeds the 2048 × 2048 pixel limit.');
                sourceCanvas = document.createElement('canvas');
                sourceCanvas.width = bitmap.width; sourceCanvas.height = bitmap.height;
                const context = sourceCanvas.getContext('2d', { willReadFrequently: true });
                if (!context) throw new Error('Image import is unavailable in this browser. Your drawing was kept.');
                context.drawImage(bitmap, 0, 0);
                const source: SourceImage = { width: bitmap.width, height: bitmap.height, pixels: context.getImageData(0, 0, bitmap.width, bitmap.height).data, name: file.name };
                const next = resizeImage(source, target.width, target.height, mode);
                commit(next, `Imported ${file.name} (${source.width} × ${source.height}) → ${target.width} × ${target.height}; ${MODE_LABELS[mode]}.`);
                sourceRef.current = source;
                setSourceInfo({ name: source.name, width: source.width, height: source.height });
            } finally {
                bitmap?.close();
                if (sourceCanvas) sourceCanvas.width = sourceCanvas.height = 0;
            }
        });
    }

    function importProject(file?: File) {
        if (!file) return;
        void task('Opening project…', async current => {
            if (file.size > LIMITS.maxProjectBytes) throw new Error('Project files must be 512 KiB or smaller.');
            const text = await file.text();
            if (!current()) return;
            const next = parseProject(text);
            commit(next, `Opened ${file.name}: ${next.width} × ${next.height}. Undo restores the previous drawing.`);
            sourceRef.current = null;
            setSourceInfo(null);
            savedRef.current = createGrid(next.width, next.height, next.pixels);
            syncHistory();
        });
    }

    function savePng(withGrid = false) {
        void task(withGrid ? 'Exporting enlarged grid PNG…' : 'Exporting original-size PNG…', async current => {
            const snapshot = createGrid(gridRef.current.width, gridRef.current.height, gridRef.current.pixels);
            let blob: Blob;
            if (withGrid) {
                const output = document.createElement('canvas');
                try {
                    drawGrid(output, snapshot, 16, true);
                    blob = await new Promise<Blob>((resolve, reject) => output.toBlob(value => value ? resolve(value) : reject(new Error('Grid PNG export failed. Your drawing was kept.')), 'image/png'));
                } finally { output.width = output.height = 0; }
            } else {
                const data = await encodePng(snapshot);
                blob = new Blob([data], { type: 'image/png' });
            }
            if (!current()) return;
            download(blob, withGrid ? `grid-${snapshot.width}x${snapshot.height}-16x.png` : `pixel-${snapshot.width}x${snapshot.height}.png`);
            trackPixelGridExport({ format: withGrid ? 'grid_png' : 'png' });
            setStatus({ text: withGrid ? `Downloaded a ${snapshot.width * 16} × ${snapshot.height * 16} grid PNG. Your original pixels are unchanged.` : `Downloaded the original ${snapshot.width} × ${snapshot.height} PNG with no grid. Save a project to keep an editable copy.`, error: false });
        });
    }

    function saveProject() {
        action(() => {
            const snapshot = createGrid(gridRef.current.width, gridRef.current.height, gridRef.current.pixels);
            download(new Blob([serializeProject(snapshot)], { type: 'application/json' }), `pixel-${snapshot.width}x${snapshot.height}.pixel-grid.json`);
            trackPixelGridExport({ format: 'project' });
            savedRef.current = snapshot; syncHistory();
            setStatus({ text: 'Editable project download started. Keep this file to reopen your work after a reload.', error: false });
        });
    }

    return (
        <div className={styles.workspace} id="pixel-grid-workspace" aria-busy={busy}>
            <details className={styles.settingsDisclosure} open={settingsExpanded ?? isWideViewport}>
                <summary onClick={event => { event.preventDefault(); setSettingsExpanded(!(settingsExpanded ?? isWideViewport)); }}>Canvas &amp; image settings</summary>
            <aside className={styles.settings} aria-label="Canvas and image settings">
                <section className={styles.panel} aria-labelledby="pixel-size-title">
                    <h2 id="pixel-size-title">Canvas size</h2>
                    <div className={styles.buttons}>{([[16, 16], [32, 32], [24, 40]] as const).map(([w, h]) => <button type="button" key={`${w}x${h}`} disabled={busy} onClick={() => newCanvas(w, h)}>New {w} × {h}</button>)}</div>
                    <div className={styles.dimensions}>
                        <label htmlFor="pixel-width">Width<input id="pixel-width" type="number" min="1" max="128" step="1" value={width} disabled={busy} onChange={event => setWidth(event.target.value)} /></label>
                        <span aria-hidden="true">×</span>
                        <label htmlFor="pixel-height">Height<input id="pixel-height" type="number" min="1" max="128" step="1" value={height} disabled={busy} onChange={event => setHeight(event.target.value)} /></label>
                    </div>
                    <label htmlFor="pixel-image-mode">Image sizing<select id="pixel-image-mode" value={mode} disabled={busy} onChange={event => setMode(event.target.value as ResizeMode)}><option value="fit">Keep proportions</option><option value="crop">Center crop</option><option value="stretch">Stretch</option></select></label>
                    <div className={`${styles.buttons} ${styles.spaced}`}><button type="button" disabled={busy} onClick={() => resize()}>Resize drawing</button><button type="button" disabled={busy} onClick={() => newCanvas()}>New blank canvas</button></div>
                    <p className={styles.hint}>1–128 pixels per side. Keep proportions leaves transparent margins; Center crop fills the canvas; Stretch changes proportions. Size changes apply when you resize, import, reapply an image or start a blank canvas. Each operation can be undone.</p>
                </section>
                <section className={styles.panel} aria-labelledby="pixel-import-title">
                    <h2 id="pixel-import-title">Import image</h2>
                    <label htmlFor="pixel-image-file">Choose PNG, JPEG or WebP<input id="pixel-image-file" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; importImage(file); }} /></label>
                    <p className={styles.hint}>Static images only: up to 8 MiB and 2048 × 2048 pixels. Import replaces the drawing using the size and mode above. Colors use nearest-neighbor sampling, without a bead palette or automatic color reduction.</p>
                    <button className={styles.spaced} type="button" disabled={busy || !sourceInfo} onClick={() => resize(true)}>Reapply last image</button>
                    <p className={styles.hint}>{sourceInfo ? `Last image: ${sourceInfo.name} (${sourceInfo.width} × ${sourceInfo.height}). Reapply replaces your edits; Undo restores them.` : 'After importing, you can change the size or sizing mode and reapply the same image.'}</p>
                </section>
            </aside>
            </details>
            <div className={styles.drawingColumn}>
                <section className={styles.panel} aria-labelledby="pixel-canvas-title">
                    <div className={styles.heading}><h2 id="pixel-canvas-title">{grid.width} × {grid.height} pixels</h2><span>{nontransparent.toLocaleString('en-US')} nontransparent pixels</span></div>
                    <div className={styles.drawingTools} aria-label="Drawing tools">
                        {([['brush', 'Brush'], ['eraser', 'Eraser'], ['pan', 'Pan']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={tool === id} disabled={busy} onClick={() => action(() => setTool(id))}>{label}</button>)}
                        <button className={styles.historyButton} type="button" aria-label="Undo" title="Undo" disabled={busy || !historyState.undo} onClick={() => undo()}><Undo2 size={20} aria-hidden="true" /></button><button className={styles.historyButton} type="button" aria-label="Redo" title="Redo" disabled={busy || !historyState.redo} onClick={() => undo(true)}><Redo2 size={20} aria-hidden="true" /></button>
                    </div>
                    <div className={styles.paintSettings}>
                        <label className={styles.color} htmlFor="pixel-color">Color<input id="pixel-color" type="color" value={color} disabled={busy} onChange={event => setColor(event.target.value)} /></label>
                        <label className={styles.alpha} htmlFor="pixel-alpha">Alpha <output>{alpha} / 255</output><input id="pixel-alpha" type="range" min="0" max="255" step="1" value={alpha} disabled={busy} onChange={event => setAlpha(Number(event.target.value))} /></label>
                    </div>
                    <div className={styles.viewSettings}>
                        <label htmlFor="pixel-zoom">Zoom<select id="pixel-zoom" value={zoom} disabled={busy} onChange={event => action(() => { const next = event.target.value as Zoom; setZoom(next); if (next === 'fit' && viewportRef.current) viewportRef.current.scrollLeft = viewportRef.current.scrollTop = 0; })}><option value="fit">Fit</option>{[4, 8, 16, 24, 32].map(value => <option key={value} value={value}>{value}×</option>)}</select></label>
                        <label className={styles.check} htmlFor="pixel-show-grid"><input id="pixel-show-grid" type="checkbox" checked={showGrid} disabled={busy} onChange={event => setShowGrid(event.target.checked)} />Grid</label>
                        <button type="button" disabled={busy} onClick={() => action(() => commit(createGrid(gridRef.current.width, gridRef.current.height), 'Drawing cleared. Undo restores it.'))}>Clear drawing</button>
                    </div>
                    <div ref={viewportRef} className={styles.viewport} aria-label="Scrollable drawing area">
                        <div className={styles.stage}><canvas ref={canvasRef} width={grid.width * scale} height={grid.height * scale} tabIndex={0} role="img" aria-label={`Editable pixel canvas, ${grid.width} columns and ${grid.height} rows. Cursor at column ${cursor[0] + 1}, row ${cursor[1] + 1}.`} aria-describedby="pixel-canvas-help pixel-cursor" className={styles.canvas} style={{ width: grid.width * scale, height: grid.height * scale, cursor: tool === 'pan' ? panning ? 'grabbing' : 'grab' : 'crosshair' }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => finishStroke(event.pointerId)} onPointerCancel={event => finishStroke(event.pointerId)} onLostPointerCapture={event => finishStroke(event.pointerId)} onKeyDown={keyboard} onFocus={() => setFocused(true)} onBlur={() => { finishStroke(); setFocused(false); }} /></div>
                    </div>
                    <p id="pixel-cursor" className={styles.hint}>Cursor: column {cursor[0] + 1}, row {cursor[1] + 1} · {scale} screen pixels per cell</p>
                    <p id="pixel-canvas-help" className={styles.hint}>Use one finger to draw. Select Pan to move a zoomed view. Arrows move the cursor; Space or Enter draws; Delete erases. Ctrl/Cmd+Z undoes; Shift+Ctrl/Cmd+Z redoes. Zoom and the grid only change the view.</p>
                </section>
                <p className={`${styles.status} ${status.error ? styles.error : ''}`} role="status" aria-live="polite" aria-atomic="true">{status.text}</p>
                <section className={styles.panel} aria-labelledby="pixel-save-title">
                    <div className={styles.heading}><h2 id="pixel-save-title">Save your work</h2><span>{dirty ? 'Unsaved changes' : 'Project saved / unchanged'}</span></div>
                    <div className={styles.buttons}><button className={styles.primary} type="button" disabled={busy} onClick={() => savePng()}>Save original-size PNG</button><button type="button" disabled={busy} onClick={() => savePng(true)}>Save enlarged grid PNG</button><button type="button" disabled={busy} onClick={saveProject}>Save editable project</button></div>
                    <p className={styles.hint}>Original PNG: one cell = one pixel, current RGBA, no grid or background. Grid PNG: 16× larger with lines; it is not a sprite file or a full-size bead template.</p>
                    <label className={styles.spaced} htmlFor="pixel-project-file">Open a saved Pixel Grid project<input id="pixel-project-file" type="file" accept=".json,application/json" disabled={busy} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; importProject(file); }} /></label>
                    <p className={styles.hint}>Pixel Grid JSON version 1, up to 512 KiB. Bead-pattern projects use a different format. Undo remembers up to 50 operations in this session. Refreshing loses this session; save an editable project to keep your work.</p>
                </section>
                <p className={styles.hint}>Checkerboard means transparency. Browser image decoding may change color profiles and hidden RGB in fully transparent pixels. Projects and original-size PNGs preserve the current pixel data. Your images are processed on this device.</p>
            </div>
        </div>
    );
}

'use client';

import { createToolGenerationTracker, trackToolEvent } from '../../lib/analytics';

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { addFrame, animationsEqual, cloneAnimation, createAnimation, moveFrame, parseAnimation, removeFrame, replaceFrame, resizeAnimation, serializeAnimation, setActiveFrame, setAnimationFps, SpriteHistory, type SpriteAnimation } from '../../lib/sprites/core';
import { floodFill, readPixel, setPixel, type PixelGrid } from '../../lib/pixel-grid/core';
import { spriteCopy } from '../../lib/sprites/copy';
import { spritePaths } from '../../lib/sprites/routes';
import type { SiteLocale } from '../../lib/i18n/locales';
import { LOCALE_NAVIGATION_EVENT, type LocaleNavigationDetail } from '../../lib/i18n/routes';
import { downloadBlob } from '../../lib/core/printer/download';
import styles from './SpriteTool.module.css';

export const SPRITE_LOCALE_KEY = 'sprite-maker-locale-transfer-v1';
const MAX_FILE = 1024 * 1024, MAX_TRANSFER = 2 * MAX_FILE;
type StorageArea = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Layout = 'horizontal' | 'vertical' | 'grid';
type Tool = 'brush' | 'erase' | 'fill' | 'picker';
type Point = readonly [number, number];
const format = (value: string, values: Record<string, string | number>) => value.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
const pathname = (url: URL) => url.pathname.replace(/\/$/, '');
const paths: string[] = Object.values(spritePaths);

export function isSpriteLocaleNavigation(from: string, to: string): boolean {
    try { const a = new URL(from), b = new URL(to, a); return a.origin === b.origin && paths.includes(pathname(a)) && paths.includes(pathname(b)); }
    catch { return false; }
}

export function saveSpriteTransfer(animation: SpriteAnimation, saved: boolean, destination: string, storage: StorageArea, now = Date.now()): boolean {
    let previous: string | null = null, attempted = false;
    try {
        const target = pathname(new URL(destination));
        if (!paths.includes(target) || typeof saved !== 'boolean' || !Number.isFinite(now)) return false;
        const raw = JSON.stringify({ version: 1, destination: target, savedAt: now, project: serializeAnimation(animation), saved });
        if (new TextEncoder().encode(raw).length > MAX_TRANSFER) return false;
        previous = storage.getItem(SPRITE_LOCALE_KEY); attempted = true;
        storage.setItem(SPRITE_LOCALE_KEY, raw);
        if (storage.getItem(SPRITE_LOCALE_KEY) !== raw) throw new Error('TRANSFER_WRITE_FAILED');
        return true;
    } catch {
        if (attempted) try { if (previous === null) storage.removeItem(SPRITE_LOCALE_KEY); else storage.setItem(SPRITE_LOCALE_KEY, previous); } catch { /* The current drawing is unchanged. */ }
        return false;
    }
}

export function readSpriteTransfer(href: string, storage: StorageArea, now = Date.now()): { animation: SpriteAnimation; saved: boolean; raw: string } | null {
    const raw = storage.getItem(SPRITE_LOCALE_KEY);
    if (raw === null) return null;
    if (new TextEncoder().encode(raw).length > MAX_TRANSFER) throw new Error('TRANSFER_TOO_LARGE');
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'destination,project,saved,savedAt,version'
        || value.version !== 1 || typeof value.project !== 'string' || typeof value.saved !== 'boolean'
        || typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt) || !Number.isFinite(now) || value.savedAt > now || now - value.savedAt > 300000
        || !paths.includes(value.destination) || value.destination !== pathname(new URL(href))) throw new Error('INVALID_TRANSFER');
    return { animation: parseAnimation(value.project), saved: value.saved, raw };
}

export function discardSpriteTransfer(storage: () => StorageArea): boolean {
    try { const area = storage(); area.removeItem(SPRITE_LOCALE_KEY); return area.getItem(SPRITE_LOCALE_KEY) === null; }
    catch { return false; }
}

function draw(canvas: HTMLCanvasElement, grid: PixelGrid, previous?: PixelGrid) {
    canvas.width = grid.width; canvas.height = grid.height;
    const context = canvas.getContext('2d'); if (!context) return;
    const layer = document.createElement('canvas'); layer.width = grid.width; layer.height = grid.height;
    const source = layer.getContext('2d'); if (!source) return;
    if (previous) {
        source.putImageData(new ImageData(new Uint8ClampedArray(previous.pixels), grid.width, grid.height), 0, 0);
        context.globalAlpha = .25; context.drawImage(layer, 0, 0); context.globalAlpha = 1;
    }
    source.clearRect(0, 0, grid.width, grid.height);
    source.putImageData(new ImageData(new Uint8ClampedArray(grid.pixels), grid.width, grid.height), 0, 0);
    context.drawImage(layer, 0, 0);
}

function FrameCanvas({ grid, previous }: { grid: PixelGrid; previous?: PixelGrid }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => { if (ref.current) draw(ref.current, grid, previous); }, [grid, previous]);
    return <canvas ref={ref} width={grid.width} height={grid.height} aria-hidden="true" />;
}

export function strokePoints(from: Point, to: Point): Point[] {
    let [x, y] = from; const [x1, y1] = to, dx = Math.abs(x1 - x), dy = -Math.abs(y1 - y);
    const sx = x < x1 ? 1 : -1, sy = y < y1 ? 1 : -1; let error = dx + dy;
    const points: Point[] = [];
    for (;;) { points.push([x, y]); if (x === x1 && y === y1) break; const twice = 2 * error; if (twice >= dy) { error += dy; x += sx; } if (twice <= dx) { error += dx; y += sy; } }
    return points;
}

export function spriteSheetMetrics(animation: SpriteAnimation, layout: Layout, columns: number, scale: number) {
    const across = layout === 'horizontal' ? animation.frames.length : layout === 'vertical' ? 1 : Math.max(1, Math.min(columns, animation.frames.length));
    const width = animation.width * across * scale, height = animation.height * Math.ceil(animation.frames.length / across) * scale;
    return { width, height, canExport: width <= 8192 && height <= 8192 };
}

export default function SpriteTool({ locale = 'en' }: { locale?: SiteLocale }) {
    const copy = spriteCopy[locale], id = useId();
    const [animation, setAnimation] = useState(() => createAnimation());
    const [saved, setSaved] = useState(true), [ready, setReady] = useState(false), [recoveryFailed, setRecoveryFailed] = useState(false);
    const [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [playing, setPlaying] = useState(false), [playFrame, setPlayFrame] = useState(0);
    const [tool, setTool] = useState<Tool>('brush'), [color, setColor] = useState('#315f4a'), [alpha, setAlpha] = useState(255);
    const [onion, setOnion] = useState(true), [showGrid, setShowGrid] = useState(true), [cursor, setCursor] = useState<Point>([0, 0]);
    const [width, setWidth] = useState('16'), [height, setHeight] = useState('16'), [resizeMode, setResizeMode] = useState<'crop' | 'scale'>('crop');
    const [layout, setLayout] = useState<Layout>('horizontal'), [columns, setColumns] = useState(1), [scale, setScale] = useState(1);
    const [, refreshHistory] = useState(0);
    const history = useRef<SpriteHistory | null>(null); if (history.current === null) history.current = new SpriteHistory();
    const gridRef = useRef<HTMLDivElement>(null), fileRef = useRef<HTMLInputElement>(null);
    const live = useRef({ animation, saved, ready: false, busy: false });
    const mounted = useRef(false), leaving = useRef(false), epoch = useRef(0);
    const transferBlocked = useRef(false);
    const invalidate = useCallback(() => { epoch.current++; }, []);
    const stroke = useRef<{ before: SpriteAnimation; last: Point; pointerId: number } | null>(null);
    const generation = useRef(createToolGenerationTracker('sprite'));
    const locked = !ready || busy;

    const install = useCallback((next: SpriteAnimation, isSaved: boolean) => {
        live.current.animation = next; live.current.saved = isSaved;
        setAnimation(next); setSaved(isSaved); setPlaying(false); leaving.current = false;
        setWidth(String(next.width)); setHeight(String(next.height));
        setCursor(([x, y]) => [Math.min(x, next.width - 1), Math.min(y, next.height - 1)]);
    }, []);

    const recover = useCallback(() => {
        if (live.current.ready || live.current.busy) return;
        try {
            const storage = window.sessionStorage, transfer = readSpriteTransfer(window.location.href, storage); let cleanupFailed = false;
            if (transfer) {
                install(transfer.animation, transfer.saved);
                try {
                    if (storage.getItem(SPRITE_LOCALE_KEY) !== transfer.raw) throw new Error('TRANSFER_CHANGED');
                    storage.removeItem(SPRITE_LOCALE_KEY);
                    if (storage.getItem(SPRITE_LOCALE_KEY) !== null) throw new Error('TRANSFER_NOT_REMOVED');
                } catch { cleanupFailed = true; }
            }
            transferBlocked.current = cleanupFailed;
            live.current.ready = true; setReady(true); setRecoveryFailed(false); setNotice(cleanupFailed ? copy.discardFailed : '');
        } catch { transferBlocked.current = true; setRecoveryFailed(true); }
    }, [install, copy.discardFailed]);

    useEffect(() => {
        mounted.current = true; let active = true;
        queueMicrotask(() => { if (active) recover(); });
        return () => { active = false; mounted.current = false; invalidate(); };
    }, [recover, invalidate]);

    function finishStroke() {
        const current = stroke.current; stroke.current = null;
        if (current && history.current!.push(current.before, live.current.animation)) { refreshHistory(value => value + 1); generation.current.record(); }
    }

    useEffect(() => {
        const language = (event: Event) => {
            const e = event as CustomEvent<LocaleNavigationDetail>;
            if (e.defaultPrevented || !isSpriteLocaleNavigation(window.location.href, e.detail.href)) return;
            if (!live.current.ready || live.current.busy || stroke.current || transferBlocked.current) { e.preventDefault(); setNotice(copy.transferFailed); return; }
            try {
                if (!saveSpriteTransfer(live.current.animation, live.current.saved, new URL(e.detail.href, window.location.href).href, window.sessionStorage)) throw new Error('TRANSFER_FAILED');
                leaving.current = true;
            } catch { e.preventDefault(); setNotice(copy.transferFailed); }
        };
        const protect = (event: BeforeUnloadEvent) => { if (!live.current.saved && !leaving.current) { event.preventDefault(); event.returnValue = ''; } };
        const follow = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || live.current.saved) return;
            const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
            if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
            const destination = new URL(link.href, window.location.href), source = new URL(window.location.href);
            if (!['http:', 'https:'].includes(destination.protocol) || isSpriteLocaleNavigation(source.href, destination.href)
                || (destination.origin === source.origin && destination.pathname === source.pathname && destination.search === source.search)) return;
            if (!window.confirm(copy.replace)) { event.preventDefault(); event.stopPropagation(); }
            else leaving.current = true;
        };
        const resume = () => { leaving.current = false; };
        window.addEventListener(LOCALE_NAVIGATION_EVENT, language); window.addEventListener('beforeunload', protect); window.addEventListener('pageshow', resume);
        document.addEventListener('click', follow, true);
        return () => { window.removeEventListener(LOCALE_NAVIGATION_EVENT, language); window.removeEventListener('beforeunload', protect); window.removeEventListener('pageshow', resume); document.removeEventListener('click', follow, true); };
    }, [copy.transferFailed, copy.replace]);

    useEffect(() => {
        if (!playing) return;
        const timer = window.setInterval(() => setPlayFrame(frame => (frame + 1) % animation.frames.length), 1000 / animation.fps);
        return () => window.clearInterval(timer);
    }, [playing, animation.frames.length, animation.fps]);

    function change(make: (before: SpriteAnimation) => SpriteAnimation, record = true) {
        if (!live.current.ready || live.current.busy) return;
        finishStroke(); const before = live.current.animation;
        try {
            const next = make(before);
            if (animationsEqual(before, next)) return;
            if (record) { history.current!.push(before, next); refreshHistory(value => value + 1); }
            epoch.current++; install(next, false); setNotice('');
        } catch { setNotice(copy.error); }
    }

    function undo(redo = false) {
        if (!live.current.ready || live.current.busy) return;
        finishStroke(); const next = redo ? history.current!.redo(live.current.animation) : history.current!.undo(live.current.animation);
        if (next) { epoch.current++; install(next, false); setNotice(''); refreshHistory(value => value + 1); }
    }

    function ink(): [number, number, number, number] {
        return tool === 'erase' ? [0, 0, 0, 0] : [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16), alpha];
    }
    function paint(points: Point[], useFill = false) {
        const current = live.current.animation, original = current.frames[current.activeFrame];
        const grid = { width: original.width, height: original.height, pixels: new Uint8ClampedArray(original.pixels) };
        if (useFill) floodFill(grid, points[0][0], points[0][1], ink());
        else for (const [x, y] of points) setPixel(grid, x, y, ink());
        const next = replaceFrame(current, current.activeFrame, grid);
        if (!animationsEqual(current, next)) { epoch.current++; install(next, false); setNotice(''); }
    }
    function pick(point: Point) {
        const current = live.current.animation, rgba = readPixel(current.frames[current.activeFrame], ...point);
        if (rgba) { setColor('#' + rgba.slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('')); setAlpha(rgba[3]); }
    }
    function point(event: PointerEvent<HTMLDivElement>): Point | null {
        const bounds = event.currentTarget.getBoundingClientRect(), { width: w, height: h } = live.current.animation;
        const x = Math.floor((event.clientX - bounds.left) / bounds.width * w), y = Math.floor((event.clientY - bounds.top) / bounds.height * h);
        return x >= 0 && y >= 0 && x < w && y < h ? [x, y] : null;
    }
    function pointerDown(event: PointerEvent<HTMLDivElement>) {
        if (locked || event.button !== 0 || stroke.current) return;
        const at = point(event); if (!at) return;
        event.preventDefault(); setCursor(at); setPlaying(false);
        gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${at[1] * animation.width + at[0]}"]`)?.focus({ preventScroll: true });
        if (tool === 'picker') { pick(at); return; }
        const before = cloneAnimation(live.current.animation);
        if (tool === 'fill') { paint([at], true); if (history.current!.push(before, live.current.animation)) { refreshHistory(value => value + 1); generation.current.record(); } return; }
        event.currentTarget.setPointerCapture(event.pointerId);
        stroke.current = { before, last: at, pointerId: event.pointerId }; paint([at]);
    }
    function pointerMove(event: PointerEvent<HTMLDivElement>) {
        const current = stroke.current, at = point(event);
        if (!current || current.pointerId !== event.pointerId || !at || live.current.busy) return;
        event.preventDefault(); paint(strokePoints(current.last, at)); current.last = at; setCursor(at);
    }
    function pointerEnd(event: PointerEvent<HTMLDivElement>) {
        if (stroke.current?.pointerId !== event.pointerId) return;
        finishStroke(); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
    function keyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (locked) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(event.shiftKey); return; }
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const keys: Record<string, Tool> = { b: 'brush', e: 'erase', f: 'fill', i: 'picker' };
        if (keys[event.key.toLowerCase()]) { event.preventDefault(); setTool(keys[event.key.toLowerCase()]); return; }
        let [x, y] = cursor;
        const moves: Record<string, Point> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (moves[event.key]) {
            event.preventDefault(); x = Math.max(0, Math.min(animation.width - 1, x + moves[event.key][0])); y = Math.max(0, Math.min(animation.height - 1, y + moves[event.key][1]));
            setCursor([x, y]); gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${y * animation.width + x}"]`)?.focus({ preventScroll: true });
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); if (event.repeat) return;
            if (tool === 'picker') pick(cursor);
            else { const before = cloneAnimation(live.current.animation); paint([cursor], tool === 'fill'); if (history.current!.push(before, live.current.animation)) { refreshHistory(value => value + 1); generation.current.record(); } }
        }
    }

    function begin() {
        if (!mounted.current || !live.current.ready || live.current.busy) return null;
        finishStroke(); live.current.busy = true; setBusy(true); setPlaying(false); setNotice(''); return ++epoch.current;
    }
    const current = (token: number) => mounted.current && live.current.busy && epoch.current === token;
    function finish(token: number) { if (current(token)) { live.current.busy = false; setBusy(false); } }
    function cancel() { epoch.current++; live.current.busy = false; setBusy(false); setNotice(copy.cancelled); }

    async function exportFile(kind: 'project' | 'frame' | 'sheet' | 'coordinates' | 'gif') {
        if ((kind === 'sheet' || kind === 'coordinates') && !spriteSheetMetrics(live.current.animation, layout, columns, scale).canExport) { setNotice(copy.sheetTooLarge); return; }
        const token = begin(); if (token === null) return;
        const snapshot = cloneAnimation(live.current.animation), exportColumns = Math.min(columns, live.current.animation.frames.length);
        try {
            let data: Blob, name: string;
            if (kind === 'project') { data = new Blob([serializeAnimation(snapshot)], { type: 'application/json' }); name = 'sprite-project.json'; }
            else {
                const exporter = await import('../../lib/sprites/export'); if (!current(token)) return;
                if (kind === 'coordinates') { data = new Blob([exporter.spriteSheetManifest(snapshot, layout, exportColumns, scale)], { type: 'application/json' }); name = 'sprite-sheet.json'; }
                else {
                    const bytes = kind === 'gif' ? await exporter.encodeSpriteGif(snapshot, scale)
                        : kind === 'frame' ? await exporter.encodeSpriteFramePng(snapshot, scale) : await exporter.encodeSpriteSheetPng(snapshot, layout, exportColumns, scale);
                    data = new Blob([Uint8Array.from(bytes).buffer], { type: kind === 'gif' ? 'image/gif' : 'image/png' });
                    name = kind === 'gif' ? 'sprite-animation.gif' : kind === 'frame' ? 'sprite-frame.png' : 'sprite-sheet.png';
                }
            }
            if (!current(token)) return;
            downloadBlob(data, name);
            trackToolEvent({ name: 'tool_export', tool: 'sprite', format: kind === 'frame' ? 'png' : kind === 'sheet' ? 'sprite_sheet_png' : kind === 'coordinates' ? 'coordinates_json' : kind });
            if (kind === 'project') { live.current.saved = true; setSaved(true); setNotice(copy.saveNotice); }
            else setNotice(copy.exported);
        } catch { if (current(token)) setNotice(copy.exportFailed); }
        finally { finish(token); }
    }
    async function openFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        const token = begin(); if (token === null) return;
        try {
            if (file.size > MAX_FILE) throw new Error('PROJECT_TOO_LARGE');
            const raw = await file.text(); if (!current(token)) return;
            if (new TextEncoder().encode(raw).length > MAX_FILE) throw new Error('PROJECT_TOO_LARGE');
            const restored = parseAnimation(raw);
            if (!live.current.saved && !window.confirm(copy.replace)) return;
            if (!current(token)) return;
            install(restored, true); history.current!.clear(); refreshHistory(value => value + 1); setNotice(copy.loaded);
            generation.current.reset();
        } catch { if (current(token)) setNotice(copy.invalid); }
        finally { finish(token); }
    }
    function discardTransfer() {
        const removed = discardSpriteTransfer(() => window.sessionStorage);
        transferBlocked.current = !removed;
        install(createAnimation(), true); history.current!.clear(); refreshHistory(value => value + 1);
        live.current.ready = true; setReady(true); setRecoveryFailed(false); setNotice(removed ? '' : copy.discardFailed);
    }

    const frame = animation.frames[animation.activeFrame], previous = onion && animation.activeFrame > 0 ? animation.frames[animation.activeFrame - 1] : undefined;
    const cellSize = Math.min(24, 512 / Math.max(animation.width, animation.height));
    const sheet = spriteSheetMetrics(animation, layout, columns, scale);
    return <section className={styles.tool} aria-label={copy.workspace} aria-busy={busy}>
        <div className={styles.header}><p>{format(copy.summary, { width: animation.width, height: animation.height, frames: animation.frames.length, fps: animation.fps })}</p><span>{saved ? copy.saved : copy.unsaved}</span></div>
        {!ready && <div className={styles.notice} role="status">{recoveryFailed ? copy.recoveryFailed : copy.loading}{recoveryFailed && <div className={styles.buttons}><button type="button" onClick={recover}>{copy.retry}</button><button type="button" onClick={discardTransfer}>{copy.discard}</button></div>}</div>}
        <div className={styles.topbar}>
            <fieldset disabled={locked}><legend>{copy.size}</legend><div className={styles.sizeRow}>
                <label>{copy.width}<input type="number" min={1} max={64} value={width} onChange={e => setWidth(e.target.value)} /></label>
                <label>{copy.height}<input type="number" min={1} max={64} value={height} onChange={e => setHeight(e.target.value)} /></label>
                <label>{copy.resizeMode}<select value={resizeMode} onChange={e => setResizeMode(e.target.value as 'crop' | 'scale')}><option value="crop">{copy.crop}</option><option value="scale">{copy.scalePixels}</option></select></label>
                <button type="button" onClick={() => change(value => resizeAnimation(value, Number(width), Number(height), resizeMode))}>{copy.applySize}</button>
            </div><p className={styles.hint}>{copy.sizeHelp}</p></fieldset>
            <div className={styles.buttons}><button type="button" disabled={locked} onClick={() => exportFile('project')}>{copy.save}</button><button type="button" disabled={locked} onClick={() => fileRef.current?.click()}>{copy.open}</button><input ref={fileRef} type="file" accept="application/json,.json" onChange={openFile} hidden /></div>
        </div>
        <div className={styles.workspace}>
            <div className={styles.editor}>
                <fieldset disabled={locked} className={styles.toolbar}><legend className="sr-only">{copy.tools}</legend><div className={styles.buttons}>
                    {(['brush', 'erase', 'fill', 'picker'] as const).map(value => <button type="button" key={value} aria-pressed={tool === value} onClick={() => { finishStroke(); setTool(value); }}>{copy[value]}</button>)}
                    <button type="button" disabled={!history.current.canUndo} onClick={() => undo()}>{copy.undo}</button><button type="button" disabled={!history.current.canRedo} onClick={() => undo(true)}>{copy.redo}</button>
                </div><div className={styles.paintSettings}>
                    <label>{copy.color}<input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
                    <label>{copy.alpha}<input type="range" min={0} max={255} step={1} value={alpha} onChange={e => setAlpha(Number(e.target.value))} /><output>{Math.round(alpha / 255 * 100)}%</output></label>
                    <label className={styles.check}><input type="checkbox" checked={onion} onChange={e => setOnion(e.target.checked)} />{copy.onion}</label>
                    <label className={styles.check}><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />{copy.grid}</label>
                </div></fieldset>
                <div className={styles.canvasScroll}><div ref={gridRef} role="grid" aria-label={copy.canvas} aria-describedby={`${id}-keyboard`} aria-rowcount={animation.height} aria-colcount={animation.width} className={`${styles.canvas} ${showGrid ? styles.gridded : ''}`} style={{ width: animation.width * cellSize, height: animation.height * cellSize, gridTemplateColumns: `repeat(${animation.width}, 1fr)` }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={() => finishStroke()} onKeyDown={keyDown}>
                    <FrameCanvas grid={frame} previous={previous} />
                    {Array.from({ length: animation.height }, (_, y) => <div role="row" aria-rowindex={y + 1} className={styles.gridRow} key={y}>{Array.from({ length: animation.width }, (_, x) => {
                        const index = y * animation.width + x;
                        const selected = cursor[0] === x && cursor[1] === y;
                        return <button type="button" role="gridcell" aria-colindex={x + 1} key={index} data-cell={index} aria-label={format(copy.cell, { row: y + 1, column: x + 1, rgba: Array.from(frame.pixels.slice(index * 4, index * 4 + 4)).join(',') })} aria-selected={selected} tabIndex={selected ? 0 : -1} disabled={locked} onFocus={() => setCursor([x, y])} />;
                    })}</div>)}
                </div></div><p id={`${id}-keyboard`} className={styles.hint}>{copy.keyboard}</p>
                <div className={styles.frameHeader}><h2>{copy.frames}</h2><div className={styles.buttons}>
                    <button type="button" disabled={locked || animation.frames.length >= 32} onClick={() => change(value => addFrame(value))}>{copy.add}</button>
                    <button type="button" disabled={locked || animation.frames.length >= 32} onClick={() => change(value => addFrame(value, true))}>{copy.duplicate}</button>
                    <button type="button" disabled={locked || animation.frames.length === 1} onClick={() => change(value => removeFrame(value))}>{copy.remove}</button>
                </div></div>
                <ol className={styles.frames}>{animation.frames.map((value, index) => <li key={index}><button type="button" disabled={locked} aria-pressed={animation.activeFrame === index} aria-label={format(copy.frame, { number: index + 1 })} onClick={() => change(before => setActiveFrame(before, index), false)}><FrameCanvas grid={value} /><span>{index + 1}</span></button></li>)}</ol>
                <div className={styles.buttons}><button type="button" disabled={locked || animation.activeFrame === 0} onClick={() => change(value => moveFrame(value, -1))}>{copy.earlier}</button><button type="button" disabled={locked || animation.activeFrame === animation.frames.length - 1} onClick={() => change(value => moveFrame(value, 1))}>{copy.later}</button></div><p className={styles.hint}>{copy.frameHelp}</p>
            </div>
            <aside className={styles.output}>
                <h2>{copy.preview}</h2><div className={styles.preview}><FrameCanvas grid={animation.frames[playing ? playFrame % animation.frames.length : animation.activeFrame]} /></div>
                <div className={styles.playRow}><button type="button" disabled={locked} onClick={() => { setPlayFrame(animation.activeFrame); setPlaying(value => !value); }}>{playing ? copy.pause : copy.play}</button><label>{copy.fps}<input type="number" min={1} max={24} value={animation.fps} disabled={locked} onChange={e => change(value => setAnimationFps(value, Number(e.target.value)))} /></label></div>
                <fieldset disabled={locked}><legend>{copy.export}</legend><label>{copy.layout}<select value={layout} onChange={e => setLayout(e.target.value as Layout)}><option value="horizontal">{copy.horizontal}</option><option value="vertical">{copy.vertical}</option><option value="grid">{copy.sheetGrid}</option></select></label>
                    {layout === 'grid' && <label>{copy.columns}<select value={Math.min(columns, animation.frames.length)} onChange={e => setColumns(Number(e.target.value))}>{animation.frames.map((_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>}
                    <label>{copy.exportScale}<select value={scale} onChange={e => setScale(Number(e.target.value))}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={index + 1}>{index + 1}×</option>)}</select></label>
                    <p className={styles.hint}>{format(copy.sheetSize, { width: sheet.width, height: sheet.height, scale })}</p>
                    {!sheet.canExport && <p className={styles.hint} role="status">{copy.sheetTooLarge}</p>}
                    <div className={styles.exports}><button type="button" onClick={() => exportFile('frame')}>{copy.framePng}</button><button type="button" disabled={!sheet.canExport} onClick={() => exportFile('sheet')}>{copy.sheetPng}</button><button type="button" disabled={!sheet.canExport} onClick={() => exportFile('coordinates')}>{copy.coordinates}</button><button type="button" className={styles.primary} onClick={() => exportFile('gif')}>{copy.gif}</button></div>
                </fieldset>
                <p className={styles.hint}>{copy.notes[0]}</p><p className={styles.hint}>{copy.notes[1]}</p><p className={styles.hint}>{copy.exportHelp}</p>
            </aside>
        </div>
        {busy && <div className={styles.notice} role="status">{copy.busy} <button type="button" onClick={cancel}>{copy.cancel}</button></div>}
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        <p className={styles.local}>{copy.local} {copy.notes[2]}</p>
    </section>;
}

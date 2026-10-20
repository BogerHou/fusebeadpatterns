'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type PointerEvent } from 'react';
import type { SiteLocale } from '../../lib/i18n/locales';
import { LOCALE_NAVIGATION_EVENT, type LocaleNavigationDetail } from '../../lib/i18n/routes';
import { brickCatalog } from '../../lib/brick-mosaic/catalog';
import { brickCopy } from '../../lib/brick-mosaic/copy';
import { cloneMosaic, collectMosaicMaterials, createMosaic, fillMosaic, MosaicHistory, paintMosaicLine, replaceMosaicColor, sampleToMosaic, type BrickColor, type Mosaic } from '../../lib/brick-mosaic/core';
import { brickMaterialsCsv, brickMosaicPng } from '../../lib/brick-mosaic/export';
import { MOSAIC_PROJECT_MAX_BYTES, parseMosaicProject, serializeMosaicProject } from '../../lib/brick-mosaic/project';
import { BRICK_LOCALE_KEY, discardBrickTransfer, isBrickLocaleNavigation, readBrickTransfer, saveBrickTransfer } from '../../lib/brick-mosaic/transfer';
import { inspectImage, LIMITS, type ResizeMode, type RgbaSource } from '../../lib/pixel-grid/core';
import { downloadBlob } from '../../lib/core/printer/download';
import { createToolGenerationTracker, trackToolEvent } from '../../lib/analytics';
import type { BrickPaper } from '../../lib/brick-mosaic/pdf-layout';
import styles from './BrickMosaicTool.module.css';

type Point = readonly [number, number];
type Tool = 'brush' | 'erase' | 'fill' | 'picker';
const format = (value: string, values: Record<string, number | string>) => value.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
const colours = new Map<string, BrickColor>(brickCatalog.colors.map(color => [color.id, color]));
const blank = () => createMosaic(32, 32, 32, brickCatalog);

function PhotoPreview({ source, label }: { source: RgbaSource; label: string }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current; if (!canvas) return;
        canvas.width = source.width; canvas.height = source.height;
        canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(source.pixels), source.width, source.height), 0, 0);
    }, [source]);
    return <canvas ref={ref} role="img" aria-label={label} className={styles.photo} />;
}

function draw(canvas: HTMLCanvasElement, mosaic: Mosaic, grid: boolean, cursor?: Point, selectedBoard = -1) {
    const unit = 12; canvas.width = mosaic.width * unit; canvas.height = mosaic.height * unit;
    const context = canvas.getContext('2d'); if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    mosaic.cells.forEach((id, index) => {
        if (!id) return;
        const x = index % mosaic.width * unit, y = Math.floor(index / mosaic.width) * unit;
        context.fillStyle = colours.get(id)!.hex; context.fillRect(x, y, unit, unit);
        // Own geometric stud cue, not a photograph or an official product image.
        context.strokeStyle = '#00000024'; context.lineWidth = .6;
        context.beginPath(); context.arc(x + unit / 2, y + unit / 2, unit * .28, 0, Math.PI * 2); context.stroke();
    });
    if (grid) {
        for (let x = 0; x <= mosaic.width; x++) { context.strokeStyle = x % mosaic.boardSize ? '#334c3430' : '#203825'; context.lineWidth = x % mosaic.boardSize ? .5 : 1.5; context.beginPath(); context.moveTo(x * unit, 0); context.lineTo(x * unit, canvas.height); context.stroke(); }
        for (let y = 0; y <= mosaic.height; y++) { context.strokeStyle = y % mosaic.boardSize ? '#334c3430' : '#203825'; context.lineWidth = y % mosaic.boardSize ? .5 : 1.5; context.beginPath(); context.moveTo(0, y * unit); context.lineTo(canvas.width, y * unit); context.stroke(); }
    }
    if (selectedBoard >= 0) {
        const board = collectMosaicMaterials(mosaic, brickCatalog).boards[selectedBoard];
        if (board) { context.strokeStyle = '#c4501d'; context.lineWidth = 3; context.strokeRect(board.startX * unit + 1.5, board.startY * unit + 1.5, board.width * unit - 3, board.height * unit - 3); }
    }
    if (cursor) { context.strokeStyle = '#fff'; context.lineWidth = 3; context.strokeRect(cursor[0] * unit + 1.5, cursor[1] * unit + 1.5, unit - 3, unit - 3); context.strokeStyle = '#122a20'; context.lineWidth = 1; context.strokeRect(cursor[0] * unit + 1.5, cursor[1] * unit + 1.5, unit - 3, unit - 3); }
}

export default function BrickMosaicTool({ locale }: { locale: SiteLocale }) {
    const copy = brickCopy[locale], id = useId();
    const [mosaic, setMosaic] = useState(blank), [saved, setSaved] = useState(true), [ready, setReady] = useState(false);
    const [recoveryFailed, setRecoveryFailed] = useState(false), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
    const [pending, setPending] = useState<{ model: Mosaic; message: string; saved: boolean } | null>(null);
    const [source, setSource] = useState<RgbaSource | null>(null), [width, setWidth] = useState('32'), [height, setHeight] = useState('32');
    const [mode, setMode] = useState<ResizeMode>('fit'), [maxColors, setMaxColors] = useState<number>(brickCatalog.colors.length), [dither, setDither] = useState(false);
    const [threshold, setThreshold] = useState(128), [matte, setMatte] = useState('#ffffff');
    const [tool, setTool] = useState<Tool>('brush'), [color, setColor] = useState<string>(brickCatalog.colors[4].id), [replaceFrom, setReplaceFrom] = useState<string>(brickCatalog.colors[4].id);
    const [grid, setGrid] = useState(true), [zoom, setZoom] = useState(12), [cursor, setCursor] = useState<Point>([0, 0]), [selectedBoard, setSelectedBoard] = useState(-1);
    const [paper, setPaper] = useState<BrickPaper>('a4'), [scale, setScale] = useState(8), [, refreshHistory] = useState(0);
    const history = useRef<MosaicHistory | null>(null); if (!history.current) history.current = new MosaicHistory(mosaic, brickCatalog);
    const canvas = useRef<HTMLCanvasElement>(null), imageInput = useRef<HTMLInputElement>(null), projectInput = useRef<HTMLInputElement>(null);
    const live = useRef({ mosaic, saved, ready: false, busy: false }), mounted = useRef(false), epoch = useRef(0), leaving = useRef(false), transferBlocked = useRef(false);
    const operation = useRef<AbortController | null>(null), stroke = useRef<{ last: Point; pointerId: number } | null>(null);
    const generation = useRef(createToolGenerationTracker('brick_mosaic'));
    const locked = !ready || busy || !!pending;
    const materials = useMemo(() => collectMosaicMaterials(mosaic, brickCatalog), [mosaic]);
    const shownBoard = materials.boards[selectedBoard], usage = shownBoard?.counts ?? materials.usedColors;

    const install = useCallback((next: Mosaic, isSaved: boolean, syncDimensions = false) => {
        live.current.mosaic = next; live.current.saved = isSaved; setMosaic(next); setSaved(isSaved); leaving.current = false;
        setCursor(([x, y]) => [Math.min(x, next.width - 1), Math.min(y, next.height - 1)]);
        if (syncDimensions) { setWidth(String(next.width)); setHeight(String(next.height)); setSelectedBoard(-1); }
    }, []);
    const recover = useCallback(() => {
        if (live.current.ready || live.current.busy) return;
        try {
            const storage = window.sessionStorage, transfer = readBrickTransfer(window.location.href, storage); let cleanupFailed = false;
            if (transfer) {
                install(transfer.mosaic, transfer.saved, true); history.current = new MosaicHistory(transfer.mosaic, brickCatalog);
                try { if (storage.getItem(BRICK_LOCALE_KEY) !== transfer.raw) throw new Error('TRANSFER_CHANGED'); storage.removeItem(BRICK_LOCALE_KEY); if (storage.getItem(BRICK_LOCALE_KEY) !== null) throw new Error('TRANSFER_NOT_REMOVED'); } catch { cleanupFailed = true; }
            }
            transferBlocked.current = cleanupFailed; live.current.ready = true; setReady(true); setRecoveryFailed(false);
            setNotice(cleanupFailed ? copy.discardFailed : transfer ? copy.sourceMissing : '');
        } catch { transferBlocked.current = true; setRecoveryFailed(true); }
    }, [install, copy.discardFailed, copy.sourceMissing]);
    function startBlank() {
        // Explicitly ignoring a failed transfer must still permit local editing
        // when storage is disabled. Never silently overwrite the old record.
        const removed = discardBrickTransfer(() => window.sessionStorage), next = blank();
        transferBlocked.current = !removed; history.current = new MosaicHistory(next, brickCatalog);
        install(next, true, true); live.current.ready = true; setReady(true); setRecoveryFailed(false);
        setNotice(removed ? '' : copy.discardFailed);
    }
    const invalidate = useCallback(() => { epoch.current++; operation.current?.abort(); }, []);
    useEffect(() => { mounted.current = true; let active = true; queueMicrotask(() => { if (active) recover(); }); return () => { active = false; mounted.current = false; invalidate(); }; }, [recover, invalidate]);
    useEffect(() => { if (canvas.current) draw(canvas.current, mosaic, grid, cursor, selectedBoard); }, [mosaic, grid, cursor, selectedBoard]);

    useEffect(() => {
        const language = (event: Event) => {
            const e = event as CustomEvent<LocaleNavigationDetail>;
            if (e.defaultPrevented || !isBrickLocaleNavigation(window.location.href, e.detail.href)) return;
            if (!live.current.ready || live.current.busy || stroke.current || pending || transferBlocked.current) { e.preventDefault(); setNotice(copy.transferFailed); return; }
            try {
                if (!saveBrickTransfer(live.current.mosaic, live.current.saved, new URL(e.detail.href, window.location.href).href, window.sessionStorage)) throw new Error('TRANSFER_FAILED');
                leaving.current = true;
            } catch { e.preventDefault(); setNotice(copy.transferFailed); }
        };
        const unload = (event: BeforeUnloadEvent) => { if (!live.current.saved && !leaving.current) { event.preventDefault(); event.returnValue = ''; } };
        const follow = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || live.current.saved) return;
            const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
            if (!(target instanceof HTMLAnchorElement) || target.hasAttribute('download') || (target.target && target.target !== '_self')) return;
            const destination = new URL(target.href, window.location.href), current = new URL(window.location.href);
            if (!['http:', 'https:'].includes(destination.protocol) || isBrickLocaleNavigation(current.href, destination.href) || (destination.origin === current.origin && destination.pathname === current.pathname && destination.search === current.search)) return;
            if (!window.confirm(copy.leaveConfirm)) { event.preventDefault(); event.stopPropagation(); } else leaving.current = true;
        };
        const resume = () => { leaving.current = false; };
        window.addEventListener(LOCALE_NAVIGATION_EVENT, language); window.addEventListener('beforeunload', unload); window.addEventListener('pageshow', resume); document.addEventListener('click', follow, true);
        return () => { window.removeEventListener(LOCALE_NAVIGATION_EVENT, language); window.removeEventListener('beforeunload', unload); window.removeEventListener('pageshow', resume); document.removeEventListener('click', follow, true); };
    }, [copy.leaveConfirm, copy.transferFailed, pending]);

    function finishStroke() { if (stroke.current) { stroke.current = null; history.current!.commit(live.current.mosaic); refreshHistory(value => value + 1); } }
    function measureCreation(before: Mosaic, next: Mosaic) {
        if (!generation.current.recorded && next.cells.some(Boolean)
            && (before.width !== next.width || before.height !== next.height || before.cells.some((cell, index) => cell !== next.cells[index]))) generation.current.record();
    }
    function change(next: Mosaic, measure = true) { finishStroke(); const before = live.current.mosaic, committed = history.current!.commit(next); install(committed, false); setNotice(''); refreshHistory(value => value + 1); if (measure) measureCreation(before, committed); }
    function undo(redo = false) { if (locked) return; finishStroke(); install(redo ? history.current!.redo() : history.current!.undo(), false, true); setNotice(''); refreshHistory(value => value + 1); }
    function offer(next: Mosaic, message: string, isSaved = false) {
        if (live.current.mosaic.cells.some(Boolean)) setPending({ model: next, message, saved: isSaved });
        else accept(next, isSaved);
    }
    function accept(next: Mosaic, isSaved: boolean) { change(next, !isSaved); if (isSaved) history.current = new MosaicHistory(next, brickCatalog); if (isSaved || !next.cells.some(Boolean)) generation.current.reset(); install(next, isSaved, true); setPending(null); if (isSaved) setSource(null); setNotice(isSaved ? copy.loaded : ''); }
    function point(event: PointerEvent<HTMLCanvasElement>): Point | null {
        const rect = event.currentTarget.getBoundingClientRect(), model = live.current.mosaic;
        const x = Math.floor((event.clientX - rect.left) / rect.width * model.width), y = Math.floor((event.clientY - rect.top) / rect.height * model.height);
        return x >= 0 && y >= 0 && x < model.width && y < model.height ? [x, y] : null;
    }
    function paint(at: Point, from = at) {
        if (tool === 'picker') { const picked = live.current.mosaic.cells[at[1] * live.current.mosaic.width + at[0]]; if (picked) setColor(picked); return; }
        const next = tool === 'fill' ? fillMosaic(live.current.mosaic, at[0], at[1], color, brickCatalog) : paintMosaicLine(live.current.mosaic, from, at, tool === 'erase' ? null : color, brickCatalog);
        const before = live.current.mosaic;
        install(next, false); setNotice(''); measureCreation(before, next);
    }
    function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
        if (locked || event.button !== 0 || stroke.current) return;
        const at = point(event); if (!at) return; event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); setCursor(at);
        if (tool === 'picker') { paint(at); return; }
        if (tool === 'fill') { change(fillMosaic(live.current.mosaic, at[0], at[1], color, brickCatalog)); return; }
        event.currentTarget.setPointerCapture(event.pointerId); stroke.current = { last: at, pointerId: event.pointerId }; paint(at);
    }
    function pointerMove(event: PointerEvent<HTMLCanvasElement>) { const current = stroke.current, at = point(event); if (!current || current.pointerId !== event.pointerId || !at || live.current.busy) return; event.preventDefault(); paint(at, current.last); current.last = at; setCursor(at); }
    function pointerEnd(event: PointerEvent<HTMLCanvasElement>) { if (stroke.current?.pointerId !== event.pointerId) return; finishStroke(); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }
    function keyDown(event: KeyboardEvent<HTMLCanvasElement>) {
        if (locked) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(event.shiftKey); return; }
        const tools: Record<string, Tool> = { b: 'brush', e: 'erase', f: 'fill', i: 'picker' };
        if (tools[event.key.toLowerCase()] && !event.ctrlKey && !event.metaKey) { event.preventDefault(); setTool(tools[event.key.toLowerCase()]); return; }
        const deltas: Record<string, Point> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (deltas[event.key]) { event.preventDefault(); const [dx, dy] = deltas[event.key]; setCursor(([x, y]) => [Math.max(0, Math.min(mosaic.width - 1, x + dx)), Math.max(0, Math.min(mosaic.height - 1, y + dy))]); }
        else if ([' ', 'Enter', 'Delete', 'Backspace'].includes(event.key)) { event.preventDefault(); if (event.key === 'Delete' || event.key === 'Backspace') change(paintMosaicLine(mosaic, cursor, cursor, null, brickCatalog)); else { paint(cursor); if (tool !== 'picker') { history.current!.commit(live.current.mosaic); refreshHistory(value => value + 1); } } }
    }
    async function run(task: (signal: AbortSignal) => Promise<void>, failure: string) {
        if (!live.current.ready || live.current.busy || pending) return;
        finishStroke(); const ticket = ++epoch.current, controller = new AbortController(); operation.current = controller;
        live.current.busy = true; setBusy(true); setNotice('');
        try { await task(controller.signal); }
        catch { if (mounted.current && epoch.current === ticket && !controller.signal.aborted) setNotice(failure); }
        finally { if (mounted.current && epoch.current === ticket) { live.current.busy = false; setBusy(false); operation.current = null; } }
    }
    function cancel() { operation.current?.abort(); epoch.current++; operation.current = null; live.current.busy = false; setBusy(false); setNotice(copy.cancelled); }
    async function loadImage(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        await run(async signal => {
            if (file.size > LIMITS.maxImageBytes) throw new Error('IMAGE_TOO_LARGE');
            const data = await file.arrayBuffer(); signal.throwIfAborted(); inspectImage(new Uint8Array(data), file.type);
            const bitmap = await createImageBitmap(new Blob([data], { type: file.type }));
            try {
                signal.throwIfAborted();
                if (bitmap.width > LIMITS.maxImageSide || bitmap.height > LIMITS.maxImageSide || bitmap.width * bitmap.height > LIMITS.maxImagePixels) throw new Error('IMAGE_TOO_LARGE');
                const surface = document.createElement('canvas'); surface.width = bitmap.width; surface.height = bitmap.height;
                const context = surface.getContext('2d', { willReadFrequently: true }); if (!context) throw new Error('CANVAS_UNAVAILABLE');
                context.drawImage(bitmap, 0, 0); const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
                signal.throwIfAborted(); setSource({ width: bitmap.width, height: bitmap.height, pixels }); setNotice(copy.sourceLoaded);
            } finally { bitmap.close(); }
        }, copy.invalidImage);
    }
    function convert() {
        if (!source || locked) return;
        void run(async signal => {
            const snapshot = source, w = Number(width), h = Number(height), boardSize = live.current.mosaic.boardSize;
            const background = [1, 3, 5].map(start => parseInt(matte.slice(start, start + 2), 16)) as [number, number, number];
            await new Promise<void>(resolve => setTimeout(resolve, 0)); signal.throwIfAborted();
            const result = sampleToMosaic(snapshot, w, h, mode, brickCatalog, { boardSize, alphaThreshold: threshold, matte: background, maxColors, dither });
            signal.throwIfAborted(); offer(result, copy.convertReplace);
        }, copy.error);
    }
    async function loadProject(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        await run(async signal => {
            if (file.size > MOSAIC_PROJECT_MAX_BYTES) throw new Error('PROJECT_TOO_LARGE');
            const raw = await file.text(); signal.throwIfAborted(); const next = parseMosaicProject(raw, brickCatalog);
            offer(next, copy.replace, true);
        }, copy.invalid);
    }
    function saveProject() { if (!ready || busy) return; finishStroke(); try { downloadBlob(new Blob([serializeMosaicProject(live.current.mosaic, brickCatalog)], { type: 'application/json' }), 'brick-mosaic-project.json'); trackToolEvent({ name: 'tool_export', tool: 'brick_mosaic', format: 'project' }); live.current.saved = true; setSaved(true); setNotice(copy.saveNotice); } catch { setNotice(copy.exportFailed); } }
    function exportFile(kind: 'png' | 'csv' | 'pdf') {
        void run(async signal => {
            const snapshot = cloneMosaic(live.current.mosaic, brickCatalog), filename = `brick-mosaic-${snapshot.width}x${snapshot.height}`;
            if (kind === 'csv') { const csv = brickMaterialsCsv(snapshot, brickCatalog); signal.throwIfAborted(); downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${filename}-parts.csv`); }
            else if (kind === 'png') { const bytes = await brickMosaicPng(snapshot, brickCatalog, scale, signal); signal.throwIfAborted(); downloadBlob(new Blob([bytes], { type: 'image/png' }), `${filename}.png`); }
            else { const { createBrickPdf } = await import('../../lib/brick-mosaic/pdf'); signal.throwIfAborted(); const bytes = await createBrickPdf(snapshot, brickCatalog, locale, paper, signal); signal.throwIfAborted(); downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${filename}-${locale}-${paper}.pdf`); }
            trackToolEvent({ name: 'tool_export', tool: 'brick_mosaic', format: kind });
            setNotice(copy.exported);
        }, copy.exportFailed);
    }

    const currentColor = mosaic.cells[cursor[1] * mosaic.width + cursor[0]], cellLabel = format(copy.cell, { row: cursor[1] + 1, column: cursor[0] + 1, color: currentColor ? colours.get(currentColor)!.name : copy.emptyCell });
    return <section aria-label={copy.workspace} className={styles.tool}>
        <div className={styles.header}><h2>{copy.workspace}</h2><span>{saved ? copy.saved : copy.unsaved}</span><div className={styles.actions}><button disabled={!ready || busy} onClick={saveProject}>{copy.save}</button><button disabled={locked} onClick={() => projectInput.current?.click()}>{copy.open}</button></div></div>
        <input type="file" accept="application/json,.json" ref={projectInput} hidden onChange={loadProject} /><input type="file" accept="image/png,image/jpeg,image/webp" ref={imageInput} hidden onChange={loadImage} />
        {!ready && <div className={styles.notice}>{recoveryFailed ? <><p>{copy.recoveryFailed}</p><button onClick={recover}>{copy.retry}</button><button onClick={startBlank}>{copy.discard}</button></> : copy.loading}</div>}
        {pending && <div className={styles.notice} role="alert"><p>{pending.message}</p><p>{copy.downloadProjectFirst}</p><div className={styles.actions}><button onClick={saveProject}>{copy.save}</button><button onClick={() => accept(pending.model, pending.saved)}>{copy.confirmReplace}</button><button onClick={() => setPending(null)}>{copy.keepCurrent}</button></div></div>}
        <div className={styles.setup}>
            <fieldset disabled={locked}><legend>{copy.size}</legend><div className={styles.row}><label>{copy.width}<input type="number" min="1" max="128" value={width} onChange={e => setWidth(e.target.value)} /></label><label>{copy.height}<input type="number" min="1" max="128" value={height} onChange={e => setHeight(e.target.value)} /></label><button onClick={() => { try { offer(createMosaic(Number(width), Number(height), mosaic.boardSize, brickCatalog), copy.resizeConfirm); } catch { setNotice(copy.error); } }}>{copy.applySize}</button><label>{copy.boardSize}<select value={mosaic.boardSize} onChange={e => { change({ ...cloneMosaic(mosaic, brickCatalog), boardSize: Number(e.target.value) as 32 | 48 }); setSelectedBoard(-1); }}><option value="32">{copy.board32}</option><option value="48">{copy.board48}</option></select></label></div><p className={styles.hint}>{copy.sizeHelp}</p></fieldset>
            <p className={styles.hint}>{copy.partHelp} · {copy.nominalSize && format(copy.nominalSize, { width: (mosaic.width * .8).toFixed(1), height: (mosaic.height * .8).toFixed(1) })}</p>
        </div>
        <div className={styles.workspace}>
            <div className={styles.editor}>
                <fieldset disabled={locked} className={styles.toolbar}><legend>{copy.tools}</legend><div className={styles.actions}>{(['brush', 'erase', 'fill', 'picker'] as const).map(value => <button key={value} aria-pressed={tool === value} onClick={() => setTool(value)}>{copy[value]}</button>)}<button disabled={locked || !history.current!.canUndo()} onClick={() => undo()}>{copy.undo}</button><button disabled={locked || !history.current!.canRedo()} onClick={() => undo(true)}>{copy.redo}</button><button onClick={() => offer(createMosaic(mosaic.width, mosaic.height, mosaic.boardSize, brickCatalog), copy.clearConfirm)}>{copy.clear}</button></div></fieldset>
                <div className={styles.row}><label className={styles.check}><input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} />{copy.grid}</label><label>{copy.scale}<select value={zoom} onChange={e => setZoom(Number(e.target.value))}>{[6, 8, 12, 16, 24].map(value => <option key={value} value={value}>{value}×</option>)}</select></label><label>{copy.boardPreview}<select value={selectedBoard} onChange={e => setSelectedBoard(Number(e.target.value))}><option value="-1">{copy.allBoards}</option>{materials.boards.map((board, index) => <option key={index} value={index}>{index + 1} · {board.row + 1}, {board.column + 1}</option>)}</select></label></div>
                <div className={styles.canvasScroll}><canvas ref={canvas} tabIndex={locked ? -1 : 0} role="img" aria-label={copy.canvas} aria-describedby={`${id}-keyboard ${id}-cell`} style={{ width: mosaic.width * zoom, height: mosaic.height * zoom }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={() => finishStroke()} onKeyDown={keyDown} /></div>
                <p className={styles.hint} id={`${id}-cell`} aria-live="polite">{cellLabel}</p><p className={styles.hint} id={`${id}-keyboard`}>{copy.keyboard}</p>
                <fieldset disabled={locked} className={styles.palette}><legend>{copy.palette} · {brickCatalog.colors.length}</legend><div className={styles.swatches}>{brickCatalog.colors.map(entry => <button key={entry.id} aria-label={`${entry.name} · LEGO ${entry.legoColorId ?? copy.unknownCode} · LDraw ${entry.ldrawCode}`} title={`${entry.name} / ${entry.elementId}`} aria-pressed={color === entry.id} onClick={() => setColor(entry.id)}><span style={{ backgroundColor: entry.hex }} /><span>{entry.name}</span></button>)}</div><p className={styles.hint}>{copy.paletteHelp}</p></fieldset>
                <fieldset disabled={locked}><legend>{copy.replaceColor}</legend><div className={styles.row}><label>{copy.replaceColor}<select value={replaceFrom} onChange={e => setReplaceFrom(e.target.value)}><option value="">{copy.emptyCell}</option>{brickCatalog.colors.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><label>{copy.replaceWith}<select value={color} onChange={e => setColor(e.target.value)}>{brickCatalog.colors.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label><button onClick={() => change(replaceMosaicColor(mosaic, replaceFrom || null, color, brickCatalog))}>{copy.applyReplace}</button></div></fieldset>
            </div>
            <aside className={styles.side}>
                <fieldset disabled={locked}><legend>{copy.imageTitle}</legend><button onClick={() => imageInput.current?.click()}>{copy.chooseImage}</button><p className={styles.hint}>{copy.imageHelp}</p>{source && <><PhotoPreview source={source} label={copy.sourcePreview} /><p className={styles.hint}>{format(copy.imageDimensions, { width: source.width, height: source.height })}</p></>}<label>{copy.imagePlacement}<select value={mode} onChange={e => setMode(e.target.value as ResizeMode)}><option value="fit">{copy.fit}</option><option value="crop">{copy.crop}</option><option value="stretch">{copy.stretch}</option></select></label><label>{copy.maxColors}<input type="number" min="1" max={brickCatalog.colors.length} value={maxColors} onChange={e => setMaxColors(Number(e.target.value))} /></label><label className={styles.check}><input type="checkbox" checked={dither} onChange={e => setDither(e.target.checked)} />{copy.dithering}</label><label>{copy.alphaThreshold}<input type="number" min="0" max="255" value={threshold} onChange={e => setThreshold(Number(e.target.value))} /></label><label>{copy.matte}<input type="color" value={matte} onChange={e => setMatte(e.target.value)} /></label><p className={styles.hint}>{copy.transparentHelp}</p><button disabled={locked || !source} className={styles.primary} onClick={convert}>{copy.convert}</button></fieldset>
                <fieldset disabled={locked}><legend>{copy.export}</legend><label>{copy.scale}<select value={scale} onChange={e => setScale(Number(e.target.value))}>{[1, 4, 8, 16].map(value => <option key={value} value={value}>{value}× PNG</option>)}</select></label><label>{copy.paper}<select value={paper} onChange={e => setPaper(e.target.value as BrickPaper)}><option value="a4">{copy.a4}</option><option value="letter">{copy.letter}</option></select></label><div className={styles.exports}><button onClick={() => exportFile('png')}>{copy.png}</button><button onClick={() => exportFile('csv')}>{copy.csv}</button><button className={styles.primary} onClick={() => exportFile('pdf')}>{copy.pdf}</button></div><p className={styles.hint}>{copy.exportHelp}</p><p className={styles.hint}>{copy.projectHelp}</p></fieldset>
            </aside>
        </div>
        <section className={styles.materials} aria-label={copy.materials}><h3>{copy.materials}</h3><p>{format(copy.summary, { width: mosaic.width, height: mosaic.height, pieces: materials.total, boards: materials.boards.length })}</p>{shownBoard && <p className={styles.hint}>{format(copy.selectedBoard, { number: selectedBoard + 1 })} · {copy.placed}: {shownBoard.occupied} · {copy.empty}: {shownBoard.emptyCount} · {copy.pdfLabels.padding}: {shownBoard.padding}</p>}<p className={styles.hint}>{copy.edgeHelp}</p>{usage.length ? <div className={styles.tableScroll}><table><thead><tr><th>{copy.colorName}</th><th>{copy.partId}</th><th>{copy.legoColorId}</th><th>LDraw</th><th>{copy.quantity}</th></tr></thead><tbody>{usage.map(({ color: entry, count }, index) => <tr key={entry.id}><td><span className={styles.dot} style={{ backgroundColor: entry.hex }} />{index + 1} · {entry.name}</td><td>{entry.elementId}</td><td>{entry.legoColorId ?? copy.unknownCode}</td><td>{entry.ldrawCode}</td><td>{count}</td></tr>)}</tbody></table></div> : <p className={styles.hint}>{copy.emptyMaterials}</p>}</section>
        {(notice || busy) && <div className={styles.notice} role="status">{busy ? copy.busy : notice}{busy && <button onClick={cancel}>{copy.cancel}</button>}</div>}
        <p className={styles.local}>{copy.local}</p>
    </section>;
}

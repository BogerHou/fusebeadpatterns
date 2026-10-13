'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { SiteLocale } from '@/lib/i18n/locales';
import { getEditorTranslator } from '@/lib/editor/messages';
import { CRAFT_PROGRESS_MAX_FILE_BYTES, CraftProgressError, craftPatternId, createCraftMarks, exportCraftProgress,
    getCraftColorKey, getCraftSummary, importCraftProgress, setCraftCells, type CraftPattern } from '@/lib/editor/craft-progress';
import { createCraftProgressStore } from '@/lib/editor/craft-progress-storage';
import { CraftProgressHistory, CraftProgressSaveQueue, craftLine, craftRectangle,
    type CraftPoint, type CraftSaveStatus } from '@/lib/editor/craft-progress-ui-state';
import { getCraftProgressCopy } from '@/lib/editor/craft-progress-copy';
import { EditorDialog } from './EditorDialog';

type Props = { pattern: CraftPattern; locale: SiteLocale; onClose: () => void };
type Stroke = { id: number; before: Uint8Array; from: CraftPoint; last: CraftPoint; rectangle: boolean; value: boolean };
type Pan = { id: number; x: number; y: number; left: number; top: number };
const CELL = 12;
const BUTTON = 'min-h-11 rounded-lg border border-[#768b7c] bg-white px-3 py-2 text-sm font-semibold text-brutal-black hover:bg-brand-cyan disabled:opacity-50';

/** This dialog owns placement marks only. Its parent supplies a detached,
 * immutable pattern; no editor canvas, palette or source draft is modified. */
export function CraftProgressDialog({ pattern, locale, onClose }: Props) {
    const copy = getCraftProgressCopy(locale), t = getEditorTranslator(locale), id = useId();
    const [marks, setMarks] = useState(() => createCraftMarks(pattern));
    const marksRef = useRef(marks);
    const historyRef = useRef(new CraftProgressHistory(marks.length));
    const [historyRevision, setHistoryRevision] = useState(0);
    const [board, setBoard] = useState({ row: 0, column: 0 });
    const [colorKey, setColorKey] = useState<string | null>(null);
    const [mode, setMode] = useState<'mark' | 'unmark' | 'pan'>('mark');
    const [cursor, setCursor] = useState<CraftPoint>({ x: 0, y: 0 });
    const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
    const [saveStatus, setSaveStatus] = useState<CraftSaveStatus>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const [closing, setClosing] = useState(false);
    const [closeFailed, setCloseFailed] = useState(false);
    const [importing, setImporting] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null), viewportRef = useRef<HTMLDivElement>(null), gridRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const strokeRef = useRef<Stroke | null>(null), panRef = useRef<Pan | null>(null);
    const storeRef = useRef(createCraftProgressStore());
    const patternIdRef = useRef<string | null>(null);
    const queueRef = useRef<CraftProgressSaveQueue | null>(null);
    const queuedMarksRef = useRef<Uint8Array | null>(null);
    const cleanupWriteRef = useRef<() => void>(() => {}), suppressCleanupWrite = useRef(false);
    const alive = useRef(true), loadEpoch = useRef(0), fileEpoch = useRef(0), closingRef = useRef(false);
    const dirtyRef = useRef(false), exportedRef = useRef<Uint8Array | null>(null);
    const global = useMemo(() => getCraftSummary(pattern, marks, { includeColors: false }), [pattern, marks]);
    const selected = useMemo(() => getCraftSummary(pattern, marks, { board }), [pattern, marks, board]);
    const filtered = useMemo(() => colorKey ? getCraftSummary(pattern, marks, { board, colorKey }) : selected, [pattern, marks, board, colorKey, selected]);
    const number = (value: number) => value.toLocaleString(locale);
    const enabled = phase === 'ready' && !closing && !importing;
    const boardX = board.column * pattern.boardSize, boardY = board.row * pattern.boardSize;

    const startQueue = useCallback((signature: string, epoch: number, initialStatus: CraftSaveStatus = 'idle') => {
        queuedMarksRef.current = marksRef.current;
        queueRef.current = new CraftProgressSaveQueue(raw => storeRef.current.save(signature, raw), status => {
            if (!alive.current || loadEpoch.current !== epoch) return;
            const pending = strokeRef.current !== null || queuedMarksRef.current !== marksRef.current;
            dirtyRef.current = Boolean((pending || queueRef.current?.dirty) && exportedRef.current !== marksRef.current);
            setSaveStatus(status === 'saved' && pending ? 'saving' : status);
        }, initialStatus);
    }, []);

    const readProgress = useCallback(async () => {
        const epoch = ++loadEpoch.current;
        setPhase('loading'); setMessage(null); setCloseFailed(false);
        try {
            const signature = await craftPatternId(pattern);
            if (!alive.current || epoch !== loadEpoch.current) return;
            patternIdRef.current = signature;
            const raw = await storeRef.current.load(signature);
            if (!alive.current || epoch !== loadEpoch.current) return;
            const restored = raw === null ? createCraftMarks(pattern) : importCraftProgress(raw, signature, pattern);
            marksRef.current = restored; setMarks(restored);
            historyRef.current = new CraftProgressHistory(restored.length); setHistoryRevision(n => n + 1);
            exportedRef.current = null; dirtyRef.current = false;
            startQueue(signature, epoch, raw === null ? 'idle' : 'saved'); setSaveStatus(raw === null ? 'idle' : 'saved'); setPhase('ready');
        } catch {
            if (alive.current && epoch === loadEpoch.current) setPhase('error');
        }
    }, [pattern, startQueue]);

    const invalidateReads = useCallback(() => { loadEpoch.current++; fileEpoch.current++; }, []);

    // SPA unmount does not fire beforeunload. Preserve the latest in-progress
    // stroke best-effort; normal Close has already awaited its own write queue.
    cleanupWriteRef.current = () => {
        const signature = patternIdRef.current, queue = queueRef.current;
        if (suppressCleanupWrite.current || !signature || !queue ||
            (!strokeRef.current && queuedMarksRef.current === marksRef.current && !queue.dirty)) return;
        try { queue.request(exportCraftProgress(signature, pattern, marksRef.current)); }
        catch { /* A browser teardown cannot promise persistence; export is the durable copy. */ }
    };

    useEffect(() => {
        alive.current = true;
        void readProgress();
        return () => {
            alive.current = false;
            cleanupWriteRef.current();
            invalidateReads();
        };
    }, [readProgress, invalidateReads]);

    function saveNow() {
        const signature = patternIdRef.current;
        if (!signature || !queueRef.current) return;
        try {
            const raw = exportCraftProgress(signature, pattern, marksRef.current);
            queuedMarksRef.current = marksRef.current;
            queueRef.current.request(raw);
        }
        catch { setSaveStatus('error'); dirtyRef.current = true; }
    }
    function changed(next: Uint8Array) {
        marksRef.current = next; setMarks(next);
        dirtyRef.current = true; exportedRef.current = null; setCloseFailed(false); setSaveStatus('saving');
        saveNow();
    }
    function finishStroke() {
        const stroke = strokeRef.current;
        strokeRef.current = null;
        if (stroke) {
            if (historyRef.current.push(stroke.before, marksRef.current)) {
                setHistoryRevision(n => n + 1);
                changed(marksRef.current);
            } else {
                // A redundant mark/rectangle may allocate an identical buffer.
                // Restore its accepted identity instead of inventing dirty work.
                marksRef.current = stroke.before; setMarks(stroke.before);
                const queue = queueRef.current, pending = Boolean(queue?.dirty || queuedMarksRef.current !== stroke.before);
                dirtyRef.current = pending && exportedRef.current !== stroke.before;
                setSaveStatus(previous => pending ? (previous === 'error' ? 'error' : 'saving') : queue?.status ?? 'idle');
            }
        }
    }
    async function close() {
        if (closingRef.current) return;
        closingRef.current = true; setClosing(true); fileEpoch.current++; setImporting(false);
        finishStroke();
        const saved = await (queueRef.current?.flush() ?? Promise.resolve(true));
        if (!alive.current) return;
        if ((!saved || dirtyRef.current) && exportedRef.current !== marksRef.current) {
            setCloseFailed(true); setClosing(false); closingRef.current = false; return;
        }
        suppressCleanupWrite.current = true; loadEpoch.current++; onClose();
    }
    function closeWithoutSaving() {
        if (!window.confirm(copy.closeConfirm)) return;
        suppressCleanupWrite.current = true; loadEpoch.current++; fileEpoch.current++; onClose();
    }
    function startNew() {
        if (phase !== 'error' || !patternIdRef.current || !window.confirm(copy.startNewConfirm)) return;
        const epoch = ++loadEpoch.current, next = createCraftMarks(pattern);
        startQueue(patternIdRef.current, epoch); historyRef.current = new CraftProgressHistory(next.length);
        setPhase('ready'); setHistoryRevision(n => n + 1); changed(next);
    }
    function apply(next: Uint8Array) {
        if (!historyRef.current.push(marksRef.current, next)) return;
        changed(next); setHistoryRevision(n => n + 1); setMessage(null);
    }
    function undo() {
        finishStroke(); const next = historyRef.current.undo(marksRef.current);
        if (next) { changed(next); setHistoryRevision(n => n + 1); }
    }
    function redo() {
        finishStroke(); const next = historyRef.current.redo(marksRef.current);
        if (next) { changed(next); setHistoryRevision(n => n + 1); }
    }
    function canMark(point: CraftPoint): number | null {
        const index = (boardY + point.y) * pattern.width + boardX + point.x;
        if (pattern.pixels[index * 4 + 3] === 0) { setMessage(copy.emptyCell); return null; }
        if (colorKey && getCraftColorKey(pattern.pixels[index * 4], pattern.pixels[index * 4 + 1], pattern.pixels[index * 4 + 2]) !== colorKey) {
            setMessage(copy.filteredCell); return null;
        }
        return index;
    }
    function indices(points: CraftPoint[]): number[] {
        const result: number[] = [];
        for (const p of points) {
            const index = (boardY + p.y) * pattern.width + boardX + p.x, offset = index * 4;
            if (pattern.pixels[offset + 3] && (!colorKey || getCraftColorKey(pattern.pixels[offset], pattern.pixels[offset + 1], pattern.pixels[offset + 2]) === colorKey)) result.push(index);
        }
        return result;
    }
    function point(event: PointerEvent): CraftPoint | null {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect || !rect.width || !rect.height) return null;
        const x = Math.floor((event.clientX - rect.left) / rect.width * pattern.boardSize), y = Math.floor((event.clientY - rect.top) / rect.height * pattern.boardSize);
        return { x: Math.max(0, Math.min(pattern.boardSize - 1, x)), y: Math.max(0, Math.min(pattern.boardSize - 1, y)) };
    }
    function pointerDown(event: PointerEvent<HTMLDivElement>) {
        if (!enabled || event.button !== 0 || !event.isPrimary) return;
        const p = point(event), viewport = viewportRef.current;
        if (!p || !viewport) return;
        gridRef.current?.focus({ preventScroll: true }); setCursor(p);
        event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault();
        if (mode === 'pan') {
            panRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop }; return;
        }
        if (canMark(p) === null) return;
        finishStroke();
        const before = marksRef.current;
        strokeRef.current = { id: event.pointerId, before, from: p, last: p, rectangle: event.shiftKey, value: mode === 'mark' };
        const next = setCraftCells(pattern, before, indices([p]), mode === 'mark');
        marksRef.current = next; setMarks(next); setMessage(null);
    }
    function pointerMove(event: PointerEvent<HTMLDivElement>) {
        const pan = panRef.current, viewport = viewportRef.current;
        if (pan && pan.id === event.pointerId && viewport) { viewport.scrollLeft = pan.left - (event.clientX - pan.x); viewport.scrollTop = pan.top - (event.clientY - pan.y); return; }
        const stroke = strokeRef.current, p = point(event);
        if (!enabled || !stroke || stroke.id !== event.pointerId || !p || (p.x === stroke.last.x && p.y === stroke.last.y)) return;
        const points = stroke.rectangle ? craftRectangle(stroke.from, p) : craftLine(stroke.last, p);
        const next = setCraftCells(pattern, stroke.rectangle ? stroke.before : marksRef.current, indices(points), stroke.value);
        stroke.last = p; marksRef.current = next; setMarks(next); setCursor(p); event.preventDefault();
    }
    function pointerEnd(event: PointerEvent<HTMLDivElement>) {
        if (panRef.current?.id === event.pointerId) panRef.current = null;
        if (strokeRef.current?.id === event.pointerId) finishStroke();
    }
    function ensureCursorVisible(next: CraftPoint) {
        const viewport = viewportRef.current;
        if (!viewport) return;
        if (next.x * CELL < viewport.scrollLeft) viewport.scrollLeft = next.x * CELL;
        if ((next.x + 1) * CELL > viewport.scrollLeft + viewport.clientWidth) viewport.scrollLeft = (next.x + 1) * CELL - viewport.clientWidth;
        if (next.y * CELL < viewport.scrollTop) viewport.scrollTop = next.y * CELL;
        if ((next.y + 1) * CELL > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = (next.y + 1) * CELL - viewport.clientHeight;
    }
    function key(event: KeyboardEvent<HTMLDivElement>) {
        if (!enabled) return;
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault(); ensureCursorVisible(cursor); finishStroke(); const index = canMark(cursor);
            if (index !== null) apply(setCraftCells(pattern, marksRef.current, [index], !marksRef.current[index]));
            return;
        }
        const offsets: Record<string, CraftPoint> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
        const step = offsets[event.key]; if (!step) return;
        event.preventDefault();
        const next = { x: Math.max(0, Math.min(pattern.boardSize - 1, cursor.x + step.x)), y: Math.max(0, Math.min(pattern.boardSize - 1, cursor.y + step.y)) };
        setCursor(next);
        ensureCursorVisible(next);
    }

    useEffect(() => {
        const canvas = canvasRef.current, context = canvas?.getContext('2d'); if (!canvas || !context) return;
        canvas.width = canvas.height = pattern.boardSize * CELL;
        for (let y = 0; y < pattern.boardSize; y++) for (let x = 0; x < pattern.boardSize; x++) {
            const index = (boardY + y) * pattern.width + boardX + x, offset = index * 4;
            const [r, g, b, a] = pattern.pixels.subarray(offset, offset + 4);
            const match = !colorKey || getCraftColorKey(r, g, b) === colorKey;
            context.fillStyle = a ? `rgba(${r},${g},${b},${match ? a / 255 : .15})` : '#edf0ec';
            context.fillRect(x * CELL, y * CELL, CELL, CELL);
            if (marks[index]) {
                context.beginPath(); context.moveTo(x * CELL + 2, y * CELL + 6); context.lineTo(x * CELL + 5, y * CELL + 9); context.lineTo(x * CELL + 10, y * CELL + 3);
                context.strokeStyle = '#fff'; context.lineWidth = 4; context.stroke(); context.strokeStyle = '#164b36'; context.lineWidth = 2; context.stroke();
            }
        }
        context.strokeStyle = '#33433d80'; context.lineWidth = .5; context.beginPath();
        for (let i = 0; i <= pattern.boardSize; i++) { context.moveTo(i * CELL, 0); context.lineTo(i * CELL, canvas.height); context.moveTo(0, i * CELL); context.lineTo(canvas.width, i * CELL); }
        context.stroke();
        context.lineWidth = 3; context.strokeStyle = '#fff'; context.strokeRect(cursor.x * CELL + 1, cursor.y * CELL + 1, CELL - 2, CELL - 2);
        context.lineWidth = 1; context.strokeStyle = '#111'; context.strokeRect(cursor.x * CELL + 1, cursor.y * CELL + 1, CELL - 2, CELL - 2);
    }, [pattern, marks, boardX, boardY, colorKey, cursor]);

    useEffect(() => {
        const guard = (event: BeforeUnloadEvent) => {
            if (!dirtyRef.current && !strokeRef.current) return;
            event.preventDefault(); event.returnValue = '';
        };
        window.addEventListener('beforeunload', guard);
        return () => window.removeEventListener('beforeunload', guard);
    }, []);

    function download() {
        finishStroke(); const signature = patternIdRef.current; if (!signature || phase !== 'ready') return;
        try {
            const raw = exportCraftProgress(signature, pattern, marksRef.current), blob = new Blob([raw], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a');
            try { link.href = url; link.download = `bead-progress-${signature.slice(0, 12)}.json`; document.body.appendChild(link); link.click(); }
            finally { link.remove(); URL.revokeObjectURL(url); }
            exportedRef.current = marksRef.current; dirtyRef.current = false; setMessage(null);
        } catch { setMessage(copy.error); }
    }
    async function upload(file: File | null) {
        if (!file || !enabled) return;
        finishStroke(); const epoch = ++fileEpoch.current; setImporting(true); setMessage(null);
        try {
            if (file.size > CRAFT_PROGRESS_MAX_FILE_BYTES) throw new Error('Progress file too large');
            const raw = await file.text();
            if (!alive.current || epoch !== fileEpoch.current) return;
            const signature = patternIdRef.current; if (!signature) throw new Error('Progress identity unavailable');
            const next = importCraftProgress(raw, signature, pattern);
            apply(next);
        } catch (error) {
            if (alive.current && epoch === fileEpoch.current) setMessage(error instanceof CraftProgressError && error.code === 'PATTERN_MISMATCH' ? copy.importMismatch : copy.importError);
        } finally { if (alive.current && epoch === fileEpoch.current) setImporting(false); }
    }
    const currentIndex = (boardY + cursor.y) * pattern.width + boardX + cursor.x;
    const color = selected.colors.find(c => c.key === getCraftColorKey(pattern.pixels[currentIndex * 4], pattern.pixels[currentIndex * 4 + 1], pattern.pixels[currentIndex * 4 + 2]));
    const cursorStatus = copy.cellStatus.replace('{row}', number(boardY + cursor.y + 1)).replace('{column}', number(boardX + cursor.x + 1))
        .replace('{state}', pattern.pixels[currentIndex * 4 + 3] === 0 ? copy.emptyCell : marks[currentIndex] ? copy.done : copy.todo)
        .replace('{color}', color?.ref ?? copy.unknownColor);
    const statusText = saveStatus === 'saved' ? copy.saved : saveStatus === 'saving' ? copy.saving : saveStatus === 'error' ? copy.saveError : copy.noChanges;

    return <EditorDialog locale={locale} title={copy.title} summary={copy.summary} onClose={() => void close()}>
        <div className="space-y-4" aria-busy={phase === 'loading' || closing || importing}>
            <p className="text-xs leading-5 text-[#627168]">{copy.localHelp}</p>
            {phase === 'loading' ? <p role="status">{copy.loading}</p> : phase === 'error' ? <div className="space-y-2">
                <p role="alert">{copy.loadError}</p><div className="flex flex-wrap gap-2">
                    <button type="button" className={BUTTON} onClick={() => void readProgress()}>{copy.retry}</button>
                    <button type="button" className={BUTTON} disabled={!patternIdRef.current} onClick={startNew}>{copy.startNew}</button>
                </div>
            </div> : <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold" htmlFor={`${id}-board`}>{copy.boardLabel}
                        <select id={`${id}-board`} value={`${board.row},${board.column}`} disabled={!enabled} className="mt-1 min-h-11 w-full rounded-lg border border-[#768b7c] bg-white px-2 text-sm"
                            onChange={event => { finishStroke(); const next = global.boards.find(b => `${b.row},${b.column}` === event.target.value); if (next) { setBoard({ row: next.row, column: next.column }); setCursor({ x: 0, y: 0 }); setMessage(null); } }}>
                            {global.boards.map(b => <option key={`${b.row},${b.column}`} value={`${b.row},${b.column}`}>{copy.boardPosition(b.row, b.column)}</option>)}
                        </select>
                    </label>
                    <label className="text-sm font-semibold" htmlFor={`${id}-color`}>{copy.colorLabel}
                        <select id={`${id}-color`} value={colorKey ?? ''} disabled={!enabled} className="mt-1 min-h-11 w-full rounded-lg border border-[#768b7c] bg-white px-2 text-sm"
                            onChange={event => { finishStroke(); setColorKey(event.target.value || null); setMessage(null); }}>
                            <option value="">{copy.allColors}</option>
                            {colorKey && !selected.colors.some(c => c.key === colorKey) ? <option value={colorKey}>RGB {colorKey}</option> : null}
                            {selected.colors.map(c => <option key={c.key} value={c.key}>{c.ref ? `${c.prefix ? `${c.prefix} ` : ''}${c.ref}` : copy.unknownColor} · RGB {c.r}, {c.g}, {c.b}</option>)}
                        </select>
                    </label>
                </div>
                <p className="text-sm"><strong>{copy.whole}</strong> · {copy.completed}: {number(global.completed)} / {number(global.total)} · {copy.remaining}: {number(global.remaining)}</p>
                <p className="text-sm"><strong>{copy.board}</strong> · {copy.completed}: {number(filtered.completed)} / {number(filtered.total)} · {copy.remaining}: {number(filtered.remaining)}</p>
                <p className="text-xs text-[#627168]">{copy.globalRows(selected.bounds.y + 1, selected.bounds.y + selected.bounds.height)} · {copy.globalColumns(selected.bounds.x + 1, selected.bounds.x + selected.bounds.width)}</p>
                <fieldset disabled={!enabled} className="flex flex-wrap gap-2">
                    <legend className="sr-only">{copy.instructions}</legend>
                    {(['mark', 'unmark', 'pan'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} className={`${BUTTON} ${mode === value ? 'bg-[#e3f1e7]' : ''}`}
                        onClick={() => { finishStroke(); setMode(value); }}>{value === 'pan' ? t('Pan') : copy[value]}</button>)}
                    <button type="button" className={BUTTON} disabled={!historyRef.current.canUndo || historyRevision < 0} onClick={undo}>{copy.undo}</button>
                    <button type="button" className={BUTTON} disabled={!historyRef.current.canRedo || historyRevision < 0} onClick={redo}>{copy.redo}</button>
                </fieldset>
                <p id={`${id}-help`} className="text-xs leading-5 text-[#627168]">{copy.instructions}</p>
                <div ref={viewportRef} className="max-h-[42vh] overflow-auto rounded-lg border border-[#768b7c] bg-white">
                    <div ref={gridRef} role="grid" tabIndex={enabled ? 0 : -1} aria-label={copy.canvasLabel} aria-rowcount={pattern.boardSize} aria-colcount={pattern.boardSize}
                        aria-activedescendant={`${id}-cell`} aria-describedby={`${id}-help ${id}-cursor`}
                        onKeyDown={key} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}
                        style={{ width: pattern.boardSize * CELL, height: pattern.boardSize * CELL, touchAction: 'none', cursor: mode === 'pan' ? 'grab' : 'crosshair' }} className="relative outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#28614e]">
                        <canvas ref={canvasRef} aria-hidden="true" className="block" />
                        <span id={`${id}-cell`} role="gridcell" aria-rowindex={cursor.y + 1} aria-colindex={cursor.x + 1} aria-label={cursorStatus} className="sr-only">{cursorStatus}</span>
                    </div>
                </div>
                <p id={`${id}-cursor`} className="text-xs" role="status">{cursorStatus}</p>
                {selected.total === 0 ? <p className="text-sm">{copy.emptyBoard}</p> : <div className="max-h-48 overflow-auto rounded-lg border border-[#d9ded5]">
                    <table className="w-full text-left text-xs"><caption className="sr-only">{copy.board} · {copy.remaining}</caption>
                        <thead className="sticky top-0 bg-[#f5f7f3]"><tr><th className="p-2">{copy.colorLabel}</th><th className="p-2 text-right">{copy.completed}</th><th className="p-2 text-right">{copy.remaining}</th><th className="p-2 text-right">{copy.total}</th></tr></thead>
                        <tbody>{selected.colors.filter(c => !colorKey || c.key === colorKey).map(c => <tr key={c.key} className="border-t border-[#d9ded5]">
                            <th className="p-2 font-medium"><span aria-hidden="true" style={{ background: `rgb(${c.r},${c.g},${c.b})` }} className="mr-2 inline-block h-3 w-3 rounded-sm border border-[#627168] align-middle" />{c.ref ? `${c.prefix ? `${c.prefix} ` : ''}${c.ref}` : copy.unknownColor}<span className="ml-1 font-normal">{c.name ?? `RGB ${c.r}, ${c.g}, ${c.b}`}</span></th>
                            <td className="p-2 text-right tabular-nums">{number(c.completed)}</td><td className="p-2 text-right tabular-nums">{number(c.remaining)}</td><td className="p-2 text-right tabular-nums">{number(c.total)}</td>
                        </tr>)}</tbody>
                    </table>
                </div>}
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={BUTTON} disabled={!enabled || global.completed === 0} onClick={() => { finishStroke(); if (window.confirm(copy.clearConfirm)) apply(createCraftMarks(pattern)); }}>{copy.clear}</button>
                    <button type="button" className={BUTTON} disabled={closing || importing} onClick={download}>{copy.exportProgress}</button>
                    <button type="button" className={BUTTON} disabled={!enabled} onClick={() => inputRef.current?.click()}>{copy.importProgress}</button>
                    <input ref={inputRef} type="file" accept=".json,application/json" aria-label={copy.importProgress} className="sr-only" onChange={event => { const file = event.target.files?.[0] ?? null; event.currentTarget.value = ''; void upload(file); }} />
                </div>
                <p className="text-xs leading-5 text-[#627168]">{copy.fileHelp}</p>
                <p role={saveStatus === 'error' ? 'alert' : 'status'} className="text-sm">{statusText}</p>
                {saveStatus === 'error' ? <button type="button" className={BUTTON} disabled={closing} onClick={() => { if (queueRef.current?.dirty) queueRef.current.retry(); else saveNow(); }}>{copy.retry}</button> : null}
            </>}
            {message ? <p role="alert" className="text-sm">{message}</p> : null}
            {closeFailed ? <div className="space-y-2 rounded-lg bg-[#fff8e1] p-3"><p role="alert" className="text-sm">{copy.closeSaveError}</p><button type="button" className={BUTTON} disabled={closing || importing || saveStatus === 'saving'} onClick={closeWithoutSaving}>{copy.closeWithoutSaving}</button></div> : null}
            <div className="flex justify-end border-t border-[#d9ded5] pt-3"><button type="button" className={BUTTON} disabled={closing} onClick={() => void close()}>{closing ? copy.closing : copy.close}</button></div>
        </div>
    </EditorDialog>;
}

export default CraftProgressDialog;

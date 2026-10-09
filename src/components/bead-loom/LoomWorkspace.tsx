'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { LIMITS, validateChart, chartsEqual, getCounts, getRowInstructions, rowNumberAt, paintLine, replaceColor, serializeProject, parseProject, convertImage, type LoomChart } from '@/lib/bead-loom/core';
import { inspectImage, type RgbaSource } from '@/lib/pixel-grid/core';
import { LOOM_MESSAGES, createLocalizedLoomChart, loomErrorMessage, type LoomLocale } from '@/lib/bead-loom/messages';
import { LOCALE_NAVIGATION_EVENT, type LocaleNavigationDetail } from '@/lib/i18n/routes';
import { LOOM_LOCALE_STORAGE_KEY, consumeLoomLocaleSnapshot, consumeLargeLoomLocaleSnapshot, hasLargeLoomLocaleSnapshot, isLoomLocaleNavigation, saveLoomLocaleSnapshot, saveLargeLoomLocaleSnapshot, type LoomLocaleSnapshot, type LoomZoom } from '@/lib/bead-loom/locale-navigation';
import { loomSymbolInk } from '@/lib/bead-loom/contrast';
import { getLoomPattern, getLoomPatternChart } from '@/lib/bead-loom/patterns';
import { trackBeadLoomExport } from '@/lib/analytics';
import styles from './LoomWorkspace.module.css';

type Point = [number, number];
type Tool = 'paint' | 'background' | 'pan';
type Stroke = { id: number; before: LoomChart; last: Point; color: string } | { id: number; pan: Point; scroll: Point };
const margin = 38;
const moves: Record<string, Point> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

function draw(canvas: HTMLCanvasElement, chart: LoomChart, scale: number, cursor?: Point) {
    const w = scale * chart.cellAspect, h = scale;
    canvas.width = Math.ceil(chart.columns * w + margin * 2);
    canvas.height = Math.ceil(chart.rows * h + margin * 2);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('The browser could not create the chart canvas.');
    ctx.fillStyle = '#fffefa'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const palette = new Map(chart.palette.map(c => [c.id, c]));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let y = 0; y < chart.rows; y++) for (let x = 0; x < chart.columns; x++) {
        const color = palette.get(chart.cells[y * chart.columns + x])!;
        ctx.fillStyle = color.hex; ctx.fillRect(margin + x * w, margin + y * h, w, h);
        if (Math.min(w, h) >= 14) {
            ctx.font = `600 ${Math.min(14, Math.floor(Math.min(w, h) * .65))}px sans-serif`;
            ctx.fillStyle = loomSymbolInk(color.hex); ctx.fillText(color.symbol, margin + (x + .5) * w, margin + (y + .5) * h);
        }
    }
    ctx.strokeStyle = '#64796b'; ctx.lineWidth = .6;
    ctx.beginPath();
    for (let x = 0; x <= chart.columns; x++) { ctx.moveTo(margin + x * w, margin); ctx.lineTo(margin + x * w, margin + chart.rows * h); }
    for (let y = 0; y <= chart.rows; y++) { ctx.moveTo(margin, margin + y * h); ctx.lineTo(margin + chart.columns * w, margin + y * h); }
    ctx.stroke(); ctx.fillStyle = '#243e36'; ctx.font = '11px sans-serif';
    const xs = Math.max(1, Math.ceil(18 / w)), ys = Math.max(1, Math.ceil(14 / h));
    for (let x = 0; x < chart.columns; x++) if (x % xs === 0 || x === chart.columns - 1) ctx.fillText(String(x + 1), margin + (x + .5) * w, margin - 14);
    for (let y = 0; y < chart.rows; y++) if (y % ys === 0 || y === chart.rows - 1) ctx.fillText(String(rowNumberAt(chart, y)), margin - 18, margin + (y + .5) * h);
    if (cursor) { ctx.strokeStyle = '#0a64ca'; ctx.lineWidth = 2; ctx.strokeRect(margin + cursor[0] * w + 1, margin + cursor[1] * h + 1, w - 2, h - 2); }
}
function originalExample(locale: LoomLocale): LoomChart {
    const next = createLocalizedLoomChart(locale, 11, 31);
    next.title = LOOM_MESSAGES[locale].exampleTitle;
    for (let y = 0; y < next.rows; y++) for (let x = 0; x < next.columns; x++) {
        const d = Math.abs(x - 5) + Math.abs(y % 12 - 5);
        next.cells[y * next.columns + x] = next.palette[d < 3 ? 1 : d === 3 ? 2 : d === 5 ? 3 : 0].id;
    }
    next.cells[30 * 11] = next.palette[4].id;
    return next;
}

export default function LoomWorkspace({ locale = 'en' }: { locale?: LoomLocale } = {}) {
    const text = LOOM_MESSAGES[locale];
    const [chart, setChart] = useState(() => createLocalizedLoomChart(locale));
    const chartRef = useRef(chart), saved = useRef(chart);
    const history = useRef<{ past: LoomChart[]; future: LoomChart[] }>({ past: [], future: [] });
    const [historyState, setHistoryState] = useState({ undo: false, redo: false });
    const [dirty, setDirty] = useState(false), dirtyRef = useRef(false);
    const [columns, setColumns] = useState('11'), [rows, setRows] = useState('31'), [aspect, setAspect] = useState('1');
    const [corner, setCorner] = useState<LoomChart['startCorner']>('bottom-left'), [serpentine, setSerpentine] = useState(true);
    const [selected, setSelected] = useState('color-b'), [tool, setTool] = useState<Tool>('paint');
    const [replaceTarget, setReplaceTarget] = useState('color-a');
    const [zoom, setZoom] = useState<LoomZoom>('18'), [focused, setFocused] = useState(false);
    const [cursor, setCursor] = useState<Point>([0, 0]), cursorRef = useRef<Point>([0, 0]);
    const [sourceName, setSourceName] = useState(''), source = useRef<RgbaSource | null>(null);
    const [mode, setMode] = useState<'fit' | 'crop' | 'stretch'>('fit');
    const [paper, setPaper] = useState<'a4' | 'letter'>('a4');
    const [busy, setBusy] = useState(false), busyRef = useRef(false);
    const [status, setStatus] = useState({ text: text.ready, error: false });
    const canvas = useRef<HTMLCanvasElement>(null), viewport = useRef<HTMLDivElement>(null);
    const imageInput = useRef<HTMLInputElement>(null), projectInput = useRef<HTMLInputElement>(null);
    const stroke = useRef<Stroke | null>(null), mounted = useRef(false), allowLeave = useRef(false);
    const localeReady = useRef(false), localeRestore = useRef<LoomLocaleSnapshot | null | undefined>(undefined);
    const patternOpened = useRef(false);
    const largeLocaleRestore = useRef<Promise<LoomLocaleSnapshot | null> | null>(null);
    const [busyMessage, setBusyMessage] = useState(text.preparing);
    const [restoreFailed, setRestoreFailed] = useState(false);
    const downloadUrls = useRef(new Map<string, number>());
    const [viewportWidth, setViewportWidth] = useState(600);
    const scale = zoom === 'fit' ? Math.max(3, Math.min(28, (viewportWidth - margin * 2 - 30) / chart.columns / chart.cellAspect)) : Number(zoom);

    const sync = useCallback(() => {
        setHistoryState({ undo: history.current.past.length > 0, redo: history.current.future.length > 0 });
        dirtyRef.current = !chartsEqual(chartRef.current, saved.current); setDirty(dirtyRef.current);
    }, []);
    const publish = useCallback((next: LoomChart, resetSettings = false) => {
        chartRef.current = next; setChart(next);
        if (resetSettings) {
            setColumns(String(next.columns)); setRows(String(next.rows)); setAspect(String(next.cellAspect)); setCorner(next.startCorner); setSerpentine(next.serpentine);
        }
        setSelected(old => next.palette.some(c => c.id === old) ? old : next.palette[0].id);
        setReplaceTarget(old => next.palette.some(c => c.id === old) ? old : next.backgroundId);
        const point: Point = [Math.min(cursorRef.current[0], next.columns - 1), Math.min(cursorRef.current[1], next.rows - 1)];
        cursorRef.current = point; setCursor(point); sync();
    }, [sync]);
    const remember = useCallback((before: LoomChart, after: LoomChart) => {
        if (!chartsEqual(before, after)) {
            history.current.past.push(before); history.current.future = [];
            if (history.current.past.length > 40) history.current.past.shift();
        }
    }, []);
    const finishStroke = useCallback(() => {
        const current = stroke.current;
        if (!current) return;
        stroke.current = null;
        if ('before' in current) remember(current.before, chartRef.current);
        if (canvas.current?.hasPointerCapture(current.id)) canvas.current.releasePointerCapture(current.id);
        sync();
    }, [remember, sync]);
    const commit = useCallback((next: LoomChart, message: string, resetSettings = false) => {
        finishStroke(); const checked = validateChart(next); remember(chartRef.current, checked); publish(checked, resetSettings); setStatus({ text: message, error: false });
    }, [finishStroke, remember, publish]);
    const action = useCallback((fn: () => void) => {
        if (busyRef.current || !localeReady.current) return;
        finishStroke();
        try { fn(); } catch (e) { setStatus({ text: loomErrorMessage(e, locale, true), error: true }); }
    }, [finishStroke, locale]);
    const undo = useCallback((redo = false) => action(() => {
        const from = redo ? history.current.future : history.current.past, to = redo ? history.current.past : history.current.future;
        const previous = from.pop();
        if (previous) { to.push(chartRef.current); publish(previous, true); setStatus({ text: redo ? text.redone : text.undone, error: false }); }
    }), [action, publish, text.redone, text.undone]);

    useEffect(() => {
        const node = canvas.current;
        if (node) {
            try { draw(node, chart, scale, focused && tool !== 'pan' ? cursor : undefined); }
            catch (error) { setStatus({ text: loomErrorMessage(error, locale), error: true }); }
        }
    }, [chart, scale, cursor, focused, tool, locale]);
    useEffect(() => {
        const node = viewport.current;
        if (!node) return;
        const observer = new ResizeObserver(() => setViewportWidth(node.clientWidth)); observer.observe(node); return () => observer.disconnect();
    }, []);
    useEffect(() => {
        mounted.current = true;
        const urls = downloadUrls.current;
        const unload = (e: BeforeUnloadEvent) => { if ((dirtyRef.current || busyRef.current || !localeReady.current) && !allowLeave.current) { e.preventDefault(); e.returnValue = ''; } };
        const navigate = (e: MouseEvent) => {
            if ((!dirtyRef.current && !busyRef.current && localeReady.current) || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
            if (!(a instanceof HTMLAnchorElement) || a.hasAttribute('download') || a.target === '_blank') return;
            const url = new URL(a.href, location.href);
            if (a.hasAttribute('data-locale-navigation') && isLoomLocaleNavigation(location.href, url.href)) return;
            if (!['http:', 'https:'].includes(url.protocol) || (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search)) return;
            e.preventDefault(); e.stopImmediatePropagation();
            if (busyRef.current) { setStatus({ text: text.languageBusy, error: true }); return; }
            if (window.confirm(text.leave)) { allowLeave.current = true; window.location.assign(url.href); }
        };
        const keyboard = (e: globalThis.KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey) || e.altKey || (e.target instanceof Element && e.target.closest('input,select,textarea,[contenteditable]'))) return;
            if (e.key.toLowerCase() === 'z') { e.preventDefault(); undo(e.shiftKey); }
            if (e.key.toLowerCase() === 'y') { e.preventDefault(); undo(true); }
        };
        const resetLeave = () => { allowLeave.current = false; };
        window.addEventListener('beforeunload', unload); window.addEventListener('blur', finishStroke); window.addEventListener('pageshow', resetLeave);
        document.addEventListener('click', navigate, true); document.addEventListener('keydown', keyboard);
        return () => {
            mounted.current = false;
            window.removeEventListener('beforeunload', unload); window.removeEventListener('blur', finishStroke); window.removeEventListener('pageshow', resetLeave);
            document.removeEventListener('click', navigate, true); document.removeEventListener('keydown', keyboard);
            for (const [url, timer] of urls) { window.clearTimeout(timer); URL.revokeObjectURL(url); } urls.clear();
        };
    }, [finishStroke, undo, text]);

    const applyLocaleSnapshot = useCallback((snapshot: LoomLocaleSnapshot | null, allowPattern = true) => {
        if (snapshot) {
            patternOpened.current = true;
            chartRef.current = snapshot.chart; saved.current = snapshot.saved; history.current = snapshot.history;
            source.current = snapshot.source; cursorRef.current = snapshot.cursor;
            setChart(snapshot.chart); setColumns(snapshot.columns); setRows(snapshot.rows); setAspect(snapshot.aspect);
            setCorner(snapshot.corner); setSerpentine(snapshot.serpentine); setSelected(snapshot.selected);
            setReplaceTarget(snapshot.replaceTarget); setTool(snapshot.tool); setZoom(snapshot.zoom);
            setCursor(snapshot.cursor); setSourceName(snapshot.sourceName); setMode(snapshot.mode); setPaper(snapshot.paper);
            sync(); setStatus({ text: text.languageRestored, error: false });
        } else if (allowPattern && !patternOpened.current) {
            patternOpened.current = true;
            const id = new URL(window.location.href).searchParams.get('pattern');
            if (id && getLoomPattern(id)) {
                const next = getLoomPatternChart(id, locale);
                saved.current = next;
                history.current = { past: [], future: [] };
                publish(next, true);
                setSelected(next.palette[1]?.id ?? next.palette[0].id);
                setReplaceTarget(next.backgroundId);
                setStatus({ text: text.chartReady, error: false });
            }
        }
        localeReady.current = true;
    }, [sync, publish, locale, text.chartReady, text.languageRestored]);
    const protectLocaleRecovery = useCallback(() => {
        largeLocaleRestore.current = null;
        busyRef.current = false; setBusy(false); localeReady.current = false;
        setRestoreFailed(true); setStatus({ text: text.languageRestoreFailed, error: true });
    }, [text.languageRestoreFailed]);
    useEffect(() => {
        try {
            if (largeLocaleRestore.current || hasLargeLoomLocaleSnapshot(window.sessionStorage)) {
                busyRef.current = true; setBusyMessage(text.languageSaving); setBusy(true);
                largeLocaleRestore.current ??= consumeLargeLoomLocaleSnapshot(window.location.href, window.sessionStorage);
                void largeLocaleRestore.current.then(snapshot => {
                    if (!mounted.current) return;
                    localeRestore.current = snapshot;
                    busyRef.current = false; setBusy(false);
                    if (snapshot) { applyLocaleSnapshot(snapshot); setRestoreFailed(false); }
                    else {
                        try {
                            // Only a readable, absent pointer proves there is no
                            // saved transfer left. Temporary storage failures stay protected.
                            if (window.sessionStorage.getItem(LOOM_LOCALE_STORAGE_KEY)) {
                                protectLocaleRecovery();
                            } else {
                                applyLocaleSnapshot(null, false); setStatus({ text: text.languageRestoreUnavailable, error: true });
                            }
                        } catch { protectLocaleRecovery(); }
                    }
                }, () => {
                    if (!mounted.current) return;
                    protectLocaleRecovery();
                });
                return;
            }
            if (localeRestore.current === undefined) localeRestore.current = consumeLoomLocaleSnapshot(window.location.href, window.sessionStorage);
            if (!localeRestore.current && window.sessionStorage.getItem(LOOM_LOCALE_STORAGE_KEY)) {
                protectLocaleRecovery();
                return;
            }
        } catch {
            protectLocaleRecovery();
            return;
        }
        applyLocaleSnapshot(localeRestore.current ?? null);
    }, [applyLocaleSnapshot, protectLocaleRecovery, text.languageRestoreUnavailable, text.languageSaving]);
    const handleLocaleNavigation = useEffectEvent((event: Event) => {
        const detail = (event as CustomEvent<LocaleNavigationDetail>).detail;
        if (!detail?.href || !isLoomLocaleNavigation(window.location.href, detail.href)) return;
        if (!localeReady.current || busyRef.current) {
            event.preventDefault(); setStatus({ text: busyRef.current ? text.languageBusy : text.languageRestoreFailed, error: true }); return;
        }
        try {
            finishStroke();
            const snapshot: LoomLocaleSnapshot = {
                chart: chartRef.current, saved: saved.current, history: history.current,
                columns, rows, aspect, corner, serpentine, selected, replaceTarget, tool, zoom,
                cursor: cursorRef.current, source: source.current, sourceName, mode, paper,
            };
            if (saveLoomLocaleSnapshot(snapshot, detail.href, window.sessionStorage)) { allowLeave.current = true; return; }
            event.preventDefault();
            void task(async () => {
                const stored = await saveLargeLoomLocaleSnapshot(snapshot, detail.href, window.sessionStorage);
                if (!mounted.current) return;
                if (!stored) { setStatus({ text: text.languageFailed, error: true }); return; }
                allowLeave.current = true; window.location.assign(detail.href);
            }, text.languageSaving);
            return;
        } catch { /* Storage can be blocked before its methods are available. */ }
        event.preventDefault(); setStatus({ text: text.languageFailed, error: true });
    });
    useEffect(() => {
        const navigate = (event: Event) => handleLocaleNavigation(event);
        window.addEventListener(LOCALE_NAVIGATION_EVENT, navigate);
        return () => window.removeEventListener(LOCALE_NAVIGATION_EVENT, navigate);
    }, []);

    function point(event: PointerEvent<HTMLCanvasElement>): Point | null {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.floor(((event.clientX - rect.left) * event.currentTarget.width / rect.width - margin) / (scale * chartRef.current.cellAspect));
        const y = Math.floor(((event.clientY - rect.top) * event.currentTarget.height / rect.height - margin) / scale);
        return x >= 0 && x < chartRef.current.columns && y >= 0 && y < chartRef.current.rows ? [x, y] : null;
    }
    function start(event: PointerEvent<HTMLCanvasElement>) {
        if (busyRef.current || !localeReady.current || event.button !== 0 || stroke.current) return;
        if (tool === 'pan' && viewport.current) {
            stroke.current = { id: event.pointerId, pan: [event.clientX, event.clientY], scroll: [viewport.current.scrollLeft, viewport.current.scrollTop] };
        } else {
            const p = point(event); if (!p) return;
            const id = tool === 'background' ? chartRef.current.backgroundId : selected;
            stroke.current = { id: event.pointerId, before: chartRef.current, last: p, color: id };
            const next = paintLine(chartRef.current, p, p, id); chartRef.current = next; setChart(next); cursorRef.current = p; setCursor(p);
        }
        event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus(); event.preventDefault();
    }
    function move(event: PointerEvent<HTMLCanvasElement>) {
        const current = stroke.current; if (!current || current.id !== event.pointerId) return;
        if ('pan' in current && viewport.current) {
            viewport.current.scrollLeft = current.scroll[0] + current.pan[0] - event.clientX;
            viewport.current.scrollTop = current.scroll[1] + current.pan[1] - event.clientY;
        } else if ('before' in current) {
            const p = point(event); if (!p) return;
            const next = paintLine(chartRef.current, current.last, p, current.color); current.last = p;
            chartRef.current = next; setChart(next); cursorRef.current = p; setCursor(p);
        }
    }
    function keyboard(event: KeyboardEvent<HTMLCanvasElement>) {
        if (busyRef.current || !localeReady.current || event.ctrlKey || event.metaKey || event.altKey) return;
        const delta = moves[event.key];
        if (delta) {
            event.preventDefault();
            const p: Point = [Math.min(chart.columns - 1, Math.max(0, cursorRef.current[0] + delta[0])), Math.min(chart.rows - 1, Math.max(0, cursorRef.current[1] + delta[1]))];
            cursorRef.current = p; setCursor(p);
            if (viewport.current && canvas.current) {
                const cb = canvas.current.getBoundingClientRect(), vb = viewport.current.getBoundingClientRect();
                const px = cb.left + margin + (p[0] + .5) * scale * chart.cellAspect, py = cb.top + margin + (p[1] + .5) * scale;
                if (px < vb.left + 30 || px > vb.right - 30) viewport.current.scrollLeft += px - vb.left - viewport.current.clientWidth / 2;
                if (py < vb.top + 30 || py > vb.bottom - 30) viewport.current.scrollTop += py - vb.top - viewport.current.clientHeight / 2;
            }
        } else if (['Enter', ' ', 'Delete', 'Backspace'].includes(event.key) && tool !== 'pan') {
            event.preventDefault(); action(() => commit(paintLine(chartRef.current, cursorRef.current, cursorRef.current, ['Delete', 'Backspace'].includes(event.key) || tool === 'background' ? chartRef.current.backgroundId : selected), text.beadChanged));
        }
    }
    function applySettings() {
        const c = Number(columns), r = Number(rows), a = Number(aspect);
        const current = chartRef.current;
        const next = validateChart({ ...current, columns: c, rows: r, cellAspect: a, startCorner: corner, serpentine, cells: Array.from({ length: Number.isInteger(c) && Number.isInteger(r) && c > 0 && r > 0 && c * r <= LIMITS.maxCells ? c * r : 0 }, (_, i) => {
            const x = i % c, y = Math.floor(i / c); return x < current.columns && y < current.rows ? current.cells[y * current.columns + x] : current.backgroundId;
        }) });
        commit(next, text.settingsApplied, true);
    }
    function reset(next: LoomChart) {
        if (dirtyRef.current && !window.confirm(text.replaceChart)) return;
        commit(next, text.chartReady, true);
    }
    async function task(work: () => Promise<void>, message = text.preparing) {
        if (busyRef.current || !localeReady.current) return;
        finishStroke(); busyRef.current = true; setBusyMessage(message); setBusy(true);
        try { await work(); } catch (e) { if (mounted.current) setStatus({ text: loomErrorMessage(e, locale), error: true }); }
        finally { busyRef.current = false; if (mounted.current) setBusy(false); }
    }
    async function importImage(file: File) {
        await task(async () => {
            if (file.size > 8388608) throw new Error('Choose an image smaller than 8 MB.');
            const data = await file.arrayBuffer(); inspectImage(data, file.type);
            const bitmap = await createImageBitmap(file);
            try {
                if (bitmap.width > 2048 || bitmap.height > 2048 || bitmap.width * bitmap.height > 4194304) throw new Error('Choose an image up to 2048 pixels on each side.');
                const temp = document.createElement('canvas'); temp.width = bitmap.width; temp.height = bitmap.height;
                const ctx = temp.getContext('2d'); if (!ctx) throw new Error('Image decoding is unavailable in this browser.');
                ctx.drawImage(bitmap, 0, 0); const pixels = ctx.getImageData(0, 0, temp.width, temp.height).data;
                if (mounted.current) { source.current = { width: bitmap.width, height: bitmap.height, pixels }; setSourceName(file.name); setStatus({ text: text.imageLoaded, error: false }); }
                temp.width = temp.height = 0;
            } finally { bitmap.close(); }
        });
    }
    async function importProject(file: File) {
        await task(async () => {
            if (file.size > LIMITS.maxProjectBytes) throw new Error('Choose a bead loom project smaller than 1 MB.');
            const next = parseProject(await file.text());
            if (!mounted.current || (dirtyRef.current && !window.confirm(text.replaceProject))) return;
            saved.current = next; history.current = { past: [], future: [] }; source.current = null; setSourceName(''); publish(next, true);
            setStatus({ text: text.projectOpened, error: false });
        });
    }
    function download(blob: Blob, name: string) {
        const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        downloadUrls.current.set(url, window.setTimeout(() => { URL.revokeObjectURL(url); downloadUrls.current.delete(url); }, 60000));
    }
    async function exportFile(kind: 'project' | 'pdf' | 'png') {
        await task(async () => {
            const snapshot = validateChart(chartRef.current), base = snapshot.title.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 70) || 'bead-loom-chart';
            let blob: Blob;
            if (kind === 'project') blob = new Blob([serializeProject(snapshot)], { type: 'application/json' });
            else {
                const exporter = await import('@/lib/bead-loom/export');
                blob = kind === 'pdf' ? new Blob([await exporter.exportLoomPdf(snapshot, paper, locale)], { type: 'application/pdf' }) : await exporter.exportLoomPng(snapshot, locale);
            }
            if (!mounted.current) return;
            download(blob, `${base}${kind === 'project' ? '.bead-loom.json' : kind === 'pdf' ? `-${paper}.pdf` : '-chart.png'}`);
            trackBeadLoomExport({ format: kind });
            if (kind === 'project') { saved.current = snapshot; sync(); }
            setStatus({ text: text.exported(kind), error: false });
        });
    }
    function editColor(id: string, key: 'name' | 'code' | 'hex', value: string) {
        action(() => commit({ ...chartRef.current, palette: chartRef.current.palette.map(c => c.id === id ? { ...c, [key]: value } : c) }, text.paletteUpdated));
    }
    const counts = getCounts(chart), instructions = getRowInstructions(chart);
    const usedColors = counts.filter(color => color.count).length;
    const selectedColor = chart.palette.find(c => c.id === selected) ?? chart.palette[0];
    const activeSymbol = chart.palette.find(c => c.id === chart.cells[cursor[1] * chart.columns + cursor[0]])?.symbol;
    const settingsPending = columns !== String(chart.columns) || rows !== String(chart.rows) || aspect !== String(chart.cellAspect) || corner !== chart.startCorner || serpentine !== chart.serpentine;

    return <div className={styles.workspace} lang={locale} aria-label={text.workspace} aria-busy={busy}>
        <p role="status" className={`${styles.status} ${status.error ? styles.error : ''}`}>{busy ? busyMessage : status.text}</p>
        {restoreFailed && <button onClick={() => { allowLeave.current = true; window.location.reload(); }}>{text.retryLanguageRestore}</button>}
        <fieldset disabled={busy || restoreFailed}>
            <div className={styles.layout}>
                <aside className={styles.settings} aria-label={text.settings}>
                    <section className={styles.panel} aria-labelledby="loom-size">
                        <h2 id="loom-size">{text.setChart}</h2>
                        <div className={styles.fields}>
                            <div className={styles.pair}>
                                <label>{text.columns}<input id="loom-columns" type="number" min="1" max="100" value={columns} onChange={e => setColumns(e.target.value)} /></label>
                                <label>{text.rows}<input id="loom-rows" type="number" min="1" max="400" value={rows} onChange={e => setRows(e.target.value)} /></label>
                            </div>
                            <label>{text.aspect}<input id="loom-aspect" type="number" min="0.5" max="2" step="0.05" value={aspect} onChange={e => setAspect(e.target.value)} /></label>
                            <p className={styles.hint}>{text.aspectHelp}</p>
                            <label>{text.startAt}<select id="loom-corner" value={corner} onChange={e => setCorner(e.target.value as LoomChart['startCorner'])}>
                                {Object.entries(text.corners).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select></label>
                            <label className={styles.check}><input id="loom-serpentine" type="checkbox" checked={serpentine} onChange={e => setSerpentine(e.target.checked)} />{text.alternate}</label>
                            <button className={styles.primary} onClick={() => action(applySettings)}>{text.apply}</button>
                            {settingsPending && <p className={styles.hint}>{text.pending}</p>}
                            <button onClick={() => action(() => reset({ ...chartRef.current, cells: Array(chartRef.current.columns * chartRef.current.rows).fill(chartRef.current.backgroundId) }))}>{text.clear}</button>
                            <button onClick={() => action(() => reset(originalExample(locale)))}>{text.example}</button>
                        </div>
                    </section>
                    <section className={styles.panel} aria-labelledby="loom-image">
                        <h2 id="loom-image">{text.imageHeading}</h2>
                        <div className={styles.fields}>
                            <button onClick={() => imageInput.current?.click()}>{text.chooseImage}</button>
                            <input id="loom-image-file" ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" hidden aria-label={text.sourceImage} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importImage(f); }} />
                            <p className={styles.hint}>{sourceName || text.imageHelp}</p>
                            <label>{text.imageFit}<select id="loom-mode" value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="fit">{text.fit}</option><option value="crop">{text.crop}</option><option value="stretch">{text.stretch}</option></select></label>
                            <button disabled={!sourceName || settingsPending} onClick={() => action(() => { if (source.current) commit(convertImage(source.current, chartRef.current, mode), text.imageConverted); })}>{text.convert}</button>
                            <p className={styles.hint}>{text.conversionHelp}</p>
                            <button onClick={() => projectInput.current?.click()}>{text.openProject}</button>
                            <input id="loom-project-file" ref={projectInput} type="file" accept=".json,.bead-loom.json,application/json" hidden aria-label={text.projectFile} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importProject(f); }} />
                        </div>
                    </section>
                </aside>
                <div className={styles.draw}>
                    <section className={styles.panel} aria-labelledby="loom-draw">
                        <div className={styles.heading}><h2 id="loom-draw">{text.drawHeading}</h2><p>{text.summary(chart.columns, chart.rows, chart.cells.length, usedColors)}</p></div>
                        <label>{text.chartName}<input id="loom-title" value={chart.title} maxLength={80} onChange={e => action(() => commit({ ...chartRef.current, title: e.target.value }, text.nameUpdated))} /></label>
                        <div className={`${styles.toolbar} ${styles.topSpace}`}>
                            <button aria-pressed={tool === 'paint'} onClick={() => { finishStroke(); setTool('paint'); }}>{text.paint}</button>
                            <button aria-pressed={tool === 'background'} onClick={() => { finishStroke(); setTool('background'); }}>{text.background}</button>
                            <button aria-pressed={tool === 'pan'} onClick={() => { finishStroke(); setTool('pan'); }}>{text.pan}</button>
                            <button aria-label={text.undo} title={text.undo} disabled={!historyState.undo} onClick={() => undo()}><Undo2 size={18} aria-hidden="true" /></button>
                            <button aria-label={text.redo} title={text.redo} disabled={!historyState.redo} onClick={() => undo(true)}><Redo2 size={18} aria-hidden="true" /></button>
                        </div>
                        <div className={styles.toolbar}>
                            <label className={styles.paint}>{text.paintColor}<select id="loom-selected" value={selectedColor.id} onChange={e => setSelected(e.target.value)}>{chart.palette.map(c => <option key={c.id} value={c.id}>{c.symbol} — {c.name || text.unnamed}{c.code ? ` (${c.code})` : ''}</option>)}</select></label>
                            <label>{text.zoom}<select id="loom-zoom" value={zoom} onChange={e => { finishStroke(); setZoom(e.target.value as LoomZoom); }}><option value="fit">{text.fitWidth}</option><option value="10">{text.small}</option><option value="18">{text.medium}</option><option value="28">{text.large}</option><option value="40">{text.extraLarge}</option></select></label>
                        </div>
                        <div ref={viewport} className={styles.viewport} role="region" aria-label={text.scrollable} tabIndex={0}><div className={styles.stage}>
                            <canvas ref={canvas} className={styles.canvas} role="img" aria-label={text.canvasAria(chart.columns, chart.rows, rowNumberAt(chart, cursor[1]), cursor[0] + 1, activeSymbol ?? '')} tabIndex={busy || restoreFailed ? -1 : 0} onFocus={() => setFocused(true)} onBlur={() => { finishStroke(); setFocused(false); }} onKeyDown={keyboard} onPointerDown={start} onPointerMove={move} onPointerUp={finishStroke} onPointerCancel={finishStroke} onLostPointerCapture={finishStroke} />
                        </div></div>
                        <p className={styles.hint}>{text.reading(chart.startCorner, chart.serpentine)}</p>
                        <p className={styles.hint}>{text.cursor(rowNumberAt(chart, cursor[1]), cursor[0] + 1, activeSymbol ?? '')} {dirty ? text.dirty : text.saved}</p>
                    </section>
                    <section className={styles.panel} aria-labelledby="loom-palette">
                        <h2 id="loom-palette">{text.paletteHeading}</h2>
                        <p className={styles.hint}>{text.paletteHelp}</p>
                        <div className={`${styles.tableWrap} ${styles.topSpace}`}><table className={`${styles.table} ${styles.paletteTable}`}>
                            <thead><tr><th>{text.letter}</th><th>{text.screenColor}</th><th>{text.beadName}</th><th>{text.code}</th><th>{text.count}</th></tr></thead>
                            <tbody>{counts.map(c => <tr key={c.id}><th scope="row">{c.symbol}</th><td><input aria-label={text.colorAria(c.symbol)} type="color" value={c.hex} onInput={e => editColor(c.id, 'hex', e.currentTarget.value)} onChange={e => editColor(c.id, 'hex', e.target.value)} /></td><td><input aria-label={text.nameAria(c.symbol)} value={c.name} maxLength={60} onChange={e => editColor(c.id, 'name', e.target.value)} /></td><td><input aria-label={text.codeAria(c.symbol)} value={c.code} maxLength={40} onChange={e => editColor(c.id, 'code', e.target.value)} /></td><td>{c.count}</td></tr>)}</tbody>
                        </table></div>
                        <div className={`${styles.buttons} ${styles.topSpace}`}><button disabled={chart.palette.length >= 26} onClick={() => action(() => {
                            const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(s => !chartRef.current.palette.some(c => c.symbol === s))!;
                            const id = crypto.randomUUID();
                            commit({ ...chartRef.current, palette: [...chartRef.current.palette, { id, symbol: letter, name: text.newColor, code: '', hex: '#6688aa' }] }, text.colorAdded(letter)); setSelected(id);
                        })}>{text.addColor(chart.palette.length)}</button></div>
                        <div className={`${styles.pair} ${styles.topSpace}`}>
                            <label>{text.background}<select id="loom-background" value={chart.backgroundId} onChange={e => action(() => commit({ ...chartRef.current, backgroundId: e.target.value }, text.backgroundSelected))}>{chart.palette.map(c => <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>)}</select></label>
                            <label>{text.replaceTarget}<select id="loom-replace-target" value={replaceTarget} onChange={e => setReplaceTarget(e.target.value)}>{chart.palette.map(c => <option key={c.id} value={c.id}>{c.symbol} — {c.name}</option>)}</select></label>
                        </div>
                        <div className={`${styles.buttons} ${styles.topSpace}`}>
                            <button disabled={selectedColor.id === replaceTarget} onClick={() => action(() => commit(replaceColor(chartRef.current, selectedColor.id, replaceTarget), text.replaced(selectedColor.symbol)))}>{text.replaceAll(selectedColor.symbol)}</button>
                            <button disabled={chart.palette.length <= 1 || selectedColor.id === chart.backgroundId || chart.cells.includes(selectedColor.id)} onClick={() => action(() => commit({ ...chartRef.current, palette: chartRef.current.palette.filter(c => c.id !== selectedColor.id) }, text.removed(selectedColor.symbol)))}>{text.removeUnused(selectedColor.symbol)}</button>
                        </div>
                        <p className={styles.hint}>{text.removeHelp}</p>
                    </section>
                    <section className={styles.panel} aria-labelledby="loom-save">
                        <h2 id="loom-save">{text.saveHeading}</h2>
                        <div className={styles.export}>
                            <label>{text.paper}<select id="loom-paper" value={paper} onChange={e => setPaper(e.target.value as typeof paper)}><option value="a4">A4</option><option value="letter">{text.letterPaper}</option></select></label>
                            <button className={styles.primary} onClick={() => void exportFile('pdf')}>{text.pdf}</button>
                            <button onClick={() => void exportFile('png')}>{text.png}</button>
                            <button onClick={() => void exportFile('project')}>{text.saveProject}</button>
                        </div>
                        <p className={styles.hint}>{text.exportHelp}</p>
                        <details className={styles.details}><summary>{text.rowInstructions(chart.rows)}</summary>
                            <p className={styles.hint}>{text.rowHelp}</p>
                            <div className={`${styles.rowScroll} ${styles.topSpace}`}><table className={styles.table}><thead><tr><th>{text.row}</th><th>{text.direction}</th><th>{text.sequence}</th></tr></thead><tbody>{instructions.map(row => <tr key={row.rowNumber}><th scope="row">{row.rowNumber}</th><td>{row.direction === 'left-to-right' ? text.leftToRight : text.rightToLeft}</td><td className={styles.rowSequence}>{row.runs.map(run => `${run.symbol} × ${run.count}`).join(' · ')}</td></tr>)}</tbody></table></div>
                        </details>
                    </section>
                </div>
            </div>
        </fieldset>
    </div>;
}

'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { qrBeadCopy } from '@/lib/qr-beads/copy';
import { QrPatternError, QR_MAX_UTF8_BYTES } from '@/lib/qr-beads/core';
import { selectQrBrandColors } from '@/lib/qr-beads/brand-colors';
import { buildQrProject, defaultQrState, parseQrProject, serializeQrProject } from '@/lib/qr-beads/project';
import { acknowledgeQrLocaleSnapshot, discardQrLocaleSnapshot, isQrLocaleNavigation, readQrLocaleSnapshot, saveQrLocaleSnapshot } from '@/lib/qr-beads/locale-navigation';
import type { QrColor, QrPalette, QrProjectResult, QrState } from '@/lib/qr-beads/types';
import { downloadBlob } from '@/lib/core/printer/download';
import { createToolGenerationTracker, trackToolEvent } from '@/lib/analytics';
import { LOCALE_NAVIGATION_EVENT, localeRoutes, type LocaleNavigationDetail } from '@/lib/i18n/routes';
import type { SiteLocale } from '@/lib/i18n/locales';
import styles from './QrWorkspace.module.css';

const format = (text: string, values: Record<string, number | string>) => text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
const colorCss = (color: QrColor) => `rgb(${color.r},${color.g},${color.b})`;

export default function QrWorkspace({ locale, palettes }: { locale: SiteLocale; palettes: QrPalette[] }) {
    const copy = qrBeadCopy[locale], id = useId();
    const [state, setState] = useState<QrState>(() => defaultQrState(palettes));
    const [saved, setSaved] = useState(true);
    const [recovery, setRecovery] = useState<'pending' | 'failed' | 'ready'>('pending');
    const ready = recovery === 'ready';
    const [busy, setBusy] = useState<'check' | 'file' | null>(null);
    const [notice, setNotice] = useState('');
    const [checked, setChecked] = useState<'passed' | 'failed' | 'error' | null>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const inputFile = useRef<HTMLInputElement>(null);
    const leaving = useRef(false), mounted = useRef(false);
    const operation = useRef<AbortController | null>(null);
    const generation = useRef(createToolGenerationTracker('qr_beads'));
    const live = useRef({ state, saved, ready, busy: false });
    useEffect(() => { live.current = { state, saved, ready, busy: busy !== null }; }, [state, saved, ready, busy]);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; operation.current?.abort(); operation.current = null; };
    }, []);
    const generated = useMemo<{ result: QrProjectResult | null; error: unknown }>(() => {
        try { return { result: buildQrProject(state, palettes), error: null }; }
        catch (error) { return { result: null, error }; }
    }, [state, palettes]);
    const { result } = generated;
    let errorMessage = '';
    if (generated.error instanceof QrPatternError) {
        errorMessage = ({ EMPTY: copy.emptyText, TOO_LONG: copy.tooLong, TOO_LARGE: copy.tooLarge, INVALID_OPTIONS: copy.invalidOptions, INVALID_TEXT: copy.invalidText })[generated.error.code];
    } else if (generated.error) errorMessage = generated.error instanceof Error && generated.error.message === 'INVALID_COLOR' ? copy.invalidColor : copy.invalidOptions;

    const recover = useCallback(() => {
        if (live.current.ready || live.current.busy) return;
        live.current.ready = false;
        setRecovery('pending'); setNotice('');
        try {
            const storage = window.sessionStorage;
            const read = readQrLocaleSnapshot(window.location.href, storage, palettes);
            if (read) {
                live.current = { ...live.current, ...read.snapshot };
                setState(read.snapshot.state); setSaved(read.snapshot.saved); setChecked(null);
                acknowledgeQrLocaleSnapshot(read, storage);
            }
            live.current.ready = true; leaving.current = false; setRecovery('ready');
        } catch { live.current.ready = false; setRecovery('failed'); }
    }, [palettes]);

    function discardRecovery() {
        if (live.current.ready || live.current.busy) return;
        try {
            if (!discardQrLocaleSnapshot(window.sessionStorage)) throw new Error('DISCARD_NOT_CONFIRMED');
            const fresh = defaultQrState(palettes);
            live.current = { state: fresh, saved: true, ready: true, busy: false };
            leaving.current = false; setState(fresh); setSaved(true); setChecked(null); setRecovery('ready'); setNotice('');
        } catch { setNotice(copy.discardFailed); }
    }

    useEffect(() => {
        let active = true;
        queueMicrotask(() => { if (active) recover(); });
        return () => { active = false; };
    }, [recover]);

    useEffect(() => {
        const language = (event: Event) => {
            const e = event as CustomEvent<LocaleNavigationDetail>;
            if (e.defaultPrevented || !isQrLocaleNavigation(window.location.href, e.detail.href)) return;
            try {
                if (!live.current.ready || live.current.busy || !saveQrLocaleSnapshot({ state: live.current.state, saved: live.current.saved }, e.detail.href, window.sessionStorage, palettes)) {
                    e.preventDefault(); setNotice(copy.transferFailed); return;
                }
                leaving.current = true;
            } catch { e.preventDefault(); setNotice(copy.transferFailed); }
        };
        const protect = (event: BeforeUnloadEvent) => {
            if (!live.current.saved && !leaving.current) { event.preventDefault(); event.returnValue = ''; }
        };
        const resume = () => { leaving.current = false; };
        window.addEventListener(LOCALE_NAVIGATION_EVENT, language);
        window.addEventListener('beforeunload', protect);
        window.addEventListener('pageshow', resume);
        return () => {
            window.removeEventListener(LOCALE_NAVIGATION_EVENT, language);
            window.removeEventListener('beforeunload', protect);
            window.removeEventListener('pageshow', resume);
        };
    }, [palettes, copy.transferFailed]);

    useEffect(() => {
        const element = canvas.current;
        if (!ready || !result || !element) return;
        const { grid } = result;
        element.width = grid.width; element.height = grid.height;
        const context = element.getContext('2d');
        if (!context) return;
        context.putImageData(new ImageData(new Uint8ClampedArray(grid.pixels), grid.width, grid.height), 0, 0);
    }, [ready, result]);

    function change(patch: Partial<QrState>) {
        if (!live.current.ready || live.current.busy) return;
        const next = { ...live.current.state, ...patch };
        live.current = { ...live.current, state: next, saved: false };
        leaving.current = false; setState(next); setSaved(false); setNotice(''); setChecked(null);
        if (!generation.current.recorded && Object.keys(patch).some(key => key !== 'paper')) {
            try { buildQrProject(next, palettes); generation.current.record(); }
            catch { /* Invalid or incomplete input must not count as generation. */ }
        }
    }
    function changeBrand(value: string) {
        if (!live.current.ready || live.current.busy) return;
        const target = palettes.find(p => p.id === value);
        if (!target) return;
        try { change(selectQrBrandColors(live.current.state, palettes, target.id)); }
        catch { setNotice(copy.invalidColor); }
    }
    function begin(kind: 'check' | 'file') {
        if (!mounted.current || !live.current.ready || live.current.busy) return null;
        const task = new AbortController(); operation.current = task;
        live.current.busy = true; setBusy(kind); setNotice('');
        return task;
    }
    function current(task: AbortController) { return mounted.current && operation.current === task && !task.signal.aborted; }
    function finish(task: AbortController) {
        if (!mounted.current || operation.current !== task) return;
        operation.current = null; live.current.busy = false; setBusy(null);
    }
    function cancel() {
        const task = operation.current;
        if (!task) return;
        task.abort(); operation.current = null; live.current.busy = false; setBusy(null); setNotice(copy.cancelled);
    }
    async function checkPng() {
        if (!live.current.ready || live.current.busy) return;
        let snapshot: QrProjectResult;
        try { snapshot = buildQrProject(live.current.state, palettes); } catch { return; }
        const task = begin('check'); if (!task) return;
        setChecked(null);
        try {
            const exporter = await import('@/lib/qr-beads/export'); task.signal.throwIfAborted();
            const blob = await exporter.createQrPng(snapshot, task.signal); task.signal.throwIfAborted();
            const passed = await exporter.verifyQrPng(blob, snapshot.state.text, task.signal);
            if (current(task)) setChecked(passed ? 'passed' : 'failed');
        } catch { if (current(task)) setChecked('error'); }
        finally { finish(task); }
    }
    async function exportFile(kind: 'png' | 'chart' | 'pdf' | 'project') {
        if (!live.current.ready || live.current.busy) return;
        const settings = { ...live.current.state };
        let snapshot: QrProjectResult;
        try { snapshot = buildQrProject(settings, palettes); } catch { return; }
        const task = begin('file'); if (!task) return;
        try {
            if (kind === 'project') {
                const raw = serializeQrProject(settings, palettes);
                task.signal.throwIfAborted();
                downloadBlob(new Blob([raw], { type: 'application/json' }), `qr-beads-${snapshot.grid.width}x${snapshot.grid.height}.bead-pattern.json`);
                if (current(task)) { live.current.saved = true; setSaved(true); setNotice(copy.saved); }
            } else {
                const exporter = await import('@/lib/qr-beads/export'); task.signal.throwIfAborted();
                if (kind === 'png') await exporter.exportQrPng(snapshot, task.signal);
                else if (kind === 'chart') await exporter.exportQrChartPng(snapshot, task.signal);
                else await exporter.exportQrPdf(snapshot, settings, locale, task.signal);
            }
            trackToolEvent({ name: 'tool_export', tool: 'qr_beads', format: kind === 'chart' ? 'grid_png' : kind });
        } catch { if (current(task)) setNotice(copy.exportFailed); }
        finally { finish(task); }
    }
    async function loadFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file) return;
        const task = begin('file'); if (!task) return;
        try {
            if (file.size > 2 * 1024 * 1024) throw new Error('INVALID_PROJECT');
            const raw = await file.text(); task.signal.throwIfAborted();
            const restored = parseQrProject(raw, palettes);
            if (!current(task)) return;
            if (!live.current.saved && !window.confirm(copy.replaceProject)) return;
            if (!current(task)) return;
            live.current = { state: restored, saved: true, ready: true, busy: true };
            leaving.current = false; setState(restored); setSaved(true); setChecked(null); setNotice(copy.loaded);
            generation.current.reset();
        } catch { if (current(task)) setNotice(copy.invalidProject); }
        finally { finish(task); }
    }
    const selected = palettes.find(p => p.id === state.paletteId);
    const byteCount = new TextEncoder().encode(state.text).byteLength;
    const locked = !ready || busy !== null;
    return <section className={styles.workspace} aria-label={copy.heading} aria-busy={busy !== null}>
        <fieldset className={styles.settings} disabled={locked}>
            <legend className="sr-only">{copy.heading}</legend>
            <label htmlFor={`${id}-text`}>{copy.text}</label>
            <textarea id={`${id}-text`} rows={4} maxLength={4096} value={state.text} onChange={e => change({ text: e.target.value })} aria-describedby={`${id}-text-help`} spellCheck={false} autoComplete="off" />
            <p id={`${id}-text-help`} className={styles.hint}>{copy.textHelp} <span className={styles.byteCount}>{byteCount} / {QR_MAX_UTF8_BYTES}</span></p>
            <div className={styles.options}>
                <label>{copy.ecc}<select value={state.errorCorrection} onChange={e => change({ errorCorrection: e.target.value as QrState['errorCorrection'] })}>{(['L', 'M', 'Q', 'H'] as const).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
                <label>{copy.scale}<select value={state.beadsPerModule} onChange={e => change({ beadsPerModule: Number(e.target.value) as QrState['beadsPerModule'] })}>{[1, 2, 3].map(value => <option key={value} value={value}>{format(copy.scaleOption, { count: value })}</option>)}</select></label>
            </div>
            <p className={styles.hint}>{copy.eccHelp}</p>
            <label>{copy.brand}<select value={state.paletteId} onChange={e => changeBrand(e.target.value)}>{palettes.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
            <label>{copy.foreground}<select value={state.foregroundRef} onChange={e => change({ foregroundRef: e.target.value })}>{selected?.colors.map(c => <option key={c.ref} value={c.ref}>{c.name} · {c.ref}</option>)}</select></label>
            <label>{copy.background}<select value={state.backgroundRef} onChange={e => change({ backgroundRef: e.target.value })}>{selected?.colors.map(c => <option key={c.ref} value={c.ref}>{c.name} · {c.ref}</option>)}</select></label>
            <label>{copy.paper}<select value={state.paper} onChange={e => change({ paper: e.target.value as QrState['paper'] })}><option value="a4">A4</option><option value="letter">US Letter</option></select></label>
        </fieldset>
        <div className={styles.output}>
            <div className={styles.outputHeader}><h2>{copy.preview}</h2><button type="button" disabled={locked} onClick={() => { if (live.current.ready && !live.current.busy) inputFile.current?.click(); }}>{copy.openProject}</button></div>
            <input ref={inputFile} type="file" accept=".json,.bead-pattern.json,application/json" onChange={loadFile} hidden />
            {recovery === 'pending' && <p role="status" className={styles.hint}>{copy.restoring}</p>}
            {recovery === 'failed' && <div role="alert" className={styles.error}><p>{copy.restoreFailed}</p><div className={styles.actions}><button type="button" onClick={recover}>{copy.retryRestore}</button><button type="button" onClick={discardRecovery}>{copy.discardRestore}</button></div></div>}
            {ready && errorMessage && <p role="alert" className={styles.error}>{errorMessage}</p>}
            {ready && result && <>
                <div className={styles.canvasWrap}><canvas ref={canvas} role="img" aria-label={`${copy.previewLabel}: ${result.grid.width} × ${result.grid.height}`} /></div>
                <div className={styles.summary}>
                    <p>{format(copy.dimensions, { width: result.grid.width, height: result.grid.height })}</p>
                    <p>{format(copy.modules, { count: result.pattern.modules })}</p>
                    <p>{format(copy.beadCount, { count: result.usage.reduce((sum, item) => sum + item.count, 0) })}</p>
                    <p>{format(copy.boardCount, { wide: result.draft.boardWidth, tall: result.draft.boardHeight, size: result.palette.boardSize })}</p>
                    <p>{format(copy.physicalSize, { width: result.grid.width * 5, height: result.grid.height * 5 })}</p>
                    <p>{format(copy.pdfPages, { count: 1 + result.draft.boardWidth * result.draft.boardHeight, boards: result.draft.boardWidth * result.draft.boardHeight })}</p>
                </div>
                <p className={styles.hint}>{copy.quiet}</p>
                <ul className={styles.colors} aria-label={copy.materials}>{result.usage.map(item => <li key={item.color.ref}><span className={styles.swatch} style={{ backgroundColor: colorCss(item.color) }} aria-hidden="true" /><span>{item.color.name}<small>{item.color.ref}</small></span><strong>{item.count}</strong></li>)}</ul>
            </>}
            <div className={styles.checkRow}><button type="button" disabled={!result || locked} onClick={() => void checkPng()}>{copy.check}</button>{checked && <p role="status" className={checked === 'passed' ? styles.hint : styles.error}>{checked === 'passed' ? copy.checkPassed : checked === 'failed' ? copy.checkFailed : copy.checkError}</p>}</div>
            <div className={styles.actions}>
                <button type="button" className={styles.primary} disabled={!result || locked} onClick={() => void exportFile('pdf')}>{copy.downloadPdf}</button>
                <button type="button" disabled={!result || locked} onClick={() => void exportFile('png')}>{copy.downloadPng}</button>
                <button type="button" disabled={!result || locked} onClick={() => void exportFile('chart')}>{copy.downloadChart}</button>
                <button type="button" disabled={!result || locked} onClick={() => void exportFile('project')}>{copy.saveProject}</button>
            </div>
            {busy && <div className={styles.busy}><p role="status">{busy === 'check' ? copy.checking : copy.working}</p><button type="button" onClick={cancel}>{copy.cancel}</button></div>}
            {notice && <p role="status" className={styles.hint}>{notice}</p>}
            <p className={styles.hint}>{saved ? copy.savedState : copy.unsavedState}</p>
            <p className={styles.hint}>{copy.editorHelp} <a href={localeRoutes[locale].editor} className="text-link">{copy.editorLink}</a></p>
        </div>
    </section>;
}

'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { beadLetterCopy } from '@/lib/bead-letters/copy';
import { LetterPatternError } from '@/lib/bead-letters/core';
import { selectLetterBrandColors } from '@/lib/bead-letters/brand-colors';
import { buildLetterProject, defaultLetterState, parseLetterProject, serializeLetterProject, type LetterProjectResult } from '@/lib/bead-letters/project';
import { acknowledgeLetterLocaleSnapshot, discardLetterLocaleSnapshot, isLetterLocaleNavigation, readLetterLocaleSnapshot, saveLetterLocaleSnapshot } from '@/lib/bead-letters/locale-navigation';
import type { LetterColor, LetterPalette, LetterState } from '@/lib/bead-letters/types';
import { downloadBlob } from '@/lib/core/printer/download';
import { LOCALE_NAVIGATION_EVENT, localeRoutes, type LocaleNavigationDetail } from '@/lib/i18n/routes';
import type { SiteLocale } from '@/lib/i18n/locales';
import styles from './LetterWorkspace.module.css';

const format = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
function colorCss(color: LetterColor) { return `rgb(${color.r},${color.g},${color.b})`; }

export default function LetterWorkspace({ locale, palettes }: { locale: SiteLocale; palettes: LetterPalette[] }) {
    const copy = beadLetterCopy[locale];
    const id = useId();
    const [state, setState] = useState<LetterState>(() => defaultLetterState(palettes));
    const [saved, setSaved] = useState(true);
    const [recovery, setRecovery] = useState<'pending' | 'failed' | 'ready'>('pending');
    const ready = recovery === 'ready';
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');
    const canvas = useRef<HTMLCanvasElement>(null);
    const inputFile = useRef<HTMLInputElement>(null);
    const leaving = useRef(false);
    const operation = useRef<AbortController | null>(null);
    const live = useRef({ state, saved, busy, ready });
    useEffect(() => { live.current = { state, saved, busy, ready }; }, [state, saved, busy, ready]);
    useEffect(() => () => { operation.current?.abort(); }, []);
    const generated = useMemo<{ result: LetterProjectResult | null; error: unknown }>(() => {
        try { return { result: buildLetterProject(state, palettes), error: null }; }
        catch (error) { return { result: null, error }; }
    }, [state, palettes]);
    const { result } = generated;
    let errorMessage = '';
    if (generated.error instanceof LetterPatternError) {
        errorMessage = ({ EMPTY: copy.emptyText, UNSUPPORTED: copy.unsupported, TOO_LARGE: copy.tooLarge, INVALID_OPTIONS: copy.invalidOptions })[generated.error.code];
        if (generated.error.unsupported?.length) errorMessage += ` ${generated.error.unsupported.join(' ')}`;
    } else if (generated.error) {
        errorMessage = generated.error instanceof Error && generated.error.message === 'INVALID_COLOR' ? copy.invalidColor : copy.invalidOptions;
    }

    const recover = useCallback(() => {
        if (live.current.ready || live.current.busy) return;
        live.current.ready = false;
        setRecovery('pending'); setNotice('');
        try {
            const storage = window.sessionStorage;
            const read = readLetterLocaleSnapshot(window.location.href, storage, palettes);
            if (read) {
                live.current = { ...live.current, ...read.snapshot };
                setState(read.snapshot.state); setSaved(read.snapshot.saved);
                acknowledgeLetterLocaleSnapshot(read, storage);
            }
            live.current.ready = true;
            leaving.current = false;
            setRecovery('ready');
        } catch {
            live.current.ready = false;
            setRecovery('failed');
        }
    }, [palettes]);

    function discardRecovery() {
        if (live.current.ready || live.current.busy) return;
        try {
            if (!discardLetterLocaleSnapshot(window.sessionStorage)) throw new Error('DISCARD_NOT_CONFIRMED');
            const fresh = defaultLetterState(palettes);
            live.current = { state: fresh, saved: true, busy: false, ready: true };
            leaving.current = false;
            setState(fresh); setSaved(true); setRecovery('ready'); setNotice('');
        } catch { setNotice(copy.discardFailed); }
    }

    useEffect(() => {
        let active = true;
        queueMicrotask(() => {
            if (active) recover();
        });
        return () => { active = false; };
    }, [recover]);

    useEffect(() => {
        const changeLanguage = (event: Event) => {
            const e = event as CustomEvent<LocaleNavigationDetail>;
            if (e.defaultPrevented || !isLetterLocaleNavigation(window.location.href, e.detail.href)) return;
            if (!live.current.ready) {
                e.preventDefault();
                return;
            }
            try {
                if (live.current.busy || !saveLetterLocaleSnapshot({ state: live.current.state, saved: live.current.saved }, e.detail.href, window.sessionStorage, palettes)) {
                    e.preventDefault(); setNotice(copy.transferFailed); return;
                }
                leaving.current = true;
            } catch { e.preventDefault(); setNotice(copy.transferFailed); }
        };
        const protect = (event: BeforeUnloadEvent) => {
            if (!live.current.saved && !leaving.current) { event.preventDefault(); event.returnValue = ''; }
        };
        const resume = () => { leaving.current = false; };
        window.addEventListener(LOCALE_NAVIGATION_EVENT, changeLanguage);
        window.addEventListener('beforeunload', protect);
        window.addEventListener('pageshow', resume);
        return () => {
            window.removeEventListener(LOCALE_NAVIGATION_EVENT, changeLanguage);
            window.removeEventListener('beforeunload', protect);
            window.removeEventListener('pageshow', resume);
        };
    }, [palettes, copy.transferFailed]);

    useEffect(() => {
        const element = canvas.current;
        if (!ready || !result || !element) return;
        const cell = 18, margin = 24, { grid, palette } = result;
        element.width = grid.width * cell + margin + 1;
        element.height = grid.height * cell + margin + 1;
        const ctx = element.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#f5f6f2'; ctx.fillRect(0, 0, element.width, element.height);
        ctx.fillStyle = '#52645c'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let x = 0; x < grid.width; x++) if (x === 0 || (x + 1) % 5 === 0 || x === grid.width - 1) ctx.fillText(String(x + 1), margin + x * cell + cell / 2, 11);
        for (let y = 0; y < grid.height; y++) {
            if (y === 0 || (y + 1) % 5 === 0 || y === grid.height - 1) { ctx.fillStyle = '#52645c'; ctx.fillText(String(y + 1), 11, margin + y * cell + cell / 2); }
            for (let x = 0; x < grid.width; x++) {
                const offset = (y * grid.width + x) * 4;
                if (!grid.pixels[offset + 3]) continue;
                ctx.fillStyle = `rgb(${grid.pixels[offset]},${grid.pixels[offset + 1]},${grid.pixels[offset + 2]})`;
                ctx.beginPath(); ctx.arc(margin + x * cell + cell / 2, margin + y * cell + cell / 2, 7.5, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#a8b1a7'; ctx.lineWidth = 0.5; ctx.stroke();
            }
        }
        for (let x = 0; x <= grid.width; x++) {
            ctx.strokeStyle = x % palette.boardSize === 0 ? '#87988c' : '#d9dfd7'; ctx.lineWidth = x % palette.boardSize === 0 ? 1 : 0.5;
            ctx.beginPath(); ctx.moveTo(margin + x * cell, margin); ctx.lineTo(margin + x * cell, element.height); ctx.stroke();
        }
        for (let y = 0; y <= grid.height; y++) {
            ctx.strokeStyle = y % palette.boardSize === 0 ? '#87988c' : '#d9dfd7'; ctx.lineWidth = y % palette.boardSize === 0 ? 1 : 0.5;
            ctx.beginPath(); ctx.moveTo(margin, margin + y * cell); ctx.lineTo(element.width, margin + y * cell); ctx.stroke();
        }
    }, [result, ready]);

    function change(patch: Partial<LetterState>) {
        if (!live.current.ready || live.current.busy) return;
        const next = { ...live.current.state, ...patch };
        leaving.current = false;
        live.current = { ...live.current, state: next, saved: false };
        setState(next); setSaved(false); setNotice('');
    }
    function changeBrand(paletteId: string) {
        if (!live.current.ready || live.current.busy) return;
        const next = palettes.find(p => p.id === paletteId)!;
        change(selectLetterBrandColors(live.current.state, palettes, next.id));
    }
    async function exportFile(kind: 'png' | 'pdf' | 'project') {
        if (!live.current.ready || live.current.busy) return;
        const current = live.current.state;
        let currentResult: LetterProjectResult;
        try { currentResult = buildLetterProject(current, palettes); }
        catch { return; }
        const task = new AbortController(); operation.current = task;
        live.current.busy = true;
        setBusy(true); setNotice('');
        try {
            if (kind === 'project') {
                const raw = serializeLetterProject(current, palettes);
                downloadBlob(new Blob([raw], { type: 'application/json' }), `bead-letters-${currentResult.grid.width}x${currentResult.grid.height}.bead-pattern.json`);
                live.current.saved = true; setSaved(true); setNotice(copy.saved);
            } else {
                const exporter = await import('@/lib/bead-letters/export');
                task.signal.throwIfAborted();
                if (kind === 'png') await exporter.exportLetterPng(currentResult, task.signal);
                else await exporter.exportLetterPdf(currentResult, current, locale, task.signal);
            }
        } catch { if (!task.signal.aborted) setNotice(copy.exportFailed); }
        finally { if (!task.signal.aborted) { live.current.busy = false; setBusy(false); operation.current = null; } }
    }
    async function loadFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file || !live.current.ready || live.current.busy) return;
        const task = new AbortController(); operation.current = task;
        live.current.busy = true;
        setBusy(true); setNotice('');
        try {
            if (file.size > 2 * 1024 * 1024) throw new Error('INVALID_PROJECT');
            const raw = await file.text(); task.signal.throwIfAborted();
            const restored = parseLetterProject(raw, palettes);
            if (!live.current.saved && !window.confirm(copy.replaceProject)) return;
            live.current = { state: restored, saved: true, busy: true, ready: true };
            leaving.current = false;
            setState(restored); setSaved(true); setNotice(copy.loaded);
        } catch { if (!task.signal.aborted) setNotice(copy.invalidProject); }
        finally { if (!task.signal.aborted) { live.current.busy = false; setBusy(false); operation.current = null; } }
    }
    const selected = palettes.find(p => p.id === state.paletteId)!;
    return <section className={styles.workspace} aria-label={copy.heading}>
        <fieldset className={styles.settings} disabled={!ready || busy}>
            <legend className="sr-only">{copy.heading}</legend>
            <label htmlFor={`${id}-text`}>{copy.text}</label>
            <textarea id={`${id}-text`} rows={3} maxLength={200} value={state.text} onChange={e => change({ text: e.target.value })} aria-describedby={`${id}-supported`} spellCheck={false} />
            <p id={`${id}-supported`} className={styles.hint}>{copy.supported}</p>
            <div className={styles.options}>
                {(['letterSpacing', 'lineSpacing', 'padding'] as const).map((key, index) => <label key={key}>{copy[key]}<select value={state[key]} onChange={e => change({ [key]: Number(e.target.value) })}>{Array.from({ length: index === 1 ? 7 : 5 }, (_, value) => <option key={value} value={value}>{value}</option>)}</select></label>)}
                <label>{copy.alignment}<select value={state.align} onChange={e => change({ align: e.target.value as LetterState['align'] })}>{(['left', 'center', 'right'] as const).map(value => <option key={value} value={value}>{copy.alignments[value]}</option>)}</select></label>
            </div>
            <label>{copy.brand}<select value={state.paletteId} onChange={e => changeBrand(e.target.value)}>{palettes.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
            <label>{copy.foreground}<select value={state.foregroundRef} onChange={e => change({ foregroundRef: e.target.value })}>{selected.colors.map(c => <option key={c.ref} value={c.ref}>{c.name} · {c.ref}</option>)}</select></label>
            <label className={styles.check}><input type="checkbox" checked={state.backgroundEnabled} onChange={e => change({ backgroundEnabled: e.target.checked })} />{copy.backgroundEnabled}</label>
            <label>{copy.background}<select value={state.backgroundRef} disabled={!state.backgroundEnabled} onChange={e => change({ backgroundRef: e.target.value })}>{selected.colors.map(c => <option key={c.ref} value={c.ref}>{c.name} · {c.ref}</option>)}</select></label>
            <label>{copy.paper}<select value={state.paper} onChange={e => change({ paper: e.target.value as LetterState['paper'] })}><option value="a4">A4</option><option value="letter">US Letter</option></select></label>
        </fieldset>
        <div className={styles.output}>
            <div className={styles.outputHeader}><h2>{copy.preview}</h2><button type="button" onClick={() => { if (live.current.ready && !live.current.busy) inputFile.current?.click(); }} disabled={!ready || busy}>{copy.loadProject}</button></div>
            <input ref={inputFile} type="file" accept=".json,.bead-pattern.json,application/json" onChange={loadFile} hidden />
            {recovery === 'pending' && <p role="status" className={styles.hint}>{copy.restoring}</p>}
            {recovery === 'failed' && <div role="alert" className={styles.error}>
                <p>{copy.restoreFailed}</p>
                <div className={styles.actions}>
                    <button type="button" onClick={recover}>{copy.retryRestore}</button>
                    <button type="button" onClick={discardRecovery}>{copy.discardRestore}</button>
                </div>
            </div>}
            {ready && errorMessage && <p role="alert" className={styles.error}>{errorMessage}</p>}
            {ready && result && <>
                <p className={styles.normalized}>{format(copy.normalizedText, { text: result.pattern.normalizedText })}</p>
                <div className={styles.canvasWrap}><canvas ref={canvas} role="img" style={{ minWidth: result.grid.width * 8 + 12 }} aria-label={`${copy.previewLabel}: ${result.grid.width} × ${result.grid.height}`} /></div>
                <div className={styles.summary}>
                    <p>{format(copy.dimensions, { width: result.grid.width, height: result.grid.height })}</p>
                    <p>{format(copy.beadCount, { count: result.usage.reduce((sum, item) => sum + item.count, 0) })}</p>
                    <p>{format(copy.boardCount, { count: result.draft.boardWidth * result.draft.boardHeight })} · {selected.boardSize} × {selected.boardSize}</p>
                </div>
                <ul className={styles.colors} aria-label={copy.colors}>{result.usage.map(item => <li key={item.color.ref}><span className={styles.swatch} style={{ backgroundColor: colorCss(item.color) }} aria-hidden="true" /><span>{item.color.name} <small>{item.color.ref}</small></span><strong>{item.count}</strong></li>)}</ul>
            </>}
            <div className={styles.actions}>
                <button type="button" className={styles.primary} disabled={!result || !ready || busy} onClick={() => void exportFile('pdf')}>{copy.downloadPdf}</button>
                <button type="button" disabled={!result || !ready || busy} onClick={() => void exportFile('png')}>{copy.downloadPng}</button>
                <button type="button" disabled={!result || !ready || busy} onClick={() => void exportFile('project')}>{copy.saveProject}</button>
            </div>
            {busy && <p role="status">{copy.exporting}</p>}
            {notice && <p role="status" className={styles.hint}>{notice}</p>}
            <p className={styles.hint}>{copy.editorHelp} <a href={localeRoutes[locale].editor} className="text-link">{copy.editorLink}</a></p>
        </div>
    </section>;
}

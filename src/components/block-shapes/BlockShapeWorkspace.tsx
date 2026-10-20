'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { SiteLocale } from '@/lib/i18n/locales';
import { LOCALE_NAVIGATION_EVENT, localeRoutes, type LocaleNavigationDetail } from '@/lib/i18n/routes';
import { blockShapeCopy } from '@/lib/block-shapes/copy';
import { generateShape, layerRows, stackBreakdown, type ShapeKind } from '@/lib/block-shapes/core';
import { BLOCK_SHAPE_PROJECT_MAX_BYTES, defaultShapeState, draftMatchesSpec, parseShapeProject, shapeDraft, specFromDraft, validateShapeState, type BlockShapeState, type ShapeDraft } from '@/lib/block-shapes/project';
import { acknowledgeShapeLocaleSnapshot, discardShapeLocaleSnapshot, isShapeLocaleNavigation, readShapeLocaleSnapshot, saveShapeLocaleSnapshot } from '@/lib/block-shapes/locale-navigation';
import type { ShapeExportKind } from '@/lib/block-shapes/export';
import { planShapePdf } from '@/lib/block-shapes/pdf';
import { createToolGenerationTracker, trackToolEvent } from '@/lib/analytics';
import styles from './BlockShapeWorkspace.module.css';

const format = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
const kinds: ShapeKind[] = ['ellipse', 'sphere', 'dome', 'cylinder', 'cone'];

export default function BlockShapeWorkspace({ locale }: { locale: SiteLocale }) {
    const copy = blockShapeCopy[locale];
    const [state, setState] = useState<BlockShapeState>(defaultShapeState);
    const [draft, setDraft] = useState<ShapeDraft>(() => shapeDraft(defaultShapeState().spec));
    const [saved, setSaved] = useState(true), [busy, setBusy] = useState(false);
    const [recovery, setRecovery] = useState<'pending' | 'failed' | 'ready'>('pending');
    const [notice, setNotice] = useState('');
    const ready = recovery === 'ready';
    const live = useRef({ state, draft, saved, busy, ready });
    const canvas = useRef<HTMLCanvasElement>(null), fileInput = useRef<HTMLInputElement>(null);
    const operation = useRef<AbortController | null>(null), leaving = useRef(false);
    const generation = useRef(createToolGenerationTracker('block_shapes'));
    useEffect(() => { live.current = { state, draft, saved, busy, ready }; }, [state, draft, saved, busy, ready]);
    useEffect(() => () => operation.current?.abort(), []);
    const model = useMemo(() => generateShape(state.spec), [state.spec]);
    const rows = useMemo(() => layerRows(model, state.layer), [model, state.layer]);
    const pending = !draftMatchesSpec(draft, state.spec), stack = stackBreakdown(model.total, state.stackSize);
    const pdfPages = useMemo(() => planShapePdf(state, true).pages.length, [state]);

    const recover = useCallback(() => {
        if (live.current.ready || live.current.busy) return;
        setRecovery('pending'); setNotice('');
        try {
            const storage = window.sessionStorage, read = readShapeLocaleSnapshot(window.location.href, storage);
            if (read) {
                live.current = { ...live.current, ...read.snapshot };
                setState(read.snapshot.state); setDraft(read.snapshot.draft); setSaved(read.snapshot.saved);
                if (!acknowledgeShapeLocaleSnapshot(read, storage)) throw new Error('RECOVERY_NOT_ACKNOWLEDGED');
            }
            live.current.ready = true; leaving.current = false; setRecovery('ready');
        } catch { live.current.ready = false; setRecovery('failed'); }
    }, []);
    useEffect(() => { let active = true; queueMicrotask(() => { if (active) recover(); }); return () => { active = false; }; }, [recover]);
    function discardRecovery() {
        if (live.current.ready || live.current.busy) return;
        try {
            if (!discardShapeLocaleSnapshot(window.sessionStorage)) throw new Error('DISCARD_FAILED');
            const fresh = defaultShapeState(), raw = shapeDraft(fresh.spec);
            live.current = { state: fresh, draft: raw, saved: true, busy: false, ready: true };
            setState(fresh); setDraft(raw); setSaved(true); leaving.current = false; setRecovery('ready'); setNotice('');
        } catch { setNotice(copy.discardFailed); }
    }
    useEffect(() => {
        const language = (event: Event) => {
            const e = event as CustomEvent<LocaleNavigationDetail>;
            if (e.defaultPrevented || !isShapeLocaleNavigation(window.location.href, e.detail.href)) return;
            const current = live.current;
            if (!current.ready || current.busy) { e.preventDefault(); setNotice(copy.busyCannotLeave); return; }
            try {
                if (!saveShapeLocaleSnapshot({ state: current.state, draft: current.draft, saved: current.saved }, e.detail.href, window.sessionStorage)) throw new Error('TRANSFER_FAILED');
                leaving.current = true;
            } catch { e.preventDefault(); setNotice(copy.transferFailed); }
        };
        const unload = (event: BeforeUnloadEvent) => {
            if ((!live.current.saved || live.current.busy) && !leaving.current) { event.preventDefault(); event.returnValue = ''; }
        };
        const resume = () => { leaving.current = false; };
        window.addEventListener(LOCALE_NAVIGATION_EVENT, language); window.addEventListener('beforeunload', unload); window.addEventListener('pageshow', resume);
        return () => { window.removeEventListener(LOCALE_NAVIGATION_EVENT, language); window.removeEventListener('beforeunload', unload); window.removeEventListener('pageshow', resume); };
    }, [copy.busyCannotLeave, copy.transferFailed]);

    function changeState(patch: Partial<BlockShapeState>) {
        if (!live.current.ready || live.current.busy) return;
        const next = validateShapeState({ ...live.current.state, ...patch });
        live.current = { ...live.current, state: next, saved: false }; leaving.current = false;
        setState(next); setSaved(false); setNotice('');
    }
    function changeDraft(patch: Partial<ShapeDraft>) {
        if (!live.current.ready || live.current.busy) return;
        const next = { ...live.current.draft, ...patch };
        live.current = { ...live.current, draft: next, saved: false }; leaving.current = false;
        setDraft(next); setSaved(false); setNotice('');
    }
    function changeKind(kind: ShapeKind) {
        const current = live.current.draft, limit = kind === 'ellipse' ? 128 : 96;
        const width = Math.max(1, Math.min(limit, Number(current.width) || 15));
        changeDraft({ kind, width: String(width), depth: kind === 'ellipse' ? String(Math.max(1, Math.min(128, Number(current.depth) || width))) : String(width),
            height: String(kind === 'ellipse' ? 1 : kind === 'sphere' ? width : kind === 'dome' ? Math.ceil(width / 2) : current.kind === 'ellipse' ? width : Math.max(1, Math.min(96, Number(current.height) || width))) });
    }
    function applyShape() {
        if (!live.current.ready || live.current.busy) return;
        try {
            const spec = specFromDraft(live.current.draft), next = validateShapeState({ ...live.current.state, spec, layer: 0, completedLayers: [] }), raw = shapeDraft(spec);
            live.current = { ...live.current, state: next, draft: raw, saved: false }; leaving.current = false;
            setState(next); setDraft(raw); setSaved(false); setNotice(copy.applied);
            generation.current.record();
        } catch { setNotice(copy.invalidDimensions + ' ' + copy.invalidOptions); }
    }
    async function exportFile(kind: ShapeExportKind) {
        const current = live.current;
        if (!current.ready || current.busy || (kind !== 'project' && !draftMatchesSpec(current.draft, current.state.spec))) return;
        const task = new AbortController(); operation.current = task; live.current.busy = true; setBusy(true); setNotice('');
        try {
            const { exportBlockShape } = await import('@/lib/block-shapes/export'); task.signal.throwIfAborted();
            await exportBlockShape(current.state, locale, kind, task.signal, current.draft);
            trackToolEvent({ name: 'tool_export', tool: 'block_shapes', format: kind === 'allPdf' ? 'pdf' : kind === 'layerProject' ? 'layer_project' : kind });
            if (kind === 'project') { live.current.saved = true; setSaved(true); setNotice(copy.saved); }
        } catch { if (!task.signal.aborted) setNotice(copy.exportFailed); }
        finally { if (!task.signal.aborted) { live.current.busy = false; setBusy(false); operation.current = null; } }
    }
    async function loadProject(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]; event.target.value = '';
        if (!file || !live.current.ready || live.current.busy) return;
        const task = new AbortController(); operation.current = task; live.current.busy = true; setBusy(true); setNotice(copy.loadingProject);
        try {
            if (file.size > BLOCK_SHAPE_PROJECT_MAX_BYTES) throw new Error('INVALID_PROJECT');
            const raw = await file.text(); task.signal.throwIfAborted();
            const project = parseShapeProject(raw);
            if (!live.current.saved && !window.confirm(copy.replaceProject)) { setNotice(''); return; }
            live.current = { ...live.current, ...project, saved: true }; leaving.current = false;
            setState(project.state); setDraft(project.draft); setSaved(true); setNotice(copy.loaded);
            generation.current.reset();
        } catch { if (!task.signal.aborted) setNotice(copy.invalidProject); }
        finally { if (!task.signal.aborted) { live.current.busy = false; setBusy(false); operation.current = null; } }
    }
    function cancelExport() {
        operation.current?.abort(); operation.current = null; live.current.busy = false; setBusy(false); setNotice('');
    }

    useEffect(() => {
        const element = canvas.current;
        if (!ready || !element) return;
        const cell = model.width <= 32 && model.depth <= 32 ? 20 : 12, margin = 28;
        element.width = model.width * cell + margin + 1; element.height = model.depth * cell + margin + 1;
        const ctx = element.getContext('2d'); if (!ctx) return;
        ctx.fillStyle = '#fafbf8'; ctx.fillRect(0, 0, element.width, element.height);
        const layerStart = state.layer * model.width * model.depth;
        for (let z = 0; z < model.depth; z++) for (let x = 0; x < model.width; x++) {
            const offset = z * model.width + x;
            if (model.mask[layerStart + offset]) ctx.fillStyle = state.color;
            else if (state.ghost && state.layer > 0 && model.mask[layerStart - model.width * model.depth + offset]) ctx.fillStyle = '#d2dace';
            else continue;
            ctx.fillRect(margin + x * cell, margin + z * cell, cell, cell);
            if (model.mask[layerStart + offset] && state.color.toUpperCase() === '#FFFFFF') { ctx.strokeStyle = '#9ba99a'; ctx.strokeRect(margin + x * cell + 2, margin + z * cell + 2, cell - 4, cell - 4); }
        }
        if (state.grid) {
            ctx.strokeStyle = '#bbc6b7'; ctx.lineWidth = 0.5; ctx.beginPath();
            for (let x = 0; x <= model.width; x++) { ctx.moveTo(margin + x * cell + 0.5, margin); ctx.lineTo(margin + x * cell + 0.5, element.height); }
            for (let z = 0; z <= model.depth; z++) { ctx.moveTo(margin, margin + z * cell + 0.5); ctx.lineTo(element.width, margin + z * cell + 0.5); }
            ctx.stroke();
        }
        ctx.fillStyle = '#4c6154'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let x = 0; x < model.width; x++) if (x === 0 || x === model.width - 1 || (x + 1) % 5 === 0) ctx.fillText(String(x + 1), margin + (x + 0.5) * cell, 12);
        for (let z = 0; z < model.depth; z++) if (z === 0 || z === model.depth - 1 || (z + 1) % 5 === 0) ctx.fillText(String(z + 1), 12, margin + (z + 0.5) * cell);
        if (state.center) {
            ctx.strokeStyle = '#a44f39'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]); ctx.beginPath();
            ctx.moveTo(margin + model.width * cell / 2, margin); ctx.lineTo(margin + model.width * cell / 2, element.height);
            ctx.moveTo(margin, margin + model.depth * cell / 2); ctx.lineTo(element.width, margin + model.depth * cell / 2); ctx.stroke(); ctx.setLineDash([]);
        }
    }, [model, state.layer, state.color, state.grid, state.center, state.ghost, ready]);

    return <section className={styles.workspace} aria-label={copy.heading}>
        <fieldset className={styles.settings} disabled={!ready || busy}>
            <legend className="sr-only">{copy.heading}</legend>
            <label>{copy.shape}<select value={draft.kind} onChange={e => changeKind(e.target.value as ShapeKind)}>{kinds.map(kind => <option key={kind} value={kind}>{kind === 'ellipse' ? `${copy.circle} / ${copy.ellipse}` : copy[kind]}</option>)}</select></label>
            <div className={styles.options}>
                <label>{draft.kind === 'ellipse' ? copy.width : copy.diameter}<input type="number" min="1" max={draft.kind === 'ellipse' ? 128 : 96} step="1" value={draft.width} onChange={e => changeDraft({ width: e.target.value })} /></label>
                {draft.kind === 'ellipse' && <label>{copy.depth}<input type="number" min="1" max="128" step="1" value={draft.depth} onChange={e => changeDraft({ depth: e.target.value })} /></label>}
                {(draft.kind === 'cylinder' || draft.kind === 'cone') && <label>{copy.height}<input type="number" min="1" max="96" step="1" value={draft.height} onChange={e => changeDraft({ height: e.target.value })} /></label>}
            </div>
            <div className={styles.options}>
                <label>{copy.mode}<select value={draft.style} onChange={e => changeDraft({ style: e.target.value as ShapeDraft['style'] })}><option value="hollow">{copy.hollow}</option><option value="filled">{copy.solid}</option></select></label>
                <label>{copy.thickness}<input type="number" min="1" max="8" step="1" disabled={draft.style === 'filled'} value={draft.thickness} onChange={e => changeDraft({ thickness: e.target.value })} /></label>
            </div>
            <button type="button" className={styles.primary} onClick={applyShape} disabled={!pending}>{copy.applyShape}</button>
            <p className={styles.hint}>{copy.invalidDimensions}</p>
            <label>{copy.blockColor}<input type="color" value={state.color} onChange={e => changeState({ color: e.target.value })} /></label>
            <label>{copy.stackSize}<select value={state.stackSize} onChange={e => changeState({ stackSize: Number(e.target.value) as 16 | 64 })}><option value="64">64</option><option value="16">16</option></select></label>
            <label>{copy.paper}<select value={state.paper} onChange={e => changeState({ paper: e.target.value as BlockShapeState['paper'] })}><option value="a4">{copy.paperA4}</option><option value="letter">{copy.paperLetter}</option></select></label>
            {(['grid', 'center', 'ghost', 'rowCounts'] as const).map((key, index) => <label className={styles.check} key={key}><input type="checkbox" checked={state[key]} onChange={e => changeState({ [key]: e.target.checked })} />{[copy.showGrid, copy.showCenter, copy.showGhost, copy.showRowCounts][index]}</label>)}
        </fieldset>
        <div className={styles.output}>
            <div className={styles.outputHeader}><h2>{copy.preview}</h2><button type="button" onClick={() => fileInput.current?.click()} disabled={!ready || busy}>{copy.loadProject}</button></div>
            <input ref={fileInput} type="file" accept=".json,.block-shape.json,application/json" hidden onChange={loadProject} />
            {recovery === 'pending' && <p role="status">{copy.restoring}</p>}
            {recovery === 'failed' && <div role="alert" className={styles.error}><p>{copy.restoreFailed}</p><div className={styles.actions}><button type="button" onClick={recover}>{copy.retryRestore}</button><button type="button" onClick={discardRecovery}>{copy.discardRestore}</button></div></div>}
            {notice && <p role="status" className={styles.notice}>{notice}</p>}
            {ready && <>
                {pending && <p role="status" className={styles.notice}>{copy.pendingChanges}</p>}
                <div className={styles.summary}><strong>{format(copy.totalBlocks, { count: model.total })}</strong><span>{format(copy.layerBlocks, { count: model.layerCounts[state.layer] })}</span><span>{format(copy.dimensions, { width: model.width, depth: model.depth, height: model.height })}</span><span>{format(copy.stacks, stack)}</span></div>
                {state.spec.style === 'hollow' && model.total === model.solidCount && <p className={styles.hint}>{copy.noCavity}</p>}
                <fieldset className={styles.layerControls} disabled={busy || pending}>
                    <legend className="sr-only">{copy.layer}</legend>
                    <button type="button" aria-label={copy.previousLayer} disabled={state.layer === 0} onClick={() => changeState({ layer: state.layer - 1 })}>←</button>
                    <label>{copy.layer}<select value={state.layer} onChange={e => changeState({ layer: Number(e.target.value) })}>{Array.from({ length: model.height }, (_, y) => <option key={y} value={y}>{format(copy.layerOf, { layer: y + 1, count: model.height })} · Y={y}</option>)}</select></label>
                    <button type="button" aria-label={copy.nextLayer} disabled={state.layer === model.height - 1} onClick={() => changeState({ layer: state.layer + 1 })}>→</button>
                </fieldset>
                <div className={styles.canvasWrap} tabIndex={0} role="region" aria-label={copy.previewLabel}><canvas ref={canvas} aria-label={`${copy.previewLabel}. ${format(copy.layerBlocks, { count: model.layerCounts[state.layer] })}`} /></div>
                <p className={styles.hint}>{copy.coordinatesHelp} {state.center && copy.centerGuideHelp}</p>
                <fieldset className={styles.progress} disabled={busy || pending}>
                    <legend className="sr-only">{copy.completedLayer}</legend>
                    <label className={styles.check}><input type="checkbox" checked={state.completedLayers.includes(state.layer)} onChange={e => changeState({ completedLayers: e.target.checked ? [...state.completedLayers, state.layer] : state.completedLayers.filter(y => y !== state.layer) })} />{copy.completedLayer}</label>
                    <span>{format(copy.completedSummary, { done: state.completedLayers.length, count: model.height })}</span>
                    <button type="button" disabled={!state.completedLayers.length} onClick={() => changeState({ completedLayers: [] })}>{copy.clearProgress}</button>
                </fieldset>
                <div className={styles.actions}>
                    <button type="button" className={styles.primary} disabled={busy} onClick={() => exportFile('project')}>{copy.saveProject}</button>
                    <button type="button" disabled={busy || pending} onClick={() => exportFile('png')}>{copy.downloadPng}</button>
                    <button type="button" disabled={busy || pending} onClick={() => exportFile('layerProject')}>{copy.exportLayerProject}</button>
                    <button type="button" disabled={busy || pending} onClick={() => exportFile('pdf')}>{copy.downloadCurrentPdf}</button>
                    {model.height > 1 && <button type="button" disabled={busy || pending} onClick={() => exportFile('allPdf')}>{copy.downloadAllPdf}</button>}
                </div>
                <p className={styles.hint}>{format(copy.pdfPageCount, { count: pdfPages })}</p>
                {busy && <div className={styles.actions}><p role="status">{copy.exporting}</p><button type="button" onClick={cancelExport}>{copy.cancelExport}</button></div>}
                <p className={styles.hint}>{copy.pixelProjectHelp} {copy.editorHelp} <a href={localeRoutes[locale].pixelGrid}>{copy.editorLink} →</a></p>
                {state.rowCounts && <details className={styles.rows} open><summary>{copy.rowSegments}</summary><div className={styles.tableWrap}><table><thead><tr><th>{copy.row}</th><th>{copy.columnStart}</th><th>{copy.columnEnd}</th><th>{copy.runLength}</th></tr></thead><tbody>{rows.flatMap(row => row.runs.length ? row.runs.map((run, index) => <tr key={`${row.row}-${index}`}><td>{row.row}</td><td>{run.start}</td><td>{run.end}</td><td>{run.count}</td></tr>) : [<tr key={row.row}><td>{row.row}</td><td>—</td><td>—</td><td>0</td></tr>])}</tbody></table></div></details>}
            </>}
        </div>
    </section>;
}

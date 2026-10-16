'use client';

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import type { SiteLocale } from '../../lib/i18n/locales';
import { LOCALE_NAVIGATION_EVENT, type LocaleNavigationDetail } from '../../lib/i18n/routes';
import { appendLayer, collectMaterials, makeLoomSteps, moveLayer, removeLayer, renderBanner, replaceLayer, type BannerDesign, type RgbaImage } from '../../lib/minecraft-banners/core';
import { DYE_COLORS, DYE_IDS, type DyeId } from '../../lib/minecraft-banners/data';
import { PATTERN_IDS, type PatternId } from '../../lib/minecraft-banners/geometry';
import { buildLetterBanners, renderLetterStrip } from '../../lib/minecraft-banners/letters';
import { BannerHistory, BANNER_PROJECT_MAX_BYTES, defaultBannerWorkspace, parseBannerProject, serializeBannerProject, validateWorkspace, type BannerWorkspace as Workspace } from '../../lib/minecraft-banners/project';
import { encodeBannerPng, encodeLetterStripPng, loomPlanJSON } from '../../lib/minecraft-banners/export';
import { acknowledgeBannerTransfer, discardBannerTransfer, isBannerNavigation, readBannerTransfer, saveBannerTransfer } from '../../lib/minecraft-banners/locale';
import { bannerCopy, type BannerCopy } from '../../lib/minecraft-banners/copy';
import { bannerLabels, bannerPaths, type BannerMode } from '../../lib/minecraft-banners/routes';
import { downloadBlob } from '../../lib/core/printer/download';
import styles from './BannerWorkspace.module.css';

const format = (value: string, values: Record<string, string | number>) => value.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
type ExportKind = 'png' | 'json' | 'text' | 'project';
const characterLabel = (letter: { character: string; panel: number; panelCount: number }, copy: BannerCopy) => letter.panelCount > 1 ? format(copy.panel, { character: letter.character, panel: letter.panel, total: letter.panelCount }) : letter.character;
export function bannerErrorMessage(error: unknown, copy: BannerCopy): string {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
    if (code === 'EMPTY_TEXT') return copy.errorEmpty;
    if (code === 'UNSUPPORTED_CHARACTER') return copy.errorCharacters;
    if (code === 'TEXT_TOO_LONG') return copy.errorLength;
    if (code === 'SAME_COLORS') return copy.errorColours;
    return copy.errorGeneral;
}
export function localizedLoomText(designs: BannerDesign[], copy: BannerCopy, characters?: string[]): string {
    const materials = collectMaterials(designs);
    const coloured = (items: Partial<Record<DyeId, number>>) => DYE_IDS.filter(dye => items[dye]).map(dye => `${copy.colours[dye]} × ${items[dye]}`).join(', ');
    return [copy.version, ...designs.flatMap((design, index) => [
        '', `${index + 1}${characters?.[index] ? ` · ${characters[index]}` : ''}`,
        format(copy.baseStep, { colour: copy.colours[design.base] }),
        ...makeLoomSteps(design).map(step => format(copy.applyStep, { step: step.step, colour: copy.colours[step.color], pattern: copy.patterns[step.pattern] })),
    ]), '', copy.materials, `${copy.banners}: ${coloured(materials.banners)}`, `${copy.dyes}: ${coloured(materials.dyes)}`, copy.materialHint,
    `${copy.wool}: ${coloured(materials.wool)}`, `${copy.sticks}: ${materials.sticks}`, `${copy.loom}: ${materials.loom}`, '', copy.scope].join('\n');
}

function BannerCanvas({ image, label }: { image: RgbaImage; label: string }) {
    const canvas = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const context = canvas.current?.getContext('2d');
        if (context) context.putImageData(new ImageData(new Uint8ClampedArray(image.pixels), image.width, image.height), 0, 0);
    }, [image]);
    return <canvas ref={canvas} width={image.width} height={image.height} role="img" aria-label={label} />;
}

export default function BannerWorkspace({ locale, mode }: { locale: SiteLocale; mode: BannerMode }) {
    const copy = bannerCopy[locale], id = useId(), otherMode = mode === 'designer' ? 'letters' : 'designer';
    const [workspace, setWorkspace] = useState(defaultBannerWorkspace);
    const [saved, setSaved] = useState(true), [ready, setReady] = useState(false), [recoveryFailed, setRecoveryFailed] = useState(false);
    const [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
    const [replacementToken, setReplacementToken] = useState<number | null>(null);
    const awaitingReplacement = replacementToken !== null;
    const [pattern, setPattern] = useState<PatternId>('stripe_center'), [colour, setColour] = useState<DyeId>('black');
    const history = useRef<BannerHistory | null>(null); if (!history.current) history.current = new BannerHistory(workspace);
    const input = useRef<HTMLInputElement>(null), mounted = useRef(false), epoch = useRef(0), leaving = useRef(false), transferBlocked = useRef(false);
    const pendingProject = useRef<{ workspace: Workspace; token: number } | null>(null);
    const live = useRef({ workspace, saved, ready, busy });
    const invalidate = useCallback((resetUi = true) => { epoch.current++; pendingProject.current = null; if (resetUi) setReplacementToken(null); }, []);

    const install = useCallback((next: Workspace, isSaved: boolean) => {
        const checked = validateWorkspace(next);
        live.current.workspace = checked; live.current.saved = isSaved;
        setWorkspace(checked); setSaved(isSaved); leaving.current = false;
        const selected = checked.design.layers[checked.activeLayer - 1];
        if (selected) { setPattern(selected.pattern); setColour(selected.color); }
    }, []);
    const recover = useCallback(() => {
        if (live.current.ready || live.current.busy) return;
        try {
            const storage = window.sessionStorage, snapshot = readBannerTransfer(window.location.href, storage);
            let removed = true;
            if (snapshot) { install(snapshot.workspace, snapshot.saved); history.current = new BannerHistory(snapshot.workspace); removed = acknowledgeBannerTransfer(snapshot.raw, storage); }
            transferBlocked.current = !removed; live.current.ready = true; setReady(true); setRecoveryFailed(false); setNotice(removed ? '' : copy.recordKept);
        } catch { transferBlocked.current = true; setRecoveryFailed(true); }
    }, [copy.recordKept, install]);
    useEffect(() => {
        mounted.current = true; let active = true;
        queueMicrotask(() => { if (active) recover(); });
        return () => { active = false; mounted.current = false; invalidate(false); };
    }, [recover, invalidate]);

    useEffect(() => {
        const carry = (href: string) => {
            if (!live.current.ready || live.current.busy || transferBlocked.current) { setNotice(copy.transferFailed); return false; }
            try {
                if (!saveBannerTransfer({ workspace: live.current.workspace, saved: live.current.saved }, new URL(href, window.location.href).href, window.sessionStorage)) throw new Error('TRANSFER_FAILED');
                leaving.current = true; return true;
            } catch { setNotice(copy.transferFailed); return false; }
        };
        const language = (event: Event) => {
            const e = event as CustomEvent<LocaleNavigationDetail>;
            if (!e.defaultPrevented && isBannerNavigation(window.location.href, e.detail.href) && !carry(e.detail.href)) e.preventDefault();
        };
        const protect = (event: BeforeUnloadEvent) => { if (!live.current.saved && !leaving.current) { event.preventDefault(); event.returnValue = ''; } };
        const follow = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
            if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || link.hasAttribute('data-locale-navigation') || (link.target && link.target !== '_self')) return;
            const target = new URL(link.href, window.location.href), source = new URL(window.location.href);
            if (!['http:', 'https:'].includes(target.protocol) || target.href === source.href || (target.origin === source.origin && target.pathname === source.pathname && target.search === source.search)) return;
            if (isBannerNavigation(source.href, target.href)) {
                if (!carry(target.href)) { event.preventDefault(); event.stopPropagation(); }
            } else if (!live.current.saved) {
                if (!window.confirm(copy.leave)) { event.preventDefault(); event.stopPropagation(); } else leaving.current = true;
            }
        };
        const resume = () => { leaving.current = false; };
        const suspend = () => { invalidate(); if (live.current.busy) { live.current.busy = false; setBusy(false); setNotice(copy.cancelled); } };
        window.addEventListener(LOCALE_NAVIGATION_EVENT, language); window.addEventListener('beforeunload', protect); window.addEventListener('pageshow', resume); window.addEventListener('pagehide', suspend); document.addEventListener('click', follow, true);
        return () => { window.removeEventListener(LOCALE_NAVIGATION_EVENT, language); window.removeEventListener('beforeunload', protect); window.removeEventListener('pageshow', resume); window.removeEventListener('pagehide', suspend); document.removeEventListener('click', follow, true); };
    }, [copy.transferFailed, copy.leave, copy.cancelled, invalidate]);

    function commit(next: Workspace) {
        if (!live.current.ready || live.current.busy) return;
        try {
            const checked = validateWorkspace(next);
            if (serializeBannerProject(checked) === serializeBannerProject(live.current.workspace)) return;
            invalidate(); install(history.current!.commit(checked), false); setNotice('');
        } catch (error) { setNotice(bannerErrorMessage(error, copy)); }
    }
    function changeDesign(design: BannerDesign, activeLayer = design.layers.length) { commit({ ...live.current.workspace, design, activeLayer }); }
    function historyMove(direction: 'undo' | 'redo') {
        if (!live.current.ready || live.current.busy) return;
        invalidate(); install(history.current![direction](), false); setNotice('');
    }
    function startBlank() {
        const next = defaultBannerWorkspace();
        invalidate(); transferBlocked.current = true; history.current = new BannerHistory(next); install(next, true);
        live.current.ready = true; setReady(true); setRecoveryFailed(false); setNotice(copy.recordKept);
    }
    function begin() {
        if (!live.current.ready || live.current.busy) return null;
        invalidate(); live.current.busy = true; setBusy(true); setNotice(''); return epoch.current;
    }
    const current = (token: number) => mounted.current && live.current.busy && epoch.current === token;
    function finish(token: number) { if (current(token)) { live.current.busy = false; setBusy(false); } }
    function cancel() { invalidate(); live.current.busy = false; setBusy(false); setNotice(copy.cancelled); }
    function acceptProject(expectedToken: number) {
        const pending = pendingProject.current;
        if (!pending || pending.token !== expectedToken || !current(expectedToken)) return;
        pendingProject.current = null; setReplacementToken(null);
        history.current = new BannerHistory(pending.workspace); install(pending.workspace, true); setNotice(copy.loaded); finish(pending.token);
    }
    async function exportFile(kind: ExportKind) {
        const token = begin(); if (token === null) return;
        try {
            const snapshot = validateWorkspace(live.current.workspace);
            let blob: Blob, filename: string;
            if (kind === 'project') { blob = new Blob([serializeBannerProject(snapshot)], { type: 'application/json' }); filename = 'minecraft-banner-project.json'; }
            else {
                const letters = mode === 'letters' ? buildLetterBanners(snapshot.letters) : [];
                const actual = letters.filter(item => item.design !== null);
                const designs = mode === 'designer' ? [snapshot.design] : actual.map(item => item.design!);
                if (kind === 'png') { const bytes = mode === 'designer' ? await encodeBannerPng(snapshot.design) : await encodeLetterStripPng(snapshot.letters); blob = new Blob([bytes], { type: 'image/png' }); filename = mode === 'designer' ? 'minecraft-banner.png' : 'minecraft-banner-letters.png'; }
                else if (kind === 'json') { blob = new Blob([loomPlanJSON(designs)], { type: 'application/json' }); filename = 'minecraft-banner-steps.json'; }
                else { blob = new Blob([localizedLoomText(designs, copy, mode === 'letters' ? actual.map(item => characterLabel(item, copy)) : undefined)], { type: 'text/plain;charset=utf-8' }); filename = `minecraft-banner-steps-${locale}.txt`; }
            }
            if (!current(token)) return;
            downloadBlob(blob, filename);
            if (kind === 'project') { live.current.saved = true; setSaved(true); }
            setNotice(kind === 'project' ? copy.projectSaved : copy.downloadStarted);
        } catch (error) { if (current(token)) setNotice(kind === 'project' ? copy.exportFailed : bannerErrorMessage(error, copy) === copy.errorGeneral ? copy.exportFailed : bannerErrorMessage(error, copy)); }
        finally { finish(token); }
    }
    async function openProject(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
        const token = begin(); if (token === null) return;
        try {
            if (file.size > BANNER_PROJECT_MAX_BYTES) throw new Error('PROJECT_TOO_LARGE');
            const raw = await file.text(); if (!current(token)) return;
            if (new TextEncoder().encode(raw).length > BANNER_PROJECT_MAX_BYTES) throw new Error('PROJECT_TOO_LARGE');
            const next = parseBannerProject(raw);
            if (!live.current.saved) { pendingProject.current = { workspace: next, token }; setReplacementToken(token); return; }
            history.current = new BannerHistory(next); install(next, true); setNotice(copy.loaded);
        } catch { if (current(token)) setNotice(copy.invalidProject); }
        finally { if (pendingProject.current?.token !== token) finish(token); }
    }

    let letters: ReturnType<typeof buildLetterBanners> = [], validation = '';
    if (mode === 'letters') try { letters = buildLetterBanners(workspace.letters); } catch (error) { validation = bannerErrorMessage(error, copy); }
    const activeLetter = letters[Math.min(workspace.activeLetter, Math.max(0, letters.length - 1))];
    const displayed = mode === 'designer' ? workspace.design : activeLetter?.design ?? null;
    const designs = mode === 'designer' ? [workspace.design] : letters.flatMap(item => item.design ? [item.design] : []);
    const wordImage = mode === 'letters' && !validation ? renderLetterStrip(workspace.letters) : null;
    const materials = collectMaterials(designs), stepCount = mode === 'designer' ? workspace.activeLayer : displayed?.layers.length ?? 0;
    const selectedIndex = workspace.activeLayer - 1, disabled = !ready || busy;
    const colourSelect = (value: DyeId, onChange: (value: DyeId) => void, label: string) => <label className={styles.field}><span>{label}</span><select disabled={disabled} value={value} onChange={event => onChange(event.target.value as DyeId)}>{DYE_IDS.map(dye => <option key={dye} value={dye}>{copy.colours[dye]}</option>)}</select><span className={styles.swatch} style={{ backgroundColor: DYE_COLORS[value] }} aria-hidden="true" /></label>;
    const materialList = (items: Partial<Record<DyeId, number>>) => <ul>{DYE_IDS.filter(dye => items[dye]).map(dye => <li key={dye}><span className={styles.dot} style={{ backgroundColor: DYE_COLORS[dye] }} aria-hidden="true" />{copy.colours[dye]} <strong>× {items[dye]}</strong></li>)}</ul>;

    return <section className={styles.workspace} aria-label={copy.pages[mode].heading} aria-busy={busy}>
        <div className={styles.topline}><p className={styles.version}>{copy.version}</p><a href={bannerPaths[otherMode][locale]} className="text-link">{bannerLabels[otherMode][locale]} →</a></div>
        <div className={styles.toolbar}>
            <button disabled={disabled || !history.current.canUndo()} onClick={() => historyMove('undo')}>{copy.undo}</button>
            <button disabled={disabled || !history.current.canRedo()} onClick={() => historyMove('redo')}>{copy.redo}</button>
            <button disabled={disabled} onClick={() => { if (window.confirm(copy.resetConfirm)) commit(defaultBannerWorkspace()); }}>{copy.reset}</button>
            <span>{saved ? copy.saved : copy.unsaved}</span>
        </div>
        <p className={styles.hint}>{copy.historyHint}</p>
        {recoveryFailed && <div className={styles.alert} role="alert"><p>{copy.recoveryFailed}</p><button onClick={recover}>{copy.retry}</button><button onClick={startBlank}>{copy.startBlank}</button></div>}
        {ready && transferBlocked.current && <div className={styles.alert}><p>{copy.recordKept}</p><button disabled={busy} onClick={() => { const removed = discardBannerTransfer(() => window.sessionStorage); transferBlocked.current = !removed; setNotice(removed ? '' : copy.recordKept); }}>{copy.discardTransfer}</button></div>}
        {replacementToken !== null && <section className={styles.alert} aria-labelledby={`${id}-replace`}>
            <h2 id={`${id}-replace`}>{copy.replaceProject}</h2><p role="alert">{copy.replaceQuestion}</p>
            <button autoFocus onClick={() => acceptProject(replacementToken)}>{copy.replaceProject}</button><button onClick={cancel}>{copy.cancel}</button>
        </section>}
        <div className={styles.layout}>
            <div className={styles.controls}>
                {mode === 'designer' ? <>
                    {colourSelect(workspace.design.base, base => changeDesign({ ...live.current.workspace.design, base }, live.current.workspace.activeLayer), copy.base)}
                    <h2>{copy.layers} <span>{workspace.design.layers.length} / 6</span></h2>
                    {workspace.design.layers.length === 0 ? <p className={styles.hint}>{copy.empty}</p> : <ol className={styles.layers}>{workspace.design.layers.map((layer, index) => <li key={index}>
                        <button disabled={disabled} aria-pressed={workspace.activeLayer === index + 1} onClick={() => commit({ ...live.current.workspace, activeLayer: index + 1 })}><span className={styles.dot} style={{ backgroundColor: DYE_COLORS[layer.color] }} aria-hidden="true" />{index + 1}. {copy.patterns[layer.pattern]} · {copy.colours[layer.color]}</button>
                    </li>)}</ol>}
                    <label className={styles.field}><span>{copy.pattern}</span><select disabled={disabled} value={pattern} onChange={event => setPattern(event.target.value as PatternId)}>{PATTERN_IDS.map(item => <option key={item} value={item}>{copy.patterns[item]}</option>)}</select></label>
                    {colourSelect(colour, setColour, copy.colour)}
                    <div className={styles.buttons}>
                        <button disabled={disabled || workspace.design.layers.length >= 6} onClick={() => changeDesign(appendLayer(live.current.workspace.design, { pattern, color: colour }))}>{copy.add}</button>
                        <button disabled={disabled || selectedIndex < 0} onClick={() => changeDesign(replaceLayer(live.current.workspace.design, selectedIndex, { pattern, color: colour }), workspace.activeLayer)}>{copy.replace}</button>
                    </div>
                    {workspace.design.layers.length >= 6 && <p className={styles.hint}>{copy.max}</p>}
                    <div className={styles.buttons}>
                        <button disabled={disabled || selectedIndex <= 0} onClick={() => changeDesign(moveLayer(live.current.workspace.design, selectedIndex, -1), workspace.activeLayer - 1)}>{copy.up}</button>
                        <button disabled={disabled || selectedIndex < 0 || selectedIndex >= workspace.design.layers.length - 1} onClick={() => changeDesign(moveLayer(live.current.workspace.design, selectedIndex, 1), workspace.activeLayer + 1)}>{copy.down}</button>
                        <button disabled={disabled || selectedIndex < 0} onClick={() => { const next = removeLayer(live.current.workspace.design, selectedIndex); changeDesign(next, Math.min(workspace.activeLayer, next.layers.length)); }}>{copy.remove}</button>
                    </div>
                </> : <>
                    <label className={styles.field} htmlFor={`${id}-text`}><span>{copy.text}</span><input id={`${id}-text`} disabled={disabled} value={workspace.letters.text} maxLength={32} onChange={event => commit({ ...live.current.workspace, letters: { ...live.current.workspace.letters, text: event.target.value }, activeLetter: 0 })} aria-describedby={`${id}-hint`} spellCheck={false} autoComplete="off" /></label>
                    <p className={styles.hint} id={`${id}-hint`}>{copy.textHint}</p>
                    {colourSelect(workspace.letters.base, base => commit({ ...live.current.workspace, letters: { ...live.current.workspace.letters, base } }), copy.background)}
                    {colourSelect(workspace.letters.ink, ink => commit({ ...live.current.workspace, letters: { ...live.current.workspace.letters, ink } }), copy.ink)}
                    {validation && <p role="alert" className={styles.error}>{validation}</p>}
                    {activeLetter?.approximate && <p className={styles.hint}>{copy.approximate}: {activeLetter.character}</p>}
                    <button disabled={disabled || !activeLetter?.design} onClick={() => {
                        if (!activeLetter?.design) return;
                        if ((live.current.workspace.design.layers.length || live.current.workspace.design.base !== 'white') && JSON.stringify(live.current.workspace.design) !== JSON.stringify(activeLetter.design) && !window.confirm(copy.editConfirm)) return;
                        const next = { ...live.current.workspace, design: activeLetter.design, activeLayer: activeLetter.design.layers.length };
                        commit(next);
                        if (transferBlocked.current) { setNotice(copy.transferFailed); return; }
                        try {
                            const target = new URL(bannerPaths.designer[locale], window.location.href).href;
                            if (!saveBannerTransfer({ workspace: live.current.workspace, saved: live.current.saved }, target, window.sessionStorage)) throw new Error('TRANSFER_FAILED');
                            leaving.current = true; window.location.assign(target);
                        } catch { setNotice(copy.transferFailed); }
                    }}>{copy.editLetter} →</button>
                </>}
            </div>
            <div className={styles.result}>
                <h2>{copy.preview}</h2>
                {mode === 'letters' && activeLetter && <p className={styles.hint}>{characterLabel(activeLetter, copy)}</p>}
                <div className={styles.preview}>{displayed ? <BannerCanvas image={renderBanner(displayed, stepCount)} label={mode === 'letters' && activeLetter ? `${copy.selected}: ${characterLabel(activeLetter, copy)}` : format(copy.step, { step: stepCount, total: displayed.layers.length })} /> : <p>{activeLetter?.character === ' ' ? copy.space : validation}</p>}</div>
                {mode === 'designer' && <label className={styles.field}><span>{format(copy.step, { step: workspace.activeLayer, total: workspace.design.layers.length })}</span><input type="range" min={0} max={workspace.design.layers.length} value={workspace.activeLayer} disabled={disabled || workspace.design.layers.length === 0} onChange={event => commit({ ...live.current.workspace, activeLayer: Number(event.target.value) })} /></label>}
                {mode === 'designer' && <button disabled={disabled || workspace.activeLayer === workspace.design.layers.length} onClick={() => commit({ ...live.current.workspace, activeLayer: workspace.design.layers.length })}>{copy.final}</button>}
                {wordImage && <div className={styles.wordPreview} role="region" aria-label={format(copy.wordPreview, { count: designs.length })} tabIndex={0}><BannerCanvas image={wordImage} label={format(copy.wordPreview, { count: designs.length })} /></div>}
                {mode === 'letters' && letters.length > 0 && <div className={styles.letters} role="group" aria-label={copy.characters}>{letters.map((letter, index) => <button key={index} disabled={disabled} aria-pressed={activeLetter === letter} aria-label={letter.character === ' ' ? copy.space : `${characterLabel(letter, copy)}${letter.approximate ? ` · ${copy.approximate}` : ''}`} onClick={() => commit({ ...live.current.workspace, activeLetter: index })}>
                    {letter.design && <BannerCanvas image={renderBanner(letter.design)} label={characterLabel(letter, copy)} />}<span>{letter.character === ' ' ? '␣' : letter.character}{letter.panelCount > 1 && <small>{letter.panel}/{letter.panelCount}</small>}{letter.approximate ? '*' : ''}</span>
                </button>)}</div>}
                {mode === 'letters' && letters.some(letter => letter.panelCount > 1) && <p className={styles.hint}>{copy.twoPanels}</p>}
                {mode === 'letters' && letters.some(letter => letter.approximate) && <p className={styles.hint}>* {copy.approximate}</p>}
                {displayed && <div className={styles.steps}>
                    <h2>{copy.stepsTitle}</h2>
                    <p>{format(copy.baseStep, { colour: copy.colours[displayed.base] })}</p>
                    <ol>{makeLoomSteps(displayed).map(step => <li key={step.step}>{format(copy.applyStep, { step: step.step, colour: copy.colours[step.color], pattern: copy.patterns[step.pattern] })}</li>)}</ol>
                </div>}
            </div>
        </div>
        {designs.length > 0 && <section className={styles.materials} aria-labelledby={`${id}-materials`}><h2 id={`${id}-materials`}>{copy.materials}</h2><p className={styles.hint}>{copy.materialScope} {copy.materialHint}</p><div className={styles.materialGrid}><div><h3>{copy.banners}</h3>{materialList(materials.banners)}</div><div><h3>{copy.dyes}</h3>{materialList(materials.dyes)}</div><div><h3>{copy.wool}</h3>{materialList(materials.wool)}<p>{copy.sticks} × {materials.sticks}</p></div><div><h3>{copy.loom}</h3><p>× {materials.loom}</p></div></div></section>}
        <section className={styles.downloads} aria-labelledby={`${id}-downloads`}><h2 id={`${id}-downloads`}>{copy.downloads}</h2><div className={styles.buttons}>
            <button disabled={disabled || !!validation} onClick={() => void exportFile('png')}>{mode === 'designer' ? copy.png : copy.wordPng}</button>
            <button disabled={disabled || !!validation} onClick={() => void exportFile('json')}>{copy.json}</button>
            <button disabled={disabled || !!validation} onClick={() => void exportFile('text')}>{copy.textDownload}</button>
            <button disabled={disabled} onClick={() => void exportFile('project')}>{copy.project}</button>
            <button disabled={disabled} onClick={() => input.current?.click()}>{copy.open}</button>
            <input ref={input} type="file" accept=".json,application/json" hidden onChange={openProject} />
        </div><p className={styles.hint}>{copy.downloadHint}</p><p className={styles.hint}>{copy.fileHint}</p></section>
        <div className={styles.status} role="status" aria-live="polite">{busy && !awaitingReplacement ? copy.busy : notice}{busy && !awaitingReplacement && <button onClick={cancel}>{copy.cancel}</button>}</div>
    </section>;
}

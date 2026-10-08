'use client';

import React, { useEffect, useRef, useState } from 'react';
import { computeUsage, countBeads } from '@/lib/core/utils/utils';
import { downloadBlob } from '@/lib/core/printer/download';
import { trackPatternEvent } from '@/lib/analytics';
import { PatternHistory, PatternStroke, getPatternLinePoints } from '@/lib/editor/pattern-history';
import type { PatternPoint } from '@/lib/editor/pattern-edit';
import {
    JAPANESE_PALETTES, JAPANESE_PROJECT_MAX_BYTES, JapaneseGeneratorError, JapaneseRequestGate,
    generateJapanesePattern, inspectJapaneseProject, japaneseDownloadName, japaneseErrorMessage,
    loadJapaneseImage, loadJapanesePalette, readJapaneseImage, remapJapanesePattern,
    restoreJapaneseProject, serializeJapaneseProject, snapshotJapanesePattern,
    type JapanesePaletteId, type JapanesePattern, type JapaneseSettings,
} from '@/lib/japanese/generator';

type Tool = 'paint' | 'erase' | 'move';
type Source = { src: string; name: string };
const fieldClass = 'min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-sm';
const smallButton = 'min-h-11 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40';

export default function JapaneseGenerator() {
    const [source, setSource] = useState<Source | null>(null);
    const [pattern, setPattern] = useState<JapanesePattern | null>(null);
    const [settings, setSettings] = useState<JapaneseSettings>({ paletteId: 'perler', boardWidth: 1, boardHeight: 1 });
    const [fileName, setFileName] = useState('bead-pattern');
    const [busy, setBusy] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('画像を選ぶか、保存したプロジェクトを開いてください。');
    const [tool, setTool] = useState<Tool>('paint');
    const [colorRef, setColorRef] = useState('');
    const [cellSize, setCellSize] = useState(16);
    const [cursor, setCursor] = useState<PatternPoint>({ x: 0, y: 0 });
    const [historyState, setHistoryState] = useState({ undo: false, redo: false });
    const sourceInput = useRef<HTMLInputElement>(null);
    const projectInput = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const patternRef = useRef<JapanesePattern | null>(null);
    const requests = useRef(new JapaneseRequestGate());
    const history = useRef(new PatternHistory({ maxSteps: 100, byteBudget: 8 * 1024 * 1024 }));
    const stroke = useRef<{ edit: PatternStroke; point: PatternPoint; pointerId: number } | null>(null);
    const dirty = useRef(false);
    const exportInProgress = useRef(false);

    useEffect(() => {
        const gate = requests.current;
        return () => gate.cancel();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !pattern) return;
        canvas.width = pattern.width * cellSize;
        canvas.height = pattern.height * cellSize;
        const context = canvas.getContext('2d');
        if (!context) return;
        for (let y = 0; y < pattern.height; y++) {
            for (let x = 0; x < pattern.width; x++) {
                const offset = (y * pattern.width + x) * 4;
                const [r, g, b, alpha] = pattern.pixels.subarray(offset, offset + 4);
                context.fillStyle = alpha ? `rgb(${r},${g},${b})` : ((x + y) % 2 ? '#f1f1ed' : '#ffffff');
                context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
        context.strokeStyle = '#8f998f'; context.lineWidth = 0.5;
        context.beginPath();
        for (let x = 0; x <= pattern.width; x++) { context.moveTo(x * cellSize + 0.5, 0); context.lineTo(x * cellSize + 0.5, canvas.height); }
        for (let y = 0; y <= pattern.height; y++) { context.moveTo(0, y * cellSize + 0.5); context.lineTo(canvas.width, y * cellSize + 0.5); }
        context.stroke(); context.strokeStyle = '#243e36'; context.lineWidth = 2;
        context.beginPath();
        for (let x = 0; x <= pattern.width; x += 29) { context.moveTo(x * cellSize, 0); context.lineTo(x * cellSize, canvas.height); }
        for (let y = 0; y <= pattern.height; y += 29) { context.moveTo(0, y * cellSize); context.lineTo(canvas.width, y * cellSize); }
        context.stroke();
        context.strokeStyle = '#fff'; context.lineWidth = 4;
        context.strokeRect(cursor.x * cellSize + 2, cursor.y * cellSize + 2, cellSize - 4, cellSize - 4);
        context.strokeStyle = '#193cbe'; context.lineWidth = 2;
        context.strokeRect(cursor.x * cellSize + 2, cursor.y * cellSize + 2, cellSize - 4, cellSize - 4);
    }, [pattern, cellSize, cursor]);

    function syncHistory() { setHistoryState({ undo: history.current.canUndo, redo: history.current.canRedo }); }
    function publish(next: JapanesePattern, resetHistory = false) {
        patternRef.current = next;
        setPattern(next);
        if (resetHistory) { history.current.clear(); stroke.current = null; dirty.current = false; syncHistory(); }
    }
    function finishStroke() {
        if (!stroke.current) return;
        const patch = stroke.current.edit.finish();
        history.current.push(patch);
        if (patch) dirty.current = true;
        stroke.current = null;
        syncHistory();
    }
    function finishRequest(request: AbortController) { if (requests.current.isCurrent(request)) setBusy(null); }

    async function chooseImage(file: File | undefined) {
        if (!file || exporting) return;
        finishStroke();
        const request = requests.current.begin(); setBusy('画像を読み込んでいます…'); setError(null);
        try {
            const src = await readJapaneseImage(file, request.signal);
            if (!requests.current.isCurrent(request)) return;
            const name = japaneseDownloadName(file.name.replace(/\.[^.]+$/, ''));
            setSource({ src, name }); setFileName(name);
            setStatus('画像を読み込みました。設定を選び、「図案を作る」を押してください。表示中の図案はまだ変更されません。');
        } catch (cause) { if (requests.current.isCurrent(request)) setError(japaneseErrorMessage(cause, 'image_read')); }
        finally { finishRequest(request); }
    }

    async function generate() {
        if (busy || exporting) return;
        finishStroke();
        const current = patternRef.current;
        const sameSize = current && current.boardWidth === settings.boardWidth && current.boardHeight === settings.boardHeight;
        const sameSource = current && current.imageSrc === (source?.src ?? null);
        const onlyBrand = current && sameSize && sameSource && current.paletteId !== settings.paletteId;
        if (!onlyBrand && !source) { setError('図案を作り直すには、元になる画像を選んでください。開いた図案の編集・ブランド変更・保存は、このまま使えます。'); return; }
        if (current && !onlyBrand && (dirty.current || !sameSize || !sameSource) && !window.confirm('画像から図案を作り直します。現在の手作業で直した部分は置き換わります。必要なら、先にプロジェクトを保存してください。続けますか？')) return;
        const request = requests.current.begin(); setBusy(onlyBrand ? 'ブランドの色に変更しています…' : '図案を作っています…'); setError(null);
        const nextSettings = { ...settings };
        try {
            const palette = await loadJapanesePalette(nextSettings.paletteId, request.signal);
            const next = onlyBrand
                ? await remapJapanesePattern(current, nextSettings.paletteId, palette, request.signal)
                : await generateJapanesePattern(source!.src, nextSettings, palette, japaneseDownloadName(fileName), request.signal);
            if (!requests.current.isCurrent(request)) return;
            next.fileName = japaneseDownloadName(fileName);
            const retainedManualChanges = dirty.current;
            publish(next, true);
            if (onlyBrand) dirty.current = retainedManualChanges;
            setColorRef(next.palette.entries.find(entry => next.usage.has(entry.ref))?.ref ?? next.palette.entries[0]?.ref ?? '');
            setCursor(point => ({ x: Math.min(point.x, next.width - 1), y: Math.min(point.y, next.height - 1) }));
            setStatus(onlyBrand ? 'ビーズの位置と空白を残して、ブランドの色に変更しました。取り消し履歴は新しいブランドで始まります。' : next.usage.size ? '図案を作りました。色や輪郭を確認し、必要なマスを直して保存できます。' : '図案にビーズがありません。画像の透明部分や内容を確認してください。');
        } catch (cause) { if (requests.current.isCurrent(request)) setError(japaneseErrorMessage(cause)); }
        finally { finishRequest(request); }
    }

    async function openProject(file: File | undefined) {
        if (!file || exporting) return;
        finishStroke();
        const request = requests.current.begin(); setBusy('プロジェクトを開いています…'); setError(null);
        try {
            if (!file.size || file.size > JAPANESE_PROJECT_MAX_BYTES) throw new JapaneseGeneratorError('project');
            const raw = await file.text();
            if (!requests.current.isCurrent(request)) return;
            const { paletteId } = inspectJapaneseProject(raw);
            const palette = await loadJapanesePalette(paletteId, request.signal);
            const next = restoreJapaneseProject(raw, palette);
            if (next.imageSrc) await loadJapaneseImage(next.imageSrc, request.signal);
            if (!requests.current.isCurrent(request)) return;
            if (patternRef.current && dirty.current && !window.confirm('現在の図案には手作業で直した部分があります。選んだプロジェクトで置き換えますか？必要なら、キャンセルして先に現在のプロジェクトを保存してください。')) {
                setStatus('プロジェクトを開くのをキャンセルしました。現在の図案はそのまま残っています。');
                return;
            }
            publish(next, true);
            // A restored grid may already contain edits that differ from its source image.
            dirty.current = true;
            setSettings({ paletteId, boardWidth: next.boardWidth, boardHeight: next.boardHeight });
            setSource(next.imageSrc ? { src: next.imageSrc, name: next.fileName } : null);
            setFileName(next.fileName); setCursor({ x: 0, y: 0 });
            setColorRef(next.palette.entries.find(entry => next.usage.has(entry.ref))?.ref ?? next.palette.entries[0]?.ref ?? '');
            setStatus('保存した図案を開きました。編集したマスと空白も復元されています。');
        } catch (cause) { if (requests.current.isCurrent(request)) setError(japaneseErrorMessage(cause, 'project')); }
        finally { finishRequest(request); }
    }

    function saveProject() {
        if (!patternRef.current || busy || exporting) return;
        finishStroke();
        try {
            const name = japaneseDownloadName(fileName);
            const raw = serializeJapaneseProject({ ...patternRef.current, fileName: name });
            downloadBlob(new Blob([raw], { type: 'application/json' }), `${name}.bead-pattern.json`);
            setError(null); setStatus('プロジェクトの保存を開始しました。このページの「プロジェクトを開く」で続きを編集できます。');
        } catch (cause) { setError(japaneseErrorMessage(cause, 'export')); }
    }

    async function exportPattern(format: 'pdf' | 'png') {
        if (!patternRef.current || busy || exporting || exportInProgress.current) return;
        finishStroke();
        exportInProgress.current = true;
        setExporting(true); setError(null);
        try {
            const snapshot = snapshotJapanesePattern(patternRef.current, japaneseDownloadName(fileName));
            const { exportJapanesePattern } = await import('@/lib/japanese/export');
            await exportJapanesePattern(snapshot, format);
            trackPatternEvent({ name: 'pattern_export', paletteId: snapshot.paletteId, entryPoint: 'home', format: format === 'pdf' ? 'pdf' : 'grid_png' });
            setStatus(`${format === 'pdf' ? '印刷用PDF' : '図案PNG'}の保存を開始しました。ブラウザのダウンロードを確認してください。`);
        } catch (cause) { setError(japaneseErrorMessage(cause, 'export')); }
        finally { exportInProgress.current = false; setExporting(false); }
    }

    function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): PatternPoint | null {
        const current = patternRef.current;
        if (!current) return null;
        const box = event.currentTarget.getBoundingClientRect();
        const x = Math.floor((event.clientX - box.left) / box.width * current.width);
        const y = Math.floor((event.clientY - box.top) / box.height * current.height);
        return x >= 0 && y >= 0 && x < current.width && y < current.height ? { x, y } : null;
    }
    function drawPoints(points: PatternPoint[], erase = tool === 'erase') {
        const current = patternRef.current;
        if (!current || !stroke.current) return;
        const entry = current.palette.entries.find(candidate => candidate.ref === colorRef);
        if (!erase && !entry) return;
        const rgba: [number, number, number, number] = erase ? [0, 0, 0, 0] : [entry!.color.r, entry!.color.g, entry!.color.b, 255];
        let changed = false;
        for (const point of points) changed = stroke.current.edit.setPixel((point.y * current.width + point.x) * 4, rgba) || changed;
        if (changed) publish({ ...current, usage: computeUsage(current.pixels, [current.palette]) });
    }
    function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
        if (busy || exporting || tool === 'move' || !event.isPrimary || event.button !== 0) return;
        const point = pointFromEvent(event), current = patternRef.current;
        if (!point || !current) return;
        event.preventDefault(); event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        finishStroke(); stroke.current = { edit: new PatternStroke(current.pixels), point, pointerId: event.pointerId };
        setCursor(point); drawPoints([point]);
    }
    function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
        const active = stroke.current;
        if (!active || active.pointerId !== event.pointerId || busy || exporting) return;
        const point = pointFromEvent(event);
        if (!point) return;
        event.preventDefault(); drawPoints(getPatternLinePoints(active.point, point)); active.point = point; setCursor(point);
    }
    function pointerEnd(event: React.PointerEvent<HTMLCanvasElement>) {
        if (stroke.current?.pointerId === event.pointerId) finishStroke();
    }
    function undo(redo = false) {
        const current = patternRef.current;
        if (!current || busy || exporting) return;
        finishStroke();
        const patch = redo ? history.current.redo(current.pixels) : history.current.undo(current.pixels);
        if (patch) { dirty.current = true; publish({ ...current, usage: computeUsage(current.pixels, [current.palette]) }); }
        syncHistory();
    }
    function keyboard(event: React.KeyboardEvent<HTMLCanvasElement>) {
        const current = patternRef.current;
        if (!current || busy || exporting) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(event.shiftKey); return; }
        const directions: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (directions[event.key]) {
            event.preventDefault(); finishStroke();
            const [dx, dy] = directions[event.key];
            const next = { x: Math.max(0, Math.min(current.width - 1, cursor.x + dx)), y: Math.max(0, Math.min(current.height - 1, cursor.y + dy)) };
            setCursor(next);
            const viewport = viewportRef.current;
            if (viewport) {
                const x = next.x * cellSize, y = next.y * cellSize;
                if (x < viewport.scrollLeft) viewport.scrollLeft = x;
                else if (x + cellSize > viewport.scrollLeft + viewport.clientWidth) viewport.scrollLeft = x + cellSize - viewport.clientWidth;
                if (y < viewport.scrollTop) viewport.scrollTop = y;
                else if (y + cellSize > viewport.scrollTop + viewport.clientHeight) viewport.scrollTop = y + cellSize - viewport.clientHeight;
            }
        } else if (['Enter', ' ', 'Delete', 'Backspace'].includes(event.key)) {
            event.preventDefault(); finishStroke();
            if (tool === 'move' && (event.key === 'Enter' || event.key === ' ')) return;
            stroke.current = { edit: new PatternStroke(current.pixels), point: cursor, pointerId: -1 };
            drawPoints([cursor], event.key === 'Delete' || event.key === 'Backspace' || tool === 'erase'); finishStroke();
        }
    }

    const disabled = Boolean(busy || exporting);
    const totalBeads = pattern ? countBeads(pattern.usage) : 0;
    const appliedBrand = JAPANESE_PALETTES.find(item => item.id === pattern?.paletteId)?.label;
    const pending = pattern && (settings.paletteId !== pattern.paletteId || settings.boardWidth !== pattern.boardWidth || settings.boardHeight !== pattern.boardHeight || (source?.src ?? null) !== pattern.imageSrc);
    const selectedColor = pattern?.palette.entries.find(entry => entry.ref === colorRef);

    return (
        <section aria-label="日本語の図案作成ツール" className="mt-8 space-y-6">
            <div className="grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="space-y-6">
                    <section aria-labelledby="ja-image-title" className="space-y-3">
                        <h2 id="ja-image-title" className="text-lg font-semibold">1. 画像を選ぶ</h2>
                        <p className="text-sm leading-7 text-muted">PNG・JPEG・WebPの静止画像、8 MB・1,600万画素まで。画像はこのブラウザ内で処理します。</p>
                        <button type="button" className={`${smallButton} w-full`} disabled={exporting} onClick={() => sourceInput.current?.click()}>{source ? '画像を変更する' : '画像を選ぶ'}</button>
                        <input ref={sourceInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="読み込む画像" className="sr-only" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void chooseImage(file); }} />
                        {source && <figure className="rounded-md border border-line bg-white p-3">
                            {/* Local data URL; no image optimization or remote request. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={source.src} alt="読み込んだ元画像" className="mx-auto max-h-44 max-w-full object-contain" />
                            <figcaption className="mt-2 break-words text-xs leading-6 text-muted">{source.name}</figcaption>
                        </figure>}
                    </section>
                    <section aria-labelledby="ja-settings-title" className="space-y-3 border-t border-line pt-5">
                        <h2 id="ja-settings-title" className="text-lg font-semibold">2. 色と大きさを決める</h2>
                        <label className="block text-sm font-semibold">ビーズのブランド
                            <select className={`${fieldClass} mt-2`} value={settings.paletteId} disabled={disabled} onChange={event => setSettings(value => ({ ...value, paletteId: event.target.value as JapanesePaletteId }))}>
                                {JAPANESE_PALETTES.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                            </select>
                        </label>
                        <p className="text-xs leading-6 text-muted">29×29マスのミディ用プレートを使います。色番号は選んだブランドの番号です。</p>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="text-sm font-semibold">横のプレート数<select className={`${fieldClass} mt-2`} value={settings.boardWidth} disabled={disabled} onChange={event => setSettings(value => ({ ...value, boardWidth: Number(event.target.value) }))}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}枚</option>)}</select></label>
                            <label className="text-sm font-semibold">縦のプレート数<select className={`${fieldClass} mt-2`} value={settings.boardHeight} disabled={disabled} onChange={event => setSettings(value => ({ ...value, boardHeight: Number(event.target.value) }))}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}枚</option>)}</select></label>
                        </div>
                        <p className="text-sm text-muted">設定：{settings.boardWidth * 29} × {settings.boardHeight * 29}マス / プレート{settings.boardWidth * settings.boardHeight}枚</p>
                        <button type="button" className="button-primary w-full" disabled={disabled || (!source && !pattern)} onClick={() => void generate()}>{busy ?? '図案を作る'}</button>
                        <p className="text-xs leading-6 text-muted">ブランドだけの変更は、編集した位置と空白を残して色を変えます。プレート数を変えると、元画像から作り直します。</p>
                    </section>
                    <section aria-labelledby="ja-project-title" className="space-y-3 border-t border-line pt-5">
                        <h2 id="ja-project-title" className="text-base font-semibold">続きから作る</h2>
                        <button type="button" className={`${smallButton} w-full`} disabled={exporting} onClick={() => projectInput.current?.click()}>プロジェクトを開く</button>
                        <input ref={projectInput} type="file" accept=".json,.bead-pattern.json,application/json" aria-label="保存したプロジェクト" className="sr-only" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void openProject(file); }} />
                        <p className="text-xs leading-6 text-muted">このページは29×29マス・上記3ブランド・縦横1〜4枚に対応します。開いている英語の編集画面には影響しません。</p>
                    </section>
                </div>
                <div className="min-w-0 space-y-5">
                    <div role="status" aria-live="polite" className="rounded-md bg-[#e9eee7] px-4 py-3 text-sm leading-7">{exporting ? 'ファイルを準備しています。初回は少し時間がかかります…' : busy ?? status}</div>
                    {error && <p role="alert" className="rounded-md border border-[#b5444a] bg-[#fff5f3] px-4 py-3 text-sm leading-7">{error}</p>}
                    {!pattern ? <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-line px-6 text-center text-sm leading-8 text-muted">画像を選び、「図案を作る」を押すと<br />ここに編集できる図案が表示されます。</div> : <>
                        <section aria-labelledby="ja-edit-title" className="space-y-4">
                            <div><h2 id="ja-edit-title" className="text-lg font-semibold">3. マスを直す</h2><p className="mt-2 text-sm leading-7 text-muted">{appliedBrand} / {pattern.width} × {pattern.height}マス / {totalBeads.toLocaleString('ja-JP')}個 / {pattern.usage.size}色</p></div>
                            {pending && <p className="text-sm leading-7 text-[#795b16]">新しい画像や設定はまだ反映されていません。表示中の図案を変更するには「図案を作る」を押してください。保存されるのは表示中の図案です。</p>}
                            <div className="flex flex-wrap gap-2" aria-label="編集道具">
                                {([['paint', '色を置く'], ['erase', '消す'], ['move', '移動・スクロール']] as const).map(([id, label]) => <button type="button" key={id} className={`${smallButton} ${tool === id ? '!border-accent !bg-[#e2eee7]' : ''}`} aria-pressed={tool === id} disabled={disabled} onClick={() => { finishStroke(); setTool(id); }}>{label}</button>)}
                                <button type="button" className={smallButton} disabled={disabled || !historyState.undo} onClick={() => undo()}>元に戻す</button>
                                <button type="button" className={smallButton} disabled={disabled || !historyState.redo} onClick={() => undo(true)}>やり直す</button>
                            </div>
                            <div className="flex flex-wrap items-end gap-4">
                                <label className="min-w-0 flex-1 text-sm font-semibold">置く色（ブランドの色名・色番号）<select className={`${fieldClass} mt-2`} value={colorRef} disabled={disabled} onChange={event => { finishStroke(); setColorRef(event.target.value); }}>
                                    {pattern.palette.entries.filter(entry => entry.enabled && entry.color.a === 255).map(entry => <option key={entry.ref} value={entry.ref}>{entry.ref} — {entry.name}</option>)}
                                </select></label>
                                {selectedColor && <span aria-label={`選択色 ${selectedColor.ref}`} className="mb-1 block h-10 w-10 shrink-0 rounded border border-[#7c887a]" style={{ backgroundColor: `rgb(${selectedColor.color.r},${selectedColor.color.g},${selectedColor.color.b})` }} />}
                                <label className="text-sm font-semibold">表示倍率<select className={`${fieldClass} mt-2`} value={cellSize} onChange={event => { finishStroke(); setCellSize(Number(event.target.value)); }}>{[[8, '50%'], [16, '100%'], [24, '150%'], [32, '200%']].map(([size, label]) => <option key={size} value={size}>{label}</option>)}</select></label>
                            </div>
                            <p id="ja-canvas-help" className="text-xs leading-6 text-muted">色を置く・消す：マスを押すか、なぞります。スマートフォンで図案を動かすときは「移動・スクロール」を選びます。キーボード：図案にフォーカスして矢印キーで移動、Enter・スペースで配置、Deleteで消去、Ctrl / ⌘ + Zで戻します。</p>
                            <div ref={viewportRef} className="max-h-[65vh] min-h-52 overflow-auto rounded-md border border-line bg-white" aria-label="拡大図案のスクロール領域">
                                <canvas ref={canvasRef} tabIndex={0} role="img" aria-label={`編集できる図案、${pattern.width}列、${pattern.height}行。選択位置は${cursor.y + 1}行${cursor.x + 1}列。`} aria-describedby="ja-canvas-help ja-cursor" className="block max-w-none outline-offset-[-3px]" style={{ width: pattern.width * cellSize, height: pattern.height * cellSize, touchAction: tool === 'move' ? 'pan-x pan-y' : 'none', cursor: tool === 'move' ? 'grab' : 'crosshair' }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onKeyDown={keyboard} onBlur={finishStroke} />
                            </div>
                            <p id="ja-cursor" className="text-xs leading-6 text-muted">選択位置：{cursor.y + 1}行・{cursor.x + 1}列。白と灰色の交互のマスは空白（ビーズなし）です。青い枠は操作位置で、保存する図案には入りません。</p>
                        </section>
                        <section aria-labelledby="ja-save-title" className="space-y-4 border-t border-line pt-5">
                            <h2 id="ja-save-title" className="text-lg font-semibold">4. 図案を保存する</h2>
                            <label className="block max-w-md text-sm font-semibold">保存するファイル名<input className={`${fieldClass} mt-2`} value={fileName} maxLength={120} disabled={disabled} onChange={event => setFileName(event.target.value)} /></label>
                            <div className="flex flex-wrap gap-3">
                                <button type="button" className="button-primary" disabled={disabled || totalBeads === 0} onClick={() => void exportPattern('pdf')}>印刷用PDFを保存</button>
                                <button type="button" className="button-secondary" disabled={disabled || totalBeads === 0} onClick={() => void exportPattern('png')}>図案PNGを保存</button>
                                <button type="button" className="button-secondary" disabled={disabled} onClick={saveProject}>プロジェクトを保存</button>
                            </div>
                            <p className="text-sm leading-7 text-muted">PDFは日本語の説明・材料表付きで、プレートごとに分かれます。A4・倍率100%（実際のサイズ）で印刷し、50 mmの線とプレートの間隔を定規で確認してください。</p>
                            <p className="text-sm leading-7 text-muted">図案PNGは説明と材料表付きの画像です。印刷時の大きさはPDFと異なるため、原寸の確認にはPDFを使ってください。画面や印刷の色は実物と異なります。実物制作・アイロン仕上げは未検証です。</p>
                        </section>
                    </>}
                </div>
            </div>
        </section>
    );
}

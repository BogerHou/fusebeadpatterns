'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../ui/Button';
import type { SiteLocale } from '@/lib/i18n/locales';
import type { EditorDraft } from '@/lib/editor/draft';
import { getPaletteDisplayLabel, getPaletteOption } from '@/lib/editor/config';
import { getPixelBeadCopy } from '@/lib/pixel-grid/bead-copy';
import { PIXEL_BEAD_QUERY, ackPixelBeadTransfer, clearPixelBeadQuery, dismissPixelBeadTransfer,
    peekPixelBeadTransfer, type PixelBeadTransfer } from '@/lib/pixel-grid/bead-transfer';

type Props = {
    locale: SiteLocale;
    hasCurrentPattern: boolean;
    canSaveCurrentPattern: boolean;
    busy: boolean;
    onOpen: (draft: EditorDraft, signal: AbortSignal) => Promise<void>;
    onSave: () => void;
    onLoadingChange: (loading: boolean) => void;
    onReturnChange: () => void;
    onNotice: (message: string) => void;
};

/** A pending handoff is a request, not permission to replace a saved drawing. */
export function PixelBeadEntry(props: Props) {
    const query = useSearchParams().get(PIXEL_BEAD_QUERY);
    const copy = getPixelBeadCopy(props.locale);
    const [incoming, setIncoming] = useState<PixelBeadTransfer | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const taskRef = useRef<AbortController | null>(null);
    const latest = useRef(props);
    latest.current = props;
    useEffect(() => {
        taskRef.current?.abort();
        taskRef.current = null;
        setLoading(false);
        latest.current.onLoadingChange(false);
        setIncoming(null);
        setError(false);
        if (query !== null) {
            try {
                const transfer = peekPixelBeadTransfer(window.location.href, window.sessionStorage);
                setIncoming(transfer);
                setError(transfer === null);
            }
            catch { setError(true); }
        }
        latest.current.onReturnChange();
        return () => {
            taskRef.current?.abort();
            taskRef.current = null;
            latest.current.onLoadingChange(false);
        };
    }, [query, attempt]);

    function clearQuery() {
        window.history.replaceState(null, '', clearPixelBeadQuery(window.location.href));
        latest.current.onReturnChange();
    }
    function keepCurrent() {
        taskRef.current?.abort();
        taskRef.current = null;
        setLoading(false);
        latest.current.onLoadingChange(false);
        try { if (incoming) dismissPixelBeadTransfer(incoming.key, window.sessionStorage); }
        catch { latest.current.onNotice(copy.dismissWarning); }
        clearQuery();
    }
    async function open() {
        if (!incoming || props.busy || loading) return;
        const task = new AbortController();
        taskRef.current = task;
        setLoading(true);
        setError(false);
        latest.current.onLoadingChange(true);
        try {
            await latest.current.onOpen(incoming.draft, task.signal);
            if (taskRef.current !== task || task.signal.aborted) return;
            try { ackPixelBeadTransfer(incoming.key, window.sessionStorage); }
            catch { latest.current.onNotice(copy.ackWarning); }
            clearQuery();
        } catch {
            if (taskRef.current === task && !task.signal.aborted) setError(true);
        } finally {
            if (taskRef.current === task) {
                taskRef.current = null;
                setLoading(false);
                latest.current.onLoadingChange(false);
            }
        }
    }
    if (query === null) return null;
    const summary = incoming ? copy.receiveSummary.replace('{width}', String(incoming.sourceWidth)).replace('{height}', String(incoming.sourceHeight)) : null;
    const layout = incoming ? copy.incomingLayout.replace('{columns}', String(incoming.draft.boardWidth))
        .replace('{rows}', String(incoming.draft.boardHeight)).replace('{brand}', getPaletteDisplayLabel(getPaletteOption(incoming.draft.selectedPaletteIds[0]))) : null;
    return <section aria-label={copy.receiveTitle} className="shrink-0 space-y-2 border-b border-[#d9ded5] bg-brand-yellow/20 px-3 py-3 text-sm">
        <p className="font-semibold">{copy.receiveTitle}</p>
        {summary ? <p>{summary} {layout}</p> : null}
        {props.hasCurrentPattern ? <p>{copy.replaceWarning}</p> : null}
        {error ? <p role="alert">{copy.error}</p> : null}
        {loading ? <p role="status">{copy.preparing}</p> : null}
        <div className="flex flex-wrap gap-2">
            {incoming ? <Button type="button" size="sm" disabled={props.busy || loading} onClick={() => void open()}>{copy.openIncoming}</Button> : null}
            {error ? <Button type="button" size="sm" disabled={loading || props.busy} onClick={() => setAttempt(n => n + 1)}>{copy.retry}</Button> : null}
            {props.canSaveCurrentPattern ? <Button type="button" size="sm" disabled={loading || props.busy} onClick={props.onSave}>{copy.saveCurrent}</Button> : null}
            <Button type="button" size="sm" onClick={keepCurrent}>{loading ? copy.cancel : copy.keepCurrent}</Button>
        </div>
    </section>;
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../ui/Button';
import type { SiteLocale } from '@/lib/i18n/locales';
import type { EditorDraft } from '@/lib/editor/draft';
import { getPaletteDisplayLabel, getPaletteOption } from '@/lib/editor/config';
import { preparePixelBeadEditorDraft } from '@/lib/editor/pixel-bead-entry';
import { getProjectOpenCopy } from '@/lib/editor/project-open-copy';
import { getPixelBeadCopy } from '@/lib/pixel-grid/bead-copy';
import {
    EXTENSION_PROJECT_QUERY, WEBSITE_MESSAGE_SOURCE, EXTENSION_MESSAGE_SOURCE,
    isExtensionToken, isExtensionProjectMessage, parseExtensionProject,
} from '@/lib/browser-extension/protocol';

const messages = {
    en: {
        title: 'Pattern from your browser extension',
        waiting: 'Waiting for the extension…',
        error: 'The pattern could not be received. Retry, or download the project in the extension and open that file here.',
        open: 'Open this pattern',
        keep: 'Keep current work',
        warning: 'Opening this pattern replaces your current work and clears Undo/Redo. Save a project copy first if needed.',
    },
    de: {
        title: 'Vorlage aus deiner Browser-Erweiterung',
        waiting: 'Die Erweiterung wird verbunden…',
        error: 'Die Vorlage konnte nicht empfangen werden. Versuche es erneut oder lade die Projektdatei in der Erweiterung herunter und öffne sie hier.',
        open: 'Diese Vorlage öffnen',
        keep: 'Aktuelle Arbeit behalten',
        warning: 'Diese Vorlage ersetzt deine aktuelle Arbeit und löscht den Verlauf für Rückgängig/Wiederholen. Speichere bei Bedarf vorher eine Projektkopie.',
    },
    fr: {
        title: 'Modèle provenant de votre extension',
        waiting: 'Connexion à l’extension…',
        error: 'Impossible de recevoir le modèle. Réessayez ou téléchargez le projet dans l’extension et ouvrez ce fichier ici.',
        open: 'Ouvrir ce modèle',
        keep: 'Conserver le travail actuel',
        warning: 'Ce modèle remplace votre travail actuel et efface l’historique d’annulation. Enregistrez d’abord une copie du projet si nécessaire.',
    },
    ja: {
        title: 'ブラウザ拡張機能からの図案',
        waiting: '拡張機能に接続しています…',
        error: '図案を受信できませんでした。再試行するか、拡張機能でプロジェクトを保存して、この画面で開いてください。',
        open: 'この図案を開く',
        keep: '現在の作業を保持',
        warning: '図案を開くと現在の作業を置き換え、元に戻す・やり直すの履歴を消去します。必要に応じて先にプロジェクトを保存してください。',
    },
} satisfies Record<SiteLocale, Record<string, string>>;

type Props = {
    locale: SiteLocale;
    hasCurrentPattern: boolean;
    canSaveCurrentPattern: boolean;
    busy: boolean;
    onOpen: (draft: EditorDraft, signal: AbortSignal) => Promise<void>;
    onSave: () => void;
    onLoadingChange: (loading: boolean) => void;
};

/** The parent mounts this only after draft restoration. A fresh editor can open
 * the requested grid immediately; existing work always keeps the save/confirm
 * boundary before the atomic installation callback. */
export function ExtensionPatternEntry(props: Props) {
    const query = useSearchParams().get(EXTENSION_PROJECT_QUERY);
    const copy = messages[props.locale];
    const common = getPixelBeadCopy(props.locale);
    const [incoming, setIncoming] = useState<EditorDraft | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const latest = useRef(props);
    latest.current = props;
    const taskRef = useRef<AbortController | null>(null);
    const autoAttemptRef = useRef<EditorDraft | null>(null);
    const incomingQueryRef = useRef<string | null>(null);

    useEffect(() => {
        taskRef.current?.abort();
        taskRef.current = null;
        autoAttemptRef.current = null;
        incomingQueryRef.current = null;
        setIncoming(null);
        setLoading(false);
        latest.current.onLoadingChange(false);
        setError(query !== null && !isExtensionToken(query));
        if (!isExtensionToken(query)) return;
        let received = false;
        const onMessage = (event: MessageEvent<unknown>) => {
            if (received || event.source !== window || event.origin !== window.location.origin) return;
            if (isExtensionProjectMessage(event.data, query)) {
                const draft = parseExtensionProject(event.data.project);
                if (!draft) { setError(true); return; }
                try {
                    // Check the complete raster detached from the live editor.
                    // The same preparation runs again at the atomic install boundary.
                    preparePixelBeadEditorDraft(draft, { allowIndependentBoardLayout: true });
                    received = true;
                    incomingQueryRef.current = query;
                    setIncoming(draft);
                    setError(false);
                } catch { setError(true); }
            } else if (event.data && typeof event.data === 'object') {
                const data = event.data as Record<string, unknown>;
                if (data.source === EXTENSION_MESSAGE_SOURCE && data.type === 'extension-error' && data.token === query) setError(true);
            }
        };
        const ready = () => {
            if (!received) window.postMessage({ source: WEBSITE_MESSAGE_SOURCE, type: 'extension-ready', token: query }, window.location.origin);
        };
        window.addEventListener('message', onMessage);
        ready();
        // A document-start content script and React hydration can arrive in either order.
        let retries = 0;
        const interval = window.setInterval(() => {
            if (received || ++retries >= 15) {
                window.clearInterval(interval);
                if (!received) setError(true);
            } else ready();
        }, 1_000);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener('message', onMessage);
            taskRef.current?.abort();
            taskRef.current = null;
            latest.current.onLoadingChange(false);
        };
    }, [query, attempt]);

    const finish = useCallback((type: 'extension-accepted' | 'extension-dismissed') => {
        if (isExtensionToken(query)) window.postMessage({ source: WEBSITE_MESSAGE_SOURCE, type, token: query }, window.location.origin);
        const url = new URL(window.location.href);
        url.searchParams.delete(EXTENSION_PROJECT_QUERY);
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }, [query]);
    function keepCurrent() {
        taskRef.current?.abort();
        taskRef.current = null;
        setLoading(false);
        latest.current.onLoadingChange(false);
        finish('extension-dismissed');
    }
    const open = useCallback(async (automatic = false) => {
        if (!isExtensionToken(query) || !incoming || incomingQueryRef.current !== query || latest.current.busy || taskRef.current) return;
        // Recheck live props at the installation boundary: the person may have
        // started a new document while the extension's reply was arriving.
        if (latest.current.hasCurrentPattern) {
            if (automatic || !window.confirm(getProjectOpenCopy(latest.current.locale).replaceConfirm)) return;
        }
        const task = new AbortController();
        taskRef.current = task;
        setLoading(true);
        setError(false);
        latest.current.onLoadingChange(true);
        try {
            await latest.current.onOpen(incoming, task.signal);
            if (taskRef.current === task && !task.signal.aborted) finish('extension-accepted');
        } catch {
            if (taskRef.current === task && !task.signal.aborted) setError(true);
        } finally {
            if (taskRef.current === task) {
                taskRef.current = null;
                setLoading(false);
                latest.current.onLoadingChange(false);
            }
        }
    }, [incoming, query, finish]);
    useEffect(() => {
        if (!incoming || props.hasCurrentPattern || props.busy || taskRef.current || autoAttemptRef.current === incoming) return;
        autoAttemptRef.current = incoming;
        void open(true);
    }, [incoming, props.hasCurrentPattern, props.busy, open]);
    if (query === null) return null;
    return <section aria-label={copy.title} className="shrink-0 space-y-2 border-b border-[#d9ded5] bg-brand-yellow/20 px-3 py-3 text-sm">
        <p className="font-semibold">{copy.title}</p>
        {incoming?.editedPattern ? <p>{incoming.editedPattern.width} × {incoming.editedPattern.height} · {incoming.selectedPaletteIds.map(id => getPaletteDisplayLabel(getPaletteOption(id))).join(', ')}</p> : null}
        {props.hasCurrentPattern ? <p>{copy.warning}</p> : null}
        {error ? <p role="alert">{copy.error}</p> : !incoming ? <p role="status">{copy.waiting}</p> : null}
        {loading ? <p role="status">{common.preparing}</p> : null}
        <div className="flex flex-wrap gap-2">
            {incoming ? <Button type="button" size="sm" disabled={props.busy || loading} onClick={() => void open()}>{copy.open}</Button> : null}
            {error && !incoming ? <Button type="button" size="sm" disabled={props.busy || loading} onClick={() => setAttempt(n => n + 1)}>{common.retry}</Button> : null}
            {props.canSaveCurrentPattern ? <Button type="button" size="sm" disabled={props.busy || loading} onClick={props.onSave}>{common.saveCurrent}</Button> : null}
            <Button type="button" size="sm" onClick={keepCurrent}>{loading ? common.cancel : copy.keep}</Button>
        </div>
    </section>;
}

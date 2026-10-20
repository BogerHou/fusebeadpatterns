import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '../../../src/components/editor/Editor';
import type { EditorHomeHost } from '../../../src/lib/editor/home-host';
import { serializeEditorProject, type EditorDraft } from '../../../src/lib/editor/draft';
import { isExtensionToken, sanitizeHomepageCaptureDraft, WEBSITE_ORIGIN } from '../../../src/lib/browser-extension/protocol';
import { SourceImportError, importCapturedSource, type SourceImportResponse } from '../../../src/lib/browser-extension/source-import';
import { getSourceCropCopy } from '../../../src/lib/editor/source-crop-copy';
import type { SiteLocale } from '../../../src/lib/i18n/locales';
import { CaptureSiteContext } from './site-adapter';
import LanguageSwitcher from './LanguageSwitcher';
import { capturedImageFile } from '../../../src/lib/browser-extension/captured-file';
import { captureCopy, captureSourceErrorKey, type CaptureTextKey } from './capture-copy';
import '../../../src/app/globals.css';
import './studio.css';

declare const BEAD_CAPTURE_EDITOR_TRANSFER_ENABLED: boolean;
const transferEnabled = BEAD_CAPTURE_EDITOR_TRANSFER_ENABLED;
const browser = typeof chrome !== 'undefined' && typeof chrome.runtime?.sendMessage === 'function' ? chrome : null;
type SourceInfo = { ok: boolean; originPattern?: string; permissionGranted?: boolean; error?: string };
type ImageAccessScope = 'selected-host' | 'all-websites';
type CaptureProgress = 'checking' | 'loading' | 'preparing' | 'openingEditor';
type CaptureNotice = CaptureTextKey | 'imageReady' | 'imageImportFailed';

const progressCopy = {
    en: { checking: 'Getting your selected image ready…', loading: 'Loading your selected image…', preparing: 'Preparing your image and making the bead pattern…', openingEditor: 'Opening the website editor…', ready: 'Image loaded. Adjust the pattern below, or open the editor to refine it.' },
    de: { checking: 'Ausgewähltes Bild wird vorbereitet…', loading: 'Ausgewähltes Bild wird geladen…', preparing: 'Bild wird verarbeitet und die Bügelperlenvorlage erstellt…', openingEditor: 'Website-Editor wird geöffnet…', ready: 'Bild geladen. Passe die Vorlage unten an oder öffne sie im Editor.' },
    fr: { checking: 'Préparation de votre image…', loading: 'Chargement de votre image…', preparing: 'Traitement de l’image et création du modèle de perles…', openingEditor: 'Ouverture de l’éditeur du site…', ready: 'Image chargée. Ajustez le modèle ci-dessous ou ouvrez-le dans l’éditeur.' },
    ja: { checking: '選択した画像を準備しています…', loading: '選択した画像を読み込んでいます…', preparing: '画像を処理してビーズ図案を作成しています…', openingEditor: 'ウェブサイトの編集画面を開いています…', ready: '画像を読み込みました。下で図案を調整するか、編集画面を開いてください。' },
};

const workspaceCopy = {
    en: { title: 'Image to bead pattern', local: 'Processed on this device. Save your project before closing.', privacy: 'Privacy' },
    de: { title: 'Bild in Bügelperlen umwandeln', local: 'Verarbeitung auf diesem Gerät. Projekt vor dem Schließen speichern.', privacy: 'Datenschutz' },
    fr: { title: 'Image en modèle de perles', local: 'Traitement sur cet appareil. Enregistrez le projet avant de fermer.', privacy: 'Confidentialité' },
    ja: { title: '画像からアイロンビーズ図案を作成', local: 'この端末内で処理します。閉じる前にプロジェクトを保存してください。', privacy: 'プライバシー' },
};

function CaptureApp() {
    const [locale, setLocale] = useState<SiteLocale>('en');
    const [requestOpenEditor, setRequestOpenEditor] = useState(0);
    const [cancelIncomingImage, setCancelIncomingImage] = useState(0);
    const [incomingImage, setIncomingImage] = useState<EditorHomeHost['incomingImage']>();
    const [origin, setOrigin] = useState<string | null>(null);
    const [notice, setNotice] = useState<CaptureNotice | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState<CaptureProgress | null>(() => new URLSearchParams(location.search).has('source') ? 'checking' : null);
    const [pendingPermission, setPendingPermission] = useState(false);
    const [sourceToken] = useState(() => new URLSearchParams(location.search).get('source'));
    const revision = useRef(0);
    const consumed = useRef(false);
    const permissionGranted = useRef(false);
    const incomingId = useRef<string | null>(null);

    useEffect(() => { document.documentElement.lang = locale; }, [locale]);

    const cancelSource = useCallback(() => {
        revision.current++;
        consumed.current = true;
        incomingId.current = null;
        setCancelIncomingImage(value => value + 1);
        setIncomingImage(undefined);
        setLoading(false);
        setProgress(null);
        setPendingPermission(false);
        setNotice(null);
        setError(false);
    }, []);

    const readImage = useCallback(async (token: string, pattern: string, granted: boolean, scope: ImageAccessScope = 'selected-host') => {
        if (!browser) return;
        const version = ++revision.current;
        const current = () => version === revision.current && !consumed.current;
        let handedToEditor = false;
        setError(false);
        setLoading(true);
        setNotice(null);
        setProgress('checking');
        try {
            await importCapturedSource({
                permissionGranted: granted,
                requestPermission: () => browser.permissions.request({
                    origins: scope === 'all-websites' ? ['http://*/*', 'https://*/*'] : [pattern],
                }),
                // A successful grant remains valid even if this download fails.
                // Retry the image without asking for that grant again.
                onPermissionGranted: () => {
                    permissionGranted.current = true;
                    setPendingPermission(false);
                },
                readSource: () => browser.runtime.sendMessage<SourceImportResponse>({ type: 'fetch-source', token }),
                openImage: async dataUrl => {
                    const file = capturedImageFile(dataUrl);
                    if (!current()) return false;
                    const id = `${token}:${version}`;
                    incomingId.current = id;
                    handedToEditor = true;
                    setIncomingImage({ id, file });
                    setProgress('preparing');
                    return true;
                },
                // The shared homepage automatically generates after its atomic image import.
                makePattern: async () => {},
                isCurrent: current,
                onLoading: () => setProgress('loading'),
            });
        } catch (cause) {
            if (!current()) return;
            const code = cause instanceof SourceImportError ? cause.code : '';
            if (code === 'permission_denied' || code === 'permission_required') {
                permissionGranted.current = false;
                setPendingPermission(true);
            }
            setNotice(captureSourceErrorKey(cause));
            setError(true);
            setProgress(null);
        } finally {
            if (current() && !handedToEditor) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!sourceToken || !browser) return;
        if (!isExtensionToken(sourceToken)) {
            setProgress(null);
            setNotice('invalidSource');
            setError(true);
            return;
        }
        const version = revision.current;
        let stopped = false;
        void browser.runtime.sendMessage<SourceInfo>({ type: 'read-source', token: sourceToken }).then(async info => {
            if (stopped || consumed.current || revision.current !== version) return;
            if (!info.ok || !info.originPattern) throw new SourceImportError(info.error || 'unsupported_source');
            setOrigin(info.originPattern);
            const granted = typeof info.permissionGranted === 'boolean' ? info.permissionGranted
                : await browser.permissions.contains({ origins: [info.originPattern] });
            if (stopped || consumed.current || revision.current !== version) return;
            permissionGranted.current = granted;
            if (granted) await readImage(sourceToken, info.originPattern, true);
            else {
                setProgress(null);
                setPendingPermission(true);
                setNotice('permissionChoices');
            }
        }).catch(cause => {
            if (stopped || consumed.current || revision.current !== version) return;
            setNotice(captureSourceErrorKey(cause));
            setError(true);
            setProgress(null);
        });
        return () => { stopped = true; };
    }, [sourceToken, readImage]);

    const openEditor = useCallback(async (draft: EditorDraft) => {
        const text = captureCopy[locale];
        if (!transferEnabled) throw new Error(text.transferUnavailable);
        if (!browser) throw new Error(text.installExtension);
        const safeDraft = sanitizeHomepageCaptureDraft(draft);
        if (!safeDraft) throw new Error(text.prepareFailed);
        setProgress('openingEditor');
        let response: { ok: boolean; error?: string };
        try {
            response = await browser.runtime.sendMessage<{ ok: boolean; error?: string }>({
                type: 'create-handoff', project: serializeEditorProject(safeDraft), locale,
            });
        } finally {
            setProgress(null);
        }
        if (!response.ok) throw new Error(response.error === 'handoff_too_large'
            ? text.transferTooLarge
            : response.error === 'handoff_storage_full'
                ? text.transferFull
                : text.transferFailed);
        setNotice('editorOpened');
        setError(false);
    }, [locale]);

    const homeHost = useMemo<EditorHomeHost>(() => ({
        incomingImage, requestOpenEditor, cancelIncomingImage,
        onOpenEditor: openEditor,
        onUserSourceChange: cancelSource,
        onImageError: id => { if (incomingId.current === id) { setNotice('imageImportFailed'); setError(true); setProgress(null); } },
        onImageConsumed: id => {
            if (incomingId.current !== id) return;
            incomingId.current = null;
            consumed.current = true;
            setIncomingImage(undefined);
            setLoading(false);
            setProgress(null);
            setNotice(current => current || 'imageReady');
        },
    }), [incomingImage, requestOpenEditor, cancelIncomingImage, openEditor, cancelSource]);

    const context = useMemo(() => ({ locale, setLocale, openEditor: () => setRequestOpenEditor(value => value + 1) }), [locale]);
    const copy = workspaceCopy[locale];
    const text = captureCopy[locale];
    const statusText = progress ? progressCopy[locale][progress]
        : notice === 'imageReady' ? progressCopy[locale].ready
        : notice === 'imageImportFailed' ? getSourceCropCopy(locale).uploadError
        : notice ? text[notice] : '';
    return <CaptureSiteContext.Provider value={context}>
            <main id="main-content" tabIndex={-1} className="capture-workspace">
                <header className="capture-heading">
                    <h1>{copy.title}</h1>
                    <LanguageSwitcher locale={locale} />
                </header>
                {statusText ? <section className="capture-notice" data-error={error && !progress} data-progress={progress || undefined} aria-label={text.selectedImage}>
                    <p className="capture-loading-status" role={error && !progress ? 'alert' : 'status'} aria-live={error && !progress ? 'assertive' : 'polite'} aria-atomic="true">
                        {progress ? <span className="capture-loading-spinner" aria-hidden="true" /> : null}
                        <span>{statusText}</span>
                    </p>
                    {origin && !consumed.current ? <p className="text-muted text-xs">{origin.replace(/\/\*$/, '')}</p> : null}
                    {origin && sourceToken && !consumed.current ? <>
                        <button type="button" className="button-primary" disabled={loading} onClick={() => void readImage(sourceToken, origin, permissionGranted.current, pendingPermission ? 'all-websites' : 'selected-host')}>
                            {loading ? text.loadingImage : pendingPermission ? text.allowAll : text.retryImage}
                        </button>
                        {pendingPermission ? <button type="button" className="button-secondary" disabled={loading} onClick={() => void readImage(sourceToken, origin, false, 'selected-host')}>
                            {text.allowHost}
                        </button> : null}
                        <button type="button" className="button-secondary" onClick={cancelSource}>{text.useLocal}</button>
                    </> : null}
                </section> : null}
                <section id="generator" aria-label={copy.title}>
                    <Editor locale={locale} homeHost={homeHost} />
                </section>
                <footer className="capture-footer">
                    <p>{copy.local}</p>
                    <a href={`${WEBSITE_ORIGIN}${locale === 'en' ? '' : `/${locale}`}/privacy-policy`} target="_blank" rel="noopener noreferrer">{copy.privacy}</a>
                </footer>
            </main>
    </CaptureSiteContext.Provider>;
}

const root = document.getElementById('capture-root');
if (root) {
    // The small HTML shell paints while the converter JS and CSS are loading.
    // Keep it in place until styles are ready, avoiding an unstyled workspace.
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'studio.css';
    stylesheet.onload = () => createRoot(root).render(<CaptureApp />);
    stylesheet.onerror = () => {
        const status = document.getElementById('capture-startup-status');
        const description = document.getElementById('capture-startup-description');
        if (status) status.textContent = 'The converter could not finish loading.';
        if (description) {
            description.textContent = 'Reload this page to try again. Your selected image has not been changed.';
            const reload = document.createElement('button');
            reload.type = 'button';
            reload.className = 'capture-loading-reload';
            reload.textContent = 'Reload converter';
            reload.onclick = () => location.reload();
            description.after(reload);
        }
        root.querySelector('.capture-loading-spinner')?.remove();
    };
    document.head.append(stylesheet);
}

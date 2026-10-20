import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '../../../src/components/editor/Editor';
import SiteHeader from '../../../src/components/layout/SiteHeader';
import HomeHero from '../../../src/components/layout/HomeHero';
import HomeGeneratorSection from '../../../src/components/layout/HomeGeneratorSection';
import type { EditorHomeHost } from '../../../src/lib/editor/home-host';
import { serializeEditorProject, type EditorDraft } from '../../../src/lib/editor/draft';
import { isExtensionToken, sanitizeHomepageCaptureDraft, WEBSITE_ORIGIN } from '../../../src/lib/browser-extension/protocol';
import { SourceImportError, importCapturedSource, sourceImportErrorMessage, type SourceImportResponse } from '../../../src/lib/browser-extension/source-import';
import type { SiteLocale } from '../../../src/lib/i18n/locales';
import { CaptureSiteContext, SiteLink, SiteImage } from './site-adapter';
import { capturedImageFile } from '../../../src/lib/browser-extension/captured-file';
import study from '../../../src/components/patterns/PatternStudy.module.css';
import '../../../src/app/globals.css';
import '../../../src/app/home.css';
import './studio.css';

declare const BEAD_CAPTURE_EDITOR_TRANSFER_ENABLED: boolean;
const transferEnabled = BEAD_CAPTURE_EDITOR_TRANSFER_ENABLED;
const browser = typeof chrome !== 'undefined' && typeof chrome.runtime?.sendMessage === 'function' ? chrome : null;
type SourceInfo = { ok: boolean; originPattern?: string; permissionGranted?: boolean; error?: string };

function OriginalStudy() {
    const [view, setView] = useState<'beads' | 'pixels'>('beads');
    return <figure className={study.study}>
        <div className={study.topline}><span className="eyebrow">From pixels to beads</span>
            <div className={study.controls} role="group" aria-label="Pattern preview">
                <button type="button" aria-pressed={view === 'pixels'} onClick={() => setView('pixels')}>Pixels</button>
                <button type="button" aria-pressed={view === 'beads'} onClick={() => setView('beads')}>Beads</button>
            </div>
        </div>
        <div className={study.art}><SiteImage src={`/sample/${view === 'beads' ? 'beads.svg' : 'pixels.png'}`} width={580} height={580} alt="Original bat bead pattern" /></div>
        <figcaption className={study.caption}><div><span className={study.title}>A little bat</span><span className={study.note}>An original pattern, one bead at a time.</span></div>
            <SiteLink href="/patterns/halloween-bat" className={study.open} aria-label="View bat pattern">↗</SiteLink>
        </figcaption>
    </figure>;
}

function CaptureApp() {
    const [locale, setLocale] = useState<SiteLocale>('en');
    const [requestOpenEditor, setRequestOpenEditor] = useState(0);
    const [cancelIncomingImage, setCancelIncomingImage] = useState(0);
    const [incomingImage, setIncomingImage] = useState<EditorHomeHost['incomingImage']>();
    const [origin, setOrigin] = useState<string | null>(null);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
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
        setPendingPermission(false);
        setNotice('');
        setError(false);
    }, []);

    const readImage = useCallback(async (token: string, pattern: string, granted: boolean) => {
        if (!browser) return;
        const version = ++revision.current;
        const current = () => version === revision.current && !consumed.current;
        let handedToEditor = false;
        setError(false);
        setLoading(true);
        try {
            await importCapturedSource({
                permissionGranted: granted,
                requestPermission: () => browser.permissions.request({ origins: [pattern] }),
                readSource: () => browser.runtime.sendMessage<SourceImportResponse>({ type: 'fetch-source', token }),
                openImage: async dataUrl => {
                    const file = capturedImageFile(dataUrl);
                    if (!current()) return false;
                    permissionGranted.current = true;
                    setPendingPermission(false);
                    const id = `${token}:${version}`;
                    incomingId.current = id;
                    handedToEditor = true;
                    setIncomingImage({ id, file });
                    setNotice('Preparing your image…');
                    return true;
                },
                // The shared homepage automatically generates after its atomic image import.
                makePattern: async () => {},
                isCurrent: current,
                onLoading: () => setNotice('Loading your selected image…'),
            });
        } catch (cause) {
            if (!current()) return;
            const code = cause instanceof SourceImportError ? cause.code : '';
            if (code === 'permission_denied' || code === 'permission_required') {
                permissionGranted.current = false;
                setPendingPermission(true);
            }
            setNotice(code === 'image_dimensions'
                ? 'This image is larger than 2048 pixels per side. Choose a smaller image.'
                : sourceImportErrorMessage(cause));
            setError(true);
        } finally {
            if (current() && !handedToEditor) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!sourceToken || !browser) return;
        if (!isExtensionToken(sourceToken)) {
            setNotice('This image link is invalid. Right-click the image again, or choose a local image.');
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
                setPendingPermission(true);
                setNotice('Allow access to the selected image’s host to make your pattern here.');
            }
        }).catch(cause => {
            if (stopped || consumed.current || revision.current !== version) return;
            setNotice(sourceImportErrorMessage(cause));
            setError(true);
        });
        return () => { stopped = true; };
    }, [sourceToken, readImage]);

    const openEditor = useCallback(async (draft: EditorDraft) => {
        if (!transferEnabled) throw new Error('Website transfer is not available in this build. Save the project, then open it in the website editor.');
        if (!browser) throw new Error('Install Bead Capture in Chrome to send a pattern to the website editor.');
        const safeDraft = sanitizeHomepageCaptureDraft(draft);
        if (!safeDraft) throw new Error('Could not prepare this pattern. Save the project and open it in the website editor.');
        const response = await browser.runtime.sendMessage<{ ok: boolean; error?: string }>({
            type: 'create-handoff', project: serializeEditorProject(safeDraft), locale,
        });
        if (!response.ok) throw new Error(response.error === 'handoff_too_large'
            ? 'This pattern is too large for direct transfer. Save the project, then open that file in the website editor.'
            : response.error === 'handoff_storage_full'
                ? 'Finish opening your other transferred patterns first, or save this project and open the file in the website editor.'
                : 'Could not send the pattern. Save the project and open it in the website editor.');
        setNotice('Website editor opened. Your pattern will load there; this copy stays here.');
        setError(false);
    }, [locale]);

    const homeHost = useMemo<EditorHomeHost>(() => ({
        incomingImage, requestOpenEditor, cancelIncomingImage,
        onOpenEditor: openEditor,
        onUserSourceChange: cancelSource,
        onImageError: (id, cause) => { if (incomingId.current === id) { setNotice(cause.message); setError(true); } },
        onImageConsumed: id => {
            if (incomingId.current !== id) return;
            incomingId.current = null;
            consumed.current = true;
            setIncomingImage(undefined);
            setLoading(false);
            setNotice(current => current === 'Preparing your image…' ? 'Image loaded. Adjust the pattern below, or open the editor to refine it.' : current);
        },
    }), [incomingImage, requestOpenEditor, cancelIncomingImage, openEditor, cancelSource]);

    const context = useMemo(() => ({ locale, setLocale, openEditor: () => setRequestOpenEditor(value => value + 1) }), [locale]);
    return <CaptureSiteContext.Provider value={context}>
        <div className="min-h-screen flex flex-col">
            <SiteHeader active="generator" locale={locale} />
            <main id="main-content" tabIndex={-1} className="home-main">
                <HomeHero locale={locale} illustration={<OriginalStudy />} />
                <HomeGeneratorSection locale={locale} notice={notice ? <section className="capture-notice" data-error={error} aria-label="Selected image">
                    <p role={error ? 'alert' : 'status'}>{notice}</p>
                    {origin && !consumed.current ? <p className="text-muted text-xs">{origin.replace(/\/\*$/, '')}</p> : null}
                    {origin && sourceToken && !consumed.current ? <>
                        <button type="button" className="button-primary" disabled={loading} onClick={() => void readImage(sourceToken, origin, permissionGranted.current)}>
                            {loading ? 'Loading image…' : pendingPermission ? 'Allow image host & make pattern' : 'Try loading again'}
                        </button>
                        <button type="button" className="button-secondary" onClick={cancelSource}>Use a local image instead</button>
                    </> : null}
                </section> : null}>
                    <Editor locale={locale} homeHost={homeHost} />
                </HomeGeneratorSection>
            </main>
            <footer className="capture-footer"><div>
                <p>Bead Capture · 0.2.0 · Images are processed on this device. Save your project before closing.</p>
                <a href={`${WEBSITE_ORIGIN}/privacy-policy`} target="_blank" rel="noopener noreferrer">Privacy policy</a>
            </div></footer>
        </div>
    </CaptureSiteContext.Provider>;
}

const root = document.getElementById('capture-root');
if (root) createRoot(root).render(<CaptureApp />);

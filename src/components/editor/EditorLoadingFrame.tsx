import type { SiteLocale } from '@/lib/i18n/locales';
import './editor-loading.css';

const copy = {
    en: { title: 'Pattern editor', tools: 'Tools', colors: 'Bead colors', details: 'Pattern settings', loading: 'Opening your workspace…', hint: 'Your pattern will appear here when it is ready.', receiving: 'Receiving your pattern…', preparing: 'Preparing your pattern…' },
    de: { title: 'Vorlagen-Editor', tools: 'Werkzeuge', colors: 'Perlenfarben', details: 'Vorlageneinstellungen', loading: 'Dein Arbeitsbereich wird geöffnet…', hint: 'Deine Vorlage erscheint hier, sobald sie bereit ist.', receiving: 'Deine Vorlage wird empfangen…', preparing: 'Deine Vorlage wird vorbereitet…' },
    fr: { title: 'Éditeur de modèles', tools: 'Outils', colors: 'Couleurs des perles', details: 'Réglages du modèle', loading: 'Ouverture de votre espace de travail…', hint: 'Votre modèle apparaîtra ici dès qu’il sera prêt.', receiving: 'Réception de votre modèle…', preparing: 'Préparation de votre modèle…' },
    ja: { title: '図案エディター', tools: 'ツール', colors: 'ビーズの色', details: '図案の設定', loading: '作業画面を開いています…', hint: '準備ができると、ここに図案が表示されます。', receiving: '図案を受信しています…', preparing: '図案を準備しています…' },
} satisfies Record<SiteLocale, Record<string, string>>;

export function EditorLoadingStatus({ locale = 'en', phase = 'loading' }: { locale?: SiteLocale; phase?: 'loading' | 'receiving' | 'preparing' }) {
    const text = copy[locale];
    return <div className="editor-loading-status" role="status" aria-live="polite">
        <span className="editor-loading-spinner" aria-hidden="true" />
        <strong>{text[phase]}</strong>
        <span>{text.hint}</span>
    </div>;
}

/** The server and the first hydrated render share this frame. It needs no image,
 * canvas, palette request, or editor JavaScript to provide a visible first paint. */
export default function EditorLoadingFrame({ locale = 'en' }: { locale?: SiteLocale }) {
    const text = copy[locale];
    return <div className="editor-loading-frame" lang={locale} aria-busy="true" data-testid="editor-loading-frame">
        <header className="editor-loading-header"><strong>{text.title}</strong><span className="editor-loading-bar" aria-hidden="true" /></header>
        <aside className="editor-loading-tools" aria-hidden="true">
            <h2>{text.tools}</h2>
            <div className="editor-loading-tool-row">{[0, 1, 2, 3, 4].map(n => <span key={n} />)}</div>
            <h2>{text.colors}</h2>
            {[0, 1, 2, 3].map(n => <span className="editor-loading-bar" key={n} />)}
        </aside>
        <div className="editor-loading-canvas"><EditorLoadingStatus locale={locale} /></div>
        <aside className="editor-loading-details" aria-hidden="true">
            <h2>{text.details}</h2>
            {[0, 1, 2, 3].map(n => <span className="editor-loading-bar" key={n} />)}
        </aside>
    </div>;
}

'use client';

import { useId, useRef, useState, useSyncExternalStore } from 'react';
import type { SiteLocale } from '@/lib/i18n/locales';
import { getAnalyticsConsent, getServerAnalyticsConsent, setAnalyticsConsent, startAnalytics, subscribeAnalyticsConsent } from '../../lib/analytics-consent';
import styles from './PrivacyPreferencesButton.module.css';

const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

const messages = {
    en: {
        prompt: 'Optional analytics',
        promptDescription: 'Allow Google Analytics cookies to help us understand visits and downloads? Your images and projects are not included. All tools work either way.',
        details: 'Details',
        button: 'Analytics preferences', heading: 'Optional usage analytics',
        description: 'With your permission, Google Analytics measures visits and actions such as pattern downloads. Your images and project contents are not included in our analytics events. Google may use cookies and process device and network information.',
        choice: 'You can use every tool without analytics. Your choice is saved in this browser, applies to all site languages, and can be changed here at any time.',
        unknown: 'Analytics is off. You have not made a choice.', granted: 'Analytics is on with your permission.', denied: 'Analytics is off.',
        allow: 'Allow analytics', reject: 'Keep analytics off', withdraw: 'Turn analytics off', close: 'Close',
        error: 'This browser could not save your choice. Analytics stays off for this page. Your tools and saved projects are unaffected.',
    },
    de: {
        prompt: 'Optionale Analyse',
        promptDescription: 'Dürfen Google-Analytics-Cookies Besuche und Downloads messen? Deine Bilder und Projekte werden nicht übermittelt. Alle Werkzeuge funktionieren auch ohne Analyse.',
        details: 'Details',
        button: 'Analyse-Einstellungen', heading: 'Optionale Nutzungsanalyse',
        description: 'Mit deiner Erlaubnis erfasst Google Analytics Besuche und Aktionen wie das Herunterladen von Vorlagen. Unsere Analyseereignisse enthalten weder deine Bilder noch Projektinhalte. Google kann Cookies verwenden und Geräte- und Netzwerkdaten verarbeiten.',
        choice: 'Alle Werkzeuge funktionieren auch ohne Analyse. Deine Wahl wird in diesem Browser gespeichert, gilt für alle Sprachen der Website und lässt sich hier jederzeit ändern.',
        unknown: 'Die Analyse ist aus. Du hast noch keine Auswahl getroffen.', granted: 'Die Analyse ist mit deiner Erlaubnis an.', denied: 'Die Analyse ist aus.',
        allow: 'Analyse erlauben', reject: 'Analyse ausgeschaltet lassen', withdraw: 'Analyse ausschalten', close: 'Schließen',
        error: 'Dieser Browser konnte deine Wahl nicht speichern. Die Analyse bleibt auf dieser Seite aus. Werkzeuge und gespeicherte Projekte sind nicht betroffen.',
    },
    fr: {
        prompt: 'Statistiques facultatives',
        promptDescription: 'Autoriser les cookies Google Analytics pour mesurer les visites et téléchargements ? Vos images et projets ne sont pas transmis. Tous les outils fonctionnent aussi sans statistiques.',
        details: 'En savoir plus',
        button: 'Préférences de statistiques', heading: 'Statistiques d’utilisation facultatives',
        description: 'Avec votre accord, Google Analytics mesure les visites et des actions comme le téléchargement de modèles. Nos événements de statistiques ne contiennent ni vos images ni le contenu de vos projets. Google peut utiliser des cookies et traiter des informations sur votre appareil et votre connexion.',
        choice: 'Tous les outils fonctionnent sans statistiques. Votre choix est enregistré dans ce navigateur, s’applique à toutes les langues du site et peut être modifié ici à tout moment.',
        unknown: 'Les statistiques sont désactivées. Vous n’avez pas encore fait de choix.', granted: 'Les statistiques sont activées avec votre accord.', denied: 'Les statistiques sont désactivées.',
        allow: 'Autoriser les statistiques', reject: 'Garder les statistiques désactivées', withdraw: 'Désactiver les statistiques', close: 'Fermer',
        error: 'Ce navigateur n’a pas pu enregistrer votre choix. Les statistiques restent désactivées sur cette page. Vos outils et projets enregistrés ne sont pas affectés.',
    },
    ja: {
        prompt: '任意のアクセス解析',
        promptDescription: 'Google AnalyticsのCookieを使って閲覧やダウンロードを計測してもよろしいですか？画像やプロジェクトの内容は送信しません。許可しなくてもすべてのツールを利用できます。',
        details: '詳しく見る',
        button: 'アクセス解析の設定', heading: '任意のアクセス解析',
        description: '同意いただいた場合、Google Analyticsでページの閲覧や図案のダウンロードなどを計測します。当サイトが送信する解析イベントに画像やプロジェクトの内容は含めません。GoogleはCookieを使用し、端末や接続に関する情報を処理する場合があります。',
        choice: '解析を許可しなくても、すべてのツールを利用できます。選択はこのブラウザに保存され、サイト内のすべての言語に適用されます。いつでもここで変更できます。',
        unknown: 'アクセス解析は無効です。まだ選択されていません。', granted: '同意に基づきアクセス解析が有効です。', denied: 'アクセス解析は無効です。',
        allow: '解析を許可する', reject: '解析を無効のままにする', withdraw: '解析を無効にする', close: '閉じる',
        error: 'このブラウザでは選択を保存できませんでした。このページでは解析を無効のままにします。ツールや保存済みプロジェクトには影響しません。',
    },
};

export default function PrivacyPreferencesButton({ locale = 'en', compact = false }: { locale?: SiteLocale; compact?: boolean }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const headingId = useId();
    const copy = messages[locale];
    const consent = useSyncExternalStore(subscribeAnalyticsConsent, getAnalyticsConsent, getServerAnalyticsConsent);
    // Keep the prompt out of SSR and read saved choices before showing it.
    const isClient = useSyncExternalStore(subscribeToClient, clientSnapshot, serverSnapshot);
    const [failed, setFailed] = useState(false);
    const openDetails = () => { setFailed(false); dialog.current?.showModal(); };
    const choose = (value: 'granted' | 'denied') => {
        const saved = setAnalyticsConsent(value);
        setFailed(!saved);
        if (saved) {
            // An unchanged Allow choice does not rerun the React consent effect.
            // It can explicitly retry an earlier SDK network failure instead.
            if (value === 'granted' && consent === 'granted') startAnalytics();
            dialog.current?.close();
        }
    };
    return (
        <>
            <button type="button" className={compact ? `${styles.trigger} ${styles.compactTrigger}` : styles.trigger} aria-label={compact ? copy.button : undefined} title={compact ? copy.button : undefined} onClick={openDetails}>
                {compact ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z" /><path d="M9 12h6m-3-3v6" /></svg> : copy.button}
            </button>
            {isClient && (consent === 'unknown' || failed) && (
                <section className={compact ? `${styles.prompt} ${styles.compactPrompt}` : styles.prompt} aria-labelledby={`${headingId}-prompt`} onKeyDownCapture={event => event.stopPropagation()}>
                    <h2 id={`${headingId}-prompt`}>{copy.prompt}</h2>
                    <p>{copy.promptDescription} <button type="button" className={styles.details} onClick={openDetails}>{copy.details}</button></p>
                    {failed && <p role="alert">{copy.error}</p>}
                    <div className={styles.promptActions}>
                        <button type="button" onClick={() => choose('denied')}>{copy.reject}</button>
                        <button type="button" onClick={() => choose('granted')}>{copy.allow}</button>
                    </div>
                </section>
            )}
            <dialog ref={dialog} className={styles.dialog} aria-labelledby={headingId} onKeyDownCapture={event => event.stopPropagation()}>
                <h2 id={headingId}>{copy.heading}</h2>
                <p>{copy.description}</p>
                <p>{copy.choice}</p>
                <p role="status">{failed ? copy.error : copy[consent]}</p>
                <div className={styles.actions}>
                    <button type="button" onClick={() => choose('denied')}>{consent === 'granted' ? copy.withdraw : copy.reject}</button>
                    <button type="button" onClick={() => choose('granted')}>{copy.allow}</button>
                    <button type="button" onClick={() => dialog.current?.close()}>{copy.close}</button>
                </div>
            </dialog>
        </>
    );
}

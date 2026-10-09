'use client';

import type { SiteLocale } from '@/lib/i18n/locales';
import { useId, useRef, useState, useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getServerCapability = () => 'loading' as const;
const getBrowserCapability = () => typeof navigator.share === 'function' ? 'share' : 'copy';

const messages = {
    en: { label: 'Share this pattern', copied: 'Link copied.', manual: 'Select and copy the link above.', cancelled: 'Sharing wasn’t completed. You can copy the link instead.', failed: 'Couldn’t open sharing. You can copy the link instead.', copying: 'Copying…', copy: 'Copy link', sharing: 'Sharing…', share: 'Share…' },
    de: { label: 'Diese Vorlage teilen', copied: 'Link kopiert.', manual: 'Markiere und kopiere den Link oben.', cancelled: 'Nicht geteilt. Du kannst stattdessen den Link kopieren.', failed: 'Teilen konnte nicht geöffnet werden. Kopiere stattdessen den Link.', copying: 'Wird kopiert…', copy: 'Link kopieren', sharing: 'Wird geteilt…', share: 'Teilen…' },
    fr: { label: 'Partager ce modèle', copied: 'Lien copié.', manual: 'Sélectionnez et copiez le lien ci-dessus.', cancelled: 'Le partage n’a pas été terminé. Vous pouvez copier le lien.', failed: 'Impossible d’ouvrir le partage. Vous pouvez copier le lien.', copying: 'Copie…', copy: 'Copier le lien', sharing: 'Partage…', share: 'Partager…' },
    ja: { label: 'この図案を共有', copied: 'リンクをコピーしました。', manual: '上のリンクを選択してコピーしてください。', cancelled: '共有は完了していません。リンクをコピーできます。', failed: '共有を開けませんでした。リンクをコピーできます。', copying: 'コピー中…', copy: 'リンクをコピー', sharing: '共有中…', share: '共有…' },
};

export default function PatternShare({ url, title, locale = 'en' }: { url: string; title: string; locale?: SiteLocale }) {
    const copy = messages[locale];
    const capability = useSyncExternalStore(subscribe, getBrowserCapability, getServerCapability);
    const inputId = useId();
    const linkInput = useRef<HTMLInputElement>(null);
    const busy = useRef(false);
    const [pending, setPending] = useState<'copy' | 'share' | null>(null);
    const [message, setMessage] = useState('');

    async function copyLink() {
        if (busy.current) return;
        busy.current = true;
        setPending('copy');
        setMessage('');
        try {
            await navigator.clipboard.writeText(url);
            setMessage(copy.copied);
        } catch {
            setMessage(copy.manual);
            linkInput.current?.focus();
            linkInput.current?.select();
        } finally {
            busy.current = false;
            setPending(null);
        }
    }

    async function shareLink() {
        if (busy.current) return;
        busy.current = true;
        setPending('share');
        setMessage('');
        try {
            // Only the published pattern link is shared, never editor contents.
            // Resolution does not prove a recipient received or published it.
            await navigator.share({ title, url });
        } catch (error) {
            setMessage(error instanceof Error && error.name === 'AbortError'
                ? copy.cancelled
                : copy.failed);
        } finally {
            busy.current = false;
            setPending(null);
        }
    }

    return (
        <div className="mt-6 border-t border-[#d9ded5] pt-4">
            <label htmlFor={inputId} className="block text-sm font-semibold text-[#243e36]">{copy.label}</label>
            <input
                ref={linkInput}
                id={inputId}
                type="text"
                readOnly
                value={url}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-2 min-h-11 w-full min-w-0 rounded-md border border-[#a8b7ac] bg-transparent px-3 text-sm text-[#43564d]"
            />
            <div className="flex flex-wrap items-center gap-x-6">
                <button type="button" onClick={copyLink} disabled={pending !== null || capability === 'loading'} className="text-link disabled:cursor-wait disabled:opacity-60">{pending === 'copy' ? copy.copying : copy.copy}</button>
                {capability === 'share' && <button type="button" onClick={shareLink} disabled={pending !== null} className="text-link disabled:cursor-wait disabled:opacity-60">{pending === 'share' ? copy.sharing : copy.share}</button>}
            </div>
            <p role="status" aria-live="polite" aria-atomic="true" className="text-sm leading-6 text-[#59685d]">{message}</p>
        </div>
    );
}

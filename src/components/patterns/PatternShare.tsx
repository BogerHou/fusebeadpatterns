'use client';

import { useId, useRef, useState, useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getServerCapability = () => 'loading' as const;
const getBrowserCapability = () => typeof navigator.share === 'function' ? 'share' : 'copy';

export default function PatternShare({ url, title }: { url: string; title: string }) {
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
            setMessage('Link copied.');
        } catch {
            setMessage('Select and copy the link above.');
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
                ? 'Sharing wasn’t completed. You can copy the link instead.'
                : 'Couldn’t open sharing. You can copy the link instead.');
        } finally {
            busy.current = false;
            setPending(null);
        }
    }

    return (
        <div className="mt-6 border-t border-[#d9ded5] pt-4">
            <label htmlFor={inputId} className="block text-sm font-semibold text-[#243e36]">Share this pattern</label>
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
                <button type="button" onClick={copyLink} disabled={pending !== null || capability === 'loading'} className="text-link disabled:cursor-wait disabled:opacity-60">{pending === 'copy' ? 'Copying…' : 'Copy link'}</button>
                {capability === 'share' && <button type="button" onClick={shareLink} disabled={pending !== null} className="text-link disabled:cursor-wait disabled:opacity-60">{pending === 'share' ? 'Sharing…' : 'Share…'}</button>}
            </div>
            <p role="status" aria-live="polite" aria-atomic="true" className="text-sm leading-6 text-[#59685d]">{message}</p>
        </div>
    );
}

'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Keep existing download bookmarks useful while making the full catalog primary. */
export default function PatternQuickDownloads({ id, summary, children }: { id: string; summary: string; children: ReactNode }) {
    const container = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        const revealBookmarkedDownload = () => {
            let anchor: string;
            try {
                anchor = decodeURIComponent(window.location.hash.slice(1));
            } catch {
                return;
            }
            if (!anchor || !container.current) return;
            const target = document.getElementById(anchor);
            if (!target || !container.current.contains(target)) return;
            container.current.open = true;
            target.scrollIntoView({ block: 'start' });
        };
        revealBookmarkedDownload();
        window.addEventListener('hashchange', revealBookmarkedDownload);
        window.addEventListener('popstate', revealBookmarkedDownload);
        return () => {
            window.removeEventListener('hashchange', revealBookmarkedDownload);
            window.removeEventListener('popstate', revealBookmarkedDownload);
        };
    }, []);

    return (
        <details ref={container} id={id} className="mt-12 scroll-mt-6 border-y border-line py-5">
            <summary className="min-h-11 cursor-pointer py-2 text-base font-semibold">{summary}</summary>
            <div className="pt-4">{children}</div>
        </details>
    );
}

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { getPatternLinkEvent, trackPatternEvent } from '@/lib/analytics';

import { getAnalyticsConsent, getServerAnalyticsConsent, isAnalyticsPageReady, subscribeAnalyticsConsent, startAnalytics } from '@/lib/analytics-consent';

export default function PatternAnalytics(): null {
    const consent = useSyncExternalStore(subscribeAnalyticsConsent, getAnalyticsConsent, getServerAnalyticsConsent);
    const pathname = usePathname();
    const enabled = consent === 'granted';

    useEffect(() => {
        let active = true;
        let observer: MutationObserver | undefined;
        // The hydration render can still hold the server's "unknown" snapshot.
        // Check persisted consent here instead of withdrawing on that stale value.
        const startWhenReady = () => {
            if (!active) return false;
            startAnalytics(pathname);
            if (!isAnalyticsPageReady(pathname)) return false;
            active = false;
            observer?.disconnect();
            return true;
        };
        // Next can defer the new metadata head beyond the pathname update.
        // Wait for its matching canonical instead of measuring an old/home URL.
        if (!startWhenReady()) {
            try {
                observer = new MutationObserver(() => { startWhenReady(); });
                observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'rel'] });
            } catch { observer?.disconnect(); }
        }
        return () => { active = false; observer?.disconnect(); };
    }, [enabled, pathname]);

    useEffect(() => {
        if (!enabled) return;
        const handleClick = (event: MouseEvent) => {
            try {
                if (event.button !== 0 || !(event.target instanceof Element)) return;
                const link = event.target.closest<HTMLAnchorElement>('a[data-pattern-event]');
                if (!link) return;
                const input = getPatternLinkEvent(link.dataset);
                if (input) trackPatternEvent(input);
            } catch {
                // Analytics must not affect the link's normal browser action.
            }
        };
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [enabled]);

    return null;
}

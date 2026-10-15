'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { getPatternLinkEvent, trackPatternEvent } from '@/lib/analytics';

import { getAnalyticsConsent, getServerAnalyticsConsent, subscribeAnalyticsConsent, startAnalytics, stopAnalytics } from '@/lib/analytics-consent';

export default function PatternAnalytics(): null {
    const consent = useSyncExternalStore(subscribeAnalyticsConsent, getAnalyticsConsent, getServerAnalyticsConsent);
    const pathname = usePathname();
    const enabled = consent === 'granted';

    useEffect(() => {
        if (enabled) startAnalytics();
        else stopAnalytics();
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

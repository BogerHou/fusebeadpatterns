'use client';

import Script from 'next/script';
import { useEffect, useSyncExternalStore } from 'react';
import { getPatternLinkEvent, isProductionAnalyticsHost, trackPatternEvent } from '@/lib/analytics';

const subscribe = () => () => {};
const getServerSnapshot = () => false;
const getClientSnapshot = () => isProductionAnalyticsHost(window.location.hostname);

export default function PatternAnalytics() {
    const enabled = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

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

    if (!enabled) return null;

    return (
        <>
            <Script
                strategy="lazyOnload"
                async
                src="https://www.googletagmanager.com/gtag/js?id=G-K3EC5BK93E"
            />
            <Script id="google-analytics" strategy="lazyOnload">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-K3EC5BK93E');
                `}
            </Script>
        </>
    );
}

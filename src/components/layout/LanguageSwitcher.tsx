'use client';

import { useEffect, useRef, useSyncExternalStore, type MouseEvent } from 'react';
import { usePathname } from 'next/navigation';
import { SITE_LOCALES, localeNames, siteNavigation, type SiteLocale } from '../../lib/i18n/locales';
import { getLocaleDestination, LOCALE_NAVIGATION_EVENT, type LocaleNavigationDetail } from '../../lib/i18n/routes';
import { PATTERN_FILTER_CHANGE_EVENT } from '../../lib/patterns/browser-state';
import styles from './LanguageSwitcher.module.css';

function subscribeToLocation(callback: () => void) {
    window.addEventListener('popstate', callback);
    window.addEventListener(PATTERN_FILTER_CHANGE_EVENT, callback);
    window.addEventListener('hashchange', callback);
    return () => {
        window.removeEventListener('popstate', callback);
        window.removeEventListener(PATTERN_FILTER_CHANGE_EVENT, callback);
        window.removeEventListener('hashchange', callback);
    };
}

const readLocationSuffix = () => window.location.search + window.location.hash;
const serverLocationSuffix = () => '';

export default function LanguageSwitcher({ locale = 'en', className = '' }: { locale?: SiteLocale; className?: string }) {
    const pathname = usePathname() ?? '/';
    const suffix = useSyncExternalStore(subscribeToLocation, readLocationSuffix, serverLocationSuffix);
    const hashIndex = suffix.indexOf('#');
    const search = hashIndex < 0 ? suffix : suffix.slice(0, hashIndex);
    const hash = hashIndex < 0 ? '' : suffix.slice(hashIndex);
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const summaryRef = useRef<HTMLElement>(null);
    const copy = siteNavigation[locale];

    useEffect(() => {
        const dismissOutside = (event: PointerEvent) => {
            if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) detailsRef.current.open = false;
        };
        const dismissWithEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || !detailsRef.current?.open) return;
            event.preventDefault();
            detailsRef.current.open = false;
            summaryRef.current?.focus();
        };
        document.addEventListener('pointerdown', dismissOutside);
        document.addEventListener('keydown', dismissWithEscape);
        return () => {
            document.removeEventListener('pointerdown', dismissOutside);
            document.removeEventListener('keydown', dismissWithEscape);
        };
    }, []);

    const navigate = (event: MouseEvent<HTMLAnchorElement>, targetLocale: SiteLocale) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const { href } = getLocaleDestination(window.location.pathname, targetLocale, window.location);
        const navigation = new CustomEvent<LocaleNavigationDetail>(LOCALE_NAVIGATION_EVENT, {
            cancelable: true,
            detail: { href, locale: targetLocale },
        });
        if (!window.dispatchEvent(navigation)) return;
        window.location.assign(href);
    };

    return (
        <details ref={detailsRef} className={`${styles.switcher} ${className}`} onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false;
        }}>
            <summary ref={summaryRef} className={styles.summary} aria-label={`${copy.language}: ${localeNames[locale]}`}>
                <span aria-hidden="true">{locale.toUpperCase()}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="m1 1 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
            </summary>
            <ul className={styles.menu} aria-label={copy.language}>
                {SITE_LOCALES.map(targetLocale => {
                    const target = getLocaleDestination(pathname, targetLocale, { search, hash });
                    return (
                        <li key={targetLocale}>
                            <a href={target.href} hrefLang={targetLocale} data-locale-navigation className={styles.option} aria-current={targetLocale === locale ? 'true' : undefined} onClick={event => navigate(event, targetLocale)}>
                                <span lang={targetLocale}>{localeNames[targetLocale]}</span>
                                {target.isFallback ? <span className={styles.fallback}>{copy.fallback}</span> : null}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </details>
    );
}

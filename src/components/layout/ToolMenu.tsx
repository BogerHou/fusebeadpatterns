'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { siteNavigation, type SiteLocale } from '../../lib/i18n/locales';
import { localeRoutes } from '../../lib/i18n/routes';
import styles from './LanguageSwitcher.module.css';

export default function ToolMenu({ locale }: { locale: SiteLocale }) {
    const copy = siteNavigation[locale];
    const routes = localeRoutes[locale];
    const pathname = usePathname();
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const summaryRef = useRef<HTMLElement>(null);
    const tools = [
        { href: routes.home, label: copy.beadGenerator },
        { href: routes.hamaMaker, label: copy.hamaMaker },
        { href: routes.pixelGrid!, label: copy.pixelGrid },
        { href: routes.beadLoom, label: copy.beadLoom },
    ];

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

    return (
        <details ref={detailsRef} className={`${styles.switcher} ${styles.tools}`} onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false;
        }}>
            <summary ref={summaryRef} className={`${styles.summary} ${styles.toolSummary}`} aria-label={copy.tools}>
                {copy.tools}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="m1 1 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
            </summary>
            <ul className={`${styles.menu} ${styles.toolList}`} aria-label={copy.tools}>
                {tools.map(tool => (
                    <li key={tool.href}>
                        {/* Native links also engage the drawing workspaces' leave protection. */}
                        <a href={tool.href} hrefLang={locale} className={styles.option} aria-current={pathname === tool.href ? 'page' : undefined}>{tool.label}</a>
                    </li>
                ))}
            </ul>
        </details>
    );
}

import { useContext, useEffect, useRef } from 'react';
import { CaptureSiteContext } from './site-adapter';
import { SITE_LOCALES, localeNames, siteNavigation, type SiteLocale } from '../../../src/lib/i18n/locales';
import styles from '../../../src/components/layout/LanguageSwitcher.module.css';

/** Change bundled language in place without reloading the image. */
export default function LanguageSwitcher({ locale = 'en', className = '' }: { locale?: SiteLocale; className?: string }) {
    const host = useContext(CaptureSiteContext);
    const ref = useRef<HTMLDetailsElement>(null);
    const summary = useRef<HTMLElement>(null);
    useEffect(() => {
        function outside(event: PointerEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
        }
        function escape(event: KeyboardEvent) {
            if (event.key === 'Escape' && ref.current?.open) {
                ref.current.open = false;
                summary.current?.focus();
            }
        }
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, []);
    return <details ref={ref} className={`${styles.switcher} ${className}`} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false;
    }}>
        <summary ref={summary} className={styles.summary} aria-label={`${siteNavigation[locale].language}: ${localeNames[locale]}`}>
            <span lang={locale}>{localeNames[locale]}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="m1 1 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
        </summary>
        <ul className={styles.menu} aria-label={siteNavigation[locale].language}>
            {SITE_LOCALES.map(value => <li key={value}><button type="button" className={`${styles.option} w-full text-left`} aria-pressed={value === locale} onClick={() => {
                host.setLocale(value);
                if (ref.current) ref.current.open = false;
            }}><span lang={value}>{localeNames[value]}</span></button></li>)}
        </ul>
    </details>;
}

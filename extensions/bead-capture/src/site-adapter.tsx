import { createContext, useContext, type AnchorHTMLAttributes, type ImgHTMLAttributes, type MouseEvent } from 'react';
import type { SiteLocale } from '../../../src/lib/i18n/locales';
import { WEBSITE_ORIGIN } from '../../../src/lib/browser-extension/protocol';

export const CaptureSiteContext = createContext<{
    locale: SiteLocale;
    setLocale(locale: SiteLocale): void;
    openEditor(): void;
}>({ locale: 'en', setLocale() {}, openEditor() {} });

export function isEditorHref(href: string): boolean {
    return /^\/(?:(?:de|fr|ja)\/)?editor(?:[?#]|$)/.test(href);
}

/** Public links open the website; generator and editor keep current local work. */
export function SiteLink({ href, children, prefetch: _prefetch, replace: _replace, scroll: _scroll, ...props }:
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; prefetch?: boolean; replace?: boolean; scroll?: boolean }) {
    const host = useContext(CaptureSiteContext);
    void _prefetch; void _replace; void _scroll;
    const home = /^\/(?:(?:de|fr|ja)\/?)?$/.test(href);
    const editor = isEditorHref(href);
    const local = home || href.startsWith('#');
    const target = home ? '#generator' : href.startsWith('/') ? `${WEBSITE_ORIGIN}${href}` : href;
    function onClick(event: MouseEvent<HTMLAnchorElement>) {
        props.onClick?.(event);
        if (event.defaultPrevented || !editor) return;
        event.preventDefault();
        host.openEditor();
    }
    return <a {...props} href={target} target={local || editor ? undefined : '_blank'} rel={local ? undefined : 'noopener noreferrer'} onClick={onClick}>{children}</a>;
}

export function SiteImage({ unoptimized: _unoptimized, priority: _priority, preload: _preload, fill, ...props }:
    ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean; priority?: boolean; preload?: boolean; fill?: boolean }) {
    void _unoptimized; void _priority; void _preload;
    // Packaged assets or local data URLs, never /_next/image.
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ''} style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...props.style } : props.style} />;
}

export function usePathname() {
    const { locale } = useContext(CaptureSiteContext);
    return locale === 'en' ? '/' : `/${locale}`;
}
export function useSearchParams() { return new URLSearchParams(); }
export function useRouter() {
    const { openEditor } = useContext(CaptureSiteContext);
    return {
        push(href: string) {
            if (isEditorHref(href)) openEditor();
            else window.open(new URL(href, WEBSITE_ORIGIN).href, '_blank', 'noopener,noreferrer');
        },
        replace(href: string) { this.push(href); },
    };
}

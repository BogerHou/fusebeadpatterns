'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { notFoundCopy, readNotFoundPathname, serverNotFoundPathname, subscribeToNotFoundLocation } from '@/lib/i18n/not-found';
import { getLocaleFromPath } from '@/lib/i18n/routes';
import { maintainNotFoundTitle } from '@/lib/i18n/not-found-title';
import { LanguagePathnameContext } from './LanguagePathnameContext';
import NotFoundPage from './NotFoundPage';

export default function NotFoundDocument({ className }: { className: string }) {
    // Router updates cover pushState/replaceState; popstate also covers browser Back.
    // Use the actual browser URL: the global boundary's router path may be /_not-found.
    const pathname = usePathname();
    const recoveryPathname = useSyncExternalStore(subscribeToNotFoundLocation, () => readNotFoundPathname(pathname), serverNotFoundPathname);
    const locale = getLocaleFromPath(recoveryPathname);

    useEffect(() => maintainNotFoundTitle(`${notFoundCopy[locale].title} | Fuse Bead Patterns`), [locale]);

    return <LanguagePathnameContext value={recoveryPathname}><html lang={locale} className={className}>
        <body className="min-h-full flex flex-col font-sans"><NotFoundPage locale={locale} /></body>
    </html></LanguagePathnameContext>;
}

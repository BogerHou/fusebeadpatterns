import Link from 'next/link';
import type { SiteLocale } from '@/lib/i18n/locales';
import { notFoundCopy } from '@/lib/i18n/not-found';
import { localeRoutes } from '@/lib/i18n/routes';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

/** Shared visible content for the English boundary and localized global recovery. */
export default function NotFoundPage({ locale }: { locale: SiteLocale }) {
    const copy = notFoundCopy[locale];
    const routes = localeRoutes[locale];
    return <>
        <SiteHeader locale={locale} />
        <main id="main-content" data-not-found-recovery tabIndex={-1} className="page-shell flex-1 py-20 sm:py-28">
            <p className="eyebrow mb-5">{copy.eyebrow}</p>
            <h1 className="page-heading">{copy.title}</h1>
            <p className="mt-6 max-w-xl leading-8 text-muted">{copy.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
                <Link href={routes.patterns} className="button-primary">{copy.patterns} <span aria-hidden="true">↗</span></Link>
                <Link href={routes.home} className="button-secondary">{copy.home}</Link>
            </div>
        </main>
        <SiteFooter locale={locale} />
    </>;
}

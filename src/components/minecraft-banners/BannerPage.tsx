import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import { bannerCopy } from '@/lib/minecraft-banners/copy';
import { bannerPaths, type BannerMode } from '@/lib/minecraft-banners/routes';
import BannerWorkspace from './BannerWorkspace';

export default function BannerPage({ locale, mode }: { locale: SiteLocale; mode: BannerMode }) {
    const copy = bannerCopy[locale], page = copy.pages[mode];
    return <>
        <SiteHeader locale={locale} />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1">
            <Breadcrumbs label={copy.breadcrumb} items={[{ label: copy.home, href: localeRoutes[locale].home }, { label: page.heading, href: bannerPaths[mode][locale] }]} />
            <h1 className="page-heading">{page.heading}</h1>
            <p className="mt-4 max-w-[70ch] text-base leading-7 text-muted">{page.intro}</p>
            <BannerWorkspace locale={locale} mode={mode} />
            <section aria-labelledby="banner-how" className="mt-10 max-w-[75ch] border-t border-line pt-8">
                <h2 id="banner-how" className="section-heading">{copy.howTitle}</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted">{page.steps.map(step => <li key={step}>{step}</li>)}</ol>
            </section>
            <section aria-labelledby="banner-notes" className="mt-8 max-w-[75ch] border-t border-line pt-8">
                <h2 id="banner-notes" className="section-heading">{copy.notesTitle}</h2>
                <p className="mt-4 leading-7 text-muted">{copy.scope}</p>
                <p className="mt-4 leading-7 text-muted">{copy.local}</p>
                <p className="mt-4 text-xs text-muted">{copy.notice}</p>
            </section>
        </main>
        <SiteFooter locale={locale} active={mode === 'designer' ? 'banner-maker' : 'banner-letters'} />
    </>;
}

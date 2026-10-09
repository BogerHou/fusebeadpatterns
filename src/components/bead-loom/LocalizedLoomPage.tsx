import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import LoomWorkspace from './LoomWorkspace';
import { loomPageContent, type LocalizedLoomLocale } from '@/lib/bead-loom/page-content';
import { localeRoutes } from '@/lib/i18n/routes';

export default function LocalizedLoomPage({ locale }: { locale: LocalizedLoomLocale }) {
    const copy = loomPageContent[locale];
    const home = { de: 'Startseite', fr: 'Accueil', ja: 'ホーム' }[locale];
    const breadcrumbLabel = { de: 'Brotkrümelnavigation', fr: 'Fil d’Ariane', ja: 'パンくずリスト' }[locale];
    return <>
        <SiteHeader locale={locale} />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1">
            <Breadcrumbs label={breadcrumbLabel} items={[{ label: home, href: localeRoutes[locale].home }, { label: copy.heading, href: localeRoutes[locale].beadLoom }]} />
            <h1 className="page-heading">{copy.heading}</h1>
            <p className="mt-4 max-w-[70ch] text-base leading-7 text-muted">{copy.introduction}</p>
            <LoomWorkspace locale={locale} />
            <section className="mt-10 max-w-[75ch] border-t border-line pt-8 text-base leading-7 text-muted" aria-labelledby="loom-help">
                <h2 id="loom-help" className="font-display text-2xl font-semibold text-ink">{copy.helpHeading}</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5">{copy.steps.map(step => <li key={step}>{step}</li>)}</ol>
                <p className="mt-5">{copy.chartHelp}</p>
                <p className="mt-5">{copy.savingHelp}</p>
            </section>
        </main>
        <SiteFooter active="bead-loom" locale={locale} description={copy.footer} />
    </>;
}

import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import { getPerlerColorChart } from '@/lib/color-chart/data';
import { colorChartCopy } from '@/lib/color-chart/copy';
import { perlerColorChartPaths } from '@/lib/color-chart/routes';
import { guideHref } from '@/lib/guides/routes';
import { localeRoutes } from '@/lib/i18n/routes';
import type { SiteLocale } from '@/lib/i18n/locales';
import ColorChart from './ColorChart';
import ColorLabelDownloads from './ColorLabelDownloads';

export default function ColorChartPage({ locale }: { locale: SiteLocale }) {
    const copy = colorChartCopy[locale];
    const chart = getPerlerColorChart();
    const labels = {
        en: { home: 'Home', breadcrumb: 'Breadcrumb', guide: 'Compare Perler, Hama and Artkal', credits: 'Data and credits' },
        de: { home: 'Startseite', breadcrumb: 'Brotkrümelnavigation', guide: 'Perler, Hama und Artkal vergleichen', credits: 'Daten und Mitwirkende' },
        fr: { home: 'Accueil', breadcrumb: 'Fil d’Ariane', guide: 'Comparer Perler, Hama et Artkal', credits: 'Données et contributions' },
        ja: { home: 'ホーム', breadcrumb: 'パンくずリスト', guide: 'Perler・Hama・Artkalを比較する', credits: 'データの出典と協力者' },
    }[locale];

    return <>
        <SiteHeader locale={locale} />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1">
            <Breadcrumbs label={labels.breadcrumb} items={[
                { label: labels.home, href: localeRoutes[locale].home },
                { label: copy.heading, href: perlerColorChartPaths[locale] },
            ]} />
            <h1 className="page-heading">{copy.heading}</h1>
            <p className="mt-4 max-w-[70ch] text-base leading-7 text-muted">{copy.intro}</p>
            <ColorLabelDownloads locale={locale} />
            <ColorChart colors={chart.colors} locale={locale} />
            <section aria-labelledby="color-chart-about" className="mt-10 max-w-[75ch] border-t border-line pt-8">
                <h2 id="color-chart-about" className="section-heading">{copy.aboutTitle}</h2>
                <p className="mt-4 leading-7 text-muted">{copy.about}</p>
                <p className="mt-4 leading-7 text-muted">{copy.disclaimer}</p>
                <div className="mt-6 flex flex-wrap items-center gap-5">
                    <Link prefetch={false} href={`${localeRoutes[locale].home}#generator`} className="button-primary">{copy.editorCta}</Link>
                    <Link prefetch={false} href={guideHref('perler-vs-hama-vs-artkal', locale)} className="text-link">{labels.guide}</Link>
                </div>
                <details className="mt-8 border-t border-line pt-5 text-sm leading-7 text-muted">
                    <summary className="cursor-pointer font-semibold text-ink">{labels.credits}</summary>
                    <p className="mt-3">{copy.source}</p>
                    <p className="mt-2 break-words">{chart.contributors.join(', ')}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                        <a href={chart.source.sourceUrl} className="text-link" hrefLang="en">{copy.sourceLabel}</a>
                        <a href={chart.source.licensePath} className="text-link" hrefLang="en">{copy.licenseLabel}</a>
                    </div>
                </details>
            </section>
        </main>
        <SiteFooter locale={locale} active="color-chart" />
    </>;
}

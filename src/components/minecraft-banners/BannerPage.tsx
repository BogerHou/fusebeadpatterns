import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import { bannerCopy } from '@/lib/minecraft-banners/copy';
import { bannerPaths, type BannerMode } from '@/lib/minecraft-banners/routes';
import BannerWorkspace from './BannerWorkspace';

const minecraftRelatedCopy: Record<SiteLocale, {
    label: string;
    circleLabel: string;
    patternsLabel: string;
    patternsHref: string;
}> = {
    en: {
        label: 'More Minecraft tools & patterns:',
        circleLabel: 'Minecraft Circle Generator',
        patternsLabel: 'Minecraft Perler Bead Patterns',
        patternsHref: '/patterns/minecraft',
    },
    de: {
        label: 'Weitere Minecraft-Werkzeuge & Vorlagen:',
        circleLabel: 'Minecraft-Kreis-Generator',
        patternsLabel: 'Minecraft-Bügelperlen-Vorlagen',
        patternsHref: '/de/vorlagen/minecraft',
    },
    fr: {
        label: 'Autres outils et modèles Minecraft :',
        circleLabel: 'Générateur de cercle Minecraft',
        patternsLabel: 'Modèles Minecraft en perles à repasser',
        patternsHref: '/fr/modeles/minecraft',
    },
    ja: {
        label: '関連するマイクラツール・図案：',
        circleLabel: 'マイクラの円生成ツール',
        patternsLabel: 'マイクラのアイロンビーズ図案',
        patternsHref: '/ja/patterns/minecraft',
    },
};

export default function BannerPage({ locale, mode }: { locale: SiteLocale; mode: BannerMode }) {
    const copy = bannerCopy[locale], page = copy.pages[mode];
    const otherMode: BannerMode = mode === 'designer' ? 'letters' : 'designer';
    const related = minecraftRelatedCopy[locale];
    const applicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: page.heading,
        description: page.description ?? page.intro,
        url: `https://fusebeadpatterns.art${bannerPaths[mode][locale]}`,
        inLanguage: locale,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    };
    return <>
        <script id="webapp-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema).replace(/</g, '\\u003c') }} />
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
            <p className="mt-8 flex max-w-[75ch] flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-6 text-sm leading-7 text-muted">
                <span>{related.label}</span>
                <a href={bannerPaths[otherMode][locale]} className="text-link">{copy.pages[otherMode].heading}</a>
                <a href={localeRoutes[locale].blockShapes} className="text-link">{related.circleLabel}</a>
                <a href={related.patternsHref} className="text-link">{related.patternsLabel}</a>
            </p>
        </main>
        <SiteFooter locale={locale} active={mode === 'designer' ? 'banner-maker' : 'banner-letters'} />
    </>;
}

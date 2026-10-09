import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '../layout/Breadcrumbs';
import SiteHeader from '../layout/SiteHeader';
import SiteFooter from '../layout/SiteFooter';
import GuideSections from './GuideSections';
import { siteNavigation } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import { getGuideSummaries, getLocalizedGuide, guideUi, type GuideLocale } from '@/lib/guides/localized';
import { guideHref, guideIndexHref, guideLanguageAlternates, isTranslatedGuideSlug } from '@/lib/guides/routes';

export function localizedGuideMetadata(locale: GuideLocale, slug?: string): Metadata {
    const guide = slug ? getLocalizedGuide(slug, locale) : undefined;
    if (slug && !guide) return {};
    const title = `${guide?.title ?? guideUi[locale].title} | Fuse Bead Patterns`;
    const description = guide?.description ?? guideUi[locale].intro;
    const path = slug ? guideHref(slug, locale) : guideIndexHref(locale);
    return {
        title, description,
        alternates: { canonical: path, languages: guideLanguageAlternates(slug && isTranslatedGuideSlug(slug) ? slug : undefined) },
        openGraph: { title, description, url: `https://fusebeadpatterns.art${path}`, siteName: 'Fuse Bead Patterns', type: slug ? 'article' : 'website' },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export function LocalizedGuideIndex({ locale }: { locale: GuideLocale }) {
    const copy = guideUi[locale];
    return <>
        <SiteHeader locale={locale} active="guides" />
        <main id="main-content" tabIndex={-1} className="page-shell flex flex-1 flex-col pb-16 sm:pb-24">
            <Breadcrumbs label={{ de: 'Brotkrümelnavigation', fr: 'Fil d’Ariane', ja: 'パンくずリスト' }[locale]} items={[{ label: copy.home, href: localeRoutes[locale].home }, { label: siteNavigation[locale].guides, href: guideIndexHref(locale) }]} />
            <div className="mb-10 pt-4 sm:mb-14 sm:pt-8">
                <h1 className="page-heading">{copy.title}</h1>
                <p className="mt-5 max-w-[62ch] text-base leading-8 text-[#59685d] sm:text-lg">{copy.intro}</p>
            </div>
            <div className="grid gap-x-12 md:grid-cols-2">
                {getGuideSummaries(locale).map(guide => <Link key={guide.slug} href={guide.href} hrefLang={guide.language} className="group border-t border-[#d9ded5] py-7 transition-colors hover:border-[#28614e] sm:py-9">
                    <div className="eyebrow mb-4">{guide.eyebrow}</div>
                    <h2 className="font-display text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#243e36] transition-colors group-hover:text-[#28614e] sm:text-3xl">{guide.title}</h2>
                    <p className="mt-4 max-w-[55ch] text-base leading-7 text-[#59685d]">{guide.description}</p>
                    {guide.language !== locale && <span className="mt-3 block text-sm text-muted">{siteNavigation[locale].english}</span>}
                </Link>)}
            </div>
        </main>
        <SiteFooter locale={locale} active="guides" />
    </>;
}

export function LocalizedGuidePage({ locale, slug }: { locale: GuideLocale; slug: string }) {
    const guide = getLocalizedGuide(slug, locale);
    if (!guide) notFound();
    const copy = guideUi[locale];
    return <>
        <SiteHeader locale={locale} active="guides" />
        <main id="main-content" tabIndex={-1} className="page-shell reading-page flex flex-1 flex-col pb-16 sm:pb-24">
            <Breadcrumbs label={{ de: 'Brotkrümelnavigation', fr: 'Fil d’Ariane', ja: 'パンくずリスト' }[locale]} items={[
                { label: copy.home, href: localeRoutes[locale].home },
                { label: siteNavigation[locale].guides, href: guideIndexHref(locale) },
                { label: guide.title, href: guideHref(slug, locale) },
            ]} />
            <article className="reading-article mx-auto w-full pt-4 sm:pt-8">
                <div className="eyebrow mb-5">{guide.eyebrow}</div>
                <h1 className="page-heading">{guide.title}</h1>
                <p className="mt-6 max-w-[65ch] text-lg leading-8 text-[#59685d] sm:text-xl sm:leading-9">{guide.intro}</p>
                <GuideSections sections={guide.sections} locale={locale} id={slug === 'photo-to-perler-bead-pattern' ? 'conversion-examples' : undefined} />
                <div className="mt-12 border-t border-[#d9ded5] pt-8 sm:mt-16 sm:pt-10">
                    <h2 className="section-heading">{copy.next}</h2>
                    <div className="mt-5 flex flex-wrap gap-3">
                        {guide.relatedLinks.map(link => <Link key={link.href} href={link.href} className="btn-secondary">{link.label}</Link>)}
                    </div>
                </div>
            </article>
            <p className="reading-article mx-auto mt-8 w-full text-base leading-7 text-[#59685d]">
                <Link href={localeRoutes[locale].patterns} className="text-link">{siteNavigation[locale].browse}</Link>
            </p>
        </main>
        <SiteFooter locale={locale} active="guides" />
    </>;
}

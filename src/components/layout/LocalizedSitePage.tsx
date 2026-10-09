import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from './Breadcrumbs';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { localeRoutes } from '@/lib/i18n/routes';
import { sitePageCopy, sitePageUi } from '@/lib/site-pages/content';
import { sitePageHref, sitePageLanguageAlternates, type SitePageSlug } from '@/lib/site-pages/routes';
import type { SiteParagraph, TranslatedSiteLocale } from '@/lib/site-pages/types';

export function localizedSitePageMetadata(locale: TranslatedSiteLocale, slug: SitePageSlug): Metadata {
    const copy = sitePageCopy[locale][slug];
    const title = `${copy.title} | Fuse Bead Patterns`;
    return {
        title, description: copy.description,
        alternates: { canonical: sitePageHref(slug, locale), languages: sitePageLanguageAlternates(slug) },
        openGraph: { title, description: copy.description, url: `https://fusebeadpatterns.art${sitePageHref(slug, locale)}`, siteName: 'Fuse Bead Patterns', type: 'website' },
    };
}

function Paragraph({ content }: { content: SiteParagraph }) {
    return <p>{typeof content === 'string' ? content : <>
        {content.before}<Link href={content.href} className="text-link break-words">{content.label}</Link>{content.after}
    </>}</p>;
}

export default function LocalizedSitePage({ locale, slug }: { locale: TranslatedSiteLocale; slug: SitePageSlug }) {
    const copy = sitePageCopy[locale][slug];
    const ui = sitePageUi[locale];
    const active = slug === 'about' ? 'about' : slug === 'privacy-policy' ? 'privacy' : 'terms';
    return <div className="min-h-screen flex flex-col">
        <SiteHeader locale={locale} active={slug === 'about' ? 'about' : undefined} />
        <main id="main-content" tabIndex={-1} className="page-shell reading-page flex-1 pb-16 sm:pb-24">
            <Breadcrumbs label={ui.breadcrumb} items={[
                { label: ui.home, href: localeRoutes[locale].home },
                { label: copy.heading, href: sitePageHref(slug, locale) },
            ]} />
            <article className="reading-article mx-auto w-full pt-4 sm:pt-8">
                <h1 className="page-heading mb-8 sm:mb-10">{copy.heading}</h1>
                <div className="max-w-[70ch] space-y-6 text-base leading-8 text-[#43564d] sm:text-lg sm:leading-8">
                    {copy.updated && <p><strong>{ui.updated}</strong> <time dateTime="2026-04-17">{copy.updated}</time></p>}
                    <p>{copy.intro}</p>
                    {copy.sections.map(section => <section key={section.heading} className={section.highlighted ? 'my-10 border-l-2 border-[#9ead9c] bg-[#edf0e8] px-5 py-6 sm:px-7' : '!mt-12'}>
                        <h2 className="section-heading mb-4">{section.heading}</h2>
                        <div className="space-y-3">
                            {section.paragraphs?.map((paragraph, index) => <Paragraph key={index} content={paragraph} />)}
                            {section.bullets && <ul className="list-disc space-y-3 pl-5 marker:text-[#78917f]">
                                {section.bullets.map(item => <li key={item.label}><strong>{item.label}</strong> {item.text}</li>)}
                            </ul>}
                        </div>
                    </section>)}
                    {copy.cta && <div className="!mt-12 border-t border-[#d9ded5] pt-8 sm:pt-10">
                        <h2 className="section-heading mb-5">{copy.cta.heading}</h2>
                        <Link href={localeRoutes[locale].home} className="button-primary">{copy.cta.label}</Link>
                    </div>}
                </div>
            </article>
        </main>
        <SiteFooter locale={locale} active={active} />
    </div>;
}

import Link from 'next/link';
import Editor from '@/components/editor/Editor';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { guideHref } from '@/lib/guides/routes';
import { hamaMakerContent } from '@/lib/hama-maker/content';
import { hamaMakerPaths } from '@/lib/hama-maker/routes';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import HamaMakerExample from './HamaMakerExample';

const siteUrl = 'https://fusebeadpatterns.art';

export default function HamaMakerPage({ locale }: { locale: SiteLocale }) {
    const copy = hamaMakerContent[locale];
    const url = `${siteUrl}${hamaMakerPaths[locale]}`;
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: copy.heading,
        description: copy.description,
        url,
        inLanguage: locale,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    };
    const links = [
        { href: localeRoutes[locale].hamaPatterns, label: copy.downloads },
        { href: guideHref('photo-to-perler-bead-pattern', locale), label: copy.photoGuide },
        { href: guideHref('perler-to-hama-artkal', locale), label: copy.brandGuide },
        { href: guideHref('perler-bead-pegboards', locale), label: copy.boardGuide },
    ];

    return <>
        <SiteHeader locale={locale} />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replaceAll('<', '\u003c') }} />
            <Breadcrumbs label={{ en: 'Breadcrumb', de: 'Brotkrümelnavigation', fr: 'Fil d’Ariane', ja: 'パンくずリスト' }[locale]} items={[
                { label: { en: 'Home', de: 'Startseite', fr: 'Accueil', ja: 'ホーム' }[locale], href: localeRoutes[locale].home },
                { label: copy.heading, href: hamaMakerPaths[locale] },
            ]} />
            <h1 className="page-heading">{copy.heading}</h1>
            <p className="mt-4 max-w-[70ch] text-base leading-7 text-muted">{copy.introduction}</p>
            <section id="generator" aria-label={copy.workspace} className="mt-8 scroll-mt-6">
                <Editor locale={locale} initialPaletteId="hama" />
            </section>
            <HamaMakerExample locale={locale} />
            <section aria-labelledby="hama-maker-steps" className="mt-10 max-w-[75ch] border-t border-line pt-8">
                <h2 id="hama-maker-steps" className="section-heading">{copy.stepsHeading}</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted">
                    {copy.steps.map(step => <li key={step}>{step}</li>)}
                </ol>
            </section>
            <section aria-labelledby="hama-maker-faq" className="mt-10 max-w-[75ch] border-t border-line pt-8">
                <h2 id="hama-maker-faq" className="section-heading">{copy.faqHeading}</h2>
                <div className="mt-5 space-y-6">
                    {copy.faqs.map(faq => <div key={faq.question}>
                        <h3 className="font-semibold">{faq.question}</h3>
                        <p className="mt-2 leading-7 text-muted">{faq.answer}</p>
                    </div>)}
                </div>
            </section>
            <section aria-labelledby="hama-maker-links" className="mt-10 max-w-[75ch] border-t border-line pt-8">
                <h2 id="hama-maker-links" className="section-heading">{copy.linksHeading}</h2>
                <ul className="mt-4 space-y-2">
                    {links.map(link => <li key={link.href}><Link href={link.href} className="text-link">{link.label}</Link></li>)}
                </ul>
                <p className="mt-5 text-sm leading-7 text-muted">{copy.sourceNote}</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <a href="https://hama.dk/en/pages/colour-chart" hrefLang="en" className="text-link">{copy.colourChart}</a>
                    <a href="https://hama.dk/pages/faq" hrefLang="da" className="text-link">{copy.sizeGuide}</a>
                </div>
            </section>
        </main>
        <SiteFooter locale={locale} />
    </>;
}

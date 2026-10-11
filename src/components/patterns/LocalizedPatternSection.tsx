import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { getLocalizedPatternName, type PatternLocale } from '@/lib/patterns/localized-content';
import { fewestColorsText, type LocalizedPatternSection as Section } from '@/lib/patterns/localized-sections';
import { localizedPatternUi } from '@/lib/patterns/localized-ui';
import { sectionUi } from '@/lib/patterns/section-messages';
import { PatternGrid } from './PatternCards';
import { toLocalizedPatternCard } from './LocalizedPatternCatalog';
import PatternSectionNav from './PatternSectionNav';
import PatternLibraryHelp from './PatternLibraryHelp';
import SmallPatternContent from './SmallPatternContent';

const siteUrl = 'https://fusebeadpatterns.art';
export { localizedSectionMetadata } from '@/lib/patterns/localized-sections';

export default function LocalizedPatternSection({ section, locale }: { section: Section; locale: PatternLocale }) {
    if (section.slug === 'small') return <>
        <SiteHeader locale={locale} active="patterns" />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1 pb-16 sm:pb-24"><SmallPatternContent locale={locale} /></main>
        <SiteFooter locale={locale} active="patterns" />
    </>;
    const ui = sectionUi[locale];
    const copy = localizedPatternUi[locale];
    const structuredData = {
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: section.title,
        description: section.description, inLanguage: locale, url: `${siteUrl}${section.href}`,
        mainEntity: { '@type': 'ItemList', numberOfItems: section.patterns.length, itemListElement: section.patterns.map((pattern, index) => ({ '@type': 'ListItem', position: index + 1, name: toLocalizedPatternCard(pattern, locale).title, url: `${siteUrl}/${locale}/patterns/${pattern.slug}` })) },
    };
    return <>
        <SiteHeader locale={locale} active="patterns" />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1 pb-16 sm:pb-24">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }} />
            <Breadcrumbs label={{ de: 'Brotkrümelnavigation', fr: 'Fil d’Ariane', ja: 'パンくずリスト' }[locale]} items={[{ label: copy.home, href: `/${locale}` }, { label: ui.library, href: `/${locale}/patterns` }, { label: section.label, href: section.href }]} />
            <h1 className="page-heading pt-4 sm:pt-8">{section.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted sm:text-lg">{section.intro}</p>
            <PatternSectionNav locale={locale} current={section.slug} />
            <div className="mt-8"><PatternGrid patterns={section.patterns.map(pattern => toLocalizedPatternCard(pattern, locale))} /></div>
            {!!section.additionalPatterns?.length && <section className="mt-12 border-t border-line pt-8" aria-labelledby="additional-patterns-heading">
                <h2 id="additional-patterns-heading" className="section-heading mb-6">{section.slug === 'halloween' ? ui.additionalHalloween : ui.additional}</h2>
                <PatternGrid patterns={section.additionalPatterns.map(pattern => toLocalizedPatternCard(pattern, locale))} />
            </section>}
            <section aria-labelledby="choosing-pattern-heading" className="mt-14 max-w-3xl border-t border-line pt-8">
                <h2 id="choosing-pattern-heading" className="section-heading">{section.heading}</h2>
                {section.fewest && <p className="mt-4 leading-8 text-muted"><Link href={`/${locale}/patterns/${section.fewest.slug}`} className="text-link">{getLocalizedPatternName(section.fewest, locale)}</Link>{fewestColorsText(section.fewest, locale).slice(getLocalizedPatternName(section.fewest, locale).length)}</p>}
                {section.notes.map(note => <p key={note} className="mt-4 leading-8 text-muted">{note}</p>)}
                <nav aria-label={ui.related} className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                    {section.relatedLinks.map(link => <Link key={link.href} href={link.href} hrefLang={link.language} className="text-link">{link.label}</Link>)}
                </nav>
            </section>
            {section.slug === 'christmas' && locale !== 'fr' && <PatternLibraryHelp locale={locale} id="printing" />}
            <p className="mt-8"><Link href={`/${locale}/patterns`} className="text-link">{ui.all}</Link></p>
        </main>
        <SiteFooter locale={locale} active="patterns" />
    </>;
}

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { hamaLanguageAlternates } from '@/lib/i18n/metadata';
import { localizedHamaCopy, localizedHamaPatterns, localizedHamaGuideLinks, type HamaDownloadLocale } from '@/lib/patterns/localized-hama';
const siteUrl = 'https://fusebeadpatterns.art';
const preview = '/patterns-hama/original-friendly-ghost/preview.png';
export function localizedHamaMetadata(locale: HamaDownloadLocale): Metadata {
    const copy = localizedHamaCopy[locale];
    return {
        title: copy.title, description: copy.description,
        alternates: { canonical: copy.path, languages: hamaLanguageAlternates },
        openGraph: { title: copy.title, description: copy.description, type: 'website', locale: locale === 'fr' ? 'fr_FR' : 'ja_JP', url: `${siteUrl}${copy.path}`, siteName: 'Fuse Bead Patterns', images: [{ url: preview, width: 580, height: 580, alt: copy.previewAlt(localizedHamaPatterns(locale)[1].name) }] },
        twitter: { card: 'summary_large_image', title: copy.title, description: copy.description, images: [preview] },
    };
}
export function LocalizedHamaDownloads({ locale }: { locale: HamaDownloadLocale }) {
    const copy = localizedHamaCopy[locale];
    return <section aria-labelledby="hama-patterns" className="mt-9">
        <h2 id="hama-patterns" className="mb-6 section-heading">{copy.cardsHeading}</h2>
        <div className="pattern-grid">{localizedHamaPatterns(locale).map(pattern => {
            const tracking = { 'data-pattern-id': pattern.projectId, 'data-pattern-palette': 'hama', 'data-pattern-entry': 'collection' };
            return <article key={pattern.id} id={pattern.id} className="pattern-card scroll-mt-6" data-pattern-card={pattern.projectId} aria-labelledby={`${pattern.id}-title`}>
                <a href={pattern.pdf} hrefLang={locale} download={`${pattern.id}-hama-${locale}-a4.pdf`} className="block rounded-[10px]" aria-label={copy.pdfLabel(pattern.name)} data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>
                    <div className="pattern-art"><Image src={pattern.preview} alt={copy.previewAlt(pattern.name)} width={580} height={580} unoptimized className="pattern-image" /></div>
                    <div className="pattern-card-title"><h3 id={`${pattern.id}-title`}>{pattern.name}</h3><span aria-hidden="true">↓</span></div>
                </a>
                <div className="flex flex-wrap gap-x-4">
                    <a href={pattern.pdf} hrefLang={locale} download={`${pattern.id}-hama-${locale}-a4.pdf`} className="text-link" aria-label={copy.pdfLabel(pattern.name)} data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>{copy.pdf}</a>
                    <Link href={pattern.editor} prefetch={false} className="text-link" aria-label={copy.editLabel(pattern.name)} data-pattern-event="pattern_editor_open" {...tracking}>{copy.edit}</Link>
                </div>
                <div className="flex flex-wrap gap-x-4 text-xs text-muted">
                    <a href={pattern.pdfLetter} hrefLang="en" download={`${pattern.id}-hama-letter.pdf`} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent" aria-label={copy.letterLabel(pattern.name)} data-pattern-event="pattern_download" data-pattern-format="pdf" {...tracking}>{copy.letterPdf}</a>
                    <a href={pattern.pixels} download={`${pattern.id}-hama-pixels.png`} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent" aria-label={copy.pixelsLabel(pattern.name)} data-pattern-event="pattern_download" data-pattern-format="png" {...tracking}>{copy.pixels}</a>
                </div>
                <div className="flex flex-wrap gap-x-4 text-xs text-muted">
                    <a href={pattern.project} download={`${pattern.id}-hama.bead-pattern.json`} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent" aria-label={copy.projectLabel(pattern.name)} data-pattern-event="pattern_download" data-pattern-format="project" {...tracking}>{copy.project}</a>
                    <Link href={pattern.perler} prefetch={false} className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent">{copy.perler}</Link>
                </div>
            </article>;
        })}</div>
    </section>;
}
export default function LocalizedHamaPatterns({ locale }: { locale: HamaDownloadLocale }) {
    const copy = localizedHamaCopy[locale], patterns = localizedHamaPatterns(locale), url = `${siteUrl}${copy.path}`;
    const structuredData = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: copy.heading, description: copy.description, inLanguage: locale, url, mainEntity: { '@type': 'ItemList', numberOfItems: patterns.length, itemListElement: patterns.map((pattern, index) => ({ '@type': 'ListItem', position: index + 1, name: pattern.name, url: `${url}#${pattern.id}` })) } };
    return <>
        <SiteHeader locale={locale} active="patterns" />
        <main id="main-content" tabIndex={-1} className="page-shell pattern-index flex-1">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }} />
            <Breadcrumbs label={copy.breadcrumb} items={[{ label: copy.home, href: `/${locale}` }, { label: copy.library, href: `/${locale}/patterns` }, { label: copy.category, href: copy.path }]} />
            <h1 className="page-heading leading-snug">{copy.heading}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted sm:text-lg">{copy.intro}</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{copy.sizeHelp}</p>
            <LocalizedHamaDownloads locale={locale} />
            <p className="mt-6 max-w-3xl text-sm leading-7 text-muted">{copy.fileHelp}</p>
            <section aria-labelledby="hama-colours" className="mt-14 max-w-3xl border-t border-line pt-8">
                <h2 id="hama-colours" className="section-heading">{copy.coloursHeading}</h2>
                <p className="mt-4 leading-8 text-muted">{copy.colours}</p>
                <p className="mt-3 leading-8 text-muted">{copy.editing}</p>
                <p className="mt-3 text-sm leading-7 text-muted">{copy.limitations}</p>
                <p className="mt-3 text-sm leading-7 text-muted">{copy.references}{' '}<a href="https://hama.dk/en/pages/colour-chart" hrefLang="en" className="underline underline-offset-4">{copy.colourChart}</a>{' '}{copy.referenceJoin}{' '}<a href="https://hama.dk/pages/faq" hrefLang="da" className="underline underline-offset-4">{copy.sizeGuide}</a>{locale === 'ja' ? 'で確認してください。' : '.'}</p>
            </section>
            <section aria-labelledby="hama-printing" className="mt-10 max-w-3xl">
                <h2 id="hama-printing" className="section-heading">{copy.printingHeading}</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5 leading-8 text-muted">{copy.printingSteps.map(step => <li key={step}>{step}</li>)}</ol>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">{localizedHamaGuideLinks(locale).map(link => <Link key={link.href} href={link.href} className="text-link">{link.label}</Link>)}</div>
            </section>
        </main>
        <SiteFooter locale={locale} active="patterns" />
    </>;
}

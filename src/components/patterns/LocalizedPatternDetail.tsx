import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { patterns, type Pattern } from '@/lib/patterns/catalog';
import { getLocalizedPatternTitle, getLocalizedPatternName, getLocalizedPatternIntro, localizePatternNote, type PatternLocale } from '@/lib/patterns/localized-content';
import { localizedPatternUi } from '@/lib/patterns/localized-ui';
import { getLocalizedPatternPdf } from '@/lib/patterns/localized-download';
import { localizePatternSourceDescription } from '@/lib/patterns/localized-sources';
import { patternTopics } from '@/lib/patterns/topics';
import { getPatternSectionHref, type PatternSectionSlug } from '@/lib/patterns/section-routes';
import { sectionLabels, sectionUi } from '@/lib/patterns/section-messages';
import { patternLanguageAlternates } from '@/lib/i18n/metadata';
import { PatternGrid } from './PatternCards';
import { toLocalizedPatternCard } from './LocalizedPatternCatalog';
import PatternShare from './PatternShare';

const siteUrl = 'https://fusebeadpatterns.art';
export function localizedPatternMetadata(pattern: Pattern, locale: PatternLocale): Metadata {
    const title = `${getLocalizedPatternTitle(pattern, locale)} | Fuse Bead Patterns`;
    const description = getLocalizedPatternIntro(pattern, locale);
    const href = `/${locale}/patterns/${pattern.slug}`;
    return {
        title, description, alternates: { canonical: href, languages: patternLanguageAlternates(pattern.slug) },
        openGraph: { title, description, locale: { de: 'de_DE', fr: 'fr_FR', ja: 'ja_JP' }[locale], type: 'website', url: `${siteUrl}${href}`, images: [{ url: pattern.assets.preview, width: 580, height: 580, alt: getLocalizedPatternTitle(pattern, locale) }] },
        twitter: { card: 'summary_large_image', title, description, images: [pattern.assets.preview] },
    };
}
export default function LocalizedPatternDetail({ pattern, locale }: { pattern: Pattern; locale: PatternLocale }) {
    const copy = localizedPatternUi[locale];
    const name = getLocalizedPatternName(pattern, locale);
    const title = getLocalizedPatternTitle(pattern, locale);
    const href = `/${locale}/patterns/${pattern.slug}`;
    const pdf = getLocalizedPatternPdf(pattern, locale);
    const related = patterns.filter(item => item.id !== pattern.id && item.collectionId === pattern.collectionId).slice(0, 4);
    const collection = pattern.collectionId ? { label: sectionLabels[locale][pattern.collectionId as PatternSectionSlug], href: getPatternSectionHref(pattern.collectionId, locale) } : null;
    const topics = patternTopics.filter(topic => topic.patternIds.includes(pattern.id));
    const tracking = { 'data-pattern-event': 'pattern_download', 'data-pattern-id': pattern.id, 'data-pattern-palette': 'perler', 'data-pattern-entry': 'pattern_detail' };
    const structuredData = { '@context': 'https://schema.org', '@type': 'WebPage', name: title, description: getLocalizedPatternIntro(pattern, locale), url: `${siteUrl}${href}`, inLanguage: locale, primaryImageOfPage: `${siteUrl}${pattern.assets.preview}` };
    return <>
        <SiteHeader locale={locale} active="patterns" />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1 pb-16 sm:pb-24">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }} />
            <Breadcrumbs label={{ de: 'Brotkrümelnavigation', fr: 'Fil d’Ariane', ja: 'パンくずリスト' }[locale]} items={[{ label: copy.home, href: `/${locale}` }, { label: copy.library, href: `/${locale}/patterns` }, ...(collection ? [collection] : []), { label: name, href }]} />
            <article>
                <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
                    <div className="pattern-art rounded-xl border border-line"><Image src={pattern.assets.preview} alt={title} width={580} height={580} unoptimized priority className="pattern-image" /></div>
                    <div>
                        <h1 className="page-heading leading-snug">{title}</h1>
                        <p className="mt-4 max-w-3xl leading-7 text-muted">{getLocalizedPatternIntro(pattern, locale)}</p>
                        <dl className="my-6 grid grid-cols-2 gap-4 text-sm">
                            {[[copy.design, `${pattern.motifWidth} × ${pattern.motifHeight}`], [copy.board, `${pattern.gridWidth} × ${pattern.gridHeight} MIDI`], [copy.beads, pattern.beads], [copy.colors, pattern.colorCount]].map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
                        </dl>
                        <div className="flex flex-wrap gap-3">
                            <a href={pdf.href} hrefLang={pdf.language} download {...tracking} data-pattern-format="pdf" className="button-primary">{pdf.language === locale ? copy.pdf : copy.englishPdf}</a>
                            <a href={pattern.assets.grid} download {...tracking} data-pattern-format="grid_png" className="button-secondary">{copy.grid}</a>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-muted">{copy.print}</p>
                        <Link href={`/${locale}/editor?pattern=${encodeURIComponent(pattern.id)}`} prefetch={false} {...tracking} data-pattern-event="pattern_editor_open" className="text-link mt-4">{copy.edit} →</Link>
                        <p className="mt-2 text-sm leading-7 text-muted">{copy.brand}</p>
                        <PatternShare locale={locale} url={`${siteUrl}${href}`} title={title} />
                    </div>
                </div>
                <div className="mt-12 grid items-start gap-10 lg:grid-cols-2">
                    <section aria-labelledby="chart-heading">
                        <h2 id="chart-heading" className="section-heading mb-5">{copy.chart}</h2>
                        <a href={pattern.assets.grid} target="_blank" rel="noopener noreferrer"><Image src={pattern.assets.grid} alt={`${name} · ${copy.chartAlt}`} width={586} height={586} unoptimized className="h-auto w-full rounded-xl border border-line" /></a>
                        <p className="mt-3 text-sm leading-7 text-muted">{copy.chartHelp}</p>
                    </section>
                    <section aria-labelledby="colors-heading">
                        <h2 id="colors-heading" className="section-heading mb-5">{copy.materials}</h2>
                        <table className="w-full text-left text-sm">
                            <caption className="sr-only">{name} · {copy.materials}</caption>
                            <thead><tr className="border-b border-line"><th scope="col" className="py-3">{copy.symbol}</th><th scope="col" className="py-3">{copy.color}</th><th scope="col" className="py-3 text-right">{copy.beads}</th></tr></thead>
                            <tbody>{pattern.palette.map(color => <tr key={color.ref} className="border-b border-line"><td className="py-3"><span aria-hidden="true" className="mr-2 inline-block h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: color.hex }} />{color.symbol}</td><td className="py-3"><span lang="en">{color.name}</span><br /><span className="text-muted">{color.ref}</span></td><td className="py-3 text-right tabular-nums">{color.count}</td></tr>)}</tbody>
                            <tfoot><tr><th scope="row" colSpan={2} className="py-3">{copy.total}</th><td className="py-3 text-right font-semibold">{pattern.beads}</td></tr></tfoot>
                        </table>
                        <p className="mt-3 text-sm leading-7 text-muted">{copy.colorHelp}</p>
                    </section>
                </div>
                <section className="mt-12 max-w-3xl border-t border-line pt-8">
                    <h2 className="section-heading">{copy.make}</h2>
                    <ul className="mt-5 list-disc space-y-3 pl-5 leading-8 text-muted">{pattern.notes.map(note => <li key={note}>{localizePatternNote(note, locale)}</li>)}</ul>
                </section>
                <details className="mt-8 border-t border-line pt-5 text-sm leading-7 text-muted">
                    <summary className="min-h-11 cursor-pointer font-semibold">{pattern.source ? copy.reference : copy.original}</summary>
                    {pattern.source ? <div className="mt-3 max-w-3xl"><p lang={locale}>{localizePatternSourceDescription(pattern.source.description, locale)}</p><a href={pattern.source.url} target="_blank" rel="noopener noreferrer" className="text-link">{copy.source}: <span lang="en">{pattern.source.label}</span></a></div> : <p>{copy.originalText}</p>}
                    <div className="mt-3 flex flex-wrap gap-x-6"><a href={pattern.assets.project} download {...tracking} data-pattern-format="project" className="text-link">{copy.project}</a><a href={pattern.assets.pixels} download {...tracking} data-pattern-format="png" className="text-link">{copy.pixels}</a></div>
                </details>
            </article>
            {topics.length > 0 && <nav aria-label={sectionUi[locale].related} className="mt-8 flex flex-wrap gap-x-6 text-sm">{topics.map(topic => <Link key={topic.slug} href={getPatternSectionHref(topic.slug, locale)} className="text-link">{sectionLabels[locale][topic.slug as PatternSectionSlug]}</Link>)}</nav>}
            <section className="mt-12 border-t border-line pt-8"><h2 className="section-heading mb-7">{copy.related}</h2><PatternGrid patterns={related.map(item => toLocalizedPatternCard(item, locale))} headingLevel={3} /></section>
        </main>
        <SiteFooter locale={locale} active="patterns" />
    </>;
}

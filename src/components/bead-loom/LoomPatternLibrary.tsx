import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { loomPatternLibraryContent } from '@/lib/bead-loom/pattern-library-content';
import { loomPatterns, loomPatternAssetPath } from '@/lib/bead-loom/patterns';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';

export default function LoomPatternLibrary({ locale }: { locale: SiteLocale }) {
    const copy = loomPatternLibraryContent[locale];
    const routes = localeRoutes[locale];
    return <>
        <SiteHeader locale={locale} />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1">
            <Breadcrumbs label={copy.breadcrumb} items={[{ label: copy.home, href: routes.home }, { label: copy.heading, href: routes.beadLoomPatterns }]} />
            <h1 className="page-heading">{copy.heading}</h1>
            <p className="mt-4 max-w-[75ch] text-base leading-7 text-muted">{copy.introduction}</p>
            <section aria-label={copy.collectionLabel} className="mt-9">
                <p className="mb-5 max-w-[75ch] text-sm leading-6 text-muted">{copy.previewCaption}</p>
                <div className="grid grid-cols-1 gap-x-6 gap-y-9 md:grid-cols-3">
                    {loomPatterns.map(pattern => {
                        const name = pattern.titles[locale];
                        const pdfA4 = loomPatternAssetPath(pattern.id, locale, 'pdf', 'a4');
                        const pdfLetter = loomPatternAssetPath(pattern.id, locale, 'pdf', 'letter');
                        return <article key={pattern.id} id={pattern.id} className="pattern-card scroll-mt-6" aria-labelledby={`${pattern.id}-title`}>
                            <div className="overflow-hidden rounded-[10px] border border-line bg-[#faf8f3] p-3">
                                <Image src={loomPatternAssetPath(pattern.id, locale, 'preview')} alt={name} width={768} height={180} unoptimized className="h-auto w-full" />
                            </div>
                            <div className="pattern-card-title"><h2 id={`${pattern.id}-title`}>{name}</h2></div>
                            <p className="text-sm leading-6 text-muted">{copy.dimensions(pattern.columns, pattern.rows)}</p>
                            <p className="mt-2 text-sm leading-6 text-muted">{pattern.descriptions[locale]}</p>
                            <div className="mt-3 flex flex-wrap gap-x-5">
                                <a href={pdfA4} download={`${pattern.id}-${locale}-a4.pdf`} className="text-link" aria-label={`${name}: ${copy.download} ${copy.pdfA4}`}>{copy.pdfA4}</a>
                                <a href={pdfLetter} download={`${pattern.id}-${locale}-us-letter.pdf`} className="text-link" aria-label={`${name}: ${copy.download} ${copy.pdfLetter}`}>{copy.pdfLetter}</a>
                                <a href={loomPatternAssetPath(pattern.id, locale, 'png')} download={`${pattern.id}-chart.png`} className="text-link" aria-label={`${name}: ${copy.download} ${copy.png}`}>{copy.png}</a>
                            </div>
                            <div className="flex flex-wrap gap-x-5">
                                <a href={loomPatternAssetPath(pattern.id, locale, 'project')} download={`${pattern.id}-${locale}.bead-loom.json`} className="text-link" aria-label={`${name}: ${copy.download} ${copy.project}`}>{copy.project}</a>
                                <a href={`${routes.beadLoom}?pattern=${encodeURIComponent(pattern.id)}`} className="text-link" aria-label={`${name}: ${copy.edit}`}>{copy.edit}</a>
                            </div>
                        </article>;
                    })}
                </div>
            </section>
            <section aria-labelledby="loom-pattern-help" className="mt-12 max-w-[75ch] border-t border-line pt-8 text-base leading-7 text-muted">
                <h2 id="loom-pattern-help" className="font-display text-2xl font-semibold text-ink">{copy.helpHeading}</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5">{copy.steps.map(step => <li key={step}>{step}</li>)}</ol>
                <p className="mt-5">{copy.chartHelp}</p>
                <p className="mt-5">{copy.sizingHelp}</p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                    <a href={routes.beadLoom} className="text-link">{copy.makerLink}</a>
                    <Link href={routes.guides} className="text-link">{copy.guideLink}</Link>
                </div>
            </section>
        </main>
        <SiteFooter locale={locale} description={copy.footer} />
    </>;
}

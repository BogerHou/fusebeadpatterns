import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { SiteLocale } from '@/lib/i18n/locales';
import { guideHref } from '@/lib/guides/routes';
import { adultPatternCopy, getAdultPatternGroups, getAdultBoardCount } from '@/lib/patterns/adult';
import { getLocalizedPatternName, getLocalizedPatternTitle } from '@/lib/patterns/localized-content';
import { getLocalizedPatternGrid, getLocalizedPatternPdf, getLocalizedPatternLetterPdf } from '@/lib/patterns/localized-download';
import { getPatternDisplayName } from '@/lib/patterns/presentation';
import { getPatternSectionHref } from '@/lib/patterns/section-routes';

export default function AdultPatternContent({ locale }: { locale: SiteLocale }) {
    const copy = adultPatternCopy[locale];
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const href = getPatternSectionHref('adult', locale);
    const groups = getAdultPatternGroups();
    const selected = groups.flatMap(group => group.patterns);
    const name = (pattern: typeof selected[number]) => locale === 'en' ? getPatternDisplayName(pattern) : getLocalizedPatternName(pattern, locale);
    const structuredData = {
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: copy.title,
        description: copy.description, inLanguage: locale, url: `https://fusebeadpatterns.art${href}`,
        mainEntity: { '@type': 'ItemList', numberOfItems: selected.length, itemListElement: selected.map((pattern, index) => ({
            '@type': 'ListItem', position: index + 1, name: name(pattern), url: `https://fusebeadpatterns.art${prefix}/patterns/${pattern.slug}`,
        })) },
    };
    const relatedLinks = [
        { href: guideHref('perler-bead-pegboards', locale), label: copy.boardGuide },
        { href: guideHref('perler-to-hama-artkal', locale), label: copy.brandGuide },
        { href: getPatternSectionHref('rave', locale), label: copy.rave },
    ];

    return <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }} />
        <Breadcrumbs label={copy.breadcrumb} items={[
            { label: copy.home, href: prefix || '/' },
            { label: copy.library, href: `${prefix}/patterns` },
            { label: copy.label, href },
        ]} />
        <h1 className="page-heading pt-1 sm:pt-2">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted">{copy.intro}</p>
        {groups.map(group => <section key={group.id} aria-labelledby={`adult-${group.id}-heading`} className="mt-8 sm:mt-10">
            <h2 id={`adult-${group.id}-heading`} className="section-heading text-2xl sm:text-[1.75rem]">{copy.groups[group.id].title}</h2>
            <p className="mb-5 mt-2 text-sm leading-7 text-muted">{copy.groups[group.id].intro}</p>
            <div className={group.id === 'geometry' ? 'grid max-w-md gap-8' : `grid gap-8 sm:grid-cols-2 lg:gap-x-12 ${group.id === 'festival' ? 'lg:grid-cols-3' : ''}`}>
                {group.patterns.map(pattern => {
                    const detailHref = `${prefix}/patterns/${pattern.slug}`;
                    const pdf = locale === 'en' ? pattern.assets.pdf : getLocalizedPatternPdf(pattern, locale).href;
                    const letter = locale === 'en' ? pattern.assets.pdfLetter : getLocalizedPatternLetterPdf(pattern, locale)?.href;
                    const grid = locale === 'en' ? pattern.assets.grid : getLocalizedPatternGrid(pattern, locale).href;
                    return <article key={pattern.id} className="pattern-card" data-pattern-card={pattern.id}>
                        <Link href={detailHref} prefetch={false} className="block rounded-lg">
                            <div className="pattern-art">
                                <Image src={pattern.assets.preview} alt={locale === 'en' ? `${name(pattern)} Perler bead pattern` : getLocalizedPatternTitle(pattern, locale)} width={580} height={580} unoptimized className="pattern-image" />
                            </div>
                            <div className="pattern-card-title"><h3>{name(pattern)}</h3><span aria-hidden="true">↗</span></div>
                        </Link>
                        <p className="mt-3 text-sm leading-7 text-muted">{copy.reasons[pattern.id as keyof typeof copy.reasons]}</p>
                        <dl className="mt-4 space-y-1 text-sm leading-6">
                            <div className="flex flex-wrap justify-between gap-x-2"><dt className="text-muted">{copy.motif}</dt><dd className="font-medium">{pattern.motifWidth} × {pattern.motifHeight}</dd></div>
                            <div className="flex flex-wrap justify-between gap-x-2"><dt className="text-muted">{copy.grid}</dt><dd className="font-medium">{pattern.gridWidth} × {pattern.gridHeight}</dd></div>
                            <div className="flex flex-wrap justify-between gap-x-2"><dt className="text-muted">{copy.boards}</dt><dd className="font-medium">{getAdultBoardCount(pattern) === 1 ? copy.oneBoard : `${getAdultBoardCount(pattern)} ${copy.boardUnit}`}</dd></div>
                            <div className="flex flex-wrap justify-between gap-x-2"><dt className="text-muted">{copy.beads}</dt><dd className="font-medium">{pattern.beads}</dd></div>
                            <div className="flex flex-wrap justify-between gap-x-2"><dt className="text-muted">{copy.colors}</dt><dd className="font-medium">{pattern.colorCount}</dd></div>
                        </dl>
                        <p className="mt-3 text-sm leading-7 text-muted">{copy.palette}</p>
                        <nav aria-label={`${name(pattern)}: ${copy.downloads}`} className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                            <Link href={detailHref} prefetch={false} className="text-link inline-flex min-h-11 items-center">{copy.details}</Link>
                            <a href={pdf} download className="text-link inline-flex min-h-11 items-center">{copy.a4}</a>
                            {letter && <a href={letter} download className="text-link inline-flex min-h-11 items-center">{copy.letter}</a>}
                            <a href={grid} download className="text-link inline-flex min-h-11 items-center">{copy.countingGrid}</a>
                            <a href={pattern.assets.project} download className="text-link inline-flex min-h-11 items-center">{copy.project}</a>
                            <Link href={`${prefix}/editor?pattern=${encodeURIComponent(pattern.id)}`} prefetch={false} className="text-link inline-flex min-h-11 items-center">{copy.edit}</Link>
                        </nav>
                    </article>;
                })}
            </div>
        </section>)}
        <section aria-labelledby="adult-choose-heading" className="mt-8 max-w-3xl">
            <h2 id="adult-choose-heading" className="section-heading">{copy.heading}</h2>
            {copy.notes.map(note => <p key={note} className="mt-3 leading-8 text-muted">{note}</p>)}
        </section>
        <section aria-labelledby="adult-print-heading" className="mt-14 max-w-3xl border-t border-line pt-8">
            <h2 id="adult-print-heading" className="section-heading">{copy.preparation}</h2>
            <p className="mt-4 leading-8 text-muted">{copy.printNote}</p>
            <p className="mt-4 leading-8 text-muted">{copy.brandNote}</p>
            <p className="mt-4 leading-8 text-muted">{copy.physicalNote}</p>
        </section>
        <nav aria-label={copy.related} className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {relatedLinks.map(link => <Link key={link.href} href={link.href} prefetch={false} className="text-link inline-flex min-h-11 items-center">{link.label}</Link>)}
        </nav>
        <p className="mt-8"><Link href={`${prefix}/patterns`} prefetch={false} className="text-link inline-flex min-h-11 items-center">{copy.all}</Link></p>
    </>;
}

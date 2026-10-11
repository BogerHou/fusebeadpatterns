import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { SiteLocale } from '@/lib/i18n/locales';
import { guideHref } from '@/lib/guides/routes';
import { getLocalizedPatternName, getLocalizedPatternTitle } from '@/lib/patterns/localized-content';
import { getPatternDisplayName } from '@/lib/patterns/presentation';
import { getPatternSectionHref } from '@/lib/patterns/section-routes';
import { getSmallPatternGroups, getSmallPatternVersion, hasSmallPatternFineConnections, smallPatternCopy } from '@/lib/patterns/small';
import PatternSectionNav from './PatternSectionNav';

export default function SmallPatternContent({ locale }: { locale: SiteLocale }) {
    const copy = smallPatternCopy[locale];
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const href = getPatternSectionHref('small', locale);
    const groups = getSmallPatternGroups();
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
        { href: guideHref('mini-perler-beads', locale), label: copy.miniGuide },
        { href: guideHref('perler-bead-pegboards', locale), label: copy.boardGuide },
        { href: getPatternSectionHref('easy', locale), label: copy.easy },
        { href: getPatternSectionHref('cute', locale), label: copy.cute },
    ];

    return <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }} />
        <Breadcrumbs label={copy.breadcrumb} items={[
            { label: copy.home, href: prefix || '/' },
            { label: copy.library, href: `${prefix}/patterns` },
            { label: copy.label, href },
        ]} />
        <h1 className="page-heading pt-4 sm:pt-8">{copy.title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-muted sm:text-lg">{copy.intro}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{copy.miniNote} <Link href={guideHref('mini-perler-beads', locale)} className="text-link">{copy.miniGuide}</Link></p>
        <PatternSectionNav locale={locale} current="small" />

        {groups.map(group => <section key={group.id} aria-labelledby={`small-${group.id}-heading`} className="mt-10">
            <h2 id={`small-${group.id}-heading`} className="section-heading mb-5">{copy.groups[group.id]}</h2>
            <div className="pattern-grid">
                {group.patterns.map(pattern => {
                    const detailHref = `${prefix}/patterns/${pattern.slug}`;
                    return <article key={pattern.id} className="pattern-card" data-pattern-card={pattern.id}>
                        <Link href={detailHref} prefetch={false} className="block rounded-lg">
                            <div className="pattern-art">
                                <Image src={pattern.assets.preview} alt={locale === 'en' ? `${name(pattern)} Perler bead pattern` : getLocalizedPatternTitle(pattern, locale)} width={580} height={580} unoptimized className="pattern-image" />
                            </div>
                            <div className="pattern-card-title"><h3>{name(pattern)}</h3><span aria-hidden="true">↗</span></div>
                        </Link>
                        <p className="mt-1 text-xs leading-6 text-muted"><span className="sr-only">{copy.version}: </span>{getSmallPatternVersion(pattern, locale)}</p>
                        <dl className="mt-3 space-y-1 text-sm leading-6">
                            <div className="flex flex-wrap justify-between gap-x-2"><dt className="text-muted">{copy.motif}</dt><dd className="font-medium">{pattern.motifWidth} × {pattern.motifHeight} {copy.cells}</dd></div>
                            <div className="flex flex-wrap justify-between gap-x-2"><dt className="text-muted">{copy.beads}</dt><dd className="font-medium">{pattern.beads}</dd></div>
                            <div className="flex flex-wrap justify-between gap-x-2"><dt className="text-muted">{copy.colors}</dt><dd className="font-medium">{pattern.colorCount}</dd></div>
                        </dl>
                        {hasSmallPatternFineConnections(pattern) && <p className="mt-3 text-xs leading-6 text-muted">{copy.delicate}</p>}
                        <Link href={detailHref} prefetch={false} className="text-link mt-2 inline-flex min-h-11 items-center text-sm" aria-label={`${name(pattern)}: ${copy.details}`}>{copy.details}</Link>
                    </article>;
                })}
            </div>
        </section>)}

        <section aria-labelledby="small-size-heading" className="mt-14 max-w-3xl border-t border-line pt-8">
            <h2 id="small-size-heading" className="section-heading">{copy.heading}</h2>
            {copy.notes.map(note => <p key={note} className="mt-4 leading-8 text-muted">{note}</p>)}
        </section>
        <section aria-labelledby="small-fewest-heading" className="mt-8 max-w-3xl">
            <h2 id="small-fewest-heading" className="section-heading">{copy.fewestQuestion}</h2>
            <p className="mt-4 leading-8 text-muted">{copy.fewestAnswer}</p>
        </section>
        <section aria-labelledby="small-mini-heading" className="mt-8 max-w-3xl">
            <h2 id="small-mini-heading" className="section-heading">{copy.miniQuestion}</h2>
            <p className="mt-4 leading-8 text-muted">{copy.miniAnswer} <Link href={guideHref('mini-perler-beads', locale)} className="text-link">{copy.miniGuide}</Link></p>
        </section>
        <nav aria-label={copy.related} className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {relatedLinks.map(link => <Link key={link.href} href={link.href} className="text-link inline-flex min-h-11 items-center">{link.label}</Link>)}
        </nav>
        <p className="mt-8"><Link href={`${prefix}/patterns`} className="text-link inline-flex min-h-11 items-center">{copy.all}</Link></p>
    </>;
}

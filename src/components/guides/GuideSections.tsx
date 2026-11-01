import Image from 'next/image';
import Link from 'next/link';
import type { GuideSection } from '@/app/(english)/guides/guide-data';
import GuidePatternGallery from '@/app/(english)/guides/GuidePatternGallery';
import type { SiteLocale } from '@/lib/i18n/locales';

function GuideFigure({ figure, compact = false, preload = false }: { figure: NonNullable<GuideSection['figure']>; compact?: boolean; preload?: boolean }) {
    return <figure className={compact ? 'mb-6 max-w-xs' : 'mt-7'}>
        <Image
            src={figure.src}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            unoptimized
            preload={preload}
            className="h-auto w-full rounded-lg border border-[#d9ded5]"
        />
        <figcaption className="mt-3 text-sm leading-6 text-[#59685d]">
            {figure.caption}
        </figcaption>
    </figure>;
}

export default function GuideSections({ sections, locale = 'en', id }: { sections: GuideSection[]; locale?: SiteLocale; id?: string }) {
    const firstImageSectionIndex = sections.findIndex(
        (section) => Boolean(section.figure || (section.comparison && section.comparison.length > 0))
    );
    return (
        <div id={id} className="mt-10 scroll-mt-6 space-y-10 sm:mt-14 sm:space-y-14">
            {sections.map((section, sectionIndex) => {
                const isFirstImageSection = sectionIndex === firstImageSectionIndex;
                return (
                <section key={section.heading}>
                    <h2 className="section-heading mb-4">
                        {section.heading}
                    </h2>
                    {section.figure && section.figureFirst ? <GuideFigure figure={section.figure} compact preload={isFirstImageSection} /> : null}
                    <div className="max-w-[70ch] space-y-5 text-base leading-8 text-[#43564d] sm:text-lg sm:leading-8">
                        {section.body.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                    {section.table ? (
                        <div
                            role="region"
                            aria-label={section.table.caption}
                            tabIndex={0}
                            className="mt-6 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#28614e]"
                        >
                            <table className="w-full min-w-[40rem] border-collapse text-left text-base leading-7 text-[#43564d]">
                                <caption className="pb-4 text-left text-sm leading-6 text-[#59685d]">
                                    {section.table.caption}
                                </caption>
                                <thead>
                                    <tr className="border-y border-[#d9ded5] bg-[#f2f4ed]">
                                        {section.table.headers.map((header) => (
                                            <th key={header} scope="col" className="px-4 py-3 font-semibold text-[#243e36]">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.table.rows.map((row) => (
                                        <tr key={row.label} className="border-b border-[#d9ded5] align-top">
                                            <th scope="row" className="px-4 py-4 font-semibold text-[#243e36]">
                                                {row.label}
                                            </th>
                                            {row.cells.map((cell, index) => (
                                                <td key={index} className="px-4 py-4">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                    {section.patternIds ? (
                        <GuidePatternGallery patternIds={section.patternIds} locale={locale} />
                    ) : null}
                    {section.comparison ? (
                        <div className={`mt-7 grid gap-6 ${section.comparison.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                            {section.comparison.map((figure, figIndex) => (
                                <figure key={figure.src}>
                                    <Image
                                        src={figure.src}
                                        alt={figure.alt}
                                        width={figure.width}
                                        height={figure.height}
                                        unoptimized
                                        preload={isFirstImageSection && !(section.figure && section.figureFirst) && figIndex === 0}
                                        className="aspect-square h-auto w-full rounded-lg border border-[#d9ded5] object-contain"
                                    />
                                    <figcaption className="mt-3 text-sm leading-6 text-[#59685d]">
                                        {figure.caption}
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    ) : null}
                    {section.links ? (
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-base sm:text-lg">
                            {section.links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    download={link.download}
                                    prefetch={link.download ? false : link.prefetch}
                                    className="text-link"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    ) : null}
                    {section.bullets ? (
                        <ul className="mt-5 list-disc space-y-3 pl-5 text-base leading-8 text-[#43564d] marker:text-[#78917f] sm:text-lg">
                            {section.bullets.map((bullet) => (
                                <li
                                    key={bullet}
                                    className="pl-1"
                                >
                                    {bullet}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    {section.figure && !section.figureFirst ? <GuideFigure figure={section.figure} preload={isFirstImageSection && !section.comparison?.length} /> : null}
                </section>
                );
            })}
        </div>
    );
}

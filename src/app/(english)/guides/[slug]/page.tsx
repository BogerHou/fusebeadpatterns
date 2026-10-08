import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import { getGuideBySlug, guidePages } from '../guide-data';
import GuideHeader from '../GuideHeader';
import GuidePatternGallery from '../GuidePatternGallery';

type GuideRouteProps = {
    params: Promise<{
        slug: string;
    }>;
};

export function generateStaticParams() {
    return guidePages.map((guide) => ({
        slug: guide.slug,
    }));
}

export async function generateMetadata({
    params,
}: GuideRouteProps): Promise<Metadata> {
    const { slug } = await params;
    const guide = getGuideBySlug(slug);

    if (!guide) {
        return {};
    }

    return {
        title: `${guide.title} | Fuse Bead Patterns`,
        description: guide.description,
        alternates: {
            canonical: `/guides/${guide.slug}`,
        },
        openGraph: {
            title: `${guide.title} | Fuse Bead Patterns`,
            description: guide.description,
            url: `https://fusebeadpatterns.art/guides/${guide.slug}`,
            siteName: 'Fuse Bead Patterns',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${guide.title} | Fuse Bead Patterns`,
            description: guide.description,
        },
    };
}

export default async function GuidePage({ params }: GuideRouteProps) {
    const { slug } = await params;
    const guide = getGuideBySlug(slug);

    if (!guide) {
        notFound();
    }

    return (
        <>
            <GuideHeader />
            <main id="main-content" tabIndex={-1} className="page-shell reading-page flex flex-1 flex-col pb-16 sm:pb-24">
                <Breadcrumbs
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Guides', href: '/guides' },
                        {
                            label: guide.title,
                            href: `/guides/${guide.slug}`,
                        },
                    ]}
                />
                <article className="reading-article mx-auto w-full pt-4 sm:pt-8">
                    <div className="eyebrow mb-5">
                        {guide.eyebrow}
                    </div>
                    <h1 className="page-heading">
                        {guide.title}
                    </h1>
                    <p className="mt-6 max-w-[65ch] text-lg leading-8 text-[#59685d] sm:text-xl sm:leading-9">
                        {guide.intro}
                    </p>

                    <div className="mt-10 space-y-10 sm:mt-14 sm:space-y-14">
                        {guide.sections.map((section) => (
                            <section key={section.heading}>
                                <h2 className="section-heading mb-4">
                                    {section.heading}
                                </h2>
                                <div className="max-w-[70ch] space-y-5 text-base leading-8 text-[#43564d] sm:text-lg sm:leading-8">
                                    {section.body.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                                {section.patternIds ? (
                                    <GuidePatternGallery patternIds={section.patternIds} />
                                ) : null}
                                {section.comparison ? (
                                    <div className={`mt-7 grid gap-6 ${section.comparison.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                                        {section.comparison.map((figure) => (
                                            <figure key={figure.src}>
                                                <Image
                                                    src={figure.src}
                                                    alt={figure.alt}
                                                    width={figure.width}
                                                    height={figure.height}
                                                    unoptimized
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
                                                prefetch={link.download ? false : undefined}
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
                                {section.figure ? (
                                    <figure className="mt-7">
                                        <Image
                                            src={section.figure.src}
                                            alt={section.figure.alt}
                                            width={section.figure.width}
                                            height={section.figure.height}
                                            unoptimized
                                            className="h-auto w-full rounded-lg border border-[#d9ded5]"
                                        />
                                        <figcaption className="mt-3 text-sm leading-6 text-[#59685d]">
                                            {section.figure.caption}
                                        </figcaption>
                                    </figure>
                                ) : null}
                            </section>
                        ))}
                    </div>

                    <div className="mt-12 border-t border-[#d9ded5] pt-8 sm:mt-16 sm:pt-10">
                        <h2 className="section-heading">
                            Next Step
                        </h2>
                        <div className="mt-5 flex flex-wrap gap-3">
                            {guide.relatedLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    prefetch={
                                        link.href === '/editor'
                                            ? false
                                            : undefined
                                    }
                                    className="button-secondary"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </article>
                <p className="reading-article mx-auto mt-8 w-full text-base leading-7 text-[#59685d]">
                    Ready to try a project?{' '}
                    <Link href="/patterns" className="text-link">
                        Browse printable bead patterns
                    </Link>{' '}
                    with board sizes, color lists, and downloadable charts.
                </p>
            </main>
            <SiteFooter active="guides" />
        </>
    );
}

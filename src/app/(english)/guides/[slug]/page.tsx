import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import { getGuideBySlug, guidePages, type GuideSection } from '../guide-data';
import GuideHeader from '../GuideHeader';
import GuideSections from '@/components/guides/GuideSections';
import PegboardCalculator from '@/components/guides/PegboardCalculator';
import { guideLanguageAlternates, isTranslatedGuideSlug } from '@/lib/guides/routes';

type GuideRouteProps = {
    params: Promise<{
        slug: string;
    }>;
};

function getFirstGuideImage(sections: GuideSection[]) {
    for (const section of sections) {
        if (section.figure) return section.figure;
        if (section.comparison && section.comparison.length > 0) return section.comparison[0];
    }
    return undefined;
}

// Unknown guide slugs use the complete global 404 rather than rendering an
// unmatched runtime page inside one of the site's independent root layouts.
export const dynamicParams = false;

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

    const firstImage = getFirstGuideImage(guide.sections);

    return {
        title: `${guide.title} | Fuse Bead Patterns`,
        description: guide.description,
        alternates: {
            canonical: `/guides/${guide.slug}`,
            ...(isTranslatedGuideSlug(slug) ? { languages: guideLanguageAlternates(slug) } : {}),
        },
        openGraph: {
            title: `${guide.title} | Fuse Bead Patterns`,
            description: guide.description,
            url: `https://fusebeadpatterns.art/guides/${guide.slug}`,
            siteName: 'Fuse Bead Patterns',
            locale: 'en_US',
            type: 'article',
            images: firstImage
                ? [{ url: firstImage.src, width: firstImage.width, height: firstImage.height, alt: firstImage.alt }]
                : ['/opengraph-image.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${guide.title} | Fuse Bead Patterns`,
            description: guide.description,
            images: [firstImage ? firstImage.src : '/opengraph-image.png'],
        },
    };
}

export default async function GuidePage({ params }: GuideRouteProps) {
    const { slug } = await params;
    const guide = getGuideBySlug(slug);

    if (!guide) {
        notFound();
    }

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: guide.title,
        description: guide.description,
        url: `https://fusebeadpatterns.art/guides/${guide.slug}`,
        dateModified: '2026-04-01',
        inLanguage: 'en',
        author: { '@type': 'Organization', name: 'Fuse Bead Patterns' },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c') }} />
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

                    {slug === 'perler-bead-pegboards' && <PegboardCalculator />}

                    <GuideSections sections={guide.sections} id={slug === 'photo-to-perler-bead-pattern' ? 'conversion-examples' : undefined} />

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

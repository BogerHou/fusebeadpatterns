import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import { getGuideBySlug, guidePages } from '../guide-data';
import GuideHeader from '../GuideHeader';

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
        title: `${guide.title} | Bead Pattern Maker`,
        description: guide.description,
        alternates: {
            canonical: `/guides/${guide.slug}`,
        },
        openGraph: {
            title: `${guide.title} | Bead Pattern Maker`,
            description: guide.description,
            url: `https://fusebeadpatterns.art/guides/${guide.slug}`,
            siteName: 'Bead Pattern Maker',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${guide.title} | Bead Pattern Maker`,
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
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12">
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
                <article className="border-4 border-brutal-black bg-white p-5 shadow-brutal sm:p-8">
                    <div className="mb-4 inline-block border-2 border-brutal-black bg-brand-cyan px-2 py-1 text-xs font-bold uppercase tracking-[0.14em]">
                        {guide.eyebrow}
                    </div>
                    <h1 className="max-w-4xl font-vt323 text-5xl uppercase leading-none sm:text-6xl">
                        {guide.title}
                    </h1>
                    <p className="mt-5 max-w-3xl text-xl font-medium text-gray-700">
                        {guide.intro}
                    </p>

                    <div className="mt-10 space-y-10">
                        {guide.sections.map((section) => (
                            <section key={section.heading}>
                                <h2 className="mb-3 font-vt323 text-4xl uppercase leading-none">
                                    {section.heading}
                                </h2>
                                <div className="space-y-3 text-lg leading-8 text-gray-800">
                                    {section.body.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                                {section.bullets ? (
                                    <ul className="mt-4 grid gap-2">
                                        {section.bullets.map((bullet) => (
                                            <li
                                                key={bullet}
                                                className="border-2 border-brutal-black bg-[#f7f7f4] px-3 py-2 font-bold"
                                            >
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </section>
                        ))}
                    </div>

                    <div className="mt-10 border-t-4 border-brutal-black pt-6">
                        <h2 className="font-vt323 text-3xl uppercase leading-none">
                            Next Step
                        </h2>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {guide.relatedLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    prefetch={
                                        link.href === '/editor'
                                            ? false
                                            : undefined
                                    }
                                    className="inline-flex border-4 border-brutal-black bg-brand-yellow px-4 py-2 font-bold uppercase shadow-[3px_3px_0_0_#1a1a1a] hover:bg-white"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </article>
            </main>
            <SiteFooter active="guides" />
        </>
    );
}

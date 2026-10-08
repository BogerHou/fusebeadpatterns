import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import { guidePages } from './guide-data';
import GuideHeader from './GuideHeader';

export const metadata: Metadata = {
    title: 'Perler Bead Guides | Fuse Bead Patterns',
    description:
        'Practical guides for making Perler bead patterns, choosing pegboards, planning mini bead projects, and organizing fuse bead supplies.',
    alternates: {
        canonical: '/guides',
    },
    openGraph: {
        title: 'Perler Bead Guides | Fuse Bead Patterns',
        description:
            'Practical guides for making Perler bead patterns, choosing pegboards, planning mini bead projects, and organizing fuse bead supplies.',
        url: 'https://fusebeadpatterns.art/guides',
        siteName: 'Fuse Bead Patterns',
        type: 'website',
    },
};

export default function GuidesPage() {
    return (
        <>
            <GuideHeader />
            <main id="main-content" tabIndex={-1} className="page-shell flex flex-1 flex-col pb-16 sm:pb-24">
                <Breadcrumbs
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Guides', href: '/guides' },
                    ]}
                />
                <div className="mb-10 pt-4 sm:mb-14 sm:pt-8">
                    <h1 className="page-heading">
                        Perler Bead Guides
                    </h1>
                    <p className="mt-5 max-w-[62ch] text-base leading-8 text-[#59685d] sm:text-lg">
                        Practical help for photo conversion, pegboard sizing,
                        mini beads, supplies, and ironing your finished design.
                        Follow a guide from choosing a pattern to making it
                        with real beads.
                    </p>
                </div>

                <div className="grid gap-x-12 md:grid-cols-2">
                    {guidePages.map((guide) => (
                        <Link
                            key={guide.slug}
                            href={`/guides/${guide.slug}`}
                            className="group border-t border-[#d9ded5] py-7 transition-colors hover:border-[#28614e] sm:py-9"
                        >
                            <div className="eyebrow mb-4">
                                {guide.eyebrow}
                            </div>
                            <h2 className="font-display text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#243e36] transition-colors group-hover:text-[#28614e] sm:text-3xl">
                                {guide.title}
                            </h2>
                            <p className="mt-4 max-w-[55ch] text-base leading-7 text-[#59685d]">
                                {guide.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </main>
            <SiteFooter active="guides" />
        </>
    );
}

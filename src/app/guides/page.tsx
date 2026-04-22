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
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-10 sm:px-4 sm:pb-12">
                <Breadcrumbs
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Guides', href: '/guides' },
                    ]}
                />
                <div className="mb-7 sm:mb-10">
                    <h1 className="inline-block border-2 border-brutal-black bg-brand-yellow px-3 py-2 font-vt323 text-3xl uppercase leading-none shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:px-4 sm:py-3 sm:text-5xl sm:shadow-brutal">
                        Perler Bead Guides
                    </h1>
                    <p className="mt-4 max-w-3xl text-base font-medium sm:mt-5 sm:text-xl">
                        Planning notes for photo conversion, pegboard sizing,
                        mini beads, beginner kits, and storage. Use these
                        guides when a pattern needs more planning than the
                        quick generator.
                    </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    {guidePages.map((guide) => (
                        <Link
                            key={guide.slug}
                            href={`/guides/${guide.slug}`}
                            className="group border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] transition-transform hover:-translate-y-1 hover:bg-brand-cyan sm:border-4 sm:p-5 sm:shadow-brutal"
                        >
                            <div className="mb-3 inline-block border-2 border-brutal-black bg-brand-yellow px-2 py-1 text-xs font-bold uppercase tracking-[0.12em]">
                                {guide.eyebrow}
                            </div>
                            <h2 className="font-vt323 text-2xl uppercase leading-none sm:text-4xl">
                                {guide.title}
                            </h2>
                            <p className="mt-3 text-base font-medium text-gray-700 group-hover:text-black">
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

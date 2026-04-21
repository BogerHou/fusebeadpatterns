import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/layout/SiteFooter';
import { guidePages } from './guide-data';
import GuideHeader from './GuideHeader';

export const metadata: Metadata = {
    title: 'Perler Bead Guides | Bead Pattern Maker',
    description:
        'Practical guides for making Perler bead patterns, choosing pegboards, planning mini bead projects, and organizing fuse bead supplies.',
    alternates: {
        canonical: '/guides',
    },
    openGraph: {
        title: 'Perler Bead Guides | Bead Pattern Maker',
        description:
            'Practical guides for making Perler bead patterns, choosing pegboards, planning mini bead projects, and organizing fuse bead supplies.',
        url: 'https://fusebeadpatterns.art/guides',
        siteName: 'Bead Pattern Maker',
        type: 'website',
    },
};

export default function GuidesPage() {
    return (
        <>
            <GuideHeader />
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-12">
                <div className="mb-10">
                <h1 className="inline-block border-4 border-brutal-black bg-brand-yellow px-4 py-3 font-vt323 text-5xl uppercase leading-none shadow-brutal">
                    Perler Bead Guides
                </h1>
                <p className="mt-5 max-w-3xl text-xl font-medium">
                    Planning notes for photo conversion, pegboard sizing, mini
                    beads, beginner kits, and storage. Use these guides when a
                    pattern needs more planning than the quick generator.
                </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                {guidePages.map((guide) => (
                    <Link
                        key={guide.slug}
                        href={`/guides/${guide.slug}`}
                        className="group border-4 border-brutal-black bg-white p-5 shadow-brutal transition-transform hover:-translate-y-1 hover:bg-brand-cyan"
                    >
                        <div className="mb-3 inline-block border-2 border-brutal-black bg-brand-yellow px-2 py-1 text-xs font-bold uppercase tracking-[0.12em]">
                            {guide.eyebrow}
                        </div>
                        <h2 className="font-vt323 text-4xl uppercase leading-none">
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

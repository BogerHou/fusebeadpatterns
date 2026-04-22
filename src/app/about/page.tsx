import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';

export const metadata = {
    title: 'About Fuse Bead Patterns',
    description: 'Learn about Fuse Bead Patterns, a free browser-based Perler bead pattern generator for turning photos into printable fuse bead patterns.',
    alternates: {
        canonical: '/about',
    },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <SiteHeader active="about" />

            <main className="flex-1 px-3 pb-10 flex flex-col items-center sm:px-4 sm:pb-12">
                <div className="w-full max-w-4xl">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'About', href: '/about' },
                        ]}
                    />
                </div>
                <div className="w-full max-w-4xl border-2 border-brutal-black bg-white p-5 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-8 sm:shadow-brutal md:p-12">
                    <h1 className="mb-5 font-vt323 text-4xl uppercase leading-none sm:mb-8 sm:text-6xl">
                        About Us
                    </h1>

                    <div className="space-y-5 text-base font-medium leading-7 text-gray-800 sm:space-y-6 sm:text-lg sm:leading-8">
                        <p>
                            Welcome to <strong>Fuse Bead Patterns</strong>, a free browser-based tool for turning photos, sprites, and simple artwork into printable <strong>Perler bead patterns</strong>. The goal is simple: make it easy to preview, adjust, clean up, and export a pattern before you start building.
                        </p>

                        <div className="border-l-4 border-brand-magenta bg-brand-magenta/20 p-4 sm:p-6">
                            <h3 className="mb-3 font-vt323 text-3xl uppercase leading-none sm:text-4xl">Why We Built This</h3>
                            <p>
                                We love creating <strong>fuse bead art</strong>, from small game-style sprites to custom portraits. Many pattern tools are slow, cluttered, or require uploading personal photos to a server. We wanted a generator that runs in your browser so your images stay on your device.
                            </p>
                        </div>

                        <h3 className="mb-3 mt-8 font-vt323 text-3xl uppercase leading-none sm:text-4xl">Our Core Values</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Free & Accessible:</strong> No hidden fees, no subscriptions. Open the generator and start a pattern.</li>
                            <li><strong>Privacy First:</strong> Image processing happens locally in your browser. We do not see, store, or upload your photos.</li>
                            <li><strong>Practical Control:</strong> Adjust board size, color choices, cleanup edits, and exports around the project you actually want to build.</li>
                        </ul>

                        <div className="mt-8 border-2 border-brutal-black bg-brand-cyan p-5 text-center shadow-[2px_2px_0_0_#1a1a1a] sm:mt-12 sm:border-4 sm:p-8 sm:shadow-brutal">
                            <h3 className="mb-4 font-vt323 text-3xl uppercase leading-none sm:text-4xl">Ready to start creating?</h3>
                            <Link href="/" className="inline-flex min-h-11 items-center justify-center border-2 border-brutal-black bg-brand-magenta px-5 py-3 font-black uppercase tracking-[0.08em] text-white shadow-[2px_2px_0_0_#1a1a1a] transition-all hover:translate-y-1 hover:shadow-none sm:border-4 sm:px-8 sm:py-4 sm:shadow-[4px_4px_0_0_#1a1a1a]">
                                Generate a Pattern Now
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <SiteFooter active="about" />
        </div>
    );
}

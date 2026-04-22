import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';

export const metadata = {
    title: 'About Bead Pattern Maker | The Ultimate Free Perler Bead Generator',
    description: 'Learn more about Bead Pattern Maker, the best free tool for converting your images into Perler, Hama, and Artkal bead patterns with a focus on privacy and ease of use.',
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
                            Welcome to <strong>Bead Pattern Maker</strong>, the ultimate playground for pixel art enthusiasts, crafters, and makers! Our mission is simple: to provide the easiest, fastest, and most privacy-focused tool for converting any image into a ready-to-use <strong>Perler bead pattern</strong>.
                        </p>

                        <div className="border-l-4 border-brand-magenta bg-brand-magenta/20 p-4 sm:p-6">
                            <h3 className="mb-3 font-vt323 text-3xl uppercase leading-none sm:text-4xl">Why We Built This</h3>
                            <p>
                                We love creating <strong>fuse bead art</strong>, from Minecraft items and Pokemon sprites to custom portraits. But we found that existing pattern generators were often slow, bloated with ads, or required uploading personal photos to random servers. We wanted a tool that runs entirely in your browser—so your photos stay strictly on your device.
                            </p>
                        </div>

                        <h3 className="mb-3 mt-8 font-vt323 text-3xl uppercase leading-none sm:text-4xl">Our Core Values</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>100% Free & Accessible:</strong> No hidden fees, no subscriptions. Just pure crafting joy.</li>
                            <li><strong>Absolute Privacy:</strong> All image processing happens locally in your browser. We never see, store, or upload your photos.</li>
                            <li><strong>Creative Freedom:</strong> Whether you prefer Perler, Hama, Artkal, or Nabbi beads, our tool helps you map your colors perfectly.</li>
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

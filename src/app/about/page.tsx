import React from 'react';
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

            {/* Main Content */}
            <main className="flex-1 px-4 pb-12 flex flex-col items-center">
                <div className="w-full max-w-4xl">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'About', href: '/about' },
                        ]}
                    />
                </div>
                <div className="w-full max-w-4xl border-4 border-brutal-black bg-white p-8 md:p-12 shadow-brutal relative">
                    {/* Decorative element */}
                    <div className="absolute -top-4 -left-4 w-8 h-8 bg-brand-magenta border-4 border-brutal-black rounded-full" />
                    <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-brand-cyan border-4 border-brutal-black rounded-sm" />

                    <h1 className="text-5xl font-black uppercase mb-8 tracking-tight">About Us</h1>

                    <div className="space-y-6 text-lg font-medium text-gray-800">
                        <p>
                            Welcome to <strong>Bead Pattern Maker</strong>, the ultimate playground for pixel art enthusiasts, crafters, and makers! Our mission is simple: to provide the easiest, fastest, and most privacy-focused tool for converting any image into a ready-to-use <strong>Perler bead pattern</strong>.
                        </p>

                        <div className="bg-brand-magenta/20 p-6 border-l-4 border-brand-magenta">
                            <h3 className="text-2xl font-black uppercase mb-3">Why We Built This</h3>
                            <p>
                                We love creating <strong>fuse bead art</strong>, from Minecraft items and Pokemon sprites to custom portraits. But we found that existing pattern generators were often slow, bloated with ads, or required uploading personal photos to random servers. We wanted a tool that runs entirely in your browser—so your photos stay strictly on your device.
                            </p>
                        </div>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">Our Core Values</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>100% Free & Accessible:</strong> No hidden fees, no subscriptions. Just pure crafting joy.</li>
                            <li><strong>Absolute Privacy:</strong> All image processing happens locally in your browser. We never see, store, or upload your photos.</li>
                            <li><strong>Creative Freedom:</strong> Whether you prefer Perler, Hama, Artkal, or Nabbi beads, our tool helps you map your colors perfectly.</li>
                        </ul>

                        <div className="mt-12 p-8 border-4 border-brutal-black bg-brand-cyan text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="text-3xl font-black uppercase mb-4">Ready to start creating?</h3>
                            <Link href="/" className="inline-block px-8 py-4 bg-brand-magenta text-white border-4 border-brutal-black font-black uppercase tracking-wider hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
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

import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'About Bead Pattern Maker | The Ultimate Free Perler Bead Generator',
    description: 'Learn more about Bead Pattern Maker, the best free tool for converting your images into Perler, Hama, and Artkal bead patterns with a focus on privacy and ease of use.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-brand-yellow">
            {/* Header */}
            <header className="border-b-4 border-brutal-black bg-brand-cyan p-4 flex items-center justify-between shadow-brutal mx-4 mt-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 border-4 border-brutal-black bg-black rounded shrink-0 block hover:scale-105 transition-transform" />
                    <Link href="/">
                        <h1 className="text-4xl font-vt323 uppercase tracking-wide leading-none pt-1 hover:underline underline-offset-4 decoration-4">
                            Bead Pattern Maker
                        </h1>
                    </Link>
                </div>
                <nav className="font-bold text-lg hidden md:flex gap-6 uppercase">
                    <Link href="/" className="hover:underline underline-offset-4 decoration-4">Home</Link>
                    <Link href="/about" className="underline underline-offset-4 decoration-4">About</Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 pb-12 flex flex-col items-center">
                <div className="w-full max-w-4xl border-4 border-brutal-black bg-white p-8 md:p-12 shadow-brutal relative">
                    {/* Decorative element */}
                    <div className="absolute -top-4 -left-4 w-8 h-8 bg-brand-pink border-4 border-brutal-black rounded-full" />
                    <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-brand-cyan border-4 border-brutal-black rounded-sm" />

                    <h2 className="text-5xl font-black uppercase mb-8 tracking-tight">About Us</h2>

                    <div className="space-y-6 text-lg font-medium text-gray-800">
                        <p>
                            Welcome to <strong>Bead Pattern Maker</strong>, the ultimate playground for pixel art enthusiasts, crafters, and makers! Our mission is simple: to provide the easiest, fastest, and most privacy-focused tool for converting any image into a ready-to-use <strong>Perler bead pattern</strong>.
                        </p>

                        <div className="bg-brand-pink/20 p-6 border-l-4 border-brand-pink">
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
                            <Link href="/" className="inline-block px-8 py-4 bg-brand-pink text-white border-4 border-brutal-black font-black uppercase tracking-wider hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                                Generate a Pattern Now
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t-4 border-brutal-black bg-white p-8 mt-auto">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="font-vt323 text-3xl uppercase tracking-wider mb-2">Bead Pattern Maker</h2>
                        <p className="font-medium text-gray-600 max-w-md">The ultimate free tool for turning photos into printable Perler, Hama, and Artkal bead patterns.</p>
                    </div>
                    <div className="flex gap-6 font-bold uppercase text-sm">
                        <Link href="/privacy-policy" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Terms of Service</Link>
                        <Link href="mailto:contact@fusebeadpatterns.art" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

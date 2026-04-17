import React from 'react';
import Link from 'next/link';
import Editor from '../components/editor/Editor';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b-4 border-brutal-black bg-brand-cyan p-4 flex items-center justify-between shadow-brutal mx-4 mt-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border-4 border-brutal-black bg-black rounded shrink-0" />
                    <h1 className="text-4xl font-vt323 uppercase tracking-wide leading-none pt-1">
                        Bead Pattern Maker
                    </h1>
                </div>
                <nav className="font-bold text-lg hidden md:flex gap-6 uppercase">
                    <Link href="#" className="hover:underline underline-offset-4 decoration-4">Home</Link>
                    <Link href="#" className="hover:underline underline-offset-4 decoration-4">About</Link>
                    <Link href="https://github.com/maxcleme/beadifier" target="_blank" className="hover:underline underline-offset-4 decoration-4">GitHub</Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 pb-12 flex flex-col items-center">
                <div className="text-center max-w-2xl mb-12 mt-4 space-y-4">
                    <h2 className="text-5xl font-vt323 uppercase leading-tight bg-brand-yellow inline-block px-4 py-2 border-4 border-brutal-black shadow-brutal transform -rotate-1">
                        Turn any image into Pixel Art
                    </h2>
                    <p className="text-xl font-medium mt-6">
                        Upload your photo, select a palette (Perler, Hama, Artkal), and instantly generate a printable bead pattern with color summaries and PDF export.
                    </p>
                </div>

                {/* Editor Component */}
                <div className="w-full max-w-6xl">
                    <Editor />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t-4 border-brutal-black bg-white p-6 text-center shadow-[0_-4px_0_0_rgba(26,26,26,1)]">
                <p className="font-bold text-lg uppercase font-vt323">
                    Made with ❤️ for Bead Artisans. SEO-friendly Next.js generation.
                </p>
            </footer>
        </div>
    );
}

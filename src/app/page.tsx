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
                <div className="text-center max-w-3xl mb-12 mt-4 space-y-4">
                    <h1 className="text-5xl font-vt323 uppercase leading-tight bg-brand-yellow inline-block px-4 py-2 border-4 border-brutal-black shadow-brutal transform -rotate-1">
                        Free Perler Bead Pattern Generator
                    </h1>
                    <p className="text-xl font-medium mt-6">
                        The easiest online tool to convert your photos into printable <strong>perler bead patterns</strong>. Whether you are using Perler, Hama, or Artkal fuse beads, instantly generate color-matched templates for your next <strong>perler bead pegboard</strong> project.
                    </p>
                </div>

                {/* Editor Component */}
                <div className="w-full max-w-6xl mb-24">
                    <Editor />
                </div>

                {/* How It Works Section */}
                <div className="w-full max-w-6xl mb-24">
                    <h2 className="text-4xl font-vt323 uppercase tracking-wide mb-8 bg-brand-cyan inline-block px-4 py-2 border-4 border-brutal-black shadow-brutal transform rotate-1">
                        How Our Pattern Maker Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border-4 border-brutal-black p-6 shadow-brutal flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-brand-yellow border-4 border-brutal-black flex items-center justify-center text-3xl font-bold font-vt323 mb-4 rounded-full">1</div>
                            <h3 className="text-2xl font-bold mb-2">Upload Image</h3>
                            <p className="font-medium">Upload any photo, sprite, or artwork you want to turn into <strong>perler bead art</strong>. High contrast images work best for clear patterns!</p>
                        </div>
                        <div className="bg-white border-4 border-brutal-black p-6 shadow-brutal flex flex-col items-center text-center transform md:-translate-y-2">
                            <div className="w-16 h-16 bg-brand-purple border-4 border-brutal-black flex items-center justify-center text-3xl font-bold font-vt323 mb-4 rounded-full text-white">2</div>
                            <h3 className="text-2xl font-bold mb-2">Customize Settings</h3>
                            <p className="font-medium">Select your <strong>fuse beads</strong> brand (Perler Midi, <strong>Mini Perler Beads</strong>, Hama, etc.), adjust the pegboard size, and tweak color matching options.</p>
                        </div>
                        <div className="bg-white border-4 border-brutal-black p-6 shadow-brutal flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-brand-cyan border-4 border-brutal-black flex items-center justify-center text-3xl font-bold font-vt323 mb-4 rounded-full">3</div>
                            <h3 className="text-2xl font-bold mb-2">Export & Create</h3>
                            <p className="font-medium">Download your <strong>perler bead templates</strong> as a PDF, SVG, or Excel file, complete with a color summary to start ironing!</p>
                        </div>
                    </div>
                </div>

                {/* Popular Ideas Section (SEO targeted) */}
                <div className="w-full max-w-6xl mb-24">
                    <h2 className="text-4xl font-vt323 uppercase tracking-wide mb-8 bg-brand-yellow inline-block px-4 py-2 border-4 border-brutal-black shadow-brutal transform -rotate-2">
                        Popular Perler Bead Ideas & Designs
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-[4px_4px_0_0_#9333ea]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Minecraft Perler Bead Patterns</h3>
                            <p className="font-medium">Convert blocky sprites into perfect <strong>minecraft perler beads</strong> designs. Generate templates for creepers, swords, pickaxes, and your favorite blocks easily.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-[4px_4px_0_0_#06b6d4]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Pokemon Perler Beads</h3>
                            <p className="font-medium">Catch 'em all! Our advanced color matching ensures your <strong>pokemon perler bead patterns</strong> use the exact shades of red, yellow, and blue needed for perfect sprites.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-[4px_4px_0_0_#eab308]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">3D Perler Bead Patterns</h3>
                            <p className="font-medium">Create multi-layered templates. Generate cross-sections of images to stack and snap together amazing <strong>3D perler beads</strong> creations and figures.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-[4px_4px_0_0_#1a1a1a]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Mario & Retro Gaming</h3>
                            <p className="font-medium">8-bit and 16-bit graphics were made for pixel art! Instantly create <strong>mario perler beads</strong> patterns, Zelda items, and Sonic the Hedgehog templates.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-[4px_4px_0_0_#f472b6]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Hello Kitty & Disney</h3>
                            <p className="font-medium">Find cute inspiration for <strong>hello kitty perler beads</strong>, Disney characters, and Stitch designs. Perfect for making small crafts with kids.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-[4px_4px_0_0_#22c55e]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Jewelry & Accessories</h3>
                            <p className="font-medium">Scale down your images to make tiny patterns perfect for <strong>perler bead keychain</strong> designs or lightweight <strong>perler beads earrings</strong>.</p>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="w-full max-w-6xl mb-24">
                    <h2 className="text-4xl font-vt323 uppercase tracking-wide mb-8 bg-brand-purple text-white inline-block px-4 py-2 border-4 border-brutal-black shadow-brutal transform rotate-1">
                        Generator Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-yellow border-2 border-brutal-black rounded-full"></span>
                                Multi-Brand Palettes
                            </h3>
                            <p className="font-medium">Built-in support for popular <strong>perler beads bulk</strong> palettes including Perler (Midi, Mini, Caps), Hama (Midi, Mini, Maxi), and Artkal. Exact color hex codes are mapped.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-cyan border-2 border-brutal-black rounded-full"></span>
                                Advanced Color Matching
                            </h3>
                            <p className="font-medium">Utilizes the CIEDE2000 color difference algorithm to ensure the closest possible match between your image colors and the physical beads available in your <strong>perler bead kit</strong>.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-purple border-2 border-brutal-black rounded-full"></span>
                                Multiple Export Formats
                            </h3>
                            <p className="font-medium">Export <strong>patterns for perler beads</strong> in various formats: PDF for easy printing, SVG for scalable graphics, PNG for sharing, and XLSX for spreadsheet tracking.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-black border-2 border-brutal-black rounded-full"></span>
                                Dithering Support
                            </h3>
                            <p className="font-medium">Apply Floyd-Steinberg dithering to create the illusion of color depth, especially useful for complex images with gradients or shading in your <strong>perler bead designs</strong>.</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="w-full max-w-4xl mb-12">
                    <h2 className="text-4xl font-vt323 uppercase tracking-wide mb-8 bg-brand-cyan inline-block px-4 py-2 border-4 border-brutal-black shadow-brutal transform -rotate-1">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <details className="border-4 border-brutal-black bg-white group cursor-pointer">
                            <summary className="font-bold text-xl p-4 flex justify-between items-center bg-gray-50 group-hover:bg-brand-cyan transition-colors">
                                What are perler beads?
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 border-t-4 border-brutal-black font-medium">
                                <strong>Perler beads</strong> (also known generally as <strong>fuse beads</strong> or ironing beads) are small plastic cylindrical beads that you arrange on a plastic <strong>perler bead pegboard</strong> to create pixel art designs. Once the design is complete, you cover it with ironing paper and apply heat with a household iron to melt and fuse the beads together permanently.
                            </div>
                        </details>
                        <details className="border-4 border-brutal-black bg-white group cursor-pointer">
                            <summary className="font-bold text-xl p-4 flex justify-between items-center bg-gray-50 group-hover:bg-brand-purple group-hover:text-white transition-colors">
                                Is this perler bead pattern maker free to use?
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 border-t-4 border-brutal-black font-medium text-black bg-white">
                                Yes! Our <strong>perler bead pattern maker</strong> is completely free to use. There are no hidden fees, watermarks on your exported <strong>perler bead patterns</strong>, or premium subscriptions required. It runs entirely locally in your browser ensuring absolute privacy.
                            </div>
                        </details>
                        <details className="border-4 border-brutal-black bg-white group cursor-pointer">
                            <summary className="font-bold text-xl p-4 flex justify-between items-center bg-gray-50 group-hover:bg-brand-yellow transition-colors">
                                What do I need in a beginner perler bead kit?
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 border-t-4 border-brutal-black font-medium">
                                To get started making <strong>perler bead art</strong>, you will need a basic <strong>perler bead kit</strong> which typically includes: an assortment of colored beads, at least one square interlocking <strong>perler bead pegboard</strong>, ironing paper (parchment paper works too), and tweezers for precise placement. As your hobby grows, you may want to invest in dedicated <strong>perler bead storage</strong> organizers to separate your <strong>perler beads bulk</strong> bags by color!
                            </div>
                        </details>
                        <details className="border-4 border-brutal-black bg-white group cursor-pointer">
                            <summary className="font-bold text-xl p-4 flex justify-between items-center bg-gray-50 group-hover:bg-brand-cyan transition-colors">
                                Can I use this for mini perler beads?
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 border-t-4 border-brutal-black font-medium">
                                Absolutely. The generator includes palettes specifically for <strong>mini perler beads</strong> and Hama Mini. Because mini beads are much smaller (usually 2.6mm compared to the standard 5mm midi beads), they are perfect for creating highly detailed <strong>perler bead keychain</strong> or <strong>perler beads earrings</strong> without making the final piece too large.
                            </div>
                        </details>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t-4 border-brutal-black bg-white p-8 shadow-[0_-4px_0_0_rgba(26,26,26,1)]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-vt323 uppercase font-bold mb-2">Bead Pattern Maker</h2>
                        <p className="font-medium text-gray-600 max-w-md">The ultimate free tool for turning photos into printable Perler, Hama, and Artkal bead patterns. Discover endless <strong>bead perler ideas</strong>.</p>
                    </div>
                    <div className="flex gap-6 font-bold uppercase text-sm">
                        <Link href="#" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Privacy Policy</Link>
                        <Link href="#" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Terms of Service</Link>
                        <Link href="mailto:hello@fusebeadpatterns.art" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Contact</Link>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300 text-center font-vt323 text-lg text-gray-500">
                    &copy; {new Date().getFullYear()} Bead Pattern Maker. All rights reserved. Not affiliated with Perler®, Hama®, or Artkal®.
                </div>
            </footer>
        </div>
    );
}

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
                <div className="w-full max-w-6xl mb-24">
                    <Editor />
                </div>

                {/* How It Works Section */}
                <div className="w-full max-w-6xl mb-24">
                    <h2 className="text-4xl font-vt323 uppercase tracking-wide mb-8 bg-brand-cyan inline-block px-4 py-2 border-4 border-brutal-black shadow-brutal transform rotate-1">
                        How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border-4 border-brutal-black p-6 shadow-brutal flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-brand-yellow border-4 border-brutal-black flex items-center justify-center text-3xl font-bold font-vt323 mb-4 rounded-full">1</div>
                            <h3 className="text-2xl font-bold mb-2">Upload Image</h3>
                            <p className="font-medium">Upload any photo or illustration you want to convert into a bead pattern. High contrast images work best!</p>
                        </div>
                        <div className="bg-white border-4 border-brutal-black p-6 shadow-brutal flex flex-col items-center text-center transform md:-translate-y-2">
                            <div className="w-16 h-16 bg-brand-purple border-4 border-brutal-black flex items-center justify-center text-3xl font-bold font-vt323 mb-4 rounded-full text-white">2</div>
                            <h3 className="text-2xl font-bold mb-2">Customize Settings</h3>
                            <p className="font-medium">Select your preferred bead brand (Perler, Hama, Artkal), adjust the board size, and tweak color matching options.</p>
                        </div>
                        <div className="bg-white border-4 border-brutal-black p-6 shadow-brutal flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-brand-cyan border-4 border-brutal-black flex items-center justify-center text-3xl font-bold font-vt323 mb-4 rounded-full">3</div>
                            <h3 className="text-2xl font-bold mb-2">Export & Create</h3>
                            <p className="font-medium">Download your pattern as a PDF, SVG, or Excel file, complete with a color summary to start ironing!</p>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="w-full max-w-6xl mb-24">
                    <h2 className="text-4xl font-vt323 uppercase tracking-wide mb-8 bg-brand-purple text-white inline-block px-4 py-2 border-4 border-brutal-black shadow-brutal transform -rotate-1">
                        Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-yellow border-2 border-brutal-black rounded-full"></span>
                                Multi-Brand Palettes
                            </h3>
                            <p className="font-medium">Built-in support for popular bead brands including Perler (Midi, Mini, Caps), Hama (Midi, Mini, Maxi), and Artkal. Exact color hex codes are mapped for accurate results.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-cyan border-2 border-brutal-black rounded-full"></span>
                                Advanced Color Matching
                            </h3>
                            <p className="font-medium">Utilizes the CIEDE2000 color difference algorithm to ensure the closest possible match between your image colors and the physical beads available.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-purple border-2 border-brutal-black rounded-full"></span>
                                Multiple Export Formats
                            </h3>
                            <p className="font-medium">Export your patterns in various formats suited for your workflow: PDF for easy printing, SVG for scalable graphics, PNG for sharing, and XLSX for spreadsheet tracking.</p>
                        </div>
                        <div className="border-4 border-brutal-black bg-white p-6 shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-black border-2 border-brutal-black rounded-full"></span>
                                Dithering Support
                            </h3>
                            <p className="font-medium">Apply Floyd-Steinberg dithering to create the illusion of color depth, especially useful for complex images with gradients or shading.</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="w-full max-w-4xl mb-12">
                    <h2 className="text-4xl font-vt323 uppercase tracking-wide mb-8 bg-brand-yellow inline-block px-4 py-2 border-4 border-brutal-black shadow-brutal transform rotate-2">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <details className="border-4 border-brutal-black bg-white group cursor-pointer">
                            <summary className="font-bold text-xl p-4 flex justify-between items-center bg-gray-50 group-hover:bg-brand-cyan transition-colors">
                                What are fuse beads?
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 border-t-4 border-brutal-black font-medium">
                                Fuse beads (also known as ironing beads) are small plastic beads that you arrange on a pegboard to create pixel art designs. Once the design is complete, you cover it with ironing paper and apply heat with an iron to fuse the beads together permanently. Popular brands include Perler, Hama, and Artkal.
                            </div>
                        </details>
                        <details className="border-4 border-brutal-black bg-white group cursor-pointer">
                            <summary className="font-bold text-xl p-4 flex justify-between items-center bg-gray-50 group-hover:bg-brand-purple group-hover:text-white transition-colors">
                                Is this bead pattern maker free to use?
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 border-t-4 border-brutal-black font-medium text-black bg-white">
                                Yes! Our Bead Pattern Maker is completely free to use. There are no hidden fees, watermarks on your exports, or premium subscriptions required. It runs entirely in your browser.
                            </div>
                        </details>
                        <details className="border-4 border-brutal-black bg-white group cursor-pointer">
                            <summary className="font-bold text-xl p-4 flex justify-between items-center bg-gray-50 group-hover:bg-brand-yellow transition-colors">
                                How do I print the pattern?
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 border-t-4 border-brutal-black font-medium">
                                Once you are happy with your generated pattern, simply click the "PDF" export button. This will generate a printable document that includes a visual grid of your pattern, an optional symbol map, and a complete summary of the exact bead colors and quantities you need to complete your project.
                            </div>
                        </details>
                        <details className="border-4 border-brutal-black bg-white group cursor-pointer">
                            <summary className="font-bold text-xl p-4 flex justify-between items-center bg-gray-50 group-hover:bg-brand-cyan transition-colors">
                                Why do my colors look different than the original image?
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 border-t-4 border-brutal-black font-medium">
                                The generator matches the colors in your image to the physical colors available in the selected bead palette (e.g., Perler Midi). Since bead manufacturers have a limited color range compared to digital screens, some color shifting is normal. You can experiment with different "Matching" algorithms (like DeltaE CIE2000) or toggle "Dithering" to improve the result.
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
                        <p className="font-medium text-gray-600 max-w-md">The ultimate free tool for turning photos into printable Perler, Hama, and Artkal bead patterns. Built for bead artisans.</p>
                    </div>
                    <div className="flex gap-6 font-bold uppercase text-sm">
                        <Link href="#" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Privacy Policy</Link>
                        <Link href="#" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Terms of Service</Link>
                        <Link href="mailto:hello@beadpattern.net" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Contact</Link>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300 text-center font-vt323 text-lg text-gray-500">
                    &copy; {new Date().getFullYear()} Bead Pattern Maker. All rights reserved. Not affiliated with Perler®, Hama®, or Artkal®.
                </div>
            </footer>
        </div>
    );
}

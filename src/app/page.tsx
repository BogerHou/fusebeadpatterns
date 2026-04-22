import React from 'react';
import Link from 'next/link';
import Editor from '../components/editor/Editor';
import { guidePages } from './guides/guide-data';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';

const siteUrl = 'https://fusebeadpatterns.art';

const faqs = [
    {
        question: 'What are perler beads?',
        answer: 'Perler beads, also known as fuse beads or ironing beads, are small plastic beads arranged on a pegboard to create pixel art. After the design is complete, you cover it with ironing paper and apply heat to fuse the beads together.',
    },
    {
        question: 'Is this perler bead pattern maker free to use?',
        answer: 'Yes. Bead Pattern Maker is free to use, and the core photo-to-pattern workflow runs locally in your browser without uploading your images to our servers.',
    },
    {
        question: 'What do I need in a beginner perler bead kit?',
        answer: 'A beginner kit usually includes assorted fuse beads, a square pegboard, ironing paper, and tweezers. Storage organizers become useful once you collect more colors.',
    },
    {
        question: 'Can I use this for mini perler beads?',
        answer: 'Yes. The generator includes mini bead palettes and pegboards. Mini beads are useful for highly detailed small projects such as keychains and earrings.',
    },
    {
        question: 'Can I manually edit the generated bead pattern?',
        answer: 'Yes. Generate a quick pattern on the homepage, then open the editor to paint beads, fill regions, erase beads, pick colors, undo changes, and export the final pattern.',
    },
];

const structuredData = [
    {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Bead Pattern Maker',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Any modern web browser',
        url: siteUrl,
        description:
            'A free browser-based perler bead pattern generator for converting photos into printable Perler, Hama, Artkal, and other fuse bead patterns.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: [
            'Photo to perler bead pattern conversion',
            'Perler, Hama, Artkal, Nabbi, Mard, Diamond Dotz, and Yant palette support',
            'Pegboard size and board count controls',
            'Manual bead editor with paint, fill, erase, pick, pan, undo, and redo',
            'Printable PDF, SVG, PNG, JPG, and XLSX exports',
        ],
    },
    {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    },
    {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to make a perler bead pattern from a photo',
        description:
            'Convert a photo into a printable fuse bead pattern, choose a color palette and pegboard, then export or refine the design.',
        step: [
            {
                '@type': 'HowToStep',
                name: 'Upload an image',
                text: 'Choose a photo, sprite, or artwork file from your device.',
            },
            {
                '@type': 'HowToStep',
                name: 'Choose beads and pegboard',
                text: 'Select a color brand, pegboard size, and board count for the final pattern.',
            },
            {
                '@type': 'HowToStep',
                name: 'Export or edit',
                text: 'Download the pattern or open the editor to manually clean up individual beads.',
            },
        ],
    },
];

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData),
                }}
            />
            <SiteHeader active="generator" />

            {/* Main Content */}
            <main className="flex-1 px-3 pb-10 flex flex-col items-center sm:px-4 sm:pb-12">
                <div className="w-full text-center max-w-3xl mb-3 mt-0 space-y-1 sm:mb-12 sm:mt-4 sm:space-y-4">
                    <h1 className="block max-w-full text-2xl font-vt323 uppercase leading-tight bg-brand-yellow px-2 py-1.5 border-2 border-brutal-black shadow-[2px_2px_0_0_#1a1a1a] transform -rotate-1 sm:inline-block sm:border-4 sm:px-4 sm:py-2 sm:text-5xl sm:shadow-brutal">
                        <span className="block sm:inline">
                            Free Perler Bead Pattern
                        </span>{' '}
                        <span className="block sm:inline">Generator</span>
                    </h1>
                    <p className="sr-only text-sm font-medium leading-6 mt-3 sm:not-sr-only sm:block sm:text-xl sm:leading-normal sm:mt-6">
                        The easiest online tool to convert your photos into printable <strong>perler bead patterns</strong>. Whether you are using Perler, Hama, or Artkal fuse beads, instantly generate color-matched templates for your next <strong>perler bead pegboard</strong> project.
                    </p>
                </div>

                {/* Editor Component */}
                <div className="w-full max-w-6xl mb-12 sm:mb-24">
                    <Editor />
                </div>

                <div className="w-full max-w-6xl mb-12 sm:mb-24">
                    <div className="grid gap-4 border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-5 sm:shadow-brutal md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <div>
                            <div className="mb-3 inline-grid max-w-full grid-cols-1 overflow-hidden border-2 border-brutal-black font-vt323 text-lg uppercase leading-none shadow-[2px_2px_0_0_#1a1a1a] sm:inline-flex sm:border-4 sm:text-xl sm:shadow-[3px_3px_0_0_#1a1a1a]">
                                <span className="bg-brand-yellow px-4 py-2">
                                    Quick Convert
                                </span>
                                <Link
                                    href="/editor"
                                    prefetch={false}
                                    className="border-t-2 border-brutal-black bg-white px-4 py-2 hover:bg-brand-cyan sm:border-l-4 sm:border-t-0"
                                >
                                    Advanced Editor
                                </Link>
                            </div>
                            <h2 className="font-vt323 text-3xl uppercase tracking-wide sm:text-4xl">
                                Need more control after converting?
                            </h2>
                            <p className="mt-2 max-w-3xl text-base font-medium sm:text-lg">
                                Use this page for fast photo-to-pattern conversion.
                                Open the advanced editor when you want to paint
                                individual beads, fill areas, erase mistakes, pick
                                exact colors, or clean up a generated design before
                                exporting.
                            </p>
                        </div>
                        <Link
                            href="/editor"
                            prefetch={false}
                            className="inline-flex w-full items-center justify-center border-2 border-brutal-black bg-brand-purple px-5 py-2.5 font-vt323 text-xl uppercase leading-none text-white shadow-[2px_2px_0_0_#1a1a1a] transition-transform hover:-translate-y-1 sm:w-auto sm:border-4 sm:px-6 sm:py-3 sm:text-2xl sm:shadow-brutal"
                        >
                            Open Editor
                        </Link>
                    </div>
                </div>

                {/* How It Works Section */}
                <div className="w-full max-w-6xl mb-12 sm:mb-24">
                    <h2 className="text-3xl font-vt323 uppercase tracking-wide mb-5 bg-brand-cyan inline-block px-3 py-2 border-2 border-brutal-black shadow-[2px_2px_0_0_#1a1a1a] transform rotate-1 sm:mb-8 sm:border-4 sm:px-4 sm:text-4xl sm:shadow-brutal">
                        How Our Pattern Maker Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border-2 border-brutal-black p-4 shadow-[2px_2px_0_0_#1a1a1a] flex flex-col items-center text-center sm:border-4 sm:p-6 sm:shadow-brutal">
                            <div className="w-12 h-12 bg-brand-yellow border-2 border-brutal-black flex items-center justify-center text-2xl font-bold font-vt323 mb-3 rounded-full sm:mb-4 sm:h-16 sm:w-16 sm:border-4 sm:text-3xl">1</div>
                            <h3 className="text-2xl font-bold mb-2">Upload Image</h3>
                            <p className="font-medium">Upload any photo, sprite, or artwork you want to turn into <strong>perler bead art</strong>. High contrast images work best for clear patterns!</p>
                        </div>
                        <div className="bg-white border-2 border-brutal-black p-4 shadow-[2px_2px_0_0_#1a1a1a] flex flex-col items-center text-center transform sm:border-4 sm:p-6 sm:shadow-brutal md:-translate-y-2">
                            <div className="w-12 h-12 bg-brand-purple border-2 border-brutal-black flex items-center justify-center text-2xl font-bold font-vt323 mb-3 rounded-full text-white sm:mb-4 sm:h-16 sm:w-16 sm:border-4 sm:text-3xl">2</div>
                            <h3 className="text-2xl font-bold mb-2">Customize Settings</h3>
                            <p className="font-medium">Select your <strong>fuse beads</strong> brand (Perler Midi, <strong>Mini Perler Beads</strong>, Hama, etc.), choose a pegboard, and set how many boards wide or tall your project should be.</p>
                        </div>
                        <div className="bg-white border-2 border-brutal-black p-4 shadow-[2px_2px_0_0_#1a1a1a] flex flex-col items-center text-center sm:border-4 sm:p-6 sm:shadow-brutal">
                            <div className="w-12 h-12 bg-brand-cyan border-2 border-brutal-black flex items-center justify-center text-2xl font-bold font-vt323 mb-3 rounded-full sm:mb-4 sm:h-16 sm:w-16 sm:border-4 sm:text-3xl">3</div>
                            <h3 className="text-2xl font-bold mb-2">Export Or Edit</h3>
                            <p className="font-medium">Download your <strong>perler bead templates</strong> right away, or open the editor to manually refine beads before exporting your final pattern.</p>
                        </div>
                    </div>
                </div>

                {/* Project Ideas Section */}
                <div className="w-full max-w-6xl mb-12 sm:mb-24">
                    <h2 className="text-3xl font-vt323 uppercase tracking-wide mb-5 bg-brand-yellow inline-block px-3 py-2 border-2 border-brutal-black shadow-[2px_2px_0_0_#1a1a1a] transform -rotate-2 sm:mb-8 sm:border-4 sm:px-4 sm:text-4xl sm:shadow-brutal">
                        Perler Bead Project Ideas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#9333ea] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#9333ea]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Game Sprite Patterns</h3>
                            <p className="font-medium">Blocky game art works especially well as fuse bead templates. Try simple sprites, items, icons, or your own Minecraft-style artwork when you want clean edges and clear colors.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#06b6d4] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#06b6d4]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Character Portraits</h3>
                            <p className="font-medium">Use the generator to test whether a Pokemon, Sanrio, Disney, anime, or pet image still reads clearly after it is reduced to a bead grid.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#eab308] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#eab308]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Printable Templates</h3>
                            <p className="font-medium">Export a printable chart when you need to count beads, share a pattern, or follow a design away from your screen.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#1a1a1a]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Retro Pixel Art</h3>
                            <p className="font-medium">8-bit and 16-bit artwork translates naturally into bead layouts. Use smaller boards for icons and larger boards for scene-style patterns.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#f472b6] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#f472b6]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Small Crafts</h3>
                            <p className="font-medium">Scale a design down for keychains, earrings, ornaments, magnets, or kid-friendly mini projects.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#22c55e] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#22c55e]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Manual Cleanup</h3>
                            <p className="font-medium">Open the editor when the automatic conversion is close but a face, outline, or background needs a few individual beads adjusted.</p>
                        </div>
                    </div>
                </div>

                {/* Guides Section */}
                <div className="w-full max-w-6xl mb-12 sm:mb-24">
                    <div className="grid gap-5 border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-5 sm:shadow-brutal lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                        <div>
                            <h2 className="font-vt323 text-3xl uppercase leading-none sm:text-4xl">
                                Learn Before You Make
                            </h2>
                            <p className="mt-3 text-base font-medium text-gray-700 sm:text-lg">
                                The generator covers the quick workflow. These
                                guides explain board sizing, mini beads, kits,
                                and photo cleanup when a project needs more
                                planning.
                            </p>
                            <Link
                                href="/guides"
                                className="mt-5 inline-flex border-2 border-brutal-black bg-brand-cyan px-4 py-2 font-bold uppercase shadow-[2px_2px_0_0_#1a1a1a] hover:bg-white sm:border-4 sm:shadow-[3px_3px_0_0_#1a1a1a]"
                            >
                                View All Guides
                            </Link>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {guidePages.map((guide) => (
                                <Link
                                    key={guide.slug}
                                    href={`/guides/${guide.slug}`}
                                    className="border-2 border-brutal-black bg-[#f7f7f4] p-3 transition-colors hover:bg-brand-yellow sm:border-4 sm:p-4"
                                >
                                    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                                        {guide.eyebrow}
                                    </div>
                                    <h3 className="font-vt323 text-2xl uppercase leading-none sm:text-3xl">
                                        {guide.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="w-full max-w-6xl mb-12 sm:mb-24">
                    <h2 className="text-3xl font-vt323 uppercase tracking-wide mb-5 bg-brand-purple text-white inline-block px-3 py-2 border-2 border-brutal-black shadow-[2px_2px_0_0_#1a1a1a] transform rotate-1 sm:mb-8 sm:border-4 sm:px-4 sm:text-4xl sm:shadow-brutal">
                        Generator Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-yellow border-2 border-brutal-black rounded-full"></span>
                                Multi-Brand Palettes
                            </h3>
                            <p className="font-medium">Built-in support for popular <strong>perler beads bulk</strong> palettes including Perler (Midi, Mini, Caps), Hama (Midi, Mini, Maxi), and Artkal. Exact color hex codes are mapped.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-cyan border-2 border-brutal-black rounded-full"></span>
                                Advanced Color Matching
                            </h3>
                            <p className="font-medium">Utilizes the CIEDE2000 color difference algorithm to ensure the closest possible match between your image colors and the physical beads available in your <strong>perler bead kit</strong>.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-purple border-2 border-brutal-black rounded-full"></span>
                                Multiple Export Formats
                            </h3>
                            <p className="font-medium">Export <strong>patterns for perler beads</strong> in various formats: PDF for easy printing, SVG for scalable graphics, PNG for sharing, and XLSX for spreadsheet tracking.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-black border-2 border-brutal-black rounded-full"></span>
                                Dithering Support
                            </h3>
                            <p className="font-medium">Apply Floyd-Steinberg dithering to create the illusion of color depth, especially useful for complex images with gradients or shading in your <strong>perler bead designs</strong>.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal md:col-span-2">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-cyan border-2 border-brutal-black rounded-full"></span>
                                Advanced Pattern Editor
                            </h3>
                            <p className="font-medium">After generating a pattern, open the editor to adjust individual beads with paint, fill, erase, pick-color, undo, redo, and zoom tools. This keeps the homepage fast while still supporting detailed manual cleanup.</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="w-full max-w-4xl mb-12">
                    <h2 className="text-3xl font-vt323 uppercase tracking-wide mb-5 bg-brand-cyan inline-block px-3 py-2 border-2 border-brutal-black shadow-[2px_2px_0_0_#1a1a1a] transform -rotate-1 sm:mb-8 sm:border-4 sm:px-4 sm:text-4xl sm:shadow-brutal">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <details
                                key={faq.question}
                                className="group cursor-pointer border-2 border-brutal-black bg-white sm:border-4"
                            >
                                <summary
                                    className={`flex items-center justify-between gap-3 p-3 text-base font-bold transition-colors sm:p-4 sm:text-xl ${
                                        index % 3 === 1
                                            ? 'bg-gray-50 group-hover:bg-brand-purple group-hover:text-white'
                                            : index % 3 === 2
                                              ? 'bg-gray-50 group-hover:bg-brand-yellow'
                                              : 'bg-gray-50 group-hover:bg-brand-cyan'
                                    }`}
                                >
                                    {faq.question}
                                    <span className="transform transition-transform group-open:rotate-180">
                                        ▼
                                    </span>
                                </summary>
                                <div className="border-t-2 border-brutal-black bg-white p-3 font-medium text-black sm:border-t-4 sm:p-4">
                                    {faq.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </main>

            <SiteFooter
                active="generator"
                description="A free tool for turning photos into printable Perler, Hama, and Artkal bead patterns, with an editor for manual cleanup."
            />
        </div>
    );
}

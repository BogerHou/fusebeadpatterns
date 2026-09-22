import React from 'react';
import Link from 'next/link';
import Editor from '../components/editor/Editor';
import { guidePages } from './guides/guide-data';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import FeaturedPatterns from '@/components/patterns/FeaturedPatterns';

const siteUrl = 'https://fusebeadpatterns.art';

const faqs = [
    {
        question: 'What are perler beads?',
        answer: 'Perler beads, also known as fuse beads or ironing beads, are small plastic beads arranged on a pegboard to create pixel art. After the design is complete, you cover it with ironing paper and apply heat to fuse the beads together.',
    },
    {
        question: 'Is this perler bead pattern maker free to use?',
        answer: 'Yes. Fuse Bead Patterns is free to use. You can upload a photo, preview the bead pattern, adjust the size, and export the result from your browser.',
    },
    {
        question: 'What do I need in a beginner perler bead kit?',
        answer: 'A beginner kit usually includes assorted fuse beads, a square pegboard, ironing paper, and tweezers. Storage organizers become useful once you collect more colors.',
    },
    {
        question: 'Can I use this for mini perler beads?',
        answer: 'Yes. Choose a mini bead setup when you want a smaller finished piece with more detail, such as keychains, earrings, ornaments, or compact sprite art.',
    },
    {
        question: 'Can I manually edit the generated bead pattern?',
        answer: 'Yes. Generate a pattern on the homepage, then open the editor to paint, fill, erase, pick colors, undo changes, save the project, and export the final pattern.',
    },
];

const structuredData = [
    {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Free Perler Bead Pattern Generator',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Any modern web browser',
        url: siteUrl,
        description:
            'A free browser-based perler bead pattern generator for turning photos into printable fuse bead patterns with preview, size controls, cleanup tools, and exports.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: [
            'Photo to perler bead pattern conversion',
            'Color choices for common fuse bead palettes',
            'Pegboard size and board count controls',
            'Manual cleanup editor with paint, fill, erase, pick, pan, undo, redo, and zoom',
            'Printable PDF, SVG, PNG, JPG, grid PNG, and XLSX exports',
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
                text: 'Choose a photo, sprite, or artwork file from your device and preview it as bead art.',
            },
            {
                '@type': 'HowToStep',
                name: 'Adjust the pattern',
                text: 'Set the board size and layout so the pattern matches the project you want to build.',
            },
            {
                '@type': 'HowToStep',
                name: 'Export or edit',
                text: 'Download a printable pattern or open the editor to clean up individual beads.',
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
                        Upload a photo, preview the bead layout, adjust the
                        size, then export a printable <strong>perler bead
                        pattern</strong> or open the editor for cleanup.
                        Everything runs in your browser.
                    </p>
                </div>

                {/* Editor Component */}
                <div className="w-full max-w-6xl mb-12 sm:mb-24">
                    <Editor />
                </div>

                <FeaturedPatterns />

                {/* How It Works Section */}
                <div className="w-full max-w-6xl mb-12 sm:mb-24">
                    <h2 className="text-3xl font-vt323 uppercase tracking-wide mb-5 bg-brand-cyan inline-block px-3 py-2 border-2 border-brutal-black shadow-[2px_2px_0_0_#1a1a1a] transform rotate-1 sm:mb-8 sm:border-4 sm:px-4 sm:text-4xl sm:shadow-brutal">
                        How The Generator Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border-2 border-brutal-black p-4 shadow-[2px_2px_0_0_#1a1a1a] flex flex-col items-center text-center sm:border-4 sm:p-6 sm:shadow-brutal">
                            <div className="w-12 h-12 bg-brand-yellow border-2 border-brutal-black flex items-center justify-center text-2xl font-bold font-vt323 mb-3 rounded-full sm:mb-4 sm:h-16 sm:w-16 sm:border-4 sm:text-3xl">1</div>
                            <h3 className="text-2xl font-bold mb-2">Upload Your Image</h3>
                            <p className="font-medium">Start with a photo, sprite, or simple artwork. The preview shows how it will read as <strong>perler bead art</strong> before you export.</p>
                        </div>
                        <div className="bg-white border-2 border-brutal-black p-4 shadow-[2px_2px_0_0_#1a1a1a] flex flex-col items-center text-center transform sm:border-4 sm:p-6 sm:shadow-brutal md:-translate-y-2">
                            <div className="w-12 h-12 bg-brand-purple border-2 border-brutal-black flex items-center justify-center text-2xl font-bold font-vt323 mb-3 rounded-full text-white sm:mb-4 sm:h-16 sm:w-16 sm:border-4 sm:text-3xl">2</div>
                            <h3 className="text-2xl font-bold mb-2">Tune The Pattern</h3>
                            <p className="font-medium">Choose the board size and how many boards wide or tall your project should be, so the final <strong>fuse bead</strong> pattern fits your plan.</p>
                        </div>
                        <div className="bg-white border-2 border-brutal-black p-4 shadow-[2px_2px_0_0_#1a1a1a] flex flex-col items-center text-center sm:border-4 sm:p-6 sm:shadow-brutal">
                            <div className="w-12 h-12 bg-brand-cyan border-2 border-brutal-black flex items-center justify-center text-2xl font-bold font-vt323 mb-3 rounded-full sm:mb-4 sm:h-16 sm:w-16 sm:border-4 sm:text-3xl">3</div>
                            <h3 className="text-2xl font-bold mb-2">Save Or Refine</h3>
                            <p className="font-medium">Download your <strong>perler bead template</strong>, save the project, or continue in the editor when a few beads need cleanup.</p>
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
                            <p className="font-medium">Blocky game-style art works especially well as fuse bead templates. Try simple sprites, items, icons, or your own pixel artwork when you want clean edges and clear colors.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#06b6d4] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#06b6d4]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Character Portraits</h3>
                            <p className="font-medium">Use the generator to test whether a pet photo, cartoon-style portrait, anime-inspired sketch, or original character still reads clearly after it becomes a bead grid.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#eab308] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#eab308]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Printable Templates</h3>
                            <p className="font-medium">Export a printable chart when you need to count beads, share a pattern, or follow a design away from your screen.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#1a1a1a]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Retro Pixel Art</h3>
                            <p className="font-medium">8-bit and 16-bit style artwork translates naturally into bead layouts. Use smaller boards for icons and larger boards for scene-style patterns.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#f472b6] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#f472b6]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Small Crafts</h3>
                            <p className="font-medium">Scale a design down for keychains, earrings, ornaments, magnets, or kid-friendly mini bead projects.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#22c55e] sm:border-4 sm:p-6 sm:shadow-[4px_4px_0_0_#22c55e]">
                            <h3 className="text-2xl font-bold mb-3 font-vt323 uppercase">Manual Cleanup</h3>
                            <p className="font-medium">Open the editor when the preview is close but a face, outline, or background needs a few individual beads adjusted.</p>
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
                                The generator keeps the main workflow fast.
                                These guides help with board sizing, mini
                                beads, beginner kits, and photo cleanup when a
                                project needs more planning.
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
                        What You Can Do
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-yellow border-2 border-brutal-black rounded-full"></span>
                                Bead Color Choices
                            </h3>
                            <p className="font-medium">Pick a color set before generating so the pattern uses bead colors you can build with. The tool includes common <strong>perler bead</strong> and fuse bead palettes.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-cyan border-2 border-brutal-black rounded-full"></span>
                                Clearer Color Picks
                            </h3>
                            <p className="font-medium">The generator compares your image to available bead colors and picks close matches automatically, so you can focus on whether the <strong>perler bead pattern</strong> looks right.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-purple border-2 border-brutal-black rounded-full"></span>
                                Export What You Need
                            </h3>
                            <p className="font-medium">Download <strong>patterns for perler beads</strong> as a printable PDF, image, SVG, spreadsheet, or grid preview when the design is ready to build or share.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-black border-2 border-brutal-black rounded-full"></span>
                                Smoother Shading
                            </h3>
                            <p className="font-medium">Use the soft shading option when a photo needs smoother color transitions, or leave it off for cleaner sprite, icon, and simple <strong>perler bead designs</strong>.</p>
                        </div>
                        <div className="border-2 border-brutal-black bg-white p-4 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-6 sm:shadow-brutal md:col-span-2">
                            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 bg-brand-cyan border-2 border-brutal-black rounded-full"></span>
                                Clean Up By Hand
                            </h3>
                            <p className="font-medium">Open the editor to paint, fill, erase, pick colors, zoom, and undo changes when the automatic result is close but not finished.</p>
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
                description="Turn photos into printable perler bead patterns, then adjust the size, clean up beads, and export the result from your browser."
            />
        </div>
    );
}

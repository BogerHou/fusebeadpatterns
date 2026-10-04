import React from 'react';
import Link from 'next/link';
import Editor from '../components/editor/Editor';
import { guidePages } from './guides/guide-data';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import FeaturedPatterns from '@/components/patterns/FeaturedPatterns';
import PatternStudy from '@/components/patterns/PatternStudy';
import './home.css';

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
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <SiteHeader active="generator" />
            <main id="main-content" tabIndex={-1} className="home-main">
                <section className="home-hero" aria-labelledby="home-title">
                    <div className="hero-copy">
                        <p className="eyebrow">A little color. Something you made.</p>
                        <h1 id="home-title">Free Perler Bead <span>Pattern Generator</span></h1>
                        <p className="hero-description">Upload a photo, preview the bead layout, adjust the size, then export a printable <strong>perler bead pattern</strong> or open the editor for cleanup. Everything runs in your browser.</p>
                        <div className="hero-actions">
                            <a href="#generator" className="button-primary">Make a pattern <span aria-hidden="true">↓</span></a>
                            <Link href="/patterns" className="text-link">Find a pattern <span aria-hidden="true">↗</span></Link>
                        </div>
                        <p className="hero-note">Free to use <span aria-hidden="true">·</span> No account needed</p>
                    </div>
                    <PatternStudy />
                </section>

                <section id="generator" aria-label="Pattern generator" className="home-generator">
                    <div className="generator-label"><span className="eyebrow">Your workspace</span><span>Upload → Adjust → Make</span></div>
                    <Editor />
                </section>

                <FeaturedPatterns />

                <section className="home-section" aria-labelledby="how-it-works">
                    <div className="section-intro"><p className="eyebrow">One bead at a time</p><h2 id="how-it-works" className="section-heading">How The Generator Works</h2></div>
                    <div className="process-grid"><div className="process-step"><span className="process-number" aria-hidden="true">01</span><h3>Upload Your Image</h3><p>Start with a photo, sprite, or simple artwork. The preview shows how it will read as <strong>perler bead art</strong> before you export.</p></div>
<div className="process-step"><span className="process-number" aria-hidden="true">02</span><h3>Tune The Pattern</h3><p>Choose the board size and how many boards wide or tall your project should be, so the final <strong>fuse bead</strong> pattern fits your plan.</p></div>
<div className="process-step"><span className="process-number" aria-hidden="true">03</span><h3>Save Or Refine</h3><p>Download your <strong>perler bead template</strong>, save the project, or continue in the editor when a few beads need cleanup.</p></div></div>
                </section>

                <section className="home-section ideas-section" aria-labelledby="project-ideas">
                    <div className="section-intro"><p className="eyebrow">Made for your imagination</p><h2 id="project-ideas" className="section-heading">Perler Bead Project Ideas</h2></div>
                    <div className="ideas-grid"><div className="idea-item"><h3>Game Sprite Patterns</h3><p>Blocky game-style art works especially well as fuse bead templates. Try simple sprites, items, icons, or your own pixel artwork when you want clean edges and clear colors.</p></div>
<div className="idea-item"><h3>Character Portraits</h3><p>Use the generator to test whether a pet photo, cartoon-style portrait, anime-inspired sketch, or original character still reads clearly after it becomes a bead grid.</p></div>
<div className="idea-item"><h3>Printable Templates</h3><p>Export a printable chart when you need to count beads, share a pattern, or follow a design away from your screen.</p></div>
<div className="idea-item"><h3>Retro Pixel Art</h3><p>8-bit and 16-bit style artwork translates naturally into bead layouts. Use smaller boards for icons and larger boards for scene-style patterns.</p></div>
<div className="idea-item"><h3>Small Crafts</h3><p>Scale a design down for keychains, earrings, ornaments, magnets, or kid-friendly mini bead projects.</p></div>
<div className="idea-item"><h3>Manual Cleanup</h3><p>Open the editor when the preview is close but a face, outline, or background needs a few individual beads adjusted.</p></div></div>
                </section>

                <section className="home-section home-guides" aria-labelledby="learn-heading">
                    <div className="section-intro">
                        <p className="eyebrow">A few helpful notes</p>
                        <h2 id="learn-heading" className="section-heading">Learn Before You Make</h2>
                        <p>The generator keeps the main workflow fast. These guides help with board sizing, mini beads, beginner kits, and photo cleanup when a project needs more planning.</p>
                        <Link href="/guides" className="text-link">View All Guides <span aria-hidden="true">↗</span></Link>
                    </div>
                    <div className="home-guide-list">
                        {guidePages.map((guide, index) => (
                            <Link key={guide.slug} href={`/guides/${guide.slug}`}>
                                <span className="guide-number" aria-hidden="true">0{index + 1}</span>
                                <div><span className="eyebrow">{guide.eyebrow}</span><h3>{guide.title}</h3></div>
                                <span className="guide-arrow" aria-hidden="true">↗</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="home-section" aria-labelledby="features-heading">
                    <div className="section-intro"><p className="eyebrow">From the first pixel to the final chart</p><h2 id="features-heading" className="section-heading">What You Can Do</h2></div>
                    <div className="features-grid"><div className="feature-item"><h3>Bead Color Choices</h3><p>Pick a color set before generating so the pattern uses bead colors you can build with. The tool includes common <strong>perler bead</strong> and fuse bead palettes.</p></div>
<div className="feature-item"><h3>Clearer Color Picks</h3><p>The generator compares your image to available bead colors and picks close matches automatically, so you can focus on whether the <strong>perler bead pattern</strong> looks right.</p></div>
<div className="feature-item"><h3>Export What You Need</h3><p>Download <strong>patterns for perler beads</strong> as a printable PDF, image, SVG, spreadsheet, or grid preview when the design is ready to build or share.</p></div>
<div className="feature-item"><h3>Smoother Shading</h3><p>Use the soft shading option when a photo needs smoother color transitions, or leave it off for cleaner sprite, icon, and simple <strong>perler bead designs</strong>.</p></div>
<div className="feature-item"><h3>Clean Up By Hand</h3><p>Open the editor to paint, fill, erase, pick colors, zoom, and undo changes when the automatic result is close but not finished.</p></div></div>
                </section>

                <section className="home-section home-faq" aria-labelledby="faq-heading">
                    <div className="section-intro"><p className="eyebrow">Good to know</p><h2 id="faq-heading" className="section-heading">Frequently Asked Questions</h2></div>
                    <div>
                        {faqs.map((faq) => (
                            <details key={faq.question}>
                                <summary>{faq.question}<span aria-hidden="true">+</span></summary>
                                <p>{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>
            </main>
            <SiteFooter active="generator" description="Turn photos into printable perler bead patterns, then adjust the size, clean up beads, and export the result from your browser." />
        </div>
    );
}

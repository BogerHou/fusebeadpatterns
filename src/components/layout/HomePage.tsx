import Link from 'next/link';
import Editor from '@/components/editor/Editor';
import { guidePages } from '@/app/(english)/guides/guide-data';
import { getGuideSummaries } from '@/lib/guides/localized';
import { localizedHomeCopy, localizedHomeSections } from '@/lib/i18n/home';
import { localeRoutes } from '@/lib/i18n/routes';
import type { SiteLocale } from '@/lib/i18n/locales';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';
import FeaturedPatterns from '../patterns/FeaturedPatterns';
import PatternStudy from '../patterns/PatternStudy';
import '@/app/home.css';

type HomeFaq = { question: string; answer: string };
export type HomePageProps = {
    locale: SiteLocale;
    structuredData: Record<string, unknown> | Record<string, unknown>[];
    faqs?: HomeFaq[];
};

const englishCopy = {
    eyebrow: 'A little color. Something you made.', start: 'Make a pattern', browse: 'Browse free printable patterns',
    workspace: 'Your workspace', flow: 'Upload → Adjust → Make',
    stepsHeading: 'How The Generator Works', stepsEyebrow: 'One bead at a time',
    ideasEyebrow: 'Made for your imagination', ideasHeading: 'Perler Bead Project Ideas',
    guidesEyebrow: 'A few helpful notes', guidesHeading: 'Learn Before You Make',
    guidesIntro: 'The generator keeps the main workflow fast. These guides help with board sizing, mini beads, beginner kits, and photo cleanup when a project needs more planning.', guidesLink: 'View All Guides',
    featuresEyebrow: 'From the first pixel to the final chart', featuresHeading: 'What You Can Do',
    faqEyebrow: 'Good to know', faqHeading: 'Frequently Asked Questions',
};

/** Every home uses the same workflow, featured designs, and content sections. */
export default function HomePage({ locale, structuredData, faqs: englishFaqs = [] }: HomePageProps) {
    const native = locale === 'en' ? undefined : localizedHomeCopy[locale];
    const sections = locale === 'en' ? undefined : localizedHomeSections[locale];
    const copy = native && sections ? { ...native, ...sections } : englishCopy;
    const routes = localeRoutes[locale];
    const guides = locale === 'en'
        ? guidePages.map(guide => ({ ...guide, href: `/guides/${guide.slug}` }))
        : getGuideSummaries(locale);
    const faqs = sections?.faqs ?? englishFaqs;
    const steps = native?.steps.map(([title, text]) => ({ title, text })) ?? [
        { title: 'Upload Your Image', text: <>Start with a photo, sprite, or simple artwork. The preview shows how it will read as <strong>perler bead art</strong> before you export.</> },
        { title: 'Tune The Pattern', text: <>Choose the board size and how many boards wide or tall your project should be, so the final <strong>fuse bead</strong> pattern fits your plan.</> },
        { title: 'Save Or Refine', text: <>Download your <strong>perler bead template</strong>, save the project, or continue in the editor when a few beads need cleanup.</> },
    ];
    const ideas = sections?.ideas.map(([title, text]) => ({ title, text })) ?? [
        { title: 'Game Sprite Patterns', text: 'Blocky game-style art works especially well as fuse bead templates. Try simple sprites, items, icons, or your own pixel artwork when you want clean edges and clear colors.' },
        { title: 'Character Portraits', text: 'Use the generator to test whether a pet photo, cartoon-style portrait, anime-inspired sketch, or original character still reads clearly after it becomes a bead grid.' },
        { title: 'Printable Templates', text: 'Export a printable chart when you need to count beads, share a pattern, or follow a design away from your screen.' },
        { title: 'Retro Pixel Art', text: '8-bit and 16-bit style artwork translates naturally into bead layouts. Use smaller boards for icons and larger boards for scene-style patterns.' },
        { title: 'Small Crafts', text: 'Scale a design down for keychains, earrings, ornaments, magnets, or kid-friendly mini bead projects.' },
        { title: 'Manual Cleanup', text: 'Open the editor when the preview is close but a face, outline, or background needs a few individual beads adjusted.' },
    ];
    const features = sections?.features.map(([title, text]) => ({ title, text })) ?? [
        { title: 'Bead Color Choices', text: <>Pick a color set before generating so the pattern uses bead colors you can build with. The tool includes common <strong>perler bead</strong> and fuse bead palettes.</> },
        { title: 'Clearer Color Picks', text: <>The generator compares your image to available bead colors and picks close matches automatically, so you can focus on whether the <strong>perler bead pattern</strong> looks right.</> },
        { title: 'Export What You Need', text: <>Download <strong>patterns for perler beads</strong> as a printable PDF, image, SVG, spreadsheet, or grid preview when the design is ready to build or share.</> },
        { title: 'Smoother Shading', text: <>Use the soft shading option when a photo needs smoother color transitions, or leave it off for cleaner sprite, icon, and simple <strong>perler bead designs</strong>.</> },
        { title: 'Clean Up By Hand', text: 'Open the editor to paint, fill, erase, pick colors, zoom, and undo changes when the automatic result is close but not finished.' },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
            {native && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: locale,
                mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
            }).replace(/</g, '\\u003c') }} />}
            <SiteHeader active="generator" locale={locale} />
            <main id="main-content" tabIndex={-1} className="home-main">
                <section className="home-hero" aria-labelledby="home-title">
                    <div className="hero-copy">
                        <p className="eyebrow">{copy.eyebrow}</p>
                        <h1 id="home-title">{native ? native.heading : <>Free Perler Bead <span>Pattern Generator</span></>}</h1>
                        <p className="hero-description">{native ? native.intro : <>Upload a photo, preview the bead layout, adjust the size, then export a printable <strong>perler bead pattern</strong> or open the editor for cleanup. Everything runs in your browser.</>}</p>
                        <div className="hero-actions">
                            <a href="#generator" className="button-primary">{copy.start} <span aria-hidden="true">↓</span></a>
                            <Link href={routes.patterns} className="text-link">{copy.browse} <span aria-hidden="true">↗</span></Link>
                        </div>
                        <p className="hero-note">{native ? native.free : <>Free to use <span aria-hidden="true">·</span> No account needed</>}</p>
                    </div>
                    <PatternStudy locale={locale} />
                </section>

                <FeaturedPatterns locale={locale} />

                <section id="generator" aria-label={native?.workspace ?? 'Pattern generator'} className="home-generator">
                    <div className="generator-label"><span className="eyebrow">{copy.workspace}</span><span>{copy.flow}</span></div>
                    <Editor locale={locale} />
                </section>

                <section className="home-section" aria-labelledby="how-it-works">
                    <div className="section-intro"><p className="eyebrow">{copy.stepsEyebrow}</p><h2 id="how-it-works" className="section-heading">{copy.stepsHeading}</h2></div>
                    <div className="process-grid">{steps.map((step, index) => (
                        <div key={step.title} className="process-step"><span className="process-number" aria-hidden="true">0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></div>
                    ))}</div>
                </section>

                <section className="home-section ideas-section" aria-labelledby="project-ideas">
                    <div className="section-intro"><p className="eyebrow">{copy.ideasEyebrow}</p><h2 id="project-ideas" className="section-heading">{copy.ideasHeading}</h2></div>
                    <div className="ideas-grid">{ideas.map(idea => <div key={idea.title} className="idea-item"><h3>{idea.title}</h3><p>{idea.text}</p></div>)}</div>
                </section>

                <section className="home-section home-guides" aria-labelledby="learn-heading">
                    <div className="section-intro">
                        <p className="eyebrow">{copy.guidesEyebrow}</p>
                        <h2 id="learn-heading" className="section-heading">{copy.guidesHeading}</h2>
                        <p>{copy.guidesIntro}</p>
                        <Link href={routes.guides} className="text-link">{copy.guidesLink} <span aria-hidden="true">↗</span></Link>
                    </div>
                    <div className="home-guide-list">
                        {guides.map((guide, index) => (
                            <Link key={guide.slug} href={guide.href}>
                                <span className="guide-number" aria-hidden="true">0{index + 1}</span>
                                <div><span className="eyebrow">{guide.eyebrow}</span><h3>{guide.title}</h3></div>
                                <span className="guide-arrow" aria-hidden="true">↗</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="home-section" aria-labelledby="features-heading">
                    <div className="section-intro"><p className="eyebrow">{copy.featuresEyebrow}</p><h2 id="features-heading" className="section-heading">{copy.featuresHeading}</h2></div>
                    <div className="features-grid">{features.map(feature => <div key={feature.title} className="feature-item"><h3>{feature.title}</h3><p>{feature.text}</p></div>)}</div>
                </section>

                {native && <section id="print-help" className="home-section" aria-labelledby="print-help-title">
                    <div className="section-intro">
                        <h2 id="print-help-title" className="section-heading">{native.helpHeading}</h2>
                        <p>{native.help}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-3">
                            <Link href={routes.editor} prefetch={false} className="text-link">{native.editor}</Link>
                            <Link href={native.learnHref} className="text-link">{native.learn}</Link>
                            {(locale === 'de' || locale === 'fr') && <Link href={native.previewHref} className="text-link">{native.previewLink}</Link>}
                        </div>
                    </div>
                </section>}

                <section className="home-section home-faq" aria-labelledby="faq-heading">
                    <div className="section-intro"><p className="eyebrow">{copy.faqEyebrow}</p><h2 id="faq-heading" className="section-heading">{copy.faqHeading}</h2></div>
                    <div>
                        {faqs.map(faq => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}
                    </div>
                </section>
            </main>
            <SiteFooter locale={locale} active="generator" description={locale === 'en' ? 'Turn photos into printable perler bead patterns, then adjust the size, clean up beads, and export the result from your browser.' : undefined} />
        </div>
    );
}

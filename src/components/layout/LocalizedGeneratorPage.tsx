import Image from 'next/image';
import Link from 'next/link';
import Editor from '@/components/editor/Editor';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { localizedHomeCopy, type TranslatedLocale } from '@/lib/i18n/home';
import '@/app/home.css';

export default function LocalizedGeneratorPage({ locale, structuredData }: { locale: TranslatedLocale; structuredData?: Record<string, unknown> }) {
    const copy = localizedHomeCopy[locale];
    const schema = structuredData ?? {
        '@context': 'https://schema.org', '@type': 'WebApplication',
        name: copy.heading, description: copy.description,
        url: `https://fusebeadpatterns.art/${locale}`, inLanguage: locale,
        applicationCategory: 'DesignApplication', operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    };
    return (
        <div className="min-h-screen flex flex-col">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
            <SiteHeader active="generator" locale={locale} />
            <main id="main-content" tabIndex={-1} className="home-main">
                <section className="home-hero" aria-labelledby="home-title">
                    <div className="hero-copy">
                        <p className="eyebrow">{copy.eyebrow}</p>
                        <h1 id="home-title">{copy.heading}</h1>
                        <p className="hero-description">{copy.intro}</p>
                        <div className="hero-actions">
                            <a href="#generator" className="button-primary">{copy.start} <span aria-hidden="true">↓</span></a>
                            <Link href={copy.patternsHref} className="text-link">{copy.browse} <span aria-hidden="true">↗</span></Link>
                        </div>
                        <p className="hero-note">{copy.free}</p>
                    </div>
                    <figure className="rounded-xl border border-line bg-[#faf8f3] p-6">
                        <Image src="/patterns/original-friendly-ghost/preview.png" alt={copy.preview} width={580} height={580} unoptimized preload className="mx-auto h-auto w-full max-w-[360px] [image-rendering:pixelated]" />
                        <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                            <span>{copy.previewNote}</span>
                            <Link href={copy.previewHref} className="text-link">{copy.previewLink}</Link>
                        </figcaption>
                    </figure>
                </section>
                <section id="generator" aria-label={copy.workspace} className="home-generator">
                    <div className="generator-label"><span className="eyebrow">{copy.workspace}</span><span>{copy.flow}</span></div>
                    <Editor locale={locale} />
                </section>
                <section className="home-section" aria-labelledby="ready-patterns">
                    <div className="section-intro">
                        <h2 id="ready-patterns" className="section-heading">{copy.patternsHeading}</h2>
                        <p>{copy.patternsText}</p>
                        <Link href={copy.patternsHref} className="text-link">{copy.browse} <span aria-hidden="true">→</span></Link>
                    </div>
                </section>
                <section className="home-section" aria-labelledby="how-it-works">
                    <div className="section-intro"><h2 id="how-it-works" className="section-heading">{copy.stepsHeading}</h2></div>
                    <div className="process-grid">{copy.steps.map(([title, text], index) => (
                        <div key={title} className="process-step"><span className="process-number" aria-hidden="true">0{index + 1}</span><h3>{title}</h3><p>{text}</p></div>
                    ))}</div>
                </section>
                <section id="print-help" className="home-section" aria-labelledby="print-help-title">
                    <div className="section-intro">
                        <h2 id="print-help-title" className="section-heading">{copy.helpHeading}</h2>
                        <p>{copy.help}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-3">
                            <Link href={`/${locale}/editor`} prefetch={false} className="text-link">{copy.editor}</Link>
                            <Link href={copy.learnHref} className="text-link">{copy.learn}</Link>
                        </div>
                    </div>
                </section>
            </main>
            <SiteFooter locale={locale} active="generator" />
        </div>
    );
}

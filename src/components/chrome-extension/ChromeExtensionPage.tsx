import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { extensionCopy } from '@/lib/chrome-extension/content';
import { chromeExtensionLanguages, chromeExtensionPaths, chromeExtensionStoreUrl } from '@/lib/chrome-extension/routes';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import brandAssets from '@/lib/brand-assets.json';
import styles from './ChromeExtensionPage.module.css';

const screenshot = '/chrome-extension/bead-capture-workspace.webp';

export function chromeExtensionMetadata(locale: SiteLocale): Metadata {
    const { title, description, imageAlt } = extensionCopy[locale];
    return {
        title, description,
        alternates: { canonical: chromeExtensionPaths[locale], languages: chromeExtensionLanguages },
        openGraph: {
            type: 'website', title, description,
            url: chromeExtensionPaths[locale],
            siteName: 'Fuse Bead Patterns',
            locale: { en: 'en_US', de: 'de_DE', fr: 'fr_FR', ja: 'ja_JP' }[locale],
            images: [{ url: screenshot, width: 1280, height: 800, alt: imageAlt }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [screenshot] },
    };
}

export default function ChromeExtensionPage({ locale }: { locale: SiteLocale }) {
    const copy = extensionCopy[locale];
    const routes = localeRoutes[locale];
    const pageUrl = chromeExtensionPaths[locale].startsWith('http')
        ? chromeExtensionPaths[locale]
        : `https://fusebeadpatterns.art${chromeExtensionPaths[locale]}`;
    const applicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: copy.heading,
        description: copy.description,
        url: pageUrl,
        inLanguage: locale,
        applicationCategory: 'BrowserApplication',
        operatingSystem: 'Chrome',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    };
    const navigation = {
        en: { home: 'Home', breadcrumb: 'Breadcrumb' },
        de: { home: 'Startseite', breadcrumb: 'Brotkrumennavigation' },
        fr: { home: 'Accueil', breadcrumb: 'Fil d’Ariane' },
        ja: { home: 'ホーム', breadcrumb: 'パンくずリスト' },
    }[locale];
    return (
        <div className="min-h-screen flex flex-col">
            <script id="webapp-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema).replace(/</g, '\\u003c') }} />
            <SiteHeader locale={locale} active="chrome-extension" />
            <main id="main-content" tabIndex={-1} className={`page-shell flex-1 ${styles.main}`}>
                <Breadcrumbs label={navigation.breadcrumb} items={[
                    { label: navigation.home, href: routes.home },
                    { label: copy.label, href: chromeExtensionPaths[locale] },
                ]} />
                <section className={styles.hero} aria-labelledby="extension-heading">
                    <p className={styles.product}>
                        <Image src={brandAssets.headerLogo} alt="" width={32} height={32} unoptimized />
                        <span>Bead Capture <span className={styles.productLabel}>/ {copy.label}</span></span>
                    </p>
                    <h1 id="extension-heading">{copy.heading}</h1>
                    <p className={styles.intro}>{copy.intro}</p>
                    <div className={styles.actions}>
                        {chromeExtensionStoreUrl
                            ? <a className="button-primary" href={chromeExtensionStoreUrl} rel="noopener noreferrer">{copy.install}<ArrowRight size={18} aria-hidden="true" /></a>
                            : <Link className="button-primary" href={`${routes.home}#generator`} prefetch={false}>{copy.online}<ArrowRight size={18} aria-hidden="true" /></Link>}
                        {chromeExtensionStoreUrl
                            ? <Link className="button-secondary" href={`${routes.home}#generator`} prefetch={false}>{copy.online}</Link>
                            : <a className="text-link" href="#how-it-works">{copy.how}<ArrowRight size={16} aria-hidden="true" /></a>}
                    </div>
                </section>
                {!chromeExtensionStoreUrl && (
                    <aside className={styles.release} aria-labelledby="release-heading">
                        <h2 id="release-heading">{copy.pendingTitle}</h2>
                        <p>{copy.pending}</p>
                    </aside>
                )}
                <figure className={styles.preview}>
                    <a href={screenshot}>
                        <Image src={screenshot} alt={copy.imageAlt} width={1280} height={800} unoptimized preload className={styles.screenshot} />
                    </a>
                    <figcaption>{copy.caption}</figcaption>
                </figure>
                <section className={styles.workflow} aria-labelledby="how-it-works">
                    <h2 id="how-it-works" className="section-heading">{copy.stepsHeading}</h2>
                    <ol className={styles.steps}>
                        {copy.steps.map((step, index) => <li key={step.title}>
                            <span className={styles.number} aria-hidden="true">0{index + 1}</span>
                            <div><h3>{step.title}</h3><p>{step.text}</p></div>
                        </li>)}
                    </ol>
                </section>
                <section className={styles.details} aria-labelledby="before-install">
                    <h2 id="before-install" className="section-heading">{copy.detailsHeading}</h2>
                    <p className={styles.availability}>{copy.availability}</p>
                    <div className={styles.questions}>
                        {copy.questions.map(item => <details key={item.question}>
                            <summary>{item.question}</summary>
                            <p>{item.answer}</p>
                        </details>)}
                    </div>
                    <div className={styles.links}>
                        <Link href={routes.privacy} prefetch={false} className="text-link">{copy.privacy}</Link>
                        <Link href={routes.about} prefetch={false} className="text-link">{copy.support}</Link>
                    </div>
                    <p className={styles.independent}>{copy.independent}</p>
                </section>
            </main>
            <SiteFooter locale={locale} active="chrome-extension" />
        </div>
    );
}

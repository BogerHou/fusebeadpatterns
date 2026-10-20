import type { ReactNode } from 'react';
import Link from 'next/link';
import { localizedHomeCopy } from '@/lib/i18n/home';
import { localeRoutes } from '@/lib/i18n/routes';
import type { SiteLocale } from '@/lib/i18n/locales';

export type HomeHeroProps = {
    locale: SiteLocale;
    illustration?: ReactNode;
};

/** Shared converter introduction; each host supplies its own preview artwork. */
export default function HomeHero({ locale, illustration }: HomeHeroProps) {
    const native = locale === 'en' ? undefined : localizedHomeCopy[locale];

    return (
        <section className="home-hero" aria-labelledby="home-title">
            <div className="hero-copy">
                <p className="eyebrow">{native?.eyebrow ?? 'A little color. Something you made.'}</p>
                <h1 id="home-title">{native ? native.heading : <>Free Perler Bead <span>Pattern Generator</span></>}</h1>
                <p className="hero-description">{native ? native.intro : <>Upload a photo, preview the bead layout, adjust the size, then export a printable <strong>perler bead pattern</strong> or open the editor for cleanup. Everything runs in your browser.</>}</p>
                <div className="hero-actions">
                    <a href="#generator" className="button-primary">{native?.start ?? 'Make a pattern'} <span aria-hidden="true">↓</span></a>
                    <Link href={localeRoutes[locale].patterns} className="text-link">{native?.browse ?? 'Browse free printable patterns'} <span aria-hidden="true">↗</span></Link>
                </div>
                <p className="hero-note">{native ? native.free : <>Free to use <span aria-hidden="true">·</span> No account needed</>}</p>
            </div>
            {illustration}
        </section>
    );
}

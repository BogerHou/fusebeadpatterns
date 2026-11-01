import Image from 'next/image';
import Link from 'next/link';
import { getPatternById, type Pattern } from '@/lib/patterns/catalog';
import { getLocalizedPatternName, getLocalizedPatternTitle } from '@/lib/patterns/localized-content';
import { homeFeaturedPatternIds, homePatternCopy } from '@/lib/i18n/home-patterns';
import { getLocaleDestination, localeRoutes } from '@/lib/i18n/routes';
import type { SiteLocale } from '@/lib/i18n/locales';
import { toPatternCard } from './PatternCards';

function getPatternSectionHref(slug: 'easy' | 'christmas' | 'halloween', locale: SiteLocale): string {
    return getLocaleDestination(`/patterns/${slug}`, locale).href;
}

const featuredCategoryCopy: Record<SiteLocale, {
    label: string;
    easy: string;
    hama: string;
    christmas: string;
    halloween: string;
}> = {
    en: {
        label: 'Popular themes:',
        easy: 'Easy & Beginner Patterns',
        hama: 'Hama Bead Patterns',
        christmas: 'Christmas Patterns',
        halloween: 'Halloween Patterns',
    },
    de: {
        label: 'Beliebte Themen:',
        easy: 'Einfache Vorlagen für Anfänger',
        hama: 'Hama-Perlen-Vorlagen',
        christmas: 'Weihnachtsvorlagen',
        halloween: 'Halloween-Vorlagen',
    },
    fr: {
        label: 'Thèmes populaires :',
        easy: 'Modèles faciles débutant',
        hama: 'Modèles perles Hama',
        christmas: 'Modèles de Noël',
        halloween: 'Modèles Halloween',
    },
    ja: {
        label: '人気のテーマ:',
        easy: '初心者向け簡単図案',
        hama: 'Hamaビーズ図案',
        christmas: 'クリスマス図案',
        halloween: 'ハロウィン図案',
    },
};

export default function FeaturedPatterns({ locale = 'en' }: { locale?: SiteLocale }) {
    const copy = homePatternCopy[locale];
    const categories = featuredCategoryCopy[locale];
    const categoryLinks = [
        { href: getPatternSectionHref('easy', locale), label: categories.easy },
        { href: localeRoutes[locale].hamaPatterns, label: categories.hama },
        { href: getPatternSectionHref('christmas', locale), label: categories.christmas },
        { href: getPatternSectionHref('halloween', locale), label: categories.halloween },
    ];
    const featured = homeFeaturedPatternIds
        .map(getPatternById).filter((pattern): pattern is Pattern => Boolean(pattern));
    return (
        <section id="ready-patterns" className="home-featured-patterns" aria-labelledby="featured-patterns-title">
            <div className="featured-patterns-intro">
                <div>
                    <p className="eyebrow">{copy.eyebrow}</p>
                    <h2 id="featured-patterns-title" className="section-heading">{copy.heading}</h2>
                    <p className="featured-patterns-description">{copy.description}</p>
                </div>
                <Link href={localeRoutes[locale].patterns} className="text-link">{copy.browse} <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
            <div className="featured-patterns-grid">
                {featured.map((pattern) => {
                    const card = toPatternCard(pattern);
                    const title = locale === 'en' ? card.title : getLocalizedPatternName(pattern, locale);
                    return (
                        <article key={pattern.id} className="featured-pattern-card" data-pattern-card={pattern.id}>
                            <Link href={`${localeRoutes[locale].patterns}/${pattern.slug}`} prefetch={false}>
                                <Image
                                    src={card.preview}
                                    alt={locale === 'en' ? `${card.title} Perler bead pattern` : getLocalizedPatternTitle(pattern, locale)}
                                    width={580}
                                    height={580}
                                    unoptimized
                                />
                                <h3>{title}</h3>
                            </Link>
                        </article>
                    );
                })}
            </div>
            <p className="featured-patterns-categories">
                <span>{categories.label}</span>{' '}
                {categoryLinks.map((item, index) => (
                    <span key={item.href}>
                        {index > 0 ? ' · ' : null}
                        <Link href={item.href} className="text-link">{item.label}</Link>
                    </span>
                ))}
            </p>
        </section>
    );
}

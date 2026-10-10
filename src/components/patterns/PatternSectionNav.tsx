import Link from 'next/link';
import type { SiteLocale } from '@/lib/i18n/locales';
import { patternSectionSlugs, getPatternSectionHref } from '@/lib/patterns/section-routes';
import { sectionLabels, sectionUi } from '@/lib/patterns/section-messages';
import { localeRoutes } from '@/lib/i18n/routes';
import { patternCollections } from '@/lib/patterns/catalog';
import { patternTopics } from '@/lib/patterns/topics';

export default function PatternSectionNav({ locale, current }: { locale: SiteLocale; current?: string }) {
    const labels = locale === 'en' ? Object.fromEntries([
        ...patternCollections.map(collection => [collection.slug, collection.title]),
        ...patternTopics.map(topic => [topic.slug, topic.label]),
    ]) : sectionLabels[locale];
    return <nav aria-label={locale === 'en' ? 'Pattern topics' : sectionUi[locale].nav} className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
        {patternSectionSlugs.map(slug => <Link key={slug} href={getPatternSectionHref(slug, locale)} prefetch={false} aria-current={slug === current ? 'page' : undefined} className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">{labels[slug]}</Link>)}
        <Link href={localeRoutes[locale].hamaPatterns} prefetch={false} aria-current={current === 'hama' ? 'page' : undefined} className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">{{ en: 'Hama patterns', de: 'Hama-Vorlagen', fr: 'Modèles Hama', ja: 'Hamaの図案' }[locale]}</Link>
    </nav>;
}

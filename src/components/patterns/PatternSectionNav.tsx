import Link from 'next/link';
import type { PatternLocale } from '@/lib/patterns/localized-content';
import { patternSectionSlugs, getPatternSectionHref } from '@/lib/patterns/section-routes';
import { sectionLabels, sectionUi } from '@/lib/patterns/section-messages';
import { localeRoutes } from '@/lib/i18n/routes';

export default function PatternSectionNav({ locale, current }: { locale: PatternLocale; current?: string }) {
    return <nav aria-label={sectionUi[locale].nav} className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
        {patternSectionSlugs.map(slug => <Link key={slug} href={getPatternSectionHref(slug, locale)} prefetch={false} aria-current={slug === current ? 'page' : undefined} className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">{sectionLabels[locale][slug]}</Link>)}
        <Link href={localeRoutes[locale].hamaPatterns} prefetch={false} aria-current={current === 'hama' ? 'page' : undefined} className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">{{ de: 'Hama-Vorlagen', fr: 'Modèles Hama', ja: 'Hamaの図案' }[locale]}</Link>
    </nav>;
}

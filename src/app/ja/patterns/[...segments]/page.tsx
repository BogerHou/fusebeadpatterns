import { getPatternBySlug, patterns } from '@/lib/patterns/catalog';
import { notFound } from 'next/navigation';
import LocalizedPatternDetail, { localizedPatternMetadata } from '@/components/patterns/LocalizedPatternDetail';
import LocalizedPatternSection, { localizedSectionMetadata } from '@/components/patterns/LocalizedPatternSection';
import { getLocalizedPatternSection } from '@/lib/patterns/localized-sections';
import { patternSectionSlugs, getPatternSectionHref } from '@/lib/patterns/section-routes';

type Props = { params: Promise<{ segments: string[] }> };
const locale = 'ja' as const;
export const dynamicParams = false;
export function generateStaticParams() {
    const sections = patternSectionSlugs.filter(slug => getPatternSectionHref(slug, locale) === `/${locale}/patterns/${slug}`);
    return [...patterns.map(pattern => pattern.slug), ...sections].map(slug => ({ segments: slug.split('/') }));
}
export async function generateMetadata({ params }: Props) {
    const slug = (await params).segments.join('/');
    const pattern = getPatternBySlug(slug);
    if (pattern) return localizedPatternMetadata(pattern, locale);
    const section = getLocalizedPatternSection(slug, locale);
    if (!section || section.href !== `/${locale}/patterns/${slug}`) notFound();
    return localizedSectionMetadata(section, locale);
}
export default async function Page({ params }: Props) {
    const slug = (await params).segments.join('/');
    const pattern = getPatternBySlug(slug);
    if (pattern) return <LocalizedPatternDetail pattern={pattern} locale={locale} />;
    const section = getLocalizedPatternSection(slug, locale);
    if (!section || section.href !== `/${locale}/patterns/${slug}`) notFound();
    return <LocalizedPatternSection section={section} locale={locale} />;
}

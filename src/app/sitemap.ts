import { hamaMakerPaths } from '@/lib/hama-maker/routes';
import { guideRouteGroups } from '@/lib/guides/routes';
import { sitePageRouteGroups } from '@/lib/site-pages/routes';
import { localeRoutes } from '@/lib/i18n/routes';
import { patternSectionSlugs, getPatternSectionHref } from '@/lib/patterns/section-routes';
import { MetadataRoute } from 'next';
import { guidePages } from './(english)/guides/guide-data';
import { patterns, patternCollections, getPatternHref } from '@/lib/patterns/catalog';
import { patternContentUpdatedAt } from '@/lib/patterns/content';
import { patternTopics } from '@/lib/patterns/topics';
import { hamaPatterns, hamaUpdatedAt } from '@/lib/patterns/hama';
import { germanHamaPath, germanHamaPatterns, germanHamaUpdatedAt } from '@/lib/patterns/german-hama';
import { loomPatterns, loomPatternAssetPath } from '@/lib/bead-loom/patterns';

const lastContentUpdate = new Date('2026-04-21T00:00:00.000Z');
const translationBaseline = Date.parse('2026-10-09T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        ...Object.values(hamaMakerPaths).map(path => ({
            url: `https://fusebeadpatterns.art${path}`,
            lastModified: new Date('2026-10-09T00:00:00.000Z'),
            changeFrequency: 'monthly' as const,
        })),
        {
            url: 'https://fusebeadpatterns.art',
            lastModified: new Date('2026-10-04T00:00:00.000Z'),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: 'https://fusebeadpatterns.art/pixel-art-grid',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: 'https://fusebeadpatterns.art/de/pixel-art-generator',
            lastModified: new Date('2026-10-09T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: 'https://fusebeadpatterns.art/bead-loom-pattern-maker',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        ...(['de', 'fr', 'ja'] as const).map(locale => ({
            url: `https://fusebeadpatterns.art${localeRoutes[locale].beadLoom}`,
            lastModified: new Date('2026-10-09T00:00:00.000Z'),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
        ...(['en', 'de', 'fr', 'ja'] as const).map(locale => ({
            url: `https://fusebeadpatterns.art${localeRoutes[locale].beadLoomPatterns}`,
            lastModified: new Date('2026-10-09T00:00:00.000Z'),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
            images: loomPatterns.map(pattern => `https://fusebeadpatterns.art${loomPatternAssetPath(pattern.id, locale, 'preview')}`),
        })),
        {
            url: 'https://fusebeadpatterns.art/fr/image-en-pixel-art',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: 'https://fusebeadpatterns.art/about',
            lastModified: new Date('2026-09-24T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: 'https://fusebeadpatterns.art/guides',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        ...guideRouteGroups.flatMap(group => (['de', 'fr', 'ja'] as const).filter(locale => group[locale] !== '/ja/guides/photo-to-perler-bead-pattern').map(locale => ({
            url: `https://fusebeadpatterns.art${group[locale]}`,
            lastModified: new Date(Math.max(translationBaseline, Date.parse(guidePages.find(guide => group.en === `/guides/${guide.slug}`)?.updatedAt ?? '2026-10-09'))),
        }))),
        ...sitePageRouteGroups.flatMap(group => (['de', 'fr', 'ja'] as const).map(locale => ({
            url: `https://fusebeadpatterns.art${group[locale]}`,
            lastModified: new Date('2026-10-09T00:00:00.000Z'),
        }))),
        ...guidePages.map((guide) => ({
            url: `https://fusebeadpatterns.art/guides/${guide.slug}`,
            lastModified: guide.updatedAt ? new Date(guide.updatedAt) : lastContentUpdate,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
        {
            url: 'https://fusebeadpatterns.art/privacy-policy',
            lastModified: lastContentUpdate,
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: 'https://fusebeadpatterns.art/terms-of-service',
            lastModified: lastContentUpdate,
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: 'https://fusebeadpatterns.art/patterns',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        ...patternTopics.map((topic) => ({
            url: `https://fusebeadpatterns.art/patterns/${topic.slug}`,
            lastModified: new Date(topic.updatedAt),
        })),
        {
            url: 'https://fusebeadpatterns.art/patterns/hama',
            lastModified: new Date(hamaUpdatedAt),
            images: hamaPatterns.map(({ preview }) => `https://fusebeadpatterns.art${preview}`),
        },
        {
            url: 'https://fusebeadpatterns.art/de/patterns',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        {
            url: `https://fusebeadpatterns.art${germanHamaPath}`,
            lastModified: new Date(germanHamaUpdatedAt),
            images: germanHamaPatterns.map(({ preview }) => `https://fusebeadpatterns.art${preview}`),
        },
        ...(['fr', 'ja'] as const).map(locale => ({
            url: `https://fusebeadpatterns.art${localeRoutes[locale].hamaPatterns}`,
            lastModified: new Date('2026-10-09T00:00:00.000Z'),
            images: hamaPatterns.map(({ preview }) => `https://fusebeadpatterns.art${preview}`),
        })),
        {
            url: 'https://fusebeadpatterns.art/fr/modeles-perles-a-repasser',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        {
            url: 'https://fusebeadpatterns.art/fr/modeles-perles-a-repasser-noel',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        {
            url: 'https://fusebeadpatterns.art/ja/patterns',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        {
            url: 'https://fusebeadpatterns.art/de',
            lastModified: new Date('2026-10-09T00:00:00.000Z'),
        },
        {
            url: 'https://fusebeadpatterns.art/fr',
            lastModified: new Date('2026-10-09T00:00:00.000Z'),
        },
        {
            url: 'https://fusebeadpatterns.art/ja',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        {
            url: 'https://fusebeadpatterns.art/ja/guides/photo-to-perler-bead-pattern',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        {
            url: 'https://fusebeadpatterns.art/ja/pixel-art-converter',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        ...patternCollections.map((collection) => ({
            url: `https://fusebeadpatterns.art/patterns/${collection.slug}`,
            lastModified: new Date(patternContentUpdatedAt),
        })),
        { url: 'https://fusebeadpatterns.art/fr/patterns', lastModified: new Date('2026-10-09T00:00:00.000Z') },
        ...(['de', 'fr', 'ja'] as const).flatMap(locale => patternSectionSlugs.filter(slug => !(locale === 'fr' && slug === 'christmas')).map(slug => ({
            url: `https://fusebeadpatterns.art${getPatternSectionHref(slug, locale)}`,
            lastModified: new Date(slug === 'small' ? '2026-10-11T00:00:00.000Z' : '2026-10-09T00:00:00.000Z'),
        }))),
        ...['de', 'fr', 'ja'].flatMap(locale => patterns.map(pattern => ({
            url: `https://fusebeadpatterns.art/${locale}/patterns/${pattern.slug}`,
            lastModified: new Date(pattern.id === 'original-black-cat' ? '2026-10-11T00:00:00.000Z' : '2026-10-09T00:00:00.000Z'),
            images: [`https://fusebeadpatterns.art${pattern.assets.preview}`],
        }))),
        ...patterns.map((pattern) => ({
            url: `https://fusebeadpatterns.art${getPatternHref(pattern)}`,
            lastModified: new Date(pattern.updatedAt > patternContentUpdatedAt ? pattern.updatedAt : patternContentUpdatedAt),
            images: [`https://fusebeadpatterns.art${pattern.assets.preview}`],
        })),
    ];
}

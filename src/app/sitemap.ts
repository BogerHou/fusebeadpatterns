import { MetadataRoute } from 'next';
import { guidePages } from './(english)/guides/guide-data';
import { patterns, patternCollections, getPatternHref } from '@/lib/patterns/catalog';
import { patternContentUpdatedAt } from '@/lib/patterns/content';
import { patternTopics } from '@/lib/patterns/topics';

const lastContentUpdate = new Date('2026-04-21T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://fusebeadpatterns.art',
            lastModified: new Date('2026-10-04T00:00:00.000Z'),
            changeFrequency: 'weekly',
            priority: 1,
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
            url: 'https://fusebeadpatterns.art/ja/patterns',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        {
            url: 'https://fusebeadpatterns.art/ja/guides/photo-to-perler-bead-pattern',
            lastModified: new Date('2026-10-08T00:00:00.000Z'),
        },
        ...patternCollections.map((collection) => ({
            url: `https://fusebeadpatterns.art/patterns/${collection.slug}`,
            lastModified: new Date(patternContentUpdatedAt),
        })),
        ...patterns.map((pattern) => ({
            url: `https://fusebeadpatterns.art${getPatternHref(pattern)}`,
            lastModified: new Date(pattern.updatedAt > patternContentUpdatedAt ? pattern.updatedAt : patternContentUpdatedAt),
            images: [`https://fusebeadpatterns.art${pattern.assets.preview}`],
        })),
    ];
}

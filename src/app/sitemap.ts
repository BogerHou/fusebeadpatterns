import { MetadataRoute } from 'next';
import { guidePages } from './guides/guide-data';
import { patterns, patternCollections, getPatternHref } from '@/lib/patterns/catalog';

const lastContentUpdate = new Date('2026-04-21T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://fusebeadpatterns.art',
            lastModified: lastContentUpdate,
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: 'https://fusebeadpatterns.art/about',
            lastModified: lastContentUpdate,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: 'https://fusebeadpatterns.art/guides',
            lastModified: lastContentUpdate,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        ...guidePages.map((guide) => ({
            url: `https://fusebeadpatterns.art/guides/${guide.slug}`,
            lastModified: lastContentUpdate,
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
            lastModified: new Date('2026-09-22T00:00:00.000Z'),
        },
        ...patternCollections.map((collection) => ({
            url: `https://fusebeadpatterns.art/patterns/${collection.slug}`,
            lastModified: new Date('2026-09-22T00:00:00.000Z'),
        })),
        ...patterns.map((pattern) => ({
            url: `https://fusebeadpatterns.art${getPatternHref(pattern)}`,
            lastModified: new Date(pattern.updatedAt),
            images: [`https://fusebeadpatterns.art${pattern.assets.preview}`],
        })),
    ];
}

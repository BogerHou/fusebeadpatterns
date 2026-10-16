import { describe, expect, it } from 'vitest';
import { getLocaleDestination, localeRoutes } from '../i18n/routes';
import { spriteCopy } from './copy';
import { spriteMetadata } from './metadata';
import { spriteAlternates, spritePaths } from './routes';

describe('one sprite animation tool across four equivalent language pages', () => {
    it('maps all language pairs without dropping the tool, query or fragment', () => {
        for (const source of Object.values(spritePaths)) {
            for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
                expect(getLocaleDestination(source, locale, { search: '?example=blank', hash: '#sprite-how' }))
                    .toEqual({ href: `${spritePaths[locale]}?example=blank#sprite-how`, isFallback: false });
                expect(localeRoutes[locale].sprites).toBe(spritePaths[locale]);
            }
        }
        expect(new Set(Object.values(spritePaths)).size).toBe(4);
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('%s has natural summaries, self canonical and reciprocal equivalents', locale => {
        const copy = spriteCopy[locale];
        const meta = spriteMetadata(locale);
        expect(meta.title).toBe(copy.title);
        expect(meta.description).toBe(copy.description);
        expect(Array.from(copy.description).length).toBeLessThanOrEqual(160);
        expect(copy.description.length).toBeGreaterThan(35);
        expect(copy.heading.length).toBeGreaterThan(4);
        expect(meta).not.toHaveProperty('keywords');
        expect(meta.alternates).toEqual({ canonical: spritePaths[locale], languages: spriteAlternates });
        expect(spriteAlternates['x-default']).toBe('https://fusebeadpatterns.art/sprite-maker');
        expect(meta.openGraph).toMatchObject({ url: `https://fusebeadpatterns.art${spritePaths[locale]}`, images: [] });
        expect(copy.steps.length).toBeGreaterThanOrEqual(3);
        expect(copy.notes.length).toBeGreaterThanOrEqual(3);
    });
});

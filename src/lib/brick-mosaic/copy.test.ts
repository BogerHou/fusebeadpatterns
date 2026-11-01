import { describe, expect, it } from 'vitest';
import { SITE_LOCALES } from '../i18n/locales';
import { brickCopy } from './copy';
import { brickMetadata } from './metadata';
import { brickAlternates, brickLabels, brickPaths } from './routes';

function leaves(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(leaves);
    if (value && typeof value === 'object') return Object.values(value).flatMap(leaves);
    return [];
}

function placeholders(value: string): string[] {
    return (value.match(/\{[a-zA-Z]+\}/g) ?? []).sort();
}

describe('one brick mosaic tool with four complete language experiences', () => {
    it.each(SITE_LOCALES)('%s includes the same controls and translated file labels', locale => {
        const copy = brickCopy[locale];
        expect(Object.keys(copy).sort()).toEqual(Object.keys(brickCopy.en).sort());
        expect(Object.keys(copy.pdfLabels).sort()).toEqual(Object.keys(brickCopy.en.pdfLabels).sort());
        expect(copy.steps).toHaveLength(3);
        expect(copy.notes.length).toBeGreaterThanOrEqual(4);
        for (const value of leaves(copy)) {
            expect(value.trim()).not.toBe('');
            expect(value).not.toMatch(/TODO|TBD|lorem ipsum|placeholder|[\u200b\u200c\u200d\u2060\ufeff]/i);
        }
        for (const key of Object.keys(brickCopy.en) as (keyof typeof copy)[]) {
            if (typeof copy[key] === 'string') {
                expect(placeholders(copy[key] as string), key).toEqual(placeholders(brickCopy.en[key] as string));
            }
        }
        for (const key of Object.keys(copy.pdfLabels) as (keyof typeof copy.pdfLabels)[]) {
            expect(placeholders(copy.pdfLabels[key]), `pdfLabels.${key}`)
                .toEqual(placeholders(brickCopy.en.pdfLabels[key]));
        }
    });

    it.each(SITE_LOCALES)('%s states the limits and local project boundaries', locale => {
        const copy = brickCopy[locale];
        expect(copy.sizeHelp).toContain('128');
        expect(copy.imageHelp).toMatch(/8 (?:MiB|Mio)/);
        expect(copy.imageHelp.replace(/[,.\s]/g, '')).toContain('2048');
        expect(copy.partHelp).toContain('3024');
        expect(copy.notes.join(' ')).toContain('RGBA');
        expect(copy.notes.join(' ')).toContain('32');
        expect(copy.notes.join(' ')).toContain('48');
        expect(copy.sourceNote).toContain('LDraw.org');
        expect(copy.sourceNote).toContain('CC BY 4.0');
        expect(copy.pdfLabels.source).toContain('CC BY 4.0');
        expect(copy.projectHelp).not.toBe(copy.saveNotice);
        expect(copy.sourceMissing).not.toBe(copy.imageError);
        expect(copy.keepCurrent).not.toBe(copy.confirmReplace);
        expect(copy.leaveConfirm).not.toBe(copy.replace);
        expect(copy.imagePlacement).not.toBe(copy.fit);
        expect(copy.pdfLabels.note).toContain('1:1');
        expect(Array.from(copy.pdfLabels.note).length).toBeLessThanOrEqual(90);
    });

    it.each(SITE_LOCALES)('%s has concise metadata and reciprocal equivalents without keyword tags', locale => {
        const copy = brickCopy[locale];
        const metadata = brickMetadata(locale);
        expect(Array.from(copy.description).length).toBeLessThanOrEqual(160);
        expect(Array.from(copy.description).length).toBeGreaterThan(35);
        expect(copy.title).not.toMatch(/official|offiziell|officiel|公式/i);
        expect(brickLabels[locale]).not.toBe('');
        expect(metadata.title).toBe(copy.title);
        expect(metadata.description).toBe(copy.description);
        expect(metadata).not.toHaveProperty('keywords');
        expect(metadata.alternates).toEqual({ canonical: brickPaths[locale], languages: brickAlternates });
        expect(metadata.openGraph).toMatchObject({
            url: `https://fusebeadpatterns.art${brickPaths[locale]}`,
            images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: copy.title }],
        });
        expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', images: ['/opengraph-image.png'] });
    });

    it('uses one English entry, four language URLs and an English x-default', () => {
        expect(brickPaths).toEqual({
            en: '/brick-mosaic-maker',
            de: '/de/mosaik-generator',
            fr: '/fr/mosaique-briques',
            ja: '/ja/brick-mosaic-maker',
        });
        expect(new Set(Object.values(brickPaths)).size).toBe(4);
        expect(Object.keys(brickAlternates).sort()).toEqual(['de', 'en', 'fr', 'ja', 'x-default']);
        expect(brickAlternates['x-default']).toBe('https://fusebeadpatterns.art/brick-mosaic-maker');
    });
});

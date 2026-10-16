import { describe, expect, it } from 'vitest';
import { spriteCopy } from './copy';

describe('sprite maker four-language copy', () => {
    it.each(['en', 'de', 'fr', 'ja'] as const)('%s has a complete natural search summary and consistent controls', locale => {
        const copy = spriteCopy[locale];
        expect(copy.description.length).toBeLessThanOrEqual(160);
        expect(copy.title.length).toBeGreaterThan(10);
        expect(Object.keys(copy).sort()).toEqual(Object.keys(spriteCopy.en).sort());
        for (const value of Object.values(copy).flat()) {
            expect(value.trim().length).toBeGreaterThan(0);
            expect(value).not.toMatch(/TODO|TBD|lorem|placeholder/i);
        }
        expect(copy.steps).toHaveLength(3);
        expect(copy.notes).toHaveLength(3);
        expect(copy.notes[1]).toContain('128');
        expect(copy.notes[0]).toContain('RGBA');
    });
});

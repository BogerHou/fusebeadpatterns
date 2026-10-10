import { describe, expect, it } from 'vitest';
import { patterns } from './catalog';
import { getPatternFanArtNotice } from './fan-art';

describe('Creeper fan-art disclosure', () => {
    it('names the actual publisher and rights holders without claiming endorsement', () => {
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
            const notice = getPatternFanArtNotice({ id: 'minecraft-creeper-face-v1' }, locale)!;
            expect(notice).toContain('Fuse Bead Patterns');
            expect(notice).toContain('Mojang');
            expect(notice).toContain('Microsoft');
            expect(notice).not.toMatch(/CC0|Creative Commons|licen[cs]ed|Original design/i);
        }
        expect(getPatternFanArtNotice({ id: 'minecraft-creeper-face-v1' })).toContain('Not approved by or associated with');
        expect(getPatternFanArtNotice({ id: 'minecraft-creeper-face-v1' }, 'ja')).toContain('非公式');
    });
    it('adds no notice to any of the existing 109 patterns or an unknown candidate', () => {
        for (const pattern of patterns.filter(pattern => pattern.id !== 'minecraft-creeper-face-v1')) {
            for (const locale of ['en', 'de', 'fr', 'ja'] as const) expect(getPatternFanArtNotice(pattern, locale)).toBeNull();
        }
        expect(getPatternFanArtNotice({ id: 'minecraft-creeper-face-v2' })).toBeNull();
    });
});

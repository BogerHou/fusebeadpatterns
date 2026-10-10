import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { patterns } from '../../lib/patterns/catalog';
import CoasterInstructions from './CoasterInstructions';

const locales = ['en', 'de', 'fr', 'ja'] as const;
const patternId = 'original-retro-diamond-coaster';

describe('coaster finishing instructions', () => {
    it.each(locales)('gives the dimensions, cork process and real-use limits in %s', locale => {
        const html = renderToStaticMarkup(createElement(CoasterInstructions, { patternId, locale }));
        expect(html).toContain('id="coaster-finishing-heading"');
        expect(html).toContain('115');
        expect(html).toContain('5 mm');
        expect(html.match(/<li>/g)).toHaveLength(3);
        expect(html).toContain('href="https://perler.com/blogs/projects/flower-coaster-set"');
        expect(html).toContain('hrefLang="en"');
        const nativeChecks = {
            en: ['cup base', 'cool completely', 'actual outline', 'adhesive instructions', 'not been assembled', 'hot cups', 'dishwasher'],
            de: ['Tassenboden', 'vollständig abkühlen', 'tatsächlichen Umriss', 'Klebstoffanleitung', 'ungeprüft', 'heißen Tassen', 'Spülmaschine'],
            fr: ['fond de votre tasse', 'refroidir complètement', 'contour réel', 'instructions de la colle', 'ne sont pas vérifiées', 'tasse chaude', 'lave-vaisselle'],
            ja: ['カップの底', '完全に冷ま', '実際の輪郭', '接着剤の説明', '未検証', '熱いカップ', '食器洗い機'],
        };
        for (const text of nativeChecks[locale]) expect(html).toContain(text);
    });

    it('adds no finishing instructions to any other catalog pattern', () => {
        for (const pattern of patterns.filter(pattern => pattern.id !== patternId)) {
            for (const locale of locales) {
                expect(renderToStaticMarkup(createElement(CoasterInstructions, { patternId: pattern.id, locale }))).toBe('');
            }
        }
        expect(renderToStaticMarkup(createElement(CoasterInstructions, { patternId: 'coaster' }))).toBe('');
    });
});

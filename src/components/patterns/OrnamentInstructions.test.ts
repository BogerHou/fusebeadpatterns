import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getPatternById, patterns } from '../../lib/patterns/catalog';
import { decodeEditorPatternDraft, parseEditorProject } from '../../lib/editor/draft';
import OrnamentInstructions from './OrnamentInstructions';

const locales = ['en', 'de', 'fr', 'ja'] as const;
const patternId = 'original-christmas-bauble-ornament';

describe('ornament attachment instructions', () => {
    it('matches the actual editor project opening and its two-cell border', () => {
        const pattern = getPatternById(patternId)!;
        const project = parseEditorProject(readFileSync(`public${pattern.assets.project}`, 'utf8'))!;
        const pixels = decodeEditorPatternDraft(project.editedPattern)!;
        expect([project.editedPattern!.width, project.editedPattern!.height]).toEqual([29, 29]);
        expect([pattern.motifWidth * 5, pattern.motifHeight * 5]).toEqual([105, 125]);
        const frameColor = pattern.palette.find(color => color.ref === '80-19057')!.hex;
        // Public instructions count from 1: opening 14–16 / 5–7, frame 12–18 / 3–9.
        for (let row = 3; row <= 9; row++) for (let column = 12; column <= 18; column++) {
            const offset = ((row - 1) * 29 + column - 1) * 4;
            const isOpening = column >= 14 && column <= 16 && row >= 5 && row <= 7;
            expect(pixels[offset + 3], `row ${row}, column ${column}`).toBe(isOpening ? 0 : 255);
            if (!isOpening) expect(`#${Buffer.from(pixels.subarray(offset, offset + 3)).toString('hex')}`).toBe(frameColor);
        }
    });

    it.each(locales)('explains the opening, attachment and untested limits in %s', locale => {
        const html = renderToStaticMarkup(createElement(OrnamentInstructions, { patternId, locale }));
        expect(html).toContain('id="ornament-finishing-heading"');
        for (const text of ['105', '125', '5 mm', '14–16', '5–7', '15 mm']) expect(html).toContain(text);
        expect(html.match(/<li>/g)).toHaveLength(3);
        expect(html).toContain('href="https://perler.com/blogs/projects/easter-egg-ornaments"');
        expect(html).toContain('hrefLang="en"');
        expect(html).toContain(`href="${locale === 'en' ? '' : `/${locale}`}/guides/how-to-iron-perler-beads"`);
        const nativeChecks = {
            en: ['not the finished size', 'two-bead border', 'cool completely', 'passes through naturally', 'Do not stretch', 'drill', 'tie its two ends', 'connections are intact', 'not been physically assembled', 'hanging strength'],
            de: ['nicht die fertige Größe', 'zwei Perlen breiten Rand', 'vollständig abkühlen', 'ohne Druck', 'Dehne', 'bohre', 'beiden Enden', 'Perlenverbindungen intakt', 'ungeprüft', 'Tragfähigkeit'],
            fr: ['taille finale', 'deux perles', 'refroidir complètement', 'sans forcer', 'N’écartez', 'ne percez', 'deux extrémités', 'jonctions entre perles sont intactes', 'n’ont pas été testées', 'capacité de charge'],
            ja: ['完成寸法ではありません', 'ビーズ2個幅', '完全に冷ま', '無理なく通る', '押し広げ', 'ドリル', '両端を結び', 'すべてつながり', '吊り下げ強度', '未検証'],
        };
        for (const text of nativeChecks[locale]) expect(html).toContain(text);
    });

    it('does not add attachment guidance to any other pattern', () => {
        for (const pattern of patterns.filter(pattern => pattern.id !== patternId)) {
            for (const locale of locales) {
                expect(renderToStaticMarkup(createElement(OrnamentInstructions, { patternId: pattern.id, locale }))).toBe('');
            }
        }
        expect(renderToStaticMarkup(createElement(OrnamentInstructions, { patternId: 'ornament' }))).toBe('');
    });
});

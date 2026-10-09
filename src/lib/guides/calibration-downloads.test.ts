import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const folder = resolve(process.cwd(), 'public/printables/calibration');
const oldHashes = {
    '29x29-5mm-a4.pdf': '94bd07a4a83b167b8cc9d3d49083e12ff90781d2bed8c1377617e5d9dd705ea1',
    '29x29-5mm-us-letter.pdf': '65355a2ff9c87986234084d23363328679a92d158c622125653d2624b91d7b7b',
    '29x29-5mm-a4.svg': '3e48902e8effd764a14da779990da4a1c065ad2441c09f7f4cfb4604027da23e',
    '29x29-5mm-us-letter.svg': 'c0aa2e41ab7902e80b705ea7667e8b025d7607c9e0bd18a15180bd7f77ae1dcc',
};
const phrases = {
    de: ['Druckkalibrierung', 'Tatsächliche Größe / 100%', 'echter Ausdruck und Passung auf Steckplatten nicht getestet'],
    fr: ['Contrôle d’impression', 'Taille réelle / 100%', 'impression réelle et adaptation à une plaque non testées'],
    ja: ['印刷サイズの確認', '実際のサイズ・100%', '実物での印刷・プレートとの適合は未検証'],
};
const cases = (['de', 'fr', 'ja'] as const).flatMap(locale => (['a4', 'us-letter'] as const).map(paper => [locale, paper] as const));
const lines = (svg: string) => [...svg.matchAll(/<line\b[^>]*\/>/g)].map(match => match[0]);
const attribute = (xml: string, key: string) => xml.match(new RegExp(`${key}="([^"]*)"`))?.[1];
describe('native physical-unit calibration downloads', () => {
    it('preserves all four existing English downloads byte for byte', () => {
        for (const [name, hash] of Object.entries(oldHashes)) expect(createHash('sha256').update(readFileSync(resolve(folder, name))).digest('hex')).toBe(hash);
    });
    it.each(cases)('%s %s keeps every original grid/ruler tick and self-contained native labels in PDF and SVG', (locale, paper) => {
        const oldPdf = readFileSync(resolve(folder, `29x29-5mm-${paper}.pdf`)).toString('latin1');
        const pdf = readFileSync(resolve(folder, locale, `29x29-5mm-${paper}.pdf`)).toString('latin1');
        const oldSvg = readFileSync(resolve(folder, `29x29-5mm-${paper}.svg`), 'utf8');
        const svg = readFileSync(resolve(folder, locale, `29x29-5mm-${paper}.svg`), 'utf8');
        expect(pdf.startsWith('%PDF-')).toBe(true);
        expect(pdf.match(/\/MediaBox\s*\[[^\]]+\]/)?.[0]).toBe(oldPdf.match(/\/MediaBox\s*\[[^\]]+\]/)?.[0]);
        expect(pdf.match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
        expect(pdf).toContain('/PrintScaling /None'); expect(pdf).toContain(`/Lang (${locale === 'de' ? 'de-DE' : locale === 'fr' ? 'fr-FR' : 'ja-JP'})`);
        expect(attribute(svg, 'width')).toBe(attribute(oldSvg, 'width'));
        expect(attribute(svg, 'height')).toBe(attribute(oldSvg, 'height'));
        expect(attribute(svg, 'viewBox')).toBe(attribute(oldSvg, 'viewBox'));
        expect(svg).toContain(`xml:lang="${locale}"`);
        expect(lines(svg)).toEqual(lines(oldSvg)); expect(lines(svg)).toHaveLength(84);
        expect(lines(svg).filter(line => line.includes('id="grid-'))).toHaveLength(60);
        for (const axis of ['horizontal', 'vertical']) {
            const ruler = lines(svg).find(line => line.includes(`id="ruler-${axis}-50mm"`))!;
            expect(Math.abs(Number(attribute(ruler, 'x2')) - Number(attribute(ruler, 'x1'))) + Math.abs(Number(attribute(ruler, 'y2')) - Number(attribute(ruler, 'y1')))).toBe(50);
        }
        for (const phrase of phrases[locale]) expect(svg).toContain(phrase);
        expect(svg).not.toContain('<image'); expect(svg).not.toContain('@font-face');
        const glyphIds = new Set([...svg.matchAll(/<path id="([^"]+)"/g)].map(match => match[1]));
        const references = [...svg.matchAll(/<use href="#([^"]+)"/g)].map(match => match[1]);
        expect(references.length).toBeGreaterThan(300);
        expect(references.every(id => glyphIds.has(id))).toBe(true);
    });
});

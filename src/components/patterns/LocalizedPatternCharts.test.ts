import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as catalog from '../../lib/patterns/catalog';
import * as content from '../../lib/patterns/localized-content';
import * as metadataDescriptions from '../../lib/patterns/metadata-descriptions';
import * as englishContent from '../../lib/patterns/content';
import * as presentation from '../../lib/patterns/presentation';
import * as downloads from '../../lib/patterns/localized-download';
import * as ui from '../../lib/patterns/localized-ui';
import * as sources from '../../lib/patterns/localized-sources';
import * as fanArt from '../../lib/patterns/fan-art';
import * as rave from '../../lib/patterns/rave';
import * as multiboard from '../../lib/patterns/multiboard';
import * as topics from '../../lib/patterns/topics';
import * as sectionRoutes from '../../lib/patterns/section-routes';
import * as sectionMessages from '../../lib/patterns/section-messages';
import * as metadata from '../../lib/i18n/metadata';
import * as overview from '../../lib/patterns/library-overview';
import * as hamaMakerRoutes from '../../lib/hama-maker/routes';
import * as colorChartRoutes from '../../lib/color-chart/routes';
import * as beadLetterRoutes from '../../lib/bead-letters/routes';
import * as guideRoutes from '../../lib/guides/routes';
import * as sitePageRoutes from '../../lib/site-pages/routes';
import * as localeRoutes from '../../lib/i18n/routes';
import * as guideData from '../../app/(english)/guides/guide-data';
import * as hama from '../../lib/patterns/hama';
import * as germanHama from '../../lib/patterns/german-hama';
import * as loom from '../../lib/bead-loom/patterns';
import german from '../../lib/patterns/german.json';
import japanese from '../../lib/patterns/japanese.json';
import CoasterInstructions from './CoasterInstructions';
import OrnamentInstructions from './OrnamentInstructions';
import HamaCharacterDownloads, { HamaCharacterLink } from './HamaCharacterDownloads';
import HamaOriginalDownloads, { HamaOriginalLink } from './HamaOriginalDownloads';
import GermanHamaDownloads from './GermanHamaDownloads';
import { getHamaOriginalVariant, hamaBlackCatId } from '../../lib/patterns/hama-original-variants';

// Render the actual page components. Only unrelated navigation, card browsing,
// and the Next image/link wrappers are replaced for the Node environment.
const require = createRequire(import.meta.url);
const defaultModule = (value: unknown) => ({ __esModule: true, default: value });
const empty = defaultModule((): null => null);
const quickDownloads = defaultModule(({ children }: { children: ReactNode }) => createElement('div', null, children));
const patternCatalog = { ...empty, toLocalizedPatternCard: (pattern: catalog.Pattern) => ({ id: pattern.id }) };
const modules: Record<string, unknown> = {
    '@/lib/color-chart/routes': colorChartRoutes,
    '@/lib/bead-letters/routes': beadLetterRoutes,
    './HamaCharacterDownloads': { ...defaultModule(HamaCharacterDownloads), HamaCharacterLink },
    '@/components/patterns/HamaCharacterDownloads': { ...defaultModule(HamaCharacterDownloads), HamaCharacterLink },
    './HamaOriginalDownloads': { ...defaultModule(HamaOriginalDownloads), HamaOriginalLink },
    '@/components/patterns/HamaOriginalDownloads': { ...defaultModule(HamaOriginalDownloads), HamaOriginalLink },
    '@/components/patterns/GermanHamaDownloads': defaultModule(GermanHamaDownloads),
    'next/image': defaultModule(({ src, alt, width, height }: Record<string, unknown>) => createElement('img', { src, alt, width, height })),
    'next/link': defaultModule(({ children, prefetch, ...props }: { children: ReactNode; prefetch?: unknown }) => { void prefetch; return createElement('a', props, children); }),
    '@/components/layout/Breadcrumbs': empty, '@/components/layout/SiteHeader': empty, '@/components/layout/SiteFooter': empty,
    '@/components/patterns/LocalizedPatternCatalog': patternCatalog, './LocalizedPatternCatalog': patternCatalog,
    '@/components/patterns/PatternQuickDownloads': quickDownloads, './PatternQuickDownloads': quickDownloads,
    '@/components/patterns/PatternLibraryHelp': empty, './PatternShare': empty,
    './PatternCards': { PatternGrid: (): null => null }, './CoasterInstructions': defaultModule(CoasterInstructions), './OrnamentInstructions': defaultModule(OrnamentInstructions),
    '@/lib/patterns/catalog': catalog, '@/lib/patterns/localized-content': content, '@/lib/patterns/localized-download': downloads,
    '@/lib/patterns/metadata-descriptions': metadataDescriptions,
    '@/lib/patterns/localized-ui': ui, '@/lib/patterns/localized-sources': sources, '@/lib/patterns/fan-art': fanArt,
    '@/lib/patterns/rave': rave,
    '@/lib/patterns/multiboard': multiboard,
    '@/lib/patterns/topics': topics, '@/lib/patterns/section-routes': sectionRoutes, '@/lib/patterns/section-messages': sectionMessages,
    '@/lib/i18n/metadata': metadata, '@/lib/patterns/library-overview': overview,
    '@/lib/hama-maker/routes': hamaMakerRoutes, '@/lib/guides/routes': guideRoutes, '@/lib/site-pages/routes': sitePageRoutes,
    '@/lib/i18n/routes': localeRoutes, './(english)/guides/guide-data': guideData,
    '@/lib/patterns/hama': hama, '@/lib/patterns/german-hama': germanHama, '@/lib/bead-loom/patterns': loom,
    '@/lib/patterns/content': englishContent, '@/lib/patterns/presentation': presentation,
    '@/components/patterns/PatternCards': { PatternGrid: (): null => null, toPatternCard: (pattern: catalog.Pattern) => ({ id: pattern.id }) },
    '@/components/patterns/PatternTopicPage': empty, '@/components/patterns/PatternShare': empty,
    '@/components/patterns/CoasterInstructions': defaultModule(CoasterInstructions), '@/components/patterns/OrnamentInstructions': defaultModule(OrnamentInstructions),
    '@/lib/patterns/german.json': defaultModule(german), '@/lib/patterns/japanese.json': defaultModule(japanese),
};
function load(file: string) {
    const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const exports: Record<string, unknown> = {};
    new Script(compiled).runInNewContext({ exports, require: (id: string) => modules[id] ?? require(id) });
    return exports;
}
// Load the real component through the same wrapper-aware transpiler; it uses a
// production alias which standalone Vitest does not resolve automatically.
const MultiboardInstructions = load('./MultiboardInstructions.tsx').default;
modules['./MultiboardInstructions'] = defaultModule(MultiboardInstructions);
modules['@/components/patterns/MultiboardInstructions'] = defaultModule(MultiboardInstructions);
const Detail = load('./LocalizedPatternDetail.tsx').default as ComponentType<{ pattern: catalog.Pattern; locale: content.PatternLocale }>;
const GermanLibrary = load('../../app/de/patterns/page.tsx').default as ComponentType;
const JapaneseLibrary = load('./JapanesePatternLibrary.tsx').default as ComponentType;
const englishRoute = load('../../app/(english)/patterns/[...segments]/page.tsx');
type DetailProps = { params: Promise<{ segments: string[] }> };
const EnglishDetail = englishRoute.default as (props: DetailProps) => Promise<ReactNode>;
const englishMetadata = englishRoute.generateMetadata as (props: DetailProps) => Promise<Record<string, unknown>>;
const EnglishHama = load('../../app/(english)/patterns/hama/page.tsx').default as ComponentType;
const GermanHama = load('../../app/de/hama-perlen-vorlagen/page.tsx').default as ComponentType;
const sitemap = load('../../app/sitemap.ts').default as () => Array<{ url: string; lastModified: Date; images?: string[] }>;

describe('native pattern chart journeys', () => {
    it.each(['en', 'de'] as const)('%s Hama hub adds a black cat reference outside the existing six cards', locale => {
        const html = renderToStaticMarkup(createElement(locale === 'en' ? EnglishHama : GermanHama));
        const variant = getHamaOriginalVariant(hamaBlackCatId, locale)!;
        expect(html.match(/<article\b/g)).toHaveLength(6);
        expect(html.match(/<h1\b/g)).toHaveLength(1);
        expect(html).toContain(`href="${variant.detail}"`);
        expect(html).not.toContain(`data-pattern-card="${variant.projectId}"`);
    });
    it.each(['en', 'de', 'fr', 'ja'] as const)('%s keeps the original black cat detail and Perler downloads while adding its fixed Hama section', async locale => {
        const pattern = catalog.getPatternById(hamaBlackCatId)!;
        const props = { params: Promise.resolve({ segments: ['black-cat'] }) };
        const html = renderToStaticMarkup(locale === 'en' ? await EnglishDetail(props) : createElement(Detail, { pattern, locale }));
        const variant = getHamaOriginalVariant(pattern.id, locale)!;
        expect(html.match(/<h1\b/g)).toHaveLength(1);
        expect(html.match(/id="hama-midi"/g)).toHaveLength(1);
        expect(html).toContain('80-19018');
        expect(html).toContain('80-19003');
        const prefix = locale === 'en' ? '' : `/${locale}`;
        for (const href of [pattern.assets.project, pattern.assets.pixels, `${prefix}/editor?pattern=${pattern.id}`, variant.editor, variant.project, variant.pdf, variant.pdfLetter, variant.grid]) {
            expect(html).toContain(`href="${href}"`);
        }
        const perlerPdf = locale === 'en' ? pattern.assets.pdf : downloads.getLocalizedPatternPdf(pattern, locale).href;
        expect(html).toContain(`href="${perlerPdf}"`);
        if (locale === 'en') expect(await englishMetadata(props)).toMatchObject({
            title: 'Black Cat Perler Bead Pattern | Fuse Bead Patterns', description: metadataDescriptions.patternMetadataDescription(pattern),
            alternates: { canonical: '/patterns/black-cat', languages: metadata.patternLanguageAlternates('black-cat') },
        });
    });
    it.each(['en', 'de', 'fr', 'ja'] as const)('%s renders the original strawberry with the correct native chart, materials and complete downloads', async locale => {
        const pattern = catalog.getPatternById('original-strawberry')!;
        const props = { params: Promise.resolve({ segments: ['strawberry'] }) };
        const html = renderToStaticMarkup(locale === 'en' ? await EnglishDetail(props) : createElement(Detail, { pattern, locale }));
        const grid = locale === 'en' ? { href: pattern.assets.grid, width: 788, height: 908 } : downloads.getLocalizedPatternGrid(pattern, locale);
        const chart = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]).find(image => image.includes(`src="${grid.href}"`))!;
        expect(chart).toContain(`width="${grid.width}"`);
        expect(chart).toContain(`height="${grid.height}"`);
        const prefix = locale === 'en' ? '' : `/${locale}`;
        const pdf = locale === 'en' ? pattern.assets.pdf : downloads.getLocalizedPatternPdf(pattern, locale).href;
        const letter = locale === 'en' ? pattern.assets.pdfLetter! : downloads.getLocalizedPatternLetterPdf(pattern, locale)!.href;
        for (const href of [pdf, letter, grid.href, pattern.assets.project, pattern.assets.pixels, `${prefix}/editor?pattern=${pattern.id}`]) expect(html).toContain(`href="${href}"`);
        for (const ref of ['80-19005', '80-19010', '80-19056']) expect(html).toContain(ref);
        expect(html).toContain('296');
        if (locale === 'en') expect(await englishMetadata(props)).toMatchObject({
            title: 'Strawberry Perler Bead Pattern | Fuse Bead Patterns', description: pattern.description,
            alternates: { canonical: '/patterns/strawberry', languages: metadata.patternLanguageAlternates('strawberry') },
        });
    });

    it('adds the four native strawberry sitemap records with the new publication date only', () => {
        const records = sitemap().filter(record => record.url.endsWith('/patterns/strawberry'));
        expect(records.map(record => record.url)).toEqual(['de/', 'fr/', 'ja/', ''].map(prefix => `https://fusebeadpatterns.art/${prefix}patterns/strawberry`));
        for (const record of records) {
            expect(record.lastModified.toISOString()).toBe('2026-10-14T00:00:00.000Z');
            expect(record.images).toEqual(['https://fusebeadpatterns.art/patterns/original-strawberry/preview.png']);
        }
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('%s renders the real four-board detail, global coordinates and correct native downloads', async locale => {
        const pattern = catalog.getPatternById('original-sunset-mountain-lake')!;
        const html = renderToStaticMarkup(locale === 'en'
            ? await EnglishDetail({ params: Promise.resolve({ segments: ['sunset-mountain-lake'] }) })
            : createElement(Detail, { pattern, locale }));
        const copy = multiboard.multiboardCopy[locale];
        expect(html).toContain(copy.board);
        const section = html.match(/<section\b[^>]*aria-labelledby="multiboard-heading"[\s\S]*?<\/section>/)?.[0];
        expect(section).toBeDefined();
        expect(section).toContain('id="multiboard-heading"');
        for (const text of [copy.heading, copy.instruction, copy.printing]) expect(section).toContain(text);
        const body = section!.match(/<tbody>([\s\S]*?)<\/tbody>/)![1];
        const rows = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map(match =>
            [...match[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map(cell => cell[1]));
        expect(rows).toEqual([
            ['1', copy.positions[0], '1–29', '1–29'],
            ['2', copy.positions[1], '30–58', '1–29'],
            ['3', copy.positions[2], '1–29', '30–58'],
            ['4', copy.positions[3], '30–58', '30–58'],
        ]);
        const prefix = locale === 'en' ? '' : `/${locale}`;
        for (const href of [`${prefix}/guides/perler-bead-pegboards`, `${prefix}/guides/how-to-iron-perler-beads`]) {
            expect(section).toContain(`href="${href}"`);
        }
        const grid = locale === 'en' ? { href: pattern.assets.grid, width: 1484, height: 2003 } : downloads.getLocalizedPatternGrid(pattern, locale);
        expect([grid.width, grid.height]).toEqual([1484, 2003]);
        const image = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]).find(image => image.includes(`src="${grid.href}"`))!;
        expect(image).toContain('width="1484"');
        expect(image).toContain('height="2003"');
        const pdf = locale === 'en' ? pattern.assets.pdf : downloads.getLocalizedPatternPdf(pattern, locale).href;
        const letter = locale === 'en' ? pattern.assets.pdfLetter! : downloads.getLocalizedPatternLetterPdf(pattern, locale)!.href;
        for (const href of [pdf, letter, grid.href, pattern.assets.project, pattern.assets.pixels, `${prefix}/editor?pattern=${pattern.id}`]) {
            expect(html).toContain(`href="${href}"`);
        }
        // Actual earlier detail rendering must remain single-board.
        const old = catalog.getPatternById('original-latin-cross')!;
        const oldHtml = renderToStaticMarkup(locale === 'en'
            ? await EnglishDetail({ params: Promise.resolve({ segments: ['cross'] }) })
            : createElement(Detail, { pattern: old, locale }));
        expect(oldHtml).not.toContain('multiboard-heading');
    });

    it.each(['de', 'fr', 'ja'] as const)('%s details show and download the same native chart while retaining PDF, preview and project links', locale => {
        for (const id of ['pokemon-pikachu-gen5', 'original-soccer-ball', 'original-retro-diamond-coaster', 'original-christmas-bauble-ornament', 'original-latin-cross']) {
            const pattern = catalog.getPatternById(id)!;
            const grid = downloads.getLocalizedPatternGrid(pattern, locale);
            const html = renderToStaticMarkup(createElement(Detail, { pattern, locale }));
            const chartImage = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]).find(image => image.includes(`src="${grid.href}"`))!;
            expect(chartImage).toBeDefined();
            expect(chartImage).toContain(`width="${grid.width}"`);
            expect(chartImage).toContain(`height="${grid.height}"`);
            const chartLinks = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]).filter(link => link.includes(`href="${grid.href}"`));
            expect(chartLinks).toHaveLength(2);
            expect(chartLinks.every(link => link.includes(`hrefLang="${locale}"`))).toBe(true);
            expect(chartLinks.some(link => link.includes('download=""') && link.includes('data-pattern-format="grid_png"'))).toBe(true);
            expect(chartLinks.some(link => link.includes('target="_blank"'))).toBe(true);
            expect(html).not.toContain(`href="${pattern.assets.grid}"`);
            expect(html).toContain(`src="${pattern.assets.preview}"`);
            expect(html).toContain(`href="${downloads.getLocalizedPatternPdf(pattern, locale).href}"`);
            expect(html).toContain(`href="${pattern.assets.project}"`);
            expect(html).toContain(`href="${pattern.assets.pixels}"`);
            expect(html).toContain(`href="/${locale}/editor?pattern=${id}"`);
            if (id === 'original-christmas-bauble-ornament') {
                expect(html).toContain('id="ornament-finishing-heading"');
                expect(html).toContain(`href="/${locale}/guides/how-to-iron-perler-beads"`);
                expect(html).toContain(content.localizePatternNote(pattern.notes[1], locale));
                expect(html).toContain(content.localizePatternNote(pattern.notes[3], locale));
            }
        }
    });

    it('renders the actual English Cross detail with one color, accurate chart dimensions and both reviewed paper links', async () => {
        const pattern = catalog.getPatternById('original-latin-cross')!;
        const props = { params: Promise.resolve({ segments: ['cross'] }) };
        const html = renderToStaticMarkup(await EnglishDetail(props));
        expect(html).toContain('>Cross Perler Bead Pattern</h1>');
        expect(html).toContain('1 Perler color</dd>');
        expect(html).not.toContain('1 Perler colors');
        expect(html).toContain('13 × 19 beads');
        expect(html).toContain(pattern.description);
        for (const href of [pattern.assets.pdf, pattern.assets.pdfLetter!, pattern.assets.grid, pattern.assets.project, pattern.assets.pixels, '/editor?pattern=original-latin-cross']) {
            expect(html).toContain(`href="${href}"`);
        }
        const chart = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]).find(image => image.includes(`src="${pattern.assets.grid}"`))!;
        expect(chart).toContain('width="788"');
        expect(chart).toContain('height="908"');
        expect(await englishMetadata(props)).toMatchObject({
            title: 'Cross Perler Bead Pattern | Fuse Bead Patterns', description: pattern.description,
            alternates: { canonical: '/patterns/cross', languages: metadata.patternLanguageAlternates('cross') },
        });
    });

    it('retains the plural color summary for every earlier English detail', async () => {
        for (const pattern of catalog.patterns.filter(pattern => pattern.id !== 'original-latin-cross')) {
            expect(pattern.colorCount).toBeGreaterThan(1);
            const html = renderToStaticMarkup(await EnglishDetail({ params: Promise.resolve({ segments: pattern.slug.split('/') }) }));
            expect(html).toContain(`${pattern.colorCount} Perler colors</dd>`);
        }
    });

    it('retains Cross and four Beadifier guide entries while preserving every earlier complete sitemap record', () => {
        const records = sitemap();
        const added = records.filter(record => record.url.endsWith('/patterns/cross'));
        expect(added.map(record => record.url)).toEqual([
            'https://fusebeadpatterns.art/de/patterns/cross',
            'https://fusebeadpatterns.art/fr/patterns/cross',
            'https://fusebeadpatterns.art/ja/patterns/cross',
            'https://fusebeadpatterns.art/patterns/cross',
        ]);
        for (const record of added) {
            expect(record.lastModified.toISOString()).toBe('2026-10-11T00:00:00.000Z');
            expect(record.images).toEqual(['https://fusebeadpatterns.art/patterns/original-latin-cross/preview.png']);
        }
        const comparisonGuides = records.filter(record => record.url.endsWith('/guides/beadifier-alternative'));
        expect(comparisonGuides.map(record => record.url)).toEqual([
            'https://fusebeadpatterns.art/de/guides/beadifier-alternative',
            'https://fusebeadpatterns.art/fr/guides/beadifier-alternative',
            'https://fusebeadpatterns.art/ja/guides/beadifier-alternative',
            'https://fusebeadpatterns.art/guides/beadifier-alternative',
        ]);
        for (const record of comparisonGuides) expect(record.lastModified.toISOString()).toBe('2026-10-11T00:00:00.000Z');
        const large = records.filter(record => record.url.endsWith('/patterns/sunset-mountain-lake'));
        expect(large.map(record => record.url)).toEqual([
            'https://fusebeadpatterns.art/de/patterns/sunset-mountain-lake',
            'https://fusebeadpatterns.art/fr/patterns/sunset-mountain-lake',
            'https://fusebeadpatterns.art/ja/patterns/sunset-mountain-lake',
            'https://fusebeadpatterns.art/patterns/sunset-mountain-lake',
        ]);
        for (const record of large) {
            expect(record.lastModified.toISOString()).toBe('2026-10-11T00:00:00.000Z');
            expect(record.images).toEqual(['https://fusebeadpatterns.art/patterns/original-sunset-mountain-lake/preview.png']);
        }
        const colorChartUrls = Object.values(colorChartRoutes.perlerColorChartPaths).map(path => `https://fusebeadpatterns.art${path}`);
        const colorCharts = records.filter(record => colorChartUrls.includes(record.url));
        expect(colorCharts.map(record => record.url)).toEqual(colorChartUrls);
        for (const record of colorCharts) expect(record.lastModified.toISOString()).toBe('2026-10-13T00:00:00.000Z');
        const beginnerGuides = records.filter(record => record.url.endsWith('/guides/perler-beads-for-beginners'));
        expect(beginnerGuides.map(record => record.url)).toEqual([
            'https://fusebeadpatterns.art/de/guides/perler-beads-for-beginners',
            'https://fusebeadpatterns.art/fr/guides/perler-beads-for-beginners',
            'https://fusebeadpatterns.art/ja/guides/perler-beads-for-beginners',
            'https://fusebeadpatterns.art/guides/perler-beads-for-beginners',
        ]);
        for (const record of beginnerGuides) expect(record.lastModified.toISOString()).toBe('2026-10-16T00:00:00.000Z');
        const letterUrls = Object.values(beadLetterRoutes.beadLetterPaths).map(path => `https://fusebeadpatterns.art${path}`);
        const letters = records.filter(record => letterUrls.includes(record.url));
        expect(letters.map(record => record.url)).toEqual(letterUrls);
        for (const record of letters) expect(record.lastModified.toISOString()).toBe('2026-10-16T00:00:00.000Z');
        const previous = records.filter(record => !letterUrls.includes(record.url) && !colorChartUrls.includes(record.url) && !record.url.endsWith('/patterns/cross') && !record.url.endsWith('/guides/beadifier-alternative') && !record.url.endsWith('/guides/perler-beads-for-beginners') && !['rave', 'alien-head', 'rainbow-smiley', 'crescent-moon-mushroom', 'sunset-mountain-lake', 'strawberry'].some(slug => record.url.endsWith('/patterns/' + slug)));
        expect(createHash('sha256').update(JSON.stringify(previous)).digest('hex')).toBe('3dd5f87d37aa13fa352020a4ba73f71ac1556ff351497814f223b09d142f53be');
    });

    it.each([
        ['de', GermanLibrary, german.patterns.map(pattern => pattern.id)],
        ['ja', JapaneseLibrary, japanese.groups.flatMap(group => group.patterns.map(pattern => pattern.id))],
    ] as const)('%s quick downloads open and save the same native PNG for every retained selection', (locale, Page, ids) => {
        const html = renderToStaticMarkup(createElement(Page));
        for (const id of ids) {
            const pattern = catalog.getPatternById(id)!;
            const article = html.match(new RegExp(`<article[^>]*data-pattern-card="${id}"[\\s\\S]*?<\\/article>`))![0];
            const grid = downloads.getLocalizedPatternGrid(pattern, locale);
            const links = [...article.matchAll(/<a\b[^>]*>/g)].map(match => match[0]).filter(link => link.includes(`href="${grid.href}"`));
            expect(links).toHaveLength(2);
            expect(links.every(link => link.includes(`hrefLang="${locale}"`))).toBe(true);
            expect(links.some(link => link.includes('target="_blank"'))).toBe(true);
            expect(links.some(link => link.includes('data-pattern-format="grid_png"'))).toBe(true);
            expect(article).not.toContain(`href="${pattern.assets.grid}"`);
            expect(article).toContain(`src="${pattern.assets.preview}"`);
            expect(article).toContain(`href="${downloads.getLocalizedPatternPdf(pattern, locale).href}"`);
        }
    });
});

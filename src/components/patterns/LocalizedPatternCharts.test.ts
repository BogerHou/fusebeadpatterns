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
import * as englishContent from '../../lib/patterns/content';
import * as presentation from '../../lib/patterns/presentation';
import * as downloads from '../../lib/patterns/localized-download';
import * as ui from '../../lib/patterns/localized-ui';
import * as sources from '../../lib/patterns/localized-sources';
import * as fanArt from '../../lib/patterns/fan-art';
import * as topics from '../../lib/patterns/topics';
import * as sectionRoutes from '../../lib/patterns/section-routes';
import * as sectionMessages from '../../lib/patterns/section-messages';
import * as metadata from '../../lib/i18n/metadata';
import * as overview from '../../lib/patterns/library-overview';
import * as hamaMakerRoutes from '../../lib/hama-maker/routes';
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

// Render the actual page components. Only unrelated navigation, card browsing,
// and the Next image/link wrappers are replaced for the Node environment.
const require = createRequire(import.meta.url);
const defaultModule = (value: unknown) => ({ __esModule: true, default: value });
const empty = defaultModule((): null => null);
const quickDownloads = defaultModule(({ children }: { children: ReactNode }) => createElement('div', null, children));
const patternCatalog = { ...empty, toLocalizedPatternCard: (pattern: catalog.Pattern) => ({ id: pattern.id }) };
const modules: Record<string, unknown> = {
    'next/image': defaultModule(({ src, alt, width, height }: Record<string, unknown>) => createElement('img', { src, alt, width, height })),
    'next/link': defaultModule(({ children, prefetch, ...props }: { children: ReactNode; prefetch?: unknown }) => { void prefetch; return createElement('a', props, children); }),
    '@/components/layout/Breadcrumbs': empty, '@/components/layout/SiteHeader': empty, '@/components/layout/SiteFooter': empty,
    '@/components/patterns/LocalizedPatternCatalog': patternCatalog, './LocalizedPatternCatalog': patternCatalog,
    '@/components/patterns/PatternQuickDownloads': quickDownloads, './PatternQuickDownloads': quickDownloads,
    '@/components/patterns/PatternLibraryHelp': empty, './PatternShare': empty,
    './PatternCards': { PatternGrid: (): null => null }, './CoasterInstructions': defaultModule(CoasterInstructions), './OrnamentInstructions': defaultModule(OrnamentInstructions),
    '@/lib/patterns/catalog': catalog, '@/lib/patterns/localized-content': content, '@/lib/patterns/localized-download': downloads,
    '@/lib/patterns/localized-ui': ui, '@/lib/patterns/localized-sources': sources, '@/lib/patterns/fan-art': fanArt,
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
const Detail = load('./LocalizedPatternDetail.tsx').default as ComponentType<{ pattern: catalog.Pattern; locale: content.PatternLocale }>;
const GermanLibrary = load('../../app/de/patterns/page.tsx').default as ComponentType;
const JapaneseLibrary = load('./JapanesePatternLibrary.tsx').default as ComponentType;
const englishRoute = load('../../app/(english)/patterns/[...segments]/page.tsx');
type DetailProps = { params: Promise<{ segments: string[] }> };
const EnglishDetail = englishRoute.default as (props: DetailProps) => Promise<ReactNode>;
const englishMetadata = englishRoute.generateMetadata as (props: DetailProps) => Promise<Record<string, unknown>>;
const sitemap = load('../../app/sitemap.ts').default as () => Array<{ url: string; lastModified: Date; images?: string[] }>;

describe('native pattern chart journeys', () => {
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

    it('adds only four October 11 Cross sitemap records and preserves every earlier complete record', () => {
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
        const previous = records.filter(record => !record.url.endsWith('/patterns/cross'));
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

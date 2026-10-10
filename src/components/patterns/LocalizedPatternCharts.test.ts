import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as catalog from '../../lib/patterns/catalog';
import * as content from '../../lib/patterns/localized-content';
import * as downloads from '../../lib/patterns/localized-download';
import * as ui from '../../lib/patterns/localized-ui';
import * as sources from '../../lib/patterns/localized-sources';
import * as fanArt from '../../lib/patterns/fan-art';
import * as topics from '../../lib/patterns/topics';
import * as sectionRoutes from '../../lib/patterns/section-routes';
import * as sectionMessages from '../../lib/patterns/section-messages';
import * as metadata from '../../lib/i18n/metadata';
import * as overview from '../../lib/patterns/library-overview';
import german from '../../lib/patterns/german.json';
import japanese from '../../lib/patterns/japanese.json';
import CoasterInstructions from './CoasterInstructions';

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
    './PatternCards': { PatternGrid: (): null => null }, './CoasterInstructions': defaultModule(CoasterInstructions),
    '@/lib/patterns/catalog': catalog, '@/lib/patterns/localized-content': content, '@/lib/patterns/localized-download': downloads,
    '@/lib/patterns/localized-ui': ui, '@/lib/patterns/localized-sources': sources, '@/lib/patterns/fan-art': fanArt,
    '@/lib/patterns/topics': topics, '@/lib/patterns/section-routes': sectionRoutes, '@/lib/patterns/section-messages': sectionMessages,
    '@/lib/i18n/metadata': metadata, '@/lib/patterns/library-overview': overview,
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

describe('native pattern chart journeys', () => {
    it.each(['de', 'fr', 'ja'] as const)('%s details show and download the same native chart while retaining PDF, preview and project links', locale => {
        for (const id of ['pokemon-pikachu-gen5', 'original-soccer-ball', 'original-retro-diamond-coaster']) {
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
        }
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

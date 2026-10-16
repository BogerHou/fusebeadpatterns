import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import Breadcrumbs from '../layout/Breadcrumbs';
import * as guides from '../../lib/guides/routes';
import * as localized from '../../lib/patterns/localized-content';
import * as downloads from '../../lib/patterns/localized-download';
import * as presentation from '../../lib/patterns/presentation';
import * as routes from '../../lib/patterns/section-routes';
import * as adult from '../../lib/patterns/adult';
import * as catalog from '../../lib/patterns/catalog';
import * as topics from '../../lib/patterns/topics';
import * as sections from '../../lib/patterns/localized-sections';
import * as englishContent from '../../lib/patterns/content';
import * as languageMetadata from '../../lib/i18n/metadata';
import { getPatternById } from '../../lib/patterns/catalog';
import { getPatternTopicBySlug, getPatternsForTopic, patternTopics } from '../../lib/patterns/topics';
import { getLocalizedPatternSection, localizedSectionMetadata } from '../../lib/patterns/localized-sections';
import { patternLanguageAlternates } from '../../lib/i18n/metadata';
import { getLocaleDestination } from '../../lib/i18n/routes';
import { parseEditorProject } from '../../lib/editor/draft';
import type { SiteLocale } from '../../lib/i18n/locales';

const require = createRequire(import.meta.url);
const defaultModule = (value: unknown) => ({ __esModule: true, default: value });
const modules: Record<string, unknown> = {
    'next/image': defaultModule(({ unoptimized, ...props }: Record<string, unknown>) => createElement('img', { ...props, 'data-unoptimized': String(unoptimized) })),
    'next/link': defaultModule(({ children, prefetch, ...props }: { children: ReactNode; prefetch?: unknown }) => createElement('a', { ...props, 'data-prefetch': String(prefetch) }, children)),
    '@/components/layout/Breadcrumbs': defaultModule(Breadcrumbs),
    '@/lib/guides/routes': guides,
    '@/lib/patterns/localized-content': localized,
    '@/lib/patterns/localized-download': downloads,
    '@/lib/patterns/presentation': presentation,
    '@/lib/patterns/section-routes': routes,
    '@/lib/patterns/adult': adult,
    '@/lib/patterns/catalog': catalog,
    '@/lib/patterns/topics': topics,
    '@/lib/patterns/localized-sections': sections,
    '@/lib/patterns/content': englishContent,
    '@/lib/i18n/metadata': languageMetadata,
    'next/navigation': { notFound: () => { throw new Error('Not found'); } },
    './PatternSectionNav': defaultModule((): null => null),
};
// Only unrelated components/branches are replaced. The adult component and
// existing topic/section/catchall dispatch functions execute their real code.
function load(file: string) {
    const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const exports: Record<string, unknown> = {};
    new Script(compiled).runInNewContext({ exports, require: (id: string) => modules[id] ?? (id.startsWith('@/components/') || id.startsWith('./') ? defaultModule((): null => null) : id.startsWith('@/lib/') ? {} : require(id)) });
    return exports;
}
const Content = load('./AdultPatternContent.tsx').default as ComponentType<{ locale: SiteLocale }>;
modules['./AdultPatternContent'] = defaultModule(Content);
modules['@/components/patterns/PatternTopicPage'] = { __esModule: true, ...load('./PatternTopicPage.tsx') };
modules['@/components/patterns/LocalizedPatternSection'] = { __esModule: true, ...load('./LocalizedPatternSection.tsx') };
type Route = {
    default: (props: { params: Promise<{ segments: string[] }> }) => Promise<ReactNode>;
    generateMetadata: (props: { params: Promise<{ segments: string[] }> }) => Promise<import('next').Metadata>;
    generateStaticParams: () => Array<{ segments: string[] }>;
};
const pageRoutes = Object.fromEntries((['en', 'de', 'fr', 'ja'] as const).map(locale => [locale, load(`../../app/${locale === 'en' ? '(english)' : locale}/patterns/[...segments]/page.tsx`) as unknown as Route])) as Record<SiteLocale, Route>;

describe('adult pattern purpose selection', () => {
    it('selects six originals by distinct use and preserves the old topic records', () => {
        const topic = getPatternTopicBySlug('adult')!;
        const selected = getPatternsForTopic(topic);
        expect(selected.map(pattern => pattern.id)).toEqual(adult.adultPatternIds);
        expect(new Set(adult.adultPatternIds).size).toBe(6);
        expect(adult.getAdultPatternGroups().map(group => [group.id, group.patterns.length])).toEqual([['display', 2], ['geometry', 1], ['festival', 3]]);
        for (const pattern of selected) {
            expect(pattern.source).toBeNull();
            expect(pattern.collectionId).toBeNull();
            expect(pattern.gridWidth % 29).toBe(0);
            expect(pattern.gridHeight % 29).toBe(0);
        }
        expect(selected.map(adult.getAdultBoardCount)).toEqual([4, 4, 1, 1, 1, 1]);
        // This digest is the unchanged published topic array, excluding only the new topic.
        expect(createHash('sha256').update(JSON.stringify(patternTopics.filter(topic => topic.slug !== 'adult'))).digest('hex')).toBe('72ea02d9d72341e94528128dd23ff150dfa562b1e0bc8672e72164e917afea06');
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('%s server content offers exact live facts and same-language downloads for every selection', locale => {
        const copy = adult.adultPatternCopy[locale];
        const prefix = locale === 'en' ? '' : `/${locale}`;
        const html = renderToStaticMarkup(createElement(Content, { locale }));
        expect(html.match(/<h1\b/g)).toHaveLength(1);
        expect(html).toContain(`>${copy.title}</h1>`);
        expect(html.match(/data-pattern-card=/g)).toHaveLength(6);
        expect(html.indexOf('id="adult-display-heading"')).toBeLessThan(html.indexOf('id="adult-choose-heading"'));
        expect(html.indexOf('data-pattern-card=')).toBeLessThan(html.indexOf('id="adult-choose-heading"'));
        expect(html).not.toContain('aria-label="Pattern topics"');
        expect(html.match(/data-unoptimized="true"/g)).toHaveLength(6);
        expect(html).not.toContain('/_next/image');
        expect(html).not.toContain('data-prefetch="undefined"');
        expect(html).not.toMatch(/keyword|search volume|KD18|O04|260 searches|SEO/i);
        for (const group of adult.getAdultPatternGroups()) {
            expect(html).toContain(`id="adult-${group.id}-heading"`);
            expect(html).toContain(copy.groups[group.id].title);
            for (const pattern of group.patterns) {
                const article = html.match(new RegExp(`<article[^>]*data-pattern-card="${pattern.id}"[\\s\\S]*?<\\/article>`))![0];
                for (const pair of [[copy.motif, `${pattern.motifWidth} × ${pattern.motifHeight}`], [copy.grid, `${pattern.gridWidth} × ${pattern.gridHeight}`], [copy.beads, String(pattern.beads)], [copy.colors, String(pattern.colorCount)]]) {
                    expect(article).toContain(`<dt class="text-muted">${pair[0]}</dt><dd class="font-medium">${pair[1]}</dd>`);
                }
                const pdf = locale === 'en' ? pattern.assets.pdf : downloads.getLocalizedPatternPdf(pattern, locale).href;
                const letter = locale === 'en' ? pattern.assets.pdfLetter! : downloads.getLocalizedPatternLetterPdf(pattern, locale)!.href;
                const grid = locale === 'en' ? pattern.assets.grid : downloads.getLocalizedPatternGrid(pattern, locale).href;
                for (const path of [pdf, letter, grid, pattern.assets.project]) {
                    expect(article).toContain(`href="${path}" download=""`);
                    expect(existsSync(`${process.cwd()}/public${path}`), path).toBe(true);
                }
                expect(article).toContain(`href="${prefix}/patterns/${pattern.slug}"`);
                expect(article).toContain(`href="${prefix}/editor?pattern=${pattern.id}"`);
                const draft = parseEditorProject(readFileSync(`${process.cwd()}/public${pattern.assets.project}`, 'utf8'))!;
                const data = Buffer.from(draft.editedPattern!.data, 'base64');
                let occupied = 0;
                for (let offset = 3; offset < data.length; offset += 4) if (data[offset]) occupied++;
                expect(occupied).toBe(pattern.beads);
                expect([draft.editedPattern!.width, draft.editedPattern!.height]).toEqual([pattern.gridWidth, pattern.gridHeight]);
                expect(draft.selectedPaletteIds).toEqual(['perler']);
                expect(draft.boardWidth * draft.boardHeight).toBe(adult.getAdultBoardCount(pattern));
            }
        }
        const collection = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
        expect(collection.inLanguage).toBe(locale);
        expect(collection.mainEntity.numberOfItems).toBe(6);
        expect(collection.mainEntity.itemListElement.map((item: { url: string }) => item.url)).toEqual(adult.adultPatternIds.map(id => `https://fusebeadpatterns.art${prefix}/patterns/${getPatternById(id)!.slug}`));
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('%s has one equivalent canonical and a concise native snippet', locale => {
        const copy = adult.adultPatternCopy[locale];
        expect(Array.from(copy.description).length).toBeLessThanOrEqual(160);
        const path = routes.getPatternSectionHref('adult', locale);
        for (const target of ['en', 'de', 'fr', 'ja'] as const) expect(getLocaleDestination(path, target)).toEqual({ href: routes.getPatternSectionHref('adult', target), isFallback: false });
        if (locale !== 'en') {
            const section = getLocalizedPatternSection('adult', locale)!;
            const metadata = localizedSectionMetadata(section, locale);
            expect(metadata.title).toBe(`${copy.title} | Fuse Bead Patterns`);
            expect(metadata.description).toBe(copy.description);
            expect(metadata.alternates?.canonical).toBe(path);
            expect(metadata.alternates?.languages).toEqual(patternLanguageAlternates('adult'));
            expect(metadata.keywords).toBeUndefined();
        }
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('%s existing catchall generates and renders the adult purpose page with native metadata', async locale => {
        const route = pageRoutes[locale];
        expect(route.generateStaticParams().filter(item => item.segments.join('/') === 'adult')).toHaveLength(1);
        const props = { params: Promise.resolve({ segments: ['adult'] }) };
        const metadata = await route.generateMetadata(props);
        expect(metadata.title).toBe(`${adult.adultPatternCopy[locale].title} | Fuse Bead Patterns`);
        expect(metadata.description).toBe(adult.adultPatternCopy[locale].description);
        expect(metadata.alternates?.canonical).toBe(routes.getPatternSectionHref('adult', locale));
        expect(metadata.alternates?.languages).toEqual(patternLanguageAlternates('adult'));
        expect(metadata.keywords).toBeUndefined();
        const html = renderToStaticMarkup(await route.default(props));
        expect(html.match(/<h1\b/g)).toHaveLength(1);
        expect(html.match(/data-pattern-card=/g)).toHaveLength(6);
        for (const group of adult.adultPatternGroups) expect(html).toContain(`id="adult-${group.id}-heading"`);
    });
});

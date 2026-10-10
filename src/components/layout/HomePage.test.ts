import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as home from '../../lib/i18n/home';
import * as patternsCopy from '../../lib/i18n/home-patterns';
import * as catalog from '../../lib/patterns/catalog';
import * as localizedPatterns from '../../lib/patterns/localized-content';
import * as presentation from '../../lib/patterns/presentation';
import * as guides from '../../lib/guides/localized';
import * as guideData from '../../app/(english)/guides/guide-data';
import * as routes from '../../lib/i18n/routes';
import * as metadata from '../../lib/i18n/metadata';
import type { SiteLocale } from '../../lib/i18n/locales';
import type { HomePageProps } from './HomePage';

// Render the actual home, preview, featured cards and route components.
// Editor and site chrome are tested independently; these stand-ins inspect locale props.
const require = createRequire(import.meta.url);
const modules: Record<string, unknown> = {
    '@/lib/i18n/home': home, '@/lib/i18n/home-patterns': patternsCopy,
    '@/lib/i18n/routes': routes, '@/lib/i18n/metadata': metadata,
    '@/lib/patterns/catalog': catalog, '@/lib/patterns/localized-content': localizedPatterns,
    '@/lib/patterns/presentation': presentation, '@/lib/guides/localized': guides,
    '@/app/(english)/guides/guide-data': guideData, './guides/guide-data': guideData,
    '@/app/home.css': {}, './PatternStudy.module.css': { __esModule: true, default: { study: 'study', controls: 'controls' } },
    '@/components/editor/Editor': { __esModule: true, default: ({ locale = 'en' }: { locale?: SiteLocale }) => createElement('div', { 'data-editor-locale': locale }) },
    './SiteHeader': { __esModule: true, default: (): null => null },
    './SiteFooter': { __esModule: true, default: (): null => null },
};
function load(file: string) {
    const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const exports: Record<string, unknown> = {};
    new Script(compiled).runInNewContext({ exports, require: (id: string) => modules[id] ?? require(id) });
    return exports;
}
modules['./PatternCards'] = load('../patterns/PatternCards.tsx');
modules['../patterns/FeaturedPatterns'] = load('../patterns/FeaturedPatterns.tsx');
modules['../patterns/PatternStudy'] = load('../patterns/PatternStudy.tsx');
const homeModule = load('./HomePage.tsx');
modules['@/components/layout/HomePage'] = modules['./HomePage'] = homeModule;
modules['@/components/layout/LocalizedGeneratorPage'] = load('./LocalizedGeneratorPage.tsx');
const HomePage = homeModule.default as ComponentType<HomePageProps>;
const EnglishHome = load('../../app/(english)/page.tsx').default as ComponentType;
const JapaneseHome = load('../../app/ja/page.tsx').default as ComponentType;
const render = (locale: SiteLocale) => locale === 'en'
    ? renderToStaticMarkup(createElement(EnglishHome))
    : renderToStaticMarkup(createElement(HomePage, { locale, structuredData: { '@type': 'WebApplication', inLanguage: locale } }));
const main = (html: string) => html.match(/<main\b[\s\S]*?<\/main>/)![0];
const faqSchema = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(match => JSON.parse(match[1])).find(schema => schema['@type'] === 'FAQPage');

describe('complete home experience in every site language', () => {
    it.each(['en', 'de', 'fr', 'ja'] as const)('%s has every main module, four real designs and eight native guides', locale => {
        const html = main(render(locale));
        const sections = [...html.matchAll(/<section\b([^>]*)>/g)].map(match => match[1]);
        const required = ['home-title', 'featured-patterns-title', 'generator', 'how-it-works', 'project-ideas', 'learn-heading', 'features-heading', 'faq-heading'];
        expect(sections.filter(section => !section.includes('print-help-title'))).toHaveLength(8);
        let previous = -1;
        for (const id of required) {
            const index = sections.findIndex(section => section.includes(`"${id}"`));
            expect(index).toBeGreaterThan(previous); previous = index;
        }
        expect(html.match(/<h1\b/g)).toHaveLength(1);
        expect(html.match(/class="process-step"/g)).toHaveLength(3);
        expect(html.match(/class="idea-item"/g)).toHaveLength(6);
        expect(html.match(/class="feature-item"/g)).toHaveLength(5);
        expect(html.match(/<details\b/g)).toHaveLength(5);
        expect(html).toContain(`data-editor-locale="${locale}"`);
        expect(html).toContain('id="ready-patterns"');
        expect(html).toContain('src="/studio/blue-chicken-beads.svg"');
        for (const id of patternsCopy.homeFeaturedPatternIds) {
            const pattern = catalog.getPatternById(id)!;
            expect(html).toContain(`data-pattern-card="${id}"`);
            expect(html).toContain(`href="${routes.localeRoutes[locale].patterns}/${pattern.slug}"`);
            expect(html).toContain(`src="${pattern.assets.preview}"`);
        }
        const summaries = locale === 'en' ? guideData.guidePages.map(guide => ({ ...guide, href: `/guides/${guide.slug}` })) : guides.getGuideSummaries(locale);
        expect(summaries).toHaveLength(8);
        for (const guide of summaries) {
            expect(html).toContain(`href="${guide.href}"`);
            expect(html).toContain(guide.title.replace(/&/g, '&amp;'));
        }
    });

    it.each(['de', 'fr', 'ja'] as const)('%s keeps onward page journeys and every preview label in its own language', locale => {
        const html = main(render(locale));
        const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1]);
        for (const href of hrefs) expect(href === '#generator' || href.startsWith(`/${locale}/`)).toBe(true);
        for (const phrase of ['From pixel to pegboard', 'Pattern preview style', 'Free Printable Perler Bead Patterns', 'Game Sprite Patterns', 'Bead Color Choices', 'Frequently Asked Questions']) expect(html).not.toContain(phrase);
        expect(html).toContain(patternsCopy.homePatternCopy[locale].studyBeadAlt);
        expect(html).toContain(patternsCopy.homePatternCopy[locale].studyLink);
        for (const patternId of patternsCopy.homeFeaturedPatternIds) expect(html).toContain(localizedPatterns.getLocalizedPatternName(catalog.getPatternById(patternId)!, locale));
        expect(html).toContain('id="print-help"');
        if (locale === 'de') expect(html).toContain('href="/de/hama-perlen-vorlagen"');
        if (locale === 'fr') expect(html).toContain('href="/fr/modeles-perles-a-repasser"');
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('%s visible FAQ answers match its structured data', locale => {
        const html = render(locale), schema = faqSchema(html);
        expect(schema.mainEntity).toHaveLength(5);
        for (const item of schema.mainEntity) {
            expect(main(html)).toContain(item.name);
            expect(main(html)).toContain(item.acceptedAnswer.text);
        }
    });

    it('retains the supplied Japanese WebApplication rather than silently substituting a generic schema', () => {
        const html = renderToStaticMarkup(createElement(JapaneseHome));
        const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
        expect(schemas[0]).toMatchObject({ '@type': 'WebApplication', name: home.localizedHomeCopy.ja.title, description: home.localizedHomeCopy.ja.description, operatingSystem: 'Any modern web browser', inLanguage: 'ja' });
        expect(schemas[0].featureList).toEqual(['画像から図案を作成', 'ミディ用プレートの枚数とブランドを選択', 'マスの修正と取り消し', '日本語PDFと図案PNGを保存', 'プロジェクトの保存と再開']);
        expect(schemas[1]['@type']).toBe('FAQPage');
    });

    it('keeps English heading emphasis, workflow wording, structured-data types and all existing guide destinations', () => {
        const html = render('en');
        expect(html).toContain('<h1 id="home-title">Free Perler Bead <span>Pattern Generator</span></h1>');
        expect(html).toContain('a printable <strong>perler bead pattern</strong>');
        expect(html).toContain('as <strong>perler bead art</strong> before you export.');
        expect(html).toContain('Download your <strong>perler bead template</strong>');
        const schemas = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
        expect(schemas.map((schema: Record<string, string>) => schema['@type'])).toEqual(['WebApplication', 'FAQPage', 'HowTo']);
        expect(schemas[0].name).toBe('Free Perler Bead Pattern Generator');
        expect(schemas[0].url).toBe('https://fusebeadpatterns.art');
    });
});

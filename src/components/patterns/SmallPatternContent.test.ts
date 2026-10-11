import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import Breadcrumbs from '../layout/Breadcrumbs';
import * as guides from '../../lib/guides/routes';
import * as localized from '../../lib/patterns/localized-content';
import * as presentation from '../../lib/patterns/presentation';
import * as routes from '../../lib/patterns/section-routes';
import * as small from '../../lib/patterns/small';
import type { SiteLocale } from '../../lib/i18n/locales';

// Render the page content with its real data, replacing only Next wrappers and
// the shared section navigation, which has its own route-continuity coverage.
const require = createRequire(import.meta.url);
const defaultModule = (value: unknown) => ({ __esModule: true, default: value });
const modules: Record<string, unknown> = {
    'next/image': defaultModule(({ src, alt, width, height }: Record<string, unknown>) => createElement('img', { src, alt, width, height })),
    'next/link': defaultModule(({ children, prefetch, ...props }: { children: ReactNode; prefetch?: unknown }) => { void prefetch; return createElement('a', props, children); }),
    '@/components/layout/Breadcrumbs': defaultModule(Breadcrumbs),
    '@/lib/guides/routes': guides,
    '@/lib/patterns/localized-content': localized,
    '@/lib/patterns/presentation': presentation,
    '@/lib/patterns/section-routes': routes,
    '@/lib/patterns/small': small,
    './PatternSectionNav': defaultModule((): null => null),
};
const compiled = ts.transpileModule(readFileSync(new URL('./SmallPatternContent.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const exports: Record<string, unknown> = {};
new Script(compiled).runInNewContext({ exports, require: (id: string) => modules[id] ?? require(id) });
const Content = exports.default as ComponentType<{ locale: SiteLocale }>;

describe('small pattern comparison pages', () => {
    it.each(['en', 'de', 'fr', 'ja'] as const)('shows ten visible fact cards with same-language details and fine-connection notes in %s', locale => {
        const copy = small.smallPatternCopy[locale];
        const prefix = locale === 'en' ? '' : `/${locale}`;
        const html = renderToStaticMarkup(createElement(Content, { locale }));
        expect(html).toContain(`<h1 class="page-heading pt-4 sm:pt-8">${copy.title}</h1>`);
        expect(html.match(/data-pattern-card=/g)).toHaveLength(10);
        expect(html).toContain(copy.miniNote);
        for (const group of small.getSmallPatternGroups()) {
            expect(html).toContain(`id="small-${group.id}-heading"`);
            expect(html).toContain(copy.groups[group.id]);
            for (const pattern of group.patterns) {
                const article = html.match(new RegExp(`<article[^>]*data-pattern-card="${pattern.id}"[\\s\\S]*?<\\/article>`))![0];
                expect(article).toContain(`src="${pattern.assets.preview}"`);
                expect(article).toContain(`href="${prefix}/patterns/${pattern.slug}"`);
                expect(article).toContain(`${pattern.motifWidth} × ${pattern.motifHeight} ${copy.cells}`);
                expect(article).toContain(`<dd class="font-medium">${pattern.beads}</dd>`);
                expect(article).toContain(`<dd class="font-medium">${pattern.colorCount}</dd>`);
                expect(article.includes(copy.delicate)).toBe(small.hasSmallPatternFineConnections(pattern));
                expect(article).not.toMatch(/\.pdf|\.bead-pattern\.json|Letter/);
            }
        }
        for (const path of ['/guides/mini-perler-beads', '/guides/perler-bead-pegboards', '/patterns/easy', '/patterns/cute']) {
            expect(html).toContain(`href="${prefix}${path}"`);
        }
        const collection = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
        expect(collection.inLanguage).toBe(locale);
        expect(collection.mainEntity.numberOfItems).toBe(10);
        expect(collection.mainEntity.itemListElement.every((item: { url: string }) => item.url.startsWith(`https://fusebeadpatterns.art${prefix}/patterns/`))).toBe(true);
    });
});

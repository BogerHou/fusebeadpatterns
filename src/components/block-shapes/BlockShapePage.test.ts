import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { createElement, type AnchorHTMLAttributes, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { beforeEach, describe, expect, it } from 'vitest';
import * as copyModule from '../../lib/block-shapes/copy';
import * as shapeRoutes from '../../lib/block-shapes/routes';
import * as metadataModule from '../../lib/block-shapes/metadata';
import * as siteRoutes from '../../lib/i18n/routes';
import { SITE_LOCALES, type SiteLocale } from '../../lib/i18n/locales';
import type { Metadata } from 'next';

const require = createRequire(import.meta.url);
const workspaceLocales: SiteLocale[] = [];

// Render the actual server component, route exports and Breadcrumbs. The site
// chrome and workspace stubs inspect props, not browser behavior or downloads.
const modules: Record<string, unknown> = {
    '@/lib/block-shapes/copy': copyModule,
    '@/lib/block-shapes/routes': shapeRoutes,
    '@/lib/block-shapes/metadata': metadataModule,
    '@/lib/i18n/routes': siteRoutes,
    'next/link': {
        __esModule: true,
        default: ({ prefetch, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) =>
            createElement('a', { ...props, 'data-prefetch': String(prefetch) }, children),
    },
    '@/components/layout/SiteHeader': {
        __esModule: true,
        default: ({ locale }: { locale: SiteLocale }) => createElement('header', { 'data-header-locale': locale }),
    },
    '@/components/layout/SiteFooter': {
        __esModule: true,
        default: ({ locale, active }: { locale: SiteLocale; active?: string }) =>
            createElement('footer', { 'data-footer-locale': locale, 'data-footer-active': active }),
    },
    './BlockShapeWorkspace': {
        __esModule: true,
        default: ({ locale }: { locale: SiteLocale }) => {
            workspaceLocales.push(locale);
            return createElement('section', { 'data-workspace-locale': locale });
        },
    },
};

function load(file: string): Record<string, unknown> {
    const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const exports: Record<string, unknown> = {};
    new Script(compiled).runInNewContext({ exports, require: (id: string) => modules[id] ?? require(id) });
    return exports;
}

modules['@/components/layout/Breadcrumbs'] = load('../layout/Breadcrumbs.tsx');
const pageModule = load('./BlockShapePage.tsx');
modules['@/components/block-shapes/BlockShapePage'] = pageModule;
const ServerPage = pageModule.default as ComponentType<{ locale: SiteLocale }>;
const cases = [
    { locale: 'en', file: '../../app/(english)/minecraft-circle-generator/page.tsx', path: '/minecraft-circle-generator', home: '/', heading: 'Minecraft circle generator', introStart: 'Plan circles and ellipses' },
    { locale: 'de', file: '../../app/de/minecraft-kreis-generator/page.tsx', path: '/de/minecraft-kreis-generator', home: '/de', heading: 'Minecraft-Kreis-Generator', introStart: 'Plane Kreise und Ellipsen' },
    { locale: 'fr', file: '../../app/fr/generateur-cercle-minecraft/page.tsx', path: '/fr/generateur-cercle-minecraft', home: '/fr', heading: 'Générateur de cercle Minecraft', introStart: 'Préparez des cercles et des ellipses' },
    { locale: 'ja', file: '../../app/ja/minecraft-circle-generator/page.tsx', path: '/ja/minecraft-circle-generator', home: '/ja', heading: 'マイクラの円生成ツール', introStart: '方眼で円や楕円を設計し' },
] as const;
const routeModules = Object.fromEntries(cases.map(item => [item.locale, load(item.file)])) as Record<SiteLocale, Record<string, unknown>>;
const siteUrl = 'https://fusebeadpatterns.art';
const expectedLanguages = { ...Object.fromEntries(cases.map(item => [item.locale, siteUrl + item.path])), 'x-default': siteUrl + '/minecraft-circle-generator' };
const escape = (text: string) => renderToStaticMarkup(createElement('span', null, text)).slice(6, -7);
const placeholders = (text: string) => [...text.matchAll(/\{([a-zA-Z]+)\}/g)].map(match => match[1]).sort();

beforeEach(() => { workspaceLocales.length = 0; });

describe('block shape server pages and equivalent language routes', () => {
    it.each(cases)('$locale renders the full local page through its actual route', item => {
        const Route = routeModules[item.locale].default as ComponentType;
        const html = renderToStaticMarkup(createElement(Route));
        const direct = renderToStaticMarkup(createElement(ServerPage, { locale: item.locale }));
        const copy = copyModule.blockShapeCopy[item.locale];
        expect(html).toBe(direct);
        expect(html.match(/<h1\b/g)).toHaveLength(1);
        expect(html).toContain('<h1 class="page-heading">' + escape(item.heading) + '</h1>');
        expect(copy.intro.startsWith(item.introStart)).toBe(true);
        for (const text of [copy.intro, copy.howTitle, copy.notesTitle, ...copy.steps, ...copy.notes]) {
            expect(html).toContain(escape(text));
        }
        expect(html.match(/<li>/g)).toHaveLength(copy.steps.length + copy.notes.length);
        expect(html).toContain('data-header-locale="' + item.locale + '"');
        expect(html).toContain('data-footer-locale="' + item.locale + '"');
        expect(html).toContain('data-footer-active="block-shapes"');
        expect(workspaceLocales).toEqual([item.locale, item.locale]);
        if (item.locale !== 'en') {
            for (const text of [...copyModule.blockShapeCopy.en.steps, ...copyModule.blockShapeCopy.en.notes]) expect(html).not.toContain(escape(text));
        }
    });

    it.each(cases)('$locale publishes its own breadcrumb and reciprocal canonical/language metadata', item => {
        const Route = routeModules[item.locale].default as ComponentType;
        const html = renderToStaticMarkup(createElement(Route));
        const copy = copyModule.blockShapeCopy[item.locale];
        const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
        expect(schemas).toEqual([{
            '@context': 'https://schema.org', '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: copy.home, item: siteUrl + item.home },
                { '@type': 'ListItem', position: 2, name: item.heading, item: siteUrl + item.path },
            ],
        }]);
        expect(html).toContain('href="' + item.home + '"');
        expect(html).toContain('data-prefetch="false"');
        const meta = routeModules[item.locale].metadata as Metadata;
        expect(meta).toMatchObject({
            title: copy.title, description: copy.description,
            alternates: { canonical: item.path, languages: expectedLanguages },
            openGraph: { title: copy.title, description: copy.description, url: siteUrl + item.path, type: 'website', images: [] },
            twitter: { card: 'summary', title: copy.title, description: copy.description, images: [] },
        });
        expect(meta).not.toHaveProperty('keywords');
        expect(copy.description.length).toBeLessThanOrEqual(160);
        expect(Object.keys(meta.alternates!.languages!)).toHaveLength(5);
        expect(siteRoutes.localeRoutes[item.locale].blockShapes).toBe(item.path);
        for (const from of cases) {
            expect(siteRoutes.getLocaleDestination(from.path, item.locale)).toEqual({ href: item.path, isFallback: false });
        }
    });

    it('keeps every UI and export label translated with the same substitution contract', () => {
        const english = copyModule.blockShapeCopy.en;
        for (const locale of SITE_LOCALES) {
            const copy = copyModule.blockShapeCopy[locale];
            expect(Object.keys(copy).sort()).toEqual(Object.keys(english).sort());
            for (const key of Object.keys(english) as Array<keyof typeof english>) {
                const original = english[key], translated = copy[key];
                if (typeof original === 'string') {
                    expect(typeof translated).toBe('string');
                    expect((translated as string).trim().length).toBeGreaterThan(0);
                    expect(placeholders(translated as string)).toEqual(placeholders(original));
                } else {
                    expect(Array.isArray(translated)).toBe(true);
                    expect(translated).toHaveLength(original.length);
                }
            }
        }
    });
});

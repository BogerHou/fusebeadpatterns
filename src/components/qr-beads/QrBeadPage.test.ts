import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { createElement, type AnchorHTMLAttributes, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import * as copyModule from '../../lib/qr-beads/copy';
import * as dataModule from '../../lib/bead-letters/data';
import * as qrRoutes from '../../lib/qr-beads/routes';
import * as metadataModule from '../../lib/qr-beads/metadata';
import * as siteRoutes from '../../lib/i18n/routes';
import { SITE_LOCALES, type SiteLocale } from '../../lib/i18n/locales';
import type { Metadata } from 'next';

const require = createRequire(import.meta.url);
const modules: Record<string, unknown> = {
    '@/lib/qr-beads/copy': copyModule,
    '@/lib/bead-letters/data': dataModule,
    '@/lib/qr-beads/routes': qrRoutes,
    '@/lib/qr-beads/metadata': metadataModule,
    '@/lib/i18n/routes': siteRoutes,
    'next/link': { __esModule: true,
        default: ({ prefetch, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) =>
            createElement('a', { ...props, 'data-prefetch': String(prefetch) }, children) },
    '@/components/layout/SiteHeader': { __esModule: true,
        default: ({ locale }: { locale: SiteLocale }) => createElement('header', { 'data-locale': locale }) },
    '@/components/layout/SiteFooter': { __esModule: true,
        default: ({ locale, active }: { locale: SiteLocale; active: string }) => createElement('footer', { 'data-locale': locale, 'data-active': active }) },
    './QrWorkspace': { __esModule: true,
        default: ({ locale, palettes }: { locale: SiteLocale; palettes: unknown[] }) =>
            createElement('section', { 'data-workspace-locale': locale, 'data-palettes': palettes.length }) },
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
modules['@/components/qr-beads/QrBeadPage'] = load('./QrBeadPage.tsx');
const files: Record<SiteLocale, string> = {
    en: '../../app/(english)/qr-code-bead-pattern-maker/page.tsx',
    de: '../../app/de/buegelperlen-qr-code/page.tsx',
    fr: '../../app/fr/qr-code-perles-a-repasser/page.tsx',
    ja: '../../app/ja/iron-beads-qr-code/page.tsx',
};
const escape = (s: string) => renderToStaticMarkup(createElement('span', null, s)).slice(6, -7);

describe('complete localized QR entry pages', () => {
    it.each(SITE_LOCALES)('%s keeps native text, breadcrumbs and tool props together', locale => {
        const route = load(files[locale]), copy = copyModule.qrBeadCopy[locale];
        const html = renderToStaticMarkup(createElement(route.default as ComponentType));
        expect(html.match(/<h1\b/g)).toHaveLength(1);
        expect(html).toContain(escape(copy.heading));
        expect(html).toContain(escape(copy.intro));
        expect(html).toContain('data-workspace-locale="' + locale + '"');
        expect(html).toContain('data-palettes="3"');
        expect(html).toContain('data-active="qr-beads"');
        for (const text of [...copy.steps, ...copy.notes]) expect(html).toContain(escape(text));
        const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
        expect(schemas).toEqual([
            {
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: copy.heading,
                description: copy.description,
                url: 'https://fusebeadpatterns.art' + qrRoutes.qrBeadPaths[locale],
                inLanguage: locale,
                applicationCategory: 'DesignApplication',
                operatingSystem: 'All',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
            {
                '@context': 'https://schema.org', '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: copy.home, item: 'https://fusebeadpatterns.art' + siteRoutes.localeRoutes[locale].home },
                    { '@type': 'ListItem', position: 2, name: copy.heading, item: 'https://fusebeadpatterns.art' + qrRoutes.qrBeadPaths[locale] },
                ],
            },
        ]);
        expect(html).toContain('href="' + siteRoutes.localeRoutes[locale].home + '#generator"');
        if (locale !== 'en') {
            expect(copy.heading).not.toBe(copyModule.qrBeadCopy.en.heading);
            expect(copy.steps).not.toEqual(copyModule.qrBeadCopy.en.steps);
        }
    });
    it.each(SITE_LOCALES)('%s has natural short metadata and exact equivalent language links', locale => {
        const meta = load(files[locale]).metadata as Metadata, copy = copyModule.qrBeadCopy[locale];
        expect(meta).toMatchObject({
            title: copy.title, description: copy.description,
            alternates: { canonical: qrRoutes.qrBeadPaths[locale], languages: qrRoutes.qrBeadAlternates },
        });
        expect(copy.description.length).toBeGreaterThan(25);
        expect(copy.description.length).toBeLessThanOrEqual(160);
        expect(meta).not.toHaveProperty('keywords');
        expect(Object.keys(meta.alternates!.languages!)).toHaveLength(5);
        for (const to of SITE_LOCALES) expect(siteRoutes.getLocaleDestination(qrRoutes.qrBeadPaths[locale], to))
            .toEqual({ href: qrRoutes.qrBeadPaths[to], isFallback: false });
    });
});

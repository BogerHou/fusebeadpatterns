import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { createElement, type AnchorHTMLAttributes, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { beforeEach, describe, expect, it } from 'vitest';
import * as copyModule from '../../lib/bead-letters/copy';
import * as dataModule from '../../lib/bead-letters/data';
import * as letterRoutes from '../../lib/bead-letters/routes';
import * as metadataModule from '../../lib/bead-letters/metadata';
import * as coreModule from '../../lib/bead-letters/core';
import * as projectModule from '../../lib/bead-letters/project';
import * as navigationModule from '../../lib/bead-letters/locale-navigation';
import * as brandColorsModule from '../../lib/bead-letters/brand-colors';
import * as downloadModule from '../../lib/core/printer/download';
import * as siteRoutes from '../../lib/i18n/routes';
import type { LetterPalette } from '../../lib/bead-letters/types';
import type { SiteLocale } from '../../lib/i18n/locales';
import type { Metadata } from 'next';
import * as analytics from '../../lib/analytics';

type WorkspaceProps = { locale: SiteLocale; palettes: LetterPalette[] };
const workspaceCalls: WorkspaceProps[] = [];
const require = createRequire(import.meta.url);

// Render real server pages, route exports and Breadcrumbs. Site chrome and the
// workspace stand-ins below inspect their props; they do not exercise browser UI.
const modules: Record<string, unknown> = {
    '@/lib/analytics': analytics,
    '@/lib/bead-letters/copy': copyModule,
    '@/lib/bead-letters/data': dataModule,
    '@/lib/bead-letters/routes': letterRoutes,
    '@/lib/bead-letters/metadata': metadataModule,
    '@/lib/bead-letters/core': coreModule,
    '@/lib/bead-letters/project': projectModule,
    '@/lib/bead-letters/locale-navigation': navigationModule,
    '@/lib/bead-letters/brand-colors': brandColorsModule,
    '@/lib/core/printer/download': downloadModule,
    '@/lib/i18n/routes': siteRoutes,
    './LetterWorkspace.module.css': { __esModule: true, default: {} },
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
    './LetterWorkspace': {
        __esModule: true,
        default: (props: WorkspaceProps) => {
            workspaceCalls.push(props);
            return createElement('section', { 'data-workspace-locale': props.locale });
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
const pageModule = load('./BeadLetterPage.tsx');
modules['@/components/bead-letters/BeadLetterPage'] = pageModule;
const ServerPage = pageModule.default as ComponentType<{ locale: SiteLocale }>;
const ActualWorkspace = load('./LetterWorkspace.tsx').default as ComponentType<WorkspaceProps>;

const cases = [
    { locale: 'en', file: '../../app/(english)/bead-letter-generator/page.tsx', path: '/bead-letter-generator', home: '/', heading: 'Bead letter generator', introStart: 'Turn supported letters', handoff: ['Save a project first.', 'load that file'] },
    { locale: 'de', file: '../../app/de/buegelperlen-buchstaben/page.tsx', path: '/de/buegelperlen-buchstaben', home: '/de', heading: 'Bügelperlen-Buchstaben erstellen', introStart: 'Erstelle aus unterstützten', handoff: ['Speichere zuerst ein Projekt.', 'lade die Datei'] },
    { locale: 'fr', file: '../../app/fr/lettres-perles-a-repasser/page.tsx', path: '/fr/lettres-perles-a-repasser', home: '/fr', heading: 'Créer des lettres en perles à repasser', introStart: 'Transformez les lettres', handoff: ['Enregistrez d’abord un projet.', 'chargez ce fichier'] },
    { locale: 'ja', file: '../../app/ja/iron-beads-alphabet/page.tsx', path: '/ja/iron-beads-alphabet', home: '/ja', heading: 'アイロンビーズの文字図案メーカー', introStart: '対応する英字', handoff: ['先にプロジェクトを保存', 'そのファイルを読み込む'] },
] as const;
const routeModules = Object.fromEntries(cases.map(item => [item.locale, load(item.file)])) as Record<SiteLocale, Record<string, unknown>>;
const siteUrl = 'https://fusebeadpatterns.art';
const expectedLanguages = { ...Object.fromEntries(cases.map(item => [item.locale, siteUrl + item.path])), 'x-default': siteUrl + '/bead-letter-generator' };
const escape = (text: string) => renderToStaticMarkup(createElement('span', null, text)).slice(6, -7);
const main = (html: string) => html.match(/<main\b[\s\S]*?<\/main>/)![0];
function section(html: string, id: string): string {
    return html.match(new RegExp('<section[^>]*aria-labelledby="' + id + '"[^>]*>[\\s\\S]*?<\\/section>'))![0];
}
function schemas(html: string): Array<Record<string, unknown>> {
    return [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
}

beforeEach(() => { workspaceCalls.length = 0; });

describe('bead letter server pages and locale routes', () => {
    it.each(cases)('$locale renders the complete local content through the actual route', item => {
        const Route = routeModules[item.locale].default as ComponentType;
        const html = renderToStaticMarkup(createElement(Route));
        const direct = renderToStaticMarkup(createElement(ServerPage, { locale: item.locale }));
        const copy = copyModule.beadLetterCopy[item.locale];
        expect(html).toBe(direct);
        expect(main(html).match(/<h1\b/g)).toHaveLength(1);
        expect(html).toContain('<h1 class="page-heading">' + escape(item.heading) + '</h1>');
        expect(copy.intro.startsWith(item.introStart)).toBe(true);
        expect(main(html)).toContain(escape(copy.intro));
        expect(html).toContain('data-header-locale="' + item.locale + '"');
        expect(html).toContain('data-footer-locale="' + item.locale + '"');
        expect(html).toContain('data-footer-active="bead-letters"');
        expect(workspaceCalls).toHaveLength(2);
        for (const props of workspaceCalls) {
            expect(props.locale).toBe(item.locale);
            expect(props.palettes).toEqual(dataModule.getLetterPalettes());
        }

        const how = section(html, 'bead-letters-how');
        const notes = section(html, 'bead-letters-notes');
        expect(how).toContain(escape(copy.howTitle));
        expect(notes).toContain(escape(copy.notesTitle));
        expect(how.match(/<li>/g)).toHaveLength(copy.steps.length);
        expect(notes.match(/<li>/g)).toHaveLength(copy.notes.length);
        for (const step of copy.steps) expect(how).toContain('<li>' + escape(step) + '</li>');
        for (const note of copy.notes) expect(notes).toContain('<li>' + escape(note) + '</li>');
        if (item.locale !== 'en') {
            expect(copy.heading).not.toBe(copyModule.beadLetterCopy.en.heading);
            for (const text of [...copyModule.beadLetterCopy.en.steps, ...copyModule.beadLetterCopy.en.notes]) {
                expect(main(html)).not.toContain(escape(text));
            }
        }
    });

    it.each(cases)('$locale exposes the right home and current-page breadcrumb, WebApplication schema, and generator link', item => {
        const Route = routeModules[item.locale].default as ComponentType;
        const html = renderToStaticMarkup(createElement(Route));
        const copy = copyModule.beadLetterCopy[item.locale];
        expect(schemas(html)).toEqual([
            {
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: copy.heading,
                description: copy.description,
                url: siteUrl + item.path,
                inLanguage: item.locale,
                applicationCategory: 'DesignApplication',
                operatingSystem: 'All',
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: copy.home, item: siteUrl + item.home },
                    { '@type': 'ListItem', position: 2, name: item.heading, item: siteUrl + item.path },
                ],
            },
        ]);
        expect(html).toContain('href="' + item.home + '"');
        expect(html).toContain('href="' + item.home + '#generator"');
        expect(html).toContain('data-prefetch="false"');
        expect(html).toContain('aria-current="page">' + escape(item.heading));
    });

    it.each(cases)('$locale route exports native metadata and five equivalent language destinations', item => {
        const meta = routeModules[item.locale].metadata as Metadata;
        const copy = copyModule.beadLetterCopy[item.locale];
        expect(meta).toMatchObject({
            title: copy.title,
            description: copy.description,
            alternates: { canonical: item.path, languages: expectedLanguages },
            openGraph: {
                title: copy.title,
                description: copy.description,
                url: siteUrl + item.path,
                siteName: 'Fuse Bead Patterns',
                type: 'website',
                images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: copy.title }],
            },
            twitter: { card: 'summary_large_image', title: copy.title, description: copy.description, images: ['/opengraph-image.png'] },
        });
        expect(Object.keys(meta.alternates!.languages!)).toHaveLength(5);
        expect(meta).not.toHaveProperty('keywords');
        expect(copy.description.length).toBeLessThanOrEqual(item.locale === 'ja' ? 160 : 150);
        if (item.locale !== 'en') {
            expect(meta.title).not.toBe(copyModule.beadLetterCopy.en.title);
            expect(meta.description).not.toBe(copyModule.beadLetterCopy.en.description);
        }
    });

    it('passes plain snapshots of all colors from the three existing brand CSV files', () => {
        const palettes = dataModule.getLetterPalettes();
        expect(palettes.map(palette => palette.id)).toEqual(['perler', 'hama', 'artkal_s']);
        for (const fixture of [
            { id: 'perler', label: 'Perler Midi', boardSize: 29, file: 'perler.csv', prefix: 'P', count: 103 },
            { id: 'hama', label: 'Hama Midi', boardSize: 29, file: 'hama.csv', prefix: 'H', count: 92 },
            { id: 'artkal_s', label: 'Artkal S (5 mm)', boardSize: 50, file: 'artkal_s.csv', prefix: 'AS', count: 199 },
        ]) {
            const palette = palettes.find(candidate => candidate.id === fixture.id)!;
            const expectedColors = readFileSync(new URL('../../../public/palettes/' + fixture.file, import.meta.url), 'utf8').trim().split(/\r?\n/).map(line => {
                const [ref, name, symbol, r, g, b] = line.split(',');
                return { ref, name, symbol, prefix: fixture.prefix, r: Number(r), g: Number(g), b: Number(b) };
            });
            expect(palette).toMatchObject({ id: fixture.id, label: fixture.label, boardSize: fixture.boardSize });
            expect(palette.colors).toHaveLength(fixture.count);
            expect(palette.colors).toEqual(expectedColors);
            expect(JSON.parse(JSON.stringify(palette))).toEqual(palette);
            expect(Object.getPrototypeOf(palette)).toBe(Object.prototype);
            for (const color of palette.colors) expect(Object.getPrototypeOf(color)).toBe(Object.prototype);
        }
    });
});

describe('bead letter editor handoff wording in actual workspace server output', () => {
    // This is static React rendering only: no effects, canvas, downloads, input,
    // language switching or user interaction are executed by this test.
    it.each(cases)('$locale explains saving a project before opening the editor', item => {
        const copy = copyModule.beadLetterCopy[item.locale];
        const html = renderToStaticMarkup(createElement(ActualWorkspace, { locale: item.locale, palettes: dataModule.getLetterPalettes() }));
        expect(html).toContain(escape(copy.editorHelp));
        for (const phrase of item.handoff) expect(copy.editorHelp).toContain(phrase);
        expect(html).toContain('href="' + siteRoutes.localeRoutes[item.locale].editor + '"');
        expect(html).toContain('>' + escape(copy.editorLink) + '</a>');
    });
});

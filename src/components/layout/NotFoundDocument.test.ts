import { readFileSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Script } from 'node:vm';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { notFoundCopy } from '../../lib/i18n/not-found';
import { getLocaleDestination, localeRoutes } from '../../lib/i18n/routes';
import { siteNavigation } from '../../lib/i18n/locales';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
afterEach(() => vi.unstubAllGlobals());

// Render the actual 404, header, footer and language switcher. Only Next routing,
// image/link wrappers and (in client-mode checks) the external-store hook are fixtures.
function renderer({ client = false, routerPathname = '/_not-found' } = {}) {
    const cache = new Map<string, Record<string, unknown>>();
    const effects: Array<() => void> = [];
    function load(file: string): Record<string, unknown> {
        const resolved = ['', '.ts', '.tsx', '.json'].map(ext => file + ext).find(candidate => existsSync(candidate) && statSync(candidate).isFile());
        if (!resolved) throw new Error(`Missing fixture module: ${file}`);
        if (resolved.endsWith('.json')) return JSON.parse(readFileSync(resolved, 'utf8'));
        if (cache.has(resolved)) return cache.get(resolved)!;
        const exports: Record<string, unknown> = {};
        cache.set(resolved, exports);
        const code = ts.transpileModule(readFileSync(resolved, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
        }).outputText;
        new Script(code).runInNewContext({ exports, URL, window: globalThis.window, document: globalThis.document, MutationObserver: globalThis.MutationObserver, require: (id: string) => {
            if (id === 'react') return client ? {
                ...React,
                useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) => snapshot(),
                useEffect: (effect: () => void) => effects.push(effect),
            } : React;
            if (id === 'next/navigation') return { usePathname: () => routerPathname };
            if (id === 'next/link') return { __esModule: true, default: ({ children, prefetch, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => {
                void prefetch;
                return React.createElement('a', props, children);
            } };
            if (id === 'next/image') return { __esModule: true, default: ({ src, alt, width, height }: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement('img', { src, alt, width, height }) };
            if (id === '@/lib/site-fonts') return { inter: { variable: 'font-inter' }, manrope: { variable: 'font-manrope' } };
            if (id.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_target, name) => String(name) }) };
            if (id.startsWith('@/')) return load(path.join(root, id.slice(2)));
            if (id.startsWith('.')) return load(path.resolve(path.dirname(resolved), id));
            return require(id);
        } });
        return exports;
    }
    return { load, effects };
}

function browserLocation(pathname: string) {
    const location = { pathname, search: '', hash: '' };
    const boundary = { isConnected: true };
    vi.stubGlobal('window', { location });
    vi.stubGlobal('document', { title: 'Page not found | Fuse Bead Patterns', documentElement: {}, querySelector: () => boundary });
    vi.stubGlobal('MutationObserver', class {
        observe() {}
        disconnect() {}
    });
    return location;
}

describe('complete global 404 document', () => {
    it('keeps complete English initial HTML for every unmatched request and never claims SSR localization', () => {
        browserLocation('/ja/deep/missing');
        const { load } = renderer({ routerPathname: '/ja/deep/missing' });
        const Component = load(path.join(root, 'app/global-not-found.tsx')).default as React.ComponentType;
        const html = renderToStaticMarkup(React.createElement(Component));
        expect(html).toContain('<html lang="en"');
        expect(html).toContain('<h1 class="page-heading">Page not found</h1>');
        expect(html).toContain('href="/patterns" class="button-primary"');
        expect(html).toContain('<header'); expect(html).toContain('<footer');
        expect(html).not.toContain('__next_error__');
        expect(html).not.toContain('ページが見つかりません');
        const metadata = load(path.join(root, 'app/global-not-found.tsx')).metadata as { robots: unknown; alternates?: unknown; title: string };
        expect(metadata.robots).toEqual({ index: false, follow: true });
        expect(metadata.alternates).toBeUndefined();
        expect(metadata.title).toBe('Page not found | Fuse Bead Patterns');
    });

    it.each(['en', 'de', 'fr', 'ja'] as const)('%s browser snapshot changes document language, native chrome, title and both recovery links together', locale => {
        const location = browserLocation(`${locale === 'en' ? '' : `/${locale}`}/deep/missing`);
        const { load, effects } = renderer({ client: true });
        const Component = load(path.join(root, 'components/layout/NotFoundDocument.tsx')).default as React.ComponentType<{ className: string }>;
        const html = renderToStaticMarkup(React.createElement(Component, { className: 'font-inter font-manrope' }));
        const copy = notFoundCopy[locale], routes = localeRoutes[locale], nav = siteNavigation[locale];
        const main = html.match(/<main\b[\s\S]*?<\/main>/)![0];
        expect(html).toContain(`<html lang="${locale}"`);
        expect(main).toContain(copy.title);
        expect(main).toContain(`href="${routes.patterns}" class="button-primary"`);
        expect(main).toContain(`href="${routes.home}" class="button-secondary"`);
        expect(html).toContain(`aria-label="${nav.main}"`);
        expect(html).toContain(`href="${routes.editor}"`);
        expect(html).toContain(`href="${routes.guides}"`);
        expect(html).toContain(`href="${routes.about}"`);
        expect(html).toContain(`href="${routes.privacy}"`);
        expect(html).toContain(`href="${routes.terms}"`);
        const menuLinks = [...html.matchAll(/<a\b[^>]*data-locale-navigation="true"[^>]*>[\s\S]*?<\/a>/g)].map(([link]) => link);
        expect(menuLinks).toHaveLength(8);
        for (const targetLocale of ['en', 'de', 'fr', 'ja'] as const) {
            const target = getLocaleDestination(location.pathname, targetLocale);
            const links = menuLinks.filter(link => link.includes(`hrefLang="${targetLocale}"`));
            expect(links).toHaveLength(2);
            for (const link of links) {
                expect(link).toContain(`href="${target.href}"`);
                expect(link.includes(nav.fallback)).toBe(target.isFallback);
                expect(link).not.toContain('href="/_not-found"');
            }
        }
        expect(html.match(/<h1\b/g)).toHaveLength(1);
        effects[0]();
        expect(document.title).toBe(`${copy.title} | Fuse Bead Patterns`);
    });

    it('uses the current URL after repeated path changes rather than retaining a previous locale', () => {
        const location = browserLocation('/de/missing');
        const { load } = renderer({ client: true, routerPathname: '/ja/stale-router-path' });
        const Component = load(path.join(root, 'components/layout/NotFoundDocument.tsx')).default as React.ComponentType<{ className: string }>;
        for (const [pathname, locale] of [['/de/missing', 'de'], ['/fr/deep/missing', 'fr'], ['/fr/another/missing', 'fr'], ['/ja/missing', 'ja'], ['/dead/missing', 'en']] as const) {
            location.pathname = pathname;
            const html = renderToStaticMarkup(React.createElement(Component, { className: '' }));
            expect(html).toContain(`<html lang="${locale}"`);
            expect(html).toContain(notFoundCopy[locale].title);
            const target = getLocaleDestination(pathname, locale);
            const links = [...html.matchAll(/<a\b[^>]*data-locale-navigation="true"[^>]*>[\s\S]*?<\/a>/g)].map(([link]) => link);
            for (const link of links.filter(link => link.includes(`hrefLang="${locale}"`))) expect(link).toContain(`href="${target.href}"`);
        }
    });
});

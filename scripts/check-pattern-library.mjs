#!/usr/bin/env node
// Local production-build checks for the additive pattern-library rollout.
// node scripts/check-pattern-library.mjs --baseline artifacts/pattern-library-integration/before.json
// Optional: --project-dir DIR --build-dir DIR --catalog FILE
import { promises as fs, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import vm from 'node:vm';

const compact = (text) => text.replace(/\s+/g, ' ').trim();
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

function options(args) {
    const allowed = new Set(['--baseline', '--project-dir', '--build-dir', '--catalog']);
    const values = new Map();
    if (args.length % 2) throw new Error('Options require values. Usage: check-pattern-library.mjs --baseline FILE [--project-dir DIR] [--build-dir DIR] [--catalog FILE]');
    for (let index = 0; index < args.length; index += 2) {
        if (!allowed.has(args[index]) || values.has(args[index])) throw new Error(`Unknown or duplicate option: ${args[index]}`);
        values.set(args[index], args[index + 1]);
    }
    const projectDir = path.resolve(values.get('--project-dir') || process.cwd());
    return {
        projectDir,
        buildDir: path.resolve(values.get('--build-dir') || path.join(projectDir, '.next')),
        baselineFile: path.resolve(values.get('--baseline') || path.join(projectDir, 'artifacts/pattern-library-integration/before.json')),
        catalogFile: path.resolve(values.get('--catalog') || path.join(projectDir, 'src/lib/patterns/catalog.ts')),
    };
}

function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function schemaNodes(blocks) {
    return blocks.flatMap((block) => Array.isArray(block)
        ? schemaNodes(block)
        : block?.['@graph'] ? schemaNodes(block['@graph']) : [canonical(block)]);
}

async function filesBelow(directory) {
    const files = [];
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await filesBelow(file));
        else if (entry.isFile()) files.push(file);
    }
    return files.sort();
}

function loadCatalog(file, require) {
    if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
    // The catalog is local, static project data. Transpile it without editing
    // source files or requiring a TS runner / new project dependency.
    const ts = require('typescript');
    const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
        fileName: file,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const catalogModule = { exports: {} };
    const execute = vm.runInThisContext(`(function(require, module, exports) {\n${compiled}\n})`, { filename: file });
    execute(createRequire(file), catalogModule, catalogModule.exports);
    return catalogModule.exports;
}

function parsePage(html, parse) {
    const document = parse(html);
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]')
        .map((node) => JSON.parse(node.rawText));
    const metadata = document.querySelectorAll('meta').map((node) => canonical(node.attributes));
    const canonicalLinks = document.querySelectorAll('link[rel="canonical"]').map((node) => node.getAttribute('href'));
    const titles = document.querySelectorAll('title').map((node) => compact(node.text));
    for (const node of document.querySelectorAll('script, style, template')) node.remove();
    const body = document.querySelector('body');
    if (!body) throw new Error('A generated HTML file has no body');
    return {
        document,
        title: titles[0] || '',
        titles,
        language: document.querySelector('html')?.getAttribute('lang') || '',
        metadata,
        canonicalLinks,
        jsonLd: schemaNodes(jsonLd),
        bodyText: compact(body.structuredText),
        headings: body.querySelectorAll('h1, h2, h3, h4, h5, h6').map((node) => ({ tag: node.rawTagName.toLowerCase(), text: compact(node.text) })),
        links: body.querySelectorAll('a').map((node) => ({ href: node.getAttribute('href') || '', text: compact(node.text), rel: node.getAttribute('rel') || '' })),
        images: body.querySelectorAll('img').map((node) => ({ src: node.getAttribute('src') || '', alt: node.getAttribute('alt') || '' })),
    };
}

function publicCopy(route, page) {
    if (route === '/editor') return ''; // noindex client workbench, not public editorial copy
    let text = page.bodyText;
    const h1 = page.headings.find((heading) => heading.tag === 'h1')?.text;
    if (h1 && text.includes(h1)) text = text.slice(text.indexOf(h1));
    if (route === '/') {
        const toolStart = text.indexOf('Pattern Preview');
        const editorialStart = text.indexOf('How The Generator Works');
        if (toolStart >= 0 && editorialStart > toolStart) text = text.slice(0, toolStart) + text.slice(editorialStart);
    }
    return text;
}

function firstMissingToken(before, after) {
    // Additions are allowed, including new links between existing blocks.
    // Keep every original word and punctuation mark in its original order.
    const tokenize = (text) => text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
    const expected = tokenize(before);
    const actual = tokenize(after);
    let cursor = 0;
    for (let index = 0; index < expected.length; index++) {
        while (cursor < actual.length && actual[cursor] !== expected[index]) cursor++;
        if (cursor === actual.length) return expected.slice(Math.max(0, index - 6), index + 7).join(' ');
        cursor++;
    }
    return null;
}

function localPath(href, origin) {
    if (!href || /^(mailto:|tel:|data:|blob:|javascript:)/i.test(href)) return null;
    try {
        const url = new URL(href, origin);
        return url.origin === origin ? decodeURIComponent(url.pathname) : null;
    } catch { return null; }
}

function sitemapUrls(text, parse) {
    return parse(text).querySelectorAll('url > loc').map((node) => compact(node.text));
}

async function main() {
    const config = options(process.argv.slice(2));
    const require = createRequire(path.join(config.projectDir, 'package.json'));
    const { parse } = require('next/dist/compiled/node-html-parser');
    const baseline = await readJson(config.baselineFile);
    if (baseline.version !== 1 || !baseline.data?.pages) throw new Error('Expected a version 1 check-public-pages.mjs snapshot');
    const { patterns, patternCollections } = loadCatalog(config.catalogFile, require);
    if (!Array.isArray(patterns) || !Array.isArray(patternCollections)) throw new Error('Catalog must export patterns and patternCollections arrays');
    const errors = [];
    const check = (condition, message) => { if (!condition) errors.push(message); };
    // Rollout floor: a missing catalog entry must not silently shrink the check.
    check(patterns.length >= 14, 'Catalog contains fewer than the 14 approved initial patterns');
    check(patternCollections.length >= 2, 'Catalog contains fewer than the 2 approved initial collections');
    const detailRoutes = patterns.map((pattern) => `/patterns/${pattern.slug}`);
    const collectionRoutes = patternCollections.map((collection) => `/patterns/${collection.slug}`);
    const newRoutes = ['/patterns', ...collectionRoutes, ...detailRoutes];
    check(new Set(newRoutes).size === newRoutes.length, 'Catalog contains duplicate pattern or collection routes');
    const appDir = path.join(config.buildDir, 'server/app');
    const pages = new Map();
    for (const file of (await filesBelow(appDir)).filter((file) => file.endsWith('.html'))) {
        const name = path.relative(appDir, file).split(path.sep).join('/').slice(0, -5);
        const route = name === 'index' ? '/' : `/${name}`;
        try { pages.set(route, parsePage(await fs.readFile(file, 'utf8'), parse)); }
        catch (error) { errors.push(`${route}: ${error.message}`); }
    }
    const origin = new URL(baseline.data.pages['/'].metadataLinks.find((link) => link.rel === 'canonical').href).origin;
    const prerender = await readJson(path.join(config.buildDir, 'prerender-manifest.json'));
    const routes = await readJson(path.join(config.buildDir, 'routes-manifest.json'));
    const oldPages = Object.entries(baseline.data.pages).filter(([route]) => !route.startsWith('/_'));
    const robots = (metadata) => metadata.filter((meta) => /^(robots|googlebot)$/i.test(meta.name || ''));
    for (const [route, oldPage] of oldPages) {
        const page = pages.get(route);
        check(Boolean(page), `${route}: existing prerendered page disappeared`);
        check(prerender.routes[route] && (prerender.routes[route].initialStatus || 200) === 200, `${route}: existing static 200 route disappeared`);
        if (!page) continue;
        check(page.titles.length === 1 && page.title === oldPage.title, `${route}: existing title changed`);
        check(page.language === oldPage.language, `${route}: document language changed`);
        check(isDeepStrictEqual(page.canonicalLinks, oldPage.metadataLinks.filter((link) => link.rel === 'canonical').map((link) => link.href)), `${route}: existing canonical changed`);
        check(isDeepStrictEqual(robots(page.metadata), robots(oldPage.metadata)), `${route}: robots indexing directive changed`);
        for (const meta of oldPage.metadata) check(page.metadata.some((candidate) => isDeepStrictEqual(candidate, meta)), `${route}: existing metadata changed: ${meta.name || meta.property || 'charset'}`);
        check(isDeepStrictEqual(page.headings.filter((heading) => heading.tag === 'h1'), oldPage.headings.filter((heading) => heading.tag === 'h1')), `${route}: existing H1 changed`);
        for (const heading of oldPage.headings) check(page.headings.some((candidate) => isDeepStrictEqual(candidate, heading)), `${route}: existing heading disappeared: ${heading.text}`);
        for (const schema of schemaNodes(oldPage.jsonLd)) check(page.jsonLd.some((candidate) => isDeepStrictEqual(candidate, schema)), `${route}: existing JSON-LD entity changed: ${schema['@type']}`);
        const missing = firstMissingToken(publicCopy(route, oldPage), publicCopy(route, page));
        check(!missing, `${route}: existing public copy was removed or reordered near: ${missing}`);
        for (const href of new Set(oldPage.links.map((link) => link.href).filter((href) => localPath(href, origin)))) {
            check(page.links.some((link) => link.href === href && !/\bnofollow\b/i.test(link.rel)), `${route}: existing crawlable internal link disappeared: ${href}`);
        }
    }
    for (const key of ['basePath', 'caseSensitive', 'pages404', 'redirects', 'rewrites', 'headers']) {
        check(isDeepStrictEqual(canonical(routes[key]), baseline.data.routing[key]), `Existing routing/security configuration changed: ${key}`);
    }
    const titles = new Map();
    const h1s = new Map();
    for (const [route, page] of pages) {
        if (route.startsWith('/_')) continue;
        for (const [value, seen, label] of [[page.title, titles, 'title'], [page.headings.find((heading) => heading.tag === 'h1')?.text, h1s, 'H1']]) {
            if (!value) continue;
            const key = value.toLowerCase();
            check(!seen.has(key), `${route}: duplicate ${label} with ${seen.get(key)}`);
            seen.set(key, route);
        }
    }
    const publicDir = path.join(config.projectDir, 'public');
    const checkedAssets = new Set();
    async function checkAsset(href, context) {
        const local = localPath(href, origin);
        if (!local) return;
        const asset = path.resolve(publicDir, `.${local}`);
        check(asset.startsWith(publicDir + path.sep), `${context}: asset escapes public directory`);
        if (!asset.startsWith(publicDir + path.sep) || checkedAssets.has(asset)) return;
        checkedAssets.add(asset);
        const stat = await fs.stat(asset).catch(() => null);
        check(stat?.isFile() && stat.size > 0, `${context}: public asset missing or empty: ${local}`);
    }
    for (const pattern of patterns) {
        for (const [kind, href] of Object.entries(pattern.assets || {})) {
            check(Boolean(localPath(href, origin)), `${pattern.slug}: ${kind} asset must use a local public URL`);
            await checkAsset(href, `${pattern.slug} (${kind})`);
        }
    }
    for (const route of newRoutes) {
        const page = pages.get(route);
        check(Boolean(page), `${route}: catalog page missing from local build`);
        check(prerender.routes[route] && (prerender.routes[route].initialStatus || 200) === 200, `${route}: must be prerendered as a static 200 page`);
        if (!page) continue;
        check(page.titles.length === 1 && Boolean(page.title), `${route}: must have one nonempty title`);
        check(page.headings.filter((heading) => heading.tag === 'h1').length === 1 && Boolean(page.headings.find((heading) => heading.tag === 'h1')?.text), `${route}: must have one nonempty H1`);
        check(isDeepStrictEqual(page.canonicalLinks, [`${origin}${route}`]), `${route}: canonical must point to its own clean URL`);
        check(page.metadata.some((meta) => meta.name === 'description' && compact(meta.content || '')), `${route}: description is missing`);
        check(!robots(page.metadata).some((meta) => /\b(noindex|nofollow|none)\b/i.test(meta.content)), `${route}: new public page blocks indexing or link crawling`);
        const breadcrumb = page.jsonLd.find((node) => node['@type'] === 'BreadcrumbList');
        const items = breadcrumb?.itemListElement;
        check(Array.isArray(items) && items.length >= 2, `${route}: BreadcrumbList JSON-LD is missing`);
        if (Array.isArray(items)) {
            check(items[0]?.item === `${origin}/`, `${route}: breadcrumb must start at Home`);
            check(items.at(-1)?.item === `${origin}${route}`, `${route}: breadcrumb must end at its canonical URL`);
            check(items.every((item, index) => item.position === index + 1 && item.name), `${route}: breadcrumb labels/positions are invalid`);
        }
        const breadcrumbNav = page.document.querySelector('nav[aria-label="Breadcrumb"]');
        check(Boolean(breadcrumbNav?.querySelector('a[href="/"]')), `${route}: visible linked breadcrumb is missing`);
        check(page.images.length > 0, `${route}: no crawlable preview image`);
        for (const image of page.images) {
            check(Boolean(compact(image.alt)), `${route}: image is missing descriptive alt text: ${image.src}`);
            const url = new URL(image.src, origin);
            await checkAsset(url.pathname === '/_next/image' ? url.searchParams.get('url') || '' : image.src, route);
        }
        for (const link of page.links) {
            const target = localPath(link.href, origin);
            if (!target) continue;
            if (/\.[a-z\d]+$/i.test(target)) await checkAsset(link.href, route);
            else check(pages.has(target.replace(/\/$/, '') || '/'), `${route}: internal link targets a missing built page: ${link.href}`);
        }
    }
    const index = pages.get('/patterns');
    for (const route of [...collectionRoutes, ...detailRoutes]) {
        check(index?.links.some((link) => localPath(link.href, origin) === route && compact(link.text) && !/\bnofollow\b/i.test(link.rel)), `/patterns: missing crawlable text link to ${route}`);
    }
    for (const route of collectionRoutes) {
        for (const detail of detailRoutes.filter((detail) => detail.startsWith(`${route}/`))) {
            check(pages.get(route)?.links.some((link) => localPath(link.href, origin) === detail && compact(link.text) && !/\bnofollow\b/i.test(link.rel)), `${route}: missing crawlable collection detail link to ${detail}`);
        }
    }
    const editorRobots = robots(pages.get('/editor')?.metadata || []).map((meta) => meta.content).join(',');
    check(/\bnoindex\b/.test(editorRobots), '/editor: must retain noindex');
    const sitemap = sitemapUrls(await fs.readFile(path.join(appDir, 'sitemap.xml.body'), 'utf8'), parse);
    const oldSitemap = sitemapUrls(baseline.data.generatedFiles['/sitemap.xml'].text, parse);
    check(sitemap.length > 0 && new Set(sitemap).size === sitemap.length, 'Sitemap is empty or contains duplicate URLs');
    for (const url of [...oldSitemap, ...newRoutes.map((route) => `${origin}${route}`)]) check(sitemap.includes(url), `Sitemap is missing canonical URL: ${url}`);
    for (const url of sitemap) {
        const parsed = new URL(url);
        const page = pages.get(parsed.pathname.replace(/\/$/, '') || '/');
        check(parsed.origin === origin && !parsed.search && !parsed.hash, `Sitemap URL is not a clean local canonical: ${url}`);
        check(Boolean(page) && !robots(page.metadata).some((meta) => /\b(noindex|none)\b/i.test(meta.content)), `Sitemap includes a missing or noindex page: ${url}`);
    }
    const currentRobots = await fs.readFile(path.join(appDir, 'robots.txt.body'), 'utf8');
    check(currentRobots === baseline.data.generatedFiles['/robots.txt'].text, 'robots.txt changed');
    if (errors.length) {
        console.error(`FAIL: ${errors.length} pattern-library / SEO checks failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
        process.exitCode = 1;
        return;
    }
    console.log(`PASS: ${oldPages.length} existing public pages retain their SEO, public copy and internal link targets.`);
    console.log(`PASS: ${newRoutes.length} new pages (${patterns.length} patterns, ${patternCollections.length} collections, one index) have static HTML, unique titles/H1s, self canonicals, breadcrumbs and crawlable links.`);
    console.log(`PASS: ${checkedAssets.size} public assets exist; sitemap preserves ${oldSitemap.length} original URLs and includes all new canonical URLs; editor remains noindex.`);
    console.log('Local build evidence only; approved additions are allowed and search rankings are not predicted.');
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});

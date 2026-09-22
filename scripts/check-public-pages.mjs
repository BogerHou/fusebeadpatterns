#!/usr/bin/env node
// Local build regression guard; never contacts or modifies the deployed site.
// Before changes: node scripts/check-public-pages.mjs snapshot --snapshot /tmp/public-pages.json
// After building: node scripts/check-public-pages.mjs compare --snapshot /tmp/public-pages.json
// Optional paths: --project-dir /path/to/project --build-dir /path/to/.next
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

function options(argv) {
    const [command, ...args] = argv;
    if (!['snapshot', 'compare'].includes(command) || args.length % 2) {
        throw new Error('Usage: check-public-pages.mjs <snapshot|compare> --snapshot FILE [--project-dir DIR] [--build-dir DIR]');
    }
    const values = new Map();
    for (let index = 0; index < args.length; index += 2) {
        const key = args[index];
        if (!['--snapshot', '--project-dir', '--build-dir'].includes(key) || values.has(key)) {
            throw new Error(`Unknown or duplicate option: ${key}`);
        }
        values.set(key, args[index + 1]);
    }
    if (!values.get('--snapshot')) throw new Error('--snapshot FILE is required');
    const projectDir = path.resolve(values.get('--project-dir') || process.cwd());
    return {
        command,
        projectDir,
        buildDir: path.resolve(values.get('--build-dir') || path.join(projectDir, '.next')),
        snapshotFile: path.resolve(values.get('--snapshot')),
    };
}

async function filesBelow(directory) {
    const result = [];
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) result.push(...await filesBelow(file));
        else if (entry.isFile()) result.push(file);
    }
    return result.sort();
}

function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

const compact = (value) => value.replace(/\s+/g, ' ').trim();
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const relative = (root, file) => path.relative(root, file).split(path.sep).join('/');
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

function pageSnapshot(html, parse) {
    const document = parse(html);
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]')
        .map((node) => canonical(JSON.parse(node.rawText)));
    const metadata = document.querySelectorAll('meta').map((node) => canonical(node.attributes));
    const metadataLinks = document.querySelectorAll('link').filter((node) =>
        !['preload', 'modulepreload', 'stylesheet', 'preconnect', 'dns-prefetch'].includes(node.getAttribute('rel'))
    ).map((node) => canonical(node.attributes));
    const title = document.querySelector('title')?.text || '';
    const language = document.querySelector('html')?.getAttribute('lang') || '';
    // Build hashes, chunk URLs, hydration data and script ordering are not crawlable copy.
    for (const node of document.querySelectorAll('script, style, template')) node.remove();
    const body = document.querySelector('body');
    if (!body) throw new Error('Built HTML is missing its body');
    return {
        title,
        language,
        metadata,
        metadataLinks,
        jsonLd,
        bodyText: compact(body.structuredText),
        headings: body.querySelectorAll('h1, h2, h3, h4, h5, h6').map((node) => ({
            tag: node.rawTagName.toLowerCase(),
            text: compact(node.text),
        })),
        links: body.querySelectorAll('a').map((node) => ({
            href: node.getAttribute('href') || '',
            text: compact(node.text),
            rel: node.getAttribute('rel') || '',
            title: node.getAttribute('title') || '',
            ariaLabel: node.getAttribute('aria-label') || '',
        })),
        images: body.querySelectorAll('img').map((node) => ({
            src: node.getAttribute('src') || '',
            alt: node.getAttribute('alt') || '',
        })),
    };
}

async function capture({ projectDir, buildDir }) {
    // Use the HTML parser already bundled with the project's pinned Next version.
    const require = createRequire(path.join(projectDir, 'package.json'));
    const { parse } = require('next/dist/compiled/node-html-parser');
    const appDir = path.join(buildDir, 'server/app');
    const appFiles = await filesBelow(appDir);
    const htmlFiles = appFiles.filter((file) => file.endsWith('.html'));
    if (!htmlFiles.length) throw new Error('No prerendered HTML found; build the local project first');
    const pages = {};
    const generatedFiles = {};
    for (const file of htmlFiles) {
        const name = relative(appDir, file).slice(0, -5);
        const route = name === 'index' ? '/' : `/${name}`;
        pages[route] = pageSnapshot(await fs.readFile(file, 'utf8'), parse);
    }
    for (const file of appFiles.filter((file) => file.endsWith('.body'))) {
        const name = relative(appDir, file).slice(0, -5);
        const contents = await fs.readFile(file);
        generatedFiles[`/${name}`] = /\.(xml|txt)$/.test(name)
            ? { text: contents.toString('utf8') }
            : { sha256: sha256(contents), bytes: contents.length };
    }
    if (!generatedFiles['/sitemap.xml'] || !generatedFiles['/robots.txt']) {
        throw new Error('Built sitemap.xml and robots.txt are required for this regression guard');
    }
    const routes = await readJson(path.join(buildDir, 'routes-manifest.json'));
    const prerender = await readJson(path.join(buildDir, 'prerender-manifest.json'));
    const protectedSources = [
        ...await filesBelow(path.join(projectDir, 'src/app')),
        ...await filesBelow(path.join(projectDir, 'public')),
        ...(await fs.readdir(projectDir)).filter((file) => /^next\.config\./.test(file)).map((file) => path.join(projectDir, file)),
    ].sort();
    const sources = {};
    for (const file of protectedSources) {
        const contents = await fs.readFile(file);
        sources[relative(projectDir, file)] = {
            sha256: sha256(contents),
            gitBlobSha1: createHash('sha1').update(`blob ${contents.length}\0`).update(contents).digest('hex'),
        };
    }
    return canonical({
        sources,
        pages,
        generatedFiles,
        routing: {
            basePath: routes.basePath,
            caseSensitive: routes.caseSensitive,
            pages404: routes.pages404,
            redirects: routes.redirects,
            rewrites: routes.rewrites,
            headers: routes.headers,
            staticRoutes: routes.staticRoutes,
            dynamicRoutes: routes.dynamicRoutes,
            notFoundRoutes: prerender.notFoundRoutes,
            prerenderedRoutes: Object.fromEntries(Object.entries(prerender.routes).map(([route, info]) => [route, {
                status: info.initialStatus || 200,
                sourceRoute: info.srcRoute,
                revalidate: info.initialRevalidateSeconds,
                headers: info.initialHeaders || {},
            }])),
            dynamicPrerenderedRoutes: prerender.dynamicRoutes,
        },
    });
}

async function main() {
    const config = options(process.argv.slice(2));
    const current = await capture(config);
    const publicPages = Object.keys(current.pages).filter((route) => !route.startsWith('/_'));
    if (config.command === 'snapshot') {
        let gitHead = null;
        try {
            gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: config.projectDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        } catch { /* A non-git local copy can still be checked. */ }
        await fs.writeFile(config.snapshotFile, `${JSON.stringify({
            version: 1,
            capturedAt: new Date().toISOString(),
            gitHead,
            projectDir: config.projectDir,
            buildDir: config.buildDir,
            data: current,
        }, null, 2)}\n`, { flag: 'wx' });
        console.log(`Snapshot saved: ${config.snapshotFile}`);
        console.log(`${publicPages.length} public pages, ${Object.keys(current.sources).length} protected sources, ${Object.keys(current.generatedFiles).length} generated metadata files.`);
        console.log(publicPages.join('\n'));
        return;
    }
    const baseline = await readJson(config.snapshotFile);
    if (baseline.version !== 1 || !baseline.data) throw new Error('Unsupported or invalid baseline snapshot');
    const differences = [];
    for (const section of new Set([...Object.keys(baseline.data), ...Object.keys(current)])) {
        const before = baseline.data[section] || {};
        const after = current[section] || {};
        for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
            if (isDeepStrictEqual(before[key], after[key])) continue;
            const fields = section === 'pages' && before[key] && after[key]
                ? Object.keys(after[key]).filter((field) => !isDeepStrictEqual(before[key][field], after[key][field])).join(', ')
                : !Object.hasOwn(before, key) ? 'added' : !Object.hasOwn(after, key) ? 'removed' : 'changed';
            differences.push(`${section}: ${key} (${fields})`);
        }
    }
    if (differences.length) {
        console.error(`FAIL: ${differences.length} protected items changed:\n${differences.join('\n')}`);
        process.exitCode = 1;
        return;
    }
    console.log(`PASS: ${publicPages.length} public pages have unchanged crawlable text, metadata, JSON-LD, headings, links and images.`);
    console.log('Protected source hashes, generated sitemap/robots/images, route availability, redirects and headers also match.');
    console.log('This compares local builds only; it does not predict search rankings or verify a deployment.');
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { coreLinkFiles, inspectCoreLinks, inspectNextImages, inspectSourceCoreLinks, inspectSourceImages, requiredStaticPages, runCostCheck, validateBuildManifests } from './check-vercel-costs.mjs';

function staticRecord(route, routeType = 'page', srcRoute = route) {
    return { routeType, compute: 'static', response: 'complete', initialRevalidateSeconds: false, srcRoute };
}

function buildFixture() {
    const routes = Object.fromEntries(requiredStaticPages.map(route => [route, staticRecord(route)]));
    routes['/patterns/example'] = staticRecord('/patterns/example', 'page', '/patterns/[...segments]');
    routes['/patterns/sunset-mountain-lake'].srcRoute = '/patterns/[...segments]';
    routes['/robots.txt'] = staticRecord('/robots.txt', 'route');
    const appRoutes = Object.fromEntries(requiredStaticPages.filter(route => route !== '/patterns/sunset-mountain-lake')
        .map(route => [`${route === '/' ? '' : route}/page`, route]));
    appRoutes['/patterns/[...segments]/page'] = '/patterns/[...segments]';
    appRoutes['/robots.txt/route'] = '/robots.txt';
    appRoutes['/_not-found/page'] = '/_not-found';
    appRoutes['/_global-error/page'] = '/_global-error';
    return {
        prerender: { version: 4, routes, dynamicRoutes: { '/patterns/[...segments]': { fallback: false } } },
        images: { version: 1, images: { unoptimized: true, remotePatterns: [], domains: [] } },
        middleware: { version: 3, middleware: {}, functions: {}, sortedMiddleware: [] },
        appRoutes,
        appPaths: Object.fromEntries(Object.keys(appRoutes).map(route => [route, `app${route}.js`])),
    };
}

test('accepts the real Next manifest shape with only complete static pages and build-time parameter expansion', () => {
    const result = validateBuildManifests(buildFixture());
    assert.deepEqual(result, {
        staticPages: 13, staticRouteHandlers: 1, staticParameterTemplates: 1,
        requiredPages: 12, optimizerDisabled: true, routingMiddleware: 0,
    });
});

for (const [name, mutate, error] of [
    ['optimizer enabled', value => { value.images.images.unoptimized = false; }, /optimizer must be disabled/],
    ['optimizer config missing', value => { delete value.images.images.unoptimized; }, /optimizer must be disabled/],
    ['remote image origin', value => { value.images.images.remotePatterns.push({ hostname: 'external.example' }); }, /remote image allowlist/],
    ['legacy image domain', value => { value.images.images.domains.push('external.example'); }, /legacy remote image domains/],
    ['routing middleware', value => { value.middleware.middleware['/'] = { matchers: [{ regexp: '.*' }] }; }, /routing middleware must remain empty/],
    ['edge routing function', value => { value.middleware.functions['/edge'] = {}; }, /routing functions must remain empty/],
    ['middleware order', value => { value.middleware.sortedMiddleware.push('/'); }, /middleware order/],
    ['home compute regression', value => { value.prerender.routes['/'].compute = 'dynamic'; }, /static compute/],
    ['editor compute regression', value => { value.prerender.routes['/editor'].compute = 'dynamic'; }, /static compute/],
    ['German landscape compute regression', value => { value.prerender.routes['/de/patterns/sunset-mountain-lake'].compute = 'dynamic'; }, /static compute/],
    ['unlisted older pattern compute regression', value => { value.prerender.routes['/patterns/example'].compute = 'dynamic'; }, /static compute/],
    ['partial static response', value => { value.prerender.routes['/'].response = 'partial'; }, /complete static response/],
    ['numeric ISR interval', value => { value.prerender.routes['/patterns/example'].initialRevalidateSeconds = 60; }, /ISR\/revalidation/],
    ['zero ISR interval', value => { value.prerender.routes['/editor'].initialRevalidateSeconds = 0; }, /ISR\/revalidation/],
    ['missing old pattern static output', value => { delete value.prerender.routes['/patterns/example']; value.appRoutes['/patterns/example/page'] = '/patterns/example'; value.appPaths['/patterns/example/page'] = 'app/patterns/example/page.js'; }, /missing prerendered output/],
    ['missing required landscape despite missing inventory', value => { delete value.prerender.routes['/ja/patterns/sunset-mountain-lake']; delete value.appRoutes['/ja/patterns/sunset-mountain-lake/page']; delete value.appPaths['/ja/patterns/sunset-mountain-lake/page']; }, /missing prerendered output/],
    ['unknown public dynamic page', value => { value.appRoutes['/account/page'] = '/account'; value.appPaths['/account/page'] = 'app/account/page.js'; }, /missing prerendered output/],
    ['new runtime API', value => { value.appRoutes['/api/private/route'] = '/api/private'; value.appPaths['/api/private/route'] = 'app/api/private/route.js'; }, /missing prerendered output/],
    ['dynamic route handler', value => { value.prerender.routes['/robots.txt'].compute = 'dynamic'; }, /static compute/],
    ['runtime fallback', value => { value.prerender.dynamicRoutes['/patterns/[...segments]'].fallback = null; }, /fallback rendering/],
    ['ISR fallback', value => { value.prerender.dynamicRoutes['/patterns/[...segments]'].fallback = '/fallback.html'; }, /fallback rendering/],
    ['missing parameter manifest', value => { delete value.prerender.dynamicRoutes['/patterns/[...segments]']; }, /missing static parameter template/],
    ['template without concrete output', value => { for (const record of Object.values(value.prerender.routes)) if (record.srcRoute === '/patterns/[...segments]') record.srcRoute = '/untracked'; }, /no concrete static routes/],
    ['hidden route in app inventory', value => { value.appPaths['/hidden/page'] = 'app/hidden/page.js'; }, /inventories disagree/],
    ['untracked dynamic template', value => { value.prerender.dynamicRoutes['/untracked/[id]'] = { fallback: false }; }, /untracked runtime route template/],
    ['changed framework schema', value => { value.prerender.version = 99; }, /manifest version/],
]) {
    test(`rejects ${name}`, () => {
        const fixture = buildFixture();
        mutate(fixture);
        assert.throws(() => validateBuildManifests(fixture), error);
    });
}

for (const [name, source, count] of [
    ['default import', `import Image from 'next/image'; const view = <Image src="/one.png" unoptimized />;`, 1],
    ['renamed import and paired tag', `import Photo from 'next/image'; const view = <Photo unoptimized={true}></Photo>;`, 1],
    ['named default', `import { default as Photo } from 'next/image'; const view = <Photo unoptimized />;`, 1],
    ['namespace default', `import * as Next from 'next/image'; const view = <Next.default unoptimized />;`, 1],
    ['CommonJS default', `const Photo = require('next/image').default; const view = <Photo unoptimized />;`, 1],
    ['CommonJS direct', `const Photo = require('next/image'); const view = <Photo unoptimized />;`, 1],
    ['CommonJS destructured default', `const { default: Photo } = require('next/image'); const view = <Photo unoptimized />;`, 1],
    ['local aliases', `import Image from 'next/image'; const One = Image; const Two = One; const view = <Two unoptimized />;`, 1],
    ['safe spread before explicit override', `import Image from 'next/image'; const view = <Image {...props} unoptimized />;`, 1],
    ['parenthesized typed true', `import Image from 'next/image'; const view = <Image unoptimized={(true as boolean)} />;`, 1],
    ['ordinary img and icon', `import { ImageIcon } from 'lucide-react'; const view = <><img src="/one.png" /><ImageIcon /></>;`, 0],
    ['source text and comments are not JSX', `// import Image from 'next/image'; <Image />\nconst text = "<Image src='/one.png' />";`, 0],
]) {
    test(`TypeScript AST accepts ${name}`, () => {
        assert.deepEqual(inspectNextImages(source, 'fixture.tsx'), { imageCount: count, failures: [] });
    });
}

for (const [name, jsx] of [
    ['missing prop', '<Image src="/one.png" />'],
    ['false prop', '<Image unoptimized={false} />'],
    ['truthy string', '<Image unoptimized="true" />'],
    ['runtime expression', '<Image unoptimized={enabled} />'],
    ['opaque spread only', '<Image {...props} />'],
    ['spread overriding the safe prop', '<Image unoptimized {...props} />'],
    ['duplicate overriding prop', '<Image unoptimized unoptimized={false} />'],
]) {
    test(`TypeScript AST rejects ${name}`, () => {
        const result = inspectNextImages(`import Image from 'next/image';\nconst view = ${jsx};`, 'fixture.tsx');
        assert.equal(result.imageCount, 1);
        assert.equal(result.failures.length, 1);
        assert.match(result.failures[0], /fixture\.tsx:2:\d+.*explicit unoptimized/);
    });
}

test('AST does not confuse TypeScript generics with JSX', () => {
    assert.deepEqual(inspectNextImages('export const identity = <T>(value: T): T => value;', 'plain.ts'), { imageCount: 0, failures: [] });
});

test('AST rejects a regression through a renamed import and chained aliases', () => {
    const result = inspectNextImages(`import Original from 'next/image'; const Local = Original; const Final = Local; const view = <Final />;`);
    assert.equal(result.imageCount, 1);
    assert.match(result.failures[0], /<Final> needs explicit/);
});

test('AST inspects JavaScript JSX as well as TypeScript', () => {
    const result = inspectNextImages(`import Photo from 'next/image'; export default () => <Photo />;`, 'plain.jsx');
    assert.equal(result.imageCount, 1);
    assert.equal(result.failures.length, 1);
});

test('core-link AST recognizes renamed imports and explicit false after a spread', () => {
    assert.deepEqual(inspectCoreLinks(`import Navigation from 'next/link'; const view = <Navigation {...props} prefetch={false}>Home</Navigation>;`), { linkCount: 1, failures: [] });
    assert.deepEqual(inspectCoreLinks(`import * as Next from 'next/link'; const view = <Next.default prefetch={false} />;`), { linkCount: 1, failures: [] });
    assert.deepEqual(inspectCoreLinks(`// <Link />\nconst comment = "prefetch={false}"; const view = <a href="/private-workspace">Open</a>;`), { linkCount: 0, failures: [] });
});

for (const [name, jsx] of [
    ['default automatic prefetch', '<Link href="/" />'],
    ['explicit true prefetch', '<Link href="/" prefetch={true} />'],
    ['bare true prefetch', '<Link href="/" prefetch />'],
    ['runtime conditional prefetch', '<Link href="/" prefetch={link.prefetch} />'],
    ['spread overriding false prefetch', '<Link href="/" prefetch={false} {...props} />'],
]) {
    test(`core-link AST rejects ${name}`, () => {
        const result = inspectCoreLinks(`import Link from 'next/link'; const view = ${jsx};`, 'SiteHeader.tsx');
        assert.equal(result.linkCount, 1);
        assert.equal(result.failures.length, 1);
        assert.match(result.failures[0], /SiteHeader\.tsx:1:\d+.*prefetch=\{false\}/);
    });
}

async function withFixture(run) {
    const root = await mkdtemp(path.join(os.tmpdir(), 'fusebead-cost-guard-'));
    try {
        await mkdir(path.join(root, 'src'), { recursive: true });
        await writeFile(path.join(root, 'src/view.tsx'), `import Image from 'next/image'; export const View = () => <Image src="/logo.webp" unoptimized />;`);
        for (const filename of coreLinkFiles) {
            await mkdir(path.dirname(path.join(root, filename)), { recursive: true });
            await writeFile(path.join(root, filename), `import Link from 'next/link'; export const Navigation = () => <Link href="/" prefetch={false}>Home</Link>;`);
        }
        return await run(root);
    } finally { await rm(root, { recursive: true, force: true }); }
}

async function writeBuild(root, fixture) {
    await mkdir(path.join(root, '.next/server'), { recursive: true });
    await writeFile(path.join(root, '.next/BUILD_ID'), 'unit-test-build');
    for (const [key, filename] of Object.entries({
        prerender: 'prerender-manifest.json', images: 'images-manifest.json', middleware: 'server/middleware-manifest.json',
        appRoutes: 'app-path-routes-manifest.json', appPaths: 'server/app-paths-manifest.json',
    })) await writeFile(path.join(root, '.next', filename), JSON.stringify(fixture[key]));
}

test('source inventory reads real production files and skips test fixtures, not genuine unsafe components', async () => withFixture(async root => {
    await mkdir(path.join(root, 'src/__tests__'));
    await writeFile(path.join(root, 'src/unsafe.test.tsx'), `import Image from 'next/image'; const test = <Image />;`);
    await writeFile(path.join(root, 'src/__tests__/unsafe.tsx'), `import Image from 'next/image'; const test = <Image />;`);
    assert.deepEqual(await inspectSourceImages(root), { sourceFiles: 5, unoptimizedImages: 1 });
    await writeFile(path.join(root, 'src/components/unsafe.tsx'), `import Photo from 'next/image'; const view = <Photo />;`);
    await assert.rejects(inspectSourceImages(root), /components\/unsafe\.tsx.*explicit unoptimized/);
}));

test('core navigation inventory checks exactly four surfaces and leaves unrelated purposeful interactions outside this gate', async () => withFixture(async root => {
    await writeFile(path.join(root, 'src/workspace.tsx'), `import Link from 'next/link'; export const Workspace = () => <Link href="/workspace">Open</Link>;`);
    assert.deepEqual(await inspectSourceCoreLinks(root), { coreLinkFiles: 4, noPrefetchCoreLinks: 4 });
    await writeFile(path.join(root, coreLinkFiles[0]), `import Link from 'next/link'; export const Header = () => <Link href="/">Home</Link>;`);
    await assert.rejects(inspectSourceCoreLinks(root), /SiteHeader\.tsx.*prefetch=\{false\}/);
}));

test('CLI requires a production build instead of silently accepting a source-only audit', async () => withFixture(async root => {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./check-vercel-costs.mjs', import.meta.url))], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /BUILD_ID/);
    assert.equal(result.stdout, '');
}));

test('CLI consumes real fixture files and fails when the built optimizer is re-enabled', async () => withFixture(async root => {
    const fixture = buildFixture();
    await writeBuild(root, fixture);
    const result = await runCostCheck(root);
    assert.equal(result.buildId, 'unit-test-build');
    assert.equal(result.unoptimizedImages, 1);
    assert.equal(result.noPrefetchCoreLinks, 4);
    const cli = fileURLToPath(new URL('./check-vercel-costs.mjs', import.meta.url));
    const passed = spawnSync(process.execPath, [cli], { cwd: root, encoding: 'utf8' });
    assert.equal(passed.status, 0, passed.stderr);
    assert.equal(JSON.parse(passed.stdout).status, 'passed');
    fixture.images.images.unoptimized = false;
    await writeBuild(root, fixture);
    const failed = spawnSync(process.execPath, [cli], { cwd: root, encoding: 'utf8' });
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /optimizer must be disabled/);
}));

test('release and CI commands run the build-dependent cost gate after the build', async () => {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
    assert.equal(pkg.scripts['cost:check'], 'node scripts/check-vercel-costs.mjs');
    assert.match(pkg.scripts['test:run'], /scripts\/check-vercel-costs\.test\.mjs/);
    assert.ok(pkg.scripts.verify.indexOf('npm run build') < pkg.scripts.verify.indexOf('npm run cost:check'));
    assert.ok(ci.indexOf('run: npm run build') < ci.indexOf('run: npm run cost:check'));
});

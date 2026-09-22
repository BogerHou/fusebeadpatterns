import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('./smoke-production.mjs', import.meta.url), 'utf8');
const mainBoundary = source.indexOf('\nconst failures = [];');
assert.ok(mainBoundary > 0, 'Smoke script entry point is present');
const apex = 'https://fusebeadpatterns.art/';
const httpWww = 'http://www.fusebeadpatterns.art/';
const httpsWww = 'https://www.fusebeadpatterns.art/';

function runtime(fetch, env = {}) {
    const context = {
        fetch, URL, AbortController, setTimeout, clearTimeout,
        process: { env, exit: (code) => { throw new Error(`Exited ${code}`); } },
        console: { log() {}, error() {} },
    };
    const functions = vm.runInNewContext(`${source.slice(0, mainBoundary)}\n;({ runCanonicalRedirectCheck, runCheck });`, context);
    return { context, ...functions };
}

function routeResponses(routes) {
    const requests = [];
    const fetch = async (url, options) => {
        requests.push(url);
        assert.equal(options.redirect, 'manual');
        assert.ok(routes[url], `Unexpected network destination: ${url}`);
        const [status, location] = routes[url];
        return new Response('', { status, headers: location ? { location } : {} });
    };
    return { requests, ...runtime(fetch) };
}

test('accepts the existing HTTP www -> HTTPS www -> HTTPS apex permanent chain', async () => {
    const check = routeResponses({ [httpWww]: [308, httpsWww], [httpsWww]: [308, apex], [apex]: [200] });
    const result = await check.runCanonicalRedirectCheck(httpWww);
    assert.equal(result.location, apex);
    assert.equal(result.redirects, 2);
    assert.deepEqual(check.requests, [httpWww, httpsWww, apex]);
});

test('accepts up to three permanent hops and resolves relative locations', async () => {
    const intermediate = 'https://www.fusebeadpatterns.art/canonical';
    const check = routeResponses({ [httpWww]: [301, httpsWww], [httpsWww]: [308, '/canonical'], [intermediate]: [301, apex], [apex]: [200] });
    assert.equal((await check.runCanonicalRedirectCheck(httpWww)).redirects, 3);
});

for (const [label, routes, error] of [
    ['temporary redirect', { [httpWww]: [302, apex] }, /permanent redirect/],
    ['missing location', { [httpWww]: [308] }, /without a location/],
    ['noncanonical final host', { [httpWww]: [308, httpsWww], [httpsWww]: [200] }, /expected a permanent redirect/],
    ['external host', { [httpWww]: [308, 'https://example.com/'] }, /approved site/],
    ['unexpected port', { [httpWww]: [308, 'https://fusebeadpatterns.art:444/'] }, /approved site/],
    ['URL credentials', { [httpWww]: [308, 'https://user@fusebeadpatterns.art/'] }, /approved site/],
    ['non-HTTP scheme', { [httpWww]: [308, 'javascript:alert(1)'] }, /approved site/],
    ['HTTPS downgrade', { [httpWww]: [308, httpsWww], [httpsWww]: [308, 'http://fusebeadpatterns.art/'] }, /downgraded HTTPS/],
    ['loop', { [httpWww]: [308, httpWww] }, /redirect loop/],
    ['fourth redirect', { [httpWww]: [308, httpsWww], [httpsWww]: [308, '/one'], 'https://www.fusebeadpatterns.art/one': [308, '/two'], 'https://www.fusebeadpatterns.art/two': [308, apex] }, /exceeded 3/],
]) {
    test(`rejects ${label} before requesting an unsafe next URL`, async () => {
        const check = routeResponses(routes);
        await assert.rejects(check.runCanonicalRedirectCheck(httpWww), error);
    });
}

test('a local target runs all five content/header checks without contacting production', async () => {
    const origin = 'http://127.0.0.1:4332';
    const requests = [];
    const { context } = runtime(async (url, options) => {
        requests.push(url);
        assert.equal(new URL(url).origin, origin);
        assert.equal(options.redirect, 'manual');
        return new Response('Free Perler Bead Pattern Generator Perler Bead Pattern Editor Perler Bead Guides /guides/photo-to-perler-bead-pattern Sitemap:', {
            headers: Object.fromEntries(['content-security-policy', 'referrer-policy', 'x-content-type-options', 'x-frame-options', 'permissions-policy', 'cross-origin-opener-policy', 'strict-transport-security'].map((header) => [header, 'present'])),
        });
    }, { SMOKE_BASE_URL: origin });
    await vm.runInNewContext(`(async () => {\n${source}\n})()`, context);
    assert.deepEqual(requests, ['/', '/editor', '/guides', '/sitemap.xml', '/robots.txt'].map((pathname) => origin + pathname));
});

test('a local page redirect fails instead of following its public Location', async () => {
    let requests = 0;
    const check = runtime(async (url, options) => {
        requests++;
        assert.equal(url, 'http://localhost:4332/');
        assert.equal(options.redirect, 'manual');
        return new Response('', { status: 308, headers: { location: apex } });
    }, { SMOKE_BASE_URL: 'http://localhost:4332' });
    await assert.rejects(check.runCheck({ path: '/', label: 'home', expectedText: 'Generator' }), /HTTP 308/);
    assert.equal(requests, 1);
});

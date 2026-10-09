import assert from 'node:assert/strict';

const origin = new URL(process.argv[2] || 'http://127.0.0.1:4391');
assert.ok(['http:', 'https:'].includes(origin.protocol), 'Use an HTTP(S) preview origin');
const unknownPaths = [
    '/404-language-probe', '/de/404-language-probe', '/fr/deep/404-language-probe',
    '/ja/patterns/404-language-probe', '/de/patterns/404-language-probe',
    '/de/guides/404-language-probe', '/fr/guides/404-language-probe', '/ja/guides/404-language-probe',
    '/guides/404-language-probe', '/ja/editor/deep/404-language-probe',
    '/patterns/404-language-probe', '/fr/patterns/404-language-probe',
    '/dead/404-language-probe', '/france/404-language-probe', '/japan/404-language-probe',
];
const withoutScripts = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
const results = [];
for (const pathname of unknownPaths) {
    const response = await fetch(new URL(pathname, origin));
    const html = withoutScripts(await response.text());
    assert.equal(response.status, 404, pathname);
    assert.match(html, /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/, pathname);
    // The shared document's server fallback remains English. Browser localization
    // is checked separately; serialized RSC text is never counted as visible HTML.
    assert.match(html, /<html\b[^>]*lang="en"/, pathname);
    assert.match(html, /<h1\b[^>]*>Page not found<\/h1>/, pathname);
    assert.equal([...html.matchAll(/<title\b/g)].length, 1, `${pathname}: exactly one initial title`);
    assert.match(html, /<title>Page not found \| Fuse Bead Patterns<\/title>/, pathname);
    assert.match(html, /<a\b(?=[^>]*href="\/patterns")(?=[^>]*class="button-primary")[^>]*>/, pathname);
    assert.match(html, /<a\b(?=[^>]*href="\/")(?=[^>]*class="button-secondary")[^>]*>/, pathname);
    assert.ok(!html.includes('__next_error__'), `${pathname}: empty/error document`);
    assert.ok(!/rel="(?:canonical|alternate)"/.test(html), `${pathname}: invented SEO URL`);
    results.push({ pathname, status: response.status, initialLang: 'en', completeInitial404: true });
}
for (const [pathname, locale] of [['/', 'en'], ['/de', 'de'], ['/fr', 'fr'], ['/ja', 'ja']]) {
    const response = await fetch(new URL(pathname, origin));
    const html = withoutScripts(await response.text());
    assert.equal(response.status, 200, pathname);
    assert.match(html, new RegExp(`<html\\b[^>]*lang="${locale}"`), pathname);
    assert.ok(!/name="robots"[^>]*content="[^"]*noindex/.test(html), pathname);
    assert.ok(html.includes('rel="canonical"'), pathname);
    for (const language of ['en', 'de', 'fr', 'ja', 'x-default']) assert.ok(html.includes(`hrefLang="${language}"`) || html.includes(`hreflang="${language}"`), `${pathname}: ${language}`);
}
const publishedGuideSlugs = [
    'photo-to-perler-bead-pattern', 'perler-bead-pegboards', 'perler-to-hama-artkal',
    'perler-vs-hama-vs-artkal', 'mini-perler-beads', 'perler-bead-kits-and-storage',
    'how-to-iron-perler-beads',
];
let publishedGuides = 0;
for (const locale of ['en', 'de', 'fr', 'ja']) for (const slug of publishedGuideSlugs) {
    const pathname = `${locale === 'en' ? '' : `/${locale}`}/guides/${slug}`;
    const response = await fetch(new URL(pathname, origin));
    const html = withoutScripts(await response.text());
    assert.equal(response.status, 200, pathname);
    assert.match(html, new RegExp(`<html\\b[^>]*lang="${locale}"`), pathname);
    assert.match(html, /<h1\b[^>]*>[^<]+<\/h1>/, pathname);
    assert.ok(!html.includes('__next_error__'), pathname);
    assert.ok(!/name="robots"[^>]*content="[^"]*noindex/.test(html), pathname);
    const canonical = [...html.matchAll(/<link\b[^>]*>/g)].find(([tag]) => tag.includes('rel="canonical"'))?.[0];
    assert.ok(canonical?.includes(`href="https://fusebeadpatterns.art${pathname}"`), `${pathname}: canonical`);
    for (const language of ['en', 'de', 'fr', 'ja', 'x-default']) assert.ok(html.includes(`hrefLang="${language}"`) || html.includes(`hreflang="${language}"`), `${pathname}: ${language}`);
    publishedGuides++;
}
console.log(JSON.stringify({ origin: origin.origin, unknownPages: results, ordinaryHomes: 4, publishedGuides, browserHydrationValidated: false }, null, 2));

import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectMetadata } from './check-seo-metadata.mjs';

test('counts decoded Unicode characters, not HTML entities or UTF-16 units', () => {
    const summary = 'a'.repeat(158) + '&amp;&#x1f600;';
    const result = inspectMetadata(`<meta name="description" content="${summary}">`);
    assert.equal(result.descriptions[0].length, 160);
    assert.deepEqual(result.issues, []);
});

test('checks search and social descriptions, including single-quoted attributes', () => {
    const long = 'a'.repeat(161);
    const result = inspectMetadata(`<meta content='${long}' property='og:description'><meta name="twitter:description" content="">`);
    assert.equal(result.issues.length, 2);
    assert.match(result.issues[0], /og:description has 161/);
    assert.match(result.issues[1], /twitter:description is empty/);
});

test('rejects inherited keywords even when the tag is empty', () => {
    assert.equal(inspectMetadata('<meta NAME="KEYWORDS" content="">').keywords, 1);
});

test('rejects duplicate description tags', () => {
    const result = inspectMetadata('<meta name="description" content="First"><meta name="description" content="Second">');
    assert.match(result.issues[0], /duplicate description/);
});

test('ignores metadata-like strings serialized inside scripts', () => {
    const result = inspectMetadata('<script>self.__next_f.push([1,"<meta name=\\"keywords\\" content=\\"example\\">"])</script>');
    assert.deepEqual(result.issues, []);
});

test('does not treat script literals or HTML comments as emitted tags', () => {
    const result = inspectMetadata(`<script>const example = '<meta name="keywords" content="sample">';</script><!-- <meta name="description" content=""> -->`);
    assert.deepEqual(result.issues, []);
});

test('checks that canonical URL and og:url match when both are present', () => {
    const matching = inspectMetadata('<link rel="canonical" href="https://fusebeadpatterns.art/about"><meta property="og:url" content="https://fusebeadpatterns.art/about">');
    assert.deepEqual(matching.issues, []);

    const mismatching = inspectMetadata('<link rel="canonical" href="https://fusebeadpatterns.art/about"><meta property="og:url" content="https://fusebeadpatterns.art">');
    assert.equal(mismatching.issues.length, 1);
    assert.match(mismatching.issues[0], /canonical .* does not match og:url/);
});

test('enforces og:image and valid JSON-LD on indexable pages when requireIndexableCompleteness is enabled', () => {
    const incomplete = inspectMetadata(
        '<link rel="canonical" href="https://fusebeadpatterns.art/guides"><meta name="description" content="Valid">',
        'guides.html',
        { requireIndexableCompleteness: true }
    );
    assert.equal(incomplete.issues.length, 2);
    assert.match(incomplete.issues[0], /missing og:image/);
    assert.match(incomplete.issues[1], /missing JSON-LD/);

    const complete = inspectMetadata(
        '<link rel="canonical" href="https://fusebeadpatterns.art/guides"><meta property="og:image" content="/opengraph-image.png"><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>',
        'guides.html',
        { requireIndexableCompleteness: true }
    );
    assert.deepEqual(complete.issues, []);

    const noindexPage = inspectMetadata(
        '<link rel="canonical" href="https://fusebeadpatterns.art/editor"><meta name="robots" content="noindex, follow">',
        'editor.html',
        { requireIndexableCompleteness: true }
    );
    assert.deepEqual(noindexPage.issues, []);
});

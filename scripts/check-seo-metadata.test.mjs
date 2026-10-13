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

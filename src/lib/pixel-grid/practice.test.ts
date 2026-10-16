import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIMITS } from './core';
import { createPixelPracticeBridge, decodePixelPracticeImage, openPixelPractice, pixelPracticePreset, type PixelPracticeDecoder, type PixelPracticeId } from './practice';
import type { PixelLocaleSnapshot } from './locale-navigation';

const ids: PixelPracticeId[] = ['rocket-32-original', 'rocket-64-original', 'rocket-64-16-colors', 'cat-32-original', 'cat-64-original', 'cat-64-16-colors'];
const images = {
    rocket: readFileSync('public/guides/photo-to-pattern/rocket-source.png'),
    cat: readFileSync('public/guides/photo-to-pattern/cat-source.jpg'),
};
// Synthetic decoder output deliberately does not claim to be the browser's
// photo/ICC output. Its two RGB colors make independent fit/alpha checks exact.
function source(width: number, height: number) {
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        pixels.set((x + y) % 2 ? [17, 83, 201, 128] : [211, 41, 7, 255], (y * width + x) * 4);
    }
    return { width, height, pixels };
}
const rocket = source(1254, 1254), cat = source(792, 960);
function harness(id: PixelPracticeId = 'rocket-32-original') {
    const preset = pixelPracticePreset(id), image = id.startsWith('rocket') ? images.rocket : images.cat;
    const old = { source: 'private image', crop: [1, 2, 3, 4], undo: ['past'], redo: ['future'], pending: ['002', 'bad'], activeStroke: 'unfinished', print: 'letter/tiled/blank' };
    const state: { value: typeof old | PixelLocaleSnapshot } = { value: old };
    const controller = new AbortController();
    const fetcher = vi.fn(async () => new Response(image, { headers: { 'content-type': preset.mime, 'content-length': String(image.length) } }));
    const decode = vi.fn(async () => id.startsWith('rocket') ? rocket : cat);
    const commit = vi.fn((snapshot: PixelLocaleSnapshot) => { state.value = snapshot; });
    const env = { signal: controller.signal, current: () => true, fetch: fetcher as typeof fetch, decode: decode as PixelPracticeDecoder, converter: false, needsConfirmation: vi.fn(() => true), confirm: vi.fn(() => true), commit };
    return { env, old, state, controller, fetcher, decode, commit };
}

test.each(ids)('only the six fixed presets can prepare a complete unsaved practice: %s', async id => {
    const h = harness(id), preset = pixelPracticePreset(id);
    assert.equal(await openPixelPractice(id, h.env), 'opened');
    assert.equal(h.commit.mock.calls.length, 1);
    const result = h.state.value as PixelLocaleSnapshot;
    assert.equal(result.grid.width, preset.side); assert.equal(result.grid.height, preset.side);
    assert.equal(result.source?.pixels, id.startsWith('rocket') ? rocket.pixels : cat.pixels);
    assert.equal(result.source?.name, preset.name); assert.equal(result.sourceCrop, null);
    assert.deepEqual(result.history, { undo: [], redo: [] });
    assert(result.saved.pixels.every(value => value === 0));
    assert(result.grid.pixels.some(value => value !== 0));
    assert.deepEqual([result.width, result.height, result.mode, result.tool, result.color, result.alpha, result.zoom, result.showGrid, result.colorLimit, result.exportScale, result.cursor, result.settingsExpanded], [String(preset.side), String(preset.side), 'fit', 'brush', '#f06a45', 255, 'fit', true, preset.colorLimit, 8, [0, 0], null]);
    assert.equal(h.fetcher.mock.calls.length, 1);
    assert.deepEqual(h.fetcher.mock.calls[0], [preset.path, { signal: h.controller.signal, credentials: 'same-origin', redirect: 'error' }]);
    assert.equal(h.env.confirm.mock.calls.length, 1);
    // Independent nearest-neighbor fit oracle, including asymmetric photo margins.
    const fittedWidth = id.startsWith('rocket') ? preset.side : preset.side === 32 ? 26 : 53;
    const left = Math.floor((preset.side - fittedWidth) / 2);
    for (let y = 0; y < preset.side; y++) for (let x = 0; x < preset.side; x++) {
        let expected = [0, 0, 0, 0];
        if (x >= left && x < left + fittedWidth) {
            const sx = Math.min(preset.width - 1, Math.floor((x - left + .5) * preset.width / fittedWidth));
            const sy = Math.min(preset.height - 1, Math.floor((y + .5) * preset.height / preset.side));
            expected = (sx + sy) % 2 ? [17, 83, 201, 128] : [211, 41, 7, 255];
        }
        assert.deepEqual([...result.grid.pixels.slice((y * preset.side + x) * 4, (y * preset.side + x + 1) * 4)], expected);
    }
});

test.each([null, {}, '__proto__', 'constructor', 'https://example.com/a.png', '/guides/photo-to-pattern/rocket-source.png', 'rocket-128-original', 'cat-64-8-colors', 'rocket-32-original?url=x'])('rejects untrusted preset input before fetching: %s', async id => {
    const h = harness();
    await assert.rejects(() => openPixelPractice(id, h.env), /Unknown pixel example/);
    assert.equal(h.fetcher.mock.calls.length, 0); assert.equal(h.commit.mock.calls.length, 0); assert.equal(h.state.value, h.old);
});

test('cancelled replacement keeps the exact old workspace and does not publish the prepared source', async () => {
    const h = harness(); h.env.confirm.mockReturnValue(false);
    assert.equal(await openPixelPractice('rocket-32-original', h.env), 'cancelled');
    assert.equal(h.decode.mock.calls.length, 1); assert.equal(h.commit.mock.calls.length, 0); assert.equal(h.state.value, h.old);
});

test('untouched work needs no confirmation and converter display defaults remain consistent', async () => {
    const h = harness(); h.env.needsConfirmation.mockReturnValue(false); h.env.converter = true;
    assert.equal(await openPixelPractice('rocket-32-original', h.env), 'opened');
    assert.equal(h.env.confirm.mock.calls.length, 0); assert.equal((h.state.value as PixelLocaleSnapshot).showGrid, false);
});

test.each(['network', 'http', 'mime', 'declared-size', 'stream-size', 'bad-image', 'wrong-dimensions', 'decode', 'decoded-dimensions', 'decoded-length'])('failed %s preparation never asks to replace or changes old work', async failure => {
    const h = harness();
    if (failure === 'network') h.env.fetch = async () => { throw new TypeError('Failed to fetch'); };
    if (failure === 'http') h.env.fetch = async () => new Response('Missing', { status: 404 });
    if (failure === 'mime') h.env.fetch = async () => new Response(images.rocket, { headers: { 'content-type': 'text/html' } });
    if (failure === 'declared-size') h.env.fetch = async () => new Response(images.rocket, { headers: { 'content-type': 'image/png', 'content-length': String(LIMITS.maxImageBytes + 1) } });
    if (failure === 'stream-size') h.env.fetch = async () => new Response(new Uint8Array(LIMITS.maxImageBytes + 1), { headers: { 'content-type': 'image/png' } });
    if (failure === 'bad-image') h.env.fetch = async () => new Response('<html>Oops</html>', { headers: { 'content-type': 'image/png' } });
    if (failure === 'wrong-dimensions') h.env.fetch = async () => {
        const copy = new Uint8Array(images.rocket); new DataView(copy.buffer).setUint32(16, 1253);
        return new Response(copy, { headers: { 'content-type': 'image/png' } });
    };
    if (failure === 'decode') h.env.decode = async () => { throw new Error('decoder rejected'); };
    if (failure === 'decoded-dimensions') h.env.decode = async () => ({ ...rocket, width: 1253 });
    if (failure === 'decoded-length') h.env.decode = async () => ({ ...rocket, pixels: new Uint8ClampedArray(4) });
    await assert.rejects(() => openPixelPractice('rocket-32-original', h.env));
    assert.equal(h.env.confirm.mock.calls.length, 0); assert.equal(h.commit.mock.calls.length, 0); assert.equal(h.state.value, h.old);
});

test('missing or incorrect content-length cannot bypass the streaming cap and stream cancellation', async () => {
    const h = harness(); let cancelled = false;
    h.env.fetch = async () => new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(LIMITS.maxImageBytes)); c.enqueue(new Uint8Array(1)); }, cancel() { cancelled = true; } }), { headers: { 'content-type': 'image/png', 'content-length': '1' } });
    await assert.rejects(() => openPixelPractice('rocket-32-original', h.env));
    assert(cancelled); assert.equal(h.decode.mock.calls.length, 0); assert.equal(h.state.value, h.old);
});

test('a rejected reader cancellation still releases its lock and cannot mask the original read error', async () => {
    const h = harness(), original = new Error('original network body error'), cleanup = new Error('cleanup cancellation error');
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.error(original); } });
    const acquire = stream.getReader.bind(stream);
    Object.defineProperty(stream, 'getReader', { value: () => {
        const reader = acquire();
        Object.defineProperty(reader, 'cancel', { value: async () => { throw cleanup; } });
        return reader;
    } });
    h.env.fetch = async () => new Response(stream, { headers: { 'content-type': 'image/png' } });
    await assert.rejects(() => openPixelPractice('rocket-32-original', h.env), error => error === original);
    assert.equal(stream.locked, false); assert.equal(h.decode.mock.calls.length, 0); assert.equal(h.commit.mock.calls.length, 0); assert.equal(h.state.value, h.old);
});

test('unmount or a newer task during decode disposes the candidate without a confirmation or commit', async () => {
    const h = harness(); let current = true;
    h.env.current = () => current;
    h.env.decode = async () => { current = false; return rocket; };
    assert.equal(await openPixelPractice('rocket-32-original', h.env), 'stale');
    assert.equal(h.env.confirm.mock.calls.length, 0); assert.equal(h.commit.mock.calls.length, 0); assert.equal(h.state.value, h.old);
});

test('abort before loading sends no request; abort after fetch cancels its body', async () => {
    const h = harness(); h.controller.abort();
    await assert.rejects(() => openPixelPractice('rocket-32-original', h.env), { name: 'AbortError' });
    assert.equal(h.fetcher.mock.calls.length, 0);
    const later = harness(); let cancelled = false;
    later.env.fetch = async () => { later.controller.abort(); return new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: { 'content-type': 'image/png' } }); };
    await assert.rejects(() => openPixelPractice('rocket-32-original', later.env), { name: 'AbortError' });
    assert(cancelled); assert.equal(later.decode.mock.calls.length, 0); assert.equal(later.state.value, later.old);
});

test('stale task while the confirmation is open cannot commit, even when the answer is yes', async () => {
    const h = harness(); let current = true; h.env.current = () => current;
    h.env.confirm.mockImplementation(() => { current = false; return true; });
    assert.equal(await openPixelPractice('rocket-32-original', h.env), 'stale');
    assert.equal(h.commit.mock.calls.length, 0); assert.equal(h.state.value, h.old);
});

test('abort while waiting for a stream read cancels the reader without touching the old workspace', async () => {
    const h = harness(); let cancelled = false;
    h.env.fetch = async () => new Response(new ReadableStream({ start(c) { c.enqueue(images.rocket.subarray(0, 33)); queueMicrotask(() => h.controller.abort()); }, cancel() { cancelled = true; } }), { headers: { 'content-type': 'image/png' } });
    await assert.rejects(() => openPixelPractice('rocket-32-original', h.env), { name: 'AbortError' });
    assert(cancelled); assert.equal(h.decode.mock.calls.length, 0); assert.equal(h.commit.mock.calls.length, 0); assert.equal(h.state.value, h.old);
});

test('multi-chunk response without content-length can open normally within the cap', async () => {
    const h = harness();
    h.env.fetch = async () => new Response(new ReadableStream({ start(c) { c.enqueue(images.rocket.subarray(0, 100)); c.enqueue(images.rocket.subarray(100)); c.close(); } }), { headers: { 'content-type': 'image/png; charset=binary' } });
    assert.equal(await openPixelPractice('rocket-32-original', h.env), 'opened');
    assert.equal(h.commit.mock.calls.length, 1);
});

test('confirmation exceptions keep the old workspace and do not partially install a candidate', async () => {
    const h = harness(); h.env.confirm.mockImplementation(() => { throw new Error('dialog unavailable'); });
    await assert.rejects(() => openPixelPractice('rocket-32-original', h.env), /dialog unavailable/);
    assert.equal(h.commit.mock.calls.length, 0); assert.equal(h.state.value, h.old);
});

test('a scoped registration disables requests before mount and after cleanup, including stale owners', () => {
    const bridge = createPixelPracticeBridge(), a = vi.fn(), b = vi.fn(), changed = vi.fn();
    const unsubscribe = bridge.subscribe(changed);
    assert.equal(bridge.available(), false); bridge.start('rocket-32-original'); assert.equal(a.mock.calls.length, 0);
    const old = bridge.register(a, true); bridge.start('rocket-32-original'); assert.equal(a.mock.calls.length, 1);
    old.setEnabled(false); bridge.start('cat-64-original'); assert.equal(a.mock.calls.length, 1);
    const newer = bridge.register(b, true);
    old.unregister(); old.setEnabled(false); assert.equal(bridge.available(), true);
    bridge.start('cat-64-16-colors'); assert.deepEqual(b.mock.calls, [['cat-64-16-colors']]);
    newer.unregister(); newer.unregister(); assert.equal(bridge.available(), false);
    assert.equal(changed.mock.calls.length, 4);
    unsubscribe(); bridge.register(a, true); assert.equal(changed.mock.calls.length, 4);
    assert.throws(() => bridge.start('arbitrary' as PixelPracticeId));
});

test.each(['stale', 'oversized', 'context', 'success'])('browser decoder releases owned bitmap/canvas on %s', async failure => {
    const close = vi.fn(); const canvas = { width: 0, height: 0, getContext: () => failure === 'context' ? null : { drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray([1, 2, 3, 4]) }) } };
    vi.stubGlobal('createImageBitmap', async () => ({ width: failure === 'oversized' ? 2049 : 1, height: 1, close }));
    vi.stubGlobal('document', { createElement: () => canvas });
    try {
        if (failure === 'success') assert.deepEqual(await decodePixelPracticeImage(new Blob(), () => true), { width: 1, height: 1, pixels: new Uint8ClampedArray([1, 2, 3, 4]) });
        else await assert.rejects(() => decodePixelPracticeImage(new Blob(), () => failure !== 'stale'));
        assert.equal(close.mock.calls.length, 1); assert.equal(canvas.width, 0); assert.equal(canvas.height, 0);
    } finally { vi.unstubAllGlobals(); }
});

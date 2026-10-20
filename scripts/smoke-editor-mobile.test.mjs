import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { randomBytes } from 'node:crypto';

// Exercise the real smoke transport without starting Chrome or a website.
const source = await readFile(new URL('./smoke-editor-mobile.mjs', import.meta.url), 'utf8');
const start = source.indexOf('class CdpSocket {');
const end = source.indexOf('\nasync function waitForChrome', start);
assert.ok(start > 0 && end > start);
const CdpSocket = vm.runInNewContext(`${source.slice(start, end)}\nCdpSocket`, {
    URL, Buffer, randomBytes, setTimeout, clearTimeout, console: { log() {} },
});

function responseFrame(message) {
    const payload = Buffer.from(JSON.stringify(message));
    const header = Buffer.alloc(payload.length < 126 ? 2 : 4);
    header[0] = 0x81;
    header[1] = payload.length < 126 ? payload.length : 126;
    if (payload.length >= 126) header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, payload]);
}

function clientMessage(frame) {
    const length = frame[1] & 127;
    const offset = length < 126 ? 2 : length === 126 ? 4 : 10;
    const mask = frame.subarray(offset, offset + 4);
    const payload = Buffer.from(frame.subarray(offset + 4));
    for (let index = 0; index < payload.length; index++) payload[index] ^= mask[index % 4];
    return JSON.parse(payload.toString());
}

function harness(timeout = 1000) {
    const cdp = new CdpSocket('ws://127.0.0.1:1/devtools/page/test', { requestTimeoutMs: timeout });
    const sent = [];
    cdp.socket = {
        write(frame, callback) {
            const message = clientMessage(frame);
            sent.push(message);
            callback();
            if (message.method === 'Page.handleJavaScriptDialog') {
                queueMicrotask(() => cdp.consume(responseFrame({ id: message.id, result: {} })));
            }
        },
        destroy() {},
    };
    return { cdp, sent };
}

test('a missing CDP response has a Node deadline with its method and stage', async () => {
    const { cdp } = harness(15);
    cdp.setStage('project replacement');
    await assert.rejects(cdp.send('Runtime.evaluate'), /timed out during project replacement: Runtime.evaluate/);
    assert.equal(cdp.pending.size, 0);
    cdp.close();
});

test('a complete response clears its pending request', async () => {
    const { cdp, sent } = harness();
    const result = cdp.send('Runtime.evaluate');
    cdp.consume(responseFrame({ id: sent[0].id, result: { value: 'ready' } }));
    assert.equal((await result).value, 'ready');
    assert.equal(cdp.pending.size, 0);
    cdp.close();
});

test('only the exact armed confirmation is accepted, and it must actually appear', async () => {
    const { cdp, sent } = harness();
    const verify = cdp.expectJavaScriptDialog('confirm', 'Replace this test project?');
    cdp.consume(responseFrame({ method: 'Page.javascriptDialogOpening', params: {
        type: 'confirm', message: 'Replace this test project?',
    } }));
    assert.equal(sent[0].method, 'Page.handleJavaScriptDialog');
    assert.equal(sent[0].params.accept, true);
    verify();
    await Promise.resolve();
    cdp.close();
});

for (const kind of ['different-message', 'different-type', 'outside-expected-stage']) {
    test(`an unexpected dialog fails closed: ${kind}`, async () => {
        const { cdp, sent } = harness();
        if (kind !== 'outside-expected-stage') cdp.expectJavaScriptDialog('confirm', 'Replace this test project?');
        const pending = cdp.send('Runtime.evaluate');
        const rejected = assert.rejects(pending, /Unexpected/);
        cdp.consume(responseFrame({ method: 'Page.javascriptDialogOpening', params: {
            type: kind === 'different-type' ? 'alert' : 'confirm',
            message: kind === 'different-message' ? 'Unexpected request' : 'Replace this test project?',
        } }));
        await rejected;
        assert.equal(sent.find(message => message.method === 'Page.handleJavaScriptDialog').params.accept, false);
        await assert.rejects(cdp.send('Page.navigate'), /Unexpected/);
        assert.equal(cdp.pending.size, 0);
        cdp.close();
    });
}

test('the run cannot claim confirmation coverage when no dialog appeared', () => {
    const { cdp } = harness();
    const verify = cdp.expectJavaScriptDialog('confirm', 'Replace this test project?');
    assert.throws(verify, /was not shown/);
    cdp.close();
});

test('closing the transport rejects an in-flight evaluation and clears its timer', async () => {
    const { cdp } = harness();
    const pending = cdp.send('Runtime.evaluate');
    const rejected = assert.rejects(pending, /websocket closed/);
    cdp.close();
    await rejected;
    assert.equal(cdp.pending.size, 0);
});

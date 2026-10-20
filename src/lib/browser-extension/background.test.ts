import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEditorDraft, encodeEditorProjectPattern, serializeEditorProject } from '../editor/draft';
import { getBoardOption, getPaletteOption, parsePaletteCsv } from '../editor/config';
import { HANDOFF_TTL_MS, makeHandoffUrl, MAX_IMAGE_BYTES } from './protocol';

const token = 'beadbead-1234-4321-9123-123456789abc';
const extensionId = 'abcdefghijklmnopabcdefghijklmnop';
const sourceKey = 'bead-capture:source:' + token;
const handoffKey = 'bead-capture:handoff:' + token;
const studio = { id: extensionId, url: `chrome-extension://${extensionId}/studio.html?source=${token}`, tab: { id: 99 }, frameId: 0 };
const receiver = { id: extensionId, url: makeHandoffUrl(token), tab: { id: 77 }, frameId: 0, documentId: 'doc-one' };
let stored: Record<string, unknown>;
let mockChrome: BeadCaptureChrome;
let fetchMock: ReturnType<typeof vi.fn>;
let handle: typeof import('../../../extensions/bead-capture/src/background')['handleCaptureMessage'];

function imageResponse(bytes: Uint8Array, type = 'image/png', size?: string) {
    return new Response(new Blob([new Uint8Array(bytes)]), { headers: { 'content-type': type, ...(size === undefined ? {} : { 'content-length': size }) } });
}
function projectString(count = 1, paletteId = 'perler') {
    const option = getPaletteOption(paletteId)!, board = getBoardOption(option.boardId)!;
    const palette = parsePaletteCsv('01,Black,B,0,0,0', option);
    const side = board.beadsPerRow * count;
    const pixels = new Uint8ClampedArray(side * side * 4); pixels.set([0, 0, 0, 255]);
    return serializeEditorProject(createEditorDraft({ sourceMode: 'blank', imageSrc: null, fileName: 'image-29x29-perler',
        selectedPaletteIds: [paletteId], activePalettes: [palette], boardId: board.id, boardWidth: count, boardHeight: count,
        matchingId: 'euclidean', ditheringId: 'none', useSymbols: true, exportFormatId: 'pdf', previewZoom: 1,
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: false, fit: false, showGrid: true }, editedPattern: encodeEditorProjectPattern(pixels, side, side) }));
}
function installSource(url = 'https://images.example.com/p.png') {
    stored[sourceKey] = { url, capturedAt: Date.now(), studioTabId: 99, tabId: 7 };
}
function installHandoff(createdAt = Date.now()) {
    stored[handoffKey] = { token, project: projectString(), tabId: 77, targetUrl: makeHandoffUrl(token), createdAt };
}

beforeEach(async () => {
    vi.resetModules();
    stored = {};
    const event = () => ({ addListener: vi.fn() });
    mockChrome = {
        runtime: { id: extensionId, getURL: path => `chrome-extension://${extensionId}/${path}`, sendMessage: vi.fn(), onInstalled: event(), onMessage: event() },
        contextMenus: { create: vi.fn(), removeAll: vi.fn().mockResolvedValue(undefined), onClicked: event() },
        action: { onClicked: event() },
        tabs: { create: vi.fn().mockResolvedValue({ id: 77 }), update: vi.fn().mockResolvedValue({ id: 77 }), remove: vi.fn().mockResolvedValue(undefined), onRemoved: event() },
        permissions: { contains: vi.fn().mockResolvedValue(true), request: vi.fn().mockResolvedValue(true), remove: vi.fn().mockResolvedValue(true) },
        storage: { session: {
            get: vi.fn(async (keys?: string | string[] | null) => {
                const result: Record<string, unknown> = {};
                for (const key of keys == null ? Object.keys(stored) : typeof keys === 'string' ? [keys] : keys) if (key in stored) result[key] = structuredClone(stored[key]);
                return result;
            }),
            set: vi.fn(async (value: Record<string, unknown>) => { Object.assign(stored, structuredClone(value)); }),
            remove: vi.fn(async (keys: string | string[]) => { for (const key of typeof keys === 'string' ? [keys] : keys) delete stored[key]; }),
            setAccessLevel: vi.fn().mockResolvedValue(undefined),
        } },
    };
    fetchMock = vi.fn();
    vi.stubGlobal('chrome', mockChrome); vi.stubGlobal('fetch', fetchMock);
    handle = (await import('../../../extensions/bead-capture/src/background')).handleCaptureMessage;
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('extension background boundary', () => {
    it('refuses ordinary pages, another extension and non-studio pages before storage or network access', async () => {
        for (const sender of [{ ...studio, id: 'another-extension' }, { ...studio, url: 'https://evil.example.com/studio.html' },
            { ...studio, url: `chrome-extension://${extensionId}/other.html` }, { ...studio, frameId: 1 }]) {
            expect(await handle({ type: 'fetch-source', token, url: 'https://anything.example.com/' }, sender)).toEqual({ ok: false, error: 'unauthorized' });
        }
        expect(fetchMock).not.toHaveBeenCalled();
        expect(mockChrome.storage.session.get).not.toHaveBeenCalled();
    });

    it('returns only a captured source, supports a studio without sender.tab, and never lets a message override its URL', async () => {
        installSource();
        expect(await handle({ type: 'read-source', token }, { id: extensionId, url: studio.url })).toMatchObject({ ok: true, originPattern: 'https://images.example.com/*', permissionGranted: true });
        expect(await handle({ type: 'read-source', token }, { ...studio, tab: { id: 4 } })).toEqual({ ok: false, error: 'source_expired' });
        fetchMock.mockResolvedValue(imageResponse(new Uint8Array([1, 2, 3])));
        expect(await handle({ type: 'fetch-source', token, url: 'https://other.example.com/' }, studio)).toMatchObject({ ok: true, mimeType: 'image/png' });
        expect(fetchMock).toHaveBeenCalledWith('https://images.example.com/p.png', expect.objectContaining({ credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', cache: 'no-store' }));
        expect(mockChrome.permissions.contains).toHaveBeenCalledWith({ origins: ['https://images.example.com/*'] });
        expect(stored[sourceKey]).toBeDefined();
    });

    it('reports missing host access without prompting or fetching, so the studio can ask on a user click', async () => {
        installSource();
        vi.mocked(mockChrome.permissions.contains).mockResolvedValue(false);
        expect(await handle({ type: 'read-source', token }, studio)).toMatchObject({
            ok: true, originPattern: 'https://images.example.com/*', permissionGranted: false,
        });
        expect(mockChrome.permissions.request).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('captures the actual context-menu image and binds the studio before serving it', async () => {
        const listener = vi.mocked(mockChrome.contextMenus.onClicked.addListener).mock.calls[0][0];
        listener({ menuItemId: 'make-bead-pattern', mediaType: 'image', srcUrl: 'https://i.ebayimg.com/images/g/public/s-l1600.webp' }, { id: 7, windowId: 5 });
        await vi.waitFor(() => expect(mockChrome.tabs.create).toHaveBeenCalledOnce());
        const call = vi.mocked(mockChrome.tabs.create).mock.calls[0][0];
        expect(call).toMatchObject({ active: true, windowId: 5 });
        const capturedToken = new URL(call.url).searchParams.get('source');
        expect(capturedToken).toBeTruthy();
        await vi.waitFor(() => expect(stored['bead-capture:source:' + capturedToken]).toMatchObject({ studioTabId: 77 }));
        expect(await handle({ type: 'read-source', token: capturedToken }, {
            id: extensionId, url: call.url, tab: { id: 77 }, frameId: 0,
        })).toMatchObject({
            ok: true, originPattern: 'https://i.ebayimg.com/*', permissionGranted: true,
            source: { url: 'https://i.ebayimg.com/images/g/public/s-l1600.webp', tabId: 7 },
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not fetch before a host permission exists, or for local/blob/credential sources', async () => {
        installSource();
        vi.mocked(mockChrome.permissions.contains).mockResolvedValue(false);
        expect(await handle({ type: 'fetch-source', token }, studio)).toEqual({ ok: false, error: 'permission_required' });
        for (const url of ['http://127.0.0.1/a.png', 'blob:https://example.com/one', 'https://user:password@example.com/a.png']) {
            installSource(url);
            expect(await handle({ type: 'fetch-source', token }, studio)).toEqual({ ok: false, error: 'unsupported_source' });
        }
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects image format and both declared and streamed size overruns', async () => {
        installSource();
        fetchMock.mockResolvedValueOnce(imageResponse(new Uint8Array([1]), 'text/html'));
        expect(await handle({ type: 'fetch-source', token }, studio)).toEqual({ ok: false, error: 'unsupported_image' });
        fetchMock.mockResolvedValueOnce(imageResponse(new Uint8Array([1]), 'image/png', String(MAX_IMAGE_BYTES + 1)));
        expect(await handle({ type: 'fetch-source', token }, studio)).toEqual({ ok: false, error: 'image_too_large' });
        fetchMock.mockResolvedValueOnce(imageResponse(new Uint8Array(MAX_IMAGE_BYTES + 1)));
        expect(await handle({ type: 'fetch-source', token }, studio)).toEqual({ ok: false, error: 'image_too_large' });
        fetchMock.mockRejectedValueOnce(new Error('redirect refused'));
        expect(await handle({ type: 'fetch-source', token }, studio)).toEqual({ ok: false, error: 'fetch_failed' });
    });

    it('aborts an unanswered network request after fifteen seconds', async () => {
        vi.useFakeTimers(); installSource();
        fetchMock.mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }));
        const result = handle({ type: 'fetch-source', token }, studio);
        await vi.advanceTimersByTimeAsync(15_001);
        expect(await result).toEqual({ ok: false, error: 'fetch_timeout' });
    });

    it('stores a sanitized project before navigating a bound tab, never the supplied hidden fields', async () => {
        const raw = JSON.parse(projectString()); raw.draft.secret = 'private-image-url';
        expect(await handle({ type: 'create-handoff', project: JSON.stringify(raw), locale: 'ja' }, studio)).toMatchObject({ ok: true, tabId: 77 });
        const entry = Object.entries(stored).find(([key]) => key.startsWith('bead-capture:handoff:'));
        expect(entry).toBeDefined();
        const record = entry![1] as { project: string; targetUrl: string; token: string; tabId: number };
        expect(record.project).not.toContain('private-image-url');
        expect(record.project).toContain('Bead Capture');
        expect(record.targetUrl).toBe(makeHandoffUrl(record.token, 'ja'));
        expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url: 'about:blank', active: true });
        expect(mockChrome.tabs.update).toHaveBeenCalledWith(77, { url: record.targetUrl });
        expect(await handle({ type: 'create-handoff', project: '{}', locale: 'en' }, studio)).toEqual({ ok: false, error: 'invalid_project' });
        expect(await handle({ type: 'create-handoff', project: projectString(), locale: 'https://evil.example' }, studio)).toEqual({ ok: false, error: 'invalid_message' });
    });

    it('keeps concurrent large handoffs within the session budget and retains source records', async () => {
        installSource();
        const large = projectString(20);
        const results = await Promise.all(Array.from({ length: 3 }, () =>
            handle({ type: 'create-handoff', project: large }, studio)));
        expect(results.every(result => result.ok)).toBe(true);
        const handoffs = Object.entries(stored).filter(([key]) => key.startsWith('bead-capture:handoff:'));
        expect(handoffs).toHaveLength(2);
        expect(stored[sourceKey]).toBeDefined();
        const estimate = Object.entries(stored).reduce((sum, [key, value]) => sum + (key.length + JSON.stringify(value).length) * 2 + 4096, 0);
        expect(estimate).toBeLessThanOrEqual(8 * 1024 * 1024);
    });

    it('does not evict delivered work awaiting confirmation or open an empty tab for an overlarge transfer', async () => {
        installHandoff();
        const record = stored[handoffKey] as Record<string, unknown>;
        record.project = projectString(20); record.delivered = true;
        const secondToken = 'beadbead-1234-4321-9123-123456789abd';
        const secondKey = 'bead-capture:handoff:' + secondToken;
        stored[secondKey] = { ...record, token: secondToken, targetUrl: makeHandoffUrl(secondToken), tabId: 78 };
        const snapshot = structuredClone(stored);
        expect(await handle({ type: 'create-handoff', project: projectString(20) }, studio)).toEqual({ ok: false, error: 'handoff_storage_full' });
        expect(stored).toEqual(snapshot);
        expect(await handle({ type: 'create-handoff', project: projectString(20, 'perler_mini') }, studio)).toEqual({ ok: false, error: 'handoff_too_large' });
        expect(stored).toEqual(snapshot);
        expect(mockChrome.tabs.create).not.toHaveBeenCalled();
    });

    it('makes a handoff readable only by its intended tab and document, and consumes it only after acceptance', async () => {
        installHandoff();
        expect(await handle({ type: 'finish-handoff', token, result: 'accepted' }, receiver)).toEqual({ ok: false, error: 'unauthorized' });
        for (const invalid of [{ ...receiver, tab: { id: 78 } }, { ...receiver, frameId: 1 }, { ...receiver, id: 'other' },
            { ...receiver, url: makeHandoffUrl(token, 'de') }, { ...receiver, url: 'https://fusebeadpatterns.art/editor' }]) {
            expect(await handle({ type: 'read-handoff', token }, invalid)).toEqual({ ok: false, error: 'unauthorized' });
        }
        expect(await handle({ type: 'read-handoff', token }, receiver)).toMatchObject({ ok: true, project: expect.any(String) });
        expect(await handle({ type: 'read-handoff', token }, receiver)).toMatchObject({ ok: true });
        expect(stored[handoffKey]).toBeDefined();
        expect(await handle({ type: 'finish-handoff', token, result: 'accepted' }, { ...receiver, documentId: 'other' })).toEqual({ ok: false, error: 'unauthorized' });
        expect(await handle({ type: 'finish-handoff', token, result: 'accepted' }, { ...receiver, url: 'https://fusebeadpatterns.art/editor' })).toEqual({ ok: true });
        expect(stored[handoffKey]).toBeUndefined();
        expect(await handle({ type: 'read-handoff', token }, receiver)).toEqual({ ok: false, error: 'handoff_expired' });
    });

    it('also consumes a user dismissal, and refuses and deletes expired records', async () => {
        installHandoff(); await handle({ type: 'read-handoff', token }, receiver);
        expect(await handle({ type: 'finish-handoff', token, result: 'dismissed' }, receiver)).toEqual({ ok: true });
        installHandoff(Date.now() - HANDOFF_TTL_MS);
        expect(await handle({ type: 'read-handoff', token }, receiver)).toEqual({ ok: false, error: 'handoff_expired' });
        expect(stored[handoffKey]).toBeUndefined();
        installSource(); (stored[sourceKey] as { capturedAt: number }).capturedAt -= HANDOFF_TTL_MS;
        expect(await handle({ type: 'read-source', token }, studio)).toEqual({ ok: false, error: 'source_expired' });
        expect(stored[sourceKey]).toBeUndefined();
    });

    it('cleans only owned records when a task tab closes', async () => {
        installSource(); installHandoff(); stored.unrelated = { tabId: 77 };
        const listener = vi.mocked(mockChrome.tabs.onRemoved.addListener).mock.calls[0][0];
        listener(77); await vi.waitFor(() => expect(stored[handoffKey]).toBeUndefined());
        expect(stored[sourceKey]).toBeDefined(); expect(stored.unrelated).toBeDefined();
        listener(99); await vi.waitFor(() => expect(stored[sourceKey]).toBeUndefined());
        expect(stored.unrelated).toBeDefined();
    });
});

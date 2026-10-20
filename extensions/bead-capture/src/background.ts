import {
    getImageOriginPattern, HANDOFF_TTL_MS, isAuthorizedHandoffFinish, isAuthorizedHandoffSender, isAuthorizedSourceSender,
    isExtensionToken, isFreshTimestamp, isStudioSender, makeHandoffUrl, MAX_IMAGE_BYTES,
    parseExtensionProject, SOURCE_TTL_MS, type ExtensionLocale, type ExtensionSource, type HandoffBinding,
} from '../../../src/lib/browser-extension/protocol';
import { serializeEditorProject } from '../../../src/lib/editor/draft';

const MENU_ID = 'make-bead-pattern';
const SOURCE_PREFIX = 'bead-capture:source:';
const HANDOFF_PREFIX = 'bead-capture:handoff:';
const MAX_SOURCE_RECORDS = 12;
const MAX_HANDOFF_RECORDS = 3;
// Session storage has a 10 MiB memory quota. Budget conservatively for UTF-16
// strings and leave headroom for runtime/object overhead and delivery metadata.
const MAX_SESSION_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
type SourceRecord = ExtensionSource & { studioTabId?: number };
type HandoffRecord = HandoffBinding & { project: string; launchUrl?: string; launched?: boolean; deliveredDocumentId?: string; delivered?: boolean };
type RuntimeResult = { ok: true; [key: string]: unknown } | { ok: false; error: string };
let sessionQueue: Promise<void> = Promise.resolve();

function requestLaunchPermission(originPattern?: string): Promise<boolean> {
    const allWebsites = ['http://*/*', 'https://*/*'];
    // Chrome carries the click interaction into native API callbacks. Do not
    // put an await, storage read or session queue before request() in this
    // callback; an existing single-host grant must not trigger an upgrade.
    return new Promise(resolve => {
        try {
            chrome.permissions.contains({ origins: originPattern ? [originPattern] : allWebsites }, granted => {
                if (granted) { resolve(true); return; }
                try { void chrome.permissions.request({ origins: allWebsites }).then(resolve, () => resolve(false)); }
                catch { resolve(false); }
            });
        } catch { resolve(false); }
    });
}

function withSessionLock<T>(operation: () => Promise<T>): Promise<T> {
    const pending = sessionQueue.then(operation, operation);
    sessionQueue = pending.then((): void => undefined, (): void => undefined);
    return pending;
}

function estimatedSessionBytes(key: string, value: unknown): number {
    // JSON overhead overestimates simple records; doubling also covers the
    // ASCII-heavy base64 project strings stored in memory, not on disk.
    return (key.length + JSON.stringify(value).length) * 2 + 4096;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function cleanSession(): Promise<void> {
    const stored = await chrome.storage.session.get(null);
    const sources: [string, number][] = [], handoffs: [string, number][] = [], remove: string[] = [];
    for (const [key, value] of Object.entries(stored)) {
        if (!key.startsWith(SOURCE_PREFIX) && !key.startsWith(HANDOFF_PREFIX)) continue;
        const createdAt = isRecord(value) ? (key.startsWith(SOURCE_PREFIX) ? value.capturedAt : value.createdAt) : null;
        if (!isFreshTimestamp(createdAt)) { remove.push(key); continue; }
        (key.startsWith(SOURCE_PREFIX) ? sources : handoffs).push([key, createdAt]);
    }
    sources.sort((a, b) => b[1] - a[1]); handoffs.sort((a, b) => b[1] - a[1]);
    remove.push(...sources.slice(MAX_SOURCE_RECORDS).map(([key]) => key), ...handoffs.slice(MAX_HANDOFF_RECORDS).map(([key]) => key));
    if (remove.length) await chrome.storage.session.remove(remove);
}

async function openStudio(info?: { srcUrl?: string }, tab?: BeadCaptureTab): Promise<void> {
    await cleanSession();
    const token = crypto.randomUUID();
    // A toolbar launch has no image. A context-menu launch always keeps a source
    // token, even when its address cannot be retained, so the studio can explain
    // why the selected image was not loaded instead of showing an empty session.
    if (!info) { await chrome.tabs.create({ url: chrome.runtime.getURL('studio.html'), active: true }); return; }
    // Unsupported short addresses remain visible only to the local studio.
    // Large data URLs are never retained in session storage.
    const url = info?.srcUrl && info.srcUrl.length <= 8192 ? info.srcUrl : '';
    const record: SourceRecord = { url, capturedAt: Date.now(), tabId: tab?.id, windowId: tab?.windowId };
    await chrome.storage.session.set({ [SOURCE_PREFIX + token]: record });
    try {
        const studio = await chrome.tabs.create({ url: `${chrome.runtime.getURL('studio.html')}?source=${token}`, active: true, ...(tab?.windowId === undefined ? {} : { windowId: tab.windowId }) });
        if (studio.id !== undefined) await chrome.storage.session.set({ [SOURCE_PREFIX + token]: { ...record, studioTabId: studio.id } });
    } catch { await chrome.storage.session.remove(SOURCE_PREFIX + token); }
}

async function readSource(token: string, sender: BeadCaptureSender): Promise<SourceRecord | null> {
    const key = SOURCE_PREFIX + token;
    const stored = await chrome.storage.session.get(key);
    const record = stored[key] as SourceRecord | undefined;
    if (!record || !isFreshTimestamp(record.capturedAt, Date.now(), SOURCE_TTL_MS) ||
        !isAuthorizedSourceSender(sender, chrome.runtime.id, token, record.studioTabId)) return null;
    return record;
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
}

/** This handler only fetches a source captured by a real context-menu action.
 * It never accepts a caller-provided arbitrary URL or forwards page cookies. */
async function fetchSource(record: SourceRecord): Promise<RuntimeResult> {
    const originPattern = getImageOriginPattern(record.url);
    if (!originPattern) return { ok: false, error: 'unsupported_source' };
    if (!await chrome.permissions.contains({ origins: [originPattern] })) return { ok: false, error: 'permission_required' };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
        const response = await fetch(record.url, { credentials: 'omit', referrerPolicy: 'no-referrer',
            redirect: 'error', cache: 'no-store', signal: controller.signal });
        if (!response.ok || !response.body) return { ok: false, error: 'fetch_failed' };
        const mimeType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
        if (!ALLOWED_IMAGE_TYPES.has(mimeType)) { await response.body.cancel(); return { ok: false, error: 'unsupported_image' }; }
        const declaredSize = response.headers.get('content-length');
        if (declaredSize && (!/^\d+$/.test(declaredSize) || Number(declaredSize) > MAX_IMAGE_BYTES)) {
            await response.body.cancel(); return { ok: false, error: 'image_too_large' };
        }
        const reader = response.body.getReader(), chunks: Uint8Array[] = [];
        let total = 0;
        for (;;) {
            const chunk = await reader.read();
            if (chunk.done) break;
            total += chunk.value.byteLength;
            if (total > MAX_IMAGE_BYTES) { await reader.cancel(); return { ok: false, error: 'image_too_large' }; }
            chunks.push(chunk.value);
        }
        if (!total) return { ok: false, error: 'unsupported_image' };
        const bytes = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
        return { ok: true, dataUrl: `data:${mimeType};base64,${bytesToBase64(bytes)}`, mimeType };
    } catch { return { ok: false, error: controller.signal.aborted ? 'fetch_timeout' : 'fetch_failed' }; }
    finally { clearTimeout(timeout); }
}

async function createHandoff(project: unknown, locale: unknown): Promise<RuntimeResult> {
    const draft = parseExtensionProject(project);
    if (!draft) return { ok: false, error: 'invalid_project' };
    if (locale !== undefined && !['en', 'de', 'fr', 'ja'].includes(locale as string)) return { ok: false, error: 'invalid_message' };
    const token = crypto.randomUUID(), targetUrl = makeHandoffUrl(token, (locale ?? 'en') as ExtensionLocale);
    const key = HANDOFF_PREFIX + token;
    const pending: HandoffRecord = { token, project: serializeEditorProject(draft), tabId: -1, targetUrl, createdAt: Date.now() };
    const requiredBytes = estimatedSessionBytes(key, pending);
    if (requiredBytes > MAX_SESSION_BYTES) return { ok: false, error: 'handoff_too_large' };
    const stored = await chrome.storage.session.get(null);
    let usedBytes = Object.entries(stored).reduce((sum, [storedKey, value]) => sum + estimatedSessionBytes(storedKey, value), 0);
    let handoffCount = Object.keys(stored).filter(storedKey => storedKey.startsWith(HANDOFF_PREFIX)).length;
    // A delivered project may be waiting for the person to save existing work.
    // Prune only older, undelivered handoffs; never invalidate that confirmation.
    const removable = Object.entries(stored).filter(([storedKey, value]) =>
        storedKey.startsWith(HANDOFF_PREFIX) && isRecord(value) && value.delivered !== true)
        .sort(([, a], [, b]) => (a as HandoffRecord).createdAt - (b as HandoffRecord).createdAt);
    const remove: string[] = [];
    for (const [storedKey, value] of removable) {
        if (usedBytes + requiredBytes <= MAX_SESSION_BYTES && handoffCount < MAX_HANDOFF_RECORDS) break;
        remove.push(storedKey); usedBytes -= estimatedSessionBytes(storedKey, value); handoffCount--;
    }
    if (usedBytes + requiredBytes > MAX_SESSION_BYTES || handoffCount >= MAX_HANDOFF_RECORDS) {
        return { ok: false, error: 'handoff_storage_full' };
    }
    if (remove.length) await chrome.storage.session.remove(remove);
    // Paint a small local loading page before any website navigation. Its ready
    // message waits behind this lock, so the project is bound before launch.
    const launchUrl = `${chrome.runtime.getURL('handoff.html')}?token=${token}&lang=${locale ?? 'en'}`;
    const tab = await chrome.tabs.create({ url: launchUrl, active: true });
    if (tab.id === undefined) return { ok: false, error: 'handoff_failed' };
    const record: HandoffRecord = { ...pending, tabId: tab.id, launchUrl };
    try {
        await chrome.storage.session.set({ [key]: record });
        return { ok: true, token, tabId: tab.id };
    } catch {
        await chrome.storage.session.remove(key);
        await chrome.tabs.remove(tab.id).catch((): void => undefined);
        return { ok: false, error: 'handoff_failed' };
    }
}

export async function handleCaptureMessage(message: unknown, sender: BeadCaptureSender): Promise<RuntimeResult> {
    if (!isRecord(message) || typeof message.type !== 'string') return { ok: false, error: 'invalid_message' };
    if (message.type === 'launch-handoff') {
        if (!isExtensionToken(message.token)) return { ok: false, error: 'invalid_message' };
        const token = message.token;
        return withSessionLock(async () => {
            const key = HANDOFF_PREFIX + token;
            const record = (await chrome.storage.session.get(key))[key] as HandoffRecord | undefined;
            if (!record || !isFreshTimestamp(record.createdAt)) return { ok: false, error: 'handoff_expired' };
            if (record.delivered || record.token !== token || !record.launchUrl ||
                sender.id !== chrome.runtime.id || sender.frameId !== 0 || sender.url !== record.launchUrl ||
                sender.tab?.id !== record.tabId) return { ok: false, error: 'unauthorized' };
            if (record.launched) return { ok: true };
            try {
                await chrome.tabs.update(record.tabId, { url: record.targetUrl });
                await chrome.storage.session.set({ [key]: { ...record, launched: true } });
                return { ok: true };
            } catch { return { ok: false, error: 'handoff_failed' }; }
        });
    }
    // Authorize before touching storage or starting network work.
    const studio = isStudioSender(sender, chrome.runtime.id);
    if (['read-source', 'fetch-source', 'create-handoff'].includes(message.type)) {
        if (!studio) return { ok: false, error: 'unauthorized' };
        if (message.type === 'create-handoff') return withSessionLock(async () => {
            await cleanSession();
            return createHandoff(message.project, message.locale);
        });
        if (!isExtensionToken(message.token)) return { ok: false, error: 'invalid_message' };
        const sourceToken = message.token;
        const record = await withSessionLock(async () => {
            await cleanSession();
            return readSource(sourceToken, sender);
        });
        if (!record) return { ok: false, error: 'source_expired' };
        if (message.type === 'fetch-source') return fetchSource(record);
        const { url, capturedAt, tabId, windowId } = record;
        const originPattern = getImageOriginPattern(url);
        const permissionGranted = originPattern !== null &&
            await chrome.permissions.contains({ origins: [originPattern] });
        return { ok: true, source: { url, capturedAt, tabId, windowId }, originPattern, permissionGranted };
    }
    if (!['read-handoff', 'finish-handoff'].includes(message.type) || !isExtensionToken(message.token)) return { ok: false, error: 'invalid_message' };
    return withSessionLock(async () => {
    const key = HANDOFF_PREFIX + message.token, stored = await chrome.storage.session.get(key);
    const record = stored[key] as HandoffRecord | undefined;
    if (!record || !isFreshTimestamp(record.createdAt, Date.now(), HANDOFF_TTL_MS)) {
        if (record) await chrome.storage.session.remove(key);
        return { ok: false, error: 'handoff_expired' };
    }
    if (message.type === 'read-handoff') {
        if (!isAuthorizedHandoffSender(record, sender, chrome.runtime.id, message.token)) return { ok: false, error: 'unauthorized' };
        await chrome.storage.session.set({ [key]: { ...record, delivered: true, deliveredDocumentId: sender.documentId } });
        return { ok: true, project: record.project };
    }
    if (!record.delivered || !isAuthorizedHandoffFinish(record, sender, chrome.runtime.id, message.token) ||
        (record.deliveredDocumentId !== undefined && record.deliveredDocumentId !== sender.documentId)) return { ok: false, error: 'unauthorized' };
    if (message.result !== 'accepted' && message.result !== 'dismissed') return { ok: false, error: 'invalid_message' };
    await chrome.storage.session.remove(key);
    return { ok: true };
    });
}

chrome.runtime.onInstalled.addListener(() => {
    void chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }).catch((): void => undefined);
    void chrome.contextMenus.removeAll().then(() => {
        chrome.contextMenus.create({ id: MENU_ID, title: 'Make a bead pattern', contexts: ['image'], documentUrlPatterns: ['http://*/*', 'https://*/*'] });
    }).catch((): void => undefined);
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID || info.mediaType !== 'image') return;
    // Unsupported sources need an explanation, not additional site access.
    const originPattern = getImageOriginPattern(info.srcUrl);
    const permission = originPattern ? requestLaunchPermission(originPattern) : Promise.resolve(false);
    void permission.then(() => withSessionLock(() => openStudio(info, tab))).catch((): void => undefined);
});
chrome.action.onClicked.addListener(() => {
    const permission = requestLaunchPermission();
    // Declining still leaves local-file conversion available in the workspace.
    void permission.then(() => withSessionLock(() => openStudio())).catch((): void => undefined);
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    void handleCaptureMessage(message, sender).then(sendResponse, () => sendResponse({ ok: false, error: 'operation_failed' }));
    return true;
});
chrome.tabs.onRemoved.addListener(tabId => {
    void withSessionLock(async () => {
        const stored = await chrome.storage.session.get(null);
        const keys = Object.entries(stored).filter(([key, value]) => isRecord(value) &&
            ((key.startsWith(SOURCE_PREFIX) && value.studioTabId === tabId) || (key.startsWith(HANDOFF_PREFIX) && value.tabId === tabId))).map(([key]) => key);
        if (keys.length) await chrome.storage.session.remove(keys);
    }).catch((): void => undefined);
});

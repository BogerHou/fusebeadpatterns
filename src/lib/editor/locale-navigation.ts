import {
    EDITOR_DRAFT_STORAGE_KEY,
    EDITOR_PROJECT_FILE_TYPE,
    parseEditorProject,
    type EditorDraft,
} from './draft';
import { parseEditorLocaleContext, type EditorLocaleContext } from './locale-context';
import { createPixelLocaleStore, type PixelLocaleStore } from '../pixel-grid/locale-storage';

export const EDITOR_LOCALE_RESTORE_KEY = 'bead-pattern-editor-locale-restore-v1';
const RESTORE_MAX_AGE_MS = 5 * 60 * 1_000;
// Includes the original image, current pixels and the full 32 MiB history.
// Transfers fail explicitly beyond this bound; history is never shortened.
const TRANSFER_MAX_CHARACTERS = 128 * 1024 * 1024;
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type EditorLocaleRecovery = {
    draft: EditorDraft;
    acceptedPatternId: string | null;
    context?: EditorLocaleContext | null;
};

type LargeTransferPointer = {
    version: 2;
    key: string;
    destination: string;
    savedAt: number;
};
// take() consumes its record in the same transaction. Retain a failed transfer
// in this document as well, so a failed attempt to put it back cannot turn a
// subsequent retry into an ordinary, history-free draft restore.
let failedLargeTransfer: { key: string; raw: string; expiresAt: number } | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCurrent(savedAt: unknown, now: number): savedAt is number {
    return typeof savedAt === 'number' && Number.isFinite(savedAt) &&
        now >= savedAt && now - savedAt <= RESTORE_MAX_AGE_MS;
}

function clearMarker(storage: DraftStorage): void {
    try { storage.removeItem(EDITOR_LOCALE_RESTORE_KEY); } catch { /* The decoded work still wins when cleanup is unavailable. */ }
}

function parseDraft(value: unknown): EditorDraft | null {
    return parseEditorProject(JSON.stringify({
        type: EDITOR_PROJECT_FILE_TYPE,
        version: 1,
        draft: value,
    }));
}

function parseRecovery(draftValue: unknown, acceptedPatternId: unknown, contextValue: unknown): EditorLocaleRecovery | null {
    if (acceptedPatternId != null && typeof acceptedPatternId !== 'string') {
        if (contextValue != null) throw new Error('Invalid editor language context');
        return null;
    }
    const draft = parseDraft(draftValue);
    if (!draft || !hasEditorDraftContent(draft)) {
        if (contextValue != null) throw new Error('Invalid editor language context');
        return null;
    }
    const context = contextValue == null ? null : parseEditorLocaleContext(contextValue, draft);
    if (contextValue != null && !context) throw new Error('Invalid editor language context');
    return { draft, acceptedPatternId: typeof acceptedPatternId === 'string' ? acceptedPatternId : null, context };
}

function largePointer(raw: string | null): LargeTransferPointer | null {
    if (!raw || raw.length > 2048) return null;
    try {
        const value: unknown = JSON.parse(raw);
        return isRecord(value) && value.version === 2 && typeof value.key === 'string' &&
            /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value.key) &&
            typeof value.destination === 'string' && typeof value.savedAt === 'number' && Number.isFinite(value.savedAt)
            ? value as LargeTransferPointer : null;
    } catch { return null; }
}

export function hasEditorDraftContent(draft: EditorDraft): boolean {
    return draft.sourceMode === 'blank' || Boolean(draft.imageSrc) || Boolean(draft.editedPattern);
}

function destinationKey(href: string): string {
    const url = new URL(href, 'https://fusebeadpatterns.art');
    return `${url.pathname}${url.search}`;
}

/** The marker is tab-local and single-use; no image or draft data enters the URL. */
export function saveEditorLocaleDraft(
    draft: EditorDraft,
    href: string,
    storage: DraftStorage,
    now = Date.now(),
    acceptedPatternId: string | null = null,
    context: EditorLocaleContext | null = null
): boolean {
    if (!hasEditorDraftContent(draft)) {
        failedLargeTransfer = null;
        try { storage.removeItem(EDITOR_LOCALE_RESTORE_KEY); } catch { /* No content requires no storage. */ }
        return true;
    }
    try {
        storage.removeItem(EDITOR_LOCALE_RESTORE_KEY);
        failedLargeTransfer = null;
        if (!parseRecovery(draft, acceptedPatternId, context)) return false;
        const rawDraft = JSON.stringify(draft);
        const rawMarker = JSON.stringify({
            destination: destinationKey(href),
            savedAt: now,
            acceptedPatternId,
            context,
        });
        if (!isCurrent(now, now) || rawDraft.length + rawMarker.length > TRANSFER_MAX_CHARACTERS) return false;
        storage.setItem(EDITOR_DRAFT_STORAGE_KEY, rawDraft);
        if (storage.getItem(EDITOR_DRAFT_STORAGE_KEY) !== rawDraft) throw new Error('Editor transfer draft was not saved');
        storage.setItem(EDITOR_LOCALE_RESTORE_KEY, rawMarker);
        if (storage.getItem(EDITOR_LOCALE_RESTORE_KEY) !== rawMarker) throw new Error('Editor transfer marker was not saved');
        return true;
    } catch {
        try {
            storage.removeItem(EDITOR_LOCALE_RESTORE_KEY);
        } catch {
            // If storage access itself is blocked, the caller still stays put.
        }
        return false;
    }
}

export function consumeEditorLocaleDraft(
    href: string,
    storage: DraftStorage,
    now = Date.now()
): EditorLocaleRecovery | null {
    // Unavailable storage is not an absent transfer. The workspace can protect
    // its draft and retry without deleting the tab-local recovery marker.
    const rawMarker = storage.getItem(EDITOR_LOCALE_RESTORE_KEY);
    if (!rawMarker) return null;
    let marker: Record<string, unknown>;
    try {
        if (rawMarker.length > TRANSFER_MAX_CHARACTERS) throw new Error('Editor transfer exceeds supported size');
        const value: unknown = JSON.parse(rawMarker);
        if (!isRecord(value)) throw new Error('Invalid editor transfer');
        if (value.version === 2 && largePointer(rawMarker)) return null;
        if ((value.version !== undefined && value.version !== 1) || !isCurrent(value.savedAt, now) || typeof value.destination !== 'string') {
            throw new Error('Invalid editor transfer marker');
        }
        marker = value;
    } catch {
        clearMarker(storage);
        return null;
    }
    if (marker.destination !== destinationKey(href)) return null;
    const rawDraft = storage.getItem(EDITOR_DRAFT_STORAGE_KEY);
    let draftValue: unknown;
    try {
        if (!rawDraft || rawDraft.length + rawMarker.length > TRANSFER_MAX_CHARACTERS) throw new Error('Invalid editor transfer draft');
        draftValue = JSON.parse(rawDraft);
    } catch {
        if (marker.context != null) throw new Error('Invalid editor language context');
        clearMarker(storage);
        return null;
    }
    // Context corruption must not silently fall back to the ordinary draft.
    // Keep the marker so the caller can protect the canvas and offer a retry.
    const recovery = parseRecovery(draftValue, marker.acceptedPatternId, marker.context);
    clearMarker(storage);
    return recovery;
}

export function hasLargeEditorLocaleDraft(storage: DraftStorage): boolean {
    return largePointer(storage.getItem(EDITOR_LOCALE_RESTORE_KEY)) !== null;
}

/** Commit the entire temporary workspace before writing its small per-tab pointer. */
export async function saveLargeEditorLocaleDraft(
    draft: EditorDraft,
    href: string,
    storage: DraftStorage,
    now = Date.now(),
    acceptedPatternId: string | null = null,
    context: EditorLocaleContext | null = null,
    store: PixelLocaleStore = createPixelLocaleStore()
): Promise<boolean> {
    let key: string | undefined;
    try {
        const previous = largePointer(storage.getItem(EDITOR_LOCALE_RESTORE_KEY));
        storage.removeItem(EDITOR_LOCALE_RESTORE_KEY);
        failedLargeTransfer = null;
        if (previous) await store.remove(previous.key);
        if (!hasEditorDraftContent(draft)) return true;
        if (!isCurrent(now, now) || !parseRecovery(draft, acceptedPatternId, context)) return false;
        const destination = destinationKey(href);
        const raw = JSON.stringify({ version: 1, destination, savedAt: now, acceptedPatternId, draft, context });
        if (raw.length > TRANSFER_MAX_CHARACTERS) return false;
        key = crypto.randomUUID();
        await store.put(key, raw, now + RESTORE_MAX_AGE_MS);
        const pointer = JSON.stringify({ version: 2, key, destination, savedAt: now });
        if (!largePointer(pointer)) throw new Error('Invalid editor transfer pointer');
        storage.setItem(EDITOR_LOCALE_RESTORE_KEY, pointer);
        if (storage.getItem(EDITOR_LOCALE_RESTORE_KEY) !== pointer) throw new Error('Editor transfer pointer was not saved');
        return true;
    } catch {
        clearMarker(storage);
        if (key) { try { await store.remove(key); } catch { /* Expired records are pruned by the temporary store. */ } }
        return false;
    }
}

/** A storage read failure rejects without consuming its marker, allowing a safe retry. */
export async function consumeLargeEditorLocaleDraft(
    href: string,
    storage: DraftStorage,
    now = Date.now(),
    store: PixelLocaleStore = createPixelLocaleStore()
): Promise<EditorLocaleRecovery | null> {
    const rawMarker = storage.getItem(EDITOR_LOCALE_RESTORE_KEY);
    const pointer = largePointer(rawMarker);
    if (!pointer) {
        if (rawMarker) {
            try {
                const value: unknown = JSON.parse(rawMarker);
                if (!isRecord(value) || value.version === 2) clearMarker(storage);
            } catch { clearMarker(storage); }
        }
        return null;
    }
    if (!isCurrent(pointer.savedAt, now)) {
        if (failedLargeTransfer?.key === pointer.key) failedLargeTransfer = null;
        clearMarker(storage);
        try { await store.remove(pointer.key); } catch { /* The expired record cannot be restored and will be pruned later. */ }
        return null;
    }
    if (pointer.destination !== destinationKey(href)) return null;
    const cached = failedLargeTransfer?.key === pointer.key && failedLargeTransfer.expiresAt >= now
        ? failedLargeTransfer : null;
    const raw = cached?.raw ?? await store.take(pointer.key);
    let recovery: EditorLocaleRecovery;
    try {
        if (!raw || raw.length > TRANSFER_MAX_CHARACTERS) throw new Error('Invalid large editor transfer');
        const parsed: unknown = JSON.parse(raw);
        if (!isRecord(parsed) || parsed.version !== 1 || parsed.destination !== pointer.destination ||
            parsed.savedAt !== pointer.savedAt || !isCurrent(parsed.savedAt, now)) throw new Error('Invalid large editor transfer marker');
        const parsedRecovery = parseRecovery(parsed.draft, parsed.acceptedPatternId, parsed.context);
        if (!parsedRecovery) throw new Error('Invalid large editor transfer draft');
        recovery = parsedRecovery;
    } catch (error) {
        // A valid matching pointer promises a complete transfer. Missing or
        // corrupt data is not permission to load the ordinary draft and lose
        // its history. Keep protecting the canvas until expiry or explicit exit.
        if (raw !== null) {
            failedLargeTransfer = { key: pointer.key, raw, expiresAt: pointer.savedAt + RESTORE_MAX_AGE_MS };
            try { await store.put(pointer.key, raw, pointer.savedAt + RESTORE_MAX_AGE_MS); } catch { /* The same-page retry cache still protects this transfer. */ }
        }
        throw error;
    }
    if (cached) { try { await store.remove(pointer.key); } catch { /* A complete in-memory recovery must survive cleanup failure. */ } }
    if (failedLargeTransfer?.key === pointer.key) failedLargeTransfer = null;
    clearMarker(storage);
    return recovery;
}

export function getEditorLocaleRestoreHref(href: string, recovery: EditorLocaleRecovery): string {
    const url = new URL(href, 'https://fusebeadpatterns.art');
    if (recovery.acceptedPatternId && url.searchParams.get('pattern') === recovery.acceptedPatternId) {
        url.searchParams.delete('pattern');
    }
    return `${url.pathname}${url.search}${url.hash}`;
}

/** A restored edit wins over the library request that originally opened it. */
export function clearRestoredPatternQuery(href: string): string {
    const url = new URL(href, 'https://fusebeadpatterns.art');
    url.searchParams.delete('pattern');
    return `${url.pathname}${url.search}${url.hash}`;
}

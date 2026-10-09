import {
    EDITOR_DRAFT_STORAGE_KEY,
    EDITOR_PROJECT_FILE_TYPE,
    parseEditorProject,
    type EditorDraft,
} from './draft';

export const EDITOR_LOCALE_RESTORE_KEY = 'bead-pattern-editor-locale-restore-v1';
const RESTORE_MAX_AGE_MS = 5 * 60 * 1_000;
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type EditorLocaleRecovery = {
    draft: EditorDraft;
    acceptedPatternId: string | null;
};

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
    acceptedPatternId: string | null = null
): boolean {
    if (!hasEditorDraftContent(draft)) {
        try { storage.removeItem(EDITOR_LOCALE_RESTORE_KEY); } catch { /* No content requires no storage. */ }
        return true;
    }
    try {
        storage.removeItem(EDITOR_LOCALE_RESTORE_KEY);
        storage.setItem(EDITOR_DRAFT_STORAGE_KEY, JSON.stringify(draft));
        storage.setItem(EDITOR_LOCALE_RESTORE_KEY, JSON.stringify({
            destination: destinationKey(href),
            savedAt: now,
            acceptedPatternId,
        }));
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
    try {
        const rawMarker = storage.getItem(EDITOR_LOCALE_RESTORE_KEY);
        if (!rawMarker) return null;
        const marker = JSON.parse(rawMarker) as { destination?: unknown; savedAt?: unknown; acceptedPatternId?: unknown };
        if (typeof marker.savedAt !== 'number' || now < marker.savedAt || now - marker.savedAt > RESTORE_MAX_AGE_MS) {
            storage.removeItem(EDITOR_LOCALE_RESTORE_KEY);
            return null;
        }
        if (marker.destination !== destinationKey(href)) return null;
        storage.removeItem(EDITOR_LOCALE_RESTORE_KEY);
        if (marker.acceptedPatternId != null && typeof marker.acceptedPatternId !== 'string') return null;
        const rawDraft = storage.getItem(EDITOR_DRAFT_STORAGE_KEY);
        if (!rawDraft) return null;
        const draft = parseEditorProject(JSON.stringify({
            type: EDITOR_PROJECT_FILE_TYPE,
            version: 1,
            draft: JSON.parse(rawDraft),
        }));
        return draft && hasEditorDraftContent(draft)
            ? { draft, acceptedPatternId: typeof marker.acceptedPatternId === 'string' ? marker.acceptedPatternId : null }
            : null;
    } catch {
        return null;
    }
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

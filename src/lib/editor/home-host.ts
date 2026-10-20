import type { EditorDraft } from './draft';

/** Local hosts reuse the homepage converter without website navigation/storage. */
export interface EditorHomeHost {
    incomingImage?: { id: string; file: File };
    onImageConsumed?(id: string): void;
    onImageError?(id: string, error: Error): void;
    onUserSourceChange?(): void;
    onOpenEditor(draft: EditorDraft): Promise<void>;
    /** A positive, increasing counter, for a host's own Editor navigation link. */
    requestOpenEditor?: number;
    /** Cancels a host image without cancelling a subsequent manual upload. */
    cancelIncomingImage?: number;
}

/** A late import must never win over a user's replacement or explicit cancel. */
export class HomeHostImageRequests {
    private handled = new Set<string>();
    private revision = 0;

    claim(id: string): { id: string; revision: number } | null {
        if (this.handled.has(id)) return null;
        this.handled.add(id);
        return { id, revision: ++this.revision };
    }

    cancel(incomingId?: string): void {
        if (incomingId) this.handled.add(incomingId);
        this.revision++;
    }

    isCurrent(request: { revision: number }): boolean {
        return request.revision === this.revision;
    }
}

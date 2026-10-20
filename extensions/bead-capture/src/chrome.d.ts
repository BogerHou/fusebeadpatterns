type BeadCaptureTab = { id?: number; windowId?: number; url?: string };
type BeadCaptureSender = { id?: string; url?: string; frameId?: number; documentId?: string; tab?: BeadCaptureTab };
type BeadCaptureEvent<T> = { addListener(listener: T): void };
type BeadCaptureChrome = {
    runtime: {
        id: string;
        getURL(path: string): string;
        sendMessage<T = unknown>(message: unknown): Promise<T>;
        onInstalled: BeadCaptureEvent<() => void>;
        onMessage: BeadCaptureEvent<(message: unknown, sender: BeadCaptureSender, sendResponse: (response: unknown) => void) => boolean | void>;
    };
    contextMenus: {
        create(options: { id: string; title: string; contexts: string[]; documentUrlPatterns?: string[] }): string | number;
        removeAll(): Promise<void>;
        onClicked: BeadCaptureEvent<(info: { menuItemId: string | number; srcUrl?: string; mediaType?: string }, tab?: BeadCaptureTab) => void>;
    };
    action: { onClicked: BeadCaptureEvent<(tab: BeadCaptureTab) => void> };
    tabs: {
        create(options: { url: string; active?: boolean; windowId?: number }): Promise<BeadCaptureTab>;
        update(tabId: number, options: { url: string }): Promise<BeadCaptureTab>;
        remove(tabId: number): Promise<void>;
        onRemoved: BeadCaptureEvent<(tabId: number) => void>;
    };
    permissions: {
        contains(permissions: { origins: string[] }, callback: (granted: boolean) => void): void;
        contains(permissions: { origins: string[] }): Promise<boolean>;
        request(permissions: { origins: string[] }): Promise<boolean>;
        remove(permissions: { origins: string[] }): Promise<boolean>;
    };
    storage: {
        session: {
            get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
            set(values: Record<string, unknown>): Promise<void>;
            remove(keys: string | string[]): Promise<void>;
            setAccessLevel(options: { accessLevel: 'TRUSTED_CONTEXTS' }): Promise<void>;
        };
    };
};
declare const chrome: BeadCaptureChrome;

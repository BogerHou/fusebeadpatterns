import { afterEach, describe, expect, it, vi } from 'vitest';
import { maintainNotFoundTitle } from './not-found-title';

afterEach(() => vi.unstubAllGlobals());

function titleDocument() {
    const boundary = { isConnected: true };
    let currentBoundary: typeof boundary | null = boundary;
    let title = 'Page not found | Fuse Bead Patterns';
    let notify: () => void = () => {};
    const writes = vi.fn((value: string) => { title = value; });
    const observe = vi.fn();
    const disconnect = vi.fn();
    const documentElement = {};
    vi.stubGlobal('document', {
        documentElement,
        querySelector: () => currentBoundary,
        get title() { return title; },
        set title(value: string) { writes(value); },
    });
    vi.stubGlobal('MutationObserver', class {
        constructor(callback: () => void) { notify = callback; }
        observe = observe;
        disconnect = disconnect;
    });
    return {
        boundary, writes, observe, disconnect, documentElement,
        notify: () => notify(),
        frameworkWrites: (value: string) => { title = value; notify(); },
        normalPageReplacesBoundary: () => { boundary.isConnected = false; currentBoundary = null; },
    };
}

describe('active global 404 title synchronization', () => {
    const japaneseTitle = 'ページが見つかりません | Fuse Bead Patterns';

    it('observes metadata mutations and sets the native title without a timer', () => {
        const page = titleDocument();
        const cleanup = maintainNotFoundTitle(japaneseTitle);
        expect(document.title).toBe(japaneseTitle);
        expect(page.observe).toHaveBeenCalledWith(page.documentElement, { childList: true, subtree: true, characterData: true });
        cleanup();
    });

    it('restores the native title after a later framework metadata rewrite or title replacement', () => {
        const page = titleDocument();
        const cleanup = maintainNotFoundTitle(japaneseTitle);
        page.frameworkWrites('Page not found | Fuse Bead Patterns');
        expect(document.title).toBe(japaneseTitle);
        page.frameworkWrites('');
        expect(document.title).toBe(japaneseTitle);
        page.frameworkWrites('Page not found | Fuse Bead Patterns');
        expect(document.title).toBe(japaneseTitle);
        cleanup();
    });

    it('does not repeatedly write an already synchronized title', () => {
        const page = titleDocument();
        const cleanup = maintainNotFoundTitle(japaneseTitle);
        page.notify(); page.notify();
        expect(page.writes).toHaveBeenCalledTimes(1);
        cleanup();
    });

    it('disconnects on unmount and ignores a queued stale observer callback', () => {
        const page = titleDocument();
        const cleanup = maintainNotFoundTitle(japaneseTitle);
        cleanup();
        expect(page.disconnect).toHaveBeenCalledOnce();
        page.frameworkWrites('Normal guide title');
        expect(document.title).toBe('Normal guide title');
        expect(page.writes).toHaveBeenCalledTimes(1);
    });

    it('protects the next normal page even before passive-effect cleanup runs', () => {
        const page = titleDocument();
        const cleanup = maintainNotFoundTitle(japaneseTitle);
        page.normalPageReplacesBoundary();
        page.frameworkWrites('Normal guide title');
        expect(document.title).toBe('Normal guide title');
        expect(page.writes).toHaveBeenCalledTimes(1);
        cleanup();
    });
});

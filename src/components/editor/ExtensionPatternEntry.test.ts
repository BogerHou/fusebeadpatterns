import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditorDraft } from '../../lib/editor/draft';
import { createEditorDraft, encodeEditorProjectPattern, serializeEditorProject } from '../../lib/editor/draft';
import { getPaletteOption, parsePaletteCsv } from '../../lib/editor/config';
import { EXTENSION_MESSAGE_SOURCE, makeHandoffUrl } from '../../lib/browser-extension/protocol';

// Exercise the component's message/effect lifecycle without a foreground browser.
// The harness runs only this component, leaving its project validation real.
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, pending: [] as (() => void)[], dirty: false }));
type EffectSlot = { deps: readonly unknown[]; cleanup?: () => void };
vi.mock('react', async original => {
    const react = await original<typeof import('react')>();
    const same = (a: readonly unknown[] | undefined, b: readonly unknown[]) => a?.length === b.length && b.every((value, index) => Object.is(value, a[index]));
    return { ...react,
        useRef: (value: unknown) => {
            const index = hooks.cursor++;
            return hooks.slots[index] ?? (hooks.slots[index] = { current: value });
        },
        useState: (value: unknown) => {
            const index = hooks.cursor++;
            const slot = (hooks.slots[index] ??= { value }) as { value: unknown };
            return [slot.value, (next: unknown) => {
                const updated = typeof next === 'function' ? next(slot.value) : next;
                if (!Object.is(updated, slot.value)) { slot.value = updated; hooks.dirty = true; }
            }];
        },
        useCallback: (callback: unknown, deps: readonly unknown[]) => {
            const index = hooks.cursor++, prior = hooks.slots[index] as { callback: unknown; deps: readonly unknown[] } | undefined;
            if (!prior || !same(prior.deps, deps)) hooks.slots[index] = { callback, deps };
            return (hooks.slots[index] as { callback: unknown }).callback;
        },
        useEffect: (effect: () => (() => void) | undefined, deps: readonly unknown[]) => {
            const index = hooks.cursor++, prior = hooks.slots[index] as EffectSlot | undefined;
            if (prior && same(prior.deps, deps)) return;
            const slot: EffectSlot = { deps };
            hooks.slots[index] = slot;
            hooks.pending.push(() => { prior?.cleanup?.(); slot.cleanup = effect(); });
        },
    };
});
vi.mock('next/navigation', () => ({ useSearchParams: () => new URL(window.location.href).searchParams }));
vi.mock('../ui/Button', () => ({ Button: 'button' }));
vi.mock('@/lib/editor/config', async () => import('../../lib/editor/config'));
vi.mock('@/lib/editor/pixel-bead-entry', async () => import('../../lib/editor/pixel-bead-entry'));
vi.mock('@/lib/editor/project-open-copy', async () => import('../../lib/editor/project-open-copy'));
vi.mock('@/lib/pixel-grid/bead-copy', async () => import('../../lib/pixel-grid/bead-copy'));
vi.mock('@/lib/browser-extension/protocol', async () => import('../../lib/browser-extension/protocol'));
import { ExtensionPatternEntry } from './ExtensionPatternEntry';

const token = 'beadbead-1234-4321-9123-123456789abc';
const otherToken = 'beadbead-1234-4321-9123-123456789abd';
type Props = Parameters<typeof ExtensionPatternEntry>[0];
let props: Props;
let tree: unknown;
let fakeWindow: {
    location: { href: string; origin: string }; history: { replaceState: ReturnType<typeof vi.fn> };
    postMessage: ReturnType<typeof vi.fn>; confirm: ReturnType<typeof vi.fn>;
    addEventListener: (event: string, listener: (event: MessageEvent) => void) => void;
    removeEventListener: (event: string, listener: (event: MessageEvent) => void) => void;
    setInterval: ReturnType<typeof vi.fn>; clearInterval: ReturnType<typeof vi.fn>;
};
let listeners: Set<(event: MessageEvent) => void>;
function incoming() {
    const pixels = new Uint8ClampedArray(29 * 29 * 4); pixels.set([0, 0, 0, 255], 12);
    return createEditorDraft({ sourceMode: 'blank', imageSrc: null, fileName: 'capture', selectedPaletteIds: ['perler'],
        activePalettes: [parsePaletteCsv('P01,Black,B,0,0,0', getPaletteOption('perler')!)], boardId: 'midi', boardWidth: 1, boardHeight: 1,
        matchingId: 'euclidean', ditheringId: 'none', useSymbols: true, exportFormatId: 'pdf',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: false, fit: false, showGrid: true }, previewZoom: 1,
        editedPattern: encodeEditorProjectPattern(pixels, 29, 29) });
}
function render() {
    hooks.cursor = 0; hooks.dirty = false; tree = ExtensionPatternEntry(props);
    const effects = hooks.pending.splice(0); for (const effect of effects) effect();
}
async function flush() {
    for (let i = 0; i < 10; i++) { if (hooks.dirty) render(); await Promise.resolve(); }
}
async function receive(draft = incoming(), receivedToken = token) {
    for (const listener of listeners) listener({ source: fakeWindow, origin: fakeWindow.location.origin,
        data: { source: EXTENSION_MESSAGE_SOURCE, type: 'extension-project', token: receivedToken, project: serializeEditorProject(draft) } } as unknown as MessageEvent);
    await flush();
}
function button(label: string): { onClick: () => void } {
    function find(node: unknown): { onClick: () => void } | null {
        if (Array.isArray(node)) return node.map(find).find(Boolean) ?? null;
        if (!node || typeof node !== 'object' || !('props' in node)) return null;
        const element = node as { type: unknown; props: { children?: unknown; onClick?: () => void } };
        if (element.type === 'button' && element.props.children === label) return element.props as { onClick: () => void };
        return find(element.props.children);
    }
    const result = find(tree); if (!result) throw new Error(`Missing button: ${label}`); return result;
}
beforeEach(() => {
    hooks.slots = []; hooks.cursor = 0; hooks.pending = []; hooks.dirty = false; listeners = new Set();
    fakeWindow = {
        location: { href: makeHandoffUrl(token), origin: 'https://fusebeadpatterns.art' },
        history: { replaceState: vi.fn((_state: unknown, _title: string, url: string) => {
            fakeWindow.location.href = new URL(url, fakeWindow.location.href).href;
            hooks.dirty = true;
        }) },
        postMessage: vi.fn(), confirm: vi.fn().mockReturnValue(true),
        addEventListener: (_event, listener) => { listeners.add(listener); },
        removeEventListener: (_event, listener) => { listeners.delete(listener); },
        setInterval: vi.fn().mockReturnValue(1), clearInterval: vi.fn(),
    };
    vi.stubGlobal('window', fakeWindow);
    props = { locale: 'en', hasCurrentPattern: false, canSaveCurrentPattern: false, busy: false,
        onOpen: vi.fn<(draft: EditorDraft, signal: AbortSignal) => Promise<void>>().mockResolvedValue(undefined),
        onSave: vi.fn(), onLoadingChange: vi.fn(), onPendingChange: vi.fn() };
});
afterEach(() => {
    for (const slot of hooks.slots) if (slot && typeof slot === 'object' && 'cleanup' in slot) (slot as EffectSlot).cleanup?.();
    vi.unstubAllGlobals();
});

describe('extension project entry', () => {
    it('opens once in a ready empty editor and accepts only after installation finishes', async () => {
        let finish!: () => void;
        props.onOpen = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
        render(); await flush();
        expect(props.onPendingChange).toHaveBeenLastCalledWith('receiving');
        const draft = incoming(); await receive(draft);
        expect(props.onPendingChange).toHaveBeenLastCalledWith('preparing');
        expect(props.onOpen).toHaveBeenCalledOnce(); expect(fakeWindow.confirm).not.toHaveBeenCalled();
        expect(vi.mocked(props.onOpen).mock.calls[0][0].editedPattern).toEqual(draft.editedPattern);
        expect(fakeWindow.postMessage.mock.calls.some(([data]) => data.type === 'extension-accepted')).toBe(false);
        finish(); await flush();
        expect(fakeWindow.postMessage.mock.calls.filter(([data]) => data.type === 'extension-accepted')).toHaveLength(1);
        expect(fakeWindow.location.href).toBe('https://fusebeadpatterns.art/editor');
        expect(props.onPendingChange).toHaveBeenLastCalledWith(null);
    });
    it('preserves existing work and its save option until explicit confirmation', async () => {
        props.hasCurrentPattern = true; props.canSaveCurrentPattern = true;
        render(); await flush(); await receive();
        expect(props.onOpen).not.toHaveBeenCalled();
        expect(props.onPendingChange).toHaveBeenLastCalledWith(null);
        button('Save current bead project').onClick(); expect(props.onSave).toHaveBeenCalledOnce();
        fakeWindow.confirm.mockReturnValue(false); button('Open this pattern').onClick(); await flush();
        expect(props.onOpen).not.toHaveBeenCalled();
        fakeWindow.confirm.mockReturnValue(true); button('Open this pattern').onClick(); await flush();
        expect(props.onOpen).toHaveBeenCalledOnce(); expect(fakeWindow.confirm).toHaveBeenCalledTimes(2);
    });
    it('waits while busy and does not overwrite work created while the message was in flight', async () => {
        props.busy = true; render(); await flush(); await receive();
        expect(props.onOpen).not.toHaveBeenCalled();
        props = { ...props, busy: false, hasCurrentPattern: true }; render(); await flush();
        expect(props.onOpen).not.toHaveBeenCalled(); expect(fakeWindow.confirm).not.toHaveBeenCalled();
        button('Keep current work').onClick(); await flush(); expect(props.onOpen).not.toHaveBeenCalled();
    });
    it('never installs an old received grid when navigation changes the handoff token', async () => {
        props.busy = true; render(); await flush(); await receive();
        fakeWindow.location.href = makeHandoffUrl(otherToken); props = { ...props, busy: false }; render(); await flush();
        expect(props.onOpen).not.toHaveBeenCalled();
        await receive(incoming(), token); expect(props.onOpen).not.toHaveBeenCalled();
        await receive(incoming(), otherToken); expect(props.onOpen).toHaveBeenCalledOnce();
    });
    it('keeps a failed automatic install available for manual retry without consuming or looping', async () => {
        vi.mocked(props.onOpen).mockRejectedValueOnce(new Error('canvas unavailable'));
        render(); await flush(); await receive(); await flush();
        expect(props.onOpen).toHaveBeenCalledOnce();
        expect(fakeWindow.postMessage.mock.calls.some(([data]) => data.type === 'extension-accepted')).toBe(false);
        button('Open this pattern').onClick(); await flush(); expect(props.onOpen).toHaveBeenCalledTimes(2);
    });
    it('clears the waiting indicator on transfer failure and restores it on retry', async () => {
        render(); await flush();
        expect(props.onPendingChange).toHaveBeenLastCalledWith('receiving');
        for (const listener of listeners) listener({ source: fakeWindow, origin: fakeWindow.location.origin,
            data: { source: EXTENSION_MESSAGE_SOURCE, type: 'extension-error', token } } as unknown as MessageEvent);
        await flush();
        expect(props.onPendingChange).toHaveBeenLastCalledWith(null);
        button('Try again').onClick(); await flush();
        expect(props.onPendingChange).toHaveBeenLastCalledWith('receiving');
    });
    it('stops waiting after the reply timeout instead of leaving a permanent spinner', async () => {
        render(); await flush();
        const tick = fakeWindow.setInterval.mock.calls[0][0] as () => void;
        for (let attempt = 0; attempt < 15; attempt++) tick();
        await flush();
        expect(props.onPendingChange).toHaveBeenLastCalledWith(null);
        expect(props.onOpen).not.toHaveBeenCalled();
    });
    it('does not show a transfer spinner for an invalid or absent token', async () => {
        for (const search of ['', '?extension-project=invalid']) {
            fakeWindow.location.href = `https://fusebeadpatterns.art/editor${search}`;
            render(); await flush();
            expect(props.onPendingChange).toHaveBeenLastCalledWith(null);
        }
    });
});

import { createElement, type ComponentProps, type EffectCallback } from 'react';
import { jsx } from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PatternQuickDownloads from './PatternQuickDownloads';

const state = vi.hoisted(() => ({ effect: undefined as EffectCallback | undefined, element: undefined as unknown }));
vi.mock('react', async importOriginal => ({
    ...await importOriginal<typeof import('react')>(),
    useEffect: (effect: EffectCallback) => { state.effect = effect; },
    useRef: () => ({ current: state.element }),
}));

describe('secondary download selection', () => {
    let selection: { open: boolean; contains: ReturnType<typeof vi.fn>; scrollIntoView: ReturnType<typeof vi.fn> };
    let child: { scrollIntoView: ReturnType<typeof vi.fn> };
    let listeners: Map<string, () => void>;
    let location: { hash: string };
    let removeEventListener: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        listeners = new Map();
        location = { hash: '' };
        child = { scrollIntoView: vi.fn() };
        selection = { open: false, contains: vi.fn(target => target === selection || target === child), scrollIntoView: vi.fn() };
        state.element = selection;
        state.effect = undefined;
        removeEventListener = vi.fn((name: string) => listeners.delete(name));
        vi.stubGlobal('window', { location, addEventListener: vi.fn((name: string, listener: () => void) => listeners.set(name, listener)), removeEventListener });
        vi.stubGlobal('document', { getElementById: vi.fn((id: string) => id === 'patterns' ? selection : id === 'pokemon-heading' ? child : undefined) });
    });
    afterEach(() => vi.unstubAllGlobals());

    const render = () => renderToStaticMarkup(jsx(PatternQuickDownloads, {
        id: 'patterns', summary: 'PDF downloads',
        children: createElement('a', { href: '/patterns-ja/pokemon-pikachu-gen5/pattern.pdf', download: 'pikachu-ja.pdf' }, 'PDF'),
    } satisfies ComponentProps<typeof PatternQuickDownloads>));

    it('starts closed but retains real download links in server HTML', () => {
        const html = render();
        expect(html).toContain('<details id="patterns"');
        expect(html).not.toMatch(/<details[^>]*\bopen=/);
        expect(html).toContain('<summary');
        expect(html).toContain('href="/patterns-ja/pokemon-pikachu-gen5/pattern.pdf"');
        expect(html).toContain('download="pikachu-ja.pdf"');
        state.effect!();
        expect(selection.open).toBe(false);
    });

    it.each(['#patterns', '#pokemon-heading', '#%70okemon-heading'])('reveals a retained direct bookmark %s', hash => {
        location.hash = hash;
        render();
        state.effect!();
        expect(selection.open).toBe(true);
        expect(hash === '#patterns' ? selection.scrollIntoView : child.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    });

    it('opens when a bookmark changes or is restored through browser history', () => {
        render();
        const cleanup = state.effect!();
        location.hash = '#pokemon-heading';
        listeners.get('hashchange')!();
        expect(selection.open).toBe(true);
        selection.open = false;
        listeners.get('popstate')!();
        expect(selection.open).toBe(true);
        expect(child.scrollIntoView).toHaveBeenCalledTimes(2);
        if (typeof cleanup === 'function') cleanup();
        expect(removeEventListener).toHaveBeenCalledTimes(2);
        expect(listeners.size).toBe(0);
    });

    it.each(['#all-patterns', '#printing', '#%E0%A4%A'])('does not open or move an unrelated or malformed fragment %s', hash => {
        location.hash = hash;
        render();
        state.effect!();
        expect(selection.open).toBe(false);
        expect(child.scrollIntoView).not.toHaveBeenCalled();
        expect(selection.scrollIntoView).not.toHaveBeenCalled();
    });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLocaleFromPath } from './routes';
import { notFoundMetadata, readNotFoundLocale, readNotFoundPathname, serverNotFoundPathname, subscribeToNotFoundLocation } from './not-found';

afterEach(() => vi.unstubAllGlobals());

describe('unknown URL language recovery', () => {
    it.each([
        ['/missing', 'en'], ['/de/missing', 'de'], ['/fr/deep/missing', 'fr'],
        ['/ja/patterns/unknown/nested', 'ja'], ['/de', 'de'], ['/fr/', 'fr'],
        ['/dead/missing', 'en'], ['/france/missing', 'en'], ['/japan/missing', 'en'],
        ['/DE/missing', 'en'], ['/es/missing', 'en'], ['/missing/de/inside', 'en'],
    ] as const)('uses only the complete first locale segment of %s', (pathname, expected) => {
        vi.stubGlobal('window', { location: { pathname } });
        expect(readNotFoundLocale('/_not-found')).toBe(expected);
        expect(getLocaleFromPath(pathname)).toBe(expected);
    });

    it('renders a stable English document on the server without reading browser globals', () => {
        expect(serverNotFoundPathname()).toBe('/_not-found');
        expect(getLocaleFromPath(serverNotFoundPathname())).toBe('en');
        for (const locale of ['en', 'de', 'fr', 'ja'] as const) {
            const metadata = notFoundMetadata(locale);
            expect(metadata.robots).toEqual({ index: false, follow: true });
            expect(metadata.alternates).toBeUndefined();
        }
    });

    it('retains the actual unknown pathname even when successive paths share a locale', () => {
        const location = { pathname: '/fr/missing-one' };
        vi.stubGlobal('window', { location });
        expect(readNotFoundPathname('/_not-found')).toBe('/fr/missing-one');
        location.pathname = '/fr/deep/missing-two';
        expect(readNotFoundPathname('/_not-found')).toBe('/fr/deep/missing-two');
        expect(readNotFoundLocale('/_not-found')).toBe('fr');
    });

    it('observes Back/path updates and removes its listener when the boundary unmounts', () => {
        const listeners = new Map<string, () => void>();
        const location = { pathname: '/de/missing' };
        const removeEventListener = vi.fn((name: string, callback: () => void) => {
            if (listeners.get(name) === callback) listeners.delete(name);
        });
        vi.stubGlobal('window', {
            location,
            addEventListener: (name: string, callback: () => void) => listeners.set(name, callback),
            removeEventListener,
        });
        const seen: Array<[string, string]> = [];
        const update = () => seen.push([readNotFoundPathname('/_not-found'), readNotFoundLocale('/_not-found')]);
        const unsubscribe = subscribeToNotFoundLocation(update);
        for (const pathname of ['/de/missing', '/ja/deep/missing', '/dead/missing', '/fr/missing', '/fr/another/missing']) {
            location.pathname = pathname;
            listeners.get('popstate')!();
        }
        expect(seen).toEqual([
            ['/de/missing', 'de'], ['/ja/deep/missing', 'ja'], ['/dead/missing', 'en'],
            ['/fr/missing', 'fr'], ['/fr/another/missing', 'fr'],
        ]);
        unsubscribe();
        expect(listeners.size).toBe(0);
        expect(removeEventListener).toHaveBeenCalledWith('popstate', update);
    });
});

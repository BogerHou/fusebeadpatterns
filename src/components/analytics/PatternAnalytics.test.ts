import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const lifecycle = vi.hoisted(() => ({
    hydrating: true,
    pathname: '/patterns',
    subscriptions: [] as Array<() => () => void>,
    effects: [] as Array<() => void | (() => void)>,
    consent: null as typeof import('../../lib/analytics-consent') | null,
}));

vi.mock('next/navigation', () => ({ usePathname: () => lifecycle.pathname }));
vi.mock('@/lib/analytics', async () => vi.importActual('../../lib/analytics'));
vi.mock('@/lib/analytics-consent', () => ({
    getAnalyticsConsent: () => lifecycle.consent!.getAnalyticsConsent(),
    getServerAnalyticsConsent: () => lifecycle.consent!.getServerAnalyticsConsent(),
    subscribeAnalyticsConsent: (listener: () => void) => lifecycle.consent!.subscribeAnalyticsConsent(listener),
    isAnalyticsPageReady: (pathname?: string | null) => lifecycle.consent!.isAnalyticsPageReady(pathname),
    startAnalytics: (pathname?: string | null) => lifecycle.consent!.startAnalytics(pathname),
    stopAnalytics: () => lifecycle.consent!.stopAnalytics(),
}));
vi.mock('react', async () => ({
    ...await vi.importActual<typeof import('react')>('react'),
    useSyncExternalStore: (subscribe: (listener: () => void) => () => void, getSnapshot: () => unknown, getServerSnapshot: () => unknown) => {
        lifecycle.subscriptions.push(() => subscribe(() => {}));
        return lifecycle.hydrating ? getServerSnapshot() : getSnapshot();
    },
    useEffect: (effect: () => void | (() => void)) => { lifecycle.effects.push(effect); },
}));

const key = 'fusebeadpatterns:analytics-consent:v1';
const disableKey = 'ga-disable-G-K3EC5BK93E';

function browserFixture(choice?: string) {
    const values = new Map([['editor-draft', 'private drawing'], ['pixel-grid-print-preferences', 'keep']]);
    if (choice !== undefined) values.set(key, choice);
    const localStorage = {
        getItem: vi.fn((name: string) => values.get(name) ?? null),
        setItem: vi.fn((name: string, value: string) => { values.set(name, value); }),
    };
    const win = Object.assign(new EventTarget(), {
        location: { hostname: 'fusebeadpatterns.art', pathname: '/patterns' }, localStorage,
    }) as EventTarget & { location: { hostname: string; pathname: string }; dataLayer?: unknown[][]; [disableKey]?: boolean };
    const inserted: Array<{ onload?: () => void; remove: () => void }> = [];
    const deletedCookies: string[] = [];
    let canonical: string | null = 'https://fusebeadpatterns.art/patterns';
    const observers: Array<{ fire: () => void; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
    const doc = Object.assign(new EventTarget(), {
        referrer: 'https://www.google.com/search?q=private',
        querySelector: () => canonical === null ? null : ({ href: canonical }),
        createElement: () => ({ dataset: {}, remove: vi.fn() }),
        head: { appendChild: (script: (typeof inserted)[number]) => { inserted.push(script); } },
    });
    Object.defineProperty(doc, 'cookie', { set: (value: string) => { deletedCookies.push(value); } });
    vi.stubGlobal('window', win);
    vi.stubGlobal('document', doc);
    vi.stubGlobal('MutationObserver', class {
        observe = vi.fn(); disconnect = vi.fn();
        constructor(callback: () => void) { observers.push({ fire: callback, observe: this.observe, disconnect: this.disconnect }); }
    });
    return { win, localStorage, values, inserted, deletedCookies, observers, setCanonical: (value: string | null) => { canonical = value; } };
}

function mountEffects(subscriptionFirst: boolean) {
    const cleanup: Array<() => void> = [];
    const subscriptions = () => { for (const subscribe of lifecycle.subscriptions) cleanup.push(subscribe()); };
    const effects = () => { for (const effect of lifecycle.effects) { const dispose = effect(); if (dispose) cleanup.push(dispose); } };
    if (subscriptionFirst) { subscriptions(); effects(); }
    else { effects(); subscriptions(); }
    return () => { for (const dispose of cleanup.reverse()) dispose(); };
}

beforeEach(async () => {
    vi.resetModules(); lifecycle.hydrating = true; lifecycle.pathname = '/patterns'; lifecycle.subscriptions = []; lifecycle.effects = [];
    lifecycle.consent = await import('../../lib/analytics-consent');
});
afterEach(() => vi.unstubAllGlobals());

describe('analytics hydration consent lifecycle', () => {
    // Hook scheduling is controlled to exercise the actual component's stale
    // server-snapshot closures against the real consent runtime. This is not a
    // DOM renderer or an assertion that Google has processed a network request.
    it.each([true, false])('preserves an existing grant and cookies with subscription-first=%s', async subscriptionFirst => {
        const fixture = browserFixture('granted');
        const consent = await import('../../lib/analytics-consent');
        const { default: PatternAnalytics } = await import('./PatternAnalytics');
        expect(consent.getServerAnalyticsConsent()).toBe('unknown');
        expect(consent.getAnalyticsConsent()).toBe('unknown');
        PatternAnalytics(); // Captures enabled=false from the server snapshot.
        const unmount = mountEffects(subscriptionFirst);
        expect(consent.getAnalyticsConsent()).toBe('granted');
        expect(fixture.win[disableKey]).toBe(false);
        expect(fixture.deletedCookies).toEqual([]);
        expect(fixture.inserted).toHaveLength(1);
        fixture.inserted[0].onload?.();
        unmount(); lifecycle.subscriptions = []; lifecycle.effects = []; lifecycle.hydrating = false;
        PatternAnalytics();
        const unmountClient = mountEffects(true);
        expect(fixture.deletedCookies).toEqual([]);
        expect(fixture.inserted).toHaveLength(1);
        const pageViews = fixture.win.dataLayer?.filter(args => args[0] === 'event' && args[1] === 'page_view');
        expect(pageViews).toHaveLength(1);
        expect(pageViews![0][2]).toMatchObject({ page_referrer: 'https://www.google.com' });
        expect(fixture.values.get('editor-draft')).toBe('private drawing');
        expect(fixture.values.get('pixel-grid-print-preferences')).toBe('keep');
        unmountClient();
    });

    it.each([undefined, 'denied'])('still closes an unknown server snapshot with persisted choice=%s', async choice => {
        const fixture = browserFixture(choice);
        const { default: PatternAnalytics } = await import('./PatternAnalytics');
        PatternAnalytics(); const unmount = mountEffects(true);
        expect(fixture.win[disableKey]).toBe(true);
        expect(fixture.inserted).toEqual([]);
        expect(fixture.win.dataLayer).toBeUndefined();
        expect(fixture.values.get('editor-draft')).toBe('private drawing');
        unmount();
    });

    it('fails closed when reading an existing grant becomes unavailable during hydration', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('../../lib/analytics-consent');
        expect(consent.startAnalytics()).toBe(true); fixture.inserted[0].onload?.();
        expect(fixture.deletedCookies).toEqual([]);
        fixture.localStorage.getItem.mockImplementation(() => { throw new Error('Blocked storage'); });
        const { default: PatternAnalytics } = await import('./PatternAnalytics');
        PatternAnalytics(); const unmount = mountEffects(true);
        expect(consent.getAnalyticsConsent()).toBe('denied');
        expect(fixture.win[disableKey]).toBe(true);
        expect(fixture.win.dataLayer).toEqual([]);
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.deletedCookies.some(value => value.startsWith('_ga='))).toBe(true);
        expect(fixture.values.get('editor-draft')).toBe('private drawing');
        unmount();
    });

    it.each([null, 'https://fusebeadpatterns.art/'])('waits for the current canonical instead of measuring missing/old metadata: %s', async initialCanonical => {
        const fixture = browserFixture('granted'); fixture.setCanonical(initialCanonical);
        const { default: PatternAnalytics } = await import('./PatternAnalytics');
        PatternAnalytics(); const unmount = mountEffects(true);
        expect(fixture.inserted).toEqual([]);
        expect(fixture.win.dataLayer).toBeUndefined();
        expect(fixture.deletedCookies).toEqual([]);
        expect(fixture.observers).toHaveLength(1);
        expect(fixture.observers[0].observe).toHaveBeenCalledExactlyOnceWith(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'rel'] });
        fixture.setCanonical('https://fusebeadpatterns.art/patterns?private=photo#private.png');
        fixture.observers[0].fire();
        expect(fixture.inserted).toHaveLength(1);
        const pageViews = () => fixture.win.dataLayer?.filter(args => args[0] === 'event' && args[1] === 'page_view');
        expect(pageViews()).toHaveLength(1);
        expect(pageViews()![0][2]).toEqual({ page_location: 'https://fusebeadpatterns.art/patterns', page_referrer: 'https://www.google.com', page_title: 'Fuse Bead Patterns' });
        expect(fixture.observers[0].disconnect).toHaveBeenCalledOnce();
        const queued = fixture.win.dataLayer!.length;
        fixture.observers[0].fire(); // Even an already queued callback is inert.
        expect(fixture.win.dataLayer).toHaveLength(queued);
        expect(fixture.deletedCookies).toEqual([]);
        unmount();
    });

    it('ignores superseded route observers and links the final page to the last measured page', async () => {
        const fixture = browserFixture('granted');
        const { default: PatternAnalytics } = await import('./PatternAnalytics');
        PatternAnalytics(); const unmountA = mountEffects(true); unmountA();
        fixture.win.location.pathname = '/pixel-art-grid'; lifecycle.pathname = '/pixel-art-grid';
        lifecycle.subscriptions = []; lifecycle.effects = []; lifecycle.hydrating = false;
        PatternAnalytics(); const unmountB = mountEffects(true);
        expect(fixture.observers).toHaveLength(1);
        const queued = fixture.win.dataLayer!.length;
        fixture.win.location.pathname = '/fr/patterns';
        fixture.setCanonical('https://fusebeadpatterns.art/fr/patterns');
        fixture.observers[0].fire(); // Router advanced before React cleans B up.
        expect(fixture.win.dataLayer).toHaveLength(queued);
        unmountB(); expect(fixture.observers[0].disconnect).toHaveBeenCalled();
        fixture.observers[0].fire();
        expect(fixture.win.dataLayer).toHaveLength(queued);
        lifecycle.pathname = '/fr/patterns'; lifecycle.subscriptions = []; lifecycle.effects = [];
        PatternAnalytics(); const unmountC = mountEffects(true);
        const pageViews = fixture.win.dataLayer!.filter(args => args[0] === 'event' && args[1] === 'page_view');
        expect(pageViews.map(args => args[2])).toEqual([
            { page_location: 'https://fusebeadpatterns.art/patterns', page_referrer: 'https://www.google.com', page_title: 'Fuse Bead Patterns' },
            { page_location: 'https://fusebeadpatterns.art/fr/patterns', page_referrer: 'https://fusebeadpatterns.art/patterns', page_title: 'Fuse Bead Patterns' },
        ]);
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.deletedCookies).toEqual([]);
        unmountC();
    });

    it.each(['withdraw', 'read failure'] as const)('never revives measurement when metadata arrives after %s', async failure => {
        const fixture = browserFixture('granted');
        const consent = await import('../../lib/analytics-consent');
        const { default: PatternAnalytics } = await import('./PatternAnalytics');
        PatternAnalytics(); const unmountA = mountEffects(true); unmountA();
        fixture.win.location.pathname = '/pixel-art-grid'; fixture.setCanonical(null);
        lifecycle.pathname = '/pixel-art-grid'; lifecycle.subscriptions = []; lifecycle.effects = [];
        PatternAnalytics(); const unmountB = mountEffects(true);
        if (failure === 'withdraw') consent.setAnalyticsConsent('denied');
        else fixture.localStorage.getItem.mockImplementation(() => { throw new Error('Blocked storage'); });
        fixture.observers[0].fire(); // The consent gate runs even with no metadata.
        expect(fixture.win[disableKey]).toBe(true);
        expect(fixture.win.dataLayer).toEqual([]);
        fixture.setCanonical('https://fusebeadpatterns.art/pixel-art-grid'); fixture.observers[0].fire();
        expect(fixture.win[disableKey]).toBe(true);
        expect(fixture.win.dataLayer).toEqual([]);
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.values.get('editor-draft')).toBe('private drawing');
        unmountB();
    });
});

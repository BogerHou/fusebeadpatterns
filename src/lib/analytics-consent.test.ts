import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const key = 'fusebeadpatterns:analytics-consent:v1';
const disableKey = 'ga-disable-G-K3EC5BK93E';
const cookieNames = ['_ga', '_ga_K3EC5BK93E'];

function browserFixture(choice?: string, hostname = 'fusebeadpatterns.art') {
    const values = new Map<string, string>([['editor-draft', 'keep private drawing']]);
    if (choice !== undefined) values.set(key, choice);
    const nodes = new Map<string, ReturnType<typeof makeScript>>();
    const inserted: ReturnType<typeof makeScript>[] = [];
    const deletedCookies: string[] = [];
    const localStorage = {
        getItem: vi.fn((name: string) => values.get(name) ?? null),
        setItem: vi.fn((name: string, value: string) => { values.set(name, value); }),
        removeItem: vi.fn((name: string) => { values.delete(name); }),
    };
    function makeScript() {
        return { id: '', async: false, src: '', dataset: {} as Record<string, string>, onload: null as null | (() => void), onerror: null as null | (() => void), remove() { if (nodes.get(this.id) === this) nodes.delete(this.id); } };
    }
    const win = Object.assign(new EventTarget(), {
        location: { hostname, href: `https://${hostname}/patterns?email=private@example.com#private.png` },
        localStorage,
    }) as EventTarget & { location: { hostname: string; href: string }; localStorage: typeof localStorage; dataLayer?: unknown[][]; gtag?: (...args: unknown[]) => void; [disableKey]?: boolean };
    const doc = {
        referrer: '',
        querySelector: vi.fn(() => ({ href: 'https://fusebeadpatterns.art/patterns?secret=private.png#person@example.com' })),
        getElementById: (id: string) => nodes.get(id),
        createElement: vi.fn(makeScript),
        head: { appendChild: vi.fn((script: ReturnType<typeof makeScript>) => { nodes.set(script.id, script); inserted.push(script); }) },
        set cookie(value: string) { deletedCookies.push(value); },
    };
    vi.stubGlobal('window', win);
    vi.stubGlobal('document', doc);
    function storageEvent(changedKey: string | null, storageArea: unknown = localStorage, oldValue: string | null = null, newValue: string | null = changedKey ? values.get(changedKey) ?? null : null) {
        const event = new Event('storage');
        Object.defineProperties(event, {
            key: { value: changedKey }, storageArea: { value: storageArea },
            oldValue: { value: oldValue }, newValue: { value: newValue },
        });
        win.dispatchEvent(event);
    }
    return { values, localStorage, win, doc, inserted, deletedCookies, storageEvent };
}

function pageViews(fixture: ReturnType<typeof browserFixture>) {
    return fixture.win.dataLayer?.filter(args => args[0] === 'event' && args[1] === 'page_view').map(args => args[2]) ?? [];
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe('optional analytics consent', () => {
    it('does not inject or queue analytics for absent, denied or malformed choices', async () => {
        const consent = await import('./analytics-consent');
        for (const value of [undefined, 'denied', 'true', '{"granted":true}']) {
            const fixture = browserFixture(value);
            expect(consent.startAnalytics()).toBe(false);
            expect(fixture.inserted).toHaveLength(0);
            expect(fixture.win.gtag).toBeUndefined();
            expect(fixture.win.dataLayer).toBeUndefined();
            expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
        }
    });

    it('requires persisted approval and an exact production host before starting', async () => {
        const consent = await import('./analytics-consent');
        for (const host of ['localhost', '127.0.0.1', 'preview.fusebeadpatterns.art', 'fusebeadpatterns.art.example.org']) {
            const fixture = browserFixture('granted', host);
            expect(consent.startAnalytics()).toBe(false);
            expect(fixture.inserted).toHaveLength(0);
        }
        const fixture = browserFixture();
        expect(consent.setAnalyticsConsent('granted')).toBe(true);
        expect(consent.startAnalytics()).toBe(true);
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.inserted[0].src).toBe('https://www.googletagmanager.com/gtag/js?id=G-K3EC5BK93E');
        expect(fixture.win[disableKey]).toBe(false);
        const config = fixture.win.dataLayer?.find(args => args[0] === 'config')?.[2];
        expect(config).toMatchObject({ send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: 'https://fusebeadpatterns.art/patterns', page_referrer: '', page_title: 'Fuse Bead Patterns' });
        expect(JSON.stringify(fixture.win.dataLayer)).not.toMatch(/private|secret|example\.com/);
    });

    it('withdraws before writing storage and drops pending commands without removing draft storage', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        consent.startAnalytics();
        const originalSet = fixture.localStorage.setItem.getMockImplementation()!;
        fixture.localStorage.setItem.mockImplementation((name, value) => {
            expect(fixture.win[disableKey]).toBe(true);
            return originalSet(name, value);
        });
        expect(consent.setAnalyticsConsent('denied')).toBe(true);
        expect(fixture.win.dataLayer).toEqual([]);
        fixture.win.gtag?.('event', 'private-after-withdrawal');
        expect(fixture.win.dataLayer).toEqual([]);
        expect(fixture.doc.getElementById('fusebeadpatterns-analytics')).toBeUndefined();
        fixture.inserted[0].onload?.();
        expect(fixture.win[disableKey]).toBe(true);
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
        expect(new Set(fixture.deletedCookies.map(value => value.split('=')[0]))).toEqual(new Set(cookieNames));
    });

    it('stops an already loaded SDK and resumes without injecting a duplicate script', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        consent.startAnalytics();
        fixture.inserted[0].onload?.();
        consent.setAnalyticsConsent('denied');
        expect(fixture.win[disableKey]).toBe(true);
        consent.setAnalyticsConsent('granted');
        consent.startAnalytics();
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.win[disableKey]).toBe(false);
    });

    it('fails closed on storage read, write or read-back failure and leaves tools data intact', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        consent.startAnalytics();
        fixture.localStorage.setItem.mockImplementation(() => { throw new Error('Blocked'); });
        fixture.localStorage.removeItem.mockImplementation(() => { throw new Error('Blocked'); });
        expect(consent.setAnalyticsConsent('denied')).toBe(false);
        expect(consent.canMeasureAnalytics()).toBe(false);
        expect(fixture.win[disableKey]).toBe(true);
        expect(consent.setAnalyticsConsent('granted')).toBe(false);
        expect(consent.startAnalytics()).toBe(false);
        fixture.localStorage.getItem.mockImplementation(() => { throw new Error('Private mode'); });
        expect(() => consent.getAnalyticsConsent()).not.toThrow();
        expect(consent.canMeasureAnalytics()).toBe(false);
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
    });

    it.each(['throws', 'revoked'] as const)('does not request the SDK when consent %s during initial command queueing', async failure => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        let reads = 0;
        fixture.localStorage.getItem.mockImplementation(name => {
            if (++reads === 2) {
                if (failure === 'throws') throw new Error('Blocked mid-start');
                fixture.values.set(key, 'denied');
            }
            return fixture.values.get(name) ?? null;
        });
        expect(consent.startAnalytics()).toBe(false);
        expect(fixture.inserted).toHaveLength(0);
        expect(fixture.win[disableKey]).toBe(true);
        expect(fixture.win.dataLayer).toEqual([]);
        expect(consent.getAnalyticsConsent()).toBe('denied');
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
    });

    it('locks and disables an already loaded SDK when its first storage read alone fails', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        expect(consent.startAnalytics()).toBe(true);
        fixture.inserted[0].onload?.();
        expect(fixture.win[disableKey]).toBe(false);
        const changed = vi.fn();
        const unsubscribe = consent.subscribeAnalyticsConsent(changed);
        const read = fixture.localStorage.getItem.getMockImplementation()!;
        fixture.localStorage.getItem.mockImplementation(() => { throw new Error('Read denied'); });
        // The React snapshot does not itself read storage or mutate the SDK.
        expect(consent.getAnalyticsConsent()).toBe('granted');
        expect(consent.canMeasureAnalytics()).toBe(false);
        expect(consent.getAnalyticsConsent()).toBe('denied');
        expect(fixture.win[disableKey]).toBe(true);
        expect(changed).toHaveBeenCalledOnce();
        fixture.localStorage.getItem.mockImplementation(read);
        expect(consent.canMeasureAnalytics()).toBe(false);
        expect(consent.startAnalytics()).toBe(false);
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
        unsubscribe();
    });

    it('cannot revive failed loaded-SDK withdrawal through sessionStorage or unrelated clear events', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        consent.startAnalytics();
        fixture.inserted[0].onload?.();
        const unsubscribe = consent.subscribeAnalyticsConsent(vi.fn());
        fixture.localStorage.setItem.mockImplementation(() => { throw new Error('Write denied'); });
        fixture.localStorage.removeItem.mockImplementation(() => { throw new Error('Delete denied'); });
        expect(consent.setAnalyticsConsent('denied')).toBe(false);
        expect(fixture.values.get(key)).toBe('granted');
        for (const area of [{ kind: 'sessionStorage' }, {}, null, fixture.localStorage]) {
            fixture.storageEvent(null, area);
            expect(consent.canMeasureAnalytics()).toBe(false);
            expect(consent.startAnalytics()).toBe(false);
            expect(fixture.win[disableKey]).toBe(true);
        }
        // A stale/no-op grant event is not a new successful consent choice.
        fixture.storageEvent(key, fixture.localStorage, 'granted', 'granted');
        expect(consent.startAnalytics()).toBe(false);
        // A genuine localStorage change in another tab is observed and read back.
        fixture.values.set(key, 'denied');
        fixture.storageEvent(key, fixture.localStorage, 'granted', 'denied');
        fixture.values.set(key, 'granted');
        fixture.storageEvent(key, fixture.localStorage, 'denied', 'granted');
        expect(consent.getAnalyticsConsent()).toBe('granted');
        expect(consent.startAnalytics()).toBe(true);
        expect(fixture.win[disableKey]).toBe(false);
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
        unsubscribe();
    });

    it('does not enable analytics when a storage write is silently ignored or reads are blocked', async () => {
        const fixture = browserFixture();
        const consent = await import('./analytics-consent');
        fixture.localStorage.setItem.mockImplementation(() => {});
        expect(consent.setAnalyticsConsent('granted')).toBe(false);
        expect(consent.startAnalytics()).toBe(false);
        expect(fixture.inserted).toHaveLength(0);
        fixture.localStorage.getItem.mockImplementation(() => { throw new Error('Denied'); });
        expect(consent.canMeasureAnalytics()).toBe(false);
    });

    it('isolates a blocked SDK insertion from navigation and exports', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        fixture.doc.head.appendChild.mockImplementation(() => { throw new Error('Blocked script'); });
        expect(consent.startAnalytics()).toBe(false);
        expect(fixture.win[disableKey]).toBe(true);
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
    });

    it('propagates rejection and clearing across tabs, but ignores unrelated draft changes', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        consent.startAnalytics();
        const changed = vi.fn();
        const unsubscribe = consent.subscribeAnalyticsConsent(changed);
        fixture.storageEvent('editor-draft');
        expect(changed).not.toHaveBeenCalled();
        fixture.values.set(key, 'denied');
        fixture.storageEvent(key);
        expect(fixture.win[disableKey]).toBe(true);
        expect(changed).toHaveBeenCalledTimes(1);
        fixture.values.delete(key);
        fixture.storageEvent(null);
        expect(consent.getAnalyticsConsent()).toBe('unknown');
        expect(changed).toHaveBeenCalledTimes(2);
        unsubscribe();
        fixture.storageEvent(key);
        expect(changed).toHaveBeenCalledTimes(2);
    });

    it('gates every existing product event even when an SDK remains installed', async () => {
        const fixture = browserFixture('granted');
        const analytics = await import('./analytics');
        const gtag = vi.fn();
        fixture.win.gtag = gtag;
        const pattern = { name: 'pattern_download', patternId: 'sdv-blue-chicken', paletteId: 'perler', entryPoint: 'pattern_detail', format: 'pdf' };
        const send = () => [analytics.trackPatternEvent(pattern), analytics.trackPixelGridExport({ format: 'png' }), analytics.trackPixelGridExport({ format: 'pdf' }), analytics.trackBeadLoomExport({ format: 'pdf' })];
        expect(send()).toEqual([true, true, true, true]);
        fixture.values.set(key, 'denied');
        expect(send()).toEqual([false, false, false, false]);
        fixture.values.delete(key);
        expect(send()).toEqual([false, false, false, false]);
        expect(gtag).toHaveBeenCalledTimes(4);
    });

    it('keeps denial on a detached late onload and reuses its executed SDK on later consent', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        consent.startAnalytics(); const old = fixture.inserted[0];
        expect(consent.setAnalyticsConsent('denied')).toBe(true);
        expect(fixture.doc.getElementById(old.id)).toBeUndefined();
        old.onload?.();
        expect(consent.getAnalyticsConsent()).toBe('denied');
        expect(fixture.win[disableKey]).toBe(true); expect(fixture.win.dataLayer).toEqual([]);
        expect(consent.setAnalyticsConsent('granted')).toBe(true);
        expect(consent.startAnalytics()).toBe(true);
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.win[disableKey]).toBe(false);
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
    });

    it('isolates old load/error callbacks from a newer request and never creates a third SDK after execution', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        consent.startAnalytics(); const first = fixture.inserted[0];
        consent.setAnalyticsConsent('denied'); consent.setAnalyticsConsent('granted'); consent.startAnalytics();
        const second = fixture.inserted[1]; expect(second).not.toBe(first);
        first.onerror?.();
        expect(fixture.doc.getElementById(second.id)).toBe(second);
        expect(fixture.win[disableKey]).toBe(false);
        const queued = fixture.win.dataLayer!.length;
        first.onload?.();
        expect(fixture.doc.getElementById(second.id)).toBe(second);
        expect(fixture.win.dataLayer).toHaveLength(queued);
        second.onload?.(); consent.startAnalytics();
        expect(fixture.inserted).toHaveLength(2);
        const pageViews = fixture.win.dataLayer!.filter(args => args[0] === 'event' && args[1] === 'page_view');
        expect(pageViews).toHaveLength(1);
        consent.setAnalyticsConsent('denied'); first.onload?.(); second.onload?.();
        expect(fixture.win[disableKey]).toBe(true); expect(fixture.win.dataLayer).toEqual([]);
    });

    it('releases a failed current request for a bounded explicit or navigation retry', async () => {
        const fixture = browserFixture('granted');
        const consent = await import('./analytics-consent');
        consent.startAnalytics(); const first = fixture.inserted[0]; first.onerror?.();
        expect(consent.getAnalyticsConsent()).toBe('granted');
        expect(fixture.win[disableKey]).toBe(true); expect(fixture.win.dataLayer).toEqual([]);
        expect(fixture.doc.getElementById(first.id)).toBeUndefined();
        expect(fixture.inserted).toHaveLength(1); // No timer or automatic request.
        fixture.doc.querySelector.mockReturnValue({ href: 'https://fusebeadpatterns.art/fr/patterns' });
        expect(consent.startAnalytics()).toBe(true); const retry = fixture.inserted[1];
        first.onerror?.(); expect(fixture.doc.getElementById(retry.id)).toBe(retry);
        retry.onload?.(); consent.startAnalytics();
        expect(fixture.inserted).toHaveLength(2); expect(fixture.win[disableKey]).toBe(false);
        expect(fixture.win.dataLayer!.filter(args => args[0] === 'event' && args[1] === 'page_view')).toHaveLength(1);
        consent.setAnalyticsConsent('denied'); consent.setAnalyticsConsent('granted'); consent.startAnalytics();
        expect(fixture.inserted).toHaveLength(2);
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
    });

    it('builds safe static canonical locations with a fixed title and no implicit source', async () => {
        const { getAnalyticsPageContext } = await import('./analytics-consent');
        for (const canonical of [undefined, 'https://foreign.test/private.png', 'http://fusebeadpatterns.art/private.png', 'https://person:secret@fusebeadpatterns.art/']) {
            expect(getAnalyticsPageContext(canonical)).toEqual({ page_location: 'https://fusebeadpatterns.art/', page_referrer: '', page_title: 'Fuse Bead Patterns' });
        }
        expect(getAnalyticsPageContext('https://fusebeadpatterns.art/fr/patterns?email=person@example.com#secret.png').page_location).toBe('https://fusebeadpatterns.art/fr/patterns');
    });

    it.each([
        ['https://www.google.com/search?q=private%20pattern#private.png', 'https://www.google.com'],
        ['https://www.bing.com/search?q=person%40example.com#private.png', 'https://www.bing.com'],
        ['http://reference.example:8080/private/article?email=person@example.com#private.png', 'http://reference.example:8080'],
    ])('keeps only the incoming web origin for the first allowed page view: %s', async (referrer, origin) => {
        const fixture = browserFixture();
        fixture.doc.referrer = referrer;
        const consent = await import('./analytics-consent');
        expect(consent.startAnalytics()).toBe(false);
        expect(fixture.inserted).toHaveLength(0);
        expect(fixture.win.dataLayer).toBeUndefined();
        expect(consent.setAnalyticsConsent('granted')).toBe(true);
        expect(consent.startAnalytics()).toBe(true);
        expect(pageViews(fixture)).toEqual([{ page_location: 'https://fusebeadpatterns.art/patterns', page_referrer: origin, page_title: 'Fuse Bead Patterns' }]);
        expect(JSON.stringify(fixture.win.dataLayer)).not.toMatch(/private|person@|person%40|search\?|article|example\.com/);
    });

    it.each([
        '', '/search?q=private', '//www.google.com/search?q=private', 'not a URL',
        'https:/www.google.com/search', 'javascript:alert(1)', 'data:text/plain,private',
        'file:///private/image.png', 'about:blank',
        'https://person:secret@www.google.com/search?q=private',
        'http://person@reference.example/path',
    ])('does not infer a source from an invalid or credential-bearing referrer: %s', async referrer => {
        const fixture = browserFixture('granted');
        fixture.doc.referrer = referrer;
        const consent = await import('./analytics-consent');
        expect(consent.startAnalytics()).toBe(true);
        expect(pageViews(fixture)).toEqual([{ page_location: 'https://fusebeadpatterns.art/patterns', page_referrer: '', page_title: 'Fuse Bead Patterns' }]);
        expect(JSON.stringify(fixture.win.dataLayer)).not.toMatch(/private|person@|secret|www\.google/);
    });

    it('advances the source only for a new canonical and keeps same-page starts and custom events on that context', async () => {
        const fixture = browserFixture('granted');
        fixture.doc.referrer = 'https://www.google.com/search?q=private';
        const consent = await import('./analytics-consent');
        const analytics = await import('./analytics');
        expect(consent.startAnalytics()).toBe(true);
        expect(consent.startAnalytics()).toBe(true);
        expect(analytics.trackPixelGridExport({ format: 'pdf' })).toBe(true);
        expect(pageViews(fixture)).toHaveLength(1);
        expect(fixture.win.dataLayer!.filter(args => args[0] === 'set').at(-1)?.[1]).toMatchObject({ page_location: 'https://fusebeadpatterns.art/patterns', page_referrer: 'https://www.google.com' });

        fixture.doc.querySelector.mockReturnValue({ href: 'https://www.fusebeadpatterns.art/pixel-art-grid?private=filename#private.png' });
        expect(consent.startAnalytics()).toBe(true);
        expect(consent.startAnalytics()).toBe(true);
        expect(analytics.trackPixelGridExport({ format: 'pdf' })).toBe(true);
        expect(pageViews(fixture)).toHaveLength(2);
        expect(fixture.win.dataLayer!.filter(args => args[0] === 'set').at(-1)?.[1]).toMatchObject({ page_location: 'https://fusebeadpatterns.art/pixel-art-grid', page_referrer: 'https://fusebeadpatterns.art/patterns' });

        fixture.doc.querySelector.mockReturnValue({ href: 'https://fusebeadpatterns.art/fr/pixel-art-grid?private=filename#private.png' });
        expect(consent.startAnalytics()).toBe(true);
        expect(pageViews(fixture)).toEqual([
            { page_location: 'https://fusebeadpatterns.art/patterns', page_referrer: 'https://www.google.com', page_title: 'Fuse Bead Patterns' },
            { page_location: 'https://fusebeadpatterns.art/pixel-art-grid', page_referrer: 'https://fusebeadpatterns.art/patterns', page_title: 'Fuse Bead Patterns' },
            { page_location: 'https://fusebeadpatterns.art/fr/pixel-art-grid', page_referrer: 'https://fusebeadpatterns.art/pixel-art-grid', page_title: 'Fuse Bead Patterns' },
        ]);
        const exports = fixture.win.dataLayer!.filter(args => args[0] === 'event' && args[1] === 'pixel_grid_export');
        expect(exports).toHaveLength(2);
        expect(exports.map(args => args[2])).toEqual([{ entry_point: 'pixel_grid', file_format: 'pdf' }, { entry_point: 'pixel_grid', file_format: 'pdf' }]);
        expect(JSON.stringify(fixture.win.dataLayer)).not.toMatch(/private|filename|search\?/);
    });

    it('resets page-source context on withdrawal and ignores detached callbacks after granting again', async () => {
        const fixture = browserFixture('granted');
        fixture.doc.referrer = 'https://www.bing.com/search?q=private';
        const consent = await import('./analytics-consent');
        consent.startAnalytics(); const old = fixture.inserted[0];
        fixture.doc.querySelector.mockReturnValue({ href: 'https://fusebeadpatterns.art/pixel-art-grid' });
        consent.startAnalytics();
        expect(pageViews(fixture).at(-1)).toMatchObject({ page_referrer: 'https://fusebeadpatterns.art/patterns' });
        expect(consent.setAnalyticsConsent('denied')).toBe(true);
        old.onload?.(); old.onerror?.();
        expect(fixture.win.dataLayer).toEqual([]);
        expect(fixture.win[disableKey]).toBe(true);
        expect(consent.setAnalyticsConsent('granted')).toBe(true);
        expect(consent.startAnalytics()).toBe(true);
        expect(consent.startAnalytics()).toBe(true);
        expect(pageViews(fixture)).toEqual([{ page_location: 'https://fusebeadpatterns.art/pixel-art-grid', page_referrer: 'https://www.bing.com', page_title: 'Fuse Bead Patterns' }]);
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
    });

    it('clears failed-request source context before an explicit retry and isolates an old error from the retry', async () => {
        const fixture = browserFixture('granted');
        fixture.doc.referrer = 'https://www.google.com/search?q=private';
        const consent = await import('./analytics-consent');
        consent.startAnalytics(); const old = fixture.inserted[0];
        fixture.doc.querySelector.mockReturnValue({ href: 'https://fusebeadpatterns.art/pixel-art-grid' });
        consent.startAnalytics(); old.onerror?.();
        expect(fixture.win.dataLayer).toEqual([]);
        expect(consent.startAnalytics()).toBe(true);
        const retry = fixture.inserted[1];
        old.onerror?.(); retry.onload?.(); consent.startAnalytics();
        expect(pageViews(fixture)).toEqual([{ page_location: 'https://fusebeadpatterns.art/pixel-art-grid', page_referrer: 'https://www.google.com', page_title: 'Fuse Bead Patterns' }]);
        fixture.doc.querySelector.mockReturnValue({ href: 'https://fusebeadpatterns.art/fr/patterns' });
        expect(consent.startAnalytics()).toBe(true);
        expect(pageViews(fixture).at(-1)).toMatchObject({ page_referrer: 'https://fusebeadpatterns.art/pixel-art-grid' });
    });

    it('resets context on a current request error even when an older detached SDK has executed', async () => {
        const fixture = browserFixture('granted');
        fixture.doc.referrer = 'https://www.bing.com/search?q=private';
        const consent = await import('./analytics-consent');
        consent.startAnalytics(); const old = fixture.inserted[0];
        consent.setAnalyticsConsent('denied'); consent.setAnalyticsConsent('granted'); consent.startAnalytics();
        const current = fixture.inserted[1];
        fixture.doc.querySelector.mockReturnValue({ href: 'https://fusebeadpatterns.art/pixel-art-grid' });
        consent.startAnalytics();
        old.onload?.(); current.onerror?.();
        fixture.doc.querySelector.mockReturnValue({ href: 'https://fusebeadpatterns.art/fr/patterns' });
        expect(consent.startAnalytics()).toBe(true);
        expect(pageViews(fixture).at(-1)).toMatchObject({ page_location: 'https://fusebeadpatterns.art/fr/patterns', page_referrer: 'https://www.bing.com' });
        expect(fixture.inserted).toHaveLength(2);
        expect(fixture.win[disableKey]).toBe(false);
    });

    it.each(['throws', 'revoked'] as const)('does not preserve or advance page-source context when consent %s during queueing', async failure => {
        const fixture = browserFixture('granted');
        fixture.doc.referrer = 'https://www.google.com/search?q=private';
        const consent = await import('./analytics-consent');
        consent.startAnalytics(); fixture.inserted[0].onload?.();
        fixture.doc.querySelector.mockReturnValue({ href: 'https://fusebeadpatterns.art/pixel-art-grid' });
        const gtag = fixture.win.gtag!;
        fixture.win.gtag = (...args) => {
            gtag(...args);
            if (args[0] === 'event' && args[1] === 'page_view') {
                if (failure === 'throws') fixture.localStorage.getItem.mockImplementation(() => { throw new Error('Blocked mid-page-view'); });
                else fixture.values.set(key, 'denied');
            }
        };
        expect(consent.startAnalytics()).toBe(false);
        expect(fixture.win.dataLayer).toEqual([]);
        expect(fixture.win[disableKey]).toBe(true);
        fixture.win.gtag = gtag;
        fixture.localStorage.getItem.mockImplementation(name => fixture.values.get(name) ?? null);
        expect(consent.setAnalyticsConsent('granted')).toBe(true);
        fixture.doc.querySelector.mockReturnValue({ href: 'https://fusebeadpatterns.art/ja/patterns' });
        expect(consent.startAnalytics()).toBe(true);
        expect(pageViews(fixture)).toEqual([{ page_location: 'https://fusebeadpatterns.art/ja/patterns', page_referrer: 'https://www.google.com', page_title: 'Fuse Bead Patterns' }]);
        expect(fixture.inserted).toHaveLength(1);
        expect(fixture.values.get('editor-draft')).toBe('keep private drawing');
    });
});

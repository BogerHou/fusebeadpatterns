export const ANALYTICS_ID = 'G-K3EC5BK93E';
export const ANALYTICS_CONSENT_KEY = 'fusebeadpatterns:analytics-consent:v1';
const SCRIPT_ID = 'fusebeadpatterns-analytics';
const DISABLE_KEY = `ga-disable-${ANALYTICS_ID}`;
const PRODUCTION_HOSTS = new Set(['fusebeadpatterns.art', 'www.fusebeadpatterns.art']);
export type AnalyticsConsent = 'unknown' | 'granted' | 'denied';

type AnalyticsBrowser = Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [DISABLE_KEY]?: boolean;
};
let failedClosed = false;
let initialized = false;
let sdkLoaded = false;
let requestGeneration = 0;
let pendingRequest: { node: HTMLScriptElement; generation: number } | null = null;
let lastPageContext: ReturnType<typeof getAnalyticsPageContext> | null = null;
let consentSnapshot: AnalyticsConsent = 'unknown';
const subscribers = new Set<() => void>();

// React's snapshot reader is deliberately pure. Storage and SDK changes happen
// only through the explicit refresh/start/choice/subscription paths below.
export function getAnalyticsConsent(): AnalyticsConsent { return consentSnapshot; }
export const getServerAnalyticsConsent = (): AnalyticsConsent => 'unknown';

function publishConsent(value: AnalyticsConsent) {
    if (consentSnapshot === value) return;
    consentSnapshot = value;
    for (const callback of subscribers) callback();
}

function lockAnalyticsClosed() {
    failedClosed = true;
    stopAnalytics();
    publishConsent('denied');
}

function refreshAnalyticsConsent(): AnalyticsConsent {
    if (typeof window === 'undefined') return 'unknown';
    if (failedClosed) return 'denied';
    try {
        const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
        const value = stored === 'granted' || stored === 'denied' ? stored : 'unknown';
        if (value !== 'granted') stopAnalytics();
        publishConsent(value);
        return value;
    } catch {
        // A loaded SDK must also stop; skipping our custom events is not enough.
        lockAnalyticsClosed();
        return 'denied';
    }
}

export function canMeasureAnalytics(): boolean {
    return typeof window !== 'undefined'
        && PRODUCTION_HOSTS.has(window.location.hostname)
        && refreshAnalyticsConsent() === 'granted';
}

/** Delete only the two cookies used by this site's current GA measurement ID. */
function clearAnalyticsCookies() {
    if (typeof document === 'undefined' || !PRODUCTION_HOSTS.has(window.location.hostname)) return;
    for (const name of ['_ga', '_ga_K3EC5BK93E']) {
        for (const domain of ['', window.location.hostname, '.fusebeadpatterns.art']) {
            try {
                document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
            } catch { /* Cookie access restrictions must not affect drawing or downloads. */ }
        }
    }
}

export function stopAnalytics() {
    if (typeof window === 'undefined') return;
    const browser = window as AnalyticsBrowser;
    browser[DISABLE_KEY] = true;
    // Drop pending commands if consent is withdrawn before the SDK has loaded.
    if (Array.isArray(browser.dataLayer)) browser.dataLayer.length = 0;
    lastPageContext = null;
    initialized = false;
    if (pendingRequest) {
        const request = pendingRequest;
        pendingRequest = null;
        requestGeneration++;
        request.node.remove();
    }
    // Removing a script does not guarantee cancellation of an already started
    // request. Its onload may still record execution, but never restores consent.
    clearAnalyticsCookies();
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, 'unknown'>): boolean {
    // Withdrawal must take effect before attempting persistence.
    if (value === 'denied') stopAnalytics();
    let saved = false;
    try {
        window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
        saved = window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === value;
    } catch { /* Fail closed; the choice never blocks the product. */ }
    if (saved) {
        failedClosed = false;
        publishConsent(value);
    } else {
        lockAnalyticsClosed();
        try { window.localStorage.removeItem(ANALYTICS_CONSENT_KEY); } catch { /* Keep the in-memory denial. */ }
    }
    return saved;
}

export function subscribeAnalyticsConsent(callback: () => void): () => void {
    const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== ANALYTICS_CONSENT_KEY) return;
        try {
            const storage = window.localStorage;
            // sessionStorage also fires storage events in same-tab frames. Neither
            // those events nor an unrelated clear may revive a failed withdrawal.
            if (event.storageArea !== storage) return;
            if (failedClosed && event.key === ANALYTICS_CONSENT_KEY
                && event.newValue === 'granted' && event.oldValue !== event.newValue
                && storage.getItem(ANALYTICS_CONSENT_KEY) === 'granted') {
                failedClosed = false;
            }
            refreshAnalyticsConsent();
        } catch { lockAnalyticsClosed(); }
    };
    subscribers.add(callback);
    window.addEventListener('storage', onStorage);
    refreshAnalyticsConsent();
    return () => {
        subscribers.delete(callback);
        window.removeEventListener('storage', onStorage);
    };
}

/** Canonical comes from our static page metadata, never a user query or project title. */
export function getAnalyticsPageContext(canonical?: string | null) {
    let pageLocation = 'https://fusebeadpatterns.art/';
    try {
        const url = new URL(canonical ?? pageLocation, pageLocation);
        if (url.protocol === 'https:' && PRODUCTION_HOSTS.has(url.hostname) && !url.username && !url.password) {
            pageLocation = `https://fusebeadpatterns.art${url.pathname}`;
        }
    } catch { /* A missing or malformed canonical falls back to the public home page. */ }
    return { page_location: pageLocation, page_referrer: '', page_title: 'Fuse Bead Patterns' };
}

function getReferrerOrigin(referrer: string): string {
    try {
        if (typeof referrer !== 'string' || !/^https?:\/\//i.test(referrer)) return '';
        const url = new URL(referrer);
        if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password) return url.origin;
    } catch { /* A missing, non-web or malformed referrer has no usable source. */ }
    return '';
}

// Read through a function because canMeasureAnalytics may disable the SDK.
function isAnalyticsDisabled(browser: AnalyticsBrowser): boolean { return browser[DISABLE_KEY] === true; }

export function startAnalytics(): boolean {
    try {
        if (!canMeasureAnalytics() || typeof document === 'undefined') { stopAnalytics(); return false; }
        const browser = window as AnalyticsBrowser;
        const page = getAnalyticsPageContext(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href);
        const isNewPage = lastPageContext?.page_location !== page.page_location;
        // A new document keeps only the incoming origin. SPA navigation uses the
        // previous measured canonical; repeated starts keep that page's source.
        const context = lastPageContext && !isNewPage ? lastPageContext : {
            ...page,
            page_referrer: lastPageContext?.page_location ?? getReferrerOrigin(document.referrer),
        };
        browser[DISABLE_KEY] = false;
        browser.dataLayer ??= [];
        browser.gtag ??= function (): void {
            // Preserve Google's documented gtag command queue format.
            // eslint-disable-next-line prefer-rest-params
            if (canMeasureAnalytics() && browser[DISABLE_KEY] !== true) browser.dataLayer?.push(arguments);
        };
        if (!initialized) {
            browser.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
            browser.gtag('js', new Date());
            browser.gtag('config', ANALYTICS_ID, {
                ...context, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
            });
        } else {
            browser.gtag('config', ANALYTICS_ID, { ...context, send_page_view: false, update: true });
        }
        browser.gtag('set', context);
        // This code queues one explicit page view. GA stream enhanced measurement
        // may send additional events/page views (including history changes); its
        // account-level settings remain unverified by this source integration.
        if (isNewPage) browser.gtag('event', 'page_view', context);
        // Queueing commands can observe revoked/unreadable consent. Do not mark
        // setup complete or request an SDK after any such failure during startup.
        if (!canMeasureAnalytics() || isAnalyticsDisabled(browser)) { stopAnalytics(); return false; }
        initialized = true;
        lastPageContext = context;
        if (!sdkLoaded && !pendingRequest) {
            const script = document.createElement('script');
            const generation = ++requestGeneration;
            pendingRequest = { node: script, generation };
            script.id = SCRIPT_ID;
            script.async = true;
            script.onload = () => {
                // Even a detached, stale request can finish executing. Keep that
                // fact separate from ownership of the latest pending request.
                sdkLoaded = true;
                script.dataset.loaded = 'true';
                if (pendingRequest?.node === script && pendingRequest.generation === generation) pendingRequest = null;
                if (!canMeasureAnalytics()) stopAnalytics();
            };
            script.onerror = () => {
                if (pendingRequest?.node !== script || pendingRequest.generation !== generation) return;
                pendingRequest = null;
                script.remove();
                initialized = false;
                lastPageContext = null;
                if (!sdkLoaded) stopAnalytics();
                // No automatic retry: another navigation, explicit start or
                // repeated Allow choice can retry a failed current request.
            };
            script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
            if (!canMeasureAnalytics() || isAnalyticsDisabled(browser)) { stopAnalytics(); return false; }
            document.head.appendChild(script);
        }
        return true;
    } catch { stopAnalytics(); return false; }
}

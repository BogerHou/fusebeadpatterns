const baseUrl = process.env.SMOKE_BASE_URL ?? 'https://fusebeadpatterns.art';

const checks = [
    {
        path: '/',
        label: 'home',
        expectedText: 'Free Perler Bead Pattern Generator',
        requiredHeaders: [
            'content-security-policy',
            'referrer-policy',
            'x-content-type-options',
            'x-frame-options',
            'permissions-policy',
            'cross-origin-opener-policy',
            'strict-transport-security',
        ],
        forbiddenHeaders: ['x-powered-by'],
        forbiddenHeaderIncludes: [
            {
                header: 'content-security-policy',
                value: "'unsafe-eval'",
            },
        ],
    },
    {
        path: '/editor',
        label: 'editor',
        expectedText: 'Perler Bead Pattern Editor',
    },
    {
        path: '/guides',
        label: 'guides',
        expectedText: 'Perler Bead Guides',
    },
    {
        path: '/sitemap.xml',
        label: 'sitemap',
        expectedText: '/guides/photo-to-perler-bead-pattern',
    },
    {
        path: '/robots.txt',
        label: 'robots',
        expectedText: 'Sitemap:',
    },
];

const canonicalUrl = 'https://fusebeadpatterns.art/';
const canonicalRedirectChecks = [
    'http://fusebeadpatterns.art/',
    'http://www.fusebeadpatterns.art/',
    'https://www.fusebeadpatterns.art/',
];

const maxAttempts = 3;
const requestTimeoutMs = 15000;

function toUrl(path) {
    return new URL(path, baseUrl).toString();
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function normalizeUrl(url) {
    return new URL(url).toString();
}

async function runCheck(check) {
    const url = toUrl(check.path);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, requestTimeoutMs);

    let response;

    try {
        response = await fetch(url, {
            headers: {
                'user-agent': 'bead-pattern-maker-smoke/1.0',
            },
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }

    const text = await response.text();

    if (!response.ok) {
        throw new Error(`${check.label} returned HTTP ${response.status}`);
    }

    if (!text.includes(check.expectedText)) {
        throw new Error(
            `${check.label} did not include expected text: ${check.expectedText}`
        );
    }

    for (const header of check.requiredHeaders ?? []) {
        if (!response.headers.get(header)) {
            throw new Error(`${check.label} missing required header: ${header}`);
        }
    }

    for (const header of check.forbiddenHeaders ?? []) {
        if (response.headers.get(header)) {
            throw new Error(`${check.label} included forbidden header: ${header}`);
        }
    }

    for (const forbidden of check.forbiddenHeaderIncludes ?? []) {
        const headerValue = response.headers.get(forbidden.header) ?? '';

        if (headerValue.includes(forbidden.value)) {
            throw new Error(
                `${check.label} header ${forbidden.header} included forbidden value: ${forbidden.value}`
            );
        }
    }

    return {
        label: check.label,
        status: response.status,
        bytes: text.length,
        url,
    };
}

async function runCheckWithRetry(check) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await runCheck(check);
        } catch (error) {
            lastError = error;

            if (attempt < maxAttempts) {
                await wait(500 * attempt);
            }
        }
    }

    throw lastError;
}

async function runCanonicalRedirectCheck(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, requestTimeoutMs);

    let response;

    try {
        response = await fetch(url, {
            headers: {
                'user-agent': 'bead-pattern-maker-smoke/1.0',
            },
            redirect: 'manual',
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }

    const location = response.headers.get('location');

    if (![301, 308].includes(response.status)) {
        throw new Error(`${url} returned HTTP ${response.status}, expected 301 or 308`);
    }

    if (!location || normalizeUrl(location) !== normalizeUrl(canonicalUrl)) {
        throw new Error(`${url} redirected to ${location ?? 'missing location'}`);
    }

    return {
        url,
        status: response.status,
        location,
    };
}

async function runCanonicalRedirectCheckWithRetry(url) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await runCanonicalRedirectCheck(url);
        } catch (error) {
            lastError = error;

            if (attempt < maxAttempts) {
                await wait(500 * attempt);
            }
        }
    }

    throw lastError;
}

const failures = [];

for (const url of canonicalRedirectChecks) {
    try {
        const result = await runCanonicalRedirectCheckWithRetry(url);
        console.log(
            `OK canonical-redirect ${result.status} ${result.url} -> ${result.location}`
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`canonical-redirect ${url}: ${message}`);
        console.error(`FAIL canonical-redirect ${url} ${message}`);
    }
}

for (const check of checks) {
    try {
        const result = await runCheckWithRetry(check);
        console.log(
            `OK ${result.label} ${result.status} ${result.bytes} bytes ${result.url}`
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${check.label}: ${message}`);
        console.error(`FAIL ${check.label} ${message}`);
    }
}

if (failures.length > 0) {
    console.error(`Smoke check failed with ${failures.length} failure(s).`);
    process.exit(1);
}

console.log('Smoke check passed.');

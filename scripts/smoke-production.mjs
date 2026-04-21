const baseUrl = process.env.SMOKE_BASE_URL ?? 'https://fusebeadpatterns.art';

const checks = [
    {
        path: '/',
        label: 'home',
        expectedText: 'Free Perler Bead Pattern Generator',
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

const failures = [];

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

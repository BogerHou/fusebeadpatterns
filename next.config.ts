import type { NextConfig } from 'next';
import loomPatternLibrary from './src/lib/bead-loom/patterns.json';

const isDevelopment = process.env.NODE_ENV === 'development';

const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    isDevelopment
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com"
        : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com",
    [
        "connect-src 'self'",
        'https://www.google-analytics.com',
        'https://*.google-analytics.com',
        'https://analytics.google.com',
        'https://*.analytics.google.com',
        'https://stats.g.doubleclick.net',
        ...(isDevelopment
            ? [
                  'http://localhost:*',
                  'http://127.0.0.1:*',
                  'ws://localhost:*',
                  'ws://127.0.0.1:*',
              ]
            : []),
    ].join(' '),
    "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
    {
        key: 'Content-Security-Policy',
        value: contentSecurityPolicy,
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'X-Frame-Options',
        value: 'DENY',
    },
    {
        key: 'Permissions-Policy',
        value: [
            'accelerometer=()',
            'camera=()',
            'geolocation=()',
            'gyroscope=()',
            'magnetometer=()',
            'microphone=()',
            'payment=()',
            'usb=()',
        ].join(', '),
    },
    {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
    },
];

const nextConfig: NextConfig = {
    poweredByHeader: false,
    // Public artwork and the small brand mark are prepared at build time.
    // Do not turn arbitrary public image URLs into metered transformations.
    images: { unoptimized: true },
    // Unmatched routes need one 404 document across the English and Japanese roots.
    experimental: { globalNotFound: true },
    async redirects() {
        return [
            {
                source: '/:path*',
                has: [
                    {
                        type: 'host',
                        value: 'www.fusebeadpatterns.art',
                    },
                ],
                destination: 'https://fusebeadpatterns.art/:path*',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
            {
                source: '/brand/logo-108-1550e3d22f75.webp',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
            ...loomPatternLibrary.patterns.flatMap(({ id }) =>
                Object.keys(loomPatternLibrary.libraryPaths).map((locale) => ({
                    source: `/bead-loom-patterns/${id}/${locale}/pattern.bead-loom.json`,
                    headers: [{
                        key: 'Content-Disposition',
                        value: `attachment; filename="${id}-${locale}.bead-loom.json"`,
                    }],
                })),
            ),
            ...['rocket', 'cat'].flatMap((id) =>
                ['32-original', '64-original', '64-16-colors'].map((variant) => ({
                    source: `/guides/pixel-art-examples/${id}-${variant}.pixel-grid.json`,
                    headers: [{
                        key: 'Content-Disposition',
                        value: `attachment; filename="${id}-${variant}.pixel-grid.json"`,
                    }],
                })),
            ),
        ];
    },
    reactCompiler: true,
    turbopack: {
        root: process.cwd(),
    },
};

export default nextConfig;

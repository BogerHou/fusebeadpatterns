import type { SiteLocale } from '../i18n/locales';

export const qrBeadPaths: Record<SiteLocale, string> = {
    en: '/qr-code-bead-pattern-maker',
    de: '/de/buegelperlen-qr-code',
    fr: '/fr/qr-code-perles-a-repasser',
    ja: '/ja/iron-beads-qr-code',
};
export const qrBeadLabels: Record<SiteLocale, string> = {
    en: 'QR Code Bead Patterns',
    de: 'QR-Code aus Bügelperlen',
    fr: 'QR code en perles',
    ja: 'ビーズのQRコード',
};
export const qrBeadAlternates = {
    ...Object.fromEntries(Object.entries(qrBeadPaths).map(([locale, path]) => [locale, `https://fusebeadpatterns.art${path}`])),
    'x-default': `https://fusebeadpatterns.art${qrBeadPaths.en}`,
};

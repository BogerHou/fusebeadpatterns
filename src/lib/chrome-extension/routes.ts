import { SITE_LOCALES, type SiteLocale } from '../i18n/locales';

export const chromeExtensionPaths: Record<SiteLocale, string> = {
    en: '/chrome-extension',
    de: '/de/chrome-extension',
    fr: '/fr/chrome-extension',
    ja: '/ja/chrome-extension',
};

// Enable the install CTA only after the submitted listing is publicly installable.
// Listing: https://chromewebstore.google.com/detail/akbmofmjnmgpfcoojbebnbohpgagepeg
export const chromeExtensionStoreUrl: string | null = null;

export const chromeExtensionLanguages = Object.fromEntries([
    ...SITE_LOCALES.map(locale => [locale, `https://fusebeadpatterns.art${chromeExtensionPaths[locale]}`]),
    ['x-default', `https://fusebeadpatterns.art${chromeExtensionPaths.en}`],
]);

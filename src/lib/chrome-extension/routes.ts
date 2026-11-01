import { SITE_LOCALES, type SiteLocale } from '../i18n/locales';

export const chromeExtensionPaths: Record<SiteLocale, string> = {
    en: '/chrome-extension',
    de: '/de/chrome-extension',
    fr: '/fr/chrome-extension',
    ja: '/ja/chrome-extension',
};

// Official public listing, verified for version 0.2.8 on 2026-11-01.
export const chromeExtensionStoreUrl: string | null = 'https://chromewebstore.google.com/detail/perler-bead-pattern-maker/akbmofmjnmgpfcoojbebnbohpgagepeg';

export const chromeExtensionLanguages = Object.fromEntries([
    ...SITE_LOCALES.map(locale => [locale, `https://fusebeadpatterns.art${chromeExtensionPaths[locale]}`]),
    ['x-default', `https://fusebeadpatterns.art${chromeExtensionPaths.en}`],
]);

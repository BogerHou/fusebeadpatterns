import { qrBeadLabels, qrBeadPaths } from '@/lib/qr-beads/routes';
import { spriteLabels, spritePaths } from '@/lib/sprites/routes';
import { brickLabels, brickPaths } from '@/lib/brick-mosaic/routes';
import { bannerLabels, bannerPaths } from '@/lib/minecraft-banners/routes';
import Link from 'next/link';
import { getGuideSummaries } from '@/lib/guides/localized';
import { guidePages } from '@/app/(english)/guides/guide-data';
import { siteNavigation, type SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import { perlerColorChartLabels, perlerColorChartPaths } from '@/lib/color-chart/routes';
import { beadLetterLabels, beadLetterPaths } from '@/lib/bead-letters/routes';
import { blockShapeLabels, blockShapePaths } from '@/lib/block-shapes/routes';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './LanguageSwitcher.module.css';
import PrivacyPreferencesButton from '@/components/analytics/PrivacyPreferencesButton';
import AdSenseScript from '@/components/analytics/AdSenseScript';

type SiteFooterSection =
    | 'generator'
    | 'hama-maker'
    | 'patterns'
    | 'editor'
    | 'pixel-grid'
    | 'bead-loom'
    | 'bead-loom-patterns'
    | 'qr-beads'
    | 'sprites'
    | 'brick-mosaic'
    | 'banner-maker'
    | 'banner-letters'
    | 'bead-letters'
    | 'block-shapes'
    | 'guides'
    | 'color-chart'
    | 'chrome-extension'
    | 'about'
    | 'privacy'
    | 'terms';

type SiteFooterProps = {
    active?: SiteFooterSection;
    description?: string;
    locale?: SiteLocale;
    adsense?: boolean;
};

type FooterLink = {
    id?: SiteFooterSection | string;
    label: string;
    href: string;
    prefetch?: false;
    lang?: string;
    nativeNavigation?: true;
};

const chromeExtensionLabels: Record<SiteLocale, string> = {
    en: 'Chrome Extension',
    de: 'Chrome-Erweiterung',
    fr: 'Extension Chrome',
    ja: 'Chrome 拡張機能',
};

const beadLoomPatternLabels: Record<SiteLocale, string> = {
    en: 'Free Bead Loom Patterns',
    de: 'Perlenwebmuster-Vorlagen',
    fr: 'Modèles de métier à perles',
    ja: 'ビーズ織り図案集',
};

const footerGroups: Array<{
    title: string;
    links: FooterLink[];
}> = [
    {
        title: 'Make',
        links: [
            { id: 'generator', label: 'Generator', href: '/' },
            { id: 'hama-maker', label: siteNavigation.en.hamaMaker, href: localeRoutes.en.hamaMaker },
            { id: 'patterns', label: 'Browse Patterns', href: '/patterns' },
            { id: 'pixel-grid', label: 'Pixel Art Grid', href: '/pixel-art-grid', nativeNavigation: true },
            { id: 'bead-loom', label: 'Bead Loom Pattern Maker', href: '/bead-loom-pattern-maker', nativeNavigation: true },
            { id: 'bead-loom-patterns', label: beadLoomPatternLabels.en, href: localeRoutes.en.beadLoomPatterns },
            { id: 'bead-letters', label: beadLetterLabels.en, href: beadLetterPaths.en, nativeNavigation: true },
            { id: 'block-shapes', label: blockShapeLabels.en, href: blockShapePaths.en, nativeNavigation: true },
            { id: 'qr-beads', label: qrBeadLabels.en, href: qrBeadPaths.en, nativeNavigation: true },
            { id: 'sprites', label: spriteLabels.en, href: spritePaths.en, nativeNavigation: true },
            { id: 'brick-mosaic', label: brickLabels.en, href: brickPaths.en, nativeNavigation: true },
            { id: 'banner-maker', label: bannerLabels.designer.en, href: bannerPaths.designer.en, nativeNavigation: true },
            { id: 'banner-letters', label: bannerLabels.letters.en, href: bannerPaths.letters.en, nativeNavigation: true },
            {
                id: 'editor',
                label: 'Advanced Editor',
                href: '/editor',
                prefetch: false,
            },
        ],
    },
    {
        title: 'Learn',
        links: [
            { id: 'guides', label: 'All Guides', href: '/guides' },
            { id: 'color-chart', label: perlerColorChartLabels.en, href: perlerColorChartPaths.en },
            ...guidePages.map((guide) => ({
                id: `guide-${guide.slug}`,
                label: guide.title,
                href: `/guides/${guide.slug}`,
            })),
        ],
    },
    {
        title: 'Site',
        links: [
            { id: 'chrome-extension', label: chromeExtensionLabels.en, href: localeRoutes.en.extension },
            { id: 'about', label: 'About', href: '/about' },
            { id: 'privacy', label: 'Privacy Policy', href: '/privacy-policy' },
            { id: 'terms', label: 'Terms of Service', href: '/terms-of-service' },
            { label: 'Contact', href: 'mailto:contact@fusebeadpatterns.art' },
        ],
    },
];

const COPYRIGHT_YEAR = 2026;

export default function SiteFooter({
    active,
    description,
    locale = 'en',
    adsense = true,
}: SiteFooterProps) {
    const copy = siteNavigation[locale];
    const routes = localeRoutes[locale];
    const englishLabel = (label: string) => `${label} (${copy.english})`;
    const groups: Array<{ title: string; links: FooterLink[] }> = locale === 'en' ? footerGroups : [
        {
            title: copy.make,
            links: [
                { id: 'generator', label: copy.generator, href: routes.home },
                { id: 'hama-maker', label: copy.hamaMaker, href: routes.hamaMaker, lang: locale },
                { id: 'patterns', label: copy.browse, href: routes.patterns },
                { id: 'editor', label: copy.advancedEditor, href: routes.editor, prefetch: false },
                { id: 'pixel-grid', label: routes.pixelGrid ? copy.pixelGrid : englishLabel(copy.pixelGrid), href: routes.pixelGrid ?? '/pixel-art-grid', lang: routes.pixelGrid ? locale : 'en', nativeNavigation: true },
                { id: 'bead-loom', label: copy.beadLoom, href: routes.beadLoom, lang: locale, nativeNavigation: true },
                { id: 'bead-loom-patterns', label: beadLoomPatternLabels[locale], href: routes.beadLoomPatterns, lang: locale },
                { id: 'bead-letters', label: beadLetterLabels[locale], href: routes.beadLetters, lang: locale, nativeNavigation: true },
                { id: 'block-shapes', label: blockShapeLabels[locale], href: routes.blockShapes, lang: locale, nativeNavigation: true },
                { id: 'qr-beads', label: qrBeadLabels[locale], href: routes.qrBeads, lang: locale, nativeNavigation: true },
                { id: 'sprites', label: spriteLabels[locale], href: routes.sprites, lang: locale, nativeNavigation: true },
                { id: 'brick-mosaic', label: brickLabels[locale], href: brickPaths[locale], lang: locale, nativeNavigation: true },
                { id: 'banner-maker', label: bannerLabels.designer[locale], href: routes.bannerMaker, lang: locale, nativeNavigation: true },
                { id: 'banner-letters', label: bannerLabels.letters[locale], href: routes.bannerLetters, lang: locale, nativeNavigation: true },
            ] as FooterLink[],
        },
        {
            title: copy.learn,
            links: [
                { id: 'guides', label: copy.allGuides, href: routes.guides, lang: locale },
                { id: 'color-chart', label: perlerColorChartLabels[locale], href: perlerColorChartPaths[locale], lang: locale },
                ...getGuideSummaries(locale).map(guide => ({ id: `guide-${guide.slug}`, label: guide.language === locale ? guide.title : englishLabel(guide.title), href: guide.href, lang: guide.language })),
            ],
        },
        {
            title: copy.site,
            links: [
                { id: 'chrome-extension', label: chromeExtensionLabels[locale], href: routes.extension, lang: locale },
                { id: 'about', label: copy.about, href: routes.about, lang: locale },
                { id: 'privacy', label: copy.privacy, href: routes.privacy, lang: locale },
                { id: 'terms', label: copy.terms, href: routes.terms, lang: locale },
                { label: copy.contact, href: 'mailto:contact@fusebeadpatterns.art' },
            ],
        },
    ];
    return (
        <footer className="site-footer mt-auto">
            {adsense && <AdSenseScript />}
            <div className="site-footer-inner">
                <div>
                    <h2>Fuse Bead Patterns.</h2>
                    <p>{description ?? copy.description}</p>
                </div>
                <div className="footer-nav">
                    {groups.map((group) => (
                        <nav key={group.title} aria-label={group.title}>
                            <h3>{group.title}</h3>
                            <ul>
                                {group.links.map((link) => (
                                    <li key={link.href}>
                                        {link.nativeNavigation ? (
                                            // A separate document lets drawing workspaces protect browser Back
                                            // with beforeunload, as well as its in-page link guard.
                                            <a href={link.href} hrefLang={link.lang} aria-current={active === link.id ? 'page' : undefined}>{link.label}</a>
                                        ) : (
                                            <Link href={link.href} prefetch={false} lang={locale === 'en' ? link.lang : undefined} hrefLang={link.lang} aria-current={active === link.id ? 'page' : undefined}>{link.label}</Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>
            </div>
            <div className={`footer-note ${styles.footerNote}`}>
                <span>&copy; {COPYRIGHT_YEAR} Fuse Bead Patterns. {copy.copyright}</span>
                <PrivacyPreferencesButton locale={locale} />
                <LanguageSwitcher locale={locale} className={styles.footerSwitcher} />
            </div>
        </footer>
    );
}

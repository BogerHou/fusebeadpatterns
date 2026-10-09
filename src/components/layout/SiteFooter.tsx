import Link from 'next/link';
import { getGuideSummaries } from '@/lib/guides/localized';
import { guidePages } from '@/app/(english)/guides/guide-data';
import { siteNavigation, type SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './LanguageSwitcher.module.css';

type SiteFooterSection =
    | 'generator'
    | 'patterns'
    | 'editor'
    | 'pixel-grid'
    | 'bead-loom'
    | 'guides'
    | 'about'
    | 'privacy'
    | 'terms';

type SiteFooterProps = {
    active?: SiteFooterSection;
    description?: string;
    locale?: SiteLocale;
};

type FooterLink = {
    id?: SiteFooterSection | string;
    label: string;
    href: string;
    prefetch?: false;
    lang?: string;
    nativeNavigation?: true;
};

const footerGroups: Array<{
    title: string;
    links: FooterLink[];
}> = [
    {
        title: 'Make',
        links: [
            { id: 'generator', label: 'Generator', href: '/' },
            { id: 'patterns', label: 'Browse Patterns', href: '/patterns' },
            { id: 'pixel-grid', label: 'Pixel Art Grid', href: '/pixel-art-grid', nativeNavigation: true },
            { id: 'bead-loom', label: 'Bead Loom Pattern Maker', href: '/bead-loom-pattern-maker', nativeNavigation: true },
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
}: SiteFooterProps) {
    const copy = siteNavigation[locale];
    const routes = localeRoutes[locale];
    const englishLabel = (label: string) => `${label} (${copy.english})`;
    const groups: Array<{ title: string; links: FooterLink[] }> = locale === 'en' ? footerGroups : [
        {
            title: copy.make,
            links: [
                { id: 'generator', label: copy.generator, href: routes.home },
                { id: 'patterns', label: copy.browse, href: routes.patterns },
                { id: 'editor', label: copy.advancedEditor, href: routes.editor, prefetch: false },
                { id: 'pixel-grid', label: routes.pixelGrid ? copy.pixelGrid : englishLabel(copy.pixelGrid), href: routes.pixelGrid ?? '/pixel-art-grid', lang: routes.pixelGrid ? locale : 'en', nativeNavigation: true },
                { id: 'bead-loom', label: copy.beadLoom, href: routes.beadLoom, lang: locale, nativeNavigation: true },
            ] as FooterLink[],
        },
        {
            title: copy.learn,
            links: [
                { id: 'guides', label: copy.allGuides, href: routes.guides, lang: locale },
                ...getGuideSummaries(locale).map(guide => ({ id: `guide-${guide.slug}`, label: guide.language === locale ? guide.title : englishLabel(guide.title), href: guide.href, lang: guide.language })),
            ],
        },
        {
            title: copy.site,
            links: [
                { id: 'about', label: copy.about, href: routes.about, lang: locale },
                { id: 'privacy', label: copy.privacy, href: routes.privacy, lang: locale },
                { id: 'terms', label: copy.terms, href: routes.terms, lang: locale },
                { label: copy.contact, href: 'mailto:contact@fusebeadpatterns.art' },
            ],
        },
    ];
    return (
        <footer className="site-footer mt-auto">
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
                                            <Link href={link.href} prefetch={link.prefetch} lang={locale === 'en' ? link.lang : undefined} hrefLang={link.lang} aria-current={active === link.id ? 'page' : undefined}>{link.label}</Link>
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
                <LanguageSwitcher locale={locale} className={styles.footerSwitcher} />
            </div>
        </footer>
    );
}

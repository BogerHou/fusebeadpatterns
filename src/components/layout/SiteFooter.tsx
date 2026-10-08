import Link from 'next/link';
import { guidePages } from '@/app/(english)/guides/guide-data';

type SiteFooterSection =
    | 'generator'
    | 'patterns'
    | 'editor'
    | 'guides'
    | 'about'
    | 'privacy'
    | 'terms';

type SiteFooterProps = {
    active?: SiteFooterSection;
    description?: string;
};

type FooterLink = {
    id?: SiteFooterSection | string;
    label: string;
    href: string;
    prefetch?: false;
    lang?: string;
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
            { label: '日本語で図案を作る', href: '/ja', lang: 'ja', prefetch: false },
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
    description = 'Turn photos into printable perler bead patterns, then adjust the size, clean up beads, and export the result from your browser.',
}: SiteFooterProps) {
    return (
        <footer className="site-footer mt-auto">
            <div className="site-footer-inner">
                <div>
                    <h2>Fuse Bead Patterns.</h2>
                    <p>{description}</p>
                </div>
                <div className="footer-nav">
                    {footerGroups.map((group) => (
                        <nav key={group.title} aria-label={group.title}>
                            <h3>{group.title}</h3>
                            <ul>
                                {group.links.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} prefetch={link.prefetch} lang={link.lang} hrefLang={link.lang} aria-current={active === link.id ? 'page' : undefined}>{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>
            </div>
            <div className="footer-note">
                &copy; {COPYRIGHT_YEAR} Fuse Bead Patterns. All rights reserved. Not affiliated with any bead brand mentioned.
            </div>
        </footer>
    );
}

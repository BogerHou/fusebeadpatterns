import Link from 'next/link';
import { guidePages } from '@/app/guides/guide-data';

type SiteFooterSection =
    | 'generator'
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
};

const footerGroups: Array<{
    title: string;
    links: FooterLink[];
}> = [
    {
        title: 'Make',
        links: [
            { id: 'generator', label: 'Generator', href: '/' },
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
        <footer className="mt-auto border-t-2 border-brutal-black bg-white p-5 shadow-[0_-2px_0_0_rgba(26,26,26,1)] sm:border-t-4 sm:p-8 sm:shadow-[0_-4px_0_0_rgba(26,26,26,1)]">
            <div className="mx-auto grid max-w-6xl gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_2fr]">
                <div>
                    <h2 className="mb-2 font-vt323 text-2xl font-bold uppercase">
                        Fuse Bead Patterns
                    </h2>
                    <p className="max-w-md font-medium text-gray-600">
                        {description}
                    </p>
                </div>
                <div className="grid gap-5 text-sm sm:grid-cols-3 sm:gap-6">
                    {footerGroups.map((group) => (
                        <nav key={group.title} aria-label={group.title}>
                            <h3 className="mb-3 font-bold uppercase tracking-[0.12em] text-brutal-black">
                                {group.title}
                            </h3>
                            <ul className="space-y-2 font-medium text-gray-700">
                                {group.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            prefetch={link.prefetch}
                                            className={`hover:text-brand-purple hover:underline decoration-2 underline-offset-4 ${
                                                active === link.id
                                                    ? 'underline'
                                                    : ''
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>
            </div>
            <div className="mt-6 border-t-2 border-dashed border-gray-300 pt-5 text-center font-vt323 text-base leading-none text-gray-500 sm:mt-8 sm:pt-6 sm:text-lg">
                &copy; {COPYRIGHT_YEAR} Fuse Bead Patterns. All
                rights reserved. Not affiliated with any bead brand mentioned.
            </div>
        </footer>
    );
}

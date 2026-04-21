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

export default function SiteFooter({
    active,
    description = 'A free tool for turning photos into printable Perler, Hama, and Artkal bead patterns.',
}: SiteFooterProps) {
    return (
        <footer className="mt-auto border-t-4 border-brutal-black bg-white p-8 shadow-[0_-4px_0_0_rgba(26,26,26,1)]">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_2fr]">
                <div>
                    <h2 className="mb-2 font-vt323 text-2xl font-bold uppercase">
                        Bead Pattern Maker
                    </h2>
                    <p className="max-w-md font-medium text-gray-600">
                        {description}
                    </p>
                </div>
                <div className="grid gap-6 text-sm sm:grid-cols-3">
                    {footerGroups.map((group) => (
                        <nav key={group.title} aria-label={group.title}>
                            <h3 className="mb-3 inline-block border-2 border-brutal-black bg-brand-yellow px-2 py-1 font-vt323 text-2xl uppercase leading-none">
                                {group.title}
                            </h3>
                            <ul className="space-y-2 font-bold">
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
            <div className="mt-8 border-t-2 border-dashed border-gray-300 pt-6 text-center font-vt323 text-lg text-gray-500">
                &copy; {new Date().getFullYear()} Bead Pattern Maker. All
                rights reserved. Not affiliated with Perler, Hama, or Artkal.
            </div>
        </footer>
    );
}

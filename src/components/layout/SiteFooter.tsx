import Link from 'next/link';

type SiteFooterSection = 'guides' | 'about' | 'privacy' | 'terms';

type SiteFooterProps = {
    active?: SiteFooterSection;
    description?: string;
};

const footerLinks: Array<{
    id: SiteFooterSection;
    label: string;
    href: string;
}> = [
    { id: 'guides', label: 'Guides', href: '/guides' },
    { id: 'about', label: 'About', href: '/about' },
    { id: 'privacy', label: 'Privacy Policy', href: '/privacy-policy' },
    { id: 'terms', label: 'Terms of Service', href: '/terms-of-service' },
];

export default function SiteFooter({
    active,
    description = 'A free tool for turning photos into printable Perler, Hama, and Artkal bead patterns.',
}: SiteFooterProps) {
    return (
        <footer className="mt-auto border-t-4 border-brutal-black bg-white p-8 shadow-[0_-4px_0_0_rgba(26,26,26,1)]">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
                <div className="text-center md:text-left">
                    <h2 className="mb-2 font-vt323 text-2xl font-bold uppercase">
                        Bead Pattern Maker
                    </h2>
                    <p className="max-w-md font-medium text-gray-600">
                        {description}
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-6 text-sm font-bold uppercase">
                    {footerLinks.map((link) => (
                        <Link
                            key={link.id}
                            href={link.href}
                            className={`hover:text-brand-purple hover:underline decoration-2 underline-offset-4 ${
                                active === link.id ? 'underline' : ''
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="mailto:contact@fusebeadpatterns.art"
                        className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4"
                    >
                        Contact
                    </Link>
                </div>
            </div>
            <div className="mt-8 border-t-2 border-dashed border-gray-300 pt-6 text-center font-vt323 text-lg text-gray-500">
                &copy; {new Date().getFullYear()} Bead Pattern Maker. All
                rights reserved. Not affiliated with Perler, Hama, or Artkal.
            </div>
        </footer>
    );
}

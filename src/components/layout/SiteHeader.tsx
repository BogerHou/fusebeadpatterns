import Image from 'next/image';
import Link from 'next/link';

type SiteHeaderSection = 'generator' | 'patterns' | 'editor' | 'guides' | 'about';

type SiteHeaderProps = {
    active?: SiteHeaderSection;
};

const navItems: Array<{
    id: SiteHeaderSection;
    label: string;
    href: string;
    prefetch?: false;
}> = [
    { id: 'generator', label: 'Generator', href: '/' },
    { id: 'patterns', label: 'Patterns', href: '/patterns' },
    { id: 'editor', label: 'Editor', href: '/editor', prefetch: false },
    { id: 'guides', label: 'Guides', href: '/guides' },
    { id: 'about', label: 'About', href: '/about' },
];

export default function SiteHeader({ active }: SiteHeaderProps) {
    return (
        <header className="site-header">
            <a href="#main-content" className="skip-link">Skip to content</a>
            <div className="site-header-inner">
                <Link href="/" className="site-brand">
                    <Image src="/logo.png" alt="Fuse Bead Patterns Logo" width={36} height={36} sizes="36px" preload />
                    <span className="site-brand-name">Fuse Bead Patterns<span className="text-accent" aria-hidden="true">.</span></span>
                </Link>
                <nav className="site-nav" aria-label="Main navigation">
                    {navItems.map((item) => (
                        <Link key={item.id} href={item.href} prefetch={item.prefetch} aria-label={item.label} aria-current={item.id === active ? 'page' : undefined}>
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}

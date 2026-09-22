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
        <header className="mx-3 mb-3 mt-2 flex flex-col gap-2 border-b-2 border-brutal-black bg-brand-cyan p-2 shadow-[2px_2px_0_0_#1a1a1a] sm:mx-4 sm:mb-8 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:border-b-4 sm:p-4 sm:shadow-brutal">
            <Link
                href="/"
                className="flex min-h-9 min-w-0 items-center gap-2.5 sm:min-h-10 sm:gap-4"
            >
                <Image
                    src="/logo.png"
                    alt="Fuse Bead Patterns Logo"
                    width={40}
                    height={40}
                    sizes="(max-width: 639px) 28px, 40px"
                    className="h-7 w-7 shrink-0 rounded border-2 border-brutal-black bg-white object-cover sm:h-10 sm:w-10 sm:border-4"
                    priority
                />
                <div className="min-w-0 pt-0.5 font-vt323 text-lg uppercase leading-none sm:pt-1 sm:text-4xl">
                    Fuse Bead Patterns
                </div>
            </Link>
            <nav className="grid w-full grid-cols-5 gap-1 text-center text-[10px] font-bold uppercase sm:flex sm:w-auto sm:items-center sm:gap-3 sm:text-sm">
                {navItems.map((item) => {
                    const isActive = item.id === active;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            prefetch={item.prefetch}
                            aria-label={item.label}
                            className={`flex min-h-9 min-w-0 items-center justify-center overflow-hidden whitespace-nowrap border-2 border-brutal-black px-1 py-1 shadow-[1px_1px_0_0_#1a1a1a] hover:bg-brand-yellow sm:min-h-0 sm:border-4 sm:px-3 sm:py-2 sm:shadow-[3px_3px_0_0_#1a1a1a] ${
                                isActive
                                    ? 'bg-brand-yellow hover:bg-white'
                                    : 'bg-white'
                            }`}
                        >
                            <span className="truncate sm:hidden">
                                {item.label}
                            </span>
                            <span className="hidden sm:inline">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}

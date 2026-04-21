import Image from 'next/image';
import Link from 'next/link';

type SiteHeaderSection = 'generator' | 'editor' | 'guides' | 'about';

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
    { id: 'editor', label: 'Editor', href: '/editor', prefetch: false },
    { id: 'guides', label: 'Guides', href: '/guides' },
    { id: 'about', label: 'About', href: '/about' },
];

export default function SiteHeader({ active }: SiteHeaderProps) {
    return (
        <header className="mx-4 mb-6 mt-4 flex flex-col gap-4 border-b-4 border-brutal-black bg-brand-cyan p-4 shadow-brutal sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-4">
                <Image
                    src="/logo.png"
                    alt="Bead Pattern Maker Logo"
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded border-4 border-brutal-black bg-white object-cover"
                    priority
                />
                <div className="pt-1 font-vt323 text-3xl uppercase leading-none sm:text-4xl">
                    Bead Pattern Maker
                </div>
            </Link>
            <nav className="grid w-full grid-cols-2 gap-2 text-center text-[13px] font-bold uppercase sm:flex sm:w-auto sm:items-center sm:gap-3 sm:text-sm">
                {navItems.map((item) => {
                    const isActive = item.id === active;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            prefetch={item.prefetch}
                            className={`whitespace-nowrap border-4 border-brutal-black px-3 py-2 shadow-[3px_3px_0_0_#1a1a1a] hover:bg-brand-yellow ${
                                isActive
                                    ? 'bg-brand-yellow hover:bg-white'
                                    : 'bg-white'
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </header>
    );
}

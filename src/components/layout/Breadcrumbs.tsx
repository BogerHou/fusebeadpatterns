import Link from 'next/link';

const siteUrl = 'https://fusebeadpatterns.art';

export type BreadcrumbItem = {
    label: string;
    href: string;
};

type BreadcrumbsProps = {
    items: BreadcrumbItem[];
};

function toAbsoluteUrl(href: string): string {
    return href.startsWith('http') ? href : `${siteUrl}${href}`;
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            item: toAbsoluteUrl(item.href),
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData),
                }}
            />
            <nav
                aria-label="Breadcrumb"
                className="mb-5 w-full text-xs font-black uppercase tracking-[0.14em] text-brutal-black/65"
            >
                <ol className="flex flex-wrap items-center gap-2">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;

                        return (
                            <li
                                key={item.href}
                                className="flex items-center gap-2"
                            >
                                {index > 0 ? (
                                    <span
                                        aria-hidden="true"
                                        className="text-brutal-black/40"
                                    >
                                        /
                                    </span>
                                ) : null}
                                {isLast ? (
                                    <span className="border-2 border-brutal-black bg-brand-yellow px-2 py-1 text-brutal-black">
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="border-2 border-brutal-black bg-white px-2 py-1 text-brutal-black shadow-[2px_2px_0_0_#1a1a1a] hover:bg-brand-cyan"
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
}

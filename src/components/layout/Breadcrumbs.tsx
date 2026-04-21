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
                className="mb-4 w-full text-xs font-bold text-brutal-black/70 sm:mb-5 sm:text-sm"
            >
                <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:gap-2">
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
                                    <span className="text-brutal-black">
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="text-brutal-black hover:text-brand-purple hover:underline decoration-2 underline-offset-4"
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

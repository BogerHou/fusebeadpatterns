import Link from 'next/link';

const siteUrl = 'https://fusebeadpatterns.art';

export type BreadcrumbItem = {
    label: string;
    href: string;
};

type BreadcrumbsProps = {
    items: BreadcrumbItem[];
    label?: string;
};

function toAbsoluteUrl(href: string): string {
    return href.startsWith('http') ? href : `${siteUrl}${href}`;
}

export default function Breadcrumbs({ items, label = 'Breadcrumb' }: BreadcrumbsProps) {
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
                aria-label={label}
                className="mb-6 w-full text-xs font-medium text-muted"
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
                                    <span className="text-brutal-black" aria-current="page">
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="inline-flex min-h-10 items-center px-1.5 text-muted hover:text-accent hover:underline decoration-2 underline-offset-4"
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

import type { Metadata } from 'next';
import { Inter, VT323 } from 'next/font/google';
import PatternAnalytics from '@/components/analytics/PatternAnalytics';
import './globals.css';

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

const vt323 = VT323({
    variable: '--font-vt323',
    weight: '400',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    metadataBase: new URL('https://fusebeadpatterns.art'),
    title: 'Free Perler Bead Pattern Generator | Fuse Bead Patterns',
    description: 'Convert photos into printable Perler bead patterns with a free browser-based fuse bead generator. Preview the pattern, adjust the size, clean it up, and export when ready.',
    keywords: [
        'perler bead patterns',
        'perler bead pattern generator',
        'printable perler bead patterns',
        'photo to perler beads',
        'fuse bead generator',
        'bead pattern maker',
        'hama beads',
        'pixel art'
    ],
    authors: [{ name: 'Fuse Bead Patterns' }],
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Free Perler Bead Pattern Generator | Fuse Bead Patterns',
        description: 'Convert photos into printable Perler bead patterns with a free browser-based fuse bead generator. Preview the pattern, adjust the size, clean it up, and export when ready.',
        url: 'https://fusebeadpatterns.art',
        siteName: 'Fuse Bead Patterns',
        type: 'website',
        images: [
            {
                url: '/opengraph-image.png',
                width: 1200,
                height: 630,
                alt: 'Free Perler Bead Pattern Generator',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Free Perler Bead Pattern Generator | Fuse Bead Patterns',
        description: 'Convert photos into printable Perler bead patterns with a free browser-based fuse bead generator. Preview the pattern, adjust the size, clean it up, and export when ready.',
        images: ['/opengraph-image.png'],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${inter.variable} ${vt323.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <body className="min-h-full flex flex-col bg-[#F4F4F0] text-gray-900 font-sans">
                {children}
                <PatternAnalytics />
            </body>
        </html>
    );
}

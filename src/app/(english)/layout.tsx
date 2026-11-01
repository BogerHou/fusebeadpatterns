import type { Metadata } from 'next';
import { inter, manrope } from '@/lib/site-fonts';
import PatternAnalytics from '@/components/analytics/PatternAnalytics';
import '../globals.css';

export const metadata: Metadata = {
    metadataBase: new URL('https://fusebeadpatterns.art'),
    title: 'Free Perler Bead Pattern Generator | Fuse Bead Patterns',
    description: 'Turn a photo into a Perler bead pattern for free. Choose the size and colors, edit individual beads, then download a printable PDF or image.',
    authors: [{ name: 'Fuse Bead Patterns' }],
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Free Perler Bead Pattern Generator | Fuse Bead Patterns',
        description: 'Turn a photo into a Perler bead pattern for free. Choose the size and colors, edit individual beads, then download a printable PDF or image.',
        url: 'https://fusebeadpatterns.art',
        siteName: 'Fuse Bead Patterns',
        locale: 'en_US',
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
        description: 'Turn a photo into a Perler bead pattern for free. Choose the size and colors, edit individual beads, then download a printable PDF or image.',
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
            className={`${inter.variable} ${manrope.variable} h-full antialiased`}
            suppressHydrationWarning
        >
            <body className="min-h-full flex flex-col font-sans">
                {children}
                <PatternAnalytics />
            </body>
        </html>
    );
}

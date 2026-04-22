import type { Metadata } from 'next';
import { Inter, VT323 } from 'next/font/google';
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
    title: 'Free Perler Bead Pattern Generator | Bead Pattern Maker',
    description: 'Convert photos into Perler bead patterns with our free fuse bead generator. Create amazing custom pixel art designs locally in your browser. Try it now!',
    keywords: [
        'perler bead patterns',
        'fuse bead generator',
        'bead pattern maker',
        'hama beads',
        'pixel art'
    ],
    authors: [{ name: 'Bead Pattern Maker' }],
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Free Perler Bead Pattern Generator | Bead Pattern Maker',
        description: 'Convert photos into Perler bead patterns with our free fuse bead generator. Create amazing custom pixel art designs locally in your browser. Try it now!',
        url: 'https://fusebeadpatterns.art',
        siteName: 'Bead Pattern Maker',
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
        title: 'Free Perler Bead Pattern Generator | Bead Pattern Maker',
        description: 'Convert photos into Perler bead patterns with our free fuse bead generator. Create amazing custom pixel art designs locally in your browser. Try it now!',
        images: ['/opengraph-image.png'],
    },
};

import Script from 'next/script';

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
            <head>
                <Script
                    strategy="lazyOnload"
                    async
                    src="https://www.googletagmanager.com/gtag/js?id=G-K3EC5BK93E"
                ></Script>
                <Script id="google-analytics" strategy="lazyOnload">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', 'G-K3EC5BK93E');
                    `}
                </Script>
            </head>
            <body className="min-h-full flex flex-col bg-[#F4F4F0] text-gray-900 font-sans">
                {children}
            </body>
        </html>
    );
}

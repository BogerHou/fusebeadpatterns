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
    title: 'Free Perler Bead Pattern Generator | Fuse Bead Patterns & Designs',
    description:
        'The best online tool to convert your photos into Perler bead patterns. Easy-to-use fuse bead pattern maker with Minecraft and Pokemon designs. 100% privacy-focused, works locally in your browser.',
    keywords: [
        'bead pattern maker',
        'perler beads generator',
        'hama beads',
        'artkal beads',
        'fuse beads',
        'ironing beads',
        'pixel art maker',
        'photo to beads',
        'bead pattern generator free'
    ],
    authors: [{ name: 'Bead Pattern Maker' }],
    openGraph: {
        title: 'Free Perler Bead Pattern Generator | Fuse Bead Patterns & Designs',
        description: 'The best online tool to convert your photos into Perler bead patterns. Easy-to-use fuse bead pattern maker with Minecraft and Pokemon designs. 100% privacy-focused, works locally in your browser.',
        url: 'https://fusebeadpatterns.art',
        siteName: 'Bead Pattern Maker',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Free Perler Bead Pattern Generator | Fuse Bead Patterns & Designs',
        description: 'The best online tool to convert your photos into Perler bead patterns. Easy-to-use fuse bead pattern maker with Minecraft and Pokemon designs. 100% privacy-focused, works locally in your browser.',
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
        >
            <head>
                <Script
                    async
                    src="https://www.googletagmanager.com/gtag/js?id=G-K3EC5BK93E"
                ></Script>
                <Script id="google-analytics">
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

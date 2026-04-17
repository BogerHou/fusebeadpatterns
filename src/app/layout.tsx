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
    title: 'Bead Pattern Maker - Free Pixel Art & Perler Beads Generator',
    description:
        'Convert your images into bead patterns (Perler, Hama, Artkal) instantly. Free, SEO-friendly, and open-source pixel art generator with PDF export.',
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
        title: 'Bead Pattern Maker - Free Pixel Art & Perler Beads Generator',
        description: 'Convert your images into bead patterns (Perler, Hama, Artkal) instantly. Download as PDF, SVG, or Excel.',
        url: 'https://beadpattern.net', // Adjust this if the domain is different
        siteName: 'Bead Pattern Maker',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Bead Pattern Maker - Free Pixel Art Generator',
        description: 'Convert images into bead patterns instantly.',
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
        >
            <body className="min-h-full flex flex-col bg-[#F4F4F0] text-gray-900 font-sans">
                {children}
            </body>
        </html>
    );
}

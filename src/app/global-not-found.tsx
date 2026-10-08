import type { Metadata } from 'next';
import NotFound from './(english)/not-found';
import { inter, manrope } from '@/lib/site-fonts';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL('https://fusebeadpatterns.art'),
    title: 'Page not found | Fuse Bead Patterns',
    robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
    return (
        <html lang="en" className={`${inter.variable} ${manrope.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col font-sans"><NotFound /></body>
        </html>
    );
}

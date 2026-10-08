import type { Metadata } from 'next';
import PatternAnalytics from '@/components/analytics/PatternAnalytics';
import { inter, manrope } from '@/lib/site-fonts';
import '../globals.css';

export const metadata: Metadata = {
    metadataBase: new URL('https://fusebeadpatterns.art'),
};

export default function GermanLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="de" className={`${inter.variable} ${manrope.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col font-sans">
                {children}
                <PatternAnalytics />
            </body>
        </html>
    );
}

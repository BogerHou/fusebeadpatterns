import type { Metadata } from 'next';
import NotFoundDocument from '@/components/layout/NotFoundDocument';
import { notFoundMetadata } from '@/lib/i18n/not-found';
import { inter, manrope } from '@/lib/site-fonts';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL('https://fusebeadpatterns.art'),
    ...notFoundMetadata('en'),
};

export default function GlobalNotFound() {
    return <NotFoundDocument className={`${inter.variable} ${manrope.variable} h-full antialiased`} />;
}

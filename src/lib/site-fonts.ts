import { Inter, Manrope } from 'next/font/google';

export const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
});

export const manrope = Manrope({
    variable: '--font-display',
    subsets: ['latin'],
    display: 'swap',
});

import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy | Bead Pattern Maker',
    description: 'Privacy Policy for Bead Pattern Maker. Learn how we protect your data—all image processing is done locally in your browser.',
    alternates: {
        canonical: '/privacy-policy',
    },
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-brand-yellow">
            {/* Header */}
            <header className="border-b-4 border-brutal-black bg-brand-cyan p-4 flex items-center justify-between shadow-brutal mx-4 mt-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="w-10 h-10 border-4 border-brutal-black bg-black rounded shrink-0 block hover:scale-105 transition-transform" />
                    <Link href="/">
                        <h1 className="text-4xl font-vt323 uppercase tracking-wide leading-none pt-1 hover:underline underline-offset-4 decoration-4">
                            Bead Pattern Maker
                        </h1>
                    </Link>
                </div>
                <nav className="font-bold text-lg hidden md:flex gap-6 uppercase">
                    <Link href="/" className="hover:underline underline-offset-4 decoration-4">Home</Link>
                    <Link href="/about" className="hover:underline underline-offset-4 decoration-4">About</Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 pb-12 flex flex-col items-center">
                <div className="w-full max-w-4xl border-4 border-brutal-black bg-white p-8 md:p-12 shadow-brutal">
                    <h2 className="text-5xl font-black uppercase mb-8 tracking-tight">Privacy Policy</h2>
                    
                    <div className="space-y-6 text-lg font-medium text-gray-800 prose prose-lg max-w-none">
                        <p><strong>Last Updated:</strong> April 17, 2026</p>

                        <p>At Bead Pattern Maker ("we", "our", or "us"), your privacy is our top priority. We designed our perler bead pattern generator with privacy built-in from the ground up.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">1. Local Image Processing</h3>
                        <p><strong>We do not upload your images.</strong> When you select a photo to convert into a fuse bead pattern, the entire image processing operation happens <em>locally</em> within your web browser using JavaScript. Your images are never sent to our servers, and we have no access to them.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">2. Data Collection</h3>
                        <p>We do not require you to create an account, and we do not collect personally identifiable information (PII) such as your name, email address, or location to use our core pattern generation features.</p>
                        <p>We may use basic analytics tools (like Vercel Web Analytics or similar privacy-friendly analytics) to collect anonymous, aggregated usage data (such as page views or browser types) to help us improve the website. This data cannot be used to identify you personally.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">3. Cookies</h3>
                        <p>Our website may use standard functional cookies or local storage strictly necessary to remember your editor preferences (like zoom levels, grid settings, or selected palettes). We do not use third-party tracking cookies for targeted advertising.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">4. Third-Party Links</h3>
                        <p>Our website may contain links to third-party websites (e.g., places to buy Perler bead kits). We are not responsible for the privacy practices or the content of those third-party sites.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">5. Contact Us</h3>
                        <p>If you have any questions or concerns about this Privacy Policy, please contact us at: <a href="mailto:contact@fusebeadpatterns.art" className="text-brand-purple hover:underline">contact@fusebeadpatterns.art</a>.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t-4 border-brutal-black bg-white p-8 mt-auto">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="font-vt323 text-3xl uppercase tracking-wider mb-2">Bead Pattern Maker</h2>
                        <p className="font-medium text-gray-600 max-w-md">The ultimate free tool for turning photos into printable Perler, Hama, and Artkal bead patterns.</p>
                    </div>
                    <div className="flex gap-6 font-bold uppercase text-sm">
                        <Link href="/privacy-policy" className="underline decoration-2 underline-offset-4">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Terms of Service</Link>
                        <Link href="mailto:contact@fusebeadpatterns.art" className="hover:text-brand-purple hover:underline decoration-2 underline-offset-4">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

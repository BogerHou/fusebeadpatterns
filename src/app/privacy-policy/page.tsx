import React from 'react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';

export const metadata = {
    title: 'Privacy Policy | Bead Pattern Maker',
    description: 'Privacy Policy for Bead Pattern Maker. Learn how we protect your data—all image processing is done locally in your browser.',
    alternates: {
        canonical: '/privacy-policy',
    },
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <SiteHeader />

            {/* Main Content */}
            <main className="flex-1 px-3 pb-10 flex flex-col items-center sm:px-4 sm:pb-12">
                <div className="w-full max-w-4xl">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Privacy Policy', href: '/privacy-policy' },
                        ]}
                    />
                </div>
                <div className="w-full max-w-4xl border-2 border-brutal-black bg-white p-5 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-8 sm:shadow-brutal md:p-12">
                    <h1 className="text-4xl font-black uppercase mb-5 tracking-tight sm:mb-8 sm:text-5xl">Privacy Policy</h1>
                    
                    <div className="space-y-5 text-base font-medium text-gray-800 prose max-w-none sm:space-y-6 sm:text-lg sm:prose-lg">
                        <p><strong>Last Updated:</strong> April 17, 2026</p>

                        <p>At Bead Pattern Maker (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), your privacy is our top priority. We designed our perler bead pattern generator with privacy built-in from the ground up.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">1. Local Image Processing</h3>
                        <p><strong>We do not upload your images.</strong> When you select a photo to convert into a fuse bead pattern, the entire image processing operation happens <em>locally</em> within your web browser using JavaScript. Your images are never sent to our servers, and we have no access to them.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">2. Data Collection</h3>
                        <p>We do not require you to create an account, and we do not collect personally identifiable information (PII) such as your name, email address, or location to use our core pattern generation features.</p>
                        <p>We use Google Analytics to understand anonymous, aggregated usage patterns such as page views, device type, browser type, and general interaction trends. This helps us improve the generator and editor experience. We do not use analytics to inspect your uploaded images, and image processing still happens locally in your browser.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">3. Cookies</h3>
                        <p>Our website may use standard functional cookies or local storage strictly necessary to remember editor preferences such as zoom levels, grid settings, selected palettes, or draft pattern data. Google Analytics may use cookies or similar technologies for measurement. We do not use third-party tracking cookies for targeted advertising.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">4. Third-Party Links</h3>
                        <p>Our website may contain links to third-party websites (e.g., places to buy Perler bead kits). We are not responsible for the privacy practices or the content of those third-party sites.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">5. Contact Us</h3>
                        <p>If you have any questions or concerns about this Privacy Policy, please contact us at: <a href="mailto:contact@fusebeadpatterns.art" className="text-brand-purple hover:underline">contact@fusebeadpatterns.art</a>.</p>
                    </div>
                </div>
            </main>

            <SiteFooter active="privacy" />
        </div>
    );
}

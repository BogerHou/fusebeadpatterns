import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import { sitePageLanguageAlternates } from '@/lib/site-pages/routes';

export const metadata = {
    title: 'Privacy Policy | Fuse Bead Patterns',
    description: 'Privacy Policy for Fuse Bead Patterns. Learn how we protect your data while image processing runs locally in your browser.',
    alternates: {
        canonical: '/privacy-policy',
        languages: sitePageLanguageAlternates('privacy-policy'),
    },
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <SiteHeader />

            <main id="main-content" tabIndex={-1} className="page-shell reading-page flex-1 pb-16 sm:pb-24">
                <div className="w-full">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Privacy Policy', href: '/privacy-policy' },
                        ]}
                    />
                </div>
                <div className="reading-article mx-auto w-full pt-4 sm:pt-8">
                    <h1 className="page-heading mb-8 sm:mb-10">
                        Privacy Policy
                    </h1>
                    
                    <div className="max-w-[70ch] space-y-6 text-base leading-8 text-[#43564d] sm:text-lg sm:leading-8">
                        <p><strong>Last Updated:</strong> April 17, 2026</p>

                        <p>At Fuse Bead Patterns (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), your privacy is a core part of the product. We designed our perler bead pattern generator so image processing runs locally in your browser.</p>

                        <h2 className="section-heading !mb-4 !mt-12">1. Local Image Processing</h2>
                        <p><strong>We do not upload your images.</strong> When you select a photo to convert into a fuse bead pattern, the entire image processing operation happens <em>locally</em> within your web browser using JavaScript. Your images are never sent to our servers, and we have no access to them.</p>

                        <h2 className="section-heading !mb-4 !mt-12">2. Data Collection</h2>
                        <p>We do not require you to create an account, and we do not collect personally identifiable information (PII) such as your name, email address, or location to use our core pattern generation features.</p>
                        <p>We use Google Analytics to understand anonymous, aggregated usage patterns such as page views, device type, browser type, and general interaction trends. This helps us improve the generator and editor experience. We do not use analytics to inspect your uploaded images, and image processing still happens locally in your browser.</p>

                        <h2 className="section-heading !mb-4 !mt-12">3. Cookies</h2>
                        <p>Our website may use standard functional cookies or local storage strictly necessary to remember editor preferences such as zoom levels, grid settings, selected palettes, or draft pattern data. Google Analytics may use cookies or similar technologies for measurement. We do not use third-party tracking cookies for targeted advertising.</p>

                        <h2 className="section-heading !mb-4 !mt-12">4. Third-Party Links</h2>
                        <p>Our website may contain links to third-party websites, such as craft supply resources or external references. We are not responsible for the privacy practices or the content of those third-party sites.</p>

                        <h2 className="section-heading !mb-4 !mt-12">5. Contact Us</h2>
                        <p>If you have any questions or concerns about this Privacy Policy, please contact us at: <a href="mailto:contact@fusebeadpatterns.art" className="text-link break-words">contact@fusebeadpatterns.art</a>.</p>
                    </div>
                </div>
            </main>

            <SiteFooter active="privacy" />
        </div>
    );
}

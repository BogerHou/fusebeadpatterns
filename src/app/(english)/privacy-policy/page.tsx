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
                        <p><strong>Last Updated:</strong> <time dateTime="2026-10-15">October 15, 2026</time></p>

                        <p>At Fuse Bead Patterns (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), your privacy is a core part of the product. We designed our perler bead pattern generator so image processing runs locally in your browser.</p>

                        <h2 className="section-heading !mb-4 !mt-12">1. Local Image Processing</h2>
                        <p><strong>We do not upload your images.</strong> When you select a photo to convert into a fuse bead pattern, the entire image processing operation happens <em>locally</em> within your web browser using JavaScript. Your images are never sent to our servers, and we have no access to them.</p>

                        <h2 className="section-heading !mb-4 !mt-12">2. Data Collection</h2>
                        <p>We do not require you to create an account, and we do not collect personally identifiable information (PII) such as your name, email address, or location to use our core pattern generation features.</p>
                        <p>Google Analytics is optional and stays off until you choose to allow it. If allowed, Google can process cookie identifiers and device or network information to measure visits and interactions. We use the resulting reports to improve the tools. Our download and editor events describe the public pattern or tool, bead brand and file format used. They do not include your images, filenames or project contents.</p>
                        <p>Our analytics configuration uses the page’s canonical address without its query string or fragment. We do not request your precise location, enable Google advertising signals or send contact-message contents as analytics events.</p>

                        <h2 className="section-heading !mb-4 !mt-12">3. Cookies</h2>
                        <p>The tools use browser storage for settings and draft projects. Your analytics choice is also stored in this browser and applies across the site’s languages. Google Analytics may set measurement cookies after you allow it. Keeping analytics off does not stop image conversion, editing, downloads or local project saving.</p>

                        <h2 className="section-heading !mb-4 !mt-12">4. Third-Party Links</h2>
                        <p>Our website may contain links to third-party websites, such as craft supply resources or external references. We are not responsible for the privacy practices or the content of those third-party sites.</p>

                        <h2 className="section-heading !mb-4 !mt-12">5. Contact Us</h2>
                        <p>If you have any questions or concerns about this Privacy Policy, please contact us at: <a href="mailto:contact@fusebeadpatterns.art" className="text-link break-words">contact@fusebeadpatterns.art</a>.</p>
                        <p>If you email us, we receive your email address and the information you choose to include. We use that message to respond to your question or review a reported issue. Do not include private photos or unrelated identifying information. You can use this address to ask about your correspondence or request its deletion.</p>

                        <h2 className="section-heading !mb-4 !mt-12">6. Your Analytics Choice</h2>
                        <p>Open “Analytics preferences” in the footer to allow measurement, keep it off or withdraw permission. Turning it off stops our analytics events and disables Google Analytics measurement in the current page; the site also removes its Google Analytics cookies. It does not delete your editor drafts. If browser storage is unavailable, the tools still work, and the preference dialog explains when a choice could not be saved. Turning measurement off does not delete data already received by Google.</p>
                        <p>For Google’s own description of the data it processes, read <a href="https://policies.google.com/technologies/partner-sites?hl=en" target="_blank" rel="noopener noreferrer" className="text-link">how Google uses information from sites that use its services</a>.</p>

                        <h2 className="section-heading !mb-4 !mt-12">7. Advertising</h2>
                        <p>Normal pages load a Google AdSense script to associate this site with our publisher account. The script contacts Google and may process device and network information, even when optional Google Analytics is off. Ads are not currently displayed. Analytics preferences control only Google Analytics; they are not an advertising consent system. Before ads are shown, this policy and the applicable consent controls will be updated, including any required Google-certified consent platform for visitors in the EEA, UK and Switzerland.</p>
                    </div>
                </div>
            </main>

            <SiteFooter active="privacy" />
        </div>
    );
}

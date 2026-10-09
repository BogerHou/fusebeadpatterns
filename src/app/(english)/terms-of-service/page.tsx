import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import { sitePageLanguageAlternates } from '@/lib/site-pages/routes';

export const metadata = {
    title: 'Terms of Service | Fuse Bead Patterns',
    description: 'Terms of Service and terms of use for Fuse Bead Patterns.',
    alternates: {
        canonical: '/terms-of-service',
        languages: sitePageLanguageAlternates('terms-of-service'),
    },
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen flex flex-col">
            <SiteHeader />

            <main id="main-content" tabIndex={-1} className="page-shell reading-page flex-1 pb-16 sm:pb-24">
                <div className="w-full">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            {
                                label: 'Terms of Service',
                                href: '/terms-of-service',
                            },
                        ]}
                    />
                </div>
                <div className="reading-article mx-auto w-full pt-4 sm:pt-8">
                    <h1 className="page-heading mb-8 sm:mb-10">
                        Terms of Service
                    </h1>
                    
                    <div className="max-w-[70ch] space-y-6 text-base leading-8 text-[#43564d] sm:text-lg sm:leading-8">
                        <p><strong>Last Updated:</strong> April 17, 2026</p>

                        <p>Welcome to Fuse Bead Patterns. By accessing or using our website (fusebeadpatterns.art) and services, you agree to be bound by these Terms of Service.</p>

                        <h2 className="section-heading !mb-4 !mt-12">1. Use of the Service</h2>
                        <p>Fuse Bead Patterns provides a free, browser-based tool to convert images into printable fuse bead patterns. You may use our service for personal, educational, or commercial crafting purposes.</p>
                        
                        <h2 className="section-heading !mb-4 !mt-12">2. Intellectual Property & Copyright</h2>
                        <p><strong>Your Content:</strong> You retain all rights and ownership to the images you upload and process using our tool. Since processing happens locally in your browser, we do not store, claim ownership of, or distribute your images or generated patterns.</p>
                        <p><strong>Respecting Copyright:</strong> You agree not to use our tool to generate patterns from copyrighted images or intellectual property that you do not have the right to use, reproduce, or distribute. We are not liable for any copyright infringement resulting from your use of the generated patterns.</p>

                        <h2 className="section-heading !mb-4 !mt-12">3. Disclaimer of Warranties</h2>
                        <p>The service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without any warranties of any kind, either express or implied. We do not guarantee that the generated patterns will perfectly match your expectations, nor do we guarantee uninterrupted or error-free access to the website.</p>

                        <h2 className="section-heading !mb-4 !mt-12">4. Limitation of Liability</h2>
                        <p>In no event shall Fuse Bead Patterns or its creators be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with your use of the service or the patterns generated.</p>

                        <h2 className="section-heading !mb-4 !mt-12">5. Changes to Terms</h2>
                        <p>We reserve the right to modify these Terms of Service at any time. We will indicate the date of the last update at the top of this page. Your continued use of the website constitutes your acceptance of the updated terms.</p>

                        <h2 className="section-heading !mb-4 !mt-12">6. Contact</h2>
                        <p>If you have any questions about these Terms, please contact us at: <a href="mailto:contact@fusebeadpatterns.art" className="text-link break-words">contact@fusebeadpatterns.art</a>.</p>
                    </div>
                </div>
            </main>

            <SiteFooter active="terms" />
        </div>
    );
}

import React from 'react';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';

export const metadata = {
    title: 'Terms of Service | Bead Pattern Maker',
    description: 'Terms of Service and terms of use for Bead Pattern Maker.',
    alternates: {
        canonical: '/terms-of-service',
    },
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen flex flex-col">
            <SiteHeader />

            {/* Main Content */}
            <main className="flex-1 px-4 pb-12 flex flex-col items-center">
                <div className="w-full max-w-4xl border-4 border-brutal-black bg-white p-8 md:p-12 shadow-brutal">
                    <h2 className="text-5xl font-black uppercase mb-8 tracking-tight">Terms of Service</h2>
                    
                    <div className="space-y-6 text-lg font-medium text-gray-800 prose prose-lg max-w-none">
                        <p><strong>Last Updated:</strong> April 17, 2026</p>

                        <p>Welcome to Bead Pattern Maker. By accessing or using our website (fusebeadpatterns.art) and services, you agree to be bound by these Terms of Service.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">1. Use of the Service</h3>
                        <p>Bead Pattern Maker provides a free, browser-based tool to convert images into bead patterns (such as Perler, Hama, or Artkal). You may use our service for personal, educational, or commercial crafting purposes.</p>
                        
                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">2. Intellectual Property & Copyright</h3>
                        <p><strong>Your Content:</strong> You retain all rights and ownership to the images you upload and process using our tool. Since processing happens locally in your browser, we do not store, claim ownership of, or distribute your images or generated patterns.</p>
                        <p><strong>Respecting Copyright:</strong> You agree not to use our tool to generate patterns from copyrighted images or intellectual property that you do not have the right to use, reproduce, or distribute. We are not liable for any copyright infringement resulting from your use of the generated patterns.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">3. Disclaimer of Warranties</h3>
                        <p>The service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without any warranties of any kind, either express or implied. We do not guarantee that the generated patterns will perfectly match your expectations, nor do we guarantee uninterrupted or error-free access to the website.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">4. Limitation of Liability</h3>
                        <p>In no event shall Bead Pattern Maker or its creators be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with your use of the service or the patterns generated.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">5. Changes to Terms</h3>
                        <p>We reserve the right to modify these Terms of Service at any time. We will indicate the date of the last update at the top of this page. Your continued use of the website constitutes your acceptance of the updated terms.</p>

                        <h3 className="text-2xl font-black uppercase mt-8 mb-4">6. Contact</h3>
                        <p>If you have any questions about these Terms, please contact us at: <a href="mailto:contact@fusebeadpatterns.art" className="text-brand-purple hover:underline">contact@fusebeadpatterns.art</a>.</p>
                    </div>
                </div>
            </main>

            <SiteFooter active="terms" />
        </div>
    );
}

import HomePage from '@/components/layout/HomePage';
import type { Metadata } from 'next';
import { homeLanguageAlternates } from '@/lib/i18n/metadata';

const siteUrl = 'https://fusebeadpatterns.art';

export const metadata: Metadata = {
    alternates: { canonical: '/', languages: homeLanguageAlternates },
};

const faqs = [
    {
        question: 'What are perler beads?',
        answer: 'Perler beads, also known as fuse beads or ironing beads, are small plastic beads arranged on a pegboard to create pixel art. After the design is complete, you cover it with ironing paper and apply heat to fuse the beads together.',
    },
    {
        question: 'Is this perler bead pattern maker free to use?',
        answer: 'Yes. Fuse Bead Patterns is free to use. You can upload a photo, preview the bead pattern, adjust the size, and export the result from your browser.',
    },
    {
        question: 'What do I need in a beginner perler bead kit?',
        answer: 'A beginner kit usually includes assorted fuse beads, a square pegboard, ironing paper, and tweezers. Storage organizers become useful once you collect more colors.',
    },
    {
        question: 'Can I use this for mini perler beads?',
        answer: 'Yes. Choose a mini bead setup when you want a smaller finished piece with more detail, such as keychains, earrings, ornaments, or compact sprite art.',
    },
    {
        question: 'Can I manually edit the generated bead pattern?',
        answer: 'Yes. Generate a pattern on the homepage, then open the editor to paint, fill, erase, pick colors, undo changes, save the project, and export the final pattern.',
    },
];

const structuredData = [
    {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Free Perler Bead Pattern Generator',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Any modern web browser',
        url: siteUrl,
        description:
            'A free browser-based perler bead pattern generator for turning photos into printable fuse bead patterns with preview, size controls, cleanup tools, and exports.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: [
            'Photo to perler bead pattern conversion',
            'Color choices for common fuse bead palettes',
            'Pegboard size and board count controls',
            'Manual cleanup editor with paint, fill, erase, pick, pan, undo, redo, and zoom',
            'Printable PDF, SVG, PNG, JPG, grid PNG, and XLSX exports',
        ],
    },
    {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    },
    {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to make a perler bead pattern from a photo',
        description:
            'Convert a photo into a printable fuse bead pattern, choose a color palette and pegboard, then export or refine the design.',
        step: [
            {
                '@type': 'HowToStep',
                name: 'Upload an image',
                text: 'Choose a photo, sprite, or artwork file from your device and preview it as bead art.',
            },
            {
                '@type': 'HowToStep',
                name: 'Adjust the pattern',
                text: 'Set the board size and layout so the pattern matches the project you want to build.',
            },
            {
                '@type': 'HowToStep',
                name: 'Export or edit',
                text: 'Download a printable pattern or open the editor to clean up individual beads.',
            },
        ],
    },
];

export default function Home() {
    return <HomePage locale="en" structuredData={structuredData} faqs={faqs} />;
}

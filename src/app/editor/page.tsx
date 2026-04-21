import type { Metadata } from 'next';
import Editor from '@/components/editor/Editor';

export const metadata: Metadata = {
    title: 'Perler Bead Pattern Editor | Bead Pattern Maker',
    description:
        'Open the full perler bead pattern editor to manually clean up, paint, fill, erase, and refine your generated fuse bead pattern.',
    alternates: {
        canonical: '/editor',
    },
    robots: {
        index: false,
        follow: true,
    },
    openGraph: {
        title: 'Perler Bead Pattern Editor | Bead Pattern Maker',
        description:
            'Open the full perler bead pattern editor to manually clean up, paint, fill, erase, and refine your generated fuse bead pattern.',
        url: 'https://fusebeadpatterns.art/editor',
        siteName: 'Bead Pattern Maker',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Perler Bead Pattern Editor | Bead Pattern Maker',
        description:
            'Open the full perler bead pattern editor to manually clean up, paint, fill, erase, and refine your generated fuse bead pattern.',
    },
};

export default function EditorPage() {
    return <Editor mode="editor" />;
}

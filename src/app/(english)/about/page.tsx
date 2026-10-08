import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';

export const metadata = {
    title: 'About Fuse Bead Patterns',
    description: 'Learn about Fuse Bead Patterns, a free browser-based Perler bead pattern generator for turning photos into printable fuse bead patterns.',
    alternates: {
        canonical: '/about',
    },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <SiteHeader active="about" />

            <main id="main-content" tabIndex={-1} className="page-shell reading-page flex-1 pb-16 sm:pb-24">
                <div className="w-full">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'About', href: '/about' },
                        ]}
                    />
                </div>
                <div className="reading-article mx-auto w-full pt-4 sm:pt-8">
                    <h1 className="page-heading mb-8 sm:mb-10">
                        About Us
                    </h1>

                    <div className="max-w-[70ch] space-y-6 text-base leading-8 text-[#43564d] sm:text-lg sm:leading-8">
                        <p>
                            Welcome to <strong>Fuse Bead Patterns</strong>, a free browser-based tool for turning photos, sprites, and simple artwork into printable <strong>Perler bead patterns</strong>. The goal is simple: make it easy to preview, adjust, clean up, and export a pattern before you start building.
                        </p>

                        <div className="my-10 border-l-2 border-[#9ead9c] bg-[#edf0e8] px-5 py-6 sm:px-7">
                            <h2 className="section-heading mb-4">Why We Built This</h2>
                            <p>
                                Fuse Bead Patterns brings image conversion, individual bead editing, and printable exports into one browser tool. You can plan the grid and colors before placing beads, and your uploaded images stay on your device.
                            </p>
                        </div>

                        <h2 className="section-heading !mb-4 !mt-12">Our Core Values</h2>
                        <ul className="list-disc space-y-3 pl-5 marker:text-[#78917f]">
                            <li><strong>Free & Accessible:</strong> No hidden fees, no subscriptions. Open the generator and start a pattern.</li>
                            <li><strong>Privacy First:</strong> Image processing happens locally in your browser. We do not see, store, or upload your photos.</li>
                            <li><strong>Practical Control:</strong> Adjust board size, color choices, cleanup edits, and exports around the project you actually want to build.</li>
                        </ul>

                        <section>
                            <h2 className="section-heading mb-4">How Library Patterns Are Prepared</h2>
                            <p>
                                Named game patterns start from a recorded reference for the character, item, and version shown. We check the native pixel grid, preserve its occupied cells and color regions, and match the colors to the digital Perler Midi palette. Pattern pages retain reference links and version notes; original designs are identified separately.
                            </p>
                            <p className="mt-3">
                                Each library pattern includes a preview, a grid chart, a bead color list, and an editable project. The motif dimensions describe the drawing itself; the board dimensions include the surrounding empty cells. The ready-made downloads use Perler Midi. You can{' '}
                                <Link href="/guides/perler-to-hama-artkal" className="text-link">
                                    switch to Hama or Artkal colors in the editor
                                </Link>{' '}
                                and export your own version.
                            </p>
                        </section>

                        <section>
                            <h2 className="section-heading mb-4">What Has Been Checked</h2>
                            <p>
                                Our library checks cover reference identity, grid dimensions, color counts, and consistency between the downloadable charts and projects. The patterns have not been physically assembled or iron-tested. Screen colors are approximate, and small connections or separate pieces may need extra support. Read the making notes on each pattern before starting.
                            </p>
                            <p className="mt-3">
                                Found a mismatch or a problem while making a pattern? Email{' '}
                                <a href="mailto:contact@fusebeadpatterns.art" className="text-link">
                                    contact@fusebeadpatterns.art
                                </a>{' '}
                                with the pattern link, bead brand, and the detail that needs checking.
                            </p>
                        </section>

                        <div className="!mt-12 border-t border-[#d9ded5] pt-8 sm:pt-10">
                            <h2 className="section-heading mb-5">Ready to start creating?</h2>
                            <Link href="/" className="button-primary">
                                Generate a Pattern Now
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <SiteFooter active="about" />
        </div>
    );
}

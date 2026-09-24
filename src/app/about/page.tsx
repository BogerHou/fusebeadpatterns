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

            <main className="flex-1 px-3 pb-10 flex flex-col items-center sm:px-4 sm:pb-12">
                <div className="w-full max-w-4xl">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'About', href: '/about' },
                        ]}
                    />
                </div>
                <div className="w-full max-w-4xl border-2 border-brutal-black bg-white p-5 shadow-[2px_2px_0_0_#1a1a1a] sm:border-4 sm:p-8 sm:shadow-brutal md:p-12">
                    <h1 className="mb-5 font-vt323 text-4xl uppercase leading-none sm:mb-8 sm:text-6xl">
                        About Us
                    </h1>

                    <div className="space-y-5 text-base font-medium leading-7 text-gray-800 sm:space-y-6 sm:text-lg sm:leading-8">
                        <p>
                            Welcome to <strong>Fuse Bead Patterns</strong>, a free browser-based tool for turning photos, sprites, and simple artwork into printable <strong>Perler bead patterns</strong>. The goal is simple: make it easy to preview, adjust, clean up, and export a pattern before you start building.
                        </p>

                        <div className="border-l-4 border-brand-magenta bg-brand-magenta/20 p-4 sm:p-6">
                            <h2 className="mb-3 font-vt323 text-3xl uppercase leading-none sm:text-4xl">Why We Built This</h2>
                            <p>
                                Fuse Bead Patterns brings image conversion, individual bead editing, and printable exports into one browser tool. You can plan the grid and colors before placing beads, and your uploaded images stay on your device.
                            </p>
                        </div>

                        <h2 className="mb-3 mt-8 font-vt323 text-3xl uppercase leading-none sm:text-4xl">Our Core Values</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Free & Accessible:</strong> No hidden fees, no subscriptions. Open the generator and start a pattern.</li>
                            <li><strong>Privacy First:</strong> Image processing happens locally in your browser. We do not see, store, or upload your photos.</li>
                            <li><strong>Practical Control:</strong> Adjust board size, color choices, cleanup edits, and exports around the project you actually want to build.</li>
                        </ul>

                        <section>
                            <h2 className="mb-3 font-vt323 text-3xl uppercase leading-none sm:text-4xl">How Library Patterns Are Prepared</h2>
                            <p>
                                Named game patterns start from a recorded reference for the character, item, and version shown. We check the native pixel grid, preserve its occupied cells and color regions, and match the colors to the digital Perler Midi palette. Pattern pages retain reference links and version notes; original designs are identified separately.
                            </p>
                            <p className="mt-3">
                                Each library pattern includes a preview, a grid chart, a bead color list, and an editable project. The motif dimensions describe the drawing itself; the board dimensions include the surrounding empty cells. The ready-made downloads use Perler Midi. You can{' '}
                                <Link href="/guides/perler-to-hama-artkal" className="font-bold underline decoration-2 underline-offset-4">
                                    switch to Hama or Artkal colors in the editor
                                </Link>{' '}
                                and export your own version.
                            </p>
                        </section>

                        <section>
                            <h2 className="mb-3 font-vt323 text-3xl uppercase leading-none sm:text-4xl">What Has Been Checked</h2>
                            <p>
                                Our library checks cover reference identity, grid dimensions, color counts, and consistency between the downloadable charts and projects. The patterns have not been physically assembled or iron-tested. Screen colors are approximate, and small connections or separate pieces may need extra support. Read the making notes on each pattern before starting.
                            </p>
                            <p className="mt-3">
                                Found a mismatch or a problem while making a pattern? Email{' '}
                                <a href="mailto:contact@fusebeadpatterns.art" className="font-bold underline decoration-2 underline-offset-4">
                                    contact@fusebeadpatterns.art
                                </a>{' '}
                                with the pattern link, bead brand, and the detail that needs checking.
                            </p>
                        </section>

                        <div className="mt-8 border-2 border-brutal-black bg-brand-cyan p-5 text-center shadow-[2px_2px_0_0_#1a1a1a] sm:mt-12 sm:border-4 sm:p-8 sm:shadow-brutal">
                            <h2 className="mb-4 font-vt323 text-3xl uppercase leading-none sm:text-4xl">Ready to start creating?</h2>
                            <Link href="/" className="inline-flex min-h-11 items-center justify-center border-2 border-brutal-black bg-brand-magenta px-5 py-3 font-black uppercase tracking-[0.08em] text-white shadow-[2px_2px_0_0_#1a1a1a] transition-all hover:translate-y-1 hover:shadow-none sm:border-4 sm:px-8 sm:py-4 sm:shadow-[4px_4px_0_0_#1a1a1a]">
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

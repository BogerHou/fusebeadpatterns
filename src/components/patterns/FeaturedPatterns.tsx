import Link from 'next/link';
import { getPatternById, type Pattern } from '@/lib/patterns/catalog';
import { PatternGrid, toPatternCard } from './PatternCards';

export default function FeaturedPatterns() {
    const featured = ['sdv-blue-chicken', 'pokemon-eevee-gen5', 'pokemon-gengar-gen5', 'ghost-cat-pumpkin']
        .map(getPatternById).filter((pattern): pattern is Pattern => Boolean(pattern));
    return (
        <section className="home-section" aria-labelledby="featured-patterns-title">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
                <div>
                    <p className="eyebrow mb-3">The pattern library</p>
                    <h2 id="featured-patterns-title" className="section-heading">Free Printable Perler Bead Patterns</h2>
                    <p className="mt-3 max-w-2xl text-sm font-medium text-gray-700 sm:text-base">Start with a ready-made design. Check the colors, download a chart, or open it in the editor.</p>
                </div>
                <Link href="/patterns" className="text-link">Browse all patterns <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
            <PatternGrid patterns={featured.map(toPatternCard)} headingLevel={3} />
        </section>
    );
}

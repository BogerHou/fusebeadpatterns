import Image from 'next/image';
import Link from 'next/link';
import { getPatternById, type Pattern } from '@/lib/patterns/catalog';
import { toPatternCard } from './PatternCards';

export default function FeaturedPatterns() {
    const featured = ['sdv-blue-chicken', 'pokemon-eevee-gen5', 'pokemon-gengar-gen5', 'ghost-cat-pumpkin']
        .map(getPatternById).filter((pattern): pattern is Pattern => Boolean(pattern));
    return (
        <section className="home-featured-patterns" aria-labelledby="featured-patterns-title">
            <div className="featured-patterns-intro">
                <div>
                    <p className="eyebrow">The pattern library</p>
                    <h2 id="featured-patterns-title" className="section-heading">Free Printable Perler Bead Patterns</h2>
                    <p className="featured-patterns-description">Start with a ready-made design. Check the colors, download a chart, or open it in the editor.</p>
                </div>
                <Link href="/patterns" className="text-link">Browse all patterns <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>
            <div className="featured-patterns-grid">
                {featured.map(toPatternCard).map((pattern) => (
                    <article key={pattern.id} className="featured-pattern-card" data-pattern-card={pattern.id}>
                        <Link href={`/patterns/${pattern.slug}`} prefetch={false}>
                            <Image
                                src={pattern.preview}
                                alt={`${pattern.title} Perler bead pattern`}
                                width={580}
                                height={580}
                                unoptimized
                            />
                            <h3>{pattern.title}</h3>
                        </Link>
                    </article>
                ))}
            </div>
        </section>
    );
}

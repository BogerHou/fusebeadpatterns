import Image from 'next/image';
import Link from 'next/link';
import type { Pattern } from '@/lib/patterns/catalog';
import { getPatternDisplayName } from '@/lib/patterns/presentation';

export type PatternCardData = Pick<Pattern,
    'id' | 'slug' | 'title' | 'collectionId'
> & { preview: string };

export function toPatternCard(pattern: Pattern): PatternCardData {
    const { id, slug, collectionId } = pattern;
    return { id, slug, title: getPatternDisplayName(pattern), collectionId, preview: pattern.assets.preview };
}

export function PatternGrid({ patterns, headingLevel = 2 }: { patterns: PatternCardData[]; headingLevel?: 2 | 3 }) {
    const Heading = headingLevel === 3 ? 'h3' : 'h2';
    return (
        <div className="pattern-grid">
            {patterns.map((pattern) => (
                <article key={pattern.id} className="pattern-card" data-pattern-card={pattern.id}>
                    <Link href={`/patterns/${pattern.slug}`} prefetch={false} className="pattern-card-link">
                        <div className="pattern-art">
                        <Image
                            src={pattern.preview}
                            alt={`${pattern.title} Perler bead pattern`}
                            width={580}
                            height={580}
                            unoptimized
                            className="pattern-image"
                        />
                        </div>
                        <div className="pattern-card-title">
                            <Heading >{pattern.title}</Heading>
                            <span aria-hidden="true">↗</span>
                        </div>
                    </Link>
                </article>
            ))}
        </div>
    );
}

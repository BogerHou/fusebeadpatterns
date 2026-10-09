import Image from 'next/image';
import Link from 'next/link';
import type { Pattern } from '@/lib/patterns/catalog';
import { getPatternSearchAliases } from '@/lib/patterns/localized-content';
import { getPatternDisplayName } from '@/lib/patterns/presentation';

export type PatternCardData = Pick<Pattern,
    'id' | 'slug' | 'title' | 'collectionId' | 'description'
> & { preview: string; href?: string; alt?: string; searchAliases?: string };

export function toPatternCard(pattern: Pattern): PatternCardData {
    const { id, slug, collectionId, description } = pattern;
    return { id, slug, title: getPatternDisplayName(pattern), collectionId, description, preview: pattern.assets.preview, searchAliases: getPatternSearchAliases(pattern) };
}

export function PatternGrid({ patterns, headingLevel = 2 }: { patterns: PatternCardData[]; headingLevel?: 2 | 3 }) {
    const Heading = headingLevel === 3 ? 'h3' : 'h2';
    return (
        <div className="pattern-grid">
            {patterns.map((pattern) => (
                <article key={pattern.id} className="pattern-card" data-pattern-card={pattern.id}>
                    <Link href={pattern.href ?? `/patterns/${pattern.slug}`} prefetch={false} className="pattern-card-link">
                        <div className="pattern-art">
                        <Image
                            src={pattern.preview}
                            alt={pattern.alt ?? `${pattern.title} Perler bead pattern`}
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

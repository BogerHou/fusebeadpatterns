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
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {patterns.map((pattern) => (
                <article key={pattern.id} className="min-w-0 border-2 border-brutal-black bg-white shadow-brutal-sm" data-pattern-card={pattern.id}>
                    <Link href={`/patterns/${pattern.slug}`} prefetch={false} className="group block h-full focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-brand-purple">
                        <Image
                            src={pattern.preview}
                            alt={`${pattern.title} Perler bead pattern`}
                            width={580}
                            height={580}
                            unoptimized
                            className="aspect-square w-full bg-[#faf8f3] object-contain [image-rendering:pixelated]"
                        />
                        <div className="border-t-2 border-brutal-black p-3 sm:p-4">
                            <Heading className="font-vt323 text-2xl leading-tight group-hover:underline decoration-2 underline-offset-4 sm:text-3xl">{pattern.title}</Heading>
                        </div>
                    </Link>
                </article>
            ))}
        </div>
    );
}

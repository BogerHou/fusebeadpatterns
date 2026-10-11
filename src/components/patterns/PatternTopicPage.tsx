import PatternLibraryHelp from './PatternLibraryHelp';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { getPatternsForTopic, getAdditionalPatternsForTopic, type PatternTopic } from '@/lib/patterns/topics';
import { PatternGrid, toPatternCard } from './PatternCards';
import SmallPatternContent from './SmallPatternContent';

export default function PatternTopicPage({ topic }: { topic: PatternTopic }) {
    if (topic.slug === 'small') return <SmallPatternContent locale="en" />;
    const selectedPatterns = getPatternsForTopic(topic);
    const additionalPatterns = getAdditionalPatternsForTopic(topic);

    return (
        <>
            <Breadcrumbs items={[
                { label: 'Home', href: '/' },
                { label: 'Patterns', href: '/patterns' },
                { label: topic.label, href: `/patterns/${topic.slug}` },
            ]} />
            <h1 className="page-heading pt-4 sm:pt-8">{topic.title}</h1>
            <p className="mb-10 mt-5 max-w-[65ch] text-base leading-8 text-[#59685d] sm:text-lg">{topic.intro}</p>
            <PatternGrid patterns={selectedPatterns.map(toPatternCard)} />
            {additionalPatterns.length > 0 && <section className="mt-12 border-t border-line pt-8" aria-labelledby="additional-patterns-heading">
                <h2 id="additional-patterns-heading" className="section-heading mb-6">{topic.slug === 'halloween' ? 'More Halloween patterns' : 'More Christmas patterns'}</h2>
                <PatternGrid patterns={additionalPatterns.map(toPatternCard)} />
            </section>}
            <section className="mt-14 max-w-[70ch] border-t border-[#d9ded5] pt-8" aria-labelledby="choosing-pattern-heading">
                <h2 id="choosing-pattern-heading" className="section-heading">{topic.selectionHeading}</h2>
                {topic.selectionNotes.map((note) => <p key={note} className="mt-4 leading-8 text-[#43564d]">{note}</p>)}
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                    {topic.relatedLinks.map((link) => <Link key={link.href} href={link.href} className="text-link inline-flex min-h-11 items-center">{link.label}</Link>)}
                </div>
            </section>
            <p className="mt-8 leading-8 text-[#43564d]"><Link href="/patterns" className="text-link">Browse all patterns</Link> for more characters and themes.</p>
            {topic.slug === 'christmas' && <PatternLibraryHelp locale="en" id="printing" />}
        </>
    );
}

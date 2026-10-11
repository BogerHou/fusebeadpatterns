import Link from 'next/link';
import type { SiteLocale } from '@/lib/i18n/locales';
import { isMultiboardPattern, multiboardCopy } from '@/lib/patterns/multiboard';

export default function MultiboardInstructions({ patternId, locale = 'en' }: { patternId: string; locale?: SiteLocale }) {
    if (!isMultiboardPattern(patternId)) return null;
    const copy = multiboardCopy[locale];
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const ranges = [['1–29', '1–29'], ['30–58', '1–29'], ['1–29', '30–58'], ['30–58', '30–58']];
    return <section className="mt-12 max-w-3xl border-t border-line pt-8" aria-labelledby="multiboard-heading">
        <h2 id="multiboard-heading" className="section-heading">{copy.heading}</h2>
        <p className="mt-5 leading-8 text-muted">{copy.instruction}</p>
        <table className="mt-5 w-full text-left text-sm">
            <caption className="sr-only">{copy.heading}</caption>
            <thead><tr className="border-b border-line">{copy.table.map(label => <th key={label} scope="col" className="py-3 pr-3">{label}</th>)}</tr></thead>
            <tbody>{ranges.map(([columns, rows], index) => <tr key={index} className="border-b border-line">
                <th scope="row" className="py-3 pr-3">{index + 1}</th><td className="py-3 pr-3">{copy.positions[index]}</td><td className="py-3 pr-3 whitespace-nowrap">{columns}</td><td className="py-3 whitespace-nowrap">{rows}</td>
            </tr>)}</tbody>
        </table>
        <p className="mt-5 leading-8 text-muted">{copy.printing}</p>
        <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 leading-8">
            <Link href={`${prefix}/guides/perler-bead-pegboards`} className="text-link">{copy.guides[0]}</Link>
            <Link href={`${prefix}/guides/how-to-iron-perler-beads`} className="text-link">{copy.guides[1]}</Link>
        </p>
    </section>;
}

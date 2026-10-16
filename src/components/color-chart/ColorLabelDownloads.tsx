import printLabels from '@/lib/color-chart/print-labels.json';
import type { SiteLocale } from '@/lib/i18n/locales';

export default function ColorLabelDownloads({ locale }: { locale: SiteLocale }) {
    const copy = printLabels[locale];
    const filePrefix = `/downloads/color-labels/perler-midi-${locale}`;

    return <section aria-labelledby="printable-color-labels-heading" className="mt-8 max-w-[75ch] border-t border-line pt-6">
        <h2 id="printable-color-labels-heading" className="section-heading">{copy.heading}</h2>
        <p className="mt-3 leading-7 text-muted">{copy.intro}</p>
        <div className="mt-4 flex flex-wrap gap-3">
            <a href={`${filePrefix}-a4.pdf`} hrefLang={locale} download className="button-secondary min-h-11">{copy.downloadA4}</a>
            <a href={`${filePrefix}-letter.pdf`} hrefLang={locale} download className="button-secondary min-h-11">{copy.downloadLetter}</a>
        </div>
        <details className="mt-4 text-sm leading-7 text-muted">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">{copy.formatNote}</summary>
            <p className="mt-3">{copy.print}</p>
            <p className="mt-2">{copy.cut}</p>
            <p className="mt-2">{copy.scope}</p>
            <p className="mt-2">{copy.names}</p>
            <p className="mt-2">{copy.approximation}</p>
            <p className="mt-2">{copy.attribution}</p>
        </details>
    </section>;
}

import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import { beadLetterCopy } from '@/lib/bead-letters/copy';
import { getLetterPalettes } from '@/lib/bead-letters/data';
import { beadLetterPaths } from '@/lib/bead-letters/routes';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import LetterWorkspace from './LetterWorkspace';

const breadcrumbLabels: Record<SiteLocale, string> = {
    en: 'Breadcrumb',
    de: 'Brotkrümelnavigation',
    fr: 'Fil d’Ariane',
    ja: 'パンくずリスト',
};

export default function BeadLetterPage({ locale }: { locale: SiteLocale }) {
    const copy = beadLetterCopy[locale];
    const palettes = getLetterPalettes();

    return <>
        <SiteHeader locale={locale} />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1">
            <Breadcrumbs label={breadcrumbLabels[locale]} items={[
                { label: copy.home, href: localeRoutes[locale].home },
                { label: copy.heading, href: beadLetterPaths[locale] },
            ]} />
            <h1 className="page-heading">{copy.heading}</h1>
            <p className="mt-4 max-w-[70ch] text-base leading-7 text-muted">{copy.intro}</p>
            <LetterWorkspace locale={locale} palettes={palettes} />
            <section aria-labelledby="bead-letters-how" className="mt-10 max-w-[75ch] border-t border-line pt-8">
                <h2 id="bead-letters-how" className="section-heading">{copy.howTitle}</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted">
                    {copy.steps.map(step => <li key={step}>{step}</li>)}
                </ol>
            </section>
            <section aria-labelledby="bead-letters-notes" className="mt-8 max-w-[75ch] border-t border-line pt-8">
                <h2 id="bead-letters-notes" className="section-heading">{copy.notesTitle}</h2>
                <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-muted">
                    {copy.notes.map(note => <li key={note}>{note}</li>)}
                </ul>
            </section>
        </main>
        <SiteFooter locale={locale} active="bead-letters" />
    </>;
}

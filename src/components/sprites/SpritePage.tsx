import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import { spriteCopy } from '@/lib/sprites/copy';
import { spritePaths } from '@/lib/sprites/routes';
import SpriteTool from './SpriteTool';

const labels: Record<SiteLocale, { breadcrumb: string; licenses: string; pixel: string }> = {
    en: { breadcrumb: 'Breadcrumb', licenses: 'Open-source license', pixel: 'Make a static pixel image' },
    de: { breadcrumb: 'Brotkrümelnavigation', licenses: 'Open-Source-Lizenz', pixel: 'Ein statisches Pixelbild erstellen' },
    fr: { breadcrumb: 'Fil d’Ariane', licenses: 'Licence du composant', pixel: 'Créer une image pixelisée fixe' },
    ja: { breadcrumb: 'パンくずリスト', licenses: 'オープンソースライセンス', pixel: '静止画のピクセルアートを作る' },
};

export default function SpritePage({ locale }: { locale: SiteLocale }) {
    const copy = spriteCopy[locale];
    return <>
        <SiteHeader locale={locale} />
        <main id="main-content" tabIndex={-1} className="page-shell flex-1">
            <Breadcrumbs label={labels[locale].breadcrumb} items={[
                { label: copy.home, href: localeRoutes[locale].home },
                { label: copy.heading, href: spritePaths[locale] },
            ]} />
            <h1 className="page-heading">{copy.heading}</h1>
            <p className="mt-4 max-w-[70ch] text-base leading-7 text-muted">{copy.intro}</p>
            <SpriteTool locale={locale} />
            <section aria-labelledby="sprite-how" className="mt-10 max-w-[75ch] border-t border-line pt-8">
                <h2 id="sprite-how" className="section-heading">{copy.howTitle}</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted">
                    {copy.steps.map(step => <li key={step}>{step}</li>)}
                </ol>
            </section>
            <section aria-labelledby="sprite-notes" className="mt-8 max-w-[75ch] border-t border-line pt-8">
                <h2 id="sprite-notes" className="section-heading">{copy.notesTitle}</h2>
                <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-muted">
                    {copy.notes.map(note => <li key={note}>{note}</li>)}
                </ul>
            </section>
            <p className="mt-6"><a className="text-link" href={localeRoutes[locale].pixelGrid} hrefLang={locale}>{labels[locale].pixel} →</a></p>
            <p className="mt-6 text-xs text-muted">{labels[locale].licenses}: <a className="underline" href="/licenses/omggif-mit.txt">omggif (MIT)</a></p>
        </main>
        <SiteFooter locale={locale} active="sprites" />
    </>;
}

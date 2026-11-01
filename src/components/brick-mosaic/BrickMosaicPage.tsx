import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import { brickCopy } from '@/lib/brick-mosaic/copy';
import { brickPaths } from '@/lib/brick-mosaic/routes';
import { brickCatalogSources } from '@/lib/brick-mosaic/catalog';
import BrickMosaicTool from './BrickMosaicTool';

const generatorLinks: Record<SiteLocale, { prompt: string; label: string }> = {
    en: { prompt: 'Making a fuse bead pattern instead?', label: 'Open the fuse bead pattern generator' },
    de: { prompt: 'Stattdessen eine Bügelperlen-Vorlage erstellen?', label: 'Bügelperlen-Vorlagengenerator öffnen' },
    fr: { prompt: 'Vous souhaitez créer un modèle de perles à repasser ?', label: 'Ouvrir le générateur de modèles de perles' },
    ja: { prompt: 'アイロンビーズの図案を作る場合は、', label: 'アイロンビーズ図案作成ツールを開く' },
};

export default function BrickMosaicPage({ locale }: { locale: SiteLocale }) {
    const copy = brickCopy[locale];
    const breadcrumb = { en: 'Breadcrumb', de: 'Brotkrümelnavigation', fr: 'Fil d’Ariane', ja: 'パンくずリスト' }[locale];
    const generator = generatorLinks[locale];
    const applicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: copy.heading,
        description: copy.description ?? copy.intro,
        url: `https://fusebeadpatterns.art${brickPaths[locale]}`,
        inLanguage: locale,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    };
    return <>
        <script id="webapp-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema).replace(/</g, '\\u003c') }} />
        <SiteHeader locale={locale} /><main id="main-content" tabIndex={-1} className="page-shell flex-1">
        <Breadcrumbs label={breadcrumb} items={[{ label: copy.home, href: localeRoutes[locale].home }, { label: copy.heading, href: brickPaths[locale] }]} />
        <h1 className="page-heading">{copy.heading}</h1><p className="mt-4 max-w-[70ch] text-base leading-7 text-muted">{copy.intro}</p>
        <BrickMosaicTool locale={locale} />
        <section aria-labelledby="brick-how" className="mt-10 max-w-[75ch] border-t border-line pt-8"><h2 id="brick-how" className="section-heading">{copy.howTitle}</h2><ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted">{copy.steps.map(step => <li key={step}>{step}</li>)}</ol></section>
        <section aria-labelledby="brick-notes" className="mt-8 max-w-[75ch] border-t border-line pt-8"><h2 id="brick-notes" className="section-heading">{copy.notesTitle}</h2><ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-muted">{copy.notes.map(note => <li key={note}>{note}</li>)}</ul></section>
        <p className="mt-8 max-w-[75ch] border-t border-line pt-6 text-sm leading-7 text-muted">
            {generator.prompt}{' '}
            <a href={`${localeRoutes[locale].home}#generator`} className="text-link">{generator.label}</a>
        </p>
        <p className="mt-6 max-w-[75ch] text-xs leading-6 text-muted">{copy.brandNotice}</p>
        <p className="mt-4 max-w-[75ch] text-xs leading-6 text-muted">{copy.sourceNote} <a className="underline" href={brickCatalogSources.colour.url} target="_blank" rel="noopener noreferrer">LDraw.org</a> · <a className="underline" href="/licenses/brick-mosaic-ldraw.txt">CC BY 4.0</a> · {brickCatalogSources.retrievedAt}</p>
    </main><SiteFooter locale={locale} active="brick-mosaic" /></>;
}

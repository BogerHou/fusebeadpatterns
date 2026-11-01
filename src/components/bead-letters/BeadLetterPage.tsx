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

const generatorLinks: Record<SiteLocale, { prompt: string; label: string }> = {
    en: { prompt: 'Starting from a photo or illustration?', label: 'Open the fuse bead pattern generator' },
    de: { prompt: 'Du möchtest ein Foto oder Bild umwandeln?', label: 'Bügelperlen-Vorlagengenerator öffnen' },
    fr: { prompt: 'Vous souhaitez convertir une photo ou une illustration ?', label: 'Ouvrir le générateur de modèles de perles' },
    ja: { prompt: '写真やイラストから図案を作る場合は、', label: 'アイロンビーズ図案作成ツールを開く' },
};

export default function BeadLetterPage({ locale }: { locale: SiteLocale }) {
    const copy = beadLetterCopy[locale];
    const palettes = getLetterPalettes();
    const generator = generatorLinks[locale];
    const applicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: copy.heading,
        description: copy.description,
        url: `https://fusebeadpatterns.art${beadLetterPaths[locale]}`,
        inLanguage: locale,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    };

    return <>
        <script id="webapp-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema).replace(/</g, '\\u003c') }} />
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
            <p className="mt-8 max-w-[75ch] border-t border-line pt-6 text-sm leading-7 text-muted">
                {generator.prompt}{' '}
                <a href={`${localeRoutes[locale].home}#generator`} className="text-link">{generator.label}</a>
            </p>
        </main>
        <SiteFooter locale={locale} active="bead-letters" />
    </>;
}

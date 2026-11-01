import Breadcrumbs from '@/components/layout/Breadcrumbs';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import { blockShapeCopy } from '@/lib/block-shapes/copy';
import { blockShapePaths } from '@/lib/block-shapes/routes';
import type { SiteLocale } from '@/lib/i18n/locales';
import { localeRoutes } from '@/lib/i18n/routes';
import BlockShapeWorkspace from './BlockShapeWorkspace';

const breadcrumbLabels: Record<SiteLocale, string> = {
    en: 'Breadcrumb',
    de: 'Brotkrümelnavigation',
    fr: 'Fil d’Ariane',
    ja: 'パンくずリスト',
};

const minecraftClusterLinks: Record<SiteLocale, {
    label: string;
    bannerMaker: { label: string; href: string };
    bannerLetters: { label: string; href: string };
    patterns: { label: string; href: string };
}> = {
    en: {
        label: 'More Minecraft tools & patterns:',
        bannerMaker: { label: 'Minecraft Banner Maker', href: '/minecraft-banner-maker' },
        bannerLetters: { label: 'Minecraft Banner Letters', href: '/minecraft-banner-letters' },
        patterns: { label: 'Minecraft Perler Bead Patterns', href: '/patterns/minecraft' },
    },
    de: {
        label: 'Weitere Minecraft-Werkzeuge & Vorlagen:',
        bannerMaker: { label: 'Minecraft-Banner-Generator', href: '/de/minecraft-banner-generator' },
        bannerLetters: { label: 'Minecraft-Banner-Buchstaben', href: '/de/minecraft-banner-buchstaben' },
        patterns: { label: 'Minecraft-Bügelperlen-Vorlagen', href: '/de/vorlagen/minecraft' },
    },
    fr: {
        label: 'Autres outils et modèles Minecraft :',
        bannerMaker: { label: 'Créateur de bannière Minecraft', href: '/fr/createur-banniere-minecraft' },
        bannerLetters: { label: 'Lettres de bannière Minecraft', href: '/fr/lettres-banniere-minecraft' },
        patterns: { label: 'Modèles Minecraft en perles à repasser', href: '/fr/modeles/minecraft' },
    },
    ja: {
        label: '関連するマイクラツール・図案：',
        bannerMaker: { label: 'マイクラ旗メーカー', href: '/ja/minecraft-banner-maker' },
        bannerLetters: { label: 'マイクラ文字旗メーカー', href: '/ja/minecraft-banner-letters' },
        patterns: { label: 'マイクラのアイロンビーズ図案', href: '/ja/patterns/minecraft' },
    },
};

export default function BlockShapePage({ locale }: { locale: SiteLocale }) {
    const copy = blockShapeCopy[locale];
    const cluster = minecraftClusterLinks[locale];
    const applicationSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: copy.heading,
        description: copy.description,
        url: `https://fusebeadpatterns.art${blockShapePaths[locale]}`,
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
                { label: copy.heading, href: blockShapePaths[locale] },
            ]} />
            <h1 className="page-heading">{copy.heading}</h1>
            <p className="mt-4 max-w-[70ch] text-base leading-7 text-muted">{copy.intro}</p>
            <BlockShapeWorkspace locale={locale} />
            <section aria-labelledby="block-shapes-how" className="mt-10 max-w-[75ch] border-t border-line pt-8">
                <h2 id="block-shapes-how" className="section-heading">{copy.howTitle}</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted">
                    {copy.steps.map(step => <li key={step}>{step}</li>)}
                </ol>
            </section>
            <section aria-labelledby="block-shapes-notes" className="mt-8 max-w-[75ch] border-t border-line pt-8">
                <h2 id="block-shapes-notes" className="section-heading">{copy.notesTitle}</h2>
                <ul className="mt-4 list-disc space-y-3 pl-5 leading-7 text-muted">
                    {copy.notes.map(note => <li key={note}>{note}</li>)}
                </ul>
            </section>
            <p className="mt-8 flex max-w-[75ch] flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-6 text-sm leading-7 text-muted">
                <span>{cluster.label}</span>
                <a href={cluster.bannerMaker.href} className="text-link">{cluster.bannerMaker.label}</a>
                <a href={cluster.bannerLetters.href} className="text-link">{cluster.bannerLetters.label}</a>
                <a href={cluster.patterns.href} className="text-link">{cluster.patterns.label}</a>
            </p>
        </main>
        <SiteFooter locale={locale} active="block-shapes" />
    </>;
}

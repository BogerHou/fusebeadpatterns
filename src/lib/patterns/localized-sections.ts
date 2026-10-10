import type { Metadata } from 'next';
import { guideHref } from '../guides/routes';
import { patternLanguageAlternates } from '../i18n/metadata';
import { getCollectionBySlug, getPatternsForCollection, type Pattern } from './catalog';
import { getPatternTopicBySlug, getPatternsForTopic, getAdditionalPatternsForTopic } from './topics';
import { getFewestColorsPattern } from './content';
import { getLocalizedPatternName, type PatternLocale } from './localized-content';
import { collectionSubjects, sectionLabels, sectionUi, topicMessages } from './section-messages';
import { getPatternSectionHref, type PatternSectionSlug } from './section-routes';

export type LocalizedPatternSection = {
    slug: string; href: string; label: string; title: string; description: string; intro: string;
    metadataDescription?: string;
    heading: string; notes: readonly string[]; patterns: Pattern[]; fewest?: Pattern;
    additionalPatterns?: Pattern[];
    relatedLinks: Array<{ href: string; label: string; language: string }>;
};
const guideLabels: Record<PatternLocale, Record<string, string>> = {
    de: { '/guides/perler-bead-kits-and-storage': 'Zubehör für den Einstieg', '/guides/perler-bead-pegboards': 'Steckplattengrößen', '/guides/mini-perler-beads': 'Mini-Perlengrößen', '/guides/perler-to-hama-artkal': 'Perlenmarke wechseln', '/guides/how-to-iron-perler-beads': 'Bügelanleitung' },
    fr: { '/guides/perler-bead-kits-and-storage': 'Matériel pour débuter', '/guides/perler-bead-pegboards': 'Tailles des plaques', '/guides/mini-perler-beads': 'Tailles des perles Mini', '/guides/perler-to-hama-artkal': 'Changer de marque', '/guides/how-to-iron-perler-beads': 'Guide du repassage' },
    ja: { '/guides/perler-bead-kits-and-storage': '初心者向けの道具', '/guides/perler-bead-pegboards': 'プレートのサイズ', '/guides/mini-perler-beads': 'ミニビーズのサイズ', '/guides/perler-to-hama-artkal': 'ビーズのブランド変更', '/guides/how-to-iron-perler-beads': 'アイロンの使い方' },
};

// Keep the indexed Minecraft snippets from cdf8de6 stable for this addition.
// The visible introduction and ItemList continue to use the complete live catalog.
const indexedMinecraftDescriptions: Record<PatternLocale, string> = {
    de: '28 kostenlose Minecraft-Bügelperlen-Vorlagen. Raster, Farben und Druckdateien ansehen oder im deutschen Editor bearbeiten.',
    fr: '28 modèles Minecraft gratuits en perles à repasser. Grilles, couleurs et fichiers à imprimer, avec un éditeur en français.',
    ja: 'Minecraftの無料アイロンビーズ図案28点。マス目付き画像、色別の必要数、印刷用ファイルを確認し、日本語エディターで配色や形を編集できます。',
};

export function localizedSectionMetadata(section: LocalizedPatternSection, locale: PatternLocale): Metadata {
    const siteUrl = 'https://fusebeadpatterns.art';
    const title = `${section.title} | Fuse Bead Patterns`;
    const image = section.patterns[0].assets.preview;
    const description = section.metadataDescription ?? section.description;
    return {
        title, description,
        alternates: { canonical: section.href, languages: patternLanguageAlternates(section.slug) },
        openGraph: { title, description, locale: { de: 'de_DE', fr: 'fr_FR', ja: 'ja_JP' }[locale], type: 'website', url: `${siteUrl}${section.href}`, images: [{ url: image, width: 580, height: 580, alt: section.title }] },
        twitter: { card: 'summary_large_image', title, description, images: [image] },
    };
}

export function getLocalizedPatternSection(slug: string, locale: PatternLocale): LocalizedPatternSection | undefined {
    const topic = getPatternTopicBySlug(slug);
    const collection = getCollectionBySlug(slug);
    const ui = sectionUi[locale];
    if (topic) {
        const copy = topicMessages[locale][slug];
        if (!copy) throw new Error(`Missing ${locale} topic: ${slug}`);
        return {
            slug, href: getPatternSectionHref(slug, locale), ...copy, patterns: getPatternsForTopic(topic),
            additionalPatterns: getAdditionalPatternsForTopic(topic),
            relatedLinks: topic.relatedLinks.map(link => {
                const relatedTopic = getPatternTopicBySlug(link.href.replace('/patterns/', ''));
                if (relatedTopic) return { href: getPatternSectionHref(relatedTopic.slug, locale), label: sectionLabels[locale][relatedTopic.slug as PatternSectionSlug], language: locale };
                const translatedLabel = guideLabels[locale][link.href];
                if (!translatedLabel) throw new Error(`Untranslated guide link: ${locale} ${link.href}`);
                return { href: guideHref(link.href.slice('/guides/'.length), locale), label: translatedLabel, language: locale };
            }),
        };
    }
    if (!collection) return undefined;
    const label = sectionLabels[locale][slug as PatternSectionSlug];
    const subjects = collectionSubjects[locale][collection.id];
    if (!label || !subjects) throw new Error(`Missing ${locale} collection: ${slug}`);
    const selected = getPatternsForCollection(collection.id);
    const intro = ui.intro(label, selected.length, subjects);
    const fewest = getFewestColorsPattern(selected);
    return {
        slug, href: getPatternSectionHref(slug, locale), label, title: ui.title(label),
        ...(slug === 'minecraft' ? { metadataDescription: indexedMinecraftDescriptions[locale] } : {}),
        description: locale === 'de' ? `${selected.length} kostenlose ${label}-Bügelperlen-Vorlagen. Raster, Farben und Druckdateien ansehen oder im deutschen Editor bearbeiten.`
            : locale === 'fr' ? `${selected.length} modèles ${label} gratuits en perles à repasser. Grilles, couleurs et fichiers à imprimer, avec un éditeur en français.`
            : `${label}の無料アイロンビーズ図案${selected.length}点。マス目付き画像、色別の必要数、印刷用ファイルを確認し、日本語エディターで配色や形を編集できます。`,
        intro, heading: ui.choose, patterns: selected, fewest,
        notes: [ui.sizes, ui.brand],
        relatedLinks: [{ href: guideHref('perler-to-hama-artkal', locale), label: guideLabels[locale]['/guides/perler-to-hama-artkal'], language: locale }],
    };
}

export function fewestColorsText(pattern: Pattern, locale: PatternLocale): string {
    return sectionUi[locale].fewest(getLocalizedPatternName(pattern, locale), pattern.colorCount, pattern.beads);
}

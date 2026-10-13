import type { SiteLocale } from '../i18n/locales';

/** Fixed practice files, separate from the downloadable pattern catalog. */
export const tutorialProjects = [
    {
        id: 'tutorial-cat-29',
        projectUrl: '/guides/photo-to-pattern/cat-perler-29.bead-pattern.json',
        titles: { en: 'Cat 29 × 29 — practice example', de: 'Katze 29 × 29 — Übungsbeispiel', fr: 'Chat 29 × 29 — exemple d’exercice', ja: '猫29×29（練習用）' },
        openLabels: { en: 'Open the 29 × 29 cat in the editor', de: 'Katze 29 × 29 im Editor öffnen', fr: 'Ouvrir le chat 29 × 29 dans l’éditeur', ja: '猫29×29をエディターで開く' },
    },
    {
        id: 'tutorial-cat-58',
        projectUrl: '/guides/photo-to-pattern/cat-perler-58.bead-pattern.json',
        titles: { en: 'Cat 58 × 58 — practice example', de: 'Katze 58 × 58 — Übungsbeispiel', fr: 'Chat 58 × 58 — exemple d’exercice', ja: '猫58×58（練習用）' },
        openLabels: { en: 'Open the 58 × 58 cat in the editor', de: 'Katze 58 × 58 im Editor öffnen', fr: 'Ouvrir le chat 58 × 58 dans l’éditeur', ja: '猫58×58をエディターで開く' },
    },
    {
        id: 'tutorial-rocket-before',
        projectUrl: '/guides/photo-to-pattern/rocket-perler-29-auto.bead-pattern.json',
        titles: { en: 'Rocket before editing — practice example', de: 'Rakete vor der Korrektur — Übungsbeispiel', fr: 'Fusée avant retouche — exemple d’exercice', ja: '修正前のロケット（練習用）' },
        openLabels: { en: 'Open the unedited rocket in the editor', de: 'Unbearbeitete Rakete im Editor öffnen', fr: 'Ouvrir la fusée avant retouche dans l’éditeur', ja: '修正前のロケットをエディターで開く' },
    },
    {
        id: 'tutorial-rocket-after',
        projectUrl: '/guides/photo-to-pattern/rocket-perler-29-cleanup.bead-pattern.json',
        titles: { en: 'Rocket after editing — practice example', de: 'Rakete nach der Korrektur — Übungsbeispiel', fr: 'Fusée après retouche — exemple d’exercice', ja: '修正後のロケット（練習用）' },
        openLabels: { en: 'Open the edited rocket in the editor', de: 'Bearbeitete Rakete im Editor öffnen', fr: 'Ouvrir la fusée retouchée dans l’éditeur', ja: '修正後のロケットをエディターで開く' },
    },
] as const;

export type TutorialProjectId = typeof tutorialProjects[number]['id'];

export function getTutorialLibraryProject(id: string, locale: SiteLocale = 'en') {
    const example = tutorialProjects.find(project => project.id === id);
    return example ? { id: example.id, title: example.titles[locale], projectUrl: example.projectUrl, kind: 'tutorial' as const } : undefined;
}

export function tutorialEditorLink(id: TutorialProjectId, locale: SiteLocale = 'en') {
    const example = tutorialProjects.find(project => project.id === id)!;
    return {
        href: `${locale === 'en' ? '' : `/${locale}`}/editor?pattern=${example.id}`,
        label: example.openLabels[locale],
        prefetch: false as const,
    };
}

/** Only exact known English tutorial links acquire a native equivalent. */
export function localizeTutorialEditorLink<T extends { href: string; label: string }>(link: T, locale: SiteLocale): T | undefined {
    const example = tutorialProjects.find(project => tutorialEditorLink(project.id).href === link.href);
    return example ? { ...link, ...tutorialEditorLink(example.id, locale) } : undefined;
}

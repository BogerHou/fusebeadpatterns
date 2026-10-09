import type { SiteLocale } from '../i18n/locales';

export type TranslatedSiteLocale = Exclude<SiteLocale, 'en'>;
export type SiteParagraph = string | { before: string; href: string; label: string; after?: string };
export type SitePageCopy = {
    title: string;
    description: string;
    heading: string;
    intro: string;
    updated?: string;
    sections: Array<{
        heading: string;
        paragraphs?: SiteParagraph[];
        bullets?: Array<{ label: string; text: string }>;
        highlighted?: boolean;
    }>;
    cta?: { heading: string; label: string };
};

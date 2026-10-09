import { getPatternSectionHref } from '../patterns/section-routes';
const siteUrl = 'https://fusebeadpatterns.art';

/** Only actual equivalents belong in this map; curated subsets are not whole-library translations. */
export const homeLanguageAlternates = {
    en: siteUrl,
    de: `${siteUrl}/de`,
    fr: `${siteUrl}/fr`,
    ja: `${siteUrl}/ja`,
    'x-default': siteUrl,
};

export const pixelLanguageAlternates = {
    en: `${siteUrl}/pixel-art-grid`,
    de: `${siteUrl}/de/pixel-art-generator`,
    fr: `${siteUrl}/fr/image-en-pixel-art`,
    ja: `${siteUrl}/ja/pixel-art-converter`,
    'x-default': `${siteUrl}/pixel-art-grid`,
};

export const loomLanguageAlternates = {
    en: `${siteUrl}/bead-loom-pattern-maker`,
    de: `${siteUrl}/de/perlenwebmuster-generator`,
    fr: `${siteUrl}/fr/generateur-motif-metier-a-perles`,
    ja: `${siteUrl}/ja/bead-loom-pattern-maker`,
    'x-default': `${siteUrl}/bead-loom-pattern-maker`,
};

export const hamaLanguageAlternates = {
    en: `${siteUrl}/patterns/hama`,
    de: `${siteUrl}/de/hama-perlen-vorlagen`,
    fr: `${siteUrl}/fr/patterns/hama`,
    ja: `${siteUrl}/ja/patterns/hama`,
    'x-default': `${siteUrl}/patterns/hama`,
};

export function patternLanguageAlternates(slug?: string) {
    const path = `/patterns${slug ? `/${slug}` : ''}`;
    return {
        en: `${siteUrl}${path}`, de: `${siteUrl}/de${path}`,
        fr: slug ? `${siteUrl}${getPatternSectionHref(slug, 'fr')}` : `${siteUrl}/fr${path}`, ja: `${siteUrl}/ja${path}`,
        'x-default': `${siteUrl}${path}`,
    };
}

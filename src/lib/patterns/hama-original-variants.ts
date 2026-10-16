import { isSiteLocale, type SiteLocale } from '../i18n/locales';
import { getLocalizedSubjectName } from './localized-content';
import { getCherriesHamaLibraryProject, getCherriesHamaVariant, hamaCherriesId, hamaCherriesProjectId, type HamaDownloadVariant } from './cherries-hama';

// Fixed, reviewed downloads for one existing original. These do not change the
// six-pattern Hama collection or turn arbitrary query values into asset URLs.
export const hamaBlackCatId = 'original-black-cat';
export const hamaBlackCatProjectId = 'original-black-cat-hama';
export const hamaBlackCatAssetRoot = '/patterns-hama/original-black-cat';

const source = { id: hamaBlackCatId, title: 'Black Cat' };
const materials = [
    { ref: 'H18', symbol: '4', count: 177, hex: '#141315', names: { en: 'Black', de: 'Schwarz', fr: 'Noir', ja: 'ブラック' } },
    { ref: 'H03', symbol: '$', count: 4, hex: '#e9c704', names: { en: 'Yellow', de: 'Gelb', fr: 'Jaune', ja: 'イエロー' } },
] as const;

export function getHamaOriginalVariant(patternId: string, locale: SiteLocale = 'en'): HamaDownloadVariant | undefined {
    if (patternId === hamaCherriesId) return getCherriesHamaVariant(patternId, locale);
    if (patternId !== hamaBlackCatId || !isSiteLocale(locale)) return undefined;
    const prefix = locale === 'en' ? '' : `/${locale}`;
    return {
        id: hamaBlackCatId,
        projectId: hamaBlackCatProjectId,
        paletteId: 'hama' as const,
        name: locale === 'en' ? source.title : getLocalizedSubjectName(source, locale),
        preview: `${hamaBlackCatAssetRoot}/preview.png`,
        pixels: `${hamaBlackCatAssetRoot}/pixels.png`,
        project: `${hamaBlackCatAssetRoot}/pattern.bead-pattern.json`,
        grid: `${hamaBlackCatAssetRoot}/${locale}/grid.png`,
        pdf: `${hamaBlackCatAssetRoot}/${locale}/pattern.pdf`,
        pdfLetter: `${hamaBlackCatAssetRoot}/${locale}/pattern-letter.pdf`,
        editor: `${prefix}/editor?pattern=${hamaBlackCatProjectId}`,
        detail: `${prefix}/patterns/black-cat#hama-midi`,
        materials: materials.map(({ names, ...color }) => ({ ...color, name: names[locale] })),
    };
}

export function getHamaOriginalLibraryProject(id: string, locale: SiteLocale = 'en') {
    if (id === hamaCherriesProjectId) return getCherriesHamaLibraryProject(id, locale);
    if (id !== hamaBlackCatProjectId) return undefined;
    const variant = getHamaOriginalVariant(hamaBlackCatId, locale);
    if (!variant) return undefined;
    return { id, title: `${variant.name} — Hama Midi`, projectUrl: variant.project };
}

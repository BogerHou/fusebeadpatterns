import type { SiteLocale } from '../i18n/locales';
import { getLocalizedSubjectName } from './localized-content';

// An explicit brand variant of the published fan art, separate from the six
// original Hama designs. This does not add a character or a catalog entry.
export const hamaCreeperId = 'minecraft-creeper-face-v1';
export const hamaCreeperProjectId = 'minecraft-creeper-face-v1-hama';
export const hamaCreeperAssetRoot = '/patterns-hama-characters/minecraft-creeper-face-v1';

const source = { id: hamaCreeperId, title: 'Creeper Face' };
const materials = [
    { ref: 'H10', symbol: '-', count: 136, hex: '#027643', names: { en: 'Green', de: 'Grün', fr: 'Vert', ja: 'グリーン' } },
    { ref: 'H18', symbol: '4', count: 80, hex: '#141315', names: { en: 'Black', de: 'Schwarz', fr: 'Noir', ja: 'ブラック' } },
    { ref: 'H47', symbol: 'R', count: 40, hex: '#80df96', names: { en: 'Pastel Green', de: 'Pastellgrün', fr: 'Vert pastel', ja: 'パステルグリーン' } },
] as const;

export function getHamaCharacterVariant(patternId: string, locale: SiteLocale = 'en') {
    if (patternId !== hamaCreeperId) return undefined;
    const prefix = locale === 'en' ? '' : `/${locale}`;
    return {
        id: hamaCreeperId,
        projectId: hamaCreeperProjectId,
        paletteId: 'hama' as const,
        name: locale === 'en' ? source.title : getLocalizedSubjectName(source, locale),
        preview: `${hamaCreeperAssetRoot}/preview.png`,
        pixels: `${hamaCreeperAssetRoot}/pixels.png`,
        project: `${hamaCreeperAssetRoot}/pattern.bead-pattern.json`,
        grid: `${hamaCreeperAssetRoot}/${locale}/grid.png`,
        pdf: `${hamaCreeperAssetRoot}/${locale}/pattern.pdf`,
        pdfLetter: `${hamaCreeperAssetRoot}/${locale}/pattern-letter.pdf`,
        editor: `${prefix}/editor?pattern=${hamaCreeperProjectId}`,
        detail: `${prefix}/patterns/minecraft/creeper-face#hama-midi`,
        materials: materials.map(({ names, ...color }) => ({ ...color, name: names[locale] })),
    };
}

export function getHamaCharacterLibraryProject(id: string, locale: SiteLocale = 'en') {
    if (id !== hamaCreeperProjectId) return undefined;
    const variant = getHamaCharacterVariant(hamaCreeperId, locale)!;
    return { id, title: `${variant.name} — Hama Midi`, projectUrl: variant.project };
}

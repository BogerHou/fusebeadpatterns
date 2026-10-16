import { isSiteLocale, type SiteLocale } from '../i18n/locales';
import data from './cherries-hama-data.json';

export const hamaCherriesId = 'original-cherries';
export const hamaCherriesProjectId = 'original-cherries-hama';
export const hamaCherriesAssetRoot = '/patterns-hama/original-cherries';

export type HamaDownloadVariant = {
    id: string; projectId: string; paletteId: 'hama'; name: string;
    preview: string; pixels: string; project: string; grid: string;
    pdf: string; pdfLetter: string; editor: string; detail: string;
    materials: Array<{ ref: string; symbol: string; count: number; hex: string; name: string }>;
};

type CherriesHamaVariant = HamaDownloadVariant & {
    motif: { width: number; height: number };
    board: { width: number; height: number };
    beadCount: number;
};

const names: Record<SiteLocale, string> = {
    en: 'Cherries', de: 'Kirschen', fr: 'Cerises', ja: 'さくらんぼ',
};

/** Reviewed fixed assets, never a user-supplied path or an automatic colour conversion. */
export function getCherriesHamaVariant(patternId: string, locale: SiteLocale = 'en'): CherriesHamaVariant | undefined {
    if (patternId !== hamaCherriesId || !isSiteLocale(locale)) return undefined;
    const prefix = locale === 'en' ? '' : `/${locale}`;
    return {
        id: hamaCherriesId,
        projectId: hamaCherriesProjectId,
        paletteId: 'hama' as const,
        name: names[locale],
        motif: { ...data.motif },
        board: { ...data.board },
        beadCount: data.beadCount,
        preview: `${hamaCherriesAssetRoot}/preview.png`,
        pixels: `${hamaCherriesAssetRoot}/pixels.png`,
        project: `${hamaCherriesAssetRoot}/pattern.bead-pattern.json`,
        grid: `${hamaCherriesAssetRoot}/${locale}/grid.png`,
        pdf: `${hamaCherriesAssetRoot}/${locale}/pattern.pdf`,
        pdfLetter: `${hamaCherriesAssetRoot}/${locale}/pattern-letter.pdf`,
        editor: `${prefix}/editor?pattern=${hamaCherriesProjectId}`,
        detail: `${prefix}/patterns/cherry#hama-midi`,
        materials: data.materials.map(({ names: colorNames, ...color }) => ({ ...color, name: colorNames[locale] })),
    };
}

export function getCherriesHamaLibraryProject(id: string, locale: SiteLocale = 'en') {
    if (id !== hamaCherriesProjectId) return undefined;
    const variant = getCherriesHamaVariant(hamaCherriesId, locale);
    if (!variant) return undefined;
    return { id, title: `${variant.name} — Hama Midi`, projectUrl: variant.project };
}

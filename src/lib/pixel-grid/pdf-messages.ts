import type { PixelGridPdfLocale } from './pdf-layout';

export interface PixelGridPdfMessages {
    title: string;
    artwork: string;
    blank: string;
    overview: string;
    tile: string;
    rows: string;
    columns: string;
    page: string;
    pageMap: string;
    digital: string;
    whitePaper: string;
    printTiled: string;
    printOverview: string;
}

const copy: Record<PixelGridPdfLocale, PixelGridPdfMessages> = {
    en: { title: 'Pixel grid', artwork: 'Artwork', blank: 'Blank grid', overview: 'Overview', tile: 'Tile',
        rows: 'Rows', columns: 'Columns', page: 'Page', pageMap: 'Page map',
        digital: 'Digital pixel grid - not an actual-size bead template.',
        whitePaper: 'Colors are composited on white paper.',
        printTiled: '4 mm cells / Print at 100%', printOverview: 'Whole grid scaled to one page' },
    de: { title: 'Pixelraster', artwork: 'Motiv', blank: 'Leeres Raster', overview: 'Übersicht', tile: 'Teil',
        rows: 'Zeilen', columns: 'Spalten', page: 'Seite', pageMap: 'Seitenplan',
        digital: 'Digitales Pixelraster - keine Bügelperlenvorlage in Originalgröße.',
        whitePaper: 'Farben werden auf weißem Papier dargestellt.',
        printTiled: '4-mm-Raster / Mit 100% drucken', printOverview: 'Gesamtes Raster auf einer Seite' },
    fr: { title: 'Grille de pixels', artwork: 'Dessin', blank: 'Grille vierge', overview: "Vue d'ensemble", tile: 'Partie',
        rows: 'Lignes', columns: 'Colonnes', page: 'Page', pageMap: 'Plan des pages',
        digital: 'Grille de pixels numérique - pas un gabarit de perles à taille réelle.',
        whitePaper: 'Les couleurs sont composées sur du papier blanc.',
        printTiled: 'Cases de 4 mm / Imprimer à 100 %', printOverview: 'Grille entière adaptée à une page' },
    ja: { title: 'マス目の図案', artwork: '図案', blank: '空白', overview: 'プレビュー', tile: '部分図',
        rows: '行', columns: '列', page: '用紙', pageMap: '部分図の番号',
        digital: 'デジタルの図案です。実寸のビーズ用テンプレートではありません。',
        whitePaper: '色は白い用紙に合わせています。',
        printTiled: '1マス4 mm / 100%で印刷', printOverview: '用紙に合わせるプレビュー' },
};

export function pixelGridPdfMessages(locale: PixelGridPdfLocale): PixelGridPdfMessages {
    return copy[locale];
}

/** Fixed copy only; user filenames and user text never enter this PDF. */
export function pixelGridPdfJapaneseCharacters(): string {
    return [...new Set(Object.values(copy.ja).join('') + 'FUSE BEAD PATTERNSfusebeadpatterns.art0123456789 x/-():A4US Letter')].join('');
}

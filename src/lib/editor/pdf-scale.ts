import type { SiteLocale } from '../i18n/locales';

export type PdfScaleMode = 'fit-page' | 'midi-5mm';

export function isPdfScaleMode(value: unknown): value is PdfScaleMode {
    return value === 'fit-page' || value === 'midi-5mm';
}

/** Locale is only the initial preference; saved projects always retain their scale. */
export function getInitialPdfScaleMode(locale: SiteLocale): PdfScaleMode {
    return locale === 'ja' ? 'midi-5mm' : 'fit-page';
}

export function resolvePdfScaleMode(saved: PdfScaleMode | undefined, locale: SiteLocale): PdfScaleMode {
    return saved ?? getInitialPdfScaleMode(locale);
}

export function isMidiActualSizeSupported(paletteIds: readonly string[], boardId: string): boolean {
    return boardId === 'midi' && paletteIds.length > 0 &&
        paletteIds.every(id => id === 'perler' || id === 'hama' || id === 'artkal_s');
}

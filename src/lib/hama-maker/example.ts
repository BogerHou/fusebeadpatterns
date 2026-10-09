import type { SiteLocale } from '../i18n/locales';
import { hamaPatterns } from '../patterns/hama';
import { germanHamaPatterns } from '../patterns/german-hama';
import { localizedHamaPatterns } from '../patterns/localized-hama';

export const hamaGhostExample = {
    id: 'original-friendly-ghost',
    source: '/patterns/original-friendly-ghost/pixels.png',
    result: '/patterns-hama/original-friendly-ghost/pixels.png',
    allowedRefs: ['H01', 'H18'],
    width: 29,
    height: 29,
} as const;

export function getHamaGhostExampleDownloads(locale: SiteLocale) {
    const original = hamaPatterns.find(pattern => pattern.id === hamaGhostExample.id)!;
    const translated = locale === 'de'
        ? germanHamaPatterns.find(pattern => pattern.id === original.id)
        : locale === 'fr' || locale === 'ja'
            ? localizedHamaPatterns(locale).find(pattern => pattern.id === original.id)
            : undefined;
    return {
        pdf: translated?.pdf ?? original.pdfA4,
        letter: translated?.pdfLetter ?? original.pdfLetter,
        project: original.project,
        editor: `${locale === 'en' ? '' : `/${locale}`}/editor?pattern=${original.projectId}`,
    };
}

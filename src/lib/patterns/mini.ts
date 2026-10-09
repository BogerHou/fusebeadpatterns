import type { SiteLocale } from '../i18n/locales';
import { getLocalizedSubjectName } from './localized-content';

export const miniGhostProjectId = 'original-friendly-ghost-perler-mini';
export const miniGhostAssetRoot = '/guides/mini-perler-beads/ghost-mini';

/** A brand variant of the existing original Ghost, not a new catalog pattern. */
export function getMiniLibraryProject(id: string, locale: SiteLocale = 'en') {
    if (id !== miniGhostProjectId) return undefined;
    const source = { id: 'original-friendly-ghost', title: 'Ghost' };
    const name = locale === 'en' ? source.title : getLocalizedSubjectName(source, locale);
    return { id, title: `${name} — Perler Mini`, projectUrl: `${miniGhostAssetRoot}/pattern.bead-pattern.json` };
}

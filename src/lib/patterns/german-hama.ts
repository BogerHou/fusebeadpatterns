import selection from './german-hama.json';
import { hamaPatterns } from './hama';

export const germanHamaPath = '/de/hama-perlen-vorlagen';
export const germanHamaUpdatedAt = selection.updatedAt;

export const germanHamaPatterns = selection.patterns.map(({ id, name }) => {
    const hama = hamaPatterns.find(pattern => pattern.id === id);
    if (!hama) throw new Error(`German Hama pattern is missing: ${id}`);

    return {
        id,
        name,
        brand: 'hama' as const,
        projectId: hama.projectId,
        preview: hama.preview,
        pixels: `/patterns-hama/${id}/pixels.png`,
        pdf: `/patterns-de-hama/${id}/pattern.pdf`,
        pdfLetter: `/patterns-de-hama/${id}/pattern-letter.pdf`,
        project: hama.project,
        editor: `/de/editor?pattern=${encodeURIComponent(hama.projectId)}`,
    };
});

export type GermanHamaPattern = typeof germanHamaPatterns[number];

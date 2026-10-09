import selection from './french-patterns.json';
import { getPatternById } from './catalog';
import { hamaPatterns } from './hama';

export type FrenchPatternBrand = 'perler' | 'hama';
export type FrenchPatternCard = {
    id: string;
    name: string;
    brand: FrenchPatternBrand;
    projectId: string;
    preview: string;
    pdf: string;
    project: string;
    editor: string;
};
export type FrenchPatternChoices = Record<FrenchPatternBrand, FrenchPatternCard[]>;

// Build the small, serializable card set on the server. The client does not need
// the full catalog, bead counts or palette contents to switch between brands.
function cardsForBrand(brand: FrenchPatternBrand): FrenchPatternCard[] {
    return selection.patterns.map(({ id, name }) => {
        const original = getPatternById(id);
        const hama = hamaPatterns.find(pattern => pattern.id === id);
        if (!original || !hama || original.source !== null) throw new Error(`French original pattern is missing: ${id}`);
        const projectId = brand === 'hama' ? hama.projectId : original.id;
        return {
            id,
            name,
            brand,
            projectId,
            preview: brand === 'hama' ? hama.preview : original.assets.preview,
            pdf: `/${brand === 'hama' ? 'patterns-fr-hama' : 'patterns-fr'}/${id}/pattern.pdf`,
            project: brand === 'hama' ? hama.project : original.assets.project,
            editor: `/fr/editor?pattern=${encodeURIComponent(projectId)}`,
        };
    });
}

export const frenchPatternChoices: FrenchPatternChoices = {
    perler: cardsForBrand('perler'),
    hama: cardsForBrand('hama'),
};

export const frenchPatternsUpdatedAt = selection.updatedAt;

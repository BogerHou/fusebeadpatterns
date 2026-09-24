import type { Pattern, PatternCollection } from './catalog';
import { getPatternDisplayName } from './presentation';

// Editorial copy stays separate from the generated artwork catalog.
export const patternContentUpdatedAt = '2026-09-24';
export const brandGuideHref = '/guides/perler-to-hama-artkal';

// A cross-collection pilot, not a search-volume ranking.
export const patternIntroPilotIds = new Set([
    'sdv-blue-chicken',
    'sdv-junimo',
    'pokemon-pikachu-gen5',
    'pokemon-eevee-gen5',
    'pokemon-gengar-gen5',
    'minecraft-diamond-sword-1-21-1',
    'minecraft-diamond-pickaxe-1-21-1',
    'smb-super-mushroom',
    'smb-super-star',
    'kirby-adventure-normal',
]);

export function getPatternIntro(pattern: Pattern): string {
    if (!patternIntroPilotIds.has(pattern.id)) return pattern.description;
    return `This ${getPatternDisplayName(pattern)} bead pattern uses ${pattern.beads} beads in ${pattern.colorCount} Perler colors. The design measures ${pattern.motifWidth} × ${pattern.motifHeight} beads on a ${pattern.gridWidth} × ${pattern.gridHeight} grid. Download the printable PDF or open the pattern in the editor to choose another bead brand.`;
}

const collectionSubjects: Record<string, string> = {
    'stardew-valley': 'Blue, White, Brown, Void and Golden Chickens, plus a Green Junimo',
    pokemon: 'Pikachu, Eevee and its evolutions, Gengar, starters and more Pokémon',
    minecraft: 'Diamond tools, Netherite tools, ores, food and other Minecraft items',
    'super-mario': 'Mario, Luigi, mushrooms, a Super Star, enemies and other classic Super Mario sprites',
    kirby: 'Kirby, Waddle Dee and Waddle Doo from Kirby’s Adventure',
};

export function getCollectionIntro(collection: PatternCollection, collectionPatterns: Pattern[]): string {
    const subjects = collectionSubjects[collection.id];
    if (!subjects || collectionPatterns.length === 0) return collection.description;
    return `Browse ${collectionPatterns.length} ${collection.title} Perler bead patterns featuring ${subjects}. Choose a picture for its printable PDF, color list and editable pattern.`;
}

export function getFewestColorsPattern(collectionPatterns: Pattern[]): Pattern | undefined {
    return collectionPatterns.reduce<Pattern | undefined>((selected, pattern) => {
        if (!selected || pattern.colorCount < selected.colorCount
            || (pattern.colorCount === selected.colorCount && pattern.beads < selected.beads)) return pattern;
        return selected;
    }, undefined);
}

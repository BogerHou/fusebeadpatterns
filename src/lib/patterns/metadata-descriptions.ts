import type { Pattern, PatternCollection } from './catalog';
import { getLocalizedPatternIntro, getLocalizedPatternName, type PatternLocale } from './localized-content';

// Search summaries are separate from the complete pattern descriptions and
// making instructions. Reviewed English summaries already within the limit stay unchanged.
const englishPatternSummaries: Readonly<Record<string, string>> = {
    'gingerbread-man': 'Make a gingerbread man with white icing and red buttons. Download the free Perler bead PDF or edit the pattern.',
    'santa-hat': 'Make a red Santa hat with a white brim and pom-pom using 332 Perler Midi beads. Download the printable grid or edit the pattern.',
    snowflake: 'Make a light-blue snowflake with six branches and a white center using 137 Perler Midi beads. Download the printable grid or edit the pattern.',
    'christmas-bauble-ornament': 'Make a Christmas bauble with 362 Perler Midi beads and a 3 × 3 hanging opening. Download the printable grid or edit the pattern.',
    'black-cat': 'Make a sitting black cat with 181 Perler Midi beads in black and yellow. Download the printable grid or edit the 16 × 16 pattern.',
};

export function patternMetadataDescription(pattern: Pattern): string {
    return englishPatternSummaries[pattern.slug] ?? pattern.description;
}

export function patternCollectionMetadataDescription(collection: PatternCollection): string {
    return collection.slug === 'minecraft'
        ? 'Find free Minecraft Perler bead patterns for swords, pickaxes, TNT and more. Download a printable grid or open a pattern in the editor.'
        : collection.description;
}

export function localizedPatternMetadataDescription(pattern: Pattern, locale: PatternLocale): string {
    if (locale === 'ja') return getLocalizedPatternIntro(pattern, locale);
    const name = getLocalizedPatternName(pattern, locale);
    const size = `${pattern.motifWidth} × ${pattern.motifHeight}`;
    return locale === 'de'
        ? `${name}: Bügelperlen-Vorlage (${size} Perlen). Kostenloses PDF und Raster-PNG herunterladen oder im Editor bearbeiten.`
        : `${name} en perles à repasser (${size} perles). Téléchargez le PDF ou la grille PNG, ou modifiez le motif gratuitement.`;
}

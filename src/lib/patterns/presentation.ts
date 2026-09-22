import type { Pattern } from './catalog';

type PatternIdentity = Pick<Pattern, 'id' | 'title' | 'collectionId'>;

export function getPatternDisplayName(pattern: PatternIdentity): string {
    if (pattern.collectionId === 'stardew-valley') return `Stardew Valley ${pattern.title}`;
    if (pattern.collectionId === 'pokemon') return `Pokémon ${pattern.title}`;
    if (pattern.id === 'capybara-potion') return 'Halloween Capybara Witch';
    if (pattern.id === 'ghost-cat-pumpkin') return 'Halloween Ghost Cat with Pumpkin';
    return pattern.title;
}

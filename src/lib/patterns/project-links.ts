/** Small, local-only asset allowlist for the editor. Does not import catalog data. */
export type LibraryProject = { id: string; title: string; projectUrl: string };

const libraryProjects: LibraryProject[] = [
    {
        "id": "sdv-blue-chicken",
        "title": "Blue Chicken",
        "projectUrl": "/patterns/sdv-blue-chicken/pattern.bead-pattern.json"
    },
    {
        "id": "sdv-white-chicken",
        "title": "White Chicken",
        "projectUrl": "/patterns/sdv-white-chicken/pattern.bead-pattern.json"
    },
    {
        "id": "sdv-brown-chicken",
        "title": "Brown Chicken",
        "projectUrl": "/patterns/sdv-brown-chicken/pattern.bead-pattern.json"
    },
    {
        "id": "sdv-void-chicken",
        "title": "Void Chicken",
        "projectUrl": "/patterns/sdv-void-chicken/pattern.bead-pattern.json"
    },
    {
        "id": "sdv-golden-chicken",
        "title": "Golden Chicken",
        "projectUrl": "/patterns/sdv-golden-chicken/pattern.bead-pattern.json"
    },
    {
        "id": "sdv-junimo",
        "title": "Green Junimo",
        "projectUrl": "/patterns/sdv-junimo/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-eevee-gen5",
        "title": "Eevee",
        "projectUrl": "/patterns/pokemon-eevee-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-vaporeon-gen5",
        "title": "Vaporeon",
        "projectUrl": "/patterns/pokemon-vaporeon-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-gengar-gen5",
        "title": "Gengar",
        "projectUrl": "/patterns/pokemon-gengar-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-pikachu-gen5",
        "title": "Pikachu",
        "projectUrl": "/patterns/pokemon-pikachu-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-snorlax-gen5",
        "title": "Snorlax",
        "projectUrl": "/patterns/pokemon-snorlax-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-bulbasaur-gen5",
        "title": "Bulbasaur",
        "projectUrl": "/patterns/pokemon-bulbasaur-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-charmander-gen5",
        "title": "Charmander",
        "projectUrl": "/patterns/pokemon-charmander-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-squirtle-gen5",
        "title": "Squirtle",
        "projectUrl": "/patterns/pokemon-squirtle-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-umbreon-gen5",
        "title": "Umbreon",
        "projectUrl": "/patterns/pokemon-umbreon-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-mew-gen5",
        "title": "Mew",
        "projectUrl": "/patterns/pokemon-mew-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "pokemon-jigglypuff-gen5",
        "title": "Jigglypuff",
        "projectUrl": "/patterns/pokemon-jigglypuff-gen5/pattern.bead-pattern.json"
    },
    {
        "id": "capybara-potion",
        "title": "Potion Class Capybara",
        "projectUrl": "/patterns/capybara-potion/pattern.bead-pattern.json"
    },
    {
        "id": "ghost-cat-pumpkin",
        "title": "Pumpkin Hug Ghost Cat",
        "projectUrl": "/patterns/ghost-cat-pumpkin/pattern.bead-pattern.json"
    }
];

export function getLibraryProject(id: string): LibraryProject | undefined {
    return libraryProjects.find((project) => project.id === id);
}

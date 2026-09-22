/** Reviewed pattern content. Regenerate with scripts/build-pattern-library.mjs. */
export type Pattern = {
    id: string;
    slug: string;
    title: string;
    collectionId: string | null;
    version: string;
    description: string;
    beads: number;
    colorCount: number;
    gridWidth: number;
    gridHeight: number;
    motifWidth: number;
    motifHeight: number;
    palette: Array<{ symbol: string; ref: string; name: string; hex: string; count: number }>;
    notes: string[];
    source: null | { label: string; url: string; description: string };
    assets: { preview: string; grid: string; pixels: string; project: string; pdf: string };
    updatedAt: string;
};

export type PatternCollection = { id: string; slug: string; title: string; description: string };

export const patternCollections: PatternCollection[] = [
    {
        "id": "stardew-valley",
        "slug": "stardew-valley",
        "title": "Stardew Valley",
        "description": "Explore Stardew Valley bead patterns featuring chickens and a Green Junimo. Choose a picture to download its printable pattern."
    },
    {
        "id": "pokemon",
        "slug": "pokemon",
        "title": "Pokémon",
        "description": "Find Pokémon bead patterns featuring Eevee, Pikachu, Gengar, and more. Choose a picture to download or edit."
    },
    {
        "id": "minecraft",
        "slug": "minecraft",
        "title": "Minecraft",
        "description": "Find Minecraft Perler bead patterns for a Diamond Sword, Diamond Pickaxe, Golden Apple, TNT, and more. Download a free printable pattern or open it in the editor."
    },
    {
        "id": "super-mario",
        "slug": "super-mario",
        "title": "Super Mario",
        "description": "Make classic Super Mario Perler bead patterns featuring the Super Mushroom and Super Star from the original Super Mario Bros. Download a free printable grid."
    },
    {
        "id": "kirby",
        "slug": "kirby",
        "title": "Kirby",
        "description": "Make a pink Kirby Perler bead pattern based on the classic Kirby’s Adventure sprite. Download the free printable grid or open it in the editor."
    }
];

export const patterns: Pattern[] = [
    {
        "id": "sdv-blue-chicken",
        "slug": "stardew-valley/blue-chicken",
        "title": "Blue Chicken",
        "collectionId": "stardew-valley",
        "version": "Wiki game depiction",
        "description": "Stardew Valley Blue Chicken with blue feathers and a curled tail. Download the printable pattern or open it in the editor.",
        "beads": 192,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15201",
                "name": "Midnight",
                "hex": "#2f3c55",
                "count": 71
            },
            {
                "symbol": "B",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 2
            },
            {
                "symbol": "C",
                "ref": "80-15257",
                "name": "Fuchsia",
                "hex": "#cb59b9",
                "count": 4
            },
            {
                "symbol": "D",
                "ref": "80-15089",
                "name": "Neon Blue",
                "hex": "#406ae1",
                "count": 44
            },
            {
                "symbol": "E",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 51
            },
            {
                "symbol": "F",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 5
            },
            {
                "symbol": "G",
                "ref": "80-19008",
                "name": "Dark Blue",
                "hex": "#0e5092",
                "count": 13
            },
            {
                "symbol": "H",
                "ref": "80-19004",
                "name": "Orange",
                "hex": "#eb7b31",
                "count": 2
            }
        ],
        "notes": [
            "Thin one-bead connections at row 12, column 21. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Stardew Valley Wiki",
            "url": "https://stardewvalleywiki.com/File:Blue_Chicken.png",
            "description": "Based on this community-maintained Wiki game depiction. The verified 3× display enlargement was reduced to its native pixel grid without interpolation."
        },
        "assets": {
            "preview": "/patterns/sdv-blue-chicken/preview.png",
            "grid": "/patterns/sdv-blue-chicken/grid.png",
            "pixels": "/patterns/sdv-blue-chicken/pixels.png",
            "project": "/patterns/sdv-blue-chicken/pattern.bead-pattern.json",
            "pdf": "/patterns/sdv-blue-chicken/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "sdv-white-chicken",
        "slug": "stardew-valley/white-chicken",
        "title": "White Chicken",
        "collectionId": "stardew-valley",
        "version": "Wiki game depiction",
        "description": "Make the White Chicken from Stardew Valley, with cream feathers and an orange comb.",
        "beads": 173,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 61
            },
            {
                "symbol": "B",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 2
            },
            {
                "symbol": "C",
                "ref": "80-15246",
                "name": "Tangerine",
                "hex": "#fd5918",
                "count": 3
            },
            {
                "symbol": "D",
                "ref": "80-19090",
                "name": "Butterscotch",
                "hex": "#da9964",
                "count": 36
            },
            {
                "symbol": "E",
                "ref": "80-15274",
                "name": "Rich Butter",
                "hex": "#f6ca69",
                "count": 51
            },
            {
                "symbol": "F",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 5
            },
            {
                "symbol": "G",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 13
            },
            {
                "symbol": "H",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 2
            }
        ],
        "notes": [
            "Thin one-bead connections at row 12, column 21. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Stardew Valley Wiki",
            "url": "https://stardewvalleywiki.com/File:White_Chicken.png",
            "description": "Based on this community-maintained Wiki game depiction. The verified 3× display enlargement was reduced to its native pixel grid without interpolation."
        },
        "assets": {
            "preview": "/patterns/sdv-white-chicken/preview.png",
            "grid": "/patterns/sdv-white-chicken/grid.png",
            "pixels": "/patterns/sdv-white-chicken/pixels.png",
            "project": "/patterns/sdv-white-chicken/pattern.bead-pattern.json",
            "pdf": "/patterns/sdv-white-chicken/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "sdv-brown-chicken",
        "slug": "stardew-valley/brown-chicken",
        "title": "Brown Chicken",
        "collectionId": "stardew-valley",
        "version": "Wiki game depiction",
        "description": "A Stardew Valley Brown Chicken with warm brown feathers and a curled tail.",
        "beads": 173,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 61
            },
            {
                "symbol": "B",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 2
            },
            {
                "symbol": "C",
                "ref": "80-15246",
                "name": "Tangerine",
                "hex": "#fd5918",
                "count": 3
            },
            {
                "symbol": "D",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 37
            },
            {
                "symbol": "E",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 52
            },
            {
                "symbol": "F",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 5
            },
            {
                "symbol": "G",
                "ref": "80-19020",
                "name": "Rust",
                "hex": "#995043",
                "count": 13
            }
        ],
        "notes": [
            "Thin one-bead connections at row 12, column 21. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Stardew Valley Wiki",
            "url": "https://stardewvalleywiki.com/File:Brown_Chicken.png",
            "description": "Based on this community-maintained Wiki game depiction. The verified 3× display enlargement was reduced to its native pixel grid without interpolation."
        },
        "assets": {
            "preview": "/patterns/sdv-brown-chicken/preview.png",
            "grid": "/patterns/sdv-brown-chicken/grid.png",
            "pixels": "/patterns/sdv-brown-chicken/pixels.png",
            "project": "/patterns/sdv-brown-chicken/pattern.bead-pattern.json",
            "pdf": "/patterns/sdv-brown-chicken/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "sdv-void-chicken",
        "slug": "stardew-valley/void-chicken",
        "title": "Void Chicken",
        "collectionId": "stardew-valley",
        "version": "Wiki game depiction",
        "description": "Stardew Valley Void Chicken with dark feathers and red details.",
        "beads": 173,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 60
            },
            {
                "symbol": "B",
                "ref": "80-15961",
                "name": "Cherry",
                "hex": "#9d2b3a",
                "count": 2
            },
            {
                "symbol": "C",
                "ref": "80-15246",
                "name": "Tangerine",
                "hex": "#fd5918",
                "count": 4
            },
            {
                "symbol": "D",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 37
            },
            {
                "symbol": "E",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 52
            },
            {
                "symbol": "F",
                "ref": "80-15204",
                "name": "Salmon",
                "hex": "#e1747a",
                "count": 5
            },
            {
                "symbol": "G",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 13
            }
        ],
        "notes": [
            "Thin one-bead connections at row 12, column 21. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Stardew Valley Wiki",
            "url": "https://stardewvalleywiki.com/File:Void_Chicken.png",
            "description": "Based on this community-maintained Wiki game depiction. The verified 3× display enlargement was reduced to its native pixel grid without interpolation."
        },
        "assets": {
            "preview": "/patterns/sdv-void-chicken/preview.png",
            "grid": "/patterns/sdv-void-chicken/grid.png",
            "pixels": "/patterns/sdv-void-chicken/pixels.png",
            "project": "/patterns/sdv-void-chicken/pattern.bead-pattern.json",
            "pdf": "/patterns/sdv-void-chicken/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "sdv-golden-chicken",
        "slug": "stardew-valley/golden-chicken",
        "title": "Golden Chicken",
        "collectionId": "stardew-valley",
        "version": "Wiki game depiction",
        "description": "The Golden Chicken from Stardew Valley, with golden feathers and an orange beak.",
        "beads": 180,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 64
            },
            {
                "symbol": "B",
                "ref": "80-15246",
                "name": "Tangerine",
                "hex": "#fd5918",
                "count": 7
            },
            {
                "symbol": "C",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 2
            },
            {
                "symbol": "D",
                "ref": "80-15274",
                "name": "Rich Butter",
                "hex": "#f6ca69",
                "count": 37
            },
            {
                "symbol": "E",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 49
            },
            {
                "symbol": "F",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 6
            },
            {
                "symbol": "G",
                "ref": "80-19004",
                "name": "Orange",
                "hex": "#eb7b31",
                "count": 13
            },
            {
                "symbol": "H",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 2
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Stardew Valley Wiki",
            "url": "https://stardewvalleywiki.com/File:Golden_Chicken.png",
            "description": "Based on this community-maintained Wiki game depiction. The verified 3× display enlargement was reduced to its native pixel grid without interpolation."
        },
        "assets": {
            "preview": "/patterns/sdv-golden-chicken/preview.png",
            "grid": "/patterns/sdv-golden-chicken/grid.png",
            "pixels": "/patterns/sdv-golden-chicken/pixels.png",
            "project": "/patterns/sdv-golden-chicken/pattern.bead-pattern.json",
            "pdf": "/patterns/sdv-golden-chicken/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "sdv-junimo",
        "slug": "stardew-valley/green-junimo",
        "title": "Green Junimo",
        "collectionId": "stardew-valley",
        "version": "Wiki game depiction",
        "description": "A Green Junimo from Stardew Valley with raised arms and a small leaf on its head.",
        "beads": 142,
        "colorCount": 5,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 14,
        "motifHeight": 15,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19061",
                "name": "Kiwi Lime",
                "hex": "#69b845",
                "count": 53
            },
            {
                "symbol": "B",
                "ref": "80-15179",
                "name": "Evergreen",
                "hex": "#305545",
                "count": 54
            },
            {
                "symbol": "C",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 16
            },
            {
                "symbol": "D",
                "ref": "80-15199",
                "name": "Shamrock",
                "hex": "#008f53",
                "count": 15
            },
            {
                "symbol": "E",
                "ref": "80-15254",
                "name": "Sage",
                "hex": "#9aa98e",
                "count": 4
            }
        ],
        "notes": [
            "The body and feet form three separate parts. Mount them on a backing; do not try to lift this version as one piece.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Stardew Valley Wiki",
            "url": "https://stardewvalleywiki.com/File:Junimo_Icon.png",
            "description": "Based on this community-maintained Wiki game depiction. The verified 3× display enlargement was reduced to its native pixel grid without interpolation."
        },
        "assets": {
            "preview": "/patterns/sdv-junimo/preview.png",
            "grid": "/patterns/sdv-junimo/grid.png",
            "pixels": "/patterns/sdv-junimo/pixels.png",
            "project": "/patterns/sdv-junimo/pattern.bead-pattern.json",
            "pdf": "/patterns/sdv-junimo/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-eevee-gen5",
        "slug": "pokemon/eevee-gen-5",
        "title": "Eevee",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Pokémon Eevee with pointed ears and a fluffy cream collar.",
        "beads": 191,
        "colorCount": 6,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 17,
        "motifHeight": 17,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 89
            },
            {
                "symbol": "B",
                "ref": "80-15274",
                "name": "Rich Butter",
                "hex": "#f6ca69",
                "count": 35
            },
            {
                "symbol": "C",
                "ref": "80-19090",
                "name": "Butterscotch",
                "hex": "#da9964",
                "count": 46
            },
            {
                "symbol": "D",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 10
            },
            {
                "symbol": "E",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 3
            },
            {
                "symbol": "F",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 8
            }
        ],
        "notes": [
            "Thin one-bead connections at row 16, column 9. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/133.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-eevee-gen5/preview.png",
            "grid": "/patterns/pokemon-eevee-gen5/grid.png",
            "pixels": "/patterns/pokemon-eevee-gen5/pixels.png",
            "project": "/patterns/pokemon-eevee-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-eevee-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-vaporeon-gen5",
        "slug": "pokemon/vaporeon-gen-5",
        "title": "Vaporeon",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Pokémon Vaporeon with pointed fins and a curled tail.",
        "beads": 228,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 21,
        "motifHeight": 19,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 81
            },
            {
                "symbol": "B",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 38
            },
            {
                "symbol": "C",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 15
            },
            {
                "symbol": "D",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 33
            },
            {
                "symbol": "E",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 31
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 4
            },
            {
                "symbol": "G",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 8
            },
            {
                "symbol": "H",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 18
            }
        ],
        "notes": [
            "Thin one-bead connections at row 7, column 12; row 16, column 7; row 22, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/134.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-vaporeon-gen5/preview.png",
            "grid": "/patterns/pokemon-vaporeon-gen5/grid.png",
            "pixels": "/patterns/pokemon-vaporeon-gen5/pixels.png",
            "project": "/patterns/pokemon-vaporeon-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-vaporeon-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-gengar-gen5",
        "slug": "pokemon/gengar-gen-5",
        "title": "Gengar",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Pokémon Gengar with a wide grin and a spiky silhouette.",
        "beads": 372,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 24,
        "motifHeight": 22,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 72
            },
            {
                "symbol": "B",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 88
            },
            {
                "symbol": "C",
                "ref": "80-15182",
                "name": "Lavender",
                "hex": "#af9fce",
                "count": 67
            },
            {
                "symbol": "D",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 126
            },
            {
                "symbol": "E",
                "ref": "80-19060",
                "name": "Plum",
                "hex": "#a75d9d",
                "count": 3
            },
            {
                "symbol": "F",
                "ref": "80-19059",
                "name": "Hot Coral",
                "hex": "#dd595b",
                "count": 6
            },
            {
                "symbol": "G",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 4
            },
            {
                "symbol": "H",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 6
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/94.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-gengar-gen5/preview.png",
            "grid": "/patterns/pokemon-gengar-gen5/grid.png",
            "pixels": "/patterns/pokemon-gengar-gen5/pixels.png",
            "project": "/patterns/pokemon-gengar-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-gengar-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-pikachu-gen5",
        "slug": "pokemon/pikachu-gen-5",
        "title": "Pikachu",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Pokémon Pikachu with black-tipped ears, red cheeks, and a lightning-shaped tail.",
        "beads": 218,
        "colorCount": 6,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 19,
        "motifHeight": 20,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 56
            },
            {
                "symbol": "B",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 34
            },
            {
                "symbol": "C",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 66
            },
            {
                "symbol": "D",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 57
            },
            {
                "symbol": "E",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 2
            },
            {
                "symbol": "F",
                "ref": "80-19059",
                "name": "Hot Coral",
                "hex": "#dd595b",
                "count": 3
            }
        ],
        "notes": [
            "Thin one-bead connections at row 6, column 22; row 17, column 8. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/25.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-pikachu-gen5/preview.png",
            "grid": "/patterns/pokemon-pikachu-gen5/grid.png",
            "pixels": "/patterns/pokemon-pikachu-gen5/pixels.png",
            "project": "/patterns/pokemon-pikachu-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-pikachu-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-snorlax-gen5",
        "slug": "pokemon/snorlax-gen-5",
        "title": "Snorlax",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Pokémon Snorlax with a rounded body and a cream face and belly.",
        "beads": 309,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 24,
        "motifHeight": 21,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 72
            },
            {
                "symbol": "B",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 11
            },
            {
                "symbol": "C",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 65
            },
            {
                "symbol": "D",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 61
            },
            {
                "symbol": "E",
                "ref": "80-15259",
                "name": "Slime",
                "hex": "#c8c85c",
                "count": 50
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 9
            },
            {
                "symbol": "G",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 30
            },
            {
                "symbol": "H",
                "ref": "80-15239",
                "name": "Mocha",
                "hex": "#c8b693",
                "count": 11
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/143.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-snorlax-gen5/preview.png",
            "grid": "/patterns/pokemon-snorlax-gen5/grid.png",
            "pixels": "/patterns/pokemon-snorlax-gen5/pixels.png",
            "project": "/patterns/pokemon-snorlax-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-snorlax-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-bulbasaur-gen5",
        "slug": "pokemon/bulbasaur-gen-5",
        "title": "Bulbasaur",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Pokémon Bulbasaur with a green bulb on its back and a squat, four-legged silhouette.",
        "beads": 235,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 20,
        "motifHeight": 17,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 55
            },
            {
                "symbol": "B",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 48
            },
            {
                "symbol": "C",
                "ref": "80-15219",
                "name": "Fern",
                "hex": "#7f971a",
                "count": 86
            },
            {
                "symbol": "D",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 38
            },
            {
                "symbol": "E",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 1
            },
            {
                "symbol": "F",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 2
            },
            {
                "symbol": "G",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 5
            }
        ],
        "notes": [
            "Thin one-bead connections at row 12, column 8. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/1.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-bulbasaur-gen5/preview.png",
            "grid": "/patterns/pokemon-bulbasaur-gen5/grid.png",
            "pixels": "/patterns/pokemon-bulbasaur-gen5/pixels.png",
            "project": "/patterns/pokemon-bulbasaur-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-bulbasaur-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-charmander-gen5",
        "slug": "pokemon/charmander-gen-5",
        "title": "Charmander",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Charmander with an orange body and a flame at the tip of its tail.",
        "beads": 211,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 21,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 61
            },
            {
                "symbol": "B",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 50
            },
            {
                "symbol": "C",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 60
            },
            {
                "symbol": "D",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 3
            },
            {
                "symbol": "E",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 12
            },
            {
                "symbol": "F",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 22
            },
            {
                "symbol": "G",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 1
            },
            {
                "symbol": "H",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 2
            }
        ],
        "notes": [
            "Thin one-bead connections at row 7, column 22; row 19, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/4.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-charmander-gen5/preview.png",
            "grid": "/patterns/pokemon-charmander-gen5/grid.png",
            "pixels": "/patterns/pokemon-charmander-gen5/pixels.png",
            "project": "/patterns/pokemon-charmander-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-charmander-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-squirtle-gen5",
        "slug": "pokemon/squirtle-gen-5",
        "title": "Squirtle",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Pokémon Squirtle with a blue body, a brown shell, and a curled tail. Download the printable bead pattern.",
        "beads": 218,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 21,
        "motifHeight": 17,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 64
            },
            {
                "symbol": "B",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 53
            },
            {
                "symbol": "C",
                "ref": "80-15266",
                "name": "Caribbean Sea",
                "hex": "#6cc8ad",
                "count": 34
            },
            {
                "symbol": "D",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 16
            },
            {
                "symbol": "E",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 8
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 6
            },
            {
                "symbol": "G",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 4
            },
            {
                "symbol": "H",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 7
            },
            {
                "symbol": "J",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 22
            },
            {
                "symbol": "K",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 4
            }
        ],
        "notes": [
            "Thin one-bead connections at row 19, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/7.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-squirtle-gen5/preview.png",
            "grid": "/patterns/pokemon-squirtle-gen5/grid.png",
            "pixels": "/patterns/pokemon-squirtle-gen5/pixels.png",
            "project": "/patterns/pokemon-squirtle-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-squirtle-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-umbreon-gen5",
        "slug": "pokemon/umbreon-gen-5",
        "title": "Umbreon",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Pokémon Umbreon with dark fur, long ears, and yellow rings. Download its printable bead pattern or open it in the editor.",
        "beads": 239,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 21,
        "motifHeight": 20,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 105
            },
            {
                "symbol": "B",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 49
            },
            {
                "symbol": "C",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 16
            },
            {
                "symbol": "D",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 54
            },
            {
                "symbol": "E",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 11
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 2
            },
            {
                "symbol": "G",
                "ref": "80-19059",
                "name": "Hot Coral",
                "hex": "#dd595b",
                "count": 2
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/197.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-umbreon-gen5/preview.png",
            "grid": "/patterns/pokemon-umbreon-gen5/grid.png",
            "pixels": "/patterns/pokemon-umbreon-gen5/pixels.png",
            "project": "/patterns/pokemon-umbreon-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-umbreon-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-mew-gen5",
        "slug": "pokemon/mew-gen-5",
        "title": "Mew",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "A pink Pokémon Mew with small ears and a long, curved tail. Choose the printable grid or editable bead pattern.",
        "beads": 199,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 21,
        "motifHeight": 19,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 71
            },
            {
                "symbol": "B",
                "ref": "80-15272",
                "name": "Coral",
                "hex": "#ff9a8b",
                "count": 52
            },
            {
                "symbol": "C",
                "ref": "80-19006",
                "name": "Bubblegum",
                "hex": "#d8729a",
                "count": 27
            },
            {
                "symbol": "D",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 13
            },
            {
                "symbol": "E",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 5
            },
            {
                "symbol": "F",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 2
            },
            {
                "symbol": "G",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 27
            },
            {
                "symbol": "H",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 1
            },
            {
                "symbol": "J",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 1
            }
        ],
        "notes": [
            "Thin one-bead connections at row 11, column 14; row 16, column 18. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/151.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-mew-gen5/preview.png",
            "grid": "/patterns/pokemon-mew-gen5/grid.png",
            "pixels": "/patterns/pokemon-mew-gen5/pixels.png",
            "project": "/patterns/pokemon-mew-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-mew-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-jigglypuff-gen5",
        "slug": "pokemon/jigglypuff-gen-5",
        "title": "Jigglypuff",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Pokémon Jigglypuff with a round pink body, pointed ears, and a curled tuft of hair. Download its free printable bead pattern.",
        "beads": 228,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 17,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 51
            },
            {
                "symbol": "B",
                "ref": "80-19006",
                "name": "Bubblegum",
                "hex": "#d8729a",
                "count": 43
            },
            {
                "symbol": "C",
                "ref": "80-15272",
                "name": "Coral",
                "hex": "#ff9a8b",
                "count": 69
            },
            {
                "symbol": "D",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 26
            },
            {
                "symbol": "E",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 20
            },
            {
                "symbol": "F",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 16
            },
            {
                "symbol": "G",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 3
            }
        ],
        "notes": [
            "Thin one-bead connections at row 16, column 22. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/39.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-jigglypuff-gen5/preview.png",
            "grid": "/patterns/pokemon-jigglypuff-gen5/grid.png",
            "pixels": "/patterns/pokemon-jigglypuff-gen5/pixels.png",
            "project": "/patterns/pokemon-jigglypuff-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-jigglypuff-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-diamond-sword-1-21-1",
        "slug": "minecraft/diamond-sword",
        "title": "Diamond Sword",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "Make the Minecraft Diamond Sword with a turquoise blade and a brown handle. Download the free printable bead pattern or open it in the editor.",
        "beads": 84,
        "colorCount": 11,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15179",
                "name": "Evergreen",
                "hex": "#305545",
                "count": 24
            },
            {
                "symbol": "B",
                "ref": "80-15240",
                "name": "Mint",
                "hex": "#b3eed5",
                "count": 8
            },
            {
                "symbol": "C",
                "ref": "80-15261",
                "name": "Dark Spruce",
                "hex": "#14313b",
                "count": 22
            },
            {
                "symbol": "D",
                "ref": "80-19011",
                "name": "Light Green",
                "hex": "#18c7b1",
                "count": 6
            },
            {
                "symbol": "E",
                "ref": "80-15266",
                "name": "Caribbean Sea",
                "hex": "#6cc8ad",
                "count": 9
            },
            {
                "symbol": "F",
                "ref": "80-15247",
                "name": "Forest",
                "hex": "#005d57",
                "count": 4
            },
            {
                "symbol": "G",
                "ref": "80-19091",
                "name": "Parrot Green",
                "hex": "#009188",
                "count": 4
            },
            {
                "symbol": "H",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 2
            },
            {
                "symbol": "J",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 2
            },
            {
                "symbol": "K",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 1
            },
            {
                "symbol": "L",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 2
            }
        ],
        "notes": [
            "Thin one-bead connections at row 14, column 10; row 18, column 11; row 19, column 10; row 19, column 15; row 20, column 9. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/diamond_sword.png",
            "description": "Based on the original Java Edition 1.21.1 item texture in the pinned archive. Only transparent margins were cropped before centering it on the board."
        },
        "assets": {
            "preview": "/patterns/minecraft-diamond-sword-1-21-1/preview.png",
            "grid": "/patterns/minecraft-diamond-sword-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-diamond-sword-1-21-1/pixels.png",
            "project": "/patterns/minecraft-diamond-sword-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-diamond-sword-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-diamond-pickaxe-1-21-1",
        "slug": "minecraft/diamond-pickaxe",
        "title": "Diamond Pickaxe",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A Minecraft Diamond Pickaxe with a turquoise head and a brown handle. Download its free printable Perler bead pattern.",
        "beads": 68,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 13,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15179",
                "name": "Evergreen",
                "hex": "#305545",
                "count": 8
            },
            {
                "symbol": "B",
                "ref": "80-15240",
                "name": "Mint",
                "hex": "#b3eed5",
                "count": 2
            },
            {
                "symbol": "C",
                "ref": "80-19011",
                "name": "Light Green",
                "hex": "#18c7b1",
                "count": 5
            },
            {
                "symbol": "D",
                "ref": "80-15266",
                "name": "Caribbean Sea",
                "hex": "#6cc8ad",
                "count": 8
            },
            {
                "symbol": "E",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 10
            },
            {
                "symbol": "F",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 5
            },
            {
                "symbol": "G",
                "ref": "80-15261",
                "name": "Dark Spruce",
                "hex": "#14313b",
                "count": 14
            },
            {
                "symbol": "H",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 5
            },
            {
                "symbol": "J",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 11
            }
        ],
        "notes": [
            "Thin one-bead connections at row 10, column 13; row 13, column 17; row 14, column 16; row 15, column 15; row 16, column 14; row 17, column 13; row 17, column 20; row 18, column 12; row 19, column 11; row 20, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/diamond_pickaxe.png",
            "description": "Based on the original Java Edition 1.21.1 item texture in the pinned archive. Only transparent margins were cropped before centering it on the board."
        },
        "assets": {
            "preview": "/patterns/minecraft-diamond-pickaxe-1-21-1/preview.png",
            "grid": "/patterns/minecraft-diamond-pickaxe-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-diamond-pickaxe-1-21-1/pixels.png",
            "project": "/patterns/minecraft-diamond-pickaxe-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-diamond-pickaxe-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-diamond-1-21-1",
        "slug": "minecraft/diamond",
        "title": "Diamond",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "The bright turquoise Diamond item from Minecraft, with its familiar pixel highlights. Download the printable bead pattern.",
        "beads": 120,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 12,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15218",
                "name": "Teal",
                "hex": "#047f8a",
                "count": 13
            },
            {
                "symbol": "B",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 13
            },
            {
                "symbol": "C",
                "ref": "80-15202",
                "name": "Robin's Egg",
                "hex": "#a9cdd5",
                "count": 7
            },
            {
                "symbol": "D",
                "ref": "80-15266",
                "name": "Caribbean Sea",
                "hex": "#6cc8ad",
                "count": 18
            },
            {
                "symbol": "E",
                "ref": "80-15240",
                "name": "Mint",
                "hex": "#b3eed5",
                "count": 15
            },
            {
                "symbol": "F",
                "ref": "80-19011",
                "name": "Light Green",
                "hex": "#18c7b1",
                "count": 17
            },
            {
                "symbol": "G",
                "ref": "80-15247",
                "name": "Forest",
                "hex": "#005d57",
                "count": 19
            },
            {
                "symbol": "H",
                "ref": "80-15217",
                "name": "Lagoon",
                "hex": "#00a4ac",
                "count": 13
            },
            {
                "symbol": "J",
                "ref": "80-15275",
                "name": "Peacock",
                "hex": "#0090ac",
                "count": 4
            },
            {
                "symbol": "K",
                "ref": "80-19058",
                "name": "Toothpaste",
                "hex": "#96d1d4",
                "count": 1
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/diamond.png",
            "description": "Based on the original Java Edition 1.21.1 item texture in the pinned archive. Only transparent margins were cropped before centering it on the board."
        },
        "assets": {
            "preview": "/patterns/minecraft-diamond-1-21-1/preview.png",
            "grid": "/patterns/minecraft-diamond-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-diamond-1-21-1/pixels.png",
            "project": "/patterns/minecraft-diamond-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-diamond-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-golden-apple-1-21-1",
        "slug": "minecraft/golden-apple",
        "title": "Golden Apple",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "Make the Minecraft Golden Apple with its golden skin and short brown stem. Choose the printable grid or editable bead pattern.",
        "beads": 114,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 12,
        "motifHeight": 14,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 17
            },
            {
                "symbol": "B",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 14
            },
            {
                "symbol": "C",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 3
            },
            {
                "symbol": "D",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 33
            },
            {
                "symbol": "E",
                "ref": "80-19002",
                "name": "Creme",
                "hex": "#e1e2bb",
                "count": 4
            },
            {
                "symbol": "F",
                "ref": "80-19003",
                "name": "Yellow",
                "hex": "#e7ce3e",
                "count": 17
            },
            {
                "symbol": "G",
                "ref": "80-15214",
                "name": "Sherbet",
                "hex": "#d8e47c",
                "count": 14
            },
            {
                "symbol": "H",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 2
            },
            {
                "symbol": "J",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 10
            }
        ],
        "notes": [
            "Thin one-bead connections at row 9, column 15; row 9, column 16; row 10, column 15; row 11, column 15. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/golden_apple.png",
            "description": "Based on the original Java Edition 1.21.1 item texture in the pinned archive. Only transparent margins were cropped before centering it on the board."
        },
        "assets": {
            "preview": "/patterns/minecraft-golden-apple-1-21-1/preview.png",
            "grid": "/patterns/minecraft-golden-apple-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-golden-apple-1-21-1/pixels.png",
            "project": "/patterns/minecraft-golden-apple-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-golden-apple-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-apple-1-21-1",
        "slug": "minecraft/apple",
        "title": "Apple",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A red Minecraft Apple with bright highlights and a short brown stem. Download the free printable bead pattern.",
        "beads": 114,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 12,
        "motifHeight": 14,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19020",
                "name": "Rust",
                "hex": "#995043",
                "count": 17
            },
            {
                "symbol": "B",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 1
            },
            {
                "symbol": "C",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 3
            },
            {
                "symbol": "D",
                "ref": "80-15961",
                "name": "Cherry",
                "hex": "#9d2b3a",
                "count": 13
            },
            {
                "symbol": "E",
                "ref": "80-19005",
                "name": "Red",
                "hex": "#b0353c",
                "count": 33
            },
            {
                "symbol": "F",
                "ref": "80-19063",
                "name": "Blush",
                "hex": "#f99297",
                "count": 4
            },
            {
                "symbol": "G",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 17
            },
            {
                "symbol": "H",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 14
            },
            {
                "symbol": "J",
                "ref": "80-15204",
                "name": "Salmon",
                "hex": "#e1747a",
                "count": 2
            },
            {
                "symbol": "K",
                "ref": "80-19096",
                "name": "Cranapple",
                "hex": "#843947",
                "count": 10
            }
        ],
        "notes": [
            "Thin one-bead connections at row 9, column 15; row 9, column 16; row 10, column 15; row 11, column 15. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/apple.png",
            "description": "Based on the original Java Edition 1.21.1 item texture in the pinned archive. Only transparent margins were cropped before centering it on the board."
        },
        "assets": {
            "preview": "/patterns/minecraft-apple-1-21-1/preview.png",
            "grid": "/patterns/minecraft-apple-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-apple-1-21-1/pixels.png",
            "project": "/patterns/minecraft-apple-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-apple-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-full-heart-1-21-1",
        "slug": "minecraft/heart",
        "title": "Heart",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "Make a full red Minecraft health heart with its black outline and light highlight. Download the free printable bead pattern.",
        "beads": 54,
        "colorCount": 4,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 9,
        "motifHeight": 9,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 20
            },
            {
                "symbol": "B",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 26
            },
            {
                "symbol": "C",
                "ref": "80-15276",
                "name": "Carnation Pink",
                "hex": "#f8c7c9",
                "count": 1
            },
            {
                "symbol": "D",
                "ref": "80-19005",
                "name": "Red",
                "hex": "#b0353c",
                "count": 7
            }
        ],
        "notes": [
            "Thin one-bead connections at row 18, column 15. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/gui/sprites/hud/heart/full.png",
            "description": "Based on the Java Edition 1.21.1 health display: the original container and full-heart textures are overlaid at their native size. The combined outline and color regions are preserved."
        },
        "assets": {
            "preview": "/patterns/minecraft-full-heart-1-21-1/preview.png",
            "grid": "/patterns/minecraft-full-heart-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-full-heart-1-21-1/pixels.png",
            "project": "/patterns/minecraft-full-heart-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-full-heart-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-tnt-side-1-21-1",
        "slug": "minecraft/tnt",
        "title": "TNT",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "The red-and-white side of a Minecraft TNT block, including its black TNT lettering. This printable bead pattern makes a flat square design.",
        "beads": 256,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 8
            },
            {
                "symbol": "B",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 60
            },
            {
                "symbol": "C",
                "ref": "80-19005",
                "name": "Red",
                "hex": "#b0353c",
                "count": 52
            },
            {
                "symbol": "D",
                "ref": "80-19020",
                "name": "Rust",
                "hex": "#995043",
                "count": 40
            },
            {
                "symbol": "E",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 7
            },
            {
                "symbol": "F",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 24
            },
            {
                "symbol": "G",
                "ref": "80-15208",
                "name": "Toasted Marshmallow",
                "hex": "#dedace",
                "count": 25
            },
            {
                "symbol": "H",
                "ref": "80-15201",
                "name": "Midnight",
                "hex": "#2f3c55",
                "count": 14
            },
            {
                "symbol": "J",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 8
            },
            {
                "symbol": "K",
                "ref": "80-15267",
                "name": "Frosted Lilac",
                "hex": "#cdb7c3",
                "count": 18
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/block/tnt_side.png",
            "description": "Based on the original Java Edition 1.21.1 block texture. This is one flat block face, not a three-dimensional model."
        },
        "assets": {
            "preview": "/patterns/minecraft-tnt-side-1-21-1/preview.png",
            "grid": "/patterns/minecraft-tnt-side-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-tnt-side-1-21-1/pixels.png",
            "project": "/patterns/minecraft-tnt-side-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-tnt-side-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-diamond-ore-1-21-1",
        "slug": "minecraft/diamond-ore",
        "title": "Diamond Ore",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "Make the Minecraft Diamond Ore block texture with turquoise diamond flecks in gray stone. Download this flat, square Perler bead pattern.",
        "beads": 256,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 49
            },
            {
                "symbol": "B",
                "ref": "80-15260",
                "name": "Stone",
                "hex": "#988c8c",
                "count": 71
            },
            {
                "symbol": "C",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 43
            },
            {
                "symbol": "D",
                "ref": "80-19092",
                "name": "Dark Grey",
                "hex": "#585c61",
                "count": 30
            },
            {
                "symbol": "E",
                "ref": "80-15216",
                "name": "Sky",
                "hex": "#4ac0d8",
                "count": 10
            },
            {
                "symbol": "F",
                "ref": "80-15266",
                "name": "Caribbean Sea",
                "hex": "#6cc8ad",
                "count": 12
            },
            {
                "symbol": "G",
                "ref": "80-15217",
                "name": "Lagoon",
                "hex": "#00a4ac",
                "count": 10
            },
            {
                "symbol": "H",
                "ref": "80-15215",
                "name": "Mist",
                "hex": "#93b0bd",
                "count": 20
            },
            {
                "symbol": "J",
                "ref": "80-15240",
                "name": "Mint",
                "hex": "#b3eed5",
                "count": 5
            },
            {
                "symbol": "K",
                "ref": "80-15206",
                "name": "Pewter",
                "hex": "#94a19d",
                "count": 6
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/block/diamond_ore.png",
            "description": "Based on the original Java Edition 1.21.1 block texture. This is one flat block face, not a three-dimensional model."
        },
        "assets": {
            "preview": "/patterns/minecraft-diamond-ore-1-21-1/preview.png",
            "grid": "/patterns/minecraft-diamond-ore-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-diamond-ore-1-21-1/pixels.png",
            "project": "/patterns/minecraft-diamond-ore-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-diamond-ore-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "kirby-adventure-normal",
        "slug": "kirby/kirbys-adventure",
        "title": "Kirby",
        "collectionId": "kirby",
        "version": "Kirby’s Adventure (NES)",
        "description": "Make the pink Kirby from Kirby’s Adventure, with a rounded body and dark outline. Download the free printable bead pattern.",
        "beads": 199,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 71
            },
            {
                "symbol": "B",
                "ref": "80-15242",
                "name": "Cotton Candy",
                "hex": "#f479b0",
                "count": 37
            },
            {
                "symbol": "C",
                "ref": "80-19079",
                "name": "Light Pink",
                "hex": "#e1bcce",
                "count": 91
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "WiKirby",
            "url": "https://wikirby.com/wiki/File:KA_Kirby_sprite.png",
            "description": "Based on the Kirby’s Adventure sprite archived by the community Wiki. This shows normal Kirby facing right, with the original occupied pixels and color regions preserved."
        },
        "assets": {
            "preview": "/patterns/kirby-adventure-normal/preview.png",
            "grid": "/patterns/kirby-adventure-normal/grid.png",
            "pixels": "/patterns/kirby-adventure-normal/pixels.png",
            "project": "/patterns/kirby-adventure-normal/pattern.bead-pattern.json",
            "pdf": "/patterns/kirby-adventure-normal/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-super-mushroom",
        "slug": "super-mario/super-mushroom",
        "title": "Super Mushroom",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "The classic Super Mushroom from the original Super Mario Bros., with an orange-yellow cap and red pixel spots. Download its free printable bead pattern.",
        "beads": 176,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 95
            },
            {
                "symbol": "B",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 48
            },
            {
                "symbol": "C",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 33
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Supermushroom.png",
            "description": "Based on the original Super Mario Bros. Super Mushroom sprite archived by the community Wiki. The original occupied pixels and color regions are preserved."
        },
        "assets": {
            "preview": "/patterns/smb-super-mushroom/preview.png",
            "grid": "/patterns/smb-super-mushroom/grid.png",
            "pixels": "/patterns/smb-super-mushroom/pixels.png",
            "project": "/patterns/smb-super-mushroom/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-super-mushroom/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-super-star",
        "slug": "super-mario/super-star",
        "title": "Super Star",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make the Super Star from the original Super Mario Bros., with five points and two pixel eyes. Download the free printable bead pattern.",
        "beads": 122,
        "colorCount": 2,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 14,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 116
            },
            {
                "symbol": "B",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 6
            }
        ],
        "notes": [
            "Thin one-bead connections at row 21, column 10; row 21, column 19. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Sprite_Super_Star.png",
            "description": "Based on the original Super Mario Bros. Super Star sprite archived by the community Wiki. This is one static color frame; the source file records the Nestopia palette."
        },
        "assets": {
            "preview": "/patterns/smb-super-star/preview.png",
            "grid": "/patterns/smb-super-star/grid.png",
            "pixels": "/patterns/smb-super-star/pixels.png",
            "project": "/patterns/smb-super-star/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-super-star/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-lucario-gen5",
        "slug": "pokemon/lucario-gen-5",
        "title": "Lucario",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Lucario with blue and black fur and pointed ears. Download the free printable bead pattern or open it in the editor.",
        "beads": 184,
        "colorCount": 11,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 21,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 69
            },
            {
                "symbol": "B",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 8
            },
            {
                "symbol": "C",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 53
            },
            {
                "symbol": "D",
                "ref": "80-19070",
                "name": "Periwinkle Blue",
                "hex": "#6683b7",
                "count": 27
            },
            {
                "symbol": "E",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 16
            },
            {
                "symbol": "F",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 1
            },
            {
                "symbol": "G",
                "ref": "80-19059",
                "name": "Hot Coral",
                "hex": "#dd595b",
                "count": 2
            },
            {
                "symbol": "H",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 3
            },
            {
                "symbol": "J",
                "ref": "80-19060",
                "name": "Plum",
                "hex": "#a75d9d",
                "count": 1
            },
            {
                "symbol": "K",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 3
            },
            {
                "symbol": "L",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 1
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/448.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-lucario-gen5/preview.png",
            "grid": "/patterns/pokemon-lucario-gen5/grid.png",
            "pixels": "/patterns/pokemon-lucario-gen5/pixels.png",
            "project": "/patterns/pokemon-lucario-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-lucario-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-gardevoir-gen5",
        "slug": "pokemon/gardevoir-gen-5",
        "title": "Gardevoir",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Gardevoir with green hair and a flowing white body. Download the free printable bead pattern or open it in the editor.",
        "beads": 358,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 24,
        "motifHeight": 22,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 47
            },
            {
                "symbol": "B",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 82
            },
            {
                "symbol": "C",
                "ref": "80-15219",
                "name": "Fern",
                "hex": "#7f971a",
                "count": 14
            },
            {
                "symbol": "D",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 72
            },
            {
                "symbol": "E",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 2
            },
            {
                "symbol": "F",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 80
            },
            {
                "symbol": "G",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 56
            },
            {
                "symbol": "H",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 5
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/282.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-gardevoir-gen5/preview.png",
            "grid": "/patterns/pokemon-gardevoir-gen5/grid.png",
            "pixels": "/patterns/pokemon-gardevoir-gen5/pixels.png",
            "project": "/patterns/pokemon-gardevoir-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-gardevoir-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-dragonite-gen5",
        "slug": "pokemon/dragonite-gen-5",
        "title": "Dragonite",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Dragonite with an orange body and small wings. Download the free printable bead pattern or open it in the editor.",
        "beads": 302,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 27,
        "motifHeight": 20,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 97
            },
            {
                "symbol": "B",
                "ref": "80-19090",
                "name": "Butterscotch",
                "hex": "#da9964",
                "count": 87
            },
            {
                "symbol": "C",
                "ref": "80-19070",
                "name": "Periwinkle Blue",
                "hex": "#6683b7",
                "count": 19
            },
            {
                "symbol": "D",
                "ref": "80-15274",
                "name": "Rich Butter",
                "hex": "#f6ca69",
                "count": 42
            },
            {
                "symbol": "E",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 4
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 5
            },
            {
                "symbol": "G",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 29
            },
            {
                "symbol": "H",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 6
            },
            {
                "symbol": "J",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 9
            },
            {
                "symbol": "K",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 4
            }
        ],
        "notes": [
            "This design has 3 separate parts. Mount them on a backing; do not try to lift this version as one piece.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/149.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-dragonite-gen5/preview.png",
            "grid": "/patterns/pokemon-dragonite-gen5/grid.png",
            "pixels": "/patterns/pokemon-dragonite-gen5/pixels.png",
            "project": "/patterns/pokemon-dragonite-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-dragonite-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-gyarados-gen5",
        "slug": "pokemon/gyarados-gen-5",
        "title": "Gyarados",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Gyarados with a blue, curled body and pale fins. Download the free printable bead pattern or open it in the editor.",
        "beads": 375,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 27,
        "motifHeight": 20,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 139
            },
            {
                "symbol": "B",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 32
            },
            {
                "symbol": "C",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 21
            },
            {
                "symbol": "D",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 22
            },
            {
                "symbol": "E",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 10
            },
            {
                "symbol": "F",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 53
            },
            {
                "symbol": "G",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 1
            },
            {
                "symbol": "H",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 9
            },
            {
                "symbol": "J",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 32
            },
            {
                "symbol": "K",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 56
            }
        ],
        "notes": [
            "This design has 4 separate parts. Mount them on a backing; do not try to lift this version as one piece.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/130.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-gyarados-gen5/preview.png",
            "grid": "/patterns/pokemon-gyarados-gen5/grid.png",
            "pixels": "/patterns/pokemon-gyarados-gen5/pixels.png",
            "project": "/patterns/pokemon-gyarados-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-gyarados-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-psyduck-gen5",
        "slug": "pokemon/psyduck-gen-5",
        "title": "Psyduck",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Psyduck with a yellow body and a wide bill. Download the free printable bead pattern or open it in the editor.",
        "beads": 196,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 15,
        "motifHeight": 19,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 36
            },
            {
                "symbol": "B",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 42
            },
            {
                "symbol": "C",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 38
            },
            {
                "symbol": "D",
                "ref": "80-15239",
                "name": "Mocha",
                "hex": "#c8b693",
                "count": 43
            },
            {
                "symbol": "E",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 9
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 5
            },
            {
                "symbol": "G",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 8
            },
            {
                "symbol": "H",
                "ref": "80-15259",
                "name": "Slime",
                "hex": "#c8c85c",
                "count": 15
            }
        ],
        "notes": [
            "Thin one-bead connections at row 7, column 14; row 8, column 12; row 8, column 14; row 8, column 16. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/54.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-psyduck-gen5/preview.png",
            "grid": "/patterns/pokemon-psyduck-gen5/grid.png",
            "pixels": "/patterns/pokemon-psyduck-gen5/pixels.png",
            "project": "/patterns/pokemon-psyduck-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-psyduck-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-lapras-gen5",
        "slug": "pokemon/lapras-gen-5",
        "title": "Lapras",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Lapras with a blue neck and a shell on its back. Download the free printable bead pattern or open it in the editor.",
        "beads": 273,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 24,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 85
            },
            {
                "symbol": "B",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 19
            },
            {
                "symbol": "C",
                "ref": "80-19070",
                "name": "Periwinkle Blue",
                "hex": "#6683b7",
                "count": 64
            },
            {
                "symbol": "D",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 13
            },
            {
                "symbol": "E",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 27
            },
            {
                "symbol": "F",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 9
            },
            {
                "symbol": "G",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 30
            },
            {
                "symbol": "H",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 26
            }
        ],
        "notes": [
            "Thin one-bead connections at row 9, column 17; row 16, column 25; row 19, column 5; row 22, column 19. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/131.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-lapras-gen5/preview.png",
            "grid": "/patterns/pokemon-lapras-gen5/grid.png",
            "pixels": "/patterns/pokemon-lapras-gen5/pixels.png",
            "project": "/patterns/pokemon-lapras-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-lapras-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-ditto-gen5",
        "slug": "pokemon/ditto-gen-5",
        "title": "Ditto",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Ditto with a small purple body and a simple face. Download the free printable bead pattern or open it in the editor.",
        "beads": 144,
        "colorCount": 4,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 39
            },
            {
                "symbol": "B",
                "ref": "80-15182",
                "name": "Lavender",
                "hex": "#af9fce",
                "count": 14
            },
            {
                "symbol": "C",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 79
            },
            {
                "symbol": "D",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 12
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/132.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-ditto-gen5/preview.png",
            "grid": "/patterns/pokemon-ditto-gen5/grid.png",
            "pixels": "/patterns/pokemon-ditto-gen5/pixels.png",
            "project": "/patterns/pokemon-ditto-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-ditto-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-espeon-gen5",
        "slug": "pokemon/espeon-gen-5",
        "title": "Espeon",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Espeon with purple fur and a forked tail. Download the free printable bead pattern or open it in the editor.",
        "beads": 261,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 26,
        "motifHeight": 20,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 101
            },
            {
                "symbol": "B",
                "ref": "80-15182",
                "name": "Lavender",
                "hex": "#af9fce",
                "count": 56
            },
            {
                "symbol": "C",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 62
            },
            {
                "symbol": "D",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 3
            },
            {
                "symbol": "E",
                "ref": "80-19059",
                "name": "Hot Coral",
                "hex": "#dd595b",
                "count": 3
            },
            {
                "symbol": "F",
                "ref": "80-19070",
                "name": "Periwinkle Blue",
                "hex": "#6683b7",
                "count": 1
            },
            {
                "symbol": "G",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 35
            }
        ],
        "notes": [
            "Thin one-bead connections at row 7, column 23; row 9, column 26; row 13, column 3. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/196.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-espeon-gen5/preview.png",
            "grid": "/patterns/pokemon-espeon-gen5/grid.png",
            "pixels": "/patterns/pokemon-espeon-gen5/pixels.png",
            "project": "/patterns/pokemon-espeon-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-espeon-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-flareon-gen5",
        "slug": "pokemon/flareon-gen-5",
        "title": "Flareon",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Flareon with orange fur and a fluffy pale tail. Download the free printable bead pattern or open it in the editor.",
        "beads": 200,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 19,
        "motifHeight": 17,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 76
            },
            {
                "symbol": "B",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 17
            },
            {
                "symbol": "C",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 40
            },
            {
                "symbol": "D",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 25
            },
            {
                "symbol": "E",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 9
            },
            {
                "symbol": "F",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 31
            },
            {
                "symbol": "G",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 2
            }
        ],
        "notes": [
            "Thin one-bead connections at row 9, column 13. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/136.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-flareon-gen5/preview.png",
            "grid": "/patterns/pokemon-flareon-gen5/grid.png",
            "pixels": "/patterns/pokemon-flareon-gen5/pixels.png",
            "project": "/patterns/pokemon-flareon-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-flareon-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-jolteon-gen5",
        "slug": "pokemon/jolteon-gen-5",
        "title": "Jolteon",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Jolteon with yellow fur and a spiky pale collar. Download the free printable bead pattern or open it in the editor.",
        "beads": 213,
        "colorCount": 6,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 18,
        "motifHeight": 17,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 57
            },
            {
                "symbol": "B",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 59
            },
            {
                "symbol": "C",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 37
            },
            {
                "symbol": "D",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 37
            },
            {
                "symbol": "E",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 11
            },
            {
                "symbol": "F",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 12
            }
        ],
        "notes": [
            "Thin one-bead connections at row 8, column 16; row 8, column 18; row 9, column 12; row 11, column 22; row 13, column 22. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/135.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-jolteon-gen5/preview.png",
            "grid": "/patterns/pokemon-jolteon-gen5/grid.png",
            "pixels": "/patterns/pokemon-jolteon-gen5/pixels.png",
            "project": "/patterns/pokemon-jolteon-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-jolteon-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-leafeon-gen5",
        "slug": "pokemon/leafeon-gen-5",
        "title": "Leafeon",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Leafeon with leaf-shaped ears and a leafy tail. Download the free printable bead pattern or open it in the editor.",
        "beads": 310,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 28,
        "motifHeight": 21,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 85
            },
            {
                "symbol": "B",
                "ref": "80-15219",
                "name": "Fern",
                "hex": "#7f971a",
                "count": 53
            },
            {
                "symbol": "C",
                "ref": "80-15239",
                "name": "Mocha",
                "hex": "#c8b693",
                "count": 18
            },
            {
                "symbol": "D",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 54
            },
            {
                "symbol": "E",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 8
            },
            {
                "symbol": "F",
                "ref": "80-15259",
                "name": "Slime",
                "hex": "#c8c85c",
                "count": 46
            },
            {
                "symbol": "G",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 45
            },
            {
                "symbol": "H",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 1
            }
        ],
        "notes": [
            "Thin one-bead connections at row 8, column 27; row 13, column 2. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/470.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-leafeon-gen5/preview.png",
            "grid": "/patterns/pokemon-leafeon-gen5/grid.png",
            "pixels": "/patterns/pokemon-leafeon-gen5/pixels.png",
            "project": "/patterns/pokemon-leafeon-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-leafeon-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-glaceon-gen5",
        "slug": "pokemon/glaceon-gen-5",
        "title": "Glaceon",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Glaceon with pale blue fur and long head flaps. Download the free printable bead pattern or open it in the editor.",
        "beads": 313,
        "colorCount": 6,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 27,
        "motifHeight": 22,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 59
            },
            {
                "symbol": "B",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 91
            },
            {
                "symbol": "C",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 46
            },
            {
                "symbol": "D",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 67
            },
            {
                "symbol": "E",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 49
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 1
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/471.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-glaceon-gen5/preview.png",
            "grid": "/patterns/pokemon-glaceon-gen5/grid.png",
            "pixels": "/patterns/pokemon-glaceon-gen5/pixels.png",
            "project": "/patterns/pokemon-glaceon-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-glaceon-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-mewtwo-gen5",
        "slug": "pokemon/mewtwo-gen-5",
        "title": "Mewtwo",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Mewtwo with a pale body and a long purple tail. Download the free printable bead pattern or open it in the editor.",
        "beads": 244,
        "colorCount": 6,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 22,
        "motifHeight": 20,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 89
            },
            {
                "symbol": "B",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 22
            },
            {
                "symbol": "C",
                "ref": "80-15182",
                "name": "Lavender",
                "hex": "#af9fce",
                "count": 82
            },
            {
                "symbol": "D",
                "ref": "80-19060",
                "name": "Plum",
                "hex": "#a75d9d",
                "count": 18
            },
            {
                "symbol": "E",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 8
            },
            {
                "symbol": "F",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 25
            }
        ],
        "notes": [
            "Thin one-bead connections at row 20, column 7; row 22, column 16; row 23, column 20. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/150.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-mewtwo-gen5/preview.png",
            "grid": "/patterns/pokemon-mewtwo-gen5/grid.png",
            "pixels": "/patterns/pokemon-mewtwo-gen5/pixels.png",
            "project": "/patterns/pokemon-mewtwo-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-mewtwo-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-cyndaquil-gen5",
        "slug": "pokemon/cyndaquil-gen-5",
        "title": "Cyndaquil",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Cyndaquil with a dark back and a small pointed snout. Download the free printable bead pattern or open it in the editor.",
        "beads": 228,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 20,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 64
            },
            {
                "symbol": "B",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 35
            },
            {
                "symbol": "C",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 22
            },
            {
                "symbol": "D",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 40
            },
            {
                "symbol": "E",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 20
            },
            {
                "symbol": "F",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 30
            },
            {
                "symbol": "G",
                "ref": "80-15259",
                "name": "Slime",
                "hex": "#c8c85c",
                "count": 17
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/155.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-cyndaquil-gen5/preview.png",
            "grid": "/patterns/pokemon-cyndaquil-gen5/grid.png",
            "pixels": "/patterns/pokemon-cyndaquil-gen5/pixels.png",
            "project": "/patterns/pokemon-cyndaquil-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-cyndaquil-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-chikorita-gen5",
        "slug": "pokemon/chikorita-gen-5",
        "title": "Chikorita",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Chikorita with a green body and a leaf on its head. Download the free printable bead pattern or open it in the editor.",
        "beads": 191,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 15,
        "motifHeight": 19,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 44
            },
            {
                "symbol": "B",
                "ref": "80-19097",
                "name": "Prickly Pear",
                "hex": "#bbc938",
                "count": 51
            },
            {
                "symbol": "C",
                "ref": "80-15219",
                "name": "Fern",
                "hex": "#7f971a",
                "count": 17
            },
            {
                "symbol": "D",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 42
            },
            {
                "symbol": "E",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 5
            },
            {
                "symbol": "F",
                "ref": "80-19006",
                "name": "Bubblegum",
                "hex": "#d8729a",
                "count": 3
            },
            {
                "symbol": "G",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 3
            },
            {
                "symbol": "H",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 26
            }
        ],
        "notes": [
            "Thin one-bead connections at row 8, column 21. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/152.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-chikorita-gen5/preview.png",
            "grid": "/patterns/pokemon-chikorita-gen5/grid.png",
            "pixels": "/patterns/pokemon-chikorita-gen5/pixels.png",
            "project": "/patterns/pokemon-chikorita-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-chikorita-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-totodile-gen5",
        "slug": "pokemon/totodile-gen-5",
        "title": "Totodile",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Totodile with a blue body and red back spikes. Download the free printable bead pattern or open it in the editor.",
        "beads": 196,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 17,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 67
            },
            {
                "symbol": "B",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 45
            },
            {
                "symbol": "C",
                "ref": "80-19070",
                "name": "Periwinkle Blue",
                "hex": "#6683b7",
                "count": 28
            },
            {
                "symbol": "D",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 6
            },
            {
                "symbol": "E",
                "ref": "80-19059",
                "name": "Hot Coral",
                "hex": "#dd595b",
                "count": 12
            },
            {
                "symbol": "F",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 32
            },
            {
                "symbol": "G",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 4
            },
            {
                "symbol": "H",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 2
            }
        ],
        "notes": [
            "Thin one-bead connections at row 20, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/158.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-totodile-gen5/preview.png",
            "grid": "/patterns/pokemon-totodile-gen5/grid.png",
            "pixels": "/patterns/pokemon-totodile-gen5/pixels.png",
            "project": "/patterns/pokemon-totodile-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-totodile-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-treecko-gen5",
        "slug": "pokemon/treecko-gen-5",
        "title": "Treecko",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Treecko with a green body and a large tail. Download the free printable bead pattern or open it in the editor.",
        "beads": 203,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 19,
        "motifHeight": 20,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 54
            },
            {
                "symbol": "B",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 33
            },
            {
                "symbol": "C",
                "ref": "80-15219",
                "name": "Fern",
                "hex": "#7f971a",
                "count": 60
            },
            {
                "symbol": "D",
                "ref": "80-15259",
                "name": "Slime",
                "hex": "#c8c85c",
                "count": 1
            },
            {
                "symbol": "E",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 3
            },
            {
                "symbol": "F",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 20
            },
            {
                "symbol": "G",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 32
            }
        ],
        "notes": [
            "Thin one-bead connections at row 13, column 7; row 21, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/252.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-treecko-gen5/preview.png",
            "grid": "/patterns/pokemon-treecko-gen5/grid.png",
            "pixels": "/patterns/pokemon-treecko-gen5/pixels.png",
            "project": "/patterns/pokemon-treecko-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-treecko-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-torchic-gen5",
        "slug": "pokemon/torchic-gen-5",
        "title": "Torchic",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Torchic with an orange body and a feathered crest. Download the free printable bead pattern or open it in the editor.",
        "beads": 172,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 13,
        "motifHeight": 19,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 31
            },
            {
                "symbol": "B",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 35
            },
            {
                "symbol": "C",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 11
            },
            {
                "symbol": "D",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 40
            },
            {
                "symbol": "E",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 35
            },
            {
                "symbol": "F",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 18
            },
            {
                "symbol": "G",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 2
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/255.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-torchic-gen5/preview.png",
            "grid": "/patterns/pokemon-torchic-gen5/grid.png",
            "pixels": "/patterns/pokemon-torchic-gen5/pixels.png",
            "project": "/patterns/pokemon-torchic-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-torchic-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-mudkip-gen5",
        "slug": "pokemon/mudkip-gen-5",
        "title": "Mudkip",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Mudkip with a blue body and a large head fin. Download the free printable bead pattern or open it in the editor.",
        "beads": 192,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 19,
        "motifHeight": 17,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 47
            },
            {
                "symbol": "B",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 54
            },
            {
                "symbol": "C",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 36
            },
            {
                "symbol": "D",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 13
            },
            {
                "symbol": "E",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 20
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 6
            },
            {
                "symbol": "G",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 16
            }
        ],
        "notes": [
            "Thin one-bead connections at row 14, column 7; row 16, column 7. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/258.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-mudkip-gen5/preview.png",
            "grid": "/patterns/pokemon-mudkip-gen5/grid.png",
            "pixels": "/patterns/pokemon-mudkip-gen5/pixels.png",
            "project": "/patterns/pokemon-mudkip-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-mudkip-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-turtwig-gen5",
        "slug": "pokemon/turtwig-gen-5",
        "title": "Turtwig",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Turtwig with a green body and a sprout on its head. Download the free printable bead pattern or open it in the editor.",
        "beads": 203,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 19,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 32
            },
            {
                "symbol": "B",
                "ref": "80-19097",
                "name": "Prickly Pear",
                "hex": "#bbc938",
                "count": 11
            },
            {
                "symbol": "C",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 47
            },
            {
                "symbol": "D",
                "ref": "80-15239",
                "name": "Mocha",
                "hex": "#c8b693",
                "count": 22
            },
            {
                "symbol": "E",
                "ref": "80-15219",
                "name": "Fern",
                "hex": "#7f971a",
                "count": 7
            },
            {
                "symbol": "F",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 43
            },
            {
                "symbol": "G",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 12
            },
            {
                "symbol": "H",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 26
            },
            {
                "symbol": "J",
                "ref": "80-15259",
                "name": "Slime",
                "hex": "#c8c85c",
                "count": 3
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/387.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-turtwig-gen5/preview.png",
            "grid": "/patterns/pokemon-turtwig-gen5/grid.png",
            "pixels": "/patterns/pokemon-turtwig-gen5/pixels.png",
            "project": "/patterns/pokemon-turtwig-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-turtwig-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-chimchar-gen5",
        "slug": "pokemon/chimchar-gen-5",
        "title": "Chimchar",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Chimchar with an orange body and a pale face. Download the free printable bead pattern or open it in the editor.",
        "beads": 166,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 15,
        "motifHeight": 19,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 48
            },
            {
                "symbol": "B",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 43
            },
            {
                "symbol": "C",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 17
            },
            {
                "symbol": "D",
                "ref": "80-15239",
                "name": "Mocha",
                "hex": "#c8b693",
                "count": 11
            },
            {
                "symbol": "E",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 22
            },
            {
                "symbol": "F",
                "ref": "80-15259",
                "name": "Slime",
                "hex": "#c8c85c",
                "count": 19
            },
            {
                "symbol": "G",
                "ref": "80-19006",
                "name": "Bubblegum",
                "hex": "#d8729a",
                "count": 2
            },
            {
                "symbol": "H",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 1
            },
            {
                "symbol": "J",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 2
            },
            {
                "symbol": "K",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 1
            }
        ],
        "notes": [
            "Thin one-bead connections at row 7, column 15. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/390.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-chimchar-gen5/preview.png",
            "grid": "/patterns/pokemon-chimchar-gen5/grid.png",
            "pixels": "/patterns/pokemon-chimchar-gen5/pixels.png",
            "project": "/patterns/pokemon-chimchar-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-chimchar-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-piplup-gen5",
        "slug": "pokemon/piplup-gen-5",
        "title": "Piplup",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Piplup with a blue head and a pale face. Download the free printable bead pattern or open it in the editor.",
        "beads": 172,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 15,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 45
            },
            {
                "symbol": "B",
                "ref": "80-19070",
                "name": "Periwinkle Blue",
                "hex": "#6683b7",
                "count": 52
            },
            {
                "symbol": "C",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 19
            },
            {
                "symbol": "D",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 16
            },
            {
                "symbol": "E",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 9
            },
            {
                "symbol": "F",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 1
            },
            {
                "symbol": "G",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 6
            },
            {
                "symbol": "H",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 24
            }
        ],
        "notes": [
            "Thin one-bead connections at row 16, column 21; row 20, column 11. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/393.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-piplup-gen5/preview.png",
            "grid": "/patterns/pokemon-piplup-gen5/grid.png",
            "pixels": "/patterns/pokemon-piplup-gen5/pixels.png",
            "project": "/patterns/pokemon-piplup-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-piplup-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-snivy-gen5",
        "slug": "pokemon/snivy-gen-5",
        "title": "Snivy",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Snivy with a green body and a leaf-shaped tail. Download the free printable bead pattern or open it in the editor.",
        "beads": 202,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 20,
        "motifHeight": 17,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 44
            },
            {
                "symbol": "B",
                "ref": "80-15219",
                "name": "Fern",
                "hex": "#7f971a",
                "count": 14
            },
            {
                "symbol": "C",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 67
            },
            {
                "symbol": "D",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 14
            },
            {
                "symbol": "E",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 16
            },
            {
                "symbol": "F",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 31
            },
            {
                "symbol": "G",
                "ref": "80-15259",
                "name": "Slime",
                "hex": "#c8c85c",
                "count": 6
            },
            {
                "symbol": "H",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 2
            },
            {
                "symbol": "J",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 2
            },
            {
                "symbol": "K",
                "ref": "80-15239",
                "name": "Mocha",
                "hex": "#c8b693",
                "count": 6
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/495.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-snivy-gen5/preview.png",
            "grid": "/patterns/pokemon-snivy-gen5/grid.png",
            "pixels": "/patterns/pokemon-snivy-gen5/pixels.png",
            "project": "/patterns/pokemon-snivy-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-snivy-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-tepig-gen5",
        "slug": "pokemon/tepig-gen-5",
        "title": "Tepig",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Tepig with an orange body and dark ears. Download the free printable bead pattern or open it in the editor.",
        "beads": 178,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 18,
        "motifHeight": 17,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 57
            },
            {
                "symbol": "B",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 60
            },
            {
                "symbol": "C",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 8
            },
            {
                "symbol": "D",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 43
            },
            {
                "symbol": "E",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 6
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 3
            },
            {
                "symbol": "G",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 1
            }
        ],
        "notes": [
            "This design has 3 separate parts. Mount them on a backing; do not try to lift this version as one piece.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/498.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-tepig-gen5/preview.png",
            "grid": "/patterns/pokemon-tepig-gen5/grid.png",
            "pixels": "/patterns/pokemon-tepig-gen5/pixels.png",
            "project": "/patterns/pokemon-tepig-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-tepig-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-oshawott-gen5",
        "slug": "pokemon/oshawott-gen-5",
        "title": "Oshawott",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Oshawott with a pale head and a shell on its belly. Download the free printable bead pattern or open it in the editor.",
        "beads": 180,
        "colorCount": 12,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 15,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 29
            },
            {
                "symbol": "B",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 52
            },
            {
                "symbol": "C",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 38
            },
            {
                "symbol": "D",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 13
            },
            {
                "symbol": "E",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 3
            },
            {
                "symbol": "F",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 2
            },
            {
                "symbol": "G",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 6
            },
            {
                "symbol": "H",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 11
            },
            {
                "symbol": "J",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 3
            },
            {
                "symbol": "K",
                "ref": "80-15266",
                "name": "Caribbean Sea",
                "hex": "#6cc8ad",
                "count": 15
            },
            {
                "symbol": "L",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 7
            },
            {
                "symbol": "M",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 1
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/501.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-oshawott-gen5/preview.png",
            "grid": "/patterns/pokemon-oshawott-gen5/grid.png",
            "pixels": "/patterns/pokemon-oshawott-gen5/pixels.png",
            "project": "/patterns/pokemon-oshawott-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-oshawott-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-togepi-gen5",
        "slug": "pokemon/togepi-gen-5",
        "title": "Togepi",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Togepi with a patterned eggshell and a small pointed head. Download the free printable bead pattern or open it in the editor.",
        "beads": 189,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 14,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 66
            },
            {
                "symbol": "B",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 41
            },
            {
                "symbol": "C",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 15
            },
            {
                "symbol": "D",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 18
            },
            {
                "symbol": "E",
                "ref": "80-19059",
                "name": "Hot Coral",
                "hex": "#dd595b",
                "count": 3
            },
            {
                "symbol": "F",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 10
            },
            {
                "symbol": "G",
                "ref": "80-19070",
                "name": "Periwinkle Blue",
                "hex": "#6683b7",
                "count": 6
            },
            {
                "symbol": "H",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 30
            }
        ],
        "notes": [
            "Thin one-bead connections at row 20, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/175.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-togepi-gen5/preview.png",
            "grid": "/patterns/pokemon-togepi-gen5/grid.png",
            "pixels": "/patterns/pokemon-togepi-gen5/pixels.png",
            "project": "/patterns/pokemon-togepi-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-togepi-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-pichu-gen5",
        "slug": "pokemon/pichu-gen-5",
        "title": "Pichu",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Pichu with yellow fur and black-tipped ears. Download the free printable bead pattern or open it in the editor.",
        "beads": 167,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 68
            },
            {
                "symbol": "B",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 23
            },
            {
                "symbol": "C",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 55
            },
            {
                "symbol": "D",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 13
            },
            {
                "symbol": "E",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 2
            },
            {
                "symbol": "F",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 5
            },
            {
                "symbol": "G",
                "ref": "80-19006",
                "name": "Bubblegum",
                "hex": "#d8729a",
                "count": 1
            }
        ],
        "notes": [
            "Thin one-bead connections at row 19, column 17; row 19, column 18; row 19, column 21. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/172.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-pichu-gen5/preview.png",
            "grid": "/patterns/pokemon-pichu-gen5/grid.png",
            "pixels": "/patterns/pokemon-pichu-gen5/pixels.png",
            "project": "/patterns/pokemon-pichu-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-pichu-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-wooper-gen5",
        "slug": "pokemon/wooper-gen-5",
        "title": "Wooper",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Wooper with a blue body and branching gills. Download the free printable bead pattern or open it in the editor.",
        "beads": 202,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 20,
        "motifHeight": 18,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 71
            },
            {
                "symbol": "B",
                "ref": "80-15272",
                "name": "Coral",
                "hex": "#ff9a8b",
                "count": 11
            },
            {
                "symbol": "C",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 36
            },
            {
                "symbol": "D",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 45
            },
            {
                "symbol": "E",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 5
            },
            {
                "symbol": "F",
                "ref": "80-19006",
                "name": "Bubblegum",
                "hex": "#d8729a",
                "count": 10
            },
            {
                "symbol": "G",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 24
            }
        ],
        "notes": [
            "Thin one-bead connections at row 7, column 8; row 9, column 6; row 15, column 23; row 20, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/194.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-wooper-gen5/preview.png",
            "grid": "/patterns/pokemon-wooper-gen5/grid.png",
            "pixels": "/patterns/pokemon-wooper-gen5/pixels.png",
            "project": "/patterns/pokemon-wooper-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-wooper-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-slowpoke-gen5",
        "slug": "pokemon/slowpoke-gen-5",
        "title": "Slowpoke",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Slowpoke with a pink body and a long tail. Download the free printable bead pattern or open it in the editor.",
        "beads": 224,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 20,
        "motifHeight": 17,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 47
            },
            {
                "symbol": "B",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 17
            },
            {
                "symbol": "C",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 2
            },
            {
                "symbol": "D",
                "ref": "80-15272",
                "name": "Coral",
                "hex": "#ff9a8b",
                "count": 41
            },
            {
                "symbol": "E",
                "ref": "80-19006",
                "name": "Bubblegum",
                "hex": "#d8729a",
                "count": 52
            },
            {
                "symbol": "F",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 38
            },
            {
                "symbol": "G",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 6
            },
            {
                "symbol": "H",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 14
            },
            {
                "symbol": "J",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 7
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/79.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-slowpoke-gen5/preview.png",
            "grid": "/patterns/pokemon-slowpoke-gen5/grid.png",
            "pixels": "/patterns/pokemon-slowpoke-gen5/pixels.png",
            "project": "/patterns/pokemon-slowpoke-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-slowpoke-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-jirachi-gen5",
        "slug": "pokemon/jirachi-gen-5",
        "title": "Jirachi",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Jirachi with a yellow star-shaped head and a pale body. Download the free printable bead pattern or open it in the editor.",
        "beads": 225,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 19,
        "motifHeight": 19,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 56
            },
            {
                "symbol": "B",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 9
            },
            {
                "symbol": "C",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 67
            },
            {
                "symbol": "D",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 25
            },
            {
                "symbol": "E",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 45
            },
            {
                "symbol": "F",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 20
            },
            {
                "symbol": "G",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 3
            }
        ],
        "notes": [
            "Thin one-bead connections at row 20, column 9; row 21, column 16; row 22, column 23. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/385.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-jirachi-gen5/preview.png",
            "grid": "/patterns/pokemon-jirachi-gen5/grid.png",
            "pixels": "/patterns/pokemon-jirachi-gen5/pixels.png",
            "project": "/patterns/pokemon-jirachi-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-jirachi-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-celebi-gen5",
        "slug": "pokemon/celebi-gen-5",
        "title": "Celebi",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Celebi with a green body, a pointed head, and small wings. Download the free printable bead pattern or open it in the editor.",
        "beads": 192,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 14,
        "motifHeight": 19,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 68
            },
            {
                "symbol": "B",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 37
            },
            {
                "symbol": "C",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 42
            },
            {
                "symbol": "D",
                "ref": "80-15219",
                "name": "Fern",
                "hex": "#7f971a",
                "count": 2
            },
            {
                "symbol": "E",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 1
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 8
            },
            {
                "symbol": "G",
                "ref": "80-19097",
                "name": "Prickly Pear",
                "hex": "#bbc938",
                "count": 4
            },
            {
                "symbol": "H",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 30
            }
        ],
        "notes": [
            "Thin one-bead connections at row 7, column 10; row 7, column 16; row 16, column 20; row 20, column 9; row 22, column 20. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/251.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-celebi-gen5/preview.png",
            "grid": "/patterns/pokemon-celebi-gen5/grid.png",
            "pixels": "/patterns/pokemon-celebi-gen5/pixels.png",
            "project": "/patterns/pokemon-celebi-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-celebi-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-victini-gen5",
        "slug": "pokemon/victini-gen-5",
        "title": "Victini",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Victini with large V-shaped ears and a pale body. Download the free printable bead pattern or open it in the editor.",
        "beads": 220,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 19,
        "motifHeight": 22,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 54
            },
            {
                "symbol": "B",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 46
            },
            {
                "symbol": "C",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 14
            },
            {
                "symbol": "D",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 8
            },
            {
                "symbol": "E",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 27
            },
            {
                "symbol": "F",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 35
            },
            {
                "symbol": "G",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 29
            },
            {
                "symbol": "H",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 2
            },
            {
                "symbol": "J",
                "ref": "80-15266",
                "name": "Caribbean Sea",
                "hex": "#6cc8ad",
                "count": 2
            },
            {
                "symbol": "K",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 3
            }
        ],
        "notes": [
            "Thin one-bead connections at row 5, column 11; row 9, column 23; row 19, column 7; row 19, column 20; row 22, column 9. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/494.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-victini-gen5/preview.png",
            "grid": "/patterns/pokemon-victini-gen5/grid.png",
            "pixels": "/patterns/pokemon-victini-gen5/pixels.png",
            "project": "/patterns/pokemon-victini-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-victini-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-chandelure-gen5",
        "slug": "pokemon/chandelure-gen-5",
        "title": "Chandelure",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Chandelure with a dark frame and purple flames. Download the free printable bead pattern or open it in the editor.",
        "beads": 279,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 28,
        "motifHeight": 22,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 98
            },
            {
                "symbol": "B",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 38
            },
            {
                "symbol": "C",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 23
            },
            {
                "symbol": "D",
                "ref": "80-15182",
                "name": "Lavender",
                "hex": "#af9fce",
                "count": 15
            },
            {
                "symbol": "E",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 92
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 3
            },
            {
                "symbol": "G",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 8
            },
            {
                "symbol": "H",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 2
            }
        ],
        "notes": [
            "Thin one-bead connections at row 5, column 15; row 10, column 6; row 11, column 6; row 12, column 2; row 13, column 2; row 14, column 27; row 15, column 27; row 16, column 23; row 17, column 23; row 18, column 27; row 19, column 27; row 20, column 26; row 20, column 27; row 24, column 14. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/609.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-chandelure-gen5/preview.png",
            "grid": "/patterns/pokemon-chandelure-gen5/grid.png",
            "pixels": "/patterns/pokemon-chandelure-gen5/pixels.png",
            "project": "/patterns/pokemon-chandelure-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-chandelure-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-garchomp-gen5",
        "slug": "pokemon/garchomp-gen-5",
        "title": "Garchomp",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Garchomp with a shark-like head and fin-shaped arms. Download the free printable bead pattern or open it in the editor.",
        "beads": 348,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 29,
        "motifHeight": 22,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 53
            },
            {
                "symbol": "B",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 139
            },
            {
                "symbol": "C",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 100
            },
            {
                "symbol": "D",
                "ref": "80-15268",
                "name": "Sunflower",
                "hex": "#deba0b",
                "count": 7
            },
            {
                "symbol": "E",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 17
            },
            {
                "symbol": "F",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 8
            },
            {
                "symbol": "G",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 14
            },
            {
                "symbol": "H",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 9
            },
            {
                "symbol": "J",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 1
            }
        ],
        "notes": [
            "Thin one-bead connections at row 19, column 7; row 22, column 8. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/445.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-garchomp-gen5/preview.png",
            "grid": "/patterns/pokemon-garchomp-gen5/grid.png",
            "pixels": "/patterns/pokemon-garchomp-gen5/pixels.png",
            "project": "/patterns/pokemon-garchomp-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-garchomp-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "pokemon-zoroark-gen5",
        "slug": "pokemon/zoroark-gen-5",
        "title": "Zoroark",
        "collectionId": "pokemon",
        "version": "Gen V menu icon",
        "description": "Make Pokémon Zoroark with dark fur and a long red mane. Download the free printable bead pattern or open it in the editor.",
        "beads": 340,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 29,
        "motifHeight": 22,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 99
            },
            {
                "symbol": "B",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 86
            },
            {
                "symbol": "C",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 93
            },
            {
                "symbol": "D",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 54
            },
            {
                "symbol": "E",
                "ref": "80-15266",
                "name": "Caribbean Sea",
                "hex": "#6cc8ad",
                "count": 6
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 1
            },
            {
                "symbol": "G",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 1
            }
        ],
        "notes": [
            "Thin one-bead connections at row 4, column 13; row 8, column 3; row 8, column 16; row 11, column 19; row 18, column 28. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "PokeAPI sprite archive",
            "url": "https://github.com/PokeAPI/sprites/blob/0b133a62e914976d3d7ea33aaa1ac676ca248c30/sprites/pokemon/versions/generation-v/icons/571.png",
            "description": "Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board."
        },
        "assets": {
            "preview": "/patterns/pokemon-zoroark-gen5/preview.png",
            "grid": "/patterns/pokemon-zoroark-gen5/grid.png",
            "pixels": "/patterns/pokemon-zoroark-gen5/pixels.png",
            "project": "/patterns/pokemon-zoroark-gen5/pattern.bead-pattern.json",
            "pdf": "/patterns/pokemon-zoroark-gen5/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-emerald-1-21-1",
        "slug": "minecraft/emerald",
        "title": "Emerald",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A faceted green Minecraft Emerald with pale highlights and a compact outline. Download its free printable bead pattern.",
        "beads": 96,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 10,
        "motifHeight": 12,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15220",
                "name": "Olive",
                "hex": "#696e31",
                "count": 15
            },
            {
                "symbol": "B",
                "ref": "80-15240",
                "name": "Mint",
                "hex": "#b3eed5",
                "count": 3
            },
            {
                "symbol": "C",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 7
            },
            {
                "symbol": "D",
                "ref": "80-19061",
                "name": "Kiwi Lime",
                "hex": "#69b845",
                "count": 16
            },
            {
                "symbol": "E",
                "ref": "80-15263",
                "name": "Celery",
                "hex": "#bed4a6",
                "count": 12
            },
            {
                "symbol": "F",
                "ref": "80-19080",
                "name": "Green",
                "hex": "#4dab64",
                "count": 12
            },
            {
                "symbol": "G",
                "ref": "80-15179",
                "name": "Evergreen",
                "hex": "#305545",
                "count": 13
            },
            {
                "symbol": "H",
                "ref": "80-15199",
                "name": "Shamrock",
                "hex": "#008f53",
                "count": 5
            },
            {
                "symbol": "J",
                "ref": "80-19053",
                "name": "Pastel Green",
                "hex": "#6dcc94",
                "count": 6
            },
            {
                "symbol": "K",
                "ref": "80-19010",
                "name": "Dark Green",
                "hex": "#007b4e",
                "count": 7
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/emerald.png",
            "description": "Based on the original Emerald inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-emerald-1-21-1/preview.png",
            "grid": "/patterns/minecraft-emerald-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-emerald-1-21-1/pixels.png",
            "project": "/patterns/minecraft-emerald-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-emerald-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-ender-pearl-1-21-1",
        "slug": "minecraft/ender-pearl",
        "title": "Ender Pearl",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A round teal Minecraft Ender Pearl with a dark center and bright rim. Download its free printable bead pattern.",
        "beads": 121,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 13,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15261",
                "name": "Dark Spruce",
                "hex": "#14313b",
                "count": 11
            },
            {
                "symbol": "B",
                "ref": "80-19091",
                "name": "Parrot Green",
                "hex": "#009188",
                "count": 12
            },
            {
                "symbol": "C",
                "ref": "80-15218",
                "name": "Teal",
                "hex": "#047f8a",
                "count": 12
            },
            {
                "symbol": "D",
                "ref": "80-15247",
                "name": "Forest",
                "hex": "#005d57",
                "count": 17
            },
            {
                "symbol": "E",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 30
            },
            {
                "symbol": "F",
                "ref": "80-15240",
                "name": "Mint",
                "hex": "#b3eed5",
                "count": 3
            },
            {
                "symbol": "G",
                "ref": "80-19011",
                "name": "Light Green",
                "hex": "#18c7b1",
                "count": 5
            },
            {
                "symbol": "H",
                "ref": "80-15179",
                "name": "Evergreen",
                "hex": "#305545",
                "count": 18
            },
            {
                "symbol": "J",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 12
            },
            {
                "symbol": "K",
                "ref": "80-19010",
                "name": "Dark Green",
                "hex": "#007b4e",
                "count": 1
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/ender_pearl.png",
            "description": "Based on the original Ender Pearl inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-ender-pearl-1-21-1/preview.png",
            "grid": "/patterns/minecraft-ender-pearl-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-ender-pearl-1-21-1/pixels.png",
            "project": "/patterns/minecraft-ender-pearl-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-ender-pearl-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-ender-eye-1-21-1",
        "slug": "minecraft/eye-of-ender",
        "title": "Eye of Ender",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A green Minecraft Eye of Ender with a dark pupil and teal outer edge. Download its free printable bead pattern.",
        "beads": 121,
        "colorCount": 12,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 13,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15247",
                "name": "Forest",
                "hex": "#005d57",
                "count": 19
            },
            {
                "symbol": "B",
                "ref": "80-15179",
                "name": "Evergreen",
                "hex": "#305545",
                "count": 21
            },
            {
                "symbol": "C",
                "ref": "80-15218",
                "name": "Teal",
                "hex": "#047f8a",
                "count": 13
            },
            {
                "symbol": "D",
                "ref": "80-15254",
                "name": "Sage",
                "hex": "#9aa98e",
                "count": 19
            },
            {
                "symbol": "E",
                "ref": "80-15240",
                "name": "Mint",
                "hex": "#b3eed5",
                "count": 2
            },
            {
                "symbol": "F",
                "ref": "80-15214",
                "name": "Sherbet",
                "hex": "#d8e47c",
                "count": 3
            },
            {
                "symbol": "G",
                "ref": "80-19061",
                "name": "Kiwi Lime",
                "hex": "#69b845",
                "count": 4
            },
            {
                "symbol": "H",
                "ref": "80-19080",
                "name": "Green",
                "hex": "#4dab64",
                "count": 14
            },
            {
                "symbol": "J",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 3
            },
            {
                "symbol": "K",
                "ref": "80-15199",
                "name": "Shamrock",
                "hex": "#008f53",
                "count": 5
            },
            {
                "symbol": "L",
                "ref": "80-15261",
                "name": "Dark Spruce",
                "hex": "#14313b",
                "count": 15
            },
            {
                "symbol": "M",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 3
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/ender_eye.png",
            "description": "Based on the original Eye of Ender inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-ender-eye-1-21-1/preview.png",
            "grid": "/patterns/minecraft-ender-eye-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-ender-eye-1-21-1/pixels.png",
            "project": "/patterns/minecraft-ender-eye-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-ender-eye-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-totem-of-undying-1-21-1",
        "slug": "minecraft/totem-of-undying",
        "title": "Totem of Undying",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A golden Minecraft Totem of Undying with green eyes and outstretched arms. Download its free printable bead pattern.",
        "beads": 126,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 14,
        "motifHeight": 15,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 26
            },
            {
                "symbol": "B",
                "ref": "80-15214",
                "name": "Sherbet",
                "hex": "#d8e47c",
                "count": 17
            },
            {
                "symbol": "C",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 30
            },
            {
                "symbol": "D",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 6
            },
            {
                "symbol": "E",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 7
            },
            {
                "symbol": "F",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 20
            },
            {
                "symbol": "G",
                "ref": "80-19053",
                "name": "Pastel Green",
                "hex": "#6dcc94",
                "count": 4
            },
            {
                "symbol": "H",
                "ref": "80-19061",
                "name": "Kiwi Lime",
                "hex": "#69b845",
                "count": 2
            },
            {
                "symbol": "J",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 14
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/totem_of_undying.png",
            "description": "Based on the original Totem of Undying inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-totem-of-undying-1-21-1/preview.png",
            "grid": "/patterns/minecraft-totem-of-undying-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-totem-of-undying-1-21-1/pixels.png",
            "project": "/patterns/minecraft-totem-of-undying-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-totem-of-undying-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-netherite-pickaxe-1-21-1",
        "slug": "minecraft/netherite-pickaxe",
        "title": "Netherite Pickaxe",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A dark Minecraft Netherite Pickaxe with a brown handle and broad metal head. Download its free printable bead pattern.",
        "beads": 68,
        "colorCount": 11,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 13,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15248",
                "name": "Eggplant",
                "hex": "#6f3255",
                "count": 9
            },
            {
                "symbol": "B",
                "ref": "80-15260",
                "name": "Stone",
                "hex": "#988c8c",
                "count": 6
            },
            {
                "symbol": "C",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 2
            },
            {
                "symbol": "D",
                "ref": "80-19092",
                "name": "Dark Grey",
                "hex": "#585c61",
                "count": 4
            },
            {
                "symbol": "E",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 10
            },
            {
                "symbol": "F",
                "ref": "80-15201",
                "name": "Midnight",
                "hex": "#2f3c55",
                "count": 25
            },
            {
                "symbol": "G",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 3
            },
            {
                "symbol": "H",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 4
            },
            {
                "symbol": "J",
                "ref": "80-19096",
                "name": "Cranapple",
                "hex": "#843947",
                "count": 2
            },
            {
                "symbol": "K",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 2
            },
            {
                "symbol": "L",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 1
            }
        ],
        "notes": [
            "Thin one-bead connections at row 10, column 13; row 13, column 17; row 14, column 16; row 15, column 15; row 16, column 14; row 17, column 13; row 17, column 20; row 18, column 12; row 19, column 11; row 20, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/netherite_pickaxe.png",
            "description": "Based on the original Netherite Pickaxe inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-netherite-pickaxe-1-21-1/preview.png",
            "grid": "/patterns/minecraft-netherite-pickaxe-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-netherite-pickaxe-1-21-1/pixels.png",
            "project": "/patterns/minecraft-netherite-pickaxe-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-netherite-pickaxe-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-netherite-sword-1-21-1",
        "slug": "minecraft/netherite-sword",
        "title": "Netherite Sword",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A Minecraft Netherite Sword with a dark blade and a diagonal handle. Download its free printable bead pattern.",
        "beads": 84,
        "colorCount": 13,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15248",
                "name": "Eggplant",
                "hex": "#6f3255",
                "count": 21
            },
            {
                "symbol": "B",
                "ref": "80-15260",
                "name": "Stone",
                "hex": "#988c8c",
                "count": 6
            },
            {
                "symbol": "C",
                "ref": "80-15201",
                "name": "Midnight",
                "hex": "#2f3c55",
                "count": 22
            },
            {
                "symbol": "D",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 6
            },
            {
                "symbol": "E",
                "ref": "80-15258",
                "name": "Mulberry",
                "hex": "#714875",
                "count": 6
            },
            {
                "symbol": "F",
                "ref": "80-19092",
                "name": "Dark Grey",
                "hex": "#585c61",
                "count": 4
            },
            {
                "symbol": "G",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 7
            },
            {
                "symbol": "H",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 6
            },
            {
                "symbol": "J",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 2
            },
            {
                "symbol": "K",
                "ref": "80-19096",
                "name": "Cranapple",
                "hex": "#843947",
                "count": 1
            },
            {
                "symbol": "L",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 1
            },
            {
                "symbol": "M",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 1
            },
            {
                "symbol": "N",
                "ref": "80-15261",
                "name": "Dark Spruce",
                "hex": "#14313b",
                "count": 1
            }
        ],
        "notes": [
            "Thin one-bead connections at row 14, column 10; row 18, column 11; row 19, column 10; row 19, column 15; row 20, column 9. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/netherite_sword.png",
            "description": "Based on the original Netherite Sword inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-netherite-sword-1-21-1/preview.png",
            "grid": "/patterns/minecraft-netherite-sword-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-netherite-sword-1-21-1/pixels.png",
            "project": "/patterns/minecraft-netherite-sword-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-netherite-sword-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-carrot-1-21-1",
        "slug": "minecraft/carrot",
        "title": "Carrot",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "Minecraft an orange Minecraft Carrot with green leaves in a diagonal design. Download its free printable bead pattern.",
        "beads": 96,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 14,
        "motifHeight": 14,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19061",
                "name": "Kiwi Lime",
                "hex": "#69b845",
                "count": 9
            },
            {
                "symbol": "B",
                "ref": "80-19080",
                "name": "Green",
                "hex": "#4dab64",
                "count": 11
            },
            {
                "symbol": "C",
                "ref": "80-19010",
                "name": "Dark Green",
                "hex": "#007b4e",
                "count": 16
            },
            {
                "symbol": "D",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 13
            },
            {
                "symbol": "E",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 8
            },
            {
                "symbol": "F",
                "ref": "80-19004",
                "name": "Orange",
                "hex": "#eb7b31",
                "count": 13
            },
            {
                "symbol": "G",
                "ref": "80-15179",
                "name": "Evergreen",
                "hex": "#305545",
                "count": 5
            },
            {
                "symbol": "H",
                "ref": "80-19020",
                "name": "Rust",
                "hex": "#995043",
                "count": 11
            },
            {
                "symbol": "J",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 7
            },
            {
                "symbol": "K",
                "ref": "80-15274",
                "name": "Rich Butter",
                "hex": "#f6ca69",
                "count": 3
            }
        ],
        "notes": [
            "Thin one-bead connections at row 8, column 14; row 10, column 12; row 10, column 18; row 14, column 20; row 15, column 19. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/carrot.png",
            "description": "Based on the original Carrot inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-carrot-1-21-1/preview.png",
            "grid": "/patterns/minecraft-carrot-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-carrot-1-21-1/pixels.png",
            "project": "/patterns/minecraft-carrot-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-carrot-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-bread-1-21-1",
        "slug": "minecraft/bread",
        "title": "Bread",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A golden loaf of Minecraft Bread with a darker crust and a rounded top. Download its free printable bead pattern.",
        "beads": 138,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 14,
        "motifHeight": 15,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15220",
                "name": "Olive",
                "hex": "#696e31",
                "count": 27
            },
            {
                "symbol": "B",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 33
            },
            {
                "symbol": "C",
                "ref": "80-19090",
                "name": "Butterscotch",
                "hex": "#da9964",
                "count": 15
            },
            {
                "symbol": "D",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 42
            },
            {
                "symbol": "E",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 15
            },
            {
                "symbol": "F",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 4
            },
            {
                "symbol": "G",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 2
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/bread.png",
            "description": "Based on the original Bread inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-bread-1-21-1/preview.png",
            "grid": "/patterns/minecraft-bread-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-bread-1-21-1/pixels.png",
            "project": "/patterns/minecraft-bread-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-bread-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-cookie-1-21-1",
        "slug": "minecraft/cookie",
        "title": "Cookie",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A round chocolate-chip Minecraft Cookie with a golden edge. Download its free printable bead pattern.",
        "beads": 140,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 14,
        "motifHeight": 12,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 21
            },
            {
                "symbol": "B",
                "ref": "80-19020",
                "name": "Rust",
                "hex": "#995043",
                "count": 15
            },
            {
                "symbol": "C",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 6
            },
            {
                "symbol": "D",
                "ref": "80-19004",
                "name": "Orange",
                "hex": "#eb7b31",
                "count": 32
            },
            {
                "symbol": "E",
                "ref": "80-19090",
                "name": "Butterscotch",
                "hex": "#da9964",
                "count": 45
            },
            {
                "symbol": "F",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 6
            },
            {
                "symbol": "G",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 15
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/cookie.png",
            "description": "Based on the original Cookie inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-cookie-1-21-1/preview.png",
            "grid": "/patterns/minecraft-cookie-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-cookie-1-21-1/pixels.png",
            "project": "/patterns/minecraft-cookie-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-cookie-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-arrow-1-21-1",
        "slug": "minecraft/arrow",
        "title": "Arrow",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A diagonal Minecraft Arrow with a pointed tip and feathered tail. Download its free printable bead pattern.",
        "beads": 38,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 13,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 4
            },
            {
                "symbol": "B",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 1
            },
            {
                "symbol": "C",
                "ref": "80-15207",
                "name": "Charcoal",
                "hex": "#4f595a",
                "count": 6
            },
            {
                "symbol": "D",
                "ref": "80-15202",
                "name": "Robin's Egg",
                "hex": "#a9cdd5",
                "count": 3
            },
            {
                "symbol": "E",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 7
            },
            {
                "symbol": "F",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 7
            },
            {
                "symbol": "G",
                "ref": "80-15208",
                "name": "Toasted Marshmallow",
                "hex": "#dedace",
                "count": 4
            },
            {
                "symbol": "H",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 2
            },
            {
                "symbol": "J",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 4
            }
        ],
        "notes": [
            "Thin one-bead connections at row 12, column 17; row 12, column 19; row 13, column 16; row 13, column 17; row 14, column 15; row 14, column 16; row 15, column 14; row 15, column 15; row 16, column 13; row 16, column 14; row 17, column 12; row 17, column 13; row 18, column 12; row 20, column 10. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/arrow.png",
            "description": "Based on the original Arrow inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-arrow-1-21-1/preview.png",
            "grid": "/patterns/minecraft-arrow-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-arrow-1-21-1/pixels.png",
            "project": "/patterns/minecraft-arrow-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-arrow-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-trident-1-21-1",
        "slug": "minecraft/trident",
        "title": "Trident",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A Minecraft Trident with three pale prongs and a long teal handle. Download its free printable bead pattern.",
        "beads": 66,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 15,
        "motifHeight": 15,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 8
            },
            {
                "symbol": "B",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 10
            },
            {
                "symbol": "C",
                "ref": "80-15208",
                "name": "Toasted Marshmallow",
                "hex": "#dedace",
                "count": 10
            },
            {
                "symbol": "D",
                "ref": "80-19092",
                "name": "Dark Grey",
                "hex": "#585c61",
                "count": 6
            },
            {
                "symbol": "E",
                "ref": "80-15247",
                "name": "Forest",
                "hex": "#005d57",
                "count": 11
            },
            {
                "symbol": "F",
                "ref": "80-19091",
                "name": "Parrot Green",
                "hex": "#009188",
                "count": 5
            },
            {
                "symbol": "G",
                "ref": "80-19010",
                "name": "Dark Green",
                "hex": "#007b4e",
                "count": 5
            },
            {
                "symbol": "H",
                "ref": "80-15179",
                "name": "Evergreen",
                "hex": "#305545",
                "count": 11
            }
        ],
        "notes": [
            "Thin one-bead connections at row 9, column 17; row 10, column 16; row 10, column 20; row 11, column 19; row 12, column 18; row 13, column 21; row 14, column 20; row 15, column 15; row 16, column 14; row 17, column 13; row 18, column 12; row 19, column 11; row 20, column 10; row 21, column 9. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/trident.png",
            "description": "Based on the original Trident inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-trident-1-21-1/preview.png",
            "grid": "/patterns/minecraft-trident-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-trident-1-21-1/pixels.png",
            "project": "/patterns/minecraft-trident-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-trident-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-book-1-21-1",
        "slug": "minecraft/book",
        "title": "Book",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A closed Minecraft Book with a brown cover and pale pages. Download its free printable bead pattern.",
        "beads": 152,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 14,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 24
            },
            {
                "symbol": "B",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 14
            },
            {
                "symbol": "C",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 46
            },
            {
                "symbol": "D",
                "ref": "80-15220",
                "name": "Olive",
                "hex": "#696e31",
                "count": 5
            },
            {
                "symbol": "E",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 21
            },
            {
                "symbol": "F",
                "ref": "80-19092",
                "name": "Dark Grey",
                "hex": "#585c61",
                "count": 1
            },
            {
                "symbol": "G",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 12
            },
            {
                "symbol": "H",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 9
            },
            {
                "symbol": "J",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 16
            },
            {
                "symbol": "K",
                "ref": "80-15208",
                "name": "Toasted Marshmallow",
                "hex": "#dedace",
                "count": 4
            }
        ],
        "notes": [
            "Thin one-bead connections at row 13, column 21. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/book.png",
            "description": "Based on the original Book inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-book-1-21-1/preview.png",
            "grid": "/patterns/minecraft-book-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-book-1-21-1/pixels.png",
            "project": "/patterns/minecraft-book-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-book-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-feather-1-21-1",
        "slug": "minecraft/feather",
        "title": "Feather",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A pale Minecraft Feather with a dark gray edge and a diagonal quill. Download its free printable bead pattern.",
        "beads": 65,
        "colorCount": 4,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 13,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15208",
                "name": "Toasted Marshmallow",
                "hex": "#dedace",
                "count": 28
            },
            {
                "symbol": "B",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 13
            },
            {
                "symbol": "C",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 16
            },
            {
                "symbol": "D",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 8
            }
        ],
        "notes": [
            "Thin one-bead connections at row 10, column 19; row 12, column 20; row 15, column 19; row 16, column 13; row 18, column 11; row 18, column 17; row 20, column 10; row 20, column 11. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/feather.png",
            "description": "Based on the original Feather inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-feather-1-21-1/preview.png",
            "grid": "/patterns/minecraft-feather-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-feather-1-21-1/pixels.png",
            "project": "/patterns/minecraft-feather-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-feather-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-amethyst-shard-1-21-1",
        "slug": "minecraft/amethyst-shard",
        "title": "Amethyst Shard",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A purple Minecraft Amethyst Shard with a pointed tip and bright crystal highlights. Download its free printable bead pattern.",
        "beads": 89,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 12,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19007",
                "name": "Purple",
                "hex": "#684b86",
                "count": 24
            },
            {
                "symbol": "B",
                "ref": "80-19079",
                "name": "Light Pink",
                "hex": "#e1bcce",
                "count": 10
            },
            {
                "symbol": "C",
                "ref": "80-15243",
                "name": "Grape",
                "hex": "#503b9c",
                "count": 19
            },
            {
                "symbol": "D",
                "ref": "80-15215",
                "name": "Mist",
                "hex": "#93b0bd",
                "count": 11
            },
            {
                "symbol": "E",
                "ref": "80-19002",
                "name": "Creme",
                "hex": "#e1e2bb",
                "count": 3
            },
            {
                "symbol": "F",
                "ref": "80-15182",
                "name": "Lavender",
                "hex": "#af9fce",
                "count": 7
            },
            {
                "symbol": "G",
                "ref": "80-19054",
                "name": "Pastel Lavender",
                "hex": "#937fbf",
                "count": 15
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/amethyst_shard.png",
            "description": "Based on the original Amethyst Shard inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-amethyst-shard-1-21-1/preview.png",
            "grid": "/patterns/minecraft-amethyst-shard-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-amethyst-shard-1-21-1/pixels.png",
            "project": "/patterns/minecraft-amethyst-shard-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-amethyst-shard-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-slime-ball-1-21-1",
        "slug": "minecraft/slimeball",
        "title": "Slimeball",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A rounded green Minecraft Slimeball with pale highlights and a dark edge. Download its free printable bead pattern.",
        "beads": 112,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 12,
        "motifHeight": 12,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19010",
                "name": "Dark Green",
                "hex": "#007b4e",
                "count": 14
            },
            {
                "symbol": "B",
                "ref": "80-19080",
                "name": "Green",
                "hex": "#4dab64",
                "count": 14
            },
            {
                "symbol": "C",
                "ref": "80-19061",
                "name": "Kiwi Lime",
                "hex": "#69b845",
                "count": 22
            },
            {
                "symbol": "D",
                "ref": "80-15179",
                "name": "Evergreen",
                "hex": "#305545",
                "count": 18
            },
            {
                "symbol": "E",
                "ref": "80-15241",
                "name": "Sour Apple",
                "hex": "#a3de6f",
                "count": 15
            },
            {
                "symbol": "F",
                "ref": "80-15220",
                "name": "Olive",
                "hex": "#696e31",
                "count": 11
            },
            {
                "symbol": "G",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 1
            },
            {
                "symbol": "H",
                "ref": "80-15240",
                "name": "Mint",
                "hex": "#b3eed5",
                "count": 3
            },
            {
                "symbol": "J",
                "ref": "80-15199",
                "name": "Shamrock",
                "hex": "#008f53",
                "count": 14
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/slime_ball.png",
            "description": "Based on the original Slimeball inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-slime-ball-1-21-1/preview.png",
            "grid": "/patterns/minecraft-slime-ball-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-slime-ball-1-21-1/pixels.png",
            "project": "/patterns/minecraft-slime-ball-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-slime-ball-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-honey-bottle-1-21-1",
        "slug": "minecraft/honey-bottle",
        "title": "Honey Bottle",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A small Minecraft Honey Bottle with a red cap and a golden center. Download its free printable bead pattern.",
        "beads": 78,
        "colorCount": 12,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 9,
        "motifHeight": 13,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 2
            },
            {
                "symbol": "B",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 3
            },
            {
                "symbol": "C",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 5
            },
            {
                "symbol": "D",
                "ref": "80-19033",
                "name": "Peach",
                "hex": "#e9bfb9",
                "count": 3
            },
            {
                "symbol": "E",
                "ref": "80-15202",
                "name": "Robin's Egg",
                "hex": "#a9cdd5",
                "count": 9
            },
            {
                "symbol": "F",
                "ref": "80-19020",
                "name": "Rust",
                "hex": "#995043",
                "count": 1
            },
            {
                "symbol": "G",
                "ref": "80-19009",
                "name": "Light Blue",
                "hex": "#278cc9",
                "count": 16
            },
            {
                "symbol": "H",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 11
            },
            {
                "symbol": "J",
                "ref": "80-15269",
                "name": "Lemon",
                "hex": "#f6d901",
                "count": 8
            },
            {
                "symbol": "K",
                "ref": "80-19004",
                "name": "Orange",
                "hex": "#eb7b31",
                "count": 11
            },
            {
                "symbol": "L",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 6
            },
            {
                "symbol": "M",
                "ref": "80-19093",
                "name": "Blueberry Creme",
                "hex": "#85a8e3",
                "count": 3
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/honey_bottle.png",
            "description": "Based on the original Honey Bottle inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-honey-bottle-1-21-1/preview.png",
            "grid": "/patterns/minecraft-honey-bottle-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-honey-bottle-1-21-1/pixels.png",
            "project": "/patterns/minecraft-honey-bottle-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-honey-bottle-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-milk-bucket-1-21-1",
        "slug": "minecraft/milk-bucket",
        "title": "Milk Bucket",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A gray Minecraft Milk Bucket with a white surface and a dark rim. Download its free printable bead pattern.",
        "beads": 146,
        "colorCount": 10,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 12,
        "motifHeight": 14,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 48
            },
            {
                "symbol": "B",
                "ref": "80-15252",
                "name": "Slate Blue",
                "hex": "#5e6d7b",
                "count": 4
            },
            {
                "symbol": "C",
                "ref": "80-15260",
                "name": "Stone",
                "hex": "#988c8c",
                "count": 4
            },
            {
                "symbol": "D",
                "ref": "80-15202",
                "name": "Robin's Egg",
                "hex": "#a9cdd5",
                "count": 6
            },
            {
                "symbol": "E",
                "ref": "80-19058",
                "name": "Toothpaste",
                "hex": "#96d1d4",
                "count": 5
            },
            {
                "symbol": "F",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 16
            },
            {
                "symbol": "G",
                "ref": "80-15208",
                "name": "Toasted Marshmallow",
                "hex": "#dedace",
                "count": 18
            },
            {
                "symbol": "H",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 18
            },
            {
                "symbol": "J",
                "ref": "80-19092",
                "name": "Dark Grey",
                "hex": "#585c61",
                "count": 13
            },
            {
                "symbol": "K",
                "ref": "80-19017",
                "name": "Grey",
                "hex": "#909497",
                "count": 14
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/milk_bucket.png",
            "description": "Based on the original Milk Bucket inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-milk-bucket-1-21-1/preview.png",
            "grid": "/patterns/minecraft-milk-bucket-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-milk-bucket-1-21-1/pixels.png",
            "project": "/patterns/minecraft-milk-bucket-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-milk-bucket-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-redstone-1-21-1",
        "slug": "minecraft/redstone-dust",
        "title": "Redstone Dust",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A small pile of Minecraft Redstone Dust with bright red highlights. Download its free printable bead pattern.",
        "beads": 88,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 12,
        "motifHeight": 11,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19096",
                "name": "Cranapple",
                "hex": "#843947",
                "count": 12
            },
            {
                "symbol": "B",
                "ref": "80-15961",
                "name": "Cherry",
                "hex": "#9d2b3a",
                "count": 9
            },
            {
                "symbol": "C",
                "ref": "80-19005",
                "name": "Red",
                "hex": "#b0353c",
                "count": 18
            },
            {
                "symbol": "D",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 8
            },
            {
                "symbol": "E",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 19
            },
            {
                "symbol": "F",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 17
            },
            {
                "symbol": "G",
                "ref": "80-15248",
                "name": "Eggplant",
                "hex": "#6f3255",
                "count": 5
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/redstone.png",
            "description": "Based on the original Redstone Dust inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-redstone-1-21-1/preview.png",
            "grid": "/patterns/minecraft-redstone-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-redstone-1-21-1/pixels.png",
            "project": "/patterns/minecraft-redstone-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-redstone-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-quartz-1-21-1",
        "slug": "minecraft/nether-quartz",
        "title": "Nether Quartz",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A pale Minecraft Nether Quartz crystal with angular edges and shaded facets. Download its free printable bead pattern.",
        "beads": 156,
        "colorCount": 9,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 14,
        "motifHeight": 15,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15205",
                "name": "Fawn",
                "hex": "#c9a385",
                "count": 31
            },
            {
                "symbol": "B",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 13
            },
            {
                "symbol": "C",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 11
            },
            {
                "symbol": "D",
                "ref": "80-15260",
                "name": "Stone",
                "hex": "#988c8c",
                "count": 19
            },
            {
                "symbol": "E",
                "ref": "80-19002",
                "name": "Creme",
                "hex": "#e1e2bb",
                "count": 10
            },
            {
                "symbol": "F",
                "ref": "80-15208",
                "name": "Toasted Marshmallow",
                "hex": "#dedace",
                "count": 12
            },
            {
                "symbol": "G",
                "ref": "80-15239",
                "name": "Mocha",
                "hex": "#c8b693",
                "count": 20
            },
            {
                "symbol": "H",
                "ref": "80-19035",
                "name": "Tan",
                "hex": "#c5ac90",
                "count": 20
            },
            {
                "symbol": "J",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 20
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/item/quartz.png",
            "description": "Based on the original Nether Quartz inventory item texture from Minecraft Java Edition 1.21.1."
        },
        "assets": {
            "preview": "/patterns/minecraft-quartz-1-21-1/preview.png",
            "grid": "/patterns/minecraft-quartz-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-quartz-1-21-1/pixels.png",
            "project": "/patterns/minecraft-quartz-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-quartz-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "minecraft-carved-pumpkin-1-21-1",
        "slug": "minecraft/carved-pumpkin",
        "title": "Carved Pumpkin",
        "collectionId": "minecraft",
        "version": "Java Edition 1.21.1",
        "description": "A square Minecraft Carved Pumpkin face with dark eyes and a jagged grin. Download its free printable bead pattern.",
        "beads": 256,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19004",
                "name": "Orange",
                "hex": "#eb7b31",
                "count": 38
            },
            {
                "symbol": "B",
                "ref": "80-19020",
                "name": "Rust",
                "hex": "#995043",
                "count": 51
            },
            {
                "symbol": "C",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 3
            },
            {
                "symbol": "D",
                "ref": "80-15249",
                "name": "Honey",
                "hex": "#da8c2c",
                "count": 55
            },
            {
                "symbol": "E",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 16
            },
            {
                "symbol": "F",
                "ref": "80-15262",
                "name": "Cocoa",
                "hex": "#392928",
                "count": 32
            },
            {
                "symbol": "G",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 50
            },
            {
                "symbol": "H",
                "ref": "80-15250",
                "name": "Gingerbread",
                "hex": "#7e5446",
                "count": 11
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Minecraft asset archive",
            "url": "https://github.com/InventivetalentDev/minecraft-assets/blob/aef047f783f44424a591eeecf6b230d5bb0c8095/assets/minecraft/textures/block/carved_pumpkin.png",
            "description": "Based on the original carved pumpkin front-face block texture from Minecraft Java Edition 1.21.1, shown as a flat square."
        },
        "assets": {
            "preview": "/patterns/minecraft-carved-pumpkin-1-21-1/preview.png",
            "grid": "/patterns/minecraft-carved-pumpkin-1-21-1/grid.png",
            "pixels": "/patterns/minecraft-carved-pumpkin-1-21-1/pixels.png",
            "project": "/patterns/minecraft-carved-pumpkin-1-21-1/pattern.bead-pattern.json",
            "pdf": "/patterns/minecraft-carved-pumpkin-1-21-1/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-small-mario",
        "slug": "super-mario/mario",
        "title": "Mario",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make Small Mario in his original Super Mario Bros. standing pose, with a red cap and overalls. Download its free printable bead pattern.",
        "beads": 143,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 12,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 45
            },
            {
                "symbol": "B",
                "ref": "80-15220",
                "name": "Olive",
                "hex": "#696e31",
                "count": 54
            },
            {
                "symbol": "C",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 44
            }
        ],
        "notes": [
            "Thin one-bead connections at row 8, column 17; row 8, column 18; row 11, column 19; row 22, column 10; row 22, column 19. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Smallmario.png",
            "description": "The Super Mario Wiki file identifies this as Small Mario from Super Mario Bros. on the NES. The native standing sprite is preserved."
        },
        "assets": {
            "preview": "/patterns/smb-small-mario/preview.png",
            "grid": "/patterns/smb-small-mario/grid.png",
            "pixels": "/patterns/smb-small-mario/pixels.png",
            "project": "/patterns/smb-small-mario/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-small-mario/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-small-luigi",
        "slug": "super-mario/luigi",
        "title": "Luigi",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make Small Luigi from Super Mario Bros., with his original white cap and overalls and green clothing. Download its free printable bead pattern.",
        "beads": 143,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 12,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 45
            },
            {
                "symbol": "B",
                "ref": "80-15199",
                "name": "Shamrock",
                "hex": "#008f53",
                "count": 54
            },
            {
                "symbol": "C",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 44
            }
        ],
        "notes": [
            "Thin one-bead connections at row 8, column 17; row 8, column 18; row 11, column 19; row 22, column 10; row 22, column 19. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Small_Luigi_Sprite.png",
            "description": "The Super Mario Wiki identifies this as Small Luigi from Super Mario Bros. on the NES. Its file information records Mario's native shape rendered with Luigi's game palette; the current file history specifies the Nestopia palette."
        },
        "assets": {
            "preview": "/patterns/smb-small-luigi/preview.png",
            "grid": "/patterns/smb-small-luigi/grid.png",
            "pixels": "/patterns/smb-small-luigi/pixels.png",
            "project": "/patterns/smb-small-luigi/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-small-luigi/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-green-koopa-troopa",
        "slug": "super-mario/green-koopa-troopa",
        "title": "Green Koopa Troopa",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make a Green Koopa Troopa from the original Super Mario Bros., facing left with a green shell and long neck. Download its free printable bead pattern.",
        "beads": 213,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 23,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 44
            },
            {
                "symbol": "B",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 96
            },
            {
                "symbol": "C",
                "ref": "80-15199",
                "name": "Shamrock",
                "hex": "#008f53",
                "count": 73
            }
        ],
        "notes": [
            "Thin one-bead connections at row 5, column 10; row 16, column 8; row 19, column 10; row 23, column 21; row 26, column 9; row 26, column 21. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Green_Koopa_Troopa_Sprite.png",
            "description": "The Super Mario Wiki identifies this green Koopa Troopa sprite as an extract from a Super Mario Bros. NES World 2-1 screenshot."
        },
        "assets": {
            "preview": "/patterns/smb-green-koopa-troopa/preview.png",
            "grid": "/patterns/smb-green-koopa-troopa/grid.png",
            "pixels": "/patterns/smb-green-koopa-troopa/pixels.png",
            "project": "/patterns/smb-green-koopa-troopa/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-green-koopa-troopa/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-red-cheep-cheep",
        "slug": "super-mario/red-cheep-cheep",
        "title": "Red Cheep Cheep",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make a Red Cheep Cheep from Super Mario Bros., with its round body, pale face and small fins. Download its free printable bead pattern.",
        "beads": 180,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 36
            },
            {
                "symbol": "B",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 70
            },
            {
                "symbol": "C",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 74
            }
        ],
        "notes": [
            "Thin one-bead connections at row 7, column 11; row 16, column 8; row 18, column 22; row 20, column 9; row 21, column 20. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Sprite_Cheep_Cheep_(Red).png",
            "description": "The Super Mario Wiki identifies this as a red Cheep Cheep sprite from Super Mario Bros. on the NES, isolated from a game screenshot."
        },
        "assets": {
            "preview": "/patterns/smb-red-cheep-cheep/preview.png",
            "grid": "/patterns/smb-red-cheep-cheep/grid.png",
            "pixels": "/patterns/smb-red-cheep-cheep/pixels.png",
            "project": "/patterns/smb-red-cheep-cheep/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-red-cheep-cheep/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-bullet-bill",
        "slug": "super-mario/bullet-bill",
        "title": "Bullet Bill",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make the left-facing Bullet Bill from Super Mario Bros., keeping its rounded nose, eye and clenched hand. Download its free printable bead pattern.",
        "beads": 188,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 14,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 143
            },
            {
                "symbol": "B",
                "ref": "80-15276",
                "name": "Carnation Pink",
                "hex": "#f8c7c9",
                "count": 32
            },
            {
                "symbol": "C",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 13
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:Bullet_Bill_Super_Mario_Bros.png",
            "description": "The Super Mario Wiki file identifies this as a Bullet Bill sprite from Super Mario Bros. on the NES. The isolated native sprite is preserved."
        },
        "assets": {
            "preview": "/patterns/smb-bullet-bill/preview.png",
            "grid": "/patterns/smb-bullet-bill/grid.png",
            "pixels": "/patterns/smb-bullet-bill/pixels.png",
            "project": "/patterns/smb-bullet-bill/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-bullet-bill/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-blooper",
        "slug": "super-mario/blooper",
        "title": "Blooper",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make the original Super Mario Bros. Blooper with its pointed head, dark eye band and long tentacles. Download its free printable bead pattern.",
        "beads": 218,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 24,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 154
            },
            {
                "symbol": "B",
                "ref": "80-15181",
                "name": "Light Grey",
                "hex": "#b3bab8",
                "count": 32
            },
            {
                "symbol": "C",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 32
            }
        ],
        "notes": [
            "Thin one-bead connections at row 9, column 8; row 9, column 21; row 22, column 10; row 22, column 19; row 23, column 10; row 23, column 19; row 24, column 10; row 24, column 13; row 24, column 16; row 24, column 19; row 25, column 13; row 25, column 16. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Sprite_Blooper.png",
            "description": "The Super Mario Wiki identifies this Blooper sprite as being from Super Mario Bros. on the NES, isolated from a game screenshot."
        },
        "assets": {
            "preview": "/patterns/smb-blooper/preview.png",
            "grid": "/patterns/smb-blooper/grid.png",
            "pixels": "/patterns/smb-blooper/pixels.png",
            "project": "/patterns/smb-blooper/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-blooper/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-piranha-plant",
        "slug": "super-mario/piranha-plant",
        "title": "Piranha Plant",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make the original Super Mario Bros. Piranha Plant with its green spotted head, open mouth and leafy stem. Download its free printable bead pattern.",
        "beads": 224,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 23,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-15199",
                "name": "Shamrock",
                "hex": "#008f53",
                "count": 114
            },
            {
                "symbol": "B",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 88
            },
            {
                "symbol": "C",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 22
            }
        ],
        "notes": [
            "Thin one-bead connections at row 5, column 9; row 5, column 10; row 5, column 19; row 5, column 20; row 7, column 11; row 7, column 18; row 9, column 12; row 9, column 17; row 20, column 8; row 20, column 21. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Sprite_Piranha_Plant.png",
            "description": "The Super Mario Wiki identifies this as a Piranha Plant sprite from Super Mario Bros. on the NES. Its file history references the Nestopia palette."
        },
        "assets": {
            "preview": "/patterns/smb-piranha-plant/preview.png",
            "grid": "/patterns/smb-piranha-plant/grid.png",
            "pixels": "/patterns/smb-piranha-plant/pixels.png",
            "project": "/patterns/smb-piranha-plant/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-piranha-plant/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-fire-flower",
        "slug": "super-mario/fire-flower",
        "title": "Fire Flower",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make a Fire Flower from the original Super Mario Bros., with layered petals and a green stem. Download its free printable bead pattern.",
        "beads": 162,
        "colorCount": 4,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 60
            },
            {
                "symbol": "B",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 28
            },
            {
                "symbol": "C",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 12
            },
            {
                "symbol": "D",
                "ref": "80-15199",
                "name": "Shamrock",
                "hex": "#008f53",
                "count": 62
            }
        ],
        "notes": [
            "Thin one-bead connections at row 16, column 8; row 16, column 21; row 21, column 12; row 21, column 13; row 21, column 16; row 21, column 17. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Sprite_Fire_Flower.png",
            "description": "The Super Mario Wiki identifies this as a Fire Flower sprite from Super Mario Bros. on the NES. This is one static color phase; the file history references the Nestopia palette."
        },
        "assets": {
            "preview": "/patterns/smb-fire-flower/preview.png",
            "grid": "/patterns/smb-fire-flower/grid.png",
            "pixels": "/patterns/smb-fire-flower/pixels.png",
            "project": "/patterns/smb-fire-flower/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-fire-flower/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-1up-mushroom",
        "slug": "super-mario/1-up-mushroom",
        "title": "1-Up Mushroom",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make the original Super Mario Bros. 1-Up Mushroom with its yellow cap, green spots and pale stem. Download its free printable bead pattern.",
        "beads": 176,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 95
            },
            {
                "symbol": "B",
                "ref": "80-15199",
                "name": "Shamrock",
                "hex": "#008f53",
                "count": 48
            },
            {
                "symbol": "C",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 33
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_1-up_Mushroom_Sprite.png",
            "description": "The Super Mario Wiki identifies this as the 1-Up Mushroom sprite from Super Mario Bros. on the NES. The file history references the Nestopia palette."
        },
        "assets": {
            "preview": "/patterns/smb-1up-mushroom/preview.png",
            "grid": "/patterns/smb-1up-mushroom/grid.png",
            "pixels": "/patterns/smb-1up-mushroom/pixels.png",
            "project": "/patterns/smb-1up-mushroom/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-1up-mushroom/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-question-block",
        "slug": "super-mario/question-block",
        "title": "Question Block",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. (NES)",
        "description": "Make a Question Block from the original Super Mario Bros., keeping its bold question mark and square border. Download its free printable bead pattern.",
        "beads": 254,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 56
            },
            {
                "symbol": "B",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 145
            },
            {
                "symbol": "C",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 53
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB_Qblock.png",
            "description": "The Super Mario Wiki identifies this as a Question Block sprite from Super Mario Bros. on the NES. One static color phase is retained, including the original transparent corner pixels."
        },
        "assets": {
            "preview": "/patterns/smb-question-block/preview.png",
            "grid": "/patterns/smb-question-block/grid.png",
            "pixels": "/patterns/smb-question-block/pixels.png",
            "project": "/patterns/smb-question-block/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-question-block/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-goomba-smb3",
        "slug": "super-mario/goomba",
        "title": "Goomba",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. 3 (NES)",
        "description": "Make a Goomba from Super Mario Bros. 3 with its scowling eyes, broad cap and small feet. Download its free printable bead pattern.",
        "beads": 185,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 94
            },
            {
                "symbol": "B",
                "ref": "80-19057",
                "name": "Cheddar",
                "hex": "#fbb146",
                "count": 62
            },
            {
                "symbol": "C",
                "ref": "80-15276",
                "name": "Carnation Pink",
                "hex": "#f8c7c9",
                "count": 29
            }
        ],
        "notes": [
            "Thin one-bead connections at row 9, column 11; row 9, column 18. Handle these areas carefully and consider a backing.",
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB3_Sprite_Goomba.png",
            "description": "The Super Mario Wiki identifies this as a Goomba sprite from Super Mario Bros. 3 on the NES. Its source is credited to The Spriters Resource."
        },
        "assets": {
            "preview": "/patterns/smb-goomba-smb3/preview.png",
            "grid": "/patterns/smb-goomba-smb3/grid.png",
            "pixels": "/patterns/smb-goomba-smb3/pixels.png",
            "project": "/patterns/smb-goomba-smb3/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-goomba-smb3/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-boo-smb3",
        "slug": "super-mario/boo",
        "title": "Boo",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. 3 (NES)",
        "description": "Make Boo from Super Mario Bros. 3, facing left with a round pale body and open mouth. Download its free printable bead pattern.",
        "beads": 217,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 133
            },
            {
                "symbol": "B",
                "ref": "80-15261",
                "name": "Dark Spruce",
                "hex": "#14313b",
                "count": 64
            },
            {
                "symbol": "C",
                "ref": "80-15211",
                "name": "Tomato",
                "hex": "#d14337",
                "count": 20
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB3Boo.png",
            "description": "The Super Mario Wiki identifies this as a Boo sprite from Super Mario Bros. 3 on the NES. The isolated native sprite is preserved."
        },
        "assets": {
            "preview": "/patterns/smb-boo-smb3/preview.png",
            "grid": "/patterns/smb-boo-smb3/grid.png",
            "pixels": "/patterns/smb-boo-smb3/pixels.png",
            "project": "/patterns/smb-boo-smb3/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-boo-smb3/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "smb-bob-omb-smb3",
        "slug": "super-mario/bob-omb",
        "title": "Bob-omb",
        "collectionId": "super-mario",
        "version": "Super Mario Bros. 3 (NES)",
        "description": "Make the Super Mario Bros. 3 Bob-omb with its round body, pale eyes, feet and winding key. Download its free printable bead pattern.",
        "beads": 190,
        "colorCount": 2,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 160
            },
            {
                "symbol": "B",
                "ref": "80-15276",
                "name": "Carnation Pink",
                "hex": "#f8c7c9",
                "count": 30
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "Super Mario Wiki",
            "url": "https://www.mariowiki.com/File:SMB3_Sprite_Bob-omb.png",
            "description": "The Super Mario Wiki identifies this as a Bob-omb sprite from Super Mario Bros. 3 on the NES. Its source is credited to The Spriters Resource."
        },
        "assets": {
            "preview": "/patterns/smb-bob-omb-smb3/preview.png",
            "grid": "/patterns/smb-bob-omb-smb3/grid.png",
            "pixels": "/patterns/smb-bob-omb-smb3/pixels.png",
            "project": "/patterns/smb-bob-omb-smb3/pattern.bead-pattern.json",
            "pdf": "/patterns/smb-bob-omb-smb3/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "kirby-waddle-dee-adventure",
        "slug": "kirby/waddle-dee",
        "title": "Waddle Dee",
        "collectionId": "kirby",
        "version": "Kirby’s Adventure (NES)",
        "description": "Make Waddle Dee in the pink shades of Kirby’s Adventure, with its round face and little feet. Download its free printable bead pattern.",
        "beads": 212,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 78
            },
            {
                "symbol": "B",
                "ref": "80-15272",
                "name": "Coral",
                "hex": "#ff9a8b",
                "count": 84
            },
            {
                "symbol": "C",
                "ref": "80-15276",
                "name": "Carnation Pink",
                "hex": "#f8c7c9",
                "count": 50
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "WiKirby",
            "url": "https://wikirby.com/wiki/File:KA_Waddle_Dee_sprite.png",
            "description": "WiKirby identifies this as a Waddle Dee sprite from Kirby’s Adventure on the NES and credits The Spriters Resource. This preserves that game’s pink palette layout."
        },
        "assets": {
            "preview": "/patterns/kirby-waddle-dee-adventure/preview.png",
            "grid": "/patterns/kirby-waddle-dee-adventure/grid.png",
            "pixels": "/patterns/kirby-waddle-dee-adventure/pixels.png",
            "project": "/patterns/kirby-waddle-dee-adventure/pattern.bead-pattern.json",
            "pdf": "/patterns/kirby-waddle-dee-adventure/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "kirby-waddle-doo-adventure",
        "slug": "kirby/waddle-doo",
        "title": "Waddle Doo",
        "collectionId": "kirby",
        "version": "Kirby’s Adventure (NES)",
        "description": "Make Waddle Doo from Kirby’s Adventure, with its single large eye and round pink body. Download its free printable bead pattern.",
        "beads": 216,
        "colorCount": 3,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 16,
        "motifHeight": 16,
        "palette": [
            {
                "symbol": "A",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 35
            },
            {
                "symbol": "B",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 83
            },
            {
                "symbol": "C",
                "ref": "80-15242",
                "name": "Cotton Candy",
                "hex": "#f479b0",
                "count": 98
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.",
            "The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly."
        ],
        "source": {
            "label": "WiKirby",
            "url": "https://wikirby.com/wiki/File:KA_Waddle_Doo_sprite.png",
            "description": "WiKirby identifies this as a Waddle Doo sprite from Kirby’s Adventure on the NES and credits The Spriters Resource. The isolated native sprite is preserved."
        },
        "assets": {
            "preview": "/patterns/kirby-waddle-doo-adventure/preview.png",
            "grid": "/patterns/kirby-waddle-doo-adventure/grid.png",
            "pixels": "/patterns/kirby-waddle-doo-adventure/pixels.png",
            "project": "/patterns/kirby-waddle-doo-adventure/pattern.bead-pattern.json",
            "pdf": "/patterns/kirby-waddle-doo-adventure/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "capybara-potion",
        "slug": "potion-class-capybara",
        "title": "Potion Class Capybara",
        "collectionId": null,
        "version": "Original scene",
        "description": "A capybara witch brewing a potion in a cauldron for Halloween.",
        "beads": 371,
        "colorCount": 8,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 21,
        "motifHeight": 25,
        "palette": [
            {
                "symbol": "K",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 86
            },
            {
                "symbol": "V",
                "ref": "80-19007",
                "name": "Purple",
                "hex": "#684b86",
                "count": 94
            },
            {
                "symbol": "L",
                "ref": "80-15182",
                "name": "Lavender",
                "hex": "#af9fce",
                "count": 13
            },
            {
                "symbol": "B",
                "ref": "80-19012",
                "name": "Brown",
                "hex": "#674c44",
                "count": 39
            },
            {
                "symbol": "T",
                "ref": "80-19035",
                "name": "Tan",
                "hex": "#c5ac90",
                "count": 62
            },
            {
                "symbol": "D",
                "ref": "80-19021",
                "name": "Light Brown",
                "hex": "#936848",
                "count": 57
            },
            {
                "symbol": "G",
                "ref": "80-19053",
                "name": "Pastel Green",
                "hex": "#6dcc94",
                "count": 19
            },
            {
                "symbol": "Y",
                "ref": "80-19056",
                "name": "Pastel Yellow",
                "hex": "#e9e290",
                "count": 1
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate."
        ],
        "source": null,
        "assets": {
            "preview": "/patterns/capybara-potion/preview.png",
            "grid": "/patterns/capybara-potion/grid.png",
            "pixels": "/patterns/capybara-potion/pixels.png",
            "project": "/patterns/capybara-potion/pattern.bead-pattern.json",
            "pdf": "/patterns/capybara-potion/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    },
    {
        "id": "ghost-cat-pumpkin",
        "slug": "pumpkin-hug-ghost-cat",
        "title": "Pumpkin Hug Ghost Cat",
        "collectionId": null,
        "version": "Original scene",
        "description": "A Halloween ghost cat hugging an orange pumpkin.",
        "beads": 408,
        "colorCount": 7,
        "gridWidth": 29,
        "gridHeight": 29,
        "motifWidth": 23,
        "motifHeight": 23,
        "palette": [
            {
                "symbol": "K",
                "ref": "80-19018",
                "name": "Black",
                "hex": "#323234",
                "count": 129
            },
            {
                "symbol": "W",
                "ref": "80-19001",
                "name": "White",
                "hex": "#eaefee",
                "count": 193
            },
            {
                "symbol": "P",
                "ref": "80-15203",
                "name": "Flamingo",
                "hex": "#f2afb7",
                "count": 10
            },
            {
                "symbol": "S",
                "ref": "80-15202",
                "name": "Robin's Egg",
                "hex": "#a9cdd5",
                "count": 19
            },
            {
                "symbol": "G",
                "ref": "80-19053",
                "name": "Pastel Green",
                "hex": "#6dcc94",
                "count": 5
            },
            {
                "symbol": "O",
                "ref": "80-19004",
                "name": "Orange",
                "hex": "#eb7b31",
                "count": 45
            },
            {
                "symbol": "R",
                "ref": "80-15212",
                "name": "Spice",
                "hex": "#d9593a",
                "count": 7
            }
        ],
        "notes": [
            "Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.",
            "Print the PDF at 100% / Actual size and check its 50 mm scale line before use.",
            "This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate."
        ],
        "source": null,
        "assets": {
            "preview": "/patterns/ghost-cat-pumpkin/preview.png",
            "grid": "/patterns/ghost-cat-pumpkin/grid.png",
            "pixels": "/patterns/ghost-cat-pumpkin/pixels.png",
            "project": "/patterns/ghost-cat-pumpkin/pattern.bead-pattern.json",
            "pdf": "/patterns/ghost-cat-pumpkin/pattern.pdf"
        },
        "updatedAt": "2026-09-22"
    }
];

export function getPatternBySlug(slug: string): Pattern | undefined {
    return patterns.find((pattern) => pattern.slug === slug);
}

export function getPatternById(id: string): Pattern | undefined {
    return patterns.find((pattern) => pattern.id === id);
}

export function getCollectionBySlug(slug: string): PatternCollection | undefined {
    return patternCollections.find((collection) => collection.slug === slug);
}

export function getPatternsForCollection(id: string): Pattern[] {
    return patterns.filter((pattern) => pattern.collectionId === id);
}

export function getPatternHref(pattern: Pattern): string {
    return '/patterns/' + pattern.slug;
}

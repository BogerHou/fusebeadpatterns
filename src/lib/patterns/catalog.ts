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

import { BannerError, exactKeys, plainRecord, renderBanner, validateBanner, validateDye, type BannerDesign, type RgbaImage } from './core';
import type { DyeId } from './data';
import type { PatternId } from './geometry';

export type LetterSpec = { text: string; base: DyeId; ink: DyeId };
export type LetterBanner = { character: string; position: number; design: BannerDesign | null; approximate: boolean; panel: number; panelCount: number };
type RecipePanel = { baseInk: boolean; layers: readonly { pattern: PatternId; ink: boolean }[] };
type LetterRecipe = RecipePanel & { approximate: boolean; additionalPanels?: readonly RecipePanel[] };
export const LETTER_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// Independently composed from ordinary geometric loom operations. Some glyphs
// use the letter-color base and background-color dye; actual materials follow
// the resulting design, not the two user-facing color roles. Some glyphs use two adjacent flags for legibility.
const presets: Record<string, LetterRecipe> =
{
    "A": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_right",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "B": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            }
        ],
        "additionalPanels": [
            {
                "baseInk": false,
                "layers": [
                    {
                        "pattern": "cross",
                        "ink": true
                    },
                    {
                        "pattern": "stripe_middle",
                        "ink": true
                    },
                    {
                        "pattern": "half_vertical_right",
                        "ink": false
                    }
                ]
            }
        ],
        "approximate": true
    },
    "C": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "D": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            }
        ],
        "additionalPanels": [
            {
                "baseInk": false,
                "layers": [
                    {
                        "pattern": "cross",
                        "ink": true
                    },
                    {
                        "pattern": "half_vertical_right",
                        "ink": false
                    }
                ]
            }
        ],
        "approximate": true
    },
    "E": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "F": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "G": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            }
        ],
        "approximate": true,
        "additionalPanels": [
            {
                "baseInk": false,
                "layers": [
                    {
                        "pattern": "stripe_top",
                        "ink": true
                    },
                    {
                        "pattern": "stripe_bottom",
                        "ink": true
                    },
                    {
                        "pattern": "stripe_middle",
                        "ink": true
                    },
                    {
                        "pattern": "stripe_right",
                        "ink": true
                    },
                    {
                        "pattern": "half_horizontal",
                        "ink": false
                    },
                    {
                        "pattern": "stripe_top",
                        "ink": true
                    }
                ]
            }
        ]
    },
    "H": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_right",
                "ink": true
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "I": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_center",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "J": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_right",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "K": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "cross",
                "ink": true
            },
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": true
    },
    "L": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "M": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_downright",
                "ink": true
            }
        ],
        "approximate": true,
        "additionalPanels": [
            {
                "baseInk": false,
                "layers": [
                    {
                        "pattern": "stripe_right",
                        "ink": true
                    },
                    {
                        "pattern": "stripe_downleft",
                        "ink": true
                    }
                ]
            }
        ]
    },
    "N": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_downright",
                "ink": true
            },
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_right",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "O": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "border",
                "ink": true
            }
        ],
        "approximate": true
    },
    "P": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_right",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "square_bottom_right",
                "ink": false
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "Q": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_downright",
                "ink": true
            },
            {
                "pattern": "half_horizontal",
                "ink": false
            },
            {
                "pattern": "border",
                "ink": true
            }
        ],
        "approximate": true
    },
    "R": {
        "baseInk": true,
        "layers": [
            {
                "pattern": "square_bottom_right",
                "ink": false
            },
            {
                "pattern": "stripe_downright",
                "ink": true
            },
            {
                "pattern": "rhombus",
                "ink": false
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": true
    },
    "S": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "border",
                "ink": true
            },
            {
                "pattern": "square_top_right",
                "ink": false
            },
            {
                "pattern": "square_bottom_left",
                "ink": false
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            }
        ],
        "approximate": true
    },
    "T": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_center",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "U": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_right",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "V": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_downright",
                "ink": true
            }
        ],
        "additionalPanels": [
            {
                "baseInk": false,
                "layers": [
                    {
                        "pattern": "stripe_downleft",
                        "ink": true
                    }
                ]
            }
        ],
        "approximate": false
    },
    "W": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_downleft",
                "ink": true
            }
        ],
        "approximate": true,
        "additionalPanels": [
            {
                "baseInk": false,
                "layers": [
                    {
                        "pattern": "stripe_right",
                        "ink": true
                    },
                    {
                        "pattern": "stripe_downright",
                        "ink": true
                    }
                ]
            }
        ]
    },
    "X": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "cross",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "Y": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "cross",
                "ink": true
            },
            {
                "pattern": "half_horizontal_bottom",
                "ink": false
            },
            {
                "pattern": "stripe_center",
                "ink": true
            },
            {
                "pattern": "triangle_top",
                "ink": false
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": true
    },
    "Z": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_downleft",
                "ink": true
            },
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "0": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "border",
                "ink": true
            },
            {
                "pattern": "circle",
                "ink": true
            }
        ],
        "approximate": true
    },
    "1": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_center",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "2": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "border",
                "ink": true
            },
            {
                "pattern": "square_top_left",
                "ink": false
            },
            {
                "pattern": "square_bottom_right",
                "ink": false
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            }
        ],
        "approximate": true
    },
    "3": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "stripe_bottom",
                "ink": true
            },
            {
                "pattern": "stripe_right",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "4": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_left",
                "ink": true
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "stripe_right",
                "ink": true
            },
            {
                "pattern": "square_bottom_left",
                "ink": false
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "5": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "border",
                "ink": true
            },
            {
                "pattern": "square_top_right",
                "ink": false
            },
            {
                "pattern": "square_bottom_left",
                "ink": false
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            },
            {
                "pattern": "square_top_left",
                "ink": true
            }
        ],
        "approximate": true
    },
    "6": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "border",
                "ink": true
            },
            {
                "pattern": "square_top_right",
                "ink": false
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            }
        ],
        "approximate": true
    },
    "7": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "stripe_top",
                "ink": true
            },
            {
                "pattern": "stripe_downleft",
                "ink": true
            },
            {
                "pattern": "border",
                "ink": false
            }
        ],
        "approximate": false
    },
    "8": {
        "baseInk": true,
        "layers": [
            {
                "pattern": "rhombus",
                "ink": false
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            }
        ],
        "approximate": true
    },
    "9": {
        "baseInk": false,
        "layers": [
            {
                "pattern": "border",
                "ink": true
            },
            {
                "pattern": "square_bottom_left",
                "ink": false
            },
            {
                "pattern": "stripe_middle",
                "ink": true
            }
        ],
        "approximate": true
    }
};
function freezePanel(panel: RecipePanel): RecipePanel {
    return Object.freeze({ baseInk: panel.baseInk, layers: Object.freeze(panel.layers.map(layer => Object.freeze({ ...layer }))) });
}
export const letterRecipes: Readonly<Record<string, LetterRecipe>> = Object.freeze(Object.fromEntries(
    Object.entries(presets).map(([character, recipe]) => [character, Object.freeze({ ...freezePanel(recipe), approximate: recipe.approximate,
        ...(recipe.additionalPanels ? { additionalPanels: Object.freeze(recipe.additionalPanels.map(freezePanel)) } : {}) })]),
));
function checked(input: LetterSpec): LetterSpec {
    if (!plainRecord(input) || !exactKeys(input, ['text', 'base', 'ink']) || typeof input.text !== 'string') throw new BannerError('INVALID_LETTERS');
    const characters = [...input.text];
    if (characters.length > 32) throw new BannerError('TEXT_TOO_LONG');
    // ASCII-only uppercasing avoids silently turning unsupported glyphs such as
    // German sharp-s into several different banners.
    const text = input.text.replace(/[a-z]/g, character => character.toUpperCase());
    if ([...text].some(character => character !== ' ' && !LETTER_CHARACTERS.includes(character))) throw new BannerError('UNSUPPORTED_CHARACTER');
    if (!text.trim()) throw new BannerError('EMPTY_TEXT');
    const base = validateDye(input.base), ink = validateDye(input.ink);
    if (base === ink) throw new BannerError('SAME_COLORS');
    return { text, base, ink };
}
export function buildLetterBanners(input: LetterSpec): LetterBanner[] {
    const spec = checked(input), banners: LetterBanner[] = [];
    [...spec.text].forEach((character, position) => {
        if (character === ' ') { banners.push({ character, position, design: null, approximate: false, panel: 1, panelCount: 1 }); return; }
        const recipe = letterRecipes[character], panels = [recipe, ...(recipe.additionalPanels ?? [])];
        panels.forEach((panel, index) => banners.push({ character, position, approximate: recipe.approximate, panel: index + 1, panelCount: panels.length,
            design: validateBanner({ base: panel.baseInk ? spec.ink : spec.base, layers: panel.layers.map(layer => ({ pattern: layer.pattern, color: layer.ink ? spec.ink : spec.base })) }) }));
    });
    return banners;
}
export function renderLetterStrip(input: LetterSpec): RgbaImage {
    const banners = buildLetterBanners(input), width = banners.reduce((sum, banner) => sum + (banner.design ? 20 : 10) + 2, -2), height = 40;
    const pixels = new Uint8ClampedArray(width * height * 4); let x = 0;
    for (const banner of banners) {
        if (banner.design) {
            const image = renderBanner(banner.design);
            for (let y = 0; y < height; y++) pixels.set(image.pixels.subarray(y * 80, (y + 1) * 80), (y * width + x) * 4);
        }
        x += (banner.design ? 20 : 10) + 2;
    }
    return { width, height, pixels };
}

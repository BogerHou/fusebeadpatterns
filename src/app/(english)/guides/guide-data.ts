export type GuideSection = {
    heading: string;
    body: string[];
    bullets?: string[];
    table?: {
        caption: string;
        headers: string[];
        rows: Array<{
            label: string;
            cells: string[];
        }>;
    };
    patternIds?: string[];
    links?: Array<{
        href: string;
        label: string;
        download?: boolean;
    }>;
    comparison?: Array<{
        src: string;
        alt: string;
        caption: string;
        width: number;
        height: number;
    }>;
    figure?: {
        src: string;
        alt: string;
        caption: string;
        width: number;
        height: number;
    };
};

export type GuidePage = {
    slug: string;
    updatedAt?: string;
    title: string;
    description: string;
    eyebrow: string;
    intro: string;
    sections: GuideSection[];
    relatedLinks: Array<{
        href: string;
        label: string;
    }>;
};

export const guidePages: GuidePage[] = [
    {
        slug: 'photo-to-perler-bead-pattern',
        updatedAt: '2026-10-08',
        title: 'How to Turn a Photo Into a Perler Bead Pattern',
        description:
            'Learn how to convert a photo into a printable Perler bead or fuse bead pattern, choose the right board size, and clean up the final design.',
        eyebrow: 'Photo Conversion',
        intro:
            'Photo-to-pattern tools work best when you treat the image like pixel art. The goal is not to preserve every detail, but to make a bead layout that still reads clearly after colors are reduced to real fuse bead palettes.',
        sections: [
            {
                heading: 'A real photo test: when more beads are not enough',
                body: [
                    'This dark cat photograph shows why you should inspect a conversion before buying beads. Both results below were generated with Perler Midi colors, without hand-painted corrections. The white chest remains recognizable, but much of the eyes, whiskers and dark face is lost at both sizes.',
                ],
                comparison: [
                    {
                        src: '/guides/photo-to-pattern/cat-source.jpg',
                        alt: 'Original photograph of a black-and-white cat with yellow-green eyes.',
                        caption: 'Original photo · 792 × 960 pixels. Anjeagotilla0920, Wikimedia Commons, CC0 1.0.',
                        width: 792,
                        height: 960,
                    },
                    {
                        src: '/guides/photo-to-pattern/cat-perler-29_grid.png',
                        alt: 'Actual automatic cat photo conversion on a 29 by 29 Perler bead grid.',
                        caption: '29 × 29 · 1 board · 667 beads · 11 colors.',
                        width: 580,
                        height: 580,
                    },
                    {
                        src: '/guides/photo-to-pattern/cat-perler-58_grid.png',
                        alt: 'Actual automatic cat photo conversion on a 58 by 58 Perler bead grid.',
                        caption: '58 × 58 · 4 boards · 2,726 beads · 13 colors.',
                        width: 1160,
                        height: 1160,
                    },
                ],
                links: [
                    { href: 'https://commons.wikimedia.org/wiki/File:TUXEDO_CAT.jpg', label: 'Photo source and author' },
                    { href: 'https://creativecommons.org/publicdomain/zero/1.0/', label: 'CC0 1.0 license' },
                ],
            },
            {
                heading: 'Try the same photo in the generator',
                body: [
                    'Save the source photo below, open the generator, and choose Upload Image. Select Perler Midi and the Midi 29 × 29 pegboard. Set Boards Wide and Boards Tall to 1 for the smaller result, or set both to 2 for the larger result.',
                    'For this comparison, all 103 Perler Midi colors were enabled. In Advanced, Matching was DeltaE CIE2000 and Dithering was None. Brightness, Contrast and Saturation were 100; Grayscale was 0; Center and Fit To Boards were checked. The source was not cropped or retouched.',
                    'The photo is taller than it is wide, so fitting it on a square board leaves empty columns. Those cells need no beads. The dark background inside the photograph is still part of the pattern: uploading a photo does not remove its background.',
                ],
                links: [
                    { href: '/guides/photo-to-pattern/cat-source.jpg', label: 'Save the source photo', download: true },
                    { href: '/#generator', label: 'Try the generator' },
                ],
            },
            {
                heading: 'Download and compare the actual results',
                body: [
                    'The 29 × 29 version uses 667 beads; the 58 × 58 version uses 2,726. The larger version adds a few highlights, but the eye colors and fine whiskers are still largely missing. Dark fur merges with the background. For this photo, the extra beads do not produce a clear pet portrait. Try a brighter source with a simpler background, crop closer to the face, or plan to redraw key features in the editor.',
                    'These are the files exported by the generator with Use Symbols In Printable Exports checked. The smaller PDF has a color list and one chart page. The larger PDF has an overview, a color list and four board charts. Match each chart symbol to its color code and quantity in the list. Grid PNG is useful for inspecting the layout. These exports are not verified life-size pegboard templates and do not include the library PDFs’ 50 mm calibration line.',
                    'These downloads are practice conversions, not finished portrait patterns. To work on either example, save its project file and choose Open Project in the generator or editor. Review the bead colors you own and clean up the eyes, background and outlines before making it. The examples have not been physically assembled or iron-tested.',
                ],
                links: [
                    { href: '/guides/photo-to-pattern/cat-perler-29.pdf', label: '29 × 29 PDF', download: true },
                    { href: '/guides/photo-to-pattern/cat-perler-29_grid.png', label: '29 × 29 grid PNG', download: true },
                    { href: '/guides/photo-to-pattern/cat-perler-29.bead-pattern.json', label: '29 × 29 editable project', download: true },
                    { href: '/guides/photo-to-pattern/cat-perler-58.pdf', label: '58 × 58 PDF', download: true },
                    { href: '/guides/photo-to-pattern/cat-perler-58_grid.png', label: '58 × 58 grid PNG', download: true },
                    { href: '/guides/photo-to-pattern/cat-perler-58.bead-pattern.json', label: '58 × 58 editable project', download: true },
                ],
            },
            {
                heading: 'A smooth illustration: compare the small details',
                body: [
                    'A simple illustration can still need cleanup. This original AI-generated rocket illustration has smooth edges and a transparent background. Both automatic conversions below use the same Perler Midi settings as the photo example: all 103 colors enabled, CIE2000 matching, no dithering, and Center and Fit To Boards checked.',
                    'The 29 × 29 result uses 337 beads and 32 colors. The 58 × 58 result uses 1,216 beads and 32 colors. The larger grid gives the window more room, but both versions include several shades along the smooth edges. A larger board does not automatically simplify the materials list.',
                ],
                comparison: [
                    { src: '/guides/photo-to-pattern/rocket-source.png', alt: 'Original smooth rocket illustration with a round teal window and transparent background.', caption: 'Original tutorial illustration, 1,254 × 1,254 pixels. AI-generated; not a finished bead pattern.', width: 1254, height: 1254 },
                    { src: '/guides/photo-to-pattern/rocket-perler-29-auto_grid.png', alt: 'Automatic rocket conversion on a 29 by 29 Perler grid before manual edits.', caption: 'Automatic 29 × 29 conversion: 337 beads, 32 colors.', width: 580, height: 580 },
                    { src: '/guides/photo-to-pattern/rocket-perler-58-auto_grid.png', alt: 'Automatic rocket conversion on a 58 by 58 Perler grid before manual edits.', caption: 'Automatic 58 × 58 conversion: 1,216 beads, 32 colors.', width: 1160, height: 1160 },
                ],
                links: [
                    { href: '/guides/photo-to-pattern/rocket-source.png', label: 'Save the rocket source image', download: true },
                    { href: '/guides/photo-to-pattern/rocket-perler-29-auto.bead-pattern.json', label: 'Open the unedited example', download: true },
                ],
            },
            {
                heading: 'Repair a window outline with 16 bead edits',
                body: [
                    'Open the unedited rocket project in the editor. Turn off Show Source so you can inspect the beads, then choose Midnight (Perler 80-15201) from Quick Colors. The automatic small version has a patchy mix of gray, blue and teal around the window. Paint a continuous Midnight outline around it.',
                    'Using the numbered rows and columns, paint columns 14–16 in rows 9 and 15; columns 13 and 17 in rows 10 and 14; and columns 12 and 18 in rows 11–13. These are 16 existing beads. Leave the turquoise center, hull, fins and flame unchanged. Drag around the outline in one stroke, then try Undo and Redo to compare it.',
                    'The edited version still has 337 beads and now uses 31 colors. Only the window outline was repaired; the remaining shades have not been simplified. This is a practice project for learning the editor, and it has not been physically assembled or iron-tested.',
                    'Use the three-page PDF as a counted chart with symbols and a materials list. Its grid is enlarged to fit the page; it is not a life-size 5 mm pegboard template.',
                ],
                comparison: [
                    { src: '/guides/photo-to-pattern/rocket-perler-29-auto_grid.png', alt: 'Before editing: several gray and blue shades interrupt the small rocket window outline.', caption: 'Before: the automatic 29 × 29 result.', width: 580, height: 580 },
                    { src: '/guides/photo-to-pattern/rocket-perler-29-cleanup_grid.png', alt: 'After 16 manual bead edits: a continuous Midnight outline surrounds the teal rocket window.', caption: 'After: 16 beads repainted Midnight, with every other cell unchanged.', width: 580, height: 580 },
                ],
                links: [
                    { href: '/editor', label: 'Try the edits in the editor' },
                    { href: '/guides/photo-to-pattern/rocket-perler-29-cleanup.bead-pattern.json', label: 'Edited project', download: true },
                    { href: '/guides/photo-to-pattern/rocket-perler-29-cleanup_grid.png', label: 'Edited grid PNG', download: true },
                    { href: '/guides/photo-to-pattern/rocket-perler-29-cleanup.pdf', label: 'Edited PDF with symbols', download: true },
                ],
            },
            {
                heading: 'Start with a clear source image',
                body: [
                    'Choose a photo with a clear subject, strong contrast, and a simple background. Portraits, game sprites, pets, icons, and logos usually convert better than busy scenes.',
                    'If the subject is too small in the original image, crop it before uploading. The generator will have more beads available for the important part of the design.',
                ],
                bullets: [
                    'Use high contrast images when possible.',
                    'Crop around the subject before converting.',
                    'Avoid tiny faces or text unless the pattern will be large.',
                ],
            },
            {
                heading: 'Pick a board size before judging the result',
                body: [
                    'The board size controls how many bead positions the image can use. A 29 x 29 pattern is good for a small project, but detailed photos often need multiple boards or a mini bead pegboard.',
                    'If the pattern looks muddy, increase the board count before changing color settings. More bead positions usually helps more than aggressive filtering.',
                ],
            },
            {
                heading: 'Use the editor for cleanup',
                body: [
                    'Automatic color matching gets you close, but handmade bead art often needs a few manual edits. Clean up facial features, outlines, text, and background noise before exporting.',
                    'Use the editor when you want to paint individual beads, erase stray colors, fill an area, or pick an exact bead color from the generated pattern.',
                ],
            },
        ],
        relatedLinks: [
            { href: '/', label: 'Open the generator' },
            { href: '/editor', label: 'Open the editor' },
            { href: '/guides/perler-bead-pegboards', label: 'Choose a pegboard' },
        ],
    },
    {
        slug: 'perler-bead-pegboards',
        updatedAt: '2026-10-08',
        title: 'Perler Bead Pegboard Size Guide',
        description:
            'Understand how pegboard size, board count, and pattern dimensions work when planning Perler, Hama, Artkal, and other fuse bead projects.',
        eyebrow: 'Pegboards',
        intro:
            'Pegboard choice affects the final pattern size and how much detail your bead art can show. The bead brand controls available colors, while the board controls the layout grid.',
        sections: [
            {
                heading: 'Brand and board are separate choices',
                body: [
                    'Many users own beads from one brand and boards from another. A Perler color palette can still be used with a compatible midi pegboard layout, as long as the physical bead and pegboard size match in real life.',
                    'In the generator, the color brand decides color matching. The pegboard decides pattern dimensions.',
                ],
            },
            {
                heading: 'Use board count for larger patterns',
                body: [
                    'Boards wide and boards tall multiply the selected board size. For example, one 29 x 29 board makes a 29 x 29 pattern, while two boards wide create a 58 x 29 pattern.',
                    'Large projects can preserve more detail, but they also require more beads, more ironing time, and more careful assembly.',
                ],
            },
            {
                heading: 'Check the bead count before exporting',
                body: [
                    'A larger board layout can quickly turn into thousands of beads. Use the total bead count and color count as a practical sanity check before committing to a project.',
                ],
                bullets: [
                    'Small icons: one board is usually enough.',
                    'Character portraits: start with two or more boards.',
                    'Detailed photos: test multiple sizes before exporting.',
                ],
            },
            {
                heading: 'Print a library PDF at its intended size',
                body: [
                    'Ready-made PDFs in the pattern library include a 50 mm scale line. In your PDF print dialog, select 100% or Actual size and turn off Fit to page or Shrink to fit. Print one page before placing beads.',
                    'Measure the printed scale line with a ruler: it should be 50 mm long. If it is shorter or longer, check the print scaling settings and print again. Match the printed grid to your actual pegboard before using it as a placement guide.',
                    'This scale check applies to the library PDFs that carry the scale line. An editor export may use a different page layout; use its row and column grid as a chart unless you have checked the physical spacing. Choosing a different color brand does not change a midi chart into a mini or maxi placement template.',
                ],
            },
            {
                heading: 'Download a blank grid and check your printer',
                body: [
                    'Choose A4 or US Letter to match your paper. Each free sheet contains a blank 29 × 29 grid with a 5 mm pitch and two 50 mm calibration rulers, one horizontal and one vertical. The full outside grid is 145 mm wide; the distance between the first and last cell centers is 140 mm.',
                    'Print at 100% or Actual size, with Fit to page turned off. Measure both rulers before using the grid. If either ruler is not 50 mm, correct the printer scaling and try again. Check your actual pegboard separately; these files have been checked digitally, not tested on a physical board.',
                    'Use the blank grid to sketch a design or plan a group activity. The editable SVG files use the same dimensions, but design software may resize an imported SVG, so measure a fresh print after editing. These sheets do not rescale an existing editor export.',
                ],
                links: [
                    { href: '/printables/calibration/29x29-5mm-a4.pdf', label: 'A4 grid and calibration PDF' },
                    { href: '/printables/calibration/29x29-5mm-us-letter.pdf', label: 'US Letter grid and calibration PDF' },
                    { href: '/printables/calibration/29x29-5mm-a4.svg', label: 'Editable A4 SVG' },
                    { href: '/printables/calibration/29x29-5mm-us-letter.svg', label: 'Editable US Letter SVG' },
                ],
            },
        ],
        relatedLinks: [
            { href: '/', label: 'Try a board size' },
            { href: '/guides/photo-to-perler-bead-pattern', label: 'Photo conversion guide' },
            { href: '/guides/mini-perler-beads', label: 'Mini bead guide' },
            { href: '/guides/perler-to-hama-artkal', label: 'Switch bead brands' },
        ],
    },
    {
        slug: 'perler-to-hama-artkal',
        updatedAt: '2026-09-24',
        title: 'How to Convert a Perler Pattern to Hama or Artkal Colors',
        description:
            'Use the editor to match a ready-made Perler pattern to Hama or Artkal colors, keep the bead layout, and export an updated chart and color list.',
        eyebrow: 'Bead Colors',
        intro:
            'You can use a ready-made pattern with a different bead palette. Library previews and downloads use Perler Midi by default. Open the pattern in the editor, change Color Brand while keeping the board settings unchanged, then export a new chart for your selected brand.',
        sections: [
            {
                heading: '1. Open a ready-made pattern',
                body: [
                    'On a pattern page, choose Open in editor. When the editor asks to open the library pattern, choose Open pattern. If another project is already open, save it first with Save current project, then choose Replace current pattern.',
                    'For example, start with the Stardew Valley Blue Chicken pattern. Its original Perler version uses 192 beads in 8 colors on one 29 × 29 board, with a 16 × 16 motif. The editor opens the bead grid itself, so you do not need to upload or trace the preview image.',
                ],
                links: [
                    { href: '/patterns/stardew-valley/blue-chicken', label: 'Open the Blue Chicken pattern' },
                ],
            },
            {
                heading: '2. Change the color brand and apply it',
                body: [
                    'Find Pattern Setup beside the canvas. On a phone, open Setup. In Color Brand, choose Hama Midi or the Artkal palette that matches your bead range. Leave Pegboard, Boards Wide, and Boards Tall unchanged, then choose Apply Changes.',
                    'A brand-only change keeps the current bead positions, empty cells, and manual edits. Beads identified as Black or White in the current palette keep that color name when the selected palette has an enabled equivalent. Other colors use the closest enabled digital color. Changing the board settings is a separate operation that can rebuild the layout.',
                    'If you have edited the pattern, save a project copy before switching brands. Your current edits stay in the converted grid, but Undo history starts again after the palette change. Reopen the saved copy if you need the exact previous colors.',
                ],
                figure: {
                    src: '/guides/perler-to-hama-artkal/editor-hama-setup.png',
                    alt: 'Blue Chicken in the editor with Hama Midi selected, 192 beads, and an unchanged 29 × 29 board.',
                    caption: 'The Blue Chicken after applying Hama Midi in the actual editor. This screenshot shows the digital palette result; it does not verify the colors of physical beads.',
                    width: 1280,
                    height: 720,
                },
            },
            {
                heading: '3. Check the new colors',
                body: [
                    'Compare the outline, face, and small details on the canvas. Similar Perler colors can map to the same Hama or Artkal color, so the number of colors may decrease even though the bead layout stays the same. You can adjust individual beads if a detail needs more contrast.',
                    'The match uses digital palette colors, not measurements of your physical beads. Check the new color names and codes against the beads you own. A palette change does not verify bead size, pegboard fit, or melting compatibility between brands.',
                ],
            },
            {
                heading: '4. Export the converted pattern',
                body: [
                    'Choose Export above the canvas, or File then Export Pattern on a phone. Set Export Format to PDF, choose a file name that includes the brand, and select Export PDF. Use Symbols In Printable Exports if you want symbols as well as colors in the chart.',
                    'Use the newly exported chart and its target-brand color list to plan your bead quantities. The PDF and grid PNG on the original library page remain the Perler version; they are not replaced when you edit your own copy.',
                    'Use Save Project to keep an editable copy with the selected palette. Before building, compare the printed chart with the on-screen result and check that you have the required colors.',
                ],
            },
        ],
        relatedLinks: [
            { href: '/patterns/stardew-valley/blue-chicken', label: 'Try the Blue Chicken pattern' },
            { href: '/patterns/hama', label: 'Download ready-made Hama Midi patterns' },
            { href: '/patterns', label: 'Browse more patterns' },
            { href: '/guides/perler-bead-pegboards', label: 'Check board size and printing' },
            { href: '/guides/perler-vs-hama-vs-artkal', label: 'Compare bead brands and sizes' },
        ],
    },
    {
        slug: 'perler-vs-hama-vs-artkal',
        updatedAt: '2026-10-08',
        title: 'Perler vs Hama vs Artkal: Sizes, Colors and Mixing',
        description:
            'Compare Perler, Hama and Artkal bead sizes, mini and midi ranges, color choices and mixing advice. Choose beads that match your board and pattern.',
        eyebrow: 'Choosing Beads',
        intro:
            'Start with the bead size and pegboard you own, then check the colors your pattern needs. Perler, Hama and Artkal each have distinct ranges, so the series on the bag matters as much as the brand. This guide compares manufacturer specifications and advice; it is not a hands-on melting test.',
        sections: [
            {
                heading: 'Bead sizes at a glance',
                body: [
                    'Standard or midi beads and mini beads need different pegboard spacing. Even two ranges called Mini can have different dimensions. Check the exact range on your bead bag and the beads recommended for your board before ordering.',
                ],
                table: {
                    caption: 'Manufacturer specifications for the ranges compared here',
                    headers: ['Bead range', 'Size', 'Pegboard choice'],
                    rows: [
                        {
                            label: 'Perler standard',
                            cells: ['5.07 mm high × 4.77 mm wide', 'Use a board specified for standard Perler beads.'],
                        },
                        {
                            label: 'Hama Midi',
                            cells: ['5 mm diameter × 5 mm high', 'Choose Hama Midi boards or verify the exact fit.'],
                        },
                        {
                            label: 'Artkal S',
                            cells: ['5 mm midi; hard series', 'Choose a board for the 5 mm range. S is not mini.'],
                        },
                        {
                            label: 'Perler Mini',
                            cells: ['Separate mini range', 'Perler specifies its Mini boards for Mini beads, not standard beads.'],
                        },
                        {
                            label: 'Hama Mini',
                            cells: ['2.5 mm diameter × 2.5 mm high', 'Choose a board for Hama Mini.'],
                        },
                        {
                            label: 'Artkal C',
                            cells: ['2.6 mm mini; hard series', 'Choose a board for Artkal’s 2.6 mm mini range.'],
                        },
                    ],
                },
                links: [
                    { href: 'https://perler.com/products/1-000-perler-beads-multi-mix', label: 'Perler standard dimensions' },
                    { href: 'https://perler.com/products/mini-beads-large-pegboards-2-ct', label: 'Perler Mini board requirements' },
                    { href: 'https://hama.dk/pages/faq', label: 'Hama size specifications' },
                    { href: 'https://www.artkalfusebeads.com/blogs/faq/artkal-beads-size', label: 'Artkal size and series guide' },
                ],
            },
            {
                heading: 'Which range should you choose?',
                body: [
                    'For a first project, a matching bead-and-board kit is a straightforward starting point. If you already have supplies, staying with that exact range lets you use your existing boards and sorted colors. Check that you can buy more of the colors you use most.',
                    'For a small detailed design, consider a mini range with its matching board. A 29 × 29 chart still has 29 bead positions per side with either size; smaller beads make the physical design smaller. More detail requires more chart cells, not just a smaller bead.',
                ],
                bullets: [
                    'Already own Perler standard beads and boards? Compare the missing colors before replacing your supplies.',
                    'Already own Hama? Confirm whether your kit is Mini, Midi or Maxi before choosing a palette or adding beads.',
                    'Considering Artkal? Read the series letter: S is 5 mm hard midi, while C is 2.6 mm hard mini. Its soft R and A ranges are different products.',
                ],
                links: [
                    { href: '/guides/mini-perler-beads', label: 'Plan a pattern with mini beads' },
                    { href: '/guides/perler-bead-kits-and-storage', label: 'Plan a starter kit and storage' },
                ],
            },
            {
                heading: 'Can you mix Perler, Hama and Artkal beads?',
                body: [
                    'Check the exact sizes and series before mixing. In a statement dated March 24, 2017, Artkal describes its upgraded hard S 5 mm and C 2.6 mm beads as compatible with Perler and Hama. It recommends using its soft R 5 mm and A 2.6 mm ranges separately to preserve their flexibility.',
                    'That is Artkal’s statement about specific upgraded ranges, not a guarantee for every bead or pegboard. Hama lists Mini at 2.5 mm, while Artkal C is 2.6 mm. Do not assume those mini ranges fit the same board or fuse alike just because both are called Mini.',
                    'Keep unknown mixed beads separate from a finished project. For a combination you have confirmed fits the board, follow the relevant manufacturer’s instructions and try a small patch first. Inspect it after cooling before committing a large pattern to the iron.',
                ],
                links: [
                    { href: 'https://www.artkalfusebeads.com/blogs/faq/which-series-of-artkal-beads-can-work-with-perler-and-hama', label: 'Artkal’s 2017 compatibility statement' },
                ],
            },
            {
                heading: 'Compare the colors you need, then the cost',
                body: [
                    'Make a list from your pattern before comparing brands. Check the exact series, color code and finish, especially for outlines, skin tones and close shades. A color called Red in two ranges is not proof of an identical physical color.',
                    'Use the manufacturer’s chart to identify a color, then check that it is available in the quantity you need. Hama provides charts for its different bead sizes, and Artkal publishes separate charts for its series. Perler’s bead-bag listings let you check individual colors and availability. A single total color count does not tell you whether a particular shade is available for your project.',
                    'Compare the delivered cost of those colors, including any new board and shipping. A large mixed tub may still leave you short of one heavily used color; a higher-priced single-color bag may be more useful for that pattern. Prices and local stock change, so compare an actual shopping list.',
                ],
                links: [
                    { href: 'https://perler.com/collections/1-000ct-bead-bags', label: 'Perler bead colors and availability' },
                    { href: 'https://hama.dk/en/pages/colour-chart', label: 'Hama color charts by bead size' },
                    { href: 'https://www.artkalfusebeads.com/blogs/artkal-color-chart', label: 'Artkal charts by series' },
                ],
            },
            {
                heading: 'Use a Perler pattern with Hama or Artkal colors',
                body: [
                    'Our library downloads use Perler Midi colors by default. If you own another range, open the pattern in the editor and select that range in Color Brand. Artkal S (5 mm) is the S-series palette; Artkal C is the C-series palette. Keep the board settings unchanged when you only want to replace colors.',
                    'Apply Changes keeps the bead layout and matches it to enabled digital palette colors. Inspect important details and export a new chart with its color list. This helps you plan supplies, but a screen-color match does not verify physical shade, board fit or melting compatibility.',
                    'The original library PDF remains the Perler version. A counted chart can be followed cell by cell with another bead size; a page placed under a clear board needs verified physical spacing. Choosing a color brand does not set that spacing.',
                ],
                links: [
                    { href: '/guides/perler-to-hama-artkal', label: 'Follow the palette conversion steps' },
                    { href: '/guides/perler-bead-pegboards', label: 'Check grid size and print scale' },
                ],
            },
            {
                heading: 'Test your materials before the full design',
                body: [
                    'Use the ironing instructions for your exact range. Perler advises a dry iron at a medium setting and a small test patch. Hama gives different settings for Mini, Midi and Maxi and also advises testing because irons vary. A time or heat setting for one range is not a universal setting for all three brands.',
                    'Have an adult do the ironing, cover the beads with the recommended ironing paper, and keep the iron moving. Let your test cool before inspecting the joins. Once the beads, board and colors are settled, choose a small pattern to make before starting a larger piece.',
                ],
                links: [
                    { href: 'https://perler.com/pages/frequently-asked-questions', label: 'Perler’s ironing advice' },
                    { href: 'https://hama.dk/en/pages/instructions-1', label: 'Hama’s size-specific instructions' },
                    { href: '/guides/how-to-iron-perler-beads', label: 'Follow the standard Perler fusing method' },
                ],
            },
        ],
        relatedLinks: [
            { href: '/patterns', label: 'Choose a printable pattern' },
            { href: '/patterns/hama', label: 'Free Hama Midi templates' },
            { href: '/guides/perler-to-hama-artkal', label: 'Convert a pattern to your colors' },
            { href: '/guides/perler-bead-pegboards', label: 'Plan the board layout' },
        ],
    },
    {
        slug: 'mini-perler-beads',
        updatedAt: '2026-10-08',
        title: 'Mini Perler Beads Guide for Detailed Patterns',
        description:
            'Learn when mini Perler beads make sense, how they compare with midi beads, and how to plan detailed fuse bead patterns.',
        eyebrow: 'Mini Beads',
        intro:
            'Mini beads are useful when you want more detail in a smaller physical project. They do not change how the image is converted, but they do change the real-world scale of the finished pattern.',
        sections: [
            {
                heading: 'Six small Perler bead patterns to download',
                body: [
                    'Each of these designs fits within 16 × 16 bead positions. Choose a picture for its free printable PDF, color list, and Open in editor option.',
                    'These are small designs in the library’s default Perler Midi colors. Mini refers to bead size, not the number of cells; use the steps below if you want to make them with mini beads.',
                ],
                patternIds: [
                    'smb-super-star',
                    'smb-small-mario',
                    'kirby-adventure-normal',
                    'sdv-junimo',
                    'minecraft-diamond-sword-1-21-1',
                    'sdv-blue-chicken',
                ],
            },
            {
                heading: 'Use a small chart with mini beads',
                body: [
                    'Use a mini pegboard that matches your beads. Work by row and column: one occupied chart square becomes one bead, and blank squares stay empty. You do not need to enlarge a small design to fill the board.',
                    'Library PDFs are prepared for a midi grid. Use them as reference charts, not as full-size placement templates under a mini pegboard. Changing a color palette alone does not change the printed grid spacing.',
                ],
            },
            {
                heading: 'Match the chart to your mini bead colors',
                body: [
                    'Choose Open in editor on the pattern page, then Open pattern. If you already have a project open, use Save current project before choosing Replace current pattern.',
                    'In Pattern Setup, or Setup on a phone, set Color Brand to the range you own, such as Perler Mini, Hama Mini, or Artkal C. Artkal C is a 2.6 mm mini range; Artkal S is a 5 mm midi range. Leave Pegboard, Boards Wide, and Boards Tall unchanged to keep the existing digital layout, then choose Apply Changes. The physical pegboard must match your beads; selecting a color palette does not verify that fit.',
                    'Check the new colors and small details before exporting a new PDF. Several original colors may map to one color in your mini palette. Compare the exported color names and codes with your beads, and use the chart by row and column unless you have verified its physical spacing.',
                    'Changing Pegboard is a separate operation that can rebuild the grid. Use a mini board preset when generating a new pattern that needs that board’s full grid.',
                ],
                links: [
                    { href: '/guides/perler-to-hama-artkal', label: 'How palette conversion works' },
                    { href: '/guides/perler-bead-pegboards', label: 'Check board size and printing' },
                    { href: '/guides/perler-vs-hama-vs-artkal', label: 'Compare mini and midi bead ranges' },
                ],
            },
            {
                heading: 'Bead size does not change the image algorithm',
                body: [
                    'A 50 x 50 grid has 2,500 bead positions whether you use midi beads or mini beads. The difference is the physical size of the finished artwork, not the digital pattern logic.',
                    'For generation, focus on the palette and board grid. For crafting, make sure the bead size matches the pegboard you actually own.',
                ],
            },
            {
                heading: 'Use mini beads for small detailed projects',
                body: [
                    'Mini beads work well for keychains, earrings, ornaments, and detailed sprite-style pieces where a midi version would become too large.',
                    'They are harder to place by hand, so detailed mini projects usually benefit from tweezers and a clear printable chart.',
                ],
            },
            {
                heading: 'Choose color palettes carefully',
                body: [
                    'Some mini bead lines have fewer colors than their midi equivalents. If the generated pattern loses important colors, test another palette or simplify the source image.',
                ],
            },
        ],
        relatedLinks: [
            { href: '/', label: 'Generate a mini bead pattern' },
            { href: '/guides/perler-bead-pegboards', label: 'Pegboard size guide' },
            { href: '/guides/perler-bead-kits-and-storage', label: 'Beginner kit guide' },
        ],
    },
    {
        slug: 'perler-bead-kits-and-storage',
        title: 'Beginner Perler Bead Kit and Storage Guide',
        description:
            'A practical guide to beginner Perler bead kits, pegboards, ironing paper, tweezers, color organization, and storage for fuse bead projects.',
        eyebrow: 'Starter Supplies',
        intro:
            'A good beginner setup should make it easy to try patterns without turning color selection into a mess. Start simple, then add storage and specialty boards once you know what you like making.',
        sections: [
            {
                heading: 'What a beginner kit should include',
                body: [
                    'A basic kit should include assorted beads, at least one square pegboard, ironing paper, and enough common colors for small projects.',
                    'Tweezers are optional for very simple designs, but they become useful as soon as you work with small details or mini beads.',
                ],
                bullets: [
                    'Assorted beads or a small palette set.',
                    'Square pegboard or interlocking boards.',
                    'Ironing paper or parchment paper.',
                    'Tweezers for detailed placement.',
                ],
            },
            {
                heading: 'Storage matters once you collect colors',
                body: [
                    'Sorting beads by color saves time when following a printable pattern. Small drawer organizers, lidded boxes, or bead storage trays all work better than keeping every color mixed together.',
                    'If you export a pattern with many colors, label your storage with the bead color names or codes used by the generator.',
                ],
            },
            {
                heading: 'Use the generator before buying more beads',
                body: [
                    'Before buying bulk colors, convert a few patterns and check which colors appear most often. This helps you buy what you actually use instead of guessing.',
                ],
            },
        ],
        relatedLinks: [
            { href: '/', label: 'Open the generator' },
            { href: '/guides/photo-to-perler-bead-pattern', label: 'Photo-to-pattern guide' },
            { href: '/guides/mini-perler-beads', label: 'Mini bead guide' },
        ],
    },
    {
        slug: 'how-to-iron-perler-beads',
        updatedAt: '2026-10-08',
        title: 'How to Iron Perler Beads',
        description:
            'Learn how to iron Perler beads with the standard fusing method, judge when beads are joined, and troubleshoot loose beads, sticking paper, and excess heat.',
        eyebrow: 'Finishing Your Pattern',
        intro:
            'Have an adult fuse the design with ironing paper and a dry iron on a medium setting. Keep the iron moving, let the first side cool, then remove the design from its pegboard and fuse the reverse. The aim is connected beads with open centers.',
        sections: [
            {
                heading: 'Before you start',
                body: [
                    'These steps follow Perler’s standard fusing instructions. Check the instructions supplied with your particular beads, especially for Mini, Biggie, or another brand.',
                    'Keep your chart nearby for one last check of bead positions and missing colors. A digital preview shows the layout; it cannot tell you whether physical beads have fused.',
                ],
                bullets: [
                    'Your beaded design on its matching pegboard.',
                    'A household iron, ironing paper, and a flat, heat-safe work surface.',
                    'A few spare beads for a small test patch.',
                ],
            },
            {
                heading: '1. Test your iron and cover the beads',
                body: [
                    'Turn steam off. Start at medium heat and try a few spare beads before working on your finished design: irons vary, so a dial setting is not a precise temperature guarantee.',
                    'Flatten creases in the ironing paper and cover the design. The iron must not touch bare beads or the pegboard.',
                ],
                links: [
                    { href: 'https://perler.com/pages/frequently-asked-questions', label: 'Perler’s iron settings and test-patch advice' },
                ],
            },
            {
                heading: '2. Fuse the first side evenly',
                body: [
                    'Move the iron in small circles over the paper without pressing down. Work across the whole design, including its edges. Watch for neighboring bead edges to join while their center holes remain open.',
                    'Perler gives roughly 10–20 seconds per side as a starting guide. Colors and project size affect the time needed; inspect the joins instead of treating a timer as proof that the design is ready.',
                ],
                links: [
                    { href: 'https://perler.com/blogs/projects/standard-fusing-method', label: 'Perler’s standard method and demonstration video' },
                ],
            },
            {
                heading: '3. Cool, flip, and fuse the reverse',
                body: [
                    'Let the first side cool before removing the paper and lifting the design from the pegboard. Turn the design over, cover the unfused side with ironing paper, and repeat the fusing step. Let it cool completely before handling.',
                    'Check the finished piece against the chart. If your project uses bead holes for assembly, check those openings too; extra melting can close them.',
                ],
            },
            {
                heading: 'If beads separate or stick to the paper',
                body: [
                    'Loose edges: check for areas that missed even heat. If edges are not joining, Perler recommends adjusting the temperature upward a little. Work gradually rather than switching straight to maximum heat.',
                    'Sticking paper: let the design cool a little longer and peel slowly. If beads lift with the paper, return them to their positions and re-fuse those sections.',
                    'Closing holes or a warping pegboard: the heat may be too high. Lower it and check your test patch before continuing. Pressing harder is not the solution.',
                ],
                links: [
                    { href: 'https://perler.com/pages/frequently-asked-questions', label: 'Perler’s fusing troubleshooting advice' },
                ],
            },
            {
                heading: 'Do you need the tape method?',
                body: [
                    'It is an alternative for large projects, not an extra step in the standard method above. Perler describes it as a way to reduce seams between connected boards and beads springing off during fusing. It requires a separate setup and careful transfer before ironing.',
                    'For a large project, follow Perler’s complete illustrated instructions. The manufacturer explicitly says its tape method is not suitable for Mini Beads.',
                ],
                links: [
                    { href: 'https://perler.com/blogs/projects/the-tape-method-for-fusing-large-projects', label: 'Read Perler’s complete tape-method instructions' },
                ],
            },
            {
                heading: 'Choose a small pattern for your next project',
                body: [
                    'Our easy pattern collection contains connected designs that fit a single 29 × 29 board and use a limited palette. Download the chart, check its color list against your supplies, and place the beads before using this finishing guide.',
                    'Library charts use Perler Midi colors by default. Changing a chart to Hama or Artkal colors in the editor does not establish that different physical bead brands can be mixed or ironed at the same setting.',
                ],
                links: [
                    { href: '/patterns/easy', label: 'Choose an easy Perler bead pattern' },
                ],
            },
        ],
        relatedLinks: [
            { href: '/patterns/easy', label: 'Download an easy pattern' },
            { href: '/guides/perler-bead-kits-and-storage', label: 'Check your supplies' },
            { href: '/guides/perler-bead-pegboards', label: 'Check board size and printing' },
        ],
    },
];

export function getGuideBySlug(slug: string): GuidePage | undefined {
    return guidePages.find((guide) => guide.slug === slug);
}

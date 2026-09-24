export type GuideSection = {
    heading: string;
    body: string[];
    bullets?: string[];
    links?: Array<{
        href: string;
        label: string;
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
        title: 'How to Turn a Photo Into a Perler Bead Pattern',
        description:
            'Learn how to convert a photo into a printable Perler bead or fuse bead pattern, choose the right board size, and clean up the final design.',
        eyebrow: 'Photo Conversion',
        intro:
            'Photo-to-pattern tools work best when you treat the image like pixel art. The goal is not to preserve every detail, but to make a bead layout that still reads clearly after colors are reduced to real fuse bead palettes.',
        sections: [
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
        updatedAt: '2026-09-24',
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
                    'A brand-only change keeps the current bead positions, empty cells, and manual edits. Each current color is matched to the closest enabled color in the selected palette. Changing the board settings is a separate operation that can rebuild the layout.',
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
            { href: '/patterns', label: 'Browse more patterns' },
            { href: '/guides/perler-bead-pegboards', label: 'Check board size and printing' },
        ],
    },
    {
        slug: 'mini-perler-beads',
        title: 'Mini Perler Beads Guide for Detailed Patterns',
        description:
            'Learn when mini Perler beads make sense, how they compare with midi beads, and how to plan detailed fuse bead patterns.',
        eyebrow: 'Mini Beads',
        intro:
            'Mini beads are useful when you want more detail in a smaller physical project. They do not change how the image is converted, but they do change the real-world scale of the finished pattern.',
        sections: [
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
];

export function getGuideBySlug(slug: string): GuidePage | undefined {
    return guidePages.find((guide) => guide.slug === slug);
}

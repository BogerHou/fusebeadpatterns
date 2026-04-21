export type GuideSection = {
    heading: string;
    body: string[];
    bullets?: string[];
};

export type GuidePage = {
    slug: string;
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
        ],
        relatedLinks: [
            { href: '/', label: 'Try a board size' },
            { href: '/guides/photo-to-perler-bead-pattern', label: 'Photo conversion guide' },
            { href: '/guides/mini-perler-beads', label: 'Mini bead guide' },
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
            { href: '/', label: 'Create a pattern' },
            { href: '/guides/photo-to-perler-bead-pattern', label: 'Photo-to-pattern guide' },
            { href: '/guides/mini-perler-beads', label: 'Mini bead guide' },
        ],
    },
];

export function getGuideBySlug(slug: string): GuidePage | undefined {
    return guidePages.find((guide) => guide.slug === slug);
}

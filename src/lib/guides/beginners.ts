import type { GuidePage } from '../../app/(english)/guides/guide-data';

export const beginnerGuide: GuidePage = {
    slug: 'perler-beads-for-beginners',
    updatedAt: '2026-10-16',
    title: 'What Are Perler Beads? A Beginner’s Guide',
    description: 'Start with Perler beads: choose matching supplies, read a bead chart and make a small design. Includes a free bat pattern and links to ironing instructions.',
    eyebrow: 'Your first bead project',
    intro: 'Perler beads are small plastic craft beads arranged on a pegboard and fused with heat. Start with a ready-made chart and only the colors it needs. This guide explains compatible supplies, reading the grid and placing a first three-color bat design, without needing to convert a photo or learn the editor.',
    sections: [
        {
            heading: 'What are Perler beads?',
            body: [
                'Perler is a brand of small plastic beads with holes through their centers. You arrange them on a pegboard to form a picture, then heat joins neighboring beads into a piece. Fuse beads and ironing beads are broader names for this kind of craft; other brands have their own sizes and instructions.',
                'They are different from seed beads threaded onto string or wire, and from diamond painting pieces placed on adhesive canvas. A fuse-bead chart maps the positions on a pegboard. A threading pattern or diamond painting image does not automatically give you the right materials or steps.',
            ],
        },
        {
            heading: 'What you need for a first project',
            body: ['Choose your chart before buying a large color assortment. Check the bead range and board together: selecting a brand in the website changes the digital color palette, so you still need to match your physical supplies.'],
            bullets: [
                'Beads and a pegboard made for the same bead size and range. Keep the packaging so you can identify them later.',
                'A grid pattern with a color list. Count the colors you need and compare their names and codes with your supplies.',
                'Suitable ironing paper and an iron, with an adult responsible for the hot iron and the manufacturer’s finishing instructions.',
                'Optional tweezers for placing beads and small containers to keep the selected colors separate while you work.',
            ],
        },
        {
            heading: 'Choose a small pattern before buying colors',
            body: [
                'The original Halloween Bat below uses three colors and fits one 29 × 29 Midi pegboard. Its picture occupies 27 × 17 bead positions; the rest of the board stays empty. Open its detail page for the printable chart, color list and editable project. Save the chart before you start placing beads.',
                'For the default Perler version, gather 178 Black beads (80-19018), 68 Purple (80-19007) and 6 White (80-19001): 252 beads altogether. Match those references with your bead bags rather than choosing by screen color alone. This digital pattern has not been physically assembled or iron-tested.',
            ],
            patternIds: ['original-halloween-bat'],
            links: [{ href: '/patterns/halloween-bat', label: 'Download the three-color bat pattern' }],
        },
        {
            heading: 'Read a bead chart',
            body: [
                'One occupied square means one bead; a blank square means no bead. Where the chart uses symbols, look up each symbol in the color list. For the bat, K means Black, P means Purple and W means White. The symbol identifies a chart color; the longer reference identifies the bead color to find.',
                'Follow the numbered rows and columns rather than estimating positions from the preview picture. Count empty spaces too, especially between the wings and around the eyes. If you print the PDF, use its stated print settings and check the scale line before treating it as a placement guide.',
            ],
            links: [{ href: '/guides/perler-bead-pegboards', label: 'Check board sizes and printed chart scale' }],
        },
        {
            heading: 'Make the first pattern',
            body: ['Keep the chart beside the board and work one row at a time. Before finishing, compare the left and right wings, eyes and outline with the chart so a missed bead or extra row does not become part of the finished design.'],
            bullets: [
                'Place the beads on the matching pegboard, counting the starting position and empty squares in each row.',
                'Inspect the outline, eyes and color changes against the chart. Correct misplaced beads before adding heat.',
                'Have an adult fuse the design using suitable ironing paper and the instructions for that bead brand and range. Do not use one universal temperature or time for every project.',
                'Let the piece cool and follow the manufacturer’s removal and finishing steps before handling it.',
            ],
            links: [{ href: '/guides/how-to-iron-perler-beads', label: 'Follow the Perler ironing guide' }],
        },
        {
            heading: 'When to use a pattern maker',
            body: [
                'A ready-made chart is a straightforward first project because its layout and color quantities are already available. Use a pattern maker when you want to turn your own picture into a chart, change the size or adapt the colors to your supplies.',
                'For a photo, start with a clear subject, crop away unnecessary background and choose the bead brand and board dimensions. Check the converted outline and small details, then clean up individual squares before exporting. Compare the final color counts with what you own; a recognizable preview alone is not a complete shopping list.',
            ],
            links: [
                { href: '/#generator', label: 'Make a pattern from your picture' },
                { href: '/guides/photo-to-perler-bead-pattern', label: 'See a photo conversion and cleanup example' },
                { href: '/guides/perler-bead-kits-and-storage', label: 'Choose supplies and organize your colors' },
            ],
        },
        {
            heading: 'Manufacturer instructions',
            body: ['Perler lists pegboards and ironing paper among the supplies for its beads. Its FAQ explains iron settings and trying spare beads first. Hama describes adult ironing and cooling before removal. Use the instructions for your exact product and bead size; these English-language manufacturer pages explain their own materials.'],
            links: [
                { href: 'https://perler.com/products/1-000-perler-beads-multi-mix', label: 'Perler: beads and required supplies' },
                { href: 'https://perler.com/pages/frequently-asked-questions', label: 'Perler: frequently asked questions' },
                { href: 'https://hama.dk/en/pages/instructions-1', label: 'Hama: bead and ironing instructions' },
            ],
        },
    ],
    relatedLinks: [
        { href: '/patterns/easy', label: 'Choose another easy bead pattern' },
        { href: '/guides/perler-bead-pegboards', label: 'Find a matching pegboard' },
        { href: '/guides/how-to-iron-perler-beads', label: 'Read the ironing steps' },
    ],
};

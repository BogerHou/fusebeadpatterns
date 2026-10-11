import { getPatternById, type Pattern } from './catalog';
import { smallPatternCopy, smallPatternIds } from './small';

export type PatternTopic = {
    slug: string;
    label: string;
    title: string;
    metadataTitle?: string;
    description: string;
    intro: string;
    patternIds: readonly string[];
    additionalPatternIds?: readonly string[];
    selectionHeading: string;
    selectionNotes: readonly string[];
    relatedLinks: ReadonlyArray<{ href: string; label: string }>;
    updatedAt: string;
};

export const patternTopics: readonly PatternTopic[] = [
    {
        slug: 'easy',
        label: 'Easy patterns',
        title: 'Easy Perler Bead Patterns',
        description: 'Choose easy Perler bead patterns with four colors or fewer and one 29 × 29 board. Find Kirby, Ditto and Mario designs with free printable charts.',
        intro: 'Start with fewer colors to gather and a single board to fill. These Perler bead patterns use four colors or fewer on one 29 × 29 midi pegboard. Choose a picture for its free PDF, color list and editable pattern.',
        patternIds: [
            'smb-super-mushroom',
            'kirby-adventure-normal',
            'pokemon-ditto-gen5',
            'smb-bob-omb-smb3',
            'kirby-waddle-dee-adventure',
            'smb-question-block',
            'original-soccer-ball',
            'original-friendly-ghost',
            'original-christmas-tree',
            'original-halloween-bat',
        ],
        selectionHeading: 'Choosing your first pattern',
        selectionNotes: [
            'These designs are selected for their small color lists, single-board layouts and connected shapes. Bob-omb uses two colors; Ditto uses four. A low color count can make sorting beads simpler, but it does not guarantee an easy finish.',
            'The soccer ball uses only black and white, but fills 501 bead positions. Choose it for a larger single-board project; the smaller character designs need fewer beads.',
            'Open a pattern to check its bead counts and assembly notes. The designs have not been physically assembled or iron-tested. Take care when lifting and fusing a finished board, and follow the instructions for your bead brand.',
            'The printable files use Perler midi colors. Small designs are not the same as mini-size beads: keep the intended board size and check the PDF’s 50 mm scale at 100% / actual size before placing beads.',
        ],
        relatedLinks: [
            { href: '/guides/perler-bead-kits-and-storage', label: 'Beginner supplies guide' },
            { href: '/guides/perler-bead-pegboards', label: 'Choose a pegboard' },
            { href: '/patterns/cute', label: 'Cute pattern ideas' },
            { href: '/patterns/small', label: 'Small patterns by bead count' },
        ],
        updatedAt: '2026-10-08',
    },
    {
        slug: 'cute',
        label: 'Cute ideas',
        title: 'Cute Perler Bead Ideas',
        description: 'Find cute Perler bead ideas featuring Pikachu, Eevee, Kirby, Ditto and Stardew Valley’s Blue Chicken. Open a design for its free printable pattern.',
        intro: 'Pick a favorite character for your next bead project. Browse Pikachu, Eevee, Kirby and more cute Perler bead ideas, then open a picture to download its free printable chart or edit the colors.',
        patternIds: [
            'pokemon-pikachu-gen5',
            'pokemon-eevee-gen5',
            'kirby-adventure-normal',
            'sdv-blue-chicken',
            'pokemon-ditto-gen5',
            'pokemon-pichu-gen5',
            'pokemon-piplup-gen5',
            'pokemon-jigglypuff-gen5',
            'pokemon-torchic-gen5',
            'pokemon-togepi-gen5',
            'pokemon-mudkip-gen5',
            'kirby-waddle-dee-adventure',
        ],
        selectionHeading: 'From a cute idea to a bead project',
        selectionNotes: [
            'This collection brings together recognizable Pokémon, Kirby and Stardew Valley characters. Each pattern page identifies the reference version, so you can check the design before gathering beads.',
            'For fewer colors, start with Kirby or Ditto. Pikachu, Eevee and the Blue Chicken have thin one-bead connections: read their assembly notes before planning a piece you will move or handle. These patterns have not been physically assembled or iron-tested.',
            'Every design fits on one 29 × 29 midi pegboard. The drawings are small, but the downloads are not mini-bead placement templates. Print at 100% / actual size and check the scale, or follow the mini bead guide if you use a different bead size.',
            'Downloads use Perler colors. To work with Hama or Artkal, open the selected pattern in the editor, switch the color brand while keeping the board settings, and export a new chart.',
        ],
        relatedLinks: [
            { href: '/patterns/easy', label: 'Patterns with fewer colors' },
            { href: '/guides/mini-perler-beads', label: 'Mini bead size guide' },
            { href: '/guides/perler-to-hama-artkal', label: 'Switch bead brands' },
            { href: '/patterns/small', label: 'Small patterns by bead count' },
        ],
        updatedAt: '2026-10-08',
    },
    {
        slug: 'halloween',
        label: 'Halloween patterns',
        title: 'Halloween Perler Bead Patterns',
        description: 'Choose a ghost, bat or ghost cat with a pumpkin from three free Halloween Perler bead patterns. Download printable PDFs or edit each single-board design.',
        intro: 'Find a Halloween design to make on one 29 × 29 midi pegboard: a white ghost, a purple-and-black bat or a ghost cat hugging a pumpkin. Open a picture for its free PDF, grid PNG, color list and editable pattern.',
        patternIds: [
            'original-friendly-ghost',
            'original-halloween-bat',
            'ghost-cat-pumpkin',
        ],
        additionalPatternIds: ['original-black-cat'],
        selectionHeading: 'Choosing your Halloween pattern',
        selectionNotes: [
            'For a short color list, choose the ghost with black and white beads or the bat with three colors. The ghost cat and pumpkin use seven colors for the face, pumpkin and shaded details. Check the individual color list against your supplies.',
            'All three are flat original designs for a single square board. They have not been physically assembled, iron-tested or tested for hanging. These charts do not include stands or instructions for a three-dimensional display.',
            'The downloads use Perler Midi colors. Print the PDF at 100% / actual size and check its 50 mm scale. Follow the PNG by rows and columns; it is not an actual-size placement template.',
            'For Hama or Artkal colors, open a pattern in the editor, change the bead brand while keeping the board settings, and export a new chart with the matching color list.',
        ],
        relatedLinks: [
            { href: '/patterns/easy', label: 'More patterns with fewer colors' },
            { href: '/guides/how-to-iron-perler-beads', label: 'Ironing guide' },
            { href: '/guides/perler-to-hama-artkal', label: 'Switch bead brands' },
        ],
        updatedAt: '2026-10-08',
    },
    {
        slug: 'christmas',
        label: 'Christmas patterns',
        title: 'Christmas Perler Bead Patterns',
        description: 'Make a Christmas tree, snowman or gingerbread man with three free Perler bead patterns. Download printable PDFs or edit each single-board design.',
        intro: 'Choose a Christmas tree, snowman or gingerbread man for a festive bead project. Each original design fits one 29 × 29 midi pegboard. Open a picture for its free PDF, grid PNG, color list and editable pattern.',
        patternIds: [
            'original-christmas-tree',
            'original-snowman',
            'original-gingerbread-man',
        ],
        additionalPatternIds: ['original-santa-hat', 'original-christmas-stocking', 'original-snowflake', 'original-christmas-bauble-ornament'],
        selectionHeading: 'Making your Christmas pattern',
        selectionNotes: [
            'The downloads use Perler Midi colors and a single 29 × 29 board. The gingerbread man uses three colors; the tree and snowman use four. Check the individual color list before gathering beads.',
            'These are flat original designs. They have not been physically assembled, iron-tested or tested for hanging. If you plan to hang a finished piece, check its strength and attachment before use.',
            'Print the PDF at 100% / actual size and check its 50 mm scale. The PNG is a chart to follow, not an actual-size placement template.',
            'For Hama or Artkal colors, open the pattern in the editor, change the bead brand while keeping the board settings, and export a new chart.',
        ],
        relatedLinks: [
            { href: '/guides/how-to-iron-perler-beads', label: 'Ironing guide' },
            { href: '/guides/perler-bead-pegboards', label: 'Pegboard size guide' },
            { href: '/guides/perler-to-hama-artkal', label: 'Switch bead brands' },
        ],
        updatedAt: '2026-10-08',
    },
    {
        slug: 'small',
        label: smallPatternCopy.en.label,
        title: smallPatternCopy.en.title,
        metadataTitle: smallPatternCopy.en.metadataTitle,
        description: smallPatternCopy.en.description,
        intro: smallPatternCopy.en.intro,
        patternIds: smallPatternIds,
        selectionHeading: smallPatternCopy.en.heading,
        selectionNotes: smallPatternCopy.en.notes,
        relatedLinks: [
            { href: '/guides/mini-perler-beads', label: smallPatternCopy.en.miniGuide },
            { href: '/guides/perler-bead-pegboards', label: smallPatternCopy.en.boardGuide },
            { href: '/patterns/easy', label: smallPatternCopy.en.easy },
            { href: '/patterns/cute', label: smallPatternCopy.en.cute },
        ],
        updatedAt: '2026-10-11',
    },
];

export function getPatternTopicBySlug(slug: string): PatternTopic | undefined {
    return patternTopics.find((topic) => topic.slug === slug);
}

export function getPatternsForTopic(topic: PatternTopic): Pattern[] {
    return topic.patternIds.map((id) => {
        const pattern = getPatternById(id);
        if (!pattern) throw new Error(`Unknown pattern ${id} in topic ${topic.slug}`);
        return pattern;
    });
}

export function getAdditionalPatternsForTopic(topic: PatternTopic): Pattern[] {
    return (topic.additionalPatternIds ?? []).map((id) => {
        const pattern = getPatternById(id);
        if (!pattern) throw new Error(`Unknown additional pattern ${id} in topic ${topic.slug}`);
        return pattern;
    });
}

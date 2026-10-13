import type { GuidePage } from '../../app/(english)/guides/guide-data';
import { tutorialEditorLink } from './tutorial-projects';

export const beadifierAlternativeGuide: GuidePage = {
    slug: 'beadifier-alternative',
    updatedAt: '2026-10-11',
    title: 'A Free Beadifier Alternative for Editing Bead Patterns',
    description: 'Compare Beadifier and Fuse Bead Patterns for image conversion, bead-by-bead editing, available colors, printable charts and saved editable projects.',
    eyebrow: 'Choosing a Pattern Tool',
    intro: 'Looking for a Beadifier alternative because a converted image needs a few corrections? Fuse Bead Patterns lets you repaint individual beads, erase, fill, undo changes and save an editable project locally. You can use it free without an account.',
    sections: [
        {
            heading: 'Which Beadifier is compared here?',
            body: [
                'This page compares Eremes’s open-source Beadifier at beadifier.eremes.xyz with Fuse Bead Patterns. We checked its interface, public source and an actual PDF download on October 11, 2026. Other products called Beadifier, including Beadifier PRO, are not covered.',
                'We maintain Fuse Bead Patterns and are not affiliated with Beadifier. Both tools convert images using preset bead palettes, let you limit enabled colors and arrange multiple boards. Beadifier is a useful open-source choice for conversion and printing; our workflow below focuses on correcting the result and keeping a project you can reopen.',
            ],
            links: [
                { href: '/editor', label: 'Open the bead pattern editor' },
                { href: 'https://beadifier.eremes.xyz/', label: 'Eremes’s Beadifier' },
                { href: 'https://github.com/maxcleme/beadifier', label: 'Beadifier’s official source' },
            ],
        },
        {
            heading: 'Compare the work you need to do',
            body: ['These are observed features, not a color-accuracy ranking. Different default palettes and matching settings can produce different conversions.'],
            table: {
                caption: 'Checked on October 11, 2026',
                headers: ['Task', 'Eremes’s Beadifier', 'Fuse Bead Patterns'],
                rows: [
                    { label: 'Convert an image', cells: ['Preset bead palettes, board sizes and image adjustments.', 'Preset bead palettes, board sizes and image adjustments.'] },
                    { label: 'Use colors you own', cells: ['Enable or disable colors in preset palettes.', 'Enable or disable colors in preset palettes.'] },
                    { label: 'Correct individual beads', cells: ['No per-bead drawing tools found in the checked interface or public source.', 'Draw, erase, fill, pick a color, Undo and Redo.'] },
                    { label: 'Keep an editable project', cells: ['No reopenable project-file option found in the checked interface or public source.', 'Save a local .bead-pattern.json file and reopen it.'] },
                    { label: 'Export a chart or image', cells: ['PDF; SVG, PNG, JPEG and XLSX listed as Beta.', 'PDF, SVG, printable PNG, JPG, XLSX and Grid PNG.'] },
                ],
            },
        },
        {
            heading: 'Try editing a real converted pattern',
            body: [
                'The rocket below is our own 29 × 29 Perler Midi example, not a comparison of the two tools’ conversions. Its source is an AI-generated illustration. The automatic result has a broken-looking window outline; repainting 16 existing beads Midnight makes the outline continuous.',
                'The bead count stays at 337, while the color count changes from 32 to 31. Use the editor links below to try the unedited example or inspect the edited result; the project downloads remain available. If another pattern is open, save it before choosing Replace current pattern, or choose Keep current pattern to cancel. The remaining shades have not been simplified, and the example has not been physically assembled or iron-tested.',
            ],
            comparison: [
                { src: '/guides/photo-to-pattern/rocket-perler-29-auto_grid.png', alt: 'Before editing: mixed gray and blue beads interrupt the rocket window outline.', caption: 'Before: automatic conversion, 337 beads and 32 colors.', width: 580, height: 580 },
                { src: '/guides/photo-to-pattern/rocket-perler-29-cleanup_grid.png', alt: 'After editing: 16 Midnight beads form a continuous outline around the rocket window.', caption: 'After: 16 beads repainted, 337 beads and 31 colors.', width: 580, height: 580 },
            ],
            links: [
                tutorialEditorLink('tutorial-rocket-before'),
                tutorialEditorLink('tutorial-rocket-after'),
                { href: '/guides/photo-to-pattern/rocket-perler-29-auto.bead-pattern.json', label: 'Unedited rocket project', download: true },
                { href: '/guides/photo-to-pattern/rocket-perler-29-cleanup.bead-pattern.json', label: 'Edited rocket project', download: true },
                { href: '/guides/photo-to-pattern/rocket-perler-29-cleanup.pdf', label: 'Edited rocket PDF', download: true },
                { href: '/guides/photo-to-perler-bead-pattern', label: 'Follow the numbered 16-bead correction' },
            ],
        },
        {
            heading: 'Use only bead colors you own',
            body: [
                'Choose your brand, matching board type and board count before hand-editing. In the editor, open Pattern Setup (Setup on a smaller screen) and choose Apply Changes. Then open Colors; on a narrow screen, choose Colors and Manage Palettes. Check the color codes against your bead bags and disable missing colors, keeping at least one enabled.',
                'Disabling colors remaps beads that use those colors to enabled choices. Beads already using an enabled color stay in place, including hand-painted corrections. Review the result and quantities before continuing. Changing the original image, board layout or conversion settings can regenerate the pattern, so save a project before making those changes.',
            ],
        },
        {
            heading: 'Save a project you can reopen',
            body: [
                'Choose Save in the editor to download a .bead-pattern.json project. Later, choose Open Project and select that file to continue with its bead grid and saved settings. The file stays on your device; this is not cloud synchronization. Keep your own backup.',
                'Use Export for a printable chart or image. A PDF is useful beside the pegboard, but it is not the editable project file. Keep both if you want to print now and revise the design later.',
            ],
        },
        {
            heading: 'Before you switch',
            body: [
                'Start from your original image and convert it again here. We do not offer an importer for a Beadifier project or reconstruct an editable pattern from its PDF. The Open Project button accepts our own project format.',
                'Our bead editor uses board-based dimensions and preset palettes: it does not accept an arbitrary custom RGB palette or an exact custom grid such as 62 × 62. For arbitrary pixel dimensions without bead-brand matching, use our separate pixel art tool.',
                'Choose A4 or US Letter for editor PDF exports. The paper choice is saved in your project; changing it keeps the beads and board layout. There is no per-board materials subtotal. Screen colors and digital charts still need checking against your physical beads and pegboard.',
            ],
            links: [{ href: '/pixel-art-grid', label: 'Use the pixel art tool for arbitrary grid dimensions' }],
        },
    ],
    relatedLinks: [
        { href: '/editor', label: 'Try the editor' },
        { href: '/guides/photo-to-perler-bead-pattern', label: 'Photo conversion and hand-editing guide' },
        { href: '/guides/perler-bead-pegboards', label: 'Plan your pegboard size' },
        { href: '/guides/perler-to-hama-artkal', label: 'Switch bead brands' },
    ],
};

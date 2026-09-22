/**
 * Promote an already reviewed local pattern pack to the website catalog.
 * Never fetches images or reads search-performance exports. Run only after the
 * source pack has passed its fidelity and PDF review; see the content guide.
 * Requires Python with pypdf for lossless extraction of individual PDF pages.
 */
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputs = process.argv.slice(2);
const packs = [];
for (const directory of inputs.length ? inputs : ['artifacts/pattern-samples/2026-09-22/library-v2', 'artifacts/pattern-samples/2026-09-22/expansion-v3', 'artifacts/pattern-samples/2026-09-22/expansion-v4', 'artifacts/pattern-samples/2026-09-22/expansion-v5', 'artifacts/pattern-samples/2026-09-22/expansion-v6-pokemon', 'artifacts/pattern-samples/2026-09-22/expansion-v7-minecraft', 'artifacts/pattern-samples/2026-09-22/expansion-v8-classics']) {
    const input = path.resolve(root, directory);
    packs.push({ input, source: JSON.parse(await readFile(path.join(input, 'manifest.json'), 'utf8')) });
}
const specs = {
    'sdv-blue-chicken': ['stardew-valley/blue-chicken', 'Stardew Valley Blue Chicken with blue feathers and a curled tail. Download the printable pattern or open it in the editor.'],
    'sdv-white-chicken': ['stardew-valley/white-chicken', 'Make the White Chicken from Stardew Valley, with cream feathers and an orange comb.'],
    'sdv-brown-chicken': ['stardew-valley/brown-chicken', 'A Stardew Valley Brown Chicken with warm brown feathers and a curled tail.'],
    'sdv-void-chicken': ['stardew-valley/void-chicken', 'Stardew Valley Void Chicken with dark feathers and red details.'],
    'sdv-golden-chicken': ['stardew-valley/golden-chicken', 'The Golden Chicken from Stardew Valley, with golden feathers and an orange beak.'],
    'sdv-junimo': ['stardew-valley/green-junimo', 'A Green Junimo from Stardew Valley with raised arms and a small leaf on its head.'],
    'pokemon-eevee-gen5': ['pokemon/eevee-gen-5', 'Pokémon Eevee with pointed ears and a fluffy cream collar.'],
    'pokemon-vaporeon-gen5': ['pokemon/vaporeon-gen-5', 'Pokémon Vaporeon with pointed fins and a curled tail.'],
    'pokemon-gengar-gen5': ['pokemon/gengar-gen-5', 'Pokémon Gengar with a wide grin and a spiky silhouette.'],
    'pokemon-pikachu-gen5': ['pokemon/pikachu-gen-5', 'Pokémon Pikachu with black-tipped ears, red cheeks, and a lightning-shaped tail.'],
    'pokemon-snorlax-gen5': ['pokemon/snorlax-gen-5', 'Pokémon Snorlax with a rounded body and a cream face and belly.'],
    'pokemon-bulbasaur-gen5': ['pokemon/bulbasaur-gen-5', 'Pokémon Bulbasaur with a green bulb on its back and a squat, four-legged silhouette.'],
    'pokemon-charmander-gen5': ['pokemon/charmander-gen-5', 'Make Pokémon Charmander with an orange body and a flame at the tip of its tail.'],
    'pokemon-squirtle-gen5': ['pokemon/squirtle-gen-5', 'Pokémon Squirtle with a blue body, a brown shell, and a curled tail. Download the printable bead pattern.'],
    'pokemon-umbreon-gen5': ['pokemon/umbreon-gen-5', 'Pokémon Umbreon with dark fur, long ears, and yellow rings. Download its printable bead pattern or open it in the editor.'],
    'pokemon-mew-gen5': ['pokemon/mew-gen-5', 'A pink Pokémon Mew with small ears and a long, curved tail. Choose the printable grid or editable bead pattern.'],
    'pokemon-jigglypuff-gen5': ['pokemon/jigglypuff-gen-5', 'Pokémon Jigglypuff with a round pink body, pointed ears, and a curled tuft of hair. Download its free printable bead pattern.'],
    'minecraft-diamond-sword-1-21-1': ['minecraft/diamond-sword', 'Make the Minecraft Diamond Sword with a turquoise blade and a brown handle. Download the free printable bead pattern or open it in the editor.'],
    'minecraft-diamond-pickaxe-1-21-1': ['minecraft/diamond-pickaxe', 'A Minecraft Diamond Pickaxe with a turquoise head and a brown handle. Download its free printable Perler bead pattern.'],
    'minecraft-diamond-1-21-1': ['minecraft/diamond', 'The bright turquoise Diamond item from Minecraft, with its familiar pixel highlights. Download the printable bead pattern.'],
    'minecraft-diamond-ore-1-21-1': ['minecraft/diamond-ore', 'Make the Minecraft Diamond Ore block texture with turquoise diamond flecks in gray stone. Download this flat, square Perler bead pattern.'],
    'minecraft-golden-apple-1-21-1': ['minecraft/golden-apple', 'Make the Minecraft Golden Apple with its golden skin and short brown stem. Choose the printable grid or editable bead pattern.'],
    'minecraft-apple-1-21-1': ['minecraft/apple', 'A red Minecraft Apple with bright highlights and a short brown stem. Download the free printable bead pattern.'],
    'minecraft-full-heart-1-21-1': ['minecraft/heart', 'Make a full red Minecraft health heart with its black outline and light highlight. Download the free printable bead pattern.'],
    'minecraft-tnt-side-1-21-1': ['minecraft/tnt', 'The red-and-white side of a Minecraft TNT block, including its black TNT lettering. This printable bead pattern makes a flat square design.'],
    'kirby-adventure-normal': ['kirby/kirbys-adventure', 'Make the pink Kirby from Kirby’s Adventure, with a rounded body and dark outline. Download the free printable bead pattern.'],
    'smb-super-mushroom': ['super-mario/super-mushroom', 'The classic Super Mushroom from the original Super Mario Bros., with an orange-yellow cap and red pixel spots. Download its free printable bead pattern.'],
    'smb-super-star': ['super-mario/super-star', 'Make the Super Star from the original Super Mario Bros., with five points and two pixel eyes. Download the free printable bead pattern.'],
    'capybara-potion': ['potion-class-capybara', 'A capybara witch brewing a potion in a cauldron for Halloween.'],
    'ghost-cat-pumpkin': ['pumpkin-hug-ghost-cat', 'A Halloween ghost cat hugging an orange pumpkin.'],
};

// New reviewed packs carry their editorial entries alongside their source data.
// Production and CI still consume only the generated catalog and public assets.
const editorial = new Map();
for (const { input, source } of packs) {
    if (source.patterns.every(({ id }) => Object.hasOwn(specs, id))) continue;
    const additions = JSON.parse(await readFile(path.join(input, 'site-entries.json'), 'utf8'));
    if (!Array.isArray(additions) || additions.length !== source.patterns.length) throw new Error(`Incomplete editorial review in ${input}`);
    for (const entry of additions) {
        if (Object.hasOwn(specs, entry.id) || !source.patterns.some(({ id }) => id === entry.id)) throw new Error(`Duplicate or unknown editorial ID: ${entry.id}`);
        if (!/^(pokemon|minecraft|super-mario|kirby|stardew-valley)\/[a-z0-9-]+$/.test(entry.slug) || typeof entry.description !== 'string' || !entry.description.trim()) throw new Error(`Invalid editorial content: ${entry.id}`);
        if (!entry.slug.startsWith('pokemon/') && !entry.reference) throw new Error(`Missing specific reference version: ${entry.id}`);
        if (entry.reference && ['version', 'label', 'description'].some((field) => typeof entry.reference[field] !== 'string' || !entry.reference[field].trim())) throw new Error(`Incomplete reference: ${entry.id}`);
        specs[entry.id] = [entry.slug, entry.description];
        editorial.set(entry.id, entry);
    }
}

const entries = packs.flatMap(({ input, source }) => source.patterns.map((pattern) => ({ input, source, pattern })));
const ids = entries.map(({ pattern }) => pattern.id);
if (ids.length !== 100 || ids.length !== Object.keys(specs).length || new Set(ids).size !== ids.length || ids.some((id) => !specs[id])) {
    throw new Error(`Expected ${Object.keys(specs).length} unique reviewed patterns across all packs. Review new, duplicate or missing entries before promotion.`);
}
// Keep each character collection together, followed by the original scenes.
entries.sort((a, b) => Number(a.pattern.kind === 'original') - Number(b.pattern.kind === 'original'));

const collections = [
    { id: 'stardew-valley', slug: 'stardew-valley', title: 'Stardew Valley', description: 'Explore Stardew Valley bead patterns featuring chickens and a Green Junimo. Choose a picture to download its printable pattern.' },
    { id: 'pokemon', slug: 'pokemon', title: 'Pokémon', description: 'Find Pokémon bead patterns featuring Eevee, Pikachu, Gengar, and more. Choose a picture to download or edit.' },
    { id: 'minecraft', slug: 'minecraft', title: 'Minecraft', description: 'Find Minecraft Perler bead patterns for a Diamond Sword, Diamond Pickaxe, Golden Apple, TNT, and more. Download a free printable pattern or open it in the editor.' },
    { id: 'super-mario', slug: 'super-mario', title: 'Super Mario', description: 'Make classic Super Mario Perler bead patterns featuring the Super Mushroom and Super Star from the original Super Mario Bros. Download a free printable grid.' },
    { id: 'kirby', slug: 'kirby', title: 'Kirby', description: 'Make a pink Kirby Perler bead pattern based on the classic Kirby’s Adventure sprite. Download the free printable grid or open it in the editor.' },
];

function referenceDetails(pattern, collectionId) {
    if (collectionId === 'stardew-valley') return { version: 'Wiki game depiction', label: 'Stardew Valley Wiki', description: 'Based on this community-maintained Wiki game depiction. The verified 3× display enlargement was reduced to its native pixel grid without interpolation.' };
    if (collectionId === 'pokemon') return { version: 'Gen V menu icon', label: 'PokeAPI sprite archive', description: 'Based on the 32 × 32 Gen V menu icon in the archived repository version. Only transparent margins were cropped before centering the motif on the board.' };
    if (collectionId === 'minecraft') return {
        version: 'Java Edition 1.21.1', label: 'Minecraft asset archive',
        description: pattern.id.includes('full-heart')
            ? 'Based on the Java Edition 1.21.1 health display: the original container and full-heart textures are overlaid at their native size. The combined outline and color regions are preserved.'
            : pattern.id.includes('tnt-side') || pattern.id.includes('diamond-ore')
                ? 'Based on the original Java Edition 1.21.1 block texture. This is one flat block face, not a three-dimensional model.'
                : 'Based on the original Java Edition 1.21.1 item texture in the pinned archive. Only transparent margins were cropped before centering it on the board.',
    };
    if (collectionId === 'super-mario') return {
        version: 'Super Mario Bros. (NES)', label: 'Super Mario Wiki',
        description: pattern.id === 'smb-super-star'
            ? 'Based on the original Super Mario Bros. Super Star sprite archived by the community Wiki. This is one static color frame; the source file records the Nestopia palette.'
            : 'Based on the original Super Mario Bros. Super Mushroom sprite archived by the community Wiki. The original occupied pixels and color regions are preserved.',
    };
    if (collectionId === 'kirby') return { version: 'Kirby’s Adventure (NES)', label: 'WiKirby', description: 'Based on the Kirby’s Adventure sprite archived by the community Wiki. This shows normal Kirby facing right, with the original occupied pixels and color regions preserved.' };
    return { version: 'Original scene' };
}

const patterns = [];
const provenance = [];
await mkdir(path.join(root, 'src/lib/patterns'), { recursive: true });
await mkdir(path.join(root, 'public/patterns'), { recursive: true });
await mkdir(path.join(root, 'docs'), { recursive: true });

for (const { input, source, pattern } of entries) {
    const adapted = pattern.kind === 'source-adapted';
    const collectionId = specs[pattern.id][0].includes('/') ? specs[pattern.id][0].split('/')[0] : null;
    const reference = editorial.get(pattern.id)?.reference ?? referenceDetails(pattern, collectionId);
    if (adapted) {
        if (!pattern.source?.sha256 || pattern.fidelity?.silhouetteChanges !== 0 || pattern.fidelity?.colorMerges !== 0 || pattern.fidelity?.interpolated || pattern.fidelity?.redrawn) {
            throw new Error(`Unreviewed fidelity for ${pattern.id}`);
        }
        const original = await readFile(path.join(input, pattern.source.file));
        if (createHash('sha256').update(original).digest('hex') !== pattern.source.sha256) {
            throw new Error(`Source hash changed for ${pattern.id}`);
        }
        if (pattern.source.isComposite) {
            if (!pattern.source.layers?.length || !pattern.source.compositionEvidence) throw new Error(`Missing composition record for ${pattern.id}`);
            await readFile(path.join(input, pattern.source.compositionEvidence));
            for (const layer of pattern.source.layers) {
                const bytes = await readFile(path.join(input, layer.file));
                if (createHash('sha256').update(bytes).digest('hex') !== layer.sha256) throw new Error(`Source layer changed for ${pattern.id}: ${layer.role}`);
            }
        }
    }

    const directory = path.join(root, 'public/patterns', pattern.id);
    await mkdir(directory, { recursive: true });
    for (const [from, to] of [
        [`previews/${pattern.id}.png`, 'preview.png'],
        [`charts/${pattern.id}.png`, 'grid.png'],
        [`charts/${pattern.id}.svg`, 'grid.svg'],
        [`pixels/${pattern.id}.png`, 'pixels.png'],
        [`projects/${pattern.id}.bead-pattern.json`, 'pattern.bead-pattern.json'],
    ]) {
        await copyFile(path.join(input, from), path.join(directory, to));
    }

    const notes = ['Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.', 'Print the PDF at 100% / Actual size and check its 50 mm scale line before use.', 'This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.'];
    if (pattern.requiresBacking) {
        notes.unshift(pattern.id === 'sdv-junimo'
            ? 'The body and feet form three separate parts. Mount them on a backing; do not try to lift this version as one piece.'
            : `This design has ${pattern.components} separate parts. Mount them on a backing; do not try to lift this version as one piece.`);
    } else if (pattern.weakBridges.length) {
        notes.unshift(`Thin one-bead connections at ${pattern.weakBridges.map(({ row, column }) => `row ${row}, column ${column}`).join('; ')}. Handle these areas carefully and consider a backing.`);
    }
    if (adapted) {
        notes.push('The reference outline and separate color regions are preserved. Bead colors approximate the reference rather than matching it exactly.');
    }

    const base = `/patterns/${pattern.id}`;
    const entry = {
        id: pattern.id,
        slug: specs[pattern.id][0],
        title: pattern.title,
        collectionId,
        version: reference.version,
        description: specs[pattern.id][1],
        beads: pattern.beads,
        colorCount: pattern.colorCount,
        gridWidth: pattern.width,
        gridHeight: pattern.height,
        motifWidth: pattern.bounds.width,
        motifHeight: pattern.bounds.height,
        palette: Object.values(pattern.palette).map(({ symbol, ref, name, hex, count }) => ({ symbol, ref, name, hex, count })),
        notes,
        source: adapted ? {
            label: reference.label,
            url: pattern.source.pageUrl,
            description: reference.description,
        } : null,
        assets: { preview: `${base}/preview.png`, grid: `${base}/grid.png`, pixels: `${base}/pixels.png`, project: `${base}/pattern.bead-pattern.json`, pdf: `${base}/pattern.pdf` },
        updatedAt: source.createdAt,
    };
    patterns.push(entry);
    provenance.push({ id: pattern.id, source: pattern.source, kind: pattern.kind });
}

const types = `/** Reviewed pattern content. Regenerate with scripts/build-pattern-library.mjs. */
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

`;
await writeFile(path.join(root, 'src/lib/patterns/catalog.ts'), types
    + `export const patternCollections: PatternCollection[] = ${JSON.stringify(collections, null, 4)};\n\n`
    + `export const patterns: Pattern[] = ${JSON.stringify(patterns, null, 4)};\n\n`
    + `export function getPatternBySlug(slug: string): Pattern | undefined {\n    return patterns.find((pattern) => pattern.slug === slug);\n}\n\n`
    + `export function getPatternById(id: string): Pattern | undefined {\n    return patterns.find((pattern) => pattern.id === id);\n}\n\n`
    + `export function getCollectionBySlug(slug: string): PatternCollection | undefined {\n    return patternCollections.find((collection) => collection.slug === slug);\n}\n\n`
    + `export function getPatternsForCollection(id: string): Pattern[] {\n    return patterns.filter((pattern) => pattern.collectionId === id);\n}\n\n`
    + `export function getPatternHref(pattern: Pattern): string {\n    return '/patterns/' + pattern.slug;\n}\n`);

await writeFile(path.join(root, 'src/lib/patterns/project-links.ts'), `/** Small, local-only asset allowlist for the editor. Does not import catalog data. */
export type LibraryProject = { id: string; title: string; projectUrl: string };

const libraryProjects: LibraryProject[] = ${JSON.stringify(patterns.map(({ id, title, assets }) => ({ id, title, projectUrl: assets.project })), null, 4)};

export function getLibraryProject(id: string): LibraryProject | undefined {
    return libraryProjects.find((project) => project.id === id);
}
`);

// Extract existing PDF pages without redrawing the grid, changing its scale,
// replacing fonts or rasterizing. Retain the original study numbering.
for (const { input, source } of packs) {
// Preserve the file metadata of the two already published packs byte for byte.
const legacyPdfMetadata = source.patterns.some(({ id }) => id === 'sdv-blue-chicken' || id === 'pokemon-charmander-gen5');
const split = spawnSync(process.env.PYTHON || 'python3', ['-c', `
import json, pathlib, sys
from pypdf import PdfReader, PdfWriter
source, output, ids, subject = sys.argv[1:]
ids = json.loads(ids)
reader = PdfReader(source)
if len(reader.pages) != len(ids):
    raise ValueError('PDF page count does not match the reviewed manifest')
for index, entry in enumerate(ids):
    original = reader.pages[index]
    text = original.extract_text()
    if entry['title'] not in text or str(entry['beads']) + ' beads' not in text:
        raise ValueError('PDF order/content mismatch for ' + entry['id'])
    writer = PdfWriter()
    writer.add_page(original)
    writer.add_metadata({'/Title': entry['title'] + ' Perler Bead Pattern', '/Author': 'Fuse Bead Patterns', '/Subject': subject})
    destination = pathlib.Path(output) / entry['id'] / 'pattern.pdf'
    with destination.open('wb') as stream:
        writer.write(stream)
    checked = PdfReader(destination)
    if len(checked.pages) != 1 or checked.pages[0].extract_text() != text:
        raise ValueError('PDF extraction changed the page')
    if checked.pages[0].get_contents().get_data() != original.get_contents().get_data():
        raise ValueError('PDF extraction changed the drawing instructions')
print('Extracted and verified ' + str(len(ids)) + ' PDF pages')
`, path.join(input, 'reference-pattern-library.pdf'), path.join(root, 'public/patterns'), JSON.stringify(source.patterns.map(({ id, title, beads }) => ({ id, title, beads }))), legacyPdfMetadata ? 'Single-page extraction from reviewed local pattern study' : 'Free printable Perler bead pattern with color key and actual-size grid'], { encoding: 'utf8' });
if (split.status !== 0) throw new Error(split.stderr || split.error?.message || 'PDF extraction failed; set PYTHON to a runtime with pypdf.');
process.stdout.write(split.stdout);
}

const guide = `# Pattern library content maintenance

The ${packs.length} reviewed packs integrate ${patterns.length} local patterns in total: ${patterns.length - 2} game-derived patterns across Stardew Valley, Pokémon, Minecraft, Super Mario and Kirby, and 2 original scenes. They add no search-performance exports. Source files and internal QA remain in the ignored local artifact packs; only the selected display and download assets are promoted to the application.

## Content identity and versions

- Named characters must match a recorded reference and its specific version. Never label an invented lookalike as an existing character.
- The six Stardew Valley references are community-maintained Wiki game depictions, not asserted to be official source files or the latest game version. Each verified 48 × 48 file consists of exact 3 × 3 display blocks. The native grid was recovered without interpolation.
- The Pokémon references come from PokeAPI sprites, commit \`0b133a62e914976d3d7ea33aaa1ac676ca248c30\`, under \`sprites/pokemon/versions/generation-v/icons/\`. These are 32 × 32 menu-icon canvases. Transparent margins were removed and the motifs centered; no more specific game release is asserted.
- Minecraft uses Java Edition 1.21.1 assets from InventivetalentDev/minecraft-assets, commit \`aef047f783f44424a591eeecf6b230d5bb0c8095\`. Item textures and the flat TNT side retain their native grids. The full health heart combines the original container and fill layers at matching native coordinates, following the verified game rendering order. It is not a hand-drawn outline.
- Super Mario references are sprites from the original Super Mario Bros. or Super Mario Bros. 3, as specified individually in the source records. The existing Super Star source records the Nestopia palette and represents one static color frame. A Nestopia palette label is asserted only where the individual source file history records it. Kirby references are specific Kirby’s Adventure sprites archived by WiKirby. An animation state or game version must not be inferred beyond the source evidence.
- The Small Luigi file is a documented community palette reconstruction using Mario's native shape and Luigi's game palette; its file history specifies Nestopia. Do not describe this reference as an untouched direct game export. Its source disclosure is retained on the pattern detail page.
- Perler mapping preserves visible occupied cells and distinct source color regions. It approximates source RGB colors using the repository palette, not physical bead measurements. There is no outline redraw, interpolation or color-region merging.
- The two original autumn scenes have no named-character association and no franchise collection. They are not substitutes for searches for a specific character.
- This is a curated batch, not a search-volume ranking. Existing community signals do not establish demand for every variant or this specific menu-icon version.

## Source authenticity and publication rights

Authenticity and permission are separate review fields. The references below were checked for identity and file integrity. Public redistribution permission for the ${provenance.filter(({ kind }) => kind === 'source-adapted').length} game-derived patterns is **not confirmed**. Game artwork remains associated with the respective rights holders, including ConcernedApe, the Pokémon rights holders, Mojang/Microsoft, Nintendo and HAL Laboratory. Wiki text licensing or repository software/CC0 text must not be treated as a blanket license for character artwork.

The project owner requested publication of the first 19 patterns (library-v2 and expansion-v3) on 2026-09-22; that release is complete. All later expansion packs remain local content drafts, not covered by that completed deployment. Publication decisions do not confirm third-party redistribution permissions. Keep the source rights status unconfirmed unless supporting permission evidence is obtained. The original scene designs have no third-party character reference.

## Exact source records

Retrieved on 2026-09-22. Hashes cover the reference PNG used before bead-grid preparation; those reference files remain in the ignored local source packs. Except for the documented health-heart composition, these are unaltered downloads from the recorded sources. A community file may itself be edited, as disclosed for Luigi above. The heart record additionally retains both original layer hashes and the evidence for their composition.

| Pattern ID | Reference file | SHA-256 | Rights status |
| --- | --- | --- | --- |
${provenance.map(({ id, source, kind }) => kind === 'source-adapted'
    ? `| ${id} | ${source.isComposite ? source.layers.map((layer) => `[${layer.role} PNG](${layer.imageUrl}), SHA-256 \`${layer.sha256}\``).join('; ') : `[recorded PNG](${source.imageUrl})`} | \`${source.sha256}\`${source.isComposite ? ' (composite input)' : ''} | Public redistribution unconfirmed |`
    : `| ${id} | Original grid drawing; no third-party character reference | Not applicable | Original design; no third-party character reference |`).join('\n')}

## Asset generation and review

\`src/lib/patterns/catalog.ts\` holds English page content, stable slugs and compact color counts. The editor imports only \`src/lib/patterns/project-links.ts\`, a small list of trusted local project URLs. Neither module reads artifacts or external data at runtime.

\`public/patterns/{id}/\` contains the reviewed preview PNG, symbol grid PNG/SVG, 29 × 29 pixel PNG, editable project and single-page PDF. Images and projects are copied without pixel changes. PDFs are extracted losslessly from the reviewed source packs. The existing 30 downloads retain their content. New downloads use recognizable titles and concise printing instructions. Each page retains its source link and 50 mm print scale. The new color key supports up to 15 distinct colors without changing the 5 mm grid pitch. Before public release, any editorial PDF changes need a separate render review while preserving grid scale and cell content.

To regenerate after reviewing a new source pack, run \`node scripts/build-pattern-library.mjs\`. Python with \`pypdf\` is required; set \`PYTHON\` when it is not the default runtime. The default inputs are the ignored library-v2, expansion-v3, expansion-v4, expansion-v5, expansion-v6-pokemon, expansion-v7-minecraft and expansion-v8-classics packs under artifacts/pattern-samples/2026-09-22. New packs include \`site-entries.json\` with reviewed stable slugs, descriptions and specific source-version wording. To use other locations, pass all pack directories as arguments. The script verifies the ${patterns.length} expected unique IDs, source hashes, fidelity flags, PDF page order/text and unchanged PDF drawing instructions. It is intentionally not part of the website build: CI and production need only checked-in assets. After generation, run \`npx vitest run src/lib/patterns/catalog.test.ts\` and render the PDF downloads for visual review.

## Physical assembly notes

All designs use one 29 × 29 MIDI board. Motif dimensions are recorded separately from the board canvas. Junimo has three disconnected parts and requires a backing. One-bead bridges are recorded for the relevant other patterns. No design has been physically assembled or iron-tested. Avoid claims that a pattern is physically validated, guaranteed to hold together or an exact physical color match.

## Deferred and retired designs

The first six unverified named concepts remain retired. Stardrop (interpolated reference), Strawberry Seeds (native grid not confirmed) and Prismatic Shard (38 native colors, pending a larger palette review) are excluded. Charizard is also deferred: its verified Gen V motif is 30 × 22 and must not be squeezed into a 29-column board. Do not recreate uncertain pixels to fill the collection. New collections should be added only when they contain useful reviewed content; the two original scenes do not yet require a separate collection landing page.
`;
await writeFile(path.join(root, 'docs/pattern-library-content.md'), guide);
console.log(`Prepared ${patterns.length} catalog entries and local asset sets.`);

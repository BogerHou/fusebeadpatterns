/**
 * Promote an already reviewed local pattern pack to the website catalog.
 * Never fetches images or reads search-performance exports. Run only after the
 * source pack has passed its fidelity and PDF review; see the content guide.
 * Requires Python with pypdf for lossless extraction of individual PDF pages.
 * Writing requires --promote-id original-santa-hat --output-root NEW_DIRECTORY.
 * --check-only reviews complete manifests without opening or writing any PDF.
 */
import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const promotedId = 'original-santa-hat';
const publishedCatalogCount = 106;
// This is the complete fe3ed49 catalog, including order, copy and asset URLs.
// It is independent of the input manifests and must not be refreshed to accept drift.
const publishedCatalogHash = '50e6158feef88d3280a786f8dbb51569542e635bb47d3073c55649d422bdb68b';
const defaultInputs = ['artifacts/pattern-samples/2026-09-22/library-v2', 'artifacts/pattern-samples/2026-09-22/expansion-v3', 'artifacts/pattern-samples/2026-09-22/expansion-v4', 'artifacts/pattern-samples/2026-09-22/expansion-v5', 'artifacts/pattern-samples/2026-09-22/expansion-v6-pokemon', 'artifacts/pattern-samples/2026-09-22/expansion-v7-minecraft', 'artifacts/pattern-samples/2026-09-22/expansion-v8-classics', 'artifacts/pattern-samples/2026-10-08/soccer-ball', 'artifacts/pattern-samples/2026-10-08/original-seasonal-v1', 'artifacts/pattern-samples/2026-10-08/original-halloween-bat-v1', 'artifacts/pattern-samples/2026-10-08/original-christmas-v1', 'artifacts/pattern-samples/2026-10-09/original-santa-hat-v1'];

export function parsePromotionOptions(args, projectRoot = root) {
    const options = { inputs: [], checkOnly: false };
    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === '--check-only') {
            if (options.checkOnly) throw new Error('Duplicate --check-only');
            options.checkOnly = true;
        } else if (argument === '--promote-id' || argument === '--output-root') {
            const key = argument === '--promote-id' ? 'id' : 'outputRoot';
            if (options[key]) throw new Error(`Duplicate ${argument}`);
            const value = args[++index];
            if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`);
            options[key] = value;
        } else if (argument.startsWith('--')) throw new Error(`Unknown option: ${argument}`);
        else options.inputs.push(path.resolve(projectRoot, argument));
    }
    if (options.id !== promotedId) throw new Error(`Explicit --promote-id ${promotedId} is required; published IDs cannot be regenerated.`);
    if (!options.checkOnly && !options.outputRoot) throw new Error('Writing requires --output-root pointing to a new staging directory.');
    if (options.outputRoot) {
        options.outputRoot = path.resolve(projectRoot, options.outputRoot);
        if (options.outputRoot === path.resolve(projectRoot)) throw new Error('Output must use a new staging directory, not the project root.');
    }
    if (!options.inputs.length) options.inputs = defaultInputs.map(directory => path.resolve(projectRoot, directory));
    return options;
}

export function parsePublishedCatalog(source) {
    // The checked-in generated arrays are JSON. No TypeScript execution or
    // sourcepack-free replacement of the manifest checks is needed.
    const collections = source.match(/export const patternCollections: PatternCollection\[\] = (\[[\s\S]*?\n\]);/);
    const patterns = source.match(/export const patterns: Pattern\[\] = (\[[\s\S]*?\n\]);/);
    if (!collections || !patterns) throw new Error('Expected the published generated catalog arrays.');
    return { collections: JSON.parse(collections[1]), patterns: JSON.parse(patterns[1]) };
}

function assertFrozenBaseline(published) {
    const hash = createHash('sha256').update(JSON.stringify(published)).digest('hex');
    if (published.patterns.length !== publishedCatalogCount || hash !== publishedCatalogHash) {
        throw new Error('The complete published 106 catalog baseline changed; do not replace its independent lock.');
    }
}

export function publishedCatalogBaseline(catalog) {
    // A recorded Santa Hat entry may be present on later runs. Removing only that
    // explicit ID still has to reproduce the independently frozen fe3ed49 hash.
    const selected = catalog.patterns.filter(pattern => pattern.id === promotedId);
    if (selected.length > 1 || catalog.patterns.length !== publishedCatalogCount + selected.length) {
        throw new Error('Expected the frozen 106 catalog plus at most one recorded Santa Hat entry.');
    }
    const published = { collections: catalog.collections, patterns: catalog.patterns.filter(pattern => pattern.id !== promotedId) };
    assertFrozenBaseline(published);
    return published;
}

export function assertPublishedCatalogPreserved(published, collections, patterns, id = promotedId) {
    assertFrozenBaseline(published);
    if (published.patterns.some(pattern => pattern.id === id)) throw new Error(`Cannot regenerate a published pattern: ${id}`);
    const existing = patterns.filter(pattern => pattern.id !== id);
    if (!isDeepStrictEqual(collections, published.collections) || !isDeepStrictEqual(existing, published.patterns)) {
        throw new Error('The complete published 106 catalog entries, collections and order must remain unchanged.');
    }
    if (patterns.length !== publishedCatalogCount + 1 || patterns.filter(pattern => pattern.id === id).length !== 1) {
        throw new Error('Promotion must add exactly the one selected reviewed pattern.');
    }
}

export function assertRecordedPromotionPreserved(catalog, patterns) {
    if (catalog.patterns.some(pattern => pattern.id === promotedId) && !isDeepStrictEqual(catalog.patterns, patterns)) {
        throw new Error('A repeat promotion must exactly match the recorded 107 catalog, including Santa Hat.');
    }
}

export function validateOriginalPerlerProject(pattern, project) {
    if (pattern.id !== promotedId || pattern.kind !== 'original' || pattern.title !== 'Santa Hat') {
        throw new Error('The selected addition must be the reviewed original Santa Hat.');
    }
    const draft = project.draft;
    if (project.type !== 'bead-pattern-project-v1' || project.version !== 1
        || !isDeepStrictEqual(draft?.selectedPaletteIds, ['perler'])
        || draft.boardId !== 'midi' || draft.boardWidth !== 1 || draft.boardHeight !== 1) {
        throw new Error('Santa Hat must use the original Perler Midi project on one board.');
    }
}

export function selectedPdfPages(source, id = promotedId) {
    return source.patterns.map(({ id, title, beads }, index) => ({ id, title, beads, index }))
        .filter(entry => entry.id === id);
}

export async function createPromotionOutputRoot(destination) {
    // Nonrecursive, exclusive creation also rejects an existing empty directory.
    await mkdir(destination);
}

export async function writeExclusive(file, bytes) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes, { flag: 'wx' });
}

export async function copyExclusive(source, destination) {
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination, fsConstants.COPYFILE_EXCL);
}

export async function main(args = process.argv.slice(2)) {
const options = parsePromotionOptions(args);
const inputs = options.inputs;
const outputRoot = options.outputRoot;
if (inputs.length !== defaultInputs.length) throw new Error('Expected all 12 sourcepack directories, including the 11 published packs and Santa Hat.');
const currentCatalog = parsePublishedCatalog(await readFile(path.join(root, 'src/lib/patterns/catalog.ts'), 'utf8'));
const published = publishedCatalogBaseline(currentCatalog);
const packs = [];
for (const directory of inputs) {
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
        const pattern = source.patterns.find(({ id }) => id === entry.id);
        if (Object.hasOwn(specs, entry.id) || !pattern) throw new Error(`Duplicate or unknown editorial ID: ${entry.id}`);
        if (!['original', 'source-adapted'].includes(pattern.kind)) throw new Error(`Unknown pattern kind: ${entry.id}`);
        const original = pattern.kind === 'original';
        const slugFormat = original ? /^[a-z0-9]+(?:-[a-z0-9]+)*$/ : /^(pokemon|minecraft|super-mario|kirby|stardew-valley)\/[a-z0-9-]+$/;
        if (typeof entry.slug !== 'string' || !slugFormat.test(entry.slug) || typeof entry.description !== 'string' || !entry.description.trim()) throw new Error(`Invalid editorial content: ${entry.id}`);
        if (original) {
            if (typeof entry.version !== 'string' || !/^Original .+ design v[1-9]\d*$/.test(entry.version)) throw new Error(`Missing original design version: ${entry.id}`);
            if (entry.reference) throw new Error(`Original design must not claim a character reference: ${entry.id}`);
        } else {
            if (!entry.slug.startsWith('pokemon/') && !entry.reference) throw new Error(`Missing specific reference version: ${entry.id}`);
            if (entry.reference && ['version', 'label', 'description'].some((field) => typeof entry.reference[field] !== 'string' || !entry.reference[field].trim())) throw new Error(`Incomplete reference: ${entry.id}`);
        }
        specs[entry.id] = [entry.slug, entry.description];
        editorial.set(entry.id, entry);
    }
}

const entries = packs.flatMap(({ input, source }) => source.patterns.map((pattern) => ({ input, source, pattern })));
const ids = entries.map(({ pattern }) => pattern.id);
// Freeze the published baseline independently of the generated catalog. A missing
// old pack or a renamed ID/slug must not become valid after a later regeneration.
const publishedCount = 100;
const publishedIdentityHash = 'c9e90f50096692a269ac2806cec84d65b09ca67119968f92f6efa047c6e8b240';
const reviewedAdditions = {
    'original-soccer-ball': { slug: 'soccer-ball', kind: 'original' },
    'original-friendly-ghost': { slug: 'ghost', kind: 'original' },
    'original-christmas-tree': { slug: 'christmas-tree', kind: 'original' },
    'original-halloween-bat': { slug: 'halloween-bat', kind: 'original' },
    'original-snowman': { slug: 'snowman', kind: 'original' },
    'original-gingerbread-man': { slug: 'gingerbread-man', kind: 'original' },
    'original-santa-hat': { slug: 'santa-hat', kind: 'original', title: 'Santa Hat' },
};
const expectedCount = publishedCount + Object.keys(reviewedAdditions).length;
if (ids.length !== expectedCount || ids.length !== Object.keys(specs).length || new Set(ids).size !== ids.length || ids.some((id) => !Object.hasOwn(specs, id))) {
    throw new Error(`Expected ${expectedCount} unique reviewed patterns across all packs. Review new, duplicate or missing entries before promotion.`);
}
const slugs = ids.map((id) => specs[id][0]);
if (new Set(slugs).size !== slugs.length) throw new Error('Pattern slugs must be unique across all packs.');
const publishedIdentities = entries
    .filter(({ pattern }) => !Object.hasOwn(reviewedAdditions, pattern.id))
    .map(({ pattern }) => [pattern.id, specs[pattern.id][0], pattern.kind])
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
if (publishedIdentities.length !== publishedCount || createHash('sha256').update(JSON.stringify(publishedIdentities)).digest('hex') !== publishedIdentityHash) {
    throw new Error('The published 100 pattern IDs, slugs and kinds must remain intact.');
}
for (const [id, expected] of Object.entries(reviewedAdditions)) {
    const added = entries.find(({ pattern }) => pattern.id === id);
    if (!added || specs[id][0] !== expected.slug || added.pattern.kind !== expected.kind) throw new Error(`Unreviewed addition identity: ${id}`);
    if (expected.title && added.pattern.title !== expected.title) throw new Error(`Unreviewed addition title: ${id}`);
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

for (const { input, source, pattern } of entries) {
    const adapted = pattern.kind === 'source-adapted';
    const collectionId = specs[pattern.id][0].includes('/') ? specs[pattern.id][0].split('/')[0] : null;
    const review = editorial.get(pattern.id);
    const reference = !adapted && review ? { version: review.version } : review?.reference ?? referenceDetails(pattern, collectionId);
    if (pattern.id === options.id) {
        const project = JSON.parse(await readFile(path.join(input, 'projects', `${pattern.id}.bead-pattern.json`), 'utf8'));
        validateOriginalPerlerProject(pattern, project);
    }
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
        assets: { preview: `${base}/preview.png`, grid: `${base}/grid.png`, pixels: `${base}/pixels.png`, project: `${base}/pattern.bead-pattern.json`, pdf: `${base}/pattern.pdf`,
            ...(pattern.id === options.id ? { pdfLetter: `${base}/pattern-letter.pdf` } : {}) },
        updatedAt: source.createdAt,
    };
    patterns.push(entry);
    provenance.push({ id: pattern.id, source: pattern.source, kind: pattern.kind });
}

// All 107 sourcepack entries and all old source hashes are reviewed before any
// output. The existing catalog is a comparison baseline, never a source bypass.
assertPublishedCatalogPreserved(published, collections, patterns, options.id);
assertRecordedPromotionPreserved(currentCatalog, patterns);
if (options.checkOnly) {
    console.log(`Validated ${patterns.length} sourcepack entries; preserved all ${publishedCatalogCount} published entries. No assets or PDFs written.`);
    return;
}
// Refuse even an existing empty output root. Failed runs can be inspected, but
// cannot silently reuse partial staging files or overwrite a published asset.
await createPromotionOutputRoot(outputRoot);
for (const { input, pattern } of entries.filter(({ pattern }) => pattern.id === options.id)) {
    const directory = path.join(outputRoot, 'public/patterns', pattern.id);
    for (const [from, to] of [
        [`previews/${pattern.id}.png`, 'preview.png'],
        [`charts/${pattern.id}.png`, 'grid.png'],
        [`charts/${pattern.id}.svg`, 'grid.svg'],
        [`pixels/${pattern.id}.png`, 'pixels.png'],
        [`projects/${pattern.id}.bead-pattern.json`, 'pattern.bead-pattern.json'],
    ]) await copyExclusive(path.join(input, from), path.join(directory, to));
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
    assets: { preview: string; grid: string; pixels: string; project: string; pdf: string; pdfLetter?: string };
    updatedAt: string;
};

export type PatternCollection = { id: string; slug: string; title: string; description: string };

`;
await writeExclusive(path.join(outputRoot, 'src/lib/patterns/catalog.ts'), types
    + `export const patternCollections: PatternCollection[] = ${JSON.stringify(collections, null, 4)};\n\n`
    + `export const patterns: Pattern[] = ${JSON.stringify(patterns, null, 4)};\n\n`
    + `export function getPatternBySlug(slug: string): Pattern | undefined {\n    return patterns.find((pattern) => pattern.slug === slug);\n}\n\n`
    + `export function getPatternById(id: string): Pattern | undefined {\n    return patterns.find((pattern) => pattern.id === id);\n}\n\n`
    + `export function getCollectionBySlug(slug: string): PatternCollection | undefined {\n    return patternCollections.find((collection) => collection.slug === slug);\n}\n\n`
    + `export function getPatternsForCollection(id: string): Pattern[] {\n    return patterns.filter((pattern) => pattern.collectionId === id);\n}\n\n`
    + `export function getPatternHref(pattern: Pattern): string {\n    return '/patterns/' + pattern.slug;\n}\n`);

// Keep the lightweight same-pattern language map in sync with the catalog.
await writeExclusive(path.join(outputRoot, 'src/lib/patterns/route-slugs.json'),
    JSON.stringify(patterns.map(pattern => pattern.slug), null, 2) + '\n');

await writeExclusive(path.join(outputRoot, 'src/lib/patterns/project-links.ts'), `/** Small, local-only asset allowlist for the editor. Does not import catalog data. */
import type { SiteLocale } from '../i18n/locales';
import { getLocalizedSubjectName } from './localized-content';
import { hamaPatterns } from './hama';

export type LibraryProject = { id: string; title: string; projectUrl: string };

const libraryProjects: LibraryProject[] = ${JSON.stringify(patterns.map(({ id, title, assets }) => ({ id, title, projectUrl: assets.project })), null, 4)};

export function getLibraryProject(id: string, locale: SiteLocale = 'en'): LibraryProject | undefined {
    const original = libraryProjects.find((project) => project.id === id);
    if (original) return locale === 'en' ? original : { ...original, title: getLocalizedSubjectName(original, locale) };
    const hama = hamaPatterns.find((pattern) => pattern.projectId === id);
    if (!hama) return undefined;
    const base = libraryProjects.find(project => project.id === hama.id);
    const name = locale !== 'en' && base ? getLocalizedSubjectName(base, locale) : hama.name;
    return { id: hama.projectId, title: name + ' — Hama Midi', projectUrl: hama.project };
}
`);

// Extract only the selected reviewed addition, preserving source page indices.
// All published PDF packs are skipped before opening a PDF or invoking Python.
for (const { input, source } of packs) {
const pages = selectedPdfPages(source, options.id);
if (!pages.length) continue; // Never open or re-extract a published pack's PDF.
// Preserve legacy file metadata except the reviewed correction below.
const legacyPdfMetadata = source.patterns.some(({ id }) => id === 'sdv-blue-chicken' || id === 'pokemon-charmander-gen5');
for (const paper of [
    { input: 'reference-pattern-library.pdf', output: 'pattern.pdf', width: 210 * 72 / 25.4, height: 297 * 72 / 25.4, label: 'A4' },
    { input: 'reference-pattern-library-us-letter.pdf', output: 'pattern-letter.pdf', width: 612, height: 792, label: 'US Letter' },
]) {
const split = spawnSync(process.env.PYTHON || 'python3', ['-B', '-c', `
import importlib.util, json, pathlib, sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject
source, output, ids, page_count, subject, labels_script, paper_json = sys.argv[1:]
paper = json.loads(paper_json)
spec = importlib.util.spec_from_file_location('pattern_pdf_labels', labels_script)
labels = importlib.util.module_from_spec(spec)
spec.loader.exec_module(labels)
ids = json.loads(ids)
reader = PdfReader(source)
if len(reader.pages) != int(page_count):
    raise ValueError('PDF page count does not match the reviewed manifest')
source_language = reader.root_object.get('/Lang')
if source_language != 'en-US':
    raise ValueError('Reviewed Santa Hat PDF must retain its en-US document language')
def page_links(page):
    links = []
    for reference in page.get('/Annots', []):
        annotation = reference.get_object()
        action = annotation.get('/A', {})
        if action.get('/URI'):
            links.append((str(action['/URI']), tuple(float(value) for value in annotation['/Rect'])))
    return links
for entry in ids:
    original = reader.pages[entry['index']]
    if abs(float(original.mediabox.width) - paper['width']) > .01 or abs(float(original.mediabox.height) - paper['height']) > .01:
        raise ValueError('Reviewed new PDF must retain ' + paper['label'] + ' paper geometry')
    text = original.extract_text()
    if entry['title'] not in text or str(entry['beads']) + ' beads' not in text:
        raise ValueError('PDF order/content mismatch for ' + entry['id'])
    expected_links = page_links(original)
    if [link[0] for link in expected_links] != ['https://fusebeadpatterns.art/patterns/santa-hat']:
        raise ValueError('Reviewed Santa Hat PDF must link to its detail URL')
    writer = PdfWriter()
    writer.add_page(original)
    writer.root_object[NameObject('/Lang')] = TextStringObject(source_language)
    expected_contents = labels.clean_reviewed_pdf_page(writer.pages[0], entry['id'])
    expected_text = writer.pages[0].extract_text()
    # This reviewed addition includes an explicit actual-size print preference.
    # Keep published PDF bytes unchanged by applying it only to the new design.
    if entry['id'] in ('original-halloween-bat', 'original-santa-hat'):
        if reader.trailer['/Root'].get('/ViewerPreferences', {}).get('/PrintScaling') != '/None':
            raise ValueError('Reviewed new PDF must disable automatic print scaling')
        writer.root_object[NameObject('/ViewerPreferences')] = reader.root_object['/ViewerPreferences'].clone(writer)
    public_subject = labels.PUBLIC_SUBJECT if entry['id'] == labels.PATTERN_ID else subject
    writer.add_metadata({'/Title': entry['title'] + ' Perler Bead Pattern', '/Author': 'Fuse Bead Patterns', '/Subject': public_subject})
    destination = pathlib.Path(output) / entry['id'] / paper['output']
    with destination.open('xb') as stream:
        writer.write(stream)
    checked = PdfReader(destination)
    if len(checked.pages) != 1 or checked.pages[0].extract_text() != expected_text:
        raise ValueError('PDF extraction changed the page')
    if checked.pages[0].get_contents().get_data() != expected_contents:
        raise ValueError('PDF extraction changed the drawing instructions')
    if checked.root_object.get('/Lang') != source_language or checked.root_object['/ViewerPreferences'].get('/PrintScaling') != '/None':
        raise ValueError('PDF extraction changed document language or print scaling')
    if page_links(checked.pages[0]) != expected_links:
        raise ValueError('PDF extraction changed the detail link or its page coordinates')
print('Extracted and verified ' + str(len(ids)) + ' ' + paper['label'] + ' PDF pages')
`, path.join(input, paper.input), path.join(outputRoot, 'public/patterns'), JSON.stringify(pages), String(source.patterns.length), legacyPdfMetadata ? 'Single-page extraction from reviewed local pattern study' : 'Free printable Perler bead pattern with color key and actual-size grid', path.join(root, 'scripts/clean-pattern-pdf-labels.py'), JSON.stringify(paper)], { encoding: 'utf8' });
if (split.status !== 0) throw new Error(split.stderr || split.error?.message || 'PDF extraction failed; set PYTHON to a runtime with pypdf.');
process.stdout.write(split.stdout);
}
}

const adaptedCount = provenance.filter(({ kind }) => kind === 'source-adapted').length;
const originalCount = provenance.filter(({ kind }) => kind === 'original').length;
const guide = `# Pattern library content maintenance

The ${packs.length} reviewed packs integrate ${patterns.length} local patterns in total: ${adaptedCount} game-derived patterns across Stardew Valley, Pokémon, Minecraft, Super Mario and Kirby, and ${originalCount} original designs. They add no search-performance exports. Source files and internal QA remain in the ignored local artifact packs; only the selected display and download assets are promoted to the application.

## Content identity and versions

- Named characters must match a recorded reference and its specific version. Never label an invented lookalike as an existing character.
- The six Stardew Valley references are community-maintained Wiki game depictions, not asserted to be official source files or the latest game version. Each verified 48 × 48 file consists of exact 3 × 3 display blocks. The native grid was recovered without interpolation.
- The Pokémon references come from PokeAPI sprites, commit \`0b133a62e914976d3d7ea33aaa1ac676ca248c30\`, under \`sprites/pokemon/versions/generation-v/icons/\`. These are 32 × 32 menu-icon canvases. Transparent margins were removed and the motifs centered; no more specific game release is asserted.
- Minecraft uses Java Edition 1.21.1 assets from InventivetalentDev/minecraft-assets, commit \`aef047f783f44424a591eeecf6b230d5bb0c8095\`. Item textures and the flat TNT side retain their native grids. The full health heart combines the original container and fill layers at matching native coordinates, following the verified game rendering order. It is not a hand-drawn outline.
- Super Mario references are sprites from the original Super Mario Bros. or Super Mario Bros. 3, as specified individually in the source records. The existing Super Star source records the Nestopia palette and represents one static color frame. A Nestopia palette label is asserted only where the individual source file history records it. Kirby references are specific Kirby’s Adventure sprites archived by WiKirby. An animation state or game version must not be inferred beyond the source evidence.
- The Small Luigi file is a documented community palette reconstruction using Mario's native shape and Luigi's game palette; its file history specifies Nestopia. Do not describe this reference as an untouched direct game export. Its source disclosure is retained on the pattern detail page.
- Perler mapping preserves visible occupied cells and distinct source color regions. It approximates source RGB colors using the repository palette, not physical bead measurements. There is no outline redraw, interpolation or color-region merging.
- The original autumn scenes, soccer ball, sheet ghost, Christmas tree, Halloween bat, snowman, gingerbread man and Santa hat have no named-character association and no franchise collection. They are not substitutes for searches for a specific character. The soccer ball, ghost, Christmas tree, Halloween bat, snowman, gingerbread man and Santa hat each have a recorded version 1 grid design.
- This is a curated batch, not a search-volume ranking. Existing community signals do not establish demand for every variant or this specific menu-icon version.

## Source authenticity and publication rights

Authenticity and permission are separate review fields. The references below were checked for identity and file integrity. Public redistribution permission for the ${provenance.filter(({ kind }) => kind === 'source-adapted').length} game-derived patterns is **not confirmed**. Game artwork remains associated with the respective rights holders, including ConcernedApe, the Pokémon rights holders, Mojang/Microsoft, Nintendo and HAL Laboratory. Wiki text licensing or repository software/CC0 text must not be treated as a blanket license for character artwork.

The project owner requested publication of the first 19 patterns (library-v2 and expansion-v3) on 2026-09-22, then the expanded 100-pattern library and editor brand-switching fix; those releases are complete. The project owner authorized publication of the original soccer ball on 2026-10-08. Publication decisions do not confirm third-party redistribution permissions. Keep the source rights status unconfirmed unless supporting permission evidence is obtained. The original designs have no third-party character reference.

## Exact source records

Retrieved on 2026-09-22. Hashes cover the reference PNG used before bead-grid preparation; those reference files remain in the ignored local source packs. Except for the documented health-heart composition, these are unaltered downloads from the recorded sources. A community file may itself be edited, as disclosed for Luigi above. The heart record additionally retains both original layer hashes and the evidence for their composition.

| Pattern ID | Reference file | SHA-256 | Rights status |
| --- | --- | --- | --- |
${provenance.map(({ id, source, kind }) => kind === 'source-adapted'
    ? `| ${id} | ${source.isComposite ? source.layers.map((layer) => `[${layer.role} PNG](${layer.imageUrl}), SHA-256 \`${layer.sha256}\``).join('; ') : `[recorded PNG](${source.imageUrl})`} | \`${source.sha256}\`${source.isComposite ? ' (composite input)' : ''} | Public redistribution unconfirmed |`
    : `| ${id} | Original grid drawing; no third-party character reference | Not applicable | Original design; no third-party character reference |`).join('\n')}

## Asset generation and review

\`src/lib/patterns/catalog.ts\` holds English page content, stable slugs and compact color counts. The editor imports only \`src/lib/patterns/project-links.ts\`, a small list of trusted local project URLs. Neither module reads artifacts or external data at runtime.

\`public/patterns/{id}/\` contains the reviewed preview PNG, symbol grid PNG/SVG, 29 × 29 pixel PNG, editable project and single-page PDF. Images and projects are copied without pixel changes. The new Santa Hat additionally has \`pattern-letter.pdf\`, exposed only through its optional \`assets.pdfLetter\`. Its reviewed pack must provide \`reference-pattern-library.pdf\` (A4) and \`reference-pattern-library-us-letter.pdf\` (US Letter); both require \`/PrintScaling /None\` and must retain their paper dimensions and original drawing instructions on extraction. Previously published PDFs are neither opened nor rewritten by this incremental promotion. The existing five reviewed ghost-cat-pumpkin study-label replacements and Subject metadata remain in its unchanged public download; the helper scripts/clean-pattern-pdf-labels.py restricts that historical correction by ID and content hashes. New downloads use recognizable titles and concise printing instructions. Source-adapted pages retain their source links; every reviewed chart PDF includes a 50 mm print scale. The color key supports up to 15 distinct colors without changing the 5 mm grid pitch. Before public release, any editorial PDF changes need a separate render review while preserving grid scale and cell content.

To stage this reviewed addition, run \`node scripts/build-pattern-library.mjs --promote-id original-santa-hat --output-root /tmp/fusebead-santa-promotion-unique\`. The output root must not exist, including as an empty directory; its parent must already exist. The script exclusively creates the full 107-entry catalog, editor project allowlist and maintenance guide in that staging root, but copies and extracts only the selected Santa Hat asset set. Review the staged results before moving the three generated text files and the new Santa Hat public directory into the project. The builder never writes to the project's existing catalog or public directory. Repeated generation requires a different new output root and must exactly match any already recorded 107-entry catalog, including the Santa Hat entry.

The complete 12 sourcepack directories are required. The default inputs are the ignored library-v2, expansion-v3, expansion-v4, expansion-v5, expansion-v6-pokemon, expansion-v7-minecraft and expansion-v8-classics packs under artifacts/pattern-samples/2026-09-22, the soccer-ball, original-seasonal-v1, original-halloween-bat-v1 and original-christmas-v1 packs under artifacts/pattern-samples/2026-10-08, and artifacts/pattern-samples/2026-10-09/original-santa-hat-v1. To use packs in the main checkout from a worktree, supply all 12 absolute pack paths as positional arguments. New packs include \`site-entries.json\` with reviewed stable slugs and descriptions. Source-adapted designs retain their collection slug and specific reference-version requirements. Original designs use a single-segment slug and an explicit \`version\`, such as \`Original Santa hat design v1\`, without a third-party \`reference\`; Santa Hat must retain its original Perler Midi project on one board.

Use \`--promote-id original-santa-hat --check-only\` with the same complete inputs for a read-only sourcepack and catalog preflight. It checks no PDF and is not PDF acceptance. Writing requires Python with \`pypdf\`; set \`PYTHON\` when it is not the default runtime. The script verifies ${patterns.length} unique IDs/slugs, the original independent fingerprint of the published 100 IDs/slugs/kinds, the explicitly reviewed additions, all old source hashes and fidelity flags, and a separate frozen hash of the complete fe3ed49 106-entry catalog and collections. Removing the explicitly recorded Santa Hat from a 107-entry catalog must still reproduce that independent 106-entry hash; a generated result is never allowed to redefine it. Existing entries and their order must be deeply equal after reconstruction from the complete packs. Neither lock may be refreshed to accept a missing old pack or changed old content. New PDFs retain source page indices and are extracted only after sourcepack and catalog checks. All output files use exclusive creation, so collisions fail. Future additions require review and explicit new invariants. This generator is intentionally not part of the website build: CI and production need only checked-in assets. After staging, run \`node --test scripts/build-pattern-library.test.mjs\` and the relevant catalog/download tests, compare all existing asset hashes, and render the new PDF downloads for visual review. The generator does not create or refresh fonts, and PDF authoring and final visual acceptance are separate steps.

## Editor brand switching

Library previews and downloads use Perler Midi by default. In the editor, applying a different brand while keeping pegboard settings unchanged remaps the current edited grid to the closest enabled colors in that brand. It preserves bead positions and transparency without resampling or dithering; similar source colors may map to the same target color. Saved projects and editor exports use the selected brand.

Existing hand edits remain in the converted grid, but pixel undo history starts again because its old patches contain the previous brand's colors. Loading failures leave the current pattern intact, and opening another project cancels pending conversions. Changing pegboard dimensions retains the separate rebuild behavior and confirmation.

## Physical assembly notes

All designs use one 29 × 29 MIDI board. Motif dimensions are recorded separately from the board canvas. Junimo has three disconnected parts and requires a backing. One-bead bridges are recorded for the relevant other patterns. No design has been physically assembled or iron-tested. Avoid claims that a pattern is physically validated, guaranteed to hold together or an exact physical color match.

## Hama Midi printable variants

\`src/lib/patterns/hama.json\` selects six existing original designs and explicitly maps their Perler color references to ordinary solid Hama Midi colors. These are brand variants, not six additional original patterns. The published catalog IDs, Perler projects and old downloads remain unchanged. The Hama landing page is \`/patterns/hama\`; each variant uses the editor allowlist ID \`{originalId}-hama\` and isolated files under \`public/patterns-hama/{originalId}/\`.

Run \`python3 scripts/build-hama-patterns.py\` to generate the 580-pixel preview, native 29 × 29 RGBA PNG, editable project, A4 PDF and US Letter PDF for each selection. Use \`--check-only\` to verify the checked-in files and \`--qa-report PATH\` for an optional private report. The script requires Pillow, ReportLab, pypdf and pdfplumber, performs no network requests, and is not part of the production build. Reviewed original RGBA hashes are pinned independently of the catalog; source changes must trigger a new design review rather than an automatic hash replacement.

The mappings preserve the original bead positions, empty-cell RGBA bytes, alpha mask, board settings and bead counts. Projects retain \`sourceMode: blank\` and \`imageSrc: null\`, select \`hama\`, and contain the exact names, RGB values, references, symbols and \`H\` prefix from \`public/palettes/hama.csv\` for the colors used by that design. Each saved palette is the design's color selection, not the complete Hama range. There is no \`allColorReferences\` field. The fixed mapping deliberately avoids automatic matches to translucent, glow, neon or metallic finishes. It preserves White as H01 and Black as H18. Gingerbread uses H76 Nougat; the remaining mapped colors are H03 Yellow, H04 Orange, H05 Red, H07 Purple, H10 Green and H12 Brown.

The manufacturer's [2026 Midi color chart](https://cdn.shopify.com/s/files/1/0726/3771/0492/files/Midi_-_Colour_palette.pdf?v=1777369953), linked from the [official color-chart page](https://hama.dk/en/pages/colour-chart), identifies these as solid colors and uses numeric product color codes. PDFs therefore show \`01\`, \`18\` and other numeric codes; \`H\` is explained as the editor prefix. CSV RGB values remain screen approximations, not manufacturer measurements or guarantees about physical beads. The [Hama FAQ](https://hama.dk/pages/faq) identifies Midi beads as 5 mm; users still need to compare the printed grid with their own pegboard.

Both paper sizes keep one page, a 29 × 29 grid with 5 mm pitch, one matching symbol per occupied cell, color quantities, blank-cell instructions, a 100% / Actual size instruction, \`/PrintScaling /None\`, and independent horizontal and vertical 50 mm rulers. The check verifies all PDF cell coordinates and colors, symbols, material quantities, paper dimensions, rulers, text bounds, project/PNG agreement, and unchanged existing assets. Render all 12 PDFs after meaningful layout changes and inspect them before publication. Digital checks do not establish physical assembly, ironing or universal pegboard fit.

## Deferred and retired designs

The first six unverified named concepts remain retired. Stardrop (interpolated reference), Strawberry Seeds (native grid not confirmed) and Prismatic Shard (38 native colors, pending a larger palette review) are excluded. Charizard is also deferred: its verified Gen V motif is 30 × 22 and must not be squeezed into a 29-column board. Do not recreate uncertain pixels to fill the collection. New collections should be added only when they contain useful reviewed content; the original designs do not yet require a separate collection landing page.
`;
await writeExclusive(path.join(outputRoot, 'docs/pattern-library-content.md'), guide);
console.log(`Prepared ${patterns.length} catalog entries and only ${options.id} assets in ${outputRoot}; all ${publishedCatalogCount} published catalog entries preserved.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}

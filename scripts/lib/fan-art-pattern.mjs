import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const fanArtAddition = Object.freeze({
    id: 'minecraft-creeper-face-v1', slug: 'minecraft/creeper-face', title: 'Creeper Face',
    kind: 'fan-art', version: 'Hand-drawn Creeper face fan art v1',
});
export const fanArtDescription = 'Hand-authored Creeper face fan art with a simplified green-and-black bead palette. The official Minecraft article is a character identity reference, not a licensed source file. This unofficial pattern is by Fuse Bead Patterns and is not approved by or associated with Mojang or Microsoft. Character rights belong to Mojang/Microsoft; permission for public redistribution is unconfirmed.';
export const fanArtSource = Object.freeze({
    type: 'character-reference', pageUrl: 'https://www.minecraft.net/en-us/article/meet-creeper',
    label: 'Minecraft: Meet the Creeper', character: 'Creeper', rightsHolder: 'Mojang/Microsoft',
    creationMethod: 'hand-authored-bead-grid', sourceTextureUsed: false, unofficial: true,
    redistributionPermission: 'unconfirmed',
});
const publishedCount = 109;
// Complete independently recorded 95dc05c catalog. Never refresh this from a candidate.
const publishedHash = 'b6e6888efb0c0f57a05bab287c80a2ae630e73ba56031ca8b569616472a92215';
// Independently authored rows reviewed on 2026-10-10; not derived from a PNG or candidate catalog.
export const reviewedFanArtRowsHash = '3f8f5a71b315af5efae7bd50ea8fc1c681e9ccf7bd1793886e4a592fb752576e';

function assertFrozenBaseline(catalog) {
    if (catalog.patterns.length !== publishedCount
        || createHash('sha256').update(JSON.stringify(catalog)).digest('hex') !== publishedHash) {
        throw new Error('The complete published 95dc05c 109 catalog baseline changed; do not replace its independent lock.');
    }
}

export function fanArtPublishedCatalogBaseline(catalog) {
    const recorded = catalog.patterns.filter(pattern => pattern.id === fanArtAddition.id);
    if (recorded.length > 1 || catalog.patterns.length !== publishedCount + recorded.length) {
        throw new Error('Expected the frozen 109 catalog plus at most one recorded Creeper fan-art entry.');
    }
    const published = { collections: catalog.collections, patterns: catalog.patterns.filter(pattern => pattern.id !== fanArtAddition.id) };
    assertFrozenBaseline(published);
    return published;
}

export function assembleFanArtPromotion(current, collections, reconstructed, ids) {
    if (!isDeepStrictEqual(ids, [fanArtAddition.id])) throw new Error('Fan-art mode requires only the explicit reviewed Creeper ID.');
    const published = fanArtPublishedCatalogBaseline(current);
    if (!isDeepStrictEqual(collections, published.collections) || new Set(reconstructed.map(pattern => pattern.id)).size !== reconstructed.length
        || reconstructed.length !== publishedCount + 1) throw new Error('Fan-art reconstruction must retain all 109 entries, collections and unique IDs.');
    const byId = new Map(reconstructed.map(pattern => [pattern.id, pattern]));
    const existing = current.patterns.map(pattern => byId.get(pattern.id));
    if (!isDeepStrictEqual(existing, current.patterns) || JSON.stringify(existing) !== JSON.stringify(current.patterns)) {
        throw new Error('Every published 109 object and recorded fan-art entry must remain unchanged, including fields and order.');
    }
    const candidate = byId.get(fanArtAddition.id);
    if (!candidate || candidate.kind !== 'fan-art' || candidate.slug !== fanArtAddition.slug || candidate.title !== fanArtAddition.title
        || candidate.version !== fanArtAddition.version || candidate.source?.kind !== 'fan-art'
        || candidate.source.url !== fanArtSource.pageUrl || candidate.source.description !== fanArtDescription
        || candidate.source.label !== fanArtSource.label || candidate.source.rightsHolder !== fanArtSource.rightsHolder
        || candidate.source.permission !== 'unconfirmed') throw new Error('Creeper must retain its explicit fan-art identity and non-null, unconfirmed source record.');
    const patterns = current.patterns.some(pattern => pattern.id === fanArtAddition.id) ? existing : [...existing, candidate];
    assertFrozenBaseline({ collections, patterns: patterns.filter(pattern => pattern.id !== fanArtAddition.id) });
    return patterns;
}

export function validateFanArtEditorial(pattern, entry) {
    if (pattern.id !== fanArtAddition.id || pattern.kind !== 'fan-art'
        || entry.id !== fanArtAddition.id || entry.kind !== 'fan-art' || entry.slug !== fanArtAddition.slug
        || entry.title !== fanArtAddition.title || entry.version !== fanArtAddition.version
        || !isDeepStrictEqual(entry.reference, { version: fanArtAddition.version, label: fanArtSource.label, description: fanArtDescription })) {
        throw new Error('Fan-art editorial content must retain the reviewed Creeper identity and honest character-reference disclosure.');
    }
}

export async function assertFanArtPackPdfReady(input, source) {
    if (source.state !== 'private-reviewed-fan-art-sourcepack' || !Array.isArray(source.pendingPdfFiles) || source.pendingPdfFiles.length) {
        throw new Error('Fan-art sourcepack PDFs are pending review; check-only is not approval and promotion is blocked.');
    }
    // The fan-art download contract is four languages, each with A4 and Letter.
    // A reviewed English pair cannot stand in for the six native-language files.
    const requiredFiles = ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf',
        ...['de', 'fr', 'ja'].flatMap(locale => [`localized-pdfs/${locale}/pattern.pdf`, `localized-pdfs/${locale}/pattern-letter.pdf`])];
    for (const file of requiredFiles) {
        if (!Array.isArray(source.reviewedPdfFiles) || !source.reviewedPdfFiles.includes(file)) throw new Error(`Fan-art sourcepack has no reviewed PDF record: ${file}`);
        let bytes;
        try { bytes = await readFile(path.join(input, file)); } catch (error) { throw new Error(`Missing reviewed fan-art PDF: ${file}`, { cause: error }); }
        if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error(`Invalid reviewed fan-art PDF: ${file}`);
    }
}

export function validateFanArtPerlerProject(pattern, project, perlerRows) {
    if (pattern.id !== fanArtAddition.id || pattern.kind !== 'fan-art' || pattern.title !== fanArtAddition.title
        || pattern.slug !== fanArtAddition.slug || pattern.version !== fanArtAddition.version || !isDeepStrictEqual(pattern.source, fanArtSource)) {
        throw new Error('Fan-art must retain its authored-grid provenance, named character reference and unconfirmed redistribution permission.');
    }
    if (pattern.width !== 29 || pattern.height !== 29 || !Array.isArray(pattern.rows) || pattern.rows.length !== 29
        || pattern.rows.some(row => typeof row !== 'string' || row.length !== 29 || /[^.GKH]/.test(row))
        || createHash('sha256').update(JSON.stringify(pattern.rows)).digest('hex') !== reviewedFanArtRowsHash) {
        throw new Error('Fan-art rows must match the independently reviewed 29 × 29 Creeper face grid.');
    }
    const draft = project.draft;
    if (project.type !== 'bead-pattern-project-v1' || project.version !== 1 || draft?.version !== 1
        || !isDeepStrictEqual(draft.selectedPaletteIds, ['perler']) || draft.boardId !== 'midi' || draft.boardWidth !== 1 || draft.boardHeight !== 1
        || draft.sourceMode !== 'blank' || draft.imageSrc !== null || draft.fileName !== pattern.id || draft.pdfScaleMode !== 'midi-5mm') {
        throw new Error('Fan-art must use its hand-authored Perler Midi project on one board.');
    }
    const colours = Object.entries(pattern.palette ?? {});
    if (!isDeepStrictEqual(colours.map(([symbol]) => symbol), ['G', 'K', 'H']) || pattern.colorCount !== 3) throw new Error('Fan-art must retain the reviewed green, black and light-green palette.');
    const expectedRefs = { G: '80-19080', K: '80-19018', H: '80-19061' };
    const perler = new Map(perlerRows.map(row => [row[0], row]));
    const pixels = Buffer.alloc(29 * 29 * 4), counts = new Map(), occupied = [];
    pattern.rows.forEach((row, y) => [...row].forEach((symbol, x) => {
        if (symbol === '.') return;
        const colour = pattern.palette[symbol];
        if (!colour || !Array.isArray(colour.rgb) || colour.rgb.length !== 3) throw new Error(`Unknown fan-art row colour: ${symbol}`);
        pixels.set([...colour.rgb, 255], (y * 29 + x) * 4);
        counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
        occupied.push([x, y]);
    }));
    for (const [symbol, colour] of colours) {
        const canonical = perler.get(colour.ref), rgb = canonical?.slice(3, 6).map(Number);
        if (colour.symbol !== symbol || colour.ref !== expectedRefs[symbol] || !canonical || canonical[1] !== colour.name
            || !isDeepStrictEqual(rgb, colour.rgb) || colour.hex !== '#' + rgb.map(value => value.toString(16).padStart(2, '0')).join('')
            || counts.get(symbol) !== colour.count) throw new Error(`Fan-art Perler palette or material count changed: ${symbol}`);
    }
    const xs = occupied.map(([x]) => x), ys = occupied.map(([, y]) => y);
    const bounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
    if (occupied.length !== 256 || pattern.beads !== 256 || bounds.width !== 16 || bounds.height !== 16 || !isDeepStrictEqual(pattern.bounds, bounds)
        || pattern.components !== 1 || pattern.requiresBacking !== false || !isDeepStrictEqual(pattern.weakBridges, [])) {
        throw new Error('Fan-art face must remain the reviewed solid 16 × 16 motif, with accurate material and shape notes.');
    }
    const edited = draft.editedPattern;
    if (edited?.width !== 29 || edited.height !== 29 || edited.byteLength !== pixels.length || typeof edited.data !== 'string'
        || Buffer.from(edited.data, 'base64').toString('base64') !== edited.data || !Buffer.from(edited.data, 'base64').equals(pixels)) {
        throw new Error('Fan-art project pixels must exactly match its authored rows, including empty RGBA cells.');
    }
    const entries = colours.map(([, colour]) => ({ name: colour.name, ref: colour.ref, symbol: colour.symbol, prefix: 'P', enabled: true, color: { r: colour.rgb[0], g: colour.rgb[1], b: colour.rgb[2], a: 255 } }));
    if (!isDeepStrictEqual(draft.activePalettes, [{ name: 'Perler Midi', entries }])) throw new Error('Fan-art project palette must exactly match the reviewed Perler row colours.');
}

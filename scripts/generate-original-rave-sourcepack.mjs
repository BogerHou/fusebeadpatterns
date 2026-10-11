/** Independent drawings on an empty grid. Creates one private source pack; no public files or PDFs. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url), sharp = require('sharp'), ts = require('typescript');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SIZE = 29;
const DATE = '2026-10-11', PACK = 'original-rave-v1', BACKGROUND = [221, 216, 202];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const empty = () => Array.from({ length: SIZE }, () => Array(SIZE).fill('.'));
const rows = grid => grid.map(row => row.join(''));
const span = (grid, y, left, right, symbol) => { for (let x = left; x <= right; x++) grid[y][x] = symbol; };

// Symbols are our own chart key; the references and RGB below come from the existing Midi CSV.
const COLORS = {
    B: { ref: '80-19018', name: 'Black', rgb: [50, 50, 52] },
    K: { ref: '80-19061', name: 'Kiwi Lime', rgb: [105, 184, 69] },
    S: { ref: '80-19053', name: 'Pastel Green', rgb: [109, 204, 148] },
    G: { ref: '80-19080', name: 'Green', rgb: [77, 171, 100] },
    R: { ref: '80-15211', name: 'Tomato', rgb: [209, 67, 55] },
    O: { ref: '80-19004', name: 'Orange', rgb: [235, 123, 49] },
    Y: { ref: '80-19003', name: 'Yellow', rgb: [231, 206, 62] },
    L: { ref: '80-19009', name: 'Light Blue', rgb: [39, 140, 201] },
    P: { ref: '80-19007', name: 'Purple', rgb: [104, 75, 134] },
    C: { ref: '80-19056', name: 'Pastel Yellow', rgb: [233, 226, 144] },
    M: { ref: '80-19038', name: 'Magenta', rgb: [224, 66, 132] },
    W: { ref: '80-19001', name: 'White', rgb: [234, 239, 238] },
};

function outline(grid) {
    const before = grid.map(row => [...row]);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (before[y][x] !== '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => before[y + dy]?.[x + dx] === undefined || before[y + dy][x + dx] === '.')) grid[y][x] = 'B';
    }
}

function alienRows() {
    const grid = empty();
    const widths = [[11, 17], [9, 19], [7, 21], [6, 22], ...Array.from({ length: 7 }, () => [5, 23]), [6, 22], [7, 21], [8, 20], [9, 19], [10, 18], [11, 17], [12, 16], [12, 16], [13, 15]];
    widths.forEach(([left, right], i) => span(grid, i + 3, left, right, 'K'));
    outline(grid);
    // Shade and glint are independently placed, then mirror two long almond-shaped black eyes.
    for (let y = 5; y <= 17; y++) for (let x = 5; x < 24; x++) if (grid[y][x] === 'K' && grid[y][x + 1] === 'B') grid[y][x] = 'G';
    for (const [y, left, right] of [[5, 9, 12], [6, 8, 10], [7, 7, 9], [8, 7, 8]]) span(grid, y, left, right, 'S');
    [[8, 10], [7, 11], [7, 11], [8, 12], [9, 12], [10, 12], [11, 12]].forEach(([left, right], i) => {
        span(grid, i + 9, left, right, 'B');
        span(grid, i + 9, SIZE - 1 - right, SIZE - 1 - left, 'B');
    });
    span(grid, 19, 13, 15, 'B');
    return rows(grid);
}

function smileyRows() {
    const grid = empty();
    const band = y => y <= 7 ? 'R' : y <= 10 ? 'O' : y <= 14 ? 'Y' : y <= 18 ? 'K' : y <= 21 ? 'L' : 'P';
    // Symmetric stepped circle avoids the one-pixel spikes produced by a strict Euclidean radius.
    const widths = [7, 11, 15, 17, 19, 21, 21, ...Array(9).fill(23), 21, 21, 19, 17, 15, 11, 7];
    widths.forEach((width, i) => span(grid, i + 3, 14 - (width - 1) / 2, 14 + (width - 1) / 2, band(i + 3)));
    outline(grid);
    for (const center of [9, 19]) {
        grid[10][center] = 'B';
        for (let y = 11; y <= 13; y++) span(grid, y, center - 1, center + 1, 'B');
    }
    for (const [y, left, right] of [[16, 8, 8], [17, 8, 9], [18, 9, 11]]) {
        span(grid, y, left, right, 'B'); span(grid, y, 28 - right, 28 - left, 'B');
    }
    span(grid, 19, 11, 17, 'B'); span(grid, 20, 12, 16, 'B');
    return rows(grid);
}

function moonMushroomRows() {
    const grid = empty();
    // A freehand geometric crescent occupies the upper-left, with the mushroom overlapping its lower arc.
    for (let y = 2; y <= 19; y++) for (let x = 2; x <= 20; x++) {
        if ((x - 11) ** 2 + (y - 10) ** 2 <= 8.4 ** 2 && (x - 15) ** 2 + (y - 8) ** 2 > 7.1 ** 2) grid[y][x] = 'C';
    }
    outline(grid);
    // Stem first, cap last. Both use wide connected spans, not a separate floating star or moon.
    for (let y = 18; y <= 25; y++) span(grid, y, 15, 21, 'W');
    span(grid, 26, 14, 22, 'W');
    for (let y = 20; y <= 25; y++) { grid[y][15] = 'B'; grid[y][21] = 'B'; }
    span(grid, 26, 14, 22, 'B'); grid[25][14] = 'B'; grid[25][22] = 'B';
    const cap = [[15, 21], [12, 24], [10, 26], [9, 27], [9, 27], [9, 27], [10, 26], [11, 25]];
    const mushroom = empty();
    cap.forEach(([left, right], i) => span(mushroom, i + 12, left, right, 'P'));
    outline(mushroom);
    for (let y = 12; y <= 19; y++) for (let x = 0; x < SIZE; x++) if (mushroom[y][x] !== '.') grid[y][x] = mushroom[y][x];
    // Three intentionally different spot sizes; their coordinates do not trace any external drawing.
    for (const [y, left, right] of [[14, 16, 18], [15, 15, 19], [16, 16, 18], [16, 11, 12], [17, 11, 13], [16, 23, 25], [17, 23, 25]]) span(grid, y, left, right, 'M');
    return rows(grid);
}

export const DEFINITIONS = [
    { id: 'original-rave-alien-head', slug: 'alien-head', title: 'Alien Head', titleZh: '外星人头像', localizedSubjects: { de: 'Alien-Kopf', fr: 'Tête d’alien', ja: 'エイリアンの顔' }, symbols: ['B', 'K', 'S', 'G'], rows: alienRows(), description: 'An original lime-green alien head with long black almond eyes.', designMethod: 'Independent tapered row spans on an empty square grid, paired long almond eyes, forehead highlights and an edge shade; no artist mask or named-character source.' },
    { id: 'original-rave-rainbow-smiley', slug: 'rainbow-smiley', title: 'Rainbow Smiley', titleZh: '彩虹笑脸', localizedSubjects: { de: 'Regenbogen-Smiley', fr: 'Smiley arc-en-ciel', ja: '虹色スマイル' }, symbols: ['B', 'R', 'O', 'Y', 'K', 'L', 'P'], rows: smileyRows(), description: 'An original round smiley with six horizontal rainbow bands and a black smiling face.', designMethod: 'Independent symmetric stepped circle row spans, six hand-chosen horizontal color bands, paired eyes and a symmetric curved smile; no third-party emoji or logo pixels.' },
    { id: 'original-rave-moon-mushroom', slug: 'crescent-moon-mushroom', title: 'Crescent Moon Mushroom', titleZh: '月亮蘑菇', localizedSubjects: { de: 'Mondsichel mit Pilz', fr: 'Croissant de lune et champignon', ja: '三日月ときのこ' }, symbols: ['B', 'C', 'P', 'M', 'W'], rows: moonMushroomRows(), description: 'An original pale crescent behind a purple mushroom with magenta cap spots and a white stem.', designMethod: 'Independent geometric crescent and hand-drawn connected mushroom row spans, overlapped at the lower crescent arc; spots and stem are authored here. No Infected Mushroom artist mark or external pattern pixels.' },
];

function actualPath(output) {
    let parent = output; const missing = [];
    while (!fs.existsSync(parent)) { missing.unshift(path.basename(parent)); const next = path.dirname(parent); assert.notEqual(next, parent); parent = next; }
    return path.join(fs.realpathSync(parent), ...missing);
}
function privateLocation(output) {
    const resolved = path.resolve(output);
    for (const candidate of [resolved, actualPath(resolved)]) {
        const parts = candidate.split(path.sep);
        assert.deepEqual(parts.slice(-4), ['artifacts', 'pattern-samples', DATE, PACK], 'Use the versioned private artifacts/pattern-samples/2026-10-11/original-rave-v1 directory');
        assert.ok(!parts.includes('public'), 'Never generate a private source pack in public');
    }
    for (let ancestor = resolved; ; ancestor = path.dirname(ancestor)) {
        if (fs.existsSync(ancestor)) assert.ok(!fs.lstatSync(ancestor).isSymbolicLink(), 'Source-pack path symlinks are not allowed');
        if (path.dirname(ancestor) === ancestor) break;
    }
    return resolved;
}
function gitIgnored(output) {
    let parent = path.dirname(actualPath(output));
    while (!fs.existsSync(path.join(parent, '.git'))) { const next = path.dirname(parent); assert.notEqual(next, parent, 'Output must belong to a Git-ignored project'); parent = next; }
    assert.equal(spawnSync('git', ['check-ignore', '--quiet', '--', actualPath(output)], { cwd: parent }).status, 0, 'The private source pack must be Git ignored');
}
export function options(args) {
    let output, checkOnly = false;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--check-only') { assert.equal(checkOnly, false); checkOnly = true; }
        else if (args[i] === '--output') { assert.equal(output, undefined); output = args[++i]; assert.ok(output && !output.startsWith('--'), 'Missing --output'); }
        else throw new Error(`Unknown option: ${args[i]}`);
    }
    assert.ok(output, 'Specify --output with the canonical private source-pack directory');
    return { output: privateLocation(path.resolve(repo, output)), checkOnly };
}
export function components(cells, omitted) {
    const remaining = new Set(cells); remaining.delete(omitted); const sizes = [];
    while (remaining.size) {
        const first = remaining.values().next().value; remaining.delete(first); const queue = [first];
        for (const cell of queue) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const x = cell % SIZE + dx, y = Math.floor(cell / SIZE) + dy, next = y * SIZE + x;
            if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || !remaining.has(next)) continue;
            remaining.delete(next); queue.push(next);
        }
        sizes.push(queue.length);
    }
    return sizes.sort((a, b) => b - a);
}
export function designs() {
    const csvBytes = fs.readFileSync(path.join(repo, 'public/palettes/perler.csv'));
    const csv = new Map(csvBytes.toString().trim().split(/\r?\n/).map(line => { const [ref, name, , ...rest] = line.split(','); return [ref, { ref, name, rgb: rest.slice(0, 3).map(Number) }]; }));
    return DEFINITIONS.map(definition => {
        assert.equal(definition.rows.length, SIZE); assert.ok(definition.rows.every(row => row.length === SIZE));
        assert.ok(definition.symbols.length <= 7);
        const palette = {}, occupied = new Set(), rgba = Buffer.alloc(SIZE * SIZE * 4);
        for (const symbol of definition.symbols) {
            const expected = COLORS[symbol]; assert.deepEqual(csv.get(expected.ref), expected, `Changed Perler CSV color ${symbol}`);
            const count = definition.rows.join('').split(symbol).length - 1; assert.ok(count > 0);
            palette[symbol] = { symbol, ...expected, hex: '#' + Buffer.from(expected.rgb).toString('hex'), count };
        }
        definition.rows.forEach((row, y) => [...row].forEach((symbol, x) => {
            if (symbol === '.') return;
            assert.ok(palette[symbol], `Unexpected chart symbol ${symbol}`); occupied.add(y * SIZE + x);
            rgba.set([...palette[symbol].rgb, 255], (y * SIZE + x) * 4);
        }));
        const parts = components(occupied); assert.equal(parts.length, 1, `${definition.title} must be digitally four-connected`);
        const weakBridges = [...occupied].filter(cell => components(occupied, cell).length > 1).map(cell => ({ row: Math.floor(cell / SIZE) + 1, column: cell % SIZE + 1 }));
        const xs = [...occupied].map(i => i % SIZE), ys = [...occupied].map(i => Math.floor(i / SIZE));
        const bounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
        const pattern = { ...definition, kind: 'original', version: 'Original Rave design v1', theme: 'Rave', source: null,
            width: SIZE, height: SIZE, palette, materials: Object.values(palette), beads: occupied.size, colorCount: definition.symbols.length, bounds,
            components: parts.length, requiresBacking: false, fragile: weakBridges.length > 0, weakBridges,
            requiresBackingMeaning: 'Legacy digital multi-part layout flag only; false is not a physical strength claim',
            topology: { model: 'Orthogonal grid adjacency only; not a fused-joint strength prediction', components: parts.length, componentSizes: parts, singleBeadCutPoints: weakBridges.length },
            nominalLayout: { pitchMm: 5, widthMm: bounds.width * 5, heightMm: bounds.height * 5, meaning: 'Nominal grid footprint, not a measured cooled finished size' },
            intendedUse: 'A flat original rave-themed digital pattern; no verified pendant, bracelet attachment, wearability, strength, age-suitability or making-time claim',
            physicalAssemblyTested: false, ironingTested: false, hangingTested: false, loadStrengthTested: false,
            validation: { grid: 'passed', palette: 'existing-project-perler-csv', paletteCsvSha256: sha(csvBytes), designRowsSha256: sha(definition.rows.join('\n')), rgbaSha256: sha(rgba), namedCharacter: false, officialPatternCopied: false },
        };
        return { pattern, rgba };
    });
}

export function art(pattern, origin = 0, cell = 20) {
    return pattern.rows.flatMap((row, y) => [...row].flatMap((symbol, x) => symbol === '.' ? [] : [`<rect x="${origin + x * cell}" y="${origin + y * cell}" width="${cell}" height="${cell}" fill="${pattern.palette[symbol].hex}"/>`])).join('');
}
export function previewSvg(pattern) { return `<svg xmlns="http://www.w3.org/2000/svg" width="580" height="580"><rect width="580" height="580" fill="#ddd8ca"/><g shape-rendering="crispEdges">${art(pattern)}</g></svg>`; }
export function chartSvg(pattern) {
    const margin = 46, cell = 24, edge = margin + SIZE * cell;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="788" height="1040"><rect width="100%" height="100%" fill="white"/><g shape-rendering="crispEdges">${art(pattern, margin, cell)}</g>`;
    for (let i = 0; i <= SIZE; i++) { const pos = margin + i * cell, major = i % 5 === 0 || i === SIZE; svg += `<path d="M${pos},${margin}V${edge}M${margin},${pos}H${edge}" stroke="${major ? '#53635b' : '#a4afa7'}" stroke-width="${major ? 1.3 : .6}"/>`; }
    svg += '<g font-family="Arial,sans-serif" font-size="10" text-anchor="middle" fill="#26352d">';
    for (let i = 0; i < SIZE; i++) svg += `<text x="${margin + (i + .5) * cell}" y="32">${i + 1}</text><text x="28" y="${margin + (i + .5) * cell + 3}">${i + 1}</text>`;
    pattern.rows.forEach((row, y) => [...row].forEach((symbol, x) => { if (symbol === '.') return; const rgb = pattern.palette[symbol].rgb, luminance = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]; svg += `<text x="${margin + (x + .5) * cell}" y="${margin + (y + .5) * cell + 3}" fill="${luminance < 140 ? 'white' : '#17231b'}">${symbol}</text>`; }));
    // Keep the only explanatory group at the end so native footers can replace it without altering the drawing.
    svg += `</g><g font-family="Arial,sans-serif" fill="#26352d"><text x="46" y="796" font-size="19">${esc(pattern.title)} - ${pattern.beads} beads / ${pattern.colorCount} colors</text><text x="46" y="818" font-size="13">${pattern.bounds.width} x ${pattern.bounds.height} motif on a 29 x 29 MIDI board. Empty cells: no bead.</text>`;
    pattern.materials.forEach((color, i) => { svg += `<text x="46" y="${846 + i * 22}" font-size="12">${esc(color.symbol)}: ${esc(color.name)} ${esc(color.ref)} (${color.count})</text>`; });
    return svg + '<text x="46" y="1004" font-size="12">Original drawing. Physical assembly, ironing and hanging untested.</text><text x="46" y="1024" font-size="12">Counting PNG only; not a calibrated actual-size placement template.</text></g></svg>';
}
function project({ pattern, rgba }) {
    return { type: 'bead-pattern-project-v1', version: 1, savedAt: `${DATE}T00:00:00.000Z`, draft: {
        version: 1, sourceMode: 'blank', imageSrc: null, fileName: pattern.id, selectedPaletteIds: ['perler'],
        activePalettes: [{ name: 'Perler Midi', entries: pattern.materials.map(color => ({ name: color.name, ref: color.ref, symbol: color.symbol, prefix: 'P', enabled: true, color: { r: color.rgb[0], g: color.rgb[1], b: color.rgb[2], a: 255 } })) }],
        boardId: 'midi', boardWidth: 1, boardHeight: 1, matchingId: 'delta_e_cie2000', ditheringId: 'none', useSymbols: true,
        exportFormatId: 'pdf', pdfScaleMode: 'midi-5mm', imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: true }, showReference: false, referenceOpacity: .3, previewZoom: 1,
        editedPattern: { width: SIZE, height: SIZE, byteLength: rgba.length, data: rgba.toString('base64') },
    } };
}
let editor;
function editorModule() {
    if (editor) return editor; const cache = new Map();
    function load(file) {
        if (cache.has(file)) return cache.get(file);
        const loadedModule = { exports: {} }; cache.set(file, loadedModule.exports);
        const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
        const localRequire = name => { let target = name.startsWith('@/') ? path.resolve(repo, 'src', name.slice(2)) : path.resolve(path.dirname(file), name); if (!fs.existsSync(target)) target += '.ts'; return load(target); };
        vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, require: localRequire, atob, btoa, Uint8ClampedArray, console }, { filename: file }); return loadedModule.exports;
    }
    editor = load(path.join(repo, 'src/lib/editor/draft.ts')); return editor;
}
function verifyProject(bytes, expected) {
    assert.deepEqual(JSON.parse(bytes.toString()), project(expected), 'Project differs from exact source');
    const editorApi = editorModule(), draft = editorApi.parseEditorProject(bytes.toString()); assert.ok(draft, 'Real editor parser rejected project');
    assert.ok(Buffer.from(editorApi.decodeEditorPatternDraft(draft.editedPattern)).equals(expected.rgba), 'Editor decoded pixels differ');
    assert.deepEqual(editorApi.parseEditorProject(editorApi.serializeEditorProject(draft)), draft, 'Editor serialize/reparse changed project');
}
function siteEntries(expected) { return expected.map(({ pattern }) => ({ id: pattern.id, slug: pattern.slug, title: pattern.title, kind: 'original', version: pattern.version, description: pattern.description,
    notes: ['Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.', 'An independent original drawing; no artist logo or named character.', 'Perler screen colors are approximate.', 'The PNG chart is for counting, not actual-size placement.', 'Physical assembly, ironing, hanging and wearability have not been tested.'] })); }
function assetMapping() { return { state: 'private-candidate-not-published', patterns: DEFINITIONS.map(({ id }) => ({ id, files: { 'preview.png': `previews/${id}.png`, 'grid.png': `charts/${id}.png`, 'grid.svg': `charts/${id}.svg`, 'pixels.png': `pixels/${id}.png`, 'pattern.bead-pattern.json': `projects/${id}.bead-pattern.json` }, pendingFiles: { 'pattern.pdf': `pdfs/${id}.pdf`, 'pattern-letter.pdf': `pdfs/${id}-us-letter.pdf` } })), pendingPdfReferences: ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf'] }; }
function manifest(expected) { return { createdAt: DATE, state: 'private-original-grid-candidate-pdf-pending', paletteSource: 'public/palettes/perler.csv; physical colors not independently measured', patterns: expected.map(({ pattern }) => pattern) }; }
function readme() { return '# Original Rave v1 source pack\n\nThree independent drawings started on an empty 29 x 29 Midi square grid: Alien Head, Rainbow Smiley, and Crescent Moon Mushroom. Geometric shapes, facial features, spots and row spans are authored by this script. No external pixels, traced artwork, artist logos, named characters, image conversion or generative raster images are used. Community references establish subject demand only and are not drawing sources.\n\nThis is a private, Git-ignored digital source pack. The actual Perler references, names and RGB match the current project CSV; occupied alpha is 255 and every empty pixel is [0,0,0,0]. Materials, bounds, exact rows, pixel hashes and digital topology are recorded in manifest.json. Native 29 x 29 pixel PNG, 580 x 580 preview, editable project, and 788 x 1040 numbered symbol chart all derive from the same rows. The final standalone SVG group is the English footer; the drawing and coordinates can be preserved for later native footers.\n\nOne digital connected component is not proof of fused strength or wearability. Single-bead cut points are reported, not hidden. Physical assembly, ironing, hanging and load strength have not been tested. Nominal 5 mm grid footprints are not measured cooled finished sizes. No pendant, necklace, bracelet attachment, age-suitability, making-time or durability claim is made.\n\nFive non-PDF assets per drawing map to future public names in candidate-assets.json. A4/US Letter PDF paths are pending placeholders only, not actual verified downloads. Counting charts are not calibrated actual-size placement templates. No public assets, catalog, application, locale, fonts or PDFs are written here.\n\nGenerate once with scripts/generate-original-rave-sourcepack.mjs --output <canonical ignored artifacts/pattern-samples/2026-10-11/original-rave-v1 directory>. Use --check-only thereafter; existing output is never replaced. Readback checks exact metadata, all preview pixels, native RGBA, SVG/PNG identity and real editor parse/decode/serialize/reparse. Extra entries and symlinks are rejected. qa/sourcepack-checks.json records digital checks, without visual, publication or physical approval. Root performs independent visual review and freezes the final hashes separately.\n'; }
const assetFiles = ['manifest.json', 'site-entries.json', 'candidate-assets.json', 'README.md', ...DEFINITIONS.flatMap(({ id }) => [`pixels/${id}.png`, `previews/${id}.png`, `charts/${id}.png`, `charts/${id}.svg`, `projects/${id}.bead-pattern.json`])];
function inventory(output, prefix = '') {
    return fs.readdirSync(path.join(output, prefix), { withFileTypes: true }).flatMap(entry => {
        assert.ok(!entry.isSymbolicLink(), 'Source-pack symlinks are not allowed'); const file = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) { assert.ok(['pixels', 'previews', 'charts', 'projects', 'qa'].includes(file), 'Unexpected source-pack directory'); return inventory(output, file); }
        assert.ok(entry.isFile(), 'Source-pack entries must be regular files'); return [file];
    }).sort();
}
export async function checkArtifacts(output, expected = designs(), requireQa = true) {
    output = privateLocation(output); gitIgnored(output);
    assert.deepEqual(inventory(output), [...assetFiles, ...(requireQa ? ['qa/sourcepack-checks.json'] : [])].sort(), 'Source-pack file inventory differs');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'))), manifest(expected), 'Manifest differs from source');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'site-entries.json'))), siteEntries(expected), 'Site entries differ');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'candidate-assets.json'))), assetMapping(), 'Candidate assets differ');
    assert.equal(fs.readFileSync(path.join(output, 'README.md'), 'utf8'), readme(), 'README differs');
    for (const item of expected) {
        const { pattern, rgba } = item, id = pattern.id;
        const pixel = await sharp(path.join(output, 'pixels', `${id}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.equal(pixel.info.width, SIZE); assert.equal(pixel.info.height, SIZE); assert.ok(pixel.data.equals(rgba), 'Native pixel PNG differs, including all-zero transparency');
        verifyProject(fs.readFileSync(path.join(output, 'projects', `${id}.bead-pattern.json`)), item);
        const preview = await sharp(path.join(output, 'previews', `${id}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.equal(preview.info.width, 580); assert.equal(preview.info.height, 580);
        for (let y = 0; y < 580; y++) for (let x = 0; x < 580; x++) {
            const symbol = pattern.rows[Math.floor(y / 20)][Math.floor(x / 20)], expectedColor = [...(symbol === '.' ? BACKGROUND : pattern.palette[symbol].rgb), 255];
            for (let c = 0; c < 4; c++) assert.equal(preview.data[(y * 580 + x) * 4 + c], expectedColor[c], 'Preview differs from grid');
        }
        const svg = fs.readFileSync(path.join(output, 'charts', `${id}.svg`), 'utf8'); assert.equal(svg, chartSvg(pattern), 'Chart SVG differs');
        const png = await sharp(path.join(output, 'charts', `${id}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.equal(png.info.width, 788); assert.equal(png.info.height, 1040);
        assert.ok(png.data.equals(await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer()), 'Chart PNG differs from SVG');
    }
    const report = { checkedAt: DATE, state: 'private-digital-source-verified', patterns: expected.map(({ pattern }) => ({ id: pattern.id, beads: pattern.beads, colorCount: pattern.colorCount, bounds: pattern.bounds, topology: pattern.topology, rowsSha256: pattern.validation.designRowsSha256, rgbaSha256: pattern.validation.rgbaSha256, materials: pattern.materials })),
        pixelPngEqualsProjectEqualsManifest: true, emptyPixelRgbaAllZero: true, allPreviewPixelsMatchGrid: true, chartPngEqualsSvg: true, realEditorParse: true, realEditorSerializeReparse: true,
        physicalAssemblyTested: false, ironingTested: false, hangingTested: false, loadStrengthTested: false, pdfVerification: 'Not performed; separate PDF authoring required',
        fileSha256: Object.fromEntries(assetFiles.map(file => [file, sha(fs.readFileSync(path.join(output, file)))])),
    };
    if (requireQa) assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'qa/sourcepack-checks.json'))), report, 'Preserved digital QA differs');
    return report;
}
export async function generate(output) {
    output = privateLocation(output); gitIgnored(output); assert.ok(!fs.existsSync(output), 'Source-pack directory exists; use --check-only');
    const expected = designs(), files = { 'manifest.json': json(manifest(expected)), 'site-entries.json': json(siteEntries(expected)), 'candidate-assets.json': json(assetMapping()), 'README.md': readme() };
    for (const item of expected) {
        const { pattern, rgba } = item, id = pattern.id; verifyProject(Buffer.from(json(project(item))), item);
        files[`pixels/${id}.png`] = await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer();
        files[`previews/${id}.png`] = await sharp(Buffer.from(previewSvg(pattern))).png().toBuffer();
        files[`charts/${id}.svg`] = chartSvg(pattern); files[`charts/${id}.png`] = await sharp(Buffer.from(files[`charts/${id}.svg`])).png().toBuffer();
        files[`projects/${id}.bead-pattern.json`] = json(project(item));
    }
    fs.mkdirSync(path.dirname(output), { recursive: true }); fs.mkdirSync(output);
    for (const folder of ['pixels', 'previews', 'charts', 'projects', 'qa']) fs.mkdirSync(path.join(output, folder));
    for (const [relative, bytes] of Object.entries(files)) fs.writeFileSync(path.join(output, relative), bytes, { flag: 'wx' });
    const report = await checkArtifacts(output, expected, false);
    fs.writeFileSync(path.join(output, 'qa/sourcepack-checks.json'), json(report), { flag: 'wx' });
    return checkArtifacts(output, expected);
}
async function main() { const { output, checkOnly } = options(process.argv.slice(2)); const report = checkOnly ? await checkArtifacts(output) : await generate(output); console.log(json({ output, mode: checkOnly ? 'read-only-check' : 'generated-private-candidate', ...report })); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

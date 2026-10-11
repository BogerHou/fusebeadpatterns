/** Independently authored Latin Cross v1; private source pack only, never public assets or PDFs. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ts = require('typescript');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ID = 'original-latin-cross';
const SLUG = 'cross', SIZE = 29, CREATED_AT = '2026-10-11';
const BACKGROUND = [221, 216, 202];
const ROWS_SHA256 = '0dab2c3f61bd9756001beb2b1cbd3f9ddb5530a35e714ea90e4f85fb87624322';
// Independent empty-grid union: vertical bar x=13..15,y=5..23 and horizontal bar
// x=8..20,y=10..12 (zero-based). Three-cell bars give five rows above and eleven below.
// No third-party pixels, pattern sampling, tracing or generated image is used.
export const ROWS = [
    '.............................',
    '.............................',
    '.............................',
    '.............................',
    '.............................',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '........BBBBBBBBBBBBB........',
    '........BBBBBBBBBBBBB........',
    '........BBBBBBBBBBBBB........',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............BBB.............',
    '.............................',
    '.............................',
    '.............................',
    '.............................',
    '.............................',
];
const MATERIALS = {
    B: { ref: '80-19012', name: 'Brown', rgb: [103, 76, 68], count: 87 },
};
const sha = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function actualPath(output) {
    let parent = output;
    const missing = [];
    while (!fs.existsSync(parent)) {
        missing.unshift(path.basename(parent));
        const next = path.dirname(parent);
        assert.notEqual(next, parent, 'Cannot resolve output location');
        parent = next;
    }
    return path.join(fs.realpathSync(parent), ...missing);
}

function privateLocation(output) {
    const resolved = path.resolve(output);
    const expectedSuffix = ['artifacts', 'pattern-samples', CREATED_AT, 'original-latin-cross-v1'];
    for (const candidate of [resolved, actualPath(resolved)]) {
        const parts = candidate.split(path.sep);
        assert.deepEqual(parts.slice(-4), expectedSuffix, 'Use the versioned artifacts/pattern-samples/2026-10-11/original-latin-cross-v1 directory');
        assert.ok(!parts.includes('public'), 'Never generate a private source pack in public, including through symlinks');
    }
    for (let ancestor = resolved; ; ancestor = path.dirname(ancestor)) {
        if (fs.existsSync(ancestor)) assert.ok(!fs.lstatSync(ancestor).isSymbolicLink(), 'Source-pack path symlinks are not allowed');
        if (path.dirname(ancestor) === ancestor) break;
    }
    return resolved;
}

function gitIgnored(output) {
    let parent = path.dirname(actualPath(output));
    while (!fs.existsSync(path.join(parent, '.git'))) {
        const next = path.dirname(parent);
        assert.notEqual(next, parent, 'CLI output must belong to a Git-ignored project artifacts directory');
        parent = next;
    }
    const result = spawnSync('git', ['check-ignore', '--quiet', '--', actualPath(output)], { cwd: parent });
    assert.equal(result.status, 0, 'The private source-pack output must be Git ignored');
}

export function options(args) {
    let output, checkOnly = false;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--check-only') {
            assert.equal(checkOnly, false, 'Duplicate --check-only');
            checkOnly = true;
        } else if (args[i] === '--output') {
            assert.equal(output, undefined, 'Duplicate --output');
            output = args[++i];
            assert.ok(output && !output.startsWith('--'), 'Missing --output directory');
        } else throw new Error(`Unknown option: ${args[i]}`);
    }
    assert.ok(output, 'Specify --output with the canonical private source-pack directory');
    return { output: privateLocation(path.resolve(repo, output)), checkOnly };
}

export function components(cells, omitted) {
    const remaining = new Set(cells);
    remaining.delete(omitted);
    const sizes = [];
    while (remaining.size) {
        const first = remaining.values().next().value;
        remaining.delete(first);
        const queue = [first];
        for (const cell of queue) {
            const x = cell % SIZE, y = Math.floor(cell / SIZE);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy, next = ny * SIZE + nx;
                if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || !remaining.has(next)) continue;
                remaining.delete(next);
                queue.push(next);
            }
        }
        sizes.push(queue.length);
    }
    return sizes.sort((a, b) => b - a);
}

export function design() {
    assert.equal(ROWS.length, SIZE);
    assert.ok(ROWS.every(row => row.length === SIZE && /^[.B]+$/.test(row)));
    assert.equal(sha(ROWS.join('\n')), ROWS_SHA256, 'Candidate rows changed; review the new rendered grid');
    const csvBytes = fs.readFileSync(path.join(repo, 'public/palettes/perler.csv'));
    const csv = new Map(csvBytes.toString('utf8').trim().split(/\r?\n/).map(line => {
        const [ref, name, , r, g, b] = line.split(',');
        return [ref, { ref, name, rgb: [r, g, b].map(Number) }];
    }));
    const palette = {};
    for (const [symbol, expected] of Object.entries(MATERIALS)) {
        const actual = csv.get(expected.ref);
        assert.deepEqual(actual, { ref: expected.ref, name: expected.name, rgb: expected.rgb }, `Changed Perler Midi color ${symbol}`);
        const count = ROWS.join('').split(symbol).length - 1;
        assert.equal(count, expected.count, `Material count changed: ${symbol}`);
        palette[symbol] = { ...actual, hex: `#${Buffer.from(actual.rgb).toString('hex')}`, symbol, count };
    }
    const occupied = new Set(), rgba = Buffer.alloc(SIZE * SIZE * 4);
    ROWS.forEach((row, y) => [...row].forEach((symbol, x) => {
        if (symbol === '.') return;
        occupied.add(y * SIZE + x);
        rgba.set([...palette[symbol].rgb, 255], (y * SIZE + x) * 4);
    }));
    assert.equal(occupied.size, 87);
    assert.deepEqual(components(occupied), [87]);
    const weakBridges = [...occupied].filter(cell => components(occupied, cell).length > 1)
        .map(cell => ({ row: Math.floor(cell / SIZE) + 1, column: cell % SIZE + 1 }));
    assert.deepEqual(weakBridges, [], 'The cross must have no single-bead digital cut points');
    const xs = [...occupied].map(i => i % SIZE), ys = [...occupied].map(i => Math.floor(i / SIZE));
    const bounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
    assert.deepEqual(bounds, { x: 8, y: 5, width: 13, height: 19 });
    assert.ok(bounds.width <= SIZE && bounds.height <= SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
        if (!occupied.has(i)) assert.ok(rgba.subarray(i * 4, i * 4 + 4).equals(Buffer.alloc(4)), 'Empty pixels must be all-zero RGBA');
    }
    const topology = {
        model: 'Orthogonal grid adjacency only; not a physical strength prediction',
        components: 1, singleBeadCutPoints: 0,
    };
    const pattern = {
        id: ID, slug: SLUG, title: 'Cross', titleZh: '十字架图纸', kind: 'original',
        version: 'Original Latin Cross design v1', theme: 'Shapes',
        localizedSubjects: { de: 'Kreuz', fr: 'Croix', ja: '十字架' },
        description: 'An original plain Latin/Christian cross with a short upper arm, longer lower arm and three-bead-thick bars.',
        descriptionZh: '原创普通平面Latin/Christian十字架，短上臂、长下臂，横竖杆均为三格厚。',
        source: null,
        designMethod: 'Independent explicit symbol rows started on an empty 29 x 29 square grid. The union of vertical bar x=13..15,y=5..23 and horizontal bar x=8..20,y=10..12 forms a 13 x 19 Latin cross at zero-based x=8,y=5. Both bars are three cells thick; five vertical rows lie above the horizontal bar and eleven below it. No external pixels, tracing, named character, image conversion or generated raster artwork.',
        sourceNoteZh: '从空白格阵独立绘制；未使用第三方像素、描图或生成式图片；普通Latin/Christian十字架，不是plus加号、cross-stitch针法或耶稣人物；未实物拼制或熨烫测试。',
        width: SIZE, height: SIZE, rows: ROWS, palette, materials: Object.values(palette), beads: 87, colorCount: 1, bounds,
        components: 1, requiresBacking: false, fragile: false, weakBridges, structureNotes: [], topology,
        requiresBackingMeaning: 'Legacy digital multi-part layout flag only; false is not a physical strength claim',
        nominalLayout: { pitchMm: 5, widthMm: 65, heightMm: 95, meaning: 'Nominal grid footprint, not a measured cooled finished size' },
        intendedUse: 'A flat ordinary Latin/Christian cross pattern, not a plus sign, cross-stitch technique or Jesus figure; no hanging, standing, wearable, durability, age-suitability or making-time claim',
        physicalAssemblyTested: false, ironingTested: false, hangingTested: false, loadStrengthTested: false,
        validation: {
            grid: 'passed', palette: 'existing-project-perler-csv', paletteCsvSha256: sha(csvBytes), designRowsSha256: ROWS_SHA256, rgbaSha256: sha(rgba),
            digitalFourConnectedComponents: 1, digitalSingleBeadCutPoints: 0, topologyModel: topology.model,
            physicalAssemblyTested: false, ironingTested: false, hangingTested: false, loadStrengthTested: false,
            officialPatternCopied: false, namedCharacter: false,
            visualReview: 'Pending root review of rendered PNG; no visual or publication approval recorded',
        },
    };
    return { pattern, rgba };
}

function art(pattern, origin, cell) {
    return pattern.rows.flatMap((row, y) => [...row].flatMap((symbol, x) => symbol === '.' ? [] :
        [`<rect x="${origin + x * cell}" y="${origin + y * cell}" width="${cell}" height="${cell}" fill="${pattern.palette[symbol].hex}"/>`])).join('');
}

function chartSvg(pattern) {
    const margin = 46, cell = 24, edge = margin + SIZE * cell;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="788" height="908"><rect width="100%" height="100%" fill="white"/><g shape-rendering="crispEdges">${art(pattern, margin, cell)}</g>`;
    for (let i = 0; i <= SIZE; i++) {
        const pos = margin + i * cell, major = i % 5 === 0 || i === SIZE;
        svg += `<path d="M${pos},${margin}V${edge}M${margin},${pos}H${edge}" stroke="${major ? '#53635b' : '#a4afa7'}" stroke-width="${major ? 1.3 : .6}"/>`;
    }
    svg += '<g font-family="Arial,sans-serif" font-size="10" text-anchor="middle" fill="#26352d">';
    for (let i = 0; i < SIZE; i++) svg += `<text x="${margin + (i + .5) * cell}" y="32">${i + 1}</text><text x="28" y="${margin + (i + .5) * cell + 3}">${i + 1}</text>`;
    pattern.rows.forEach((row, y) => [...row].forEach((symbol, x) => {
        if (symbol === '.') return;
        const color = pattern.palette[symbol], luminance = .2126 * color.rgb[0] + .7152 * color.rgb[1] + .0722 * color.rgb[2];
        svg += `<text x="${margin + (x + .5) * cell}" y="${margin + (y + .5) * cell + 3}" fill="${luminance < 140 ? 'white' : '#17231b'}">${symbol}</text>`;
    }));
    svg += '</g><g font-family="Arial,sans-serif" fill="#26352d"><text x="46" y="796" font-size="19">Cross - 87 beads / 1 color</text><text x="46" y="818" font-size="13">13 x 19 motif on a 29 x 29 MIDI board. Empty cells: no bead.</text>';
    Object.values(pattern.palette).forEach((color, i) => {
        svg += `<text x="${46 + i * 355}" y="840" font-size="12">${esc(color.symbol)}: ${esc(color.name)} ${esc(color.ref)} (${color.count})</text>`;
    });
    return svg + '<text x="46" y="884" font-size="12">Original plain Latin cross. Physical assembly and ironing untested.</text><text x="46" y="902" font-size="12">Counting PNG only; not a calibrated actual-size placement template.</text></g></svg>';
}

function project(pattern, rgba) {
    return { type: 'bead-pattern-project-v1', version: 1, savedAt: `${CREATED_AT}T00:00:00.000Z`, draft: {
        version: 1, sourceMode: 'blank', imageSrc: null, fileName: ID, selectedPaletteIds: ['perler'],
        activePalettes: [{ name: 'Perler Midi', entries: Object.values(pattern.palette).map(color => ({
            name: color.name, ref: color.ref, symbol: color.symbol, prefix: 'P', enabled: true,
            color: { r: color.rgb[0], g: color.rgb[1], b: color.rgb[2], a: 255 },
        })) }],
        boardId: 'midi', boardWidth: 1, boardHeight: 1, matchingId: 'delta_e_cie2000', ditheringId: 'none', useSymbols: true,
        exportFormatId: 'pdf', pdfScaleMode: 'midi-5mm', imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
        rendererSettings: { center: true, fit: true, showGrid: true }, showReference: false, referenceOpacity: .3, previewZoom: 1,
        editedPattern: { width: SIZE, height: SIZE, byteLength: rgba.length, data: rgba.toString('base64') },
    } };
}

function editorModule() {
    const cache = new Map();
    function load(file) {
        if (cache.has(file)) return cache.get(file);
        const loadedModule = { exports: {} };
        cache.set(file, loadedModule.exports);
        const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
        const localRequire = name => {
            let target = name.startsWith('@/') ? path.resolve(repo, 'src', name.slice(2)) : path.resolve(path.dirname(file), name);
            if (!fs.existsSync(target)) target += '.ts';
            return load(target);
        };
        vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, require: localRequire, atob, btoa, Uint8ClampedArray, console }, { filename: file });
        return loadedModule.exports;
    }
    return load(path.join(repo, 'src/lib/editor/draft.ts'));
}

function verifyProject(bytes, expected) {
    assert.deepEqual(JSON.parse(bytes.toString()), project(expected.pattern, expected.rgba), 'Project differs from exact source');
    const editor = editorModule(), draft = editor.parseEditorProject(bytes.toString());
    assert.ok(draft, 'Real editor parser rejected this project');
    assert.ok(Buffer.from(editor.decodeEditorPatternDraft(draft.editedPattern)).equals(expected.rgba), 'Decoded editor pixels differ from source');
    assert.deepEqual(editor.parseEditorProject(editor.serializeEditorProject(draft)), draft, 'Editor serialize/reparse changed the project');
}

function siteEntries(pattern) {
    return [{ id: ID, slug: SLUG, title: pattern.title, kind: 'original', version: pattern.version,
        description: 'Make an original plain Latin/Christian cross with 87 Brown Perler Midi beads. The 13 × 19 motif fits one 29 × 29 board.',
        notes: [
            'Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.',
            'The motif uses Brown 80-19012; screen colors are approximate.',
            'This is a plain Latin/Christian cross, not a plus sign, cross-stitch technique or Jesus figure. The 13 × 19 motif uses Midi beads, not Mini beads.',
            'The PNG chart is for counting, not actual-size placement. Physical assembly and ironing have not been tested; no hanging, standing, wearable, durability, age-suitability or making-time claim is made.',
        ],
    }];
}

function assetMapping() {
    return { state: 'private-candidate-not-published', patterns: [{ id: ID, files: {
        'preview.png': `previews/${ID}.png`, 'grid.png': `charts/${ID}.png`, 'grid.svg': `charts/${ID}.svg`,
        'pixels.png': `pixels/${ID}.png`, 'pattern.bead-pattern.json': `projects/${ID}.bead-pattern.json`,
    }, pendingFiles: { 'pattern.pdf': `pdfs/${ID}.pdf`, 'pattern-letter.pdf': `pdfs/${ID}-us-letter.pdf` } }],
    pendingPdfReferences: ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf'] };
}

function manifest(pattern) {
    return {
        createdAt: CREATED_AT, state: 'private-original-grid-candidate-pdf-pending',
        paletteSource: 'public/palettes/perler.csv; physical colors not independently measured',
        pendingPdfFiles: ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf', `pdfs/${ID}.pdf`, `pdfs/${ID}-us-letter.pdf`],
        patterns: [pattern],
    };
}

function readme() {
    return `# Original Latin Cross v1 source pack\n\nPrivate Git-ignored digital source pack. Root rendered-image review is pending. This source pack contains no visual, publication or physical approval.\n\nDrawn independently from an empty 29 x 29 square grid using explicit rows, not external pixels, tracing, image conversion or generative images. The union of vertical bar x=13..15,y=5..23 and horizontal bar x=8..20,y=10..12 (zero-based) forms a plain Latin/Christian cross. Both bars are three cells thick: five vertical rows above the horizontal bar, eleven below. This is not a plus sign, cross-stitch technique or Jesus figure. Motif bounds are zero-based x=8,y=5,width=13,height=19 (one-based columns 9-21, rows 6-24). Rows SHA256: ${ROWS_SHA256}.\n\nPerler Midi Brown B 80-19012 RGB(103,76,68) is checked against the current project CSV. Total 87 beads in one color. Dots are empty [0,0,0,0] RGBA; occupied cells use exact CSV RGB and alpha255. The 13 x 19 motif fits the 29 x 29 Midi board, not a Mini-bead template. Its height exceeds the site's strict 16 x 16 Small rule. Nominal 5 mm pitch gives a 65 x 95 mm grid footprint, not a measured cooled object.\n\nOrthogonal digital adjacency has one component and zero single-bead cut points. Neither this result nor three-cell bar thickness predicts fused-joint strength. Legacy requiresBacking=false and fragile=false describe this digital layout only. Physical assembly, ironing, hanging and load strength are untested. No hanging, standing, wearable, durability, age-suitability or making-time claim is made.\n\nFive non-PDF assets map to future public names in candidate-assets.json. The symbol chart shows one-based row/column coordinates and is a counting PNG, not an actual-size placement template. A4/US Letter PDF names are pending placeholders only: no PDF exists or is verified here. No public assets, catalog, app, locale, fonts or PDF marker are written.\n\nGenerate once using scripts/generate-original-latin-cross-sourcepack.mjs --output <canonical ignored artifacts/pattern-samples/2026-10-11/original-latin-cross-v1 directory>. Later use --check-only. Existing output is never replaced. Checks compare the entire manifest, site entries, asset mapping, README and preserved QA receipt; decode all native and preview pixels; compare chart PNG with SVG; compare the exact project and call the real editor parser/decode/serialize/reparse. Additional files and symlinks are rejected. qa/sourcepack-checks.json records digital checks and hashes, never approval. Keep this unique rebuildable pack; remove only this task's disposable test outputs.\n`;
}

const assetFiles = ['manifest.json', 'site-entries.json', 'candidate-assets.json', 'README.md', `pixels/${ID}.png`, `previews/${ID}.png`, `charts/${ID}.png`, `charts/${ID}.svg`, `projects/${ID}.bead-pattern.json`];

function fileInventory(output, prefix = '') {
    return fs.readdirSync(path.join(output, prefix), { withFileTypes: true }).flatMap(entry => {
        assert.ok(!entry.isSymbolicLink(), 'Source-pack symlinks are not allowed');
        const file = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            assert.ok(['pixels', 'previews', 'charts', 'projects', 'qa'].includes(file), 'Source-pack file inventory differs: unexpected directory');
            return fileInventory(output, file);
        }
        assert.ok(entry.isFile(), 'Source-pack entries must be regular files');
        return [file];
    }).sort();
}

export async function checkArtifacts(output, expected = design(), requireQa = true) {
    output = privateLocation(output);
    gitIgnored(output);
    assert.ok(!fs.lstatSync(output).isSymbolicLink(), 'Source-pack symlinks are not allowed');
    assert.deepEqual(fileInventory(output), [...assetFiles, ...(requireQa ? ['qa/sourcepack-checks.json'] : [])].sort(), 'Source-pack file inventory differs');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'), 'utf8')), manifest(expected.pattern), 'Manifest differs from exact source');
    const pixels = await sharp(path.join(output, 'pixels', `${ID}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(pixels.info.width, SIZE);
    assert.equal(pixels.info.height, SIZE);
    assert.ok(pixels.data.equals(expected.rgba), 'Native pixel PNG differs from source rows, including all-zero transparency');
    verifyProject(fs.readFileSync(path.join(output, 'projects', `${ID}.bead-pattern.json`)), expected);
    const previewBytes = fs.readFileSync(path.join(output, 'previews', `${ID}.png`));
    const preview = await sharp(previewBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(preview.info.width, 580);
    assert.equal(preview.info.height, 580);
    for (let y = 0; y < 580; y++) for (let x = 0; x < 580; x++) {
        const symbol = ROWS[Math.floor(y / 20)][Math.floor(x / 20)];
        const rgba = [...(symbol === '.' ? BACKGROUND : expected.pattern.palette[symbol].rgb), 255];
        for (let channel = 0; channel < 4; channel++) assert.equal(preview.data[(y * 580 + x) * 4 + channel], rgba[channel], 'Preview differs from exact source cells');
    }
    const svg = fs.readFileSync(path.join(output, 'charts', `${ID}.svg`), 'utf8');
    assert.equal(svg, chartSvg(expected.pattern), 'Symbol SVG differs from source rows');
    const chart = await sharp(path.join(output, 'charts', `${ID}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rendered = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
    assert.equal(chart.info.width, 788);
    assert.equal(chart.info.height, 908);
    assert.ok(chart.data.equals(rendered), 'Chart PNG differs from its SVG');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'site-entries.json'), 'utf8')), siteEntries(expected.pattern), 'Site entries differ');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'candidate-assets.json'), 'utf8')), assetMapping(), 'Candidate assets differ');
    assert.equal(fs.readFileSync(path.join(output, 'README.md'), 'utf8'), readme(), 'README differs from preserved source');
    const report = { id: ID, rowsSha256: ROWS_SHA256, rgbaSha256: sha(expected.rgba), previewSha256: sha(previewBytes), bounds: expected.pattern.bounds,
        beads: 87, colorCount: 1, fourConnectedComponents: 1, singleBeadCutPoints: 0, materials: Object.values(expected.pattern.palette),
        nominalLayout: expected.pattern.nominalLayout, pixelPngEqualsProjectEqualsManifest: true, emptyPixelRgbaAllZero: true, allPreviewPixelsMatchGrid: true, chartPngEqualsSvg: true,
        realEditorParse: true, realEditorSerializeReparse: true, visualReview: 'pending-root-rendered-review',
        physicalAssemblyTested: false, ironingTested: false, hangingTested: false, loadStrengthTested: false,
        pdfVerification: 'Not performed; separate PDF authoring and review required',
        fileSha256: Object.fromEntries(assetFiles.map(file => [file, sha(fs.readFileSync(path.join(output, file)))])),
    };
    if (requireQa) assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'qa/sourcepack-checks.json'), 'utf8')), qaReceipt(report), 'Preserved digital QA receipt differs');
    return report;
}

const qaReceipt = report => ({ checkedAt: CREATED_AT, state: 'private-digital-source-verified', ...report });

export async function generate(output) {
    output = privateLocation(output);
    gitIgnored(output);
    assert.ok(!fs.existsSync(output), 'Source-pack directory exists; use --check-only or preserve this version');
    const expected = design();
    verifyProject(Buffer.from(json(project(expected.pattern, expected.rgba))), expected);
    const { pattern, rgba } = expected;
    const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="580" height="580"><rect width="580" height="580" fill="#ddd8ca"/><g shape-rendering="crispEdges">${art(pattern, 0, 20)}</g></svg>`;
    const svg = chartSvg(pattern);
    // Render before creating output so dependency failures cannot leave a partial pack.
    const pixelPng = await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer();
    const previewPng = await sharp(Buffer.from(previewSvg)).png().toBuffer();
    const chartPng = await sharp(Buffer.from(svg)).png().toBuffer();
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.mkdirSync(output);
    for (const folder of ['pixels', 'previews', 'charts', 'projects', 'qa']) fs.mkdirSync(path.join(output, folder));
    const files = {
        [`pixels/${ID}.png`]: pixelPng, [`previews/${ID}.png`]: previewPng,
        [`charts/${ID}.svg`]: svg, [`charts/${ID}.png`]: chartPng,
        [`projects/${ID}.bead-pattern.json`]: json(project(pattern, rgba)),
        'manifest.json': json(manifest(pattern)), 'site-entries.json': json(siteEntries(pattern)),
        'candidate-assets.json': json(assetMapping()), 'README.md': readme(),
    };
    for (const [file, bytes] of Object.entries(files)) fs.writeFileSync(path.join(output, file), bytes, { flag: 'wx' });
    const report = await checkArtifacts(output, expected, false);
    fs.writeFileSync(path.join(output, 'qa/sourcepack-checks.json'), json(qaReceipt(report)), { flag: 'wx' });
    return checkArtifacts(output, expected);
}

async function main() {
    const { output, checkOnly } = options(process.argv.slice(2));
    gitIgnored(output);
    const report = checkOnly ? await checkArtifacts(output) : await generate(output);
    console.log(json({ output, mode: checkOnly ? 'read-only-check' : 'generated-private-candidate', ...report }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

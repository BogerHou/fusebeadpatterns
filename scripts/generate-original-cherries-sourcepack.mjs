/** Independently authored Cherries v1; private source pack only, never public assets or PDFs. */
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
export const ID = 'original-cherries';
const SLUG = 'cherry', SIZE = 29, CREATED_AT = '2026-10-16';
const BACKGROUND = [221, 216, 202];
const ROWS_SHA256 = '0eef52185588f38cd9ba99380704f83a33c5eba96907b8420179ddf5e0d3a3ce';
// Independent empty-board drawing: two rounded red fruits sit at different heights.
// Four-cell stair-step stems fork from one pointed leaf; filled highlights and
// lower-right shadows add depth. No external image, tracing or raster conversion.
export const ROWS = [
    '.............................',
    '.............................',
    '.............................',
    '.....................LLL.....',
    '..................LLLLLLL....',
    '................LLLLGGGLL....',
    '.............GGLLGGGGLLL.....',
    '.............GGGGGLLLL.......',
    '............GGGLLLL..........',
    '...........GGGG.GGGG.........',
    '..........GGGG...GGGG........',
    '.........GGGG.....GGGG.......',
    '........GGGG.......GGGG......',
    '........GGGG........GGGG.....',
    '......RRGGGG........GGGG.....',
    '....RRRRRRRRRR......GGGG.....',
    '...RRRHHRRRRRRR....RGGGG.....',
    '...RRHHRRRRRRRR..RRRRRRRRR...',
    '...RRHRRRRRRRDD.RRRHHRRRRRR..',
    '...RRRRRRRRRDDD.RRHRRRRRRRR..',
    '...RRRRRRRRDDDD.RRRRRRRRRDD..',
    '....RRRRRRDDDD..RRRRRRRRDDD..',
    '.....RRRRDDDD...RRRRRRRDDDD..',
    '......RRDDDD.....RRRRRDDDD...',
    '..................RRRDDDD....',
    '...................RRDDD.....',
    '.............................',
    '.............................',
    '.............................',
];
export const REVIEWED_ROWS_SHA256 = '0eef52185588f38cd9ba99380704f83a33c5eba96907b8420179ddf5e0d3a3ce'; // Root inspected the exact candidate PNG on 2026-10-16.
const MATERIALS = {
    R: { ref: '80-19005', name: 'Red', rgb: [176, 53, 60], count: 133 },
    D: { ref: '80-15961', name: 'Cherry', rgb: [157, 43, 58], count: 41 },
    H: { ref: '80-19059', name: 'Hot Coral', rgb: [221, 89, 91], count: 8 },
    G: { ref: '80-19010', name: 'Dark Green', rgb: [0, 123, 78], count: 73 },
    L: { ref: '80-19080', name: 'Green', rgb: [77, 171, 100], count: 29 },
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
    const expectedSuffix = ['artifacts', 'pattern-samples', CREATED_AT, 'original-cherries-v1'];
    for (const candidate of [resolved, actualPath(resolved)]) {
        const parts = candidate.split(path.sep);
        assert.deepEqual(parts.slice(-4), expectedSuffix, 'Use the versioned artifacts/pattern-samples/2026-10-16/original-cherries-v1 directory');
        assert.ok(!parts.includes('public'), 'Never generate a private source pack in public, including through symlinks');
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
    assert.ok(ROWS.every(row => row.length === SIZE && /^[.RDHGL]+$/.test(row)));
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
    assert.equal(occupied.size, 284);
    assert.deepEqual(components(occupied), [284]);
    const weakBridges = [...occupied].filter(cell => components(occupied, cell).length > 1)
        .map(cell => ({ row: Math.floor(cell / SIZE) + 1, column: cell % SIZE + 1 }));
    assert.deepEqual(weakBridges, [], 'The cherries must have no single-bead digital cut points');
    const xs = [...occupied].map(i => i % SIZE), ys = [...occupied].map(i => Math.floor(i / SIZE));
    const bounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
    assert.deepEqual(bounds, { x: 3, y: 3, width: 24, height: 23 });
    assert.ok(bounds.width <= SIZE && bounds.height <= SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
        if (!occupied.has(i)) assert.ok(rgba.subarray(i * 4, i * 4 + 4).equals(Buffer.alloc(4)), 'Empty pixels must be all-zero RGBA');
    }
    const topology = {
        model: 'Orthogonal grid adjacency only; not a physical strength prediction',
        components: 1, singleBeadCutPoints: 0,
    };
    const pattern = {
        id: ID, slug: SLUG, title: 'Cherries', titleZh: '双樱桃图纸', kind: 'original',
        version: 'Original Cherries design v1', theme: 'Fruit',
        localizedSubjects: { de: 'Kirschen', fr: 'Cerises', ja: 'さくらんぼ' },
        description: 'An original pair of red cherries at different heights, joined by green stems and one pointed leaf, with coral highlights and dark red shading.',
        descriptionZh: '原创一对错落的红樱桃，绿色连接柄、一片尖叶、珊瑚色高光与深红阴影。',
        source: null,
        designMethod: 'Independent explicit symbol rows on an empty 29 x 29 square grid. A broad left fruit sits above a narrower right fruit. Separate four-cell-wide curved stems join near one pointed green leaf, with eight Hot Coral highlight cells and lower-right Cherry shading. Every highlight is a filled bead, not a hole. No face, external pixels, tracing, named character, image conversion or generated raster artwork.',
        sourceNoteZh: '从空白格阵独立绘制；未使用第三方像素、描图或生成式图片；不代表游戏角色，未实物拼制或熨烫测试。',
        width: SIZE, height: SIZE, rows: ROWS, palette, materials: Object.values(palette), beads: 284, colorCount: 5, bounds,
        components: 1, requiresBacking: false, fragile: false, weakBridges, structureNotes: [], topology,
        requiresBackingMeaning: 'Legacy digital multi-part layout flag only; false is not a physical strength claim',
        nominalLayout: { pitchMm: 5, widthMm: 120, heightMm: 115, meaning: 'Nominal grid footprint, not a measured cooled finished size' },
        intendedUse: 'A flat ordinary pair-of-cherries pattern; no hanging, wearable, durability or age-suitability claim',
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
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="788" height="940"><rect width="100%" height="100%" fill="white"/><g shape-rendering="crispEdges">${art(pattern, margin, cell)}</g>`;
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
    svg += '</g><g font-family="Arial,sans-serif" fill="#26352d"><text x="46" y="796" font-size="19">Cherries - 284 beads / 5 colors</text><text x="46" y="818" font-size="13">24 x 23 motif on a 29 x 29 MIDI board. Empty cells: no bead.</text>';
    Object.values(pattern.palette).forEach((color, i) => {
        svg += `<text x="${46 + (i % 2) * 350}" y="${840 + Math.floor(i / 2) * 18}" font-size="10">${esc(color.symbol)}: ${esc(color.name)} ${esc(color.ref)} (${color.count})</text>`;
    });
    return svg + '<text x="46" y="914" font-size="12">Original cherries. Physical assembly and ironing untested.</text><text x="46" y="932" font-size="12">Counting PNG only; not a calibrated actual-size placement template.</text></g></svg>';
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
        description: 'Make two red cherries with joined green stems and one leaf. Download the free Perler bead pattern or edit the 24 × 23 design.',
        notes: [
            'Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.',
            'Uses Red 80-19005, Cherry 80-15961, Hot Coral 80-19059, Dark Green 80-19010 and Green 80-19080. Screen colors are approximate.',
            'This pattern uses a Midi board, not Mini beads. The PNG chart is for counting, not actual-size placement.',
            'Physical assembly and ironing have not been tested. No hanging, wearable, durability or age-suitability claim is made.',
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
    return `# Original Cherries v1 source pack\n\nPrivate Git-ignored digital source pack. Visual review and publication approval are recorded separately; this immutable pack does not contain physical approval.\n\nIndependent explicit 29 x 29 rows depict two red fruits at different heights with joined green stems and one pointed leaf. The eight coral highlights are filled beads. No external pixels, tracing, named character, image conversion or generated raster artwork. Motif bounds x=3,y=3,width=24,height=23 (zero based). Rows SHA256: ${ROWS_SHA256}.\n\n284 beads in five existing Perler Midi colors: Red R 80-19005 RGB(176,53,60),133; Cherry D 80-15961 RGB(157,43,58),41; Hot Coral H 80-19059 RGB(221,89,91),8; Dark Green G 80-19010 RGB(0,123,78),73; Green L 80-19080 RGB(77,171,100),29. Screen RGB values are not measured physical colors. Empty cells are all-zero RGBA. A nominal 5 mm pitch gives a 120 x 115 mm motif footprint, not measured cooled size.\n\nOne four-connected digital component and zero single-bead cut points do not prove fused strength. Physical assembly and ironing remain untested. No hanging, wearable, durability or age-suitability claim. This is an ordinary flat fruit motif, not a mini-bead or fewer-than16x16 design.\n\nFive non-PDF asset names are rebuildable from these rows. The counting PNG is not an actual-size template. A4/Letter PDF paths remain pending filenames; create/review PDFs separately without modifying this immutable pack.\n\nGenerate once with scripts/generate-original-cherries-sourcepack.mjs --output <ignored artifacts/pattern-samples/2026-10-16/original-cherries-v1>. Later --check-only verifies exact files, metadata and pixels and rejects extra files, symlinks or altered QA.\n`;
}

const assetFiles = ['manifest.json', 'site-entries.json', 'candidate-assets.json', 'README.md', `pixels/${ID}.png`, `previews/${ID}.png`, `charts/${ID}.png`, `charts/${ID}.svg`, `projects/${ID}.bead-pattern.json`];

function fileInventory(output, prefix = '') {
    return fs.readdirSync(path.join(output, prefix), { withFileTypes: true }).flatMap(entry => {
        assert.ok(!entry.isSymbolicLink(), 'Source-pack symlinks are not allowed');
        const file = prefix ? `${prefix}/${entry.name}` : entry.name;
        return entry.isDirectory() ? fileInventory(output, file) : [file];
    }).sort();
}

export async function checkArtifacts(output, expected = design(), requireQa = true) {
    output = privateLocation(output);
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
    assert.equal(chart.info.height, 940);
    assert.ok(chart.data.equals(rendered), 'Chart PNG differs from its SVG');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'site-entries.json'), 'utf8')), siteEntries(expected.pattern), 'Site entries differ');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'candidate-assets.json'), 'utf8')), assetMapping(), 'Candidate assets differ');
    assert.equal(fs.readFileSync(path.join(output, 'README.md'), 'utf8'), readme(), 'README differs from preserved source');
    const report = { id: ID, rowsSha256: ROWS_SHA256, rgbaSha256: sha(expected.rgba), previewSha256: sha(previewBytes), bounds: expected.pattern.bounds,
        beads: 284, colorCount: 5, fourConnectedComponents: 1, singleBeadCutPoints: 0, materials: Object.values(expected.pattern.palette),
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
    assert.ok(!fs.existsSync(output), 'Source-pack directory exists; use --check-only or preserve this version');
    assert.equal(REVIEWED_ROWS_SHA256, ROWS_SHA256, 'Root must inspect and freeze the candidate before source-pack generation');
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

export async function preview(output) {
    output = path.resolve(output);
    assert.ok(path.basename(output).startsWith('original-cherries-candidate-'));
    assert.ok(!actualPath(output).split(path.sep).some(part => ['public', 'src'].includes(part)));
    assert.ok(!fs.existsSync(output), 'Preview directory exists');
    const { pattern, rgba } = design();
    const png = await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } }).resize(580, 580, { kernel: 'nearest' }).flatten({ background: '#ddd8ca' }).png().toBuffer();
    fs.mkdirSync(output, { recursive: true });
    const file = path.join(output, ID + '.png'); fs.writeFileSync(file, png, { flag: 'wx' });
    return { file, rowsSha256: ROWS_SHA256, rgbaSha256: sha(rgba), beads: pattern.beads, palette: pattern.materials, bounds: pattern.bounds, topology: pattern.topology };
}
async function main() {
    if (process.argv[2] === '--preview-output' && process.argv.length === 4) {
        console.log(json(await preview(process.argv[3]))); return;
    }
    const { output, checkOnly } = options(process.argv.slice(2));
    gitIgnored(output);
    const report = checkOnly ? await checkArtifacts(output) : await generate(output);
    console.log(json({ output, mode: checkOnly ? 'read-only-check' : 'generated-private-candidate', ...report }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

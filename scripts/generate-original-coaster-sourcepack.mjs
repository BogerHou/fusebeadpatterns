/** Build the independently authored Retro Diamond Coaster v1 source pack. Never writes PDFs or public assets. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ts = require('typescript');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'original-retro-diamond-coaster';
const SLUG = 'retro-diamond-coaster';
const SIZE = 29;
const CREATED_AT = '2026-10-10';
const BACKGROUND = [221, 216, 202];
const ROWS_SHA256 = '10f48f09d0902b1c6552a87d36633168a7988c085a003fee4ae8e375997ebd17';
// Root accepted this independently authored symbol-grid candidate; actual PNG review remains separate.
// A 23 x 23 filled tile has two-cell Cheddar borders and a Manhattan-distance diamond.
// Each corner omits three cells. All interior cells contain beads, including White cells.
const ROWS = [
    '.............................',
    '.............................',
    '.............................',
    '.....GGGGGGGGGGGGGGGGGGG.....',
    '....GGGGGGGGGGGGGGGGGGGGG....',
    '...GGNNNNNNNNNNNNNNNNNNNGG...',
    '...GGNNNNNNNNNWNNNNNNNNNGG...',
    '...GGNNNNNNNNWWWNNNNNNNNGG...',
    '...GGNNNNNNNWWWWWNNNNNNNGG...',
    '...GGNNNNNNWWWGWWWNNNNNNGG...',
    '...GGNNNNNWWWGGGWWWNNNNNGG...',
    '...GGNNNNWWWGGGGGWWWNNNNGG...',
    '...GGNNNWWWGGGGGGGWWWNNNGG...',
    '...GGNNWWWGGGGGGGGGWWWNNGG...',
    '...GGNWWWGGGGGGGGGGGWWWNGG...',
    '...GGNNWWWGGGGGGGGGWWWNNGG...',
    '...GGNNNWWWGGGGGGGWWWNNNGG...',
    '...GGNNNNWWWGGGGGWWWNNNNGG...',
    '...GGNNNNNWWWGGGWWWNNNNNGG...',
    '...GGNNNNNNWWWGWWWNNNNNNGG...',
    '...GGNNNNNNNWWWWWNNNNNNNGG...',
    '...GGNNNNNNNNWWWNNNNNNNNGG...',
    '...GGNNNNNNNNNWNNNNNNNNNGG...',
    '...GGNNNNNNNNNNNNNNNNNNNGG...',
    '....GGGGGGGGGGGGGGGGGGGGG....',
    '.....GGGGGGGGGGGGGGGGGGG.....',
    '.............................',
    '.............................',
    '.............................',
];
const MATERIALS = {
    G: { ref: '80-19057', name: 'Cheddar', rgb: [251, 177, 70], count: 217 },
    N: { ref: '80-15201', name: 'Midnight', rgb: [47, 60, 85], count: 216 },
    W: { ref: '80-19001', name: 'White', rgb: [234, 239, 238], count: 84 },
};
const sha = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function options(args) {
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
    output = path.resolve(repo, output || 'artifacts/pattern-samples/2026-10-10/original-coaster-v1');
    assert.equal(path.basename(output), 'original-coaster-v1', 'Use the versioned coaster source-pack directory');
    const parts = output.split(path.sep);
    assert.ok(parts.includes('artifacts'), 'The source pack must stay under an ignored artifacts directory');
    assert.ok(!parts.includes('public'), 'Never generate the private source pack in public');
    return { output, checkOnly };
}

function components(cells, omitted) {
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

function enclosedEmptyComponents(occupied) {
    const empty = new Set(Array.from({ length: SIZE * SIZE }, (_, i) => i).filter(i => !occupied.has(i)));
    const outside = [...empty].filter(i => i < SIZE || i >= SIZE * (SIZE - 1) || i % SIZE === 0 || i % SIZE === SIZE - 1);
    for (const cell of outside) empty.delete(cell);
    for (const cell of outside) {
        const x = cell % SIZE, y = Math.floor(cell / SIZE);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy, next = ny * SIZE + nx;
            if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || !empty.has(next)) continue;
            empty.delete(next);
            outside.push(next);
        }
    }
    return components(empty);
}

function design() {
    assert.equal(ROWS.length, SIZE);
    assert.ok(ROWS.every(row => row.length === SIZE && /^[.GNW]+$/.test(row)));
    assert.equal(sha(ROWS.join('\n')), ROWS_SHA256, 'Frozen v1 rows changed; review a new version instead');
    const csv = new Map(fs.readFileSync(path.join(repo, 'public/palettes/perler.csv'), 'utf8').trim().split(/\r?\n/).map(line => {
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
    assert.equal(occupied.size, 517);
    assert.deepEqual(components(occupied), [517]);
    const weakBridges = [...occupied].filter(cell => components(occupied, cell).length > 1)
        .map(cell => ({ row: Math.floor(cell / SIZE) + 1, column: cell % SIZE + 1 }));
    assert.deepEqual(weakBridges, [], 'The frozen layout must not have single-bead digital cut points');
    const emptyHoles = enclosedEmptyComponents(occupied);
    assert.deepEqual(emptyHoles, [], 'No internal transparent hole is intended in this coaster tile');
    assert.ok(ROWS.every(row => row === [...row].reverse().join('')), 'The complete grid must mirror horizontally');
    assert.ok(ROWS.every((row, i) => row === ROWS[SIZE - i - 1]), 'The complete grid must mirror vertically');
    const xs = [...occupied].map(i => i % SIZE), ys = [...occupied].map(i => Math.floor(i / SIZE));
    const bounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
    assert.deepEqual(bounds, { x: 3, y: 3, width: 23, height: 23 });
    const topology = { model: 'Orthogonal grid adjacency only; not a physical strength prediction', components: 1, singleBeadCutPoints: 0, enclosedEmptyComponents: [], mirrorHorizontal: true, mirrorVertical: true };
    const pattern = {
        id: ID, slug: SLUG, title: 'Retro Diamond Coaster', titleZh: '复古菱形杯垫图纸', kind: 'original',
        version: 'Original retro diamond coaster design v1', theme: 'Coasters',
        localizedSubjects: { de: 'Retro-Untersetzer mit Rautenmuster', fr: 'Dessous de verre rétro à losanges', ja: 'レトロなひし形コースター' },
        description: 'An original Cheddar, Midnight and White diamond layout for a cork-backed bead coaster project, with clipped corners and a filled 23 x 23 motif.',
        descriptionZh: '原创金黄、深蓝与白色复古菱形杯垫布局，23×23主体采用轻微切角；制作成杯垫还需粘接软木底板。',
        source: null,
        designMethod: 'Independent explicit symbol rows: a filled 23 x 23 square centered at (3,3) on a 29 x 29 grid; each corner removes three cells, the outer two-cell border is Cheddar, and Manhattan distance from the motif center defines a Cheddar diamond within a White diamond ring on Midnight. No third-party pattern pixels, tracing, named character or generated raster artwork.',
        sourceNoteZh: '独立逻辑格阵原创；未使用第三方像素、描图或生成式图片；未实物拼制、熨烫、粘接、使用或耐热测试。',
        width: SIZE, height: SIZE, rows: ROWS, palette, materials: Object.values(palette), beads: 517, colorCount: 3, bounds,
        components: 1, requiresBacking: false, fragile: false, weakBridges, structureNotes: [], topology,
        requiresBackingMeaning: 'Legacy digital multi-part layout flag only; false does not waive the cork backing for coaster use',
        coasterBackingRequired: true, intendedUse: 'A cork-backed drink-coaster project; the printable layout alone is not a finished coaster',
        physicalAssemblyTested: false, ironingTested: false, coasterUseTested: false, thermalPerformanceTested: false,
        validation: {
            grid: 'passed', palette: 'existing-project-perler-csv', designRowsSha256: ROWS_SHA256, rgbaSha256: sha(rgba),
            digitalFourConnectedComponents: 1, digitalSingleBeadCutPoints: 0, digitalEnclosedEmptyComponents: [], topologyModel: topology.model,
            physicalAssemblyTested: false, ironingTested: false, coasterUseTested: false, thermalPerformanceTested: false,
            officialPatternCopied: false, namedCharacter: false,
            visualReview: 'Root accepted the symbol-grid plan; rendered PNG and PDF review remain separate',
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
    svg += '</g><g font-family="Arial,sans-serif" fill="#26352d"><text x="46" y="796" font-size="19">Retro Diamond Coaster - 517 beads / 3 colors</text><text x="46" y="818" font-size="13">23 x 23 motif on a 29 x 29 MIDI board. Empty cells: no bead.</text>';
    Object.values(pattern.palette).forEach((color, i) => {
        svg += `<text x="${46 + i % 2 * 355}" y="${840 + Math.floor(i / 2) * 19}" font-size="12">${esc(color.symbol)}: ${esc(color.name)} ${esc(color.ref)} (${color.count})</text>`;
    });
    return svg + '<text x="46" y="884" font-size="12">Coaster use requires a cork backing; not physically assembled or tested.</text><text x="46" y="902" font-size="12">Original digital grid. This PNG is not an actual-size placement template.</text></g></svg>';
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
        description: 'Make an original retro diamond coaster layout with 517 Perler Midi beads in three colors. Download the printable grid and add a cork backing for coaster use.',
        notes: [
            'Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.',
            'Print the PDF at 100% / Actual size and check its 50 mm scale line before use.',
            'This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.',
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

async function check(output, expected) {
    const manifest = JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'), 'utf8'));
    assert.equal(manifest.createdAt, CREATED_AT);
    assert.equal(manifest.patterns.length, 1);
    const actual = manifest.patterns[0];
    for (const key of ['id', 'slug', 'title', 'kind', 'version', 'source', 'localizedSubjects', 'width', 'height', 'rows', 'palette', 'materials', 'beads', 'colorCount', 'bounds', 'components', 'requiresBacking', 'coasterBackingRequired', 'intendedUse', 'weakBridges', 'topology', 'physicalAssemblyTested', 'ironingTested', 'coasterUseTested', 'thermalPerformanceTested']) {
        assert.deepEqual(actual[key], expected.pattern[key], `Manifest differs from source: ${key}`);
    }
    const pixels = await sharp(path.join(output, 'pixels', `${ID}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(pixels.info.width, SIZE);
    assert.equal(pixels.info.height, SIZE);
    assert.ok(pixels.data.equals(expected.rgba), 'Native pixel PNG differs from source rows');
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
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'site-entries.json'), 'utf8')), siteEntries(expected.pattern));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'candidate-assets.json'), 'utf8')), assetMapping());
    const files = ['manifest.json', 'site-entries.json', 'candidate-assets.json', 'README.md', `pixels/${ID}.png`, `previews/${ID}.png`, `charts/${ID}.png`, `charts/${ID}.svg`, `projects/${ID}.bead-pattern.json`];
    return { id: ID, rowsSha256: ROWS_SHA256, rgbaSha256: sha(expected.rgba), previewSha256: sha(previewBytes), bounds: expected.pattern.bounds,
        beads: 517, colorCount: 3, fourConnectedComponents: 1, singleBeadCutPoints: 0, enclosedEmptyComponents: [], materials: Object.values(expected.pattern.palette),
        coasterBackingRequired: true, pixelPngEqualsProjectEqualsManifest: true, allPreviewPixelsMatchGrid: true, chartPngEqualsSvg: true,
        realEditorParse: true, realEditorSerializeReparse: true, physicalAssemblyTested: false, ironingTested: false, coasterUseTested: false, thermalPerformanceTested: false,
        pdfVerification: 'Not performed by this source-pack script; separate PDF authoring and review required',
        fileSha256: Object.fromEntries(files.map(file => [file, sha(fs.readFileSync(path.join(output, file)))])),
    };
}

async function main() {
    const { output, checkOnly } = options(process.argv.slice(2)), expected = design();
    if (!checkOnly) {
        assert.ok(!fs.existsSync(output), 'Source-pack directory exists; use --check-only or preserve this version');
        verifyProject(Buffer.from(json(project(expected.pattern, expected.rgba))), expected);
        const { pattern, rgba } = expected;
        const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="580" height="580"><rect width="580" height="580" fill="#ddd8ca"/><g shape-rendering="crispEdges">${art(pattern, 0, 20)}</g></svg>`;
        const svg = chartSvg(pattern);
        // Prepare buffers before the exclusive directory creation to avoid dependency/render failures leaving a partial pack.
        const pixelPng = await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer();
        const previewPng = await sharp(Buffer.from(previewSvg)).png().toBuffer();
        const chartPng = await sharp(Buffer.from(svg)).png().toBuffer();
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.mkdirSync(output);
        for (const folder of ['pixels', 'previews', 'charts', 'projects', 'qa']) fs.mkdirSync(path.join(output, folder));
        fs.writeFileSync(path.join(output, 'pixels', `${ID}.png`), pixelPng, { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'previews', `${ID}.png`), previewPng, { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'charts', `${ID}.svg`), svg, { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'charts', `${ID}.png`), chartPng, { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'projects', `${ID}.bead-pattern.json`), json(project(pattern, rgba)), { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'manifest.json'), json({
            createdAt: CREATED_AT, state: 'private-original-grid-candidate-pdf-pending',
            paletteSource: 'public/palettes/perler.csv; physical colors not independently measured',
            pendingPdfFiles: ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf', `pdfs/${ID}.pdf`, `pdfs/${ID}-us-letter.pdf`],
            patterns: [pattern],
        }), { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'site-entries.json'), json(siteEntries(pattern)), { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'candidate-assets.json'), json(assetMapping()), { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'README.md'), `# Retro Diamond Coaster original v1 source pack\n\nPrivate Git-ignored source pack. Root owns rendered-image review; PDF authoring and review are separate.\n\nExplicit independent 29 x 29 symbol rows define a 23 x 23 tile starting at zero-based x=3,y=3. Three cells are omitted at each corner. The other cells are filled: Cheddar G 80-19057 (217), Midnight N 80-15201 (216), White W 80-19001 (84), totaling 517 beads. White cells require White beads; only dots are empty. No external artwork, copied pattern or generated raster was used. Source rows SHA256: ${ROWS_SHA256}.\n\nThe occupied grid is one four-connected component, has no single-cell cut points and has no internal transparent holes. These are digital adjacency facts, not fused-joint strength or flatness tests. The legacy requiresBacking=false describes a single digital component; coasterBackingRequired=true separately records that intended coaster use needs a cork backing. Physical assembly, ironing, glue adhesion, coaster use and thermal performance have not been tested. A 23-cell motif at nominal 5 mm pitch spans 115 mm of grid space, not a measured finished size. No hot-cup temperature, cookware or durability rating is claimed.\n\nNative subjects: DE Retro-Untersetzer mit Rautenmuster; FR Dessous de verre rétro à losanges; JA レトロなひし形コースター. Manufacturer process references are linked by the website, never copied or redistributed here.\n\nFive ready non-PDF assets map to future public names in candidate-assets.json. PNG charts are counting images, not calibrated actual-size placement templates. PDF placeholders do not prove files exist or are approved; this script never calls a PDF authoring marker, writes PDFs, refreshes fonts or copies to public. Separate authoring will supply A4 and US Letter in all four languages.\n\nGenerate once with scripts/generate-original-coaster-sourcepack.mjs --output <this versioned artifacts directory>. Later use --check-only. Existing output is never replaced. Checks read actual PNG bytes, symbol chart, project and manifest, confirm every preview pixel against the rows, and run the real editor parser/decode/serialize/reparse. qa/sourcepack-checks.json records digital checks and hashes; it is not visual or physical approval.\n`, { flag: 'wx' });
    }
    const report = await check(output, expected);
    if (!checkOnly) fs.writeFileSync(path.join(output, 'qa/sourcepack-checks.json'), json({ checkedAt: CREATED_AT, state: 'private-digital-source-verified', ...report }), { flag: 'wx' });
    console.log(json({ output, mode: checkOnly ? 'read-only-check' : 'generated-private-candidate', ...report }));
}

await main();

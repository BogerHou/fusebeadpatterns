/** Build the independently authored Christmas Bauble Ornament v1 source pack. Never writes PDFs or public assets. */
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
const ID = 'original-christmas-bauble-ornament';
const SLUG = 'christmas-bauble-ornament';
const SIZE = 29;
const CREATED_AT = '2026-10-10';
const BACKGROUND = [221, 216, 202];
const ROWS_SHA256 = '380693bd584782c09b556bebc370ebb2b4bd0b8d6e0401125290e107118f0247';
// Independent approved symbol-grid plan; rendered PNG review remains a separate root task.
// One-based opening: columns 14-16, rows 5-7. Its seven-cell square cap has a two-cell frame.
// A stepped round body connects across seven cells; White/Cheddar diamonds contain beads.
const ROWS = [
    '.............................',
    '.............................',
    '...........GGGGGGG...........',
    '...........GGGGGGG...........',
    '...........GG...GG...........',
    '...........GG...GG...........',
    '...........GG...GG...........',
    '...........GGGGGGG...........',
    '...........GGGGGGG...........',
    '...........RRRRRRR...........',
    '........RRRRRRRRRRRRR........',
    '......RRRRRRRRRRRRRRRRR......',
    '.....RRRRRRRRRWRRRRRRRRR.....',
    '....RRRRRRRRRWWWRRRRRRRRR....',
    '....RRRRRRRRWWWWWRRRRRRRR....',
    '....RRRRRRRWWWRWWWRRRRRRR....',
    '....RRRRRRWWWRGRWWWRRRRRR....',
    '....RRRRRWWWRGGGRWWWRRRRR....',
    '....RRRRWWWRGGGGGRWWWRRRR....',
    '....RRRRRWWWRGGGRWWWRRRRR....',
    '....RRRRRRWWWRGRWWWRRRRRR....',
    '....RRRRRRRWWWRWWWRRRRRRR....',
    '....RRRRRRRRWWWWWRRRRRRRR....',
    '.....RRRRRRRRWWWRRRRRRRR.....',
    '......RRRRRRRRWRRRRRRRR......',
    '........RRRRRRRRRRRRR........',
    '...........RRRRRRR...........',
    '.............................',
    '.............................',
];
const MATERIALS = {
    R: { ref: '80-19005', name: 'Red', rgb: [176, 53, 60], count: 249 },
    W: { ref: '80-19001', name: 'White', rgb: [234, 239, 238], count: 60 },
    G: { ref: '80-19057', name: 'Cheddar', rgb: [251, 177, 70], count: 53 },
};
const HANGING_OPENING = {
    coordinates: 'One-based columns and rows',
    columnStart: 14, columnEnd: 16, rowStart: 5, rowEnd: 7,
    width: 3, height: 3, emptyCells: 9, frameWidthCells: 2,
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
    output = path.resolve(repo, output || 'artifacts/pattern-samples/2026-10-10/original-bauble-v1');
    assert.equal(path.basename(output), 'original-bauble-v1', 'Use the versioned bauble source-pack directory');
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
    const enclosed = [];
    while (empty.size) {
        const first = empty.values().next().value, cells = [first];
        empty.delete(first);
        for (const cell of cells) {
            const x = cell % SIZE, y = Math.floor(cell / SIZE);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy, next = ny * SIZE + nx;
                if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || !empty.has(next)) continue;
                empty.delete(next);
                cells.push(next);
            }
        }
        cells.sort((a, b) => a - b);
        const xs = cells.map(i => i % SIZE), ys = cells.map(i => Math.floor(i / SIZE));
        enclosed.push({
            size: cells.length,
            bounds: { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 },
            cellsOneBased: cells.map(i => ({ row: Math.floor(i / SIZE) + 1, column: i % SIZE + 1 })),
        });
    }
    return enclosed;
}

function design() {
    assert.equal(ROWS.length, SIZE);
    assert.ok(ROWS.every(row => row.length === SIZE && /^[.RWG]+$/.test(row)));
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
    assert.equal(occupied.size, 362);
    assert.deepEqual(components(occupied), [362]);
    const weakBridges = [...occupied].filter(cell => components(occupied, cell).length > 1)
        .map(cell => ({ row: Math.floor(cell / SIZE) + 1, column: cell % SIZE + 1 }));
    assert.deepEqual(weakBridges, [], 'The frozen layout must not have single-bead digital cut points');
    const emptyHoles = enclosedEmptyComponents(occupied);
    const intendedHole = {
        size: 9, bounds: { x: 13, y: 4, width: 3, height: 3 },
        cellsOneBased: Array.from({ length: 9 }, (_, i) => ({ row: 5 + Math.floor(i / 3), column: 14 + i % 3 })),
    };
    assert.deepEqual(emptyHoles, [intendedHole], 'Only the exact 3 x 3 planned hanging opening may be enclosed');
    // Validate both blank opening and two-cell cap frame independently of the frozen row checksum.
    for (let row = 3; row <= 9; row++) for (let column = 12; column <= 18; column++) {
        const inHole = row >= 5 && row <= 7 && column >= 14 && column <= 16;
        assert.equal(ROWS[row - 1][column - 1], inHole ? '.' : 'G', 'Opening or two-cell hanging frame changed');
    }
    assert.ok(ROWS.every(row => row === [...row].reverse().join('')), 'The complete grid must mirror horizontally');
    const xs = [...occupied].map(i => i % SIZE), ys = [...occupied].map(i => Math.floor(i / SIZE));
    const bounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
    assert.deepEqual(bounds, { x: 4, y: 2, width: 21, height: 25 });
    const topology = {
        model: 'Orthogonal grid adjacency only; not a physical strength or hanging prediction',
        components: 1, singleBeadCutPoints: 0, enclosedEmptyComponents: emptyHoles,
        mirrorHorizontal: true, mirrorVertical: false, hangingOpening: HANGING_OPENING,
    };
    const pattern = {
        id: ID, slug: SLUG, title: 'Christmas Bauble Ornament', titleZh: '圣诞圆挂饰图纸', kind: 'original',
        version: 'Original Christmas bauble ornament design v1', theme: 'Christmas',
        localizedSubjects: { de: 'Weihnachtskugel mit Aufhängeöffnung', fr: 'Boule de Noël à suspendre', ja: '吊り下げ穴付きクリスマスオーナメント' },
        description: 'An original Red, White and Cheddar round bauble with a two-cell-wide hanging frame and a 3 x 3 empty opening for a cord or ribbon.',
        descriptionZh: '原创红色圆挂饰，白色菱形与黄色顶环；顶环两格宽，中央预留3×3空格穿绳孔。',
        source: null,
        designMethod: 'Independent explicit symbol rows on a 29 x 29 square grid. One-based cap columns 12-18 and rows 3-9 omit columns 14-16 and rows 5-7. A stepped round body runs from row 10 through 27, with spans 12-18, 9-21, 7-23, 6-24, 5-25 and the reverse taper. Manhattan distance from column 15,row 19 defines a White ring at distances 4-6 and Cheddar center at distances 0-2 on Red. No third-party pixels, tracing, named character or generated raster artwork.',
        sourceNoteZh: '独立逻辑格阵原创；未使用第三方像素、描图或生成式图片；未实物拼制、熨烫、穿绳、悬挂或承重测试。',
        width: SIZE, height: SIZE, rows: ROWS, palette, materials: Object.values(palette), beads: 362, colorCount: 3, bounds,
        components: 1, requiresBacking: false, fragile: false, weakBridges, structureNotes: [], topology,
        requiresBackingMeaning: 'Legacy digital multi-part layout flag only; false is not a physical strength or hanging claim',
        hangingOpening: HANGING_OPENING,
        nominalLayout: { pitchMm: 5, widthMm: 105, heightMm: 125, meaning: 'Nominal grid footprint, not a measured cooled finished size or hole diameter' },
        intendedUse: 'A flat bauble ornament project with a planned empty opening for a cord or ribbon; not an assembled or hanging-tested object',
        physicalAssemblyTested: false, ironingTested: false, hangingTested: false, loadStrengthTested: false,
        validation: {
            grid: 'passed', palette: 'existing-project-perler-csv', designRowsSha256: ROWS_SHA256, rgbaSha256: sha(rgba),
            digitalFourConnectedComponents: 1, digitalSingleBeadCutPoints: 0, digitalEnclosedEmptyComponents: emptyHoles, topologyModel: topology.model,
            physicalAssemblyTested: false, ironingTested: false, hangingTested: false, loadStrengthTested: false,
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
    svg += '</g><g font-family="Arial,sans-serif" fill="#26352d"><text x="46" y="796" font-size="19">Christmas Bauble Ornament - 362 beads / 3 colors</text><text x="46" y="818" font-size="13">21 x 25 motif on a 29 x 29 MIDI board. Empty cells: no bead.</text>';
    Object.values(pattern.palette).forEach((color, i) => {
        svg += `<text x="${46 + i % 2 * 355}" y="${840 + Math.floor(i / 2) * 19}" font-size="12">${esc(color.symbol)}: ${esc(color.name)} ${esc(color.ref)} (${color.count})</text>`;
    });
    return svg + '<text x="46" y="884" font-size="12">Original digital grid; physical assembly, ironing and hanging untested.</text><text x="46" y="902" font-size="12">Opening: columns 14-16, rows 5-7. PNG is not an actual-size template.</text></g></svg>';
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
        description: 'Make an original Christmas bauble ornament with 362 Perler Midi beads in three colors and a planned 3 x 3 hanging opening. Download the printable grid or edit the pattern.',
        notes: [
            'Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.',
            'Leave columns 14–16 and rows 5–7 empty for the planned hanging opening. Coordinates start at 1.',
            'Print the PDF at 100% / Actual size and check its 50 mm scale line before use.',
            'Physical assembly, ironing, cord fit and hanging strength have not been tested. Perler screen colors are approximate.',
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
    for (const key of ['id', 'slug', 'title', 'kind', 'version', 'source', 'localizedSubjects', 'designMethod', 'sourceNoteZh', 'width', 'height', 'rows', 'palette', 'materials', 'beads', 'colorCount', 'bounds', 'components', 'requiresBacking', 'requiresBackingMeaning', 'hangingOpening', 'nominalLayout', 'intendedUse', 'weakBridges', 'topology', 'validation', 'physicalAssemblyTested', 'ironingTested', 'hangingTested', 'loadStrengthTested']) {
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
        beads: 362, colorCount: 3, fourConnectedComponents: 1, singleBeadCutPoints: 0, enclosedEmptyComponents: expected.pattern.topology.enclosedEmptyComponents, hangingOpening: HANGING_OPENING, materials: Object.values(expected.pattern.palette),
        nominalLayout: expected.pattern.nominalLayout, pixelPngEqualsProjectEqualsManifest: true, allPreviewPixelsMatchGrid: true, chartPngEqualsSvg: true,
        realEditorParse: true, realEditorSerializeReparse: true, physicalAssemblyTested: false, ironingTested: false, hangingTested: false, loadStrengthTested: false,
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
        fs.writeFileSync(path.join(output, 'README.md'), `# Christmas Bauble Ornament original v1 source pack\n\nPrivate Git-ignored digital source pack. Root owns rendered-image review; PDF authoring and review are separate.\n\nIndependent 29 x 29 symbol rows form a 21 x 25 bauble motif. In one-based coordinates, the cap spans columns 12-18 and rows 3-9, and its empty opening spans columns 14-16 and rows 5-7. Its frame is two cells wide. The body connects to the cap across seven cells. A White diamond ring surrounds a Cheddar center on a Red body. Red R 80-19005 (249), White W 80-19001 (60), Cheddar G 80-19057 (53), totaling 362 beads. Only dots are empty; White requires White beads. No external artwork, tracing, copied pattern or generated raster was used. Rows SHA256: ${ROWS_SHA256}.\n\nDigital orthogonal adjacency checks find one occupied component, no single-cell cut points and exactly one enclosed empty component: the intended nine-cell opening at zero-based x=13,y=4,width=3,height=3. These facts do not test fused-joint strength, remaining hole clearance, cord fit or hanging. Physical assembly, ironing, cord fitting, hanging and load strength are untested. The legacy requiresBacking=false describes a single digital component only. Nominal 5 mm pitch gives a 105 x 125 mm grid footprint; this is not a measured cooled finished size or a guaranteed 15 mm opening.\n\nNative subjects: DE Weihnachtskugel mit Aufhängeöffnung; FR Boule de Noël à suspendre; JA 吊り下げ穴付きクリスマスオーナメント. Method source: Perler Easter Egg Ornaments, https://perler.com/blogs/projects/easter-egg-ornaments, explains ribbon through a top opening after cooling. The website supplies separately authored guidance; manufacturer pixels and PDFs are not copied or redistributed.\n\nFive ready non-PDF assets map to future public names in candidate-assets.json. The PNG chart labels one-based row/column positions and the empty hanging opening; it is a counting image, not a calibrated actual-size placement template. PDF placeholders do not prove existence or approval; this script never calls a PDF marker, writes PDFs, modifies fonts or copies to public. Separate authoring supplies A4 and US Letter in all four languages.\n\nGenerate once with scripts/generate-original-bauble-sourcepack.mjs --output <this versioned artifacts directory>. Later use --check-only; existing output is never replaced. Checks decode every native PNG pixel and every preview pixel, compare chart PNG with SVG, validate manifest and project, and run the actual editor parser/decode/serialize/reparse. qa/sourcepack-checks.json records digital checks and hashes, never visual or physical approval.\n`, { flag: 'wx' });
    }
    const report = await check(output, expected);
    if (!checkOnly) fs.writeFileSync(path.join(output, 'qa/sourcepack-checks.json'), json({ checkedAt: CREATED_AT, state: 'private-digital-source-verified', ...report }), { flag: 'wx' });
    console.log(json({ output, mode: checkOnly ? 'read-only-check' : 'generated-private-candidate', ...report }));
}

await main();

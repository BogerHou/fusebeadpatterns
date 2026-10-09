/** Independently authored square-board winter grids. Never writes public assets or PDFs. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url), sharp = require('sharp'), ts = require('typescript');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SIZE = 29, CREATED_AT = '2026-10-09', BACKGROUND = [221, 216, 202];
const sha = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
// Freeze these only after root has inspected the actual candidate PNGs.
const ROWS_SHA256 = { 'original-christmas-stocking': '074751380307dee374a99e2633bee21ebc1f4b2f90c21e822cd91f0d08ea8b95', 'original-snowflake': '39f593fc6975bc8e4c3487ee9b82911311fadde239050f38837e8c49b1ce3317' };
const COLORS = {
    R: { ref: '80-19005', name: 'Red', rgb: [176, 53, 60] },
    W: { ref: '80-19001', name: 'White', rgb: [234, 239, 238] },
    B: { ref: '80-19009', name: 'Light Blue', rgb: [39, 140, 201] },
};
const DESIGNS = [
    {
        id: 'original-christmas-stocking', slug: 'christmas-stocking', title: 'Christmas Stocking', titleZh: '圣诞袜',
        version: 'Original Christmas stocking design v1', theme: 'Christmas',
        localizedSubjects: { de: 'Weihnachtsstrumpf', fr: 'Chaussette de Noël', ja: 'クリスマスの靴下' },
        description: 'An original red Christmas stocking with a white cuff, heel and toe, designed on a square Perler Midi grid.',
        designMethod: 'Independent explicit cells define a broad white cuff, red upright leg, bent foot and separate white heel and toe patches. No external pixels, tracing, official pattern or generated raster artwork.',
        rows: [
            '.............................',
            '.............................',
            '.............................',
            '......WWWWWWWWWWWW...........',
            '.....WWWWWWWWWWWWWW..........',
            '.....WWWWWWWWWWWWWW..........',
            '.....WWWWWWWWWWWWWW..........',
            '......WWWWWWWWWWWW...........',
            '.......RRRRRRRRRR............',
            '.......RRRRRRRRRR............',
            '.......RRRRRRRRRR............',
            '.......RRRRRRRRRR............',
            '.......RRRRRRRRRR............',
            '.......RRRRRRRRRR............',
            '.......RRRRRRRRRR............',
            '.......RRRRRRRRRR............',
            '.......RRRRRRRRRR............',
            '.......RRRRRRRRRR............',
            '.......WWWWRRRRRRRR..........',
            '.......WWWWRRRRRRRRRR........',
            '.......WWWWRRRRRRRRWWWW......',
            '.......WWWRRRRRRRRRWWWWW.....',
            '........RRRRRRRRRRRWWWWW.....',
            '........RRRRRRRRRRRWWWW......',
            '.........RRRRRRRRRRWWW.......',
            '..........RRRRRRRRRW.........',
            '.............................',
            '.............................',
            '.............................',
        ],
    },
    {
        id: 'original-snowflake', slug: 'snowflake', title: 'Snowflake', titleZh: '雪花',
        version: 'Original six-branch snowflake design v1', theme: 'Winter',
        localizedSubjects: { de: 'Schneeflocke', fr: 'Flocon de neige', ja: '雪の結晶' },
        description: 'An original light-blue snowflake with six primary branches, paired side twigs and a white center, adapted to a square Perler Midi grid.',
        designMethod: 'Six independently constructed thin primary strokes: two single-cell vertical stems and four narrow stepped diagonal stems, meeting at center cell (14,14), with paired short outward line twigs. The complete 29-cell canvas is mirrored horizontally and vertically. One-cell orthogonal staircase steps preserve shared edges rather than diagonal-only corners, while actual single-bead cut points are recorded rather than hidden by thickening. This is a square-board stylization, not a copied star/hexagonal pegboard pattern or an eight-spoke placeholder.',
        primaryArms: 6,
        rows: [
            '.............................',
            '.............................',
            '.............................',
            '..............B..............',
            '..............B..............',
            '...........B..B..B...........',
            '...........BB.B.BB...........',
            '........B...BBBBB...B........',
            '....B...B....BBB....B...B....',
            '....BBB.B.....B.....B.BBB....',
            '......BBB.....B.....BBB......',
            '.....BBBBB....B....BBBBB.....',
            '.....B...BBB..B..BBB...B.....',
            '...........BBBBBBB...........',
            '.............BWB.............',
            '...........BBBBBBB...........',
            '.....B...BBB..B..BBB...B.....',
            '.....BBBBB....B....BBBBB.....',
            '......BBB.....B.....BBB......',
            '....BBB.B.....B.....B.BBB....',
            '....B...B....BBB....B...B....',
            '........B...BBBBB...B........',
            '...........BB.B.BB...........',
            '...........B..B..B...........',
            '..............B..............',
            '..............B..............',
            '.............................',
            '.............................',
            '.............................',
        ],
    },
];

function options(args) {
    const result = { checkOnly: false, previewOnly: false };
    for (let i = 0; i < args.length; i++) {
        const argument = args[i];
        if (argument === '--check-only' || argument === '--preview-only') {
            const key = argument === '--check-only' ? 'checkOnly' : 'previewOnly';
            assert.equal(result[key], false, `Duplicate ${argument}`); result[key] = true;
        } else if (argument === '--output' || argument === '--preview-output') {
            const key = argument === '--output' ? 'output' : 'previewOutput';
            assert.equal(result[key], undefined, `Duplicate ${argument}`);
            result[key] = args[++i]; assert.ok(result[key] && !result[key].startsWith('--'), `Missing ${argument}`);
        } else throw new Error(`Unknown option: ${argument}`);
    }
    assert.ok(!(result.checkOnly && result.previewOnly), 'Choose read-only checking or previews');
    if (result.previewOnly) {
        assert.ok(result.previewOutput && !result.output, 'Preview-only requires an exclusive --preview-output and no --output');
        result.previewOutput = path.resolve(repo, result.previewOutput);
        assert.ok(path.basename(result.previewOutput).startsWith('original-winter-candidates-'), 'Use a clearly owned candidate staging directory');
        assert.ok(!result.previewOutput.split(path.sep).includes('public'), 'Candidate previews must not be written under public');
    } else {
        assert.equal(result.previewOutput, undefined, '--preview-output is only for candidate review');
        result.output = path.resolve(repo, result.output || 'artifacts/pattern-samples/2026-10-09/original-winter-v1');
        assert.equal(path.basename(result.output), 'original-winter-v1', 'Use the versioned winter source-pack name');
        assert.ok(result.output.split(path.sep).includes('artifacts'), 'Keep the private source pack under ignored artifacts');
        assert.ok(!result.output.split(path.sep).includes('public'), 'The private source pack must not be written under public');
    }
    return result;
}

function components(occupied, omitted) {
    const remaining = new Set(occupied); remaining.delete(omitted); const sizes = [];
    while (remaining.size) {
        const first = remaining.values().next().value; remaining.delete(first); const queue = [first];
        for (const cell of queue) {
            const x = cell % SIZE, y = Math.floor(cell / SIZE);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy, next = ny * SIZE + nx;
                if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || !remaining.has(next)) continue;
                remaining.delete(next); queue.push(next);
            }
        }
        sizes.push(queue.length);
    }
    return sizes.sort((a, b) => b - a);
}

function enclosedEmptyComponents(occupied) {
    const empty = new Set(Array.from({ length: SIZE * SIZE }, (_, index) => index).filter(index => !occupied.has(index)));
    const outside = [...empty].filter(index => index < SIZE || index >= SIZE * (SIZE - 1) || index % SIZE === 0 || index % SIZE === SIZE - 1);
    for (const cell of outside) empty.delete(cell);
    for (const cell of outside) {
        const x = cell % SIZE, y = Math.floor(cell / SIZE);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy, next = ny * SIZE + nx;
            if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || !empty.has(next)) continue;
            empty.delete(next); outside.push(next);
        }
    }
    return components(empty);
}

function designs(requireFrozen) {
    const csv = new Map(fs.readFileSync(path.join(repo, 'public/palettes/perler.csv'), 'utf8').trim().split(/\r?\n/).map(line => {
        const [ref, name, , r, g, b] = line.split(','); return [ref, { ref, name, rgb: [r, g, b].map(Number) }];
    }));
    return DESIGNS.map(design => {
        const rows = design.rows; assert.equal(rows.length, SIZE); assert.ok(rows.every(row => row.length === SIZE && /^[.RWB]+$/.test(row)));
        const rowsHash = sha(rows.join('\n')), lock = ROWS_SHA256[design.id];
        if (requireFrozen) assert.ok(lock, `${design.id}: root must review the PNG before rows are frozen for the final source pack`);
        if (lock) assert.equal(rowsHash, lock, 'Frozen v1 rows changed; review a new version');
        const palette = {}, occupied = new Set(), rgba = Buffer.alloc(SIZE * SIZE * 4);
        for (const symbol of [...new Set(rows.join('').replaceAll('.', ''))]) {
            const expected = COLORS[symbol], actual = csv.get(expected.ref); assert.deepEqual(actual, expected, `Changed Perler Midi CSV color: ${symbol}`);
            palette[symbol] = { ...actual, symbol, hex: `#${Buffer.from(actual.rgb).toString('hex')}`, count: rows.join('').split(symbol).length - 1 };
        }
        assert.ok(Object.keys(palette).length <= 3);
        rows.forEach((row, y) => [...row].forEach((symbol, x) => { if (symbol !== '.') { occupied.add(y * SIZE + x); rgba.set([...palette[symbol].rgb, 255], (y * SIZE + x) * 4); } }));
        const beads = occupied.size; assert.deepEqual(components(occupied), [beads]);
        const weakBridges = [...occupied].filter(cell => components(occupied, cell).length > 1).map(cell => ({ row: Math.floor(cell / SIZE) + 1, column: cell % SIZE + 1 }));
        const mirrorHorizontal = rows.every(row => row === [...row].reverse().join(''));
        const mirrorVertical = rows.every((row, index) => row === rows[SIZE - 1 - index]);
        const emptyHoles = enclosedEmptyComponents(occupied);
        if (design.primaryArms) {
            assert.ok(mirrorHorizontal && mirrorVertical, 'Snowflake must mirror across both full-canvas axes');
            assert.deepEqual(emptyHoles, [], 'Snowflake must not enclose empty cells at branch ends');
        }
        const xs = [...occupied].map(cell => cell % SIZE), ys = [...occupied].map(cell => Math.floor(cell / SIZE));
        const bounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
        const topology = { model: 'Orthogonal grid adjacency only; not a physical strength prediction', components: 1, singleBeadCutPoints: weakBridges.length, enclosedEmptyComponents: emptyHoles, mirrorHorizontal, mirrorVertical, ...(design.primaryArms ? { primaryArms: design.primaryArms } : {}) };
        const structureNotes = weakBridges.length ? [`Thin one-bead connections at ${weakBridges.map(({ row, column }) => `row ${row}, column ${column}`).join('; ')}. Handle these areas carefully and consider a backing.`] : [];
        const pattern = { ...design, kind: 'original', source: null, width: SIZE, height: SIZE, palette, materials: Object.values(palette), beads, colorCount: Object.keys(palette).length, bounds, components: 1, requiresBacking: false, fragile: weakBridges.length > 0, weakBridges, structureNotes, topology, physicalAssemblyTested: false, ironingTested: false, hangingTested: false,
            validation: { grid: 'passed', palette: 'existing-project-perler-csv', designRowsSha256: rowsHash, rgbaSha256: sha(rgba), digitalFourConnectedComponents: 1, digitalSingleBeadCutPoints: weakBridges.length, topologyModel: topology.model, physicalAssemblyTested: false, ironingTested: false, hangingTested: false, officialPatternCopied: false, namedCharacter: false, visualReview: 'Not asserted by this script; root owns rendered-image review' } };
        return { pattern, rgba };
    });
}

function project(pattern, rgba) {
    return { type: 'bead-pattern-project-v1', version: 1, savedAt: `${CREATED_AT}T00:00:00.000Z`, draft: {
        version: 1, sourceMode: 'blank', imageSrc: null, fileName: pattern.id, selectedPaletteIds: ['perler'],
        activePalettes: [{ name: 'Perler Midi', entries: Object.values(pattern.palette).map(color => ({ name: color.name, ref: color.ref, symbol: color.symbol, prefix: 'P', enabled: true, color: { r: color.rgb[0], g: color.rgb[1], b: color.rgb[2], a: 255 } })) }],
        boardId: 'midi', boardWidth: 1, boardHeight: 1, matchingId: 'delta_e_cie2000', ditheringId: 'none', useSymbols: true, exportFormatId: 'pdf', pdfScaleMode: 'midi-5mm',
        imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 }, rendererSettings: { center: true, fit: true, showGrid: true }, showReference: false, referenceOpacity: .3, previewZoom: 1,
        editedPattern: { width: SIZE, height: SIZE, byteLength: rgba.length, data: rgba.toString('base64') },
    } };
}

function editorModule() {
    const cache = new Map();
    function load(file) {
        if (cache.has(file)) return cache.get(file); const loadedModule = { exports: {} }; cache.set(file, loadedModule.exports);
        const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
        const localRequire = name => { const target = name.startsWith('@/') ? path.resolve(repo, 'src', name.slice(2)) : path.resolve(path.dirname(file), name); return load(fs.existsSync(target) ? target : target + '.ts'); };
        vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, require: localRequire, atob, btoa, Uint8ClampedArray }, { filename: file }); return loadedModule.exports;
    }
    return load(path.join(repo, 'src/lib/editor/draft.ts'));
}

function verifyProject(bytes, expected) {
    assert.deepEqual(JSON.parse(bytes), project(expected.pattern, expected.rgba));
    const editor = editorModule(), draft = editor.parseEditorProject(bytes.toString()); assert.ok(draft, 'Real editor parser rejected the project');
    assert.ok(Buffer.from(editor.decodeEditorPatternDraft(draft.editedPattern)).equals(expected.rgba));
    assert.equal(JSON.stringify(editor.parseEditorProject(editor.serializeEditorProject(draft))), JSON.stringify(draft));
}

async function previewBuffer(model) {
    const data = Buffer.alloc(580 * 580 * 4);
    for (let y = 0; y < 580; y++) for (let x = 0; x < 580; x++) {
        const symbol = model.pattern.rows[Math.floor(y / 20)][Math.floor(x / 20)];
        data.set([...(symbol === '.' ? BACKGROUND : model.pattern.palette[symbol].rgb), 255], (y * 580 + x) * 4);
    }
    return sharp(data, { raw: { width: 580, height: 580, channels: 4 } }).png().toBuffer();
}

async function verifyPreview(bytes, pattern) {
    const preview = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([preview.info.width, preview.info.height], [580, 580]);
    for (let y = 0; y < 580; y++) for (let x = 0; x < 580; x++) {
        const symbol = pattern.rows[Math.floor(y / 20)][Math.floor(x / 20)];
        const expected = [...(symbol === '.' ? BACKGROUND : pattern.palette[symbol].rgb), 255];
        assert.ok(preview.data.subarray((y * 580 + x) * 4, (y * 580 + x + 1) * 4).equals(Buffer.from(expected)), `Preview differs at pixel ${x},${y}`);
    }
}

function chartSvg(pattern) {
    const margin = 46, cell = 24, edge = margin + SIZE * cell;
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="788" height="908"><rect width="100%" height="100%" fill="white"/><g shape-rendering="crispEdges">';
    pattern.rows.forEach((row, y) => [...row].forEach((symbol, x) => { if (symbol !== '.') svg += `<rect x="${margin + x * cell}" y="${margin + y * cell}" width="${cell}" height="${cell}" fill="${pattern.palette[symbol].hex}"/>`; }));
    svg += '</g>';
    for (let i = 0; i <= SIZE; i++) { const pos = margin + i * cell, major = i % 5 === 0 || i === SIZE; svg += `<path d="M${pos},${margin}V${edge}M${margin},${pos}H${edge}" stroke="${major ? '#53635b' : '#a4afa7'}" stroke-width="${major ? 1.3 : .6}"/>`; }
    svg += '<g font-family="Arial,sans-serif" font-size="10" text-anchor="middle" fill="#26352d">';
    for (let i = 0; i < SIZE; i++) svg += `<text x="${margin + (i + .5) * cell}" y="32">${i + 1}</text><text x="28" y="${margin + (i + .5) * cell + 3}">${i + 1}</text>`;
    pattern.rows.forEach((row, y) => [...row].forEach((symbol, x) => { if (symbol !== '.') { const color = pattern.palette[symbol], lum = .2126 * color.rgb[0] + .7152 * color.rgb[1] + .0722 * color.rgb[2]; svg += `<text x="${margin + (x + .5) * cell}" y="${margin + (y + .5) * cell + 3}" fill="${lum < 140 ? 'white' : '#17231b'}">${symbol}</text>`; } }));
    svg += `</g><g font-family="Arial,sans-serif" fill="#26352d"><text x="46" y="796" font-size="19">${esc(pattern.title)} - ${pattern.beads} beads / ${pattern.colorCount} colors</text><text x="46" y="818" font-size="13">${pattern.bounds.width} x ${pattern.bounds.height} motif on a square 29 x 29 MIDI board. Empty: no bead.</text>`;
    Object.values(pattern.palette).forEach((color, i) => { svg += `<text x="${46 + i % 2 * 355}" y="${840 + Math.floor(i / 2) * 19}" font-size="12">${color.symbol}: ${esc(color.name)} ${esc(color.ref)} (${color.count})</text>`; });
    return svg + '<text x="46" y="896" font-size="12">Not physically assembled, iron-tested or hang-tested. PNG is not an actual-size template.</text></g></svg>';
}

function siteEntries(models) { return models.map(({ pattern }) => ({ id: pattern.id, slug: pattern.slug, title: pattern.title, kind: 'original', version: pattern.version, description: `${pattern.description} Uses ${pattern.beads} Perler Midi beads in ${pattern.colorCount} colors.` })); }
function assetMapping(models) { return { state: 'private-candidate-not-published', patterns: models.map(({ pattern }) => ({ id: pattern.id, files: { 'preview.png': `previews/${pattern.id}.png`, 'grid.png': `charts/${pattern.id}.png`, 'grid.svg': `charts/${pattern.id}.svg`, 'pixels.png': `pixels/${pattern.id}.png`, 'pattern.bead-pattern.json': `projects/${pattern.id}.bead-pattern.json` }, pendingFiles: { 'pattern.pdf': `pdfs/${pattern.id}.pdf`, 'pattern-letter.pdf': `pdfs/${pattern.id}-us-letter.pdf` } })), pendingPdfReferences: ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf'] }; }

async function check(output, models) {
    const manifest = JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'))); assert.equal(manifest.createdAt, CREATED_AT); assert.equal(manifest.patterns.length, models.length);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'site-entries.json'))), siteEntries(models));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'candidate-assets.json'))), assetMapping(models));
    const reports = [];
    for (const [index, model] of models.entries()) {
        const { pattern, rgba } = model, id = pattern.id, actual = manifest.patterns[index];
        for (const key of ['id', 'slug', 'title', 'kind', 'source', 'version', 'width', 'height', 'rows', 'palette', 'materials', 'beads', 'colorCount', 'bounds', 'components', 'weakBridges', 'requiresBacking', 'fragile', 'structureNotes', 'topology', 'physicalAssemblyTested', 'ironingTested', 'hangingTested', 'localizedSubjects']) assert.deepEqual(actual[key], pattern[key], `Manifest changed: ${id} ${key}`);
        for (const key of ['grid', 'palette', 'designRowsSha256', 'rgbaSha256', 'digitalFourConnectedComponents', 'digitalSingleBeadCutPoints', 'topologyModel', 'physicalAssemblyTested', 'ironingTested', 'hangingTested', 'officialPatternCopied', 'namedCharacter']) assert.deepEqual(actual.validation[key], pattern.validation[key], `Digital validation changed: ${id} ${key}`);
        const pngBytes = fs.readFileSync(path.join(output, 'pixels', `${id}.png`)), png = await sharp(pngBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.deepEqual([png.info.width, png.info.height], [SIZE, SIZE]); assert.ok(png.data.equals(rgba));
        verifyProject(fs.readFileSync(path.join(output, 'projects', `${id}.bead-pattern.json`)), model);
        const previewBytes = fs.readFileSync(path.join(output, 'previews', `${id}.png`)); await verifyPreview(previewBytes, pattern);
        const svg = fs.readFileSync(path.join(output, 'charts', `${id}.svg`), 'utf8'); assert.equal(svg, chartSvg(pattern));
        const rendered = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer(), chart = await sharp(path.join(output, 'charts', `${id}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.deepEqual([chart.info.width, chart.info.height], [788, 908]); assert.ok(chart.data.equals(rendered));
        const files = [`pixels/${id}.png`, `previews/${id}.png`, `charts/${id}.svg`, `charts/${id}.png`, `projects/${id}.bead-pattern.json`];
        reports.push({ id, rowsSha256: sha(pattern.rows.join('\n')), rgbaSha256: sha(rgba), previewSha256: sha(previewBytes), beads: pattern.beads, colorCount: pattern.colorCount, bounds: pattern.bounds, materials: Object.values(pattern.palette), topology: pattern.topology, pixelPngEqualsProjectEqualsRows: true, allPreviewPixelsMatchGrid: true, chartPngEqualsSvg: true, realEditorParse: true, realEditorSerializeReparse: true, physicalAssemblyTested: false, ironingTested: false, hangingTested: false, pdfVerification: 'Not performed; root owns PDF authoring and approval', fileSha256: Object.fromEntries(files.map(file => [file, sha(fs.readFileSync(path.join(output, file)))])) });
    }
    const report = { checkedAt: CREATED_AT, state: 'private-digital-source-verified-not-visual-or-pdf-approval', patterns: reports };
    const receipt = path.join(output, 'qa/sourcepack-checks.json'); if (fs.existsSync(receipt)) assert.deepEqual(JSON.parse(fs.readFileSync(receipt)), report, 'Saved digital QA receipt changed');
    return report;
}

async function main() {
    const plan = options(process.argv.slice(2)), models = designs(!plan.previewOnly);
    for (const model of models) verifyProject(Buffer.from(json(project(model.pattern, model.rgba))), model);
    if (plan.previewOnly) {
        assert.ok(!fs.existsSync(plan.previewOutput), 'Candidate staging directory already exists');
        const buffers = await Promise.all(models.map(previewBuffer)); fs.mkdirSync(path.dirname(plan.previewOutput), { recursive: true }); fs.mkdirSync(plan.previewOutput);
        for (const [index, model] of models.entries()) {
            const output = path.join(plan.previewOutput, `${model.pattern.id}.png`); fs.writeFileSync(output, buffers[index], { flag: 'wx' });
            await verifyPreview(fs.readFileSync(output), model.pattern);
        }
        console.log(json({ mode: 'private-preview-only-not-approved', output: plan.previewOutput, patterns: models.map(({ pattern }, index) => ({ id: pattern.id, beads: pattern.beads, bounds: pattern.bounds, materials: Object.values(pattern.palette), topology: pattern.topology, weakBridges: pattern.weakBridges, fragile: pattern.fragile, requiresBacking: pattern.requiresBacking, structureNotes: pattern.structureNotes, rowsSha256: sha(pattern.rows.join('\n')), previewSha256: sha(buffers[index]), allPreviewPixelsMatchGrid: true, realEditorParse: true, realEditorSerializeReparse: true, physicalAssemblyTested: false, ironingTested: false, hangingTested: false, preview: path.join(plan.previewOutput, `${pattern.id}.png`) })) })); return;
    }
    if (!plan.checkOnly) {
        assert.ok(!fs.existsSync(plan.output), 'Source pack exists; use --check-only');
        fs.mkdirSync(path.dirname(plan.output), { recursive: true }); fs.mkdirSync(plan.output);
        for (const directory of ['pixels', 'previews', 'charts', 'projects', 'qa']) fs.mkdirSync(path.join(plan.output, directory));
        const put = (relative, bytes) => fs.writeFileSync(path.join(plan.output, relative), bytes, { flag: 'wx' });
        for (const model of models) {
            const { pattern, rgba } = model, id = pattern.id, svg = chartSvg(pattern);
            put(`pixels/${id}.png`, await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer());
            put(`previews/${id}.png`, await previewBuffer(model)); put(`charts/${id}.svg`, svg); put(`charts/${id}.png`, await sharp(Buffer.from(svg)).png().toBuffer()); put(`projects/${id}.bead-pattern.json`, json(project(pattern, rgba)));
        }
        put('manifest.json', json({ createdAt: CREATED_AT, state: 'private-original-grid-candidate-pdf-pending', paletteSource: 'public/palettes/perler.csv; physical bead colors not independently measured', pendingPdfFiles: ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf', ...models.flatMap(({ pattern }) => [`pdfs/${pattern.id}.pdf`, `pdfs/${pattern.id}-us-letter.pdf`])], patterns: models.map(model => model.pattern) }));
        put('site-entries.json', json(siteEntries(models))); put('candidate-assets.json', json(assetMapping(models)));
        put('README.md', '# Original winter v1 private source pack\n\nTwo independently authored square 29 x 29 Perler Midi grids: Christmas Stocking and a six-primary-branch Snowflake. Exact rows, materials, coordinates, row/RGBA hashes and digital topology are in manifest.json. No official star/hexagonal board pattern or outside pixels were used.\n\nAll colors are read and checked against the existing Perler Midi CSV. Screen colors are approximate. Four-connected component and digital single-bead articulation counts are recorded from the grid, not assembly/ironing/hanging tests. Any single-bead cut points are listed by row and column; shape is not thickened just to hide those points. Those physical checks are false. Rendered-image approval is root-owned and is not asserted by this generator.\n\nFive non-PDF assets per pattern map to the existing preview/grid/native-pixel/editor contract in candidate-assets.json. Both saved projects use Perler Midi and one square Midi board with exact 29 x 29 edited pixels. PNG charts are counting references, not actual-size print templates.\n\nPDF paths in pendingPdfFiles and candidate-assets.json are references only. No PDFs are created here and no authoring marker is called. Root must separately author and review PDFs before promotion, update its PDF/visual receipt and clear pending PDF metadata under its own authority. After generation use --check-only; it verifies digital files without overwriting root-owned additions or approving PDFs.\n');
    }
    const report = await check(plan.output, models); if (!plan.checkOnly) fs.writeFileSync(path.join(plan.output, 'qa/sourcepack-checks.json'), json(report), { flag: 'wx' }); console.log(json({ output: plan.output, mode: plan.checkOnly ? 'read-only-check' : 'generated-private-candidate', ...report }));
}

await main();

/** Reuse the locked original Ghost cells on a Perler Mini board. Never writes PDFs. */
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
export const PROJECT_ID = 'original-friendly-ghost-perler-mini';
export const SOURCE_SIZE = 29;
export const BOARD_SIZE = 57;
export const PADDING = 14;
export const SOURCE_LOCKS = {
    pixelsPng: '5fb92e52e2dfafaf9ce10f0dbf80943a2844018733544317d77c5d15ecd3bd49',
    project: '63315f90f5a69e6fcd467739fa2b3903537b54a1643381fc7639dcdc07e963b0',
    rgba: 'fefb58a1c8222731a99982e6ce35ca709c79f47ba5d2fd068174075ae49c85a0',
};
const SOURCE_DIRECTORY = 'public/patterns/original-friendly-ghost';
const CREATED_AT = '2026-10-09';
const PREVIEW_SIZE = 580;
const CHART_SIZE = { width: 788, height: 930 };
const BACKGROUND = [232, 226, 213];
const MATERIALS = {
    W: { symbol: 'W', ref: 'PM-WHITE', name: 'White', rgb: [234, 239, 238], hex: '#eaefee', count: 293 },
    B: { symbol: 'B', ref: 'PM-BLACK', name: 'Black', rgb: [50, 50, 52], hex: '#323234', count: 18 },
};
const ASSETS = {
    'preview.png': 'previews/ghost-mini.png',
    'grid.png': 'charts/ghost-mini.png',
    'pixels.png': 'pixels/ghost-mini.png',
    'pattern.bead-pattern.json': 'projects/ghost-mini.bead-pattern.json',
};
const json = value => JSON.stringify(value, null, 2) + '\n';
export const sha256 = value => createHash('sha256').update(value).digest('hex');

export function options(args) {
    const result = { checkOnly: false };
    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === '--check-only') {
            assert.equal(result.checkOnly, false, 'Duplicate --check-only');
            result.checkOnly = true;
        } else if (argument === '--output' || argument === '--public-output') {
            const key = argument === '--output' ? 'output' : 'publicOutput';
            assert.equal(result[key], undefined, `Duplicate ${argument}`);
            result[key] = args[++index];
            assert.ok(result[key] && !result[key].startsWith('--'), `Missing ${argument} directory`);
        } else throw new Error(`Unknown option: ${argument}`);
    }
    result.output = path.resolve(repo, result.output || 'artifacts/pattern-samples/2026-10-09/mini-ghost-v1');
    result.publicOutput = path.resolve(repo, result.publicOutput || 'public/guides/mini-perler-beads/ghost-mini');
    assert.equal(path.basename(result.output), 'mini-ghost-v1', 'Use the reviewed versioned source-pack name');
    assert.ok(result.output.split(path.sep).includes('artifacts'), 'Keep the private source pack under an ignored artifacts directory');
    assert.equal(path.basename(result.publicOutput), 'ghost-mini', 'Use the isolated ghost-mini asset directory');
    assert.notEqual(result.output, result.publicOutput);
    for (const [parent, child] of [[result.output, result.publicOutput], [result.publicOutput, result.output]]) {
        const relative = path.relative(parent, child);
        assert.ok(relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative), 'Private and public output directories must not contain one another');
    }
    return result;
}

export function validateSourceBytes(pixels, project) {
    assert.equal(sha256(pixels), SOURCE_LOCKS.pixelsPng, 'Original Ghost PNG bytes changed');
    assert.equal(sha256(project), SOURCE_LOCKS.project, 'Original Ghost project bytes changed');
}

export function paddedPattern(original) {
    assert.equal(original.length, SOURCE_SIZE * SOURCE_SIZE * 4);
    assert.equal(sha256(original), SOURCE_LOCKS.rgba, 'Original Ghost pixel grid changed');
    const padded = Buffer.alloc(BOARD_SIZE * BOARD_SIZE * 4);
    for (let row = 0; row < SOURCE_SIZE; row++) {
        original.copy(padded, ((row + PADDING) * BOARD_SIZE + PADDING) * 4,
            row * SOURCE_SIZE * 4, (row + 1) * SOURCE_SIZE * 4);
    }
    return padded;
}

export function verifyPadding(original, padded) {
    assert.equal(padded.length, BOARD_SIZE * BOARD_SIZE * 4);
    for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
        const inside = x >= PADDING && x < PADDING + SOURCE_SIZE && y >= PADDING && y < PADDING + SOURCE_SIZE;
        const expected = inside
            ? original.subarray(((y - PADDING) * SOURCE_SIZE + x - PADDING) * 4, ((y - PADDING) * SOURCE_SIZE + x - PADDING + 1) * 4)
            : Buffer.alloc(4);
        assert.ok(padded.subarray((y * BOARD_SIZE + x) * 4, (y * BOARD_SIZE + x + 1) * 4).equals(expected), `Changed pixel at Mini column ${x + 1}, row ${y + 1}`);
    }
}

export function makeProject(originalProject, padded) {
    const draft = structuredClone(originalProject.draft);
    Object.assign(draft, {
        sourceMode: 'blank', imageSrc: null, fileName: PROJECT_ID,
        selectedPaletteIds: ['perler_mini'],
        activePalettes: [{ name: 'Perler Mini', entries: Object.values(MATERIALS).map(color => ({
            name: color.name, ref: color.ref, symbol: color.symbol, prefix: 'PM', enabled: true,
            color: { r: color.rgb[0], g: color.rgb[1], b: color.rgb[2], a: 255 },
        })) }],
        boardId: 'mini', boardWidth: 1, boardHeight: 1, pdfScaleMode: 'fit-page',
        editedPattern: { width: BOARD_SIZE, height: BOARD_SIZE, byteLength: padded.length, data: padded.toString('base64') },
    });
    return { type: 'bead-pattern-project-v1', version: 1, savedAt: `${CREATED_AT}T00:00:00.000Z`, draft };
}

function editorModule() {
    const cache = new Map();
    function load(file) {
        if (cache.has(file)) return cache.get(file);
        const loaded = { exports: {} };
        cache.set(file, loaded.exports);
        const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText;
        const localRequire = name => {
            const target = name.startsWith('@/') ? path.resolve(repo, 'src', name.slice(2)) : path.resolve(path.dirname(file), name);
            return load(fs.existsSync(target) ? target : target + '.ts');
        };
        vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: localRequire, atob, btoa, Uint8ClampedArray }, { filename: file });
        return loaded.exports;
    }
    return load(path.join(repo, 'src/lib/editor/draft.ts'));
}

export function validateEditorProject(bytes, expected) {
    const editor = editorModule();
    const draft = editor.parseEditorProject(bytes.toString());
    assert.ok(draft, 'The real editor parser rejected the Mini project');
    assert.deepEqual(Array.from(draft.selectedPaletteIds), ['perler_mini']);
    assert.equal(draft.boardId, 'mini');
    assert.equal(draft.boardWidth, 1);
    assert.equal(draft.boardHeight, 1);
    assert.equal(draft.sourceMode, 'blank');
    assert.equal(draft.imageSrc, null);
    assert.equal(draft.pdfScaleMode, 'fit-page');
    assert.equal(draft.fileName, PROJECT_ID);
    assert.equal(draft.useSymbols, true);
    assert.deepEqual([draft.editedPattern.width, draft.editedPattern.height], [BOARD_SIZE, BOARD_SIZE]);
    assert.ok(Buffer.from(editor.decodeEditorPatternDraft(draft.editedPattern)).equals(expected), 'Editor decoding changed the 57 x 57 pixels');
    assert.equal(JSON.stringify(editor.parseEditorProject(editor.serializeEditorProject(draft))), JSON.stringify(draft));
    const entries = draft.activePalettes.flatMap(palette => palette.entries);
    assert.equal(entries.length, 2);
    assert.equal(draft.activePalettes.length, 1);
    assert.equal(draft.activePalettes[0].name, 'Perler Mini');
    assert.deepEqual(Array.from(entries, entry => entry.ref).sort(), ['PM-BLACK', 'PM-WHITE']);
    for (const entry of entries) {
        const color = Object.values(MATERIALS).find(value => value.ref === entry.ref);
        assert.deepEqual(JSON.parse(JSON.stringify(entry)), {
            name: color.name, ref: color.ref, symbol: color.symbol, prefix: 'PM', enabled: true,
            color: { r: color.rgb[0], g: color.rgb[1], b: color.rgb[2], a: 255 },
        }, 'The Mini palette must contain only the unchanged White and Black colors and internal references');
    }
    return draft;
}

export async function sourceModel() {
    const png = fs.readFileSync(path.join(repo, SOURCE_DIRECTORY, 'pixels.png'));
    const projectBytes = fs.readFileSync(path.join(repo, SOURCE_DIRECTORY, 'pattern.bead-pattern.json'));
    validateSourceBytes(png, projectBytes);
    const decoded = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([decoded.info.width, decoded.info.height], [SOURCE_SIZE, SOURCE_SIZE]);
    const original = decoded.data;
    const originalProject = JSON.parse(projectBytes);
    assert.ok(Buffer.from(originalProject.draft.editedPattern.data, 'base64').equals(original));
    const rows = [], counts = { W: 0, B: 0 }, occupied = [];
    for (let y = 0; y < SOURCE_SIZE; y++) {
        let row = '';
        for (let x = 0; x < SOURCE_SIZE; x++) {
            const pixel = [...original.subarray((y * SOURCE_SIZE + x) * 4, (y * SOURCE_SIZE + x + 1) * 4)];
            const symbol = Object.values(MATERIALS).find(color => [...color.rgb, 255].every((channel, index) => channel === pixel[index]))?.symbol;
            if (!symbol) assert.deepEqual(pixel, [0, 0, 0, 0], 'The original grid contains an unreviewed color');
            row += symbol || '.';
            if (symbol) { counts[symbol]++; occupied.push({ x, y }); }
        }
        rows.push(row);
    }
    assert.deepEqual(counts, { W: 293, B: 18 });
    assert.equal(occupied.length, 311);
    const xs = occupied.map(pixel => pixel.x), ys = occupied.map(pixel => pixel.y);
    const sourceBounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
    assert.deepEqual(sourceBounds, { x: 5, y: 4, width: 19, height: 21 });
    const targetBounds = { ...sourceBounds, x: sourceBounds.x + PADDING, y: sourceBounds.y + PADDING };
    const padded = paddedPattern(original);
    verifyPadding(original, padded);
    const project = makeProject(originalProject, padded);
    validateEditorProject(Buffer.from(json(project)), padded);
    return { original, png, originalProjectBytes: projectBytes, padded, project, rows, palette: MATERIALS, sourceBounds, targetBounds };
}

export function chartSvg(model) {
    const margin = 46, cell = 24, edge = margin + SOURCE_SIZE * cell;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CHART_SIZE.width}" height="${CHART_SIZE.height}"><rect width="100%" height="100%" fill="white"/><g shape-rendering="crispEdges">`;
    model.rows.forEach((row, y) => [...row].forEach((symbol, x) => {
        if (symbol !== '.') svg += `<rect x="${margin + x * cell}" y="${margin + y * cell}" width="${cell}" height="${cell}" fill="${MATERIALS[symbol].hex}"/>`;
    }));
    svg += '</g>';
    for (let i = 0; i <= SOURCE_SIZE; i++) {
        const pos = margin + i * cell, major = i % 5 === 0 || i === SOURCE_SIZE;
        svg += `<path d="M${pos},${margin}V${edge}M${margin},${pos}H${edge}" stroke="${major ? '#53635b' : '#a4afa7'}" stroke-width="${major ? 1.3 : .6}"/>`;
    }
    svg += '<g font-family="Arial,sans-serif" font-size="10" text-anchor="middle" fill="#26352d">';
    for (let i = 0; i < SOURCE_SIZE; i++) svg += `<text x="${margin + (i + .5) * cell}" y="32">${i + 1}</text><text x="28" y="${margin + (i + .5) * cell + 3}">${i + 1}</text>`;
    model.rows.forEach((row, y) => [...row].forEach((symbol, x) => {
        if (symbol !== '.') svg += `<text x="${margin + (x + .5) * cell}" y="${margin + (y + .5) * cell + 3}" fill="${symbol === 'B' ? 'white' : '#17231b'}">${symbol}</text>`;
    }));
    svg += '</g><g font-family="Arial,sans-serif" fill="#26352d">';
    svg += '<text x="46" y="789" font-size="19">Mini Ghost - 311 beads / 2 colors</text>';
    svg += '<text x="46" y="811" font-size="13">29 x 29 reading crop; centered on a 57 x 57 Mini project.</text>';
    svg += '<text x="46" y="831" font-size="13">Blank cells: no bead. W cells: White beads.</text>';
    for (const [index, color] of Object.values(MATERIALS).entries()) svg += `<text x="46" y="${854 + index * 20}" font-size="13">${color.symbol}: ${color.name} / ${color.count} beads</text>`;
    svg += '<text x="46" y="898" font-size="12">Use a matching Mini pegboard; read rows and columns.</text>';
    return svg + '<text x="46" y="918" font-size="12">Counting chart only. Not actual size. Assembly and ironing are untested.</text></g></svg>';
}

async function assetBuffers(model) {
    const preview = Buffer.alloc(PREVIEW_SIZE * PREVIEW_SIZE * 4);
    for (let y = 0; y < PREVIEW_SIZE; y++) for (let x = 0; x < PREVIEW_SIZE; x++) {
        const symbol = model.rows[Math.floor(y / 20)][Math.floor(x / 20)];
        preview.set([...(symbol === '.' ? BACKGROUND : MATERIALS[symbol].rgb), 255], (y * PREVIEW_SIZE + x) * 4);
    }
    const svg = chartSvg(model);
    return {
        'preview.png': await sharp(preview, { raw: { width: PREVIEW_SIZE, height: PREVIEW_SIZE, channels: 4 } }).png().toBuffer(),
        'grid.png': await sharp(Buffer.from(svg)).png().toBuffer(),
        'pixels.png': await sharp(model.padded, { raw: { width: BOARD_SIZE, height: BOARD_SIZE, channels: 4 } }).png().toBuffer(),
        'pattern.bead-pattern.json': Buffer.from(json(model.project)), svg,
    };
}

function manifest(model) {
    return {
        id: 'mini-ghost-v1', createdAt: CREATED_AT, state: 'digital-source-verified-no-pdf',
        source: { patternId: 'original-friendly-ghost', baseCommit: '225518cd5e5dc31745016b46f7dd6206ae0a2575', directory: SOURCE_DIRECTORY, pngSha256: SOURCE_LOCKS.pixelsPng, projectSha256: SOURCE_LOCKS.project, decodedRgbaSha256: SOURCE_LOCKS.rgba },
        projectId: PROJECT_ID, board: { id: 'mini', width: BOARD_SIZE, height: BOARD_SIZE, padding: PADDING },
        sourceGrid: { width: SOURCE_SIZE, height: SOURCE_SIZE, rows: model.rows, bounds: model.sourceBounds },
        projectBounds: model.targetBounds, materials: Object.values(MATERIALS), beads: 311, colorCount: 2,
        miniColorNames: 'White and Black availability reviewed from official Perler Mini sources by the root task.',
        chartReferences: 'PM-WHITE and PM-BLACK are internal chart identifiers, not manufacturer procurement SKUs. Mini purchase SKUs are unconfirmed.',
        colorValues: 'Existing original Ghost screen RGB values retained exactly; not measurements of physical Mini bead colors.',
        printContract: 'Counting chart only, no actual-size or pegboard-placement claim. Editable Mini project defaults to fit-page.',
        physicalAssemblyTested: false, ironingTested: false, pdfAuthored: false,
        transformation: 'No resampling, interpolation, recolouring or occupied-cell change. The entire original 29 x 29 RGBA canvas is padded by exactly 14 empty cells on every edge.',
    };
}

export async function checkArtifacts(output, publicOutput, model) {
    model ??= await sourceModel();
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'), 'utf8')), manifest(model));
    validateSourceBytes(fs.readFileSync(path.join(output, 'data/original-ghost.png')), fs.readFileSync(path.join(output, 'data/original-ghost.bead-pattern.json')));
    const svg = fs.readFileSync(path.join(output, 'charts/ghost-mini.svg'), 'utf8');
    assert.equal(svg, chartSvg(model));
    const expectedGrid = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
    const hashes = {};
    for (const [name, relative] of Object.entries(ASSETS)) {
        const bytes = fs.readFileSync(path.join(output, relative));
        assert.ok(bytes.equals(fs.readFileSync(path.join(publicOutput, name))), `Public asset differs from its preserved source pack: ${name}`);
        hashes[name] = sha256(bytes);
        if (name === 'pattern.bead-pattern.json') {
            assert.deepEqual(JSON.parse(bytes.toString()), model.project);
            validateEditorProject(bytes, model.padded);
        } else {
            const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            if (name === 'pixels.png') {
                assert.deepEqual([decoded.info.width, decoded.info.height], [BOARD_SIZE, BOARD_SIZE]);
                verifyPadding(model.original, decoded.data);
            } else if (name === 'grid.png') {
                assert.deepEqual([decoded.info.width, decoded.info.height], [CHART_SIZE.width, CHART_SIZE.height]);
                assert.ok(decoded.data.equals(expectedGrid), 'Grid PNG does not match its reviewed symbol chart');
            } else {
                assert.deepEqual([decoded.info.width, decoded.info.height], [PREVIEW_SIZE, PREVIEW_SIZE]);
                for (let y = 0; y < PREVIEW_SIZE; y++) for (let x = 0; x < PREVIEW_SIZE; x++) {
                    const symbol = model.rows[Math.floor(y / 20)][Math.floor(x / 20)];
                    const expected = [...(symbol === '.' ? BACKGROUND : MATERIALS[symbol].rgb), 255];
                    assert.ok(decoded.data.subarray((y * PREVIEW_SIZE + x) * 4, (y * PREVIEW_SIZE + x + 1) * 4).equals(Buffer.from(expected)), 'Preview changed original cells or used interpolation');
                }
            }
        }
    }
    const report = {
        id: PROJECT_ID, beads: 311, materials: Object.values(MATERIALS),
        sourceCanvas: [29, 29], miniCanvas: [57, 57], padding: { top: 14, bottom: 14, left: 14, right: 14 },
        readingGridOriginOnMiniBoard: { column: 15, row: 15, numbering: 'one-based' },
        sourceBounds: model.sourceBounds, projectBounds: model.targetBounds, boundsNumbering: 'zero-based',
        sourceHashes: SOURCE_LOCKS, rowsSha256: sha256(model.rows.join('\n')), paddedRgbaSha256: sha256(model.padded),
        fileSha256: hashes, exactSourceRgbaPreservedInsidePadding: true, realEditorParse: true, realEditorDecode57x57: true,
        publicEqualsSourcePack: true, miniProcurementSkuKnown: false, actualSizeVerified: false,
        physicalAssemblyTested: false, ironingTested: false, pdfAuthored: false,
    };
    const qaFile = path.join(output, 'qa/sourcepack-checks.json');
    if (fs.existsSync(qaFile)) assert.deepEqual(JSON.parse(fs.readFileSync(qaFile, 'utf8')), report, 'The preserved digital QA receipt differs from the current read-only verification');
    return report;
}

export async function generate(output, publicOutput) {
    assert.ok(!fs.existsSync(output), 'Source-pack directory exists; use --check-only without overwriting');
    assert.ok(!fs.existsSync(publicOutput), 'Public ghost-mini directory exists; use --check-only without overwriting');
    const model = await sourceModel(), buffers = await assetBuffers(model);
    // All buffers and the real editor parser are validated before new output dirs.
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.mkdirSync(output);
    fs.mkdirSync(path.dirname(publicOutput), { recursive: true });
    fs.mkdirSync(publicOutput);
    const put = (relative, bytes) => {
        const file = path.join(output, relative);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, bytes, { flag: 'wx' });
    };
    put('data/original-ghost.png', model.png);
    put('data/original-ghost.bead-pattern.json', model.originalProjectBytes);
    put('charts/ghost-mini.svg', buffers.svg);
    for (const [name, relative] of Object.entries(ASSETS)) {
        put(relative, buffers[name]);
        fs.writeFileSync(path.join(publicOutput, name), buffers[name], { flag: 'wx' });
    }
    put('manifest.json', json(manifest(model)));
    put('README.md', '# Mini Ghost v1 digital source pack\n\nThe existing original Ghost pixels and project are locked independently. Source data/original-ghost.png is 29 x 29; its decoded RGBA hash differs from its PNG-byte hash. projects/ghost-mini.bead-pattern.json is the new Perler Mini 57 x 57 blank project with exactly 14 empty cells padded on each edge.\n\nWhite 293 + Black 18 = 311 beads. PM-WHITE / PM-BLACK are internal chart IDs, not purchase SKUs. Original screen RGB values and alpha are unchanged. Mini purchase SKUs, actual print size, pegboard fit, assembly and ironing are not verified. The grid PNG is a 29 x 29 counting crop, and the project defaults to fit-page.\n\nThe four public non-PDF files are exact copies of their corresponding previews/charts/pixels/projects assets. The SVG is retained only as a reproducible private chart source. No PDF is authored here. Root owns any later language-specific counting PDFs and final publication review. Use the generator --check-only to preserve this source pack and later root-owned receipts.\n');
    const report = await checkArtifacts(output, publicOutput, model);
    put('qa/sourcepack-checks.json', json(report));
    return report;
}

export async function main(args = process.argv.slice(2)) {
    const plan = options(args);
    const report = plan.checkOnly ? await checkArtifacts(plan.output, plan.publicOutput) : await generate(plan.output, plan.publicOutput);
    console.log(json({ mode: plan.checkOnly ? 'read-only-check' : 'generated-digital-source', output: plan.output, publicOutput: plan.publicOutput, ...report }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

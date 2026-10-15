/** Independently drawn sunset landscape on an empty 58 x 58 grid. Private source pack only. */
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
export const SIZE = 58, BOARD_SIZE = 29;
const DATE = '2026-10-11', PACK = 'original-large-landscape-v1', BACKGROUND = [221, 216, 202];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const COLORS = {
    N: { ref: '80-15201', name: 'Midnight', rgb: [47, 60, 85] },
    P: { ref: '80-19007', name: 'Purple', rgb: [104, 75, 134] },
    L: { ref: '80-19070', name: 'Periwinkle Blue', rgb: [102, 131, 183] },
    A: { ref: '80-15182', name: 'Lavender', rgb: [175, 159, 206] },
    C: { ref: '80-19059', name: 'Hot Coral', rgb: [221, 89, 91] },
    G: { ref: '80-19057', name: 'Cheddar', rgb: [251, 177, 70] },
    Y: { ref: '80-19056', name: 'Pastel Yellow', rgb: [233, 226, 144] },
    T: { ref: '80-19058', name: 'Toothpaste', rgb: [150, 209, 212] },
};
const PUBLIC_NOTES = [
    'Use four 29 × 29 Midi pegboards arranged 2 × 2. The complete grid has 58 columns and 58 rows.',
    'The 52 × 48 landscape is drawn at this size, not enlarged from a single-board pattern.',
    'The first PDF page is a reduced overview; pages 2–5 show boards 1–4 at 5 mm spacing. Print at 100% / Actual size and check both 50 mm rulers.',
    'Empty grid cells do not need beads. The PNG is a counting chart, not an actual-size placement template.',
    'Physical assembly, ironing and cross-board join strength have not been tested. Perler screen colors are approximate.',
];
const span = (grid, y, left, right, symbol) => { for (let x = left; x <= right; x++) if (x >= 3 && x <= 54 && y >= 5 && y <= 52) grid[y][x] = symbol; };
function ridge(points, x) {
    for (let i = 0; i < points.length - 1; i++) {
        const [left, top] = points[i], [right, bottom] = points[i + 1];
        if (x >= left && x <= right) return Math.round(top + (bottom - top) * (x - left) / (right - left));
    }
    throw new Error('Missing independently drawn ridge coordinate');
}
function landscapeRows() {
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill('.'));
    // Flat colors are intentional pixel-art bands, never interpolated colors or a resized small picture.
    for (let y = 5; y <= 52; y++) span(grid, y, 3, 54, y <= 10 ? 'A' : y <= 15 ? 'C' : y <= 20 ? 'G' : y <= 26 ? 'C' : 'G');
    // Authored sun, partly occluded by the distant ridge. The warm core is not an external raster.
    for (let y = 11; y <= 23; y++) for (let x = 37; x <= 49; x++) if ((x - 43) ** 2 + (y - 17) ** 2 <= 36) grid[y][x] = 'Y';
    const far = [[3, 27], [8, 24], [17, 16], [24, 23], [31, 19], [39, 27], [46, 22], [54, 27]];
    const near = [[3, 32], [10, 28], [16, 31], [24, 27], [32, 32], [40, 29], [47, 32], [54, 29]];
    for (let x = 3; x <= 54; x++) {
        const top = ridge(far, x);
        for (let y = top; y <= 35; y++) grid[y][x] = 'L';
        // Independent stepped snow/light caps on two peaks; no automatic image matching.
        if ((x >= 14 && x <= 20) || (x >= 29 && x <= 33)) {
            const depth = x <= 20 ? Math.max(0, 3 - Math.abs(x - 17)) : Math.max(0, 2 - Math.abs(x - 31));
            for (let y = top; y < top + depth; y++) grid[y][x] = 'Y';
        }
        for (let y = ridge(near, x); y <= 35; y++) grid[y][x] = 'P';
    }
    // Lake and broken horizontal ripple highlights. Distinct ridge and lake layers retain readability.
    for (let y = 36; y <= 49; y++) span(grid, y, 3, 54, 'L');
    for (const [y, left, right] of [[36, 5, 18], [36, 24, 35], [38, 14, 29], [39, 5, 11], [40, 23, 34], [42, 8, 24], [43, 27, 35], [45, 16, 31], [46, 5, 14], [48, 18, 32], [49, 5, 16]]) span(grid, y, left, right, 'T');
    for (const [y, left, right, symbol] of [[36, 41, 45, 'Y'], [37, 39, 46, 'G'], [38, 42, 44, 'C'], [39, 40, 47, 'G'], [41, 41, 45, 'C'], [42, 37, 48, 'G'], [44, 39, 46, 'Y'], [46, 36, 49, 'C'], [48, 38, 48, 'G'], [49, 35, 51, 'G']]) span(grid, y, left, right, symbol);
    for (let y = 50; y <= 52; y++) span(grid, y, 3, 54, 'N');
    // Two original pine silhouettes and a descending left bank; narrow details sit inside a solid panel.
    for (let y = 43; y <= 49; y++) span(grid, y, 3, 3 + Math.floor((y - 43) * 1.6), 'N');
    const pines = [
        { center:9, top:29, radii:[0,1,1,2,3,1,2,3,4,5,1,2,3,4,5,6,6,1,1,1,1] },
        { center:17, top:37, radii:[0,1,2,3,1,2,3,4,5,1,1,1,1] },
    ];
    for (const tree of pines) tree.radii.forEach((radius,i) => span(grid,tree.top+i,tree.center-radius,tree.center+radius,'N'));
    // Low right foreground shoreline avoids blocking the sun's lake reflection.
    for (let y = 47; y <= 49; y++) span(grid, y, 54 - (y - 47) * 3, 54, 'N');
    return grid.map(row => row.join(''));
}
export const DEFINITIONS = [{
    id: 'original-sunset-mountain-lake', slug: 'sunset-mountain-lake', title: 'Sunset Mountain Lake', titleZh: '日落山湖',
    localizedSubjects: { de: 'Sonnenuntergang am Bergsee', fr: 'Lac de montagne au coucher du soleil', ja: '山と湖の夕景' },
    symbols: ['N', 'P', 'L', 'A', 'C', 'G', 'Y', 'T'], rows: landscapeRows(),
    description: 'An original sunset over layered mountains and a lake, with warm water reflections and dark foreground pines.',
    designMethod: 'Independent drawing started on an empty 58 x 58 grid: hand-chosen sky bands, a partially hidden sunset disk, two explicitly plotted mountain ridges, lake ripples and two pine silhouettes. No external pixels, tracing, character, image conversion or enlargement of a 29 x 29 design.',
}];

function actualPath(output) {
    let parent = output; const missing = [];
    while (!fs.existsSync(parent)) { missing.unshift(path.basename(parent)); const next = path.dirname(parent); assert.notEqual(next, parent); parent = next; }
    return path.join(fs.realpathSync(parent), ...missing);
}
function privateLocation(output) {
    const resolved = path.resolve(output);
    for (const candidate of [resolved, actualPath(resolved)]) {
        const parts = candidate.split(path.sep);
        assert.deepEqual(parts.slice(-4), ['artifacts', 'pattern-samples', DATE, PACK], 'Use the versioned private artifacts/pattern-samples/2026-10-11/original-large-landscape-v1 directory');
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
export function cutPoints(cells) {
    const entered = new Map(), low = new Map(), points = new Set(); let tick = 0;
    const directions = [[1,0],[-1,0],[0,1],[0,-1]];
    // A filled board can visit thousands of cells in a single DFS branch. Keep
    // Tarjan's enter/return state on the heap rather than the JavaScript stack.
    for (const cell of cells) {
        if (entered.has(cell)) continue;
        entered.set(cell, ++tick); low.set(cell, tick);
        const stack = [{ cell, parent: null, direction: 0, children: 0 }];
        while (stack.length) {
            const frame = stack[stack.length - 1];
            if (frame.direction < directions.length) {
                const [dx, dy] = directions[frame.direction++];
                const x = frame.cell % SIZE + dx, y = Math.floor(frame.cell / SIZE) + dy, next = y * SIZE + x;
                if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || !cells.has(next)) continue;
                if (!entered.has(next)) {
                    frame.children++; entered.set(next, ++tick); low.set(next, tick);
                    stack.push({ cell: next, parent: frame, direction: 0, children: 0 });
                } else if (next !== frame.parent?.cell) low.set(frame.cell, Math.min(low.get(frame.cell), entered.get(next)));
                continue;
            }
            stack.pop();
            if (frame.parent === null) {
                if (frame.children > 1) points.add(frame.cell);
            } else {
                const parent = frame.parent;
                low.set(parent.cell, Math.min(low.get(parent.cell), low.get(frame.cell)));
                if (parent.parent !== null && low.get(frame.cell) >= entered.get(parent.cell)) points.add(parent.cell);
            }
        }
    }
    return [...points].sort((a,b) => a-b);
}
export function tileRgba(rgba, column, row) {
    const result = Buffer.alloc(BOARD_SIZE * BOARD_SIZE * 4);
    for (let y = 0; y < BOARD_SIZE; y++) rgba.copy(result, y * BOARD_SIZE * 4, ((row * BOARD_SIZE + y) * SIZE + column * BOARD_SIZE) * 4, ((row * BOARD_SIZE + y) * SIZE + (column + 1) * BOARD_SIZE) * 4);
    return result;
}
export function designs() {
    const csvBytes = fs.readFileSync(path.join(repo, 'public/palettes/perler.csv'));
    const csv = new Map(csvBytes.toString().trim().split(/\r?\n/).map(line => { const [ref,name,,...rest] = line.split(','); return [ref,{ref,name,rgb:rest.slice(0,3).map(Number)}]; }));
    return DEFINITIONS.map(definition => {
        assert.equal(definition.rows.length,SIZE); assert.ok(definition.rows.every(row => row.length === SIZE)); assert.ok(definition.symbols.length <= 8);
        const palette = {}, occupied = new Set(), rgba = Buffer.alloc(SIZE * SIZE * 4);
        for (const symbol of definition.symbols) {
            const expected = COLORS[symbol]; assert.deepEqual(csv.get(expected.ref),expected,`Changed Perler CSV color ${symbol}`);
            const count = definition.rows.join('').split(symbol).length - 1; assert.ok(count > 0);
            palette[symbol] = {symbol,...expected,hex:'#'+Buffer.from(expected.rgb).toString('hex'),count};
        }
        definition.rows.forEach((row,y) => [...row].forEach((symbol,x) => {
            const inPanel = x >= 3 && x <= 54 && y >= 5 && y <= 52;
            assert.equal(symbol !== '.',inPanel,'The source must be a filled52 x48 panel with transparent border');
            if (symbol === '.') return;
            assert.ok(palette[symbol]); occupied.add(y*SIZE+x); rgba.set([...palette[symbol].rgb,255],(y*SIZE+x)*4);
        }));
        assert.equal(occupied.size,2496); const parts = components(occupied); assert.deepEqual(parts,[2496]);
        const weakBridges = cutPoints(occupied).map(cell => ({row:Math.floor(cell/SIZE)+1,column:cell%SIZE+1})); assert.deepEqual(weakBridges,[]);
        const bounds = {x:3,y:5,width:52,height:48};
        const boardTiles = [];
        for (let row = 0; row < 2; row++) for (let column = 0; column < 2; column++) {
            const data = tileRgba(rgba,column,row), counts = Object.fromEntries(definition.symbols.map(symbol => [symbol,0])); let beads = 0;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const symbol = definition.rows[row * BOARD_SIZE + y][column * BOARD_SIZE + x];
                if (symbol !== '.') {counts[symbol]++; beads++; assert.equal(data[(y*BOARD_SIZE+x)*4+3],255);}
                else assert.ok(data.subarray((y*BOARD_SIZE+x)*4,(y*BOARD_SIZE+x+1)*4).equals(Buffer.alloc(4)));
            }
            assert.equal(beads,624);
            boardTiles.push({board:row*2+column+1,column:column+1,row:row+1,width:29,height:29,cells:841,origin:{x:column*29,y:row*29},beads,emptyCells:217,counts,rgbaSha256:sha(data),file:`boards/${definition.id}-board-${row*2+column+1}.png`});
        }
        for (const material of Object.values(palette)) assert.equal(boardTiles.reduce((sum,tile) => sum+tile.counts[material.symbol],0),material.count);
        assert.equal(boardTiles.reduce((sum,tile) => sum+tile.beads,0),2496);
        const pattern = {...definition,kind:'original',version:'Original Sunset Landscape design v1',theme:'Landscape',source:null,notes:PUBLIC_NOTES,width:SIZE,height:SIZE,
            boardWidth:2,boardHeight:2,boardCellWidth:29,boardCellHeight:29,palette,materials:Object.values(palette),beads:2496,colorCount:definition.symbols.length,bounds,boardTiles,
            components:1,requiresBacking:false,fragile:false,weakBridges,
            requiresBackingMeaning:'Legacy digital multi-part layout flag only; false is not a physical strength claim',
            topology:{model:'Orthogonal grid adjacency only; not a fused-joint strength prediction',components:1,componentSizes:parts,singleBeadCutPoints:0},
            nominalLayout:{pitchMm:5,widthMm:260,heightMm:240,meaning:'Nominal occupied-grid footprint, not a measured cooled finished object; full 58 x 58 canvas is 290 x 290 mm'},
            intendedUse:'A flat original four-board landscape digital pattern. Printing tiles do not imply separately fusing boards. No verified wall mounting, fused seam strength, hanging, wearability, age-suitability or making-time claim.',
            physicalAssemblyTested:false,ironingTested:false,hangingTested:false,loadStrengthTested:false,
            validation:{grid:'passed',palette:'existing-project-perler-csv',paletteCsvSha256:sha(csvBytes),designRowsSha256:sha(definition.rows.join('\n')),rgbaSha256:sha(rgba),namedCharacter:false,officialPatternCopied:false,notAnEnlargedSingleBoardDesign:true},
        };
        return {pattern,rgba};
    });
}

export function art(pattern, origin = 0, cell = 10) {
    return pattern.rows.flatMap((row, y) => [...row].flatMap((symbol, x) => symbol === '.' ? [] : [`<rect x="${origin + x * cell}" y="${origin + y * cell}" width="${cell}" height="${cell}" fill="${pattern.palette[symbol].hex}"/>`])).join('');
}
export function previewSvg(pattern) { return `<svg xmlns="http://www.w3.org/2000/svg" width="580" height="580"><rect width="580" height="580" fill="#ddd8ca"/><g shape-rendering="crispEdges">${art(pattern)}</g></svg>`; }
export function chartSvg(pattern) {
    const margin = 34, cell = 24, edge = margin + SIZE * cell;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1460" height="1720"><rect width="100%" height="100%" fill="white"/><g shape-rendering="crispEdges">${art(pattern,margin,cell)}</g>`;
    for (let i = 0; i <= SIZE; i++) {
        const pos = margin+i*cell, seam = i === 29, major = i%5 === 0 || i === SIZE;
        svg += `<path d="M${pos},${margin}V${edge}M${margin},${pos}H${edge}" stroke="${seam ? '#b64b40' : major ? '#53635b' : '#a4afa7'}" stroke-width="${seam ? 2.6 : major ? 1.3 : .6}"/>`;
    }
    svg += '<g font-family="Arial,sans-serif" font-size="11" text-anchor="middle" fill="#26352d">';
    for (let i = 0; i < SIZE; i++) svg += `<text x="${margin+(i+.5)*cell}" y="22">${i+1}</text><text x="17" y="${margin+(i+.5)*cell+3}">${i+1}</text>`;
    pattern.rows.forEach((row,y) => [...row].forEach((symbol,x) => {if (symbol === '.') return; const rgb = pattern.palette[symbol].rgb, luminance = .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]; svg += `<text x="${margin+(x+.5)*cell}" y="${margin+(y+.5)*cell+3}" fill="${luminance < 140 ? 'white' : '#17231b'}">${symbol}</text>`;}));
    svg += `</g><g font-family="Arial,sans-serif" fill="#26352d"><text x="34" y="1480" font-size="23">${esc(pattern.title)} - ${pattern.beads} beads / ${pattern.colorCount} colors</text><text x="34" y="1508" font-size="16">52 x 48 motif on a 58 x 58 MIDI grid. Four 29 x 29 boards in a 2 x 2 layout.</text><text x="34" y="1532" font-size="15">Red grid lines mark the 29/30 row and column seams. Empty cells: no bead.</text>`;
    pattern.materials.forEach((color,i) => {svg += `<text x="${34+(i%2)*690}" y="${1564+Math.floor(i/2)*26}" font-size="15">${esc(color.symbol)}: ${esc(color.name)} ${esc(color.ref)} (${color.count})</text>`;});
    return svg+'<text x="34" y="1676" font-size="15">Original drawing. Physical assembly, ironing, joining and mounting untested.</text><text x="34" y="1702" font-size="15">Counting PNG only; not a calibrated actual-size placement template.</text></g></svg>';
}
function project({ pattern, rgba }) {
    return { type: 'bead-pattern-project-v1', version: 1, savedAt: `${DATE}T00:00:00.000Z`, draft: {
        version: 1, sourceMode: 'blank', imageSrc: null, fileName: pattern.id, selectedPaletteIds: ['perler'],
        activePalettes: [{ name: 'Perler Midi', entries: pattern.materials.map(color => ({ name: color.name, ref: color.ref, symbol: color.symbol, prefix: 'P', enabled: true, color: { r: color.rgb[0], g: color.rgb[1], b: color.rgb[2], a: 255 } })) }],
        boardId: 'midi', boardWidth: 2, boardHeight: 2, matchingId: 'delta_e_cie2000', ditheringId: 'none', useSymbols: true,
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
function siteEntries(expected) { return expected.map(({pattern}) => ({id:pattern.id,slug:pattern.slug,title:pattern.title,kind:'original',version:pattern.version,description:pattern.description,notes:PUBLIC_NOTES})); }
function assetMapping() { return {state:'private-candidate-not-published',patterns:DEFINITIONS.map(({id}) => ({id,files:{'preview.png':`previews/${id}.png`,'grid.png':`charts/${id}.png`,'grid.svg':`charts/${id}.svg`,'pixels.png':`pixels/${id}.png`,'pattern.bead-pattern.json':`projects/${id}.bead-pattern.json`},boardFiles:[1,2,3,4].map(board => `boards/${id}-board-${board}.png`),pendingFiles:{'pattern.pdf':`pdfs/${id}.pdf`,'pattern-letter.pdf':`pdfs/${id}-us-letter.pdf`}})),pendingPdfReferences:['reference-pattern-library.pdf','reference-pattern-library-us-letter.pdf']}; }
function manifest(expected) {return {createdAt:DATE,state:'private-original-grid-candidate-pdf-pending',paletteSource:'public/palettes/perler.csv; physical colors not independently measured',patterns:expected.map(({pattern}) => pattern)};}
function readme() {return '# Original Sunset Mountain Lake v1 source pack\n\nIndependently drawn from an empty 58 x 58 square grid, with a 52 x 48 occupied panel at zero-based x3..54,y5..52. Exact 2496 Midi beads, four 29 x 29 boards and 624 occupied cells per board. The sky bands, setting sun, two mountain ridges, lake reflections, water ripples and foreground pines are authored here. No external pixels, tracing, named-character source, generated raster image or enlargement of an existing 29 x 29 design is used. Community research establishes subject/task demand only; its images are not drawing references.\n\nAll eight materials use exact references, names and RGB from the current project Perler Midi CSV, with alpha255. Transparent border pixels are all-zero RGBA. Manifest records exact rows, counts, bounds, board layout, each quadrant counts and hashes, and digital topology. Native 58 x 58 PNG, 580 x 580 preview, 1460 x 1720 numbered symbol SVG/PNG, editable 2 x 2 Midi project and four 29 x 29 native quadrant PNGs derive from the same source. The last standalone SVG group is the English footer for later native substitution.\n\nDigital adjacency is one component with no single-bead cut points; this does not predict fused seam strength. The nominal 260 x 240 mm motif and 290 x 290 mm full-grid footprints are not measured cooled objects. Physical assembly, ironing, joining, hanging and mounting are untested; no wearability, durability, age-suitability or time promise is made. Printing quadrants must not be read as instructions to fuse each board separately.\n\nThis is the unique private, Git-ignored source pack. Generate once with scripts/generate-original-sunset-landscape-sourcepack.mjs --output <canonical artifacts/pattern-samples/2026-10-11/original-large-landscape-v1 path>. Use --check-only thereafter. Existing output is never rewritten; extra entries and symlinks are rejected. Real editor parse/decode/serialize/reparse, all preview pixels, native transparency, SVG/PNG identity and exact quadrant recomposition are verified. Root reviews the actual drawing and freezes hashes separately. No visual, publication or physical approval is recorded.\n\nProposed site-entry notes describe the later reviewed consumer PDF delivery, not proof of PDF generation by this script. PDF paths are pending mapping only, not generated files or verified downloads. This generator does not write public assets, catalog, app, locale, fonts, PDFs or PDF markers. Keep this unique rebuildable pack and remove only this task disposable test outputs.\n';}
const assetFiles = ['manifest.json', 'site-entries.json', 'candidate-assets.json', 'README.md', ...DEFINITIONS.flatMap(({ id }) => [`pixels/${id}.png`, `previews/${id}.png`, `charts/${id}.png`, `charts/${id}.svg`, `projects/${id}.bead-pattern.json`, ...[1,2,3,4].map(board => `boards/${id}-board-${board}.png`)])];
function inventory(output, prefix = '') {
    return fs.readdirSync(path.join(output, prefix), { withFileTypes: true }).flatMap(entry => {
        assert.ok(!entry.isSymbolicLink(), 'Source-pack symlinks are not allowed'); const file = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) { assert.ok(['pixels', 'previews', 'charts', 'projects', 'boards', 'qa'].includes(file), 'Unexpected source-pack directory'); return inventory(output, file); }
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
        const reassembled = Buffer.alloc(SIZE*SIZE*4);
        for (const tile of pattern.boardTiles) {
            const decoded = await sharp(path.join(output,tile.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
            assert.equal(decoded.info.width,29); assert.equal(decoded.info.height,29);
            assert.ok(decoded.data.equals(tileRgba(rgba,tile.column-1,tile.row-1)),'Quadrant PNG differs from its exact source region');
            for (let y=0;y<29;y++) decoded.data.copy(reassembled,((tile.origin.y+y)*SIZE+tile.origin.x)*4,y*29*4,(y+1)*29*4);
        }
        assert.ok(reassembled.equals(rgba),'Four quadrant PNGs do not recompose the entire source without missing or duplicated seam cells');

        const preview = await sharp(path.join(output, 'previews', `${id}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.equal(preview.info.width, 580); assert.equal(preview.info.height, 580);
        for (let y = 0; y < 580; y++) for (let x = 0; x < 580; x++) {
            const symbol = pattern.rows[Math.floor(y / 10)][Math.floor(x / 10)], expectedColor = [...(symbol === '.' ? BACKGROUND : pattern.palette[symbol].rgb), 255];
            for (let c = 0; c < 4; c++) assert.equal(preview.data[(y * 580 + x) * 4 + c], expectedColor[c], 'Preview differs from grid');
        }
        const svg = fs.readFileSync(path.join(output, 'charts', `${id}.svg`), 'utf8'); assert.equal(svg, chartSvg(pattern), 'Chart SVG differs');
        const png = await sharp(path.join(output, 'charts', `${id}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.equal(png.info.width, 1460); assert.equal(png.info.height, 1720);
        assert.ok(png.data.equals(await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer()), 'Chart PNG differs from SVG');
    }
    const report = { checkedAt: DATE, state: 'private-digital-source-verified', patterns: expected.map(({ pattern }) => ({ id: pattern.id, beads: pattern.beads, colorCount: pattern.colorCount, bounds: pattern.bounds, topology: pattern.topology, boardTiles: pattern.boardTiles, rowsSha256: pattern.validation.designRowsSha256, rgbaSha256: pattern.validation.rgbaSha256, materials: pattern.materials })),
        pixelPngEqualsProjectEqualsManifest: true, emptyPixelRgbaAllZero: true, allPreviewPixelsMatchGrid: true, chartPngEqualsSvg: true, realEditorParse: true, realEditorSerializeReparse: true, fourQuadrantsExactlyRecomposeSource: true, boardTileCells: 841, boardSeamColumns: [29,30], boardSeamRows: [29,30],
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
        for (const tile of pattern.boardTiles) files[tile.file] = await sharp(tileRgba(rgba,tile.column-1,tile.row-1), {raw:{width:29,height:29,channels:4}}).png().toBuffer();
    }
    fs.mkdirSync(path.dirname(output), { recursive: true }); fs.mkdirSync(output);
    for (const folder of ['pixels', 'previews', 'charts', 'projects', 'boards', 'qa']) fs.mkdirSync(path.join(output, folder));
    for (const [relative, bytes] of Object.entries(files)) fs.writeFileSync(path.join(output, relative), bytes, { flag: 'wx' });
    const report = await checkArtifacts(output, expected, false);
    fs.writeFileSync(path.join(output, 'qa/sourcepack-checks.json'), json(report), { flag: 'wx' });
    return checkArtifacts(output, expected);
}
async function main() { const { output, checkOnly } = options(process.argv.slice(2)); const report = checkOnly ? await checkArtifacts(output) : await generate(output); console.log(json({ output, mode: checkOnly ? 'read-only-check' : 'generated-private-candidate', ...report })); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

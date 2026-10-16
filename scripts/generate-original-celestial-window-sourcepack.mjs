/** Independently drawn celestial stained-glass window on an empty 58 x 58 grid. Private source pack only. */
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
const DATE = '2026-10-16', PACK = 'original-celestial-window-v1', BACKGROUND = [221, 216, 202];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const COLORS = {
    N: { ref: '80-15201', name: 'Midnight', rgb: [47, 60, 85] },
    B: { ref: '80-15200', name: 'Cobalt', rgb: [0, 101, 177] },
    T: { ref: '80-15218', name: 'Teal', rgb: [4, 127, 138] },
    S: { ref: '80-15216', name: 'Sky', rgb: [74, 192, 216] },
    M: { ref: '80-15215', name: 'Mist', rgb: [147, 176, 189] },
    G: { ref: '80-19057', name: 'Cheddar', rgb: [251, 177, 70] },
    Y: { ref: '80-19056', name: 'Pastel Yellow', rgb: [233, 226, 144] },
    E: { ref: '80-15179', name: 'Evergreen', rgb: [48, 85, 69] },
};
const PUBLIC_NOTES = [
    'Use four 29 × 29 Midi pegboards arranged 2 × 2. The complete grid has 58 columns and 58 rows.',
    'This arched celestial window is drawn natively across four boards, not enlarged from a single-board pattern.',
    'The first PDF page is a reduced overview; pages 2–5 show boards 1–4 at 5 mm spacing. Print at 100% / Actual size and check both 50 mm rulers.',
    'Empty grid cells do not need beads. The PNG is a counting chart, not an actual-size placement template.',
    'Physical assembly, ironing and cross-board join strength have not been tested. Perler screen colors are approximate.',
];
// Every coordinate below is authored on this empty native 58 x 58 grid.
// Circle inequalities describe the frame only; no image, traced outline or old artwork is read.
export function windowMask(x, y, inset = 0) {
    const radius = 23.5 - inset;
    return y <= 54 - inset && (y >= 26 ? Math.abs(x - 28.5) <= radius : (x - 28.5) ** 2 + (y - 26) ** 2 <= radius ** 2);
}
function windowRows() {
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill('.'));
    const put = (x, y, symbol) => { if (x >= 0 && y >= 0 && x < SIZE && y < SIZE && windowMask(x, y, 3)) grid[y][x] = symbol; };
    const line = (x0, y0, x1, y1, symbol = 'N') => {
        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let error = dx + dy;
        while (true) { put(x0, y0, symbol); if (x0 === x1 && y0 === y1) break; const twice = 2 * error; if (twice >= dy) { error += dy; x0 += sx; } if (twice <= dx) { error += dx; y0 += sy; } }
    };
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (!windowMask(x, y)) continue;
        if (!windowMask(x, y, 1)) grid[y][x] = 'N';
        else if (!windowMask(x, y, 2)) grid[y][x] = 'G';
        else if (!windowMask(x, y, 3)) grid[y][x] = 'N';
        else {
            // Broad independent glass facets; neighboring hues have no dither or interpolation.
            if (y <= 30) grid[y][x] = x < 17 ? 'T' : x < 29 ? (y < 12 ? 'S' : 'B') : x < 40 ? 'T' : 'B';
            else if (x + y < 57) grid[y][x] = 'S';
            else if (x - y > -1) grid[y][x] = 'M';
            else if (x + y < 70) grid[y][x] = 'T';
            else if (x - y > -18) grid[y][x] = 'S';
            else grid[y][x] = 'B';
        }
    }
    // Fan-shaped leading rises from the transom into the arch.
    for (const [x, y] of [[8, 25], [12, 14], [21, 6], [29, 5], [39, 9], [49, 23]]) line(29, 31, x, y);
    line(8, 31, 49, 31);
    for (const segment of [[8, 32, 29, 51], [49, 32, 29, 51], [8, 44, 21, 32], [49, 44, 37, 32]]) line(...segment);
    // Crescent cells are drawn once; their orthogonal dilation supplies a consistent one-cell lead contour.
    const moonCells = [];
    for (let y = 11; y <= 27; y++) for (let x = 12; x <= 28; x++) {
        if ((x - 20) ** 2 + (y - 19) ** 2 <= 56.25 && (x - 24) ** 2 + (y - 18) ** 2 > 49) moonCells.push([x,y]);
    }
    for (const [x,y] of moonCells) for (const [dx,dy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) put(x+dx,y+dy,'N');
    for (const [x,y] of moonCells) put(x,y,'Y');
    // Three individually placed four-point stars; the larger one anchors the opposite pane.
    const star = (cx, cy, radius) => {
        for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
            const d = Math.abs(dx) + Math.abs(dy);
            if ((dx === 0 || dy === 0 || d <= Math.ceil(radius / 2)) && d <= radius) put(cx + dx, cy + dy, 'N');
        }
        for (let d = -(radius - 1); d <= radius - 1; d++) { put(cx + d, cy, d === 0 ? 'Y' : 'G'); put(cx, cy + d, d === 0 ? 'Y' : 'G'); }
        if (radius > 3) for (const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) put(cx+dx,cy+dy,'Y');
    };
    star(39, 19, 5); star(31, 11, 3); star(43, 27, 2);
    // Central drop-shaped medallion, set into the lower geometric glazing.
    for (let y = 34; y <= 44; y++) for (let x = 25; x <= 33; x++) {
        const d = Math.abs(x - 29) + Math.abs(y - 39);
        if (d <= 5) put(x,y,'N');
        if (d <= 3) put(x,y, y <= 38 ? 'Y' : 'G');
    }
    // Two native botanical sprigs sit inside the lower panel, with explicit paired leaves.
    const leaf = (cx, cy, sign) => {
        const points = [[0,0],[sign, -1],[sign*2,-2],[sign*4,-2],[sign*4,0],[sign*3,1],[sign,1]];
        const shape = new Set(points.map(([x,y]) => `${cx+x},${cy+y}`));
        for (const [x,y] of [[1,0],[2,0],[3,-1],[2,-1]]) shape.add(`${cx+sign*x},${cy+y}`);
        for (const cell of shape) { const [x,y] = cell.split(',').map(Number); for (const [dx,dy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) put(x+dx,y+dy,'N'); }
        for (const cell of shape) { const [x,y] = cell.split(',').map(Number); put(x,y, 'E'); }
        put(cx+sign*2,cy-1,'M'); put(cx+sign*3,cy-1,'M');
    };
    for (const [cx, top] of [[17,36],[41,36]]) {
        line(cx,top,cx,50,'N'); line(cx-1,top+2,cx-1,50,'N');
        for (const [y, sign] of [[39,-1],[42,1],[45,-1],[48,1]]) leaf(cx,y,sign);
        line(cx,top+2,cx,50,'G'); put(cx,top,'G'); put(cx,top+1,'Y');
        line(cx-4,51,cx+4,51,'G');
    }
    return grid.map(row => row.join(''));
}
export const DEFINITIONS = [{
    id: 'original-celestial-stained-glass-window', slug: 'celestial-stained-glass-window', title: 'Celestial Stained Glass Window', titleZh: '月与星的彩色玻璃窗',
    localizedSubjects: { de: 'Glasfenster mit Mond und Sternen', fr: 'Vitrail lune et étoiles', ja: '月と星のステンドグラス窓' },
    symbols: ['N', 'B', 'T', 'S', 'M', 'G', 'Y', 'E'], rows: windowRows(),
    description: 'An original arched stained-glass window with a crescent moon, three stars, geometric blue panes and paired botanical sprigs.',
    designMethod: 'Independent drawing started on an empty 58 x 58 grid: nested arched frame outlines, six explicitly plotted fan lead lines, a crescent cut from authored disks, three four-point stars, lower geometric panes, a warm medallion and two botanical sprigs. No external pixels, tracing, character, image conversion or enlargement of an existing 29 x 29 design.',
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
        assert.deepEqual(parts.slice(-4), ['artifacts', 'pattern-samples', DATE, PACK], 'Use the versioned private artifacts/pattern-samples/2026-10-16/original-celestial-window-v1 directory');
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
            assert.equal(symbol !== '.',windowMask(x,y),'The source must exactly fill the authored arched silhouette');
            if (symbol === '.') return;
            assert.ok(palette[symbol]); occupied.add(y*SIZE+x); rgba.set([...palette[symbol].rgb,255],(y*SIZE+x)*4);
        }));
        const parts = components(occupied); assert.deepEqual(parts,[occupied.size]);
        const weakBridges = cutPoints(occupied).map(cell => ({row:Math.floor(cell/SIZE)+1,column:cell%SIZE+1})); assert.deepEqual(weakBridges,[]);
        const xs = [...occupied].map(cell => cell % SIZE), ys = [...occupied].map(cell => Math.floor(cell / SIZE));
        const bounds = {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs)+1,height:Math.max(...ys)-Math.min(...ys)+1};
        const boardTiles = [];
        for (let row = 0; row < 2; row++) for (let column = 0; column < 2; column++) {
            const data = tileRgba(rgba,column,row), counts = Object.fromEntries(definition.symbols.map(symbol => [symbol,0])); let beads = 0;
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const symbol = definition.rows[row * BOARD_SIZE + y][column * BOARD_SIZE + x];
                if (symbol !== '.') {counts[symbol]++; beads++; assert.equal(data[(y*BOARD_SIZE+x)*4+3],255);}
                else assert.ok(data.subarray((y*BOARD_SIZE+x)*4,(y*BOARD_SIZE+x+1)*4).equals(Buffer.alloc(4)));
            }
            boardTiles.push({board:row*2+column+1,column:column+1,row:row+1,width:29,height:29,cells:841,origin:{x:column*29,y:row*29},beads,emptyCells:841-beads,counts,rgbaSha256:sha(data),file:`boards/${definition.id}-board-${row*2+column+1}.png`});
        }
        for (const material of Object.values(palette)) assert.equal(boardTiles.reduce((sum,tile) => sum+tile.counts[material.symbol],0),material.count);
        assert.equal(boardTiles.reduce((sum,tile) => sum+tile.beads,0),occupied.size);
        const pattern = {...definition,kind:'original',version:'Original Celestial Stained Glass Window design v1',theme:'Celestial',source:null,notes:PUBLIC_NOTES,width:SIZE,height:SIZE,
            boardWidth:2,boardHeight:2,boardCellWidth:29,boardCellHeight:29,palette,materials:Object.values(palette),beads:occupied.size,colorCount:definition.symbols.length,bounds,boardTiles,
            components:1,requiresBacking:false,fragile:false,weakBridges,
            requiresBackingMeaning:'Legacy digital multi-part layout flag only; false is not a physical strength claim',
            topology:{model:'Orthogonal grid adjacency only; not a fused-joint strength prediction',components:1,componentSizes:parts,singleBeadCutPoints:0},
            nominalLayout:{pitchMm:5,widthMm:bounds.width*5,heightMm:bounds.height*5,meaning:'Nominal occupied-grid footprint, not a measured cooled finished object; full 58 x 58 canvas is 290 x 290 mm'},
            intendedUse:'A flat original four-board celestial-window digital pattern. Printing tiles do not imply separately fusing boards. No verified wall mounting, fused seam strength, hanging, wearability, age-suitability or making-time claim.',
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
    svg += `</g><g font-family="Arial,sans-serif" fill="#26352d"><text x="34" y="1480" font-size="23">${esc(pattern.title)} - ${pattern.beads} beads / ${pattern.colorCount} colors</text><text x="34" y="1508" font-size="16">${pattern.bounds.width} x ${pattern.bounds.height} motif on a 58 x 58 MIDI grid. Four 29 x 29 boards in a 2 x 2 layout.</text><text x="34" y="1532" font-size="15">Red grid lines mark the 29/30 row and column seams. Empty cells: no bead.</text>`;
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
function readme() {return '# Original Celestial Stained Glass Window v1 source pack\n\nIndependently drawn from an empty native 58 x 58 grid. An arched dark-and-gold frame encloses a crescent moon, three stars, geometric blue/teal glass divisions, a lower gold medallion and two botanical sprigs. Eight exact existing Perler Midi colors. No external pixels, tracing, character source, raster generation, old-design recoloring or enlarged single-board design is used. This subject is an original display-design choice, not a measured keyword-volume claim.\n\nThe manifest preserves all 58 rows, exact palette references and RGB, whole-grid and per-board color totals, bounds, all-zero transparent RGBA cells and digital topology. The native PNG, 580 x 580 preview, numbered symbol SVG/PNG, editor project and four separate 29 x 29 PNG quadrants derive from one grid. Board numbering is left-to-right then top-to-bottom; local row1/col1 maps to the recorded zero-based origin. The 29/30 seams are adjacent cells, never duplicated boundary beads. The final standalone SVG group is the English footer for later native substitution.\n\nReal editor parse/decode/serialize/reparse and exact quadrant recomposition are verified. Digital orthogonal adjacency does not predict fused strength. Nominal dimensions are 5 mm pitch times the occupied-grid bounds, not a measured finished object. Physical assembly, ironing, joining, hanging and strength are untested. No suitability, durability or time promise is made. Board PDFs must not imply separately fusing quadrants.\n\nThis is the unique private Git-ignored source pack in artifacts/pattern-samples/2026-10-16/original-celestial-window-v1. Generate once; use --check-only afterward. Existing output, symlinks and extra entries are refused. Root reviews the actual drawing and freezes hashes independently. No approval lock or visual/publication approval is recorded. The optional generated-celestial-downloads/ directory belongs to a separate downstream builder: its contents are excluded from source-pack validation, except that symlinks are refused. PDF mappings and consumer delivery notes are pending references only: this script does not create PDFs, PDF markers or public files. Preserve this final source pack; remove only owned disposable candidate/test outputs.\n';}

const assetFiles = ['manifest.json', 'site-entries.json', 'candidate-assets.json', 'README.md', ...DEFINITIONS.flatMap(({ id }) => [`pixels/${id}.png`, `previews/${id}.png`, `charts/${id}.png`, `charts/${id}.svg`, `projects/${id}.bead-pattern.json`, ...[1,2,3,4].map(board => `boards/${id}-board-${board}.png`)])];
function rejectLinks(directory) {
    for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
        assert.ok(!entry.isSymbolicLink(),'Source-pack symlinks are not allowed');
        if (entry.isDirectory()) rejectLinks(path.join(directory,entry.name));
        else assert.ok(entry.isFile(),'Downstream entries must be regular files');
    }
}
function inventory(output, prefix = '') {
    return fs.readdirSync(path.join(output, prefix), { withFileTypes: true }).flatMap(entry => {
        assert.ok(!entry.isSymbolicLink(), 'Source-pack symlinks are not allowed'); const file = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            // Separate downstream delivery artifacts are not source-pack files and are not reviewed here.
            if (file === 'generated-celestial-downloads') { rejectLinks(path.join(output,file)); return []; }
            assert.ok(['pixels', 'previews', 'charts', 'projects', 'boards', 'qa'].includes(file), 'Unexpected source-pack directory'); return inventory(output, file);
        }
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
    fs.mkdirSync(path.dirname(output), { recursive: true, mode:0o700 }); fs.mkdirSync(output, {mode:0o700});
    for (const folder of ['pixels', 'previews', 'charts', 'projects', 'boards', 'qa']) fs.mkdirSync(path.join(output, folder), {mode:0o700});
    for (const [relative, bytes] of Object.entries(files)) fs.writeFileSync(path.join(output, relative), bytes, { flag: 'wx', mode:0o600 });
    const report = await checkArtifacts(output, expected, false);
    fs.writeFileSync(path.join(output, 'qa/sourcepack-checks.json'), json(report), { flag: 'wx', mode:0o600 });
    return checkArtifacts(output, expected);
}
async function main() { const { output, checkOnly } = options(process.argv.slice(2)); const report = checkOnly ? await checkArtifacts(output) : await generate(output); console.log(json({ output, mode: checkOnly ? 'read-only-check' : 'generated-private-candidate', ...report })); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

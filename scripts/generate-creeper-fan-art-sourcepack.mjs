/** Build the reviewed hand-authored Creeper face fan-art grid. Never writes PDFs. */
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
const ID = 'minecraft-creeper-face-v1';
const SIZE = 29;
const CREATED_AT = '2026-10-10';
const ROWS_SHA256 = 'df712354b06a195c55cca570cddffec6f5d884a75af5baa762594697ac5b3d53';
// Explicit hand-authored bead rows. Creeper is a third-party character; this is not an independent character design.
const ROWS = [
    ".............................",
    ".............................",
    ".............................",
    ".............................",
    ".............................",
    ".............................",
    "......GHHGGGGGGGGGGGGG.......",
    "......GHHGGGGGGGHHGGGG.......",
    "......GGGGGGHHGGHHGGGG.......",
    "......GGGGGGHHGGGGGGGG.......",
    "......GGKKKKGGGGKKKKHH.......",
    "......GGKKKKGGGGKKKKHH.......",
    "......GGKKKKGGGGKKKKGG.......",
    "......GGKKKKGGGGKKKKGG.......",
    "......HHGGGGKKKKGGHHGG.......",
    "......HHGGGGKKKKGGHHGG.......",
    "......GGGGKKKKKKKKGGGG.......",
    "......GGGGKKKKKKKKGGGG.......",
    "......GGHHKKKKKKKKHHGG.......",
    "......GGHHKKKKKKKKHHGG.......",
    "......HHGGKKGGGGKKGGHH.......",
    "......HHGGKKGGGGKKGGHH.......",
    ".............................",
    ".............................",
    ".............................",
    ".............................",
    ".............................",
    ".............................",
    "............................."
];
const SOURCE = {
    "type": "character-reference",
    "pageUrl": "https://www.minecraft.net/en-us/article/meet-creeper",
    "label": "Minecraft: Meet the Creeper",
    "character": "Creeper",
    "rightsHolder": "Mojang/Microsoft",
    "creationMethod": "hand-authored-bead-grid",
    "sourceTextureUsed": false,
    "unofficial": true,
    "redistributionPermission": "unconfirmed"
};
const REFERENCE = {
    "version": "Hand-drawn Creeper face fan art v1",
    "label": "Minecraft: Meet the Creeper",
    "description": "Hand-authored Creeper face fan art with a simplified green-and-black bead palette. The official Minecraft article is a character identity reference, not a licensed source file. This unofficial pattern is by Fuse Bead Patterns and is not approved by or associated with Mojang or Microsoft. Character rights belong to Mojang/Microsoft; permission for public redistribution is unconfirmed."
};
const MATERIALS = {
    G: { ref: '80-19080', name: 'Green', rgb: [77, 171, 100], count: 136 },
    K: { ref: '80-19018', name: 'Black', rgb: [50, 50, 52], count: 80 },
    H: { ref: '80-19061', name: 'Kiwi Lime', rgb: [105, 184, 69], count: 40 },
};
const sha = value => createHash('sha256').update(value).digest('hex');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const json = value => JSON.stringify(value, null, 2) + '\n';

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
    output = path.resolve(repo, output || 'artifacts/pattern-samples/2026-10-10/creeper-face-fan-art-v1');
    assert.equal(path.basename(output), 'creeper-face-fan-art-v1', 'Use the versioned Creeper fan-art source-pack directory');
    assert.ok(output.split(path.sep).includes('artifacts'), 'The source pack must stay under an ignored artifacts directory');
    return { output, checkOnly };
}

function components(occupied, omitted) {
    const remaining = new Set(occupied);
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

function design() {
    assert.equal(ROWS.length, SIZE);
    assert.ok(ROWS.every(row => row.length === SIZE && /^[.GKH]+$/.test(row)));
    assert.equal(sha(ROWS.join('\n')), ROWS_SHA256, 'The v1 candidate grid changed; review a new version instead');
    const csv = new Map(fs.readFileSync(path.join(repo, 'public/palettes/perler.csv'), 'utf8').trim().split(/\r?\n/).map(line => {
        const [ref, name, , r, g, b] = line.split(',');
        return [ref, { ref, name, rgb: [r, g, b].map(Number) }];
    }));
    const palette = {};
    for (const [symbol, expected] of Object.entries(MATERIALS)) {
        const actual = csv.get(expected.ref);
        assert.ok(actual, `Missing Perler Midi color ${expected.ref}`);
        assert.deepEqual(actual, { ref: expected.ref, name: expected.name, rgb: expected.rgb });
        const count = ROWS.join('').split(symbol).length - 1;
        assert.equal(count, expected.count);
        palette[symbol] = { ...actual, hex: `#${Buffer.from(actual.rgb).toString('hex')}`, symbol, count };
    }
    const occupied = new Set();
    const rgba = Buffer.alloc(SIZE * SIZE * 4);
    ROWS.forEach((row, y) => [...row].forEach((symbol, x) => {
        if (symbol === '.') return;
        occupied.add(y * SIZE + x);
        rgba.set([...palette[symbol].rgb, 255], (y * SIZE + x) * 4);
    }));
    assert.equal(occupied.size, 256);
    assert.deepEqual(components(occupied), [256]);
    const weakBridges = [...occupied].filter(cell => components(occupied, cell).length > 1)
        .map(cell => ({ row: Math.floor(cell / SIZE) + 1, column: cell % SIZE + 1 }));
    assert.deepEqual(weakBridges, []);
    const xs = [...occupied].map(cell => cell % SIZE), ys = [...occupied].map(cell => Math.floor(cell / SIZE));
    const bounds = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
    assert.deepEqual(bounds, { x: 6, y: 6, width: 16, height: 16 });
    const pattern = {
        id: ID, slug: 'minecraft/creeper-face', title: 'Creeper Face', titleZh: '苦力怕脸部', kind: 'fan-art',
        version: REFERENCE.version, theme: 'Minecraft',
        localizedSubjects: { de: 'Creeper-Gesicht', fr: 'Visage du Creeper', ja: 'クリーパーの顔' },
        description: 'A hand-authored Creeper face fan-art bead grid with black features, green fill and light-green highlights.',
        source: SOURCE,
        designMethod: 'Explicit 29 x 29 symbol rows place a recognizable Creeper face and 40 manually arranged light-green highlight cells. The official character article is a visual identity reference. No official PNG, shield texture, game file, image tracing algorithm, old alpha-extraction script or generated raster was loaded. The facial design remains associated with the third-party Creeper character; no original-character or redistribution-license claim is made.',
        sourceNoteZh: '参照角色身份手工编写脸部图格及绿色高光；未使用官方纹理文件。非官方二创，不是原创角色；未实物拼制、熨烫或悬挂测试。',
        width: SIZE, height: SIZE, rows: ROWS, palette, beads: 256, colorCount: 3, bounds,
        components: 1, requiresBacking: false, weakBridges,
        validation: {
            grid: 'passed', palette: 'existing-project-perler-csv',
            designRowsSha256: ROWS_SHA256, rgbaSha256: sha(rgba),
            digitalFourConnectedComponents: 1, digitalSingleBeadCutPoints: 0,
            topologyModel: 'Orthogonal grid adjacency only; not a physical strength prediction',
            physicalAssemblyTested: false, ironingTested: false, hangingTested: false,
            officialPatternCopied: false, officialTextureUsed: false, namedCharacter: true,
            author: 'Fuse Bead Patterns team', replyTo: 'contact@fusebeadpatterns.art',
            visualReview: 'Root inspected and accepted the three-colour v1 symbol-grid candidate; PDF review is separate',
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
    svg += `</g><g font-family="Arial,sans-serif" fill="#26352d"><text x="46" y="796" font-size="19">Creeper Face - 256 beads / 3 colors</text><text x="46" y="818" font-size="13">16 x 16 motif on a 29 x 29 MIDI board. Empty cells: no bead.</text>`;
    Object.values(pattern.palette).forEach((color, i) => {
        svg += `<text x="${46 + i % 2 * 355}" y="${840 + Math.floor(i / 2) * 19}" font-size="12">${esc(color.symbol)}: ${esc(color.name)} ${esc(color.ref)} (${color.count})</text>`;
    });
    return svg + '<text x="46" y="896" font-size="12">Unofficial Minecraft fan art by Fuse Bead Patterns. Character: Mojang/Microsoft.</text></g></svg>';
}

function project(pattern, rgba) {
    return {
        type: 'bead-pattern-project-v1', version: 1, savedAt: `${CREATED_AT}T00:00:00.000Z`,
        draft: {
            version: 1, sourceMode: 'blank', imageSrc: null, fileName: ID,
            selectedPaletteIds: ['perler'],
            activePalettes: [{ name: 'Perler Midi', entries: Object.values(pattern.palette).map(color => ({
                name: color.name, ref: color.ref, symbol: color.symbol, prefix: 'P', enabled: true,
                color: { r: color.rgb[0], g: color.rgb[1], b: color.rgb[2], a: 255 },
            })) }],
            boardId: 'midi', boardWidth: 1, boardHeight: 1,
            matchingId: 'delta_e_cie2000', ditheringId: 'none', useSymbols: true,
            exportFormatId: 'pdf', pdfScaleMode: 'midi-5mm',
            imageAdjustments: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
            rendererSettings: { center: true, fit: true, showGrid: true },
            showReference: false, referenceOpacity: .3, previewZoom: 1,
            editedPattern: { width: SIZE, height: SIZE, byteLength: rgba.length, data: rgba.toString('base64') },
        },
    };
}

function editorModule() {
    const cache = new Map();
    function load(file) {
        if (cache.has(file)) return cache.get(file);
        const loadedModule = { exports: {} };
        cache.set(file, loadedModule.exports);
        const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText;
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

async function check(output, expected) {
    const manifest = JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'), 'utf8'));
    assert.equal(manifest.createdAt, CREATED_AT);
    assert.equal(manifest.patterns.length, 1);
    const actual = manifest.patterns[0];
    for (const key of ['id', 'slug', 'title', 'kind', 'version', 'source', 'width', 'height', 'rows', 'palette', 'beads', 'colorCount', 'bounds', 'components', 'requiresBacking', 'weakBridges']) {
        assert.deepEqual(actual[key], expected.pattern[key], `Manifest differs from v1 source: ${key}`);
    }
    const pixels = await sharp(path.join(output, 'pixels', `${ID}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(pixels.info.width, SIZE);
    assert.equal(pixels.info.height, SIZE);
    assert.ok(pixels.data.equals(expected.rgba), 'Native pixel PNG differs from source rows');
    const projectBytes = fs.readFileSync(path.join(output, 'projects', `${ID}.bead-pattern.json`));
    const saved = JSON.parse(projectBytes);
    assert.deepEqual(saved, project(expected.pattern, expected.rgba), 'Editable project differs from source rows and palette');
    const editor = editorModule(), draft = editor.parseEditorProject(projectBytes.toString());
    assert.ok(draft, 'The real editor parser rejected this project');
    assert.ok(Buffer.from(editor.decodeEditorPatternDraft(draft.editedPattern)).equals(expected.rgba));
    assert.equal(JSON.stringify(editor.parseEditorProject(editor.serializeEditorProject(draft))), JSON.stringify(draft));
    const previewBytes = fs.readFileSync(path.join(output, 'previews', `${ID}.png`));
    const preview = await sharp(previewBytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(preview.info.width, 580);
    assert.equal(preview.info.height, 580);
    for (let y = 0; y < 580; y++) for (let x = 0; x < 580; x++) {
        const symbol = ROWS[Math.floor(y / 20)][Math.floor(x / 20)];
        const rgb = symbol === '.' ? [221, 216, 202] : expected.pattern.palette[symbol].rgb;
        for (let channel = 0; channel < 3; channel++) assert.equal(preview.data[(y * 580 + x) * 3 + channel], rgb[channel]);
    }
    const svg = fs.readFileSync(path.join(output, 'charts', `${ID}.svg`), 'utf8');
    assert.equal(svg, chartSvg(expected.pattern), 'Symbol SVG differs from source rows');
    const chart = await sharp(path.join(output, 'charts', `${ID}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rendered = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
    assert.equal(chart.info.width, 788);
    assert.equal(chart.info.height, 908);
    assert.ok(chart.data.equals(rendered), 'Symbol chart PNG differs from its SVG');
    const entries = JSON.parse(fs.readFileSync(path.join(output, 'site-entries.json'), 'utf8'));
    assert.equal(entries.length, 1);
    assert.equal(entries[0].id, ID);
    assert.equal(entries[0].slug, 'minecraft/creeper-face');
    assert.equal(entries[0].version, expected.pattern.version);
    assert.equal(entries[0].kind, 'fan-art');
    assert.deepEqual(entries[0].reference, REFERENCE);
    const files = ['manifest.json', 'site-entries.json', 'candidate-assets.json', 'README.md', `pixels/${ID}.png`, `previews/${ID}.png`, `charts/${ID}.png`, `charts/${ID}.svg`, `projects/${ID}.bead-pattern.json`];
    return {
        id: ID, rowsSha256: ROWS_SHA256, rgbaSha256: sha(expected.rgba),
        previewSha256: sha(previewBytes), bounds: expected.pattern.bounds,
        beads: 256, colorCount: 3, fourConnectedComponents: 1, singleBeadCutPoints: 0,
        materials: Object.values(expected.pattern.palette),
        pixelPngEqualsProjectEqualsManifest: true, allPreviewPixelsMatchGrid: true,
        chartPngEqualsSvg: true, realEditorParse: true, realEditorSerializeReparse: true,
        physicalAssemblyTested: false, ironingTested: false, hangingTested: false,
        pdfVerification: 'Not performed by this source-pack script; root owns PDF authoring and its marker',
        fileSha256: Object.fromEntries(files.map(file => [file, sha(fs.readFileSync(path.join(output, file)))])),
    };
}

async function main() {
    const { output, checkOnly } = options(process.argv.slice(2)), expected = design();
    if (!checkOnly) {
        assert.ok(!fs.existsSync(output), 'Source-pack directory already exists; use --check-only or preserve it and generate a new reviewed version');
        assert.ok(editorModule().parseEditorProject(json(project(expected.pattern, expected.rgba))), 'The real editor parser must accept the project before any files are written');
        fs.mkdirSync(output, { recursive: true });
        for (const folder of ['pixels', 'previews', 'charts', 'projects', 'qa']) fs.mkdirSync(path.join(output, folder));
        const { pattern, rgba } = expected;
        const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="580" height="580"><rect width="580" height="580" fill="#ddd8ca"/><g shape-rendering="crispEdges">${art(pattern, 0, 20)}</g></svg>`;
        await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toFile(path.join(output, 'pixels', `${ID}.png`));
        await sharp(Buffer.from(previewSvg)).png().toFile(path.join(output, 'previews', `${ID}.png`));
        const svg = chartSvg(pattern);
        fs.writeFileSync(path.join(output, 'charts', `${ID}.svg`), svg, { flag: 'wx' });
        await sharp(Buffer.from(svg)).png().toFile(path.join(output, 'charts', `${ID}.png`));
        fs.writeFileSync(path.join(output, 'projects', `${ID}.bead-pattern.json`), json(project(pattern, rgba)), { flag: 'wx' });
        const pendingPdfFiles = ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf', ...['de', 'fr', 'ja'].flatMap(locale => [`localized-pdfs/${locale}/pattern.pdf`, `localized-pdfs/${locale}/pattern-letter.pdf`])];
        fs.writeFileSync(path.join(output, 'manifest.json'), json({
            createdAt: CREATED_AT, state: 'private-fan-art-grid-candidate-pdf-pending',
            paletteSource: 'public/palettes/perler.csv; physical colors not independently measured',
            pendingPdfFiles, patterns: [pattern],
        }), { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'site-entries.json'), json([{
            id: ID, slug: 'minecraft/creeper-face', title: 'Creeper Face', kind: 'fan-art', version: pattern.version,
            description: 'Make a Creeper face with black features and two green shades using 256 Perler Midi beads. Download the printable fan-art chart or open the editable grid.',
            reference: REFERENCE,
        }]), { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'candidate-assets.json'), json({
            state: 'private-candidate-not-published', patterns: [{ id: ID, files: {
                'preview.png': `previews/${ID}.png`, 'grid.png': `charts/${ID}.png`,
                'grid.svg': `charts/${ID}.svg`, 'pixels.png': `pixels/${ID}.png`,
                'pattern.bead-pattern.json': `projects/${ID}.bead-pattern.json`,
            }, pendingFiles: { 'pattern.pdf': 'reference-pattern-library.pdf', 'pattern-letter.pdf': 'reference-pattern-library-us-letter.pdf' } }],
            pendingPdfReferences: ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf'],
        }), { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'README.md'), `# Creeper face fan-art v1 source pack

Private Git-ignored source pack. Explicit hand-authored rows define a 16 x 16 face inside a 29 x 29 Midi canvas at x=6,y=6. G: Green 80-19080 (136); K: Black 80-19018 (80); H: Kiwi Lime 80-19061 (40). Total 256 beads. Approximate digital palette values, not physical colour measurements.

Creeper is a third-party Minecraft character, referenced by the official Meet the Creeper article. The character belongs to Mojang/Microsoft. This is unofficial fan art arranged by Fuse Bead Patterns team, contact@fusebeadpatterns.art. No official image or game file was decoded or included. No claim of licensed redistribution, independently invented character, physical assembly, ironing or hanging.

Root inspected the actual candidate preview. Row SHA256: ${ROWS_SHA256}. Pixels/project/grid remain matched and must pass the real editor parser. PNG chart is not an actual-size print template. Eight native-language A4/US Letter PDFs are pending and are not created or approved by this script. PDF creation and final rendered acceptance are separate steps.
`, { flag: 'wx' });

    }
    const report = await check(output, expected);
    if (!checkOnly) fs.writeFileSync(path.join(output, 'qa/sourcepack-checks.json'), json({ checkedAt: CREATED_AT, state: 'private-digital-source-verified', ...report }), { flag: 'wx' });
    console.log(json({ output, mode: checkOnly ? 'read-only-check' : 'generated-private-candidate', ...report }));
}

await main();

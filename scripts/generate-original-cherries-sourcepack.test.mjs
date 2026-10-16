import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { ID, ROWS, REVIEWED_ROWS_SHA256, checkArtifacts, design, generate, options } from './generate-original-cherries-sourcepack.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ts = require('typescript');
const repo = path.resolve(import.meta.dirname, '..');

function temporaryOutput() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cherries-sourcepack-test-'));
    return { root, pack: path.join(root, 'artifacts/pattern-samples/2026-10-16/original-cherries-v1') };
}

function snapshot(root, prefix = '') {
    return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
        const file = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) return snapshot(root, file);
        const full = path.join(root, file);
        return [{ file, bytes: fs.readFileSync(full).toString('base64'), modified: fs.statSync(full).mtimeMs }];
    });
}

test('native source contains only selected Perler colors and all-zero empty cells in the independently authored cherries', () => {
    const { pattern, rgba } = design();
    const occupied = [], colors = new Set();
    for (let i = 0; i < rgba.length; i += 4) {
        const pixel = [...rgba.subarray(i, i + 4)];
        if (pixel[3] === 0) assert.deepEqual(pixel, [0, 0, 0, 0]);
        else {
            assert.equal(pixel[3], 255);
            colors.add(pixel.slice(0, 3).join(','));
            occupied.push({ x: i / 4 % 29, y: Math.floor(i / 4 / 29) });
        }
    }
    assert.deepEqual([...colors].sort(), ['176,53,60', '157,43,58', '221,89,91', '0,123,78', '77,171,100'].sort());
    assert.equal(occupied.length, pattern.materials.reduce((sum, color) => sum + color.count, 0));
    assert.ok(Math.max(...occupied.map(p => p.x)) - Math.min(...occupied.map(p => p.x)) + 1 <= 29);
    assert.ok(Math.max(...occupied.map(p => p.y)) - Math.min(...occupied.map(p => p.y)) + 1 <= 29);
    assert.equal(occupied.length, 284);
    assert.deepEqual(pattern.bounds, { x: 3, y: 3, width: 24, height: 23 });
    assert.deepEqual(pattern.materials.map(({ref,count})=>[ref,count]), [['80-19005',133],['80-15961',41],['80-19059',8],['80-19010',73],['80-19080',29]]);
    assert.equal(pattern.width, 29);
    assert.equal(pattern.height, 29);
    assert.equal(pattern.validation.namedCharacter, false);
    assert.equal(pattern.physicalAssemblyTested, false);
    assert.equal(pattern.ironingTested, false);
});

function independentComponents(cells) {
    const parent = new Map(cells.map(cell => [cell, cell]));
    const root = cell => {
        while (parent.get(cell) !== cell) cell = parent.get(cell);
        return cell;
    };
    for (const cell of cells) {
        const right = cell + 1, down = cell + 29;
        for (const neighbor of [cell % 29 < 28 ? right : -1, down]) {
            if (parent.has(neighbor)) parent.set(root(cell), root(neighbor));
        }
    }
    return new Set(cells.map(root)).size;
}

function realEditorParser() {
    const cache = new Map();
    function load(file) {
        if (cache.has(file)) return cache.get(file);
        const loadedModule = { exports: {} }; cache.set(file, loadedModule.exports);
        const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
        const localRequire = name => {
            let resolved = name.startsWith('@/') ? path.join(repo, 'src', name.slice(2)) : path.resolve(path.dirname(file), name);
            if (!fs.existsSync(resolved)) resolved += '.ts';
            return load(resolved);
        };
        vm.runInNewContext(js, { module: loadedModule, exports: loadedModule.exports, require: localRequire, atob, btoa, Uint8ClampedArray, console }, { filename: file });
        return loadedModule.exports;
    }
    return load(path.join(repo, 'src/lib/editor/draft.ts'));
}

test('two separate fruit lobes meet through the forked stem and one leaf without digital cut points', () => {
    const occupied = [];
    ROWS.forEach((row, y) => [...row].forEach((symbol, x) => { if (symbol !== '.') occupied.push(y * 29 + x); }));
    assert.equal(independentComponents(occupied), 1);
    const articulations = occupied.filter(omitted => independentComponents(occupied.filter(cell => cell !== omitted)) > 1);
    assert.deepEqual(articulations, []);
    // Fruit bodies remain two components when the green stems/leaf are excluded.
    const fruit = occupied.filter(cell => 'RDH'.includes(ROWS[Math.floor(cell / 29)][cell % 29]));
    assert.equal(independentComponents(fruit), 2);
    assert.equal(ROWS.flatMap(row => [...row]).filter(symbol => symbol === 'H').length, 8);
    assert.equal(ROWS[3].slice(21, 24), 'LLL');
    assert.ok(ROWS.slice(14, 24).some(row => row.slice(3, 15).includes('R')));
    assert.ok(ROWS.slice(16, 26).some(row => row.slice(16, 27).includes('R')));
    assert.equal(createHash('sha256').update(ROWS.join('\n')).digest('hex'), REVIEWED_ROWS_SHA256);
});

test('source RGBA is independently derived from current CSV codes and matches native PNG and the actual editor project', async () => {
    const output = temporaryOutput();
    try {
        await generate(output.pack);
        const manifest = JSON.parse(fs.readFileSync(path.join(output.pack, 'manifest.json'), 'utf8'));
        const pattern = manifest.patterns[0];
        assert.equal(pattern.slug, 'cherry'); assert.equal(pattern.id, 'original-cherries');
        assert.deepEqual(pattern.localizedSubjects, { de: 'Kirschen', fr: 'Cerises', ja: 'さくらんぼ' });
        const refs = { R: '80-19005', D: '80-15961', H: '80-19059', G: '80-19010', L: '80-19080' };
        const csv = new Map(fs.readFileSync(path.join(repo, 'public/palettes/perler.csv'), 'utf8').trim().split(/\r?\n/).map(line => {
            const fields = line.split(','); return [fields[0], { name: fields[1], rgb: fields.slice(3, 6).map(Number) }];
        }));
        const expected = Buffer.alloc(29 * 29 * 4), counts = new Map();
        pattern.rows.forEach((row, y) => [...row].forEach((symbol, x) => {
            if (symbol === '.') return;
            const ref = refs[symbol], source = csv.get(ref); assert.ok(source);
            expected.set([...source.rgb, 255], (y * 29 + x) * 4);
            counts.set(ref, (counts.get(ref) ?? 0) + 1);
        }));
        assert.equal(counts.size, 5); assert.equal([...counts.values()].reduce((a, b) => a + b, 0), 284);
        for (const item of pattern.materials) {
            assert.equal(item.count, counts.get(item.ref)); assert.equal(item.name, csv.get(item.ref).name);
            assert.deepEqual(item.rgb, csv.get(item.ref).rgb);
        }
        const png = await sharp(path.join(output.pack, 'pixels', `${ID}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.deepEqual([png.info.width, png.info.height], [29, 29]); assert.ok(png.data.equals(expected));
        const file = fs.readFileSync(path.join(output.pack, 'projects', `${ID}.bead-pattern.json`), 'utf8');
        const editor = realEditorParser(), draft = editor.parseEditorProject(file); assert.ok(draft);
        assert.equal(draft.boardId, 'midi'); assert.equal(draft.boardWidth, 1); assert.equal(draft.boardHeight, 1);
        assert.ok(Buffer.from(editor.decodeEditorPatternDraft(draft.editedPattern)).equals(expected));
        assert.deepEqual(editor.parseEditorProject(editor.serializeEditorProject(draft)), draft);
        assert.deepEqual(Array.from(draft.activePalettes[0].entries, item => item.ref), Object.values(refs));
        assert.equal(pattern.physicalAssemblyTested, false); assert.equal(pattern.ironingTested, false);
    } finally { fs.rmSync(output.root, { recursive: true, force: true }); }
});

test('existing packs are preserved and the real CLI check-only changes no bytes or mtimes', async () => {
    const output = temporaryOutput();
    try {
        const init = spawnSync('git', ['init', '--quiet', output.root]);
        assert.equal(init.status, 0);
        fs.writeFileSync(path.join(output.root, '.gitignore'), '/artifacts/\n');
        const report = await generate(output.pack);
        assert.equal(report.fourConnectedComponents, 1);
        assert.equal(report.singleBeadCutPoints, 0);
        assert.equal(report.realEditorParse, true);
        const before = snapshot(output.pack);
        const cli = spawnSync(process.execPath, ['scripts/generate-original-cherries-sourcepack.mjs', '--check-only', '--output', output.pack], { cwd: repo, encoding: 'utf8' });
        assert.equal(cli.status, 0, cli.stderr);
        assert.equal(JSON.parse(cli.stdout).mode, 'read-only-check');
        assert.deepEqual(snapshot(output.pack), before);
        await assert.rejects(generate(output.pack), /Source-pack directory exists/);
        assert.deepEqual(snapshot(output.pack), before);
        assert.equal(fs.readdirSync(output.pack).includes('pdfs'), false);
    } finally {
        fs.rmSync(output.root, { recursive: true, force: true });
    }
});

test('readback rejects hidden transparent RGB, editor palette changes, manifest omissions and rewritten QA evidence', async () => {
    const output = temporaryOutput();
    try {
        await generate(output.pack);
        const pixelFile = path.join(output.pack, `pixels/${ID}.png`);
        const originalPixel = fs.readFileSync(pixelFile);
        const decoded = await sharp(originalPixel).ensureAlpha().raw().toBuffer();
        decoded[0] = 37;
        fs.writeFileSync(pixelFile, await sharp(decoded, { raw: { width: 29, height: 29, channels: 4 } }).png().toBuffer());
        await assert.rejects(checkArtifacts(output.pack), /all-zero transparency/);
        fs.writeFileSync(pixelFile, originalPixel);

        const mutations = [
            [`projects/${ID}.bead-pattern.json`, p => { p.draft.activePalettes[0].entries[0].ref = 'wrong-ref'; }, /Project differs/],
            ['manifest.json', m => { m.state = 'published'; }, /Manifest differs/],
            ['manifest.json', m => { m.patterns[0].descriptionZh = 'rewritten'; }, /Manifest differs/],
            ['manifest.json', m => { m.patterns[0].physicalAssemblyTested = true; }, /Manifest differs/],
            ['candidate-assets.json', m => { m.patterns[0].pendingFiles = {}; }, /Candidate assets differ/],
            ['qa/sourcepack-checks.json', q => { q.visualReview = 'approved'; }, /Preserved digital QA receipt differs/],
        ];
        for (const [relative, mutate, expectedError] of mutations) {
            const file = path.join(output.pack, relative), bytes = fs.readFileSync(file);
            const altered = JSON.parse(bytes);
            mutate(altered);
            fs.writeFileSync(file, JSON.stringify(altered));
            await assert.rejects(checkArtifacts(output.pack), expectedError);
            fs.writeFileSync(file, bytes);
        }
        const readme = path.join(output.pack, 'README.md'), originalReadme = fs.readFileSync(readme);
        fs.appendFileSync(readme, '\nApproved for publishing.\n');
        await assert.rejects(checkArtifacts(output.pack), /README differs/);
        fs.writeFileSync(readme, originalReadme);
        fs.writeFileSync(path.join(output.pack, 'extra.json'), '{}');
        await assert.rejects(checkArtifacts(output.pack), /file inventory differs/);
        fs.unlinkSync(path.join(output.pack, 'extra.json'));
        await checkArtifacts(output.pack);
    } finally {
        fs.rmSync(output.root, { recursive: true, force: true });
    }
});

test('CLI rejects ambiguous paths, nonignored destinations and symlink paths into public', () => {
    const output = temporaryOutput();
    try {
        assert.throws(() => options([]), /Specify --output/);
        assert.throws(() => options(['--output']), /Missing --output/);
        assert.throws(() => options(['--unknown']), /Unknown option/);
        assert.throws(() => options(['--output', 'artifacts/wrong-name']), /versioned artifacts/);
        assert.throws(() => options(['--output', 'public/artifacts/pattern-samples/2026-10-16/original-cherries-v1']), /Never generate/);
        fs.mkdirSync(path.join(output.root, 'public'));
        fs.symlinkSync(path.join(output.root, 'public'), path.join(output.root, 'redirect'));
        assert.throws(() => options(['--output', path.join(output.root, 'redirect/artifacts/pattern-samples/2026-10-16/original-cherries-v1')]), /Never generate/);
        const cli = spawnSync(process.execPath, ['scripts/generate-original-cherries-sourcepack.mjs', '--output', output.pack], { cwd: repo, encoding: 'utf8' });
        assert.notEqual(cli.status, 0);
        assert.match(cli.stderr, /Git-ignored project artifacts directory/);
        assert.equal(fs.existsSync(output.pack), false);
    } finally {
        fs.rmSync(output.root, { recursive: true, force: true });
    }
});

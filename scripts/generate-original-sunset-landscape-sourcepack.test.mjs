import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { SIZE, chartSvg, checkArtifacts, cutPoints, designs, generate, options, tileRgba } from './generate-original-sunset-landscape-sourcepack.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const repo = path.resolve(import.meta.dirname, '..');
const sha = value => createHash('sha256').update(value).digest('hex');
function temporaryOutput(ignored = true) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sunset-sourcepack-test-')));
    assert.equal(spawnSync('git', ['init', '--quiet', root]).status, 0);
    if (ignored) fs.writeFileSync(path.join(root, '.gitignore'), '/artifacts/\n');
    return { root, pack: path.join(root, 'artifacts/pattern-samples/2026-10-11/original-large-landscape-v1') };
}
function snapshot(root, prefix = '') {
    return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name, full = path.join(root, relative), modified = fs.statSync(full).mtimeMs;
        return entry.isDirectory() ? [{ relative, modified, directory: true }, ...snapshot(root, relative)] : [{ relative, modified, bytes: fs.readFileSync(full).toString('base64') }];
    });
}

test('iterative cut points match independent vertex-removal connectivity for every small grid, root and disconnected component', () => {
    function componentCount(cells, omitted) {
        const remaining = new Set([...cells].filter(cell => cell !== omitted)); let count = 0;
        while (remaining.size) {
            count++;
            const queue = [remaining.values().next().value]; remaining.delete(queue[0]);
            for (const current of queue) for (const candidate of remaining) {
                if (Math.abs(current % SIZE - candidate % SIZE) + Math.abs(Math.floor(current / SIZE) - Math.floor(candidate / SIZE)) !== 1) continue;
                remaining.delete(candidate); queue.push(candidate);
            }
        }
        return count;
    }
    function expectOracle(cells) {
        const before = componentCount(cells);
        const expected = [...cells].filter(cell => componentCount(cells, cell) > before).sort((a, b) => a - b);
        assert.deepEqual(cutPoints(cells), expected);
        assert.deepEqual(cutPoints(new Set([...cells].reverse())), expected);
    }
    for (const offset of [0, 55 * SIZE + 55]) for (let mask = 0; mask < 512; mask++) {
        const cells = new Set();
        for (let index = 0; index < 9; index++) if (mask & 1 << index) cells.add(offset + Math.floor(index / 3) * SIZE + index % 3);
        expectOracle(cells);
    }
    // Adjacent numeric indices at a row boundary must not become grid edges.
    expectOracle(new Set([56, 57, 58, 59, 60, SIZE * 2 + 2, SIZE * 3 + 2]));
});

test('full boards and a 1710-cell winding path work with a small JavaScript call stack', () => {
    const cli = spawnSync(process.execPath, ['--stack_size=256', '--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import { SIZE, cutPoints, designs } from './scripts/generate-original-sunset-landscape-sourcepack.mjs';
        assert.equal(designs()[0].pattern.beads, 2496);
        assert.deepEqual(cutPoints(new Set(Array.from({length: SIZE * SIZE}, (_, i) => i))), []);
        const path = [];
        for (let y = 0; y < SIZE - 1; y += 2) {
            for (let x = 0; x < SIZE; x++) path.push(y * SIZE + (y / 2 % 2 ? SIZE - 1 - x : x));
            if (y + 2 < SIZE) path.push((y + 1) * SIZE + (y / 2 % 2 ? 0 : SIZE - 1));
        }
        assert.equal(path.length, 1710);
        assert.deepEqual(cutPoints(new Set(path)), path.slice(1, -1).sort((a, b) => a - b));
    `], { cwd: repo, encoding: 'utf8' });
    assert.equal(cli.status, 0, cli.stderr);
});

test('the original58-grid landscape uses exact CSV colors and four841-cell quadrants, with no seam cells lost or counted twice', () => {
    const { pattern, rgba } = designs()[0];
    assert.equal(pattern.id, 'original-sunset-mountain-lake'); assert.equal(pattern.slug, 'sunset-mountain-lake');
    assert.deepEqual([pattern.width, pattern.height, pattern.boardWidth, pattern.boardHeight], [58, 58, 2, 2]);
    assert.deepEqual(pattern.bounds, { x: 3, y: 5, width: 52, height: 48 });
    assert.equal(pattern.beads, 2496); assert.equal(pattern.colorCount, 8);
    assert.equal(sha(rgba), pattern.validation.rgbaSha256); assert.equal(sha(pattern.rows.join('\n')), pattern.validation.designRowsSha256);
    const colors = new Set(pattern.materials.map(color => color.rgb.join(','))), counts = new Map();
    let occupied = 0;
    for (let y = 0; y < 58; y++) for (let x = 0; x < 58; x++) {
        const pixel = [...rgba.subarray((y * 58 + x) * 4, (y * 58 + x + 1) * 4)];
        const inPanel = x >= 3 && x <= 54 && y >= 5 && y <= 52;
        if (!inPanel) assert.deepEqual(pixel, [0, 0, 0, 0]);
        else { assert.equal(pixel[3], 255); assert.ok(colors.has(pixel.slice(0, 3).join(','))); occupied++; counts.set(pixel.slice(0, 3).join(','), (counts.get(pixel.slice(0, 3).join(',')) || 0) + 1); }
    }
    assert.equal(occupied, 2496);
    for (const color of pattern.materials) assert.equal(counts.get(color.rgb.join(',')), color.count);
    const joined = Buffer.alloc(rgba.length), seen = new Set();
    for (const tile of pattern.boardTiles) {
        assert.deepEqual([tile.width, tile.height, tile.cells, tile.beads, tile.emptyCells], [29, 29, 841, 624, 217]);
        const data = tileRgba(rgba, tile.column - 1, tile.row - 1); assert.equal(sha(data), tile.rgbaSha256);
        for (let y = 0; y < 29; y++) for (let x = 0; x < 29; x++) {
            const index = (tile.origin.y + y) * 58 + tile.origin.x + x;
            assert.equal(seen.has(index), false); seen.add(index);
            data.copy(joined, index * 4, (y * 29 + x) * 4, (y * 29 + x + 1) * 4);
        }
    }
    assert.equal(seen.size, 841 * 4); assert.ok(joined.equals(rgba));
    for (const material of pattern.materials) assert.equal(pattern.boardTiles.reduce((sum, tile) => sum + tile.counts[material.symbol], 0), material.count);
    for (const [x, y] of [[28, 28], [29, 28], [28, 29], [29, 29]]) assert.equal(rgba[(y * 58 + x) * 4 + 3], 255);
    assert.ok(chartSvg(pattern).includes('d="M730,34V1426M34,730H1426" stroke="#b64b40" stroke-width="2.6"'));
    assert.equal(pattern.rows[16][43], 'Y'); assert.equal(pattern.rows[20][17], 'L');
    assert.equal(pattern.rows[30][24], 'P'); assert.equal(pattern.rows[37][25], 'L'); assert.equal(pattern.rows[29][9], 'N');
    assert.equal(pattern.topology.components, 1); assert.equal(pattern.topology.singleBeadCutPoints, 0);
    assert.equal(pattern.physicalAssemblyTested, false); assert.equal(pattern.validation.notAnEnlargedSingleBoardDesign, true);
});

test('the14-file pack passes the real editor parser and actual read-only CLI without modifying bytes or mtimes', async () => {
    const out = temporaryOutput();
    try {
        const report = await generate(out.pack);
        assert.equal(report.realEditorParse, true); assert.equal(report.realEditorSerializeReparse, true);
        assert.equal(report.fourQuadrantsExactlyRecomposeSource, true);
        const before = snapshot(out.pack); assert.equal(before.filter(entry => !entry.directory).length, 14);
        const cli = spawnSync(process.execPath, ['scripts/generate-original-sunset-landscape-sourcepack.mjs', '--check-only', '--output', out.pack], { cwd: repo, encoding: 'utf8' });
        assert.equal(cli.status, 0, cli.stderr); assert.equal(JSON.parse(cli.stdout).mode, 'read-only-check');
        assert.deepEqual(snapshot(out.pack), before);
        await assert.rejects(generate(out.pack), /Source-pack directory exists/); assert.deepEqual(snapshot(out.pack), before);
        assert.equal(fs.existsSync(path.join(out.pack, 'pdfs')), false);
    } finally { fs.rmSync(out.root, { recursive: true, force: true }); }
});

test('readback rejects a shifted quadrant seam, hidden transparent RGB, wrong project board size, false physical claims and unsafe output paths', async () => {
    const out = temporaryOutput(), notIgnored = temporaryOutput(false);
    try {
        await generate(out.pack);
        const id = 'original-sunset-mountain-lake';
        const tile = path.join(out.pack, `boards/${id}-board-2.png`), originalTile = fs.readFileSync(tile);
        const rawTile = await sharp(originalTile).ensureAlpha().raw().toBuffer(), shifted = Buffer.alloc(rawTile.length);
        for (let y = 0; y < 29; y++) rawTile.copy(shifted, y * 29 * 4, (y * 29 + 1) * 4, (y + 1) * 29 * 4);
        fs.writeFileSync(tile, await sharp(shifted, { raw: { width: 29, height: 29, channels: 4 } }).png().toBuffer());
        await assert.rejects(checkArtifacts(out.pack), /Quadrant PNG differs/); fs.writeFileSync(tile, originalTile);
        const pixel = path.join(out.pack, `pixels/${id}.png`), originalPixel = fs.readFileSync(pixel);
        const raw = await sharp(originalPixel).ensureAlpha().raw().toBuffer(); raw[0] = 15;
        fs.writeFileSync(pixel, await sharp(raw, { raw: { width: 58, height: 58, channels: 4 } }).png().toBuffer());
        await assert.rejects(checkArtifacts(out.pack), /all-zero transparency/); fs.writeFileSync(pixel, originalPixel);
        for (const [relative, mutate, message] of [
            [`projects/${id}.bead-pattern.json`, value => { value.draft.boardWidth = 1; }, /Project differs/],
            ['manifest.json', value => { value.patterns[0].physicalAssemblyTested = true; }, /Manifest differs/],
            ['manifest.json', value => { value.patterns[0].boardTiles[0].beads = 625; }, /Manifest differs/],
            ['qa/sourcepack-checks.json', value => { value.fourQuadrantsExactlyRecomposeSource = false; }, /Preserved digital QA differs/],
        ]) {
            const file = path.join(out.pack, relative), bytes = fs.readFileSync(file), value = JSON.parse(bytes); mutate(value); fs.writeFileSync(file, JSON.stringify(value));
            await assert.rejects(checkArtifacts(out.pack), message); fs.writeFileSync(file, bytes);
        }
        fs.mkdirSync(path.join(out.pack, 'extra'));
        await assert.rejects(checkArtifacts(out.pack), /Unexpected source-pack directory/); fs.rmdirSync(path.join(out.pack, 'extra'));
        fs.symlinkSync(pixel, path.join(out.pack, 'linked'));
        await assert.rejects(checkArtifacts(out.pack), /symlinks are not allowed/); fs.unlinkSync(path.join(out.pack, 'linked'));
        assert.throws(() => options(['--output', 'public/artifacts/pattern-samples/2026-10-11/original-large-landscape-v1']), /Never generate/);
        assert.throws(() => options(['--output', 'artifacts/wrong-version']), /versioned private/);
        await assert.rejects(generate(notIgnored.pack), /must be Git ignored/); assert.equal(fs.existsSync(notIgnored.pack), false);
        await checkArtifacts(out.pack);
    } finally { fs.rmSync(out.root, { recursive: true, force: true }); fs.rmSync(notIgnored.root, { recursive: true, force: true }); }
});

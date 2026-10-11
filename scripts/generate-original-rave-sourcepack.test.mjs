import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createRequire } from 'node:module';
import { checkArtifacts, designs, generate, options } from './generate-original-rave-sourcepack.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const repo = path.resolve(import.meta.dirname, '..');
function temporaryOutput(ignored = true) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'rave-sourcepack-test-')));
    assert.equal(spawnSync('git', ['init', '--quiet', root]).status, 0);
    if (ignored) fs.writeFileSync(path.join(root, '.gitignore'), '/artifacts/\n');
    return { root, pack: path.join(root, 'artifacts/pattern-samples/2026-10-11/original-rave-v1') };
}
function snapshot(root, prefix = '') {
    return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name, full = path.join(root, relative), modified = fs.statSync(full).mtimeMs;
        return entry.isDirectory() ? [{ relative, modified, directory: true }, ...snapshot(root, relative)] : [{ relative, modified, bytes: fs.readFileSync(full).toString('base64') }];
    });
}

test('three identifiable original motifs use exact CSV colors, alpha255, zero transparent RGB and a single connected layout', () => {
    const all = designs();
    assert.deepEqual(all.map(({ pattern }) => [pattern.id, pattern.slug, pattern.colorCount]), [
        ['original-rave-alien-head', 'alien-head', 4], ['original-rave-rainbow-smiley', 'rainbow-smiley', 7], ['original-rave-moon-mushroom', 'crescent-moon-mushroom', 5],
    ]);
    for (const { pattern, rgba } of all) {
        assert.equal(pattern.width, 29); assert.equal(pattern.height, 29);
        const colors = new Set(pattern.materials.map(color => color.rgb.join(','))); let count = 0;
        for (let i = 0; i < rgba.length; i += 4) {
            const pixel = [...rgba.subarray(i, i + 4)];
            if (pixel[3] === 0) assert.deepEqual(pixel, [0, 0, 0, 0]);
            else { assert.equal(pixel[3], 255); assert.ok(colors.has(pixel.slice(0, 3).join(','))); count++; }
        }
        assert.equal(count, pattern.beads); assert.equal(pattern.materials.reduce((sum, color) => sum + color.count, 0), count);
        assert.equal(pattern.topology.components, 1); assert.equal(pattern.physicalAssemblyTested, false);
        assert.equal(pattern.source, null); assert.equal(pattern.validation.namedCharacter, false);
    }
    const [alien, smiley, moon] = all.map(({ pattern }) => pattern);
    assert.equal(alien.rows[11].slice(7, 12), 'BBBBB'); assert.equal(alien.rows[11].slice(17, 22), 'BBBBB');
    assert.equal(smiley.rows[3].slice(11, 18), 'BBBBBBB'); assert.equal(smiley.rows[19].slice(11, 18), 'BBBBBBB');
    assert.equal(moon.rows[8][4], 'C'); assert.equal(moon.rows[15][17], 'M'); assert.equal(moon.rows[23][18], 'W');
});

test('actual CLI checks all20 shared-pack files, preserves bytes and mtimes, and never rewrites an existing pack', async () => {
    const out = temporaryOutput();
    try {
        const report = await generate(out.pack);
        assert.equal(report.realEditorParse, true); assert.equal(report.realEditorSerializeReparse, true);
        const before = snapshot(out.pack); assert.equal(before.filter(entry => !entry.directory).length, 20);
        const cli = spawnSync(process.execPath, ['scripts/generate-original-rave-sourcepack.mjs', '--check-only', '--output', out.pack], { cwd: repo, encoding: 'utf8' });
        assert.equal(cli.status, 0, cli.stderr); assert.equal(JSON.parse(cli.stdout).mode, 'read-only-check');
        assert.deepEqual(snapshot(out.pack), before);
        await assert.rejects(generate(out.pack), /Source-pack directory exists/); assert.deepEqual(snapshot(out.pack), before);
        assert.equal(fs.existsSync(path.join(out.pack, 'pdfs')), false);
    } finally { fs.rmSync(out.root, { recursive: true, force: true }); }
});

test('readback detects hidden transparent RGB, altered project palette, false physical claims, extra entries and unsafe destinations', async () => {
    const out = temporaryOutput(), notIgnored = temporaryOutput(false);
    try {
        await generate(out.pack);
        const pixels = path.join(out.pack, 'pixels/original-rave-alien-head.png'), original = fs.readFileSync(pixels);
        const raw = await sharp(original).ensureAlpha().raw().toBuffer(); raw[0] = 15;
        fs.writeFileSync(pixels, await sharp(raw, { raw: { width: 29, height: 29, channels: 4 } }).png().toBuffer());
        await assert.rejects(checkArtifacts(out.pack), /all-zero transparency/); fs.writeFileSync(pixels, original);
        for (const [relative, mutate, message] of [
            ['projects/original-rave-moon-mushroom.bead-pattern.json', value => { value.draft.activePalettes[0].entries[0].ref = 'wrong'; }, /Project differs/],
            ['manifest.json', value => { value.patterns[0].physicalAssemblyTested = true; }, /Manifest differs/],
            ['qa/sourcepack-checks.json', value => { value.physicalAssemblyTested = true; }, /Preserved digital QA differs/],
        ]) {
            const file = path.join(out.pack, relative), bytes = fs.readFileSync(file), value = JSON.parse(bytes); mutate(value); fs.writeFileSync(file, JSON.stringify(value));
            await assert.rejects(checkArtifacts(out.pack), message); fs.writeFileSync(file, bytes);
        }
        fs.mkdirSync(path.join(out.pack, 'extra'));
        await assert.rejects(checkArtifacts(out.pack), /Unexpected source-pack directory/); fs.rmdirSync(path.join(out.pack, 'extra'));
        fs.symlinkSync(pixels, path.join(out.pack, 'linked'));
        await assert.rejects(checkArtifacts(out.pack), /symlinks are not allowed/); fs.unlinkSync(path.join(out.pack, 'linked'));
        assert.throws(() => options(['--output', 'public/artifacts/pattern-samples/2026-10-11/original-rave-v1']), /Never generate/);
        await assert.rejects(generate(notIgnored.pack), /must be Git ignored/); assert.equal(fs.existsSync(notIgnored.pack), false);
        await checkArtifacts(out.pack);
    } finally { fs.rmSync(out.root, { recursive: true, force: true }); fs.rmSync(notIgnored.root, { recursive: true, force: true }); }
});

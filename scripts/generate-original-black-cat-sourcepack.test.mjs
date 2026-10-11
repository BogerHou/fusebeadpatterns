import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createRequire } from 'node:module';
import { ID, checkArtifacts, design, generate, options } from './generate-original-black-cat-sourcepack.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const repo = path.resolve(import.meta.dirname, '..');

function temporaryOutput() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'black-cat-sourcepack-test-'));
    return { root, pack: path.join(root, 'artifacts/pattern-samples/2026-10-11/original-black-cat-v1') };
}

function snapshot(root, prefix = '') {
    return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
        const file = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) return snapshot(root, file);
        const full = path.join(root, file);
        return [{ file, bytes: fs.readFileSync(full).toString('base64'), modified: fs.statSync(full).mtimeMs }];
    });
}

test('native source contains only selected Perler colors and all-zero empty cells within the small-motif limit', () => {
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
    assert.deepEqual([...colors].sort(), ['231,206,62', '50,50,52'].sort());
    assert.equal(occupied.length, pattern.materials.reduce((sum, color) => sum + color.count, 0));
    assert.ok(Math.max(...occupied.map(p => p.x)) - Math.min(...occupied.map(p => p.x)) + 1 <= 16);
    assert.ok(Math.max(...occupied.map(p => p.y)) - Math.min(...occupied.map(p => p.y)) + 1 <= 16);
    assert.equal(pattern.width, 29);
    assert.equal(pattern.height, 29);
    assert.equal(pattern.validation.namedCharacter, false);
    assert.equal(pattern.physicalAssemblyTested, false);
    assert.equal(pattern.ironingTested, false);
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
        const cli = spawnSync(process.execPath, ['scripts/generate-original-black-cat-sourcepack.mjs', '--check-only', '--output', output.pack], { cwd: repo, encoding: 'utf8' });
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
        assert.throws(() => options(['--output', 'public/artifacts/pattern-samples/2026-10-11/original-black-cat-v1']), /Never generate/);
        fs.mkdirSync(path.join(output.root, 'public'));
        fs.symlinkSync(path.join(output.root, 'public'), path.join(output.root, 'redirect'));
        assert.throws(() => options(['--output', path.join(output.root, 'redirect/artifacts/pattern-samples/2026-10-11/original-black-cat-v1')]), /Never generate/);
        const cli = spawnSync(process.execPath, ['scripts/generate-original-black-cat-sourcepack.mjs', '--output', output.pack], { cwd: repo, encoding: 'utf8' });
        assert.notEqual(cli.status, 0);
        assert.match(cli.stderr, /Git-ignored project artifacts directory/);
        assert.equal(fs.existsSync(output.pack), false);
    } finally {
        fs.rmSync(output.root, { recursive: true, force: true });
    }
});

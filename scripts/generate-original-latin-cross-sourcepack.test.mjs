import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { ID, checkArtifacts, design, generate, options } from './generate-original-latin-cross-sourcepack.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const repo = path.resolve(import.meta.dirname, '..');

function temporaryOutput(ignored = true) {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'latin-cross-sourcepack-test-')));
    const init = spawnSync('git', ['init', '--quiet', root]);
    assert.equal(init.status, 0);
    if (ignored) fs.writeFileSync(path.join(root, '.gitignore'), '/artifacts/\n');
    return { root, pack: path.join(root, 'artifacts/pattern-samples/2026-10-11/original-latin-cross-v1') };
}

function snapshot(root, prefix = '') {
    return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
        const file = prefix ? `${prefix}/${entry.name}` : entry.name;
        const full = path.join(root, file);
        const modified = fs.statSync(full).mtimeMs;
        return entry.isDirectory()
            ? [{ file, modified, directory: true }, ...snapshot(root, file)]
            : [{ file, modified, bytes: fs.readFileSync(full).toString('base64') }];
    });
}

test('native RGBA is the specified plain Latin cross, with one exact CSV Brown and zero empty cells', () => {
    const { pattern, rgba } = design();
    const rowCounts = Array(29).fill(0), columnCounts = Array(29).fill(0), colors = new Set();
    let count = 0;
    for (let index = 0; index < rgba.length; index += 4) {
        const pixel = [...rgba.subarray(index, index + 4)];
        if (pixel[3] === 0) assert.deepEqual(pixel, [0, 0, 0, 0]);
        else {
            assert.deepEqual(pixel, [103, 76, 68, 255]);
            colors.add(pixel.slice(0, 3).join(','));
            rowCounts[Math.floor(index / 4 / 29)]++;
            columnCounts[index / 4 % 29]++;
            count++;
        }
    }
    assert.equal(count, 87);
    assert.deepEqual(rowCounts, [0, 0, 0, 0, 0, ...Array(5).fill(3), 13, 13, 13, ...Array(11).fill(3), 0, 0, 0, 0, 0]);
    assert.deepEqual(columnCounts, [...Array(8).fill(0), ...Array(5).fill(3), 19, 19, 19, ...Array(5).fill(3), ...Array(8).fill(0)]);
    assert.deepEqual([...colors], ['103,76,68']);
    assert.deepEqual(pattern.materials, [{ ref: '80-19012', name: 'Brown', rgb: [103, 76, 68], hex: '#674c44', symbol: 'B', count: 87 }]);
    assert.deepEqual(pattern.bounds, { x: 8, y: 5, width: 13, height: 19 });
    assert.deepEqual([pattern.width, pattern.height, pattern.beads, pattern.colorCount], [29, 29, 87, 1]);
    assert.equal(pattern.bounds.height > 16, true, 'This design must not enter strict Small selection');
    assert.equal(createHash('sha256').update(rgba).digest('hex'), '4516a5ad71d0f5b36953124d757ebd85904c05b98676509b686854f460358bd5');
    assert.equal(pattern.id, 'original-latin-cross');
    assert.equal(pattern.slug, 'cross');
    assert.equal(pattern.title, 'Cross');
    assert.deepEqual(pattern.localizedSubjects, { de: 'Kreuz', fr: 'Croix', ja: '十字架' });
    assert.equal(pattern.source, null);
    assert.equal(pattern.validation.namedCharacter, false);
    assert.equal(pattern.validation.officialPatternCopied, false);
    assert.equal(pattern.physicalAssemblyTested, false);
    assert.equal(pattern.ironingTested, false);
});

test('the real CLI check-only preserves all ten files and their mtimes, and an existing pack is never rewritten', async () => {
    const output = temporaryOutput();
    try {
        const report = await generate(output.pack);
        assert.equal(report.fourConnectedComponents, 1);
        assert.equal(report.singleBeadCutPoints, 0);
        assert.equal(report.realEditorParse, true);
        assert.equal(report.realEditorSerializeReparse, true);
        const before = snapshot(output.pack);
        assert.equal(before.filter(entry => !entry.directory).length, 10);
        const cli = spawnSync(process.execPath, ['scripts/generate-original-latin-cross-sourcepack.mjs', '--check-only', '--output', output.pack], { cwd: repo, encoding: 'utf8' });
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

test('readback rejects hidden RGB, color/project and metadata changes, chart dimensions, extra entries and rewritten approval', async () => {
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
            [`projects/${ID}.bead-pattern.json`, p => { p.draft.boardId = 'mini'; }, /Project differs/],
            ['manifest.json', m => { m.state = 'published'; }, /Manifest differs/],
            ['manifest.json', m => { m.patterns[0].descriptionZh = 'rewritten'; }, /Manifest differs/],
            ['manifest.json', m => { m.patterns[0].source = 'copied'; }, /Manifest differs/],
            ['manifest.json', m => { m.patterns[0].physicalAssemblyTested = true; }, /Manifest differs/],
            ['site-entries.json', s => { s[0].description = 'plus sign'; }, /Site entries differ/],
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
        const chartFile = path.join(output.pack, `charts/${ID}.png`), originalChart = fs.readFileSync(chartFile);
        fs.writeFileSync(chartFile, await sharp(originalChart).resize(788, 907).png().toBuffer());
        await assert.rejects(checkArtifacts(output.pack));
        fs.writeFileSync(chartFile, originalChart);
        const readme = path.join(output.pack, 'README.md'), originalReadme = fs.readFileSync(readme);
        fs.appendFileSync(readme, '\nApproved for publishing.\n');
        await assert.rejects(checkArtifacts(output.pack), /README differs/);
        fs.writeFileSync(readme, originalReadme);
        const extra = path.join(output.pack, 'extra.json');
        fs.writeFileSync(extra, '{}');
        await assert.rejects(checkArtifacts(output.pack), /file inventory differs/);
        fs.unlinkSync(extra);
        fs.mkdirSync(path.join(output.pack, 'empty-extra'));
        await assert.rejects(checkArtifacts(output.pack), /file inventory differs/);
        fs.rmdirSync(path.join(output.pack, 'empty-extra'));
        fs.symlinkSync(pixelFile, path.join(output.pack, 'linked-pixels'));
        await assert.rejects(checkArtifacts(output.pack), /symlinks are not allowed/);
        fs.unlinkSync(path.join(output.pack, 'linked-pixels'));
        await checkArtifacts(output.pack);
    } finally {
        fs.rmSync(output.root, { recursive: true, force: true });
    }
});

test('canonical suffix, Git ignore and symlink protections apply to both CLI and exported generator', async () => {
    const output = temporaryOutput(false);
    try {
        assert.throws(() => options([]), /Specify --output/);
        assert.throws(() => options(['--output']), /Missing --output/);
        assert.throws(() => options(['--unknown']), /Unknown option/);
        assert.throws(() => options(['--output', 'artifacts/wrong-name']), /versioned artifacts/);
        assert.throws(() => options(['--output', 'public/artifacts/pattern-samples/2026-10-11/original-latin-cross-v1']), /Never generate/);
        fs.mkdirSync(path.join(output.root, 'public'));
        fs.symlinkSync(path.join(output.root, 'public'), path.join(output.root, 'redirect'));
        assert.throws(() => options(['--output', path.join(output.root, 'redirect/artifacts/pattern-samples/2026-10-11/original-latin-cross-v1')]), /Never generate/);
        fs.mkdirSync(path.join(output.root, 'private'));
        fs.symlinkSync(path.join(output.root, 'private'), path.join(output.root, 'private-link'));
        assert.throws(() => options(['--output', path.join(output.root, 'private-link/artifacts/pattern-samples/2026-10-11/original-latin-cross-v1')]), /path symlinks/);
        await assert.rejects(generate(output.pack), /must be Git ignored/);
        const cli = spawnSync(process.execPath, ['scripts/generate-original-latin-cross-sourcepack.mjs', '--output', output.pack], { cwd: repo, encoding: 'utf8' });
        assert.notEqual(cli.status, 0);
        assert.match(cli.stderr, /must be Git ignored/);
        assert.equal(fs.existsSync(output.pack), false);
    } finally {
        fs.rmSync(output.root, { recursive: true, force: true });
    }
});

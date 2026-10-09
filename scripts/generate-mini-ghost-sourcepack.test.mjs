import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    BOARD_SIZE, PROJECT_ID, SOURCE_LOCKS, chartSvg, checkArtifacts,
    generate, options, paddedPattern, sha256, sourceModel, validateEditorProject,
    validateSourceBytes, verifyPadding,
} from './generate-mini-ghost-sourcepack.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const model = await sourceModel();
const jsonBytes = value => Buffer.from(JSON.stringify(value));

function temporaryOutputs() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mini-ghost-sourcepack-test-'));
    return { root, pack: path.join(root, 'artifacts/mini-ghost-v1'), public: path.join(root, 'public/guides/mini-perler-beads/ghost-mini') };
}

function snapshot(root) {
    const files = {};
    function visit(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) visit(file);
            else files[path.relative(root, file)] = { sha256: sha256(fs.readFileSync(file)), modified: fs.statSync(file).mtimeMs };
        }
    }
    visit(root);
    return files;
}

test('independent frozen Ghost identities reject changed PNG, project and RGBA bytes', () => {
    assert.equal(sha256(model.original), SOURCE_LOCKS.rgba);
    const changedPng = Buffer.from(model.png); changedPng[changedPng.length - 1] ^= 1;
    assert.throws(() => validateSourceBytes(changedPng, model.originalProjectBytes), /PNG bytes changed/);
    const changedProject = Buffer.from(model.originalProjectBytes); changedProject[0] ^= 1;
    assert.throws(() => validateSourceBytes(model.png, changedProject), /project bytes changed/);
    const changedRgba = Buffer.from(model.original); changedRgba[0] = 1;
    assert.throws(() => paddedPattern(changedRgba), /pixel grid changed/);
});

test('57 x 57 padding retains every original cell with 311 occupied pixels', () => {
    assert.equal(model.padded.length, BOARD_SIZE * BOARD_SIZE * 4);
    assert.equal(sha256(model.padded), '0e22029dc08b1a00f4d64176cf6aff198f9c8bbbbfd31c3875273ecfdb5caef2');
    const colors = new Map();
    for (let offset = 0; offset < model.padded.length; offset += 4) {
        const pixel = model.padded.subarray(offset, offset + 4).toString('hex');
        colors.set(pixel, (colors.get(pixel) || 0) + 1);
    }
    assert.deepEqual(Object.fromEntries(colors), { '00000000': 2938, eaefeeff: 293, '323234ff': 18 });
    assert.deepEqual(model.sourceBounds, { x: 5, y: 4, width: 19, height: 21 });
    assert.deepEqual(model.targetBounds, { x: 19, y: 18, width: 19, height: 21 });
    const moved = Buffer.from(model.padded);
    moved[(18 * 57 + 19) * 4] ^= 1;
    assert.throws(() => verifyPadding(model.original, moved), /Changed pixel/);
});

test('the real editor parser accepts only the reviewed Mini board, blank project and internal palette', () => {
    const draft = validateEditorProject(jsonBytes(model.project), model.padded);
    assert.equal(draft.fileName, PROJECT_ID);
    assert.equal(draft.editedPattern.byteLength, 12996);
    for (const alter of [
        value => { value.draft.boardId = 'midi'; },
        value => { value.draft.pdfScaleMode = 'midi-5mm'; },
        value => { value.draft.activePalettes[0].entries[0].ref = '80-19001'; },
        value => { value.draft.activePalettes[0].entries[0].color.r += 1; },
        value => { value.draft.editedPattern.width = 29; },
        value => { value.draft.editedPattern.data = 'AAAA'; },
    ]) {
        const invalid = structuredClone(model.project);
        alter(invalid);
        assert.throws(() => validateEditorProject(jsonBytes(invalid), model.padded));
    }
});

test('the reading chart has 29 numbered rows and columns, all 311 symbols, and an explicit white/blank distinction', () => {
    const svg = chartSvg(model);
    assert.equal([...svg.matchAll(/fill="#17231b">W<\/text>/g)].length, 293);
    assert.equal([...svg.matchAll(/fill="white">B<\/text>/g)].length, 18);
    for (let number = 1; number <= 29; number++) assert.equal([...svg.matchAll(new RegExp(`>${number}</text>`, 'g'))].length, 2);
    assert.ok(svg.includes('Blank cells: no bead. W cells: White beads.'));
    assert.ok(svg.includes('W: White / 293 beads'));
    assert.ok(svg.includes('B: Black / 18 beads'));
    assert.ok(svg.includes('Use a matching Mini pegboard; read rows and columns.'));
    assert.equal(svg.includes('PM-WHITE'), false);
    assert.equal(svg.includes('PM-BLACK'), false);
    assert.ok(svg.includes('Not actual size. Assembly and ironing are untested.'));
    assert.equal(svg.includes('80-190'), false);
});

test('exclusive generation creates four matching public assets; check-only writes nothing and detects tampering', async () => {
    const output = temporaryOutputs();
    try {
        const report = await generate(output.pack, output.public);
        assert.equal(report.beads, 311);
        assert.equal(report.realEditorParse, true);
        assert.equal(report.realEditorDecode57x57, true);
        assert.deepEqual(fs.readdirSync(output.public).sort(), ['grid.png', 'pattern.bead-pattern.json', 'pixels.png', 'preview.png']);
        const before = snapshot(output.root);
        const cli = spawnSync(process.execPath, ['scripts/generate-mini-ghost-sourcepack.mjs', '--check-only', '--output', output.pack, '--public-output', output.public], { cwd: repo, encoding: 'utf8' });
        assert.equal(cli.status, 0, cli.stderr);
        assert.equal(JSON.parse(cli.stdout).mode, 'read-only-check');
        assert.deepEqual(snapshot(output.root), before, '--check-only modified an output');
        await assert.rejects(generate(output.pack, output.public), /Source-pack directory exists/);
        assert.deepEqual(snapshot(output.root), before, 'Rejected generation modified an existing output');
        const pixels = path.join(output.public, 'pixels.png');
        fs.writeFileSync(pixels, Buffer.from('tampered'));
        await assert.rejects(checkArtifacts(output.pack, output.public), /Public asset differs/);
        fs.writeFileSync(pixels, fs.readFileSync(path.join(output.pack, 'pixels/ghost-mini.png')));
        const qa = path.join(output.pack, 'qa/sourcepack-checks.json');
        const alteredQa = JSON.parse(fs.readFileSync(qa)); alteredQa.beads = 310;
        fs.writeFileSync(qa, JSON.stringify(alteredQa));
        await assert.rejects(checkArtifacts(output.pack, output.public), /preserved digital QA receipt differs/);
    } finally {
        fs.rmSync(output.root, { recursive: true, force: true });
    }
});

test('an existing public directory is rejected before creating a private source pack', async () => {
    const output = temporaryOutputs();
    try {
        fs.mkdirSync(output.public, { recursive: true });
        fs.writeFileSync(path.join(output.public, 'sentinel.txt'), 'preserve');
        await assert.rejects(generate(output.pack, output.public), /Public ghost-mini directory exists/);
        assert.equal(fs.existsSync(output.pack), false);
        assert.equal(fs.readFileSync(path.join(output.public, 'sentinel.txt'), 'utf8'), 'preserve');
    } finally {
        fs.rmSync(output.root, { recursive: true, force: true });
    }
});

test('CLI output arguments require isolated versioned directories', () => {
    assert.throws(() => options(['--output']), /Missing --output/);
    assert.throws(() => options(['--unknown']), /Unknown option/);
    assert.throws(() => options(['--output', 'artifacts/wrong-name']), /reviewed versioned/);
    assert.throws(() => options(['--output', 'public/mini-ghost-v1']), /ignored artifacts/);
    assert.throws(() => options(['--public-output', 'public/patterns/original-friendly-ghost']), /isolated ghost-mini/);
    assert.throws(() => options(['--output', 'artifacts/mini-ghost-v1', '--public-output', 'artifacts/mini-ghost-v1/ghost-mini']), /must not contain/);
});

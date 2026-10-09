import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    assertPublishedCatalogPreserved,
    assertRecordedPromotionPreserved,
    copyExclusive,
    createPromotionOutputRoot,
    main,
    parsePromotionOptions,
    parsePublishedCatalog,
    publishedCatalogBaseline,
    selectedPdfPages,
    validateOriginalPerlerProject,
    writeExclusive,
} from './build-pattern-library.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const current = parsePublishedCatalog(await readFile(path.join(root, 'src/lib/patterns/catalog.ts'), 'utf8'));
const published = publishedCatalogBaseline(current);
const selectedId = 'original-santa-hat';
const addition = { ...structuredClone(published.patterns.at(-1)), id: selectedId, slug: 'santa-hat', title: 'Santa Hat', version: 'Original Santa hat design v1' };
const promoted = () => [...structuredClone(published.patterns), structuredClone(addition)];

test('requires explicit selection and a separate staging output before reading packs', async () => {
    await assert.rejects(main([]), /Explicit --promote-id/);
    await assert.rejects(main(['--promote-id', selectedId, '--check-only', '/private/only-new-pack']), /all 12 sourcepack/);
    assert.throws(() => parsePromotionOptions(['--promote-id', selectedId]), /Writing requires --output-root/);
    assert.throws(() => parsePromotionOptions(['--promote-id', 'original-snowman', '--output-root', '/tmp/new-output']), /published IDs cannot be regenerated/);
    assert.throws(() => parsePromotionOptions(['--promote-id', selectedId, '--output-root', root]), /not the project root/);
    assert.throws(() => parsePromotionOptions(['--promote-id', selectedId, '--output-root']), /Missing value/);
    assert.throws(() => parsePromotionOptions(['--promote-id', selectedId, '--unknown']), /Unknown option/);
    assert.throws(() => parsePromotionOptions(['--promote-id', selectedId, '--check-only', '--check-only']), /Duplicate/);
});

test('repeat promotion derives the immutable 106 baseline from a recorded 107 target', () => {
    const recorded = { collections: structuredClone(published.collections), patterns: promoted() };
    assert.deepEqual(publishedCatalogBaseline(recorded), published);
    assert.doesNotThrow(() => assertRecordedPromotionPreserved(published, promoted()));
    assert.doesNotThrow(() => assertRecordedPromotionPreserved(recorded, promoted()));
    const changed = promoted();
    changed.at(-1).description += ' changed after publication';
    assert.throws(() => assertRecordedPromotionPreserved(recorded, changed), /repeat promotion must exactly match/);
    recorded.patterns[0].description += ' old entry drift';
    assert.throws(() => publishedCatalogBaseline(recorded), /baseline changed/);
    assert.throws(() => publishedCatalogBaseline({ collections: published.collections, patterns: [...promoted(), addition] }), /at most one recorded/);
    assert.throws(() => publishedCatalogBaseline({ collections: published.collections, patterns: [...published.patterns, { ...addition, id: 'unreviewed-addition' }] }), /frozen 106 catalog/);
});

test('the original Santa Hat project cannot silently switch its brand or board', () => {
    const pattern = { id: selectedId, title: 'Santa Hat', kind: 'original' };
    const project = { type: 'bead-pattern-project-v1', version: 1, draft: { selectedPaletteIds: ['perler'], boardId: 'midi', boardWidth: 1, boardHeight: 1 } };
    assert.doesNotThrow(() => validateOriginalPerlerProject(pattern, project));
    assert.throws(() => validateOriginalPerlerProject({ ...pattern, kind: 'source-adapted' }, project), /reviewed original/);
    for (const mutation of [
        p => { p.draft.selectedPaletteIds = ['hama']; },
        p => { p.draft.boardId = 'mini'; },
        p => { p.draft.boardWidth = 2; },
        p => { p.version = 2; },
    ]) {
        const changed = structuredClone(project);
        mutation(changed);
        assert.throws(() => validateOriginalPerlerProject(pattern, changed), /original Perler Midi/);
    }
});

test('keeps the complete twelve-pack inputs and supports read-only preflight', () => {
    const plan = parsePromotionOptions(['--promote-id', selectedId, '--check-only']);
    assert.equal(plan.inputs.length, 12);
    assert.match(plan.inputs.at(-1), /2026-10-09\/original-santa-hat-v1$/);
    assert.equal(plan.outputRoot, undefined);
    const explicit = parsePromotionOptions(['--promote-id', selectedId, '--check-only', '/private/library-v2', '/private/new-pack']);
    assert.deepEqual(explicit.inputs, ['/private/library-v2', '/private/new-pack']);
});

test('preserves all published catalog fields and order under the independent lock', () => {
    assert.doesNotThrow(() => assertPublishedCatalogPreserved(published, published.collections, promoted()));
    for (const mutate of [
        patterns => { patterns[0].description += ' changed'; },
        patterns => { patterns[0].assets.pdf = '/patterns/new-location.pdf'; },
        patterns => { patterns[0].notes.reverse(); },
        patterns => { patterns[0].source.url += '?changed'; },
        patterns => { patterns[0].updatedAt = '2026-10-09'; },
        patterns => { [patterns[0], patterns[1]] = [patterns[1], patterns[0]]; },
        patterns => { patterns.splice(0, 1); },
    ]) {
        const patterns = promoted();
        mutate(patterns);
        assert.throws(() => assertPublishedCatalogPreserved(published, published.collections, patterns), /106 catalog entries/);
    }
    const changedCollections = structuredClone(published.collections);
    changedCollections[0].description += ' changed';
    assert.throws(() => assertPublishedCatalogPreserved(published, changedCollections, promoted()), /106 catalog entries/);
    const changedBaseline = structuredClone(published);
    changedBaseline.patterns[0].description += ' changed';
    assert.throws(() => assertPublishedCatalogPreserved(changedBaseline, changedBaseline.collections, [...changedBaseline.patterns, addition]), /baseline changed/);
    assert.throws(() => assertPublishedCatalogPreserved(published, published.collections, [...promoted(), { ...addition, id: 'another-new-id' }]), /106 catalog entries/);
    assert.throws(() => assertPublishedCatalogPreserved(published, published.collections, [...promoted(), addition]), /exactly the one selected/);
});

test('selects only the new PDF while retaining its original manifest page index', () => {
    const source = { patterns: [
        { id: 'original-snowman', title: 'Snowman', beads: 351 },
        { id: 'original-gingerbread-man', title: 'Gingerbread Man', beads: 385 },
        { id: selectedId, title: 'Santa Hat', beads: 200 },
    ] };
    assert.deepEqual(selectedPdfPages(source), [{ id: selectedId, title: 'Santa Hat', beads: 200, index: 2 }]);
    assert.deepEqual(selectedPdfPages({ patterns: source.patterns.slice(0, 2) }), []);
});

test('exclusive copies and generated text never overwrite an existing destination', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'fusebead-promotion-test-'));
    try {
        const staging = path.join(directory, 'staging');
        await createPromotionOutputRoot(staging);
        await assert.rejects(createPromotionOutputRoot(staging), { code: 'EEXIST' });
        const source = path.join(directory, 'source.txt');
        const destination = path.join(directory, 'nested', 'destination.txt');
        await writeFile(source, 'reviewed new bytes');
        await copyExclusive(source, destination);
        assert.equal(await readFile(destination, 'utf8'), 'reviewed new bytes');
        await writeFile(source, 'changed candidate');
        await assert.rejects(copyExclusive(source, destination), { code: 'EEXIST' });
        await assert.rejects(writeExclusive(destination, 'changed generated text'), { code: 'EEXIST' });
        assert.equal(await readFile(destination, 'utf8'), 'reviewed new bytes');
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

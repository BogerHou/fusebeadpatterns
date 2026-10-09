import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    assertPublishedCatalogPreserved,
    assertRecordedPromotionPreserved,
    assertWinterPackPdfReady,
    assembleWinterPromotion,
    copyExclusive,
    createPromotionOutputRoot,
    main,
    parsePromotionOptions,
    parsePublishedCatalog,
    publishedCatalogBaseline,
    selectedPdfPages,
    selectedPromotionEntries,
    stageSelectedAssets,
    validateOriginalPerlerProject,
    validateWinterOriginalPerlerProject,
    winterPublishedCatalogBaseline,
    writeExclusive,
} from './build-pattern-library.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const current = parsePublishedCatalog(await readFile(path.join(root, 'src/lib/patterns/catalog.ts'), 'utf8'));
const winterPublished = winterPublishedCatalogBaseline(current);
const published = publishedCatalogBaseline(winterPublished);
const selectedId = 'original-santa-hat';
const addition = { ...structuredClone(published.patterns.at(-1)), id: selectedId, slug: 'santa-hat', title: 'Santa Hat', version: 'Original Santa hat design v1' };
const promoted = () => [...structuredClone(published.patterns), structuredClone(addition)];
const winterIds = ['original-christmas-stocking', 'original-snowflake'];
const winterPatterns = winterIds.map((id, index) => ({
    ...structuredClone(winterPublished.patterns.at(-1)), id,
    slug: index === 0 ? 'christmas-stocking' : 'snowflake',
    title: index === 0 ? 'Christmas Stocking' : 'Snowflake',
    version: index === 0 ? 'Original Christmas stocking design v1' : 'Original six-branch snowflake design v1',
    assets: Object.fromEntries(Object.entries(winterPublished.patterns.at(-1).assets).map(([key, value]) => [key, value.replace(selectedId, id)])),
}));
const reconstructedWinter = () => [...structuredClone(winterPublished.patterns), ...structuredClone(winterPatterns)];

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

test('winter selection supports one or both new IDs with all thirteen inputs', async () => {
    const single = parsePromotionOptions(['--promote-id', winterIds[0], '--check-only']);
    assert.deepEqual(single.ids, [winterIds[0]]);
    assert.equal(single.inputs.length, 13);
    assert.match(single.inputs.at(-1), /2026-10-09\/original-winter-v1$/);
    const both = parsePromotionOptions(['--promote-id', winterIds[1], '--promote-id', winterIds[0], '--output-root', '/tmp/unused-winter-staging']);
    assert.deepEqual(both.ids, winterIds);
    assert.equal(both.winter, true);
    assert.equal(both.id, undefined);
    await assert.rejects(main(['--promote-id', winterIds[0], '--check-only', '/private/new-only']), /all 13 sourcepack/);
    assert.throws(() => parsePromotionOptions(['--promote-id', winterIds[0], '--promote-id', winterIds[0], '--check-only']), /Duplicate/);
    assert.throws(() => parsePromotionOptions(['--promote-id', winterIds[0], '--promote-id', selectedId, '--check-only']), /cannot be mixed/);
});

test('the separate d80 lock freezes all 107 objects, collections and JSON field order', () => {
    assert.equal(winterPublished.patterns.length, 107);
    assert.equal(winterPublished.patterns.at(-1).assets.pdfLetter, '/patterns/original-santa-hat/pattern-letter.pdf');
    for (const mutation of [
        catalog => { catalog.patterns.at(-1).assets.pdfLetter = '/replacement.pdf'; },
        catalog => { catalog.patterns[0].description += ' changed'; },
        catalog => { catalog.patterns[0].assets.pdf = '/replacement-old.pdf'; },
        catalog => { [catalog.patterns[0], catalog.patterns[1]] = [catalog.patterns[1], catalog.patterns[0]]; },
        catalog => { const entry = catalog.patterns.at(-1); const { id, ...rest } = entry; catalog.patterns[catalog.patterns.length - 1] = { ...rest, id }; },
        catalog => { catalog.collections[0].description += ' changed'; },
        catalog => { catalog.patterns.pop(); },
        catalog => { catalog.patterns.push({ ...winterPatterns[0], id: 'unreviewed-winter' }); },
    ]) {
        const changed = structuredClone(winterPublished);
        mutation(changed);
        assert.throws(() => winterPublishedCatalogBaseline(changed), /107 catalog (baseline changed|plus at most)/);
    }
    assert.throws(() => winterPublishedCatalogBaseline({ ...winterPublished, patterns: [...winterPublished.patterns, winterPatterns[0], winterPatterns[0]] }), /at most one entry/);
});

test('single and dual winter promotion preserve 107 and allow later single-ID increments', () => {
    const reconstructed = reconstructedWinter();
    const stocking = assembleWinterPromotion(winterPublished, winterPublished.collections, reconstructed, [winterIds[0]]);
    assert.deepEqual(stocking, [...winterPublished.patterns, winterPatterns[0]]);
    const recorded = { collections: winterPublished.collections, patterns: stocking };
    assert.deepEqual(winterPublishedCatalogBaseline(recorded), winterPublished);
    const incremental = assembleWinterPromotion(recorded, winterPublished.collections, reconstructed, [winterIds[1]]);
    assert.deepEqual(incremental, reconstructed);
    assert.deepEqual(assembleWinterPromotion(winterPublished, winterPublished.collections, reconstructed, winterIds), reconstructed);
    assert.deepEqual(assembleWinterPromotion({ ...recorded, patterns: incremental }, winterPublished.collections, reconstructed, [winterIds[1]]), incremental);
    const snowflakeFirst = assembleWinterPromotion(winterPublished, winterPublished.collections, reconstructed, [winterIds[1]]);
    assert.deepEqual(assembleWinterPromotion({ ...recorded, patterns: snowflakeFirst }, winterPublished.collections, reconstructed, [winterIds[0]]), [...snowflakeFirst, winterPatterns[0]]);
});

test('recorded winter entries cannot be stripped to conceal changed source or PDF URLs', () => {
    const recorded = { collections: winterPublished.collections, patterns: [...winterPublished.patterns, winterPatterns[0]] };
    for (const mutation of [
        entries => { entries.at(-2).assets.pdf = '/changed-stocking.pdf'; },
        entries => { entries.at(-2).description += ' changed stocking'; },
        entries => { const entry = entries.at(-2); const { id, ...rest } = entry; entries[entries.length - 2] = { ...rest, id }; },
        entries => { entries[0].notes.reverse(); },
    ]) {
        const changed = reconstructedWinter();
        mutation(changed);
        assert.throws(() => assembleWinterPromotion(recorded, winterPublished.collections, changed, [winterIds[1]]), /every recorded winter entry/);
    }
    const changedCollections = structuredClone(winterPublished.collections);
    changedCollections[0].title += ' changed';
    assert.throws(() => assembleWinterPromotion(recorded, changedCollections, reconstructedWinter(), [winterIds[1]]), /complete published collections/);
    assert.throws(() => assembleWinterPromotion(recorded, winterPublished.collections, reconstructedWinter().slice(0, -1), [winterIds[1]]), /Missing selected winter/);
    assert.throws(() => assembleWinterPromotion(recorded, winterPublished.collections, reconstructedWinter(), [selectedId]), /reviewed winter IDs/);
});

test('winter PDF selection retains source indices and never selects a published pack', () => {
    const source = { patterns: [{ id: selectedId, title: 'Santa Hat', beads: 332 }, ...winterPatterns] };
    assert.deepEqual(selectedPdfPages(source, [winterIds[1]]), [{ id: winterIds[1], title: 'Snowflake', beads: winterPatterns[1].beads, index: 2, detailUrl: 'https://fusebeadpatterns.art/patterns/snowflake' }]);
    assert.deepEqual(selectedPdfPages(source, winterIds).map(({ index }) => index), [1, 2]);
    assert.deepEqual(selectedPdfPages({ patterns: winterPublished.patterns }, winterIds), []);
});

test('staging copies only selected resources, even when old and unselected sources are inaccessible', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'fusebead-winter-assets-test-'));
    try {
        const input = path.join(directory, 'selected-source');
        const id = winterIds[1];
        for (const file of [`previews/${id}.png`, `charts/${id}.png`, `charts/${id}.svg`, `pixels/${id}.png`, `projects/${id}.bead-pattern.json`]) {
            await mkdir(path.dirname(path.join(input, file)), { recursive: true });
            await writeFile(path.join(input, file), `reviewed fixture ${file}`);
        }
        const entries = [...winterPublished.patterns, ...winterPatterns].map(pattern => ({ pattern, input: pattern.id === id ? input : path.join(directory, 'inaccessible-old-source') }));
        assert.deepEqual(selectedPromotionEntries(entries, [id]).map(({ pattern }) => pattern.id), [id]);
        assert.throws(() => selectedPromotionEntries(entries, ['original-snowman']), /Only explicitly reviewed additions/);
        const staging = path.join(directory, 'staging');
        await createPromotionOutputRoot(staging);
        await stageSelectedAssets(entries, [id], staging);
        assert.deepEqual(await readdir(path.join(staging, 'public/patterns')), [id]);
        assert.deepEqual((await readdir(path.join(staging, 'public/patterns', id))).sort(), ['grid.png', 'grid.svg', 'pattern.bead-pattern.json', 'pixels.png', 'preview.png']);
        assert.equal(await readFile(path.join(staging, 'public/patterns', id, 'pixels.png'), 'utf8'), `reviewed fixture pixels/${id}.png`);
        await assert.rejects(stageSelectedAssets(entries, [id], staging), { code: 'EEXIST' });
        await assert.rejects(access(path.join(staging, 'public/patterns', winterIds[0])), { code: 'ENOENT' });
        const occupied = path.join(directory, 'occupied');
        await mkdir(occupied);
        await writeFile(path.join(occupied, 'unrelated.txt'), 'must remain');
        await assert.rejects(createPromotionOutputRoot(occupied), { code: 'EEXIST' });
        const link = path.join(directory, 'staging-link');
        await symlink(occupied, link);
        await assert.rejects(createPromotionOutputRoot(link), { code: 'EEXIST' });
        assert.equal(await readFile(path.join(occupied, 'unrelated.txt'), 'utf8'), 'must remain');
    } finally { await rm(directory, { recursive: true, force: true }); }
});

test('winter pending or missing PDFs block preflight without manufacturing PDF approval', async () => {
    await assert.rejects(assertWinterPackPdfReady('/unread-pending-pack', { state: 'private-original-grid-candidate-pdf-pending', pendingPdfFiles: ['reference-pattern-library.pdf'] }), /pending review; check-only is not approval/);
    await assert.rejects(assertWinterPackPdfReady('/unread-pending-pack', { state: 'private-reviewed-original-sourcepack', pendingPdfFiles: ['reference-pattern-library.pdf'] }), /promotion is blocked/);
    await assert.rejects(assertWinterPackPdfReady('/unread-pending-pack', { state: 'private-reviewed-original-sourcepack', pendingPdfFiles: [] }), /no reviewed PDF record/);
    const directory = await mkdtemp(path.join(os.tmpdir(), 'fusebead-winter-pdf-rejection-test-'));
    try {
        const source = { state: 'private-reviewed-original-sourcepack', pendingPdfFiles: [], reviewedPdfFiles: ['reference-pattern-library.pdf', 'reference-pattern-library-us-letter.pdf'] };
        await assert.rejects(assertWinterPackPdfReady(directory, source), /Missing reviewed winter PDF/);
        await writeFile(path.join(directory, 'reference-pattern-library.pdf'), 'not a PDF');
        await assert.rejects(assertWinterPackPdfReady(directory, source), /Invalid reviewed winter PDF/);
    } finally { await rm(directory, { recursive: true, force: true }); }
});

function winterProjectFixture() {
    const colour = { ref: '80-19001', name: 'White', rgb: [234, 239, 238], hex: '#eaefee', symbol: 'W', count: 2 };
    const rows = Array(29).fill('.'.repeat(29));
    rows[14] = '.'.repeat(14) + 'WW' + '.'.repeat(13);
    const pixels = Buffer.alloc(29 * 29 * 4);
    pixels.set([...colour.rgb, 255, ...colour.rgb, 255], (14 * 29 + 14) * 4);
    const pattern = { id: winterIds[0], kind: 'original', title: 'Christmas Stocking', slug: 'christmas-stocking', version: 'Original Christmas stocking design v1', source: null, width: 29, height: 29, rows, palette: { W: colour }, colorCount: 1, beads: 2, bounds: { x: 14, y: 14, width: 2, height: 1 }, components: 1, requiresBacking: false, weakBridges: [] };
    const project = { type: 'bead-pattern-project-v1', version: 1, draft: { version: 1, selectedPaletteIds: ['perler'], boardId: 'midi', boardWidth: 1, boardHeight: 1, sourceMode: 'blank', imageSrc: null, fileName: pattern.id, pdfScaleMode: 'midi-5mm', editedPattern: { width: 29, height: 29, byteLength: pixels.length, data: pixels.toString('base64') }, activePalettes: [{ name: 'Perler Midi', entries: [{ name: colour.name, ref: colour.ref, symbol: 'W', prefix: 'P', enabled: true, color: { r: 234, g: 239, b: 238, a: 255 } }] }] } };
    return { pattern, project, perlerRows: [[colour.ref, colour.name, 'unused CSV symbol', ...colour.rgb]] };
}

test('winter original rows, Perler colours, material counts and native project pixels must agree', () => {
    const { pattern, project, perlerRows } = winterProjectFixture();
    assert.doesNotThrow(() => validateWinterOriginalPerlerProject(pattern, project, perlerRows));
    for (const mutation of [
        p => { p.title = 'Invented Snowflake'; },
        p => { p.source = { pageUrl: 'https://example.invalid' }; },
        p => { p.version = 'Original Christmas stocking design v2'; },
        p => { p.rows[14] = p.rows[14].replace('W', 'X'); },
        p => { p.palette.W.count = 3; },
        p => { p.palette.W.rgb[0] = 235; },
        p => { p.beads = 3; },
        p => { p.bounds.width = 3; },
        p => { p.width = 28; },
        p => { p.components = 2; },
        p => { p.requiresBacking = true; },
        p => { p.weakBridges = [{ row: 15, column: 15 }]; },
    ]) {
        const changed = structuredClone(pattern);
        mutation(changed);
        assert.throws(() => validateWinterOriginalPerlerProject(changed, project, perlerRows), /Winter|winter/);
    }
    for (const mutation of [
        p => { p.draft.selectedPaletteIds = ['hama']; },
        p => { p.draft.boardId = 'mini'; },
        p => { p.draft.boardWidth = 2; },
        p => { p.draft.sourceMode = 'image'; },
        p => { p.draft.activePalettes[0].entries[0].enabled = false; },
        p => { const pixels = Buffer.from(p.draft.editedPattern.data, 'base64'); pixels[0] = 1; p.draft.editedPattern.data = pixels.toString('base64'); },
    ]) {
        const changed = structuredClone(project);
        mutation(changed);
        assert.throws(() => validateWinterOriginalPerlerProject(pattern, changed, perlerRows), /Winter|winter/);
    }
});

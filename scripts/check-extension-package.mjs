import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

async function filesUnder(directory, relative = '') {
    const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
    return (await Promise.all(entries.map(entry => entry.isDirectory()
        ? filesUnder(directory, path.join(relative, entry.name))
        : path.join(relative, entry.name)))).flat();
}

/** This is a packaging gate, not a substitute for MV3 browser acceptance. */
export async function checkExtensionPackage(directory) {
    const json = async file => JSON.parse(await readFile(path.join(directory, file), 'utf8'));
    const manifest = await json('manifest.json');
    const info = await json('build-info.json');
    assert.equal(info.mode, 'store', 'Do not upload a development build; use npm run extension:store.');
    assert.equal(info.editorTransfer, true, 'The store build must include website editing.');
    assert.equal(info.version, manifest.version, 'Build metadata does not match the manifest.');
    assert.equal(manifest.manifest_version, 3);
    assert.deepEqual([...manifest.permissions].sort(), ['contextMenus', 'storage']);
    assert.equal(manifest.host_permissions, undefined, 'Image host access must remain optional.');
    assert.deepEqual([...manifest.optional_host_permissions].sort(), ['http://*/*', 'https://*/*']);
    assert.equal(manifest.content_security_policy.extension_pages, "script-src 'self'; object-src 'none'; base-uri 'none'");
    assert.equal(manifest.externally_connectable, undefined);
    assert.equal(manifest.background.service_worker, 'background.js');
    assert.deepEqual(manifest.content_scripts.map(script => script.matches).flat().sort(), [
        'https://fusebeadpatterns.art/de/editor*',
        'https://fusebeadpatterns.art/editor*',
        'https://fusebeadpatterns.art/fr/editor*',
        'https://fusebeadpatterns.art/ja/editor*',
    ]);
    const files = await filesUnder(directory);
    for (const required of ['studio.html', 'studio.js', 'studio.css', 'handoff.html', 'handoff.js',
        'background.js', 'website-bridge.js', 'quantize-worker.js', 'THIRD-PARTY-NOTICES.txt',
        ...[16, 32, 48, 128].map(size => `icons/icon-${size}.png`)]) {
        assert.ok(files.includes(required), `Missing packaged resource: ${required}`);
    }
    for (const file of files) {
        assert.ok(!file.endsWith('.map') && !/(^|\/)\.env(?:\.|$)/.test(file), `Unexpected package file: ${file}`);
        if (file.endsWith('.html')) {
            const html = await readFile(path.join(directory, file), 'utf8');
            for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
                assert.ok(!/^(?:[a-z][\w+.-]*:|\/\/)/i.test(src), `Non-local script in ${file}`);
                assert.ok(files.includes(src.replace(/^\.\//, '')), `Missing script ${src}`);
            }
        }
        if (file.endsWith('.js')) {
            const code = await readFile(path.join(directory, file), 'utf8');
            assert.ok(!code.includes('eval('), `eval found in ${file}`);
        }
    }
    const studio = await readFile(path.join(directory, 'studio.js'), 'utf8');
    assert.ok(studio.includes('create-handoff'), 'The compiled studio has no editor handoff.');
    return { version: manifest.version, mode: info.mode, editorTransfer: true, packagedFiles: files.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        console.log(JSON.stringify(await checkExtensionPackage(path.resolve(process.argv[2] || 'artifacts/bead-capture-store-package')), null, 2));
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

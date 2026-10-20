/**
 * Static brand assets for the website and extension. No request-time rendering.
 * The SVG is the only drawing source; Sharp is already locked with Next.js.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const brandSourcePath = path.join(root, 'public/brand/square-bead.svg');

export async function renderBrandIcon(size, format = 'png') {
    assert(Number.isInteger(size) && size >= 16 && size <= 1024, 'Invalid brand icon size');
    assert(['png', 'webp'].includes(format), 'Unsupported brand icon format');
    const image = sharp(await readFile(brandSourcePath), { density: 192 }).resize(size, size);
    return format === 'webp'
        ? image.webp({ lossless: true }).toBuffer()
        : image.png({ compressionLevel: 9 }).toBuffer();
}

async function buildBrandIcons(check) {
    const png = await renderBrandIcon(256);
    const webp = await renderBrandIcon(108, 'webp');
    const hash = createHash('sha256').update(webp).digest('hex').slice(0, 12);
    const headerLogo = `/brand/logo-108-${hash}.webp`;
    const files = new Map([
        ['src/app/icon.png', png],
        ['public/logo.png', png],
        [`public${headerLogo}`, webp],
        ['src/lib/brand-assets.json', Buffer.from(`${JSON.stringify({ headerLogo }, null, 2)}\n`)],
    ]);
    for (const [name, bytes] of files) {
        const file = path.join(root, name);
        if (check) {
            assert((await readFile(file)).equals(bytes), `${name} is stale; run npm run brand:build`);
        } else {
            await writeFile(file, bytes);
        }
    }
    // Hashed assets from earlier releases remain available to cached HTML.
    console.log(JSON.stringify({ check, headerLogo, source: 'public/brand/square-bead.svg', files: files.size }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    assert(process.argv.slice(2).every(arg => arg === '--check'), 'Usage: node scripts/build-brand-icons.mjs [--check]');
    await buildBrandIcons(process.argv.includes('--check'));
}

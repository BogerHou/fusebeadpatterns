// Reproduce the homepage illustration from the library's actual Perler cells.
// No image model, recoloring or guessed character outline is involved.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const input = new URL('../public/patterns/sdv-blue-chicken/pattern.bead-pattern.json', import.meta.url);
const output = new URL('../public/studio/', import.meta.url);
const project = JSON.parse(await readFile(input, 'utf8'));
const pattern = project.draft.editedPattern;
const bytes = Buffer.from(pattern.data, 'base64');
assert.equal(pattern.width, 29);
assert.equal(pattern.height, 29);
assert.equal(bytes.length, 29 * 29 * 4);
const cells = [];
for (let index = 0; index < 29 * 29; index++) {
    const [r, g, b, alpha] = bytes.subarray(index * 4, index * 4 + 4);
    if (alpha === 0) continue;
    assert.equal(alpha, 255, 'The source uses opaque beads');
    const x = index % 29;
    const y = Math.floor(index / 29);
    assert.ok(x >= 3 && x < 26 && y >= 3 && y < 26, 'The illustrated crop must contain every bead');
    cells.push({ x, y, hex: `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}` });
}
assert.equal(cells.length, 192);
const frame = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="3 3 23 23" width="580" height="580"><rect width="29" height="29" fill="#edf0e5"/>';
const pegs = '<defs><pattern id="peg" width="1" height="1" patternUnits="userSpaceOnUse"><circle cx=".5" cy=".5" r=".052" fill="#a3b09c"/></pattern></defs><rect width="29" height="29" fill="url(#peg)"/>';
await mkdir(output, { recursive: true });
for (const mode of ['beads', 'pixels']) {
    const shapes = cells.map(({ x, y, hex }) => mode === 'beads'
        ? `<circle cx="${x + .5}" cy="${y + .5}" r=".32" fill="none" stroke="${hex}" stroke-width=".31"/>`
        : `<path d="M${x} ${y}h1v1h-1z" fill="${hex}"/>`).join('');
    await writeFile(new URL(`blue-chicken-${mode}.svg`, output), `${frame}${mode === 'beads' ? pegs : ''}${shapes}</svg>\n`);
}
console.log('Generated two views of the same 192 cells and 8 source colors.');

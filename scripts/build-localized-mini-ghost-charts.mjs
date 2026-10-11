/** Native Mini Ghost counting charts around unchanged, locked grid pixels. Staging only. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = 'guides/mini-perler-beads/ghost-mini';
const fontRoot = path.join(repo, 'scripts/fonts/native-chart-labels');
const extraGlyphRoot = path.join(repo, 'scripts/fonts/native-mini-chart-labels');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
export const MINI_GRID_PIXEL_HEIGHT = 754;
export const MINI_RETAINED_HASHES = {
    'grid.png': 'be70be5deb535d7e70a911ad989d20481ed0d192916b36d594b49fcb94a7e8c9',
    'pattern-a4.pdf': '9206f6553e9169b26a823857125eacca622cbc208bdabed52d0aa6c387845606',
    'pattern-letter.pdf': 'efdcd6ff0d8eb0617aadc47e2cf6ab5456b3b614736236c3585e79ae08ce8b61',
    'pattern.bead-pattern.json': 'f38baec26ccb3c1269b95f7cd147bde23bbaba57dd58f85366da7e55438c8f80',
    'pixels.png': '4af587b2b5b2f14d78bc14bcddf6136f5c15c6b1be008d513bfe245dc99f597c',
    'preview.png': 'c61cefbe6b915eb2ec9faf4ebec0bb8eca3341031c25434371b0a12885599861',
    'de/pattern-a4.pdf': '435c7852d211f47ffff035bb7fd080f77e6fd167d70f08b8024704e2971a8418',
    'de/pattern-letter.pdf': 'b6eb61704dac3ffb298eb1dca40149f9e4f408d21b2152ec9d6722376aed45bf',
    'fr/pattern-a4.pdf': '5b082eec64ecf869f3bc65e9deb19ad7147c566efa063f4dbf3747df75bf31a3',
    'fr/pattern-letter.pdf': 'de2e334af71aa93104c6ff1a0343ee732383416bfac52718d764f0029af14532',
    'ja/pattern-a4.pdf': 'fcfa960f84a7babca52552559d0aed5125d63f2771f1f6e90c93b75bd84ea3de',
    'ja/pattern-letter.pdf': 'b57ee2809a1c8d689b7b78227e2c0998d49c2f757add8bf3a08c49f7e60267b9',
};

export const miniGhostChartCopy = {
    de: {
        title: 'Geist - Perler Mini: 311 Perlen / 2 Farben',
        crop: 'Leseraster 29 x 29; im bearbeitbaren Mini-Projekt mit 57 x 57 Feldern zentriert.',
        empty: 'Leere Felder bleiben ohne Perle. W-Felder brauchen White-Perlen.',
        materials: ['W: White / 293 Perlen', 'B: Black / 18 Perlen'],
        size: '2,6 mm bezeichnet die Perlengröße von Perler Mini, nicht den Rasterabstand dieser PNG.',
        board: 'Verwende eine passende Mini-Steckplatte und zähle die Zeilen und Spalten.',
        limits: 'Nur eine Zählvorlage, kein Ausdruck in Originalgröße. Die Mini-Version wurde nicht gebaut oder bügelgetestet. Bildschirmfarben sind Näherungen.',
    },
    fr: {
        title: 'Fantôme - Perler Mini : 311 perles / 2 couleurs',
        crop: 'Grille de lecture de 29 x 29 cases, centrée dans le projet Mini modifiable de 57 x 57 cases.',
        empty: 'Les cases vides restent sans perle. Les cases W demandent des perles White.',
        materials: ['W: White / 293 perles', 'B: Black / 18 perles'],
        size: '2,6 mm désigne la taille des perles Perler Mini, pas l’espacement de cette grille PNG.',
        board: 'Utilisez une plaque adaptée aux perles Mini et comptez les lignes et colonnes.',
        limits: 'Grille de référence, pas un gabarit à taille réelle. Cette version Mini n’a pas été assemblée ni testée au fer. Les couleurs à l’écran sont indicatives.',
    },
    ja: {
        title: 'ゴースト - Perler Mini：311個・2色',
        crop: '29 x 29マスの読み取り用図案です。57 x 57マスのMiniプロジェクトでは、左に14列、上に14行の空白を置きます。',
        empty: '空白のマスにはビーズを置きません。WのマスにはWhiteのビーズを置きます。',
        materials: ['W: White / 293個', 'B: Black / 18個'],
        size: '2.6 mmはPerler Miniのビーズのサイズです。このPNGのマス間隔の実寸ではありません。',
        board: 'Miniビーズに合うプレートを使い、行と列を数えてください。',
        limits: '参考図案です。実寸の配置用型紙ではありません。Mini版の実物の制作・アイロン仕上げは未検証です。画面の色は目安です。',
    },
};

export function miniGhostLabels(locale) {
    const copy = miniGhostChartCopy[locale];
    assert.ok(copy, `Unknown Mini chart language ${locale}`);
    return [
        { text: copy.title, size: 20, role: 'title' },
        { text: copy.crop, size: 15, role: 'reading-crop' },
        { text: copy.empty, size: 15, role: 'empty-cells' },
        ...copy.materials.map(text => ({ text, size: 15, role: 'material' })),
        { text: copy.size, size: 14, role: 'bead-size' },
        { text: copy.board, size: 14, role: 'board' },
        { text: copy.limits, size: 14, role: 'limitations' },
    ];
}

function characters() {
    return [...new Set(Object.keys(miniGhostChartCopy).flatMap(locale => miniGhostLabels(locale).map(label => label.text)).join(''))].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');
}

function baseFont() {
    const lock = JSON.parse(fs.readFileSync(path.join(fontRoot, 'source.json'), 'utf8'));
    assert.equal(sha(fs.readFileSync(path.join(fontRoot, 'glyphs.json'))), lock.glyphsSha256);
    assert.equal(sha(fs.readFileSync(path.join(fontRoot, 'FuseBeadNativeChartLabels-Regular.ttf'))), lock.subsetSha256);
    assert.equal(sha(fs.readFileSync(path.join(fontRoot, 'OFL.txt'))), lock.licenseSha256);
    const font = JSON.parse(fs.readFileSync(path.join(fontRoot, 'glyphs.json'), 'utf8'));
    return { ...font, lock };
}

// Extract only missing outlines from already licensed, separately named fonts.
// This never downloads or writes a TTF, PDF or any existing font inventory.
const GLYPH_PYTHON = String.raw`
import json,sys
from pathlib import Path
from hashlib import sha256
from fontTools import __version__
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
d=json.load(sys.stdin);out=Path(d['output']);root=Path(d['repo']);assert __version__=='4.60.1';assert not out.exists()
fonts=[]
for item in d['fonts']:
 path=root/item['path'];assert sha256(path.read_bytes()).hexdigest()==item['sha256'];font=TTFont(path);assert font['head'].unitsPerEm==d['unitsPerEm'];assert font['OS/2'].usWeightClass==400
 fonts.append((item,font,font.getBestCmap(),font.getGlyphSet()))
glyphs={};used={}
for c in d['characters']:
 for item,font,cmap,glyphset in fonts:
  if ord(c) not in cmap:continue
  name=cmap[ord(c)];glyph=glyphset[name];pen=SVGPathPen(glyphset);glyph.draw(pen);bounds=BoundsPen(glyphset);glyph.draw(bounds)
  glyphs[c]={'advance':font['hmtx'].metrics[name][0],'bounds':bounds.bounds,'path':pen.getCommands()};used[c]=item['path'];break
 else:raise ValueError('No existing approved font contains '+c)
data=(json.dumps({'unitsPerEm':d['unitsPerEm'],'glyphs':glyphs},ensure_ascii=False,indent=2)+'\n').encode()
lock={'purpose':'Missing DE/FR/JA Mini Ghost counting-chart outlines from existing approved fonts; no new font','fonttoolsVersion':__version__,'glyphsSha256':sha256(data).hexdigest(),'characters':d['characters'],'fonts':d['fonts'],'glyphSources':used}
out.mkdir();(out/'glyphs.json').write_bytes(data);(out/'source.json').write_text(json.dumps(lock,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'outlines':len(glyphs),'glyphsSha256':lock['glyphsSha256']}))
`;

function buildExtraGlyphs(python) {
    assert.ok(python, 'Pass an explicit Python with fontTools 4.60.1');
    const base = baseFont(), missing = [...characters()].filter(char => !base.glyphs[char]).join('');
    const miniLock = JSON.parse(fs.readFileSync(path.join(repo, 'scripts/fonts/mini-ghost-jp/source.json'), 'utf8'));
    const calibrationLock = JSON.parse(fs.readFileSync(path.join(repo, 'scripts/fonts/calibration/source.json'), 'utf8'));
    const photoLock = JSON.parse(fs.readFileSync(path.join(repo, 'scripts/fonts/photo-guide-jp/source.json'), 'utf8'));
    const fonts = [
        { path: 'scripts/fonts/mini-ghost-jp/FuseBeadMiniGhostJapanese-Regular.ttf', sha256: miniLock.subsetSha256, licensePath: 'scripts/fonts/mini-ghost-jp/OFL.txt', licenseSha256: miniLock.licenseSha256 },
        { path: 'scripts/fonts/calibration/FuseBeadCalibration-Regular.ttf', sha256: calibrationLock.subsetSha256.Regular, licensePath: 'scripts/fonts/calibration/OFL.txt', licenseSha256: calibrationLock.licenseSha256 },
        { path: 'scripts/fonts/photo-guide-jp/FuseBeadGuideJapanese-Regular.ttf', sha256: photoLock.subsetSha256, licensePath: 'scripts/fonts/photo-guide-jp/OFL.txt', licenseSha256: photoLock.licenseSha256 },
    ];
    for (const font of fonts) assert.equal(sha(fs.readFileSync(path.join(repo, font.licensePath))), font.licenseSha256);
    const child = spawnSync(python, ['-c', GLYPH_PYTHON], { input: json({ repo, output: extraGlyphRoot, unitsPerEm: base.unitsPerEm, characters: missing, fonts }), encoding: 'utf8', maxBuffer: 2e6 });
    assert.equal(child.status, 0, child.stderr || child.stdout);
    return child.stdout.trim();
}

function loadFont() {
    const base = baseFont();
    const lock = JSON.parse(fs.readFileSync(path.join(extraGlyphRoot, 'source.json'), 'utf8'));
    assert.equal(lock.fonttoolsVersion, '4.60.1');
    assert.equal(sha(fs.readFileSync(path.join(extraGlyphRoot, 'glyphs.json'))), lock.glyphsSha256);
    for (const font of lock.fonts) {
        assert.equal(sha(fs.readFileSync(path.join(repo, font.path))), font.sha256);
        assert.equal(sha(fs.readFileSync(path.join(repo, font.licensePath))), font.licenseSha256);
    }
    const extra = JSON.parse(fs.readFileSync(path.join(extraGlyphRoot, 'glyphs.json'), 'utf8'));
    assert.equal(extra.unitsPerEm, base.unitsPerEm);
    const missing = [...characters()].filter(char => !base.glyphs[char]);
    assert.deepEqual(Object.keys(extra.glyphs).sort(), missing.sort(), 'Changed labels require a separately reviewed outline inventory');
    return { ...base, glyphs: { ...base.glyphs, ...extra.glyphs }, extraLock: lock };
}

async function source() {
    const folder = path.join(repo, 'public', assetRoot);
    for (const [name, hash] of Object.entries(MINI_RETAINED_HASHES)) assert.equal(sha(fs.readFileSync(path.join(folder, name))), hash, `Existing Mini resource changed: ${name}`);
    const model = JSON.parse(fs.readFileSync(path.join(folder, 'pattern.bead-pattern.json'), 'utf8'));
    assert.equal(model.type, 'bead-pattern-project-v1');
    assert.equal(model.version, 1);
    const draft = model.draft;
    assert.deepEqual(draft.selectedPaletteIds, ['perler_mini']);
    assert.equal(draft.boardId, 'mini');
    assert.equal(draft.boardWidth, 1); assert.equal(draft.boardHeight, 1);
    assert.equal(draft.pdfScaleMode, 'fit-page');
    assert.equal(draft.editedPattern.width, 57); assert.equal(draft.editedPattern.height, 57);
    const padded = Buffer.from(draft.editedPattern.data, 'base64');
    assert.equal(padded.length, 57 * 57 * 4);
    const miniPixels = await sharp(path.join(folder, 'pixels.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(miniPixels.info.width, 57); assert.equal(miniPixels.info.height, 57);
    assert.ok(miniPixels.data.equals(padded), 'Mini native-size PNG differs from its actual project');
    const pixels = await sharp(path.join(repo, 'public/patterns/original-friendly-ghost/pixels.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(pixels.info.width, 29); assert.equal(pixels.info.height, 29);
    assert.equal(sha(pixels.data), 'fefb58a1c8222731a99982e6ce35ca709c79f47ba5d2fd068174075ae49c85a0');
    const colors = { W: { name: 'White', ref: 'PM-WHITE', rgb: [234, 239, 238], count: 293 }, B: { name: 'Black', ref: 'PM-BLACK', rgb: [50, 50, 52], count: 18 } };
    assert.equal(draft.activePalettes.length, 1);
    assert.equal(draft.activePalettes[0].name, 'Perler Mini');
    assert.equal(draft.activePalettes[0].entries.length, 2);
    for (const [symbol, color] of Object.entries(colors)) {
        const entry = draft.activePalettes[0].entries.find(value => value.symbol === symbol);
        assert.ok(entry); assert.equal(entry.name, color.name); assert.equal(entry.ref, color.ref); assert.equal(entry.enabled, true);
        assert.deepEqual([entry.color.r, entry.color.g, entry.color.b, entry.color.a], [...color.rgb, 255]);
    }
    const usage = { W: 0, B: 0, empty: 0 };
    for (let y = 0; y < 57; y++) for (let x = 0; x < 57; x++) {
        const inside = x >= 14 && x < 43 && y >= 14 && y < 43;
        const expected = inside ? pixels.data.subarray(((y - 14) * 29 + x - 14) * 4, ((y - 14) * 29 + x - 14 + 1) * 4) : Buffer.alloc(4);
        assert.ok(padded.subarray((y * 57 + x) * 4, (y * 57 + x + 1) * 4).equals(expected), '57 x 57 project padding changed');
    }
    const grid = await sharp(path.join(folder, 'grid.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(grid.info.width, 788); assert.equal(grid.info.height, 930);
    for (let y = 0; y < 29; y++) for (let x = 0; x < 29; x++) {
        const rgba = [...pixels.data.subarray((y * 29 + x) * 4, (y * 29 + x + 1) * 4)];
        const symbol = !rgba[3] ? 'empty' : Object.keys(colors).find(key => rgba.slice(0, 3).every((value, index) => value === colors[key].rgb[index]));
        assert.ok(symbol); usage[symbol]++;
        const offset = ((46 + y * 24 + 5) * 788 + 46 + x * 24 + 5) * 4;
        const expected = symbol === 'empty' ? [255, 255, 255, 255] : [...colors[symbol].rgb, 255];
        assert.deepEqual([...grid.data.subarray(offset, offset + 4)], expected, `English grid row ${y + 1}, column ${x + 1} differs from Mini pixels`);
    }
    assert.deepEqual(usage, { W: 293, B: 18, empty: 530 });
    return { grid, kept: grid.data.subarray(0, 788 * MINI_GRID_PIXEL_HEIGHT * 4), usage };
}

function widthOf(text, size, font) {
    return [...text].reduce((sum, char) => sum + font.glyphs[char].advance * size / font.unitsPerEm, 0);
}

function wrap(text, size, maximum, font) {
    const remaining = [...text], lines = [];
    while (remaining.length) {
        let count = 0, lastSpace = -1;
        while (count < remaining.length && widthOf(remaining.slice(0, count + 1).join(''), size, font) <= maximum) {
            if (remaining[count] === ' ') lastSpace = count;
            count++;
        }
        assert.ok(count, 'A glyph cannot fit in the Mini chart');
        if (count < remaining.length && lastSpace > count * .45) count = lastSpace;
        if (count < remaining.length && /[、。，．！？：；）］｝〉》」』】]/.test(remaining[count]) && count > 1) count--;
        if (count > 1 && /[（［｛〈《「『【]/.test(remaining[count - 1])) count--;
        lines.push(remaining.splice(0, count).join('').trim());
        while (remaining[0] === ' ') remaining.shift();
    }
    assert.equal(lines.join('').replaceAll(' ', ''), text.replaceAll(' ', ''), 'Wrapping dropped Mini chart text');
    return lines;
}

function footer(locale, font) {
    let cursor = 18;
    const lines = [];
    for (const label of miniGhostLabels(locale)) {
        for (const text of wrap(label.text, label.size, 696, font)) {
            const y = cursor + label.size * 1.25;
            lines.push({ text, role: label.role, size: label.size, x: 46, y });
            cursor += label.size * 1.65;
        }
        cursor += label.role === 'material' ? 3 : 7;
    }
    const height = Math.ceil(cursor + 20);
    const key = char => 'm' + char.codePointAt(0).toString(16);
    const used = [...new Set(lines.map(line => line.text).join(''))];
    const definitions = used.filter(char => font.glyphs[char].path).map(char => `<path id="${key(char)}" d="${font.glyphs[char].path}"/>`).join('');
    let uses = '';
    for (const line of lines) {
        let x = line.x;
        const scale = line.size / font.unitsPerEm;
        for (const char of line.text) {
            const glyph = font.glyphs[char];
            if (glyph.bounds) {
                const [left, bottom, right, top] = glyph.bounds;
                assert.ok(x + left * scale >= 0 && x + right * scale <= 788, 'Mini chart label crosses horizontal edge');
                assert.ok(line.y - top * scale >= 0 && line.y - bottom * scale <= height, 'Mini chart label crosses vertical edge');
                uses += `<use href="#${key(char)}" transform="translate(${x.toFixed(4)} ${line.y.toFixed(4)}) scale(${scale.toFixed(6)} -${scale.toFixed(6)})"/>`;
            }
            x += glyph.advance * scale;
        }
    }
    return { height, lines, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="788" height="${height}" xml:lang="${locale}"><rect width="100%" height="100%" fill="white"/><defs>${definitions}</defs><g fill="#26352d">${uses}</g></svg>` };
}

export async function buildNativeMiniChart(locale) {
    const font = loadFont();
    const missing = [...characters()].filter(char => !font.glyphs[char]);
    assert.equal(missing.join(''), '', `Missing frozen glyphs: ${missing.join('')}`);
    const old = await source(), native = footer(locale, font);
    const bottom = await sharp(Buffer.from(native.svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(bottom.info.width, 788); assert.equal(bottom.info.height, native.height);
    const rgba = Buffer.concat([old.kept, bottom.data]), height = MINI_GRID_PIXEL_HEIGHT + native.height;
    for (let offset = 3; offset < rgba.length; offset += 4) assert.equal(rgba[offset], 255, 'Mini chart alpha is not fully opaque');
    const png = await sharp(rgba, { raw: { width: 788, height, channels: 4 } }).removeAlpha().png({ compressionLevel: 9, adaptiveFiltering: false }).toBuffer();
    const decoded = await sharp(png).ensureAlpha().raw().toBuffer();
    assert.ok(decoded.equals(rgba), 'Lossless Mini PNG changed RGBA values');
    assert.ok(decoded.subarray(0, old.kept.length).equals(old.kept), 'Mini grid pixels changed');
    return { png, report: { locale, width: 788, height, preservedGridHeight: MINI_GRID_PIXEL_HEIGHT, preservedGridSha256: sha(old.kept), pngSha256: sha(png), materialCounts: old.usage, readingGrid: [29, 29], projectGrid: [57, 57], projectPadding: 14, labels: miniGhostLabels(locale), lines: native.lines, glyphsSha256: font.lock.glyphsSha256, extraGlyphsSha256: font.extraLock.glyphsSha256, allGridPixelsUnchanged: true, losslessRgbPixelsIdentical: true, noGlyphOverflow: true, actualSize: false, physicalAssemblyTested: false, ironingTested: false } };
}

async function main() {
    const values = process.argv.slice(2);
    if (values.length === 3 && values[0] === '--build-glyphs' && values[1] === '--python') {
        console.log(buildExtraGlyphs(values[2]));
        return;
    }
    if (values.length === 1 && values[0] === '--font-characters') {
        const font = fs.existsSync(extraGlyphRoot) ? loadFont() : baseFont(), chars = characters();
        console.log(json({ characters: chars, characterCount: [...chars].length, missingFromFrozenGlyphs: [...chars].filter(char => !font.glyphs[char]) }));
        return;
    }
    let output, checkOnly = false;
    for (let index = 0; index < values.length; index++) {
        if (values[index] === '--output') { assert.equal(output, undefined); output = values[++index]; assert.ok(output && !output.startsWith('--')); }
        else if (values[index] === '--check-only') { assert.equal(checkOnly, false); checkOnly = true; }
        else throw new Error(`Unknown option ${values[index]}`);
    }
    assert.ok(output, 'Pass an explicit task-staging --output directory');
    output = path.resolve(output);
    assert.equal(path.basename(output), 'localized-mini-charts');
    assert.ok(!output.split(path.sep).some(part => ['public', 'src'].includes(part)), 'Never write generated Mini charts to public or src');
    if (!checkOnly) assert.ok(!fs.existsSync(output), 'Refusing to replace an existing Mini chart candidate directory');
    const checks = [];
    for (const locale of Object.keys(miniGhostChartCopy)) {
        const result = await buildNativeMiniChart(locale);
        const folder = path.join(output, locale), pngPath = path.join(folder, 'grid.png');
        if (checkOnly) assert.equal(sha(fs.readFileSync(pngPath)), result.report.pngSha256, `Mini PNG bytes changed for ${locale}`);
        else { fs.mkdirSync(folder, { recursive: true }); fs.writeFileSync(pngPath, result.png, { flag: 'wx' }); }
        checks.push({ ...result.report, href: `/${assetRoot}/${locale}/grid.png` });
    }
    const report = { source: 'unchanged original Mini Ghost counting grid', charts: checks.length, retainedResources: MINI_RETAINED_HASHES, checks };
    const reportPath = path.join(output, 'mini-chart-checks.json');
    if (checkOnly) assert.deepEqual(JSON.parse(fs.readFileSync(reportPath, 'utf8')), report);
    else fs.writeFileSync(reportPath, json(report), { flag: 'wx' });
    console.log(json({ output, mode: checkOnly ? 'read-only-check' : 'staging-only', charts: checks.length, files: checks.map(check => ({ path: path.join(output, check.locale, 'grid.png'), width: check.width, height: check.height, sha256: check.pngSha256 })), report: reportPath }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

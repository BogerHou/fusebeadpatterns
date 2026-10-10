/** Native chart labels around unchanged legacy grid pixels; never writes public or src. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ts = require('typescript');
const LOCALES = ['de', 'fr', 'ja'];
const FONT_DIR = path.join(repo, 'scripts/fonts/native-chart-labels');
const FAMILY = 'Fuse Bead Native Chart Labels';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function args(values) {
    const out = {};
    for (let i = 0; i < values.length; i++) {
        const key = values[i];
        assert.ok(['--output', '--python', '--build-font', '--check-only', '--font-characters'].includes(key), `Unknown option ${key}`);
        assert.ok(!(key in out), `Duplicate option ${key}`);
        out[key] = ['--output', '--python'].includes(key) ? values[++i] : true;
        assert.ok(out[key], `Missing value for ${key}`);
    }
    if (!out['--font-characters']) {
        assert.ok(out['--output'], 'An explicit staging --output directory is required');
        out['--output'] = path.resolve(out['--output']);
        assert.equal(path.basename(out['--output']), 'generated-charts');
        assert.ok(!out['--output'].split(path.sep).includes('public'), 'Never generate directly in public');
        assert.ok(!out['--output'].split(path.sep).includes('src'), 'Never generate directly in src');
    }
    assert.ok(!(out['--build-font'] && out['--check-only']), 'Do not build fonts during read-only checks');
    return out;
}

function modules() {
    const cache = new Map();
    function load(file) {
        if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
        if (cache.has(file)) return cache.get(file);
        const item = { exports: {} };
        cache.set(file, item.exports);
        let source = fs.readFileSync(file, 'utf8');
        // Only read the existing literal copy; never execute a React component or add a public export.
        if (file.endsWith('CoasterInstructions.tsx')) source = source.split('export default function')[0] + '\nexport const chartCopy = copy;';
        const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
        const localRequire = name => {
            let target = name.startsWith('@/') ? path.resolve(repo, 'src', name.slice(2)) : path.resolve(path.dirname(file), name);
            if (!fs.existsSync(target)) target += '.ts';
            return load(target);
        };
        vm.runInNewContext(code, { module: item, exports: item.exports, require: localRequire }, { filename: file });
        return item.exports;
    }
    return {
        patterns: JSON.parse(JSON.stringify(load(path.join(repo, 'src/lib/patterns/catalog.ts')).patterns)),
        content: load(path.join(repo, 'src/lib/patterns/localized-content.ts')),
        ui: load(path.join(repo, 'src/lib/patterns/localized-ui.ts')).localizedPatternUi,
        sources: load(path.join(repo, 'src/lib/patterns/localized-sources.ts')),
        coaster: load(path.join(repo, 'src/components/patterns/CoasterInstructions.tsx')).chartCopy,
    };
}

const originalTail = {
    'original-soccer-ball': ['SOCCER BALL — 29 × 29 grid / 501 beads', 'K: Black 80-19018 (283)   W: White 80-19001 (218)   Empty cells: no bead', 'Original digital draft. Not physically assembled or iron-tested. PNG is not an actual-size print template.'],
    'original-retro-diamond-coaster': ['Retro Diamond Coaster - 517 beads / 3 colors', '23 x 23 motif on a 29 x 29 MIDI board. Empty cells: no bead.', 'G: Cheddar 80-19057 (217)', 'N: Midnight 80-15201 (216)', 'W: White 80-19001 (84)', 'Coaster use requires a cork backing; not physically assembled or tested.', 'Original digital grid. This PNG is not an actual-size placement template.'],
    'minecraft-creeper-face-v1': ['Creeper Face - 256 beads / 3 colors', '16 x 16 motif on a 29 x 29 MIDI board. Empty cells: no bead.', 'G: Green 80-19080 (136)', 'K: Black 80-19018 (80)', 'H: Kiwi Lime 80-19061 (40)', 'Unofficial Minecraft fan art by Fuse Bead Patterns. Character: Mojang/Microsoft.'],
};
const hangLimit = {
    de: 'Dieses Motiv wurde nicht auf das Aufhängen getestet. Prüfe die Befestigung vor der Verwendung.',
    fr: 'Ce motif n’a pas été testé pour être suspendu. Vérifiez la fixation avant utilisation.',
    ja: '吊り下げは検証していません。使用前に取り付け部分を確認してください。',
};
const dimensional = {
    de: p => `Motiv: ${p.motifWidth} × ${p.motifHeight} Perlen. Raster: ${p.gridWidth} × ${p.gridHeight}. Perler Midi.`,
    fr: p => `Motif : ${p.motifWidth} × ${p.motifHeight} perles. Grille : ${p.gridWidth} × ${p.gridHeight}. Perler Midi.`,
    ja: p => `図柄は横${p.motifWidth}×縦${p.motifHeight}マス、プレートは${p.gridWidth}×${p.gridHeight}マス。Perler Midiの配色です。`,
};
const originalSource = {
    de: 'Originales digitales Raster.',
    fr: 'Grille numérique originale.',
    ja: 'オリジナルのデジタル図案です。',
};

function legacy(pattern) {
    const pngPath = path.join(repo, 'public', pattern.assets.grid);
    const svgPath = pngPath.replace(/\.png$/, '.svg');
    const source = fs.readFileSync(svgPath, 'utf8');
    assert.ok(!source.includes('<image') && !source.includes('<script'), 'Unexpected external SVG content');
    const root = /^<svg\b[^>]*>/.exec(source)?.[0];
    assert.ok(root && source.endsWith('</svg>'));
    const width = Number(/\bwidth="(\d+)"/.exec(root)?.[1]);
    const height = Number(/\bheight="(\d+)"/.exec(root)?.[1]);
    const groups = [...source.matchAll(/<g\b[^>]*>[\s\S]*?<\/g>/g)];
    assert.ok(groups.every(g => !g[0].slice(2).includes('<g')), 'Nested legacy groups require review');
    const footer = groups.filter(g => [...g[0].matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].some(t => t[1].length > 3));
    assert.ok(footer.length <= 1, 'Unknown legacy explanatory groups');
    let drawing = source.slice(root.length, -6), gridHeight = height, tail = [];
    if (footer.length) {
        const group = footer[0];
        assert.equal(group.index + group[0].length, source.length - 6, 'Explanatory group must be the last legacy element');
        tail = [...group[0].matchAll(/<text\b([^>]*)>([^<]+)<\/text>/g)].map(t => t[2]);
        if (originalTail[pattern.id]) assert.deepEqual(tail, originalTail[pattern.id], 'Changed use/provenance copy needs review');
        else {
            assert.ok(['original-friendly-ghost', 'original-halloween-bat', 'original-christmas-tree', 'original-snowman', 'original-gingerbread-man', 'original-santa-hat', 'original-christmas-stocking', 'original-snowflake'].includes(pattern.id), 'Unknown annotated original chart');
            const standard = 'Original grid. Not physically assembled or iron-tested. PNG is not an actual-size template.';
            const hanging = 'Not physically assembled, iron-tested or hang-tested. PNG is not an actual-size template.';
            assert.equal(tail.at(-1), ['original-christmas-stocking', 'original-snowflake'].includes(pattern.id) ? hanging : standard, 'Changed legacy physical limitation');
            assert.ok(tail[0].includes(String(pattern.beads)) && tail[0].includes(String(pattern.colorCount)));
            assert.ok(tail[1].includes('Empty') && tail[1].includes(String(pattern.gridWidth)));
            assert.deepEqual(tail.slice(2, -1), pattern.palette.map(c => `${c.symbol}: ${c.name} ${c.ref} (${c.count})`), 'Legacy material table changed');
        }
        drawing = source.slice(root.length, group.index);
        const textTop = [...group[0].matchAll(/<text\b([^>]*)>/g)].map(t => Number(/\by="([\d.]+)"/.exec(t[1])?.[1]) - Number(/\bfont-size="([\d.]+)"/.exec(t[1])?.[1]));
        gridHeight = Math.floor(Math.min(...textTop) - 16);
        assert.ok(gridHeight > height * .7 && gridHeight < height);
    } else assert.equal(width, 586, 'A new unannotated template requires review');
    return { pngPath, svgPath, source, width, height, drawing, gridHeight, tail };
}

function labels(pattern, locale, data) {
    const ui = data.ui[locale];
    const name = data.content.getLocalizedPatternName(pattern, locale);
    const texts = [
        { text: name, size: 22, role: 'title' },
        { text: locale === 'ja' ? `ビーズ：${pattern.beads}個 · ${pattern.colorCount}色` : `${pattern.beads} ${locale === 'fr' ? ui.beads.toLocaleLowerCase(locale) : ui.beads} · ${pattern.colorCount} ${locale === 'fr' ? ui.colors.toLocaleLowerCase(locale) : ui.colors}`, size: 15, role: 'count' },
        { text: dimensional[locale](pattern), size: 14, role: 'dimensions' },
        { text: ui.materials + ' · Perler Midi', size: 15, role: 'materials' },
        ...pattern.palette.map(c => ({ text: `${c.symbol}: ${c.name} ${c.ref} (${c.count})`, size: 14, role: 'material' })),
        { text: ui.chartHelp.split(locale === 'de' ? ' Klicke' : locale === 'fr' ? ' Cliquez' : '図案を押す')[0], size: 14, role: 'blank' },
        { text: ui.colorHelp, size: 14, role: 'color' },
        { text: ui.print, size: 14, role: 'print' },
        ...pattern.notes.filter(n => !n.startsWith('Use one ') && !n.startsWith('Print the PDF ')).map(n => ({ text: data.content.localizePatternNote(n, locale), size: 14, role: 'assembly' })),
    ];
    if (pattern.id.startsWith('original-')) texts.push({ text: originalSource[locale], size: 14, role: 'original-source' });
    if (['original-christmas-stocking', 'original-snowflake'].includes(pattern.id)) texts.push({ text: hangLimit[locale], size: 14, role: 'hanging' });
    if (pattern.id === 'original-retro-diamond-coaster') {
        texts.push({ text: data.coaster[locale].heading, size: 15, role: 'backing' });
        texts.push({ text: data.coaster[locale].limits, size: 14, role: 'coaster-limit' });
    }
    if (pattern.id === 'minecraft-creeper-face-v1') texts.push({ text: data.sources.localizePatternSourceDescription(pattern.source.description, locale), size: 14, role: 'attribution' });
    assert.ok(texts.every(t => t.text && !/undefined|\[object Object\]/.test(t.text)));
    return texts;
}

function characters(jobs) {
    return [...new Set(jobs.flatMap(job => job.labels.map(label => label.text)).join(''))].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');
}

const FONT_PYTHON = String.raw`
import io,json,sys,urllib.request
from pathlib import Path
from hashlib import sha256
from fontTools import subset,__version__
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
d=json.load(sys.stdin);out=Path(d['output']);chars=d['characters'];source=d['source']
assert __version__=='4.60.1'
assert not out.exists(),'Refusing to replace existing native chart font'
original=urllib.request.urlopen(source['fontUrl'],timeout=60).read()
license=urllib.request.urlopen(source['licenseUrl'],timeout=30).read()
hash=lambda b:sha256(b).hexdigest()
assert hash(original)==source['fontSha256'] and hash(license)==source['licenseSha256']
font=TTFont(io.BytesIO(original),recalcTimestamp=False)
instantiateVariableFont(font,{'wght':400},inplace=True)
opts=subset.Options();opts.name_IDs=['*'];opts.name_legacy=True;opts.name_languages=['*'];opts.recalc_timestamp=False
sub=subset.Subsetter(options=opts);sub.populate(text=chars);sub.subset(font)
family=d['family'];names={1:family,2:'Regular',3:'FuseBeadNativeChartLabels-Regular-1',4:family+' Regular',6:'FuseBeadNativeChartLabels-Regular',16:family,17:'Regular'}
for name in font['name'].names:
 if name.nameID in names:name.string=names[name.nameID].encode(name.getEncoding())
cmap=font.getBestCmap();assert all(ord(c) in cmap for c in chars),'Missing native chart glyph'
glyphset=font.getGlyphSet();glyphs={}
for c in chars:
 name=cmap[ord(c)];glyph=glyphset[name];pen=SVGPathPen(glyphset);glyph.draw(pen);bounds=BoundsPen(glyphset);glyph.draw(bounds)
 glyphs[c]={'advance':font['hmtx'].metrics[name][0],'bounds':bounds.bounds,'path':pen.getCommands()}
glyphBytes=(json.dumps({'unitsPerEm':font['head'].unitsPerEm,'glyphs':glyphs},ensure_ascii=False,indent=2)+'\n').encode()
buffer=io.BytesIO();font.save(buffer);fontBytes=buffer.getvalue()
lock={**source,'derivativeFamily':family,'weight':400,'fonttoolsVersion':__version__,'subsetPurpose':'Native DE/FR/JA chart labels, current names, official color names and assembly/print limitations','subsetSha256':hash(fontBytes),'glyphsSha256':hash(glyphBytes),'charactersSha256':hash(chars.encode()),'characterCount':len(chars),'catalogCount':d['count']}
out.mkdir();(out/'FuseBeadNativeChartLabels-Regular.ttf').write_bytes(fontBytes);(out/'glyphs.json').write_bytes(glyphBytes);(out/'OFL.txt').write_bytes(license);(out/'source.json').write_text(json.dumps(lock,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'fontSha256':lock['subsetSha256'],'glyphsSha256':lock['glyphsSha256'],'characters':len(chars)}))
`;

function fontFor(chars, options, count) {
    if (options['--build-font']) {
        assert.ok(options['--python'], 'Rebuilding the new font requires an explicit Python with fontTools 4.60.1');
        const pinned = JSON.parse(fs.readFileSync(path.join(repo, 'scripts/fonts/localized-library-jp/source.json'), 'utf8'));
        const keys = ['repository', 'revision', 'fontUrl', 'fontSha256', 'licenseUrl', 'licenseSha256', 'license'];
        const source = Object.fromEntries(keys.map(key => [key, pinned[key]]));
        const child = spawnSync(options['--python'], ['-c', FONT_PYTHON], { input: json({ output: FONT_DIR, family: FAMILY, source, characters: chars, count }), encoding: 'utf8', maxBuffer: 4e6 });
        assert.equal(child.status, 0, child.stderr || child.stdout);
    }
    const lock = JSON.parse(fs.readFileSync(path.join(FONT_DIR, 'source.json'), 'utf8'));
    assert.equal(lock.derivativeFamily, FAMILY);
    assert.equal(lock.fonttoolsVersion, '4.60.1');
    assert.equal(sha(fs.readFileSync(path.join(FONT_DIR, 'FuseBeadNativeChartLabels-Regular.ttf'))), lock.subsetSha256);
    assert.equal(sha(fs.readFileSync(path.join(FONT_DIR, 'OFL.txt'))), lock.licenseSha256);
    assert.equal(sha(fs.readFileSync(path.join(FONT_DIR, 'glyphs.json'))), lock.glyphsSha256);
    assert.equal(sha(chars), lock.charactersSha256, 'Changed chart text requires a separately reviewed font inventory');
    const font = JSON.parse(fs.readFileSync(path.join(FONT_DIR, 'glyphs.json'), 'utf8'));
    assert.ok([...chars].every(char => font.glyphs[char]), 'Missing glyph definition');
    return { ...font, lock };
}

function widthOf(text, size, font) {
    return [...text].reduce((sum, char) => sum + font.glyphs[char].advance * size / font.unitsPerEm, 0);
}

function wrap(text, size, max, font) {
    const remaining = [...text], lines = [];
    while (remaining.length) {
        let count = 0, lastSpace = -1;
        while (count < remaining.length && widthOf(remaining.slice(0, count + 1).join(''), size, font) <= max) {
            if (remaining[count] === ' ') lastSpace = count;
            count++;
        }
        assert.ok(count > 0, 'A glyph cannot fit in the chart label width');
        if (count < remaining.length && lastSpace > count * .45) count = lastSpace;
        // Keep closing punctuation with the preceding text, and do not end a line on an opening bracket.
        if (count < remaining.length && /[、。，．！？：；）］｝〉》」』】]/.test(remaining[count]) && count > 1) count--;
        if (count > 1 && /[（［｛〈《「『【]/.test(remaining[count - 1])) count--;
        lines.push(remaining.splice(0, count).join('').trim());
        while (remaining[0] === ' ') remaining.shift();
    }
    assert.equal(lines.join('').replaceAll(' ', ''), text.replaceAll(' ', ''), 'Wrapping dropped label content');
    return lines;
}

function footer(job, font) {
    const margin = 34, max = job.old.width - margin * 2;
    let cursor = 24;
    const lines = [];
    for (const label of job.labels) {
        for (const value of wrap(label.text, label.size, max, font)) {
            const baseline = cursor + label.size * 1.25;
            lines.push({ value, size: label.size, role: label.role, x: margin, y: baseline });
            cursor += label.size * 1.6;
        }
        cursor += label.role === 'material' ? 2 : 8;
    }
    const height = Math.ceil(cursor + 24), used = [...new Set(lines.map(line => line.value).join(''))];
    const key = c => 'n' + c.codePointAt(0).toString(16);
    const defs = used.filter(c => font.glyphs[c].path).map(c => `<path id="${key(c)}" d="${font.glyphs[c].path}"/>`).join('');
    let paths = '';
    for (const line of lines) {
        let x = line.x;
        const scale = line.size / font.unitsPerEm;
        for (const char of line.value) {
            const glyph = font.glyphs[char];
            if (glyph.bounds) {
                const [a, b, c, d] = glyph.bounds;
                assert.ok(x + a * scale >= 0 && x + c * scale <= job.old.width, 'Label glyph crosses horizontal chart edge');
                assert.ok(line.y - d * scale >= 0 && line.y - b * scale <= height, 'Label glyph crosses vertical chart edge');
                paths += `<use href="#${key(char)}" transform="translate(${x.toFixed(4)} ${line.y.toFixed(4)}) scale(${scale.toFixed(6)} -${scale.toFixed(6)})"/>`;
            }
            x += glyph.advance * scale;
        }
    }
    const body = `<defs>${defs}</defs><g fill="#26352d" data-native-labels="${job.locale}">${paths}</g>`;
    return { body, lines, height };
}

async function buffers(job, font) {
    const native = footer(job, font), logicalWidth = job.old.width, logicalHeight = job.old.gridHeight + native.height;
    const title = job.labels.find(label => label.role === 'title').text;
    const desc = job.labels.map(label => label.text).join('\n');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${logicalWidth}" height="${logicalHeight}" viewBox="0 0 ${logicalWidth} ${logicalHeight}" xml:lang="${job.locale}" role="img"><title>${xml(title)}</title><desc>${xml(desc)}</desc>${job.old.drawing}<g transform="translate(0 ${job.old.gridHeight})">${native.body}</g></svg>`;
    const footerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${logicalWidth}" height="${native.height}"><rect width="100%" height="100%" fill="white"/>${native.body}</svg>`;
    const legacyPng = await sharp(job.old.pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rasterScale = legacyPng.info.width / logicalWidth;
    assert.ok([1, 2].includes(rasterScale), 'A new legacy raster scale needs review');
    assert.equal(legacyPng.info.height, job.old.height * rasterScale);
    const width = legacyPng.info.width, height = logicalHeight * rasterScale;
    const kept = legacyPng.data.subarray(0, width * job.old.gridHeight * rasterScale * 4);
    const footerPng = await sharp(Buffer.from(footerSvg), { density: 72 * rasterScale }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(footerPng.info.width, width);
    assert.equal(footerPng.info.height, native.height * rasterScale);
    const rgba = Buffer.concat([kept, footerPng.data]);
    for (let i = 3; i < rgba.length; i += 4) assert.equal(rgba[i], 255, 'Removing alpha requires every chart pixel to be opaque');
    const png = await sharp(rgba, { raw: { width, height, channels: 4 } }).removeAlpha().png({ compressionLevel: 9, adaptiveFiltering: false }).toBuffer();
    const final = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.ok(final.data.equals(rgba), 'Lossless RGB encoding changed native chart RGBA pixels');
    assert.ok(final.data.subarray(0, kept.length).equals(kept), 'Legacy PNG grid pixels changed');
    return { svg, png, width, height, logicalWidth, logicalHeight, rasterScale, native, keptSha: sha(kept) };
}

async function main() {
    const options = args(process.argv.slice(2)), data = modules();
    assert.equal(data.patterns.length, 111, 'This reviewed batch covers exactly 111 current patterns');
    const jobs = data.patterns.flatMap(pattern => {
        const old = legacy(pattern);
        return LOCALES.map(locale => ({ pattern, old, locale, labels: labels(pattern, locale, data) }));
    });
    const chars = characters(jobs);
    if (options['--font-characters']) { console.log(json({ characters: chars, count: chars.length, sha256: sha(chars) })); return; }
    const font = fontFor(chars, options, data.patterns.length), output = options['--output'];
    if (!options['--check-only']) assert.ok(!fs.existsSync(output), 'Refusing to overwrite an existing chart candidate directory');
    const manifest = Object.fromEntries(LOCALES.map(locale => [locale, {}])), checks = [];
    if (!options['--check-only']) fs.mkdirSync(output, { recursive: true });
    for (const job of jobs) {
        const result = await buffers(job, font);
        const relative = `patterns-${job.locale}/${job.pattern.id}`;
        const folder = path.join(output, relative), png = path.join(folder, 'grid.png'), svg = path.join(folder, 'grid.svg');
        if (options['--check-only']) {
            assert.equal(fs.readFileSync(svg, 'utf8'), result.svg, `Changed native SVG: ${relative}`);
            const actual = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            const expected = await sharp(result.png).ensureAlpha().raw().toBuffer();
            assert.equal(actual.info.width, result.width); assert.equal(actual.info.height, result.height);
            assert.ok(actual.data.equals(expected), `Changed native chart pixels: ${relative}`);
        } else {
            fs.mkdirSync(folder, { recursive: true });
            fs.writeFileSync(svg, result.svg, { flag: 'wx' }); fs.writeFileSync(png, result.png, { flag: 'wx' });
        }
        const metadata = await sharp(png).metadata();
        manifest[job.locale][job.pattern.id] = { href: `/${relative}/grid.png`, width: metadata.width, height: metadata.height };
        checks.push({ id: job.pattern.id, locale: job.locale, width: result.width, height: result.height, oldGridHeight: job.old.gridHeight * result.rasterScale,
            svgWidth: result.logicalWidth, svgHeight: result.logicalHeight, legacyRasterScale: result.rasterScale,
            pngSha256: sha(fs.readFileSync(png)), svgSha256: sha(fs.readFileSync(svg)), oldPngSha256: sha(fs.readFileSync(job.old.pngPath)), oldSvgSha256: sha(job.old.source),
            preservedDrawingSha256: sha(job.old.drawing), preservedGridPixelsSha256: result.keptSha, legacyText: job.old.tail,
            labels: job.labels, wrappedLines: result.native.lines, footerNoGlyphOverflow: true, allPixelsOpaque: true, losslessRgbPixelsIdentical: true, oldGridPixelsIdentical: true, oldSvgDrawingIdentical: true });
    }
    const manifestPath = path.join(output, 'localized-grid-assets.json');
    const report = { patternCount: data.patterns.length, localeCount: LOCALES.length, charts: checks.length, resourceFiles: checks.length * 2, font: font.lock, checks };
    if (options['--check-only']) {
        assert.deepEqual(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), manifest);
        assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'chart-checks.json'), 'utf8')), report);
    } else {
        fs.writeFileSync(manifestPath, json(manifest), { flag: 'wx' });
        fs.writeFileSync(path.join(output, 'chart-checks.json'), json(report), { flag: 'wx' });
    }
    console.log(json({ output, mode: options['--check-only'] ? 'read-only-check' : 'generated-staging-only', charts: checks.length, resources: checks.length * 2,
        manifest: manifestPath, manifestSha256: sha(fs.readFileSync(manifestPath)), fontSha256: font.lock.subsetSha256,
        sizes: [...new Set(checks.map(check => `${check.width}x${check.height}`))].sort(), allOldGridPixelsIdentical: true, allOldSvgDrawingIdentical: true }));
}

await main();

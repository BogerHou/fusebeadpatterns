/** Three native black-cat charts from the frozen private drawing. Never writes public, src or PDFs. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
    loadChartModules, getChartLabels, chartCharacters, renderNativeChart,
} from './build-localized-pattern-charts.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'original-black-cat';
const LOCALES = ['de', 'fr', 'ja'];
const ROWS_SHA = 'fc6a0bd7a4d4f67ea7c5b2cec7afc9e813d74db901b64a3d1b0e4afb2aa3822f';
const SVG_SHA = '2cc611c640d5aba09de931081a4ccf4fac35740f0b0d050ee738a7ac070ecad7';
const PNG_SHA = 'a25bb04f3dd2d25cf05a1d848a03f382ca221a2f47e92c07251abaaa499396c6';
const FONT_DIR = path.join(repo, 'scripts/fonts/black-cat-labels');
const FONT_FILE = 'FuseBeadBlackCatLabels-Regular.ttf';
const FAMILY = 'Fuse Bead Black Cat Labels';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const blankCopy = {
    de: 'Leere Felder bleiben ohne Perle. B: Black; Y: normales Yellow.',
    fr: 'Cases vides : sans perle. B : Black ; Y : Yellow ordinaire.',
    ja: '空白には置きません。BはBlack、Yは通常のYellowです。',
};


function options(values) {
    const result = {};
    for (let i = 0; i < values.length; i++) {
        const key = values[i];
        assert.ok(['--pack', '--output', '--python', '--build-font', '--check-only', '--font-characters'].includes(key), `Unknown option: ${key}`);
        assert.ok(!(key in result), `Duplicate option: ${key}`);
        result[key] = ['--pack', '--output', '--python'].includes(key) ? values[++i] : true;
        assert.ok(result[key] && !String(result[key]).startsWith('--'), `Missing value: ${key}`);
    }
    assert.ok(result['--pack'], 'Explicit private --pack is required');
    result['--pack'] = path.resolve(result['--pack']);
    assert.equal(path.basename(result['--pack']), 'original-black-cat-v1');
    assert.ok(result['--pack'].split(path.sep).includes('artifacts'), 'Use the reviewed private artifacts source pack');
    assert.ok(!result['--pack'].split(path.sep).includes('public'));
    if (!result['--font-characters']) {
        assert.ok(result['--output'], 'Explicit staging --output is required');
        result['--output'] = path.resolve(result['--output']);
        assert.equal(path.basename(result['--output']), 'generated-black-cat-charts');
        assert.ok(!result['--output'].split(path.sep).some(part => ['public', 'src'].includes(part)), 'Never generate directly in public or src');
    }
    assert.ok(!(result['--build-font'] && result['--check-only']), 'Read-only checks cannot author a font');
    return result;
}

function reviewedSource(pack) {
    const manifest = JSON.parse(fs.readFileSync(path.join(pack, 'manifest.json'), 'utf8'));
    assert.equal(manifest.patterns.length, 1);
    const source = manifest.patterns[0];
    assert.equal(source.id, ID); assert.equal(source.source, null);
    assert.equal(source.slug, 'black-cat'); assert.equal(source.kind, 'original');
    assert.equal(sha(source.rows.join('\n')), ROWS_SHA);
    assert.equal(source.beads, 181); assert.equal(source.colorCount, 2);
    assert.equal(source.width, 29); assert.equal(source.height, 29);
    assert.deepEqual(source.bounds, { x: 6, y: 6, width: 16, height: 16 });
    for (const key of ['physicalAssemblyTested', 'ironingTested', 'hangingTested', 'loadStrengthTested']) assert.equal(source[key], false);
    const palette = Object.values(source.palette);
    assert.deepEqual(palette.map(color => [color.symbol, color.ref, color.count]), [['B', '80-19018', 177], ['Y', '80-19003', 4]]);
    assert.deepEqual(palette.map(color => [color.name, color.rgb, color.hex]), [
        ['Black', [50, 50, 52], '#323234'], ['Yellow', [231, 206, 62], '#e7ce3e'],
    ]);
    const entries = JSON.parse(fs.readFileSync(path.join(pack, 'site-entries.json'), 'utf8'));
    assert.equal(entries.length, 1); assert.equal(entries[0].id, ID);
    const pattern = {
        ...entries[0], beads: source.beads, colorCount: source.colorCount,
        gridWidth: source.width, gridHeight: source.height,
        motifWidth: source.bounds.width, motifHeight: source.bounds.height, palette,
    };
    const pngPath = path.join(pack, 'charts', ID + '.png');
    const svgPath = path.join(pack, 'charts', ID + '.svg');
    const svg = fs.readFileSync(svgPath, 'utf8');
    assert.equal(sha(svg), SVG_SHA, 'The frozen black-cat chart SVG changed');
    assert.equal(sha(fs.readFileSync(pngPath)), PNG_SHA, 'The frozen black-cat chart PNG changed');
    const root = /^<svg\b[^>]*>/.exec(svg)?.[0];
    assert.ok(root && svg.endsWith('</svg>'));
    assert.ok(!svg.includes('<image') && !svg.includes('<script'));
    assert.equal(Number(/\bwidth="(\d+)"/.exec(root)?.[1]), 788);
    assert.equal(Number(/\bheight="(\d+)"/.exec(root)?.[1]), 908);
    const groups = [...svg.matchAll(/<g\b[^>]*>[\s\S]*?<\/g>/g)];
    assert.ok(groups.every(group => !group[0].slice(2).includes('<g')));
    const explanatory = groups.filter(group => [...group[0].matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].some(text => text[1].length > 3));
    assert.equal(explanatory.length, 1);
    const footer = explanatory[0];
    assert.equal(footer.index + footer[0].length, svg.length - 6);
    const tail = [...footer[0].matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map(text => text[1]);
    assert.deepEqual(tail, [
        'Black Cat - 181 beads / 2 colors',
        '16 x 16 motif on a 29 x 29 MIDI board. Empty cells: no bead.',
        'B: Black 80-19018 (177)', 'Y: Yellow 80-19003 (4)',
        'Original ordinary cat. Physical assembly and ironing untested.',
        'Counting PNG only; not a calibrated actual-size placement template.',
    ]);
    const firstTextTop = Math.min(...[...footer[0].matchAll(/<text\b([^>]*)>/g)].map(text => Number(/\by="([\d.]+)"/.exec(text[1])?.[1]) - Number(/\bfont-size="([\d.]+)"/.exec(text[1])?.[1])));
    const gridHeight = Math.floor(firstTextTop - 16);
    assert.equal(gridHeight, 761, 'The preserved black-cat drawing region changed');
    return { pattern, source, old: { pngPath, svgPath, source: svg, width: 788, height: 908, drawing: svg.slice(root.length, footer.index), gridHeight, tail } };
}

function jobsFor(pack) {
    const reviewed = reviewedSource(pack), data = loadChartModules();
    const catalog = data.patterns.find(pattern => pattern.id === ID);
    assert.ok(catalog, 'Integrate the reviewed candidate before native chart generation');
    for (const key of ['title', 'beads', 'colorCount', 'gridWidth', 'gridHeight', 'motifWidth', 'motifHeight']) assert.deepEqual(catalog[key], reviewed.pattern[key], `Public candidate differs from reviewed black-cat source: ${key}`);
    assert.deepEqual(catalog.notes, [
        'Use one 29 × 29 MIDI pegboard. Empty grid cells do not need beads.',
        'This ordinary sitting cat is an independently drawn original design.',
        'The motif uses Black 80-19018 and ordinary Yellow 80-19003; screen colors are approximate.',
        'This is a small 16 × 16 motif on a Midi board, not a Mini-bead template. The PNG chart is for counting, not actual-size placement.',
        'Print the PDF at 100% / Actual size and check its 50 mm scale line before use.',
        'This pattern has not been physically assembled or iron-tested. Perler screen colors are approximate.',
    ]);
    reviewed.pattern.notes = catalog.notes;
    return LOCALES.map(locale => ({
        ...reviewed, locale,
        labels: getChartLabels(reviewed.pattern, locale, data).map(label => label.role === 'blank' ? { ...label, text: blankCopy[locale] } : label),
    }));
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
assert not out.exists(),'Refusing to replace an existing black-cat chart font'
original=urllib.request.urlopen(source['fontUrl'],timeout=60).read()
license=urllib.request.urlopen(source['licenseUrl'],timeout=30).read()
hash=lambda data:sha256(data).hexdigest()
assert hash(original)==source['fontSha256'] and hash(license)==source['licenseSha256']
font=TTFont(io.BytesIO(original),recalcTimestamp=False)
instantiateVariableFont(font,{'wght':400},inplace=True)
opts=subset.Options();opts.name_IDs=['*'];opts.name_legacy=True;opts.name_languages=['*'];opts.recalc_timestamp=False
sub=subset.Subsetter(options=opts);sub.populate(text=chars);sub.subset(font)
family=d['family'];names={1:family,2:'Regular',3:'FuseBeadBlackCatLabels-Regular-1',4:family+' Regular',6:'FuseBeadBlackCatLabels-Regular',16:family,17:'Regular'}
for name in font['name'].names:
 if name.nameID in names:name.string=names[name.nameID].encode(name.getEncoding())
cmap=font.getBestCmap();assert all(ord(char) in cmap for char in chars)
glyphset=font.getGlyphSet();glyphs={}
for char in chars:
 name=cmap[ord(char)];glyph=glyphset[name];pen=SVGPathPen(glyphset);glyph.draw(pen);bounds=BoundsPen(glyphset);glyph.draw(bounds)
 glyphs[char]={'advance':font['hmtx'].metrics[name][0],'bounds':bounds.bounds,'path':pen.getCommands()}
glyphBytes=(json.dumps({'unitsPerEm':font['head'].unitsPerEm,'glyphs':glyphs},ensure_ascii=False,indent=2)+'\n').encode()
stream=io.BytesIO();font.save(stream);fontBytes=stream.getvalue()
lock={**source,'derivativeFamily':family,'weight':400,'fonttoolsVersion':__version__,'subsetPurpose':'Original black cat EN/DE/FR/JA PDFs and native chart labels; no old-font refresh','subsetSha256':hash(fontBytes),'glyphsSha256':hash(glyphBytes),'charactersSha256':hash(chars.encode()),'characterCount':len(chars),'patternIds':d['ids'],'chartCount':3,'pdfCount':8,'chartCharactersSha256':d['chartSha'],'pdfCharactersSha256':d['pdfSha']}
out.mkdir();(out/d['fontFile']).write_bytes(fontBytes);(out/'glyphs.json').write_bytes(glyphBytes);(out/'OFL.txt').write_bytes(license);(out/'source.json').write_text(json.dumps(lock,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'fontSha256':lock['subsetSha256'],'glyphsSha256':lock['glyphsSha256'],'characters':len(chars)}))
`;

function fontFor(chars, options, chartSha, pdfSha) {
    if (options['--build-font']) {
        assert.ok(options['--python'], 'A task-owned Python with fontTools 4.60.1 is required');
        const pinned = JSON.parse(fs.readFileSync(path.join(repo, 'scripts/fonts/native-chart-labels/source.json'), 'utf8'));
        const keys = ['repository', 'revision', 'fontUrl', 'fontSha256', 'licenseUrl', 'licenseSha256', 'license'];
        const source = Object.fromEntries(keys.map(key => [key, pinned[key]]));
        const child = spawnSync(options['--python'], ['-B', '-c', FONT_PYTHON], {
            input: json({ output: FONT_DIR, family: FAMILY, fontFile: FONT_FILE, source, characters: chars, ids: [ID], chartSha, pdfSha }), encoding: 'utf8', maxBuffer: 4e6,
        });
        assert.equal(child.status, 0, child.stderr || child.stdout);
    }
    const lock = JSON.parse(fs.readFileSync(path.join(FONT_DIR, 'source.json'), 'utf8'));
    assert.equal(lock.derivativeFamily, FAMILY); assert.equal(lock.fonttoolsVersion, '4.60.1');
    assert.deepEqual(lock.patternIds, [ID]); assert.equal(lock.chartCount, 3); assert.equal(lock.pdfCount, 8);
    assert.equal(lock.chartCharactersSha256, chartSha); assert.equal(lock.pdfCharactersSha256, pdfSha);
    assert.equal(sha(fs.readFileSync(path.join(FONT_DIR, FONT_FILE))), lock.subsetSha256);
    assert.equal(sha(fs.readFileSync(path.join(FONT_DIR, 'OFL.txt'))), lock.licenseSha256);
    assert.equal(sha(fs.readFileSync(path.join(FONT_DIR, 'glyphs.json'))), lock.glyphsSha256);
    assert.equal(sha(chars), lock.charactersSha256, 'Changed black-cat chart text requires a new separately named font inventory');
    const font = JSON.parse(fs.readFileSync(path.join(FONT_DIR, 'glyphs.json'), 'utf8'));
    assert.ok([...chars].every(char => font.glyphs[char]));
    return { ...font, lock };
}

async function main() {
    const parsed = options(process.argv.slice(2)), jobs = jobsFor(parsed['--pack']);
    assert.ok(parsed['--python'], 'Explicit Python with PDF dependencies is required for the shared font inventory');
    const pdf = spawnSync(parsed['--python'], ['-B', path.join(repo, 'scripts/build-black-cat-pdfs.py'), '--pack', parsed['--pack'], '--font-characters'], { encoding: 'utf8', maxBuffer: 1e6 });
    assert.equal(pdf.status, 0, pdf.stderr || pdf.stdout);
    const pdfChars = JSON.parse(pdf.stdout).characters;
    const chartChars = chartCharacters(jobs);
    const chars = [...new Set(chartChars + pdfChars)].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');
    if (parsed['--font-characters']) { console.log(json({ characters: chars, count: chars.length, sha256: sha(chars) })); return; }
    if (!parsed['--check-only']) assert.ok(!fs.existsSync(parsed['--output']), 'Refusing to overwrite a black-cat chart candidate directory');
    const font = fontFor(chars, parsed, sha(chartChars), sha(pdfChars)), output = parsed['--output'];
    if (!parsed['--check-only']) fs.mkdirSync(output, { recursive: true });
    const manifest = Object.fromEntries(LOCALES.map(locale => [locale, {}])), checks = [];
    for (const job of jobs) {
        const rendered = await renderNativeChart(job, font), relative = `patterns-${job.locale}/${ID}`;
        const folder = path.join(output, relative), png = path.join(folder, 'grid.png'), svg = path.join(folder, 'grid.svg');
        if (parsed['--check-only']) {
            assert.equal(fs.readFileSync(svg, 'utf8'), rendered.svg);
            assert.ok(fs.readFileSync(png).equals(rendered.png), `Changed black-cat chart PNG: ${job.locale}`);
        } else {
            fs.mkdirSync(folder, { recursive: true });
            fs.writeFileSync(svg, rendered.svg, { flag: 'wx' }); fs.writeFileSync(png, rendered.png, { flag: 'wx' });
        }
        manifest[job.locale][ID] = { href: `/${relative}/grid.png`, width: rendered.width, height: rendered.height };
        checks.push({
            id: ID, locale: job.locale, width: rendered.width, height: rendered.height,
            oldGridHeight: job.old.gridHeight * rendered.rasterScale, legacyRasterScale: rendered.rasterScale,
            pngSha256: sha(fs.readFileSync(png)), svgSha256: sha(fs.readFileSync(svg)), oldPngSha256: PNG_SHA, oldSvgSha256: SVG_SHA,
            preservedDrawingSha256: sha(job.old.drawing), preservedGridPixelsSha256: rendered.keptSha,
            labels: job.labels, wrappedLines: rendered.native.lines,
            footerNoGlyphOverflow: true, allPixelsOpaque: true, losslessRgbPixelsIdentical: true, oldGridPixelsIdentical: true,
            physicalAssemblyTested: false, ironingTested: false, hangingTested: false, loadStrengthTested: false,
        });
    }
    const report = { patternCount: 1, localeCount: 3, charts: 3, resourceFiles: 6, font: font.lock, checks };
    const outputs = [['localized-grid-assets.json', manifest], ['chart-checks.json', report]];
    for (const [name, data] of outputs) {
        if (parsed['--check-only']) assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, name), 'utf8')), data);
        else fs.writeFileSync(path.join(output, name), json(data), { flag: 'wx' });
    }
    console.log(json({ output, mode: parsed['--check-only'] ? 'read-only-check' : 'generated-staging-only', charts: checks.length, sizes: checks.map(check => ({ locale: check.locale, width: check.width, height: check.height })), allOldGridPixelsIdentical: true, fontSha256: font.lock.subsetSha256 }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

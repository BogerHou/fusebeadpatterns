"""Stage only the existing original Black Cat's fixed Hama Midi variant.

--font-characters is read-only. --prepare-only creates PNG/project/materials but
never a PDF. --author-pdfs requires the separately recorded PDF authoring marker.
All outputs are exclusive to the named ignored staging directory. No network,
old-asset/font refresh, private drawing pack, or character source is used.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import base64
from collections import Counter
from copy import deepcopy
from hashlib import sha256
import io
import json
from pathlib import Path
import re
import subprocess

import pdfplumber
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
ID, VARIANT_ID = 'original-black-cat', 'original-black-cat-hama'
ASSET_ROOT = Path('patterns-hama') / ID
LOCALES = ('en', 'de', 'fr', 'ja')
PAPERS = {'a4': A4, 'letter': letter}
LANGUAGES = dict(zip(LOCALES, ('en-US', 'de-DE', 'fr-FR', 'ja-JP')))
SITE = 'https://fusebeadpatterns.art'
SOURCE_RGBA_SHA = 'fbf706e0c20bde55d98825408c5f2e1b94bc4be7a8ab298c1d8b248b99accb2d'
TARGET_RGBA_SHA = '90a8705723b8021d46d5ccc7fc3a58fde5291a970e089e2f28348a36f0c01c5e'
PINS = {
    'public/patterns/original-black-cat/pattern.bead-pattern.json': '689a4b8e003aefd0ccba9bd671046ae473dfe5beca8179aa063e4b12aea65ae8',
    'public/patterns/original-black-cat/pixels.png': '6fe8ac4a63c45599b6f8cbe87707632a278a4407da5053dbe4695d37fa4477e0',
    'public/patterns/original-black-cat/preview.png': '2fafe159aeb49fdadf52f14d4b00d560a886440d7dd7a5cfd5c8b76542d70491',
    'public/palettes/hama.csv': 'e08218d7483d5be6eca27958f20a2e752d81a5b12f0150653cd8fd958e97effc',
    'public/palettes/perler.csv': '6257da5908b11ac1cb67328a122e8bb8b439780528554cfc4a60e5ac2468b0a4',
    'src/lib/editor/pattern-palette.ts': 'a4f4608f363a93a31e2a1506d6ec3054e2765566b13e100c456b7881d91d31e8',
    'src/lib/editor/pattern-quantization.ts': 'ad4a0da1b3f31ecfb2a00217f572a6de3245c87f965bd95a75687000badfe549',
    'src/lib/editor/quantization-protocol.ts': 'ca210e7ad2883aafd57c028d4507d2a5112a4b205d909604be114472f6778689',
    'src/lib/editor/config.ts': 'cbf9eeba7ddb97e884b2a512b53d4c7e14786910a155ecf6b8b731c8f8339d8a',
    'src/lib/editor/palette-state.ts': 'b2caac80b1ee285b704142be5788761106e7efb1724efb7a8470781c3bcf60f4',
    'src/lib/core/utils/utils.ts': '7d801b94ede6acbaac51a6b98ed2ba05c15b9d05f29107304a4f9685a711b3da',
    'src/lib/core/model/matching/matching.model.ts': '0e260f12fd9607a427bb32ce689f20495d6f5fdaad18a5984654bf3a10e451ac',
    'src/lib/core/model/color/lab.model.ts': 'b48b9416721ac8d78f10fe037ab155d4eaed9c97fe1bc38a8ad4e635cac7ca43',
    'scripts/fonts/black-cat-labels/FuseBeadBlackCatLabels-Regular.ttf': '1e1b515afb44ba2e56a14523e05813385bef8a9795802e318e7586b5a43eddf8',
    'scripts/fonts/black-cat-labels/source.json': '59a90a58a108fcd0fdc025faf9a3a864bebdb8659da7ccacb98edb5e4e44148d',
    'scripts/fonts/black-cat-labels/OFL.txt': '1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9',
    'scripts/fonts/hama-letter-jp/FuseBeadHamaLetterJapanese-Regular.ttf': '2128e344112cad3dc7ca53a95bde83bf87a2956709ed7185221dec56ffa4ce8b',
    'scripts/fonts/hama-letter-jp/source.json': '73450f653b9ef4214c25e1ceb0346bc2d3545c37c57798db4f82d905e66039d0',
    'scripts/fonts/hama-letter-jp/OFL.txt': '1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9',
}
FONT_FILES = {
    'BlackCatHamaText': ROOT / 'scripts/fonts/black-cat-labels/FuseBeadBlackCatLabels-Regular.ttf',
    'BlackCatHamaSymbols': ROOT / 'scripts/fonts/hama-letter-jp/FuseBeadHamaLetterJapanese-Regular.ttf',
}
INK, MUTED = '#25342e', '#59655f'
COPY = {
    'en': {'name': 'Black Cat', 'type': 'Hama Midi Bead Pattern',
        'grid': '29 x 29 grid / 16 x 16 motif / 181 beads / 2 colors',
        'materials': 'Hama Midi materials', 'header': 'Symbol / Hama number / Color name: EN', 'count': 'Count',
        'blank': 'Empty cells need no beads. Each symbol means its listed bead color.',
        'color': 'Screen and print colors are approximate. Check color refs against your beads.',
        'physical': 'Original digital design. Physical assembly and ironing have not been tested.',
        'codes': 'H18 = Hama 18; H03 = Hama 03. H is an editor prefix.',
        'print': '{paper}: print at 100% / Actual size. Turn off "Fit to page".',
        'scale': 'Both lines must measure 50 mm. Check the 5 mm pitch against your Midi board.',
        'chart': 'Counting PNG only. Use the calibrated PDF for actual-size printing.',
        'detail': 'Pattern and editor'},
    'de': {'name': 'Schwarze Katze', 'type': 'Hama-Midi-Vorlage',
        'grid': '29 x 29 Raster / 16 x 16 Motiv / 181 Perlen / 2 Farben',
        'materials': 'Materialliste: Hama Midi', 'header': 'Symbol / Hama-Farbnummer / Farbe: EN', 'count': 'Anzahl',
        'blank': 'Leere Felder bleiben ohne Perle. Das Symbol bestimmt die Perlenfarbe.',
        'color': 'Bildschirm- und Druckfarben sind Näherungen. Farbnummern an den eigenen Perlen prüfen.',
        'physical': 'Originales digitales Motiv. Bau und Bügeln sind ungeprüft.',
        'codes': 'H18 = Hama 18; H03 = Hama 03. H ist ein Editor-Präfix.',
        'print': '{paper}: 100% / Tatsächliche Größe. "An Seite anpassen" ausschalten.',
        'scale': 'Beide Messlinien müssen 50 mm messen. Das 5-mm-Raster an der Midi-Platte prüfen.',
        'chart': 'PNG zum Abzählen. Zum Drucken in Originalgröße das PDF verwenden.',
        'detail': 'Vorlage und Editor'},
    'fr': {'name': 'Chat noir', 'type': 'Modèle Hama Midi',
        'grid': 'Grille 29 x 29 / motif 16 x 16 / 181 perles / 2 couleurs',
        'materials': 'Matériel : Hama Midi', 'header': 'Symbole / numéro Hama / Couleur: EN', 'count': 'Quantité',
        'blank': 'Cases vides : sans perle. Chaque symbole indique sa couleur de perle.',
        'color': 'Les couleurs à l’écran et sur papier sont approximatives. Vérifiez les références sur vos perles.',
        'physical': 'Modèle numérique original. Assemblage et repassage non testés.',
        'codes': 'H18 = Hama 18 ; H03 = Hama 03. H est un préfixe de l’éditeur.',
        'print': '{paper} : 100% / Taille réelle. Désactivez "Ajuster à la page".',
        'scale': 'Les deux repères doivent mesurer 50 mm. Vérifiez la grille de 5 mm sur votre plaque Midi.',
        'chart': 'PNG pour compter. Utilisez le PDF calibré pour imprimer à taille réelle.',
        'detail': 'Modèle et éditeur'},
    'ja': {'name': '黒猫', 'type': 'Hama Midiの図案',
        'grid': '29 x 29マス / 図柄16 x 16マス / 181個 / 2色',
        'materials': 'Hama Midiの材料表', 'header': '記号 / Hama色番号 / 商品色名: EN', 'count': '個数',
        'blank': '空白には置きません。4はBlack、$は通常のYellowです。',
        'color': '画面と印刷の色は目安です。実物のビーズの色番号を確認してください。',
        'physical': 'オリジナルのデジタル図案。実物制作とアイロンでの接合は未検証です。',
        'codes': 'H18 = Hama 18 / H03 = Hama 03',
        'print': '{paper}・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'scale': '縦横の確認線は各50 mm。1マス5 mmの間隔を実物のミディ用プレートで確認。',
        'chart': 'PNGは個数を確認する図です。実寸の印刷にはPDFを使います。',
        'detail': '図案とエディター'},
}

NODE_BRIDGE = r"""
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const resolveFilename=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...args){if(request.startsWith('.')&&!path.extname(request)&&parent?.filename){const candidate=path.resolve(path.dirname(parent.filename),request+'.ts');if(fs.existsSync(candidate))request=candidate;}return resolveFilename.call(this,request,parent,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText.replaceAll('import.meta.url',JSON.stringify(pathToFileURL(filename).href)),filename);
(async()=>{
const {getPaletteOption,parsePaletteCsv}=require('./src/lib/editor/config.ts');
const {remapPatternPalette}=require('./src/lib/editor/pattern-palette.ts');
const {parseEditorProject,serializeEditorProject}=require('./src/lib/editor/draft.ts');
const project=JSON.parse(fs.readFileSync('public/patterns/original-black-cat/pattern.bead-pattern.json','utf8')),draft=project.draft;
assert.ok(parseEditorProject(JSON.stringify(project)));assert.equal(draft.matchingId,'delta_e_cie2000');
const source=new Uint8ClampedArray(Buffer.from(draft.editedPattern.data,'base64')),option=getPaletteOption('hama'),target=parsePaletteCsv(fs.readFileSync('public/palettes/hama.csv','utf8'),option);
assert.equal(target.entries.length,92);
const rgba=await remapPatternPalette(source,29,29,[target],draft.matchingId,{sourcePalettes:draft.activePalettes});
const counts=new Map();for(let i=0;i<rgba.length;i+=4){assert.equal(rgba[i+3],source[i+3]);if(!rgba[i+3]){assert.deepEqual([...rgba.subarray(i,i+4)],[0,0,0,0]);continue;}const e=target.entries.find(e=>['r','g','b'].every((k,j)=>e.color[k]===rgba[i+j]));assert.ok(e);counts.set(e.ref,(counts.get(e.ref)||0)+1);}
assert.deepEqual([...counts],[['H18',177],['H03',4]]);
const used=target.entries.filter(e=>counts.has(e.ref)).sort((a,b)=>a.ref==='H18'?-1:b.ref==='H18'?1:a.ref.localeCompare(b.ref));
project.savedAt='2026-10-15T00:00:00.000Z';Object.assign(draft,{fileName:'original-black-cat-hama',selectedPaletteIds:['hama'],activePalettes:[{name:'Hama Midi',entries:used}],pdfScaleMode:'midi-5mm',pdfPaperSize:'a4'});draft.editedPattern.data=Buffer.from(rgba).toString('base64');
const parsed=parseEditorProject(JSON.stringify(project));assert.ok(parsed);assert.deepEqual(parseEditorProject(serializeEditorProject(parsed)),parsed);
process.stdout.write(JSON.stringify({project,rgba:Buffer.from(rgba).toString('base64'),materials:used.map(e=>({ref:e.ref,code:e.ref.slice(1),name:e.name,symbol:e.symbol,rgb:['r','g','b'].map(k=>e.color[k]),hex:'#'+Buffer.from(['r','g','b'].map(k=>e.color[k])).toString('hex'),count:counts.get(e.ref)})),matchingId:draft.matchingId,targetEntries:target.entries.length}));
})().catch(error=>{console.error(error);process.exitCode=1;});
"""


def digest(data):
    return sha256(data).hexdigest()


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def detail_url(locale):
    return SITE + ('' if locale == 'en' else '/' + locale) + '/patterns/black-cat#hama-midi'


def source_checks():
    for name, expected in PINS.items():
        assert digest((ROOT / name).read_bytes()) == expected, 'Frozen input changed: ' + name


def load_variant(node):
    source_checks()
    source_project = json.loads((ROOT / 'public/patterns' / ID / 'pattern.bead-pattern.json').read_text())
    d = source_project['draft']
    assert source_project['type'] == 'bead-pattern-project-v1' and source_project['version'] == 1
    assert d['sourceMode'] == 'blank' and d['imageSrc'] is None
    assert d['selectedPaletteIds'] == ['perler'] and (d['boardId'], d['boardWidth'], d['boardHeight']) == ('midi', 1, 1)
    source = base64.b64decode(d['editedPattern']['data'], validate=True)
    assert len(source) == 3364 and digest(source) == SOURCE_RGBA_SHA
    with Image.open(ROOT / 'public/patterns' / ID / 'pixels.png') as image:
        assert image.mode == 'RGBA' and image.size == (29, 29) and image.tobytes() == source
    match = re.search(r'export const patterns: Pattern\[\] = (\[.*?\]);', (ROOT / 'src/lib/patterns/catalog.ts').read_text(), re.S)
    original = next(row for row in json.loads(match[1]) if row['id'] == ID)
    assert original['version'] == 'Original Black Cat design v1' and original['source'] is None and original['collectionId'] is None
    assert original['slug'] == 'black-cat' and original['beads'] == 181 and original['colorCount'] == 2
    assert (original['motifWidth'], original['motifHeight']) == (16, 16)
    result = subprocess.run([node, '-e', NODE_BRIDGE], cwd=ROOT, capture_output=True, check=True)
    data = json.loads(result.stdout)
    rgba = base64.b64decode(data['rgba'], validate=True)
    assert digest(rgba) == TARGET_RGBA_SHA and rgba[3::4] == source[3::4]
    assert [(c['ref'], c['symbol'], c['rgb'], c['count']) for c in data['materials']] == [('H18', '4', [20, 19, 21], 177), ('H03', '$', [233, 199, 4], 4)]
    by_rgb = {tuple(c['rgb']): c for c in data['materials']}
    occupied = {(i % 29, i // 29): by_rgb[tuple(rgba[i*4:i*4+3])] for i in range(841) if rgba[i*4+3]}
    assert len(occupied) == 181 and Counter(c['ref'] for c in occupied.values()) == {'H18': 177, 'H03': 4}
    assert min(x for x, y in occupied) == 6 and max(x for x, y in occupied) == 21
    assert min(y for x, y in occupied) == 6 and max(y for x, y in occupied) == 21
    return dict(project=data['project'], rgba=rgba, source=source, materials=data['materials'], occupied=occupied)


def text_entries(v, locale, paper):
    c = COPY[locale]; width, height = [n / mm for n in PAPERS[paper]]
    result = [dict(x=18, y=13, value='FUSE BEAD PATTERNS', size=8),
              dict(x=18, y=25, value=c['name'], size=16),
              dict(x=width-18, y=13, value=c['type'], size=8, right=True, maxMm=84),
              dict(x=18, y=35, value=c['grid'], size=8.3),
              dict(x=18, y=195, value=c['materials'], size=10),
              dict(x=18, y=201, value=c['header'], size=7.2, maxMm=153),
              dict(x=180, y=201, value=c['count'], size=7.2, right=True, maxMm=20)]
    for i, color in enumerate(v['materials']):
        y = 209 + i*7
        result += [dict(x=24, y=y, value=color['symbol'], size=8, maxMm=6),
                   dict(x=36, y=y, value=color['code'], size=8, maxMm=30),
                   dict(x=80, y=y, value=color['name'], size=8, maxMm=75),
                   dict(x=180, y=y, value=str(color['count']), size=8, right=True, maxMm=18)]
    for key, y in [('blank', 224), ('color', 230), ('physical', 236), ('codes', 242), ('print', 248), ('scale', 263)]:
        result.append(dict(x=18, y=y, value=c[key].format(paper='A4' if paper == 'a4' else 'US Letter'), size=7.2))
    result += [dict(x=73, y=257.8, value='50 mm', size=8, maxMm=20),
               dict(x=194, y=195, value='50 mm', size=7, right=True, maxMm=17),
               dict(x=18, y=height-9, value=c['detail'], size=7, maxMm=50),
               dict(x=width-18, y=height-9, value=detail_url(locale).split('#')[0].removeprefix('https://'), size=6.2, right=True, maxMm=121)]
    return result


class Fonts:
    def __init__(self):
        self.faces = {}
        for name, path in FONT_FILES.items():
            font = TTFont(name, str(path)); pdfmetrics.registerFont(font); self.faces[name] = font.face.charToGlyph
        self.pil = {}

    def name(self, char):
        for name, cmap in self.faces.items():
            if ord(char) in cmap:
                return name
        raise AssertionError('Missing glyph: ' + repr(char))

    def runs(self, value):
        runs = []
        for char in value:
            name = self.name(char)
            if runs and runs[-1][0] == name: runs[-1][1] += char
            else: runs.append([name, char])
        return runs

    def width(self, value, size):
        return sum(pdfmetrics.stringWidth(text, name, size) for name, text in self.runs(value))

    def pdf_text(self, pdf, x, y, value, size, right=False, color=INK):
        if right: x -= self.width(value, size)
        pdf.setFillColor(HexColor(color))
        for name, text in self.runs(value):
            pdf.setFont(name, size); pdf.drawString(x, y, text); x += pdfmetrics.stringWidth(text, name, size)

    def image_font(self, name, size):
        key = name, size
        if key not in self.pil: self.pil[key] = ImageFont.truetype(str(FONT_FILES[name]), size)
        return self.pil[key]

    def image_width(self, value, size):
        return sum(self.image_font(name, size).getlength(text) for name, text in self.runs(value))

    def image_text(self, draw, x, y, value, size, color=INK):
        for name, text in self.runs(value):
            font = self.image_font(name, size); draw.text((x, y), text, font=font, fill=color, anchor='lt'); x += font.getlength(text)


def chart_values(v, locale):
    c = COPY[locale]
    return [c['name'], c['type'], c['grid'], c['materials'],
            *[f"{row['symbol']} / {row['code']} / {row['name']} / {c['count']}: {row['count']}" for row in v['materials']],
            *[c[key] for key in ('blank', 'color', 'physical', 'codes', 'chart')], detail_url(locale).split('#')[0].removeprefix('https://')]


def font_inventory(v, fonts):
    chars = ''.join(sorted(set('0123456789' + ''.join(s for locale in LOCALES for s in chart_values(v, locale)) + ''.join(e['value'] for locale in LOCALES for paper in PAPERS for e in text_entries(v, locale, paper)))))
    assigned = {name: ''.join(c for c in chars if fonts.name(c) == name) for name in FONT_FILES}
    for locale in LOCALES:
        for paper in PAPERS:
            width = PAPERS[paper][0] / mm
            entries = text_entries(v, locale, paper)
            assert 18 + fonts.width(entries[0]['value'], 8) / mm < width-18-fonts.width(entries[2]['value'], 8) / mm
            for e in entries: assert fonts.width(e['value'], e['size']) <= e.get('maxMm', width-36)*mm, (locale, paper, e['value'])
    assert fonts.name('4') == 'BlackCatHamaText' and fonts.name('$') == 'BlackCatHamaSymbols'
    return dict(characterCount=len(chars), characters=chars, charactersSha256=digest(chars.encode()),
                assignment=assigned, missing=[], files={str(p.relative_to(ROOT)): digest(p.read_bytes()) for p in FONT_FILES.values()},
                note='Both existing OFL fonts are reused unchanged. Only missing primary glyphs use the second font; no new font or download.')


def png_bytes(image):
    buffer = io.BytesIO(); image.save(buffer, format='PNG', optimize=False); return buffer.getvalue()


def chart_png(v, locale, fonts):
    image = Image.new('RGB', (760, 1040), '#faf8f3'); draw = ImageDraw.Draw(image)
    left, top, pitch = 90, 128, 20
    values = chart_values(v, locale)
    fonts.image_text(draw, 40, 24, values[0], 28)
    fonts.image_text(draw, 40, 62, values[1], 17)
    fonts.image_text(draw, 40, 85, values[2], 14, MUTED)
    for (x, y), entry in v['occupied'].items():
        x0, y0 = left+x*pitch, top+y*pitch
        draw.rectangle((x0, y0, x0+pitch, y0+pitch), fill=entry['hex'])
        symbol = entry['symbol']; width = fonts.image_width(symbol, 13)
        color = '#ffffff' if entry['ref'] == 'H18' else INK
        fonts.image_text(draw, x0+(pitch-width)/2, y0+3, symbol, 13, color)
    for i in range(30):
        color = '#65736b' if i % 5 == 0 or i == 29 else '#adb3aa'; weight = 2 if i % 5 == 0 or i == 29 else 1
        draw.line((left+i*pitch, top, left+i*pitch, top+580), fill=color, width=weight)
        draw.line((left, top+i*pitch, left+580, top+i*pitch), fill=color, width=weight)
    for i in range(29):
        label = str(i+1)
        fonts.image_text(draw, left+(i+.5)*pitch-fonts.image_width(label, 10)/2, top-15, label, 10, MUTED)
        fonts.image_text(draw, left-8-fonts.image_width(label, 10), top+i*pitch+4, label, 10, MUTED)
    y = 728
    for i, value in enumerate(values[3:-1]):
        size = 17 if i == 0 else 14
        line = ''
        for char in value:
            if line and fonts.image_width(line+char, size) > 680:
                fonts.image_text(draw, 40, y, line, size); y += 21; line = ''
            line += char
        if line: fonts.image_text(draw, 40, y, line, size)
        y += 28 if i < 3 else 24
    assert y < 1000, (locale, 'Chart text exceeds canvas', y)
    fonts.image_text(draw, 40, 1010, values[-1], 12, MUTED)
    return png_bytes(image)


def prepare_files(v, fonts):
    pixels = Image.frombytes('RGBA', (29, 29), v['rgba'])
    preview = Image.new('RGBA', (580, 580), '#faf8f3'); preview.alpha_composite(pixels.resize((580, 580), Image.Resampling.NEAREST))
    files = {'pixels.png': png_bytes(pixels), 'preview.png': png_bytes(preview.convert('RGB')),
             'pattern.bead-pattern.json': json_bytes(v['project']), 'materials.json': json_bytes(v['materials'])}
    files.update({f'{locale}/grid.png': chart_png(v, locale, fonts) for locale in LOCALES})
    return files


def safe_output(path, creating=False):
    path = Path(path).expanduser(); assert path.is_absolute()
    assert path.name == 'generated-black-cat-hama-downloads' and path.parent.name == 'black-cat-hama-oct15'
    assert path.parent.parent == ROOT / 'artifacts', 'Use this worktree artifacts/black-cat-hama-oct15 staging root'
    for ancestor in (path, *path.parents): assert not ancestor.is_symlink(), 'Staging symlinks forbidden'
    assert subprocess.run(['git', 'check-ignore', '--quiet', '--', str(path)], cwd=ROOT).returncode == 0
    if creating: assert not path.exists(), 'Refusing to overwrite any staging output'
    else:
        assert path.is_dir(), 'Prepare PNG/project resources first'
        assert all(not p.is_symlink() for p in path.rglob('*')), 'Staging child symlinks forbidden'
    return path


def pdf_path(output, locale, paper):
    return output / locale / ('pattern.pdf' if paper == 'a4' else 'pattern-letter.pdf')


def write_pdf(v, locale, paper, destination, fonts):
    width, height = PAPERS[paper]; gx, top, pitch = (width/mm-145)/2, 42, 5
    with destination.open('xb') as handle:
        pdf = canvas.Canvas(handle, pagesize=PAPERS[paper], invariant=1, pageCompression=1,
                            initialFontName='BlackCatHamaText', initialFontSize=8, lang=LANGUAGES[locale])
        pdf.setTitle(COPY[locale]['name'] + ' - ' + COPY[locale]['type'])
        pdf.setAuthor('Fuse Bead Patterns team'); pdf.setSubject(f'{locale}; Hama Midi; 29 x 29; 5 mm; {paper}; 100%')
        pdf.setViewerPreference('PrintScaling', 'None')
        def line(x0, y0, x1, y1, weight=.1, color='#a2aaa6'):
            pdf.setLineWidth(weight*mm); pdf.setStrokeColor(HexColor(color)); pdf.line(x0*mm, height-y0*mm, x1*mm, height-y1*mm)
        for (x, y), entry in v['occupied'].items():
            pdf.setFillColor(HexColor(entry['hex'])); pdf.rect((gx+x*pitch)*mm, height-(top+(y+1)*pitch)*mm, pitch*mm, pitch*mm, fill=1, stroke=0)
            color = '#ffffff' if entry['ref'] == 'H18' else INK
            symbol = entry['symbol']; sx = (gx+(x+.5)*pitch)*mm-fonts.width(symbol, 7)/2
            fonts.pdf_text(pdf, sx, height-(top+(y+.5)*pitch)*mm-2.2, symbol, 7, color=color)
        for i in range(30):
            weight, color = (.23, '#65736b') if i % 5 == 0 or i == 29 else (.1, '#a2aaa6')
            line(gx+i*pitch, top, gx+i*pitch, top+145, weight, color); line(gx, top+i*pitch, gx+145, top+i*pitch, weight, color)
        for i in range(29):
            label = str(i+1)
            fonts.pdf_text(pdf, (gx+(i+.5)*pitch)*mm-fonts.width(label, 5.5)/2, height-(top-1.5)*mm, label, 5.5, color=MUTED)
            fonts.pdf_text(pdf, (gx-2)*mm, height-(top+(i+.5)*pitch)*mm-2, label, 5.5, right=True, color=MUTED)
        line(18, 202.5, 181, 202.5)
        for i, entry in enumerate(v['materials']):
            pdf.setFillColor(HexColor(entry['hex'])); pdf.setStrokeColor(HexColor('#8c9590')); pdf.setLineWidth(.15*mm)
            pdf.rect(18*mm, height-(210+i*7)*mm, 4*mm, 4*mm, fill=1, stroke=1)
        line(18, 256, 68, 256, .4, INK)
        for x in (18, 68): line(x, 254.5, x, 257.5, .4, INK)
        line(194, 198, 194, 248, .4, INK)
        for y in (198, 248): line(192.5, y, 195.5, y, .4, INK)
        for entry in text_entries(v, locale, paper): fonts.pdf_text(pdf, entry['x']*mm, height-entry['y']*mm, entry['value'], entry['size'], right=entry.get('right', False))
        pdf.linkURL(detail_url(locale), (18*mm, 6*mm, width-18*mm, 13*mm), relative=0)
        pdf.showPage(); pdf.save()


def close(a, b):
    return abs(a-b) < .004


def validate_pdf(v, locale, paper, path, fonts):
    width, height = PAPERS[paper]; gx = (width/mm-145)/2
    reader = PdfReader(path); assert len(reader.pages) == 1
    assert all(close(a, b) for a, b in zip(reader.pages[0].mediabox, (0, 0, width, height)))
    assert reader.trailer['/Root']['/Lang'] == LANGUAGES[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    assert reader.metadata.title == COPY[locale]['name'] + ' - ' + COPY[locale]['type'] and 'Hama Midi' in reader.metadata.subject
    assert [a.get_object()['/A']['/URI'] for a in reader.pages[0]['/Annots']] == [detail_url(locale)]
    for resource in reader.pages[0]['/Resources']['/Font'].values():
        font = resource.get_object(); assert font['/FontDescriptor']['/FontFile2'].get_data() and font['/ToUnicode'].get_data()
        assert any(name in font['/BaseFont'] for name in ('FuseBeadBlackCatLabels', 'FuseBeadHamaLetterJapanese'))
    with pdfplumber.open(path) as document:
        page = document.pages[0]; compact = re.sub(r'\s+', '', page.extract_text())
        for e in text_entries(v, locale, paper): assert re.sub(r'\s+', '', e['value']) in compact, (locale, paper, e['value'])
        assert not any(s in compact for s in ('Perler', '(cid:', '\ufffd', '\u25a0', 'Creeper', 'DMC', 'study', 'STUDY'))
        assert all(c['x0'] >= 17*mm and c['x1'] <= width-12*mm and c['top'] >= 8*mm and c['bottom'] <= height-6*mm for c in page.chars)
        cells = {}
        for r in page.rects:
            if close(r['width'], 5*mm) and close(r['height'], 5*mm):
                x, y = round((r['x0']/mm-gx)/5), round((r['top']/mm-42)/5)
                assert (x, y) not in cells and close(r['x0'], (gx+x*5)*mm) and close(r['top'], (42+y*5)*mm)
                cells[x, y] = tuple(round(n*255) for n in r['non_stroking_color'])
        assert cells == {pos: tuple(e['rgb']) for pos, e in v['occupied'].items()}
        symbols = {}
        for c in page.chars:
            if 42*mm <= c['top'] < 187*mm and gx*mm <= c['x0'] < (gx+145)*mm:
                x = round(((c['x0']+c['x1'])/2/mm-gx-2.5)/5); y = int((c['top']/mm-42)//5)
                assert (x, y) not in symbols and close(c['size'], 7)
                assert close((c['x0']+c['x1'])/2, (gx+(x+.5)*5)*mm)
                symbols[x, y] = c['text']
        assert symbols == {pos: e['symbol'] for pos, e in v['occupied'].items()}
        for i in range(30):
            for expected in [(gx+i*5, 42, gx+i*5, 187), (gx, 42+i*5, gx+145, 42+i*5)]:
                assert any(all(close(actual, target*mm) for actual, target in zip((ln['x0'], ln['top'], ln['x1'], ln['bottom']), expected)) for ln in page.lines)
        for horizontal in (True, False):
            assert any(close(ln['width' if horizontal else 'height'], 50*mm) and close(ln['height' if horizontal else 'width'], 0) for ln in page.lines)
    return dict(locale=locale, paper=paper, path=str(path.relative_to(path.parents[1])), sha256=digest(path.read_bytes()), pages=1, beads=181, colors=2, printedCells=len(cells), symbols=Counter(symbols.values()))


def verify_prepared(output, expected):
    for name, data in expected.items(): assert (output/name).read_bytes() == data, 'Prepared asset changed: '+name
    manifest = json.loads((output/'source-lock.json').read_text())
    assert manifest['pins'] == PINS and manifest['sourceRgbaSha256'] == SOURCE_RGBA_SHA and manifest['hamaRgbaSha256'] == TARGET_RGBA_SHA
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default='node'); parser.add_argument('--output', type=Path)
    operation = parser.add_mutually_exclusive_group(required=True)
    operation.add_argument('--font-characters', action='store_true'); operation.add_argument('--prepare-only', action='store_true')
    operation.add_argument('--author-pdfs', action='store_true'); operation.add_argument('--check-only', action='store_true')
    args = parser.parse_args(); v = load_variant(args.node); fonts = Fonts(); inventory = font_inventory(v, fonts)
    if args.font_characters:
        print(json.dumps(inventory, ensure_ascii=False)); return
    assert args.output, 'Explicit absolute staging --output required'
    output = safe_output(args.output, creating=args.prepare_only); files = prepare_files(v, fonts)
    if args.prepare_only:
        output.mkdir(parents=True)
        for name, data in files.items():
            destination = output/name; destination.parent.mkdir(parents=True, exist_ok=True)
            with destination.open('xb') as stream: stream.write(data)
        lock = dict(format='fusebead-black-cat-hama-source-lock', version=1, id=ID, variantId=VARIANT_ID,
                    sourceRgbaSha256=SOURCE_RGBA_SHA, hamaRgbaSha256=TARGET_RGBA_SHA, pins=PINS,
                    matching='product remapPatternPalette / delta_e_cie2000 / full Hama Midi92 / source neutral-name preservation / no dithering',
                    geometry=dict(grid=[29,29], motif=[16,16], beads=181, colors=2, unchangedAlpha=True),
                    fontInventory=inventory, materials=v['materials'],
                    preparedFiles={name: dict(bytes=len(data), sha256=digest(data)) for name, data in files.items()},
                    physicalAssemblyTested=False, ironingTested=False, pdfsAuthored=False)
        with (output/'source-lock.json').open('xb') as stream: stream.write(json_bytes(lock))
        verify_prepared(output, files)
        print(json.dumps(dict(status='prepared-no-pdf', output=str(output), files=len(files), fontInventory=inventory, materials=v['materials']), ensure_ascii=False)); return
    verify_prepared(output, files)
    pdfs = [pdf_path(output, locale, paper) for locale in LOCALES for paper in PAPERS]
    if args.author_pdfs:
        assert all(not path.exists() for path in pdfs), 'Refusing to replace any PDF; use --check-only'
        for locale in LOCALES:
            for paper in PAPERS: write_pdf(v, locale, paper, pdf_path(output, locale, paper), fonts)
    results = [validate_pdf(v, locale, paper, pdf_path(output, locale, paper), fonts) for locale in LOCALES for paper in PAPERS]
    source_checks(); verify_prepared(output, files)
    print(json.dumps(dict(status='pdfs-verified', preparedFiles=len(files), pdfs=results, fontInventory=inventory, sourceFilesUnchanged=True), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

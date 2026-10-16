"""Offline, exclusive Cherries downloads; no old asset or font is refreshed.

Font audit and source/layout checks are read-only. PDF creation requires the
root's separately successful marker and independently reviewed rows/RGBA lock.
The immutable source pack and actual editor conversion are the only art inputs.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import base64
from collections import Counter
from copy import deepcopy
import csv
from hashlib import sha256
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import subprocess
from xml.sax.saxutils import escape

import pdfplumber
from PIL import Image
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
ID, SLUG, SIZE = 'original-cherries', 'cherry', 29
LOCALES = ('en', 'de', 'fr', 'ja')
BRANDS = ('perler', 'hama')
LANGUAGES = dict(zip(LOCALES, ('en-US', 'de-DE', 'fr-FR', 'ja-JP')))
PAPERS = {'a4': A4, 'letter': letter}
SITE = 'https://fusebeadpatterns.art'
FONT_NAME, FONT_FAMILY = 'FuseBeadCherriesLabels', 'Fuse Bead Cherries Labels'
FONT_FILE = FONT_NAME + '-Regular.ttf'
FONT_DIR = ROOT / 'scripts/fonts/cherries-labels'
OUTPUT_NAME = 'generated-cherries-downloads'
BASE_PATH = ROOT / 'scripts/build-multiboard-pattern-downloads.py'
BASE_SHA = 'a3d52c7793d0d260e53dae5d86e8800fe6d78a596628584195e2f91d9f9cc8b5'
INPUT_PINS = {
    'public/palettes/perler.csv': '6257da5908b11ac1cb67328a122e8bb8b439780528554cfc4a60e5ac2468b0a4',
    'public/palettes/hama.csv': 'e08218d7483d5be6eca27958f20a2e752d81a5b12f0150653cd8fd958e97effc',
    'src/lib/editor/pattern-palette.ts': 'a4f4608f363a93a31e2a1506d6ec3054e2765566b13e100c456b7881d91d31e8',
    'src/lib/editor/pattern-quantization.ts': 'ad4a0da1b3f31ecfb2a00217f572a6de3245c87f965bd95a75687000badfe549',
    'src/lib/editor/quantization-protocol.ts': 'ca210e7ad2883aafd57c028d4507d2a5112a4b205d909604be114472f6778689',
    'src/lib/editor/config.ts': 'cbf9eeba7ddb97e884b2a512b53d4c7e14786910a155ecf6b8b731c8f8339d8a',
    'src/lib/editor/palette-state.ts': 'b2caac80b1ee285b704142be5788761106e7efb1724efb7a8470781c3bcf60f4',
    'src/lib/editor/draft.ts': 'fb7ebd1e4cff828ed9118ca22b9af4126bf49dae548d4b95613c51701115541f',
    'src/lib/core/utils/utils.ts': '7d801b94ede6acbaac51a6b98ed2ba05c15b9d05f29107304a4f9685a711b3da',
    'src/lib/core/model/matching/matching.model.ts': '0e260f12fd9607a427bb32ce689f20495d6f5fdaad18a5984654bf3a10e451ac',
    'src/lib/core/model/color/lab.model.ts': 'b48b9416721ac8d78f10fe037ab155d4eaed9c97fe1bc38a8ad4e635cac7ca43',
}
assert sha256(BASE_PATH.read_bytes()).hexdigest() == BASE_SHA, 'Frozen helper changed; review first'
_spec = importlib.util.spec_from_file_location('_cherries_frozen_helpers', BASE_PATH)
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)
digest, json_bytes, safe_location = base.digest, base.json_bytes, base.safe_location
INK, MUTED = '#25342e', '#59655f'
COPY = {
    'en': dict(name='Cherries', type='{brand} Bead Pattern',
        grid='29 x 29 grid / {width} x {height} motif / {beads} beads / {colors} colors',
        materials='{brand} materials', header='Symbol / color ref / product name: EN', count='Count',
        blank='Empty cells need no beads. Each symbol means its listed bead color.',
        color='Screen and print colors are approximate. Check the product color refs.',
        physical='Original digital design. Physical assembly and ironing have not been tested.',
        board='Use one 29 x 29 Midi board. Follow the bead manufacturer\'s ironing instructions.',
        print='{paper}: print at 100% / Actual size. Turn off "Fit to page".',
        scale='Both rulers must measure 50 mm. Check 5 mm spacing against your Midi board.',
        chart='Counting PNG only; use the calibrated PDF for actual-size printing.',
        codes='H is the editor prefix for Hama color numbers.',
        hamaSelection='Fixed opaque Hama colors. Full-palette conversion may choose others. Printed colors are approximate.', detail='Pattern and editor'),
    'de': dict(name='Kirschen', type='{brand}: Bügelperlen-Vorlage',
        grid='29 x 29 Raster / {width} x {height} Motiv / {beads} Perlen / {colors} Farben',
        materials='Materialliste: {brand}', header='Symbol / Farbnummer / Produktname: EN', count='Anzahl',
        blank='Leere Felder bleiben ohne Perle. Das Symbol bestimmt die Perlenfarbe.',
        color='Bildschirm- und Druckfarben sind Näherungen. Farbnummern prüfen.',
        physical='Originales digitales Motiv. Bau und Bügeln sind ungeprüft.',
        board='Eine Midi-Platte mit 29 x 29 Stiften verwenden. Nach der Herstelleranleitung bügeln.',
        print='{paper}: 100% / Tatsächliche Größe. "An Seite anpassen" ausschalten.',
        scale='Beide Messlinien müssen 50 mm messen. Das 5-mm-Raster an der Midi-Platte prüfen.',
        chart='PNG zum Abzählen. Für den Druck in Originalgröße das kalibrierte PDF verwenden.',
        codes='H ist das Editor-Präfix für Hama-Farbnummern.',
        hamaSelection='Feste, deckende Hama-Farben. Automatische Umfärbung kann abweichen. Druckfarben sind Näherungen.', detail='Vorlage und Editor'),
    'fr': dict(name='Cerises', type='Modèle de perles {brand}',
        grid='Grille 29 x 29 / motif {width} x {height} / {beads} perles / {colors} couleurs',
        materials='Matériel : {brand}', header='Symbole / référence / nom du produit : EN', count='Quantité',
        blank='Cases vides : sans perle. Chaque symbole indique sa couleur de perle.',
        color='Les couleurs à l’écran et sur papier sont approximatives. Vérifiez les références.',
        physical='Modèle numérique original. Assemblage et repassage non testés.',
        board='Utilisez une plaque Midi de 29 x 29 picots. Suivez les consignes de repassage du fabricant.',
        print='{paper} : 100% / Taille réelle. Désactivez "Ajuster à la page".',
        scale='Les deux repères doivent mesurer 50 mm. Vérifiez le pas de 5 mm sur votre plaque Midi.',
        chart='PNG pour compter. Utilisez le PDF calibré pour imprimer à taille réelle.',
        codes='H est le préfixe de l’éditeur pour les numéros Hama.',
        hamaSelection='Couleurs Hama opaques fixes. La conversion complète peut différer. Couleurs imprimées approximatives.', detail='Modèle et éditeur'),
    'ja': dict(name='さくらんぼ', type='{brand}のアイロンビーズ図案',
        grid='29 x 29マス / 図柄{width} x {height}マス / {beads}個 / {colors}色',
        materials='{brand}の材料表', header='記号 / 色番号 / 商品色名: EN', count='個数',
        blank='空白には置きません。記号に対応する色のビーズを置きます。',
        color='画面と印刷の色は目安です。実物のビーズの色番号を確認してください。',
        physical='オリジナルのデジタル図案。実物制作とアイロンでの接合は未検証です。',
        board='29 x 29マスのミディ用プレート1枚を使い、メーカーの説明に従ってアイロンをかけます。',
        print='{paper}・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        scale='縦横の確認線は各50 mm。1マス5 mmの間隔を実物のミディ用プレートで確認。',
        chart='PNGは個数を確認する図です。実寸の印刷には確認線付きPDFを使います。',
        codes='Hはエディターで使うHama色番号の接頭辞です。',
        hamaSelection='固定した不透明なHama色です。全色からの自動変換とは異なる場合があります。印刷色は目安です。', detail='図案とエディター'),
}

# Use the same real conversion and project parser as the browser editor. Only
# local TypeScript is transpiled in memory; this bridge does not write JS files.
NODE_BRIDGE = r"""
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const resolveFilename=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...args){if(request.startsWith('.')&&!path.extname(request)&&parent?.filename){const candidate=path.resolve(path.dirname(parent.filename),request+'.ts');if(fs.existsSync(candidate))request=candidate;}return resolveFilename.call(this,request,parent,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText.replaceAll('import.meta.url',JSON.stringify(pathToFileURL(filename).href)),filename);
(async()=>{
const {getPaletteOption,parsePaletteCsv}=require('./src/lib/editor/config.ts');
const {remapPatternPalette}=require('./src/lib/editor/pattern-palette.ts');
const {parseEditorProject,serializeEditorProject}=require('./src/lib/editor/draft.ts');
const project=JSON.parse(fs.readFileSync(process.argv[1],'utf8')),draft=project.draft;
assert.ok(parseEditorProject(JSON.stringify(project)));assert.equal(draft.matchingId,'delta_e_cie2000');
const source=new Uint8ClampedArray(Buffer.from(draft.editedPattern.data,'base64'));
const target=parsePaletteCsv(fs.readFileSync('public/palettes/hama.csv','utf8'),getPaletteOption('hama'));
assert.equal(target.entries.length,92);
const excluded=[];for(const e of target.entries){if(/transparent|translucent|clear/i.test(e.name)){e.enabled=false;excluded.push({ref:e.ref,name:e.name});}}
assert.ok(excluded.length>0);
const rgba=await remapPatternPalette(source,29,29,[target],draft.matchingId,{sourcePalettes:draft.activePalettes});
const counts=new Map();for(let i=0;i<rgba.length;i+=4){assert.equal(rgba[i+3],source[i+3]);if(!rgba[i+3]){assert.deepEqual([...rgba.subarray(i,i+4)],[0,0,0,0]);continue;}const e=target.entries.find(e=>['r','g','b'].every((k,j)=>e.color[k]===rgba[i+j]));assert.ok(e);counts.set(e.ref,(counts.get(e.ref)||0)+1);}
const used=target.entries.filter(e=>counts.has(e.ref));
project.savedAt='2026-10-16T00:00:00.000Z';Object.assign(draft,{fileName:'original-cherries-hama',selectedPaletteIds:['hama'],activePalettes:[{name:'Hama Midi',entries:used}],pdfScaleMode:'midi-5mm',pdfPaperSize:'a4'});draft.editedPattern.data=Buffer.from(rgba).toString('base64');
const parsed=parseEditorProject(JSON.stringify(project));assert.ok(parsed);assert.deepEqual(parseEditorProject(serializeEditorProject(parsed)),parsed);
assert.ok(used.every(e=>e.enabled && !/transparent|translucent|clear/i.test(e.name)));
process.stdout.write(JSON.stringify({project,rgba:Buffer.from(rgba).toString('base64'),materials:used.map(e=>({ref:e.ref,name:e.name,symbol:e.symbol,rgb:['r','g','b'].map(k=>e.color[k]),hex:'#'+Buffer.from(['r','g','b'].map(k=>e.color[k])).toString('hex'),count:counts.get(e.ref)})),matchingId:draft.matchingId,targetEntries:target.entries.length,excluded,selection:'fixed-opaque-hama; transparent|translucent|clear disabled before editor remap'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
"""


def palette_csv(brand):
    with (ROOT/'public/palettes'/(brand+'.csv')).open(newline='') as source:
        return {r[0]: dict(name=r[1], rgb=[int(v) for v in r[3:6]]) for r in csv.reader(source)}


def detail_url(locale, brand):
    return SITE + ('' if locale == 'en' else '/'+locale) + '/patterns/'+SLUG + ('#hama-midi' if brand == 'hama' else '')


def folder(locale, brand):
    if brand == 'hama':
        return Path('patterns-hama')/ID/locale
    return Path('patterns' if locale == 'en' else 'patterns-'+locale)/ID


def text(p, locale, key, paper='a4'):
    if p['brand'] == 'hama' and key == 'color': key='hamaSelection'
    return COPY[locale][key].format(brand='Perler Midi' if p['brand'] == 'perler' else 'Hama Midi',
        width=p['bounds']['width'], height=p['bounds']['height'], beads=p['beads'], colors=p['colorCount'],
        paper='A4' if paper == 'a4' else 'US Letter')


def load_patterns(pack, node, review_lock=None, hama_review_lock=None):
    for name,expected in INPUT_PINS.items():
        assert digest((ROOT/name).read_bytes()) == expected, 'Frozen conversion input changed: '+name
    pack = safe_location(pack)
    assert pack.name == 'original-cherries-v1' and 'artifacts' in pack.parts
    source = json.loads((pack/'manifest.json').read_text())
    assert len(source['patterns']) == 1
    p = deepcopy(source['patterns'][0])
    assert (p['id'], p['slug'], p['title'], p['kind'], p['source']) == (ID, SLUG, 'Cherries', 'original', None)
    assert p['localizedSubjects'] == {loc:COPY[loc]['name'] for loc in ('de','fr','ja')}
    assert (p['width'],p['height']) == (SIZE,SIZE)
    assert len(p['rows']) == SIZE and all(isinstance(r,str) and len(r) == SIZE for r in p['rows'])
    counts = Counter(''.join(p['rows']).replace('.',''))
    assert set(counts) == set(p['palette']) and 1 <= len(counts) <= 8
    assert p['materials'] == list(p['palette'].values())
    actual = palette_csv('perler')
    for symbol,c in p['palette'].items():
        assert len(symbol) == 1 and symbol != '.' and c['symbol'] == symbol and c['count'] == counts[symbol]
        assert c['name'] == actual[c['ref']]['name'] and c['rgb'] == actual[c['ref']]['rgb']
        assert c['hex'] == '#'+bytes(c['rgb']).hex()
    assert len({tuple(c['rgb']) for c in p['palette'].values()}) == len(counts)
    assert p['beads'] == sum(counts.values()) and p['colorCount'] == len(counts)
    rgba = bytes(c for row in p['rows'] for symbol in row for c in (p['palette'][symbol]['rgb']+[255] if symbol != '.' else [0,0,0,0]))
    p.update(brand='perler',rgba=rgba,rowsSha256=digest('\n'.join(p['rows']).encode()),rgbaSha256=digest(rgba))
    if review_lock:
        lock = json.loads(safe_location(review_lock).read_text())
        assert set(lock) == {ID}
        assert all(lock[ID][k] == p[k] for k in ('rowsSha256','rgbaSha256')), 'Independent review lock differs'
    with Image.open(pack/'pixels'/(ID+'.png')) as image:
        assert image.mode == 'RGBA' and image.size == (SIZE,SIZE) and image.tobytes() == rgba
    project_path = pack/'projects'/(ID+'.bead-pattern.json')
    project = json.loads(project_path.read_text()); d = project['draft']
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == d['version'] == 1
    assert (d['sourceMode'],d['imageSrc']) == ('blank',None) and d['selectedPaletteIds'] == ['perler']
    assert (d['boardId'],d['boardWidth'],d['boardHeight'],d['matchingId']) == ('midi',1,1,'delta_e_cie2000')
    assert d['pdfScaleMode'] == 'midi-5mm'
    assert (d['editedPattern']['width'],d['editedPattern']['height'],d['editedPattern']['byteLength']) == (SIZE,SIZE,len(rgba))
    assert base64.b64decode(d['editedPattern']['data'],validate=True) == rgba
    assert len(d['activePalettes']) == 1 and d['activePalettes'][0]['name'] == 'Perler Midi'
    entries = {c['ref']:c for c in d['activePalettes'][0]['entries']}
    assert set(entries) == {c['ref'] for c in p['palette'].values()}
    for c in p['palette'].values():
        e = entries[c['ref']]
        assert e['name'] == c['name'] and e['symbol'] == c['symbol'] and e['enabled'] is True
        assert e['color'] == dict(zip(('r','g','b','a'),c['rgb']+[255]))
    p['project'],p['projectSha256'] = project,digest(project_path.read_bytes())
    p['occupied'] = {(x,y):p['palette'][s] for y,row in enumerate(p['rows']) for x,s in enumerate(row) if s != '.'}
    xs,ys = zip(*p['occupied'])
    assert p['bounds'] == dict(x=min(xs),y=min(ys),width=max(xs)-min(xs)+1,height=max(ys)-min(ys)+1)
    assert base.components(p['occupied']) == [p['beads']]
    for key in ('physicalAssemblyTested','ironingTested','hangingTested','loadStrengthTested'):
        assert p[key] is False and p['validation'][key] is False
    converted = json.loads(subprocess.run([node,'-e',NODE_BRIDGE,str(project_path)],cwd=ROOT,capture_output=True,check=True).stdout)
    h = deepcopy(p); h['brand'] = 'hama'; h['rgba'] = base64.b64decode(converted['rgba'],validate=True)
    assert len(h['rgba']) == len(rgba) and h['rgba'][3::4] == rgba[3::4]
    colors = converted['materials']; actual = palette_csv('hama')
    assert 1 <= len(colors) <= 8 and len({c['symbol'] for c in colors}) == len(colors)
    assert sum(c['count'] for c in colors) == p['beads'] and converted['targetEntries'] == len(actual) == 92
    for c in colors:
        assert c['name'] == actual[c['ref']]['name'] and c['rgb'] == actual[c['ref']]['rgb']
        assert c['ref'].startswith('H') and len(c['symbol']) == 1 and c['symbol'] != '.'
        assert c['hex'] == '#'+bytes(c['rgb']).hex()
    by_rgb = {tuple(c['rgb']):c for c in colors}
    assert len(by_rgb) == len(colors)
    h['palette'] = {c['symbol']:c for c in colors}; h['materials'] = colors; h['colorCount'] = len(colors)
    h['occupied'] = {(i%SIZE,i//SIZE):by_rgb[tuple(h['rgba'][i*4:i*4+3])] for i in range(SIZE*SIZE) if h['rgba'][i*4+3]}
    assert set(h['occupied']) == set(p['occupied'])
    assert Counter(c['ref'] for c in h['occupied'].values()) == {c['ref']:c['count'] for c in colors}
    h['rows'] = [''.join(h['occupied'][(x,y)]['symbol'] if (x,y) in h['occupied'] else '.' for x in range(SIZE)) for y in range(SIZE)]
    h['rgbaSha256'], h['rowsSha256'] = digest(h['rgba']),digest('\n'.join(h['rows']).encode())
    h['project'] = converted['project']; h['projectSha256'] = digest(json_bytes(h['project']))
    h['excludedColors'],h['colorSelection'] = converted['excluded'],converted['selection']
    if hama_review_lock:
        lock=json.loads(safe_location(hama_review_lock).read_text())
        assert set(lock) == {ID+'-hama'}
        reviewed=lock[ID+'-hama']
        assert reviewed['rowsSha256'] == p['rowsSha256'] and reviewed['rgbaSha256'] == h['rgbaSha256'], 'Reviewed fixed Hama variant changed'
        assert set(reviewed['excludedRefs']) == {c['ref'] for c in h['excludedColors']}
    return [p,h]


def pdf_entries(p, locale, paper):
    width,height = (v/mm for v in PAPERS[paper]); col_width = (width-42)/2
    entries = [dict(x=18,y=13,value='FUSE BEAD PATTERNS',size=8),
        dict(x=width-18,y=13,value=text(p,locale,'type'),size=7,right=True,maxMm=91),
        dict(x=18,y=25,value=COPY[locale]['name'],size=16),
        dict(x=18,y=35,value=text(p,locale,'grid'),size=8.1),
        dict(x=18,y=196,value=text(p,locale,'materials'),size=9)]
    for col in range(2):
        x=18+col*(col_width+6)
        entries.extend([dict(x=x,y=202,value=text(p,locale,'header'),size=6.2,maxMm=col_width-13),
            dict(x=x+col_width,y=202,value=text(p,locale,'count'),size=6.1,right=True,maxMm=13)])
    for num,c in enumerate(p['palette'].values()):
        col,row=divmod(num,(len(p['palette'])+1)//2); x=18+col*(col_width+6); y=209+row*6
        entries.extend([dict(x=x+5,y=y,value=c['symbol'],size=7.2,maxMm=5),
            dict(x=x+13,y=y,value=c['ref'],size=6.7,maxMm=24),
            dict(x=x+37,y=y,value=c['name'],size=6.7,maxMm=col_width-48),
            dict(x=x+col_width,y=y,value=str(c['count']),size=6.7,right=True,maxMm=10)])
    for key,y in [('blank',233),('color',238),('physical',243),('print',249),('scale',265)]:
        entries.append(dict(x=18,y=y,value=text(p,locale,key,paper),size=7.2))
    entries.extend([dict(x=73,y=257.8,value='50 mm',size=8,maxMm=20),
        dict(x=width-12,y=195,value='50 mm',size=7,right=True,maxMm=18),
        dict(x=18,y=height-9,value=text(p,locale,'detail'),size=7,maxMm=45),
        dict(x=width-18,y=height-9,value=detail_url(locale,p['brand']).split('#')[0].removeprefix('https://'),size=6.5,right=True,maxMm=125)])
    return entries


def inventory(patterns=None):
    values = [chr(i) for i in range(32,127)]
    if patterns:
        for p in patterns:
            for locale in LOCALES:
                values.extend(text(p,locale,k) for k in COPY[locale])
                for paper in PAPERS: values.extend(e['value'] for e in pdf_entries(p,locale,paper))
                values.extend(c['name']+c['ref']+c['symbol'] for c in p['palette'].values())
    else:
        for c in COPY.values(): values.extend(c.values())
        for brand in BRANDS: values.extend(c['name'] for c in palette_csv(brand).values())
    chars=''.join(sorted(set(''.join(values))))
    return dict(characters=chars,count=len(chars),sha256=digest(chars.encode()))


def audit_fonts(required):
    results=[]; union=set()
    for i,path in enumerate(sorted((ROOT/'scripts/fonts').rglob('*.ttf'))+sorted((ROOT/'public/fonts').rglob('*.ttf'))):
        font=TTFont('CherriesAudit'+str(i),str(path)); available={c for c,g in font.face.charToGlyph.items() if g}
        union.update(available); missing=''.join(c for c in required['characters'] if ord(c) not in available)
        results.append(dict(path=str(path.relative_to(ROOT)),sha256=digest(path.read_bytes()),missing=missing,missingCount=len(missing),coversAll=not missing))
    return dict(required=required,fonts=results,completeCandidates=[r['path'] for r in results if r['coversAll']],
        missingFromEveryExistingFont=''.join(c for c in required['characters'] if ord(c) not in union),pdfCreated=False)


def prepare_font(required, source_font, source_license):
    from fontTools import subset,__version__
    from fontTools.ttLib import TTFont as FontToolsFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.boundsPen import BoundsPen
    assert __version__ == '4.60.1' and not FONT_DIR.exists()
    assert not any(p.is_symlink() for p in (FONT_DIR,*FONT_DIR.parents))
    original,license_bytes=source_font.read_bytes(),source_license.read_bytes()
    assert digest(original) == base.PIN['fontSha256'] and digest(license_bytes) == base.PIN['licenseSha256']
    f=FontToolsFont(io.BytesIO(original),recalcTimestamp=False); instantiateVariableFont(f,{'wght':400},inplace=True)
    options=subset.Options(); options.name_IDs=['*']; options.name_legacy=True; options.name_languages=['*']; options.recalc_timestamp=False
    sub=subset.Subsetter(options=options); sub.populate(text=required['characters']); sub.subset(f)
    names={1:FONT_FAMILY,2:'Regular',3:FONT_NAME+'-Regular-1',4:FONT_FAMILY+' Regular',6:FONT_NAME+'-Regular',16:FONT_FAMILY,17:'Regular'}
    for item in f['name'].names:
        if item.nameID in names: item.string=names[item.nameID].encode(item.getEncoding())
    cmap,glyph_set,glyphs=f.getBestCmap(),f.getGlyphSet(),{}
    for char in required['characters']:
        assert cmap.get(ord(char),'.notdef') != '.notdef', repr(char)
        name=cmap[ord(char)]; pen=SVGPathPen(glyph_set); glyph_set[name].draw(pen)
        bounds=BoundsPen(glyph_set); glyph_set[name].draw(bounds)
        glyphs[char]=dict(advance=f['hmtx'].metrics[name][0],bounds=bounds.bounds,path=pen.getCommands())
    glyph_bytes=json_bytes(dict(unitsPerEm=f['head'].unitsPerEm,glyphs=glyphs)); target=io.BytesIO(); f.save(target); font_bytes=target.getvalue()
    lock=dict(base.PIN,derivativeFamily=FONT_FAMILY,weight=400,fonttoolsVersion=__version__,
        subsetPurpose='Only original Cherries EN/DE/FR/JA Perler/Hama downloads; no prior font refresh',
        subsetSha256=digest(font_bytes),glyphsSha256=digest(glyph_bytes),characters=required['characters'],
        charactersSha256=required['sha256'],characterCount=required['count'],patternIds=[ID],pdfCount=16,chartCount=8,
        upstreamReadOffline=True,layoutDependencySha256=BASE_SHA)
    FONT_DIR.mkdir()
    for name,data in [(FONT_FILE,font_bytes),('glyphs.json',glyph_bytes),('OFL.txt',license_bytes),('source.json',json_bytes(lock))]:
        with (FONT_DIR/name).open('xb') as handle: handle.write(data)
    return dict(status='font-created',path=str(FONT_DIR),bytes=len(font_bytes),lock=lock,pdfCreated=False)


def read_font(required):
    lock=json.loads((FONT_DIR/'source.json').read_text())
    assert all(lock[k] == v for k,v in base.PIN.items())
    assert lock['derivativeFamily'] == FONT_FAMILY and lock['fonttoolsVersion'] == '4.60.1' and lock['patternIds'] == [ID]
    assert lock['layoutDependencySha256'] == BASE_SHA
    assert digest((FONT_DIR/FONT_FILE).read_bytes()) == lock['subsetSha256']
    assert digest((FONT_DIR/'OFL.txt').read_bytes()) == base.PIN['licenseSha256']
    assert digest((FONT_DIR/'glyphs.json').read_bytes()) == lock['glyphsSha256']
    assert digest(lock['characters'].encode()) == lock['charactersSha256']
    pdfmetrics.registerFont(TTFont(FONT_NAME,str(FONT_DIR/FONT_FILE)))
    font=json.loads((FONT_DIR/'glyphs.json').read_text()); available=pdfmetrics.getFont(FONT_NAME).face.charToGlyph
    assert all(available.get(ord(c),0) and c in font['glyphs'] for c in required['characters'])
    return font,lock


def preflight(patterns):
    for p in patterns:
        for locale in LOCALES:
            for paper,(width,_) in PAPERS.items():
                entries=pdf_entries(p,locale,paper)
                brand_right=18*mm+pdfmetrics.stringWidth(entries[0]['value'],FONT_NAME,8)
                type_left=width-18*mm-pdfmetrics.stringWidth(entries[1]['value'],FONT_NAME,7)
                assert brand_right < type_left
                for e in entries:
                    assert pdfmetrics.stringWidth(e['value'],FONT_NAME,e['size']) <= e.get('maxMm',width/mm-36)*mm,(p['brand'],locale,paper,e)
    return dict(pdfCount=16,pdfPages=16,textFits=True,pdfCreated=False)


def write_pdf(p,locale,paper,destination):
    destination.parent.mkdir(parents=True,exist_ok=True)
    with destination.open('xb') as handle:
        width,height=PAPERS[paper]; x0,top,pitch=(width/mm-145)/2,42,5
        pdf=canvas.Canvas(handle,pagesize=PAPERS[paper],invariant=1,pageCompression=1,initialFontName=FONT_NAME,initialFontSize=8,lang=LANGUAGES[locale])
        pdf.setTitle(COPY[locale]['name']+' - '+text(p,locale,'type')); pdf.setAuthor('Fuse Bead Patterns team')
        pdf.setSubject(f'{locale}; {p["brand"]} Midi; 29 x 29; 5 mm; {paper}; 100%'); pdf.setViewerPreference('PrintScaling','None')
        def line(x1,y1,x2,y2,weight=.1,color='#a2aaa6'):
            pdf.setLineWidth(weight*mm); pdf.setStrokeColor(HexColor(color)); pdf.line(x1*mm,height-y1*mm,x2*mm,height-y2*mm)
        for (x,y),c in p['occupied'].items():
            pdf.setFillColor(HexColor(c['hex'])); pdf.rect((x0+x*pitch)*mm,height-(top+(y+1)*pitch)*mm,pitch*mm,pitch*mm,fill=1,stroke=0)
            pdf.setFillColor(HexColor('#ffffff' if sum(v*w for v,w in zip(c['rgb'],(.299,.587,.114)))<150 else INK)); pdf.setFont(FONT_NAME,7)
            pdf.drawCentredString((x0+(x+.5)*pitch)*mm,height-(top+(y+.5)*pitch)*mm-2.2,c['symbol'])
        for i in range(30):
            weight,color=(.23,'#65736b') if i%5 == 0 or i == 29 else (.1,'#a2aaa6')
            line(x0+i*5,top,x0+i*5,187,weight,color); line(x0,top+i*5,x0+145,top+i*5,weight,color)
        pdf.setFont(FONT_NAME,5.5); pdf.setFillColor(HexColor(MUTED))
        for i in range(29):
            pdf.drawCentredString((x0+(i+.5)*5)*mm,height-40.5*mm,str(i+1))
            pdf.drawRightString((x0-2)*mm,height-(top+(i+.5)*5)*mm-2,str(i+1))
        col_width=(width/mm-42)/2
        for num,c in enumerate(p['palette'].values()):
            col,row=divmod(num,(len(p['palette'])+1)//2); x=18+col*(col_width+6); y=209+row*6
            pdf.setFillColor(HexColor(c['hex'])); pdf.setStrokeColor(HexColor('#8c9590')); pdf.setLineWidth(.15*mm)
            pdf.rect(x*mm,height-(y+1)*mm,3.5*mm,3.5*mm,fill=1,stroke=1)
        line(18,256.5,68,256.5,.4,INK)
        for x in (18,68): line(x,255,x,258,.4,INK)
        line(width/mm-10,200,width/mm-10,250,.4,INK)
        for y in (200,250): line(width/mm-11.5,y,width/mm-8.5,y,.4,INK)
        for e in pdf_entries(p,locale,paper):
            pdf.setFont(FONT_NAME,e['size']); pdf.setFillColor(HexColor(INK))
            (pdf.drawRightString if e.get('right') else pdf.drawString)(e['x']*mm,height-e['y']*mm,e['value'])
        pdf.linkURL(detail_url(locale,p['brand']),(18*mm,6*mm,width-18*mm,13*mm),relative=0)
        pdf.showPage(); pdf.save()


def close(a,b): return abs(a-b)<.015


def validate_pdf(p,locale,paper,path):
    width,height=PAPERS[paper]; reader=PdfReader(path)
    assert len(reader.pages) == 1 and all(close(a,b) for a,b in zip(reader.pages[0].mediabox,(0,0,width,height)))
    assert reader.trailer['/Root']['/Lang'] == LANGUAGES[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    assert reader.metadata.title == COPY[locale]['name']+' - '+text(p,locale,'type')
    assert [a.get_object()['/A']['/URI'] for a in reader.pages[0]['/Annots']] == [detail_url(locale,p['brand'])]
    for item in reader.pages[0]['/Resources']['/Font'].values():
        f=item.get_object(); assert FONT_NAME in f['/BaseFont'] and f['/FontDescriptor']['/FontFile2'].get_data() and f['/ToUnicode'].get_data()
    with pdfplumber.open(path) as document:
        page=document.pages[0]; compact=re.sub(r'\s+','',page.extract_text())
        assert not any(v in compact for v in ('(cid:','\ufffd','\u25a0'))
        for e in pdf_entries(p,locale,paper): assert re.sub(r'\s+','',e['value']) in compact
        assert all(c['x0'] >= 17*mm and c['x1'] <= width-7*mm and c['top'] >= 8*mm and c['bottom'] <= height-6*mm for c in page.chars)
        x0=(width/mm-145)/2; cells={}; symbols={}
        for r in page.rects:
            if close(r['width'],5*mm) and close(r['height'],5*mm):
                x,y=round((r['x0']/mm-x0)/5),round((r['top']/mm-42)/5)
                assert (x,y) not in cells and 0 <= x < 29 and 0 <= y < 29
                assert close(r['x0'],(x0+x*5)*mm) and close(r['top'],(42+y*5)*mm)
                cells[x,y]=tuple(round(v*255) for v in r['non_stroking_color'])
        assert cells == {xy:tuple(c['rgb']) for xy,c in p['occupied'].items()}
        for c in page.chars:
            if 42*mm <= c['top'] < 187*mm and x0*mm <= c['x0'] < (x0+145)*mm:
                x=round(((c['x0']+c['x1'])/2/mm-x0-2.5)/5); y=int((c['top']/mm-42)//5)
                assert (x,y) not in symbols and close(c['size'],7)
                assert close((c['x0']+c['x1'])/2,(x0+(x+.5)*5)*mm)
                assert close(c['y0'],height-(42+(y+.5)*5)*mm-2.2+pdfmetrics.getDescent(FONT_NAME,7))
                symbols[x,y]=c['text']
        assert symbols == {xy:c['symbol'] for xy,c in p['occupied'].items()}
        restored=bytes(v for y in range(29) for x in range(29) for v in (list(cells[x,y])+[255] if (x,y) in cells else [0,0,0,0]))
        assert restored == p['rgba'], 'All 841 cells must restore exact native RGBA'
        for i in range(29):
            labels_x=[c for c in page.chars if 38*mm<c['top']<41*mm and close(c['size'],5.5)]
            labels_y=[c for c in page.chars if (x0-7)*mm<c['x0']<(x0-1)*mm and 42*mm<c['top']<187*mm and close(c['size'],5.5)]
            x=(x0+(i+.5)*5)*mm; y=(42+(i+.5)*5)*mm
            col=''.join(c['text'] for c in sorted(labels_x,key=lambda c:c['x0']) if abs((c['x0']+c['x1'])/2-x)<2.2*mm)
            row=''.join(c['text'] for c in sorted(labels_y,key=lambda c:c['x0']) if abs((c['top']+c['bottom'])/2-y)<2.2*mm)
            assert col == row == str(i+1), ('Missing row/column label',i,col,row)
        for i in range(30):
            for expected in [(x0+i*5,42,x0+i*5,187),(x0,42+i*5,x0+145,42+i*5)]:
                assert any(all(close(v,e*mm) for v,e in zip((l['x0'],l['top'],l['x1'],l['bottom']),expected)) for l in page.lines)
        assert any(close(l['x0'],18*mm) and close(l['x1'],68*mm) and close(l['top'],256.5*mm) and close(l['height'],0) for l in page.lines)
        assert any(close(l['x0'],width-10*mm) and close(l['top'],200*mm) and close(l['bottom'],250*mm) and close(l['width'],0) for l in page.lines)
        col_width=(width/mm-42)/2
        for num,c in enumerate(p['palette'].values()):
            col,row=divmod(num,(len(p['palette'])+1)//2); x=18+col*(col_width+6); y=209+row*6
            block=page.crop((x*mm,(y-4)*mm,(x+col_width+1)*mm,(y+1)*mm)).extract_text()
            assert all(v in block for v in (c['symbol'],c['ref'],c['name'])) and re.search(rf'\b{c["count"]}\b',block)
    return dict(path=path.as_posix(),sha256=digest(path.read_bytes()),brand=p['brand'],locale=locale,paper=paper,pages=1,beads=p['beads'],colors=p['colorCount'],all841CellsExact=True,gridPitchMm=5,rulersMm=[50,50],language=LANGUAGES[locale],printScaling='None',embeddedFont=True,physicalTested=False)


def chart_svg(p,locale,font):
    width,margin,cell,top=788,46,24,54; end=top+SIZE*cell; body=[]; glyph_ids={}
    def label(value,x,y,size=16,max_width=696,anchor='left',fill=INK):
        assert base.text_width(value,size,font)<=max_width,(locale,value)
        body.append(base.path_text(value,x,y,size,font,fill,anchor,glyph_ids))
    label(COPY[locale]['name'],46,28,23)
    for (x,y),c in p['occupied'].items(): body.append(f'<rect x="{margin+x*cell}" y="{top+y*cell}" width="24" height="24" fill="{c["hex"]}"/>')
    for i in range(30):
        pos=i*cell; major=i%5 == 0 or i == 29
        body.append(f'<path d="M{margin+pos},{top}V{end}M{margin},{top+pos}H{margin+SIZE*cell}" stroke="{"#65736b" if major else "#a2aaa6"}" stroke-width="{1.3 if major else .6}" fill="none"/>')
    for i in range(29):
        label(str(i+1),margin+(i+.5)*cell,46,10,24,'middle'); label(str(i+1),28,top+(i+.5)*cell+3,10,24,'middle')
    for (x,y),c in p['occupied'].items():
        fill='#ffffff' if sum(v*w for v,w in zip(c['rgb'],(.299,.587,.114)))<150 else INK
        label(c['symbol'],margin+(x+.5)*cell,top+(y+.5)*cell+4,10,24,'middle',fill)
    y=end+35
    for key in ('type','grid','materials'):
        for line in base.wrapped(text(p,locale,key),17,696,font): label(line,46,y,17); y+=25
    for c in p['palette'].values():
        label(f"{c['symbol']}: {c['name']} {c['ref']} ({c['count']})",46,y,16); y+=25
    for key in ('blank','color','physical','chart')+ (('codes',) if p['brand'] == 'hama' else ()):
        for line in base.wrapped(text(p,locale,key),15,696,font): label(line,46,y,15); y+=23
        y+=5
    height=int(y+15)
    defs='<defs>'+''.join(f'<path id="{g}" d="{font["glyphs"][c]["path"]}"/>' for c,g in glyph_ids.items())+'</defs>'
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" xml:lang="{locale}" role="img"><title>{escape(COPY[locale]["name"]+" - "+text(p,locale,"type"))}</title><desc>{escape(text(p,locale,"grid"))}</desc>{defs}<rect width="100%" height="100%" fill="white"/>'+''.join(body)+'</svg>'
    assert '<text' not in svg and '<image' not in svg and '<script' not in svg
    return svg.encode(),dict(width=width,height=height)


def png_bytes(image):
    target=io.BytesIO(); image.save(target,format='PNG'); return target.getvalue()


def generated_assets(patterns,font,node):
    files={}; charts=[]
    for p in patterns:
        for locale in LOCALES:
            where=folder(locale,p['brand']); svg,layout=chart_svg(p,locale,font); png=base.svg_png(svg,node)
            with Image.open(io.BytesIO(png)) as image:
                rgba=image.convert('RGBA'); assert rgba.size == (layout['width'],layout['height'])
                assert rgba.getchannel('A').getextrema() == (255,255)
                for y in range(29):
                    for x in range(29):
                        expected=tuple(p['occupied'][x,y]['rgb'])+(255,) if (x,y) in p['occupied'] else (255,255,255,255)
                        assert rgba.getpixel((46+x*24+4,54+y*24+4)) == expected
            files[where/'grid.svg'],files[where/'grid.png']=svg,png
            charts.append(dict(brand=p['brand'],locale=locale,href='/'+(where/'grid.png').as_posix(),**layout,svgSha256=digest(svg),pngSha256=digest(png),all841CellsExact=True,allPixelsOpaque=True,outlinedGlyphs=True,actualSizeTemplate=False))
        if p['brand'] == 'hama':
            where=Path('patterns-hama')/ID; image=Image.frombytes('RGBA',(29,29),p['rgba'])
            files[where/'pixels.png']=png_bytes(image)
            preview=Image.new('RGBA',(29,29),(221,216,202,255)); preview.alpha_composite(image)
            files[where/'preview.png']=png_bytes(preview.resize((580,580),Image.Resampling.NEAREST).convert('RGB'))
            files[where/'pattern.bead-pattern.json']=json_bytes(p['project'])
    return files,charts


def downloads(patterns,output,font,font_lock,checking,node):
    files,charts=generated_assets(patterns,font,node); pdf_checks=[]; expected=set(files)
    for p in patterns:
        for locale in LOCALES:
            for paper in PAPERS:
                relative=folder(locale,p['brand'])/('pattern.pdf' if paper == 'a4' else 'pattern-letter.pdf'); destination=output/relative; expected.add(relative)
                if not checking: write_pdf(p,locale,paper,destination)
                check=validate_pdf(p,locale,paper,destination); check['path']=relative.as_posix(); pdf_checks.append(check)
    for relative,data in files.items():
        path=output/relative
        if checking: assert path.read_bytes() == data, 'Changed generated asset: '+str(relative)
        else:
            path.parent.mkdir(parents=True,exist_ok=True)
            with path.open('xb') as handle: handle.write(data)
    manifest=dict(id=ID,slug=SLUG,pdfCount=16,pdfPageCount=16,chartCount=8,fontSha256=font_lock['subsetSha256'],layoutHelperSha256=BASE_SHA,conversionInputPins=INPUT_PINS,
        source=[dict({k:p[k] for k in ('brand','rowsSha256','rgbaSha256','projectSha256','beads','colorCount','bounds','materials')},
            **({k:p[k] for k in ('excludedColors','colorSelection')} if p['brand'] == 'hama' else {})) for p in patterns],
        pdfs=pdf_checks,charts=charts,physicalAssemblyTested=False,ironingTested=False,
        promote=[dict(path=r.as_posix(),sha256=digest((output/r).read_bytes()),bytes=(output/r).stat().st_size) for r in sorted(expected)],
        excludeFromPromotion=['downloads-manifest.json'],sourcePackAssetsPromotedSeparately=True)
    encoded=json_bytes(manifest); path=output/'downloads-manifest.json'
    if checking: assert path.read_bytes() == encoded, 'Changed output manifest'
    else:
        with path.open('xb') as handle: handle.write(encoded)
    expected.add(Path('downloads-manifest.json'))
    assert {p.relative_to(output) for p in output.rglob('*') if p.is_file()} == expected, 'Unexpected or missing output files'
    assert not any(p.is_symlink() for p in output.rglob('*'))
    return dict(status='checked' if checking else 'created',output=str(output),pdfCount=16,pdfPageCount=16,chartCount=8,promoteFiles=len(expected)-1,manifestSha256=digest(encoded),physicalTested=False)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack',type=Path); parser.add_argument('--output',type=Path); parser.add_argument('--review-lock',type=Path)
    parser.add_argument('--hama-review-lock',type=Path)
    parser.add_argument('--source-font',type=Path); parser.add_argument('--source-license',type=Path); parser.add_argument('--node',default='node')
    parser.add_argument('--pdf-marker-confirmed',action='store_true',help='Root has successfully marked this 16-file PDF operation')
    modes=parser.add_mutually_exclusive_group(); modes.add_argument('--font-audit',action='store_true'); modes.add_argument('--prepare-font',action='store_true'); modes.add_argument('--check-only',action='store_true')
    args=parser.parse_args()
    if not (args.font_audit or args.prepare_font or args.check_only): assert args.pdf_marker_confirmed, 'Root marker confirmation required before authoring'
    patterns=load_patterns(args.pack,args.node,args.review_lock,args.hama_review_lock) if args.pack else None; required=inventory(patterns)
    if args.font_audit: print(json.dumps(audit_fonts(required),ensure_ascii=False)); return
    if args.prepare_font:
        assert args.source_font and args.source_license
        print(json.dumps(prepare_font(required,args.source_font,args.source_license),ensure_ascii=False)); return
    assert patterns, '--pack is required'
    font,lock=read_font(required); checks=preflight(patterns)
    if args.check_only and not args.output:
        print(json.dumps(dict(status='source-and-layout-preflight',independentReviewLocked=bool(args.review_lock),hamaReviewLocked=bool(args.hama_review_lock),brands=[dict(brand=p['brand'],beads=p['beads'],colorCount=p['colorCount'],materials=p['materials'],rgbaSha256=p['rgbaSha256']) for p in patterns],**checks),ensure_ascii=False)); return
    assert args.output and args.review_lock and args.hama_review_lock, 'Output requires both independent review locks'
    output=safe_location(args.output,writing=not args.check_only)
    pack=safe_location(args.pack).resolve()
    assert output.name == OUTPUT_NAME, 'Use the dedicated generated-cherries-downloads directory in external private staging'
    assert not output.is_relative_to(pack), 'The immutable source pack must not contain generated downloads'
    if args.check_only: assert output.is_dir() and not any(p.is_symlink() for p in output.rglob('*'))
    else: output.mkdir(mode=0o700)
    old_umask=os.umask(0o077)
    try: result=downloads(patterns,output,font,lock,args.check_only,args.node)
    finally: os.umask(old_umask)
    print(json.dumps(result,ensure_ascii=False))


if __name__ == '__main__': main()

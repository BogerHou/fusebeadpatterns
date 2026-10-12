"""Exclusive Hama Creeper variant: prepare without PDFs, author after the PDF marker.

Existing Perler assets, six original Hama variants, source IP state and fonts are
read-only. All source/target hashes below were reviewed independently. The
--check-only mode reads and verifies, never regenerates a file or a font.
"""
import sys
sys.dont_write_bytecode = True
import argparse
import base64
from collections import Counter
from copy import deepcopy
import csv
from hashlib import sha256
import io
import json
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
ID = 'minecraft-creeper-face-v1'
VARIANT_ID = ID + '-hama'
SITE = 'https://fusebeadpatterns.art'
FOLDER = Path('patterns-hama-characters') / ID
LOCALES = ('en', 'de', 'fr', 'ja')
PAPERS = {'a4': A4, 'letter': letter}
LANGUAGES = {'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}
SOURCE_FILES = {
    'pattern.bead-pattern.json': 'e3f3b5a289e9d18683a114716e29bec2996fc3abbea4ea474059409e7786ebed',
    'pixels.png': 'b8d6361a2828844905f0deb71cd7abf67847b2ade46443783f5e3f05ef169492',
    'preview.png': '9ecba5c40855506625a393bd63041bcfe8435a597606fc70bacd763ba344d97e',
}
SOURCE_RGBA_SHA = 'e477959de42ffdfa5c8f37dc19661e2da916b0961a3c5c4064c1daf52ac4c3c8'
ALPHA_SHA = 'ba0bb57e1c360adeebd2dc65c3ce947d10c33cf9aabc56f2b93ff89ced0ab962'
HAMA_RGBA_SHA = 'edaceb76db49f76728cf18981146a3df88678e7a3508be3b4d434343d49ea389'
# Fixed ordinary solid colors, independently confirmed against Hama's chart.
COLOR_MAP = {'80-19080': 'H10', '80-19018': 'H18', '80-19061': 'H47'}
TARGETS = {'H10': ('Green', '-', [2,118,67],136),
           'H18': ('Black', '4', [20,19,21],80),
           'H47': ('Pastel Green', 'R', [128,223,150],40)}
FONT_DIR = ROOT / 'scripts/fonts/creeper-fan-art-jp'
FONT_PATH = FONT_DIR / 'FuseBeadCreeperFanArtJapanese-Regular.ttf'
FONT_NAME = 'HamaCreeperReviewedLabels'
FONT_PINS = {'FuseBeadCreeperFanArtJapanese-Regular.ttf': '611d2d9ed5c092693044dd34f9c1c6cd015f083d335ab3424068183495352fe0',
             'source.json': '9e71084904db4dcb65e1a1944bffe725a9b2d941e77cef7cc298c66e5e4588a1',
             'OFL.txt': '1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9'}
INK, MUTED = '#25342e', '#59655f'
GRID_TOP = 39

COPY = {'en': {'name': 'Creeper Face',
        'type': 'Hama Midi Bead Pattern',
        'grid': '16 x 16 face / 29 x 29 grid / 1 Midi board / 256 beads / 3 colors',
        'materials': 'Hama Midi materials',
        'header': 'Symbol / Hama color number / Color name: EN',
        'count': 'Count',
        'blank': 'Empty cells need no beads. Every marked cell needs its listed color.',
        'color': 'Screen and print colors are approximate. Check color refs against your beads.',
        'physical': 'Hand-authored fan art. Not physically assembled or iron-tested.',
        'rights': 'Unofficial Minecraft fan art. Not approved by or associated with Mojang or '
                  'Microsoft.',
        'owner': 'Minecraft and Creeper character rights belong to Mojang/Microsoft.',
        'print': '{paper}: print at 100% / Actual size. Turn off "Fit to page".',
        'scale': 'Both lines must measure 50 mm. Check the 5 mm pitch against your Midi board.',
        'detail': 'Pattern and editor',
        'hama': 'Not an official Hama design.',
        'chart': 'Counting PNG only. Use the calibrated PDF for actual-size printing.'},
 'de': {'name': 'Creeper-Gesicht',
        'type': 'Hama-Midi-Vorlage',
        'grid': 'Gesicht: 16 x 16 / Raster: 29 x 29 / 1 Midi-Platte / 256 Perlen / 3 Farben',
        'materials': 'Materialliste: Hama Midi',
        'header': 'Symbol / Hama-Farbnummer / Produktfarbe: EN',
        'count': 'Anzahl',
        'blank': 'Leere Felder bleiben frei. Markierte Felder brauchen die angegebene Perlenfarbe.',
        'color': 'Druck- und Bildschirmfarben sind Näherungen. Farbnummern an den eigenen Perlen '
                 'prüfen.',
        'physical': 'Von Hand gezeichnete Fan-Art. Nicht gebaut oder bügelgetestet.',
        'rights': 'Inoffizielle Minecraft-Fan-Art. Nicht von Mojang oder Microsoft genehmigt oder '
                  'unterstützt.',
        'owner': 'Die Rechte an Minecraft und der Figur Creeper gehören Mojang/Microsoft.',
        'print': '{paper}: 100% / Tatsächliche Größe. "An Seite anpassen" ausschalten.',
        'scale': 'Beide Messlinien: 50 mm. Das Raster mit 5 mm Abstand an der Midi-Platte prüfen.',
        'detail': 'Vorlage und Editor',
        'hama': 'Keine offizielle Hama-Vorlage.',
        'chart': 'Die PNG-Datei ist kein Druck in tatsächlicher Größe. Verwende das PDF.'},
 'fr': {'name': 'Visage du Creeper',
        'type': 'Modèle Hama Midi',
        'grid': 'Visage : 16 x 16 / grille : 29 x 29 / 1 plaque Midi / 256 perles / 3 couleurs',
        'materials': 'Matériel : Hama Midi',
        'header': 'Symbole / numéro Hama / Couleur produit : EN',
        'count': 'Quantité',
        'blank': 'Cases vides : sans perle. Chaque case marquée demande la couleur indiquée.',
        'color': 'Les couleurs sont approximatives. Vérifiez les références sur vos propres perles.',
        'physical': 'Fan art dessiné à la main. Assemblage et repassage avec des perles non testés.',
        'rights': 'Fan art Minecraft non officiel, ni approuvé par Mojang ou Microsoft, ni associé à '
                  'eux.',
        'owner': 'Les droits sur Minecraft et le personnage Creeper appartiennent à Mojang/Microsoft.',
        'print': '{paper} : 100% / Taille réelle. Désactivez "Ajuster à la page".',
        'scale': 'Les deux repères : 50 mm. Vérifiez la grille de 5 mm sur votre plaque Midi.',
        'detail': 'Modèle et éditeur',
        'hama': 'Modèle non officiel Hama.',
        'chart': 'PNG pour compter. Utilisez le PDF calibré pour imprimer à taille réelle.'},
 'ja': {'name': 'クリーパーの顔',
        'type': 'Hama Midiの図案',
        'grid': '顔16 x 16マス / 図案29 x 29マス / ミディ用プレート1枚 / 256個 / 3色',
        'materials': 'Hama Midiの材料表',
        'header': '記号 / Hama色番号 / 商品色名: EN',
        'count': '個数',
        'blank': '空白には置きません。記号のあるマスに、対応する色のビーズを置きます。',
        'color': '画面と印刷の色は目安です。実物のビーズの色番号を確認してください。',
        'physical': '手描きのファンアートです。実物制作・アイロン仕上げは未検証です。',
        'rights': 'Minecraftの非公式ファンアート。Mojang・Microsoftの公認や提携はありません。',
        'owner': 'Minecraftとクリーパーのキャラクターの権利はMojang/Microsoftに帰属します。',
        'print': '{paper}・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'scale': '縦横の確認線は各50 mm。1マス5 mmの間隔を実物のミディ用プレートで確認。',
        'detail': '図案とエディター',
        'hama': '非公式のHama図案です。',
        'chart': 'PNGはビーズの個数を確認する図です。印刷はPDF・実際のサイズを選びます。'}}


def digest(data):
    return sha256(data).hexdigest()


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def detail_url(locale):
    return SITE + ('' if locale == 'en' else '/' + locale) + '/patterns/minecraft/creeper-face#hama-midi'


def safe_stage(path, creating=False):
    path = Path(path).expanduser()
    assert path.is_absolute() and not any(part in ('.','..') for part in path.parts)
    cursor = path
    while cursor != cursor.parent:
        assert not cursor.is_symlink(), 'Staging symlinks are forbidden'
        cursor = cursor.parent
    path = path.resolve()
    assert path.name == 'generated-hama-creeper-downloads' and 'artifacts' in path.parts
    assert not (ROOT/'public' in path.parents) and not (ROOT/'scripts/fonts' in path.parents)
    ancestor = next(p for p in (path, *path.parents) if p.exists())
    ignored = subprocess.run(['git','check-ignore','--quiet',str(path)],cwd=ancestor,capture_output=True)
    assert ignored.returncode == 0, 'Private staging must be Git-ignored'
    if creating: assert not path.exists(), 'Refusing to replace any existing staging folder'
    else:
        assert path.is_dir()
        assert all(not p.is_symlink() for p in path.rglob('*')), 'Staged symlinks forbidden'
    return path


def load_variant():
    source_folder = ROOT/'public/patterns'/ID
    for name, expected in SOURCE_FILES.items():
        assert digest((source_folder/name).read_bytes()) == expected, 'Frozen source file changed: ' + name
    project = json.loads((source_folder/'pattern.bead-pattern.json').read_text())
    draft = project['draft']; edited = draft['editedPattern']
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
    assert draft['sourceMode'] == 'blank' and draft['imageSrc'] is None and draft['fileName'] == ID
    assert draft['selectedPaletteIds'] == ['perler'] and (draft['boardId'],draft['boardWidth'],draft['boardHeight']) == ('midi',1,1)
    assert (edited['width'],edited['height'],edited['byteLength']) == (29,29,3364)
    source = base64.b64decode(edited['data'],validate=True)
    assert digest(source) == SOURCE_RGBA_SHA and digest(source[3::4]) == ALPHA_SHA
    with Image.open(source_folder/'pixels.png') as image:
        assert image.mode == 'RGBA' and image.size == (29,29) and image.tobytes() == source
    match = re.search(r'export const patterns: Pattern\[\] = (\[.*?\]);',(ROOT/'src/lib/patterns/catalog.ts').read_text(),re.S)
    catalog = next(p for p in json.loads(match[1]) if p['id'] == ID)
    assert catalog['kind'] == 'fan-art' and catalog['slug'] == 'minecraft/creeper-face'
    assert catalog['version'] == 'Hand-drawn Creeper face fan art v1'
    assert catalog['source']['kind'] == 'fan-art' and catalog['source']['permission'] == 'unconfirmed'
    assert catalog['source']['rightsHolder'] == 'Mojang/Microsoft'
    assert catalog['source']['url'] == 'https://www.minecraft.net/en-us/article/meet-creeper'
    assert catalog['beads'] == 256 and catalog['colorCount'] == 3 and (catalog['motifWidth'],catalog['motifHeight']) == (16,16)
    with (ROOT/'public/palettes/hama.csv').open(newline='') as stream:
        csv_rows = {row[0]:row for row in csv.reader(stream)}
    materials=[]; palette=[]
    for ref, (name,symbol,rgb,count) in TARGETS.items():
        row=csv_rows[ref]
        assert (row[1],row[2],list(map(int,row[3:6]))) == (name,symbol,rgb), 'Hama CSV does not match reviewed color'
        entry=dict(name=name,ref=ref,symbol=symbol,prefix='H',enabled=True,color=dict(zip(('r','g','b','a'),rgb+[255])))
        palette.append(entry); materials.append(dict(ref=ref,code=ref[1:],name=name,symbol=symbol,rgb=rgb,hex='#'+bytes(rgb).hex(),count=count))
    source_entries = {entry['ref']:entry for p in draft['activePalettes'] for entry in p['entries']}
    assert set(source_entries) == set(COLOR_MAP)
    replacements = {tuple(e['color'][k] for k in ('r','g','b')):next(c for c in materials if c['ref']==COLOR_MAP[ref]) for ref,e in source_entries.items()}
    rgba=bytearray(source); source_counts=Counter()
    for i in range(0,len(source),4):
        assert source[i+3] in (0,255)
        if source[i+3] == 0:
            assert source[i:i+4] == b'\0\0\0\0'; continue
        color=tuple(source[i:i+3]);source_counts[color]+=1
        rgba[i:i+3]=bytes(replacements[color]['rgb'])
    assert source_counts == Counter({(77,171,100):136,(50,50,52):80,(105,184,69):40})
    rgba=bytes(rgba)
    assert digest(rgba)==HAMA_RGBA_SHA and rgba[3::4]==source[3::4]
    occupied={(i%29,i//29):next(c for c in materials if c['rgb']==list(rgba[i*4:i*4+3])) for i in range(841) if rgba[i*4+3]}
    assert set(occupied)=={(x,y) for y in range(6,22) for x in range(6,22)}
    assert Counter(c['ref'] for c in occupied.values())==Counter({ref:values[3] for ref,values in TARGETS.items()})
    result=deepcopy(project);result['savedAt']='2026-10-12T00:00:00.000Z'
    d=result['draft'];d['fileName']=VARIANT_ID;d['selectedPaletteIds']=['hama'];d['activePalettes']=[dict(name='Hama Midi',entries=palette)]
    d['editedPattern']['data']=base64.b64encode(rgba).decode()
    # The actual editor schema has no originalPattern field; never invent one.
    assert 'originalPattern' not in d
    return dict(id=ID,variantId=VARIANT_ID,rgba=rgba,source=source,project=result,occupied=occupied,materials=materials,sourceCatalog=catalog)


def editor_roundtrip(project,node):
    code=r"""const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);
const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function localRequire(name){let p=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(file),name);if(!fs.existsSync(p))p+='.ts';return load(p);}
vm.runInNewContext(code,{module,exports:module.exports,require:localRequire,atob,btoa,Uint8ClampedArray,console},{filename:file});return module.exports;}
const source=JSON.parse(fs.readFileSync(0,'utf8'));const lib=load(path.resolve('src/lib/editor/draft.ts'));const draft=lib.parseEditorProject(JSON.stringify(source));assert.ok(draft);
assert.ok(Buffer.from(lib.decodeEditorPatternDraft(draft.editedPattern)).equals(Buffer.from(source.draft.editedPattern.data,'base64')));
assert.equal(JSON.stringify(lib.parseEditorProject(lib.serializeEditorProject(draft))),JSON.stringify(draft));process.stdout.write('true');"""
    assert subprocess.run([node,'-e',code],cwd=ROOT,input=json_bytes(project),capture_output=True,check=True).stdout==b'true'


def text_entries(v,locale,paper):
    c=COPY[locale];width,height=(n/mm for n in PAPERS[paper])
    entries=[dict(x=18,y=12,value='FUSE BEAD PATTERNS',size=8),dict(x=18,y=24,value=c['name'],size=17,maxMm=86),
        dict(x=width-18,y=24,value=c['type'],size=8,right=True,maxMm=80),dict(x=18,y=33,value=c['grid'],size=8.1),
        dict(x=18,y=191,value=c['materials'],size=10),dict(x=18,y=197,value=c['header'],size=7.2),dict(x=180,y=197,value=c['count'],size=7.2,right=True)]
    for i,color in enumerate(v['materials']):
        y=204+i*7
        entries.extend([dict(x=24,y=y,value=color['symbol'],size=8,maxMm=6),dict(x=36,y=y,value=color['code'],size=8,maxMm=35),
            dict(x=80,y=y,value=color['name'],size=8,maxMm=75),dict(x=180,y=y,value=str(color['count']),size=8,right=True,maxMm=18)])
    for key,y in [('blank',223),('color',228),('physical',233),('hama',238),('rights',243),('owner',248),('print',253),('scale',265)]:
        entries.append(dict(x=18,y=y,value=c[key].format(paper='A4' if paper=='a4' else 'US Letter'),size=7,maxMm=width-36))
    entries.extend([dict(x=73,y=258,value='50 mm',size=8,maxMm=20),dict(x=width-10,y=191,value='50 mm',size=7,right=True,maxMm=17),
        dict(x=18,y=height-8,value=c['detail']+' / Hama Midi',size=6.7,maxMm=65),
        dict(x=width-18,y=height-8,value=detail_url(locale).split('#')[0].removeprefix('https://'),size=6.7,right=True,maxMm=112)])
    return entries


def chart_values(v,locale):
    return [COPY[locale]['name'],COPY[locale]['type'],COPY[locale]['grid'],COPY[locale]['materials'],
        *[f"{c['symbol']}: {c['code']} / {c['name']} / {COPY[locale]['count']}: {c['count']}" for c in v['materials']],
        *[COPY[locale][key] for key in ('blank','color','physical','hama','rights','owner','chart')]]


def font_inventory(v):
    chars=''.join(sorted(set('0123456789'+''.join(value for locale in LOCALES for value in chart_values(v,locale))+''.join(e['value'] for locale in LOCALES for paper in PAPERS for e in text_entries(v,locale,paper)))))
    candidates=[]
    for directory,filename in [('creeper-fan-art-jp','FuseBeadCreeperFanArtJapanese-Regular.ttf'),('hama-letter-jp','FuseBeadHamaLetterJapanese-Regular.ttf')]:
        d=ROOT/'scripts/fonts'/directory;lock=json.loads((d/'source.json').read_text());data=(d/filename).read_bytes()
        assert digest(data)==lock['subsetSha256'] and digest((d/'OFL.txt').read_bytes())==lock['licenseSha256']
        font=TTFont('HamaCreeperInventory'+directory,str(d/filename));missing=''.join(c for c in chars if ord(c) not in font.face.charToGlyph)
        candidates.append(dict(directory=str(d.relative_to(ROOT)),fontSha256=digest(data),missing=missing,missingCount=len(missing)))
    return dict(characters=chars,characterCount=len(chars),charactersSha256=digest(chars.encode()),chosen='scripts/fonts/creeper-fan-art-jp',candidates=candidates)


def read_font(v):
    for name,expected in FONT_PINS.items():assert digest((FONT_DIR/name).read_bytes())==expected,'Frozen reused font changed'
    inventory=font_inventory(v);assert inventory['candidates'][0]['missingCount']==0,'Existing font lacks a required glyph; do not overwrite it'
    pdfmetrics.registerFont(TTFont(FONT_NAME,str(FONT_PATH)))
    for locale in LOCALES:
        for paper in PAPERS:
            width=PAPERS[paper][0]/mm
            for e in text_entries(v,locale,paper):assert pdfmetrics.stringWidth(e['value'],FONT_NAME,e['size'])<=e.get('maxMm',width-36)*mm,(locale,paper,e['value'])
            assert pdfmetrics.stringWidth(COPY[locale]['name'],FONT_NAME,17)/mm+pdfmetrics.stringWidth(COPY[locale]['type'],FONT_NAME,8)/mm+44<width,'Title overlap'
    from fontTools import __version__
    from fontTools.ttLib import TTFont as OutlineFont
    from fontTools.pens.svgPathPen import SVGPathPen
    assert __version__=='4.60.1','Use pinned fontTools4.60.1 for deterministic outlines'
    f=OutlineFont(FONT_PATH);glyph_set=f.getGlyphSet();cmap=f.getBestCmap();glyphs={}
    for char in inventory['characters']:
        name=cmap[ord(char)];pen=SVGPathPen(glyph_set);glyph_set[name].draw(pen)
        glyphs[char]=dict(path=pen.getCommands(),advance=f['hmtx'].metrics[name][0])
    return dict(unitsPerEm=f['head'].unitsPerEm,glyphs=glyphs),inventory


def text_width(text,size,font):
    return sum(font['glyphs'][char]['advance'] for char in text)*size/font['unitsPerEm']


def wrapped(text,size,width,font):
    result=[];line=''
    for char in text:
        if line and text_width(line+char,size,font)>width:
            split=line.rfind(' ')
            if split>len(line)//2:result.append(line[:split]);line=line[split+1:]+char
            else:result.append(line.rstrip());line=char.lstrip()
        else:line+=char
    if line:result.append(line.rstrip())
    assert all(text_width(line,size,font)<=width for line in result)
    return result


def chart_svg(v,locale,font,inline=False):
    width,margin,top,cell=788,46,54,24;body=[];glyph_ids={}
    def label(value,x,y,size=16,anchor='left',fill=INK):
        if anchor=='middle':x-=text_width(value,size,font)/2
        for char in value:
            glyph=font['glyphs'][char];scale=size/font['unitsPerEm']
            if glyph['path']:
                transform=f'translate({x:.6f} {y:.6f}) scale({scale:.8f} {-scale:.8f})'
                if inline:body.append(f'<path d="{glyph["path"]}" transform="{transform}" fill="{fill}"/>')
                else:
                    ident=glyph_ids.setdefault(char,f'g{ord(char):x}');body.append(f'<use href="#{ident}" transform="{transform}" fill="{fill}"/>')
            x+=glyph['advance']*scale
    label(COPY[locale]['name']+' / Hama Midi',46,28,23)
    for (x,y),c in v['occupied'].items():body.append(f'<rect x="{margin+x*cell}" y="{top+y*cell}" width="24" height="24" fill="{c["hex"]}"/>')
    for i in range(30):
        major=i%5==0 or i==29
        body.append(f'<path d="M{margin+i*cell},{top}V750M{margin},{top+i*cell}H742" stroke="{"#65736b" if major else "#a2aaa6"}" stroke-width="{1.3 if major else .6}" fill="none"/>')
    for i in range(29):label(str(i+1),margin+(i+.5)*cell,46,10,'middle');label(str(i+1),28,top+(i+.5)*cell+3,10,'middle')
    for (x,y),c in v['occupied'].items():
        label(c['symbol'],margin+(x+.5)*cell,top+(y+.5)*cell+4,11,'middle','#ffffff' if c['ref']=='H18' or c['ref']=='H10' else INK)
    y=786
    for value in chart_values(v,locale)[1:]:
        for line in wrapped(value,16,696,font):label(line,46,y,16);y+=24
        y+=7
    height=y+15
    definitions='' if inline else '<defs>'+''.join(f'<path id="{ident}" d="{font["glyphs"][char]["path"]}"/>' for char,ident in glyph_ids.items())+'</defs>'
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" xml:lang="{locale}" role="img"><title>{escape(COPY[locale]["name"]+" / Hama Midi")}</title><desc>{escape(COPY[locale]["grid"])}</desc>{definitions}<rect width="100%" height="100%" fill="white"/>'+''.join(body)+'</svg>'
    assert not any(tag in svg for tag in ('<text','<image','<script','@font-face','foreignObject'))
    return svg.encode(),dict(width=width,height=height)


def svg_png(svg,node):
    code="const sharp=require('sharp'),fs=require('node:fs');sharp(fs.readFileSync(0)).png().toBuffer().then(b=>process.stdout.write(b)).catch(e=>{process.stderr.write(String(e));process.exit(1)});"
    return subprocess.run([node,'-e',code],cwd=ROOT,input=svg,capture_output=True,check=True).stdout


def prepare_bytes(v,font,node):
    result={}
    pixels=Image.frombytes('RGBA',(29,29),v['rgba']);buf=io.BytesIO();pixels.save(buf,format='PNG',optimize=False);result[FOLDER/'pixels.png']=buf.getvalue()
    preview=Image.new('RGBA',(580,580),'#ddd8ca');preview.alpha_composite(pixels.resize((580,580),Image.Resampling.NEAREST))
    buf=io.BytesIO();preview.convert('RGB').save(buf,format='PNG',optimize=False);result[FOLDER/'preview.png']=buf.getvalue()
    result[FOLDER/'pattern.bead-pattern.json']=json_bytes(v['project']);layouts={}
    for locale in LOCALES:
        svg,layout=chart_svg(v,locale,font);png=svg_png(svg,node)
        # The economical defs/use chart must rasterize exactly like inline outlines.
        inline,inline_layout=chart_svg(v,locale,font,inline=True)
        assert inline_layout==layout and svg_png(inline,node)==png,'Glyph reuse changes PNG output'
        with Image.open(io.BytesIO(png)) as image:
            assert image.size==(layout['width'],layout['height'])
            rgba=image.convert('RGBA');assert rgba.getchannel('A').getextrema()==(255,255)
            for y in range(29):
                for x in range(29):
                    color=v['occupied'].get((x,y));expected=tuple(color['rgb'])+(255,) if color else (255,255,255,255)
                    assert rgba.getpixel((46+x*24+4,54+y*24+4))==expected
        result[FOLDER/locale/'grid.svg']=svg;result[FOLDER/locale/'grid.png']=png;layouts[locale]=layout
    return result,layouts


def write_pdf(v,locale,paper,path):
    width,height=PAPERS[paper];gx=(width/mm-145)/2
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('xb') as handle:
        pdf=canvas.Canvas(handle,pagesize=PAPERS[paper],invariant=1,pageCompression=1,initialFontName=FONT_NAME,initialFontSize=8,lang=LANGUAGES[locale])
        pdf.setTitle(COPY[locale]['name']+' / '+COPY[locale]['type']);pdf.setAuthor('Fuse Bead Patterns team')
        pdf.setSubject(f'Unofficial Minecraft fan art; Hama Midi; {locale};29 x29;5mm;{paper};100%')
        pdf.setViewerPreference('PrintScaling','None')
        for (x,y),c in v['occupied'].items():
            pdf.setFillColor(HexColor(c['hex']));pdf.rect((gx+x*5)*mm,height-(GRID_TOP+(y+1)*5)*mm,5*mm,5*mm,fill=1,stroke=0)
            pdf.setFillColor(HexColor('#ffffff' if c['ref'] in ('H18','H10') else INK));pdf.setFont(FONT_NAME,7)
            pdf.drawCentredString((gx+(x+.5)*5)*mm,height-(GRID_TOP+(y+.5)*5)*mm-2.2,c['symbol'])
        for i in range(30):
            major=i%5==0 or i==29;pdf.setStrokeColor(HexColor('#65736b' if major else '#a2aaa6'));pdf.setLineWidth((.23 if major else .1)*mm)
            pdf.line((gx+i*5)*mm,height-GRID_TOP*mm,(gx+i*5)*mm,height-184*mm)
            pdf.line(gx*mm,height-(GRID_TOP+i*5)*mm,(gx+145)*mm,height-(GRID_TOP+i*5)*mm)
        pdf.setFont(FONT_NAME,5.5);pdf.setFillColor(HexColor(MUTED))
        for i in range(29):
            pdf.drawCentredString((gx+(i+.5)*5)*mm,height-(GRID_TOP-1.5)*mm,str(i+1))
            pdf.drawRightString((gx-2)*mm,height-(GRID_TOP+(i+.5)*5)*mm-2,str(i+1))
        for e in text_entries(v,locale,paper):
            pdf.setFont(FONT_NAME,e['size']);pdf.setFillColor(HexColor(INK));method=pdf.drawRightString if e.get('right') else pdf.drawString
            method(e['x']*mm,height-e['y']*mm,e['value'])
        for i,c in enumerate(v['materials']):pdf.setFillColor(HexColor(c['hex']));pdf.rect(18*mm,height-(204+i*7+.6)*mm,3*mm,3*mm,fill=1,stroke=0)
        pdf.setStrokeColor(HexColor(INK));pdf.setLineWidth(.35*mm)
        pdf.line(18*mm,height-256.5*mm,68*mm,height-256.5*mm)
        for x in (18,68):pdf.line(x*mm,height-255*mm,x*mm,height-258*mm)
        vx=width/mm-10;pdf.line(vx*mm,height-200*mm,vx*mm,height-250*mm)
        for y in (200,250):pdf.line((vx-1.5)*mm,height-y*mm,(vx+1.5)*mm,height-y*mm)
        pdf.linkURL(detail_url(locale),(18*mm,5*mm,width-18*mm,13*mm),relative=0)
        pdf.showPage();pdf.save()


def validate_pdf(v,locale,paper,path):
    reader=PdfReader(path);assert len(reader.pages)==1 and reader.trailer['/Root']['/Lang']==LANGUAGES[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling']=='/None'
    assert reader.metadata.title==COPY[locale]['name']+' / '+COPY[locale]['type']
    page=reader.pages[0];assert [a.get_object()['/A']['/URI'] for a in page['/Annots']]==[detail_url(locale)]
    fonts=[f.get_object() for f in page['/Resources']['/Font'].values()]
    assert fonts and all(f.get('/FontDescriptor') and f['/FontDescriptor']['/FontFile2'].get_data() and f['/ToUnicode'].get_data() for f in fonts)
    width,height=PAPERS[paper];gx=(width/mm-145)/2
    close=lambda a,b:abs(a-b)<.015
    with pdfplumber.open(path) as doc:
        pg=doc.pages[0];assert close(pg.width,width) and close(pg.height,height)
        assert all(c['x0']>=17*mm and c['x1']<=(width/mm-8.5)*mm and c['top']>=8*mm and c['bottom']<=(height/mm-5)*mm for c in pg.chars),'Text exceeds margins'
        compact=re.sub(r'\s+','',pg.extract_text())
        for e in text_entries(v,locale,paper):assert re.sub(r'\s+','',e['value']) in compact,(locale,paper,e['value'])
        cells={}
        for rect in pg.rects:
            if not(close(rect['width'],5*mm) and close(rect['height'],5*mm)):continue
            x=(rect['x0']/mm-gx)/5;y=(rect['top']/mm-GRID_TOP)/5
            assert close(x,round(x)) and close(y,round(y));point=(round(x),round(y))
            assert point not in cells and 0<=point[0]<29 and 0<=point[1]<29
            cells[point]=tuple(round(c*255) for c in rect['non_stroking_color'])
        assert cells=={point:tuple(c['rgb']) for point,c in v['occupied'].items()}
        restored=bytes(ch for y in range(29) for x in range(29) for ch in (list(cells[(x,y)])+[255] if (x,y) in cells else [0,0,0,0]))
        assert restored==v['rgba'] and digest(restored)==HAMA_RGBA_SHA
        symbols={}
        for c in pg.chars:
            x=(c['x0']+c['x1'])/2/mm;y=(c['top']+c['bottom'])/2/mm
            if gx<x<gx+145 and GRID_TOP<y<184:
                point=(int((x-gx)//5),int((y-GRID_TOP)//5));assert point not in symbols;symbols[point]=c['text']
        assert symbols=={point:c['symbol'] for point,c in v['occupied'].items()}
        for i in range(30):
            assert any(close(l['x0'],gx*mm) and close(l['x1'],(gx+145)*mm) and close(l['top'],(GRID_TOP+i*5)*mm) for l in pg.lines)
            assert any(close(l['x0'],(gx+i*5)*mm) and close(l['top'],GRID_TOP*mm) and close(l['bottom'],184*mm) for l in pg.lines)
        assert any(close(l['x0'],18*mm) and close(l['x1'],68*mm) and close(l['top'],256.5*mm) for l in pg.lines)
        assert any(close(l['x0'],width-10*mm) and close(l['top'],200*mm) and close(l['bottom'],250*mm) for l in pg.lines)
        for i,c in enumerate(v['materials']):
            block=pg.crop((23*mm,(200+i*7)*mm,182*mm,(205+i*7)*mm)).extract_text()
            assert all(value in block for value in (c['symbol'],c['code'],c['name'],str(c['count'])))
            assert re.search(rf'\b{c["count"]}\b',block)
    return dict(locale=locale,paper=paper,path=str((FOLDER/locale/path.name).as_posix()),sha256=digest(path.read_bytes()),pages=1,gridSize=[29,29],motifSize=[16,16],beads=256,colors=3,gridPitchMm=5,rulersMm=[50,50],rgbaSha256=digest(restored),symbolsExact=True,nativeLang=True,embeddedFont=True,printScaling='None',detailLink=detail_url(locale),physicalAssemblyTested=False,ironingTested=False)


def report(v,files,layouts,inventory,pdfs):
    return dict(status='complete' if pdfs else 'prepared-no-pdfs',id=ID,variantId=VARIANT_ID,kind='fan-art',sourcePermission='unconfirmed',sourceFiles=SOURCE_FILES,sourceRgbaSha256=SOURCE_RGBA_SHA,alphaSha256=ALPHA_SHA,hamaRgbaSha256=HAMA_RGBA_SHA,colorMap=COLOR_MAP,materials=v['materials'],gridSize=[29,29],motifSize=[16,16],beads=256,colors=3,charts={locale:dict(href='/'+(FOLDER/locale/'grid.png').as_posix(),**layout,svgSha256=digest(files[FOLDER/locale/'grid.svg']),pngSha256=digest(files[FOLDER/locale/'grid.png'])) for locale,layout in layouts.items()},font=inventory,pdfCount=len(pdfs),pdfs=pdfs,physicalAssemblyTested=False,ironingTested=False,realEditorParseDecodeSerializeReparse=True)


def manifest(files,pdfs):
    return dict(files=[dict(path=path.as_posix(),sha256=digest(data),bytes=len(data)) for path,data in files.items()]+[dict(path=p['path'],sha256=p['sha256']) for p in pdfs])


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    modes=parser.add_mutually_exclusive_group(required=True)
    for name in ('font-inventory','prepare','author','check-only'):modes.add_argument('--'+name,action='store_true')
    parser.add_argument('--stage',type=Path);parser.add_argument('--node',default='node');args=parser.parse_args()
    v=load_variant();editor_roundtrip(v['project'],args.node)
    if args.font_inventory:print(json.dumps(font_inventory(v),ensure_ascii=False,indent=2));return
    assert args.stage,'Explicit private --stage required'
    stage=safe_stage(args.stage,creating=args.prepare);font,inventory=read_font(v);files,layouts=prepare_bytes(v,font,args.node)
    if args.prepare:
        stage.mkdir(parents=True)
        for path,data in files.items():
            destination=stage/path;destination.parent.mkdir(parents=True,exist_ok=True)
            with destination.open('xb') as handle:handle.write(data)
        for name,data in [('font-inventory.json',inventory),('asset-manifest.json',manifest(files,[])),('download-checks.json',report(v,files,layouts,inventory,[]))]:
            with (stage/name).open('xb') as handle:handle.write(json_bytes(data))
    else:
        for path,data in files.items():assert (stage/path).read_bytes()==data,'Stored common/chart asset changed: '+str(path)
        assert (stage/'font-inventory.json').read_bytes()==json_bytes(inventory)
        if args.author:
            assert (stage/'download-checks.json').read_bytes()==json_bytes(report(v,files,layouts,inventory,[])),'Author requires a matching no-PDF preparation'
            assert (stage/'asset-manifest.json').read_bytes()==json_bytes(manifest(files,[]))
            assert not list(stage.rglob('*.pdf')),'No repeated PDF authoring allowed'
            # Root must run the skill authoring marker immediately before this command.
            for locale in LOCALES:
                for paper in PAPERS:write_pdf(v,locale,paper,stage/FOLDER/locale/('pattern.pdf' if paper=='a4' else 'pattern-letter.pdf'))
        # A prepared source-only package can also be checked without authoring.
        # Any PDF present requires the complete eight-PDF contract below.
        pdfs=[] if args.check_only and not list(stage.rglob('*.pdf')) else [validate_pdf(v,locale,paper,stage/FOLDER/locale/('pattern.pdf' if paper=='a4' else 'pattern-letter.pdf')) for locale in LOCALES for paper in PAPERS]
        actual_report=report(v,files,layouts,inventory,pdfs);actual_manifest=manifest(files,pdfs)
        if args.check_only:
            assert (stage/'download-checks.json').read_bytes()==json_bytes(actual_report),'Stale complete QA report'
            assert (stage/'asset-manifest.json').read_bytes()==json_bytes(actual_manifest),'Stale asset manifest'
        else:
            (stage/'download-checks.json').write_bytes(json_bytes(actual_report));(stage/'asset-manifest.json').write_bytes(json_bytes(actual_manifest))
    expected={str(path) for path in files}|{'font-inventory.json','asset-manifest.json','download-checks.json'}
    if not args.prepare and pdfs:expected|={(FOLDER/locale/name).as_posix() for locale in LOCALES for name in ('pattern.pdf','pattern-letter.pdf')}
    assert {p.relative_to(stage).as_posix() for p in stage.rglob('*') if p.is_file()}==expected,'Unexpected staged file'
    print(json.dumps(dict(status='prepared-no-pdfs' if args.prepare else 'checked-source-only' if args.check_only and not pdfs else 'checked' if args.check_only else 'created',stage=str(stage),commonAssets=3,charts=4,pdfs=0 if args.prepare else len(pdfs)),ensure_ascii=False))


if __name__=='__main__':main()

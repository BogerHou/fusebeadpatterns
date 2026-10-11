"""Eight five-page calibrated multiboard PDFs and four native count charts.

Exclusive private staging; no legacy builder or asset is changed. Font inventory
and --check-only are read-only. --build-font creates only a new dedicated font.
The root must execute the PDF authoring marker before the first PDF creation.
"""
import argparse
import base64
from collections import Counter
import csv
from hashlib import sha256
import io
import json
from pathlib import Path
import re
import subprocess
import urllib.request
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
SITE = 'https://fusebeadpatterns.art'
FONT_NAME = 'FuseBeadMultiboardLabels'
FONT_FILE = FONT_NAME + '-Regular.ttf'
FONT_FAMILY = 'Fuse Bead Multiboard Labels'
LOCALES = ('en', 'de', 'fr', 'ja')
PAPERS = {'a4': A4, 'letter': letter}
LANGUAGES = {'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}

ID = 'original-sunset-mountain-lake'
IDS = {ID: {
    'slug': 'sunset-mountain-lake', 'en': 'Sunset Mountain Lake',
    'de': 'Sonnenuntergang am Bergsee', 'fr': 'Lac de montagne au coucher du soleil',
    'ja': '山と湖の夕景',
}}
SIZE, BOARD_SIZE = 58, 29
# Rendering positions are explicit; validation independently maps PDF page order.
BOARDS = ((0, 0), (1, 0), (0, 1), (1, 1))
COPY = {
    'en': {
        'type': 'Large Perler Bead Pattern',
        'grid': '58 x 58 grid / 2 x 2 Midi boards / {beads} beads / {colors} colors',
        'motif': 'Motif: {width} x {height} beads.', 'materials': 'Perler Midi materials',
        'header': 'Symbol / color ref / product name: EN', 'count': 'Count',
        'boardCount': 'This board', 'beadCount': '{beads} beads',
        'board': 'Board {number} / 4: {position}', 'range': 'Global rows {r0}-{r1} / columns {c0}-{c1}',
        'positions': ('Top left', 'Top right', 'Bottom left', 'Bottom right'),
        'overview': 'Scaled overview only. Print the four board pages at 100% / Actual size.',
        'blank': 'Empty cells need no beads. White cells with a symbol need white beads.',
        'color': 'Screen and print colors are approximate. Check the product color refs.',
        'physical': 'Original digital design. Assembly, ironing and joint strength untested.',
        'print': '{paper}: print at 100% / Actual size. Turn off "Fit to page".',
        'scale': 'Both rulers must measure 50 mm. Check 5 mm spacing against your Midi board.',
        'detail': 'Pattern and editor',
        'chart': 'Counting PNG only; use the calibrated PDF board pages for actual-size printing.',
        'seam': 'Keep all four boards aligned. Global row/column 29 is followed by 30, without overlap.',
        'joining': 'The pages divide the chart, not instructions to fuse four separate pieces.',
    },
    'de': {
        'type': 'Große Bügelperlen-Vorlage',
        'grid': '58 x 58 Felder / 2 x 2 Midi-Platten / {beads} Perlen / {colors} Farben',
        'motif': 'Motiv: {width} x {height} Perlen.', 'materials': 'Materialliste: Perler Midi',
        'header': 'Symbol / Farbnummer / Produktname: EN', 'count': 'Anzahl',
        'boardCount': 'Diese Platte', 'beadCount': '{beads} Perlen',
        'board': 'Platte {number} / 4: {position}', 'range': 'Globale Zeilen {r0}-{r1} / Spalten {c0}-{c1}',
        'positions': ('Oben links', 'Oben rechts', 'Unten links', 'Unten rechts'),
        'overview': 'Verkleinerte Übersicht. Die vier Plattenseiten mit 100 % / tatsächlicher Größe drucken.',
        'blank': 'Leere Felder bleiben ohne Perle. Weiße Felder mit Symbol brauchen weiße Perlen.',
        'color': 'Bildschirm- und Druckfarben sind Näherungen. Farbnummern prüfen.',
        'physical': 'Digitales Original. Bau, Bügeln und Festigkeit der Verbindungen ungeprüft.',
        'print': '{paper}: 100% / Tatsächliche Größe. "An Seite anpassen" ausschalten.',
        'scale': 'Beide Messlinien müssen 50 mm messen. Das 5-mm-Raster an der Midi-Platte prüfen.',
        'detail': 'Vorlage und Editor',
        'chart': 'PNG zum Zählen; für den Druck in Originalgröße die kalibrierten PDF-Plattenseiten nutzen.',
        'seam': 'Vier Platten ausrichten. Auf globale Zeile/Spalte 29 folgt 30, ohne Überlappung.',
        'joining': 'Die Seiten teilen die Vorlage auf; sie weisen nicht zum getrennten Bügeln von vier Teilen an.',
    },
    'fr': {
        'type': 'Grand modèle de perles à repasser',
        'grid': 'Grille 58 x 58 / 2 x 2 plaques Midi / {beads} perles / {colors} couleurs',
        'motif': 'Motif : {width} x {height} perles.', 'materials': 'Matériel : Perler Midi',
        'header': 'Symbole / référence / nom du produit : EN', 'count': 'Quantité',
        'boardCount': 'Cette plaque', 'beadCount': '{beads} perles',
        'board': 'Plaque {number} / 4 : {position}', 'range': 'Lignes globales {r0}-{r1} / colonnes {c0}-{c1}',
        'positions': ('En haut à gauche', 'En haut à droite', 'En bas à gauche', 'En bas à droite'),
        'overview': 'Vue réduite. Imprimez les quatre pages de plaques à 100% / taille réelle.',
        'blank': 'Cases vides : sans perle. Une case blanche avec un symbole demande une perle blanche.',
        'color': 'Les couleurs à l’écran et sur papier sont approximatives. Vérifiez les références.',
        'physical': 'Original numérique. Assemblage, repassage et solidité des jonctions non testés.',
        'print': '{paper} : 100% / Taille réelle. Désactivez "Ajuster à la page".',
        'scale': 'Les deux repères doivent mesurer 50 mm. Vérifiez le pas de 5 mm sur votre plaque Midi.',
        'detail': 'Modèle et éditeur',
        'chart': 'PNG pour compter ; imprimez les pages PDF calibrées des plaques pour la taille réelle.',
        'seam': 'Alignez les quatre plaques. Après la ligne/colonne globale 29 vient 30, sans chevauchement.',
        'joining': 'Les pages découpent la grille, sans consigne de repasser quatre pièces séparément.',
    },
    'ja': {
        'type': '大きいアイロンビーズ図案',
        'grid': '58 x 58マス / ミディ用プレート2 x 2枚 / {beads}個 / {colors}色',
        'motif': '図柄：横{width} x 縦{height}マス。', 'materials': 'Perler Midiの材料表',
        'header': '記号 / 色番号 / 商品色名: EN', 'count': '個数',
        'boardCount': 'このプレート', 'beadCount': '{beads}個',
        'board': 'プレート {number} / 4：{position}', 'range': '全体の行 {r0}-{r1} / 列 {c0}-{c1}',
        'positions': ('左上', '右上', '左下', '右下'),
        'overview': '全体図は縮小表示です。プレート別の4ページを100％・実際のサイズで印刷してください。',
        'blank': '空白には置きません。記号のある白いマスには白いビーズを置きます。',
        'color': '画面と印刷の色は目安です。実物のビーズの色番号を確認してください。',
        'physical': 'オリジナルのデジタル図案。実物制作・アイロン・接合部分の強度は未検証です。',
        'print': '{paper}・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'scale': '縦横の確認線は各50 mm。1マス5 mmの間隔を実物のミディ用プレートで確認。',
        'detail': '図案とエディター',
        'chart': 'PNGはマスを数える図表です。実寸印刷には校正線付きのプレート別PDFを使います。',
        'seam': '4枚のプレートを並べます。全体の29行・29列の次は30です。境界のマスは重ねません。',
        'joining': 'ページは図案の分割です。4つの部品を別々にアイロンで仕上げる指示ではありません。',
    },
}

PIN = {
    'repository': 'https://github.com/google/fonts',
    'revision': '66a36c8c94b1a5d992ee4e7f392fccfe4945767c',
    'fontUrl': 'https://raw.githubusercontent.com/google/fonts/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf',
    'fontSha256': 'c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f',
    'licenseUrl': 'https://raw.githubusercontent.com/google/fonts/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/OFL.txt',
    'licenseSha256': '1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9',
    'license': 'SIL Open Font License 1.1',
}


def digest(data):
    return sha256(data).hexdigest()


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def safe_location(path, writing=False):
    path = path.absolute()
    assert not any(p.is_symlink() for p in (path, *path.parents)), 'Symlinked artifact path is not allowed'
    assert not {'public', 'src'}.intersection(path.parts), 'Use private staging, never public/src'
    if writing:
        assert not path.exists(), f'Refusing to overwrite existing path: {path}'
    return path.resolve()


def components(points):
    remaining = set(points)
    sizes = []
    while remaining:
        pending = [remaining.pop()]
        size = 0
        while pending:
            x, y = pending.pop()
            size += 1
            for cell in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if cell in remaining:
                    remaining.remove(cell)
                    pending.append(cell)
        sizes.append(size)
    return sorted(sizes, reverse=True)


def build_font(directory, inventory):
    from fontTools import subset, __version__
    from fontTools.ttLib import TTFont as FontToolsFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.boundsPen import BoundsPen
    assert __version__ == '4.60.1', 'Use pinned fontTools 4.60.1 for this dedicated font'
    directory = safe_location(directory, writing=True)
    assert directory.name == 'multiboard-labels', 'Use a new scripts/fonts/multiboard-labels or staging multiboard-labels directory'
    original = urllib.request.urlopen(PIN['fontUrl'], timeout=60).read()
    license_bytes = urllib.request.urlopen(PIN['licenseUrl'], timeout=30).read()
    assert digest(original) == PIN['fontSha256'] and digest(license_bytes) == PIN['licenseSha256']
    font = FontToolsFont(io.BytesIO(original), recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': 400}, inplace=True)
    options = subset.Options()
    options.name_IDs = ['*']; options.name_legacy = True; options.name_languages = ['*']; options.recalc_timestamp = False
    sub = subset.Subsetter(options=options); sub.populate(text=inventory['characters']); sub.subset(font)
    names = {1:FONT_FAMILY, 2:'Regular', 3:FONT_NAME+'-Regular-1', 4:FONT_FAMILY+' Regular',
             6:FONT_NAME+'-Regular', 16:FONT_FAMILY, 17:'Regular'}
    for item in font['name'].names:
        if item.nameID in names:
            item.string = names[item.nameID].encode(item.getEncoding())
    cmap, glyph_set, glyphs = font.getBestCmap(), font.getGlyphSet(), {}
    for char in inventory['characters']:
        assert ord(char) in cmap, f'Missing font character {char!r}'
        name = cmap[ord(char)]; glyph = glyph_set[name]
        pen = SVGPathPen(glyph_set); glyph.draw(pen)
        bounds = BoundsPen(glyph_set); glyph.draw(bounds)
        glyphs[char] = dict(advance=font['hmtx'].metrics[name][0], bounds=bounds.bounds, path=pen.getCommands())
    glyph_bytes = json_bytes(dict(unitsPerEm=font['head'].unitsPerEm, glyphs=glyphs))
    output = io.BytesIO(); font.save(output); font_bytes = output.getvalue()
    lock = dict(PIN, derivativeFamily=FONT_FAMILY, weight=400, fonttoolsVersion=__version__,
        subsetPurpose='Original multiboard EN/DE/FR/JA PDF and count charts; no old-font refresh',
        subsetSha256=digest(font_bytes), glyphsSha256=digest(glyph_bytes),
        charactersSha256=inventory['sha256'], characterCount=inventory['count'],
        patternIds=list(IDS), chartCount=4, pdfCount=8,
        pdfCharactersSha256=inventory['pdfCharactersSha256'], chartCharactersSha256=inventory['chartCharactersSha256'])
    directory.mkdir(parents=True)
    for name, data in [(FONT_FILE,font_bytes), ('glyphs.json',glyph_bytes), ('OFL.txt',license_bytes), ('source.json',json_bytes(lock))]:
        with (directory/name).open('xb') as handle:
            handle.write(data)
    return lock


def read_font(directory, inventory):
    directory = directory.resolve()
    lock = json.loads((directory/'source.json').read_text())
    assert all(lock[k] == v for k, v in PIN.items())
    assert lock['derivativeFamily'] == FONT_FAMILY and lock['weight'] == 400 and lock['fonttoolsVersion'] == '4.60.1'
    assert lock['patternIds'] == list(IDS) and lock['pdfCount'] == 8 and lock['chartCount'] == 4
    for key in ('pdfCharactersSha256', 'chartCharactersSha256'):
        assert lock[key] == inventory[key], 'Changed text requires a new reviewed font inventory'
    assert lock['charactersSha256'] == inventory['sha256']
    assert digest((directory/FONT_FILE).read_bytes()) == lock['subsetSha256']
    assert digest((directory/'glyphs.json').read_bytes()) == lock['glyphsSha256']
    assert digest((directory/'OFL.txt').read_bytes()) == PIN['licenseSha256']
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(directory/FONT_FILE)))
    assert all(ord(c) in pdfmetrics.getFont(FONT_NAME).face.charToGlyph for c in inventory['characters'])
    font = json.loads((directory/'glyphs.json').read_text())
    assert all(c in font['glyphs'] for c in inventory['characters'])
    return font


def text_width(value,size,font):
    return sum(font['glyphs'][c]['advance'] for c in value)*size/font['unitsPerEm']


def wrapped(value,size,max_width,font):
    assert max_width>0
    lines=[]; current=''
    for char in value:
        if current and text_width(current+char,size,font)>max_width:
            # Latin wrapping prefers a word boundary; Japanese may break by glyph.
            split=current.rfind(' ')
            if split>0 and split>len(current)//2:
                lines.append(current[:split]); current=current[split+1:]+char
            else:
                lines.append(current.rstrip()); current=char.lstrip()
        else: current+=char
    if current: lines.append(current.rstrip())
    assert all(text_width(line,size,font)<=max_width for line in lines)
    return lines


def path_text(value,x,baseline,size,font,fill='#25342e',anchor='left'):
    width=text_width(value,size,font)
    if anchor=='middle': x-=width/2
    if anchor=='right': x-=width
    scale=size/font['unitsPerEm']; svg=[]
    for char in value:
        glyph=font['glyphs'][char]
        if glyph['path']:
            svg.append(f'<path d="{glyph["path"]}" transform="translate({x:.6f} {baseline:.6f}) scale({scale:.8f} {-scale:.8f})" fill="{fill}"/>')
        x+=glyph['advance']*scale
    return ''.join(svg)


def svg_png(svg,node):
    code="const fs=require('node:fs');const sharp=require('sharp');sharp(fs.readFileSync(0)).png().toBuffer().then(b=>process.stdout.write(b)).catch(e=>{process.stderr.write(String(e));process.exit(1)});"
    result=subprocess.run([node,'-e',code],cwd=ROOT,input=svg,capture_output=True,check=True)
    return result.stdout


def load_patterns(pack, review_lock=None):
    pack = safe_location(pack)
    assert pack.name == 'original-large-landscape-v1' and 'artifacts' in pack.parts
    manifest = json.loads((pack/'manifest.json').read_text())
    assert len(manifest['patterns']) == 1 and manifest['patterns'][0]['id'] == ID
    p = dict(manifest['patterns'][0])
    assert p['kind'] == 'original' and p['source'] is None
    assert p['slug'] == IDS[ID]['slug'] and p['title'] == IDS[ID]['en']
    assert p['localizedSubjects'] == {loc: IDS[ID][loc] for loc in ('de', 'fr', 'ja')}
    assert (p['width'], p['height']) == (SIZE, SIZE)
    assert len(p['rows']) == SIZE and all(isinstance(row, str) and len(row) == SIZE for row in p['rows'])
    counts = Counter(''.join(p['rows']).replace('.', ''))
    palette = p['palette']
    assert set(palette) == set(counts) and 1 <= len(palette) <= 8
    assert p['materials'] == list(palette.values())
    assert all(re.fullmatch(r'[A-Z0-9]', symbol) for symbol in palette)
    with (ROOT/'public/palettes/perler.csv').open(newline='') as source:
        csv_colors = {row[0]: row for row in csv.reader(source)}
    for symbol, color in palette.items():
        actual = csv_colors[color['ref']]
        assert color['symbol'] == symbol and color['count'] == counts[symbol]
        assert color['name'] == actual[1] and color['rgb'] == [int(v) for v in actual[3:6]]
        assert color['hex'] == '#' + bytes(color['rgb']).hex()
    assert len({c['ref'] for c in palette.values()}) == len(palette)
    assert len({tuple(c['rgb']) for c in palette.values()}) == len(palette)
    assert p['beads'] == sum(counts.values()) and p['colorCount'] == len(counts)
    p['rgba'] = bytes(channel for row in p['rows'] for symbol in row
        for channel in (palette[symbol]['rgb']+[255] if symbol != '.' else [0,0,0,0]))
    p['rowsSha256'] = digest('\n'.join(p['rows']).encode())
    p['rgbaSha256'] = digest(p['rgba'])
    if review_lock:
        locks = json.loads(review_lock.read_text())
        assert set(locks) == {ID}
        assert locks[ID]['rowsSha256'] == p['rowsSha256'] and locks[ID]['rgbaSha256'] == p['rgbaSha256'], 'Reviewed rows or RGBA changed'
    with Image.open(pack/'pixels'/(ID+'.png')) as img:
        assert img.mode == 'RGBA' and img.size == (SIZE,SIZE) and img.tobytes() == p['rgba']
    project_bytes = (pack/'projects'/(ID+'.bead-pattern.json')).read_bytes()
    project = json.loads(project_bytes)
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
    draft = project['draft']
    assert draft['version'] == 1 and draft['sourceMode'] == 'blank' and draft['imageSrc'] is None
    assert draft['selectedPaletteIds'] == ['perler']
    assert (draft['boardId'],draft['boardWidth'],draft['boardHeight']) == ('midi',2,2)
    assert draft['pdfScaleMode'] == 'midi-5mm'
    edited = draft['editedPattern']
    assert (edited['width'],edited['height'],edited['byteLength']) == (SIZE,SIZE,len(p['rgba']))
    assert base64.b64decode(edited['data'],validate=True) == p['rgba']
    assert len(draft['activePalettes']) == 1 and draft['activePalettes'][0]['name'] == 'Perler Midi'
    entries = {c['ref']:c for c in draft['activePalettes'][0]['entries']}
    assert set(entries) == {c['ref'] for c in palette.values()}
    for c in palette.values():
        entry = entries[c['ref']]
        assert entry['symbol'] == c['symbol'] and entry['name'] == c['name'] and entry['enabled'] is True
        assert entry['color'] == dict(zip(('r','g','b','a'),c['rgb']+[255]))
    p['projectSha256'] = digest(project_bytes)
    p['occupied'] = {(x,y):palette[symbol] for y,row in enumerate(p['rows']) for x,symbol in enumerate(row) if symbol != '.'}
    xs,ys = zip(*p['occupied'])
    actual_bounds = dict(x=min(xs),y=min(ys),width=max(xs)-min(xs)+1,height=max(ys)-min(ys)+1)
    assert p['bounds'] == actual_bounds and actual_bounds['width'] > 29 and actual_bounds['height'] > 29
    p['digitalComponents'] = components(p['occupied'])
    assert p['digitalComponents'] == [p['beads']], 'Digital connectivity is required, not physical strength'
    p['boardCounts'] = [sum(1 for x,y in p['occupied'] if bx*29 <= x < (bx+1)*29 and by*29 <= y < (by+1)*29) for bx,by in BOARDS]
    assert all(value > 0 for value in p['boardCounts']) and sum(p['boardCounts']) == p['beads']
    assert any((28,y) in p['occupied'] and (29,y) in p['occupied'] for y in range(58)), 'No occupied vertical board seam'
    assert any((x,28) in p['occupied'] and (x,29) in p['occupied'] for x in range(58)), 'No occupied horizontal board seam'
    for key in ('physicalAssemblyTested','ironingTested','hangingTested','loadStrengthTested'):
        assert p.get(key) is False, f'{key} must remain untested'
    return [p]


def detail_url(p, locale):
    return SITE+('' if locale=='en' else '/'+locale)+'/patterns/'+p['slug']


def relative_folder(p, locale):
    return Path('patterns' if locale=='en' else 'patterns-'+locale)/p['id']


def copy_text(p, locale, key, paper='a4'):
    return COPY[locale][key].format(beads=p['beads'],colors=p['colorCount'],width=p['bounds']['width'],
        height=p['bounds']['height'],paper='A4' if paper=='a4' else 'US Letter')


def board_copy(locale, index):
    bx,by = BOARDS[index]
    return (COPY[locale]['board'].format(number=index+1,position=COPY[locale]['positions'][index]),
        COPY[locale]['range'].format(r0=by*29+1,r1=by*29+29,c0=bx*29+1,c1=bx*29+29))


def board_colors(p, index):
    bx,by = BOARDS[index]
    return Counter(p['rows'][y][x] for y in range(by*29,by*29+29) for x in range(bx*29,bx*29+29) if p['rows'][y][x]!='.')


def pdf_entries(p, locale, paper, index=None):
    width,height = (v/mm for v in PAPERS[paper])
    overview = index is None
    title = IDS[ID][locale]
    text = [dict(x=18,y=13,value='FUSE BEAD PATTERNS',size=8),
        dict(x=width-18,y=13,value=COPY[locale]['type'],size=6.7,right=True,maxMm=85),
        dict(x=18,y=25,value=title,size=14,maxMm=width-36)]
    if overview:
        text.append(dict(x=18,y=33,value=copy_text(p,locale,'grid'),size=7.8))
        text.append(dict(x=18,y=190,value=copy_text(p,locale,'motif'),size=7.1))
        heading=COPY[locale]['materials']; quantities={c['symbol']:c['count'] for c in p['palette'].values()}
    else:
        position,ranges=board_copy(locale,index)
        text.extend([dict(x=18,y=33,value=position,size=8.1),dict(x=18,y=38,value=ranges,size=7.2)])
        quantities=board_colors(p,index)
        heading=COPY[locale]['materials']+' / '+COPY[locale]['beadCount'].format(beads=p['boardCounts'][index])
    text.append(dict(x=18,y=196,value=heading,size=8.6))
    col_width=(width-42)/2
    for col in range(2):
        x=18+col*(col_width+6)
        text.append(dict(x=x,y=202,value=COPY[locale]['header'],size=6.2,maxMm=col_width-14))
        text.append(dict(x=x+col_width,y=202,value=COPY[locale]['count'] if overview else COPY[locale]['boardCount'],size=6.1,right=True,maxMm=14))
    for num,c in enumerate(p['palette'].values()):
        col,row=divmod(num,4);x=18+col*(col_width+6);y=209+row*6
        text.extend([dict(x=x+5,y=y,value=c['symbol'],size=7.2,maxMm=6),
            dict(x=x+13,y=y,value=c['ref'],size=6.7,maxMm=24),
            dict(x=x+37,y=y,value=c['name'],size=6.7,maxMm=col_width-48),
            dict(x=x+col_width,y=y,value=str(quantities[c['symbol']]),size=6.7,right=True,maxMm=10)])
    for key,y in [('blank',233),('color' if overview else 'joining',238),('physical',243),('overview' if overview else 'print',249),('scale',265)]:
        if overview and key=='scale':continue
        text.append(dict(x=18,y=y,value=copy_text(p,locale,key,paper),size=6.5,maxMm=width-36))
    if overview:
        text.append(dict(x=18,y=256,value=copy_text(p,locale,'joining'),size=6.5,maxMm=width-36))
    if not overview:
        text.extend([dict(x=73,y=258,value='50 mm',size=7.3,maxMm=20),
            dict(x=width-9,y=253,value='50 mm',size=6.6,right=True,maxMm=15)])
    text.extend([dict(x=18,y=height-9,value=COPY[locale]['detail'],size=7,maxMm=60),
        dict(x=width-18,y=height-9,value=detail_url(p,locale).removeprefix('https://'),size=6.2,right=True,maxMm=110)])
    return text


def chart_texts(p, locale):
    return [IDS[ID][locale],COPY[locale]['type'],copy_text(p,locale,'grid'),copy_text(p,locale,'motif'),COPY[locale]['materials'],
        *[f"{c['symbol']}: {c['name']} {c['ref']} ({c['count']})" for c in p['palette'].values()],
        *[value for index in range(4) for value in board_copy(locale,index)],
        *[copy_text(p,locale,key) for key in ('blank','color','physical','chart','seam','joining')]]


def characters(patterns):
    pdf_values,chart_values=[],[]
    for p in patterns:
        for locale in LOCALES:
            chart_values.extend(chart_texts(p,locale))
            for paper in PAPERS:
                for index in (None,0,1,2,3):
                    pdf_values.extend(entry['value'] for entry in pdf_entries(p,locale,paper,index))
    numerals=''.join(str(n) for n in range(1,59))
    pdf_chars=''.join(sorted(set(''.join(pdf_values)+numerals)))
    chart_chars=''.join(sorted(set(''.join(chart_values)+numerals)))
    union=''.join(sorted(set(pdf_chars+chart_chars)))
    return dict(characters=union,count=len(union),sha256=digest(union.encode()),
        pdfCharactersSha256=digest(pdf_chars.encode()),chartCharactersSha256=digest(chart_chars.encode()))


def draw_grid(pdf, p, width, height, index=None):
    overview=index is None
    pitch,n,top= (2.5,58,42) if overview else (5,29,44)
    x0=(width/mm-145)/2
    bx,by=(0,0) if overview else BOARDS[index]
    for y in range(n):
        for x in range(n):
            symbol=p['rows'][y+by*29][x+bx*29]
            if symbol=='.':continue
            c=p['palette'][symbol]
            pdf.setFillColorRGB(*(v/255 for v in c['rgb']))
            pdf.rect((x0+x*pitch)*mm,height-(top+(y+1)*pitch)*mm,pitch*mm,pitch*mm,stroke=0,fill=1)
            if not overview:
                fg='#ffffff' if sum(a*b for a,b in zip(c['rgb'],(.299,.587,.114)))<150 else '#17231b'
                pdf.setFillColor(HexColor(fg));pdf.setFont(FONT_NAME,6.5)
                pdf.drawCentredString((x0+(x+.5)*pitch)*mm,height-(top+(y+.5)*pitch)*mm-2.2,symbol)
    for i in range(n+1):
        major=(i%5==0 or i==n or (overview and i==29))
        pdf.setLineWidth((.3 if overview and i==29 else .21 if major else .1)*mm)
        pdf.setStrokeColor(HexColor('#25342e' if overview and i==29 else '#65736b' if major else '#a2aaa6'))
        pdf.line((x0+i*pitch)*mm,height-top*mm,(x0+i*pitch)*mm,height-(top+145)*mm)
        pdf.line(x0*mm,height-(top+i*pitch)*mm,(x0+145)*mm,height-(top+i*pitch)*mm)
    pdf.setFont(FONT_NAME,5.5);pdf.setFillColor(HexColor('#59655f'))
    for i in range(n):
        if overview and i not in (0,28,29,57):continue
        pdf.drawCentredString((x0+(i+.5)*pitch)*mm,height-(top-1.5)*mm,str(i+bx*29+1))
        pdf.drawRightString((x0-2)*mm,height-(top+(i+.5)*pitch)*mm-2,str(i+by*29+1))


def write_pdf(p, locale, paper, destination):
    width,height=PAPERS[paper]
    destination.parent.mkdir(parents=True,exist_ok=True)
    with destination.open('xb') as handle:
        pdf=canvas.Canvas(handle,pagesize=PAPERS[paper],invariant=1,pageCompression=1,
            initialFontName=FONT_NAME,initialFontSize=8,lang=LANGUAGES[locale])
        pdf.setTitle(IDS[ID][locale]+' - '+COPY[locale]['type']);pdf.setAuthor('Fuse Bead Patterns team')
        pdf.setSubject(f'{locale}; Perler Midi; 58 x 58; 2 x 2 boards; four 5 mm board pages; {paper}; 100%')
        pdf.setViewerPreference('PrintScaling','None')
        for index in (None,0,1,2,3):
            for entry in pdf_entries(p,locale,paper,index):
                assert pdfmetrics.stringWidth(entry['value'],FONT_NAME,entry['size'])<=entry.get('maxMm',width/mm-36)*mm,(locale,paper,entry)
                pdf.setFont(FONT_NAME,entry['size']);pdf.setFillColor(HexColor('#25342e'))
                method=pdf.drawRightString if entry.get('right') else pdf.drawString
                method(entry['x']*mm,height-entry['y']*mm,entry['value'])
            draw_grid(pdf,p,width,height,index)
            col_width=(width/mm-42)/2
            for num,c in enumerate(p['palette'].values()):
                col,row=divmod(num,4);x=18+col*(col_width+6);y=209+row*6
                pdf.setFillColorRGB(*(v/255 for v in c['rgb']))
                pdf.rect(x*mm,height-(y+.6)*mm,3*mm,3*mm,stroke=0,fill=1)
            if index is not None:
                pdf.setStrokeColor(HexColor('#25342e'));pdf.setLineWidth(.35*mm)
                pdf.line(18*mm,height-256.5*mm,68*mm,height-256.5*mm)
                for x in (18,68):pdf.line(x*mm,height-255*mm,x*mm,height-258*mm)
                vx=width/mm-10
                pdf.line(vx*mm,height-200*mm,vx*mm,height-250*mm)
                for y in (200,250):pdf.line((vx-1.5)*mm,height-y*mm,(vx+1.5)*mm,height-y*mm)
            pdf.linkURL(detail_url(p,locale),(18*mm,7*mm,width-18*mm,15*mm),relative=0)
            pdf.showPage()
        pdf.save()


def close(a,b,tolerance=.015):
    return abs(a-b)<tolerance


def validate_pdf(p, locale, paper, destination):
    reader=PdfReader(destination)
    assert len(reader.pages)==5 and reader.trailer['/Root']['/Lang']==LANGUAGES[locale]
    assert reader.metadata.title==IDS[ID][locale]+' - '+COPY[locale]['type']
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling']=='/None'
    for page in reader.pages:
        assert [a.get_object()['/A']['/URI'] for a in page['/Annots']]==[detail_url(p,locale)]
        fonts=[f.get_object() for f in page['/Resources']['/Font'].values() if FONT_NAME in f.get_object()['/BaseFont']]
        assert fonts and all(f['/FontDescriptor']['/FontFile2'].get_data() and f['/ToUnicode'].get_data() for f in fonts)
    width,height=PAPERS[paper];x0=(width/mm-145)/2
    merged={};merged_symbols={};covered=set();page_counts=[]
    # Deliberately independent of BOARDS/board_colors, the renderer's partition.
    origins=((0,0),(29,0),(0,29),(29,29))
    with pdfplumber.open(destination) as document:
        for page_index,page in enumerate(document.pages):
            index=None if page_index==0 else page_index-1
            assert close(page.width,width) and close(page.height,height)
            assert all(c['x0']>=17*mm and c['x1']<=(width/mm-8.5)*mm and c['top']>=8*mm and c['bottom']<=(height/mm-7)*mm for c in page.chars),'Text outside page margins'
            compact=re.sub(r'\s+','',page.extract_text())
            for entry in pdf_entries(p,locale,paper,index):
                assert re.sub(r'\s+','',entry['value']) in compact,(locale,paper,page_index,entry['value'])
            pitch,n,top=(2.5,58,42) if index is None else (5,29,44)
            origin=(0,0) if index is None else origins[index]
            cells={}
            for rect in page.rects:
                if close(rect['width'],pitch*mm) and close(rect['height'],pitch*mm):
                    x,y=(rect['x0']/mm-x0)/pitch,(rect['top']/mm-top)/pitch
                    assert close(x,round(x)) and close(y,round(y))
                    point=(round(x)+origin[0],round(y)+origin[1])
                    assert point not in cells and origin[0]<=point[0]<origin[0]+n and origin[1]<=point[1]<origin[1]+n
                    cells[point]=tuple(round(v*255) for v in rect['non_stroking_color'])
            expected={point:tuple(c['rgb']) for point,c in p['occupied'].items()
                if origin[0]<=point[0]<origin[0]+n and origin[1]<=point[1]<origin[1]+n}
            assert cells==expected,(locale,paper,page_index,'Grid cells differ')
            if index is not None:
                independent_range=COPY[locale]['range'].format(r0=origin[1]+1,r1=origin[1]+29,c0=origin[0]+1,c1=origin[0]+29)
                assert re.sub(r'\s+','',independent_range) in compact,'Wrong global range label'
                for y in range(origin[1],origin[1]+29):
                    for x in range(origin[0],origin[0]+29):
                        assert (x,y) not in covered,'Duplicated board coordinate'
                        covered.add((x,y))
                assert not set(merged).intersection(cells),'Occupied cells repeated between board pages'
                merged.update(cells);page_counts.append(len(cells))
                symbols={}
                for char in page.chars:
                    x,y=(char['x0']+char['x1'])/2/mm,(char['top']+char['bottom'])/2/mm
                    if x0<x<x0+145 and top<y<top+145:
                        point=(int((x-x0)//5)+origin[0],int((y-top)//5)+origin[1])
                        assert point not in symbols
                        symbols[point]=char['text']
                assert symbols=={point:p['rows'][point[1]][point[0]] for point in expected}
                merged_symbols.update(symbols)
                # Independently confirm all 29 global column and row labels.
                labels_x=[c for c in page.chars if (top-4)*mm<c['top']<top*mm and x0*mm<c['x0']<(x0+145)*mm]
                labels_y=[c for c in page.chars if (x0-6)*mm<c['x0']<x0*mm and top*mm<c['top']<(top+145)*mm]
                for i in range(29):
                    x=(x0+(i+.5)*5)*mm
                    label=''.join(c['text'] for c in sorted(labels_x,key=lambda c:c['x0']) if abs((c['x0']+c['x1'])/2-x)<2.2*mm)
                    assert label==str(origin[0]+i+1),('Global column label',page_index,i,label)
                    y=(top+(i+.5)*5)*mm
                    label=''.join(c['text'] for c in sorted(labels_y,key=lambda c:c['x0']) if abs((c['top']+c['bottom'])/2-y)<2.2*mm)
                    assert label==str(origin[1]+i+1),('Global row label',page_index,i,label)
                assert any(close(l['x0'],18*mm) and close(l['x1'],68*mm) and close(l['top'],256.5*mm) and close(l['height'],0) for l in page.lines)
                assert any(close(l['x0'],width-10*mm) and close(l['top'],200*mm) and close(l['bottom'],250*mm) and close(l['width'],0) for l in page.lines)
            for i in range(n+1):
                assert any(close(l['x0'],x0*mm) and close(l['x1'],(x0+145)*mm) and close(l['top'],(top+i*pitch)*mm) and close(l['height'],0) for l in page.lines)
                assert any(close(l['x0'],(x0+i*pitch)*mm) and close(l['top'],top*mm) and close(l['bottom'],(top+145)*mm) and close(l['width'],0) for l in page.lines)
            quantities=Counter(p['rows'][y][x] for x,y in expected)
            col_width=(width/mm-42)/2
            for num,c in enumerate(p['palette'].values()):
                col,row=divmod(num,4);x=18+col*(col_width+6);y=209+row*6
                block=page.crop((x*mm,(y-4)*mm,(x+col_width+1)*mm,(y+1)*mm)).extract_text()
                assert all(value in block for value in (c['symbol'],c['ref'],c['name'],str(quantities[c['symbol']]))),(page_index,block)
                assert re.search(rf'\b{quantities[c["symbol"]]}\b',block),'Wrong per-page material quantity'
        assert covered=={(x,y) for y in range(58) for x in range(58)},'Missing or repeated global grid cells'
        assert merged=={point:tuple(c['rgb']) for point,c in p['occupied'].items()}
        restored=bytes(channel for y in range(58) for x in range(58)
            for channel in (list(merged[(x,y)])+[255] if (x,y) in merged else [0,0,0,0]))
        assert restored==p['rgba'],'Four board pages fail to reconstruct exact native RGBA'
        assert merged_symbols=={(x,y):p['rows'][y][x] for x,y in p['occupied']}
        assert sum(page_counts)==p['beads'] and page_counts==p['boardCounts']
        assert Counter(merged.values())==Counter({tuple(c['rgb']):c['count'] for c in p['palette'].values()})
    return dict(id=ID,locale=locale,paper=paper,path=str(destination),sha256=digest(destination.read_bytes()),
        pages=5,overviewScaled=True,boardGridSize=[29,29],boardGridPitchMm=5,gridSize=[58,58],boardCount=4,
        beads=p['beads'],colors=p['colorCount'],boardBeads=page_counts,globalCoordinatesCovered=3364,
        noRepeatedOrMissingCoordinates=True,mergedRgbaSha256=digest(restored),mergedRgbaExact=True,
        globalSymbolsExact=True,globalRowColumnLabelsExact=True,rulerLengthsMmPerBoard=[50,50],
        embeddedFont=True,nativeLang=True,printScaling='None',detailLink=detail_url(p,locale),physicalTested=False)


def chart_svg(p,locale,font):
    width,margin,cell,top=1484,46,24,54
    end=top+58*cell;body=[];labels=[]
    def label(value,x,y,size=16,max_width=1392,anchor='left',fill='#25342e'):
        assert text_width(value,size,font)<=max_width,(locale,value)
        labels.append(dict(text=value,x=x,baseline=y,size=size,anchor=anchor))
        body.append(path_text(value,x,y,size,font,fill,anchor))
    label(IDS[ID][locale],46,28,23)
    for (x,y),c in p['occupied'].items():
        body.append(f'<rect x="{margin+x*cell}" y="{top+y*cell}" width="24" height="24" fill="{c["hex"]}"/>')
    for i in range(59):
        pos=i*cell;major=i%5==0 or i in (29,58)
        stroke=2.2 if i==29 else 1.3 if major else .6
        body.append(f'<path d="M{margin+pos},{top}V{end}M{margin},{top+pos}H{margin+58*cell}" stroke="{"#25342e" if i==29 else "#65736b" if major else "#a2aaa6"}" stroke-width="{stroke}" fill="none"/>')
    for i in range(58):
        label(str(i+1),margin+(i+.5)*cell,46,10,24,'middle')
        label(str(i+1),28,top+(i+.5)*cell+3,10,24,'middle')
    for (x,y),c in p['occupied'].items():
        fill='#ffffff' if sum(a*b for a,b in zip(c['rgb'],(.299,.587,.114)))<150 else '#17231b'
        label(c['symbol'],margin+(x+.5)*cell,top+(y+.5)*cell+4,10,24,'middle',fill)
    y=end+38
    for value in [COPY[locale]['type'],copy_text(p,locale,'grid'),copy_text(p,locale,'motif'),COPY[locale]['materials']]:
        for line in wrapped(value,17,1392,font):label(line,46,y,17);y+=27
    for num,c in enumerate(p['palette'].values()):
        col,row=divmod(num,4)
        label(f"{c['symbol']}: {c['name']} {c['ref']} ({c['count']})",46+col*710,y+row*25,16,680)
    y+=4*25+12
    for index in range(4):
        position,ranges=board_copy(locale,index)
        label(position+' / '+ranges,46,y,16);y+=26
    for key in ('blank','color','physical','chart','seam','joining'):
        for line in wrapped(copy_text(p,locale,key),16,1392,font):label(line,46,y,16);y+=25
        y+=5
    height=int(y+15)
    title=IDS[ID][locale]+' - '+COPY[locale]['type']
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" xml:lang="{locale}" role="img"><title>{escape(title)}</title><desc>{escape(copy_text(p,locale,"grid"))}</desc><rect width="100%" height="100%" fill="white"/>'+''.join(body)+'</svg>'
    assert '<text' not in svg and '<image' not in svg and '<script' not in svg
    return svg.encode(),dict(width=width,height=height,labels=labels,gridX=margin,gridTop=top,cellSize=cell)


def validate_chart(p,locale,svg,png,layout,destination):
    with Image.open(io.BytesIO(png)) as img:
        assert img.size==(layout['width'],layout['height'])
        rgba=img.convert('RGBA');assert all(a==255 for a in rgba.getchannel('A').getdata())
        for y,row in enumerate(p['rows']):
            for x,symbol in enumerate(row):
                expected=tuple(p['palette'][symbol]['rgb'])+(255,) if symbol!='.' else (255,255,255,255)
                assert rgba.getpixel((46+x*24+4,54+y*24+4))==expected,(locale,x,y)
    return dict(id=ID,locale=locale,href='/'+destination.as_posix(),width=layout['width'],height=layout['height'],
        svgSha256=digest(svg),pngSha256=digest(png),all3364CellColorsChecked=True,allPixelsOpaque=True,
        nativeGlyphOutlines=True,noExternalFont=True,physicalTested=False)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack',required=True,type=Path);parser.add_argument('--output',type=Path)
    parser.add_argument('--font-dir',type=Path);parser.add_argument('--review-lock',type=Path)
    parser.add_argument('--node',default='node')
    modes=parser.add_mutually_exclusive_group()
    modes.add_argument('--font-characters',action='store_true');modes.add_argument('--build-font',action='store_true')
    modes.add_argument('--check-only',action='store_true')
    args=parser.parse_args();patterns=load_patterns(args.pack,args.review_lock);inventory=characters(patterns)
    if args.font_characters:print(json.dumps(inventory,ensure_ascii=False));return
    assert args.font_dir,'Explicit --font-dir required'
    if args.build_font:print(json.dumps(build_font(args.font_dir,inventory),ensure_ascii=False));return
    assert args.output and args.review_lock,'PDF authoring/checking requires --output and an independent --review-lock'
    output=safe_location(args.output,writing=not args.check_only)
    assert output.name=='generated-multiboard-downloads'
    font=read_font(args.font_dir,inventory)
    if not args.check_only:output.mkdir(parents=True)
    pdf_checks=[];chart_checks=[];grid_manifest={loc:{} for loc in LOCALES}
    for p in patterns:
        for locale in LOCALES:
            folder=relative_folder(p,locale)
            for paper in PAPERS:
                destination=output/folder/('pattern.pdf' if paper=='a4' else 'pattern-letter.pdf')
                if not args.check_only:write_pdf(p,locale,paper,destination)
                result=validate_pdf(p,locale,paper,destination);result['path']=str(destination.relative_to(output));pdf_checks.append(result)
            svg,layout=chart_svg(p,locale,font);png=svg_png(svg,args.node)
            png_relative=folder/'grid.png';svg_destination=output/folder/'grid.svg';png_destination=output/png_relative
            if args.check_only:
                assert svg_destination.read_bytes()==svg and png_destination.read_bytes()==png,'Stored chart differs from complete SVG/glyph rendering'
            else:
                for path,data in [(svg_destination,svg),(png_destination,png)]:
                    path.parent.mkdir(parents=True,exist_ok=True)
                    with path.open('xb') as handle:handle.write(data)
            check=validate_chart(p,locale,svg,png,layout,png_relative);chart_checks.append(check)
            grid_manifest[locale][ID]={key:check[key] for key in ('href','width','height')}
    report=dict(patternIds=[ID],pdfCount=8,pdfPageCount=40,chartCount=4,pdfs=pdf_checks,charts=chart_checks,
        source=[{key:p[key] for key in ('id','rowsSha256','rgbaSha256','projectSha256','beads','colorCount','boardCounts','digitalComponents')} for p in patterns],
        physicalAssemblyTested=False,ironingTested=False,jointStrengthTested=False)
    for name,data in [('grid-assets.json',grid_manifest),('download-checks.json',report)]:
        path=output/name;encoded=json_bytes(data)
        if args.check_only:assert path.read_bytes()==encoded,f'Changed report: {name}'
        else:
            with path.open('xb') as handle:handle.write(encoded)
    print(json.dumps(dict(status='checked' if args.check_only else 'created',pdfCount=len(pdf_checks),pdfPages=40,chartCount=len(chart_checks),output=str(output)),ensure_ascii=False))


if __name__=='__main__':
    main()

"""Build the three reviewed Rave originals' 24 PDFs and 12 native count charts.

Only explicit private staging destinations are written. --font-characters and
--check-only are read-only; --build-font creates only a new dedicated font.
Physical assembly, ironing, attachment and wear strength remain untested.
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
FONT_NAME = 'FuseBeadRaveLabels'
FONT_FILE = FONT_NAME + '-Regular.ttf'
FONT_FAMILY = 'Fuse Bead Rave Labels'
LOCALES = ('en', 'de', 'fr', 'ja')
PAPERS = {'a4': A4, 'letter': letter}
LANGUAGES = {'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}
IDS = {
    'original-rave-alien-head': {
        'slug': 'alien-head', 'en': 'Alien Head', 'de': 'Alien-Kopf',
        'fr': 'Tête d’alien', 'ja': 'エイリアンの顔',
    },
    'original-rave-rainbow-smiley': {
        'slug': 'rainbow-smiley', 'en': 'Rainbow Smiley', 'de': 'Regenbogen-Smiley',
        'fr': 'Smiley arc-en-ciel', 'ja': '虹色スマイル',
    },
    'original-rave-moon-mushroom': {
        'slug': 'crescent-moon-mushroom', 'en': 'Crescent Moon Mushroom',
        'de': 'Mondsichel mit Pilz', 'fr': 'Croissant de lune et champignon', 'ja': '三日月ときのこ',
    },
}
# Populate only after root visual review, from independently retained source rows.
# --review-lock requires those reviewed values; manifest self-declared hashes alone
# never establish approval. Font inventory/generation may precede visual approval.
COPY = {
    'en': {
        'type': 'Perler Bead Pattern', 'grid': '29 x 29 grid / 1 Midi board / {beads} beads / {colors} colors',
        'motif': 'Motif: {width} x {height} beads.', 'materials': 'Perler Midi materials',
        'header': 'Symbol / color ref / product name: EN', 'count': 'Count',
        'blank': 'Empty cells need no beads. White cells with a symbol need white beads.',
        'color': 'Screen and print colors are approximate. Check the product color refs.',
        'physical': 'Original digital design. Assembly, ironing, attachment and wear strength untested.',
        'print': '{paper}: print at 100% / Actual size. Turn off "Fit to page".',
        'scale': 'Both rulers must measure 50 mm. Check 5 mm spacing against your Midi board.',
        'detail': 'Pattern and editor',
        'chart': 'Counting chart only; not a calibrated actual-size placement template.',
    },
    'de': {
        'type': 'Bügelperlen-Vorlage', 'grid': '29 x 29 Felder / 1 Midi-Platte / {beads} Perlen / {colors} Farben',
        'motif': 'Motiv: {width} x {height} Perlen.', 'materials': 'Materialliste: Perler Midi',
        'header': 'Symbol / Farbnummer / Produktname: EN', 'count': 'Anzahl',
        'blank': 'Leere Felder bleiben ohne Perle. Weiße Felder mit Symbol brauchen weiße Perlen.',
        'color': 'Bildschirm- und Druckfarben sind Näherungen. Farbnummern prüfen.',
        'physical': 'Digitales Original. Bau, Bügeln, Befestigung und Tragefestigkeit ungeprüft.',
        'print': '{paper}: 100% / Tatsächliche Größe. "An Seite anpassen" ausschalten.',
        'scale': 'Beide Messlinien müssen 50 mm messen. Das 5-mm-Raster an der Midi-Platte prüfen.',
        'detail': 'Vorlage und Editor',
        'chart': 'PNG zum Zählen; keine kalibrierte Vorlage zum Auflegen in tatsächlicher Größe.',
    },
    'fr': {
        'type': 'Modèle de perles à repasser', 'grid': '29 x 29 cases / 1 plaque Midi / {beads} perles / {colors} couleurs',
        'motif': 'Motif : {width} x {height} perles.', 'materials': 'Matériel : Perler Midi',
        'header': 'Symbole / référence / nom du produit : EN', 'count': 'Quantité',
        'blank': 'Cases vides : sans perle. Une case blanche avec un symbole demande une perle blanche.',
        'color': 'Les couleurs à l’écran et sur papier sont approximatives. Vérifiez les références.',
        'physical': 'Original numérique. Assemblage, repassage, fixation et résistance en port non testés.',
        'print': '{paper} : 100% / Taille réelle. Désactivez "Ajuster à la page".',
        'scale': 'Les deux repères doivent mesurer 50 mm. Vérifiez le pas de 5 mm sur votre plaque Midi.',
        'detail': 'Modèle et éditeur',
        'chart': 'Grille PNG pour compter, pas un gabarit calibré à taille réelle.',
    },
    'ja': {
        'type': 'アイロンビーズ図案', 'grid': '29 x 29マス / ミディ用プレート1枚 / {beads}個 / {colors}色',
        'motif': '図柄：横{width} x 縦{height}マス。', 'materials': 'Perler Midiの材料表',
        'header': '記号 / 色番号 / 商品色名: EN', 'count': '個数',
        'blank': '空白には置きません。記号のある白いマスには白いビーズを置きます。',
        'color': '画面と印刷の色は目安です。実物のビーズの色番号を確認してください。',
        'physical': 'オリジナルのデジタル図案。実物制作・アイロン・取り付け・着用強度は未検証です。',
        'print': '{paper}・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'scale': '縦横の確認線は各50 mm。1マス5 mmの間隔を実物のミディ用プレートで確認。',
        'detail': '図案とエディター',
        'chart': 'PNGはマスを数える図案です。実寸で重ねるための校正済み型紙ではありません。',
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


def load_patterns(pack, review_lock=None):
    pack = safe_location(pack)
    assert pack.name == 'original-rave-v1' and 'artifacts' in pack.parts
    manifest = json.loads((pack / 'manifest.json').read_text())
    assert [p['id'] for p in manifest['patterns']] == list(IDS), 'Unexpected sourcepack IDs/order'
    locks = json.loads(review_lock.read_text()) if review_lock else None
    if locks is not None:
        assert set(locks) == set(IDS), 'Review lock must explicitly cover three designs'
    with (ROOT / 'public/palettes/perler.csv').open(newline='') as source:
        available = {row[0]: row for row in csv.reader(source)}
    patterns = []
    for original in manifest['patterns']:
        p = dict(original)
        identity = IDS[p['id']]
        assert p['kind'] == 'original' and p['source'] is None
        assert p['slug'] == identity['slug'] and p['title'] == identity['en']
        assert p['localizedSubjects'] == {loc: identity[loc] for loc in ('de', 'fr', 'ja')}
        assert p['width'] == p['height'] == 29
        assert len(p['rows']) == 29 and all(isinstance(row, str) and len(row) == 29 for row in p['rows'])
        palette, counts = p['palette'], Counter(''.join(p['rows']).replace('.', ''))
        assert set(palette) == set(counts) and 1 <= len(palette) <= 7
        assert all(re.fullmatch(r'[A-Z0-9]', symbol) for symbol in palette)
        assert p['materials'] == list(palette.values())
        assert p['beads'] == sum(counts.values()) and p['colorCount'] == len(palette)
        for symbol, color in palette.items():
            bead = available[color['ref']]
            rgb = [int(v) for v in bead[3:6]]
            assert color['symbol'] == symbol and color['count'] == counts[symbol]
            assert color['name'] == bead[1] and color['rgb'] == rgb
            assert color['hex'] == '#' + bytes(rgb).hex()
        assert len({c['ref'] for c in palette.values()}) == len(palette)
        assert len({tuple(c['rgb']) for c in palette.values()}) == len(palette)
        rgba = bytes(v for row in p['rows'] for symbol in row
                     for v in (palette[symbol]['rgb'] + [255] if symbol != '.' else [0, 0, 0, 0]))
        p['rowsSha256'], p['rgbaSha256'] = digest('\n'.join(p['rows']).encode()), digest(rgba)
        if locks:
            assert locks[p['id']]['rowsSha256'] == p['rowsSha256'], 'Reviewed symbol rows changed'
            assert locks[p['id']]['rgbaSha256'] == p['rgbaSha256'], 'Reviewed RGBA changed'
        with Image.open(pack / 'pixels' / (p['id'] + '.png')) as img:
            assert img.mode == 'RGBA' and img.size == (29, 29) and img.tobytes() == rgba
        raw_project = (pack / 'projects' / (p['id'] + '.bead-pattern.json')).read_bytes()
        project = json.loads(raw_project)
        assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
        draft = project['draft']
        assert draft['version'] == 1 and draft['sourceMode'] == 'blank' and draft['imageSrc'] is None
        assert draft['selectedPaletteIds'] == ['perler']
        assert (draft['boardId'], draft['boardWidth'], draft['boardHeight']) == ('midi', 1, 1)
        edited = draft['editedPattern']
        assert (edited['width'], edited['height'], edited['byteLength']) == (29, 29, len(rgba))
        assert base64.b64decode(edited['data'], validate=True) == rgba
        assert len(draft['activePalettes']) == 1 and draft['activePalettes'][0]['name'] == 'Perler Midi'
        entries = {c['ref']: c for c in draft['activePalettes'][0]['entries']}
        assert set(entries) == {c['ref'] for c in palette.values()}
        for color in palette.values():
            entry = entries[color['ref']]
            assert entry['enabled'] is True and entry['symbol'] == color['symbol'] and entry['name'] == color['name']
            assert entry['color'] == dict(zip(('r', 'g', 'b', 'a'), color['rgb'] + [255]))
        p['occupied'] = {(x, y): palette[symbol] for y, row in enumerate(p['rows'])
                         for x, symbol in enumerate(row) if symbol != '.'}
        xs, ys = zip(*p['occupied'])
        assert p['bounds'] == dict(x=min(xs), y=min(ys), width=max(xs)-min(xs)+1, height=max(ys)-min(ys)+1)
        p['digitalComponents'] = components(p['occupied'])
        assert p['digitalComponents'] == [p['beads']], 'These three candidates must be digitally connected'
        for key in ('physicalAssemblyTested', 'ironingTested', 'hangingTested', 'loadStrengthTested'):
            assert p.get(key) is False, f'{key} must remain explicitly untested'
        p['projectSha256'] = digest(raw_project)
        patterns.append(p)
    assert len({p['rgbaSha256'] for p in patterns}) == 3, 'Do not count duplicate pixels as different works'
    return patterns


def detail_url(p, locale):
    return SITE + ('' if locale == 'en' else '/' + locale) + '/patterns/' + p['slug']


def relative_folder(p, locale):
    return Path('patterns' if locale == 'en' else 'patterns-' + locale) / p['id']


def copy_text(p, locale, key, paper='a4'):
    return COPY[locale][key].format(beads=p['beads'], colors=p['colorCount'],
        width=p['bounds']['width'], height=p['bounds']['height'], paper='A4' if paper == 'a4' else 'US Letter')


def pdf_entries(p, locale, paper):
    width, height = [v / mm for v in PAPERS[paper]]
    text = [
        dict(x=18, y=13, value='FUSE BEAD PATTERNS', size=8),
        dict(x=width-18, y=13, value=COPY[locale]['type'], size=7, right=True, maxMm=85),
        dict(x=18, y=25, value=IDS[p['id']][locale], size=15, maxMm=width-36),
        dict(x=18, y=33, value=copy_text(p, locale, 'grid'), size=8.2),
        dict(x=18, y=191.5, value=COPY[locale]['materials'], size=9.5),
    ]
    column_width = (width-42) / 2
    for col in range(2):
        x = 18 + col*(column_width+6)
        text.append(dict(x=x, y=198, value=COPY[locale]['header'], size=6.4, maxMm=column_width-13))
        text.append(dict(x=x+column_width, y=198, value=COPY[locale]['count'], size=6.4, right=True, maxMm=13))
    for index, color in enumerate(p['palette'].values()):
        col, row = divmod(index, 4)
        x, y = 18 + col*(column_width+6), 205+row*7
        text.extend([
            dict(x=x+5, y=y, value=color['symbol'], size=7.6, maxMm=6),
            dict(x=x+13, y=y, value=color['ref'], size=7.2, maxMm=24),
            dict(x=x+37, y=y, value=color['name'], size=7.0, maxMm=column_width-48),
            dict(x=x+column_width, y=y, value=str(color['count']), size=7.2, right=True, maxMm=10),
        ])
    for key, y in [('blank', 232), ('color', 237), ('physical', 242), ('print', 248), ('scale', 264)]:
        text.append(dict(x=18, y=y, value=copy_text(p, locale, key, paper), size=6.7, maxMm=width-36))
    text.extend([
        dict(x=73, y=257, value='50 mm', size=7.5, maxMm=20),
        dict(x=width-9, y=251, value='50 mm', size=6.8, right=True, maxMm=15),
        dict(x=18, y=height-9, value=COPY[locale]['detail'], size=7, maxMm=60),
        dict(x=width-18, y=height-9, value=detail_url(p, locale).removeprefix('https://'), size=6.2, right=True, maxMm=110),
    ])
    return text


def chart_texts(p, locale):
    return [IDS[p['id']][locale], COPY[locale]['type'], copy_text(p, locale, 'grid'),
        copy_text(p, locale, 'motif'), COPY[locale]['materials'],
        *[f"{c['symbol']}: {c['name']} {c['ref']} ({c['count']})" for c in p['palette'].values()],
        *[copy_text(p, locale, key) for key in ('blank', 'color', 'physical', 'chart')]]


def characters(patterns):
    pdf_values, chart_values = [], []
    for p in patterns:
        for loc in LOCALES:
            chart_values.extend(chart_texts(p, loc))
            for paper in PAPERS:
                pdf_values.extend(v['value'] for v in pdf_entries(p, loc, paper))
    numerals = ''.join(str(n) for n in range(1, 30))
    pdf_chars = ''.join(sorted(set(''.join(pdf_values)+numerals)))
    chart_chars = ''.join(sorted(set(''.join(chart_values)+numerals)))
    union = ''.join(sorted(set(pdf_chars+chart_chars)))
    return dict(characters=union, count=len(union), sha256=digest(union.encode()),
                pdfCharactersSha256=digest(pdf_chars.encode()), chartCharactersSha256=digest(chart_chars.encode()))


def build_font(directory, inventory):
    from fontTools import subset, __version__
    from fontTools.ttLib import TTFont as FontToolsFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.boundsPen import BoundsPen
    assert __version__ == '4.60.1', 'Use pinned fontTools 4.60.1 for this dedicated font'
    directory = safe_location(directory, writing=True)
    assert directory.name == 'rave-labels', 'Use a new scripts/fonts/rave-labels or staging rave-labels directory'
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
        subsetPurpose='Original Rave EN/DE/FR/JA PDF and count charts; no old-font refresh',
        subsetSha256=digest(font_bytes), glyphsSha256=digest(glyph_bytes),
        charactersSha256=inventory['sha256'], characterCount=inventory['count'],
        patternIds=list(IDS), chartCount=12, pdfCount=24,
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
    assert lock['patternIds'] == list(IDS) and lock['pdfCount'] == 24 and lock['chartCount'] == 12
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


def write_pdf(p, locale, paper, destination):
    width, height = PAPERS[paper]
    x0, top, pitch = (width/mm-145)/2, 40, 5
    entries = pdf_entries(p, locale, paper)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('xb') as handle:
        pdf = canvas.Canvas(handle, pagesize=PAPERS[paper], invariant=1, pageCompression=1,
                            initialFontName=FONT_NAME, initialFontSize=8, lang=LANGUAGES[locale])
        pdf.setTitle(IDS[p['id']][locale]+' - '+COPY[locale]['type'])
        pdf.setAuthor('Fuse Bead Patterns team')
        pdf.setSubject(f'{locale}; Perler Midi; 29 x 29; 5 mm; {paper}; 100%')
        pdf.setViewerPreference('PrintScaling', 'None')
        for entry in entries:
            max_width = entry.get('maxMm', width/mm-36)*mm
            assert pdfmetrics.stringWidth(entry['value'], FONT_NAME, entry['size']) <= max_width, (locale,paper,entry)
            pdf.setFont(FONT_NAME,entry['size']); pdf.setFillColor(HexColor('#25342e'))
            method = pdf.drawRightString if entry.get('right') else pdf.drawString
            method(entry['x']*mm,height-entry['y']*mm,entry['value'])
        for (x,y), color in p['occupied'].items():
            pdf.setFillColorRGB(*(v/255 for v in color['rgb']))
            pdf.rect((x0+x*pitch)*mm,height-(top+(y+1)*pitch)*mm,pitch*mm,pitch*mm,stroke=0,fill=1)
            fg = '#ffffff' if sum(a*b for a,b in zip(color['rgb'],(.299,.587,.114))) < 150 else '#17231b'
            pdf.setFillColor(HexColor(fg)); pdf.setFont(FONT_NAME,6.5)
            pdf.drawCentredString((x0+(x+.5)*pitch)*mm,height-(top+(y+.5)*pitch)*mm-2.2,color['symbol'])
        for index in range(30):
            pdf.setLineWidth((.23 if index%5==0 or index==29 else .1)*mm)
            pdf.setStrokeColor(HexColor('#65736b' if index%5==0 or index==29 else '#a2aaa6'))
            pos=index*pitch
            pdf.line((x0+pos)*mm,height-top*mm,(x0+pos)*mm,height-(top+145)*mm)
            pdf.line(x0*mm,height-(top+pos)*mm,(x0+145)*mm,height-(top+pos)*mm)
        pdf.setFont(FONT_NAME,5.5); pdf.setFillColor(HexColor('#59655f'))
        for index in range(29):
            pdf.drawCentredString((x0+(index+.5)*pitch)*mm,height-(top-1.5)*mm,str(index+1))
            pdf.drawRightString((x0-2)*mm,height-(top+(index+.5)*pitch)*mm-2,str(index+1))
        column_width=(width/mm-42)/2
        for index,color in enumerate(p['palette'].values()):
            col,row=divmod(index,4); x=18+col*(column_width+6); y=205+row*7
            pdf.setFillColorRGB(*(v/255 for v in color['rgb']))
            pdf.rect(x*mm,height-(y+.6)*mm,3*mm,3*mm,stroke=0,fill=1)
        pdf.setStrokeColor(HexColor('#25342e')); pdf.setLineWidth(.35*mm)
        pdf.line(18*mm,height-255.5*mm,68*mm,height-255.5*mm)
        for x in (18,68): pdf.line(x*mm,height-254*mm,x*mm,height-257*mm)
        vx=width/mm-10
        pdf.line(vx*mm,height-198*mm,vx*mm,height-248*mm)
        for y in (198,248): pdf.line((vx-1.5)*mm,height-y*mm,(vx+1.5)*mm,height-y*mm)
        pdf.linkURL(detail_url(p,locale),(18*mm,7*mm,width-18*mm,15*mm),relative=0)
        pdf.showPage(); pdf.save()


def close(a,b,tolerance=.015):
    return abs(a-b)<tolerance


def validate_pdf(p,locale,paper,destination):
    reader=PdfReader(destination)
    assert len(reader.pages)==1 and reader.trailer['/Root']['/Lang']==LANGUAGES[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling']=='/None'
    assert [a.get_object()['/A']['/URI'] for a in reader.pages[0]['/Annots']]==[detail_url(p,locale)]
    fonts=[f.get_object() for f in reader.pages[0]['/Resources']['/Font'].values() if FONT_NAME in f.get_object()['/BaseFont']]
    assert fonts and all(f['/FontDescriptor']['/FontFile2'].get_data() and f['/ToUnicode'].get_data() for f in fonts)
    width,height=PAPERS[paper]; x0,top=(width/mm-145)/2,40
    with pdfplumber.open(destination) as document:
        page=document.pages[0]
        assert close(page.width,width) and close(page.height,height)
        assert all(c['x0']>=17*mm and c['x1']<=(width/mm-8.5)*mm and c['top']>=8*mm and c['bottom']<=(height/mm-7)*mm for c in page.chars),'Text outside page margins'
        compact=re.sub(r'\s+','',page.extract_text())
        for entry in pdf_entries(p,locale,paper):
            assert re.sub(r'\s+','',entry['value']) in compact,(p['id'],locale,paper,entry['value'])
        cells={}
        for rect in page.rects:
            if close(rect['width'],5*mm) and close(rect['height'],5*mm):
                x,y=(rect['x0']/mm-x0)/5,(rect['top']/mm-top)/5
                assert close(x,round(x)) and close(y,round(y))
                point=round(x),round(y)
                assert point not in cells and 0<=point[0]<29 and 0<=point[1]<29
                cells[point]=tuple(round(v*255) for v in rect['non_stroking_color'])
        assert cells=={point:tuple(c['rgb']) for point,c in p['occupied'].items()}
        symbols={}
        for char in page.chars:
            x,y=(char['x0']+char['x1'])/2/mm,(char['top']+char['bottom'])/2/mm
            if x0<x<x0+145 and top<y<top+145:
                point=int((x-x0)//5),int((y-top)//5)
                assert point not in symbols
                symbols[point]=char['text']
        assert symbols=={point:c['symbol'] for point,c in p['occupied'].items()}
        for index in range(30):
            assert any(close(l['x0'],x0*mm) and close(l['x1'],(x0+145)*mm) and close(l['top'],(top+index*5)*mm) and close(l['height'],0) for l in page.lines)
            assert any(close(l['x0'],(x0+index*5)*mm) and close(l['top'],top*mm) and close(l['bottom'],(top+145)*mm) and close(l['width'],0) for l in page.lines)
        assert any(close(l['x0'],18*mm) and close(l['x1'],68*mm) and close(l['top'],255.5*mm) and close(l['height'],0) for l in page.lines)
        assert any(close(l['x0'],width-10*mm) and close(l['top'],198*mm) and close(l['bottom'],248*mm) and close(l['width'],0) for l in page.lines)
        column_width=(width/mm-42)/2
        for index,c in enumerate(p['palette'].values()):
            col,row=divmod(index,4); x=18+col*(column_width+6); y=205+row*7
            block=page.crop((x*mm,(y-4)*mm,(x+column_width+1)*mm,(y+2)*mm)).extract_text()
            assert all(value in block for value in (c['symbol'],c['ref'],c['name'],str(c['count']))),(p['id'],locale,block)
        assert Counter(cells.values())==Counter({tuple(c['rgb']):c['count'] for c in p['palette'].values()})
    return dict(id=p['id'],locale=locale,paper=paper,path=str(destination),sha256=digest(destination.read_bytes()),
        pages=1,beads=p['beads'],colors=p['colorCount'],gridSize=[29,29],gridPitchMm=5,
        rulerLengthsMm=[50,50],pixelRgbCoordinatesExact=True,symbolsExact=True,materialCountsExact=True,
        embeddedFont=True,nativeLang=True,printScaling='None',detailLink=detail_url(p,locale),physicalTested=False)


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


def chart_svg(p,locale,font):
    width,margin,cell,top=788,46,24,54
    end=top+29*cell
    body=[]; labels=[]
    def label(value,x,y,size=14,max_width=696,anchor='left',fill='#25342e'):
        assert text_width(value,size,font)<=max_width,(locale,value)
        labels.append(dict(text=value,x=x,baseline=y,size=size,anchor=anchor))
        body.append(path_text(value,x,y,size,font,fill,anchor))
    label(IDS[p['id']][locale],46,28,21)
    for (x,y),c in p['occupied'].items():
        body.append(f'<rect x="{margin+x*cell}" y="{top+y*cell}" width="24" height="24" fill="{c["hex"]}"/>')
    for index in range(30):
        pos=index*cell; major=index%5==0 or index==29
        body.append(f'<path d="M{margin+pos},{top}V{end}M{margin},{top+pos}H{margin+29*cell}" stroke="{"#65736b" if major else "#a2aaa6"}" stroke-width="{1.3 if major else .6}" fill="none"/>')
    for index in range(29):
        label(str(index+1),margin+(index+.5)*cell,46,10,24,'middle')
        label(str(index+1),28,top+(index+.5)*cell+3,10,24,'middle')
    for (x,y),c in p['occupied'].items():
        fill='#ffffff' if sum(a*b for a,b in zip(c['rgb'],(.299,.587,.114)))<150 else '#17231b'
        label(c['symbol'],margin+(x+.5)*cell,top+(y+.5)*cell+4,10,24,'middle',fill)
    y=end+36
    for value in [COPY[locale]['type'],copy_text(p,locale,'grid'),copy_text(p,locale,'motif'),COPY[locale]['materials']]:
        for line in wrapped(value,14,696,font): label(line,46,y,14); y+=23
    for index,c in enumerate(p['palette'].values()):
        col,row=divmod(index,4)
        value=f"{c['symbol']}: {c['name']} {c['ref']} ({c['count']})"
        label(value,46+col*356,y+row*23,13,340)
    y+=4*23+8
    for key in ('blank','color','physical','chart'):
        for line in wrapped(copy_text(p,locale,key),13,696,font): label(line,46,y,13); y+=21
        y+=4
    height=int(y+15)
    title=IDS[p['id']][locale]+' - '+COPY[locale]['type']
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" xml:lang="{locale}" role="img"><title>{escape(title)}</title><desc>{escape(copy_text(p,locale,"grid"))}</desc><rect width="100%" height="100%" fill="white"/>'+''.join(body)+'</svg>'
    assert '<text' not in svg and '<image' not in svg and '<script' not in svg
    return svg.encode(),dict(width=width,height=height,labels=labels,gridX=margin,gridTop=top,cellSize=cell)


def svg_png(svg,node):
    code="const fs=require('node:fs');const sharp=require('sharp');sharp(fs.readFileSync(0)).png().toBuffer().then(b=>process.stdout.write(b)).catch(e=>{process.stderr.write(String(e));process.exit(1)});"
    result=subprocess.run([node,'-e',code],cwd=ROOT,input=svg,capture_output=True,check=True)
    return result.stdout


def validate_chart(p,locale,svg,png,layout,destination):
    with Image.open(io.BytesIO(png)) as img:
        assert img.size==(layout['width'],layout['height'])
        rgba=img.convert('RGBA'); assert all(a==255 for a in rgba.getchannel('A').tobytes())
        for y,row in enumerate(p['rows']):
            for x,symbol in enumerate(row):
                # A corner of each cell avoids its centered symbol and grid stroke.
                expected=tuple(p['palette'][symbol]['rgb'])+(255,) if symbol!='.' else (255,255,255,255)
                assert rgba.getpixel((46+x*24+4,54+y*24+4))==expected,(locale,x,y)
    return dict(id=p['id'],locale=locale,href='/'+destination.as_posix(),width=layout['width'],height=layout['height'],
        svgSha256=digest(svg),pngSha256=digest(png),all841CellColorsChecked=True,allPixelsOpaque=True,
        nativeGlyphOutlines=True,noExternalFont=True,physicalTested=False)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack',required=True,type=Path)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--font-dir',type=Path)
    parser.add_argument('--review-lock',type=Path)
    parser.add_argument('--node',default='node')
    modes=parser.add_mutually_exclusive_group()
    modes.add_argument('--font-characters',action='store_true')
    modes.add_argument('--build-font',action='store_true')
    modes.add_argument('--check-only',action='store_true')
    args=parser.parse_args()
    patterns=load_patterns(args.pack,args.review_lock)
    inventory=characters(patterns)
    if args.font_characters:
        print(json.dumps(inventory,ensure_ascii=False)); return
    assert args.font_dir,'Explicit --font-dir required'
    if args.build_font:
        print(json.dumps(build_font(args.font_dir,inventory),ensure_ascii=False)); return
    assert args.output and args.review_lock,'PDF authoring/checking requires --output and an independent --review-lock'
    output=safe_location(args.output,writing=not args.check_only)
    assert output.name=='generated-rave-downloads'
    font=read_font(args.font_dir,inventory)
    if not args.check_only: output.mkdir(parents=True)
    pdf_checks=[]; chart_checks=[]; grid_manifest={loc:{} for loc in LOCALES}
    for p in patterns:
        for locale in LOCALES:
            folder=relative_folder(p,locale)
            for paper in PAPERS:
                name='pattern.pdf' if paper=='a4' else 'pattern-letter.pdf'
                destination=output/folder/name
                if not args.check_only: write_pdf(p,locale,paper,destination)
                result=validate_pdf(p,locale,paper,destination); result['path']=str(destination.relative_to(output))
                pdf_checks.append(result)
            svg,layout=chart_svg(p,locale,font); png=svg_png(svg,args.node)
            png_relative=folder/'grid.png'; svg_destination=output/folder/'grid.svg'; png_destination=output/png_relative
            if args.check_only:
                assert svg_destination.read_bytes()==svg and png_destination.read_bytes()==png,'Stored chart differs from complete SVG/glyph rendering'
            else:
                for path,data in [(svg_destination,svg),(png_destination,png)]:
                    path.parent.mkdir(parents=True,exist_ok=True)
                    with path.open('xb') as handle: handle.write(data)
            check=validate_chart(p,locale,svg,png,layout,png_relative)
            chart_checks.append(check)
            grid_manifest[locale][p['id']]={key:check[key] for key in ('href','width','height')}
    report=dict(patternIds=list(IDS),pdfCount=24,chartCount=12,pdfs=pdf_checks,charts=chart_checks,
        source=[{key:p[key] for key in ('id','rowsSha256','rgbaSha256','projectSha256','beads','colorCount','digitalComponents')} for p in patterns],
        physicalAssemblyTested=False,ironingTested=False,attachmentOrWearStrengthTested=False)
    for name,data in [('grid-assets.json',grid_manifest),('download-checks.json',report)]:
        target=output/name; encoded=json_bytes(data)
        if args.check_only: assert target.read_bytes()==encoded,f'Changed report: {name}'
        else:
            with target.open('xb') as handle: handle.write(encoded)
    print(json.dumps(dict(status='checked' if args.check_only else 'created',pdfCount=len(pdf_checks),chartCount=len(chart_checks),output=str(output)),ensure_ascii=False))


if __name__=='__main__':
    main()

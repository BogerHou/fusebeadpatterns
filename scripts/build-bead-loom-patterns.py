#!/usr/bin/env python3
"""Build the original loom library offline from the same JSON used by TypeScript.

Only --refresh-font contacts the immutable official Google Fonts source.
Ordinary builds need reportlab, Pillow, pypdf and pdfplumber; fonttools is needed
only for a reviewed font refresh. Data checks do not replace rendered visual QA.
"""
from __future__ import annotations

import argparse
from collections import Counter
from hashlib import sha256
import io
import json
from pathlib import Path
import string
import urllib.request
import xml.etree.ElementTree as ET

import pdfplumber
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src/lib/bead-loom/patterns.json'
LIBRARY_DATA = json.loads(SOURCE.read_text())
DEST = ROOT / 'public/bead-loom-patterns'
FONT_DIR = ROOT / 'scripts/fonts/loom-patterns-jp'
FONT_PATH = FONT_DIR / 'FuseBeadLoomPatterns-Regular.ttf'
FONT_NAME = 'FuseBeadLoomPatterns'
LOCALES = ('en', 'de', 'fr', 'ja')
LANGS = {'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}
PAPERS = {'a4': A4, 'us-letter': letter}
INK = '#24352F'
MUTED = '#53635B'
RULE = '#A5AEA8'
SITE = 'https://fusebeadpatterns.art'
# The TypeScript public-asset tests also compare annotations with localeRoutes.
GALLERY_PATHS = LIBRARY_DATA['libraryPaths']
MAKER_PATHS = LIBRARY_DATA['makerPaths']
GRID_LEFT, GRID_TOP, CELL = 56, 112, 9.3
SVG_WIDTH, SVG_HEIGHT = 768, 180
UPSTREAM = {
    'repository': 'https://github.com/google/fonts',
    'revision': '66a36c8c94b1a5d992ee4e7f392fccfe4945767c',
    'fontUrl': 'https://raw.githubusercontent.com/google/fonts/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf',
    'fontSha256': 'c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f',
    'licenseUrl': 'https://raw.githubusercontent.com/google/fonts/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/OFL.txt',
    'licenseSha256': '1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9',
    'weight': 400,
    'license': 'SIL Open Font License 1.1',
}
COPY = {
    'en': {
        'chart': 'Chart and materials', 'materials': 'Color key and bead counts',
        'stats': '{columns} columns x {rows} rows / {beads} beads / {colors} colors',
        'count': '{count} beads', 'total': 'Total: {count} beads',
        'reading': 'How to read this chart',
        'start': 'Start at row 1, bottom left. Read row 1 from left to right; row 2 from right to left. Alternate on every row.',
        'columns': 'Columns are numbered 1-11 from the left. Row numbers increase from bottom to top. Arrows show the reading direction.',
        'all': 'Every square is one bead, including the ivory background. The complete rectangle has no empty cells.',
        'palette': 'These are custom colors, without manufacturer codes. Screen and printed colors are approximate; choose your own matching beads.',
        'ratio': 'Square chart cells have a width/height ratio of 1. This is a reading chart, not actual size or finished weaving dimensions.',
        'instructions': 'Row-by-row instructions',
        'runs': 'Read each instruction\'s color symbols and counts from left to right in the order shown. Arrows indicate movement across the chart only. Example: 3A 2B = 3 beads of A, then 2 beads of B. Each row totals 11 beads.',
        'order': 'Begin with row 1. Finish rows 1-31 in the left column, then rows 32-61 in the right column.',
        'footer': 'Original chart / Custom colors / Reading chart, not actual size',
        'source': 'Editable project and downloads',
        'maker': 'Edit the chart',
    },
    'de': {
        'chart': 'Vorlage und Material', 'materials': 'Farblegende und Perlenmengen',
        'stats': '{columns} Spalten x {rows} Reihen / {beads} Perlen / {colors} Farben',
        'count': '{count} Perlen', 'total': 'Gesamt: {count} Perlen',
        'reading': 'So liest du die Vorlage',
        'start': 'Beginne mit Reihe 1 unten links. Lies Reihe 1 von links nach rechts und Reihe 2 von rechts nach links. Wechsle die Richtung in jeder Reihe.',
        'columns': 'Die Spalten sind von links mit 1-11 nummeriert. Die Reihennummern steigen von unten nach oben. Pfeile zeigen die Leserichtung.',
        'all': 'Jedes Quadrat ist eine Perle, auch der elfenbeinfarbene Hintergrund. Das vollständige Rechteck hat keine leeren Felder.',
        'palette': 'Dies sind eigene Farben ohne Herstellercodes. Bildschirm- und Druckfarben sind Näherungswerte. Wähle selbst passende Perlen.',
        'ratio': 'Die quadratischen Felder haben ein Verhältnis von Breite zu Höhe von 1. Diese Vorlage dient zum Ablesen und zeigt keine Originalgröße oder fertigen Webmaße.',
        'instructions': 'Reihenanleitung',
        'runs': 'Lies die Farbsymbole und Mengen jeder Anweisung von links nach rechts in der angezeigten Reihenfolge. Die Pfeile zeigen nur die Richtung in der Vorlage. Beispiel: 3A 2B = 3 Perlen A, dann 2 Perlen B. Jede Reihe hat 11 Perlen.',
        'order': 'Beginne mit Reihe 1. Lies zuerst Reihen 1-31 in der linken Spalte, dann Reihen 32-61 in der rechten Spalte.',
        'footer': 'Originalvorlage / Eigene Farben / Vorlage zum Ablesen, nicht in Originalgröße',
        'source': 'Bearbeitbares Projekt und Downloads',
        'maker': 'Vorlage bearbeiten',
    },
    'fr': {
        'chart': 'Grille et matériel', 'materials': 'Légende et quantités de perles',
        'stats': '{columns} colonnes x {rows} rangs / {beads} perles / {colors} couleurs',
        'count': '{count} perles', 'total': 'Total : {count} perles',
        'reading': 'Comment lire la grille',
        'start': 'Commencez au rang 1, en bas à gauche. Lisez le rang 1 de gauche à droite, puis le rang 2 de droite à gauche. Alternez à chaque rang.',
        'columns': 'Les colonnes sont numérotées de 1 à 11 depuis la gauche. Les numéros des rangs augmentent du bas vers le haut. Les flèches indiquent le sens de lecture.',
        'all': 'Chaque case représente une perle, y compris le fond ivoire. Le rectangle complet ne contient aucune case vide.',
        'palette': 'Ces couleurs sont personnalisées, sans codes de fabricant. Les couleurs à l’écran et à l’impression sont approximatives. Choisissez des perles correspondantes.',
        'ratio': 'Les cases carrées ont un rapport largeur/hauteur de 1. Cette grille sert à lire le motif et ne représente ni la taille réelle ni les dimensions du tissage fini.',
        'instructions': 'Instructions par rang',
        'runs': 'Lisez les symboles et les quantités de chaque instruction de gauche à droite, dans l’ordre affiché. Les flèches indiquent uniquement le déplacement sur la grille. Exemple : 3A 2B = 3 perles A, puis 2 perles B. Chaque rang a 11 perles.',
        'order': 'Commencez au rang 1. Lisez les rangs 1-31 dans la colonne de gauche, puis les rangs 32-61 dans celle de droite.',
        'footer': 'Grille originale / Couleurs personnalisées / Grille à lire, sans taille réelle',
        'source': 'Projet modifiable et téléchargements',
        'maker': 'Modifier la grille',
    },
    'ja': {
        'chart': '図案と必要数', 'materials': '色の凡例とビーズの必要数',
        'stats': '{columns}列 x {rows}段 / ビーズ{beads}個 / {colors}色',
        'count': '{count}個', 'total': '合計：ビーズ{count}個',
        'reading': '図案の読み方',
        'start': '左下の1段目から始めます。1段目は左から右へ、2段目は右から左へ読みます。段ごとに方向を交互に変えます。',
        'columns': '列番号は左から1-11です。段番号は下から上へ増えます。矢印は読む方向を示します。',
        'all': 'アイボリーの背景も含め、すべてのマスがビーズ1個です。長方形全体に空白のマスはありません。',
        'palette': '独自の配色で、メーカーの色番号はありません。画面と印刷の色は目安です。お好みの近い色のビーズを選んでください。',
        'ratio': '正方形のマスの幅と高さの比は1です。この図案は読み取り用です。実寸や織り上がりの寸法ではありません。',
        'instructions': '段ごとの手順',
        'runs': '各段の色記号と個数は、表示された順番で左から右へ読みます。矢印は図案の中で進む方向だけを示します。例：3A 2B = Aを3個、続いてBを2個。各段の合計は11個です。',
        'order': '1段目から始めます。左の列の1-31段を終えたら、右の列の32-61段へ進みます。',
        'footer': 'オリジナル図案 / 独自の配色 / 読み取り用・実寸ではありません',
        'source': '編集用プロジェクトとダウンロード',
        'maker': '図案を編集',
    },
}


def load_patterns():
    data = LIBRARY_DATA
    assert data['format'] == 'bead-loom-pattern-library' and data['version'] == 1
    assert set(GALLERY_PATHS) == set(MAKER_PATHS) == set(LOCALES)
    assert all(path.startswith('/') and not path.startswith('//') for path in [*GALLERY_PATHS.values(), *MAKER_PATHS.values()])
    patterns = data['patterns']
    assert [p['id'] for p in patterns] == ['heart-band', 'chevron-band', 'diamond-band']
    for p in patterns:
        assert (p['columns'], p['rows'], p['cellAspect'], p['startCorner'], p['serpentine']) == (11, 61, 1, 'bottom-left', True)
        assert set(p['titles']) == set(p['descriptions']) == set(LOCALES)
        assert len(p['symbolRows']) == 61 and all(len(row) == 11 for row in p['symbolRows'])
        colors = {c['symbol']: c for c in p['palette']}
        assert len(colors) == len(p['palette']) and 3 <= len(colors) <= 4
        assert p['backgroundSymbol'] in colors
        assert all(set(c['labels']) == set(LOCALES) for c in colors.values())
        assert all(len(c['hex']) == 7 and c['hex'].startswith('#') for c in colors.values())
        assert set(''.join(p['symbolRows'])) == set(colors)
        p['_counts'] = Counter(''.join(p['symbolRows']))
        p['_colors'] = colors
        assert sum(p['_counts'].values()) == 671
    assert len({''.join(p['symbolRows']) for p in patterns}) == 3
    return patterns


def required_characters(patterns):
    text = ''.join(chr(i) for i in range(32, 127)) + '×→←'
    text += json.dumps(COPY, ensure_ascii=False)
    for p in patterns:
        text += json.dumps(p['titles'], ensure_ascii=False) + json.dumps(p['descriptions'], ensure_ascii=False)
        text += ''.join(json.dumps(c['labels'], ensure_ascii=False) for c in p['palette'])
    return ''.join(sorted(set(text)))


def refresh_font(patterns):
    from fontTools import subset
    from fontTools.ttLib import TTFont as ToolsFont
    from fontTools.varLib.instancer import instantiateVariableFont
    import fontTools
    original = urllib.request.urlopen(UPSTREAM['fontUrl'], timeout=60).read()
    license_bytes = urllib.request.urlopen(UPSTREAM['licenseUrl'], timeout=60).read()
    assert sha256(original).hexdigest() == UPSTREAM['fontSha256']
    assert sha256(license_bytes).hexdigest() == UPSTREAM['licenseSha256']
    face = ToolsFont(io.BytesIO(original), recalcTimestamp=False)
    instantiateVariableFont(face, {'wght': 400}, inplace=True)
    characters = required_characters(patterns)
    assert all(ord(c) in face.getBestCmap() for c in characters)
    options = subset.Options()
    options.name_IDs = ['*']; options.name_legacy = True; options.name_languages = ['*']; options.recalc_timestamp = False
    tool = subset.Subsetter(options=options); tool.populate(text=characters); tool.subset(face)
    family = 'Fuse Bead Loom Patterns'
    names = {1: family, 2: 'Regular', 3: 'FuseBeadLoomPatterns-Regular-1', 4: family + ' Regular',
             6: 'FuseBeadLoomPatterns-Regular', 16: family, 17: 'Regular'}
    for item in face['name'].names:
        if item.nameID in names: item.string = names[item.nameID].encode(item.getEncoding())
    FONT_DIR.mkdir(parents=True, exist_ok=True); face.save(FONT_PATH)
    (FONT_DIR / 'OFL.txt').write_bytes(license_bytes)
    info = {**UPSTREAM, 'derivativeFamily': family,
            'subsetPurpose': 'Original loom pattern library: complete fixed EN/DE/FR/JA copy, titles and color labels; ASCII counts and symbols',
            'subsetSha256': sha256(FONT_PATH.read_bytes()).hexdigest(),
            'charactersSha256': sha256(characters.encode()).hexdigest(),
            'characterCount': len(characters), 'fonttoolsVersion': fontTools.__version__}
    (FONT_DIR / 'source.json').write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n')


def register_font(patterns):
    info = json.loads((FONT_DIR / 'source.json').read_text())
    assert all(info[k] == v for k, v in UPSTREAM.items())
    assert sha256(FONT_PATH.read_bytes()).hexdigest() == info['subsetSha256']
    assert sha256((FONT_DIR / 'OFL.txt').read_bytes()).hexdigest() == UPSTREAM['licenseSha256']
    characters = required_characters(patterns)
    assert sha256(characters.encode()).hexdigest() == info['charactersSha256'], 'The copy changed; refresh and reaccept the font.'
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))
    face = pdfmetrics.getFont(FONT_NAME).face
    missing = [c for c in characters if ord(c) not in face.charToGlyph]
    assert not missing, f'Missing glyphs: {missing}'
    return info


def instruction_rows(p):
    instructions = []
    for index, source in enumerate(reversed(p['symbolRows'])):
        symbols = source if index % 2 == 0 else source[::-1]
        runs = []
        for symbol in symbols:
            if runs and runs[-1][1] == symbol: runs[-1][0] += 1
            else: runs.append([1, symbol])
        instructions.append({'row': index + 1, 'arrow': '>' if index % 2 == 0 else '<',
                             'runs': ' '.join(str(count) + symbol for count, symbol in runs)})
    return instructions


def project(p, locale):
    colors = p['_colors']
    return {'format': 'bead-loom-project', 'version': 1, 'chart': {
        'title': p['titles'][locale], 'columns': p['columns'], 'rows': p['rows'], 'cellAspect': p['cellAspect'],
        'palette': [{'id': c['id'], 'symbol': c['symbol'], 'name': c['labels'][locale], 'code': '', 'hex': c['hex']} for c in p['palette']],
        'backgroundId': colors[p['backgroundSymbol']]['id'],
        'cells': [colors[symbol]['id'] for row in p['symbolRows'] for symbol in row],
        'startCorner': p['startCorner'], 'serpentine': p['serpentine'],
    }}


def build_svg(p):
    ns = 'http://www.w3.org/2000/svg'; ET.register_namespace('', ns)
    svg = ET.Element(f'{{{ns}}}svg', {'viewBox': '0 0 768 180', 'width': '768', 'height': '180'})
    ET.SubElement(svg, f'{{{ns}}}rect', {'width': '768', 'height': '180', 'fill': '#F8F8F4'})
    for y, row in enumerate(p['symbolRows']):
        for x, symbol in enumerate(row):
            ET.SubElement(svg, f'{{{ns}}}rect', {'x': str(18 + y * 12), 'y': str(24 + (10 - x) * 12),
                          'width': '12', 'height': '12', 'fill': p['_colors'][symbol]['hex'], 'data-symbol': symbol})
    # The preview is a 90-degree color overview. The downloadable chart remains vertical.
    for i in range(62):
        ET.SubElement(svg, f'{{{ns}}}path', {'d': f'M{18+i*12} 24V156', 'stroke': '#65746B', 'stroke-width': '.3', 'fill': 'none'})
    for i in range(12):
        ET.SubElement(svg, f'{{{ns}}}path', {'d': f'M18 {24+i*12}H750', 'stroke': '#65746B', 'stroke-width': '.3', 'fill': 'none'})
    (DEST / p['id'] / 'preview.svg').write_bytes(ET.tostring(svg, encoding='utf-8', xml_declaration=True) + b'\n')


def rgb(hex_value):
    return tuple(int(hex_value[i:i+2], 16) for i in (1, 3, 5))


def symbol_ink(hex_value):
    # WCAG relative luminance gives a stable black/white choice for all custom colors.
    channels = [v/255 for v in rgb(hex_value)]
    linear = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in channels]
    lightness = sum(v*w for v, w in zip(linear, (.2126, .7152, .0722)))
    return '#17231E' if (lightness + .05)/.05 >= 4.5 else '#FFFFFF'


def raster_arrow(draw, x, y, right, color=INK):
    end = x + 20 if right else x
    draw.line((x, y, x+20, y), fill=color, width=2)
    draw.line((end, y, end + (-5 if right else 5), y-5), fill=color, width=2)
    draw.line((end, y, end + (-5 if right else 5), y+5), fill=color, width=2)


def build_png(p):
    image = Image.new('RGB', (490, 2140), '#FFFFFF'); draw = ImageDraw.Draw(image)
    normal = ImageFont.truetype(str(FONT_PATH), 20); symbols = ImageFont.truetype(str(FONT_PATH), 20)
    draw.text((245, 28), '11 × 61 = 671', font=ImageFont.truetype(str(FONT_PATH), 28), fill=INK, anchor='mt')
    left, top, cell = 60, 100, 30
    for x in range(11): draw.text((left+(x+.5)*cell, top-12), str(x+1), font=normal, fill=INK, anchor='mb')
    for y, row in enumerate(p['symbolRows']):
        row_number = 61-y
        draw.text((left-10, top+(y+.5)*cell), str(row_number), font=normal, fill=INK, anchor='rm')
        raster_arrow(draw, left+11*cell+12, top+(y+.5)*cell, row_number % 2 == 1)
        for x, symbol in enumerate(row):
            color = p['_colors'][symbol]['hex']
            draw.rectangle((left+x*cell, top+y*cell, left+(x+1)*cell, top+(y+1)*cell), fill=color)
            draw.text((left+(x+.5)*cell, top+(y+.5)*cell), symbol, font=symbols, fill=symbol_ink(color), anchor='mm')
    for x in range(12): draw.line((left+x*cell, top, left+x*cell, top+61*cell), fill=RULE, width=1)
    for y in range(62): draw.line((left, top+y*cell, left+11*cell, top+y*cell), fill=RULE, width=1)
    for index, color in enumerate(p['palette']):
        y = 1970+index*35
        draw.rectangle((60, y, 82, y+22), fill=color['hex'], outline=RULE)
        draw.text((96, y-3), f"{color['symbol']}  {color['hex']}  {p['_counts'][color['symbol']]}", font=normal, fill=INK)
    image.save(DEST / p['id'] / 'chart.png', optimize=True)


def wrap_text(value, width, size):
    lines, current = [], ''
    forbidden_start = set('、。，．？！：；)]}〉》」』】〕')
    forbidden_end = set('([{〈《「『【〔')
    for c in value:
        if current and pdfmetrics.stringWidth(current+c, FONT_NAME, size) > width:
            if c in forbidden_start or current[-1] in forbidden_end:
                # Keep one preceding character with a closing mark. This avoids a
                # punctuation-only line without exceeding the available width.
                split = len(current)-1
                while split > 1 and (current[split] in forbidden_start or current[split-1] in forbidden_end): split -= 1
                lines.append(current[:split]); current = current[split:]+c
            elif ' ' in current:
                before, after = current.rsplit(' ', 1); lines.append(before); current = after+c
            else: lines.append(current); current = c
        else: current += c
    if current: lines.append(current)
    assert all(not line or line[0] not in forbidden_start for line in lines), lines
    assert all(not line or line[-1] not in forbidden_end for line in lines), lines
    return lines


def build_pdf(p, locale, paper):
    width, height = PAPERS[paper]; copy = COPY[locale]
    path = DEST / p['id'] / locale / f'pattern-{paper}.pdf'
    pdf = canvas.Canvas(str(path), pagesize=(width, height), invariant=1, pageCompression=1, lang=LANGS[locale])
    pdf.setTitle(p['titles'][locale] + ' / 11 x 61')
    pdf.setAuthor('Fuse Bead Patterns')
    pdf.setSubject(f"Original bead loom reading chart; {locale}; 671 beads; {paper}; source SHA-256 {sha256(SOURCE.read_bytes()).hexdigest()}")
    pdf.setViewerPreference('PrintScaling', 'None')

    def text(x, top, value, size=9.5, color=INK, align='left', max_width=None):
        assert all(ord(c) in pdfmetrics.getFont(FONT_NAME).face.charToGlyph for c in value), value
        if max_width is not None: assert pdfmetrics.stringWidth(value, FONT_NAME, size) <= max_width+.01, value
        pdf.setFont(FONT_NAME, size); pdf.setFillColor(HexColor(color))
        fn = {'left': pdf.drawString, 'center': pdf.drawCentredString, 'right': pdf.drawRightString}[align]
        fn(x, height-top, value)

    def rule(x1, y1, x2, y2, weight=.5, color=RULE):
        pdf.setStrokeColor(HexColor(color)); pdf.setLineWidth(weight); pdf.line(x1, height-y1, x2, height-y2)

    def paragraph(value, x, top, available, size=9.5, leading=14, color=MUTED):
        for line in wrap_text(value, available, size):
            text(x, top, line, size, color, max_width=available); top += leading
        return top

    def arrow(x, y, right):
        end = x+12 if right else x
        rule(x, y, x+12, y, .65, INK)
        rule(end, y, end+(-3 if right else 3), y-2.4, .65, INK)
        rule(end, y, end+(-3 if right else 3), y+2.4, .65, INK)

    def header(section):
        text(36, 27, 'FUSE BEAD PATTERNS', 8, MUTED)
        text(36, 51, p['titles'][locale], 17, max_width=width-72)
        text(36, 69, copy['stats'].format(columns=11, rows=61, beads=671, colors=len(p['palette'])), 9.5)
        text(36, 90, section, 11)
        rule(36, 98, width-36, 98)

    def footer(page):
        text(36, height-36, copy['footer'], 7.2, MUTED, max_width=width-100)
        text(width-36, height-36, f'{page} / 2', 8, MUTED, align='right')
        text(36, height-23, copy['source'], 7.2, '#1B6C56')
        url = SITE + GALLERY_PATHS[locale]
        label_width = pdfmetrics.stringWidth(copy['source'], FONT_NAME, 7.2)
        pdf.linkURL(url, (36, 18, 36+label_width, 32), relative=0)
        maker_x = 36+label_width+24
        text(maker_x, height-23, copy['maker'], 7.2, '#1B6C56')
        maker_width = pdfmetrics.stringWidth(copy['maker'], FONT_NAME, 7.2)
        assert maker_x+maker_width < width-36
        pdf.linkURL(f"{SITE}{MAKER_PATHS[locale]}?pattern={p['id']}", (maker_x, 18, maker_x+maker_width, 32), relative=0)
        pdf.showPage()

    header(copy['chart'])
    for x in range(11): text(GRID_LEFT+(x+.5)*CELL, GRID_TOP-5, str(x+1), 7.5, align='center')
    for y, row in enumerate(p['symbolRows']):
        row_number = 61-y
        text(GRID_LEFT-7, GRID_TOP+(y+.5)*CELL+2.5, str(row_number), 7.5, align='right')
        arrow(GRID_LEFT+11*CELL+9, GRID_TOP+(y+.5)*CELL, row_number % 2 == 1)
        for x, symbol in enumerate(row):
            color = p['_colors'][symbol]['hex']
            pdf.setFillColor(HexColor(color))
            pdf.rect(GRID_LEFT+x*CELL, height-GRID_TOP-(y+1)*CELL, CELL, CELL, stroke=0, fill=1)
            text(GRID_LEFT+(x+.5)*CELL, GRID_TOP+(y+.5)*CELL+2.1, symbol, 6.4, symbol_ink(color), 'center')
    for x in range(12): rule(GRID_LEFT+x*CELL, GRID_TOP, GRID_LEFT+x*CELL, GRID_TOP+61*CELL, .3)
    for y in range(62): rule(GRID_LEFT, GRID_TOP+y*CELL, GRID_LEFT+11*CELL, GRID_TOP+y*CELL, .55 if y % 5 == 1 else .3)
    sidebar, available = 210, width-246
    text(sidebar, 119, copy['materials'], 11, max_width=available)
    for index, color in enumerate(p['palette']):
        y = 146+index*36
        pdf.setFillColor(HexColor(color['hex'])); pdf.setStrokeColor(HexColor(RULE))
        pdf.rect(sidebar, height-y-4, 14, 14, stroke=1, fill=1)
        text(sidebar+7, y, color['symbol'], 8, symbol_ink(color['hex']), 'center')
        text(sidebar+24, y-3, color['labels'][locale], 10, max_width=available-24)
        text(sidebar+24, y+11, f"{color['hex']} / {copy['count'].format(count=p['_counts'][color['symbol']])}", 8.5, MUTED, max_width=available-24)
    y = 156+len(p['palette'])*36
    text(sidebar, y, copy['total'].format(count=671), 10.5)
    rule(sidebar, y+10, width-36, y+10)
    y += 34
    text(sidebar, y, copy['reading'], 11); y += 20
    for key in ('start', 'columns', 'all', 'palette', 'ratio'):
        y = paragraph(copy[key], sidebar, y, available, 9.5, 14)+12
    assert y < height-57, (locale, paper, 'sidebar too tall', y)
    footer(1)
    header(copy['instructions'])
    y = paragraph(copy['runs'], 36, 116, width-72, 9.5, 14)
    y = paragraph(copy['order'], 36, y+5, width-72, 9, 13)+16
    instructions = instruction_rows(p)
    column_width = (width-88)/2
    for index, item in enumerate(instructions):
        col = 0 if index < 31 else 1
        local_index = index if index < 31 else index-31
        x = 36+col*(column_width+16); top = y+local_index*17
        text(x, top, f"{item['row']:02d}", 9.5)
        arrow(x+22, top-3, item['arrow'] == '>')
        text(x+44, top, item['runs'], 9.5, max_width=column_width-44)
        if local_index % 5 == 4: rule(x, top+6, x+column_width, top+6, .3)
    assert y+30*17 < height-59, (locale, paper, 'instruction page too tall')
    footer(2); pdf.save()
    return path


def close(a, b):
    return abs(float(a)-float(b)) < .015


def check_pdf(p, locale, paper):
    path = DEST / p['id'] / locale / f'pattern-{paper}.pdf'
    reader = PdfReader(path); width, height = PAPERS[paper]
    assert len(reader.pages) == 2
    assert reader.trailer['/Root']['/Lang'] == LANGS[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    url = SITE + GALLERY_PATHS[locale]
    for page in reader.pages:
        links = [a.get_object()['/A']['/URI'] for a in page.get('/Annots', []) if a.get_object().get('/A', {}).get('/S') == '/URI']
        assert links == [url, f"{SITE}{MAKER_PATHS[locale]}?pattern={p['id']}"], (path, 'native gallery and loaded-pattern maker links', links)
    assert p['titles'][locale] in reader.metadata.title and '11 x 61' in reader.metadata.title
    assert sha256(SOURCE.read_bytes()).hexdigest() in reader.metadata.subject
    embedded = []
    for page in reader.pages:
        for font in page['/Resources']['/Font'].get_object().values():
            obj = font.get_object()
            if '/FontDescriptor' in obj:
                descriptor = obj['/FontDescriptor'].get_object()
                assert '/FontFile2' in descriptor and '/ToUnicode' in obj
                embedded.append(str(obj['/BaseFont']))
    assert embedded and all('FuseBeadLoomPatterns' in name for name in embedded)
    with pdfplumber.open(path) as doc:
        for page in doc.pages:
            assert close(page.width, width) and close(page.height, height)
            assert all(c['x0'] >= 35.5 and c['x1'] <= width-35.5 and c['top'] >= 15 and c['bottom'] <= height-15 for c in page.chars), (path, 'text margin')
            if locale == 'ja':
                for line in page.extract_text().splitlines():
                    assert line[0] not in '、。，．？！：；)]}〉》」』】〕', (path, 'Japanese line-start punctuation', line)
                    assert line[-1] not in '([{〈《「『【〔', (path, 'Japanese line-end bracket', line)
        page = doc.pages[0]
        cells, symbols = {}, {}
        for rect in page.rects:
            if close(rect['width'], CELL) and close(rect['height'], CELL):
                x = round((rect['x0']-GRID_LEFT)/CELL); y = round((rect['top']-GRID_TOP)/CELL)
                assert 0 <= x < 11 and 0 <= y < 61 and (x,y) not in cells
                assert close(rect['x0'], GRID_LEFT+x*CELL) and close(rect['top'], GRID_TOP+y*CELL)
                cells[(x,y)] = tuple(round(v*255) for v in rect['non_stroking_color'])
        assert len(cells) == 671
        for char in page.chars:
            x = (char['x0']+char['x1'])/2; y = (char['top']+char['bottom'])/2
            if GRID_LEFT < x < GRID_LEFT+11*CELL and GRID_TOP < y < GRID_TOP+61*CELL:
                point = (int((x-GRID_LEFT)//CELL), int((y-GRID_TOP)//CELL))
                assert point not in symbols
                symbols[point] = char['text']
        assert len(symbols) == 671
        expected = {(x,y):symbol for y,row in enumerate(p['symbolRows']) for x,symbol in enumerate(row)}
        assert symbols == expected
        assert cells == {point: rgb(p['_colors'][symbol]['hex']) for point,symbol in expected.items()}
        for y in range(61):
            block = page.crop((35, GRID_TOP+y*CELL, GRID_LEFT-4, GRID_TOP+(y+1)*CELL)).extract_text()
            assert block == str(61-y), (path, y, block)
            x = GRID_LEFT+11*CELL+9; center = GRID_TOP+(y+.5)*CELL
            end = x+12 if (61-y) % 2 else x
            tail = end-3 if (61-y) % 2 else end+3
            assert any(close(line['x0'],min(end,tail)) and close(line['x1'],max(end,tail)) and close(line['top'],center-2.4) and close(line['bottom'],center) for line in page.lines)
        for x in range(11):
            block = page.crop((GRID_LEFT+x*CELL, GRID_TOP-15, GRID_LEFT+(x+1)*CELL, GRID_TOP)).extract_text()
            assert block == str(x+1), (path, x, block)
        for index, color in enumerate(p['palette']):
            y = 146+index*36
            block = page.crop((209, y-17, width-35, y+16)).extract_text()
            for text in (color['symbol'], color['labels'][locale], color['hex'], str(p['_counts'][color['symbol']])):
                assert text in block, (path, 'material', text, block)
        text = '\n'.join(page.extract_text() for page in doc.pages)
        for value in (p['titles'][locale], COPY[locale]['materials'], COPY[locale]['instructions'], COPY[locale]['total'].format(count=671)):
            assert value in text, (path, 'extractable text', value)
        # Locate each instruction by its physical column/baseline, independently expand it,
        # and reconstruct the screen grid. Arrows are vector paths; check their orientation.
        page = doc.pages[1]
        column_width = (width-88)/2
        intro_lines = wrap_text(COPY[locale]['runs'], width-72, 9.5)
        actual_intro = page.crop((35, 106, width-35, 116+14*(len(intro_lines)-1)+3)).extract_text().splitlines()
        assert actual_intro == intro_lines, (path, 'instruction reading-order explanation', actual_intro)
        intro_y = 116+14*len(intro_lines)
        instruction_top = intro_y+5+13*len(wrap_text(COPY[locale]['order'], width-72, 9))+16
        reconstructed = [None]*61
        for number in range(1,62):
            col, index = (0,number-1) if number <= 31 else (1,number-32)
            x = 36+col*(column_width+16); top = instruction_top+index*17
            number_text = page.crop((x-1,top-10,x+15,top+2)).extract_text()
            assert number_text == f'{number:02d}'
            runs_text = page.crop((x+43,top-10,x+column_width+1,top+2)).extract_text()
            tokens = runs_text.split(); expanded = ''
            for token in tokens:
                assert token[-1] in p['_colors'] and token[:-1].isdigit()
                count = int(token[:-1]); assert count > 0
                expanded += token[-1]*count
            assert len(expanded) == 11
            reconstructed[61-number] = expanded if number % 2 else expanded[::-1]
            end = x+34 if number % 2 else x+22
            tail = end-3 if number % 2 else end+3
            assert any(close(line['x0'], min(end,tail)) and close(line['x1'], max(end,tail)) and close(line['top'],top-5.4) and close(line['bottom'],top-3) for line in page.lines)
        assert reconstructed == p['symbolRows']
    return {'locale': locale, 'paper': paper, 'pages': 2, 'sha256': sha256(path.read_bytes()).hexdigest()}


def check_other_assets(p):
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    svg = ET.parse(DEST / p['id'] / 'preview.svg').getroot()
    assert svg.attrib['viewBox'] == '0 0 768 180'
    rects = [r for r in svg.findall('svg:rect',ns) if 'data-symbol' in r.attrib]
    assert len(rects) == 671
    for rect in rects:
        x = 10-(int(rect.attrib['y'])-24)//12; y = (int(rect.attrib['x'])-18)//12
        symbol = p['symbolRows'][y][x]
        assert rect.attrib['data-symbol'] == symbol and rect.attrib['fill'] == p['_colors'][symbol]['hex']
    with Image.open(DEST / p['id'] / 'chart.png') as image:
        assert image.size == (490,2140)
        for y,row in enumerate(p['symbolRows']):
            for x,symbol in enumerate(row):
                assert image.getpixel((60+x*30+4,100+y*30+4)) == rgb(p['_colors'][symbol]['hex'])
    for locale in LOCALES:
        path = DEST / p['id'] / locale / 'pattern.bead-loom.json'
        assert json.loads(path.read_text()) == project(p,locale)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh-font', action='store_true')
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--qa-report', type=Path)
    args = parser.parse_args(); patterns = load_patterns()
    if args.refresh_font: refresh_font(patterns)
    info = register_font(patterns); reports = []
    for p in patterns:
        if not args.check_only:
            (DEST / p['id']).mkdir(parents=True, exist_ok=True)
            build_svg(p); build_png(p)
            for locale in LOCALES:
                folder = DEST / p['id'] / locale; folder.mkdir(parents=True, exist_ok=True)
                (folder / 'pattern.bead-loom.json').write_text(json.dumps(project(p,locale),ensure_ascii=False,separators=(',',':'))+'\n')
                for paper in PAPERS: build_pdf(p,locale,paper)
        check_other_assets(p)
        reports.append({'id': p['id'], 'columns':11,'rows':61,'beads':671,'counts':dict(p['_counts']),
                        'previewSha256':sha256((DEST/p['id']/'preview.svg').read_bytes()).hexdigest(),
                        'pngSha256':sha256((DEST/p['id']/'chart.png').read_bytes()).hexdigest(),
                        'projectSha256':{locale:sha256((DEST/p['id']/locale/'pattern.bead-loom.json').read_bytes()).hexdigest() for locale in LOCALES},
                        'pdfs':[check_pdf(p,locale,paper) for locale in LOCALES for paper in PAPERS]})
    report = {'status':'data-checks-passed','sourceSha256':sha256(SOURCE.read_bytes()).hexdigest(),
              'pdfs':24,'pages':48,'projects':12,'pngs':3,'previews':3,'patterns':reports,
              'font':{'family':info['derivativeFamily'],'characters':info['characterCount'],'sha256':info['subsetSha256']},
              'checks':['complete geometry','all bead fill colors and 671 symbols','row and column numbers','locale text extraction',
                        'embedded font and all required glyphs','materials','independently reconstructed row instructions','PNG pixels','SVG cells','project equality','localized gallery links'],
              'visualReview':'Required separately; data checks are complete.','physicalWeavingVerified':False}
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True, exist_ok=True)
        args.qa_report.write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps({'status':report['status'],'pdfs':24,'pages':48,'projects':12,'pngs':3,'previews':3,'checkOnly':args.check_only}))


if __name__ == '__main__': main()

"""Build eight native-language Creeper face fan-art charts from a reviewed pack.

This is an unofficial, hand-authored character adaptation, not an original
character or licensed Minecraft asset. Outputs are exclusive and never replace
old charts/fonts. --font-characters, --check-template and --check-only do not
author PDFs. Run the PDF skill's authoring marker before the creation command.
"""
import argparse
import base64
from collections import Counter
import csv
from hashlib import sha256
import json
from pathlib import Path
import re

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
FONT_DIR = ROOT / 'scripts/fonts/creeper-fan-art-jp'
FONT_NAME = 'FuseBeadCreeperFanArtJapanese'
FONT_PATH = FONT_DIR / (FONT_NAME + '-Regular.ttf')
ID = 'minecraft-creeper-face-v1'
VERSION = 'Hand-drawn Creeper face fan art v1'
# Frozen by the root agent's separate review of the hand-authored candidate.
ROWS_HASH = 'df712354b06a195c55cca570cddffec6f5d884a75af5baa762594697ac5b3d53'
COUNTS = {'G': 136, 'K': 80, 'H': 40}
BOUNDS = {'x': 6, 'y': 6, 'width': 16, 'height': 16}
PALETTE = {
    'G': {'symbol': 'G', 'ref': '80-19080', 'name': 'Green', 'rgb': [77, 171, 100], 'hex': '#4dab64', 'count': 136},
    'K': {'symbol': 'K', 'ref': '80-19018', 'name': 'Black', 'rgb': [50, 50, 52], 'hex': '#323234', 'count': 80},
    'H': {'symbol': 'H', 'ref': '80-19061', 'name': 'Kiwi Lime', 'rgb': [105, 184, 69], 'hex': '#69b845', 'count': 40},
}
SITE = 'https://fusebeadpatterns.art'
INK, MUTED = '#25342e', '#59655f'
GRID_TOP, GRID_BOTTOM = 39, 184
COPY = {
    'en': {
        'name': 'Creeper Face', 'type': 'Perler Bead Pattern',
        'grid': '16 x 16 face / 29 x 29 grid / 1 Midi board / 256 beads / 3 colors',
        'materials': 'Perler Midi materials', 'header': 'Symbol / Perler ref / Color name: EN', 'count': 'Count',
        'blank': 'Empty cells need no beads. Every marked cell needs its listed color.',
        'color': 'Screen and print colors are approximate. Check color refs against your beads.',
        'physical': 'Hand-authored fan art. Not physically assembled or iron-tested.',
        'rights': 'Unofficial Minecraft fan art. Not approved by or associated with Mojang or Microsoft.',
        'owner': 'Minecraft and Creeper character rights belong to Mojang/Microsoft.',
        'print': '{paper}: print at 100% / Actual size. Turn off "Fit to page".',
        'scale': 'Both lines must measure 50 mm. Check the 5 mm pitch against your Midi board.',
        'publisher': 'Publisher: Fuse Bead Patterns team / contact@fusebeadpatterns.art',
        'detail': 'Pattern and editor',
    },
    'de': {
        'name': 'Creeper-Gesicht', 'type': 'Bügelperlen-Vorlage',
        'grid': 'Gesicht: 16 x 16 / Raster: 29 x 29 / 1 Midi-Platte / 256 Perlen / 3 Farben',
        'materials': 'Materialliste: Perler Midi', 'header': 'Symbol / Farbnummer / Produktfarbe: EN', 'count': 'Anzahl',
        'blank': 'Leere Felder bleiben frei. Markierte Felder brauchen die angegebene Perlenfarbe.',
        'color': 'Druck- und Bildschirmfarben sind Näherungen. Farbnummern an den eigenen Perlen prüfen.',
        'physical': 'Von Hand gezeichnete Fan-Art. Nicht gebaut oder bügelgetestet.',
        'rights': 'Inoffizielle Minecraft-Fan-Art. Nicht von Mojang oder Microsoft genehmigt oder unterstützt.',
        'owner': 'Die Rechte an Minecraft und der Figur Creeper gehören Mojang/Microsoft.',
        'print': '{paper}: 100% / Tatsächliche Größe. "An Seite anpassen" ausschalten.',
        'scale': 'Beide Messlinien: 50 mm. Das Raster mit 5 mm Abstand an der Midi-Platte prüfen.',
        'publisher': 'Herausgeber: Fuse Bead Patterns team / contact@fusebeadpatterns.art',
        'detail': 'Vorlage und Editor',
    },
    'fr': {
        'name': 'Visage du Creeper', 'type': 'Modèle de perles à repasser',
        'grid': 'Visage : 16 x 16 / grille : 29 x 29 / 1 plaque Midi / 256 perles / 3 couleurs',
        'materials': 'Matériel : Perler Midi', 'header': 'Symbole / référence / Couleur produit : EN', 'count': 'Quantité',
        'blank': 'Cases vides : sans perle. Chaque case marquée demande la couleur indiquée.',
        'color': 'Les couleurs sont approximatives. Vérifiez les références sur vos propres perles.',
        'physical': 'Fan art dessiné à la main. Assemblage et repassage avec des perles non testés.',
        'rights': 'Fan art Minecraft non officiel, ni approuvé par Mojang ou Microsoft, ni associé à eux.',
        'owner': 'Les droits sur Minecraft et le personnage Creeper appartiennent à Mojang/Microsoft.',
        'print': '{paper} : 100% / Taille réelle. Désactivez "Ajuster à la page".',
        'scale': 'Les deux repères : 50 mm. Vérifiez la grille de 5 mm sur votre plaque Midi.',
        'publisher': 'Éditeur : Fuse Bead Patterns team / contact@fusebeadpatterns.art',
        'detail': 'Modèle et éditeur',
    },
    'ja': {
        'name': 'クリーパーの顔', 'type': 'アイロンビーズ図案',
        'grid': '顔16 x 16マス / 図案29 x 29マス / ミディ用プレート1枚 / 256個 / 3色',
        'materials': 'Perler Midiの材料表', 'header': '記号 / 色番号 / 商品色名: EN', 'count': '個数',
        'blank': '空白には置きません。記号のあるマスに、対応する色のビーズを置きます。',
        'color': '画面と印刷の色は目安です。実物のビーズの色番号を確認してください。',
        'physical': '手描きのファンアートです。実物制作・アイロン仕上げは未検証です。',
        'rights': 'Minecraftの非公式ファンアート。Mojang・Microsoftの公認や提携はありません。',
        'owner': 'Minecraftとクリーパーのキャラクターの権利はMojang/Microsoftに帰属します。',
        'print': '{paper}・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'scale': '縦横の確認線は各50 mm。1マス5 mmの間隔を実物のミディ用プレートで確認。',
        'publisher': '発行: Fuse Bead Patterns team / contact@fusebeadpatterns.art',
        'detail': '図案とエディター',
    },
}
LANGUAGES = {'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}
PAPERS = {'a4': A4, 'letter': letter}


def digest(data):
    return sha256(data).hexdigest()


def detail_url(locale):
    return SITE + ('' if locale == 'en' else '/' + locale) + '/patterns/minecraft/creeper-face'


def output_path(pack, locale, paper):
    if locale == 'en':
        name = 'reference-pattern-library.pdf' if paper == 'a4' else 'reference-pattern-library-us-letter.pdf'
        return pack / name
    return pack / 'localized-pdfs' / locale / ('pattern.pdf' if paper == 'a4' else 'pattern-letter.pdf')


def load_pattern(pack):
    data = json.loads((pack / 'manifest.json').read_text(encoding='utf-8'))
    assert len(data['patterns']) == 1, 'One reviewed fan-art pattern only'
    pattern = data['patterns'][0]
    assert pattern['id'] == ID and pattern['kind'] == 'fan-art' and pattern['version'] == VERSION
    assert pattern['width'] == pattern['height'] == 29
    rows = pattern['rows']
    assert len(rows) == 29 and all(len(row) == 29 and re.fullmatch(r'[.GKH]{29}', row) for row in rows)
    assert digest(('\n'.join(rows)).encode()) == ROWS_HASH, 'Independently reviewed fan-art rows changed'
    assert Counter(''.join(rows).replace('.', '')) == COUNTS
    assert pattern['beads'] == 256 and pattern['colorCount'] == 3 and pattern['bounds'] == BOUNDS
    assert list(pattern['palette']) == ['G', 'K', 'H'] and pattern['palette'] == PALETTE
    source = pattern['source']
    assert source['type'] == 'character-reference' and source['character'] == 'Creeper'
    assert source['pageUrl'] == 'https://www.minecraft.net/en-us/article/meet-creeper'
    assert source['rightsHolder'] == 'Mojang/Microsoft' and source['unofficial'] is True
    assert source['creationMethod'] == 'hand-authored-bead-grid' and source['sourceTextureUsed'] is False
    assert source['redistributionPermission'] == 'unconfirmed', 'Do not infer a publication license from a character reference'
    with (ROOT / 'public/palettes/perler.csv').open(newline='') as source_csv:
        available = {row[0]: row for row in csv.reader(source_csv)}
    for symbol, entry in PALETTE.items():
        bead = available[entry['ref']]
        assert entry['symbol'] == symbol and entry['count'] == COUNTS[symbol]
        assert entry['name'] == bead[1] and entry['rgb'] == [int(channel) for channel in bead[3:6]]
        assert entry['hex'] == '#' + ''.join(f'{channel:02x}' for channel in entry['rgb'])
    occupied = {(x, y): PALETTE[symbol] for y, row in enumerate(rows) for x, symbol in enumerate(row) if symbol != '.'}
    assert set(occupied) == {(x, y) for x in range(6, 22) for y in range(6, 22)}, 'Solid face occupancy changed'
    validation = pattern['validation']
    assert validation['physicalAssemblyTested'] is validation['ironingTested'] is validation['hangingTested'] is False
    assert validation['officialPatternCopied'] is validation['officialTextureUsed'] is False
    assert validation['designRowsSha256'] == ROWS_HASH
    expected = bytes(channel for row in rows for symbol in row
                     for channel in (PALETTE[symbol]['rgb'] + [255] if symbol != '.' else [0, 0, 0, 0]))
    assert digest(expected) == validation['rgbaSha256']
    with Image.open(pack / 'pixels' / (ID + '.png')) as image:
        assert image.mode == 'RGBA' and image.size == (29, 29) and image.tobytes() == expected
    project = json.loads((pack / 'projects' / (ID + '.bead-pattern.json')).read_text(encoding='utf-8'))
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
    draft = project['draft']
    assert draft['version'] == 1 and draft['selectedPaletteIds'] == ['perler']
    assert draft['boardId'] == 'midi' and draft['boardWidth'] == draft['boardHeight'] == 1
    assert draft['sourceMode'] == 'blank' and draft['imageSrc'] is None and draft['fileName'] == ID
    assert draft['pdfScaleMode'] == 'midi-5mm'
    entries = [{'name': e['name'], 'ref': e['ref'], 'symbol': e['symbol'], 'prefix': 'P', 'enabled': True,
                'color': dict(zip(('r', 'g', 'b', 'a'), e['rgb'] + [255]))} for e in PALETTE.values()]
    assert draft['activePalettes'] == [{'name': 'Perler Midi', 'entries': entries}]
    edited = draft['editedPattern']
    assert edited['width'] == edited['height'] == 29 and edited['byteLength'] == 29 * 29 * 4
    assert base64.b64decode(edited['data'], validate=True) == expected
    assert base64.b64encode(expected).decode() == edited['data'], 'Non-canonical project pixel data'
    pattern['occupied'] = occupied
    return pattern


def title(locale):
    return COPY[locale]['name'] + ' ' + COPY[locale]['type']


def text_entries(locale, paper):
    copy = COPY[locale]
    width, height = PAPERS[paper]
    width_mm, height_mm = width / mm, height / mm
    values = [
        {'x': 18, 'y': 12, 'value': 'FUSE BEAD PATTERNS', 'size': 8, 'color': MUTED},
        {'x': 18, 'y': 24, 'value': copy['name'], 'size': 17, 'maxMm': 88},
        {'x': width_mm - 18, 'y': 24, 'value': copy['type'], 'size': 8, 'right': True, 'maxMm': 80},
        {'x': 18, 'y': 33, 'value': copy['grid'], 'size': 8.1},
        {'x': 18, 'y': 191, 'value': copy['materials'], 'size': 10},
        {'x': 18, 'y': 197, 'value': copy['header'], 'size': 7.2},
        {'x': 180, 'y': 197, 'value': copy['count'], 'size': 7.2, 'right': True},
    ]
    for index, (symbol, entry) in enumerate(PALETTE.items()):
        y = 204 + index * 7
        values.extend((
            {'x': 24, 'y': y, 'value': symbol, 'size': 8, 'maxMm': 6},
            {'x': 36, 'y': y, 'value': entry['ref'], 'size': 8, 'maxMm': 35},
            {'x': 80, 'y': y, 'value': entry['name'], 'size': 8, 'maxMm': 75},
            {'x': 180, 'y': y, 'value': str(entry['count']), 'size': 8, 'right': True, 'maxMm': 18},
        ))
    for key, y in [('blank', 225), ('color', 230), ('physical', 235), ('rights', 240), ('owner', 245), ('print', 250), ('scale', 262), ('publisher', 267)]:
        value = copy[key].format(paper='A4' if paper == 'a4' else 'US Letter')
        values.append({'x': 18, 'y': y, 'value': value, 'size': 7 if key != 'publisher' else 6.7,
                       'maxMm': width_mm - 36, 'color': MUTED if key in ('color', 'physical') else INK})
    values.extend((
        {'x': 73, 'y': 257.8, 'value': '50 mm', 'size': 8, 'maxMm': 20},
        {'x': 194, 'y': 191, 'value': '50 mm', 'size': 7, 'right': True, 'maxMm': 17},
        {'x': 18, 'y': height_mm - 7, 'value': copy['detail'], 'size': 6.7, 'maxMm': 55},
        {'x': width_mm - 18, 'y': height_mm - 7, 'value': detail_url(locale).removeprefix('https://'), 'size': 6.7, 'right': True, 'maxMm': 115},
    ))
    return values


def all_characters():
    values = [str(i) for i in range(30)]
    for locale in COPY:
        for paper in PAPERS:
            values.extend(entry['value'] for entry in text_entries(locale, paper))
    return ''.join(sorted(set(''.join(values))))


def register_font():
    lock = json.loads((FONT_DIR / 'source.json').read_text(encoding='utf-8'))
    chars = all_characters()
    assert digest(FONT_PATH.read_bytes()) == lock['subsetSha256']
    assert digest((FONT_DIR / 'OFL.txt').read_bytes()) == lock['licenseSha256']
    assert digest(chars.encode()) == lock['charactersSha256']
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))
    face = pdfmetrics.getFont(FONT_NAME).face
    assert all(c.isspace() or ord(c) in face.charToGlyph for c in chars), 'Missing print glyph'
    for locale in COPY:
        for paper in PAPERS:
            page_width = PAPERS[paper][0] / mm
            for entry in text_entries(locale, paper):
                assert pdfmetrics.stringWidth(entry['value'], FONT_NAME, entry['size']) <= entry.get('maxMm', page_width - 36) * mm, (locale, paper, entry['value'])
            name_width = pdfmetrics.stringWidth(COPY[locale]['name'], FONT_NAME, 17) / mm
            type_width = pdfmetrics.stringWidth(COPY[locale]['type'], FONT_NAME, 8) / mm
            assert 18 + name_width + 8 <= page_width - 18 - type_width, 'Title elements overlap'


def write_pdf(pattern, locale, paper, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('xb') as handle:
        draw_pdf(pattern, locale, paper, handle)


def draw_pdf(pattern, locale, paper, handle):
    width, height = PAPERS[paper]
    grid_x, pitch = (width / mm - 145) / 2, 5
    pdf = canvas.Canvas(handle, pagesize=PAPERS[paper], invariant=1, pageCompression=1,
                        initialFontName=FONT_NAME, initialFontSize=8, lang=LANGUAGES[locale])
    pdf.setTitle(title(locale)); pdf.setAuthor('Fuse Bead Patterns team')
    pdf.setSubject(f'Unofficial Minecraft Creeper face fan art; {locale}; Perler Midi; 29 x 29; 5 mm; {paper}; 100%')
    pdf.setViewerPreference('PrintScaling', 'None')

    def line(x1, y1, x2, y2, weight=.1, color='#a2aaa6'):
        pdf.setLineWidth(weight * mm); pdf.setStrokeColor(HexColor(color))
        pdf.line(x1 * mm, height - y1 * mm, x2 * mm, height - y2 * mm)

    for (x, y), entry in pattern['occupied'].items():
        pdf.setFillColor(HexColor(entry['hex']))
        pdf.rect((grid_x + x * pitch) * mm, height - (GRID_TOP + (y + 1) * pitch) * mm, pitch * mm, pitch * mm, fill=1, stroke=0)
        pdf.setFillColor(HexColor('#ffffff' if entry['symbol'] == 'K' else INK)); pdf.setFont(FONT_NAME, 7)
        pdf.drawCentredString((grid_x + (x + .5) * pitch) * mm, height - (GRID_TOP + (y + .5) * pitch) * mm - 2.2, entry['symbol'])
    for index in range(30):
        weight, color = (.23, '#65736b') if index % 5 == 0 or index == 29 else (.1, '#a2aaa6')
        line(grid_x + index * pitch, GRID_TOP, grid_x + index * pitch, GRID_BOTTOM, weight, color)
        line(grid_x, GRID_TOP + index * pitch, grid_x + 145, GRID_TOP + index * pitch, weight, color)
    pdf.setFont(FONT_NAME, 5.5); pdf.setFillColor(HexColor(MUTED))
    for index in range(29):
        pdf.drawCentredString((grid_x + (index + .5) * pitch) * mm, height - (GRID_TOP - 1.5) * mm, str(index + 1))
        pdf.drawRightString((grid_x - 2) * mm, height - (GRID_TOP + (index + .5) * pitch) * mm - 2, str(index + 1))
    line(18, 198.5, 181, 198.5)
    for index, entry in enumerate(PALETTE.values()):
        pdf.setFillColor(HexColor(entry['hex'])); pdf.setStrokeColor(HexColor('#8c9590')); pdf.setLineWidth(.15 * mm)
        pdf.rect(18 * mm, height - (205 + index * 7) * mm, 4 * mm, 4 * mm, fill=1, stroke=1)
    line(18, 256, 68, 256, .4, INK)
    for x in (18, 68): line(x, 254.5, x, 257.5, .4, INK)
    line(194, 195, 194, 245, .4, INK)
    for y in (195, 245): line(192.5, y, 195.5, y, .4, INK)
    for entry in text_entries(locale, paper):
        pdf.setFont(FONT_NAME, entry['size']); pdf.setFillColor(HexColor(entry.get('color', INK)))
        draw = pdf.drawRightString if entry.get('right') else pdf.drawString
        draw(entry['x'] * mm, height - entry['y'] * mm, entry['value'])
    pdf.linkURL(detail_url(locale), (18 * mm, 4 * mm, width - 18 * mm, 10 * mm), relative=0)
    pdf.showPage(); pdf.save()


def validate_pdf(pattern, locale, paper, path):
    width, height = PAPERS[paper]
    reader = PdfReader(path)
    assert len(reader.pages) == 1
    assert all(abs(a - b) < .002 for a, b in zip(reader.pages[0].mediabox, (0, 0, width, height)))
    assert reader.trailer['/Root']['/Lang'] == LANGUAGES[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    assert reader.metadata.title == title(locale)
    assert [a.get_object()['/A']['/URI'] for a in reader.pages[0]['/Annots']] == [detail_url(locale)]
    for item in reader.pages[0]['/Resources']['/Font'].values():
        font = item.get_object()
        assert FONT_NAME in font['/BaseFont']
        assert font['/FontDescriptor']['/FontFile2'].get_data() and font['/ToUnicode'].get_data()
    with pdfplumber.open(path) as document:
        page = document.pages[0]
        compact = re.sub(r'\s+', '', page.extract_text())
        for entry in text_entries(locale, paper): assert re.sub(r'\s+', '', entry['value']) in compact
        assert not any(value in compact for value in ('(cid:', '\ufffd', '\u25a0'))
        assert all(c['x0'] >= 17 * mm and c['x1'] <= width - 12 * mm and c['top'] >= 7 * mm and c['bottom'] <= height - 4 * mm for c in page.chars)
        grid_x = (width / mm - 145) / 2
        cells = {}
        for rect in page.rects:
            if abs(rect['width'] - 5 * mm) < .003 and abs(rect['height'] - 5 * mm) < .003:
                x = round((rect['x0'] / mm - grid_x) / 5); y = round((rect['top'] / mm - GRID_TOP) / 5)
                assert (x, y) not in cells
                assert abs(rect['x0'] - (grid_x + x * 5) * mm) < .003
                assert abs(rect['top'] - (GRID_TOP + y * 5) * mm) < .003
                cells[x, y] = tuple(round(c * 255) for c in rect['non_stroking_color'])
        assert cells == {key: tuple(entry['rgb']) for key, entry in pattern['occupied'].items()}, 'Printed grid changed'
        for index in range(30):
            expected_lines = [(grid_x + index * 5, GRID_TOP, grid_x + index * 5, GRID_BOTTOM),
                              (grid_x, GRID_TOP + index * 5, grid_x + 145, GRID_TOP + index * 5)]
            for x0, top, x1, bottom in expected_lines:
                assert any(all(abs(actual - expected * mm) < .003 for actual, expected in
                               zip((line['x0'], line['top'], line['x1'], line['bottom']), (x0, top, x1, bottom)))
                           for line in page.lines), 'Missing or shifted 5 mm grid line'
        for expected in ((18, 256, 68, 256), (194, 195, 194, 245)):
            assert any(all(abs(actual - position * mm) < .003 for actual, position in
                           zip((line['x0'], line['top'], line['x1'], line['bottom']), expected))
                       for line in page.lines), 'Missing or shifted 50 mm reference'
        grid_symbols = {}
        for char in page.chars:
            if GRID_TOP * mm <= char['top'] < GRID_BOTTOM * mm and grid_x * mm <= char['x0'] < (grid_x + 145) * mm:
                x = round(((char['x0'] + char['x1']) / 2 / mm - grid_x - 2.5) / 5)
                y = int((char['top'] / mm - GRID_TOP) // 5)
                assert (x, y) not in grid_symbols and abs(char['size'] - 7) < .0001
                assert abs((char['x0'] + char['x1']) / 2 - (grid_x + (x + .5) * 5) * mm) < .003
                baseline = height - (GRID_TOP + (y + .5) * 5) * mm - 2.2
                assert abs(char['y0'] - baseline - pdfmetrics.getDescent(FONT_NAME, 7)) < .003
                grid_symbols[x, y] = char['text']
        assert grid_symbols == {key: entry['symbol'] for key, entry in pattern['occupied'].items()}, 'Printed cell symbols changed'
    return {'locale': locale, 'paper': paper, 'path': str(path), 'sha256': digest(path.read_bytes()),
            'pages': 1, 'beads': 256, 'kind': 'fan-art', 'visualReview': 'not-performed-by-this-check'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack', type=Path)
    parser.add_argument('--font-characters', action='store_true')
    parser.add_argument('--check-template', action='store_true')
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    if args.font_characters:
        print(json.dumps({'characters': all_characters()}, ensure_ascii=False))
    elif args.check_template:
        register_font()
        print(json.dumps({'template': 'checked', 'characters': len(all_characters()), 'languages': list(COPY), 'pdfsAuthored': 0}))
    else:
        parser.error('--pack is required for PDF creation or validation') if args.pack is None else None
        pattern = load_pattern(args.pack)
        register_font()
        outputs = [output_path(args.pack, locale, paper) for locale in COPY for paper in PAPERS]
        if not args.check_only: assert all(not path.exists() for path in outputs), 'PDF batch already exists'
        results = []
        for locale in COPY:
            for paper in PAPERS:
                destination = output_path(args.pack, locale, paper)
                if not args.check_only: write_pdf(pattern, locale, paper, destination)
                results.append(validate_pdf(pattern, locale, paper, destination))
        print(json.dumps({'pdfs': results}, ensure_ascii=False, indent=2))

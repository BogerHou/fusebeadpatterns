"""Build eight Christmas Bauble Ornament print charts from the reviewed original source pack.

Offline generation, exclusive outputs, no recolouring and no old-font refresh.
--font-characters, --preflight-only and --check-only do not author PDFs. The source pack remains
private; its eight reviewed charts are promoted separately to public downloads.
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
FONT_DIR = ROOT / 'scripts/fonts/bauble-jp'
FONT_NAME = 'FuseBeadBaubleJapanese'
FONT_PATH = FONT_DIR / (FONT_NAME + '-Regular.ttf')
ID = 'original-christmas-bauble-ornament'
ROWS_HASH = '380693bd584782c09b556bebc370ebb2b4bd0b8d6e0401125290e107118f0247'
SITE = 'https://fusebeadpatterns.art'
INK, MUTED = '#25342e', '#59655f'
OFFICIAL_METHOD = 'https://perler.com/blogs/projects/standard-fusing-method'
COPY = {
    'en': {
        'name': 'Christmas Bauble Ornament', 'type': 'Perler Bead Pattern',
        'grid': '29 x 29 grid / 1 Midi board / 362 beads / 3 colors',
        'materials': 'Perler Midi materials', 'header': 'Symbol / Perler ref / Color name: EN', 'count': 'Count',
        'blank': 'Empty cells need no beads. White cells with a symbol need white beads.',
        'hole': 'Opening: leave columns 14-16, rows 5-7 empty (from 1). Finished opening size is untested.',
        'adult': "An adult should follow Perler's fusing method (EN). Cool fully, then check every join.",
        'hanging': 'Thread a thin cord/ribbon naturally through the cooled opening and tie. Do not force it.',
        'physical': 'Original; physical assembly, ironing, hanging and hanging strength have not been tested.',
        'color': 'Screen and print colors are approximate. Check color refs against your beads.',
        'print': '{paper}: print at 100% / Actual size. Turn off "Fit to page".',
        'scale': 'Both lines must measure 50 mm. Check the 5 mm pitch against your Midi board.',
        'detail': 'Pattern and editor',
    },
    'de': {
        'name': 'Weihnachtskugel mit Aufhängeöffnung', 'type': 'Bügelperlen-Vorlage',
        'grid': '29 x 29 Felder / 1 Midi-Platte / 362 Perlen / 3 Farben',
        'materials': 'Materialliste: Perler Midi', 'header': 'Symbol / Farbnummer / Farbe: EN', 'count': 'Anzahl',
        'blank': 'Leere Felder bleiben ohne Perle. Weiße Felder mit Symbol brauchen weiße Perlen.',
        'hole': 'Öffnung: Spalten 14-16, Zeilen 5-7 frei lassen (ab 1). Fertige Öffnungsgröße ungeprüft.',
        'adult': 'Ein Erwachsener folgt Perlers Bügelmethode (Englisch). Ganz abkühlen; Verbindungen prüfen.',
        'hanging': 'Dünne Schnur oder Band ohne Druck durch die abgekühlte Öffnung führen und verknoten.',
        'physical': 'Original. Bau, Bügeln, Aufhängen und Festigkeit der Aufhängung sind ungeprüft.',
        'color': 'Bildschirm- und Druckfarben sind Näherungen. Farbnummern an den eigenen Perlen prüfen.',
        'print': '{paper}: 100% / Tatsächliche Größe. "An Seite anpassen" ausschalten.',
        'scale': 'Beide Messlinien müssen 50 mm messen. Das 5-mm-Raster an der Midi-Platte prüfen.',
        'detail': 'Vorlage und Editor',
    },
    'fr': {
        'name': 'Boule de Noël à suspendre', 'type': 'Modèle de perles à repasser',
        'grid': '29 x 29 cases / 1 plaque Midi / 362 perles / 3 couleurs',
        'materials': 'Matériel : Perler Midi', 'header': 'Symbole / référence / Couleur: EN', 'count': 'Quantité',
        'blank': 'Cases vides : sans perle. Une case blanche avec un symbole demande une perle blanche.',
        'hole': 'Trou : colonnes 14-16, lignes 5-7 vides (à partir de 1). Dimensions finales non testées.',
        'adult': 'Un adulte suit la méthode Perler (anglais). Laisser refroidir puis vérifier les jonctions.',
        'hanging': 'Passer un cordon fin ou ruban dans le trou refroidi sans forcer, puis le nouer.',
        'physical': 'Original. Assemblage, repassage, suspension et résistance de l’attache non testés.',
        'color': 'Les couleurs à l’écran et sur papier sont approximatives. Vérifiez les références sur vos perles.',
        'print': '{paper} : 100% / Taille réelle. Désactivez "Ajuster à la page".',
        'scale': 'Les deux repères doivent mesurer 50 mm. Vérifiez la grille de 5 mm sur votre plaque Midi.',
        'detail': 'Modèle et éditeur',
    },
    'ja': {
        'name': '吊り下げ穴付きクリスマスオーナメント', 'type': 'アイロンビーズ図案',
        'grid': '29 x 29マス / ミディ用プレート1枚 / 362個 / 3色',
        'materials': 'Perler Midiの材料表', 'header': '記号 / 色番号 / 商品色名: EN', 'count': '個数',
        'blank': '空白には置きません。記号のある白いマスには白いビーズを置きます。',
        'hole': '吊り下げ穴：列14-16・行5-7の9マスは空白（1から数える）。完成後の穴寸法は未検証。',
        'adult': '大人がPerler公式の接合手順（英語）に従い、完全に冷まして接合部を確認。',
        'hanging': '冷めた実物の吊り下げ穴に細いひも・リボンを無理なく通して結びます。',
        'physical': 'オリジナル。実物制作・アイロン・吊り下げ・吊り下げ強度は未検証。',
        'color': '画面と印刷の色は目安です。実物のビーズの色番号を確認してください。',
        'print': '{paper}・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'scale': '縦横の確認線は各50 mm。1マス5 mmの間隔を実物のミディ用プレートで確認。',
        'detail': '図案とエディター',
    },
}
LANGUAGES = {'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}
PAPERS = {'a4': A4, 'letter': letter}


def digest(data):
    return sha256(data).hexdigest()


def detail_url(locale):
    return SITE + ('' if locale == 'en' else '/' + locale) + '/patterns/christmas-bauble-ornament'


def output_path(pack, locale, paper):
    if locale == 'en':
        name = 'reference-pattern-library.pdf' if paper == 'a4' else 'reference-pattern-library-us-letter.pdf'
        return pack / name
    return pack / 'localized-pdfs' / locale / ('pattern.pdf' if paper == 'a4' else 'pattern-letter.pdf')


def load_pattern(pack):
    data = json.loads((pack / 'manifest.json').read_text())
    assert len(data['patterns']) == 1
    pattern = data['patterns'][0]
    assert pattern['id'] == ID and pattern['kind'] == 'original'
    assert pattern['slug'] == 'christmas-bauble-ornament' and pattern['source'] is None
    assert pattern['title'] == COPY['en']['name']
    assert pattern['localizedSubjects'] == {locale: COPY[locale]['name'] for locale in ('de', 'fr', 'ja')}
    assert all(pattern[key] is False for key in ('physicalAssemblyTested', 'ironingTested', 'hangingTested', 'loadStrengthTested'))
    assert pattern['width'] == pattern['height'] == 29
    rows = pattern['rows']
    assert len(rows) == 29 and all(len(row) == 29 for row in rows)
    assert digest(('\n'.join(rows)).encode()) == ROWS_HASH, 'Reviewed original grid changed'
    assert Counter(''.join(rows).replace('.', '')) == {'R': 249, 'W': 60, 'G': 53}
    assert pattern['beads'] == 362 and pattern['colorCount'] == 3
    assert pattern['bounds'] == {'x': 4, 'y': 2, 'width': 21, 'height': 25}
    palette = pattern['palette']
    assert pattern['materials'] == list(palette.values())
    assert {key: item['ref'] for key, item in palette.items()} == {'R': '80-19005', 'W': '80-19001', 'G': '80-19057'}
    actual_counts = Counter(''.join(rows).replace('.', ''))
    with (ROOT / 'public/palettes/perler.csv').open(newline='') as source:
        available = {row[0]: row for row in csv.reader(source)}
    for symbol, entry in palette.items():
        bead = available[entry['ref']]
        rgb = [int(channel) for channel in bead[3:6]]
        assert entry['symbol'] == symbol and entry['count'] == actual_counts[symbol]
        assert entry['name'] == bead[1] and entry['rgb'] == rgb
        assert entry['hex'] == '#' + ''.join(f'{channel:02x}' for channel in rgb)
    occupied = {(x, y): palette[symbol] for y, row in enumerate(rows) for x, symbol in enumerate(row) if symbol != '.'}
    expected = bytes(channel for row in rows for symbol in row
                     for channel in (palette[symbol]['rgb'] + [255] if symbol != '.' else [0, 0, 0, 0]))
    pixels = pack / 'pixels' / (ID + '.png')
    project_path = pack / 'projects' / (ID + '.bead-pattern.json')
    with Image.open(pixels) as image:
        assert image.mode == 'RGBA' and image.size == (29, 29) and image.tobytes() == expected
    project = json.loads(project_path.read_text())
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
    draft = project['draft']
    assert draft['version'] == 1 and draft['selectedPaletteIds'] == ['perler']
    assert draft['boardId'] == 'midi' and draft['boardWidth'] == draft['boardHeight'] == 1
    assert draft['pdfScaleMode'] == 'midi-5mm' and draft['activePalettes'][0]['name'] == 'Perler Midi'
    assert draft['editedPattern']['width'] == draft['editedPattern']['height'] == 29
    assert base64.b64decode(draft['editedPattern']['data'], validate=True) == expected
    validate_opening(pattern, occupied)
    pattern['occupied'] = occupied
    return pattern


def validate_opening(pattern, occupied):
    expected_hole = {(x, y) for y in range(4, 7) for x in range(13, 16)}
    empty = {(x, y) for y in range(29) for x in range(29)} - set(occupied)
    # Flood only empty cells touching the board edge; the remainder must be
    # exactly the nine planned empty cells, never white beads or another void.
    outside = {cell for cell in empty if 0 in cell or 28 in cell}
    queue = list(outside)
    for x, y in queue:
        for candidate in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
            if candidate in empty and candidate not in outside:
                outside.add(candidate); queue.append(candidate)
    assert empty - outside == expected_hole, 'The printed hanging opening changed'
    for y in range(2, 9):
        for x in range(11, 18):
            assert pattern['rows'][y][x] == ('.' if (x, y) in expected_hole else 'G')
    opening = {'coordinates': 'One-based columns and rows', 'columnStart': 14,
               'columnEnd': 16, 'rowStart': 5, 'rowEnd': 7, 'width': 3, 'height': 3,
               'emptyCells': 9, 'frameWidthCells': 2}
    assert pattern['hangingOpening'] == opening
    holes = [{'size': 9, 'bounds': {'x': 13, 'y': 4, 'width': 3, 'height': 3},
              'cellsOneBased': [{'row': y+1, 'column': x+1} for x, y in sorted(expected_hole, key=lambda p: (p[1], p[0]))]}]
    assert pattern['topology']['enclosedEmptyComponents'] == holes
    assert pattern['validation']['digitalEnclosedEmptyComponents'] == holes
    assert pattern['topology']['hangingOpening'] == opening
    assert all(pattern['validation'][key] is False for key in
               ('physicalAssemblyTested', 'ironingTested', 'hangingTested', 'loadStrengthTested'))


def title(locale):
    return COPY[locale]['name'] + ' ' + COPY[locale]['type']


def text_entries(pattern, locale, paper):
    copy = COPY[locale]
    width, height = PAPERS[paper]
    width_mm, height_mm = width / mm, height / mm
    values = [
        {'x': 18, 'y': 13, 'value': 'FUSE BEAD PATTERNS', 'size': 8, 'color': MUTED},
        {'x': 18, 'y': 25, 'value': copy['name'], 'size': 16, 'maxMm': width_mm - 36},
        {'x': width_mm - 18, 'y': 13, 'value': copy['type'], 'size': 8, 'right': True, 'maxMm': 84},
        {'x': 18, 'y': 35, 'value': copy['grid'], 'size': 8.3},
        {'x': 18, 'y': 195, 'value': copy['materials'], 'size': 10},
        {'x': 18, 'y': 201, 'value': copy['header'], 'size': 7.2},
        {'x': 180, 'y': 201, 'value': copy['count'], 'size': 7.2, 'right': True},
    ]
    for index, (symbol, entry) in enumerate(pattern['palette'].items()):
        y = 209 + index * 7
        values.extend((
            {'x': 24, 'y': y, 'value': symbol, 'size': 8, 'maxMm': 6},
            {'x': 36, 'y': y, 'value': entry['ref'], 'size': 8, 'maxMm': 35},
            {'x': 80, 'y': y, 'value': entry['name'], 'size': 8, 'maxMm': 75},
            {'x': 180, 'y': y, 'value': str(entry['count']), 'size': 8, 'right': True, 'maxMm': 18},
        ))
    for key, y in [('blank', 228.5), ('hole', 232.5), ('adult', 236.5), ('hanging', 240.5), ('physical', 244.5), ('color', 248.5), ('print', 252.5), ('scale', 263)]:
        value = copy[key].format(paper='A4' if paper == 'a4' else 'US Letter')
        values.append({'x': 18, 'y': y, 'value': value, 'size': 7.2, 'maxMm': width_mm - 36, 'color': MUTED if key in ('color', 'physical') else INK})
    values.extend((
        {'x': 73, 'y': 257.8, 'value': '50 mm', 'size': 8, 'maxMm': 20},
        {'x': 194, 'y': 195, 'value': '50 mm', 'size': 7, 'right': True, 'maxMm': 17},
        {'x': 18, 'y': height_mm - 9, 'value': copy['detail'], 'size': 7, 'maxMm': 60},
        {'x': width_mm - 18, 'y': height_mm - 9, 'value': detail_url(locale).removeprefix('https://'), 'size': 7, 'right': True, 'maxMm': 108},
    ))
    return values


def all_characters(pattern):
    values = [str(i) for i in range(1, 30)]
    for locale in COPY:
        for paper in PAPERS:
            values.extend(entry['value'] for entry in text_entries(pattern, locale, paper))
    return ''.join(sorted(set(''.join(values))))


def register_font(pattern):
    lock = json.loads((FONT_DIR / 'source.json').read_text())
    chars = all_characters(pattern)
    assert digest(FONT_PATH.read_bytes()) == lock['subsetSha256']
    assert digest((FONT_DIR / 'OFL.txt').read_bytes()) == lock['licenseSha256']
    assert digest(chars.encode()) == lock['charactersSha256']
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))
    face = pdfmetrics.getFont(FONT_NAME).face
    assert all(c.isspace() or ord(c) in face.charToGlyph for c in chars), 'Missing print glyph'
    for locale in COPY:
        for paper in PAPERS:
            page_width = PAPERS[paper][0] / mm
            entries = text_entries(pattern, locale, paper)
            brand, type_label = entries[0], entries[2]
            brand_right = brand['x'] + pdfmetrics.stringWidth(brand['value'], FONT_NAME, brand['size']) / mm
            type_left = type_label['x'] - pdfmetrics.stringWidth(type_label['value'], FONT_NAME, type_label['size']) / mm
            assert brand_right < type_left, 'Header type overlaps the brand'
            for entry in entries:
                assert pdfmetrics.stringWidth(entry['value'], FONT_NAME, entry['size']) <= entry.get('maxMm', page_width - 36) * mm, (locale, paper, entry['value'])


def write_pdf(pattern, locale, paper, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open('xb') as handle:
        draw_pdf(pattern, locale, paper, handle)


def draw_pdf(pattern, locale, paper, handle):
    width, height = PAPERS[paper]
    grid_x, grid_top, pitch = (width / mm - 145) / 2, 42, 5
    pdf = canvas.Canvas(handle, pagesize=PAPERS[paper], invariant=1, pageCompression=1,
                        initialFontName=FONT_NAME, initialFontSize=8, lang=LANGUAGES[locale])
    pdf.setTitle(title(locale)); pdf.setAuthor('Fuse Bead Patterns team')
    pdf.setSubject(f'{locale}; Perler Midi; 29 x 29; 5 mm; {paper}; 100%')
    pdf.setViewerPreference('PrintScaling', 'None')

    def line(x1, y1, x2, y2, weight=.1, color='#a2aaa6'):
        pdf.setLineWidth(weight * mm); pdf.setStrokeColor(HexColor(color))
        pdf.line(x1 * mm, height - y1 * mm, x2 * mm, height - y2 * mm)

    for (x, y), entry in pattern['occupied'].items():
        pdf.setFillColor(HexColor(entry['hex']))
        pdf.rect((grid_x + x * pitch) * mm, height - (grid_top + (y + 1) * pitch) * mm, pitch * mm, pitch * mm, fill=1, stroke=0)
        luminance = sum(value * weight for value, weight in zip(entry['rgb'], (.299, .587, .114)))
        pdf.setFillColor(HexColor(INK if luminance > 150 else '#ffffff')); pdf.setFont(FONT_NAME, 7)
        pdf.drawCentredString((grid_x + (x + .5) * pitch) * mm, height - (grid_top + (y + .5) * pitch) * mm - 2.2, entry['symbol'])
    for index in range(30):
        weight, color = (.23, '#65736b') if index % 5 == 0 or index == 29 else (.1, '#a2aaa6')
        line(grid_x + index * pitch, grid_top, grid_x + index * pitch, grid_top + 145, weight, color)
        line(grid_x, grid_top + index * pitch, grid_x + 145, grid_top + index * pitch, weight, color)
    pdf.setFont(FONT_NAME, 5.5); pdf.setFillColor(HexColor(MUTED))
    for index in range(29):
        pdf.drawCentredString((grid_x + (index + .5) * pitch) * mm, height - (grid_top - 1.5) * mm, str(index + 1))
        pdf.drawRightString((grid_x - 2) * mm, height - (grid_top + (index + .5) * pitch) * mm - 2, str(index + 1))
    line(18, 202.5, 181, 202.5)
    for index, entry in enumerate(pattern['palette'].values()):
        pdf.setFillColor(HexColor(entry['hex'])); pdf.setStrokeColor(HexColor('#8c9590')); pdf.setLineWidth(.15 * mm)
        pdf.rect(18 * mm, height - (210 + index * 7) * mm, 4 * mm, 4 * mm, fill=1, stroke=1)
    line(18, 256, 68, 256, .4, INK)
    for x in (18, 68): line(x, 254.5, x, 257.5, .4, INK)
    line(194, 198, 194, 248, .4, INK)
    for y in (198, 248): line(192.5, y, 195.5, y, .4, INK)
    for entry in text_entries(pattern, locale, paper):
        pdf.setFont(FONT_NAME, entry['size']); pdf.setFillColor(HexColor(entry.get('color', INK)))
        draw = pdf.drawRightString if entry.get('right') else pdf.drawString
        draw(entry['x'] * mm, height - entry['y'] * mm, entry['value'])
    pdf.linkURL(OFFICIAL_METHOD, (18 * mm, height - 237.5 * mm, width - 18 * mm, height - 233.5 * mm), relative=0)
    pdf.linkURL(detail_url(locale), (18 * mm, 6 * mm, width - 18 * mm, 13 * mm), relative=0)
    pdf.showPage(); pdf.save()


def validate_pdf(pattern, locale, paper, path):
    width, height = PAPERS[paper]
    reader = PdfReader(path)
    assert len(reader.pages) == 1
    assert all(abs(a - b) < .002 for a, b in zip(reader.pages[0].mediabox, (0, 0, width, height)))
    assert reader.trailer['/Root']['/Lang'] == LANGUAGES[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    assert reader.metadata.title == title(locale)
    assert [a.get_object()['/A']['/URI'] for a in reader.pages[0]['/Annots']] == [OFFICIAL_METHOD, detail_url(locale)]
    for item in reader.pages[0]['/Resources']['/Font'].values():
        font = item.get_object()
        assert FONT_NAME in font['/BaseFont']
        assert font['/FontDescriptor']['/FontFile2'].get_data() and font['/ToUnicode'].get_data()
    with pdfplumber.open(path) as document:
        page = document.pages[0]
        compact = re.sub(r'\s+', '', page.extract_text())
        for entry in text_entries(pattern, locale, paper): assert re.sub(r'\s+', '', entry['value']) in compact
        assert not any(value in compact for value in ('(cid:', '\ufffd', '\u25a0'))
        assert all(c['x0'] >= 17 * mm and c['x1'] <= width - 12 * mm and c['top'] >= 8 * mm and c['bottom'] <= height - 6 * mm for c in page.chars)
        grid_x = (width / mm - 145) / 2
        cells = {}
        for rect in page.rects:
            if abs(rect['width'] - 5 * mm) < .003 and abs(rect['height'] - 5 * mm) < .003:
                x = round((rect['x0'] / mm - grid_x) / 5); y = round((rect['top'] / mm - 42) / 5)
                assert (x, y) not in cells
                assert abs(rect['x0'] - (grid_x + x * 5) * mm) < .003
                assert abs(rect['top'] - (42 + y * 5) * mm) < .003
                cells[x, y] = tuple(round(c * 255) for c in rect['non_stroking_color'])
        assert cells == {key: tuple(entry['rgb']) for key, entry in pattern['occupied'].items()}, 'Printed grid changed'
        for index in range(30):
            expected_lines = [(grid_x + index * 5, 42, grid_x + index * 5, 187),
                              (grid_x, 42 + index * 5, grid_x + 145, 42 + index * 5)]
            for x0, top, x1, bottom in expected_lines:
                assert any(all(abs(actual - expected * mm) < .003 for actual, expected in
                               zip((line['x0'], line['top'], line['x1'], line['bottom']), (x0, top, x1, bottom)))
                           for line in page.lines), 'Missing or shifted 5 mm grid line'
        for orientation in ('horizontal', 'vertical'):
            assert any(abs(line['width' if orientation == 'horizontal' else 'height'] - 50 * mm) < .003 and abs(line['height' if orientation == 'horizontal' else 'width']) < .003 for line in page.lines), 'Missing 50 mm reference'
        grid_symbols = {}
        for char in page.chars:
            if 42 * mm <= char['top'] < 187 * mm and grid_x * mm <= char['x0'] < (grid_x + 145) * mm:
                x = round(((char['x0'] + char['x1']) / 2 / mm - grid_x - 2.5) / 5)
                y = int((char['top'] / mm - 42) // 5)
                assert (x, y) not in grid_symbols and abs(char['size'] - 7) < .0001
                assert abs((char['x0'] + char['x1']) / 2 - (grid_x + (x + .5) * 5) * mm) < .003
                baseline = height - (42 + (y + .5) * 5) * mm - 2.2
                assert abs(char['y0'] - baseline - pdfmetrics.getDescent(FONT_NAME, 7)) < .003
                grid_symbols[x, y] = char['text']
        assert grid_symbols == {key: entry['symbol'] for key, entry in pattern['occupied'].items()}, 'Printed per-cell symbols changed'
    return {'locale': locale, 'paper': paper, 'path': str(path), 'sha256': digest(path.read_bytes()), 'pages': 1, 'beads': 362}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack', required=True, type=Path)
    parser.add_argument('--font-characters', action='store_true')
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--preflight-only', action='store_true')
    args = parser.parse_args()
    pattern = load_pattern(args.pack)
    if args.font_characters:
        print(json.dumps({'characters': all_characters(pattern)}, ensure_ascii=False))
    else:
        register_font(pattern)
        if args.preflight_only:
            print(json.dumps({'preflight': 'passed', 'beads': 362, 'openingCells': 9, 'characters': len(all_characters(pattern)), 'font': str(FONT_PATH)}, ensure_ascii=False))
            raise SystemExit(0)
        outputs = [output_path(args.pack, locale, paper) for locale in COPY for paper in PAPERS]
        if not args.check_only: assert all(not path.exists() for path in outputs), 'PDF batch already exists'
        results = []
        for locale in COPY:
            for paper in PAPERS:
                destination = output_path(args.pack, locale, paper)
                if not args.check_only: write_pdf(pattern, locale, paper, destination)
                results.append(validate_pdf(pattern, locale, paper, destination))
        print(json.dumps({'pdfs': results}, ensure_ascii=False, indent=2))

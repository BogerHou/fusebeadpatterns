"""Create only the reviewed Mini Ghost reading charts in a new source-pack directory.

These are counting references, never actual-size Mini placement templates.
All old library assets and fonts are read-only. See README-mini-ghost-pdfs.md.
"""
import argparse
import base64
from collections import Counter
from hashlib import sha256
import io
import json
from pathlib import Path
import re

from PIL import Image
from pypdf import PdfReader
import pdfplumber
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
SOURCE_RGBA_SHA = 'fefb58a1c8222731a99982e6ce35ca709c79f47ba5d2fd068174075ae49c85a0'
COLORS = {'W': (234, 239, 238, 255), 'B': (50, 50, 52, 255)}
COUNTS = {'W': 293, 'B': 18}
CELL = 4.5 * mm
COPY = {
    'en': {
        'title': 'Mini Perler Bead Pattern: Ghost',
        'summary': 'Perler Mini | 311 beads | 2 colors | 29 x 29 reading grid',
        'reference': 'Reference chart for counting rows and columns. Not an actual-size placement template.',
        'board': 'Use a pegboard made for your Mini beads. The editable project uses a 57 x 57 grid.',
        'empty': 'Blank cells need no bead. A W cell needs a white bead.',
        'headers': ['Symbol', 'Perler Mini color', 'Beads'],
        'total': 'Total',
        'symbols': 'W / B are chart identifiers, not product or shopping codes.',
        'limits': 'Screen colors are approximate. This Mini version has not been assembled or iron-tested.',
        'footer': 'Original Ghost design - Mini color version | Fuse Bead Patterns',
    },
    'de': {
        'title': 'Perler-Mini-Vorlage: Geist',
        'summary': 'Perler Mini | 311 Perlen | 2 Farben | Leseraster 29 x 29',
        'reference': 'Referenz zum Abzählen der Zeilen und Spalten. Keine Vorlage zum Auflegen in Originalgröße.',
        'board': 'Verwende eine Platte für deine Mini-Perlen. Das bearbeitbare Projekt hat ein Raster von 57 x 57.',
        'empty': 'Leere Felder bleiben ohne Perle. Ein W-Feld braucht eine weiße Perle.',
        'headers': ['Symbol', 'Perler-Mini-Farbe', 'Perlen'],
        'total': 'Gesamt',
        'symbols': 'W / B sind Rasterkennzeichen, keine Produkt- oder Bestellnummern.',
        'limits': 'Bildschirmfarben sind Näherungen. Die Mini-Version wurde nicht gebaut oder bügelgetestet.',
        'footer': 'Eigenes Geistmotiv - Mini-Farbversion | Fuse Bead Patterns',
    },
    'fr': {
        'title': 'Modèle Perler Mini : fantôme',
        'summary': 'Perler Mini | 311 perles | 2 couleurs | grille de lecture 29 x 29',
        'reference': 'Grille de référence pour compter les lignes et colonnes. Pas un gabarit de pose à taille réelle.',
        'board': 'Utilisez une plaque adaptée à vos perles Mini. Le projet modifiable utilise une grille de 57 x 57.',
        'empty': 'Les cases vides restent sans perle. Une case W demande une perle blanche.',
        'headers': ['Symbole', 'Couleur Perler Mini', 'Perles'],
        'total': 'Total',
        'symbols': 'W / B identifient les couleurs du dessin ; ce ne sont pas des références commerciales.',
        'limits': 'Les couleurs à l’écran sont indicatives. Cette version Mini n’a pas été assemblée ni testée au fer.',
        'footer': 'Fantôme original - version de couleurs Mini | Fuse Bead Patterns',
    },
    'ja': {
        'title': 'ゴーストのMiniビーズ図案',
        'summary': 'Perler Mini | 311個 | 2色 | 読み取り用29 x 29マス',
        'reference': '行と列を数えて作るための参考図です。実寸の配置用型紙ではありません。',
        'board': 'Miniビーズに合うプレートを使用してください。編集プロジェクトは57 x 57マスです。',
        'empty': '空白のマスにはビーズを置きません。Wのマスには白いビーズを置きます。',
        'headers': ['記号', 'Perler Miniの色名', '個数'],
        'total': '合計',
        'symbols': 'W / Bは図案内の識別用です。商品の購入番号ではありません。',
        'limits': '画面の色は目安です。Mini版の実物の組み立て・アイロン仕上げは未検証です。',
        'footer': 'オリジナルのゴースト図案 - Mini配色版 | Fuse Bead Patterns',
    },
}


def characters():
    return ''.join(sorted(set(''.join(str(value) for copy in COPY.values() for value in copy.values())
                                 + 'WhiteBlack1234567890https://fusebeadpatterns.art/ja/guides/mini-perler-beads')))


def source(pack):
    pixels = Image.open(pack / 'data/original-ghost.png').convert('RGBA')
    assert pixels.size == (29, 29)
    rgba = pixels.tobytes()
    assert sha256(rgba).hexdigest() == SOURCE_RGBA_SHA, 'Original Ghost cells changed'
    usage = Counter(pixels.get_flattened_data())
    assert usage == Counter({(0, 0, 0, 0): 530, COLORS['W']: 293, COLORS['B']: 18})
    project = json.loads((pack / 'projects/ghost-mini.bead-pattern.json').read_text())
    draft = project['draft']
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
    assert draft['selectedPaletteIds'] == ['perler_mini'] and draft['boardId'] == 'mini'
    assert draft['boardWidth'] == draft['boardHeight'] == 1
    assert draft['pdfScaleMode'] == 'fit-page' and draft['sourceMode'] == 'blank'
    assert draft['fileName'] == 'original-friendly-ghost-perler-mini' and draft['useSymbols'] is True
    assert len(draft['activePalettes']) == 1 and draft['activePalettes'][0]['name'] == 'Perler Mini'
    entries = draft['activePalettes'][0]['entries']
    assert len(entries) == 2
    for name, symbol in [('White', 'W'), ('Black', 'B')]:
        entry = next(e for e in entries if e['name'] == name)
        assert entry['ref'] == f'PM-{name.upper()}' and entry['symbol'] == symbol and entry['enabled'] is True
        assert tuple(entry['color'][key] for key in ('r', 'g', 'b', 'a')) == COLORS[symbol]
    edited = draft['editedPattern']
    assert edited['width'] == edited['height'] == 57
    padded = Image.new('RGBA', (57, 57))
    padded.paste(pixels, (14, 14))
    assert base64.b64decode(edited['data']) == padded.tobytes()
    return pixels


def fonts():
    paths = {
        'MiniLatin': ROOT / 'scripts/fonts/calibration/FuseBeadCalibration-Regular.ttf',
        'MiniJapanese': ROOT / 'scripts/fonts/mini-ghost-jp/FuseBeadMiniGhostJapanese-Regular.ttf',
    }
    for name, path in paths.items():
        pdfmetrics.registerFont(TTFont(name, str(path)))
    for locale, copy in COPY.items():
        font = pdfmetrics.getFont('MiniJapanese' if locale == 'ja' else 'MiniLatin')
        text = ''.join(str(value) for value in copy.values())
        assert all(c.isspace() or ord(c) in font.face.charToGlyph for c in text), f'Missing {locale} glyph'


def wrapped(c, text, x, y, width, font, size=8.5, leading=11):
    c.setFont(font, size)
    lines, line = [], ''
    # Character wrapping keeps CJK and URLs within the same explicit bounds.
    for char in text:
        if pdfmetrics.stringWidth(line + char, font, size) > width:
            lines.append(line.rstrip())
            line = char.lstrip()
        else:
            line += char
    if line:
        lines.append(line)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def target(pack, locale, paper):
    return pack / 'pdfs' / locale / f'pattern-{paper}.pdf'


def create_pdf(pack, locale, paper, pixels):
    path = target(pack, locale, paper)
    path.parent.mkdir(parents=True, exist_ok=True)
    width, height = A4 if paper == 'a4' else letter
    copy = COPY[locale]
    font = 'MiniJapanese' if locale == 'ja' else 'MiniLatin'
    # Open exclusively before canvas creation so a rerun cannot overwrite a PDF.
    with path.open('xb') as stream:
        c = canvas.Canvas(stream, pagesize=(width, height), pageCompression=1,
                          lang={'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}[locale])
        c.setTitle(copy['title'])
        c.setAuthor('Fuse Bead Patterns')
        c.setSubject('Perler Mini counting chart; not an actual-size placement template')
        c.setFillColorRGB(.16, .27, .23)
        c.setFont(font, 19)
        c.drawString(36, height - 48, copy['title'])
        c.setFont(font, 10)
        c.drawString(36, height - 68, copy['summary'])
        c.setFillColorRGB(.16, .16, .16)
        y = wrapped(c, copy['reference'], 36, height - 94, width - 72, font, 9, 12)
        wrapped(c, copy['board'], 36, y - 8, width - 72, font)
        left, top = (width - 29 * CELL) / 2, height - 176
        bottom = top - 29 * CELL
        c.setFont('MiniLatin', 6)
        for n in range(29):
            c.drawCentredString(left + (n + .5) * CELL, top + 7, str(n + 1))
            c.drawRightString(left - 6, top - (n + .5) * CELL - 2, str(n + 1))
        for row in range(29):
            for col in range(29):
                pixel = pixels.getpixel((col, row))
                if not pixel[3]:
                    continue
                symbol = next(s for s, color in COLORS.items() if color == pixel)
                c.setFillColorRGB(*(v / 255 for v in pixel[:3]))
                c.rect(left + col * CELL, top - (row + 1) * CELL, CELL, CELL, stroke=0, fill=1)
                c.setFillColorRGB(*( (1, 1, 1) if symbol == 'B' else (.08, .08, .08)))
                c.setFont('MiniLatin', 7)
                c.drawCentredString(left + (col + .5) * CELL, top - (row + .5) * CELL - 2.3, symbol)
        c.setStrokeColorRGB(.63, .65, .63)
        c.setLineWidth(.3)
        for n in range(30):
            c.line(left + n * CELL, bottom, left + n * CELL, top)
            c.line(left, bottom + n * CELL, left + 29 * CELL, bottom + n * CELL)
        c.setFillColorRGB(.12, .12, .12)
        wrapped(c, copy['empty'], 36, bottom - 17, width - 72, font, 8)
        y = bottom - 39
        c.setFont(font, 9)
        for x, heading in zip([36, 103, width - 96], copy['headers']):
            c.drawString(x, y, heading)
        c.setStrokeColorRGB(.5, .6, .55)
        c.setLineWidth(.5)
        c.line(36, y - 5, width - 36, y - 5)
        for symbol, name in [('W', 'White'), ('B', 'Black')]:
            y -= 16
            c.setFont('MiniLatin', 9)
            c.drawString(36, y, symbol)
            c.drawString(103, y, name)
            c.drawRightString(width - 36, y, str(COUNTS[symbol]))
        y -= 16
        c.setFont(font, 9)
        c.drawString(36, y, copy['total'])
        c.setFont('MiniLatin', 9)
        c.drawRightString(width - 36, y, '311')
        y = wrapped(c, copy['symbols'], 36, y - 22, width - 72, font, 8)
        y = wrapped(c, copy['limits'], 36, y - 4, width - 72, font, 8)
        assert y > 31, 'Footnotes would collide with the footer'
        c.setFont(font, 7)
        c.drawString(36, 24, copy['footer'])
        url = 'https://fusebeadpatterns.art/' + (f'{locale}/' if locale != 'en' else '') + 'guides/mini-perler-beads'
        c.setFont('MiniLatin', 7)
        c.drawString(36, 12, url)
        c.linkURL(url, (36, 9, width - 36, 22), relative=0)
        c.showPage()
        c.save()


def validate(path, locale, paper, pixels):
    reader = PdfReader(path)
    assert len(reader.pages) == 1
    page = reader.pages[0]
    expected = A4 if paper == 'a4' else letter
    assert all(abs(float(actual) - want) < .02 for actual, want in zip(page.mediabox[2:], expected))
    assert reader.trailer['/Root']['/Lang'] == {'en': 'en-US', 'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}[locale]
    assert page['/Annots'][0].get_object()['/A']['/URI'].endswith('/guides/mini-perler-beads')
    with pdfplumber.open(path) as pdf:
        p = pdf.pages[0]
        text = p.extract_text()
        assert COPY[locale]['title'] in text and COPY[locale]['total'] in text
        for name, count in [('White', 293), ('Black', 18)]:
            symbol = 'W' if name == 'White' else 'B'
            assert re.search(rf'(?m)^{symbol}\s+{name}\s+{count}$', text), 'Material row mismatch'
        assert re.search(rf'(?m)^{re.escape(COPY[locale]["total"])}\s+311$', text), 'Total row mismatch'
        assert '311' in text and '80-190' not in text and '5 mm' not in text
        width, height = expected
        left, top = (width - 29 * CELL) / 2, height - 176
        cells = [r for r in p.rects if abs(r['width'] - CELL) < .01 and abs(r['height'] - CELL) < .01]
        assert len(cells) == 311
        glyphs = [g for g in p.chars if g['text'] in ('W', 'B') and abs(g['size'] - 7) < .001
                  and left < g['x0'] < left + 29 * CELL
                  and top - 29 * CELL < height - g['top'] < top]
        assert len(glyphs) == 311
        grid_lines = [line for line in p.lines if abs(line['linewidth'] - .3) < .001
                      and line['x0'] >= left - .01 and line['x1'] <= left + 29 * CELL + .01
                      and line['y0'] >= top - 29 * CELL - .01 and line['y1'] <= top + .01]
        assert len(grid_lines) == 60
        for n in range(30):
            for expected_line in [(left + n * CELL, top - 29 * CELL, left + n * CELL, top),
                                  (left, top - 29 * CELL + n * CELL, left + 29 * CELL, top - 29 * CELL + n * CELL)]:
                assert sum(all(abs(line[k] - v) < .01 for k, v in zip(('x0', 'y0', 'x1', 'y1'), expected_line)) for line in grid_lines) == 1
        for row in range(29):
            for col in range(29):
                color = pixels.getpixel((col, row))
                if not color[3]:
                    continue
                x, y = left + col * CELL, top - (row + 1) * CELL
                rect = [r for r in cells if abs(r['x0'] - x) < .01 and abs(r['y0'] - y) < .01]
                assert len(rect) == 1 and all(abs(v - color[i] / 255) < .001 for i, v in enumerate(rect[0]['non_stroking_color']))
                symbol = next(s for s, rgba in COLORS.items() if rgba == color)
                char = [g for g in glyphs if x < g['x0'] < x + CELL and y < height - g['top'] < y + CELL]
                assert len(char) == 1 and char[0]['text'] == symbol, (row, col, symbol)
        for font in page['/Resources']['/Font'].values():
            font = font.get_object()
            if font['/Subtype'] == '/TrueType':
                assert '/ToUnicode' in font and '/FontFile2' in font['/FontDescriptor'].get_object()
        assert all(g['x0'] >= 0 and g['x1'] <= width and g['top'] >= 0 and g['bottom'] <= height for g in p.chars)
    return {'file': str(path), 'sha256': sha256(path.read_bytes()).hexdigest(), 'locale': locale, 'paper': paper, 'beads': 311, 'gridCellMm': 4.5, 'actualSizeTemplate': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack', type=Path)
    parser.add_argument('--font-characters', action='store_true')
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    if args.font_characters:
        print(json.dumps({'characters': characters()}, ensure_ascii=False))
    else:
        assert args.pack, '--pack is required'
        pixels = source(args.pack)
        fonts()
        if not args.check_only:
            assert not (args.pack / 'pdfs').exists(), 'Refusing to replace an existing PDF directory'
            for locale in COPY:
                for paper in ('a4', 'letter'):
                    create_pdf(args.pack, locale, paper, pixels)
        results = [validate(target(args.pack, locale, paper), locale, paper, pixels) for locale in COPY for paper in ('a4', 'letter')]
        print(json.dumps({'pdfs': results}, ensure_ascii=False, indent=2))

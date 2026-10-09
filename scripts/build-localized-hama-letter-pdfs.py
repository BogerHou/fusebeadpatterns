"""Build 18 native-language Hama Midi US Letter PDFs without recolouring assets.

The six reviewed Hama variants are reused exactly. --font-characters and
--check-only never create files, directories, fonts or candidate PDFs. Ordinary
generation stages and validates the entire batch before adding new downloads;
an existing destination is never overwritten. No network calls are made.
"""
import sys

# Importing the reviewed generator must not leave bytecode in the repository,
# including when this script is used for a strictly read-only acceptance run.
sys.dont_write_bytecode = True

import argparse
import base64
from collections import Counter
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import runpy
import shutil
import subprocess
import tempfile

import pdfplumber
from PIL import Image
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ('de', 'fr', 'ja')
LANGUAGES = {'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}
SITE = 'https://fusebeadpatterns.art'
COLLECTION_PATHS = {
    'de': '/de/hama-perlen-vorlagen',
    'fr': '/fr/patterns/hama',
    'ja': '/ja/patterns/hama',
}
FONT_DIR = ROOT / 'scripts/fonts/hama-letter-jp'
FONT_PATH = FONT_DIR / 'FuseBeadHamaLetterJapanese-Regular.ttf'
FONT_NAME = 'FuseBeadHamaLetterJapanese'
PAGE_WIDTH, PAGE_HEIGHT = letter
PAGE_WIDTH_MM = PAGE_WIDTH / mm
GRID_TOP, GRID_SIZE, PITCH = 43.0, 145.0, 5.0
GRID_X = (PAGE_WIDTH_MM - GRID_SIZE) / 2
INK, MUTED = '#25342e', '#59655f'
CONTENT_WIDTH = 170.0

# These are print instructions, not new translations of the six subject names.
# Names are read from the actual public Hama card data below. Manufacturer
# product names stay exactly as spelled in public/palettes/hama.csv.
COPY = {
    'de': {
        'type': 'Bügelperlen-Vorlage',
        'grid': '29 × 29 Felder / 1 Midi-Platte / {beads} Perlen / {colors} Farben',
        'materials': 'Hama-Midi-Farben',
        'header': 'Symbol / Farbnummer / Farbe: EN',
        'count': 'Anzahl',
        'prefix': '01 = H01 im Editor. H ist nur ein Editorpräfix, kein Teil der Hama-Farbnummer.',
        'blank': 'Leere Felder bleiben ohne Perle. Weiße Felder mit Symbol brauchen weiße Perlen.',
        'colour': 'Bildschirm- und Druckfarben sind Näherungen. Farbnummern mit den eigenen Perlen prüfen.',
        'physical': 'Originalmotiv. Nicht gebaut oder bügelgetestet; keine offizielle Hama-Vorlage.',
        'print': 'US Letter: 100% / Tatsächliche Größe. "An Seite anpassen" ausschalten.',
        'scale': 'Beide Messlinien müssen 50 mm messen. 5-mm-Raster an der eigenen Midi-Platte prüfen.',
        'detail': 'Vorlagen und deutscher Editor',
    },
    'fr': {
        'type': 'Modèle de perles à repasser',
        'grid': '29 × 29 cases / 1 plaque Midi / {beads} perles / {colors} couleurs',
        'materials': 'Couleurs Hama Midi',
        'header': 'Symbole / référence / Couleur: EN',
        'count': 'Quantité',
        'prefix': '01 = H01 dans l’éditeur. H est un préfixe d’éditeur, pas un numéro de couleur Hama.',
        'blank': 'Cases vides : sans perle. Une case blanche avec un symbole demande une perle blanche.',
        'colour': 'Les couleurs à l’écran et sur papier sont approximatives. Vérifiez les numéros sur vos perles.',
        'physical': 'Motif original, non officiel Hama. Assemblage et repassage avec de vraies perles non testés.',
        'print': 'US Letter : 100% / Taille réelle. Désactivez "Ajuster à la page".',
        'scale': 'Les deux repères doivent mesurer 50 mm. Vérifiez la grille de 5 mm sur votre plaque Midi.',
        'detail': 'Modèles et éditeur en français',
    },
    'ja': {
        'type': 'アイロンビーズ図案',
        'grid': '29 × 29マス / ミディ用プレート1枚 / {beads}個 / {colors}色',
        'materials': 'Hama Midiの材料表',
        'header': '記号 / 色番号 / 商品色名: EN',
        'count': '個数',
        'prefix': '01はエディターではH01。Hは表示用の接頭辞で、Hamaの色番号には含まれません。',
        'blank': '空白には置きません。記号のある白いマスには白いビーズを置きます。',
        'colour': '画面と印刷の色は目安です。実物のビーズの色番号を確認してください。',
        'physical': 'オリジナルの非公式Hama図案です。実物制作・アイロン仕上げは未検証です。',
        'print': 'US Letter・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'scale': '縦横の確認線は各50 mm。1マス5 mmの間隔を実物のミディ用プレートで確認。',
        'detail': '図案と日本語エディター',
    },
}

NODE_LOADER = r"""
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');
// Node normally tries .json before an extension registered at runtime. The
// site's bundler resolves ./hama to hama.ts, alongside its hama.json manifest.
// Match that TypeScript resolution without changing files or the JSON loader.
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  if (request.startsWith('.') && !path.extname(request) && parent?.filename) {
    const candidate = path.resolve(path.dirname(parent.filename), request + '.ts');
    if (fs.existsSync(candidate)) request = candidate;
  }
  return resolveFilename.call(this, request, parent, ...rest);
};
require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
      resolveJsonModule: true, esModuleInterop: true}
  }).outputText, filename);
const {germanHamaPath, germanHamaPatterns} = require('./src/lib/patterns/german-hama.ts');
const {localizedHamaCopy, localizedHamaPatterns} = require('./src/lib/patterns/localized-hama.ts');
process.stdout.write(JSON.stringify({
  paths: {de: germanHamaPath, fr: localizedHamaCopy.fr.path, ja: localizedHamaCopy.ja.path},
  cards: {de: germanHamaPatterns.map(({id, name}) => ({id, name})),
    fr: localizedHamaPatterns('fr').map(({id, name}) => ({id, name})),
    ja: localizedHamaPatterns('ja').map(({id, name}) => ({id, name}))}
}));
"""


def digest(data):
    return sha256(data).hexdigest()


def close(a, b):
    return abs(a - b) < .003


def load_reviewed_variants(node):
    # run_name prevents the old generator's authoring main() from executing.
    reviewed = runpy.run_path(str(ROOT / 'scripts/build-hama-patterns.py'),
                             run_name='reviewed_hama_letter_source')
    variants = reviewed['load_variants']()
    assert len(variants) == 6
    result = subprocess.run([node, '-e', NODE_LOADER], cwd=ROOT,
                            capture_output=True, text=True)
    assert result.returncode == 0, f'Public localization loader failed: {result.stderr}'
    public_data = json.loads(result.stdout)
    assert public_data['paths'] == COLLECTION_PATHS, 'Public Hama page paths changed'
    selection = json.loads((ROOT / 'src/lib/patterns/german-hama.json').read_text())
    assert public_data['cards']['de'] == selection['patterns'], 'German card names diverged'
    ids = [variant['id'] for variant in variants]
    for locale in LOCALES:
        assert [card['id'] for card in public_data['cards'][locale]] == ids
        assert all(card['name'] and '\n' not in card['name']
                   for card in public_data['cards'][locale])

    for variant in variants:
        folder = ROOT / 'public/patterns-hama' / variant['id']
        project_path, pixels_path = folder / 'pattern.bead-pattern.json', folder / 'pixels.png'
        project = json.loads(project_path.read_text())
        assert project == variant['project'], 'Published Hama project differs from reviewed mapping'
        rgba = base64.b64decode(project['draft']['editedPattern']['data'], validate=True)
        assert rgba == variant['rgba']
        assert rgba[3::4] == variant['source'][3::4]
        for offset in range(0, len(rgba), 4):
            if not rgba[offset + 3]:
                assert rgba[offset:offset + 4] == variant['source'][offset:offset + 4]
        with Image.open(pixels_path) as image:
            assert image.mode == 'RGBA' and image.size == (29, 29)
            assert image.tobytes() == rgba, 'Published Hama PNG differs from project'
        with Image.open(folder / 'preview.png') as image:
            expected = reviewed['preview_image'](variant)
            assert image.mode == 'RGB' and image.size == (580, 580)
            assert image.tobytes() == expected.tobytes(), 'Published Hama preview differs'
        assert all((folder / f'pattern-{paper}.pdf').is_file() for paper in ('a4', 'letter'))
        assert 2 <= len(variant['materials']) <= 4
        variant['names'] = {locale: next(card['name'] for card in public_data['cards'][locale]
                                          if card['id'] == variant['id']) for locale in LOCALES}
        variant['sourceFiles'] = {
            str(path.relative_to(ROOT)): digest(path.read_bytes())
            for path in (project_path, pixels_path, folder / 'preview.png')}
    return variants


def all_characters(variants):
    values = ['FUSE BEAD PATTERNS', 'Hama Midi', 'US Letter', '50 mm',
              '0123456789 / × : - .', *COLLECTION_PATHS.values(), 'fusebeadpatterns.art']
    for locale in LOCALES:
        values.extend(value for key, value in COPY[locale].items() if key != 'grid')
        for variant in variants:
            values.extend((variant['names'][locale],
                           COPY[locale]['grid'].format(beads=variant['beads'],
                                                       colors=len(variant['materials']))))
    for variant in variants:
        values.extend(value for entry in variant['materials']
                      for value in (entry['code'], entry['name'], entry['symbol'], str(entry['count'])))
    # Fixed placeholders are never printed and need not inflate the subset.
    return ''.join(sorted({character for value in values for character in value
                           if not character.isspace()} | {' '}))


def register_font(variants):
    source = json.loads((FONT_DIR / 'source.json').read_text())
    assert digest(FONT_PATH.read_bytes()) == source['subsetSha256'], 'Hama Letter font lock changed'
    assert digest((FONT_DIR / 'OFL.txt').read_bytes()) == source['licenseSha256']
    characters = all_characters(variants)
    assert source['charactersSha256'] == digest(characters.encode()), 'Font character lock is stale'
    assert source['characterCount'] == len(characters)
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))
    face = pdfmetrics.getFont(FONT_NAME).face
    missing = {character for character in characters if ord(character) not in face.charToGlyph}
    assert not missing, f'Hama Letter font is missing characters: {sorted(missing)}'


def relative_path(variant, locale):
    return Path(f'patterns-{locale}-hama') / variant['id'] / 'pattern-letter.pdf'


def detail_url(variant, locale):
    return f'{SITE}{COLLECTION_PATHS[locale]}#{variant["id"]}'


def page_title(variant, locale):
    return f'{variant["names"][locale]} - Hama Midi - {COPY[locale]["type"]} (US Letter)'


def page_text(variant, locale):
    copy = COPY[locale]
    lines = [
        {'x': 18, 'y': 13, 'value': 'FUSE BEAD PATTERNS', 'size': 8, 'color': MUTED},
        {'x': 18, 'y': 24, 'value': variant['names'][locale], 'size': 22},
        {'x': 18, 'y': 31, 'value': f'Hama Midi / US Letter / {copy["type"]}', 'size': 8.4, 'color': MUTED},
        {'x': 18, 'y': 37, 'value': copy['grid'].format(beads=variant['beads'], colors=len(variant['materials'])), 'size': 8.3},
        {'x': 18, 'y': 194, 'value': copy['materials'], 'size': 10},
    ]
    for x in (18, 101):
        lines.append({'x': x, 'y': 200, 'value': copy['header'], 'size': 6.5, 'maxMm': 62, 'color': MUTED})
        lines.append({'x': x + 74, 'y': 200, 'value': copy['count'], 'size': 6.5,
                      'right': True, 'maxMm': 11, 'color': MUTED})
    for index, entry in enumerate(variant['materials']):
        x, y = 18 + index % 2 * 83, 207 + index // 2 * 8
        lines.extend((
            {'x': x + 6, 'y': y, 'value': entry['symbol'], 'size': 8, 'maxMm': 5},
            {'x': x + 13, 'y': y, 'value': entry['code'], 'size': 8, 'maxMm': 8},
            {'x': x + 23, 'y': y, 'value': entry['name'], 'size': 8, 'maxMm': 41},
            {'x': x + 74, 'y': y, 'value': str(entry['count']), 'size': 8,
             'right': True, 'maxMm': 10},
        ))
    for key, y, size in (('prefix', 224, 7.1), ('blank', 230, 7.2),
                         ('colour', 236, 7.1), ('physical', 242, 7.1),
                         ('print', 248, 8.0), ('scale', 263, 7.1)):
        lines.append({'x': 18, 'y': y, 'value': copy[key], 'size': size,
                      'maxMm': CONTENT_WIDTH, 'color': MUTED if key in ('prefix', 'colour', 'physical') else INK})
    lines.extend((
        {'x': 73, 'y': 257, 'value': '50 mm', 'size': 8, 'maxMm': 20},
        {'x': 194, 'y': 201, 'value': '50 mm', 'size': 7, 'right': True, 'maxMm': 15},
        {'x': 18, 'y': 270, 'value': copy['detail'], 'size': 6.8, 'maxMm': 73, 'color': '#176752'},
        {'x': PAGE_WIDTH_MM - 18, 'y': 270, 'value': 'fusebeadpatterns.art' + COLLECTION_PATHS[locale],
         'size': 6.5, 'right': True, 'maxMm': 97, 'color': '#176752'},
    ))
    return lines


def verify_text_metrics(variant, locale):
    face = pdfmetrics.getFont(FONT_NAME).face
    for entry in page_text(variant, locale):
        assert '\n' not in entry['value']
        missing = {character for character in entry['value'] if ord(character) not in face.charToGlyph}
        assert not missing, f'Missing print glyphs: {missing}'
        limit = entry.get('maxMm', PAGE_WIDTH_MM - 36)
        assert pdfmetrics.stringWidth(entry['value'], FONT_NAME, entry['size']) <= limit * mm, (
            variant['id'], locale, entry['value'], 'requires a reviewed layout, never shrink the grid')


def write_pdf(variant, locale, destination):
    assert not destination.exists(), f'Refusing to overwrite an existing PDF: {destination}'
    verify_text_metrics(variant, locale)
    destination.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(destination), pagesize=letter, invariant=1, pageCompression=1,
                        initialFontName=FONT_NAME, initialFontSize=8, lang=LANGUAGES[locale])
    pdf.setTitle(page_title(variant, locale))
    pdf.setAuthor('Fuse Bead Patterns team')
    pdf.setSubject(f'{locale}; Hama Midi; 29 x 29; 5 mm; US Letter; 100%')
    pdf.setViewerPreference('PrintScaling', 'None')

    def line(x1, y1, x2, y2, width=.15, color='#a2aaa6'):
        pdf.setLineWidth(width * mm)
        pdf.setStrokeColor(HexColor(color))
        pdf.line(x1 * mm, PAGE_HEIGHT - y1 * mm, x2 * mm, PAGE_HEIGHT - y2 * mm)

    by_rgb = {tuple(entry['color'][channel] for channel in ('r', 'g', 'b')): entry
              for entry in variant['materials']}
    for (x, y), rgb in variant['occupied'].items():
        pdf.setFillColorRGB(*(value / 255 for value in rgb))
        pdf.rect((GRID_X + x * PITCH) * mm, PAGE_HEIGHT - (GRID_TOP + (y + 1) * PITCH) * mm,
                 PITCH * mm, PITCH * mm, fill=1, stroke=0)
        luminance = sum(value * weight for value, weight in zip(rgb, (.299, .587, .114)))
        pdf.setFillColor(HexColor(INK if luminance > 150 else '#ffffff'))
        pdf.setFont(FONT_NAME, 7)
        pdf.drawCentredString((GRID_X + (x + .5) * PITCH) * mm,
                              PAGE_HEIGHT - (GRID_TOP + (y + .5) * PITCH) * mm - 2.2,
                              by_rgb[rgb]['symbol'])
    for index in range(30):
        width, color = (.23, '#65736b') if index % 5 == 0 or index == 29 else (.1, '#a2aaa6')
        line(GRID_X + index * PITCH, GRID_TOP, GRID_X + index * PITCH, GRID_TOP + GRID_SIZE, width, color)
        line(GRID_X, GRID_TOP + index * PITCH, GRID_X + GRID_SIZE, GRID_TOP + index * PITCH, width, color)
    pdf.setFont(FONT_NAME, 5.5)
    pdf.setFillColor(HexColor(MUTED))
    for index in range(29):
        pdf.drawCentredString((GRID_X + (index + .5) * PITCH) * mm,
                              PAGE_HEIGHT - (GRID_TOP - 1.5) * mm, str(index + 1))
        pdf.drawRightString((GRID_X - 2) * mm,
                            PAGE_HEIGHT - (GRID_TOP + (index + .5) * PITCH) * mm - 2,
                            str(index + 1))
    for x in (18, 101):
        line(x, 201.5, x + 74, 201.5)
    for index, entry in enumerate(variant['materials']):
        x, y = 18 + index % 2 * 83, 207 + index // 2 * 8
        pdf.setFillColorRGB(*(entry['color'][channel] / 255 for channel in ('r', 'g', 'b')))
        pdf.setStrokeColor(HexColor('#8c9590'))
        pdf.setLineWidth(.15 * mm)
        pdf.rect(x * mm, PAGE_HEIGHT - (y + 1) * mm, 4 * mm, 4 * mm, fill=1, stroke=1)
    # Independent horizontal and vertical references detect unequal axis scaling.
    line(18, 256, 68, 256, .4, INK)
    for x in (18, 68):
        line(x, 254.5, x, 257.5, .4, INK)
    line(194, 204, 194, 254, .4, INK)
    for y in (204, 254):
        line(192.5, y, 195.5, y, .4, INK)
    for entry in page_text(variant, locale):
        pdf.setFont(FONT_NAME, entry['size'])
        pdf.setFillColor(HexColor(entry.get('color', INK)))
        draw = pdf.drawRightString if entry.get('right') else pdf.drawString
        draw(entry['x'] * mm, PAGE_HEIGHT - entry['y'] * mm, entry['value'])
    pdf.linkURL(detail_url(variant, locale),
                (18 * mm, PAGE_HEIGHT - 272 * mm, (PAGE_WIDTH_MM - 18) * mm,
                 PAGE_HEIGHT - 266 * mm), relative=0)
    pdf.showPage()
    pdf.save()


def validate_pdf(variant, locale, path):
    # No candidate is regenerated here: this is also used by --check-only.
    reader = PdfReader(path)
    assert len(reader.pages) == 1, 'All six small-colour originals fit on one unscaled Letter page'
    page = reader.pages[0]
    assert tuple(float(value) for value in page.mediabox) == (0.0, 0.0, 612.0, 792.0)
    assert reader.metadata.title == page_title(variant, locale)
    assert reader.metadata.author == 'Fuse Bead Patterns team'
    assert reader.trailer['/Root']['/Lang'] == LANGUAGES[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    assert [annotation.get_object()['/A']['/URI'] for annotation in page['/Annots']] == [detail_url(variant, locale)]
    fonts = [font.get_object() for font in page['/Resources']['/Font'].values()]
    assert fonts and all(FONT_NAME in font['/BaseFont'] for font in fonts), 'Every used font must be the reviewed embedded font'
    for font in fonts:
        assert font['/FontDescriptor']['/FontFile2'].get_data(), 'Font is not embedded'
        assert font['/ToUnicode'].get_data(), 'Missing Unicode text mapping'

    with pdfplumber.open(path) as document:
        page = document.pages[0]
        assert close(page.width, PAGE_WIDTH) and close(page.height, PAGE_HEIGHT)
        content = page.extract_text()
        compact = re.sub(r'\s+', '', content)
        for entry in page_text(variant, locale):
            assert re.sub(r'\s+', '', entry['value']) in compact, (variant['id'], locale, entry['value'])
        assert not any(value in content for value in ('Perler', 'Artkal', '(cid:', '\ufffd', '\u25a0'))
        assert all(FONT_NAME in character['fontname'] for character in page.chars)
        assert all(character['x0'] >= 17 * mm and character['x1'] <= PAGE_WIDTH - 17 * mm
                   and character['top'] >= 8 * mm and character['bottom'] <= PAGE_HEIGHT - 7 * mm
                   for character in page.chars), 'Text escaped safe page margins'
        cells = {}
        for rectangle in page.rects:
            assert rectangle['x0'] >= 17 * mm and rectangle['x1'] <= PAGE_WIDTH - 17 * mm
            assert rectangle['top'] >= 8 * mm and rectangle['bottom'] <= PAGE_HEIGHT - 7 * mm
            if close(rectangle['width'], PITCH * mm) and close(rectangle['height'], PITCH * mm):
                x = (rectangle['x0'] / mm - GRID_X) / PITCH
                y = (rectangle['top'] / mm - GRID_TOP) / PITCH
                assert close(x, round(x)) and close(y, round(y))
                point = (round(x), round(y))
                assert point not in cells and 0 <= point[0] < 29 and 0 <= point[1] < 29
                assert rectangle['fill'] is True
                cells[point] = tuple(round(value * 255) for value in rectangle['non_stroking_color'])
        assert cells == variant['occupied'], 'PDF bead positions or RGB differ from reviewed Hama RGBA'
        symbols = {}
        for character in page.chars:
            x = (character['x0'] + character['x1']) / 2 / mm
            y = (character['top'] + character['bottom']) / 2 / mm
            if GRID_X < x < GRID_X + GRID_SIZE and GRID_TOP < y < GRID_TOP + GRID_SIZE:
                point = (int((x - GRID_X) // PITCH), int((y - GRID_TOP) // PITCH))
                assert point not in symbols
                symbols[point] = character['text']
        by_rgb = {tuple(entry['color'][channel] for channel in ('r', 'g', 'b')): entry['symbol']
                  for entry in variant['materials']}
        assert symbols == {point: by_rgb[rgb] for point, rgb in variant['occupied'].items()}
        assert Counter(symbols.values()) == {entry['symbol']: entry['count'] for entry in variant['materials']}
        assert Counter(cells.values()) == {tuple(entry['color'][channel] for channel in ('r', 'g', 'b')): entry['count']
                                          for entry in variant['materials']}
        for index in range(30):
            assert any(close(line['x0'], GRID_X * mm) and close(line['x1'], (GRID_X + GRID_SIZE) * mm)
                       and close(line['top'], (GRID_TOP + index * PITCH) * mm)
                       and close(line['height'], 0) for line in page.lines)
            assert any(close(line['x0'], (GRID_X + index * PITCH) * mm) and close(line['width'], 0)
                       and close(line['top'], GRID_TOP * mm) and close(line['bottom'], (GRID_TOP + GRID_SIZE) * mm)
                       for line in page.lines)
        assert any(close(line['x0'], 18 * mm) and close(line['x1'], 68 * mm)
                   and close(line['top'], 256 * mm) and close(line['height'], 0) for line in page.lines)
        assert any(close(line['x0'], 194 * mm) and close(line['top'], 204 * mm)
                   and close(line['bottom'], 254 * mm) and close(line['width'], 0) for line in page.lines)
        for line in page.lines:
            assert line['x0'] >= 17 * mm and line['x1'] <= PAGE_WIDTH - 17 * mm
            assert line['top'] >= 8 * mm and line['bottom'] <= PAGE_HEIGHT - 7 * mm
        for index, entry in enumerate(variant['materials']):
            x, y = 18 + index % 2 * 83, 207 + index // 2 * 8
            block = page.crop(((x - .5) * mm, (y - 4) * mm, (x + 75) * mm, (y + 2) * mm)).extract_text()
            assert all(value in block for value in (entry['symbol'], entry['code'], entry['name']))
            assert block.split()[-1] == str(entry['count']), 'Material quantity differs'
        # Explicit row/column labels are checked apart from the occupied cells.
        top_labels = [character for character in page.chars
                      if GRID_X < (character['x0'] + character['x1']) / 2 / mm < GRID_X + GRID_SIZE
                      and 38 < (character['top'] + character['bottom']) / 2 / mm < GRID_TOP]
        assert len(top_labels) == sum(len(str(index)) for index in range(1, 30))
        for index in range(29):
            box = ((GRID_X + index * PITCH) * mm, (GRID_TOP - 4) * mm,
                   (GRID_X + (index + 1) * PITCH) * mm, GRID_TOP * mm)
            assert page.crop(box).extract_text() == str(index + 1), 'Wrong numbered column'
            box = ((GRID_X - 5) * mm, (GRID_TOP + index * PITCH) * mm,
                   (GRID_X - .5) * mm, (GRID_TOP + (index + 1) * PITCH) * mm)
            assert page.crop(box).extract_text() == str(index + 1), 'Wrong numbered row'
    return {
        'id': variant['id'], 'locale': locale, 'language': LANGUAGES[locale],
        'localizedName': variant['names'][locale], 'paper': 'US Letter', 'pageCount': 1,
        'pagePoints': [612, 792], 'gridCells': [29, 29], 'pitchMm': 5, 'gridMm': [145, 145],
        'horizontalScaleMm': 50, 'verticalScaleMm': 50, 'printScaling': 'None',
        'beads': variant['beads'], 'materials': [{key: entry[key] for key in ('ref', 'code', 'name', 'symbol', 'count')}
                                                for entry in variant['materials']],
        'sourceRgbaSha256': digest(variant['source']), 'hamaRgbaSha256': digest(variant['rgba']),
        'sourceFiles': variant['sourceFiles'], 'collectionUrl': detail_url(variant, locale),
        'rgbaSymbolsMaterialsAndCalibrationChecked': True, 'fontEmbeddedWithToUnicode': True,
        'textAndVectorBoundsChecked': True, 'physicalAssemblyOrIroningVerified': False,
        'sha256': digest(path.read_bytes()),
    }


def protected_hashes():
    return {str(path.relative_to(ROOT)): digest(path.read_bytes())
            for folder in (ROOT / 'public', ROOT / 'scripts/fonts')
            for path in folder.rglob('*') if path.is_file()}


def assert_protected(before):
    assert all((ROOT / path).is_file() and digest((ROOT / path).read_bytes()) == expected
               for path, expected in before.items()), 'An existing public asset or font changed'


def make_report(results, before, variants, mode):
    return {
        'status': 'pass', 'mode': mode, 'variantCount': len(variants), 'pdfCount': len(results),
        'locales': list(LOCALES), 'preexistingPublicAssetsAndFontsUnchanged': True,
        'protectedExistingFiles': len(before), 'font': str(FONT_PATH.relative_to(ROOT)),
        'fontSha256': digest(FONT_PATH.read_bytes()), 'fontCharactersSha256': digest(all_characters(variants).encode()),
        'sourceFiles': {path: digest((ROOT / path).read_bytes()) for path in (
            'scripts/build-localized-hama-letter-pdfs.py', 'scripts/build-hama-patterns.py',
            'src/lib/patterns/hama.json', 'src/lib/patterns/german-hama.json',
            'src/lib/patterns/german-hama.ts', 'src/lib/patterns/localized-hama.ts',
            'src/lib/patterns/localized-content.ts', 'public/palettes/hama.csv')},
        'visualRenderingReviewStillRequired': True,
        'physicalAssemblyOrIroningVerified': False, 'results': results,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=shutil.which('node'), help='Node with this repository’s TypeScript dependency')
    parser.add_argument('--font-characters', action='store_true', help='Read-only JSON character inventory; no font or PDF creation')
    parser.add_argument('--check-only', action='store_true', help='Strictly read-only verification of the 18 existing Letter PDFs')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'public', help='Root containing patterns-{locale}-hama/; defaults to public/')
    parser.add_argument('--qa-report', type=Path, help='New JSON acceptance report; cannot be used in strictly read-only modes')
    args = parser.parse_args()
    if not args.node:
        parser.error('Node is required to read actual public translations; supply --node')
    if args.font_characters and args.check_only:
        parser.error('--font-characters and --check-only are separate read-only operations')
    if args.qa_report and (args.check_only or args.font_characters):
        parser.error('Read-only modes never write reports; capture their stdout outside this script if needed')
    if args.qa_report and args.qa_report.exists():
        parser.error('Refusing to overwrite an existing QA report')
    before = protected_hashes()
    variants = load_reviewed_variants(args.node)
    if args.font_characters:
        characters = all_characters(variants)
        assert_protected(before)
        print(json.dumps({'characters': characters, 'charactersSha256': digest(characters.encode()),
                          'characterCount': len(characters), 'fontFamily': 'Fuse Bead Hama Letter Japanese',
                          'fontPostScriptName': 'FuseBeadHamaLetterJapanese-Regular',
                          'fontPath': str(FONT_PATH.relative_to(ROOT)),
                          'locales': list(LOCALES), 'variantCount': len(variants)}, ensure_ascii=False))
        return
    register_font(variants)
    selected = [(variant, locale) for locale in LOCALES for variant in variants]
    output_dir = args.output_dir.resolve()
    destinations = [output_dir / relative_path(variant, locale) for variant, locale in selected]
    results = []
    if args.check_only:
        for (variant, locale), destination in zip(selected, destinations):
            assert destination.is_file(), f'Missing native Hama Letter PDF: {destination}'
            verify_text_metrics(variant, locale)
            results.append({**validate_pdf(variant, locale, destination), 'output': str(destination)})
    else:
        assert not any(path.exists() for path in destinations), 'An existing PDF must be checked, never overwritten'
        # Stage outside public so a failed 18-document batch cannot expose partial
        # or unverified downloads. Do not touch any existing output directory yet.
        with tempfile.TemporaryDirectory(prefix='fusebead-hama-letter-') as staging_name:
            staging = Path(staging_name)
            candidates = []
            for (variant, locale), destination in zip(selected, destinations):
                candidate = staging / relative_path(variant, locale)
                write_pdf(variant, locale, candidate)
                results.append({**validate_pdf(variant, locale, candidate), 'output': str(destination)})
                candidates.append(candidate)
            assert_protected(before)
            # Cross-filesystem staging is possible. Copy into an owned temporary
            # file beside the destination, then hard-link without replacement.
            published = []
            try:
                for candidate, destination in zip(candidates, destinations):
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    with tempfile.NamedTemporaryFile(prefix='.hama-letter-', suffix='.pdf',
                                                     dir=destination.parent, delete=False) as stream:
                        temporary = Path(stream.name)
                        stream.write(candidate.read_bytes())
                    try:
                        assert digest(temporary.read_bytes()) == digest(candidate.read_bytes())
                        os.link(temporary, destination)
                        published.append((destination, destination.stat().st_ino))
                    finally:
                        temporary.unlink()
            except BaseException:
                for destination, inode in published:
                    if destination.is_file() and destination.stat().st_ino == inode:
                        destination.unlink()
                raise
    assert_protected(before)
    report = make_report(results, before, variants, 'check-only' if args.check_only else 'generated')
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True, exist_ok=True)
        with args.qa_report.open('x') as stream:
            stream.write(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

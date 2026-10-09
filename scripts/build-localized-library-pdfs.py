"""Build missing translated library PDFs from reviewed pixels, never rematching colors.

Offline except --refresh-font, which fetches a pinned, checksum-verified Google
Fonts source into memory. Requires reportlab, Pillow, pypdf and pdfplumber.
Names and assembly notes are evaluated from the site's TypeScript, not duplicated.
Use --list to inspect the plan; writing requires --id or --all-missing.
"""
import argparse
import base64
from collections import Counter
import csv
from hashlib import sha256
import io
import json
import os
from pathlib import Path
import re
import shutil
import string
import subprocess
import tempfile
import urllib.request

import pdfplumber
from PIL import Image
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / 'scripts/fonts/localized-library-jp'
FONT_PATH = FONT_DIR / 'FuseBeadLibraryJapanese-Regular.ttf'
FONT_NAME = 'FuseBeadLibraryJapanese'
GRID_X, GRID_Y, PITCH = 32.5, 50.0, 5.0
INK, MUTED = '#25342e', '#59655f'
SITE = 'https://fusebeadpatterns.art'
LOCALES = ('de', 'fr', 'ja')

COPY = {
    'de': {
        'title': 'Bügelperlen-Vorlage', 'materials': 'Materialliste',
        'grid': '29 x 29 Felder / 1 Midi-Platte / {beads} Perlen / {colors} Farben',
        'motif': 'Motiv: {width} x {height} Felder. Leere Felder bleiben ohne Perlen.',
        'materials_note': 'Original-Farbnummern und englische Produktnamen von {brand}.',
        'header': 'Symbol / Farbnummer / Produktname', 'count': 'Anzahl',
        'print': 'A4 bei 100% / Tatsächliche Größe drucken; "An Seite anpassen" ausschalten.',
        'pitch': '5 mm Raster: Messlinie und Abstand an der eigenen Midi-Platte prüfen.',
        'physical': 'Nicht gebaut oder bügelgetestet. Bildschirm- und Druckfarben können abweichen.',
        'scale': 'Diese Linie muss auf Papier 50 mm lang sein.',
        'detail': 'Vorlagendetails und Bearbeitung', 'hama_detail': 'Hama-Vorlage im Editor öffnen',
        'extra': 'Weitere Material- und Verbindungshinweise auf Seite 2.',
        'notes': 'Verbindungen und Hinweise', 'continued': 'Materialliste und Hinweise',
        'fan': 'Unabhängige Fan-Vorlage; nicht offiziell.',
        'original': 'Originalmotiv von Fuse Bead Patterns.',
    },
    'fr': {
        'title': 'Modèle de perles à repasser', 'materials': 'Liste du matériel',
        'grid': '29 x 29 cases / 1 plaque Midi / {beads} perles / {colors} couleurs',
        'motif': 'Motif : {width} x {height} cases. Les cases vides restent sans perle.',
        'materials_note': 'Références et noms de produits anglais d’origine de {brand}.',
        'header': 'Symbole / référence / nom du produit', 'count': 'Quantité',
        'print': 'A4 à 100% / Taille réelle ; désactivez "Ajuster à la page".',
        'pitch': 'Grille de 5 mm : mesurez le repère et comparez avec votre plaque Midi.',
        'physical': 'Assemblage et repassage non testés. Les couleurs réelles peuvent différer.',
        'scale': 'Cette ligne doit mesurer 50 mm sur le papier.',
        'detail': 'Détails du modèle et modification', 'hama_detail': 'Ouvrir le modèle Hama dans l’éditeur',
        'extra': 'Matériel et précautions supplémentaires en page 2.',
        'notes': 'Jonctions et précautions', 'continued': 'Matériel et précautions',
        'fan': 'Modèle de fan indépendant ; non officiel.',
        'original': 'Motif original de Fuse Bead Patterns.',
    },
    'ja': {
        'title': 'アイロンビーズ図案', 'materials': '材料表',
        'grid': '29 × 29マス / ミディ用プレート1枚 / {beads}個 / {colors}色',
        'motif': '図柄 {width} × {height}マス。空白のマスにはビーズを置きません。',
        'materials_note': '{brand}の元の色番号と英語の商品色名です。',
        'header': '記号 / 色番号 / 商品色名', 'count': '個数',
        'print': 'A4・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'pitch': '1マスは5 mm。確認線と実物のミディ用プレートの間隔を測ってください。',
        'physical': '実物制作・アイロン仕上げは未検証です。画面や印刷の色は実物と異なります。',
        'scale': 'この線が紙の上で50 mmになることを確認してください。',
        'detail': '図案の詳細と編集', 'hama_detail': 'Hamaの図案をエディターで開く',
        'extra': '材料と接続部分の注意は2ページ目に続きます。',
        'notes': '接続部分の注意', 'continued': '材料表と制作上の注意',
        'fan': '非公式のファン図案です。', 'original': 'Fuse Bead Patternsのオリジナル図案です。',
    },
}

NODE_LOADER = r"""
const fs = require('fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
            resolveJsonModule: true, esModuleInterop: true }
    }).outputText, filename);
const { patterns } = require('./src/lib/patterns/catalog.ts');
const { getLocalizedPatternName, localizePatternNote } = require('./src/lib/patterns/localized-content.ts');
process.stdout.write(JSON.stringify(patterns.map(pattern => ({
    ...pattern,
    locales: Object.fromEntries(['de', 'fr', 'ja'].map(locale => [locale, {
        name: getLocalizedPatternName(pattern, locale),
        notes: pattern.notes.map(note => localizePatternNote(note, locale))
    }]))
}))));
"""


def digest(data):
    return sha256(data).hexdigest()


def source_path(href):
    assert href.startswith('/') and not href.startswith('//')
    path = (ROOT / 'public' / href.lstrip('/')).resolve()
    assert path.is_relative_to((ROOT / 'public').resolve()), href
    return path


def catalog(node):
    result = subprocess.run([node, '-e', NODE_LOADER], cwd=ROOT,
                            check=True, capture_output=True, text=True)
    patterns = json.loads(result.stdout)
    assert patterns and len({p['id'] for p in patterns}) == len(patterns)
    assert len({p['slug'] for p in patterns}) == len(patterns)
    for pattern in patterns:
        assert re.fullmatch(r'[a-z0-9-]+', pattern['id']), pattern['id']
        assert (pattern['gridWidth'], pattern['gridHeight']) == (29, 29)
        assert set(pattern['locales']) == set(LOCALES)
        assert all(len(p['notes']) == len(pattern['notes']) for p in pattern['locales'].values())
    return patterns


def retained_ids(locale):
    paths = {'de': 'german.json', 'fr': 'french-patterns.json', 'ja': 'japanese.json'}
    selection = json.loads((ROOT / 'src/lib/patterns' / paths[locale]).read_text())
    entries = selection['patterns'] if locale != 'ja' else [
        p for group in selection['groups'] for p in group['patterns']]
    return {p['id'] for p in entries}


def printable(value, locale):
    # A source note uses full-width punctuation in every language. Normalize only
    # punctuation unsupported by Helvetica; the name, coordinate and meaning stay.
    if locale != 'ja':
        value = value.replace('；', '; ').replace('–', '-').replace('—', '-')
        value.encode('cp1252')
    return value


def components(points):
    remaining, sizes = set(points), []
    while remaining:
        stack, size = [remaining.pop()], 0
        while stack:
            x, y = stack.pop()
            size += 1
            for xy in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if xy in remaining:
                    remaining.remove(xy)
                    stack.append(xy)
        sizes.append(size)
    return sorted(sizes, reverse=True)


def read_pixels(project_path, pixels_path, palette_id):
    project = json.loads(project_path.read_text())
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
    draft = project['draft']
    assert draft['selectedPaletteIds'] == [palette_id]
    assert (draft['boardId'], draft['boardWidth'], draft['boardHeight']) == ('midi', 1, 1)
    edited = draft['editedPattern']
    pixels = base64.b64decode(edited['data'], validate=True)
    assert (edited['width'], edited['height'], edited['byteLength'], len(pixels)) == (29, 29, 3364, 3364)
    with Image.open(pixels_path) as image:
        assert image.size == (29, 29) and image.convert('RGBA').tobytes() == pixels
    assert all(alpha in (0, 255) for alpha in pixels[3::4])
    occupied = {(i % 29, i // 29): tuple(pixels[4 * i:4 * i + 3])
                for i in range(841) if pixels[4 * i + 3]}
    counts = Counter(occupied.values())
    entries = {c['ref']: c for p in draft['activePalettes'] for c in p['entries']}
    materials = []
    for ref, entry in entries.items():
        rgb = tuple(entry['color'][channel] for channel in ('r', 'g', 'b'))
        if rgb in counts:
            assert entry['color']['a'] == 255 and entry['enabled']
            materials.append({'ref': ref, 'name': entry['name'], 'symbol': entry['symbol'],
                              'rgb': rgb, 'count': counts[rgb]})
    assert len(materials) == len(counts)
    assert len({c['symbol'] for c in materials}) == len(materials)
    assert all(len(c['symbol']) == 1 for c in materials)
    return {'pixels': pixels, 'occupied': occupied, 'materials': materials,
            'components': components(occupied),
            'sourceProject': str(project_path.relative_to(ROOT)),
            'sourcePixels': str(pixels_path.relative_to(ROOT)),
            'sourceProjectSha256': digest(project_path.read_bytes()),
            'sourcePixelsSha256': digest(pixels_path.read_bytes()), 'rgbaSha256': digest(pixels)}


def load_pattern(pattern, brand):
    source = read_pixels(source_path(pattern['assets']['project']),
                         source_path(pattern['assets']['pixels']), 'perler')
    assert len(source['occupied']) == pattern['beads']
    source_by_ref = {c['ref']: c for c in source['materials']}
    assert set(source_by_ref) == {c['ref'] for c in pattern['palette']}
    for color in pattern['palette']:
        entry = source_by_ref[color['ref']]
        assert all(entry[key] == color[key] for key in ('symbol', 'name', 'count'))
        assert entry['rgb'] == tuple(bytes.fromhex(color['hex'][1:]))
    source['materials'] = [source_by_ref[c['ref']] for c in pattern['palette']]
    assert len(source['materials']) == pattern['colorCount']
    if brand == 'hama':
        selection = json.loads((ROOT / 'src/lib/patterns/hama.json').read_text())['patterns']
        mapping = next(p['colorMap'] for p in selection if p['id'] == pattern['id'])
        folder = ROOT / 'public/patterns-hama' / pattern['id']
        variant = read_pixels(folder / 'pattern.bead-pattern.json', folder / 'pixels.png', 'hama')
        assert set(variant['occupied']) == set(source['occupied'])
        assert variant['pixels'][3::4] == source['pixels'][3::4]
        assert set(mapping) == set(source_by_ref)
        with (ROOT / 'public/palettes/hama.csv').open(newline='') as file:
            official = {row[0]: row for row in csv.reader(file)}
        target_entries = {c['ref']: c for c in variant['materials']}
        assert set(target_entries) == set(mapping.values())
        for ref, entry in target_entries.items():
            row = official[ref]
            assert [entry['ref'], entry['name'], entry['symbol']] == row[:3]
            assert entry['rgb'] == tuple(map(int, row[3:6]))
        source_rgb = {entry['rgb']: entry for entry in source['materials']}
        for point, rgb in source['occupied'].items():
            assert variant['occupied'][point] == target_entries[mapping[source_rgb[rgb]['ref']]]['rgb']
        source = variant
    assert len(source['materials']) <= 15, 'Use a separate material page for a larger future palette'
    split_note = next((note for note in pattern['notes'] if 'separate parts' in note), None)
    if split_note:
        expected_parts = int(re.search(r'(\d+) separate parts', split_note).group(1)) if re.search(r'(\d+) separate parts', split_note) else 3
        assert len(source['components']) == expected_parts
    else:
        assert len(source['components']) == 1, f'Missing reviewed split note: {pattern["id"]}'
    return {**pattern, **source, 'brand': brand,
            'beads': len(source['occupied']), 'colorCount': len(source['materials'])}


def plan(patterns, locales, brands, ids=None):
    hama_ids = {p['id'] for p in json.loads((ROOT / 'src/lib/patterns/hama.json').read_text())['patterns']}
    retained = {locale: retained_ids(locale) for locale in locales}
    items = []
    for pattern in patterns:
        if ids and pattern['id'] not in ids:
            continue
        for locale in locales:
            for brand in brands:
                if brand == 'hama' and (locale != 'ja' or pattern['id'] not in hama_ids):
                    continue
                if brand == 'perler' and pattern['id'] in retained[locale]:
                    continue
                folder = f'patterns-{locale}' + ('-hama' if brand == 'hama' else '')
                items.append({'pattern': pattern, 'locale': locale, 'brand': brand,
                              'relative': Path(folder) / pattern['id'] / 'pattern.pdf'})
    if ids:
        assert ids <= {p['id'] for p in patterns}, 'Unknown pattern id'
    return items


def font_characters(patterns):
    text = string.printable + '×·個マス行列図柄1234567890'
    text += ''.join(COPY['ja'].values())
    for pattern in patterns:
        text += pattern['locales']['ja']['name'] + ''.join(pattern['locales']['ja']['notes'])
        text += ''.join(p['name'] + p['symbol'] + p['ref'] for p in pattern['palette'])
    return ''.join(sorted(set(text)))


def refresh_font(patterns):
    from fontTools import subset, __version__ as fonttools_version
    from fontTools.ttLib import TTFont as FontToolsFont
    from fontTools.varLib.instancer import instantiateVariableFont

    # The upstream lock is reused without rewriting the existing source/font.
    source = json.loads((ROOT / 'scripts/fonts/noto-sans-jp/source.json').read_text())
    font_bytes = urllib.request.urlopen(source['fontUrl'], timeout=30).read()
    license_bytes = urllib.request.urlopen(source['licenseUrl'], timeout=30).read()
    assert digest(font_bytes) == source['fontSha256']
    assert digest(license_bytes) == source['licenseSha256']
    characters = font_characters(patterns)
    font = FontToolsFont(io.BytesIO(font_bytes), recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': 400}, inplace=True)
    options = subset.Options()
    options.name_IDs, options.name_legacy, options.name_languages = ['*'], True, ['*']
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=characters)
    subsetter.subset(font)
    names = {1: 'Fuse Bead Library Japanese', 2: 'Regular',
             3: 'FuseBeadLibraryJapanese-Regular-1', 4: 'Fuse Bead Library Japanese Regular',
             6: 'FuseBeadLibraryJapanese-Regular', 16: 'Fuse Bead Library Japanese', 17: 'Regular'}
    for name in font['name'].names:
        if name.nameID in names:
            name.string = names[name.nameID].encode(name.getEncoding())
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    font.save(FONT_PATH)
    (FONT_DIR / 'OFL.txt').write_bytes(license_bytes)
    (FONT_DIR / 'source.json').write_text(json.dumps({
        **source, 'derivativeFamily': 'Fuse Bead Library Japanese',
        'subsetPurpose': 'Whole-library DE/FR/JA rollout: Japanese names, fixed copy, assembly notes, ASCII manufacturer color names/codes',
        'subsetSha256': digest(FONT_PATH.read_bytes()), 'charactersSha256': digest(characters.encode()),
        'characterCount': len(characters), 'catalogCount': len(patterns), 'fonttoolsVersion': fonttools_version,
    }, ensure_ascii=False, indent=2) + '\n')


def register_font(patterns):
    source = json.loads((FONT_DIR / 'source.json').read_text())
    assert digest(FONT_PATH.read_bytes()) == source['subsetSha256'], 'Japanese font lock changed'
    assert digest((FONT_DIR / 'OFL.txt').read_bytes()) == source['licenseSha256']
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))
    face = pdfmetrics.getFont(FONT_NAME).face
    missing = {c for c in font_characters(patterns) if ord(c) not in face.charToGlyph and not c.isspace()}
    assert not missing, f'Japanese font needs a reviewed refresh: {missing}'


def font_name(locale, bold=False):
    return FONT_NAME if locale == 'ja' else ('Helvetica-Bold' if bold else 'Helvetica')


def wrapped(text, locale, size, width_mm, bold=False):
    text = printable(text, locale)
    font = font_name(locale, bold)
    # Prefer word boundaries for Latin copy; use character boundaries for Japanese.
    tokens = list(text) if locale == 'ja' else re.findall(r'\S+\s*', text)
    lines, current = [], ''
    for token in tokens:
        trial = current + token
        if pdfmetrics.stringWidth(trial.rstrip(), font, size) <= width_mm * mm:
            current = trial
            continue
        if current:
            lines.append(current.rstrip())
            current = ''
        if pdfmetrics.stringWidth(token.rstrip(), font, size) <= width_mm * mm:
            current = token.lstrip()
            continue
        # A long word/URL is split safely without scaling it into illegibility.
        for character in token:
            if current and pdfmetrics.stringWidth(current + character, font, size) > width_mm * mm:
                lines.append(current)
                current = ''
            current += character
    if current:
        lines.append(current.rstrip())
    return lines


def critical_notes(pattern, locale):
    return [printable(pattern['locales'][locale]['notes'][i], locale)
            for i, note in enumerate(pattern['notes'])
            if note.startswith('Thin one-bead connections') or 'separate parts' in note]


def detail_url(pattern, locale):
    if pattern['brand'] == 'hama':
        return f'{SITE}/{locale}/editor?pattern={pattern["id"]}-hama'
    return f'{SITE}/{locale}/patterns/{pattern["slug"]}'


def build(pattern, locale, destination):
    copy, brand = COPY[locale], pattern['brand'].capitalize()
    title = printable(pattern['locales'][locale]['name'], locale)
    assert not destination.exists(), f'Refusing to overwrite an existing download: {destination}'
    destination.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(destination), pagesize=A4, invariant=1,
                        pageCompression=1, lang=f'{locale}-' + {'de': 'DE', 'fr': 'FR', 'ja': 'JP'}[locale])
    pdf.setTitle(f'{title} - {brand} Midi - {copy["title"]}')
    pdf.setAuthor('Fuse Bead Patterns team')
    pdf.setSubject(f'{locale}; {brand} Midi; 29 x 29; 5 mm; A4; 100%')
    pdf.setViewerPreference('PrintScaling', 'None')
    expected_text = []

    def text(x, y, value, size=8, color=INK, bold=False, right=False, max_mm=None):
        value = printable(value, locale)
        if locale == 'ja':
            missing = {c for c in value if ord(c) not in pdfmetrics.getFont(FONT_NAME).face.charToGlyph}
            assert not missing, f'Missing Japanese glyphs: {missing}'
        available = max_mm if max_mm is not None else (x - 18 if right else 192 - x)
        assert pdfmetrics.stringWidth(value, font_name(locale, bold), size) <= available * mm, (pattern['id'], value)
        pdf.setFont(font_name(locale, bold), size)
        pdf.setFillColor(HexColor(color))
        getattr(pdf, 'drawRightString' if right else 'drawString')(x * mm, A4[1] - y * mm, value)
        expected_text.append(value)

    def line(x1, y1, x2, y2, width=.15, color='#a2aaa6'):
        pdf.setLineWidth(width * mm)
        pdf.setStrokeColor(HexColor(color))
        pdf.line(x1 * mm, A4[1] - y1 * mm, x2 * mm, A4[1] - y2 * mm)

    def footer():
        text(18, 267, copy['print'], 7.4, bold=True)
        text(18, 271.5, copy['pitch'], 7.0, MUTED)
        text(18, 275.5, copy['physical'], 6.8, MUTED)
        line(18, 280.5, 68, 280.5, .4, INK)
        line(18, 279, 18, 282, .4, INK)
        line(68, 279, 68, 282, .4, INK)
        text(73, 281.5, copy['scale'], 6.8, max_mm=119)
        label = copy['hama_detail'] if pattern['brand'] == 'hama' else copy['detail']
        text(18, 289, label, 7.0, '#176752')
        pdf.linkURL(detail_url(pattern, locale),
                    (18 * mm, A4[1] - 291 * mm, 100 * mm, A4[1] - 284 * mm), relative=0)
        text(192, 289, copy['fan'] if pattern['source'] else copy['original'], 6.6, MUTED, right=True, max_mm=90)

    text(18, 13.5, 'FUSE BEAD PATTERNS', 8, MUTED)
    title_lines = wrapped(title, locale, 18, 174, bold=True)
    assert len(title_lines) <= 2, f'Title requires a reviewed layout: {title}'
    for i, value in enumerate(title_lines):
        text(18, 24 + i * 7, value, 18, bold=True)
    text(18, 38.5, f'{copy["title"]} / {brand} Midi', 8, MUTED)
    text(18, 43, copy['grid'].format(beads=pattern['beads'], colors=pattern['colorCount']), 8.2)
    text(18, 47, copy['motif'].format(width=pattern['motifWidth'], height=pattern['motifHeight']), 7.4, MUTED)

    colors = {entry['rgb']: entry for entry in pattern['materials']}
    for (x, y), rgb in pattern['occupied'].items():
        pdf.setFillColorRGB(*(v / 255 for v in rgb))
        pdf.rect((GRID_X + x * PITCH) * mm, A4[1] - (GRID_Y + (y + 1) * PITCH) * mm,
                 PITCH * mm, PITCH * mm, stroke=0, fill=1)
        fg = INK if sum(v * k for v, k in zip(rgb, (.299, .587, .114))) > 150 else '#ffffff'
        pdf.setFillColor(HexColor(fg))
        pdf.setFont(font_name(locale), 6.5)
        pdf.drawCentredString((GRID_X + (x + .5) * PITCH) * mm,
                              A4[1] - (GRID_Y + (y + .5) * PITCH) * mm - 2.1, colors[rgb]['symbol'])
    for i in range(30):
        width, color = (.23, '#65736b') if i % 5 == 0 or i == 29 else (.1, '#a2aaa6')
        line(GRID_X + i * PITCH, GRID_Y, GRID_X + i * PITCH, GRID_Y + 145, width, color)
        line(GRID_X, GRID_Y + i * PITCH, GRID_X + 145, GRID_Y + i * PITCH, width, color)
    for i in range(29):
        pdf.setFont(font_name(locale), 5.5)
        pdf.setFillColor(HexColor(MUTED))
        pdf.drawCentredString((GRID_X + (i + .5) * PITCH) * mm, A4[1] - (GRID_Y - 1.5) * mm, str(i + 1))
        pdf.drawRightString((GRID_X - 2) * mm,
                            A4[1] - (GRID_Y + (i + .5) * PITCH) * mm - 2, str(i + 1))

    text(18, 202, copy['materials'], 10, bold=True)
    text(65, 202, copy['materials_note'].format(brand=brand), 6.6, MUTED, max_mm=127)
    material_blocks = []
    for x in (18, 109):
        text(x, 207, copy['header'], 6.6, MUTED, max_mm=69)
        text(x + 82, 207, copy['count'], 6.6, MUTED, right=True, max_mm=12)
        line(x, 208.5, x + 82, 208.5)
    for i, entry in enumerate(pattern['materials']):
        x, y = 18 + i % 2 * 91, 213 + i // 2 * 5.8
        pdf.setFillColorRGB(*(v / 255 for v in entry['rgb']))
        pdf.setStrokeColor(HexColor('#8c9590'))
        pdf.rect(x * mm, A4[1] - (y + .5) * mm, 3 * mm, 3 * mm, fill=1, stroke=1)
        text(x + 5, y, entry['symbol'], 7.3, max_mm=5)
        text(x + 11, y, entry['ref'], 7.0, max_mm=23)
        text(x + 35, y, entry['name'], 7.0, max_mm=37)
        text(x + 82, y, str(entry['count']), 7.3, right=True, max_mm=9)
        material_blocks.append({'page': 0, 'boxMm': [x, y - 3.3, x + 83, y + 1.4], **entry})

    note_lines = [line for note in critical_notes(pattern, locale) for line in wrapped(note, locale, 7.1, 174)]
    note_top = max(224, 218 + (len(pattern['materials']) - 1) // 2 * 5.8)
    fits_notes = note_top + max(0, len(note_lines) - 1) * 3.7 <= 261
    if fits_notes:
        for i, value in enumerate(note_lines):
            text(18, note_top + i * 3.7, value, 7.1)
    else:
        text(18, 259, copy['extra'], 7.2, bold=True)
    footer()
    pdf.showPage()
    if not fits_notes:
        text(18, 17, copy['continued'], 15, bold=True)
        for i, value in enumerate(wrapped(title, locale, 13, 174)):
            text(18, 25 + i * 6, value, 13)
        text(18, 42, copy['materials_note'].format(brand=brand), 8.5, MUTED)
        text(18, 49, copy['header'], 8.5, MUTED)
        text(192, 49, copy['count'], 8.5, MUTED, right=True)
        for i, entry in enumerate(pattern['materials']):
            y = 57 + i * 7
            text(18, y, f'{entry["symbol"]} / {entry["ref"]} / {entry["name"]}', 9)
            text(192, y, str(entry['count']), 9, right=True)
        y = 65 + len(pattern['materials']) * 7
        text(18, y, copy['notes'], 11, bold=True)
        y += 7
        for note in critical_notes(pattern, locale):
            for value in wrapped(note, locale, 9, 174):
                assert y < 258, 'Additional note page needs a reviewed page break'
                text(18, y, value, 9)
                y += 5
            y += 4
        footer()
        pdf.showPage()
    pdf.save()
    return {'expectedText': expected_text, 'materialBlocks': material_blocks,
            'pageCount': 1 if fits_notes else 2, 'noteLines': note_lines}


def close(a, b):
    return abs(a - b) < .003


def validate(pattern, locale, path, layout):
    reader = PdfReader(path)
    assert len(reader.pages) == layout['pageCount']
    assert reader.trailer['/Root']['/Lang'] == f'{locale}-' + {'de': 'DE', 'fr': 'FR', 'ja': 'JP'}[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    assert [annotation.get_object()['/A']['/URI'] for annotation in reader.pages[0]['/Annots']] == [detail_url(pattern, locale)]
    if locale == 'ja':
        fonts = [font.get_object() for font in reader.pages[0]['/Resources']['/Font'].values()
                 if 'FuseBeadLibraryJapanese' in font.get_object()['/BaseFont']]
        assert fonts and all(font['/FontDescriptor']['/FontFile2'].get_data() and font['/ToUnicode'].get_data() for font in fonts)
    with pdfplumber.open(path) as pdf:
        extracted = '\n'.join(page.extract_text() for page in pdf.pages)
        compact = re.sub(r'\s+', '', extracted)
        for value in layout['expectedText']:
            assert re.sub(r'\s+', '', value) in compact, (pattern['id'], locale, value)
        for page in pdf.pages:
            assert close(page.width, 210 * mm) and close(page.height, 297 * mm)
            assert all(c['x0'] >= 17 * mm and c['x1'] <= 193 * mm and
                       c['top'] >= 8 * mm and c['bottom'] <= 292 * mm for c in page.chars), 'Text outside page margins'
        page = pdf.pages[0]
        cells = {}
        for rect in page.rects:
            if close(rect['width'], 5 * mm) and close(rect['height'], 5 * mm):
                x, y = (rect['x0'] / mm - GRID_X) / PITCH, (rect['top'] / mm - GRID_Y) / PITCH
                assert close(x, round(x)) and close(y, round(y))
                point = (round(x), round(y))
                assert point not in cells and 0 <= point[0] < 29 and 0 <= point[1] < 29
                cells[point] = tuple(round(c * 255) for c in rect['non_stroking_color'])
        assert cells == pattern['occupied']
        symbols = {}
        for character in page.chars:
            x = (character['x0'] + character['x1']) / 2 / mm
            y = (character['top'] + character['bottom']) / 2 / mm
            if GRID_X < x < GRID_X + 145 and GRID_Y < y < GRID_Y + 145:
                point = (int((x - GRID_X) // PITCH), int((y - GRID_Y) // PITCH))
                assert point not in symbols
                symbols[point] = character['text']
        symbols_by_rgb = {entry['rgb']: entry['symbol'] for entry in pattern['materials']}
        assert symbols == {point: symbols_by_rgb[rgb] for point, rgb in pattern['occupied'].items()}
        for i in range(30):
            assert any(close(line['x0'], GRID_X * mm) and close(line['x1'], (GRID_X + 145) * mm) and
                       close(line['top'], (GRID_Y + i * PITCH) * mm) and close(line['height'], 0) for line in page.lines)
            assert any(close(line['x0'], (GRID_X + i * PITCH) * mm) and close(line['top'], GRID_Y * mm) and
                       close(line['bottom'], (GRID_Y + 145) * mm) and close(line['width'], 0) for line in page.lines)
        assert any(close(line['x0'], 18 * mm) and close(line['x1'], 68 * mm) and
                   close(line['top'], 280.5 * mm) and close(line['height'], 0) for line in page.lines)
        for entry in layout['materialBlocks']:
            block = pdf.pages[entry['page']].crop(tuple(v * mm for v in entry['boxMm'])).extract_text()
            assert all(value in block for value in (entry['symbol'], entry['ref'], entry['name'])), (pattern['id'], block)
            assert re.search(rf'\b{entry["count"]}\b', block)
        assert Counter(cells.values()) == {entry['rgb']: entry['count'] for entry in pattern['materials']}
    return {'id': pattern['id'], 'locale': locale, 'brand': pattern['brand'],
            'localizedName': pattern['locales'][locale]['name'], 'pageCount': layout['pageCount'],
            'beads': pattern['beads'], 'colors': pattern['colorCount'],
            'sourceProject': pattern['sourceProject'], 'sourcePixels': pattern['sourcePixels'],
            'sourceProjectSha256': pattern['sourceProjectSha256'], 'sourcePixelsSha256': pattern['sourcePixelsSha256'],
            'rgbaSha256': pattern['rgbaSha256'], 'fourConnectedComponentSizes': pattern['components'],
            'gridSize': [29, 29], 'gridPitchMm': 5, 'scaleLineMm': 50,
            'pixelRgbCoordinatesExact': True, 'symbolsCountsAndMaterialReferencesExact': True,
            'assemblyNotesRetained': True, 'printScaling': 'None',
            'allTextInsideMargins': True, 'sha256': digest(path.read_bytes()),
            'physicalAssemblyOrIroningVerified': False}


def protected_hashes():
    folders = [ROOT / 'public', ROOT / 'scripts/fonts/noto-sans-jp']
    return {str(p.relative_to(ROOT)): digest(p.read_bytes())
            for folder in folders for p in folder.rglob('*') if p.is_file()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=shutil.which('node'))
    parser.add_argument('--locales', nargs='+', choices=LOCALES, default=list(LOCALES))
    parser.add_argument('--brand', choices=['perler', 'hama', 'all'], default='all')
    parser.add_argument('--id', action='append', help='Exact catalog id; repeat for explicit sample selection')
    parser.add_argument('--all-missing', action='store_true', help='Explicitly select all missing PDFs, not retained legacy ones')
    parser.add_argument('--list', action='store_true', help='Read-only plan; no output files')
    parser.add_argument('--output-dir', type=Path, help='Required root containing patterns-{locale}/...; use a task temp root for samples')
    parser.add_argument('--refresh-font', action='store_true', help='Create the NEW Japanese font subset from the pinned official upstream source')
    parser.add_argument('--check-only', action='store_true', help='Verify selected existing new downloads without publishing or replacing files')
    parser.add_argument('--qa-report', type=Path)
    args = parser.parse_args()
    if not args.node:
        parser.error('Node is required to evaluate the site translation source; supply --node')
    patterns = catalog(args.node)
    brands = ['perler', 'hama'] if args.brand == 'all' else [args.brand]
    selected = plan(patterns, args.locales, brands, set(args.id) if args.id else None)
    if args.list:
        print(json.dumps({'catalogCount': len(patterns), 'missing': dict(Counter(
            f'{item["locale"]}-{item["brand"]}' for item in selected)),
            'items': [str(item['relative']) for item in selected]}, ensure_ascii=False, indent=2))
        return
    if not args.output_dir or not (args.id or args.all_missing):
        parser.error('Writing requires --output-dir and either explicit --id or --all-missing')
    if args.check_only and args.refresh_font:
        parser.error('--check-only cannot refresh a font')
    before = protected_hashes()
    if args.refresh_font:
        refresh_font(patterns)
    if any(item['locale'] == 'ja' for item in selected):
        register_font(patterns)
    results, existing, cache = [], [], {}
    for item in selected:
        destination = args.output_dir.resolve() / item['relative']
        if args.check_only:
            assert destination.is_file(), f'Missing PDF for acceptance: {destination}'
        key = (item['pattern']['id'], item['brand'])
        if key not in cache:
            cache[key] = load_pattern(item['pattern'], item['brand'])
        pattern = cache[key]
        destination.parent.mkdir(parents=True, exist_ok=True)
        # Validate in an owned, automatically cleaned staging directory. A failed
        # glyph, source or geometry check must never leave a downloadable half-batch
        # file that a later run would silently regard as finished.
        with tempfile.TemporaryDirectory(prefix='.localized-pdf-staging-', dir=destination.parent) as staging:
            candidate = Path(staging) / 'pattern.pdf'
            layout = build(pattern, item['locale'], candidate)
            result = validate(pattern, item['locale'], candidate, layout)
            if destination.exists():
                assert digest(destination.read_bytes()) == result['sha256'], f'Existing new PDF differs from current reviewed source: {destination}'
                result = validate(pattern, item['locale'], destination, layout)
                existing.append(str(destination))
                status = 'existing-verified'
            else:
                # Same filesystem, atomic and no overwrite even if another process
                # creates this path between the existence check and publication.
                os.link(candidate, destination)
                status = 'generated'
        results.append({**result, 'output': str(destination), 'status': status})
    after = protected_hashes()
    assert all(after.get(path) == value for path, value in before.items()), 'A preexisting public asset or old font changed'
    report = {'catalogCount': len(patterns), 'generatedCount': sum(r['status'] == 'generated' for r in results),
              'verifiedCount': len(results), 'retainedExistingVerified': existing,
              'protectedExistingFiles': len(before), 'preexistingPublicAssetsAndLegacyFontUnchanged': True,
              'font': str(FONT_PATH.relative_to(ROOT)) if any(r['locale'] == 'ja' for r in results) else None,
              'generatorAndTranslationSources': {path: digest((ROOT / path).read_bytes()) for path in (
                  'scripts/build-localized-library-pdfs.py', 'src/lib/patterns/catalog.ts',
                  'src/lib/patterns/localized-content.ts', 'src/lib/patterns/pokemon-locale-names.json',
                  'src/lib/patterns/hama.json', 'public/palettes/hama.csv')},
              'results': results, 'visualRenderingReviewStillRequired': True}
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True, exist_ok=True)
        args.qa_report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items() if key != 'results'}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

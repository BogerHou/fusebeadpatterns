"""Eight one-page Black Cat charts from the reviewed independent symbol grid.

Reuse the existing 5 mm Midi PDF renderer and its per-cell validation. Generate
only into a separate staging directory, never directly into public. No old font or
download is refreshed. --font-characters and --check-only are read-only.
"""
import argparse
import base64
from collections import Counter
import csv
from hashlib import sha256
import importlib.util
import json
from pathlib import Path

from PIL import Image
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
ID = 'original-black-cat'
ROWS_HASH = 'fc6a0bd7a4d4f67ea7c5b2cec7afc9e813d74db901b64a3d1b0e4afb2aa3822f'
RGBA_HASH = 'fbf706e0c20bde55d98825408c5f2e1b94bc4be7a8ab298c1d8b248b99accb2d'
FONT_DIR = ROOT / 'scripts/fonts/black-cat-labels'
FONT_NAME = 'FuseBeadBlackCatLabels'
FONT_PATH = FONT_DIR / (FONT_NAME + '-Regular.ttf')
COPY = {
    'en': {
        'name': 'Black Cat', 'type': 'Perler Bead Pattern',
        'grid': '29 x 29 grid / 16 x 16 motif / 181 beads / 2 colors',
        'materials': 'Perler Midi materials', 'header': 'Symbol / Perler ref / Color name: EN', 'count': 'Count',
        'blank': 'Empty cells need no beads. B means Black; Y means ordinary Yellow.',
        'color': 'Screen and print colors are approximate. Check color refs against your beads.',
        'physical': 'Original digital design. Physical assembly and ironing have not been tested.',
        'backing': 'Use one 29 x 29 Midi pegboard. Follow the bead manufacturer’s ironing instructions.',
        'print': '{paper}: print at 100% / Actual size. Turn off "Fit to page".',
        'scale': 'Both lines must measure 50 mm. Check the 5 mm pitch against your Midi board.',
        'detail': 'Pattern and editor',
    },
    'de': {
        'name': 'Schwarze Katze', 'type': 'Bügelperlen-Vorlage',
        'grid': '29 x 29 Raster / 16 x 16 Motiv / 181 Perlen / 2 Farben',
        'materials': 'Materialliste: Perler Midi', 'header': 'Symbol / Farbnummer / Farbe: EN', 'count': 'Anzahl',
        'blank': 'Leere Felder bleiben ohne Perle. B: Black; Y: normales Yellow.',
        'color': 'Bildschirm- und Druckfarben sind Näherungen. Farbnummern an den eigenen Perlen prüfen.',
        'physical': 'Originales digitales Motiv. Bau und Bügeln sind ungeprüft.',
        'backing': 'Eine Midi-Platte mit 29 x 29 Stiften verwenden. Nach der Herstelleranleitung bügeln.',
        'print': '{paper}: 100% / Tatsächliche Größe. "An Seite anpassen" ausschalten.',
        'scale': 'Beide Messlinien müssen 50 mm messen. Das 5-mm-Raster an der Midi-Platte prüfen.',
        'detail': 'Vorlage und Editor',
    },
    'fr': {
        'name': 'Chat noir', 'type': 'Modèle de perles à repasser',
        'grid': 'Grille 29 x 29 / motif 16 x 16 / 181 perles / 2 couleurs',
        'materials': 'Matériel : Perler Midi', 'header': 'Symbole / référence / Couleur: EN', 'count': 'Quantité',
        'blank': 'Cases vides : sans perle. B : Black ; Y : Yellow ordinaire.',
        'color': 'Les couleurs à l’écran et sur papier sont approximatives. Vérifiez les références sur vos perles.',
        'physical': 'Modèle numérique original. Assemblage et repassage non testés.',
        'backing': 'Utilisez une plaque Midi de 29 x 29 picots. Suivez les consignes de repassage du fabricant.',
        'print': '{paper} : 100% / Taille réelle. Désactivez "Ajuster à la page".',
        'scale': 'Les deux repères doivent mesurer 50 mm. Vérifiez la grille de 5 mm sur votre plaque Midi.',
        'detail': 'Modèle et éditeur',
    },
    'ja': {
        'name': '黒猫', 'type': 'アイロンビーズ図案',
        'grid': '29 x 29マス / 図柄16 x 16マス / 181個 / 2色',
        'materials': 'Perler Midiの材料表', 'header': '記号 / 色番号 / 商品色名: EN', 'count': '個数',
        'blank': '空白には置きません。BはBlack、Yは通常のYellowです。',
        'color': '画面と印刷の色は目安です。実物のビーズの色番号を確認してください。',
        'physical': 'オリジナルのデジタル図案。実物制作とアイロンでの接合は未検証です。',
        'backing': '29 x 29マスのミディ用プレート1枚を使い、メーカーの説明に従ってアイロンをかけます。',
        'print': '{paper}・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'scale': '縦横の確認線は各50 mm。1マス5 mmの間隔を実物のミディ用プレートで確認。',
        'detail': '図案とエディター',
    },
}

# The renderer stays unchanged so its layout, symbols, rulers and validation
# continue to use the established print contract. Only this module's copy,
# URL, font and original source are supplied to that renderer.
spec = importlib.util.spec_from_file_location('black_cat_print_renderer', ROOT / 'scripts/build-coaster-pdfs.py')
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)
renderer.ID, renderer.COPY = ID, COPY
renderer.FONT_DIR, renderer.FONT_NAME, renderer.FONT_PATH = FONT_DIR, FONT_NAME, FONT_PATH
renderer.detail_url = lambda locale: renderer.SITE + ('' if locale == 'en' else '/' + locale) + '/patterns/black-cat'


def digest(data):
    return sha256(data).hexdigest()


def load_pattern(pack):
    assert pack.name == 'original-black-cat-v1'
    assert 'artifacts' in pack.parts and 'public' not in pack.parts
    data = json.loads((pack / 'manifest.json').read_text())
    assert len(data['patterns']) == 1
    pattern = data['patterns'][0]
    assert pattern['id'] == ID and pattern['slug'] == 'black-cat'
    assert pattern['kind'] == 'original' and pattern['source'] is None
    assert pattern['title'] == COPY['en']['name']
    assert pattern['localizedSubjects'] == {locale: COPY[locale]['name'] for locale in ('de', 'fr', 'ja')}
    for key in ('physicalAssemblyTested', 'ironingTested', 'hangingTested', 'loadStrengthTested'):
        assert pattern[key] is False and pattern['validation'][key] is False
    assert pattern['width'] == pattern['height'] == 29
    rows = pattern['rows']
    assert len(rows) == 29 and all(len(row) == 29 for row in rows)
    assert digest(('\n'.join(rows)).encode()) == ROWS_HASH, 'Reviewed original grid changed'
    assert Counter(''.join(rows).replace('.', '')) == {'B': 177, 'Y': 4}
    assert pattern['beads'] == 181 and pattern['colorCount'] == 2
    assert pattern['bounds'] == {'x': 6, 'y': 6, 'width': 16, 'height': 16}
    assert pattern['topology']['components'] == 1 and pattern['topology']['singleBeadCutPoints'] == 0
    assert pattern['validation']['namedCharacter'] is False
    palette = pattern['palette']
    assert pattern['materials'] == list(palette.values())
    assert {key: item['ref'] for key, item in palette.items()} == {'B': '80-19018', 'Y': '80-19003'}
    counts = Counter(''.join(rows).replace('.', ''))
    with (ROOT / 'public/palettes/perler.csv').open(newline='') as source:
        available = {row[0]: row for row in csv.reader(source)}
    for symbol, entry in palette.items():
        bead = available[entry['ref']]
        rgb = [int(channel) for channel in bead[3:6]]
        assert entry['symbol'] == symbol and entry['count'] == counts[symbol]
        assert entry['name'] == bead[1] and entry['rgb'] == rgb
        assert entry['hex'] == '#' + ''.join(f'{channel:02x}' for channel in rgb)
    expected = bytes(channel for row in rows for symbol in row
                     for channel in (palette[symbol]['rgb'] + [255] if symbol != '.' else [0, 0, 0, 0]))
    assert digest(expected) == RGBA_HASH
    with Image.open(pack / 'pixels' / (ID + '.png')) as image:
        assert image.mode == 'RGBA' and image.size == (29, 29) and image.tobytes() == expected
    project = json.loads((pack / 'projects' / (ID + '.bead-pattern.json')).read_text())
    draft = project['draft']
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
    assert draft['version'] == 1 and draft['selectedPaletteIds'] == ['perler']
    assert draft['boardId'] == 'midi' and draft['boardWidth'] == draft['boardHeight'] == 1
    assert draft['pdfScaleMode'] == 'midi-5mm'
    assert draft['editedPattern']['width'] == draft['editedPattern']['height'] == 29
    assert base64.b64decode(draft['editedPattern']['data'], validate=True) == expected
    assert len(draft['activePalettes']) == 1 and draft['activePalettes'][0]['name'] == 'Perler Midi'
    pattern['occupied'] = {(x, y): palette[symbol] for y, row in enumerate(rows)
                           for x, symbol in enumerate(row) if symbol != '.'}
    return pattern


def register_font(pattern):
    lock = json.loads((FONT_DIR / 'source.json').read_text())
    chars = renderer.all_characters(pattern)
    assert digest(FONT_PATH.read_bytes()) == lock['subsetSha256']
    assert digest((FONT_DIR / 'OFL.txt').read_bytes()) == lock['licenseSha256']
    assert digest(chars.encode()) == lock['pdfCharactersSha256']
    assert lock['patternIds'] == [ID] and lock['pdfCount'] == 8
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))
    face = pdfmetrics.getFont(FONT_NAME).face
    assert all(c.isspace() or ord(c) in face.charToGlyph for c in chars), 'Missing print glyph'
    for locale in COPY:
        for paper in renderer.PAPERS:
            width = renderer.PAPERS[paper][0] / mm
            entries = renderer.text_entries(pattern, locale, paper)
            brand, type_label = entries[0], entries[2]
            assert brand['x'] + pdfmetrics.stringWidth(brand['value'], FONT_NAME, brand['size']) / mm < type_label['x'] - pdfmetrics.stringWidth(type_label['value'], FONT_NAME, type_label['size']) / mm
            for entry in entries:
                assert pdfmetrics.stringWidth(entry['value'], FONT_NAME, entry['size']) <= entry.get('maxMm', width - 36) * mm, (locale, paper, entry['value'])


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack', required=True, type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--font-characters', action='store_true')
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    pattern = load_pattern(args.pack.resolve())
    if args.font_characters:
        print(json.dumps({'characters': renderer.all_characters(pattern)}, ensure_ascii=False))
    else:
        assert args.output, 'An explicit staging --output directory is required'
        args.output = args.output.resolve()
        assert args.output.name == 'generated-black-cat-pdfs'
        assert not {'public', 'src'}.intersection(args.output.parts)
        register_font(pattern)
        outputs = [renderer.output_path(args.output, locale, paper) for locale in COPY for paper in renderer.PAPERS]
        if not args.check_only:
            assert all(not path.exists() for path in outputs), 'PDF batch already exists'
        results = []
        for locale in COPY:
            for paper in renderer.PAPERS:
                destination = renderer.output_path(args.output, locale, paper)
                if not args.check_only:
                    renderer.write_pdf(pattern, locale, paper, destination)
                check = renderer.validate_pdf(pattern, locale, paper, destination)
                # Coaster validation checks the actual cells; its report count
                # is replaced by the frozen black-cat count for this adapter.
                check['beads'] = pattern['beads']
                results.append(check)
        print(json.dumps({'pdfs': results}, ensure_ascii=False, indent=2))

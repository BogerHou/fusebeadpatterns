"""Rebuild only the separately named font for native Hama Letter templates.

Pass the JSON from build-localized-hama-letter-pdfs.py --font-characters.
Requires fontTools 4.60.1 only when rebuilding. No PDF or old font is written.
Upstream font and OFL are pinned and checksum-verified before parsing.
"""
import argparse
from hashlib import sha256
import io
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / 'scripts/fonts/hama-letter-jp'
FONT_PATH = FONT_DIR / 'FuseBeadHamaLetterJapanese-Regular.ttf'
FAMILY = 'Fuse Bead Hama Letter Japanese'
VERSION = '4.60.1'


def digest(data):
    return sha256(data).hexdigest()


def characters_from(path):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    text = data['characters']
    if not isinstance(text, str) or not text:
        raise ValueError('A nonempty reviewed character inventory is required')
    return ''.join(sorted(set(text)))


def check(characters):
    from reportlab.pdfbase.ttfonts import TTFont
    lock = json.loads((FONT_DIR / 'source.json').read_text(encoding='utf-8'))
    assert lock['derivativeFamily'] == FAMILY and lock['weight'] == 400
    assert lock['fonttoolsVersion'] == VERSION
    assert digest(FONT_PATH.read_bytes()) == lock['subsetSha256']
    assert digest((FONT_DIR / 'OFL.txt').read_bytes()) == lock['licenseSha256']
    assert digest(characters.encode()) == lock['charactersSha256']
    font = TTFont('HamaLetterFontCheck', str(FONT_PATH))
    missing = {c for c in characters if not c.isspace() and ord(c) not in font.face.charToGlyph}
    assert not missing, f'Missing glyphs: {missing}'
    return {'font': str(FONT_PATH.relative_to(ROOT)), 'characters': len(characters), 'sha256': lock['subsetSha256']}


def create(characters):
    from fontTools import subset, __version__
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    assert __version__ == VERSION, f'Expected fontTools {VERSION}'
    if FONT_DIR.exists():
        raise FileExistsError('Refusing to replace an existing font directory; use --check-only')
    original = json.loads((ROOT / 'scripts/fonts/localized-library-jp/source.json').read_text())
    keys = ('repository', 'revision', 'fontUrl', 'fontSha256', 'licenseUrl', 'licenseSha256', 'weight', 'license')
    source = {key: original[key] for key in keys}
    font_bytes = urllib.request.urlopen(source['fontUrl'], timeout=60).read()
    license_bytes = urllib.request.urlopen(source['licenseUrl'], timeout=30).read()
    assert digest(font_bytes) == source['fontSha256'], 'Pinned upstream font checksum mismatch'
    assert digest(license_bytes) == source['licenseSha256'], 'Pinned OFL checksum mismatch'
    font = TTFont(io.BytesIO(font_bytes), recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': 400}, inplace=True)
    options = subset.Options()
    options.name_IDs, options.name_legacy, options.name_languages = ['*'], True, ['*']
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=characters)
    subsetter.subset(font)
    names = {1: FAMILY, 2: 'Regular', 3: 'FuseBeadHamaLetterJapanese-Regular-1',
             4: f'{FAMILY} Regular', 6: 'FuseBeadHamaLetterJapanese-Regular',
             16: FAMILY, 17: 'Regular'}
    for name in font['name'].names:
        if name.nameID in names:
            name.string = names[name.nameID].encode(name.getEncoding())
    stream = io.BytesIO()
    font.save(stream)
    result = stream.getvalue()
    cmap = font.getBestCmap()
    assert all(c.isspace() or ord(c) in cmap for c in characters)
    FONT_DIR.mkdir()
    FONT_PATH.write_bytes(result)
    (FONT_DIR / 'OFL.txt').write_bytes(license_bytes)
    (FONT_DIR / 'source.json').write_text(json.dumps({
        **source, 'derivativeFamily': FAMILY,
        'subsetPurpose': 'Six reviewed Hama Midi motifs: native DE/FR/JA US Letter templates, labels, symbols and two-axis calibration copy',
        'subsetSha256': digest(result), 'charactersSha256': digest(characters.encode()),
        'characterCount': len(characters), 'patternCount': 6, 'pdfCount': 18,
        'fonttoolsVersion': VERSION,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return check(characters)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--characters-file', required=True)
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    text = characters_from(args.characters_file)
    print(json.dumps(check(text) if args.check_only else create(text), ensure_ascii=False))

"""Create the separately named Japanese font for the Mini Ghost reading charts.

Pass the JSON from build-mini-ghost-pdfs.py --font-characters. Rebuilding needs
fontTools 4.60.1 and ReportLab; --check-only needs only the bundled ReportLab.
The upstream Google Fonts file and unmodified OFL are pinned and verified before
parsing. Creates one new font directory exclusively, never a PDF or an old font.
"""
import argparse
from hashlib import sha256
import io
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / 'scripts/fonts/mini-ghost-jp'
FONT_PATH = FONT_DIR / 'FuseBeadMiniGhostJapanese-Regular.ttf'
FAMILY = 'Fuse Bead Mini Ghost Japanese'
POSTSCRIPT_NAME = 'FuseBeadMiniGhostJapanese-Regular'
VERSION = '4.60.1'
SOURCE = {
    'repository': 'https://github.com/google/fonts',
    'revision': '66a36c8c94b1a5d992ee4e7f392fccfe4945767c',
    'fontUrl': 'https://raw.githubusercontent.com/google/fonts/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf',
    'fontSha256': 'c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f',
    'licenseUrl': 'https://raw.githubusercontent.com/google/fonts/66a36c8c94b1a5d992ee4e7f392fccfe4945767c/ofl/notosansjp/OFL.txt',
    'licenseSha256': '1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9',
    'weight': 400,
    'license': 'SIL Open Font License 1.1',
}


def digest(data):
    return sha256(data).hexdigest()


def characters_from(path):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    text = data['characters']
    if not isinstance(text, str) or not text:
        raise ValueError('A nonempty character inventory from the reviewed PDF copy is required')
    return ''.join(sorted(set(text)))


def name_text(value):
    return value.decode('utf-8') if isinstance(value, bytes) else str(value)


def reviewed_font(data, characters, alias):
    from reportlab.pdfbase.ttfonts import TTFont
    font = TTFont(alias, io.BytesIO(data))
    assert name_text(font.face.familyName) == FAMILY, 'Embedded font family differs'
    assert name_text(font.face.name) == POSTSCRIPT_NAME, 'Embedded PostScript name differs'
    missing = {char for char in characters if not char.isspace() and ord(char) not in font.face.charToGlyph}
    assert not missing, f'Missing glyphs: {missing}'
    return font


def check(characters):
    lock = json.loads((FONT_DIR / 'source.json').read_text(encoding='utf-8'))
    assert {key: lock[key] for key in SOURCE} == SOURCE, 'Pinned source metadata differs'
    assert lock['derivativeFamily'] == FAMILY and lock['fonttoolsVersion'] == VERSION
    assert lock['characterCount'] == len(characters)
    assert lock['charactersSha256'] == digest(characters.encode())
    data = FONT_PATH.read_bytes()
    assert digest(data) == lock['subsetSha256'], 'Subset font checksum differs'
    assert digest((FONT_DIR / 'OFL.txt').read_bytes()) == SOURCE['licenseSha256'], 'Unmodified OFL checksum differs'
    reviewed_font(data, characters, 'MiniGhostFontCheck')
    return {
        'font': str(FONT_PATH.relative_to(ROOT)), 'family': FAMILY,
        'characters': len(characters), 'charactersSha256': lock['charactersSha256'],
        'sha256': lock['subsetSha256'], 'allInventoryGlyphsCovered': True,
        'unmodifiedOfl': True, 'pdfsWritten': 0,
    }


def create(characters):
    # Resolve dependencies and verify all bytes before creating any output path.
    from reportlab.pdfbase.ttfonts import TTFont as ReviewedFont
    from fontTools import subset, __version__
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    assert ReviewedFont
    assert __version__ == VERSION, f'Expected fontTools {VERSION}'
    if FONT_DIR.exists():
        raise FileExistsError('Refusing to replace an existing font directory; use --check-only')
    font_bytes = urllib.request.urlopen(SOURCE['fontUrl'], timeout=45).read()
    license_bytes = urllib.request.urlopen(SOURCE['licenseUrl'], timeout=30).read()
    assert digest(font_bytes) == SOURCE['fontSha256'], 'Pinned upstream font checksum mismatch'
    assert digest(license_bytes) == SOURCE['licenseSha256'], 'Pinned OFL checksum mismatch'
    font = TTFont(io.BytesIO(font_bytes), recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': SOURCE['weight']}, inplace=True)
    options = subset.Options()
    options.name_IDs, options.name_legacy, options.name_languages = ['*'], True, ['*']
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=characters)
    subsetter.subset(font)
    names = {
        1: FAMILY, 2: 'Regular', 3: POSTSCRIPT_NAME + '-1',
        4: FAMILY + ' Regular', 6: POSTSCRIPT_NAME, 16: FAMILY, 17: 'Regular',
    }
    for name in font['name'].names:
        if name.nameID in names:
            name.string = names[name.nameID].encode(name.getEncoding())
    for name_id in (1, 3, 4, 6, 16):
        assert font['name'].getDebugName(name_id) == names[name_id]
    cmap = font.getBestCmap()
    assert all(char.isspace() or ord(char) in cmap for char in characters)
    output = io.BytesIO()
    font.save(output)
    result = output.getvalue()
    reviewed_font(result, characters, 'MiniGhostFontPreflight')
    lock = {
        **SOURCE, 'derivativeFamily': FAMILY,
        'subsetPurpose': 'Mini Ghost counting charts: EN/DE/FR/JA A4 and US Letter labels, symbols and limits; not an actual-size placement template',
        'subsetSha256': digest(result), 'charactersSha256': digest(characters.encode()),
        'characterCount': len(characters), 'patternCount': 1, 'pdfCount': 8,
        'fonttoolsVersion': VERSION,
    }
    FONT_DIR.mkdir()
    for path, content in ((FONT_PATH, result), (FONT_DIR / 'OFL.txt', license_bytes)):
        with path.open('xb') as stream:
            stream.write(content)
    with (FONT_DIR / 'source.json').open('x', encoding='utf-8') as stream:
        stream.write(json.dumps(lock, ensure_ascii=False, indent=2) + '\n')
    return check(characters)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--characters-file', required=True)
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    characters = characters_from(args.characters_file)
    print(json.dumps(check(characters) if args.check_only else create(characters), ensure_ascii=False))

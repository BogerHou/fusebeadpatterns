"""Reproducible, separate OFL font for brick-mosaic PDFs, never old PDF fonts.

Run with fonttools==4.60.1. Complete pinned upstream assets stay in --work-dir
outside this checkout; application builds do not download fonts or run Python.
"""
import argparse
import io
import json
from hashlib import sha256
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/fonts/brick-mosaic'
COPY = ROOT / 'src/lib/brick-mosaic/copy.ts'
FONT_FILE = 'FuseBeadBrickMosaic-Regular.ttf'
FAMILY = 'Fuse Bead Brick Mosaic'
POSTSCRIPT = 'FuseBeadBrickMosaic-Regular'


def digest(data):
    return sha256(data).hexdigest()


def inventory():
    source = COPY.read_text(encoding='utf-8')
    literal = source.split('export const brickCopy:', 1)[1].split('=', 1)[1].strip()
    # Maintained copy is an ordinary JSON literal, never execute TypeScript.
    copy = json.loads(literal.removesuffix(';'))
    def strings(value):
        if isinstance(value, str):
            return value
        if isinstance(value, dict):
            return ''.join(strings(item) for item in value.values())
        if isinstance(value, list):
            return ''.join(strings(item) for item in value)
        raise ValueError('Unexpected copy value')
    return ''.join(sorted(set(strings(copy) + ''.join(chr(i) for i in range(32, 127)) + '®×·–’éüöäß')))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--work-dir')
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--rebuild', action='store_true', help='Intentionally replace this tool-owned subset after a reviewed copy change')
    args = parser.parse_args()
    from fontTools import __version__, subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    if __version__ != '4.60.1':
        raise ValueError('Use fonttools==4.60.1')
    characters = inventory()
    upstream = json.loads((ROOT / 'scripts/fonts/localized-library-jp/source.json').read_text())
    keys = ('repository', 'revision', 'fontUrl', 'fontSha256', 'licenseUrl', 'licenseSha256', 'weight', 'license')
    source = {key: upstream[key] for key in keys}
    def verify(data):
        font = TTFont(io.BytesIO(data), recalcTimestamp=False)
        cmap = font.getBestCmap()
        if any(not cmap.get(ord(char)) for char in characters):
            raise ValueError('Missing PDF glyph')
        if font['name'].getDebugName(1) != FAMILY or font['name'].getDebugName(6) != POSTSCRIPT or 'fvar' in font:
            raise ValueError('Font identity mismatch')
    if args.check_only:
        lock = json.loads((DEST / 'source.json').read_text())
        data = (DEST / FONT_FILE).read_bytes()
        assert all(lock.get(key) == value for key, value in source.items())
        assert lock['characters'] == characters and lock['sha256'] == digest(data)
        assert lock['builderSha256'] == digest(Path(__file__).read_bytes())
        assert digest((DEST / 'OFL.txt').read_bytes()) == source['licenseSha256']
        verify(data)
        print(json.dumps({'bytes': len(data), 'glyphs': len(characters), 'verified': True}))
        return
    if not args.work_dir:
        parser.error('--work-dir is required for first creation')
    work = Path(args.work_dir).resolve()
    if work == ROOT or ROOT in work.parents or (DEST.exists() and not args.rebuild):
        raise ValueError('Use a fresh outside work directory; do not overwrite an existing font')
    work.mkdir(parents=True, exist_ok=True)
    def download(url, name, expected, limit):
        path = work / name
        if not path.exists():
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read(limit + 1)
            if len(data) > limit or digest(data) != expected:
                raise ValueError('Pinned upstream mismatch')
            path.write_bytes(data)
        data = path.read_bytes()
        if len(data) > limit or digest(data) != expected:
            raise ValueError('Pinned upstream mismatch')
        return data
    original = download(source['fontUrl'], 'upstream-NotoSansJP.ttf', source['fontSha256'], 32 * 1024 * 1024)
    ofl = download(source['licenseUrl'], 'upstream-OFL.txt', source['licenseSha256'], 64 * 1024)
    font = TTFont(io.BytesIO(original), recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': 400}, inplace=True)
    options = subset.Options()
    options.name_IDs, options.name_legacy, options.name_languages = ['*'], True, ['*']
    options.recalc_timestamp = False
    sub = subset.Subsetter(options=options)
    sub.populate(text=characters)
    sub.subset(font)
    names = {1: FAMILY, 2: 'Regular', 3: POSTSCRIPT + '-1', 4: FAMILY + ' Regular', 6: POSTSCRIPT,
             16: FAMILY, 17: 'Regular', 18: FAMILY + ' Regular', 21: FAMILY, 22: 'Regular', 25: POSTSCRIPT}
    for record in font['name'].names:
        if record.nameID in names:
            record.string = names[record.nameID].encode(record.getEncoding())
    stream = io.BytesIO()
    font.save(stream)
    data = stream.getvalue()
    verify(data)
    DEST.mkdir(exist_ok=True)
    (DEST / FONT_FILE).write_bytes(data)
    (DEST / 'OFL.txt').write_bytes(ofl)
    (DEST / 'source.json').write_text(json.dumps({**source, 'family': FAMILY, 'characters': characters,
        'sha256': digest(data), 'bytes': len(data), 'fonttoolsVersion': __version__,
        'builderSha256': digest(Path(__file__).read_bytes()), 'copySHA256AtBuild': digest(COPY.read_bytes())}, ensure_ascii=False, indent=2) + '\n')
    (DEST / 'README.md').write_text('''# Brick mosaic PDF font

Separate, renamed static Regular subset of Noto Sans JP under SIL OFL 1.1.
Copyright and license notices remain in the font and OFL.txt. It covers the
four-language brick-mosaic copy and printable ASCII. No existing font is changed.
source.json pins the upstream revision, checksums, builder and exact characters.

Maintenance: run scripts/build-brick-mosaic-font.py with fonttools==4.60.1.
Use --check-only to verify; first creation requires --work-dir outside the repo.
Complete upstream font files are not shipped. This subset is fetched only when
the user requests a PDF, never by page text, a server function or Next Image.
''')
    print(json.dumps({'bytes': len(data), 'glyphs': len(characters), 'sha256': digest(data)}))


if __name__ == '__main__':
    main()

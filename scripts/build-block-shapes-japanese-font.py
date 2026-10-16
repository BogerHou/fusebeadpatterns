"""Build/check the separate OFL Japanese subset for the block-shape planner.

Requires fontTools 4.60.1 only for this maintenance command. Ordinary application
builds need no Python. Full pinned upstream files stay in --work-dir, never Git.
"""
import argparse
from hashlib import sha256
import io
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / 'public/fonts/block-shapes-japanese'
FONT_FILE = 'FuseBeadBlockShapesJapanese-Regular.ttf'
FAMILY = 'Fuse Bead Block Shapes Japanese'
POSTSCRIPT = 'FuseBeadBlockShapesJapanese-Regular'
VERSION = '4.60.1'
COPY = ROOT / 'src/lib/block-shapes/copy.ts'
UPSTREAM = ROOT / 'scripts/fonts/localized-library-jp/source.json'
SOURCE_KEYS = ('repository', 'revision', 'fontUrl', 'fontSha256', 'licenseUrl',
               'licenseSha256', 'weight', 'license')


def digest(data):
    return sha256(data).hexdigest()


def inventory():
    # This exported literal is JSON; do not evaluate arbitrary TypeScript.
    source = COPY.read_text(encoding='utf-8')
    marker = 'export const blockShapeCopy:'
    if source.count(marker) != 1:
        raise ValueError('Expected one blockShapeCopy export')
    literal = source.split(marker, 1)[1].split('=', 1)[1].strip()
    if not literal.endswith(';'):
        raise ValueError('Expected a terminated JSON literal')
    copy = json.loads(literal[:-1])['ja']
    if not isinstance(copy, dict) or not copy:
        raise ValueError('Japanese copy is missing')
    values = []
    for value in copy.values():
        if isinstance(value, str):
            values.append(value)
        elif isinstance(value, list) and all(isinstance(item, str) for item in value):
            values.extend(value)
        else:
            raise ValueError('Unexpected Japanese copy value')
    # Include all labels, steps and notes, plus printable ASCII for axes/counts.
    characters = ''.join(sorted(set(''.join(values) + ''.join(chr(i) for i in range(32, 127)))))
    return characters, len(copy)


def source_lock():
    original = json.loads(UPSTREAM.read_text(encoding='utf-8'))
    return {key: original[key] for key in SOURCE_KEYS}


def tool_version():
    from fontTools import __version__
    if __version__ != VERSION:
        raise ValueError(f'Expected fontTools {VERSION}, found {__version__}')


def verify_font(data, characters):
    from fontTools.ttLib import TTFont
    font = TTFont(io.BytesIO(data), recalcTimestamp=False)
    cmap = font.getBestCmap()
    missing = [char for char in characters if cmap.get(ord(char), '.notdef') == '.notdef']
    if missing:
        raise ValueError(f'Missing glyphs: {missing}')
    if font['name'].getDebugName(1) != FAMILY or font['name'].getDebugName(6) != POSTSCRIPT:
        raise ValueError('Derivative font names do not match')
    if font['OS/2'].usWeightClass != 400 or 'fvar' in font:
        raise ValueError('Expected static Regular weight 400')
    return len(cmap)


def readme(lock):
    return f'''# Block-shape planner Japanese PDF font

This separate static Regular subset is derived from Noto Sans JP, distributed
under SIL Open Font License 1.1. The derivative is renamed **{FAMILY}**.
The original copyright and license notices are retained in the font and OFL.txt.
It does not replace or alter any existing website font.

- Upstream: {lock['repository']}
- Fixed revision: `{lock['revision']}`
- Upstream font SHA-256: `{lock['fontSha256']}`
- OFL SHA-256: `{lock['licenseSha256']}`
- Derivative SHA-256: `{lock['subsetSha256']}`
- fontTools: `{VERSION}`; static weight 400; original source timestamps retained.
- Inventory: all {lock['jaKeyCount']} Japanese copy fields, including steps and
  notes, plus printable ASCII U+0020 through U+007E: {lock['characterCount']} characters.
- Inventory source: `src/lib/block-shapes/copy.ts`; source.json records the
  exact sorted character set and its SHA-256.

Use an isolated environment with `fonttools=={VERSION}`. From the repository:

```sh
python scripts/build-block-shapes-japanese-font.py --check-only
python scripts/build-block-shapes-japanese-font.py --work-dir /absolute/task-temp-directory --verify-rebuild
```

The second command downloads checksum-pinned upstream files into the explicit
temporary directory and reproduces the subset in memory without replacing it.
For an intentional reviewed inventory change, use `--rebuild --work-dir ...`.
First creation uses `--work-dir ...` without either verification/rebuild flag.
No complete upstream font is shipped. Clean up the task temporary directory
after verification; keep this subset, its source record and OFL license.

The font is fetched only for Japanese block-shape PDF generation. It is not
used for ordinary page text, other tools, server image processing or Next Image.
'''


def check(characters, key_count):
    tool_version()
    lock = json.loads((FONT_DIR / 'source.json').read_text(encoding='utf-8'))
    for key, value in source_lock().items():
        if lock.get(key) != value:
            raise ValueError(f'Upstream lock mismatch: {key}')
    expected = {'derivativeFamily': FAMILY, 'fonttoolsVersion': VERSION,
                'characters': characters, 'charactersSha256': digest(characters.encode('utf-8')),
                'characterCount': len(characters), 'jaKeyCount': key_count,
                'builderSha256': digest(Path(__file__).read_bytes())}
    for key, value in expected.items():
        if lock.get(key) != value:
            raise ValueError(f'Inventory/build lock mismatch: {key}')
    data = (FONT_DIR / FONT_FILE).read_bytes()
    if digest(data) != lock['subsetSha256'] or len(data) != lock['subsetBytes']:
        raise ValueError('Subset checksum or size mismatch')
    if digest((FONT_DIR / 'OFL.txt').read_bytes()) != lock['licenseSha256']:
        raise ValueError('OFL checksum mismatch')
    expected_readme = readme(lock).encode('utf-8')
    if (FONT_DIR / 'README.md').read_bytes() != expected_readme or digest(expected_readme) != lock['readmeSha256']:
        raise ValueError('README checksum/content mismatch')
    cmap_count = verify_font(data, characters)
    return {'font': str((FONT_DIR / FONT_FILE).relative_to(ROOT)), 'bytes': len(data),
            'characterCount': len(characters), 'cmapCount': cmap_count, 'missing': [],
            'sha256': lock['subsetSha256'], 'oldFontsChanged': False}


def download(url, target, expected_hash, max_bytes):
    if target.exists():
        data = target.read_bytes()
    else:
        with urllib.request.urlopen(url, timeout=60) as response:
            data = response.read(max_bytes + 1)
        if len(data) > max_bytes:
            raise ValueError('Upstream file exceeds the maintenance limit')
        if digest(data) != expected_hash:
            raise ValueError('Pinned upstream checksum mismatch')
        target.write_bytes(data)
    if len(data) > max_bytes or digest(data) != expected_hash:
        raise ValueError('Pinned upstream checksum mismatch')
    return data


def build(characters, key_count, work_dir, replace, verify_rebuild):
    tool_version()
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    work_dir = Path(work_dir).expanduser().resolve()
    if work_dir == ROOT or ROOT in work_dir.parents:
        raise ValueError('Keep complete upstream files outside the repository')
    work_dir.mkdir(parents=True, exist_ok=True)
    if FONT_DIR.exists() and not (replace or verify_rebuild):
        raise FileExistsError('Use --check-only, --verify-rebuild or reviewed --rebuild')
    source = source_lock()
    font_bytes = download(source['fontUrl'], work_dir / 'upstream-NotoSansJP.ttf', source['fontSha256'], 32 * 1024 * 1024)
    license_bytes = download(source['licenseUrl'], work_dir / 'upstream-OFL.txt', source['licenseSha256'], 64 * 1024)
    font = TTFont(io.BytesIO(font_bytes), recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': 400}, inplace=True)
    options = subset.Options()
    options.name_IDs, options.name_legacy, options.name_languages = ['*'], True, ['*']
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=characters)
    subsetter.subset(font)
    names = {1: FAMILY, 2: 'Regular', 3: f'{POSTSCRIPT}-1', 4: f'{FAMILY} Regular',
             6: POSTSCRIPT, 16: FAMILY, 17: 'Regular', 18: f'{FAMILY} Regular',
             21: FAMILY, 22: 'Regular', 25: POSTSCRIPT}
    for name in font['name'].names:
        if name.nameID in names:
            name.string = names[name.nameID].encode(name.getEncoding())
    stream = io.BytesIO()
    font.save(stream)
    result = stream.getvalue()
    verify_font(result, characters)
    if verify_rebuild:
        existing = check(characters, key_count)
        if result != (FONT_DIR / FONT_FILE).read_bytes():
            raise ValueError('Rebuilt font differs from the locked subset')
        return {**existing, 'reproducedByteForByte': True}
    lock = {**source, 'derivativeFamily': FAMILY,
            'subsetPurpose': 'Japanese block-shape planner PDF labels; all Japanese tool copy and printable ASCII',
            'subsetSha256': digest(result), 'subsetBytes': len(result),
            'characters': characters, 'charactersSha256': digest(characters.encode('utf-8')),
            'characterCount': len(characters), 'jaKeyCount': key_count,
            'copySource': str(COPY.relative_to(ROOT)), 'copyFileSha256AtBuild': digest(COPY.read_bytes()),
            'fonttoolsVersion': VERSION, 'builderSha256': digest(Path(__file__).read_bytes())}
    readme_bytes = readme(lock).encode('utf-8')
    lock['readmeSha256'] = digest(readme_bytes)
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    (FONT_DIR / FONT_FILE).write_bytes(result)
    (FONT_DIR / 'OFL.txt').write_bytes(license_bytes)
    (FONT_DIR / 'README.md').write_bytes(readme_bytes)
    (FONT_DIR / 'source.json').write_text(json.dumps(lock, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return check(characters, key_count)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--check-only', action='store_true')
    modes.add_argument('--verify-rebuild', action='store_true')
    modes.add_argument('--rebuild', action='store_true')
    parser.add_argument('--work-dir')
    args = parser.parse_args()
    characters, key_count = inventory()
    if args.check_only:
        result = check(characters, key_count)
    else:
        if not args.work_dir:
            parser.error('--work-dir outside the repository is required for building')
        result = build(characters, key_count, args.work_dir, args.rebuild, args.verify_rebuild)
    print(json.dumps(result, ensure_ascii=False))

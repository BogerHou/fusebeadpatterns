"""Prepare/check the original celestial-window downloads without old-asset writes.

Default authoring needs an explicit root marker confirmation and independent
rows/RGBA review lock. Font audit and check-only never create a PDF or directory.
All layout drawing and independent PDF-cell verification reuse one frozen,
read-only historical module in a private module namespace; its main is not run.
No mode makes network requests or overwrites an existing artifact directory.
"""
import argparse
import base64
from collections import Counter
import csv
from hashlib import sha256
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
BASE_PATH = ROOT / 'scripts/build-multiboard-pattern-downloads.py'
BASE_SHA256 = 'a3d52c7793d0d260e53dae5d86e8800fe6d78a596628584195e2f91d9f9cc8b5'
assert sha256(BASE_PATH.read_bytes()).hexdigest() == BASE_SHA256, 'Frozen layout dependency changed; review this adapter'
_spec = importlib.util.spec_from_file_location('_celestial_frozen_layout', BASE_PATH)
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)
from PIL import Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ID = 'original-celestial-stained-glass-window'
IDS = {ID: {
    'slug': 'celestial-stained-glass-window', 'en': 'Celestial Stained Glass Window',
    'de': 'Glasfenster mit Mond und Sternen', 'fr': 'Vitrail lune et étoiles',
    'ja': '月と星のステンドグラス窓',
}}
FONT_NAME = 'FuseBeadCelestialWindowLabels'
FONT_FAMILY = 'Fuse Bead Celestial Window Labels'
FONT_FILE = FONT_NAME + '-Regular.ttf'
OUTPUT_NAME = 'generated-celestial-downloads'
SIZE, BOARD_SIZE = 58, 29
BOARDS = ((0, 0), (1, 0), (0, 1), (1, 1))
LOCALES, PAPERS, COPY = base.LOCALES, base.PAPERS, base.COPY
base.ID, base.IDS, base.FONT_NAME = ID, IDS, FONT_NAME
safe_location, components, digest, json_bytes = base.safe_location, base.components, base.digest, base.json_bytes

def load_patterns(pack, review_lock=None):
    pack = safe_location(pack)
    assert pack.name == 'original-celestial-window-v1' and 'artifacts' in pack.parts
    manifest = json.loads((pack/'manifest.json').read_text())
    assert len(manifest['patterns']) == 1 and manifest['patterns'][0]['id'] == ID
    p = dict(manifest['patterns'][0])
    assert p['kind'] == 'original' and p['source'] is None
    assert p['slug'] == IDS[ID]['slug'] and p['title'] == IDS[ID]['en']
    assert p['localizedSubjects'] == {loc: IDS[ID][loc] for loc in ('de', 'fr', 'ja')}
    assert (p['width'], p['height']) == (SIZE, SIZE)
    assert len(p['rows']) == SIZE and all(isinstance(row, str) and len(row) == SIZE for row in p['rows'])
    counts = Counter(''.join(p['rows']).replace('.', ''))
    palette = p['palette']
    assert set(palette) == set(counts) and 1 <= len(palette) <= 8
    assert p['materials'] == list(palette.values())
    assert all(re.fullmatch(r'[A-Z0-9]', symbol) for symbol in palette)
    with (ROOT/'public/palettes/perler.csv').open(newline='') as source:
        csv_colors = {row[0]: row for row in csv.reader(source)}
    for symbol, color in palette.items():
        actual = csv_colors[color['ref']]
        assert color['symbol'] == symbol and color['count'] == counts[symbol]
        assert color['name'] == actual[1] and color['rgb'] == [int(v) for v in actual[3:6]]
        assert color['hex'] == '#' + bytes(color['rgb']).hex()
    assert len({c['ref'] for c in palette.values()}) == len(palette)
    assert len({tuple(c['rgb']) for c in palette.values()}) == len(palette)
    assert p['beads'] == sum(counts.values()) and p['colorCount'] == len(counts)
    p['rgba'] = bytes(channel for row in p['rows'] for symbol in row
        for channel in (palette[symbol]['rgb']+[255] if symbol != '.' else [0,0,0,0]))
    p['rowsSha256'] = digest('\n'.join(p['rows']).encode())
    p['rgbaSha256'] = digest(p['rgba'])
    if review_lock:
        locks = json.loads(review_lock.read_text())
        assert set(locks) == {ID}
        assert locks[ID]['rowsSha256'] == p['rowsSha256'] and locks[ID]['rgbaSha256'] == p['rgbaSha256'], 'Reviewed rows or RGBA changed'
    with Image.open(pack/'pixels'/(ID+'.png')) as img:
        assert img.mode == 'RGBA' and img.size == (SIZE,SIZE) and img.tobytes() == p['rgba']
    project_bytes = (pack/'projects'/(ID+'.bead-pattern.json')).read_bytes()
    project = json.loads(project_bytes)
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
    draft = project['draft']
    assert draft['version'] == 1 and draft['sourceMode'] == 'blank' and draft['imageSrc'] is None
    assert draft['selectedPaletteIds'] == ['perler']
    assert (draft['boardId'],draft['boardWidth'],draft['boardHeight']) == ('midi',2,2)
    assert draft['pdfScaleMode'] == 'midi-5mm'
    edited = draft['editedPattern']
    assert (edited['width'],edited['height'],edited['byteLength']) == (SIZE,SIZE,len(p['rgba']))
    assert base64.b64decode(edited['data'],validate=True) == p['rgba']
    assert len(draft['activePalettes']) == 1 and draft['activePalettes'][0]['name'] == 'Perler Midi'
    entries = {c['ref']:c for c in draft['activePalettes'][0]['entries']}
    assert set(entries) == {c['ref'] for c in palette.values()}
    for c in palette.values():
        entry = entries[c['ref']]
        assert entry['symbol'] == c['symbol'] and entry['name'] == c['name'] and entry['enabled'] is True
        assert entry['color'] == dict(zip(('r','g','b','a'),c['rgb']+[255]))
    p['projectSha256'] = digest(project_bytes)
    p['occupied'] = {(x,y):palette[symbol] for y,row in enumerate(p['rows']) for x,symbol in enumerate(row) if symbol != '.'}
    xs,ys = zip(*p['occupied'])
    actual_bounds = dict(x=min(xs),y=min(ys),width=max(xs)-min(xs)+1,height=max(ys)-min(ys)+1)
    assert p['bounds'] == actual_bounds and actual_bounds['width'] > 29 and actual_bounds['height'] > 29
    p['digitalComponents'] = components(p['occupied'])
    assert p['digitalComponents'] == [p['beads']], 'Digital connectivity is required, not physical strength'
    p['boardCounts'] = [sum(1 for x,y in p['occupied'] if bx*29 <= x < (bx+1)*29 and by*29 <= y < (by+1)*29) for bx,by in BOARDS]
    assert all(value > 0 for value in p['boardCounts']) and sum(p['boardCounts']) == p['beads']
    assert any((28,y) in p['occupied'] and (29,y) in p['occupied'] for y in range(58)), 'No occupied vertical board seam'
    assert any((x,28) in p['occupied'] and (x,29) in p['occupied'] for x in range(58)), 'No occupied horizontal board seam'
    for key in ('physicalAssemblyTested','ironingTested','hangingTested','loadStrengthTested'):
        assert p.get(key) is False, f'{key} must remain untested'
    return [p]


def inventory(patterns=None):
    if patterns is not None:
        return dict(base.characters(patterns), scope='all actual PDF/chart text from verified source')
    # A no-source audit includes the real frozen translations, every existing
    # manufacturer product name and printable ASCII for variable numbers/codes.
    values = [*IDS[ID].values()]
    for copy in COPY.values():
        for value in copy.values():
            values.extend(value if isinstance(value, tuple) else [value])
    with (ROOT / 'public/palettes/perler.csv').open(newline='') as handle:
        values.extend(row[1] for row in csv.reader(handle))
    characters = ''.join(sorted(set(''.join(values) + ''.join(chr(i) for i in range(32, 127)))))
    return dict(characters=characters, count=len(characters), sha256=digest(characters.encode()),
        scope='frozen titles/labels and real Perler names; no pattern quantities claimed')


def audit_fonts(required):
    result = []
    candidates = sorted((ROOT / 'scripts/fonts').rglob('*.ttf')) + sorted((ROOT / 'public/fonts').rglob('*.ttf'))
    union = set()
    for index, path in enumerate(candidates):
        font = TTFont('CelestialAudit' + str(index), str(path))
        available = {code for code, glyph in font.face.charToGlyph.items() if glyph != 0}
        union.update(available)
        missing = ''.join(char for char in required['characters'] if ord(char) not in available)
        result.append(dict(path=str(path.relative_to(ROOT)), sha256=digest(path.read_bytes()),
            bytes=path.stat().st_size, missing=missing, missingCount=len(missing), coversAll=not missing))
    return dict(required=required, fonts=result,
        missingFromEveryExistingFont=''.join(c for c in required['characters'] if ord(c) not in union),
        completeCandidates=[r['path'] for r in result if r['coversAll']], pdfCreated=False)


def prepare_font(directory, required, source_font, source_license):
    from fontTools import subset, __version__
    from fontTools.ttLib import TTFont as FontToolsFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.boundsPen import BoundsPen
    assert __version__ == '4.60.1', 'Use existing pinned fontTools 4.60.1'
    directory = directory.absolute()
    assert directory.name == 'celestial-window-labels'
    assert not any(p.is_symlink() for p in (directory, *directory.parents))
    assert not directory.exists(), 'Never refresh or replace an existing font'
    assert directory.parent == ROOT / 'scripts/fonts', 'Dedicated new font directory only'
    original, license_bytes = source_font.read_bytes(), source_license.read_bytes()
    assert digest(original) == base.PIN['fontSha256']
    assert digest(license_bytes) == base.PIN['licenseSha256']
    font = FontToolsFont(io.BytesIO(original), recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': 400}, inplace=True)
    options = subset.Options()
    options.name_IDs = ['*']; options.name_legacy = True; options.name_languages = ['*']; options.recalc_timestamp = False
    sub = subset.Subsetter(options=options); sub.populate(text=required['characters']); sub.subset(font)
    names = {1:FONT_FAMILY, 2:'Regular', 3:FONT_NAME+'-Regular-1', 4:FONT_FAMILY+' Regular',
             6:FONT_NAME+'-Regular', 16:FONT_FAMILY, 17:'Regular'}
    for item in font['name'].names:
        if item.nameID in names:
            item.string = names[item.nameID].encode(item.getEncoding())
    cmap, glyph_set, glyphs = font.getBestCmap(), font.getGlyphSet(), {}
    for char in required['characters']:
        assert cmap.get(ord(char), '.notdef') != '.notdef', f'Missing glyph: {char!r}'
        name = cmap[ord(char)]; glyph = glyph_set[name]
        pen = SVGPathPen(glyph_set); glyph.draw(pen)
        bounds = BoundsPen(glyph_set); glyph.draw(bounds)
        glyphs[char] = dict(advance=font['hmtx'].metrics[name][0], bounds=bounds.bounds, path=pen.getCommands())
    glyph_bytes = json_bytes(dict(unitsPerEm=font['head'].unitsPerEm, glyphs=glyphs))
    target = io.BytesIO(); font.save(target); font_bytes = target.getvalue()
    lock = dict(base.PIN, derivativeFamily=FONT_FAMILY, weight=400, fonttoolsVersion=__version__,
        subsetPurpose='Only original celestial-window EN/DE/FR/JA PDF/count charts; no prior font refresh',
        subsetSha256=digest(font_bytes), glyphsSha256=digest(glyph_bytes),
        characters=required['characters'], charactersSha256=required['sha256'], characterCount=required['count'],
        patternIds=[ID], upstreamReadOffline=True, layoutDependencySha256=BASE_SHA256)
    directory.mkdir()
    for name, data in [(FONT_FILE,font_bytes), ('glyphs.json',glyph_bytes), ('OFL.txt',license_bytes), ('source.json',json_bytes(lock))]:
        with (directory/name).open('xb') as handle: handle.write(data)
    return dict(status='font-created', path=str(directory), bytes=len(font_bytes), pdfCreated=False, lock=lock)


def read_font(directory, required):
    directory = directory.absolute()
    assert not any(p.is_symlink() for p in (directory, *directory.parents)), 'Symlinked font path'
    lock = json.loads((directory/'source.json').read_text())
    assert all(lock[key] == value for key, value in base.PIN.items())
    assert lock['derivativeFamily'] == FONT_FAMILY and lock['weight'] == 400
    assert lock['fonttoolsVersion'] == '4.60.1' and lock['patternIds'] == [ID]
    assert lock['layoutDependencySha256'] == BASE_SHA256
    assert digest((directory/FONT_FILE).read_bytes()) == lock['subsetSha256']
    assert digest((directory/'glyphs.json').read_bytes()) == lock['glyphsSha256']
    assert digest((directory/'OFL.txt').read_bytes()) == base.PIN['licenseSha256']
    assert digest(lock['characters'].encode()) == lock['charactersSha256']
    pdfmetrics.registerFont(TTFont(FONT_NAME, str(directory/FONT_FILE)))
    available = pdfmetrics.getFont(FONT_NAME).face.charToGlyph
    assert all(available.get(ord(c), 0) != 0 for c in required['characters']), 'Incomplete actual PDF character coverage'
    font = json.loads((directory/'glyphs.json').read_text())
    assert all(c in font['glyphs'] for c in required['characters'])
    return font, lock


def preflight_layout(patterns):
    pages = 0
    for p in patterns:
        for locale in LOCALES:
            for paper, (width, _) in PAPERS.items():
                for index in (None, 0, 1, 2, 3):
                    for entry in base.pdf_entries(p, locale, paper, index):
                        assert pdfmetrics.stringWidth(entry['value'], FONT_NAME, entry['size']) <= entry.get('maxMm', width/base.mm-36)*base.mm, (locale, paper, entry)
                    pages += 1
    return dict(pdfCount=8, pageCount=pages, textFits=True, sourceCells=SIZE*SIZE, pdfCreated=False)


def expected_paths(output, patterns):
    paths = set()
    for p in patterns:
        for locale in LOCALES:
            folder = base.relative_folder(p, locale)
            paths.update(output/folder/name for name in ('pattern.pdf', 'pattern-letter.pdf', 'grid.svg', 'grid.png'))
    return paths | {output/'grid-assets.json', output/'download-checks.json'}


def downloads(patterns, output, font, font_lock, checking, node):
    pdf_checks=[]; chart_checks=[]; grids={loc:{} for loc in LOCALES}
    for p in patterns:
        for locale in LOCALES:
            folder = base.relative_folder(p, locale)
            for paper in PAPERS:
                destination = output/folder/('pattern.pdf' if paper == 'a4' else 'pattern-letter.pdf')
                if not checking: base.write_pdf(p, locale, paper, destination)
                check = base.validate_pdf(p, locale, paper, destination)
                check['path'] = str(destination.relative_to(output)); pdf_checks.append(check)
            svg, layout = base.chart_svg(p, locale, font)
            png = base.svg_png(svg, node)
            png_relative = folder/'grid.png'
            for path, data in [(output/folder/'grid.svg', svg), (output/png_relative, png)]:
                if checking: assert path.read_bytes() == data, f'Changed chart: {path}'
                else:
                    with path.open('xb') as handle: handle.write(data)
            check = base.validate_chart(p, locale, svg, png, layout, png_relative); chart_checks.append(check)
            grids[locale][ID] = {key:check[key] for key in ('href','width','height')}
    report = dict(patternIds=[ID], pdfCount=8, pdfPageCount=40, chartCount=4, pdfs=pdf_checks, charts=chart_checks,
        layoutDependencySha256=BASE_SHA256, fontSha256=font_lock['subsetSha256'],
        source=[{key:p[key] for key in ('id','rowsSha256','rgbaSha256','projectSha256','beads','colorCount','boardCounts','digitalComponents')} for p in patterns],
        physicalAssemblyTested=False, ironingTested=False, jointStrengthTested=False)
    for name, data in [('grid-assets.json',grids), ('download-checks.json',report)]:
        path = output/name; encoded = json_bytes(data)
        if checking: assert path.read_bytes() == encoded, f'Changed report: {name}'
        else:
            with path.open('xb') as handle: handle.write(encoded)
    actual = {p for p in output.rglob('*') if p.is_file()}
    assert actual == expected_paths(output, patterns), 'Missing, unexpected or duplicate output'
    assert not any(p.is_symlink() for p in output.rglob('*'))
    return dict(status='checked' if checking else 'created', pdfCount=8, pdfPageCount=40,
        chartCount=4, output=str(output), all3364CellsRestoredExactly=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pack', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--font-dir', type=Path, default=ROOT/'scripts/fonts/celestial-window-labels')
    parser.add_argument('--review-lock', type=Path)
    parser.add_argument('--source-font', type=Path)
    parser.add_argument('--source-license', type=Path)
    parser.add_argument('--node', default='node')
    parser.add_argument('--pdf-marker-confirmed', action='store_true', help='Root has just successfully executed the PDF skill marker for eight new files')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--font-audit', action='store_true')
    mode.add_argument('--prepare-font', action='store_true')
    mode.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    if not (args.font_audit or args.prepare_font or args.check_only):
        assert args.pdf_marker_confirmed, 'Root PDF marker confirmation required before authoring preflight'
    if args.review_lock:
        args.review_lock = safe_location(args.review_lock)
    patterns = load_patterns(args.pack, args.review_lock) if args.pack else None
    required = inventory(patterns)
    if args.font_audit:
        print(json.dumps(audit_fonts(required), ensure_ascii=False)); return
    if args.prepare_font:
        assert args.source_font and args.source_license, 'Explicit existing offline font and license paths required'
        print(json.dumps(prepare_font(args.font_dir, required, args.source_font, args.source_license), ensure_ascii=False)); return
    assert patterns, '--pack is required'
    font, lock = read_font(args.font_dir, required)
    preflight = preflight_layout(patterns)
    if args.check_only and not args.output:
        print(json.dumps(dict(status='source-and-layout-preflight', independentReviewLocked=bool(args.review_lock), **preflight))); return
    assert args.output and args.review_lock, 'Downloads require an explicit output and independent review lock'
    output = safe_location(args.output, writing=not args.check_only)
    assert output == args.pack.resolve()/OUTPUT_NAME, 'Use only the new downloads directory inside this private source pack'
    if args.check_only:
        assert output.is_dir(), 'Authored-output checking requires an existing downloads directory'
        assert not any(p.is_symlink() for p in output.rglob('*')), 'Symlinked output member'
        assert {p for p in output.rglob('*') if p.is_file()} == expected_paths(output, patterns), 'Missing or unexpected output before checking'
    if not args.check_only:
        assert args.pdf_marker_confirmed, 'Root PDF marker confirmation required before any PDF creation'
        output.mkdir(mode=0o700)
    old_umask = os.umask(0o077)
    try: result = downloads(patterns, output, font, lock, args.check_only, args.node)
    finally: os.umask(old_umask)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()

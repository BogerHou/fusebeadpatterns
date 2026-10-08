"""Build/check six Hama Midi variants without changing published Perler assets.

Uses reviewed explicit colour mappings, not nearest-colour matching. Requires
Pillow, reportlab, pypdf and pdfplumber. No network calls or downloaded fonts.
Run: python3 scripts/build-hama-patterns.py [--check-only] [--qa-report PATH]
"""
import argparse
import base64
from collections import Counter
from copy import deepcopy
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
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/patterns-hama'
COLLECTION_URL = 'https://fusebeadpatterns.art/patterns/hama'
PAPERS = {'a4': ('A4', A4), 'letter': ('US Letter', letter)}
GRID_TOP, PITCH, GRID_MM = 43.0, 5.0, 145.0
INK, MUTED = '#25342e', '#59655f'
SOURCE_HASHES = {
    'original-soccer-ball': '0a8776d6f813ae703415eb23dbf6f806e38254bb85593fa1e6458a0ac65dcc40',
    'original-friendly-ghost': 'fefb58a1c8222731a99982e6ce35ca709c79f47ba5d2fd068174075ae49c85a0',
    'original-halloween-bat': '6e2275fc083a64ab5c0d886d6bb56ff98399080587c5dfa491da0b2739ebe46b',
    'original-christmas-tree': '924611b006433eeaf5850b6919f10c0512db42d66b899bd033f872b10f437fc2',
    'original-snowman': 'fb93ee3e1a39210b05f032a1799c279affb14a6eaa40c8104c0b02c17be5f778',
    'original-gingerbread-man': '65b0551ed86c1af5b24c26fa4219c0d08ff8e9d8f3eb2c7cbc30fd191c3da92b',
}
# Ordinary solid colours checked against Hama's 2026 Midi colour chart.
# RGB values and editor symbols remain exactly those in public/palettes/hama.csv;
# they are screen approximations, not manufacturer measurements.
REVIEWED_SOLIDS = {
    'H01': 'White', 'H03': 'Yellow', 'H04': 'Orange', 'H05': 'Red',
    'H07': 'Purple', 'H10': 'Green', 'H12': 'Brown', 'H18': 'Black', 'H76': 'Nougat',
}


def digest(data):
    return sha256(data).hexdigest()


def load_variants():
    manifest = json.loads((ROOT / 'src/lib/patterns/hama.json').read_text())
    assert set(manifest) == {'updatedAt', 'patterns'}
    assert manifest['updatedAt'] == '2026-10-08'
    assert [p['id'] for p in manifest['patterns']] == list(SOURCE_HASHES)
    with (ROOT / 'public/palettes/hama.csv').open(newline='') as stream:
        entries = {row[0]: {'name': row[1], 'ref': row[0], 'symbol': row[2],
                           'prefix': 'H', 'enabled': True,
                           'color': dict(zip(('r', 'g', 'b', 'a'), [*map(int, row[3:6]), 255]))}
                   for row in csv.reader(stream)}
    for ref, name in REVIEWED_SOLIDS.items():
        assert entries[ref]['name'] == name
    match = re.search(r'export const patterns: Pattern\[\] = (\[.*?\]);',
                      (ROOT / 'src/lib/patterns/catalog.ts').read_text(), re.S)
    assert match
    catalog = {p['id']: p for p in json.loads(match[1])}
    variants = []
    for item in manifest['patterns']:
        assert set(item) == {'id', 'name', 'colorMap'}
        original = catalog[item['id']]
        assert original['source'] is None and original['collectionId'] is None
        assert original['version'].startswith('Original ')
        project = json.loads((ROOT / 'public' / original['assets']['project'].lstrip('/')).read_text())
        assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
        draft = project['draft']
        assert draft['sourceMode'] == 'blank' and draft['imageSrc'] is None
        assert draft['selectedPaletteIds'] == ['perler']
        assert (draft['boardId'], draft['boardWidth'], draft['boardHeight']) == ('midi', 1, 1)
        pattern = draft['editedPattern']
        source = base64.b64decode(pattern['data'], validate=True)
        assert (pattern['width'], pattern['height'], pattern['byteLength'], len(source)) == (29, 29, 3364, 3364)
        assert digest(source) == SOURCE_HASHES[item['id']], 'Reviewed original pixels changed'
        with Image.open(ROOT / 'public' / original['assets']['pixels'].lstrip('/')) as image:
            assert image.size == (29, 29) and image.convert('RGBA').tobytes() == source
        source_entries = {c['ref']: c for p in draft['activePalettes'] for c in p['entries']}
        assert set(item['colorMap']) == set(source_entries) == {c['ref'] for c in original['palette']}
        assert set(item['colorMap'].values()) <= set(REVIEWED_SOLIDS)
        assert len(set(item['colorMap'].values())) == len(item['colorMap']) <= 4
        for ref, entry in source_entries.items():
            if entry['name'] in ('White', 'Black'):
                assert item['colorMap'][ref] == {'White': 'H01', 'Black': 'H18'}[entry['name']]
        replacements = {tuple(entry['color'][k] for k in ('r', 'g', 'b')):
                        entries[item['colorMap'][ref]] for ref, entry in source_entries.items()}
        assert len(replacements) == len(source_entries)
        rgba = bytearray(source)
        source_counts = Counter()
        for offset in range(0, len(rgba), 4):
            assert source[offset+3] in (0, 255)
            if not source[offset+3]:
                continue
            rgb = tuple(source[offset:offset+3])
            source_counts[rgb] += 1
            target = replacements[rgb]['color']
            rgba[offset:offset+3] = bytes(target[k] for k in ('r', 'g', 'b'))
        assert source_counts == {tuple(bytes.fromhex(c['hex'][1:])): c['count'] for c in original['palette']}
        assert sum(source_counts.values()) == original['beads']
        rgba = bytes(rgba)
        occupied = {(i % 29, i // 29): tuple(rgba[i*4:i*4+3]) for i in range(841) if rgba[i*4+3]}
        counts = Counter(occupied.values())
        palette = [deepcopy(entries[ref]) for ref in item['colorMap'].values()]
        assert len({c['symbol'] for c in palette}) == len(palette)
        assert all(len(c['symbol']) == 1 for c in palette)
        result = deepcopy(project)
        result['savedAt'] = '2026-10-08T00:00:00.000Z'
        result['draft']['fileName'] = item['id'] + '-hama'
        result['draft']['selectedPaletteIds'] = ['hama']
        result['draft']['activePalettes'] = [{'name': 'Hama Midi', 'entries': palette}]
        result['draft']['editedPattern']['data'] = base64.b64encode(rgba).decode()
        materials = [{**entry, 'code': entry['ref'][1:],
                      'count': counts[tuple(entry['color'][k] for k in ('r', 'g', 'b'))]}
                     for entry in palette]
        variants.append({**item, 'rgba': rgba, 'source': source, 'project': result,
                         'occupied': occupied, 'materials': materials, 'beads': len(occupied),
                         'motif': [original['motifWidth'], original['motifHeight']]})
    return variants


def preview_image(p):
    pixels = Image.frombytes('RGBA', (29, 29), p['rgba'])
    preview = Image.new('RGBA', (580, 580), '#faf8f3')
    preview.alpha_composite(pixels.resize((580, 580), Image.Resampling.NEAREST))
    return preview.convert('RGB')


def write_pattern(p):
    folder = DEST / p['id']
    folder.mkdir(parents=True, exist_ok=True)
    Image.frombytes('RGBA', (29, 29), p['rgba']).save(folder / 'pixels.png', optimize=False)
    preview_image(p).save(folder / 'preview.png', optimize=False)
    (folder / 'pattern.bead-pattern.json').write_text(json.dumps(p['project'], indent=2) + '\n')
    for paper_id in PAPERS:
        write_pdf(p, paper_id)


def write_pdf(p, paper_id):
    paper_name, page_size = PAPERS[paper_id]
    page_width, page_height = page_size
    gx = (page_width/mm-GRID_MM)/2
    path = DEST / p['id'] / f'pattern-{paper_id}.pdf'
    pdf = canvas.Canvas(str(path), pagesize=page_size, invariant=1, pageCompression=1, lang='en-GB')
    pdf.setTitle(f"{p['name']} - Hama Midi Bead Pattern ({paper_name})")
    pdf.setAuthor('Fuse Bead Patterns team')
    pdf.setSubject('Original design; Hama Midi colour numbers; 29 x 29; 5 mm grid; print at 100%')
    pdf.setViewerPreference('PrintScaling', 'None')

    def text(x, y, value, size=8, color=INK, bold=False, align='left', max_mm=None):
        value.encode('cp1252')
        font = 'Helvetica-Bold' if bold else 'Helvetica'
        width = pdfmetrics.stringWidth(value, font, size)
        available = (page_width/mm-18-x) if align == 'left' else x-18
        assert width <= (max_mm if max_mm is not None else available)*mm, (p['id'], value)
        pdf.setFillColor(HexColor(color))
        pdf.setFont(font, size)
        getattr(pdf, 'drawRightString' if align == 'right' else 'drawString')(x*mm, page_height-y*mm, value)

    def line(x1, y1, x2, y2, width=.15, color='#a2aaa6'):
        pdf.setLineWidth(width*mm)
        pdf.setStrokeColor(HexColor(color))
        pdf.line(x1*mm, page_height-y1*mm, x2*mm, page_height-y2*mm)

    text(18, 13, 'FUSE BEAD PATTERNS', 8, MUTED)
    text(18, 24, p['name'], 23, bold=True)
    text(18, 31, f'Hama Midi bead pattern / 29 x 29 grid / {paper_name}', 9, MUTED)
    text(18, 37, f"{p['beads']} beads / {len(p['materials'])} colours / One square pegboard", 9)
    by_rgb = {tuple(c['color'][k] for k in ('r', 'g', 'b')): c for c in p['materials']}
    for (x, y), rgb in p['occupied'].items():
        pdf.setFillColorRGB(*(v/255 for v in rgb))
        pdf.rect((gx+x*PITCH)*mm, page_height-(GRID_TOP+(y+1)*PITCH)*mm,
                 PITCH*mm, PITCH*mm, fill=1, stroke=0)
        pdf.setFillColor(HexColor(INK if sum(v*k for v, k in zip(rgb, (.299,.587,.114))) > 150 else '#ffffff'))
        pdf.setFont('Helvetica', 7)
        pdf.drawCentredString((gx+(x+.5)*PITCH)*mm,
                              page_height-(GRID_TOP+(y+.5)*PITCH)*mm-2.2, by_rgb[rgb]['symbol'])
    for i in range(30):
        width, color = (.23, '#65736b') if i % 5 == 0 or i == 29 else (.1, '#a2aaa6')
        line(gx+i*PITCH, GRID_TOP, gx+i*PITCH, GRID_TOP+GRID_MM, width, color)
        line(gx, GRID_TOP+i*PITCH, gx+GRID_MM, GRID_TOP+i*PITCH, width, color)
    pdf.setFont('Helvetica', 5.5)
    pdf.setFillColor(HexColor(MUTED))
    for i in range(29):
        pdf.drawCentredString((gx+(i+.5)*PITCH)*mm, page_height-(GRID_TOP-1.5)*mm, str(i+1))
        pdf.drawRightString((gx-2)*mm, page_height-(GRID_TOP+(i+.5)*PITCH)*mm-2, str(i+1))

    text(18, 195, 'Hama Midi colours', 10, bold=True)
    for x in (18, 101):
        text(x, 201, 'Symbol / Colour number / Name', 7, MUTED)
        text(x+74, 201, 'Beads', 7, MUTED, align='right')
        line(x, 202.5, x+74, 202.5)
    for i, c in enumerate(p['materials']):
        x, y = 18+(i % 2)*83, 208+(i//2)*8
        pdf.setFillColorRGB(*(c['color'][k]/255 for k in ('r', 'g', 'b')))
        pdf.setStrokeColor(HexColor('#8c9590'))
        pdf.setLineWidth(.15*mm)
        pdf.rect(x*mm, page_height-(y+1)*mm, 4*mm, 4*mm, fill=1, stroke=1)
        text(x+6, y, c['symbol'], 8)
        text(x+13, y, c['code'], 8, bold=True)
        text(x+23, y, c['name'], 8, max_mm=42)
        text(x+74, y, str(c['count']), 8, align='right')
    text(18, 224, '01 = H01 in the editor. H is an editor prefix, not part of the Hama colour number.', 7.3, MUTED)
    text(18, 230, 'Blank squares need no beads. Follow the symbols and quantities shown above.', 7.5)
    text(18, 236, 'Colours on screen and paper are approximate. Check the numbers against your beads.', 7.3, MUTED)
    text(18, 242, 'Original design. Digitally checked; not physically assembled or iron-tested.', 7.3, MUTED)
    text(18, 248, 'Print at 100% / Actual size. Turn off Fit to page.', 8.5, bold=True)
    line(18, 256, 68, 256, .4, INK)
    for x in (18, 68):
        line(x, 254.5, x, 257.5, .4, INK)
    text(73, 257, '50 mm', 8, bold=True)
    # An independent vertical check detects unequal horizontal/vertical scaling.
    line(194, 204, 194, 254, .4, INK)
    for y in (204, 254):
        line(192.5, y, 195.5, y, .4, INK)
    text(194, 201, '50 mm', 7, bold=True, align='right')
    text(18, 263, 'Both scales must measure 50 mm. Check the 5 mm spacing against your own pegboard.', 7.2)
    text(18, 270, 'fusebeadpatterns.art/patterns/hama', 7, '#176752')
    text(page_width/mm-18, 270, 'Independent pattern; not an official Hama design.', 6.5, MUTED, align='right')
    pdf.linkURL(f"{COLLECTION_URL}#{p['id']}", (18*mm, page_height-272*mm, 87*mm, page_height-266*mm), relative=0)
    pdf.showPage()
    pdf.save()


def close(a, b):
    return abs(a-b) < .002


def check_pdf(p, paper_id):
    paper_name, page_size = PAPERS[paper_id]
    gx = (page_size[0]/mm-GRID_MM)/2
    path = DEST / p['id'] / f'pattern-{paper_id}.pdf'
    reader = PdfReader(path)
    assert len(reader.pages) == 1
    assert reader.metadata.title == f"{p['name']} - Hama Midi Bead Pattern ({paper_name})"
    assert reader.trailer['/Root']['/Lang'] == 'en-GB'
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    assert [a.get_object()['/A']['/URI'] for a in reader.pages[0]['/Annots']] == [f"{COLLECTION_URL}#{p['id']}"]
    with pdfplumber.open(path) as doc:
        page = doc.pages[0]
        assert close(page.width, page_size[0]) and close(page.height, page_size[1])
        content = page.extract_text()
        for phrase in (p['name'], 'Hama Midi', paper_name, '29 x 29', 'Blank squares need no beads.',
                       'H is an editor prefix', 'not physically assembled or iron-tested.',
                       '100% / Actual size', 'Turn off Fit to page.', 'Both scales must measure 50 mm.',
                       '5 mm spacing', 'Independent pattern; not an official Hama design.'):
            assert phrase in content, (p['id'], paper_id, phrase)
        assert f"{p['beads']} beads / {len(p['materials'])} colours" in content
        assert not any(s in content for s in ('STUDY', 'study', 'Perler', 'build', '(cid:', '\ufffd', '■'))
        assert all(c['x0'] >= 17*mm and c['x1'] <= page.width-13*mm and
                   c['top'] >= 8*mm and c['bottom'] <= page.height-7*mm for c in page.chars)
        cells = {}
        for rect in page.rects:
            if close(rect['width'], PITCH*mm) and close(rect['height'], PITCH*mm):
                x, y = (rect['x0']/mm-gx)/PITCH, (rect['top']/mm-GRID_TOP)/PITCH
                assert close(x, round(x)) and close(y, round(y))
                xy = (round(x), round(y))
                assert xy not in cells and 0 <= xy[0] < 29 and 0 <= xy[1] < 29
                assert rect['fill'] is True
                cells[xy] = tuple(round(v*255) for v in rect['non_stroking_color'])
        assert cells == p['occupied']
        symbols = {}
        for char in page.chars:
            x, y = (char['x0']+char['x1'])/2/mm, (char['top']+char['bottom'])/2/mm
            if gx < x < gx+GRID_MM and GRID_TOP < y < GRID_TOP+GRID_MM:
                xy = (int((x-gx)//PITCH), int((y-GRID_TOP)//PITCH))
                assert xy not in symbols
                symbols[xy] = char['text']
        by_rgb = {tuple(c['color'][k] for k in ('r', 'g', 'b')): c['symbol'] for c in p['materials']}
        assert symbols == {xy: by_rgb[rgb] for xy, rgb in p['occupied'].items()}
        assert Counter(symbols.values()) == {c['symbol']: c['count'] for c in p['materials']}
        for i in range(30):
            assert any(close(l['x0'], gx*mm) and close(l['x1'], (gx+GRID_MM)*mm) and
                       close(l['top'], (GRID_TOP+i*PITCH)*mm) and close(l['height'], 0) for l in page.lines)
            assert any(close(l['x0'], (gx+i*PITCH)*mm) and close(l['top'], GRID_TOP*mm) and
                       close(l['bottom'], (GRID_TOP+GRID_MM)*mm) and close(l['width'], 0) for l in page.lines)
        assert any(close(l['x0'], 18*mm) and close(l['x1'], 68*mm) and
                   close(l['top'], 256*mm) and close(l['height'], 0) for l in page.lines)
        assert any(close(l['x0'], 194*mm) and close(l['top'], 204*mm) and
                   close(l['bottom'], 254*mm) and close(l['width'], 0) for l in page.lines)
        for i, c in enumerate(p['materials']):
            x, y = 18+(i % 2)*83, 208+(i//2)*8
            block = page.crop(((x-.5)*mm, (y-4)*mm, (x+75)*mm, (y+2)*mm)).extract_text()
            assert all(v in block for v in (c['code'], c['name'], c['symbol']))
            assert block.split()[-1] == str(c['count'])
    return {'file': str(path.relative_to(ROOT)), 'sha256': digest(path.read_bytes()),
            'paper': paper_name, 'pageCount': 1, 'pageMm': [round(v/mm, 3) for v in page_size],
            'gridAndSymbolsMatchProject': True, 'materialTableMatches': True,
            'pitchMm': 5, 'horizontalScaleMm': 50, 'verticalScaleMm': 50,
            'printScaling': 'None', 'textAndBoundsChecked': True}


def check_pattern(p):
    folder = DEST / p['id']
    project = json.loads((folder / 'pattern.bead-pattern.json').read_text())
    assert project == p['project']
    rgba = base64.b64decode(project['draft']['editedPattern']['data'], validate=True)
    assert rgba == p['rgba'] and rgba[3::4] == p['source'][3::4]
    for i in range(0, len(rgba), 4):
        if not rgba[i+3]:
            assert rgba[i:i+4] == p['source'][i:i+4], 'Empty cell bytes changed'
    with Image.open(folder / 'pixels.png') as image:
        assert image.mode == 'RGBA' and image.size == (29, 29) and image.tobytes() == rgba
    with Image.open(folder / 'preview.png') as image:
        assert image.mode == 'RGB' and image.size == (580, 580)
        assert image.tobytes() == preview_image(p).tobytes()
    pdfs = [check_pdf(p, paper) for paper in PAPERS]
    files = {file.name: digest(file.read_bytes()) for file in folder.iterdir() if file.is_file()}
    assert set(files) == {'preview.png', 'pixels.png', 'pattern.bead-pattern.json', 'pattern-a4.pdf', 'pattern-letter.pdf'}
    return {'id': p['id'], 'name': p['name'], 'beads': p['beads'], 'gridCells': [29, 29],
            'motifCells': p['motif'], 'colorMap': p['colorMap'],
            'materials': [{k: c[k] for k in ('ref', 'code', 'name', 'symbol', 'count')} for c in p['materials']],
            'sourceRgbaSha256': digest(p['source']), 'hamaRgbaSha256': digest(rgba),
            'sameOccupiedCellsAndAlpha': True, 'pngProjectAndPreviewMatch': True,
            'fileSha256': files, 'pdfs': pdfs}


def existing_asset_hashes():
    roots = ('public/patterns', 'public/patterns-ja', 'public/patterns-de',
             'public/patterns-fr', 'public/guides', 'public/printables', 'public/palettes')
    return {str(p.relative_to(ROOT)): digest(p.read_bytes())
            for base in roots for p in (ROOT/base).rglob('*') if p.is_file()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--qa-report', type=Path)
    args = parser.parse_args()
    before = existing_asset_hashes()
    variants = load_variants()
    if not args.check_only:
        for p in variants:
            write_pattern(p)
    results = [check_pattern(p) for p in variants]
    assert existing_asset_hashes() == before, 'An existing published asset changed'
    report = {'status': 'pass', 'checkedAt': '2026-10-08',
              'scope': 'Digital assets only; physical assembly, ironing and publication unverified',
              'existingAssetsUnchanged': len(before), 'variantCount': 6, 'pdfCount': 12,
              'fileCount': sum(len(r['fileSha256']) for r in results),
              'colourSource': 'https://hama.dk/en/pages/colour-chart',
              'sourceColourChart': 'https://cdn.shopify.com/s/files/1/0726/3771/0492/files/Midi_-_Colour_palette.pdf?v=1777369953',
              'paletteCsvSha256': digest((ROOT/'public/palettes/hama.csv').read_bytes()),
              'physicalTested': False, 'patterns': results}
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True, exist_ok=True)
        args.qa_report.write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n')
    print(json.dumps({'status': 'pass', 'variants': 6, 'pdfs': 12, 'files': 30,
                      'existingAssetsUnchanged': len(before)}))


if __name__ == '__main__':
    main()

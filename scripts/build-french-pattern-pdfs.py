"""Build/check nine French A4 PDFs from existing reviewed Perler/Hama projects.

Requires reportlab, Pillow, pypdf and pdfplumber; no network or downloaded fonts.
Run: python3 scripts/build-french-pattern-pdfs.py [--check-only] [--qa-report PATH]
This script never rematches colours or writes projects, pixels or old PDFs.
See README-french-pattern-pdfs.md for the protected legacy Christmas files.
"""
import argparse
import base64
from collections import Counter
import csv
from hashlib import sha256
import json
from pathlib import Path
import re

import pdfplumber
from PIL import Image
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
COLLECTION = 'https://fusebeadpatterns.art/fr/modeles-perles-a-repasser'
IDS = ('original-soccer-ball', 'original-friendly-ghost', 'original-halloween-bat',
       'original-christmas-tree', 'original-snowman', 'original-gingerbread-man')
GX, GY, PITCH, GRID = 32.5, 47.0, 5.0, 145.0
INK, MUTED = '#25342e', '#59655f'
COLORS_FR = {
    'White': 'Blanc', 'Black': 'Noir', 'Purple': 'Violet', 'Yellow': 'Jaune',
    'Orange': 'Orange', 'Red': 'Rouge', 'Green': 'Vert', 'Brown': 'Marron',
    'Nougat': 'Nougat',
}
OUTPUTS = {ROOT / f'public/{folder}/{ident}/pattern.pdf'
           for folder, ids in (('patterns-fr', IDS[:3]), ('patterns-fr-hama', IDS)) for ident in ids}


def digest(data):
    return sha256(data).hexdigest()


def protected_hashes():
    return {str(path.relative_to(ROOT)): digest(path.read_bytes())
            for path in (ROOT / 'public').rglob('*') if path.is_file() and path not in OUTPUTS}


def components(points):
    unseen = set(points)
    sizes = []
    while unseen:
        todo = [unseen.pop()]
        count = 0
        while todo:
            x, y = todo.pop()
            count += 1
            for point in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
                if point in unseen:
                    unseen.remove(point)
                    todo.append(point)
        sizes.append(count)
    return sorted(sizes, reverse=True)


def read_project(path, palette_id, pixels_path):
    project = json.loads(path.read_text())
    assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
    draft = project['draft']
    assert draft['selectedPaletteIds'] == [palette_id]
    assert (draft['boardId'], draft['boardWidth'], draft['boardHeight']) == ('midi', 1, 1)
    edited = draft['editedPattern']
    rgba = base64.b64decode(edited['data'], validate=True)
    assert (edited['width'], edited['height'], edited['byteLength'], len(rgba)) == (29, 29, 3364, 3364)
    with Image.open(pixels_path) as image:
        assert image.size == (29, 29) and image.convert('RGBA').tobytes() == rgba
    assert all(value in (0, 255) for value in rgba[3::4])
    occupied = {(i % 29, i // 29): tuple(rgba[4*i:4*i+3]) for i in range(841) if rgba[4*i+3]}
    assert components(occupied) == [len(occupied)]
    entries = [entry for palette in draft['activePalettes'] for entry in palette['entries']]
    assert len(entries) <= 4
    assert len(set(entry['symbol'] for entry in entries)) == len(entries)
    assert all(len(entry['symbol']) == 1 for entry in entries)
    counts = Counter(occupied.values())
    assert len(counts) == len(entries)
    materials = []
    for entry in entries:
        rgb = tuple(entry['color'][key] for key in ('r', 'g', 'b'))
        assert entry['color']['a'] == 255 and rgb in counts
        materials.append({**entry, 'rgb': rgb, 'count': counts[rgb]})
    return {'rgba': rgba, 'occupied': occupied, 'materials': materials,
            'project': str(path.relative_to(ROOT)), 'pixels': str(pixels_path.relative_to(ROOT))}


def load_patterns():
    manifest = json.loads((ROOT / 'src/lib/patterns/french-patterns.json').read_text())
    assert tuple(item['id'] for item in manifest['patterns']) == IDS
    names = {item['id']: item['name'] for item in manifest['patterns']}
    legacy = json.loads((ROOT / 'src/lib/patterns/french-christmas.json').read_text())['patterns']
    assert all(names[item['id']] == item['name'] for item in legacy)
    match = re.search(r'export const patterns: Pattern\[\] = (\[.*?\]);',
                      (ROOT / 'src/lib/patterns/catalog.ts').read_text(), re.S)
    assert match
    catalog = {item['id']: item for item in json.loads(match[1])}
    hama_map = {item['id']: item['colorMap'] for item in json.loads((ROOT / 'src/lib/patterns/hama.json').read_text())['patterns']}
    with (ROOT / 'public/palettes/hama.csv').open(newline='') as stream:
        hama_csv = {row[0]: row for row in csv.reader(stream)}
    selected = []
    for ident in IDS:
        original = catalog[ident]
        assert original['source'] is None and original['collectionId'] is None
        assert original['version'].startswith('Original ')
        source = read_project(ROOT/'public'/original['assets']['project'].lstrip('/'), 'perler',
                              ROOT/'public'/original['assets']['pixels'].lstrip('/'))
        assert len(source['occupied']) == original['beads']
        assert len(source['materials']) == original['colorCount']
        source_entries = {entry['ref']: entry for entry in source['materials']}
        for color in original['palette']:
            entry = source_entries[color['ref']]
            assert all(entry[key] == color[key] for key in ('name', 'symbol', 'count'))
            assert entry['rgb'] == tuple(bytes.fromhex(color['hex'][1:]))
        if ident in IDS[:3]:
            # Preserve the catalog's material order and its exact symbols/references.
            material_order = [source_entries[color['ref']] for color in original['palette']]
            selected.append({**source, 'id': ident, 'name': names[ident], 'brand': 'Perler',
                             'materials': material_order, 'dest': ROOT/f'public/patterns-fr/{ident}/pattern.pdf'})
        folder = ROOT / f'public/patterns-hama/{ident}'
        hama = read_project(folder/'pattern.bead-pattern.json', 'hama', folder/'pixels.png')
        assert hama['rgba'][3::4] == source['rgba'][3::4]
        assert set(hama['occupied']) == set(source['occupied'])
        assert {entry['ref'] for entry in hama['materials']} == set(hama_map[ident].values())
        target_entries = {entry['ref']: entry for entry in hama['materials']}
        source_rgb_map = {entry['rgb']: entry for entry in source['materials']}
        for entry in hama['materials']:
            row = hama_csv[entry['ref']]
            assert [entry['ref'], entry['name'], entry['symbol']] == row[:3]
            assert entry['rgb'] == tuple(map(int, row[3:6]))
        # Verify the already-published mapping; do not calculate new nearest colours.
        for xy, rgb in source['occupied'].items():
            ref = hama_map[ident][source_rgb_map[rgb]['ref']]
            assert hama['occupied'][xy] == target_entries[ref]['rgb']
        selected.append({**hama, 'id': ident, 'name': names[ident], 'brand': 'Hama',
                         'dest': ROOT/f'public/patterns-fr-hama/{ident}/pattern.pdf'})
    assert {item['dest'] for item in selected} == OUTPUTS
    for item in selected:
        assert all(entry['name'] in COLORS_FR for entry in item['materials'])
    return selected


def ink(rgb):
    linear = [value/255/12.92 if value/255 <= .04045 else ((value/255+.055)/1.055)**2.4 for value in rgb]
    luminance = sum(value*weight for value, weight in zip(linear, (.2126, .7152, .0722)))
    return '#000000' if (luminance+.05)/.05 >= 1.05/(luminance+.05) else '#ffffff'


def build(item):
    path = item['dest']
    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path), pagesize=A4, invariant=1, pageCompression=1, lang='fr-FR')
    pdf.setTitle(f"{item['name']} - {item['brand']} Midi - Modèle de perles à repasser")
    pdf.setAuthor('Fuse Bead Patterns team')
    pdf.setSubject('Modèle original indépendant; grille 29 x 29; pas de 5 mm; A4 à 100%')
    pdf.setViewerPreference('PrintScaling', 'None')

    def text(x, y, value, size=8, color=INK, bold=False, right=False, max_mm=None):
        value.encode('cp1252')
        font = 'Helvetica-Bold' if bold else 'Helvetica'
        width = pdfmetrics.stringWidth(value, font, size)
        available = (x-18) if right else (192-x)
        assert width <= (max_mm if max_mm is not None else available)*mm, (item['id'], value, width/mm)
        pdf.setFont(font, size)
        pdf.setFillColor(HexColor(color))
        getattr(pdf, 'drawRightString' if right else 'drawString')(x*mm, A4[1]-y*mm, value)

    def line(x1, y1, x2, y2, width=.15, color='#a2aaa6'):
        pdf.setLineWidth(width*mm)
        pdf.setStrokeColor(HexColor(color))
        pdf.line(x1*mm, A4[1]-y1*mm, x2*mm, A4[1]-y2*mm)

    text(18, 13, 'FUSE BEAD PATTERNS', 8, MUTED)
    text(18, 24, item['name'], 22, bold=True)
    text(18, 31, f"Modèle original / perles Midi {item['brand']} / motif plat", 8.5, MUTED)
    text(18, 37, f"29 x 29 cases / 1 plaque carrée / {len(item['occupied'])} perles / {len(item['materials'])} couleurs", 9)
    text(18, 42, 'Laissez les cases vides sans perles.', 8, MUTED)
    by_rgb = {entry['rgb']: entry for entry in item['materials']}
    for (x, y), rgb in item['occupied'].items():
        pdf.setFillColorRGB(*(value/255 for value in rgb))
        pdf.rect((GX+x*PITCH)*mm, A4[1]-(GY+(y+1)*PITCH)*mm, PITCH*mm, PITCH*mm, stroke=0, fill=1)
        pdf.setFillColor(HexColor(ink(rgb)))
        pdf.setFont('Helvetica', 8)
        pdf.drawCentredString((GX+(x+.5)*PITCH)*mm, A4[1]-(GY+(y+.5)*PITCH)*mm-2.5, by_rgb[rgb]['symbol'])
    for index in range(30):
        width, color = (.23, '#65736b') if index % 5 == 0 or index == 29 else (.1, '#a2aaa6')
        line(GX+index*PITCH, GY, GX+index*PITCH, GY+GRID, width, color)
        line(GX, GY+index*PITCH, GX+GRID, GY+index*PITCH, width, color)
    pdf.setFont('Helvetica', 5.5)
    pdf.setFillColor(HexColor(MUTED))
    for index in range(29):
        pdf.drawCentredString((GX+(index+.5)*PITCH)*mm, A4[1]-(GY-1.5)*mm, str(index+1))
        pdf.drawRightString((GX-2)*mm, A4[1]-(GY+(index+.5)*PITCH)*mm-2, str(index+1))

    text(18, 200, 'Liste de matériel', 10, bold=True)
    for x, label in ((18, 'Symbole'), (42, 'Référence Perler' if item['brand'] == 'Perler' else 'Numéro Hama'),
                     (78, 'Couleur'), (115, 'Nom du nuancier (anglais)')):
        text(x, 206, label, 7, MUTED)
    text(181, 206, 'Quantité', 7, MUTED, right=True)
    line(18, 208, 181, 208)
    for index, entry in enumerate(item['materials']):
        y = 214 + index*8
        pdf.setFillColorRGB(*(value/255 for value in entry['rgb']))
        pdf.setStrokeColor(HexColor('#8c9590'))
        pdf.setLineWidth(.15*mm)
        pdf.rect(18*mm, A4[1]-(y+1)*mm, 4*mm, 4*mm, fill=1, stroke=1)
        text(26, y, entry['symbol'], 8.5)
        text(42, y, entry['ref'] if item['brand'] == 'Perler' else entry['ref'][1:], 8.5)
        text(78, y, COLORS_FR[entry['name']], 8.5, max_mm=35)
        text(115, y, entry['name'], 8.5, max_mm=53)
        text(181, y, str(entry['count']), 8.5, right=True)
    if item['brand'] == 'Hama':
        text(18, 244, '01 = H01 dans l’éditeur. H est un préfixe interne, pas une partie du numéro Hama.', 7.2, MUTED)
    else:
        text(18, 244, 'Références Perler d’origine ; ce ne sont pas des numéros Hama ou Artkal.', 7.2, MUTED)
    text(18, 249, 'Couleurs à l’écran et sur papier approximatives. Vérifiez les références de vos perles.', 7.2, MUTED)
    text(18, 254, 'Modèle indépendant, non officiel. Non assemblé et non testé au fer.', 7.2, MUTED)
    text(18, 261, 'Imprimez sur A4 à 100% / taille réelle. Désactivez « Ajuster à la page ».', 8.5, bold=True)
    line(18, 273, 68, 273, .4, INK)
    for x in (18, 68):
        line(x, 271.5, x, 274.5, .4, INK)
    text(73, 274, '50 mm', 8, bold=True)
    line(194, 217, 194, 267, .4, INK)
    for y in (217, 267):
        line(192.5, y, 195.5, y, .4, INK)
    text(194, 213, '50 mm', 7, bold=True, right=True)
    text(18, 281, 'Les deux repères doivent mesurer 50 mm. Vérifiez le pas de 5 mm sur votre plaque.', 7.5)
    text(18, 290, 'Modèles et téléchargements : fusebeadpatterns.art/fr/modeles-perles-a-repasser', 7, '#176752')
    pdf.linkURL(f"{COLLECTION}#{item['id']}", (18*mm, A4[1]-292*mm, 192*mm, A4[1]-286*mm), relative=0)
    pdf.showPage()
    pdf.save()


def close(a, b):
    return abs(a-b) < .002


def check(item):
    path = item['dest']
    reader = PdfReader(path)
    assert len(reader.pages) == 1
    assert reader.trailer['/Root']['/Lang'] == 'fr-FR'
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    assert reader.metadata.title == f"{item['name']} - {item['brand']} Midi - Modèle de perles à repasser"
    assert [annot.get_object()['/A']['/URI'] for annot in reader.pages[0]['/Annots']] == [f"{COLLECTION}#{item['id']}"]
    with pdfplumber.open(path) as document:
        page = document.pages[0]
        assert close(page.width, 210*mm) and close(page.height, 297*mm)
        content = page.extract_text()
        for phrase in (item['name'], f"Midi {item['brand']}", 'Liste de matériel', 'Quantité', '29 x 29',
                       'Laissez les cases vides sans perles.', 'non officiel', 'Non assemblé et non testé au fer.',
                       '100% / taille réelle', 'Désactivez « Ajuster à la page ».', 'Les deux repères doivent mesurer 50 mm.',
                       '5 mm', 'fusebeadpatterns.art/fr/modeles-perles-a-repasser'):
            assert phrase in content, (item['id'], item['brand'], phrase)
        assert f"{len(item['occupied'])} perles / {len(item['materials'])} couleurs" in content
        assert not any(value in content for value in ('STUDY', 'study', 'prototype', 'candidate', '(cid:', '\ufffd', '■'))
        if item['brand'] == 'Hama':
            assert 'H est un préfixe interne, pas une partie du numéro Hama.' in content
            assert 'Perler' not in content
        else:
            assert 'Références Perler d’origine' in content
        assert all(char['x0'] >= 17*mm and char['x1'] <= 196*mm and char['top'] >= 8*mm and char['bottom'] <= 292*mm for char in page.chars)
        cells = {}
        for rect in page.rects:
            if close(rect['width'], PITCH*mm) and close(rect['height'], PITCH*mm):
                x, y = (rect['x0']/mm-GX)/PITCH, (rect['top']/mm-GY)/PITCH
                assert close(x, round(x)) and close(y, round(y))
                xy = (round(x), round(y))
                assert xy not in cells and 0 <= xy[0] < 29 and 0 <= xy[1] < 29
                assert rect['fill'] is True
                cells[xy] = tuple(round(value*255) for value in rect['non_stroking_color'])
        assert cells == item['occupied']
        symbols = {}
        by_rgb = {entry['rgb']: entry for entry in item['materials']}
        for char in page.chars:
            x, y = (char['x0']+char['x1'])/2/mm, (char['top']+char['bottom'])/2/mm
            if GX < x < GX+GRID and GY < y < GY+GRID:
                xy = (int((x-GX)//PITCH), int((y-GY)//PITCH))
                assert xy not in symbols and close(char['size'], 8)
                symbols[xy] = char['text']
        assert symbols == {xy: by_rgb[rgb]['symbol'] for xy, rgb in item['occupied'].items()}
        assert Counter(symbols.values()) == {entry['symbol']: entry['count'] for entry in item['materials']}
        for index in range(30):
            assert any(close(line['x0'], GX*mm) and close(line['x1'], (GX+GRID)*mm) and close(line['top'], (GY+index*PITCH)*mm) and close(line['height'], 0) for line in page.lines)
            assert any(close(line['x0'], (GX+index*PITCH)*mm) and close(line['top'], GY*mm) and close(line['bottom'], (GY+GRID)*mm) and close(line['width'], 0) for line in page.lines)
        assert any(close(line['x0'], 18*mm) and close(line['x1'], 68*mm) and close(line['top'], 273*mm) and close(line['height'], 0) for line in page.lines)
        assert any(close(line['x0'], 194*mm) and close(line['top'], 217*mm) and close(line['bottom'], 267*mm) and close(line['width'], 0) for line in page.lines)
        for index, entry in enumerate(item['materials']):
            y = 214+index*8
            block = page.crop((17*mm, (y-4)*mm, 182*mm, (y+2)*mm)).extract_text()
            ref = entry['ref'] if item['brand'] == 'Perler' else entry['ref'][1:]
            assert all(value in block for value in (entry['symbol'], ref, entry['name'], COLORS_FR[entry['name']]))
            assert block.split()[-1] == str(entry['count'])
    return {'id': item['id'], 'name': item['name'], 'brand': item['brand'],
            'pdf': str(path.relative_to(ROOT)), 'sha256': digest(path.read_bytes()),
            'sourceProject': item['project'], 'sourcePixels': item['pixels'], 'sourceRgbaSha256': digest(item['rgba']),
            'beads': len(cells), 'materials': [{key: entry[key] for key in ('ref', 'name', 'symbol', 'count')} for entry in item['materials']],
            'fourConnectedComponentSizes': components(cells), 'pageCount': 1, 'pageMm': [210, 297],
            'gridCells': [29, 29], 'pitchMm': 5, 'scaleLinesMm': {'horizontal': 50, 'vertical': 50},
            'sourcePixelsAndSymbolsMatch': True, 'materialTableMatch': True, 'glyphsAndPageBoundsChecked': True,
            'physicalTested': False, 'intendedSourceUrl': f"{COLLECTION}#{item['id']}"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--qa-report', type=Path)
    args = parser.parse_args()
    before = protected_hashes()
    selected = load_patterns()
    if not args.check_only:
        for item in selected:
            build(item)
    results = [check(item) for item in selected]
    assert protected_hashes() == before, 'An existing public asset changed'
    legacy = {f'public/patterns-fr/{ident}/pattern.pdf': before[f'public/patterns-fr/{ident}/pattern.pdf'] for ident in IDS[3:]}
    report = {'status': 'pass', 'scope': 'Digital files only; physical assembly, ironing and publication unverified',
              'pdfCount': len(results), 'protectedPublicFilesUnchanged': len(before),
              'legacyFrenchChristmasPdfSha256Unchanged': legacy, 'assets': results}
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True, exist_ok=True)
        args.qa_report.write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n')
    print(json.dumps({'status': 'pass', 'pdfCount': len(results), 'protectedPublicFilesUnchanged': len(before)}))


if __name__ == '__main__':
    main()

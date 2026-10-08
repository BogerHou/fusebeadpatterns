"""Build/check three French A4 Christmas PDFs from reviewed original pixels.

Requires reportlab, Pillow, pypdf and pdfplumber. No network calls or fonts
downloaded. Run: python3 scripts/build-french-christmas-pdfs.py
Add --check-only to validate committed PDFs, or --qa-report PATH for evidence.
The collection URL is the intended publication target, not a deployment check.
"""
import argparse
import base64
from collections import Counter
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
DEST = ROOT / 'public/patterns-fr'
COLLECTION_URL = 'https://fusebeadpatterns.art/fr/modeles-perles-a-repasser-noel'
IDS = ('original-christmas-tree', 'original-snowman', 'original-gingerbread-man')
GX, GY, PITCH = 32.5, 49.0, 5.0
INK, MUTED = '#25342e', '#59655f'
FRENCH_COLORS = {
    '80-15199': 'Vert trèfle',
    '80-19005': 'Rouge',
    '80-19003': 'Jaune',
    '80-19012': 'Marron',
    '80-19001': 'Blanc',
    '80-19018': 'Noir',
    '80-19004': 'Orange',
    '80-15250': 'Brun pain d’épices',
}


def selected_patterns():
    selection = json.loads((ROOT / 'src/lib/patterns/french-christmas.json').read_text())['patterns']
    assert tuple(p['id'] for p in selection) == IDS
    match = re.search(r'export const patterns: Pattern\[\] = (\[.*?\]);',
                      (ROOT / 'src/lib/patterns/catalog.ts').read_text(), re.S)
    assert match, 'Catalog JSON not found'
    catalog = {p['id']: p for p in json.loads(match[1])}
    selected = []
    for local in selection:
        p = catalog[local['id']]
        assert p['source'] is None and p['collectionId'] is None
        assert p['version'].startswith('Original ')
        project = json.loads((ROOT / 'public' / p['assets']['project'].lstrip('/')).read_text())
        assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
        draft = project['draft']
        edited = draft['editedPattern']
        rgba = base64.b64decode(edited['data'], validate=True)
        with Image.open(ROOT / 'public' / p['assets']['pixels'].lstrip('/')) as image:
            assert image.size == (29, 29)
            assert image.convert('RGBA').tobytes() == rgba
        assert (edited['width'], edited['height'], len(rgba), edited['byteLength']) == (29, 29, 3364, 3364)
        assert (p['gridWidth'], p['gridHeight']) == (29, 29)
        assert (draft['boardId'], draft['boardWidth'], draft['boardHeight']) == ('midi', 1, 1)
        assert draft['selectedPaletteIds'] == ['perler']
        occupied = {(i % 29, i // 29): tuple(rgba[4*i:4*i+3]) for i in range(841) if rgba[4*i+3]}
        assert all(rgba[4*i+3] in (0, 255) for i in range(841))
        assert len(occupied) == p['beads']
        assert Counter(occupied.values()) == {tuple(bytes.fromhex(c['hex'][1:])): c['count'] for c in p['palette']}
        assert len(p['palette']) == p['colorCount']
        assert len({c['symbol'] for c in p['palette']}) == len(p['palette'])
        entries = {c['ref']: c for palette in draft['activePalettes'] for c in palette['entries']}
        for c in p['palette']:
            assert c['ref'] in FRENCH_COLORS
            assert len(c['symbol']) == 1
            assert (entries[c['ref']]['name'], entries[c['ref']]['symbol']) == (c['name'], c['symbol'])
            assert tuple(entries[c['ref']]['color'][k] for k in ('r', 'g', 'b')) == tuple(bytes.fromhex(c['hex'][1:]))
        xs, ys = zip(*occupied)
        assert (max(xs)-min(xs)+1, max(ys)-min(ys)+1) == (p['motifWidth'], p['motifHeight'])
        selected.append({**p, **local, 'rgba': rgba, 'occupied': occupied})
    return selected


def build(p):
    path = DEST / p['id'] / 'pattern.pdf'
    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path), pagesize=A4, invariant=1, pageCompression=1, lang='fr-FR')
    pdf.setTitle(f"{p['name']} - Modèle de perles à repasser")
    pdf.setAuthor('Fuse Bead Patterns team')
    pdf.setSubject('Modèle original; 29 x 29 cases; pas de 5 mm; références Perler; A4 à 100%')
    pdf.setViewerPreference('PrintScaling', 'None')

    def text(x, y, value, size=8, color=INK, align='left', bold=False, max_width=None):
        value.encode('cp1252')
        font = 'Helvetica-Bold' if bold else 'Helvetica'
        width = pdfmetrics.stringWidth(value, font, size)
        available = (192-x)*mm if align == 'left' else (x-18)*mm
        assert width <= (max_width if max_width is not None else available), (p['id'], value, width/mm)
        pdf.setFont(font, size)
        pdf.setFillColor(HexColor(color))
        getattr(pdf, 'drawRightString' if align == 'right' else 'drawString')(x*mm, A4[1]-y*mm, value)

    def line(x1, y1, x2, y2, width=.15, color='#a2aaa6'):
        pdf.setLineWidth(width*mm)
        pdf.setStrokeColor(HexColor(color))
        pdf.line(x1*mm, A4[1]-y1*mm, x2*mm, A4[1]-y2*mm)

    text(18, 14, 'FUSE BEAD PATTERNS', 8, MUTED)
    text(18, 25, p['name'], 22, bold=True)
    text(18, 32, 'Modèle original / perles MIDI Perler / motif plat', 8.5, MUTED)
    text(18, 38, f"29 x 29 cases / 1 plaque carrée / {p['beads']} perles / {p['colorCount']} couleurs", 9)
    text(18, 43, f"Motif : {p['motifWidth']} x {p['motifHeight']} cases. Laissez les cases vides sans perles.", 8, MUTED)
    color_by_rgb = {tuple(bytes.fromhex(c['hex'][1:])): c for c in p['palette']}
    for (x, y), rgb in p['occupied'].items():
        c = color_by_rgb[rgb]
        pdf.setFillColorRGB(*(v/255 for v in rgb))
        pdf.rect((GX+x*PITCH)*mm, A4[1]-(GY+(y+1)*PITCH)*mm, PITCH*mm, PITCH*mm, stroke=0, fill=1)
        pdf.setFillColor(HexColor(INK if sum(v*k for v, k in zip(rgb, (.299, .587, .114))) > 150 else '#ffffff'))
        pdf.setFont('Helvetica', 6.5)
        pdf.drawCentredString((GX+(x+.5)*PITCH)*mm, A4[1]-(GY+(y+.5)*PITCH)*mm-2.1, c['symbol'])
    for i in range(30):
        width, color = (.23, '#65736b') if i % 5 == 0 or i == 29 else (.1, '#a2aaa6')
        line(GX+i*PITCH, GY, GX+i*PITCH, GY+145, width, color)
        line(GX, GY+i*PITCH, GX+145, GY+i*PITCH, width, color)
    for i in range(29):
        pdf.setFont('Helvetica', 5.5)
        pdf.setFillColor(HexColor(MUTED))
        pdf.drawCentredString((GX+(i+.5)*PITCH)*mm, A4[1]-(GY-1.5)*mm, str(i+1))
        pdf.drawRightString((GX-2)*mm, A4[1]-(GY+(i+.5)*PITCH)*mm-2, str(i+1))

    text(18, 202, 'Liste de matériel', 10, bold=True)
    text(55, 202, 'Références et noms Perler d’origine, avec repères de couleur en français.', 7.5, MUTED)
    for x, label in ((18, 'Symbole'), (42, 'Référence Perler'), (78, 'Couleur'), (132, 'Nom du produit (anglais)')):
        text(x, 209, label, 7, MUTED)
    text(192, 209, 'Quantité', 7, MUTED, align='right')
    line(18, 211, 192, 211)
    for index, c in enumerate(p['palette']):
        y = 218+index*8
        pdf.setFillColor(HexColor(c['hex']))
        pdf.setStrokeColor(HexColor('#8c9590'))
        pdf.setLineWidth(.15*mm)
        pdf.rect(18*mm, A4[1]-(y+1)*mm, 4*mm, 4*mm, fill=1, stroke=1)
        text(26, y, c['symbol'], 8.5)
        text(42, y, c['ref'], 8.5)
        text(78, y, FRENCH_COLORS[c['ref']], 8.5, max_width=52*mm)
        text(132, y, c['name'], 8.5, max_width=44*mm)
        text(192, y, str(c['count']), 8.5, align='right')
    text(18, 253, 'Les références indiquées sont celles de Perler, pas celles de Hama ou d’Artkal.', 7.5, MUTED)
    text(18, 258, 'Modèle non assemblé ni testé au fer. Les couleurs à l’écran et sur papier peuvent varier.', 7.5, MUTED)
    text(18, 265, 'Imprimez sur A4 à 100% / taille réelle. Désactivez « Ajuster à la page ».', 8.5, bold=True)
    text(18, 271, 'Grille au pas de 5 mm : mesurez le repère et vérifiez l’espacement sur votre plaque.', 7.5, MUTED)
    line(18, 280, 68, 280, .4, INK)
    line(18, 278.5, 18, 281.5, .4, INK)
    line(68, 278.5, 68, 281.5, .4, INK)
    text(73, 281, 'Cette ligne doit mesurer 50 mm sur le papier.', 7.5)
    text(18, 289, 'Modèles et téléchargements : fusebeadpatterns.art/fr/modeles-perles-a-repasser-noel', 7, '#176752')
    pdf.linkURL(f"{COLLECTION_URL}#{p['id']}",
                (18*mm, A4[1]-291*mm, 192*mm, A4[1]-285*mm), relative=0)
    pdf.showPage()
    pdf.save()
    return path


def connected_components(points):
    remaining = set(points)
    sizes = []
    while remaining:
        todo = [remaining.pop()]
        n = 0
        while todo:
            x, y = todo.pop()
            n += 1
            for q in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
                if q in remaining:
                    remaining.remove(q)
                    todo.append(q)
        sizes.append(n)
    return sorted(sizes, reverse=True)


def check(p):
    path = DEST / p['id'] / 'pattern.pdf'
    reader = PdfReader(path)
    assert len(reader.pages) == 1
    assert reader.trailer['/Root']['/Lang'] == 'fr-FR'
    assert reader.metadata.title == f"{p['name']} - Modèle de perles à repasser"
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    page = reader.pages[0]
    assert [a.get_object()['/A']['/URI'] for a in page['/Annots']] == [f"{COLLECTION_URL}#{p['id']}"]

    def close(a, b):
        return abs(a-b) < .002

    with pdfplumber.open(path) as doc:
        page = doc.pages[0]
        assert close(page.width, 210*mm) and close(page.height, 297*mm)
        t = page.extract_text()
        for phrase in (p['name'], 'Liste de matériel', 'Nom du produit (anglais)', 'Quantité', 'taille réelle',
                       '100%', '50 mm', '5 mm', 'Laissez les cases vides sans perles.',
                       'Modèle non assemblé ni testé au fer.', 'Modèle original', 'pas celles de Hama',
                       'Désactivez « Ajuster à la page ».'):
            assert phrase in t, (p['id'], phrase)
        assert f"{p['beads']} perles / {p['colorCount']} couleurs" in t
        assert 'fusebeadpatterns.art/fr/modeles-perles-a-repasser-noel' in t
        assert all(c['x0'] >= 17*mm and c['x1'] <= 193*mm and c['top'] >= 8*mm and c['bottom'] <= 292*mm for c in page.chars)
        assert not any(c['text'] in ('\uFFFD', '■') or '(cid:' in c['text'] for c in page.chars)
        assert not any(word in t for word in ('Pokémon', 'Fan-Vorlage', 'Bügelperlen', 'officiel'))
        cells = {}
        for rect in page.rects:
            if close(rect['width'], PITCH*mm) and close(rect['height'], PITCH*mm):
                x, y = (rect['x0']/mm-GX)/PITCH, (rect['top']/mm-GY)/PITCH
                assert close(x, round(x)) and close(y, round(y))
                xy = (round(x), round(y))
                assert xy not in cells and 0 <= xy[0] < 29 and 0 <= xy[1] < 29
                assert rect['fill'] is True
                cells[xy] = tuple(round(v*255) for v in rect['non_stroking_color'])
        assert cells == p['occupied']
        symbols = {}
        for char in page.chars:
            x, y = (char['x0']+char['x1'])/2/mm, (char['top']+char['bottom'])/2/mm
            if GX < x < GX+145 and GY < y < GY+145:
                xy = (int((x-GX)//PITCH), int((y-GY)//PITCH))
                assert xy not in symbols
                symbols[xy] = char['text']
        by_rgb = {tuple(bytes.fromhex(c['hex'][1:])): c['symbol'] for c in p['palette']}
        assert symbols == {xy: by_rgb[rgb] for xy, rgb in p['occupied'].items()}
        assert Counter(symbols.values()) == {c['symbol']: c['count'] for c in p['palette']}
        for i in range(30):
            assert any(close(l['x0'], GX*mm) and close(l['x1'], (GX+145)*mm) and close(l['top'], (GY+i*PITCH)*mm) and close(l['height'], 0) for l in page.lines)
            assert any(close(l['x0'], (GX+i*PITCH)*mm) and close(l['top'], GY*mm) and close(l['bottom'], (GY+145)*mm) and close(l['width'], 0) for l in page.lines)
        assert any(close(l['x0'], 18*mm) and close(l['x1'], 68*mm) and close(l['top'], 280*mm) and close(l['height'], 0) for l in page.lines)
        for i, c in enumerate(p['palette']):
            block = page.crop((17*mm, (214+i*8)*mm, 193*mm, (220+i*8)*mm)).extract_text()
            assert all(v in block for v in (c['ref'], c['name'], FRENCH_COLORS[c['ref']]))
            assert re.search(rf"\b{c['count']}\b", block)
            assert block.split()[-1] == str(c['count'])
    components = connected_components(cells)
    assert len(components) == 1, (p['id'], components)
    return {'id': p['id'], 'name': p['name'], 'pdf': str(path.relative_to(ROOT)),
            'beads': len(cells), 'colors': len(set(cells.values())), 'pageCount': 1,
            'pageMm': [210, 297], 'gridCells': [29, 29], 'pitchMm': PITCH, 'scaleLineMm': 50,
            'sourcePixelsAndSymbolsMatch': True, 'materialTableMatch': True,
            'fourConnectedComponentSizes': components, 'glyphsAndPageBoundsChecked': True,
            'intendedSourceUrl': f"{COLLECTION_URL}#{p['id']}", 'physicalTested': False,
            'sha256': sha256(path.read_bytes()).hexdigest()}


def original_asset_hashes():
    roots = ('public/patterns', 'public/patterns-ja', 'public/patterns-de', 'public/guides')
    return {str(p.relative_to(ROOT)): sha256(p.read_bytes()).hexdigest()
            for base in roots for p in (ROOT/base).rglob('*') if p.is_file()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--qa-report', type=Path)
    args = parser.parse_args()
    before = original_asset_hashes()
    patterns = selected_patterns()
    if not args.check_only:
        for p in patterns:
            build(p)
    results = [check(p) for p in patterns]
    assert original_asset_hashes() == before, 'Existing assets changed during generation/check'
    report = {'status': 'pass', 'scope': 'digital files only; physical work and publication unverified',
              'originalAssetsUnchanged': len(before), 'assets': results}
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True, exist_ok=True)
        args.qa_report.write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n')
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()

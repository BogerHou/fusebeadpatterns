"""Build and verify original A4 / US Letter digital print-calibration worksheets.

Requires the project's existing Python PDF tooling: reportlab, pypdf, pdfplumber.
Run: python3 scripts/build-print-calibration.py
Optional: --qa-report PATH writes a single JSON verification receipt.
Geometry uses millimetres; no downloaded artwork or font files are required.
This checks digital files only, never a physical printer or pegboard.
"""
import argparse
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import xml.etree.ElementTree as ET

import pdfplumber
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/printables/calibration'
INK, MUTED, GRID = '#172b24', '#48584f', '#9da9a2'
FORMATS = {'a4': ('A4', 210.0, 297.0), 'us-letter': ('US Letter', 215.9, 279.4)}
SAFE_MARGIN = 15.0
PITCH, CELLS = 5.0, 29


class Sheet:
    """One set of drawing calls produces matching vector PDF and physical-unit SVG."""

    def __init__(self, name, width, height, pdf_path):
        self.width, self.height = width, height
        self.pdf = canvas.Canvas(str(pdf_path), pagesize=(width * mm, height * mm),
                                 invariant=1, pageCompression=1, lang='en-US')
        self.pdf.setTitle(f'29 x 29 print calibration - {name}')
        self.pdf.setAuthor('Fuse Bead Patterns team')
        self.pdf.setSubject('Digital 5 mm grid, horizontal and vertical 50 mm rulers; physical fit untested')
        self.pdf.setViewerPreference('PrintScaling', 'None')
        self.svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}mm" height="{height}mm" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">',
                    f'<title id="title">29 x 29 print calibration - {name}</title>',
                    '<desc id="desc">Blank 5 mm grid with two 50 mm rulers. Print actual size and measure on paper. Physical pegboard compatibility has not been tested.</desc>',
                    f'<rect width="{width}" height="{height}" fill="white"/>']
        self.bounds = []

    def check(self, x0, y0, x1, y1):
        assert x0 >= SAFE_MARGIN and y0 >= SAFE_MARGIN, (x0, y0)
        assert x1 <= self.width - SAFE_MARGIN and y1 <= self.height - SAFE_MARGIN, (x1, y1)
        self.bounds.append((x0, y0, x1, y1))

    def text(self, x, y, value, size=9, bold=False, color=INK, align='left'):
        # Core PDF fonts avoid copying or distributing system fonts.
        assert value.isascii(), value
        font = 'Helvetica-Bold' if bold else 'Helvetica'
        w = pdfmetrics.stringWidth(value, font, size) / mm
        x0 = x - w / 2 if align == 'center' else x - w if align == 'right' else x
        self.check(x0, y - size / mm, x0 + w, y + size * .25 / mm)
        self.pdf.setFillColor(HexColor(color))
        self.pdf.setFont(font, size)
        method = {'left': 'drawString', 'center': 'drawCentredString', 'right': 'drawRightString'}[align]
        getattr(self.pdf, method)(x * mm, (self.height - y) * mm, value)
        anchor = {'left': 'start', 'center': 'middle', 'right': 'end'}[align]
        self.svg.append(f'<text x="{x}" y="{y}" font-family="Arial,Helvetica,sans-serif" font-size="{size / mm:.8f}" font-weight="{"bold" if bold else "normal"}" text-anchor="{anchor}" fill="{color}">{escape(value)}</text>')

    def line(self, x1, y1, x2, y2, width=.15, color=GRID, ident=None):
        self.check(min(x1, x2) - width/2, min(y1, y2) - width/2,
                   max(x1, x2) + width/2, max(y1, y2) + width/2)
        self.pdf.setLineWidth(width * mm)
        self.pdf.setStrokeColor(HexColor(color))
        self.pdf.line(x1 * mm, (self.height-y1) * mm, x2 * mm, (self.height-y2) * mm)
        id_attr = f' id="{ident}"' if ident else ''
        self.svg.append(f'<line{id_attr} x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}"/>')

    def save(self, svg_path):
        self.pdf.showPage()
        self.pdf.save()
        svg_path.write_text('\n'.join(self.svg + ['</svg>']) + '\n')


def build(key, name, width, height):
    pdf_path = OUT / f'29x29-5mm-{key}.pdf'
    svg_path = pdf_path.with_suffix('.svg')
    sheet = Sheet(name, width, height, pdf_path)
    text, line = sheet.text, sheet.line
    text(17, 19, 'FUSE BEAD PATTERNS  /  PRINT CHECK', 8, color=MUTED)
    text(17, 29, '29 x 29 blank practice grid', 20, bold=True)
    text(17, 36, f'{name}  |  {width:g} x {height:g} mm paper  |  nominal 5 mm cells', 9, color=MUTED)
    text(17, 43, 'Print: Actual size / 100%. Turn off Fit, Shrink and borderless enlargement.', 9, bold=True)
    text(17, 48, 'Use matching paper, portrait orientation and one page per sheet. Prefer the PDF.', 8.5)

    gx, gy, span = (width - 145) / 2 - 4, 57.0, CELLS * PITCH
    for i in range(CELLS + 1):
        major = i % 5 == 0 or i == CELLS
        weight, color = (.25, MUTED) if major else (.10, GRID)
        line(gx + i*PITCH, gy, gx + i*PITCH, gy + span, weight, color, f'grid-v-{i}')
        line(gx, gy + i*PITCH, gx + span, gy + i*PITCH, weight, color, f'grid-h-{i}')
    for i in range(CELLS):
        text(gx + (i+.5)*PITCH, gy - 1.5, str(i+1), 5.5, color=MUTED, align='center')
        text(gx - 2, gy + (i+.5)*PITCH + .7, str(i+1), 5.5, color=MUTED, align='right')
    text(gx + span/2, 207, '29 cells = 145 mm; first-to-last cell centres = 140 mm.', 8, color=MUTED, align='center')

    # Independent axis references: tick centre to tick centre, no arrowheads.
    hx, hy = gx, 219.0
    line(hx, hy, hx+50, hy, .35, INK, 'ruler-horizontal-50mm')
    for i in range(11):
        tick = 2 if i in (0, 10) else 1.2
        line(hx+i*5, hy-tick, hx+i*5, hy+tick, .2, INK)
    text(hx, 225, '0', 7, align='center')
    text(hx+50, 225, '50 mm', 7, align='center')
    text(hx+63, 218, 'Measure both axes on the printed sheet', 8.5, bold=True)
    text(hx+63, 223, 'with a separate ruler, centre to centre.', 8, color=MUTED)
    vx, vy = gx + span + 10, 105.0
    line(vx, vy, vx, vy+50, .35, INK, 'ruler-vertical-50mm')
    for i in range(11):
        tick = 2 if i in (0, 10) else 1.2
        line(vx-tick, vy+i*5, vx+tick, vy+i*5, .2, INK)
    text(vx, vy-3, '0', 7, align='center')
    text(vx, vy+55, '50 mm', 7, align='center')

    text(17, 231, 'Before using the grid', 10, bold=True)
    text(17, 237, 'If either ruler is not 50 mm, check paper size and scaling, then print again.', 8.5)
    text(17, 242, 'If content is clipped, use a printer that can print this area; do not scale to fit.', 8.5)
    text(17, 247, 'If both rulers match, compare cell centres with your actual peg spacing in both axes.', 8.5)
    text(17, 252, 'If pegs do not align, use row/column counting. This is not a universal pegboard template.', 8.5)
    text(17, 257, 'Digital dimensions checked; physical printing and pegboard fit have not been tested.', 8, bold=True)
    # Footer stays within a 15 mm content inset on both paper sizes.
    text(17, height-16, 'fusebeadpatterns.art  |  Free to print and share for personal, classroom and library use.', 7, color=MUTED)
    sheet.save(svg_path)
    return verify(pdf_path, svg_path, width, height, gx, gy, sheet.bounds)


def verify(pdf_path, svg_path, width, height, gx, gy, bounds):
    reader = PdfReader(pdf_path)
    assert len(reader.pages) == 1
    page = reader.pages[0]
    actual_mm = [float(page.mediabox.width)/mm, float(page.mediabox.height)/mm]
    assert all(abs(a-b) < .0001 for a, b in zip(actual_mm, [width, height]))
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    extracted = page.extract_text()
    for expected in ('Actual size / 100%', '29 cells = 145 mm', 'physical printing and pegboard fit have not been tested'):
        assert expected in extracted
    with pdfplumber.open(pdf_path) as parsed:
        p = parsed.pages[0]
        def matching_line(x1, y1, x2, y2):
            return [l for l in p.lines if all(abs(a-b) < .0001 for a,b in zip(
                (l['x0']/mm, l['top']/mm, l['x1']/mm, l['bottom']/mm),
                (x1, y1, x2, y2)))]
        for i in range(30):
            assert len(matching_line(gx+i*5, gy, gx+i*5, gy+145)) == 1
            assert len(matching_line(gx, gy+i*5, gx+145, gy+i*5)) == 1
        assert len(matching_line(gx, 219, gx+50, 219)) == 1
        assert len(matching_line(gx+155, 105, gx+155, 155)) == 1
        assert all(c['x0'] >= SAFE_MARGIN*mm and c['x1'] <= (width-SAFE_MARGIN)*mm
                   and c['top'] >= SAFE_MARGIN*mm and c['bottom'] <= (height-SAFE_MARGIN)*mm for c in p.chars)
    svg = ET.fromstring(svg_path.read_text())
    assert svg.attrib['width'] == f'{width}mm' and svg.attrib['height'] == f'{height}mm'
    lines = {e.attrib['id']: e.attrib for e in svg if e.tag.endswith('line') and 'id' in e.attrib}
    assert len([k for k in lines if k.startswith('grid-')]) == 60
    for axis in ('horizontal', 'vertical'):
        l = lines[f'ruler-{axis}-50mm']
        assert abs(float(l['x2'])-float(l['x1'])) + abs(float(l['y2'])-float(l['y1'])) == 50
    return {
        'pdf': str(pdf_path.relative_to(ROOT)), 'svg': str(svg_path.relative_to(ROOT)),
        'pageCount': 1, 'pageMm': actual_mm, 'gridCells': [29,29], 'cellPitchMm': 5,
        'gridExtentMm': [145,145], 'rulerMm': {'horizontal':50,'vertical':50},
        'pdfPrintScalingPreference': 'None', 'contentInsetMm': SAFE_MARGIN,
        'safeContentAreaMm': [width-2*SAFE_MARGIN, height-2*SAFE_MARGIN],
        'safeContentAreaIsPrinterGuarantee': False,
        'drawingBoundsMm': [min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds)],
        'checks': ['PDF MediaBox', 'PDF parsed 60 grid lines', 'PDF parsed two 50 mm rulers',
                   'PDF text inside 15 mm inset', 'SVG physical units and grid lines', 'instructions extracted'],
        'sha256': {p.name:sha256(p.read_bytes()).hexdigest() for p in (pdf_path,svg_path)},
        'physicalPrintTested': False, 'physicalPegboardTested': False,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--qa-report', type=Path)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    results = [build(key, *spec) for key, spec in FORMATS.items()]
    report = {'status':'pass', 'scope':'digital geometry only; visual rendering reviewed separately', 'assets':results}
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True, exist_ok=True)
        args.qa_report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()

"""Build/check DE/FR/JA calibration PDFs and self-contained vector SVGs.

Uses the original worksheet's drawing calls unchanged; only text/font/language
metadata differ. Requires reportlab, pypdf, pdfplumber, fonttools.
Run --prepare-font once to fetch the pinned, checksum-verified SIL OFL source;
normal builds are offline. --check-only verifies existing assets without writing.
SVG labels are glyph outlines with accessible native labels, so missing system
Japanese fonts cannot alter layout. Digital checks do not prove physical fit.
"""
import argparse
from hashlib import sha256
from html import escape
import importlib.util
import io
import json
from pathlib import Path
import string
import sys
import urllib.request
import xml.etree.ElementTree as ET

import pdfplumber
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfdoc import PDFString
from reportlab.pdfbase.ttfonts import TTFont as ReportLabFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
from fontTools.pens.svgPathPen import SVGPathPen
import fontTools

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/printables/calibration'
FONT_DIR = ROOT / 'scripts/fonts/calibration'
FONT_PATHS = {weight: FONT_DIR / f'FuseBeadCalibration-{weight}.ttf' for weight in ('Regular', 'Bold')}
LANGUAGES = {'de': 'de-DE', 'fr': 'fr-FR', 'ja': 'ja-JP'}
SOURCE = json.loads((ROOT / 'scripts/fonts/localized-library-jp/source.json').read_text())
COPY = {
 'de': {
  'metadata_title': '29 x 29 Druckkalibrierung',
  'description': 'Leeres 5-mm-Raster mit zwei 50-mm-Messlinien. In tatsächlicher Größe drucken und auf Papier messen. Die Passung auf echte Steckplatten wurde nicht getestet.',
  'header': 'FUSE BEAD PATTERNS  /  DRUCKKONTROLLE', 'title': 'Leeres Übungsraster 29 x 29',
  'paper': '{paper}  |  Papier {w} x {h} mm  |  Nennabstand 5 mm',
  'print': 'Tatsächliche Größe / 100%. Seitenanpassung, Verkleinerung und Randlos-Vergrößerung ausschalten.',
  'orientation': 'Passendes Papier, Hochformat, eine Seite pro Blatt. Das PDF bevorzugen.',
  'grid': '29 Felder = 145 mm; Abstand der ersten und letzten Zellmitte = 140 mm.',
  'measure': 'Beide Achsen auf dem Ausdruck messen', 'centres': 'mit einem separaten Lineal, Mitte zu Mitte.',
  'before': 'Vor der Verwendung des Rasters',
  'incorrect': 'Ist eine Messlinie nicht 50 mm lang, Papier und Skalierung prüfen und erneut drucken.',
  'clipped': 'Bei abgeschnittenem Inhalt einen passenden Drucker verwenden; nicht passend verkleinern.',
  'match': 'Stimmen beide Messlinien, die Zellmitten mit den echten Stiften in beiden Achsen vergleichen.',
  'fallback': 'Passen die Stifte nicht, Zeilen und Spalten zählen. Keine universelle Steckplattenschablone.',
  'physical': 'Digitale Maße geprüft; echter Ausdruck und Passung auf Steckplatten nicht getestet.',
  'permission': 'fusebeadpatterns.art  |  Kostenlos drucken und teilen: privat, im Unterricht und in Bibliotheken.',
 },
 'fr': {
  'metadata_title': 'Contrôle d’impression 29 x 29',
  'description': 'Grille vide au pas de 5 mm et deux repères de 50 mm. Imprimer en taille réelle et mesurer sur papier. La compatibilité avec une plaque physique n’a pas été testée.',
  'header': 'FUSE BEAD PATTERNS  /  CONTRÔLE D’IMPRESSION', 'title': 'Grille vierge de 29 x 29 cases',
  'paper': '{paper}  |  Papier {w} x {h} mm  |  Pas nominal de 5 mm',
  'print': 'Taille réelle / 100%. Désactiver ajustement, réduction et agrandissement sans bordure.',
  'orientation': 'Papier adapté, orientation portrait, une page par feuille. Préférer le PDF.',
  'grid': '29 cases = 145 mm ; distance entre les centres extrêmes = 140 mm.',
  'measure': 'Mesurer les deux axes sur la feuille', 'centres': 'avec une règle séparée, de centre à centre.',
  'before': 'Avant d’utiliser la grille',
  'incorrect': 'Si un repère ne mesure pas 50 mm, vérifier le papier et l’échelle, puis réimprimer.',
  'clipped': 'Si le contenu est coupé, utiliser une imprimante adaptée ; ne pas réduire pour ajuster.',
  'match': 'Si les deux repères sont justes, comparer les centres aux picots réels sur les deux axes.',
  'fallback': 'Si les picots ne s’alignent pas, compter les rangs et colonnes. Ce gabarit n’est pas universel.',
  'physical': 'Dimensions numériques vérifiées ; impression réelle et adaptation à une plaque non testées.',
  'permission': 'fusebeadpatterns.art  |  Impression et partage gratuits : usage personnel, scolaire et bibliothèques.',
 },
 'ja': {
  'metadata_title': '29 x 29 印刷サイズの確認',
  'description': '5 mm間隔の空白図案と縦横の50 mm目盛り。実際のサイズで印刷し、紙の上で測ります。実物のプレートとの適合は未検証です。',
  'header': 'FUSE BEAD PATTERNS  /  印刷サイズの確認', 'title': '29 x 29マスの空白図案',
  'paper': '{paper}  |  用紙 {w} x {h} mm  |  基準の間隔 5 mm',
  'print': '実際のサイズ・100%。用紙に合わせる、縮小、余白なしの拡大はオフ。',
  'orientation': '用紙を合わせ、縦向きで1枚に1ページ。印刷にはPDFを使ってください。',
  'grid': '29マス = 145 mm。最初と最後のマスの中心間は140 mm。',
  'measure': '紙の上で縦と横の目盛りを測ります', 'centres': '別の定規で、両端の目盛りの中心間を測ります。',
  'before': '図案を使う前の確認',
  'incorrect': 'どちらかが50 mmでなければ、用紙と印刷倍率を確認して再印刷してください。',
  'clipped': '内容が切れる場合は印刷範囲が合うプリンターを使い、縮小しないでください。',
  'match': '両方の目盛りが合えば、マスの中心と実物のピン間隔を縦と横で照合します。',
  'fallback': 'ピンが合わなければ行と列を数えて作成。すべてのプレートに合うとは限りません。',
  'physical': 'デジタル寸法を確認済み。実物での印刷・プレートとの適合は未検証です。',
  'permission': 'fusebeadpatterns.art  |  個人・教室・図書館で無料印刷・共有可。',
 },
}
ENGLISH_KEYS = {
 'FUSE BEAD PATTERNS  /  PRINT CHECK': 'header', '29 x 29 blank practice grid': 'title',
 'Print: Actual size / 100%. Turn off Fit, Shrink and borderless enlargement.': 'print',
 'Use matching paper, portrait orientation and one page per sheet. Prefer the PDF.': 'orientation',
 '29 cells = 145 mm; first-to-last cell centres = 140 mm.': 'grid',
 'Measure both axes on the printed sheet': 'measure', 'with a separate ruler, centre to centre.': 'centres',
 'Before using the grid': 'before',
 'If either ruler is not 50 mm, check paper size and scaling, then print again.': 'incorrect',
 'If content is clipped, use a printer that can print this area; do not scale to fit.': 'clipped',
 'If both rulers match, compare cell centres with your actual peg spacing in both axes.': 'match',
 'If pegs do not align, use row/column counting. This is not a universal pegboard template.': 'fallback',
 'Digital dimensions checked; physical printing and pegboard fit have not been tested.': 'physical',
 'fusebeadpatterns.art  |  Free to print and share for personal, classroom and library use.': 'permission',
}

def digest(data): return sha256(data).hexdigest()
def character_set():
    values = [value for copy in COPY.values() for value in copy.values()]
    return ''.join(sorted(set(''.join(values) + string.printable + 'A4US Letter210.29759')))
def prepare_font():
    # The complete downloaded variable font remains in memory only.
    data = urllib.request.urlopen(SOURCE['fontUrl'], timeout=60).read()
    license_data = urllib.request.urlopen(SOURCE['licenseUrl'], timeout=60).read()
    assert digest(data) == SOURCE['fontSha256'] and digest(license_data) == SOURCE['licenseSha256']
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    chars = character_set()
    for weight, number in [('Regular', 400), ('Bold', 700)]:
        font = instantiateVariableFont(TTFont(io.BytesIO(data)), {'wght': number}, inplace=True)
        options = subset.Options(); options.recalc_timestamp = False
        subsetter = subset.Subsetter(options=options); subsetter.populate(text=chars); subsetter.subset(font)
        for record in font['name'].names:
            if record.nameID in (1, 4, 6, 16):
                value = f'FuseBeadCalibration-{weight}' if record.nameID == 6 else f'Fuse Bead Calibration {weight}' if record.nameID == 4 else 'Fuse Bead Calibration'
                record.string = value.encode(record.getEncoding())
            elif record.nameID in (2, 17): record.string = weight.encode(record.getEncoding())
        font.save(FONT_PATHS[weight])
    (FONT_DIR / 'OFL.txt').write_bytes(license_data)
    (FONT_DIR / 'source.json').write_text(json.dumps({key: SOURCE[key] for key in ('repository', 'revision', 'fontUrl', 'fontSha256', 'licenseUrl', 'licenseSha256', 'license')} | {
        'derivativeFamily': 'Fuse Bead Calibration', 'weights': [400, 700], 'purpose': 'DE/FR/JA calibration labels only',
        'charactersSha256': digest(chars.encode()), 'fonttoolsVersion': fontTools.__version__,
        'subsetSha256': {key: digest(value.read_bytes()) for key, value in FONT_PATHS.items()},
    }, ensure_ascii=False, indent=2) + '\n')

def load_original():
    # No bytecode or original output is produced when importing the drawing source.
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location('print_calibration_original', ROOT / 'scripts/build-print-calibration.py')
    original = importlib.util.module_from_spec(spec); spec.loader.exec_module(original)
    return original
ORIGINAL = load_original()
FONTS = {}
def register_fonts():
    manifest = json.loads((FONT_DIR / 'source.json').read_text())
    assert manifest['charactersSha256'] == digest(character_set().encode()), 'Refresh calibration font for edited labels'
    for weight, path in FONT_PATHS.items():
        assert digest(path.read_bytes()) == manifest['subsetSha256'][weight]
        pdfmetrics.registerFont(ReportLabFont(f'Calibration-{weight}', str(path)))
        font = TTFont(path); cmap = font.getBestCmap()
        missing = sorted({char for char in character_set() if not char.isspace() and ord(char) not in cmap})
        assert not missing, missing
        FONTS[weight] = {'font': font, 'cmap': cmap, 'glyphs': font.getGlyphSet(), 'units': font['head'].unitsPerEm}

class LocalizedSheet(ORIGINAL.Sheet):
    locale = 'de'
    def __init__(self, name, width, height, pdf_path):
        super().__init__(name, width, height, pdf_path)
        self.name, self.copy = name, COPY[self.locale]
        self.pdf._doc.Catalog.Lang = PDFString(LANGUAGES[self.locale])
        self.pdf.setTitle(f"{self.copy['metadata_title']} - {name}")
        self.pdf.setSubject(self.copy['description'])
        self.svg[0] = self.svg[0].replace(' role="img"', f' xml:lang="{self.locale}" lang="{self.locale}" role="img"')
        self.svg[1] = f'<title id="title">{escape(self.copy["metadata_title"])} - {name}</title>'
        self.svg[2] = f'<desc id="desc">{escape(self.copy["description"])}</desc>'
        self.glyph_paths = {}
    def text(self, x, y, value, size=9, bold=False, color=ORIGINAL.INK, align='left'):
        key = ENGLISH_KEYS.get(value)
        if key: value = self.copy[key]
        elif value.endswith('nominal 5 mm cells'):
            value = self.copy['paper'].format(paper=self.name, w=f'{self.width:g}', h=f'{self.height:g}')
        else: assert value.isdecimal() or value == '50 mm', f'Untranslated label: {value}'
        weight = 'Bold' if bold else 'Regular'; font = f'Calibration-{weight}'
        width = pdfmetrics.stringWidth(value, font, size) / mm
        # Labels may shrink within their existing slots; diagram coordinates never move.
        allowed = (self.width - ORIGINAL.SAFE_MARGIN - x) if align == 'left' else (x - ORIGINAL.SAFE_MARGIN) if align == 'right' else 2 * min(x - ORIGINAL.SAFE_MARGIN, self.width - ORIGINAL.SAFE_MARGIN - x)
        if width > allowed:
            size *= allowed / width; width = allowed
        assert size >= 6.5 or value.isdecimal() or value == '50 mm', (value, size)
        x0 = x - width / 2 if align == 'center' else x - width if align == 'right' else x
        self.check(x0, y - size / mm, x0 + width, y + size * .25 / mm)
        self.pdf.setFillColor(HexColor(color)); self.pdf.setFont(font, size)
        method = {'left': 'drawString', 'center': 'drawCentredString', 'right': 'drawRightString'}[align]
        getattr(self.pdf, method)(x * mm, (self.height - y) * mm, value)
        data = FONTS[weight]; scale = size / mm / data['units']; xx = x0
        uses = []
        for char in value:
            assert ord(char) in data['cmap'], char
            glyph = data['cmap'][ord(char)]; ident = f'{weight}-{glyph}'
            if ident not in self.glyph_paths:
                pen = SVGPathPen(data['glyphs']); data['glyphs'][glyph].draw(pen)
                self.glyph_paths[ident] = pen.getCommands()
            uses.append(f'<use href="#{escape(ident)}" transform="translate({xx:.8f} {y:.8f}) scale({scale:.10f} {-scale:.10f})"/>')
            xx += data['font']['hmtx'].metrics[glyph][0] * scale
        self.svg.append(f'<g aria-label="{escape(value, quote=True)}" fill="{color}">{"".join(uses)}</g>')
    def save(self, svg_path):
        definitions = '<defs>' + ''.join(f'<path id="{escape(key)}" d="{escape(value)}"/>' for key, value in self.glyph_paths.items()) + '</defs>'
        self.svg.insert(4, definitions)
        super().save(svg_path)

def line_geometry(pdf_path):
    with pdfplumber.open(pdf_path) as reader:
        return [tuple(round(item[key], 5) for key in ('x0', 'top', 'x1', 'bottom', 'linewidth')) + (tuple(item['stroking_color']) if isinstance(item['stroking_color'], (list, tuple)) else item['stroking_color'],) for item in reader.pages[0].lines]
def svg_lines(path):
    root = ET.fromstring(path.read_text()); return [element.attrib for element in root.iter() if element.tag.endswith('line')]
def verify(pdf_path, svg_path, width, height, gx, gy, bounds, locale=None):
    locale = locale or LocalizedSheet.locale; key = pdf_path.stem
    old_pdf = OUT / f'{key}.pdf'; old_svg = OUT / f'{key}.svg'
    reader = PdfReader(pdf_path); assert len(reader.pages) == 1
    assert reader.trailer['/Root']['/Lang'] == LANGUAGES[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling'] == '/None'
    old = PdfReader(old_pdf)
    assert list(reader.pages[0].mediabox) == list(old.pages[0].mediabox)
    assert line_geometry(pdf_path) == line_geometry(old_pdf), 'Grid, ticks or rulers changed'
    assert svg_lines(svg_path) == svg_lines(old_svg), 'SVG line geometry changed'
    with pdfplumber.open(pdf_path) as parsed:
        page = parsed.pages[0]
        assert all(char['x0'] >= 15 * mm and char['x1'] <= (width - 15) * mm and char['top'] >= 15 * mm and char['bottom'] <= (height - 15) * mm for char in page.chars)
        assert all('cid:' not in char['text'] and char['text'] != '\uFFFD' for char in page.chars)
    text = reader.pages[0].extract_text()
    for expected in (COPY[locale]['title'], COPY[locale]['print'], COPY[locale]['grid'], COPY[locale]['physical'], '50 mm'):
        assert expected in text, expected
    svg = ET.fromstring(svg_path.read_text())
    assert (svg.attrib['width'], svg.attrib['height']) == (f'{width}mm', f'{height}mm')
    assert svg.attrib['viewBox'] == f'0 0 {width} {height}'
    assert svg.attrib['{http://www.w3.org/XML/1998/namespace}lang'] == locale
    labels = [element.attrib['aria-label'] for element in svg.iter() if 'aria-label' in element.attrib]
    for expected in (COPY[locale]['print'], COPY[locale]['grid'], COPY[locale]['physical']): assert expected in labels
    assert len(svg_lines(svg_path)) == 84
    return {'locale': locale, 'pdf': str(pdf_path.relative_to(ROOT)), 'svg': str(svg_path.relative_to(ROOT)),
            'pageCount': 1, 'pageMm': [width, height], 'gridCells': [29, 29], 'cellPitchMm': 5,
            'gridExtentMm': [145, 145], 'rulerMm': {'horizontal': 50, 'vertical': 50},
            'all84VectorLinesIdenticalToEnglish': True, 'printScaling': 'None', 'textInsetMm': 15,
            'svgOutlinesNeedInstalledFonts': False, 'pdfLanguage': LANGUAGES[locale],
            'physicalPrintTested': False, 'physicalPegboardTested': False,
            'sha256': {path.name: digest(path.read_bytes()) for path in (pdf_path, svg_path)}}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare-font', action='store_true'); parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--qa-report', type=Path); args = parser.parse_args()
    if args.prepare_font: prepare_font()
    register_fonts()
    old_files = [OUT / f'29x29-5mm-{key}.{extension}' for key in ORIGINAL.FORMATS for extension in ('pdf', 'svg')]
    baseline = {str(path): digest(path.read_bytes()) for path in old_files}
    reports = []
    if args.check_only:
        for locale in LANGUAGES:
            for key, (name, width, height) in ORIGINAL.FORMATS.items():
                pdf = OUT / locale / f'29x29-5mm-{key}.pdf'
                reports.append(verify(pdf, pdf.with_suffix('.svg'), width, height, 0, 0, [], locale))
    else:
        ORIGINAL.Sheet = LocalizedSheet; ORIGINAL.verify = verify
        for locale in LANGUAGES:
            LocalizedSheet.locale = locale; ORIGINAL.OUT = OUT / locale; ORIGINAL.OUT.mkdir(parents=True, exist_ok=True)
            for key, spec in ORIGINAL.FORMATS.items(): reports.append(ORIGINAL.build(key, *spec))
    assert {str(path): digest(path.read_bytes()) for path in old_files} == baseline, 'English assets changed'
    report = {'status': 'pass', 'digitalGeometryOnly': True, 'visualRenderingReviewedSeparately': True, 'oldEnglishHashes': baseline,
              'assets': reports, 'sourceFontManifest': str((FONT_DIR / 'source.json').relative_to(ROOT))}
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True, exist_ok=True); args.qa_report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'status': 'pass', 'pdfCount': len(reports), 'svgCount': len(reports), 'oldEnglishFilesUnchanged': len(baseline)}))
if __name__ == '__main__': main()

"""Build eight static, two-page storage-label PDFs from the editor's palette.

Maintenance only: reportlab 4.4.9, fonttools 4.60.1 and pypdf are required.
Pass checksum-pinned Noto Sans JP and OFL source files explicitly. No network,
existing asset overwrites, web runtime, pre-cut sheet or printer-fit claims.
Run the PDF authoring marker once before --authoring-confirmed.
"""
import argparse
import csv
from hashlib import sha256
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COPY = ROOT / 'src/lib/color-chart/print-labels.json'
CSV = ROOT / 'public/palettes/perler.csv'
SOURCE = ROOT / 'scripts/fonts/celestial-window-labels/source.json'
FAMILY = 'Fuse Bead Color Labels'
FONT = 'FuseBeadColorLabels'
LOCALES = ('en', 'de', 'fr', 'ja')
PAPERS = {'a4': (210, 297), 'letter': (215.9, 279.4)}


def digest(data):
    return sha256(data).hexdigest()


def inputs():
    rows = list(csv.reader(CSV.open(encoding='utf-8', newline='')))
    assert len(rows) == 103 and len({r[0] for r in rows}) == 103
    assert all(len(r) == 13 and all(0 <= int(v) <= 255 for v in r[3:6]) for r in rows)
    copy = json.loads(COPY.read_text(encoding='utf-8'))
    assert set(copy) == set(LOCALES)
    fields = {'heading', 'intro', 'downloadA4', 'downloadLetter', 'formatNote',
              'scope', 'names', 'print', 'cut', 'pdfTitle', 'pdfSubtitle',
              'pdfPage', 'ruler', 'attribution', 'approximation'}
    assert all(set(c) == fields and all(isinstance(v, str) and v for v in c.values()) for c in copy.values())
    assert all('{page}' in c['pdfPage'] for c in copy.values())
    return rows, copy


def prepare_font(font_path, license_path, copy, rows):
    import fontTools
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont as ReportFont
    assert fontTools.__version__ == '4.60.1'
    source = json.loads(SOURCE.read_text())
    font_bytes, license_bytes = font_path.read_bytes(), license_path.read_bytes()
    assert digest(font_bytes) == source['fontSha256']
    assert digest(license_bytes) == source['licenseSha256']
    characters = ''.join(sorted(set(''.join(chr(i) for i in range(32, 127)) +
        ''.join(v for c in copy.values() for v in c.values()) + ''.join(r[0] + r[1] for r in rows))))
    font = TTFont(io.BytesIO(font_bytes), recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': 400}, inplace=True)
    options = subset.Options()
    options.name_IDs, options.name_legacy, options.name_languages = ['*'], True, ['*']
    options.recalc_timestamp = False
    s = subset.Subsetter(options=options)
    s.populate(text=characters)
    s.subset(font)
    cmap = font.getBestCmap()
    assert all(cmap.get(ord(c), '.notdef') != '.notdef' for c in characters)
    names = {1: FAMILY, 2: 'Regular', 3: FONT + '-1', 4: FAMILY + ' Regular',
             6: FONT + '-Regular', 16: FAMILY, 17: 'Regular',
             18: FAMILY + ' Regular', 21: FAMILY, 22: 'Regular', 25: FONT}
    for name in font['name'].names:
        if name.nameID in names:
            name.string = names[name.nameID].encode(name.getEncoding())
    stream = io.BytesIO()
    font.save(stream)
    subset_bytes = stream.getvalue()
    pdfmetrics.registerFont(ReportFont(FONT, io.BytesIO(subset_bytes)))
    return source, license_bytes.decode('utf-8'), digest(subset_bytes), len(characters)


def wrapped(text, width, size):
    from reportlab.pdfbase.pdfmetrics import stringWidth
    # Japanese has no space-delimited words; preserve whole Western words.
    units = list(text) if any('\u3040' <= c <= '\u9fff' for c in text) else text.split(' ')
    joiner = '' if any('\u3040' <= c <= '\u9fff' for c in text) else ' '
    lines, line = [], ''
    for unit in units:
        candidate = line + (joiner if line else '') + unit
        if line and stringWidth(candidate, FONT, size) > width:
            lines.append(line)
            line = unit
        else:
            line = candidate
    if line:
        lines.append(line)
    assert all(stringWidth(line, FONT, size) <= width + .01 for line in lines)
    return lines


def draw(rows, c, paper, locale, font_license, mit_license):
    from reportlab.pdfgen.canvas import Canvas
    from reportlab.lib.units import mm
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import DictionaryObject, NameObject, TextStringObject
    width, height = [n * mm for n in PAPERS[paper]]
    grid_width = 183 * mm  # 5 labels of 35 mm, with four 2 mm gaps.
    left = (width - grid_width) / 2
    stream = io.BytesIO()
    canvas = Canvas(stream, pagesize=(width, height), pageCompression=1, invariant=1)
    canvas.setTitle(c['pdfTitle'])
    canvas.setAuthor('Fuse Bead Patterns')
    for page in range(2):
        canvas.setFillColorRGB(.14, .24, .21)
        canvas.setFont(FONT, 14)
        canvas.drawString(left, height - 14 * mm, c['pdfTitle'])
        canvas.setFont(FONT, 8.5)
        canvas.drawString(left, height - 21 * mm, c['pdfSubtitle'])
        y = height - 29 * mm
        for text in (c['print'], c['cut']):
            lines = wrapped(text, grid_width, 7)
            assert len(lines) <= 2
            canvas.setFont(FONT, 7)
            for line in lines:
                canvas.drawString(left, y, line)
                y -= 3.5 * mm
            y -= 1.5 * mm
        assert y >= height - 49 * mm, 'Header reaches label grid'
        for index, row in enumerate(rows[page * 55:(page + 1) * 55]):
            col, line = index % 5, index // 5
            x = left + col * 37 * mm
            top = height - (54 + line * 17) * mm
            bottom = top - 15 * mm
            canvas.setStrokeColorRGB(.65, .68, .66)
            canvas.setLineWidth(.35)
            canvas.rect(x, bottom, 35 * mm, 15 * mm, stroke=1, fill=0)
            canvas.setFillColorRGB(*(int(v) / 255 for v in row[3:6]))
            canvas.rect(x + 1.8 * mm, bottom + 2.5 * mm, 5 * mm, 10 * mm, stroke=0, fill=1)
            canvas.setFillColorRGB(0, 0, 0)
            canvas.setFont(FONT, 8)
            canvas.drawString(x + 8.5 * mm, top - 5 * mm, row[0])
            name_lines = wrapped(row[1], 25 * mm, 7.5)
            assert len(name_lines) <= 2
            canvas.setFont(FONT, 7.5)
            for n, name in enumerate(name_lines):
                canvas.drawString(x + 8.5 * mm, top - (9 + 3.3 * n) * mm, name)
        canvas.setFillColorRGB(.20, .25, .22)
        canvas.setFont(FONT, 6.5)
        for n, text in enumerate((c['scope'], c['names'], c['approximation'])):
            assert len(wrapped(text, grid_width, 6.5)) == 1, 'Footer line too long'
            canvas.drawString(left, (34 - 4 * n) * mm, text)
        canvas.setLineWidth(.7)
        canvas.setStrokeColorRGB(0, 0, 0)
        for n in range(11):
            x = left + n * 5 * mm
            canvas.line(x, 17 * mm, x, (20 if n % 2 == 0 else 18.5) * mm)
        canvas.line(left, 17 * mm, left + 50 * mm, 17 * mm)
        canvas.setFont(FONT, 6.5)
        canvas.drawString(left + 53 * mm, 17 * mm, c['ruler'])
        canvas.drawString(left, 9 * mm, c['attribution'])
        canvas.drawRightString(width - left, 9 * mm, c['pdfPage'].replace('{page}', str(page + 1)))
        canvas.showPage()
    canvas.save()
    writer = PdfWriter()
    writer.clone_document_from_reader(PdfReader(io.BytesIO(stream.getvalue())))
    writer._root_object[NameObject('/Lang')] = TextStringObject(locale)
    writer._root_object[NameObject('/ViewerPreferences')] = DictionaryObject({NameObject('/PrintScaling'): NameObject('/None')})
    writer.add_metadata({'/BeadcolorsLicense': mit_license, '/FontLicense': font_license,
                         '/PaletteSHA256': digest(CSV.read_bytes()), '/ColorLabelLayout': '35x15mm;5columns;11rows;55+48labels'})
    result = io.BytesIO()
    writer.write(result)
    return result.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font', type=Path, required=True)
    parser.add_argument('--font-license', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--authoring-confirmed', action='store_true')
    args = parser.parse_args()
    assert args.authoring_confirmed, 'Run the PDF authoring marker first'
    output = args.output.expanduser().resolve()
    assert not output.exists(), 'Use an empty new task output directory'
    assert output != ROOT and ROOT not in output.parents, 'Build outside the checkout before reviewed asset promotion'
    rows, copy = inputs()
    source, license_text, subset_hash, character_count = prepare_font(args.font, args.font_license, copy, rows)
    mit = (ROOT / 'public/licenses/beadcolors-MIT.txt').read_text(encoding='utf-8')
    output.mkdir(mode=0o700, parents=True)
    files = {}
    for locale in LOCALES:
        for paper in PAPERS:
            name = f'perler-midi-{locale}-{paper}.pdf'
            data = draw(rows, copy[locale], paper, locale, license_text, mit)
            (output / name).write_bytes(data)
            files[name] = {'sha256': digest(data), 'bytes': len(data), 'pages': 2, 'labels': 103}
    manifest = {'paletteSHA256': digest(CSV.read_bytes()), 'copySHA256': digest(COPY.read_bytes()),
                'sourceFontSHA256': source['fontSha256'], 'fontLicenseSHA256': source['licenseSha256'],
                'subsetFamily': FAMILY, 'subsetSHA256': subset_hash, 'characterCount': character_count,
                'layout': {'labelMM': [35, 15], 'gapMM': [2, 2], 'columns': 5, 'rows': 11, 'pageLabels': [55, 48]},
                'files': files}
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'output': str(output), 'files': 8, 'pages': 16, 'labelsPerPDF': 103, 'fontCharacters': character_count}))


if __name__ == '__main__':
    main()

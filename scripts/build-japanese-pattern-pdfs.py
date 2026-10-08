"""Build the 12 Japanese downloads from the existing, reviewed catalog pixels.

Run with Python + reportlab, Pillow and pypdf. See fonts/noto-sans-jp/README.md.
No network is used unless --refresh-font is explicitly supplied.
"""
import argparse
import base64
from collections import Counter
from hashlib import sha256
import io
import json
from pathlib import Path
import re
import string
import urllib.request

from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / 'scripts/fonts/noto-sans-jp'
FONT_PATH = FONT_DIR / 'FuseBeadJapanese-Regular.ttf'
FONT_REVISION = '66a36c8c94b1a5d992ee4e7f392fccfe4945767c'
FONT_BASE = f'https://raw.githubusercontent.com/google/fonts/{FONT_REVISION}/ofl/notosansjp'
FONT_URL = f'{FONT_BASE}/NotoSansJP%5Bwght%5D.ttf'
LOCALIZATION_PATH = ROOT / 'src/lib/patterns/japanese.json'
OUTPUT_DIR = ROOT / 'public/patterns-ja'
PW, PH = A4
GRID_X, GRID_Y, PITCH = 32.5, 49, 5
INK, MUTED = '#25342e', '#59655f'

COPY = {
    'subtitle': 'アイロンビーズ図案 / Perler Midi',
    'grid': '29 × 29マス / ミディ用プレート1枚 / {beads}個 / {colors}色',
    'motif': '図柄 {width} × {height}マス / 空白のマスにはビーズを置きません。',
    'materials': '材料表',
    'color_note': '色名は読み方の目安です。購入時はPerlerの色番号を確認してください。',
    'table_header': '記号 / 色番号 / 色名',
    'count_header': '個数',
    'thin': '細い接続部分（行,列）：{positions}。慎重に扱い、必要に応じて台紙で補強してください。',
    'safe': '記号と材料表を見ながら並べ、仕上げは使用するビーズの説明に従ってください。',
    'untested': '実物制作・アイロン仕上げは未検証です。画面や印刷の色は実物と異なります。',
    'printing': 'A4・倍率100%（実際のサイズ）で印刷。「用紙に合わせる」は選ばないでください。',
    'pitch': '1マスの間隔は5 mm。印刷後、下の線とプレートの間隔を定規で確認してください。',
    'scale': 'この線が50 mmになれば印刷倍率は正しいです。',
    'source': '出典・制作メモ（英語）',
    'footer': '無料の日本語図案 / ミニビーズ用の原寸図案ではありません。',
}


def load_patterns():
    # catalog.ts is the checked-in JSON-shaped export produced by the catalog builder.
    catalog_text = (ROOT / 'src/lib/patterns/catalog.ts').read_text()
    match = re.search(r'export const patterns: Pattern\[\] = (\[.*?\]);', catalog_text, re.S)
    if not match:
        raise ValueError('Could not locate the reviewed catalog JSON export')
    catalog = {p['id']: p for p in json.loads(match[1])}
    localization = json.loads(LOCALIZATION_PATH.read_text())
    selected = []
    for group in localization['groups']:
        for local in group['patterns']:
            pattern = catalog[local['id']]
            draft = json.loads((ROOT / 'public' / pattern['assets']['project'].lstrip('/')).read_text())['draft']
            edited = draft['editedPattern']
            rgba = base64.b64decode(edited['data'], validate=True)
            with Image.open(ROOT / 'public' / pattern['assets']['pixels'].lstrip('/')) as image:
                assert image.size == (29, 29), pattern['id']
                assert image.convert('RGBA').tobytes() == rgba, pattern['id']
            assert (edited['width'], edited['height'], len(rgba), edited['byteLength']) == (29, 29, 3364, 3364)
            assert (draft['boardId'], draft['boardWidth'], draft['boardHeight']) == ('midi', 1, 1)
            assert (pattern['gridWidth'], pattern['gridHeight']) == (29, 29)
            counts = Counter()
            occupied = []
            for index in range(841):
                r, g, b, a = rgba[index * 4:index * 4 + 4]
                assert a in (0, 255), pattern['id']
                if a:
                    counts[f'#{r:02x}{g:02x}{b:02x}'] += 1
                    occupied.append((index % 29, index // 29))
            assert sum(counts.values()) == pattern['beads']
            assert len(counts) == pattern['colorCount'] == len(pattern['palette'])
            assert len({c['symbol'] for c in pattern['palette']}) == len(counts)
            assert len({c['ref'] for c in pattern['palette']}) == len(counts)
            assert {c['hex']: c['count'] for c in pattern['palette']} == counts
            assert (max(x for x, _ in occupied) - min(x for x, _ in occupied) + 1,
                    max(y for _, y in occupied) - min(y for _, y in occupied) + 1) == (pattern['motifWidth'], pattern['motifHeight'])
            entries = {c['ref']: c for palette in draft['activePalettes'] for c in palette['entries']}
            for color in pattern['palette']:
                source = entries[color['ref']]
                assert source['name'] == color['name'] and source['symbol'] == color['symbol']
                assert [source['color'][key] for key in ('r', 'g', 'b', 'a')] == [*bytes.fromhex(color['hex'][1:]), 255]
                assert color['ref'] in localization['colors'], color['ref']
            selected.append({**pattern, **local, 'versionJa': group['version'], 'rgba': rgba})
    assert len(selected) == len({p['id'] for p in selected}) == 12
    return selected, localization


def refresh_font(localization):
    """Pin upstream and vendor a static, renamed OFL subset; never keep the large download."""
    from fontTools import subset
    from fontTools.ttLib import TTFont as FontToolsFont
    from fontTools.varLib.instancer import instantiateVariableFont

    font_bytes = urllib.request.urlopen(FONT_URL).read()
    license_bytes = urllib.request.urlopen(f'{FONT_BASE}/OFL.txt').read()
    # The original pinned downloads are verified before any local font is replaced.
    expected = json.loads((FONT_DIR / 'source.json').read_text())
    assert sha256(font_bytes).hexdigest() == expected['fontSha256']
    assert sha256(license_bytes).hexdigest() == expected['licenseSha256']
    font = FontToolsFont(io.BytesIO(font_bytes), recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': 400}, inplace=True)
    options = subset.Options()
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    characters = json.dumps(localization, ensure_ascii=False) + ''.join(COPY.values()) + string.printable + '個マス行列図柄'
    subsetter.populate(text=characters)
    subsetter.subset(font)
    # Do not use the upstream reserved name for this derivative.
    names = {1: 'Fuse Bead Japanese', 2: 'Regular', 3: 'FuseBeadJapanese-Regular-1',
             4: 'Fuse Bead Japanese Regular', 6: 'FuseBeadJapanese-Regular',
             16: 'Fuse Bead Japanese', 17: 'Regular'}
    for name in font['name'].names:
        if name.nameID in names:
            name.string = names[name.nameID].encode(name.getEncoding())
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    font.save(FONT_PATH)
    (FONT_DIR / 'OFL.txt').write_bytes(license_bytes)


def build(pattern, localization):
    destination = OUTPUT_DIR / pattern['id'] / 'pattern.pdf'
    destination.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(destination), pagesize=A4, invariant=1, pageCompression=1, lang='ja-JP')
    pdf.setTitle(f"{pattern['name']}のアイロンビーズ図案")
    pdf.setAuthor('Fuse Bead Patterns')
    pdf.setSubject('日本語の材料表・29×29マス・5 mm間隔・A4実寸印刷用')

    def text(x, y, value, size=9, color=INK, align='left', max_width=None):
        missing = {c for c in value if ord(c) not in pdfmetrics.getFont('Japanese').face.charToGlyph}
        assert not missing, f'Missing font glyphs: {missing}'
        width = pdfmetrics.stringWidth(value, 'Japanese', size)
        if max_width is None:
            max_width = (192 - x) * mm if align == 'left' else (x - 18) * mm
        assert width <= max_width, f'Text overflows: {value}'
        pdf.setFont('Japanese', size)
        pdf.setFillColor(HexColor(color))
        getattr(pdf, 'drawRightString' if align == 'right' else 'drawString')(x * mm, PH - y * mm, value)

    def line(x1, y1, x2, y2, width=.15, color='#a2aaa6'):
        pdf.setStrokeColor(HexColor(color))
        pdf.setLineWidth(width * mm)
        pdf.line(x1 * mm, PH - y1 * mm, x2 * mm, PH - y2 * mm)

    text(18, 14, 'FUSE BEAD PATTERNS', 8, MUTED)
    text(18, 25, pattern['name'], 20)
    text(18, 32, f"{COPY['subtitle']} / {pattern['versionJa']}", 8, MUTED)
    text(18, 38, COPY['grid'].format(beads=pattern['beads'], colors=pattern['colorCount']), 9)
    text(18, 43, COPY['motif'].format(width=pattern['motifWidth'], height=pattern['motifHeight']), 8, MUTED)

    by_hex = {entry['hex']: entry for entry in pattern['palette']}
    for index in range(841):
        r, g, b, a = pattern['rgba'][index * 4:index * 4 + 4]
        if not a:
            continue
        x, y = index % 29, index // 29
        entry = by_hex[f'#{r:02x}{g:02x}{b:02x}']
        pdf.setFillColorRGB(r / 255, g / 255, b / 255)
        pdf.rect((GRID_X + x * PITCH) * mm, PH - (GRID_Y + (y + 1) * PITCH) * mm,
                 PITCH * mm, PITCH * mm, stroke=0, fill=1)
        pdf.setFillColor(HexColor(INK) if .299 * r + .587 * g + .114 * b > 150 else HexColor('#ffffff'))
        pdf.setFont('Japanese', 6.5)
        pdf.drawCentredString((GRID_X + (x + .5) * PITCH) * mm,
                             PH - (GRID_Y + (y + .5) * PITCH) * mm - 2.3, entry['symbol'])
    for i in range(30):
        major = i % 5 == 0 or i == 29
        width, color = (.23, '#65736b') if major else (.1, '#a2aaa6')
        line(GRID_X + i * PITCH, GRID_Y, GRID_X + i * PITCH, GRID_Y + 145, width, color)
        line(GRID_X, GRID_Y + i * PITCH, GRID_X + 145, GRID_Y + i * PITCH, width, color)
    for i in range(29):
        pdf.setFont('Japanese', 5.5)
        pdf.setFillColor(HexColor(MUTED))
        pdf.drawCentredString((GRID_X + (i + .5) * PITCH) * mm, PH - (GRID_Y - 1.5) * mm, str(i + 1))
        pdf.drawRightString((GRID_X - 2) * mm, PH - (GRID_Y + (i + .5) * PITCH) * mm - 2, str(i + 1))

    text(18, 202, COPY['materials'], 10)
    text(41, 202, COPY['color_note'], 6.8, MUTED)
    for x in (18, 109):
        text(x, 208, COPY['table_header'], 7, MUTED)
        text(x + 82, 208, COPY['count_header'], 7, MUTED, align='right')
        line(x, 209.5, x + 82, 209.5)
    for index, entry in enumerate(pattern['palette']):
        x, y = 18 + (index % 2) * 91, 214 + (index // 2) * 8
        pdf.setFillColor(HexColor(entry['hex']))
        pdf.setStrokeColor(HexColor('#8c9590'))
        pdf.setLineWidth(.15 * mm)
        pdf.rect(x * mm, PH - (y + 1) * mm, 4 * mm, 4 * mm, fill=1, stroke=1)
        text(x + 6, y, entry['symbol'], 8)
        text(x + 12, y - 1, entry['ref'], 7)
        text(x + 12, y + 2.3, localization['colors'][entry['ref']], 7, MUTED, max_width=57 * mm)
        text(x + 82, y, f"{entry['count']}個", 8, align='right')

    positions = re.findall(r'row (\d+), column (\d+)', ' '.join(pattern['notes']))
    note = COPY['thin'].format(positions='、'.join(f'({r},{c})' for r, c in positions)) if positions else COPY['safe']
    text(18, 254, note, 6.6)
    text(18, 259, COPY['untested'], 7, MUTED)
    text(18, 265, COPY['printing'], 8)
    text(18, 270, COPY['pitch'], 7, MUTED)
    line(18, 277, 68, 277, .4, INK)
    line(18, 275.5, 18, 278.5, .4, INK)
    line(68, 275.5, 68, 278.5, .4, INK)
    text(73, 278, COPY['scale'], 7)
    text(18, 287, COPY['footer'], 6.7, MUTED)
    text(192, 287, COPY['source'], 6.7, '#176752', align='right')
    pdf.linkURL(f"https://fusebeadpatterns.art/patterns/{pattern['slug']}",
                (151 * mm, PH - 289 * mm, 192 * mm, PH - 283 * mm), relative=0)
    pdf.showPage()
    pdf.save()
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh-font', action='store_true', help='Rebuild the licensed font subset from the pinned official source (requires fonttools)')
    args = parser.parse_args()
    patterns, localization = load_patterns()
    if args.refresh_font:
        refresh_font(localization)
    pdfmetrics.registerFont(TTFont('Japanese', str(FONT_PATH)))
    for pattern in patterns:
        print(build(pattern, localization).relative_to(ROOT))


if __name__ == '__main__':
    main()

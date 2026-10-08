"""Read-only acceptance check of the actual PDFs against the original catalog.

Uses PDF geometry/text extraction, independently of the authoring script.
Requires Pillow, pypdf and pdfplumber. Render every page for visual review too.
"""
from collections import Counter
import json
from pathlib import Path
import re

import pdfplumber
from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
MM = 72 / 25.4
selection = json.loads((ROOT / 'src/lib/patterns/japanese.json').read_text())
catalog = json.loads(re.search(r'export const patterns: Pattern\[\] = (\[.*?\]);',
                              (ROOT / 'src/lib/patterns/catalog.ts').read_text(), re.S)[1])
by_id = {p['id']: p for p in catalog}
selected = [p for group in selection['groups'] for p in group['patterns']]
assert len(selected) == len({p['id'] for p in selected}) == 12
assert {p.parent.name for p in (ROOT / 'public/patterns-ja').glob('*/pattern.pdf')} == {p['id'] for p in selected}


def close(actual, expected):
    return abs(actual - expected) < .002


for local in selected:
    pattern = by_id[local['id']]
    path = ROOT / 'public/patterns-ja' / local['id'] / 'pattern.pdf'
    reader = PdfReader(path)
    assert len(reader.pages) == 1, local['id']
    assert reader.trailer['/Root']['/Lang'] == 'ja-JP'
    assert reader.metadata.title == f"{local['name']}のアイロンビーズ図案"
    page = reader.pages[0]
    embedded_fonts = [font.get_object() for font in page['/Resources']['/Font'].values()
                      if 'FuseBeadJapanese' in font.get_object()['/BaseFont']]
    assert embedded_fonts
    for font in embedded_fonts:
        assert font['/FontDescriptor']['/FontFile2'].get_data()
        assert font['/ToUnicode'].get_data()
    assert [a.get_object()['/A']['/URI'] for a in page['/Annots']] == [f"https://fusebeadpatterns.art/patterns/{pattern['slug']}"]

    with Image.open(ROOT / 'public' / pattern['assets']['pixels'].lstrip('/')) as source:
        pixels = source.convert('RGBA')
        assert pixels.size == (29, 29)
        expected_cells = {(x, y): pixels.getpixel((x, y))[:3] for y in range(29) for x in range(29)
                          if pixels.getpixel((x, y))[3]}
    with pdfplumber.open(path) as pdf:
        page = pdf.pages[0]
        assert close(page.width, 210 * MM) and close(page.height, 297 * MM)
        text = page.extract_text()
        for phrase in (local['name'], '材料表', '記号 / 色番号 / 色名', '個数', '100%', '実際のサイズ', '50 mm', '5 mm',
                       '空白のマスにはビーズを置きません。', '実物制作・アイロン仕上げは未検証です。'):
            assert phrase in text, (local['id'], phrase)
        assert f"{pattern['beads']}個 / {pattern['colorCount']}色" in text
        assert f"図柄 {pattern['motifWidth']} × {pattern['motifHeight']}マス" in text
        assert all('FuseBeadJapanese' in c['fontname'] for c in page.chars)

        # Filled 5 mm squares reconstruct the published 29 × 29 image exactly.
        cells = {}
        for rect in page.rects:
            if not (close(rect['width'], 5 * MM) and close(rect['height'], 5 * MM)):
                continue
            x = (rect['x0'] / MM - 32.5) / 5
            y = (rect['top'] / MM - 49) / 5
            assert close(x, round(x)) and close(y, round(y))
            key = (round(x), round(y))
            assert key not in cells and 0 <= key[0] < 29 and 0 <= key[1] < 29
            assert rect['fill']
            cells[key] = tuple(round(c * 255) for c in rect['non_stroking_color'])
        assert cells == expected_cells, local['id']
        assert len(cells) == pattern['beads']
        assert Counter(cells.values()) == {tuple(bytes.fromhex(c['hex'][1:])): c['count'] for c in pattern['palette']}

        # Check the visible symbol in each individual grid cell, including blank cells.
        symbols = {}
        for char in page.chars:
            x, y = (char['x0'] + char['x1']) / 2 / MM, (char['top'] + char['bottom']) / 2 / MM
            if 32.5 < x < 177.5 and 49 < y < 194:
                key = (int((x - 32.5) // 5), int((y - 49) // 5))
                assert key not in symbols
                symbols[key] = char['text']
        symbol_by_rgb = {tuple(bytes.fromhex(c['hex'][1:])): c['symbol'] for c in pattern['palette']}
        assert symbols == {xy: symbol_by_rgb[rgb] for xy, rgb in expected_cells.items()}

        # All 30 horizontal/vertical lines preserve the physical pitch and extent.
        for index in range(30):
            assert any(close(line['x0'], 32.5 * MM) and close(line['x1'], 177.5 * MM)
                       and close(line['top'], (49 + index * 5) * MM) and close(line['height'], 0) for line in page.lines)
            assert any(close(line['x0'], (32.5 + index * 5) * MM) and close(line['top'], 49 * MM)
                       and close(line['bottom'], 194 * MM) and close(line['width'], 0) for line in page.lines)
        assert any(close(line['x0'], 18 * MM) and close(line['x1'], 68 * MM)
                   and close(line['top'], 277 * MM) and close(line['height'], 0) for line in page.lines)

        # Read each material-table block, verifying its printed number/name/count.
        for index, color in enumerate(pattern['palette']):
            left = 18 + (index % 2) * 91
            top = 210 + (index // 2) * 8
            block = page.crop((left * MM, top * MM, (left + 83) * MM, (top + 8) * MM)).extract_text()
            assert color['ref'] in block and selection['colors'][color['ref']] in block, (local['id'], block)
            assert re.search(rf"\b{color['count']}個\b", block), (local['id'], block)
        for row, column in re.findall(r'row (\d+), column (\d+)', ' '.join(pattern['notes'])):
            assert f'({row},{column})' in text
    print(f"PASS {local['id']}: A4, 29×29 / 5 mm, {pattern['beads']} beads, {pattern['colorCount']} colors, Japanese text + embedded fonts")

print('PASS: all 12 Japanese PDFs; original source assets were read only.')

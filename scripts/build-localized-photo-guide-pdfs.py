"""Create/check nine native-language practice PDFs from unchanged guide projects.

The old English counting PDFs are never written. New A4 board pages use 5 mm
cells and a 50 mm check line, with original Perler references, symbols and RGB.
Builds run offline from the vendored Japanese font; --refresh-font uses the
existing immutable, checksum-verified Google Fonts source, held in memory.
Dependencies: reportlab, pypdf, pdfplumber; fonttools only for --refresh-font.
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

import pdfplumber
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/guides/photo-to-pattern'
FONT_DIR = ROOT / 'scripts/fonts/photo-guide-jp'
FONT_PATH = FONT_DIR / 'FuseBeadGuideJapanese-Regular.ttf'
FONT_NAME = 'FuseBeadGuideJapanese'
LOCALES = ('de', 'fr', 'ja')
GX, GY, PITCH = 32.5, 61.0, 5.0
INK, MUTED = '#25342e', '#59655f'
SITE = 'https://fusebeadpatterns.art'
GUIDE = '/guides/photo-to-perler-bead-pattern'
EXPECTED = {
    'cat-perler-29': (29, 667, 11, 2),
    'cat-perler-58': (58, 2726, 13, 6),
    'rocket-perler-29-cleanup': (29, 337, 31, 3),
}
SOURCE_HASHES = {
    'cat-perler-29.pdf': 'e2f8c4e0aa623a2650267c4a648cacd5b5423e7645f2b7f184256211991e7beb',
    'cat-perler-29.bead-pattern.json': '1bf31c9b44eefdc8000884ec2725c9883a94661ca2ff6855d34623706378948c',
    'cat-perler-29_grid.png': '32446bfac48184c01c0a06fd8d6307a578c7ef68bb18015c5c6d2cbbc0c6858a',
    'cat-perler-58.pdf': 'e470076658802d1387142b11781be4682610ffca89f8fdc45304153783287004',
    'cat-perler-58.bead-pattern.json': '0b42240b85ca0b16452cfca3231510a9df6700ba219f1ed7c44df65f1255e6da',
    'cat-perler-58_grid.png': '150297705f387a8f849fc420905e2e4856c74e1957a333c08af42e4561682faa',
    'rocket-perler-29-cleanup.pdf': '01b4c4610e5331871dee8d582cc6566af7514f11f64a403a86aad1e602aa34d0',
    'rocket-perler-29-cleanup.bead-pattern.json': 'c8523df7482246e841102cbbbb0f7024fa49fe9dc8eb76f61d3283d7a2a0dfda',
    'rocket-perler-29-cleanup_grid.png': 'ca3da8eddf8faff100e9297c66b4993b8a74edea05104276d036e0c05e06f0ba',
}
COPY = {
    'de': {
        'titles': ['Katzenfoto - 29 x 29', 'Katzenfoto - 58 x 58', 'Rakete - korrigierte Fensterkontur'],
        'practice': 'Übungsumwandlung mit Perler Midi, keine fertig überarbeitete Vorlage.',
        'cat': 'Automatische Foto-Umwandlung ohne manuelle Änderungen.',
        'rocket': 'Nur 16 Konturperlen mit Midnight (80-15201) korrigiert; übrige Felder unverändert.',
        'stats': '{width} x {width} Felder / {boards} Midi-Platte(n) / {beads} Perlen / {colors} Farben',
        'overview': 'Gesamtübersicht - verkleinert, nicht in Originalgröße',
        'overview_note': 'Die vier Platten werden in Leserichtung angeordnet: oben links, oben rechts, unten links, unten rechts.',
        'overview_key': 'Die folgenden Plattenseiten zeigen alle Symbole bei 5 mm Rasterabstand.',
        'materials': 'Materialliste', 'symbol': 'Symbol', 'ref': 'Perler-Farbnummer', 'name': 'Englischer Produktname', 'count': 'Anzahl',
        'materials_note': 'Perler-Originalfarbnummern, Symbole und englische Produktnamen bleiben unverändert.',
        'empty': 'Leere Felder bleiben ohne Perlen. Der Bildhintergrund innerhalb des Motivs wird mitgezählt.',
        'board': 'Platte {board}/{boards} / Spalten {x0}-{x1} / Zeilen {y0}-{y1}',
        'board_grid': '29 x 29 Felder / 5 mm Raster / 145 x 145 mm Rasterfläche',
        'row': 'Zeilen', 'column': 'Spalten',
        'print': 'A4 bei 100% / Tatsächliche Größe drucken. "An Seite anpassen" ausschalten.',
        'pitch': 'Die Messlinie auf Papier prüfen und den Abstand mit der eigenen Midi-Platte vergleichen.',
        'scale': 'Diese Linie muss auf Papier 50 mm lang sein.',
        'untested': 'Übungsbeispiel; nicht gebaut oder bügelgetestet. Bildschirm- und Druckfarben können abweichen.',
        'credit': 'Foto: Anjeagotilla0920 / Wikimedia Commons / CC0 1.0; Umwandlung: Fuse Bead Patterns.',
        'illustration': 'Originalillustration mit KI erstellt; 16 manuelle Korrekturen: Fuse Bead Patterns.',
        'guide': 'Anleitung und bearbeitbares Projekt',
    },
    'fr': {
        'titles': ['Photo de chat - 29 x 29', 'Photo de chat - 58 x 58', 'Fusée - contour de fenêtre retouché'],
        'practice': 'Conversion d’exercice avec Perler Midi, et non modèle entièrement retouché.',
        'cat': 'Conversion automatique de la photo, sans retouche manuelle.',
        'rocket': 'Seules 16 perles du contour ont été corrigées avec Midnight (80-15201); le reste est inchangé.',
        'stats': '{width} x {width} cases / {boards} plaque(s) Midi / {beads} perles / {colors} couleurs',
        'overview': 'Vue d’ensemble réduite, sans taille réelle',
        'overview_note': 'Placez les quatre plaques dans cet ordre : haut gauche, haut droite, bas gauche, bas droite.',
        'overview_key': 'Les pages suivantes montrent tous les symboles avec un espacement de 5 mm.',
        'materials': 'Liste du matériel', 'symbol': 'Symbole', 'ref': 'Référence Perler', 'name': 'Nom anglais du produit', 'count': 'Quantité',
        'materials_note': 'Les références, symboles et noms anglais d’origine de Perler sont conservés.',
        'empty': 'Les cases vides restent sans perle. Le fond présent dans l’image est inclus dans les quantités.',
        'board': 'Plaque {board}/{boards} / Colonnes {x0}-{x1} / Rangs {y0}-{y1}',
        'board_grid': '29 x 29 cases / grille de 5 mm / surface de grille : 145 x 145 mm',
        'row': 'Rangs', 'column': 'Colonnes',
        'print': 'A4 à 100% / Taille réelle. Désactivez "Ajuster à la page".',
        'pitch': 'Mesurez le repère sur le papier et comparez l’espacement avec votre plaque Midi.',
        'scale': 'Cette ligne doit mesurer 50 mm sur le papier.',
        'untested': 'Exercice non assemblé ni testé au fer. Les couleurs à l’écran et à l’impression sont approximatives.',
        'credit': 'Photo : Anjeagotilla0920 / Wikimedia Commons / CC0 1.0; conversion : Fuse Bead Patterns.',
        'illustration': 'Illustration originale créée avec l’IA; 16 retouches manuelles : Fuse Bead Patterns.',
        'guide': 'Guide et projet modifiable',
    },
    'ja': {
        'titles': ['猫の写真 - 29 × 29', '猫の写真 - 58 × 58', 'ロケット - 窓の輪郭を修正'],
        'practice': 'Perler Midiで変換した練習例です。全体を手直しした完成図案ではありません。',
        'cat': '写真を自動変換した結果です。手作業の修正はしていません。',
        'rocket': '窓の輪郭16個だけをMidnight（80-15201）に変更し、ほかのマスは同じままです。',
        'stats': '{width} × {width}マス / ミディ用プレート{boards}枚 / {beads}個 / {colors}色',
        'overview': '縮小した全体図 - 実寸ではありません',
        'overview_note': '4枚のプレートは左上、右上、左下、右下の順に並べます。',
        'overview_key': '続くプレート別のページは、5 mm間隔ですべての記号を表示します。',
        'materials': '材料表', 'symbol': '記号', 'ref': 'Perlerの色番号', 'name': '英語の商品色名', 'count': '個数',
        'materials_note': 'Perlerの元の色番号、記号、英語の商品色名を変更せずに載せています。',
        'empty': '空白のマスには置きません。画像内の背景色は必要数に含みます。',
        'board': 'プレート {board}/{boards} / 列 {x0}-{x1} / 行 {y0}-{y1}',
        'board_grid': '29 × 29マス / 5 mm間隔 / 図案の枠は145 × 145 mm',
        'row': '行', 'column': '列',
        'print': 'A4・100%（実際のサイズ）で印刷。「用紙に合わせる」は選びません。',
        'pitch': '紙の確認線を測り、実物のミディ用プレートの間隔と比べてください。',
        'scale': 'この線が紙の上で50 mmになることを確認してください。',
        'untested': '練習例で、実物制作・アイロン仕上げは未検証です。画面や印刷の色は目安です。',
        'credit': '写真：Anjeagotilla0920 / Wikimedia Commons / CC0 1.0。図案への変換：Fuse Bead Patterns。',
        'illustration': '元イラストはAIで作成。手作業の16マス修正：Fuse Bead Patterns。',
        'guide': '使い方と編集用プロジェクト',
    },
}


def source_hashes():
    actual = {name: sha256((SOURCE / name).read_bytes()).hexdigest() for name in SOURCE_HASHES}
    assert actual == SOURCE_HASHES, 'A protected source project, PNG or English PDF has changed.'
    return actual


def load_examples():
    source_hashes()
    examples = []
    for stem, (size, beads, colors, pages) in EXPECTED.items():
        project = json.loads((SOURCE / (stem + '.bead-pattern.json')).read_text())
        assert project['type'] == 'bead-pattern-project-v1' and project['version'] == 1
        draft, grid = project['draft'], project['draft']['editedPattern']
        rgba = base64.b64decode(grid['data'], validate=True)
        assert (grid['width'], grid['height'], grid['byteLength'], len(rgba)) == (size, size, size * size * 4, size * size * 4)
        assert (draft['boardId'], draft['boardWidth'], draft['boardHeight'], draft['selectedPaletteIds']) == ('midi', size // 29, size // 29, ['perler'])
        assert all(alpha in (0, 255) for alpha in rgba[3::4])
        occupied = {(i % size, i // size): tuple(rgba[4*i:4*i+3]) for i in range(size*size) if rgba[4*i+3]}
        counts = Counter(occupied.values())
        entries = [color for palette in draft['activePalettes'] for color in palette['entries']]
        materials = [{**color, 'rgb': tuple(color['color'][key] for key in ('r', 'g', 'b')), 'count': counts[tuple(color['color'][key] for key in ('r', 'g', 'b'))]}
                     for color in entries if tuple(color['color'][key] for key in ('r', 'g', 'b')) in counts]
        assert len(occupied) == beads and len(counts) == colors and len(materials) == colors
        assert len({color['symbol'] for color in materials}) == colors
        assert all(color['enabled'] and color['color']['a'] == 255 for color in materials)
        examples.append({'stem': stem, 'size': size, 'beads': beads, 'colors': colors, 'pageCount': pages,
                         'boards': (size // 29) ** 2, 'occupied': occupied, 'materials': materials,
                         'byRgb': {color['rgb']: color for color in materials}, 'rgbaSha256': sha256(rgba).hexdigest()})
    # The edited rocket must preserve the existing sixteen precisely documented edits.
    auto = json.loads((SOURCE / 'rocket-perler-29-auto.bead-pattern.json').read_text())['draft']['editedPattern']
    before = base64.b64decode(auto['data'], validate=True)
    edited = base64.b64decode(json.loads((SOURCE / 'rocket-perler-29-cleanup.bead-pattern.json').read_text())['draft']['editedPattern']['data'], validate=True)
    positions = [(row, column) for row in (9, 15) for column in (14, 15, 16)] + [(row, column) for row in (10, 14) for column in (13, 17)] + [(row, column) for row in (11, 12, 13) for column in (12, 18)]
    changed = [i for i in range(841) if before[4*i:4*i+4] != edited[4*i:4*i+4]]
    assert changed == sorted((row-1)*29+column-1 for row, column in positions)
    assert all(edited[4*i:4*i+4] == bytes((47, 60, 85, 255)) for i in changed)
    return examples


def font(locale, bold=False):
    return FONT_NAME if locale == 'ja' else 'Helvetica-Bold' if bold else 'Helvetica'


def required_characters(examples):
    printable_ascii = ''.join(c for c in string.printable if ord(c) >= 32)
    return ''.join(sorted(set(json.dumps(COPY['ja'], ensure_ascii=False) + printable_ascii + ''.join(color['symbol'] + color['ref'] + color['name'] for example in examples for color in example['materials']))))


def refresh_font(examples):
    from fontTools import subset
    from fontTools.ttLib import TTFont as ToolsFont
    from fontTools.varLib.instancer import instantiateVariableFont
    import fontTools
    upstream = json.loads((ROOT / 'scripts/fonts/noto-sans-jp/source.json').read_text())
    original = urllib.request.urlopen(upstream['fontUrl']).read()
    license_bytes = urllib.request.urlopen(upstream['licenseUrl']).read()
    assert sha256(original).hexdigest() == upstream['fontSha256']
    assert sha256(license_bytes).hexdigest() == upstream['licenseSha256']
    face = ToolsFont(io.BytesIO(original), recalcTimestamp=False)
    instantiateVariableFont(face, {'wght': 400}, inplace=True)
    options = subset.Options(); options.name_IDs = ['*']; options.name_legacy = True
    options.name_languages = ['*']; options.recalc_timestamp = False
    tool = subset.Subsetter(options=options); characters = required_characters(examples)
    tool.populate(text=characters); tool.subset(face)
    names = {1: 'Fuse Bead Guide Japanese', 2: 'Regular', 3: 'FuseBeadGuideJapanese-Regular-1',
             4: 'Fuse Bead Guide Japanese Regular', 6: 'FuseBeadGuideJapanese-Regular',
             16: 'Fuse Bead Guide Japanese', 17: 'Regular'}
    for item in face['name'].names:
        if item.nameID in names: item.string = names[item.nameID].encode(item.getEncoding())
    FONT_DIR.mkdir(parents=True, exist_ok=True); face.save(FONT_PATH)
    (FONT_DIR / 'OFL.txt').write_bytes(license_bytes)
    info = {**upstream, 'derivativeFamily': 'Fuse Bead Guide Japanese', 'subsetPurpose': 'Three unchanged photo/illustration guide projects, Japanese labels, original Perler names/references/symbols',
            'subsetSha256': sha256(FONT_PATH.read_bytes()).hexdigest(), 'charactersSha256': sha256(characters.encode()).hexdigest(),
            'characterCount': len(characters), 'fonttoolsVersion': fontTools.__version__}
    (FONT_DIR / 'source.json').write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n')


def wrapped(value, locale, size, width_mm):
    lines, current = [], ''
    for character in value:
        if current and pdfmetrics.stringWidth(current + character, font(locale), size) > width_mm * mm:
            if locale != 'ja' and ' ' in current:
                left, right = current.rsplit(' ', 1); lines.append(left); current = right + character
            else:
                lines.append(current); current = character
        else: current += character
    if current: lines.append(current)
    return lines


def build(example, locale):
    copy = COPY[locale]; destination = SOURCE / locale / (example['stem'] + '.pdf')
    destination.parent.mkdir(parents=True, exist_ok=True)
    title = copy['titles'][list(EXPECTED).index(example['stem'])]
    pdf = canvas.Canvas(str(destination), pagesize=A4, invariant=1, pageCompression=1, lang={'de':'de-DE','fr':'fr-FR','ja':'ja-JP'}[locale])
    pdf.setTitle(title + ' - Perler Midi'); pdf.setAuthor('Fuse Bead Patterns')
    pdf.setSubject(f'{locale}; Perler Midi; {example["size"]} x {example["size"]}; 5 mm board pages; A4; 100%')
    pdf.setViewerPreference('PrintScaling', 'None')
    page_number = 0

    def text(x, y, value, size=8, color=INK, bold=False, right=False, max_mm=None):
        if locale == 'ja': assert all(ord(c) in pdfmetrics.getFont(FONT_NAME).face.charToGlyph for c in value), value
        else: value.encode('cp1252')
        assert pdfmetrics.stringWidth(value, font(locale, bold), size) <= (max_mm if max_mm is not None else x-18 if right else 192-x)*mm, value
        pdf.setFont(font(locale,bold),size);pdf.setFillColor(HexColor(color))
        getattr(pdf,'drawRightString' if right else 'drawString')(x*mm,A4[1]-y*mm,value)

    def paragraph(value, y, size=8, color=MUTED):
        for line in wrapped(value,locale,size,174): text(18,y,line,size,color);y+=size*0.45
        return y

    def rule(x1,y1,x2,y2,weight=.15,color='#a2aaa6'):
        pdf.setStrokeColor(HexColor(color));pdf.setLineWidth(weight*mm);pdf.line(x1*mm,A4[1]-y1*mm,x2*mm,A4[1]-y2*mm)

    def header(section):
        nonlocal page_number
        page_number+=1
        text(18,14,'FUSE BEAD PATTERNS',8,MUTED);text(192,14,'Perler Midi',8,MUTED,right=True);text(18,25,title,16,bold=True)
        text(18,33,section,10,bold=True)
        text(18,40,copy['stats'].format(width=example['size'],boards=example['boards'],beads=example['beads'],colors=example['colors']),8)
        rule(18,44,192,44)

    def footer():
        paragraph(copy['untested'],251,7)
        text(18,260,copy['print'],7.5,bold=True);text(18,265,copy['pitch'],7,MUTED)
        rule(18,274,68,274,.4,INK);rule(18,272.5,18,275.5,.4,INK);rule(68,272.5,68,275.5,.4,INK)
        text(73,275,copy['scale'],7,max_mm=119)
        text(18,288,copy['guide'],7,'#176752');text(192,288,f'{page_number} / {example["pageCount"]}',7,MUTED,right=True)
        pdf.linkURL(f'{SITE}/{locale}{GUIDE}',(18*mm,A4[1]-290*mm,105*mm,A4[1]-283*mm),relative=0)
        pdf.showPage()

    if example['size']==58:
        header(copy['overview'])
        paragraph(copy['overview_note'],50)
        # Overview is explicitly reduced. Only following board pages are 5 mm.
        unit=2.5;top=70;left=32.5
        for (x,y),rgb in example['occupied'].items():
            pdf.setFillColorRGB(*(channel/255 for channel in rgb));pdf.rect((left+x*unit)*mm,A4[1]-(top+(y+1)*unit)*mm,unit*mm,unit*mm,stroke=0,fill=1)
        for i in range(3):rule(left+i*72.5,top,left+i*72.5,top+145,.4);rule(left,top+i*72.5,left+145,top+i*72.5,.4)
        paragraph(copy['overview_key'],225);footer()
    for start in range(0,len(example['materials']),22):
        entries=example['materials'][start:start+22]
        header(copy['materials']+f' {start//22+1} / {(len(example["materials"])+21)//22}')
        paragraph(copy['materials_note'],50)
        text(18,59,copy['symbol'],7,MUTED);text(43,59,copy['ref'],7,MUTED);text(84,59,copy['name'],7,MUTED);text(192,59,copy['count'],7,MUTED,right=True);rule(18,61,192,61)
        for i,color in enumerate(entries):
            y=68+i*8
            pdf.setFillColorRGB(*(channel/255 for channel in color['rgb']));pdf.rect(18*mm,A4[1]-(y+1)*mm,4*mm,4*mm,stroke=0,fill=1)
            text(27,y,color['symbol'],9);text(43,y,color['ref'],8.5);text(84,y,color['name'],8.5,max_mm=90);text(192,y,str(color['count']),9,right=True)
        footer()
    for by in range(example['size']//29):
        for bx in range(example['size']//29):
            number=by*(example['size']//29)+bx+1
            header(copy['board'].format(board=number,boards=example['boards'],x0=bx*29+1,x1=(bx+1)*29,y0=by*29+1,y1=(by+1)*29))
            text(18,50,copy['board_grid'],8,MUTED);text(GX,GY-4,copy['column'],7,MUTED);text(18,GY+4,copy['row'],7,MUTED)
            for ly in range(29):
                for lx in range(29):
                    point=(bx*29+lx,by*29+ly)
                    if point not in example['occupied']:continue
                    rgb=example['occupied'][point];entry=example['byRgb'][rgb]
                    pdf.setFillColorRGB(*(channel/255 for channel in rgb));pdf.rect((GX+lx*PITCH)*mm,A4[1]-(GY+(ly+1)*PITCH)*mm,PITCH*mm,PITCH*mm,stroke=0,fill=1)
                    pdf.setFont(font(locale),6.5);pdf.setFillColor(HexColor(INK if sum(channel*weight for channel,weight in zip(rgb,(.299,.587,.114)))>150 else '#ffffff'))
                    pdf.drawCentredString((GX+(lx+.5)*PITCH)*mm,A4[1]-(GY+(ly+.5)*PITCH)*mm-2.1,entry['symbol'])
            for i in range(30):
                weight,color=(.23,'#65736b') if i%5==0 or i==29 else (.1,'#a2aaa6')
                rule(GX+i*PITCH,GY,GX+i*PITCH,GY+145,weight,color);rule(GX,GY+i*PITCH,GX+145,GY+i*PITCH,weight,color)
            pdf.setFont(font(locale),5.5);pdf.setFillColor(HexColor(MUTED))
            for i in range(29):
                pdf.drawCentredString((GX+(i+.5)*PITCH)*mm,A4[1]-(GY-1.5)*mm,str(bx*29+i+1))
                pdf.drawRightString((GX-2)*mm,A4[1]-(GY+(i+.5)*PITCH)*mm-2,str(by*29+i+1))
            y=paragraph(copy['empty'],214)
            y=paragraph(copy['practice'],y+2)
            y=paragraph(copy['cat'] if example['stem'].startswith('cat') else copy['rocket'],y+2)
            credit_top=y+2
            credit_end=paragraph(copy['credit'] if example['stem'].startswith('cat') else copy['illustration'],credit_top,7)
            if example['stem'].startswith('cat'):
                pdf.linkURL('https://commons.wikimedia.org/wiki/File:TUXEDO_CAT.jpg',(18*mm,A4[1]-(credit_end+1)*mm,192*mm,A4[1]-(credit_top-3)*mm),relative=0)
            footer()
    assert page_number==example['pageCount'],(example['stem'],page_number)
    pdf.save();return destination


def check(example,locale):
    path=SOURCE/locale/(example['stem']+'.pdf');copy=COPY[locale];reader=PdfReader(path)
    assert len(reader.pages)==example['pageCount']
    assert reader.trailer['/Root']['/Lang']=={'de':'de-DE','fr':'fr-FR','ja':'ja-JP'}[locale]
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling']=='/None'
    close=lambda a,b:abs(a-b)<.003
    cells,symbols={},{};materials=[]
    with pdfplumber.open(path) as pdf:
        board_start=(1 if example['size']==58 else 0)+(len(example['materials'])+21)//22
        for index,page in enumerate(pdf.pages):
            assert close(page.width,210*mm) and close(page.height,297*mm)
            assert all(c['x0']>=17*mm and c['x1']<=193*mm and c['top']>=8*mm and c['bottom']<=292*mm for c in page.chars),(path,index,'text margins')
            content=page.extract_text()
            for phrase in ('100%','50 mm','Perler',str(example['beads']),str(example['colors'])):assert phrase in content,(path,index,phrase)
            assert any(close(line['x0'],18*mm) and close(line['x1'],68*mm) and close(line['top'],274*mm) for line in page.lines)
            assert any(annotation.get_object()['/A'].get('/URI')==f'{SITE}/{locale}{GUIDE}' for annotation in reader.pages[index].get('/Annots',[]))
            if index<board_start:
                if index==(1 if example['size']==58 else 0) or index>(1 if example['size']==58 else 0):
                    chunk=example['materials'][len(materials):len(materials)+22]
                    for row,color in enumerate(chunk):
                        block=page.crop((17*mm,(63+row*8)*mm,193*mm,(71+row*8)*mm)).extract_text()
                        for value in (color['symbol'],color['ref'],color['name'],str(color['count'])):assert value in block,(path,color,block)
                    materials+=chunk
                continue
            board=index-board_start;bx=board%(example['size']//29);by=board//(example['size']//29)
            if example['stem'].startswith('cat'):
                credit_words=[word for word in page.extract_words() if 'Anjeagotilla0920' in word['text']]
                assert len(credit_words)==1
                source_links=[a.get_object() for a in reader.pages[index].get('/Annots',[]) if a.get_object()['/A'].get('/URI')=='https://commons.wikimedia.org/wiki/File:TUXEDO_CAT.jpg']
                assert len(source_links)==1
                rect=list(map(float,source_links[0]['/Rect']));word=credit_words[0]
                assert rect[0]<=word['x0'] and rect[2]>=word['x1'] and A4[1]-rect[3]<=word['top'] and A4[1]-rect[1]>=word['bottom']
            for rect in page.rects:
                if close(rect['width'],PITCH*mm) and close(rect['height'],PITCH*mm):
                    lx,ly=(rect['x0']/mm-GX)/PITCH,(rect['top']/mm-GY)/PITCH
                    assert close(lx,round(lx)) and close(ly,round(ly))
                    point=(bx*29+round(lx),by*29+round(ly));assert point not in cells
                    cells[point]=tuple(round(channel*255) for channel in rect['non_stroking_color'])
            for c in page.chars:
                x,y=(c['x0']+c['x1'])/2/mm,(c['top']+c['bottom'])/2/mm
                if GX<x<GX+145 and GY<y<GY+145:
                    point=(bx*29+int((x-GX)//PITCH),by*29+int((y-GY)//PITCH));assert point not in symbols
                    symbols[point]=c['text']
            for i in range(30):
                assert any(close(line['x0'],GX*mm) and close(line['x1'],(GX+145)*mm) and close(line['top'],(GY+i*5)*mm) for line in page.lines)
                assert any(close(line['x0'],(GX+i*5)*mm) and close(line['top'],GY*mm) and close(line['bottom'],(GY+145)*mm) for line in page.lines)
        assert cells==example['occupied']
        assert symbols=={point:example['byRgb'][rgb]['symbol'] for point,rgb in cells.items()}
        assert materials==example['materials']
    return {'locale':locale,'asset':'/'+str(path.relative_to(ROOT/'public')),'pageCount':len(reader.pages),'grid':[example['size'],example['size']],
            'beads':len(cells),'colors':len(materials),'pitchMm':5,'calibrationLineMm':50,'pageMm':[210,297],
            'sourceRgbaSha256':example['rgbaSha256'],'allSourcePixelsSymbolsAndCountsMatch':True,'fontTextExtractable':True,'physicalTested':False,
            'sha256':sha256(path.read_bytes()).hexdigest()}


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--refresh-font',action='store_true');parser.add_argument('--check-only',action='store_true');parser.add_argument('--qa-report',type=Path)
    args=parser.parse_args();examples=load_examples()
    if args.refresh_font:refresh_font(examples)
    pdfmetrics.registerFont(TTFont(FONT_NAME,str(FONT_PATH)))
    missing={c for c in required_characters(examples) if ord(c) not in pdfmetrics.getFont(FONT_NAME).face.charToGlyph}
    assert not missing,f'Refresh the licensed guide font for new characters: {missing}'
    reports=[]
    for example in examples:
        for locale in LOCALES:
            if not args.check_only:build(example,locale)
            reports.append(check(example,locale))
    assert source_hashes()==SOURCE_HASHES
    report={'status':'data-checks-passed','pdfs':reports,'protectedEnglishProjectsPdfsAndPngs':SOURCE_HASHES,'sourceRocketWindowEditsExactly16':True,'physicalTested':False,'visualReview':'Required separately from these data/layout checks.'}
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True,exist_ok=True);args.qa_report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'pdfs':len(reports),'pages':sum(item['pageCount'] for item in reports),'checkOnly':args.check_only,'sourceAssetsUnchanged':True}))


if __name__=='__main__':main()

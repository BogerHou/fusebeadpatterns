"""Build/check eight German PDFs from the unchanged, reviewed catalog pixels.

Requires existing reportlab, Pillow, pypdf and pdfplumber dependencies.
No network calls, downloaded fonts or Japanese translation files are used.
Run: python3 scripts/build-german-pattern-pdfs.py [--check-only] [--qa-report PATH]
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
DEST = ROOT / 'public/patterns-de'
GX, GY, PITCH = 32.5, 49.0, 5.0
INK, MUTED = '#25342e', '#59655f'


def selected_patterns():
    selection = json.loads((ROOT / 'src/lib/patterns/german.json').read_text())['patterns']
    assert len(selection) == len({p['id'] for p in selection}) == 8
    match = re.search(r'export const patterns: Pattern\[\] = (\[.*?\]);',
                      (ROOT / 'src/lib/patterns/catalog.ts').read_text(), re.S)
    catalog = {p['id']: p for p in json.loads(match[1])}
    selected = []
    for local in selection:
        p = catalog[local['id']]
        draft = json.loads((ROOT / 'public' / p['assets']['project'].lstrip('/')).read_text())['draft']
        edited = draft['editedPattern']
        rgba = base64.b64decode(edited['data'], validate=True)
        with Image.open(ROOT / 'public' / p['assets']['pixels'].lstrip('/')) as image:
            assert image.size == (29,29)
            assert image.convert('RGBA').tobytes() == rgba
        assert (edited['width'],edited['height'],len(rgba),edited['byteLength']) == (29,29,3364,3364)
        assert (draft['boardId'],draft['boardWidth'],draft['boardHeight']) == ('midi',1,1)
        occupied = {(i%29,i//29): tuple(rgba[4*i:4*i+3]) for i in range(841) if rgba[4*i+3]}
        assert all(rgba[4*i+3] in (0,255) for i in range(841))
        assert len(occupied) == p['beads']
        assert Counter(occupied.values()) == {tuple(bytes.fromhex(c['hex'][1:])): c['count'] for c in p['palette']}
        assert len(p['palette']) == p['colorCount']
        assert len({c['symbol'] for c in p['palette']}) == len(p['palette'])
        entries = {c['ref']:c for palette in draft['activePalettes'] for c in palette['entries']}
        for c in p['palette']:
            assert (entries[c['ref']]['name'],entries[c['ref']]['symbol']) == (c['name'],c['symbol'])
        selected.append({**p,**local,'rgba':rgba,'occupied':occupied})
    return selected


def build(p):
    path = DEST / p['id'] / 'pattern.pdf'
    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path), pagesize=A4, invariant=1, pageCompression=1, lang='de-DE')
    pdf.setTitle(f"{p['name']} - Bügelperlen-Vorlage")
    pdf.setAuthor('Fuse Bead Patterns team')
    pdf.setSubject('Deutsch; 29 x 29 Felder; 5 mm Raster; Perler-Farbnummern; A4 bei 100% drucken')
    pdf.setViewerPreference('PrintScaling','None')

    def text(x,y,value,size=8,color=INK,align='left',bold=False,max_width=None):
        value.encode('cp1252')
        font='Helvetica-Bold' if bold else 'Helvetica'
        width=pdfmetrics.stringWidth(value,font,size)
        available=(192-x)*mm if align=='left' else (x-18)*mm
        assert width <= (max_width if max_width is not None else available), (p['id'],value,width/mm)
        pdf.setFont(font,size)
        pdf.setFillColor(HexColor(color))
        getattr(pdf,'drawRightString' if align=='right' else 'drawString')(x*mm,A4[1]-y*mm,value)

    def line(x1,y1,x2,y2,width=.15,color='#a2aaa6'):
        pdf.setLineWidth(width*mm)
        pdf.setStrokeColor(HexColor(color))
        pdf.line(x1*mm,A4[1]-y1*mm,x2*mm,A4[1]-y2*mm)

    text(18,14,'FUSE BEAD PATTERNS',8,MUTED)
    text(18,25,p['name'],22,bold=True)
    text(18,32,'Bügelperlen-Vorlage / Perler Midi / Pokémon, Generation V',8,MUTED)
    text(18,38,f"29 x 29 Felder / 1 quadratische Platte / {p['beads']} Perlen / {p['colorCount']} Farben",9)
    text(18,43,f"Motiv: {p['motifWidth']} x {p['motifHeight']} Felder. Leere Felder bleiben ohne Perlen.",8,MUTED)
    color_by_rgb={tuple(bytes.fromhex(c['hex'][1:])):c for c in p['palette']}
    for (x,y),rgb in p['occupied'].items():
        c=color_by_rgb[rgb]
        pdf.setFillColorRGB(*(v/255 for v in rgb))
        pdf.rect((GX+x*5)*mm,A4[1]-(GY+(y+1)*5)*mm,5*mm,5*mm,stroke=0,fill=1)
        pdf.setFillColor(HexColor(INK if sum(v*k for v,k in zip(rgb,(.299,.587,.114)))>150 else '#ffffff'))
        pdf.setFont('Helvetica',6.5)
        pdf.drawCentredString((GX+(x+.5)*5)*mm,A4[1]-(GY+(y+.5)*5)*mm-2.1,c['symbol'])
    for i in range(30):
        width,color=(.23,'#65736b') if i%5==0 or i==29 else (.1,'#a2aaa6')
        line(GX+i*5,GY,GX+i*5,GY+145,width,color)
        line(GX,GY+i*5,GX+145,GY+i*5,width,color)
    for i in range(29):
        pdf.setFont('Helvetica',5.5)
        pdf.setFillColor(HexColor(MUTED))
        pdf.drawCentredString((GX+(i+.5)*5)*mm,A4[1]-(GY-1.5)*mm,str(i+1))
        pdf.drawRightString((GX-2)*mm,A4[1]-(GY+(i+.5)*5)*mm-2,str(i+1))

    text(18,202,'Materialliste',10,bold=True)
    text(48,202,'Perler-Originalfarbnummern und englische Produktnamen; keine Hama-Farbnummern.',7,MUTED)
    for x in (18,109):
        text(x,208,'Symbol / Farbnummer / Produktname',7,MUTED)
        text(x+82,208,'Anzahl',7,MUTED,align='right')
        line(x,209.5,x+82,209.5)
    for index,c in enumerate(p['palette']):
        x,y=18+(index%2)*91,214+(index//2)*8
        pdf.setFillColor(HexColor(c['hex']))
        pdf.setStrokeColor(HexColor('#8c9590'))
        pdf.setLineWidth(.15*mm)
        pdf.rect(x*mm,A4[1]-(y+1)*mm,4*mm,4*mm,fill=1,stroke=1)
        text(x+6,y,c['symbol'],8)
        text(x+12,y-1,c['ref'],7)
        text(x+12,y+2.3,c['name'],7,MUTED,max_width=57*mm)
        text(x+82,y,str(c['count']),8,align='right')
    positions=re.findall(r'row (\d+), column (\d+)', ' '.join(p['notes']))
    if positions:
        text(18,255,'Dünne Verbindungen (Zeile,Spalte): '+', '.join(f'({r},{c})' for r,c in positions)+'.',7)
        text(18,259,'Vorsichtig behandeln; bei Bedarf eine Unterlage zur Stabilisierung verwenden.',7,MUTED)
    else:
        text(18,255,'Beim Legen die Symbole und die Materialliste vergleichen.',7)
    text(18,264,'Nicht gebaut oder bügelgetestet. Bildschirm- und Druckfarben können abweichen.',7.5,MUTED)
    text(18,269,'A4 bei 100% / Tatsächliche Größe drucken. "An Seite anpassen" ausschalten.',8,bold=True)
    text(18,274,'5 mm Raster: Maßstab auf Papier messen und Abstand an der eigenen Steckplatte prüfen.',7,MUTED)
    line(18,280,68,280,.4,INK)
    line(18,278.5,18,281.5,.4,INK)
    line(68,278.5,68,281.5,.4,INK)
    text(73,281,'Diese Linie muss auf Papier 50 mm lang sein.',7)
    text(18,288,'Motivquelle und Details (Englisch)',7,'#176752')
    text(192,288,'Unabhängige Fan-Vorlage; nicht offiziell.',7,MUTED,align='right')
    pdf.linkURL(f"https://fusebeadpatterns.art/patterns/{p['slug']}",
                (18*mm,A4[1]-290*mm,85*mm,A4[1]-284*mm),relative=0)
    pdf.showPage()
    pdf.save()
    return path


def connected_components(points):
    remaining=set(points)
    sizes=[]
    while remaining:
        todo=[remaining.pop()]
        n=0
        while todo:
            x,y=todo.pop()
            n+=1
            for q in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if q in remaining:
                    remaining.remove(q)
                    todo.append(q)
        sizes.append(n)
    return sorted(sizes,reverse=True)


def check(p):
    path=DEST/p['id']/'pattern.pdf'
    reader=PdfReader(path)
    assert len(reader.pages)==1
    assert reader.trailer['/Root']['/Lang']=='de-DE'
    assert reader.metadata.title==f"{p['name']} - Bügelperlen-Vorlage"
    assert reader.trailer['/Root']['/ViewerPreferences']['/PrintScaling']=='/None'
    page=reader.pages[0]
    assert [a.get_object()['/A']['/URI'] for a in page['/Annots']]==[f"https://fusebeadpatterns.art/patterns/{p['slug']}"]
    def close(a,b): return abs(a-b)<.002
    with pdfplumber.open(path) as doc:
        page=doc.pages[0]
        assert close(page.width,210*mm) and close(page.height,297*mm)
        t=page.extract_text()
        for phrase in (p['name'],'Materialliste','Produktname','Anzahl','Tatsächliche Größe','100%','50 mm','5 mm',
                       'Leere Felder bleiben ohne Perlen.','Nicht gebaut oder bügelgetestet.','Details (Englisch)'):
            assert phrase in t,(p['id'],phrase)
        assert f"{p['beads']} Perlen / {p['colorCount']} Farben" in t
        assert all(c['x0']>=17*mm and c['x1']<=193*mm and c['top']>=8*mm and c['bottom']<=291*mm for c in page.chars)
        cells={}
        for r in page.rects:
            if close(r['width'],5*mm) and close(r['height'],5*mm):
                x,y=(r['x0']/mm-GX)/5,(r['top']/mm-GY)/5
                assert close(x,round(x)) and close(y,round(y))
                xy=(round(x),round(y))
                assert xy not in cells and 0<=xy[0]<29 and 0<=xy[1]<29
                cells[xy]=tuple(round(v*255) for v in r['non_stroking_color'])
        assert cells==p['occupied']
        symbols={}
        for c in page.chars:
            x,y=(c['x0']+c['x1'])/2/mm,(c['top']+c['bottom'])/2/mm
            if GX<x<GX+145 and GY<y<GY+145:
                xy=(int((x-GX)//5),int((y-GY)//5))
                assert xy not in symbols
                symbols[xy]=c['text']
        by_rgb={tuple(bytes.fromhex(c['hex'][1:])):c['symbol'] for c in p['palette']}
        assert symbols=={xy:by_rgb[rgb] for xy,rgb in p['occupied'].items()}
        for i in range(30):
            assert any(close(l['x0'],GX*mm) and close(l['x1'],(GX+145)*mm) and close(l['top'],(GY+i*5)*mm) and close(l['height'],0) for l in page.lines)
            assert any(close(l['x0'],(GX+i*5)*mm) and close(l['top'],GY*mm) and close(l['bottom'],(GY+145)*mm) and close(l['width'],0) for l in page.lines)
        assert any(close(l['x0'],18*mm) and close(l['x1'],68*mm) and close(l['top'],280*mm) and close(l['height'],0) for l in page.lines)
        for i,c in enumerate(p['palette']):
            left,top=18+(i%2)*91,210+(i//2)*8
            block=page.crop((left*mm,top*mm,(left+83)*mm,(top+8)*mm)).extract_text()
            assert all(v in block for v in (c['ref'],c['name']))
            assert re.search(rf"\b{c['count']}\b",block)
        for r,c in re.findall(r'row (\d+), column (\d+)',' '.join(p['notes'])):
            assert f'({r},{c})' in t
    components=connected_components(cells)
    assert len(components)==1,(p['id'],components)
    return {'id':p['id'],'name':p['name'],'pdf':str(path.relative_to(ROOT)),
            'beads':len(cells),'colors':len(set(cells.values())),'pageCount':1,
            'pageMm':[210,297],'gridCells':[29,29],'pitchMm':5,'scaleLineMm':50,
            'sourcePixelsAndSymbolsMatch':True,'materialTableMatch':True,
            'fourConnectedComponentSizes':components,'thinConnectionNotesPreserved':True,
            'sourceLinkLanguage':'English','physicalTested':False,'sha256':sha256(path.read_bytes()).hexdigest()}


def original_asset_hashes():
    roots=('public/patterns','public/patterns-ja','public/guides')
    return {str(p.relative_to(ROOT)):sha256(p.read_bytes()).hexdigest()
            for base in roots for p in (ROOT/base).rglob('*') if p.is_file()}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only',action='store_true')
    parser.add_argument('--qa-report',type=Path)
    args=parser.parse_args()
    before=original_asset_hashes()
    patterns=selected_patterns()
    if not args.check_only:
        for p in patterns: build(p)
    results=[check(p) for p in patterns]
    assert original_asset_hashes()==before,'Existing assets changed during generation/check'
    assert {p.parent.name for p in DEST.glob('*/pattern.pdf')}=={p['id'] for p in patterns}
    report={'status':'pass','scope':'digital files only; physical work untested',
            'originalAssetsUnchanged':len(before),'assets':results}
    if args.qa_report:
        args.qa_report.parent.mkdir(parents=True,exist_ok=True)
        args.qa_report.write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(report,indent=2,ensure_ascii=False))


if __name__=='__main__':
    main()

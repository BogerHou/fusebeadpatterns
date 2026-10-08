import { jsPDF } from 'jspdf';
import { downloadBlob } from '../core/printer/download';
import { computeUsage, getPaletteEntryColorKey } from '../core/utils/utils';
import type { JapaneseExportSnapshot } from './generator';

// These fixed Japanese strings are covered by the vendored, OFL-licensed subset.
// User filenames and arbitrary Japanese color names are not printed with it.
export const JAPANESE_PRINT_COPY = {
    title: 'アイロンビーズ図案',
    board: '29 × 29マス / ミディ用プレート1枚',
    empty: '空白のマスにはビーズを置きません。',
    printing: 'A4・倍率100%（実際のサイズ）で印刷。「用紙に合わせる」は選ばないでください。',
    pitch: '1マスの間隔は5 mm。印刷後、下の線とプレートの間隔を定規で確認してください。',
    scale: 'この線が50 mmになれば印刷倍率は正しいです。',
    materials: '材料表',
    headers: '記号 / 色番号 / 色名',
    count: '個数',
    caution: '実物制作・アイロン仕上げは未検証です。画面や印刷の色は実物と異なります。',
};

const BRAND_NAMES = { perler: 'Perler Midi', hama: 'Hama Midi', artkal_a: 'Artkal A' };
const FONT_NAME = 'FuseBeadJapanese';
let fontPromise: Promise<string> | undefined;

async function loadFont(): Promise<string> {
    fontPromise ??= fetch('/fonts/fuse-bead-japanese/FuseBeadJapanese-Regular.ttf')
        .then(async (response) => {
            if (!response.ok) throw new Error('Could not load printable font.');
            const bytes = new Uint8Array(await response.arrayBuffer());
            let binary = '';
            for (let i = 0; i < bytes.length; i += 8192) {
                binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
            }
            return btoa(binary);
        }).catch((error) => { fontPromise = undefined; throw error; });
    return fontPromise;
}

export function getJapanesePrintData(snapshot: JapaneseExportSnapshot) {
    if (!Number.isInteger(snapshot.boardWidth) || !Number.isInteger(snapshot.boardHeight) ||
        snapshot.boardWidth < 1 || snapshot.boardWidth > 4 || snapshot.boardHeight < 1 || snapshot.boardHeight > 4 ||
        snapshot.width !== snapshot.boardWidth * 29 || snapshot.height !== snapshot.boardHeight * 29 ||
        snapshot.pixels.length !== snapshot.width * snapshot.height * 4 ||
        !Object.hasOwn(BRAND_NAMES, snapshot.paletteId)) {
        throw new Error('Invalid printable board dimensions or palette.');
    }
    const usage = computeUsage(snapshot.pixels, [snapshot.palette]);
    const usedEntries = snapshot.palette.entries.filter((entry) => usage.has(entry.ref));
    const entries = usedEntries.map((entry, index) => ({ entry, symbol: String(index + 1), count: usage.get(entry.ref)! }));
    const byColor = new Map(entries.map((item) => [getPaletteEntryColorKey(item.entry.color.r, item.entry.color.g, item.entry.color.b), item]));
    let beads = 0;
    for (let i = 0; i < snapshot.pixels.length; i += 4) {
        if (snapshot.pixels[i + 3] === 0) continue;
        if (!byColor.has(getPaletteEntryColorKey(snapshot.pixels[i], snapshot.pixels[i + 1], snapshot.pixels[i + 2]))) {
            throw new Error('The pattern contains a color outside its palette.');
        }
        beads++;
    }
    if (!beads || entries.reduce((n, item) => n + item.count, 0) !== beads) throw new Error('There are no printable beads or the color key is incomplete.');
    return { entries, byColor, beads };
}

function safeAscii(value: string) {
    return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '?');
}

function paletteFill(doc: jsPDF, r: number, g: number, b: number) {
    // Numeric RGB inputs are rounded to two decimals by jsPDF. Strings retain precision.
    // Its runtime supports three strings, while its typings only describe numeric channels 2–4.
    const setRgb = doc.setFillColor as unknown as (red: string, green: string, blue: string) => jsPDF;
    setRgb.call(doc, (r / 255).toFixed(6), (g / 255).toFixed(6), (b / 255).toFixed(6));
}

function font(doc: jsPDF, size: number, color = '#25342e') {
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color);
}

function addPrintFooter(doc: jsPDF) {
    font(doc, 8);
    doc.text(JAPANESE_PRINT_COPY.printing, 15, 258);
    doc.text(JAPANESE_PRINT_COPY.pitch, 15, 264);
    doc.setDrawColor('#25342e');
    doc.setLineWidth(0.3);
    doc.line(15, 274, 65, 274);
    doc.line(15, 272, 15, 276);
    doc.line(65, 272, 65, 276);
    doc.text(JAPANESE_PRINT_COPY.scale, 70, 275);
    font(doc, 7);
    doc.text('fusebeadpatterns.art/ja', 15, 288);
}

/** Pure PDF construction permits read-back testing without triggering a download. */
export function buildJapanesePatternPdf(snapshot: JapaneseExportSnapshot, fontBase64: string): jsPDF {
    const { entries, byColor, beads } = getJapanesePrintData(snapshot);
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    doc.addFileToVFS('FuseBeadJapanese-Regular.ttf', fontBase64);
    doc.addFont('FuseBeadJapanese-Regular.ttf', FONT_NAME, 'normal');
    doc.setProperties({ title: JAPANESE_PRINT_COPY.title, author: 'Fuse Bead Patterns', subject: '29 x 29 midi board charts at 5 mm pitch' });
    const brand = BRAND_NAMES[snapshot.paletteId];
    const inlineKey = snapshot.boardWidth === 1 && snapshot.boardHeight === 1 && entries.length <= 8;
    for (let boardY = 0; boardY < snapshot.boardHeight; boardY++) {
        for (let boardX = 0; boardX < snapshot.boardWidth; boardX++) {
            if (boardX || boardY) doc.addPage();
            font(doc, 16); doc.text(JAPANESE_PRINT_COPY.title, 15, 20);
            font(doc, 10); doc.text(`${brand} / ${snapshot.width} × ${snapshot.height} / ${beads}個 / ${entries.length}色`, 15, 29);
            doc.text(`${JAPANESE_PRINT_COPY.board} / ${boardY + 1}行 ${boardX + 1}列`, 15, 36);
            font(doc, 8); doc.text(JAPANESE_PRINT_COPY.empty, 15, 43);
            // Every board occupies exactly 145 mm; no fit-to-page scaling.
            const left = 32.5, top = 57, pitch = 5;
            for (let y = 0; y < 29; y++) {
                for (let x = 0; x < 29; x++) {
                    const index = ((boardY * 29 + y) * snapshot.width + boardX * 29 + x) * 4;
                    const [r, g, b, a] = snapshot.pixels.subarray(index, index + 4);
                    if (!a) continue;
                    const item = byColor.get(getPaletteEntryColorKey(r, g, b))!;
                    paletteFill(doc, r, g, b);
                    doc.rect(left + x * pitch, top + y * pitch, pitch, pitch, 'F');
                    font(doc, 6.5, r * 0.299 + g * 0.587 + b * 0.114 < 135 ? '#ffffff' : '#202020');
                    doc.text(item.symbol, left + (x + 0.5) * pitch, top + (y + 0.5) * pitch + 0.75, { align: 'center' });
                }
            }
            doc.setDrawColor('#9ca69f'); doc.setLineWidth(0.15);
            for (let n = 0; n <= 29; n++) {
                doc.line(left + n * pitch, top, left + n * pitch, top + 145);
                doc.line(left, top + n * pitch, left + 145, top + n * pitch);
            }
            font(doc, 6.5);
            for (let n = 0; n < 29; n++) {
                doc.text(String(boardX * 29 + n + 1), left + (n + 0.5) * pitch, top - 2.5, { align: 'center' });
                doc.text(String(boardY * 29 + n + 1), left - 2, top + (n + 0.5) * pitch + 0.75, { align: 'right' });
            }
            font(doc, 8); doc.text(JAPANESE_PRINT_COPY.caution, 15, 212);
            if (inlineKey) {
                font(doc, 9); doc.text(JAPANESE_PRINT_COPY.materials, 15, 222);
                entries.forEach(({ entry, symbol, count }, n) => {
                    const x = 15 + (n % 2) * 92, y = 230 + Math.floor(n / 2) * 6;
                    const { r, g, b } = entry.color;
                    paletteFill(doc, r, g, b); doc.setDrawColor('#adb7b0'); doc.rect(x, y - 3, 4, 4, 'FD');
                    const label = `${symbol} / ${safeAscii(entry.ref)} / ${safeAscii(entry.name)} / ${count}個`;
                    font(doc, 7);
                    if (doc.getTextWidth(label) > 79) doc.setFontSize(7 * 79 / doc.getTextWidth(label));
                    doc.text(label, x + 6, y);
                });
            }
            addPrintFooter(doc);
        }
    }
    for (let start = inlineKey ? entries.length : 0; start < entries.length; start += 24) {
        doc.addPage(); font(doc, 16); doc.text(JAPANESE_PRINT_COPY.materials, 15, 20);
        font(doc, 10); doc.text(`${brand} / ${beads}個 / ${entries.length}色`, 15, 30);
        font(doc, 8); doc.text(JAPANESE_PRINT_COPY.headers, 15, 42); doc.text(JAPANESE_PRINT_COPY.count, 192, 42, { align: 'right' });
        entries.slice(start, start + 24).forEach(({ entry, symbol, count }, row) => {
            const y = 49 + row * 7.5;
            const { r, g, b } = entry.color;
            paletteFill(doc, r, g, b); doc.setDrawColor('#adb7b0'); doc.rect(15, y - 3.5, 5, 5, 'FD');
            font(doc, 8);
            const label = `${symbol} / ${safeAscii(entry.ref)} / ${safeAscii(entry.name)}`;
            let size = 8;
            while (doc.getTextWidth(label) > 156 && size > 6) { size -= 0.5; doc.setFontSize(size); }
            doc.text(label, 24, y); font(doc, 8); doc.text(String(count), 192, y, { align: 'right' });
        });
        addPrintFooter(doc);
    }
    return doc;
}

async function makePng(snapshot: JapaneseExportSnapshot): Promise<Blob> {
    const { entries, byColor, beads } = getJapanesePrintData(snapshot);
    await document.fonts.ready;
    const cell = 20, margin = 45;
    const width = Math.max(900, snapshot.width * cell + margin * 2);
    const top = 130, gridHeight = snapshot.height * cell;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = top + gridHeight + 130 + Math.ceil(entries.length / 2) * 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable.');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#25342e'; ctx.font = 'bold 25px sans-serif'; ctx.fillText(JAPANESE_PRINT_COPY.title, margin, 38);
    ctx.font = '18px sans-serif'; ctx.fillText(`${BRAND_NAMES[snapshot.paletteId]} / ${snapshot.width} × ${snapshot.height} / ${beads}個 / ${entries.length}色`, margin, 68);
    ctx.font = '15px sans-serif'; ctx.fillText('印刷にはPDFを使用してください。この画像の印刷倍率は用紙によって変わります。', margin, 97);
    ctx.textAlign = 'center'; ctx.font = '12px sans-serif';
    for (let y = 0; y < snapshot.height; y++) for (let x = 0; x < snapshot.width; x++) {
        const i = (y * snapshot.width + x) * 4;
        const [r, g, b, a] = snapshot.pixels.subarray(i, i + 4);
        if (!a) continue;
        const item = byColor.get(getPaletteEntryColorKey(r, g, b))!;
        ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(margin + x * cell, top + y * cell, cell, cell);
        ctx.fillStyle = r * 0.299 + g * 0.587 + b * 0.114 < 135 ? '#ffffff' : '#202020';
        ctx.fillText(item.symbol, margin + (x + 0.5) * cell, top + (y + 0.5) * cell + 4);
    }
    for (let x = 0; x <= snapshot.width; x++) {
        ctx.lineWidth = x % 29 ? 1 : 2; ctx.strokeStyle = x % 29 ? '#b0b6b0' : '#25342e';
        ctx.beginPath(); ctx.moveTo(margin + x * cell, top); ctx.lineTo(margin + x * cell, top + gridHeight); ctx.stroke();
    }
    for (let y = 0; y <= snapshot.height; y++) {
        ctx.lineWidth = y % 29 ? 1 : 2; ctx.strokeStyle = y % 29 ? '#b0b6b0' : '#25342e';
        ctx.beginPath(); ctx.moveTo(margin, top + y * cell); ctx.lineTo(margin + snapshot.width * cell, top + y * cell); ctx.stroke();
    }
    ctx.fillStyle = '#25342e'; ctx.font = '11px sans-serif';
    for (let x = 0; x < snapshot.width; x++) ctx.fillText(String(x + 1), margin + (x + 0.5) * cell, top - 10);
    ctx.textAlign = 'right';
    for (let y = 0; y < snapshot.height; y++) ctx.fillText(String(y + 1), margin - 10, top + (y + 0.5) * cell + 4);
    ctx.textAlign = 'left'; ctx.font = '16px sans-serif';
    ctx.fillText(JAPANESE_PRINT_COPY.empty, margin, top + gridHeight + 32);
    ctx.fillText(JAPANESE_PRINT_COPY.materials, margin, top + gridHeight + 65);
    entries.forEach(({ entry, symbol, count }, n) => {
        const x = margin + (n % 2) * ((width - margin * 2) / 2), y = top + gridHeight + 94 + Math.floor(n / 2) * 32;
        const { r, g, b } = entry.color;
        ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(x, y - 14, 20, 20);
        ctx.strokeStyle = '#adb7b0'; ctx.lineWidth = 1; ctx.strokeRect(x, y - 14, 20, 20);
        ctx.fillStyle = '#25342e'; ctx.fillText(`${symbol} / ${entry.ref} / ${entry.name} / ${count}個`, x + 29, y, (width - margin * 2) / 2 - 40);
    });
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG encoding failed.')), 'image/png'));
}

export async function exportJapanesePattern(snapshot: JapaneseExportSnapshot, format: 'pdf' | 'png'): Promise<void> {
    const stem = snapshot.fileName.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '-').slice(0, 100) || 'bead-pattern';
    const blob = format === 'pdf'
        ? buildJapanesePatternPdf(snapshot, await loadFont()).output('blob')
        : await makePng(snapshot);
    if (!(blob instanceof Blob)) throw new Error('Pattern export failed.');
    downloadBlob(blob, `${stem}-ja.${format}`);
}
